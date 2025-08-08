import z from 'zod'

const uuidV4Regex =
  /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
const customIdRegex = new RegExp(`^MID-${uuidV4Regex.source}$`, 'i')
const customOrderIdRegex = new RegExp(`^OID-${uuidV4Regex.source}$`, 'i')

export const DispenseOrderSchema = z.object({
  rfid: z.string().min(1, { message: 'RFID cannot be empty' }).optional(),
  machineId: z.string().regex(customIdRegex, {
    message:
      "Invalid Machine ID format. Must be in 'MID-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' format."
  })
})

export const PickupNextDrugSchema = z.object({
  orderId: z.string().regex(customOrderIdRegex, {
    message:
      "Invalid Order ID format. Must be in 'OID-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' format."
  }),
  drugId: z.string().min(1, { message: 'Drug ID cannot be empty' })
})

export type DispenseOrderRequestBody = z.infer<typeof DispenseOrderSchema>
export type PickupNextDrugRequestBody = z.infer<typeof PickupNextDrugSchema>
