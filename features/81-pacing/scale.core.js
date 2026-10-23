// One scale for every check: d 45 is even odds for a typical seasoned adult, whatever the scene names.
//
// The house scale says d 45 is typical (CLAUDE.md), and A.checkOdds gives 50% where your value meets d. Your value is
// 0.6 x the first side and 0.4 x the second, each a skill or a stat. But what a typical person brings depends on which
// two things the writer named. The typical seasoned adult (75-fair-checks' reference, measured in bot lives) has will
// 56, insight 38, strength 36, intellect 33, stamina 31 and speed 30, and 37 in the skill a scene asks. So the same
// "d 45" is 26% for that person on speed and stamina, 35% on persuasion and intellect, and 49% on persuasion and will.
// Writers pick a stat for its flavour (wits to think it through, nerve to hold), not for its odds, and nothing on the
// scale tells them that intellect is a hard stat and will an easy one. In bot lives intrigue and intellect wins 24% of
// the time, intellect and insight 14%, strength and will 8%; diplomacy and will 60%.
//
// The rule (A.checkOdds, event checks that are not fights):
//   ref = what a typical seasoned adult brings to this check (the same 0.6 / 0.4 sum, from 75's reference person)
//   d'  = d - max(0, 45 - ref)
// A typical seasoned adult then meets any d 45 scene at even odds, and every scene keeps its written distance from 45:
// a d 55 scene is still ten points harder than typical, and a d 35 one ten points easier. A check where the typical
// adult already brings more than 45 (diplomacy and will) is not made harder than written.
// It reads only the check, never the person, so your own place against the typical stays: a skill you trained past 37
// still pays, and one you never trained (4 + 0.3 x your mean stat, about 15) still gives long odds.
// It composes with 75-fair-checks, which brings each stage of life to the seasoned adult (75 sees the eased d): with
// both, a typical person of any age meets d 45 at even odds. Fights (check.fight, 48-fight-ladder) are left alone.
const SC = A.SCALE = A.SCALE || {};
SC.OFF = false;
SC.TARGET = 45;
SC.W = [0.6, 0.4];
// the typical seasoned adult: 75-fair-checks' measured reference when it is in the build, else the same numbers
SC.REF_FALLBACK = { str: 36, spd: 30, ins: 38, sta: 31, int: 33, wil: 56, skill: 37 };
SC.ref = function () { const F = A.FC; return (F && F.TYP && F.TYP[F.REF]) || SC.REF_FALLBACK; };
// one side as A.checkVal counts it for that person: a stat, or the asked skill (never below the untrained floor)
SC.side = function (R, k) {
  if (GD.STATS.includes(k)) return R[k] != null ? R[k] : 0;
  const mean = (R.str + R.spd + R.ins + R.sta + R.int + R.wil) / 6;
  return Math.max(R.skill != null ? R.skill : 37, 4 + mean * 0.3);
};
// what a typical seasoned adult brings to this check (pure; reads only the check)
SC.refVal = function (check) { const R = SC.ref(); return SC.W[0] * SC.side(R, check.s) + SC.W[1] * SC.side(R, check.s2 || check.s); };
SC.applies = check => !SC.OFF && !!check && typeof check === 'object' && !check.fight && !!check.s;
// how much the rule takes off this check's difficulty
SC.shift = function (check) { if (!SC.applies(check)) return 0; const v = SC.refVal(check); return v < SC.TARGET ? SC.TARGET - v : 0; };
SC.label = check => `One scale for every check: a typical seasoned adult brings ${Math.round(SC.refVal(check))} to this, not ${SC.TARGET}, so the scene asks ${Math.round(SC.shift(check))} less`;

// Same pattern as 75-fair-checks: set the difficulty on the same check object for the length of the call (inner
// wrappers find their choice by that object, and 75 reads the eased d), then put the written one back. The number shown
// is the number rolled: A.eventChoose rolls A.checkOdds.
const odds0 = A.checkOdds;
A.checkOdds = function (pc, check) {
  let sh = 0;
  try { sh = SC.shift(check); } catch (e) { console.error('scale', e); sh = 0; }
  if (!sh) return odds0.apply(this, arguments);
  const had = Object.prototype.hasOwnProperty.call(check, 'd'), d0 = check.d;
  check.d = (d0 || 45) - sh;
  try { return odds0.apply(this, arguments); }
  finally { if (had) check.d = d0; else delete check.d; }
};

// The odds popover (59-tooltips) names the rule in a row of its own, so its rows still add up to the number on the
// button. Its share is taken with 75's rule off; 75's own row is taken with this one on, so the two add up. Pure.
if (UI.TT && typeof UI.TT.checkParts === 'function') {
  const parts0 = UI.TT.checkParts;
  UI.TT.checkParts = function (p, ck, ctx, shown, evId) {
    const S = parts0.apply(this, arguments);
    try {
      if (!S || !Array.isArray(S.parts) || !p || !SC.shift(ck)) return S;
      const F = A.FC, fOff = F ? F.OFF : null; let on, off;
      try { if (F) F.OFF = true; on = A.checkOdds(p, ck); SC.OFF = true; off = A.checkOdds(p, ck); }
      finally { SC.OFF = false; if (F) F.OFF = fOff; }
      const mine = on - off; if (!mine) return S;
      const label = UI.esc(SC.label(ck));
      const i = S.parts.findIndex(x => /^Other things in play$/.test(x[0]));
      if (i >= 0) {
        const rest = S.parts[i][1] - mine;
        S.parts.splice(i, 1, [label, mine]);
        if (Math.abs(rest) >= 0.5) S.parts.push(['Other things in play', rest]);
      } else S.parts.push([label, mine]);
    } catch (e) { console.error('scale tip', e); }
    return S;
  };
}
