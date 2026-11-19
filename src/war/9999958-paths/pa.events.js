// D11+: the road's own moments. Queued by A.PATHS: pa_trial (the rung's trial, when he stands at the edge of a word and
// wants a proof), pa_spec (the road's specialism, by his way of fighting, when the skill has room for one).
A.defEvents([
  { id: 'pa_trial', title: 'The trial', trigger: true, cool: 1, scene: 'field',
    cond: (p, C) => C.soldier(p),
    setup: (p, ctx) => { if (!p.mil || !ctx.sk || !A.C.ready(p, ctx.sk)) ctx.skip = true; },
    text: 'On {pathT} a man is proved, not counted. Yours is set for the morning: {trialT}. Everyone who matters will be watching, and those who do not will be watching too.',
    choices: [
      { t: 'Stand the trial', r: 'You do it in front of them all, and it is done the way it should be. Men who did not know your name know it now.', fx: { proof: 'ctx', paTrial: 'stood', fame: 1, happy: -1 } },
      { t: 'Ask for another season to prepare', r: 'The sergeant shrugs. The trial will be there when you are ready, and so will the men who wanted to see it.', fx: { paTrial: 'wait', happy: 1 } },
    ] },
  { id: 'pa_spec', title: 'Your way with the {skT}', trigger: true, cool: 1, scene: 'field',
    cond: (p, C) => C.soldier(p),
    setup: (p, ctx) => { if (!p.mil || !ctx.sk || !ctx.spA) ctx.skip = true; },
    text: 'The old hands of {pathT} have watched how you fight, and they say the same thing: there is room in you for one way with the {skT}, and they would make it {spAT}.',
    choices: [
      { t: 'Take {spAT}', r: 'From now on the hours go to {spAT}. It is narrower, and it is yours.', fx: { specialism: { ctx: 'ctx.spA' } } },
      { t: 'Take {spBT} instead', req: (p, C, ctx) => !!ctx.nB, r: 'You go your own way: {spBT}. The old hands shake their heads, and watch.', fx: { specialism: { ctx: 'ctx.spB' }, happy: 1 } },
      { t: 'Keep to no one way yet', r: 'You stay as you are, good at all of it and master of none.', fx: { happy: 1 } },
    ] },
]);
