// The clone harness of docs/plan/world-expansion-architecture.md, appendix A: run in the page before A.newGame,
// __CLONE(K) copies the 306-province world K times, laid out eastward and stitched by 4 land links per copy. Used by
// test.mjs (scaleTiming) and bench.mjs; not part of the build (the build reads only *.core.js and *.events.js).
window.__CLONE = function (K) {               // copy the 306-province world K times, laid out eastward
  const base = LORE.map.provinces.slice(), N = base.length, rids = Object.keys(LORE.realms);
  const sfx = c => 'x' + c, rmap = (id, c) => (id && id !== 'unclaimed' && LORE.realms[id]) ? id + sfx(c) : id;
  for (let c = 1; c < K; c++) {
    for (const p of base) LORE.map.provinces.push(Object.assign({}, p, { id: p.id + c * N, pid: p.pid + sfx(c),
      name: p.name + ' ' + (c + 1), realm: rmap(p.realm, c), x: p.x + c * 7000, sx: p.sx + c * 7000,
      adj: p.adj.map(j => j + c * N), sea: (p.sea || []).map(j => j + c * N) }));
    for (const id of rids) {
      const L = LORE.realms[id], nid = id + sfx(c);
      LORE.realms[nid] = Object.assign({}, L, { id: nid, name: L.name + ' ' + (c + 1), short: L.short + ' ' + (c + 1),
        ruler: null, capital: L.capital + ' ' + (c + 1), allies: L.allies.map(a => rmap(a, c)), rivals: L.rivals.map(a => rmap(a, c)) });
      for (const T of [GD.REALM_CULTURE, GD.REALM_FAITH, GD.REALM_HUMAN_CULTURE, A.AGGRO, GD.DOCTRINE, A.GOV,
        LORE.titlesByRealm, LORE.academies, LORE.rulerHistory]) if (T && T[id] != null) T[nid] = T[id];
    }
    for (const hid of Object.keys(LORE.houses)) { const h = LORE.houses[hid]; if (!/x\d+$/.test(hid) && LORE.realms[h.realm])
      LORE.houses[hid + sfx(c)] = Object.assign({}, h, { id: hid + sfx(c), realm: rmap(h.realm, c), head: null,
        seat: h.seat && h.seat + ' ' + (c + 1), seatId: h.seatId && h.seatId + sfx(c) }); }
    for (const x of LORE.relations.slice(0, 97)) LORE.relations.push(Object.assign({}, x, { a: rmap(x.a, c), b: rmap(x.b, c) }));
  }
  const P = LORE.map.provinces;               // stitch copy c to copy c-1 by 4 land links
  for (let c = 1; c < K; c++) {
    const prev = P.slice((c - 1) * N, c * N).sort((a, b) => b.x - a.x).slice(0, 4), cur = P.slice(c * N, (c + 1) * N).sort((a, b) => a.x - b.x).slice(0, 4);
    prev.forEach((p, i) => { p.adj = p.adj.concat([cur[i].id]); cur[i].adj = cur[i].adj.concat([p.id]); });
  }
};
