import { api } from '@/server/route';
import { json } from '@/server/http';
import { facetCounts, listProducts, parseFilters } from '@/server/services/catalog';

/** GET /api/v1/products — filter, sort, search and paginate the catalogue. */
export const GET = api(async (req) => {
  const sp = new URL(req.url).searchParams;
  const f = parseFilters(sp);
  const [data, facets] = await Promise.all([listProducts(f), sp.get('facets') === '1' ? facetCounts(f) : Promise.resolve(undefined)]);
  return json({ ...data, facets });
});
