/**
 * Builds the generated sections of docs/browser-test-report.md from the Playwright JSON reports:
 *   reports/browser-pass.json  (page matrix: engine × device × locale × theme)
 *   reports/e2e.json           (functional flows per engine)
 * Hand-written content outside the <!-- generated:start --> / <!-- generated:end --> markers is preserved.
 */
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const out = join(root, 'docs', 'browser-test-report.md');
const load = (f) => (existsSync(join(here, '..', 'reports', f)) ? JSON.parse(readFileSync(join(here, '..', 'reports', f), 'utf8')) : null);

/** Flatten suites → [{title, file, project, status, error, duration, annotations}] using the final attempt. */
function flatten(report) {
  const rows = [];
  const walk = (suite, trail) => {
    for (const s of suite.suites ?? []) walk(s, [...trail, s.title]);
    for (const spec of suite.specs ?? []) {
      for (const t of spec.tests) {
        const last = t.results.at(-1) ?? {};
        const status = t.status === 'skipped' ? 'skipped' : t.status === 'flaky' ? 'flaky' : t.status === 'expected' ? 'passed' : 'failed';
        rows.push({ title: [...trail.filter(Boolean).slice(1), spec.title].join(' › '), project: t.projectName, status, duration: last.duration ?? 0,
          error: (last.error?.message ?? '').replace(/\x1b\[[0-9;]*m/g, '').split('\n').slice(0, 3).join(' '), annotations: t.annotations ?? [] });
      }
    }
  };
  walk(report, []);
  return rows;
}

const count = (rows) => rows.reduce((a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {});
const fmt = (c) => `${c.passed ?? 0} passed · ${c.flaky ?? 0} flaky · ${c.failed ?? 0} failed${c.skipped ? ` · ${c.skipped} skipped` : ''}`;
const lines = [];
const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', dateStyle: 'medium', timeStyle: 'short' });
lines.push(`_Generated ${now} (Asia/Dhaka, UTC+6) by \`tests/e2e/scripts/browser-report.mjs\`._`, '');

const pass = load('browser-pass.json');
if (pass) {
  let rows = flatten(pass);
  // After fixing failures, only the failed tests are re-run (reports/browser-pass-rerun.json); their final result replaces the first one.
  const rerun = load('browser-pass-rerun.json');
  const fixedFirstRun = [];
  if (rerun) {
    const again = new Map(flatten(rerun).map((r) => [`${r.project}|${r.title}`, r]));
    rows = rows.map((r) => { const n = again.get(`${r.project}|${r.title}`); if (n && r.status !== n.status) fixedFirstRun.push({ ...r, now: n.status }); return n ?? r; });
  }
  const c = count(rows);
  lines.push('## Page matrix (browser pass)', '', `**${rows.length} page loads**: ${fmt(c)}. Wall time ${Math.round((pass.stats?.duration ?? 0) / 60000)} min.`, '');
  lines.push('Each cell is one project (engine × viewport × language × theme) running every storefront and admin page. A page fails on any console error, uncaught exception, failed request (4xx/5xx), broken image, horizontal overflow, wrong theme class or wrong `lang`.', '');
  const engines = ['chromium', 'firefox', 'webkit'];
  const devices = ['desktop', 'tablet', 'mobile'];
  const combos = ['en-light', 'en-dark', 'bn-light', 'bn-dark'];
  lines.push(`| Engine | Viewport | ${combos.join(' | ')} |`, `|---|---|${combos.map(() => '---').join('|')}|`);
  for (const e of engines) for (const d of devices) {
    const cells = combos.map((k) => {
      const rs = rows.filter((r) => r.project === `${e}-${d}-${k}`);
      if (!rs.length) return 'n/a';
      const cc = count(rs);
      return `${cc.failed ? '❌' : '✅'} ${cc.passed ?? 0}/${rs.length}${cc.flaky ? ` (${cc.flaky} flaky)` : ''}`;
    });
    lines.push(`| ${e} | ${d} | ${cells.join(' | ')} |`);
  }
  lines.push('');
  const pages = [...new Set(rows.map((r) => r.title.split(' › ').at(-1)))];
  lines.push(`Pages covered (${pages.length}): ${pages.map((p) => `\`${p}\``).join(', ')}.`, '');
  if (fixedFirstRun.length) {
    lines.push(`### Failed in the first full run, fixed and re-run (${fixedFirstRun.length})`, '', '| Project | Page | First run | After fix | First-run error |', '|---|---|---|---|---|');
    for (const r of fixedFirstRun) lines.push(`| ${r.project} | ${r.title} | ${r.status} | ${r.now} | ${r.error.replace(/\|/g, '\\|').slice(0, 160)} |`);
    lines.push('');
  }
  const bad = rows.filter((r) => r.status === 'failed' || r.status === 'flaky');
  if (bad.length) {
    lines.push('### Failed or flaky page loads (final)', '', '| Project | Page | Status | First error line |', '|---|---|---|---|');
    for (const r of bad) lines.push(`| ${r.project} | ${r.title} | ${r.status} | ${r.error.replace(/\|/g, '\\|').slice(0, 220)} |`);
    lines.push('');
  } else lines.push('No failed or flaky page loads.', '');
}

