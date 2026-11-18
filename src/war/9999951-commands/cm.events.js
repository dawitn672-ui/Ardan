// W1-3: the summons and the crown's judgment, as the player meets them (a landed lord). Queued by a-commands' A.CMD
// (cm_summons when the crown goes to war, cm_sentence when the player refused and the crown judged it). See README.md.
A.defEvents([
  { id: 'cm_summons', title: 'The summons', trigger: true, cool: 1, scene: 'home',
    cond: (p, C) => C.adult(p) && C.noble(p),
    setup: (p, ctx) => { if (!ctx.wid || !ctx.rid || !ctx.men) ctx.skip = true; if (ctx.pid && !(A.P(ctx.pid) && A.P(ctx.pid).alive)) ctx.pid = null; },
    text: 'A rider with the crown\'s badge at your gate. {realmT} is at war with {enemyT}, and the crown calls its lords to the muster within the month. Your oath owes {men} men and your own sword. Shield money, the price of keeping them at home, is {scut}. {homeLine}',
    choices: [
      { t: 'Ride to the muster at the head of every man', r: 'You ride under your own colours with every man you owe. The crown\'s clerks write your name near the top of the roll.', fx: { cmAnswer: 'full', fame: 1, honor: 1, happy: -2 } },
      { t: 'Send half, and keep the rest to hold your border', r: 'Half your men go down the road. The other half stay on your walls. Whether that is prudence or an excuse, the crown will decide.', fx: { cmAnswer: 'part', honor: -1 } },
      { t: 'Come, but after the harvest is in', r: 'The sheaves come in first, then the men. You will reach the muster when the host has already marched, and the crown can count.', fx: { cmAnswer: 'late', happy: 1, honor: -1 } },
      { t: 'Send {depT} to lead your men in your place', r: 'Your men go under {depT}. You stay to keep the house. The crown takes the men and notes the empty saddle.', fx: { cmAnswer: 'deputy', fame: -1 } },
      { t: 'Pay the shield money and keep your men home', req: (p, C, ctx) => p.coin >= (ctx.scutN || 0), r: 'The money goes to the crown\'s clerks and the men stay at the plough. It is lawful. It is not loved.', fx: { cmAnswer: 'coin', honor: -1 } },
      { t: 'Refuse the summons', r: 'You send the rider back with nothing. It is a breach of your oath, and the crown keeps a list of those.', fx: { cmAnswer: 'refuse', honor: -3, wil: 1 } },
    ] },
  { id: 'cm_sentence', title: 'The crown\'s judgment', trigger: true, cool: 1, scene: 'court',
    cond: (p, C) => C.adult(p) && C.noble(p),
    setup: (p, ctx) => { if (!ctx.rid || !ctx.sentT) ctx.skip = true; if (ctx.pid && !(A.P(ctx.pid) && A.P(ctx.pid).alive)) ctx.pid = null; },
    text: 'For the summons you refused, the crown has {sentT}. {whyT} The lords who came to the muster are watching what you do now, and so are the ones who stayed home.',
    choices: [
      { t: 'Submit, and say so in writing', r: 'You write to the crown in your own hand. It costs you something to do it, and the crown knows exactly what.', fx: { cmSubmit: 'submit', happy: -3 } },
      { t: 'Stay at home and say nothing to anyone', r: 'You keep to your hall. Silence is not defiance, quite, and it is not submission either.', fx: { cmSubmit: 'sulk', wil: 1, happy: -1 } },
      { t: 'Write to the other lords who stayed home', r: 'Your letters go out by trusted riders. A league begins with letters like these, and so does a charge of treason.', fx: { cmSubmit: 'league', skill: { intrigue: 2 }, honor: -2 } },
    ] },
]);
