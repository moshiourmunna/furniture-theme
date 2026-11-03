import { describe, expect, it } from 'vitest';
import * as login from '@/app/api/v1/auth/login/route';
import * as logout from '@/app/api/v1/auth/logout/route';
import * as me from '@/app/api/v1/auth/me/route';
import * as register from '@/app/api/v1/auth/register/route';
import * as otpReq from '@/app/api/v1/auth/otp/request/route';
import * as otpVerify from '@/app/api/v1/auth/otp/verify/route';
import * as reset from '@/app/api/v1/auth/password/reset/route';
import * as addresses from '@/app/api/v1/account/addresses/route';
import * as orders from '@/app/api/v1/account/orders/route';
import { Client } from './client';

describe('customer auth', () => {
  it('rejects state-changing requests without the CSRF token', async () => {
    const c = new Client();
    const r = await c.call(login, 'POST', '/api/v1/auth/login', { body: { identifier: 'customer@shekor.test', password: 'Customer@2026' }, csrf: false });
    expect(r.status).toBe(403);
    expect(r.data.error.code).toBe('csrf');
  });
  it('rejects cross-site origins', async () => {
    const c = new Client();
    const r = await c.call(login, 'POST', '/api/v1/auth/login', { body: { identifier: 'customer@shekor.test', password: 'x' }, headers: { origin: 'https://evil.example' } });
    expect(r.status).toBe(403);
    expect(r.data.error.code).toBe('bad_origin');
  });
  it('logs in by email or phone, exposes /me, logs out', async () => {
    const c = new Client();
    expect((await c.call(login, 'POST', '/api/v1/auth/login', { body: { identifier: 'customer@shekor.test', password: 'wrong-Pass1' } })).status).toBe(401);
    const ok = await c.call(login, 'POST', '/api/v1/auth/login', { body: { identifier: '01711234567', password: 'Customer@2026' } });
    expect(ok.status).toBe(200);
    expect(ok.data.user.passwordHash).toBeUndefined();
    expect(c.jar.get('shekor_sid')).toBeTruthy();
    const m = await c.call(me, 'GET', '/api/v1/auth/me');
    expect(m.data.user.email).toBe('customer@shekor.test');
    const o = await c.call(orders, 'GET', '/api/v1/account/orders');
    expect(o.status).toBe(200);
    await c.call(logout, 'POST', '/api/v1/auth/logout');
    expect((await c.call(me, 'GET', '/api/v1/auth/me')).data.user).toBeNull();
    expect((await c.call(orders, 'GET', '/api/v1/account/orders')).status).toBe(401);
  });
  it('registers, verifies by OTP, manages addresses', async () => {
    const c = new Client();
    const phone = `0181${String(Date.now()).slice(-7)}`;
    const r = await c.call(register, 'POST', '/api/v1/auth/register', { body: { name: 'Test Rahim', phone, password: 'Strong@Pass1' } });
    expect(r.status).toBeLessThan(300);
    const dup = await c.call(register, 'POST', '/api/v1/auth/register', { body: { name: 'Test Rahim', phone, password: 'Strong@Pass1' } });
    expect(dup.status).toBe(409);
    const otp = await c.call(otpReq, 'POST', '/api/v1/auth/otp/request', { body: { target: phone, purpose: 'verify' } });
    expect(otp.data.devOtp).toMatch(/^\d{6}$/);
    expect((await c.call(otpVerify, 'POST', '/api/v1/auth/otp/verify', { body: { target: phone, purpose: 'verify', code: '000000' } })).status).toBe(401);
    const v = await c.call(otpVerify, 'POST', '/api/v1/auth/otp/verify', { body: { target: phone, purpose: 'verify', code: otp.data.devOtp } });
    expect(v.status).toBe(200);
    if (!c.jar.get('shekor_sid')) await c.call(login, 'POST', '/api/v1/auth/login', { body: { identifier: phone, password: 'Strong@Pass1' } });
    const a = await c.call(addresses, 'POST', '/api/v1/account/addresses', { body: { name: 'Test Rahim', phone, division: 'Dhaka', district: 'Dhaka', area: 'Banani', line1: 'House 1, Road 2' } });
    expect(a.status).toBe(201);
    const list = await c.call(addresses, 'GET', '/api/v1/account/addresses');
    expect(list.data.items ?? list.data).toHaveLength(1);
  });
  it('resets a password with an OTP', async () => {
    const c = new Client();
    const otp = await c.call(otpReq, 'POST', '/api/v1/auth/otp/request', { body: { target: 'customer@shekor.test', purpose: 'reset' } });
    const r = await c.call(reset, 'POST', '/api/v1/auth/password/reset', { body: { target: 'customer@shekor.test', code: otp.data.devOtp, password: 'Customer@2026' } });
    expect(r.status).toBe(200);
    const ok = await c.call(login, 'POST', '/api/v1/auth/login', { body: { identifier: 'customer@shekor.test', password: 'Customer@2026' } });
    expect(ok.status).toBe(200);
  });
  it('never reveals whether an account exists on OTP request', async () => {
    const r = await new Client().call(otpReq, 'POST', '/api/v1/auth/otp/request', { body: { target: 'nobody@nowhere.test', purpose: 'login' } });
    expect(r.status).toBe(200);
    expect(r.data.sent).toBe(true);
    expect(r.data.devOtp).toBeUndefined();
  });
});
