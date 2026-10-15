// Dead numbers (Road to Ten, Character 7; docs/benchmarks/character-lifesim.md, "Every number matters"). The plan's
// gate: "any stat or skill that changes fewer than 5 outcomes in a typical bot life is cut or merged".
// Plays bot lives (bench/bot.mjs) and counts, for each of the 6 stats and 38 skills, the outcomes it changed in that life:
//   decided  event checks the player took that test this number (the check's skill or stat, and a skill whose value
//            won A.skillEff's synergy max for it)
//   offered  check choices shown to the player that test it (odds it moved, taken or not)
//   gated    events the player got whose condition read it (the event came, or came this way, because of it)
//   engine   engine decisions that read it: each call of a deciding function (a duel, a battle, a mission, a month of
//            work, the body's year, an activity, an event's effects ...) that read the player's number counts once per
//            call; daily ones (the plan's aims) once a month. Scans that read every skill without using most of them
//            (perks, the "What now" list, the training picker, the recap, every event's condition each month) are left
//            out, as are A.trainSkill's reads of intelligence for learning speed.
//   outcomes = decided + gated + engine. A number passes when the median life reaches 5.
// A merged skill (49-body-mind's A.BM.MERGE) reads and trains its family's skill, so it is reported under that one.
//   node bench/dead-numbers.mjs [built.html] [--lives-per=4] [--years=60] [--min=25] [--workers=3] [--json=reports/dead-numbers.json]
// Lives shorter than --min years are played but left out of the medians (a life that ends at 17 tells nothing about
// which numbers a life uses); further seeds are tried until each path has --lives-per lives, up to 3 times as many.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BOT } from './bot.mjs';
import { TARGETS } from './targets.mjs';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const opt = k => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const file = path.resolve(process.argv.slice(2).find(a => !a.startsWith('--')) || path.join(root, 'index.html'));
const PER = +(opt('lives-per') || 4), YEARS = +(opt('years') || 60), MIN = +(opt('min') || 25), WORKERS = Math.max(1, +(opt('workers') || 3));
const median = a => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

