import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import mongoose from 'mongoose'
import { clerkMiddleware } from '@clerk/express'
import projectsRouter from './routes/projects'
import generateRouter from './routes/generate'
import shareRouter from './routes/share'
import userRouter from './routes/user'
import { errorHandler } from './middleware/errorHandler'
import { PORT, CORS_ORIGIN } from './lib/constants'

const app = express()

// ── Security & parsing ────────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({ origin: CORS_ORIGIN, credentials: true }))
app.use(express.json({ limit: '15mb' }))

// ── Clerk Auth ────────────────────────────────────────────────────────────────
app.use(clerkMiddleware())

// ── Routes (v1) ───────────────────────────────────────────────────────────────
app.use('/api/v1/generate', generateRouter)
app.use('/api/v1/projects', projectsRouter)
app.use('/api/v1/share', shareRouter)
app.use('/api/v1/user', userRouter)

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', version: 'v1' }))

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler)

// ── Start ─────────────────────────────────────────────────────────────────────
const start = async () => {
  const mongoUri = process.env.MONGODB_URI
  if (!mongoUri) throw new Error('MONGODB_URI is required in .env')
  await mongoose.connect(mongoUri)
  console.log('✅ MongoDB connected')
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`))
}

start().catch((err) => {
  console.error('❌ Server failed to start:', err)
  process.exit(1)
})
