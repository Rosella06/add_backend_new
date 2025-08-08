import { NextFunction, Request, Response } from 'express'
import { HttpError } from '../../types/global'
import { logger } from '../../utils/logger'
import { ZodError } from 'zod'

const TAG = 'SYSTEM-ERROR'

export const globalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ZodError) {
    logger.warn(TAG, 'Zod validation error occurred:', err.flatten())
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please check your input.',
      errors: err.flatten()
    })
  }

  if (err instanceof HttpError) {
    if (err.statusCode >= 500) {
      logger.error(TAG, `HttpError (${err.statusCode}): ${err.message}`, {
        data: err.data,
        stack: err.stack
      })
    } else {
      logger.warn(
        TAG,
        `HttpError (${err.statusCode}): ${err.message}`,
        err.data ? { data: err.data } : ''
      )
    }

    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.data && { errors: err.data })
    })
  }

  const response = {
    success: false,
    message: 'An internal server error occurred. Please try again later.',
    stack:
      process.env.NODE_ENV === 'development' && err instanceof Error
        ? err.stack
        : undefined
  }

  logger.error(
    TAG,
    'An unexpected error occurred and was caught by the global handler:',
    err
  )

  return res.status(500).json(response)
}
