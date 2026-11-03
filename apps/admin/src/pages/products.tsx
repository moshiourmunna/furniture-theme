import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Copy, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { api, ApiError, qs } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { usePrefs } from '@/lib/prefs';
import { Card, Empty, ErrorBox, Loading, PageHeader, Pager, Pill, SearchInput, Tabs, useUi } from '@/components/ui';
import { Field, ImagesInput } from '@/components/fields';
import { NoAccess, STORE_URL } from '@/components/layout';
import { useLookups } from './resource';
import { useState } from 'react';

interface PRow { id: number; slug: string; sku: string; nameEn: string; price: number; compareAtPrice: number | null; stockStatus: string; stockTotal: number; isActive: boolean; isFeatured: boolean; soldCount: number; category: { nameEn: string }; images: { url: string }[]; updatedAt: string }
const STOCK_TONE: Record<string, string> = { IN_STOCK: 'green', LOW: 'amber', MADE_TO_ORDER: 'blue', OUT_OF_STOCK: 'red' };

export function Products() {
  const { can } = useAuth();
  const { t, money, num, date } = usePrefs();
  const lookups = useLookups();
  const [sp, setSp] = useSearchParams();
  const page = Number(sp.get('page') ?? 1);
  const f = { q: sp.get('q') ?? '', categoryId: sp.get('categoryId') ?? '', status: sp.get('status') ?? '', stock: sp.get('stock') ?? '', sort: sp.get('sort') ?? 'updatedAt' };
  const q = useQuery({ queryKey: ['products', page, f], queryFn: () => api<{ items: PRow[]; total: number; pageSize: number }>(`/admin/products${qs({ page, ...f })}`), enabled: can('products.read') });
  if (!can('products.read')) return <NoAccess />;
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); if (k !== 'page') n.delete('page'); setSp(n, { replace: true }); };
  return (
    <div data-testid="products">
      <PageHeader title={t('Products', 'পণ্য')} actions={can('products.write') && <Link to="/products/new" className="btn btn-primary btn-sm" data-testid="product-new"><Plus className="w-4 h-4" />{t('Add product', 'পণ্য যোগ করুন')}</Link>} />
      <Card pad={false}>
        <div className="flex flex-wrap gap-2 p-4 border-b border-line">
          <SearchInput value={f.q} onChange={(v) => set('q', v)} placeholder={t('Name or SKU', 'নাম বা SKU')} />
          <select className="input w-auto" value={f.categoryId} onChange={(e) => set('categoryId', e.target.value)} aria-label={t('Category', 'ক্যাটাগরি')}><option value="">{t('All categories', 'সব ক্যাটাগরি')}</option>{lookups.data?.categories.map((c) => <option key={c.id} value={c.id}>{c.nameEn}</option>)}</select>
          <select className="input w-auto" value={f.status} onChange={(e) => set('status', e.target.value)} aria-label={t('Status', 'স্ট্যাটাস')}><option value="">{t('Any status', 'যেকোনো')}</option><option value="active">{t('Active', 'সক্রিয়')}</option><option value="draft">{t('Draft / archived', 'খসড়া / আর্কাইভ')}</option></select>
          <select className="input w-auto" value={f.stock} onChange={(e) => set('stock', e.target.value)} aria-label={t('Stock', 'স্টক')}><option value="">{t('Any stock', 'যেকোনো স্টক')}</option>{Object.keys(STOCK_TONE).map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ').toLowerCase()}</option>)}</select>
          <select className="input w-auto" value={f.sort} onChange={(e) => set('sort', e.target.value)} aria-label={t('Sort', 'সাজান')}><option value="updatedAt">{t('Recently updated', 'সম্প্রতি আপডেট')}</option><option value="soldCount">{t('Best selling', 'সর্বাধিক বিক্রিত')}</option><option value="price">{t('Price', 'দাম')}</option><option value="nameEn">{t('Name', 'নাম')}</option></select>
        </div>
        {q.isLoading ? <Loading /> : q.error ? <div className="p-4"><ErrorBox error={q.error} /></div> : !q.data?.items.length ? <Empty>{t('No products match.', 'কোনো পণ্য নেই।')}</Empty> : (
          <>
            <div className="overflow-x-auto"><table className="tbl">
              <thead><tr><th><span className="sr-only">Image</span></th><th>{t('Product', 'পণ্য')}</th><th>{t('Category', 'ক্যাটাগরি')}</th><th className="text-right">{t('Price', 'দাম')}</th><th>{t('Stock', 'স্টক')}</th><th className="text-right">{t('Sold', 'বিক্রি')}</th><th>{t('Status', 'স্ট্যাটাস')}</th></tr></thead>
              <tbody>{q.data.items.map((p) => (
                <tr key={p.id} data-testid="product-row">
                  <td className="w-14">{p.images[0] && <img src={p.images[0].url} alt="" className="w-11 h-11 rounded-lg object-cover" loading="lazy" />}</td>
                  <td><Link to={`/products/${p.id}`} className="font-medium hover:text-primary">{p.nameEn}</Link><div className="text-xs text-muted">{p.sku} · {date(p.updatedAt)}</div></td>
                  <td>{p.category.nameEn}</td>
                  <td className="text-right whitespace-nowrap">{money(p.price)}{p.compareAtPrice && <div className="text-xs text-muted line-through">{money(p.compareAtPrice)}</div>}</td>
                  <td><Pill tone={STOCK_TONE[p.stockStatus]}>{p.stockStatus === 'MADE_TO_ORDER' ? t('made to order', 'অর্ডারে তৈরি') : `${num(p.stockTotal)} ${t('in stock', 'স্টকে')}`}</Pill></td>
                  <td className="text-right">{num(p.soldCount)}</td>
                  <td>{p.isActive ? <Pill tone="green">{t('active', 'সক্রিয়')}</Pill> : <Pill tone="gray">{t('draft', 'খসড়া')}</Pill>}{p.isFeatured && <Pill tone="brand">{t('featured', 'ফিচার্ড')}</Pill>}</td>
                </tr>
              ))}</tbody>
            </table></div>
            <Pager page={page} pageSize={q.data.pageSize} total={q.data.total} onPage={(p) => set('page', String(p))} />
          </>
        )}
      </Card>
    </div>
  );
}

