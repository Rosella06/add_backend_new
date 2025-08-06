import { Socket } from 'net'
import prisma from '../../config/prisma'
import { logger } from '../../utils/logger'

const TAG = 'PLCService';

function pad(num: number, size: number): string {
  let s = num.toString();
  while (s.length < size) s = '0' + s;
  return s;
}

async function getNextRunningNumber(machineId: string): Promise<number> {
  return prisma.$transaction(async tx => {
    const machine = await tx.machines.findUnique({
      where: { id: machineId },
      select: { running: true }
    });

    if (!machine) {
      throw new Error(`Machine with ID ${machineId} not found.`);
    }

    const currentRunning = machine.running;
    const nextRunning = currentRunning >= 9 ? 1 : currentRunning + 1;

    await tx.machines.update({
      where: { id: machineId },
      data: { running: nextRunning }
    });

    return currentRunning;
  });
}

class PlcService {
  private async createCommand(params: {
    cabinet?: number;
    row?: number;
    column?: number;
    quantity?: number;
    command: number;
    transition: number;
    device?: number;
  }): Promise<string> {
    const cabinet = params.cabinet ?? 1;
    const row = params.row ?? 0;
    const column = params.column ?? 0;
    const quantity = params.quantity ?? 0;
    const command = params.command;
    const transition = params.transition;
    const device = params.device ?? 4500;
    const color = 1;
    const dataReturn = 0;

    const sum = cabinet + row + column + quantity + color + command + dataReturn + transition + device;
    const checksum = sum % 100;

    const commandString =
      `B${pad(cabinet, 2)}R${pad(row, 2)}C${pad(column, 2)}Q${pad(quantity, 4)}L${pad(color, 2)}` +
      `M${pad(command, 2)}T${pad(dataReturn, 2)}N${pad(transition, 1)}D${pad(device, 4)}S${pad(checksum, 2)}`;

    return commandString;
  }

