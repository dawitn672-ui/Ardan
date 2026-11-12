// One long life, played by the engine's own bot, audited as it goes (round 2 A0, docs/CRITIQUE.md Q7 and R5).
//
//   node tools/bench/life.mjs [built.html] [--seed=7] [--status=peasant] [--sex=F] [--age=0] [--years=60]
//        [--realm=POL-01] [--dump=dir] [--every=10] [--json=out.json]
//
// From a new game, A.advance with every card answered by A.eventAuto (as tests/helpers.mjs T.play does); when the
// player dies, play goes on as the eldest living child (else someone of the realm aged 16 to 30). Every month it runs
// A.V2F.audit() (one holder per title and seat) off the game's stream, and it counts every console.error and page
// error, every throw of A.V2N.regrant and every month whose regrant pass threw. --dump writes the state and the journal
// every --every years (<dir>/<tag>-y<n>-state.json), the saves A1's press gate is built on.
// Exit code 1 when anything threw, logged an error, or the audit was not empty at the end.
//
// The seed-7 peasant girl from birth is the life of docs/reviews/round-2/final-engineering.md, where N.regrant threw
// in 1159 and Rushzag Oasis had two lords from 1160. Moved here from tools/critique-probes/ (gen.cjs and regrant.cjs of
// the deciding engineering critic), cleaned to take the build's path.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { watchPage } from '../lib/page-errors.mjs';

