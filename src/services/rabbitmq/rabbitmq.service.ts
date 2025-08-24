import * as amqplib from 'amqplib'
import { config } from '../../config'
import { logger } from '../../utils/logger'
import StartupTimer from '../../utils/timer'

class RabbitMQService {
  private connectionManager: amqplib.ChannelModel | null = null
  private channel: amqplib.Channel | null = null
  private isInitialized = false
  private isConnecting = false
  private readonly retryDelay = 5000
  private TAG = 'RabbitMQ'
  private retryAttempts = 0
  private readonly maxRetries = 5
  private readonly longRetryDelay = 30 * 60 * 1000
  private isWaitingForLongRetry = false

  public async init (timer: StartupTimer): Promise<void> {
    if (this.isInitialized || this.isConnecting || this.isWaitingForLongRetry) {
      return
    }

    this.isConnecting = true
    timer.check(this.TAG, 'Attempting to connect...')

    try {
      const rabbitConfig = config.rabbit
      this.connectionManager = await amqplib.connect(
        `amqp://${rabbitConfig.user}:${rabbitConfig.pass}@${rabbitConfig.host}:${rabbitConfig.port}`
      )

      this.channel = await this.connectionManager.createChannel()
      this.isInitialized = true
      this.isConnecting = false

      timer.check(
        this.TAG,
        'RabbitMQ Service initialized successfully. Resetting all counters.'
      )
      this.retryAttempts = 0
      this.isWaitingForLongRetry = false

      await this.onRabbitMQConnect(timer)

      this.connectionManager.on('error', (err: Error) => {
        logger.error(this.TAG, `RabbitMQ connection error: ${err.message}`)
      })

      this.connectionManager.on('close', () => {
        logger.error(
          this.TAG,
          'RabbitMQ connection closed! Attempting to re-initialize...'
        )
        this.handleDisconnection(timer)
      })
    } catch (err: any) {
      this.handleDisconnection(timer, err)
    }
  }

  private handleDisconnection (timer: StartupTimer, error?: any): void {
    if (this.isWaitingForLongRetry) {
      return
    }

    this.isInitialized = false
    this.isConnecting = false
    this.connectionManager = null
    this.channel = null

    if (error) {
      logger.error(
        this.TAG,
        `Failed to initialize RabbitMQ (${error.code || 'Unknown Error'}).`
      )
    }

    if (this.retryAttempts < this.maxRetries) {
      this.retryAttempts++
      logger.info(
        this.TAG,
        `Retrying in ${this.retryDelay / 1000} seconds... (Attempt ${
          this.retryAttempts
        }/${this.maxRetries})`
      )
      setTimeout(() => this.init(timer), this.retryDelay)
    } else {
      this.isWaitingForLongRetry = true
      const longDelayMinutes = this.longRetryDelay / (60 * 1000)
      logger.error(
        this.TAG,
        `Failed to connect after ${this.maxRetries} attempts. Will try again in ${longDelayMinutes} minutes.`
      )

      setTimeout(() => {
        logger.info(
          this.TAG,
          `Waking up after ${longDelayMinutes} minutes. Restarting connection process.`
        )

        this.isWaitingForLongRetry = false
        this.retryAttempts = 0
        this.init(timer)
      }, this.longRetryDelay)
      // พิจารณาปิดแอปพลิเคชันในกรณีนี้ เพราะ Service สำคัญไม่สามารถทำงานได้
      // process.exit(1);
    }
  }

  public getChannel (): amqplib.Channel {
    if (!this.isInitialized || !this.channel) {
      throw new Error('RabbitMQ is not initialized. Cannot get channel.')
    }
    return this.channel
  }

  public publishToExchange (
    exchange: string,
    routingKey: string,
    message: any
  ): void {
    try {
      if (!this.isReady()) {
        throw new Error('RabbitMQ is not ready to publish messages.')
      }

      const channel = this.getChannel()
      const content = Buffer.from(JSON.stringify(message))
      channel.publish(exchange, routingKey, content, { persistent: true })
      logger.info(
        this.TAG,
        `[RabbitMQ] Published to exchange '${exchange}' with key '${routingKey}'`
      )
    } catch (error) {
      logger.error(this.TAG, 'Failed to publish message:', error)
    }
  }

  public async deleteQueue (queueName: string): Promise<void> {
    try {
      const channel = this.getChannel()
      await channel.purgeQueue(queueName)
      logger.info(
        this.TAG,
        `[RabbitMQ] Successfully deleted queue: ${queueName}`
      )
    } catch (error) {
      logger.error(this.TAG, `Failed to delete queue ${queueName}:`, error)
    }
  }

  public async deleteQueueFromMachine (queueName: string): Promise<void> {
    try {
      const channel = this.getChannel()
      await channel.deleteQueue(queueName)
      logger.info(
        this.TAG,
        `[RabbitMQ] Successfully deleted queue: ${queueName}`
      )
    } catch (error) {
      logger.error(this.TAG, `Failed to delete queue ${queueName}:`, error)
    }
  }

  public async close (): Promise<void> {
    if (!this.isInitialized) {
      return
    }

    try {
      if (this.channel) {
        await this.channel.close()
      }
      if (this.connectionManager) {
        this.connectionManager.removeAllListeners()
        await this.connectionManager.close()
      }
    } catch (error) {
      logger.error(this.TAG, 'Error closing RabbitMQ connection:', error)
    } finally {
      this.isInitialized = false
      this.channel = null
      this.connectionManager = null
      logger.info(this.TAG, 'RabbitMQ connection closed.')
    }
  }

  public isReady (): boolean {
    return this.isInitialized && !!this.channel && !!this.connectionManager
  }

  private async onRabbitMQConnect (timer: StartupTimer) {
    try {
      const { setupAllInitialInfrastructure } = await import('./infra.setup')
      const { startAllInitialConsumers } = await import('./consumer.setup')
      const { setupErrorConsumers } = await import('./errorConsumer.setup')

      await setupAllInitialInfrastructure(timer)
      await startAllInitialConsumers(timer)
      await setupErrorConsumers(timer)

      timer.check(this.TAG, 'All consumers are set up and running.')
    } catch (error) {
      logger.error(
        'RabbitMQ_Manager',
        'Failed to set up consumers after connection.',
        error
      )
    }
  }
}

export const rabbitService = new RabbitMQService()
