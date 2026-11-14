// 9999-advisors: the scenes of the ring (advisors.core.js queues them, as NPC moves on 21's budget, with ctx.pid the
// advisor and, for two of them, ctx.foeId a second one). Each reads what the ring remembers: who was heeded, who was
// right, who keeps disagreeing with whom.
(function () {

  // who the scene is about: ctx.pid if alive, else someone in your ring, else anyone grown you know (a tool rendering it)
  const person = (p, ctx, key) => {
    let t = ctx[key] && A.P(ctx[key]);
    if (!(t && t.alive)) {
      const ring = A.ADV ? A.ADV.ring(p).map(x => x.id) : [];
      const ids = ring.concat(Object.keys(p.rel || {})).filter(id => id !== ctx.pid && id !== ctx.foeId && A.P(id) && A.P(id).alive && A.isAdult(A.P(id)));
      t = ids.length ? A.P(ids[0]) : null;
      if (t) ctx[key] = t.id;
    }
    return t;
  };
  const roleOf = (p, t) => {
    const x = A.ADV && (A.ADV.ring(p).find(r => r.id === t.id));
    return x ? A.ADV.roleName(x.role, t) : 'one of those whose counsel you hear';
  };
  const one = (p, ctx) => {
    const t = person(p, ctx, 'pid');
    if (!t) { ctx.skip = true; return null; }
    ctx.khe = A.he(t); ctx.khim = A.him(t); ctx.khis = A.his(t);
    ctx.theirRole = roleOf(p, t);
    return t;
  };
  const two = (p, ctx) => {
    const t = one(p, ctx); if (!t) return;
    const f = person(p, ctx, 'foeId');
    if (!f || f.id === t.id) { ctx.skip = true; return; }
    ctx.foe = f.given;
  };
  const ASK = {
    wealth: 'a loan for a venture of {khis} own, which {khe} swears is sound',
    faith: 'silver for the shrine roof, which lets the rain in on the saints',
    kin: 'help with a niece\'s dowry, since the family is short this year',
    craft: 'the price of new tools, to set up a bench of {khis} own',
    glory: 'the price of a good horse and harness, for the next muster',
    rise: 'the fee for a clerk\'s place {khe} has found for {khis} son',
    safety: 'the cost of a physician for {khis} old mother',
    company: 'help with a debt that has kept {khim} awake since spring',
    order: 'a gift toward the new gaol, which the town cannot pay for',
    peace: 'money for the bridge toll, which the wars have doubled',
    works: 'a share in the new mill, which wants one more backer',
    liberty: 'a gift to the lords\' fund for the law case at court',
    crown: 'a quiet sum, and no questions, for friends at court',
  };

  A.defEvents([
    {
      id: 'adv_told_you', title: 'I did say', npc: true, trigger: true, cool: 3,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { one(p, ctx); },
      text: '{them} does not say it at once. {khe} asks after the roads, pours the wine and talks of the weather. Then, at the door, with {khis} hand on the latch: "I did say." {khe} is right, and {khe} knows you know it.',
      choices: [
        { t: 'Say {khe} was right, and mean it', r: '{khe} nods once and lets it go. You have made a promise without saying so, and both of you heard it.', fx: { them: { op: 6 }, honor: 1, happy: -2, adv: { promise: 1 } } },
        { t: 'Tell {khim} the matter is closed', r: '{khe} lifts the latch and goes. The matter is closed. So, for a while, is {khe}.', fx: { them: { op: -5 }, wil: 0.5 } },
        { t: 'Explain why you chose as you did', check: { s: 'persuasion', s2: 'int', d: 45 },
          win: { r: '{khe} hears you out and allows that you had your reasons. Not good ones, {khe} says. But reasons.', fx: { them: { op: 3 }, skill: { persuasion: 1 } } },
          lose: { r: 'It comes out as an excuse, and {khe} hears it as one.', fx: { them: { op: -3 }, happy: -1 } } },
      ],
    },
    {
      id: 'adv_unheeded', title: 'Counsel unasked', npc: true, trigger: true, cool: 4,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { one(p, ctx); },
      text: 'Three times now {them}, {theirRole}, has given you counsel, and three times you have gone the other way. {khe} sets it out plainly and without heat. Either you want {khis} counsel or you do not. {khe} would rather know which.',
      choices: [
        { t: 'Ask {khim} to keep speaking. You will listen', r: '{khe} takes you at your word. The next time you go against {khim}, {khe} will remember this evening.', fx: { them: { op: 5 }, adv: { promise: 1 } } },
        { t: 'Thank {khim}, and let {khim} go', r: '{khe} goes without a scene. The room is quieter afterwards, and so are you.', fx: { adv: { drop: 1, unseat: 1 }, wil: 0.5, happy: -1 } },
        { t: 'Say counsel is given, not obeyed', r: '{khe} considers that, and stays. {khe} speaks less often after this, and more carefully.', fx: { them: { op: -3 }, wil: 1, honor: -1 } },
      ],
    },
    {
      id: 'adv_due', title: 'What {khe} asks', npc: true, trigger: true, cool: 6,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => {
        const t = one(p, ctx); if (!t) return;
        const x = A.ADV && A.ADV.ring(p).find(r => r.id === t.id);
        ctx.ask = A.T(ASK[x && x.w] || ASK.company, ctx);
      },
      text: '{them} has been right by you more than once, and you listened. Now {khe} asks for something back: {ask}. {khe} asks the way people ask who expect to be told yes.',
      choices: [
        { t: 'Give it', r: 'You give it. {khe} thanks you once, properly, and does not mention it again.', fx: { coinPct: -6, them: { op: 8 }, adv: { paid: 1 } } },
        { t: 'Give half, and your thanks', r: 'Half is not what {khe} asked for. {khe} takes it, and your thanks, and makes the best of both.', fx: { coinPct: -3, them: { op: 3 }, adv: { paid: 1 } } },
        { t: 'Say you cannot spare it this year', r: '{khe} says {khe} understands. {khe} does, rather too well.', fx: { them: { op: -6 }, adv: { paid: 1 } } },
      ],
    },
    {
      id: 'adv_warning', title: 'A word about {foe}', npc: true, trigger: true, cool: 4,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { two(p, ctx); },
      text: '{them} waits until the room is empty. "{foe} gave you that counsel," {khe} says, "and {foe} knew how it would go." {khe} has no proof to lay on the table. Only what {khe} has watched, over a good many suppers.',
      choices: [
        { t: 'Send {foe} from your counsel', r: '{foe} goes, stiff and silent. Whether {foe} was false or only wrong, you will not hear it again.', fx: { adv: { drop: 'foe', unseat: 1 }, them: { op: 4 }, happy: -1 } },
        { t: 'Ask {khim} for proof', check: { s: 'ins', s2: 'intrigue', d: 50 },
          win: { r: 'You watch {foe} at the next sitting, and you see it: the small smile when you go wrong. {foe} is gone by the week\'s end.', fx: { adv: { drop: 'foe', unseat: 1 }, skill: { intrigue: 1 }, them: { op: 4 } } },
          lose: { r: 'You watch, and see nothing. {them} thinks you did not want to see it.', fx: { them: { op: -4 } } } },
        { t: 'Say you keep your own counsel', r: '{khe} bows and lets it drop. {foe} keeps the seat, and you keep your own counsel.', fx: { them: { op: -3 }, wil: 1 } },
      ],
    },
    {
      id: 'adv_quarrel', title: 'Two voices', npc: true, trigger: true, cool: 5,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { two(p, ctx); },
      text: '{them} and {foe} have taken the other side of each other once too often. Tonight it comes out at your table, over the bread, and it is not about the bread. Both of them turn to you to settle it.',
      choices: [
        { t: 'Side with {them}', r: '{them} is gracious about it. {foe} is not.', fx: { adv: { side: 1 } } },
        { t: 'Side with {foe}', r: '{foe} takes it as {foe}\'s due. {them} says nothing for the rest of the meal.', fx: { adv: { side: -1 } } },
        { t: 'Send them both away from the table', r: 'They go, still arguing in the passage. You finish the bread alone.', fx: { them: { op: -2 }, wil: 1, happy: -1 } },
      ],
    },
    {
      id: 'adv_last_word', title: 'The last of the counsel', npc: true, trigger: true, cool: 10,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { const t = one(p, ctx); if (t) ctx.record = A.ADV ? A.ADV.record(p, t.id) : 'listened'; },
      text: '{them} is old now and knows it. {khe} has given you counsel for years, and you {record}. Tonight {khe} asks you to sit, because there is one more thing {khe} wants to say, and {khe} wants to say it properly.',
      choices: [
        { t: 'Sit and listen to the end', r: 'It is about nothing in particular, and it takes an hour, and you will remember all of it.', fx: { happy: 3, them: { op: 5 }, need: { company: 10 } } },
        { t: 'Ask what {khe} would do in your place', r: '{khe} tells you, plainly. Some of it you had not thought of.', fx: { ins: 0.5, int: 0.5, them: { op: 2 } } },
        { t: 'Pray with {khim} instead', r: 'You pray together, which neither of you has done in years. {khe} keeps the last thing to {khim}self.', fx: { piety: 2, happy: -1 } },
      ],
    },
  ]);
})();
