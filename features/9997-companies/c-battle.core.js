// 9997-companies, part 3: the line battle built from the real division that is fighting, formations gated by drill,
// orders to exactly the units your rank commands, captains who act on their temper, intents, and the fold back.
//
// When an officer's tactical battle (the release's wsPart) is opened for a war-map fight, A.newBattle is given that
// fight's divisions (A._battlePlace names the fight). Units come from state:
//   - the player's own battalion fights as its four companies;
//   - every other battalion of his division fights as one unit;
//   - other divisions are grouped as one unit per troop type (at most CO.GROUPS a side).
// Each unit carries its sources (u.src: [divId, battalion, company | -1, men]), its captain, its drill (u.dl, 60's
// record of the division it comes from) and its shape (u.form). At the end every unit's dead go back to the
// companies they came from, a third of them wounded; the map fight's next days take those dead as already fallen
// (d.coCredit), so they are counted once.
(function () {
  const CO = A.CO, K = CO.K, clamp = CO.clamp, hash = CO.hash;
  CO.GROUPS = 8;
  const ANIMALS = { EL: 15, GI: 60 };   // the release's line battle counts beasts, not crews

  // ---- formations: the shape, separate from the order (u.form beside u.tac)
  //   front: frontage; mis: against missiles; horse: against horse; att: attack (wedge: the first push only);
  //   spd: speed (0 = it does not advance); drill: the drill it needs at 15 or more (60's families)
  const FOOT = u => { const T = GD.TROOPS[u.code]; return T && !T.mount && !T.beast; };
  const MIS = u => { const T = GD.TROOPS[u.code]; return T && T.missile >= 2.5 && !T.mount; };
  const has = (...cs) => u => cs.includes(baseCode(u.code));
  const baseCode = c => { const B = GD.BN[c]; if (B) return c; const m = /^X/.test(c) && GD.TROOPS[c] && GD.TROOPS[c].name; if (!m) return c; if (/heavy cav/i.test(m)) return 'HC'; if (/heavy inf/i.test(m)) return 'HI'; if (/spear/i.test(m)) return 'SP'; if (/bow|archer/i.test(m)) return 'AR'; return c; };
  GD.FORMATIONS = {
    line: { name: 'Line', who: FOOT, front: 1, mis: 1, horse: 1, att: 1, spd: 1, drill: null, d: 'Shoulder to shoulder, two or three deep: the shape every foot soldier knows.' },
    wall: { name: 'Shield wall', who: has('SP', 'HI', 'MR', 'GA'), front: 0.9, mis: 1.35, horse: 1.2, att: 0.8, spd: 0.5, drill: 'shields', d: 'Shields locked rim over rim. Arrows and horses break on it; it pushes poorly.' },
    hedge: { name: 'Hedge', who: has('PK', 'SP'), front: 0.8, mis: 0.9, horse: 1.6, att: 0.9, spd: 0.4, drill: 'shields', d: 'Points out, butts grounded. No horse rides into it twice.' },
    loose: { name: 'Loose order', who: u => MIS(u) || has('LI', 'SL', 'SC')(u), front: 1.3, mis: 1.4, horse: 0.6, att: 0.9, spd: 1.2, drill: 'skirmish', d: 'Spread wide, every man his own target. Arrows find little; horse rides them down.' },
    wedge: { name: 'Wedge', who: has('HC', 'HI', 'AX', 'MC'), front: 0.6, mis: 0.9, horse: 0.9, att: 1.4, spd: 1.1, drill: 'charge', first: true, d: 'The best men at the point. The first push goes deep.' },
    column: { name: 'Column', who: () => true, front: 0.4, mis: 0.7, horse: 0.7, att: 0.8, spd: 1.5, drill: 'march', d: 'Ranks behind ranks, for the road. Quick to move, poor to fight.' },
    ring: { name: 'Ring', who: () => true, front: 0.7, mis: 1.1, horse: 1.3, att: 0.7, spd: 0, drill: 'formation', flanked: true, d: 'Faces every way at once. For men who are flanked: it holds, it cannot go forward.' },
  };
  const F = GD.FORMATIONS;
  const D = () => A.DRILL;
  CO.formLevel = (u, k) => { const f = F[k]; if (!f || !f.drill) return 1; return u.dl ? (u.dl[f.drill] || 0) : (D() ? D().DRILLED : 0.4); };
  // which shapes a unit may take, and why the rest are not offered (pure)
  CO.formsFor = function (B, u) {
    const out = [];
    for (const k in F) {
      const f = F[k];
      if (k !== 'line' && !f.who(u)) continue;
      if (k === 'line' && !FOOT(u)) { out.push({ k, ok: true, why: '' }); continue; }
      const lv = CO.formLevel(u, k), gate = D() ? D().GATE : 0.15;
      if (f.drill && lv < gate) { out.push({ k, ok: false, why: `never drilled (${D() ? D().NAME[f.drill] : f.drill} ${Math.round(lv * 100)})` }); continue; }
      if (k === 'column' && B && B.phase !== 'deploy') { out.push({ k, ok: false, why: 'only before the lines meet' }); continue; }
      out.push({ k, ok: true, why: f.drill ? `${D() ? D().word(lv) : ''} ${Math.round(lv * 100)}` : '' });
    }
    return out;
  };
  const scale = lv => (D() ? D().scale(lv) : 1);
  const eff = (m, u, k) => 1 + (m - 1) * (F[k].drill ? scale(CO.formLevel(u, k)) : 1);
  let CUR = null, CTX = null;   // the battle being stepped; the wings clashing
  const horseShare = us => { let h = 0, t = 0; for (const x of us || []) { t += x.men; if (GD.TROOPS[x.code] && GD.TROOPS[x.code].mount) h += x.men; } return t ? h / t : 0; };
  const tfx = A.tfx;
  A.tfx = function (u, key, def) {
    const v = tfx.apply(this, arguments);
    if (!u || !u.form || u.form === 'line' || !F[u.form]) return (u && u.ord === 'charge' && key === 'charge') ? Math.max(typeof v === 'number' ? v : 0, 1.1) : v;
    const k = u.form, f = F[k];
    if (key === 'noAdvance') return f.spd === 0 ? true : v;
    if (typeof v !== 'number') return v;
    let out = v;
    if (key === 'att') { const a = f.first && CUR && CUR.pulse > 2 ? 1 : f.att; out *= eff(a, u, k) * eff(0.8 + 0.2 * f.front, u, k); }
    else if (key === 'missileDef') out *= eff(f.mis, u, k);
    else if (key === 'def' && CTX) { const them = CTX.ua.includes(u) ? CTX.ub : CTX.ub.includes(u) ? CTX.ua : null; if (them) out *= 1 + (eff(f.horse, u, k) - 1) * horseShare(them); }
    else if (key === 'flank' && k === 'ring') out *= 1 / eff(1.3, u, k);
    else if (key === 'charge' && u.ord === 'charge') out = Math.max(out, 1.1);
    return out;
  };
  const wingClash = A.wingClash;
  A.wingClash = function (B, wa, wb) {
    const prev = CTX, ok = u => u.men > 0 && (u.status === 'ok' || u.status === 'shaken');
    CTX = { ua: B.sides.A.units.filter(u => u.wing === wa && ok(u)), ub: B.sides.B.units.filter(u => u.wing === wb && ok(u)) };
    try { return wingClash.apply(this, arguments); } finally { CTX = prev; }
  };

  // ---- who the player commands in this battle (pure)
  CO.rankOf = B => (B && B.co ? B.co.rank : 9);
  CO.commands = function (B, u) {
    if (!B || !B.co || !u || u.id[0] !== B.pcSide) return false;
    const rk = B.co.rank;
    if (rk >= 7) return true;
    if (rk >= 6) return !!u.coMine;
    if (rk >= 4) return u.coMine === 'me';
    return false;
  };

  // ---- building the units
  const qOf = (b, d, c) => 0.8 + (b.x || 0) / 250 + 0.1 * (CO.drillOf(d, c) / 100);
  const dlOf = d => { const Dr = D(); if (!Dr) return null; const r = Dr.of(d), o = {}; for (const k of Dr.FAMS) o[k] = Math.round((r[k] || 0) * 1000) / 1000; return o; };
  function unit(side, n, code, name, men, mo, q, src, extra) {
    const T = GD.TROOPS[code] || GD.TROOPS.SP, f = ANIMALS[code] || 1;
    const m = Math.max(1, Math.round(men / f));
    return Object.assign({ id: side + n, code: GD.TROOPS[code] ? code : 'SP', name, men: m, men0: m, q, morale: clamp(mo + 20, 10, 110), fat: 0, wing: 'C', tac: 'hold', status: 'ok', once: {}, killed: 0, src, form: 'line' }, extra || {});
  }
  CO.buildSide = function (side, divs, me) {
    const units = [];
    let n = 0;
    const groups = new Map();
    for (const d of divs) {
      CO.ensure(d);
      const dl = dlOf(d);
      for (let i = 0; i < d.bs.length; i++) {
        const b = d.bs[i];
        if (CO.isSup(b.c) || CO.bm(b) <= 0 || !GD.TROOPS[b.c]) continue;
        const mineDiv = me && d.id === me.div, mineBn = mineDiv && i === me.b;
        if (mineBn && me.rank <= 6) {
          for (let ci = 0; ci < b.k.length; ci++) {
            if (b.k[ci] <= 0) continue;
            const c = CO.cap(d, i, ci);
            units.push(unit(side, n++, b.c, CO.coName(d, i, ci, true), b.k[ci], b.q[ci], qOf(b, d, b.c), [[d.id, i, ci, b.k[ci]]],
              { dl, cap: c ? { seed: c.seed, pid: c.pid || null, name: c.name, given: c.given, temper: c.temper, cmd: c.cmd } : null, coMine: ci === me.i ? 'me' : 'bn', coLabel: CO.coName(d, i, ci) }));
          }
        } else if (mineDiv) {
          const c = CO.cap(d, i, 4) || CO.cap(d, i, 0);
          units.push(unit(side, n++, b.c, CO.bnName(d, i), CO.bm(b), CO.bMo(b), qOf(b, d, b.c), [[d.id, i, -1, CO.bm(b)]],
            { dl, cap: c ? { seed: c.seed, pid: c.pid || null, name: c.name, given: c.given, temper: c.temper, cmd: c.cmd } : null, coLabel: CO.bnName(d, i) }));
        } else {
          let g = groups.get(b.c);
          if (!g) { g = { code: b.c, men: 0, mo: 0, q: 0, src: [], dl: {}, w: 0 }; groups.set(b.c, g); }
          const m = CO.bm(b);
          g.men += m; g.mo += CO.bMo(b) * m; g.q += qOf(b, d, b.c) * m; g.src.push([d.id, i, -1, m]);
          if (dl) for (const k in dl) g.dl[k] = (g.dl[k] || 0) + dl[k] * m;
          g.w += m;
        }
      }
    }
    // other divisions: one unit per troop type, the smallest folded into the biggest of their kind past CO.GROUPS
    let gs = [...groups.values()].sort((a, b) => b.men - a.men || (a.code < b.code ? -1 : 1));
    while (gs.length > CO.GROUPS) {
      const g = gs.pop(), cat = (GD.BN[g.code] || {}).cat, into = gs.find(x => (GD.BN[x.code] || {}).cat === cat) || gs[0];
      into.men += g.men; into.mo += g.mo; into.q += g.q; into.w += g.w; into.src.push(...g.src); for (const k in g.dl) into.dl[k] = (into.dl[k] || 0) + g.dl[k];
    }
    for (const g of gs) {
      const dl = {}; for (const k in g.dl) dl[k] = Math.round(g.dl[k] / g.w * 1000) / 1000;
      const nb = g.src.length;
      units.push(unit(side, n++, g.code, `${CO.troopWord(g.code)} (${nb} battalion${nb > 1 ? 's' : ''})`, g.men, g.mo / g.w, g.q / g.w, g.src, { dl: D() ? dl : null, grp: nb }));
    }
    // wings as the release sets them: horse to the flanks, foot across the line, 30% of the best other foot in reserve
    const horse = units.filter(u => GD.TROOPS[u.code].mount && !GD.TROOPS[u.code].beast);
    horse.forEach((u, i) => { u.wing = i % 2 ? 'R' : 'L'; });
    const foot = units.filter(u => !GD.TROOPS[u.code].mount && !u.coMine).sort((a, b) => b.men - a.men);
    const order = ['C', 'L', 'R'];
    foot.forEach((u, i) => { u.wing = order[i % 3]; });
    for (const u of units) if (u.coMine) u.wing = 'C';
    const bigFoot = foot.filter(u => !u.coMine).sort((a, b) => (GD.TROOPS[b.code].melee - GD.TROOPS[a.code].melee) || b.men - a.men)[0];
    if (bigFoot && bigFoot.men > 40 && units.length > 2) {
      const take = Math.round(bigFoot.men * 0.3), r = Object.assign({}, bigFoot, { id: side + n++, men: take, men0: take, wing: 'X', once: {}, name: bigFoot.name + ', reserve' });
      r.src = splitSrc(bigFoot.src, take / bigFoot.men); bigFoot.src = subSrc(bigFoot.src, r.src);
      bigFoot.men -= take; bigFoot.men0 = bigFoot.men;
      units.push(r);
    }
    // a wing with nobody in it takes the smallest unit of the centre
    for (const w of ['L', 'R']) if (!units.some(u => u.wing === w)) { const c = units.filter(u => u.wing === 'C' && !u.coMine).sort((a, b) => a.men - b.men)[0]; if (c) c.wing = w; }
    return units.filter(u => u.men > 0);
  };
  const splitSrc = (src, f) => src.map(([d, i, ci, m]) => [d, i, ci, Math.round(m * f)]);
  const subSrc = (src, part) => src.map((s, j) => [s[0], s[1], s[2], Math.max(0, s[3] - part[j][3])]);

  // the battle's source: the war-map fight this tactical battle is for, and the player's place in it (pure)
  CO.battleSource = function (o) {
    const S = A.S, pc = A.pc(), pid = A._battlePlace;
    if (!S.coOn || pid == null || !pc || !pc.mil || pc.ruler || pc.mil.merc || !o || !o.sideA || o.sideA.commander !== pc.id) return null;
    const Fg = S.fights && S.fights[pid];
    if (!Fg) return null;
    const live = id => { const d = A.divById(id); return d && (d.atk === pid || d.loc === pid) && d.men > 0 ? d : null; };
    const a = Fg.aIds.map(live).filter(Boolean), d = Fg.dIds.map(live).filter(Boolean);
    const mineA = a.some(x => x.id === pc.mil.div), mineD = d.some(x => x.id === pc.mil.div);
    if (!mineA && !mineD) return null;
    return { F: Fg, pid, ours: mineA ? a : d, theirs: mineA ? d : a, weAtt: mineA };
  };
  let BUILD = null;
  const buildUnits = A.buildUnits;
  A.buildUnits = function (side) {
    if (BUILD && BUILD[side]) { const u = BUILD[side]; BUILD[side] = null; return u; }
    return buildUnits.apply(this, arguments);
  };
  const newBattle = A.newBattle;
  A.newBattle = function (o) {
    let src = null;
    try { src = CO.battleSource(o); } catch (e) { console.error('companies battle source', e); }
    if (!src) return newBattle.apply(this, arguments);
    const pc = A.pc(), M = CO.place(pc), me = M ? { div: M.div, b: M.b, i: M.i, rank: pc.mil.rank || 0 } : null;
    const ua = CO.buildSide('A', src.ours, me), ub = CO.buildSide('B', src.theirs, null);
    const sum = us => us.reduce((x, u) => x + u.men * (ANIMALS[u.code] || 1), 0);
    o = Object.assign({}, o, { sideA: Object.assign({}, o.sideA, { men: ua.reduce((x, u) => x + u.men, 0), divs: src.ours }), sideB: Object.assign({}, o.sideB, { men: ub.reduce((x, u) => x + u.men, 0), divs: src.theirs }) });
    const prev = BUILD;
    BUILD = { A: ua, B: ub };
    let B;
    try { B = newBattle.call(this, o); } finally { BUILD = prev; }
    B.co = { pid: src.pid, key: src.F.key, start: src.F.start, rank: me ? me.rank : 0, me, follow: false, menA: sum(ua), menB: sum(ub), pre: 0 };
    B.log.push(`${A.fmt(B.co.menA)} men of ${src.ours.length} division${src.ours.length > 1 ? 's' : ''} against ${A.fmt(B.co.menB)}: the field is the fight at ${A.S.prov[src.pid].name}, as it stands.`);
    // the player's own side: captains choose their shapes and orders; what he commands waits for him
    for (const u of B.sides.A.units) if (!CO.commands(B, u)) CO.captainActs(B, u, true);
    for (const u of B.sides.B.units) CO.captainActs(B, u, true);
    CO.intents(B);
    return B;
  };

  // ---- captains who act on their temper (engine; draws only through A.chance)
  const temperOf = u => (u.cap && u.cap.temper) || (u.grp ? 'steady' : 'steady');
  CO.pickForm = function (B, u) {
    const t = temperOf(u), opts = CO.formsFor(B, u).filter(x => x.ok).map(x => x.k);
    const s = B.sides[u.id[0]], o = B.sides[u.id[0] === 'A' ? 'B' : 'A'];
    const flanked = B.flank && B.flank[u.id[0] === 'A' ? 'B' : 'A'] && u.wing === 'C';
    const theirHorse = horseShare(o.units.filter(x => x.wing === (u.wing === 'L' ? 'R' : u.wing === 'R' ? 'L' : u.wing) && x.status !== 'gone'));
    const want = [];
    if (flanked) want.push('ring');
    if (theirHorse > 0.3) want.push('hedge', 'wall');
    if (t === 'bold') want.push('wedge', 'line');
    if (t === 'cautious') want.push('wall', 'hedge', 'loose');
    if (t === 'cunning') want.push('loose', 'line');
    if (MIS(u)) want.push('loose');
    want.push('line');
    return want.find(k => opts.includes(k) && k !== 'column') || (opts.includes('line') ? 'line' : opts[0] || null);
  };
  CO.captainActs = function (B, u, deploy) {
    if (!u || u.status === 'gone' || u.status === 'rout') return;
    const f = CO.pickForm(B, u);
    if (f && FOOT(u)) u.form = f;
    if (deploy) return;
    const t = temperOf(u), o = B.sides[u.id[0] === 'A' ? 'B' : 'A'];
    const facing = o.units.filter(x => x.wing === (u.wing === 'L' ? 'R' : u.wing === 'R' ? 'L' : u.wing) && x.status !== 'gone');
    if (t === 'bold' && facing.some(x => x.status === 'shaken') && A.chance(0.15) && A.tacFitsUnit('advance', u)) { u.tac = 'advance'; u.ord = 'charge'; u.capMove = 'charges the shaken line without orders'; }
    if (t === 'cautious' && u.morale < 35 && !u.withdrawing) { u.tac = 'withdraw'; u.withdrawing = true; u.capMove = 'pulls his men back in order'; }
  };
  // the next pulse's moves, recorded where the screen can show them: u.next (the move the engine will make)
  const INTENT = t => { const T = GD.BATTLE_TACTICS[t] || {}; if (t === 'withdraw') return 'withdraw'; if (t === 'rally') return 'rally'; if (t === 'flank' || t === 'sweep') return 'flank'; if ((T.fx && T.fx.charge) || t === 'advance') return T.fx && T.fx.charge ? 'charge' : 'advance'; return 'hold'; };
  CO.intents = function (B) { for (const k of ['A', 'B']) for (const u of B.sides[k].units) u.next = u.status === 'gone' ? null : (u.ord === 'charge' ? 'charge' : INTENT(u.tac)); };
  const aiPulse = A.aiPulse;
  A.aiPulse = function (B, side) {
    if (B && B.co && B.co.pre === B.pulse && side !== B.pcSide) return;   // already chosen at the end of the last pulse
    return aiPulse.apply(this, arguments);
  };
  const battleStep = A.battleStep;
  A.battleStep = function () {
    const q = A.S.queue[0], B = q && q.type === 'battle' ? q.b : null;
    if (!B || !B.co) return battleStep.apply(this, arguments);
    const prev = CUR;
    CUR = B;
    let r;
    try {
      if (B.phase !== 'end') {
        // the player's side: units he does not command move on their captains' tempers; the AI's wing tactics for them
        const mine = B.sides[B.pcSide].units, keep = mine.filter(u => CO.commands(B, u)).map(u => [u, u.tac, u.wing]);
        if (B.pulse >= 1) { aiPulse.call(A, B, B.pcSide); for (const [u, t, w] of keep) { u.tac = t; u.wing = w; } }
        for (const u of mine) if (!CO.commands(B, u)) CO.captainActs(B, u, false);
      }
      r = battleStep.apply(this, arguments);
      if (B.phase !== 'end') {
        const ai = B.pcSide === 'A' ? 'B' : 'A';
        B.pulse++;
        try { aiPulse.call(A, B, ai); for (const u of B.sides[ai].units) CO.captainActs(B, u, false); } finally { B.pulse--; }
        B.co.pre = B.pulse + 1;
        CO.intents(B);
      } else for (const k of ['A', 'B']) for (const u of B.sides[k].units) u.next = null;
    } finally { CUR = prev; }
    return r;
  };

  // ---- orders: exactly the units your rank commands (journal commands)
  CO.ORDERS = { hold: 'Hold', advance: 'Advance', charge: 'Charge', withdraw: 'Withdraw', rally: 'Rally' };
  const curBattle = () => { const q = A.S.queue[0]; return q && q.type === 'battle' ? q.b : null; };
  CO.orderOk = function (B, u, k) {
    if (!CO.commands(B, u) || u.status === 'gone') return false;
    if (k === 'withdraw') return A.tacticsFor(B, B.pcSide, u.wing).includes('withdraw');
    if (k === 'charge') return A.tacFitsUnit('advance', u) && !A.tfx(u, 'noAdvance', false);
    return !!CO.ORDERS[k];
  };
  A.coOrder = function (uid, k) {
    const B = curBattle();
    if (!B || !B.co || B.phase === 'end') return { ok: false };
    const u = B.sides[B.pcSide].units.find(x => x.id === uid);
    if (!u || !CO.orderOk(B, u, k)) return { ok: false };
    const list = B.co.follow && B.co.rank === 6 ? B.sides[B.pcSide].units.filter(x => x.coMine && x.status !== 'gone') : [u];
    for (const x of list) {
      if (!CO.orderOk(B, x, k)) continue;
      x.ord = k === 'charge' ? 'charge' : null;
      x.tac = k === 'charge' ? 'advance' : k;
      if (k === 'withdraw') x.withdrawing = true;
    }
    const who = list.length > 1 ? 'your four companies' : u.name;
    B.log.push({ hold: `You hold ${who} where ${list.length > 1 ? 'they stand' : 'it stands'}.`, advance: `You take ${who} forward.`, charge: `You order ${who} to charge.`, withdraw: `You pull ${who} back in order.`, rally: `You rally ${who} on the colours.` }[k]);
    return { ok: true };
  };
  A.coForm = function (uid, k) {
    const B = curBattle();
    if (!B || !B.co || B.phase === 'end') return { ok: false };
    const u = B.sides[B.pcSide].units.find(x => x.id === uid);
    if (!u || !CO.commands(B, u)) return { ok: false };
    const ok = CO.formsFor(B, u).find(x => x.k === k && x.ok);
    if (!ok) return { ok: false };
    const list = B.co.follow && B.co.rank === 6 ? B.sides[B.pcSide].units.filter(x => x.coMine && x.status !== 'gone' && CO.formsFor(B, x).some(y => y.k === k && y.ok)) : [u];
    for (const x of list) x.form = k;
    B.log.push(`${list.length > 1 ? 'Your companies' : u.name} form ${F[k].name.toLowerCase()}.`);
    return { ok: true };
  };
  A.coFollow = function (on) { const B = curBattle(); if (B && B.co && B.co.rank === 6) B.co.follow = !!on; return { ok: true }; };
  A.COMMANDS && A.COMMANDS.push('coOrder', 'coForm', 'coFollow');
  // the release's wing orders reach only the units the player commands below the rank of commander
  const setTac = A.battleSetTactic;
  A.battleSetTactic = function (wing, tac) {
    const B = curBattle();
    if (!B || !B.co || B.co.rank >= 7) return setTac.apply(this, arguments);
    const others = B.sides[B.pcSide].units.filter(u => !CO.commands(B, u)).map(u => [u, u.tac]);
    const r = setTac.apply(this, arguments);
    for (const [u, t] of others) u.tac = t;
    return r;
  };
  const commitRes = A.battleCommitReserve;
  A.battleCommitReserve = function () {
    const B = curBattle();
    if (B && B.co && B.co.rank < 7) return;   // the reserve is the general's
    return commitRes.apply(this, arguments);
  };

  // ---- the end: dead and wounded back to their companies, captains in danger, the report cites units
  const battleFinish = A.battleFinish;
  A.battleFinish = function (B) {
    const was = B && B.phase;
    const r = battleFinish.apply(this, arguments);
    try { if (B && B.co && was !== 'end' && !B.co.folded) CO.fold(B); } catch (e) { console.error('companies fold', e); }
    return r;
  };
  CO.fold = function (B) {
    const S = A.S, Fg = S.fights && S.fights[B.co.pid];
    B.co.folded = true;
    const lines = [], pc = A.pc();
    for (const k of ['A', 'B']) {
      const won = B.winner === k;
      for (const u of B.sides[k].units) {
        if (!u.src) continue;
        const f = ANIMALS[u.code] || 1, lost = Math.max(0, Math.round((u.men0 - u.men) * f)), m0 = u.men0 * f;
        const tot = u.src.reduce((a, s) => a + s[3], 0);
        const parts = CO.split(lost, u.src.map(s => s[3]), u.src.map(s => s[3]));
        u.src.forEach((s, j) => {
          const d = A.divById(s[0]);
          if (!d || !CO.ok(d)) return;
          const b = d.bs[s[1]];
          let n = Math.min(parts[j], d.men);
          if (n > 0) {
            if (s[2] >= 0) { const take = Math.min(n, b.k[s[2]]); b.k[s[2]] -= take; n = take; }
            else { const cap = b.k.slice(), got = CO.split(n, cap, cap); for (let ci = 0; ci < b.k.length; ci++) b.k[ci] -= got[ci]; n = got.reduce((a, x) => a + x, 0); }
            const fr = n / Math.max(1, d.men);
            d.men -= n;
            for (const e in d.eq) d.eq[e] = Math.max(0, Math.round(d.eq[e] * (1 - fr * 0.85)));
            b.wd += n * K.WOUNDED;
            if (s[2] >= 0 && CO.mineIs(d, s[1], s[2]) && pc && pc.mil) pc.mil.coDead = (pc.mil.coDead || 0) + Math.round(n * (1 - K.WOUNDED));
            if (d.coCreditAt !== B.co.pid) d.coCredit = 0;
            d.coCredit = (d.coCredit || 0) + n; d.coCreditAt = B.co.pid;
            if (Fg) { if (Fg.aIds.includes(d.id)) Fg.deadA += n; else Fg.deadD += n; const L = (Fg.coL = Fg.coL || {}), row = (L[d.id] = L[d.id] || []); row[s[1]] = (row[s[1]] || 0) + n; }
          }
          const mo = clamp(u.morale - 20, 0, 100);
          if (s[2] >= 0) b.q[s[2]] = Math.round(mo * 10) / 10; else for (let ci = 0; ci < b.q.length; ci++) b.q[ci] = Math.round(mo * 10) / 10;
          CO.mean(d);
        });
        // a captain whose unit lost a quarter, or broke and was chased, is in danger
        const beaten = (u.status === 'rout' || u.status === 'gone') && !won && B.winner !== 'draw';
        if (u.cap && u.src.length === 1 && (lost >= m0 * 0.25 || beaten)) {
          const [did, bi, ci] = u.src[0], d = A.divById(did), slot = ci >= 0 ? ci : 4;
          const c = d && CO.ok(d) ? CO.cap(d, bi, slot) : null;
          if (c && !c.pc && A.chance(0.03 + (beaten ? 0.1 : 0))) {
            if (c.person) A.kill(c.person, 'battle');
            const rep = CO.replaceCap(d, bi, slot, 'fell');
            CO.stats.capDied++;
            if (k === B.pcSide) {
              const line = rep && rep.by ? `Captain ${c.name} falls with the ${u.name}. Sergeant ${rep.by.given} takes the company.` : `Captain ${c.name} falls at the head of the ${u.name}.`;
              B.log.push(line); A.log(line, 'death');
              if (ci >= 0 && CO.mineIs(d, bi, ci) && rep && rep.by) { const np = CO.person(d, bi, ci); CO.queueEv('co_new_captain', { pid: np ? np.id : null, old: c.given, coy: CO.coName(d, bi, ci, true) }); }
            }
          } else if (c && c.person && c.person.alive && lost >= m0 * 0.25 && A.chance(0.25)) { c.person.health = Math.max(10, (c.person.health || 100) - A.ri(8, 25)); }
        }
        if (k === B.pcSide && u.coMine && u.cap) lines[u.coMine === 'me' ? 'unshift' : 'push'](`The ${u.coLabel || u.name} ${won ? 'held' : B.winner === 'draw' ? 'stood' : 'gave ground'} under ${u.cap.pid === (pc && pc.id) ? 'you' : 'Captain ' + u.cap.name} (lost ${A.fmt(lost)} of ${A.fmt(m0)}${u.form && u.form !== 'line' ? ', in ' + F[u.form].name.toLowerCase() : ''}).`);
      }
    }
    if (B.aar && lines.length) B.aar.text = (B.aar.text ? B.aar.text + ' ' : '') + lines.slice(0, 2).join(' ');
    B.co.lines = lines;
  };

  // ---- what a unit is, for the screen (pure; lane G draws from this)
  CO.unitInfo = function (B, u) {
    if (!u) return null;
    const form = u.form && F[u.form] ? F[u.form] : null;
    return {
      id: u.id, name: u.coLabel || u.name, men: u.men, men0: u.men0, morale: Math.round(u.morale), status: u.status, wing: u.wing,
      captain: u.cap ? u.cap.name : null, temper: u.cap ? u.cap.temper : null, form: u.form || 'line', formName: form ? form.name : 'Line',
      order: u.ord === 'charge' ? 'charge' : INTENT(u.tac), next: u.next || null, commanded: CO.commands(B, u), mine: u.coMine === 'me', move: u.capMove || null,
      parts: [['Morale on the field', Math.round(u.morale)], ['Fatigue', -Math.round(u.fat || 0)], ['Quality', Math.round((u.q || 1) * 100) / 100]],
    };
  };
})();
