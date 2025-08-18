import z from 'zod'

const uuidV4Regex =
  /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
const customIdRegex = new RegExp(`^MID-${uuidV4Regex.source}$`, 'i')
const customOrderIdRegex = new RegExp(`^OID-${uuidV4Regex.source}$`, 'i')

export const DispenseOrderSchema = z.object({
  machineId: z.string().regex(customIdRegex, {
    message:
      "Invalid Machine ID format. Must be in 'MID-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' format."
  })
})

export const DispenseOrderIdParamsSchema = z.object({
  rfid: z.string().min(1, { message: 'RFID cannot be empty' }).optional()
})

export const PickupNextDrugSchema = z.object({
  // orderId: z.string().regex(customOrderIdRegex, {
  //   message:
  //     "Invalid Order ID format. Must be in 'OID-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' format."
  // }),
  presciptionNo: z
    .string()
    .min(1, { message: 'Presciption No cannot be empty' }),
  drugCode: z.string().min(1, { message: 'Drug Code cannot be empty' })
})

export type DispenseOrderRequestBody = z.infer<typeof DispenseOrderSchema>
export type DispenseOrderRequestParams = z.infer<
  typeof DispenseOrderIdParamsSchema
>
export type PickupNextDrugRequestBody = z.infer<typeof PickupNextDrugSchema>
