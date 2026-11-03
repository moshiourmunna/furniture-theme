import type { FieldDef } from '@/components/fields';

export type ColType = 'text' | 'image' | 'bool' | 'status' | 'date' | 'datetime' | 'money' | 'count' | 'rating' | 'mono';
export interface Col { key: string; label: string; type?: ColType; get?: (r: Record<string, unknown>) => unknown }
export interface ResourceUi {
  title: [string, string]; group: string; singular: string; columns: Col[]; fields: FieldDef[];
  filters?: { name: string; label: string; options: string[] }[]; details?: string[]; noCreate?: boolean; storePath?: (r: Record<string, unknown>) => string | null;
}

const bi = (name: string, label: string, opts: Partial<FieldDef> = {}): FieldDef[] => [
  { name: `${name}En`, label: `${label} (EN)`, half: true, ...opts },
  { name: `${name}Bn`, label: `${label} (বাংলা)`, half: true, ...opts },
];
const slug: FieldDef = { name: 'slug', label: 'Slug', type: 'slug', half: true, hint: 'Leave blank to generate from the English name' };
const sort: FieldDef = { name: 'sortOrder', label: 'Sort order', type: 'number', half: true };
const active: FieldDef = { name: 'isActive', label: 'Active (visible on the store)', type: 'bool', half: true };
const seo: FieldDef[] = [...bi('metaTitle', 'SEO title'), ...bi('metaDesc', 'SEO description', { type: 'textarea', rows: 2 })];
const nameCol: Col = { key: 'nameEn', label: 'Name' };
const activeCol: Col = { key: 'isActive', label: 'Active', type: 'bool' };
const LEAD_STATUS = { quotes: ['new', 'measured', 'quoted', 'approved', 'production', 'closed'], consultations: ['requested', 'confirmed', 'completed', 'cancelled'], trade: ['new', 'contacted', 'proposal', 'won', 'lost'], contact: ['new', 'replied', 'closed'], catreq: ['new', 'dispatched', 'closed'] };

