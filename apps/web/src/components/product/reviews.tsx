'use client';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BadgeCheck, Camera, Star, X } from 'lucide-react';
import { api, apiUpload } from '@/lib/api';
import { date, lp, num } from '@/lib/i18n';
import { useStore } from '../providers';
import { Modal } from '../card-actions';
import { Lightbox } from './gallery';

export interface ReviewDTO { id: number; authorName: string; location: string | null; rating: number; title: string; body: string; photos: string[]; verified: boolean; reply: string | null; createdAt: string }

function StarsRow({ v, size = 'w-4 h-4' }: { v: number; size?: string }) {
  return <span className="inline-flex text-teak" aria-label={`${v} / 5`} role="img">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={size} fill={v >= i - 0.25 ? 'currentColor' : 'none'} aria-hidden />)}</span>;
}

export function Reviews({ slug, reviews, avg, count, dist }: { slug: string; reviews: ReviewDTO[]; avg: number; count: number; dist: Record<number, number> }) {
  const { t, locale, me, meLoaded } = useStore();
  const pathname = usePathname();
  const [filter, setFilter] = useState<'all' | 'photos' | 5 | 4 | 3>('all');
  const [shown, setShown] = useState(5);
  const [write, setWrite] = useState(false);
  const [lb, setLb] = useState<{ imgs: string[]; i: number } | null>(null);
  const withPhotos = reviews.filter((r) => r.photos.length);
  const list = useMemo(() => reviews.filter((r) => (filter === 'all' ? true : filter === 'photos' ? r.photos.length > 0 : r.rating === filter)), [reviews, filter]);
  const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1;
  const allPhotos = withPhotos.flatMap((r) => r.photos);
  return (
    <section className="container mt-20 grid lg:grid-cols-[320px_1fr] gap-10" id="reviews" aria-labelledby="rev-h">
      <div>
        <h2 id="rev-h" className="h-display text-3xl">{t('Customer reviews', 'গ্রাহক রিভিউ')}</h2>
        <div className="mt-4 flex items-center gap-3"><p className="text-5xl font-display">{num(locale, avg.toFixed(1))}</p><div><StarsRow v={avg} /><p className="text-sm text-muted mt-1">{num(locale, count)} {t('reviews', 'রিভিউ')}</p></div></div>
        <ul className="mt-5 space-y-2">
          {[5, 4, 3, 2, 1].map((s) => (
            <li key={s} className="flex items-center gap-3 text-sm"><span className="w-6 text-muted">{num(locale, s)}★</span><span className="flex-1 h-2 bg-surface-2 overflow-hidden"><span className="block h-full bg-teak" style={{ width: `${((dist[s] ?? 0) / total) * 100}%` }} /></span><span className="w-8 text-right text-muted">{num(locale, dist[s] ?? 0)}</span></li>
          ))}
        </ul>
        {meLoaded && (me ? (
          <button type="button" className="btn btn-outline w-full mt-6" onClick={() => setWrite(true)} data-testid="write-review"><Camera className="w-4 h-4" />{t('Write a review with photos', 'ছবিসহ রিভিউ লিখুন')}</button>
        ) : (
          <Link href={lp(locale, `/login?next=${encodeURIComponent(pathname + '#reviews')}`)} className="btn btn-outline w-full mt-6">{t('Sign in to write a review', 'রিভিউ লিখতে সাইন ইন করুন')}</Link>
        ))}
      </div>
      <div>
        <div className="flex flex-wrap gap-2 pb-4 border-b border-line" role="group" aria-label={t('Filter reviews', 'রিভিউ ফিল্টার')}>
          {([['all', t('All', 'সব')], ['photos', t(`With photos (${withPhotos.length})`, `ছবিসহ (${num('bn', withPhotos.length)})`)], [5, t('5 stars', '৫ স্টার')], [4, t('4 stars', '৪ স্টার')], [3, t('3 stars', '৩ স্টার')]] as const).map(([k, l]) => (
            <button key={String(k)} type="button" className={`chip h-8 text-xs ${filter === k ? 'chip-active' : ''}`} aria-pressed={filter === k} onClick={() => { setFilter(k); setShown(5); }} data-testid={`rev-filter-${k}`}>{l}</button>
          ))}
        </div>
        {allPhotos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-4">
            {allPhotos.map((src, i) => <button key={src + i} type="button" onClick={() => setLb({ imgs: allPhotos, i })} className="relative shrink-0 w-24 h-24 overflow-hidden" aria-label={t('Open customer photo', 'গ্রাহকের ছবি খুলুন')}><Image src={src} alt="" fill sizes="96px" className="object-cover" /></button>)}
          </div>
        )}
        {list.length === 0 && <p className="py-8 text-muted">{t('No reviews match this filter yet.', 'এই ফিল্টারে এখনো রিভিউ নেই।')}</p>}
        {list.slice(0, shown).map((r) => (
          <article key={r.id} className="py-6 border-b border-line" data-testid="review">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-accent-soft text-accent grid place-items-center font-semibold" aria-hidden>{r.authorName[0]}</span>
                <div>
                  <p className="font-semibold text-sm">{r.authorName}{r.verified && <span className="ml-2 badge bg-primary-soft text-primary normal-case tracking-normal"><BadgeCheck className="w-3 h-3" />{t('Verified buyer', 'যাচাইকৃত ক্রেতা')}</span>}</p>
                  <p className="text-xs text-muted">{r.location ? `${r.location} · ` : ''}{date(locale, r.createdAt)}</p>
                </div>
              </div>
              <StarsRow v={r.rating} />
            </div>
            <h3 className="font-semibold mt-3">{r.title}</h3>
            <p className="text-sm text-muted mt-1 leading-relaxed">{r.body}</p>
            {r.photos.length > 0 && <div className="flex gap-2 mt-3">{r.photos.map((src, i) => <button key={src} type="button" onClick={() => setLb({ imgs: r.photos, i })} className="relative w-20 h-20 overflow-hidden" aria-label={t('Open review photo', 'রিভিউয়ের ছবি খুলুন')}><Image src={src} alt="" fill sizes="80px" className="object-cover" /></button>)}</div>}
            {r.reply && <div className="mt-4 ml-6 bg-surface-2 p-4 text-sm"><p className="font-semibold text-xs mb-1">{t('Reply from Shekor', 'শেকড়ের উত্তর')}</p>{r.reply}</div>}
          </article>
        ))}
        {list.length > shown && <button type="button" className="btn btn-outline mt-6" onClick={() => setShown((s) => s + 5)} data-testid="more-reviews">{t('Load more reviews', 'আরও রিভিউ দেখুন')}</button>}
      </div>
      {lb && <Lightbox images={lb.imgs.map((u) => ({ url: u, alt: t('Customer photo', 'গ্রাহকের ছবি') }))} index={lb.i} onIndex={(i) => setLb({ ...lb, i })} onClose={() => setLb(null)} />}
      {write && <WriteReview slug={slug} onClose={() => setWrite(false)} />}
    </section>
  );
}

