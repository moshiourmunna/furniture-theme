import { formatNumber, formatPrice, formatDate, type Locale } from '@shekor/shared';
export type { Locale } from '@shekor/shared';
export { isLocale, LOCALES } from '@shekor/shared';

/** Bilingual inline strings, mirroring the mockups' t("English","বাংলা") convention. */
export const tr = (l: Locale) => (en: string, bn: string) => (l === 'bn' ? bn : en);
/** Localised path: lp('bn', '/shop') → '/bn/shop'. */
export const lp = (l: Locale, path = '/') => `/${l}${path === '/' ? '' : path}`;
/** Pick EN/BN field: f(row, 'name') → row.nameEn | row.nameBn (falls back to EN). */
export const pf = (l: Locale) => (row: object, field: string): string => {
  const r = row as Record<string, unknown>;
  const bn = r[`${field}Bn`];
  return l === 'bn' && typeof bn === 'string' && bn ? bn : String(r[`${field}En`] ?? '');
};
export const money = (l: Locale, n: number) => formatPrice(n, l);
export const num = (l: Locale, n: number | string) => (typeof n === 'number' ? formatNumber(n, l) : l === 'bn' ? n.replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]) : n);
export const date = (l: Locale, d: Date | string, time = false) => formatDate(d, l, time);

export type LocaleParams<T extends object = object> = { params: Promise<{ locale: string } & T> };
/** Resolve the [locale] route param (validated by the layout) as a Locale. */
export async function getLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  return (locale === 'bn' ? 'bn' : 'en') as Locale;
}
