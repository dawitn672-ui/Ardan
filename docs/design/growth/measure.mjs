// G0: measure how stats and skills grow over a life today (docs/design/growth-standard.md, part 1).
//
//   node docs/design/growth/measure.mjs <built.html> [--workers=2] [--years=75] [--only=name,...] [--out=docs/design/growth/today.json]
//
// Plays fixed-seed lives from birth with the engine's own bot loop (tools/bench/bot.mjs's, inlined so it can sample),
// and records once a year of age: the six stored stats (p.st) and their effective values (A.stat), health, looks,
// every skill's stored number, and for each skill that year: how many separate gains it got, the sum, and the largest.
// Read only: it wraps A.trainSkill outermost to count, draws nothing and changes nothing the game reads.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const HTML = path.resolve(args.find(a => !a.startsWith('--')) || path.join(root, 'index.html'));
const WORKERS = +opt('workers', 2), YEARS = +opt('years', 75), OUT = opt('out', path.join(root, 'docs/design/growth/today.json'));
const ONLY = opt('only', null) ? opt('only').split(',') : null;

// the lives: a path, a sex, a seed and a way of playing (engaged: a training activity each month, as an attentive player)
export const LIVES = [
  { name: 'artisan-engaged', o: { seed: 11, race: 'human', realm: 'POL-03', status: 'artisan', sex: 'M', startAge: 0 }, pers: 'careful', engaged: true },
  { name: 'artisan-passive', o: { seed: 12, race: 'human', realm: 'POL-03', status: 'artisan', sex: 'M', startAge: 0 }, pers: 'random', engaged: false },
  { name: 'noble-engaged', o: { seed: 21, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 0 }, pers: 'reckless', engaged: true },
  { name: 'noble-passive', o: { seed: 22, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 0 }, pers: 'careful', engaged: false },
  { name: 'peasant-engaged', o: { seed: 31, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 0 }, pers: 'careful', engaged: true },
  { name: 'peasant-passive', o: { seed: 32, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 0 }, pers: 'greedy', engaged: false },
  { name: 'peasant-passive-b', o: { seed: 33, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 0 }, pers: 'greedy', engaged: false },   // the first died at ten
  { name: 'merchant-engaged', o: { seed: 41, race: 'human', realm: 'POL-04', status: 'merchant', sex: 'M', startAge: 0 }, pers: 'greedy', engaged: true },
  { name: 'gentry-engaged', o: { seed: 51, race: 'human', realm: 'POL-02', status: 'gentry', sex: 'F', startAge: 0 }, pers: 'careful', engaged: true },
];

