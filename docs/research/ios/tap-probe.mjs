// I1 audit (docs/IOS_ROADMAP.md): tap targets under 44x44 CSS px (= points at any DPR) on a 375x667 iPhone SE-sized
// viewport, on the title, every page of a noble's life (tools/lib/clutter.mjs PAGES) and an event card; plus sideways
// scroll and the iOS-relevant computed styles (user-select, touch-action, overscroll-behavior).
//   node docs/research/ios/tap-probe.mjs /tmp/ardan/me/x.html [--engine=chromium|webkit] [--verbose]
// "controls" counts those in view without scrolling; "all" counts every control laid out on the page. WebKit needs
// `npx playwright install webkit` (and `install-deps webkit` on Linux) with PLAYWRIGHT_BROWSERS_PATH set.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const { HELPERS } = await import(pathToFileURL(path.join(REPO, 'tests/helpers.mjs')).href);
const { PERSONAS, PAGES, START, SETTLE } = await import(pathToFileURL(path.join(REPO, 'tools/lib/clutter.mjs')).href);
const file = path.resolve(process.argv[2]);
const engine = (process.argv.find(a => a.startsWith('--engine=')) || '--engine=chromium').slice(9);
const browser = await pw[engine].launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: engine !== 'firefox', hasTouch: true, reducedMotion: 'reduce' });
const pg = await ctx.newPage();
const errs = [];
pg.on('pageerror', e => errs.push(String(e.message || e).slice(0, 200)));
pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
await pg.goto(pathToFileURL(file).href);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 });
const PROBE = () => {
  const W = innerWidth, H = innerHeight;
  const vis = el => { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const name = el => (el.id ? '#' + el.id : el.tagName.toLowerCase()) + (el.getAttribute('data-a') ? '[data-a=' + el.getAttribute('data-a') + ']' : (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : ''));
  let n = 0, small = 0, all = 0, allSmall = 0; const list = [];
  for (const el of document.querySelectorAll('button, a[href], [data-a], input, select, summary, [role=button], [role=tab], [data-note]')) {
    if (el.disabled || !vis(el)) continue; const r = el.getBoundingClientRect();
    const inView = r.bottom > 0 && r.top < H && r.right > 0 && r.left < W;
    if (!inView) { all++; if (r.width < 44 || r.height < 44) { allSmall++; list.push(name(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); } continue; }
    const top = document.elementFromPoint(Math.min(W - 1, Math.max(0, r.left + r.width / 2)), Math.min(H - 1, Math.max(0, r.top + r.height / 2)));
    if (!top || !(el.contains(top) || top.contains(el))) continue;
    n++; all++;
    if (r.width < 44 || r.height < 44) { small++; allSmall++; list.push(name(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); }
  }
  const b = getComputedStyle(document.body);
  return { controls: n, under44: small, all, allSmall, examples: list, hscroll: Math.max(0, document.documentElement.scrollWidth - W),
    userSelect: b.userSelect || b.webkitUserSelect, touchAction: b.touchAction, overscroll: getComputedStyle(document.documentElement).overscrollBehaviorY };
};
const out = {};
out.title = await pg.evaluate(PROBE);
await pg.evaluate(HELPERS);
const P = PERSONAS.noble;
await pg.evaluate(START(P.o, false));
for (const [nm, tab, extra] of PAGES) {
  try {
    await pg.evaluate(`(() => { UI.ov = null; A.S.queue = []; UI.tab = ${JSON.stringify(tab)}; ${extra} UI.render(); window.scrollTo(0, 0); })()`);
    await pg.evaluate(SETTLE);
    out[nm] = await pg.evaluate(PROBE);
  } catch (e) { out[nm] = { error: String(e.message).slice(0, 160) }; }
}
// an event card: queue the first event the player can see
try {
  await pg.evaluate(() => { A.defEvents([{ id: 'ios_probe', title: 'A door', cond: () => false, w: 0, text: 'A door in the wall.', choices: [{ t: 'Open it', r: 'It opens.' }, { t: 'Leave it', r: 'You leave it.' }, { t: 'Knock twice and wait', r: 'Nobody.' }] }]); UI.tab = 'life'; UI.render(); A.S.queue.unshift({ type: 'event', ev: 'ios_probe', ctx: {} }); UI.renderModal(); });
  await pg.evaluate(SETTLE);
  out.card = await pg.evaluate(PROBE);
} catch (e) { out.card = { error: String(e.message).slice(0, 160) }; }
await browser.close();
let tc = 0, ts = 0; const ex = {};
for (const [k, m] of Object.entries(out)) {
  if (m.error) { console.log(k.padEnd(10), m.error); continue; }
  tc += m.all; ts += m.allSmall;
  for (const e of m.examples) { const key = e.replace(/ \d+x\d+$/, ''); ex[key] = (ex[key] || 0) + 1; }
  console.log(k.padEnd(10), 'controls', String(m.controls).padStart(4), 'under44', String(m.under44).padStart(4), 'all', String(m.all).padStart(4), 'allUnder44', String(m.allSmall).padStart(4), 'hscroll', m.hscroll, 'select', m.userSelect, 'touch', m.touchAction, 'overscroll', m.overscroll);
}
console.log('TOTAL controls', tc, 'under 44', ts, `(${Math.round(100 * ts / tc)}%)`);
console.log('most common small targets:');
for (const [k, v] of Object.entries(ex).sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(String(v).padStart(4), k);
if (process.argv.includes('--verbose')) for (const [k, m] of Object.entries(out)) if (m.examples && m.examples.length) console.log(k + ':', m.examples.join(', '));
console.log('errors', errs.length, errs.slice(0, 5));
