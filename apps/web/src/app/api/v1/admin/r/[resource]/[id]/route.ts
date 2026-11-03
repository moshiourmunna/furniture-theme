import { api } from '@/server/route';
import { ApiError, badRequest, json, notFound } from '@/server/http';
import { requireStaff } from '@/server/auth';
import { audit } from '@/server/audit';
import { revalidateStorefront } from '@/server/revalidate';
import { RESOURCES, delegate, prepareData } from '@/server/admin/resources';

async function ctx(p: Promise<{ resource: string; id: string }>) {
  const { resource, id } = await p;
  const def = RESOURCES[resource];
  if (!def) throw notFound('Unknown resource');
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1) throw badRequest('Invalid id');
  return { def, id: n, resource };
}

export const GET = api<{ resource: string; id: string }>(async (req, { params }) => {
  const { def, id } = await ctx(params);
  await requireStaff(req, `${def.group}.read`);
  const row = await delegate(def).findUnique({ where: { id }, ...(def.include ? { include: def.include } : {}) });
  if (!row) throw notFound();
  return json(row);
});

/** Partial update: only keys present in the body are written (schema defaults never overwrite existing data). */
export const PUT = api<{ resource: string; id: string }>(async (req, { params }) => {
  const { def, id, resource } = await ctx(params);
  const user = await requireStaff(req, `${def.group}.write`);
  let raw: Record<string, unknown>;
  try { raw = await req.json(); } catch { throw badRequest('Invalid JSON body'); }
  const parsed = def.schema.partial().parse(raw) as Record<string, unknown>;
  const data = Object.fromEntries(Object.entries(parsed).filter(([k]) => k in raw));
  const before = await delegate(def).findUnique({ where: { id } });
  if (!before) throw notFound();
  const errs = def.validate?.({ ...before, ...data });
  if (errs) throw new ApiError(422, 'validation_error', 'Please check the highlighted fields', { fields: errs });
  const row = await delegate(def).update({ where: { id }, data: prepareData(def, data, false) });
  await audit(req, user.id, 'update', resource, id, `Updated ${def.label(row)}`, { fields: Object.keys(data) });
  revalidateStorefront();
  return json(row);
});

export const DELETE = api<{ resource: string; id: string }>(async (req, { params }) => {
  const { def, id, resource } = await ctx(params);
  const user = await requireStaff(req, `${def.group}.write`);
  const row = await delegate(def).delete({ where: { id } });
  await audit(req, user.id, 'delete', resource, id, `Deleted ${def.label(row)}`);
  revalidateStorefront();
  return json({ ok: true });
});
