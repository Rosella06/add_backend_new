import { Inventory } from '@prisma/client'
import prisma from '../../config/prisma'
import { HttpError } from '../../types/global'
import {
  CreateInventoryRequestBody,
  EditInventoryRequestBody,
  UpdateStockRequestBody
} from '../../validators/inventory.validator'
import { v4 as uuidv4 } from 'uuid'
import { id } from 'zod/v4/locales/index.cjs'
import { plcSendCommandMService } from './plc.service'
import { tcpService } from '../../services/tcp/tcp.service'
import { logger } from '../../utils/logger'

const MAX_INVENTORY_SLOTS_PER_MACHINE = 84
const TAG = 'INVENTORY-SERVICE'

export const getInventoryService = async (): Promise<Inventory[]> => {
  try {
    const result = await prisma.inventory.findMany({
      include: {drug: true, machine: true}
    })

    return result
  } catch (error) {
    throw error
  }
}

export const getInventoryByIdService = async (
  inventoryId: string
): Promise<Inventory> => {
  try {
    const fintInventory = await prisma.inventory.findFirst({
      where: { id: inventoryId }
    })

    if (!fintInventory) {
      throw new HttpError(404, `Inventory ${inventoryId} not found.`)
    }

    return fintInventory
  } catch (error) {
    throw error
  }
}

export const createInventoryService = async (
  inventoryData: CreateInventoryRequestBody
): Promise<Inventory> => {
  try {
    const { machineId, floor, position, drugId } = inventoryData
    const currentInventoryCount = await prisma.inventory.count({
      where: {
        machineId: machineId
      }
    })

    if (currentInventoryCount >= MAX_INVENTORY_SLOTS_PER_MACHINE) {
      throw new HttpError(
        409,
        `This machine has reached its maximum capacity of ${MAX_INVENTORY_SLOTS_PER_MACHINE} inventory slots.`
      )
    }

    const existingPosition = await prisma.inventory.findUnique({
      where: {
        unique_inventory_location_per_machine: {
          machineId: machineId,
          floor: floor,
          position: position
        }
      }
    })

    if (existingPosition) {
      throw new HttpError(
        409,
        `Position (Floor: ${floor}, Position: ${position}) is already occupied on this machine.`
      )
    }

    const existingDrug = await prisma.inventory.findFirst({
      where: {
        machineId: machineId,
        drugId: drugId
      }
    })

    if (existingDrug) {
      throw new HttpError(
        409,
        `Drug ID ${drugId} already exists in another slot (Floor: ${existingDrug.floor}, Position: ${existingDrug.position}) on this machine.`
      )
    }

    const UUID = `IVID-${uuidv4()}`
    const newInventory = await prisma.inventory.create({
      data: {
        id: UUID,
        ...inventoryData
      }
    })

    const socket = tcpService.getSocketByMachineId(machineId)

    if (socket) {
      let bodyData = {
        command: 'M32',
        floor,
        position,
        machineId
      }

      const sendM32 = await plcSendCommandMService(bodyData, socket, 'M32')
      logger.debug(TAG, `ส่งคำสั่ง m32 เรียบร้อย: ${sendM32.plcResponse}`)

      bodyData.command = 'M33'

      const sendM33 = await plcSendCommandMService(bodyData, socket, 'M33')
      logger.debug(TAG, `ส่งคำสั่ง m33 เรียบร้อย: ${sendM33.plcResponse}`)
    }

    return newInventory
  } catch (error) {
    throw error
  }
}

export const editInventoryService = async (
  inventoryId: string,
  inventoryData: EditInventoryRequestBody
): Promise<Inventory> => {
  try {
    const existingInventory = await prisma.inventory.findUnique({
      where: { id: inventoryId }
    })

    if (!existingInventory) {
      throw new HttpError(404, `Inventory with ID ${inventoryId} not found.`)
    }

    const { floor, position, drugId, expiryDate } = inventoryData
    const machineId = inventoryData.machineId || existingInventory.machineId

    if (floor !== undefined && position !== undefined) {
      if (
        floor !== existingInventory.floor ||
        position !== existingInventory.position
      ) {
        const targetPosition = await prisma.inventory.findUnique({
          where: {
            unique_inventory_location_per_machine: {
              machineId,
              floor,
              position
            }
          }
        })
        if (targetPosition) {
          throw new HttpError(
            409,
            `Target position (Floor: ${floor}, Position: ${position}) is already occupied.`
          )
        }
      }
    }

    if (drugId && drugId !== existingInventory.drugId) {
      const existingDrug = await prisma.inventory.findFirst({
        where: { machineId, drugId, NOT: { id: inventoryId } }
      })
      if (existingDrug) {
        throw new HttpError(
          409,
          `Drug ID ${drugId} already exists in another slot on this machine.`
        )
      }
    }

    let expiryDateValue: Date | string | undefined = expiryDate
    if (expiryDate) {
      let dateString = expiryDate
      if (dateString.length === 8 && !dateString.includes('-')) {
        dateString = `${dateString.substring(0, 4)}-${dateString.substring(
          4,
          6
        )}-${dateString.substring(6, 8)}`
      }
      const dateObject = new Date(dateString)
      if (isNaN(dateObject.getTime())) {
        throw new HttpError(
          400,
          'Invalid expiryDate format. Please use YYYY-MM-DD or YYYYMMDD.'
        )
      }
      expiryDateValue = dateObject
    }

    const dataToUpdate = {
      ...inventoryData,
      expiryDate: expiryDateValue
    }

    const updatedInventory = await prisma.inventory.update({
      where: { id: inventoryId },
      data: dataToUpdate
    })

    return updatedInventory
  } catch (error) {
    throw error
  }
}

export const UpdateStockService = async (
  inventoryId: string,
  inventoryData: UpdateStockRequestBody
): Promise<Inventory> => {
  try {
    const existingInventory = await prisma.inventory.findUnique({
      where: { id: inventoryId }
    })

    if (!existingInventory) {
      throw new HttpError(404, `Inventory with ID ${inventoryId} not found.`)
    }

    const { quantity } = inventoryData

    const updatedInventory = await prisma.inventory.update({
      where: { id: inventoryId },
      data: {
        quantity
      }
    })

    return updatedInventory
  } catch (error) {
    throw error
  }
}

export const deleteInventoryService = async (
  inventoryId: string
): Promise<Inventory> => {
  try {
    const fintInventory = await prisma.inventory.findFirst({
      where: { id: inventoryId }
    })

    if (!fintInventory) {
      throw new HttpError(404, `Inventory ${inventoryId} not found.`)
    }

    const result = await prisma.inventory.delete({
      where: { id: inventoryId }
    })

    return result
  } catch (error) {
    throw error
  }
}
