import { randomInt } from 'node:crypto';
import { prisma } from '@shekor/db';
import { catalogueRequestSchema, consultationSchema, contactSchema, customOrderSchema, newsletterSchema, tradeInquirySchema } from '@shekor/shared';
import { api } from '@/server/route';
import { badRequest, json, readJson } from '@/server/http';
import { rateLimit } from '@/server/security';
import { email } from '@/server/notify';

const ref = (p: string) => `${p}-${randomInt(100000, 999999)}`;

/** POST /api/v1/leads?type=custom-order|consultation|trade|contact|newsletter|catalogue-request */
export const POST = api(async (req) => {
  rateLimit(req, 'leads', 8, 10 * 60_000);
  const type = new URL(req.url).searchParams.get('type');
  switch (type) {
    case 'custom-order': {
      const d = await readJson(req, customOrderSchema);
      const r = await prisma.customOrderRequest.create({ data: { ...d, ref: ref('CUS') } });
      await email.send('studio@shekor.com.bd', `New custom order ${r.ref}`, `<p>${r.name} (${r.phone}) — ${r.pieceType}</p>`);
      return json({ ref: r.ref }, 201);
    }
    case 'consultation': {
      const d = await readJson(req, consultationSchema);
      const date = new Date(`${d.date}T00:00:00+06:00`);
      if (date.getTime() < Date.now() - 86400_000) throw badRequest('Choose a future date');
      if (d.mode === 'showroom' && !d.showroomId) throw badRequest('Choose a showroom');
      const r = await prisma.consultationBooking.create({ data: { ...d, date, ref: ref('CON') } });
      return json({ ref: r.ref }, 201);
    }
    case 'trade': {
      const d = await readJson(req, tradeInquirySchema);
      const r = await prisma.tradeInquiry.create({ data: { ...d, ref: ref('TRD') } });
      return json({ ref: r.ref }, 201);
    }
    case 'contact': {
      const d = await readJson(req, contactSchema);
      if (!d.email && !d.phone) throw badRequest('Give us an email or phone number to reply to');
      await prisma.contactMessage.create({ data: d });
      return json({ ok: true }, 201);
    }
    case 'newsletter': {
      const d = await readJson(req, newsletterSchema);
      await prisma.newsletterSubscriber.upsert({ where: { email: d.email }, update: {}, create: { email: d.email, locale: d.locale ?? 'en' } });
      return json({ ok: true }, 201);
    }
    case 'catalogue-request': {
      const d = await readJson(req, catalogueRequestSchema);
      await prisma.catalogueRequest.create({ data: { ...d, catalogues: d.catalogues ?? [] } });
      return json({ ok: true }, 201);
    }
    default:
      throw badRequest('Unknown lead type');
  }
});
