/* Shared by proxy.ts and route handlers; no server-only import so the proxy bundle can use it. */
/**
 * Whether cookies should carry the Secure flag. HTTPS (directly or via x-forwarded-proto) → yes. Production on a
 * real host → yes. Plain-http localhost (local prod builds, CI) → no, because WebKit drops Secure cookies on http://localhost.
 * Override with COOKIE_SECURE=1|0.
 */
export function secureCookie(req: Request): boolean {
  if (process.env.COOKIE_SECURE === '1') return true;
  if (process.env.COOKIE_SECURE === '0') return false;
  const url = new URL(req.url);
  const proto = req.headers.get('x-forwarded-proto')?.split(',')[0].trim() || url.protocol.replace(':', '');
  if (proto === 'https') return true;
  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || url.host).split(':')[0];
  return process.env.NODE_ENV === 'production' && !['localhost', '127.0.0.1', '[::1]'].includes(host);
}
