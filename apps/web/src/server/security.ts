import 'server-only';
import { secureCookie } from './secure-cookie';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { env } from './env';
import { ApiError, clientIp, parseCookies } from './http';

// ── Rate limiting (fixed window, in-memory). Swap for Redis in multi-instance deployments. ──
const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(req: Request, bucket: string, limit: number, windowMs: number, key?: string) {
  if (process.env.DISABLE_RATE_LIMIT === '1') return;
  const id = `${bucket}:${key ?? clientIp(req)}`;
  const now = Date.now();
  const b = buckets.get(id);
  if (!b || b.reset < now) {
    buckets.set(id, { count: 1, reset: now + windowMs });
    if (buckets.size > 50_000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    return;
  }
  b.count++;
  if (b.count > limit) throw new ApiError(429, 'rate_limited', 'Too many requests — please wait a moment and try again', { retryAfter: Math.ceil((b.reset - now) / 1000) });
}
export function resetRateLimits() {
  buckets.clear();
}

// ── CSRF: double-submit token + Origin allow-list for state-changing requests. ──
export const CSRF_COOKIE = 'shekor_csrf';
export const CSRF_HEADER = 'x-csrf-token';
export const newCsrfToken = () => randomBytes(24).toString('base64url');

export function allowedOrigins(): string[] {
  return [env.appUrl, ...env.adminOrigins];
}

export function assertCsrf(req: Request) {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return;
  const origin = req.headers.get('origin');
  if (origin && !allowedOrigins().includes(origin) && origin !== new URL(req.url).origin) throw new ApiError(403, 'bad_origin', 'Cross-site request blocked');
  const cookie = parseCookies(req)[CSRF_COOKIE];
  const header = req.headers.get(CSRF_HEADER);
  if (!cookie || !header) throw new ApiError(403, 'csrf', 'Security token missing — please refresh the page');
  const a = Buffer.from(cookie);
  const b = Buffer.from(header);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new ApiError(403, 'csrf', 'Security token mismatch — please refresh the page');
}

export function setCsrfCookie(res: NextResponse, token: string, req: Request) {
  // Readable by JS on purpose (double-submit pattern); SameSite=Lax blocks cross-site sends.
  res.cookies.set(CSRF_COOKIE, token, { httpOnly: false, sameSite: 'lax', secure: secureCookie(req), path: '/', maxAge: 60 * 60 * 24 * 7 });
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  if (!origin || !env.adminOrigins.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': `content-type,${CSRF_HEADER}`,
    Vary: 'Origin',
  };
}
