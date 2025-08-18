import prisma from '../../config/prisma'
import { getPharmacyPrescriptionData } from './pharmacy.service'
import { rabbitService } from '../../services/rabbitmq/rabbitmq.service'
import { HttpError } from '../../types/global'
import { Orders, Prescription } from '@prisma/client'
import { logger } from '../../utils/logger'
import { v4 as uuidv4 } from 'uuid'
import { getDateFormat } from '../../utils/date.format'

const EXCHANGE_NAME = 'drug_dispenser_exchange'
const TAG = 'ORDER-SERVICE'

export async function getOrderDispenseService (
  userId: string
): Promise<Prescription[]> {
  const results = await prisma.prescription.findFirst({
    where: { userId },
    include: {
      orders: {
        include: { drug: true },
        orderBy: [{ floor: 'asc' }, { position: 'asc' }]
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return results as unknown as Prescription[]
}

export async function createPrescriptionFromPharmacy (
  rfid: string,
  machineId: string,
  userId: string
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

  if (!rabbitService.isReady()) {
    logger.error(
      TAG,
      'RabbitMQ is not connected. Aborting prescription creation.'
    )

    throw new HttpError(
      503,
      'Message queue service is currently unavailable. Please try again later.'
    )
  }

  const PID = `PID-${uuidv4()}`
  const transactionResult = await prisma.$transaction(async tx => {
    const newPrescription = await tx.prescription.create({
      data: {
        id: PID,
        prescriptionNo: pharmacyData.PrescriptionNo,
        userId: userId,
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

    const ordersData = await Promise.all(
      pharmacyData.Prescription.map(async item => {
        const drug = await tx.drugs.findUnique({
          where: { drugCode: item.f_orderitemcode }
        })
        if (!drug) {
          throw new HttpError(
            404,
            `Drug with code ${item.f_orderitemcode} not found in our system.`
          )
        }
        const OID = `OID-${uuidv4()}`

        return {
          id: OID,
          orderItemName: item.f_orderitemname,
          quantity: item.f_orderqty,
          unitCode: item.f_orderunitcode,
          floor: parseInt(item.f_binlocation.substring(0, 1)),
          position: parseInt(item.f_binlocation.substring(1)),
          prescriptionNo: newPrescription.prescriptionNo,
          drugCode: drug.drugCode,
          machineId: machineId,
          status: 'ready'
        }
      })
    )

    const sortedOrdersData = ordersData.sort((a, b) => {
      if (a.floor !== b.floor) {
        return a.floor - b.floor
      }
      return a.position - b.position
    })

    await tx.orders.createMany({ data: sortedOrdersData })

    const createdOrders = await tx.orders.findMany({
      where: { prescriptionNo: newPrescription.prescriptionNo },
      include: { drug: true },
      orderBy: [{ floor: 'asc' }, { position: 'asc' }]
    })

    return { prescription: newPrescription, orders: createdOrders }
  })

  try {
    logger.info(
      TAG,
      `Transaction successful. Publishing ${transactionResult.orders.length} orders to RabbitMQ...`
    )
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
    logger.info(TAG, 'All orders published successfully.')
  } catch (publishError) {
    logger.error(
      TAG,
      `CRITICAL: DB transaction was committed, but failed to publish messages to RabbitMQ! Manual intervention required for Prescription ID: ${transactionResult.prescription.id}`,
      publishError
    )

    await prisma.prescription.delete({
      where: { id: transactionResult.prescription.id }
    })

    throw new HttpError(
      500,
      'Failed to queue the order after saving. The operation has been rolled back.'
    )
  }

  const finalOrder = {
    ...transactionResult.prescription,
    orders: transactionResult.orders
  }

  return finalOrder
}

export async function findNextOrderToPickup (
  presciptionNo: string,
  drugCode: string
) {
  return prisma.orders.findFirst({
    where: {
      prescriptionNo: presciptionNo,
      AND: {
        drugCode: drugCode,
        AND: { status: { in: ['dispensed', 'error'] } }
      }
    },
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

export async function updatePresciptionComplete (
  prescriptionNo: string
): Promise<Prescription | null> {
  const relatedOrders = await prisma.orders.findMany({
    where: { prescriptionNo },
    select: { status: true }
  })

  const allCompletedOrErrored = relatedOrders.every(
    o => o.status === 'complete' || o.status === 'error'
  )

  if (allCompletedOrErrored) {
    await prisma.prescription.update({
      where: { prescriptionNo },
      data: { status: 'complete', updatedAt: getDateFormat(new Date()) }
    })
  }

  return prisma.prescription.findFirst({
    where: {
      prescriptionNo,
      AND: { orders: { every: { status: { contains: 'complete' } } } }
    },
    include: { orders: true }
  })
}

export async function updateOrderSlot (
  orderId: string,
  slot: string
): Promise<Orders> {
  return prisma.orders.update({
    where: { id: orderId },
    data: { slot: slot }
  })
}

export async function deleteAllOrder (machineId: string): Promise<string> {
  const mainQueueName = `orders_queue_${machineId}`
  const errorQueueName = `error_queue_${machineId}`
  const retryQueueName = `retry_queue_${machineId}`

  await rabbitService.deleteQueue(mainQueueName)
  await rabbitService.deleteQueue(errorQueueName)
  await rabbitService.deleteQueue(retryQueueName)

  const prescriptionsToClear = await prisma.prescription.findMany({
    where: {
      orders: {
        some: {
          machineId: machineId
        }
      }
    },
    select: {
      id: true
    }
  })

  if (prescriptionsToClear.length === 0) {
    return `No pending prescriptions to clear for machine ${machineId}.`
  }

  const prescriptionIds = prescriptionsToClear.map(p => p.id)

  const deleteResult = await prisma.prescription.deleteMany({
    where: {
      id: {
        in: prescriptionIds
      }
    }
  })

  const message = `Successfully cleared ${deleteResult.count} prescription(s) and their associated orders for machine ${machineId}.`
  logger.debug(TAG, message)

  return message
}