const num = z.union([z.string(), z.number(), z.null()]).transform((v) => (v === '' || v === null ? null : Number(v))).refine((v) => v === null || (Number.isFinite(v) && v >= 0), 'Enter a valid number');
const reqNum = z.union([z.string(), z.number()]).transform(Number).refine((v) => Number.isFinite(v) && v >= 0, 'Enter a valid number');
const optStr = z.string().nullish();
const variant = z.object({ id: z.number().optional(), sku: z.string().trim().min(2, 'SKU required'), nameEn: z.string().trim().min(1, 'Required'), nameBn: z.string().trim().min(1, 'Required'), optionType: z.enum(['finish', 'fabric', 'size', 'colour']), swatchHex: z.string().nullish(), priceDelta: z.union([z.string(), z.number()]).transform(Number), stockQty: reqNum, lowStockAt: reqNum, isDefault: z.boolean() });
const productSchema = z.object({
  slug: z.string().refine((v) => !v || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v), 'Lowercase letters, numbers and dashes'), sku: z.string().trim().min(2, 'Required'),
  nameEn: z.string().trim().min(2, 'Required'), nameBn: z.string().trim().min(2, 'Required'), shortEn: optStr, shortBn: optStr, descriptionEn: optStr, descriptionBn: optStr,
  categoryId: z.union([z.string(), z.number()]).refine((v) => !!v, 'Choose a category').transform(Number), roomId: num, materialId: num, brandId: num, collectionId: num,
  price: reqNum, compareAtPrice: num, badge: z.string().nullish().transform((v) => v || null), stockStatus: z.enum(['IN_STOCK', 'LOW', 'MADE_TO_ORDER', 'OUT_OF_STOCK']), leadTimeDays: reqNum,
  widthCm: num, depthCm: num, heightCm: num, seats: num, warrantyYears: reqNum, assemblyRequired: z.boolean(), emiAvailable: z.boolean(), isActive: z.boolean(), isFeatured: z.boolean(),
  metaTitleEn: optStr, metaTitleBn: optStr, metaDescEn: optStr, metaDescBn: optStr, images: z.array(z.string()), variants: z.array(variant).min(1, 'Add at least one variant'),
}).refine((p) => p.compareAtPrice == null || p.compareAtPrice > p.price, { message: 'Must be higher than the price', path: ['compareAtPrice'] })
  .refine((p) => p.variants.filter((v) => v.isDefault).length <= 1, { message: 'Only one default variant', path: ['variants'] });
