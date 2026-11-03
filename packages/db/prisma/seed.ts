/* Shekor seed — realistic BD furniture data built from the approved mockup content model.
 * Idempotent: wipes all tables then inserts. Run: pnpm db:seed */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { PrismaClient, type OrderStatus, type PaymentStatus, type StockStatus } from '@prisma/client';
import { ALL_PERMISSIONS, PERMISSION_GROUPS, ROLE_PRESETS } from '../../shared/src/permissions';
import { pointsForAmount, tierFor } from '../../shared/src/commerce';

const here = dirname(fileURLToPath(import.meta.url));
const M = JSON.parse(readFileSync(join(here, 'seed-data/mockup.json'), 'utf8'));
const MANIFEST: Record<string, { pages: number; mb: number }> = JSON.parse(readFileSync(join(here, 'seed-data/catalogue-manifest.json'), 'utf8'));
const prisma = new PrismaClient();

// deterministic PRNG so every seed run produces the same data
let s = 20261103;
const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
const ri = (a: number, b: number) => Math.floor(rnd() * (b - a + 1)) + a;
const pickOne = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const img = (name: string) => `/media/img/${name}.webp`;
const daysAgo = (d: number, h = 0) => new Date(Date.now() - d * 86400_000 - h * 3600_000);

export const SEED_PASSWORDS = { staff: 'Shekor@2026', customer: 'Customer@2026' };

const SWATCH_NAMES: Record<string, [string, string]> = {
  '#1f2421': ['Charcoal', 'চারকোল'], '#2f3a33': ['Forest ink', 'গাঢ় সবুজ'], '#2f5d50': ['Bottle green', 'বোতল সবুজ'], '#3b2f27': ['Dark walnut', 'গাঢ় ওয়ালনাট'],
  '#3d4a5c': ['Indigo', 'নীল'], '#55606e': ['Slate', 'স্লেট'], '#5b3a29': ['Mahogany', 'মেহগনি'], '#6b4a33': ['Walnut', 'ওয়ালনাট'], '#7a8b74': ['Sage linen', 'সেজ লিনেন'],
  '#7b2d3b': ['Wine velvet', 'ওয়াইন ভেলভেট'], '#7c4a2d': ['Natural Segun', 'প্রাকৃতিক সেগুন'], '#8a5a3c': ['Honey mahogany', 'মধু মেহগনি'], '#8fb8a8': ['Mint', 'মিন্ট'],
  '#a57a52': ['Light mahogany', 'হালকা মেহগনি'], '#b08d57': ['Brushed brass', 'ব্রাশড ব্রাস'], '#b5651d': ['Rust', 'মরিচা'], '#b8b2a7': ['Stone', 'স্টোন'],
  '#c8a27a': ['Natural oak', 'প্রাকৃতিক ওক'], '#c9b79c': ['Oat', 'ওট'], '#d9c7a5': ['Jute', 'পাট'], '#e9e1d4': ['Ivory lacquer', 'আইভরি'], '#f2ede4': ['Chalk white', 'সাদা'],
};

const DIMS: Record<string, [number, number, number, number?]> = {
  sofas: [214, 92, 84, 3], beds: [198, 213, 110], dining: [180, 95, 76, 6], almirah: [180, 60, 210], showcase: [120, 42, 190], divan: [190, 80, 72, 2],
  tables: [110, 60, 42], chairs: [74, 80, 86, 1], office: [160, 75, 76], kids: [100, 200, 160], storage: [90, 35, 180], decor: [40, 40, 160],
};
const CARE: Record<string, [string, string]> = {
  teak: ['Dust with a dry cotton cloth. Re-oil twice a year. Keep away from direct sun and AC vents.', 'শুকনো সুতি কাপড়ে ধুলা মুছুন। বছরে দুবার তেল দিন। সরাসরি রোদ ও এসির বাতাস থেকে দূরে রাখুন।'],
  mahogany: ['Wipe with a soft dry cloth; polish with wax every six months. Use coasters for hot dishes.', 'নরম শুকনো কাপড়ে মুছুন; ছয় মাস অন্তর মোম পালিশ করুন। গরম পাত্রের নিচে কোস্টার ব্যবহার করুন।'],
};

// Extra catalogue depth (on top of the 24 mockup products) so filters/sort/pagination are meaningful.
const EXTRA: [string, string, string, string, string, number, string, string | null][] = [
  // en, bn, cat, room, material, price, img, badge
  ['Hijol 2-Seater Loveseat', 'হিজল ২-সিটার লাভসিট', 'sofas', 'living', 'fabric', 56500, 'g-sofa-3', 'new'],
  ['Krishnachura Velvet Sofa', 'কৃষ্ণচূড়া ভেলভেট সোফা', 'sofas', 'living', 'velvet', 98000, 'g-sofa-5', null],
  ['Bokul Leatherette Recliner', 'বকুল লেদারেট রিক্লাইনার', 'sofas', 'living', 'leather', 47500, 'p-arm-1', 'sale'],
  ['Shonali Queen Bed', 'সোনালি কুইন খাট', 'beds', 'bedroom', 'teak', 78000, 'room-bedroom', null],
  ['Nilgiri Upholstered Bed', 'নীলগিরি আপহোলস্টার্ড খাট', 'beds', 'bedroom', 'fabric', 69500, 'p-bed-2', 'new'],
  ['Teesta 4-Seater Dining Set', 'তিস্তা ৪-সিটার ডাইনিং সেট', 'dining', 'dining-room', 'oak', 62000, 'room-dining', 'sale'],
  ['Karnaphuli Marble-Top Dining', 'কর্ণফুলী মার্বেল-টপ ডাইনিং', 'dining', 'dining-room', 'mahogany', 154000, 'hero-2', 'made'],
  ['Mohua 3-Door Wardrobe', 'মহুয়া ৩-দরজা ওয়ার্ডরোব', 'almirah', 'bedroom', 'mdf', 48500, 'cat-wardrobe', null],
  ['Lalbagh Carved Almirah', 'লালবাগ খোদাই আলমারি', 'almirah', 'bedroom', 'mahogany', 112000, 'p-wardrobe-1', 'made'],
  ['Chandni Curio Cabinet', 'চাঁদনি কিউরিও কেবিনেট', 'showcase', 'living', 'teak', 52000, 'cat-cabinet', null],
  ['Ilish Teak Daybed', 'ইলিশ সেগুন ডে-বেড', 'divan', 'living', 'teak', 44500, 'cat-divan', 'new'],
  ['Dighi Nesting Tables (Set of 3)', 'দীঘি নেস্টিং টেবিল (৩টি)', 'tables', 'living', 'oak', 15500, 'cat-table', null],
  ['Shapla Marble Side Table', 'শাপলা মার্বেল সাইড টেবিল', 'tables', 'living', 'metal', 11900, 'look-1', 'sale'],
  ['Moyur Cane Lounge Chair', 'ময়ূর বেতের লাউঞ্জ চেয়ার', 'chairs', 'outdoor', 'cane', 19800, 'ugc-4', 'new'],
  ['Pakhi Dining Chair (Pair)', 'পাখি ডাইনিং চেয়ার (জোড়া)', 'chairs', 'dining-room', 'teak', 21000, 'cat-chair', null],
  ['Kormo Bench Workstation (4-Seat)', 'কর্ম বেঞ্চ ওয়ার্কস্টেশন (৪ সিট)', 'office', 'office-room', 'mdf', 88000, 'cat-office', null],
  ['Shabash Meeting Table', 'সাবাশ মিটিং টেবিল', 'office', 'office-room', 'oak', 72000, 'room-office', 'made'],
  ['Projapoti Study Desk', 'প্রজাপতি স্টাডি ডেস্ক', 'kids', 'kids-room', 'beech', 17500, 'cat-kids', null],
  ['Tuntuni Toy Chest', 'টুনটুনি খেলনার বাক্স', 'kids', 'kids-room', 'rubber', 8900, 'room-kids', 'sale'],
  ['Ghuri Wall Shelf', 'ঘুড়ি ওয়াল শেলফ', 'storage', 'living', 'teak', 7400, 'cat-shelf', null],
  ['Dheu Shoe Cabinet', 'ঢেউ জুতার কেবিনেট', 'storage', 'living', 'mdf', 13500, 'about-workshop', null],
  ['Prodip Brass Table Lamp', 'প্রদীপ ব্রাস টেবিল ল্যাম্প', 'decor', 'bedroom', 'metal', 6500, 'cat-decor', 'new'],
  ['Nakshi Kantha Cushion Set', 'নকশিকাঁথা কুশন সেট', 'decor', 'living', 'fabric', 4200, 'look-2', null],
  ['Megh Linen Pendant', 'মেঘ লিনেন পেন্ডেন্ট', 'decor', 'dining-room', 'fabric', 9800, 'look-3', 'sale'],
];

