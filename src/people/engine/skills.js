// Skills with levels and experience (S1b; docs/design/skills.md, D-072): the model, ported from
// docs/design/skills/model.mjs, which stays the reference. Levels (seven words of five steps), experience at the
// standard's price, concepts a person must grasp to pass into a word, breakthroughs at named moments, proof from
// Expert up, stored experience that lands as a leap, discipline, rivals, a new place, needs, kin skills, hours shared,
// specialisms, and disuse. Every change is written to the person's ledger with its cause, every turning point to the
// record.
//
// Plain module: no DOM, no A. It takes a person record, the data (setData) and the person's own rand function, and
// returns what changed in the record, the ledger and the record of turning points. A person's need for a concept is a
// hash of (world seed, person, concept), so it costs no save data and never draws from the world's stream.
//
// The game's store (src/people/36-skills) keeps the player's skills in exactly this shape (p.sk[k]) and calls month()
// and year(); other people go by the closed form at the end (npcYear, graspedBy).
import { CURVE, TALENT, PAST_REACH, quality, teacherMul, LEARN_AGE, interp, GRACE, GRACE_KIND, RUST_STEP, REGAIN, PERMANENT } from './growth.js';

export { TALENT };
export let DATA = null;
export let SKILL = {};
const CONCEPT_WORD = {};       // concept id -> word index, per skill
const CONCEPTS_BY = {};        // `${k}|${w}` -> concepts
export function setData(d) {
  DATA = d; SKILL = {};
  for (const s of d.skills) {
    SKILL[s.id] = s;
    for (const c of s.concepts) CONCEPT_WORD[s.id + '|' + c.id] = d.words.indexOf(c.word);
    for (let w = 0; w < d.words.length; w++) CONCEPTS_BY[s.id + '|' + w] = s.concepts.filter(c => d.words.indexOf(c.word) === w);
  }
  return d;
}

// ---- 1. levels: seven words of five steps (35 levels); Myth is for the dead ------------------------------------------
export const WORDS = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master', 'Grandmaster', 'Legend'];
export const EDGE = [1, 15, 35, 55, 72, 88, 96, 101];
export const STEPS = 5, MAX_LV = WORDS.length * STEPS;
export const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
export const wordOf = lv => (lv <= 0 ? -1 : Math.floor((lv - 1) / STEPS));
export const stepOf = lv => (lv <= 0 ? 0 : ((lv - 1) % STEPS) + 1);
export const levelName = lv => (lv <= 0 ? 'untried' : `${WORDS[wordOf(lv)]} ${ROMAN[stepOf(lv) - 1]}`);
export function value(lv) {
  if (lv <= 0) return 0;
  const w = wordOf(lv);
  return EDGE[w] + (stepOf(lv) - 1) * (EDGE[w + 1] - EDGE[w]) / STEPS;
}
export const VALUES = Array.from({ length: MAX_LV + 1 }, (_, lv) => value(lv));
// the highest level whose value is at or under v (binary search over the 36 values: hot, read on every check)
export function levelOfValue(v) {
  if (!(v >= 1 - 1e-9)) return 0;
  let lo = 1, hi = MAX_LV;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (VALUES[mid] <= v + 1e-9) lo = mid; else hi = mid - 1; }
  return lo;
}
// the first level of a word (0 Beginner .. 6 Legend)
export const firstOf = w => w * STEPS + 1;

// ---- 2. experience: ten for a month of steady drill; each level costs more, by the standard's practice curve ---------
export const XP_UNIT = 10;
const COSTS = [];
export function cost(lv) {
  if (lv >= MAX_LV) return Infinity;
  if (COSTS[lv] !== undefined) return COSTS[lv];
  const k = XP_UNIT * CURVE.S / CURVE.A;
  return (COSTS[lv] = Math.max(1, Math.round(k * (Math.exp(value(lv + 1) / CURVE.S) - Math.exp(value(lv) / CURVE.S)))));
}
const TOTALS = [0];
export const totalTo = lv => { lv = Math.min(lv, MAX_LV); while (TOTALS.length <= lv) TOTALS.push(TOTALS[TOTALS.length - 1] + cost(TOTALS.length - 1)); return TOTALS[lv]; };

