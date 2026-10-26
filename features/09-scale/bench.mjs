// The world K times over, timed (docs/plan/world-expansion-architecture.md, appendix A and stage 0).
//
//   node features/09-scale/bench.mjs [built.html] [--K=1,5,10] [--months=14] [--seed=1234] [--off] [--json=out.json]
//
// For each K: copy the 306-province world K times (clone.js), start a game, play months of 30 days with events
// auto-chosen, and print A.newGame's time, the median and 90th percentile month, the month that holds the New Year,
// and the state's size. Times are wall clock and the page's main-thread CPU time (Chrome's ThreadTime), which a
// loaded machine inflates much less. --off runs the release's code paths (A.SCALE_OFF = true) for comparison.
// One browser, one page per K.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.join(here, '../..');
const args = process.argv.slice(2), opt = (k, d) => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const file = path.resolve(root, args.find(a => !a.startsWith('--')) || 'index.html');
const KS = opt('K', '1,5,10').split(',').map(Number), MONTHS = +opt('months', 14), SEED = +opt('seed', 1234), OFF = args.includes('--off');
const CLONE = fs.readFileSync(path.join(here, 'clone.js'), 'utf8');
const med = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? Math.round(s[Math.floor(s.length / 2)]) : null; };
const p90 = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? Math.round(s[Math.min(s.length - 1, Math.floor(s.length * 0.9))]) : null; };

const browser = await pw.chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });
const rows = [];
for (const K of KS) {
  const page = await browser.newPage(), errs = [];
  page.on('pageerror', e => errs.push(String(e.message || e).slice(0, 200)));
  await page.goto(pathToFileURL(file).href);
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
  const cpu = async () => (await cdp.send('Performance.getMetrics')).metrics.find(m => m.name === 'ThreadTime').value * 1000;
  await page.evaluate(CLONE);
  const setup = await page.evaluate(([K, seed, off]) => {
    A.SCALE_OFF = off;
    __CLONE(K);
    const t = performance.now();
    A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', startAge: 16 });
    window.__benchMonth = () => {
      const d0 = A.S.year * 365 + (A.S.warClock || 0), y0 = A.S.year, t = performance.now();
      for (let g = 0; g < 400 && A.S.year * 365 + (A.S.warClock || 0) - d0 < 30; g++) {
        const r = A.advance(30);
        let h, k = 0;
        while ((h = A.headReady()) && k++ < 500) { if (h.type === 'event') A.eventAuto(); else A.S.queue.shift(); }
        if (r.why === 'dead' || !A.pc() || !A.pc().alive) return { ms: performance.now() - t, dead: true };
      }
      return { ms: performance.now() - t, year: A.S.year !== y0 };
    };
    return { ng: Math.round(performance.now() - t), provs: A.S.prov.length, realms: Object.keys(A.S.realms).length, people: Object.keys(A.S.people).length, kb0: Math.round(JSON.stringify(A.S).length / 1024) };
  }, [K, SEED, OFF]);
  const plain = [], plainC = [], year = [], yearC = [];
  for (let m = 0; m < MONTHS; m++) {
    const c0 = await cpu(), r = await page.evaluate(() => __benchMonth()), c = (await cpu()) - c0;
    if (m > 0) (r.year ? year : plain).push(r.ms), (r.year ? yearC : plainC).push(c);   // the first month builds paths once
    if (r.dead) break;
  }
  const end = await page.evaluate(() => ({ kb: Math.round(JSON.stringify(A.S).length / 1024), bad: (A.SCALE && A.SCALE.bad || []).length, missed: A.SCALE ? A.SCALE.stats.missed : 0 }));
  const row = { K, ...setup, monthMs: med(plain), monthP90: p90(plain), monthCpu: med(plainC), yearMs: med(year), yearCpu: med(yearC), months: plain.length + year.length, kbEnd: end.kb, bad: end.bad, missed: end.missed, errors: errs.length };
  rows.push(row);
  console.log(`${K}x ${row.provs} provinces, ${row.realms} realms, ${row.people} people${OFF ? ' (SCALE_OFF)' : ''}: new game ${row.ng} ms; month ${row.monthMs} ms (cpu ${Math.round(row.monthCpu)}), p90 ${row.monthP90} ms;` +
    ` year-turn month ${row.yearMs} ms (cpu ${Math.round(row.yearCpu)}); state ${row.kb0} -> ${row.kbEnd} KB${row.bad || row.missed ? `; ${row.bad} bad, ${row.missed} missed` : ''}${errs.length ? '; page errors: ' + errs[0] : ''}`);
  await page.close();
}
await browser.close();
if (opt('json', null)) fs.writeFileSync(path.resolve(opt('json')), JSON.stringify({ file: path.relative(root, file), off: OFF, rows }, null, 1));
