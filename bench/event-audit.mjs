// The event audit (Road to Ten, Events 1): which events earn their place, and what retiring the weakest does to a life.
//
//   node bench/event-audit.mjs <built.html> --mode=rank   [--json=reports/event-audit.json]
//        score every event: what its choices do, who reads its flags, chains, memory, local gating, checks, words,
//        and how often it fires in bot lives. Writes the ranking (features/58-event-cut builds its retire list from it).
//   node bench/event-audit.mjs <built.html> --mode=measure [--lives=48] [--json=reports/event-cut.json]
//        the same bot lives twice, once with the classic pool (every event) and once with the cut pool, plus the
//        eligible-pool floors per class, job, age band and realm. Needs a build with features/58-event-cut.
//        --seed=N plays a different set of lives (the default is 5801).
//
// One browser, one page, lives run one after another (CPU is shared).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { unpack } from '../tools/pack.mjs';
import { BOT } from './bot.mjs';
import { analyzeChoices } from '../tools/choice-analyzer.mjs';

const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = k => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const file = path.resolve(root, args.find(a => !a.startsWith('--')) || 'index.html');
const MODE = opt('mode') || 'rank';
const LIVES = +(opt('lives') || (MODE === 'rank' ? 32 : 48));
const r1 = x => x == null ? null : Math.round(x * 10) / 10;

// ---- the release's own events, and the ones features wrote (never retired)
const vend = unpack(fs.readFileSync(path.join(root, 'vendor/ardan-b593143.html'), 'utf8'));
const releaseIdRx = new Set([...vend['ardan-content'].matchAll(/\bid:"([a-z0-9_]+)"/g)].map(m => m[1]));
const featureIds = new Set();
for (const d of fs.readdirSync(path.join(root, 'features')).filter(d => /^\d+-/.test(d)))
  for (const f of fs.readdirSync(path.join(root, 'features', d)).filter(f => f.endsWith('.events.js')))
    for (const m of fs.readFileSync(path.join(root, 'features', d, f), 'utf8').matchAll(/\bid:\s*['"]([a-z0-9_]+)['"]/g)) featureIds.add(m[1]);
// the built game's code outside the events: engine, features' core code, lore
const built = unpack(fs.readFileSync(file, 'utf8'));
// (the retire list of features/58-event-cut names every retired id; it is not a reference, so it is left out)
const engineText = built['ardan-core'].replace(/\n;\(function\(\)\{ \/\/ features\/\d+-event-cut\/[^\n]*\n[\s\S]*?\n\}\)\(\);\n/g, '\n') + '\n' + built['ardan-lore'];

// the bot's lives: starts across classes and peoples, personalities rotate, engaged and passive alternate
const STARTS = [
  { race: 'human', realm: 'POL-01', status: 'peasant', startAge: 0 }, { race: 'human', realm: 'POL-05', status: 'serf', startAge: 0 },
  { race: 'human', realm: 'POL-03', status: 'artisan', startAge: 0 }, { race: 'human', realm: 'POL-05', status: 'merchant', startAge: 0 },
  { race: 'human', realm: 'POL-01', status: 'noble', startAge: 0 }, { race: 'human', realm: 'POL-02', status: 'royal', startAge: 0 },
  { race: 'orc', realm: 'POL-11', status: 'peasant', startAge: 0 }, { race: 'dwarf', realm: 'POL-20', status: 'artisan', startAge: 0 },
  { race: 'elf', realm: 'POL-03', status: 'peasant', startAge: 0 }, { race: 'human', realm: 'POL-07', status: 'gentry', startAge: 0 },
  { race: 'human', realm: 'POL-01', status: 'slave', startAge: 0 }, { race: 'human', realm: 'POL-02', status: 'peasant', startAge: 0 },
];
const PERS = ['careful', 'reckless', 'greedy', 'random'];
const SEED = +(opt('seed') || 5801);   // --seed=N plays another set of lives
const lifeSpec = i => ({ o: Object.assign({ seed: SEED + i * 7919, sex: i % 2 ? 'F' : 'M' }, STARTS[i % STARTS.length]), p: PERS[Math.floor(i / STARTS.length) % 4], e: i % 2 === 0 });

const browser = await pw.chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });
const page = await browser.newPage();
const perrs = []; page.on('pageerror', e => perrs.push(String(e.message || e).slice(0, 200)));
await page.goto(pathToFileURL(file).href);
await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 });
await page.evaluate(BOT);
// record every event the bot answers: its id, the year, the age and the class at that moment
await page.evaluate(() => {
  window.__fired = [];
  const ch = A.eventChoose;
  A.eventChoose = function () { const q = A.S.queue[0], pc = A.pc();
    if (q && q.type === 'event' && pc) window.__fired.push([q.ev, A.S.year, A.age(pc), A.classOf(pc), q.forced ? 1 : 0]);
    return ch.apply(this, arguments); };
});