type PForm = z.input<typeof productSchema>;

const blank = (): PForm => ({ slug: '', sku: '', nameEn: '', nameBn: '', shortEn: '', shortBn: '', descriptionEn: '', descriptionBn: '', categoryId: '', roomId: '', materialId: '', brandId: '', collectionId: '', price: '', compareAtPrice: '', badge: '', stockStatus: 'IN_STOCK', leadTimeDays: 5, widthCm: '', depthCm: '', heightCm: '', seats: '', warrantyYears: 10, assemblyRequired: true, emiAvailable: true, isActive: true, isFeatured: false, metaTitleEn: '', metaTitleBn: '', metaDescEn: '', metaDescBn: '', images: [], variants: [{ sku: '', nameEn: 'Natural', nameBn: 'ন্যাচারাল', optionType: 'finish', swatchHex: '#B08B5E', priceDelta: 0, stockQty: 0, lowStockAt: 3, isDefault: true }] });
const toFormP = (p: Record<string, unknown>): PForm => {
  const b = blank() as Record<string, unknown>;
  for (const k of Object.keys(b)) if (k !== 'images' && k !== 'variants') b[k] = p[k] === null || p[k] === undefined ? (typeof b[k] === 'boolean' ? false : '') : p[k];
  b.images = (p.images as { url: string }[]).map((i) => i.url);
  b.variants = (p.variants as Record<string, unknown>[]).map((v) => ({ id: v.id, sku: v.sku, nameEn: v.nameEn, nameBn: v.nameBn, optionType: v.optionType, swatchHex: v.swatchHex ?? '', priceDelta: v.priceDelta, stockQty: v.stockQty, lowStockAt: v.lowStockAt, isDefault: v.isDefault }));
  return b as PForm;
};

export function ProductEdit() {
  const { id = 'new' } = useParams();
  const isNew = id === 'new';
  const { can } = useAuth();
  const [sp] = useSearchParams();
  const dup = sp.get('duplicate');
  const src = isNew ? dup : id;
  const q = useQuery({ queryKey: ['product', src], queryFn: () => api<Record<string, unknown>>(`/admin/products/${src}`), enabled: !!src && can('products.read') });
  if (!can('products.read')) return <NoAccess />;
  if (src && q.isLoading) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  let init = q.data ? toFormP(q.data) : blank();
  if (isNew && dup && q.data) init = { ...init, slug: '', sku: `${init.sku}-COPY`, nameEn: `${init.nameEn} (copy)`, isActive: false, variants: init.variants.map((v) => ({ ...v, id: undefined, sku: `${v.sku}-C` })) };
  return <ProductForm key={`${id}-${q.dataUpdatedAt}`} id={id} init={init} slug={q.data && !isNew ? String(q.data.slug) : null} />;
}

