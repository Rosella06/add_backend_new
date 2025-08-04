import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'

class SocketService {
  private io: SocketIOServer | null = null

  public initialize (server: HTTPServer): void {
    if (this.io) return

    this.io = new SocketIOServer(server, {
      cors: { origin: '*', methods: ['GET', 'POST'] }
    })

    this.io.on('connection', (socket: Socket) => {
      console.log(`✅ Socket.IO: User connected ${socket.id}`)
      socket.on('disconnect', () => {
        console.log(`Socket.IO: User disconnected ${socket.id}`)
      })
    })
    console.log('✅ Socket.IO Service initialized')
  }

  public getIO (): SocketIOServer {
    if (!this.io) {
      throw new Error('Socket.IO has not been initialized!')
    }
    return this.io
  }
}

export const socketService = new SocketService()
