// Measurements behind features/75-fair-checks/README.md, on a built page. They take about 40 minutes for 64 lives, so
// they are not in test.mjs.
//
//   node features/75-fair-checks/bench.mjs <built.html> [--lives=64] [--from=0] [--seed0=9001] [--off] [--json=out.json]
//
// Plays bench/run.mjs's league lives (the same seeds, starts, personalities and engaged/passive order; the bot is
// bench/bot.mjs, unchanged) and logs every check the bot takes: the event, the check (skill or stat, difficulty, fight
// or not), the odds shown, the result, the life's band (FC.band) and stats, the personality, and the other choices'
// odds. --off plays the same lives with the rule off (A.FC.OFF), so a build can be compared with itself.
// Prints the success rate overall and by personality, band, odds, kind, difficulty and source; and FC.TYP as measured
// (the median of each stat and of the asked skill, by band), to refit the table.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BOT } from '../../bench/bot.mjs';

const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const html = path.resolve(root, process.argv.slice(2).find(a => !a.startsWith('--')) || 'index.html');
const LIVES = +(arg('lives') || 64), FROM = +(arg('from') || 0), SEED0 = +(arg('seed0') || 9001), OFF = process.argv.includes('--off');

// which feature wrote an event: the id's first appearance in a features/*/*.js file, else the release
const SRC = {};
for (const d of fs.readdirSync(path.join(root, 'features'))) {
  const dir = path.join(root, 'features', d); if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir)) if (/\.js$/.test(f)) for (const m of fs.readFileSync(path.join(dir, f), 'utf8').matchAll(/\bid:\s*["']([a-z0-9_]+)["']/g)) SRC[m[1]] = SRC[m[1]] || d;
}

const browser = await pw.chromium.launch();
const pg = await browser.newPage();
const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 300)));
await pg.goto(pathToFileURL(html).href);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
await pg.evaluate(BOT);
await pg.evaluate(off => { if (A.FC) A.FC.OFF = off; }, OFF);
const t0 = Date.now(), lives = [], rec = [];
for (let i = FROM; i < FROM + LIVES; i++) {
  const r = await pg.evaluate(([i, SEED0]) => {
    const STARTS = [
      { race: 'human', realm: 'POL-01', status: 'peasant' }, { race: 'human', realm: 'POL-01', status: 'noble' },
      { race: 'human', realm: 'POL-05', status: 'merchant' }, { race: 'human', realm: 'POL-07', status: 'serf' },
      { race: 'orc', realm: 'POL-11', status: 'peasant' }, { race: 'dwarf', realm: 'POL-20', status: 'artisan' },
      { race: 'human', realm: 'POL-02', status: 'royal' }, { race: 'elf', realm: 'POL-03', status: 'peasant' }];
    const PERS = ['careful', 'reckless', 'greedy', 'random'];
    const engaged = i % 2 === 0, s = STARTS[Math.floor(i / 2) % STARTS.length], p = PERS[Math.floor(i / (2 * STARTS.length)) % PERS.length];
    const o = Object.assign({ seed: SEED0 + i * 7919, sex: i % 2 ? 'F' : 'M' }, s), rec = [];
    const band = pc => (A.FC ? A.FC.band(pc) : A.stage(pc));
    const ch0 = A.eventChoose;
    A.eventChoose = function (idx) {
      const q = A.S.queue[0], pc = A.pc();
      let x = null;
      try {
        if (q && q.type === 'event' && !q.result && pc) {
          const v = A.eventView(q), vc = v.choices[idx], e = A.EV[q.ev];
          if (vc && vc.odds != null && vc.i >= 0 && e) {
            const c = e.choices[vc.i], ck = c.check || {}, all = v.choices.filter(y => y.i >= 0).map(y => y.odds);
            const val = k => (k == null ? null : GD.STATS.includes(k) ? A.stat(pc, k) : A.skillEff(pc, k));
            x = { ev: q.ev, s: ck.s || (c.group ? 'GROUP' : null), s2: ck.s2 || null, d: c.check ? ck.d || 45 : null, fight: ck.fight ? ck.fight.scale : c.group ? 'group' : null,
              odds: vc.odds, min: Math.min(...all.filter(y => y != null)), max: Math.max(...all.filter(y => y != null)), nocheck: all.some(y => y == null),
              age: A.age(pc), band: band(pc), st: GD.STATS.map(k => A.stat(pc, k)), v1: val(ck.s), v2: val(ck.s2), skill1: ck.s && !GD.STATS.includes(ck.s), skill2: ck.s2 && !GD.STATS.includes(ck.s2),
              dEff: c.check && A.FC ? A.FC.dFor(pc, c.check) : null };
          }
        }
      } catch (err) {}
      const res = ch0.apply(this, arguments);
      if (x) { x.win = q.result && q.result.success ? 1 : 0; rec.push(x); }
      return res;
    };
    let L;
    try { L = B.life(o, p, engaged, 90); } finally { A.eventChoose = ch0; }
    return { life: { i, pers: p, engaged, start: s.status + '/' + s.race, checks: L.checks, wins: L.wins, years: L.years, deathAge: L.deathAge }, rec };
  }, [i, SEED0]);
  lives.push(r.life); for (const x of r.rec) { x.pers = r.life.pers; x.life = i; x.src = SRC[x.ev] || 'release'; rec.push(x); }
  process.stdout.write('.');
}
process.stdout.write('\n');
await browser.close();

