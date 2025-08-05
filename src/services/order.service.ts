import prisma from '../config/prisma'
import { getPharmacyPrescriptionData } from './pharmacy.service'
import { rabbitService } from './rabbitmq/rabbitmq.service'
import { HttpError } from '../types/global'
import { Orders, Prescription } from '@prisma/client'

const EXCHANGE_NAME = 'drug_dispenser_exchange'

export async function createPrescriptionFromPharmacy (
  rfid: string,
  machineId: string
): Promise<Prescription> {
  const pharmacyData = await getPharmacyPrescriptionData(rfid)

  const existingPrescription = await prisma.prescription.findUnique({
    where: { prescriptionNo: pharmacyData.PrescriptionNo }
  })
  if (existingPrescription) {
    throw new HttpError(
      409,
      `Prescription ${pharmacyData.PrescriptionNo} already exists.`
    )
  }

  const transactionResult = await prisma.$transaction(async tx => {
    const newPrescription = await tx.prescription.create({
      data: {
        prescriptionNo: pharmacyData.PrescriptionNo,
        prescriptionDate: '20240520',
        hn: pharmacyData.HN,
        an: '7654321',
        patientName: pharmacyData.PatientName,
        wardCode: 'W01',
        wardDesc: 'Test Ward',
        priorityCode: 'N',
        priorityDesc: 'Normal'
      }
    })

    // This is a simplified mapping. You might need to query your DB to match drug codes.
    const ordersData = await Promise.all(
      pharmacyData.Prescription.map(async item => {
        const drug = await tx.drugs.findUnique({
          where: { drugCode: item.f_orderitemcode }
        })
        if (!drug)
          throw new HttpError(
            404,
            `Drug with code ${item.f_orderitemcode} not found in our system.`
          )

        return {
          orderItemName: item.f_orderitemname,
          quantity: item.f_orderqty,
          unitCode: item.f_orderunitcode,
          floor: parseInt(item.f_binlocation.substring(0, 1)),
          position: parseInt(item.f_binlocation.substring(1)),
          prescriptionId: newPrescription.id,
          machineId: machineId,
          drugId: drug.id,
          status: 'ready'
        }
      })
    )

    await tx.orders.createMany({ data: ordersData })
    const createdOrders = await tx.orders.findMany({
      where: { prescriptionId: newPrescription.id }
    })

    return { prescription: newPrescription, orders: createdOrders }
  })

  for (const order of transactionResult.orders) {
    const message = {
      orderId: order.id,
      machineId: order.machineId,
      floor: order.floor,
      position: order.position,
      quantity: order.quantity
    }
    rabbitService.publishToExchange(EXCHANGE_NAME, order.machineId, message)
  }

  return transactionResult.prescription
}

export async function findNextOrderToPickup (orderId: string) {
  return prisma.orders.findFirst({
    where: { id: orderId, status: 'dispensed' },
    orderBy: { createdAt: 'asc' },
    include: { drug: true }
  })
}

export async function updateOrderStatus (
  orderId: string,
  status: string
): Promise<Orders> {
  return prisma.orders.update({
    where: { id: orderId },
    data: { status: status }
  })
}

export async function updateOrderSlot (
  orderId: string,
  slot: string
): Promise<Orders> {
  return prisma.orders.update({
    where: { id: orderId },
    data: { slot: slot === "right" ? "M01" : "M02" }
  })
}
