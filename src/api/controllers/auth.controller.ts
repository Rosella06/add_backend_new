import { NextFunction, Request, Response } from 'express'
import { Users } from '@prisma/client'
import {
  LoginSchema,
  GenerateQrCodeSchema,
  CreatePinCodeSchema,
  LoginRequestBody,
  GenerateRequestBody,
  CreateRequestBody,
  CreateUserRequestBody,
  CreateUserSchema
} from '../../validators/auth.validator'
import {
  createUserPinCodeService,
  createUserService,
  generateUserQrCodeService,
  userLoginWithQrCodeService,
  userLoginWithUsernameService
} from '../services/auth.service'
import z from 'zod'
import { deleteImagePath } from '../../utils/upload'

export const userLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedBody: LoginRequestBody = LoginSchema.parse(req.body)

    if ('pinCode' in validatedBody) {
      const result = await userLoginWithQrCodeService(validatedBody.pinCode)

      res.status(200).json({
        message: 'Success',
        success: true,
        data: result
      })
    } else if ('username' in validatedBody) {
      const result = await userLoginWithUsernameService(
        validatedBody.userName,
        validatedBody.userPassword
      )

      res.status(200).json({
        message: 'Success',
        success: true,
        data: result
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request body',
        errors: error.flatten().fieldErrors
      })
    }

    next(error)
  }
}

export const generateUserQrCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedBody: GenerateRequestBody = GenerateQrCodeSchema.parse(
      req.body
    )

    const result = await generateUserQrCodeService(validatedBody.id)

    res.status(200).json({
      message: 'Success',
      success: true,
      data: result
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request body',
        errors: error.flatten().fieldErrors
      })
    }

    next(error)
  }
}

export const createUserPinCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedBody: CreateRequestBody = CreatePinCodeSchema.parse(req.body)

    const result = await createUserPinCodeService(
      validatedBody.id,
      validatedBody.pinCode
    )

    res.status(200).json({
      message: 'Success',
      success: true,
      data: result
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request body',
        errors: error.flatten().fieldErrors
      })
    }

    next(error)
  }
}

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedBody: CreateUserRequestBody = CreateUserSchema.parse(
      req.body
    )

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'User image file is required.'
      })
    }

    const imageFile = req.file

    const result = await createUserService(validatedBody, imageFile)

    res.status(200).json({
      message: 'Success',
      success: true,
      data: result
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      if (req.file) deleteImagePath('public/images/users', req.file.filename)

      return res.status(400).json({
        success: false,
        message: 'Invalid request body',
        errors: error.flatten().fieldErrors
      })
    }

    next(error)
  }
}
