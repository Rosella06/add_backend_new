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

export type UserIdRequestBody = z.infer<typeof UserIdSchema>
