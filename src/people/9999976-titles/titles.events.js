// Titles (D-183): the cards. tt_earned and tt_lost are queued by A.TT when a title is earned or lost (notable: they stop a
// step); tt_faith is the cell where a man of another faith than his realm's is offered the door for one word against his own.
A.defEvents([
  { id: 'tt_earned', title: (p, ctx) => ctx.ttl || 'A name of your own', trigger: true, cool: 0, scene: 'street',
    cond: (p, C) => C.age(p) >= 0,
    setup: (p, ctx) => { if (!A.TT || !ctx.tid || !A.TT.holds(p, ctx.tid)) ctx.skip = true; },
    text: (p, ctx) => `${ctx.why || ''} ${A.TT && A.TT.cardLine ? A.TT.cardLine(p, ctx.tid) : ''}`.trim(),
    choices: [
      { t: 'Wear the name beside your own', r: 'You let them say it. In a month you answer to it.',
        fx: (p, ctx) => { if (A.TT) A.TT.bear(p, ctx.tid); return ''; } },
      { t: 'Let others say it; never say it yourself', r: 'You never use it. Everyone else does.',
        fx: (p, ctx) => { if (A.TT && p.tt && p.tt.b === ctx.tid) A.TT.bear(p, null); return ''; } },
    ] },
  { id: 'tt_lost', title: (p, ctx) => ctx.ttl || 'A name gone', trigger: true, cool: 0, scene: 'street',
    cond: (p, C) => C.age(p) >= 0,
    setup: (p, ctx) => { if (!A.TT || !ctx.tid) ctx.skip = true; },
    text: (p, ctx) => ctx.lost || 'The name you had is gone.',
    choices: [
      { t: 'Let it go', r: 'Names come and go. You are still here.', fx: { wil: 0.5 } },
      { t: 'Swear to earn it back', r: 'You say it to no one but yourself. It is enough to get up in the morning.', fx: { happy: -2, wil: 1, flag: 'tt_swore_back' } },
    ] },
  { id: 'tt_faith', title: 'One word at the door', w: 1, once: true, scene: 'prison',
    cond: (p, C) => C.adult(p) && C.prison(p) && !!p.faith && !C.faith(p, (A.realm(p.realm) || {}).faith),
    setup: (p, ctx) => { const r = A.realm(p.realm), F = r && A.faith ? A.faith(r.faith) : null; ctx.theirs = (F && F.name) || 'the realm\'s faith'; },
    text: 'The gaol\'s chaplain comes with a paper and the key. Put your mark under a few lines against {faith}, kneel once at the altar of {theirs}, and the door opens tonight. Refuse, and the gaolers have been told to make your stay long.',
    choices: [
      { t: 'Make your mark and kneel', r: 'You make the mark. You kneel. The door opens, and you walk out lighter by one thing.',
        fx: (p, ctx) => { if (A.deedDone) A.deedDone(p, 'faith_recanted'); return A.applyFx(p, { free: 1, piety: -10, honor: -3, happy: -3 }, ctx) || ''; } },
      { t: 'Refuse the paper', r: 'You hand it back unmarked. The gaolers keep their word.',
        fx: (p, ctx) => { if (A.deedDone) A.deedDone(p, 'faith_kept'); return A.applyFx(p, { piety: 6, wil: 1, health: -6, happy: -4 }, ctx) || ''; } },
    ] },
]);
