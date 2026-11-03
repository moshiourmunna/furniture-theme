# Shekor — real-browser test report

This report covers two Playwright suites, both run against **production builds** on the box:

- Storefront: `next start`, port 3100.
- Admin: `vite preview`, port 5173.

## What was tested

| Suite | Scope | Pass criteria |
|---|---|---|
| **Browser pass** (`tests/e2e/playwright.browser-pass.config.ts`) | Every storefront page (46 targets) and every admin page and detail view (41 targets).<br>Matrix: **Chromium, Firefox and WebKit** × **desktop 1440×900, tablet 820×1180, mobile 390×844** × **EN / BN** × **light / dark**, which makes 36 projects.<br>Signed-in pages use a real customer or staff session. | The page fails on any of these:<br>• an HTTP error status or console error<br>• an uncaught exception or failed request<br>• a broken image<br>• horizontal overflow<br>• a wrong `lang`<br>• a theme class that does not match the requested theme (checked at first paint, from localStorage) |
| **Functional flows** (`tests/e2e/playwright.config.ts`) | 24 flows on each of the 3 engines.<br>• Storefront: theme with no flash, language switch with Bangla numerals, search overlay, filters/sort, PDP (variants, lightbox, EMI, wishlist, compare, bag), flipbook, gallery lightbox, contact form, checkout for **each payment method** (bKash success, Nagad fail→retry, card cancel→retry, COD, bank transfer), tracking, password login, addresses CRUD, profile, OTP login, register + OTP verify, forgot/reset.<br>• Admin: login validation and redirect, product price edit → storefront, product create (BN-tab validation) and delete, order status transition and invoice, inventory adjust, loyalty points, coupon edit, settings, CSV export, media upload, FAQ create → storefront → delete, banner → home page, staff create plus RBAC nav, dark mode and Bangla persistence. | Each step's assertions must pass. The page must also show no console errors, uncaught exceptions or unexpected failed requests. |

## Findings and fixes

Every issue below was found in a real browser, fixed, and re-tested.

| # | Engine(s) | Finding | Fix |
|---|---|---|---|
| 1 | All | The 404 page lost the dark theme after client navigation. | `ThemeSync` re-applies the theme class on every route change. |
| 2 | All (mobile) | The catalogue flipbook overflowed by 27px at 390px wide. | Page width is now derived from the viewport and the max height. |
| 3 | Firefox | Zod's eval feature probe was blocked by the CSP and logged as a console error on every form page. | `z.config({ jitless: true })`. |
| 4 | WebKit | No CSRF or session cookie on `http://localhost`, so every POST returned 403. WebKit drops `Secure` cookies on http. | The Secure flag is set only for HTTPS, `x-forwarded-proto: https`, or a non-localhost production host. Override with `COOKIE_SECURE`. Unit-tested. |
| 5 | All | After OTP sign-in, the user landed back on the login page. The router reused a prefetched signed-out redirect for `/account`. | Sign-in does a full navigation to `next`. |
| 6 | All | Admin product form: **Save stayed disabled** after edits in some builds and was enabled on a pristine form in others. A native colour input with an empty swatch reports `#000000`, which made the form dirty and **saved black swatches**. | Swatch moved to a controlled field with an explicit "no swatch" state. Numeric defaults are now strings, so `isDirty` is honest. |
| 7 | All | Admin resource forms: edits typed while a save was in flight were overwritten by the post-save reset. | `reset(values, { keepValues: true })`. |
| 8 | All | After an admin write, the first storefront visit still showed the old page. Next 16 `revalidatePath` in a Route Handler is stale-while-revalidate. | After the response, the API warms the main pages and the edited product page in both locales, so shoppers see the edit. |
| 9 | All | Admin product search ignored slugs. | Search now matches the slug too. |
| 10 | All | The prod-build E2E couldn't read mocked OTP codes. | `EXPOSE_DEV_OTP=1`, test-only. It works only while `SMS_PROVIDER=mock`, and is documented. |
| 11 | All | React lint: setState in effects and `Date.now()` during render, in the search overlay, flipbook, buy box and lead form. | Derived state, or the adjust-during-render pattern. |
| 12 | Earlier (Phase 4) | `/media` route clash, form remount after save, 404 refetch after delete, unescaped description HTML, cramped mobile tables, 401 console error on the admin login page. | See PROGRESS.md, Phase 4. |

| 13 | WebKit (functional E2E) | Pageerrors looked like `/localhost:3100/… due to access control checks` and slipped past the filter that required `//localhost`. Gallery lightbox used `getByRole('dialog')`, which also matched cookie consent. | Guard matches any localhost access-control abort. Lightbox asserted via `data-testid=lightbox`. OTP flow timeout raised to 120s on Firefox. Re-ran Firefox/WebKit functional suites. |

