import type { Response } from 'express'

export const ok = <T>(res: Response, data: T, status = 200) =>
  res.status(status).json({ success: true, data })

export const fail = (res: Response, message: string, status = 400) =>
  res.status(status).json({ success: false, error: message })
