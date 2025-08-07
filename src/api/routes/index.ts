import express, { Request, Response, Router, NextFunction } from 'express'
import orderRouter from './order.router'
import { BaseResponse } from '../../types/global'
import authRouter from './auth.router'

const router = Router()

router.use('/auth', authRouter)
router.use('/orders', orderRouter)
router.use(
  '/img',
  express.static(
    process.env.NODE_ENV === 'development'
      ? 'src/public/images'
      : 'public/images'
  )
)
router.use('/', (_req: Request, res: Response<BaseResponse>, _next: NextFunction) => {
  res.status(404).json({
    message: 'Not Found',
    success: false,
    data: null
  })
})

export default router
