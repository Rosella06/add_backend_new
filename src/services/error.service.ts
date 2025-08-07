import prisma from '../config/prisma'
import { logger } from '../utils/logger'

const TAG = 'ErrorService'

interface FailedJobPayload {
  queueName: string
  error: Error
  payload: object
}

export async function logFailedJob (data: FailedJobPayload): Promise<void> {
  try {
    await prisma.systemErrors.create({
      data: {
        queueName: data.queueName,
        errorMessage: data.error.message,
        stackTrace: data.error.stack,
        payload: data.payload
      }
    })
    logger.info(
      TAG,
      `Successfully logged a failed job from queue: ${data.queueName}`
    )
  } catch (dbError) {
    logger.error(
      TAG,
      'FATAL: Could not write failed job to the database!',
      dbError
    )
  }
}
