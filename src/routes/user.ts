import { Router } from 'express'
import { clerkClient } from '@clerk/express'
import { requireAuth, getUserId } from '../middleware/clerkAuth'
import User from '../models/User'
import { ok, fail } from '../utils/apiResponse'
import { asyncWrapper } from '../utils/asyncWrapper'

const router = Router()

// GET /api/v1/user/me — upserts the local user row, syncing email from Clerk
router.get('/me', requireAuth, asyncWrapper(async (req, res) => {
  const userId = getUserId(req)
  if (!userId) return fail(res, 'Unauthorized', 401)

  const clerkUser = await clerkClient.users.getUser(userId)
  const primaryEmail =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ?? ''

  const user = await User.findOneAndUpdate(
    { clerkId: userId },
    {
      $setOnInsert: { clerkId: userId },
      $set: { email: primaryEmail },
    },
    { upsert: true, new: true },
  ).lean()
  return ok(res, { user })
}))

export default router
