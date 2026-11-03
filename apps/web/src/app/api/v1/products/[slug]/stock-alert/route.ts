import { prisma } from '@shekor/db';
import { stockAlertSchema } from '@shekor/shared';
import { api } from '@/server/route';
import { json, notFound, readJson } from '@/server/http';
import { getUser } from '@/server/auth';
import { rateLimit } from '@/server/security';

export const POST = api<{ slug: string }>(async (req, { params }) => {
  rateLimit(req, 'stock-alert', 10, 60_000);
  const { contact } = await readJson(req, stockAlertSchema);
  const p = await prisma.product.findUnique({ where: { slug: (await params).slug }, select: { id: true } });
  if (!p) throw notFound();
  const user = await getUser(req);
  await prisma.stockAlert.upsert({ where: { productId_contact: { productId: p.id, contact } }, update: {}, create: { productId: p.id, contact, userId: user?.id } });
  return json({ ok: true }, 201);
});
