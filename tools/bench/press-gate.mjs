// The A1 gate (round 2, docs/CRITIQUE.md §2 item 3 and Q2): real Next month presses on the committed saves of year 0
// and year 50 (tests/saves/press/), on a fresh page and after a death, at 1366 px, in main-thread CPU time, held to the
// budgets below. Each run is tools/bench/next-month-speed.mjs in a child process; its JSON summaries are read back.
//
//   node tools/bench/press-gate.mjs [built.html] [--n=24] [--out=/tmp/ardan/press-gate] [--report]
//
// --report prints the table and never fails (for measuring a build that is not meant to pass). Exit code 1 when a
// budget is broken or a run logged an error.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const arg = (k, d) => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const HTML = path.resolve(args.find(a => !a.startsWith('--')) || path.join(root, 'index.html'));
const N = +arg('n', 24), OUT = path.resolve(arg('out', '/tmp/ardan/press-gate')), REPORT = args.includes('--report');
const SAVES = path.join(root, 'tests/saves/press');

// The budgets (CRITIQUE A1 "Done when"). Medians, so one long press (the year turn's autosave, a war's first battle)
// does not decide; the full-redraw count is the most in any press.
export const BUDGET = {
  quietMs: 150,        // CPU of a quiet month, the settle after it included
  perCardMs: 100,      // CPU each card adds to a month
  fullRedraws: 1,      // UI.refresh or UI.render per press
  quietLayouts: 12,    // layouts in a quiet press
  ageRatio: 1.15,      // year 50's quiet month over year 0's
  throttledWallMs: 1000, // a quiet month's wall time at four-times CPU throttle (year 50)
};

const RUNS = [
  { tag: 'y0', save: 'y0-noble.ardan' },
  { tag: 'y0-death', save: 'y0-noble.ardan', death: true },
  { tag: 'y50', save: 'y50-noble.ardan' },
  { tag: 'y50-death', save: 'y50-noble.ardan', death: true },
  { tag: 'y50-x4', save: 'y50-noble.ardan', throttle: 4, n: Math.max(8, N >> 1) },
];

const res = {};
for (const r of RUNS) {
  const a = [path.join(root, 'tools/bench/next-month-speed.mjs'), HTML, `--save=${path.join(SAVES, r.save)}`, `--n=${r.n || N}`, '--w=1366', `--tag=${r.tag}`, `--out=${OUT}`];
  if (r.death) a.push('--death');
  if (r.throttle) a.push(`--throttle=${r.throttle}`);
  const p = spawnSync(process.execPath, a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 64 << 20 });
  const last = (p.stdout || '').trim().split('\n').filter(l => /SUMMARY|FATAL|errors:/.test(l)).join('\n');
  console.log(last);
  let j = null; try { j = JSON.parse(fs.readFileSync(path.join(OUT, `press-${r.tag}.json`), 'utf8')); } catch (e) {}
  res[r.tag] = { ok: p.status === 0 && !!j, s: j && j.summary };
}

const fails = [];
const check = (name, v, max, unit = '') => { const ok = v != null && v <= max; if (!ok) fails.push(`${name}: ${v == null ? 'no data' : v + unit} (budget ${max}${unit})`); return `${name.padEnd(36)} ${String(v == null ? '-' : v + unit).padStart(9)}  budget ${max}${unit}  ${ok ? 'ok' : 'OVER'}`; };
const lines = [];
for (const t of ['y0', 'y0-death', 'y50', 'y50-death']) {
  const s = res[t].s;
  if (!res[t].ok || !s) { fails.push(`${t}: the run failed`); continue; }
  lines.push(check(`${t}: quiet month (${s.quiet} of ${s.months})`, s.quietMedian, BUDGET.quietMs, ' ms'));
  lines.push(check(`${t}: each card`, s.perCard == null ? 0 : Math.round(s.perCard), BUDGET.perCardMs, ' ms'));
  lines.push(check(`${t}: full redraws a press (most)`, s.fullMax, BUDGET.fullRedraws));
  lines.push(check(`${t}: layouts in a quiet press`, s.quietLayouts, BUDGET.quietLayouts));
  lines.push(`${''.padEnd(36)} (the engine's share of a quiet month: ${s.quietEngine} ms)`);
}
for (const [a, b] of [['y50', 'y0'], ['y50-death', 'y0-death']]) {
  const x = res[a].s, y = res[b].s;
  if (x && y && y.quietMedian) lines.push(check(`${a} over ${b}`, +(x.quietMedian / y.quietMedian).toFixed(2), BUDGET.ageRatio, '×'));
}
const th = res['y50-x4'].s;
if (!res['y50-x4'].ok || !th) fails.push('y50-x4: the run failed');
else lines.push(check('y50 at 4x throttle: quiet month wall', th.quietWall, BUDGET.throttledWallMs, ' ms'));
console.log('\nThe A1 gate, ' + path.relative(root, HTML) + ':\n' + lines.join('\n'));
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'gate.json'), JSON.stringify({ html: HTML, budget: BUDGET, res, fails }, null, 1));
if (fails.length) { console.log('\n' + (REPORT ? 'over budget (report only): ' : 'FAILED: ') + fails.join('; ')); if (!REPORT) process.exitCode = 1; }
else console.log('\nall within budget');
