import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GALLERY_FACETS, type GalleryFacet } from '@/server/services/content';
import { getLocale, tr, type LocaleParams } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';
import { FACET_LABEL, GalleryPage, facetOptions } from '@/components/gallery-page';

type Props = LocaleParams<{ facet: string; value: string }>;
export const revalidate = 300;
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await getLocale(params);
  const { facet, value } = await params;
  if (!GALLERY_FACETS.includes(facet as GalleryFacet)) return {};
  const t = tr(locale);
  const label = (await facetOptions(locale))[facet as GalleryFacet].find((o) => o.value === value)?.label ?? value;
  return pageMeta({ locale, path: `/gallery/${facet}/${value}`, title: `${t('Gallery', 'গ্যালারি')}: ${label}`, description: t(`Shekor furniture photographed in real rooms — ${FACET_LABEL[facet as GalleryFacet][0].toLowerCase()}: ${label}.`, `বাস্তব ঘরে শেকড় ফার্নিচার — ${FACET_LABEL[facet as GalleryFacet][1]}: ${label}।`) });
}
export default async function Page({ params }: Props) {
  const locale = await getLocale(params);
  const { facet, value } = await params;
  if (!GALLERY_FACETS.includes(facet as GalleryFacet)) notFound();
  const opts = await facetOptions(locale);
  if (!opts[facet as GalleryFacet].some((o) => o.value === value)) notFound();
  return <GalleryPage locale={locale} facet={facet as GalleryFacet} value={value} />;
}
