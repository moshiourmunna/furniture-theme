import { prisma } from '@shekor/db';
import { ALL_PERMISSIONS } from '@shekor/shared';
import { api } from '@/server/route';
import { json, readJson } from '@/server/http';
import { requireStaff } from '@/server/auth';
import { audit } from '@/server/audit';
import { roleInput } from '@/server/admin/staff';


export const GET = api(async (req) => {
  await requireStaff(req, 'staff.read');
  const roles = await prisma.role.findMany({ include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } }, orderBy: { id: 'asc' } });
  return json({ items: roles.map((r) => ({ id: r.id, name: r.name, description: r.description, isSystem: r.isSystem, users: r._count.users, permissions: r.permissions.map((p) => p.permission.code) })), allPermissions: ALL_PERMISSIONS });
});

export const POST = api(async (req) => {
  const me = await requireStaff(req, 'staff.write');
  const d = await readJson(req, roleInput);
  const perms = await prisma.permission.findMany({ where: { code: { in: d.permissions } } });
  const r = await prisma.role.create({ data: { name: d.name, description: d.description, permissions: { create: perms.map((p) => ({ permissionId: p.id })) } } });
  await audit(req, me.id, 'create', 'role', r.id, `Created role ${r.name}`);
  return json(r, 201);
});
