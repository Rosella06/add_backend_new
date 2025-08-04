import net, { Socket } from 'net'
import prisma from '../config/prisma'

class TcpService {
  private server: net.Server | null = null
  private connectedSockets: Map<string, Socket> = new Map()

  public initialize (port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) return resolve()

      this.server = net.createServer(async (socket: Socket) => {
        const clientIp = socket.remoteAddress
        console.log(`[TCP] New client connected from IP: ${clientIp}`)

        if (!clientIp) {
          socket.end()
          return
        }

        try {
          const machine = await prisma.machines.findUnique({
            where: { ipAddress: clientIp }
          })

          if (machine) {
            console.log(
              `✅ [TCP] IP ${clientIp} matched with Machine ID: ${machine.id}`
            )

            if (this.connectedSockets.has(machine.id)) {
              console.warn(
                `[TCP] Closing old connection for Machine ${machine.id}.`
              )
              this.connectedSockets.get(machine.id)?.end()
            }
            this.connectedSockets.set(machine.id, socket)
            await prisma.machines.update({
              where: { id: machine.id },
              data: { status: 'online' }
            })

            socket.on('data', data =>
              console.log(`[TCP Data from ${machine.id}]: ${data.toString()}`)
            )
            socket.on('end', async () => {
              console.log(`[TCP] Machine ${machine.id} disconnected.`)
              this.connectedSockets.delete(machine.id)
              await prisma.machines.update({
                where: { id: machine.id },
                data: { status: 'offline' }
              })
            })
            socket.on('error', err =>
              console.error(`[TCP] Socket Error from ${machine.id}:`, err)
            )
          } else {
            console.warn(`⚠️ [TCP] No machine found for IP: ${clientIp}.`)
          }
        } catch (error) {
          console.error('[TCP] Error during machine lookup:', error)
          socket.end()
        }
      })

      this.server.listen(port, () => {
        console.log(`✅ TCP Server is listening on port ${port}`)
        resolve()
      })
      this.server.on('error', err => reject(err))
    })
  }

  public getSocketByMachineId (machineId: string): Socket | undefined {
    return this.connectedSockets.get(machineId)
  }
}

export const tcpService = new TcpService()
