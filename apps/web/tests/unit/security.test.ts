import { afterEach, describe, expect, it } from 'vitest';
import { assertCsrf, rateLimit, resetRateLimits } from '@/server/security';
import { cleanHtml } from '@/server/sanitize';
import { ApiError } from '@/server/http';

const req = (method: string, headers: Record<string, string> = {}) => new Request('http://localhost:3000/api/v1/x', { method, headers });

describe('CSRF double-submit + origin check', () => {
  it('lets safe methods through', () => expect(() => assertCsrf(req('GET'))).not.toThrow());
  it('requires matching cookie and header', () => {
    expect(() => assertCsrf(req('POST'))).toThrow(ApiError);
    expect(() => assertCsrf(req('POST', { cookie: 'shekor_csrf=abc', 'x-csrf-token': 'abd' }))).toThrow(/mismatch/);
    expect(() => assertCsrf(req('POST', { cookie: 'shekor_csrf=abc', 'x-csrf-token': 'abc' }))).not.toThrow();
  });
  it('blocks foreign origins, allows the admin origin', () => {
    expect(() => assertCsrf(req('POST', { origin: 'https://evil.example', cookie: 'shekor_csrf=a', 'x-csrf-token': 'a' }))).toThrow(/Cross-site/);
    expect(() => assertCsrf(req('POST', { origin: 'http://localhost:5173', cookie: 'shekor_csrf=a', 'x-csrf-token': 'a' }))).not.toThrow();
  });
});

describe('rate limiting', () => {
  afterEach(() => resetRateLimits());
  it('allows up to the limit then 429s, per key', () => {
    const r = req('POST', { 'x-forwarded-for': '10.0.0.1' });
    for (let i = 0; i < 3; i++) rateLimit(r, 'unit', 3, 60_000);
    try { rateLimit(r, 'unit', 3, 60_000); expect.unreachable(); } catch (e) { expect((e as ApiError).status).toBe(429); }
    expect(() => rateLimit(req('POST', { 'x-forwarded-for': '10.0.0.2' }), 'unit', 3, 60_000)).not.toThrow();
  });
});

describe('HTML sanitizer', () => {
  it('strips scripts, handlers and javascript: URLs but keeps formatting', () => {
    const out = cleanHtml('<p onclick="x()">Hi <strong>there</strong></p><script>alert(1)</script><a href="javascript:alert(1)">x</a><img src="/a.webp" onerror="y()">');
    expect(out).toContain('<strong>there</strong>');
    expect(out).not.toMatch(/script|onclick|onerror|javascript:/);
    expect(out).toContain('<img src="/a.webp" />');
  });
  it('adds rel=noopener to links', () => expect(cleanHtml('<a href="https://x.com">x</a>')).toContain('rel="noopener noreferrer"'));
});
