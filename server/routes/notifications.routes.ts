import { Router } from 'express'

import {
  deleteNotificationController,
  listNotificationsController,
  markAllNotificationsReadController,
  markNotificationReadController,
  unreadNotificationsController,
} from '../controllers/notifications.controller'
import { validateQuery } from '../middleware/validate'
import { asyncHandler } from '../utils/async-handler'
import { notificationsQuerySchema } from '../validators/notifications.validator'

export const notificationsRouter = Router()

notificationsRouter.get('/', validateQuery(notificationsQuerySchema), asyncHandler(listNotificationsController))
notificationsRouter.get('/unread-count', asyncHandler(unreadNotificationsController))
notificationsRouter.patch('/:id/read', asyncHandler(markNotificationReadController))
notificationsRouter.post('/mark-all-read', asyncHandler(markAllNotificationsReadController))
notificationsRouter.delete('/:id', asyncHandler(deleteNotificationController))
