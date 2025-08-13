import z from 'zod'

const uuidV4Regex =
  /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
const customMachineIdRegex = new RegExp(`^MID-${uuidV4Regex.source}$`, 'i')
const customOrderIdRegex = new RegExp(`^OID-${uuidV4Regex.source}$`, 'i')

export const PlcCommandSchema = z.object({
  floor: z.number().min(1).max(12).optional(),
  position: z.number().min(1).max(72).optional(),
  qty: z.number().min(1).max(24).optional(),
  machineId: z
    .string()
    .regex(customMachineIdRegex, { message: 'Invalid Machine ID format.' })
    .optional(),
  command: z.string().optional(),
  orderId: z
    .string()
    .regex(customOrderIdRegex, { message: 'Invalid Order ID format.' })
    .optional()
})

export type PlcCommandRequestBody = z.infer<typeof PlcCommandSchema>
