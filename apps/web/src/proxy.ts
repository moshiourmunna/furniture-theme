import { NextResponse, type NextRequest } from 'next/server';

const LOCALES = ['en', 'bn'];
const CSRF_COOKIE = 'shekor_csrf';
const adminOrigins = (process.env.ADMIN_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim());

/**
 * - /api/*: CORS preflight for the admin origin.
 * - Locale-less paths → preferred locale (cookie → Accept-Language → en).
 * - Ensures the double-submit CSRF cookie exists for browser sessions.
 * - /{locale}/account/* requires a session cookie (validated again server-side).
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname.startsWith('/api/')) {
    if (req.method === 'OPTIONS') {
      const origin = req.headers.get('origin') ?? '';
      const h = new Headers();
      if (adminOrigins.includes(origin)) {
        h.set('Access-Control-Allow-Origin', origin);
        h.set('Access-Control-Allow-Credentials', 'true');
        h.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        h.set('Access-Control-Allow-Headers', 'content-type,x-csrf-token');
        h.set('Access-Control-Max-Age', '600');
      }
      return new NextResponse(null, { status: 204, headers: h });
    }
    return NextResponse.next();
  }
  const first = pathname.split('/')[1];
  if (!LOCALES.includes(first)) {
    const cookie = req.cookies.get('shekor-lang')?.value;
    const accept = req.headers.get('accept-language') ?? '';
    const locale = cookie && LOCALES.includes(cookie) ? cookie : /^bn\b/i.test(accept) ? 'bn' : 'en';
    return NextResponse.redirect(new URL(`/${locale}${pathname === '/' ? '' : pathname}${search}`, req.url), 307);
  }
  const rest = pathname.slice(first.length + 1);
  if (/^\/account(\/|$)/.test(rest) && !req.cookies.get('shekor_sid')?.value) {
    return NextResponse.redirect(new URL(`/${first}/login?next=${encodeURIComponent(pathname + search)}`, req.url));
  }
  const res = NextResponse.next();
  if (!req.cookies.get(CSRF_COOKIE)?.value) {
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8);
    res.cookies.set(CSRF_COOKIE, token, { httpOnly: false, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 7 });
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/|media/|brand/|uploads/|favicon|icon|apple-icon|robots.txt|sitemap|manifest|opengraph-image).*)'],
};
