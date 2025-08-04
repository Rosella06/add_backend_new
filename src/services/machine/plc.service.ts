import { Socket } from 'net'
import prisma from '../../config/prisma'

function pad(num: number, size: number): string {
  let s = num.toString()
  while (s.length < size) s = '0' + s
  return s
}

async function getNextRunningNumber(machineId: string): Promise<number> {
  return prisma.$transaction(async tx => {
    const machine = await tx.machines.findUnique({
      where: { id: machineId },
      select: { running: true }
    })

    if (!machine) {
      throw new Error(`Machine with ID ${machineId} not found.`)
    }

    const currentRunning = machine.running
    const nextRunning = currentRunning >= 9 ? 1 : currentRunning + 1

    await tx.machines.update({
      where: { id: machineId },
      data: { running: nextRunning }
    })

    return currentRunning
  })
}

class PlcService {
  private async createCommand(params: {
    cabinet?: number
    row?: number
    column?: number
    quantity?: number
    command: number
    transition: number
    device?: number
  }): Promise<string> {
    const cabinet = params.cabinet ?? 1
    const row = params.row ?? 0
    const column = params.column ?? 0
    const quantity = params.quantity ?? 0
    const command = params.command
    const transition = params.transition
    const device = params.device ?? 4500
    const color = 1
    const dataReturn = 0

    const sum =
      cabinet +
      row +
      column +
      quantity +
      color +
      command +
      dataReturn +
      transition +
      device
    const checksum = sum % 100

    const commandString =
      `B${pad(cabinet, 2)}R${pad(row, 2)}C${pad(column, 2)}Q${pad(
        quantity,
        4
      )}L${pad(color, 2)}` +
      `M${pad(command, 2)}T${pad(dataReturn, 2)}N${pad(transition, 1)}D${pad(
        device,
        4
      )}S${pad(checksum, 2)}`

    return commandString
  }

  private async sendCommandWithRetry(
    socket: Socket,
    commandString: string,
    timeoutMs = 2500
  ): Promise<string> {
    const MAX_RETRIES = 3

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(
        `[PLC Send attempt ${attempt}/${MAX_RETRIES}]: ${commandString}`
      )
      socket.write(commandString)

      try {
        const response = await new Promise<string>((resolve, reject) => {
          let timeoutId: NodeJS.Timeout

          const onData = (data: Buffer) => {
            clearTimeout(timeoutId)
            socket.removeListener('data', onData)
            resolve(data.toString())
          }

          socket.on('data', onData)

          timeoutId = setTimeout(() => {
            socket.removeListener('data', onData)
            reject(
              new Error(`Timeout after ${timeoutMs}ms on attempt ${attempt}`)
            )
          }, timeoutMs)
        })

        console.log(`[PLC Response on attempt ${attempt}]: ${response}`)
        return response
      } catch (error) {
        console.warn((error as Error).message)
        if (attempt === MAX_RETRIES) {
          throw new Error(
            `PLC failed to respond for command '${commandString}' after ${MAX_RETRIES} attempts.`
          )
        }
      }
    }
    throw new Error('sendCommandWithRetry logic reached an unexpected state.')
  }

  public async dispenseDrug(
    socket: Socket,
    order: {
      machineId: string
      floor: number
      position: number
      quantity: number
    },
    slot: 'left' | 'right'
  ): Promise<boolean> {
    const transition = await getNextRunningNumber(order.machineId)
    const commandCode = slot === 'right' ? 1 : 2

    const commandString = await this.createCommand({
      row: order.floor,
      column: order.position,
      quantity: order.quantity,
      command: commandCode,
      transition: transition
    })

    const response = await this.sendCommandWithRetry(
      socket,
      commandString,
      15000
    )
    const responseCode = response.substring(21, 23)

    if (responseCode !== '92') {
      throw new Error(
        `Dispense command failed, PLC responded with T${responseCode}`
      )
    }
    return true
  }

  public async checkStatus(
    socket: Socket,
    machineId: string,
    commandCode: 38 | 39 | 40
  ): Promise<string> {
    const transition = await getNextRunningNumber(machineId)
    const commandString = await this.createCommand({
      command: commandCode,
      transition: transition
    })

    const response = await this.sendCommandWithRetry(socket, commandString)
    const responseCode = response.substring(21, 23)
    return responseCode
  }

  public async findAvailableSlot(
    socket: Socket,
    machineId: string
  ): Promise<'left' | 'right'> {
    const status = await this.checkStatus(socket, machineId, 39)
    switch (status) {
      case '35':
        return 'left'
      case '36':
      case '34':
        return 'right'
      default:
        throw new Error(`Tray is full or in an unknown state (T${status}).`)
    }
  }

  public async openDoor(
    socket: Socket,
    machineId: string,
    slot: 'left' | 'right'
  ): Promise<void> {
    const transition = await getNextRunningNumber(machineId)
    const commandCode = slot === 'right' ? 34 : 35
    const commandString = await this.createCommand({
      command: commandCode,
      transition
    })
    const response = await this.sendCommandWithRetry(socket, commandString)
    const responseCode = response.substring(21, 23)
    if (responseCode !== '39') {
      throw new Error(
        `Failed to open door, PLC responded with T${responseCode}`
      )
    }
  }

  public async isDoorClosed(
    socket: Socket,
    machineId: string
  ): Promise<boolean> {
    const status = await this.checkStatus(socket, machineId, 38)
    return status === '30'
  }

  public async turnOffLight(
    socket: Socket,
    machineId: string,
    slot: 'left' | 'right'
  ): Promise<void> {
    const transition = await getNextRunningNumber(machineId)
    const commandCode = slot === 'right' ? 36 : 37
    const commandString = await this.createCommand({
      command: commandCode,
      transition
    })

    try {
      await this.sendCommandWithRetry(socket, commandString)
    } catch (error) {
      console.warn(
        "Could not confirm 'turnOffLight' command was received, but continuing anyway."
      )
    }
  }
}

export const plcService = new PlcService()