export const RESOURCE_UI: Record<string, ResourceUi> = {
  categories: {
    title: ['Categories', 'ক্যাটাগরি'], group: 'catalog', singular: 'category', storePath: (r) => `/shop/${r.slug}`,
    columns: [{ key: 'image', label: '', type: 'image' }, nameCol, { key: 'nameBn', label: 'বাংলা' }, { key: 'slug', label: 'Slug', type: 'mono' }, { key: 'products', label: 'Products', type: 'count', get: (r) => (r._count as { products: number })?.products }, activeCol],
    fields: [...bi('name', 'Name', { required: true }), slug, { name: 'parentId', label: 'Parent category', type: 'lookup', lookup: 'categories', half: true }, ...bi('desc', 'Description', { type: 'textarea' }), { name: 'image', label: 'Image', type: 'image', folder: 'categories' }, { name: 'icon', label: 'Icon name', half: true }, sort, active, ...seo],
  },
  rooms: { title: ['Rooms', 'রুম'], group: 'catalog', singular: 'room', columns: [{ key: 'image', label: '', type: 'image' }, nameCol, { key: 'nameBn', label: 'বাংলা' }, { key: 'slug', label: 'Slug', type: 'mono' }], fields: [...bi('name', 'Name', { required: true }), slug, sort, { name: 'image', label: 'Image', type: 'image', folder: 'rooms' }] },
  materials: { title: ['Materials', 'উপাদান'], group: 'catalog', singular: 'material', columns: [nameCol, { key: 'nameBn', label: 'বাংলা' }, { key: 'slug', label: 'Slug', type: 'mono' }], fields: [...bi('name', 'Name', { required: true }), slug, ...bi('care', 'Care guide', { type: 'textarea' })] },
  brands: {
    title: ['Brands & partners', 'ব্র্যান্ড ও পার্টনার'], group: 'catalog', singular: 'brand', storePath: (r) => `/brands/${r.slug}`,
    columns: [{ key: 'image', label: '', type: 'image' }, nameCol, { key: 'kind', label: 'Type', type: 'status' }, { key: 'products', label: 'Products', type: 'count', get: (r) => (r._count as { products: number })?.products }, activeCol],
    fields: [...bi('name', 'Name', { required: true }), slug, { name: 'kind', label: 'Type', type: 'select', options: [['own', 'Own brand'], ['partner', 'Partner']], half: true }, ...bi('tagline', 'Tagline'), ...bi('story', 'Story', { type: 'textarea', rows: 5 }), { name: 'image', label: 'Image', type: 'image', folder: 'brands' }, { name: 'since', label: 'Since', half: true }, sort, active],
  },
  designers: { title: ['Studio & designers', 'স্টুডিও ও ডিজাইনার'], group: 'catalog', singular: 'designer', columns: [{ key: 'image', label: '', type: 'image' }, nameCol, { key: 'roleEn', label: 'Role' }], fields: [...bi('name', 'Name', { required: true }), slug, sort, ...bi('role', 'Role'), ...bi('bio', 'Bio', { type: 'textarea', rows: 4 }), { name: 'image', label: 'Portrait', type: 'image', folder: 'designers' }] },
  collections: {
    title: ['Collections', 'কালেকশন'], group: 'catalog', singular: 'collection', storePath: (r) => `/collections/${r.slug}`,
    columns: [{ key: 'heroImage', label: '', type: 'image' }, nameCol, { key: 'year', label: 'Year' }, { key: 'brand', label: 'Brand', get: (r) => (r.brand as { nameEn: string } | null)?.nameEn }, { key: 'products', label: 'Products', type: 'count', get: (r) => (r._count as { products: number })?.products }, { key: 'isFeatured', label: 'Featured', type: 'bool' }, activeCol],
    fields: [...bi('name', 'Name', { required: true }), slug, { name: 'year', label: 'Year', half: true }, ...bi('intro', 'Introduction', { type: 'textarea', rows: 4 }), { name: 'brandId', label: 'Brand', type: 'lookup', lookup: 'brands', half: true }, { name: 'designerId', label: 'Designer', type: 'lookup', lookup: 'designers', half: true }, { name: 'heroImage', label: 'Hero image', type: 'image', folder: 'collections' }, { name: 'moodImages', label: 'Mood images', type: 'images', folder: 'collections' }, { name: 'isFeatured', label: 'Featured on home', type: 'bool', half: true }, active, sort],
  },
  projects: {
    title: ['Projects', 'প্রজেক্ট'], group: 'showcase', singular: 'project', storePath: (r) => `/projects/${r.slug}`,
    filters: [{ name: 'type', label: 'Type', options: ['residential', 'hospitality', 'corporate', 'retail'] }],
    columns: [{ key: 'heroImage', label: '', type: 'image' }, { key: 'titleEn', label: 'Title' }, { key: 'type', label: 'Type', type: 'status' }, { key: 'cityEn', label: 'City' }, { key: 'year', label: 'Year' }, { key: 'isFeatured', label: 'Featured', type: 'bool' }, activeCol],
    fields: [...bi('title', 'Title', { required: true }), slug, { name: 'type', label: 'Type', type: 'select', options: ['residential', 'hospitality', 'corporate', 'retail'], half: true, required: true }, ...bi('city', 'City'), { name: 'year', label: 'Year', half: true }, { name: 'area', label: 'Area (e.g. 4,200 sq ft)', half: true }, ...bi('scope', 'Scope', { type: 'textarea' }), ...bi('story', 'Story (HTML)', { type: 'html' }), { name: 'heroImage', label: 'Hero image', type: 'image', folder: 'projects' }, { name: 'images', label: 'Gallery images', type: 'images', folder: 'projects' }, { name: 'collectionSlugs', label: 'Collections used (slugs)', type: 'tags' }, { name: 'isFeatured', label: 'Featured', type: 'bool', half: true }, active, sort],
  },
  gallery: {
    title: ['Gallery', 'গ্যালারি'], group: 'showcase', singular: 'gallery image',
    filters: [{ name: 'category', label: 'Category', options: ['living', 'bedroom', 'dining', 'kitchen', 'office', 'kids', 'outdoor'] }],
    columns: [{ key: 'image', label: '', type: 'image' }, { key: 'titleEn', label: 'Title' }, { key: 'category', label: 'Category', type: 'status' }, { key: 'product', label: 'Linked product', get: (r) => (r.product as { nameEn: string } | null)?.nameEn }, activeCol],
    fields: [{ name: 'image', label: 'Image', type: 'image', required: true, folder: 'gallery' }, ...bi('title', 'Title', { required: true }), { name: 'category', label: 'Category', type: 'select', options: ['living', 'bedroom', 'dining', 'kitchen', 'office', 'kids', 'outdoor'], half: true, required: true }, { name: 'room', label: 'Room slug', half: true }, { name: 'brandSlug', label: 'Brand slug', half: true }, { name: 'collectionSlug', label: 'Collection slug', half: true }, { name: 'material', label: 'Material slug', half: true }, { name: 'projectType', label: 'Project type', type: 'select', options: ['residential', 'hospitality', 'corporate', 'retail'], nullable: true, half: true }, { name: 'productId', label: 'Shop-the-piece product', type: 'lookup', lookup: 'products', half: true }, { name: 'hotspotX', label: 'Hotspot X (%)', type: 'number', min: 0, max: 100, half: true }, { name: 'hotspotY', label: 'Hotspot Y (%)', type: 'number', min: 0, max: 100, half: true }, { name: 'tall', label: 'Tall tile', type: 'bool', half: true }, active, sort],
  },
  catalogues: {
    title: ['Catalogues', 'ক্যাটালগ বই'], group: 'showcase', singular: 'catalogue', storePath: (r) => `/catalogues/${r.slug}`,
    filters: [{ name: 'kind', label: 'Kind', options: ['master', 'category', 'brand', 'collection'] }],
    columns: [{ key: 'coverImage', label: '', type: 'image' }, { key: 'titleEn', label: 'Title' }, { key: 'kind', label: 'Kind', type: 'status' }, { key: 'season', label: 'Season' }, { key: 'pages', label: 'Pages', type: 'count' }, activeCol],
    fields: [...bi('title', 'Title', { required: true }), slug, { name: 'kind', label: 'Kind', type: 'select', options: ['master', 'category', 'brand', 'collection'], half: true, required: true }, { name: 'ref', label: 'Reference slug', half: true }, { name: 'season', label: 'Season', half: true }, { name: 'coverImage', label: 'Cover', type: 'image', folder: 'catalogues' }, { name: 'pdfUrl', label: 'PDF URL', required: true }, { name: 'pageImages', label: 'Page images (flipbook, in order)', type: 'images', folder: 'catalogues' }, { name: 'pages', label: 'Pages', type: 'number', half: true }, { name: 'sizeKb', label: 'PDF size (KB)', type: 'number', half: true }, active, sort],
  },
  'catalogue-requests': { title: ['Catalogue requests', 'ক্যাটালগ অনুরোধ'], group: 'leads', singular: 'request', noCreate: true, filters: [{ name: 'status', label: 'Status', options: LEAD_STATUS.catreq }], columns: [{ key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' }, { key: 'address', label: 'Address' }, { key: 'status', label: 'Status', type: 'status' }, { key: 'createdAt', label: 'Received', type: 'datetime' }], details: ['name', 'phone', 'email', 'address', 'catalogues'], fields: [{ name: 'status', label: 'Status', type: 'select', options: LEAD_STATUS.catreq }] },
  banners: {
    title: ['Banners', 'ব্যানার'], group: 'content', singular: 'banner', filters: [{ name: 'placement', label: 'Placement', options: ['home-hero', 'home-promo', 'shop-top'] }],
    columns: [{ key: 'image', label: '', type: 'image' }, { key: 'titleEn', label: 'Title' }, { key: 'placement', label: 'Placement', type: 'status' }, { key: 'startsAt', label: 'Starts', type: 'date' }, { key: 'endsAt', label: 'Ends', type: 'date' }, activeCol],
    fields: [{ name: 'placement', label: 'Placement', type: 'select', options: ['home-hero', 'home-promo', 'shop-top'], half: true }, sort, ...bi('title', 'Title', { required: true }), ...bi('subtitle', 'Subtitle', { type: 'textarea', rows: 2 }), ...bi('cta', 'Button label'), { name: 'href', label: 'Link (e.g. /collections/aranya)', half: true }, { name: 'image', label: 'Image', type: 'image', required: true, folder: 'banners' }, { name: 'startsAt', label: 'Starts', type: 'datetime', half: true }, { name: 'endsAt', label: 'Ends', type: 'datetime', half: true }, active],
  },
  pages: {
    title: ['Pages', 'পেজ'], group: 'content', singular: 'page', storePath: (r) => (r.isPolicy ? `/policy/${r.slug}` : r.slug === 'about' ? '/about' : null),
    columns: [{ key: 'titleEn', label: 'Title' }, { key: 'slug', label: 'Slug', type: 'mono' }, { key: 'isPolicy', label: 'Policy', type: 'bool' }, { key: 'isPublished', label: 'Published', type: 'bool' }, { key: 'updatedAt', label: 'Updated', type: 'date' }],
    fields: [...bi('title', 'Title', { required: true }), slug, { name: 'isPolicy', label: 'Policy page (listed under /policy)', type: 'bool', half: true }, { name: 'bodyEn', label: 'Body (EN, HTML)', type: 'html', required: true }, { name: 'bodyBn', label: 'Body (বাংলা, HTML)', type: 'html', required: true }, ...bi('metaDesc', 'SEO description', { type: 'textarea', rows: 2 }), { name: 'isPublished', label: 'Published', type: 'bool', half: true }],
  },
  blog: {
    title: ['Journal', 'জার্নাল'], group: 'content', singular: 'post', storePath: (r) => `/journal/${r.slug}`,
    columns: [{ key: 'coverImage', label: '', type: 'image' }, { key: 'titleEn', label: 'Title' }, { key: 'categoryEn', label: 'Category' }, { key: 'publishedAt', label: 'Published', type: 'date' }, { key: 'isPublished', label: 'Live', type: 'bool' }],
    fields: [...bi('title', 'Title', { required: true }), slug, { name: 'publishedAt', label: 'Publish date', type: 'datetime', half: true }, ...bi('category', 'Category', { required: true }), ...bi('excerpt', 'Excerpt', { type: 'textarea', rows: 2 }), { name: 'bodyEn', label: 'Body (EN, HTML)', type: 'html', required: true }, { name: 'bodyBn', label: 'Body (বাংলা, HTML)', type: 'html', required: true }, { name: 'coverImage', label: 'Cover image', type: 'image', folder: 'blog' }, { name: 'authorName', label: 'Author', half: true }, { name: 'readMinutes', label: 'Read time (min)', type: 'number', half: true }, { name: 'isPublished', label: 'Published', type: 'bool', half: true }],
  },
  faqs: { title: ['FAQs', 'প্রশ্নোত্তর'], group: 'content', singular: 'FAQ', columns: [{ key: 'questionEn', label: 'Question' }, { key: 'groupEn', label: 'Group' }, { key: 'sortOrder', label: 'Order', type: 'count' }, activeCol], fields: [...bi('group', 'Group', { required: true }), ...bi('question', 'Question', { required: true }), ...bi('answer', 'Answer', { type: 'textarea', rows: 4, required: true }), sort, active] },
  coupons: {
    title: ['Coupons', 'কুপন'], group: 'marketing', singular: 'coupon',
    columns: [{ key: 'code', label: 'Code', type: 'mono' }, { key: 'type', label: 'Type', type: 'status' }, { key: 'value', label: 'Value', type: 'count' }, { key: 'minSubtotal', label: 'Min. order', type: 'money' }, { key: 'usedCount', label: 'Used', type: 'count', get: (r) => `${r.usedCount}${r.usageLimit ? ` / ${r.usageLimit}` : ''}` }, { key: 'endsAt', label: 'Ends', type: 'date' }, activeCol],
    fields: [{ name: 'code', label: 'Code', required: true, half: true, hint: 'Letters, numbers, - and _' }, { name: 'type', label: 'Type', type: 'select', options: [['percent', 'Percent off'], ['fixed', 'Fixed ৳ off'], ['shipping', 'Free delivery']], half: true, required: true }, { name: 'value', label: 'Value (% or ৳)', type: 'number', half: true, required: true, min: 0 }, { name: 'maxDiscount', label: 'Max discount (৳)', type: 'number', half: true }, { name: 'minSubtotal', label: 'Minimum order (৳)', type: 'number', half: true }, { name: 'usageLimit', label: 'Total uses limit', type: 'number', half: true }, { name: 'perUserLimit', label: 'Uses per customer', type: 'number', half: true }, ...bi('description', 'Description'), { name: 'startsAt', label: 'Starts', type: 'datetime', half: true }, { name: 'endsAt', label: 'Ends', type: 'datetime', half: true }, active],
  },
  newsletter: { title: ['Newsletter', 'নিউজলেটার'], group: 'marketing', singular: 'subscriber', noCreate: true, columns: [{ key: 'email', label: 'Email' }, { key: 'locale', label: 'Language', type: 'status' }, { key: 'createdAt', label: 'Subscribed', type: 'datetime' }], fields: [{ name: 'locale', label: 'Language', type: 'select', options: ['en', 'bn'] }] },
  'delivery-zones': {
    title: ['Delivery zones', 'ডেলিভারি জোন'], group: 'delivery', singular: 'zone',
    columns: [nameCol, { key: 'code', label: 'Code', type: 'mono' }, { key: 'charge', label: 'Charge', type: 'money' }, { key: 'freeOver', label: 'Free over', type: 'money' }, { key: 'leadDaysMin', label: 'Lead days', get: (r) => `${r.leadDaysMin}–${r.leadDaysMax}` }, { key: 'codAvailable', label: 'COD', type: 'bool' }, activeCol],
    fields: [...bi('name', 'Name', { required: true }), { name: 'code', label: 'Code', type: 'slug', required: true, half: true }, sort, { name: 'divisions', label: 'Divisions (use * for all)', type: 'tags' }, { name: 'districts', label: 'Districts (blank = whole division)', type: 'tags' }, { name: 'charge', label: 'Delivery charge (৳)', type: 'number', half: true, required: true }, { name: 'freeOver', label: 'Free delivery over (৳)', type: 'number', half: true }, { name: 'assemblyFee', label: 'Assembly fee (৳)', type: 'number', half: true }, { name: 'leadDaysMin', label: 'Lead days (min)', type: 'number', half: true }, { name: 'leadDaysMax', label: 'Lead days (max)', type: 'number', half: true }, { name: 'codAvailable', label: 'Cash on delivery available', type: 'bool', half: true }, active],
  },
  showrooms: {
    title: ['Showrooms', 'শোরুম'], group: 'showrooms', singular: 'showroom',
    columns: [{ key: 'image', label: '', type: 'image' }, nameCol, { key: 'city', label: 'City' }, { key: 'phone', label: 'Phone' }, { key: 'isFlagship', label: 'Flagship', type: 'bool' }, activeCol],
    fields: [...bi('name', 'Name', { required: true }), slug, { name: 'city', label: 'City', half: true, required: true }, ...bi('address', 'Address', { required: true }), { name: 'phone', label: 'Phone', half: true, required: true }, { name: 'hours', label: 'Hours', half: true }, { name: 'lat', label: 'Latitude', type: 'number', half: true, required: true }, { name: 'lng', label: 'Longitude', type: 'number', half: true, required: true }, { name: 'services', label: 'Services', type: 'tags' }, { name: 'image', label: 'Photo', type: 'image', folder: 'showrooms' }, { name: 'isFlagship', label: 'Flagship', type: 'bool', half: true }, active, sort],
  },
  reviews: {
    title: ['Reviews', 'রিভিউ'], group: 'reviews', singular: 'review', noCreate: true, filters: [{ name: 'status', label: 'Status', options: ['pending', 'approved', 'rejected'] }],
    columns: [{ key: 'product', label: 'Product', get: (r) => (r.product as { nameEn: string })?.nameEn }, { key: 'authorName', label: 'Author' }, { key: 'rating', label: 'Rating', type: 'rating' }, { key: 'title', label: 'Title' }, { key: 'status', label: 'Status', type: 'status' }, { key: 'createdAt', label: 'Date', type: 'date' }],
    details: ['authorName', 'location', 'rating', 'title', 'body', 'photos', 'verified'], fields: [{ name: 'status', label: 'Status', type: 'select', options: ['pending', 'approved', 'rejected'] }, { name: 'reply', label: 'Public reply from Shekor', type: 'textarea', rows: 3 }],
  },
  quotes: {
    title: ['Quotes & custom orders', 'কোটেশন ও কাস্টম'], group: 'leads', singular: 'quote', noCreate: true, filters: [{ name: 'status', label: 'Status', options: LEAD_STATUS.quotes }],
    columns: [{ key: 'ref', label: 'Ref', type: 'mono' }, { key: 'name', label: 'Customer' }, { key: 'pieceType', label: 'Piece' }, { key: 'budget', label: 'Budget' }, { key: 'quoteAmount', label: 'Quote', type: 'money' }, { key: 'status', label: 'Status', type: 'status' }, { key: 'createdAt', label: 'Received', type: 'date' }],
    details: ['ref', 'name', 'phone', 'email', 'city', 'pieceType', 'material', 'dimensions', 'budget', 'details'], fields: [{ name: 'status', label: 'Status', type: 'select', options: LEAD_STATUS.quotes, half: true }, { name: 'quoteAmount', label: 'Quote amount (৳)', type: 'number', half: true }, { name: 'adminNotes', label: 'Internal notes', type: 'textarea', rows: 3 }],
  },
  consultations: {
    title: ['Consultations', 'পরামর্শ বুকিং'], group: 'leads', singular: 'booking', noCreate: true, filters: [{ name: 'status', label: 'Status', options: LEAD_STATUS.consultations }, { name: 'mode', label: 'Mode', options: ['showroom', 'home', 'video'] }],
    columns: [{ key: 'ref', label: 'Ref', type: 'mono' }, { key: 'name', label: 'Customer' }, { key: 'mode', label: 'Mode', type: 'status' }, { key: 'showroom', label: 'Showroom', get: (r) => (r.showroom as { nameEn: string } | null)?.nameEn }, { key: 'date', label: 'Date', type: 'date' }, { key: 'timeSlot', label: 'Slot' }, { key: 'status', label: 'Status', type: 'status' }],
    details: ['ref', 'name', 'phone', 'email', 'mode', 'rooms', 'notes'], fields: [{ name: 'status', label: 'Status', type: 'select', options: LEAD_STATUS.consultations, half: true }, { name: 'date', label: 'Date', type: 'date', half: true }, { name: 'timeSlot', label: 'Time slot', half: true }],
  },
  'trade-inquiries': {
    title: ['Trade inquiries', 'ট্রেড অনুসন্ধান'], group: 'leads', singular: 'inquiry', noCreate: true, filters: [{ name: 'status', label: 'Status', options: LEAD_STATUS.trade }],
    columns: [{ key: 'ref', label: 'Ref', type: 'mono' }, { key: 'company', label: 'Company' }, { key: 'contactName', label: 'Contact' }, { key: 'sector', label: 'Sector', type: 'status' }, { key: 'projectSize', label: 'Size' }, { key: 'status', label: 'Status', type: 'status' }, { key: 'createdAt', label: 'Received', type: 'date' }],
    details: ['ref', 'company', 'contactName', 'phone', 'email', 'sector', 'projectSize', 'timeline', 'message'], fields: [{ name: 'status', label: 'Status', type: 'select', options: LEAD_STATUS.trade }],
  },
  'contact-messages': {
    title: ['Messages', 'বার্তা'], group: 'leads', singular: 'message', noCreate: true, filters: [{ name: 'status', label: 'Status', options: LEAD_STATUS.contact }],
    columns: [{ key: 'name', label: 'From' }, { key: 'subject', label: 'Subject' }, { key: 'email', label: 'Email' }, { key: 'status', label: 'Status', type: 'status' }, { key: 'createdAt', label: 'Received', type: 'datetime' }],
    details: ['name', 'email', 'phone', 'subject', 'message'], fields: [{ name: 'status', label: 'Status', type: 'select', options: LEAD_STATUS.contact }],
  },
};
