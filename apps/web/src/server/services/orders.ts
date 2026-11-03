import { env } from '@/server/env';
import 'server-only';
import { randomBytes, randomInt } from 'node:crypto';
import { prisma, type Prisma, type OrderStatus } from '@shekor/db';
import {
  canTransition, computeTotals, evaluateCoupon, pointsForAmount, tierFor, ORDER_STATUS_LABEL, formatPrice,
  type CheckoutInput, type PaymentMethod,
  matchZone,
} from '@shekor/shared';
import { ApiError, badRequest, notFound } from '../http';
import { gatewayFor } from '../payments';
import { sms } from '../notify';
import type { SessionUser } from '../auth';

type Line = { productId: number; variantId?: number | null; qty: number };

export async function resolveZone(division?: string, district?: string) {
  const zones = await prisma.deliveryZone.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
  if (!division) return null;
  return matchZone(zones, division, district);
}

/** Re-prices cart lines from the database (client prices are never trusted). */
export async function priceLines(lines: Line[]) {
  const ids = [...new Set(lines.map((l) => l.productId))];
  const products = await prisma.product.findMany({ where: { id: { in: ids } }, include: { variants: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } } });
  const out = [];
  const issues: { productId: number; code: string }[] = [];
  for (const l of lines) {
    const p = products.find((x) => x.id === l.productId);
    if (!p || !p.isActive) { issues.push({ productId: l.productId, code: 'unavailable' }); continue; }
    const v = (l.variantId ? p.variants.find((x) => x.id === l.variantId) : null) ?? p.variants.find((x) => x.isDefault) ?? p.variants[0] ?? null;
    if (l.variantId && (!v || v.id !== l.variantId)) { issues.push({ productId: l.productId, code: 'variant_unavailable' }); continue; }
    const madeToOrder = p.stockStatus === 'MADE_TO_ORDER';
    if (p.stockStatus === 'OUT_OF_STOCK' || (!madeToOrder && v && v.stockQty < l.qty)) { issues.push({ productId: l.productId, code: 'out_of_stock' }); continue; }
    const unit = p.price + (v?.priceDelta ?? 0);
    out.push({ product: p, variant: v, qty: l.qty, unitPrice: unit, lineTotal: unit * l.qty, madeToOrder });
  }
  return { lines: out, issues };
}

export async function quote(input: { items: Line[]; couponCode?: string; division?: string; district?: string; assembly?: boolean; paymentMethod?: PaymentMethod; paymentPlan?: 'full' | 'advance'; advancePercent?: number }, userId?: number) {
  const { lines, issues } = await priceLines(input.items);
  const subtotal = lines.reduce((a, l) => a + l.lineTotal, 0);
  let discount = 0;
  let freeShipping = false;
  let coupon: { code: string; ok: boolean; reason?: string; discount?: number } | null = null;
  if (input.couponCode) {
    const c = await prisma.coupon.findUnique({ where: { code: input.couponCode.toUpperCase() } });
    if (!c) coupon = { code: input.couponCode, ok: false, reason: 'not_found' };
    else {
      let r = evaluateCoupon(c, subtotal);
      if (r.ok && c.perUserLimit && userId) {
        const used = await prisma.order.count({ where: { userId, couponId: c.id, status: { not: 'CANCELLED' } } });
        if (used >= c.perUserLimit) r = { ok: false, reason: 'per_user_limit' };
      }
      coupon = r.ok ? { code: c.code, ok: true, discount: r.discount } : { code: c.code, ok: false, reason: r.reason };
      if (r.ok) { discount = r.discount; freeShipping = r.freeShipping; }
    }
  }
  const zone = await resolveZone(input.division, input.district);
  const method = input.paymentMethod ?? 'bkash';
  const totals = computeTotals({
    subtotal, discount, zone: zone ?? { charge: 0, freeOver: null, assemblyFee: 0 }, assembly: input.assembly ?? true, freeShipping,
    method, plan: input.paymentPlan ?? 'full', advancePercent: input.advancePercent,
  });
  return {
    lines: lines.map((l) => ({
      productId: l.product.id, variantId: l.variant?.id ?? null, slug: l.product.slug, sku: l.variant?.sku ?? l.product.sku, nameEn: l.product.nameEn, nameBn: l.product.nameBn,
      variantEn: l.variant?.nameEn ?? null, variantBn: l.variant?.nameBn ?? null, image: l.product.images[0]?.url ?? null, qty: l.qty,
      unitPrice: l.unitPrice, lineTotal: l.lineTotal, madeToOrder: l.madeToOrder, leadTimeDays: l.product.leadTimeDays,
      stockQty: l.variant?.stockQty ?? 0, emiAvailable: l.product.emiAvailable,
    })),
    issues, coupon, zone: zone ? { id: zone.id, nameEn: zone.nameEn, nameBn: zone.nameBn, leadDaysMin: zone.leadDaysMin, leadDaysMax: zone.leadDaysMax, codAvailable: zone.codAvailable, freeOver: zone.freeOver } : null,
    totals, freeShipping,
  };
}

