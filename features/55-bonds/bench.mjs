// Measurements behind features/55-bonds/README.md, on a built page (they take minutes, so they are not in test.mjs):
//
//   node features/55-bonds/bench.mjs <built.html> [--what=lives,worlds] [--lives=8] [--seeds=81,82,83] [--years=60] [--json=out.json]
//
// lives   bot lives (bench/bot.mjs): the share of all opinion change on the player's bonds (both sides) made by the
//         yearly pull of memories, and by choices in scenes that cite a past line; events that cite a bond's history
// worlds  the same worlds twice, with the feud ledger read by the AI and recorded but ignored (A.BONDS.FEUD.ON):
//         AI wars per thousand neighbour-years and treaties per thousand pair-years, for pairs where one realm holds a
//         grudge of 10 or more against the other, and for the rest; grudge wars declared by a successor
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BOT } from '../../bench/bot.mjs';

const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const html = path.resolve(root, process.argv.slice(2).find(a => !a.startsWith('--')) || 'index.html');
const what = (arg('what') || 'lives,worlds').split(',');
const LIVES = +(arg('lives') || 8), SEEDS = (arg('seeds') || '81,82,83').split(',').map(Number), YEARS = +(arg('years') || 60);

const browser = await pw.chromium.launch();
const pg = await browser.newPage();
const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 300)));
await pg.goto(pathToFileURL(html).href);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
await pg.evaluate(BOT);
const out = { html: path.relative(root, html) };

if (what.includes('lives')) out.lives = await pg.evaluate(n => {
  const BD = A.BONDS; BD.resetStats();
  let total = 0, inCite = 0;
  const snap = () => { const pc = A.pc(), m = new Map(); if (!pc) return m; for (const id of Object.keys(pc.rel)) { const t = A.P(id); m.set(id + '>', pc.rel[id].op || 0); if (t && t.rel && t.rel[pc.id]) m.set(id + '<', t.rel[pc.id].op || 0); } return m; };
  const diff = (a, b) => { let d = 0; for (const [k, v] of b) d += Math.abs(v - (a.has(k) ? a.get(k) : 0)); return d; };
  const keep = {}, names = ['advance', 'eventChoose', 'doActivity', 'duelClose', 'choiceChoose', 'battleAuto', 'missionAuto', 'duelAuto', 'skipPrompt'].filter(k => typeof A[k] === 'function');
  for (const name of names) { const f = keep[name] = A[name]; A[name] = function () {
    const q = name === 'eventChoose' ? A.S.queue[0] : null, cite = !!(q && q.ctx && (q.ctx.bdCite || (q.ctx.past && String(q.ctx.past).trim())));
    const pc0 = A.S.pc, a = snap(); const res = f.apply(this, arguments);
    if (A.S.pc === pc0) { const d = diff(a, snap()); total += d; if (cite) inCite += d; } return res; }; }
  const starts = [['human', 'POL-01', 'artisan'], ['human', 'POL-03', 'merchant'], ['human', 'POL-05', 'peasant'], ['dwarf', 'POL-20', 'artisan'], ['human', 'POL-02', 'noble'], ['orc', 'POL-11', 'peasant'], ['human', 'POL-07', 'serf'], ['elf', 'POL-06', 'gentry']];
  const lives = [];
  try {
    for (let i = 0; i < n; i++) {
      const [race, realm, status] = starts[i % starts.length];
      const L = B.life({ seed: 500 + i, race, realm, status, sex: i % 2 ? 'F' : 'M', startAge: 16 }, ['careful', 'greedy'][i % 2], i % 2 === 0, 45);
      lives.push({ years: L.years, events: L.events, npc: L.npcMoves });
    }
  } finally { for (const k of names) A[k] = keep[k]; }
  const years = lives.reduce((a, l) => a + l.years, 0), S = BD.stats;
  return { lives: lives.length, years, total: Math.round(total), pull: Math.round(S.pull), inCite: Math.round(inCite), led: Math.round(S.led),
    pullPct: +(100 * S.pull / total).toFixed(1), historyPct: +(100 * (S.pull + inCite) / total).toFixed(1), ledPct: +(100 * S.led / total).toFixed(1),
    textCites: S.textCites, citesByThisFeature: S.cite_bd, citesByPast: S.cite_past, citesByToken: S.cite_token, asides: S.asides, pidEvents: S.pidEvents, events: S.events, textCitesPerLife: +(S.textCites / lives.length).toFixed(1), textCitesPerDecade: +(10 * S.textCites / years).toFixed(1) };
}, LIVES);

