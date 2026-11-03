import { api } from '@/server/route';
import { json } from '@/server/http';
import { requireStaff } from '@/server/auth';
import { salesReport } from '@/server/admin/reports';

export const GET = api(async (req) => {
  await requireStaff(req, 'reports.read');
  const sp = new URL(req.url).searchParams;
  const to = sp.get('to') ? new Date(`${sp.get('to')}T23:59:59+06:00`) : new Date();
  const from = sp.get('from') ? new Date(`${sp.get('from')}T00:00:00+06:00`) : new Date(to.getTime() - 30 * 86400_000);
  const data = await salesReport(from, to);
  if (sp.get('format') === 'csv') {
    const rows = [['Category', 'Revenue (BDT)', 'Units'], ...data.byCategory.map((r) => [r.category, r.revenue, r.qty])];
    return new Response(rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="shekor-sales.csv"' } });
  }
  return json(data);
});
