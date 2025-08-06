import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { logger } from '../utils/logger'

class SocketService {
  private io: SocketIOServer | null = null
  private TAG = "[SOCKET]"

  public initialize (server: HTTPServer): void {
    if (this.io) return

    this.io = new SocketIOServer(server, {
      cors: { origin: '*', methods: ['GET', 'POST'] }
    })

    this.io.on('connection', (socket: Socket) => {
      logger.info(this.TAG, `✅ Socket.IO: User connected ${socket.id}`)
      socket.on('disconnect', () => {
        logger.info(this.TAG, `Socket.IO: User disconnected ${socket.id}`)
      })
    })
    logger.info(this.TAG, '✅ Socket.IO Service initialized')
  }

  public getIO (): SocketIOServer {
    if (!this.io) {
      throw new Error('Socket.IO has not been initialized!')
    }
    return this.io
  }
}

export const socketService = new SocketService()
