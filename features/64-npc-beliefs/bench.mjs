// Measurements behind features/64-npc-beliefs/README.md, on a built page (minutes, so not in test.mjs):
//
//   node features/64-npc-beliefs/bench.mjs <built.html> [--what=lives,long,cost] [--lives=8] [--years=45] [--json=out.json]
//
// lives  bot lives (bench/bot.mjs). Every five years, a census of what the people of the world hold: the share of
//        beliefs that are false, by what they are about (you, other people, battles, beasts) and by how far the holder
//        lives from you (same town, same realm, a neighbour realm, further); the courts as well. Belief scenes met a
//        decade, and those driven by a false belief. How far false beliefs move opinion of you. Corrections, by how
//        they travelled. The player's own false beliefs, and how many were found out.
// long   one 60-year life (an elf of the gentry, who lives through it): the bytes the beliefs take in the save
// cost   the same 20-year life with the feature's yearly step on and off (wall time), and the same seed twice (replay)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BOT } from '../../bench/bot.mjs';
import { HELPERS } from '../../tests/helpers.mjs';

const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const html = path.resolve(root, process.argv.slice(2).find(a => !a.startsWith('--')) || 'index.html');
const what = (arg('what') || 'lives,long,cost').split(',');
const LIVES = +(arg('lives') || 8), YEARS = +(arg('years') || 45);

const browser = await pw.chromium.launch();
const pg = await browser.newPage();
const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 300)));
await pg.goto(pathToFileURL(html).href);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
await pg.evaluate(HELPERS); await pg.evaluate(BOT);
const out = { html: path.relative(root, html) };

if (what.includes('lives')) out.lives = await pg.evaluate(([n, years]) => {
  const NB = A.NPCB; NB.resetStats();
  const G = () => ({ n: 0, f: 0 });
  const tally = { about: { you: G(), others: G(), battle: G(), beast: G() }, dist: [G(), G(), G(), G()], distYou: [G(), G(), G(), G()], court: { you: G(), rulers: G(), battle: G() } };
  const op = { holders: 0, movedFalse: 0, sumFalse: 0, movedTrue: 0, sumTrue: 0 };
  let censuses = 0, scenes = 0, fScenes = 0, totalYears = 0, pcFalse = 0, pcHeld = 0, wrongFound = 0;
  const byEv = {};
  const census = () => {
    const pc = A.pc(); if (!pc) return;
    censuses++;
    for (const p of Object.values(A.S.people)) {
      if (!p.nb || !p.alive) continue;
      const d = NB.dist(p, pc);
      let fv = 0, tv = 0;
      for (const x of NB.beliefs(p)) {
        const f = NB.isFalse(x.c, x.st) ? 1 : 0;
        const k = x.c.k === 'B' ? 'battle' : x.c.k === 'Z' ? 'beast' : x.c.s === pc.id ? 'you' : 'others';
        tally.about[k].n++; tally.about[k].f += f;
        tally.dist[d].n++; tally.dist[d].f += f;
        if (k === 'you') { tally.distYou[d].n++; tally.distYou[d].f += f; if (x.st > 0) { const e = x.c.v * NB.factor(p, x.c); if (f) fv += e; else tv += e; } }
      }
      if (pc.rel[p.id] && (fv || tv)) { op.holders++; if (Math.abs(fv) >= 5) op.movedFalse++; op.sumFalse += Math.abs(fv); if (Math.abs(tv) >= 5) op.movedTrue++; op.sumTrue += Math.abs(tv); }
    }
    const S = A.S.npcb;
    if (S) for (const rid in S.ct) for (const x of NB.court(rid)) {
      const f = NB.isFalse(x.c, x.st) ? 1 : 0, k = x.c.k === 'B' ? 'battle' : x.c.s === pc.id ? 'you' : 'rulers';
      tally.court[k].n++; tally.court[k].f += f;
    }
  };
  const adv = A.advance, ch = A.eventChoose;
  let lastCensus = null;
  A.advance = function () { const r = adv.apply(this, arguments); try { if (A.S.year % 5 === 0 && lastCensus !== A.S.year) { lastCensus = A.S.year; census(); } } catch (e) {} return r; };
  A.eventChoose = function () { const q = A.S.queue[0]; if (q && q.type === 'event' && !q.result && /^nb_/.test(q.ev)) { scenes++; byEv[q.ev] = (byEv[q.ev] || 0) + 1; if (q.ctx && q.ctx.nbFalse) fScenes++; } return ch.apply(this, arguments); };
  const starts = [['human', 'POL-01', 'artisan'], ['human', 'POL-03', 'merchant'], ['human', 'POL-05', 'peasant'], ['dwarf', 'POL-20', 'artisan'], ['human', 'POL-02', 'noble'], ['orc', 'POL-11', 'peasant'], ['human', 'POL-07', 'serf'], ['elf', 'POL-06', 'gentry']];
  const lives = [];
  try {
    for (let i = 0; i < n; i++) {
      const [race, realm, status] = starts[i % starts.length];
      lastCensus = null;
      const L = B.life({ seed: 6440 + i, race, realm, status, sex: i % 2 ? 'F' : 'M', startAge: race === 'elf' ? 60 : race === 'dwarf' ? 32 : 17 }, ['careful', 'greedy'][i % 2], i % 2 === 0, years);
      totalYears += L.years;
      const pc = A.P(A.S.pc);
      if (pc && pc.nbk) for (const id in pc.nbk) { const c = NB.claim(id), e = pc.nbk[id]; if (!c || !Array.isArray(e)) continue; pcHeld++; if (NB.isFalse(c, e[0])) pcFalse++; }
      if (pc && pc.flags && pc.flags.nb_was_wrong) wrongFound++;
      lives.push({ years: L.years, events: L.events, npc: L.npcMoves });
    }
  } finally { A.advance = adv; A.eventChoose = ch; }
  const pct = g => (g.n ? +(100 * g.f / g.n).toFixed(1) : null);
  const S = NB.stats;
  return {
    lives: lives.length, years: totalYears, censuses,
    falsePct: { aboutYou: pct(tally.about.you), aboutOthers: pct(tally.about.others), battles: pct(tally.about.battle), beasts: pct(tally.about.beast), all: pct({ n: tally.dist.reduce((a, g) => a + g.n, 0), f: tally.dist.reduce((a, g) => a + g.f, 0) }) },
    counts: { aboutYou: tally.about.you.n, aboutOthers: tally.about.others.n, battles: tally.about.battle.n, beasts: tally.about.beast.n },
    byDistance: ['same town', 'same realm', 'neighbour realm', 'further'].map((k, i) => ({ k, n: tally.dist[i].n, falsePct: pct(tally.dist[i]), aboutYouN: tally.distYou[i].n, aboutYouFalsePct: pct(tally.distYou[i]) })),
    courts: { aboutYou: [tally.court.you.n, pct(tally.court.you)], rulers: [tally.court.rulers.n, pct(tally.court.rulers)], battles: [tally.court.battle.n, pct(tally.court.battle)] },
    scenes, falseScenes: fScenes, scenesPerDecade: +(10 * scenes / totalYears).toFixed(2), falseScenesPerDecade: +(10 * fScenes / totalYears).toFixed(2), byEv,
    opinion: { holderCensuses: op.holders, movedByFalsePct: op.holders ? +(100 * op.movedFalse / op.holders).toFixed(1) : null, meanFalseMove: op.holders ? +(op.sumFalse / op.holders).toFixed(1) : null, movedByTruePct: op.holders ? +(100 * op.movedTrue / op.holders).toFixed(1) : null, meanTrueMove: op.holders ? +(op.sumTrue / op.holders).toFixed(1) : null },
    corrections: Object.fromEntries(Object.entries(S).filter(([k]) => /^corr/.test(k))), courtCorr: S.courtCorr,
    seeds: { deeds: S.seedDeed, kills: S.seedKill, blame: S.seedBlame, battles: S.seedBattle, slanders: S.seedSlander, court: S.seedCourt, news: S.news, told: S.told, adopt: S.adopt },
    player: { heard: S.pcHeard, heldAtEnd: pcHeld, falseAtEnd: pcFalse, livesThatFoundOut: wrongFound },
    perLife: lives,
  };
}, [LIVES, YEARS]);

