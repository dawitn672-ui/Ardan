// The world audit for 56-realm-inside (Road to Ten, Diplomacy 5: "10 seeds of 100 years each show 0 hoarding flags").
//
//   node features/56-realm-inside/audit.mjs --html=/tmp/ardan/realm-inside/full.html --seeds=10 --years=100 [--json=out.json]
//
// Plays whole worlds (a peasant player, swapped for any adult on death) and reads every AI realm each year: the
// hoarding flag (a treasury over 6 years of income), the share of income burned (any treasury loss inside A.forcesAI
// that no booked line explains), spending by category (r.riBook), armies against their normal size, stability, wars,
// wars of succession, and what the court did. A build without this feature (no A.RI) gets the same readings, with
// the burn read the same way, so the release's fix layer can be measured as a baseline.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const html = path.resolve(arg('html', 'index.html')), N = +arg('seeds', 3), YEARS = +arg('years', 30);
const SEEDS = [606, 1212, 2424, 4848, 7, 99, 3131, 5050, 8080, 9191, 1313, 2626].slice(0, N);

const browser = await pw.chromium.launch();
const page = await (await browser.newContext()).newPage();
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await page.goto(pathToFileURL(html).href);
await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
const runs = [];
for (const seed of SEEDS) {
  const t0 = Date.now();
  runs.push(await page.evaluate(([seed, YEARS]) => {
    A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16, diff: 'story' });
    const RI = A.RI, o = { seed, ry: 0, hoard: 0, inc: 0, up: 0, burned: 0, cats: {}, wars: 0, throne: 0, revolts: 0, army: [], stab: [], tre: [], laws: 0, lawsPassed: 0, deals: 0, claims: 0, claimsBacked: 0, facYears: 0, facsHead: 0 };
    const fa = A.forcesAI, td = A.trainDiv;
    let inTrain = 0;
    A.trainDiv = function (r) { const t = r.treasury, res = td.apply(this, arguments); inTrain += Math.max(0, t - r.treasury); return res; };
    A.forcesAI = function (x) {
      const t0 = x.treasury, d0 = x.debt || 0, B = x.riBookNext, c0 = B ? Object.values(B.cats).reduce((a, b) => a + b, 0) : 0; inTrain = 0;
      const res = fa.apply(this, arguments);
      const B1 = x.riBookNext, c1 = B1 ? Object.values(B1.cats).reduce((a, b) => a + b, 0) : 0;
      const booked = RI ? c1 - c0 : inTrain, lost = (t0 - x.treasury) - booked - Math.max(0, d0 - (x.debt || 0));
      if (lost > 1 && !x.isRebel && !(A.myRealm && A.myRealm() === x)) o.burned += lost;
      return res;
    };
    const ai = () => Object.values(A.S.realms).filter(r => r.alive && !r.isRebel && !r.playerRun);
    const ids = new Set(A.S.wars.map(w => w.id)), end = A.S.year + YEARS;
    let lastY = A.S.year;
    try {
      for (let k = 0; k < 100000 && A.S.year < end; k++) {
        A.advance(30);
        let h, g = 0; while ((h = A.headReady()) && g++ < 300) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); }
        if (!A.pc().alive) { const kid = Object.values(A.S.people).find(p => p.alive && p.id !== A.S.pc && A.isAdult(p)); if (!kid) break; A.S.pc = kid.id; }
        for (const w of A.S.wars) if (!ids.has(w.id)) { ids.add(w.id); o.wars++; if (w.cb === 'throne') o.throne++; if (w.cb === 'liberty') o.revolts++; }
        if (A.S.year === lastY) continue;
        const y = lastY = A.S.year;
        for (const x of ai()) {
          o.ry++;
          o.inc += Math.round(x.income * .92); o.up += Math.round(x.army * 3.2 + x.levy * .05);
          const B = x.riBook;
          if (B && B.y === y) for (const c in B.cats) o.cats[c] = (o.cats[c] || 0) + B.cats[c];
          const q = x.treasury / Math.max(1, x.income); o.tre.push(q); if (q > 6) o.hoard++;
          const L = LORE.realms[x.id], base = (L ? L.army : x.army0 || x.army) * (x.provPop || 1) / (x.basePop || 1);
          o.army.push(x.army / Math.max(1, base)); o.stab.push(x.stability);
          for (const e of (x.riCourt || []).filter(e => e.y === y)) {
            if (RI.PUSH[e.k] && RI.PUSH[e.k].law && e.p !== 100 && !e.ruler) { o.laws++; if (e.yes) o.lawsPassed++; }
            if (['pension', 'seatdeal', 'refuse'].includes(e.k)) o.deals++;
            if (e.k === 'claim') { o.claims++; if (e.back && e.back.length) o.claimsBacked++; }
          }
          for (const f of A.factionsOf(x.id)) { o.facYears++; const l = A.S.houses[f.leader], hd = l && l.headPid ? A.P(l.headPid) : null; if (hd && hd.alive) o.facsHead++; }
        }
      }
    } finally { A.forcesAI = fa; A.trainDiv = td; }
    if (!RI) o.cats.recruits = undefined;
    const q = (a, f) => { const s = a.slice().sort((x, y) => x - y); return s.length ? Math.round(100 * s[Math.floor(f * (s.length - 1))]) / 100 : null; };
    return Object.assign(o, { army: [q(o.army, .1), q(o.army, .5), q(o.army, .9)], stab: [q(o.stab, .1), q(o.stab, .5), q(o.stab, .9)], tre: [q(o.tre, .5), q(o.tre, .9), q(o.tre, 1)],
      taxes: ai().reduce((m, x) => { const t = (x.laws && x.laws.tax) || 1; m[t] = (m[t] || 0) + 1; return m; }, {}) });
  }, [seed, YEARS]));
  const r = runs[runs.length - 1];
  console.error(`seed ${seed}: ${r.ry} realm-years, hoarding ${r.hoard}, burned ${Math.round(1000 * r.burned / r.inc) / 10}%, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await browser.close();
const sum = k => runs.reduce((a, r) => a + (r[k] || 0), 0), inc = sum('inc'), pc = v => Math.round(1000 * v / inc) / 10;
const cats = {}; for (const r of runs) for (const k in r.cats) if (r.cats[k] != null) cats[k] = (cats[k] || 0) + r.cats[k];
const out = {
  html: path.basename(html), seeds: SEEDS, years: YEARS, realmYears: sum('ry'), hoardingFlags: sum('hoard'), burnedPctOfIncome: pc(sum('burned')),
  spentPctOfIncome: Object.assign({ hostUpkeep: pc(sum('up')) }, Object.fromEntries(Object.entries(cats).map(([k, v]) => [k, pc(v)]))),
  warsPerRealmYear: Math.round(1000 * sum('wars') / sum('ry')) / 1000, warsOfSuccession: sum('throne'), revolts: sum('revolts'),
  court: { lawsDecided: sum('laws'), lawsPassed: sum('lawsPassed'), vassalDeals: sum('deals'), claimants: sum('claims'), claimantsWithBackers: sum('claimsBacked'),
    factionYears: sum('facYears'), factionYearsLedByNamedHead: sum('facsHead') },
  perSeed: runs.map(r => ({ seed: r.seed, hoard: r.hoard, burnedPct: Math.round(1000 * r.burned / r.inc) / 10, army: r.army, stability: r.stab, treasuryYears: r.tre, wars: r.wars, throne: r.throne, taxes: r.taxes })),
  pageErrors: errs.slice(0, 5),
};
console.log(JSON.stringify(out, null, 1));
if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(out, null, 1));
