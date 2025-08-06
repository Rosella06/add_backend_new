import http from 'http'
import { app } from './app'
import { config } from './config'
import { socketService } from './utils/socket.service'
import { tcpService } from './utils/tcp.service'
import { rabbitService } from './services/rabbitmq/rabbitmq.service'
import { logger } from './utils/logger'
const TAG = "SERVER"

const server = http.createServer(app)

const startServer = async () => {
  try {
    // 1. Initialize TCP Server (ส่วนนี้ยังควรจะ await เพราะสำคัญ)
    await tcpService.initialize(config.tcpPort)

    // 2. Initialize Socket.IO
    socketService.initialize(server)

    // 3. Start HTTP Server (ย้ายมาทำก่อน RabbitMQ)
    server.listen(config.port, () => {
      logger.info(TAG, `✅ Server is running on http://localhost:${config.port}`)
      logger.info(TAG,'API, TCP, and Socket.IO are ready.')
    })

    // 4. Initialize RabbitMQ Connection (แบบไม่ block)
    // เราแค่ "จุดไฟ" ให้มันเริ่มทำงาน แล้วมันจะจัดการตัวเองในเบื้องหลัง
    rabbitService.init()
  } catch (error) {
    // catch block นี้จะทำงานก็ต่อเมื่อ TCP Server ล้มเหลวเท่านั้น
    logger.error(TAG,'❌ Failed to start critical services (TCP Server):', error)
    process.exit(1)
  }
}

startServer()
