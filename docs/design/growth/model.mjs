// G0: the growth standard as a small, pure, runnable model (docs/design/growth-standard.md, part 3).
//
// Not game code. It is the reference the builders of G1/G2 and D11+ port into the engine, and the source of every
// proposed number, curve and worked-example table in the standard: `node docs/design/growth/lives.mjs` prints the
// tables, `node docs/design/growth/chart.mjs` draws curves.svg. Change a number here and both follow.
//
// Deterministic: no Math.random, no clock. Every change of a skill or a stat is written to the person's ledger with
// its cause, so the model itself proves "nothing without reason": the sum of the ledger is the change.

// ---- the eight words (growth.md §2.2; G2's GD.SKILL_WORDS) -----------------------------------------------------------
export const WORDS = [[1, 'Beginner'], [15, 'Intermediate'], [35, 'Advanced'], [55, 'Expert'], [72, 'Master'], [88, 'Grandmaster'], [96, 'Legend']];
export const wordOf = L => { let w = ''; for (const [t, n] of WORDS) if (L >= t) w = n; return w || '(untried)'; };
export const wordIndex = L => { let i = -1; WORDS.forEach(([t], j) => { if (L >= t) i = j; }); return i; };

// ---- 1. the curve of practice: points per unit of effort fall as the level rises (power law of practice) ------------
// One unit of effort (EU) is one month of steady, purposeful practice by an ordinary (C) adult with no teacher.
// L(EU) = 21.6 ln(1 + EU / 12): Intermediate in a year, Advanced in four, Expert in about ten, Master in about
// twenty-five of full-time drilled work; so the gain per EU at level L is R(L) = 1.8 e^(-L/21.6): a Beginner gains
// about thirty times what a Master gains for the same month. Grandmaster (88) would take an ordinary talent some sixty
// years, so it is in practice for the gifted (A, S) with masters to learn from, as growth.md §2.2 wants.
export const CURVE = { A: 1.8, S: 21.6 };
export const R = L => CURVE.A * Math.exp(-L / CURVE.S);
export const levelAfter = eu => CURVE.S * Math.log(1 + eu / (CURVE.S / CURVE.A));

// ---- 2. talent (growth.md §10, owner order 38): growth multiplier and how far ordinary effort reaches ----------------
export const TALENT = { F: [0.5, 35], E: [0.7, 55], D: [0.85, 72], C: [1.0, 80], B: [1.15, 88], A: [1.35, 96], S: [1.8, 101], SSS: [3.0, 101] };
// past the reach every gain is quartered (growth.md §1.4: "not a wall")
export const PAST_REACH = 0.25;

// ---- 3. practice quality: what kind of effort it was --------------------------------------------------------------
// work      the same task again (a village smith's horseshoes): half pace up to what the work demands, then almost nothing
// practice  practice on your own, with no one to correct you
// drill     deliberate practice: a set aim, feedback, the weak point worked (a master's drill, the yard under a sergeant)
// stretch   a task above your level under real stakes (a hard commission, a fight with a better blade, a disputation):
//           the further above, the more it teaches, up to 1.8; a failure at a stretch teaches a third more
export const QUALITY = { work: 0.5, workPast: 0.08, practice: 0.8, drill: 1.0, stretchBase: 1.0, stretchPer: 0.04, stretchMax: 1.8, failMore: 1.3 };
export function quality(a, L) {
  if (a.q === 'work') return L < (a.demand ?? 30) ? QUALITY.work : QUALITY.workPast;
  if (a.q === 'practice') return QUALITY.practice;
  if (a.q === 'drill') return QUALITY.drill;
  if (a.q === 'stretch') {
    const q = Math.min(QUALITY.stretchMax, QUALITY.stretchBase + QUALITY.stretchPer * Math.max(0, (a.d ?? L) - L));
    return a.failed ? q * QUALITY.failMore : q;
  }
  return 0.5;
}

