import { z } from 'zod'

export const groceryItemSchema = z.object({
  name: z.string().min(2).max(120),
  qty: z.coerce.number().min(1),
  unit: z.string().min(1).max(16),
  cat: z.string().min(1).max(60),
  priority: z.enum(['low', 'medium', 'high']),
  notes: z.string().max(300).optional().default(''),
})

export const groceryUpdateSchema = z.object({
  qty: z.coerce.number().min(1).optional(),
  checked: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  notes: z.string().max(300).optional(),
})
