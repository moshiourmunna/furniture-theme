# Shekor — শেকড়

Shekor is a premium Bangladeshi furniture brand. This repo is its bilingual showcase-and-commerce platform:

- An editorial storefront with full e-commerce: EN/বাংলা, light/dark, SEO-ready.
- A REST API.
- A role-based admin panel.

| | |
| --- | --- |
| Storefront + API | `apps/web`: Next.js 16, React 19, Tailwind, Prisma → MySQL 8 |
| Admin | `apps/admin`: Vite 7, React Router 7, TanStack Query, React Hook Form + zod, Recharts |
| Shared | `packages/shared` (rules, schemas, formatting), `packages/db` (schema, migrations, seed) |
| Docs | [architecture](docs/architecture.md) · [ERD](docs/erd.md) · [OpenAPI](docs/openapi.yaml) · [browser test report](docs/browser-test-report.md) · [screenshots](docs/screenshots) |

---

## 1. Prerequisites

| | Windows 10/11 | Linux (Ubuntu/Debian/Fedora) |
| --- | --- | --- |
| Node.js 24 LTS | Installer from nodejs.org, or `winget install OpenJS.NodeJS.LTS` | `nvm install 24` or your distro's NodeSource package |
| pnpm 10 | `corepack enable` (PowerShell as admin), then `corepack prepare pnpm@10.34.6 --activate` | same |
| MySQL 8.x | **Docker Desktop** (recommended) or MySQL Installer 8.4 | `docker` + `docker compose`, or `sudo apt install mysql-server-8.0` |
| Git | Git for Windows | `sudo apt install git` |

> On Windows, use **PowerShell** (or Git Bash) and clone into a short path such as `C:\dev\shekor` so the long `node_modules` paths stay under the Windows limit.

## 2. Set up

```bash
git clone <repo-url> shekor-platform && cd shekor-platform
pnpm install
cp .env.example .env              # Windows PowerShell: Copy-Item .env.example .env
```

### Database

**With Docker (Windows and Linux):**

```bash
docker compose up -d mysql        # MySQL 8.4 on :3306; also creates the shekor_test database
```

**With a native MySQL:** run these once as root.

```sql
CREATE DATABASE shekor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE shekor_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'shekor'@'%' IDENTIFIED BY 'shekor_dev_pw';
GRANT ALL PRIVILEGES ON shekor.* TO 'shekor'@'%';
GRANT ALL PRIVILEGES ON shekor_test.* TO 'shekor'@'%';
```

Then load the schema and demo data:

```bash
pnpm db:generate     # Prisma client
pnpm db:migrate      # apply migrations
pnpm db:seed         # demo catalogue: 48 products, 140 orders, customers, staff, content (idempotent)
```

## 3. Run

```bash
pnpm dev             # web on http://localhost:3000, admin on http://localhost:5173
```

You can also run the apps separately:

```bash
pnpm --filter @shekor/web dev     # PORT=3100 pnpm --filter @shekor/web dev to use another port
pnpm --filter @shekor/admin dev   # proxies /api, /media, /uploads to API_ORIGIN (default http://localhost:3000)
```

> If the web app runs on another port (e.g. `PORT=3100`), start the admin with `API_ORIGIN=http://localhost:3100`. In PowerShell: `$env:API_ORIGIN="http://localhost:3100"; pnpm --filter @shekor/admin dev`. Set `APP_URL` in `.env` to the storefront URL.

### Demo accounts

| Who | Login | Password |
| --- | --- | --- |
| Super Admin | admin@shekor.com.bd | `Shekor@2026` |
| Catalog / Orders / Content / Support / Accountant | catalog@, orders@, content@, support@, accounts@shekor.com.bd | `Shekor@2026` |
| Customer | customer@shekor.test or 01711234567 | `Customer@2026` |

These are demo credentials created by the seed; change them before any real deployment.