if (what.includes('worlds')) out.worlds = await pg.evaluate(([SEEDS, YEARS]) => {
  const FE = A.BONDS.FEUD, TREATY = new Set(['ally', 'def', 'nap', 'trade', 'guar', 'sub']);
  const run = (seed, on) => {
    FE.ON = on;
    A.newGame({ seed, race: 'elf', realm: 'POL-06', status: 'gentry', sex: 'F', startAge: 120 });
    const S = { py: { g: 0, n: 0 }, all: { g: 0, n: 0 }, wars: { g: 0, n: 0 }, tr: { g: 0, n: 0 }, carried: 0, deaths: 0 };
    const cls = (a, b) => FE.sum(a, b) <= -10 ? 'g' : 'n', me = () => (A.pc() || {}).realm;
    const onWar = (w, opts) => { if (opts && opts.silent) return; const a = w.leadA, b = w.leadD, ra = A.realm(a); if (!ra || a === me()) return; const c = cls(a, b); S.wars[c]++; if (c === 'g') { const e = FE.top(a, b, -1); if (e && e.byId != null && e.byId !== ra.ruler) S.carried++; } };
    const onDie = () => S.deaths++;
    A.on('warStart', onWar); A.on('rulerDied', onDie);
    const lg = A.aiLogAdd;
    if (lg) A.aiLogAdd = function (k, rid, oid) { if (oid && rid !== me() && TREATY.has(k)) S.tr[cls(rid, oid)]++; return lg.apply(this, arguments); };
    try {
      const end = A.S.year + YEARS; let lastY = A.S.year;
      for (let g = 0; g < 20000 && A.S.year < end; g++) {
        const r = A.advance(400); let h, n = 0;
        while ((h = A.headReady()) && n++ < 300) { if (h.type === 'event') A.eventAuto(); else if (h.type === 'choice') A.choiceChoose(0); else if (h.type === 'duel') { A.duelAuto(h.d); A.duelClose(); } else if (h.type === 'battle') { A.battleAuto(h.b); if (A.S.queue[0] === h) A.S.queue.shift(); } else A.skipPrompt(); }
        if (A.S.year !== lastY) { lastY = A.S.year; const live = Object.keys(A.S.realms).filter(id => A.S.realms[id].alive && !A.S.realms[id].isRebel);
          for (const id of live) { const nb = new Set(A.neighbors(id)); for (const o of live) { if (o === id) continue; const c = cls(id, o); S.all[c]++; if (nb.has(o)) S.py[c]++; } } }
        if (r.why === 'dead' || !A.pc() || !A.pc().alive) break;
      }
    } finally { A.HOOKS.warStart = A.HOOKS.warStart.filter(f => f !== onWar); A.HOOKS.rulerDied = A.HOOKS.rulerDied.filter(f => f !== onDie); if (lg) A.aiLogAdd = lg; FE.ON = true; }
    let active = 0, carriedLines = 0; const kinds = {};
    for (const id of Object.keys(A.S.realms)) { const x = A.S.realms[id]; for (const b of Object.keys(x.feud || {})) for (const e of x.feud[b]) { if (Math.abs(e.w) < 2) continue; active++; kinds[e.k] = (kinds[e.k] || 0) + 1; if ((e.heirs || []).length) carriedLines++; } }
    return Object.assign(S, { active, carriedLines, kinds });
  };
  const res = { on: [], off: [] };
  for (const seed of SEEDS) { res.on.push(run(seed, true)); res.off.push(run(seed, false)); }
  const pool = L => {
    const s = { py: { g: 0, n: 0 }, all: { g: 0, n: 0 }, wars: { g: 0, n: 0 }, tr: { g: 0, n: 0 }, carried: 0, deaths: 0, active: 0, carriedLines: 0, kinds: {} };
    for (const x of L) { for (const t of ['py', 'all', 'wars', 'tr']) for (const k of ['g', 'n']) s[t][k] += x[t][k]; for (const k of ['carried', 'deaths', 'active', 'carriedLines']) s[k] += x[k]; for (const k in x.kinds) s.kinds[k] = (s.kinds[k] || 0) + x.kinds[k]; }
    const r = (a, b) => +(1000 * a / Math.max(1, b)).toFixed(2);
    s.warRate = { g: r(s.wars.g, s.py.g), n: r(s.wars.n, s.py.n) }; s.treatyRate = { g: r(s.tr.g, s.all.g), n: r(s.tr.n, s.all.n) };
    return s;
  };
  return { seeds: SEEDS, years: YEARS, on: pool(res.on), off: pool(res.off) };
}, [SEEDS, YEARS]);

await browser.close();
out.pageErrors = errs.slice(0, 5);
console.log(JSON.stringify(out, null, 1));
if (arg('json')) fs.writeFileSync(path.resolve(root, arg('json')), JSON.stringify(out, null, 1));
