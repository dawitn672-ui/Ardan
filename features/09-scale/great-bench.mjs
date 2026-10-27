// The Great Continent, timed: every realm simulated in full, from a home in the Known World and in the far lands.
//
//   node features/09-scale/great-bench.mjs [built.html] [--realms=POL-01,POL-36] [--months=14] [--seed=1234]
//        [--scale=on,off] [--lands=great] [--profile=out.json] [--json=out.json]
//
// For each home realm: A.newGame({ lands }) a peasant of that realm, play months of 30 days with events auto-chosen,
// and print the new game's time, the month median and 90th percentile, and the month that holds the New Year, as the
// page's main-thread CPU time (Chrome's ThreadTime) with wall clock in brackets. The first month is left out (it
// builds roads once). --scale=off runs the release's code paths (A.SCALE_OFF). --profile samples the run and prints
// the costliest functions by self time. One browser, one page per run.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.join(here, '../..');
const args = process.argv.slice(2), opt = (k, d) => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const file = path.resolve(root, args.find(a => !a.startsWith('--')) || 'index.html');
const REALMS = opt('realms', 'POL-01,POL-36').split(','), MONTHS = +opt('months', 14), SEED = +opt('seed', 1234);
const LODS = opt('scale', 'on').split(','), LANDS = opt('lands', 'great'), PROFILE = opt('profile', null);
const med = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? Math.round(s[Math.floor(s.length / 2)]) : null; };
const p90 = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? Math.round(s[Math.min(s.length - 1, Math.floor(s.length * 0.9))]) : null; };

const browser = await pw.chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });
const rows = [];
for (const lod of LODS) for (const realm of REALMS) {
  const page = await browser.newPage(), errs = [];
  page.on('pageerror', e => errs.push(String(e.message || e).slice(0, 200)));
  await page.goto(pathToFileURL(file).href);
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
  const cpu = async () => (await cdp.send('Performance.getMetrics')).metrics.find(m => m.name === 'ThreadTime').value * 1000;
  const c0 = await cpu();
  const setup = await page.evaluate(([seed, realm, lands, off]) => {
    A.SCALE_OFF = off;
    const t = performance.now();
    A.newGame({ seed, race: 'human', realm, status: 'peasant', sex: 'M', startAge: 16, lands });
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
    return { ng: Math.round(performance.now() - t), provs: A.S.prov.length, realms: Object.keys(A.S.realms).length, kb0: Math.round(JSON.stringify(A.S).length / 1024) };
  }, [SEED, realm, LANDS, lod === 'off']);
  setup.ngCpu = Math.round((await cpu()) - c0);
  if (PROFILE) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 }); await cdp.send('Profiler.start'); }
  const plain = [], plainC = [], year = [], yearC = [];
  for (let m = 0; m < MONTHS; m++) {
    const t0 = await cpu(), r = await page.evaluate(() => __benchMonth()), c = (await cpu()) - t0;
    if (m > 0) (r.year ? year : plain).push(r.ms), (r.year ? yearC : plainC).push(c);
    if (r.dead) break;
  }
  if (PROFILE) {
    const { profile } = await cdp.send('Profiler.stop');
    const self = new Map(), byId = new Map(profile.nodes.map(n => [n.id, n]));
    const counts = new Map(); for (const s of profile.samples) counts.set(s, (counts.get(s) || 0) + 1);
    let tot = 0;
    for (const [id, c] of counts) { const n = byId.get(id), f = n.callFrame, k = `${f.functionName || '(anon)'}:${f.lineNumber}:${f.columnNumber}`; self.set(k, (self.get(k) || 0) + c); tot += c; }
    const top = [...self].sort((a, b) => b[1] - a[1]).slice(0, 25);
    console.log(`profile ${realm} scale ${lod}: ${tot} samples`);
    for (const [k, c] of top) console.log(`  ${(100 * c / tot).toFixed(1).padStart(5)}%  ${k}`);
    fs.writeFileSync(path.resolve(PROFILE.replace(/\.json$/, '') + `-${realm}-${lod}.json`), JSON.stringify(profile));
  }
  const end = await page.evaluate(() => ({ kb: Math.round(JSON.stringify(A.S).length / 1024), lod: A.WORLD1 ? A.WORLD1.stats : null, year: A.S.year }));
  const row = { realm, lod, ...setup, monthMs: med(plain), monthCpu: med(plainC), monthP90: p90(plainC), yearMs: med(year), yearCpu: med(yearC), months: plain.length + year.length, kbEnd: end.kb, stats: end.lod, errors: errs.length };
  rows.push(row);
  console.log(`${LANDS} ${realm} scale ${lod}: ${row.provs} provinces, ${row.realms} realms; new game ${row.ngCpu} ms cpu (${row.ng}); month ${row.monthCpu} ms cpu (${row.monthMs}), p90 ${row.monthP90};` +
    ` year-turn month ${Math.round(row.yearCpu)} ms cpu (${row.yearMs}); state ${row.kb0} -> ${row.kbEnd} KB${end.lod ? '; ' + JSON.stringify(end.lod) : ''}${errs.length ? '; page errors: ' + errs[0] : ''}`);
  await page.close();
}
await browser.close();
if (opt('json', null)) fs.writeFileSync(path.resolve(opt('json')), JSON.stringify({ file: path.relative(root, file), rows }, null, 1));
