import { Machines } from '@prisma/client'
import prisma from '../../config/prisma'
import { HttpError } from '../../types/global'
import { v4 as uuidv4 } from 'uuid'
import { getDateFormat } from '../../utils/date.format'
import { setupConsumerForSingleMachine } from '../../services/rabbitmq/consumer.setup'
import { rabbitService } from '../../services/rabbitmq/rabbitmq.service'
import { MachineRequestBody } from '../../validators/machine.validator'
import { tcpService } from '../../utils/tcp.service'

export const getMachineService = async (): Promise<Machines[]> => {
  try {
    const findMachines = await prisma.machines.findMany()

    return findMachines
  } catch (error) {
    throw error
  }
}

export const createMachineService = async (
  machineName: string,
  ipAddress: string
): Promise<Machines> => {
  try {
    const findMachines = await prisma.machines.findUnique({
      where: { ipAddress }
    })

    if (findMachines) {
      throw new HttpError(
        409,
        `Machine ${findMachines.ipAddress} already exists.`
      )
    }

    const UUID = `MID-${uuidv4()}`
    const result = await prisma.machines.create({
      data: {
        id: UUID,
        machineName,
        ipAddress,
        createdAt: getDateFormat(new Date()),
        updatedAt: getDateFormat(new Date())
      }
    })

    await setupConsumerForSingleMachine(result.id)

    return result
  } catch (error) {
    throw error
  }
}

export const editMachineService = async (
  machineId: string,
  machineData: MachineRequestBody
): Promise<Machines> => {
  try {
    const findMachine = await prisma.machines.findFirst({
      where: { id: machineId }
    })

    if (!findMachine) {
      throw new HttpError(404, `Machine ${machineId} not found.`)
    }

    const ipHasChanged =
      machineData.ipAddress && findMachine.ipAddress !== machineData.ipAddress

    const result = await prisma.machines.update({
      where: { id: machineId },
      data: {
        machineName: machineData.machineName,
        ipAddress: machineData.ipAddress,
        updatedAt: getDateFormat(new Date())
      }
    })

    if (ipHasChanged) {
      tcpService.disconnectByMachineId(machineId, 'IP address was changed.')
    }

    return result
  } catch (error) {
    throw error
  }
}

export const deleteMachineService = async (
  machineId: string
): Promise<Machines> => {
  try {
    const findMachines = await prisma.machines.findFirst({
      where: { id: machineId }
    })

    if (!findMachines) {
      throw new HttpError(404, `Machine ${machineId} not found.`)
    }

    tcpService.disconnectByMachineId(machineId, 'Machine is being deleted.')

    const result = await prisma.machines.delete({
      where: { id: machineId }
    })

    const mainQueueName = `orders_queue_${machineId}`
    const errorQueueName = `error_queue_${machineId}`
    const retryQueueName = `retry_queue_${machineId}`

    await rabbitService.deleteQueue(mainQueueName)
    await rabbitService.deleteQueue(errorQueueName)
    await rabbitService.deleteQueue(retryQueueName)

    return result
  } catch (error) {
    throw error
  }
}
