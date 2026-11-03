import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Award, BarChart3, BookOpen, Briefcase, Building2, CalendarCheck, ExternalLink, FileText, FolderTree, Image, Images, Languages, Layers, LayoutDashboard,
  LogOut, Mail, Menu, MessageSquare, Moon, Newspaper, Package, PenTool, Ruler, ScrollText, Settings, ShieldCheck, ShoppingBag, Star, Store, Sun, TicketPercent, Truck, Users, Warehouse, X, HelpCircle, Tags, Gem, DoorOpen, Send,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { usePrefs } from '@/lib/prefs';
import { api } from '@/lib/api';

type Item = { to: string; en: string; bn: string; icon: React.ComponentType<{ className?: string }>; perm: string; badge?: 'orders' | 'reviews' | 'quotes' };
export const NAV: { en: string; bn: string; items: Item[] }[] = [
  { en: 'Overview', bn: 'ওভারভিউ', items: [
    { to: '/', en: 'Dashboard', bn: 'ড্যাশবোর্ড', icon: LayoutDashboard, perm: 'dashboard.read' },
    { to: '/reports', en: 'Reports', bn: 'রিপোর্ট', icon: BarChart3, perm: 'reports.read' },
  ] },
  { en: 'Sales', bn: 'বিক্রয়', items: [
    { to: '/orders', en: 'Orders', bn: 'অর্ডার', icon: ShoppingBag, perm: 'orders.read', badge: 'orders' },
    { to: '/r/quotes', en: 'Quotes & custom', bn: 'কোটেশন ও কাস্টম', icon: Ruler, perm: 'leads.read', badge: 'quotes' },
    { to: '/r/consultations', en: 'Consultations', bn: 'পরামর্শ বুকিং', icon: CalendarCheck, perm: 'leads.read' },
    { to: '/customers', en: 'Customers', bn: 'গ্রাহক', icon: Users, perm: 'customers.read' },
  ] },
  { en: 'Catalog', bn: 'ক্যাটালগ', items: [
    { to: '/products', en: 'Products', bn: 'পণ্য', icon: Package, perm: 'products.read' },
    { to: '/r/categories', en: 'Categories', bn: 'ক্যাটাগরি', icon: FolderTree, perm: 'catalog.read' },
    { to: '/r/rooms', en: 'Rooms', bn: 'রুম', icon: DoorOpen, perm: 'catalog.read' },
    { to: '/r/materials', en: 'Materials', bn: 'উপাদান', icon: Gem, perm: 'catalog.read' },
    { to: '/inventory', en: 'Inventory', bn: 'ইনভেন্টরি', icon: Warehouse, perm: 'inventory.read' },
    { to: '/r/reviews', en: 'Reviews', bn: 'রিভিউ', icon: Star, perm: 'reviews.read', badge: 'reviews' },
  ] },
  { en: 'Brand & content', bn: 'ব্র্যান্ড ও কনটেন্ট', items: [
    { to: '/r/collections', en: 'Collections', bn: 'কালেকশন', icon: Layers, perm: 'catalog.read' },
    { to: '/r/brands', en: 'Brands & partners', bn: 'ব্র্যান্ড ও পার্টনার', icon: Award, perm: 'catalog.read' },
    { to: '/r/projects', en: 'Projects', bn: 'প্রজেক্ট', icon: Building2, perm: 'showcase.read' },
    { to: '/r/designers', en: 'Studio & designers', bn: 'স্টুডিও ও ডিজাইনার', icon: PenTool, perm: 'catalog.read' },
    { to: '/r/gallery', en: 'Gallery', bn: 'গ্যালারি', icon: Images, perm: 'showcase.read' },
    { to: '/r/catalogues', en: 'Catalogues', bn: 'ক্যাটালগ বই', icon: BookOpen, perm: 'showcase.read' },
    { to: '/r/catalogue-requests', en: 'Catalogue requests', bn: 'ক্যাটালগ অনুরোধ', icon: Send, perm: 'leads.read' },
    { to: '/r/trade-inquiries', en: 'Trade inquiries', bn: 'ট্রেড অনুসন্ধান', icon: Briefcase, perm: 'leads.read' },
    { to: '/r/contact-messages', en: 'Messages', bn: 'বার্তা', icon: MessageSquare, perm: 'leads.read' },
  ] },
  { en: 'Marketing & CMS', bn: 'মার্কেটিং ও CMS', items: [
    { to: '/r/coupons', en: 'Coupons', bn: 'কুপন', icon: TicketPercent, perm: 'marketing.read' },
    { to: '/r/newsletter', en: 'Newsletter', bn: 'নিউজলেটার', icon: Mail, perm: 'marketing.read' },
    { to: '/r/banners', en: 'Banners', bn: 'ব্যানার', icon: Image, perm: 'content.read' },
    { to: '/r/pages', en: 'Pages', bn: 'পেজ', icon: FileText, perm: 'content.read' },
    { to: '/r/blog', en: 'Journal', bn: 'জার্নাল', icon: Newspaper, perm: 'content.read' },
    { to: '/r/faqs', en: 'FAQs', bn: 'প্রশ্নোত্তর', icon: HelpCircle, perm: 'content.read' },
  ] },
  { en: 'Operations', bn: 'অপারেশন', items: [
    { to: '/r/showrooms', en: 'Showrooms', bn: 'শোরুম', icon: Store, perm: 'showrooms.read' },
    { to: '/r/delivery-zones', en: 'Delivery zones', bn: 'ডেলিভারি জোন', icon: Truck, perm: 'delivery.read' },
  ] },
  { en: 'System', bn: 'সিস্টেম', items: [
    { to: '/staff', en: 'Staff & roles', bn: 'স্টাফ ও রোল', icon: ShieldCheck, perm: 'staff.read' },
    { to: '/settings', en: 'Settings', bn: 'সেটিংস', icon: Settings, perm: 'settings.read' },
    { to: '/audit', en: 'Audit log', bn: 'অডিট লগ', icon: ScrollText, perm: 'audit.read' },
    { to: '/media-library', en: 'Media library', bn: 'মিডিয়া', icon: Tags, perm: 'media.write' },
  ] },
];

