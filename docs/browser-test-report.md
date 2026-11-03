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
<!-- generated:end -->
