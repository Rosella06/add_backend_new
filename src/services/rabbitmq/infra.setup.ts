import prisma from '../../config/prisma'
import { logger } from '../../utils/logger'
import StartupTimer from '../../utils/timer'
import { rabbitService } from './rabbitmq.service'

const TAG = 'RabbitMQ-Infra'
const MAIN_EXCHANGE = 'drug_dispenser_exchange'
const RETRY_DLX = 'retry_dlx'
const ERROR_DLX = 'error_dlx'
const RETRY_DELAY = 5000

export async function setupInfraForSingleMachine (
  machineId: string
): Promise<void> {
  const channel = rabbitService.getChannel()
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

  // logger.info(TAG, `Infrastructure for machine ${machineId} is ready.`)
}

export async function setupAllInitialInfrastructure (timer?: StartupTimer) {
  const channel = rabbitService.getChannel()
  // logger.info(TAG, 'Setting up RabbitMQ infrastructure for ALL machines...')

  await channel.assertExchange(MAIN_EXCHANGE, 'direct', { durable: true })
  await channel.assertExchange(RETRY_DLX, 'direct', { durable: true })
  await channel.assertExchange(ERROR_DLX, 'fanout', { durable: true })
  timer?.check(TAG, 'RabbitMQ Exchanges are ready.')

  const allMachines = await prisma.machines.findMany({ select: { id: true } })
  if (allMachines.length === 0) {
    logger.warn(TAG, 'No machines in DB. Skipping queue creation.')
    return
  }

  await Promise.all(
    allMachines.map(machine => setupInfraForSingleMachine(machine.id))
  )

  timer?.check(
    TAG,
    `Successfully set up infrastructure for ${allMachines.length} machines.`
  )
}
