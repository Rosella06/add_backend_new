import { v4 as uuidv4 } from 'uuid'
import prisma from '../../config/prisma'
import { Users } from '@prisma/client'

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
