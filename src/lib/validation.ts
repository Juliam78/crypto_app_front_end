import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Correo invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
})

export const registerSchema = loginSchema.extend({
  name: z.string().min(3, 'Minimo 3 caracteres'),
})

export const profileSchema = z.object({
  name: z.string().min(3, 'Minimo 3 caracteres'),
  email: z.string().email('Correo invalido'),
  password: z.string().optional(),
})

export const tradeSchema = z.object({
  amountUsd: z.coerce.number().positive('El monto debe ser mayor a 0'),
  type: z.enum(['buy', 'sell']),
})

export type LoginForm = z.infer<typeof loginSchema>
export type RegisterForm = z.infer<typeof registerSchema>
export type ProfileForm = z.infer<typeof profileSchema>
export type TradeForm = z.infer<typeof tradeSchema>
