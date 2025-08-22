import prisma from '../../config/prisma'
import { socketService } from '../../utils/socket.service'
import { tcpService } from '../tcp/tcp.service'
import { plcService } from '../machine/plc.service'
import {
  updateOrderSlot,
  updateOrderStatus
} from '../../api/services/order.service'
import { rabbitService } from './rabbitmq.service'
import { logger } from '../../utils/logger'
import { delay } from '../../utils/system.events'
import { pickupService } from '../machine/pickup.service'
import { SocketPayload } from '../../types/order'
import StartupTimer from '../../utils/timer'

const TAG = 'CONSUMER-SETUP'
const RETRY_DLX = 'retry_dlx'
const ERROR_DLX = 'error_dlx'
const RETRY_DELAY = 1500

const activeConsumers = new Map<string, string>()

export async function startConsumerForSingleMachine (
  machineId: string
): Promise<void> {
  if (activeConsumers.has(machineId)) {
    logger.warn(TAG, `Consumer for machine ${machineId} is already running.`)
    return
  }
  const channel = rabbitService.getChannel()
  const mainQueueName = `orders_queue_${machineId}`
  try {
    await channel.prefetch(1)
    const { consumerTag } = await channel.consume(
      mainQueueName,
      async msg => {
        if (!msg) return
        const order: SocketPayload = JSON.parse(msg.content.toString())
        try {
          const socket = tcpService.getSocketByMachineId(machineId)
          if (!socket || socket.destroyed)
            throw new Error('Socket not connected')
          const slot = await plcService.findAvailableSlot(socket, machineId)
          if (pickupService.isSlotBusy(machineId, slot))
            throw new Error(`Target slot (${slot}) is locked for pickup.`)
          await updateOrderStatus(order.orderId, 'pending')
          const slotIdentifier = slot === 'right' ? 'M01' : 'M02'
          await updateOrderSlot(order.orderId, slotIdentifier)
          const socketClient = socketService.getSocketById(order.socketId)
          if (socketClient) {
            socketClient.emit('drug_dispensed', {
              orderId: order.orderId,
              data: { slot: slotIdentifier },
              message: 'Update order to pending.'
            })
          }
          const dispensed = await plcService.dispenseDrug(socket, order, slot)
          if (dispensed) {
            await updateOrderStatus(order.orderId, 'dispensed')
            if (socketClient) {
              socketClient.emit('drug_dispensed', {
                orderId: order.orderId,
                data: { slot: slotIdentifier },
                message: 'Update order to dispensed.'
              })
            }
            channel.ack(msg)
            await delay(500)
          } else {
            throw new Error('Dispense-failed-non-92')
          }
        } catch (error) {
          const errorMessage = (error as Error).message
          if (process.env.NODE_ENV === 'development') {
            logger.error(
              `Consumer-${machineId}`,
              `Failed job for order ${order.orderId}`,
              error
            )
          }
          if (
            errorMessage.includes('Tray is full') ||
            errorMessage.includes('Socket not connected') ||
            errorMessage.includes('Timeout waiting for response') ||
            errorMessage.includes('is locked for pickup') ||
            errorMessage.includes('Dispense-failed-non-92') ||
            errorMessage.includes('Dispense process timed out')
          ) {
            if (process.env.NODE_ENV === 'development') {
              logger.warn(
                `Consumer-${machineId}`,
                `-> Sending to retry queue for ${RETRY_DELAY / 1000}s.`
              )
            }
            channel.publish(RETRY_DLX, machineId, msg.content, {
              persistent: true
            })
            channel.ack(msg)
          } else {
            const order: SocketPayload = JSON.parse(msg.content.toString())
            const socketClient = socketService.getSocketById(order.socketId)
            logger.error(
              `Consumer-${machineId}`,
              `-> Sending to error queue permanently.`
            )
            await updateOrderStatus(order.orderId, 'error')
            channel.publish(ERROR_DLX, machineId, msg.content, {
              persistent: true
            })
            channel.ack(msg)
            if (socketClient) {
              socketClient.emit('drug_dispensed', {
                orderId: order.orderId,
                data: null,
                message: 'Update order to error.'
              })
            }
          }
        }
      },
      { noAck: false }
    )
    activeConsumers.set(machineId, consumerTag)
  } catch (error) {
    logger.error(
      TAG,
      `Failed to start consumer for queue '${mainQueueName}'.`,
      error
    )
    throw error
  }
}

export async function startAllInitialConsumers (timer?: StartupTimer) {
  // logger.info(TAG, 'Starting initial consumers for all online machines...')
  const onlineMachines = await prisma.machines.findMany({
    where: { status: 'online' }
  })
  if (onlineMachines.length === 0) {
    logger.warn(TAG, 'No online machines found to start consumers.')
    return
  }
  let successCount = 0
  await Promise.all(
    onlineMachines.map(async machine => {
      try {
        await startConsumerForSingleMachine(machine.id)
        successCount++
      } catch (error) {
        logger.error(
          TAG,
          `Failed to start consumer for machine ${machine.id}`,
          error
        )
      }
    })
  )
  if (successCount > 0) {
    timer?.check(TAG, `Successfully started ${successCount} main consumers.`)
  }
  if (successCount < onlineMachines.length) {
    logger.error(
      TAG,
      `Failed to set up ${onlineMachines.length - successCount} main consumers.`
    )
  }
}

// export async function teardownConsumerForSingleMachine (
//   machineId: string
// ): Promise<void> {
//   if (activeConsumers.has(machineId)) {
//     const channel = rabbitService.getChannel()
//     const consumerTag = activeConsumers.get(machineId)!
//     try {
//       logger.warn(
//         TAG,
//         `Tearing down consumer for machine ${machineId} (tag: ${consumerTag})...`
//       )
//       await channel.cancel(consumerTag)
//       activeConsumers.delete(machineId)
//       logger.info(
//         TAG,
//         `Successfully tore down consumer for machine ${machineId}.`
//       )
//     } catch (error) {
//       logger.error(
//         TAG,
//         `Failed to tear down consumer for machine ${machineId}.`,
//         error
//       )
//     }
//   } else {
//     logger.warn(
//       TAG,
//       `Attempted to tear down a non-existent consumer for machine ${machineId}.`
//     )
//   }
// }
