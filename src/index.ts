import http from 'http'
import fs from 'fs'
import path from 'path'
import { app } from './app'
import { config } from './config'
import { socketService } from './utils/socket.service'
import { tcpService } from './services/tcp/tcp.service'
import { rabbitService } from './services/rabbitmq/rabbitmq.service'
import { logger } from './utils/logger'
import prisma from './config/prisma'
import StartupTimer from './utils/timer'
import {
  startConsumerForSingleMachine
  // teardownConsumerForSingleMachine
} from './services/rabbitmq/consumer.setup'
import systemEventEmitter, { SystemEvents } from './utils/system.events'

function getProjectName (): string {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8')
    return JSON.parse(packageJsonContent).name || 'unknown-app'
  } catch {
    return 'unknown-app'
  }
}

const PROJECT_NAME = getProjectName()
const TAG = 'Bootstrap'
const server = http.createServer(app)

const setupDynamicConsumerManager = () => {
  systemEventEmitter.on(
    SystemEvents.MACHINE_ONLINE,
    async (data: { machineId: string }) => {
      logger.info(
        TAG,
        `Received MACHINE_ONLINE event for ${data.machineId}. Setting up consumer...`
      )
      try {
        await startConsumerForSingleMachine(data.machineId)
      } catch (error) {
        logger.error(
          TAG,
          `Failed to dynamically set up consumer for ${data.machineId}.`,
          error
        )
      }
    }
  )

  // systemEventEmitter.on(
  //   SystemEvents.MACHINE_OFFLINE,
  //   async (data: { machineId: string }) => {
  //     logger.info(
  //       TAG,
  //       `Received MACHINE_OFFLINE event for ${data.machineId}. Tearing down consumer...`
  //     )
  //     try {
  //       await teardownConsumerForSingleMachine(data.machineId)
  //     } catch (error) {
  //       logger.error(
  //         TAG,
  //         `Failed to dynamically tear down consumer for ${data.machineId}.`,
  //         error
  //       )
  //     }
  //   }
  // )
}

const startServer = async () => {
  const timer = new StartupTimer()

  logger.separator(`STARTED (PID: ${process.pid}) for package ${PROJECT_NAME}`)

  try {
    await prisma.$connect()
    timer.check(TAG, 'Database connection successful.')

    await tcpService.initialize(config.tcpPort, timer)

    await new Promise<void>(resolve => {
      server.listen(config.port, () => {
        timer.check(TAG, `Server is running on http://localhost:${config.port}`)
        socketService.initialize(server, timer)
        resolve()
      })
    })

    await rabbitService.init(timer)

    setupDynamicConsumerManager()

    timer.total(TAG, 'All services are ready.')
  } catch (error: any) {
    if (error.code && error.code.startsWith('P')) {
      logger.error(TAG, '❌ Failed to connect to the database:', error)
    } else {
      logger.error(TAG, '❌ Failed to start critical services:', error)
    }

    logger.separator(
      `ENDED ABNORMALLY (PID: ${process.pid}) for package ${PROJECT_NAME}`
    )
    process.exit(1)
  }
}

startServer()

const gracefulShutdown = async (signal: string) => {
  logger.warn(TAG, `Received ${signal}. Starting graceful shutdown...`)

  const forceShutdownTimeout = setTimeout(() => {
    logger.error(TAG, 'Could not close connections in time, forcing shutdown.')
    logger.separator(
      `ENDED ABNORMALLY (PID: ${process.pid}) for package ${PROJECT_NAME}`
    )
    process.exit(1)
  }, 10000)

  server.close(async () => {
    logger.info(TAG, 'HTTP server closed.')

    await rabbitService.close()
    await prisma.$disconnect()

    logger.separator(
      `ENDED GRACEFULLY (PID: ${process.pid}) for package ${PROJECT_NAME}`
    )

    clearTimeout(forceShutdownTimeout)
    process.exit(0)
  })
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
