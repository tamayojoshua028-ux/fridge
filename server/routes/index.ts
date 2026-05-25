import { Router } from 'express'

import { requireAuth } from '../middleware/auth'
import { authenticatedApiRateLimit } from '../middleware/rate-limit'
import { sendSuccess } from '../utils/api-response'
import { analyticsRouter } from './analytics.routes'
import { dashboardRouter } from './dashboard.routes'
import { groceryRouter } from './grocery.routes'
import { inventoryRouter } from './inventory.routes'
import { notificationsRouter } from './notifications.routes'
import { profileRouter } from './profile.routes'
import { recipesRouter } from './recipes.routes'
import { scansRouter } from './scans.routes'
import { settingsRouter } from './settings.routes'

export const apiRouter = Router()

apiRouter.get('/health', (_req, res) => {
  sendSuccess(res, {
    ok: true,
    timestamp: new Date().toISOString(),
  })
})

apiRouter.use(requireAuth)
apiRouter.use(authenticatedApiRateLimit)
apiRouter.use('/dashboard', dashboardRouter)
apiRouter.use('/inventory', inventoryRouter)
apiRouter.use('/grocery', groceryRouter)
apiRouter.use('/notifications', notificationsRouter)
apiRouter.use('/profile', profileRouter)
apiRouter.use('/settings', settingsRouter)
apiRouter.use('/recipes', recipesRouter)
apiRouter.use('/scans', scansRouter)
apiRouter.use('/analytics', analyticsRouter)