// ---- 4. the teacher: counts by the gap in words, and takes you to one word under their own ---------------------------
// two words above you: x1.4 (x1.6 at three or more); one word above: x1.15, polish inside your word but not past it;
// your word or below: nothing. A good teacher (a patient temper, a teaching art) adds up to a fifth more.
export function teacherMul(teacherL, L, good = 0) {
  if (teacherL == null) return 1;
  const gap = wordIndex(teacherL) - wordIndex(L);
  const base = gap >= 3 ? 1.6 : gap === 2 ? 1.4 : gap === 1 ? 1.15 : 1;
  return base * (gap >= 1 ? 1 + 0.2 * good : 1);
}
// the most a teacher's lessons alone can carry you: the top of the word under theirs
export const teacherCap = teacherL => { const i = wordIndex(teacherL); return i <= 0 ? 0 : WORDS[i][0] - 0.5; };

// ---- 5. age: how well one learns each kind of thing at each age (sensitive periods) ----------------------------------
export const KIND = {
  motor: ['melee', 'sword', 'axe', 'spear', 'dagger', 'dualwield', 'shield', 'unarmed', 'lance', 'mounted', 'bow', 'xbow', 'throwing', 'riding', 'athletics', 'stealth', 'craft', 'music', 'sea', 'husbandry'],
  tongue: ['lang'],
  lore: ['learning', 'medicine', 'faith', 'trade', 'stewardship', 'logistics', 'siegecraft', 'survival', 'tracking', 'gambling'],
  judgement: ['command', 'tactics', 'diplomacy', 'intrigue', 'persuasion', 'etiquette', 'deception', 'intimidation'],
};
export const kindOf = k => Object.keys(KIND).find(x => KIND[x].includes(k)) || 'lore';
export const LEARN_AGE = {
  motor: [[0, 0.1], [4, 0.3], [6, 0.6], [8, 0.9], [10, 1.15], [16, 1.15], [20, 1.05], [25, 1.0], [35, 0.85], [45, 0.7], [55, 0.55], [65, 0.4], [80, 0.3]],
  tongue: [[0, 1.0], [2, 1.8], [10, 1.6], [17, 1.2], [25, 0.8], [40, 0.6], [60, 0.5], [80, 0.4]],
  lore: [[0, 0.1], [4, 0.25], [8, 0.6], [12, 0.9], [16, 1.05], [18, 1.1], [30, 1.05], [50, 1.0], [60, 0.9], [70, 0.75], [85, 0.6]],
  judgement: [[0, 0.1], [6, 0.3], [12, 0.6], [16, 0.75], [20, 0.85], [25, 0.95], [30, 1.0], [60, 1.0], [70, 0.9], [85, 0.75]],
};
export const interp = (pts, x) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0); }
  return pts[pts.length - 1][1];
};
export const learnAge = (k, age) => interp(LEARN_AGE[kindOf(k)], age);

// ---- 6. the month's condition: fatigue, overtraining, health, spirits -----------------------------------------------
// extra sessions in one month give less and less: 1, 0.7, 0.45, 0.25 (and add load); weary x0.85; hurt x0.6..1;
// in low spirits x0.88; overtrained (load above what you carry for two months running) x0.5 until a month's rest
export const SESSIONS = [1, 0.7, 0.45, 0.25];

// ---- 7. trials: the word changes only on a deed (plateau, then a leap) ----------------------------------------------
// From Expert up, a word is crossed by a deed fit for it (growth.md §2.2 already asks one for Grandmaster and Legend).
// Effort that would carry you past the edge is stored, up to HELD_MAX points, and lands at once with the deed, plus
// one point for the deed itself. The page says what is stored ("ready for more than you have shown"). Any stretch at
// or above the edge that succeeds, once you are ready (two points stored), is such a deed: a commission, a fight, a
// case; Grandmaster and Legend ask more (growth.md §2.2: witnesses, a judged work, room in the world).
export const GATES = [55, 72, 88, 96];
export const HELD_MAX = 5;