// the in-page counter: installed once per page, reset per life
const COUNTER = () => {
  const DN = window.DN = { on: false, depth: 0, mute: 0, reads: null, perMonth: null, life: null };
  const pcOf = p => p && A.S && p.id === A.S.pc;
  const note = k => { if (DN.on && DN.depth > 0 && !DN.mute && DN.reads) DN.reads.add(k); };
  const skill = A.skill; A.skill = function (p, k) { if (pcOf(p)) note(k); return skill.apply(this, arguments); };
  const stat = A.stat; A.stat = function (p, s) { if (pcOf(p)) note(s); return stat.apply(this, arguments); };
  // a deciding function: reads inside it (and inside anything it calls) count once for this call
  const scope = (name, per) => {
    const f = A[name]; if (typeof f !== 'function') return;
    const w = function () {
      if (!DN.on || DN.depth > 0) { DN.depth += DN.depth > 0 ? 1 : 0; try { return f.apply(this, arguments); } finally { if (DN.depth > 0) DN.depth--; } }
      DN.depth = 1; DN.reads = new Set();
      try { return f.apply(this, arguments); }
      finally {
        DN.depth = 0;
        const m = A.S ? A.S.year * 12 + Math.floor(((A.S.warClock || 0) % 365) / 30.42) : 0;
        for (const k of DN.reads) {
          if (per === 'month') { const key = name + ':' + k; if (DN.perMonth[key] === m) continue; DN.perMonth[key] = m; }
          DN.life.engine[k] = (DN.life.engine[k] || 0) + 1;
          (DN.life.by[k] = DN.life.by[k] || {})[name] = (DN.life.by[k][name] || 0) + 1;
        }
        DN.reads = null;
      }
    };
    for (const p of Object.keys(f)) w[p] = f[p];
    A[name] = w;
  };
  // left out: scans over every skill, display helpers, learning speed
  const mute = name => { const f = A[name]; if (typeof f !== 'function') return; const w = function () { DN.mute++; try { return f.apply(this, arguments); } finally { DN.mute--; } }; for (const p of Object.keys(f)) w[p] = f[p]; A[name] = w; };
  for (const n of ['perkSum', 'perkOf', 'perksOf', 'whatNow', 'defaultPlan', 'defaultPlanIfAuto', 'trainTargets', 'recapSnap', 'recapMake', 'trainSkill', 'train', 'eventView', 'checkOdds', 'checkVal', 'stats', 'classOf', 'role', 'tierOf', 'specOf', 'specMul', 'canAct']) mute(n);
  for (const n of ['duelAuto', 'duelAct', 'duelStart', 'battleAuto', 'battleAct', 'missionAuto', 'missionChoose', 'groupFightPC', 'careerYear', 'pathMonth', 'moneyYear', 'bodyYear',
    'mortalCheck', 'milYear', 'nobleYear', 'rulerYear', 'doActivity', 'prisonYear', 'familyYear', 'wsDay', 'promoCheck', 'interact', 'nobleAction',
    'applyJob', 'dutyEvent', 'flowEvent', 'planMonth', 'applyFx', 'choiceChoose', 'workHard', 'travelTo', 'councilMonth', 'yearGrowth', 'willGrow', 'naturalCause', 'deathChance']) scope(n, 'call');
  scope('planDay', 'month');
  // checks: the number a check names, and a skill whose synergy value beat it in A.skillEff
  const src = (pc, k) => {
    if (GD.STATS.includes(k)) return [k];
    if (!GD.SKILLS[k]) return [];
    DN.mute++;
    try {
      let best = k, v = A.skill(pc, k);
      for (const [j, m] of GD.SKILL_SYN[k] || []) { const x = A.skill(pc, j) * m; if (x > v) { v = x; best = j; } }
      return best === k ? [k] : [k, best];
    } finally { DN.mute--; }
  };
  const tally = (bag, pc, ch) => { const ks = new Set(); for (const k of [ch.check.s, ch.check.s2]) if (k) for (const s of src(pc, k)) ks.add(s); for (const s of ks) bag[s] = (bag[s] || 0) + 1; };
  const view = A.eventView;
  A.eventView = function (q) {
    const fresh = q && !q.view, v = view.apply(this, arguments);
    try {
      if (DN.on && fresh && v && !v.skip) {
        const e = A.EV[q.ev], pc = A.pc();
        for (const c of v.choices) { const ch = e && e.choices[c.i]; if (ch && ch.check) tally(DN.life.offered, pc, ch); }
        // what the event's condition read: the event came because of it
        if (e && e.cond) { const o = { d: DN.depth, r: DN.reads, m: DN.mute }; DN.depth = 1; DN.mute = 0; DN.reads = new Set();
          try { e.cond(pc, A.C); } catch (err) {} for (const k of DN.reads) DN.life.gated[k] = (DN.life.gated[k] || 0) + 1; DN.depth = o.d; DN.reads = o.r; DN.mute = o.m; }
      }
    } catch (err) {}
    return v;
  };
  const choose = A.eventChoose;
  A.eventChoose = function (idx) {
    try {
      const q = A.S.queue[0];
      if (DN.on && q && q.type === 'event' && !q.result) {
        const v = A.eventView(q), c = v.choices[idx], e = A.EV[q.ev], ch = c && e && e.choices[c.i];
        if (ch && ch.check) tally(DN.life.decided, A.pc(), ch);
      }
    } catch (err) {}
    return choose.apply(this, arguments);
  };
  for (const k of Object.keys(choose)) A.eventChoose[k] = choose[k];
  scope('eventChoose', 'call');   // an event's effects read what they read: a duel's fighters, a group fight
  DN.reset = () => { DN.life = { decided: {}, offered: {}, gated: {}, engine: {}, by: {} }; DN.perMonth = {}; DN.depth = 0; DN.mute = 0; };
  DN.reset();
};

