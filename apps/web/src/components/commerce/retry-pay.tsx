'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useStore } from '../providers';

export function RetryPayment({ orderNo, token }: { orderNo: string; token: string }) {
  const { t } = useStore();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <div>
      <button type="button" className="btn btn-primary" disabled={busy} data-testid="retry-payment" onClick={async () => {
        setBusy(true); setErr('');
        try { const r = await api<{ redirectUrl: string }>('/payments/retry', { body: { orderNo, token } }); window.location.assign(r.redirectUrl); }
        catch (e) { setErr((e as Error).message); setBusy(false); }
      }}>{t('Try payment again', 'আবার পেমেন্ট করুন')}</button>
      {err && <p className="text-sm text-sale mt-2" role="alert">{err}</p>}
    </div>
  );
}

