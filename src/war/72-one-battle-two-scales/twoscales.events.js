// Two scales: drafts for the front. A soldier whose own company sits in garrison through a war, while the field army
// fights, is asked to go with the next draft (queued from the month hook in twoscales.core.js, which names the division
// that is fighting). Going puts you in that division, and its next fight is a two-scales fight.
A.defEvents([
  { id: 'ts_draft', title: 'Drafts for the front', trigger: true, cool: 1,
    cond: (p, C) => C.soldier(p) && C.atWar(p),
    setup: (p, ctx) => { if (!A.TS || !A.TS.draftOk(p, ctx)) ctx.skip = true; },
    text: 'The sergeant reads out a list at muster. The {divName} has lost men at {front} and wants a draft of the fit ones, now. The rest of your company will sit out the war on the walls, as it has so far.',
    choices: [
      { t: 'Put your name down for the draft', r: 'You march at dawn with forty strangers and a sack of bread. The men who stay wave you off from the gate.',
        fx: { tsDraft: 1, merit: 2, happy: -2 } },
      { t: 'Stay with your own company on the walls', r: 'You keep your bunk and your friends. Somebody calls the draft fools, and nobody laughs.',
        fx: { happy: 2 } },
    ] },
]);
