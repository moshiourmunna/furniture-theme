import { prisma } from '@shekor/db';
import { formatDate, formatPrice } from '@shekor/shared';
import { api } from '@/server/route';
import { notFound } from '@/server/http';
import { requireStaff } from '@/server/auth';
import { getSettings } from '@/server/services/content';

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Printable VAT invoice (HTML; "Save as PDF" from the browser print dialog). */
export const GET = api<{ id: string }>(async (req, { params }) => {
  await requireStaff(req, 'orders.read');
  const o = await prisma.order.findUnique({ where: { id: Number((await params).id) }, include: { items: true, payments: true } });
  if (!o) throw notFound();
  const s = (await getSettings()).store!;
  const rows = o.items.map((i) => `<tr><td>${esc(i.nameEn)}${i.variantName ? `<br><small>${esc(i.variantName)} · ${esc(i.sku)}</small>` : ''}</td><td class="n">${i.qty}</td><td class="n">${formatPrice(i.unitPrice)}</td><td class="n">${formatPrice(i.lineTotal)}</td></tr>`).join('');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Invoice ${esc(o.orderNo)}</title>
<style>body{font:14px/1.5 system-ui,sans-serif;color:#14231C;max-width:800px;margin:40px auto;padding:0 24px}h1{font:300 32px Georgia,serif;margin:0}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{border-bottom:1px solid #D5CBBA;padding:8px;text-align:left}.n{text-align:right}.tot td{border:0}.muted{color:#5C635D}header{display:flex;justify-content:space-between;border-bottom:2px solid #1F4D3A;padding-bottom:16px}@media print{button{display:none}}</style></head>
<body><header><div><h1>Shekor</h1><div class="muted">${esc(s.legalName)}<br>${esc(s.address)}<br>BIN ${esc(s.bin)} · ${esc(s.phone)}</div></div><div style="text-align:right"><strong>TAX INVOICE</strong><br>${esc(o.orderNo)}<br>${formatDate(o.createdAt)}</div></header>
<p><strong>Bill to:</strong> ${esc(o.customerName)} · ${esc(o.phone)}<br>${esc(o.line1)}, ${esc(o.area)}, ${esc(o.district)}, ${esc(o.division)}</p>
<table><thead><tr><th>Item</th><th class="n">Qty</th><th class="n">Unit</th><th class="n">Amount</th></tr></thead><tbody>${rows}</tbody>
<tbody class="tot"><tr><td colspan="3" class="n">Subtotal</td><td class="n">${formatPrice(o.subtotal)}</td></tr>${o.discount ? `<tr><td colspan="3" class="n">Discount ${esc(o.couponCode)}</td><td class="n">−${formatPrice(o.discount)}</td></tr>` : ''}<tr><td colspan="3" class="n">Delivery</td><td class="n">${formatPrice(o.deliveryCharge)}</td></tr><tr><td colspan="3" class="n">Assembly</td><td class="n">${formatPrice(o.assemblyCharge)}</td></tr><tr><td colspan="3" class="n"><strong>Total (VAT inclusive)</strong></td><td class="n"><strong>${formatPrice(o.total)}</strong></td></tr><tr><td colspan="3" class="n">Paid</td><td class="n">${formatPrice(o.amountPaid)}</td></tr><tr><td colspan="3" class="n">Balance due</td><td class="n">${formatPrice(o.total - o.amountPaid)}</td></tr></tbody></table>
<p class="muted">Payment: ${esc(o.paymentMethod.toUpperCase())} · ${esc(o.paymentStatus)}. Thank you for choosing Shekor.</p><button onclick="print()">Print / Save PDF</button></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
});