const FIRST = ['Farhana', 'Tanvir', 'Nusrat', 'Arif', 'Sadia', 'Mahmudul', 'Rumana', 'Kamrul', 'Jannatul', 'Shafiqul', 'Ayesha', 'Rakib', 'Tahmina', 'Imran', 'Sharmin', 'Fahim', 'Nabila', 'Zahid', 'Mithila', 'Asif', 'Lamia', 'Sabbir', 'Tasnim', 'Rezaul', 'Moumita', 'Naim', 'Afsana', 'Hasibul', 'Sumaiya', 'Ehsan'];
const LAST = ['Rahman', 'Hossain', 'Jahan', 'Chowdhury', 'Islam', 'Hasan', 'Akter', 'Ferdous', 'Alam', 'Khan', 'Ahmed', 'Sarker', 'Kabir', 'Haque', 'Uddin', 'Mahmud', 'Begum', 'Talukder'];
const AREAS: Record<string, [string, string][]> = {
  Dhaka: [['Dhaka', 'Gulshan 2'], ['Dhaka', 'Banani'], ['Dhaka', 'Dhanmondi 27'], ['Dhaka', 'Uttara Sector 4'], ['Dhaka', 'Mirpur DOHS'], ['Dhaka', 'Bashundhara R/A'], ['Gazipur', 'Tongi'], ['Narayanganj', 'Fatullah']],
  Chattogram: [['Chattogram', 'Khulshi'], ['Chattogram', 'Agrabad'], ['Cumilla', 'Kandirpar'], ["Cox's Bazar", 'Kolatoli']],
  Sylhet: [['Sylhet', 'Zindabazar'], ['Moulvibazar', 'Srimangal']],
  Rajshahi: [['Rajshahi', 'Uposhohor'], ['Bogura', 'Satmatha']],
  Khulna: [['Khulna', 'Sonadanga'], ['Jashore', 'Doratana']],
};

async function wipe() {
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0');
  const tables: { TABLE_NAME: string }[] = await prisma.$queryRawUnsafe(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME <> '_prisma_migrations'",
  );
  for (const t of tables) await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${t.TABLE_NAME}\``);
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1');
}

