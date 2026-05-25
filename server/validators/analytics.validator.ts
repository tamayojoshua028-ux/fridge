import { z } from 'zod'

export const analyticsQuerySchema = z.object({
  timeframe: z.enum(['week', 'month', 'quarter']).optional().default('week'),
})
