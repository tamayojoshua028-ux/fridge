import { z } from 'zod'

export const settingsSchema = z.object({
  notifications: z.object({
    expiry: z.boolean(),
    lowStock: z.boolean(),
    recipes: z.boolean(),
    weekly: z.boolean(),
  }),
  appearance: z.object({
    darkMode: z.boolean(),
  }),
  privacy: z.object({
    biometric: z.boolean(),
    analytics: z.boolean(),
  }),
  preferences: z.object({
    language: z.string().min(2),
    units: z.enum(['metric', 'imperial']),
    dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']),
  }),
})
