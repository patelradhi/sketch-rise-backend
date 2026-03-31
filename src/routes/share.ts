import { Router, type Request, type Response } from 'express'
import Project from '../models/Project'

const router = Router()

// GET /api/share/:token — public, no auth required
router.get('/:token', async (req: Request, res: Response) => {
  const project = await Project.findOne({
    shareToken: req.params.token,
    isPublic: true,
  }).lean()

  if (!project) return res.status(404).json({ error: 'Share link not found or expired' })
  res.json(project)
})

export default router
