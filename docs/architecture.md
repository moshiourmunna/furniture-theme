# Shekor platform — architecture

Shekor is a bilingual (English/বাংলা) showcase-and-commerce platform for a premium Bangladeshi furniture brand.
It has three parts: a public storefront, a REST API, and a staff admin panel. All three run on one MySQL database.

```
                ┌──────────────────────────── apps/web (Next.js 16) ─────────────────────────────┐
 Browser ──────►│  /{en|bn}/…  storefront (RSC, ISR 5 min, on-demand revalidate on admin writes) │
                │  /api/v1/…   REST API (route handlers)  ──► services ──► Prisma ──► MySQL 8    │
                │  /media /brand static assets · /uploads/* user/staff uploads (local or S3)      │
                └───────────────────────────────▲────────────────────────────────────────────────┘
 Staff ──► apps/admin (Vite SPA) ── /api/v1/admin/* (same origin through a proxy; CORS for split hosting)
```

## Monorepo

| Path | What it is |
| --- | --- |
| `apps/web` | Next.js 16 App Router: storefront pages under `app/[locale]`, the API under `app/api/v1`, `proxy.ts` (locale redirect, CSRF cookie, account guard), metadata routes (sitemap, robots, manifest). |
| `apps/admin` | React 19 + Vite 7 SPA: React Router 7, TanStack Query 5, React Hook Form + zod, Recharts, Tailwind with the shared tokens. |
| `packages/db` | Prisma schema (45 models), migrations and a deterministic seed with realistic BD data (48 products, 140 orders, 47 customers, 99 reviews, staff for every role). |
| `packages/shared` | Framework-free TypeScript used by both apps: zod schemas, commerce rules (coupons, delivery, advance payments, EMI, loyalty), order workflow, permissions, BD divisions/districts, Bangla numerals, lakh grouping, Dhaka-time formatting, design tokens. |
| `tests/e2e` | Playwright: functional flows and the full browser pass (3 engines × 3 sizes × EN/BN × light/dark). |
| `docker/` | Dockerfiles for web and admin, nginx config, MySQL init (creates `shekor_test`). |

Turborepo runs `build`, `typecheck`, `lint` and `test` across the workspace. pnpm workspaces link the packages.

## Data model

See [erd.md](./erd.md), which is generated from the Prisma schema. In short:

- **Identity:** `User` (kind CUSTOMER/STAFF), `Role`, `Permission`, `RolePermission`, `Session` (stores hashed tokens), `OtpCode`, `Address`.
- **Catalogue:** `Product` with `ProductImage` and `ProductVariant` (each variant has its own SKU, price delta and stock), plus `Category`, `Room`, `Material`, `Brand`, `Collection`. Also `Review` (with photos and moderation), `StockAlert`, `WishlistItem`.
- **Commerce:** `Order`, `OrderItem` (name, price and variant are snapshotted), `OrderStatusHistory`, `Payment` (one row per attempt, plus a gateway session id), `Coupon`, `DeliveryZone`, `StockMovement`, `LoyaltyTransaction`.
- **Showcase and content:** `Project`, `Designer`, `GalleryImage`, `Catalogue` (flipbook pages), `Banner`, `Page` (including policies), `BlogPost`, `Faq`, `Showroom`, `Setting` (key/JSON).
- **Leads:** `QuoteRequest` (custom orders), `Consultation`, `TradeInquiry`, `CatalogueRequest`, `ContactMessage`, `NewsletterSubscriber`.
- **Operations:** `AuditLog` records every admin write: who, what, which entity, and the IP.

Bilingual content uses paired columns (`nameEn`/`nameBn`). There are exactly two locales, so this keeps reads single-table and indexable. `pick()` falls back to English when a Bangla field is empty.

Money is stored as integer taka. Dates are stored in UTC and always shown in Asia/Dhaka.

## Request lifecycle (API)

Every handler is wrapped by `api()` (`src/server/route.ts`):

1. **CSRF and Origin.** Unsafe methods need a double-submit token: the `shekor_csrf` cookie must match the `x-csrf-token` header (compared in constant time). Any `Origin` must be the store or an allowed admin origin.
2. **Validation.** Bodies go through zod via `readJson(req, schema)`. Failures return `422 {error:{code:'validation', fields}}`.
3. **Authorisation.** `requireUser` covers customer routes. `requireStaff(req, 'orders.write')` covers every admin route. Permission codes live in `packages/shared/src/permissions.ts`.
4. **Business logic.** Services in `src/server/services` and `src/server/admin` run inside transactions where stock or money changes.
5. **Error mapping.** `ApiError`, ZodError and Prisma errors (P2002 → 409, P2025 → 404) become uniform JSON. CORS headers are added for the admin origin.
6. **Rate limits.** In-memory, fixed-window limits apply to login, OTP, registration, checkout, leads, reviews and uploads. Swap in Redis for multi-instance deployments; `DISABLE_RATE_LIMIT=1` turns them off for test runs.

## Auth and sessions

