// D11-1: the muster as the player meets it. Queued by c-enlist.core.js (A.MUSTER): md_muster when he goes to a muster or
// a free company's table (or right after a scene that swore him in), md_role when his captain wants him for a role.
// md_role_duty is a role's own work, drawn in service.
A.defEvents([
  { id: 'md_muster', title: 'The muster', trigger: true, cool: 1, scene: 'field',
    cond: (p, C) => C.age(p) >= 14,
    setup: (p, ctx) => { if (!ctx.n || (ctx.sworn ? !p.mil : !!(p.mil && !p.mil.merc && !ctx.merc))) ctx.skip = true; },
    text: '{placeT}. The muster-master, {masterT}, reads every man who comes. {readT}{swornT}',
    choices: [
      { t: '{o1T}', r: '{o1R}', fx: { muster: 1 } },
      { t: '{o2T}', req: (p, C, ctx) => (ctx.n || 0) >= 2, r: '{o2R}', fx: { muster: 2 } },
      { t: '{o3T}', req: (p, C, ctx) => (ctx.n || 0) >= 3, r: '{o3R}', fx: { muster: 3 } },
      { t: 'Thank him, and walk home', req: (p, C, ctx) => !ctx.sworn, r: 'You go home with your name off the roll. The muster will be there next season.', fx: { muster: 'no' } },
    ] },
  { id: 'md_role', title: 'A use for you', trigger: true, cool: 1, scene: 'field',
    cond: (p, C) => C.soldier(p),
    setup: (p, ctx) => { if (!p.mil || p.mil.role || !A.MUSTER || !A.MUSTER.R(ctx.rk)) ctx.skip = true; },
    text: '{captT} has a use for you: he would make you the company\'s {roleT}. {whyT} It is {payT} a month more, and the work on top of your own. What he wants of it: {addsT}.',
    choices: [
      { t: 'Take it', r: 'Your name goes beside the {roleT}\'s work on the roll, and the first month\'s money into your hand. The old hands watch to see whether you are any good at it.', fx: { musterRole: 'take', coin: 2, happy: -1 } },
      { t: 'Ask to stay in the line', r: 'He shrugs and asks another man. Your evenings stay your own.', fx: { musterRole: 'no', happy: 1 } },
    ] },
  { id: 'md_role_duty', title: 'The {roleT}\'s work', w: 1, cool: 2, scene: 'field',
    cond: (p, C) => C.soldier(p) && !!(p.mil && p.mil.role),
    setup: (p, ctx) => {
      const R = p.mil && p.mil.role && A.MUSTER ? A.MUSTER.R(p.mil.role.k) : null;
      if (!R) { ctx.skip = true; return; }
      ctx.roleT = R.name; ctx.dutyT = R.duty;
    },
    text: '{dutyT} It falls to you, as the company\'s {roleT}.',
    choices: [
      { t: 'Do it properly, whatever it costs you', check: { s: 'wil', s2: 'int', d: 40 },
        win: { r: 'It takes the night, but it is done right. The captain notices, which is the point.', fx: { musterDuty: 'well', happy: -1 } },
        lose: { r: 'You work until you cannot see, and it is still half done. Nobody thanks you for the half.', fx: { musterDuty: 'fast', happy: -3 } } },
      { t: 'Do what will pass at a glance', r: 'It passes at a glance. Nobody looks twice, this time.', fx: { musterDuty: 'fast' } },
      { t: 'Ask the captain to give the work to another', r: 'He gives it to another man without a word. Your evenings are your own again, and so is the pay you will not get.', fx: { musterDuty: 'pass', happy: 2 } },
    ] },
]);
