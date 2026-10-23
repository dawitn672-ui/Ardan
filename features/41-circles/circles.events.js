// Circles (41-circles): cliques in your unit or street, a newcomer who is your foe's friend, and word that gets around.
const CI = () => A.CIRCLES;
const name = id => { const p = A.P(id); return p ? p.given : null; };
// the clique: three comrades, or three regulars of your street
const clique = (p, ctx) => {
  const c = CI().cliqueFor(p);
  if (!c) { ctx.skip = true; return; }
  ctx.ids = c.ids; ctx.where = c.where; ctx.pid = c.ids[0];
  ctx.mate2 = name(c.ids[1]); ctx.mate3 = name(c.ids[2]);
  if (!ctx.mate2 || !ctx.mate3) ctx.skip = true;
};

A.defEvents([
  { id: 'cir_clique', title: 'Their own fire', w: 1, cool: 8,
    cond: (p, C) => C.adult(p) && !p.clique, setup: clique,
    text: (p, ctx) => (ctx.where === 'unit'
      ? '{them}, {mate2} and {mate3} keep a fire of their own at the end of the lines. They share tobacco, cover each other at roll-call, and stop talking when an outsider comes near. Tonight {them} moves over on the log to make room.'
      : '{them}, {mate2} and {mate3} have drunk at the same corner table since before you came to {home}. They lend each other money and take each other\'s side in every quarrel. Tonight {them} pulls out a stool.'),
    choices: [
      { t: 'Sit down with them', r: 'You sit, and you are one of them after that, in the small ways that count.', fx: { circle: 'join', happy: 2 } },
      { t: 'Sit down, and soon run the table', check: { s: 'persuasion', s2: 'wil', d: 50 },
        win: { r: 'Within a season they look to you before they decide anything. It is a small kingdom, but it is yours.', fx: { circle: 'lead', fame: 1 } },
        lose: { r: 'You push too soon. {them} lets you know, politely, that the table already has a head.', fx: { circle: 'apart', happy: -2 } } },
      { t: 'Keep your own fire', r: 'You thank {them} and stay where you are. They do not ask twice.', fx: { circle: 'apart', wil: 1 } },
    ] },

  // queued when you meet someone close to one of your foes
  { id: 'cir_foes_friend', title: 'A friend of {foe}', trigger: true, cool: 1, npc: true,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { ctx.foe = ctx.foe != null ? ctx.foe : null; const f = A.P(ctx.foe), t = A.P(ctx.pid); if (!f || !t || !t.alive) { ctx.skip = true; return; } ctx.foeName = f.given; },
    text: '{them} is civil, and no more. {theyHe} has known {foeName} for years, and has heard {foeName}\'s side of everything that passed between you.',
    choices: [
      { t: 'Win {themHim} over anyway', check: { s: 'persuasion', s2: 'int', d: 55 },
        win: { r: 'By the end of the evening {them} allows that there may be two sides to it.', fx: { them: { op: 15 } } },
        lose: { r: 'You try too hard, and {them} goes home with a story for {foeName}.', fx: { them: { op: -5 } } } },
      { t: 'Ask {themHim} to carry a word of peace to {foeName}', check: { s: 'persuasion', s2: 'ins', d: 50 },
        win: { r: '{them} carries it. {foeName} does not answer, but the next time you pass in the street, {foeName} nods.', fx: { circle: 'mend', them: { op: 5 } } },
        lose: { r: '{them} carries it, word for word, and {foeName} laughs at it.', fx: { happy: -2 } } },
      { t: 'Keep your distance', r: 'You are civil, and no more. It is something you and {them} have in common.', fx: { wil: 1 } },
    ] },

  // queued when a great harm you did reaches the friends of the one you harmed
  { id: 'cir_word', title: 'Word gets around', trigger: true, cool: 1, npc: true,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { const t = A.P(ctx.pid), ns = (ctx.ids || []).map(name).filter(Boolean); if (!t || ns.length < 2) { ctx.skip = true; return; } ctx.heard = ns.length > 2 ? ns.slice(0, -1).join(', ') + ' and ' + ns[ns.length - 1] : ns.join(' and '); },
    text: 'What passed between you and {them} did not stay between you. {heard} have heard {theirHis} side of it. A door that used to open for you now opens a little slower.',
    choices: [
      { t: 'Make it right with {them}', req: p => p.coin >= 15, r: 'You go to {them} with fifteen suns and something like an apology. {theyHe} takes both, and says so to {theirHis} friends.', fx: { coin: -15, them: { op: 14 } } },
      { t: 'Tell your side before theirs sets', check: { s: 'persuasion', s2: 'ins', d: 50 },
        win: { r: 'You find each of them in turn and tell it plainly. Most of them come round.', fx: { circle: 'soothe' } },
        lose: { r: 'You make it worse. Now there are two stories, and yours is the one with excuses in it.', fx: { fame: -1 } } },
      { t: 'Let them talk', r: 'Let them. You know what happened.', fx: { wil: 1, happy: -1 } },
    ] },
]);