function WriteReview({ slug, onClose }: { slug: string; onClose: () => void }) {
  const { t, toast } = useStore();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [location, setLocation] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const upload = async (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files).slice(0, 4 - photos.length)) {
      try { const r = await apiUpload('/account/uploads', f); setPhotos((p) => [...p, r.url]); } catch (e) { setErr({ photos: (e as Error).message }); }
    }
  };
  return (
    <Modal title={t('Write a review', 'রিভিউ লিখুন')} onClose={onClose}>
      <form className="space-y-4" data-testid="review-form" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setErr({});
        try { await api(`/products/${slug}/reviews`, { body: { rating, title, body, location: location || undefined, photos } }); toast(t('Thank you — your review will appear after moderation.', 'ধন্যবাদ — যাচাইয়ের পর আপনার রিভিউ দেখা যাবে।')); onClose(); }
        catch (x) { const ex = x as { fields?: Record<string, string>; message: string }; setErr(ex.fields ?? { form: ex.message }); }
        finally { setBusy(false); }
      }}>
        <fieldset><legend className="label">{t('Your rating', 'আপনার রেটিং')}</legend>
          <div className="flex gap-1" role="radiogroup">{[1, 2, 3, 4, 5].map((i) => <button key={i} type="button" role="radio" aria-checked={rating === i} aria-label={`${i}`} onClick={() => setRating(i)} className="text-teak p-1"><Star className="w-7 h-7" fill={rating >= i ? 'currentColor' : 'none'} /></button>)}</div>
        </fieldset>
        <div><label className="label" htmlFor="rv-title">{t('Title', 'শিরোনাম')}</label><input id="rv-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} aria-invalid={!!err.title} />{err.title && <p className="text-xs text-sale mt-1">{err.title}</p>}</div>
        <div><label className="label" htmlFor="rv-body">{t('Your review', 'আপনার রিভিউ')}</label><textarea id="rv-body" className="input" rows={4} value={body} onChange={(e) => setBody(e.target.value)} required minLength={10} aria-invalid={!!err.body} />{err.body && <p className="text-xs text-sale mt-1">{err.body}</p>}</div>
        <div><label className="label" htmlFor="rv-loc">{t('City (optional)', 'শহর (ঐচ্ছিক)')}</label><input id="rv-loc" className="input" value={location} onChange={(e) => setLocation(e.target.value)} /></div>
        <div>
          <p className="label">{t('Photos (up to 4)', 'ছবি (সর্বোচ্চ ৪টি)')}</p>
          <div className="flex gap-2 flex-wrap">
            {photos.map((p) => <span key={p} className="relative w-16 h-16"><Image src={p} alt="" fill sizes="64px" className="object-cover" /><button type="button" className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-ink text-bg grid place-items-center" onClick={() => setPhotos((x) => x.filter((y) => y !== p))} aria-label={t('Remove photo', 'ছবি সরান')}><X className="w-3 h-3" /></button></span>)}
            {photos.length < 4 && <label className="w-16 h-16 border border-dashed border-line grid place-items-center cursor-pointer text-muted"><Camera className="w-5 h-5" /><span className="sr-only">{t('Add photos', 'ছবি যোগ করুন')}</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => upload(e.target.files)} data-testid="review-photo-input" /></label>}
          </div>
          {err.photos && <p className="text-xs text-sale mt-1">{err.photos}</p>}
        </div>
        {err.form && <p className="text-sm text-sale" role="alert">{err.form}</p>}
        <button type="submit" className="btn btn-primary w-full" disabled={busy} data-testid="review-submit">{t('Submit review', 'রিভিউ জমা দিন')}</button>
      </form>
    </Modal>
  );
}
