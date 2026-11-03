import 'server-only';
import { NextResponse } from 'next/server';
import { ZodError, type ZodType } from 'zod';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message?: string, public details?: unknown) {
    super(message ?? code);
  }
}
export const badRequest = (msg = 'Bad request', details?: unknown) => new ApiError(400, 'bad_request', msg, details);
export const unauthorized = (msg = 'Sign in required') => new ApiError(401, 'unauthorized', msg);
export const forbidden = (msg = 'You do not have permission to do this') => new ApiError(403, 'forbidden', msg);
export const notFound = (msg = 'Not found') => new ApiError(404, 'not_found', msg);
export const conflict = (msg = 'Conflict') => new ApiError(409, 'conflict', msg);

export function json<T>(data: T, init?: number | ResponseInit) {
  const res = NextResponse.json(data, typeof init === 'number' ? { status: init } : init);
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export function errorResponse(err: unknown) {
  if (err instanceof ApiError) return json({ error: { code: err.code, message: err.message, details: err.details } }, err.status);
  if (err instanceof ZodError)
    return json(
      { error: { code: 'validation_error', message: 'Please check the highlighted fields', fields: Object.fromEntries(err.issues.map((i) => [i.path.join('.') || '_', i.message])) } },
      422,
    );
  // Prisma unique violation
  if (typeof err === 'object' && err && 'code' in err && (err as { code: string }).code === 'P2002')
    return json({ error: { code: 'conflict', message: 'A record with this value already exists' } }, 409);
  if (typeof err === 'object' && err && 'code' in err && (err as { code: string }).code === 'P2025')
    return json({ error: { code: 'not_found', message: 'Not found' } }, 404);
  if (typeof err === 'object' && err && 'code' in err && (err as { code: string }).code === 'P2003')
    return json({ error: { code: 'in_use', message: 'This record is referenced by other data and cannot be deleted' } }, 409);
  console.error('[api] unhandled error', err);
  return json({ error: { code: 'server_error', message: 'Something went wrong' } }, 500);
}

export async function readJson<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 1_000_000) throw badRequest('Payload too large');
    body = text ? JSON.parse(text) : {};
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw badRequest('Invalid JSON body');
  }
  return schema.parse(body);
}

export function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.get('cookie') || '';
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    if (k) out[k] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function clientIp(req: Request): string {
  return (req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1').trim();
}

export function intParam(v: string | null | undefined, def: number, min = 1, max = 1000): number {
  const n = Number.parseInt(String(v ?? ''), 10);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
}