export const STORE_URL = (import.meta.env.VITE_STORE_URL as string | undefined) ?? 'http://localhost:3000';

export function Layout() {
  const { user, can, logout } = useAuth();
  const { t, lang, setLang, dark, toggleDark } = usePrefs();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  const [path, setPath] = useState(loc.pathname);
  if (path !== loc.pathname) { setPath(loc.pathname); setOpen(false); }
  const dash = useQuery({ queryKey: ['dashboard', 30], queryFn: () => api<{ kpis: { pendingOrders: number; reviewsPending: number; openLeads: number } }>('/admin/dashboard?range=30'), enabled: can('dashboard.read'), staleTime: 60_000 });
  const badges = { orders: dash.data?.kpis.pendingOrders, reviews: dash.data?.kpis.reviewsPending, quotes: dash.data?.kpis.openLeads };
  if (!user) return null;
  const initials = user.name.split(' ').map((s) => s[0]).slice(0, 2).join('');
  return (
    <>
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-deep text-white flex flex-col transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`} aria-label={t('Admin navigation', 'অ্যাডমিন নেভিগেশন')}>
        <div className="h-16 flex items-center gap-2 px-5 border-b border-white/10 shrink-0">
          <img src="/shekor-horizontal-dark.svg" alt="Shekor" width={125} height={40} className="h-9 w-auto" />
          <span className="text-[10px] font-bold uppercase tracking-wider rounded bg-teak text-forest-900 px-1.5 py-0.5">Admin</span>
          <button type="button" className="ml-auto lg:hidden btn-icon w-9 h-9 text-white hover:bg-white/10" onClick={() => setOpen(false)} aria-label={t('Close navigation', 'নেভিগেশন বন্ধ')}><X className="w-4 h-4" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-6" aria-label="Admin">
          {NAV.map((g) => {
            const items = g.items.filter((i) => can(i.perm));
            if (!items.length) return null;
            return (
              <div key={g.en}>
                <p className="px-3 mt-6 mb-2 text-[11px] font-semibold uppercase tracking-wider text-forest-200/80">{t(g.en, g.bn)}</p>
                <ul className="space-y-0.5">{items.map((i) => (
                  <li key={i.to}><NavLink to={i.to} end={i.to === '/'} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-white/10 text-white font-semibold' : 'text-forest-100/80 hover:bg-white/5 hover:text-white'}`}>
                    <i.icon className="w-[18px] h-[18px]" /><span className="flex-1">{t(i.en, i.bn)}</span>
                    {i.badge && !!badges[i.badge] && <span className="text-[10px] font-bold rounded-full bg-teak text-forest-900 px-1.5">{badges[i.badge]}</span>}
                  </NavLink></li>
                ))}</ul>
              </div>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 flex items-center gap-3 shrink-0">
          <span className="w-9 h-9 rounded-full bg-teak text-forest-900 grid place-items-center font-semibold text-sm">{initials}</span>
          <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate" data-testid="admin-user">{user.name}</p><p className="text-xs text-forest-100/60 truncate">{user.role}</p></div>
          <button type="button" className="btn-icon w-9 h-9 text-forest-100 hover:bg-white/10" onClick={async () => { await logout(); nav('/login'); }} aria-label={t('Sign out', 'সাইন আউট')} data-testid="admin-logout"><LogOut className="w-4 h-4" /></button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
      <div className="lg:pl-64 min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 h-16 bg-surface/90 backdrop-blur border-b border-line flex items-center gap-2 px-4 lg:px-8">
          <button type="button" className="btn-icon lg:hidden -ml-2" onClick={() => setOpen(true)} aria-label={t('Open navigation', 'নেভিগেশন খুলুন')} data-testid="admin-menu"><Menu className="w-5 h-5" /></button>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-1">
            <a href={STORE_URL} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm max-md:hidden"><ExternalLink className="w-4 h-4" />{t('View store', 'স্টোর দেখুন')}</a>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLang(lang === 'en' ? 'bn' : 'en')} data-testid="admin-lang"><Languages className="w-4 h-4" />{lang === 'en' ? 'বাংলা' : 'English'}</button>
            <button type="button" className="btn-icon" onClick={toggleDark} aria-label={t('Toggle dark mode', 'ডার্ক মোড')} aria-pressed={dark} data-testid="admin-theme">{dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
          </div>
        </header>
        <main id="main" className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-[1600px] w-full"><Outlet /></main>
      </div>
    </>
  );
}

