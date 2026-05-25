import type { Request, Response, NextFunction } from 'express'

import { authSupabase, createUserScopedClient } from '../services/supabase'
import { HttpError } from '../utils/app-error'

export interface AuthenticatedRequest extends Request {
  accessToken: string
  authUser: {
    id: string
    email?: string | null
  }
  supabase: ReturnType<typeof createUserScopedClient>
}

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authorization = req.headers.authorization
    if (!authorization?.startsWith('Bearer ')) {
      throw new HttpError(401, 'Missing bearer token.')
    }

    const accessToken = authorization.replace('Bearer ', '').trim()
    const { data, error } = await authSupabase.auth.getUser(accessToken)

    if (error || !data.user) {
      throw new HttpError(401, 'Invalid or expired session token.')
    }

    const typedRequest = req as AuthenticatedRequest
    typedRequest.accessToken = accessToken
    typedRequest.authUser = {
      id: data.user.id,
      email: data.user.email,
    }
    typedRequest.supabase = createUserScopedClient(accessToken)

    next()
  } catch (error) {
    next(error)
  }
}
