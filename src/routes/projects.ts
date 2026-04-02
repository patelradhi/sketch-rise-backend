import { Router } from 'express'
import { requireAuth, getUserId } from '../middleware/clerkAuth'
import Project from '../models/Project'
import { ok, fail } from '../utils/apiResponse'
import { asyncWrapper } from '../utils/asyncWrapper'

const router = Router()

// POST /api/v1/projects — save new project (renderData comes from Puter.js frontend)
router.post('/', requireAuth, asyncWrapper(async (req, res) => {
  const userId = getUserId(req)
  if (!userId) return fail(res, 'Unauthorized', 401)

  const { title, renderedImageUrl, originalSketchBase64 } = req.body
  if (!renderedImageUrl) return fail(res, 'renderedImageUrl is required')

  const project = await Project.create({
    userId,
    title: title ?? 'Untitled Project',
    renderedImageUrl,
    originalSketchBase64,
  })

  return ok(res, { project }, 201)
}))

// GET /api/v1/projects
router.get('/', requireAuth, asyncWrapper(async (req, res) => {
  const userId = getUserId(req)
  const projects = await Project.find({ userId })
    .sort({ createdAt: -1 })
    .select('-originalSketchBase64') // don't return heavy base64 in list
    .lean()
  return ok(res, { projects })
}))

// GET /api/v1/projects/:id
router.get('/:id', requireAuth, asyncWrapper(async (req, res) => {
  const userId = getUserId(req)
  const project = await Project.findOne({ _id: req.params.id, userId }).lean()
  if (!project) return fail(res, 'Project not found', 404)
  return ok(res, { project })
}))

// PATCH /api/v1/projects/:id
router.patch('/:id', requireAuth, asyncWrapper(async (req, res) => {
  const userId = getUserId(req)
  const allowed = ['title', 'isPublic', 'renderedImageUrl']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key]
  }
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, userId },
    updates,
    { new: true },
  ).lean()
  if (!project) return fail(res, 'Project not found', 404)
  return ok(res, { project })
}))

// DELETE /api/v1/projects/:id
router.delete('/:id', requireAuth, asyncWrapper(async (req, res) => {
  const userId = getUserId(req)
  const result = await Project.deleteOne({ _id: req.params.id, userId })
  if (result.deletedCount === 0) return fail(res, 'Project not found', 404)
  return ok(res, { deleted: true })
}))

// POST /api/v1/projects/:id/share
router.post('/:id/share', requireAuth, asyncWrapper(async (req, res) => {
  const userId = getUserId(req)
  const shareToken = crypto.randomUUID()
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, userId },
    { shareToken, isPublic: true },
    { new: true },
  ).lean()
  if (!project) return fail(res, 'Project not found', 404)
  const origin = process.env.CORS_ORIGIN ?? 'http://localhost:5173'
  return ok(res, { shareUrl: `${origin}/share/${shareToken}` })
}))

export default router
