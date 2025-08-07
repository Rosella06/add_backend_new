export class HttpError extends Error {
  statusCode: number
  constructor (statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
  }
}

interface BaseResponse<T = unknown> {
  message?: string
  success?: boolean
  data?: T
  traceStack?: string
}

export { BaseResponse }
