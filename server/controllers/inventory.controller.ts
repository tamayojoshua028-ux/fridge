import type { Response } from 'express'

import {
  createInventory,
  deleteInventory,
  getInventoryCategories,
  listInventory,
  toggleInventoryFavorite,
  updateInventory,
  consumeInventory,
} from '../services/inventory.service'
import { sendSuccess } from '../utils/api-response'
import type { AuthenticatedRequest } from '../middleware/auth'
import type { RequestWithValidatedQuery } from '../middleware/validate'
import { getRouteParam } from '../utils/request'

export const getInventoryItemsController = async (req: AuthenticatedRequest, res: Response) => {
  const query = (req as AuthenticatedRequest & RequestWithValidatedQuery).validatedQuery ?? req.query
  const data = await listInventory(req.supabase, req.authUser.id, query as any)
  sendSuccess(res, data)
}

export const getInventoryCategoriesController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await getInventoryCategories(req.supabase, req.authUser.id)
  sendSuccess(res, data)
}

export const createInventoryController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await createInventory(req.supabase, req.authUser.id, req.body)
  sendSuccess(res, data)
}

export const updateInventoryController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await updateInventory(req.supabase, req.authUser.id, getRouteParam(req.params.id), req.body)
  sendSuccess(res, data)
}

export const deleteInventoryController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await deleteInventory(req.supabase, req.authUser.id, getRouteParam(req.params.id))
  sendSuccess(res, data)
}

export const consumeInventoryController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await consumeInventory(req.supabase, req.authUser.id, getRouteParam(req.params.id))
  sendSuccess(res, data)
}

export const favoriteInventoryController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await toggleInventoryFavorite(req.supabase, req.authUser.id, getRouteParam(req.params.id))
  sendSuccess(res, data)
}