async function uniqueOrderNo(tx: Prisma.TransactionClient) {
  for (let i = 0; i < 5; i++) {
    const no = `SHK-${randomInt(270000, 999999)}`;
    if (!(await tx.order.findUnique({ where: { orderNo: no } }))) return no;
  }
  throw new ApiError(500, 'order_no', 'Could not allocate an order number');
}

export async function placeOrder(input: CheckoutInput, user: SessionUser | null) {
  const q = await quote({ ...input, division: input.address.division, district: input.address.district }, user?.id);
  if (q.issues.length) throw new ApiError(409, 'cart_changed', 'Some items in your bag are no longer available', q.issues);
  if (!q.lines.length) throw badRequest('Your bag is empty');
  if (input.couponCode && !q.coupon?.ok) throw new ApiError(422, 'coupon_invalid', 'This coupon cannot be applied', q.coupon);
  if (!q.zone) throw badRequest('We could not find a delivery zone for this address');
  if (input.paymentMethod === 'cod' && !q.zone.codAvailable) throw new ApiError(422, 'cod_unavailable', 'Cash on delivery is not available in this area');
  const deliveryDate = new Date(`${input.deliveryDate}T00:00:00+06:00`);
  const earliest = new Date(Date.now() + q.zone.leadDaysMin * 86400_000 - 86400_000);
  if (Number.isNaN(deliveryDate.getTime()) || deliveryDate < earliest) throw new ApiError(422, 'validation_error', 'Choose a delivery date after the minimum lead time', { fields: { deliveryDate: 'too_early' } });

  const t = q.totals;
  const order = await prisma.$transaction(async (tx) => {
    // reserve stock atomically (guards against overselling under concurrency)
    for (const l of q.lines) {
      if (l.madeToOrder || !l.variantId) continue;
      const r = await tx.productVariant.updateMany({ where: { id: l.variantId, stockQty: { gte: l.qty } }, data: { stockQty: { decrement: l.qty } } });
      if (r.count !== 1) throw new ApiError(409, 'cart_changed', 'An item just sold out', [{ productId: l.productId, code: 'out_of_stock' }]);
    }
    const orderNo = await uniqueOrderNo(tx);
    const coupon = q.coupon?.ok ? await tx.coupon.update({ where: { code: q.coupon.code }, data: { usedCount: { increment: 1 } } }) : null;
    const o = await tx.order.create({
      data: {
        orderNo, userId: user?.id ?? null, status: 'PENDING', paymentStatus: input.paymentMethod === 'cod' && !t.advancePercent ? 'UNPAID' : 'PENDING',
        paymentMethod: input.paymentMethod, paymentPlan: t.advancePercent ? 'advance' : 'full', advancePercent: t.advancePercent,
        customerName: input.customer.name, phone: input.customer.phone, email: input.customer.email ?? null,
        division: input.address.division, district: input.address.district, area: input.address.area, line1: input.address.line1,
        zoneId: q.zone!.id, zoneName: q.zone!.nameEn, deliveryDate, deliverySlot: input.deliverySlot, assembly: input.assembly, notes: input.notes ?? null,
        subtotal: t.subtotal, discount: t.discount, deliveryCharge: t.deliveryCharge, assemblyCharge: t.assemblyCharge, total: t.total,
        couponId: coupon?.id ?? null, couponCode: coupon?.code ?? null, locale: input.locale, trackingToken: randomBytes(10).toString('hex'),
        items: { create: q.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, nameEn: l.nameEn, nameBn: l.nameBn, variantName: l.variantEn, sku: l.sku, image: l.image, unitPrice: l.unitPrice, qty: l.qty, lineTotal: l.lineTotal })) },
        history: { create: [{ status: 'PENDING', note: 'Order placed online' }] },
      },
    });
    for (const l of q.lines) {
      if (!l.madeToOrder && l.variantId) await tx.stockMovement.create({ data: { variantId: l.variantId, delta: -l.qty, reason: 'order', ref: orderNo } });
      await tx.product.update({ where: { id: l.productId }, data: { soldCount: { increment: l.qty } } });
    }
    if (user && input.saveAddress) {
      const exists = await tx.address.findFirst({ where: { userId: user.id, line1: input.address.line1, district: input.address.district } });
      if (!exists) await tx.address.create({ data: { userId: user.id, name: input.customer.name, phone: input.customer.phone, ...input.address, isDefault: !(await tx.address.count({ where: { userId: user.id } })) } });
    }
    return o;
  });

  // payment step
  let redirectUrl: string | null = null;
  let payNow = t.payNow;
  if (input.paymentMethod === 'bank') payNow = 0; // B2B bank transfer: proforma invoice, verified manually
  if (payNow > 0 && input.paymentMethod !== 'bank') {
    const sessionId = randomBytes(16).toString('hex');
    const gwMethod = input.paymentMethod === 'cod' ? 'bkash' : (input.paymentMethod as 'bkash' | 'nagad' | 'card'); // COD advance is collected via bKash
    const gw = gatewayFor(gwMethod);
    await prisma.payment.create({ data: { orderId: order.id, provider: gwMethod, kind: t.advancePercent ? 'advance' : 'full', amount: payNow, sessionId } });
    const init = await gw.initiate({ sessionId, orderNo: order.orderNo, amount: payNow, method: gwMethod, customer: { name: order.customerName, phone: order.phone, email: order.email }, locale: input.locale });
    await prisma.payment.update({ where: { sessionId }, data: { providerRef: init.providerRef } });
    redirectUrl = init.redirectUrl;
  }
  await sms.send(order.phone, `Shekor: order ${order.orderNo} received. Total ${formatPrice(order.total)}. Track: ${env.appUrl}/track?order=${order.orderNo}`);
  return { orderNo: order.orderNo, trackingToken: order.trackingToken, total: order.total, payNow, redirectUrl };
}

