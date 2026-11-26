// The walls of the level (orders 91 and 92, D-184): the cards a player meets when experience takes him to a hundredth
// level. lv_wall: the road divides, and he chooses a class among those open to him (two or three) or the strength
// instead; lv_boost: no class is open to him, and he chooses where the strength goes. Both are queued by A.LV.CL
// (c-classes.core.js) and are notable: they stop a step until answered.
A.defEvents([
  { id: 'lv_wall', title: (p, ctx) => `The wall at level ${ctx.lvl}`, trigger: true, cool: 0, scene: 'field',
    cond: (p, C) => C.age(p) >= 0,
    setup: (p, ctx) => { if (!A.LV || !A.LV.CL || !A.LV.CL.pending(p) || !ctx.o1) ctx.skip = true; },
    text: (p, ctx) => `Level ${ctx.lvl}. Every fight you won has brought you here, and here the road divides. ${ctx.roads || ''} Or stay as you are, and take the strength instead.`,
    choices: [
      { t: (p, ctx) => `Become a ${ctx.n1}`, req: (p, C, ctx) => !!ctx.o1, r: 'You take the road, and it changes how you fight.',
        fx: (p, ctx) => A.LV.CL.answer(p, ctx.o1) },
      { t: (p, ctx) => `Become a ${ctx.n2}`, req: (p, C, ctx) => !!ctx.o2, r: 'You take the road, and it changes how you fight.',
        fx: (p, ctx) => A.LV.CL.answer(p, ctx.o2) },
      { t: (p, ctx) => `Become a ${ctx.n3}`, req: (p, C, ctx) => !!ctx.o3, r: 'You take the road, and it changes how you fight.',
        fx: (p, ctx) => A.LV.CL.answer(p, ctx.o3) },
      { t: 'Stay as you are, and take the strength instead', r: 'No new art. The body takes what the fights gave it.',
        fx: (p, ctx) => A.LV.CL.answer(p, 'boost') },
    ] },
  { id: 'lv_boost', title: (p, ctx) => `The wall at level ${ctx.lvl}`, trigger: true, cool: 0, scene: 'field',
    cond: (p, C) => C.age(p) >= 0,
    setup: (p, ctx) => { if (!A.LV || !A.LV.CL || !A.LV.CL.pending(p)) ctx.skip = true; },
    text: (p, ctx) => `Level ${ctx.lvl}. No art of arms has claimed you, but the body remembers every fight that brought you here. ${ctx.pts} come to you. Where do they go?`,
    choices: [
      { t: 'Into strength and endurance', r: 'Heavier blows, longer days. The quickness stays where it was.',
        fx: (p, ctx) => A.LV.CL.answer(p, 'boost', ['str', 'sta']) },
      { t: 'Into speed and reflexes', r: 'Quicker hands and a quicker eye. The weight stays where it was.',
        fx: (p, ctx) => A.LV.CL.answer(p, 'boost', ['spd', 'ins']) },
      { t: 'Keep them, to place as you see fit', r: 'You will decide later. They keep.',
        fx: (p, ctx) => A.LV.CL.answer(p, 'boost') },
    ] },
]);
