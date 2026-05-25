import { Router } from 'express'

import {
  consumeInventoryController,
  createInventoryController,
  deleteInventoryController,
  favoriteInventoryController,
  getInventoryCategoriesController,
  getInventoryItemsController,
  updateInventoryController,
} from '../controllers/inventory.controller'
import { asyncHandler } from '../utils/async-handler'
import { validateBody, validateQuery } from '../middleware/validate'
import { inventoryItemSchema, inventoryQuerySchema } from '../validators/inventory.validator'

export const inventoryRouter = Router()

inventoryRouter.get('/', validateQuery(inventoryQuerySchema), asyncHandler(getInventoryItemsController))
inventoryRouter.get('/categories', asyncHandler(getInventoryCategoriesController))
inventoryRouter.post('/', validateBody(inventoryItemSchema), asyncHandler(createInventoryController))
inventoryRouter.patch('/:id', validateBody(inventoryItemSchema.partial()), asyncHandler(updateInventoryController))
inventoryRouter.delete('/:id', asyncHandler(deleteInventoryController))
inventoryRouter.post('/:id/consume', asyncHandler(consumeInventoryController))
inventoryRouter.post('/:id/favorite', asyncHandler(favoriteInventoryController))
