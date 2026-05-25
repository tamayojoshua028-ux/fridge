import type { Response } from 'express'

import { getDashboardSummary } from '../services/dashboard.service'
import { sendSuccess } from '../utils/api-response'
import type { AuthenticatedRequest } from '../middleware/auth'

export const getDashboardController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await getDashboardSummary(req.supabase, req.authUser.id)
  sendSuccess(res, data)
}
