// The two scenes of a fatal illness (g-illness.core.js queues them): the fever climbs, and the turn of the fever. The sickness itself
// and its treatment are 49-body-mind's (bm_ill); the check of the turn is on the body and the will, and who is sent for is the choice.
A.defEvents([
  {
    id: 'x3_ill_worse', trigger: true, title: 'The fever climbs',
    cond: p => !!p.ill,
    setup: (p, ctx) => {
      if (!ctx.ill && p.ill) { ctx.ill = p.ill.name; const t = A.BM.the(p.ill.name); ctx.illThe = t[0].toUpperCase() + t.slice(1); }
      const k = A.X3.atTheBed(p); if (k) { ctx.pid = k.p.id; ctx.kin = k.word; }
    },
    text: (p, ctx) => '{illThe} has taken the best of you. You have not kept food down in three days, and the room is kept quiet now. ' + (ctx.pid ? 'You hear {kin} on the stair, speaking low.' : 'Whoever looks in on you does not stay long.'),
    choices: [
      { t: 'Send for the physician now, and pay him', req: p => !!(p.ill && p.ill.t !== 'physician'),
        r: 'He comes in a bad temper, opens a vein and says you should have sent sooner.',
        fx: (p, ctx) => { A.applyFx(p, { coin: -6, coinPct: -0.03 }, ctx); if (p.ill) p.ill.dmg = Math.round(p.ill.dmg * 0.75); } },
      { t: 'Ask for the priest', r: 'He comes with oil and a candle, and stays the night. It is no worse by morning.',
        fx: (p, ctx) => { A.applyFx(p, { piety: 3, happy: 2 }, ctx); if (p.ill) p.ill.dmg = Math.round(p.ill.dmg * 0.92); } },
      { t: 'Tell them it is nothing, and send them from the room', r: 'You hold your face still until the door shuts. Then you stop holding it.',
        fx: { happy: -3, wil: 1 } },
    ],
  },
  {
    id: 'x3_ill_crisis', trigger: true, title: 'The turn of the fever',
    cond: p => !!p.ill,
    setup: (p, ctx) => {
      if (!ctx.ill && p.ill) { ctx.ill = p.ill.name; const t = A.BM.the(p.ill.name); ctx.illThe = t[0].toUpperCase() + t.slice(1); }
      const k = A.X3.atTheBed(p); if (k) { ctx.pid = k.p.id; ctx.kin = k.word; }
    },
    text: (p, ctx) => '{illThe} has brought you to the edge. The candle gutters, and someone is saying your name from a long way off. ' + (ctx.pid ? '{kin} has not left the room. ' : '') + 'Whoever is sent for now is sent for in time, or not at all.',
    choices: [
      { t: 'Send for the physician, whatever it costs', check: { s: 'sta', s2: 'wil', d: 46 },
        win: { r: 'He bleeds you and forces the draught between your teeth. You hold on through the night, and he takes his fee at the door.',
          fx: (p, ctx) => { A.applyFx(p, { coin: -8, coinPct: -0.05 }, ctx); return A.X3.mend(p); } },
        lose: { r: 'He comes too late, or the draught does nothing. The room goes quiet before dawn.', fx: (p, ctx) => A.X3.die(p, ctx) } },
      { t: 'Have the priest say the rites over you', check: { s: 'wil', s2: 'int', d: 56 },
        win: { r: 'The old words go on and on, and somewhere in them you stop sliding. The priest is still on his knees when you wake.',
          fx: (p, ctx) => { A.applyFx(p, { piety: 4 }, ctx); return A.X3.mend(p); } },
        lose: { r: 'He says the words to the end, and you hear them all. They are said over you as you go.', fx: (p, ctx) => A.X3.die(p, ctx) } },
      { t: 'Have {kin} sit by the bed', req: (p, C, ctx) => !!(ctx && ctx.pid), check: { s: 'wil', s2: 'sta', d: 50, bonus: () => 6 },
        win: { r: 'A hand holds yours the whole night. When the fever breaks it is still there, and it is wet.',
          fx: (p, ctx) => { A.applyFx(p, { them: { op: 12 } }, ctx); return A.X3.mend(p); } },
        lose: { r: 'A hand holds yours the whole night. It is still holding yours when it is over.', fx: (p, ctx) => A.X3.die(p, ctx) } },
    ],
  },
]);
