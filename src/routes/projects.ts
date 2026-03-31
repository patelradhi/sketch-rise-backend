import { Router, type Request, type Response } from 'express'
import { requireAuth, getUserId } from '../middleware/clerkAuth'
import Project from '../models/Project'

const router = Router()

// GET /api/projects — list all projects for current user
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const userId = getUserId(req)
  const projects = await Project.find({ userId }).sort({ createdAt: -1 }).lean()
  res.json(projects)
})

// GET /api/projects/:id
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const userId = getUserId(req)
  const project = await Project.findOne({ _id: req.params.id, userId }).lean()
  if (!project) return res.status(404).json({ error: 'Not found' })
  res.json(project)
})

// PATCH /api/projects/:id — update title, thumbnail, or metadata
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  const userId = getUserId(req)
  const allowed = ['title', 'thumbnailBase64', 'isPublic']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key]
  }
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, userId },
    updates,
    { new: true },
  ).lean()
  if (!project) return res.status(404).json({ error: 'Not found' })
  res.json(project)
})

// DELETE /api/projects/:id
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const userId = getUserId(req)
  const result = await Project.deleteOne({ _id: req.params.id, userId })
  if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' })
  res.json({ success: true })
})

// POST /api/projects/:id/share — generate public share token
router.post('/:id/share', requireAuth, async (req: Request, res: Response) => {
  const userId = getUserId(req)
  const shareToken = crypto.randomUUID()
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, userId },
    { shareToken, isPublic: true },
    { new: true },
  ).lean()
  if (!project) return res.status(404).json({ error: 'Not found' })
  const origin = process.env.CORS_ORIGIN ?? 'http://localhost:5173'
  res.json({ shareUrl: `${origin}/share/${shareToken}` })
})

export default router
