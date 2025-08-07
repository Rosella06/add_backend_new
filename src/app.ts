import express from 'express'
import cors from 'cors'
import apiRoutes from './api/routes'
import { globalErrorHandler } from './api/middlewares/error.handler'
import httpLoggerMiddleware from './api/middlewares/httpLogger.middleware'

const app = express()

// Middlewares
app.use(cors({ origin: '*' }))
app.use(express.json())
app.use(httpLoggerMiddleware)

// API Routes
app.use('/api', apiRoutes)

// Global Error Handler
app.use(globalErrorHandler)

export { app }
