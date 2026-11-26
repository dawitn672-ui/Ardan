// The growth standard's pieces that the skill model stands on (docs/design/growth-standard.md part 3; D-067, D-070),
// ported from docs/design/growth/model.mjs without change: the curve of practice, talent and its reach, the quality of
// an effort, the teacher, the learner's age by kind, the month's sessions, and disuse. Plain module: no DOM, no A, no
// dice. src/people/engine/skills.js imports it; tests/v2/skills.test.js runs both.

// the seven bands' edges on the scale (S1's; their names left everything a player reads at the skills rebuild's switch)
export const BAND_EDGES = [1, 15, 35, 55, 72, 88, 96];
export const wordIndex = L => { let i = -1; BAND_EDGES.forEach((t, j) => { if (L >= t) i = j; }); return i; };

// 1. the curve of practice: one unit of effort at level L is worth R(L) = 1.8 e^(-L/21.6) points
export const CURVE = { A: 1.8, S: 21.6 };
export const R = L => CURVE.A * Math.exp(-L / CURVE.S);

// 2. talent (growth.md §10): growth multiplier and how far ordinary effort reaches; past the reach a gain is quartered
export const TALENT = { F: [0.5, 35], E: [0.7, 55], D: [0.85, 72], C: [1.0, 80], B: [1.15, 88], A: [1.35, 96], S: [1.8, 101], SSS: [3.0, 101] };
export const PAST_REACH = 0.25;

// 3. the quality of an effort: work, practice, drill, stretch
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

// 4. the teacher: by the gap in words; a good teacher (a patient temper) adds up to a fifth
export function teacherMul(teacherL, L, good = 0) {
  if (teacherL == null) return 1;
  const gap = wordIndex(teacherL) - wordIndex(L);
  const base = gap >= 3 ? 1.6 : gap === 2 ? 1.4 : gap === 1 ? 1.15 : 1;
  return base * (gap >= 1 ? 1 + 0.2 * good : 1);
}

// 5. age: how well one learns each kind of thing at each age
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

// 6. the month's condition: a second, third, fourth session in one month gives less
export const SESSIONS = [1, 0.7, 0.45, 0.25];

// 8. disuse: years of grace by the best word held and by kind; rust returns five times as fast; a fifth never returns
export const GRACE = { below: 5, expert: 8, master: 12 };
export const GRACE_KIND = { motor: 1.5, tongue: 0.8, lore: 1.0, judgement: 1.5 };
export const RUST_STEP = [1, 2, 3];
export const REGAIN = 5;
export const PERMANENT = 0.2;
