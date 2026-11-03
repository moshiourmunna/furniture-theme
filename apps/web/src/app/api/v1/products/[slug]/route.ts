import { api } from '@/server/route';
import { json, notFound } from '@/server/http';
import { getProduct } from '@/server/services/catalog';

export const GET = api<{ slug: string }>(async (_req, { params }) => {
  const p = await getProduct((await params).slug);
  if (!p) throw notFound('Product not found');
  return json(p);
});
