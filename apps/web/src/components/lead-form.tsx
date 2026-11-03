'use client';
import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { api, ApiClientError } from '@/lib/api';
import { useStore } from './providers';

export interface Field {
  name: string; label: string; type?: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'date' | 'checkboxes' | 'number';
  required?: boolean; options?: { value: string; label: string }[]; half?: boolean; placeholder?: string; min?: string; numeric?: boolean; autoComplete?: string; hint?: string;
}

/** Generic validated form posting to /api/v1/leads?type=… — shows field errors from the API and a reference on success. */
export function LeadForm({ type, fields, submitLabel, successTitle, successBody, initial = {}, testId }: { type: string; fields: Field[]; submitLabel: string; successTitle: string; successBody?: string; initial?: Record<string, string | string[]>; testId?: string }) {
  const { t } = useStore();
  const [v, setV] = useState<Record<string, string | string[]>>(() => Object.fromEntries(fields.map((f) => [f.name, initial[f.name] ?? (f.type === 'checkboxes' ? [] : f.type === 'select' && f.required ? f.options?.[0]?.value ?? '' : '')])));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  if (done !== null) {
    return (
      <div className="card p-8 text-center" role="status" data-testid={`${testId ?? type}-success`}>
        <CheckCircle2 className="w-10 h-10 mx-auto text-success" />
        <p className="h-display text-2xl mt-4">{successTitle}</p>
        {done && <p className="mt-2">{t('Your reference', 'আপনার রেফারেন্স')}: <strong data-testid="lead-ref">{done}</strong></p>}
        {successBody && <p className="text-muted mt-2">{successBody}</p>}
      </div>
    );
  }
  return (
    <form noValidate className="grid sm:grid-cols-2 gap-4" data-testid={testId ?? `${type}-form`} onSubmit={async (e) => {
      e.preventDefault();
      const errs: Record<string, string> = {};
      for (const f of fields) {
        const val = v[f.name];
        if (f.required && (Array.isArray(val) ? !val.length : !String(val).trim())) errs[f.name] = t('This field is required', 'এই ঘরটি পূরণ করুন');
        else if (f.type === 'email' && val && !/^\S+@\S+\.\S+$/.test(String(val))) errs[f.name] = t('Enter a valid email', 'সঠিক ইমেইল দিন');
      }
      setErrors(errs);
      if (Object.keys(errs).length) { document.getElementById(`lf-${Object.keys(errs)[0]}`)?.focus(); return; }
      setBusy(true);
      try {
        const body: Record<string, unknown> = {};
        for (const f of fields) { const val = v[f.name]; if (Array.isArray(val) ? val.length : val !== '') body[f.name] = f.numeric ? Number(val) : val; }
        const r = await api<{ ref?: string }>(`/leads?type=${type}`, { body });
        setDone(r.ref ?? '');
      } catch (x) {
        const ex = x as ApiClientError;
        if (ex.fields) setErrors(ex.fields); else setErrors({ _form: ex.message });
      } finally { setBusy(false); }
    }}>
      {fields.map((f) => {
        const id = `lf-${f.name}`;
        const err = errors[f.name];
        const common = { id, name: f.name, 'aria-invalid': !!err || undefined, 'aria-describedby': err ? `${id}-err` : f.hint ? `${id}-hint` : undefined, required: f.required };
        const set = (val: string | string[]) => setV((s) => ({ ...s, [f.name]: val }));
        return (
          <div key={f.name} className={f.half ? '' : 'sm:col-span-2'}>
            {f.type === 'checkboxes' ? (
              <fieldset><legend className="label">{f.label}{f.required && ' *'}</legend>
                <div className="flex flex-wrap gap-2 mt-1">{f.options?.map((o) => { const on = (v[f.name] as string[]).includes(o.value); return (
                  <label key={o.value} className={`chip h-9 cursor-pointer ${on ? 'chip-active' : ''}`}><input type="checkbox" className="sr-only" checked={on} onChange={() => set(on ? (v[f.name] as string[]).filter((x) => x !== o.value) : [...(v[f.name] as string[]), o.value])} />{o.label}</label>); })}</div>
              </fieldset>
            ) : (
              <>
                <label htmlFor={id} className="label">{f.label}{f.required && ' *'}</label>
                {f.type === 'textarea' ? <textarea {...common} rows={4} className="input" value={v[f.name] as string} onChange={(e) => set(e.target.value)} placeholder={f.placeholder} />
                  : f.type === 'select' ? <select {...common} className="input" value={v[f.name] as string} onChange={(e) => set(e.target.value)}>{!f.required && <option value="">{t('Choose…', 'বেছে নিন…')}</option>}{f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                  : <input {...common} type={f.type ?? 'text'} min={f.min} className="input" value={v[f.name] as string} onChange={(e) => set(e.target.value)} placeholder={f.placeholder} autoComplete={f.autoComplete} inputMode={f.type === 'tel' ? 'tel' : undefined} />}
              </>
            )}
            {f.hint && !err && <p id={`${id}-hint`} className="text-xs text-muted mt-1">{f.hint}</p>}
            {err && <p id={`${id}-err`} className="text-xs text-sale mt-1" role="alert">{err}</p>}
          </div>
        );
      })}
      {errors._form && <p className="sm:col-span-2 text-sm text-sale" role="alert">{errors._form}</p>}
      <div className="sm:col-span-2"><button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={busy} data-testid="lead-submit">{busy ? t('Sending…', 'পাঠানো হচ্ছে…') : submitLabel}</button></div>
    </form>
  );
}
