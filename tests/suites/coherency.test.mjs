// The coherency net (round 2 A3a, src/core/08-coherency-checks): a new game passes every check on day 0, the checks are pure,
// and a short run of lives finds no more contradictions of any kind than tests/coherency-baseline.json allows.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { jobsFor, runLife, countsOf, compare, STARTS } from '../../tools/lib/coherency-life.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BASE = JSON.parse(fs.readFileSync(path.join(root, 'tests/coherency-baseline.json'), 'utf8'));

export default {
  // day 0 of every kind of life: no check fails (P22: the v2 stores were missing until the first tick; the heir of Kesh
  // sat as Chancellor at 2), and running the checks twice changes nothing and draws nothing
  async coherencyDay0(page) {
    const starts = STARTS.concat([{ status: 'peasant', startAge: 20, sex: 'F', realm: 'POL-03', race: 'elf' }, { status: 'peasant', startAge: 16, sex: 'M', realm: 'POL-11', race: 'orc' }]);
    const r = await page.evaluate(starts => {
      const out = { checks: A.COHERENCY.checks.length, fails: [], impure: [] };
      starts.forEach((o, i) => {
        T.enter({ seed: 3100 + i * 17, race: 'human', ...o });
        const k0 = A.rngState, h0 = T.hash(A.S);
        const f = A.COHERENCY.run(), f2 = A.COHERENCY.run();
        if (A.rngState !== k0 || T.hash(A.S) !== h0 || JSON.stringify(f) !== JSON.stringify(f2)) out.impure.push(o.status + ' ' + (o.race || 'human'));
        for (const x of f) out.fails.push(`${o.status} ${o.race || 'human'}: ${x.check}: ${x.problems[0]}`);
      });
      return out;
    }, starts);
    return { ok: r.checks >= 12 && !r.fails.length && !r.impure.length, detail: `${r.checks} checks on day 0 of ${starts.length} lives: ${r.fails.length ? r.fails.slice(0, 4).join(' | ') : 'all pass'}; impure: ${r.impure.join(', ') || 'none'}` };
  },
  // the quick run: 4 lives of 16 years, every check every 4 years, each count at or under its baseline (which may only
  // shrink; tools/coherency.mjs --baseline=quick prints the same run in full)
  async coherencyBaseline(page) {
    const B = BASE.quick, lives = [];
    for (const j of jobsFor(B.seeds).slice(0, B.lives)) lives.push(await runLife(page, j, { years: B.years, every: B.every }));
    const counts = countsOf(lives), { rose, fell } = compare(counts, B.counts);
    const impure = lives.filter(l => l.impure.length).map(l => `seed ${l.o.seed} in ${l.impure.join(', ')}`);
    return { ok: !rose.length && !impure.length, data: counts,
      detail: `${lives.length} lives x ${B.years} years: ${rose.length ? 'ROSE above the baseline: ' + rose.join('; ') : 'no check above its baseline'}${fell.length ? '; fell (lower tests/coherency-baseline.json): ' + fell.join('; ') : ''}; impure: ${impure.join(', ') || 'none'}` };
  },
};
