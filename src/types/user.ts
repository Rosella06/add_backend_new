import { Role } from "@prisma/client"

interface LoginResponse {
  token: string
  id: string
  userRole: string
  userStatus: boolean
  displayName: string
  userImage: string | null
}

interface PinCodeResponse {
  pinCode: string | null
}

interface CreateUserResponse {
  id: string
  userName: string
  displayName: string
  userImage: string | null
  userRole: Role
}

export type { LoginResponse, PinCodeResponse, CreateUserResponse }
