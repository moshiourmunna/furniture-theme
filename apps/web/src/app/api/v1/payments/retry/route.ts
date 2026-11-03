import { z } from 'zod';
import { api } from '@/server/route';
import { json, readJson } from '@/server/http';
import { retryPayment } from '@/server/services/orders';

export const POST = api(async (req) => {
  const { orderNo, token } = await readJson(req, z.object({ orderNo: z.string().max(20), token: z.string().max(40) }));
  return json(await retryPayment(orderNo, token));
});
