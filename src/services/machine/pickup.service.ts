import { plcService } from './plc.service'
import { updateOrderStatus } from '../../api/services/order.service'
import { HttpError } from '../../types/global'
import { tcpService } from '../tcp/tcp.service'
import { socketService } from '../../utils/socket.service'
import systemEventEmitter, { SystemEvents } from '../../utils/system.events'
import { logger } from '../../utils/logger'

const TAG = 'PickupService'
const PICKUP_CHECK_INTERVAL = 2500
const PICKUP_TIMEOUT = 3 * 60 * 1000

class PickupService {
  private busySlots: Set<string> = new Set()

  public isSlotBusy (machineId: string, slot: 'left' | 'right'): boolean {
    const slotIdentifier = `${machineId}-${slot}`
    return this.busySlots.has(slotIdentifier)
  }

  public async initiatePickup (
    orderId: string,
    machineId: string,
    slot: 'left' | 'right'
  ): Promise<void> {
    const slotIdentifier = `${machineId}-${slot}`

    if (this.isSlotBusy(machineId, slot)) {
      throw new HttpError(
        409,
        `Pickup process for slot ${slot} on machine ${machineId} is already in progress.`
      )
    }

    const socket = tcpService.getSocketByMachineId(machineId)
    if (!socket) {
      await updateOrderStatus(orderId, 'dispensed')
      socketService.getIO().emit('drug_dispensed', {
        orderId: orderId,
        data: null,
        message: 'Update order to dispensed.'
      })
      throw new HttpError(503, `Machine ${machineId} is not connected.`)
    }

    this.busySlots.add(slotIdentifier)
    logger.debug(
      TAG,
      `Slot '${slot}' on machine ${machineId} is now BUSY for pickup.`
    )

    try {
      await plcService.openDoor(socket, machineId, slot)
      this.startPickupCompletionLoop(orderId, machineId, slot)
    } catch (error) {
      this.busySlots.delete(slotIdentifier)
      await updateOrderStatus(orderId, 'dispensed')
      socketService.getIO().emit('drug_dispensed', {
        orderId: orderId,
        data: null,
        message: 'Update order to pickup.'
      })
      logger.error(TAG, `Error initiating pickup for ${orderId}:`, error)
      throw error
    }
  }

  private startPickupCompletionLoop (
    orderId: string,
    machineId: string,
    slot: 'left' | 'right'
  ): void {
    const slotIdentifier = `${machineId}-${slot}`
    const socket = tcpService.getSocketByMachineId(machineId)

    if (!socket) {
      logger.error(
        TAG,
        `Cannot start pickup loop for ${orderId}, socket disconnected.`
      )
      this.busySlots.delete(slotIdentifier)
      return
    }

    const startTime = Date.now()
    const intervalId = setInterval(async () => {
      if (!this.busySlots.has(slotIdentifier)) {
        clearInterval(intervalId)
        return
      }

      if (Date.now() - startTime > PICKUP_TIMEOUT) {
        clearInterval(intervalId)
        this.busySlots.delete(slotIdentifier)
        logger.error(TAG, `Timeout for order ${orderId}.`)
        socketService.getIO().emit('pickup_error', {
          orderId,
          message: 'Timeout: การรับยาไม่เสร็จสิ้นใน 3 นาที'
        })
        return
      }

      try {
        const doorIsClosed = await plcService.isDoorClosed(socket, machineId)
        const trayIsEmpty = await plcService.isTrayEmpty(
          socket,
          machineId,
          slot
        )

        logger.debug(
          TAG,
          `[Loop for ${orderId}] Status: Door Closed=${doorIsClosed}, Tray Empty=${trayIsEmpty}`
        )

        if (doorIsClosed && trayIsEmpty) {
          clearInterval(intervalId)
          this.busySlots.delete(slotIdentifier)
          logger.info(
            TAG,
            `Slot '${slot}' on machine ${machineId} is now FREE.`
          )

          await updateOrderStatus(orderId, 'complete')
          await plcService.turnOffLight(socket, machineId, slot)
          socketService.getIO().emit('drug_dispensed', {
            orderId: orderId,
            data: null,
            message: 'Update order to complete.'
          })

          logger.info(
            TAG,
            `Emitting PICKUP_COMPLETED for machine: ${machineId}`
          )
          systemEventEmitter.emit(SystemEvents.PICKUP_COMPLETED, { machineId })
        }
      } catch (error) {
        logger.error(
          TAG,
          `Error in pickup completion loop for ${orderId}:`,
          error
        )
      }
    }, PICKUP_CHECK_INTERVAL)
  }
}

export const pickupService = new PickupService()
