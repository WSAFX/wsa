import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', details: err.flatten() });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  // Postgres unique violation (e.g. a duplicate slug) — a client error, not a crash.
  if (err && typeof err === 'object' && (err as { code?: string }).code === '23505') {
    res.status(409).json({ error: 'That name or slug is already in use. Choose a different one.' });
    return;
  }
  logger.error('unhandled error', {
    message: describeError(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  res.status(500).json({ error: 'Internal server error' });
}

/** Extracts a readable message from Errors, Database/Postgres objects, or anything. */
function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object') {
    const o = err as Record<string, unknown>;
    if (typeof o.message === 'string') return o.message;
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
}
