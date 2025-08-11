import express, { Request, Response, Router, NextFunction } from 'express'
import { BaseResponse } from '../../types/global'
import orderRouter from './order.router'
import authRouter from './auth.router'
import userRouter from './user.router'
import machineRouter from './machine.router'
import inventoryRouter from './inventory.router'
import drugRouter from './drug.router'
import plcRouter from './plc.router'

const router = Router()

router.use('/auth', authRouter)
router.use('/users', userRouter)
router.use('/drugs', drugRouter)
router.use('/inventory', inventoryRouter)
router.use('/machines', machineRouter)
router.use('/plc', plcRouter)
router.use('/orders', orderRouter)
router.use(
  '/img',
  express.static(
    process.env.NODE_ENV === 'development'
      ? 'src/public/images'
      : 'public/images'
  )
)
router.use(
  '/',
  (_req: Request, res: Response<BaseResponse>, _next: NextFunction) => {
    res.status(404).json({
      message: 'Not Found',
      success: false,
      data: null
    })
  }
)

export default router
