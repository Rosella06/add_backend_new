import { NextFunction, Request, Response } from 'express'
import {
  createInventoryByIdService,
  deleteInventoryService,
  getInventoryByIdService,
  getInventoryService
} from '../services/inventory.service'
import {
  CreateInventoryIdRequestBody,
  CreateInventorySchema,
  InventoryIdParamsRequestBody,
  InventoryIdParamsSchema
} from '../../validators/inventory.validator'

export const getInventories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getInventoryService()

    res.status(200).json({
      message: 'Success',
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const getInventoriesById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedParams: InventoryIdParamsRequestBody =
      InventoryIdParamsSchema.parse(req.params)

    const result = await getInventoryByIdService(validatedParams.id)

    res.status(200).json({
      message: 'Success',
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const createInventoriesById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedParams: CreateInventoryIdRequestBody =
      CreateInventorySchema.parse(req.body)

    const result = await createInventoryByIdService(validatedParams)

    res.status(201).json({
      message: 'Success',
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const deleteInventories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedParams: InventoryIdParamsRequestBody =
      InventoryIdParamsSchema.parse(req.params)
    const result = await deleteInventoryService(validatedParams.id)

    res.status(200).json({
      message: 'Success',
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}
