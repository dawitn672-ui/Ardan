// M1 (order 71, D-151): the map is the one source of truth for what the world says about itself. A.V2MAP.factsOf(w) reads a
// built world (any map seed, any version) and the state that stands on it (for the names D9 gives its rivers, ranges,
// forests and seas) and returns what the lore must agree with:
//   realms[id]: its name, capital (site, coast, river, lake, terrain), place on the compass (its land's centre against the
//     continent's, as u and v from 0 to 1 and the words they earn), provinces and coastal provinces, the seas and lakes it
//     touches, its terrain mix and high ground, the named rivers through it, the ranges and forests named on it, its
//     neighbours by land, and its towns;
//   waters: the open sea by D9's named sectors, and every enclosed water (a lake, or an inland sea from VM.INLAND_SEA
//     cells), with the realms on each shore;
//   rivers, ranges, forests, passes: each named feature with the realms it touches (a river: those it runs through and
//     the water it reaches).
// Realms are read as the map was written (each province's realm in the release), the heartlands the lore describes, not
// as a life's history moves them. Pure: reads the world and the state, writes nothing, draws nothing.
// tools/m1/facts.mjs writes it to data/map/one-continent.json; tools/lint-lore-map.mjs holds the words to it.
(function () {
  const VM = A.V2MAP;
  if (!VM) return;
  VM.FACTS_V = 1;
  VM.INLAND_SEA = 400;            // enclosed water of this many 10 km cells (40,000 km²) or more is an inland sea, not a lake
  VM.HIGH_M = 1000;               // high ground (metres) for a realm's share of it; D9 names ranges from 1,800 m
  const r2 = x => Math.round(x * 100) / 100;
  // the compass words a place earns: a third of the continent's breadth from an edge
  VM.compassWords = (u, v) => {
    const w = [];
    if (v <= 1 / 3) w.push('north'); else if (v >= 2 / 3) w.push('south');
    if (u <= 1 / 3) w.push('west'); else if (u >= 2 / 3) w.push('east');
    if (!w.length) w.push('centre');
    return w;
  };
  VM.factsOf = function (w) {
    w = w || VM.w;
    if (!w || !w.grid) return null;
    const base = VM.release(), B = base.provinces, gw = w.gw, gh = w.gh, N = gw * gh, g = w.grid, ocean = w.ocean, P = w.prov;
    const realmOf = id => (B[id] && B[id].realm) || null;
    const isRealm = r => r && r !== 'unclaimed' && typeof LORE !== 'undefined' && LORE.realms && LORE.realms[r];
    const G = w.ground || null;
    let NM = null;
    try { if (A.D9 && A.S && A.S.v2map && A.S.v2map.seed === w.seed && A.S.v2map.v === w.v) NM = A.D9.names(); } catch (e) { NM = null; }
    const gen = w.gen, fx = gen.W / gw, fy = gen.H / gh;
    const genAt = k => Math.min(gen.H - 1, Math.floor((((k / gw) | 0) + 0.5) * fy)) * gen.W + Math.min(gen.W - 1, Math.floor(((k % gw) + 0.5) * fx));
    const metres = k => Math.max(0, gen.elev[genAt(k)]) * (VM.ELEV_M || 8000);
    const nb4 = k => { const x = k % gw, y = (k / gw) | 0; return [x > 0 ? k - 1 : -1, x < gw - 1 ? k + 1 : -1, y > 0 ? k - gw : -1, y < gh - 1 ? k + gw : -1]; };

    // ---- the waters: enclosed water by component; the open sea by D9's sectors about the land's middle
    const wcomp = new Int32Array(N).fill(-1), enclosed = [];
    for (let s = 0; s < N; s++) {
      if (g[s] >= 0 || ocean[s] || wcomp[s] >= 0) continue;
      const id = enclosed.length, st = [s]; wcomp[s] = id; let n = 0;
      while (st.length) { const k = st.pop(); n++; for (const j of nb4(k)) if (j >= 0 && g[j] < 0 && !ocean[j] && wcomp[j] < 0) { wcomp[j] = id; st.push(j); } }
      enclosed.push({ id, cells: n, realms: {} });
    }
    let lx = 0, ly = 0, ln = 0; for (let k = 0; k < N; k++) if (g[k] >= 0) { lx += k % gw; ly += (k / gw) | 0; ln++; }
    lx /= Math.max(1, ln); ly /= Math.max(1, ln);
    const SECT = 8, sectOf = k => Math.floor(((Math.atan2(((k / gw) | 0) - ly, (k % gw) - lx) + Math.PI) / (2 * Math.PI)) * SECT) % SECT;
    // each sector's sea name: D9's, or the nearest named sector's (a short coast with no sea of its own)
    const seaBySect = new Array(SECT).fill(null);
    if (G && G.seas) G.seas.forEach((s, i) => { seaBySect[s.s] = (NM && NM.seas[i]) || 'the sea ' + i; });
    const named = seaBySect.map((x, s) => { if (x) return x; for (let d = 1; d < SECT; d++) for (const t of [(s + d) % SECT, (s - d + SECT) % SECT]) if (seaBySect[t]) return seaBySect[t]; return 'the open sea'; });
    // world-given names for enclosed water (a designed map may name its inland sea and lakes: w.waterNames[component])
    // a designed map (version 4) names every water cell: w.waterAt is its index in w.waters
    const designed = !!(w.waterAt && w.waters);
    const encName = c => { if (!designed) return (w.waterNames && w.waterNames[c.id]) || null; if (c.nm === undefined) { c.nm = null; for (let k = 0; k < N && c.nm === null; k++) if (wcomp[k] === c.id && w.waterAt[k] >= 0) c.nm = w.waters[w.waterAt[k]].name; } return c.nm; };
    const waterAt = k => {
      if (designed && w.waterAt[k] >= 0) { const x = w.waters[w.waterAt[k]]; return x.enclosed ? { k: 'lake', c: wcomp[k], name: x.name } : { k: 'sea', name: x.name }; }
      return ocean[k] ? { k: 'sea', name: named[sectOf(k)] } : wcomp[k] >= 0 ? { k: enclosed[wcomp[k]].cells >= VM.INLAND_SEA ? 'inland sea' : 'lake', c: wcomp[k] } : null;
    };
    const waterKey = x => (x.k === 'sea' ? x.name : (x.name || encName(enclosed[x.c]) || `${x.k} ${x.c}`));

    // ---- per province: cells, waters it touches, high ground, river
    const pv = P.map(q => ({ id: q.id, cells: 0, high: 0, waters: new Set(), lake: false }));
    for (let k = 0; k < N; k++) {
      const id = g[k]; if (id < 0) continue;
      const a = pv[id]; a.cells++; if (metres(k) >= VM.HIGH_M) a.high++;
      for (const j of nb4(k)) { if (j < 0 || g[j] >= 0) continue; const wa = waterAt(j); if (!wa) continue; a.waters.add(waterKey(wa)); if (wa.k !== 'sea') { a.lake = true; const R = realmOf(id); if (isRealm(R) && wa.c >= 0 && enclosed[wa.c]) enclosed[wa.c].realms[R] = 1; } }
    }

    // ---- named rivers: the realms each runs through, and the water it reaches (followed down the generator's flow)
    const rivers = [];
    // a designed map's rivers are its own, every one named, each with the water it reaches
    if (w.riverNames && w.riverTo) w.riverNames.forEach((nm, ri) => {
      if (!nm) return; const a = w.rivers[ri], rs = [];
      for (let t = 0; t < a.length; t += 3) { const k = Math.min(gh - 1, Math.floor(a[t + 1] / 10)) * gw + Math.min(gw - 1, Math.floor(a[t] / 10)); const R = g[k] >= 0 ? realmOf(g[k]) : null; if (isRealm(R) && !rs.includes(R)) rs.push(R); }
      rivers.push({ name: nm, realms: rs, to: w.riverTo[ri], ships: !!(w.riverShips && w.riverShips[ri]) });
    });
    else if (G && G.rivers) G.rivers.forEach((rv, i) => {
      const a = w.rivers[rv.r]; if (!a) return;
      const rs = [];
      for (let t = 0; t < a.length; t += 3) { const k = Math.min(gh - 1, Math.floor(a[t + 1] / 10)) * gw + Math.min(gw - 1, Math.floor(a[t] / 10)); const R = g[k] >= 0 ? realmOf(g[k]) : null; if (isRealm(R) && rs[rs.length - 1] !== R && !rs.includes(R)) rs.push(R); }
      // down the flow from its last point to water
      let c = Math.min(gen.H - 1, Math.max(0, Math.round(a[a.length - 2] / 10 * fy - 0.5))) * gen.W + Math.min(gen.W - 1, Math.max(0, Math.round(a[a.length - 3] / 10 * fx - 0.5)));
      for (let s = 0; s < 4000 && c >= 0 && gen.elev[c] > 0 && gen.biome[c] !== 14; s++) c = gen.flowTo[c];
      let to = null;
      if (c >= 0) { const gy = (c / gen.W) | 0, gx = c % gen.W, k = Math.min(gh - 1, Math.floor((gy + 0.5) / fy)) * gw + Math.min(gw - 1, Math.floor((gx + 0.5) / fx)); const near = [k].concat(nb4(k)).find(j => j >= 0 && g[j] < 0); const wa = near != null ? waterAt(near) : null; to = wa ? waterKey(wa) : null; }
      rivers.push({ name: (NM && NM.rivers[i]) || 'river ' + i, realms: rs, to });
    });
    const feat = (list, names, kind) => (list || []).map((x, i) => ({ name: (names && names[i]) || kind + ' ' + i, realm: isRealm(realmOf(x.prov)) ? realmOf(x.prov) : null, prov: x.prov }));
    const ranges = feat(G && G.ranges, NM && NM.ranges, 'range'), forests = feat(G && G.forests, NM && NM.forests, 'forest');
    const passes = feat(G && G.passes, NM && NM.passes, 'pass');

    // ---- the realms
    let x0 = gw, x1 = 0, y0 = gh, y1 = 0; for (let k = 0; k < N; k++) if (g[k] >= 0) { const x = k % gw, y = (k / gw) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const realms = {};
    for (const R of Object.keys(LORE.realms).sort()) {
      const ps = P.filter(q => realmOf(q.id) === R); if (!ps.length) continue;
      let cx = 0, cy = 0, n = 0; for (const q of ps) { cx += q.x * q.cells; cy += q.y * q.cells; n += q.cells; }
      const u = r2((cx / n / 10 - x0) / Math.max(1, x1 - x0)), v = r2((cy / n / 10 - y0) / Math.max(1, y1 - y0));
      const cap = ps.find(q => B[q.id].type === 'capital city') || ps.slice().sort((a, b) => (B[b.id].pop || 0) - (B[a.id].pop || 0))[0];
      const capK = Math.floor(cap.sy / 10) * gw + Math.floor(cap.sx / 10);
      const terr = {}; for (const q of ps) terr[q.terr] = (terr[q.terr] || 0) + 1;
      const seas = {}, lakes = {};
      for (const q of ps) for (const wn of pv[q.id].waters) { if (/^(lake|inland sea) \d+$/.test(wn) || enclosed.some(c => encName(c) === wn)) lakes[wn] = (lakes[wn] || 0) + 1; else seas[wn] = (seas[wn] || 0) + 1; }
      const nbs = new Set(); for (const q of ps) for (const j of q.adj) { const R2 = realmOf(j); if (R2 !== R && isRealm(R2)) nbs.add(R2); }
      const cells = ps.reduce((a, q) => a + pv[q.id].cells, 0), high = ps.reduce((a, q) => a + pv[q.id].high, 0);
      // the land just over its borders (realms' and wilds' provinces alike): what a march, a raid or a view from the walls
      // can name without the ground being the realm's own
      const own = new Set(ps.map(q => q.id)), nearIds = new Set(); for (const q of ps) for (const j of q.adj) if (!own.has(j)) nearIds.add(j);
      const near = { terr: {}, lake: false, high: false };
      for (const j of nearIds) { const q = P[j]; if (!q) continue; near.terr[q.terr] = (near.terr[q.terr] || 0) + 1; if (pv[j].lake) near.lake = true; if (pv[j].high >= 0.25 * pv[j].cells) near.high = true; }
      realms[R] = {
        name: LORE.realms[R].name, short: LORE.realms[R].short || LORE.realms[R].name,
        capital: { id: cap.id, name: (cap.retype && cap.retype.name) || B[cap.id].name, coast: !!cap.coast, terr: cap.terr,
          river: (w.riv[capK] || 0) >= (VM.RIVER_T || 120), stream: (w.riv[capK] || 0) >= (VM.STREAM_T || 40), lake: pv[cap.id].lake },
        compass: { u, v, words: VM.compassWords(u, v) },
        provinces: ps.length, coastal: ps.filter(q => q.coast).length, cells,
        seas, lakes, terr, high: r2(high / Math.max(1, cells)),
        rivers: rivers.filter(rv => rv.realms.includes(R)).map(rv => rv.name),
        // ship water: a river sea-going ships use (the design's Grey Channel and Gullet), which serves a fleet as a coast does
        shipWater: rivers.filter(rv => rv.ships && rv.realms.includes(R)).map(rv => rv.name),
        ranges: [...new Set(ranges.filter(x => x.realm === R).map(x => x.name))],
        forests: [...new Set(forests.filter(x => x.realm === R).map(x => x.name))],
        neighbours: [...nbs].sort(), near,
        towns: ps.map(q => ({ name: (q.retype && q.retype.name) || B[q.id].name, type: (q.retype && q.retype.type) || B[q.id].type })),
      };
    }
    const waters = [];
    // a designed map: each of its named waters, with the realms on its shores
    if (designed) for (const x of w.waters) waters.push({ name: x.name, kind: x.kind, coast: !!x.coast, realms: Object.keys(realms).filter(R => realms[R].seas[x.name] || realms[R].lakes[x.name]) });
    else for (let s = 0; s < SECT; s++) if (seaBySect[s]) waters.push({ name: seaBySect[s], kind: 'sea', realms: Object.keys(realms).filter(R => realms[R].seas[seaBySect[s]]) });
    for (const c of enclosed) if (c.cells >= 4 && !(designed && encName(c))) waters.push({ name: encName(c) || `${c.cells >= VM.INLAND_SEA ? 'inland sea' : 'lake'} ${c.id}`, kind: c.cells >= VM.INLAND_SEA ? 'inland sea' : 'lake', cells: c.cells, realms: Object.keys(c.realms).sort() });
    const uniq = list => { const m = new Map(); for (const x of list) { const e = m.get(x.name) || { name: x.name, realms: [] }; if (x.realm && !e.realms.includes(x.realm)) e.realms.push(x.realm); m.set(x.name, e); } return [...m.values()]; };
    return { v: VM.FACTS_V, seed: w.seed, map: w.v, realms, waters, rivers, ranges: uniq(ranges), forests: uniq(forests), passes: uniq(passes) };
  };
})();