if (what.includes('long')) out.long = await pg.evaluate(() => {
  const NB = A.NPCB;
  A.newGame({ seed: 6460, race: 'elf', realm: 'POL-06', status: 'gentry', sex: 'F', startAge: 120 });
  const y0 = A.S.year, res = T.play(60);
  const S = A.S, st = JSON.stringify(S.npcb || {}).length;
  let holders = 0, pBytes = 0, beliefs = 0, kBytes = 0;
  for (const p of Object.values(S.people)) { if (p.nb) { holders++; pBytes += JSON.stringify(p.nb).length + 8; beliefs += Object.keys(p.nb).length; } if (p.nbk) kBytes += JSON.stringify(p.nbk).length + 9; }
  const save = A.serialize().length;
  return { years: S.year - y0, res, claims: Object.keys((S.npcb || {}).c || {}).length, courts: Object.keys((S.npcb || {}).ct || {}).length, holders, beliefs,
    bytesShared: st, bytesHolders: pBytes, bytesPlayer: kBytes, bytesTotal: st + pBytes + kBytes, perHolder: holders ? Math.round(pBytes / holders) : 0, perHolderAll: holders ? Math.round((st + pBytes) / holders) : 0,
    save, sharePct: +(100 * (st + pBytes + kBytes) / save).toFixed(2), people: Object.keys(S.people).length };
});

if (what.includes('cost')) out.cost = await pg.evaluate(() => {
  const NB = A.NPCB;
  const run = off => { NB.OFF = off; try { A.newGame({ seed: 6470, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 20 }); const t0 = performance.now(); T.play(20); return { ms: Math.round(performance.now() - t0), hash: T.hash({ n: A.S.npcb || null, p: Object.keys(A.S.people).sort().map(id => A.S.people[id].nb || 0) }) }; } finally { NB.OFF = false; } };
  const off = run(true), on = run(false), again = run(false);
  return { offMs: off.ms, onMs: on.ms, againMs: again.ms, replaySame: on.hash === again.hash };
});

await browser.close();
out.pageErrors = errs.slice(0, 5);
console.log(JSON.stringify(out, null, 1));
if (arg('json')) fs.writeFileSync(path.resolve(root, arg('json')), JSON.stringify(out, null, 1));
