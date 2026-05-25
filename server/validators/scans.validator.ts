import { z } from 'zod'

export const scanAnalyzeSchema = z.object({
  imagePath: z.string().min(1),
  imageUrl: z.string().url().optional().nullable(),
  fileName: z.string().min(1).max(255),
})

export const saveScanSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().min(2).max(120),
      qty: z.coerce.number().positive(),
      unit: z.string().min(1).max(16),
      cat: z.string().min(1).max(60),
      conf: z.coerce.number().min(0).max(100),
      emoji: z.string().min(1).max(8),
    }),
  ),
})