const INPAGE = () => {
  const G = window.__G = { y: {} };
  const t = A.trainSkill;
  A.trainSkill = function (p, k) {
    const before = p && p.skills ? (p.skills[k] || 0) : 0;
    const r = t.apply(this, arguments);
    if (p && A.S && p.id === A.S.pc && p.skills) {
      const got = (p.skills[k] || 0) - before;
      if (got > 0) { const e = G.y[k] || (G.y[k] = [0, 0, 0]); e[0]++; e[1] += got; if (got > e[2]) e[2] = got; }
    }
    return r;
  };
  window.__life = function (o, personality, engaged, maxYears) {
    A.newGame(o); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null;
    const S = [], start = A.S.year, pid = A.S.pc;
    let lastAge = -1;
    const r2 = x => Math.round(x * 100) / 100;
    const sample = pc => {
      const st = {}, eff = {}, pot = {};
      for (const s of GD.STATS) { st[s] = r2(pc.st[s]); eff[s] = A.stat(pc, s); pot[s] = Math.round(pc.pot[s]); }
      const sk = {}; for (const k in pc.skills) if (pc.skills[k] > 0.05) sk[k] = r2(pc.skills[k]);
      const gains = {}; for (const k in G.y) gains[k] = [G.y[k][0], r2(G.y[k][1]), r2(G.y[k][2])];
      S.push({ age: A.age(pc), y: A.S.year, st, eff, pot, health: Math.round(pc.health), looks: Math.round(pc.looks || 0), sk, gains,
        job: pc.job ? pc.job.c + ':' + pc.job.r : '', mil: pc.mil ? pc.mil.rank : -1, noble: pc.noble ? pc.noble.rung : -1,
        wounds: (pc.wounds || []).map(w => w.k), apt: pc.apt || {}, train: (A.plan(pc) || {}).train || '' });
      G.y = {};
    };
    const PLAN = { careful: ['study', 'practice', 'train_yard', 'heal', 'rest', 'pray', 'make_friend'], greedy: ['trade_venture', 'moneylend', 'chores', 'practice', 'study'],
      reckless: ['train_yard', 'spar', 'duel', 'tournament', 'hunt', 'beast_hunt', 'practice'], random: Object.keys(GD.ACTIVITIES) };
    for (let guard = 0; guard < 40000; guard++) {
      const pc = A.pc();
      if (!pc || pc.id !== pid || !pc.alive || A.S.year - start > maxYears) break;
      const age = A.age(pc);
      if (age !== lastAge) { sample(pc); lastAge = age; }
      if (engaged) {
        const list = personality === 'random' ? [A.pick(PLAN.random)] : PLAN[personality] || [];
        const k = list.find(a => GD.ACTIVITIES[a] && A.canAct(a)[0]);
        if (k) { try { A.doActivity(k); } catch (err) {} }
      }
      const r = A.advance(engaged ? 31 : 400);
      let h, g = 0;
      while ((h = A.headReady()) && g++ < 300) {
        if (h.type === 'event' && h.result) { A.eventClose(); continue; }
        if (h.type === 'event') {
          const v = A.eventView(h), ch = v.choices.filter(c => c.i >= 0);
          const odds = c => c.odds == null ? 100 : c.odds;
          let best = ch[0];
          if (personality === 'careful') best = ch.reduce((a, c) => odds(c) > odds(a) ? c : a, ch[0]);
          else if (personality === 'reckless') best = ch.reduce((a, c) => odds(c) < odds(a) ? c : a, ch[0]);
          else if (ch.length) best = A.pick(ch);
          A.eventChoose(best ? v.choices.indexOf(best) : 0); A.eventClose();
        } else if (h.type === 'choice') A.choiceChoose(0);
        else if (h.type === 'duel') { A.duelAuto(h.d); A.duelClose(); }
        else if (h.type === 'mission') { A.missionAuto(h.m); if (A.S.queue[0] === h) A.missionClose ? A.missionClose() : A.S.queue.shift(); }
        else if (h.type === 'battle') { A.battleAuto(h.b); if (A.S.queue[0] === h) A.battleClose ? A.battleClose() : A.S.queue.shift(); }
        else A.skipPrompt();
      }
      if (r.why === 'dead') break;
    }
    const pc = A.P(pid);
    if (pc && pc.alive) sample(pc);
    return { samples: S, died: pc && !pc.alive ? A.age(pc) : null, cause: pc ? String(pc.deathCause || pc.cause || '') : '' };
  };
};

async function main() {
  const browser = await pw.chromium.launch();
  const lives = LIVES.filter(l => !ONLY || ONLY.includes(l.name));
  const out = { html: path.basename(HTML), years: YEARS, lives: {} };
  if (fs.existsSync(OUT)) Object.assign(out.lives, JSON.parse(fs.readFileSync(OUT, 'utf8')).lives || {});
  let next = 0;
  const worker = async () => {
    const page = await browser.newPage();
    page.setDefaultTimeout(7200000);
    page.on('pageerror', e => console.log('pageerror', String(e).slice(0, 200)));
    await page.goto(pathToFileURL(HTML).href);
    await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 600000 });
    await page.evaluate(INPAGE);
    while (next < lives.length) {
      const L = lives[next++], t0 = Date.now();
      const r = await page.evaluate(([o, p, e, y]) => window.__life(o, p, e, y), [L.o, L.pers, L.engaged, YEARS]);
      out.lives[L.name] = Object.assign({ o: L.o, pers: L.pers, engaged: L.engaged }, r);
      fs.writeFileSync(OUT, JSON.stringify(out));
      console.log(`${L.name}: ${r.samples.length} years, died ${r.died} (${r.cause}), ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    }
    await page.close();
  };
  await Promise.all(Array.from({ length: Math.min(WORKERS, lives.length) }, worker));
  await browser.close();
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(e => { console.error(e); process.exit(1); });
