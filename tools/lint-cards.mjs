// Lint every event of a built page for cards that say what the life is not (X3 part 2, D-059; CRITIQUE E4, E8).
//
//   node tools/lint-cards.mjs [--html=/tmp/x.html] [--json=out.json] [--list]
//
// pronouns   a scene whose person is {them} and whose text says he/she/his/her/him in plain words, where the person's sex is not
//            known to the text (tools/lib/card-lint.mjs pronounLint; the few that are right are listed with a reason in PRONOUN_ALLOW).
//            Must be none. Use {theyHe} {theirHis} {themHim} ({themHim}self), filled from the person's sex.
// station    a scene whose text addresses the player by a station (A.X3.STATION: "your men", "my lord," as an address, "Master <you>",
//            "your journeyman") whose own condition lets a life that does not hold the station in. The card is held back anyway (A.evFit
//            and the last look in f-guard.core.js), so these are not wrong cards but scenes dealt and dropped, a wasted draw. Counted
//            against tests/cards-baseline.json, which may only fall: add the gate (C.office, C.jobRank, C.soldier, C.noble) and lower it.
// Exit code 1 when a pronoun slip stands, or the station count is above the baseline.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { pronounLint, PRONOUN_ALLOW } from './lib/card-lint.mjs';

const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const html = path.resolve(root, arg('html') || 'index.html');
const list = process.argv.includes('--list');

// station: for each scene that uses a station word, the probe lives its own condition admits although they lack the station
const stationGaps = () => {
  const PROBES = [
    { seed: 31, status: 'serf', sex: 'M', startAge: 9, realm: 'POL-05' }, { seed: 32, status: 'peasant', sex: 'M', startAge: 30, realm: 'POL-06' },
    { seed: 33, status: 'artisan', sex: 'F', startAge: 18, realm: 'POL-07' }, { seed: 34, status: 'merchant', sex: 'M', startAge: 35, realm: 'POL-04' },
    { seed: 35, status: 'noble', sex: 'F', startAge: 22, realm: 'POL-03' }, { seed: 36, status: 'noble', sex: 'M', startAge: 45, realm: 'POL-01' },
  ];
  const X3 = A.X3, seen = new Map();
  const ids = Object.keys(A.EV).filter(id => !A.EV[id].trigger && X3.stationNeeds(A.EV[id]).length);
  for (const o of PROBES) {
    A.newGame({ race: 'human', ...o });
    const pc = A.pc();
    for (const id of ids) {
      if (seen.has(id)) continue;
      const e = A.EV[id];
      let ok = true; try { ok = !e.cond || !!e.cond(pc, A.C); } catch (x) { ok = false; }
      if (ok && !X3.stationFits(e, pc)) seen.set(id, { id, rules: X3.stationNeeds(e), life: `${o.status} ${o.startAge}` });
    }
  }
  const out = [...seen.values()];
  return out;
};

const b = await pw.chromium.launch();
const pg = await (await b.newContext()).newPage();
await pg.goto(pathToFileURL(html).href);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
const pron = (await pg.evaluate(pronounLint)).filter(x => !PRONOUN_ALLOW[x.id]);
const gaps = await pg.evaluate(stationGaps);
await b.close();

const baseFile = path.join(root, 'tests/cards-baseline.json');
const base = fs.existsSync(baseFile) ? JSON.parse(fs.readFileSync(baseFile, 'utf8')) : { stationGaps: 1e9 };
console.log(`pronouns: ${pron.length} slip${pron.length === 1 ? '' : 's'}`);
for (const x of pron.slice(0, list ? 1e9 : 25)) console.log(`  ${x.id} ${x.where} [${x.word}] ${x.sent}`);
console.log(`station: ${gaps.length} scene${gaps.length === 1 ? '' : 's'} whose condition lets a life without the station in (baseline ${base.stationGaps})`);
for (const x of gaps.slice(0, list ? 1e9 : 25)) console.log(`  ${x.id}: ${x.rules.join(', ')} (admits a ${x.life})`);
if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify({ pron, gaps }, null, 1));
if (process.argv.includes('--write-baseline')) { fs.writeFileSync(baseFile, JSON.stringify({ stationGaps: gaps.length }, null, 1) + '\n'); console.log('baseline written'); }
process.exit(pron.length || gaps.length > base.stationGaps ? 1 : 0);
