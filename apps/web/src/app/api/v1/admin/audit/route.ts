import { prisma } from '@shekor/db';
import { api } from '@/server/route';
import { intParam, json } from '@/server/http';
import { requireStaff } from '@/server/auth';

export const GET = api(async (req) => {
  await requireStaff(req, 'audit.read');
  const sp = new URL(req.url).searchParams;
  const page = intParam(sp.get('page'), 1);
  const where = { ...(sp.get('entity') ? { entity: sp.get('entity')! } : {}), ...(sp.get('userId') ? { userId: Number(sp.get('userId')) } : {}) };
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({ where, include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * 50, take: 50 }),
    prisma.auditLog.count({ where }),
  ]);
  return json({ items, total, page, pageSize: 50 });
});
