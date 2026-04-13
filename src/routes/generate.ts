import { Router } from 'express'
import { GoogleGenAI } from '@google/genai'
import { requireAuth } from '../middleware/clerkAuth'
import { ok, fail } from '../utils/apiResponse'
import { asyncWrapper } from '../utils/asyncWrapper'

const router = Router()

const FLOOR_PLAN_PROMPT = `
TASK: Convert the input 2D floor plan into a **photorealistic, top-down 3D architectural render**.

STRICT REQUIREMENTS (do not violate):
1) **REMOVE ALL TEXT**: Do not render any letters, numbers, labels, dimensions, or annotations. Floors must be continuous where text used to be.
2) **GEOMETRY MUST MATCH**: Walls, rooms, doors, and windows must follow the exact lines and positions in the plan. Do not shift or resize.
3) **TOP-DOWN ONLY**: Orthographic top-down view. No perspective tilt.
4) **CLEAN, REALISTIC OUTPUT**: Crisp edges, balanced lighting, and realistic materials. No sketch/hand-drawn look.
5) **NO EXTRA CONTENT**: Do not add rooms, furniture, or objects that are not clearly indicated by the plan.

STRUCTURE & DETAILS:
- **Walls**: Extrude precisely from the plan lines. Consistent wall height and thickness.
- **Doors**: Convert door swing arcs into open doors, aligned to the plan.
- **Windows**: Convert thin perimeter lines into realistic glass windows.

FURNITURE & ROOM MAPPING (only where icons/fixtures are clearly shown):
- Bed icon → realistic bed with duvet and pillows.
- Sofa icon → modern sectional or sofa.
- Dining table icon → table with chairs.
- Kitchen icon → counters with sink and stove.
- Bathroom icon → toilet, sink, and tub/shower.
- Office/study icon → desk, chair, and minimal shelving.
- Porch/patio/balcony icon → outdoor seating or simple furniture (keep minimal).
- Utility/laundry icon → washer/dryer and minimal cabinetry.

STYLE & LIGHTING:
- Lighting: bright, neutral daylight. High clarity and balanced contrast.
- Materials: realistic wood/tile floors, clean walls, subtle shadows.
- Finish: professional architectural visualization; no text, no watermarks, no logos.
`.trim()

// POST /api/v1/generate — generate 3D render from 2D floor plan
router.post('/', requireAuth, asyncWrapper(async (req, res) => {
  const { base64Image, mimeType } = req.body

  if (!base64Image) return fail(res, 'base64Image is required')

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return fail(res, 'Gemini API key not configured', 500)

  const ai = new GoogleGenAI({ apiKey })

  const result = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: [
      {
        role: 'user',
        parts: [
          { text: FLOOR_PLAN_PROMPT },
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: base64Image,
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  })

  // Extract image from response
  const parts = result.candidates?.[0]?.content?.parts
  if (!parts) return fail(res, 'AI returned no response. Please try again.', 500)

  const imagePart = parts.find((p: any) => p.inlineData)
  if (!imagePart?.inlineData) {
    const textFeedback = parts.find((p: any) => p.text)?.text
    return fail(res, textFeedback || 'AI returned no image. Please try a clearer floor plan.', 500)
  }

  const imageUrl = `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`

  return ok(res, { imageUrl })
}))

export default router
