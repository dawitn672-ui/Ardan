// far@2: the lore's great routes (far-lands.json `routes`, each in strands of points in km) laid on the province
// graph, so the game's caravans (45-economy) and carters (66-markets) can use them, and the atlas the map writes its
// names from (ranges, rivers, lakes, seas, straits, passes, regions). A strand's points are joined by the cheapest
// way over the provinces (land first; sea lanes cost more). A sea route joins two coastal provinces with a sea lane
// when they have none, so a sea road the lore names is a lane ships can sail. The Known World's provinces are used
// where a route runs into it (the Silk Road's west end is Kraoth, canon TR-09), and none of them is changed except
// by a sea lane, which the game adds only while the far lands are open.
import { Heap } from './lib.mjs';

const r10 = v => Math.round(v / 10) * 10;
const ptOf = v => Array.isArray(v) ? [v[0], v[1]] : v && typeof v === 'object' ? [v.x, v.y] : null;

export function makeRoutes(lore, P, V, base, provAtKm, F) {
  const nb = base.provinces.length, N = nb + P.length;
  const site = id => id < nb ? [base.provinces[id].sx, base.provinces[id].sy] : [P[id - nb].sx, P[id - nb].sy];
  const coast = id => id < nb ? !!base.provinces[id].coast : !!P[id - nb].coast;
  const land = id => {
    const out = new Set();
    if (id < nb) { const q = base.provinces[id]; for (const j of q.adj) out.add(j); for (const j of V.seam.get(id) || []) out.add(j); for (const j of V.baseBase.get(id) || []) out.add(j); }
    else for (const j of V.adj[id - nb]) out.add(j);
    return out;
  };
  const sea = id => {
    const out = new Set();
    if (id < nb) { for (const j of base.provinces[id].sea || []) out.add(j); for (const j of V.seaBase.get(id) || []) out.add(j); }
    else for (const j of V.sea[id - nb]) out.add(j);
    return out;
  };
  const addSea = (u, v) => {
    for (const [a, b] of [[u, v], [v, u]]) {
      if (a >= nb) V.sea[a - nb].add(b);
      else { let l = V.seaBase.get(a); if (!l) V.seaBase.set(a, l = new Set()); l.add(b); }
    }
  };
  const at = (x, y) => {
    let p = null;
    if (x >= 0 && y >= 0 && x < base.gw * 10 && y < base.gh * 10) { const v = base.grid[Math.floor(y / 10) * base.gw + Math.floor(x / 10)]; if (v >= 0) return v; }
    else { p = provAtKm(x, y); if (p) return p.id; }
    // in the sea: the nearest province, by its site, within 450 km
    let best = null, bd = 450;
    for (let id = 0; id < N; id++) { const [sx, sy] = site(id), d = Math.hypot(sx - x, sy - y); if (d < bd) { bd = d; best = id; } }
    return best;
  };
  // the cheapest way from a to b over the provinces; a sea step costs twice a land step of the same length
  const way = (a, b, seaW) => {
    if (a === b) return [a];
    const dist = new Float64Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), h = new Heap();
    dist[a] = 0; h.push(0, a);
    while (h.size) {
      const u = h.pop(), du = h.lastKey; if (du > dist[u]) continue; if (u === b) break;
      const [ux, uy] = site(u);
      const step = (v, w) => { const [vx, vy] = site(v), c = du + Math.hypot(vx - ux, vy - uy) * w; if (c < dist[v]) { dist[v] = c; from[v] = u; h.push(c, v); } };
      for (const v of land(u)) step(v, 1);
      for (const v of sea(u)) step(v, seaW);
    }
    if (from[b] < 0) return null;
    const out = [b]; for (let v = from[b]; v >= 0; v = from[v]) out.push(v);
    return out.reverse();
  };
  const routes = [];
  let lanes = 0, miss = 0;
  for (const r of lore.routes || []) {
    const kind = String(r.kind || ''), bySea = /\bsea\b/i.test(kind), byRiver = /river|canal|barge|canoe/i.test(kind);
    for (const s of r.strands || []) {
      const pts = (s.pts || []).map(ptOf).filter(p => p && isFinite(p[0]) && isFinite(p[1]));
      if (pts.length < 2) continue;
      const ids = pts.map(([x, y]) => at(x, y));
      if (ids.some(v => v == null)) { miss++; continue; }
      const path = [ids[0]];
      for (let i = 1; i < ids.length; i++) {
        const a = path[path.length - 1], b = ids[i];
        if (a === b) continue;
        let w = null;
        if (bySea && coast(a) && coast(b)) {
          // a sea road: straight across where the provinces have no lane
          if (!sea(a).has(b) && !land(a).has(b)) { addSea(a, b); lanes++; }
          w = [a, b];
        } else w = way(a, b, bySea ? 0.7 : 2);
        if (!w) { miss++; continue; }
        for (const v of w.slice(1)) path.push(v);
      }
      routes.push({ id: r.id, n: String(r.name || r.id).replace(/[<>"]/g, ''), s: String(s.name || '').replace(/[<>"]/g, ''), k: bySea ? 'sea' : byRiver ? 'river' : 'road',
        p: path, pts: pts.map(([x, y]) => [r10(x), r10(y)]) });
    }
  }
  return { routes, lanes, miss };
}

