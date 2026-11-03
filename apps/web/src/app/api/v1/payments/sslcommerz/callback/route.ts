import { NextResponse } from 'next/server';
import { api } from '@/server/route';
import { completePayment } from '@/server/services/orders';

/** SSLCommerz success/fail/cancel/IPN callback (form POST from the gateway; verified via the validation API, not CSRF). */
export const POST = api(async (req) => {
  const session = new URL(req.url).searchParams.get('session') ?? '';
  const form = Object.fromEntries((await req.formData()).entries());
  const r = await completePayment(session, form);
  return NextResponse.redirect(new URL(`/${r.locale}/order/${r.orderNo}?t=${r.token}`, req.url), 303);
}, { csrf: false });