const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const arg = (k, d) => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const HTML = path.resolve(args.find(a => !a.startsWith('--')) || path.join(root, 'index.html'));
const O = { seed: +arg('seed', 7), status: arg('status', 'peasant'), sex: arg('sex', 'F'), startAge: +arg('age', 0), realm: arg('realm', 'POL-01'), race: 'human' };
const YEARS = +arg('years', 60), EVERY = +arg('every', 10), DUMP = arg('dump', null), JSONOUT = arg('json', null);
const TAG = arg('tag', `${O.status}-s${O.seed}`);
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}] life ${TAG}: ` + a.join(' '));

// installed in the page: the monthly audit and the regrant watch (drawing nothing, touching no game stream)
const WATCH = () => {
  const N = A.V2N, F = A.V2F, W = window.__L = { throws: [], passThrows: 0, audits: [], auditImpure: false };
  if (N && N.regrant) {
    const rg = N.regrant;
    N.regrant = function (t) {
      try { return rg.apply(this, arguments); } catch (e) {
        const oh = t.house && A.S.houses[t.house];
        if (W.throws.length < 40) W.throws.push({ y: A.S.year, title: t.k, name: t.name, house: t.house, houseHead: oh ? oh.headPid : null, err: String(e).slice(0, 160) });
        throw e;
      }
    };
  }
  if (N && N.regrantMonth) { const rm = N.regrantMonth; N.regrantMonth = function () { try { return rm.apply(this, arguments); } catch (e) { W.passThrows++; throw e; } }; }
  A.onMonth.push(function () {
    if (!F || !F.audit) return;
    const k0 = A.rngState; let au = [];
    try { au = F.audit(); } catch (e) { au = [{ k: 'audit threw ' + e }]; }
    if (A.rngState !== k0) { W.auditImpure = true; A.rngState = k0; }
    if (au.length) { const key = au.map(b => b.k + ' ' + (b.id == null ? '' : b.id) + ' ' + (b.holders || []).join('/')).join('; '); const last = W.audits[W.audits.length - 1]; if (!last || last.key !== key) W.audits.push({ y: A.S.year, key }); }
    else if (W.audits.length && W.audits[W.audits.length - 1].key !== '') W.audits.push({ y: A.S.year, key: '' });
  });
};

async function main() {
  const browser = await pw.chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); page.setDefaultTimeout(3600000);
  const errs = [];
  watchPage(page, errs);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
  const cpu = async () => (await cdp.send('Performance.getMetrics')).metrics.find(x => x.name === 'ThreadTime').value;
  await page.goto(pathToFileURL(HTML).href);
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 600000 });
  const st = await page.evaluate(o => { A.newGame(o); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); const pc = A.pc(); return { year: A.S.year, name: pc.given, age: A.age(pc) }; }, O);
  await page.evaluate(WATCH);
  log('start', JSON.stringify(st), JSON.stringify(O));
  if (DUMP) fs.mkdirSync(DUMP, { recursive: true });
  const dump = async off => {
    const d = await page.evaluate(() => ({ s: A.serialize(), j: JSON.stringify(A.J), year: A.S.year, fp: A.fingerprint() }));
    fs.writeFileSync(path.join(DUMP, `${TAG}-y${off}-state.json`), d.s);
    fs.writeFileSync(path.join(DUMP, `${TAG}-y${off}-journal.json`), d.j);
    log(`dump +${off}: year ${d.year}, state ${(d.s.length / 1e6).toFixed(2)} MB, fp ${d.fp}`);
  };
  if (DUMP) await dump(0);
  const notes = [];
  for (let off = EVERY; off <= YEARS; off += EVERY) {
    const t0 = await cpu();
    const r = await page.evaluate(n => {
      const end = A.S.year + n, notes = []; let cards = 0;
      for (let guard = 0; guard < 20000 && A.S.year < end; guard++) {
        const r = A.advance(400); let h, g = 0;
        while ((h = A.headReady()) && g++ < 500) { if (h.type === 'event') { A.eventView(h); A.eventAuto(); cards++; } else A.skipPrompt(); }
        const pc = A.pc();
        if (r.why === 'dead' || !pc || !pc.alive) {
          const P = id => A.S.people[id];
          const k2 = ((pc && pc.children) || []).map(P).filter(p => p && p.alive).sort((x, y) => A.age(y) - A.age(x))[0] || Object.values(A.S.people).find(p => p.alive && pc && p.realm === pc.realm && A.age(p) >= 16 && A.age(p) <= 30);
          notes.push(`${A.S.year}: ${pc ? pc.given + ' (' + A.age(pc) + ')' : '?'} died; continued as ${k2 ? k2.given + ' (' + A.age(k2) + ')' : 'nobody'}`);
          if (k2) { A.continueAs(k2.id); UI.ov = null; } else return { notes, cards, dead: true };
        }
      }
      return { notes, cards, year: A.S.year };
    }, Math.min(EVERY, YEARS - off + EVERY));
    const t1 = await cpu();
    for (const n of r.notes) { notes.push(n); log('note', n); }
    const w = await page.evaluate(() => ({ throws: __L.throws.length, pass: __L.passThrows, audit: (__L.audits[__L.audits.length - 1] || { key: '' }).key }));
    log(`+${off}: year ${r.year}, ${(t1 - t0).toFixed(1)} s CPU, ${r.cards} cards; errors ${errs.length}, regrant throws ${w.throws}, passes that threw ${w.pass}, audit ${w.audit ? '"' + w.audit.slice(0, 160) + '"' : 'empty'}`);
    if (DUMP && off % EVERY === 0) await dump(off);
    if (r.dead) break;
  }
  const end = await page.evaluate(() => ({ L: __L, audit: A.V2F && A.V2F.audit ? A.V2F.audit() : null, year: A.S.year, fp: A.fingerprint(), check: A.V2SAVE && A.V2SAVE.check ? A.V2SAVE.check() : null }));
  const bad = errs.length || end.L.throws.length || end.L.passThrows || (end.audit && end.audit.length) || end.L.audits.some(a => a.key);
  const out = { html: HTML, o: O, years: YEARS, year: end.year, fp: end.fp, errors: errs, notes, regrantThrows: end.L.throws, passThrows: end.L.passThrows, auditHistory: end.L.audits, auditAtEnd: end.audit, auditImpure: end.L.auditImpure, saveCheck: end.check };
  if (JSONOUT) fs.writeFileSync(JSONOUT, JSON.stringify(out, null, 1));
  log(`done: year ${end.year}, fp ${end.fp}; console errors ${errs.length}${errs.length ? ' (' + errs[0].slice(0, 160) + ')' : ''}; regrant throws ${end.L.throws.length}; audit ever non-empty ${end.L.audits.filter(a => a.key).length ? 'yes: ' + end.L.audits.filter(a => a.key).map(a => a.y + ' ' + a.key).join(' | ').slice(0, 400) : 'no'}; audit at end ${end.audit ? end.audit.length : 'n/a'}; audit pure ${!end.L.auditImpure}`);
  await browser.close();
  process.exitCode = bad ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(e => { log('FATAL', e.stack || e); process.exit(1); });
