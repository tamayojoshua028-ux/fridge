import { Router } from 'express'

import {
  clearPurchasedController,
  createGroceryController,
  deleteGroceryController,
  getGroceryController,
  resetGroceryController,
  toggleGroceryController,
  updateGroceryController,
} from '../controllers/grocery.controller'
import { validateBody } from '../middleware/validate'
import { asyncHandler } from '../utils/async-handler'
import { groceryItemSchema, groceryUpdateSchema } from '../validators/grocery.validator'

export const groceryRouter = Router()

groceryRouter.get('/', asyncHandler(getGroceryController))
groceryRouter.post('/items', validateBody(groceryItemSchema), asyncHandler(createGroceryController))
groceryRouter.patch('/items/:id', validateBody(groceryUpdateSchema), asyncHandler(updateGroceryController))
groceryRouter.post('/items/:id/toggle', asyncHandler(toggleGroceryController))
groceryRouter.delete('/items/:id', asyncHandler(deleteGroceryController))
groceryRouter.post('/clear-purchased', asyncHandler(clearPurchasedController))
groceryRouter.post('/reset', asyncHandler(resetGroceryController))
