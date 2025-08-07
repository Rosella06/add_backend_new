import { Role } from '@prisma/client'

type LoginResponse = {
  token: string
  id: string
  userRole: string
  userStatus: boolean
  displayName: string
  userImage: string | null
}

type PinCodeResponse = {
  pinCode: string | null
}

type CreateUserResponse = {
  id: string
  userName: string
  displayName: string
  userImage: string | null
  userRole: Role
}

export type { LoginResponse, PinCodeResponse, CreateUserResponse }
