// One hook: the AI's war odds against a neighbour read the feud ledger (c-feuds.core.js, A.feudWarMul). The ledger
// already reaches A.aiWarCheck through A.relBetween (A.memSum is wrapped), which decides whether war is thinkable;
// this adds the choice of target: among its neighbours, a ruler with an old grudge goes for the one it holds it against,
// and an old debt stays its hand.
export default [
  {
    id: 'BONDS-FEUD-WAR',
    blob: 'ardan-core',
    why: 'A.aiWarCheck: after the rivalry factor, multiply the odds of declaring war on a neighbour by A.feudWarMul(attacker, target): ' +
      'up to x1.6 (x2.1 for a wrathful ruler) against a realm the attacker holds a generational grudge against (a capital taken, a ' +
      'heartland lost, a betrayal), down to x0.4 toward one it owes a debt. In the source: one more factor in the war-chance product.',
    edits: [[
      'r.rivals.includes(o.id)&&(p*=1.5),o.playerRun&&(p*=.8)',
      'r.rivals.includes(o.id)&&(p*=1.5),p*=A.feudWarMul?A.feudWarMul(r.id,o.id):1,o.playerRun&&(p*=.8)',
    ]],
  },
];
