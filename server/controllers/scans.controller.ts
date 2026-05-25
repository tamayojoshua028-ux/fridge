import type { Response } from 'express'

import { analyzeScan, getScanHistory, saveScanToInventory } from '../services/scans.service'
import { sendSuccess } from '../utils/api-response'
import type { AuthenticatedRequest } from '../middleware/auth'
import { getRouteParam } from '../utils/request'

export const getScansController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await getScanHistory(req.supabase, req.authUser.id)
  sendSuccess(res, data)
}

export const analyzeScanController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await analyzeScan(req.supabase, req.authUser.id, req.body)
  sendSuccess(res, data)
}

export const saveScanController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await saveScanToInventory(req.supabase, req.authUser.id, getRouteParam(req.params.id), req.body)
  sendSuccess(res, data)
}
