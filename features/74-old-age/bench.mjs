// Measurements behind features/74-old-age/README.md, on a built page. They take minutes, so they are not in test.mjs.
//
//   node features/74-old-age/bench.mjs <built.html> [--lives=16] [--seed=7401] [--from=55] [--json=out.json]
//
// Bot lives (bench/bot.mjs: personalities x engaged/passive, as bench/run.mjs's league), human and orc starts only (an
// elf or a dwarf is not old inside a bot life), from age 26 until death or 90. For every event the player meets from
// age --from on it records whether the event is an old-age event by the scorecard's own classifier (bench/run.mjs:
// its cond requires C.old, the old stage or an age of 55 or more), whether it is one of this feature's (oa_), whether
// it was rolled or queued, and its shape (25-variety-guard). Reported per decade of life lived past --from.
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
const LIVES = +(arg('lives') || 16), SEED = +(arg('seed') || 7401), FROM = +(arg('from') || 55);

const browser = await pw.chromium.launch();
const pg = await browser.newPage();
const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 300)));
await pg.goto(pathToFileURL(html).href);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
await pg.evaluate(BOT);
const t0 = Date.now();
const lives = [];
for (let i = 0; i < LIVES; i++) {
  const L = await pg.evaluate(([i, SEED, FROM]) => {
    const STARTS = [['human', 'POL-01', 'peasant'], ['human', 'POL-01', 'noble'], ['human', 'POL-05', 'merchant'], ['human', 'POL-07', 'serf'],
      ['orc', 'POL-11', 'peasant'], ['human', 'POL-02', 'royal'], ['human', 'POL-14', 'artisan'], ['human', 'POL-25', 'peasant']];
    const PERS = ['careful', 'reckless', 'greedy', 'random'];
    const RX = /(^|[^!])C\.old\(|(^|[^!])stage\(p\)\s*===?\s*["']old|C\.age\(p\)\s*>=?\s*(5[5-9]|[6-9]\d)/;
    const isOld = e => !!(e && e.cond && RX.test(e.cond.toString()));
    const [race, realm, status] = STARTS[i % STARTS.length], pers = PERS[Math.floor(i / 2) % PERS.length], engaged = i % 2 === 0;
    const rec = { years: 0, ev: 0, old: 0, oa: 0, rolled: 0, rolledOld: 0, ids: {}, shapes: {}, retiredSeen: 0, raw: 0, over80: 0, odds: [], memOa: 0 };
    let born = null;
    const ch0 = A.eventChoose;
    A.eventChoose = function () {
      try {
        const q = A.S.queue[0], pc = A.pc();
        if (q && q.type === 'event' && pc && A.age(pc) >= FROM) {
          const e = A.EV[q.ev]; rec.ev++;
          if (!q.forced && !(q.ctx && Object.keys(q.ctx).length > 0 && q.ctx.npcMove) && !e.trigger) rec.rolled++;
          if (isOld(e)) { rec.old++; rec.ids[q.ev] = (rec.ids[q.ev] || 0) + 1; if (!e.trigger) rec.rolledOld++; }
          if (/^oa_/.test(q.ev)) { rec.oa++; const v = q.view; if (v) for (const c of v.choices || []) if (c.odds != null) rec.odds.push(c.odds); }
          const s = A.evShape ? A.evShape(e) || '-' : '-'; if (isOld(e)) rec.shapes[s] = (rec.shapes[s] || 0) + 1;
          const v = q.view; if (v && /\{[A-Za-z0-9_.]+\}/.test(v.text || '')) rec.raw++;
          if (v && (String(v.text || '').match(/\S+/g) || []).length > 80) rec.over80++;
        }
      } catch (err) {}
      return ch0.apply(this, arguments);
    };
    let L;
    try { L = B.life({ seed: SEED + i * 7919, sex: i % 3 ? 'M' : 'F', race, realm, status, startAge: 26 }, pers, engaged, 64); }
    finally { A.eventChoose = ch0; }
    const pc = A.P(A.S.pc), age = pc ? A.age(pc) : 0;
    rec.years = Math.max(0, (L.deathAge != null ? L.deathAge : age) - FROM);
    return { start: `${race} ${status} ${pers} ${engaged ? 'engaged' : 'passive'}`, deathAge: L.deathAge, cause: L.cause, age, rec };
  }, [i, SEED, FROM]);
  lives.push(L);
  process.stdout.write(L.rec.years > 0 ? '+' : '.');
}
process.stdout.write('\n');
const old = lives.filter(l => l.rec.years > 0);
const sum = k => old.reduce((a, l) => a + l.rec[k], 0), yrs = old.reduce((a, l) => a + l.rec.years, 0);
const per = k => yrs ? Math.round(100 * sum(k) / yrs) / 10 : 0;
const ids = {}, shapes = {};
for (const l of old) { for (const [k, n] of Object.entries(l.rec.ids)) ids[k] = (ids[k] || 0) + n; for (const [k, n] of Object.entries(l.rec.shapes)) shapes[k] = (shapes[k] || 0) + n; }
const odds = old.flatMap(l => l.rec.odds).sort((a, b) => a - b);
const perLife = old.map(l => ({ start: l.start, years: l.rec.years, oldPerDecade: Math.round(100 * l.rec.old / Math.max(1, l.rec.years)) / 10, eventsPerDecade: Math.round(100 * l.rec.ev / Math.max(1, l.rec.years)) / 10 }));
const out = {
  file: path.relative(root, html), lives: lives.length, livesPastFrom: old.length, yearsPastFrom: yrs, from: FROM,
  eventsPerDecade: per('ev'), oldAgePerDecade: per('old'), oaPerDecade: per('oa'), oldShareOfEvents: sum('ev') ? Math.round(1000 * sum('old') / sum('ev')) / 10 : 0,
  distinctOldEvents: Object.keys(ids).length, mostRepeated: Object.entries(ids).sort((a, b) => b[1] - a[1]).slice(0, 8),
  livesWithNoOldEvent: old.filter(l => l.rec.old === 0 && l.rec.years >= 3).length,
  oaCheckOdds: odds.length ? { n: odds.length, median: odds[Math.floor(odds.length / 2)], p25: odds[Math.floor(odds.length / 4)], atFloor: Math.round(100 * odds.filter(x => x <= 4).length / odds.length) } : null,
  shapes, raw: sum('raw'), over80: sum('over80'), perLife, deathAges: lives.map(l => l.deathAge), deaths: lives.map(l => `${l.deathAge == null ? 'alive ' + l.age : l.deathAge}: ${l.cause || ''}`), secs: Math.round((Date.now() - t0) / 1000), pageErrors: errs.slice(0, 3),
};
console.log(JSON.stringify(out, null, 1));
if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(out, null, 1));
await browser.close();
