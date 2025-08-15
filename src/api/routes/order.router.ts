import { Router } from 'express'
import {
  deleteAllOrderAndQueue,
  dispenseNewPrescription,
  getOrderDispense,
  pickupNextDrug
} from '../controllers/order.controller'
import { verifyToken } from '../middlewares/token.middleware'

const orderRouter = Router()

orderRouter.get('/', verifyToken, getOrderDispense)
orderRouter.post('/dispense/:rfid', verifyToken, dispenseNewPrescription)
orderRouter.post('/pickup/:orderId', verifyToken, pickupNextDrug)
orderRouter.delete('/order', verifyToken, deleteAllOrderAndQueue)

export default orderRouter
