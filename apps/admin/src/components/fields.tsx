import { useId, useRef, useState } from 'react';
import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { ImagePlus, Trash2, ArrowUp, ArrowDown, X } from 'lucide-react';
import { upload } from '@/lib/api';
import { usePrefs } from '@/lib/prefs';
import { useUi, Spinner } from './ui';

export type FieldType = 'text' | 'textarea' | 'html' | 'number' | 'bool' | 'select' | 'image' | 'images' | 'tags' | 'date' | 'datetime' | 'lookup' | 'color' | 'email' | 'slug';
export interface FieldDef {
  name: string; label: string; type?: FieldType; required?: boolean; options?: (string | [string, string])[]; lookup?: string; hint?: string;
  half?: boolean; third?: boolean; min?: number; max?: number; rows?: number; folder?: string; placeholder?: string; nullable?: boolean;
}

export function Field({ label, htmlFor, error, hint, children, className = '' }: { label: string; htmlFor?: string; error?: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label">{label}</label>
      {children}
      {error ? <p className="err" role="alert">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

export function ImageInput({ value, onChange, folder = 'media', id }: { value: string | null; onChange: (v: string | null) => void; folder?: string; id?: string }) {
  const { t } = usePrefs();
  const { toast } = useUi();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try { const r = await upload(f, folder); onChange(r.url); toast(t('Image uploaded', 'ছবি আপলোড হয়েছে')); }
    catch (e) { toast((e as Error).message, 'err'); } finally { setBusy(false); if (ref.current) ref.current.value = ''; }
  };
  return (
    <div className="flex gap-3 items-start">
      <div className="w-24 h-24 rounded-lg border border-dashed border-line bg-surface-2 grid place-items-center overflow-hidden shrink-0">
        {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : <ImagePlus className="w-6 h-6 text-muted" />}
      </div>
      <div className="flex-1 space-y-2">
        <input id={id} className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} placeholder="/media/… or https://…" />
        <div className="flex gap-2">
          <button type="button" className="btn btn-outline btn-xs" onClick={() => ref.current?.click()} disabled={busy}>{busy ? <Spinner className="w-4 h-4" /> : <ImagePlus className="w-4 h-4" />}{t('Upload', 'আপলোড')}</button>
          {value && <button type="button" className="btn btn-ghost btn-xs text-sale" onClick={() => onChange(null)}>{t('Remove', 'সরান')}</button>}
        </div>
        <input ref={ref} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => pick(e.target.files?.[0])} />
      </div>
    </div>
  );
}

export function ImagesInput({ value, onChange, folder = 'media' }: { value: string[]; onChange: (v: string[]) => void; folder?: string }) {
  const { t } = usePrefs();
  const { toast } = useUi();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const move = (i: number, d: number) => { const a = [...value]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; onChange(a); };
  return (
    <div className="space-y-3">
      <ul className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {value.map((u, i) => (
          <li key={u + i} className="relative group aspect-square rounded-lg overflow-hidden border border-line bg-surface-2">
            <img src={u} alt="" className="w-full h-full object-cover" />
            {i === 0 && <span className="absolute top-1 left-1 text-[9px] font-bold uppercase bg-deep text-white px-1.5 py-0.5 rounded">Cover</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 p-1 bg-black/50 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
              <button type="button" className="text-white p-1" onClick={() => move(i, -1)} aria-label={t('Move left', 'বামে')}><ArrowUp className="w-3.5 h-3.5 -rotate-90" /></button>
              <button type="button" className="text-white p-1" onClick={() => move(i, 1)} aria-label={t('Move right', 'ডানে')}><ArrowDown className="w-3.5 h-3.5 -rotate-90" /></button>
              <button type="button" className="text-white p-1" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={t('Remove image', 'ছবি সরান')}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </li>
        ))}
        <li><button type="button" className="w-full aspect-square rounded-lg border border-dashed border-line grid place-items-center text-muted hover:border-ink" onClick={() => ref.current?.click()} disabled={busy}>{busy ? <Spinner /> : <span className="text-xs flex flex-col items-center gap-1"><ImagePlus className="w-5 h-5" />{t('Add', 'যোগ')}</span>}</button></li>
      </ul>
      <div className="flex gap-2"><input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t('…or paste an image URL', '…অথবা ছবির URL দিন')} aria-label={t('Image URL', 'ছবির URL')} /><button type="button" className="btn btn-outline btn-sm" onClick={() => { if (url.trim()) { onChange([...value, url.trim()]); setUrl(''); } }}>{t('Add', 'যোগ')}</button></div>
      <input ref={ref} type="file" accept="image/*" multiple className="sr-only" tabIndex={-1} aria-hidden onChange={async (e) => {
        const files = [...(e.target.files ?? [])];
        setBusy(true);
        const out = [...value];
        for (const f of files) { try { out.push((await upload(f, folder)).url); } catch (x) { toast((x as Error).message, 'err'); } }
        onChange(out); setBusy(false); e.target.value = '';
      }} />
    </div>
  );
}

