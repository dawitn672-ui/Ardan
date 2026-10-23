// Measurements behind features/68-casus-belli/README.md, on a built page. One browser, whole worlds; they take minutes.
//
//   node features/68-casus-belli/bench.mjs --html=<built.html> [--seeds=10] [--years=100] [--off] [--json=out.json]
//
// It plays worlds the way features/56-realm-inside/audit.mjs does (a peasant player, swapped for another adult who is
// not a ruler when he dies), and reads, for every AI realm and every war:
//   wars        every war an AI realm starts (warStart, not silent): its cause, and what its casus belli cites (a line of
//               55-bonds' feud ledger, a release memory, the realm's want from 47-realm-bible, a debt, a claim, a trait,
//               an opportunity). The share citing a memory or a want, pooled and per seed. Wars per realm-year.
//   traits      every AI decision written to 20-ai-personality's log (A.aiLogAdd), plus the crown's spending choices
//               that this feature logs: in character (the ruler's own traits pushed toward what was done, lean >= .05),
//               against (lean <= -.05), or no say. The share in character, by decision kind.
//   pairs       the benchmark's D2: for each (decision kind x trait) with a declared direction, the rate per ruler-year
//               of rulers with the trait against rulers without it; a pair "moves the declared way" at 1.5x or more.
//   hoard       the plan's hoarding flag (a treasury over 6 years of income at the turn of the year), with what each
//               flagged realm held, earned and spent, so a flag can be explained.
// --off runs the same worlds with this feature switched off (A.CASUS.ON = false): the casus belli is still recorded,
// so the share is comparable, but nothing in the AI reads it.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const html = path.resolve(arg('html', 'index.html')), N = +arg('seeds', 10), YEARS = +arg('years', 100), OFF = process.argv.includes('--off');
const SEEDS = arg('seedlist') ? arg('seedlist').split(',').map(Number) : [606, 1212, 2424, 4848, 7, 99, 3131, 5050, 8080, 9191, 1313, 2626].slice(0, N);

