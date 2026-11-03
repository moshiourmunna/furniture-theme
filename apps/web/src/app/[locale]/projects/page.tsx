import type { Metadata } from 'next';
import Link from 'next/link';
import { listProjects } from '@/server/services/content';
import { getLocale, lp, tr, type LocaleParams } from '@/lib/i18n';
import { breadcrumbLd, pageMeta } from '@/lib/seo';
import { Breadcrumbs, Empty, Intro, JsonLd } from '@/components/ui';
import { PROJECT_TYPES, ProjectCard } from '@/components/showcase';

type Props = LocaleParams & { searchParams: Promise<{ type?: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await getLocale(params);
  const t = tr(locale);
  return pageMeta({ locale, path: '/projects', title: t('Projects — homes, hotels and offices we’ve furnished', 'প্রজেক্ট — আমাদের সাজানো বাড়ি, হোটেল ও অফিস'), description: t('Residential, hospitality, corporate and retail interiors furnished by Shekor across Bangladesh.', 'সারা বাংলাদেশে শেকড়ের সাজানো আবাসিক, হসপিটালিটি, কর্পোরেট ও রিটেইল ইন্টেরিয়র।') });
}

export default async function Projects({ params, searchParams }: Props) {
  const locale = await getLocale(params);
  const t = tr(locale);
  const { type } = await searchParams;
  const valid = PROJECT_TYPES.some(([k]) => k === type) ? type : undefined;
  const items = await listProjects(valid);
  const crumbs = [{ name: t('Home', 'হোম'), path: '/' }, { name: t('Projects', 'প্রজেক্ট') }];
  return (
    <>
      <Intro crumbs={<Breadcrumbs locale={locale} items={crumbs} />} eyebrow={t('Projects', 'প্রজেক্ট')} title={t('Spaces we’ve furnished', 'আমাদের সাজানো জায়গা')} sub={t('From Gulshan apartments to Cox’s Bazar resorts — each project made in our workshop and installed by our own team.', 'গুলশানের অ্যাপার্টমেন্ট থেকে কক্সবাজারের রিসোর্ট — প্রতিটি প্রজেক্ট আমাদের কারখানায় তৈরি ও নিজস্ব টিমে স্থাপিত।')} />
      <section className="container">
        <nav className="flex flex-wrap gap-2 mb-12 border-t border-line pt-6" aria-label={t('Filter by type', 'ধরন অনুযায়ী')}>
          <Link href={lp(locale, '/projects')} className={`chip ${!valid ? 'chip-active' : ''}`} aria-current={!valid ? 'page' : undefined}>{t('All', 'সব')}</Link>
          {PROJECT_TYPES.map(([k, en, bn]) => <Link key={k} href={lp(locale, `/projects?type=${k}`)} className={`chip ${valid === k ? 'chip-active' : ''}`} aria-current={valid === k ? 'page' : undefined} data-testid={`ptype-${k}`}>{t(en, bn)}</Link>)}
        </nav>
        {items.length ? <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">{items.map((p, i) => <ProjectCard key={p.slug} p={p} locale={locale} ratio={i % 3 === 1 ? 'aspect-[4/5]' : 'aspect-[4/3]'} />)}</div> : <Empty title={t('No projects of this type yet', 'এই ধরনের প্রজেক্ট এখনো নেই')} />}
      </section>
      <section className="container mt-28 bg-deep text-linen-100 p-10 md:p-16 grid md:grid-cols-2 gap-8 items-center">
        <h2 className="h-display text-4xl md:text-5xl text-linen-200">{t('Planning a project?', 'প্রজেক্টের পরিকল্পনা করছেন?')}</h2>
        <div className="md:justify-self-end flex flex-wrap gap-3"><Link href={lp(locale, '/trade')} className="btn btn-light">{t('Trade & corporate', 'ট্রেড ও কর্পোরেট')}</Link><Link href={lp(locale, '/interior-design')} className="link-line text-linen-200">{t('Interior design service', 'ইন্টেরিয়র ডিজাইন সেবা')}</Link></div>
      </section>
      <JsonLd data={breadcrumbLd(locale, crumbs)} />
    </>
  );
}
