import { v4 as uuidv4 } from 'uuid'
import prisma from '../../config/prisma'
import { Users } from '@prisma/client'
import { HttpError } from '../../types/global'
import { deleteImagePath } from '../../utils/upload'

export const getUserService = async (): Promise<Users[]> => {
  try {
    const result = await prisma.users.findMany({
      select: {
        id: true,
        userName: true,
        displayName: true,
        userImage: true,
        userRole: true,
        userStatus: true,
        createBy: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return result as unknown as Users[]
  } catch (error) {
    throw error
  }
}

export const getUserByIdService = async (userId: string): Promise<Users> => {
  try {
    const result = await prisma.users.findFirst({
      where: { id: userId },
      select: {
        id: true,
        userName: true,
        displayName: true,
        userImage: true,
        userRole: true,
        userStatus: true,
        createBy: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return result as unknown as Users
  } catch (error) {
    throw error
  }
}

export const editUserService = async (): Promise<Users> => {
  try {
    const result = await prisma.users.findFirst({

    })
    return result as unknown as Users
  } catch (error) {
    throw error
  }
}

export const deleteUserService = async (userId: string): Promise<string> => {
  try {
    const findUser = await prisma.users.findFirst({
      where: { id: userId }
    })

    if (!findUser) {
      throw new HttpError(404, 'User not found')
    }

    const result = await prisma.users.delete({
      where: { id: userId },
      select: {
        userName: true,
        userImage: true
      }
    })

    if (result.userImage) {
      await deleteImagePath('users', result.userImage.split('/')[3])
    }

    return `This ${result.userName} has been deleted`
  } catch (error) {
    throw error
  }
}
