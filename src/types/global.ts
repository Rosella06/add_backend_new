export class HttpError extends Error {
  statusCode: number
  data?: any

  constructor (statusCode: number, message: string, data?: any) {
    super(message)
    this.statusCode = statusCode
    this.data = data
  }
}

interface BaseResponse<T = unknown> {
  message?: string
  success?: boolean
  data?: T
  traceStack?: string
}

export { BaseResponse }
