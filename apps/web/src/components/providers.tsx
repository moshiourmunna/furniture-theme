'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { tr, type Locale } from '@/lib/i18n';

export interface CartLine {
  productId: number; variantId: number | null; qty: number;
  slug: string; nameEn: string; nameBn: string; variantEn?: string | null; variantBn?: string | null; image: string | null; price: number;
}
export interface Me { id: number; name: string; email: string | null; phone: string | null; loyaltyPoints: number; tier: string; locale: string; theme: string; marketingOptIn: boolean }
type Drawer = 'search' | 'nav' | 'bag' | null;

interface Store {
  locale: Locale; t: (en: string, bn: string) => string;
  cart: CartLine[]; addToCart: (l: CartLine, open?: boolean) => void; setQty: (productId: number, variantId: number | null, qty: number) => void; removeLine: (productId: number, variantId: number | null) => void; clearCart: () => void; cartCount: number; cartReady: boolean;
  wishlist: number[]; toggleWishlist: (id: number) => void;
  compare: number[]; toggleCompare: (id: number) => void; clearCompare: () => void;
  drawer: Drawer; setDrawer: (d: Drawer) => void;
  toast: (msg: string) => void;
  me: Me | null; meLoaded: boolean; refreshMe: () => Promise<void>;
}
const Ctx = createContext<Store | null>(null);
export const useStore = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside provider');
  return s;
};

const load = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } };
const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full/blocked */ } };

export function Providers({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const t = useMemo(() => tr(locale), [locale]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartReady, setReady] = useState(false);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [compare, setCompare] = useState<number[]>([]);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [toastMsg, setToast] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [meLoaded, setMeLoaded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // hydrate persisted client state once on mount (localStorage is unavailable during SSR)
    /* eslint-disable react-hooks/set-state-in-effect */
    setCart(load('shekor-cart', []));
    setWishlist(load('shekor-wishlist', []));
    setCompare(load('shekor-compare', []));
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  useEffect(() => { if (cartReady) save('shekor-cart', cart); }, [cart, cartReady]);
  useEffect(() => { if (cartReady) save('shekor-wishlist', wishlist); }, [wishlist, cartReady]);
  useEffect(() => { if (cartReady) save('shekor-compare', compare); }, [compare, cartReady]);

  const toast = useCallback((msg: string) => {
    setToast(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const r = await api<{ user: Me | null }>('/auth/me');
      setMe(r.user);
      if (r.user) {
        // merge guest wishlist into the account, then use the server list
        const local = load<number[]>('shekor-wishlist', []);
        if (local.length) await api('/account/wishlist', { body: { productIds: local } }).catch(() => {});
        const w = await api<{ items: { id: number }[] }>('/account/wishlist');
        setWishlist(w.items.map((i) => i.id));
      }
    } catch { setMe(null); } finally { setMeLoaded(true); }
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refreshMe(); }, [refreshMe]);

  const addToCart = useCallback((l: CartLine, open = true) => {
    setCart((c) => {
      const i = c.findIndex((x) => x.productId === l.productId && x.variantId === l.variantId);
      if (i >= 0) { const n = [...c]; n[i] = { ...n[i], qty: Math.min(20, n[i].qty + l.qty) }; return n; }
      return [...c, l];
    });
    // the opened bag drawer is the confirmation; a toast on top of it would cover the first line on mobile
    if (open) setDrawer('bag');
    else toast(t('Added to bag', 'ব্যাগে যোগ হয়েছে'));
  }, [t, toast]);
  const setQty = useCallback((p: number, v: number | null, q: number) => setCart((c) => c.map((x) => (x.productId === p && x.variantId === v ? { ...x, qty: Math.max(1, Math.min(20, q)) } : x))), []);
  const removeLine = useCallback((p: number, v: number | null) => setCart((c) => c.filter((x) => !(x.productId === p && x.variantId === v))), []);
  const clearCart = useCallback(() => { setCart([]); save('shekor-cart', []); }, []);

  const toggleWishlist = useCallback((id: number) => {
    setWishlist((w) => {
      const has = w.includes(id);
      if (me) void api(has ? `/account/wishlist?productId=${id}` : '/account/wishlist', has ? { method: 'DELETE' } : { body: { productIds: [id] } }).catch(() => {});
      toast(has ? t('Removed from wishlist', 'উইশলিস্ট থেকে সরানো হয়েছে') : t('Saved to wishlist', 'উইশলিস্টে রাখা হয়েছে'));
      return has ? w.filter((x) => x !== id) : [...w, id];
    });
  }, [me, t, toast]);
  const toggleCompare = useCallback((id: number) => {
    setCompare((c) => {
      if (c.includes(id)) return c.filter((x) => x !== id);
      if (c.length >= 4) { toast(t('You can compare up to 4 pieces', 'সর্বোচ্চ ৪টি পিস তুলনা করা যায়')); return c; }
      toast(t('Added to compare', 'তুলনায় যোগ হয়েছে'));
      return [...c, id];
    });
  }, [t, toast]);

  const value: Store = {
    locale, t, cart, addToCart, setQty, removeLine, clearCart, cartCount: cart.reduce((a, l) => a + l.qty, 0), cartReady,
    wishlist, toggleWishlist, compare, toggleCompare, clearCompare: () => setCompare([]), drawer, setDrawer, toast, me, meLoaded, refreshMe,
  };
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[70] pointer-events-none" role="status" aria-live="polite">
        {toastMsg && <div className="flex items-center gap-3 bg-ink text-bg px-6 py-3.5 text-[13px] shadow-pop animate-fade-up" data-testid="toast">{toastMsg}</div>}
      </div>
    </Ctx.Provider>
  );
}
