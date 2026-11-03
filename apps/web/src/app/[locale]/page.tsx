import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { homeData } from '@/server/services/content';
import { getLocale, lp, num, pf, tr, type LocaleParams } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';
import { Figure, Hero, SectionHead, TrustStrip } from '@/components/ui';
import { Rail } from '@/components/product-card';
import { CRAFT_STEPS, CollectionCard, MaterialList, PROJECT_TYPES, ProjectCard } from '@/components/showcase';

export const revalidate = 300;

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  const t = tr(locale);
  return { ...pageMeta({ locale, path: '/', title: t('Shekor — Solid-wood furniture, crafted in Bangladesh', 'শেকড় — বাংলাদেশে হাতে তৈরি সলিড-কাঠের ফার্নিচার'), description: t('Shekor designs and hand-makes solid-wood furniture in Bangladesh: collections, projects, showrooms and an online shop with EMI, delivery and assembly.', 'শেকড় বাংলাদেশে সলিড-কাঠের ফার্নিচার ডিজাইন ও হাতে তৈরি করে: কালেকশন, প্রজেক্ট, শোরুম এবং ইএমআই, ডেলিভারি ও অ্যাসেম্বলিসহ অনলাইন শপ।') }), title: { absolute: t('Shekor — Solid-wood furniture, crafted in Bangladesh', 'শেকড় — বাংলাদেশে হাতে তৈরি সলিড-কাঠের ফার্নিচার') } };
}

