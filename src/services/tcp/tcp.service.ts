import net, { Socket } from 'net'
import prisma from '../../config/prisma'
import { logger } from '../../utils/logger'
import systemEventEmitter, { SystemEvents } from '../../utils/system.events'

class TcpService {
  private server: net.Server | null = null
  private connectedSockets: Map<string, Socket> = new Map()
  private TAG = 'TcpService'

  public initialize (port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) return resolve()

      this.server = net.createServer(async (socket: Socket) => {
        const clientIp = socket.remoteAddress
        logger.info(this.TAG, `[TCP] New client connected from IP: ${clientIp}`)

        if (!clientIp) {
          socket.end()
          return
        }

        try {
          const machine = await prisma.machines.findUnique({
            where: { ipAddress: clientIp }
          })

          if (machine) {
            logger.info(
              this.TAG,
              `[TCP] IP ${clientIp} matched with Machine ID: ${machine.id}`
            )

            if (machine.status === 'offline') {
              logger.info(
                this.TAG,
                `Machine ${machine.id} has come online. Emitting event.`
              )
              systemEventEmitter.emit(SystemEvents.MACHINE_ONLINE, {
                machineId: machine.id
              })
            }

            if (this.connectedSockets.has(machine.id)) {
              logger.warn(
                this.TAG,
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
              logger.info(
                this.TAG,
                `[TCP Data from ${machine.id}]: ${data.toString()}`
              )
            )
            socket.on('end', async () => {
              logger.info(this.TAG, `[TCP] Machine ${machine.id} disconnected.`)
              // systemEventEmitter.emit(SystemEvents.MACHINE_OFFLINE, {
              //   machineId: machine.id
              // })
              this.connectedSockets.delete(machine.id)
              await prisma.machines.update({
                where: { id: machine.id },
                data: { status: 'offline' }
              })
            })
            socket.on('error', err =>
              logger.error(
                this.TAG,
                `[TCP] Socket Error from ${machine.id}:`,
                err
              )
            )
          } else {
            logger.warn(this.TAG, `[TCP] No machine found for IP: ${clientIp}.`)
          }
        } catch (error) {
          logger.error(this.TAG, '[TCP] Error during machine lookup:', error)
          socket.end()
        }
      })

      this.server.listen(port, () => {
        logger.info(this.TAG, `TCP Server is listening on port ${port}`)
        resolve()
      })
      this.server.on('error', err => reject(err))
    })
  }

  public getSocketByMachineId (machineId: string): Socket | undefined {
    return this.connectedSockets.get(machineId)
  }

  public disconnectByMachineId (
    machineId: string,
    reason: string = 'Configuration updated'
  ): void {
    const socket = this.connectedSockets.get(machineId)
    if (socket) {
      logger.warn(
        this.TAG,
        `[TCP] Forcibly disconnecting machine ${machineId}. Reason: ${reason}`
      )
      socket.end()
      this.connectedSockets.delete(machineId)
    }
  }
}

export const tcpService = new TcpService()
