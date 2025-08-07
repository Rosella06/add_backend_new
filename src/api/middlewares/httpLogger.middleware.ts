import morgan, { StreamOptions } from 'morgan'
import { logger } from '../../utils/logger'

const TAG = 'HTTP'

const stream: StreamOptions = {
  write: message => logger.debug(TAG, message.trim())
}

const morganFormat = ':method :url :status - :response-time ms'

const httpLoggerMiddleware = morgan(morganFormat, { stream })

export default httpLoggerMiddleware
