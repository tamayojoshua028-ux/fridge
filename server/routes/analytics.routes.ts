import { Router } from 'express'

import { getAnalyticsController } from '../controllers/analytics.controller'
import { validateQuery } from '../middleware/validate'
import { asyncHandler } from '../utils/async-handler'
import { analyticsQuerySchema } from '../validators/analytics.validator'

export const analyticsRouter = Router()

analyticsRouter.get('/', validateQuery(analyticsQuerySchema), asyncHandler(getAnalyticsController))
