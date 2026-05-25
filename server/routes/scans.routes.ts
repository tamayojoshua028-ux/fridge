import { Router } from 'express'

import { analyzeScanController, getScansController, saveScanController } from '../controllers/scans.controller'
import { validateBody } from '../middleware/validate'
import { asyncHandler } from '../utils/async-handler'
import { saveScanSchema, scanAnalyzeSchema } from '../validators/scans.validator'

export const scansRouter = Router()

scansRouter.get('/', asyncHandler(getScansController))
scansRouter.post('/analyze', validateBody(scanAnalyzeSchema), asyncHandler(analyzeScanController))
scansRouter.post('/:id/save', validateBody(saveScanSchema), asyncHandler(saveScanController))
