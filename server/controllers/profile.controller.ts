import type { Response } from 'express'

import { getProfile, inviteMember, removeMember, updateProfile } from '../services/profile.service'
import { sendSuccess } from '../utils/api-response'
import type { AuthenticatedRequest } from '../middleware/auth'
import { getRouteParam } from '../utils/request'

export const getProfileController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await getProfile(req.supabase, req.authUser.id)
  sendSuccess(res, data)
}

export const updateProfileController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await updateProfile(req.supabase, req.authUser.id, req.body)
  sendSuccess(res, data)
}

export const inviteMemberController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await inviteMember(req.supabase, req.authUser.id, req.body)
  sendSuccess(res, data)
}

export const removeMemberController = async (req: AuthenticatedRequest, res: Response) => {
  const data = await removeMember(req.supabase, req.authUser.id, getRouteParam(req.params.id))
  sendSuccess(res, data)
}
