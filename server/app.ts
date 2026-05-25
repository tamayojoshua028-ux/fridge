import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

import { serverEnv } from './config/env'
import { errorHandler } from './middleware/error-handler'
import { notFoundHandler } from './middleware/not-found'
import { apiRateLimit } from './middleware/rate-limit'
import { apiRouter } from './routes'

export const app = express()

app.use(
  cors({
    origin: serverEnv.CLIENT_URL,
    credentials: false,
  }),
)
app.use(helmet())
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(apiRateLimit)

app.use('/api/v1', apiRouter)
app.use(notFoundHandler)
app.use(errorHandler)
