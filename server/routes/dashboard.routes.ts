import { Router } from 'express'

import { getDashboardController } from '../controllers/dashboard.controller'
import { asyncHandler } from '../utils/async-handler'

export const dashboardRouter = Router()

dashboardRouter.get('/', asyncHandler(getDashboardController))
