import { Drugs } from '@prisma/client'
import prisma from '../../config/prisma'
import { HttpError } from '../../types/global'
import {
  CreateDrugRequestBody,
  EditDrugRequestBody
} from '../../validators/drug.validator'
import { v4 as uuidv4 } from 'uuid'
import { deleteImagePath } from '../../utils/upload'
import { getDateFormat } from '../../utils/date.format'

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

export const createDrugService = async (
  drugData: CreateDrugRequestBody,
  imageFile: Express.Multer.File
): Promise<Drugs> => {
  try {
    const { drugCode, drugName } = drugData

    const findDrug = await prisma.drugs.findUnique({
      where: { drugCode }
    })

    if (findDrug) {
      await deleteImagePath('drugs', imageFile.filename)
      throw new HttpError(409, 'This drug code is already taken.')
    }

    const UUID = `DID-${uuidv4()}`
    const result = await prisma.drugs.create({
      data: {
        id: UUID,
        drugCode: drugCode,
        drugName: drugName,
        drugImage: !imageFile ? null : `/img/drugs/${imageFile.filename}`,
        drugStatus: true,
        createdAt: getDateFormat(new Date()),
        updatedAt: getDateFormat(new Date())
      }
    })
    return result
  } catch (error) {
    if (imageFile) {
      await deleteImagePath('drugs', imageFile.filename)
    }

    throw error
  }
}

export const editDrugService = async (
  drugId: string,
  drugData: EditDrugRequestBody,
  imageFile: Express.Multer.File | undefined
): Promise<Drugs> => {
  try {
    const { drugCode, drugName, drugStatus } = drugData

    const findDrug = await prisma.drugs.findFirst({
      where: { id: drugId }
    })

    if (!findDrug && imageFile) {
      await deleteImagePath('drugs', imageFile.filename)
      throw new HttpError(404, 'This drug code not found.')
    }

    const result = await prisma.drugs.update({
      where: { id: drugId },
      data: {
        drugCode: drugCode,
        drugName: drugName,
        drugImage: !imageFile
          ? findDrug?.drugImage
          : `/img/drugs/${imageFile.filename}`,
        drugStatus: drugStatus,
        updatedAt: getDateFormat(new Date())
      }
    })
    return result
  } catch (error) {
    if (imageFile) {
      await deleteImagePath('drugs', imageFile.filename)
    }

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

    if (findDrug.drugImage) {
      await deleteImagePath('drugs', findDrug.drugImage.split('/')[3])
    }

    return result
  } catch (error) {
    throw error
  }
}
