import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import Anthropic from '@anthropic-ai/sdk'
import { requireAuth, getUserId } from '../middleware/clerkAuth'
import Project from '../models/Project'
import User from '../models/User'
import { CLAUDE_PROMPT } from '../lib/claudePrompt'
import { SHARP_TARGET_SIZE } from '../lib/constants'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

router.post('/', requireAuth, upload.single('sketch'), async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    // Check usage limit
    let user = await User.findOne({ clerkId: userId })
    if (user && user.generationsUsed >= user.generationsLimit) {
      return res.status(429).json({ error: 'Generation limit reached. Upgrade to Pro for unlimited renders.' })
    }

    // Compress image with Sharp
    const compressed = await sharp(req.file.buffer)
      .resize(SHARP_TARGET_SIZE, SHARP_TARGET_SIZE, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer()

    const base64Image = compressed.toString('base64')

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: base64Image },
            },
            { type: 'text', text: CLAUDE_PROMPT },
          ],
        },
      ],
    })

    // Parse Claude's JSON response
    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    // Strip any accidental markdown fences
    const clean = rawText.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    const renderData = JSON.parse(clean)

    // Auto-save project
    const project = await Project.create({
      userId,
      title: 'Untitled Project',
      originalSketchBase64: base64Image,
      renderData,
    })

    // Track usage
    if (user) {
      await User.updateOne({ clerkId: userId }, { $inc: { generationsUsed: 1 } })
    } else {
      await User.create({ clerkId: userId, email: '', generationsUsed: 1 })
    }

    return res.json({ success: true, project, renderData })
  } catch (err) {
    console.error('[analyze]', err)
    if (err instanceof SyntaxError) {
      return res.status(422).json({ error: 'Claude returned unparseable data. Please try again.' })
    }
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
