import { NextFunction, Request, Response } from 'express'
import { deleteDrugService, getDrugByIdService, getDrugService } from '../services/drug.service'
import { DrugIdParamsRequestBody, DrugIdParamsSchema } from '../../validators/drug.validator'

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
    const validatedParams: DrugIdParamsRequestBody = DrugIdParamsSchema.parse(req.params)

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
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Drug image file is required.'
      })
    }

    const imageFile = req.file

    res.status(201).json({
      message: 'Success',
      success: true,
      data: null
    })
  } catch (error) {
    next(error)
  }
}

export const editDrug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Drug image file is required.'
      })
    }

    const imageFile = req.file

    res.status(200).json({
      message: 'Success',
      success: true,
      data: null
    })
  } catch (error) {
    next(error)
  }
}

export const deleteDrug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedParams: DrugIdParamsRequestBody = DrugIdParamsSchema.parse(req.params)

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