export default async function Home({ params }: LocaleParams) {
  const locale = await getLocale(params);
  const t = tr(locale);
  const f = pf(locale);
  const d = await homeData();
  const hero = d.heroes[0];
  const c = d.collections;
  const stats: [string, string, string][] = [['17', 'years of making', 'বছরের অভিজ্ঞতা'], ['140', 'master karigors', 'ওস্তাদ কারিগর'], [String(d.showroomCount), 'showrooms', 'শোরুম'], ['12,000+', 'homes furnished', 'বাড়ি সাজানো']];
  const layout: [string, string, boolean][] = [['md:col-span-7', 'aspect-[4/5]', true], ['md:col-span-5 md:mt-40', 'aspect-[3/4]', false], ['md:col-span-4', 'aspect-[3/4]', false], ['md:col-span-4 md:mt-24', 'aspect-[3/4]', false], ['md:col-span-4', 'aspect-[3/4]', false]];
  const master = d.master;
  const masterCover = master ? ((master.pageImages as string[] | null)?.[0] ?? master.coverImage) : null;
  return (
    <>
      <Hero image={hero?.image ?? '/media/img/hero-1.webp'} alt={hero ? f(hero, 'title') : 'Shekor'} eyebrow={t('Collection 2026', 'কালেকশন ২০২৬')} title={hero ? f(hero, 'title') : t('Rooted in craft. Made for life.', 'শেকড়ে কারুকাজ। জীবনের জন্য তৈরি।')} sub={hero ? f(hero, 'subtitle') : t('Solid-wood furniture, shaped by hand in Bangladesh since 2009.', '২০০৯ সাল থেকে বাংলাদেশে হাতে গড়া সলিড-কাঠের ফার্নিচার।')} height="h-[100svh]">
        <Link href={lp(locale, hero?.href ?? '/collections/aranya')} className="btn btn-light">{hero ? f(hero, 'cta') : t('Discover Aranya', 'অরণ্য দেখুন')}</Link>
        <Link href={lp(locale, '/shop')} className="link-line text-white">{t('Shop furniture', 'ফার্নিচার কিনুন')}</Link>
      </Hero>

      <section className="container py-24 md:py-36 grid lg:grid-cols-12 gap-10">
        <p className="eyebrow lg:col-span-3" data-reveal>{t('The house of Shekor', 'শেকড়ের ঘর')}</p>
        <div className="lg:col-span-8">
          <p className="h-display text-3xl md:text-5xl leading-[1.15]" data-reveal>{t('We make furniture the slow way — seasoned Segun, hand-cut joints and finishes rubbed in by people who have done it for thirty years. Pieces meant to stay in a family.', 'আমরা ধীরে ফার্নিচার বানাই — শুকানো সেগুন, হাতে কাটা জোড় আর ত্রিশ বছরের অভিজ্ঞ হাতের ফিনিশ। এমন পিস, যা পরিবারে থেকে যায়।')}</p>
          <ul className="mt-16 grid grid-cols-2 md:grid-cols-4 border-t border-line">
            {stats.map(([a, b, cc]) => <li key={b} className="pt-6 pr-4" data-reveal><p className="h-display text-4xl md:text-5xl">{num(locale, a)}</p><p className="label-sm text-muted mt-2">{t(b, cc)}</p></li>)}
          </ul>
        </div>
      </section>

      <section className="container">
        <SectionHead locale={locale} eyebrow={t('Collections', 'কালেকশন')} title={t('Six collections, one language of craft', 'ছয়টি কালেকশন, কারুশিল্পের এক ভাষা')} href="/collections" />
        <div className="grid md:grid-cols-12 gap-x-8 gap-y-16">
          {c.slice(0, 5).map((x, i) => <div key={x.slug} className={layout[i][0]}><CollectionCard c={x} locale={locale} ratio={layout[i][1]} big={layout[i][2]} /></div>)}
        </div>
      </section>

      <section className="container mt-28 md:mt-40">
        <SectionHead locale={locale} eyebrow={t('Shop', 'শপ')} title={t('Selected pieces', 'বাছাই করা পিস')} sub={t('In stock in Dhaka. Complimentary delivery, assembly and 0% EMI.', 'ঢাকায় স্টকে আছে। ফ্রি ডেলিভারি, অ্যাসেম্বলি ও ০% ইএমআই।')} href="/shop" />
        <Rail items={d.featured.slice(0, 4)} locale={locale} />
        <ul className="mt-14 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-6">
          {d.rooms.map((r) => <li key={r.slug}><Link href={lp(locale, `/shop?room=${r.slug}`)} className="h-serif text-xl hover:text-accent">{f(r, 'name')}</Link></li>)}
        </ul>
      </section>

      <section className="mt-28 md:mt-40 bg-surface-2/60">
        <div className="container py-20 md:py-28 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6"><Figure src="/media/img/about-workshop.webp" alt={t('Karigor at work in Gazipur', 'গাজীপুরে কাজ করছেন কারিগর')} /></div>
          <div className="lg:col-span-5 lg:col-start-8">
            <p className="eyebrow" data-reveal>{t('Craftsmanship', 'কারুশিল্প')}</p>
            <h2 className="h-display text-4xl md:text-5xl mt-4 leading-[1.05]" data-reveal>{t('Made slowly, by hand, in Gazipur', 'গাজীপুরে, হাতে, ধীরে তৈরি')}</h2>
            <ol className="mt-10 space-y-7">
              {CRAFT_STEPS.map(([a, b, cc, dd], i) => (
                <li key={a} className="grid grid-cols-[3rem_1fr] gap-4 border-t border-line pt-6" data-reveal><span className="h-display text-2xl text-accent">{num(locale, `0${i + 1}`)}</span><div><p className="h-serif text-xl">{t(a, b)}</p><p className="text-muted text-sm mt-1 leading-relaxed">{t(cc, dd)}</p></div></li>
              ))}
            </ol>
            <Link href={lp(locale, '/craft')} className="link-line mt-10" data-reveal>{t('Our craftsmanship', 'আমাদের কারুশিল্প')}</Link>
          </div>
        </div>
        <div className="container pb-20"><MaterialList locale={locale} /></div>
      </section>

      <section className="mt-28 md:mt-40 bg-deep text-linen-100 py-24 md:py-32">
        <div className="container">
          <div className="flex items-end justify-between gap-6 mb-14" data-reveal>
            <div><p className="label-sm text-linen-200/70">{t('Projects', 'প্রজেক্ট')}</p><h2 className="h-display text-4xl md:text-6xl mt-4 text-linen-200">{t('Spaces we’ve furnished', 'আমাদের সাজানো জায়গা')}</h2></div>
            <Link href={lp(locale, '/projects')} className="link-line text-linen-200 max-sm:hidden">{t('All projects', 'সব প্রজেক্ট')}</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-10">{d.projects.map((p, i) => <ProjectCard key={p.slug} p={p} locale={locale} ratio={i === 1 ? 'aspect-[4/5]' : 'aspect-[4/3]'} dark />)}</div>
          <div className="mt-16 flex flex-wrap gap-x-10 gap-y-3 text-sm text-linen-100/75 border-t border-white/10 pt-8">
            {PROJECT_TYPES.map(([k, en, bn]) => <Link key={k} href={lp(locale, `/projects?type=${k}`)} className="hover:text-white">{t(en, bn)}</Link>)}
            <Link href={lp(locale, '/trade')} className="ml-auto link-line text-linen-200">{t('Trade & corporate', 'ট্রেড ও কর্পোরেট')}</Link>
          </div>
        </div>
      </section>

      <section className="container mt-28 md:mt-40">
        <SectionHead locale={locale} eyebrow={t('Gallery', 'গ্যালারি')} title={t('Rooms to live in', 'বসবাসের মতো ঘর')} sub={t('Browse by room, collection, brand, material or project — and shop what you see.', 'রুম, কালেকশন, ব্র্যান্ড, ম্যাটেরিয়াল বা প্রজেক্ট অনুযায়ী দেখুন — আর পছন্দেরটা কিনুন।')} href="/gallery" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {d.gallery.slice(0, 5).map((g, i) => (
            <Link key={g.id} href={lp(locale, `/gallery/category/${g.category}`)} className={`group block ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`} data-reveal>
              <Figure src={g.image} alt={f(g, 'title')} ratio={i === 0 ? 'aspect-square md:aspect-auto md:h-full' : 'aspect-square'} sizes="(min-width:768px) 25vw, 50vw" />
            </Link>
          ))}
        </div>
      </section>

      {master && (
        <section className="container mt-28 md:mt-40 grid lg:grid-cols-12 gap-12 items-center">
          <Link href={lp(locale, `/catalogues/${master.slug}`)} className="lg:col-span-5 group block">
            <div className="relative aspect-[3/4] bg-surface-2 shadow-pop overflow-hidden">{masterCover && <Image src={masterCover} alt={`${f(master, 'title')} cover`} fill sizes="(min-width:1024px) 40vw, 90vw" className="object-cover group-hover:scale-[1.02] transition duration-700" />}</div>
          </Link>
          <div className="lg:col-span-6 lg:col-start-7">
            <p className="eyebrow" data-reveal>{t('Catalogues', 'ক্যাটালগ')}</p>
            <h2 className="h-display text-4xl md:text-6xl mt-4 leading-[1.02]" data-reveal>{f(master, 'title')}</h2>
            <p className="text-muted mt-6 leading-relaxed max-w-lg" data-reveal>{t('Every collection, finish and dimension in one volume — plus separate catalogues for each room, brand and collection. Read online, download, or ask for a printed copy.', 'সব কালেকশন, ফিনিশ ও মাপ এক খণ্ডে — সঙ্গে প্রতিটি রুম, ব্র্যান্ড ও কালেকশনের আলাদা ক্যাটালগ। অনলাইনে পড়ুন, ডাউনলোড করুন বা ছাপা কপি চান।')}</p>
            <div className="mt-10 flex flex-wrap gap-3" data-reveal>
              <Link href={lp(locale, `/catalogues/${master.slug}`)} className="btn btn-primary">{t('Read online', 'অনলাইনে পড়ুন')}</Link>
              <a href={`/api/v1/catalogues/${master.slug}/download`} className="btn btn-outline"><Download className="w-4 h-4" />PDF · {num(locale, (master.sizeKb / 1024).toFixed(1))} MB</a>
            </div>
            <Link href={lp(locale, '/catalogues#request')} className="link-line mt-8" data-reveal>{t('Request a printed catalogue', 'ছাপা ক্যাটালগ চান')}</Link>
          </div>
        </section>
      )}

      <section className="mt-28 md:mt-40 relative h-[70svh] min-h-[520px] max-h-[820px] flex items-end text-white overflow-hidden">
        <div className="absolute inset-0"><Image src="/media/img/showroom.webp" alt={t('Banani flagship showroom', 'বনানী ফ্ল্যাগশিপ শোরুম')} fill sizes="100vw" className="object-cover" quality={70} /></div>
        <div className="absolute inset-0 bg-gradient-to-t from-deep/85 to-deep/10" />
        <div className="relative container pb-16 md:pb-20 grid lg:grid-cols-2 gap-8 items-end">
          <div data-reveal><p className="label-sm text-white/75">{t('Showroom experience', 'শোরুম অভিজ্ঞতা')}</p><h2 className="h-display text-4xl md:text-6xl mt-4">{t('Visit the Banani flagship', 'বনানী ফ্ল্যাগশিপে আসুন')}</h2></div>
          <div className="lg:justify-self-end" data-reveal>
            <p className="text-white/85 max-w-md">{t(`Sit, touch and compare finishes with a designer — tea is on us. ${d.showroomCount} showrooms across Bangladesh.`, `ডিজাইনারের সাথে বসুন, ছুঁয়ে দেখুন, ফিনিশ মিলিয়ে নিন — চা আমাদের পক্ষ থেকে। সারা দেশে ${num('bn', d.showroomCount)}টি শোরুম।`)}</p>
            <div className="mt-6 flex flex-wrap gap-4 items-center"><Link href={lp(locale, '/consultation')} className="btn btn-light">{t('Book a visit', 'ভিজিট বুক করুন')}</Link><Link href={lp(locale, '/showrooms')} className="link-line text-white">{t('All showrooms', 'সব শোরুম')}</Link></div>
          </div>
        </div>
      </section>

      <section className="container mt-28 md:mt-40 grid md:grid-cols-3 gap-px bg-line border border-line">
        {([['Interior design', 'ইন্টেরিয়র ডিজাইন', 'Room plans, 3D visuals and styling by our in-house studio.', 'আমাদের স্টুডিওর রুম প্ল্যান, থ্রিডি ভিজ্যুয়াল ও স্টাইলিং।', '/interior-design'], ['Trade & corporate', 'ট্রেড ও কর্পোরেট', 'Pricing and project management for architects, hotels and offices.', 'স্থপতি, হোটেল ও অফিসের জন্য বিশেষ মূল্য ও প্রজেক্ট ম্যানেজমেন্ট।', '/trade'], ['Bespoke', 'বেসপোক', 'Any size, any finish — made to measure in 3–6 weeks.', 'যেকোনো মাপ, যেকোনো ফিনিশ — ৩–৬ সপ্তাহে।', '/custom']] as const).map(([a, b, cc, dd, u], i) => (
          <Link key={u} href={lp(locale, u)} className="group bg-bg p-8 md:p-10 flex flex-col min-h-[280px]" data-reveal>
            <span className="label-sm text-muted">{num(locale, `0${i + 1}`)}</span>
            <h3 className="h-display text-3xl mt-auto">{t(a, b)}</h3>
            <p className="text-muted text-sm mt-3 leading-relaxed">{t(cc, dd)}</p>
            <span className="link-line mt-6 self-start">{t('Learn more', 'বিস্তারিত')}<span className="sr-only"> — {t(a, b)}</span></span>
          </Link>
        ))}
      </section>

      <section className="container mt-28 md:mt-40">
        <SectionHead locale={locale} eyebrow={t('Journal', 'জার্নাল')} title={t('Notes on living well', 'সুন্দর জীবনের নোট')} href="/journal" />
        <div className="grid md:grid-cols-3 gap-10">
          {d.posts.map((p) => (
            <Link key={p.slug} href={lp(locale, `/journal/${p.slug}`)} className="group block" data-reveal>
              <Figure src={p.coverImage ?? '/media/img/hero-2.webp'} alt={f(p, 'title')} ratio="aspect-[4/3]" sizes="(min-width:768px) 33vw, 90vw" />
              <p className="label-sm text-muted mt-5">{f(p, 'category')} · {num(locale, p.readMinutes)} {t('min read', 'মিনিট পড়া')}</p>
              <h3 className="h-serif text-xl mt-2 leading-snug group-hover:text-accent transition">{f(p, 'title')}</h3>
            </Link>
          ))}
        </div>
      </section>
      <section className="container mt-24"><TrustStrip locale={locale} /></section>
    </>
  );
}
