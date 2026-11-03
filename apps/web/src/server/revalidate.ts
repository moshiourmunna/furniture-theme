import 'server-only';
import { revalidatePath } from 'next/cache';

/** Storefront pages are ISR; any admin write refreshes them on demand so edits show up immediately. */
export function revalidateStorefront() {
  try {
    revalidatePath('/', 'layout');
  } catch {
    // outside a Next request context (unit/integration tests) — nothing to revalidate
  }
}