const browser = await pw.chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });
const errs = [], pages = [];
for (let w = 0; w < WORKERS; w++) {
  const page = await browser.newPage();
  page.on('pageerror', e => errs.push(String(e.message || e)));
  await page.goto(pathToFileURL(file).href);
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
  await page.evaluate(BOT);
  await page.evaluate(COUNTER);
  pages.push(page);
}
const keys = await pages[0].evaluate(() => ({ stats: GD.STATS, skills: Object.keys(GD.SKILLS), merge: (A.BM && A.BM.MERGE) || {} }));
// each path is one job: its seeds are tried in a fixed order, so the numbers do not depend on timing
const jobs = Object.entries(TARGETS.paths).map(([name, P]) => ({ name, P }));
const played = new Array(jobs.length);
const play = (page, { name, P }) => page.evaluate(([name, start, per, years, min]) => {
  const lives = [];
  for (let i = 0; i < per * 3 && lives.length < per; i++) {
    const pers = ['careful', 'reckless', 'greedy', 'random'][i % 4], engaged = i % 2 === 0;
    const o = Object.assign({ seed: 5101 + i * 7919 + name.length * 131, sex: i % 2 ? 'F' : 'M' }, start);
    DN.reset(); DN.on = true;
    let L; try { L = B.life(o, pers, engaged, years); } finally { DN.on = false; }
    if (L.years < min) continue;
    lives.push({ seed: o.seed, pers, engaged, years: L.years, death: L.deathAge, decided: DN.life.decided, offered: DN.life.offered, gated: DN.life.gated, engine: DN.life.engine, by: DN.life.by });
  }
  return lives;
}, [name, P.start, PER, YEARS, MIN]);
await Promise.all(pages.map(async (page, w) => {
  for (let k = w; k < jobs.length; k += WORKERS) { played[k] = await play(page, jobs[k]); process.stdout.write('.'); }
}));
process.stdout.write('\n');
await browser.close();

const lives = played.flat();
const rows = [];
for (const k of [...keys.stats, ...keys.skills]) {
  const merged = keys.merge[k];
  const d = lives.map(l => l.decided[k] || 0), o = lives.map(l => l.offered[k] || 0), g = lives.map(l => l.gated[k] || 0), e = lives.map(l => l.engine[k] || 0), t = lives.map((l, i) => d[i] + g[i] + e[i]);
  const by = {}; for (const l of lives) for (const [f, n] of Object.entries(l.by[k] || {})) by[f] = (by[f] || 0) + n;
  const top = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([f, n]) => `${f} ${Math.round(n / lives.length * 10) / 10}`);
  rows.push({ k, kind: keys.stats.includes(k) ? 'stat' : 'skill', merged: merged || null, decided: median(d), offered: median(o), gated: median(g), engine: median(e), outcomes: median(t),
    livesUnder5: t.filter(x => x < 5).length, top });
}
const dead = rows.filter(r => !r.merged && r.outcomes < 5);
const out = { file: path.relative(root, file), lives: lives.length, years: median(lives.map(l => l.years)), minYears: MIN, rows, dead: dead.map(r => r.k), merged: rows.filter(r => r.merged).map(r => `${r.k}→${r.merged}`), errors: errs.slice(0, 5) };
console.log(`${lives.length} lives (median ${out.years} years; lives under ${MIN} years left out)`);
console.log('| Number | Decided checks | Offered checks | Events it gated | Engine reads | Outcomes (median) | Lives under 5 | Main engine readers (per life) |');
console.log('| --- | --- | --- | --- | --- | --- | --- | --- |');
for (const r of rows.sort((a, b) => b.outcomes - a.outcomes)) console.log(`| ${r.k}${r.merged ? ` (→ ${r.merged})` : ''} | ${r.decided} | ${r.offered} | ${r.gated} | ${r.engine} | ${r.outcomes < 5 && !r.merged ? `**${r.outcomes}**` : r.outcomes} | ${r.livesUnder5} of ${lives.length} | ${r.top.join(', ')} |`);
console.log(`under 5 outcomes in the median life: ${dead.length ? dead.map(r => `${r.k} ${r.outcomes}`).join(', ') : 'none'}` + (out.merged.length ? `; merged: ${out.merged.join(', ')}` : ''));
if (errs.length) console.log('page errors:', errs.slice(0, 5).join(' | '));
const json = opt('json');
if (json) { fs.mkdirSync(path.dirname(path.resolve(json)), { recursive: true }); fs.writeFileSync(path.resolve(json), JSON.stringify(out, null, 1)); }
process.exit(errs.length ? 1 : 0);