function GlobalSearch() {
  const { t } = usePrefs();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  useEffect(() => {
    const on = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); document.getElementById('admin-search')?.focus(); } };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, []);
  return (
    <form role="search" className="relative flex-1 max-w-md" onSubmit={(e) => { e.preventDefault(); const s = q.trim(); if (!s) return; nav(/^SHK-?\d/i.test(s) || /^01\d{6,}/.test(s) ? `/orders?q=${encodeURIComponent(s)}` : `/products?q=${encodeURIComponent(s)}`); }}>
      <label htmlFor="admin-search" className="sr-only">{t('Search', 'খুঁজুন')}</label>
      <input id="admin-search" type="search" className="input bg-bg pr-14" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Search orders (SHK-…, phone) or products…', 'অর্ডার বা পণ্য খুঁজুন…')} />
      <kbd className="kbd absolute right-3 top-1/2 -translate-y-1/2 max-sm:hidden">Ctrl K</kbd>
    </form>
  );
}

export function NoAccess() {
  const { t } = usePrefs();
  return <div className="card p-10 text-center"><h1 className="text-xl font-semibold">{t('You don’t have access to this page', 'এই পাতায় আপনার অনুমতি নেই')}</h1><p className="text-muted mt-2 text-sm">{t('Ask a Super Admin to update your role.', 'রোল আপডেটের জন্য সুপার অ্যাডমিনকে বলুন।')}</p><Link to="/" className="btn btn-outline mt-6">{t('Back to dashboard', 'ড্যাশবোর্ডে ফিরুন')}</Link></div>;
}
