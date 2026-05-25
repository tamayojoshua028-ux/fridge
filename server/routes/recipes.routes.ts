import { Router } from 'express'

import {
  generateRecipesController,
  getRecipesController,
  toggleRecipeSavedController,
} from '../controllers/recipes.controller'
import { recipeGenerationRateLimit } from '../middleware/rate-limit'
import { asyncHandler } from '../utils/async-handler'

export const recipesRouter = Router()

recipesRouter.get('/', asyncHandler(getRecipesController))
recipesRouter.post('/generate', recipeGenerationRateLimit, asyncHandler(generateRecipesController))
recipesRouter.post('/:id/save', asyncHandler(toggleRecipeSavedController))
