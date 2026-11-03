/** Admin permission catalogue. `*.read` gates listing/reading, `*.write` gates create/update/delete. */
export const PERMISSION_GROUPS = {
  dashboard: ['dashboard.read'],
  products: ['products.read', 'products.write'],
  inventory: ['inventory.read', 'inventory.write'],
  catalog: ['catalog.read', 'catalog.write'], // categories, brands, collections, designers, rooms, materials
  showcase: ['showcase.read', 'showcase.write'], // projects, gallery, catalogues
  content: ['content.read', 'content.write'], // banners, pages, blog, faq
  orders: ['orders.read', 'orders.write'],
  customers: ['customers.read', 'customers.write'],
  reviews: ['reviews.read', 'reviews.write'],
  leads: ['leads.read', 'leads.write'], // quotes, consultations, trade, contact, catalogue requests
  marketing: ['marketing.read', 'marketing.write'], // coupons, newsletter
  delivery: ['delivery.read', 'delivery.write'], // zones
  showrooms: ['showrooms.read', 'showrooms.write'],
  reports: ['reports.read'],
  staff: ['staff.read', 'staff.write'],
  settings: ['settings.read', 'settings.write'],
  audit: ['audit.read'],
  media: ['media.write'],
} as const;

export type PermissionCode = (typeof PERMISSION_GROUPS)[keyof typeof PERMISSION_GROUPS][number];
export const ALL_PERMISSIONS = Object.values(PERMISSION_GROUPS).flat() as PermissionCode[];

const r = (...groups: (keyof typeof PERMISSION_GROUPS)[]) => groups.flatMap((g) => [...PERMISSION_GROUPS[g]]) as PermissionCode[];
const ro = (...groups: (keyof typeof PERMISSION_GROUPS)[]) =>
  groups.flatMap((g) => PERMISSION_GROUPS[g].filter((p) => p.endsWith('.read'))) as PermissionCode[];

export const ROLE_PRESETS: { name: string; description: string; permissions: PermissionCode[] }[] = [
  { name: 'Super Admin', description: 'Full access including staff, roles and settings', permissions: ALL_PERMISSIONS },
  { name: 'Catalog Manager', description: 'Products, inventory, catalog and showcase', permissions: [...ro('dashboard'), ...r('products', 'inventory', 'catalog', 'showcase', 'media'), ...ro('reviews')] },
  { name: 'Order Manager', description: 'Orders, customers, delivery', permissions: [...ro('dashboard', 'products', 'reports'), ...r('orders', 'customers', 'delivery')] },
  { name: 'Content Editor', description: 'CMS, blog, banners, gallery and catalogues', permissions: [...ro('dashboard'), ...r('content', 'showcase', 'media'), ...ro('catalog')] },
  { name: 'Showroom Manager', description: 'Showrooms, consultations and leads', permissions: [...ro('dashboard', 'orders', 'products'), ...r('showrooms', 'leads')] },
  { name: 'Marketing', description: 'Coupons, newsletter, reviews', permissions: [...ro('dashboard', 'products', 'reports'), ...r('marketing', 'reviews', 'content')] },
  { name: 'Support', description: 'Read orders and customers; handle leads and reviews', permissions: [...ro('dashboard', 'orders', 'customers', 'products'), ...r('leads', 'reviews')] },
  { name: 'Accountant', description: 'Reports and order finance (read only)', permissions: ro('dashboard', 'orders', 'reports', 'customers') },
];

export function hasPermission(perms: readonly string[] | undefined, needed: string): boolean {
  return !!perms && perms.includes(needed);
}
