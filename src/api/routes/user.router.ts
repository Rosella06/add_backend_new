import { Router } from 'express'
import { verifyToken } from '../middlewares/token.middleware'
import { getUser } from '../controllers/user.controller'

const userRouter = Router()

userRouter.get('/', verifyToken, getUser)

export default userRouter