// the events a character could draw this year, for probes across classes, jobs, age bands and realms.
// classic: true restores every event first (features/58-event-cut), false applies the cut; no feature: as built.
function probePools(classic) {
  const probes = [];
  const add = (name, o, tweak) => probes.push({ name, o, tweak });
  for (const [st, age] of [['slave', 25], ['serf', 25], ['peasant', 25], ['artisan', 25], ['merchant', 30], ['gentry', 30], ['noble', 30], ['royal', 30]]) add('class:' + st, { status: st, startAge: age });
  add('class:ruler', { status: 'royal', startAge: 40 }, pc => { if (!pc.ruler && A.makeRuler) A.makeRuler(pc, pc.realm, true); });
  for (const [b, age] of [['infant', 3], ['child', 8], ['teen', 14], ['young', 20], ['adult', 35], ['middle', 50], ['old', 65]]) add('age:' + b, { status: 'peasant', startAge: age });
  for (const [b, age] of [['noble-child', 8], ['noble-teen', 14], ['noble-old', 65]]) add('age:' + b, { status: 'noble', startAge: age });
  for (const c of Object.keys(GD.CAREERS)) add('job:' + c, { status: 'peasant', startAge: 28 }, pc => { pc.job = { c, r: Math.min(1, GD.CAREERS[c].ranks.length - 1), y: 3, perf: 50, merit: 0, sal: 10 }; });
  add('soldier', { status: 'peasant', startAge: 24 }, pc => { try { A.volunteer && A.volunteer(); } catch (e) {} });
  for (const rid of Object.keys(LORE.realms)) {
    const race = ['human', 'elf', 'dwarf', 'orc', 'halfling', 'giant', 'gnome', 'goblin', 'beastfolk'].find(x => GD.RACES[x] && A.raceAllowed(x, rid)) || Object.keys(GD.RACES).find(x => A.raceAllowed(x, rid)) || 'human';
    add('realm:' + rid, { status: 'peasant', startAge: 28, realm: rid, race });
  }
  const LOCAL = /C\.realm\(|C\.cult\(|C\.faith\(|POL-\d\d|CUL-\d\d|REL-\d\d/;
  const res = [];
  for (const P of probes) {
    let pc;
    try { A.newGame(Object.assign({ seed: 777, race: 'human', realm: 'POL-01', sex: 'M', classicEvents: classic }, P.o)); pc = A.pc(); if (P.tweak) P.tweak(pc); }
    catch (err) { res.push({ name: P.name, ids: [], local: [], weight: 0, err: String(err).slice(0, 80) }); continue; }
    if (A.EC) A.EC.sync(classic);
    const ids = [], local = []; let weight = 0;
    for (const id in A.EV) { const e = A.EV[id]; if (e.trigger) continue;
      let ok = false; try { ok = e.cond ? !!e.cond(pc, A.C) : true; } catch { ok = false; } if (!ok) continue;
      const f = A.evFit ? A.evFit(e, pc) : 1; if (f <= 0) continue;
      ids.push(id); weight += (e.w || 1) * f; if (e.cond && LOCAL.test(e.cond.toString())) local.push(id); }
    res.push({ name: P.name, ids, local, weight: Math.round(weight) });
  }
  return res;
}

async function playLives(n, classic) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const { o, p, e } = lifeSpec(i);
    const L = await page.evaluate(([o, p, e, classic]) => {
      window.__fired = [];
      // a year-by-year record of the class, so years with no event can be found per class
      const years = {};
      const hook = pc => { if (pc && pc.id === A.S.pc) years[A.S.year] = A.classOf(pc); };
      A.onMonth.push(hook);
      let L;
      try { L = B.life(Object.assign({ classicEvents: classic }, o), p, e, 70); } finally { A.onMonth.splice(A.onMonth.indexOf(hook), 1); }
      const at = age => { const x = (L.samples || []).find(s => s.age >= age); return x ? { wil: x.wil, str: x.str, health: x.health, coin: x.coin } : null; };
      return { years: L.years, deathAge: L.deathAge, cause: L.cause, at30: at(30), at45: at(45), events: L.events, memEvents: L.memEvents, fired: window.__fired, classYears: years, arc: L.arc,
        classic: A.S.settings ? !!A.S.settings.classicEvents : null };
    }, [o, p, e, classic]);
    out.push(L);
    process.stdout.write(classic ? 'c' : '.');
  }
  process.stdout.write('\n');
  return out;
}

// ---- the static descriptor of every event, read in the page
const desc = await page.evaluate(() => {
  if (A.EC) A.EC.sync(true);   // describe every event as written, before the cut marks any
  const src = v => { const seen = new Set();
    const go = x => typeof x === 'function' ? 'FN:' + x.toString() : x && typeof x === 'object' ? (seen.has(x) ? null : (seen.add(x), Array.isArray(x) ? x.map(go) : Object.fromEntries(Object.entries(x).map(([k, y]) => [k, go(y)])))) : x;
    return go(v); };
  const words = s => (String(s || '').match(/\S+/g) || []).length;
  const out = [];
  for (const id in A.EV) {
    const e = A.EV[id], aud = A.evAudience ? A.evAudience(e) : { cond: {}, txt: {} };
    out.push({ id, title: typeof e.title === 'string' ? e.title : '(fn)', trigger: !!e.trigger, once: !!e.once, w: e.w || 1, cool: e.cool || null, npc: !!e.npc,
      pools: ['opp', 'flow', 'duty', 'council', 'drill', 'flowOnly', 'spec', 'school'].filter(k => e[k] != null),
      cond: e.cond ? e.cond.toString() : '', setup: e.setup ? e.setup.toString() : '', text: typeof e.text === 'function' ? e.text.toString() : String(e.text || ''),
      textFn: typeof e.text === 'function', words: typeof e.text === 'string' ? words(e.text) : null,
      aud: Object.keys(aud.cond).filter(k => aud.cond[k]),
      choices: (e.choices || []).map(c => ({ t: typeof c.t === 'string' ? c.t : '(fn)', check: c.check ? src(c.check) : null, group: !!c.group,
        fx: src(c.fx), win: c.win ? src(c.win.fx) : undefined, lose: c.lose ? src(c.lose.fx) : undefined, req: c.req ? String(c.req) : null,
        r: typeof c.r === 'string' ? c.r : '', wr: c.win && typeof c.win.r === 'string' ? c.win.r : '', lr: c.lose && typeof c.lose.r === 'string' ? c.lose.r : '' })) });
  }
  return out;
});
const M = await page.evaluate(() => { const M = B.memoryIndex(); return { memory: [...M.memory] }; });
const memorySet = new Set(M.memory);
const obvious = new Set((await page.evaluate(analyzeChoices, null)).flagged.map(f => f.id));
const byId = Object.fromEntries(desc.map(d => [d.id, d]));
const isRelease = id => releaseIdRx.has(id) && !featureIds.has(id);

// ---- what a choice outcome does
// numbers a choice may move and still be a nudge (stats and skills by 1 or 2; the 0-100 scales by a few points)
const NUDGE = { str: 2, spd: 2, ins: 2, sta: 2, int: 2, wil: 2, looks: 2, skill: 2, happy: 5, health: 8, honor: 5, piety: 5, fame: 2, merit: 3, rep: 3,
  coin: Infinity, coinPct: 20, family: 2, armyXp: Infinity, favor: 1, apt: 1, perf: 5, need: Infinity, styleXp: Infinity };
const NUMBERS = new Set(Object.keys(NUDGE));
const OPINION = new Set(['them', 'bossOp', 'patronOp', 'rulerOp', 'houseOp']);
const NEUTRAL = new Set(['cause', 'why', 'unflag']);   // labels for the log, not effects
// in a function effect: what makes it lasting, and what makes it an opinion change
const FN_LASTING = /addTrait|removeTrait|A\.schedule|A\.queue\(|flags\.|flags\[|addRel|setRel|makeAcquaintance|makeFoe|kill\(|pcDeath|marry|A\.wound|imprison|punish\(|\.job\b|promote|treasury|stability|legit|epithet|deed\(|A\.ach\(|lover|spouse\s*=|startDuel|A\.duel|beast|addGear|gear\.|asset|A\.fame\(p,\s*(?:[3-9]|\d\d)|\b(?:trait|untrait|newRel|rel|lover|event|wound|job|promote|die|prison|punish|free|epithet|deed|secret|ach|gear|asset|duel|beast|lang|literate|mission|letter|sworn|claim|pact|ally|warOn|owed|oweThem|treasury|stability|legit|realmRel|realmStab|realmGold|authority|infamy|masterwork|style|arc)\s*:/;
const FN_OPINION = /addOp|\.op\s*[+-]?=|\bop\s*:|them\s*:/;
function outcome(fx) {
  const o = { lasting: [], opinion: [], big: [], small: [] };
  if (fx == null) return o;
  if (typeof fx === 'string' && fx.startsWith('FN:')) {
    if (FN_LASTING.test(fx)) o.lasting.push('fn');
    else if (FN_OPINION.test(fx)) o.opinion.push('fn');
    else { const lits = [...fx.matchAll(/[+-]=?\s*(\d+(?:\.\d+)?)|\b(?:str|spd|ins|sta|int|wil|looks)\b[^,;]{0,30}?(\d+(?:\.\d+)?)/g)].map(m => +(m[1] || m[2]));
      (lits.some(n => n > 8) ? o.big : o.small).push('fn'); }
    return o;
  }
  if (typeof fx !== 'object') return o;
  for (const [k, v] of Object.entries(fx)) {
    if (v == null || v === false || NEUTRAL.has(k) || k === 'flag') continue;   // a flag counts only if someone reads it (below)
    if (typeof v === 'string' && v.startsWith('FN:')) { o.lasting.push(k + ':fn'); continue; }
    if (OPINION.has(k)) { o.opinion.push(k); continue; }
    if (!NUMBERS.has(k)) { o.lasting.push(k); continue; }
    if (k === 'fame' && typeof v === 'number' && v >= 3) { o.lasting.push('fame3'); continue; }   // known for it
    const n = k === 'skill' && typeof v === 'object' ? Math.max(0, ...Object.values(v).map(x => Math.abs(+x || 0))) : typeof v === 'number' ? Math.abs(v) : 0;
    (n > NUDGE[k] ? o.big : o.small).push(k);
  }
  return o;
}
const flagsSetIn = s => [...String(s).matchAll(/["']?flag["']?\s*:\s*["']([A-Za-z0-9_]+)["']|flags(?:\.|\[["'])([A-Za-z0-9_]+)["']?\]?\s*=(?!=)|["']?mark["']?\s*:\s*["']([A-Za-z0-9_]+)["']/g)].map(m => m[1] || m[2] || 'la_' + m[3]);
const wordRx = w => new RegExp(`(^|[^A-Za-z0-9_])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^A-Za-z0-9_]|$)`, 'g');
const LOCAL = /C\.realm\(|C\.cult\(|C\.faith\(|POL-\d\d|CUL-\d\d|REL-\d\d/;

// every event's own source text, to find who else mentions an id or a flag
const evText = Object.fromEntries(desc.map(d => [d.id, [d.cond, d.setup, d.text, JSON.stringify(d.choices)].join('\n')]));
// a word index over the whole built game (the event packs as written, the engine, features' code, lore); an event's own
// definition is subtracted from it, so what is left is someone else mentioning the id or the flag
const tokenCount = new Map();
for (const s of [built['ardan-content'], engineText]) for (const m of s.matchAll(/[A-Za-z0-9_]{3,}/g)) tokenCount.set(m[0], (tokenCount.get(m[0]) || 0) + 1);

const rows = [];
for (const d of desc) {
  const own = evText[d.id];
  const ownCount = w => (own.match(wordRx(w)) || []).length;
  // referenced anywhere but its own definition (a chain's event:, A.schedule, flags.ev.id, a list in the engine)
  const idRefs = (tokenCount.get(d.id) || 0) - ownCount(d.id) - 1;   // minus its own id: "..."
  const sets = [...new Set([d.setup, ...d.choices.flatMap(c => [c.fx, c.win, c.lose].map(x => typeof x === 'string' ? x : JSON.stringify(x || {})))].flatMap(flagsSetIn))];
  const flagRead = sets.filter(f => (tokenCount.get(f) || 0) - ownCount(f) > 0);
  const outs = d.choices.flatMap(c => [c.fx, c.win, c.lose].filter(x => x !== undefined)).map(outcome);
  const lasting = [...new Set(outs.flatMap(o => o.lasting).concat(flagRead.length ? ['flag-read'] : []))];
  const opinion = [...new Set(outs.flatMap(o => o.opinion))];
  const big = [...new Set(outs.flatMap(o => o.big))];
  const small = [...new Set(outs.flatMap(o => o.small))];
  const checks = d.choices.filter(c => c.check);
  // a real tradeoff: a check whose failure costs something, beside a choice that does not gamble
  const tradeoff = checks.length > 0 && checks.length < d.choices.length && checks.some(c => { const l = outcome(c.lose); return l.lasting.length || l.big.length || /-\d/.test(JSON.stringify(c.lose || '')); });
  const local = LOCAL.test(d.cond);
  const raced = /C\.race\(|\.race\b/.test(d.cond);
  let protect = null;
  if (!isRelease(d.id)) protect = 'feature';                 // new, deliberate content
  else if (d.trigger) protect = 'trigger';                   // only ever queued: a chain's later step
  else if (d.pools.length) protect = 'pool:' + d.pools.join('+');   // job offers, duties, path flows, council, drill
  else if (idRefs > 0) protect = 'referenced';               // queued by another event or the engine, or read in flags.ev
  else if (memorySet.has(d.id)) protect = 'memory';          // reads an earlier memory
  else if (flagRead.length) protect = 'flag-read';           // leaves a memory someone reads
  const kind = lasting.length ? 'lasting' : opinion.length ? 'opinion' : big.length ? 'numbers' : 'nudge';
  const rec = { id: d.id, title: d.title, release: isRelease(d.id), protect, kind, idRefs, sets, flagRead, lasting, opinion, big, small, tradeoff,
    checks: checks.length, choices: d.choices.length, words: d.words, textFn: d.textFn, once: d.once, w: d.w, aud: d.aud, local, raced, npc: d.npc, setup: !!d.setup,
    obviousBest: obvious.has(d.id) };
  // a score within a kind: higher is better
  let s = 0;
  s += tradeoff ? 8 : checks.length ? 3 : 0;
  s += d.words == null ? 3 : Math.min(8, Math.max(0, (d.words - 25) / 6));
  s += d.once ? 2 : 0;
  s += raced ? 3 : 0;
  s += d.setup ? 3 : 0;                      // a setup usually fills a person or a place: the scene is about someone
  s += d.choices.length >= 3 ? 1 : 0;
  s += big.length ? 2 : 0;
  s -= rec.obviousBest ? 4 : 0;
  rec.score = r1(s);
  rows.push(rec);
}

// ---- how often each event fires in bot lives
const lives = await playLives(LIVES, true);
const fires = {};
let totalFired = 0, totalYears = 0;
for (const L of lives) { totalYears += L.years; for (const [id] of L.fired) { fires[id] = (fires[id] || 0) + 1; totalFired++; } }
for (const r of rows) r.fires = fires[r.id] || 0;

if (MODE === 'rank') {
  const rel = rows.filter(r => r.release);
  const tally = (list, k) => list.reduce((o, r) => (o[r[k] || 'open'] = (o[r[k] || 'open'] || 0) + 1, o), {});
  const out = { file: path.relative(root, file), lives: LIVES, years: totalYears, fired: totalFired, events: rows.length, release: rel.length,
    protect: tally(rel, 'protect'), kindOfOpen: tally(rel.filter(r => !r.protect), 'kind'), rows, pools: await page.evaluate(probePools, true), pageErrors: perrs.slice(0, 5) };
  const json = path.resolve(root, opt('json') || 'reports/event-audit.json');
  fs.mkdirSync(path.dirname(json), { recursive: true });
  fs.writeFileSync(json, JSON.stringify(out, null, 1));
  console.log(JSON.stringify({ events: out.events, release: out.release, protect: out.protect, kindOfOpen: out.kindOfOpen, fired: totalFired, years: totalYears }, null, 1));
  console.log('wrote', path.relative(root, json));
}

if (MODE === 'measure') {
  const after = await playLives(LIVES, false);
  const info = Object.fromEntries(rows.map(r => [r.id, r]));
  const retired = new Set(await page.evaluate(() => A.EC ? A.EC.ids() : []));
  // a "small nudge one-off": an event whose choices only nudge numbers, that nothing reads, in no chain
  const nudge = id => { const r = info[id]; return !!r && r.kind === 'nudge' && !r.protect; };
  // a "weak one-off": any of the kinds the cut retires (a nudge, numbers only, opinion only), with nothing reading it
  const weak = id => { const r = info[id]; return !!r && ['nudge', 'numbers', 'opinion'].includes(r.kind) && !r.protect; };
  const summarize = (ls, label) => {
    let ev = 0, yrs = 0, mem = 0, small = 0, weakN = 0, rep = 0, forced = 0, retiredFired = 0, danger = 0;
    const cls = {};
    for (const L of ls) {
      yrs += L.years; ev += L.fired.length; mem += L.memEvents;
      const last = {};
      for (const [id, y, age, c, f] of L.fired) {
        if (nudge(id)) small++;
        if (weak(id)) weakN++;
        if (info[id] && info[id].lasting.some(x => /wound|duel|die|beast|punish/.test(x))) danger++;   // a scene that can hurt, jail or kill
        if (f) forced++;
        if (retired.has(id) && !f) retiredFired++;
        if (last[id] != null && y - last[id] < 10) rep++;
        last[id] = y;
      }
      // per class: years lived in it and years with no event at all
      const evYears = new Set(L.fired.map(x => x[1]));
      for (const [y, c] of Object.entries(L.classYears)) { const k = 'class' + c; cls[k] = cls[k] || { years: 0, events: 0, empty: 0 };
        cls[k].years++; if (!evYears.has(+y)) cls[k].empty++; }
      for (const [, , , c] of L.fired) { const k = 'class' + c; cls[k] = cls[k] || { years: 0, events: 0, empty: 0 }; cls[k].events++; }
    }
    for (const k in cls) { const c = cls[k]; c.eventsPerYear = r1(c.events / Math.max(1, c.years)); c.emptyYearPct = r1(100 * c.empty / Math.max(1, c.years)); }
    return { label, lives: ls.length, years: yrs, eventsPerDecade: r1(10 * ev / Math.max(1, yrs)), memorySharePct: r1(100 * mem / Math.max(1, ev)),
      smallNudgeSharePct: r1(100 * small / Math.max(1, ev)), weakOneOffSharePct: r1(100 * weakN / Math.max(1, ev)), repeatsWithin10y: rep, repeatsPer100Events: r1(100 * rep / Math.max(1, ev)),
      forcedSharePct: r1(100 * forced / Math.max(1, ev)), riskyPerDecade: r1(10 * danger / Math.max(1, yrs)),
      medianDeathAge: (a => a.length ? a.sort((x, y) => x - y)[Math.floor(a.length / 2)] : null)(ls.filter(L => L.deathAge != null).map(L => L.deathAge)),
      meanYears: r1(yrs / Math.max(1, ls.length)),
      wilAt30: r1((a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null)(ls.filter(L => L.at30).map(L => L.at30.wil))),
      strAt30: r1((a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null)(ls.filter(L => L.at30).map(L => L.at30.str))),
      causes: ls.filter(L => L.deathAge != null).map(L => `${L.deathAge}: ${String(L.cause).slice(0, 40)}`), retiredRolled: retiredFired, byClass: cls };
  };
  // the eligible pool a character can draw from, per class, job, age band and realm, with and without the cut
  const pb = await page.evaluate(probePools, true), pa = await page.evaluate(probePools, false);
  const pools = pb.map((P, i) => ({ name: P.name, before: P.ids.length, after: pa[i].ids.length, keptPct: Math.round(100 * pa[i].ids.length / Math.max(1, P.ids.length)),
    localBefore: P.local.length, localAfter: pa[i].local.length, weightBefore: P.weight, weightAfter: pa[i].weight }));
  const before = summarize(lives, 'classic pool'), cut = summarize(after, 'cut pool');
  const minOf = pre => pools.filter(p => p.name.startsWith(pre) && p.after != null).reduce((m, p) => (!m || p.after < m.after ? p : m), null);
  const floors = Object.fromEntries(['class:', 'age:', 'job:', 'realm:', 'soldier'].map(k => [k.replace(':', ''), minOf(k)]));
  // what the fired events were, by the audit's classes, before and after
  const cls = id => { const r = info[id]; if (!r) return 'unknown'; if (!r.release) return 'feature'; if (r.protect) return r.protect.replace(/:.*/, ''); return r.kind; };
  const mix = ls => { const o = {}; let n = 0; for (const L of ls) for (const [id, , , , f] of L.fired) { const k = (f ? 'queued ' : 'rolled ') + cls(id); o[k] = (o[k] || 0) + 1; n++; }
    return Object.fromEntries(Object.entries(o).sort((x, y) => y[1] - x[1]).map(([k, v]) => [k, r1(100 * v / n)])); };
  // a retired event that this build protects (a feature added since the list was made reads its flag or queues it)
  const nowProtected = [...retired].filter(id => !info[id] || info[id].protect).map(id => `${id}: ${info[id] ? info[id].protect : 'missing'}`);
  if (nowProtected.length) console.log(`WARNING ${nowProtected.length} retired events are protected in this build: ${nowProtected.slice(0, 8).join(', ')}`);
  const out = { file: path.relative(root, file), lives: LIVES, retired: retired.size, nowProtected, before, cut, mixBefore: mix(lives), mixCut: mix(after), floors, pools,
    fired: { before: lives.map(L => L.fired), cut: after.map(L => L.fired) }, pageErrors: perrs.slice(0, 5) };
  const json = path.resolve(root, opt('json') || 'reports/event-cut.json');
  fs.mkdirSync(path.dirname(json), { recursive: true });
  fs.writeFileSync(json, JSON.stringify(out, null, 1));
  const keys = ['eventsPerDecade', 'memorySharePct', 'smallNudgeSharePct', 'weakOneOffSharePct', 'repeatsPer100Events', 'repeatsWithin10y', 'forcedSharePct', 'riskyPerDecade', 'medianDeathAge', 'meanYears', 'wilAt30', 'strAt30', 'retiredRolled'];
  for (const k of keys) console.log(k.padEnd(22), String(before[k]).padStart(7), '->', String(cut[k]).padStart(7));
  for (const c of Object.keys(Object.assign({}, before.byClass, cut.byClass)).sort()) {
    const b = before.byClass[c] || {}, a = cut.byClass[c] || {};
    console.log(c.padEnd(8), `years ${b.years || 0}/${a.years || 0}  events/yr ${b.eventsPerYear ?? '-'} -> ${a.eventsPerYear ?? '-'}  empty years ${b.emptyYearPct ?? '-'}% -> ${a.emptyYearPct ?? '-'}%`);
  }
  for (const [k, p] of Object.entries(floors)) if (p) console.log('floor', k.padEnd(7), p.name, p.before, '->', p.after, `(${p.keptPct}%)`);
  console.log('wrote', path.relative(root, json), perrs.length ? `page errors: ${perrs[0]}` : '');
}
await browser.close();
