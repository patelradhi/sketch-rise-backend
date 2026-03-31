import { Router, type Request, type Response } from 'express'
import { requireAuth, getUserId } from '../middleware/clerkAuth'
import User from '../models/User'

const router = Router()

// GET /api/user/me
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const userId = getUserId(req)
  let user = await User.findOne({ clerkId: userId }).lean()
  if (!user) {
    user = await User.create({ clerkId: userId, email: '' })
  }
  res.json(user)
})

export default router
