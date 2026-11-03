import { describe, expect, it } from 'vitest';
import { abs, breadcrumbLd, pageMeta } from '@/lib/seo';
import { lp, money, num, pf, tr } from '@/lib/i18n';

describe('i18n helpers', () => {
  it('prefixes locale paths', () => {
    expect(lp('en')).toBe('/en');
    expect(lp('bn', '/shop')).toBe('/bn/shop');
  });
  it('formats money and numbers in Bangla numerals', () => {
    expect(money('bn', 125000)).toBe('৳১,২৫,০০০');
    expect(num('bn', 42)).toBe('৪২');
    expect(tr('bn')('Hi', 'হাই')).toBe('হাই');
    expect(pf('bn')({ nameEn: 'Bed', nameBn: 'খাট' }, 'name')).toBe('খাট');
  });
});

describe('SEO helpers', () => {
  it('builds canonical + hreflang alternates', () => {
    const m = pageMeta({ locale: 'bn', path: '/shop', title: 'Shop', description: 'All furniture' });
    expect(String(m.alternates?.canonical)).toMatch(/\/bn\/shop$/);
    expect(JSON.stringify(m.alternates?.languages)).toContain('/en/shop');
  });
  it('absolutises and builds breadcrumbs', () => {
    expect(abs('/x')).toMatch(/^https?:\/\/.+\/x$/);
    const b = breadcrumbLd('en', [{ name: 'Home', path: '/' }, { name: 'Shop' }]);
    expect(b['@type']).toBe('BreadcrumbList');
    expect(b.itemListElement).toHaveLength(2);
  });
});
