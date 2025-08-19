import { rabbitService } from './rabbitmq.service'
import { logFailedJob } from '../error.service'
import prisma from '../../config/prisma'
import { logger } from '../../utils/logger'
import StartupTimer from '../../utils/timer'

const TAG = 'ErrorConsumer'

export async function setupErrorConsumers (timer: StartupTimer) {
  const channel = rabbitService.getChannel()
  const allMachines = await prisma.machines.findMany({ select: { id: true } })

  if (allMachines.length === 0) {
    return
  }

  timer.check(
    TAG,
    `Setting up error consumers for ${allMachines.length} machines...`
  )

  let successCount = 0

  await Promise.all(
    allMachines.map(async machine => {
      try {
        const machineId = machine.id
        const errorQueueName = `error_queue_${machineId}`

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

        successCount++
      } catch (error) {
        logger.error(
          TAG,
          `Failed to setup error consumer for machine ${machine.id}`,
          error
        )
      }
    })
  )

  if (successCount > 0) {
    timer.check(TAG, `Successfully set up ${successCount} error consumers.`)
  }

  if (successCount < allMachines.length) {
    logger.error(
      TAG,
      `Failed to set up ${allMachines.length - successCount} error consumers.`
    )
  }
}
