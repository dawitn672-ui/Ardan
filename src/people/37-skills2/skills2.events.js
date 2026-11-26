// The skills rebuild, steps 7 and 8 (docs/design/skills-v2.md §3.3, §3.4; §15.2, §15.5; D-182): the cards of a skill's
// turning. Both are queued by 37-skills2 (d-evolve, e-merge), never drawn: an evolution's first days, and two arts at
// their end offered as one. Each choice has its price; fx.skTurn is read by 36-skills' applyFx stage (A.SK2.cardFx).
A.defEvents([
  // ---- an evolution: the old rung stays, the new one is added; what the player makes of its first days ------------------
  { id: 'sk2_evolved', title: 'Something more', trigger: true, cool: 1, scene: 'workshop',
    cond: (p, C) => C.age(p) >= 12,
    setup: (p, ctx) => { if (!ctx.sk || !ctx.to || !ctx.tn) ctx.skip = true; },
    text: 'For months your {fnl} has given you nothing new. Then, on an ordinary day, the same work comes out another way, and better. Those who know the trade would call it {tn}. The old habits are still there, under the new. The first weeks of a thing like this do not come twice.',
    choices: [
      { t: 'Drive the body to keep up with it', req: (p, C, ctx) => !!ctx.big,
        r: 'Hard mornings, sore evenings. The body follows where the hand has gone.', fx: { skTurn: 'point', need: { rest: -6 }, happy: -1 } },
      { t: 'Work it while it is fresh',
        r: 'Every spare hour goes to it while it still surprises you.', fx: { skTurn: 'growth', need: { rest: -4 } } },
      { t: 'Show it where it will be seen',
        r: 'You make sure the right people are watching. By the next market day it has been talked about.', fx: { fame: 2, happy: 1 } },
      { t: 'Say nothing, and rest a while',
        r: 'You tell no one. It keeps, and so do you.', fx: { need: { rest: 8 }, happy: 2 } },
    ] },

  // ---- a merge offered: two level-10 arts that a recipe joins (known: a teacher or a school shows it; found: it comes) ----
  { id: 'sk2_merge_offer', title: 'Two roads, one art', trigger: true, cool: 1, scene: 'field',
    cond: (p, C) => C.age(p) >= 12,
    setup: (p, ctx) => { if (!ctx.rc || !A.SK2 || !A.SK2.mergeOpen || !A.SK2.mergeOpen(p, ctx.rc)) ctx.skip = true; },
    text: '{how} Your {an} and your {bn} have each gone as far as they will go alone. Held together they could be one art, {rn}. Joined, neither grows on by itself again. Kept apart, either may yet become something more.',
    choices: [
      { t: 'Join them into one art',
        r: 'A season of clumsy work, then it is not clumsy: {rn} is yours, and people notice the change.', fx: { skTurn: 'merge', fame: 1, need: { rest: -4 } } },
      { t: 'Keep them apart',
        r: 'You keep both roads open. Either may go further on its own.', fx: { happy: 1 } },
    ] },
]);
