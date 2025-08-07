import { z } from 'zod'

export const AuthHeaderSchema = z
  .string()
  .trim()
  .min(1, { message: 'Authorization header cannot be empty' })
  .refine(header => header.startsWith('Bearer '), {
    message: "Authorization header must be in 'Bearer <token>' format"
  })
  .transform(header => header.split(' ')[1])
