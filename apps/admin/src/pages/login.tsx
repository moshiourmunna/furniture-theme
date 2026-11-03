import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Languages, Moon, Sun } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { usePrefs } from '@/lib/prefs';

const schema = z.object({ identifier: z.string().trim().min(3, 'Enter your staff email'), password: z.string().min(1, 'Enter your password') });

export function Login() {
  const { user } = useAuth();
  const { t, lang, setLang, dark, toggleDark } = usePrefs();
  const qc = useQueryClient();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [show, setShow] = useState(false);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const next = sp.get('next')?.startsWith('/') && !sp.get('next')?.startsWith('//') ? sp.get('next')! : '/';
  if (user) return <Navigate to={next} replace />;
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:block relative bg-deep">
        <img src="/media/img/hero-1.webp" alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-deep via-deep/40 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white"><img src="/shekor-horizontal-dark.svg" alt="Shekor" className="h-12 w-auto mb-6" /><p className="h-display text-4xl">{t('Rooted in craft. Run with care.', 'শেকড়ে কারুকাজ। যত্নে পরিচালনা।')}</p></div>
      </div>
      <main id="main" className="flex flex-col p-6 sm:p-12">
        <div className="flex justify-end gap-1">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}><Languages className="w-4 h-4" />{lang === 'en' ? 'বাংলা' : 'English'}</button>
          <button type="button" className="btn-icon" onClick={toggleDark} aria-label={t('Toggle dark mode', 'ডার্ক মোড')}>{dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
        </div>
        <div className="flex-1 grid place-items-center">
          <form className="w-full max-w-sm space-y-5" noValidate data-testid="admin-login" onSubmit={handleSubmit(async (d) => {
            try { await api('/admin/auth/login', { body: d }); await qc.invalidateQueries({ queryKey: ['me'] }); nav(next, { replace: true }); }
            catch (e) { setError('root', { message: (e as Error).message }); }
          })}>
            <div><img src="/shekor-horizontal-light.svg" alt="Shekor" className="h-10 w-auto lg:hidden mb-6 dark:hidden" /><h1 className="text-2xl font-semibold">{t('Sign in to admin', 'অ্যাডমিনে সাইন ইন')}</h1><p className="text-sm text-muted mt-1">{t('Use your staff email and password.', 'আপনার স্টাফ ইমেইল ও পাসওয়ার্ড ব্যবহার করুন।')}</p></div>
            <div><label htmlFor="identifier" className="label">{t('Email', 'ইমেইল')}</label><input id="identifier" type="email" autoComplete="username" className="input" aria-invalid={!!errors.identifier} {...register('identifier')} />{errors.identifier && <p className="err">{errors.identifier.message}</p>}</div>
            <div><label htmlFor="password" className="label">{t('Password', 'পাসওয়ার্ড')}</label><div className="relative"><input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" className="input pr-10" aria-invalid={!!errors.password} {...register('password')} /><button type="button" className="absolute right-0 top-0 h-10 w-10 grid place-items-center text-muted" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>{errors.password && <p className="err">{errors.password.message}</p>}</div>
            {errors.root && <p className="text-sm text-sale" role="alert" data-testid="admin-login-error">{errors.root.message}</p>}
            <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting} data-testid="admin-login-submit">{isSubmitting ? t('Signing in…', 'সাইন ইন হচ্ছে…') : t('Sign in', 'সাইন ইন')}</button>
            <p className="text-xs text-muted">{t('Sessions expire after inactivity. All actions are recorded in the audit log.', 'নিষ্ক্রিয়তায় সেশন শেষ হয়। সব কাজ অডিট লগে থাকে।')}</p>
          </form>
        </div>
      </main>
    </div>
  );
}
