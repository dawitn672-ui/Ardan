// Measurements behind features/67-memory-weave/README.md, on a built page. They take minutes, so they are not in test.mjs.
//
//   node features/67-memory-weave/bench.mjs <built.html> [--lives=32] [--years=60] [--seed=4001] [--json=out.json] [--hist=hist.json]
//
// Bot lives (bench/bot.mjs, the same starts x personalities x engaged/passive mix as bench/run.mjs's league), each
// up to 60 years. For every event that fires:
//   botIndex    the bot's own memoryIndex: the event's cond, setup or text reads a flag another event sets, an arc's
//               mark, or p.flags.ev (static: it counts the event whether or not a memory was there to read)
//   changed     the runtime test: the scene is drawn a second time with the player's memories taken away (the record
//               pc.mw, every flag some event sets, p.flags.ev, arc marks, and 55-bonds' lines on every bond), from the
//               same ctx and the same random state. The event counts if its text, a choice's label, or a choice's
//               odds differ, or if it would not render at all
//   gated       the event's cond is true with the memories and false without them (rolled events only): it came
//               because of a memory
//   tied        changed or gated
// The second drawing restores everything it touched (flags, record, bond lines, 54-voices' heard lines, the random
// state). The setup is not run again for it (a setup can create people); what a setup chose stays the same in both.
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
const LIVES = +(arg('lives') || 32), YEARS = +(arg('years') || 60), SEED = +(arg('seed') || 4001);

