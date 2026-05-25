import type { Request, RequestHandler } from 'express'
import type { ZodSchema } from 'zod'

import { HttpError } from '../utils/app-error'

export interface RequestWithValidatedQuery<TQuery = unknown> extends Request {
  validatedQuery?: TQuery
}

export const validateBody = (schema: ZodSchema): RequestHandler => (req, _res, next) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    next(new HttpError(400, 'Validation failed.', parsed.error.flatten()))
    return
  }

  req.body = parsed.data
  next()
}

export const validateQuery = (schema: ZodSchema): RequestHandler => (req, _res, next) => {
  const parsed = schema.safeParse(req.query)
  if (!parsed.success) {
    next(new HttpError(400, 'Validation failed.', parsed.error.flatten()))
    return
  }

  ;(req as RequestWithValidatedQuery).validatedQuery = parsed.data
  next()
}
