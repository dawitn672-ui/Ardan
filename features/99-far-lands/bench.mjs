// Month and year-turn cost of the Great Continent against the Known World, on a built game:
//   node features/99-far-lands/bench.mjs <built.html> [--lands=known,great] [--months=25] [--seed=1234] [--runs=1] [--scale=on,off]
// Each game is A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', startAge: 16, lands }), played a
// month (30 days) at a time with events auto-chosen; a month that holds the New Year is counted apart as the year
// turn (the method of docs/plan/world-expansion-architecture.md, 2.2). One browser, one page per game.
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { HELPERS } from '../../tests/helpers.mjs';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
const args = process.argv.slice(2), opt = (k, d) => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const file = path.resolve(args.find(a => !a.startsWith('--')) || 'index.html');
const LANDS = opt('lands', 'known,great').split(','), MONTHS = +opt('months', 25), SEED = +opt('seed', 1234), RUNS = +opt('runs', 1);
const SCALES = opt('scale', 'on').split(',');   // on, off: 09-scale's A.SCALE_OFF (the engine's reference path) when it is in the build

const browser = await pw.chromium.launch();
const rows = [];
for (let run = 0; run < RUNS; run++) for (const scale of SCALES) for (const lands of LANDS) {
  const ctx = await browser.newContext(), pg = await ctx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await pg.goto(pathToFileURL(file).href);
  await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
  await pg.evaluate(HELPERS);
  const r = await pg.evaluate(({ lands, MONTHS, SEED, scale }) => {
    if (scale === 'off') A.SCALE_OFF = true;
    const t0 = performance.now();
    A.newGame({ seed: SEED, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16, lands });
    const tNew = performance.now() - t0, S0 = JSON.stringify(A.S).length;
    const day = () => (A.absDay ? A.absDay() : A.S.year * 365 + (A.S.day || 0));
    const months = [], years = [];
    for (let m = 0; m < MONTHS; m++) {
      const y0 = A.S.year, d0 = day(), t1 = performance.now();
      for (let g = 0; g < 400 && day() < d0 + 30; g++) {
        const res = A.advance(Math.max(1, d0 + 30 - day()));
        let h, k = 0; while ((h = A.headReady && A.headReady()) && k++ < 300) { if (h.type === 'event') A.eventAuto(); else A.S.queue.shift(); }
        if (res && res.why === 'dead') break;
      }
      const ms = performance.now() - t1;
      (A.S.year !== y0 ? years : months).push(ms);
      if (!A.pc() || !A.pc().alive) break;
    }
    months.sort((a, b) => a - b);
    const q = p => months.length ? months[Math.min(months.length - 1, Math.floor(p * months.length))] : 0;
    return { lands, prov: A.S.prov.length, realms: Object.keys(A.S.realms).length, people0: null, tNew: Math.round(tNew), median: Math.round(q(0.5)), p90: Math.round(q(0.9)),
      year: years.map(Math.round), n: months.length, mb0: +(S0 / 1e6).toFixed(2), mb1: +(JSON.stringify(A.S).length / 1e6).toFixed(2), scale: !!A.SCALE && !A.SCALE_OFF, scaleIn: !!A.SCALE };
  }, { lands, MONTHS, SEED, scale });
  r.errors = errs.length;
  rows.push(r);
  console.log(`${r.lands.padEnd(6)} ${String(r.prov).padStart(5)} provinces ${String(r.realms).padStart(4)} realms | new game ${r.tNew} ms | month median ${r.median} ms, p90 ${r.p90} ms (${r.n}) | year-turn month ${r.year.join(', ')} ms | state ${r.mb0} -> ${r.mb1} MB | 09-scale ${!r.scaleIn ? 'not in the build' : r.scale ? 'on' : 'off'}${r.errors ? ' | ' + r.errors + ' page errors' : ''}`);
  await ctx.close();
}
await browser.close();
if (opt('json', null)) (await import('node:fs')).writeFileSync(opt('json'), JSON.stringify(rows, null, 1));
