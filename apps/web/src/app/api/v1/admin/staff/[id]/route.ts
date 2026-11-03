import { z } from 'zod';
import { prisma } from '@shekor/db';
import { passwordSchema } from '@shekor/shared';
import { api } from '@/server/route';
import { badRequest, json, notFound, readJson } from '@/server/http';
import { hashPassword, requireStaff } from '@/server/auth';
import { audit } from '@/server/audit';

export const PUT = api<{ id: string }>(async (req, { params }) => {
  const me = await requireStaff(req, 'staff.write');
  const id = Number((await params).id);
  const d = await readJson(req, z.object({ name: z.string().trim().min(2).max(120).optional(), roleId: z.number().int().positive().optional(), isActive: z.boolean().optional(), password: passwordSchema.optional() }));
  const u = await prisma.user.findFirst({ where: { id, kind: 'STAFF' } });
  if (!u) throw notFound();
  if (id === me.id && (d.isActive === false || (d.roleId && d.roleId !== u.roleId))) throw badRequest('You cannot deactivate yourself or change your own role');
  await prisma.user.update({ where: { id }, data: { name: d.name, roleId: d.roleId, isActive: d.isActive, ...(d.password ? { passwordHash: await hashPassword(d.password) } : {}) } });
  if (d.isActive === false || d.password || d.roleId) await prisma.session.deleteMany({ where: { userId: id } });
  await audit(req, me.id, 'update', 'staff', id, `Updated staff ${u.name}`, { fields: Object.keys(d).filter((k) => k !== 'password') });
  return json({ ok: true });
});

export const DELETE = api<{ id: string }>(async (req, { params }) => {
  const me = await requireStaff(req, 'staff.write');
  const id = Number((await params).id);
  if (id === me.id) throw badRequest('You cannot remove yourself');
  const u = await prisma.user.findFirst({ where: { id, kind: 'STAFF' } });
  if (!u) throw notFound();
  await prisma.user.update({ where: { id }, data: { isActive: false } });
  await prisma.session.deleteMany({ where: { userId: id } });
  await audit(req, me.id, 'deactivate', 'staff', id, `Deactivated staff ${u.name}`);
  return json({ ok: true });
});
