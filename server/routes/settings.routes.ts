import { Router } from 'express'

import { getSettingsController, updateSettingsController } from '../controllers/settings.controller'
import { validateBody } from '../middleware/validate'
import { asyncHandler } from '../utils/async-handler'
import { settingsSchema } from '../validators/settings.validator'

export const settingsRouter = Router()

settingsRouter.get('/', asyncHandler(getSettingsController))
settingsRouter.put('/', validateBody(settingsSchema), asyncHandler(updateSettingsController))
