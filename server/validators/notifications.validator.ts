import { z } from 'zod'

export const notificationsQuerySchema = z.object({
  filter: z.enum(['all', 'expiry', 'recipe', 'grocery', 'report', 'stock', 'system']).optional().default('all'),
})
