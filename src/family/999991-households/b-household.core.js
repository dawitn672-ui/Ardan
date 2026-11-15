// C6 households, part 2: who you know at birth, and the kin you meet later (docs/design/households.md, D-057; owner order 7;
// CRITIQUE F1, F2, F4).
//
// The family tree (99994's three generations: p.parents, p.children, p.spouse) keeps every relative the world knows of.
// The player's relationships (pc.rel) keep the people the player has met. At birth that is the household:
//   - the father and mother and the living brothers and sisters (children of either parent);
//   - a grandparent only under the same roof (the family's seed decides; at most two);
//   - for a child of a noble or royal house, the household's people: a wet nurse, a maid and a guard knight, and a tutor
//     from the age of six. They are commoners (the knight a gentry man-at-arms) with names, ages and trades of their own.
// Everyone else in the tree is met later: at a family gathering (once a year, on the family's own stream: a log line, not a
// card, owner order 17) or in a scene that names them (c-kin.core.js).
//
// Determinism: every draw here is on a stream of its own, seeded from the game's seed and the player's id (A.V2F.rng and
// A.V2F.sandbox), so the game's stream is not moved by who is known. New people (the household's) take ids from A.S.nextId.
(function () {
  const F = A.V2F; if (!F || !F.rng || !F.kinOf) return;
  const H = A.HH = A.HH || {};
  const live = q => !!(q && q.alive);
  const NOBLE = p => !!(p && (p.status === 'noble' || p.status === 'royal') && p.house && !(p.flags && p.flags.bastard));
  H.NOBLE = NOBLE;
  H.TUTOR_AGE = 6;

  // ---- the release's word for a relative the tree places (rel.type) ------------------------------------------------------
  H.typeOf = function (pc, q, P) {
    const k = F.kinOf(pc, q, P);
    if (!k) return null;
    switch (k.line) {
      case 'ancestor': return k.degree === 1 ? (q.sex === 'F' ? 'mother' : 'father') : 'grandparent';
      case 'descendant': return k.degree === 1 ? 'child' : 'grandchild';
      case 'sibling': return 'sibling';
      case 'sibling-line': return 'nephew';
      case 'parent-sibling': return 'uncle';
      case 'cousin': return 'cousin';
      case 'spouse': return 'spouse';
      case 'in-law': return 'inlaw';
      default: return null;
    }
  };
  H.BACK = { father: 'child', mother: 'child', grandparent: 'grandchild', grandchild: 'grandparent', sibling: 'sibling', nephew: 'uncle',
    uncle: 'nephew', cousin: 'cousin', spouse: 'spouse', inlaw: 'inlaw' };
  H.backOf = (pc, t) => (t === 'child' ? (pc.sex === 'F' ? 'mother' : 'father') : H.BACK[t] || 'acquaint');
  // a blood or marriage tie in the release's words (they are kin, whatever their rel.type says)
  H.KIN_TYPES = ['mother', 'father', 'sibling', 'child', 'grandparent', 'grandchild', 'cousin', 'uncle', 'nephew', 'inlaw'];

  // meet a relative the tree places: the link carries its kin word and the reason
  H.meetKin = function (pc, q, why, op) {
    if (!pc || !q || q.id === pc.id) return null;
    if (pc.rel[q.id]) return q;
    const t = H.typeOf(pc, q) || 'acquaint';
    A.MEET.as(why || 'kin-visit', () => A.link(pc, q, t, op == null ? 25 : op, H.backOf(pc, t)));
    return q;
  };

  // the kin around the player in the tree: up and down three steps through parents, children and spouses
  H.kinAround = function (pc, depth) {
    const seen = new Map([[pc.id, pc]]); let edge = [pc];
    for (let d = 0; d < (depth || 3); d++) {
      const next = [];
      for (const q of edge) for (const id of [...(q.parents || []), ...(q.children || []), q.spouse]) {
        const x = id != null && A.P(id);
        if (x && !seen.has(x.id)) { seen.set(x.id, x); next.push(x); }
      }
      edge = next;
    }
    seen.delete(pc.id);
    return [...seen.values()];
  };

  // ---- under the same roof ---------------------------------------------------------------------------------------------
  // the father's parents first (a widowed one more often than a pair), else a widowed parent of the mother; at most two
  H.roof = function (pc) {
    const r = F.rng('roof|' + pc.id);
    const gp = par => ((par && par.parents) || []).map(A.P).filter(q => live(q) && q.home === pc.home);
    const fa = F.parentOf(pc, 'M'), mo = F.parentOf(pc, 'F');
    const pg = gp(fa), mg = gp(mo);
    const a = r.next(), b = r.next();   // both drawn always: one family's roof does not move the next draw
    if (pg.length === 1 && a < 0.6) return pg;
    if (pg.length === 2 && a < 0.3) return pg;
    if (mg.length === 1 && b < 0.4) return mg;
    return [];
  };

  // ---- a noble child's household -----------------------------------------------------------------------------------------
  H.ROLES = {
    nurse: { sex: () => 'F', age: [18, 34], status: 'peasant', occ: 'a wet nurse of the household', word: 'Your nurse' },
    maid: { sex: () => 'F', age: [15, 40], status: 'peasant', occ: 'a maid of the household', word: 'Maid of the household' },
    guard: { sex: () => 'M', age: [24, 42], status: 'gentry', occ: 'a knight of the household guard', word: 'Your guard knight' },
    tutor: { sex: r => (r.chance(0.7) ? 'M' : 'F'), age: [32, 60], status: 'artisan', occ: 'tutor to the children of the house', word: 'Your tutor' },
  };
  H.word = role => (H.ROLES[role] || {}).word || null;
  H.makeStaff = function (pc, role) {
    const R = H.ROLES[role]; if (!R) return null;
    const hh = H.state();
    if (hh.staff[role] && live(A.P(hh.staff[role]))) return A.P(hh.staff[role]);
    const x = F.sandbox('household|' + pc.id + '|' + role, () => {
      const r = F.rng('household|' + pc.id + '|' + role);
      const sex = R.sex(r), race = pc.race, RR = GD.RACES[race] || GD.RACES.human;
      const yrs = Math.round(r.int(R.age[0], R.age[1]) * RR.adult / 16);
      const p = A.newPerson({ given: A.givenName(pc.cult, sex), sex, race, realm: pc.realm, cult: pc.cult, faith: pc.faith,
        born: A.S.year - yrs, status: R.status, home: pc.home });
      const fn = A.familyName({ cult: pc.cult, realm: pc.realm, status: R.status, home: pc.home, sex });
      if (fn) { p.sur = fn.sur; p.surMode = fn.mode; }
      p.occ = R.occ;
      if (role === 'guard') { p.skills = Object.assign(p.skills || {}, { sword: r.int(40, 62), shield: r.int(30, 55), riding: r.int(30, 55) }); }
      if (role === 'tutor') { p.literate = true; p.skills = Object.assign(p.skills || {}, { learning: r.int(45, 70), diplomacy: r.int(15, 40) }); }
      return p;
    });
    hh.staff[role] = x.id;
    A.MEET.as('household', () => A.link(pc, x, 'servant', F.rng('household-op|' + pc.id + '|' + role).int(35, 70), 'acquaint'));
    if (pc.rel[x.id]) pc.rel[x.id].hh = role;
    return x;
  };
  H.state = function () {
    const S = A.S;
    if (!S.household || typeof S.household !== 'object') S.household = {};
    if (!S.household.staff) S.household.staff = {};
    if (!Array.isArray(S.household.roof)) S.household.roof = [];
    return S.household;
  };

  // ---- the household at birth ------------------------------------------------------------------------------------------
  // the people the player knows on the first day: parents, living siblings, the roof's grandparents, the household's staff
  H.found = function (pc) {
    const S = A.S, hh = H.state();
    hh.pc = pc.id;
    const P = F.people();
    const fa = F.parentOf(pc, 'M'), mo = F.parentOf(pc, 'F');
    const keep = new Map();
    const birth = q => { if (q && q.id !== pc.id) keep.set(String(q.id), 'birth'); };
    birth(fa); birth(mo);
    for (const par of [fa, mo]) if (par) for (const id of par.children || []) { const c = A.P(id); if (live(c) && c.id !== pc.id) birth(c); }
    // an older start: the player's own spouse and children are known
    const sp = pc.spouse && A.P(pc.spouse); if (live(sp)) keep.set(String(sp.id), 'marriage');
    for (const id of pc.children || []) { const c = A.P(id); if (c) keep.set(String(c.id), 'birth'); }
    hh.roof = H.roof(pc).map(q => q.id);
    for (const id of hh.roof) keep.set(String(id), 'household');
    // the rest of the kin are known of, not known: their entries (and theirs of the player) go
    for (const id of Object.keys(pc.rel)) {
      if (keep.has(String(id))) continue;
      const q = A.P(id), r = pc.rel[id];
      const kin = (r && H.KIN_TYPES.includes(r.type)) || (q && F.kinOf(pc, q, P));
      if (!kin) continue;
      delete pc.rel[id];
      if (q && q.rel && q.rel[pc.id]) delete q.rel[pc.id];
    }
    // the household: the kept are linked (the roof's grandparents may not be yet) and say how they were met
    for (const [id, why] of keep) {
      const q = A.P(id); if (!q) continue;
      if (!pc.rel[id]) {
        const t = H.typeOf(pc, q, P) || 'acquaint';
        A.MEET.as(why, () => A.link(pc, q, t, F.rng('known|' + pc.id + '|' + id).int(25, 70), H.backOf(pc, t)));
      }
      const r = pc.rel[id];
      if (r && !r.met) r.met = { y: S.year, at: pc.home, by: why };
      else if (r && r.met && r.met.by !== why && (why === 'birth' || why === 'household')) r.met.by = why;
    }
    if (NOBLE(pc)) {
      for (const role of ['nurse', 'maid', 'guard']) H.makeStaff(pc, role);
      if (A.age(pc) >= H.TUTOR_AGE) H.makeStaff(pc, 'tutor');
    }
    // anyone else known on the first day (a story's people, an older start's master) was met before the story begins
    for (const id of Object.keys(pc.rel)) { const r = pc.rel[id]; if (r && !r.met) r.met = { y: S.year, at: pc.home, by: 'before' }; }
    // an older start has had its years of gatherings
    const b = pc.born;
    for (let y = b + 3; y < S.year; y++) H.gather(pc, y);
    hh.y = S.year;
  };

  // ---- the family gathers -------------------------------------------------------------------------------------------------
  H.OCCASIONS = ['for the harvest feast', 'for a burial', 'for a wedding', 'to see out a hard winter', 'for the midsummer fair', 'on the road to market',
    'with news from home', 'for a christening'];
  // once a year: a living relative you have not met (of your parish first, then your realm) is met; returns them or null
  H.gather = function (pc, year) {
    if (!live(pc)) return null;
    const y = year == null ? A.S.year : year;
    const r = F.rng('gather|' + pc.id + '|' + y);
    const age = y - pc.born, RR = GD.RACES[pc.race] || GD.RACES.human, child = age < RR.adult;
    if (!r.chance(child ? 0.5 : 0.35)) return null;
    const P = F.people();
    const cand = H.kinAround(pc, 3).filter(q => live(q) && !pc.rel[q.id] && q.born <= y && F.kinOf(pc, q, P));
    if (!cand.length) return null;
    const w = q => (q.home === pc.home ? 6 : q.realm === pc.realm ? 2 : 0.3);
    const q = r.weighted(cand, w);
    const occ = r.pick(H.OCCASIONS);
    const t = H.typeOf(pc, q, P) || 'acquaint';
    A.MEET.as('kin-visit', () => A.link(pc, q, t, r.int(15, 55), H.backOf(pc, t)));
    const e = pc.rel[q.id];
    if (e) { e.met = { y, at: pc.home, by: 'kin-visit' }; e.seen = y; }
    if (y === A.S.year && A.log) {
      const word = (A.relLabel(q, pc.rel[q.id]) || 'kin').toLowerCase();
      A.log(`Your ${word} ${q.given} comes ${occ}. You meet ${q.sex === 'F' ? 'her' : 'him'} for the first time.`, 'muted');
    }
    return q;
  };

  // ---- the year: the gathering, and the tutor at six ------------------------------------------------------------------------
  H.month = function (pc) {
    const S = A.S; if (!S || !live(pc)) return;
    const hh = H.state();
    // a life that goes on as an heir has a household of its own (the old one's people stay where they are)
    if (hh.pc != null && hh.pc !== pc.id) { hh.pc = pc.id; hh.staff = {}; hh.roof = []; }
    if (hh.y !== S.year) {
      hh.y = S.year;
      H.gather(pc);
    }
    if (NOBLE(pc) && A.age(pc) >= H.TUTOR_AGE && A.age(pc) < 18 && !hh.staff.tutor) {
      const t = H.makeStaff(pc, 'tutor');
      if (t && A.log) A.log(`A tutor comes to the house: ${A.fullName(t, false)}, to teach you letters and figures.`, 'muted');
    }
  };
  A.onMonth = A.onMonth || [];
  A.onMonth.push(pc => { try { H.month(pc); } catch (e) { console.error('households: month', e); } });

  A.addStage('A.newGame', 'households', ng => function () {
    const out = ng.apply(this, arguments);
    try { const pc = A.pc(); if (pc && pc.alive) H.found(pc); } catch (e) { console.error('households: found', e); }
    return out;
  });
})();
