import type { Response } from 'express'

import {
  clearPurchased,
  createGrocery,
  deleteGrocery,
  getGroceryList,
  resetGrocery,
  toggleGrocery,
  updateGrocery,
} from '../services/grocery.service'
import { sendSuccess } from '../utils/api-response'
import type { AuthenticatedRequest } from '../middleware/auth'
import { getRouteParam } from '../utils/request'

export const getGroceryController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await getGroceryList(req.supabase, req.authUser.id)
  sendSuccess(res, data)
}

export const createGroceryController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await createGrocery(req.supabase, req.authUser.id, req.body)
  sendSuccess(res, data)
}

export const updateGroceryController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await updateGrocery(req.supabase, req.authUser.id, getRouteParam(req.params.id), req.body)
  sendSuccess(res, data)
}

export const toggleGroceryController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await toggleGrocery(req.supabase, req.authUser.id, getRouteParam(req.params.id))
  sendSuccess(res, data)
}

export const deleteGroceryController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await deleteGrocery(req.supabase, req.authUser.id, getRouteParam(req.params.id))
  sendSuccess(res, data)
}

export const clearPurchasedController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await clearPurchased(req.supabase, req.authUser.id)
  sendSuccess(res, data)
}

export const resetGroceryController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await resetGrocery(req.supabase, req.authUser.id)
  sendSuccess(res, data)
}
