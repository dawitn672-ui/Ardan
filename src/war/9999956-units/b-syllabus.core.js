// D11-2: the syllabus and the drill (docs/design/war.md §14.2; D-118).
//
// A company's syllabus for the season is worked out, not chosen from a fixed list: its branch's own drills that it lacks
// or holds at a low grade; what its coming task needs (a war, horse among the enemy, a siege, a march); a remedy for a
// bad tendency; less whatever the ground and the teachers at hand cannot give (a river for bridging, a wall for the
// ladder, the coast for the sea's drills; a sergeant, or the player, who knows the drill). Each offer carries its reasons.
// A captain sees four to six offers and picks one or two a month: the player when he is the captain (or above), else his
// company's captain decides through A.WHY (kind 'drill'). The month's session raises the drill's grade (less each time,
// more with a better teacher, more when driven hard), lets the others fade, feeds the division's drill on the war map
// (60-unit-drill) a little, and costs something: men driven hard go winded, and veterans resent the conscripts' drill.
// The syllabus itself is a pure reading (worked out when the page opens, war.md §16's budget); only the month writes.
(function () {
  const U = A.UNITS, MU = A.MUSTER;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const r2 = x => Math.round(x * 100) / 100;
  const day = () => (A.absDay ? A.absDay() : 0);
  U.T = Object.assign({ offersMin: 4, offersMax: 6, gain: .09, fade: .4, teachMin: 20 }, U.T || {});

  // ---------------------------------------------------------------- the ground and the teachers at hand
  U.ground = function (P) {
    if (!P) return {};
    const D9 = A.D9;
    const river = !!(D9 && D9.riverLink && (P.adj || []).some(j => D9.riverLink(P.id, j)));
    return { open: !['forest', 'mountains', 'hills', 'swamp', 'marsh'].includes(P.terr), forest: P.terr === 'forest', wall: (P.fort || 0) > 0 || !!P.town || !!P.capital, river, coast: !!P.coast };
  };
  // who could teach a drill: the company's two sergeants (seeds: each knows a drill by his own seed) and the player, when
  // he stands in it and knows the skill
  U.teachers = function (d, i, X, pc) {
    const out = [];
    const sg = A.CO.sergeants ? A.CO.sergeants(d, i, 0) : [];
    for (const s of sg) { const k = 10 + (U.hash((s.seed || s.name) + ':' + X.id) % 55); out.push({ name: `Sergeant ${s.given || s.name}`, k }); }
    if (pc && pc.mil) { const v = A.skill(pc, X.teacher || 'command') || 0; if (v >= U.T.teachMin) out.push({ name: 'you', k: Math.round(v), pc: true }); }
    return out.sort((a, b) => b.k - a.k);
  };
  // the enemy's horse, as the realm has heard of it: the share of horse among its foes' hosts
  const foeHorse = rid => {
    let h = 0, n = 0;
    for (const w of A.atWar ? A.atWar(rid) : []) {
      for (const f of w.att.includes(rid) ? w.def : w.att) {
        const r = A.realm(f);
        for (const d of (r && r.forces && r.forces.divs) || []) for (const b of d.bs || []) { const m = b.k.reduce((a, x) => a + x, 0); n += m; if (GD.BN[b.c] && GD.BN[b.c].cat === 'horse') h += m; }
      }
    }
    return n ? h / n : 0;
  };

  // ---------------------------------------------------------------- the syllabus (pure)
  const rs = (kind, weight, label, source) => ({ kind, weight: r2(weight), label, source: source || null, pub: 1 });
  U.syllabus = function (d, i, o) {
    o = o || {};
    const rec = d && d.bs && d.bs[i];
    if (!rec) return null;
    const B = U.branchOf(rec), P = A.S.prov[d.loc], G = U.ground(P), pc = o.pc || null;
    const mk = U.makeup(d, i), tend = U.tend(d, i), war = A.atWar ? A.atWar(d.r).length > 0 : false;
    const horse = war ? foeHorse(d.r) : 0;
    const options = [], cut = [];
    for (const X of U.listFor(B)) {
      if (X.ground && !G[X.ground]) { cut.push([X.id, `no ${X.ground === 'wall' ? 'wall' : X.ground === 'open' ? 'open ground' : X.ground} at hand`]); continue; }
      const T = U.teachers(d, i, X, pc)[0];
      if (!T || T.k < U.T.teachMin) { cut.push([X.id, 'no one here can teach it']); continue; }
      const g = U.grade(d, i, X.id), reasons = [];
      if (g < 70) reasons.push(rs('want', Math.min(1.6, (70 - g) / 30), g < 15 ? 'it has never drilled it' : g < 40 ? 'it is only half-drilled in it' : 'it is drilled, but not hard-drilled', { t: 'grade', id: X.id, r: g }));
      else reasons.push(rs('cost', -.6, 'it knows this already', { t: 'grade', id: X.id, r: g }));
      if (X.task === 'war' && war) reasons.push(rs('want', .8, 'a war is on', { t: 'war' }));
      if (X.task === 'battle' && war) reasons.push(rs('want', .7, 'a battle may come', { t: 'war' }));
      if (X.task === 'horse' && horse >= .15) reasons.push(rs('fear', 1.2, 'the enemy has horse', { t: 'foe', r: r2(horse) }));
      if (X.task === 'siege' && (d.sieging || (war && P && (P.fort || 0) > 0))) reasons.push(rs('want', 1, 'a siege is ahead', { t: 'siege' }));
      if (X.task === 'march' && (war || (d.path && d.path.length))) reasons.push(rs('want', .5, 'a march is ahead', { t: 'march' }));
      const fix = X.remedy ? tend.find(t => t.k === X.remedy) : null;
      if (fix) reasons.push(rs('want', 1.2, fix.label, { t: 'tend', id: fix.k, y: fix.y }));
      if (mk.conscripts && (X.family === 'standing' || X.family === 'march')) reasons.push(rs('want', .5, 'conscripts need it', { t: 'men' }));
      if (mk.vet >= .66 && X.family === 'standing' && mk.conscripts) reasons.push(rs('cost', -.4, 'the veterans think it beneath them', { t: 'men' }));
      if (tend.some(t => t.k === 'proud') && T.pc && pc && pc.mil && pc.mil.joinD != null && day() - pc.mil.joinD < 180) reasons.push(rs('cost', -.5, 'a proud company will not be taught by a stranger', { t: 'tend', id: 'proud' }));
      reasons.push(rs('merit', clamp((T.k - 30) / 60, -.3, .6), `${T.pc ? 'you' : T.name} can teach it`, { t: 'teacher', r: T.k }));
      options.push({ id: X.id, reasons, teacher: T });
    }
    const sum = op => op.reasons.reduce((a, x) => a + x.weight, 0);
    const sorted = options.slice().sort((a, b) => sum(b) - sum(a) || (a.id < b.id ? -1 : 1));
    const n = clamp(sorted.filter(x => sum(x) > 0).length, Math.min(U.T.offersMin, sorted.length), U.T.offersMax);
    const offers = sorted.slice(0, n).map(op => ({ id: op.id, name: U.D(op.id).name, grade: U.grade(d, i, op.id), teacher: op.teacher.pc ? 'you' : op.teacher.name, why: op.reasons.filter(x => x.weight > 0).sort((a, b) => b.weight - a.weight).slice(0, 2).map(x => x.label), score: r2(sum(op)) }));
    return { branch: B, options: sorted.slice(0, n), offers, cut, ground: G };
  };

  // the captain's pick for the month: the player's own (as captain or above), else his captain's decision through A.WHY
  U.pick = function (pc, M, S) {
    const m = pc.mil, own = (m.rank | 0) >= 3 ? (m.syl || []).filter(id => S.offers.some(o => o.id === id)).slice(0, 2) : [];
    if (own.length) return { ids: own, by: 'you' };
    if (!S.options.length) return { ids: [], by: null };
    const C = MU.captainOf ? MU.captainOf(pc) : { who: 'cap', name: 'Your captain' };
    const rec = A.WHY.decide((m.rank | 0) >= 3 ? 'sgt:' + M.key : C.who, 'drill', S.options, { band: .5, at: M.key, r: m.realm, rand: MU.rng('dr:' + M.key + ':' + day()), log: (m.rank | 0) < 3 });
    return { ids: rec ? [rec.chose] : [], by: (m.rank | 0) >= 3 ? 'the sergeants' : C.name, rec };
  };

  // ---------------------------------------------------------------- the month's session (the player's company)
  U.drillMonth = function (pc) {
    const m = pc && pc.alive && pc.mil;
    if (!m || m.merc) return null;
    const M = U.mine(pc);
    if (!M) return null;
    const d = M.d, rec = M.rec;
    if (d.atk != null || (A.S.fights || {})[d.loc]) return null;   // fighting: no drill
    const S = U.syllabus(d, M.b, { pc });
    if (!S || !S.offers.length) return null;
    // the company's own grades, stored from the first session (the branch's list, rounded)
    if (!rec.dg) { rec.dg = {}; for (const X of U.listFor(S.branch)) rec.dg[X.id] = U.baseGrade(d, M.b, X.id); }
    const P = U.pick(pc, M, S);
    if (!P.ids.length) return null;
    const hard = m.drill ? [.6, 1, 1.5][m.drill.hard] || 1 : 1;
    const out = [];
    for (const id of P.ids) {
      const op = S.options.find(x => x.id === id), X = U.D(id);
      if (!op || !X) continue;
      const g = rec.dg[id] != null ? rec.dg[id] : U.grade(d, M.b, id);
      const teach = clamp(op.teacher.k / 50, .5, 1.4), share = 1 / P.ids.length;
      const gain = Math.max(.5, (100 - g) * U.T.gain * teach * hard * share);
      rec.dg[id] = Math.round(clamp(g + gain, 0, 100));
      // the war map's drill of that family (60-unit-drill) gains the company's share of it
      d.dr = d.dr || {};
      d.dr[X.feeds] = clamp((d.dr[X.feeds] || 0) + gain / 100 / Math.max(4, d.bs.length), 0, 1);
      out.push([id, rec.dg[id], op.teacher.pc ? 'you' : op.teacher.name]);
    }
    for (const k in rec.dg) if (!P.ids.includes(k)) rec.dg[k] = Math.max(0, Math.round((rec.dg[k] - U.T.fade) * 10) / 10);
    // its cost: men driven hard go winded (the war map's order), and a hard month on the eve of a fight tells
    if (hard > 1) d.org = Math.max(0, (d.org || 0) - 2);
    rec.sy = [P.ids[0], A.S.year, A.today ? A.today() : 0];
    m.unN = (m.unN || 0) + 1;
    // a soldier's or sergeant's company drill is a scene he is in, every fourth session (a count, not a die)
    if ((m.rank | 0) <= 2 && m.unN % 4 === 1 && !(A.S.queue || []).some(q => q && q.ev === 'un_drill')) {
      const X = U.D(P.ids[0]), op = S.offers.find(x => x.id === P.ids[0]);
      A.queue({ type: 'event', ev: 'un_drill', forced: true, ctx: { drillT: X.name.replace(/^The /, 'the '), whyT: op && op.why.length ? op.why.join(', and ') : 'the captain wants it', teachT: op ? op.teacher : 'a sergeant', capT: P.by || 'Your captain', dk: X.id, tk: X.teacher || 'command' } });
    }
    return { ids: P.ids, by: P.by, out };
  };
})();
