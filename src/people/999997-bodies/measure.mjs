// The measurements behind src/people/999997-bodies (C9, D-040), on a built page. Minutes, so not in test.mjs.
//
//   node src/people/999997-bodies/measure.mjs <built.html> [--seeds=11,22,33,44,55,66,77,88] [--lives=0]
//
// 1. The word scale: every grown person (old age included) at the start of each seed's world, r = A.stat / (the people's
//    mean potential x 0.78), pooled over peoples, at VS.CENTILE_AT. Run it on a build without the skill floor
//    (A.statFloor = null below) to get the population as born and grown: that is VS.STAT_CENTILES.
// 2. Masters: grown people in their prime with a skill at 70 or more, and how many sit below their skill's baseline.
// 3. --lives=N: N careful, passive bot lives (merchant, artisan, noble, peasant in turn, from 20, up to 80 years) with
//    the player's death age and cause, and every NPC death the world records (A.kill), by estate.
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BOT } from '../../../tools/bench/bot.mjs';

const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const html = path.resolve(root, process.argv.slice(2).find(a => !a.startsWith('--')) || 'index.html');
const SEEDS = (arg('seeds') || '11,22,33,44,55,66,77,88').split(',').map(Number), LIVES = +(arg('lives') || 0);

const browser = await pw.chromium.launch();
const pg = await browser.newPage();
await pg.goto(pathToFileURL(html).href);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
const scale = await pg.evaluate(SEEDS => {
  const floor = A.statFloor; A.statFloor = null;
  const rs = {}, rf = {}; for (const s of GD.STATS) { rs[s] = []; rf[s] = []; }
  const m = { n: 0, below: 0 };
  const typ = (p, s) => (42 + ((GD.RACES[p.race] || GD.RACES.human).mods[s] || 0)) * 0.78;
  for (const seed of SEEDS) {
    A.statFloor = null;
    A.newGame({ seed, sex: 'M', race: 'human', realm: 'POL-01', status: 'merchant', startAge: 20 });
    const ppl = Object.values(A.S.people).filter(p => p.alive && p.st && A.age(p) >= (GD.RACES[p.race] || GD.RACES.human).grown);
    for (const p of ppl) for (const s of GD.STATS) rs[s].push(A.stat(p, s) / typ(p, s));
    A.statFloor = floor;
    for (const p of ppl) {
      for (const s of GD.STATS) rf[s].push(A.stat(p, s) / typ(p, s));
      const R = GD.RACES[p.race] || GD.RACES.human;
      if (A.age(p) >= R.old || !A.BODIES) continue;
      for (const k in p.skills) if (p.skills[k] >= 70 && GD.SKILL_STAT[k]) { m.n++; if (A.skill(p, k) < Math.min(100, Math.round(p.skills[k]))) m.below++; }
    }
  }
  A.statFloor = floor;
  const q = (a, c) => { a = [...a].sort((x, y) => x - y); return Math.round(a[Math.min(a.length - 1, Math.floor(c / 100 * a.length))] * 1000) / 1000; };
  const P = (A.V2S && A.V2S.CENTILE_AT) || [0.1, 0.5, 1, 2, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 98, 99, 99.5, 99.9];
  const T = {}, F = {};
  for (const s of GD.STATS) { T[s] = P.map(c => q(rs[s], c)).concat(Math.round(Math.max(...rs[s]) * 1000) / 1000); F[s] = [10, 50, 90].map(c => q(rf[s], c)); }
  return { n: rs.str.length, T, withFloor: F, masters: m };
}, SEEDS);
console.log(`grown people: ${scale.n}`);
console.log('VS.STAT_CENTILES (no floor):');
for (const s in scale.T) console.log(`    ${s}: [${scale.T[s].join(', ')}],`);
console.log('with the floor, 10th/50th/90th:', JSON.stringify(scale.withFloor));
console.log(`masters (skill 70+, not old): ${scale.masters.n}, held back by their stats: ${scale.masters.below}`);

if (LIVES) {
  await pg.evaluate(BOT);
  const pcs = [], npc = [];
  for (let i = 0; i < LIVES; i++) {
    const r = await pg.evaluate(i => {
      const STARTS = [['human', 'POL-05', 'merchant'], ['human', 'POL-14', 'artisan'], ['human', 'POL-01', 'noble'], ['human', 'POL-01', 'peasant']];
      const [race, realm, status] = STARTS[i % 4], dead = [], k0 = A.kill;
      A.kill = function (p, cause) { try { if (p && p.alive && p.id !== A.S.pc && A.age(p) >= 16) dead.push([A.age(p), p.status]); } catch (e) {} return k0.apply(this, arguments); };
      let L; try { L = B.life({ seed: 900 + i * 7919, sex: i % 3 ? 'M' : 'F', race, realm, status, startAge: 20 }, 'careful', false, 80); } finally { A.kill = k0; }
      return { status, age: L.deathAge, cause: L.cause, dead };
    }, i);
    pcs.push(r); npc.push(...r.dead);
    console.log(`life ${i}: ${r.status} died at ${r.age} of ${r.cause}`);
  }
  const med = a => { a = [...a].sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
  const by = {}; for (const [a, s] of npc) (by[s] = by[s] || []).push(a);
  console.log('NPC grown deaths, median age by estate:', JSON.stringify(Object.fromEntries(Object.entries(by).map(([k, v]) => [k, [v.length, med(v)]]))));
  console.log('player deaths, median:', med(pcs.map(x => x.age || 99)), 'under 50:', pcs.filter(x => x.age && x.age < 50).length, 'of', pcs.length);
}
await browser.close();