// ---- 8. disuse: rust that returns quickly, and a little that never does ---------------------------------------------
// Years before an unused skill rusts, by word, and by kind; Memory stretches it up to half again (growth.md §2.7)
export const GRACE = { below: 5, expert: 8, master: 12 };
export const GRACE_KIND = { motor: 1.5, tongue: 0.8, lore: 1.0, judgement: 1.5 };
export const RUST_STEP = [1, 2, 3];        // points the first, second, third and later rusty years
export const REGAIN = 5;                    // rust comes back five times as fast as it went
export const PERMANENT = 0.2;               // a fifth of each year's rust never returns (a skill unused for life does shrink)
export function graceYears(k, best, memory = 1) {
  const base = best >= 88 ? Infinity : best >= 72 ? GRACE.master : best >= 55 ? GRACE.expert : GRACE.below;
  return base * GRACE_KIND[kindOf(k)] * Math.min(1.5, Math.max(1, memory));
}

// ---- 9. the body: each stat's own curve over a life, as a share of the person's own grown peak ----------------------
// Untrained, human years; another people is read through its own growing years and its own old age (grown, old).
export const AGE_CURVE = {
  str: [[0, 0.05], [6, 0.2], [10, 0.3], [12, 0.38], [14, 0.5], [16, 0.66], [18, 0.8], [20, 0.9], [24, 0.97], [28, 1], [35, 1], [40, 0.97], [45, 0.94], [50, 0.9], [55, 0.85], [60, 0.79], [65, 0.72], [70, 0.64], [75, 0.55], [80, 0.46], [90, 0.32]],
  spd: [[0, 0.1], [6, 0.45], [10, 0.6], [12, 0.68], [14, 0.78], [16, 0.88], [18, 0.95], [21, 0.99], [24, 1], [27, 1], [30, 0.98], [35, 0.95], [40, 0.91], [45, 0.87], [50, 0.83], [55, 0.78], [60, 0.73], [65, 0.67], [70, 0.6], [75, 0.52], [80, 0.44], [90, 0.3]],
  sta: [[0, 0.1], [6, 0.45], [10, 0.6], [14, 0.75], [16, 0.83], [18, 0.9], [21, 0.96], [25, 1], [32, 1], [35, 0.98], [40, 0.95], [45, 0.92], [50, 0.88], [55, 0.84], [60, 0.79], [65, 0.73], [70, 0.65], [75, 0.56], [80, 0.47], [90, 0.33]],
  ins: [[0, 0.15], [4, 0.4], [8, 0.6], [12, 0.75], [16, 0.9], [19, 0.98], [22, 1], [30, 1], [40, 0.97], [50, 0.93], [60, 0.87], [70, 0.79], [80, 0.69], [90, 0.58]],
  int: [[0, 0.1], [3, 0.35], [6, 0.55], [10, 0.72], [14, 0.85], [18, 0.95], [22, 1], [45, 1], [55, 0.98], [65, 0.94], [72, 0.89], [80, 0.82], [90, 0.72]],
  wil: [[0, 0.3], [6, 0.5], [12, 0.7], [16, 0.82], [20, 0.9], [30, 1], [70, 1], [80, 0.95], [90, 0.88]],
  looks: [[0, 0.7], [12, 0.8], [16, 0.92], [20, 1], [28, 1], [35, 0.95], [45, 0.86], [55, 0.76], [65, 0.64], [75, 0.52], [90, 0.4]],
};
// human-equivalent age for a people with its own growing years and old age (human: grown 20, old 50 -> the identity)
export function humanAge(age, race = { grown: 20, old: 50 }) {
  if (age <= race.grown) return age * 20 / race.grown;
  return 20 + (age - race.grown) * 30 / (race.old - race.grown);
}
export const ageCurve = (s, age, race) => interp(AGE_CURVE[s], humanAge(age, race));

