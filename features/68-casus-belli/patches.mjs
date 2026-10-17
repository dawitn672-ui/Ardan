// Two hooks. Everything else is in the *.core.js files (wrappers and event hooks). See README.md.
export default [
  {
    id: 'CB-WAR-ODDS',
    blob: 'ardan-core',
    why: 'A.aiWarCheck: a crown that plans revenge for a line of its feud ledger, or a war for its realm\'s want, ' +
      'waits for its moment and then strikes (casus.core.js). Three hooks: the war preview of a planned target counts ' +
      'that target at 60% while its host is away at another war (A.cbPreview, in place of A.warPreview); a want ' +
      'presses on the opinion bar the way a claim does (A.cbPress, beside the claims term); and one more factor in the ' +
      'odds product (A.cbWarMul): up to x9 on the planned target when the moment is good, x0.5 while it is not, x0.5 ' +
      'on any other neighbour while a plan stands, x1 to x4 (by temper) on a neighbour remembered for an old wrong or wanted ' +
      'by a crown with no plan, and 0 on a realm the crown owes an honoured debt. In the source: ' +
      'the same three terms in the war-chance calculation.',
    edits: [
      ['if(rel>A.aiWarBar(r.id)||A.hostile(r.id,o.id))continue;const P=A.warPreview(r.id,o.id);',
        'if(rel>A.aiWarBar(r.id)||A.hostile(r.id,o.id))continue;const P=A.cbPreview?A.cbPreview(r.id,o.id):A.warPreview(r.id,o.id);'],
      ['A.claimsOn(r.id,o.id).length*12-(cb?10:0);', 'A.claimsOn(r.id,o.id).length*12-(cb?10:0)-(A.cbPress?A.cbPress(r.id,o.id):0);'],
      ['p*=A.feudWarMul?A.feudWarMul(r.id,o.id):1,', 'p*=A.feudWarMul?A.feudWarMul(r.id,o.id):1,p*=A.cbWarMul?A.cbWarMul(r.id,o.id,P):1,'],
    ],
  },
  {
    id: 'CB-WAR-ROOM',
    blob: 'ardan-core',
    why: 'UI.wrWars: each war in the war room shows why it began, the casus belli recorded when it was declared ' +
      '(UI.csWarLine, w.casus). In the source: one line under the sides of each war.',
    edits: [
      ['<b>vs</b> ${theirs.map(A.realmShort).join(", ")}</div>', '<b>vs</b> ${theirs.map(A.realmShort).join(", ")}</div>${UI.csWarLine?UI.csWarLine(w):""}'],
    ],
  },
];