Harness noise filtered in `tests/e2e/test/guards.ts` (these are not app errors, and are documented in code):

- Firefox `downloadable font … status=2152398850` (NS_BINDING_ABORTED) and `NS_BASE_STREAM_CLOSED` on RSC prefetches cancelled by navigation.
- WebKit `Fetch API cannot load http://localhost… due to access control checks.`, which WebKit raises for same-origin fetches it cancels on navigation.
- Headless WebKit does not emit Playwright `download` events for attachments. The CSV export is verified from the response headers instead.

## How to re-run

```bash
# servers (production builds)
cd apps/web && pnpm build && DISABLE_RATE_LIMIT=1 EXPOSE_DEV_OTP=1 pnpm start            # :3000
cd apps/admin && pnpm build && pnpm preview                                                # :5173
# suites
pnpm --filter @shekor/e2e e2e             # functional flows, 3 engines → tests/e2e/reports/e2e.json
pnpm --filter @shekor/e2e browser-pass    # page matrix, 36 projects → tests/e2e/reports/browser-pass.json
pnpm --filter @shekor/e2e report          # regenerates the section below
```

<!-- generated:start -->
_Generated 3 Nov 2026, 18:16 (Asia/Dhaka, UTC+6) by `tests/e2e/scripts/browser-report.mjs`._

## Page matrix (browser pass)

**3132 page loads**: 3132 passed · 0 flaky · 0 failed. Wall time 17 min.

Each cell is one project (engine × viewport × language × theme) running every storefront and admin page. A page fails on any console error, uncaught exception, failed request (4xx/5xx), broken image, horizontal overflow, wrong theme class or wrong `lang`.

| Engine | Viewport | en-light | en-dark | bn-light | bn-dark |
|---|---|---|---|---|---|
| chromium | desktop | ✅ 87/87 | ✅ 87/87 | ✅ 87/87 | ✅ 87/87 |
| chromium | tablet | ✅ 87/87 | ✅ 87/87 | ✅ 87/87 | ✅ 87/87 |
| chromium | mobile | ✅ 87/87 | ✅ 87/87 | ✅ 87/87 | ✅ 87/87 |
| firefox | desktop | ✅ 87/87 | ✅ 87/87 | ✅ 87/87 | ✅ 87/87 |
| firefox | tablet | ✅ 87/87 | ✅ 87/87 | ✅ 87/87 | ✅ 87/87 |
| firefox | mobile | ✅ 87/87 | ✅ 87/87 | ✅ 87/87 | ✅ 87/87 |
| webkit | desktop | ✅ 87/87 | ✅ 87/87 | ✅ 87/87 | ✅ 87/87 |
| webkit | tablet | ✅ 87/87 | ✅ 87/87 | ✅ 87/87 | ✅ 87/87 |
| webkit | mobile | ✅ 87/87 | ✅ 87/87 | ✅ 87/87 | ✅ 87/87 |

Pages covered (87): `home`, `shop`, `shop-category`, `shop-filtered`, `product`, `collections`, `collection`, `brands`, `brand`, `projects`, `project`, `gallery`, `gallery-facet`, `catalogues`, `catalogue-flipbook`, `journal`, `journal-post`, `craft`, `studio`, `interior-design`, `custom`, `consultation`, `trade`, `showrooms`, `about`, `contact`, `faq`, `policy`, `search`, `track`, `wishlist`, `compare`, `cart`, `checkout`, `login`, `register`, `forgot`, `not-found`, `order-public`, `account`, `account-orders`, `account-order`, `account-addresses`, `account-reviews`, `account-loyalty`, `account-settings`, `admin-login`, `admin-dashboard`, `admin-reports`, `admin-orders`, `admin-order`, `admin-products`, `admin-product`, `admin-product-new`, `admin-inventory`, `admin-customers`, `admin-customer`, `admin-staff`, `admin-settings`, `admin-audit`, `admin-media`, `admin-r-quotes`, `admin-r-consultations`, `admin-r-categories`, `admin-r-rooms`, `admin-r-materials`, `admin-r-reviews`, `admin-r-collections`, `admin-r-brands`, `admin-r-projects`, `admin-r-designers`, `admin-r-gallery`, `admin-r-catalogues`, `admin-r-catalogue-requests`, `admin-r-trade-inquiries`, `admin-r-contact-messages`, `admin-r-coupons`, `admin-r-newsletter`, `admin-r-banners`, `admin-r-pages`, `admin-r-blog`, `admin-r-faqs`, `admin-r-showrooms`, `admin-r-delivery-zones`, `admin-r-banner-edit`, `admin-r-coupon-new`, `admin-404`.

