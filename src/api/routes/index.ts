import { Router } from 'express'
import orderRouter from './order.router'

const router = Router()

router.use('/orders', orderRouter)

export default router
