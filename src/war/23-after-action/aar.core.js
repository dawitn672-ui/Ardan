// After-action reports (Road to Ten, War 2 and 4). Every field battle keeps a tally while it is fought and ends with a
// report that names its biggest causes in the plan's form ("numbers +18%, the ground -6%").
//
// How the numbers are made. The resolver's damage is linear in each side's power, so the effect of one multiplier on a
// side's kills is kills * (1 - 1/multiplier). Each cause is measured that way in "kill-equivalents": the dead it added
// to the enemy or spared its own side. pct is that figure as a share of those who fell in the fighting (the rout that
// follows is reported apart, as a consequence), signed for the player's side. Causes overlap (a shield wall's work also shows in its wing), so the shares are not meant to sum.
//
// Engine side only: the tally wraps A.missileExchange, A.wingClash, A.flankAttack, A.moraleCheck and A.battleFinish,
// reads unit state before and after each call, and never draws from A.rand. Rendering only reads B.aar.
(function () {
  const OK = u => u.men > 0 && (u.status === 'ok' || u.status === 'shaken');
  const killed = (B, k) => B.sides[k].units.reduce((a, u) => a + (u.killed || 0), 0);
  const other = k => (k === 'A' ? 'B' : 'A');
  const sum = (xs, f) => xs.reduce((a, x) => a + f(x), 0);
  const WING = { L: 'left wing', C: 'center', R: 'right wing' };
  const MIRROR = { L: 'R', C: 'C', R: 'L' };
  const rnd = x => Math.sign(x) * Math.round(Math.abs(x));   // rounds the same for both sides, so reports mirror

  function tally(B) {
    if (B.aarT) return B.aarT;
    const side = () => ({ missile: 0, L: 0, C: 0, R: 0, flank: 0, rout: 0, ground: 0, weather: 0, lead: 0, shoot: 0, melee: 0, tac: {} });
    return (B.aarT = { A: side(), B: side(), champ: null, broke: { A: 0, B: 0 } });
  }
  const tacName = k => (GD.BATTLE_TACTICS[k] && GD.BATTLE_TACTICS[k].name) || k;
  // the tactic a wing is fighting with: that of its largest unit
  const wingTac = us => { const u = us.slice().sort((a, b) => b.men - a.men)[0]; return u && u.tac && u.tac !== 'hold' ? u.tac : null; };
  const addTac = (t, k, tac, v, def) => {
    if (!tac || !v) return;
    const e = t[k].tac[tac] || (t[k].tac[tac] = { v: 0, def: 0 });
    e.v += v; e.def += def || 0;
  };

  // A copy of the melee power sum in A.wingClash, with each side's tactic effects switched on or off. Common factors
  // (command, leading, the dice, the ground) cancel in the ratios this is used for.
  function meleeX(B, us, them, offTac, defTac) {
    const fx = (u, key, d, on) => (on ? A.tfx(u, key, d) : d);
    const themMen = Math.max(1, sum(them, u => u.men));
    const antiCav = sum(them, u => u.men * GD.TROOPS[u.code].antiCav * fx(u, 'antiCav', 1, defTac) * (u.status === 'shaken' ? 0.6 : 1)) / themMen;
    const cavStop = defTac ? Math.min(...them.map(u => A.tfx(u, 'cavStop')), 1) : 1;
    const themMorale = sum(them, u => u.morale) / Math.max(1, them.length);
    let p = 0;
    for (const u of us) {
      const T = GD.TROOPS[u.code];
      let v = u.men * T.melee * u.q * fx(u, 'att', 1, offTac) * (1 - u.fat / 250) * (u.status === 'shaken' ? 0.65 : 1);
      if (T.charge > 1 && (B.pulse <= 2 || (offTac && A.tfx(u, 'charge', 0) > 0)) && !(offTac && A.tfx(u, 'noAdvance', false))) {
        let ch = u.men * T.charge * u.q * fx(u, 'charge', 1, offTac);
        if (offTac && u.tac === 'lance' && themMorale < 50) ch *= A.tfx(u, 'wavering');
        if (T.mount) { ch *= cavStop; ch /= 1 + antiCav * 0.35; }
        if (T.relay) ch *= B.pulse <= 4 ? 1.1 : 0.5;
        v += ch;
      }
      p += v;
    }
    const dm = Math.max(1, sum(them, u => u.men * (1 + GD.TROOPS[u.code].def * 0.1 * fx(u, 'def', 1, defTac))) / themMen);
    return p / dm;
  }
  const ratio = (a, b) => (b > 0 && a > 0 ? a / b : 1);

  const wrap = (name, fn) => { const f = A[name]; if (typeof f === 'function' && !f.aar) { A[name] = fn(f); A[name].aar = true; } };

  wrap('missileExchange', base => function (B, a, b) {
    const t = tally(B), weather = { rain: 1, fog: 1, wind: 1 }[B.weather];
    // the weather's cut on this volley, weighted by each unit's share of the shooting
    let w = 0, wf = 0;
    if (weather) for (const u of B.sides[a].units) {
      if (!OK(u) || u.wing === 'X') continue;
      const T = GD.TROOPS[u.code]; if (!T.missile) continue;
      const p = u.men * T.missile * u.q;
      let f = 1;
      if (B.weather === 'rain' && (u.code === 'XB' || u.code === 'LB' || u.code === 'AR')) f *= 0.6;
      if (B.weather === 'fog') f *= 0.5;
      if (B.weather === 'wind') f *= 0.8;
      w += p; wf += p * f;
    }
    const k0 = killed(B, b);
    const r = base.apply(this, arguments);
    const k = killed(B, b) - k0;
    t[a].missile += k; t[a].shoot += k;
    if (w > 0 && wf > 0) t[a].weather -= k * (w / wf - 1);
    return r;
  });

  wrap('wingClash', base => function (B, wa, wb) {
    const t = tally(B);
    const ua = B.sides.A.units.filter(u => u.wing === wa && OK(u)), ub = B.sides.B.units.filter(u => u.wing === wb && OK(u));
    const pre = {};
    if (ua.length && ub.length) {
      const terrHorse = { forest: 0.55, marsh: 0.5, mountains: 0.5, hills: 0.85 }[B.terr] || 1;
      const horse = us => sum(us, u => (GD.TROOPS[u.code].mount ? u.men : 0)) / Math.max(1, sum(us, u => u.men));
      for (const [k, us, them] of [['A', ua, ub], ['B', ub, ua]]) {
        pre[k] = {
          ground: 1 - horse(us) * (1 - terrHorse),
          lead: k === B.pcSide && B.pcLead ? 1.08 : 1,
          tac: wingTac(us),
          full: meleeX(B, us, them, true, true),
          noOff: meleeX(B, us, them, false, true),   // my tactic's attack switched off
          noDef: meleeX(B, us, them, true, false),   // their tactic's defence switched off
        };
      }
    }
    const kA0 = killed(B, 'A'), kB0 = killed(B, 'B');
    const r = base.apply(this, arguments);
    const byA = killed(B, 'B') - kB0, byB = killed(B, 'A') - kA0;
    t.A[wa] += byA; t.B[wa] += byB; t.A.melee += byA; t.B.melee += byB;
    if (pre.A) for (const [k, K, Kj] of [['A', byA, byB], ['B', byB, byA]]) {
      const P = pre[k], Q = pre[other(k)];
      if (P.ground < 1) t[k].ground -= K * (1 / P.ground - 1);
      if (P.lead > 1) t[k].lead += K * (1 - 1 / P.lead);
      // my tactic: the kills its attack added, plus the kills its defence spared me
      const off = K * (1 - 1 / ratio(P.full, P.noOff)), def = Kj * (ratio(Q.noDef, Q.full) - 1);
      addTac(t, k, P.tac, off + def, def);
    }
    return r;
  });

  wrap('flankAttack', base => function (B, k) {
    const t = tally(B), o = other(k), k0 = killed(B, o);
    const r = base.apply(this, arguments);
    t[k].flank += killed(B, o) - k0;
    return r;
  });

  wrap('moraleCheck', base => function (B, k) {
    const t = tally(B), k0 = killed(B, k), ok0 = B.sides[k].units.filter(u => u.status !== 'rout' && u.status !== 'gone').length;
    const r = base.apply(this, arguments);
    t[other(k)].rout += killed(B, k) - k0;
    const broke = B.sides[k].units.filter(u => u.status === 'rout').length;
    if (broke && ok0 && !t.broke[k]) t.broke[k] = B.pulse;   // the pulse a side's first unit broke
    return r;
  });

  wrap('battleFinish', base => function (B, win) {
    const t = tally(B), lose = win === 'A' ? 'B' : win === 'B' ? 'A' : null, k0 = lose ? killed(B, lose) : 0;
    const r = base.apply(this, arguments);
    if (lose) t[win].rout += killed(B, lose) - k0;
    try { B.aar = A.aarBuild(B); } catch (e) { console.error('after-action report', e); }
    return r;
  });

  // a champion duel in the press changes morale, not kills; the report names it in words
  const champ = A.DUEL_END && A.DUEL_END.battleChamp;
  if (champ && !champ.aar) {
    A.DUEL_END.battleChamp = function (D, bid) {
      const q = A.S.queue[0];
      if (q && q.type === 'battle' && q.b.id === bid) tally(q.b).champ = D.result || null;
      return champ.apply(this, arguments);
    };
    A.DUEL_END.battleChamp.aar = true;
  }

  // The report as data: { causes: [{ label, pct }], text, where: [{ label, pct }] }. pct is signed for the player's side.
  A.aarBuild = function (B) {
    const t = tally(B), me = B.pcSide || 'A', en = other(me), allDead = Math.max(1, (B.dead ? B.dead.A + B.dead.B : killed(B, 'A') + killed(B, 'B')));
    const fought = k => t[k].shoot + t[k].melee + t[k].flank, dead = Math.max(1, fought('A') + fought('B'));
    const S = B.sides, all = [];
    const add = (label, kv, note) => { const pct = rnd(100 * kv / dead); if (pct) all.push({ label, pct, note: note || '' }); };
    const net = key => t[me][key] - t[en][key];
    // relative advantages: each side against the mean of the two (Lanchester-linear for numbers)
    const rel = (vMe, vEn, kMe, kEn) => { const m = (vMe + vEn) / 2; return (vMe > 0 ? kMe * (1 - m / vMe) : 0) - (vEn > 0 ? kEn * (1 - m / vEn) : 0); };
    const q = k => { const us = S[k].units, m = sum(us, u => u.men0); return m ? sum(us, u => u.men0 * u.q) / m : 0.9; };
    add('Numbers', rel(S[me].men0, S[en].men0, fought(me), fought(en)));
    add('Command', rel(A.cmdMul(S[me]), A.cmdMul(S[en]), fought(me), fought(en)));
    add('Drill and kit', rel(q(me), q(en), fought(me), fought(en)));
    // what kind of men: fighting value per man of the troop types in the line, as in A.sideStrength
    const kind = k => { const us = S[k].units, m = sum(us, u => u.men0); return m ? sum(us, u => { const T = GD.TROOPS[u.code]; return u.men0 * (T.melee + T.def * 0.5 + T.missile * 0.7 + T.charge * 0.3); }) / m : 0; };
    add('The troops', rel(kind(me), kind(en), fought(me), fought(en)));
    add('Archery', net('missile'));
    add(t[me].flank >= t[en].flank ? 'The flank attack' : 'Flanked', net('flank'));
    add('The ground', t[me].ground - t[en].ground, B.terr);
    add('The weather', t[me].weather - t[en].weather, B.weather);
    add('Leading from the front', t[me].lead);
    for (const [k, sign, who] of [[me, 1, 'Your'], [en, -1, 'Their']])
      for (const [tac, e] of Object.entries(t[k].tac)) add(`${who} ${tacName(tac).toLowerCase()}`, sign * e.v, e.def > Math.abs(e.v) / 2 ? 'held' : 'struck');
    // the three biggest, but always the best for and the worst against you when there are any
    all.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
    const best = all.filter(c => c.pct > 0)[0], worst = all.filter(c => c.pct < 0)[0];
    const causes = [best, worst].filter(Boolean);
    for (const c of all) if (causes.length < 3 && !causes.includes(c)) causes.push(c);
    causes.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));

    // where the dead fell, in the player's own frame (A's left faces B's right)
    const where = [];
    const myWing = w => (me === 'A' ? w : MIRROR[w]);
    const totK = k => sum(['missile', 'L', 'C', 'R', 'flank', 'rout'], s => t[k][s]);
    if (totK(me) + totK(en) > 0) {
      where.push({ label: 'arrows and bolts', pct: Math.round(100 * (t.A.missile + t.B.missile) / allDead) });
      for (const w of ['L', 'C', 'R']) where.push({ label: 'your ' + WING[myWing(w)], pct: Math.round(100 * (t.A[w] + t.B[w]) / allDead) });
      where.push({ label: 'flank attacks', pct: Math.round(100 * (t.A.flank + t.B.flank) / allDead) });
      where.push({ label: 'the rout and pursuit', pct: Math.round(100 * (t.A.rout + t.B.rout) / allDead) });
    }
    return { causes: causes.map(c => ({ label: c.label, pct: c.pct })), text: A.aarText(B, causes, where, t), where: where.filter(w => w.pct > 0) };
  };

  const fmtPct = p => (p > 0 ? '+' : '−') + Math.abs(p) + '%';
  const GROUND = { forest: 'the trees', marsh: 'the marsh', mountains: 'the broken mountain ground', hills: 'the slopes' };
  function phrase(c) {
    const up = c.pct > 0;
    switch (c.label) {
      case 'Numbers': return up ? 'more men in the line' : 'fewer men in the line';
      case 'Command': return up ? 'the better generalship' : 'their better generalship';
      case 'Drill and kit': return up ? 'better drilled and better armed men' : 'their better drilled and better armed men';
      case 'Archery': return up ? 'your archers' : 'their archers';
      case 'The flank attack': return 'your blow on their flank';
      case 'Flanked': return 'their blow on your flank';
      case 'The ground': return `${GROUND[c.note] || 'the ground'}, which ${up ? 'slowed their horse' : 'slowed your horse'}`;
      case 'The weather': return `the ${c.note}, which ${up ? 'spoiled their shooting' : 'spoiled your shooting'}`;
      case 'Leading from the front': return 'your banner in the front rank';
      case 'The troops': return up ? 'heavier, better fighting troops' : 'their heavier, better fighting troops';
      default: return c.note === 'held' ? `${c.label.replace(/^Your /, 'your ').replace(/^Their /, 'their ')}, which held` : c.label.replace(/^Your /, 'your ').replace(/^Their /, 'their ');
    }
  }
  const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth'];
  const list = xs => (xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]);

  A.aarText = function (B, causes, where, t) {
    const me = B.pcSide || 'A', won = B.winner === me, lost = B.winner === other(me);
    const plus = causes.filter(c => c.pct > 0), minus = causes.filter(c => c.pct < 0);
    const out = [];
    const lead = won ? 'What won it' : lost ? 'What helped you' : 'What held it for you';
    if (plus.length) out.push(`${lead}: ${list(plus.map(c => `${phrase(c)} (${fmtPct(c.pct)})`))}.`);
    if (minus.length) out.push(`${lost ? 'What lost it' : 'What cost you'}: ${list(minus.map(c => `${phrase(c)} (${fmtPct(c.pct)})`))}.`);
    if (!causes.length) out.push('Neither side found an edge worth the name. It was decided man by man.');
    const top = (where || []).slice().sort((a, b) => b.pct - a.pct)[0];
    // the rout is a consequence, so it is told, not scored
    const rNet = t ? t[me].rout - t[other(me)].rout : 0, rAll = t ? t.A.rout + t.B.rout : 0;
    if (t && rAll > 0 && Math.abs(rNet) > rAll * 0.5) out.push(rNet > 0 ? (t.broke[other(me)] ? `Their line broke first, in the ${ORD[t.broke[other(me)]] || 'last'} push, and the rout did the rest.` : 'They gave way at the end, and the pursuit did the rest.')
      : (t.broke[me] ? `Your line broke first, in the ${ORD[t.broke[me]] || 'last'} push, and most of your dead fell running.` : 'Your men gave way at the end, and most of your dead fell running.'));
    else if (top && top.pct >= 40 && top.label !== 'the rout and pursuit') out.push(`Most of the dead fell on ${top.label}.`);
    if (t && t.champ === 'win') out.push('Their champion fell to your hand, and the lines saw it.');
    else if (t && t.champ === 'loss') out.push('Their champion beat you in the press, and the lines saw that too.');
    return out.join(' ');
  };

  // A short line for the story log
  A.aarLine = function (aar) {
    if (!aar || !aar.causes || !aar.causes.length) return null;
    return 'After the battle, the captains reckon it: ' + aar.causes.map(c => `${c.label.toLowerCase()} ${fmtPct(c.pct)}`).join(', ') + '.';
  };

  wrap('battleClose', base => function () {
    const q = A.S.queue[0], B = q && q.type === 'battle' ? q.b : null;
    const r = base.apply(this, arguments);
    if (B && B.aar) {
      const w = B.war && A.S.wars.find(x => x.id === B.war), last = w && w.battles && w.battles[w.battles.length - 1];
      // war records are signed for the war's attacker, like those from A.warYear
      const flip = w && A.warSide(w, B.sides[B.pcSide].realm) === 'def' ? -1 : 1;
      if (last && last.name === B.title && !last.aar) last.aar = B.aar.causes.map(c => ({ label: c.label, pct: c.pct * flip }));
      const line = A.aarLine(B.aar);
      if (line && A.pc() && A.pc().alive) A.log(line, '');
    }
    return r;
  });

  // ---- The war map: multi-day division fights (A.fightDay). Each day's tactics, ground, winter, walls and the quality
  // of the divisions are scored the same way, in kill-equivalents for the attacker, and the report is written when the
  // fight ends. Its causes go on the war's battle record; if you were there, a line goes in your story.
  let lastM = null;
  wrap('tacDay', base => function (F) { const m = base.apply(this, arguments); lastM = { F, m }; return m; });
  const divQ = ids => {   // mean attack multiplier (kit, drill, experience, generals) of a side's divisions, weighted by men
    let w = 0, v = 0;
    for (const id of ids) {
      const d = A.divById(id); if (!d || !(d.men > 0)) continue;
      const s = A.divS(d), raw = (s.soft || 0) + (s.hard || 0); if (!raw) continue;
      const c = A.divCombat(d); w += d.men; v += d.men * ((c.soft + c.hard) / raw);
    }
    return w ? v / w : 1;
  };
  function fightDayTally(F) {
    if (!F || F.aarDay === F.days || F.dayA == null) return;
    F.aarDay = F.days;
    const t = F.aarT || (F.aarT = { ground: 0, winter: 0, walls: 0, qual: 0, dead: 0, tac: {}, caught: 0, rout: null });
    const dA = F.dayA || 0, dD = F.dayD || 0, mods = F.mods || {}, m = lastM && lastM.F === F ? lastM.m : null;
    t.dead += dA + dD;
    if (mods.terr && mods.terr !== 1) t.ground += dD * (1 - 1 / mods.terr);
    if (mods.winter && mods.winter !== 1) t.winter += dD * (1 - 1 / mods.winter);
    if (mods.fort) { const fm = 1 - 0.08 * mods.fort * (1 - (m ? m.fortIgnore : 0)); if (fm > 0 && fm < 1) t.walls -= dD * (1 / fm - 1); }
    if (m) {
      const aMul = m.aDmg * m.casD, dMul = m.dDmg * m.casA;
      const v = (aMul > 0 ? dD * (1 - 1 / aMul) : 0) - (dMul > 0 ? dA * (1 - 1 / dMul) : 0);
      const note = ((F.log || [])[F.log.length - 1] || [])[3] || '';
      const key = `${F.tacA}|${F.tacD}|${note}`;
      if (v) t.tac[key] = (t.tac[key] || 0) + v;
    }
    const qa = divQ(F.aIds || []), qd = divQ(F.dIds || []), mq = (qa + qd) / 2;
    t.qual += (qa > 0 ? dD * (1 - mq / qa) : 0) - (qd > 0 ? dA * (1 - mq / qd) : 0);
    if (F.days <= 2 && (F.dIds || []).some(id => { const d = A.divById(id); return d && d.caught; })) t.caught = 1;
    if (F.rout) t.rout = F.rout;
  }
  wrap('fightDay', base => function (pid) {
    const r = base.apply(this, arguments);
    fightDayTally(A.S.fights && A.S.fights[pid]);
    return r;
  });
  // war-map tactic names as nouns (some defences are named as orders: "Hold a reserve", "Dig in")
  const NOUN = { hold: 'Plain defence', dig: 'Entrenchments', reserve: 'Held reserve' };
  const WT = k => NOUN[k] || (A.WTAC && A.WTAC[k] ? A.WTAC[k].n : k || 'no plan');
  // The report for one fight, from the side of `forAtt` (true: the attacker)
  A.aarFight = function (F, forAtt, neutral) {
    const t = F && F.aarT; if (!t || !(t.dead > 0)) return null;
    const sg = forAtt ? 1 : -1, all = [];
    const add = (label, kv, note) => { const pct = rnd(100 * sg * kv / t.dead); if (pct) all.push({ label, pct, note: note || '' }); };
    const P = A.S.prov[F.loc] || {};
    add('The ground', t.ground, P.terr);
    add('Winter', t.winter);
    add('The walls', t.walls);
    add('Drill, kit and experience', t.qual);
    for (const [key, v] of Object.entries(t.tac)) {
      const [ta, td, note] = key.split('|');
      const mineA = forAtt, nA = WT(ta).toLowerCase(), nD = WT(td).toLowerCase();
      const label = neutral ? (note === 'countered' ? `${WT(td)} countered ${nA}` : note === 'trap' ? `${WT(ta)} drew a counterattack` : `${WT(ta)} against ${nD}`)
        : note === 'countered' ? (mineA ? `Their ${WT(td).toLowerCase()} countered your ${WT(ta).toLowerCase()}` : `Your ${WT(td).toLowerCase()} countered their ${WT(ta).toLowerCase()}`)
        : note === 'trap' ? (mineA ? `Your ${WT(ta).toLowerCase()} drew their counterattack` : `Their ${WT(ta).toLowerCase()} drew your counterattack`)
        : (mineA ? `Your ${WT(ta).toLowerCase()} against their ${WT(td).toLowerCase()}` : `Their ${WT(ta).toLowerCase()} against your ${WT(td).toLowerCase()}`);
      add(label, v);
    }
    all.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
    const best = all.filter(c => c.pct > 0)[0], worst = all.filter(c => c.pct < 0)[0];
    const causes = [best, worst].filter(Boolean);
    for (const c of all) if (causes.length < 3 && !causes.includes(c)) causes.push(c);
    causes.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
    const words = [];
    if (t.caught) words.push(forAtt ? 'You caught them on the march.' : 'They caught you on the march.');
    if (t.rout) words.push((t.rout === 'def') === forAtt ? 'Their divisions broke and were run down.' : 'Your divisions broke and were run down.');
    if (!causes.length) words.unshift('Neither side found an edge worth the name.');
    return { causes: causes.map(c => ({ label: c.label, pct: c.pct })), text: words.join(' ') };
  };
  wrap('fightEnd', base => function (pid, winner) {
    const S = A.S, F = S.fights && S.fights[pid];
    if (F) fightDayTally(F);
    const nW = F && (S.wars.find(x => x.id === F.war) || {}).battles, n0 = nW ? nW.length : 0;
    const lastLog = () => { const e = S.log[S.log.length - 1]; return e && e.lines ? e.lines.length + '|' + e.year : ''; };
    const l0 = lastLog();
    const r = base.apply(this, arguments);
    if (!F || !F.aarT) return r;
    try {
      const war = S.wars.find(x => x.id === F.war), atkR = war && A.aarFight(F, A.warSide(war, F.a) === 'att', true);
      if (atkR && nW && nW.length > n0 && nW[nW.length - 1].name === 'Battle of ' + (S.prov[pid] || {}).name) nW[nW.length - 1].aar = atkR.causes;
      // the base wrote you a line about this fight: add the reckoning from your side
      const pc = A.pc();
      if (pc && pc.alive && pc.mil && lastLog() !== l0) {
        const inFight = pc.mil.div && (F.aIds || []).concat(F.dIds || []).includes(pc.mil.div);
        const forAtt = inFight ? (F.aIds || []).includes(pc.mil.div) : A.friendly(F.a, pc.mil.realm);
        const R = A.aarFight(F, forAtt), line = A.aarLine(R);
        if (line) A.log(line + (R.text ? ' ' + R.text : ''), '');
      }
    } catch (e) { console.error('after-action report (war map)', e); }
    return r;
  });

  // " (decided by ...)" for a battle record: the biggest cause that favoured the winner. Plain text; callers escape it.
  A.aarWhy = function (b) {
    if (!b || !Array.isArray(b.aar) || !b.aar.length) return '';
    // battle records carry causes signed for the war's attacker; b.win names the winning side
    const sg = b.win === 'att' ? 1 : b.win === 'def' ? -1 : 0;
    const c = sg ? b.aar.filter(x => x.pct * sg > 0).sort((x, y) => Math.abs(y.pct) - Math.abs(x.pct))[0] : null;
    return c ? ` (decided by ${c.label.toLowerCase()})` : '';
  };

  // the report on the battle's last screen
  const modal = UI.battleModalBasic;
  if (typeof modal === 'function' && !modal.aar) {
    UI.battleModalBasic = function (B) {
      const h = modal.apply(this, arguments);
      if (!B || B.phase !== 'end' || !B.aar) return h;
      const R = B.aar;
      const row = c => `<li><span class="${c.pct > 0 ? 'good' : 'bad'}">${UI.esc(fmtPct(c.pct))}</span> ${UI.esc(c.label)}</li>`;
      const box = '<div class="card small aar" role="region" aria-label="After-action report"><b>After-action report</b>' +
        (R.causes.length ? `<ul class="aar-causes">${R.causes.map(row).join('')}</ul>` : '') +
        `<p>${UI.esc(R.text)}</p>` +
        (R.where && R.where.length ? `<p class="tiny muted">Where the dead fell: ${UI.esc(R.where.map(w => `${w.label} ${w.pct}%`).join(', '))}.</p>` : '') +
        '<p class="tiny muted">Each figure is the dead that cause added or spared, as a share of those who fell in the fighting before the rout.</p></div>';
      return h.replace('<button class="primary" data-a="bClose">', box + '<button class="primary" data-a="bClose">');
    };
    UI.battleModalBasic.aar = true;
  }
})();
