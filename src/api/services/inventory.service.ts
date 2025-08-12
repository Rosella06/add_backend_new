import { Inventory } from '@prisma/client'
import prisma from '../../config/prisma'
import { HttpError } from '../../types/global'
import { CreateInventoryIdRequestBody } from '../../validators/inventory.validator'

export const getInventoryService = async (): Promise<Inventory[]> => {
  try {
    const result = await prisma.inventory.findMany()

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

export const createInventoryByIdService = async (
  inventoryData: CreateInventoryIdRequestBody
): Promise<Inventory> => {
  try {
    // const fintInventory = await prisma.inventory.findFirst({
    //   where: { id: inventoryData }
    // })

    // if (!fintInventory) {
    //   throw new HttpError(404, `Inventory ${inventoryId} not found.`)
    // }

    return null as unknown as Inventory
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
