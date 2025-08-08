import { NextFunction, Request, Response } from 'express'
import {
  deleteUserService,
  editUserService,
  getUserByIdService,
  getUserService
} from '../services/user.service'
import {
  UpdateRequestBody,
  UpdateUserSchema,
  UserIdRequestBody,
  UserIdSchema
} from '../../validators/user.validator'
import { HttpError } from '../../types/global'
import { deleteImagePath } from '../../utils/upload'

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
    const validatedParams: UserIdRequestBody = UserIdSchema.parse(req.params)

    const result = await getUserByIdService(validatedParams.id)

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
    const validatedParams = UserIdSchema.safeParse(req.params)
    const validatedBody = UpdateUserSchema.safeParse(req.body)

    if (!validatedParams.success) {
      if (req.file) {
        await deleteImagePath('users', req.file.filename)
      }
      throw new HttpError(400, 'Invalid user ID format.')
    }

    if (!validatedBody.success) {
      if (req.file) {
        await deleteImagePath('users', req.file.filename)
      }
      return next(
        new HttpError(
          400,
          'Validation failed. Please check your input.',
          validatedBody.error.flatten()
        )
      )
    }

    const userId = validatedParams.data.id
    const body = validatedBody.data

    const imageFile = req.file

    const result = await editUserService(userId, body, imageFile)

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
    const validatedParams: UserIdRequestBody = UserIdSchema.parse(req.params)

    const result = await deleteUserService(validatedParams.id)

    res.status(200).json({
      message: 'Success',
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}
