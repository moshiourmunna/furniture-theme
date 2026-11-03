import { quoteRequestSchema } from '@shekor/shared';
import { api } from '@/server/route';
import { json, readJson } from '@/server/http';
import { getUser } from '@/server/auth';
import { quote } from '@/server/services/orders';

/** POST /api/v1/cart/quote — server-side pricing, stock check, coupon, zone delivery charge and payable amount. */
export const POST = api(async (req) => {
  const body = await readJson(req, quoteRequestSchema);
  const user = await getUser(req);
  return json(await quote(body, user?.id));
});
