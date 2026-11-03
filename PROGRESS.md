# Shekor platform — build progress

Resume guide: read this file, `git log --oneline`, then continue with the first unchecked item.
DB (box): MySQL 8.4 at 127.0.0.1:3306, user `shekor` / `shekor_dev_pw`, DBs `shekor`, `shekor_test`.

## Phase 1 — scaffold + DB + seed
- [x] Monorepo (pnpm + turbo), .env.example, docker-compose
- [x] packages/shared (format, commerce rules, BD geo, RBAC, zod schemas)
- [x] packages/db Prisma schema + init migration
- [x] Seed (48 products, 140 orders, 47 customers, showcase, CMS, zones, coupons, staff/roles)

## Phase 2 — API + services
- [ ] apps/web server layer (http helpers, auth/session/CSRF, rate limit, services)
- [ ] /api/v1 public + account + checkout + payments (mock adapters)
- [ ] /api/v1/admin (RBAC, generic CRUD resources, orders workflow, reports, uploads)

## Phase 3 — storefront (Next.js)
## Phase 4 — admin (Vite React)
## Phase 5 — tests, SEO, polish, docs, browser test report, screenshots, zip
