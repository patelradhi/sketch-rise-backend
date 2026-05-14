import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { requireAuth, getUserId } from '../middleware/clerkAuth';
import { ok, fail } from '../utils/apiResponse';
import { asyncWrapper } from '../utils/asyncWrapper';
import { uploadImage } from '../lib/cloudinary';
import User from '../models/User';

const router = Router();

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
`.trim();

// POST /api/v1/generate — generate 3D render from 2D floor plan, store both on Cloudinary
router.post(
	'/',
	requireAuth,
	asyncWrapper(async (req, res) => {
		const userId = getUserId(req);
		if (!userId) return fail(res, 'Unauthorized', 401);

		const { base64Image, mimeType } = req.body;
		if (!base64Image) return fail(res, 'base64Image is required');

		const inputMime = mimeType || 'image/jpeg';

		// Enforce per-user generation quota (free plan)
		const user = await User.findOneAndUpdate(
			{ clerkId: userId },
			{ $setOnInsert: { clerkId: userId } },
			{ new: true, upsert: true },
		);
		if (user.plan === 'free' && user.generationsUsed >= user.generationsLimit) {
			return fail(res, "You've reached your free generation limit. Upgrade to continue.", 403, 'LIMIT_REACHED');
		}

		let renderedBase64: string;
		let renderedMime: string;

		if (process.env.MOCK_GEMINI === 'true') {
			// Demo mode — echo the 2D sketch back as the "3D" render.
			renderedBase64 = base64Image;
			renderedMime = inputMime;
			await new Promise((r) => setTimeout(r, 1500));
		} else {
			const apiKey = process.env.GEMINI_API_KEY;
			if (!apiKey) return fail(res, 'Gemini API key not configured', 500);

			const ai = new GoogleGenAI({ apiKey });

			let result;
			try {
				result = await ai.models.generateContent({
					model: 'gemini-2.5-flash-image',
					contents: [
						{
							role: 'user',
							parts: [
								{ text: FLOOR_PLAN_PROMPT },
								{
									inlineData: {
										mimeType: inputMime,
										data: base64Image,
									},
								},
							],
						},
					],
					config: {
						responseModalities: ['TEXT', 'IMAGE'],
					},
				});
			} catch (err) {
				const raw = err instanceof Error ? err.message : String(err);
				const cause = err instanceof Error && 'cause' in err ? (err as any).cause : undefined;
				if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('"code":429')) {
					return fail(
						res,
						'Our AI service is busy right now. Please try again in a minute.',
						503,
						'AI_RATE_LIMITED',
					);
				}
				console.error(
					'[gemini] generateContent failed:',
					raw,
					cause ? `\n  cause: ${JSON.stringify(cause, Object.getOwnPropertyNames(cause))}` : '',
				);
				return fail(res, 'AI service is temporarily unavailable.', 502, 'AI_UNAVAILABLE');
			}

			const parts = result.candidates?.[0]?.content?.parts;
			if (!parts) return fail(res, 'AI returned no response. Please try again.', 502, 'AI_NO_RESPONSE');

			const imagePart = parts.find((p: any) => p.inlineData);
			if (!imagePart?.inlineData?.data) {
				const textFeedback = parts.find((p: any) => p.text)?.text;
				return fail(
					res,
					textFeedback || 'AI returned no image. Please try a clearer floor plan.',
					502,
					'AI_NO_IMAGE',
				);
			}

			renderedBase64 = imagePart.inlineData.data;
			renderedMime = imagePart.inlineData.mimeType || 'image/png';
		}

		const [originalSketchUrl, renderedImageUrl] = await Promise.all([
			uploadImage(base64Image, inputMime, '2d', userId),
			uploadImage(renderedBase64, renderedMime, '3d', userId),
		]);

		await User.updateOne({ clerkId: userId }, { $inc: { generationsUsed: 1 } });

		return ok(res, { originalSketchUrl, renderedImageUrl });
	}),
);

export default router;
