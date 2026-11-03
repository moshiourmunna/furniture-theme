// Generates docs/openapi.yaml from the route handlers in apps/web/src/app/api/v1 and the shared zod schemas.
// Run: pnpm --filter @shekor/db exec tsx ../../scripts/gen-openapi.ts
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import * as shared from '../packages/shared/src/index';

const root = fileURLToPath(new URL('../apps/web/src/app/api/v1', import.meta.url));
const files: string[] = [];
const walk = (d: string) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (f === 'route.ts') files.push(p); } };
walk(root);

const components: Record<string, unknown> = {};
const sharedSchemas = shared as unknown as Record<string, unknown>;
const schemaRef = (name: string) => {
  const s = sharedSchemas[name];
  if (!(s instanceof z.ZodType)) return null;
  if (!components[name]) { try { components[name] = z.toJSONSchema(s, { io: 'input', unrepresentable: 'any' }); } catch { components[name] = { type: 'object' }; } }
  return { $ref: `#/components/schemas/${name}` };
};

const paths: Record<string, Record<string, unknown>> = {};
for (const file of files.sort()) {
  const src = readFileSync(file, 'utf8');
  const route = '/api/v1/' + relative(root, file).replace(/\/?route\.ts$/, '').replace(/\[\.\.\.(\w+)\]/g, '{$1}').replace(/\[(\w+)\]/g, '{$1}');
  const params = [...route.matchAll(/\{(\w+)\}/g)].map((m) => ({ name: m[1], in: 'path', required: true, schema: { type: 'string' } }));
  const tag = route.startsWith('/api/v1/admin') ? `admin:${route.split('/')[4] ?? ''}` : route.split('/')[3];
  const exports = [...src.matchAll(/(?:\/\*\*([\s\S]*?)\*\/\s*)?export const (GET|POST|PUT|PATCH|DELETE) = /g)];
  for (const [i, m] of exports.entries()) {
    const [, doc, method] = m;
    const body = src.slice(m.index! + m[0].length, exports[i + 1]?.index ?? src.length);
    const perm = body.match(/requireStaff\(req, '([\w.]+)'\)/)?.[1];
    const staff = /requireStaff\(/.test(body);
    const user = /requireUser\(/.test(body);
    const bodySchema = body.match(/readJson\(req, (\w+)/)?.[1];
    const summary = (doc ?? '').replace(/^\s*\*\s?/gm, '').trim().split('\n')[0] || `${method} ${route}`;
    const op: Record<string, unknown> = {
      tags: [tag], summary: summary.slice(0, 200), operationId: `${method.toLowerCase()}${route.replace(/\/api\/v1/, '').replace(/[{}]/g, '').replace(/[^a-zA-Z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))}`,
      ...(params.length ? { parameters: params } : {}),
      responses: { 200: { description: 'OK (JSON)' }, ...(method === 'POST' ? { 201: { description: 'Created' } } : {}), 400: { $ref: '#/components/responses/Error' }, 401: { $ref: '#/components/responses/Error' }, 403: { $ref: '#/components/responses/Error' }, 404: { $ref: '#/components/responses/Error' }, 422: { $ref: '#/components/responses/ValidationError' }, 429: { $ref: '#/components/responses/Error' } },
    };
    if (staff) { op.security = [{ adminSession: [] }]; if (perm) op['x-permission'] = perm; }
    else if (user) op.security = [{ storeSession: [] }];
    if (method !== 'GET') { op.parameters = [...(params ?? []), { $ref: '#/components/parameters/Csrf' }]; }
    if (bodySchema) { const ref = schemaRef(bodySchema); op.requestBody = { required: true, content: { 'application/json': { schema: ref ?? { type: 'object', description: `Validated by ${bodySchema} (see source)` } } } }; }
    (paths[route] ??= {})[method.toLowerCase()] = op;
  }
}

const doc = {
  openapi: '3.1.0',
  info: { title: 'Shekor REST API', version: '1.0.0', description: 'Storefront + admin API served by apps/web at /api/v1. JSON in/out. State-changing requests need the double-submit CSRF token (cookie `shekor_csrf` echoed in the `x-csrf-token` header). Errors: `{ error: { code, message, fields? } }`. Admin endpoints enforce RBAC permission codes (x-permission).' },
  servers: [{ url: 'http://localhost:3000' }],
  paths,
  components: {
    securitySchemes: { storeSession: { type: 'apiKey', in: 'cookie', name: 'shekor_sid' }, adminSession: { type: 'apiKey', in: 'cookie', name: 'shekor_admin' } },
    parameters: { Csrf: { name: 'x-csrf-token', in: 'header', required: true, schema: { type: 'string' }, description: 'Must equal the shekor_csrf cookie (GET /api/v1/auth/csrf issues one).' } },
    responses: {
      Error: { description: 'Error', content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'object', properties: { code: { type: 'string' }, message: { type: 'string' } } } } } } } },
      ValidationError: { description: 'Validation failed', content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'object', properties: { code: { const: 'validation' }, message: { type: 'string' }, fields: { type: 'object', additionalProperties: { type: 'string' } } } } } } } } },
    },
    schemas: components,
  },
};

// tiny YAML emitter (JSON is valid YAML 1.2, but block style is easier to read)
const y = (v: unknown, ind = ''): string => {
  if (v === null) return 'null';
  if (Array.isArray(v)) return v.length ? v.map((x) => `\n${ind}- ${y(x, ind + '  ').replace(/^\n\s*/, '')}`).join('') : '[]';
  if (typeof v === 'object') { const e = Object.entries(v as object); return e.length ? e.map(([k, x]) => { const val = y(x, ind + '  '); const key = /^[A-Za-z_$][\w$.-]*$/.test(k) ? k : JSON.stringify(k); return `\n${ind}${key}:${val.startsWith('\n') ? '' : ' '}${val}`; }).join('') : '{}'; }
  if (typeof v === 'string') return /^[\w ./,()-]*$/.test(v) && v !== '' && !/^(true|false|null|\d)/.test(v) ? v : JSON.stringify(v);
  return String(v);
};
writeFileSync(new URL('../docs/openapi.yaml', import.meta.url), `# Generated by scripts/gen-openapi.ts — do not edit by hand.${y(doc)}\n`);
console.log(`docs/openapi.yaml: ${Object.keys(paths).length} paths, ${Object.values(paths).reduce((n, p) => n + Object.keys(p).length, 0)} operations, ${Object.keys(components).length} schemas`);
