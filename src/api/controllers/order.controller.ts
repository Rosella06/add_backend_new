import { NextFunction, Request, Response } from 'express'
import * as orderService from '../services/order.service'
import { pickupService } from '../../services/machine/pickup.service'
import { HttpError } from '../../types/global'
import { AuthHeaderSchema } from '../../validators/token.validator'
import { verify } from 'jsonwebtoken'
import { UserJwtPayload } from '../../types/order'
import {
  DispenseOrderIdParamsSchema,
  DispenseOrderRequestBody,
  DispenseOrderRequestParams,
  DispenseOrderSchema,
  PickupNextDrugRequestBody,
  PickupNextDrugSchema
} from '../../validators/order.validator'
import { socketService } from '../../utils/socket.service'

export const getOrderDispense = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = AuthHeaderSchema.parse(authHeader)
    const decoded = verify(
      token,
      String(process.env.JWT_SECRET)
    ) as UserJwtPayload

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
    const validatedBody: DispenseOrderRequestBody = DispenseOrderSchema.parse(
      req.body
    )
    const validatedParams: DispenseOrderRequestParams =
      DispenseOrderIdParamsSchema.parse(req.params)
    const authHeader = req.headers.authorization
    const token = AuthHeaderSchema.parse(authHeader)
    const decoded = verify(
      token,
      String(process.env.JWT_SECRET)
    ) as UserJwtPayload

    if (!validatedParams.rfid || !validatedBody.machineId) {
      throw new HttpError(400, 'RFID and Machine ID are required.')
    }

    const prescription = await orderService.createPrescriptionFromPharmacy(
      validatedParams.rfid,
      validatedBody.machineId,
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
    const validatedBody: PickupNextDrugRequestBody = PickupNextDrugSchema.parse(
      req.params
    )
    const orderToPickup = await orderService.findNextOrderToPickup(
      validatedBody.presciptionNo,
      validatedBody.drugCode
    )

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
        `Order for prescription and drug ${validatedBody.presciptionNo}/${validatedBody.drugCode} is missing machineId or slot information.`
      )
    }

    const slotAvailable = slot === 'M01' ? 'right' : 'left'

    await orderService.updateOrderStatus(id, 'pickup')
    socketService.getIO().emit('drug_dispensed', {
      orderId: id,
      data: null,
      message: 'Update order to pickup.'
    })
    await pickupService.initiatePickup(id, machineId, slotAvailable)

    await orderService.updatePresciptionComplete(validatedBody.presciptionNo)

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
    const validatedBody: DispenseOrderRequestBody = DispenseOrderSchema.parse(
      req.body
    )

    if (!validatedBody.machineId) {
      throw new HttpError(404, `Machine id is missing.`)
    }

    const deleteResult = await orderService.deleteAllOrder(
      validatedBody.machineId
    )

    res.status(200).json({
      success: true,
      message: ``,
      data: deleteResult
    })
  } catch (error) {
    next(error)
  }
}