- **Customers** sign in with email or phone plus a password, or a 6-digit OTP sent by SMS or email. Registration requires OTP verification. Password reset uses OTP.
- **Staff** use a separate login and a separate cookie (`shekor_admin`). A customer session can never reach admin endpoints, and the reverse is also true.
- **Sessions:** random 32-byte tokens. Only their SHA-256 hash is stored. Cookies are httpOnly, SameSite=Lax and Secure in production, with a fixed expiry (30 days for the store, 1 day for admin). Logout deletes the row.
- **Passwords:** bcrypt (cost 12). Login runs a dummy hash on unknown accounts, so response timing doesn't reveal which accounts exist. The OTP request endpoint returns the same answer whether or not the account exists.
- **Dev OTP:** when `SMS_PROVIDER=mock` outside production, the API returns `devOtp`. The login/register screens show it, so the flows can be tested end to end.

## RBAC

There are 18 permission groups, each with `.read` and/or `.write`. They are seeded into six preset roles: Super Admin, Catalog Manager, Order Manager, Content Editor, Support and Accountant. Super Admins can create custom roles in the permission matrix.

The admin hides navigation and actions the user lacks, and the API enforces the same codes on every endpoint.

## Checkout and payments

1. The client cart in localStorage holds only IDs and quantities. `POST /cart/quote` re-prices everything on the server: variant deltas, coupon, delivery zone (district → division → fallback), assembly, and the advance plan.
2. `POST /checkout` re-validates and locks stock in a transaction. It snapshots lines, creates the order and history, decrements stock (made-to-order items skip this), and returns a gateway `redirectUrl` when something is due now.
3. Payment adapters (`src/server/payments`) share one interface:
   - **mock:** a local bKash/Nagad/card page with success, fail and cancel. Completion is idempotent.
   - **sslcommerz:** sandbox adapter with an IPN callback.
   - **cod:** charges a 20% advance on totals of ৳50,000 or more.
   - **bank:** shows transfer instructions; staff confirm the payment later.
   Failed or cancelled payments can be retried from the order page.
4. Status changes go through `ORDER_TRANSITIONS`. Cancelling or returning restores stock. Delivery awards loyalty points and settles the COD balance. Each step sends an SMS (mocked).

## Storefront rendering

- Pages are React Server Components with ISR (`revalidate = 300`). Admin writes call `revalidatePath('/', 'layout')`, so edits show up immediately.
- Locale is the first path segment. `proxy.ts` redirects locale-less URLs using the cookie, then Accept-Language. `<html lang>` and the `lang-bn` class switch to Hind Siliguri with Bangla numerals.
- Theme: an inline script runs before first paint and applies the saved or system theme, so there is no flash. `ThemeSync` re-applies it if React ever re-creates `<html>` attributes.
- Images use `next/image` (AVIF/WebP). Product, gallery and flipbook views have keyboard-operable lightboxes. All motion respects `prefers-reduced-motion`.

## SEO

- Per-page `generateMetadata` sets canonical, hreflang (en, bn, x-default), Open Graph and Twitter tags.
- JSON-LD: Organization, WebSite+SearchAction, BreadcrumbList, Product+Offer+AggregateRating, Article, FAQPage, FurnitureStore (showrooms), ContactPage.
- `sitemap.xml` lists 264 URLs with alternates. `robots.txt` keeps API, account, cart, checkout, order and search pages out. Private pages are marked noindex.

## Security headers

`next.config.ts` sends:

- CSP: default-src 'self'; scripts are self plus inline (for the theme script); images are self, data and the S3 host; frame-ancestors none.
- HSTS, X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy.

Rich text from the CMS is sanitised with sanitize-html both on save and when rendered. Uploads are checked for type and size (staff ≤ 15 MB; customer review photos ≤ 5 MB) and stored under random keys, with a path-traversal guard.

## Accessibility (WCAG 2.1 AA)

- Semantic landmarks and a skip link.
- Every control has a visible label or aria-label, with focus-visible rings.
- Modals and drawers trap focus and close on Esc.
- Live regions announce cart, toast and flipbook page changes.
- Colour pairs meet 4.5:1 in both themes (checked with Lighthouse and axe).
- Forms link errors through `aria-invalid` and `aria-describedby`.

## Testing

| Layer | Tool | What |
| --- | --- | --- |
| Unit | Vitest | `packages/shared` (formatting, commerce rules, schemas, permissions), web security/sanitiser/SEO helpers, admin form mapping |
| Integration | Vitest + real MySQL (`shekor_test`) | Route handlers called directly: catalogue, auth/OTP, checkout per payment method, RBAC, admin CRUD → storefront persistence, every admin resource |
| E2E | Playwright | Storefront flows (theme/lang, search, filters, PDP, lightbox, EMI, wishlist/compare, flipbook, leads, checkout ×5 methods, track, account, OTP, register, reset) and admin flows (CRUD, persistence, RBAC, invoice, CSV, upload) on Chromium, Firefox and WebKit |
| Browser pass | Playwright | 87 pages × 36 projects (3 engines × desktop/tablet/mobile × EN/BN × light/dark), with zero console errors, failed requests, broken images or horizontal overflow. See [browser-test-report.md](./browser-test-report.md) |
| Performance/a11y | Lighthouse | See README |

## Deployment

The `docker compose --profile full up` stack runs MySQL, the web app (runs migrations on start; `SEED=1` loads the demo data) and the admin (nginx serving the SPA and proxying `/api`).

For production:

- Set `SESSION_SECRET` (32+ characters), `APP_URL` and `ADMIN_ORIGIN`.
- Set `PAYMENT_MODE=sandbox|live` with gateway credentials, and the SMS and email providers.
- Set `STORAGE_DRIVER=s3` for multi-instance hosting.
- Replace the in-memory rate limiter with Redis.
