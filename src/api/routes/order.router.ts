import { Router } from 'express'
import {
  deleteAllOrderAndQueue,
  dispenseNewPrescription,
  getOrderDispense,
  pickupNextDrug
} from '../controllers/order.controller'

const orderRouter = Router()

orderRouter.get('/order', getOrderDispense)
orderRouter.post('/dispense', dispenseNewPrescription)
orderRouter.post('/pickup/:orderId', pickupNextDrug)
orderRouter.delete('/order', deleteAllOrderAndQueue)

export default orderRouter
