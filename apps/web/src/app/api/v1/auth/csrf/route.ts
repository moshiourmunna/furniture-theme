import { api } from '@/server/route';
import { json, parseCookies } from '@/server/http';
import { CSRF_COOKIE, newCsrfToken, setCsrfCookie } from '@/server/security';

/** Issues (or returns) the double-submit CSRF token. Clients send it back in the x-csrf-token header. */
export const GET = api(async (req) => {
  const existing = parseCookies(req)[CSRF_COOKIE];
  const token = existing || newCsrfToken();
  const res = json({ csrfToken: token });
  if (!existing) setCsrfCookie(res, token);
  return res;
});
