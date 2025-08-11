import { NextFunction, Request, Response } from 'express'
import { createMachineService, deleteMachineService, getMachineService } from '../services/machine.service'
import {
  CreateMachineRequestBody,
  CreateMachineSchema,
  deleteMachineRequestParams,
  deleteMachineSchema
} from '../../validators/machine.validator'

export const getMachine = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getMachineService()

    res.status(200).json({
      success: true,
      message: `A list of machines.`,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const createMachine = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedBody: CreateMachineRequestBody = CreateMachineSchema.parse(
      req.body
    )

    const result = await createMachineService(validatedBody.machineName, validatedBody.ipAddress)

    res.status(201).json({
      success: true,
      message: `A list of machines.`,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const deleteMachine = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedBody: deleteMachineRequestParams = deleteMachineSchema.parse(
      req.params
    )

    const result = await deleteMachineService(validatedBody.id)

    res.status(200).json({
      success: true,
      message: `A list of machines.`,
      data: result
    })
  } catch (error) {
    next(error)
  }
}
