// 997-wilds: "Explore the wilds" reads the land you are in (design review cycle 1, #5).
//
// Each province has zero to two wild places, the same in every game (seeded by the province's id, never by A.rand):
// chosen from what the province is (its terrain and coast), what lives there (76-beast-habitats and 992-far-beasts,
// A.beastsNear, with what folk say of it from 26-belief-truth), and, on the Great Continent, the atlas around it
// (99-far-lands' D.atlas: the rivers, ranges, passes and lakes near the province, and its region's name). The old wars
// of the lore give a few lowland provinces an old battlefield.
// Exploring takes you to the first place in your home province (then the provinces next to it) that you have not
// found. Each kind of place has its own scene (wilds.events.js), its own checks and its own results. Once every place
// within a day's walk is found, exploring falls back to the release's five scenes, as before.
// Engine: the activity (a wrap of A.ACT.explore) and the choice (a wrap of A.eventChoose, which records the place in
// pc.sites[key] = year, writes a line in the story log and, for a lair, what you learn of the beast). pc.sites is
// optional: an old save without it has found nothing. Rendering only reads.
(function () {
  const W = A.WILDS = A.WILDS || {};
  const hash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const pickH = (arr, key) => arr[hash(key) % arr.length];
  const the = s => String(s || '').replace(/^The /, 'the ');
  const D = () => (A.FAR && A.FAR.active && A.FAR.D) || null;

  // ---- the atlas near a province (Great Continent) -------------------------------------------------------------------
  const d2seg = (x, y, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy; let t = L ? ((x - a[0]) * dx + (y - a[1]) * dy) / L : 0; t = Math.max(0, Math.min(1, t)); const px = a[0] + t * dx - x, py = a[1] + t * dy - y; return Math.sqrt(px * px + py * py); };
  const dLine = (P, pts) => { let best = Infinity; for (let i = 1; i < pts.length; i++) best = Math.min(best, d2seg(P.x, P.y, pts[i - 1], pts[i])); return best; };
  const dPt = (P, x, y) => Math.hypot(P.x - x, P.y - y);
  const atlasCache = new Map();
  W.atlasNear = function (P) {
    const d = D(); if (!d || !d.atlas || !P || P.x == null) return null;
    if (atlasCache.has(P.id)) return atlasCache.get(P.id);
    const at = d.atlas, near = {};
    const best = (list, dist, max) => { let b = null, bd = max; for (const it of list || []) { const v = dist(it); if (v < bd) { bd = v; b = it; } } return b; };
    const r = best(at.rivers, it => dLine(P, it[1]), 220); if (r) near.river = r[0];
    const g = best(at.ranges, it => dLine(P, it[1]), 380); if (g) near.range = g[0];
    const ps = best(at.passes, it => dPt(P, it[1], it[2]), 420); if (ps) near.pass = ps[0];
    const lk = best(at.lakes, it => dPt(P, it[1], it[2]) - Math.sqrt(it[3] || 0) * 0.6, 260); if (lk) near.lake = lk[0];
    if (P.region && at.regions && at.regions[P.region]) near.region = at.regions[P.region];
    atlasCache.set(P.id, near);
    return near;
  };

  // ---- what a province's wild places can be ----------------------------------------------------------------------------
  // fit(P, near, pc): may this province hold it; name(P, near, key): what the place is called in the scene
  const T = (...ts) => P => ts.includes(P.terr);
  W.KINDS = {
    barrow: { ev: 'wl_barrow', fit: T('hills', 'plains', 'steppe', 'tundra'),
      name: (P, n, k) => pickH(['a long barrow under the turf', 'a ring of grave mounds', 'a barrow with its door-stone fallen in', 'a chieftain\'s mound with a thorn tree on it'], k) },
    tower: { ev: 'wl_tower', fit: P => ['hills', 'mountains', 'plains', 'forest'].includes(P.terr),
      name: (P, n, k) => pickH(['a watchtower with its stair half gone', 'a burned manor that nobody claims', 'the shell of a hill fort', 'a toll house on a road no one uses'], k) },
    grove: { ev: 'wl_grove', fit: T('forest'),
      name: (P, n, k) => pickH(['a grove where the oldest trees stand in a ring', 'a hollow oak big enough to stand in', 'a clearing of moss-grown stones'], k) },
    causeway: { ev: 'wl_causeway', fit: T('marsh'),
      name: (P, n, k) => pickH(['a sunken causeway of black timbers', 'an island of alder in the reeds', 'a drowned chapel with its roof showing'], k) },
    well: { ev: 'wl_well', fit: T('desert', 'steppe'),
      name: (P, n, k) => pickH(['a choked well with a carved lip', 'a cistern cut into the rock', 'a dry riverbed lined with old stones'], k) },
    cairn: { ev: 'wl_cairn', fit: T('tundra', 'mountains'),
      name: (P, n, k) => pickH(['a cairn of stones with names scratched in them', 'a frozen shieling with its door shut', 'a herdsman\'s shrine of antlers'], k) },
    wreck: { ev: 'wl_wreck', fit: P => !!P.coast,
      name: (P, n, k) => pickH(['a wreck above the tide line', 'a sea cave with a ring-bolt in its wall', 'a beacon tower that no one lights'], k) },
    river: { ev: 'wl_river', fit: (P, n) => !!(n && n.river),
      name: (P, n, k) => pickH([`an old ford of ${the(n.river)}`, `a cut bank of ${the(n.river)} where the flood turned up bones`, `a ruined mill on ${the(n.river)}`], k) },
    pass: { ev: 'wl_pass', fit: (P, n) => !!(n && (n.pass || n.range)),
      name: (P, n, k) => (n.pass ? `a shrine below ${the(n.pass)}` : pickH([`a shepherds' path into ${the(n.range)}`, `a cave in the flank of ${the(n.range)}`], k)) },
    lake: { ev: 'wl_lake', fit: (P, n) => !!(n && n.lake),
      name: (P, n) => `a stone landing on ${the(n.lake)}` },
    field: { ev: 'wl_field', fit: (P, n, pc, war) => !!war && ['plains', 'steppe', 'hills'].includes(P.terr),
      name: (P, n, k, war) => `the field of an old battle of the ${war}` },
  };
  W.ORDER = Object.keys(W.KINDS);
  // a war of the lore fought by this province's realm (its name is in the war's line)
  W.warOf = function (P) {
    try {
      const R = LORE.realms[P.orig || P.owner]; if (!R || !Array.isArray(LORE.wars)) return null;
      const keys = [R.short, String(R.name || '').replace(/^(The |Kingdom of |Empire of |Duchy of |League of the |League of )/, '')].filter(s => s && s.length > 3);
      const ws = LORE.wars.filter(w => Array.isArray(w) && keys.some(k => String(w[4] || '').includes(k) || String(w[1] || '').includes(k)));
      return ws.length ? String(pickH(ws, 'wl|war|' + P.id)[1]).replace(/^The /, '') : null;
    } catch (e) { return null; }
  };

  // the places of a province: the same in every game, from its id. pc only adds a lair of what lives near home.
  W.sites = function (P, pc) {
    if (!P) return [];
    const h = hash('wl|' + P.id), n = h % 10 < 2 ? 0 : h % 10 < 7 ? 1 : 2;
    const near = W.atlasNear(P) || {}, war = W.warOf(P);
    const kinds = W.ORDER.filter(k => { try { return W.KINDS[k].fit(P, near, pc, war); } catch (e) { return false; } });
    const out = [];
    // the atlas's places first (a named river or pass is the land at its most itself), then by the province's hash
    const named = kinds.filter(k => ['river', 'pass', 'lake'].includes(k)), rest = kinds.filter(k => !named.includes(k));
    const order = named.sort((a, b) => hash(P.id + a) - hash(P.id + b)).concat(rest.sort((a, b) => hash(P.id + a) - hash(P.id + b)));
    for (const k of order.slice(0, n)) {
      const key = P.id + ':' + k;
      out.push({ key, kind: k, prov: P.id, place: W.KINDS[k].name(P, near, key, war), war, near });
    }
    // a lair, where a beast lives near home (one in three provinces with one)
    if (pc && pc.home === P.id && A.beastsNear && hash('wl|lair|' + P.id) % 3 === 0) {
      let ids = [];
      try { ids = (A.beastsNear(pc) || []).filter(id => LORE.creatures.some(c => c.id === id)); } catch (e) { ids = []; }
      if (ids.length) {
        const id = ids[hash('wl|beast|' + P.id) % ids.length], c = LORE.creatures.find(x => x.id === id);
        out.push({ key: P.id + ':lair', kind: 'lair', prov: P.id, place: `the lair of ${/^the /i.test(c.name) ? the(c.name) : 'a ' + c.name.toLowerCase()}`, beast: id, near });
      }
    }
    return out;
  };
  W.found = (pc, key) => !!(pc && pc.sites && typeof pc.sites === 'object' && pc.sites[key] != null);
  // the next place to find: home first, then the provinces next to it, in their order
  W.next = function (pc) {
    const home = A.prov(pc.home); if (!home) return null;
    const provs = [home].concat((home.adj || []).map(id => A.prov(id)).filter(Boolean));
    for (const P of provs) for (const s of W.sites(P, pc)) if (!W.found(pc, s.key)) return Object.assign(s, { away: P.id !== home.id });
    return null;
  };

  // short lines from the lore for the scene's tokens
  const clip = (t, n) => { t = String(t || '').replace(/\s+/g, ' ').trim().replace(/[{}<>"]/g, ''); if (t.length <= n) return t.replace(/[.;,]$/, ''); const c = t.slice(0, n); return c.slice(0, Math.max(c.lastIndexOf(', '), c.lastIndexOf('; '), c.lastIndexOf(' '))).replace(/[.;,]$/, ''); };
  W.ctxOf = function (pc, s) {
    const P = A.prov(s.prov), ctx = { wlSite: s.key, wlKind: s.kind, place: s.place, land: P ? P.name : 'the country', lfFixed: 1 };
    ctx.where = s.away ? `a day's walk out, in ${ctx.land}` : `out past the last fields of ${ctx.land}`;
    if (s.near && s.near.region) ctx.where += `, in ${the(s.near.region)}`;
    if (s.war) ctx.war = s.war;
    if (s.beast) {
      const c = LORE.creatures.find(x => x.id === s.beast);
      ctx.beast = s.beast; ctx.beastName = c ? c.name.replace(/^The /, '') : 'beast';
      ctx.belief = c ? clip(c.belief, 110) : 'that it is bad luck to see it';
      ctx.lfFixed = 1;
    }
    return ctx;
  };

  // a scene shown without a place (a tool rendering it, an old queue): the tokens of a place of that kind near home,
  // read from the land, so it reads whole; such a scene records nothing (no ctx.wlSite)
  W.fill = function (pc, ctx, kind) {
    if (!ctx || ctx.wlSite || ctx.place) return;
    const P = pc && A.prov(pc.home); if (!P) { ctx.skip = true; return; }
    const near = Object.assign({ river: 'the river', range: 'the hills', lake: 'the lake' }, W.atlasNear(P) || {});
    if (kind === 'lair') {
      let id = null;
      try { id = (A.beastsNear(pc) || [])[0]; } catch (e) {}
      const c = LORE.creatures.find(x => x.id === id) || LORE.creatures.find(x => /wolf/i.test(x.name)) || LORE.creatures[0];
      Object.assign(ctx, W.ctxOf(pc, { key: '', kind, prov: P.id, place: `the lair of a ${c.name.replace(/^The /, '').toLowerCase()}`, beast: c.id, near }));
    } else {
      const K = W.KINDS[kind]; if (!K) { ctx.skip = true; return; }
      const war = W.warOf(P) || String((LORE.wars[0] || [])[1] || 'Famine Wars');
      Object.assign(ctx, W.ctxOf(pc, { key: '', kind, prov: P.id, place: K.name(P, near, P.id + ':' + kind, war), war, near }));
    }
    delete ctx.wlSite;
  };

  // ---- the activity ------------------------------------------------------------------------------------------------------
  const ex = A.ACT && A.ACT.explore;
  if (typeof ex === 'function') {
    A.ACT.explore = function (pc) {
      if (W.OFF || !pc) return ex.apply(this, arguments);
      const s = W.next(pc);
      if (!s || !A.EV[(W.KINDS[s.kind] || { ev: 'wl_lair' }).ev]) return ex.apply(this, arguments);
      A.queue({ type: 'event', ev: s.kind === 'lair' ? 'wl_lair' : W.KINDS[s.kind].ev, ctx: W.ctxOf(pc, s) });
      return { msg: s.away ? `You walk out a day into ${A.prov(s.prov).name}.` : 'You leave the roads behind.' };
    };
    for (const k of ['bt']) if (ex[k]) A.ACT.explore[k] = ex[k];
  }

  // ---- the choice: the place is found ----------------------------------------------------------------------------------------
  W.LINE = { barrow: 'a barrow', tower: 'a ruin', grove: 'a grove', causeway: 'a causeway in the marsh', well: 'an old well', cairn: 'a cairn',
    wreck: 'a place on the shore', river: 'a place on the river', pass: 'a way into the hills', lake: 'a landing on the lake', field: 'an old battlefield', lair: 'a lair' };
  const choose = A.eventChoose;
  A.eventChoose = function (idx) {
    const q = A.S.queue[0], pc = A.pc();
    const site = q && q.type === 'event' && !q.result && q.ctx && q.ctx.wlSite && /^wl_/.test(q.ev) ? q.ctx : null;
    let orig = -1;
    if (site) { try { const v = A.eventView(q), vc = v && v.choices[idx]; orig = vc ? vc.i : -1; } catch (e) {} }
    const r = choose.apply(this, arguments);
    try {
      if (site && pc && pc.alive && q.result && orig >= 0) {
        pc.sites = pc.sites && typeof pc.sites === 'object' ? pc.sites : {};
        if (pc.sites[site.wlSite] == null) {
          pc.sites[site.wlSite] = A.S.year;
          const n = Object.keys(pc.sites).length;
          A.log(`You mark ${W.LINE[site.wlKind] || 'a place'} in ${site.land} on the map you keep in your head: ${n === 1 ? 'the first of the wild places you know' : n + ' wild places now'}.`, 'lore');
        }
        // a lair teaches what the beast is: watching it, you have seen it; asking about it, you have heard of it
        if (site.beast && A.BT && A.BT.learn) A.BT.learn(pc, site.beast, orig === 0 ? 2 : 1, 'Around the fire, the people of the place tell of');
      }
    } catch (e) { console.error('wilds', e); }
    return r;
  };
  if (choose.variety) A.eventChoose.variety = true;
  W.count = pc => (pc && pc.sites && typeof pc.sites === 'object' ? Object.keys(pc.sites).length : 0);
})();
