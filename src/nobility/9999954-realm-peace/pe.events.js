// W1-6: the realm's peace, as the player meets it at his rank (README.md). Queued by A.PEACE: pe_coup when plotters
// approach a man with access to the king's person; pe_judge when two great houses bring their quarrel to a ruling
// player.
A.defEvents([
  { id: 'pe_coup', title: 'A word in the dark', trigger: true, cool: 1, scene: 'court', npc: true,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { if (!ctx.pk || !ctx.kid || !(A.P(ctx.kid) && A.P(ctx.kid).alive) || !(A.P(ctx.pid) && A.P(ctx.pid).alive)) ctx.skip = true; else { const q = A.P(ctx.pid); ctx.kingT = A.fullName(A.P(ctx.kid), false); ctx.khe = A.he(q); ctx.Khe = A.cap(ctx.khe); ctx.khim = A.him(q); ctx.khis = A.his(q); } },
    text: '{them} draws you into a window seat, away from the servants. {openT}, {khe} says, and the realm will not survive another year of {kingT}. Men who hold the gates are ready. {Khe} wants your name with theirs, or your silence.',
    choices: [
      { t: 'Give {khim} your name', r: 'You put your hand in {them}\'s. From tonight, your neck is in the same noose as {khis}.', fx: { peCoup: 'join', honor: -3, them: { op: 15 } } },
      { t: 'Say nothing, and go', r: 'You leave without a word. You did not join them. You did not warn anyone either, and both of those may be remembered.', fx: { peCoup: 'silent', happy: -2 } },
      { t: 'Go straight to the crown', r: 'You tell what you heard, and who said it. The guards go out before the candles are lit.', fx: { peCoup: 'tell', honor: 2, them: { op: -40 } } },
    ] },
  { id: 'pe_judge', title: 'A quarrel brought to court', trigger: true, cool: 1, scene: 'court', npc: true,
    cond: (p, C) => C.ruler(p),
    setup: (p, ctx) => { if (!ctx.fq || !ctx.aT || !ctx.bT) ctx.skip = true; if (ctx.pid && !(A.P(ctx.pid) && A.P(ctx.pid).alive)) ctx.pid = null; },
    text: 'The lords of {aT} and {bT} stand before your chair, each with his witnesses. {aT} complains of {whyT}. Whoever you judge against will remember it, and so will every lord who watches.',
    choices: [
      { t: 'Judge for {aT}', r: 'You give it to {aT}. The other house bows, stiffly, and leaves without the usual courtesies.', fx: { peJudge: 'forA' } },
      { t: 'Judge for {bT}', r: 'You give it to {bT}. {aT} hears you out in silence and rides home the same night.', fx: { peJudge: 'forB' } },
      { t: 'Split it between them', r: 'Neither house has all it wanted. Neither has lost everything. Both think the less of you for it.', fx: { peJudge: 'split' } },
      { t: 'Refuse to hear it', r: 'You have greater matters. The two houses leave together, and that is the last time they will.', fx: { peJudge: 'ignore' } },
    ] },
]);
