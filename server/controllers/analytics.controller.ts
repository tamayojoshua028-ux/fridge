import type { Response } from 'express'

import { getAnalytics } from '../services/analytics.service'
import { sendSuccess } from '../utils/api-response'
import type { AuthenticatedRequest } from '../middleware/auth'

export const getAnalyticsController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await getAnalytics(req.supabase, req.authUser.id)
  sendSuccess(res, data)
}
