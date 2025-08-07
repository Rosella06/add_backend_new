import { NextFunction, Request, Response } from 'express'
import * as orderService from '../services/order.service'
import { pickupService } from '../../services/machine/pickup.service'
import { HttpError } from '../../types/global'
import { AuthHeaderSchema } from '../../validators/token.validator'
import { verify } from 'jsonwebtoken'
import { logger } from '../../utils/logger'
import { UserJwtPayload } from '../../types/order'

export const getOrderDispense = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = AuthHeaderSchema.parse(authHeader)
    const decoded = verify(token, String(process.env.JWT_SECRET)) as UserJwtPayload

    const results = await orderService.getOrderDispenseService(decoded.id)

    res.status(200).json({
      success: true,
      message: `A list of order dispensing.`,
      data: results
    })
  } catch (error) {
    next(error)
  }
}

export const dispenseNewPrescription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { rfid, machineId } = req.body
    const authHeader = req.headers.authorization
    const token = AuthHeaderSchema.parse(authHeader)
    const decoded = verify(token, String(process.env.JWT_SECRET)) as UserJwtPayload

    if (!rfid || !machineId) {
      throw new HttpError(400, 'RFID and Machine ID are required.')
    }

    const prescription = await orderService.createPrescriptionFromPharmacy(
      rfid,
      machineId,
      decoded.id
    )

    res.status(201).json({
      success: true,
      message: `Prescription ${prescription.prescriptionNo} has been created and orders are being queued.`,
      data: prescription
    })
  } catch (error) {
    next(error)
  }
}

export const pickupNextDrug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params

    const orderToPickup = await orderService.findNextOrderToPickup(orderId)

    if (!orderToPickup) {
      return res.status(404).json({
        success: false,
        message: 'No drugs are ready for pickup for this prescription.'
      })
    }

    const { id, machineId, slot, drug } = orderToPickup

    if (!machineId || !slot) {
      throw new HttpError(
        500,
        `Order ${orderId} is missing machineId or slot information.`
      )
    }

    const slotAvailable = slot === 'M01' ? 'right' : 'left'

    await orderService.updateOrderStatus(id, 'pickup')
    await pickupService.initiatePickup(id, machineId, slotAvailable)

    res.status(200).json({
      success: true,
      message: `Opening door at slot ${slot} for drug: ${drug.drugName}`,
      data: { id, slot, drugName: drug.drugName }
    })
  } catch (error) {
    next(error)
  }
}

export const deleteAllOrderAndQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { machineId } = req.body

    if (!machineId) {
      throw new HttpError(404, `Machine id is missing.`)
    }

    const deleteResult = await orderService.deleteAllOrder(machineId)

    res.status(200).json({
      success: true,
      message: ``,
      data: deleteResult
    })
  } catch (error) {
    next(error)
  }
}
