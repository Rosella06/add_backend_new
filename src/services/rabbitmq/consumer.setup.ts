import prisma from '../../config/prisma'
import { socketService } from '../../utils/socket.service'
import { tcpService } from '../../utils/tcp.service'
import { plcService } from '../machine/plc.service'
import { updateOrderSlot, updateOrderStatus } from '../order.service'
import { rabbitService } from './rabbitmq.service'

const MAIN_EXCHANGE = 'drug_dispenser_exchange'
const DEAD_LETTER_EXCHANGE = 'drug_dispenser_dlx'
const RETRY_DELAY = 5000

export async function setupRabbitMQConsumers () {
  const channel = rabbitService.getChannel()
  const allMachines = await prisma.machines.findMany({
    where: { status: 'online' }
  })

  if (allMachines.length === 0) {
    console.warn('⚠️ No online machines found. No consumers started.')
    return
  }

  await channel.assertExchange(MAIN_EXCHANGE, 'direct', { durable: true })
  await channel.assertExchange(DEAD_LETTER_EXCHANGE, 'fanout', {
    durable: true
  })

  console.log(
    `✅ RabbitMQ Exchanges '${MAIN_EXCHANGE}' and '${DEAD_LETTER_EXCHANGE}' are ready.`
  )

  for (const machine of allMachines) {
    const machineId = machine.id
    const mainQueueName = `orders_queue_${machineId}`
    const waitQueueName = `wait_queue_${machineId}`

    await channel.prefetch(1)

    await channel.assertQueue(waitQueueName, {
      durable: true,
      messageTtl: RETRY_DELAY,
      deadLetterExchange: MAIN_EXCHANGE,
      deadLetterRoutingKey: machineId
    })
    await channel.bindQueue(waitQueueName, DEAD_LETTER_EXCHANGE, machineId)

    await channel.assertQueue(mainQueueName, {
      durable: true,
      deadLetterExchange: DEAD_LETTER_EXCHANGE,
      deadLetterRoutingKey: machineId
    })
    await channel.bindQueue(mainQueueName, MAIN_EXCHANGE, machineId)

    console.log(
      `[Consumer Setup] Machine [${machineId}]: Queues '${mainQueueName}' and '${waitQueueName}' are ready.`
    )

    channel.consume(
      mainQueueName,
      async msg => {
        if (!msg) return

        const order = JSON.parse(msg.content.toString())
        console.log(
          `[Consumer for ${machineId}] Received job for order: ${order.orderId}`
        )

        const socket = tcpService.getSocketByMachineId(machineId)

        if (!socket || socket.destroyed) {
          const reason = !socket ? 'Socket not found' : 'Socket is destroyed'
          console.error(
            `❌ [${machineId}] Cannot process. ${reason}. Rejecting message to wait queue.`
          )

          channel.nack(msg, false, false)
          return
        }

        try {
          await updateOrderStatus(order.orderId, 'pending')
          const slot = await plcService.findAvailableSlot(socket, machineId)
          await updateOrderSlot(order.orderId, slot)

          const dispensed = await plcService.dispenseDrug(socket, order, slot)

          if (dispensed) {
            await updateOrderStatus(order.orderId, 'dispensed')
            socketService
              .getIO()
              .emit('drug_dispensed', { orderId: order.orderId, slot })
            channel.ack(msg)
            console.log(
              `[Consumer for ${machineId}] Job for order ${order.orderId} completed.`
            )
          } else {
            throw new Error('PLC failed to dispense the drug.')
          }
        } catch (error) {
          console.error(
            `[Consumer for ${machineId}] CRITICAL ERROR processing order ${order.orderId}:`,
            error
          )
          channel.nack(msg, false, false)
        }
      },
      { noAck: false }
    )
  }
}
