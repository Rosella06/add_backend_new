import { NextFunction, Request, Response } from 'express'
import { getUserService } from '../services/user.service'

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
