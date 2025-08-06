import * as amqplib from 'amqplib'
import { config } from '../../config'
import { logger } from '../../utils/logger'

class RabbitMQService {
  private connectionManager: amqplib.ChannelModel | null = null
  private channel: amqplib.Channel | null = null
  private isInitialized = false
  private isConnecting = false
  private readonly retryDelay = 5000
  private TAG = 'RabbitMQ'

  public async init (): Promise<void> {
    if (this.isInitialized || this.isConnecting) {
      return
    }

    this.isConnecting = true
    logger.info(this.TAG, 'Attempting to connect...')

    try {
      const rabbitConfig = config.rabbit
      this.connectionManager = await amqplib.connect(
        `amqp://${rabbitConfig.user}:${rabbitConfig.pass}@${rabbitConfig.host}:${rabbitConfig.port}`
      )

      this.channel = await this.connectionManager.createChannel()
      this.isInitialized = true
      this.isConnecting = false
      logger.info(this.TAG, 'RabbitMQ Service initialized')

      const { setupRabbitMQConsumers } = await import('./consumer.setup')
      await setupRabbitMQConsumers()

      this.connectionManager.on('error', (err: Error) => {
        logger.error(this.TAG, `RabbitMQ connection error: ${err.message}`)
      })

      this.connectionManager.on('close', () => {
        logger.error(this.TAG, 'RabbitMQ connection closed! Re-initializing...')
        this.isInitialized = false
        this.connectionManager = null
        this.channel = null
        setTimeout(() => this.init(), this.retryDelay)
      })
    } catch (err: any) {
      this.isConnecting = false
      logger.error(
        this.TAG,
        `Failed to initialize RabbitMQ (${err.code}). Retrying in ${
          this.retryDelay / 1000
        } seconds...`
      )

      setTimeout(() => this.init(), this.retryDelay)
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
}

export const rabbitService = new RabbitMQService()
