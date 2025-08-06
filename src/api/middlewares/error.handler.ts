import { NextFunction, Request, Response } from 'express'
import { HttpError } from '../../types/global'
import { logger } from '../../utils/logger'

const TAG = 'SYSTEM'

export const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    })
  }

  logger.error(TAG, 'Unhandled Error:', err)
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  })
}
