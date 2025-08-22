import { NextFunction, Request, Response } from 'express'
import {
  createDrugService,
  deleteDrugService,
  editDrugService,
  getDrugByIdService,
  getDrugService
} from '../services/drug.service'
import {
  CreateDrugRequestBody,
  CreateDrugSchema,
  DrugIdParamsRequestBody,
  DrugIdParamsSchema,
  EditDrugRequestBody,
  EditDrugSchema
} from '../../validators/drug.validator'
import { deleteImagePath } from '../../utils/upload'

export const getDrug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getDrugService()

    res.status(200).json({
      message: 'Success',
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const getDrugById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedParams: DrugIdParamsRequestBody = DrugIdParamsSchema.parse(
      req.params
    )

    const result = await getDrugByIdService(validatedParams.id)

    res.status(200).json({
      message: 'Success',
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const createDrug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedBody: CreateDrugRequestBody = CreateDrugSchema.parse(
      req.body
    )

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Drug image file is required.'
      })
    }

    const imageFile = req.file

    const result = await createDrugService(validatedBody, imageFile)

    res.status(201).json({
      message: 'Success',
      success: true,
      data: result
    })
  } catch (error) {
    if (req.file) await deleteImagePath('drugs', req.file.filename)

    next(error)
  }
}

export const editDrug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedBody: EditDrugRequestBody = EditDrugSchema.parse(
      req.body
    )
    const validatedParams: DrugIdParamsRequestBody = DrugIdParamsSchema.parse(
      req.params
    )

    const imageFile = req.file

    const result = await editDrugService(
      validatedParams.id,
      validatedBody,
      imageFile
    )

    res.status(200).json({
      message: 'Success',
      success: true,
      data: result
    })
  } catch (error) {
    if (req.file) await deleteImagePath('drugs', req.file.filename)

    next(error)
  }
}

export const deleteDrug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedParams: DrugIdParamsRequestBody = DrugIdParamsSchema.parse(
      req.params
    )

    const result = await deleteDrugService(validatedParams.id)

    res.status(200).json({
      message: 'Success',
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}
