import { z } from 'zod';
import { ORDER_STATUSES } from '@shekor/shared';
import { api } from '@/server/route';
import { json, readJson } from '@/server/http';
import { requireStaff } from '@/server/auth';
import { audit } from '@/server/audit';
import { transitionOrder } from '@/server/services/orders';

export const POST = api<{ id: string }>(async (req, { params }) => {
  const user = await requireStaff(req, 'orders.write');
  const id = Number((await params).id);
  const d = await readJson(req, z.object({ status: z.enum(ORDER_STATUSES), note: z.string().trim().max(320).optional() }));
  const o = await transitionOrder(id, d.status, user.id, d.note);
  await audit(req, user.id, 'status', 'order', id, `${o!.orderNo} → ${d.status}`);
  return json(o);
});