const pc1 = (w, n) => (n ? Math.round(1000 * w / n) / 10 : null);
const checks = lives.reduce((a, l) => a + l.checks, 0), wins = lives.reduce((a, l) => a + l.wins, 0);
const by = (key, min = 0) => {
  const G = {};
  for (const x of rec) { const k = key(x); const g = G[k] = G[k] || { n: 0, w: 0, o: 0 }; g.n++; g.w += x.win; g.o += x.odds; }
  return Object.entries(G).filter(([, g]) => g.n >= min).sort((a, b) => b[1].n - a[1].n).map(([k, g]) => ({ k, n: g.n, share: pc1(g.n, rec.length), win: pc1(g.w, g.n), odds: Math.round(10 * g.o / g.n) / 10 }));
};
// spread: the rate over lives, resampled (2,000 draws of 64 lives with replacement)
let h = 7; const rnd = () => { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; return h / 4294967296; };
const boot = []; for (let b = 0; b < 2000; b++) { let c = 0, w = 0; for (let k = 0; k < lives.length; k++) { const l = lives[Math.floor(rnd() * lives.length)]; c += l.checks; w += l.wins; } boot.push(100 * w / Math.max(1, c)); }
boot.sort((a, b) => a - b);
const med = a => { const s = a.filter(v => v != null).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const TYP = {};
for (const b of ['child', 'teen', 'adult1', 'adult2', 'adult3', 'old']) {
  const R = rec.filter(x => x.band === b); if (!R.length) continue;
  TYP[b] = { n: R.length };
  ['str', 'spd', 'ins', 'sta', 'int', 'wil'].forEach((k, j) => { TYP[b][k] = med(R.map(x => x.st[j])); });
  TYP[b].skill = med(R.flatMap(x => [x.skill1 ? x.v1 : null, x.skill2 ? x.v2 : null]));
}
const band = o => o <= 4 ? 'a: at the 4% floor' : o < 15 ? 'b: 5-14' : o < 30 ? 'c: 15-29' : o < 50 ? 'd: 30-49' : o < 75 ? 'e: 50-74' : o < 96 ? 'f: 75-95' : 'g: 96';
const out = {
  file: path.relative(root, html), off: OFF, lives: lives.length, minutes: Math.round((Date.now() - t0) / 6000) / 10,
  checkWinRate: pc1(wins, checks), checks, bootstrap90: [Math.round(boot[100] * 10) / 10, Math.round(boot[1900] * 10) / 10],
  under15Pct: pc1(rec.filter(x => x.odds < 15).length, rec.length), atFloorPct: pc1(rec.filter(x => x.odds <= 4).length, rec.length),
  eased: pc1(rec.filter(x => x.dEff != null && x.dEff < x.d).length, rec.length),
  byPersonality: by(x => x.pers), byBand: by(x => x.band), byOdds: by(x => band(x.odds)).sort((a, b) => a.k.localeCompare(b.k)),
  byKind: by(x => (x.fight ? 'fight: ' + x.fight : (x.skill1 ? 'skill' : 'stat') + ' + ' + (x.s2 == null ? 'nothing' : x.skill2 ? 'skill' : 'stat'))),
  byDifficulty: by(x => (x.d == null ? '-' : x.d < 35 ? 'a: <35' : x.d < 45 ? 'b: 35-44' : x.d < 50 ? 'c: 45-49' : x.d < 55 ? 'd: 50-54' : 'e: 55+')).sort((a, b) => a.k.localeCompare(b.k)),
  byChoice: by(x => (x.nocheck ? 'a safe choice was offered' : 'every choice a check') + ', ' + (x.odds === x.min && x.odds !== x.max ? 'took the worst odds' : x.odds === x.max && x.odds !== x.min ? 'took the best odds' : 'the only or a middle one')),
  byAskedSkill: by(x => (x.v1 == null || !x.skill1 ? 'a stat' : x.v1 < 5 ? 'a: untrained (<5)' : x.v1 < 20 ? 'b: 5-19' : x.v1 < 35 ? 'c: 20-34' : x.v1 < 50 ? 'd: 35-49' : 'e: 50+')).sort((a, b) => a.k.localeCompare(b.k)),
  bySource: by(x => x.src, 40), byEvent: by(x => x.ev, 30).slice(0, 25),
  TYP, pageErrors: errs.length,
};
console.log(JSON.stringify(Object.assign({}, out, { byEvent: undefined, bySource: undefined }), null, 1));
console.log('sources', out.bySource.map(x => `${x.k} ${x.n} ${x.win}%`).join('; '));
if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(Object.assign(out, { lifeList: lives, rec }), null, 0));
