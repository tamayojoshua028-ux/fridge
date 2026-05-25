import rateLimit, { ipKeyGenerator } from 'express-rate-limit'

import type { AuthenticatedRequest } from './auth'

export const apiRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/v1/health',
  message: {
    success: false,
    message: 'Too many requests. Please wait a moment and try again.',
  },
})

export const authenticatedApiRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 240,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req as AuthenticatedRequest).authUser?.id ?? ipKeyGenerator(req.ip ?? ''),
  message: {
    success: false,
    message: 'You are sending requests too quickly. Please wait a moment and try again.',
  },
})

export const recipeGenerationRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req as AuthenticatedRequest).authUser?.id ?? ipKeyGenerator(req.ip ?? ''),
  message: {
    success: false,
    message: 'Recipe generation is temporarily rate limited. Please wait a minute before generating again.',
  },
})
