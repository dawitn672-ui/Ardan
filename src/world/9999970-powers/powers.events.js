// Powers wave 1: the cards of the wilds. Queued only (A.POWER in b-wilds.core.js and the hunt); every word and every odds
// comes from A.POWER (c-meet.core.js), read from the bestiary, the power scale and the being's character.
A.defEvents([
  { id: 'pw_encounter', title: (p, ctx) => (A.POWER && ctx.sp ? A.POWER.foeName(ctx).replace(/^./, c => c.toUpperCase()) : 'The wilds'),
    trigger: true, cool: 0, scene: 'wild', npc: true,
    cond: (p, C) => !C.prison(p) && (C.teen(p) || C.adult(p)),
    setup: (p, ctx) => { if (!A.POWER || !ctx.sp || !A.POWER.species(ctx.sp)) ctx.skip = true; },
    text: (p, ctx) => A.POWER.encText(p, ctx),
    choices: [
      { t: (p, ctx) => (ctx.hunt ? 'Close in for the kill' : 'Stand and fight'), odds: (p, ctx) => 100 * A.POWER.fightP(p, ctx),
        r: 'You set your feet.', fx: (p, ctx) => A.POWER.resolve(p, ctx, 'fight') },
      { t: (p, ctx) => (ctx.hunt ? 'Let it go and walk home' : 'Back away and run'), odds: (p, ctx) => (ctx.hunt ? 96 : 100 * A.POWER.fleeP(p, ctx)),
        r: 'You do not wait to see what it does.', fx: (p, ctx) => A.POWER.resolve(p, ctx, ctx.hunt ? 'leave' : 'flee') },
      { t: (p, ctx) => `Try what turns its kind: ${A.POWER.calmWord(ctx)}`, req: (p, C, ctx) => !!(A.POWER && A.POWER.calmWord(ctx)), odds: (p, ctx) => 100 * A.POWER.calmP(p, ctx),
        r: 'You do what the old hunters say works.', fx: (p, ctx) => A.POWER.resolve(p, ctx, 'calm') },
      { t: 'Speak to it', req: (p, C, ctx) => !!(A.POWER && A.POWER.canTalk(ctx)), odds: (p, ctx) => 100 * A.POWER.talkP(p, ctx),
        r: 'You raise your empty hands and speak.', fx: (p, ctx) => A.POWER.resolve(p, ctx, 'talk') },
    ] },
  { id: 'pw_great', title: (p, ctx) => (A.POWER && A.POWER.LEG.get(ctx.lg) ? A.POWER.LEG.get(ctx.lg).n : 'A great being'),
    trigger: true, cool: 0, scene: 'wild', npc: true,
    cond: (p, C) => !C.prison(p) && (C.teen(p) || C.adult(p)),
    setup: (p, ctx) => { if (!A.POWER || !A.POWER.LEG.get(ctx.lg)) ctx.skip = true; },
    text: (p, ctx) => A.POWER.greatText(p, ctx),
    choices: [
      { t: 'Kneel and speak it fair', odds: (p, ctx) => 100 * A.POWER.greatP(p, ctx, 'flattered'), r: 'You go down on one knee.', fx: (p, ctx) => A.POWER.greatAnswer(p, ctx, 'flattered') },
      { t: 'Ask what it wants of this land', odds: (p, ctx) => 100 * A.POWER.greatP(p, ctx, 'sought'), r: 'You ask.', fx: (p, ctx) => A.POWER.greatAnswer(p, ctx, 'sought') },
      { t: 'Keep your eyes down and walk on', odds: (p, ctx) => 100 * A.POWER.greatP(p, ctx, 'ignored'), r: 'You walk.', fx: (p, ctx) => A.POWER.greatAnswer(p, ctx, 'ignored') },
      { t: 'Draw steel', odds: (p, ctx) => 100 * A.POWER.greatP(p, ctx, 'attacked'), r: 'You draw.', fx: (p, ctx) => A.POWER.greatAnswer(p, ctx, 'attacked') },
    ] },
]);
