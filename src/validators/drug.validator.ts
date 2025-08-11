import z from 'zod'

const uuidV4Regex =
  /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
const customDrugIdRegex = new RegExp(`^DID-${uuidV4Regex.source}$`, 'i')

export const DrugIdParamsSchema = z.object({
  id: z
    .string()
    .regex(customDrugIdRegex, { message: 'Invalid Drug ID format.' })
})

export type DrugIdParamsRequestBody = z.infer<typeof DrugIdParamsSchema>
