import { useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink, Plus, Star, Trash2 } from 'lucide-react';
import { api, ApiError, qs } from '@/lib/api';
import { RESOURCE_UI, type Col } from '@/lib/resources';
import { schemaFor, toForm, toPayload } from '@/lib/form';
import { useAuth } from '@/lib/auth';
import { usePrefs } from '@/lib/prefs';
import { Card, Empty, ErrorBox, Loading, PageHeader, Pager, Pill, SearchInput, STATUS_TONE, useUi } from '@/components/ui';
import { FormField } from '@/components/fields';
import { NoAccess, STORE_URL } from '@/components/layout';

export const useLookups = () => useQuery({ queryKey: ['lookups'], queryFn: () => api<Record<string, { id: number; nameEn: string; slug?: string }[]>>('/admin/lookups'), staleTime: 300_000 });

export function Cell({ c, r }: { c: Col; r: Record<string, unknown> }) {
  const { money, date, num } = usePrefs();
  const v = c.get ? c.get(r) : r[c.key];
  if (v === null || v === undefined || v === '') return <span className="text-muted">—</span>;
  switch (c.type) {
    case 'image': return <img src={String(v)} alt="" className="w-10 h-10 rounded-lg object-cover bg-surface-2" loading="lazy" />;
    case 'bool': return v ? <Pill tone="green">Yes</Pill> : <Pill tone="gray">No</Pill>;
    case 'status': return <Pill tone={STATUS_TONE[String(v)] ?? 'gray'}>{String(v).replace(/[-_]/g, ' ')}</Pill>;
    case 'date': return <>{date(String(v))}</>;
    case 'datetime': return <>{date(String(v), true)}</>;
    case 'money': return <>{money(Number(v))}</>;
    case 'count': return <>{typeof v === 'number' ? num(v) : String(v)}</>;
    case 'rating': return <span className="inline-flex items-center gap-0.5 text-accent" aria-label={`${v} of 5`}>{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < Number(v) ? 'fill-current' : 'opacity-30'}`} />)}</span>;
    case 'mono': return <code className="text-xs">{String(v)}</code>;
    default: return <span className="line-clamp-2">{String(v)}</span>;
  }
}

export function ResourceList() {
  const { resource = '' } = useParams();
  const ui = RESOURCE_UI[resource];
  const { can } = useAuth();
  const { t } = usePrefs();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const page = Number(sp.get('page') ?? 1);
  const q = sp.get('q') ?? '';
  const filterVals = Object.fromEntries((ui?.filters ?? []).map((f) => [f.name, sp.get(f.name) ?? '']));
  const query = useQuery({ queryKey: ['r', resource, page, q, filterVals], queryFn: () => api<{ items: Record<string, unknown>[]; total: number; page: number; pageSize: number }>(`/admin/r/${resource}${qs({ page, q, ...filterVals })}`), enabled: !!ui && can(`${ui?.group}.read`) });
  if (!ui) return <ErrorBox error={new Error('Unknown section')} />;
  if (!can(`${ui.group}.read`)) return <NoAccess />;
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); if (k !== 'page') n.delete('page'); setSp(n, { replace: true }); };
  const canWrite = can(`${ui.group}.write`);
  return (
    <div data-testid={`resource-${resource}`}>
      <PageHeader title={t(...ui.title)} actions={!ui.noCreate && canWrite && <Link to={`/r/${resource}/new`} className="btn btn-primary btn-sm" data-testid="resource-new"><Plus className="w-4 h-4" />{t(`Add ${ui.singular}`, 'নতুন যোগ করুন')}</Link>} />
      <Card pad={false}>
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-line">
          <SearchInput value={q} onChange={(v) => set('q', v)} placeholder={t('Search…', 'খুঁজুন…')} />
          {ui.filters?.map((f) => (
            <select key={f.name} className="input w-auto" value={filterVals[f.name]} onChange={(e) => set(f.name, e.target.value)} aria-label={f.label}>
              <option value="">{f.label}: {t('All', 'সব')}</option>
              {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
        </div>
        {query.isLoading ? <Loading /> : query.error ? <div className="p-4"><ErrorBox error={query.error} /></div> : !query.data?.items.length ? <Empty>{t('Nothing here yet.', 'এখনো কিছু নেই।')}</Empty> : (
          <>
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr>{ui.columns.map((c) => <th key={c.key} scope="col">{c.label || <span className="sr-only">Image</span>}</th>)}</tr></thead>
                <tbody>{query.data.items.map((r) => (
                  <tr key={String(r.id)} className="cursor-pointer" onClick={() => nav(`/r/${resource}/${r.id}`)} data-testid="resource-row">
                    {ui.columns.map((c, i) => <td key={c.key}>{i === (ui.columns[0].type === 'image' ? 1 : 0) ? <Link to={`/r/${resource}/${r.id}`} className="font-medium hover:text-primary" onClick={(e) => e.stopPropagation()}><Cell c={c} r={r} /></Link> : <Cell c={c} r={r} />}</td>)}
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <Pager page={page} pageSize={query.data.pageSize} total={query.data.total} onPage={(p) => set('page', String(p))} />
          </>
        )}
      </Card>
    </div>
  );
}

export function ResourceEdit() {
  const { resource = '', id = 'new' } = useParams();
  const ui = RESOURCE_UI[resource];
  const isNew = id === 'new';
  const { can } = useAuth();
  const { t, date } = usePrefs();
  const { toast, confirm } = useUi();
  const qc = useQueryClient();
  const nav = useNavigate();
  const lookups = useLookups();
  const row = useQuery({ queryKey: ['r', resource, 'one', id], queryFn: () => api<Record<string, unknown>>(`/admin/r/${resource}/${id}`), enabled: !!ui && !isNew });
  const schema = useMemo(() => (ui ? schemaFor(ui.fields) : null), [ui]);
  if (!ui) return <ErrorBox error={new Error('Unknown section')} />;
  if (!can(`${ui.group}.read`)) return <NoAccess />;
  if (!isNew && row.isLoading) return <Loading />;
  if (row.error) return <ErrorBox error={row.error} />;
  return <ResourceForm key={`${resource}-${id}`} resource={resource} id={id} row={row.data ?? null} schema={schema!} lookups={lookups.data} canWrite={can(`${ui.group}.write`)}
    onSaved={(r) => { qc.invalidateQueries({ queryKey: ['r', resource] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); toast(t('Saved', 'সংরক্ষিত')); if (isNew) nav(`/r/${resource}/${r.id}`, { replace: true }); }}
    onDelete={async () => {
      if (!(await confirm({ title: t(`Delete this ${ui.singular}?`, 'মুছে ফেলবেন?'), body: t('This cannot be undone.', 'এটি ফেরত আনা যাবে না।'), confirm: t('Delete', 'মুছুন'), danger: true }))) return;
      try { await api(`/admin/r/${resource}/${id}`, { method: 'DELETE' }); nav(`/r/${resource}`); qc.invalidateQueries({ queryKey: ['r', resource], predicate: (x) => x.queryKey[2] !== 'one' }); toast(t('Deleted', 'মুছে ফেলা হয়েছে')); }
      catch (e) { toast((e as Error).message, 'err'); }
    }}
    dateFmt={date} />;
}

function ResourceForm({ resource, id, row, schema, lookups, canWrite, onSaved, onDelete, dateFmt }: {
  resource: string; id: string; row: Record<string, unknown> | null; schema: ReturnType<typeof schemaFor>; lookups?: Record<string, { id: number; nameEn: string; slug?: string }[]>; canWrite: boolean;
  onSaved: (r: Record<string, unknown>) => void; onDelete: () => void; dateFmt: (d: string, time?: boolean) => string;
}) {
  const ui = RESOURCE_UI[resource];
  const { t } = usePrefs();
  const isNew = id === 'new';
  const { register, control, handleSubmit, setError, reset, formState: { errors, isSubmitting, isDirty } } = useForm<Record<string, unknown>>({ resolver: zodResolver(schema) as never, defaultValues: toForm(ui.fields, row) });
  const save = useMutation({
    mutationFn: (values: Record<string, unknown>) => api<Record<string, unknown>>(isNew ? `/admin/r/${resource}` : `/admin/r/${resource}/${id}`, { method: isNew ? 'POST' : 'PUT', body: toPayload(ui.fields, values) }),
    onSuccess: (r, values) => { if (!isNew) reset(values, { keepValues: true }); onSaved(r); }, // keepValues: edits typed while saving survive
    onError: (e) => {
      const fe = (e as ApiError).fields ?? {};
      for (const [k, m] of Object.entries(fe)) setError(k, { message: m });
      setError('root', { message: (e as Error).message });
    },
  });
  const title = isNew ? t(`New ${ui.singular}`, 'নতুন') : String(row?.nameEn ?? row?.titleEn ?? row?.ref ?? row?.code ?? row?.title ?? row?.name ?? row?.email ?? row?.questionEn ?? `#${id}`);
  const store = row && ui.storePath?.(row);
  return (
    <form onSubmit={handleSubmit((v) => save.mutate(v))} noValidate data-testid="resource-form">
      <PageHeader title={title} crumbs={<><Link className="hover:underline" to={`/r/${resource}`}>{t(...ui.title)}</Link> / {isNew ? t('New', 'নতুন') : `#${id}`}</>}
        actions={<>{store && <a className="btn btn-outline btn-sm" href={`${STORE_URL}/en${store}`} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" />{t('View on store', 'স্টোরে দেখুন')}</a>}
          {!isNew && canWrite && <button type="button" className="btn btn-outline btn-sm text-sale" onClick={onDelete} data-testid="resource-delete"><Trash2 className="w-4 h-4" />{t('Delete', 'মুছুন')}</button>}</>} />
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="space-y-6">
          {ui.details && row && (
            <Card title={t('Details', 'বিস্তারিত')}>
              <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {ui.details.map((k) => {
                  const v = row[k];
                  if (v === null || v === undefined || v === '') return null;
                  const long = typeof v === 'string' && v.length > 60;
                  return <div key={k} className={long ? 'sm:col-span-2' : ''}><dt className="text-xs uppercase tracking-wide text-muted">{k.replace(/([A-Z])/g, ' $1')}</dt><dd className="mt-0.5 whitespace-pre-wrap break-words">{k === 'photos' && Array.isArray(v) ? <span className="flex gap-2">{v.map((u: string) => <img key={u} src={u} alt="" className="w-16 h-16 rounded object-cover" />)}</span> : typeof v === 'object' ? JSON.stringify(v) : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}</dd></div>;
                })}
              </dl>
            </Card>
          )}
          <Card title={ui.details ? t('Workflow', 'ওয়ার্কফ্লো') : t('Content', 'কনটেন্ট')}>
            <fieldset disabled={!canWrite} className="grid sm:grid-cols-2 gap-4">
              {ui.fields.map((f) => <FormField key={f.name} f={f} control={control} register={register} errors={errors} lookups={lookups} />)}
            </fieldset>
          </Card>
        </div>
        <aside className="card p-5 space-y-4 lg:sticky lg:top-24">
          {errors.root && <p className="text-sm text-sale" role="alert" data-testid="form-error">{errors.root.message}</p>}
          {canWrite ? <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting || save.isPending || (!isNew && !isDirty)} data-testid="resource-save">{save.isPending ? t('Saving…', 'সংরক্ষণ হচ্ছে…') : isNew ? t('Create', 'তৈরি করুন') : t('Save changes', 'পরিবর্তন সংরক্ষণ')}</button> : <p className="text-sm text-muted">{t('Read-only — your role cannot edit this.', 'শুধু দেখা যাবে — সম্পাদনার অনুমতি নেই।')}</p>}
          {row && <dl className="text-xs text-muted space-y-1">{row.createdAt ? <div>{t('Created', 'তৈরি')}: {dateFmt(String(row.createdAt), true)}</div> : null}{row.updatedAt ? <div>{t('Updated', 'আপডেট')}: {dateFmt(String(row.updatedAt), true)}</div> : null}</dl>}
          <Link to={`/r/${resource}`} className="btn btn-ghost btn-sm w-full">{t('Back to list', 'তালিকায় ফিরুন')}</Link>
        </aside>
      </div>
    </form>
  );
}
