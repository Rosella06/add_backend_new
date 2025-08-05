import prisma from '../../config/prisma'
import { socketService } from '../../utils/socket.service'
import { tcpService } from '../../utils/tcp.service'
import { plcService } from '../machine/plc.service'
import { updateOrderSlot, updateOrderStatus } from '../order.service'
import { rabbitService } from './rabbitmq.service'
import systemEventEmitter, { SystemEvents } from '../../utils/system.events'

const machineAwaitingSlot: Map<string, boolean> = new Map()

const MAIN_EXCHANGE = 'drug_dispenser_exchange'
const ERROR_DLX = 'error_dlx'

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
  await channel.assertExchange(ERROR_DLX, 'fanout', { durable: true })
  console.log(
    `✅ RabbitMQ Exchanges '${MAIN_EXCHANGE}' and '${ERROR_DLX}' are ready.`
  )

  systemEventEmitter.on(
    SystemEvents.PICKUP_COMPLETED,
    (data: { machineId: string }) => {
      const { machineId } = data

      if (machineAwaitingSlot.get(machineId)) {
        console.log(
          `[Event Listener] Pickup completed on ${machineId}. Waking up paused consumer.`
        )

        machineAwaitingSlot.set(machineId, false)

        const wakeupMessage = { type: 'WAKE_UP', reason: 'Slot freed' }
        channel.sendToQueue(
          `orders_queue_${machineId}`,
          Buffer.from(JSON.stringify(wakeupMessage))
        )
      }
    }
  )

  for (const machine of allMachines) {
    const machineId = machine.id
    const mainQueueName = `orders_queue_${machineId}`
    const errorQueueName = `error_queue_${machineId}`

    await channel.assertQueue(errorQueueName, { durable: true })
    await channel.bindQueue(errorQueueName, ERROR_DLX, machineId)

    await channel.assertQueue(mainQueueName, {
      durable: true,
      deadLetterExchange: ERROR_DLX,
      deadLetterRoutingKey: machineId
    })
    await channel.bindQueue(mainQueueName, MAIN_EXCHANGE, machineId)

    await channel.prefetch(1)

    console.log(
      `[Consumer Setup] Machine [${machineId}]: Consumer ready for queue '${mainQueueName}'.`
    )

    channel.consume(
      mainQueueName,
      async msg => {
        if (!msg) return

        const content = JSON.parse(msg.content.toString())
        if (content.type === 'WAKE_UP') {
          console.log(
            `[Consumer for ${machineId}] Received wake-up call. Ready for next job.`
          )
          channel.ack(msg)
          return
        }

        const order = content
        console.log(
          `[Consumer for ${machineId}] Received job for order: ${order.orderId}`
        )

        if (machineAwaitingSlot.get(machineId)) {
          console.warn(
            `[Consumer for ${machineId}] Is in AWAITING_SLOT state. Re-queueing job for order ${order.orderId}.`
          )
          channel.nack(msg, false, true)
          return
        }

        const socket = tcpService.getSocketByMachineId(machineId)
        if (!socket || socket.destroyed) {
          console.error(
            `❌ [${machineId}] Socket not connected. Nacking to error queue.`
          )
          channel.nack(msg, false, false)
          return
        }

        try {
          const slot = await plcService.findAvailableSlot(socket, machineId)

          await updateOrderStatus(order.orderId, 'pending')
          const slotIdentifier = slot === 'right' ? 'M01' : 'M02'
          await updateOrderSlot(order.orderId, slotIdentifier)

          const dispensed = await plcService.dispenseDrug(socket, order, slot)

          if (dispensed) {
            await updateOrderStatus(order.orderId, 'dispensed')
            socketService
              .getIO()
              .emit('drug_dispensed', {
                orderId: order.orderId,
                slot: slotIdentifier
              })

            channel.ack(msg)
            console.log(
              `[Consumer for ${machineId}] Job for order ${order.orderId} completed and acknowledged.`
            )
          } else {
            throw new Error(
              'PLC failed to dispense the drug (did not return T92).'
            )
          }
        } catch (error) {
          const errorMessage = (error as Error).message

          if (errorMessage.includes('Tray is full')) {
            console.warn(
              `[Consumer for ${machineId}] Tray is full. Pausing and waiting for a slot to be freed.`
            )

            machineAwaitingSlot.set(machineId, true)

            channel.nack(msg, false, true)
          } else {
            console.error(
              `[Consumer for ${machineId}] CRITICAL ERROR processing order ${order.orderId}:`,
              errorMessage
            )
            await updateOrderStatus(order.orderId, 'error')

            channel.nack(msg, false, false)
          }
        }
      },
      { noAck: false }
    )
  }
}