// trainability of the body by age: a child's drilling buys skill and coordination, little strength; most after puberty
export const TRAIN_AGE = [[0, 0], [6, 0.2], [10, 0.3], [13, 0.6], [16, 0.9], [18, 1], [35, 1], [45, 0.8], [55, 0.65], [65, 0.5], [80, 0.35]];
// conditioning T (1 = untrained) moves toward the ceiling, slower near it, with no floor; each idle month loses a share
// of what is above 1 (endurance first); below the best you have held, it comes back twice as fast ("muscle memory")
export const COND = { ceil: { str: 1.7, spd: 1.18, sta: 1.6, ins: 1.15, int: 1.25, wil: 1.4 }, rate: 0.035, regain: 2,
  idle: { str: 0.025, spd: 0.03, sta: 0.06, ins: 0.015, int: 0.01, wil: 0.005 } };

// ---- the person -----------------------------------------------------------------------------------------------------
export function person({ name, talent = {}, statTalent = {}, memory = 1, race } = {}) {
  return { name, talent, statTalent, memory, race, L: {}, held: {}, proved: {}, best: {}, rust: {}, used: {}, T: { str: 1, spd: 1, sta: 1, ins: 1, int: 1, wil: 1 }, Tbest: {}, ledger: [], hurt: {} };
}
const log = (p, age, key, amt, why) => { if (Math.abs(amt) > 1e-9) p.ledger.push({ age, key, amt, why }); };
export const tal = (p, k) => TALENT[p.talent[k] || 'C'];

