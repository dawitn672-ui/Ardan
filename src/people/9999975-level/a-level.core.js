// A person's level and its stat points (docs/design/skills-v2.md §12.1-12.2, as the owner's orders 82, 87-89 and 88 change
// them: D-178, D-181). Numbers: data/level.json.
//
// A.LV: one level for a person, and it IS the power ladder's level (A.POWER, data/power.json): one scale, not two.
//   A.LV.level(p)          the person's level. Held in p.lv once he has one; until then (most of the world's people) the
//                          level the ladder computes from his fighting worth, never below the floor of his years
//   A.LV.seed(p)           gives him his held level: the computed one (and the floor), with nothing waiting, so nobody's
//                          stats change; the player at his first month (or a save's load), anyone else at his first defeat
//   A.LV.defeat(p, F, how) one foe of level F defeated ('kill', 'defeat' or 'spar'): experience scaled by the foe's level
//                          against his own on the ladder; a far weaker foe gives almost nothing and never lifts him more
//                          than xp.ceilAbove levels above itself (no farming). Returns the levels gained
//   A.LV.need(L)           the experience from L to L+1 (in the ladder's might): exponential, each gap wider than the last
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
  LV.need = L => X.e0 * Math.pow(X.growth, L) * PW.mightOf(L);
  LV.computed = (p, m) => PW.levelOf(m != null ? m : PW.personMight(p));
  // the level an ordinary grown person of this body stands at (the owner's average human, 20-30), and the floor of his years
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
  LV.level = function (p, m) {
    if (!p) return 0;
    if (p.lv && p.lv.L != null) return p.lv.L;
    if (!p.st) return 0;
    return clamp(Math.max(LV.computed(p, m), LV.floor(p)), 1, LVMAX);
  };
  LV.seed = function (p) {
    if (!p || !p.st) return null;
    if (p.lv && p.lv.L != null) return p.lv;
    p.lv = { L: LV.level(p), f: 0, pts: 0 };
    if (isPc(p)) { p.lv.k0 = p.kills || 0; p.lv.kc = 0; }
    return p.lv;
  };
  LV.progress = p => (p && p.lv ? clamp(p.lv.f || 0, 0, 1) : 0);
  LV.progressWord = function (f) { for (const [at, w] of D.words.progress) if (f >= at) return w; return D.words.progress[D.words.progress.length - 1][1]; };

  // ---------------------------------------------------------------- experience from a defeat
  // in the ladder's might, measured at his own level L: a stronger foe gives its share of might over his (past upTo, the
  // root of the rest), a weaker one that share to the power weakPow; nothing once he stands ceilAbove levels over it
  LV.xpFor = function (F, L) {
    if (!(F > 0) || F + X.ceilAbove <= L) return 0;
    const m = PW.mightOf(L), rho = PW.mightOf(F) / m;
    if (rho >= 1) return m * (rho <= X.upTo ? rho : X.upTo * Math.sqrt(rho / X.upTo));
    return m * Math.pow(rho, X.weakPow);
  };
  LV.pointsAt = (p, L) => ((RACE(p).points != null ? RACE(p).points : PT.perLevel) + (PT.bonusEvery && L % PT.bonusEvery === 0 ? 1 : 0));
  LV.up = function (p, lv) {
    lv.L++;
    lv.pts = (lv.pts || 0) + LV.pointsAt(p, lv.L);
    if (!isPc(p)) LV.queue(p);
  };
  LV.defeat = function (p, F, how) {
    if (!p || !p.st || p.alive === false) return 0;
    const lv = LV.seed(p);
    if (!lv) return 0;
    const L0 = lv.L, ceil = Math.min(LVMAX, Math.round(F) + X.ceilAbove);
    let g = LV.xpFor(F, lv.L) * (X.how[how] != null ? X.how[how] : 1);
    while (g > 0 && lv.L < ceil) {
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

  // ---------------------------------------------------------------- stat points: ceiling, room, cost
  LV.cap = (p, s) => (p.pot && isFinite(p.pot[s]) ? p.pot[s] : 40) * PT.capMul;
  LV.roomShare = function (p) {
    const g = RACE(p).grown || 20, age = A.age(p);
    return age >= g ? 1 : PT.roomChild + (1 - PT.roomChild) * clamp(age / g, 0, 1);
  };
  LV.room = (p, s) => LV.cap(p, s) * LV.roomShare(p);
  LV.withPut = function (p, s, v) {
    const u = p.lv && p.lv.put && p.lv.put[s];
    if (!u) return v;
    const room = LV.room(p, s);
    return v >= room ? v : Math.min(room, v + u);
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
    const S = A.S; if (!S || !Array.isArray(S.lvq) || !S.lvq.length) return 0;
    const ids = S.lvq.slice().sort((a, b) => (String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0));
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
