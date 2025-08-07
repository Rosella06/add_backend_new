import morgan, { StreamOptions, TokenIndexer } from 'morgan'
import { Request, Response } from 'express'
import { logger } from '../../utils/logger'

const TAG = 'HTTP'

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  fg: {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    white: '\x1b[37m'
  }
}

morgan.token('colored-method', (req: Request, res: Response) => {
  const method = req.method
  let color = colors.fg.white
  switch (method) {
    case 'GET':
      color = colors.fg.green
      break
    case 'POST':
      color = colors.fg.cyan
      break
    case 'PUT':
      color = colors.fg.yellow
      break
    case 'DELETE':
      color = colors.fg.red
      break
    case 'PATCH':
      color = colors.fg.magenta
      break
  }
  return `${color}${method}${colors.reset}`
})

morgan.token('colored-status', (req: Request, res: Response) => {
  const status = res.statusCode
  let color = colors.fg.white
  if (status >= 500) {
    color = colors.fg.red
  } else if (status >= 400) {
    color = colors.fg.yellow
  } else if (status >= 300) {
    color = colors.fg.cyan
  } else if (status >= 200) {
    color = colors.fg.green
  }
  return `${color}${status}${colors.reset}`
})

const stream: StreamOptions = {
  write: message => logger.info(TAG, message.trim())
}

const morganFormat = ':colored-method :url :colored-status - :response-time ms'

const httpLoggerMiddleware = morgan(morganFormat, { stream })

export default httpLoggerMiddleware
