import express from 'express'
import cors from 'cors'
import apiRoutes from './api/routes'
import { globalErrorHandler } from './api/middlewares/error.handler'

const app = express()

// Middlewares
app.use(cors({ origin: '*' }))
app.use(express.json())

// API Routes
app.use('/api', apiRoutes)

// Global Error Handler
app.use(globalErrorHandler)

export { app }
