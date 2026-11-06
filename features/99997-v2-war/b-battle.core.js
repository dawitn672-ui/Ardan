// 99997-v2-war, part 2: in your war, you play your rank (V2_SPEC complaints 10 and 16).
//
// When your division goes into a war-map fight, the release asks you to take part (A.wsPCFightStart). A soldier or a
// sergeant ("Take your place in the line", "Rally your section") and a captain ("Lead your men in the fight") now
// play the fight as v2's battle (A.V2.war.battlePhase), phase by phase (Skirmish, Clash, Press, Decision), with the
// clock stopped:
//   - the armies are the real fight's divisions (one unit each, at most 6 a side, the rest grouped), with their men,
//     their order as morale, their troop types as worth in levies, and an elite order's terror; your company (about
//     200 men) is its own unit;
//   - a soldier and a sergeant choose from v2's CHOICES, rated against the unit across from them (A.V2.war.facing),
//     and see the enemy only as estimates ("about 3,500"); a captain also sets his company's tactic, and is rated on
//     command against the enemy general;
//   - each phase's choice is rolled with attempt() (blunders and surges) on the game's dice (A.rand);
//   - the end gives an after-action report of the three biggest causes (A.V2.war.afterAction), kept on the scene as
//     b.aar ({ causes: [{ label, pct }], text }), in the story, and on the war's battle record.
// The performance (your grade, your part in the result, the result) goes into the real fight through 44-rank-battles'
// A.RANKFX.apply, and 9997-companies' division simulator decides the fight. A general (rank 7 and up) keeps the
// release's command of the battle (A.wsLeadBattle: 9997's company and division simulator, with the army's tactics for
// each wing and the reserve).
(function () {
  const V2 = A.V2 || {}, VW = V2.war, OD = V2.odds, W = A.V2W;
  if (!VW || !W) return;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const VS = () => A.V2S || null;

  // the game's dice in the shape v2's war module takes (only A.rand is drawn)
  W.dice = () => ({
    next: () => A.rand(),
    chance: p => A.rand() < p,
    pick: arr => arr[Math.floor(A.rand() * arr.length)],
    normal: (m = 0, sd = 1) => A.gauss(m, sd),
    float: (a = 0, b = 1) => a + (b - a) * A.rand(),
    int: (a, b) => a + Math.floor(A.rand() * (b - a + 1)),
  });

  // ---- the armies, from the real fight -------------------------------------------------------------------------------
  W.TERR = { plains: 'open', steppe: 'open', farmland: 'open', fields: 'open', desert: 'open', coast: 'open', tundra: 'open',
    hills: 'hills', highlands: 'hills', forest: 'forest', woods: 'forest', jungle: 'forest', taiga: 'forest',
    marsh: 'ford', swamp: 'ford', wetland: 'ford', river: 'ford', mountains: 'pass', mountain: 'pass' };
  // when we defend, the ground's defender bonus is ours (battlePhase gives it to side 1): a copy of the ground without it,
  // and our men's worth carries it
  for (const k of Object.keys(VW.TERRAIN)) if (!VW.TERRAIN[k + '_us'] && !/_us$/.test(k)) VW.TERRAIN[k + '_us'] = Object.assign({}, VW.TERRAIN[k], { defenderBonus: undefined });
  const lvPM = () => { const L = GD.BN.LV; return (L.soft + L.def + L.hp) / L.men; };
  // a division's worth per man, in levies: its battalions' attack, defence and toughness per man against a levy's
  W.divWorth = function (d) {
    if (!d) return 1;
    if (d.elite && W.orderWorth) return W.orderWorth(d.elite);
    let s = null; try { s = A.divS(d); } catch (e) {}
    if (!s || !s.men) return 1;
    const pm = (s.soft + s.def + s.hp) / s.men, xp = A.xpLevel ? (A.xpLevel(d.exp || 0)[2] || 1) : 1;
    return Math.round(clamp(pm / lvPM() * xp, 0.6, 8) * 100) / 100;
  };
  W.unitOf = function (d, id, name, men) {
    let s = null; try { s = A.divS(d); } catch (e) {}
    const mo = A.divMaxOrg ? A.divMaxOrg(d) : 60;
    return VW.makeUnit(id || d.id, name || d.name, d.elite ? 'order' : 'line', Math.max(1, Math.round(men != null ? men : d.men)), W.divWorth(d), {
      morale: clamp(0.35 + 0.6 * (d.org || 0) / Math.max(1, mo), 0.3, 0.95),
      terror: d.elite && W.orderTerror ? W.orderTerror(d.elite) : 0,
      cavalry: !!(s && s.main === 'horse'), ranged: !!(s && s.cats && s.cats.missile >= (s.n || 1) / 3),
    });
  };
  W.side = W.side || (() => null);
  // what you lead (playtest 2, new 16: "Commander · leads 3,200" beside "2nd Aldmark Line 7,530 · Commander … you", and
  // "You fight as a Commander" with only "Your company" to order). The release makes a Commander (rank 6) his division's
  // commander (d.cmd), so he leads all of it; below that, the rank's own number (a Captain 200, a Senior Captain 800)
  W.cmdsDiv = (pc, d) => !!(pc && d && d.cmd === pc.id);
  W.leads = function (pc, d) {
    pc = pc || A.pc();
    if (!pc || !pc.mil) return 0;
    d = d || (pc.mil.div && A.divById ? A.divById(pc.mil.div) : null);
    if (W.cmdsDiv(pc, d)) return Math.max(1, Math.round(d.men));
    return (GD.MIL[pc.mil.rank] || {}).leads || 1;
  };
  W.unitWord = function (pc, d) {
    if (W.cmdsDiv(pc, d)) return 'your division';
    const r = pc && pc.mil ? pc.mil.rank || 0 : 0;
    return r >= 5 ? 'your battalion' : 'your company';
  };
  // the drill card says "you drill 3,200 of 7,530 men" for the same reason: the division's commander drills his division
  const share0 = A.drillShare;
  if (typeof share0 === 'function') A.drillShare = function (pc) {
    try { const d = A.myUnit && A.myUnit(pc); if (W.cmdsDiv(pc, d)) return 1; } catch (e) { console.error('v2 war drill share', e); }
    return share0.apply(this, arguments);
  };
  W.armyOf = function (divs, name, mine, pc) {
    const list = divs.filter(d => d && d.men > 0).sort((a, b) => (mine && a === mine ? -1 : mine && b === mine ? 1 : b.men - a.men || (a.id < b.id ? -1 : 1)));
    const units = [];
    const top = list.slice(0, 6), rest = list.slice(6);
    for (const d of top) {
      if (d === mine) {
        // your own men are your unit: the company you stand in (about 200, for a soldier and a sergeant too), a Senior
        // Captain's battalion, or the whole division you command
        const all = W.cmdsDiv(pc, d), coy = all ? Math.round(d.men) : Math.min(Math.round(d.men * 0.5), Math.max(200, W.leads(pc, d)));
        const u = W.unitOf(d, 'coy', W.unitWord(pc, d), coy); u.div = d.id; units.push(u);
        if (d.men - coy > 0) units.push(W.unitOf(d, d.id, d.name, d.men - coy));
      } else units.push(W.unitOf(d));
    }
    if (rest.length) {
      const men = rest.reduce((a, d) => a + d.men, 0), wsum = rest.reduce((a, d) => a + d.men * W.divWorth(d), 0);
      const u = VW.makeUnit('rest', `${rest.length} more divisions`, 'line', men, Math.round(wsum / Math.max(1, men) * 100) / 100, { morale: 0.6 });
      u.divs = rest.map(d => d.id);
      units.push(u);
    }
    return units;
  };
  W.genOf = function (divs) {
    for (const d of divs) { const g = d && A.divGen ? A.divGen(d) : null; if (g) return g; }
    return null;
  };
  W.cmdOf = function (g) {
    const m = g && VS() ? VS().minds(g) : null;
    const t = g && A.GENERALS && A.GENERALS.temper ? A.GENERALS.temper(g) : 'steady';
    return { judgment: m ? m.judgment : 100, will: m ? m.will : 100, style: t === 'bold' ? 'bold' : t === 'cunning' ? 'cunning' : 'cautious', id: g ? g.id : null, name: g ? A.fullName(g) : null };
  };

  // ---- the player in the fight ----------------------------------------------------------------------------------------
  W.person = function (pc, rank) {
    const S2 = VS(), m = S2 ? S2.minds(pc) : { judgment: 100, will: 100, fatigue: 0 };
    const worth = S2 && S2.leviesOf ? Math.max(0.3, S2.leviesOf(pc)) : 1;
    const sk = k => (A.skill ? A.skill(pc, k) || 0 : 0);
    // command: the tactics and command skills, judgment and the years in an officer's post (0.3 a rank from captain up),
    // on the scale of the enemy general's (1.5 + judgment / 100)
    const command = clamp(1 + (sk('tactics') + sk('command')) / 70 + (m.judgment - 100) / 60 + (pc.mil && pc.mil.rank >= 4 ? 0.3 * (pc.mil.rank - 3) : rank === 'captain' ? 0.3 : 0), 0.5, 5);
    return { worth: Math.round(worth * 100) / 100, judgment: m.judgment, will: m.will, fatigue: m.fatigue || 0, command: Math.round(command * 100) / 100 };
  };
  // what a man in the ranks can tell of a number: "about 3,500"; a captain: "some 3,400"
  W.estimate = function (n, rank) {
    n = Math.max(0, Math.round(n));
    if (rank === 'captain' || rank === 'commander') return `some ${A.fmt(n < 1000 ? Math.round(n / 10) * 10 : Math.round(n / 100) * 100)}`;
    if (n < 30) return 'a handful';
    const mag = Math.pow(10, Math.max(1, Math.floor(Math.log10(n)) - 1)), r = Math.round(n / mag / 5) * 5 * mag || mag;
    return `about ${A.fmt(r)}`;
  };
  W.quality = w => (w >= 12 ? 'an elite order' : w >= 3 ? 'picked troops' : w >= 1.8 ? 'hardened men' : w >= 1.2 ? 'line troops' : 'levies');

  // ---- starting it ----------------------------------------------------------------------------------------------------
  W.begin = function (pc, F, arg, rank) {
    const S = A.S, P = S.prov[F.loc], myR = W.side(pc) || pc.realm;
    const myDiv = pc.mil && pc.mil.div ? A.divById(pc.mil.div) : null;
    const weAtt = myDiv && F.aIds.includes(myDiv.id) ? true : myDiv && F.dIds.includes(myDiv.id) ? false : A.hostile(F.b, myR);
    const ours = (weAtt ? F.aIds : F.dIds).map(A.divById).filter(Boolean), theirs = (weAtt ? F.dIds : F.aIds).map(A.divById).filter(Boolean);
    if (!ours.length || !theirs.length) return null;
    const foeR = weAtt ? F.b : F.a;
    const unitsA = W.armyOf(ours, A.realmShort(myR), myDiv && ours.includes(myDiv) ? myDiv : null, pc);
    const unitsB = W.armyOf(theirs, A.realmShort(foeR), null, pc);
    let terr = W.TERR[P && P.terr] || 'open';
    if (!weAtt && VW.TERRAIN[terr].defenderBonus) {
      const bonus = VW.TERRAIN[terr].defenderBonus;
      for (const u of unitsA) u.worth = Math.round(u.worth * bonus * 100) / 100;
      terr += '_us';
    }
    const cmdB = W.cmdOf(W.genOf(theirs)), cmdA = W.cmdOf(W.genOf(ours));
    const camp = { day: F.days || 1, playerSide: 0, armies: [VW.makeArmy(A.realmShort(myR), 0, unitsA, cmdA), VW.makeArmy(A.realmShort(foeR), 1, unitsB, cmdB)], battle: VW.startBattle({}, terr) };
    camp.armies[0].tactic = cmdA.style === 'bold' ? 'charge' : cmdA.style === 'cunning' ? 'flank' : 'advance';
    return {
      v: 1, key: F.key, pid: F.loc, start: F.start, war: F.war, rank, layer: rank === 'captain' ? 'part' : 'line',
      title: `Battle of ${P ? P.name : 'the field'}`, place: P ? P.name : '', weAtt: weAtt ? 1 : 0, realm: myR, foe: foeR,
      div: myDiv ? myDiv.name : '', unit: W.unitWord(pc, myDiv), tac: 'advance', camp, picks: [], phases: [], done: 0, aar: null, perf: 0,
    };
  };
  W.startFrom = function (arg, rank) {
    const pc = A.pc(), F = arg && (A.S.fights || {})[+String(arg.key || arg).replace(/^F/, '')];
    if (!pc || !F || F.key !== (arg.key || arg)) { A.log('The fighting is over before you reach it.'); return null; }
    const b = W.begin(pc, F, arg, rank);
    if (!b) { A.log('The fighting is over before you reach it.'); return null; }
    A.queue({ type: 'v2battle', b });
    return b;
  };
  // the fight you are asked into waits for your answer (playtest 2, new 6: 5 of 16 "Rally your section" went straight to
  // "After X"). The release asks on a fight's first day and fights that day at once, so a short fight was over before
  // the answer. When the ask is queued, the fight skips that day's fighting (patch V2W-HOLD-FIRST-DAY reads F.v2hold):
  // the scene you play is its first day, and the map fights it from the next tick.
  const ask0 = A.wsPCFightStart;
  if (typeof ask0 === 'function') A.wsPCFightStart = function (F) {
    const n0 = A.S && A.S.queue ? A.S.queue.length : 0;
    const r = ask0.apply(this, arguments);
    try {
      const Q = A.S.queue;
      for (let i = n0; i < Q.length; i++) {
        const q = Q[i];
        if (q && q.type === 'choice' && (q.options || []).some(o => o && o.arg && (o.arg === F.key || o.arg.key === F.key))) { F.v2hold = 1; break; }
      }
    } catch (e) { console.error('v2 war hold', e); }
    return r;
  };
  // the fight is there to be played: the same fight (its key), not a later one at the same place
  W.live = arg => { const F = arg && (A.S.fights || {})[+String(arg.key || arg).replace(/^F/, '')]; return !!(F && F.key === (arg.key || arg)); };
  // the soldier's and the sergeant's line, and the captain's company: v2's battle
  const CF = A.CHOICE_FN = A.CHOICE_FN || {};
  const line0 = CF.wsLine, part0 = CF.wsPart;
  // the layers this replaces (72-two-scales' line, 44/9997's tactical battle) stay callable: 72's levy still uses its
  // scene, and their own tests reach them here. A fight that is over all the same (a save from before the hold) goes to
  // them too: 72's short scene of a fight over before you reach the front rank, not a log line and nothing to play
  W.classic = { wsLine: line0, wsPart: part0 };
  CF.wsLine = function (arg) {
    try { const r = W.rank(); if ((r === 'soldier' || r === 'sergeant') && W.live(arg)) { W.startFrom(arg, r); return; } } catch (e) { console.error('v2 war line', e); }
    return line0 && line0.apply(this, arguments);
  };
  CF.wsPart = function (arg) {
    try { if (W.rank() === 'captain' && W.live(arg)) { W.startFrom(arg, 'captain'); return; } } catch (e) { console.error('v2 war company', e); }
    return part0 && part0.apply(this, arguments);
  };

  // ---- one phase --------------------------------------------------------------------------------------------------------
  W.choices = b => VW.CHOICES[b.rank] || VW.CHOICES.soldier;
  W.TACS = ['hold', 'advance', 'charge', 'flank', 'volley', 'withdraw'];
  // the odds of each choice, against what you face (pure: reads the scene, draws nothing)
  W.oddsOf = function (b, c, pc) {
    const person = W.person(pc || A.pc(), b.rank);
    const o = VW.playerOdds(b.camp, b.rank, person, c);
    return Object.assign(OD.oddsWords(o.capability, o.difficulty), { foe: o.foe });
  };
  // your grade for a phase, in what it did for the fight (CI run 88: the sergeant's "plug the gap" graded 0.33 against
  // "keep the squad tight" 0.34, the choice not moving the fight). A choice that works earns what it is worth to the
  // fight (its reward), so drifting to the rear or keeping the company back earns nothing even when it works (it earned
  // 0.3, as much as half a charge). A failure costs the same whatever was tried: the risk of a bold choice is to you (the
  // wound, v2's 15% x risk) and to the army (its army factor, in the engine's contribution, read in W.perfOf), so it is
  // not counted a third time here.
  // A choice that takes from the army (its army factor under 1: keeping the company back, drifting to the rear) has no
  // reward to carry it, so when it works it costs the fight what it took (W.SHIRK a point of the army's blow). Earning
  // nothing, it was the captain's best grade by luck of the dice (CI run 88 merged: "keep the company back" 0.17 against
  // "follow the army's orders" 0.16): a kept-back company is easy to keep back (seven phases in ten work), and following
  // orders against a general is an even match. It stays the safe choice for the man himself (a wound a tenth as often)
  W.SHIRK = 4;
  W.grade = function (c, res) {
    if (!res) return 0;
    if (res.success) return clamp(0.75 * c.reward * (res.tier === 'triumph' ? 1.4 : 1) - W.SHIRK * Math.max(0, 1 - (c.army || 1)), -1, 1);
    return -0.42 * (res.tier === 'disaster' ? 1.3 : 1);
  };
  W.setTac = function (k) {
    const q = A.S.queue[0];
    if (!q || q.type !== 'v2battle' || q.b.done || q.b.rank !== 'captain' || !VW.TACTICS[k]) return { ok: false };
    q.b.tac = k; return { ok: true };
  };
  W.choose = function (i) {
    const q = A.S.queue[0];
    if (!q || q.type !== 'v2battle' || q.b.done) return { ok: false };
    const b = q.b, pc = A.pc(), c = W.choices(b)[+i];
    if (!c || !pc) return { ok: false };
    const camp = b.camp, phase = camp.battle.phase, foe = VW.facing(camp);
    const odds = W.oddsOf(b, c, pc);
    const before = [VW.armyMen(camp.armies[0]), VW.armyMen(camp.armies[1])];
    const res = VW.battlePhase(W.dice(), camp, {
      armyTactic: [camp.armies[0].tactic],
      unitTactics: b.rank === 'captain' ? { coy: b.tac } : {},
      player: { rank: b.rank, choice: c.id, person: W.person(pc, b.rank) },
    });
    const pl = res.player || {};
    const g = W.grade(c, pl.res);
    b.picks.push(c.id);
    b.phases.push({ ph: VW.PHASES[phase], c: c.id, t: c.name, tac: b.rank === 'captain' ? b.tac : null, foe: foe ? foe.name : '', foeN: foe ? foe.count : 0,
      odds: odds.words, tier: pl.res ? pl.res.tier : 'mixed', why: pl.res && pl.res.blundered ? 'blunder' : pl.res && pl.res.surged ? 'surge' : '',
      kills: pl.kills || 0, wound: pl.wound || null, banner: pl.capturedBanner ? 1 : 0, g: Math.round(g * 100) / 100,
      lossA: before[0] - VW.armyMen(camp.armies[0]), lossB: before[1] - VW.armyMen(camp.armies[1]) });
    // the body: a wound is a wound
    if (pl.wound) { pc.health = Math.max(1, (pc.health || 50) - 7); A.log(`In the ${VW.PHASES[phase].toLowerCase()} you take a wound to the ${pl.wound}.`, 'bad'); }
    if (pl.capturedBanner) { A.fame && A.fame(pc, 3); pc.deeds && pc.deeds.push({ y: A.S.year, t: `Took the standard of ${A.realmShort(b.foe)} at ${b.place}` }); }
    if (camp.battle.over) W.finish(b, pc);
    return { ok: true };
  };

  // ---- the end: the after-action report, and the fight it moves -----------------------------------------------------
  W.CAUSE_PCT = 40;   // a contribution of 1 (an e-fold of advantage) reads as 40 points in 23's form
  W.aarOf = function (b) {
    const r = VW.afterAction(b.camp), C = b.camp.battle.contrib;
    const names = { terrain: 'the ground', tactics: 'the choice of tactics', numbers: 'sheer numbers', quality: 'the quality of the troops', elites: 'the elite orders on the field', morale: 'nerve', player: 'your own part', fatigue: 'tiredness' };
    let top = Object.entries(C).filter(([, v]) => Math.abs(v) > 1e-6).sort((x, y) => Math.abs(y[1]) - Math.abs(x[1]) || (x[0] < y[0] ? -1 : 1)).slice(0, 3);
    // a battle always has three causes worth naming: fill from the rest, smallest last
    if (top.length < 3) for (const k of Object.keys(names)) if (top.length < 3 && !top.some(x => x[0] === k)) top.push([k, C[k] || 0]);
    const causes = top.map(([k, v]) => ({ key: k, label: `${names[k]} ${v > 0 ? 'favoured us' : v < 0 ? 'favoured them' : 'counted for little'}${Math.abs(v) > 0.6 ? ' heavily' : ''}`, pct: Math.round(v * W.CAUSE_PCT) }));
    return { won: r.won, headline: r.headline, causes, text: `${r.headline} What decided it: ${causes.map(c => c.label).join('; ')}.`, losses: r.losses };
  };
  // the scene is the fight's first day (the map held it for you: V2W-HOLD-FIRST-DAY), so the men who fell in it fell in
  // the fight: each unit's dead come off its divisions (a grouped unit's in proportion to their men) and go on the
  // fight's dead. The battle report after it then counts them (playtest 2, new 17: "Ashmere: about 1,000 men", then
  // "Dead: about 1,500 of theirs", the scene's own losses nowhere in the fight's)
  W.foldLosses = function (b, F) {
    const CO = A.CO;
    for (const army of b.camp.armies) for (const u of army.units) {
      const lost = Math.max(0, Math.round((u.start || 0) - (u.count || 0)));
      if (!lost) continue;
      const ids = u.divs || [u.div || u.id], ds = ids.map(A.divById).filter(d => d && d.men > 0);
      const tot = ds.reduce((a, d) => a + d.men, 0);
      let left = lost;
      ds.forEach((d, j) => {
        const want = j === ds.length - 1 ? left : Math.round(lost * d.men / Math.max(1, tot));
        if (CO) CO.WHY = 'battle';
        let n = 0;
        try { n = A.divLose(d, Math.min(want, left)); } finally { if (CO) CO.WHY = null; }
        left -= n;
        if (F.aIds.includes(d.id)) F.deadA += n; else if (F.dIds.includes(d.id)) F.deadD += n;
      });
    }
  };
  // the performance that reaches the fight's order (44's A.RANKFX): your grade and the scene's result. Your part in the
  // scene's result (the engine's contribution: your choices' army factor and morale) reaches the fight as its dead
  // (W.foldLosses), so it is not counted a second time here: read twice, a sergeant's four failed attempts to plug the
  // gap in a fight of fifteen divisions cost the whole army's order more than all his successes elsewhere gave it
  W.perfOf = function (b) {
    const gs = b.phases.map(p => p.g), mean = gs.length ? gs.reduce((a, x) => a + x, 0) / gs.length : 0;
    const won = b.camp.battle.winner === 0;
    return Math.round(clamp(0.55 * mean + (won ? 0.25 : -0.25), -1, 1) * 100) / 100;
  };
  W.finish = function (b, pc) {
    b.done = 1;
    b.aar = W.aarOf(b);
    b.perf = W.perfOf(b);
    const S = A.S, F = (S.fights || {})[b.pid];
    if (F && F.key === b.key && F.start === b.start) {
      try { W.foldLosses(b, F); } catch (e) { console.error('v2 war losses', e); }
      if (A.RANKFX && A.RANKFX.apply) { try { A.RANKFX.apply(b.key, b.layer, b.perf); } catch (e) { console.error('v2 war rank fx', e); } }
      F.v2w = { rank: b.rank, perf: b.perf, aar: b.aar.causes };
    }
    const kills = b.phases.reduce((a, p) => a + p.kills, 0);
    A.log(`${b.title}: ${b.aar.won ? 'your part of the field is carried' : 'your part of the field is lost'}. The captains reckon it: ${b.aar.causes.map(c => c.label).join('; ')}.${kills ? ` You put down ${kills} ${kills === 1 ? 'man' : 'men'} yourself.` : ''}`, b.aar.won ? 'good' : 'bad');
    pc.v2wN = (pc.v2wN || 0) + 1;
  };
  W.close = function () {
    const q = A.S.queue[0];
    if (q && q.type === 'v2battle' && q.b.done) A.S.queue.shift();
    return { ok: true };
  };
  // a bot, or a scene put aside: the first choice each phase
  W.auto = function () {
    let g = 0;
    while (g++ < 8) { const q = A.S.queue[0]; if (!q || q.type !== 'v2battle') break; if (q.b.done) { W.close(); break; } W.choose(0); }
  };
  // the after-action report also goes on the war's battle record when the fight ends (23 shows it there)
  const fe = A.fightEnd;
  A.fightEnd = function (pid, winner) {
    const F = A.S && A.S.fights && A.S.fights[pid], w = F && A.S.wars.find(x => x.id === F.war), n = w ? w.battles.length : 0;
    const r = fe.apply(this, arguments);
    try { if (F && F.v2w && w && w.battles.length > n) { const B = w.battles[w.battles.length - 1]; if (!B.aar) B.aar = { causes: F.v2w.aar.map(c => ({ label: c.label, pct: c.pct })) }; } } catch (e) {}
    return r;
  };
})();
