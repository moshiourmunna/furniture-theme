export const PAYMENT_METHODS = ['bkash', 'nagad', 'card', 'cod', 'bank'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const ORDER_STATUSES = [
  'PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'QUALITY_CHECK', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED',
] as const;
export type OrderStatusCode = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatusCode, [string, string]> = {
  PENDING: ['Placed', 'অর্ডার হয়েছে'],
  CONFIRMED: ['Confirmed', 'নিশ্চিত'],
  IN_PRODUCTION: ['In production', 'তৈরি হচ্ছে'],
  QUALITY_CHECK: ['Quality check', 'মান যাচাই'],
  DISPATCHED: ['Dispatched', 'পাঠানো হয়েছে'],
  OUT_FOR_DELIVERY: ['Out for delivery', 'ডেলিভারির পথে'],
  DELIVERED: ['Delivered', 'ডেলিভারি সম্পন্ন'],
  CANCELLED: ['Cancelled', 'বাতিল'],
  RETURNED: ['Returned', 'ফেরত'],
};

/** The happy-path timeline shown on order tracking. */
export const ORDER_TIMELINE: OrderStatusCode[] = [
  'PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'QUALITY_CHECK', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED',
];

/** Allowed status transitions (admin workflow). Production steps may be skipped for in-stock items. */
export const ORDER_TRANSITIONS: Record<OrderStatusCode, OrderStatusCode[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PRODUCTION', 'QUALITY_CHECK', 'DISPATCHED', 'CANCELLED'],
  IN_PRODUCTION: ['QUALITY_CHECK', 'CANCELLED'],
  QUALITY_CHECK: ['DISPATCHED', 'IN_PRODUCTION'],
  DISPATCHED: ['OUT_FOR_DELIVERY', 'DELIVERED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'RETURNED'],
  DELIVERED: ['RETURNED'],
  CANCELLED: [],
  RETURNED: [],
};

export function canTransition(from: OrderStatusCode, to: OrderStatusCode): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

/** EMI monthly instalment. 0% up to 12 months; 18/24 months carry a 7% bank fee (per EMI terms). */
export const EMI_TENURES = [3, 6, 9, 12, 18, 24] as const;
export function emiMonthly(price: number, months: number): number {
  const fee = months > 12 ? 0.07 : 0;
  return Math.ceil(Math.round(price * (1 + fee)) / months); // round first: 120000 * 1.07 is 128400.00000000001 in floating point
}
export const EMI_MIN_ORDER = 10_000;

export interface ZoneLike {
  charge: number;
  freeOver: number | null;
  assemblyFee: number;
  codAvailable?: boolean;
}

export function deliveryCharge(zone: ZoneLike, subtotalAfterDiscount: number, freeShippingCoupon = false): number {
  if (freeShippingCoupon) return 0;
  if (zone.freeOver != null && subtotalAfterDiscount >= zone.freeOver) return 0;
  return zone.charge;
}

export interface CouponLike {
  code: string;
  type: 'percent' | 'fixed' | 'shipping' | string;
  value: number;
  minSubtotal: number;
  maxDiscount: number | null;
  usageLimit?: number | null;
  usedCount?: number;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
  isActive?: boolean;
}

export type CouponCheck = { ok: true; discount: number; freeShipping: boolean } | { ok: false; reason: string };

export function evaluateCoupon(c: CouponLike, subtotal: number, now = new Date()): CouponCheck {
  if (c.isActive === false) return { ok: false, reason: 'inactive' };
  if (c.startsAt && new Date(c.startsAt) > now) return { ok: false, reason: 'not_started' };
  if (c.endsAt && new Date(c.endsAt) < now) return { ok: false, reason: 'expired' };
  if (c.usageLimit != null && (c.usedCount ?? 0) >= c.usageLimit) return { ok: false, reason: 'limit_reached' };
  if (subtotal < c.minSubtotal) return { ok: false, reason: 'min_subtotal' };
  if (c.type === 'shipping') return { ok: true, discount: 0, freeShipping: true };
  let discount = c.type === 'percent' ? Math.floor((subtotal * c.value) / 100) : c.value;
  if (c.maxDiscount != null) discount = Math.min(discount, c.maxDiscount);
  discount = Math.min(discount, subtotal);
  return { ok: true, discount, freeShipping: false };
}

/** Advance payment rule: COD on large orders needs an advance (20% over ৳50,000, else 0). */
export const ADVANCE_THRESHOLD = 50_000;
export function requiredAdvancePercent(method: PaymentMethod, total: number): number {
  if (method === 'cod' && total >= ADVANCE_THRESHOLD) return 20;
  return 0;
}

export interface Totals {
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  assemblyCharge: number;
  total: number;
  payNow: number;
  advancePercent: number;
}

export function computeTotals(input: {
  subtotal: number;
  discount: number;
  zone: ZoneLike;
  assembly: boolean;
  freeShipping: boolean;
  method: PaymentMethod;
  plan: 'full' | 'advance';
  advancePercent?: number;
}): Totals {
  const after = Math.max(0, input.subtotal - input.discount);
  const dc = deliveryCharge(input.zone, after, input.freeShipping);
  const ac = input.assembly ? input.zone.assemblyFee : 0;
  const total = after + dc + ac;
  let advancePercent = 0;
  if (input.method === 'cod') advancePercent = requiredAdvancePercent('cod', total);
  else if (input.plan === 'advance') advancePercent = Math.min(50, Math.max(20, input.advancePercent ?? 20));
  const payNow =
    input.method === 'cod' ? Math.ceil((total * advancePercent) / 100) : advancePercent ? Math.ceil((total * advancePercent) / 100) : total;
  return { subtotal: input.subtotal, discount: input.discount, deliveryCharge: dc, assemblyCharge: ac, total, payNow, advancePercent };
}

/** 1 loyalty point per ৳100 spent. Tiers by lifetime points. */
export const pointsForAmount = (amount: number) => Math.floor(amount / 100);
export function tierFor(points: number): 'Sapling' | 'Segun' | 'Heartwood' {
  if (points >= 5000) return 'Heartwood';
  if (points >= 1500) return 'Segun';
  return 'Sapling';
}

export const DELIVERY_SLOTS = [
  { code: 'morning', en: 'Morning (9am–1pm)', bn: 'সকাল (৯টা–১টা)' },
  { code: 'afternoon', en: 'Afternoon (1pm–5pm)', bn: 'দুপুর (১টা–৫টা)' },
  { code: 'evening', en: 'Evening (5pm–9pm)', bn: 'সন্ধ্যা (৫টা–৯টা)' },
] as const;

/** Resolve a delivery zone: district match → division-only zone → "*" fallback. Pure, shared by client and server. */
export function matchZone<Z extends { divisions: unknown; districts: unknown }>(zones: Z[], division?: string, district?: string): Z | null {
  const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);
  if (district) {
    const z = zones.find((z) => arr(z.districts).includes(district));
    if (z) return z;
  }
  if (division) {
    const z = zones.find((z) => arr(z.divisions).includes(division) && arr(z.districts).length === 0);
    if (z) return z;
  }
  return zones.find((z) => arr(z.divisions).includes('*')) ?? null;
}
