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

// Lecciones / señales de la Academia. Si es señal, coin y recomendación son obligatorios.
export const lessonSchema = z
  .object({
    kind: z.enum(['lesson', 'signal']),
    title: z.string().min(3, 'Minimo 3 caracteres'),
    body: z.string().min(10, 'Minimo 10 caracteres'),
    coinId: z.string().optional(),
    coinSymbol: z.string().optional(),
    recommendation: z.enum(['buy', 'sell', 'hold']).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.kind !== 'signal') return
    if (!value.coinId || value.coinId.trim().length === 0) {
      ctx.addIssue({ code: 'custom', message: 'Indica la moneda (id)', path: ['coinId'] })
    }
    if (!value.coinSymbol || value.coinSymbol.trim().length === 0) {
      ctx.addIssue({ code: 'custom', message: 'Indica el simbolo', path: ['coinSymbol'] })
    }
    if (!value.recommendation) {
      ctx.addIssue({ code: 'custom', message: 'Selecciona una recomendacion', path: ['recommendation'] })
    }
  })

export type LessonForm = z.infer<typeof lessonSchema>

export type LoginForm = z.infer<typeof loginSchema>
export type RegisterForm = z.infer<typeof registerSchema>
export type ProfileForm = z.infer<typeof profileSchema>
export type TradeForm = z.infer<typeof tradeSchema>
