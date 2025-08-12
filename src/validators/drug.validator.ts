import z from 'zod'

const uuidV4Regex =
  /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
const customDrugIdRegex = new RegExp(`^DID-${uuidV4Regex.source}$`, 'i')

export const DrugIdParamsSchema = z.object({
  id: z
    .string()
    .regex(customDrugIdRegex, { message: 'Invalid Drug ID format.' })
})

export const CreateDrugSchema = z.object({
  drugCode: z.string(),
  drugName: z.string().min(1, { message: 'Drug name cannot be empty.' }),
})

export const EditDrugSchema = z.object({
  drugCode: z.string().optional(),
  drugName: z.string().min(1, { message: 'Drug name cannot be empty.' }).optional(),
  drugStatus: z.coerce.boolean().optional()
})

export type DrugIdParamsRequestBody = z.infer<typeof DrugIdParamsSchema>
export type CreateDrugRequestBody = z.infer<typeof CreateDrugSchema>
export type EditDrugRequestBody = z.infer<typeof EditDrugSchema>
