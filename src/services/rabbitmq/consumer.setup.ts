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

const TAG = 'CONSUMER-SETUP'

const MAIN_EXCHANGE = 'drug_dispenser_exchange'
const RETRY_DLX = 'retry_dlx'
const ERROR_DLX = 'error_dlx'
const RETRY_DELAY = 1500

const activeConsumers = new Map<string, string>()

export async function setupConsumerForSingleMachine (machineId: string) {
  const channel = rabbitService.getChannel()

  await channel.assertExchange(MAIN_EXCHANGE, 'direct', { durable: true })
  await channel.assertExchange(RETRY_DLX, 'fanout', { durable: true })
  await channel.assertExchange(ERROR_DLX, 'fanout', { durable: true })

  const mainQueueName = `orders_queue_${machineId}`
  const retryQueueName = `retry_queue_${machineId}`
  const errorQueueName = `error_queue_${machineId}`

  await channel.assertQueue(retryQueueName, {
    durable: true,
    messageTtl: RETRY_DELAY,
    deadLetterExchange: MAIN_EXCHANGE,
    deadLetterRoutingKey: machineId
  })
  await channel.bindQueue(retryQueueName, RETRY_DLX, machineId)

  await channel.assertQueue(errorQueueName, { durable: true })
  await channel.bindQueue(errorQueueName, ERROR_DLX, machineId)

  await channel.assertQueue(mainQueueName, { durable: true })
  await channel.bindQueue(mainQueueName, MAIN_EXCHANGE, machineId)

  await channel.prefetch(1)

  channel.consume(
    mainQueueName,
    async msg => {
      if (!msg) return
      const order = JSON.parse(msg.content.toString())

      try {
        const socket = tcpService.getSocketByMachineId(machineId)
        if (!socket || socket.destroyed) throw new Error('Socket not connected')

        const slot = await plcService.findAvailableSlot(socket, machineId)
        if (pickupService.isSlotBusy(machineId, slot))
          throw new Error(`Target slot (${slot}) is locked for pickup.`)

        await updateOrderStatus(order.orderId, 'pending')
        const slotIdentifier = slot === 'right' ? 'M01' : 'M02'
        await updateOrderSlot(order.orderId, slotIdentifier)
        socketService.getIO().emit('drug_dispensed', {
          orderId: order.orderId,
          data: {
            slot: slotIdentifier
          },
          message: 'Update order to pending.'
        })

        const dispensed = await plcService.dispenseDrug(socket, order, slot)

        if (dispensed) {
          await updateOrderStatus(order.orderId, 'dispensed')
          socketService.getIO().emit('drug_dispensed', {
            orderId: order.orderId,
            data: {
              slot: slotIdentifier
            },
            message: 'Update order to dispensed.'
          })
          channel.ack(msg)
          await delay(500)
        } else {
          throw new Error('Dispense-failed-non-92')
        }
      } catch (error) {
        const errorMessage = (error as Error).message
        logger.error(
          `Consumer-${machineId}`,
          `Failed job for order ${order.orderId}`,
          error
        )

        if (
          errorMessage.includes('Tray is full') ||
          errorMessage.includes('Socket not connected') ||
          errorMessage.includes('Timeout waiting for response') ||
          errorMessage.includes('is locked for pickup') ||
          errorMessage.includes('Dispense-failed-non-92') ||
          errorMessage.includes('Dispense process timed out')
        ) {
          logger.warn(
            `Consumer-${machineId}`,
            `-> Sending to retry queue for ${RETRY_DELAY / 1000}s.`
          )
          channel.publish(RETRY_DLX, machineId, msg.content, {
            persistent: true
          })
          channel.ack(msg)
        } else {
          logger.error(
            `Consumer-${machineId}`,
            `-> Sending to error queue permanently.`
          )
          await updateOrderStatus(order.orderId, 'error')
          channel.publish(ERROR_DLX, machineId, msg.content, {
            persistent: true
          })
          channel.ack(msg)
          socketService.getIO().emit('drug_dispensed', {
            orderId: order.orderId,
            data: null,
            message: 'Update order to error.'
          })
        }
      }
    },
    { noAck: false }
  )
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

export async function setupAllInitialConsumers () {
  logger.info(TAG, 'Setting up initial consumers for all online machines...')
  const channel = rabbitService.getChannel()

  await channel.assertExchange(MAIN_EXCHANGE, 'direct', { durable: true })
  await channel.assertExchange(RETRY_DLX, 'fanout', { durable: true })
  await channel.assertExchange(ERROR_DLX, 'fanout', { durable: true })
  logger.info(TAG, 'RabbitMQ Exchanges are ready.')

  const allMachines = await prisma.machines.findMany({
    where: { status: 'online' }
  })

  if (allMachines.length === 0) {
    logger.warn(TAG, 'No online machines found to start initial consumers.')
    return
  }

  let successCount = 0
  await Promise.all(
    allMachines.map(async machine => {
      try {
        await setupConsumerForSingleMachine(machine.id)
        successCount++
      } catch (error) {
        logger.error(
          TAG,
          `Failed to set up consumer for machine ${machine.id}`,
          error
        )
      }
    })
  )

  if (successCount > 0) {
    logger.info(TAG, `Successfully set up ${successCount} main consumers.`)
  }
  if (successCount < allMachines.length) {
    logger.error(
      TAG,
      `Failed to set up ${
        allMachines.length - successCount
      } main consumers. Please check logs for details.`
    )
  }
}
