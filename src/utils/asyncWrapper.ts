import type { Request, Response, NextFunction, RequestHandler } from 'express'

/** Eliminates try/catch boilerplate in every route handler */
export const asyncWrapper =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next)
