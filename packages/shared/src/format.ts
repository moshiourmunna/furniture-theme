export type Locale = 'en' | 'bn';
export const LOCALES: Locale[] = ['en', 'bn'];
export const DEFAULT_LOCALE: Locale = 'en';
export const isLocale = (v: unknown): v is Locale => v === 'en' || v === 'bn';

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/** Replace ASCII digits with Bangla digits (০–৯). */
export function toBnDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

/** Convert Bangla digits back to ASCII (useful for parsing user input). */
export function fromBnDigits(input: string): string {
  return input.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

/** South-Asian (lakh/crore) grouping: 1250000 → "12,50,000". */
export function groupLakh(n: number): string {
  const neg = n < 0;
  const [intPart, frac] = Math.abs(n).toFixed(Number.isInteger(n) ? 0 : 2).split('.');
  let out: string;
  if (intPart.length <= 3) out = intPart;
  else {
    const last3 = intPart.slice(-3);
    const rest = intPart.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    out = `${rest},${last3}`;
  }
  return (neg ? '-' : '') + out + (frac ? `.${frac}` : '');
}

export function formatNumber(n: number, locale: Locale = 'en'): string {
  const s = groupLakh(n);
  return locale === 'bn' ? toBnDigits(s) : s;
}

/** Price in BDT, e.g. "৳84,500" / "৳৮৪,৫০০". */
export function formatPrice(n: number, locale: Locale = 'en'): string {
  return `৳${formatNumber(Math.round(n), locale)}`;
}

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_BN = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];

/** "25 Oct 2026" / "২৫ অক্টো ২০২৬" — always in Asia/Dhaka. */
/** Format a date in Asia/Dhaka (UTC+6, no DST). With `time`, appends h:mm am/pm. */
export function formatDate(d: Date | string, locale: Locale = 'en', time = false): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const dhaka = new Date(date.getTime() + 6 * 3600_000);
  const day = dhaka.getUTCDate();
  const m = dhaka.getUTCMonth();
  const y = dhaka.getUTCFullYear();
  const base = locale === 'bn' ? `${toBnDigits(day)} ${MONTHS_BN[m]} ${toBnDigits(y)}` : `${day} ${MONTHS_EN[m]} ${y}`;
  if (!time) return base;
  const h24 = dhaka.getUTCHours();
  const hm = `${h24 % 12 || 12}:${String(dhaka.getUTCMinutes()).padStart(2, '0')}`;
  return locale === 'bn' ? `${base}, ${toBnDigits(hm)}` : `${base}, ${hm} ${h24 < 12 ? 'am' : 'pm'}`;
}

/** Pick the EN or BN field of a bilingual record: pick(p, 'name', 'bn') → p.nameBn (falls back to EN). */
export function pick<T extends Record<string, unknown>>(obj: T, field: string, locale: Locale): string {
  const bn = obj[`${field}Bn`];
  const en = obj[`${field}En`];
  if (locale === 'bn' && typeof bn === 'string' && bn) return bn;
  return typeof en === 'string' ? en : '';
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150);
}
