import z from 'zod'

const uuidV4Regex =
  /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
const customInventoryIdIdRegex = new RegExp(`^IVID-${uuidV4Regex.source}$`, 'i')
const customDrugIdRegex = new RegExp(`^DID-${uuidV4Regex.source}$`, 'i')
const customMachineIdRegex = new RegExp(`^MID-${uuidV4Regex.source}$`, 'i')

export const InventoryIdParamsSchema = z.object({
  id: z.string().regex(customInventoryIdIdRegex, {
    message: 'Invalid Inventory ID format.'
  })
})

export const CreateInventorySchema = z.object({
  floor: z.number().min(1).max(14),
  position: z.number().min(1).max(84),
  min: z.number(),
  max: z.number(),
  expiryDate: z.string(),
  drugId: z
    .string()
    .regex(customDrugIdRegex, { message: 'Invalid Drug ID format.' }),
  machineId: z
    .string()
    .regex(customMachineIdRegex, { message: 'Invalid Machine ID format.' })
})

export const EditInventorySchema = z.object({
  floor: z.number().min(1).max(14).optional(),
  position: z.number().min(1).max(84).optional(),
  quantity: z.number().min(1).max(60).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  status: z.coerce.boolean().optional(),
  expiryDate: z.string().optional(),
  drugId: z
    .string()
    .regex(customDrugIdRegex, { message: 'Invalid Drug ID format.' })
    .optional(),
  machineId: z
    .string()
    .regex(customMachineIdRegex, { message: 'Invalid Machine ID format.' })
    .optional()
})

export const UpdateStockSchema = z.object({
  quantity: z.number().min(1).max(60).optional(),
  machineId: z
    .string()
    .regex(customMachineIdRegex, { message: 'Invalid Machine ID format.' })
    .optional(),
    command: z.string().optional()
})

export type InventoryIdParamsRequestBody = z.infer<
  typeof InventoryIdParamsSchema
>
export type CreateInventoryRequestBody = z.infer<typeof CreateInventorySchema>
export type EditInventoryRequestBody = z.infer<typeof EditInventorySchema>
export type UpdateStockRequestBody = z.infer<typeof UpdateStockSchema>
