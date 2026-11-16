// 999993-crown-crimes: the cards of a crime against a crown (queued by crown.core.js only, never rolled).
A.defEvents([
  {
    id: 'cc_scaffold', title: 'The block', trigger: true, cool: 0, scene: 'grave',
    // only ever queued by a sentence, which fills the verdict; anything else backs out
    setup: (p, ctx) => { if (!ctx.verdict || !ctx.crime || !ctx.judge || !A.P(ctx.pid)) ctx.skip = true; },
    text: 'Dawn in the keep\'s yard. A block, a basket, a crowd kept back by spears. The charge is {crime}. {judge} has spoken: {verdict}',
    choices: [
      { t: 'Plead with {them} for your life',
        r: '',
        fx: (p, ctx) => {
          const C = A.CROWN, rec = C && A.S.crown && A.S.crown.rec[ctx.ri], judge = A.P(ctx.pid);
          const m = C ? C.mercy(p, judge, rec) : 0;
          p.honor = A.clamp((p.honor || 0) - 10, 0, 100);
          if (m > 0 && A.chance(m)) {
            A.imprison(p, 15, 'a commuted sentence');
            if (rec) { rec.verdict = 'prison'; rec.vwhy = 'commuted on the scaffold'; }
            return `${judge ? judge.given : 'The judge'} lifts a hand, and the headsman steps back. Fifteen years in a deep cell instead.`;
          }
          A.pcDeath('the axe, for ' + ctx.crime);
          return m > 0 ? 'He hears you out. Then he nods to the headsman.' : `There is no mercy in ${judge ? judge.given : 'him'} for this, and none comes.`;
        } },
      { t: 'Break for the gate',
        check: { s: 'spd', s2: 'str', d: 78 },
        win: { r: 'An elbow, a gap in the spears, the gate, the river. You are an outlaw with a price on you, but alive.',
          fx: (p, ctx) => { p.flags.outlaw = true; A.ach && A.ach('escaped'); A.exile(p); const b = A.S.crown && A.S.crown.bounty; if (b && !b[p.id]) b[p.id] = { rid: ctx.rid, amt: 400, y: A.S.year, kin: [], vic: null, n: 0 }; return ''; } },
        lose: { r: 'Ten steps. The spears close.', fx: (p, ctx) => { A.pcDeath('the axe, for ' + ctx.crime); return ''; } } },
      { t: 'Go to it with your head up',
        r: 'You say a few plain words. The crowd is quiet for them.',
        fx: (p, ctx) => { A.fame && A.fame(p, 5); A.pcDeath('the axe, for ' + ctx.crime); return ''; } },
    ],
  },
  {
    id: 'cc_verdict', title: 'The verdict', trigger: true, cool: 0, scene: 'court',
    setup: (p, ctx) => { if (!ctx.verdict || !ctx.crime || !ctx.judge || !A.P(ctx.pid)) ctx.skip = true; },
    text: 'They bring you before {judge} in chains. The charge is {crime}. The sentence is given: {verdict}',
    choices: [
      { t: 'Bow your head', r: 'You bow. It is noted.', fx: { honor: -2, them: { op: 5 } } },
      { t: 'Curse {them} before the court', r: 'The court hears every word. So does he.', fx: { honor: 3, fame: 2, them: { op: -20 } } },
    ],
  },
  {
    id: 'cc_avenger', title: 'Someone at the door', trigger: true, cool: 1, npc: true, scene: 'street',
    setup: (p, ctx) => { const t = A.P(ctx.pid); if (!ctx.whyCome || !t || !t.alive) ctx.skip = true; },
    text: '{them} is waiting where the lane narrows, a hand inside the cloak. {whyCome}.',
    choices: [
      { t: 'Draw and fight',
        check: { s: 'melee', s2: 'str', d: 50 },
        win: { r: 'It is short and ugly. You walk away; {them} does not.', fx: (p, ctx) => { const t = A.P(ctx.pid); if (t && t.alive) A.kill(t, 'a fight in a lane'); p.kills = (p.kills || 0) + 1; return ''; } },
        lose: { r: 'Steel finds you before you find yours.', fx: { wound: 'deep_cut', health: -15 } } },
      { t: 'Run, and keep running',
        check: { s: 'spd', s2: 'stealth', d: 45 },
        win: { r: 'You lose {them} in the market crowd. You sleep somewhere else from now on.', fx: { happy: -4 } },
        lose: { r: 'Not fast enough. A blade across the back as you turn.', fx: { wound: 'deep_cut' } } },
      { t: 'Offer coin to walk away',
        req: p => (+p.coin || 0) >= 150,
        r: 'A purse changes hands. {them} counts it twice, and goes. Others will come.',
        fx: { coin: -150, honor: -3 } },
    ],
  },
]);
