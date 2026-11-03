import { describe, expect, it } from 'vitest';
import {
  ORDER_STATUSES, ORDER_TRANSITIONS, canTransition, computeTotals, deliveryCharge, emiMonthly, evaluateCoupon, matchZone, pointsForAmount, requiredAdvancePercent, tierFor,
} from '../src/commerce';

const zone = { charge: 1500, freeOver: 50000, assemblyFee: 1000 };
const coupon = { code: 'WELCOME10', type: 'percent', value: 10, minSubtotal: 10000, maxDiscount: 5000, usageLimit: 100, usedCount: 3, isActive: true };

describe('order workflow', () => {
  it('allows the happy path and blocks skipping', () => {
    expect(canTransition('PENDING', 'CONFIRMED')).toBe(true);
    expect(canTransition('CONFIRMED', 'DISPATCHED')).toBe(true);
    expect(canTransition('PENDING', 'DELIVERED')).toBe(false);
    expect(canTransition('DELIVERED', 'CANCELLED')).toBe(false);
  });
  it('terminal states have no exits and every target is a known status', () => {
    expect(ORDER_TRANSITIONS.CANCELLED).toEqual([]);
    expect(ORDER_TRANSITIONS.RETURNED).toEqual([]);
    for (const to of Object.values(ORDER_TRANSITIONS).flat()) expect(ORDER_STATUSES).toContain(to);
  });
});

describe('coupons', () => {
  const now = new Date('2026-11-03T00:00:00Z');
  it('percent with cap', () => {
    expect(evaluateCoupon(coupon, 20000, now)).toEqual({ ok: true, discount: 2000, freeShipping: false });
    expect(evaluateCoupon(coupon, 90000, now)).toEqual({ ok: true, discount: 5000, freeShipping: false });
  });
  it('fixed never exceeds subtotal; shipping coupon', () => {
    expect(evaluateCoupon({ ...coupon, type: 'fixed', value: 3000, minSubtotal: 0, maxDiscount: null }, 2000, now)).toMatchObject({ discount: 2000 });
    expect(evaluateCoupon({ ...coupon, type: 'shipping' }, 20000, now)).toEqual({ ok: true, discount: 0, freeShipping: true });
  });
  it.each([
    [{ isActive: false }, 'inactive'],
    [{ startsAt: '2026-12-01' }, 'not_started'],
    [{ endsAt: '2026-10-01' }, 'expired'],
    [{ usedCount: 100 }, 'limit_reached'],
  ])('rejects %o as %s', (patch, reason) => expect(evaluateCoupon({ ...coupon, ...patch }, 20000, now)).toEqual({ ok: false, reason }));
  it('rejects below minimum', () => expect(evaluateCoupon(coupon, 9999, now)).toEqual({ ok: false, reason: 'min_subtotal' }));
});

describe('delivery + totals', () => {
  it('free over threshold or with shipping coupon', () => {
    expect(deliveryCharge(zone, 49999)).toBe(1500);
    expect(deliveryCharge(zone, 50000)).toBe(0);
    expect(deliveryCharge(zone, 100, true)).toBe(0);
    expect(deliveryCharge({ ...zone, freeOver: null }, 1e7)).toBe(1500);
  });
  it('computes full payment', () => {
    expect(computeTotals({ subtotal: 42000, discount: 4200, zone, assembly: true, freeShipping: false, method: 'bkash', plan: 'full' }))
      .toEqual({ subtotal: 42000, discount: 4200, deliveryCharge: 1500, assemblyCharge: 1000, total: 40300, payNow: 40300, advancePercent: 0 });
  });
  it('advance plan is clamped to 20–50%', () => {
    expect(computeTotals({ subtotal: 100000, discount: 0, zone, assembly: false, freeShipping: false, method: 'card', plan: 'advance', advancePercent: 80 })).toMatchObject({ advancePercent: 50, payNow: 50000 });
    expect(computeTotals({ subtotal: 100000, discount: 0, zone, assembly: false, freeShipping: false, method: 'card', plan: 'advance', advancePercent: 5 })).toMatchObject({ advancePercent: 20, payNow: 20000 });
  });
  it('COD needs 20% advance only at ৳50,000+', () => {
    expect(requiredAdvancePercent('cod', 49999)).toBe(0);
    expect(requiredAdvancePercent('cod', 50000)).toBe(20);
    expect(requiredAdvancePercent('bkash', 900000)).toBe(0);
    expect(computeTotals({ subtotal: 30000, discount: 0, zone, assembly: false, freeShipping: false, method: 'cod', plan: 'full' })).toMatchObject({ total: 31500, payNow: 0 });
    expect(computeTotals({ subtotal: 60000, discount: 0, zone, assembly: false, freeShipping: false, method: 'cod', plan: 'full' })).toMatchObject({ total: 60000, payNow: 12000 });
  });
});

describe('EMI, loyalty, zones', () => {
  it('EMI is 0% to 12 months, 7% fee beyond', () => {
    expect(emiMonthly(120000, 12)).toBe(10000);
    expect(emiMonthly(120000, 24)).toBe(5350);
  });
  it('points + tiers', () => {
    expect(pointsForAmount(42099)).toBe(420);
    expect([tierFor(0), tierFor(1500), tierFor(4999), tierFor(5000)]).toEqual(['Sapling', 'Segun', 'Segun', 'Heartwood']);
  });
  it('matches district → division → fallback', () => {
    const zones = [
      { id: 'dhaka-city', divisions: ['Dhaka'], districts: ['Dhaka'] },
      { id: 'dhaka-div', divisions: ['Dhaka'], districts: [] },
      { id: 'rest', divisions: ['*'], districts: [] },
    ];
    expect(matchZone(zones, 'Dhaka', 'Dhaka')?.id).toBe('dhaka-city');
    expect(matchZone(zones, 'Dhaka', 'Gazipur')?.id).toBe('dhaka-div');
    expect(matchZone(zones, 'Sylhet', 'Sylhet')?.id).toBe('rest');
    expect(matchZone([], 'Sylhet')).toBeNull();
  });
});
