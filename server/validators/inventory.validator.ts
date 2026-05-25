import { z } from 'zod'

export const inventoryItemSchema = z.object({
  name: z.string().min(2).max(120),
  qty: z.coerce.number().positive(),
  unit: z.string().min(1).max(16),
  cat: z.string().min(1).max(60),
  shelf: z.enum(['Fridge', 'Pantry', 'Freezer', 'Counter']),
  loc: z.string().min(2).max(80),
  exp: z.string().min(1),
  notes: z.string().max(300).optional().default(''),
  imagePath: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  lowStockThreshold: z.coerce.number().min(0).max(9999).nullable().optional(),
})

export const inventoryQuerySchema = z.object({
  search: z.string().optional().default(''),
  status: z.enum(['all', 'fresh', 'expiring', 'expired']).optional().default('all'),
  shelf: z.enum(['all_shelf', 'Fridge', 'Pantry', 'Freezer', 'Counter']).optional().default('all_shelf'),
  sort: z.enum(['name', 'exp', 'cat']).optional().default('name'),
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(1).max(50).optional().default(12),
})
