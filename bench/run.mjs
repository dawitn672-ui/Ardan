// Measure a built game. Writes reports/<label>.json and prints a summary.
//
//   node bench/run.mjs                                   index.html, label "current", every module
//   node bench/run.mjs vendor/ardan-b593143.html --label=release
//   node bench/run.mjs --only=league,duels --lives=64
//
// Modules (each returns plain numbers, so builds can be compared in reports/scorecard.md by bench/compare.mjs):
//   league   bot lives across starts x personalities x engaged/passive: deaths, wealth, rank, arcs, pacing, memory share
//   events   static event graph: counts, memory links, orphan flags, recipe share, text diet, life-stage coverage
//   duels    duel outcomes by tier gap and seat vs the odds the screen shows
//   ai       60 years of world: do AI realms act in line with their rulers' traits?
//   economy  price spread across markets, buy/sell-back loops, debt, hoarding
//   perf     ms per day at peace and per war year
//   saves    save/load cycles with exact-state checks
//   a11y     axe-core WCAG 2.1 AA scan of title, creation and every tab, both themes
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BOT } from './bot.mjs';
import { analyzeChoices } from '../tools/choice-analyzer.mjs';

const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = k => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const file = path.resolve(root, args.find(a => !a.startsWith('--')) || 'index.html');
const label = opt('label') || 'current';
const only = opt('only') ? opt('only').split(',') : null;
const LIVES = +(opt('lives') || 64);

const STARTS = [
  { race: 'human', realm: 'POL-01', status: 'peasant' }, { race: 'human', realm: 'POL-01', status: 'noble' },
  { race: 'human', realm: 'POL-05', status: 'merchant' }, { race: 'human', realm: 'POL-07', status: 'serf' },
  { race: 'orc', realm: 'POL-11', status: 'peasant' }, { race: 'dwarf', realm: 'POL-20', status: 'artisan' },
  { race: 'human', realm: 'POL-02', status: 'royal' }, { race: 'elf', realm: 'POL-03', status: 'peasant' },
];
const PERS = ['careful', 'reckless', 'greedy', 'random'];
const median = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const pct = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
const r1 = x => x == null ? null : Math.round(x * 10) / 10;

