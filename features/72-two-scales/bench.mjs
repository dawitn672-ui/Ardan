// Measurements behind features/72-two-scales/README.md, on a built page (they take minutes, so they are not in test.mjs):
//
//   node features/72-two-scales/bench.mjs <built.html> [--what=swing,lives] [--fights=150] [--seed=5000]
//        [--policies=none,best,worst,bold,steady,care,flee] [--lives=6] [--years=70] [--paths=soldier,serf,...] [--json=out.json]
//
// swing  real fights frozen the moment an enlisted soldier's division goes in (bench/rankfx-lab.mjs), each played out
//        once per policy from the same state and random stream: fights won, paired fight by fight; the men beside you
//        who die, per policy and per choice; whether you live
// lives  bot lives (bench/bot.mjs) on every path of bench/targets.mjs, and a soldier path (a peasant who enlists at 18):
//        how many lives meet at least one two-scales fight (in the army or in the levy), and how many per ten years
//        of service
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BOT } from '../../bench/bot.mjs';
import { RANKFX_LAB } from '../../bench/rankfx-lab.mjs';
import { TARGETS } from '../../bench/targets.mjs';
import { TS_LAB } from './lab.mjs';

const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const html = path.resolve(root, process.argv.slice(2).find(a => !a.startsWith('--')) || 'index.html');
const what = (arg('what') || 'swing,lives').split(',');
const FIGHTS = +(arg('fights') || 150), SEED = +(arg('seed') || 5000), LIVES = +(arg('lives') || 6), YEARS = +(arg('years') || 70);
const POL = (arg('policies') || 'none,best,worst,bold,steady,care,flee').split(',');

const browser = await pw.chromium.launch();
const pg = await browser.newPage();
const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 300)));
await pg.goto(pathToFileURL(html).href);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
await pg.evaluate(BOT); await pg.evaluate(RANKFX_LAB); await pg.evaluate(TS_LAB);
const out = { html: path.relative(root, html) };
const t0 = Date.now();

if (what.includes('swing')) {
  out.swing = await pg.evaluate(([n, seed, pols]) => {
    const fights = RANKFX_FIGHTS(n, seed), res = {};
    window.TS_TAGS = {};
    for (const p of pols) res[p] = fights.map(f => TS_PLAY(f, p));
    const flip = (a, b) => res[a].filter((x, i) => x.won === true && res[b][i].won === false).length;
    const sum = { fights: fights.length, policies: {}, pairs: {}, choices: {} };
    for (const p of pols) {
      const L = res[p], men = L.reduce((a, x) => a + x.men, 0);
      sum.policies[p] = { won: L.filter(x => x.won === true).length, ended: L.filter(x => x.won != null).length, perf: +(L.reduce((a, x) => a + x.perf, 0) / L.length).toFixed(2),
        diedPerMan: +(L.reduce((a, x) => a + x.dead, 0) / Math.max(1, men)).toFixed(3), youDied: L.filter(x => !x.alive).length, choices: +(L.reduce((a, x) => a + x.choices, 0) / L.length).toFixed(2), dragged: L.reduce((a, x) => a + x.saved, 0) };
    }
    for (const [a, b] of [['best', 'worst'], ['best', 'none'], ['none', 'worst'], ['bold', 'flee']]) if (res[a] && res[b]) sum.pairs[a + '>' + b] = { gained: flip(a, b), lost: flip(b, a), points: Math.round(100 * (flip(a, b) - flip(b, a)) / fights.length * 10) / 10 };
    for (const [k, v] of Object.entries(window.TS_TAGS)) sum.choices[k] = { n: v.n, diedPerMan: +(v.died / Math.max(1, v.men)).toFixed(3) };
    return sum;
  }, [FIGHTS, SEED, POL]);
  console.log(JSON.stringify(out.swing));
}

if (what.includes('lives')) {
  const paths = Object.assign({ soldier: { start: { race: 'human', realm: 'POL-01', status: 'peasant', startAge: 18 }, enlist: true } }, TARGETS.paths);
  out.lives = {};
  const only = arg('paths') ? arg('paths').split(',') : null;
  for (const [name, P] of Object.entries(paths)) {
    if (only && !only.includes(name)) continue;
    const rows = [];
    for (let i = 0; i < LIVES; i++) {
      const o = Object.assign({ seed: 7001 + i * 104729 + name.length * 31, sex: i % 2 ? 'F' : 'M' }, P.start);
      const pers = ['careful', 'reckless', 'greedy', 'random'][i % 4], engaged = i % 2 === 0;
      rows.push(await pg.evaluate(([o, pers, engaged, enlist, years]) => {
        const ng = A.newGame;
        if (enlist) A.newGame = function () { const r = ng.apply(this, arguments); try { A.enlist(A.pc()); } catch (e) {} return r; };
        let L;
        try { L = B.life(o, pers, engaged, years); } finally { A.newGame = ng; }
        const pc = A.P(A.S.pc), S = L.samples || [];
        return { ts: pc.tsN || 0, levy: pc.tsLevyN || 0, service: S.filter(s => s.mil >= 0).length, years: L.years, death: L.deathAge, arc: L.arc };
      }, [o, pers, engaged, !!P.enlist, name === 'soldier' ? 40 : YEARS]));
      process.stderr.write(`${name} ${i}: ${JSON.stringify(rows[rows.length - 1])}\n`);
    }
    const served = rows.filter(r => r.service > 0), yrs = served.reduce((a, r) => a + r.service, 0), tsArmy = rows.reduce((a, r) => a + r.ts - r.levy, 0);
    out.lives[name] = { lives: rows.length, metAny: rows.filter(r => r.ts > 0).length, metLevy: rows.filter(r => r.levy > 0).length, served: served.length,
      servedMet: served.filter(r => r.ts - r.levy > 0).length, perDecadeOfService: yrs ? +(10 * tsArmy / yrs).toFixed(1) : null, serviceYears: yrs, rows };
    console.log(name, JSON.stringify(Object.assign({}, out.lives[name], { rows: undefined })));
  }
}
await browser.close();
out.secs = Math.round((Date.now() - t0) / 1000);
out.pageErrors = errs.slice(0, 5);
if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(out, null, 1));
console.log('secs', out.secs, 'page errors', errs.length);
