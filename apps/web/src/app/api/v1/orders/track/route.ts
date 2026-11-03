import { api } from '@/server/route';
import { badRequest, json, notFound } from '@/server/http';
import { rateLimit } from '@/server/security';
import { trackOrder } from '@/server/services/orders';

/** GET /api/v1/orders/track?orderNo=SHK-123456&phone=017… (or &token=) */
export const GET = api(async (req) => {
  rateLimit(req, 'track', 30, 10 * 60_000);
  const sp = new URL(req.url).searchParams;
  const orderNo = sp.get('orderNo');
  const proof = sp.get('phone') || sp.get('token');
  if (!orderNo || !proof) throw badRequest('Order number and phone are required');
  const o = await trackOrder(orderNo, proof);
  if (!o) throw notFound('We could not find an order with these details');
  const { trackingToken: _t, ...safe } = o;
  void _t;
  return json(safe);
});
