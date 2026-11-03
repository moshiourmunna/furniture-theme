/** The page inventory for the browser pass. Dynamic slugs are resolved from the live sitemap + API at setup time. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export interface Target { name: string; path: string; auth?: 'customer' | 'staff'; cart?: boolean; expect404?: boolean; shot?: boolean }
export const RESOLVED = fileURLToPath(new URL('../.cache/targets.json', import.meta.url));

export function storefrontTargets(): Target[] {
  const r = JSON.parse(readFileSync(RESOLVED, 'utf8')) as Record<string, string>;
  const t: Target[] = [
    { name: 'home', path: '/', shot: true },
    { name: 'shop', path: '/shop', shot: true },
    { name: 'shop-category', path: r.shop },
    { name: 'shop-filtered', path: '/shop?sort=price-asc&minPrice=10000&maxPrice=90000' },
    { name: 'product', path: r.p, shot: true },
    { name: 'collections', path: '/collections' },
    { name: 'collection', path: r.collections },
    { name: 'brands', path: '/brands' },
    { name: 'brand', path: r.brands },
    { name: 'projects', path: '/projects' },
    { name: 'project', path: r.projects },
    { name: 'gallery', path: '/gallery' },
    { name: 'gallery-facet', path: r.gallery },
    { name: 'catalogues', path: '/catalogues' },
    { name: 'catalogue-flipbook', path: r.catalogues, shot: true },
    { name: 'journal', path: '/journal' },
    { name: 'journal-post', path: r.journal },
    { name: 'craft', path: '/craft' },
    { name: 'studio', path: '/studio' },
    { name: 'interior-design', path: '/interior-design' },
    { name: 'custom', path: '/custom' },
    { name: 'consultation', path: '/consultation' },
    { name: 'trade', path: '/trade' },
    { name: 'showrooms', path: '/showrooms' },
    { name: 'about', path: '/about' },
    { name: 'contact', path: '/contact' },
    { name: 'faq', path: '/faq' },
    { name: 'policy', path: r.policy },
    { name: 'search', path: '/search?q=sofa' },
    { name: 'track', path: '/track' },
    { name: 'wishlist', path: '/wishlist' },
    { name: 'compare', path: '/compare' },
    { name: 'cart', path: '/cart', cart: true, shot: true },
    { name: 'checkout', path: '/checkout', cart: true, shot: true },
    { name: 'login', path: '/login' },
    { name: 'register', path: '/register' },
    { name: 'forgot', path: '/forgot' },
    { name: 'not-found', path: '/this-room-does-not-exist', expect404: true },
    { name: 'order-public', path: r.orderPublic },
    { name: 'account', path: '/account', auth: 'customer', shot: true },
    { name: 'account-orders', path: '/account/orders', auth: 'customer' },
    { name: 'account-order', path: r.accountOrder, auth: 'customer' },
    { name: 'account-addresses', path: '/account/addresses', auth: 'customer' },
    { name: 'account-reviews', path: '/account/reviews', auth: 'customer' },
    { name: 'account-loyalty', path: '/account/loyalty', auth: 'customer' },
    { name: 'account-settings', path: '/account/settings', auth: 'customer' },
  ];
  return t;
}

export function adminTargets(): Target[] {
  const r = JSON.parse(readFileSync(RESOLVED, 'utf8')) as Record<string, string>;
  const res = ['quotes', 'consultations', 'categories', 'rooms', 'materials', 'reviews', 'collections', 'brands', 'projects', 'designers', 'gallery', 'catalogues', 'catalogue-requests', 'trade-inquiries', 'contact-messages', 'coupons', 'newsletter', 'banners', 'pages', 'blog', 'faqs', 'showrooms', 'delivery-zones'];
  return [
    { name: 'admin-login', path: '/login' },
    { name: 'admin-dashboard', path: '/', auth: 'staff', shot: true },
    { name: 'admin-reports', path: '/reports', auth: 'staff' },
    { name: 'admin-orders', path: '/orders', auth: 'staff', shot: true },
    { name: 'admin-order', path: `/orders/${r.adminOrderId}`, auth: 'staff' },
    { name: 'admin-products', path: '/products', auth: 'staff' },
    { name: 'admin-product', path: `/products/${r.adminProductId}`, auth: 'staff', shot: true },
    { name: 'admin-product-new', path: '/products/new', auth: 'staff' },
    { name: 'admin-inventory', path: '/inventory', auth: 'staff' },
    { name: 'admin-customers', path: '/customers', auth: 'staff' },
    { name: 'admin-customer', path: `/customers/${r.adminCustomerId}`, auth: 'staff' },
    { name: 'admin-staff', path: '/staff', auth: 'staff' },
    { name: 'admin-settings', path: '/settings', auth: 'staff' },
    { name: 'admin-audit', path: '/audit', auth: 'staff' },
    { name: 'admin-media', path: '/media-library', auth: 'staff' },
    ...res.map((x) => ({ name: `admin-r-${x}`, path: `/r/${x}`, auth: 'staff' as const })),
    { name: 'admin-r-banner-edit', path: '/r/banners/1', auth: 'staff' },
    { name: 'admin-r-coupon-new', path: '/r/coupons/new', auth: 'staff' },
    { name: 'admin-404', path: '/no-such-admin-page', auth: 'staff' },
  ];
}
