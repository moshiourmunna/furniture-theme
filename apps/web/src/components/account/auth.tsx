'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { api, ApiClientError } from '@/lib/api';
import { lp } from '@/lib/i18n';
import { useStore } from '../providers';

/** Only allow same-site relative redirects. */
export function safeNext(next: string | null, fallback: string) {
  return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : fallback;
}

function Field({ id, label, error, hint, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; error?: string; hint?: string }) {
  const [show, setShow] = useState(false);
  const pw = rest.type === 'password';
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="relative">
        <input id={id} name={id} className={`input ${pw ? 'pr-11' : ''}`} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined} {...rest} type={pw && show ? 'text' : rest.type} />
        {pw && <button type="button" className="absolute right-0 top-0 h-full w-11 grid place-items-center text-muted" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}
      </div>
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-muted mt-1">{hint}</p>}
      {error && <p id={`${id}-err`} className="text-xs text-sale mt-1" role="alert">{error}</p>}
    </div>
  );
}

function Shell({ title, sub, children }: { title: string; sub?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="container py-12 md:py-20">
      <div className="max-w-md mx-auto">
        <h1 className="h-display text-4xl md:text-5xl">{title}</h1>
        {sub && <p className="text-muted mt-3">{sub}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

const fieldErrors = (e: unknown): Record<string, string> => {
  const x = e as ApiClientError;
  return x?.fields ? Object.fromEntries(Object.entries(x.fields).map(([k, v]) => [k, String(v)])) : {};
};

function OtpStep({ target, purpose, devOtp, onDone }: { target: string; purpose: 'login' | 'verify'; devOtp?: string; onDone: () => void }) {
  const { t, refreshMe } = useStore();
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [dev, setDev] = useState(devOtp);
  const [resent, setResent] = useState(false);
  return (
    <form className="space-y-4" data-testid="otp-form" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setErr('');
      try { await api('/auth/otp/verify', { body: { target, purpose, code } }); await refreshMe(); onDone(); }
      catch (x) { setErr((x as Error).message); setBusy(false); }
    }}>
      <p className="text-sm">{t(`We sent a 6-digit code to ${target}.`, `${target}-এ ৬ সংখ্যার কোড পাঠানো হয়েছে।`)}</p>
      {dev && <p className="text-xs bg-surface-2 p-3" data-testid="dev-otp">{t('Development mode — your code is', 'ডেভেলপমেন্ট মোড — আপনার কোড')} <strong>{dev}</strong></p>}
      <Field id="otp" label={t('Verification code', 'যাচাই কোড')} inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="\d{6}" required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} error={err} />
      <button type="submit" className="btn btn-primary w-full" disabled={busy || code.length !== 6} data-testid="otp-submit">{t('Verify', 'যাচাই করুন')}</button>
      <button type="button" className="text-sm link" disabled={resent} onClick={async () => {
        try { const r = await api<{ devOtp?: string }>('/auth/otp/request', { body: { target, purpose } }); setDev(r.devOtp); setResent(true); } catch (x) { setErr((x as Error).message); }
      }}>{resent ? t('Code sent again', 'আবার কোড পাঠানো হয়েছে') : t('Resend code', 'আবার কোড পাঠান')}</button>
    </form>
  );
}