const browser = await pw.chromium.launch();
const pg = await browser.newPage();
const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 300)));
await pg.goto(pathToFileURL(html).href);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
await pg.evaluate(BOT);
const t0 = Date.now();
const out = await pg.evaluate(([LIVES, YEARS, SEED]) => {
  const STARTS = [['human', 'POL-01', 'peasant'], ['human', 'POL-01', 'noble'], ['human', 'POL-05', 'merchant'], ['human', 'POL-07', 'serf'],
    ['orc', 'POL-11', 'peasant'], ['dwarf', 'POL-20', 'artisan'], ['human', 'POL-02', 'royal'], ['elf', 'POL-03', 'peasant']];
  const PERS = ['careful', 'reckless', 'greedy', 'random'];
  const M = B.memoryIndex();
  const KEEP = new Set(['unfree', 'patron', 'chain']);
  const memFlag = k => k === 'ev' || /^la_/.test(k) || (M.setters[k] && !KEEP.has(k));
  const words = s => (String(s || '').match(/\S+/g) || []).length;
  const sig = v => !v ? 'none' : v.skip ? 'skip' : JSON.stringify([v.text, (v.choices || []).map(c => [c.t, c.odds])]);
  const S = { events: 0, bot: 0, changed: 0, mine: 0, other: 0, gated: 0, tied: 0, over80: 0, raw: 0, byRule: {}, offRule: {}, hist: {}, samples: [] };
  const ev0 = A.eventView;
  let busy = false;
  // the scene without the player's memories: same ctx, same random state, nothing kept
  const amnesia = (q, pc, e, voPre) => {
    const keep = { flags: pc.flags, mw: pc.mw, vo: pc.vo, hist: {}, rng: A.rngState, cur: A.MW ? A.MW.curQ : null };
    const F = {}; for (const k in pc.flags) if (!memFlag(k)) F[k] = pc.flags[k]; F.ev = {};
    pc.flags = F; pc.mw = undefined; pc.vo = voPre ? JSON.parse(voPre) : keep.vo;
    for (const id in pc.rel) { keep.hist[id] = pc.rel[id].hist; if (pc.rel[id].hist) pc.rel[id].hist = []; }
    const own = e.setup;
    let v2 = null, condNo = null;
    try {
      const ctx = JSON.parse(JSON.stringify(q.ctx || {})); delete ctx.mw;
      const q2 = { type: 'event', ev: q.ev, ctx };
      e.setup = undefined;
      v2 = ev0.call(A, q2);
      try { condNo = e.cond ? !!e.cond(pc, A.C) : true; } catch (err) { condNo = false; }
    } catch (err) { v2 = { skip: true }; }
    finally {
      e.setup = own; pc.flags = keep.flags; pc.mw = keep.mw; pc.vo = keep.vo; A.rngState = keep.rng;
      for (const id in keep.hist) if (pc.rel[id]) pc.rel[id].hist = keep.hist[id];
      if (A.MW) A.MW.curQ = keep.cur;
    }
    return { v2, condNo };
  };
  A.eventView = function (q) {
    const fresh = !busy && q && !q.view && q.type === 'event', pc = A.pc();
    const voPre = fresh && pc && pc.vo ? JSON.stringify(pc.vo) : null;
    const v = ev0.apply(this, arguments);
    if (!fresh || !pc || !v || v.skip) return v;
    busy = true;
    try {
      const e = A.EV[q.ev];
      let condYes = null; try { condYes = e.cond ? !!e.cond(pc, A.C) : true; } catch (err) {}
      const { v2, condNo } = amnesia(q, pc, e, voPre);
      const changed = sig(v) !== sig(v2), w = q.ctx && q.ctx.mw, mine = !!(w && !w.off);
      const gated = !e.trigger && !(q.forced) && condYes === true && condNo === false;
      S.events++;
      if (M.memory.has(q.ev)) S.bot++;
      if (changed) { S.changed++; if (mine) S.mine++; else S.other++; }
      if (gated) S.gated++;
      if (changed || gated) S.tied++;
      if (w) { if (w.off) S.offRule[w.r] = (S.offRule[w.r] || 0) + 1; else S.byRule[w.r] = (S.byRule[w.r] || 0) + 1; }
      if (words(v.text) > 80) S.over80++;
      if (/\{[A-Za-z0-9_]+\}/.test(v.text + (v.choices || []).map(c => c.t).join(' '))) S.raw++;
      S.hist[q.ev] = (S.hist[q.ev] || 0) + 1;
      if (mine && S.samples.length < 400) S.samples.push({ ev: q.ev, r: w.r, y: A.S.year, text: v.text, before: v2 && v2.text, odds: (v.choices || []).map(c => c.odds), odds0: (v2 && v2.choices || []).map(c => c.odds) });
    } catch (err) { console.error('memory-weave bench', err); }
    finally { busy = false; }
    return v;
  };
  const lives = [];
  try {
    for (let i = 0; i < LIVES; i++) {
      const engaged = i % 2 === 0, [race, realm, status] = STARTS[Math.floor(i / 2) % STARTS.length], p = PERS[Math.floor(i / (2 * STARTS.length)) % PERS.length];
      const L = B.life({ seed: SEED + i * 7919, race, realm, status, sex: i % 2 ? 'F' : 'M' }, p, engaged, YEARS);
      lives.push({ years: L.years, events: L.events, mem: L.memEvents, arc: L.arc });
    }
  } finally { A.eventView = ev0; }
  const pct = (a, b) => b ? Math.round(1000 * a / b) / 10 : null;
  const botEvents = lives.reduce((a, l) => a + l.events, 0), botMem = lives.reduce((a, l) => a + l.mem, 0);
  return {
    lives: lives.length, years: lives.reduce((a, l) => a + l.years, 0), events: S.events,
    botMemoryShare: pct(botMem, botEvents),
    changedShare: pct(S.changed, S.events), changedByThisFeature: pct(S.mine, S.events), changedByOthers: pct(S.other, S.events),
    gatedShare: pct(S.gated, S.events), tiedShare: pct(S.tied, S.events),
    perLife: lives.map(l => pct(l.mem, l.events)),
    byRule: S.byRule, dropped: S.offRule, over80: S.over80, rawTokens: S.raw,
    hist: S.hist, samples: S.samples, stats: A.MW ? A.MW.stats : null,
  };
}, [LIVES, YEARS, SEED]);
out.seconds = Math.round((Date.now() - t0) / 1000);
out.errors = errs.slice(0, 10);
const json = arg('json');
const hist = out.hist, samples = out.samples;
if (arg('hist')) fs.writeFileSync(arg('hist'), JSON.stringify({ hist, samples }, null, 1));
delete out.hist; if (!arg('samples')) delete out.samples;
if (json) fs.writeFileSync(json, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
await browser.close();
