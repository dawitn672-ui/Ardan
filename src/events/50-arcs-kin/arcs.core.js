// Kin and blood (Road to Ten, Events 3 and 4): thirteen long story arcs about families, run on the story track of
// 46-life-arcs (A.ARCS.story). A blood feud; a child you did not know; an uncle's mill fought over; a brother back from
// the galleys; a match that goes wrong; a bastard with a contract; the shaking that runs in your mother's line; a
// foundling; a night flight; a parent's will with conditions and a sealed letter; a dowry sixty years unpaid; the old
// family ground; a father's other house. Each is 4 to 6 scenes over 3 to 16 years, and each ends with something that
// stays: a sworn bond or a feud passed down, a child in the register, a house, a farm, a trait, a wound, a name.
//
// This file holds what the scenes share (arcs.events.js holds the scenes):
//   A.AKIN          the arc's own memory of its people (pc.arcs[key].who) and the names it made up (.nm), a person
//                   maker, pronoun tokens, and number words
//   fx.akin         the few effects the release has no key for: write a child into the register, marry or part,
//                   marry off a son or daughter, grant or sell the house or the farm an arc is about
//   GD.WOUNDS.ak_shaking  the family sickness, when it shows
// Engine side only: nothing here draws on render.
(function () {
  const C = A.C;
  const AK = A.AKIN = {};

  // ---- the arc's memory. Kept on the arc's own state so it goes when the arc goes and survives a save; an old save
  // or a scene shown outside an arc (the linter) gets a fresh scratch object and makes stand-ins
  AK.st = (p, k) => {
    const a = p && p.arcs && typeof p.arcs === 'object' ? p.arcs[k] : null;
    if (!a || typeof a !== 'object') return { who: {}, nm: {} };
    if (!a.who || typeof a.who !== 'object') a.who = {};
    if (!a.nm || typeof a.nm !== 'object') a.nm = {};
    return a;
  };
  AK.who = (p, k, role) => A.P(AK.st(p, k).who[role]);
  AK.keep = (p, k, role, q) => { if (q) AK.st(p, k).who[role] = q.id; return q; };
  // the person in a role, or someone made to fit and kept
  AK.get = (p, k, role, make) => {
    const had = AK.who(p, k, role); if (had || !make) return had;
    const u = AK.used(p, k), q = make();
    // someone made just now gets a name of their own (an existing relative keeps theirs)
    if (q && q.npc !== false && q.born >= A.S.year - 200 && !q.rel[p.id])
      for (let i = 0; i < 8 && u.has(q.given); i++) q.given = A.givenName(q.cult, q.sex);
    return AK.keep(p, k, role, q);
  };
  // a made-up name or word, chosen once
  AK.name = (p, k, role, make) => { const nm = AK.st(p, k).nm; if (nm[role] == null) nm[role] = String(make()); return nm[role]; };

  // ---- the real family tree (playtest 2, new #10: "Your mother's brother Hamo, who never married" while Hamo was the
  // player's grandfather). An arc that names kin reads them from the family graph (p.parents, p.children, p.spouse:
  // 99994-v2-family fills in grandparents, uncles, aunts and cousins). When the tree has nobody who fits, the person the
  // arc makes is written into the tree where the text puts them (a parent's brother is a child of that parent's
  // parents), and a name an arc makes up is never one already in the family.
  AK.parent = (p, sex) => ((p && p.parents) || []).map(A.P).find(q => q && (q.sex === 'F') === (sex === 'F')) || null;
  // brothers and sisters (by either parent), living or dead
  AK.sibs = q => {
    const out = [];
    for (const g of ((q && q.parents) || []).map(A.P)) if (g) for (const id of g.children || []) { const s = A.P(id); if (s && s.id !== q.id && !out.includes(s)) out.push(s); }
    return out;
  };
  AK.everWed = q => !!(q && (q.spouse || (q.exSpouses || []).length || Object.values(q.rel || {}).some(r => r && r.type === 'spouse')));
  // everyone within four steps of the family graph (parents, children, spouse): the people a family name could clash with
  AK.family = p => {
    const seen = new Map(); let edge = [p];
    for (let d = 0; d < 4 && edge.length; d++) {
      const next = [];
      for (const q of edge) {
        if (!q || seen.has(q.id)) continue;
        seen.set(q.id, q);
        for (const id of [...(q.parents || []), ...(q.children || []), q.spouse]) { const x = id != null && A.P(id); if (x && !seen.has(x.id)) next.push(x); }
      }
      edge = next;
    }
    for (const q of edge) if (q && !seen.has(q.id)) seen.set(q.id, q);
    seen.delete(p.id);
    return [...seen.values()];
  };
  // the parent through whom q is kin (the parent q is a brother or sister of), or null
  AK.sideOf = (p, q) => [AK.parent(p, 'M'), AK.parent(p, 'F')].find(par => par && AK.sibs(par).includes(q)) || null;
  // a quiet death now (the scene is the burial): no succession, no notices; the person holds nothing
  AK.bury = (q, cause) => {
    if (!q || !q.alive) return;
    q.alive = false; q.died = A.S.year; q.cause = cause || 'a fever';
    const sp = q.spouse && A.P(q.spouse);
    if (sp && sp.spouse === q.id) { sp.spouse = null; sp.widowed = A.S.year; }
  };
  const holdsNothing = q => !q.ruler && !(q.noble && q.noble.rung >= 2) && !(q.house && A.S.houses && A.S.houses[q.house] && A.S.houses[q.house].headPid === q.id);
  // a brother or sister of the parent `par`, made now and written into the tree under par's parents
  AK.sibOf = (p, par, o = {}) => {
    const gp = (par.parents || []).map(A.P).filter(Boolean), gf = gp.find(g => g.sex !== 'F');
    const sex = o.sex || (A.chance(0.5) ? 'M' : 'F');
    const sur = par.surMode === 'patron' ? (sex === 'F' ? 'daughter of ' : 'son of ') + (gf ? gf.given : A.givenName(par.cult, 'M')) : par.sur;
    const q = AK.mk(p, Object.assign({ race: par.race, cult: par.cult, faith: par.faith, status: par.status === 'royal' ? 'noble' : par.status, sur, surMode: par.surMode, parents: gp.map(g => g.id) }, o, { sex }));
    q.born = Math.min(A.S.year - 1, par.born + (A.chance(0.5) ? -1 : 1) * A.ri(1, 6));
    for (const g of gp) if (!g.children.includes(q.id)) g.children.push(q.id);
    AK.uniqueName(p, q);
    A.link(p, q, 'uncle', A.ri(15, 50), 'nephew');
    if (!par.rel[q.id]) A.link(par, q, 'sibling', A.ri(15, 60), 'sibling');
    return q;
  };
  // a child of `fa` and `mo` (either may be null), made now and written into the tree
  AK.childOfPair = (p, fa, mo, o = {}) => {
    const by = fa || mo, sex = o.sex || (A.chance(0.5) ? 'M' : 'F');
    const sur = by.surMode === 'patron' ? (sex === 'F' ? 'daughter of ' : 'son of ') + (fa ? fa.given : A.givenName(by.cult, 'M')) : by.sur;
    const q = AK.mk(p, Object.assign({ race: by.race, cult: by.cult, faith: by.faith, status: by.status === 'royal' ? 'noble' : by.status, sur, surMode: by.surMode,
      parents: [fa ? fa.id : null, mo ? mo.id : null].filter(x => x != null) }, o, { sex }));
    for (const g of [fa, mo]) if (g && !g.children.includes(q.id)) g.children.push(q.id);
    AK.uniqueName(p, q);
    return q;
  };
  AK.uniqueName = (p, q) => {
    const fam = AK.family(p).filter(x => x !== q);
    const used = new Set([p.given, ...fam.map(x => x.given)]);
    for (let i = 0; i < 10 && used.has(q.given); i++) q.given = A.givenName(q.cult, q.sex);
    return q;
  };
  AK.kinNames = p => new Set(AK.family(p).map(q => q.given));

  // a given name not already used by someone in this arc (or by anyone in the player's family), chosen once
  AK.used = (p, k) => {
    const st = AK.st(p, k), u = new Set(Object.values(st.nm).map(String));
    for (const id of Object.values(st.who)) { const q = A.P(id); if (q) u.add(q.given); }
    for (const q of [p, AK.spouse(p), AK.father(p), AK.mother(p)]) if (q) u.add(q.given);
    if (p && p.id) for (const n of AK.kinNames(p)) u.add(n);
    return u;
  };
  // the real kin a scene names, by role (read once, kept on the arc like anyone it makes)
  AK.KIN = {
    // a parent's brother who never married, living or lately dead, who holds nothing; else one written into the tree
    unwedUncle(p) {
      const sides = [AK.parent(p, 'M'), AK.parent(p, 'F')].filter(Boolean);
      if (sides.length > 1 && A.chance(0.5)) sides.reverse();
      for (const par of sides) {
        const u = AK.sibs(par).find(s => s.sex !== 'F' && !AK.everWed(s) && !(s.children || []).length && !s.vows && holdsNothing(s)
          && A.isAdult(s) && (s.alive || (s.died != null && A.S.year - s.died <= 1)));
        if (u) return u;
      }
      return sides.length ? AK.sibOf(p, sides[0], { sex: 'M', age: AK.adj(sides[0]) + A.ri(-5, 5) }) : null;
    },
    // a first cousin on q's side of the family (a child of q's brothers and sisters other than your own parent)
    cousinBy(p, q, ok) {
      const par = AK.sideOf(p, q);
      const aunts = AK.sibs(q).filter(s => s !== par);
      for (const s of aunts) for (const id of s.children || []) { const c = A.P(id); if (c && c.id !== p.id && ok(c)) return c; }
      return null;
    },
    // all your first cousins (children of your parents' brothers and sisters)
    cousins(p) {
      const out = [];
      for (const par of [AK.parent(p, 'M'), AK.parent(p, 'F')]) if (par) for (const s of AK.sibs(par)) for (const id of s.children || []) {
        const c = A.P(id); if (c && c.id !== p.id && !out.includes(c)) out.push(c);
      }
      return out;
    },
    // the father of a cousin (your uncle by blood or by marriage)
    fatherOf: q => AK.parent(q, 'M'),
  };
  AK.given = (p, k, role, sex, cult) => AK.name(p, k, role, () => {
    const u = AK.used(p, k); let n = '';
    for (let i = 0; i < 8; i++) { n = A.givenName(cult || p.cult, sex); if (!u.has(n)) break; }
    return n;
  });
  AK.adj = p => C.ageAdj(p);
  AK.hi = p => C.noble(p) || ['gentry', 'royal', 'noble'].includes(p.status);
  AK.kidsOf = p => (p.children || []).map(A.P).filter(k => k && k.alive);
  AK.spouse = p => { const s = p && p.spouse ? A.P(p.spouse) : null; return s && s.alive ? s : null; };
  AK.father = p => A.P((p.parents || [])[0]);
  AK.mother = p => A.P((p.parents || [])[1]);
  AK.free = q => !!q && q.alive && !AK.spouse(q);
  // someone who has been a lover, a betrothed or a spouse, living or dead
  AK.loves = p => Object.entries(p.rel || {}).filter(([id, r]) => ['lover', 'ex', 'spouse', 'betrothed'].includes(r.type) && A.P(id)).map(([id]) => A.P(id));

  // a person made to fit the story: o.age in human years (scaled to the race), living where the player lives
  AK.mk = (p, o = {}) => {
    const race = o.race || p.race, R = GD.RACES[race] || GD.RACES.human, sex = o.sex || (A.chance(0.5) ? 'M' : 'F');
    const cult = o.cult || p.cult, faith = o.faith || p.faith;
    const st = o.status || (p.status === 'royal' ? 'noble' : p.status === 'slave' ? 'peasant' : p.status);
    const yrs = Math.max(1, Math.round((o.age != null ? o.age : AK.adj(p)) * R.adult / 16));
    const q = A.newPerson({ given: A.givenName(cult, sex), sex, race, realm: p.realm, cult, faith, born: A.S.year - yrs, status: st, home: p.home, parents: o.parents });
    if (o.sur != null) { q.sur = o.sur; q.surMode = o.surMode || 'place'; }
    else { const fn = A.familyName({ cult, realm: p.realm, status: st, home: p.home, sex }); if (fn) { q.sur = fn.sur; q.surMode = fn.mode; } }
    q.occ = o.occ || (A.isAdult(q) ? A.pick(A.OCC[st] || A.OCC.peasant) : '');
    return q;
  };

  // number words, for ages and years
  const ONES = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen',
    'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  AK.num = n => { n = Math.max(0, Math.round(n)); if (n < 20) return ONES[n]; if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : ''); return String(n); };

  // tokens for a person in a role: {x} {xFull} {xHe} {xHis} {xHim} {xSD} son/daughter {xBS} brother/sister {xMW} man/woman
  // {xBG} boy/girl {xAge} (in words) {xOcc}
  AK.tok = (ctx, key, q) => {
    if (!q) return;
    const f = q.sex === 'F';
    ctx[key] = q.given; ctx[key + 'Full'] = A.fullName(q, false);
    ctx[key + 'He'] = f ? 'she' : 'he'; ctx[key + 'His'] = f ? 'her' : 'his'; ctx[key + 'Him'] = f ? 'her' : 'him';
    ctx[key + 'SD'] = f ? 'daughter' : 'son'; ctx[key + 'BS'] = f ? 'sister' : 'brother'; ctx[key + 'MW'] = f ? 'woman' : 'man';
    ctx[key + 'BG'] = f ? 'girl' : 'boy'; ctx[key + 'Age'] = AK.num(A.age(q)); ctx[key + 'Occ'] = q.occ || 'nobody in particular';
  };

  // a town of the realm that is not home, chosen once per arc
  // (a real town if the realm has one: "the market at Frosthollow Castle" reads worse than "at Yewmarch")
  AK.townish = x => !/^The /.test(x.name) && !/ (Castle|Tower|Monastery|Oasis|Waste|Woods|Yam|Caravanserai)$/.test(x.name);
  AK.town = (p, k) => AK.name(p, k, 'town', () => {
    const o = A.S.prov.filter(x => x.owner === p.realm && x.id !== p.home && AK.townish(x));
    const best = o.filter(x => (x.town || 0) >= 2000);
    const n = best.length ? A.pick(best) : o.length ? A.pick(o) : null;
    return n ? n.name : 'the next valley';
  });
  // a share of what you own, in words a reader can weigh
  // a price with a floor: fx { coin: -floor, coinPct: -f } takes the floor and then that share of what is left, so it
  // means something to a pauper and to a magnate alike; this is what it comes to, in words
  AK.price = (p, floor, f) => A.coin(Math.round(floor + f * Math.max(0, (p.coin || 0) - floor)));

  // ---- fx.akin: effects the release has no key for. ctx.pid is the person; ctx.arc the arc (for the people it keeps)
  const label = (q, sd) => (q.sex === 'F' ? (sd ? 'daughter' : 'sister') : (sd ? 'son' : 'brother'));
  // a child into the register: the family tree, the heirs, the name
  const childOf = (pc, k, bastard) => {
    if (!k || !k.alive || k.id === pc.id) return '';
    const sp = AK.spouse(pc);
    if (!pc.children.includes(k.id)) pc.children.push(k.id);
    const par = (k.parents || []).slice(0, 2);
    par[pc.sex === 'F' ? 1 : 0] = pc.id;
    if (!bastard && sp && !par[pc.sex === 'F' ? 0 : 1]) { par[pc.sex === 'F' ? 0 : 1] = sp.id; if (!sp.children.includes(k.id)) sp.children.push(k.id); }
    k.parents = par;
    if (bastard) k.flags.bastard = true;
    else { if (pc.sur) { k.sur = pc.sur; k.surMode = pc.surMode; } if (pc.house) k.house = pc.house; }
    const op = pc.rel[k.id] ? Math.max(pc.rel[k.id].op, 40) : 50;
    A.link(pc, k, 'child', op, pc.sex === 'F' ? 'mother' : 'father');
    for (const s of AK.kidsOf(pc)) if (s.id !== k.id && !s.rel[k.id]) A.link(s, k, 'sibling', 20, 'sibling');
    return `(${k.given} is written in the register as your ${label(k, true)}.)`;
  };
  const part = (a, b) => {
    if (!a || !b || a.spouse !== b.id) return false;
    a.spouse = null; b.spouse = null;
    if (a.rel[b.id]) a.rel[b.id].type = 'ex';
    if (b.rel[a.id]) b.rel[a.id].type = 'ex';
    (a.exSpouses = a.exSpouses || []).push(b.id); (b.exSpouses = b.exSpouses || []).push(a.id);
    return true;
  };
  const grant = (pc, k, arc, name) => {
    if (!GD.PROPERTY[k] || (arc && pc.assets.some(x => x && x.ak === arc))) return '';
    const n = String(name || GD.PROPERTY[k].name).replace(/[<>"]/g, '');
    pc.assets.push({ k, name: n, y: A.S.year, ak: arc || 1 });
    return `(${n})`;
  };
  const ungrant = (pc, arc) => { const i = pc.assets.findIndex(x => x && x.ak === arc); if (i < 0) return ''; const [x] = pc.assets.splice(i, 1); return `(${x.name} is no longer yours.)`; };
  AK.OPS = {
    acknowledge: (pc, ctx) => childOf(pc, A.P(ctx.pid), true),
    adopt: (pc, ctx) => childOf(pc, A.P(ctx.pid), false),
    wed: (pc, ctx) => {
      const t = A.P(ctx.pid);
      if (!t || !t.alive || pc.spouse === t.id || AK.spouse(pc) || AK.spouse(t)) return '';
      A.marry(pc, t);
      return `(You and ${t.given} are married.)`;
    },
    unwed: (pc, ctx) => (part(pc, A.P(ctx.pid)) ? `(You and ${A.P(ctx.pid).given} live apart.)` : ''),
    // the son or daughter an arc is marrying off (who.kin) and the match (who.mate)
    wedKin: (pc, ctx) => {
      const a = AK.st(pc, ctx.arc), x = A.P(a.who.kin), y = A.P(a.who.mate);
      if (!AK.free(x) || !AK.free(y)) return '';
      x.spouse = y.id; y.spouse = x.id; A.link(x, y, 'spouse', 30, 'spouse');
      if (!pc.rel[y.id]) A.link(pc, y, 'inlaw', 10, 'inlaw');
      return `(${x.given} and ${y.given} are married.)`;
    },
    unwedKin: (pc, ctx) => { const a = AK.st(pc, ctx.arc), x = A.P(a.who.kin), y = A.P(a.who.mate); return part(x, y) ? `(${x.given} is free of ${y.given}.)` : ''; },
    // the house in a will: a town house for people of standing, a cottage for the rest
    house: (pc, ctx) => grant(pc, C.rich(pc) || AK.hi(pc) ? 'townhouse' : 'cottage', ctx.arc),
    farm: (pc, ctx) => grant(pc, 'farm', ctx.arc, ctx.ground ? ctx.ground.replace(/^the /, 'The ') + ', the old family ground' : null),
    mill: (pc, ctx) => grant(pc, 'workshop', ctx.arc, ctx.mill),
    cottage: (pc, ctx) => grant(pc, 'cottage', ctx.arc),
    // the feud's uncle, killed at the ford: the real man dies (the next scene buries him)
    buryUncle: (pc, ctx) => { AK.bury(AK.who(pc, ctx.arc || 'ak_feud', 'unc'), 'a spear-thrust at the ford'); return ''; },
    sell: (pc, ctx) => ungrant(pc, ctx.arc),
    // the dowry's match: you (who.kin is the player) or your son or daughter, with the creditor's grandchild
    wedMatch: (pc, ctx) => {
      const a = AK.st(pc, ctx.arc), x = A.P(a.who.kin), y = A.P(a.who.mate);
      if (x && x.id === pc.id) return AK.OPS.wed(pc, { pid: y && y.id });
      return AK.OPS.wedKin(pc, ctx);
    },
    // the family sickness: settled, unseen, at the arc's first scene; it shows by the last whether you looked or not
    fate: (pc, ctx) => {
      if (AK.st(pc, ctx.arc).nm.fate !== '1' || pc.wounds.some(w => w.k === 'ak_shaking')) return '';
      const n = A.addWound(pc, 'ak_shaking');
      return n ? `(${n})` : '';
    },
  };
  (A.FX_EXTRA = A.FX_EXTRA || []).push('akin');
  const apply = A.applyFx;
  A.applyFx = function (pc, fx, ctx) {
    const r = apply.apply(this, arguments);
    let extra = '';
    try {
      const v = fx && typeof fx === 'object' ? fx.akin : null;
      if (v && pc && pc.id === A.S.pc) for (const op of [].concat(v)) if (AK.OPS[op]) extra += (extra ? ' ' : '') + (AK.OPS[op](pc, ctx || {}) || '');
    } catch (e) { console.error('arcs-kin fx', e); }
    return [r, extra].filter(s => typeof s === 'string' && s.trim()).join(' ');
  };

  // the family sickness (ak_blood): it shows in the hands first, then the walk
  GD.WOUNDS.ak_shaking = { name: 'The shaking in the hands (it runs in the family)', fx: { spd: -4, ins: -2 }, perm: true,
    skillPen: { craft: -10, music: -10, bow: -8, xbow: -6, medicine: -6, dagger: -6 } };

  // ---- the arcs. start(pc, C) decides who can get one; most are open to most grown lives
  const AR = A.ARCS;
  if (!AR || !AR.story) return;   // the story track lives in 46-life-arcs
  const adj = AK.adj;
  const father = AK.father;
  const parentDiedLately = p => (p.parents || []).some(id => { const q = A.P(id); return q && !q.alive && q.died != null && A.S.year - q.died <= 3; });
  const toWed = p => AK.kidsOf(p).some(k => adj(k) >= 15 && adj(k) <= 30 && !AK.spouse(k))
    || (!(father(p) && father(p).alive) && A.relsOf(p, ['sibling']).some(x => x.p.alive && adj(x.p) >= 15 && adj(x.p) <= 30 && !AK.spouse(x.p) && x.p.born > p.born));
  const S = (k, def) => AR.story(k, Object.assign({ feature: 'arcs-kin' }, def));

  S('ak_feud', { title: 'The feud', lasting: 'bond', gap: [1, 3],
    stages: ['ak_feud_1', 'ak_feud_2', 'ak_feud_3', 'ak_feud_4', 'ak_feud_5', 'ak_feud_6'],
    start: (p, C) => C.adult(p) && adj(p) >= 18 && adj(p) <= 58 && !C.ruler(p) });
  S('ak_secret', { title: 'A child you did not know', lasting: 'bond', gap: [1, 3],
    stages: ['ak_secret_1', 'ak_secret_2', 'ak_secret_3', 'ak_secret_4', 'ak_secret_5'],
    start: (p, C) => C.adult(p) && adj(p) >= 30 && adj(p) <= 62 && (C.married(p) || AK.loves(p).length > 0) });
  S('ak_inherit', { title: "Your uncle's mill", lasting: 'wealth', gap: [1, 2],
    stages: ['ak_inherit_1', 'ak_inherit_2', 'ak_inherit_3', 'ak_inherit_4'],
    start: (p, C) => C.adult(p) && adj(p) >= 20 && adj(p) <= 64 && !C.ruler(p) });
  S('ak_sibling', { title: 'The one who came back', lasting: 'bond', gap: [1, 3],
    stages: ['ak_sibling_1', 'ak_sibling_2', 'ak_sibling_3', 'ak_sibling_4', 'ak_sibling_5'],
    start: (p, C) => C.adult(p) && adj(p) >= 20 && adj(p) <= 52 });
  // the match and the will can only begin in a window (a son or daughter of an age to marry; a parent lately dead), so
  // they weigh more than the arcs open to any grown life
  S('ak_match', { title: 'The match', lasting: 'bond', gap: [1, 2], w: 2,
    stages: ['ak_match_1', 'ak_match_2', 'ak_match_3', 'ak_match_4'],
    start: (p, C) => C.adult(p) && adj(p) >= 30 && toWed(p) });
  S('ak_bastard', { title: 'The bastard of the house', lasting: 'law', gap: [1, 3],
    stages: ['ak_bastard_1', 'ak_bastard_2', 'ak_bastard_3', 'ak_bastard_4'],
    start: (p, C) => C.adult(p) && adj(p) >= 22 && adj(p) <= 66 && !C.unfree(p) });
  S('ak_blood', { title: 'What runs in the blood', lasting: 'trait', gap: [1, 4],
    stages: ['ak_blood_1', 'ak_blood_2', 'ak_blood_3', 'ak_blood_4', 'ak_blood_5'],
    // the first scene says your mother's father "went the same way": he is in his grave (playtest 2, new #10)
    start: (p, C) => C.adult(p) && adj(p) >= 26 && adj(p) <= 48 && !(AK.parent(AK.parent(p, 'F'), 'M') || { alive: false }).alive });
  S('ak_adopt', { title: 'The carter\'s child', lasting: 'bond', gap: [2, 4],
    stages: ['ak_adopt_1', 'ak_adopt_2', 'ak_adopt_3', 'ak_adopt_4', 'ak_adopt_5'],
    start: (p, C) => C.adult(p) && adj(p) >= 24 && adj(p) <= 54 && !C.ruler(p) });
  S('ak_elope', { title: 'The night road', lasting: 'bond', gap: [1, 2],
    stages: ['ak_elope_1', 'ak_elope_2', 'ak_elope_3', 'ak_elope_4'],
    start: (p, C) => C.adult(p) && !C.married(p) && adj(p) >= 17 && adj(p) <= 34 && !C.ruler(p) });
  S('ak_will', { title: 'The will', lasting: 'law', gap: [1, 3], w: 4,
    stages: ['ak_will_1', 'ak_will_2', 'ak_will_3', 'ak_will_4'],
    start: (p, C) => C.adult(p) && !C.ruler(p) && parentDiedLately(p) });
  S('ak_dowry', { title: 'The red cow', lasting: 'wealth', gap: [2, 4],
    stages: ['ak_dowry_1', 'ak_dowry_2', 'ak_dowry_3', 'ak_dowry_4'],
    start: (p, C) => C.adult(p) && adj(p) >= 24 && adj(p) <= 64 && !C.ruler(p) });
  S('ak_land', { title: 'The old ground', lasting: 'home', gap: [1, 3],
    stages: ['ak_land_1', 'ak_land_2', 'ak_land_3', 'ak_land_4'],
    start: (p, C) => C.adult(p) && adj(p) >= 25 && adj(p) <= 64 && !C.ruler(p) });
  S('ak_second', { title: "Your father's other house", lasting: 'bond', gap: [1, 3],
    stages: ['ak_second_1', 'ak_second_2', 'ak_second_3', 'ak_second_4'],
    start: (p, C) => C.adult(p) && adj(p) >= 17 && adj(p) <= 52 && !!(father(p) && father(p).alive && adj(father(p)) >= 38) });
  AK.ARCS = AR.stories().filter(k => AR.ARC[k].feature === 'arcs-kin');
})();
