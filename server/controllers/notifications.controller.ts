import type { Response } from 'express'

import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  removeNotification,
  unreadCount,
} from '../services/notifications.service'
import { sendSuccess } from '../utils/api-response'
import type { AuthenticatedRequest } from '../middleware/auth'
import type { RequestWithValidatedQuery } from '../middleware/validate'
import { getRouteParam } from '../utils/request'

export const listNotificationsController = async (req: AuthenticatedRequest, res: Response) => {
  const query = (req as AuthenticatedRequest & RequestWithValidatedQuery<{ filter?: string }>).validatedQuery
  const data = await listNotifications(req.supabase, req.authUser.id, String(query?.filter ?? req.query.filter ?? 'all'))
  sendSuccess(res, data)
}

export const unreadNotificationsController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await unreadCount(req.supabase, req.authUser.id)
  sendSuccess(res, data)
}

export const markNotificationReadController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await markNotificationRead(req.supabase, req.authUser.id, getRouteParam(req.params.id))
  sendSuccess(res, data)
}

export const markAllNotificationsReadController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await markAllNotificationsRead(req.supabase, req.authUser.id)
  sendSuccess(res, data)
}

export const deleteNotificationController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await removeNotification(req.supabase, req.authUser.id, getRouteParam(req.params.id))
  sendSuccess(res, data)
}
