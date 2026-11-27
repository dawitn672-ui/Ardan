// A person's level and its stat points (docs/design/skills-v2.md §12.1-12.2, as the owner's orders 82, 87-89 and 88 change
// them: D-178, D-181). Numbers: data/level.json.
//
// A.LV: one level for a person, and it IS the power ladder's level (A.POWER, data/power.json): one scale, not two.
//   A.LV.level(p)          the person's level. Held in p.lv once he has one; until then (most of the world's people) the
//                          level the ladder computes from his fighting worth, never below the floor of his years
//   A.LV.seed(p)           gives him his held level: the computed one (and the floor), with nothing waiting, so nobody's
//                          stats change; the player at his first month (or a save's load), anyone else at his first defeat
//   A.LV.defeat(p, F, how) one foe of level F defeated ('kill', 'defeat' or 'spar'): experience scaled by the foe's level
//                          against his own on the ladder; every foe gives some, a far weaker one very little (order 91,
//                          D-184: no line). Returns the levels gained
//   A.LV.need(L)           the experience from L to L+1 (in defeats of a peer): exponential, each gap wider than the last,
//                          and the step into each hundredth level a wall (xp.wall: many times the step before it). At the
//                          wall a person takes a class or a stat boost (c-classes.core.js, order 91-92, D-184)
//   A.LV.room / cap / cost / canPlace / place   the stat points: a stat's ceiling (the person's potential, as A.train's),
//                          the body's room at this age, the cost of the next point (1, 2 or 3 near the ceiling), placing one
//   A.LV.withPut(p, s, v)  what A.stat reads: the base (st, or the trained body's floor) plus the placed points, held to the
//                          room; old age, wounds, hunger and weariness then lower what is read, never what is placed
//   A.LV.placeByWhy(p, mode)  an NPC's points (his post and temper), a child's (his household's way of life) through
//                          A.WHY.decide on a seeded stream of its own (the main stream never moves for it)
// Where a person rises: a duel won or a hunt's beast killed (A.duelConsequences), a beast settled at once (the powers'
// PW.resolve), a man killed in a battle, a mission or a brawl (the month reads pc.kills: what no fight of its own paid
// for), a field battle won by a division's commander (A.fightEnd), and the foe who beats the player in a duel.
// State (optional, old saves load): p.lv = { L, f (the share of the way to the next level), pts (points waiting), put
// ({ stat: points placed }), why ([[year, stat, reason]], the last 3), k0 and kc (the player's kills read and paid) };
// A.S.lvq (NPCs with points waiting, at most 400, placed once a year). Nothing here is drawn on render.
(function () {
  const D = A.DATA && A.DATA.level, PW = A.POWER;
  if (!D || !PW || !PW.levelOf) { console.error('[level] data/level.json or A.POWER is missing'); return; }
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const r3 = x => Math.round(x * 1000) / 1000;
  const X = D.xp, FL = D.floor, PT = D.points, LVMAX = (PW.D.levels && PW.D.levels.max) || 1000;
  const LV = A.LV = { D };
  const RACE = p => (GD.RACES && GD.RACES[p.race]) || GD.RACES.human;
  const isPc = p => !!(p && A.S && p.id === A.S.pc);

  // ---------------------------------------------------------------- the level
  // the wall: the step into the k-th hundredth level asks wall.mul[k-1] times as much (orders 91, 92; D-184)
  const WL = X.wall || { every: 100, mul: [1] };
  LV.wallMul = L => ((L + 1) % WL.every === 0 ? WL.mul[Math.min(WL.mul.length, (L + 1) / WL.every) - 1] : 1);
  // in defeats of a peer (a man of his own level): the gap, never the might, so the ladder's rescale cannot move it
  // (above slowFrom the step grows by slowGrowth: still each level dearer, but at the summit a hundred defeats of an equal
  // are a level or two, as the owner asks of an archdemon, order 95, D-184 addendum)
  const SF = X.slowFrom || Infinity;
  LV.need = L => X.e0 * (L <= SF ? Math.pow(X.growth, L) : Math.pow(X.growth, SF) * Math.pow(X.slowGrowth || X.growth, L - SF)) * LV.wallMul(L);
  LV.computed = (p, m) => PW.levelOf(m != null ? m : PW.personMight(p));
  // the level an ordinary grown person of this body stands at (the owner's average people, 20-50: order 93), and the floor of his years
  LV.grown = function (p) {
    let s = 0, n = 0;
    for (const k of GD.STATS) if (p.pot && isFinite(p.pot[k])) { s += p.pot[k]; n++; }
    const mean = n ? s / n : FL.potMid;
    return clamp(Math.round(FL.base + (mean - FL.potMid) / FL.potPer), FL.min, FL.max);
  };
  LV.floor = function (p) {
    if (!p || !p.st || !A.S) return 1;
    const age = A.age(p), g = RACE(p).grown || 20;
    return age >= g ? LV.grown(p) : Math.max(1, Math.floor(LV.grown(p) * Math.pow(Math.max(0, age) / g, FL.pow)));
  };
  // the level before he earns one (D-184 addenda, orders 93 and 95): the computed level held inside the band his life
  // puts him in (data/level.json seed): a commoner who never served at most 50, a noble born 50-99, service by rank and
  // years, posts by kind, kills outside service by the rule. The might level is a ceiling, the life a floor: a youth of
  // sixteen never stands among soldiers from his training alone, and an untrained noble stands 50-99 whatever his worth
  const SD = D.seed || { common: 50, noble: [50, 99], nobleStatus: [], ranks: [], posts: {}, full: 20, maxKills: 0 };
  LV.band = function (p) {
    const fl = LV.floor(p), age = A.age(p), ad = RACE(p).adult || 16, sc = age >= ad ? 1 : Math.pow(Math.max(0, age) / ad, FL.pow);
    let lo = fl, hi = Math.max(fl, SD.common), why = 'common';
    const take = (l, h, w) => { if (h * sc > hi) { lo = l * sc; hi = h * sc; why = w; } };
    // a ruler's level is his own (order 97, answer 3 of order 98; D-205): his way of rule, chosen through A.WHY
    // (d-rulers.core.js), stands in for his upbringing and his crown's own posts; service and posts in arms still count
    const rb = LV.ruleBand ? LV.ruleBand(p) : null, own = rb ? new Set(SD.rule.ownPosts || []) : null;
    // (set, not taken: an idle king's band may lie under a commoner's, and that is the point)
    if (rb) { lo = rb.lo * sc; hi = rb.hi * sc; why = 'rule'; }
    else if ((SD.nobleStatus || []).includes(p.status)) {
      // order 96: upbringing sets where an untrained noble starts (education, tutors, diet, arms-masters); royals and the
      // great houses higher on average
      const U = SD.upbringing || {}, rung = (p.noble && p.noble.rung) || 0;
      take(Math.min(SD.noble[1], (U[p.status] != null ? U[p.status] : SD.noble[0]) + (rung >= (U.greatRung || 99) ? U.great || 0 : 0)), SD.noble[1], 'noble');
    }
    const svc = p.mil || p.veteran || null;
    if (svc) {
      const rank = svc.rank || 0, b = (SD.ranks || []).filter(x => rank >= x[0]).pop();
      if (b) { const yrs = svc.years != null ? svc.years : Math.max(0, age - 18), e = Math.min(1, (yrs + (svc.battles || 0) / 3) / SD.full); take(b[1], b[1] + (b[2] - b[1]) * e, 'service'); }
    }
    if (A.POSTS && A.POSTS.held && A.POSTS.parse) {
      try { for (const k of A.POSTS.held(p.id)) { const kind = A.POSTS.parse(k).kind, b = SD.posts[kind]; if (b && !(own && own.has(kind))) take(b[0], b[1], 'post'); } } catch (e) {}
    }
    if (!svc && (p.kills || 0) > 0) {
      // (pure: the rule's climb from the floor, with nothing queued, placed or decided)
      let L = fl, f = 0;
      for (let i = 0; i < Math.min(p.kills, SD.maxKills); i++) {
        let x = LV.xpFor(D.foes.person, L);
        while (x > 0 && L < LVMAX) { const need = LV.need(L), room = (1 - f) * need; if (x >= room) { x -= room; L++; f = 0; } else { f += x / need; x = 0; } }
      }
      if (L > hi) { hi = L; why = 'kills'; }
    }
    return { lo: Math.max(fl, Math.round(lo)), hi: Math.max(fl, Math.round(hi)), why };
  };
  // the computed level held in the band: as it is in the band's lower part, softly bent toward the top above it (the
  // knee, at SD.knee of the band), so nobody piles up at a band's end (a noble born at 99, under the wall)
  // a named figure's level from data (the figures registry another builder brings: kings, nobles, generals with full
  // profiles) wins over the band: set LV.fromData = p => level or null
  LV.fromData = LV.fromData || null;
  LV.seedLevel = function (p, m) {
    if (LV.fromData) { const d = LV.fromData(p); if (d > 0) return clamp(Math.round(d), 1, LVMAX); }
    const b = LV.band(p), c = LV.computed(p, m);
    if (c <= b.lo) return b.lo;
    const knee = b.lo + (b.hi - b.lo) * (SD.knee != null ? SD.knee : 0.6);
    if (c <= knee) return Math.round(c);
    const x = c - knee, room = b.hi - knee;
    return Math.min(b.hi, Math.round(knee + room * x / (x + room)));
  };
  LV.level = function (p, m) {
    if (!p) return 0;
    if (p.lv && p.lv.L != null) return p.lv.L;
    if (!p.st) return 0;
    return clamp(LV.seedLevel(p, m), 1, LVMAX);
  };
  LV.seed = function (p) {
    if (!p || !p.st) return null;
    if (p.lv && p.lv.L != null) return p.lv;
    p.lv = { L: LV.level(p), f: 0, pts: 0 };
    if (isPc(p)) { p.lv.k0 = p.kills || 0; p.lv.kc = 0; }
    // the walls he already stands past: the classes his road gives, worn, with nothing paid (c-classes.core.js)
    if (LV.settleSeeded) LV.settleSeeded(p);
    return p.lv;
  };
  LV.progress = p => (p && p.lv ? clamp(p.lv.f || 0, 0, 1) : 0);
  LV.progressWord = function (f) { for (const [at, w] of D.words.progress) if (f >= at) return w; return D.words.progress[D.words.progress.length - 1][1]; };

  // ---------------------------------------------------------------- experience from a defeat
  // in defeats of a peer: a stronger foe doubles it every upHalf levels above him (past upTo, the root of the rest, at
  // most `most`: an upset over a far stronger foe is a leap of some levels, never of a hundred), a
  // weaker one halves it every downHalf levels below: never nothing (order 91, D-184), only very little
  LV.xpFor = function (F, L) {
    if (!(F > 0)) return 0;
    const d = F - L;
    if (d >= 0) { const x = Math.pow(2, d / X.upHalf); return Math.min(X.most || Infinity, x <= X.upTo ? x : X.upTo * Math.sqrt(x / X.upTo)); }
    return Math.pow(2, d / X.downHalf);
  };
  LV.pointsAt = (p, L) => ((RACE(p).points != null ? RACE(p).points : PT.perLevel) + (PT.bonusEvery && L % PT.bonusEvery === 0 ? 1 : 0));
  LV.up = function (p, lv) {
    lv.L++;
    lv.pts = (lv.pts || 0) + LV.pointsAt(p, lv.L);
    if (!isPc(p)) LV.queue(p);
    // a hundredth level reached by experience: the wall's reward, a class or a stat boost (c-classes.core.js)
    if (lv.L % WL.every === 0 && LV.atWall) LV.atWall(p, lv);
  };
  LV.defeat = function (p, F, how) {
    if (!p || !p.st || p.alive === false) return 0;
    const lv = LV.seed(p);
    if (!lv) return 0;
    const L0 = lv.L;
    let g = LV.xpFor(F, lv.L) * (X.how[how] != null ? X.how[how] : 1);
    while (g > 0 && lv.L < LVMAX) {
      const need = LV.need(lv.L), room = (1 - (lv.f || 0)) * need;
      if (g >= room) { g -= room; LV.up(p, lv); lv.f = 0; }
      else { lv.f = (lv.f || 0) + g / need; g = 0; }
    }
    lv.f = r3(clamp(lv.f || 0, 0, 0.999));
    return lv.L - L0;
  };
  // the level of a duel's foe: his own if he is a person, the ladder's for a beast, else read from his duel worth by the
  // human fit (data/power.json people: ln(conscripts) = lnA + lnB x worth; might is conscripts squared)
  LV.fighterLevel = function (f) {
    try {
      const g = Object.assign({ fat: 0, burst: 0, fury: 0, adapt: 0 }, f, { hp: f.maxHp || f.hp || 100, fat: 0 });
      const worth = A.CR(g, { round: 5 }) + (f.wdmg || 0) * 0.9 + (f.prot || 0) * 1.1;
      const c = Math.exp(PW.D.people.lnA + PW.D.people.lnB * worth);
      return PW.levelOf(c * c);
    } catch (e) { return D.foes.person; }
  };
  LV.foeLevel = function (b, foe) {
    if (foe && foe.st) return LV.level(foe);
    if (b && b.beast) { const L = PW.level(b.beast); if (L) return L; }
    return b ? LV.fighterLevel(b) : D.foes.person;
  };

  // A.duelConsequences calls this as the fight's outcome is known, before its kill is counted (guarded in the release)
  LV.duel = function (pc, D_) {
    const b = D_ && D_.b;
    if (!pc || !b) return;
    const foe = b.pid ? A.P(b.pid) : null, F = LV.foeLevel(b, foe);
    if (D_.result === 'win' || D_.result === 'beastfled') {
      const kill = D_.result === 'win' && D_.lethal && b.hp <= 0 && D_.kind !== 'spar' && D_.kind !== 'tourney';
      const lv = LV.seed(pc);
      if (kill && lv) lv.kc = (lv.kc || 0) + 1;   // this kill is paid here; the month's read of pc.kills leaves it
      LV.defeat(pc, F, D_.kind === 'spar' ? 'spar' : kill ? 'kill' : 'defeat');
    } else if ((D_.result === 'lose' || D_.result === 'yield') && foe && foe.alive !== false && foe.st) {
      LV.defeat(foe, LV.level(pc), D_.kind === 'spar' ? 'spar' : 'defeat');   // the man who beat you rises by it
    }
  };
  // A.fightEnd calls this for a field battle: each named commander of a winning division defeated the losing side's best
  // commander (or, with none, a soldier). The player is paid by his own kills, not here
  LV.field = function (F, atkW) {
    const S = A.S;
    if (!S || !F || (F.menA || 0) + (F.menD || 0) < 3e3 || !(F.days >= 1)) return;
    const cmds = ids => ids.map(id => A.divById(id)).filter(d => d && d.cmd != null).map(d => A.P(d.cmd)).filter(p => p && p.alive && p.st && p.id !== S.pc);
    const won = cmds(atkW ? F.aIds : F.dIds), lost = cmds(atkW ? F.dIds : F.aIds);
    if (!won.length) return;
    const F_ = lost.length ? Math.max(...lost.map(p => LV.level(p))) : D.foes.soldier;
    for (const p of won) LV.defeat(p, F_, 'defeat');
    if (A.TT && A.TT.field) A.TT.field(won);   // D-183: a field battle won is a deed the titles count
  };

  // ---------------------------------------------------------------- the legends grow too (order 92, D-184)
  // A great being (a legend or a master of A.POWER) rises by the same rule as anyone: a defeat pays by the gap against its
  // own level's need, and at its height a level asks so much that one is a matter of ages. Its level stays the data's
  // (data/legends.json, data/power.json: read, never written here) plus what it has gained, kept in A.S.pw.leg[id].lg
  // (levels and the share of the next). PW.being reads LV.legendGain.
  const legRec = (id, make) => {
    const S = A.S; if (!S) return null;
    const pw = S.pw && typeof S.pw === 'object' ? S.pw : (make ? (S.pw = {}) : null); if (!pw) return null;
    const leg = pw.leg && typeof pw.leg === 'object' ? pw.leg : (make ? (pw.leg = {}) : null); if (!leg) return null;
    return leg[id] || (make ? (leg[id] = {}) : null);
  };
  LV.legendGain = function (id) { const g = legRec(id, false); return g && Array.isArray(g.lg) ? g.lg[0] || 0 : 0; };
  // the main road of the great (order 95): a slow yearly refinement of their skills and techniques, the same for all,
  // kept as A.S.pw.ref[id] (years refined: a store of its own, so no legend's world record is made or touched); PW.being
  // multiplies a legend's power by it
  const LG = D.legends || { perYear: 0, max: 0 };
  LV.legendRefine = function (id) { const r = A.S && A.S.pw && A.S.pw.ref, y = (r && r[id]) || 0; return 1 + Math.min(LG.max, LG.perYear * y); };
  LV.legendYear = function () {
    if (!PW.LEG || !A.S) return 0;
    const pw = A.S.pw && typeof A.S.pw === 'object' ? A.S.pw : (A.S.pw = {});
    const ref = pw.ref && typeof pw.ref === 'object' ? pw.ref : (pw.ref = {});
    let n = 0;
    // C-30 (order 98): the figures registry's fixed beings (PW.FIG: the ancient dragons and demons) refine as the legends do
    for (const id of [...PW.LEG.keys(), ...(PW.MAS ? PW.MAS.keys() : []), ...(PW.FIG ? PW.FIG.keys() : [])].sort()) {
      const g = legRec(id, false); if (g && g.slain) continue;
      if ((ref[id] || 0) * LG.perYear >= LG.max) continue;
      ref[id] = (ref[id] || 0) + 1; n++;
    }
    return n;
  };
  (A.onYear = A.onYear || []).push(function () { try { LV.legendYear(); } catch (e) { console.error('[level] legends refine', e); } });
  LV.legendDefeat = function (id, F, how) {
    const L0 = PW.LEG && (PW.LEG.get(id) || (PW.MAS && PW.MAS.get(id)) || (PW.FIG && PW.FIG.get(id)));   // C-30: and the fixed figures
    if (!L0 || !(F > 0)) return 0;
    const g = legRec(id, true); if (!g) return 0;
    const lg = Array.isArray(g.lg) ? g.lg : (g.lg = [0, 0]);
    let L = L0.level + lg[0], f = lg[1] || 0, gain = LV.xpFor(F, L) * (X.how[how] != null ? X.how[how] : 1), n = 0;
    // order 97 (C-30): among the great, a defeat of an equal (a foe within peerWithin levels or above) pays peerMul
    // times, so a hundred of them give about twenty levels at an archdemon's height: a road near impossible to survive
    if (LG.peerMul && F >= L - (LG.peerWithin || 0)) gain *= LG.peerMul;
    while (gain > 0 && L < LVMAX) {
      const need = LV.need(L), room = (1 - f) * need;
      if (gain >= room) { gain -= room; L++; n++; f = 0; } else { f += gain / need; gain = 0; }
    }
    lg[0] += n; lg[1] = Math.round(clamp(f, 0, 0.999) * 1e6) / 1e6;
    return n;
  };

  // ---------------------------------------------------------------- stat points: ceiling, room, cost
  LV.cap = (p, s) => (p.pot && isFinite(p.pot[s]) ? p.pot[s] : 40) * PT.capMul;
  LV.roomShare = function (p) {
    const g = RACE(p).grown || 20, age = A.age(p);
    return age >= g ? 1 : PT.roomChild + (1 - PT.roomChild) * clamp(age / g, 0, 1);
  };
  LV.room = (p, s) => LV.cap(p, s) * LV.roomShare(p);
  LV.withPut = function (p, s, v) {
    const u = p.lv && p.lv.put && p.lv.put[s];
    // a class's buff (c-classes.core.js): a stat raised for a few months, above what the body holds
    const b = p.lv && p.lv.bf && LV.buffOn ? LV.buffOn(p, s) : 0;
    if (!u) return v + b;
    const room = LV.room(p, s);
    return (v >= room ? v : Math.min(room, v + u)) + b;
  };
  // the stat before age, wounds and the rest: what the body holds (st, or the trained body's floor) with the points
  LV.base = (p, s) => (A.statFloor ? Math.max((p.st && p.st[s]) || 0, A.statFloor(p, s)) : (p.st && p.st[s]) || 0);
  LV.eff = (p, s) => LV.withPut(p, s, LV.base(p, s));
  LV.cost = function (p, s, extra) {
    const share = (LV.eff(p, s) + (extra || 0)) / Math.max(1, LV.cap(p, s));
    for (const [at, c] of PT.cost) if (share < at) return c;
    return PT.cost[PT.cost.length - 1][1];
  };
  // can one more point go into s (extra: points already pending there on the sheet, in stat units)?
  LV.canPlace = function (p, s, extra, ptsLeft) {
    if (!p || !p.lv || !GD.STATS.includes(s)) return false;
    const left = ptsLeft != null ? ptsLeft : p.lv.pts || 0;
    const v = LV.base(p, s), u = ((p.lv.put && p.lv.put[s]) || 0) + (extra || 0);
    return LV.cost(p, s, extra) <= left && v + u + 1 <= LV.room(p, s) + 1e-9;
  };
  LV.place = function (p, s, reason) {
    if (!LV.canPlace(p, s)) return false;
    const lv = p.lv, c = LV.cost(p, s);
    lv.put = lv.put || {};
    lv.put[s] = (lv.put[s] || 0) + 1;
    lv.pts -= c;
    if (reason) { lv.why = (lv.why || []).concat([[A.S.year, s, String(reason).replace(/[<>"]/g, '').slice(0, 60)]]); if (lv.why.length > 3) lv.why = lv.why.slice(-3); }
    if (A.cacheResetAll && isPc(p)) try { A.cacheResetAll(); } catch (e) {}
    return true;
  };
  // an evolution's gift (skills-v2 §15.5; 37-skills2, D-182): a point beside the level's own, small, and recorded on the
  // level (lv.gx, how many; lv.gw, the last three with their year and what evolved)
  LV.grant = function (p, n, why) {
    if (!(n > 0) || !A.S) return 0;
    const lv = LV.seed(p);
    if (!lv) return 0;
    lv.pts = (lv.pts || 0) + n;
    lv.gx = (lv.gx || 0) + n;
    lv.gw = (lv.gw || []).concat([[A.S.year, n, String(why || '').replace(/[<>"]/g, '').slice(0, 60)]]).slice(-3);
    if (!isPc(p)) LV.queue(p);
    return n;
  };
  LV.placed = p => (p && p.lv && p.lv.put ? Object.values(p.lv.put).reduce((a, b) => a + b, 0) : 0);

  // ---------------------------------------------------------------- placing by reasons (NPCs; a child's household)
  const WAYS = D.ways;
  LV.wayOf = function (p) {
    if (!p) return 'common';
    if (p.ruler) return 'ruler';
    if (A.POSTS && A.POSTS.held && A.POSTS.cls) { try { if (A.POSTS.held(p.id).some(k => A.POSTS.cls(k) === 'FIELD')) return 'captain'; } catch (e) {} }
    if (p.mil) return (p.mil.rank || 0) >= 5 ? 'captain' : 'soldier';
    if (/captain|general|commander|knight|sergeant/i.test(p.occ || '')) return 'captain';
    if (/soldier|guard|man-at-arms|spearman|archer/i.test(p.occ || '')) return 'soldier';
    if (['noble', 'royal'].includes(p.status)) return 'lord';
    const c = p.job && p.job.c;
    return c && WAYS[c] ? c : 'common';
  };
  // a child's household: his father's way of life, else his mother's, else his own folk's
  LV.headOf = function (p) {
    for (const id of p.parents || []) { const q = id != null ? A.P(id) : null; if (q && q.alive && q.st) return q; }
    for (const id of p.parents || []) { const q = id != null ? A.P(id) : null; if (q && q.st) return q; }
    return null;
  };
  const LEAN = {   // what each stat is for, as a reason the decider's temper bends (A.WHY's kinds)
    str: ['ambition', 0.3, 'strength wins a name'], spd: ['want', 0.2, 'a quick body gets out of trouble'],
    ins: ['fear', 0.25, 'to see a blow coming'], sta: ['reckoning', 0.3, 'to last the long days'],
    int: ['coin', 0.3, 'a head for figures pays'], wil: ['duty', 0.3, 'a firm will keeps an oath'],
  };
  const NAME = s => (GD.STAT_NAMES && GD.STAT_NAMES[s]) || s;
  LV.reasons = function (p, mode, head, pend) {
    const way = WAYS[LV.wayOf(mode === 'household' && head ? head : p)] || WAYS.common;
    const who = way[2] || 'common folk';
    const skills = [];
    if (mode !== 'household' && p.skills) {
      const top = Object.keys(p.skills).filter(k => GD.SKILL_STAT && GD.SKILL_STAT[k]).sort((a, b) => (p.skills[b] || 0) - (p.skills[a] || 0) || (a < b ? -1 : 1)).slice(0, 2);
      for (const k of top) if ((p.skills[k] || 0) >= 20) for (const s of GD.SKILL_STAT[k]) skills.push([s, k]);
    }
    return GD.STATS.map(s => {
      const rs = [], x = (pend && pend[s]) || 0;
      if (way[0] === s) rs.push({ kind: mode === 'household' ? 'kin' : 'duty', weight: 1.6, label: `the life of ${who} asks for it`, source: { t: 'way', id: s }, pub: true });
      if (way[1] === s) rs.push({ kind: mode === 'household' ? 'kin' : 'duty', weight: 1.0, label: `the life of ${who} uses it`, source: { t: 'way', id: s }, pub: true });
      const sk = skills.find(z => z[0] === s);
      if (sk) rs.push({ kind: 'merit', weight: 0.6, label: `what his ${String((GD.SKILLS && GD.SKILLS[sk[1]]) || sk[1]).toLowerCase()} asks of him`, source: { t: 'skill', id: sk[1] }, pub: true });
      const L = LEAN[s]; rs.push({ kind: L[0], weight: L[1], label: L[2], source: null, pub: true });
      const c = LV.cost(p, s, x);
      if (c > 1) rs.push({ kind: 'cost', weight: -0.5 * (c - 1), label: `${NAME(s).toLowerCase()} is near what his body can hold`, source: null, pub: false });
      return { id: s, reasons: rs };
    });
  };
  // a stream of its own, from the seed, the person and the year: the main stream never moves for a placement
  const hash = PW.hash;
  const stream = key => { let s = hash(key) >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  LV.stream = stream;   // (the classes' choices at a wall draw from one too: c-classes.core.js)
  LV.placeByWhy = function (p, mode) {
    if (!p || !p.lv || !A.WHY || !A.WHY.decide) return [];
    const head = mode === 'household' ? LV.headOf(p) : null;
    const rand = stream(`${A.S.seed != null ? A.S.seed : 'ardan'}|lv|${p.id}|${A.S.year}|${LV.placed(p)}`);
    const out = [];
    for (let n = 0; n < 60 && (p.lv.pts || 0) > 0; n++) {
      const opts = LV.reasons(p, mode, head).filter(o => LV.canPlace(p, o.id));
      if (!opts.length) break;
      const rec = A.WHY.decide(mode === 'household' ? (head || p) : p, 'stat', opts, { log: false, rand });
      if (!rec || !LV.place(p, rec.chose, rec.why && rec.why[0] ? rec.why[0][0] : '')) break;
      out.push(rec.chose);
    }
    return out;
  };

  // ---------------------------------------------------------------- the NPCs' points, once a year
  LV.queue = function (p) {
    const S = A.S; if (!S || !p) return;
    const q = Array.isArray(S.lvq) ? S.lvq : (S.lvq = []);
    if (!q.includes(p.id)) { q.push(p.id); if (q.length > 400) q.shift(); }
  };
  LV.npcYear = function () {
    const S = A.S; if (!S || !S.people) return 0;
    // C-29 (order 98): the queue keeps at most 400 and drops its oldest, and a person dropped from it kept his points
    // for ever. So the year also gathers everyone alive with points waiting; the queue stays the bounded record of who
    // rose, and nobody's points wait past the year's turn
    const set = new Set(Array.isArray(S.lvq) ? S.lvq : []);
    for (const id in S.people) { const p = S.people[id]; if (p && p.alive && p.lv && p.lv.pts > 0 && id !== String(S.pc)) set.add(p.id); }
    if (!set.size) { S.lvq = []; return 0; }
    const ids = [...set].sort((a, b) => (String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0));
    S.lvq = [];
    let n = 0;
    for (const id of ids) {
      const p = A.P(id);
      if (!p || !p.alive || !p.lv || !(p.lv.pts > 0) || isPc(p)) continue;
      n += LV.placeByWhy(p, A.age(p) < PT.playerFrom ? 'household' : 'post').length;
    }
    return n;
  };

  // ---------------------------------------------------------------- the player's month
  const statWord = s => ((typeof UI !== 'undefined' && UI.PF && UI.PF.V2LABEL && UI.PF.V2LABEL[s]) || NAME(s)).toLowerCase();
  LV.month = function (pc) {
    if (!pc || !pc.alive || !pc.st || !A.S) return;
    const lv = LV.seed(pc);
    if (!lv) return;
    if (lv.k0 == null) { lv.k0 = pc.kills || 0; lv.kc = 0; }
    const L0 = lv.L;
    // growing up: the floor of his years (a child's level, and an ordinary grown body's)
    const fl = LV.floor(pc);
    let grew = false;
    while (lv.L < fl && lv.L < LVMAX) { LV.up(pc, lv); grew = true; }
    // men killed in a battle, on a mission or in a brawl: the kills no fight of their own paid for
    const nk = (pc.kills || 0) - lv.k0 - (lv.kc || 0);
    if (nk > 0) { const F = pc.mil ? D.foes.soldier : D.foes.person; for (let i = 0; i < Math.min(nk, 12); i++) LV.defeat(pc, F, 'kill'); }
    lv.k0 = pc.kills || 0; lv.kc = 0;
    const young = A.age(pc) < PT.playerFrom;
    let placed = [];
    if (young && lv.pts > 0) placed = LV.placeByWhy(pc, 'household');
    if (lv.L > L0 && A.log) {
      if (young) {
        const h = LV.headOf(pc), way = WAYS[LV.wayOf(h)] || WAYS.common;
        const uniq = [...new Set(placed)].map(statWord);
        A.log(`You grow: level ${lv.L} now.${uniq.length ? ` The life of ${way[2] || 'your folk'} in your house builds your ${uniq.join(' and ')}.` : ''}`, '');
      } else if (grew && lv.L === fl) A.log(`Grown: you stand at level ${lv.L}, where most grown folk stand.${lv.pts > 0 ? ` ${lv.pts === 1 ? 'A point' : lv.pts + ' points'} to place (Profile).` : ''}`, '');
      else A.log(`What you have beaten raises you: level ${lv.L} now.${lv.pts > 0 ? ` ${lv.pts === 1 ? 'A point' : lv.pts + ' points'} to place (Profile).` : ''}`, 'good');
    }
  };

  // ---------------------------------------------------------------- the save: the player gets his held level on load
  // (save version 18): the computed level and the floor, nothing waiting, nothing placed, so every A.stat reads as before
  LV.migrate = function (S) {
    S = S || A.S;
    const pc = S && S.people && S.people[S.pc];
    if (pc && pc.alive && pc.st && !(pc.lv && pc.lv.L != null)) LV.seed(pc);
    return pc && pc.lv ? pc.lv.L : 0;
  };
  const SV = A.V2SAVE;
  if (SV && Array.isArray(SV.STEPS) && !SV.STEPS.some(x => x[0] === 'level')) SV.STEPS.push(['level', S => LV.migrate(S)]);

  A.onMonth = A.onMonth || [];
  A.onMonth.push(pc => LV.month(pc));
  (A.onYear = A.onYear || []).push(function () { try { LV.npcYear(); } catch (e) { console.error('[level] npc year', e); } });
})();
