# Shekor platform — build progress

Resume guide: read this file, `git log --oneline`, then continue with the first unchecked item.
DB (box): MySQL 8.4 at 127.0.0.1:3306, user `shekor` / `shekor_dev_pw`, DBs `shekor`, `shekor_test`.

## Phase 1 — scaffold + DB + seed
- [x] Monorepo (pnpm + turbo), .env.example, docker-compose
- [x] packages/shared (format, commerce rules, BD geo, RBAC, zod schemas)
- [x] packages/db Prisma schema + init migration
- [x] Seed (48 products, 140 orders, 47 customers, showcase, CMS, zones, coupons, staff/roles)

## Phase 2 — API + services
- [x] apps/web server layer (http helpers, auth/session/CSRF, rate limit, services)
- [x] /api/v1 public + account + checkout + payments (mock adapters)
- [x] /api/v1/admin (RBAC, generic CRUD resources, orders workflow, reports, uploads)
- Note (2026-11-03 14:52 BDT): Phase 2 committed as `311cef2`. Uncommitted work under `apps/web/src` looks like Phase 3 storefront start (globals.css, components/, lib/, locale home). Resume there; do not re-scaffold Phase 2.

## Phase 3 — storefront (Next.js)
- [x] Layout: fonts, no-flash theme, EN/BN toggle, header/mega menu, search overlay, drawers, footer, cookie, WhatsApp, reveal
- [x] Home, shop + category (URL filters/facets/sort/pagination), search, PDP (gallery lightbox, variants, EMI, delivery check, stock alert, reviews + photo upload, JSON-LD)
- [x] Collections, brands, projects, studio, gallery (masonry, lightbox, hotspots, facets), catalogues (flipbook + print request)
- [x] Editorial/service pages: craft, about, interior design, trade, custom, consultation, showrooms (map), journal, FAQ, policies, contact
- [x] Commerce: cart (server quote, coupons), checkout (bKash/Nagad/card/COD/bank, advance plan), mock gateway, order page + retry, tracking, wishlist, compare
- [x] Auth (password, OTP, register+verify, reset) + account (overview, orders, addresses CRUD, reviews, loyalty, settings, delete)
- [x] 404 + catch-all, sitemap.xml, robots.txt, manifest
- [x] Check in prod build: React "script tag" console warning on 404 render. Dev-only; the prod 404 is clean.
## Phase 4 — admin (Vite React)
- [x] Vite + React Router + TanStack Query + RHF/zod + recharts scaffold, tokens shared with web, no-flash theme/lang
- [x] Layout: permission-filtered grouped nav with badges, global search (Ctrl K), EN/BN, light/dark, view store
- [x] Dashboard (KPIs, revenue area, payment mix, recent orders, attention list), Reports (range, CSV, charts)
- [x] Orders list/detail (status transitions with notes, delivery edit, invoice, payments, timeline)
- [x] Products list/edit (EN/BN tabs, images, variants field array, duplicate, delete→archive)
- [x] Inventory adjust, Customers (block, points), Staff, Roles matrix, Settings tabs, Audit log, Media library
- [x] Generic CMS/catalog/lead resources (23 sections) with list filters + typed forms
- [x] Playwright smoke: every page + detail, 0 console errors / 0 failed requests / 0 overflow
- [x] CRUD + persistence: price edit → store, product create/delete, order transition, inventory, points, FAQ create→store→delete, banner → home, coupon, settings, CSV, upload, staff create
- [x] RBAC: 5 limited roles see only permitted nav; forbidden pages show NoAccess
- [x] Fixes: /media route clashed with proxied /media → /media-library; form keeps edits after save; delete no longer refetches 404; BN tab opens on BN error; product description HTML rendered (sanitized) on store
- [x] Lint/typecheck clean, prod build chunked (<400 kB per chunk)
## Phase 5 — tests, SEO, polish, docs, browser test report, screenshots, zip
- [x] Unit (shared 39, web 14, admin 5) + integration against real MySQL `shekor_test` (52) all passing
- [x] Docs: README (Windows + Linux), docs/architecture.md, docs/erd.md (generated), docs/openapi.yaml (generated), CI workflow, Dockerfiles
- [x] WebKit system libs installed offline. The InRelease signature was verified with sqv; the .deb SHA256s match the signed Packages index.
- [x] Functional E2E (24 flows × Chromium/Firefox/WebKit). Fixes found:
  - Secure cookies over http://localhost broke WebKit.
  - A stale prefetched redirect after sign-in.
  - Product form isDirty broken by the colour input.
  - Resource form lost edits typed while saving.
  - Storefront served a stale ISR page after an admin write; fixed with a warm-up.
  - Admin search now matches slug.
  - Lint/impure-render fixes.
- [x] Full browser pass (36 projects × 87 pages), then docs/browser-test-report.md + screenshots
- [x] Lighthouse on key pages (docs/lighthouse): home/shop/PDP/about 99–100 across Perf/A11y/BP/SEO; cart SEO 69 is intentional noindex
- [x] Final all-suites run (unit + integration + e2e Chromium/Firefox/WebKit + browser pass), zip /workspace/shekor-platform.zip

- [x] E2E harness polish (2026-11-03 evening): WebKit pageerror filter matches `/localhost… due to access control checks` (not only `//localhost`); gallery lightbox asserts `data-testid=lightbox` so cookie consent dialog does not collide; OTP flow timeout 120s on Firefox.
