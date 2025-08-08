import z from 'zod'

const uuidV4Regex =
  /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
const customIdRegex = new RegExp(`^UID-${uuidV4Regex.source}$`, 'i')

export const UserIdSchema = z.object({
  id: z.string().regex(customIdRegex, {
    message:
      "Invalid User ID format. Must be in 'UID-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' format."
  })
})

export const UpdateUserSchema = z.object({
  userName: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters' })
    .optional(),
  displayName: z
    .string()
    .min(1, { message: 'DisplayName must be at least 1 characters' })
    .optional(),
  userStatus: z.coerce.boolean().optional(),
  userRole: z
    .enum([
      'ADMIN',
      'USER',
      'HEAD_PHARMACIST',
      'PHARMACIST',
      'ASSISTANT',
      'SUPER'
    ])
    .optional()
}).strict()

export type UserIdRequestBody = z.infer<typeof UserIdSchema>
export type UpdateRequestBody = z.infer<typeof UpdateUserSchema>
