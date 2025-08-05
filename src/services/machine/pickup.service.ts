import { tcpService } from '../../utils/tcp.service'
import { plcService } from './plc.service'
import { updateOrderStatus } from '../order.service'
import { socketService } from '../../utils/socket.service'
import { HttpError } from '../../types/global'
import systemEventEmitter, { SystemEvents } from '../../utils/system.events'

const DOOR_CHECK_INTERVAL = 2000
const PICKUP_TIMEOUT = 3 * 60 * 1000

class PickupService {
  private waitingForDoorClose: Set<string> = new Set()

  public async initiatePickup (
    orderId: string,
    machineId: string,
    slot: string
  ): Promise<void> {
    if (this.waitingForDoorClose.has(orderId)) {
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

    this.waitingForDoorClose.add(orderId)
    console.log(
      `[Pickup Service] Initiating for Order: ${orderId} at Slot: ${slot}`
    )

    try {
      await plcService.openDoor(socket, machineId, slot as 'left' | 'right')
      this.startDoorCheckLoop(orderId, machineId, slot)
    } catch (error) {
      this.waitingForDoorClose.delete(orderId)
      await updateOrderStatus(orderId, 'dispensed')
      console.error(
        `[Pickup Service] Error initiating pickup for ${orderId}:`,
        error
      )
      throw error
    }
  }

  private startDoorCheckLoop (
    orderId: string,
    machineId: string,
    slot: string
  ): void {
    const startTime = Date.now()
    const socket = tcpService.getSocketByMachineId(machineId)
    if (!socket) {
      console.error(
        `Cannot start door check loop for ${orderId}, socket disconnected.`
      )
      this.waitingForDoorClose.delete(orderId)
      return
    }

    const intervalId = setInterval(async () => {
      if (!this.waitingForDoorClose.has(orderId)) {
        clearInterval(intervalId)
        return
      }

      if (Date.now() - startTime > PICKUP_TIMEOUT) {
        clearInterval(intervalId)
        this.waitingForDoorClose.delete(orderId)
        console.error(`[Pickup Service] Timeout for order ${orderId}.`)
        socketService.getIO().emit('pickup_error', {
          orderId,
          message: 'Timeout: ประตูไม่ได้ปิดภายใน 3 นาที'
        })
        return
      }

      try {
        const isClosed = await plcService.isDoorClosed(socket, machineId)
        if (isClosed) {
          clearInterval(intervalId)
          this.waitingForDoorClose.delete(orderId)
          console.log(
            `[Pickup Service] Door closed for order ${orderId}. Finalizing...`
          )

          await updateOrderStatus(orderId, 'complete')
          await plcService.turnOffLight(
            socket,
            machineId,
            slot as 'left' | 'right'
          )
          socketService.getIO().emit('pickup_complete', { orderId })
          console.log(
            `[Event] Emitting PICKUP_COMPLETED for machine: ${machineId}`
          )
          systemEventEmitter.emit(SystemEvents.PICKUP_COMPLETED, { machineId })
        }
      } catch (error) {
        console.error(
          `[Pickup Service] Error in door check loop for ${orderId}:`,
          error
        )
      }
    }, DOOR_CHECK_INTERVAL)
  }
}

export const pickupService = new PickupService()
