import { describe, expect, it } from 'vitest';
import { BD_DIVISIONS, ALL_DISTRICTS, normalizePhone } from '../src/bd';
import { ALL_PERMISSIONS, ROLE_PRESETS, hasPermission } from '../src/permissions';
import { checkoutSchema, loginSchema, phoneSchema, registerSchema } from '../src/schemas';

describe('Bangladesh data', () => {
  it('has 8 divisions and 64 unique districts', () => {
    expect(BD_DIVISIONS).toHaveLength(8);
    expect(new Set(ALL_DISTRICTS).size).toBe(64);
  });
  it('normalises phones', () => {
    expect(normalizePhone('+880 1711-234567')).toBe('01711234567');
    expect(normalizePhone('01711234567')).toBe('01711234567');
  });
  it('validates BD mobiles', () => {
    expect(phoneSchema.safeParse('+8801711234567').success).toBe(true);
    expect(phoneSchema.safeParse('01211234567').success).toBe(false);
    expect(phoneSchema.safeParse('0171123456').success).toBe(false);
  });
});

describe('auth schemas', () => {
  it('requires a strong password on register', () => {
    expect(registerSchema.safeParse({ name: 'Rahim', phone: '01711234567', email: 'r@x.com', password: 'weak' }).success).toBe(false);
  });
  it('login accepts email or phone', () => {
    expect(loginSchema.safeParse({ identifier: 'customer@shekor.test', password: 'x' }).success).toBe(true);
  });
});

describe('checkout schema', () => {
  it('rejects an empty cart', () => {
    const r = checkoutSchema.safeParse({ items: [] });
    expect(r.success).toBe(false);
  });
});

describe('permissions', () => {
  it('presets only use known codes and Super Admin has all', () => {
    for (const r of ROLE_PRESETS) for (const p of r.permissions) expect(ALL_PERMISSIONS).toContain(p);
    const sa = ROLE_PRESETS.find((r) => r.name === 'Super Admin')!;
    expect(new Set(sa.permissions)).toEqual(new Set(ALL_PERMISSIONS));
  });
  it('hasPermission', () => {
    expect(hasPermission(['orders.read'], 'orders.read')).toBe(true);
    expect(hasPermission(['orders.read'], 'orders.write')).toBe(false);
    expect(hasPermission(undefined, 'orders.read')).toBe(false);
  });
});
