import { z } from 'zod';
import { api } from '@/server/route';
import { json, readJson } from '@/server/http';
import { env } from '@/server/env';
import { ApiError } from '@/server/http';
import { completePayment } from '@/server/services/orders';

const schema = z.object({ session: z.string().min(10).max(64), outcome: z.enum(['success', 'fail', 'cancel']) });

/** Callback from the simulated gateway page (mock mode only). */
export const POST = api(async (req) => {
  if (env.paymentMode !== 'mock') throw new ApiError(404, 'not_found', 'Mock payments are disabled');
  const { session, outcome } = await readJson(req, schema);
  return json(await completePayment(session, { outcome }));
});
