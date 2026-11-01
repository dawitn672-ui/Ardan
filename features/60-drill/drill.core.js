// Drill linked to battle tactics (Road to Ten, War 4: "Link drill to battle tactics. Shield-wall drill should beat a
// cavalry charge in the resolver, and the report should say so").
//
// The release already keeps a drill record on every division, d.dr = { formation, weapons, march, skirmish, shields,
// siege } (0 to about 1), built by the player's drill yard (A.drillDay) and read by A.divCombat as small attack and
// defence bonuses. But no AI division ever drilled, and no tactic asked whether the men had learned it. Now:
//
//  - Two more drills (GD.DRILLS.charge, the wedge and the couched lance; GD.DRILLS.feint, the feigned flight).
//  - Every division drills a month in camp (not marching, not fighting) in a focus set by what it is (horse, bows,
//    foot) and its general's temper (38-orders, when present), and every other drill fades slowly, to no less than half
//    of what a division of its kind always knows. A realm that pays for drill this year (the release's "Drill the host",
//    or 56-realm-inside's spending) lets its sergeants take the men further (CAP). A general's army drills
//    in the focus he sets in his drill yard. A division with no record reads a default made from what it is.
//  - Each tactic of the line battle (GD.BATTLE_TACTICS) and the war map (A.WTAC) needs a drill. Below GATE the men
//    have never practised it and it is not offered, to the player or the AI alike. Above it, its effect grows with the
//    drill: a half-learned wall gives about half of what the release gives, a hard-drilled one up to a third more.
//  - Counters in the resolver: a drilled shield wall sets its spears against horse, a wedge goes through a line that
//    never drilled to stand, a skirmish screen bleeds a slow block of foot, horses balk at a drilled wall (morale). On
//    the war map, drilled formation keeps order under pressure, and a charge run onto a drilled spear wall comes off it in disorder.
//  - The after-action report says it in words ("Their lances broke on a drilled hedge: +27%").
//
// Engine side only: everything here is read through A.tfx, A.tacticsFor, A.WTAC[k].ok and A.tacDay, and the month
// hook. No random draws are added. Rendering reads only.
(function () {
  const D = A.DRILL = {
    GATE: 0.15,       // below this a formation has never been practised: not offered
    DRILLED: 0.4,     // at this a tactic does what the release's does
    GAIN: 0.03,       // a month in camp, on the focus
    DECAY: 0.004,     // a month, on every other drill (half as much again on campaign)
    FLOOR: 0.5,       // a drill fades no lower than half of what a division of its kind always knows (D.base)
    CAP: 0.65,        // how far a realm's own sergeants take the men; +0.1 in a year the realm pays for drill
    K_WALL: 0.3,      // a drilled shield wall's spears against horse: antiCav x (1 + K_WALL x drill)
    K_WEDGE: 0.25,    // a wedge into a line with no drill to stand
    K_SCREEN: 0.4,    // a skirmish screen against a slow block
    K_ORG: 0.35,      // war map: organisation lost x (1 - K_ORG x (formation drill - DRILLED))
    K_BALK: 6,        // morale a charge loses each push it rides into a drilled wall, x (drill - 0.25) x the wall's share
  };
  const r3 = x => Math.round(x * 1000) / 1000;

  // ---- the drills
  Object.assign(GD.DRILLS, {
    charge: { short: 'Charge', name: 'Wedge and charge', ic: 'swords', d: 'Knee to knee at the trot, the wedge, the couched lance. Charges strike home and break raw lines.', fx: {} },
    feint: { short: 'Feint', name: 'Feigned flight', ic: 'route', d: 'Flee on one horn call, turn on the second. Riders who have not drilled it cannot do it.', fx: {} },
  });
  if (GD.DRILLS.siege && !/field/.test(GD.DRILLS.siege.d)) GD.DRILLS.siege.d += ' Stakes and ditches in the field too.';
  D.NAME = { shields: 'shield walls', charge: 'the charge', feint: 'the feigned flight', skirmish: 'skirmish', weapons: 'weapons', formation: 'formation', march: 'marches', siege: 'field works' };

  // what each tactic needs. Culture rites (Blood Fury, the Laughing Charge, Drum Storm), the giants' pairs, holding,
  // advancing, rallying and the style manoeuvres need no drill.
  D.LINE = {
    shieldwall: 'shields', spearwall: 'shields', setspear: 'shields', pikehedge: 'shields', hiddenspear: 'shields',
    lance: 'charge', flank: 'charge', sweep: 'charge', relay: 'charge', elephants: 'charge', camels: 'charge', noon: 'charge',
    feigned: 'feint', skirmish: 'skirmish', horsearch: 'skirmish', javelins: 'skirmish',
    massvolley: 'weapons', longbow: 'weapons', xbvolley: 'weapons',
    stakes: 'siege', ditch: 'siege', wagonfort: 'siege', bullhorns: 'formation', withdraw: 'formation',
  };
  D.MAP = { shock: 'charge', spearwall: 'shields', shieldwall: 'shields', feint: 'feint', infil: 'skirmish', barrage: 'weapons', elastic: 'formation' };
  // a tactic's strength for a drill level: 0.55 just past the gate, 1 (the release) at DRILLED, up to 1.3
  D.scale = v => (v < D.GATE ? 0.55 : v < D.DRILLED ? 0.55 + 0.45 * (v - D.GATE) / (D.DRILLED - D.GATE) : Math.min(1.3, 1 + 0.5 * (v - D.DRILLED)));
  D.word = v => (v >= 0.7 ? 'hard-drilled' : v >= D.DRILLED ? 'drilled' : v >= D.GATE ? 'half-drilled' : 'never drilled');

  // ---- records
  const comp = d => {
    const s = A.divS(d) || {}, c = s.cats || {}, n = Math.max(1, s.n || 1);
    return { horse: (c.horse || 0) / n, miss: (c.missile || 0) / n, foot: (c.foot || 0) / n, fast: (s.spd || 1) >= 1.1 ? 1 : 0 };
  };
  // what a division that never had a record knows: some of what its kind of troops always do
  D.base = function (d) {
    const c = comp(d);
    return { shields: r3(0.15 + 0.3 * c.foot), charge: r3(0.12 + 0.35 * c.horse), feint: r3(0.05 + 0.15 * c.horse + 0.1 * c.horse * c.fast),
      skirmish: r3(0.06 + 0.3 * c.miss + 0.1 * c.fast), weapons: 0.25, formation: 0.25, march: 0.15, siege: 0.2 };
  };
  // used when a side has no divisions of the kind (a realm with no horse divisions still brings riders to a field)
  D.GENERIC = { shields: 0.35, charge: 0.3, feint: 0.12, skirmish: 0.2, weapons: 0.25, formation: 0.25, march: 0.15, siege: 0.2 };
  D.FAMS = Object.keys(D.GENERIC);
  // a division's drill: its own record over the default (pure)
  D.of = function (d) {
    const b = D.base(d), dr = (d && d.dr) || {};
    for (const k in dr) if (typeof dr[k] === 'number') b[k] = dr[k];
    return b;
  };
  const REL = { shields: c => c.foot, charge: c => c.horse, feint: c => c.horse, skirmish: c => c.miss + 0.5 * c.fast, weapons: c => c.miss + 0.1 };
  // a side's drill: men-weighted, each drill weighted by the men it is for
  D.side = function (divs) {
    const out = {}, list = (divs || []).filter(d => d && d.men > 0);
    if (!list.length) return Object.assign({}, D.GENERIC);
    const tot = list.reduce((a, d) => a + d.men, 0), cs = list.map(comp), recs = list.map(D.of);
    for (const k of D.FAMS) {
      let w = 0, v = 0;
      list.forEach((d, i) => { const x = d.men * (REL[k] ? REL[k](cs[i]) : 1); w += x; v += x * (recs[i][k] || 0); });
      out[k] = w >= tot * 0.05 ? r3(v / w) : D.GENERIC[k];
    }
    return out;
  };
  D.realm = function (rid) {
    const r = A.realm(rid);
    return r && r.forces && r.forces.divs && r.forces.divs.length ? D.side(r.forces.divs) : Object.assign({}, D.GENERIC);
  };
  // the player's own men: the division, or what he drilled into his own part of it, whichever is higher
  D.mine = function (pc) {
    const u = A.myUnit && A.myUnit(pc);
    if (!u) return null;
    const rec = D.of(u), own = (pc.mil.drill && pc.mil.drill.own) || {};
    for (const k in own) if (typeof own[k] === 'number') rec[k] = Math.max(rec[k] || 0, own[k]);
    return rec;
  };

  // ---- the month in camp
  const temperOf = a => { try { return A.GENERALS && A.GENERALS.of ? A.GENERALS.of(a) : 'steady'; } catch (e) { return 'steady'; } };
  const hashId = s => { let h = 0; s = String(s); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
  // a division's three drills, most-drilled first: what it is, then its general's temper, then a third
  D.doctrine = function (d, a) {
    const c = comp(d), t = temperOf(a);
    const prim = c.horse >= 0.5 ? (c.fast && c.miss >= 0.2 ? 'feint' : 'charge') : c.miss >= 0.34 ? (c.fast ? 'skirmish' : 'weapons') : 'shields';
    const byT = { bold: c.horse >= 0.2 ? 'charge' : 'weapons', cautious: c.horse >= 0.5 ? 'formation' : c.miss >= 0.34 ? 'siege' : 'shields',
      cunning: c.horse >= 0.3 ? 'feint' : 'skirmish', steady: 'formation' }[t] || 'formation';
    const sec = byT !== prim ? byT : (prim === 'shields' ? 'formation' : prim === 'charge' ? 'feint' : 'weapons');
    let ter = c.horse >= 0.5 ? (prim === 'charge' ? 'feint' : 'charge') : c.miss >= 0.34 ? 'siege' : c.horse >= 0.15 ? 'charge' : 'weapons';
    if (ter === sec || ter === prim) ter = 'formation' !== prim && 'formation' !== sec ? 'formation' : 'weapons';
    return [prim, sec, ter];
  };
  // six months in turn: three on the first drill, two on the second, one on the third (no random draw)
  D.focusFor = function (d, a, month) {
    const doc = D.doctrine(d, a), slot = (month + hashId(d.id)) % 6;
    return slot < 3 ? doc[0] : slot < 5 ? doc[1] : doc[2];
  };
  D.month = function (pc) {
    const S = A.S, month = Math.floor(A.absDay() / 30), fights = S.fights || {};
    const my = pc && pc.alive && A.myUnit ? A.myUnit(pc) : null, share = my ? A.drillShare(pc) : 0;
    const genArmy = pc && pc.alive && pc.mil && !pc.mil.merc && pc.mil.rank >= 7 && pc.mil.drill ? pc.mil.army : null;
    const genQ = genArmy ? 0.8 + A.skill(pc, 'command') / 150 : 1;
    for (const rid in S.realms) {
      const r = S.realms[rid];
      if (!r || !r.forces || !Array.isArray(r.forces.divs)) continue;
      const cap = D.CAP + (r.drill === S.year || r.riDrill === S.year ? 0.1 : 0);
      for (const d of r.forces.divs) {
        if (!d || !(d.men > 0)) continue;
        const b = D.base(d);
        d.dr = d.dr || {};
        for (const k in b) if (typeof d.dr[k] !== 'number') d.dr[k] = b[k];
        const w = d === my ? 1 - share : 1;     // the player drills his own share himself (A.drillDay)
        if (w <= 0) continue;
        const idle = d.atk == null && !fights[d.loc] && !(d.path && d.path.length);
        const a = d.army ? A.army(d.army) : null, led = genArmy && a && a.id === genArmy;
        const focus = idle ? (led ? pc.mil.drill.focus : D.focusFor(d, a, month)) : null, g = led ? genQ : 1;
        for (const k of Object.keys(d.dr)) {
          const v = d.dr[k];
          if (typeof v !== 'number') continue;
          if (k === focus) { const c2 = led ? Math.max(cap, 0.5 + 0.5 * genQ) : cap; if (v < c2) d.dr[k] = r3(v + w * D.GAIN * g * (1 - v / c2)); }
          else if (v > (b[k] || 0) * D.FLOOR) d.dr[k] = r3(Math.max((b[k] || 0) * D.FLOOR, v - w * D.DECAY * (idle ? 1 : 1.5)));
        }
      }
    }
  };
  A.onMonth = A.onMonth || [];
  A.onMonth.push(pc => D.month(pc));

  // ---- the line battle: a drill record on every unit
  let PENDING = null;
  const sideRec = s => {
    if (!s) return null;
    if (s.dr) return s.dr;
    if (Array.isArray(s.divs)) return D.side(s.divs);
    const pc = A.pc();
    if (pc && s.commander && s.commander === pc.id && !pc.ruler && pc.mil && !pc.mil.merc) { const m = D.mine(pc); if (m) return m; }
    return s.realm ? D.realm(s.realm) : null;
  };
  const wrap = (obj, name, fn) => { const f = obj[name]; if (typeof f === 'function' && !f.drill) { obj[name] = fn(f); obj[name].drill = true; } };
  wrap(A, 'newBattle', base => function (o) {
    const prev = PENDING;
    PENDING = o ? { A: sideRec(o.sideA), B: sideRec(o.sideB) } : null;
    try { return base.apply(this, arguments); } finally { PENDING = prev; }
  });
  wrap(A, 'buildUnits', base => function (side) {
    const units = base.apply(this, arguments), rec = PENDING && PENDING[side];
    if (rec && Array.isArray(units)) for (const u of units) { u.dl = {}; for (const k of D.FAMS) u.dl[k] = r3(rec[k] || 0); }
    return units;
  });
  const wingRec = (B, side, wing) => {
    const us = ((B.sides[side] || {}).units || []);
    const u = us.find(x => x.wing === wing && x.dl) || us.find(x => x.dl);
    return u ? u.dl : null;
  };
  D.sideOf = (B, side) => wingRec(B, side, 'C');
  // the gate: what the men never practised is not offered (A.battleSetTactic, A.aiDeploy and A.aiPulse all ask here)
  const baseTacticsFor = A.tacticsFor;
  D.allTactics = (B, side, wing) => baseTacticsFor.call(A, B, side, wing);
  wrap(A, 'tacticsFor', base => function (B, side, wing) {
    const out = base.apply(this, arguments), rec = B && B.sides && wingRec(B, side, wing);
    if (!rec || !Array.isArray(out)) return out;
    const ok = out.filter(k => !D.LINE[k] || (rec[D.LINE[k]] || 0) >= D.GATE);
    return ok.length || !out.length ? ok : ['hold'];
  });

  // effects through A.tfx: a tactic's numbers scale with its drill; the counters read the clash in progress
  const ADD = { fear: 1, rally: 1, horseFear: 1, blind: 1 };
  let CTX = null, OFF = null;
  const menOf = us => us.reduce((a, u) => a + u.men, 0);
  const opp = u => (!CTX ? null : CTX.ua.includes(u) ? CTX.ub : CTX.ub.includes(u) ? CTX.ua : null);
  const lineDrill = them => {   // how well a line has drilled to stand: shield walls or formation, men-weighted (foot only)
    let w = 0, v = 0;
    for (const t of them) {
      if (GD.TROOPS[t.code].mount || GD.TROOPS[t.code].beast) continue;
      const x = t.dl ? Math.max(t.dl.shields || 0, t.dl.formation || 0) : D.DRILLED;
      w += t.men; v += t.men * x;
    }
    return w ? v / w : D.DRILLED;
  };
  const blockShare = them => {   // slow, close-order foot
    const m = menOf(them);
    return m ? them.reduce((a, t) => { const T = GD.TROOPS[t.code]; return a + (!T.mount && !T.beast && !T.skirm && (T.speed || 1) <= 1 && !T.missile ? t.men : 0); }, 0) / m : 0;
  };
  D.counter = function (u, key, out, lv) {
    if (u.tac === 'shieldwall' && key === 'antiCav') return out * (1 + D.K_WALL * lv);
    if (D.LINE[u.tac] === 'charge' && key === 'charge' && GD.TROOPS[u.code].charge > 1) {
      const them = opp(u); if (!them || !them.length) return out;
      const ld = lineDrill(them);
      return ld < 0.3 ? out * (1 + D.K_WEDGE * Math.min(1, lv / D.DRILLED) * (1 - ld / 0.3)) : out;
    }
    if (u.tac === 'skirmish' && (key === 'att' || key === 'def')) {
      const them = opp(u); if (!them || !them.length) return out;
      return out * (1 + D.K_SCREEN * (key === 'def' ? 0.75 : 1) * Math.min(1, lv / D.DRILLED) * blockShare(them));
    }
    return out;
  };
  wrap(A, 'tfx', base => function (u, key, def) {
    const v = base.apply(this, arguments);
    if (!u || !u.dl || (OFF && OFF.has(u))) return v;
    const fam = D.LINE[u.tac];
    if (!fam || typeof v !== 'number') return v;
    const lv = u.dl[fam] || 0, T = GD.BATTLE_TACTICS[u.tac];
    let out = v;
    if (T && T.fx && T.fx[key] != null) out = ADD[key] ? v * D.scale(lv) : 1 + (v - 1) * D.scale(lv);
    else if (def !== undefined && def !== 1) return v;
    return CTX ? D.counter(u, key, out, lv) : out;
  });
  const OK = u => u.men > 0 && (u.status === 'ok' || u.status === 'shaken');
  wrap(A, 'wingClash', base => function (B, wa, wb) {
    const prev = CTX;
    CTX = { ua: B.sides.A.units.filter(u => u.wing === wa && OK(u)), ub: B.sides.B.units.filter(u => u.wing === wb && OK(u)) };
    const C = CTX;
    try { return base.apply(this, arguments); }
    finally { CTX = prev; try { balk(B, C, wa); } catch (e) { console.error('drill balk', e); } }
  });
  // horses will not ride home into a wall that stands: riders who charged a drilled shield or spear wall lose heart.
  // Morale only, so the after-action report tells it in words but does not score it.
  const WING_W = { L: 'left', C: 'center', R: 'right' };
  function balk(B, C, wa) {
    for (const [us, them, k] of [[C.ua, C.ub, 'A'], [C.ub, C.ua, 'B']]) {
      const walls = them.filter(t => t.dl && D.LINE[t.tac] === 'shields' && t.men > 0), wm = menOf(walls), tm = menOf(them);
      if (!wm || !tm) continue;
      const lv = walls.reduce((a, t) => a + t.men * (t.dl.shields || 0), 0) / wm, hit = D.K_BALK * Math.max(0, lv - 0.25) * (wm / tm);
      let n = 0;
      for (const u of us) {
        const T = GD.TROOPS[u.code];
        if (!T.mount || T.beast || !(T.charge > 1) || A.tfx(u, 'noAdvance', false) || !(B.pulse <= 2 || A.tfx(u, 'charge', 0) > 0)) continue;
        u.morale -= hit; n++;
      }
      if (n && hit >= 4 && !(B.drBalk || {})[k]) {
        B.drBalk = Object.assign({}, B.drBalk, { [k]: B.pulse });
        B.log.push(`On the ${WING_W[k === 'A' ? wa : C.ub[0].wing] || 'line'}, ${B.sides[k].name}'s horses balk at the wall: the spears stand where they were drilled to stand.`);
      }
    }
  }
  // with drill switched off for some units (the release's numbers), for tests and the calibration bench
  D.withoutDrill = (units, fn) => { const prev = OFF; OFF = new Set(units); try { return fn(); } finally { OFF = prev; } };

  // ---- the war map: the gate on A.WTAC, the scale on the day's multipliers
  wrap(A, 'sideMake', base => function (list) {
    const c = base.apply(this, arguments);
    if (c && typeof c === 'object') c.dr = D.side(list);
    return c;
  });
  for (const [k, fam] of Object.entries(D.MAP)) {
    const T = A.WTAC && A.WTAC[k];
    if (!T || typeof T.ok !== 'function' || T.ok.drill) continue;
    const ok0 = T.ok;
    T.ok = function (c) { return ok0.apply(this, arguments) && (!c || !c.dr || (c.dr[fam] || 0) >= D.GATE); };
    T.ok.drill = true;
  }
  const pw = (m, fx, s) => { if (!fx || s === 1) return; for (const k in fx) if (k !== 'wA' && k !== 'fortIgnore' && typeof m[k] === 'number' && fx[k] > 0) m[k] *= Math.pow(fx[k], s - 1); };
  wrap(A, 'tacDay', base => function (F, att, def) {
    const m = base.apply(this, arguments);
    try {
      if (!m || !F) return m;
      const dA = D.side(att), dD = D.side(def), tA = F.tacA, tD = F.tacD;
      const sA = D.MAP[tA] ? D.scale(dA[D.MAP[tA]] || 0) : 1, sD = D.MAP[tD] ? D.scale(dD[D.MAP[tD]] || 0) : 1;
      const note = ((F.log || [])[F.log.length - 1] || [])[3] || '';
      if (note === 'countered') { pw(m, A.WTAC[tD].fx, sD); pw(m, { aDmg: 0.7, dDmg: 1.2, casA: 1.15 }, sD); }
      else if (note !== 'trap') {
        pw(m, (A.WTAC[tA] || {}).fx, sA); pw(m, (A.WTAC[tD] || {}).fx, sD);
        // a shock charge into foot that never drilled to stand
        const ls = Math.max(dD.shields || 0, dD.formation || 0);
        if (tA === 'shock' && ls < 0.3) m.aDmg *= 1 + 0.25 * Math.min(1, (dA.charge || 0) / D.DRILLED) * (1 - ls / 0.3);
      }
      // drilled ranks keep their order under pressure (organisation is what decides a map fight, 44-rank-battles)
      m.aOrg *= 1 - D.K_ORG * ((dD.formation || 0) - D.DRILLED);
      m.dOrg *= 1 - D.K_ORG * ((dA.formation || 0) - D.DRILLED);
      // a charge that runs onto a drilled spear wall comes off it in disorder
      if (note === 'countered' && D.MAP[tD] === 'shields') m.dOrg *= 1 + 0.5 * (sD - 1) + 0.15;
      F.drA = { [D.MAP[tA] || 'none']: dA[D.MAP[tA]] }; F.drD = { [D.MAP[tD] || 'none']: dD[D.MAP[tD]] };
    } catch (e) { console.error('drill (war map)', e); }
    return m;
  });

  // ---- the report in words
  const NOUN = { pikehedge: 'hedge', shieldwall: 'shield wall', spearwall: 'spear wall', setspear: 'spear line', hiddenspear: 'hidden spears' };
  const fmtPct = p => (p > 0 ? '+' : '−') + Math.abs(p) + '%';
  const rnd = x => Math.sign(x) * Math.round(Math.abs(x));
  D.words = function (B) {
    const t = B && B.aarT; if (!t) return [];
    const me = B.pcSide || 'A', en = me === 'A' ? 'B' : 'A';
    const fought = k => (t[k].shoot || 0) + (t[k].melee || 0) + (t[k].flank || 0), dead = Math.max(1, fought('A') + fought('B'));
    const lv = (k, fam) => { const r = D.sideOf(B, k); return r ? r[fam] || 0 : null; };
    const used = k => Object.keys(t[k].tac || {});
    const charged = k => used(k).some(x => D.LINE[x] === 'charge');
    const out = [];
    for (const [k, sg] of [[me, 1], [en, -1]]) {
      const o = k === me ? en : me, mine = k === me;
      for (const [tac, e] of Object.entries(t[k].tac || {})) {
        const fam = D.LINE[tac]; if (!fam) continue;
        const pct = rnd(100 * sg * e.v / dead), l = lv(k, fam); if (l == null || Math.abs(pct) < 3) continue;
        const w = D.word(l), N = NOUN[tac], T = (GD.BATTLE_TACTICS[tac] || {}).name || tac;
        let s;
        if (fam === 'shields' && charged(o)) {
          const lances = used(o).includes('lance') ? 'lances' : 'horse';
          s = mine ? `Their ${lances} broke on a ${w} ${N}` : `Your ${lances === 'lances' ? 'lances' : 'charge'} broke on their ${w} ${N}`;
        } else if (fam === 'charge') {
          const ld = lv(o, 'shields'), raw = ld != null && Math.max(ld, lv(o, 'formation') || 0) < 0.3;
          s = raw ? (mine ? 'Your wedge went through a line that had not drilled to stand' : 'Their wedge went through your line, which had not drilled to stand')
            : (mine ? `Your ${w} ${T.toLowerCase()}` : `Their ${w} ${T.toLowerCase()}`);
        } else if (tac === 'skirmish') s = mine ? 'Your skirmishers bled their slow foot' : 'Their skirmishers bled your slow foot';
        else s = mine ? `Your ${w} ${T.toLowerCase()}` : `Their ${w} ${T.toLowerCase()}`;
        out.push({ label: s, pct, fam, level: Math.round(l * 100) });
      }
      // a formation never practised: foot that met a charge with no wall to make
      if (charged(o) && (lv(k, 'shields') || 0) < D.GATE && (t[o].melee || 0) > 0 && B.sides[k].units.some(u => !GD.TROOPS[u.code].mount && ['SP', 'PK', 'HI', 'GA', 'LV'].includes(u.code)))
        out.push({ label: mine ? 'Your foot had never drilled a wall against horse, and met the charge in a crowd' : 'Their foot had never drilled a wall against horse, and met your charge in a crowd', pct: 0, fam: 'shields', level: Math.round((lv(k, 'shields') || 0) * 100) });
    }
    // one sentence a phrase (two charges into the same raw line are one wedge), the two biggest, and any formation never drilled
    const by = new Map();
    for (const x of out) { const y = by.get(x.label); if (y) y.pct += x.pct; else by.set(x.label, Object.assign({}, x)); }
    const all = [...by.values()], scored = all.filter(x => x.pct).sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct)).slice(0, 2);
    return scored.concat(all.filter(x => !x.pct));
  };
  if (typeof A.aarBuild === 'function') wrap(A, 'aarBuild', base => function (B) {
    const R = base.apply(this, arguments);
    try {
      const W = D.words(B);
      if (R && W.length) {
        R.drill = W.map(x => ({ label: x.label, pct: x.pct, level: x.level }));
        R.text = (R.text ? R.text + ' ' : '') + W.map(x => x.pct ? `${x.label}: ${fmtPct(x.pct)}.` : `${x.label}.`).join(' ');
      }
    } catch (e) { console.error('drill words', e); }
    return R;
  });
})();
