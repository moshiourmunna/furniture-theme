import { afterEach, describe, expect, it, vi } from 'vitest';
import { secureCookie } from '@/server/secure-cookie';

const req = (url: string, headers: Record<string, string> = {}) => new Request(url, { headers });

describe('secureCookie', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('is secure over https and behind a TLS proxy', () => {
    expect(secureCookie(req('https://shekor.com.bd/'))).toBe(true);
    expect(secureCookie(req('http://web:3000/', { 'x-forwarded-proto': 'https' }))).toBe(true);
  });
  it('is not secure on plain-http localhost (WebKit drops Secure cookies there)', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(secureCookie(req('http://localhost:3000/', { host: 'localhost:3000' }))).toBe(false);
  });
  it('stays secure in production on a real host even without forwarded headers', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(secureCookie(req('http://shekor.com.bd/', { host: 'shekor.com.bd' }))).toBe(true);
  });
  it('honours COOKIE_SECURE override', () => {
    vi.stubEnv('COOKIE_SECURE', '0');
    expect(secureCookie(req('https://shekor.com.bd/'))).toBe(false);
    vi.stubEnv('COOKIE_SECURE', '1');
    expect(secureCookie(req('http://localhost/'))).toBe(true);
  });
});
