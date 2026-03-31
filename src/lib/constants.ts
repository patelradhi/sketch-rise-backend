export const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080
export const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173'
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
export const SHARP_TARGET_SIZE = 1024
