import { NextFunction, Request, Response } from 'express'
import { HttpError } from '../../types/global'
import { logger } from '../../utils/logger'

const TAG = 'SYSTEM-ERROR'

export const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500
  let message = ''

  if (err instanceof HttpError) {
    statusCode = err.statusCode
  }

  if (err instanceof Error) {
    logger.error(TAG, `${err.name}: ${err.message}`)
    message = err.message
  } else {
    logger.error(TAG, 'An unknown error occurred')
    message = `An unknown error occurred, ${String(err)}`
  }
  res.status(statusCode).send({
    message,
    success: false,
    data: null,
    traceStack:
      process.env.NODE_ENV === 'development' && err instanceof Error
        ? err.stack
        : undefined
  })
}