const MODULES = {
  async league(page) {
    const lives = [];
    for (let i = 0; i < LIVES; i++) {
      // engaged/passive alternate fastest, then starts, then personalities: 64 lives cover every combination
      const engaged = i % 2 === 0, s = STARTS[Math.floor(i / 2) % STARTS.length], p = PERS[Math.floor(i / (2 * STARTS.length)) % PERS.length];
      const L = await page.evaluate(([o, p, e]) => { const L = B.life(o, p, e, 90); delete L.samples; return L; },
        [Object.assign({ seed: 9001 + i * 7919, sex: i % 2 ? 'F' : 'M' }, s), p, engaged]);
      // samples are big; ask for a compact trajectory separately
      lives.push(L);
      process.stdout.write('.');
    }
    process.stdout.write('\n');
    const human = lives.filter(l => ['human', 'orc'].includes(l.o.race));
    const deaths = human.filter(l => l.deathAge != null).map(l => l.deathAge);
    const arcs = {}; for (const l of lives) arcs[l.arc] = (arcs[l.arc] || 0) + 1;
    const gaps = lives.flatMap(l => l.gaps);
    const evPerYear = lives.map(l => l.events / Math.max(1, l.years));
    const decisions = lives.map(l => Object.entries(l.items).reduce((a, [k, n]) => a + n, 0) / Math.max(1, l.years));
    // death ages by personality count humans and orcs only: an elf or a dwarf who lives three centuries swamps a 16-life median
    const byPers = {}; for (const p of PERS) { const g = lives.filter(l => l.personality === p);
      const da = g.filter(l => l.deathAge != null && ['human', 'orc'].includes(l.o.race)).map(l => l.deathAge);
      byPers[p] = { lives: g.length, medianDeathAge: median(da), meanDeathAge: da.length ? r1(da.reduce((a, x) => a + x, 0) / da.length) : null, checkWinRate: r1(100 * g.reduce((a, l) => a + l.wins, 0) / Math.max(1, g.reduce((a, l) => a + l.checks, 0))) }; }
    return {
      lives: lives.length,
      medianDeathAge_humanOrc: median(deaths), p10DeathAge: pct(deaths, .1), p90DeathAge: pct(deaths, .9),
      arcTypes: Object.keys(arcs).length, topArcShare: r1(100 * Math.max(...Object.values(arcs)) / lives.length), arcs,
      memoryShareOfFiredEvents: r1(100 * lives.reduce((a, l) => a + l.memEvents, 0) / Math.max(1, lives.reduce((a, l) => a + l.events, 0))),
      eventsPerYear: r1(median(evPerYear)), promptsPerYear: r1(median(decisions)),
      medianDaysBetweenPrompts: median(gaps), p90DaysBetweenPrompts: pct(gaps, .9),
      p90SecondsBetweenPromptsAtDefaultSpeed: r1(pct(gaps, .9) / 4),
      checkWinRate: r1(100 * lives.reduce((a, l) => a + l.wins, 0) / Math.max(1, lives.reduce((a, l) => a + l.checks, 0))),
      initiativeActionsPerYear_engaged: r1(median(lives.filter(l => l.engaged).map(l => l.actions / Math.max(1, l.years)))),
      byPersonality: byPers,
      // a mean, not a median: deaths are bimodal (young, or old), and a 12-life median jumps between the two humps
      carefulMinusRecklessDeathAge: byPers.careful.meanDeathAge != null && byPers.reckless.meanDeathAge != null ? r1(byPers.careful.meanDeathAge - byPers.reckless.meanDeathAge) : null,
      npcMovesPerDecade: r1(10 * lives.reduce((a, l) => a + l.npcMoves, 0) / Math.max(1, lives.reduce((a, l) => a + l.years, 0))),
      battlesFought: lives.reduce((a, l) => a + l.battles, 0),
      afterActionShare: lives.reduce((a, l) => a + l.battles, 0) ? r1(100 * lives.reduce((a, l) => a + l.battlesWithReport, 0) / lives.reduce((a, l) => a + l.battles, 0)) : null,
    };
  },

  async events(page) {
    // events with an obviously best choice (tools/lint-choices.mjs), over every event
    const ch = await page.evaluate(analyzeChoices, null);
    const base = await page.evaluate(() => {
      // events 58-event-cut retired never roll, so they are not counted
      const M = B.memoryIndex(), E = Object.values(A.EV).filter(e => !(A.EV_RETIRED && A.EV_RETIRED.has(e.id))), words = s => (String(s || '').match(/\S+/g) || []).length;
      const stat = e => typeof e.text === 'string' ? words(e.text) : null;
      const recipe = E.filter(e => { const ch = e.choices || []; if (ch.length < 2 || ch.length > 3 || !ch.some(c => c.check)) return false;
        const s = JSON.stringify(ch.map(c => [c.fx, c.win && c.win.fx, c.lose && c.lose.fx].map(x => typeof x === 'function' ? 'FN' : x)));
        return !/FN|flag|trait|wound|newRel|rel|deed|event|duel|beast|prison|die|epithet|job|promote/.test(s); });
      const cs = e => e.cond ? e.cond.toString() : '';
      // count only events that REQUIRE the stage (a leading ! excludes it instead)
      const old = E.filter(e => /(^|[^!])C\.old\(|(^|[^!])stage\(p\)\s*===?\s*["']old|C\.age\(p\)\s*>=?\s*(5[5-9]|[6-9]\d)/.test(cs(e))).length;
      const child = E.filter(e => /(^|[^!])C\.(child|teen|young)\(|(^|[^!])(KID|TEEN)\(|AA\(p,C,\d+,1\d\)/.test(cs(e))).length;
      const choices = E.flatMap(e => e.choices || []);
      return {
        events: E.length, choices: choices.length,
        memoryEvents: M.memory.size, memorySharePct: Math.round(1000 * M.memory.size / E.length) / 10,
        flagsSet: Object.keys(M.setters).length, orphanFlags: M.orphan.length,
        strictRecipePct: Math.round(1000 * recipe.length / E.length) / 10,
        choicesWithoutCheckPct: Math.round(1000 * choices.filter(c => !c.check && !c.group).length / choices.length) / 10,
        oldAgeEvents: old, childTeenEvents: child,
        staticTextOver80: E.filter(e => (stat(e) || 0) > 80).length,
        staticChoiceOver12: choices.filter(c => typeof c.t === 'string' && words(c.t) > 12).length,
      };
    });
    return Object.assign(base, { obviouslyBest: ch.flagged.length, obviouslyBestPct: ch.compared ? Math.round(1000 * ch.flagged.length / ch.compared) / 10 : 0, choiceComparable: ch.compared });
  },

  async duels(page) {
    return page.evaluate(() => {
      // a fresh pair of fighters for every lethal duel (reusing fighters lets wounds pile up), 150 duels per cell;
      // compare with what the screen would show (A.shownDuelOdds if a feature provides it, else the release formula)
      A.newGame({ seed: 77, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      const pc0 = A.S.pc, shownFor = (a, b) => A.shownDuelOdds ? A.shownDuelOdds(a, b) : 100 / (1 + Math.exp(-(A.fightWorth(a) - A.fightWorth(b)) / 12));
      const out = [];
      for (const gap of [0, 1, 2]) for (const seat of ['strong-in-player-seat', 'strong-as-npc']) {
        let w = 0, n = 0, shown = 0;
        for (let i = 0; i < 150; i++) {
          const t = 1 + (i % (6 - gap)), lo = A.makeFoe({ tier: t, realm: 'POL-01' }), hi = A.makeFoe({ tier: t + gap, realm: 'POL-01' });
          const [a, b] = seat === 'strong-in-player-seat' ? [hi, lo] : [lo, hi];
          const pA = shownFor(a, b);
          A.S.pc = a.id; A.S.queue = [];
          A.startDuel(a, b, { kind: 'duel', lethal: true });
          const q = A.S.queue.find(x => x.type === 'duel'); if (!q) continue;
          A.S.queue = [q]; A.duelAuto(q.d); A.S.queue = [];
          const r = q.d.result; if (!r || r === 'fled') continue;
          const aWon = r === 'win' ? 1 : 0;
          w += seat === 'strong-in-player-seat' ? aWon : 1 - aWon; n++;
          shown += seat === 'strong-in-player-seat' ? pA : 100 - pA;
        }
        out.push({ gap, seat, duels: n, strongWinsPct: n ? Math.round(100 * w / n) : null, shownPct: n ? Math.round(shown / n) : null });
      }
      A.S.pc = pc0;
      const sameTier = out.filter(x => x.gap === 0);
      return { table: out, playerSeatEdgeSameTierPct: sameTier.length === 2 ? Math.round((sameTier[0].strongWinsPct + (100 - sameTier[1].strongWinsPct)) / 2 - 50) : null,
        maxShownVsActualErrorPct: Math.max(...out.map(x => Math.abs(x.strongWinsPct - x.shownPct))) };
    });
  },

  async ai(page) {
    // 3 worlds x 60 years. Log every war declaration with the attacking ruler's traits, and count ruler-years per trait.
    const runs = [];
    for (const seed of [606, 1212, 2424]) runs.push(await page.evaluate((seed) => {
      A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16, diff: 'story' });
      const decl = [], known = new Set(A.S.wars.map(w => w.id)), end = A.S.year + 60, rulerYears = {};
      const traitsOf = rid => { const r = A.realm(rid), ru = r && A.P(r.ruler); return ru ? ru.traits.slice() : []; };
      for (let k = 0; k < 40000 && A.S.year < end; k++) {
        A.advance(30);
        let h, g = 0; while ((h = A.headReady()) && g++ < 300) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); }
        if (!A.pc().alive) { const kid = Object.values(A.S.people).find(p => p.alive && p.id !== A.S.pc && A.isAdult(p)); if (!kid) break; A.S.pc = kid.id; }
        for (const w of A.S.wars) if (!known.has(w.id)) { known.add(w.id); decl.push({ traits: traitsOf(w.leadA) }); }
        for (const r of Object.values(A.S.realms)) if (r.alive && !r.isRebel) for (const x of traitsOf(r.id)) rulerYears[x] = (rulerYears[x] || 0) + 1 / 12;
      }
      return { decl, rulerYears };
    }, seed));
    const AGG = ['wrathful', 'ambitious', 'cruel', 'brave', 'greedy', 'proud', 'impetuous'], PEACE = ['content', 'kind', 'craven', 'patient', 'humble', 'calm', 'generous'];
    const decl = runs.flatMap(r => r.decl), ry = {};
    for (const r of runs) for (const [k, v] of Object.entries(r.rulerYears)) ry[k] = (ry[k] || 0) + v;
    const rate = set => { const yrs = set.reduce((a, t) => a + (ry[t] || 0), 0); const n = decl.filter(d => d.traits.some(t => set.includes(t))).length; return yrs ? n / yrs * 100 : null; };
    const aggr = rate(AGG), peace = rate(PEACE);
    return { worlds: 3, years: 60, warsDeclared: decl.length, warsPer100RulerYears_aggressiveTraits: aggr && Math.round(aggr * 100) / 100,
      warsPer100RulerYears_peacefulTraits: peace && Math.round(peace * 100) / 100,
      aggressiveToPeacefulRatio: aggr && peace ? Math.round(100 * aggr / peace) / 100 : null };
  },

  async economy(page) {
    return page.evaluate(() => {
      A.newGame({ seed: 3, race: 'human', realm: 'POL-01', status: 'merchant', sex: 'F', startAge: 30 });
      const pc = A.pc(); pc.skills.trade = 100; pc.coin = 1e7;
      const live = Object.values(A.S.realms).filter(r => r.alive && A.mkt(r.id));
      const goods = Object.keys(GD.GOODS);
      const spreads = goods.map(k => { const ps = live.map(r => A.mkt(r.id).p[k]).filter(Boolean); return ps.length > 1 ? Math.max(...ps) / Math.min(...ps) : 1; });
      let bestLoop = -Infinity;
      for (const r of live.slice(0, 12)) { pc.realm = r.id; pc.home = (A.S.prov.find(p => p.owner === r.id) || {}).id ?? pc.home;
        for (const k of goods) { if (!A.mkt(A.homeMkt(pc)).p[k]) continue; const c0 = pc.coin; for (let i = 0; i < 10; i++) { A.buyGood(k, 1); A.sellGood(k, 1); } bestLoop = Math.max(bestLoop, pc.coin - c0); } }
      return { markets: live.length, goods: goods.length, medianPriceRatioMaxMin: Math.round(100 * [...spreads].sort((a, b) => a - b)[Math.floor(spreads.length / 2)]) / 100,
        bestBuySellBackLoop10x: Math.round(bestLoop) };
    });
  },

  async perf(page) {
    return page.evaluate(() => {
      A.newGame({ seed: 12, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const t0 = performance.now(); let days = 0;
      for (; days < 365 * 3; days++) { const r = A.dayTick(); if (r === 'queue') { let h, g = 0; while ((h = A.headReady()) && g++ < 200) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); } } if (r === 'dead') break; }
      const msPerDay = (performance.now() - t0) / Math.max(1, days);
      const divs = Object.values(A.S.realms).reduce((a, r) => a + (r.forces && r.forces.divs ? r.forces.divs.length : 0), 0);
      // the war tick (Road to Ten, War 7: a 200-division tick under 50 ms): time every A.wsDay through a year of wars
      const ws = A.wsDay, ticks = [];
      A.wsDay = function () { const t = performance.now(); try { return ws.apply(this, arguments); } finally { ticks.push(performance.now() - t); } };
      try {
        // six wars between neighbours, so armies meet
        for (const r of Object.values(A.S.realms)) { if (A.S.wars.length >= 6) break; if (!r.alive || r.isRebel || A.atWar(r.id).length) continue;
          const nb = A.neighbors(r.id).find(x => !A.atWar(x).length); if (nb) A.startWar(r.id, nb, null, 'conquest'); }
        var warsAtStart = A.S.wars.length, peakDivs = 0;
        for (let d = 0; d < 365; d++) { if (d % 30 === 0 && A.allDivs) peakDivs = Math.max(peakDivs, A.allDivs().length); const r = A.dayTick(); if (r === 'queue') { let h, g = 0; while ((h = A.headReady()) && g++ < 200) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); } } if (r === 'dead') break; }
      } finally { A.wsDay = ws; }
      const allDivs = A.allDivs ? A.allDivs().length : null, srt = ticks.slice().sort((a, b) => a - b);
      const q = f => srt.length ? Math.round(srt[Math.min(srt.length - 1, Math.floor(f * srt.length))] * 10) / 10 : null;
      return { msPerDay: Math.round(msPerDay * 100) / 100, msPerYear: Math.round(msPerDay * 365), divisions: divs, boot: window.ARDAN_BOOT,
        warTick: { ticks: ticks.length, divisions: peakDivs || allDivs, warsAtStart, p50: q(0.5), p95: q(0.95), max: q(1) } };
    });
  },

  async saves(page) {
    return page.evaluate(async () => {
      A.newGame({ seed: 55, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 20 });
      let bad = 0, n = 0, kb = 0;
      for (let y = 0; y < 10; y++) {
        A.advance(120); let h, g = 0; while ((h = A.headReady()) && g++ < 200) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); }
        for (let k = 0; k < 10; k++) {
          const enc = await SAVES.encode(A.S, A.J); kb = enc.bytes.length / 1024;
          const a = JSON.stringify(A.packState ? A.packState(A.S) : A.S);
          const d = await SAVES.decode(enc.bytes);
          const b = JSON.stringify(A.packState ? A.packState(d.S) : d.S);
          if (a !== b) bad++; n++;
        }
      }
      return { cycles: n, corrupted: bad, kbGzipped: Math.round(kb) };
    });
  },

  async signature(page) {
    // convention: a signature system registers itself in A.SIGNATURE = { chronicle: true, beliefTruth: true, bothScales: true }
    return page.evaluate(() => { const s = A.SIGNATURE || {}; return { chronicle: !!s.chronicle, beliefTruth: !!s.beliefTruth, bothScales: !!s.bothScales, present: ['chronicle', 'beliefTruth', 'bothScales'].filter(k => s[k]).length }; });
  },

  async a11y(page) {
    const src = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
    const scan = async (where) => {
      // the page's CSP blocks injected scripts and eval; a string evaluated over the devtools protocol is not subject to it
      if (!await page.evaluate(() => !!window.axe)) await page.evaluate(src);
      const r = await page.evaluate(async () => { const res = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } });
        return { v: res.violations.map(v => ({ id: v.id, impact: v.impact, wcag: v.tags.some(t => /^wcag\d/.test(t)), nodes: v.nodes.length })), inc: res.incomplete.map(v => ({ id: v.id, nodes: v.nodes.length })) }; })
        .catch(e => ({ v: [{ id: 'axe-failed: ' + e.message.slice(0, 80), impact: 'unknown', wcag: true, nodes: 0 }], inc: [] }));
      return { where, r: r.v, inc: r.inc };
    };
    const out = [];
    for (const theme of ['dark', 'light']) {
      await page.evaluate(t => { UI.set.theme = t; document.documentElement.dataset.theme = t === 'light' ? 'light' : ''; UI.screen = 'title'; UI.render(); }, theme);
      out.push(await scan(theme + ':title'));
      await page.evaluate(() => { UI.A.newLife(); });
      out.push(await scan(theme + ':create'));
      await page.evaluate(() => { UI.screen = 'title'; UI.render(); UI.crRandomize(); UI._newLifeOk = true; UI.startLife(); UI._newLifeOk = false; });
      for (const t of await page.evaluate(() => UI.GROUPS.flatMap(g => g.subs.map(s => s[0])))) { await page.evaluate(t => { UI.tab = t; UI.render(); }, t); out.push(await scan(theme + ':' + t)); }
    }
    const all = out.flatMap(x => x.r.map(v => ({ ...v, where: x.where })));
    const byRule = {}; for (const v of all) byRule[v.id] = (byRule[v.id] || 0) + v.nodes;
    const inc = {}; for (const x of out) for (const v of x.inc) inc[v.id] = (inc[v.id] || 0) + v.nodes;
    return { screens: out.length, wcagViolations: all.filter(v => v.wcag).length, bestPracticeViolations: all.filter(v => !v.wcag).length,
      seriousOrCritical: all.filter(v => ['serious', 'critical'].includes(v.impact)).length, byRule, needsReview: inc };
  },
};

const browser = await pw.chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
const perrs = []; page.on('pageerror', e => perrs.push(String(e).slice(0, 200)));
await page.goto(pathToFileURL(file).href);
await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
await page.evaluate(BOT);
const report = { label, file: path.relative(root, file), build: await page.evaluate(() => window.ARDAN_BUILD), modules: {} };
for (const [name, fn] of Object.entries(MODULES)) {
  if (only && !only.includes(name)) continue;
  const t0 = Date.now();
  try { report.modules[name] = await fn(page); } catch (e) { report.modules[name] = { error: String(e.message || e).slice(0, 300) }; }
  console.log(`${name} (${((Date.now() - t0) / 1000).toFixed(0)}s):`, JSON.stringify(report.modules[name]).slice(0, 600));
}
report.pageErrors = perrs.slice(0, 10);
report.modules.pageErrorCount = perrs.length;
await browser.close();
fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
const out = path.join(root, 'reports', `${label}.json`);
const prev = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : null;
if (prev && only) report.modules = Object.assign(prev.modules || {}, report.modules);
fs.writeFileSync(out, JSON.stringify(report, null, 1));
console.log('wrote', path.relative(root, out));