// the names the map writes: regions, ranges, rivers, lakes, seas, straits, passes (positions in km)
export function makeAtlas(lore, landAt, F, GW, GH) {
  const clean = s => String(s || '').replace(/[<>"]/g, '').replace(/\s*\(.*?\)\s*/g, ' ').trim();
  const regions = {}; for (const g of lore.regions || []) regions[g.id] = clean(g.name);
  const line = pts => (pts || []).map(ptOf).filter(Boolean).map(([x, y]) => [r10(x), r10(y)]);
  const ranges = (lore.ranges || []).filter(g => Array.isArray(g.line) && g.line.length >= 2).map(g => [clean(g.name), line(g.line)]);
  const rivers = (lore.rivers || []).filter(g => Array.isArray(g.path) && g.path.length >= 2).map(g => [clean(g.name), line(g.path), (+g.len || 0) >= 2000 ? 1 : 0]);
  const lakes = (lore.lakes || []).map(k => { const p = ptOf(k.at) || ptOf(k.at_point); return p ? [clean(k.name), r10(p[0]), r10(p[1]), Math.round(+k.area || 0)] : null; }).filter(Boolean);
  const straits = (lore.straits || []).map(k => { const p = ptOf(k.at) || ptOf(k.at_point); return p ? [clean(k.name), r10(p[0]), r10(p[1])] : null; }).filter(Boolean);
  const passes = (lore.passes || []).map(k => { const p = ptOf(k.at) || ptOf(k.at_point); return p ? [clean(k.name), r10(p[0]), r10(p[1])] : null; }).filter(Boolean);
  // the lore gives its seas no places: each is written where its water is deepest near the shores it names
  const SEA_NEAR = { 'SEA-01': [9300, 4300], 'SEA-02': [13600, 4300], 'SEA-03': [16100, 1900], 'SEA-04': [16450, 1400], 'SEA-05': [17450, 2700],
    'SEA-06': [11000, -2450], 'SEA-07': [7350, -700], 'SEA-08': [8200, 6300], 'SEA-09': [15400, 5300], 'SEA-10': [17000, -500] };
  const seas = [];
  for (const s of lore.seas || []) {
    const p = SEA_NEAR[s.id]; if (!p) continue;
    // the cell farthest from land within 350 km of the anchor
    let best = p, bd = -1;
    for (let dy = -350; dy <= 350; dy += 30) for (let dx = -350; dx <= 350; dx += 30) {
      const x = p[0] + dx, y = p[1] + dy; if (landAt(x, y)) continue;
      let d = 0; while (d < 400 && !landAt(x + d, y) && !landAt(x - d, y) && !landAt(x, y + d) && !landAt(x, y - d)) d += 20;
      if (d > bd) { bd = d; best = [x, y]; }
    }
    seas.push([clean(s.name).replace(/^(The .+?) its far (coasts|reaches|shores)$/i, '$1'), r10(best[0]), r10(best[1])]);
  }
  return { regions, ranges, rivers, lakes, seas, straits, passes };
}
