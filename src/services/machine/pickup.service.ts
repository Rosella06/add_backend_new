import { plcService } from './plc.service'
import { updateOrderStatus } from '../order.service'
import { HttpError } from '../../types/global'
import { tcpService } from '../../utils/tcp.service'
import { socketService } from '../../utils/socket.service'
import systemEventEmitter, { SystemEvents } from '../../utils/system.events'
import { logger } from '../../utils/logger'

const PICKUP_CHECK_INTERVAL = 2500
const PICKUP_TIMEOUT = 3 * 60 * 1000
const TAG = 'PICKUP-SERVICE'

class PickupService {
  private waitingForPickupCompletion: Set<string> = new Set()

  public async initiatePickup (
    orderId: string,
    machineId: string,
    slot: 'left' | 'right'
  ): Promise<void> {
    if (this.waitingForPickupCompletion.has(orderId)) {
      throw new HttpError(
        409,
        `Pickup process for order ${orderId} is already in progress.`
      )
    }

    const socket = tcpService.getSocketByMachineId(machineId)
    if (!socket) {
      await updateOrderStatus(orderId, 'dispensed')
      throw new HttpError(503, `Machine ${machineId} is not connected.`)
    }

    this.waitingForPickupCompletion.add(orderId)
    logger.debug(
      TAG,
      `[Pickup Service] Initiating for Order: ${orderId} at Slot: ${slot}`
    )

    try {
      await plcService.openDoor(socket, machineId, slot)
      this.startPickupCompletionLoop(orderId, machineId, slot)
    } catch (error) {
      this.waitingForPickupCompletion.delete(orderId)
      await updateOrderStatus(orderId, 'dispensed')
      logger.error(TAG,
        `[Pickup Service] Error initiating pickup for ${orderId}:`,
        error
      )
      throw error
    }
  }

  private startPickupCompletionLoop (
    orderId: string,
    machineId: string,
    slot: 'left' | 'right'
  ): void {
    const startTime = Date.now()
    const socket = tcpService.getSocketByMachineId(machineId)
    if (!socket) {
      logger.error(TAG,
        `Cannot start pickup loop for ${orderId}, socket disconnected.`
      )
      this.waitingForPickupCompletion.delete(orderId)
      return
    }

    const intervalId = setInterval(async () => {
      if (!this.waitingForPickupCompletion.has(orderId)) {
        clearInterval(intervalId)
        return
      }

      if (Date.now() - startTime > PICKUP_TIMEOUT) {
        clearInterval(intervalId)
        this.waitingForPickupCompletion.delete(orderId)
        logger.error(TAG,`[Pickup Service] Timeout for order ${orderId}.`)
        socketService.getIO().emit('pickup_error', {
          orderId,
          message: 'Timeout: การรับยาไม่เสร็จสิ้นใน 3 นาที'
        })
        return
      }

      try {
        logger.debug(TAG, `[Pickup Loop for ${orderId}] Checking conditions...`)
        const doorIsClosed = await plcService.isDoorClosed(socket, machineId)
        const trayIsEmpty = await plcService.isTrayEmpty(
          socket,
          machineId,
          slot
        )

        logger.debug(
          TAG,
          `[Pickup Loop for ${orderId}] Status: Door Closed = ${doorIsClosed}, Tray Empty = ${trayIsEmpty}.`
        )

        if (doorIsClosed && trayIsEmpty) {
          clearInterval(intervalId)
          this.waitingForPickupCompletion.delete(orderId)

          logger.debug(
            TAG,
            `[Pickup Service] Pickup for order ${orderId} is complete (Door Closed & Tray Empty). Finalizing...`
          )

          await updateOrderStatus(orderId, 'complete')
          await plcService.turnOffLight(socket, machineId, slot)
          socketService.getIO().emit('pickup_complete', { orderId })

          logger.debug(
            TAG,
            `[Event] Emitting PICKUP_COMPLETED for machine: ${machineId}`
          )
          systemEventEmitter.emit(SystemEvents.PICKUP_COMPLETED, { machineId })
        }
      } catch (error) {
        logger.error(TAG,
          `[Pickup Service] Error in pickup completion loop for ${orderId}:`,
          error
        )
      }
    }, PICKUP_CHECK_INTERVAL)
  }
}

export const pickupService = new PickupService()
