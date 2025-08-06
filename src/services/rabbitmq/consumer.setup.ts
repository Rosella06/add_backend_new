import prisma from '../../config/prisma'
import { socketService } from '../../utils/socket.service'
import { tcpService } from '../../utils/tcp.service'
import { plcService } from '../machine/plc.service'
import { updateOrderSlot, updateOrderStatus } from '../order.service'
import { rabbitService } from './rabbitmq.service'
import { logger } from '../../utils/logger'
import { delay } from '../../utils/system.events'
import { pickupService } from '../machine/pickup.service'

const TAG = 'CONSUMER-SETUP'

const MAIN_EXCHANGE = 'drug_dispenser_exchange'
const RETRY_DLX = 'retry_dlx'
const ERROR_DLX = 'error_dlx'
const RETRY_DELAY = 5000

export async function setupRabbitMQConsumers () {
  const channel = rabbitService.getChannel()
  const allMachines = await prisma.machines.findMany({
    where: { status: 'online' }
  })

  if (allMachines.length === 0) {
    logger.error(TAG, 'No online machines found. No consumers will be started.')
    return
  }

  await channel.assertExchange(MAIN_EXCHANGE, 'direct', { durable: true })
  await channel.assertExchange(RETRY_DLX, 'fanout', { durable: true })
  await channel.assertExchange(ERROR_DLX, 'fanout', { durable: true })
  logger.info(TAG, `RabbitMQ Exchanges are ready.`)

  for (const machine of allMachines) {
    const machineId = machine.id
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
    logger.info(
      TAG,
      `[Consumer Setup] Machine [${machineId}]: Consumer ready for queue '${mainQueueName}'.`
    )

    channel.consume(
      mainQueueName,
      async msg => {
        if (!msg) return

        const order = JSON.parse(msg.content.toString())
        logger.debug(
          TAG,
          `[Consumer for ${machineId}] Received job for order: ${order.orderId}`
        )

        try {
          const socket = tcpService.getSocketByMachineId(machineId)
          if (!socket || socket.destroyed) {
            throw new Error('Socket not connected')
          }

          const slot = await plcService.findAvailableSlot(socket, machineId)

          if (pickupService.isSlotBusy(machineId, slot)) {
            throw new Error(`Target slot (${slot}) is locked for pickup.`)
          }

          await updateOrderStatus(order.orderId, 'pending')
          const slotIdentifier = slot === 'right' ? 'M01' : 'M02'
          await updateOrderSlot(order.orderId, slotIdentifier)

          const dispensed = await plcService.dispenseDrug(socket, order, slot)

          if (dispensed) {
            await updateOrderStatus(order.orderId, 'dispensed')
            socketService.getIO().emit('drug_dispensed', {
              orderId: order.orderId,
              slot: slotIdentifier
            })
            channel.ack(msg)
            logger.debug(
              TAG,
              `[Consumer for ${machineId}] Job for order ${order.orderId} completed and acknowledged.`
            )
            logger.debug(
              TAG,
              `   -> Applying 500ms cooldown period before next job.`
            )
            await delay(500)
          } else {
            throw new Error('Dispense-failed-non-92')
          }
        } catch (error) {
          const errorMessage = (error as Error).message
          logger.error(
            TAG,
            `[Consumer for ${machineId}] Failed job for order ${order.orderId}: ${errorMessage}`
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
              TAG,
              `   -> Sending to retry queue for ${RETRY_DELAY / 1000}s.`
            )
            channel.publish(RETRY_DLX, machineId, msg.content, {
              persistent: true
            })
            channel.ack(msg)
          } else {
            logger.error(TAG, `   -> Sending to error queue permanently.`)
            await updateOrderStatus(order.orderId, 'error')
            channel.publish(ERROR_DLX, machineId, msg.content, {
              persistent: true
            })
            channel.ack(msg)
          }
        }
      },
      { noAck: false }
    )
  }
}
