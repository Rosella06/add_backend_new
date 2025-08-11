import { Router } from 'express'
import { verifyToken } from '../middlewares/token.middleware'
import { plcSendCommand, plcSendCommandM } from '../controllers/plc.controller'

const plcRouter = Router()

plcRouter.post('/send', verifyToken, plcSendCommand)
plcRouter.post('/sendM', verifyToken, plcSendCommandM)

export default plcRouter