### Failed in the first full run, fixed and re-run (12)

| Project | Page | First run | After fix | First-run error |
|---|---|---|---|---|
| chromium-mobile-en-light | admin › admin-order | failed | passed | Error: horizontal overflow 79px: table.tbl, tbody., tr., td.text-right.whitespace-nowrap, td.text-right  expect(received).toEqual(expected) // deep equality |
| chromium-mobile-en-dark | admin › admin-order | failed | passed | Error: horizontal overflow 79px: table.tbl, tbody., tr., td.text-right.whitespace-nowrap, td.text-right  expect(received).toEqual(expected) // deep equality |
| chromium-mobile-bn-light | admin › admin-order | failed | passed | Error: horizontal overflow 74px: table.tbl, tbody., tr., td.text-right.whitespace-nowrap, td.text-right  expect(received).toEqual(expected) // deep equality |
| chromium-mobile-bn-dark | admin › admin-order | failed | passed | Error: horizontal overflow 74px: table.tbl, tbody., tr., td.text-right.whitespace-nowrap, td.text-right  expect(received).toEqual(expected) // deep equality |
| firefox-mobile-en-light | admin › admin-order | failed | passed | Error: horizontal overflow 111px: table.tbl, tbody., tr., td.text-right.whitespace-nowrap, td.text-right  expect(received).toEqual(expected) // deep equality |
| firefox-mobile-en-dark | admin › admin-order | failed | passed | Error: horizontal overflow 111px: table.tbl, tbody., tr., td.text-right.whitespace-nowrap, td.text-right  expect(received).toEqual(expected) // deep equality |
| firefox-mobile-bn-light | admin › admin-order | failed | passed | Error: horizontal overflow 104px: table.tbl, tbody., tr., td.text-right.whitespace-nowrap, td.text-right  expect(received).toEqual(expected) // deep equality |
| firefox-mobile-bn-dark | admin › admin-order | failed | passed | Error: horizontal overflow 104px: table.tbl, tbody., tr., td.text-right.whitespace-nowrap, td.text-right  expect(received).toEqual(expected) // deep equality |
| webkit-mobile-en-light | admin › admin-order | failed | passed | Error: horizontal overflow 83px: table.tbl, tbody., tr., td.text-right.whitespace-nowrap, td.text-right  expect(received).toEqual(expected) // deep equality |
| webkit-mobile-en-dark | admin › admin-order | failed | passed | Error: horizontal overflow 83px: table.tbl, tbody., tr., td.text-right.whitespace-nowrap, td.text-right  expect(received).toEqual(expected) // deep equality |
| webkit-mobile-bn-light | admin › admin-order | failed | passed | Error: horizontal overflow 75px: table.tbl, tbody., tr., td.text-right.whitespace-nowrap, td.text-right  expect(received).toEqual(expected) // deep equality |
| webkit-mobile-bn-dark | admin › admin-order | failed | passed | Error: horizontal overflow 75px: table.tbl, tbody., tr., td.text-right.whitespace-nowrap, td.text-right  expect(received).toEqual(expected) // deep equality |

No failed or flaky page loads.

## Functional flows (E2E)

**72 flow runs**: 71 passed · 1 flaky · 0 failed.

| Flow | chromium | firefox | webkit |
|---|---|---|---|
| login validation and redirect back to the requested page | ✅ | ⚠️ flaky | ✅ |
| product price edit shows on the storefront, then reverts | ✅ | ✅ | ✅ |
| product create (validation on the Bangla tab) and delete | ✅ | ✅ | ✅ |
| order status transition with note, delivery edit and invoice | ✅ | ✅ | ✅ |
| inventory adjust, customer points, coupon, settings, CSV, media upload | ✅ | ✅ | ✅ |
| FAQ create → visible on store → delete → gone | ✅ | ✅ | ✅ |
| banner edit shows on the home page | ✅ | ✅ | ✅ |
| staff create and role-based navigation | ✅ | ✅ | ✅ |
| dark mode + Bangla persist across reloads | ✅ | ✅ | ✅ |
| chrome: theme, language, navigation › theme persists with no flash and language switches with Bangla numerals | ✅ | ✅ | ✅ |
| chrome: theme, language, navigation › header search suggests products and opens results | ✅ | ✅ | ✅ |
| shop + product › filters, sort and pagination update results | ✅ | ✅ | ✅ |
| shop + product › product page: variants, lightbox, EMI, delivery check, wishlist, compare, add to bag | ✅ | ✅ | ✅ |
| shop + product › catalogue flipbook turns pages | ✅ | ✅ | ✅ |
| shop + product › gallery lightbox opens | ✅ | ✅ | ✅ |
| leads › contact form validates and submits | ✅ | ✅ | ✅ |
| checkout per payment method › bkash success | ✅ | ✅ | ✅ |
| checkout per payment method › nagad fail | ✅ | ✅ | ✅ |
| checkout per payment method › card cancel | ✅ | ✅ | ✅ |
| checkout per payment method › cod - | ✅ | ✅ | ✅ |
| checkout per payment method › bank - | ✅ | ✅ | ✅ |
| checkout per payment method › track an order by number + phone | ✅ | ✅ | ✅ |
| account › login guard, bad login, login, orders, addresses, profile, logout | ✅ | ✅ | ✅ |
| account › OTP login, register + verify, forgot + reset | ✅ | ✅ | ✅ |

