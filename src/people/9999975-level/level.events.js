// The walls of the level (orders 91, 92 and 95, D-184): the cards a player meets when experience takes him to a hundredth
// level and he breaks through (points for the body, and a skill's jump where it is allowed, came already). lv_wall: the
// road divides, and he chooses a class among those open to him (one to three) or keeps to his road; lv_boost: no class
// is open to him, and he chooses where the breakthrough's points go. Both are queued by A.LV.CL
// (c-classes.core.js) and are notable: they stop a step until answered.
A.defEvents([
  { id: 'lv_wall', title: (p, ctx) => `The wall at level ${ctx.lvl}`, trigger: true, cool: 0, scene: 'field',
    cond: (p, C) => C.age(p) >= 0,
    setup: (p, ctx) => { if (!A.LV || !A.LV.CL || !A.LV.CL.pending(p) || !ctx.o1) ctx.skip = true; },
    text: (p, ctx) => `Level ${ctx.lvl}: you break through. ${ctx.pts} come to the body. ${ctx.jump || ''} And the road divides. ${ctx.roads || ''}`.replace(/\s+/g, ' '),
    choices: [
      { t: (p, ctx) => `Become a ${ctx.n1}`, req: (p, C, ctx) => !!ctx.o1, r: 'You take the road, and it changes how you fight.',
        fx: (p, ctx) => A.LV.CL.answer(p, ctx.o1) },
      { t: (p, ctx) => `Become a ${ctx.n2}`, req: (p, C, ctx) => !!ctx.o2, r: 'You take the road, and it changes how you fight.',
        fx: (p, ctx) => A.LV.CL.answer(p, ctx.o2) },
      { t: (p, ctx) => `Become a ${ctx.n3}`, req: (p, C, ctx) => !!ctx.o3, r: 'You take the road, and it changes how you fight.',
        fx: (p, ctx) => A.LV.CL.answer(p, ctx.o3) },
      { t: 'Keep to the road you are on', r: 'No new art for now. What you broke through to is yours all the same.',
        fx: (p, ctx) => A.LV.CL.answer(p, 'none') },
    ] },
  { id: 'lv_boost', title: (p, ctx) => `The wall at level ${ctx.lvl}`, trigger: true, cool: 0, scene: 'field',
    cond: (p, C) => C.age(p) >= 0,
    setup: (p, ctx) => { if (!A.LV || !A.LV.CL || !A.LV.CL.pending(p)) ctx.skip = true; },
    text: (p, ctx) => `Level ${ctx.lvl}: you break through. No art of arms has claimed you, but the body remembers every fight that brought you here. ${ctx.jump || ''} ${ctx.pts} come to you. Where do they go?`.replace(/\s+/g, ' '),
    choices: [
      { t: 'Into strength and endurance', r: 'Heavier blows, longer days. The quickness stays where it was.',
        fx: (p, ctx) => A.LV.CL.answer(p, 'boost', ['str', 'sta']) },
      { t: 'Into speed and reflexes', r: 'Quicker hands and a quicker eye. The weight stays where it was.',
        fx: (p, ctx) => A.LV.CL.answer(p, 'boost', ['spd', 'ins']) },
      { t: 'Keep them, to place as you see fit', r: 'You will decide later. They keep.',
        fx: (p, ctx) => A.LV.CL.answer(p, 'boost') },
    ] },
]);
