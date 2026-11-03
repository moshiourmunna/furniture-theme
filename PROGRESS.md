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
- [ ] Check in prod build: React "script tag" console warning on 404 render (dev)
## Phase 4 — admin (Vite React)
## Phase 5 — tests, SEO, polish, docs, browser test report, screenshots, zip