export function TagsInput({ value, onChange, id }: { value: string[]; onChange: (v: string[]) => void; id?: string }) {
  const [v, setV] = useState('');
  const add = () => { const s = v.trim(); if (s && !value.includes(s)) onChange([...value, s]); setV(''); };
  return (
    <div className="input h-auto min-h-10 flex flex-wrap gap-1.5 py-1.5">
      {value.map((x) => <span key={x} className="inline-flex items-center gap-1 bg-surface-2 rounded px-2 text-xs h-7">{x}<button type="button" onClick={() => onChange(value.filter((y) => y !== x))} aria-label={`Remove ${x}`}><X className="w-3 h-3" /></button></span>)}
      <input id={id} className="flex-1 min-w-[120px] bg-transparent outline-none text-sm" value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }} onBlur={add} placeholder="Type and press Enter" />
    </div>
  );
}

type Lookups = Record<string, { id: number; nameEn: string; slug?: string }[]>;

/** Renders one FieldDef bound to react-hook-form. */
export function FormField({ f, control, register, errors, lookups }: { f: FieldDef; control: Control<Record<string, unknown>>; register: UseFormRegister<Record<string, unknown>>; errors: FieldErrors; lookups?: Lookups }) {
  const id = useId();
  const err = errors[f.name]?.message as string | undefined;
  const span = f.half ? 'sm:col-span-1' : f.third ? '' : 'sm:col-span-2';
  const type = f.type ?? 'text';
  const common = { id, 'aria-invalid': !!err || undefined };
  let input: React.ReactNode;
  switch (type) {
    case 'textarea': case 'html':
      input = <textarea {...common} rows={f.rows ?? (type === 'html' ? 10 : 3)} className={`input ${type === 'html' ? 'font-mono text-xs' : ''}`} {...register(f.name)} placeholder={f.placeholder} />; break;
    case 'number':
      input = <input {...common} type="number" className="input" min={f.min} max={f.max} {...register(f.name)} />; break;
    case 'bool':
      return <label className={`flex items-center gap-2 text-sm ${span} self-end h-10`}><input type="checkbox" className="w-4 h-4 accent-[rgb(var(--primary))]" {...register(f.name)} />{f.label}</label>;
    case 'select':
      input = <select {...common} className="input" {...register(f.name)}>{f.nullable && <option value="">—</option>}{(f.options ?? []).map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return <option key={v} value={v}>{l}</option>; })}</select>; break;
    case 'lookup':
      input = <select {...common} className="input" {...register(f.name)}><option value="">—</option>{(lookups?.[f.lookup!] ?? []).map((o) => <option key={o.id} value={f.lookup === 'collectionSlugs' ? o.slug : o.id}>{o.nameEn}</option>)}</select>; break;
    case 'date': input = <input {...common} type="date" className="input" {...register(f.name)} />; break;
    case 'datetime': input = <input {...common} type="datetime-local" className="input" {...register(f.name)} />; break;
    case 'color': input = <input {...common} type="color" className="input p-1 w-20" {...register(f.name)} />; break;
    case 'image': input = <Controller control={control} name={f.name} render={({ field }) => <ImageInput id={id} value={(field.value as string) ?? null} onChange={field.onChange} folder={f.folder} />} />; break;
    case 'images': input = <Controller control={control} name={f.name} render={({ field }) => <ImagesInput value={(field.value as string[]) ?? []} onChange={field.onChange} folder={f.folder} />} />; break;
    case 'tags': input = <Controller control={control} name={f.name} render={({ field }) => <TagsInput id={id} value={(field.value as string[]) ?? []} onChange={field.onChange} />} />; break;
    default: input = <input {...common} type={type === 'email' ? 'email' : 'text'} className="input" {...register(f.name)} placeholder={f.placeholder} />;
  }
  return <Field label={f.label + (f.required ? ' *' : '')} htmlFor={id} error={err} hint={f.hint} className={span}>{input}</Field>;
}
