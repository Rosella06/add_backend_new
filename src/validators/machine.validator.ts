import { z } from 'zod'

const uuidV4Regex =
  /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
const ipAddressRegex =
  /^(::ffff:)?(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

const customIdRegex = new RegExp(`^MID-${uuidV4Regex.source}$`, 'i')

export const MachineSchema = z.object({
  machineName: z
    .string()
    .min(1, { message: 'Machine name is required.' })
    .optional(),
  ipAddress: z
    .string()
    .regex(ipAddressRegex, {
      message:
        'Invalid IPv4 address format (e.g., 192.168.1.1 or ::ffff:192.168.1.1)'
    })
    .optional()
})

export const paramsIdMachineSchema = z.object({
  id: z.string().regex(customIdRegex, { message: 'Invalid Machine ID format.' })
})

export type MachineRequestBody = z.infer<typeof MachineSchema>
export type paramsIdMachineRequestParams = z.infer<typeof paramsIdMachineSchema>
