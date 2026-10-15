// Story arcs about objects, places and mysteries (Road to Ten, Events 3 and 4). The plan asks for "60 long arcs of 3 to
// 8 stages over 2 to 20 years: a blood feud, a secret child, a rival's rise, a famous sword's history ..." and that each
// ends with "a lasting change: a title, a bond, a wound, a law, or a province on the map". This folder writes thirteen of
// them, about things: a sword with a name, an old map, a ruin, a relic, a mill, a horse, a portrait, a ship, a song, a
// hoard, a forbidden book, a bell and a bridge. Nothing in them is magic. The cursed mill has a steward behind it, the
// relic has a forger, the face in the portrait has a grandmother.
//
// The engine is 46-life-arcs (A.ARCS.story): one story arc runs at a time, each stage is a trigger-only scene in
// arcs.events.js whose every choice moves the arc on (fx.arc) and leaves a mark the later scenes read.
// This file registers the arcs and adds what the scenes share:
//   A.AO.who(p, ctx, o)     the arc's person, made once and kept on the arc, so later stages meet the same one
//   A.AO.word(p, ctx, k, f) a word the arc keeps (a name, a house, a subject), made once
//   fx.aoQual {slot: q}     sets the quality of gear just given (fx.gear sets only the item)
//   fx.aoAsset {k, name}    property with its own name ("The mill below Amberwick"), priced and paid as GD.PROPERTY[k]
//   fx.aoKill 'cause'       the arc's person dies (a horse thief hanged)
//   fx.aoEpithet 1          the epithet the arc chose for you (the song's), if you have none
// Everything random is drawn in a stage's setup or its effects (engine side). Rendering only reads.
(function () {
  const AR = A.ARCS;
  if (!AR || !AR.story) return;   // the story track lives in 46-life-arcs
  const free = (p, C) => C.adult(p) && !C.ruler(p);

  // ---- the arcs: key, title, stages, who can meet it, pacing, and what its ending leaves
  const ARCS = {
    ao_sword: { title: 'Kestrel', n: 6, gap: [2, 4], lasting: 'name', w: 1.5, start: free },
    ao_map: { title: 'The old map', n: 4, gap: [1, 3], lasting: 'home', start: free },
    ao_ruin: { title: 'The burnt tower', n: 4, gap: [1, 3], lasting: 'home', start: free },
    ao_relic: { title: 'The finger in the silver box', n: 5, gap: [1, 3], lasting: 'law', start: (p, C) => C.adult(p) },
    ao_mill: { title: 'The cursed mill', n: 5, gap: [1, 2], lasting: 'trait', start: free },
    ao_horse: { title: 'The stolen horse', n: 4, gap: [1, 2], lasting: 'bond', start: (p, C) => free(p, C) && !C.race(p, 'giant') },
    ao_portrait: { title: 'The face in the gallery', n: 4, gap: [2, 5], lasting: 'bond',
      start: (p, C) => free(p, C) && A.realmHouses(p.realm).some(h => h.id !== p.house) },
    ao_ship: { title: 'The Patience', n: 5, gap: [1, 3], lasting: 'wealth',
      start: (p, C) => free(p, C) && (C.coast(p) || C.rich(p) || C.job(p, 'merchant') || C.job(p, 'sailor')) },
    ao_song: { title: 'A song about you', n: 3, gap: [1, 2], lasting: 'name', start: (p, C) => C.adult(p) },
    ao_hoard: { title: 'The pot of old silver', n: 4, gap: [1, 2], lasting: 'wealth', start: free },
    ao_book: { title: 'The book in the common tongue', n: 4, gap: [1, 3], lasting: 'trait', start: free },
    ao_bell: { title: 'The bell of your parish', n: 4, gap: [1, 2], lasting: 'name', start: free },
    ao_bridge: { title: 'The bridge', n: 5, gap: [2, 4], lasting: 'law', start: free },
  };
  for (const [k, d] of Object.entries(ARCS)) {
    AR.story(k, { title: d.title, stages: Array.from({ length: d.n }, (_, i) => `${k}_${i + 1}`), start: d.start, w: d.w || 1, gap: d.gap, lasting: d.lasting, by: 'arcs-things' });
  }

  // ---- what the scenes share
  const AO = A.AO = {
    // the state of the arc this scene belongs to (none when a scene is shown outside its arc, as the linter does)
    arc: (p, ctx) => (ctx && ctx.arc && p && p.arcs && p.arcs[ctx.arc]) || null,
    // the arc's person: made the first time a stage asks, then the same one each stage. A stage whose person has died
    // drops (ctx.skip) and the arc is given up, as the engine does with any stage that no longer fits
    who(p, ctx, o) {
      o = o || {};
      const a = AO.arc(p, ctx), key = o.key || 'pid';
      let t = a && a[key] ? A.P(a[key]) : null;
      if (a && a[key] && (!t || !t.alive)) { ctx.skip = 1; return null; }
      if (!t) {
        t = A.makeAcquaintance(p, 'acquaint');
        if (o.status) t.status = o.status;
        if (o.sur) t.sur = o.sur;
        if (o.occ) t.occ = o.occ;
        A.link(p, t, 'acquaint', 0, 'acquaint');
        if (a) a[key] = t.id;
      }
      if (!o.quiet) ctx.pid = t.id;
      return t;
    },
    // a word the arc keeps: the same name in every stage
    word(p, ctx, k, make) {
      const a = AO.arc(p, ctx);
      let v = a && a.w && a.w[k] != null ? a.w[k] : null;
      if (v == null) { v = make(); if (a) (a.w = a.w || {})[k] = v; }
      ctx[k] = v;
      return v;
    },
    // the marks this arc has left, in order
    marks: (p, k) => (p && p.arcs && p.arcs[k] && Array.isArray(p.arcs[k].m) ? p.arcs[k].m : []),
  };

  // ---- effects
  (A.FX_EXTRA = A.FX_EXTRA || []).push('aoQual', 'aoAsset', 'aoKill', 'aoEpithet');
  const apply = A.applyFx;
  A.applyFx = function (pc, fx, ctx) {
    const r = apply.apply(this, arguments);
    if (!fx || typeof fx !== 'object' || !pc) return r;
    const out = [];
    try {
      if (fx.aoQual && typeof fx.aoQual === 'object') {
        pc.gearQ = pc.gearQ || {};
        for (const s in fx.aoQual) if (GD.QUAL[fx.aoQual[s]]) pc.gearQ[s] = fx.aoQual[s];
      }
      if (fx.aoAsset && GD.PROPERTY[fx.aoAsset.k]) {
        const name = A.T(String(fx.aoAsset.name || GD.PROPERTY[fx.aoAsset.k].name), ctx || {});
        pc.assets.push({ k: fx.aoAsset.k, name, where: A.provName(pc.home), y: A.S.year });
        out.push(`(${name} is yours.)`);
      }
      if (fx.aoKill && ctx && ctx.pid) { const t = A.P(ctx.pid); if (t && t.alive && t.id !== pc.id) A.kill(t, String(fx.aoKill)); }
      if (fx.aoEpithet && !pc.epithet) {
        const a = AO.arc(pc, ctx), ep = a && a.w && a.w.ep;
        if (ep) { pc.epithet = String(ep); out.push(`They call you ${pc.epithet} now.`); A.ach && A.ach('epithet'); }
      }
    } catch (e) { console.error('arcs-things fx', e); }
    return [r, ...out].filter(x => typeof x === 'string' && x).join(' ');
  };
})();
