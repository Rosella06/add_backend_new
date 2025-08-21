import { NextFunction, Request, Response } from 'express'
import {
  createMachineService,
  deleteMachineService,
  editMachineService,
  getMachineByIdService,
  getMachineOnlineService,
  getMachineService
} from '../services/machine.service'
import {
  MachineRequestBody,
  MachineSchema,
  paramsIdMachineRequestParams,
  paramsIdMachineSchema
} from '../../validators/machine.validator'
import { HttpError } from '../../types/global'

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

export const getMachineById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedParams: paramsIdMachineRequestParams =
      paramsIdMachineSchema.parse(req.params)

    const result = await getMachineByIdService(validatedParams.id)

    res.status(200).json({
      success: true,
      message: `A list of machines.`,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const getMachineOnline = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getMachineOnlineService()

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
    const validatedBody: MachineRequestBody = MachineSchema.parse(req.body)

    if (!validatedBody.machineName || !validatedBody.ipAddress) {
      throw new HttpError(
        409,
        `Machine name and ip address should not be empty.`
      )
    }

    const result = await createMachineService(
      validatedBody.machineName,
      validatedBody.ipAddress
    )

    res.status(201).json({
      success: true,
      message: `A list of machines.`,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const editMachine = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedBody: MachineRequestBody = MachineSchema.parse(req.body)
    const validatedParams: paramsIdMachineRequestParams =
      paramsIdMachineSchema.parse(req.params)

    const result = await editMachineService(validatedParams.id, validatedBody)

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
    const validatedParams: paramsIdMachineRequestParams =
      paramsIdMachineSchema.parse(req.params)

    const result = await deleteMachineService(validatedParams.id)

    res.status(200).json({
      success: true,
      message: `A list of machines.`,
      data: result
    })
  } catch (error) {
    next(error)
  }
}
