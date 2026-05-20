import { Router } from 'express'
import { requireAuth, getUserId } from '../middleware/clerkAuth'
import User from '../models/User'
import { ok } from '../utils/apiResponse'
import { asyncWrapper } from '../utils/asyncWrapper'

const router = Router()

// GET /api/v1/user/me
router.get('/me', requireAuth, asyncWrapper(async (req, res) => {
  const userId = getUserId(req)
  const user = await User.findOneAndUpdate(
    { clerkId: userId },
    { $setOnInsert: { clerkId: userId } },
    { upsert: true, new: true },
  ).lean()
  return ok(res, { user })
}))

export default router
