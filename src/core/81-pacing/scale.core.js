// One scale for every stat: a check's difficulty means the same whichever stat the scene names.
//
// The house scale says d 45 is typical (CLAUDE.md), and A.checkOdds gives 50% where your value meets d. Your value is
// 0.6 x the first side and 0.4 x the second, each a skill or a stat. But the six stats do not sit on one scale. The
// typical seasoned adult (75-fair-checks' reference, measured in bot lives) has will 56, insight 38, strength 36,
// intellect 33, stamina 31 and speed 30. So the same "d 45" is 26% for that person on speed and stamina and 56% on will
// and insight. Writers pick a stat for its flavour (wits to think it through, nerve to hold), not for its odds, and
// nothing on the scale tells them that intellect is a hard stat and will an easy one. In bot lives intrigue and
// intellect won 24% of the time, intellect and insight 14%, strength and will 8%; diplomacy and will 60%.
//
// The rule (A.checkOdds, event checks that are not fights): on each side of the check that names a stat, the difficulty
// drops by that side's weight times the typical seasoned adult's shortfall in that stat from the scale's 45:
//   d' = d - sum over the stat sides of  weight x max(0, 45 - REF[stat])
// A d 45 test of speed then asks of a typical adult's speed what a d 45 test of will asks of their will.
// A side that names a skill is left alone: a seasoned adult's typical asked skill (37) still falls short of 45, and that
// gap is what training is for. (Lifting it too, so that a typical adult meets every d 45 at even odds, was tried: the
// league's check success went from 51% to 61%, past the scorecard's 55, because it lifts every long shot.)
// Will, where the typical adult stands above 45, is not made harder than written. The rule reads only the check, never
// the person, so your own place against the typical stays: weak stats, a wound or an untrained skill still give long odds.
// It composes with 75-fair-checks, which brings each stage of life to the seasoned adult (75 sees the eased d): this
// brings the seasoned adult's stats to the house scale. Fights (check.fight, 48-fight-ladder) are left alone.
const SC = A.SCALE = A.SCALE || {};
SC.OFF = false;
SC.TARGET = 45;
SC.W = [0.6, 0.4];
SC.NAME = { str: 'strength', spd: 'speed', ins: 'insight', sta: 'stamina', int: 'intellect', wil: 'will' };
// the typical seasoned adult: 75-fair-checks' measured reference when it is in the build, else the same numbers
SC.REF_FALLBACK = { str: 36, spd: 30, ins: 38, sta: 31, int: 33, wil: 56 };
SC.ref = function () { const F = A.FC; return (F && F.TYP && F.TYP[F.REF]) || SC.REF_FALLBACK; };
SC.applies = check => !SC.OFF && !!check && typeof check === 'object' && !check.fight && !!check.s;
// what the rule takes off, side by side (pure; reads only the check): [{ k, typ, off }]
SC.parts = function (check) {
  if (!SC.applies(check)) return [];
  const R = SC.ref(), out = [];
  [check.s, check.s2 || check.s].forEach((k, i) => {
    if (!GD.STATS.includes(k) || R[k] == null) return;
    const off = SC.W[i] * Math.max(0, SC.TARGET - R[k]);
    if (off > 0) out.push({ k, typ: R[k], off });
  });
  return out;
};
SC.shift = check => SC.parts(check).reduce((a, x) => a + x.off, 0);
SC.label = check => {
  const P = SC.parts(check), seen = new Set();
  const said = P.filter(x => !seen.has(x.k) && seen.add(x.k)).map(x => `a typical grown ${SC.NAME[x.k]} is ${Math.round(x.typ)}`).join(', ');
  return `One scale for every stat: ${said}, not ${SC.TARGET}, so the scene asks ${Math.round(SC.shift(check))} less`;
};

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
