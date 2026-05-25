import { z } from 'zod'

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().max(30).optional().nullable(),
})

export const householdInviteSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  role: z.enum(['admin', 'member']).default('member'),
})
