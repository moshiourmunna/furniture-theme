import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { listCatalogues } from '@/server/services/content';
import { getLocale, lp, num, pf, tr, type LocaleParams } from '@/lib/i18n';
import { breadcrumbLd, pageMeta } from '@/lib/seo';
import { Breadcrumbs, Intro, JsonLd } from '@/components/ui';
import { LeadForm } from '@/components/lead-form';

export const revalidate = 300;
export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params);
  const t = tr(locale);
  return pageMeta({ locale, path: '/catalogues', title: t('Catalogues — read online, download or request print', 'ক্যাটালগ — অনলাইনে পড়ুন, ডাউনলোড বা ছাপা কপি'), description: t('The Shekor Collection Book 2026 plus room, brand and collection catalogues. Read as a flipbook, download PDF or request a printed copy.', 'শেকড় কালেকশন বুক ২০২৬ এবং রুম, ব্র্যান্ড ও কালেকশন ক্যাটালগ। ফ্লিপবুকে পড়ুন, পিডিএফ ডাউনলোড বা ছাপা কপি চান।') });
}

const KIND: Record<string, [string, string]> = { master: ['The master book', 'মাস্টার বুক'], category: ['By room', 'রুম অনুযায়ী'], brand: ['By brand', 'ব্র্যান্ড অনুযায়ী'], collection: ['Collection lookbooks', 'কালেকশন লুকবুক'] };

export default async function Catalogues({ params }: LocaleParams) {
  const locale = await getLocale(params);
  const t = tr(locale);
  const f = pf(locale);
  const cats = await listCatalogues();
  const crumbs = [{ name: t('Home', 'হোম'), path: '/' }, { name: t('Catalogues', 'ক্যাটালগ') }];
  const groups = Object.keys(KIND).map((k) => [k, cats.filter((c) => c.kind === k)] as const).filter(([, v]) => v.length);
  const cover = (c: (typeof cats)[number]) => (Array.isArray(c.pageImages) ? (c.pageImages as string[])[0] : null) ?? c.coverImage ?? '/media/img/hero-1.webp';
  return (
    <>
      <Intro crumbs={<Breadcrumbs locale={locale} items={crumbs} />} eyebrow={t('Catalogues', 'ক্যাটালগ')} title={t('Read, download or hold it in your hands', 'পড়ুন, ডাউনলোড করুন বা হাতে নিন')} sub={t('Every collection, finish and dimension — as an online flipbook, a PDF, or a printed book delivered free.', 'সব কালেকশন, ফিনিশ ও মাপ — অনলাইন ফ্লিপবুক, পিডিএফ, অথবা বিনামূল্যে পাঠানো ছাপা বই হিসেবে।')} />
      {groups.map(([k, list]) => (
        <section key={k} className="container mt-6 mb-20">
          <h2 className="eyebrow mb-8 border-t border-line pt-6">{t(...KIND[k])}</h2>
          <div className={`grid gap-x-8 gap-y-12 ${k === 'master' ? 'md:grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
            {list.map((c) => (
              <article key={c.slug} className="group" data-testid="catalogue-card">
                <Link href={lp(locale, `/catalogues/${c.slug}`)} className="block"><div className="relative aspect-[3/4] bg-surface-2 shadow-pop overflow-hidden"><Image src={cover(c)} alt={`${f(c, 'title')} — ${t('cover', 'প্রচ্ছদ')}`} fill sizes={k === 'master' ? '(min-width:768px) 45vw, 90vw' : '(min-width:768px) 22vw, 45vw'} className="object-cover group-hover:scale-[1.02] transition duration-700" /></div></Link>
                <h3 className={`h-display mt-4 ${k === 'master' ? 'text-3xl' : 'text-xl'}`}><Link href={lp(locale, `/catalogues/${c.slug}`)} className="hover:text-accent">{f(c, 'title')}</Link></h3>
                <p className="text-xs text-muted mt-1">{num(locale, c.pages)} {t('pages', 'পৃষ্ঠা')} · PDF {num(locale, (c.sizeKb / 1024).toFixed(1))} MB{c.season ? ` · ${c.season}` : ''}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm"><Link href={lp(locale, `/catalogues/${c.slug}`)} className="link-line">{t('Read online', 'অনলাইনে পড়ুন')}</Link><a href={`/api/v1/catalogues/${c.slug}/download`} className="inline-flex items-center gap-1 text-muted hover:text-ink"><Download className="w-3.5 h-3.5" />PDF</a></div>
              </article>
            ))}
          </div>
        </section>
      ))}
      <section id="request" className="container scroll-mt-24 grid lg:grid-cols-12 gap-10 border-t border-line pt-16">
        <div className="lg:col-span-5"><p className="eyebrow">{t('Printed catalogue', 'ছাপা ক্যাটালগ')}</p><h2 className="h-display text-4xl md:text-5xl mt-4">{t('Request a printed copy', 'ছাপা কপির অনুরোধ')}</h2><p className="text-muted mt-4">{t('We post printed books free anywhere in Bangladesh within 7 working days.', 'বাংলাদেশের যেকোনো জায়গায় ৭ কর্মদিবসের মধ্যে বিনামূল্যে ছাপা বই পাঠাই।')}</p></div>
        <div className="lg:col-span-6 lg:col-start-7">
          <LeadForm type="catalogue-request" submitLabel={t('Send request', 'অনুরোধ পাঠান')} successTitle={t('Request received', 'অনুরোধ পেয়েছি')} successBody={t('Your printed catalogue will reach you within 7 working days.', '৭ কর্মদিবসের মধ্যে আপনার ছাপা ক্যাটালগ পৌঁছে যাবে।')} fields={[
            { name: 'name', label: t('Full name', 'পুরো নাম'), required: true, half: true, autoComplete: 'name' },
            { name: 'phone', label: t('Mobile number', 'মোবাইল নম্বর'), type: 'tel', required: true, half: true, placeholder: '01XXXXXXXXX', autoComplete: 'tel' },
            { name: 'email', label: t('Email (optional)', 'ইমেইল (ঐচ্ছিক)'), type: 'email', autoComplete: 'email' },
            { name: 'address', label: t('Postal address', 'ডাক ঠিকানা'), type: 'textarea', required: true },
            { name: 'catalogues', label: t('Which catalogues?', 'কোন ক্যাটালগ?'), type: 'checkboxes', options: cats.filter((c) => c.kind !== 'collection').map((c) => ({ value: c.slug, label: f(c, 'title') })) },
          ]} />
        </div>
      </section>
      <JsonLd data={breadcrumbLd(locale, crumbs)} />
    </>
  );
}