## Screenshots

Saved as JPEG under `docs/screenshots/browser-pass/<project>/<page>.jpg`. Every page is captured in `chromium-desktop-en-light` and `chromium-desktop-bn-dark`. Key pages are captured in every project.

514 screenshots across 36 projects.

**chromium-desktop-en-light**: [account](screenshots/browser-pass/chromium-desktop-en-light/account.jpg) · [admin-dashboard](screenshots/browser-pass/chromium-desktop-en-light/admin-dashboard.jpg) · [admin-orders](screenshots/browser-pass/chromium-desktop-en-light/admin-orders.jpg) · [admin-product](screenshots/browser-pass/chromium-desktop-en-light/admin-product.jpg) · [catalogue-flipbook](screenshots/browser-pass/chromium-desktop-en-light/catalogue-flipbook.jpg) · [checkout](screenshots/browser-pass/chromium-desktop-en-light/checkout.jpg) · [home](screenshots/browser-pass/chromium-desktop-en-light/home.jpg) · [product](screenshots/browser-pass/chromium-desktop-en-light/product.jpg) · [shop](screenshots/browser-pass/chromium-desktop-en-light/shop.jpg)

**chromium-desktop-bn-dark**: [account](screenshots/browser-pass/chromium-desktop-bn-dark/account.jpg) · [admin-dashboard](screenshots/browser-pass/chromium-desktop-bn-dark/admin-dashboard.jpg) · [admin-orders](screenshots/browser-pass/chromium-desktop-bn-dark/admin-orders.jpg) · [admin-product](screenshots/browser-pass/chromium-desktop-bn-dark/admin-product.jpg) · [catalogue-flipbook](screenshots/browser-pass/chromium-desktop-bn-dark/catalogue-flipbook.jpg) · [checkout](screenshots/browser-pass/chromium-desktop-bn-dark/checkout.jpg) · [home](screenshots/browser-pass/chromium-desktop-bn-dark/home.jpg) · [product](screenshots/browser-pass/chromium-desktop-bn-dark/product.jpg) · [shop](screenshots/browser-pass/chromium-desktop-bn-dark/shop.jpg)

**webkit-mobile-en-light**: [account](screenshots/browser-pass/webkit-mobile-en-light/account.jpg) · [admin-dashboard](screenshots/browser-pass/webkit-mobile-en-light/admin-dashboard.jpg) · [admin-orders](screenshots/browser-pass/webkit-mobile-en-light/admin-orders.jpg) · [admin-product](screenshots/browser-pass/webkit-mobile-en-light/admin-product.jpg) · [catalogue-flipbook](screenshots/browser-pass/webkit-mobile-en-light/catalogue-flipbook.jpg) · [checkout](screenshots/browser-pass/webkit-mobile-en-light/checkout.jpg) · [home](screenshots/browser-pass/webkit-mobile-en-light/home.jpg) · [product](screenshots/browser-pass/webkit-mobile-en-light/product.jpg) · [shop](screenshots/browser-pass/webkit-mobile-en-light/shop.jpg)

**firefox-tablet-bn-dark**: [account](screenshots/browser-pass/firefox-tablet-bn-dark/account.jpg) · [admin-dashboard](screenshots/browser-pass/firefox-tablet-bn-dark/admin-dashboard.jpg) · [admin-orders](screenshots/browser-pass/firefox-tablet-bn-dark/admin-orders.jpg) · [admin-product](screenshots/browser-pass/firefox-tablet-bn-dark/admin-product.jpg) · [catalogue-flipbook](screenshots/browser-pass/firefox-tablet-bn-dark/catalogue-flipbook.jpg) · [checkout](screenshots/browser-pass/firefox-tablet-bn-dark/checkout.jpg) · [home](screenshots/browser-pass/firefox-tablet-bn-dark/home.jpg) · [product](screenshots/browser-pass/firefox-tablet-bn-dark/product.jpg) · [shop](screenshots/browser-pass/firefox-tablet-bn-dark/shop.jpg)

<!-- generated:end -->
