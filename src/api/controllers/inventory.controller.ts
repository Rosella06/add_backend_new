import { NextFunction, Request, Response } from 'express'
import {
  createInventoryService,
  deleteInventoryService,
  editInventoryService,
  getInventoryByIdService,
  getInventoryService,
  UpdateStockService
} from '../services/inventory.service'
import {
  CreateInventoryRequestBody,
  CreateInventorySchema,
  EditInventoryRequestBody,
  EditInventorySchema,
  InventoryIdParamsRequestBody,
  InventoryIdParamsSchema,
  UpdateStockRequestBody,
  UpdateStockSchema
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

export const createInventories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedParams: CreateInventoryRequestBody =
      CreateInventorySchema.parse(req.body)

    const result = await createInventoryService(validatedParams)

    res.status(201).json({
      message: 'Success',
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const editInventories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedBody: EditInventoryRequestBody = EditInventorySchema.parse(
      req.body
    )
    const validatedParams: InventoryIdParamsRequestBody =
      InventoryIdParamsSchema.parse(req.params)

    const result = await editInventoryService(validatedParams.id, validatedBody)

    res.status(200).json({
      message: 'Success',
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const updateStock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedBody: UpdateStockRequestBody = UpdateStockSchema.parse(
      req.body
    )
    const validatedParams: InventoryIdParamsRequestBody =
      InventoryIdParamsSchema.parse(req.params)

    const result = await UpdateStockService(validatedParams.id, validatedBody)

    res.status(200).json({
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