  private async sendAndAwaitMatchingResponse(
    socket: Socket,
    commandString: string,
    expectedTransition: number,
    timeoutMs = 3000
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        socket.removeListener('data', onData);
        reject(new Error(`Timeout waiting for response to N=${expectedTransition} for command '${commandString}'`));
      }, timeoutMs);

      const onData = (data: Buffer) => {
        const response = data.toString();
        if (response.length < 25) {
          logger.warn(TAG, `Received a malformed or short response: ${response}`);
          return;
        };

        const responseTransition = parseInt(response.substring(24, 25), 10);

        if (responseTransition === expectedTransition) {
          clearTimeout(timeoutId);
          socket.removeListener('data', onData);
          logger.info(TAG, `Matched response for N=${expectedTransition}: ${response}`);
          resolve(response);
        } else {
          logger.debug(TAG, `Ignored mismatched response (got N=${responseTransition}, want N=${expectedTransition})`);
        }
      };

      socket.on('data', onData);
      logger.info(TAG, `Sending command, waiting for N=${expectedTransition}: ${commandString}`);
      socket.write(commandString);
    });
  }

  public async dispenseDrug(
    socket: Socket,
    order: {
      machineId: string;
      floor: number;
      position: number;
      quantity: number;
    },
    slot: 'left' | 'right'
  ): Promise<boolean> {
    const transition = await getNextRunningNumber(order.machineId);
    try {
      const commandCode = slot === 'right' ? 1 : 2;
      const commandString = await this.createCommand({
        row: order.floor,
        column: order.position,
        quantity: order.quantity,
        command: commandCode,
        transition: transition,
      });

      return await new Promise<boolean>((resolve, reject) => {
        const timeoutMs = 20000;
        let got91 = false;

        const timeoutId = setTimeout(() => {
          socket.removeListener('data', onData);
          reject(new Error(`Dispense process timed out for N=${transition}`));
        }, timeoutMs);

        const onData = (data: Buffer) => {
          const response = data.toString();
          if (response.length < 25) return;

          const responseTransition = parseInt(response.substring(24, 25), 10);

          if (responseTransition !== transition) {
            return;
          }

          const responseCode = response.substring(21, 23);
          logger.debug(TAG, `Dispense listener (N=${transition}) received code T${responseCode}`);

          if (responseCode === '91' && !got91) {
            got91 = true;
            logger.info(TAG, `PLC acknowledged command (T91) for N=${transition}. Waiting for completion...`);
          } else if (responseCode === '92' && got91) {
            clearTimeout(timeoutId);
            socket.removeListener('data', onData);
            logger.info(TAG, `PLC confirmed dispense success (T92) for N=${transition}.`);
            resolve(true);
          } else {
            clearTimeout(timeoutId);
            socket.removeListener('data', onData);
            logger.error(TAG, `Received unexpected code T${responseCode} for dispense command N=${transition}`);
            resolve(false);
          }
        };

        socket.on('data', onData);
        socket.write(commandString);
        logger.info(TAG, `Sending dispense command, waiting for N=${transition}: ${commandString}`);
      });
    } catch (error) {
      logger.error(TAG, `Dispense drug process (N=${transition}) failed entirely:`, (error as Error).message);
      return false;
    }
  }

  public async checkStatus(
    socket: Socket,
    machineId: string,
    commandCode: 38 | 39 | 40
  ): Promise<string> {
    const transition = await getNextRunningNumber(machineId);
    const commandString = await this.createCommand({ command: commandCode, transition: transition });
    const response = await this.sendAndAwaitMatchingResponse(socket, commandString, transition);
    return response.substring(21, 23);
  }

  public async findAvailableSlot(
    socket: Socket,
    machineId: string
  ): Promise<'left' | 'right'> {
    const status = await this.checkStatus(socket, machineId, 39);
    switch (status) {
      case '35': return 'left';
      case '36':
      case '34': return 'right';
      default:
        throw new Error(`Tray is full or in an unknown state (T${status}).`);
    }
  }

  public async openDoor(
    socket: Socket,
    machineId: string,
    slot: 'left' | 'right'
  ): Promise<void> {
    const transition = await getNextRunningNumber(machineId);
    const commandCode = slot === 'right' ? 34 : 35;
    const commandString = await this.createCommand({ command: commandCode, transition: transition });
    const response = await this.sendAndAwaitMatchingResponse(socket, commandString, transition);
    const responseCode = response.substring(21, 23);
    if (responseCode !== '39') {
      throw new Error(`Failed to open door, PLC responded with T${responseCode}`);
    }
  }

  public async isDoorClosed(
    socket: Socket,
    machineId: string
  ): Promise<boolean> {
    const status = await this.checkStatus(socket, machineId, 38);
    return status === '30';
  }

  public async isTrayEmpty(
    socket: Socket,
    machineId: string,
    slot: 'left' | 'right'
  ): Promise<boolean> {
    try {
      const status = await this.checkStatus(socket, machineId, 39);
      logger.debug(TAG, `[PLC Status] Tray check (T${status}) for slot '${slot}'.`);
      if (status === '34') return true;
      if (slot === 'left' && status === '35') return true;
      if (slot === 'right' && status === '36') return true;
      return false;
    } catch (error) {
      logger.error(TAG, `Failed to check tray status for slot '${slot}':`, error);
      return false;
    }
  }

  public async turnOffLight(
    socket: Socket,
    machineId: string,
    slot: 'left' | 'right'
  ): Promise<void> {
    const transition = await getNextRunningNumber(machineId);
    const commandCode = slot === 'right' ? 36 : 37;
    const commandString = await this.createCommand({ command: commandCode, transition });
    try {
      await this.sendAndAwaitMatchingResponse(socket, commandString, transition, 1000);
    } catch (error) {
      logger.warn(TAG, `Could not confirm 'turnOffLight' (N=${transition}) was received, but continuing anyway.`);
    }
  }
}

export const plcService = new PlcService();