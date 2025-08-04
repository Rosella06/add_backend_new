import { Socket } from 'net'
import prisma from '../../config/prisma'

function pad (num: number, size: number): string {
  let s = num.toString()
  while (s.length < size) s = '0' + s
  return s
}

async function getNextRunningNumber (machineId: string): Promise<number> {
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
  private async createCommand (params: {
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
      `B${pad(cabinet, 2)}` +
      `R${pad(row, 2)}` +
      `C${pad(column, 2)}` +
      `Q${pad(quantity, 4)}` +
      `L${pad(color, 2)}` +
      `M${pad(command, 2)}` +
      `T${pad(dataReturn, 2)}` +
      `N${pad(transition, 1)}` +
      `D${pad(device, 4)}` +
      `S${pad(checksum, 2)}`

    if (commandString.length !== 33) {
      console.warn(
        'Warning: Generated command string length is not 33.',
        commandString
      )
    }

    return commandString
  }

  private async sendAndAwaitResponse (
    socket: Socket,
    commandString: string,
    successCode: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.removeListener('data', onData)
        reject(new Error(`PLC response timeout for command: ${commandString}`))
      }, 10000)

      const onData = (data: Buffer) => {
        const response = data.toString()
        console.log(`[PLC Response]: ${response}`)
        const responseCode = response.substring(19, 21)

        if (responseCode === successCode) {
          clearTimeout(timeout)
          socket.removeListener('data', onData)
          resolve(response)
        }
      }

      socket.on('data', onData)
      console.log(`[PLC Send]: ${commandString}`)
      socket.write(commandString)
    })
  }

  public async dispenseDrug (
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

    try {
      await this.sendAndAwaitResponse(socket, commandString, '92')
      return true
    } catch (error) {
      console.error('Dispense drug failed:', error)
      return false
    }
  }

  public async checkStatus (
    socket: Socket,
    machineId: string,
    commandCode: 38 | 39 | 40
  ): Promise<string> {
    const transition = await getNextRunningNumber(machineId)
    const commandString = await this.createCommand({
      command: commandCode,
      transition: transition
    })

    const response = await this.sendAndAwaitResponse(socket, commandString, '')
    const responseCode = response.substring(19, 21)
    return responseCode
  }

  public async findAvailableSlot (
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
      case '37':
      default:
        throw new Error(
          `Tray is full or in an unknown state (T${status}). Cannot dispense.`
        )
    }
  }

  public async openDoor (
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
    await this.sendAndAwaitResponse(socket, commandString, '39')
  }

  public async isDoorClosed (
    socket: Socket,
    machineId: string
  ): Promise<boolean> {
    try {
      const status = await this.checkStatus(socket, machineId, 38)

      if (status === '30') {
        console.log(
          `[PLC Status] Door check successful (T${status}): Doors are closed and locked.`
        )
        return true
      } else {
        console.log(
          `[PLC Status] Door check (T${status}): Doors are not fully closed/locked.`
        )
        return false
      }
    } catch (error) {
      console.error('Failed to check door status:', error)
      return false
    }
  }

  public async turnOffLight (
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
    socket.write(commandString)
  }
}

export const plcService = new PlcService()
