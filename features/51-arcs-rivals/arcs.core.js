// Rivals and ambition (Road to Ten, Events 3 and 4): thirteen story arcs of three to six scenes over two to twenty
// years, each ending with a lasting change. They run on the story track of 46-life-arcs (A.ARCS.story); the scenes are
// in arcs.events.js.
//
// What this file adds to the story track:
//   the people in a story   A.ARV.cast(p, ctx, role, opts) gives a scene its person ({them}, {khe}, {khim}, {khis}, {khers}):
//                           the one this arc already has, else an existing relation of the kinds asked for (your real
//                           rival, your real friend, your nephew), else a new one made for the part. The arc keeps the
//                           id, so the rival of the first scene is the rival of the last. If that person has died or
//                           gone, the scene is dropped (ctx.skip) and the engine gives the arc up.
//   what a story remembers  A.ARV.memo(p, ctx, key, fn) keeps a word the scenes share (the seat, the secret, the house)
//                           on the arc, so a scene ten years on names the same thing.
//   keeping them in mind    while an arc runs, its people are "seen" each month, so the release's forgetting
//                           (acquaintances dropped after three idle years) does not lose the rival halfway through.
//   three effect keys       arDeed (a deed for the life story, with tokens), arEpithet (an epithet with tokens),
//                           arLose (the house, farm or workshop the story was about is gone; without one, a fifth of
//                           your coin).
// Engine side only: casting happens in a scene's setup, which the engine runs once when the scene comes to the head of
// the queue; nothing here runs while drawing.
(function () {
  const AR = A.ARCS;
  const R = A.ARV = {};
  R.KEYS = [];   // this feature's story arcs, in order

  // the arc state of the scene being shown (null when a scene is shown on its own, as the linter shows it)
  R.arc = (p, ctx) => (AR && ctx && ctx.arc && p ? AR.state(p)[ctx.arc] || null : null);
  R.mem = (p, ctx) => { const a = R.arc(p, ctx); return a ? (a.ar = a.ar && typeof a.ar === 'object' ? a.ar : {}) : null; };
  R.bind = (ctx, t) => { ctx.pid = t.id; ctx.khe = A.he(t); ctx.khim = A.him(t); ctx.khis = A.his(t); ctx.khers = t.sex === 'F' ? 'hers' : 'his'; return t; };
  const usable = (p, t) => !!t && t.alive && t.id !== p.id && !t.ruler && A.age(t) >= 12;
  // ages are given in human years and scaled to the person's race
  R.older = (p, lo, hi) => { const a = Math.round(A.C.ageAdj(p)); return [a + lo, a + hi]; };
  R.make = function (p, o) {
    const t = A.makeAcquaintance(p, o.type || 'acquaint');
    const k = GD.RACES[t.race].adult / 16;
    if (o.age) t.born = A.S.year - Math.max(1, Math.round(A.ri(o.age[0], o.age[1]) * k));
    const st = o.status === 'same' ? p.status : o.status;
    if (st && st !== t.status && A.OCC[st]) {
      t.status = st; t.occ = A.occPick(st, t.sex);
      const fn = A.familyName({ cult: t.cult, realm: t.realm, status: st, home: t.home, sex: t.sex });
      t.sur = fn.sur; t.surMode = fn.mode;
    }
    if (o.sur) t.sur = o.sur;
    if (o.occ) t.occ = o.occ;
    if (o.coin) t.coin = Math.max(t.coin || 0, o.coin);
    A.link(p, t, o.type || 'acquaint', o.op || 0, o.back || o.type || 'acquaint');
    return t;
  };
  // opts: prefer (relation types to look for first), best ('low' takes the one you like least), pick(p) (a person to
  // use), not(t) (people to pass over), make (how to make one: type, op, back, age, status, sur, occ, coin)
  R.cast = function (p, ctx, role, o = {}) {
    const m = R.mem(p, ctx), had = m && m.who && m.who[role];
    if (had) {
      const t = A.P(had);
      if (usable(p, t)) { if (m.old && m.old[role]) ctx.old = 1; return R.bind(ctx, t); }
      ctx.skip = 1; return null;
    }
    let t = null, old = false;
    if (o.pick) { const x = o.pick(p); if (usable(p, x)) { t = x; old = true; } }
    if (!t && o.prefer) {
      const L = A.relsOf(p, o.prefer).filter(x => usable(p, x.p) && !(o.not && o.not(x.p)));
      if (L.length) { L.sort((x, y) => (o.best === 'low' ? x.r.op - y.r.op : y.r.op - x.r.op) || (x.p.id < y.p.id ? -1 : 1)); t = L[0].p; old = true; }
    }
    if (!t && o.make) t = R.make(p, typeof o.make === 'function' ? o.make(p) : o.make);
    if (!t) { ctx.skip = 1; return null; }
    if (!p.rel[t.id]) A.link(p, t, 'acquaint', 0, 'acquaint');
    if (old) ctx.old = 1;
    if (m) { m.who = m.who || {}; m.who[role] = t.id; if (old) (m.old = m.old || {})[role] = 1; }
    return R.bind(ctx, t);
  };
  // a word the scenes share: worked out once, kept on the arc
  R.memo = function (p, ctx, key, fn) {
    const m = R.mem(p, ctx);
    let v = m && m[key] != null ? m[key] : null;
    if (v == null) { v = fn(); if (m && v != null) m[key] = v; }
    if (v != null) ctx[key] = v;
    return v;
  };
  // years since the arc began (a scene shown on its own says ten)
  R.years = (p, ctx) => { const a = R.arc(p, ctx); return a && a.y != null ? Math.max(1, A.S.year - a.y) : 10; };

  // which world a life moves in, for the words a scene uses
  R.lane = p => (p.mil && !p.mil.merc ? 'army'
    : p.noble || ['noble', 'gentry', 'royal'].includes(p.status) ? 'court'
    : p.job ? (['merchant', 'sailor', 'pirate'].includes(p.job.c) ? 'trade' : 'craft')
    : p.status === 'merchant' ? 'trade' : 'land');
  // the property a story can be about: the first holding of these kinds
  R.HOLD = ['manor', 'farm', 'inn', 'workshop', 'townhouse', 'cottage', 'hovel', 'castle', 'barge'];
  R.holding = (p, kinds = R.HOLD) => { for (const k of kinds) { const a = (p.assets || []).find(x => x.k === k); if (a) return a; } return null; };
  R.short = a => String(a.name || a.k).replace(/\s*\(.*\)\s*/, '').replace(/ with .*$/, '').replace(/ and .*$/, '').toLowerCase();
  // a craft secret worth stealing, by career: what it is, what they would call you for it, and its short name
  R.SECRET = {
    smith: ['a temper for steel that keeps its edge through a winter', 'True-Edge', 'the temper'],
    brewer: ['a brown ale with bog-myrtle in it that keeps a month without souring', 'Myrtle-Ale', 'the myrtle ale'],
    weaver: ['a blue dye that does not run in the wash', 'Fast-Blue', 'the fast blue'],
    cook: ['a raised pie that keeps a week on the road', 'Pie-Crust', 'the road pie'],
    healer: ['a salve that closes a burn without fever', 'Burn-Salve', 'the burn salve'],
    bowyer: ['a glue of horn and sinew that holds in the wet', 'Wet-Bow', 'the wet glue'],
    carpenter: ['a joint that holds a roof without a nail', 'No-Nail', 'the nailless joint'],
    mason: ['a mortar that sets under water', 'Water-Stone', 'the water mortar'],
    artist: ['a red that does not darken with the years', 'True-Red', 'the red'],
    engineer: ['a hoist that lifts with half the men', 'Half-Hands', 'the hoist'],
    herd: ['a hard cheese that travels a month', 'Cheese-Wright', 'the travelling cheese'],
    fish: ['a brine that keeps herring through a summer', 'Brine-Wise', 'the brine'],
    merchant: ['a dyer in the hills who sells to no one else', 'Hill-Road', 'the dyer in the hills'],
    scribe: ['an ink that does not fade in the sun', 'Black-Ink', 'the black ink'],
    horsemaster: ['a drench that cures a horse of colic', 'Colic-Cure', 'the colic drench'],
    miner: ['a way of reading the rock for silver', 'Silver-Eye', 'the way of reading rock'],
    farm: ['a way of drying grain that keeps out the rot', 'Dry-Barn', 'the dry barn'],
  };

  // the arc's people stay in mind while it runs
  A.onMonth.push(function (pc) {
    try {
      if (!pc || !pc.alive || !AR) return;
      const st = AR.state(pc);
      for (const k in st) {
        const a = st[k];
        if (!a || a.done || !a.ar || !a.ar.who) continue;
        for (const id of Object.values(a.ar.who)) if (pc.rel && pc.rel[id]) pc.rel[id].seen = A.S.year;
      }
    } catch (e) { console.error('arcs-rivals month', e); }
  });

  // the house, farm or workshop a story was about is gone
  R.lose = function (pc, ctx) {
    const m = R.mem(pc, ctx), k = m && m.stake;
    const i = k ? (pc.assets || []).findIndex(x => x.k === k) : -1;
    if (i >= 0) { const n = R.short(pc.assets[i]); pc.assets.splice(i, 1); return `(The ${n} is no longer yours.)`; }
    const loss = Math.round(pc.coin * 0.2);
    pc.coin -= loss;
    return loss > 0 ? `(It costs you ${A.coin(loss)}.)` : '';
  };
  (A.FX_EXTRA = A.FX_EXTRA || []).push('arDeed', 'arEpithet', 'arLose');
  const apply = A.applyFx;
  A.applyFx = function (pc, fx, ctx) {
    const r = apply.apply(this, arguments);
    if (!fx || typeof fx !== 'object' || !pc || !(fx.arDeed || fx.arEpithet || fx.arLose)) return r;
    const out = [];
    try {
      const tok = A.ctxTokens(pc, ctx || {});
      if (fx.arDeed) pc.deeds.push({ y: A.S.year, t: A.T(String(fx.arDeed), tok) });
      if (fx.arEpithet && !pc.epithet) { pc.epithet = A.T(String(fx.arEpithet), tok); out.push(`They call you ${pc.epithet} now.`); A.ach('epithet'); }
      if (fx.arLose) out.push(R.lose(pc, ctx));
    } catch (e) { console.error('arcs-rivals fx', e); }
    return [r, ...out].filter(Boolean).join(' ');
  };

  // ---- the thirteen arcs
  if (!AR || !AR.story) return;   // built without 46-life-arcs: the scenes exist but nothing starts them
  const story = (k, def) => { R.KEYS.push(k); return AR.story(k, def); };
  const N = (k, n) => Array.from({ length: n }, (_, i) => `${k}_${i + 1}`);
  const free = (p, C) => C.adult(p) && !C.ruler(p) && !C.prison(p);
  const SECRET = R.SECRET;

  story('ar_rise', { title: 'The other one', stages: N('ar_rise', 5), gap: [2, 4], lasting: 'bond',
    start: (p, C) => free(p, C) && C.ageAdj(p) >= 20 && C.ageAdj(p) <= 50 });
  story('ar_pupil', { title: 'The apprentice', stages: N('ar_pupil', 5), gap: [2, 4], lasting: 'bond',
    start: (p, C) => free(p, C) && C.ageAdj(p) >= 28 && C.ageAdj(p) <= 62 && C.job(p) && C.jobRank(p, 1) });
  story('ar_patron', { title: 'The patron', stages: N('ar_patron', 4), gap: [2, 4], lasting: 'law',
    start: (p, C) => free(p, C) && !C.unfree(p) && C.ageAdj(p) >= 19 && C.ageAdj(p) <= 45 });
  story('ar_false', { title: 'The false friend', stages: N('ar_false', 4), gap: [1, 3], lasting: 'bond',
    start: (p, C) => free(p, C) && C.ageAdj(p) >= 22 && C.ageAdj(p) <= 65 });
  story('ar_elec', { title: 'The election', stages: N('ar_elec', 4), gap: [1, 2], lasting: 'title',
    start: (p, C) => free(p, C) && !C.unfree(p) && !C.noble(p) && !C.soldier(p) && C.ageAdj(p) >= 30 && C.ageAdj(p) <= 70 });
  story('ar_hon', { title: 'An affair of honour', stages: N('ar_hon', 4), gap: [1, 2], lasting: 'name',
    start: (p, C) => free(p, C) && C.ageAdj(p) >= 18 && C.ageAdj(p) <= 50
      && (C.noble(p) || C.soldier(p) || p.status === 'gentry' || C.job(p, 'knight') || C.job(p, 'courtier') || C.job(p, 'mercenary') || C.fame(p) >= 30) });
  story('ar_libel', { title: 'The libel', stages: N('ar_libel', 4), gap: [1, 2], lasting: 'name',
    start: (p, C) => free(p, C) && C.ageAdj(p) >= 22 && C.ageAdj(p) <= 70
      && (C.fame(p) >= 15 || C.rich(p) || C.jobRank(p, 1) || C.noble(p) || C.flag(p, 'ar_seat')) });
  story('ar_charter', { title: 'A forged charter', stages: N('ar_charter', 4), gap: [1, 3], lasting: 'home',
    start: (p, C) => free(p, C) && !C.unfree(p) && C.ageAdj(p) >= 25 && C.ageAdj(p) <= 75
      && (!!R.holding(p) || C.famHead(p) || C.ownShop(p)) });
  story('ar_recipe', { title: 'The stolen secret', stages: N('ar_recipe', 4), gap: [1, 3], lasting: 'name',
    start: (p, C) => free(p, C) && C.ageAdj(p) >= 22 && C.ageAdj(p) <= 65 && C.job(p) && !!SECRET[p.job.c] });
  story('ar_bribe', { title: 'The bribe', stages: N('ar_bribe', 3), gap: [3, 6], lasting: 'law',
    start: (p, C) => free(p, C) && C.ageAdj(p) >= 22 && C.ageAdj(p) <= 58 && (C.jobRank(p, 1) || C.soldier(p) || C.office(p) || C.noble(p)) });
  story('ar_ven', { title: 'The vendetta at court', stages: N('ar_ven', 6), gap: [1, 3], lasting: 'bond',
    start: (p, C) => free(p, C) && C.ageAdj(p) >= 22 && C.ageAdj(p) <= 62
      && (C.noble(p) || p.status === 'gentry' || C.job(p, 'courtier') || C.job(p, 'envoy') || C.job(p, 'steward') || C.office(p)) });
  story('ar_usurp', { title: 'The usurper in your house', stages: N('ar_usurp', 4), gap: [1, 3], lasting: 'home',
    start: (p, C) => free(p, C) && !C.unfree(p) && C.ageAdj(p) >= 38 && C.ageAdj(p) <= 75
      && (C.ownShop(p) || C.famHead(p) || C.jobRank(p, 2) || !!R.holding(p, ['manor', 'farm', 'inn', 'workshop', 'barge'])) });
  story('ar_debt', { title: 'The moneylender', stages: N('ar_debt', 5), gap: [1, 2], lasting: 'wealth',
    start: (p, C) => free(p, C) && C.ageAdj(p) >= 20 && C.ageAdj(p) <= 60 && p.coin < 500 });
})();
