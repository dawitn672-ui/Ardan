// W1-4: the lot, the proclamation and the term's end, as the player meets them. Queued by e-player.core.js (A.CALLS):
// mn_lot when a call reaches a commoner's parish and his hearth is drawn; mn_proclaim and mn_release for a ruler.
A.defEvents([
  { id: 'mn_lot', title: 'The lot', trigger: true, cool: 1, scene: 'street',
    cond: (p, C) => C.adult(p) && C.male(p) && !C.noble(p) && !C.soldier(p),
    setup: (p, ctx) => { if (!ctx.cid || !A.CALLS || !A.CALLS.byId(ctx.cid) || A.CALLS.byId(ctx.cid).end) ctx.skip = true; },
    text: '{realm} has proclaimed {callT}: {hearthT} sends a man, by lot, for {termT}. {needT}. The reeve draws the parish\'s lots at the church door, and your hearth\'s comes up. The muster-men come at dawn.',
    choices: [
      { t: 'Go when the drum beats', r: 'You take the spear they hand you and fall in with the other men of the parish. Nobody asks whether you can use it.', fx: { mnLot: 'go', honor: 1, happy: -3 } },
      { t: 'Pay for a substitute', req: (p, C, ctx) => p.coin >= (ctx.subN || 0), r: 'A poorer man takes your place for {subT}. It is lawful. The parish watches who paid, and who went instead.', fx: { mnLot: 'sub', honor: -2 } },
      { t: 'Hide in the loft until the muster-men pass', check: { s: 'stealth', s2: 'wil', d: 45 },
        win: { r: 'They count the hearth and find a woman and a cold bed. They move on to the next door. Your neighbours know.', fx: { mnLot: 'hid', honor: -1, happy: -2 } },
        lose: { r: 'They find you behind the hay. You go anyway, with a fine on the hearth and a sergeant who remembers your face.', fx: { mnLot: 'go', coin: -20, happy: -6 } } },
      { t: 'Take to the roads before dawn', r: 'You leave with a loaf and a knife. Your name goes on the list of runaways, and no recruiter will take it again.', fx: { mnLot: 'flee', happy: -5, family: -4, skill: { survival: 2 } } },
    ] },
  { id: 'mn_proclaim', title: 'A call to arms', trigger: true, cool: 1, scene: 'court',
    cond: (p, C) => C.ruler(p),
    setup: (p, ctx) => { if (!ctx.rid || !A.realm(ctx.rid) || !A.atWar(ctx.rid).length) ctx.skip = true; },
    text: 'Your council lays it before you: {needT}. The roll alone will not answer it. A call by lot takes men from the fields, and the parishes remember every call. Against it: {againstT}. The law lets you go as far as {lawT} without the lords.',
    choices: [
      { t: 'No call: the standing men and the roll must do', r: 'No proclamation goes out. The harvest is safe. The lords and the towns watch a crown that would not call its people while the enemy came on.', fx: { mnCall: 0, legit: -2 } },
      { t: 'The first call: {c1T}', r: 'The proclamation is read in every market. One hearth in twenty draws a lot, and the fields lose a few hands in every hundred.', fx: { mnCall: 1, stability: -1 } },
      { t: 'The second call: {c2T}', req: (p, C, ctx) => (ctx.deg || 0) >= 2, r: 'One hearth in ten. The reeves work by candlelight. Twice the hands go from the fields, and the grumbling starts before the drums.', fx: { mnCall: 2, stability: -2 } },
      { t: 'The last call: {c3T}', req: (p, C, ctx) => (ctx.deg || 0) >= 3, r: 'One hearth in five, while the enemy stands on your soil. Every village sends its men. The harvest will be thin, and nobody will forget it.', fx: { mnCall: 3, stability: -3 } },
    ] },
  { id: 'mn_release', title: 'The conscripts of {yT}', trigger: true, cool: 1, scene: 'court',
    cond: (p, C) => C.ruler(p),
    setup: (p, ctx) => { if (!ctx.cid || !A.CALLS || !A.CALLS.byId(ctx.cid) || A.CALLS.byId(ctx.cid).end) ctx.skip = true; },
    text: '{whyT} {menT} conscripts called in {yT} are still with the colours. The Generals would keep them. The reeves say the fields want them, and the men say they were promised home.',
    choices: [
      { t: 'Send them home', r: 'The companies break up on the roads home. They go back to the plough with a story and without pay.', fx: { mnRelease: 'release' } },
      { t: 'Send them home with a bounty of {bountyT}', req: (p, C, ctx) => { const r = A.realm(p.ruler); return !!r && (r.treasury || 0) >= (ctx.bountyN || 0); }, r: 'Every man gets a coin at the gate. It does not make the call loved, but it is remembered as fair.', fx: { mnRelease: 'bounty' } },
      { t: 'Hold them with the colours', r: 'The order goes out: they stay. The sergeants read it to sullen ranks. A promise broken is the heaviest thing a call leaves behind.', fx: { mnRelease: 'hold', stability: -2 } },
    ] },
]);