// one effort: a = { skill, eu, q, demand?, teacher?, good?, d?, failed?, why, session? }
export function effort(p, a, age, cond = 1) {
  const k = a.skill, L0 = p.L[k] || 0;
  // rust first: while under the best, practice comes back five times as fast
  if ((p.rust[k] || 0) > 0) {
    const back = Math.min(p.rust[k], R(L0) * a.eu * REGAIN * learnAge(k, age) * cond);
    p.rust[k] -= back; p.L[k] = L0 + back; log(p, age, k, back, 'coming back: ' + a.why); p.used[k] = age; return back;
  }
  const [m, reach] = tal(p, k);
  let g = R(L0) * a.eu * quality(a, L0) * teacherMul(a.teacher, L0, a.good) * m * learnAge(k, age) * cond * (SESSIONS[a.session || 0] ?? 0.2);
  if (L0 >= reach) g *= PAST_REACH;
  // a teacher's lessons alone stop one word under the teacher
  if (a.q === 'drill' && a.teacher != null && a.teacherOnly !== false) g = Math.max(0, Math.min(g, teacherCap(a.teacher) - L0));
  let L1 = L0 + g;
  // trials: past an edge only with its deed; the rest is stored
  for (const t of GATES) if (L0 < t && L1 >= t && !(p.proved[k] || {})[t]) {
    const over = L1 - (t - 0.5);
    p.held[k] = Math.min(HELD_MAX, (p.held[k] || 0) + over); L1 = t - 0.5; break;
  }
  p.L[k] = L1; p.best[k] = Math.max(p.best[k] || 0, L1); p.used[k] = age;
  log(p, age, k, L1 - L0, a.why);
  // a stretch at or past the edge, succeeded, when ready: the deed itself
  const edge = GATES.find(t => L1 < t && L1 >= t - 1);
  if (edge != null && edge < 88 && a.q === 'stretch' && !a.failed && (a.d ?? 0) >= edge && (p.held[k] || 0) >= 2) deed(p, k, age, a.why);
  return L1 - L0;
}
// a deed fit for the word above: the edge opens, and what was stored lands at once
export function deed(p, k, age, why) {
  const L0 = p.L[k] || 0, t = GATES.find(g => L0 < g && L0 >= g - 3);
  if (t == null) return 0;   // not ready: a deed far above you teaches as a stretch does, through effort()
  (p.proved[k] = p.proved[k] || {})[t] = age;
  const leap = 0.5 + (p.held[k] || 0) + 1;
  p.held[k] = 0; p.L[k] = L0 + leap; p.best[k] = Math.max(p.best[k] || 0, p.L[k]);
  log(p, age, k, leap, 'a deed: ' + why);
  return leap;
}
// once a year: disuse
export function year(p, age) {
  for (const k in p.L) {
    const idle = age - (p.used[k] ?? age);
    const grace = graceYears(k, p.best[k] || 0, p.memory);
    if (idle <= grace) continue;
    const n = Math.floor(idle - grace);
    const step = RUST_STEP[Math.min(RUST_STEP.length - 1, n)];
    // never more than one word down, and never more than a word's width (15 points) below the best held
    const floor = Math.max(1, WORDS[Math.max(0, wordIndex(p.best[k]) - 1)][0], (p.best[k] || 0) - 15);
    const loss = Math.max(0, Math.min(step, p.L[k] - floor));
    if (loss <= 0) continue;
    p.L[k] -= loss; p.rust[k] = (p.rust[k] || 0) + loss * (1 - PERMANENT);
    log(p, age, k, -loss, `unused ${Math.round(idle)} years`);
  }
}
// a month of the body: training intensity per stat (0..1.5), idle stats detrain
export function bodyMonth(p, age, train = {}, cond = 1) {
  for (const s in p.T) {
    const c = p.T[s], ceil = COND.ceil[s] * (TALENT[p.statTalent[s] || 'C'][0] ** 0.5);
    const i = train[s] || 0;
    if (i > 0) {
      const regain = c < (p.Tbest[s] || 1) ? COND.regain : 1;
      const g = COND.rate * i * cond * interp(TRAIN_AGE, humanAge(age, p.race)) * TALENT[p.statTalent[s] || 'C'][0] * regain * Math.max(0, (ceil - c) / (ceil - 1));
      p.T[s] = Math.min(ceil, c + g * (ceil - 1));
      p.Tbest[s] = Math.max(p.Tbest[s] || 1, p.T[s]);
    } else if (c > 1) p.T[s] = 1 + (c - 1) * (1 - COND.idle[s]);
  }
}
// what a stat reads at an age, as a share of an untrained grown person of one's people (1 = the middle)
export const statAt = (p, s, age) => ageCurve(s, age, p.race) * p.T[s] * (1 - (p.hurt[s] || 0));
// C9's body gate (999997-bodies BD.BASE): the word a skill can be used at, given the ratio of its first stat
export const BODY_BASE = [[30, 0.65], [45, 0.78], [60, 0.88], [75, 1.0], [88, 1.08], [100, 1.15]];
export function carried(L, r) { for (const [t, need] of BODY_BASE) if (L >= t && r < need) return t - 0.01; return L; }

// ---- today, for comparison (src/core/release/core/03-engine-base.js A.trainSkill, A.ageFactor via 49-body-mind) ------
export const todayR = (L, cap = 100) => Math.max(0.05, Math.pow(Math.max(0, 1 - L / (cap + 10)), 1.5));
export function todayAge(s, age) {
  // the release's growth curve (A.yearGrowth target / 0.78) to 20, then flat, then the straight fall from 0.85 x old
  const grow = age < 20 ? (0.08 + 0.62 * Math.pow(age / 20, 1.1)) / 0.7 : 1;
  if (s === 'wil') return grow;
  if (s === 'int') return age > 57.5 ? grow * Math.max(0.6, 1 - (age - 57.5) / 60) : grow;
  const k = { str: 1, spd: 1.2, sta: 1, ins: 0.5 }[s] || 1;
  return age < 42.5 ? grow : Math.max(0.35, 1 - k * (age - 42.5) / 57.5 * 0.8);
}
