// X1 (D-027): run two builds side by side and compare what the game itself sees.
//
//   node tools/release/identity-probe.mjs <reference.html> <candidate.html> [--years=10] [--seeds=7,11,2024]
//
// For each build: every event's audience class (A.evAudience: the A.CX_RX classes of its cond's text and the A.EV_RX
// classes of its text's text) and its fit for a few kinds of lives; the event list; then, for each seed, a fixed life
// played by code (tests/helpers.mjs T.enter / T.play) for --years years, with A.fingerprint(), a hash of A.S, the
// random stream's position and the journal's length at the end. Prints the comparison; exit 1 on any difference.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { HELPERS } from '../../tests/helpers.mjs';
import { watchPage } from '../lib/page-errors.mjs';

const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const [ref, cand] = args.filter(a => !a.startsWith('--')).map(f => path.resolve(f));
const YEARS = +opt('years', 10), SEEDS = opt('seeds', '7,11,2024').split(',').map(Number);
const STARTS = [
  { race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 },
  { race: 'human', realm: 'POL-04', status: 'noble', sex: 'F', startAge: 18 },
  { race: 'human', realm: 'POL-02', status: 'artisan', sex: 'M', startAge: 0 },
];
const sha = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

async function probe(file) {
  const browser = await pw.chromium.launch();
  const page = await (await browser.newContext()).newPage();
  const errs = []; watchPage(page, errs, { max: 50 });
  await page.goto(pathToFileURL(file).href);
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 });
  await page.evaluate(HELPERS);
  const classes = await page.evaluate(() => {
    const out = {};
    for (const id of Object.keys(A.EV).sort()) { const a = A.evAudience(A.EV[id]); out[id] = JSON.stringify({ c: a.cond, t: a.txt, k: a.classed }); }
    return out;
  });
  const lives = [];
  for (const seed of SEEDS) for (const s of STARTS) {
    const r = await page.evaluate(([o, Y]) => {
      T.enter(o);
      // the fit of every event for this life at its start: A.evFit reads the classes and the life's class and role
      const fit = Object.keys(A.EV).sort().map(id => { try { return A.evFit(A.EV[id], A.pc()); } catch { return 'x'; } }).join(',');
      const end = T.play(Y);
      return { fit, fp: A.fingerprint(), state: T.hash(A.S), rng: A.rngState, year: A.S.year, journal: A.J ? JSON.stringify(A.J).length : 0, end };
    }, [{ seed, ...s }, YEARS]);
    lives.push({ seed, start: `${s.status}/${s.realm}/${s.startAge}`, ...r, fit: sha(r.fit) });
  }
  await browser.close();
  return { classes, lives, errs };
}

const [A, B] = [await probe(ref), await probe(cand)];
let bad = 0;
const ids = new Set([...Object.keys(A.classes), ...Object.keys(B.classes)]);
const diffClass = [...ids].filter(id => A.classes[id] !== B.classes[id]);
console.log(`events: ${Object.keys(A.classes).length} vs ${Object.keys(B.classes).length}; audience class differs for ${diffClass.length}` + (diffClass.length ? ': ' + diffClass.slice(0, 10).join(', ') : ''));
if (diffClass.length || Object.keys(A.classes).length !== Object.keys(B.classes).length) bad++;
const tally = c => { const t = {}; for (const v of Object.values(c)) { const o = JSON.parse(v); for (const k in o.c) if (o.c[k]) t['cond.' + k] = (t['cond.' + k] || 0) + 1; for (const k in o.t) if (o.t[k]) t['txt.' + k] = (t['txt.' + k] || 0) + 1; if (o.k) t.classed = (t.classed || 0) + 1; } return t; };
console.log('classes (reference):', JSON.stringify(tally(A.classes)));
for (let i = 0; i < A.lives.length; i++) {
  const a = A.lives[i], b = B.lives[i], same = ['fit', 'fp', 'state', 'rng', 'year', 'journal', 'end'].every(k => a[k] === b[k]);
  if (!same) bad++;
  console.log(`seed ${a.seed} ${a.start}, ${YEARS} years: ${same ? 'SAME' : 'DIFFERENT'}  fingerprint ${a.fp} / ${b.fp}  A.S hash ${a.state} / ${b.state}  rng ${a.rng} / ${b.rng}  year ${a.year}  journal ${a.journal} / ${b.journal}  fits ${a.fit} / ${b.fit}`);
}
console.log(`page errors: ${A.errs.length} / ${B.errs.length}`);
console.log(bad ? 'DIFFERENT' : 'IDENTICAL');
process.exit(bad ? 1 : 0);