// ---- 3. deterministic chance ---------------------------------------------------------------------------------------
export function hash(str) { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return (h ^ (h >>> 16)) >>> 0; }
export const unit = str => (hash(str) + 0.5) / 4294967296;
export const normal = str => Math.sqrt(-2 * Math.log(unit(str + '|a'))) * Math.cos(2 * Math.PI * unit(str + '|b'));
export function stream(seed) { let a = hash(seed); return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---- 4. concepts and grasp (growth-standard §3.16) -------------------------------------------------------------------
// The owner's dials (docs/design/skills.md §11 item 2): NEED and BLIND. Tuned against s1Census, never by a cap.
export const NEED = [0, 2, 4, 10, 18, 28, 40];
export const NEED_SPREAD = 1.5;
export const BLIND = { F: 0.20, E: 0.12, D: 0.08, C: 0.05, B: 0.035, A: 0.02, S: 0.01, SSS: 0 };
export const BLIND_WORD = [0, 0.2, 0.4, 1, 1.2, 1.5, 2];
export const conceptsOf = (k, w) => CONCEPTS_BY[k + '|' + w] || [];
export const conceptWord = (k, c) => CONCEPT_WORD[k + '|' + c.id];
// need is pure; a person record may carry needMemo (a Map) so a session works it out once per concept
export function need(p, k, c) {
  const forced = p.grasp && p.grasp[c.id];
  if (forced === 'blind') return Infinity;
  if (forced === 'easy') return 1;
  const memo = p.needMemo, mk = memo ? k + '|' + c.id : null;
  if (memo && memo.has(mk)) return memo.get(mk);
  const w = conceptWord(k, c), t = (p.talent && p.talent[k]) || 'C', key = `${p.seed}|${p.id}|${k}|${c.id}`;
  let n;
  if (unit(key + '|blind') < BLIND[t] * BLIND_WORD[w]) n = Infinity;
  else {
    const gift = p.gift && p.gift[k] != null ? p.gift[k] : normal(`${p.seed}|${p.id}|${k}|gift`);
    const z = 0.65 * gift + 0.75 * normal(key);
    n = Math.max(1, Math.round(NEED[w] * Math.pow(2, NEED_SPREAD * z) / TALENT[t][0]));
  }
  if (memo) { if (memo.size > 600) memo.clear(); memo.set(mk, n); }
  return n;
}
// the word the page shows for a concept: never a number
export function graspWord(ins, nd, years) {
  if (ins >= nd) return 'grasped';
  if (nd === Infinity) return years >= 5 ? 'it does not come' : 'dark';
  const f = ins / nd;
  return f <= 0 ? 'dark' : f < 1 / 3 ? 'dim' : f < 2 / 3 ? 'clearer' : 'close';
}

export const INSIGHT = {
  base: 0.18,
  streak: [[6, 0.6], [24, 1.0], [60, 1.3], [Infinity, 1.6]],
  quality: { work: 0.4, workPast: 0.15, practice: 0.8, drill: 1.0, stretch: 1.4, failed: 1.8 },
  teacherHolds: 1.6, teacherHoldsProud: 1.15,
  fresh: 1.5,
  quiet: 1.5, rested: 1.2,
  weary: 0.7, despair: 0.5, overtrained: 0.5, proudFail: 0.55,
  max: 0.85,
};
export const BREAK = {
  base: 0.025,
  trigger: { defeat: 1.5, neardeath: 1.5, feat: 1.2, rival: 1.2, newland: 0.8, watch: 0.6, quiet: 0.5, word: 0.12 },
  blind: 0.12,
  proud: 0.6,
  neighbour: 0.2,
};
// the owner's choices (docs/design/skills.md §11), each one named constant
export const STORE_RATE = 0.5;   // §11 item 3: effort at an edge without the grasp is stored at half
export const PROOF_FROM = 3;     // §11 item 4: from Expert (word 3) up, the crossing needs a proving moment

// ---- 5. what moves with the life ------------------------------------------------------------------------------------
export const DYN = {
  streak: [[6, 0.9], [24, 1.0], [60, 1.1], [Infinity, 1.2]],
  slipAfter: 3,
  rivalNear: 1.15, rivalAhead: 1.25,
  fresh: 1.1, freshMonths: 12,
  focus: [1, 1, 0.85, 0.7, 0.55],
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
export const blank = () => ({ lv: 0, xp: 0, st: 0, proved: false, best: 0, rust: 0, used: null, streak: 0, gap: 0, fresh: -1, ins: {}, got: {}, sp: [] });
export const sk = (p, k) => p.sk[k] || (p.sk[k] = blank());
const led = (p, age, k, xp, why, tags) => { if (Math.abs(xp) > 1e-9) p.ledger.push({ age: Math.round(age * 100) / 100, k, xp, why, tags: tags || [] }); };
// what was earned and is gone (the half not stored at an edge, the store full, the top reached): its own ledger line,
// so the ledger's sum always equals what was gained, stored and lost (s1Ledger)
const lostLine = (p, age, k, x, why) => { if (x > 1e-9) p.ledger.push({ age: Math.round(age * 100) / 100, k, xp: 0, lost: x, why, tags: ['lost'] }); };
const rec = (p, age, k, kind, text) => p.rec.push({ age: Math.floor(age), k, kind, text });
export const reads = (p, k) => { const s = p.sk[k]; return s ? Math.max(0, value(s.lv) - s.rust) : 0; };

export const openConcepts = (p, k) => { const s = sk(p, k), w = wordOf(s.lv) + 1; return w >= 1 && w < WORDS.length ? conceptsOf(k, w).filter(c => s.got[c.id] == null) : []; };
export const atEdge = s => s.lv > 0 && stepOf(s.lv) === STEPS && s.lv < MAX_LV;
// the room the store has: up to the whole next word
export const storeRoom = s => Math.max(0, totalTo(Math.min(MAX_LV, s.lv + 1 + STEPS)) - totalTo(s.lv + 1) - s.st);

export function grasp(p, k, c, age, how, text) {
  const s = sk(p, k); s.got[c.id] = Math.floor(age); delete s.ins[c.id];
  rec(p, age, k, how, text);
  for (const other of DATA.sharedConcepts[c.id] || []) if (other !== k && p.sk[other] && p.sk[other].got[c.id] == null) {
    const nd = need(p, other, SKILL[other].concepts.find(x => x.id === c.id));
    if (nd !== Infinity) p.sk[other].ins[c.id] = Math.max(p.sk[other].ins[c.id] || 0, Math.ceil(nd / 2));
  }
}
export function settle(p, k, age, why) {
  const s = sk(p, k);
  for (;;) {
    if (s.lv >= MAX_LV) { lostLine(p, age, k, s.xp, 'nothing above Legend'); s.xp = 0; break; }
    const c = cost(s.lv);
    if (s.xp < c) break;
    if (atEdge(s)) {
      const w = wordOf(s.lv) + 1, missing = openConcepts(p, k);
      const barred = missing.length || (w >= PROOF_FROM && !s.proved);
      if (barred) {
        const over = s.xp - c, room = storeRoom(s);
        const kept = Math.min(room, over * (missing.length ? STORE_RATE : 1));
        s.st += kept; s.xp = c;
        lostLine(p, age, k, over - kept, missing.length ? 'stored at half: a concept not grasped' : 'the store is full');
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
//   good, d (the task's level 1-35), failed, why, trigger, spec, holds (false: the teacher does not hold the concept) }]
// ctx: { cond, needs: { rest, company, purpose, comfort } (0-100), weary, despair, overtrained, quiet, rival: { skill, lv },
//   fresh: [skills made new this month], wound }
export function month(p, age, acts = [], ctx = {}) {
  const needs = ctx.needs || {}, touched = {}, deliberate = new Set(acts.filter(a => a.q === 'practice' || a.q === 'drill').map(a => a.skill));
  for (const k of ctx.fresh || []) sk(p, k).fresh = age + DYN.freshMonths / 12;
  for (const a of acts) {
    const k = a.skill, s = sk(p, k), L = reads(p, k), t = p.talent[k] || 'C', [tm, reach] = TALENT[t];
    const tags = [];
    let q = quality({ q: a.q, demand: a.demand != null ? value(a.demand) : undefined, d: a.d != null ? value(a.d) : undefined, failed: a.failed }, L);
    let x = XP_UNIT * a.eu * q * tm * learnAge(k, age) * (ctx.cond ?? 1);
    if (a.mul != null && a.mul !== 1) { x *= a.mul; if (a.mulTag) tags.push(a.mulTag); }
    if (a.q === 'work' && q < 0.1) tags.push('asks nothing new');
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
    if (a.q === 'drill' && a.teacher != null && (s.lv > wordOf(a.teacher) * STEPS || (s.lv === wordOf(a.teacher) * STEPS && s.xp >= cost(s.lv)))) { x = 0; if (!s.capSaid) { s.capSaid = true; rec(p, age, k, 'stall', `${SKILL[k].name}: ${a.who || 'your teacher'} has no more to teach you`); } }
    if (s.rust > 0 && x > 0) {
      const back = Math.min(s.rust, x / XP_UNIT * CURVE.A * Math.exp(-L / CURVE.S) * REGAIN);
      s.rust -= back; p.ledger.push({ age: Math.round(age * 100) / 100, k, xp: 0, back: Math.round(back * 100) / 100, why: 'coming back: ' + a.why, tags: ['rust returning'] });
      if (s.rust <= 0.01) { s.rust = 0; rec(p, age, k, 'rust', `${SKILL[k].name} is sharp again`); }
      x = 0;
    }
    if (s.lv === 0 && !(s.xp > 0) && x > 0) rec(p, age, k, 'born', `${SKILL[k].name}: first tried (${a.why})`);
    if (x < 0) x = 0;
    s.xp += x; s.used = age; led(p, age, k, x, a.why, tags);
    const T = touched[k] || (touched[k] = { q: 0, why: a.why, x: 0, trig: [], teacherHolds: false });
    const iq = a.q === 'stretch' ? (a.failed ? (p.proud ? INSIGHT.quality.failed * INSIGHT.proudFail : INSIGHT.quality.failed) : INSIGHT.quality.stretch) : a.q === 'work' ? (q <= 0.1 ? INSIGHT.quality.workPast : INSIGHT.quality.work) : INSIGHT.quality[a.q];
    if (iq > T.q) T.q = iq; if (x >= T.x) { T.x = x; T.why = a.why; }
    if (a.trigger) T.trig.push([a.trigger, a.why]);
    if (a.teacher != null) { T.teacher = Math.max(T.teacher || 0, a.teacher); T.who = a.who; if (a.holds === false) T.noHold = true; }
    if (a.q === 'stretch' && !a.failed && atEdge(s) && (a.d ?? 0) >= s.lv + 1) { s.proved = true; s.proofWhy = a.why; }
    let n = 0;
    for (const j in SKILL[k].kin) {
      const o = p.sk[j]; if (!o || o.lv === 0 || o.lv >= s.lv || atEdge(o) || n++ >= DYN.kinMax) continue;
      const spill = x * SKILL[k].kin[j]; if (spill > 0.05) { o.xp += spill; led(p, age, j, spill, `carried over from ${SKILL[k].name}`, ['kin']); (touched[j] = touched[j] || { q: 0, why: `carried over from ${SKILL[k].name}`, x: 0, trig: [], kinOnly: true }); }
    }
  }
  for (const k in p.sk) {
    const s = p.sk[k];
    if (touched[k] && !touched[k].kinOnly) { s.streak++; s.gap = 0; s.slipSaid = false; }
    else if (s.streak > 0 && ++s.gap >= DYN.slipAfter) { if (s.streak >= 24 && !s.slipSaid) { s.slipSaid = true; rec(p, age, k, 'slip', `${SKILL[k].name}: your discipline slipped, a season away`); } s.streak = Math.floor(s.streak / 2); s.gap = 0; }
  }
  for (const k of Object.keys(touched).sort()) {
    const T = touched[k], s = sk(p, k); if (T.kinOnly) { settle(p, k, age, T.why); continue; }
    const open = openConcepts(p, k);
    if (open.length) {
      const w = wordOf(s.lv) + 1, holds = T.teacher != null && !T.noHold && wordOf(T.teacher) >= w;
      let pr = INSIGHT.base * band(INSIGHT.streak, s.streak) * T.q;
      if (holds) pr *= p.proud ? INSIGHT.teacherHoldsProud : INSIGHT.teacherHolds;
      if (s.fresh > age) pr *= INSIGHT.fresh;
      if (ctx.quiet) pr *= INSIGHT.quiet; else if ((needs.rest ?? 50) >= 70) pr *= INSIGHT.rested;
      if (ctx.weary || (needs.rest ?? 50) < 30) pr *= INSIGHT.weary;
      if (ctx.despair) pr *= INSIGHT.despair;
      if (ctx.overtrained) pr *= INSIGHT.overtrained;
      if (ctx.insightMul) pr *= ctx.insightMul;
      pr = Math.min(INSIGHT.max, pr);
      for (const c of open) {
        const nd = need(p, k, c), roll = p.rng();
        if (nd === Infinity || roll >= pr) continue;
        s.ins[c.id] = (s.ins[c.id] || 0) + 1;
        if (s.ins[c.id] >= nd) grasp(p, k, c, age, 'grasp', `${SKILL[k].name}: you have ${c.name} now (${nd <= 1 ? 'it came at once' : 'a slow dawn'}; ${holds ? (T.who || 'your teacher') + ' showed it' : T.why})`);
      }
      const moments = T.trig.slice(); if (holds) moments.push(['word', `a word from ${T.who || 'your teacher'}`]); if (ctx.quiet && s.streak >= 24) moments.push(['quiet', 'a quiet season after long work']);
      for (const [trig, what] of moments) {
        const left = openConcepts(p, k); const roll = p.rng(); if (!left.length) continue;
        const ranked = left.map(c => [c, need(p, k, c)]).sort((a, b) => (a[1] === Infinity) - (b[1] === Infinity) || (s.ins[b[0].id] || 0) / b[1] - (s.ins[a[0].id] || 0) / a[1]);
        const [c, nd] = ranked[0];
        const ch = (trig === 'sure' ? 1 : BREAK.base * (BREAK.trigger[trig] || 1) * Math.sqrt(TALENT[p.talent[k] || 'C'][0]) * (nd === Infinity ? BREAK.blind : 1) * (p.proud ? BREAK.proud : 1));
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
  return touched;
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
    let lost = loss * PERMANENT * XP_UNIT / (CURVE.A * Math.exp(-value(s.lv) / CURVE.S));
    led(p, age, k, -lost, `unused ${Math.round(idle)} years`, ['rust']);
    while (lost > 0 && s.lv > 1) { if (s.xp >= lost) { s.xp -= lost; lost = 0; } else { lost -= s.xp; s.lv--; s.xp = cost(s.lv); } }
    s.streak = 0;
  }
}

// what the page would say of a skill, in words (the Profile row and its sheet)
export const BAR_WORDS = ['just begun', 'some way', 'about half way', 'most of the way', 'nearly there'];
export function storedSteps(s) { return s.st > 0 ? Math.min(STEPS, Math.ceil(STEPS * s.st / Math.max(1, totalTo(Math.min(MAX_LV, s.lv + 1 + STEPS)) - totalTo(s.lv + 1)))) : 0; }
export function describe(p, k, age) {
  const s = sk(p, k), open = openConcepts(p, k), c = cost(s.lv);
  const bar = s.lv >= MAX_LV ? 'the top' : s.xp >= c ? 'full' : BAR_WORDS[Math.min(4, Math.floor(5 * s.xp / c))];
  return { level: levelName(s.lv), lv: s.lv, reads: Math.round(reads(p, k)), bar, stored: storedSteps(s),
    discipline: disciplineWord(s.streak), rusty: s.rust > 0, concepts: open.map(x => `${x.name}: ${graspWord(s.ins[x.id] || 0, need(p, k, x), s.stallAt != null ? age - s.stallAt : 0)}`) };
}

// ---- 6. other people: the same rules in closed form (docs/design/skills.md §10) -------------------------------------
// The months of insight a person's years of work at a skill would have given at the expected rate, and whether a
// concept has come by then. Pure: no dice; the person's hash decides.
export const NPC_INSIGHT_YEAR = 12 * INSIGHT.base * INSIGHT.quality.work * 1.0;   // a working year's expected months of insight
export function graspedBy(p, k, c, effortYears, teacherHolds = false) {
  const nd = need(p, k, c);
  if (nd === Infinity) {
    // a blind spot opens only by a breakthrough: a per-person hash decides whether one came in these years
    const tries = Math.min(3, Math.floor(effortYears / 10));
    for (let i = 0; i < tries; i++) if (unit(`${p.seed}|${p.id}|${k}|${c.id}|bt${i}`) < BREAK.base * BREAK.blind * 12) return true;
    return false;
  }
  return nd <= effortYears * NPC_INSIGHT_YEAR * (teacherHolds ? INSIGHT.teacherHolds : 1);
}
// the expected experience of a year at a skill, by the same formula (a post's work, a teacher's drill, talent, age)
export function npcYearXp(k, L, age, talent = 'C', { eu = 1, q = 'work', demand, teacher } = {}) {
  const [tm, reach] = TALENT[talent] || TALENT.C;
  let x = 12 * XP_UNIT * eu * quality({ q, demand: demand != null ? value(demand) : undefined }, L) * tm * learnAge(k, age);
  if (teacher != null) x *= teacherMul(value(teacher), L, 0);
  if (L >= reach) x *= PAST_REACH;
  return x;
}
// add experience to a person with one number a skill: lv from the value, xp carried in skx; an edge waits on graspedBy
// (the caller supplies effortYears). Returns the new level.
export function npcGain(p, k, lv, carry, x, effortYears, teacherHolds) {
  let xp = (carry || 0) + Math.max(0, x);
  for (;;) {
    if (lv >= MAX_LV) { xp = 0; break; }
    const c = cost(lv);
    if (xp < c) break;
    if (lv > 0 && stepOf(lv) === STEPS) {
      const w = wordOf(lv) + 1;
      const ok = conceptsOf(k, w).every(cn => graspedBy(p, k, cn, effortYears, teacherHolds));
      if (!ok) { xp = c; break; }
    }
    xp -= c; lv++;
  }
  return { lv, xp };
}
