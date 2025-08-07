import { Router } from 'express'
import { upload } from '../../utils/upload'
import {
  createUser,
  createUserPinCode,
  generateUserQrCode,
  userLogin
} from '../controllers/auth.controller'
import { verifyToken } from '../middlewares/token.middleware'

const authRouter = Router()

authRouter.get('/qr/:id', verifyToken, generateUserQrCode)
authRouter.post('/login', userLogin)
authRouter.post('/pincode', createUserPinCode)
authRouter.post('/register', upload.single('upload'), createUser)

export default authRouter
