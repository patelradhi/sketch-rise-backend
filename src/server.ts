import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import mongoose from 'mongoose'
import { clerkMiddleware } from '@clerk/express'
import { PORT, CORS_ORIGIN } from './lib/constants'
import analyzeRouter from './routes/analyze'
import projectsRouter from './routes/projects'
import shareRouter from './routes/share'
import userRouter from './routes/user'

const app = express()

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({ origin: CORS_ORIGIN, credentials: true }))
app.use(express.json({ limit: '15mb' }))

// ── Clerk Auth Middleware ─────────────────────────────────────────────────────
app.use(clerkMiddleware())

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/analyze', analyzeRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/share', shareRouter)
app.use('/api/user', userRouter)

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

// ── DB + Start ────────────────────────────────────────────────────────────────
const start = async () => {
  const mongoUri = process.env.MONGODB_URI
  if (!mongoUri) throw new Error('MONGODB_URI is required in .env')

  await mongoose.connect(mongoUri)
  console.log('✅ MongoDB connected')

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  })
}

start().catch((err) => {
  console.error('❌ Server failed to start:', err)
  process.exit(1)
})
