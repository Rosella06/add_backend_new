import express from 'express'
import cors from 'cors'
import apiRoutes from './api/routes'
import { globalErrorHandler } from './api/middlewares/error.handler'
import httpLoggerMiddleware from './api/middlewares/httpLogger.middleware'
import cookieParser from 'cookie-parser'

const app = express()

app.use(cors({ origin: process.env.FRONTENT_URL, credentials: true }))
app.use(express.json())
app.use(cookieParser())
app.use(httpLoggerMiddleware)

app.use('/api', apiRoutes)

app.use(globalErrorHandler)

export { app }
