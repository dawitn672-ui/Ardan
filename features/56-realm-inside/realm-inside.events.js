// The realm from inside (56-realm-inside): taken for ransom, a holding burned in a raid, the council pressing a
// ruler, and a court person asking for your voice. All are queued by the engine (court.core.js, purse.core.js).
const RIX = () => A.RI;
const alive = id => { const p = A.P(id); return p && p.alive ? p : null; };

A.defEvents([
  // queued when your side loses a battle and the enemy decides you are worth keeping (RI.maybeTaken)
  { id: 'ri_taken', title: 'Taken', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { if (!ctx.ransomN) ctx.skip = true; },
    text: 'The line breaks and you go down in the press. When you can see again, men of {captor} are cutting your purse strings and arguing over you. Their sergeant looks at your boots and your hands and names a price: {ransom}. Until it is paid you sleep in a byre with a chain on your ankle.',
    choices: [
      { t: 'Pay the {ransom}, borrowing if you must', r: 'The money changes hands somewhere you do not see. A week later they walk you to the edge of their camp and point you home.',
        fx: { riRansom: 'pay', honor: 1 } },
      { t: 'Send word to {patron} to pay it', req: (p, C, ctx) => !!(ctx && alive(ctx.pid)),
        r: '{patron} pays, in time, and lets you know the sum to the last sun. You owe more than the money now.', fx: { riRansom: 'patron', oweThem: 1, them: { op: -8 } } },
      { t: 'Slip the chain at night and run', check: { s: 'stealth', s2: 'spd', d: 55 },
        win: { r: 'The staple gives on the third night. You are two valleys away by dawn, and the story travels ahead of you.', fx: { riRansom: 'escape', fame: 2 } },
        lose: { r: 'They catch you at the ford and beat you for the trouble. In the end you buy your way out for {half} and limp home.', fx: { riRansom: 'half', health: -12, happy: -4 } } },
      { t: 'Wait for an exchange of prisoners', r: 'You wait out the season on bad bread and worse water. In the end a clerk trades you for one of theirs.',
        fx: { riRansom: 'wait', health: -6, happy: -6, wil: 1 } },
    ] },

  // queued when an enemy that holds or raids the province of one of your holdings burns it (RI.raidMonth)
  { id: 'ri_burned', title: 'Smoke over {where}', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { const a = p.assets && p.assets[ctx.idx]; if (!a || !a.burnt) ctx.skip = true; },
    text: 'Foragers from {by} came through {where} in the night. Your {asset} is a black shell: the roof is in, the stores are carried off, and whoever worked it has run for the woods. It will pay you nothing until it stands again. The mason says {cost} to do it properly.',
    choices: [
      { t: 'Pay the mason {cost} and rebuild properly', req: (p, C, ctx) => p.coin >= (ctx.costN || 0),
        r: 'Masons, timber and a new roof by the next quarter day. It costs what the mason said, and he is not sorry.', fx: { riRebuild: 'now', happy: 1 } },
      { t: 'Rebuild it yourself for {hands} in timber', check: { s: 'craft', s2: 'str', d: 50 },
        win: { r: 'A summer of your own sweat and borrowed hands. It leans a little, but it stands, and it pays again.', fx: { riRebuild: 'hands', sta: 1 } },
        lose: { r: 'The timber is green and the wall comes down in the first storm. The money is gone; the ruin is still a ruin.', fx: { riRebuild: 'handsFail', happy: -3 } } },
      { t: 'Sell the ruin for {ruin}', r: 'A neighbour with more patience than you buys the ground and the blackened stone. You do not watch him rebuild.', fx: { riRebuild: 'sell', happy: -1 } },
      { t: 'Leave it standing black for now', r: 'It can wait. You can rebuild it from your holdings when there is money for it.', fx: { wil: 1 } },
    ] },

  // queued once a year for a ruling player when the council's loudest push is a law (RI.session)
  { id: 'ri_court_push', title: 'The council presses', trigger: true, cool: 1, npc: true,
    cond: (p, C) => C.ruler(p),
    setup: (p, ctx) => { if (!alive(ctx.pid) || !ctx.push || !ctx.riK) ctx.skip = true; },
    text: '{them}, {seatT}, has the floor and will not give it up: the realm needs {push}. {theyHe} wants {wantT}, and says so twice. {foeName} sits opposite and fears {foeT}. The rest of the council watches to see which of them you favour.',
    choices: [
      { t: 'Grant it', r: 'You nod, and the clerks write it down. {them} sits back, satisfied. Across the table, a pen is put down hard.', fx: { riCourt: 'yes', them: { op: 10 } } },
      { t: 'Refuse it', r: 'You say no, plainly. {them} bows to the crown and does not look at you again that day.', fx: { riCourt: 'no', them: { op: -8 }, wil: 1 } },
      { t: 'Put it off, and send {themHim} a gift', r: 'A cup of chased silver goes to {them} that evening, from your own purse. The matter is let lie, for this year.', fx: { riCourt: 'gift', them: { op: 4 } } },
    ] },

  // an NPC move: a court person who will push for a law asks for your voice first (court.core.js monthly hook)
  { id: 'ri_court_ask', title: 'A word before the sitting', trigger: true, cool: 3, npc: true,
    cond: (p, C) => C.adult(p) && !C.ruler(p),
    setup: (p, ctx) => { const r = A.realm(p.noble ? p.noble.realm : p.realm); if (!alive(ctx.pid) || !r || !r.riAgenda || r.riAgenda.who !== ctx.pid) ctx.skip = true; },
    text: '{them}, {seatT}, takes your arm in the gallery outside the hall. At the next sitting {theyHe} will press for {push}, and wants your voice beside {theirHis}. {wantLine} {foeName} will speak against it.',
    choices: [
      { t: 'Promise your voice', r: '{them} grips your hand and goes in smiling. Your name will be spoken for it.', fx: { riVoice: 'for', them: { op: 8 } } },
      { t: 'Tell {themHim} you will speak against it', r: '{them} lets go of your arm. "Then we know where we stand." You do, now.', fx: { riVoice: 'against', them: { op: -10 }, honor: 1 } },
      { t: 'Promise it, for a consideration', check: { s: 'intrigue', s2: 'ins', d: 50 },
        win: { r: 'A purse of thirty suns finds its way into your hand on the stair. {them} takes your price as proof you are a sensible person.', fx: { riVoice: 'for', coin: 30, honor: -2 } },
        lose: { r: '{them} stiffens. "I asked for a friend, not a merchant." You will not be asked again.', fx: { them: { op: -6 }, honor: -1 } } },
      { t: 'Keep out of it', r: 'You say something about the weather and let {themHim} go in alone.', fx: { wil: 1 } },
    ] },
]);
