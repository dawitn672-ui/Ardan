// The Polity's world bench (the target table in docs/research/backtests.md, "Priority design 1").
//
//   node features/9996-polity/bench.mjs --html=/tmp/ardan/P/x.html [--seeds=10] [--years=100] [--lands=known|great] [--json=out.json]
//
// Plays whole worlds (a peasant player, swapped for any adult on death, as 56's audit does) and reads every AI realm
// each year: laws changed (all eight groups; a build without the Polity reads its three), realms with a change
// outside taxes and authority, elections and the votes recorded, taxes at an extreme at 60 years and at the end,
// hoarding flags (a treasury over 6 years of income), wars of succession and liberty revolts, offices held by named
// people. One browser, one page. A build without this feature gives the same readings where they exist.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const html = path.resolve(arg('html', 'index.html')), N = +arg('seeds', 3), YEARS = +arg('years', 30), LANDS = arg('lands', 'known');
const SEEDS = (arg('seedlist') ? arg('seedlist').split(',').map(Number) : [606, 1212, 2424, 4848, 7, 99, 3131, 5050, 8080, 9191]).slice(0, N);

const browser = await pw.chromium.launch();
const page = await (await browser.newContext()).newPage();
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await page.goto(pathToFileURL(html).href);
await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
// --lives: political scenes a decade by start path (noble, merchant, priest, soldier, peasant, ruler), YEARS each
if (arg('lives')) {
  const PATHS = { noble: { status: 'noble', realm: 'POL-01' }, merchant: { status: 'merchant', realm: 'POL-04' }, priest: { status: 'peasant', realm: 'POL-03', job: 'clergy' }, soldier: { status: 'peasant', realm: 'POL-01', mil: 4 }, peasant: { status: 'peasant', realm: 'POL-01' }, ruler: { status: 'royal', realm: 'POL-02', ruler: 1 } };
  const res = {};
  for (const [name, P0] of Object.entries(PATHS)) for (const seed of SEEDS.slice(0, +arg('lives'))) {
    const o = await page.evaluate(([seed, P0, YEARS, LANDS]) => {
      A.newGame({ seed, lands: LANDS, race: 'human', realm: LANDS === 'great' ? (P0.ruler ? 'POL-36' : 'POL-58') : P0.realm, status: P0.status, sex: 'M', startAge: 22 });
      const pc = A.pc();
      if (P0.job) { pc.job = { c: 'clergy', r: 3, perf: 50, yrs: 0 }; pc.flags.priest = A.S.year; }
      if (P0.mil && A.enlist) { A.enlist(pc, false); if (pc.mil) pc.mil.rank = Math.max(pc.mil.rank || 0, P0.mil); }
      if (P0.ruler) A.makeRuler(pc, pc.realm);
      const y0 = A.S.year, ids = [];
      const view = A.eventView;
      A.eventView = function (q) { if (q && !q.view && q.ev) ids.push(q.ev); return view.apply(this, arguments); };
      const end = y0 + YEARS;
      for (let k = 0; k < 100000 && A.S.year < end; k++) { A.advance(30); let h, g = 0; while ((h = A.headReady()) && g++ < 300) { if (h.type === 'event') { A.eventView(h); A.eventAuto(); } else A.skipPrompt(); } if (!A.pc() || !A.pc().alive) break; }
      A.eventView = view;
      const pol = ids.filter(id => /^po_|^ri_court|^ri_ask/.test(id) || (A.EV[id] && A.EV[id].council)).filter((x, i, a) => true);
      const uniq = []; let last = null; for (const q of pol) { if (q !== last) uniq.push(q); last = q; }
      return { years: A.S.year - y0, n: uniq.length, kinds: [...new Set(uniq)].slice(0, 12) };
    }, [seed, P0, YEARS, LANDS]);
    (res[name] = res[name] || []).push(o);
    console.error(`${name} ${seed}: ${o.n} political scenes in ${o.years} years`);
  }
  const out = {}; for (const k in res) { const y = res[k].reduce((a, x) => a + x.years, 0), n = res[k].reduce((a, x) => a + x.n, 0); out[k] = { perDecade: +(10 * n / Math.max(1, y)).toFixed(2), years: y, kinds: [...new Set(res[k].flatMap(x => x.kinds))] }; }
  console.log(JSON.stringify(out, null, 1));
  if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(out, null, 1));
  await browser.close();
  process.exit(0);
}
const runs = [];
for (const seed of SEEDS) {
  const t0 = Date.now();
  runs.push(await page.evaluate(([seed, YEARS, LANDS]) => {
    A.newGame({ seed, lands: LANDS, race: 'human', realm: LANDS === 'great' ? 'POL-36' : 'POL-01', status: 'peasant', sex: 'M', startAge: 16, diff: 'story' });
    const P = A.POL, o = { seed, ry: 0, legit: [], low: 0, estN: 0, angry: 0, loyal: 0, claimFy: 0, fac40: 0, facY: 0, realms: 0, changes: 0, byGroup: {}, outside: 0, hoard: 0, throne: 0, revolts: 0, wars: 0, elected: 0, electedVotes: 0, succ: 0, tax60: null, taxEnd: null, offices: [], held: 0, offN: 0, ms: 0 };
    const groups = ['tax', 'auth', 'levy', 'obl', 'just', 'comm', 'trade', 'faith'];
    const posOf = (r, g) => P ? P.pos(r, g) : g === 'tax' ? (r.laws.tax || 1) : g === 'auth' ? r.laws.authority : g === 'levy' ? r.laws.levy : null;
    const last = {}, outside = new Set(), seen = new Set();
    const ai = () => Object.values(A.S.realms).filter(r => r.alive && !r.isRebel && !r.playerRun);
    // successions in realms that elect, and whether a vote was recorded for them
    const rd = A.rulerDies;
    A.rulerDies = function (r) { const el = r && ['elective', 'council', 'theocracy'].includes(r.gov), v0 = r && r.pol && r.pol.vote; const res = rd.apply(this, arguments); if (el) { o.succ++; if (r.pol && r.pol.vote && r.pol.vote !== v0) { o.elected++; o.electedVotes += r.pol.vote.electors.length; } } return res; };
    const ids = new Set(A.S.wars.map(w => w.id)), end = A.S.year + YEARS, y0 = A.S.year;
    const extreme = () => { const xs = ai(); return xs.length ? Math.round(100 * xs.filter(r => (r.laws.tax || 1) <= .6 || (r.laws.tax || 1) >= 1.5).length / xs.length) : null; };
    let lastY = A.S.year;
    const t = performance.now();
    for (let k = 0; k < 100000 && A.S.year < end; k++) {
      A.advance(30);
      let h, g = 0; while ((h = A.headReady()) && g++ < 300) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); }
      if (!A.pc().alive) { const kid = Object.values(A.S.people).find(p => p.alive && p.id !== A.S.pc && A.isAdult(p)); if (!kid) break; A.S.pc = kid.id; }
      for (const w of A.S.wars) if (!ids.has(w.id)) { ids.add(w.id); o.wars++; if (w.cb === 'throne') o.throne++; if (w.cb === 'liberty' || w.cb === 'independence') o.revolts++; }
      if (A.S.year === lastY) continue;
      lastY = A.S.year;
      for (const r of ai()) {
        o.ry++; seen.add(r.id);
        if (r.treasury / Math.max(1, r.income) > 6) o.hoard++;
        o.legit.push(Math.round(r.legit || 0)); if ((r.legit || 0) < 45) o.low++;
        if (P && r.pol) { const ES = P.estState(r); for (const k of P.EST) { o.estN++; if (ES[k].angry) o.angry++; if (ES[k].loyal) o.loyal++; } }
        for (const f of A.factionsOf(r.id)) { o.facY++; if (f.kind === 'claimant') o.claimFy++; if ((f.power || 0) >= .4) o.fac40++; }
        const L = last[r.id] = last[r.id] || {};
        for (const gk of groups) {
          const v = posOf(r, gk); if (v == null) continue;
          if (L[gk] != null && L[gk] !== v) { o.changes++; o.byGroup[gk] = (o.byGroup[gk] || 0) + 1; if (gk !== 'tax' && gk !== 'auth') outside.add(r.id); }
          L[gk] = v;
        }
      }
      if (A.S.year - y0 === 60) o.tax60 = extreme();
    }
    o.ms = Math.round(performance.now() - t);
    o.realms = seen.size; o.outside = outside.size; o.taxEnd = extreme();
    for (const r of ai()) { const n = (r.pol ? r.pol.off.length : 0) + Object.keys(r.council || {}).length; o.offices.push(n); o.offN += n; o.held += (r.pol ? r.pol.off.filter(x => A.P(x.pid) && A.P(x.pid).alive).length : 0) + Object.values(r.council || {}).filter(id => A.P(id) && A.P(id).alive).length; }
    o.stats = P ? Object.assign({}, P.stats) : null;
    return o;
  }, [seed, YEARS, LANDS]));
  console.error(`seed ${seed}: ${Math.round((Date.now() - t0) / 1000)}s`);
}
await browser.close();
const sum = k => runs.reduce((a, r) => a + (r[k] || 0), 0);
const ry = sum('ry'), cent = ry / 100;
const med = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const offs = runs.flatMap(r => r.offices);
const out = {
  html: path.basename(html), lands: LANDS, seeds: SEEDS, years: YEARS, realmYears: ry,
  lawChangesPerRealmCentury: +(sum('changes') / Math.max(1, cent)).toFixed(1),
  byGroup: runs.reduce((a, r) => { for (const k in r.byGroup) a[k] = (a[k] || 0) + r.byGroup[k]; return a; }, {}),
  realmsWithChangeOutsideTaxAuthPct: Math.round(100 * sum('outside') / Math.max(1, sum('realms'))),
  electiveSuccessions: sum('succ'), withRecordedVotes: sum('elected'), votesNamed: sum('electedVotes'),
  taxExtremeAt60Pct: runs.some(r => r.tax60 != null) ? Math.round(runs.filter(r => r.tax60 != null).reduce((a, r) => a + r.tax60, 0) / runs.filter(r => r.tax60 != null).length) : null,
  taxExtremeEndPct: Math.round(runs.reduce((a, r) => a + (r.taxEnd || 0), 0) / runs.length),
  hoardingFlags: sum('hoard'), warsOfSuccession: sum('throne'), libertyRevolts: sum('revolts'), wars: sum('wars'),
  officesARealm: { p10: offs.length ? offs.slice().sort((a, b) => a - b)[Math.floor(offs.length * .1)] : null, median: med(offs), p90: offs.length ? offs.slice().sort((a, b) => a - b)[Math.floor(offs.length * .9)] : null },
  officesHeldPct: Math.round(100 * sum('held') / Math.max(1, sum('offN'))),
  msPerYear: Math.round(sum('ms') / Math.max(1, runs.length * YEARS)),
  legitimacy: (() => { const L = runs.flatMap(r => r.legit).sort((a, b) => a - b); return { p10: L[Math.floor(L.length * .1)], median: L[Math.floor(L.length / 2)], p90: L[Math.floor(L.length * .9)], under45Pct: +(100 * sum('low') / Math.max(1, ry)).toFixed(1) }; })(),
  estatesAngryPct: +(100 * sum('angry') / Math.max(1, sum('estN'))).toFixed(1), estatesLoyalPct: +(100 * sum('loyal') / Math.max(1, sum('estN'))).toFixed(1),
  claimantFactionYears: sum('claimFy'), factionYearsAt40: sum('fac40'), factionYears: sum('facY'),
  runs, errors: errs.slice(0, 5),
};
const txt = JSON.stringify(out, null, 1);
if (arg('json')) fs.writeFileSync(arg('json'), txt);
console.log(JSON.stringify(Object.fromEntries(Object.entries(out).filter(([k]) => k !== 'runs' && k !== 'byGroup')), null, 1));
