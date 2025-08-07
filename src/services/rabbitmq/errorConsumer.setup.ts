import { rabbitService } from './rabbitmq.service'
import { logFailedJob } from '../error.service'
import prisma from '../../config/prisma'
import { logger } from '../../utils/logger'

const TAG = 'ErrorConsumer'
const ERROR_DLX = 'error_dlx'

export async function setupErrorConsumers () {
  const channel = rabbitService.getChannel()
  const allMachines = await prisma.machines.findMany({ select: { id: true } })

  logger.info(
    TAG,
    `Setting up error consumers for ${allMachines.length} machines...`
  )

  for (const machine of allMachines) {
    const machineId = machine.id
    const errorQueueName = `error_queue_${machine.id}`

    channel.consume(
      errorQueueName,
      async msg => {
        if (!msg) return

        logger.warn(
          TAG,
          `Received a message from error queue: ${errorQueueName}`
        )

        try {
          const orderPayload = JSON.parse(msg.content.toString())

          const error = new Error(
            'This job failed in the main consumer and was moved to the error queue.'
          )

          await logFailedJob({
            queueName: `orders_queue_${machineId}`,
            error: error,
            payload: orderPayload
          })

          channel.ack(msg)
        } catch (consumeError) {
          logger.error(
            TAG,
            `Error while processing a message from ${errorQueueName}. Message will be rejected and may re-queue.`,
            consumeError
          )
          channel.nack(msg, false, true)
        }
      },
      { noAck: false }
    )
  }
}