export function LoginPage() {
  const { t, locale, refreshMe } = useStore();
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'), lp(locale, '/account'));
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [otp, setOtp] = useState<{ target: string; devOtp?: string } | null>(null);
  const done = () => { router.replace(next); router.refresh(); };
  return (
    <Shell title={t('Welcome back', 'আবার স্বাগতম')} sub={<>{t('New to Shekor?', 'শেকড়ে নতুন?')} <Link className="link" href={lp(locale, `/register?next=${encodeURIComponent(next)}`)}>{t('Create an account', 'অ্যাকাউন্ট খুলুন')}</Link></>}>
      <div role="tablist" className="grid grid-cols-2 border border-line mb-6">
        {(['password', 'otp'] as const).map((m) => <button key={m} type="button" role="tab" aria-selected={mode === m} className={`h-11 text-sm ${mode === m ? 'bg-ink text-bg' : ''}`} onClick={() => { setMode(m); setErr(''); setOtp(null); }} data-testid={`login-tab-${m}`}>{m === 'password' ? t('Password', 'পাসওয়ার্ড') : t('One-time code', 'ওটিপি কোড')}</button>)}
      </div>
      {mode === 'password' ? (
        <form className="space-y-4" data-testid="login-form" onSubmit={async (e) => {
          e.preventDefault(); setBusy(true); setErr('');
          try { await api('/auth/login', { body: { identifier: id, password: pw } }); await refreshMe(); done(); }
          catch (x) { setErr((x as Error).message); setBusy(false); }
        }}>
          <Field id="identifier" label={t('Email or mobile number', 'ইমেইল বা মোবাইল নম্বর')} autoComplete="username" required value={id} onChange={(e) => setId(e.target.value)} />
          <Field id="password" type="password" label={t('Password', 'পাসওয়ার্ড')} autoComplete="current-password" required value={pw} onChange={(e) => setPw(e.target.value)} />
          {err && <p className="text-sm text-sale" role="alert" data-testid="login-error">{err}</p>}
          <div className="flex justify-end"><Link className="text-sm link" href={lp(locale, '/forgot')}>{t('Forgot password?', 'পাসওয়ার্ড ভুলে গেছেন?')}</Link></div>
          <button type="submit" className="btn btn-primary w-full" disabled={busy} data-testid="login-submit">{busy ? t('Signing in…', 'সাইন ইন হচ্ছে…') : t('Sign in', 'সাইন ইন')}</button>
        </form>
      ) : otp ? <OtpStep target={otp.target} purpose="login" devOtp={otp.devOtp} onDone={done} /> : (
        <form className="space-y-4" data-testid="otp-request-form" onSubmit={async (e) => {
          e.preventDefault(); setBusy(true); setErr('');
          try { const r = await api<{ target: string; devOtp?: string }>('/auth/otp/request', { body: { target: id, purpose: 'login' } }); setOtp(r); }
          catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
        }}>
          <Field id="otp-target" label={t('Mobile number or email', 'মোবাইল নম্বর বা ইমেইল')} autoComplete="username" required value={id} onChange={(e) => setId(e.target.value)} />
          {err && <p className="text-sm text-sale" role="alert">{err}</p>}
          <button type="submit" className="btn btn-primary w-full" disabled={busy} data-testid="otp-request">{t('Send code', 'কোড পাঠান')}</button>
        </form>
      )}
    </Shell>
  );
}

export function RegisterPage() {
  const { t, locale } = useStore();
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'), lp(locale, '/account'));
  const [f, setF] = useState({ name: '', phone: '', email: '', password: '', marketingOptIn: false });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [verify, setVerify] = useState<{ target: string; devOtp?: string } | null>(null);
  if (verify) return <Shell title={t('Verify your number', 'নম্বর যাচাই করুন')}><OtpStep target={verify.target} purpose="verify" devOtp={verify.devOtp} onDone={() => { router.replace(next); router.refresh(); }} /></Shell>;
  return (
    <Shell title={t('Create your account', 'অ্যাকাউন্ট খুলুন')} sub={<>{t('Already have one?', 'আগে থেকেই আছে?')} <Link className="link" href={lp(locale, '/login')}>{t('Sign in', 'সাইন ইন')}</Link></>}>
      <form className="space-y-4" noValidate data-testid="register-form" onSubmit={async (e) => {
        e.preventDefault();
        const v: Record<string, string> = {};
        if (f.name.trim().length < 2) v.name = t('Enter your name', 'নাম লিখুন');
        if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(f.phone.replace(/[\s-]/g, ''))) v.phone = t('Enter a valid Bangladeshi mobile number', 'সঠিক মোবাইল নম্বর দিন');
        if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) v.email = t('Enter a valid email', 'সঠিক ইমেইল দিন');
        if (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) v.password = t('At least 8 characters with a letter and a number', 'কমপক্ষে ৮ অক্ষর, একটি অক্ষর ও একটি সংখ্যাসহ');
        setErrs(v);
        if (Object.keys(v).length) { document.getElementById(Object.keys(v)[0])?.focus(); return; }
        setBusy(true);
        try { setVerify(await api<{ target: string; devOtp?: string }>('/auth/register', { body: f })); }
        catch (x) { setErrs({ ...fieldErrors(x), _form: (x as Error).message }); setBusy(false); }
      }}>
        <Field id="name" label={t('Full name', 'পুরো নাম')} autoComplete="name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={errs.name} />
        <Field id="phone" label={t('Mobile number', 'মোবাইল নম্বর')} autoComplete="tel" inputMode="tel" placeholder="01XXXXXXXXX" required value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} error={errs.phone} />
        <Field id="email" type="email" label={t('Email (optional)', 'ইমেইল (ঐচ্ছিক)')} autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} error={errs.email} />
        <Field id="password" type="password" label={t('Password', 'পাসওয়ার্ড')} autoComplete="new-password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} error={errs.password} hint={t('At least 8 characters, with a letter and a number', 'কমপক্ষে ৮ অক্ষর, অক্ষর ও সংখ্যাসহ')} />
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5 w-4 h-4 accent-[rgb(var(--primary))]" checked={f.marketingOptIn} onChange={(e) => setF({ ...f, marketingOptIn: e.target.checked })} />{t('Send me new collections and showroom events (optional)', 'নতুন কালেকশন ও শোরুম ইভেন্টের খবর পাঠান (ঐচ্ছিক)')}</label>
        {errs._form && <p className="text-sm text-sale" role="alert" data-testid="register-error">{errs._form}</p>}
        <button type="submit" className="btn btn-primary w-full" disabled={busy} data-testid="register-submit">{t('Create account', 'অ্যাকাউন্ট খুলুন')}</button>
        <p className="text-xs text-muted">{t('By creating an account you agree to our', 'অ্যাকাউন্ট খুলে আপনি সম্মত হচ্ছেন আমাদের')} <Link className="link" href={lp(locale, '/policy/terms')}>{t('terms', 'শর্তাবলি')}</Link> {t('and', 'ও')} <Link className="link" href={lp(locale, '/policy/privacy')}>{t('privacy policy', 'গোপনীয়তা নীতিতে')}</Link>.</p>
      </form>
    </Shell>
  );
}

