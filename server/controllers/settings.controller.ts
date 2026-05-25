import type { Response } from 'express'

import { getSettings, updateSettings } from '../services/settings.service'
import { sendSuccess } from '../utils/api-response'
import type { AuthenticatedRequest } from '../middleware/auth'

export const getSettingsController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await getSettings(req.supabase, req.authUser.id)
  sendSuccess(res, data)
}

export const updateSettingsController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await updateSettings(req.supabase, req.authUser.id, req.body)
  sendSuccess(res, data)
}
