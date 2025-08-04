import { NextFunction, Request, Response } from 'express'
import * as orderService from '../../services/order.service'
import { pickupService } from '../../services/machine/pickup.service'
import { HttpError } from '../../types/global'

export const dispenseNewPrescription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { rfid, machineId } = req.body
    if (!rfid || !machineId) {
      throw new HttpError(400, 'RFID and Machine ID are required.')
    }

    const prescription = await orderService.createPrescriptionFromPharmacy(
      rfid,
      machineId
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
    const { prescriptionId } = req.params

    const orderToPickup = await orderService.findNextOrderToPickup(
      prescriptionId
    )

    if (!orderToPickup) {
      return res.status(404).json({
        success: false,
        message: 'No drugs are ready for pickup for this prescription.'
      })
    }

    const { id: orderId, machineId, slot, drug } = orderToPickup

    if (!machineId || !slot) {
      throw new HttpError(
        500,
        `Order ${orderId} is missing machineId or slot information.`
      )
    }

    await orderService.updateOrderStatus(orderId, 'pickup')
    await pickupService.initiatePickup(orderId, machineId, slot)

    res.status(200).json({
      success: true,
      message: `Opening door at slot ${slot} for drug: ${drug.drugName}`,
      data: { orderId, slot, drugName: drug.drugName }
    })
  } catch (error) {
    next(error)
  }
}
