import { Router } from 'express'

import {
  getProfileController,
  inviteMemberController,
  removeMemberController,
  updateProfileController,
} from '../controllers/profile.controller'
import { validateBody } from '../middleware/validate'
import { asyncHandler } from '../utils/async-handler'
import { householdInviteSchema, profileUpdateSchema } from '../validators/profile.validator'

export const profileRouter = Router()

profileRouter.get('/', asyncHandler(getProfileController))
profileRouter.patch('/', validateBody(profileUpdateSchema), asyncHandler(updateProfileController))
profileRouter.post('/household', validateBody(householdInviteSchema), asyncHandler(inviteMemberController))
profileRouter.delete('/household/:id', asyncHandler(removeMemberController))
