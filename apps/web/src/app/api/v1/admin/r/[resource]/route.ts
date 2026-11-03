import { api } from '@/server/route';
import { ApiError, intParam, json, notFound, readJson } from '@/server/http';
import { requireStaff } from '@/server/auth';
import { audit } from '@/server/audit';
import { revalidateStorefront } from '@/server/revalidate';
import { RESOURCES, delegate, prepareData } from '@/server/admin/resources';

/** Generic admin list/create for CMS & catalog resources (see server/admin/resources.ts). */
export const GET = api<{ resource: string }>(async (req, { params }) => {
  const def = RESOURCES[(await params).resource];
  if (!def) throw notFound('Unknown resource');
  await requireStaff(req, `${def.group}.read`);
  const sp = new URL(req.url).searchParams;
  const page = intParam(sp.get('page'), 1);
  const pageSize = intParam(sp.get('pageSize'), 25, 1, 200);
  const q = sp.get('q')?.trim();
  const where: Record<string, unknown> = {};
  if (q) where.OR = def.search.map((f) => ({ [f]: { contains: q } }));
  for (const f of def.filters ?? []) if (sp.get(f)) where[f] = sp.get(f);
  const d = delegate(def);
  const [items, total] = await Promise.all([d.findMany({ where, orderBy: def.orderBy, skip: (page - 1) * pageSize, take: pageSize, ...(def.include ? { include: def.include } : {}) }), d.count({ where })]);
  return json({ items, total, page, pageSize });
});

export const POST = api<{ resource: string }>(async (req, { params }) => {
  const name = (await params).resource;
  const def = RESOURCES[name];
  if (!def || def.noCreate) throw notFound('Unknown resource');
  const user = await requireStaff(req, `${def.group}.write`);
  const parsed = await readJson(req, def.schema);
  const errs = def.validate?.(parsed);
  if (errs) throw new ApiError(422, 'validation_error', 'Please check the highlighted fields', { fields: errs });
  const row = await delegate(def).create({ data: prepareData(def, parsed, true) });
  await audit(req, user.id, 'create', name, row.id, `Created ${def.label(row)}`);
  revalidateStorefront();
  return json(row, 201);
});