function ProductForm({ id, init, slug }: { id: string; init: PForm; slug: string | null }) {
  const isNew = id === 'new';
  const { can } = useAuth();
  const { t } = usePrefs();
  const { toast, confirm } = useUi();
  const nav = useNavigate();
  const qc = useQueryClient();
  const lookups = useLookups();
  const [lang, setLang] = useState<'En' | 'Bn'>('En');
  const { register, control, handleSubmit, setError, formState: { errors, isDirty } } = useForm<PForm, unknown, z.output<typeof productSchema>>({ resolver: zodResolver(productSchema), defaultValues: init });
  const variants = useFieldArray({ control, name: 'variants' });
  const save = useMutation({
    mutationFn: (d: z.output<typeof productSchema>) => api<{ id: number }>(isNew ? '/admin/products' : `/admin/products/${id}`, { method: isNew ? 'POST' : 'PUT', body: { ...d, slug: d.slug || undefined, images: d.images.map((url) => ({ url })) } }),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ['products'] }); qc.invalidateQueries({ queryKey: ['product'] }); qc.invalidateQueries({ queryKey: ['lookups'] }); toast(t('Product saved', 'পণ্য সংরক্ষিত')); if (isNew) nav(`/products/${r.id}`, { replace: true }); },
    onError: (e) => { for (const [k, m] of Object.entries((e as ApiError).fields ?? {})) setError(k as keyof PForm, { message: m }); setError('root', { message: (e as Error).message }); },
  });
  const del = async () => {
    if (!(await confirm({ title: t('Delete this product?', 'পণ্যটি মুছবেন?'), body: t('Products with orders are archived instead of deleted.', 'অর্ডার থাকলে পণ্য আর্কাইভ হবে।'), confirm: t('Delete', 'মুছুন'), danger: true }))) return;
    try { const r = await api<{ archived: boolean }>(`/admin/products/${id}`, { method: 'DELETE' }); toast(r.archived ? t('Archived (has orders)', 'আর্কাইভ করা হয়েছে') : t('Deleted', 'মুছে ফেলা হয়েছে')); nav('/products'); qc.invalidateQueries({ queryKey: ['products'] }); }
    catch (e) { toast((e as Error).message, 'err'); }
  };
  const e = errors as Record<string, { message?: string } | undefined>;
  const inp = (name: keyof PForm, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => <Field label={label} htmlFor={`p-${name}`} error={e[name]?.message}><input id={`p-${name}`} className="input" aria-invalid={!!e[name]} {...register(name)} {...extra} /></Field>;
  const sel = (name: keyof PForm, label: string, opts: { id: number | string; nameEn: string }[] | undefined, required = false) => <Field label={label} htmlFor={`p-${name}`} error={e[name]?.message}><select id={`p-${name}`} className="input" aria-invalid={!!e[name]} {...register(name)}>{!required || isNew ? <option value="">—</option> : null}{opts?.map((o) => <option key={o.id} value={o.id}>{o.nameEn}</option>)}</select></Field>;
  const canWrite = can('products.write');
  return (
    <form onSubmit={handleSubmit((d) => save.mutate(d), (errs) => { if (errs.nameBn && !errs.nameEn) setLang('Bn'); else if (errs.nameEn) setLang('En'); })} noValidate data-testid="product-form" className="pb-24">
      <PageHeader crumbs={<><Link to="/products" className="hover:underline">{t('Products', 'পণ্য')}</Link> / {isNew ? t('New', 'নতুন') : init.nameEn}</>} title={isNew ? t('New product', 'নতুন পণ্য') : t('Edit product', 'পণ্য সম্পাদনা')}
        actions={<>{!isNew && <Link to={`/products/new?duplicate=${id}`} className="btn btn-outline btn-sm"><Copy className="w-4 h-4" />{t('Duplicate', 'ডুপ্লিকেট')}</Link>}{slug && <a href={`${STORE_URL}/en/p/${slug}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm"><ExternalLink className="w-4 h-4" />{t('View on store', 'স্টোরে দেখুন')}</a>}{!isNew && canWrite && <button type="button" className="btn btn-outline btn-sm text-sale" onClick={del} data-testid="product-delete"><Trash2 className="w-4 h-4" />{t('Delete', 'মুছুন')}</button>}</>} />
      <fieldset disabled={!canWrite} className="grid xl:grid-cols-[1fr_360px] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          <Card title={t('Basic information', 'মৌলিক তথ্য')} action={<Tabs value={lang} onChange={setLang} items={[['En', 'English'], ['Bn', 'বাংলা']]} />}>
            <div className="grid gap-4">
              {inp(`name${lang}` as keyof PForm, `${t('Product name', 'পণ্যের নাম')} (${lang === 'En' ? 'EN' : 'বাংলা'}) *`)}
              <Field label={`${t('Short description', 'সংক্ষিপ্ত বিবরণ')} (${lang === 'En' ? 'EN' : 'বাংলা'})`} htmlFor={`p-short${lang}`}><textarea id={`p-short${lang}`} rows={2} className="input" {...register(`short${lang}` as keyof PForm)} /></Field>
              <Field label={`${t('Description', 'বিবরণ')} (${lang === 'En' ? 'EN' : 'বাংলা'})`} htmlFor={`p-desc${lang}`} hint={t('Plain text; blank lines become paragraphs.', 'সাধারণ টেক্সট; ফাঁকা লাইনে অনুচ্ছেদ।')}><textarea id={`p-desc${lang}`} rows={6} className="input" {...register(`description${lang}` as keyof PForm)} /></Field>
              {(e.nameEn || e.nameBn) && <p className="err">{t('Both English and Bangla names are required.', 'ইংরেজি ও বাংলা দুই নামই প্রয়োজন।')}</p>}
            </div>
          </Card>
          <Card title={t('Media', 'মিডিয়া')}><Controller control={control} name="images" render={({ field }) => <ImagesInput value={field.value} onChange={field.onChange} folder="products" />} /></Card>
          <Card title={t('Pricing', 'দাম')}>
            <div className="grid sm:grid-cols-3 gap-4">{inp('price', `${t('Price (৳)', 'দাম (৳)')} *`, { type: 'number', min: 0 })}{inp('compareAtPrice', t('Compare-at price (৳)', 'আগের দাম (৳)'), { type: 'number', min: 0 })}<Field label={t('Badge', 'ব্যাজ')} htmlFor="p-badge"><select id="p-badge" className="input" {...register('badge')}><option value="">—</option>{['bestseller', 'new', 'sale', 'made'].map((b) => <option key={b}>{b}</option>)}</select></Field></div>
            <label className="flex items-center gap-2 text-sm mt-4"><input type="checkbox" className="w-4 h-4 accent-[rgb(var(--primary))]" {...register('emiAvailable')} />{t('0% EMI available', '০% ইএমআই উপলব্ধ')}</label>
          </Card>
          <Card title={t('Variants & stock', 'ভ্যারিয়েন্ট ও স্টক')} action={<button type="button" className="btn btn-outline btn-xs" onClick={() => variants.append({ sku: '', nameEn: '', nameBn: '', optionType: 'finish', swatchHex: '#B08B5E', priceDelta: 0, stockQty: 0, lowStockAt: 3, isDefault: false })} data-testid="variant-add"><Plus className="w-3.5 h-3.5" />{t('Add variant', 'ভ্যারিয়েন্ট যোগ')}</button>}>
            {e.variants?.message && <p className="err mb-2">{e.variants.message}</p>}
            <div className="overflow-x-auto -mx-5 px-5"><table className="tbl min-w-[860px]"><thead><tr><th>SKU</th><th>{t('Name (EN)', 'নাম (EN)')}</th><th>{t('Name (BN)', 'নাম (বাংলা)')}</th><th>{t('Type', 'ধরন')}</th><th>{t('Swatch', 'রং')}</th><th>{t('Price ±', 'দাম ±')}</th><th>{t('Stock', 'স্টক')}</th><th>{t('Default', 'ডিফল্ট')}</th><th /></tr></thead>
              <tbody>{variants.fields.map((v, i) => {
                const ve = (errors.variants as unknown as Record<string, Record<string, { message?: string }>> | undefined)?.[i];
                return (
                  <tr key={v.id} data-testid="variant-row">
                    <td><input className="input h-9" aria-label="SKU" aria-invalid={!!ve?.sku} {...register(`variants.${i}.sku`)} /></td>
                    <td><input className="input h-9" aria-label="Name EN" aria-invalid={!!ve?.nameEn} {...register(`variants.${i}.nameEn`)} /></td>
                    <td><input className="input h-9" aria-label="Name BN" aria-invalid={!!ve?.nameBn} {...register(`variants.${i}.nameBn`)} /></td>
                    <td><select className="input h-9" aria-label="Type" {...register(`variants.${i}.optionType`)}>{['finish', 'fabric', 'size', 'colour'].map((o) => <option key={o}>{o}</option>)}</select></td>
                    <td><input type="color" className="input h-9 w-12 p-1" aria-label="Swatch" {...register(`variants.${i}.swatchHex`)} /></td>
                    <td><input type="number" className="input h-9 w-24" aria-label="Price delta" {...register(`variants.${i}.priceDelta`)} /></td>
                    <td><input type="number" min={0} className="input h-9 w-20" aria-label="Stock" {...register(`variants.${i}.stockQty`)} /></td>
                    <td className="text-center"><input type="checkbox" className="w-4 h-4 accent-[rgb(var(--primary))]" aria-label="Default" {...register(`variants.${i}.isDefault`)} /></td>
                    <td><button type="button" className="btn-icon w-8 h-8 text-sale" onClick={() => variants.remove(i)} disabled={variants.fields.length <= 1} aria-label={t('Remove variant', 'ভ্যারিয়েন্ট সরান')}><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                );
              })}</tbody></table></div>
            <p className="hint">{t('Use Inventory for day-to-day stock adjustments — they are logged with a reason.', 'দৈনন্দিন স্টক সমন্বয়ের জন্য ইনভেন্টরি ব্যবহার করুন।')}</p>
          </Card>
          <Card title={t('Dimensions & details', 'মাপ ও বিস্তারিত')}>
            <div className="grid sm:grid-cols-3 gap-4">{inp('widthCm', t('Width (cm)', 'প্রস্থ (সেমি)'), { type: 'number' })}{inp('depthCm', t('Depth (cm)', 'গভীরতা (সেমি)'), { type: 'number' })}{inp('heightCm', t('Height (cm)', 'উচ্চতা (সেমি)'), { type: 'number' })}{inp('seats', t('Seats', 'আসন'), { type: 'number' })}{inp('warrantyYears', t('Warranty (years)', 'ওয়ারেন্টি (বছর)'), { type: 'number' })}{inp('leadTimeDays', t('Lead time (days)', 'প্রস্তুতির সময় (দিন)'), { type: 'number' })}</div>
            <label className="flex items-center gap-2 text-sm mt-4"><input type="checkbox" className="w-4 h-4 accent-[rgb(var(--primary))]" {...register('assemblyRequired')} />{t('Assembly required', 'অ্যাসেম্বলি প্রয়োজন')}</label>
          </Card>
          <Card title="SEO">
            <div className="grid sm:grid-cols-2 gap-4">{inp('metaTitleEn', 'Meta title (EN)')}{inp('metaTitleBn', 'Meta title (বাংলা)')}<Field label="Meta description (EN)" htmlFor="p-mde"><textarea id="p-mde" rows={2} className="input" {...register('metaDescEn')} /></Field><Field label="Meta description (বাংলা)" htmlFor="p-mdb"><textarea id="p-mdb" rows={2} className="input" {...register('metaDescBn')} /></Field></div>
          </Card>
        </div>
        <div className="space-y-4 xl:sticky xl:top-24">
          <Card title={t('Publishing', 'প্রকাশনা')}>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="w-4 h-4 accent-[rgb(var(--primary))]" {...register('isActive')} data-testid="p-active" />{t('Active — visible on the store', 'সক্রিয় — স্টোরে দেখা যাবে')}</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="w-4 h-4 accent-[rgb(var(--primary))]" {...register('isFeatured')} />{t('Featured on home', 'হোমে ফিচার্ড')}</label>
              <Field label={t('Stock status', 'স্টক স্ট্যাটাস')} htmlFor="p-stock"><select id="p-stock" className="input" {...register('stockStatus')}>{['IN_STOCK', 'LOW', 'MADE_TO_ORDER', 'OUT_OF_STOCK'].map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ').toLowerCase()}</option>)}</select></Field>
            </div>
          </Card>
          <Card title={t('Organisation', 'বিন্যাস')}>
            <div className="space-y-3">
              {inp('sku', 'SKU *')}{inp('slug', 'Slug', { placeholder: t('auto from name', 'নাম থেকে স্বয়ংক্রিয়') })}
              {sel('categoryId', `${t('Category', 'ক্যাটাগরি')} *`, lookups.data?.categories, true)}{sel('roomId', t('Room', 'রুম'), lookups.data?.rooms)}{sel('materialId', t('Material', 'উপাদান'), lookups.data?.materials)}{sel('brandId', t('Brand', 'ব্র্যান্ড'), lookups.data?.brands)}{sel('collectionId', t('Collection', 'কালেকশন'), lookups.data?.collections)}
            </div>
          </Card>
        </div>
      </fieldset>
      {canWrite && (
        <div className="fixed bottom-0 right-0 left-0 lg:left-64 z-20 bg-surface/95 backdrop-blur border-t border-line px-4 lg:px-8 py-3 flex items-center justify-end gap-3">
          {errors.root && <p className="text-sm text-sale mr-auto" role="alert" data-testid="form-error">{errors.root.message}</p>}
          {!errors.root && Object.keys(errors).length > 0 && <p className="text-sm text-sale mr-auto" role="alert">{t('Please fix the highlighted fields.', 'চিহ্নিত ঘরগুলো ঠিক করুন।')}</p>}
          <Link to="/products" className="btn btn-outline btn-sm">{t('Discard', 'বাতিল')}</Link>
          <button type="submit" className="btn btn-primary btn-sm" disabled={save.isPending || (!isNew && !isDirty)} data-testid="product-save">{save.isPending ? t('Saving…', 'সংরক্ষণ হচ্ছে…') : t('Save product', 'পণ্য সংরক্ষণ')}</button>
        </div>
      )}
    </form>
  );
}
