// The world and its disasters (Road to Ten, Events 3 and 4): thirteen story arcs on the story track of 46-life-arcs.
// A plague year, the hungry year, a flood, the fire, refugees from a real war next door, a bandit lord, the siege of
// your home town in a real war, the long winter, the wolf years, a fall at the pit, a wreck on the reef, a pilgrimage,
// and a heresy that splits the parish. Each runs three to six scenes over two to eleven years. Every choice leaves a
// mark the later scenes read, and every ending leaves something that lasts: a name, a bond, a wound, a house, a law,
// or a province changed on the map.
//
// What this file adds to the engine:
//   per-stage gaps    def.gaps[i] = [min, max] years between stage i and the next (a plague moves in months, its
//                     memorial years later); the arc's own gap stays the fallback
//   kept context      ctx.rid, ctx.pid and ctx.shrine of a stage are kept on the arc, so the realm at war, the person
//                     met and the shrine walked to are the same in every later scene
//   three effect keys awWho  { type, op, back, sex, age, from: 'other'|'far', status, occ, line } a new person tied to
//                            you and kept on the arc (a refugee of the warring realm's people, a shipwrecked mate)
//                     awMove 'capital' | 'high' | { to, free } moves your home within the realm (to the capital, or
//                            up to the highest neighbouring province); free: a serf in the city a year is free
//                     awProv { pop, dev, fort } changes your home province: the plague takes people, the dyke raises
//                            development, the new walls add a level of fortification
// Engine side: the start rolls are the story track's; these keys run inside the effect. Rendering only reads.
(function () {
  const AR = A.ARCS;
  if (!AR || !AR.story) return;   // the story track lives in 46-life-arcs
  (A.FX_EXTRA = A.FX_EXTRA || []).push('awWho', 'awMove', 'awProv');
  const W = A.AW = { KEEP: ['rid', 'pid', 'shrine'] };

  // ---- the world, read
  W.prov = pc => (pc ? A.prov(pc.home) : null);
  // realms next to yours that are at war: where refugees come from
  W.warNeighbours = function (pc) {
    const mine = pc.realm, seen = new Set();
    for (const P of A.S.prov) if (P.owner === mine) for (const j of P.adj || []) { const o = A.S.prov[j] && A.S.prov[j].owner; if (o && o !== mine) seen.add(o); }
    return [...seen].filter(r => { const R = A.realm(r); return !!R && R.alive && A.atWar(r).length > 0; });
  };
  // the realm yours is at war with (the first war's other side)
  W.enemyOf = function (pc) {
    const w = A.atWar(pc.realm)[0]; if (!w) return null;
    const foe = w.att.includes(pc.realm) ? (w.leadD || w.def[0]) : (w.leadA || w.att[0]);
    return foe && foe !== pc.realm && A.realm(foe) ? foe : null;
  };
  // this year's harvest in your realm, where 45-economy rolls one ({ f: 1.25 | 1 | 0.7 | 0.4, t: 'a poor harvest' ... })
  W.harvest = function (pc) {
    try { const m = A.ECON && A.mkt ? A.mkt(pc.realm) : null; return m && m.hv && m.hv.y === A.S.year ? m.hv : null; } catch (e) { return null; }
  };
  W.badHarvest = pc => { const h = W.harvest(pc); return !!h && h.f <= 0.7; };
  // the farthest capital of your own faith: the shrine pilgrims walk to
  W.shrine = function (pc) {
    const home = A.prov(pc.home); if (!home) return null;
    let best = null, bd = -1;
    for (const r of Object.values(A.S.realms || {})) {
      if (!r || !r.alive || r.faith !== pc.faith || !r.capital) continue;
      const c = A.prov(r.capitalProv); if (!c || c.id === home.id) continue;
      const d = Math.hypot((c.x || 0) - (home.x || 0), (c.y || 0) - (home.y || 0));
      if (d > bd) { bd = d; best = r.capital; }
    }
    return best;
  };
  // where a move would take you: the realm's capital, or the highest neighbouring province of your realm
  W.moveTo = function (pc, kind) {
    const P = pc && A.prov(pc.home), r = pc && A.realm(pc.realm);
    if (!P || !r) return null;
    if (kind === 'capital') { const c = A.prov(r.capitalProv); return c && c.id !== P.id && c.owner === pc.realm ? c : null; }
    if (kind === 'high') {
      let best = null;
      for (const j of P.adj || []) { const Q = A.S.prov[j]; if (Q && Q.owner === pc.realm && (Q.elev || 0) > (P.elev || 0) + 40 && (!best || Q.elev > best.elev)) best = Q; }
      return best;
    }
    return null;
  };
  W.arcOf = (pc, ctx) => (ctx && ctx.arc && AR.ARC[ctx.arc] && AR.ARC[ctx.arc].aw ? AR.state(pc)[ctx.arc] || null : null);

  // ---- the effect keys
  W.farRealm = function (pc) {
    const far = Object.values(A.S.realms || {}).filter(r => r && r.alive && r.id !== pc.realm && A.S.prov.some(P => P.owner === r.id && P.coast));
    return far.length ? A.pick(far) : null;
  };
  W.makeWho = function (pc, v, ctx) {
    const from = v.from === 'other' && ctx && ctx.rid && A.realm(ctx.rid) ? A.realm(ctx.rid) : v.from === 'far' ? W.farRealm(pc) : null;
    const race = from && from.race && GD.RACES[from.race] ? from.race : pc.race;
    const cult = (from && from.cult) || pc.cult, faith = (from && from.faith) || pc.faith;
    const sex = v.sex || (A.chance(0.5) ? 'M' : 'F'), status = v.status || 'peasant';
    const [lo, hi] = v.age || [20, 40];
    const age = Math.max(1, Math.round(A.ri(lo, hi) * ((GD.RACES[race] || {}).adult || 16) / 16));
    const p = A.newPerson({ given: A.givenName(cult, sex), sex, race, realm: pc.realm, cult, faith, born: A.S.year - age, status, home: pc.home });
    const fn = A.familyName({ cult, realm: pc.realm, status, home: pc.home, sex });
    p.sur = fn.sur; p.surMode = fn.mode;
    p.occ = v.occ || (A.isAdult(p) ? A.occPick(status, sex) : 'a child of ' + A.provName(pc.home));
    A.link(pc, p, v.type || 'friend', v.op != null ? v.op : 30, v.back || v.type || 'friend');
    return p;
  };
  W.move = function (pc, v) {
    const o = v && typeof v === 'object' ? v : { to: v };
    const Q = W.moveTo(pc, o.to); if (!Q) return '';
    pc.home = Q.id;
    let s = `(You live in ${Q.name} now.)`;
    if (o.free && pc.flags.unfree) {
      delete pc.flags.unfree;
      if (pc.status === 'serf' || pc.status === 'slave') pc.status = 'peasant';
      if (A.ach) A.ach('freed');
      s += ' (A year and a day in the city: you are free.)';
    }
    return s;
  };
  W.provFx = function (pc, v) {
    const P = A.prov(pc.home); if (!P || !v) return '';
    const bits = [];
    if (v.pop) {
      const n = Math.round(P.pop * Math.min(0.5, Math.abs(v.pop)));
      P.pop = Math.max(500, P.pop + (v.pop < 0 ? -n : n));
      if (P.town) P.town = Math.max(0, Math.round(P.town * (1 + Math.max(-0.5, v.pop))));
      if (A.updateRealmPops) A.updateRealmPops();
      bits.push(`(${P.name}: ${A.fmt ? A.fmt(n) : n} ${v.pop < 0 ? 'fewer' : 'more'} people.)`);
    }
    if (v.dev) { P.dev = A.clamp((P.dev || 0) + v.dev, 0, 9); bits.push(`(${P.name}: development ${P.dev}.)`); }
    if (v.fort) { P.fort = A.clamp((P.fort || 0) + v.fort, 0, 5); bits.push(`(${P.name}: walls ${P.fort}.)`); }
    return bits.join(' ');
  };

  const apply = A.applyFx;
  A.applyFx = function (pc, fx, ctx) {
    if (!fx || typeof fx !== 'object' || !pc || pc.id !== A.S.pc) return apply.apply(this, arguments);
    const out = [];
    let a = null, before = null;
    try {
      a = W.arcOf(pc, ctx); before = a ? a.stage : null;
      if (fx.awWho) {
        const p = W.makeWho(pc, fx.awWho, ctx || {});
        if (ctx) ctx.pid = p.id;            // so them / sworn in the same choice reach the new person
        if (a) a.who = p.id;
        out.push(`(${p.given} ${fx.awWho.line || 'is part of your life now'}.)`);
      }
      if (fx.awMove) { const s = W.move(pc, fx.awMove); if (s) out.push(s); }
      if (fx.awProv) { const s = W.provFx(pc, fx.awProv); if (s) out.push(s); }
      if (a && ctx) for (const k of W.KEEP) if (ctx[k] != null && a[k] == null) a[k] = ctx[k];
    } catch (e) { console.error('arcs-world fx', e); }
    const r = apply.apply(this, arguments);
    try {
      // a stage moved on: its own gap, where the arc gives one
      const D = a && AR.ARC[ctx.arc];
      if (a && D.gaps && !a.done && a.stage > before && a.next != null) {
        const g = D.gaps[a.stage - 1] || D.gap || AR.GAP;
        a.next = A.S.year + A.ri(g[0], g[1]);
      }
    } catch (e) { console.error('arcs-world gap', e); }
    return [r, ...out].filter(Boolean).join(' ');
  };

  // ---- who can meet which arc
  const free = (pc, C) => C.adult(pc) && !C.ruler(pc) && !C.prison(pc) && !C.soldier(pc);
  const month = () => A.monthOf(A.today()).m;
  const def = (k, d) => AR.story(k, Object.assign({ aw: true }, d));
  const ids = (k, n) => Array.from({ length: n }, (_, i) => `${k}_${i + 1}`);

  def('aw_plague', { title: 'The plague year', stages: ids('aw_plague', 5), w: 1.5, lasting: 'bond',
    gap: [0, 3], gaps: [[0, 0], [0, 1], [1, 1], [1, 3]],
    start: (pc, C) => free(pc, C) });
  def('aw_famine', { title: 'The hungry year', stages: ids('aw_famine', 4), w: 3, lasting: 'law',
    gap: [0, 5], gaps: [[1, 1], [0, 0], [2, 5]],
    // where 45-economy rolls the harvest, only after a poor or failed one in your realm; without it, country folk
    start: (pc, C) => free(pc, C) && (A.ECON ? W.badHarvest(pc) : !C.town(pc)) });
  def('aw_flood', { title: 'The river rises', stages: ids('aw_flood', 3), w: 1, lasting: 'province',
    gap: [0, 4], gaps: [[0, 1], [2, 4]],
    start: (pc, C) => free(pc, C) && !C.terr(pc, 'desert', 'mountains', 'tundra') });
  def('aw_fire', { title: 'The fire', stages: ids('aw_fire', 4), w: 1.5, lasting: 'home',
    gap: [0, 4], gaps: [[0, 0], [0, 1], [2, 4]],
    start: (pc, C) => free(pc, C) && (W.prov(pc) || {}).town >= 3000 });
  def('aw_refugees', { title: 'The road from the war', stages: ids('aw_ref', 4), w: 2, lasting: 'bond',
    gap: [0, 4], gaps: [[0, 1], [1, 2], [2, 4]],
    start: (pc, C) => free(pc, C) && W.warNeighbours(pc).length > 0 });
  def('aw_bandit', { title: 'The Hawk', stages: ids('aw_bandit', 5), w: 1, lasting: 'name',
    gap: [0, 3], gaps: [[0, 1], [1, 2], [0, 1], [1, 3]],
    start: (pc, C) => free(pc, C) && !C.town(pc) });
  def('aw_siege', { title: 'The siege', stages: ids('aw_siege', 5), w: 2.5, lasting: 'province',
    gap: [0, 3], gaps: [[0, 1], [1, 1], [0, 1], [1, 3]],
    start: (pc, C) => free(pc, C) && C.atWar(pc) && (W.prov(pc) || {}).owner === pc.realm && !!W.enemyOf(pc) });
  def('aw_winter', { title: 'The long winter', stages: ids('aw_winter', 4), w: 3, lasting: 'bond',
    gap: [0, 5], gaps: [[0, 0], [0, 0], [2, 5]],
    // it begins with the first snow: October to December
    start: (pc, C) => free(pc, C) && !C.noble(pc) && !C.terr(pc, 'desert') && month() >= 9 });
  def('aw_wolves', { title: 'The wolf years', stages: ids('aw_wolf', 4), w: 1, lasting: 'name',
    gap: [0, 3], gaps: [[0, 1], [1, 1], [1, 3]],
    start: (pc, C) => free(pc, C) && !C.town(pc) && C.terr(pc, 'forest', 'hills', 'mountains', 'tundra', 'steppe') });
  def('aw_mine', { title: 'The fall at the pit', stages: ids('aw_mine', 3), w: 1, lasting: 'law',
    gap: [1, 3], gaps: [[1, 3], [1, 1]],
    start: (pc, C) => free(pc, C) && !C.noble(pc) && (C.job(pc, 'miner') || C.terr(pc, 'mountains', 'hills')) });
  def('aw_wreck', { title: 'The wreck', stages: ids('aw_wreck', 4), w: 1.5, lasting: 'bond',
    gap: [0, 5], gaps: [[0, 0], [0, 1], [2, 5]],
    start: (pc, C) => free(pc, C) && C.coast(pc) });
  def('aw_pilgrim', { title: 'The pilgrimage', stages: ids('aw_pil', 4), w: 1, lasting: 'name',
    gap: [0, 2], gaps: [[1, 1], [0, 0], [1, 2]],
    start: (pc, C) => free(pc, C) && (pc.piety >= 20 || C.age(pc) >= 40) && !!W.shrine(pc) });
  def('aw_heresy', { title: 'The heresy', stages: ids('aw_her', 6), w: 1, lasting: 'law',
    gap: [0, 4], gaps: [[0, 1], [1, 2], [0, 1], [2, 4], [1, 3]],
    start: (pc, C) => free(pc, C) && !C.job(pc, 'clergy') });
})();
