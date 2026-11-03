import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Search, X, AlertCircle } from 'lucide-react';
import { usePrefs } from '@/lib/prefs';

export function PageHeader({ title, crumbs, actions, sub }: { title: string; crumbs?: React.ReactNode; actions?: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>{crumbs && <p className="text-xs text-muted mb-1">{crumbs}</p>}<h1 className="text-2xl font-semibold tracking-tight">{title}</h1>{sub && <p className="text-sm text-muted mt-1">{sub}</p>}</div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, action, children, className = '', pad = true }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={`card ${className}`}>
      {title && <div className="flex items-center justify-between gap-3 px-5 pt-5"><h2 className="font-semibold">{title}</h2>{action}</div>}
      <div className={pad ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

export const Spinner = ({ className = 'w-5 h-5' }: { className?: string }) => <Loader2 className={`animate-spin ${className}`} aria-hidden />;
export function Loading() { const { t } = usePrefs(); return <div className="py-16 grid place-items-center text-muted" role="status"><Spinner /><span className="sr-only">{t('Loading', 'লোড হচ্ছে')}</span></div>; }
export function ErrorBox({ error }: { error: unknown }) { return <div className="card p-5 text-sale flex gap-2" role="alert"><AlertCircle className="w-5 h-5" />{(error as Error)?.message ?? 'Error'}</div>; }
export function Empty({ children }: { children: React.ReactNode }) { return <div className="py-14 text-center text-muted text-sm">{children}</div>; }

const TONE: Record<string, string> = {
  green: 'bg-success/15 text-success', red: 'bg-sale/15 text-sale', amber: 'bg-warning/15 text-warning', blue: 'bg-info/15 text-info', gray: 'bg-surface-2 text-muted', brand: 'bg-primary-soft text-primary',
};
export const Pill = ({ tone = 'gray', children }: { tone?: keyof typeof TONE | string; children: React.ReactNode }) => <span className={`pill ${TONE[tone] ?? TONE.gray}`}>{children}</span>;

export const ORDER_TONE: Record<string, string> = { PENDING: 'amber', CONFIRMED: 'blue', IN_PRODUCTION: 'brand', QUALITY_CHECK: 'brand', DISPATCHED: 'blue', OUT_FOR_DELIVERY: 'blue', DELIVERED: 'green', CANCELLED: 'red', RETURNED: 'red' };
export const PAY_TONE: Record<string, string> = { PAID: 'green', PARTIAL: 'blue', PENDING: 'amber', UNPAID: 'gray', FAILED: 'red', REFUNDED: 'gray' };
export const STATUS_TONE: Record<string, string> = { new: 'amber', requested: 'amber', pending: 'amber', measured: 'blue', quoted: 'blue', contacted: 'blue', proposal: 'blue', confirmed: 'blue', dispatched: 'blue', approved: 'green', production: 'brand', completed: 'green', won: 'green', replied: 'green', closed: 'gray', lost: 'red', rejected: 'red', cancelled: 'red' };

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const id = useId();
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  useEffect(() => { const h = setTimeout(() => { if (v !== value) onChange(v); }, 300); return () => clearTimeout(h); }, [v, value, onChange]);
  return (
    <div className="relative flex-1 min-w-[200px]">
      <label htmlFor={id} className="sr-only">{placeholder ?? 'Search'}</label>
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input id={id} type="search" className="input pl-9" value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const { t, num } = usePrefs();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-muted">
      <p>{t('Showing', 'দেখানো হচ্ছে')} {num(from)}–{num(Math.min(total, page * pageSize))} {t('of', 'এর মধ্যে')} {num(total)}</p>
      <div className="flex items-center gap-1">
        <button type="button" className="btn-icon w-9 h-9 border border-line disabled:opacity-40" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label={t('Previous page', 'আগের পৃষ্ঠা')}><ChevronLeft className="w-4 h-4" /></button>
        <span className="px-3">{num(page)} / {num(pages)}</span>
        <button type="button" className="btn-icon w-9 h-9 border border-line disabled:opacity-40" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label={t('Next page', 'পরের পৃষ্ঠা')}><ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

export function Modal({ title, onClose, children, wide, footer }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean; footer?: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('input, select, textarea, button:not([data-close])')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && ref.current) {
        const f = [...ref.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')];
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    const o = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = o; prev?.focus(); };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4 bg-black/50 animate-fade-in" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={id} className={`card w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] flex flex-col shadow-pop`}>
        <div className="flex items-center justify-between px-5 h-14 border-b border-line shrink-0"><h2 id={id} className="font-semibold">{title}</h2><button type="button" data-close className="btn-icon w-9 h-9" onClick={onClose} aria-label="Close"><X className="w-4 h-4" /></button></div>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-line flex justify-end gap-2 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

type ConfirmOpts = { title: string; body?: string; confirm?: string; danger?: boolean };
interface Ui { toast: (msg: string, kind?: 'ok' | 'err') => void; confirm: (o: ConfirmOpts) => Promise<boolean> }
const UiCtx = createContext<Ui | null>(null);
export const useUi = () => { const c = useContext(UiCtx); if (!c) throw new Error('UiProvider missing'); return c; };

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; msg: string; kind: 'ok' | 'err' }[]>([]);
  const [dlg, setDlg] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const toast = useCallback((msg: string, kind: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setDlg({ ...o, resolve })), []);
  const close = (v: boolean) => { dlg?.resolve(v); setDlg(null); };
  return (
    <UiCtx.Provider value={{ toast, confirm }}>
      {children}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[90] space-y-2" role="status" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className="flex items-center gap-3 rounded-full bg-ink text-bg px-5 py-3 text-sm shadow-pop animate-fade-up" data-testid="toast">{t.kind === 'ok' ? <CheckCircle2 className="w-5 h-5 text-success" /> : <AlertCircle className="w-5 h-5 text-sale" />}{t.msg}</div>)}
      </div>
      {dlg && (
        <Modal title={dlg.title} onClose={() => close(false)} footer={<><button type="button" className="btn btn-outline" onClick={() => close(false)}>Cancel</button><button type="button" className={`btn ${dlg.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => close(true)} data-testid="confirm-ok">{dlg.confirm ?? 'Confirm'}</button></>}>
          <p className="text-sm text-muted">{dlg.body ?? 'Are you sure?'}</p>
        </Modal>
      )}
    </UiCtx.Provider>
  );
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: [T, string][] }) {
  return (
    <div role="tablist" className="inline-flex rounded-md border border-line p-0.5 bg-surface">
      {items.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={value === k} onClick={() => onChange(k)} className={`px-3 h-8 rounded text-sm ${value === k ? 'bg-ink text-bg' : 'text-muted hover:text-ink'}`}>{l}</button>)}
    </div>
  );
}

export const METHOD_LABEL: Record<string, string> = { bkash: 'bKash', nagad: 'Nagad', card: 'Card', cod: 'Cash on delivery', bank: 'Bank transfer', sslcommerz: 'SSLCommerz', manual: 'Manual' };
export const methodLabel = (m: string) => METHOD_LABEL[m] ?? m;
/** Compact BDT axis label: 85k, 1.7L, 2.6Cr */
export const compactTaka = (v: number) => (v >= 1e7 ? `${+(v / 1e7).toFixed(1)}Cr` : v >= 1e5 ? `${+(v / 1e5).toFixed(1)}L` : v >= 1e3 ? `${Math.round(v / 1e3)}k` : String(v));
