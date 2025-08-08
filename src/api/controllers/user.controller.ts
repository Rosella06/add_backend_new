import { NextFunction, Request, Response } from 'express'
import { deleteUserService, editUserService, getUserByIdService, getUserService } from '../services/user.service'
import {
  UserIdRequestBody,
  UserIdSchema
} from '../../validators/user.validator'

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getUserService()

    res.status(200).json({
      message: 'Success',
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedBody: UserIdRequestBody = UserIdSchema.parse(req.params)

    const result = await getUserByIdService(validatedBody.id)

    res.status(200).json({
      message: 'Success',
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const editUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedBody: UserIdRequestBody = UserIdSchema.parse(req.params)

    const result = await editUserService()

    res.status(200).json({
      message: 'Success',
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedBody: UserIdRequestBody = UserIdSchema.parse(req.params)

    const result = await deleteUserService(validatedBody.id)

    res.status(200).json({
      message: 'Success',
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}
