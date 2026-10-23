// One scale for every stat: a check's difficulty means the same whichever stat the scene names.
//
// The house scale says d 45 is typical (CLAUDE.md), and A.checkOdds gives 50% where your value meets d. Your value is
// 0.6 x the first side and 0.4 x the second, each a skill or a stat. But the six stats do not sit on one scale. The
// typical seasoned adult (75-fair-checks' reference, measured in bot lives) has will 56, insight 38, strength 36,
// intellect 33, stamina 31 and speed 30. So a scene that asks "speed and stamina, d 45" asks a typical grown person for
// 15 points they do not have (26%), and "will and insight, d 45" gives the same person 56%. Writers pick a stat for its
// flavour (wits to think it through, nerve to hold), not for its odds, and nothing tells them that int is a hard stat.
// In bot lives, intrigue and intellect wins 24% of the time, intellect and insight 14%, strength and will 8%.
//
// The rule (A.checkOdds, event checks that are not fights): on each side of the check that names a stat, the difficulty
// drops by that side's weight times the shortfall of a typical seasoned adult's stat from the scale's 45:
//   d' = d - sum over stat sides of  weight x max(0, 45 - REF[stat])
// A side that names a skill is left alone: a seasoned adult's typical skill (37) still falls short of 45, and that gap is
// what training is for. Will, where the typical adult already stands above 45, is not made harder than written. The
// rule reads only the check, not the person, so it composes with 75-fair-checks (which brings each stage of life to the
// seasoned adult): this brings the seasoned adult's stats to the house scale. Fights (check.fight) are left alone.
const SC = A.SCALE = A.SCALE || {};
SC.OFF = false;
SC.TARGET = 45;
SC.W = [0.6, 0.4];
SC.NAME = { str: 'strength', spd: 'speed', ins: 'insight', sta: 'stamina', int: 'intellect', wil: 'will' };
// the typical seasoned adult: 75-fair-checks' measured reference when it is in the build, else the same numbers
SC.REF_FALLBACK = { str: 36, spd: 30, ins: 38, sta: 31, int: 33, wil: 56 };
SC.SKILLS = false;
// a skill side as A.checkVal counts it for the typical seasoned adult: the typical asked skill, or the untrained floor
SC.refSkill = function (k) { const F = A.FC, R = (F && F.TYP && F.TYP[F.REF]); return R && F.side ? F.side(R, k) : 37; };
SC.ref = function () { const F = A.FC; return (F && F.TYP && F.TYP[F.REF]) || SC.REF_FALLBACK; };
// how much the scale takes off this check's difficulty, side by side (pure; reads only the check)
SC.parts = function (check) {
  if (SC.OFF || !check || typeof check !== 'object' || check.fight || !check.s) return [];
  const R = SC.ref(), out = [], sides = [check.s, check.s2 || check.s];
  sides.forEach((k, i) => {
    const stat = GD.STATS.includes(k);
    if (!stat && !(SC.SKILLS && GD.SKILLS[k])) return;
    const typ = stat ? R[k] : SC.refSkill(k);
    if (typ == null) return;
    const off = SC.W[i] * Math.max(0, SC.TARGET - typ);
    if (off > 0) out.push({ k, typ, off, stat });
  });
  return out;
};
SC.shift = check => SC.parts(check).reduce((a, x) => a + x.off, 0);
// what a typical seasoned adult brings to this check, as A.checkVal counts it (before the rule)
SC.refVal = function (check) {
  const R = SC.ref(), side = k => (GD.STATS.includes(k) ? R[k] : SC.refSkill(k));
  return SC.W[0] * side(check.s) + SC.W[1] * side(check.s2 || check.s);
};
SC.label = check => `One scale for every check: a typical seasoned adult brings ${Math.round(SC.refVal(check))} to this, not ${SC.TARGET}, so the scene asks ${Math.round(SC.shift(check))} less`;

// Same pattern as 75-fair-checks: set the difficulty on the same check object for the length of the call (inner
// wrappers find their choice by that object), then put the written one back. The number shown is the number rolled.
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

// The odds popover (59-tooltips) names the rule in a row of its own, so its rows still add up to the number on the button.
if (UI.TT && typeof UI.TT.checkParts === 'function') {
  const parts0 = UI.TT.checkParts;
  UI.TT.checkParts = function (p, ck, ctx, shown, evId) {
    const S = parts0.apply(this, arguments);
    try {
      if (!S || !Array.isArray(S.parts) || !p || !ck || SC.OFF) return S;
      const P = SC.parts(ck); if (!P.length) return S;
      // this rule's share with 75-fair-checks' rule off, so that its row (computed with this one on) and this one add up
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
