// The far beasts' duel curves: node features/992-far-beasts/fit.mjs <built.html> [--n=1100] [--only=CRE-67,...]
// For every far creature that can be fought, plays duels with the game's own engine (A.startDuel, auto-played by
// A.duelAuto on both sides) and fits, by maximum likelihood, the curve 48-fight-ladder reads for the duel screen and
// for a choice's odds: p = 1 / (1 + e^-((w - w50) / s + 3.5 * (health - 1))), alone and with a hunting party of 8, as
// [w50, s, w50 with the party, s with the party] (null: no fighter in the sample won). As 48 fitted the Known World's:
// fighters of tiers 1 to 5 from A.makeFoe and every ninth raised, at health 45 to 100; a first pass over the whole pool,
// then three in four drawn from near the first estimate. Writes b-duel.core.js. Deterministic for a given build.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
const args = process.argv.slice(2), opt = k => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const file = path.resolve(args.find(a => !a.startsWith('--')) || 'index.html');
const N = +(opt('n') || 1100), ONLY = opt('only') ? opt('only').split(',') : null;

export const FIT_LAB = () => {
  const L = window.FBFIT = {};
  L.rng = seed => { let h = (seed >>> 0) || 1; return () => { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; return h / 4294967296; }; };
  L.pool = function (seed, n) {
    A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 24, lands: 'great' });
    const ids = [];
    for (let i = 0; i < n; i++) {
      const p = A.makeFoe({ realm: 'POL-01', tier: 1 + i % 5 });
      if (i % 9 === 8) { for (const k in p.skills) p.skills[k] = Math.min(100, p.skills[k] + 25); for (const s of ['str', 'spd', 'ins', 'sta']) p.st[s] += 15; }
      if (i % 27 === 26) { for (const k in p.skills) p.skills[k] = Math.min(100, p.skills[k] + 20); for (const s of ['str', 'spd', 'ins', 'sta']) p.st[s] += 15; }
      p.npcTemp = false; A.S.people[p.id] = p; ids.push(p.id);
    }
    return ids;
  };
  L.duel = function (a, bid, party, health) {
    a.health = health; a.wounds = [];
    A.S.pc = a.id; A.S.queue = [];
    const D = A.startDuel(a, { beastId: bid, mod: 1 }, { kind: 'beast', forceSolo: true, grounded: true, party: party ? { n: 8 } : undefined });
    if (!D || !D.a || !D.measure) return null;
    const w = D.measure.wA, hf = D.a.maxHp ? Math.min(1, Math.max(0.3, D.a.hp / D.a.maxHp)) : 1;
    A.duelAuto(D); A.S.queue = [];
    return [w, hf, D.result === 'win' || D.result === 'beastfled' ? 1 : 0];
  };
  L.fit = function (rows) {
    if (!rows.some(r => r[2])) return [null, null];
    let best = null;
    for (let w50 = 0; w50 <= 240; w50 += 1) for (let s = 1.5; s <= 14; s += 0.5) {
      let ll = 0;
      for (const [w, hf, y] of rows) { const p = Math.min(1 - 1e-6, Math.max(1e-6, 1 / (1 + Math.exp(-((w - w50) / s + 3.5 * (hf - 1)))))); ll += y ? Math.log(p) : Math.log(1 - p); }
      if (!best || ll > best[2]) best = [w50, s, ll];
    }
    return [best[0], best[1]];
  };
  L.run = function (ids, n, seed) {
    const pool = L.pool(seed, 360), r = L.rng(seed + 7), H = [100, 100, 85, 70, 55, 45];
    const dc = A.duelConsequences; A.duelConsequences = () => [];
    const close = A.duelClose; A.duelClose = () => {};
    // each fighter's worth, read once from a duel's measure against a stand-in
    const worth = {};
    try {
      for (const pid of pool) { const x = L.duel(A.P(pid), 'CRE-67', false, 100); worth[pid] = x ? x[0] : 0; }
      const out = {};
      for (const bid of ids) {
        const row = [];
        for (const party of [false, true]) {
          const rows = [];
          for (let k = 0; k < Math.round(n * 0.3); k++) { const x = L.duel(A.P(pool[Math.floor(r() * pool.length)]), bid, party, H[Math.floor(r() * H.length)]); if (x) rows.push(x); }
          let [w50] = L.fit(rows);
          const mid = w50 == null ? 150 : w50, nearBy = pool.filter(pid => Math.abs(worth[pid] - mid) <= 25);
          for (let k = Math.round(n * 0.3); k < n; k++) {
            const from = nearBy.length > 10 && r() < 0.75 ? nearBy : pool;
            const x = L.duel(A.P(from[Math.floor(r() * from.length)]), bid, party, H[Math.floor(r() * H.length)]); if (x) rows.push(x);
          }
          const f = L.fit(rows);
          row.push(f[0], f[1]);
        }
        out[bid] = row;
      }
      return out;
    } finally { A.duelConsequences = dc; A.duelClose = close; A.S.queue = []; }
  };
};

async function main() {
  const b = await pw.chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });
  const pg = await b.newPage();
  pg.on('pageerror', e => console.error('page error', String(e).slice(0, 200)));
  await pg.goto(pathToFileURL(file).href);
  await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
  await pg.evaluate(FIT_LAB);
  const ids = await pg.evaluate(only => { A.newGame({ seed: 1, race: 'human', realm: 'POL-60', status: 'peasant', sex: 'M', startAge: 24, lands: 'great' });
    return A.FB.list.filter(c => (c.fight || c.fightSea) && (!only || only.includes(c.id))).map(c => c.id); }, ONLY);
  const out = {};
  for (let i = 0; i < ids.length; i += 6) {
    const part = ids.slice(i, i + 6), t0 = Date.now();
    Object.assign(out, await pg.evaluate(([p, n]) => FBFIT.run(p, n, 9201), [part, N]));
    console.log(part.map(id => `${id} ${JSON.stringify(out[id])}`).join('; '), `${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
  await b.close();
  const keys = Object.keys(out).sort((a, c) => +a.slice(4) - +c.slice(4));
  const text = '// features/992-far-beasts/b-duel.core.js: the far beasts\' duel curves, fitted by fit.mjs on the duel engine (see there).\n' +
    `// [w50, s, w50 with a hunting party of 8, s with it]; ${N} duels per beast and mode. Read by c-beasts.core.js into GD.BEAST_DUEL.\n` +
    'A.FB_DUEL = {\n' + keys.map(k => `  '${k}': ${JSON.stringify(out[k])},`).join('\n') + '\n};\n';
  if (ONLY) { console.log(text); return; }
  fs.writeFileSync(path.join(HERE, 'b-duel.core.js'), text);
  console.log(`wrote b-duel.core.js: ${keys.length} beasts`);
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(e => { console.error(e); process.exit(1); });
