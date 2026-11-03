import { z } from 'zod';
import { prisma } from '@shekor/db';
import { emailSchema, passwordSchema, phoneSchema } from '@shekor/shared';
import { api } from '@/server/route';
import { conflict, json, readJson } from '@/server/http';
import { hashPassword, requireStaff } from '@/server/auth';
import { audit } from '@/server/audit';
import { staffSelect } from '@/server/admin/staff';


export const GET = api(async (req) => {
  await requireStaff(req, 'staff.read');
  return json({ items: await prisma.user.findMany({ where: { kind: 'STAFF' }, select: staffSelect, orderBy: { id: 'asc' } }) });
});

export const POST = api(async (req) => {
  const me = await requireStaff(req, 'staff.write');
  const d = await readJson(req, z.object({ name: z.string().trim().min(2).max(120), email: emailSchema, phone: phoneSchema.optional(), password: passwordSchema, roleId: z.number().int().positive() }));
  if (await prisma.user.findFirst({ where: { OR: [{ email: d.email }, ...(d.phone ? [{ phone: d.phone }] : [])] } })) throw conflict('A user with this email or phone already exists');
  const u = await prisma.user.create({ data: { kind: 'STAFF', name: d.name, email: d.email, phone: d.phone, roleId: d.roleId, passwordHash: await hashPassword(d.password), emailVerified: new Date() }, select: staffSelect });
  await audit(req, me.id, 'create', 'staff', u.id, `Added staff ${u.name} (${u.role?.name})`);
  return json(u, 201);
});
