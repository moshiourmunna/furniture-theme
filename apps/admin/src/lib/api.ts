/** Admin API client: same-origin /api/v1 (Vite proxies in dev), cookie session + double-submit CSRF. */
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public fields: Record<string, string> = {}, public details?: unknown) { super(message); }
}

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api/v1';
const csrf = () => document.cookie.split('; ').find((c) => c.startsWith('shekor_csrf='))?.split('=')[1] ?? '';
let csrfReady: Promise<void> | null = null;
const ensureCsrf = () => (csrf() ? Promise.resolve() : (csrfReady ??= fetch(`${BASE}/auth/csrf`, { credentials: 'include' }).then(() => undefined)));

export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown; form?: FormData; signal?: AbortSignal } = {}): Promise<T> {
  const method = opts.method ?? (opts.body !== undefined || opts.form ? 'POST' : 'GET');
  if (method !== 'GET') await ensureCsrf();
  const res = await fetch(`${BASE}${path}`, {
    method, credentials: 'include', signal: opts.signal,
    headers: { ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(method !== 'GET' ? { 'x-csrf-token': csrf() } : {}), Accept: 'application/json' },
    body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
  });
  if (res.status === 204) return undefined as T;
  const type = res.headers.get('content-type') ?? '';
  const data = type.includes('json') ? await res.json() : await res.text();
  if (!res.ok) {
    const e = (data && typeof data === 'object' ? (data as { error?: { code?: string; message?: string; fields?: Record<string, string>; details?: { fields?: Record<string, string> } } }).error : null) ?? {};
    const err = new ApiError(res.status, e.code ?? 'error', e.message ?? `Request failed (${res.status})`, e.fields ?? e.details?.fields ?? {}, e.details);
    if (res.status === 401 && !path.startsWith('/admin/auth/')) window.dispatchEvent(new CustomEvent('shekor:unauthorized'));
    throw err;
  }
  return data as T;
}

export const upload = (file: File, folder = 'media') => {
  const f = new FormData();
  f.append('file', file); f.append('folder', folder);
  return api<{ id: number; url: string }>('/admin/uploads', { form: f });
};

export const qs = (o: Record<string, unknown>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
};
