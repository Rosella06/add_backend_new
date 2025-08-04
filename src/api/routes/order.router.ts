import { Router } from 'express'
import {
  dispenseNewPrescription,
  pickupNextDrug
} from '../controllers/order.controller'

const orderRouter = Router()

orderRouter.post('/dispense', dispenseNewPrescription)
orderRouter.post('/pickup/:prescriptionId', pickupNextDrug)

export default orderRouter
