import { z } from 'zod';
import { prisma } from '@shekor/db';
import { api } from '@/server/route';
import { json, readJson } from '@/server/http';
import { requireStaff } from '@/server/auth';
import { audit } from '@/server/audit';
import { revalidateStorefront } from '@/server/revalidate';

const s = (max = 320) => z.string().trim().max(max);
const schemas = {
  store: z.object({ name: s(60), legalName: s(120), phone: s(20), whatsapp: s(20), email: z.email(), address: s(255), tradeLicence: s(60), bin: s(40) }),
  seo: z.object({ titleEn: s(70), titleBn: s(120), descriptionEn: s(170), descriptionBn: s(320), ogImage: s(255), twitter: s(40) }),
  social: z.record(z.string(), z.union([z.url(), z.literal('')])),
  payments: z.object({ bkash: z.boolean(), nagad: z.boolean(), card: z.boolean(), cod: z.boolean(), bank: z.boolean(), codAdvanceThreshold: z.number().int().min(0), codAdvancePercent: z.number().int().min(0).max(100) }),
  loyalty: z.object({ pointsPer100: z.number().int().min(0).max(100), redeemValue: z.number().min(0).max(100) }),
};

export const GET = api(async (req) => {
  await requireStaff(req, 'settings.read');
  const rows = await prisma.setting.findMany();
  return json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
});

export const PUT = api(async (req) => {
  const me = await requireStaff(req, 'settings.write');
  const body = await readJson(req, z.object({ key: z.enum(Object.keys(schemas) as [keyof typeof schemas]), value: z.unknown() }));
  const value = schemas[body.key].parse(body.value);
  await prisma.setting.upsert({ where: { key: body.key }, update: { value: value as object }, create: { key: body.key, value: value as object } });
  await audit(req, me.id, 'update', 'settings', body.key, `Updated ${body.key} settings`);
  revalidateStorefront();
  return json({ ok: true });
});
