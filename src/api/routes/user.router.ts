import { Router } from 'express'
import { verifyToken } from '../middlewares/token.middleware'
import { deleteUser, editUser, getUser, getUserById } from '../controllers/user.controller'

const userRouter = Router()

userRouter.get('/', verifyToken, getUser)
userRouter.get('/:id', verifyToken, getUserById)
userRouter.patch('/:id', verifyToken, editUser)
userRouter.delete('/:id', verifyToken, deleteUser)

export default userRouter
