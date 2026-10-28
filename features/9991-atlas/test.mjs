// 9991-atlas: what you have seen, heard of and not, the veil the inked map draws from it, the map in the story column,
// the Places page, and an heir's share of the old life's map.
export default {
  async atlasKnows(pg) {
    const r = await pg.evaluate(() => {
      const AT = A.ATLAS;
      A.newGame({ seed: 41, lands: 'great', race: 'human', realm: 'POL-101', status: 'peasant', startAge: 20 });
      const pc = A.pc(), home = pc.home, P = A.prov(home);
      // before the first day: known from the land alone, with nothing written
      const pre = { atlas: pc.atlas === undefined, home: AT.level(pc, home), adj: P.adj.every(id => AT.level(pc, id) === 2), realm: A.S.prov.filter(Q => Q.owner === pc.realm).every(Q => AT.level(pc, Q.id) >= 1) };
      const c0 = AT.counts(pc);
      T.play(2);
      const c1 = AT.counts(pc), srcs = [...new Set(Object.values(pc.atlas.src || {}))];
      // an heir: the parent's seen places are heard of, and a share of what the parent heard of
      let heir = null;
      for (const id of pc.children || []) { const k = A.P(id); if (k && k.alive) heir = k; }
      if (!heir) { const sib = Object.keys(pc.rel).map(A.P).find(p => p && p.alive && p.id !== pc.id); heir = sib; }
      AT.see(pc, A.S.prov.findIndex(Q => Q.owner !== pc.realm && A.wsDist(Q.id, home) > 3000), 'j');
      const far = Object.keys(pc.atlas.s).map(Number).find(id => A.wsDist(id, home) > 3000);
      const heardBefore = heir ? AT.counts(heir).heard : 0;
      const ok = heir && A.continueAs(heir.id);
      const h = A.pc();
      const inh = { ok: !!ok, far: far != null && AT.level(h, far) === 1, heard: AT.counts(h).heard - heardBefore, src: h.atlas && Object.values(h.atlas.src).includes('t') };
      // an old save: no atlas at all
      delete h.atlas; const s = A.serialize(); A.deserialize(JSON.parse(s)); const o = A.pc();
      const old = AT.level(o, o.home) === 2 && AT.counts(o).seen >= 1; T.play(1);
      return { pre, c0, c1, srcs, inh, old, after: AT.ok(A.pc()) };
    });
    const ok = r.pre.atlas && r.pre.home === 2 && r.pre.adj && r.pre.realm && r.c1.seen >= r.c0.seen && r.c1.heard > r.c0.heard && r.inh.ok && r.inh.far && r.inh.heard > 0 && r.inh.src && r.old && r.after;
    return { ok, detail: `at birth ${r.c0.seen} seen, ${r.c0.heard} heard of (written: ${!r.pre.atlas}); two years on ${r.c1.seen} seen, ${r.c1.heard} heard of, from ${r.srcs.join(' ')}; heir: a far place the parent saw is heard of ${r.inh.far}, +${r.inh.heard} heard of; old save loads ${r.old}, atlas made ${r.after}` };
  },

  async atlasVeil(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 41, lands: 'great', race: 'human', realm: 'POL-101', status: 'peasant', startAge: 20 });
      T.play(1);
      const pc = A.pc(), AT = A.ATLAS;
      const px = (cv, id) => { const P = A.prov(id), v = MAP.whole(cv.width, cv.height) || { x0: 0, y0: 0, w: MAP.KW, h: MAP.KH }; const x = Math.floor((P.sx - v.x0) / v.w * cv.width), y = Math.floor((P.sy - v.y0) / v.h * cv.height); return [...cv.getContext('2d').getImageData(x, y, 1, 1).data].slice(0, 3); };
      const unk = A.S.prov.find(P => AT.level(pc, P.id) === 0 && A.wsDist(P.id, pc.home) > 4000 && P.cells > 40);
      const draw = fog => { UI.set.atlasFog = fog; UI.tab = 'world'; UI.render(); const cv = UI.$('#worldmap'); return cv ? { unk: px(cv, unk.id), home: px(cv, pc.home) } : null; };
      const h0 = T.hash(A.S), rng0 = A.rngState;
      const on = draw(true), off = draw(false); UI.set.atlasFog = true;
      // the map in the story column draws, with the road, home and people, and moves nothing
      UI.tab = 'life'; UI.storyView = 'map'; UI.render(); A.ATLAS.paint(); const jr = UI.$('#jrmap');
      const jrOk = !!jr && jr.width > 200;
      UI.storyView = 'story'; UI.render();
      // the Places page
      UI.tab = 'atlas'; UI.render(); const page = (UI.$('#tabbody') || {}).innerText || '';
      const pure = T.hash(A.S) === h0 && A.rngState === rng0;
      const d = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
      return { on, off, jrOk, pure, page: page.slice(0, 160), unnamed: MAP.unnamed(unk, { canvas: { id: 'gmap' } }), named: MAP.unnamed(A.prov(pc.home), { canvas: { id: 'gmap' } }), dUnk: d(on.unk, off.unk), dHome: d(on.home, off.home) };
    });
    const ok = r.on && r.dUnk > 20 && r.dHome < r.dUnk && r.jrOk && r.pure && /Places you know/.test(r.page) && r.unnamed === true && r.named === false;
    return { ok, detail: `unknown land veiled (${r.off && r.off.unk} -> ${r.on && r.on.unk}, change ${r.dUnk}) and home clear (change ${r.dHome}); story-column map ${r.jrOk}; unknown name hidden ${r.unnamed}, home named ${!r.named}; rendering pure ${r.pure}; page "${r.page.replace(/\n/g, ' ').slice(0, 100)}"` };
  },
};
