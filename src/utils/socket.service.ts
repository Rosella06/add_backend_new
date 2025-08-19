import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { logger } from './logger'

class SocketService {
  private io: SocketIOServer | null = null
  private connectedClients: Map<string, Socket> = new Map()
  private TAG = 'SocketService'

  public initialize (server: HTTPServer, logWithTiming: (serviceName: string, message: string) => void): void {
    if (this.io) return

    this.io = new SocketIOServer(server, {
      cors: { origin: '*', methods: ['GET', 'POST'] }
    })

    this.io.on('connection', (socket: Socket) => {
      logger.info(this.TAG, `Client connected with ID: ${socket.id}`)

      this.connectedClients.set(socket.id, socket)

      socket.on('disconnect', (reason: string) => {
        logger.info(
          this.TAG,
          `Client disconnected with ID: ${socket.id}. Reason: ${reason}`
        )

        this.connectedClients.delete(socket.id)
      })
    })

    logWithTiming(this.TAG, 'Socket.IO Service initialized')
  }

  public getSocketById (socketId: string): Socket | undefined {
    return this.connectedClients.get(socketId)
  }

  public getIO (): SocketIOServer {
    if (!this.io) {
      throw new Error('Socket.IO has not been initialized.')
    }
    return this.io
  }
}

export const socketService = new SocketService()
