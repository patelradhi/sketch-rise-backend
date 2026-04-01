import { Router } from 'express'
import { requireAuth, getUserId } from '../middleware/clerkAuth'
import User from '../models/User'
import { ok } from '../utils/apiResponse'
import { asyncWrapper } from '../utils/asyncWrapper'

const router = Router()

// GET /api/v1/user/me
router.get('/me', requireAuth, asyncWrapper(async (req, res) => {
  const userId = getUserId(req)
  let user = await User.findOne({ clerkId: userId }).lean()
  if (!user) {
    user = await User.create({ clerkId: userId })
  }
  return ok(res, { user })
}))

export default router
