// One small hook: the person view's "Between you" section shows the shared bond history (UI.bondHist, defined in
// npc-initiative.core.js) right under the opinion bar, before the interaction buttons.
export default [
  {
    id: 'NPCI-BOND-HIST',
    blob: 'ardan-core',
    why: 'Show the shared bond history (pc.rel[id].hist, written by NPC moves, get-to-know and interactions) in the person view under "Between you". In the source: call the history renderer after the opinion/favour row in personModal.',
    edits: [[
      'you owe ${A.owesTo(pc,t.id)}</span>`:""}</div>`,t.alive&&pc.alive){',
      'you owe ${A.owesTo(pc,t.id)}</span>`:""}</div>${UI.bondHist?UI.bondHist(pc,t,r):""}`,t.alive&&pc.alive){',
    ]],
  },
];
