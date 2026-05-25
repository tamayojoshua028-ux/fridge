import type { Response } from 'express'

import { fetchRecipes, generateRecipes, toggleRecipeSaved } from '../services/recipes.service'
import { sendSuccess } from '../utils/api-response'
import type { AuthenticatedRequest } from '../middleware/auth'
import { getRouteParam } from '../utils/request'

export const getRecipesController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await fetchRecipes(req.supabase, req.authUser.id)
  sendSuccess(res, data)
}

export const generateRecipesController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await generateRecipes(req.supabase, req.authUser.id)
  sendSuccess(res, data)
}

export const toggleRecipeSavedController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await toggleRecipeSaved(req.supabase, req.authUser.id, getRouteParam(req.params.id))
  sendSuccess(res, data)
}
