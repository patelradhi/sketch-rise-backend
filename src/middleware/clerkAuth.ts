import { getAuth, requireAuth as clerkRequireAuth } from '@clerk/express'
import type { Request, Response, NextFunction } from 'express'

// Protects a route — returns 401 if no valid Clerk session
export const requireAuth = clerkRequireAuth()

// Attach userId to request for use in handlers
export function getUserId(req: Request): string | null {
  return getAuth(req).userId ?? null
}