export function ForgotPage() {
  const { t, locale } = useStore();
  const [target, setTarget] = useState('');
  const [stage, setStage] = useState<'ask' | 'reset' | 'done'>('ask');
  const [dev, setDev] = useState<string>();
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (stage === 'done') return <Shell title={t('Password updated', 'পাসওয়ার্ড আপডেট হয়েছে')} sub={t('You’ve been signed out everywhere. Sign in with your new password.', 'সব জায়গা থেকে সাইন আউট করা হয়েছে। নতুন পাসওয়ার্ড দিয়ে সাইন ইন করুন।')}><Link className="btn btn-primary w-full" href={lp(locale, '/login')} data-testid="reset-done">{t('Sign in', 'সাইন ইন')}</Link></Shell>;
  return (
    <Shell title={t('Reset your password', 'পাসওয়ার্ড রিসেট')} sub={t('We’ll send a 6-digit code to your mobile or email.', 'আপনার মোবাইল বা ইমেইলে ৬ সংখ্যার কোড পাঠাব।')}>
      {stage === 'ask' ? (
        <form className="space-y-4" data-testid="forgot-form" onSubmit={async (e) => {
          e.preventDefault(); setBusy(true); setErr('');
          try { const r = await api<{ target: string; devOtp?: string }>('/auth/otp/request', { body: { target, purpose: 'reset' } }); setTarget(r.target); setDev(r.devOtp); setStage('reset'); }
          catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
        }}>
          <Field id="target" label={t('Mobile number or email', 'মোবাইল নম্বর বা ইমেইল')} autoComplete="username" required value={target} onChange={(e) => setTarget(e.target.value)} error={err} />
          <button type="submit" className="btn btn-primary w-full" disabled={busy} data-testid="forgot-submit">{t('Send code', 'কোড পাঠান')}</button>
        </form>
      ) : (
        <form className="space-y-4" data-testid="reset-form" onSubmit={async (e) => {
          e.preventDefault(); setBusy(true); setErr('');
          try { await api('/auth/password/reset', { body: { target, code, password: pw } }); setStage('done'); }
          catch (x) { setErr((x as Error).message); setBusy(false); }
        }}>
          <p className="text-sm">{t(`If an account exists for ${target}, a code is on its way.`, `${target}-এর অ্যাকাউন্ট থাকলে কোড পাঠানো হয়েছে।`)}</p>
          {dev && <p className="text-xs bg-surface-2 p-3" data-testid="dev-otp">{t('Development mode — your code is', 'ডেভেলপমেন্ট মোড — আপনার কোড')} <strong>{dev}</strong></p>}
          <Field id="code" label={t('Code', 'কোড')} inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
          <Field id="new-password" type="password" label={t('New password', 'নতুন পাসওয়ার্ড')} autoComplete="new-password" required value={pw} onChange={(e) => setPw(e.target.value)} hint={t('At least 8 characters, with a letter and a number', 'কমপক্ষে ৮ অক্ষর, অক্ষর ও সংখ্যাসহ')} />
          {err && <p className="text-sm text-sale" role="alert">{err}</p>}
          <button type="submit" className="btn btn-primary w-full" disabled={busy || code.length !== 6} data-testid="reset-submit">{t('Update password', 'পাসওয়ার্ড আপডেট')}</button>
        </form>
      )}
    </Shell>
  );
}
