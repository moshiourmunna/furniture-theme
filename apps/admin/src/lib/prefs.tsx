import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { formatDate, formatNumber, formatPrice } from '@shekor/shared';

type Lang = 'en' | 'bn';
interface Prefs { lang: Lang; setLang: (l: Lang) => void; dark: boolean; toggleDark: () => void; t: (en: string, bn: string) => string; money: (n: number) => string; num: (n: number) => string; date: (d: string | Date, time?: boolean) => string }
const Ctx = createContext<Prefs | null>(null);
export const usePrefs = () => { const c = useContext(Ctx); if (!c) throw new Error('PrefsProvider missing'); return c; };

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('shekor-admin-lang') === 'bn' ? 'bn' : 'en'));
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.classList.toggle('lang-bn', lang === 'bn');
  }, [lang]);
  const setLang = useCallback((l: Lang) => { setLangState(l); try { localStorage.setItem('shekor-admin-lang', l); } catch { /* ignore */ } }, []);
  const toggleDark = useCallback(() => setDark((d) => {
    const n = !d;
    document.documentElement.classList.toggle('dark', n);
    try { localStorage.setItem('shekor-admin-theme', n ? 'dark' : 'light'); } catch { /* ignore */ }
    return n;
  }), []);
  const t = useCallback((en: string, bn: string) => (lang === 'bn' ? bn : en), [lang]);
  const value: Prefs = {
    lang, setLang, dark, toggleDark, t,
    money: (n) => formatPrice(n, lang), num: (n) => formatNumber(n, lang),
    date: (d, time) => formatDate(d, lang, time),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
