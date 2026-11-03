import 'server-only';
import { createHash, randomBytes, randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { NextResponse } from 'next/server';
import { prisma, type User } from '@shekor/db';
import { normalizePhone, BD_PHONE_RE } from '@shekor/shared';
import { env } from './env';
import { ApiError, forbidden, parseCookies, unauthorized, clientIp } from './http';
import { secureCookie } from './secure-cookie';
import { newCsrfToken, setCsrfCookie } from './security';

export type Scope = 'store' | 'admin';
export const SESSION_COOKIE: Record<Scope, string> = { store: 'shekor_sid', admin: 'shekor_admin' };
const SESSION_DAYS: Record<Scope, number> = { store: 30, admin: 1 };

const sha256 = (s: string) => createHash('sha256').update(s + env.sessionSecret).digest('hex');

export const hashPassword = (pw: string) => bcrypt.hash(pw, 12);
export const verifyPassword = (pw: string, hash: string | null | undefined) => (hash ? bcrypt.compare(pw, hash) : Promise.resolve(false));

export async function createSession(res: NextResponse, req: Request, userId: number, scope: Scope) {
  const token = randomBytes(32).toString('base64url');
  const csrf = newCsrfToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS[scope] * 86400_000);
  await prisma.session.create({
    data: { id: sha256(token), userId, scope, csrfSecret: csrf, expiresAt, userAgent: req.headers.get('user-agent')?.slice(0, 250), ip: clientIp(req) },
  });
  res.cookies.set(SESSION_COOKIE[scope], token, { httpOnly: true, sameSite: 'lax', secure: secureCookie(req), path: '/', expires: expiresAt });
  setCsrfCookie(res, csrf, req); // rotate CSRF token on login
  await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
}

export async function destroySession(res: NextResponse, req: Request, scope: Scope) {
  const token = parseCookies(req)[SESSION_COOKIE[scope]];
  if (token) await prisma.session.deleteMany({ where: { id: sha256(token) } });
  res.cookies.set(SESSION_COOKIE[scope], '', { httpOnly: true, sameSite: 'lax', secure: secureCookie(req), path: '/', maxAge: 0 });
}

export type SessionUser = User & { permissions: string[]; roleName: string | null };

/** Resolve the user from a raw session token (works with Request cookies or next/headers cookies). */
export async function userFromToken(token: string | undefined, scope: Scope): Promise<SessionUser | null> {
  if (!token) return null;
  const s = await prisma.session.findUnique({
    where: { id: sha256(token) },
    include: { user: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
  });
  if (!s || s.scope !== scope || s.expiresAt < new Date() || !s.user.isActive) return null;
  if (scope === 'admin' && s.user.kind !== 'STAFF') return null;
  const { role, ...user } = s.user;
  return { ...user, roleName: role?.name ?? null, permissions: role?.permissions.map((p) => p.permission.code) ?? [] } as SessionUser;
}

export const getUser = (req: Request, scope: Scope = 'store') => userFromToken(parseCookies(req)[SESSION_COOKIE[scope]], scope);

export async function requireUser(req: Request): Promise<SessionUser> {
  const u = await getUser(req, 'store');
  if (!u) throw unauthorized();
  return u;
}

/** Admin guard: valid staff session AND the given permission (RBAC is enforced on every admin endpoint). */
export async function requireStaff(req: Request, permission?: string): Promise<SessionUser> {
  const u = await getUser(req, 'admin');
  if (!u) throw unauthorized('Admin sign-in required');
  if (permission && !u.permissions.includes(permission)) throw forbidden(`Missing permission: ${permission}`);
  return u;
}

export function publicUser(u: SessionUser | User) {
  const { passwordHash: _ph, ...rest } = u as User & { passwordHash?: string };
  void _ph;
  return rest;
}

// ── Identifier helpers ──
export function classifyIdentifier(raw: string): { kind: 'email' | 'phone'; value: string } {
  const v = raw.trim();
  if (v.includes('@')) return { kind: 'email', value: v.toLowerCase() };
  const p = normalizePhone(v);
  if (!BD_PHONE_RE.test(p)) throw new ApiError(422, 'validation_error', 'Enter a valid email or Bangladeshi mobile number');
  return { kind: 'phone', value: p };
}
export const findByIdentifier = (id: { kind: 'email' | 'phone'; value: string }) =>
  prisma.user.findFirst({ where: id.kind === 'email' ? { email: id.value } : { phone: id.value } });

// ── OTP ──
const OTP_TTL_MS = 5 * 60_000;
const OTP_MAX_ATTEMPTS = 5;

export async function issueOtp(target: string, purpose: string): Promise<string> {
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await prisma.otpCode.updateMany({ where: { target, purpose, consumed: false }, data: { consumed: true } });
  await prisma.otpCode.create({ data: { target, purpose, codeHash: sha256(code), expiresAt: new Date(Date.now() + OTP_TTL_MS) } });
  return code;
}

export async function verifyOtp(target: string, purpose: string, code: string): Promise<boolean> {
  const otp = await prisma.otpCode.findFirst({ where: { target, purpose, consumed: false }, orderBy: { createdAt: 'desc' } });
  if (!otp || otp.expiresAt < new Date()) return false;
  if (otp.attempts >= OTP_MAX_ATTEMPTS) throw new ApiError(429, 'otp_locked', 'Too many wrong codes — request a new one');
  if (otp.codeHash !== sha256(code)) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return false;
  }
  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumed: true } });
  return true;
}
