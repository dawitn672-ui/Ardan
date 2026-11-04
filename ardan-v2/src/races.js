// Races are NOT reskinned humans. Each has its own body plan, growth timing, lifespan and limits.
// Units are real: cm, kg, m/s, km/day, ms. "Lift" = heaviest dead weight raised once.
// Ardan's humans can climb far past Earth's records through training, will and breakthroughs:
// the human *limit* is set so a legendary human can meet a giant on equal footing.
export const RACES = {
  human: {
    name: 'Human', adultAge: 21, maxAge: 80, ageScale: 1,
    height: { male: [172, 7], female: [160, 6.5] }, // mean, sd (cm), medieval-ish
    bmi: 22.5,
    // average untrained adult male; females scaled by sexFactor
    base: { lift: 130, sprint: 7.2, march: 28, reaction: 250, toughness: 1.0 },
    sexFactor: { lift: 0.62, sprint: 0.88, march: 0.92, toughness: 0.9 },
    // Earth record ~ 500 kg. Ardan human ceiling is far higher (see TIERS in body.js).
    limit: { lift: 4000, sprint: 22, march: 140, reaction: 70, toughness: 14 },
    mental: { wits: 100, learning: 100, judgment: 100, will: 100, presence: 100, cunning: 100 },
    lifeStageNames: ['infant', 'child', 'youth', 'adult', 'elder'],
  },
  orc: {
    name: 'Orc', adultAge: 16, maxAge: 60, ageScale: 0.78,
    height: { male: [198, 8], female: [186, 7] }, bmi: 30,
    base: { lift: 290, sprint: 7.6, march: 38, reaction: 245, toughness: 1.9 },
    sexFactor: { lift: 0.8, sprint: 0.95, march: 0.97, toughness: 0.95 },
    limit: { lift: 5200, sprint: 20, march: 150, reaction: 85, toughness: 18 },
    mental: { wits: 95, learning: 88, judgment: 92, will: 112, presence: 102, cunning: 96 },
  },
  dwarf: {
    name: 'Dwarf', adultAge: 35, maxAge: 240, ageScale: 1.65,
    height: { male: [138, 5], female: [131, 5] }, bmi: 34,
    base: { lift: 230, sprint: 5.8, march: 36, reaction: 265, toughness: 1.7 },
    sexFactor: { lift: 0.85, sprint: 0.95, march: 0.97, toughness: 0.95 },
    limit: { lift: 4400, sprint: 14, march: 130, reaction: 90, toughness: 17 },
    mental: { wits: 102, learning: 112, judgment: 108, will: 115, presence: 95, cunning: 98 },
  },
  elf: {
    name: 'Elf', adultAge: 45, maxAge: 700, ageScale: 2.1,
    height: { male: [183, 6], female: [175, 6] }, bmi: 19.5,
    base: { lift: 105, sprint: 8.4, march: 34, reaction: 200, toughness: 0.85 },
    sexFactor: { lift: 0.8, sprint: 0.96, march: 0.97, toughness: 0.95 },
    limit: { lift: 2600, sprint: 24, march: 160, reaction: 55, toughness: 10 },
    mental: { wits: 110, learning: 115, judgment: 106, will: 104, presence: 108, cunning: 104 },
  },
  giant: {
    name: 'Giant', adultAge: 40, maxAge: 400, ageScale: 1.9,
    height: { male: [560, 40], female: [520, 35] }, bmi: 24,
    // square-cube law: ~3.3x human height -> ~10x muscle cross-section, ~36x mass. Slow to react.
    base: { lift: 2600, sprint: 11, march: 60, reaction: 420, toughness: 14 },
    sexFactor: { lift: 0.88, sprint: 0.97, march: 0.97, toughness: 0.95 },
    limit: { lift: 14000, sprint: 18, march: 140, reaction: 220, toughness: 40 },
    mental: { wits: 96, learning: 104, judgment: 110, will: 108, presence: 104, cunning: 88 },
  },
  halfOrc: {
    name: 'Half-orc', adultAge: 18, maxAge: 70, ageScale: 0.88,
    height: { male: [186, 8], female: [173, 7] }, bmi: 26,
    base: { lift: 200, sprint: 7.5, march: 33, reaction: 248, toughness: 1.4 },
    sexFactor: { lift: 0.72, sprint: 0.92, march: 0.95, toughness: 0.92 },
    limit: { lift: 4600, sprint: 21, march: 145, reaction: 75, toughness: 16 },
    mental: { wits: 98, learning: 94, judgment: 96, will: 106, presence: 98, cunning: 98 },
  },
};

// Height as a fraction of adult height by (race-scaled) age. From WHO/CDC median growth curves.
const H_MALE = [0.285, 0.43, 0.495, 0.545, 0.585, 0.625, 0.66, 0.693, 0.727, 0.756, 0.784, 0.81, 0.846, 0.886, 0.93, 0.965, 0.983, 0.994, 1];
const H_FEMALE = [0.30, 0.454, 0.528, 0.583, 0.626, 0.669, 0.706, 0.742, 0.779, 0.816, 0.847, 0.883, 0.926, 0.963, 0.982, 0.994, 1, 1, 1];

export function humanAge(race, age) { return age / RACES[race].ageScale; }

export function heightFraction(race, sex, age) {
  const a = Math.max(0, humanAge(race, age));
  const t = sex === 'female' ? H_FEMALE : H_MALE;
  if (a >= t.length - 1) return 1;
  const i = Math.floor(a), f = a - i;
  return t[i] + (t[i + 1] - t[i]) * f;
}

// Physical maturity (strength/speed/endurance) by race-scaled age: rises through youth,
// peaks mid-20s to early 30s, then declines slowly and then faster. Same shape for all races, stretched.
export function physicalMaturity(race, age) {
  const a = humanAge(race, age);
  const pts = [[0, 0.03], [2, 0.08], [5, 0.17], [8, 0.27], [10, 0.34], [12, 0.43], [14, 0.57], [16, 0.74], [18, 0.86], [21, 0.95], [25, 1], [32, 1], [40, 0.95], [50, 0.85], [60, 0.7], [70, 0.52], [80, 0.36], [95, 0.2]];
  return interp(pts, a);
}
// Reaction time multiplier (lower is better): children and elders are slow.
export function reactionAgeFactor(race, age) {
  const a = humanAge(race, age);
  return interp([[0, 4], [4, 2.2], [8, 1.5], [12, 1.2], [16, 1.05], [20, 1], [30, 1], [45, 1.08], [60, 1.22], [75, 1.45], [90, 1.8]], a);
}
// Mental maturity: wits and judgment grow until adulthood; judgment keeps growing with years lived.
export function mentalMaturity(race, age) {
  const a = humanAge(race, age);
  return interp([[0, 0.1], [3, 0.35], [6, 0.55], [10, 0.72], [14, 0.85], [18, 0.95], [22, 1], [60, 1], [75, 0.92], [90, 0.8]], a);
}
export function judgmentAgeBonus(race, age) {
  const a = humanAge(race, age);
  return interp([[0, -40], [8, -25], [14, -14], [18, -8], [25, 0], [40, 6], [60, 10], [80, 8]], a);
}
function interp(pts, x) {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
  }
  return pts[pts.length - 1][1];
}
