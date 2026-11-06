// v2 family, part 1: the game's people seen through Ardan v2's kinship engine (src/v2/kin.js), and the one label
// resolver for every relation the player reads (docs/v2/V2_SPEC.md complaint 5; integration step 5).
//
// The release stores one rel.type per pair (pc.rel[id].type), so a wife who became a rival is read as "Rival", and
// whatever rel.type a person was first linked with is all the game knows of them. Here kinship comes from the family
// graph instead (p.parents, p.children, p.spouse), through A.V2.kin.relationLabel, with its strict priority:
// spouse > blood > in-law > feudal > bond. A bond (friend, rival, lover ...) is a qualifier, never a replacement:
// "Wife (at odds with you)", "Father (your dearest friend)".
//
//   A.V2F.people()            a v2 People view over A.S.people (read-only, lazy, pure)
//   A.V2F.label(me, other)    the label object from A.V2.kin.relationLabel, plus .text capitalised for display
//   A.V2F.kinOf(me, other)    the kin term ("father", "first cousin once removed") or null
//   A.V2F.mayCallFriend(a, b, c)   A.V2.kin.canCallMutualFriend: c may be called "a friend of" a and b
//
// A.relLabel(p, rel) is wrapped: when rel is the player's (pc.rel[p.id]) the label comes from the resolver. Event
// tokens {father} {mother} {spouse} {rival} {friend} follow the same graph (A.T is wrapped). Rendering stays pure:
// nothing here draws from A.rand or writes to A.S.
(function () {
  const V = A.V2; if (!V || !V.kin) { console.error('v2-family: A.V2 missing'); return; }
  const K = V.kin;
  const F = A.V2F = A.V2F || {};

  // rel.type values that are kinship in the release (used only when the graph cannot place someone, e.g. the
  // members of a great house the release links to its head as "cousin" without any parents between them)
  F.KIN_TYPES = ['mother', 'father', 'sibling', 'child', 'spouse', 'grandparent', 'grandchild', 'cousin', 'uncle', 'nephew', 'inlaw'];
  // a personal bond from rel.type, in v2's vocabulary (kin.js bondQualifier) or plain words
  F.BOND = { friend: 'friend', bestfriend: 'bestFriend', rival: 'rival', enemy: 'enemy', lover: 'lover', mentor: 'mentor',
    student: 'student', comrade: 'comrade', master: 'master', servant: 'servant', councillor: 'councillor', betrothed: 'betrothed',
    superior: 'superior', subordinate: 'subordinate' };
  // plain words for a bond that is the whole label (playtest 1, #15: "BestFriend")
  const WORD = { bestFriend: 'best friend', superior: 'your superior', subordinate: 'under your command' };
  const QUAL = { student: 'your student', comrade: 'your comrade', master: 'your master', servant: 'in your service', councillor: 'on the council', betrothed: 'betrothed to you' };

  // ---- the view ---------------------------------------------------------------------------------------------------
  // A v2 person record over a game person: sex, fatherId/motherId (by the parents' sex, since the release's p.parents
  // is not always [father, mother]), spouseIds (the living spouse, and a spouse who died married to them), childIds.
  const sexOf = p => (p && p.sex === 'F' ? 'female' : 'male');
  function wrap(p) {
    if (!p) return null;
    const par = (p.parents || []).map(A.P).filter(Boolean);
    const fa = par.find(q => q.sex !== 'F'), mo = par.find(q => q.sex === 'F');
    const sp = [];
    if (p.spouse && A.P(p.spouse)) sp.push(p.spouse);
    for (const id in p.rel || {}) {
      const r = p.rel[id];
      if (r && r.type === 'spouse' && !sp.includes(id)) { const q = A.P(id); if (q && (!q.alive || !p.alive || q.spouse === p.id)) sp.push(id); }
    }
    const fl = p.flags || {};
    const traits = (p.traits || []).slice();
    if ((p.health != null && p.health < 25) && !traits.includes('sickly')) traits.push('sickly');
    return {
      id: p.id, sex: sexOf(p), name: p.given, house: p.house || null, birthYear: p.born,
      deathYear: p.alive ? null : (p.died != null ? p.died : A.S.year),
      fatherId: fa ? fa.id : null, motherId: mo ? mo.id : null, spouseIds: sp, childIds: (p.children || []).filter(id => A.P(id)),
      traits, vows: !!(p.vows || fl.priest), bastard: !!fl.bastard, legitimized: !!(fl.legitimized || fl.legit),
      disinherited: !!fl.disinherited, judgedSimple: F.simple ? F.simple(p) : false,
      titles: F.titlesOf ? F.titlesOf(p) : [], office: p.famOffice || null, game: p,
    };
  }
  // a People-like view (the subset of src/v2/kin.js People that kin.js and succession.js read)
  F.people = function () {
    const cache = new Map();
    const get = id => { if (id == null) return null; if (cache.has(id)) return cache.get(id); const w = wrap(A.P(id)); cache.set(id, w); return w; };
    return {
      get, map: { get },
      parents: p => [get(p.fatherId), get(p.motherId)].filter(Boolean),
      children: p => p.childIds.map(get).filter(Boolean),
      all: () => Object.keys(A.S.people).map(get).filter(Boolean),
      of: p => get(p && p.id),
    };
  };

  // feudal ties the resolver knows: "lord" in the release's rel.type is your liege
  function withFeudal(P, me, other) {
    const m = P.of(me), o = P.of(other);
    if (!m || !o) return [m, o];
    const r = me.rel && me.rel[other.id], back = other.rel && other.rel[me.id];
    if (r && r.type === 'lord') m.liegeId = o.id;
    if (back && back.type === 'lord') o.liegeId = m.id;
    return [m, o];
  }
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const exWord = p => (p.sex === 'F' ? 'former wife' : 'former husband');

  // THE label: A.V2.kin.relationLabel over the family graph, with the player's bond as the qualifier
  F.label = function (me, other, P) {
    if (!me || !other || me.id === other.id) return null;
    P = P || F.people();
    const [m, o] = withFeudal(P, me, other);
    if (!m || !o) return null;
    const r = me.rel && me.rel[other.id];
    const t = r && r.type;
    let bondKind = t && F.BOND[t];
    if (t === 'ex') bondKind = exWord(other);
    // one coherent label (playtest 1, #15): the bond's word follows the feeling, one lover is the lover, one superior
    // is the superior
    bondKind = F.bondNow(me, other, r, bondKind);
    // a spouse is never also "your lover" or "betrothed"
    if ((bondKind === 'lover' || bondKind === 'betrothed') && m.spouseIds.includes(o.id)) bondKind = null;
    const bonds = bondKind ? { get: () => ({ kind: bondKind }) } : null;
    const lab = K.relationLabel(P, m, o, bonds);
    let text = lab.text;
    if (bondKind && QUAL[bondKind] && lab.kin) text = text.replace('(' + bondKind, '(' + QUAL[bondKind]);
    if (bondKind && WORD[bondKind] && !lab.kin) text = WORD[bondKind];
    // the graph does not reach them, but the release links them as kin (a great house's members): keep its word
    if (!lab.kin && t && F.KIN_TYPES.includes(t) && F.oldLabel) {
      const old = F.oldLabel(other, r);
      text = lab.qualifiers.length ? old + ' (' + lab.qualifiers.join(', ') + ')' : old;
      return Object.assign({}, lab, { primary: old.toLowerCase(), text: cap(text), loose: true });
    }
    if (!lab.kin && !bondKind && t === 'acquaint') text = 'acquaintance';
    text = text.replace(/\bbestFriend\b/g, 'best friend');
    return Object.assign({}, lab, { text: cap(text) });
  };
  const opOf = r => (r && typeof r.op === 'number' ? r.op : 0);
  F.bondNow = function (me, other, r, kind) {
    if (!kind) return kind;
    const op = opOf(r);
    if ((kind === 'enemy' || kind === 'rival') && op >= 30) return kind === 'enemy' ? 'former enemy' : 'friendly rival';
    if ((kind === 'friend' || kind === 'bestFriend') && op <= -30) return 'estranged friend';
    if (kind === 'lover') {
      if (op <= -30) return 'estranged lover';
      // the lover is the latest (then the dearest) living one; any other is a former lover
      let best = null;
      for (const id in me.rel || {}) {
        const q = me.rel[id], x = A.P(id);
        if (!q || q.type !== 'lover' || !x || !x.alive) continue;
        if (!best || (q.since || 0) > (best.q.since || 0) || ((q.since || 0) === (best.q.since || 0) && (opOf(q) > opOf(best.q) || (opOf(q) === opOf(best.q) && String(id) < String(best.id))))) best = { id, q };
      }
      if (best && String(best.id) !== String(other.id)) return 'former lover';
    }
    if (kind === 'superior') { const s = A.superior ? A.superior(me) : null; if (!s || s.id !== other.id) return 'former superior'; }
    return kind;
  };
  F.kinOf = function (me, other, P) {
    if (!me || !other) return null;
    P = P || F.people();
    const m = P.of(me), o = P.of(other);
    if (!m || !o) return null;
    const k = K.affinalTerm(P, m, o) && m.spouseIds.includes(o.id) ? K.affinalTerm(P, m, o) : (K.bloodTerm(P, m, o) || K.affinalTerm(P, m, o));
    return k && k.term !== 'self' ? k : null;
  };
  // the group a person falls under on the People tab: kin and spouse first, whatever their rel.type says
  F.groupType = function (me, other, r) {
    const t = r && r.type;
    try {
      const k = F.kinOf(me, other);
      if (k) return k.line === 'spouse' ? 'spouse' : 'sibling';
    } catch (e) {}
    return t;
  };
  // "a friend of yours who is close to them": never kin or spouse of either (kin.js canCallMutualFriend)
  F.mayCallFriend = function (a, b, c, P) {
    if (!a || !b || !c) return false;
    P = P || F.people();
    const x = P.of(a), y = P.of(b), z = P.of(c);
    if (!x || !y || !z) return false;
    return K.canCallMutualFriend(P, x, y, z);
  };

  // ---- A.relLabel ---------------------------------------------------------------------------------------------------
  const relLabel = A.relLabel;
  F.oldLabel = (p, r) => relLabel.call(A, p, r);
  A.relLabel = function (p, rel, owner) {
    try {
      const pc = A.pc();
      const me = owner || (pc && p && pc.rel && pc.rel[p.id] === rel ? pc : null);
      if (me && p && rel) { const L = F.label(me, p); if (L) return L.text; }
    } catch (e) { console.error('v2-family label', e); }
    return relLabel.apply(this, arguments);
  };

  // ---- event tokens -------------------------------------------------------------------------------------------------
  // {father} and {mother} by the parents' sex (the release read parents[0] and parents[1]); {rival} and {friend} are
  // never your kin or your spouse (they would be named by their kinship instead).
  F.parentOf = (pc, sex) => (pc.parents || []).map(A.P).find(q => q && (sex === 'F' ? q.sex === 'F' : q.sex !== 'F')) || null;
  F.bondOf = function (pc, types) {
    const P = F.people();
    for (const { p } of A.relsOf(pc, types)) { if (!F.kinOf(pc, p, P)) return p; }
    return null;
  };
  const T0 = A.T, TOK = /\{(father|mother|rival|friend)\}/;
  A.T = function (str, ctx) {
    try {
      const pc = A.pc();
      if (pc && typeof str === 'string' && TOK.test(str)) {
        const c = Object.assign({}, ctx || {});
        if (c.father == null && /\{father\}/.test(str)) { const f = F.parentOf(pc, 'M'); if (f) c.father = f.given; }
        if (c.mother == null && /\{mother\}/.test(str)) { const m = F.parentOf(pc, 'F'); if (m) c.mother = m.given; }
        if (c.rival == null && /\{rival\}/.test(str)) { const x = F.bondOf(pc, ['rival', 'enemy']); c.rival = x ? x.given : 'your rival'; }
        if (c.friend == null && /\{friend\}/.test(str)) { const x = F.bondOf(pc, ['friend', 'bestfriend']); c.friend = x ? x.given : 'a friend'; }
        return T0.call(this, str, c);
      }
    } catch (e) { console.error('v2-family tokens', e); }
    return T0.apply(this, arguments);
  };

  // ---- the cause of a death is told of them, not of you (playtest 1, #24: "your grandmother dies of old age, in your
  // sleep"): A.naturalCause's words for someone else take their pronoun
  const nc = A.naturalCause;
  if (typeof nc === 'function') A.naturalCause = function (p) {
    const c = nc.apply(this, arguments);
    try { if (typeof c === 'string' && p && A.S && p.id !== A.S.pc) return c.replace(/\byour sleep\b/g, (p.sex === 'F' ? 'her' : 'his') + ' sleep').replace(/\byour (heart|lungs|bed)\b/g, (m, w) => (p.sex === 'F' ? 'her ' : 'his ') + w); } catch (e) {}
    return c;
  };
  // a person's occupation word follows their sex ("a lady of the house" was given to men, "a lord" to women)
  F.fixOcc = function (p) {
    if (!p || typeof p.occ !== 'string') return;
    if (p.sex === 'F' && p.occ === 'a lord') p.occ = 'a lady of the house';
    else if (p.sex !== 'F' && p.occ === 'a lady of the house') p.occ = 'a lord';
  };

  // ---- a person made for a scene takes the sex its words give them (playtest 2, old #24) ---------------------------
  // The release's scenes make their stranger with A.makeAcquaintance (content's stranger() and ranker()), which draws
  // the sex at random, while the scene's own words fix it: "{themFull}, an old scholar ... for the price of his rent",
  // "{themFull}, bailiff of the next manor ... he has noticed", "One recruit, {rec} ... give him a blanket-beating". So
  // Hilda paid "his" rent, Nazga "has noticed" as "he" and was later remembered as "you exposed him", Edda got "him".
  // Here a scene whose words speak of one sex only (he/him/his and no she/her, or the reverse), and that has no
  // pronoun token of its own ({khe}, {theyHe}, {xHim}, A.he(...)), makes its fresh person of that sex. The release's
  // draws are all still made (the stream does not move); the person is flipped after, with a name of the right sex
  // picked by a hash of their id. A person who already exists is never changed.
  const SEXTOK = /\{[A-Za-z0-9]*(?:[Hh]e|[Hh]im|[Hh]is|Her|Hers)\}|\{k(?:he|him|his)\}|A\.(?:he|him|his)\(/;
  const MALE = /\b(?:he|him|his|himself)\b/i, FEMALE = /\b(?:she|her|hers|herself)\b/i;
  const sexCache = new Map();
  const textsOf = e => {
    const out = [];
    const put = x => { if (typeof x === 'string') out.push(x); else if (typeof x === 'function') out.push(String(x)); };
    put(e.text);
    for (const c of e.choices || []) { if (!c) continue; put(c.t); put(c.r); if (c.win) put(c.win.r); if (c.lose) put(c.lose.r); }
    return out.join(' \n ');
  };
  F.sceneSex = function (e) {
    if (!e || !e.id) return null;
    if (sexCache.has(e.id)) return sexCache.get(e.id);
    let s = null;
    try {
      const all = textsOf(e);
      if (!SEXTOK.test(all)) { const m = MALE.test(all), f = FEMALE.test(all); s = m && !f ? 'M' : f && !m ? 'F' : null; }
    } catch (err) { s = null; }
    sexCache.set(e.id, s);
    return s;
  };
  const nameHash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  F.setSex = function (p, sex) {
    if (!p || !sex || p.sex === sex) return p;
    p.sex = sex;
    try {
      const c = (typeof LORE !== 'undefined' && LORE.cultures && (LORE.cultures[p.cult] || LORE.cultures['CUL-02'])) || null;
      const list = c ? (sex === 'F' ? c.f : c.m) : null;
      if (list && list.length) p.given = list[nameHash(p.id + '|' + sex) % list.length];
    } catch (e) {}
    if (p.surMode === 'patron' && typeof p.sur === 'string') p.sur = p.sur.replace(/^(son|daughter) of /, sex === 'F' ? 'daughter of ' : 'son of ');
    F.fixOcc(p);
    return p;
  };
  let sceneSex = null;
  const mkAcq = A.makeAcquaintance;
  if (typeof mkAcq === 'function') A.makeAcquaintance = function () {
    const p = mkAcq.apply(this, arguments);
    try { if (sceneSex && p && p.sex !== sceneSex) F.setSex(p, sceneSex); } catch (e) {}
    return p;
  };
  const evView = A.eventView;
  A.eventView = function (q) {
    const e = q && !q.view && A.EV && A.EV[q.ev];
    if (!e || !e.setup) return evView.apply(this, arguments);
    const was = sceneSex;
    sceneSex = F.sceneSex(e);
    try { return evView.apply(this, arguments); } finally { sceneSex = was; }
  };

  // ---- circles and gossip (41-circles, 55-bonds): "close to X (your friend)" never names your kin ----------------------
  const CI = A.CIRCLES;
  if (CI && typeof CI.circleOf === 'function') {
    const circleOf = CI.circleOf;
    CI.circleOf = function (pc, t) {
      const c = circleOf.apply(this, arguments);
      try {
        const P = F.people(), ok = x => F.mayCallFriend(pc, t, x, P);
        return { friends: c.friends.filter(ok), foes: c.foes.filter(ok) };
      } catch (e) { return c; }
    };
  }
  const SEC = A.BONDS && A.BONDS.SEC;
  if (SEC && typeof SEC.gossipOf === 'function') {
    const gossipOf = SEC.gossipOf;
    SEC.gossipOf = function (pc, t) {
      const x = gossipOf.apply(this, arguments);
      try { return x && !F.mayCallFriend(pc, t, x) ? null : x; } catch (e) { return x; }
    };
  }
})();
