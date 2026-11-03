import 'server-only';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';

/** Pages most admin edits touch. Warmed after a write; other pages refresh on their next visit. */
const WARM_PATHS = ['', '/shop', '/collections', '/projects', '/gallery', '/journal', '/catalogues', '/showrooms', '/faq'];

/**
 * Storefront pages are ISR; any admin write refreshes them on demand so edits show up.
 * From a Route Handler, revalidatePath is stale-while-revalidate: the first visit after the edit still gets the old
 * page and triggers the re-render. So after the response is sent we visit the main pages ourselves (both locales)
 * and take that stale hit, so shoppers see the edit. `extra` adds paths such as the edited product page.
 */
export function revalidateStorefront(extra: string[] = []) {
  try {
    revalidatePath('/', 'layout');
  } catch {
    return; // outside a Next request context (unit/integration tests): nothing to revalidate
  }
  if (process.env.VITEST || process.env.DISABLE_CACHE_WARM === '1') return;
  const base = `http://127.0.0.1:${process.env.PORT || 3000}`;
  const paths = [...new Set([...WARM_PATHS, ...extra])];
  try {
    after(async () => {
      for (const locale of ['en', 'bn']) {
        await Promise.allSettled(paths.map((p) => fetch(`${base}/${locale}${p}`, { headers: { 'x-shekor-warm': '1' }, signal: AbortSignal.timeout(15_000) })));
      }
    });
  } catch {
    // after() unavailable: pages still refresh on their next visit
  }
}
