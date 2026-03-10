import type { NextFunction, Request, Response } from "express";

/**
 * Wraps an async Express route handler to forward rejected promises
 * to Express's error middleware. Required because Express 4 does not
 * natively handle async errors.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
