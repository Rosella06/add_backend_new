import { z } from 'zod'

const uuidV4Regex = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
const customIdRegex = new RegExp(`^UID-${uuidV4Regex.source}$`, 'i')

export const LoginSchema = z.union([
  z.object({
    pinCode: z.string().min(1, { message: 'pinCode cannot be empty' })
  }),
  z.object({
    userName: z
      .string()
      .min(3, { message: 'Username must be at least 3 characters' }),
    userPassword: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters' })
  })
])

export const GenerateQrCodeSchema = z.object({
  id: z.string().regex(customIdRegex, {
    message:
      "Invalid user ID format. Must be in 'UID-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' format."
  })
})

export const CreatePinCodeSchema = z.object({
  id: z.string().regex(customIdRegex, { message: 'Invalid user ID format.' }),
  pinCode: z
    .string()
    .length(6, { message: 'PIN Code must be exactly 6 digits' })
})

export const CreateUserSchema = z.object({
  userName: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters' }),
  userPassword: z
    .string()
    .min(6, { message: 'Username must be at least 3 characters' }),
  displayName: z
    .string()
    .min(1, { message: 'DisplayName must be at least 1 characters' }),
  userRole: z.enum([
    'ADMIN',
    'USER',
    'HEAD_PHARMACIST',
    'PHARMACIST',
    'ASSISTANT',
    'SUPER'
  ])
})

export type LoginRequestBody = z.infer<typeof LoginSchema>
export type GenerateRequestBody = z.infer<typeof GenerateQrCodeSchema>
export type CreateRequestBody = z.infer<typeof CreatePinCodeSchema>
export type CreateUserRequestBody = z.infer<typeof CreateUserSchema>
