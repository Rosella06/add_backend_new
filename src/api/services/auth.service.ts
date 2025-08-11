import { Users } from '@prisma/client'
import prisma from '../../config/prisma'
import { HttpError } from '../../types/global'
import { sign } from 'jsonwebtoken'
import CryptoJS from 'crypto-js'
import { CreateUserResponse, PinCodeResponse } from '../../types/user'
import { CreateUserRequestBody } from '../../validators/auth.validator'
import { deleteImagePath } from '../../utils/upload'
import { hashPassword, hashPasswordCompare } from '../../utils/hash'
import { v4 as uuidv4 } from 'uuid'
import { getDateFormat } from '../../utils/date.format'

export const userLoginWithQrCodeService = async (
  pinCode: string
): Promise<Users> => {
  let decryptPinCode: string

  try {
    decryptPinCode = CryptoJS.AES.decrypt(
      pinCode,
      `${process.env.CRYPTO_SECRET}`
    ).toString(CryptoJS.enc.Utf8)

    if (!decryptPinCode) {
      throw new Error('Decryption failed')
    }
  } catch (e) {
    throw new HttpError(400, 'Invalid PIN format.')
  }

  try {
    const findUser = await prisma.users.findFirst({ where: { pinCode } })

    if (!findUser) throw new HttpError(404, 'User not found.')
    if (!findUser.userStatus) throw new HttpError(403, 'User is inactive.')

    const encryptPinCode = CryptoJS.AES.decrypt(
      String(findUser.pinCode),
      `${process.env.CRYPTO_SECRET}`
    ).toString(CryptoJS.enc.Utf8)

    const match = decryptPinCode.includes(encryptPinCode)
    if (match) {
      const {
        id: id,
        userRole: userRole,
        userImage: userImage,
        displayName: displayName,
        userStatus: userStatus
      } = findUser
      const token: string = sign(
        { id, userRole, displayName, userStatus },
        String(process.env.JWT_SECRET),
        { expiresIn: '7d' }
      )
      return {
        token,
        id,
        userRole,
        userStatus,
        displayName,
        userImage
      } as unknown as Users
    } else {
      throw new HttpError(403, 'Password incorrect')
    }
  } catch (error) {
    throw error
  }
}

export const userLoginWithUsernameService = async (
  userName: string,
  userPassword: string
): Promise<Users> => {
  try {
    const findUser = await prisma.users.findFirst({
      where: { userName: userName.toLowerCase() }
    })

    if (!findUser) throw new HttpError(404, 'User not found.')
    if (!findUser.userStatus) throw new HttpError(403, 'User is inactive.')

    const match = await hashPasswordCompare(
      userPassword.toLowerCase(),
      findUser.userPassword
    )

    if (!match) throw new HttpError(403, 'Password incorrect.')

    const {
      id: id,
      userRole: userRole,
      userImage: userImage,
      displayName: displayName,
      userStatus: userStatus
    } = findUser
    const token: string = sign(
      { id, userRole, displayName, userStatus },
      String(process.env.JWT_SECRET),
      { expiresIn: '7d' }
    )
    return {
      token,
      id,
      userRole,
      userStatus,
      displayName,
      userImage
    } as unknown as Users
  } catch (error) {
    throw error
  }
}

export const generateUserQrCodeService = async (
  userId: string
): Promise<PinCodeResponse> => {
  try {
    const findUser = await prisma.users.findFirst({
      where: { id: userId }
    })

    if (!findUser) throw new HttpError(404, 'User not found.')
    if (!findUser.pinCode)
      throw new HttpError(403, 'Pincode is not registered.')

    return { pinCode: findUser.pinCode }
  } catch (error) {
    throw error
  }
}

export const createUserPinCodeService = async (
  userId: string,
  pinCode: string
): Promise<PinCodeResponse> => {
  try {
    const findUser = await prisma.users.findFirst({
      where: { id: userId }
    })

    if (!findUser) throw new HttpError(404, 'User not found.')

    const pinCodeEncrypt = CryptoJS.AES.encrypt(
      pinCode.toLowerCase(),
      `${process.env.CRYPTO_SECRET}`
    ).toString()

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: { pinCode: pinCodeEncrypt }
    })

    return { pinCode: updatedUser.pinCode }
  } catch (error) {
    throw error
  }
}

export const createUserService = async (
  userData: CreateUserRequestBody,
  imageFile: Express.Multer.File
): Promise<CreateUserResponse> => {
  try {
    const { userName, userPassword, displayName, userRole } = userData

    const findUser = await prisma.users.findUnique({
      where: { userName }
    })

    if (findUser) {
      await deleteImagePath('users', imageFile.filename)
      throw new HttpError(409, 'This username is already taken.')
    }

    const UUID = `UID-${uuidv4()}`
    const result = await prisma.users.create({
      select: {
        id: true,
        userName: true,
        displayName: true,
        userImage: true,
        userRole: true
      },
      data: {
        id: UUID,
        userName: userName.toLowerCase(),
        userPassword: await hashPassword(userPassword.toLowerCase()),
        displayName: displayName,
        userImage: !imageFile ? null : `/img/users/${imageFile.filename}`,
        userRole: userRole,
        userStatus: true,
        createdAt: getDateFormat(new Date()),
        updatedAt: getDateFormat(new Date())
      }
    })
    return result
  } catch (error) {
    if (imageFile.filename) {
      await deleteImagePath('users', imageFile.filename)
    }
    throw error
  }
}