export async function completePayment(sessionId: string, payload: Record<string, unknown>) {
  const pay = await prisma.payment.findUnique({ where: { sessionId }, include: { order: true } });
  if (!pay) throw notFound('Payment session not found');
  if (pay.status !== 'initiated') return { orderNo: pay.order.orderNo, status: pay.status, locale: pay.order.locale, token: pay.order.trackingToken }; // idempotent
  const gw = gatewayFor(pay.provider as 'bkash' | 'nagad' | 'card');
  const v = await gw.verify(sessionId, payload);
  const status = v.status === 'success' ? 'success' : v.status === 'cancelled' ? 'cancelled' : 'failed';
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { sessionId }, data: { status, providerRef: v.providerRef ?? pay.providerRef, raw: (v.raw ?? {}) as object } });
    if (status === 'success') {
      const paid = pay.order.amountPaid + pay.amount;
      await tx.order.update({
        where: { id: pay.orderId },
        data: { amountPaid: paid, paymentStatus: paid >= pay.order.total ? 'PAID' : 'PARTIAL', ...(pay.order.status === 'PENDING' ? { status: 'CONFIRMED' } : {}) },
      });
      if (pay.order.status === 'PENDING') await tx.orderStatusHistory.create({ data: { orderId: pay.orderId, status: 'CONFIRMED', note: `Payment received via ${pay.provider} (${formatPrice(pay.amount)})` } });
    } else {
      await tx.order.update({ where: { id: pay.orderId }, data: { paymentStatus: 'FAILED' } });
    }
  });
  if (status === 'success') await sms.send(pay.order.phone, `Shekor: payment of ${formatPrice(pay.amount)} received for ${pay.order.orderNo}. Thank you!`);
  return { orderNo: pay.order.orderNo, status, locale: pay.order.locale, token: pay.order.trackingToken };
}