In development the SMS provider is a mock, so OTP codes appear on screen ("Dev code"). Payments use a local mock gateway: choose success, fail or cancel. Coupons to try are `WELCOME10`, `WINTER15`, `EID5000` and `FREESHIP`; `EXPIRED20` is expired on purpose.

## 4. Production build

```bash
pnpm build
pnpm --filter @shekor/web start                 # next start (PORT, default 3000)
pnpm --filter @shekor/admin preview             # or serve apps/admin/dist behind nginx (docker/admin.nginx.conf)
```

### Docker (full stack)

```bash
docker compose --profile full up -d --build
docker compose exec web sh -c "cd /app/packages/db && pnpm exec tsx prisma/seed.ts"   # optional demo data
```

Storefront → http://localhost:3000 · Admin → http://localhost:5173

Production checklist:

- Set a long `SESSION_SECRET`, plus `APP_URL` and `ADMIN_ORIGIN`.
- Set `PAYMENT_MODE=sandbox|live` with gateway keys.
- Set real SMS and email providers.
- Set `STORAGE_DRIVER=s3` when you run more than one instance.
- Put a Redis-backed rate limiter behind the API.

## 5. Quality checks

```bash
pnpm typecheck                 # all packages
pnpm lint                      # ESLint (web, admin, shared)
pnpm test                      # unit tests (Vitest)
pnpm test:integration          # API integration tests against the real shekor_test MySQL database
```

For the end-to-end tests, the apps must be running: web on :3000 and admin on :5173. Production builds are recommended:

```bash
pnpm --filter @shekor/e2e exec playwright install chromium firefox webkit   # first time (Linux: add --with-deps)
pnpm --filter @shekor/e2e e2e              # functional flows on Chromium, Firefox, WebKit
pnpm --filter @shekor/e2e browser-pass     # 87 pages × 3 engines × 3 sizes × EN/BN × light/dark
```

Notes:

- `STORE_URL` and `ADMIN_URL` override the default URLs.
- Run the web server with `DISABLE_RATE_LIMIT=1 EXPOSE_DEV_OTP=1` for E2E and the browser pass: the pass signs in thousands of times, and the OTP flows read the mocked code from the API response (only ever exposed when `SMS_PROVIDER=mock`).
- Reports are written to `tests/e2e/reports/`. Screenshots go to `docs/screenshots/browser-pass/`.

### Lighthouse

```bash
npx lighthouse http://localhost:3000/en --preset=desktop --output=html --output-path=docs/lighthouse/home.html
```

Scores from the last run are in [docs/browser-test-report.md](docs/browser-test-report.md#lighthouse).

## 6. Project layout

```
apps/web/src/app/[locale]/…     storefront routes (shop, p/[slug], collections, projects, gallery, catalogues, journal, account, checkout…)
apps/web/src/app/api/v1/…       REST API (OpenAPI: docs/openapi.yaml)
apps/web/src/server/…           auth, security, payments, storage, services, admin resources
apps/admin/src/pages/…          dashboard, orders, products, inventory, customers, generic CMS resources, staff/roles, settings, reports, audit, media
packages/db/prisma/…            schema.prisma, migrations, seed.ts (+ seed-data)
packages/shared/src/…           commerce rules, zod schemas, permissions, formatting, BD geography
tests/e2e/…                     Playwright specs + browser-pass config
scripts/                        gen-erd.mjs, gen-openapi.ts
```

## 7. Troubleshooting

- **`P1001: Can't reach database server`.** Check that MySQL is running (`docker compose ps`) and that `DATABASE_URL` in `.env` matches.
- **Windows: `EPERM` during `pnpm install`.** Close editors or antivirus scans that are locking `node_modules`, then retry. Developer Mode avoids symlink permission issues.
- **Admin shows "Cross-site request blocked".** Add the admin's origin to `ADMIN_ORIGIN` (comma-separated).
- **Port in use.** Run `PORT=3100 pnpm --filter @shekor/web dev`, or in PowerShell `$env:PORT=3100`.
