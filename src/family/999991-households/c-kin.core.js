// C6 households, part 3: no event names kin who are not in the tree (docs/design/households.md, D-057; CRITIQUE F3).
//
// The release's kin helpers made a relative whenever a scene wanted one: pack 15's known() and sibOf() made "your sister
// Sunniva" for an only child, pack 11's kinPid made a new "cousin" for every family scene, 50-arcs-kin's sibOf wrote a new
// uncle into the tree. Now every one of them asks A.KIN: a relative of the kind wanted is taken from the tree (met then,
// if the player has not met them yet) or the scene's setup throws, which drops the card (A.eventView already treats a
// throwing setup as a skip).
//
// A claimant (a bastard asking for a name, a long-lost cousin) is a stranger until the player recognises them: then
// A.KIN.recognize writes them into the tree as the bastard child of a real relative, by the player's choice.
//
// A.link keeps a last guard (A.KIN.guard): a kin word ("cousin", "sister") given to someone the tree does not place
// becomes "acquaint", and is counted in A.KIN.strays (not saved) so the tests see any helper that still mints.
(function () {
  const F = A.V2F, H = A.HH; if (!F || !H) return;
  const K = A.KIN = A.KIN || {};
  const live = q => !!(q && q.alive);
  K.WORDS = ['mother', 'father', 'sibling', 'child', 'grandparent', 'grandchild', 'cousin', 'uncle', 'nephew', 'inlaw'];
  K.strays = [];
  K.founding = false;

  // ---- the guard in A.link ------------------------------------------------------------------------------------------------
  // returns [type, backType]: unchanged unless a kin word is given to someone the tree does not place
  K.guard = function (a, b, type, backType) {
    const S = A.S;
    if (K.founding || !S || S.pc == null || !a || !b) return null;
    const pcSide = a.id === S.pc ? 'a' : b.id === S.pc ? 'b' : null;
    if (!pcSide) return null;
    const word = pcSide === 'a' ? type : backType;
    if (!word || !K.WORDS.includes(word)) return null;
    const pc = pcSide === 'a' ? a : b, other = pcSide === 'a' ? b : a;
    if (F.kinOf(pc, other)) return null;
    // the register: an adopted child (in pc.children), a parent who holds the player in theirs
    if (word === 'child' && (pc.children || []).includes(other.id)) return null;
    if ((word === 'father' || word === 'mother') && ((other.children || []).includes(pc.id) || (pc.parents || []).includes(other.id))) return null;
    // a child of the player's own, or of a child, still being written in (the register follows the link)
    if ((word === 'child' || word === 'grandchild') && other.born >= S.year - 1) return null;
    if (K.strays.length < 200) K.strays.push({ y: S.year, word, ev: (A.MEET && A.MEET.ev) || null, id: other.id });
    const plain = w => (w && K.WORDS.includes(w) ? 'acquaint' : w);
    return [plain(type), plain(backType)];
  };

  // ---- finding kin --------------------------------------------------------------------------------------------------------
  // living relatives of the player of these kinds (the release's words), the tree's own, filtered by o:
  //   o.sex 'M'|'F'; o.adj an age in human years (C.ageAdj's scale) and o.span its window; o.twin born the same year;
  //   o.ok(q) any test; o.dead true to allow the lately dead
  K.list = function (p, types, o) {
    o = o || {};
    if (!p) return [];
    const P = F.people(), want = new Set(types || K.WORDS);
    const out = [];
    for (const q of H.kinAround(p, 5)) {
      if (!(q.alive || (o.dead && q.died != null && A.S.year - q.died <= 1))) continue;
      const t = H.typeOf(p, q, P);
      if (!t || !want.has(t)) continue;
      if (o.sex && q.sex !== o.sex) continue;
      if (o.twin && q.born !== p.born) continue;
      if (o.adj != null && A.C && A.C.ageAdj) {
        const span = o.span != null ? o.span : o.adj >= 40 ? 12 : 7;
        if (Math.abs(A.C.ageAdj(q) - o.adj) > span) continue;
      }
      if (o.minDegree && ((F.kinOf(p, q, P) || {}).degree || 0) < o.minDegree) continue;
      if (o.ok && !o.ok(q)) continue;
      out.push(q);
    }
    return out;
  };
  // one of them: one the player knows if there is one, else one met now. null when the tree has none.
  K.find = function (p, types, o) {
    const l = K.list(p, types, o);
    if (!l.length) return null;
    const known = l.filter(q => p.rel && p.rel[q.id]);
    return A.pick(known.length ? known : l);
  };
  K.NONE = 'no such kin in the tree';
  K.none = () => Object.assign(new Error(K.NONE), { noKin: true });   // A.eventView marks the card ctx.noKin: dropped by design
  // for a scene's setup: the relative, met now if need be; throws when the tree has none (the card drops)
  K.take = function (p, types, o) {
    const q = K.find(p, types, o);
    if (!q) throw K.none();
    if (!p.rel[q.id]) H.meetKin(p, q, (A.MEET && (A.MEET.why || A.MEET.ev)) || 'scene', o && o.op);
    return q;
  };
  // a name for a scene's words ("your cousin {cousin}"): a relative of the tree, not met by being named; undefined when
  // the tree has none (the token stays unfilled and the scene drops)
  K.nameOf = function (p, types, o) { const q = K.find(p, types, o); return q ? q.given : undefined; };
  // a grandparent of the player, living or long dead (a name remembered), of `sex`
  K.ancestor = function (p, sex) {
    const out = [];
    for (const id of (p && p.parents) || []) { const par = A.P(id); if (par) for (const g of par.parents || []) { const q = A.P(g); if (q && (!sex || q.sex === sex)) out.push(q); } }
    return out.length ? A.pick(out) : null;
  };
  // "your cousin" in the family scenes of pack 11: a cousin of any degree, else (o.line) the line asked for
  K.cousinLike = function (p, o) {
    o = o || {};
    return K.take(p, o.types || ['cousin'], o);
  };

  // a parent of the player's spouse (an in-law): a living one from the tree (of o.sex if it can be), else one made by
  // make() and written into the tree as the spouse's parent (a marriage brings its family; the spouse's parents were never
  // made when the spouse was). Without a spouse, make()'s person, as before.
  K.spouseKin = function (p, o, make) {
    o = o || {};
    const sp = p && p.spouse ? A.P(p.spouse) : null;
    if (!sp) return make();
    const par = (sp.parents || []).map(A.P).filter(Boolean);
    const alive = par.filter(live);
    const same = alive.filter(q => !o.sex || q.sex === o.sex);
    if (same.length) return same[0];
    const slot = (o.sex || 'M') === 'F' ? 'F' : 'M';
    if (par.length >= 2 || par.some(q => q.sex === slot)) { if (alive.length) return alive[0]; throw K.none(); }
    const q = make();
    if (q.sex !== slot && F.setSex) F.setSex(q, slot);
    const RR = GD.RACES[sp.race] || GD.RACES.human;
    q.born = Math.min(q.born, sp.born - RR.adult);
    q.race = sp.race;
    sp.parents = slot === 'M' ? [q.id].concat((sp.parents || []).filter(x => x !== q.id)) : (sp.parents || []).concat([q.id]);
    if (!q.children.includes(sp.id)) q.children.push(sp.id);
    if (slot === 'M' && sp.surMode !== 'patron' && sp.sur) { q.sur = sp.sur; q.surMode = sp.surMode; }
    return q;
  };

  // ---- recognising a claimant -----------------------------------------------------------------------------------------------
  // the player recognises `q` as the bastard child of `sire` (a real relative): q joins the tree under that parent and the
  // player's word for them comes from the tree. Without a sire (or one the tree does not hold) q stays a friend.
  K.recognize = function (p, q, sire, op) {
    if (!p || !q) return '';
    const s = sire != null ? A.P(sire) : null;
    if (s && s.id !== q.id && s.id !== p.id && (F.kinOf(p, s) || (p.parents || []).includes(s.id))) {
      q.parents = [s.id]; q.flags = q.flags || {}; q.flags.bastard = q.flags.bastard || 1; q.flags.c6recognized = A.S.year;
      if (!s.children.includes(q.id)) s.children.push(q.id);
      const t = H.typeOf(p, q) || 'acquaint';
      if (p.rel[q.id]) { p.rel[q.id].type = t; p.rel[q.id].op = Math.max(p.rel[q.id].op || 0, op || 30); if (q.rel[p.id]) q.rel[p.id].type = H.backOf(p, t); }
      else A.link(p, q, t, op || 30, H.backOf(p, t));
      return '';
    }
    if (p.rel[q.id]) { p.rel[q.id].type = 'friend'; p.rel[q.id].op = Math.max(p.rel[q.id].op || 0, op || 25); }
    else A.link(p, q, 'friend', op || 25, 'friend');
    return '';
  };
  // a secret told (a deathbed's "you have a half-brother"): q is written into the tree as the child of `parents` (ids), so
  // the word the player then reads is the tree's. Flagged c6revealed: the tests know it came by a story, not a helper.
  K.reveal = function (p, q, parents) {
    const par = (parents || []).map(id => (id != null ? A.P(id) : null)).filter(Boolean);
    if (!q || !par.length) return '';
    q.parents = par.map(x => x.id);
    for (const x of par) if (!x.children.includes(q.id)) x.children.push(q.id);
    const RR = GD.RACES[q.race] || GD.RACES.human, eldest = Math.max(...par.map(x => x.born));
    q.born = Math.max(q.born, eldest + RR.adult);
    q.flags = q.flags || {}; q.flags.c6revealed = A.S.year;
    return '';
  };
  // a relative who could have fathered (or mothered) a claimant of age `adj`: a parent, a grandparent, an uncle; dead or living
  K.sireFor = function (p, words) {
    const P = F.people(), out = [];
    const fa = F.parentOf(p, 'M');
    if (fa && (!words || words.includes('father'))) out.push(fa);
    for (const q of H.kinAround(p, 3)) {
      const t = H.typeOf(p, q, P);
      if (q.sex !== 'F' && t && (words || ['grandparent', 'uncle']).includes(t) && t !== 'father') out.push(q);
    }
    return out.length ? A.pick(out) : null;
  };

  // A.newGame: the release links a lesser house's members as uncles and cousins before the tree is whole; the household
  // stage (b-household) prunes them. The guard sleeps while the life is being made.
  A.addStage('A.newGame', 'households.guard', ng => function () {
    K.founding = true; K.strays = [];
    try { return ng.apply(this, arguments); } finally { K.founding = false; }
  });
})();