const browser = await pw.chromium.launch();
const page = await (await browser.newContext()).newPage();
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await page.goto(pathToFileURL(html).href);
await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
const runs = [];
for (const seed of SEEDS) {
  const t0 = Date.now();
  runs.push(await page.evaluate(([seed, YEARS, OFF]) => {
    const CS = A.CASUS;
    if (CS) { CS.ON = !OFF; if (CS.TEMPER) CS.TEMPER.ON = !OFF; CS.resetStats && CS.resetStats(); }
    A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16, diff: 'story' });
    const o = { seed, ry: 0, ny: 0, wars: 0, aiWars: 0, civil: 0, cites: { memory: 0, feud: 0, relmem: 0, want: 0, debt: 0, any: 0, recorded: 0, shown: 0 }, citesInter: { n: 0, mw: 0 },
      byLead: {}, cbs: {}, hoard: [], tre: [], dec: {}, debtHonoured: { join: 0, gold: 0, stay: 0 }, ex: [] };
    const me = () => { const pc = A.pc(); return pc ? pc.ruler || null : null; };
    // decisions: in character or not, by kind
    const lg = A.aiLogAdd;
    const rulerYears = {}, acts = {}, spend = {};   // trait -> ruler-years; kind -> trait -> count (for D2)
    A.aiLogAdd = function (k, rid) {
      const e = lg.apply(this, arguments);
      try {
        const r = A.realm(rid);
        if (e && r && !r.playerRun && rid !== me()) {
          const d = o.dec[k] = o.dec[k] || { n: 0, inc: 0, ag: 0, inc25: 0, ag25: 0, inc60: 0, ag60: 0, forced: 0 };
          d.n++;
          // 56-realm-inside logs a trait reason for sellswords and aid only when it pushed toward them: read the
          // same weights both ways, so a peaceable ruler hiring sellswords counts against
          if ((k === 'mercs' || k === 'aid') && A.rulerPersona) { const P = A.rulerPersona(rid); e.lean = k === 'mercs' ? .5 * P.warLog : .3 * P.honor + .3 * P.warmth; }
          if (e.forced) d.forced++;
          else {
            if (e.lean >= .05) d.inc++; else if (e.lean <= -.05) d.ag++;
            if (e.lean >= .25) d.inc25++; else if (e.lean <= -.25) d.ag25++;
            if (e.lean >= .6) d.inc60++; else if (e.lean <= -.6) d.ag60++;
          }
          const ru = A.P(r.ruler);
          if (ru && !/^claimant|leader /.test(e.who || '')) { const a = acts[k] = acts[k] || { _all: 0 }; a._all++; for (const t of ru.traits || []) a[t] = (a[t] || 0) + 1; }
        }
      } catch (x) {}
      return e;
    };
    const onWar = (w, opts) => {
      if (opts && opts.silent) return;
      const ra = A.realm(w.leadA);
      o.wars++;
      if (!ra || ra.playerRun || w.leadA === me()) return;
      o.aiWars++;
      const civ = w.cb === 'throne' || w.cb === 'liberty' || ra.isRebel;
      if (civ) o.civil++;
      o.cbs[w.cb] = (o.cbs[w.cb] || 0) + 1;
      const c = w.casus;
      if (c) {
        o.cites.recorded++;
        const has = k => (c.cites || []).some(x => x.k === k);
        const mem = has('feud') || has('relmem') || has('debt'), want = has('want');
        if (has('feud')) o.cites.feud++; if (has('relmem')) o.cites.relmem++; if (has('want')) o.cites.want++; if (has('debt')) o.cites.debt++;
        if (mem) o.cites.memory++; if (mem || want) o.cites.any++;
        if (!civ) { o.citesInter.n++; if (mem || want) o.citesInter.mw++; }
        o.byLead[c.lead] = (o.byLead[c.lead] || 0) + 1;
        if (o.ex.length < 6 && (mem || want)) o.ex.push(c.t);
      } else if (A.BONDS && A.BONDS.FEUD && A.BONDS.FEUD.sum(w.leadA, w.leadD) <= -10) { o.cites.feud++; o.cites.memory++; o.cites.any++; if (!civ) { o.citesInter.n++; o.citesInter.mw++; } }
      else if (!civ) o.citesInter.n++;
    };
    A.on('warStart', onWar);
    const ai = () => Object.values(A.S.realms).filter(r => r.alive && !r.isRebel && !r.playerRun && r.id !== me());
    const end = A.S.year + YEARS;
    let lastY = A.S.year;
    try {
      for (let k = 0; k < 100000 && A.S.year < end; k++) {
        A.advance(30);
        let h, g = 0; while ((h = A.headReady()) && g++ < 300) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); }
        if (!A.pc().alive) { const kid = Object.values(A.S.people).find(p => p.alive && p.id !== A.S.pc && A.isAdult(p) && !p.ruler); if (!kid) break; A.S.pc = kid.id; }
        if (A.S.year === lastY) continue;
        const y = lastY = A.S.year;
        for (const x of ai()) {
          o.ry++;
          o.ny += A.neighbors(x.id).length;
          const ru = A.P(x.ruler);
          if (ru) for (const t of ru.traits || []) rulerYears[t] = (rulerYears[t] || 0) + 1;
          const Bk = x.riBook;
          if (Bk && (Bk.y === y || Bk.y === y - 1) && Bk.cats) {
            const tot = ['drill', 'works', 'bribes', 'subsidy', 'mercs'].reduce((a, c) => a + (Bk.cats[c] || 0), 0);
            if (tot > 0) for (const t of (ru ? ru.traits || [] : []).concat(['_all'])) { const m = spend[t] = spend[t] || { n: 0 }; m.n++; for (const c of ['drill', 'works', 'bribes', 'subsidy', 'mercs']) m[c] = (m[c] || 0) + (Bk.cats[c] || 0) / tot; }
          }
          rulerYears._all = (rulerYears._all || 0) + 1;
          const q = x.treasury / Math.max(1, x.income); o.tre.push(q);
          if (q > 6) {
            const B = x.riBook || {};
            o.hoard.push({ y, id: x.id, tre: Math.round(x.treasury), inc: Math.round(x.income), rev: x.riRev, provs: A.realmProvs(x.id).length, war: A.atWar(x.id).length,
              other: B.other, cats: B.cats, pcRuler: (A.pc() || {}).ruler || null, great: x.riGreatY, wf: x.csWind || null });
          }
        }
      }
    } finally { A.aiLogAdd = lg; A.HOOKS.warStart = A.HOOKS.warStart.filter(f => f !== onWar); if (CS) { CS.ON = true; if (CS.TEMPER) CS.TEMPER.ON = true; } }
    if (CS && CS.stats) o.debtHonoured = Object.assign({}, CS.stats);
    const q = (a, f) => { const s = a.slice().sort((x, y) => x - y); return s.length ? Math.round(100 * s[Math.floor(f * (s.length - 1))]) / 100 : null; };
    o.tre = [q(o.tre, .5), q(o.tre, .9), q(o.tre, 1)];
    o.rulerYears = rulerYears; o.acts = acts; o.spend = spend;
    o.taxes = ai().reduce((m, x) => { const t = (x.laws && x.laws.tax) || 1; m[t] = (m[t] || 0) + 1; return m; }, {});
    return o;
  }, [seed, YEARS, OFF]));
  const r = runs[runs.length - 1];
  console.error(`seed ${seed}${OFF ? ' (off)' : ''}: ${r.aiWars} AI wars (${r.civil} civil), cite memory/want ${r.cites.any} (${Math.round(100 * r.cites.any / Math.max(1, r.aiWars))}%), ` +
    `hoarding ${r.hoard.length}, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await browser.close();

const sum = (k, f) => runs.reduce((a, r) => a + (f ? f(r) : r[k] || 0), 0);
const pct = (a, b) => b ? Math.round(1000 * a / b) / 10 : null;
const dec = {}; for (const r of runs) for (const k in r.dec) { const d = dec[k] = dec[k] || { n: 0, inc: 0, ag: 0 }; d.n += r.dec[k].n; d.inc += r.dec[k].inc; d.ag += r.dec[k].ag; }
const dec2 = {}; for (const r of runs) for (const k in r.dec) { const d = dec2[k] = dec2[k] || {}; for (const f in r.dec[k]) d[f] = (d[f] || 0) + r.dec[k][f]; }
for (const k in dec) Object.assign(dec[k], dec2[k]);
const tot = (f, skip) => Object.entries(dec).filter(([k]) => !skip || !skip.includes(k)).reduce((a, [, d]) => a + (d[f] || 0), 0);
const decAll = { n: tot('n'), inc: tot('inc'), ag: tot('ag') };
// D2: (decision kind x trait) pairs, declared directions from 20-ai-personality's README
const DECL = {
  war: { ambitious: 1, wrathful: 1, cruel: 1, impetuous: 1, brave: 1, proud: 1, greedy: 1, content: -1, craven: -1, kind: -1, calm: -1, patient: -1, humble: -1, generous: -1 },
  call: { honest: 1, loyal: 1, honorable: 1, fickle: -1, deceitful: -1 }, refuse: { fickle: 1, deceitful: 1, honest: -1, loyal: -1, honorable: -1 },
  unally: { fickle: 1, deceitful: 1, loyal: -1, honest: -1, honorable: -1 },
  ally: { gregarious: 1, shy: -1 }, trib: { cautious: 1, craven: 1, proud: -1, humble: 1 }, exact: { greedy: 1, generous: -1 },
  def: { cautious: 1, craven: 1, brave: -1, reckless: -1 }, yield: { cautious: 1, craven: 1, proud: -1, wrathful: -1 },
  emb: { greedy: 1, wrathful: 1, kind: -1, generous: -1 }, rival: { wrathful: 1, proud: 1, kind: -1, calm: -1 },
};
const pairs = [];
const pool = (r, k, t) => (r.acts[k] || {})[t] || 0;
for (const k in DECL) for (const t in DECL[k]) {
  const withN = sum(0, r => pool(r, k, t)), allN = sum(0, r => pool(r, k, '_all')), yW = sum(0, r => r.rulerYears[t] || 0), yA = sum(0, r => r.rulerYears._all || 0);
  if (yW < 50 || allN < 20) continue;
  const rw = withN / yW, ro = (allN - withN) / Math.max(1, yA - yW), ratio = ro ? rw / ro : null;
  pairs.push({ k, t, dir: DECL[k][t], with: withN, ratio: ratio == null ? null : Math.round(100 * ratio) / 100, ok: ratio != null && (DECL[k][t] > 0 ? ratio >= 1.5 : ratio <= 1 / 1.5) });
}
const out = {
  html: path.basename(html), off: OFF, seeds: SEEDS, years: YEARS, realmYears: sum('ry'), neighbourYears: sum('ny'),
  wars: { all: sum('wars'), ai: sum('aiWars'), civil: sum('civil'), perRealmYear: Math.round(10000 * sum('aiWars') / sum('ry')) / 10000, interPer1000NeighbourYears: Math.round(10000 * (sum('aiWars') - sum('civil')) / sum('ny')) / 10 },
  cites: { recorded: sum(0, r => r.cites.recorded), memoryOrWantPct: pct(sum(0, r => r.cites.any), sum('aiWars')), interMemoryOrWantPct: pct(sum(0, r => r.citesInter.mw), sum(0, r => r.citesInter.n)),
    feud: sum(0, r => r.cites.feud), releaseMemory: sum(0, r => r.cites.relmem), want: sum(0, r => r.cites.want), debt: sum(0, r => r.cites.debt),
    perSeedPct: runs.map(r => pct(r.cites.any, r.aiWars)) },
  leadCause: runs.reduce((m, r) => { for (const k in r.byLead) m[k] = (m[k] || 0) + r.byLead[k]; return m; }, {}),
  cbs: runs.reduce((m, r) => { for (const k in r.cbs) m[k] = (m[k] || 0) + r.cbs[k]; return m; }, {}),
  traits: { inCharacterPct: pct(decAll.inc, decAll.inc + decAll.ag), decisions: decAll.n, withTraitSay: decAll.inc + decAll.ag, forcedLeftOut: tot('forced'),
    at25: pct(tot('inc25'), tot('inc25') + tot('ag25')), at60: pct(tot('inc60'), tot('inc60') + tot('ag60')),
    withoutCourt: pct(tot('inc', ['court']), tot('inc', ['court']) + tot('ag', ['court'])),
    byKind: Object.fromEntries(Object.entries(dec).sort((a, b) => b[1].n - a[1].n).map(([k, d]) => [k, { n: d.n, inChar: d.inc, against: d.ag, pct: pct(d.inc, d.inc + d.ag), pct25: pct(d.inc25, d.inc25 + d.ag25), forced: d.forced || 0 }])) },
  spendByTrait: (() => { const S = {}; for (const r of runs) for (const t in r.spend) { const m = S[t] = S[t] || { n: 0 }; for (const f in r.spend[t]) m[f] = (m[f] || 0) + r.spend[t][f]; }
    const base = S._all || { n: 1 }, sh = (m, c) => (m[c] || 0) / Math.max(1, m.n), out = [];
    const DS = { drill: { ambitious: 1, wrathful: 1, brave: 1, content: -1, kind: -1 }, works: { greedy: 1, generous: -1 }, bribes: { kind: 1, generous: 1, cruel: -1 }, subsidy: { honest: 1, loyal: 1, kind: 1, deceitful: -1 } };
    for (const c in DS) for (const t in DS[c]) { const m = S[t]; if (!m || m.n < 50) continue; const ratio = sh(m, c) / Math.max(1e-9, sh(base, c)); out.push({ c, t, dir: DS[c][t], n: m.n, ratio: Math.round(100 * ratio) / 100, ok: DS[c][t] > 0 ? ratio >= 1.2 : ratio <= 1 / 1.2 }); }
    return { ok: out.filter(x => x.ok).length, of: out.length, pairs: out }; })(),
  pairsD2: { ok: pairs.filter(p => p.ok).length, of: pairs.length, pct: pct(pairs.filter(p => p.ok).length, pairs.length), pairs },
  hoard: { flags: sum(0, r => r.hoard.length), list: runs.flatMap(r => r.hoard.map(h => Object.assign({ seed: r.seed }, h))).slice(0, 30), treasuryYears: runs.map(r => r.tre) },
  taxesAtEnd: runs.reduce((m, r) => { for (const k in r.taxes) m[k] = (m[k] || 0) + r.taxes[k]; return m; }, {}),
  debt: runs.reduce((m, r) => { for (const k in r.debtHonoured) m[k] = (m[k] || 0) + r.debtHonoured[k]; return m; }, {}),
  examples: runs.flatMap(r => r.ex).slice(0, 12),
  pageErrors: errs.slice(0, 5),
};
console.log(JSON.stringify(out, null, 1));
if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(out, null, 1));
