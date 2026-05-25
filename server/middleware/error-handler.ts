import type { ErrorRequestHandler } from 'express'

import { HttpError } from '../utils/app-error'

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const statusCode = error instanceof HttpError ? error.statusCode : 500
  const message = error instanceof Error ? error.message : 'Internal server error.'
  const details = error instanceof HttpError ? error.details : undefined

  if (statusCode >= 500) {
    console.error(error)
  }

  res.status(statusCode).json({
    success: false,
    message,
    details,
  })
}
