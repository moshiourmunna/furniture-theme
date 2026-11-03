import { checkoutSchema } from '@shekor/shared';
import { api } from '@/server/route';
import { json, readJson } from '@/server/http';
import { getUser } from '@/server/auth';
import { rateLimit } from '@/server/security';
import { placeOrder } from '@/server/services/orders';

/** POST /api/v1/checkout — creates the order (guest or signed-in) and starts payment when something is due now. */
export const POST = api(async (req) => {
  rateLimit(req, 'checkout', 10, 10 * 60_000);
  const body = await readJson(req, checkoutSchema);
  const user = await getUser(req);
  return json(await placeOrder(body, user), 201);
});
