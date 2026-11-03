import { prisma } from '@shekor/db';
import { api } from '@/server/route';
import { badRequest, json, notFound, readJson } from '@/server/http';
import { requireStaff } from '@/server/auth';
import { audit } from '@/server/audit';
import { roleInput } from '@/server/admin/staff';

export const PUT = api<{ id: string }>(async (req, { params }) => {
  const me = await requireStaff(req, 'staff.write');
  const id = Number((await params).id);
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) throw notFound();
  if (role.isSystem) throw badRequest('The Super Admin role cannot be edited');
  const d = await readJson(req, roleInput);
  const perms = await prisma.permission.findMany({ where: { code: { in: d.permissions } } });
  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId: id } }),
    prisma.role.update({ where: { id }, data: { name: d.name, description: d.description, permissions: { create: perms.map((p) => ({ permissionId: p.id })) } } }),
  ]);
  await audit(req, me.id, 'update', 'role', id, `Updated role ${d.name}`, { permissions: d.permissions });
  return json({ ok: true });
});

export const DELETE = api<{ id: string }>(async (req, { params }) => {
  const me = await requireStaff(req, 'staff.write');
  const id = Number((await params).id);
  const role = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
  if (!role) throw notFound();
  if (role.isSystem || role._count.users) throw badRequest('Roles that are system roles or assigned to staff cannot be deleted');
  await prisma.role.delete({ where: { id } });
  await audit(req, me.id, 'delete', 'role', id, `Deleted role ${role.name}`);
  return json({ ok: true });
});
