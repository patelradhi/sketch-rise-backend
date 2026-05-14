import type { Response } from 'express'

const DEFAULT_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_ERROR',
  502: 'BAD_GATEWAY',
  503: 'SERVICE_UNAVAILABLE',
}

export const ok = <T>(res: Response, data: T, status = 200) =>
  res.status(status).json({ success: true, data })

export const fail = (res: Response, message: string, status = 400, code?: string) =>
  res.status(status).json({
    success: false,
    error: {
      code: code ?? DEFAULT_CODES[status] ?? 'ERROR',
      message,
    },
  })
