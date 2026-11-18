// D11-2: the company as the player meets it. Queued by A.UNITS: un_drill (his company's drill, a scene he is in), un_duty
// (the company's duty in peace, when it starts), un_transfer (another branch's officer asks for him).
A.defEvents([
  { id: 'un_drill', title: 'The drill: {drillT}', trigger: true, cool: 1, scene: 'field',
    cond: (p, C) => C.soldier(p),
    setup: (p, ctx) => { if (!p.mil || !ctx.drillT) ctx.skip = true; },
    text: 'The company drills {drillT} this month: {whyT}. {teachT} has the teaching of it. The raw men are slow, the old hands are bored, and the sergeant is hoarse by noon.',
    choices: [
      { t: 'Throw yourself into it', r: 'You are sore for three days, and you have it in your body now, not only in your head.', fx: { unDrill: 'hard', happy: -2 } },
      { t: 'Help the raw men along', check: { s: 'command', s2: 'wil', d: 35 },
        win: { r: 'Two of them get it from you that they would not get from the sergeant. He notices.', fx: { unDrill: 'teach' } },
        lose: { r: 'They do not listen to a man of their own rank. The sergeant tells you to mind your own feet.', fx: { unDrill: 'easy', happy: -1 } } },
      { t: 'Go through the motions', r: 'You stand where you are put and move when you are told. The day passes.', fx: { unDrill: 'easy', happy: 1 } },
    ] },
  { id: 'un_duty', title: 'The company\'s work', trigger: true, cool: 1, scene: 'road',
    cond: (p, C) => C.soldier(p),
    setup: (p, ctx) => { if (!p.mil || !p.mil.duty || p.mil.duty.k !== ctx.dk) ctx.skip = true; },
    text: '{capT} gives the company its work for the season: {dutyT}. The reason he gives: {whyT}.',
    choices: [
      { t: 'Put your back into it', r: 'It is dull work done well, and the captain is the kind who sees that.', fx: { unDuty: 'well', happy: -1, honor: 1 } },
      { t: 'Do your share and no more', r: 'You do what is asked. Nobody complains, and nobody remembers.', fx: { unDuty: 'share' } },
      { t: 'Find a way out of the worst of it', check: { s: 'stealth', s2: 'int', d: 40 },
        win: { r: 'You are always somewhere else when the heavy work comes round. The others notice, if the captain does not.', fx: { unDuty: 'shirk', happy: 2, honor: -1 } },
        lose: { r: 'The sergeant finds you asleep behind the stores. It goes in the book.', fx: { unDuty: 'caught', happy: -2 } } },
    ] },
  { id: 'un_transfer', title: 'Asked for', trigger: true, cool: 1, scene: 'field',
    cond: (p, C) => C.soldier(p),
    setup: (p, ctx) => { if (!p.mil || !ctx.tb || p.mil.branch === ctx.tb) ctx.skip = true; },
    text: '{officerT}, of {branchT}, has been watching you. He says it plainly: {whyT}. He has asked your captain for you, and your captain has left it to you.',
    choices: [
      { t: 'Go with him', r: 'You carry your kit across the camp to new faces and new work.', fx: { unTransfer: 'go', happy: 1, family: -1 } },
      { t: 'Stay with your own company', r: 'He shrugs. Your messmates say nothing, but they make room for you at the fire.', fx: { unTransfer: 'stay', honor: 1 } },
    ] },
]);
