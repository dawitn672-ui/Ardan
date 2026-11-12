// Style-time probe (round 2 A0, docs/CRITIQUE.md P1): what one small DOM insertion costs the browser's style engine, in
// the page states where a rule can switch on a whole-document restyle. Measured in main-thread CPU (CDP Performance
// metrics with timeDomain threadTicks), never wall time.
//
//   node tools/bench/style-probe.mjs [built.html] [--state=save.json | --new=seed:status:sex:age] [--w=1366] [--json=out.json]
//   node tools/bench/style-probe.mjs index.html --bisect      every :has() rule put back alone, in the slowest state
//
// A probe appends one empty <span> to #tabbody, forces a style read, removes it, reads again (12 times) and reports the
// style time per recalculation. Healthy: about 0.01 ms. Before A0, 13 to 21 ms once a hint or the death bar was drawn.
// States: 1 hints off, 2 a hint drawn, 3 that hint removed, 4 the death screen, 5 the game screen of a dead player
// (#agebar), 6 alive again as an heir. Started from docs/reviews/round-2/final-engineering.md's hasprobe/stick/death.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const HTML = path.resolve(args.find(a => !a.startsWith('--')) || 'index.html');
const W = +opt('w', 1366), STATE = opt('state', null), NEW = opt('new', '42:noble:M:16'), JSONOUT = opt('json', null);
const BISECT = args.includes('--bisect');

// the in-page probe; also used by tests/suites/style.test.mjs (kept in step with it)
export const insertProbe = async (page, metrics, n = 12) => {
  const a = await metrics();
  await page.evaluate(n => {
    const tb = document.getElementById('tabbody') || document.getElementById('app') || document.body;
    for (let i = 0; i < n; i++) { const sp = document.createElement('span'); tb.appendChild(sp); void tb.offsetHeight; sp.remove(); void tb.offsetHeight; }
  }, n);
  const b = await metrics();
  return +(((b.RecalcStyleDuration - a.RecalcStyleDuration) * 1000) / Math.max(1, b.RecalcStyleCount - a.RecalcStyleCount)).toFixed(3);
};

