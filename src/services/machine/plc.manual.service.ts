import { Socket } from 'net'
import { failStatuses, PlcCommandTwo, successStatuses } from '../../types/plc'
import prisma from '../../config/prisma'
import { PlcCommandRequestBody } from '../../validators/plc.validator'

const pad = (num: number, length: number) =>
  num.toString().padStart(length, '0')

const calculateChecksum = (
  floor: number,
  position: number,
  qty: number,
  color: number,
  commandValue: number,
  returnValue: number,
  transition: number,
  device: number
): string => {
  const total =
    0 +
    floor +
    position +
    qty +
    color +
    commandValue +
    returnValue +
    transition +
    device
  return pad(total, 2).slice(-2)
}

const createPlcCommand = (
  floor: number,
  position: number,
  qty: number,
  mode: string,
  running: number,
  color: number = 1
): string => {
  const commandValue = parseInt(mode.slice(1))
  const returnValue = 0
  const device = 4500

  const checksum = calculateChecksum(
    floor,
    position,
    qty,
    color,
    commandValue,
    returnValue,
    running,
    device
  )

  return `B00R${pad(floor, 2)}C${pad(position, 2)}Q${pad(qty, 4)}L${pad(
    color,
    2
  )}${mode}T00N${running}D${device}S${checksum}`
}

const createSimpleCommand = (
  mode: string,
  running: number,
  color: number = 0
): string => {
  const floor = 0
  const position = 0
  const qty = 0
  const commandValue = parseInt(mode.slice(1))
  const returnValue = 0
  const device = 4500

  const checksum = calculateChecksum(
    floor,
    position,
    qty,
    color,
    commandValue,
    returnValue,
    running,
    device
  )

  return `B00R00C00Q0000L${pad(
    color,
    2
  )}${mode}T00N${running}D${device}S${checksum}`
}

const getMachineRunningCheck = async (id: string) => {
  const machine = await prisma.machines.findUnique({
    where: { id }
  })

  if (!machine) {
    throw new Error('Machine not found')
  }

  const current = machine.runningCheck
  const next = current >= 9 ? 1 : current + 1

  await prisma.machines.update({
    where: { id },
    data: {
      runningCheck: next
    }
  })

  return current
}

const sendCommandtoCheckMachineStatus = async (
  cmd: string,
  running: number,
  socket: Socket
): Promise<{ status: string; raw: string }> => {
  return new Promise((resolve, reject) => {
    const m = parseInt(cmd.slice(1))
    const sumValue = 0 + 0 + 0 + 0 + 0 + m + 0 + running + 4500
    const sum = pad(sumValue, 2).slice(-2)
    const checkMsg = `B00R00C00Q0000L00${cmd}T00N${running}D4500S${sum}`

    console.log(`📤 Sending status check command: ${checkMsg}`)
    socket.write(checkMsg)

    const timeout = setTimeout(() => {
      socket.off('data', onData)
      reject(new Error('Timeout: PLC ไม่ตอบสนอง'))
    }, 5000)

    const onData = (data: Buffer) => {
      const message = data.toString()
      const status = message.split('T')[1]?.substring(0, 2) ?? '00'
      clearTimeout(timeout)
      socket.off('data', onData)
      console.log(
        `📥 Response from PLC (${cmd}):`,
        message,
        '| Status T:',
        status
      )
      resolve({ status, raw: message })
    }

    socket.on('data', onData)
  })
}

export const checkMachineStatus = async (
  socket: Socket,
  bodyData: PlcCommandRequestBody,
  running: number
): Promise<{ status: number; data: string }> => {
  const { floor, machineId, position, qty } = bodyData

  let mode: PlcCommandTwo = PlcCommandTwo.DispenseRight

  for (const cmd of [
    PlcCommandTwo.CheckDoor,
    PlcCommandTwo.CheckTray,
    PlcCommandTwo.CheckShelf
  ]) {
    try {
      const runningCheck = await getMachineRunningCheck(machineId)
      const result = await sendCommandtoCheckMachineStatus(
        cmd,
        runningCheck,
        socket
      )
      const status = result.status

      if (cmd === PlcCommandTwo.CheckTray) {
        if (status === '35') {
          mode = PlcCommandTwo.DispenseLeft
        } else if (status === '34' || status === '36') {
          mode = PlcCommandTwo.DispenseRight
        } else if (failStatuses.includes(status)) {
          throw new Error(`❌ เครื่องไม่พร้อม (${cmd}) -> ${status}`)
        } else {
          throw new Error(`⚠️ ไม่รู้จักสถานะ (${cmd}) -> ${status}`)
        }
      } else {
        if (failStatuses.includes(status)) {
          throw new Error(`❌ เครื่องไม่พร้อม (${cmd}) -> ${status}`)
        } else if (!successStatuses.includes(status)) {
          throw new Error(`⚠️ ไม่รู้จักสถานะ (${cmd}) -> ${status}`)
        }
      }
    } catch (err) {
      console.error(`❌ Error on ${cmd}:`, err)
      throw new Error(`เกิดข้อผิดพลาดระหว่างเช็ค ${cmd}`)
    }
  }

  const message = createPlcCommand(floor, position, qty, mode, running)
  console.log('📤 Final PLC command:', message)
  socket.write(message)

  return new Promise((resolve, reject) => {
    let responded = false

    socket.once('data', data => {
      responded = true
      const responseText = data.toString()
      console.log('📥 Final PLC response:', responseText)

      resolve({
        status: 100,
        data: responseText
      })
    })
  })
}

export { createPlcCommand, createSimpleCommand }
