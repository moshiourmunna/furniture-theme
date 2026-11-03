import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/en/account', '/bn/account', '/en/checkout', '/bn/checkout', '/en/cart', '/bn/cart', '/en/order/', '/bn/order/', '/en/pay/', '/bn/pay/', '/en/search', '/bn/search'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
