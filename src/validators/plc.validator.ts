import z from 'zod'
import { PlcCommand } from '../types/plc'

const uuidV4Regex =
  /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
const customMachineIdRegex = new RegExp(`^MID-${uuidV4Regex.source}$`, 'i')
const customOrderIdRegex = new RegExp(`^OID-${uuidV4Regex.source}$`, 'i')

export const PlcCommandSchema = z.object({
  floor: z.number().min(1).max(12),
  position: z.number().min(1).max(72),
  qty: z.number().min(1).max(24),
  machineId: z
    .string()
    .regex(customMachineIdRegex, { message: 'Invalid Machine ID format.' }),
  command: z
    .enum(Object.values(PlcCommand) as [string, ...string[]])
    .optional(),
  orderId: z
    .string()
    .regex(customOrderIdRegex, { message: 'Invalid Order ID format.' })
    .optional()
})

export type PlcCommandRequestBody = z.infer<typeof PlcCommandSchema>
