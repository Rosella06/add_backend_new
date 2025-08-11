import { Drugs } from '@prisma/client'
import prisma from '../../config/prisma'
import { HttpError } from '../../types/global'

export const getDrugService = async (): Promise<Drugs[]> => {
  try {
    const result = await prisma.drugs.findMany()
    return result
  } catch (error) {
    throw error
  }
}

export const getDrugByIdService = async (drugId: string): Promise<Drugs> => {
  try {
    const result = await prisma.drugs.findFirst({
      where: { id: drugId }
    })

    if (!result) {
      throw new HttpError(404, `Drug ${drugId} not found.`)
    }

    return result
  } catch (error) {
    throw error
  }
}

export const deleteDrugService = async (drugId: string): Promise<Drugs> => {
  try {
    const findDrug = await prisma.drugs.findFirst({
      where: { id: drugId }
    })

    if (!findDrug) {
      throw new HttpError(404, `Drug ${drugId} not found.`)
    }

    const result = await prisma.drugs.delete({
      where: { id: drugId }
    })

    return result
  } catch (error) {
    throw error
  }
}
