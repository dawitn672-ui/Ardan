export default [
  {
    id: 'V2S-ROLL',
    blob: 'ardan-core',
    why: 'An event check was one A.chance on the chance A.checkOdds gives. V2 decides every attempt with odds.attempt(): the same chance as its edge, plus blunders (judgment, fatigue, overconfidence) and surges (will under stakes). In the source: call the attempt resolver where eventChoose rolls a check.',
    edits: [['success=A.chance(A.checkOdds(pc,c.check)/100)', 'success=A.V2S.roll(pc,c.check,c)']],
  },
];