async function main() {
  const t0 = Date.now();
  await wipe();

  // ── RBAC ──
  const groupOf = (code: string) => Object.entries(PERMISSION_GROUPS).find(([, v]) => (v as readonly string[]).includes(code))![0];
  await prisma.permission.createMany({ data: ALL_PERMISSIONS.map((code) => ({ code, group: groupOf(code), label: code.replace('.', ' · ') })) });
  const perms = await prisma.permission.findMany();
  const permId = Object.fromEntries(perms.map((p) => [p.code, p.id]));
  const roles: Record<string, number> = {};
  for (const r of ROLE_PRESETS) {
    const role = await prisma.role.create({
      data: { name: r.name, description: r.description, isSystem: r.name === 'Super Admin', permissions: { create: r.permissions.map((c) => ({ permissionId: permId[c] })) } },
    });
    roles[r.name] = role.id;
  }
  const staffHash = await bcrypt.hash(SEED_PASSWORDS.staff, 10);
  const staff = [
    ['Moshiour Rahman', 'admin@shekor.com.bd', '01700000001', 'Super Admin'],
    ['Nabila Haque', 'catalog@shekor.com.bd', '01700000002', 'Catalog Manager'],
    ['Rafiq Ahmed', 'orders@shekor.com.bd', '01700000003', 'Order Manager'],
    ['Sumaiya Akter', 'content@shekor.com.bd', '01700000004', 'Content Editor'],
    ['Imran Kabir', 'support@shekor.com.bd', '01700000005', 'Support'],
    ['Lamia Sarker', 'accounts@shekor.com.bd', '01700000006', 'Accountant'],
  ];
  for (const [name, email, phone, role] of staff)
    await prisma.user.create({ data: { kind: 'STAFF', name, email, phone, passwordHash: staffHash, roleId: roles[role], emailVerified: new Date(), phoneVerified: new Date() } });

  // ── Taxonomy ──
  for (const [i, c] of M.categories.entries())
    await prisma.category.create({ data: { slug: c.slug, nameEn: c.en, nameBn: c.bn, icon: c.icon, image: img(c.image), sortOrder: i,
      descEn: `Hand-finished ${c.en.toLowerCase()} in seasoned Segun, Mahogany and Oak — made in our Gazipur workshop and delivered across Bangladesh.`,
      descBn: `শুকানো সেগুন, মেহগনি ও ওকে হাতে ফিনিশ করা ${c.bn} — গাজীপুরের কারখানায় তৈরি, সারা বাংলাদেশে ডেলিভারি।` } });
  for (const [i, r] of M.rooms.entries()) await prisma.room.create({ data: { slug: r.slug, nameEn: r.en, nameBn: r.bn, image: img(r.image), sortOrder: i } });
  for (const m of M.materials) await prisma.material.create({ data: { slug: m.slug, nameEn: m.en, nameBn: m.bn, careEn: (CARE[m.slug] ?? CARE.teak)[0], careBn: (CARE[m.slug] ?? CARE.teak)[1] } });
  for (const [i, b] of M.brands.entries())
    await prisma.brand.create({ data: { slug: b.slug, nameEn: b.en, nameBn: b.bn, kind: b.kind, taglineEn: b.tagEn, taglineBn: b.tagBn, storyEn: b.storyEn, storyBn: b.storyBn, image: img(b.image), since: b.since, sortOrder: i } });
  for (const [i, d] of M.designers.entries())
    await prisma.designer.create({ data: { slug: d.slug, nameEn: d.en, nameBn: d.bn, roleEn: d.roleEn, roleBn: d.roleBn, bioEn: d.bioEn, bioBn: d.bioBn, image: img(d.image), sortOrder: i } });
  const cat = Object.fromEntries((await prisma.category.findMany()).map((x) => [x.slug, x.id]));
  const room = Object.fromEntries((await prisma.room.findMany()).map((x) => [x.slug, x.id]));
  const mat = Object.fromEntries((await prisma.material.findMany()).map((x) => [x.slug, x.id]));
  const brand = Object.fromEntries((await prisma.brand.findMany()).map((x) => [x.slug, x.id]));
  const designer = Object.fromEntries((await prisma.designer.findMany()).map((x) => [x.slug, x.id]));
  for (const [i, c] of M.collections.entries())
    await prisma.collection.create({ data: { slug: c.slug, nameEn: c.en, nameBn: c.bn, introEn: c.introEn, introBn: c.introBn, year: c.year, heroImage: img(c.hero), moodImages: c.mood.map(img), brandId: brand[c.brand], designerId: designer[c.designer], isFeatured: i < 3, sortOrder: i } });
  const coll = Object.fromEntries((await prisma.collection.findMany()).map((x) => [x.slug, x]));
  const productCollection: Record<number, string> = {};
  for (const c of M.collections) for (const pid of c.products) productCollection[pid] ??= c.slug;
  const brandFor = (catSlug: string, collSlug?: string) =>
    collSlug ? coll[collSlug].brandId : catSlug === 'kids' ? brand.kids : catSlug === 'office' ? brand.contract : catSlug === 'decor' ? brand.alo : brand.atelier;

  // ── Products ──
  type P = { id: number; slug: string; en: string; bn: string; cat: string; room: string; mat: string; price: number; old: number | null; rating: number; reviews: number; badge: string | null; img: string; sw: string[]; stock: string; lead: number };
  const all: P[] = [...M.products];
  EXTRA.forEach(([en, bn, c, r, m, price, im, badge], i) => {
    const old = badge === 'sale' ? Math.round((price * 1.15) / 500) * 500 : null;
    all.push({ id: 200 + i, slug: en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, ''), en, bn, cat: c, room: r, mat: m, price, old, rating: 4.2 + ri(0, 7) / 10, reviews: ri(4, 60), badge, img: im, sw: [pickOne(Object.keys(SWATCH_NAMES)), pickOne(Object.keys(SWATCH_NAMES))].filter((v, j, a) => a.indexOf(v) === j), stock: badge === 'made' ? 'made' : ri(0, 9) === 0 ? 'low' : 'in', lead: badge === 'made' ? 21 : ri(2, 7) });
  });
  const ALT: Record<string, string[]> = { sofas: ['g-sofa-2', 'look-1'], beds: ['room-bedroom', 'hero-3'], dining: ['room-dining', 'hero-2'], chairs: ['look-3', 'room-living'], office: ['room-office', 'blog-office'], kids: ['room-kids', 'cat-kids'], tables: ['look-1', 'room-living'], storage: ['cat-shelf', 'about-workshop'], almirah: ['cat-wardrobe', 'room-bedroom'], showcase: ['cat-cabinet', 'room-living'], divan: ['cat-divan', 'room-living'], decor: ['cat-decor', 'look-2'] };
  const prodId: Record<number, number> = {};
  for (const [i, p] of all.entries()) {
    const d = DIMS[p.cat] ?? [100, 50, 80];
    const matRow = M.materials.find((m: { slug: string }) => m.slug === p.mat);
    const stock: StockStatus = p.stock === 'made' ? 'MADE_TO_ORDER' : p.stock === 'low' ? 'LOW' : 'IN_STOCK';
    const collSlug = productCollection[p.id];
    const created = await prisma.product.create({
      data: {
        slug: p.slug, sku: `SHK-${String(p.id).padStart(4, '0')}`, nameEn: p.en, nameBn: p.bn,
        shortEn: `${matRow.en} ${p.cat === 'decor' ? 'piece' : 'frame'}, hand-finished in Gazipur. ${d[3] ? `Seats ${d[3]}.` : ''}`.trim(),
        shortBn: `${matRow.bn}, গাজীপুরে হাতে ফিনিশ করা।${d[3] ? ` ${d[3]} জনের বসার ব্যবস্থা।` : ''}`,
        descriptionEn: `<p>The ${p.en} is built the slow way: kiln-seasoned ${matRow.en.toLowerCase()} cut and joined by hand with mortise-and-tenon joints, then finished with layers of hand-rubbed oil and wax.</p><p>Every Shekor piece carries a ${p.cat === 'decor' ? '1' : '10'}-year frame warranty and is delivered and assembled by our own white-glove team inside Dhaka and Chattogram.</p><ul><li>Termite-treated, moisture-stabilised timber for Bangladesh's monsoon</li><li>Low-VOC finishes, safe for homes with children</li><li>Made in Bangladesh by master karigors</li></ul>`,
        descriptionBn: `<p>${p.bn} ধীরে তৈরি: কিলনে শুকানো ${matRow.bn} হাতে কেটে মর্টিস-অ্যান্ড-টেনন জোড়ায় জোড়া লাগানো, তারপর হাতে ঘষা তেল ও মোমের কয়েক স্তর ফিনিশ।</p><p>প্রতিটি শেকড় পিসে ${p.cat === 'decor' ? '১' : '১০'} বছরের ফ্রেম ওয়ারেন্টি; ঢাকা ও চট্টগ্রামে আমাদের নিজস্ব টিম ডেলিভারি ও অ্যাসেম্বলি করে।</p><ul><li>বর্ষার জন্য উইপোকা-রোধী, আর্দ্রতা-স্থিত কাঠ</li><li>কম-ভিওসি ফিনিশ, শিশুদের জন্য নিরাপদ</li><li>ওস্তাদ কারিগরদের হাতে বাংলাদেশে তৈরি</li></ul>`,
        categoryId: cat[p.cat], roomId: room[p.room], materialId: mat[p.mat], brandId: brandFor(p.cat, collSlug), collectionId: collSlug ? coll[collSlug].id : null,
        price: p.price, compareAtPrice: p.old, badge: p.badge, stockStatus: stock, leadTimeDays: p.lead,
        widthCm: d[0], depthCm: d[1], heightCm: d[2], seats: d[3] ?? null, weightKg: Math.round(d[0] * d[1] * d[2] / 40000), emiAvailable: p.price >= 10000,
        warrantyYears: p.cat === 'decor' ? 1 : 10, ratingAvg: p.rating, ratingCount: p.reviews, soldCount: ri(5, 400), isFeatured: i < 12,
        metaTitleEn: `${p.en} | Shekor`, metaDescEn: `Buy the ${p.en} in ${matRow.en} from Shekor. ৳${p.price.toLocaleString('en-IN')}, 0% EMI, free delivery in Dhaka over ৳25,000.`,
        metaTitleBn: `${p.bn} | শেকড়`, metaDescBn: `শেকড় থেকে ${p.bn} কিনুন। ০% ইএমআই, ঢাকায় ৳২৫,০০০+ অর্ডারে ফ্রি ডেলিভারি।`,
        publishedAt: daysAgo(120 - i * 2),
        images: { create: [p.img, ...(ALT[p.cat] ?? [])].filter((v, j, a) => a.indexOf(v) === j).slice(0, 3).map((im, j) => ({ url: img(im), altEn: j ? `${p.en} styled in a room` : p.en, altBn: p.bn, sortOrder: j })) },
        variants: {
          create: p.sw.map((hex, j) => ({
            sku: `SHK-${String(p.id).padStart(4, '0')}-${j + 1}`, nameEn: (SWATCH_NAMES[hex] ?? ['Natural', 'প্রাকৃতিক'])[0], nameBn: (SWATCH_NAMES[hex] ?? ['Natural', 'প্রাকৃতিক'])[1],
            optionType: ['fabric', 'velvet', 'leather'].includes(p.mat) ? 'fabric' : 'finish', swatchHex: hex, priceDelta: j === 0 ? 0 : Math.round(p.price * 0.04 / 100) * 100,
            stockQty: stock === 'MADE_TO_ORDER' ? 0 : stock === 'LOW' ? 2 : ri(6, 24), isDefault: j === 0, sortOrder: j,
          })),
        },
      },
    });
    prodId[p.id] = created.id;
  }

  // ── Showcase ──
  for (const [i, p] of M.projects.entries())
    await prisma.project.create({ data: { slug: p.slug, titleEn: p.en, titleBn: p.bn, type: p.type, cityEn: p.cityEn, cityBn: p.cityBn, year: p.year, area: p.area, scopeEn: p.scopeEn, scopeBn: p.scopeBn, heroImage: img(p.hero), images: p.images.map(img), collectionSlugs: p.collections, isFeatured: i < 3, sortOrder: i,
      storyEn: `<p>The brief for ${p.en} was simple: rooms that feel calm, generous and unmistakably Bangladeshi. Our studio worked with the client from measured drawings to final styling, producing every piece in our Gazipur workshop.</p><p>Scope: ${p.scopeEn}. Collections used: ${p.collections.join(', ')}.</p>`,
      storyBn: `<p>${p.bn}-এর লক্ষ্য ছিল সহজ: শান্ত, প্রশস্ত ও নিঃসন্দেহে বাংলাদেশি ঘর। মাপজোখ থেকে চূড়ান্ত সাজসজ্জা পর্যন্ত আমাদের স্টুডিও ক্লায়েন্টের সাথে কাজ করেছে; প্রতিটি পিস গাজীপুরের কারখানায় তৈরি।</p><p>কাজের পরিধি: ${p.scopeBn}।</p>` } });
  for (const [i, g] of M.gallery.entries())
    await prisma.galleryItem.create({ data: { image: img(g.image), titleEn: g.en, titleBn: g.bn, category: g.category, brandSlug: g.brand, collectionSlug: g.collection, room: g.room, material: g.material, projectType: g.ptype, productId: prodId[g.product] ?? null, hotspotX: ri(30, 70), hotspotY: ri(45, 75), tall: g.tall, sortOrder: i } });
  for (const [i, c] of M.catalogues.entries()) {
    const mf = MANIFEST[c.slug] ?? { pages: 4, mb: 0.3 };
    await prisma.catalogue.create({ data: { slug: c.slug, kind: c.kind, ref: c.ref, titleEn: c.en, titleBn: c.bn, season: c.season, coverImage: img(c.cover), pdfUrl: `/media/catalogues/${c.slug}.pdf`,
      pageImages: Array.from({ length: mf.pages }, (_, j) => `/media/catalogues/${c.slug}/p${j + 1}.webp`), pages: mf.pages, sizeKb: Math.round(mf.mb * 1024), downloads: ri(20, 900), sortOrder: i } });
  }
  for (const [i, sr] of M.showrooms.entries())
    await prisma.showroom.create({ data: { slug: sr.en.toLowerCase().replace(/[^a-z0-9]+/g, '-'), nameEn: sr.en, nameBn: sr.bn, city: sr.city, addressEn: sr.addrEn, addressBn: sr.addrBn, phone: sr.phone, isFlagship: sr.flagship, lat: sr.lat, lng: sr.lng, image: img('showroom'), hours: sr.flagship ? '10:00–21:00 · Fri 15:00–21:00' : '10:30–20:30', services: sr.flagship ? ['Design consultation', 'Fabric library', 'Pickup', 'Parking'] : ['Pickup', 'Fabric samples'], sortOrder: i } });

  // ── Content ──
  const heroes = [
    ['Rooted in craft. Made for life.', 'শেকড়ে কারুকাজ। জীবনের জন্য তৈরি।', 'Collection 2026 — Aranya: deep Segun frames, sage linen and soft curves.', 'কালেকশন ২০২৬ — অরণ্য: গাঢ় সেগুন ফ্রেম, সেজ লিনেন ও নরম বাঁক।', 'Discover Aranya', 'অরণ্য দেখুন', '/collections/aranya', 'hero-1'],
    ['Long tables, longer evenings', 'লম্বা টেবিল, দীর্ঘ সন্ধ্যা', 'The Padma dining collection, carved with river motifs.', 'নদীর মোটিফে খোদাই করা পদ্মা ডাইনিং কালেকশন।', 'Explore Padma', 'পদ্মা দেখুন', '/collections/padma', 'hero-2'],
    ['Quiet bedrooms in solid Mahogany', 'সলিড মেহগনিতে নিরিবিলি শোবার ঘর', 'Shimul — finished like old family furniture.', 'শিমুল — পুরোনো পারিবারিক ফার্নিচারের মতো ফিনিশ।', 'See Shimul', 'শিমুল দেখুন', '/collections/shimul', 'hero-3'],
  ];
  for (const [i, h] of heroes.entries())
    await prisma.banner.create({ data: { placement: 'home-hero', titleEn: h[0], titleBn: h[1], subtitleEn: h[2], subtitleBn: h[3], ctaEn: h[4], ctaBn: h[5], href: h[6], image: img(h[7]), sortOrder: i } });
  await prisma.banner.create({ data: { placement: 'home-promo', titleEn: 'Winter living event — up to 15% off', titleBn: 'শীতের লিভিং ইভেন্ট — ১৫% পর্যন্ত ছাড়', subtitleEn: 'Selected sofas, divans and armchairs until 30 November.', subtitleBn: '৩০ নভেম্বর পর্যন্ত নির্বাচিত সোফা, ডিভান ও আর্মচেয়ারে।', ctaEn: 'Shop the event', ctaBn: 'ইভেন্ট দেখুন', href: '/shop?sale=1', image: img('g-sofa-4') } });

  const P_ = (en: string[]) => en.map((x) => `<p>${x}</p>`).join('');
  const pages: [string, string, string, string, string, boolean][] = [
    ['about', 'Our story', 'আমাদের গল্প', P_(['Shekor began in 2009 as a six-person workshop in Gazipur, making beds and almirahs for neighbours. Today 140 karigors, designers and delivery specialists make furniture for homes, hotels and offices across Bangladesh.', 'We still make it the slow way: seasoned Segun and Mahogany, hand-cut joinery and finishes rubbed in by people who have done it for thirty years.']), P_(['শেকড়ের যাত্রা শুরু ২০০৯ সালে গাজীপুরের ছয়জনের একটি কারখানায়, প্রতিবেশীদের জন্য খাট ও আলমারি বানিয়ে। আজ ১৪০ জন কারিগর, ডিজাইনার ও ডেলিভারি বিশেষজ্ঞ সারা বাংলাদেশের বাড়ি, হোটেল ও অফিসের জন্য ফার্নিচার তৈরি করেন।', 'আমরা এখনো ধীরে বানাই: শুকানো সেগুন ও মেহগনি, হাতে কাটা জোড় আর ত্রিশ বছরের অভিজ্ঞ হাতের ফিনিশ।']), false],
    ['delivery', 'Delivery policy', 'ডেলিভারি নীতি', P_(['We deliver to all 64 districts of Bangladesh using our own fleet and trusted partners. Delivery is to the room of your choice; assembly is included in Dhaka and Chattogram city.', 'Charges are calculated by delivery zone at checkout. Dhaka city orders over ৳25,000 ship free.']), P_(['আমরা নিজস্ব গাড়ি ও বিশ্বস্ত পার্টনারের মাধ্যমে বাংলাদেশের ৬৪ জেলায় ডেলিভারি দিই। পছন্দের ঘর পর্যন্ত ডেলিভারি; ঢাকা ও চট্টগ্রাম শহরে অ্যাসেম্বলি অন্তর্ভুক্ত।', 'চেকআউটে ডেলিভারি জোন অনুযায়ী চার্জ নির্ধারিত হয়। ঢাকা শহরে ৳২৫,০০০+ অর্ডারে ফ্রি ডেলিভারি।']), true],
    ['returns', 'Returns & refunds', 'রিটার্ন ও রিফান্ড', '<ul><li>7-day returns on stock items in original condition and packaging.</li><li>Refunds are made to the original payment method within 7–10 working days (bKash/Nagad within 3 days).</li><li>Made-to-order items can be exchanged only for manufacturing defects.</li></ul>', '<ul><li>আসল অবস্থা ও প্যাকেজিংসহ স্টকের পণ্যে ৭ দিনের রিটার্ন।</li><li>মূল পেমেন্ট পদ্ধতিতে ৭–১০ কার্যদিবসের মধ্যে রিফান্ড (বিকাশ/নগদে ৩ দিনে)।</li><li>অর্ডারে তৈরি পণ্য শুধু উৎপাদনজনিত ত্রুটির ক্ষেত্রে বদলানো যায়।</li></ul>', true],
    ['warranty', 'Warranty', 'ওয়ারেন্টি', P_(['10-year warranty on solid-wood frames, 1 year on upholstery, foam, hardware and finish. Register your warranty by scanning the QR code on the product tag.']), P_(['সলিড-কাঠের ফ্রেমে ১০ বছর, আপহোলস্ট্রি, ফোম, হার্ডওয়্যার ও ফিনিশে ১ বছর ওয়ারেন্টি। পণ্যের ট্যাগের QR কোড স্ক্যান করে ওয়ারেন্টি নিবন্ধন করুন।']), true],
    ['emi', 'EMI terms', 'ইএমআই শর্ত', P_(['0% EMI for 3–12 months on orders over ৳10,000 with partner-bank credit cards. 18 and 24-month plans carry a 7% bank fee.']), P_(['৳১০,০০০+ অর্ডারে পার্টনার ব্যাংকের ক্রেডিট কার্ডে ৩–১২ মাসের ০% ইএমআই। ১৮ ও ২৪ মাসের প্ল্যানে ৭% ব্যাংক ফি প্রযোজ্য।']), true],
    ['privacy', 'Privacy policy', 'গোপনীয়তা নীতি', P_(['We collect only what we need to deliver your order and improve our service, never sell your data, and follow Bangladesh\u2019s Digital Security and data-protection rules.', 'You can download or delete your account data at any time from Account → Settings.']), P_(['আপনার অর্ডার ডেলিভারি ও সেবার মান উন্নয়নে যতটুকু প্রয়োজন ততটুকুই তথ্য সংগ্রহ করি, কখনো বিক্রি করি না, এবং বাংলাদেশের ডিজিটাল নিরাপত্তা ও তথ্য সুরক্ষা বিধি মেনে চলি।', 'অ্যাকাউন্ট → সেটিংস থেকে যেকোনো সময় আপনার তথ্য ডাউনলোড বা মুছে ফেলতে পারবেন।']), true],
    ['terms', 'Terms of use', 'ব্যবহারের শর্তাবলি', P_(['Prices include VAT and are subject to change. Colours may vary slightly from screen images because wood is a natural material.']), P_(['মূল্যে ভ্যাট অন্তর্ভুক্ত এবং পরিবর্তনযোগ্য। কাঠ প্রাকৃতিক উপকরণ বলে পর্দার ছবির সাথে রং সামান্য ভিন্ন হতে পারে।']), true],
    ['cookies', 'Cookie policy', 'কুকি নীতি', P_(['We use essential cookies for your bag, sign-in and security, and optional analytics cookies only with your consent.']), P_(['ব্যাগ, সাইন-ইন ও নিরাপত্তার জন্য প্রয়োজনীয় কুকি এবং শুধু আপনার সম্মতিতে অ্যানালিটিক্স কুকি ব্যবহার করি।']), true],
  ];
  for (const [slug, tEn, tBn, bEn, bBn, isPolicy] of pages)
    await prisma.page.create({ data: { slug, titleEn: tEn, titleBn: tBn, bodyEn: bEn, bodyBn: bBn, isPolicy, metaDescEn: `${tEn} — Shekor Furniture, Bangladesh.`, metaDescBn: `${tBn} — শেকড় ফার্নিচার।` } });

  for (const [i, b] of M.posts.entries()) {
    const [dd, mon, yy] = b.date.split(' ');
    await prisma.blogPost.create({ data: { slug: b.slug, titleEn: b.en, titleBn: b.bn, categoryEn: b.catEn, categoryBn: b.catBn, coverImage: img(b.image), readMinutes: b.mins, publishedAt: new Date(`${dd} ${mon} ${yy} 10:00:00 GMT+0600`),
      authorName: i % 2 ? 'Nabila Haque' : 'Rafiqul Islam',
      excerptEn: `${b.en} — practical advice from the Shekor studio and workshop.`, excerptBn: `${b.bn} — শেকড় স্টুডিও ও কারখানার ব্যবহারিক পরামর্শ।`,
      bodyEn: `<p>Good furniture starts long before the first cut. In this guide our studio shares what we have learned from fifteen years of making furniture for Bangladeshi homes.</p><h2>Start with how you live</h2><p>Measure the room and the doorway, note where the light comes from, and think about the monsoon: humidity moves wood, so seasoned timber and breathable finishes matter.</p><h2>Choose materials honestly</h2><p>Segun (teak) is oily and stable; Mahogany carves beautifully and darkens with age; Gorjon is a dependable value choice. Lacquered MDF is right for modern, painted pieces.</p><blockquote>Buy fewer, better pieces — and keep them for a generation.</blockquote><h2>Care through the seasons</h2><p>Dust weekly with a dry cotton cloth, re-oil twice a year and keep pieces a hand's width from walls in the rainy season.</p>`,
      bodyBn: `<p>ভালো ফার্নিচারের শুরু প্রথম কাটের অনেক আগে। এই গাইডে আমাদের স্টুডিও বাংলাদেশি ঘরের জন্য পনেরো বছরের অভিজ্ঞতা থেকে শেখা কথা জানাচ্ছে।</p><h2>আপনার জীবনযাপন দিয়ে শুরু করুন</h2><p>ঘর ও দরজার মাপ নিন, আলো কোন দিক থেকে আসে খেয়াল করুন, আর বর্ষার কথা ভাবুন: আর্দ্রতায় কাঠ নড়ে, তাই শুকানো কাঠ ও শ্বাস নিতে পারা ফিনিশ জরুরি।</p><h2>সৎভাবে উপকরণ বাছাই</h2><p>সেগুন তৈলাক্ত ও স্থিতিশীল; মেহগনিতে সুন্দর খোদাই হয় ও সময়ের সাথে গাঢ় হয়; গর্জন নির্ভরযোগ্য সাশ্রয়ী পছন্দ।</p><blockquote>কম কিনুন, ভালো কিনুন — প্রজন্ম ধরে রাখুন।</blockquote><h2>ঋতু অনুযায়ী যত্ন</h2><p>সপ্তাহে একবার শুকনো সুতি কাপড়ে ধুলা মুছুন, বছরে দুবার তেল দিন এবং বর্ষায় দেয়াল থেকে এক হাত দূরে রাখুন।</p>` } });
  }
  let fi = 0;
  for (const g of M.faqs) for (const q of g.items)
    await prisma.faq.create({ data: { groupEn: g.groupEn, groupBn: g.groupBn, questionEn: q.qEn, questionBn: q.qBn, answerEn: q.aEn, answerBn: q.aBn, sortOrder: fi++ } });

  // ── Delivery zones & coupons ──
  const zones = [
    { code: 'dhaka-city', nameEn: 'Dhaka city', nameBn: 'ঢাকা শহর', divisions: ['Dhaka'], districts: ['Dhaka'], charge: 800, freeOver: 25000, assemblyFee: 0, leadDaysMin: 3, leadDaysMax: 5 },
    { code: 'greater-dhaka', nameEn: 'Gazipur, Narayanganj & Savar', nameBn: 'গাজীপুর, নারায়ণগঞ্জ ও সাভার', divisions: ['Dhaka'], districts: ['Gazipur', 'Narayanganj', 'Narsingdi', 'Munshiganj', 'Manikganj'], charge: 1200, freeOver: 60000, assemblyFee: 500, leadDaysMin: 4, leadDaysMax: 6 },
    { code: 'chattogram-city', nameEn: 'Chattogram city', nameBn: 'চট্টগ্রাম শহর', divisions: ['Chattogram'], districts: ['Chattogram'], charge: 1500, freeOver: 80000, assemblyFee: 0, leadDaysMin: 5, leadDaysMax: 7 },
    { code: 'divisional-cities', nameEn: 'Sylhet, Rajshahi & Khulna', nameBn: 'সিলেট, রাজশাহী ও খুলনা', divisions: ['Sylhet', 'Rajshahi', 'Khulna'], districts: ['Sylhet', 'Rajshahi', 'Khulna'], charge: 2000, freeOver: null, assemblyFee: 1000, leadDaysMin: 6, leadDaysMax: 8 },
    { code: 'hill-tracts', nameEn: 'Hill tracts & islands', nameBn: 'পার্বত্য ও দ্বীপাঞ্চল', divisions: ['Chattogram'], districts: ['Rangamati', 'Khagrachhari', 'Bandarban', 'Bhola'], charge: 3500, freeOver: null, assemblyFee: 1500, leadDaysMin: 10, leadDaysMax: 14, codAvailable: false },
    { code: 'rest-of-bd', nameEn: 'Other districts', nameBn: 'অন্যান্য জেলা', divisions: ['*'], districts: [], charge: 2500, freeOver: null, assemblyFee: 1200, leadDaysMin: 7, leadDaysMax: 10 },
  ];
  for (const [i, z] of zones.entries()) await prisma.deliveryZone.create({ data: { ...z, sortOrder: i } });
  await prisma.coupon.createMany({ data: [
    { code: 'WELCOME10', type: 'percent', value: 10, minSubtotal: 10000, maxDiscount: 5000, descriptionEn: '10% off your first order (up to ৳5,000)', descriptionBn: 'প্রথম অর্ডারে ১০% ছাড় (সর্বোচ্চ ৳৫,০০০)' },
    { code: 'WINTER15', type: 'percent', value: 15, minSubtotal: 40000, maxDiscount: 15000, endsAt: new Date('2026-11-30T23:59:59+06:00'), descriptionEn: 'Winter living event', descriptionBn: 'শীতের লিভিং ইভেন্ট' },
    { code: 'EID5000', type: 'fixed', value: 5000, minSubtotal: 50000, descriptionEn: '৳5,000 off orders over ৳50,000', descriptionBn: '৳৫০,০০০+ অর্ডারে ৳৫,০০০ ছাড়' },
    { code: 'FREESHIP', type: 'shipping', value: 0, minSubtotal: 15000, descriptionEn: 'Free delivery anywhere in Bangladesh', descriptionBn: 'সারা দেশে ফ্রি ডেলিভারি' },
    { code: 'EXPIRED20', type: 'percent', value: 20, minSubtotal: 0, endsAt: new Date('2025-12-31T00:00:00+06:00'), isActive: true, descriptionEn: 'Expired test coupon', descriptionBn: 'মেয়াদোত্তীর্ণ' },
  ] });

  // ── Customers, addresses, orders, reviews ──
  const custHash = await bcrypt.hash(SEED_PASSWORDS.customer, 10);
  const demo = await prisma.user.create({ data: { name: 'Farhana Rahman', email: 'customer@shekor.test', phone: '01711234567', passwordHash: custHash, emailVerified: new Date(), phoneVerified: new Date(), createdAt: daysAgo(200) } });
  const customers = [demo];
  for (let i = 0; i < 46; i++) {
    const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 7) % LAST.length]}`;
    customers.push(await prisma.user.create({ data: { name, email: `${name.toLowerCase().replace(' ', '.')}${i}@example.com`, phone: `01${pickOne(['7', '8', '9', '6', '5', '3'])}${String(10000000 + i * 7919).slice(0, 8)}`, passwordHash: custHash, phoneVerified: new Date(), createdAt: daysAgo(ri(5, 360)) } }));
  }
  for (const c of customers) {
    const div = pickOne(Object.keys(AREAS));
    const [district, area] = pickOne(AREAS[div]);
    await prisma.address.create({ data: { userId: c.id, label: 'Home', name: c.name, phone: c.phone!, division: div, district, area, line1: `House ${ri(1, 120)}, Road ${ri(1, 30)}`, isDefault: true } });
  }
  const zoneRows = await prisma.deliveryZone.findMany();
  const zoneFor = (division: string, district: string) =>
    zoneRows.find((z) => (z.districts as string[]).includes(district)) ?? zoneRows.find((z) => (z.divisions as string[]).includes('*'))!;
  const products = await prisma.product.findMany({ include: { variants: true, images: true } });
  const statusPool: OrderStatus[] = ['DELIVERED', 'DELIVERED', 'DELIVERED', 'DELIVERED', 'DELIVERED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'IN_PRODUCTION', 'CONFIRMED', 'PENDING', 'QUALITY_CHECK', 'CANCELLED'];
  const flow: OrderStatus[] = ['PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'QUALITY_CHECK', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const methods = ['bkash', 'bkash', 'nagad', 'card', 'card', 'cod', 'cod', 'bank'];
  let orderSeq = 260300;
  for (let i = 0; i < 140; i++) {
    const c = i < 4 ? demo : pickOne(customers);
    const addr = (await prisma.address.findFirst({ where: { userId: c.id } }))!;
    const created = daysAgo(ri(0, 89), ri(0, 20));
    const lines = Array.from({ length: ri(1, 3) }, () => pickOne(products));
    const uniq = lines.filter((p, j, a) => a.findIndex((x) => x.id === p.id) === j);
    const items = uniq.map((p) => { const v = pickOne(p.variants); const qty = p.price < 20000 ? ri(1, 2) : 1; const unit = p.price + v.priceDelta; return { p, v, qty, unit }; });
    const subtotal = items.reduce((a, x) => a + x.unit * x.qty, 0);
    const z = zoneFor(addr.division, addr.district);
    const dc = z.freeOver && subtotal >= z.freeOver ? 0 : z.charge;
    const total = subtotal + dc + z.assemblyFee;
    const status: OrderStatus = i < 2 ? (i === 0 ? 'IN_PRODUCTION' : 'DELIVERED') : pickOne(statusPool);
    const method = pickOne(methods);
    const adv = method === 'cod' && total >= 50000 ? 20 : 0;
    const paid = status === 'CANCELLED' ? 0 : method === 'cod' ? (status === 'DELIVERED' ? total : Math.ceil((total * adv) / 100)) : total;
    const payStatus: PaymentStatus = status === 'CANCELLED' ? (method === 'cod' ? 'UNPAID' : 'REFUNDED') : paid >= total ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID';
    const histIdx = status === 'CANCELLED' ? 1 : flow.indexOf(status) + 1;
    const orderNo = `SHK-${++orderSeq}`;
    await prisma.order.create({ data: {
      orderNo, userId: c.id, status, paymentStatus: payStatus, paymentMethod: method, paymentPlan: adv ? 'advance' : 'full', advancePercent: adv,
      customerName: c.name, phone: c.phone!, email: c.email, division: addr.division, district: addr.district, area: addr.area, line1: addr.line1,
      zoneId: z.id, zoneName: z.nameEn, deliveryDate: new Date(created.getTime() + z.leadDaysMax * 86400_000), deliverySlot: pickOne(['morning', 'afternoon', 'evening']),
      subtotal, deliveryCharge: dc, assemblyCharge: z.assemblyFee, total, amountPaid: paid, trackingToken: Math.random().toString(36).slice(2, 12),
      pointsEarned: status === 'DELIVERED' ? pointsForAmount(total) : 0, createdAt: created, updatedAt: created,
      items: { create: items.map((x) => ({ productId: x.p.id, variantId: x.v.id, nameEn: x.p.nameEn, nameBn: x.p.nameBn, variantName: x.v.nameEn, sku: x.v.sku, image: x.p.images[0]?.url, unitPrice: x.unit, qty: x.qty, lineTotal: x.unit * x.qty })) },
      history: { create: [...flow.slice(0, Math.max(1, histIdx)), ...(status === 'CANCELLED' ? ['CANCELLED' as OrderStatus] : [])].map((st, k) => ({ status: st, note: k === 0 ? 'Order placed online' : null, createdAt: new Date(created.getTime() + k * 36 * 3600_000) })) },
      payments: paid > 0 ? { create: [{ provider: method, kind: adv && method === 'cod' ? 'advance' : 'full', amount: paid, status: 'success', providerRef: `${method.toUpperCase()}-${orderNo}`, sessionId: `seed-${orderNo}`, createdAt: created }] } : undefined,
    } });
  }
  // loyalty from delivered orders
  for (const c of customers) {
    const delivered = await prisma.order.findMany({ where: { userId: c.id, status: 'DELIVERED' } });
    const pts = delivered.reduce((a, o) => a + o.pointsEarned, 0);
    if (pts) {
      await prisma.loyaltyTransaction.createMany({ data: delivered.map((o) => ({ userId: c.id, points: o.pointsEarned, reason: 'Order delivered', orderNo: o.orderNo, createdAt: o.updatedAt })) });
      await prisma.user.update({ where: { id: c.id }, data: { loyaltyPoints: pts, tier: tierFor(pts) } });
    }
  }
  // reviews: mockup reviews on the hero product + generated ones
  const hero = products.find((p) => p.slug === 'aranya-3-seater-teak-sofa')!;
  for (const r of M.reviews)
    await prisma.review.create({ data: { productId: hero.id, authorName: r.nameEn, location: r.loc, rating: r.rating, title: r.titleEn, body: r.bodyEn, photos: r.photos.map(img), status: 'approved', verified: true, createdAt: daysAgo(ri(10, 40)) } });
  const reviewTexts = [
    ['Beautiful craftsmanship', 'The joinery is flawless and the finish feels smooth and warm. Delivery team was on time and careful.'],
    ['Worth every taka', 'Solid, heavy and well finished. We compared with three other brands in Dhaka and this was clearly the best built.'],
    ['Looks better in person', 'The colour is richer than the photos. Assembly took under an hour and they cleaned up after.'],
    ['Good, but delivery took longer', 'Lovely piece. Delivery to Sylhet took a few extra days but the team kept me informed by SMS.'],
  ];
  for (const p of products) {
    const n = p.id === hero.id ? 2 : ri(1, 3);
    for (let k = 0; k < n; k++) {
      const [title, body] = pickOne(reviewTexts);
      const cu = pickOne(customers);
      await prisma.review.create({ data: { productId: p.id, userId: cu.id, authorName: cu.name.split(' ')[0] + ' ' + cu.name.split(' ')[1][0] + '.', location: pickOne(['Gulshan, Dhaka', 'Khulshi, Chattogram', 'Uttara, Dhaka', 'Sylhet', 'Rajshahi']), rating: pickOne([5, 5, 4, 5, 4, 3]), title, body, status: k === 0 && ri(0, 4) === 0 ? 'pending' : 'approved', verified: true, createdAt: daysAgo(ri(1, 120)) } });
    }
  }
  // recompute rating aggregates from approved reviews (keep mockup "count" realism by blending)
  for (const p of products) {
    const agg = await prisma.review.aggregate({ where: { productId: p.id, status: 'approved' }, _avg: { rating: true }, _count: true });
    if (agg._count) await prisma.product.update({ where: { id: p.id }, data: { ratingAvg: Number(agg._avg.rating?.toFixed(2)), ratingCount: agg._count } });
  }

  // ── Leads ──
  await prisma.customOrderRequest.createMany({ data: [
    { ref: 'CUS-1001', name: 'Arif Chowdhury', phone: '01611112233', email: 'arif@example.com', city: 'Dhaka', pieceType: 'Wardrobe', material: 'Segun (Teak)', dimensions: '240 × 60 × 230 cm', budget: '৳1,50,000–2,00,000', details: 'Floor-to-ceiling wardrobe with sliding doors and drawers for a Gulshan flat.', status: 'measured' },
    { ref: 'CUS-1002', name: 'Sadia Islam', phone: '01556778899', city: 'Chattogram', pieceType: 'Dining table', material: 'Mahogany', dimensions: '10-seater', budget: '৳2,00,000+', details: 'Carved dining table for ten with matching chairs, river motif like Padma.', status: 'quoted', quoteAmount: 238000 },
    { ref: 'CUS-1003', name: 'Kamrul Islam', phone: '01922334455', city: 'Khulna', pieceType: 'Bed', material: 'Oak', budget: '৳80,000', details: 'King bed with hydraulic storage and upholstered headboard.', status: 'new' },
  ] });
  const showroomIds = (await prisma.showroom.findMany({ select: { id: true } })).map((x) => x.id);
  await prisma.consultationBooking.createMany({ data: [
    { ref: 'CON-2001', name: 'Rumana Akter', phone: '01844990011', mode: 'showroom', showroomId: showroomIds[0], date: daysAgo(-3), timeSlot: '11:00', rooms: 'Living, Dining', status: 'confirmed' },
    { ref: 'CON-2002', name: 'Tanvir Hossain', phone: '01819876543', mode: 'video', date: daysAgo(-1), timeSlot: '16:00', rooms: 'Bedroom', status: 'requested' },
    { ref: 'CON-2003', name: 'Jannatul Ferdous', phone: '01799667788', mode: 'home', date: daysAgo(5), timeSlot: '10:00', rooms: 'Whole flat', status: 'completed' },
  ] });
  await prisma.tradeInquiry.createMany({ data: [
    { ref: 'TRD-3001', company: 'Bay Hospitality Ltd.', contactName: 'Ehsan Kabir', phone: '01711000111', email: 'ehsan@bayhospitality.example', sector: 'hospitality', projectSize: '60 keys', timeline: 'Q1 2027', message: 'Guest room package for a new resort in Cox’s Bazar — beds, desks, lounge chairs.', status: 'proposal' },
    { ref: 'TRD-3002', company: 'NexPay Fintech', contactName: 'Mithila Haque', phone: '01811000222', email: 'mithila@nexpay.example', sector: 'corporate', projectSize: '120 workstations', timeline: 'Jan 2027', message: 'Workstations, meeting tables and a client lounge for our Tejgaon office.', status: 'new' },
  ] });
  await prisma.contactMessage.create({ data: { name: 'Asif Khan', email: 'asif@example.com', phone: '01911000333', subject: 'Warranty question', message: 'My Shimul bed drawer runner needs a check — is it covered by warranty?' } });
  await prisma.catalogueRequest.create({ data: { name: 'Lamia Sarker', phone: '01722000444', address: 'House 9, Road 4, Dhanmondi, Dhaka', catalogues: ['master-2026'] } });
  await prisma.newsletterSubscriber.createMany({ data: customers.slice(0, 20).map((c) => ({ email: c.email! })) });

  // ── Settings ──
  const settings: Record<string, unknown> = {
    store: { name: 'Shekor', legalName: 'Shekor Furniture Ltd.', phone: '09612-345678', whatsapp: '8801711000000', email: 'hello@shekor.com.bd', address: 'House 42, Road 11, Banani, Dhaka 1213', tradeLicence: 'TRAD/DNCC/045123/2026', bin: '004512398-0101' },
    seo: { titleEn: 'Shekor — Solid-wood furniture, made in Bangladesh', titleBn: 'শেকড় — বাংলাদেশে তৈরি সলিড-কাঠের ফার্নিচার', descriptionEn: 'Heirloom solid-wood furniture hand-made in Bangladesh since 2009. Collections, projects, showrooms and 0% EMI with delivery to all 64 districts.', descriptionBn: '২০০৯ সাল থেকে বাংলাদেশে হাতে গড়া সলিড-কাঠের ফার্নিচার। কালেকশন, প্রজেক্ট, শোরুম ও ০% ইএমআই — ৬৪ জেলায় ডেলিভারি।', ogImage: '/media/og/shekor-og.jpg', twitter: '@shekorbd' },
    social: { facebook: 'https://facebook.com/shekor.bd', instagram: 'https://instagram.com/shekor.bd', youtube: 'https://youtube.com/@shekor', linkedin: 'https://linkedin.com/company/shekor' },
    payments: { bkash: true, nagad: true, card: true, cod: true, bank: true, codAdvanceThreshold: 50000, codAdvancePercent: 20 },
    loyalty: { pointsPer100: 1, redeemValue: 1 },
  };
  for (const [key, value] of Object.entries(settings)) await prisma.setting.create({ data: { key, value: value as object } });

  const counts = { products: await prisma.product.count(), orders: await prisma.order.count(), customers: customers.length, reviews: await prisma.review.count() };
  console.log(`Seed complete in ${((Date.now() - t0) / 1000).toFixed(1)}s`, counts);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