async function main() {
  const browser = await pw.chromium.launch();
  const phone = W < 500;
  const ctx = await browser.newContext({ viewport: { width: W, height: phone ? 860 : 900 }, deviceScaleFactor: 1, hasTouch: phone, isMobile: phone });
  const page = await ctx.newPage(); page.setDefaultTimeout(600000);
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  await page.goto(pathToFileURL(HTML).href);
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 600000 });
  if (STATE) {
    const s = fs.readFileSync(STATE, 'utf8');
    await page.evaluate(s => { UI.set.hints = false; A.deserialize(JSON.parse(s)); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); }, s);
  } else {
    const [seed, status, sex, age] = NEW.split(':');
    await page.evaluate(o => { UI.set.hints = false; A.newGame(o); A.S.queue.length = 0; UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); },
      { seed: +seed, race: 'human', realm: 'POL-01', status, sex, startAge: +age });
  }
  const settle = () => page.evaluate(() => new Promise(r => setTimeout(r, 300)));
  const out = [];
  const probe = async label => {
    await settle();
    const ms = await insertProbe(page, metrics);
    const info = await page.evaluate(() => ({ hints: document.querySelectorAll('.hint').length, agebar: !!document.getElementById('agebar'), modal: !!document.getElementById('modal'),
      alive: !!(A.pc() && A.pc().alive), doc: document.getElementsByTagName('*').length, body: document.body.className }));
    const r = { label, insertStyleMs: ms, ...info };
    console.log(`${ms >= 1 ? 'SLOW' : 'ok  '} ${String(ms).padStart(7)} ms  ${label}  (${info.doc} elements, hints ${info.hints}, agebar ${info.agebar}, modal ${info.modal}, body "${info.body}")`);
    out.push(r); return r;
  };
  await probe('1. hints off, nothing drawn yet');
  // a first-run hint: hints on, every hint not yet seen, the page drawn again
  // (the clock's own hint comes first and is drawn by the stepper, so it is marked used: the Life tab's hint is drawn)
  await page.evaluate(() => { UI.set.hints = true; UI.set.hintsSeen = { clock: 1 }; if (UI.hintUsed) UI.hintUsed.clock = 1; UI.render(); });
  await probe('2. a hint drawn');
  await page.evaluate(() => { for (const h of document.querySelectorAll('.hint')) h.remove(); });
  await probe('3. every hint removed again');
  if (BISECT) { await bisect(page, metrics); await browser.close(); return; }
  await page.evaluate(() => { UI.set.hints = false; A.S.queue.length = 0; UI.ov = null; A.pcDeath('a fever'); UI.render(); });
  await probe('4. dead: the death screen');
  await page.evaluate(() => { UI.ov = null; A.S.queue.length = 0; UI.render(); });
  await probe('5. dead: the game screen with its bar');
  const heir = await page.evaluate(() => {
    const pc = A.pc(), all = Object.values(A.S.people).filter(p => p.alive && p.id !== pc.id);
    const k = all.find(p => (pc.children || []).includes(p.id)) || all.find(p => p.realm === pc.realm && A.age(p) >= 16 && A.age(p) <= 40) || all.find(p => A.age(p) >= 16);
    if (!k) return null; A.continueAs(k.id); A.S.queue.length = 0; UI.ov = null; UI.screen = 'game'; UI.tab = 'life'; UI.render(); return k.id;
  });
  if (heir) await probe('6. alive again as an heir');
  // a person's sheet over the game (on a phone, 71-phone's sheet with its own :has() rules), then an event card
  const sheet = await page.evaluate(() => {
    const pc = A.pc(), id = Object.keys(pc.rel || {}).find(k => A.P(k) && A.P(k).alive) || Object.values(A.S.people).find(p => p.alive && p.id !== pc.id).id;
    UI.A.ov('person:' + id);
    return !!document.getElementById('modal');
  });
  if (sheet) await probe('7. a person\'s sheet open');
  const card = await page.evaluate(() => {
    UI.ov = null; A.S.queue.length = 0; UI.render();
    const pc = A.pc(), ids = Object.keys(A.EV).filter(id => { try { const e = A.EV[id]; return !e.once && e.choices && e.cond && e.cond(pc, A.C); } catch (e) { return false; } }).sort();
    for (const ev of ids) { A.S.queue.push({ type: 'event', ev }); UI.render(); if (document.querySelector('#modal [data-a="evChoose"]')) return ev; A.S.queue.length = 0; }
    return null;
  });
  if (card) await probe(`8. an event card open (${card})`);
  const worst = Math.max(...out.map(r => r.insertStyleMs));
  console.log(`worst ${worst} ms per insert (budget 1 ms); page errors ${errs.length}${errs.length ? ': ' + errs[0] : ''}`);
  if (JSONOUT) fs.writeFileSync(JSONOUT, JSON.stringify({ html: HTML, w: W, state: STATE, new: STATE ? null : NEW, probes: out, worst, errs }, null, 1));
  await browser.close();
  process.exitCode = worst >= 1 ? 1 : 0;
}

// every :has() rule out, then each put back alone and the probe run: names the rules that switch the restyle on
async function bisect(page, metrics) {
  const n = await page.evaluate(() => {
    const L = window.__HAS = [];
    const walk = owner => { const R = owner.cssRules; for (let i = R.length - 1; i >= 0; i--) { const r = R[i]; if (r.type === 1) { if ((r.selectorText || '').includes(':has(')) { L.push({ owner, i, css: r.cssText, sel: r.selectorText }); owner.deleteRule(i); } } else if (r.cssRules) walk(r); } };
    for (const sh of document.styleSheets) { try { walk(sh); } catch (e) {} }
    UI.set.hints = true; UI.render(); return L.length;
  });
  console.log(`all ${n} :has() rules out:`, await insertProbe(page, metrics));
  for (let k = 0; k < n; k++) {
    const sel = await page.evaluate(k => { const h = window.__HAS[k]; h.at = h.owner.insertRule(h.css, Math.min(h.i, h.owner.cssRules.length)); UI.render(); void document.body.offsetHeight; return h.sel; }, k);
    const ms = await insertProbe(page, metrics);
    await page.evaluate(k => { const h = window.__HAS[k]; h.owner.deleteRule(h.at); }, k);
    console.log(ms >= 1 ? 'SLOW' : 'ok  ', String(ms).padStart(7), sel.slice(0, 220));
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(e => { console.error('FATAL', e.stack || e); process.exit(1); });
