import { Router } from 'express'
import {
  deleteAllOrderAndQueue,
  dispenseNewPrescription,
  getOrderDispense,
  pickupNextDrug
} from '../controllers/order.controller'
import { verifyToken } from '../middlewares/token.middleware'

const orderRouter = Router()

orderRouter.get('/order', verifyToken, getOrderDispense)
orderRouter.post('/dispense', verifyToken, dispenseNewPrescription)
orderRouter.post('/pickup/:orderId', pickupNextDrug)
orderRouter.delete('/order', deleteAllOrderAndQueue)

export default orderRouter
