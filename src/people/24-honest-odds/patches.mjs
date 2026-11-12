// Honest duel odds: the person view's "would usually beat you" line uses the calibrated A.shownDuelOdds.
export default [
  {
    id: 'ODDS-VSYOU',
    blob: 'ardan-core',
    why: 'UI.vsYou showed 100/(1+e^(-d/12)) on the worth gap, which understated real duel odds by up to 15 points (79% shown where ' +
      'duels went 88-93%). It now shows 100 - A.shownDuelOdds(pc, p), fitted on 2,100 lethal duels (scale 6.1).',
    edits: [[
      'const d=A.fightWorth(p)-A.fightWorth(pc),pct=Math.round(100/(1+Math.exp(-d/12))),word=',
      'const pct=Math.round(100-A.shownDuelOdds(pc,p)),word=',
    ]],
  },
];