/** Retry payment for an order whose payment failed/cancelled. */
export async function retryPayment(orderNo: string, token: string) {
  const order = await prisma.order.findUnique({ where: { orderNo } });
  if (!order || order.trackingToken !== token) throw notFound('Order not found');
  if (order.paymentStatus === 'PAID' || order.status === 'CANCELLED') throw badRequest('This order does not need a payment');
  const due = order.advancePercent && order.amountPaid === 0 ? Math.ceil((order.total * order.advancePercent) / 100) : order.total - order.amountPaid;
  const sessionId = randomBytes(16).toString('hex');
  const method = (['bkash', 'nagad', 'card'].includes(order.paymentMethod) ? order.paymentMethod : 'bkash') as 'bkash' | 'nagad' | 'card';
  await prisma.payment.create({ data: { orderId: order.id, provider: method, kind: order.advancePercent ? 'advance' : 'full', amount: due, sessionId } });
  const init = await gatewayFor(method).initiate({ sessionId, orderNo, amount: due, method, customer: { name: order.customerName, phone: order.phone, email: order.email }, locale: order.locale as 'en' | 'bn' });
  return { redirectUrl: init.redirectUrl };
}

export const orderInclude = { items: true, history: { orderBy: { createdAt: 'asc' } }, payments: { orderBy: { createdAt: 'asc' } } } satisfies Prisma.OrderInclude;

export async function trackOrder(orderNo: string, phoneOrToken: string) {
  const o = await prisma.order.findUnique({ where: { orderNo: orderNo.trim().toUpperCase() }, include: orderInclude });
  if (!o) return null;
  const digits = phoneOrToken.replace(/\D/g, '');
  const ok = o.trackingToken === phoneOrToken || (digits.length >= 10 && o.phone.replace(/\D/g, '').endsWith(digits.slice(-10)));
  return ok ? o : null;
}

/** Admin status workflow with validation, stock return on cancel, loyalty on delivery. */
export async function transitionOrder(orderId: number, to: OrderStatus, actorId: number, note?: string) {
  const o = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!o) throw notFound('Order not found');
  if (!canTransition(o.status, to)) throw new ApiError(422, 'invalid_transition', `Cannot move an order from ${ORDER_STATUS_LABEL[o.status][0]} to ${ORDER_STATUS_LABEL[to][0]}`);
  await prisma.$transaction(async (tx) => {
    const data: Prisma.OrderUpdateInput = { status: to };
    if (to === 'CANCELLED' || to === 'RETURNED') {
      for (const it of o.items) if (it.variantId) {
        const v = await tx.productVariant.findUnique({ where: { id: it.variantId }, include: { product: true } });
        if (v && v.product.stockStatus !== 'MADE_TO_ORDER') {
          await tx.productVariant.update({ where: { id: v.id }, data: { stockQty: { increment: it.qty } } });
          await tx.stockMovement.create({ data: { variantId: v.id, delta: it.qty, reason: to === 'CANCELLED' ? 'cancel' : 'return', ref: o.orderNo } });
        }
      }
      if (o.amountPaid > 0) data.paymentStatus = 'REFUNDED';
    }
    if (to === 'DELIVERED') {
      if (o.paymentMethod === 'cod' && o.amountPaid < o.total) {
        await tx.payment.create({ data: { orderId: o.id, provider: 'cod', kind: 'balance', amount: o.total - o.amountPaid, status: 'success', sessionId: randomBytes(16).toString('hex') } });
        data.amountPaid = o.total;
        data.paymentStatus = 'PAID';
      }
      const pts = pointsForAmount(o.total);
      data.pointsEarned = pts;
      if (o.userId && pts) {
        await tx.loyaltyTransaction.create({ data: { userId: o.userId, points: pts, reason: 'Order delivered', orderNo: o.orderNo } });
        const u = await tx.user.update({ where: { id: o.userId }, data: { loyaltyPoints: { increment: pts } } });
        await tx.user.update({ where: { id: u.id }, data: { tier: tierFor(u.loyaltyPoints) } });
      }
    }
    await tx.order.update({ where: { id: o.id }, data });
    await tx.orderStatusHistory.create({ data: { orderId: o.id, status: to, note: note ?? null, actorId } });
  });
  await sms.send(o.phone, `Shekor: order ${o.orderNo} is now "${ORDER_STATUS_LABEL[to][0]}".`);
  return prisma.order.findUnique({ where: { id: orderId }, include: orderInclude });
}
