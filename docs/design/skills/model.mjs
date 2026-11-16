// S1a: skills with levels and experience, as a small, pure, runnable model (docs/design/skills.md).
//
// Not game code. It is the reference S1b ports into src/people/engine/skills.js, and the source of every number in
// the design: `node docs/design/skills/lives.mjs` plays the sample lives and the spread run and writes lives.json,
// `node docs/design/skills/chart.mjs` draws lives.svg. It stands on the growth standard's model (the curve, quality,
// teachers, the learner's age, disuse) and adds what order 63 asks for: levels, experience, concepts, breakthroughs,
// and the things that make growth move with the life (discipline, rivals, a new land, needs, kin skills, focus).
//
// Deterministic: no Math.random, no clock. A person's grasp of each concept is a hash of (world seed, person,
// concept); a life's chances come from a stream seeded the same way. Every change is written to the ledger with
// its cause, and every turning point to the record.
import fs from 'node:fs';
import { CURVE, TALENT, PAST_REACH, quality, teacherMul, LEARN_AGE, interp, GRACE, GRACE_KIND, RUST_STEP, REGAIN, PERMANENT } from '../growth/model.mjs';

export const DATA = JSON.parse(fs.readFileSync(new URL('./skills.json', import.meta.url), 'utf8'));
export const SKILL = Object.fromEntries(DATA.skills.map(s => [s.id, s]));

// ---- 1. levels: seven words of five steps (35 levels); Myth is for the dead ------------------------------------------
export const WORDS = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master', 'Grandmaster', 'Legend'];
export const EDGE = [1, 15, 35, 55, 72, 88, 96, 101];        // growth.md §2.2: where each word begins on the 0-100 scale checks read
export const STEPS = 5, MAX_LV = WORDS.length * STEPS;
export const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
export const wordOf = lv => (lv <= 0 ? -1 : Math.floor((lv - 1) / STEPS));
export const stepOf = lv => (lv <= 0 ? 0 : ((lv - 1) % STEPS) + 1);
export const levelName = lv => (lv <= 0 ? 'untried' : `${WORDS[wordOf(lv)]} ${ROMAN[stepOf(lv) - 1]}`);
// what a check reads at a level: the word's start plus a fifth of the word for each step past the first
export function value(lv) {
  if (lv <= 0) return 0;
  const w = wordOf(lv);
  return EDGE[w] + (stepOf(lv) - 1) * (EDGE[w + 1] - EDGE[w]) / STEPS;
}
export const levelOfValue = v => { let lv = 0; while (lv < MAX_LV && value(lv + 1) <= v + 1e-9) lv++; return lv; };

// ---- 2. experience: ten for a month of steady drill; each level costs more, by the standard's practice curve ---------
// The standard: one unit of effort at level L is worth R(L) = 1.8 e^(-L/21.6) points. So a step from value a to value b
// costs XP_UNIT x (S/A) x (e^(b/S) - e^(a/S)) experience: 19 for the first Beginner step, about 600 for a Master step.
export const XP_UNIT = 10;
export function cost(lv) {            // experience to go from lv to lv + 1
  if (lv >= MAX_LV) return Infinity;
  const k = XP_UNIT * CURVE.S / CURVE.A;
  return Math.max(1, Math.round(k * (Math.exp(value(lv + 1) / CURVE.S) - Math.exp(value(lv) / CURVE.S))));
}
export const totalTo = lv => { let t = 0; for (let i = 0; i < lv; i++) t += cost(i); return t; };

