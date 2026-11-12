// The odds popover (59-tooltips) names the rule: its rows add up to the number on the button, and the rule's share is a
// row of its own ("Your stage of life"), not "Other things in play". Pure: it reads A.checkOdds with the rule on and off.
if (UI.TT && typeof UI.TT.checkParts === 'function') {
  const FC = A.FC, parts0 = UI.TT.checkParts;
  FC.BAND_WORD = { child: 'child', teen: 'youth', adult1: 'young adult', adult2: 'grown adult', adult3: 'seasoned adult', old: 'old person' };
  UI.TT.checkParts = function (p, ck, ctx, shown, evId) {
    const S = parts0.apply(this, arguments);
    try {
      if (!S || !Array.isArray(S.parts) || !p || !ck || ck.fight || FC.OFF) return S;
      const ex = FC.explain(p, ck);
      if (!(ex.dEff < ex.d)) return S;
      const on = A.checkOdds(p, ck);
      FC.OFF = true; let off; try { off = A.checkOdds(p, ck); } finally { FC.OFF = false; }
      const mine = on - off; if (!mine) return S;
      const label = UI.esc(`Your stage of life: a typical ${FC.BAND_WORD[ex.band] || ex.band} brings ${Math.round(ex.tv)} to this, a seasoned adult ${Math.round(ex.ref)}, so the scene asks ${Math.round(ex.dEff)} of you, not ${ex.d}`);
      const i = S.parts.findIndex(x => /^Other things in play$/.test(x[0]));
      if (i >= 0) {
        const rest = S.parts[i][1] - mine;
        S.parts.splice(i, 1, [label, mine]);
        if (Math.abs(rest) >= 0.5) S.parts.push(['Other things in play', rest]);
      } else S.parts.push([label, mine]);
    } catch (e) { console.error('fair-checks tip', e); }
    return S;
  };
}
