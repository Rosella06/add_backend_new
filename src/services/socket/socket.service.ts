import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { logger } from '../../utils/logger'
import StartupTimer from '../../utils/timer'

class SocketService {
  private io: SocketIOServer | null = null
  private connectedClients: Map<string, Socket> = new Map()
  private TAG = 'SocketService'

  public initialize (server: HTTPServer, timer: StartupTimer): void {
    if (this.io) return

    this.io = new SocketIOServer(server, {
      cors: { origin: process.env.FRONTENT_URL, methods: ['GET', 'POST'] }
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

    timer.check(this.TAG, 'Socket.IO Service initialized')
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
