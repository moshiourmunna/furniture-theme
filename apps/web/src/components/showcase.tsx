import Link from 'next/link';
import { lp, num, pf, tr, type Locale } from '@/lib/i18n';
import { Figure } from './ui';

export const PROJECT_TYPES: [string, string, string][] = [['residential', 'Residential', 'আবাসিক'], ['hospitality', 'Hospitality', 'হসপিটালিটি'], ['corporate', 'Corporate', 'কর্পোরেট'], ['retail', 'Retail', 'রিটেইল']];
export const projectType = (locale: Locale, type: string) => { const p = PROJECT_TYPES.find((x) => x[0] === type); return p ? (locale === 'bn' ? p[2] : p[1]) : type; };

type Coll = { slug: string; nameEn: string; nameBn: string; introEn: string | null; introBn: string | null; year: string | null; heroImage: string | null; brand?: { nameEn: string; nameBn: string } | null };
export function CollectionCard({ c, locale, ratio = 'aspect-[4/5]', big }: { c: Coll; locale: Locale; ratio?: string; big?: boolean }) {
  const f = pf(locale);
  const t = tr(locale);
  return (
    <Link href={lp(locale, `/collections/${c.slug}`)} className="group block" data-reveal data-testid="collection-card">
      <Figure src={c.heroImage ?? '/media/img/hero-1.webp'} alt={`${f(c, 'name')} ${t('collection', 'কালেকশন')}`} ratio={ratio} sizes="(min-width:1024px) 50vw, 90vw" />
      <div className="mt-5 flex items-baseline justify-between gap-4">
        <h3 className={`h-display ${big ? 'text-4xl' : 'text-3xl'}`}>{f(c, 'name')}</h3>
        <span className="label-sm text-muted">{c.brand ? f(c.brand, 'name') : ''}{c.year ? <> · {num(locale, c.year)}</> : null}</span>
      </div>
      <p className="text-muted mt-2 max-w-md text-[15px] leading-relaxed line-clamp-3">{f(c, 'intro')}</p>
    </Link>
  );
}

type Proj = { slug: string; titleEn: string; titleBn: string; type: string; cityEn: string | null; cityBn: string | null; heroImage: string | null };
export function ProjectCard({ p, locale, ratio = 'aspect-[4/3]', dark }: { p: Proj; locale: Locale; ratio?: string; dark?: boolean }) {
  const f = pf(locale);
  return (
    <Link href={lp(locale, `/projects/${p.slug}`)} className="group block" data-reveal data-testid="project-card">
      <Figure src={p.heroImage ?? '/media/img/hero-2.webp'} alt={f(p, 'title')} ratio={ratio} sizes="(min-width:1024px) 33vw, 90vw" />
      <p className={`label-sm mt-5 ${dark ? 'text-white/70' : 'text-muted'}`}>{projectType(locale, p.type)} · {f(p, 'city')}</p>
      <h3 className="h-display text-2xl md:text-3xl mt-2">{f(p, 'title')}</h3>
    </Link>
  );
}

export function MaterialList({ locale }: { locale: Locale }) {
  const t = tr(locale);
  const mats: [string, string, string, string, string][] = [
    ['Segun (Teak)', 'সেগুন', '#8a5a3c', 'Seasoned 18 months; golden, oily, monsoon-proof.', '১৮ মাস শুকানো; সোনালি, তৈলাক্ত, বর্ষা-সহনশীল।'],
    ['Mahogany', 'মেহগনি', '#5b3a29', 'Deep red grain, ideal for carving.', 'গাঢ় লাল আঁশ, খোদাইয়ের জন্য আদর্শ।'],
    ['Gorjon', 'গর্জন', '#a57a52', 'Stable, straight-grained; for almirahs.', 'স্থিতিশীল, সোজা আঁশ; আলমারির জন্য।'],
    ['Cane & bamboo', 'বেত ও বাঁশ', '#c8a27a', 'Hand-woven by Sylhet artisans.', 'সিলেটের কারিগরদের হাতে বোনা।'],
    ['Handloom linen', 'তাঁতের লিনেন', '#b8b2a7', 'Woven in Tangail; breathable.', 'টাঙ্গাইলে বোনা; বাতাস চলাচল করে।'],
  ];
  return (
    <ul className="grid sm:grid-cols-2 lg:grid-cols-5 border-t border-line">
      {mats.map(([a, b, c, d, e]) => (
        <li key={a} className="py-6 lg:px-6 lg:first:pl-0 border-b border-line lg:border-b-0 lg:border-r last:border-r-0" data-reveal>
          <span className="block w-10 h-10 rounded-full" style={{ background: c }} />
          <p className="h-serif text-xl mt-4">{t(a, b)}</p><p className="text-sm text-muted mt-1">{t(d, e)}</p>
        </li>
      ))}
    </ul>
  );
}

export const CRAFT_STEPS: [string, string, string, string][] = [
  ['Seasoned for 18 months', '১৮ মাস শুকানো', 'Air- and kiln-dried to below 12% moisture so it never warps in the monsoon.', '১২%-এর নিচে আর্দ্রতা পর্যন্ত শুকানো, বর্ষায় বাঁকে না।'],
  ['Joined, never stapled', 'জোড় দেওয়া, স্ট্যাপল নয়', 'Mortise-and-tenon and dovetail joints, glued and pegged.', 'মর্টিস-টেনন ও ডাভটেইল জোড়, আঠা ও খিল দিয়ে।'],
  ['Hand-rubbed finish', 'হাতে ঘষা ফিনিশ', 'Seven coats of oil and lacquer, sanded by hand between each.', 'সাত স্তর তেল ও ল্যাকার, প্রতিবার হাতে ঘষে।'],
];
