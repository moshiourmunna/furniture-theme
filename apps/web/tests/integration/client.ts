/** Minimal HTTP-like client that calls Next route handlers directly, keeping a cookie jar and the CSRF double-submit token. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- route handlers have per-route param types
type Handler = (req: Request, ctx: any) => Promise<Response>;
type Mod = Partial<Record<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', Handler>>;

export class Client {
  jar = new Map<string, string>([['shekor_csrf', 'test-csrf-token-0123456789']]);
  constructor(public origin = 'http://localhost:3000') {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- response JSON is asserted in each test
  async call<T = any>(mod: Mod, method: keyof Mod, path: string, opts: { body?: unknown; params?: Record<string, string>; csrf?: boolean; headers?: Record<string, string> } = {}) {
    const h = mod[method];
    if (!h) throw new Error(`${method} not exported for ${path}`);
    const headers = new Headers(opts.headers);
    headers.set('cookie', [...this.jar].map(([k, v]) => `${k}=${v}`).join('; '));
    if (opts.csrf !== false) headers.set('x-csrf-token', this.jar.get('shekor_csrf') ?? '');
    let body: BodyInit | undefined;
    if (opts.body instanceof FormData) body = opts.body;
    else if (opts.body !== undefined) { headers.set('content-type', 'application/json'); body = JSON.stringify(opts.body); }
    const res = await h(new Request(this.origin + path, { method, headers, body }), { params: Promise.resolve(opts.params ?? {}) });
    for (const c of res.headers.getSetCookie()) {
      const [pair, ...attrs] = c.split(';');
      const [k, ...v] = pair.split('=');
      const expired = attrs.some((a) => /max-age=0|expires=thu, 01 jan 1970/i.test(a.trim()));
      if (expired || !v.join('=')) this.jar.delete(k.trim()); else this.jar.set(k.trim(), v.join('='));
    }
    const text = await res.text();
    let data: T; try { data = JSON.parse(text); } catch { data = text as T; }
    return { status: res.status, data, headers: res.headers };
  }
}