// ---- 3. deterministic chance ---------------------------------------------------------------------------------------
export function hash(str) { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return (h ^ (h >>> 16)) >>> 0; }
export const unit = str => (hash(str) + 0.5) / 4294967296;
export const normal = str => Math.sqrt(-2 * Math.log(unit(str + '|a'))) * Math.cos(2 * Math.PI * unit(str + '|b'));
export function stream(seed) { let a = hash(seed); return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---- 4. concepts and grasp (growth-standard §3.16) -------------------------------------------------------------------
// Passing into a word needs that word's concepts grasped. A person's NEED for a concept is his own: the number of
// months of insight it takes him, from "at once" (1) to "never" (a blind spot). It is a hash, so it costs no save data.
export const NEED = [0, 2, 4, 10, 18, 28, 40];                     // by the concept's word (1 Intermediate .. 6 Legend), for an ordinary mind
export const NEED_SPREAD = 1.5;                                   // need = NEED x 2^(1.5 z): one man in seven needs three times as long, one in forty-four eight times
export const BLIND = { F: 0.20, E: 0.12, D: 0.08, C: 0.05, B: 0.035, A: 0.02, S: 0.01, SSS: 0 };   // the chance a concept never comes, by talent
export const BLIND_WORD = [0, 0.2, 0.4, 1, 1.2, 1.5, 2];          // ...scaled by the concept's word: the high concepts are the ones men never see
export const conceptsOf = (k, w) => SKILL[k].concepts.filter(c => DATA.words.indexOf(c.word) === w);
export function need(p, k, c) {
  const forced = p.grasp && p.grasp[c.id];
  if (forced === 'blind') return Infinity;
  if (forced === 'easy') return 1;
  const w = DATA.words.indexOf(c.word), t = p.talent[k] || 'C', key = `${p.seed}|${p.id}|${k}|${c.id}`;
  if (unit(key + '|blind') < BLIND[t] * BLIND_WORD[w]) return Infinity;
  // a person's ease in a whole skill (the prodigy: many concepts come easily) and his own draw for this one
  const gift = p.gift && p.gift[k] != null ? p.gift[k] : normal(`${p.seed}|${p.id}|${k}|gift`);
  const z = 0.65 * gift + 0.75 * normal(key);
  return Math.max(1, Math.round(NEED[w] * Math.pow(2, NEED_SPREAD * z) / TALENT[t][0]));
}
// the word the page shows for a concept: never a number
export function graspWord(ins, nd, years) {
  if (ins >= nd) return 'grasped';
  if (nd === Infinity) return years >= 5 ? 'it does not come' : 'dark';
  const f = ins / nd;
  return f <= 0 ? 'dark' : f < 1 / 3 ? 'dim' : f < 2 / 3 ? 'clearer' : 'close';
}

// each month of real effort is a chance of insight, never a sure step
export const INSIGHT = {
  base: 0.18,
  streak: [[6, 0.6], [24, 1.0], [60, 1.3], [Infinity, 1.6]],     // months of unbroken work at the skill: fitful, steady, disciplined, devoted
  quality: { work: 0.4, workPast: 0.15, practice: 0.8, drill: 1.0, stretch: 1.4, failed: 1.8 },   // a failure looked at honestly teaches most
  teacherHolds: 1.6, teacherHoldsProud: 1.15,                      // a teacher who holds the concept and can show it; a proud pupil hears half
  fresh: 1.5,                                                     // a new land, school, master or opponent, for a year
  quiet: 1.5, rested: 1.2,                                        // a quiet season; a rested mind
  weary: 0.7, despair: 0.5, overtrained: 0.5, proudFail: 0.55,    // pride throws away what a failure would teach
  max: 0.85,
};
// breakthroughs: a sudden grasp tied to a moment that names it
export const BREAK = {
  base: 0.025,
  trigger: { defeat: 1.5, neardeath: 1.5, feat: 1.2, rival: 1.2, newland: 0.8, watch: 0.6, quiet: 0.5, word: 0.12 },
  blind: 0.12,                  // a blind spot can still break open, rarely: lifelong is possible, never certain
  proud: 0.6,
  neighbour: 0.2,               // one in five also half-opens the other concept at the same edge
};
export const STORE_RATE = 0.5;  // effort at an edge without the grasp is stored at half
export const PROOF_FROM = 3;    // from Expert (word 3) up, the crossing itself needs a proving moment: a stretch at that word, succeeded

// ---- 5. what moves with the life ------------------------------------------------------------------------------------
export const DYN = {
  streak: [[6, 0.9], [24, 1.0], [60, 1.1], [Infinity, 1.2]],
  slipAfter: 3,                 // months with no work at the skill before the streak halves ("your discipline slipped")
  rivalNear: 1.15, rivalAhead: 1.25,
  fresh: 1.1, freshMonths: 12,
  focus: [1, 1, 0.85, 0.7, 0.55],   // skills given deliberate practice in one month share the hours
  restLow: 0.8, purposeHigh: 1.08, purposeLow: 0.85, companyHigh: 1.1, companyLow: 0.85, comfortLow: 0.9,
  outsideSpecialism: 0.85, specialismSteps: 2, otherSpecialismSteps: -1,
  kinMax: 4,
};
const band = (table, x) => table.find(([lim]) => x < lim)[1];
export const disciplineWord = m => (m < 6 ? 'fitful' : m < 24 ? 'steady' : m < 60 ? 'disciplined' : 'devoted');
const SOCIAL = new Set(['Court']);
export const learnAge = (k, age) => interp(LEARN_AGE[SKILL[k].kind], age);
export const graceYears = (k, bestValue, memory = 1) => (bestValue >= 88 ? Infinity : bestValue >= 72 ? GRACE.master : bestValue >= 55 ? GRACE.expert : GRACE.below) * GRACE_KIND[SKILL[k].kind] * Math.min(1.5, Math.max(1, memory));

// ---- the person -----------------------------------------------------------------------------------------------------
// sk[k] = { lv, xp, st (stored), proved, best (level), rust (points, returnable), used (age), streak, gap, fresh (age until), ins: { conceptId: n }, got: { conceptId: age }, sp: [specialism ids] }
export function person({ id, seed = 'ardan', talent = {}, gift, grasp, memory = 1, proud = false } = {}) {
  return { id, seed, talent, gift, grasp, memory, proud, sk: {}, ledger: [], rec: [], rng: stream(`${seed}|${id}|life`) };
}
export const sk = (p, k) => p.sk[k] || (p.sk[k] = { lv: 0, xp: 0, st: 0, proved: false, best: 0, rust: 0, used: null, streak: 0, gap: 0, fresh: -1, ins: {}, got: {}, sp: [] });
const led = (p, age, k, xp, why, tags) => { if (Math.abs(xp) > 1e-9) p.ledger.push({ age: Math.round(age * 100) / 100, k, xp: Math.round(xp * 100) / 100, why, tags: tags || [] }); };
const rec = (p, age, k, kind, text) => p.rec.push({ age: Math.floor(age), k, kind, text });
// what a check reads: the level's value, less rust (the body gate of C9 and wounds come after, in the game)
export const reads = (p, k) => { const s = p.sk[k]; return s ? Math.max(0, value(s.lv) - s.rust) : 0; };

const openConcepts = (p, k) => { const s = sk(p, k), w = wordOf(s.lv) + 1; return w >= 1 && w < WORDS.length ? conceptsOf(k, w).filter(c => s.got[c.id] == null) : []; };
const atEdge = s => s.lv > 0 && stepOf(s.lv) === STEPS && s.lv < MAX_LV;

function grasp(p, k, c, age, how, text) {
  const s = sk(p, k); s.got[c.id] = Math.floor(age); delete s.ins[c.id];
  rec(p, age, k, how, text);
  // a concept two skills share: the kin skill starts half way to it
  for (const other of DATA.sharedConcepts[c.id] || []) if (other !== k && p.sk[other] && p.sk[other].got[c.id] == null) {
    const nd = need(p, other, SKILL[other].concepts.find(x => x.id === c.id));
    if (nd !== Infinity) p.sk[other].ins[c.id] = Math.max(p.sk[other].ins[c.id] || 0, Math.ceil(nd / 2));
  }
}
// level up while the bar is full and nothing bars the way; at an edge, the word's concepts and (from Expert) a proof
function settle(p, k, age, why) {
  const s = sk(p, k);
  for (;;) {
    if (s.lv >= MAX_LV) { s.xp = 0; break; }
    const c = cost(s.lv);
    if (s.xp < c) break;
    if (atEdge(s)) {
      const w = wordOf(s.lv) + 1, missing = openConcepts(p, k);
      const barred = missing.length || (w >= PROOF_FROM && !s.proved);
      if (barred) {
        // the bar stays full; what is over it is stored (at half while a concept is missing), up to the whole next word
        const over = s.xp - c, room = Math.max(0, totalTo(Math.min(MAX_LV, s.lv + 1 + STEPS)) - totalTo(s.lv + 1) - s.st);
        s.st += Math.min(room, over * (missing.length ? STORE_RATE : 1)); s.xp = c;
        if (s.stallAt == null) s.stallAt = age;
        if (!s.stallSaid && age - s.stallAt >= 1) {
          s.stallSaid = true;
          rec(p, age, k, 'stall', missing.length ? `${SKILL[k].name} holds at ${levelName(s.lv)}: has not grasped ${missing.map(x => x.name).join(' or ')}` : `${SKILL[k].name} holds at ${levelName(s.lv)}: ready, and not yet proved`);
        }
        break;
      }
      const by = w >= PROOF_FROM && s.proofWhy ? s.proofWhy : why;
      s.xp -= c; s.lv++; s.proved = false; s.proofWhy = null; s.stallAt = null; s.stallSaid = false;
      const leap = s.st; s.xp += s.st; s.st = 0;
      rec(p, age, k, 'word', `${SKILL[k].name} reaches ${WORDS[w]}: ${by}${leap >= cost(s.lv) ? ' (what was stored lands at once)' : ''}`);
    } else { s.xp -= c; s.lv++; }
    s.best = Math.max(s.best, s.lv);
  }
}

// one month. acts: [{ skill, eu, q: 'work'|'practice'|'drill'|'stretch', demand, teacher (the teacher's level 1-35),
//   good, d (the task's level 1-35), failed, why, trigger, spec (a specialism id, when the effort is inside one) }]
// ctx: { cond, needs: { rest, company, purpose, comfort } (0-100), weary, despair, overtrained, quiet, rival: { skill, lv },
//   fresh: [skills made new this month: a new land, school, master], wound }
export function month(p, age, acts = [], ctx = {}) {
  const needs = ctx.needs || {}, touched = {}, deliberate = new Set(acts.filter(a => a.q === 'practice' || a.q === 'drill').map(a => a.skill));
  for (const k of ctx.fresh || []) sk(p, k).fresh = age + DYN.freshMonths / 12;
  for (const a of acts) {
    const k = a.skill, s = sk(p, k), L = reads(p, k), t = p.talent[k] || 'C', [tm, reach] = TALENT[t];
    const tags = [];
    let q = quality({ q: a.q, demand: a.demand != null ? value(a.demand) : undefined, d: a.d != null ? value(a.d) : undefined, failed: a.failed }, L);
    let x = XP_UNIT * a.eu * q * tm * learnAge(k, age) * (ctx.cond ?? 1);
    const teach = a.teacher != null ? teacherMul(value(a.teacher), L, a.good || 0) : 1;
    if (teach > 1) { x *= teach; tags.push('teacher'); }
    if (L >= reach) { x *= PAST_REACH; tags.push('past your talent\'s reach'); }
    const st = band(DYN.streak, s.streak); if (st !== 1) { x *= st; tags.push(disciplineWord(s.streak)); }
    if (ctx.rival && ctx.rival.skill === k) { const gap = wordOf(ctx.rival.lv) - wordOf(s.lv); if (gap >= 1) { x *= DYN.rivalAhead; tags.push('a rival ahead'); } else if (gap === 0) { x *= DYN.rivalNear; tags.push('a rival'); } }
    if (s.fresh > age) { x *= DYN.fresh; tags.push('a new place'); }
    if (deliberate.has(k) && (a.q === 'practice' || a.q === 'drill')) { const f = DYN.focus[Math.min(DYN.focus.length - 1, deliberate.size)]; if (f !== 1) { x *= f; tags.push('hours shared'); } }
    if (needs.rest != null && needs.rest < 30) { x *= DYN.restLow; tags.push('short of rest'); }
    if (needs.purpose != null) { if (needs.purpose > 70) { x *= DYN.purposeHigh; tags.push('a purpose'); } else if (needs.purpose < 30) { x *= DYN.purposeLow; tags.push('no purpose'); } }
    if (needs.company != null && SOCIAL.has(SKILL[k].group)) { if (needs.company > 60) x *= DYN.companyHigh; else if (needs.company < 25) { x *= DYN.companyLow; tags.push('alone too long'); } }
    if (needs.comfort != null && needs.comfort < 25) { x *= DYN.comfortLow; tags.push('cold and hungry'); }
    if (s.sp.length && a.spec !== undefined && !s.sp.includes(a.spec)) { x *= DYN.outsideSpecialism; tags.push('outside your specialism'); }
    // a teacher's lessons alone stop at the top of the word under him
    if (a.q === 'drill' && a.teacher != null && (s.lv > wordOf(a.teacher) * STEPS || (s.lv === wordOf(a.teacher) * STEPS && s.xp >= cost(s.lv)))) { x = 0; if (!s.capSaid) { s.capSaid = true; rec(p, age, k, 'stall', `${SKILL[k].name}: ${a.who || 'your teacher'} has no more to teach you`); } }
    // rust first: while under its best a skill comes back five times as fast
    if (s.rust > 0 && x > 0) {
      const back = Math.min(s.rust, x / XP_UNIT * CURVE.A * Math.exp(-L / CURVE.S) * REGAIN);
      s.rust -= back; p.ledger.push({ age: Math.round(age * 100) / 100, k, xp: 0, back: Math.round(back * 100) / 100, why: 'coming back: ' + a.why, tags: ['rust returning'] });
      if (s.rust <= 0.01) { s.rust = 0; rec(p, age, k, 'rust', `${SKILL[k].name} is sharp again`); }
      x = 0;
    }
    if (s.lv === 0 && x > 0) rec(p, age, k, 'born', `${SKILL[k].name}: first tried (${a.why})`);
    s.xp += x; s.used = age; led(p, age, k, x, a.why, tags);
    const T = touched[k] || (touched[k] = { q: 0, why: a.why, x: 0, trig: [], teacherHolds: false });
    const iq = a.q === 'stretch' ? (a.failed ? (p.proud ? INSIGHT.quality.failed * INSIGHT.proudFail : INSIGHT.quality.failed) : INSIGHT.quality.stretch) : a.q === 'work' ? (q <= 0.1 ? INSIGHT.quality.workPast : INSIGHT.quality.work) : INSIGHT.quality[a.q];
    if (iq > T.q) T.q = iq; if (x >= T.x) { T.x = x; T.why = a.why; }
    if (a.trigger) T.trig.push([a.trigger, a.why]);
    if (a.teacher != null) { T.teacher = Math.max(T.teacher || 0, a.teacher); T.who = a.who; }
    // a stretch at the next word's level, succeeded, proves you (it counts once you stand at the edge)
    if (a.q === 'stretch' && !a.failed && atEdge(s) && (a.d ?? 0) >= s.lv + 1) { s.proved = true; s.proofWhy = a.why; }
    // kin skills that lag are pulled along
    let n = 0;
    for (const j in SKILL[k].kin) {
      const o = p.sk[j]; if (!o || o.lv === 0 || o.lv >= s.lv || atEdge(o) || n++ >= DYN.kinMax) continue;
      const spill = x * SKILL[k].kin[j]; if (spill > 0.05) { o.xp += spill; led(p, age, j, spill, `carried over from ${SKILL[k].name}`, ['kin']); (touched[j] = touched[j] || { q: 0, why: `carried over from ${SKILL[k].name}`, x: 0, trig: [], kinOnly: true }); }
    }
  }
  // discipline: a streak of months, halved after a season away
  for (const k in p.sk) {
    const s = p.sk[k];
    if (touched[k] && !touched[k].kinOnly) { s.streak++; s.gap = 0; s.slipSaid = false; }
    else if (s.streak > 0 && ++s.gap >= DYN.slipAfter) { if (s.streak >= 24 && !s.slipSaid) { s.slipSaid = true; rec(p, age, k, 'slip', `${SKILL[k].name}: your discipline slipped, a season away`); } s.streak = Math.floor(s.streak / 2); s.gap = 0; }
  }
  // insight and breakthroughs, for the skills worked this month, in a fixed order
  for (const k of Object.keys(touched).sort()) {
    const T = touched[k], s = sk(p, k); if (T.kinOnly) { settle(p, k, age, T.why); continue; }
    const open = openConcepts(p, k);
    if (open.length) {
      const w = wordOf(s.lv) + 1, holds = T.teacher != null && wordOf(T.teacher) >= w;
      let pr = INSIGHT.base * band(INSIGHT.streak, s.streak) * T.q;
      if (holds) pr *= p.proud ? INSIGHT.teacherHoldsProud : INSIGHT.teacherHolds;
      if (s.fresh > age) pr *= INSIGHT.fresh;
      if (ctx.quiet) pr *= INSIGHT.quiet; else if ((needs.rest ?? 50) >= 70) pr *= INSIGHT.rested;
      if (ctx.weary || (needs.rest ?? 50) < 30) pr *= INSIGHT.weary;
      if (ctx.despair) pr *= INSIGHT.despair;
      if (ctx.overtrained) pr *= INSIGHT.overtrained;
      pr = Math.min(INSIGHT.max, pr);
      for (const c of open) {
        const nd = need(p, k, c), roll = p.rng();       // one draw a concept a month, always, so the stream never shifts
        if (nd === Infinity || roll >= pr) continue;
        s.ins[c.id] = (s.ins[c.id] || 0) + 1;
        if (s.ins[c.id] >= nd) grasp(p, k, c, age, 'grasp', `${SKILL[k].name}: you have ${c.name} now (${nd <= 1 ? 'it came at once' : 'a slow dawn'}; ${holds ? (T.who || 'your teacher') + ' showed it' : T.why})`);
      }
      // breakthroughs: the month's moments, each a chance; a master who holds the concept is a moment every month
      const moments = T.trig.slice(); if (holds) moments.push(['word', `a word from ${T.who || 'your teacher'}`]); if (ctx.quiet && s.streak >= 24) moments.push(['quiet', 'a quiet season after long work']);
      for (const [trig, what] of moments) {
        const left = openConcepts(p, k); const roll = p.rng(); if (!left.length) continue;
        // the concept nearest to coming is the one that breaks; a blind spot only when nothing else is left
        const ranked = left.map(c => [c, need(p, k, c)]).sort((a, b) => (a[1] === Infinity) - (b[1] === Infinity) || (s.ins[b[0].id] || 0) / b[1] - (s.ins[a[0].id] || 0) / a[1]);
        const [c, nd] = ranked[0];
        const ch = BREAK.base * BREAK.trigger[trig] * Math.sqrt(TALENT[p.talent[k] || 'C'][0]) * (nd === Infinity ? BREAK.blind : 1) * (p.proud ? BREAK.proud : 1);
        if (roll >= ch) continue;
        const gift = cost(s.lv);
        grasp(p, k, c, age, 'breakthrough', `${SKILL[k].name}, a breakthrough: ${what}; you see ${c.name} at last`);
        s.xp += gift; led(p, age, k, gift, 'a breakthrough: ' + what, ['breakthrough']);
        if (ranked[1] && ranked[1][1] !== Infinity && p.rng() < BREAK.neighbour) s.ins[ranked[1][0].id] = Math.max(s.ins[ranked[1][0].id] || 0, Math.ceil(ranked[1][1] / 2));
        break;
      }
    }
    settle(p, k, age, T.why);
  }
}

// once a year: disuse (the standard's §3.10), in points under the level; a fifth of each year's rust is lost for good
export function year(p, age) {
  for (const k in p.sk) {
    const s = p.sk[k]; if (!s.lv || s.used == null) continue;
    const idle = age - s.used, grace = graceYears(k, value(s.best), p.memory);
    if (idle <= grace) continue;
    const n = Math.floor(idle - grace), step = RUST_STEP[Math.min(RUST_STEP.length - 1, n)];
    const bw = wordOf(s.best), floor = Math.max(1, EDGE[Math.max(0, bw - 1)], value(s.best) - 15);
    const loss = Math.max(0, Math.min(step, reads(p, k) - floor)); if (loss <= 0) continue;
    if (s.rust === 0) rec(p, age, k, 'rust', `Rusty: ${SKILL[k].name}, unused ${Math.round(idle)} years`);
    s.rust += loss * (1 - PERMANENT);
    // the part that never returns comes off the experience, and may cost a step
    let lost = loss * PERMANENT * XP_UNIT / (CURVE.A * Math.exp(-value(s.lv) / CURVE.S));
    led(p, age, k, -lost, `unused ${Math.round(idle)} years`, ['rust']);
    while (lost > 0 && s.lv > 1) { if (s.xp >= lost) { s.xp -= lost; lost = 0; } else { lost -= s.xp; s.lv--; s.xp = cost(s.lv); } }
    s.streak = 0;
  }
}

// what the page would say of a skill, in words (the Profile row and its sheet)
export function describe(p, k, age) {
  const s = sk(p, k), open = openConcepts(p, k), c = cost(s.lv);
  const bar = s.lv >= MAX_LV ? 'the top' : s.xp >= c ? 'full' : ['just begun', 'some way', 'about half way', 'most of the way', 'nearly there'][Math.min(4, Math.floor(5 * s.xp / c))];
  return { level: levelName(s.lv), lv: s.lv, reads: Math.round(reads(p, k)), bar, stored: s.st > 0 ? Math.min(STEPS, Math.ceil(STEPS * s.st / Math.max(1, totalTo(Math.min(MAX_LV, s.lv + 1 + STEPS)) - totalTo(s.lv + 1)))) : 0,
    discipline: disciplineWord(s.streak), rusty: s.rust > 0, concepts: open.map(x => `${x.name}: ${graspWord(s.ins[x.id] || 0, need(p, k, x), s.stallAt != null ? age - s.stallAt : 0)}`) };
}
