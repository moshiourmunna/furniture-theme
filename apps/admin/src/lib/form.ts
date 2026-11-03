import { z } from 'zod';
import type { FieldDef } from '@/components/fields';

const pad = (n: number) => String(n).padStart(2, '0');
/** Dates are shown in Asia/Dhaka (UTC+6) regardless of the browser zone. */
export const toDhakaInput = (v: unknown, withTime: boolean) => {
  if (!v) return '';
  const d = new Date(new Date(String(v)).getTime() + 6 * 3600_000);
  const day = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  return withTime ? `${day}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}` : day;
};
const fromDhakaInput = (v: string, withTime: boolean) => (v ? new Date(withTime ? `${v}:00+06:00` : `${v}T00:00:00+06:00`).toISOString() : null);

export function toForm(fields: FieldDef[], row: Record<string, unknown> | null): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = row?.[f.name];
    switch (f.type) {
      case 'bool': out[f.name] = row ? !!v : f.name === 'isActive' || f.name === 'isPublished'; break;
      case 'images': case 'tags': out[f.name] = Array.isArray(v) ? v : []; break;
      case 'date': out[f.name] = toDhakaInput(v, false); break;
      case 'datetime': out[f.name] = toDhakaInput(v, true); break;
      case 'image': out[f.name] = v ?? null; break;
      case 'select': out[f.name] = v ?? (f.nullable ? '' : (Array.isArray(f.options?.[0]) ? f.options[0][0] : f.options?.[0]) ?? ''); break;
      default: out[f.name] = v === null || v === undefined ? '' : String(v);
    }
  }
  return out;
}

export function toPayload(fields: FieldDef[], values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = values[f.name];
    switch (f.type) {
      case 'number': out[f.name] = v === '' || v === null || v === undefined ? null : Number(v); break;
      case 'lookup': out[f.name] = v === '' || v === null || v === undefined ? null : f.lookup === 'collectionSlugs' ? v : Number(v); break;
      case 'date': out[f.name] = fromDhakaInput(String(v ?? ''), false); break;
      case 'datetime': out[f.name] = fromDhakaInput(String(v ?? ''), true); break;
      case 'bool': out[f.name] = !!v; break;
      case 'select': out[f.name] = v === '' ? null : v; break;
      case 'slug': out[f.name] = v ? String(v) : undefined; break;
      default: out[f.name] = typeof v === 'string' ? (v.trim() === '' && !f.required ? null : v) : v;
    }
  }
  return out;
}

/** Client-side zod schema derived from field definitions (server re-validates authoritatively). */
export function schemaFor(fields: FieldDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    if (f.type === 'bool') shape[f.name] = z.boolean().optional();
    else if (f.type === 'images' || f.type === 'tags') shape[f.name] = f.required ? z.array(z.string()).min(1, 'Add at least one') : z.array(z.string()).optional();
    else if (f.type === 'image') shape[f.name] = f.required ? z.string({ message: 'Required' }).min(1, 'Required') : z.string().nullish();
    else if (f.type === 'number') shape[f.name] = z.union([z.string(), z.number()]).refine((v) => (v === '' ? !f.required : Number.isFinite(Number(v)) && (f.min === undefined || Number(v) >= f.min) && (f.max === undefined || Number(v) <= f.max)), { message: f.required ? 'Enter a number' : 'Invalid number' });
    else if (f.type === 'slug') shape[f.name] = z.string().refine((v) => (v === '' && !f.required) || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v), { message: 'Lowercase letters, numbers and dashes' });
    else if (f.type === 'email') shape[f.name] = z.string().refine((v) => (!v && !f.required) || /^\S+@\S+\.\S+$/.test(v), { message: 'Enter a valid email' });
    else shape[f.name] = f.required ? z.string().trim().min(1, 'Required') : z.union([z.string(), z.null()]).optional();
  }
  return z.object(shape);
}
