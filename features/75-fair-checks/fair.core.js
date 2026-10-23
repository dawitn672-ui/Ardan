// Fair checks: a scene asks of you what it would ask of a seasoned adult, measured against your stage of life.
//
// The house scale says a check of difficulty 45 is "typical" (CLAUDE.md), and A.checkOdds gives 50% where your value
// (0.6 x the first skill or stat + 0.4 x the second; an untrained skill counts 4 + 0.3 x your mean stat) meets d.
// In bot lives that holds for a seasoned adult (a human of 38-50: 47% of checks won), but the same scenes are met at
// 16, when a typical life has a skill of about 15 where it will later have 37: 26% won. Children and teens fare no
// better (31%, 33%). Over a whole life only 38% of checks succeed (the release: 38.4%), and a quarter sit under 15%.
//
// The rule (A.checkOdds, event checks that are not fights):
//   tv  = the check's value for a typical person of your stage of life (FC.TYP, measured in bot lives)
//   ref = the same for a typical seasoned adult (FC.REF)
//   d'  = max(min(d, tv), d - max(0, ref - tv))
// The difficulty drops by the gap between a seasoned adult and a typical person of your stage, so the scene is as hard
// for a typical 16-year-old as for a typical 45-year-old; but never below what a typical person of your stage brings, so
// a scene already written for children is not made easier than even. Nothing changes for a seasoned adult or for the
// old where they have kept what they learned (an old person's strength fades, and checks on it ease by that much).
// Your own place against the typical stays: a skill you never trained, a wound, or fading strength still give long odds.
// Fights (check.fight, 48-fight-ladder) roll on fighting worth and are left alone. The number shown is the number rolled:
// A.eventChoose rolls A.checkOdds.
const FC = A.FC = {};
FC.OFF = false;
FC.BANDS = ['child', 'teen', 'adult1', 'adult2', 'adult3', 'old'];
// a life's band: the stage (A.stage), with adulthood cut in thirds of the race's years from adult to old
FC.band = function (p) {
  const st = A.stage(p);
  if (st === 'infant') return 'child';
  if (st !== 'adult') return st;
  const R = GD.RACES[p.race] || GD.RACES.human, f = (A.age(p) - R.adult) / Math.max(1, R.old - R.adult);
  return f < 1 / 3 ? 'adult1' : f < 2 / 3 ? 'adult2' : 'adult3';
};
// FC.TYP[band]: the median of each stat (A.stat) and of the skill a check asks (A.skillEff) at the checks bot lives met,
// by band: 64 lives of bench/run.mjs's league on the round-7 full build (5,655 checks; features/75-fair-checks/bench.mjs).
FC.TYP = {
  child: { str: 14, spd: 13, ins: 15, sta: 16, int: 15, wil: 17, skill: 2 },     // 588 checks
  teen: { str: 26, spd: 23, ins: 29, sta: 27, int: 29, wil: 31, skill: 8 },      // 401
  adult1: { str: 32, spd: 30, ins: 37, sta: 32, int: 32, wil: 39, skill: 15 },   // 1,843
  adult2: { str: 38, spd: 30, ins: 38, sta: 33, int: 33, wil: 45, skill: 27 },   // 921
  adult3: { str: 36, spd: 30, ins: 38, sta: 31, int: 33, wil: 56, skill: 37 },   // 793
  old: { str: 28, spd: 20, ins: 36, sta: 23, int: 32, wil: 65, skill: 49 },      // 1,109
};
FC.REF = 'adult3';
FC.mean = T => (T.str + T.spd + T.ins + T.sta + T.int + T.wil) / 6;
// a typical person's value on one side of a check, as A.checkVal counts it
FC.side = (T, k) => (GD.STATS.includes(k) ? (T[k] != null ? T[k] : FC.mean(T)) : Math.max(T.skill, 4 + FC.mean(T) * 0.3));
FC.typVal = (T, check) => FC.side(T, check.s) * 0.6 + FC.side(T, check.s2 || check.s) * 0.4;
// the difficulty a check asks of this person (pure)
FC.dFor = function (pc, check) {
  const d = check.d || 45;
  if (FC.OFF || !pc || !pc.st || !check || check.fight || !check.s) return d;
  const T = FC.TYP[FC.band(pc)], R = FC.TYP[FC.REF];
  if (!T || !R) return d;
  const tv = FC.typVal(T, check), gap = Math.max(0, FC.typVal(R, check) - tv);
  return Math.max(Math.min(d, tv), d - gap);
};
// what the rule did, for a test or a tooltip: { d, dEff, band, tv, ref }
FC.explain = function (pc, check) {
  const T = FC.TYP[FC.band(pc)], R = FC.TYP[FC.REF];
  return { d: check.d || 45, dEff: Math.round(FC.dFor(pc, check) * 10) / 10, band: FC.band(pc), tv: T ? Math.round(FC.typVal(T, check) * 10) / 10 : null, ref: R ? Math.round(FC.typVal(R, check) * 10) / 10 : null };
};
// The wrapped A.checkOdds reads the same check object with its difficulty set for the call (30-get-to-know adds a
// scene's own shift to it, and 67-memory-weave finds the choice by the check object, so it must be the same object),
// then puts the written difficulty back. Nothing outside the call sees the change.
const checkOdds = A.checkOdds;
A.checkOdds = function (pc, check) {
  if (!check || typeof check !== 'object' || check.fight || FC.OFF) return checkOdds.apply(this, arguments);
  let dEff;
  try { dEff = FC.dFor(pc, check); } catch (e) { console.error('fair-checks', e); return checkOdds.apply(this, arguments); }
  const had = Object.prototype.hasOwnProperty.call(check, 'd'), d0 = check.d;
  if (dEff === (d0 || 45)) return checkOdds.apply(this, arguments);
  check.d = dEff;
  try { return checkOdds.apply(this, arguments); }
  finally { if (had) check.d = d0; else delete check.d; }
};
