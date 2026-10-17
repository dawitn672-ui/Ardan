// Two scales at once (signature system 3; Road to Ten, Uniqueness 4: "a nobody in a 200-division war who feels the
// squad and the front together. Make this the trailer moment").
//
// When a soldier, file-leader, sergeant or squad captain is in a war-map fight and takes his place in the line, the
// release played a line battle of four choices in one sitting, then made up a second battle beside the real one (its
// own armies, its own dead, its own war score). Now the line battle is the real fight, day by day:
//
//  - the morning after the first day: the arrows and the clash, two choices; then each further day of the fight (up
//    to TS.LINES) one choice, read from the front (a flank giving way, their line breaking, or a line that only bends);
//    and when the fight ends, the break (the release's chase, rout and rearguard). The clock runs between them: the
//    war map resolves its day (A.fightDay), and the next scene shows what it did.
//  - every choice acts on both scales through the existing resolvers. The front: a performance per choice goes into
//    44-rank-battles' A.RANKFX.apply, which moves the order of every division in the fight; the fight is then decided
//    by the engine. Your body: a fight in the press is rolled on 48-fight-ladder's FL.resolve (you and the men beside
//    you against your corner of their line). Your formations: locking shields and falling back in order are offered
//    only when 60-drill says your division has drilled them, and their odds grow with the drill. The squad: the men
//    beside you (37-squad's named comrades) live or die by what you chose and the dice; a man hit by an arrow lives if
//    someone drags him back.
//  - the scene's front is a snapshot of the real fight taken by the engine (divisions, order, men, the general's plan
//    from 38-orders), so drawing it reads plain data.
//  - when it ends, 34-both-scales' three panels follow (queued if 34's own spacing would have skipped them), and the
//    story log gets a line that names a comrade and the front together, which the Chronicle (22) keeps.
//  - a commoner whose home province is fought over is called to the levy (the honest equivalent for a life outside
//    the army): the same fight, with neighbours for a squad and a smaller layer on the front.
//
// Engine side: A.CHOICE_FN.wsLine and .tsLevy start it; A.missionView, A.missionChoose, A.stageOutcome, A.missionFinish
// and A.missionClose are wrapped for a mission that carries m.ts; A.fightEnd notes the end; A.onDay brings the scene
// back each day of the fight. Between days the mission waits in A.S.tsq (it holds no clock: the war goes on).
(function () {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const r2 = x => Math.round(x * 100) / 100;
  const hash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const pickH = (arr, key) => arr[hash(key) % arr.length];
  const TS = A.TS = {
    MEN: 2500,        // the fight must be this big (the release asks a soldier from 2,500 men)
    LINES: 2,         // days of the line between the clash and the end, at most
    HIT: 0.5,         // a man beside you is hit in the arrow storm this often
    BLEED: 0.4,       // a man hit by an arrow and left where he fell dies of it this often
    LEVY_GAP: 300,    // days between calls to the levy at least
    MAXRUN: 14,       // days the scene's "go on" runs the clock, at most, before it hands back
  };
  TS.ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];
  TS.dayWord = n => TS.ORD[n - 1] || A.ordinal(n);
  // the levy is a smaller layer on the front than a soldier's section: the town's men beside a garrison
  if (A.RANKFX && A.RANKFX.LAYERS && A.RANKFX.LAYERS.line && !A.RANKFX.LAYERS.levy) {
    const L = A.RANKFX.LAYERS.line;
    A.RANKFX.LAYERS.levy = { name: 'the levy', theirs: r2(L.theirs * 0.6), ours: r2(L.ours * 0.6), fall: r2(L.fall * 0.6) };
  }
  // an officer's days after his tactical battle (44's 'part' layer moved the fight already on the first day): half of it
  if (A.RANKFX && A.RANKFX.LAYERS && A.RANKFX.LAYERS.part && !A.RANKFX.LAYERS.company) {
    const L = A.RANKFX.LAYERS.part;
    A.RANKFX.LAYERS.company = { name: 'your company', theirs: r2(L.theirs * 0.5), ours: r2(L.ours * 0.5), fall: r2(L.fall * 0.5) };
  }

  // ---- who and where ------------------------------------------------------------------------------------------------
  TS.on = m => !!(m && m.ts && typeof m.ts === 'object');
  TS.near = m => (m.ts.men || []).map(A.P).filter(p => p && p.alive && m.ts.state[p.id] !== 'back');
  TS.liveFight = m => { const F = (A.S.fights || {})[m.ts.pid]; return F && F.key === m.ts.key && F.start === m.ts.start ? F : null; };
  TS.realmOf = pc => (pc.mil ? pc.mil.realm || pc.realm : pc.realm);
  // a soldier's army and its general's plan (38-orders), or the levy's (the army of the division it stands with)
  TS.armyOf = function (m, pc) {
    const G = A.GENERALS;
    if (G && pc.mil && !m.ts.levy) { const f = G.armyFor(pc); if (f && f.a) return f.a; }
    const d = A.divById(m.ts.div);
    return d && d.army ? A.army(d.army) : null;
  };
  TS.plan = function (m, pc, F) {
    const G = A.GENERALS, a = TS.armyOf(m, pc), S = A.S, P = S.prov[F.loc];
    if (!G || !a) return null;
    const g = A.P(a.gen), pl = a.gtPlan || {}, t = G.of(a);
    const at = (pl.at || []).map(j => S.prov[j]).filter(Boolean).slice(0, 2).map(Q => ({ n: Q.name, here: Q.id === F.loc ? 1 : 0, dx: Math.round(Q.sx - P.sx), dy: Math.round(Q.sy - P.sy) }));
    const hold = pl.hold != null && S.prov[pl.hold] ? { n: S.prov[pl.hold].name, here: pl.hold === F.loc ? 1 : 0, dx: Math.round(S.prov[pl.hold].sx - P.sx), dy: Math.round(S.prov[pl.hold].sy - P.sy) } : null;
    return { gen: g ? A.fullName(g, false) : '', temper: G.NAMES[t] || '', text: G.planText(a), at, hold };
  };
  // the front as plain data: every division that came into the fight, its order, its men, and who is still in it
  TS.snap = function (m, F) {
    const pc = A.pc(), out = [], ids = (F.aIds || []).concat(F.dIds || []);
    const live = !!((A.S.fights || {})[F.loc] && A.S.fights[F.loc].key === F.key);   // after the end: who is still near the field
    let oO = 0, oT = 0;
    for (const id of ids) {
      const att = F.aIds.includes(id), ours = att === !!m.ts.weAtt, d = A.divById(id);
      if (!d) { out.push({ id, n: '', ours: ours ? 1 : 0, men: 0, o: 0, cat: 'foot', me: 0, gone: 1, r: '' }); continue; }
      const here = live ? (att ? d.atk === F.loc : d.loc === F.loc) : d.men > 0 && (d.loc === F.loc || A.adjacent(d.loc, F.loc)) && d.org > 0.02 * (A.divMaxOrg(d) || 1), mo = Math.max(1, A.divMaxOrg(d) || 1), s = A.divS(d) || {};
      if (here) { if (ours) oO += d.org; else oT += d.org; }
      out.push({ id, n: d.name || '', r: d.r, men: Math.round(d.men), o: r2(clamp(d.org / mo, 0, 1)), ours: ours ? 1 : 0, cat: s.main || 'foot', me: id === m.ts.div ? 1 : 0, gone: here ? 0 : 1 });
    }
    const WT = k => (A.WTAC && A.WTAC[k] ? A.WTAC[k].n : '');
    const P = A.S.prov[F.loc] || {};
    // laid out along the strip from the middle: yours in the centre of your side and the rest beside it in the order
    // they came in, theirs biggest in the middle; so "beside you" on the strip is beside you in the scene
    const centre = list => { const o = []; list.forEach((d, i) => { if (i % 2) o.unshift(d); else o.push(d); }); return o; };
    const ours = out.filter(d => d.ours), theirs = out.filter(d => !d.ours).sort((a, b) => b.men - a.men || (a.id < b.id ? -1 : 1));
    const mi = ours.findIndex(d => d.me), ordered = mi >= 0 ? [ours[mi]].concat(ours.filter((d, i) => i !== mi)) : ours;
    return {
      day: F.days, divs: centre(ordered).concat(centre(theirs)), share: r2(oO + oT > 0 ? oO / (oO + oT) : 0.5),
      dead: [Math.round(m.ts.weAtt ? F.deadA : F.deadD), Math.round(m.ts.weAtt ? F.deadD : F.deadA)],
      men: [Math.round(m.ts.weAtt ? F.menA : F.menD), Math.round(m.ts.weAtt ? F.menD : F.menA)],
      tac: [WT(m.ts.weAtt ? F.tacA : F.tacD), WT(m.ts.weAtt ? F.tacD : F.tacA)],
      rout: F.rout ? ((F.rout === 'att') === !!m.ts.weAtt ? 'ours' : 'theirs') : '',
      terr: P.terr || 'plains', plan: pc ? TS.plan(m, pc, F) : null,
    };
  };
  TS.resnap = function (m, F) { F = F || TS.liveFight(m); if (!F) return; m.ts.prev = m.ts.front; m.ts.front = TS.snap(m, F); };
  // a division of ours beside mine that is giving way, or one of theirs that has broken
  TS.crisis = function (m) {
    const fr = m.ts.front; if (!fr) return null;
    const live = fr.divs.filter(d => !d.gone), ours = live.filter(d => d.ours), mine = ours.findIndex(d => d.me);
    const near = (list, i) => list.map((d, k) => [d, Math.abs(k - (i < 0 ? 0 : i))]).sort((a, b) => a[1] - b[1]).map(x => x[0]);
    const flank = near(ours, mine).find(d => !d.me && d.o < 0.3);
    if (flank) return { k: 'flank', d: flank, side: ours.indexOf(flank) < mine ? 'left' : 'right' };
    const theirs = live.filter(d => !d.ours), broke = theirs.slice().sort((a, b) => a.o - b.o)[0];
    if (broke && broke.o < 0.3) return { k: 'breach', d: broke };
    return null;
  };

  // ---- the drill (60-drill): the division's own record, or what an officer drilled into his share of it -----------
  TS.drill = function (m, pc, k) {
    const D = A.DRILL;
    if (!D || m.ts.levy) return m.ts.levy ? 0.05 : 0.4;
    const mine = D.mine ? D.mine(pc) : null;
    if (mine && typeof mine[k] === 'number') return mine[k];
    const d = A.divById(m.ts.div);
    return d ? D.of(d)[k] || 0 : 0.4;
  };
  TS.drillOk = (m, pc, k) => TS.drill(m, pc, k) >= (A.DRILL ? A.DRILL.GATE : 0.15);
  TS.drillBonus = (m, pc, k) => (A.DRILL ? Math.round(25 * (A.DRILL.scale(TS.drill(m, pc, k)) - 1)) : 0);

  // ---- the scenes ---------------------------------------------------------------------------------------------------
  // each choice: t (label), tag, check [k1, k2] and diff (the release's mission check, A.missionOdds), or body (the
  // fight ladder), or drill (a formation); pf [tier 0..3] (the performance it sends to the front), risk [failed,
  // done] (each man beside you), hurt (your own chance of a wound when it goes wrong), win / lose (what happens)
  const weapon = pc => (pc.mil && GD.TROOP_SKILL && GD.TROOP_SKILL[pc.mil.troop]) || 'spear';
  const nameOf = (p, dflt) => (p ? p.given : dflt);
  // what each choice sends to the front (pf, by the roll's tier 0..3: a failure, a near miss, done, done well) and what
  // it risks for each man beside you (risk: [failed, done]). Going forward moves the line even when it goes wrong for
  // you (the men went forward); running takes your stretch of the line with you whatever the dice say. The dice decide
  // mostly your body and your men. Calibrated with features/72-two-scales/bench.mjs (README).
  const FX = TS.FX = {
    wall: { pf: [-0.1, 0.05, 0.25, 0.35], risk: [0.05, 0.02] }, cover: { pf: [-0.1, -0.05, 0, 0.05], risk: [0.06, 0.02] },
    drag: { pf: [-0.3, -0.25, -0.2, -0.2], risk: [0.04, 0.02] }, front: { pf: [0.1, 0.25, 0.5, 0.65], risk: [0.12, 0.05] },
    push: { pf: [0.15, 0.3, 0.6, 0.75], risk: [0.13, 0.05] }, hold: { pf: [-0.1, 0.05, 0.25, 0.35], risk: [0.06, 0.02] },
    rally: { pf: [-0.05, 0.1, 0.35, 0.45], risk: [0.06, 0.03] }, sarge: { pf: [-0.05, 0.05, 0.25, 0.3], risk: [0.05, 0.03] },
    break: { pf: [-1, -1, -0.85, -0.85], risk: [0.13, 0.07] },
    hold2: { pf: [-0.1, 0, 0.2, 0.3], risk: [0.05, 0.02] }, reinforce: { pf: [0.1, 0.25, 0.5, 0.65], risk: [0.13, 0.05] },
    withdraw: { pf: [-0.3, -0.2, -0.1, -0.05], risk: [0.04, 0.01] }, withdraw2: { pf: [-0.5, -0.4, -0.25, -0.2], risk: [0.06, 0.02] },
    breach: { pf: [0.05, 0.2, 0.5, 0.6], risk: [0.11, 0.04] }, strip: { pf: [-0.4, -0.4, -0.3, -0.3], risk: [0.03, 0.01] },
    push2: { pf: [0.1, 0.25, 0.45, 0.6], risk: [0.11, 0.04] }, rest: { pf: [-0.15, -0.05, 0.1, 0.15], risk: [0.02, 0.01] },
    sarge2: { pf: [-0.05, 0.05, 0.2, 0.3], risk: [0.05, 0.02] },
  };
  TS.STAGE = {};
  TS.STAGE.ts_arrows = function (m, pc) {
    const near = TS.near(m), mate = near[0], hurt = A.P(m.ts.hurt), fr = m.ts.front || { divs: [] };
    const ours = fr.divs.filter(d => d.ours && !d.gone), mi = ours.findIndex(d => d.me), nb = ours[mi - 1] || ours[mi + 1];
    const day = TS.dayWord((fr.day || 1) + 1), unit = m.ts.levy ? 'the levy behind the ' + m.ts.divName : 'the ' + m.ts.divName;
    const went = fr.share >= 0.56 ? 'Yesterday went your way; their dead are still lying where the line was.' : fr.share <= 0.44 ? 'Yesterday went theirs. The line is a hundred paces back from where it stood.' : 'Yesterday settled nothing.';
    const text = `The ${day} day at ${m.place}. ${went} You stand in the third rank of ${unit}, ${mate ? mate.given + ' at your shoulder' : 'with strangers on both sides'}. ` +
      (nb ? `The ${nb.n} has its standard up beside yours; past it there is only dust. ` : '') +
      `Their arrows come over in sheets, with a sound like tearing cloth.` + (hurt && hurt.alive ? ` ${hurt.given} goes down with a shaft in ${A.his(hurt)} thigh and does not get up.` : '');
    const ch = [];
    if (TS.drillOk(m, pc, 'shields')) ch.push({ t: 'Lock shields with the men beside you', tag: 'wall', check: ['shield', 'wil'], diff: 44, drill: 'shields', pf: FX.wall.pf, risk: FX.wall.risk, hurt: 0.5,
      win: 'The rims meet and hold. Arrows knock on the wood like hail on a roof.', lose: 'The wall opens where the man on your left flinches.', hint: 'Steadies the line a little. You drilled it.' });
    else ch.push({ t: 'Get your shield up and your head down', tag: 'cover', check: ['shield', 'wil'], diff: 46, pf: FX.cover.pf, risk: FX.cover.risk, hurt: 0.5,
      win: 'You crouch under the rim and count. None of them finds you.', lose: 'A shaft comes through the shield and into your forearm.', hint: 'You never drilled the wall. This keeps you alive, not the line.' });
    if (hurt && hurt.alive) ch.push({ t: `Drag ${hurt.given} back through the ranks`, tag: 'drag', check: ['str', 'medicine'], diff: 45, pf: FX.drag.pf, risk: FX.drag.risk, hurt: 0.5, save: hurt.id,
      win: `You get ${hurt.given} to the surgeons' cart with the shaft still in. ${A.cap(A.he(hurt))} will live.`, lose: `Halfway back an arrow takes you in the shoulder, and you have to leave ${hurt.given}.`, hint: `Saves ${hurt.given} if it works. The line is a man short while you go.` });
    ch.push(pc.mil && pc.mil.rank >= 2
      ? { t: 'Take the section up into the front rank', tag: 'front', check: ['command', 'wil'], diff: 50, pf: FX.front.pf, risk: FX.front.risk, hurt: 0.6,
        win: 'You push them up into the gaps and the front rank closes. Someone behind you cheers, and stops.', lose: 'Half of them follow you. The other half do not, and the front rank is ragged.', hint: 'Moves the line most. The men beside you go where you go.' }
      : { t: m.ts.levy ? "Follow the garrison sergeant into the front rank" : 'Follow the sergeant into the front rank', tag: 'front', check: ['wil', 'sta'], diff: 48, pf: FX.front.pf, risk: FX.front.risk, hurt: 0.6,
        win: 'You fill a dead man\'s place in the front rank. The line there stops wavering.', lose: 'You reach the front rank as it buckles, and are carried back with it.', hint: 'Moves the line most. The men beside you go where you go.' });
    return { text, choices: ch };
  };
  TS.STAGE.ts_clash = function (m, pc) {
    const near = TS.near(m), mate = near[0], fell = (m.ts.fell || []).slice(-1)[0];
    const foe = m.enemyName === 'bandits' ? 'an outlaw' : `a man of ${m.enemyName}`;
    const text = `The lines meet. The shove comes through the shields and into your teeth. In front of you ${foe} has lost his helmet and is trying to work his spear free.` +
      (fell ? ` On your left there is a gap where ${fell.n} stood, and nobody has closed it.` : mate ? ` ${mate.given} is saying something under ${A.his(mate)} breath, the same few words over and over.` : '') +
      ' Somewhere to the right a horn keeps blowing the same three notes.';
    const allies = Math.min(2, near.length);
    const ch = [
      { t: allies ? `Push into the gap with ${near.slice(0, allies).map(p => p.given).join(' and ')} behind you` : 'Push into the gap alone', tag: 'push', body: { scale: 'army', tier: 2, n: 3, allies }, check: [weapon(pc), 'str'], pf: FX.push.pf, risk: FX.push.risk, hurt: 0.7, kill: 1,
        win: 'You go through, and the men follow you. Their line bends back around the hole.', lose: 'You push into the gap and find it full of spears.', hint: 'Moves the front most. Rolled on your fighting worth and the men with you.' },
      { t: TS.drillOk(m, pc, 'shields') ? 'Hold your place and keep the wall tight' : 'Hold your place in the press', tag: 'hold', check: ['shield', 'sta'], diff: 46, drill: TS.drillOk(m, pc, 'shields') ? 'shields' : null, pf: FX.hold.pf, risk: FX.hold.risk, hurt: 0.5,
        win: 'The wall holds around you. You stab low, under the rims, until your arm is numb.', lose: 'The wall buckles; you are shoved back and trodden on.', hint: 'Holds the line. The men beside you are safer for it.' },
      pc.mil && pc.mil.rank >= 2
        ? { t: 'Rally the section on the standard', tag: 'rally', check: ['command', 'wil'], diff: 48, pf: FX.rally.pf, risk: FX.rally.risk, hurt: 0.5,
          win: 'They come in on your voice and the standard. The section is a fist again.', lose: 'Nobody can hear you over the noise.', hint: 'Moves the line, and keeps the section together.' }
        : { t: m.ts.levy ? 'Stay with the garrison sergeant' : 'Go where the sergeant goes', tag: 'sarge', check: ['wil', 'ins'], diff: 42, pf: FX.sarge.pf, risk: FX.sarge.risk, hurt: 0.45,
          win: 'He knows where the line is weak before it knows. You plug two holes behind him.', lose: 'You lose him in the press and fight where you stand.', hint: 'His judgement, not yours. Steady, and never the most.' },
      { t: 'Break and run for the rear', tag: 'break', check: ['spd', 'sta'], diff: 45, pf: FX.break.pf, risk: FX.break.risk, hurt: 0.7, honor: [-4, -4],
        win: 'You get clear. Behind you the place where you stood is empty, and men are pouring through it.', lose: 'You turn, and a man on a horse is already there.', hint: 'Takes your part of the line with you. The others are left in it.' },
    ];
    return { text, choices: ch };
  };
  TS.STAGE.ts_line = function (m, pc) {
    const near = TS.near(m), mate = near[0], cr = TS.crisis(m), day = TS.dayWord((m.ts.front && m.ts.front.day || 2) + 1);
    const allies = Math.min(2, near.length);
    const hold = { t: 'Hold where you are', tag: 'hold', check: ['shield', 'sta'], diff: 46, drill: TS.drillOk(m, pc, 'shields') ? 'shields' : null, pf: FX.hold2.pf, risk: FX.hold2.risk, hurt: 0.45,
      win: 'You hold. Your part of the line is the one nobody has to worry about.', lose: 'You hold, but the men beside you are pushed back, and you with them.', hint: 'Holds your stretch. Moves little.' };
    if (cr && cr.k === 'flank') {
      const text = `The ${day} day. Word comes down the line, shouted from man to man: the ${cr.d.n} on your ${cr.side} is giving way. You can see its standard leaning. Their horse is already working round that end.`;
      const ch = [
        { t: `Take the section across to the ${cr.d.n}`, tag: 'reinforce', body: { scale: 'army', tier: 2, n: 3, allies }, check: [weapon(pc), 'sta'], pf: FX.reinforce.pf, risk: FX.reinforce.risk, hurt: 0.65, kill: 1,
          win: `You reach the ${cr.d.n} as it bends, and it does not break.`, lose: 'You arrive in the middle of it giving way.', hint: 'Can save the flank. Rolled on your fighting worth and the men with you.' },
        TS.drillOk(m, pc, 'formation')
          ? { t: 'Fall back with the line, step by step', tag: 'withdraw', check: ['tactics', 'sta'], diff: 46, drill: 'formation', pf: FX.withdraw.pf, risk: FX.withdraw.risk, hurt: 0.3,
            win: 'You go back in step, shields to the front. Nobody runs.', lose: 'The step turns into a shove, and the shove nearly into a rout.', hint: 'Gives ground, keeps the men. You drilled it.' }
          : { t: 'Fall back with the men around you', tag: 'withdraw', check: ['wil', 'sta'], diff: 50, pf: FX.withdraw2.pf, risk: FX.withdraw2.risk, hurt: 0.35,
            win: 'You go back together, more or less.', lose: 'Without a drill to it, going back becomes running.', hint: 'Gives ground. You never drilled a withdrawal.' },
        hold,
      ];
      return { text, choices: ch };
    }
    if (cr && cr.k === 'breach') {
      const text = `The ${day} day. Their ${cr.d.n} has broken. Men are going back over their own dead, and the gap in their line is open for anyone who wants it.`;
      const ch = [
        { t: 'Go into the breach with the line', tag: 'breach', body: { scale: 'army', tier: 2, n: 3, allies }, check: [weapon(pc), 'spd'], pf: FX.breach.pf, risk: FX.breach.risk, hurt: 0.6, kill: 1,
          win: 'You go through the gap, and their line falls apart on both sides of you.', lose: 'The gap closes behind you.', hint: 'Turns their break into a rout, if it works.' },
        hold,
        { t: 'Strip the dead while the line moves on', tag: 'strip', check: ['int', 'str'], diff: 30, pf: FX.strip.pf, risk: FX.strip.risk, hurt: 0.2, coin: [3, 40],
          win: 'Rings, a purse, a good knife.', lose: 'A sergeant catches you at it.', hint: 'Coin for you. The line goes on without you.' },
      ];
      return { text, choices: ch };
    }
    const fr = m.ts.front || {}, pv = m.ts.prev || fr, way = (fr.share || 0.5) - (pv.share || 0.5);
    const text = `The ${day} day. The line has moved a spear's length ${way >= 0 ? 'forward' : 'back'} since yesterday, and nobody has slept.` + (mate ? ` ${mate.given} shares out the last of the bread.` : '') + ' The drums start again before it is light.';
    const ch = [
      { t: 'Push with the front rank', tag: 'push', body: { scale: 'army', tier: 2, n: 3, allies }, check: [weapon(pc), 'str'], pf: FX.push2.pf, risk: FX.push2.risk, hurt: 0.6, kill: 1,
        win: 'Their front rank goes back a step, then three.', lose: 'They are fresher than you are.', hint: 'Moves the front. Rolled on your fighting worth and the men with you.' },
      hold,
      pc.mil && pc.mil.rank >= 2
        ? { t: 'Rest the section in turns behind the line', tag: 'rest', check: ['command', 'int'], diff: 44, pf: FX.rest.pf, risk: FX.rest.risk, hurt: 0.2,
          win: 'Half sleep while half stand. By noon they are worth twice what they were.', lose: 'The ones you send back do not come forward again.', hint: 'Keeps the men alive. Moves little.' }
        : { t: m.ts.levy ? 'Stay with the garrison sergeant' : 'Go where the sergeant goes', tag: 'sarge', check: ['wil', 'ins'], diff: 42, pf: FX.sarge2.pf, risk: FX.sarge2.risk, hurt: 0.4,
          win: 'He puts you where it matters, and you stay there.', lose: 'He is carried off with a cut head, and you stand on your own.', hint: 'His judgement, not yours. Steady.' },
    ];
    return { text, choices: ch };
  };
  // an officer (captain to commander) gives his company the order instead of going in himself: the same choices, rolled
  // on his command, not on his own fighting worth
  const OFFICER = {
    push: ['Order the company forward', ['command', 'tactics'], 48], reinforce: [null, ['command', 'tactics'], 50],
    breach: ['Send the company into the breach', ['command', 'tactics'], 50], hold: ['Hold the company where it stands', ['command', 'wil'], 44],
    withdraw: ['Pull the company back in order', ['command', 'tactics'], 46], strip: ['Let the men strip the dead', ['command', 'int'], 30],
  };
  const lineBase = TS.STAGE.ts_line;
  TS.STAGE.ts_line = function (m, pc) {
    const v = lineBase(m, pc);
    if (!m.ts.officer) return v;
    v.choices = v.choices.map(c => {
      const o = OFFICER[c.tag]; if (!o) return c;
      const out = Object.assign({}, c, { check: o[1], diff: o[2] });
      if (o[0]) out.t = o[0]; else out.t = c.t.replace(/^Take the section across to/, 'Wheel the company onto');
      delete out.body;
      out.hint = String(c.hint || '').replace(' Rolled on your fighting worth and the men with you.', ' Rolled on your command.');
      return out;
    });
    return v;
  };
  // the break: the release's own six choices (chase, tend, loot; run, rearguard, surrender), read from the real end
  TS.STAGE.ts_break = function (m, pc) {
    const e = m.ts.end || {}, won = e.won;
    if (won === 1) return { text: `A shout runs down the line and keeps going: they are breaking. The men of ${m.enemyName} turn and run, throwing away their shields.`, choices: [
      { t: 'Chase them down while they run', tag: 'chase', check: ['spd', 'sta'], diff: 42 },
      { t: 'Stay with the wounded', tag: 'tend', check: ['medicine', 'wil'], diff: 35 },
      { t: 'Strip the dead for loot', tag: 'loot', check: ['int', 'str'], diff: 30 }] };
    if (won === 0) return { text: 'The rear ranks edge back. Then the whole line goes, and you go with it.', choices: [
      { t: 'Run for the trees', tag: 'run', check: ['spd', 'sta'], diff: 48 },
      { t: 'Stand with the rearguard and cover the retreat', tag: 'rearguard', check: ['wil', 'shield'], diff: 56 },
      { t: 'Throw down your weapon and surrender', tag: 'surrender', check: ['diplomacy', 'wil'], diff: 40 }] };
    return { text: 'The fighting stops at dusk and does not start again. Nobody tells you why.', choices: [
      { t: 'Stay with the wounded', tag: 'tend', check: ['medicine', 'wil'], diff: 35 },
      { t: 'Strip the dead for loot', tag: 'loot', check: ['int', 'str'], diff: 30 }] };
  };
  for (const k in TS.STAGE) A.STAGES[k] = (m, pc) => TS.STAGE[k](m, pc);

  // a scene's choices with their odds, and what the fight ladder measured (pure: m.cur is set by the engine)
  TS.view = function (m) {
    const pc = A.pc(), st = m.stages[m.stage], f = TS.STAGE[st];
    if (!pc || !f) return null;
    const v = f(m, pc), FL = A.FL;
    const choices = v.choices.map(c0 => {
      const c = Object.assign({ duel: 0, mate: null, cost: 0, langCheck: false }, c0);
      if (c.body && FL && FL.resolve) {
        const R = FL.resolve(pc, c.body, {}, null);
        c.odds = clamp(R.pct, 5, 95);
        try { c.measure = FL.measureText(pc, c.body, {}, null); } catch (e) {}
      } else {
        c.odds = A.missionOdds(pc, m, c);
        if (c.drill) { c.odds = clamp(c.odds + TS.drillBonus(m, pc, c.drill), 5, 95); c.drillV = r2(TS.drill(m, pc, c.drill)); c.drillW = A.DRILL ? A.DRILL.word(c.drillV) : ''; }
      }
      return c;
    });
    return { text: v.text, choices };
  };

  // ---- starting it --------------------------------------------------------------------------------------------------
  TS.begin = function (pc, F, o) {
    const S = A.S, P = S.prov[F.loc];
    const weAtt = F.aIds.includes(o.div) ? true : F.dIds.includes(o.div) ? false : A.hostile(F.b, o.realm);
    A._battlePlace = F.loc;
    let m;
    try { m = A.newLineBattle(pc, F.war, o.enemy); } finally { A._battlePlace = null; }
    const d = A.divById(o.div);
    m.place = P.name; m.title = 'Battle of ' + P.name; m.terr = P.terr;
    m.armyA = Math.round(weAtt ? F.menA : F.menD); m.armyB = Math.round(weAtt ? F.menD : F.menA);
    m.stages = ['ts_arrows', 'ts_clash', 'ts_break'];
    const men = o.men.slice(0, 3);
    m.ts = { v: 1, key: F.key, pid: F.loc, start: F.start, day: F.days, weAtt: weAtt ? 1 : 0, realm: o.realm, div: o.div, divName: d ? d.name : 'line',
      layer: o.levy ? 'levy' : o.officer ? 'company' : 'line', levy: o.levy ? 1 : 0, officer: o.officer ? 1 : 0, men, state: {}, fell: [], perf: 0, lines: 0, rounds: [], front: null, prev: null, hurt: null, end: null, parked: 0 };
    for (const id of men) m.ts.state[id] = 'ok';
    m.ts.front = TS.snap(m, F);
    TS.prepare(m);
    pc.tsN = (pc.tsN || 0) + 1;
    if (!TS.liveFight(m)) pc.tsShortN = (pc.tsShortN || 0) + 1;
    if (o.levy) pc.tsLevyN = (pc.tsLevyN || 0) + 1;
    return m;
  };
  // the scene's dice that the view must not draw: who is hit in the arrow storm
  TS.prepare = function (m) {
    const st = m.stages[m.stage], near = TS.near(m);
    m.ts.hurt = st === 'ts_arrows' && near.length && A.chance(TS.HIT) ? A.pick(near).id : null;
    m.mates = near.map(p => p.id);
    m.cur = null;
    m.cur = TS.view(m);
  };
  const lineFn = A.CHOICE_FN.wsLine;
  A.CHOICE_FN.wsLine = function (arg) {
    try {
      const pc = A.pc(), F = arg && (A.S.fights || {})[arg.pid];
      if (pc && pc.mil && F && F.key === arg.key && F.menA + F.menD >= TS.MEN && !A.S.tsq) {
        const m = TS.begin(pc, F, { div: pc.mil.div, realm: pc.mil.realm || pc.realm, enemy: arg.enemy, men: A.squad(pc).map(p => p.id) });
        A.queue({ type: 'mission', m });
        return;
      }
      const E = pc && pc.mil && !F && arg && !A.S.tsq ? TS.ended(arg.key) : null;
      if (E) { TS.beginEnded(pc, E, { div: pc.mil.div, realm: pc.mil.realm || pc.realm, enemy: arg.enemy, men: A.squad(pc).map(p => p.id) }); return; }
    } catch (e) { console.error('two scales start', e); }
    return lineFn.apply(this, arguments);
  };

  // ---- a captain, senior captain or commander: after his tactical battle (44's officer layer), the days of the fight
  // that follow and its end are two-scales scenes
  TS.officerAfter = function (B, key) {
    const pc = A.pc(), S = A.S;
    if (!pc || !pc.alive || !pc.mil || pc.mil.merc || pc.mil.rank < 4 || pc.mil.rank > 6 || S.tsq || pc.health <= 0) return;
    const pid = +String(key).replace(/^F/, ''), F = (S.fights || {})[pid];
    if (!F || F.key !== key || F.menA + F.menD < TS.MEN || !(F.aIds.includes(pc.mil.div) || F.dIds.includes(pc.mil.div))) return;
    const foe = A.hostile(F.a, pc.mil.realm) ? F.a : F.b;
    const m = TS.begin(pc, F, { div: pc.mil.div, realm: pc.mil.realm || pc.realm, enemy: foe, men: A.squad(pc).map(p => p.id), officer: true });
    m.stages = ['ts_break']; m.stage = 0;
    const won = B && B.winner === B.pcSide;
    m.log.push(`» ${won ? 'Your company carried its part of the first day.' : B && B.winner && B.winner !== 'draw' ? 'Your company lost its part of the first day.' : 'Your company\'s part of the first day was even.'}`);
    TS.park({ type: 'mission', m });
  };
  const partFn = A.CHOICE_FN.wsPart;
  if (typeof partFn === 'function') A.CHOICE_FN.wsPart = function (arg) {
    try {
      const pc = A.pc(), F = arg && (A.S.fights || {})[+String(arg.key).replace(/^F/, '')];
      const E = pc && pc.mil && pc.mil.rank >= 4 && pc.mil.rank <= 6 && !F && !A.S.tsq ? TS.ended(arg.key) : null;
      if (E) { TS.beginEnded(pc, E, { div: pc.mil.div, realm: pc.mil.realm || pc.realm, enemy: arg.enemy, men: A.squad(pc).map(p => p.id), officer: true }); return; }
    } catch (e) { console.error('two scales officer start', e); }
    return partFn.apply(this, arguments);
  };
  if (A.BATTLE_END && typeof A.BATTLE_END.wsPart === 'function') {
    const part = A.BATTLE_END.wsPart;
    A.BATTLE_END.wsPart = function (B, key) {
      const r = part.apply(this, arguments);
      try { TS.officerAfter(B, key); } catch (e) { console.error('two scales officer', e); }
      return r;
    };
  }

  // ---- the levy: a fight in your home province, for a life outside the army ---------------------------------------
  TS.levyOk = function (pc, F, att, def) {
    if (!pc || !pc.alive || pc.mil || pc.company || pc.prison || pc.ruler || F.menA + F.menD < TS.MEN) return false;
    if (!A.C.adult(pc) || A.age(pc) > 60 || pc.health < 35 || (pc.flags && pc.flags.unfree === 'slave')) return false;
    if (F.loc !== pc.home || A.S.tsq) return false;
    const mine = def.filter(d => A.friendly(d.r, pc.realm) || d.r === pc.realm);
    if (!mine.length || !att.length) return false;
    if (A.S.tsLevy && A.absDay() - A.S.tsLevy < TS.LEVY_GAP) return false;
    return true;
  };
  TS.neighbour = function (pc) {
    const realm = pc.realm, r = A.realm(realm), race = r ? r.race || 'human' : 'human', cult = A.cultureFor(race, realm), sex = A.chance(0.8) ? 'M' : 'F', R2 = GD.RACES[race] || GD.RACES.human;
    const c = A.newPerson({ given: A.givenName(cult, sex), sex, race, realm, cult, faith: A.faithFor(race, realm), born: A.S.year - (R2.adult + A.ri(2, 30)), status: A.pick(['peasant', 'peasant', 'artisan']), home: pc.home });
    const fn = A.familyName({ cult, realm, status: c.status, home: c.home, sex });
    c.sur = fn.sur; c.surMode = fn.mode;
    c.quirk = A.pick(['keeps bees', 'owes you a sack of barley', 'sings in the choir', 'has never been past the market town', 'brought his father\'s old spear', 'came straight from the forge']);
    return c;
  };
  TS.levyMen = function (pc) {
    const out = [];
    const rel = Object.entries(pc.rel || {}).map(([id, r]) => [A.P(id), r]).filter(([p]) => p && p.alive && p.id !== pc.id && p.home === pc.home && A.C.adult(p) && A.age(p) <= 60)
      .sort((a, b) => (b[1].op || 0) - (a[1].op || 0) || (a[0].id < b[0].id ? -1 : 1));
    for (const [p] of rel) if (out.length < 3) out.push(p.id);
    while (out.length < 3) out.push(TS.neighbour(pc).id);
    return out;
  };
  A.CHOICE_FN.tsLevy = function (arg) {
    try {
      const pc = A.pc(), F = arg && (A.S.fights || {})[arg.pid];
      if (pc && !F && !A.S.tsq && TS.ended(arg.key)) {
        const E = TS.ended(arg.key), d = E.F.dIds.map(A.divById).filter(x => x && (A.friendly(x.r, pc.realm) || x.r === pc.realm)).sort((a, b) => b.men - a.men)[0];
        if (d) { TS.beginEnded(pc, E, { div: d.id, realm: d.r, enemy: E.F.a, men: TS.levyMen(pc), levy: true }); return; }
      }
      if (!pc || !F || F.key !== arg.key || A.S.tsq) { A.log('The fighting is over before you reach the walls.'); return; }
      const mine = F.dIds.map(A.divById).filter(d => d && d.loc === F.loc && (A.friendly(d.r, pc.realm) || d.r === pc.realm)).sort((a, b) => b.men - a.men)[0];
      if (!mine) { A.log('The garrison has gone before the levy can join it.'); return; }
      const m = TS.begin(pc, F, { div: mine.id, realm: mine.r, enemy: F.a, men: TS.levyMen(pc), levy: true });
      A.queue({ type: 'mission', m });
    } catch (e) { console.error('two scales levy', e); }
  };
  const fightStart = A.wsPCFightStart;
  A.wsPCFightStart = function (F, att, def) {
    const r = fightStart.apply(this, arguments);
    try {
      const pc = A.pc();
      if (TS.levyOk(pc, F, att, def)) {
        A.S.tsLevy = A.absDay();
        const P = A.S.prov[F.loc], d = def.filter(x => A.friendly(x.r, pc.realm) || x.r === pc.realm).sort((a, b) => b.men - a.men)[0];
        A.queue({ type: 'choice', now: true, title: `The levy at ${P.name}`,
          text: `${A.realmShort(F.a)} come over the fields at ${P.name}. The bell rings and keeps ringing: every grown soul who can hold a spear is called to stand with the ${d.name}, ${A.fmt(F.menD)} against ${A.fmt(F.menA)}.`,
          options: [{ t: 'Take a spear and stand with the levy', fn: 'tsLevy', arg: { key: F.key, pid: F.loc } }, { t: 'Bar the door and keep your people close', fn: 'noop' }] });
      }
    } catch (e) { console.error('two scales levy ask', e); }
    return r;
  };

  // ---- drafts for the front: a soldier whose company sits in garrison through a war --------------------------------
  // Measured over bot lives, a soldier's own division is often left out of the field armies (it is raised near his
  // home), so a war can pass without one fight. Once a month at war, if his division has not been asked into a fight
  // for DRAFT_IDLE days and another division of his realm is fighting, the sergeant asks for a draft for it.
  TS.DRAFT_IDLE = 75; TS.DRAFT_GAP = 150; TS.DRAFT_P = 0.5;
  TS.fieldDiv = function (pc) {
    const S = A.S, rid = pc.mil.realm || pc.realm, mine = pc.mil.div;
    let best = null;
    for (const k in S.fights || {}) {
      const F = S.fights[k];
      for (const id of (F.aIds || []).concat(F.dIds || [])) {
        const d = A.divById(id);
        if (!d || d.r !== rid || d.id === mine || !d.army || !(d.men > 500)) continue;
        if (!best || d.men > best.d.men || (d.men === best.d.men && d.id < best.d.id)) best = { d, F };
      }
    }
    return best;
  };
  TS.draftOk = function (pc, ctx) {
    if (!pc || !pc.alive || !pc.mil || pc.mil.merc || pc.prison || pc.mil.rank > 3 || A.S.tsq) return false;
    const d = ctx && A.divById(ctx.div);
    if (!d || d.r !== (pc.mil.realm || pc.realm) || d.id === pc.mil.div) return false;
    ctx.divName = d.name; ctx.front = A.S.prov[ctx.at] ? A.S.prov[ctx.at].name : 'the front';
    return true;
  };
  TS.draft = function (pc, ctx) {
    const d = A.divById(ctx.div);
    if (!d || !pc.mil) return '';
    const old = A.divById(pc.mil.div);
    pc.mil.div = d.id; if (d.army) pc.mil.army = d.army;
    pc.mil.merit = (pc.mil.merit || 0) + 2;
    pc.happy = A.clamp(pc.happy - 2, 0, 100);
    A.log(`You go with the draft from ${old ? 'the ' + old.name : 'your company'} to the ${d.name}.`, 'war');
    return '';
  };
  TS.draftMonth = function (pc) {
    try {
      const S = A.S, now = A.absDay();
      if (!pc || !pc.alive || !pc.mil || pc.mil.merc || pc.prison || pc.mil.rank > 3 || pc.health < 40 || S.tsq) return;
      if (!A.atWar(pc.mil.realm || pc.realm).length) return;
      if (S.pcFightAsk != null && now - S.pcFightAsk < TS.DRAFT_IDLE) return;
      if (S.tsDraft != null && now - S.tsDraft < TS.DRAFT_GAP) return;
      if (S.queue.some(q => q && q.ev === 'ts_draft')) return;
      const f = TS.fieldDiv(pc); if (!f) return;
      if (!A.chance(TS.DRAFT_P)) return;
      S.tsDraft = now;
      A.queue({ type: 'event', ev: 'ts_draft', forced: true, ctx: { div: f.d.id, at: f.F.loc } });
    } catch (e) { console.error('two scales draft', e); }
  };
  A.onMonth.push(pc => TS.draftMonth(pc));

  // ---- the round: what a choice does on both scales ----------------------------------------------------------------
  // the front: the choice's performance goes to the fight through 44-rank-battles (its log line is ours to write)
  TS.front = function (m, perf) {
    const F = TS.liveFight(m), pc = A.pc();
    if (!F || !perf || !A.RANKFX || !pc) return 0;
    const log = A.log, shim = !pc.mil;
    A.log = function () {};
    try { if (shim) pc.mil = { realm: m.ts.realm }; A.RANKFX.apply(m.ts.key, m.ts.layer, perf); }
    finally { A.log = log; if (shim) delete pc.mil; }
    m.ts.perf = r2(m.ts.perf + perf);
    F.rank = { layer: m.ts.layer, perf: m.ts.perf };
    TS.resnap(m, F);
    return perf;
  };
  TS.fall = function (m, pc, c, how) {
    m.ts.fell = m.ts.fell || [];
    m.ts.fell.push({ id: c.id, n: c.given, day: (m.ts.front && m.ts.front.day || m.ts.day) + (m.stage < 2 ? 1 : 0), how });
    m.ts.state[c.id] = 'dead';
    return A.comradeDies(pc, c, how) || `${c.given} dies: ${how}.`;
  };
  const HOW = ['a spear in the face', 'an arrow through the neck', 'crushed in the press', 'a falchion across the throat', 'trodden under when the line gave', 'a blow nobody saw'];
  TS.outcome = function (m, pc, ch, tier) {
    const ok = tier >= 2, out = [ok ? ch.win : ch.lose];
    const near = TS.near(m), stage = m.stages[m.stage];
    // the front
    const pf = Array.isArray(ch.pf) ? ch.pf[tier] || 0 : 0;
    TS.front(m, pf);
    // your body
    if (!ok && A.chance(ch.hurt || 0.5)) {
      const hurt = A.ri(6, 20);
      pc.health = A.clamp(pc.health - hurt, 0, 100); pc.lastHurt = 'wounds taken in the battle line';
      if (A.chance(0.3)) { const w = A.addWound(pc, A.pick(['arrow_wound', 'scar_arm', 'broken_ribs', 'deep_cut', 'concussion'])); if (w) out.push(`(${w})`); }
    }
    if (ch.honor) pc.honor = A.clamp(pc.honor + ch.honor[ok ? 1 : 0], 0, 100);
    if (ch.coin && ok) { const g = A.ri(ch.coin[0], ch.coin[1]); pc.coin += g; out.push(A.coin(g) + '.'); }
    // the man hit in the arrow storm: dragged back, or left where he fell
    let saved = null;
    const h = m.ts.hurt ? A.P(m.ts.hurt) : null;
    if (h && h.alive) {
      if (ch.save === h.id && ok) { saved = h.id; m.ts.state[h.id] = 'back'; A.addOp(pc, h, 12); pc.honor = A.clamp(pc.honor + 3, 0, 100); }
      else if (ch.save === h.id ? A.chance(0.5) : A.chance(TS.BLEED)) out.push(TS.fall(m, pc, h, ch.save === h.id ? 'bled out on the way back' : 'bled out where ' + A.he(h) + ' fell'));
      else m.ts.state[h.id] = 'hurt';
    }
    m.ts.hurt = null;
    // the men beside you
    const risk = Array.isArray(ch.risk) ? ch.risk[ok ? 1 : 0] : 0;
    for (const c of near) if (c.alive && c.id !== saved && m.ts.state[c.id] !== 'dead' && A.chance(risk)) out.push(TS.fall(m, pc, c, A.pick(HOW)));
    if (ok) { m.merit += 5; if (ch.kill) m.kills += A.ri(1, 3); }
    m.success += tier;
    m.ts.rounds = m.ts.rounds || [];
    m.ts.rounds.push({ s: stage, t: ch.tag, ok: ok ? 1 : 0, pf, day: m.ts.front ? m.ts.front.day : m.ts.day });
    return out.join(' ');
  };

  // ---- the end -----------------------------------------------------------------------------------------------------
  TS.grade = p => (p >= 0.6 ? 'triumph' : p >= 0.2 ? 'success' : p > -0.2 ? 'mixed' : 'failure');
  // the line for the Chronicle: a comrade and the front together
  TS.chronicle = function (m, pc) {
    const e = m.ts.end || {}, fell = (m.ts.fell || [])[0], near = TS.near(m)[0] || (m.ts.men || []).map(A.P).find(p => p && p.alive);
    const line = e.won === 1 ? (m.ts.weAtt ? 'and the line went forward over them' : 'and the line held') : e.won === 0 ? 'on the day the line gave way' : 'and nobody could say who had the field';
    const unit = m.ts.levy ? `the levy beside the ${m.ts.divName}` : `the ${m.ts.divName}`;
    if (fell) return `At ${m.place}, on the ${TS.dayWord(fell.day)} day, ${fell.n} fell beside you in ${unit}, ${line}.` + ((m.ts.fell || []).length > 1 ? ` ${m.ts.fell.length - 1} more of your section did not come back.` : '');
    if (near) return `At ${m.place} you stood ${m.ts.end && m.ts.end.day ? m.ts.end.day + ' days' : ''} in ${unit} with ${near.given} at your shoulder, ${line}.`.replace(/ {2,}/g, ' ');
    return `At ${m.place} you stood in ${unit}, ${line}.`;
  };
  TS.finish = function (m) {
    if (m.over) return;
    m.over = true;
    const pc = A.pc(), e = m.ts.end || {}, won = e.won === 1, fr = m.ts.front || { dead: [0, 0] };
    m.outcome = won ? 'win' : 'loss';
    m.result = TS.grade(m.ts.perf);
    if (pc.mil) { pc.mil.battles++; pc.mil.merit += Math.max(0, m.merit) + (won ? 10 : 3); pc.mil.kills += m.kills; if (pc.mil.battles >= 10) A.ach('ten_battles'); }
    pc.kills += Math.min(m.kills, 6);
    A.willGrow(pc, won ? 0.6 : 1.5, 'battle');
    A.fame(pc, won ? 2 : 0);
    const said = m.ts.end == null ? 'you are carried from the field while it goes on' : e.won === 1 ? (m.ts.weAtt ? 'your side breaks through' : 'your side holds') : e.won === 0 ? (m.ts.weAtt ? 'your side is thrown back' : 'your side gives way') : 'the fighting is broken off';
    m.log.push(`— ${m.title}: ${said} after ${e.day || fr.day || 1} day${(e.day || fr.day || 1) > 1 ? 's' : ''}. ${A.fmt(fr.dead[0])} of yours dead, ${A.fmt(fr.dead[1])} of theirs.`);
    if (pc.health <= 0) m.log.push('You do not walk away from this field.');
    else A.log(TS.chronicle(m, pc), 'big');
  };

  // ---- the day: the scene waits while the war map resolves the fight, and comes back -------------------------------
  TS.park = function (q) {
    const S = A.S, m = q.m, i = S.queue.indexOf(q);
    if (i >= 0) S.queue.splice(i, 1);
    if (m.stage < 2 && !m.ts.officer) m.stage = Math.max(2, m.stages.indexOf('ts_break'));
    m.ts.parked = 1; m.cur = null;
    S.tsq = q;
  };
  TS.requeue = function () {
    const S = A.S, q = S.tsq; if (!q) return;
    delete S.tsq;
    q.m.ts.parked = 0;
    TS.prepare(q.m);
    S.queue.unshift(q);
  };
  TS.day = function (pc) {
    const S = A.S, q = S.tsq;
    if (!q || !q.m || !TS.on(q.m)) { if (q) delete S.tsq; return; }
    const m = q.m;
    if (!pc || !pc.alive) return;
    if (m.ts.end) { m.stage = m.stages.indexOf('ts_break'); TS.requeue(); return; }
    const F = TS.liveFight(m);
    if (!F) { m.ts.end = { won: null, day: m.ts.day }; m.stage = m.stages.indexOf('ts_break'); TS.requeue(); return; }
    if (F.days <= m.ts.day) return;
    m.ts.day = F.days;
    TS.resnap(m, F);
    if (m.ts.lines < TS.LINES) { m.stages.splice(m.stage, 0, 'ts_line'); m.ts.lines++; TS.requeue(); }
  };
  A.onDay.push(pc => { try { TS.day(pc); } catch (e) { console.error('two scales day', e); } });
  const fightEnd = A.fightEnd;
  A.fightEnd = function (pid, winner) {
    const S = A.S, F = S.fights && S.fights[pid], q = S.tsq, m = q && q.m;
    const mine = !!(F && m && TS.on(m) && m.ts.pid === pid && m.ts.key === F.key && m.ts.start === F.start);
    let snap = null;
    if (mine) { try { snap = TS.snap(m, F); } catch (e) { console.error('two scales snap', e); } }
    const n0 = S.queue.length;
    const r = fightEnd.apply(this, arguments);
    if (!mine && F) { try { TS.noteEnded(F, winner); } catch (e) { console.error('two scales ended', e); } }
    if (mine) {
      try {
        m.ts.end = { won: (winner === 'att') === !!m.ts.weAtt ? 1 : 0, day: F.days };
        if (snap) { m.ts.prev = m.ts.front; m.ts.front = snap; }
        TS.reckoning(F, winner, n0);
      } catch (e) { console.error('two scales end', e); }
    }
    return r;
  };
  // A fight is asked about on its first day, before that day's fighting; measured over bot lives, most of the fights a
  // soldier is asked into are over by the evening (the defenders go back on the first day). For those the scene is
  // short: the end of the fight as the engine left it, the men beside you, and the break. Nothing is left to move on
  // the front, and the scene says so.
  TS.noteEnded = function (F, winner) {
    const S = A.S, pc = A.pc();
    if (!pc || !pc.alive || S.tsq || F.menA + F.menD < TS.MEN) return;
    const ids = (F.aIds || []).concat(F.dIds || []);
    const mine = pc.mil ? ids.includes(pc.mil.div) : F.loc === pc.home;
    if (!mine) return;
    const keep = { loc: F.loc, key: F.key, start: F.start, days: F.days, war: F.war, a: F.a, b: F.b, menA: F.menA, menD: F.menD, deadA: F.deadA, deadD: F.deadD,
      aIds: (F.aIds || []).slice(), dIds: (F.dIds || []).slice(), tacA: F.tacA, tacD: F.tacD, rout: F.rout || '' };
    S.tsEnded = { F: keep, winner, at: A.absDay() };
  };
  TS.ended = function (key) { const E = A.S.tsEnded; return E && E.F.key === key && A.absDay() - E.at <= 3 ? E : null; };
  TS.beginEnded = function (pc, E, o) {
    const m = TS.begin(pc, E.F, o);
    m.ts.end = { won: (E.winner === 'att') === !!m.ts.weAtt ? 1 : 0, day: E.F.days }; m.ts.short = 1;
    m.stages = ['ts_break']; m.stage = 0;
    m.log.push(`» It is over before you reach the front rank: the ${m.ts.end.won ? 'other side' : 'line'} gave way on the first day.`);
    TS.prepare(m);
    // before the captains' and the chronicler's account of the same day (34), which is already waiting
    const S = A.S, at = S.queue.findIndex(q => q && q.ev === 'bs_reckoning');
    if (at >= 0) S.queue.splice(at, 0, { type: 'mission', m }); else A.queue({ type: 'mission', m });
    delete S.tsEnded;
    return m;
  };
  // 34-both-scales' three panels: they follow every two-scales fight, even when 34's own spacing would skip them
  TS.reckoning = function (F, winner, n0) {
    const S = A.S, pc = A.pc();
    if (!A.BS || !A.BS.context || !A.EV.bs_reckoning || !pc || !pc.alive) return;
    if (S.queue.slice(n0).some(x => x && x.ev === 'bs_reckoning')) return;
    const m = S.tsq.m, shim = !pc.mil;
    F.bs = F.bs || { hp0: pc.health, merit0: pc.mil ? pc.mil.merit || 0 : 0, squad0: (m.ts.men || []).slice(), y0: S.year, div: m.ts.div };
    let ctx;
    try { if (shim) pc.mil = { realm: m.ts.realm, merit: 0 }; ctx = A.BS.context(F, winner, pc); } finally { if (shim) delete pc.mil; }
    if (ctx) { S.bsLast = A.absDay(); A.queue({ type: 'event', ev: 'bs_reckoning', forced: true, ctx }); }
  };

  // ---- the mission machinery, for a mission that carries m.ts ---------------------------------------------------------
  const view = A.missionView;
  A.missionView = function (m) {
    if (!TS.on(m)) return view.apply(this, arguments);
    if (m.over || m.ts.parked) { m.cur = null; return null; }
    if (m.stage >= m.stages.length) { A.missionFinish(m); m.cur = null; return null; }
    m.mates = TS.near(m).map(p => p.id);
    m.cur = TS.view(m);
    return m.cur;
  };
  const choose = A.missionChoose;
  A.missionChoose = function (i) {
    const q = A.S.queue[0], m = q && q.type === 'mission' ? q.m : null;
    if (m && TS.on(m) && m.ts.parked) return m;
    const r = choose.apply(this, arguments);
    try {
      if (m && TS.on(m) && !m.over && A.S.queue[0] === q) {
        if (m.stage >= 2 || m.ts.officer) TS.park(q);                                   // the day must pass before the next scene
        else if (!m.cur) { m.mates = TS.near(m).map(p => p.id); m.cur = TS.view(m); }   // the clash follows the arrows at once
      }
    } catch (e) { console.error('two scales park', e); }
    return r;
  };
  const outcome = A.stageOutcome;
  A.stageOutcome = function (m, pc, ch, tier, mates) {
    if (!TS.on(m)) return outcome.apply(this, arguments);
    if (m.stages[m.stage] === 'ts_break') {
      const t = outcome.call(this, m, pc, ch, tier, (mates || []).filter(p => m.ts.state[p.id] !== 'back'));
      m.ts.fell = m.ts.fell || []; m.ts.rounds = m.ts.rounds || [];
      for (const id of m.ts.men) { const p = A.P(id); if (p && !p.alive && m.ts.state[id] !== 'dead') { m.ts.state[id] = 'dead'; m.ts.fell.push({ id, n: p.given, day: (m.ts.end && m.ts.end.day) || m.ts.day, how: 'in the break' }); } }
      m.ts.rounds.push({ s: 'ts_break', t: ch.tag, ok: tier >= 2 ? 1 : 0, pf: 0, day: (m.ts.end && m.ts.end.day) || m.ts.day });
      return t;
    }
    return TS.outcome(m, pc, ch, tier);
  };
  const finish = A.missionFinish;
  A.missionFinish = function (m) {
    if (TS.on(m) && !m.over) { try { TS.finish(m); } catch (e) { console.error('two scales finish', e); m.over = true; } }
    return finish.apply(this, arguments);   // the release returns at once for a finished battle; 56-realm-inside reads m.result
  };
  const close = A.missionClose;
  A.missionClose = function () {
    const q = A.S.queue[0], m = q && q.type === 'mission' ? q.m : null;
    if (m && TS.on(m) && !m.over) { TS.park(q); return; }   // "go on": the day passes, the scene comes back
    return close.apply(this, arguments);
  };

  // the scene's "go on" runs the clock until it comes back (the clock stops for anything queued, the scene included).
  // A plain A.advance(days), so the journal (01-replay) records and replays it like the player's own clock
  TS.run = function () { return A.S.tsq ? A.advance(TS.MAXRUN) : null; };

  A.SIGNATURE = Object.assign(A.SIGNATURE || {}, { bothScales: true, twoScales: true });
})();
