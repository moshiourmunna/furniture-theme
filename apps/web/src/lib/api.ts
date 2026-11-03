'use client';

export class ApiClientError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string>, public details?: unknown) {
    super(message);
  }
}

function csrf(): string {
  const m = document.cookie.match(/(?:^|;\s*)shekor_csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

async function ensureCsrf() {
  if (!csrf()) await fetch('/api/v1/auth/csrf', { credentials: 'same-origin' });
}

/** JSON fetch for /api/v1 with CSRF header and normalised errors. */
export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const method = opts.method ?? (opts.body !== undefined ? 'POST' : 'GET');
  if (method !== 'GET') await ensureCsrf();
  const res = await fetch(`/api/v1${path}`, {
    method,
    credentials: 'same-origin',
    signal: opts.signal,
    headers: { ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(method !== 'GET' ? { 'x-csrf-token': csrf() } : {}) },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const e = data?.error ?? {};
    throw new ApiClientError(res.status, e.code ?? 'error', e.message ?? 'Something went wrong', e.fields ?? e.details?.fields, e.details);
  }
  return data as T;
}

/** Multipart upload helper (field "file"). */
export async function apiUpload<T = { url: string }>(path: string, file: File, extra: Record<string, string> = {}): Promise<T> {
  await ensureCsrf();
  const fd = new FormData();
  fd.set('file', file);
  for (const [k, v] of Object.entries(extra)) fd.set(k, v);
  const res = await fetch(`/api/v1${path}`, { method: 'POST', credentials: 'same-origin', headers: { 'x-csrf-token': csrf() }, body: fd });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiClientError(res.status, data?.error?.code ?? 'error', data?.error?.message ?? 'Upload failed');
  return data as T;
}
