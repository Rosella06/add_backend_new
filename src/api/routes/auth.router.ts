import { Router } from 'express'
import { upload } from '../../utils/upload'
import { createUser, createUserPinCode, generateUserQrCode, userLogin } from '../controllers/auth.controller'

const authRouter = Router()

authRouter.get('/qr/:id', generateUserQrCode)
authRouter.post('/login', userLogin)
authRouter.post('/pincode', createUserPinCode)
authRouter.post('/register', upload.single('upload'), createUser)

export default authRouter