// Functional runs may be split per engine (reports/e2e-<engine>.json); fall back to a single reports/e2e.json.
const perEngine = ['chromium', 'firefox', 'webkit'].map((e) => load(`e2e-${e}.json`)).filter(Boolean);
const e2eRuns = perEngine.length ? perEngine : [load('e2e.json')].filter(Boolean);
if (e2eRuns.length) {
  const rows = e2eRuns.flatMap(flatten);
  const c = count(rows);
  lines.push('## Functional flows (E2E)', '', `**${rows.length} flow runs**: ${fmt(c)}.`, '');
  const titles = [...new Set(rows.map((r) => r.title))];
  const projects = [...new Set(rows.map((r) => r.project))];
  lines.push(`| Flow | ${projects.join(' | ')} |`, `|---|${projects.map(() => '---').join('|')}|`);
  const icon = { passed: '✅', flaky: '⚠️ flaky', failed: '❌', skipped: '⏭ skipped' };
  for (const t of titles) lines.push(`| ${t} | ${projects.map((p) => icon[rows.find((r) => r.title === t && r.project === p)?.status] ?? 'n/a').join(' | ')} |`);
  lines.push('');
  const bad = rows.filter((r) => r.status === 'failed');
  if (bad.length) { lines.push('### Failed flows', ''); for (const r of bad) lines.push(`- **${r.project}** ${r.title}: ${r.error.slice(0, 300)}`); lines.push(''); }
}

const shotRoot = join(root, 'docs', 'screenshots', 'browser-pass');
if (existsSync(shotRoot)) {
  lines.push('## Screenshots', '', 'Saved as JPEG under `docs/screenshots/browser-pass/<project>/<page>.jpg`. Every page is captured in `chromium-desktop-en-light` and `chromium-desktop-bn-dark`. Key pages are captured in every project.', '');
  const projects = readdirSync(shotRoot).sort();
  const total = projects.reduce((n, p) => n + readdirSync(join(shotRoot, p)).length, 0);
  lines.push(`${total} screenshots across ${projects.length} projects.`, '');
  const sample = ['home', 'shop', 'product', 'catalogue-flipbook', 'checkout', 'account', 'admin-dashboard', 'admin-product', 'admin-orders'];
  for (const p of ['chromium-desktop-en-light', 'chromium-desktop-bn-dark', 'webkit-mobile-en-light', 'firefox-tablet-bn-dark']) {
    if (!existsSync(join(shotRoot, p))) continue;
    const files = readdirSync(join(shotRoot, p)).filter((f) => sample.includes(f.replace(/\.jpg$/, '')));
    lines.push(`**${p}**: ${files.map((f) => `[${f.replace('.jpg', '')}](${relative(dirname(out), join(shotRoot, p, f))})`).join(' · ')}`, '');
  }
}

const gen = `<!-- generated:start -->\n${lines.join('\n')}\n<!-- generated:end -->`;
let doc = existsSync(out) ? readFileSync(out, 'utf8') : '# Browser test report\n\n<!-- generated:start -->\n<!-- generated:end -->\n';
doc = doc.includes('<!-- generated:start -->') ? doc.replace(/<!-- generated:start -->[\s\S]*<!-- generated:end -->/, gen) : `${doc}\n${gen}\n`;
writeFileSync(out, doc);
console.log(`wrote ${relative(root, out)}`);
