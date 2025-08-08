import { Router } from 'express'
import { verifyToken } from '../middlewares/token.middleware'

const userRouter = Router()

userRouter.get('/', verifyToken, )

export default userRouter
