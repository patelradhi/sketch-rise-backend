import { Router } from 'express'
import Project from '../models/Project'
import { ok, fail } from '../utils/apiResponse'
import { asyncWrapper } from '../utils/asyncWrapper'

const router = Router()

// GET /api/v1/share/:token — public, no auth
router.get('/:token', asyncWrapper(async (req, res) => {
  const project = await Project.findOne({
    shareToken: req.params.token,
    isPublic: true,
  }).lean()
  if (!project) return fail(res, 'Share link not found or expired', 404)
  return ok(res, { project })
}))

export default router
