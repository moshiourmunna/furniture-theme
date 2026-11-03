import 'server-only';
import type { NextResponse } from 'next/server';
import { errorResponse } from './http';
import { assertCsrf, corsHeaders } from './security';

type Ctx<P> = { params: Promise<P> };
type Handler<P> = (req: Request, ctx: Ctx<P>) => Promise<Response | NextResponse>;

/**
 * Wraps a route handler with: CSRF/Origin verification on state-changing methods,
 * uniform JSON error mapping (ApiError, Zod, Prisma) and CORS headers for the admin origin.
 */
export function api<P = Record<string, string>>(handler: Handler<P>, opts: { csrf?: boolean } = {}) {
  return async (req: Request, ctx: Ctx<P>) => {
    let res: Response;
    try {
      if (opts.csrf !== false) assertCsrf(req);
      res = await handler(req, ctx);
    } catch (e) {
      res = errorResponse(e);
    }
    for (const [k, v] of Object.entries(corsHeaders(req))) res.headers.set(k, v);
    return res;
  };
}
