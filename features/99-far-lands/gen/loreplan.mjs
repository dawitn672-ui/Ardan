// The plan of the far lands read from the lore (canon/lore/far-lands.json): the frame, every region with its box,
// area, people, heights and climate, the realms' capitals, the straits, lakes, ranges and rivers. shape.mjs cuts the
// land from it; the generator then works as with the hand plan (plan.mjs): relief, climate, provinces.
import { clamp } from './lib.mjs';

export const num = v => typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' && isFinite(+v.replace(/[, ]/g, '')) ? +v.replace(/[, ]/g, '') : null;
const pt = v => Array.isArray(v) ? [v[0], v[1]] : v && typeof v === 'object' ? [v.x, v.y] : null;
// "300-1,200", "-154-500", "1,000-8,640", "300-700 (rim to 3,100)"
export const elevRange = s => { const m = /^\s*(-?\d[\d,]*)\s*-\s*(-?\d[\d,]*)/.exec(String(s || '')); return m ? [num(m[1]), num(m[2])] : [200, 800]; };
// "about 2.1 million orcs and 300,000 humans" -> 2,400,000; null when it gives no number
export const peopleOf = s => {
  let t = 0, any = false;
  for (const m of String(s || '').matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(million)?/g)) { let v = +m[1].replace(/,/g, ''); if (m[2]) v *= 1e6; else if (v < 100) continue; t += v; any = true; }
  return any ? t : null;
};
// what a region is: mainland, one island, an archipelago, a chain of long islands, or the shores of a strait
const kindOf = r => /^The Strait\b/.test(r.name) ? 'shore' : /\bChain\b/.test(r.name) ? 'chain' : /\b(Isles|Scatter)\b/.test(r.name) ? 'arch'
  : r.land === 'A' || r.land === 'I' || /\bIsle\b/.test(r.name) ? 'island' : 'main';

export function lorePlan(L) {
  const box = L.frame && L.frame.box || { x0: 0, x1: 17600, y0: -2280, y1: 6610 };
  // the grid reaches past the lore's box where a land does (the Bone Isles lie north of 75 N), in whole 10 km cells
  let y0 = box.y0, y1 = box.y1;
  for (const r of L.regions || []) if (r.bbox) { y0 = Math.min(y0, r.bbox.y0 - 40); y1 = Math.max(y1, r.bbox.y1); }
  y0 = Math.floor(y0 / 10) * 10; y1 = Math.ceil(y1 / 10) * 10;
  const frame = { x0: box.x0, y0, W: box.x1 - box.x0, H: y1 - y0, lore: box };
  const regions = [];
  for (const r of L.regions || []) {
    const bb = r.bbox, c = pt(r.centre), area = num(r.area_km2);
    if (!bb || !c || !area) continue;
    const [emin, emax] = elevRange(r.elevation_m);
    regions.push({ id: r.id, land: r.land, name: r.name, native: r.native || '', kind: kindOf(r), c, bb, area, emin, emax,
      terr: Array.isArray(r.terrain) ? r.terrain.slice() : String(r.terrain || '').split(/[,;/ ]+/).filter(Boolean),
      warm: num(r.warmest_month_c), cold: num(r.coldest_month_c), rain: num(r.rain_mm), climate: r.climate || '',
      people: peopleOf(r.people), held: (r.held_by || []).map(h => ({ realm: h.realm, km2: num(h.km2) || 0 })),
      stateless: (r.stateless || []).map(h => ({ id: h.stateless, km2: num(h.km2) || 0 })), open: num(r.open_km2) || 0, caps: [], lanes: [] });
  }
  const byId = new Map(regions.map(r => [r.id, r]));
  const boxD = (r, x, y) => Math.hypot(Math.max(0, r.bb.x0 - x, x - r.bb.x1), Math.max(0, r.bb.y0 - y, y - r.bb.y1));
  // where the lore gives no head count, the realms that hold the region say it: their people by the share they hold
  const share = {};
  for (const p of L.polities || []) {
    const held = p.holds_km2 || {}, tot = Object.values(held).reduce((a, b) => a + (num(b) || 0), 0) || 1, pop = num(p.population) || 0;
    for (const [rid, km2] of Object.entries(held)) share[rid] = (share[rid] || 0) + pop * (num(km2) || 0) / tot;
  }
  for (const r of regions) if (r.people == null) r.people = Math.round(share[r.id] || r.area * 0.05);
  // every capital stands on land in its own region: the one of its realm's regions whose box holds it, or the nearest
  const caps = [];
  for (const p of L.polities || []) {
    const c = p.capital; if (!c || num(c.x) == null || num(c.y) == null) continue;
    const mine = (p.regions || Object.keys(p.holds_km2 || {})).map(id => byId.get(id)).filter(Boolean);
    const pool = mine.length ? mine : regions;
    const reg = pool.slice().sort((a, b) => boxD(a, c.x, c.y) - boxD(b, c.x, c.y) || (a.id < b.id ? -1 : 1))[0];
    const cap = { x: num(c.x), y: num(c.y), id: p.polity_id, name: c.name, place: c.place_id, region: reg && reg.id };
    caps.push(cap); if (reg) reg.caps.push(cap);
  }
  // the narrows are water at their width; the two shores the lore names ("Between the Long Tail and the Great Western
  // Isle") reach out to them, so the strait is a strait and not open sea
  const straits = [];
  const strip = s => s.toLowerCase().replace(/^the /, '').trim();
  for (const s of L.straits || []) {
    const p = pt(s.at) || pt(s.at_point); if (!p) continue;
    const w = num(s.width_km) || 40, st = { id: s.id, name: s.name, x: p[0], y: p[1], w, sides: [] };
    const m = /Between (?:the twin isles of )?(.+?) and (.+?)(?:[.,;]|$)/i.exec(s.note || '');
    if (m) for (const part of [m[1], m[2]]) {
      const want = strip(part), hit = regions.filter(r => r.kind !== 'shore').map(r => ({ r, n: strip(r.name) })).filter(o => want.includes(o.n) || o.n.includes(want) || want.split(' ').some(wd => wd.length > 4 && o.n.split(' ').includes(wd)))
        .sort((a, b) => boxD(a.r, p[0], p[1]) - boxD(b.r, p[0], p[1]))[0];
      if (hit) st.sides.push(hit.r.id);
    }
    // the same region on both sides (twin isles), or one named side: split along the box's short axis
    if (st.sides.length < 2 || st.sides[0] === st.sides[1]) {
      const r0 = byId.get(st.sides[0]) || regions.filter(r => r.kind !== 'shore').sort((a, b) => boxD(a, p[0], p[1]) - boxD(b, p[0], p[1]))[0];
      if (boxD(r0, p[0], p[1]) < 1) { st.twin = r0.id; st.sides = [r0.id, r0.id]; } else st.sides = st.sides.slice(0, 1);
    }
    const d = w / 2 + 25;
    st.sides.forEach((rid, k) => {
      const r = byId.get(rid); if (!r) return;
      let ux, uy;
      if (st.twin) { const wide = r.bb.x1 - r.bb.x0 >= r.bb.y1 - r.bb.y0; ux = wide ? (k ? 1 : -1) : 0; uy = wide ? 0 : (k ? 1 : -1); }
      else { const dx = r.c[0] - p[0], dy = r.c[1] - p[1], n = Math.hypot(dx, dy) || 1; ux = dx / n; uy = dy / n; }
      const sx = p[0] + ux * d, sy = p[1] + uy * d, far = st.twin ? Math.max(60, Math.min(r.bb.x1 - r.bb.x0, r.bb.y1 - r.bb.y0) * 0.35) : Math.hypot(r.c[0] - sx, r.c[1] - sy);
      r.lanes.push({ a: [sx, sy], b: [sx + ux * far, sy + uy * far], strait: st.id });
    });
    straits.push(st);
  }
  // lakes: an ellipse of their area, a rift lake long and thin along its rift
  const lakes = [];
  for (const k of L.lakes || []) {
    const p = pt(k.at), area = num(k.area); if (!p || !area || area < 250) continue;
    const m = /(\d[\d,]*)\s*km long and (\d[\d,]*)\s*(?:km )?wide/.exec(String(k.note || ''));
    let a = Math.sqrt(area / Math.PI), b = a, rot = 0;
    if (m) { a = num(m[1]) / 2; b = Math.max(8, area / (Math.PI * a)); }
    const rift = (L.ranges || []).find(g => g.land === k.land && /rift/i.test(g.kind || '') && g.line);
    if (rift && (m || /deep|rift/i.test(k.note || ''))) { const l = rift.line, d = [l[l.length - 1][0] - l[0][0], l[l.length - 1][1] - l[0][1]]; rot = Math.atan2(d[1], d[0]); if (!m) { a = Math.sqrt(area / Math.PI) * 2.6; b = area / (Math.PI * a); } }
    const pts = []; for (let q = 0; q < 36; q++) { const t = q / 36 * Math.PI * 2, x = a * Math.cos(t), y = b * Math.sin(t); pts.push([p[0] + x * Math.cos(rot) - y * Math.sin(rot), p[1] + x * Math.sin(rot) + y * Math.cos(rot)]); }
    lakes.push({ id: k.id, name: k.name, pts, at: p, region: k.region });
  }
  // ranges: a crest at seven tenths of the highest peak, as wide as the kind of range
  const WIDTH = [[/collision|knot|compressed/i, 150], [/plateau rim|glaciated/i, 120], [/old worn|granite|old range|reactivated/i, 90], [/block|fold/i, 110],
    [/escarpment|rift/i, 75], [/parallel|ridges/i, 65], [/ringing/i, 70], [/volcanic|arc/i, 50], [/lava/i, 90], [/highlands/i, 80]];
  const ranges = [];
  for (const g of L.ranges || []) {
    const h = g.peak && num(g.peak.h); if (!h || !Array.isArray(g.line) || g.line.length < 2 || /not a range/i.test(g.kind || '')) continue;
    const w = (WIDTH.find(([re]) => re.test(g.kind || '')) || [0, 90])[1];
    ranges.push({ id: g.id, name: g.name, h: h * 0.72, w, pts: g.line.map(pt), peak: g.peak.at ? pt(g.peak.at) : null, peakH: h });
  }
  // rivers: the lore's courses, the great ones (over 2,000 km or 5,000 m3/s) drawn as great rivers
  const rivers = (L.rivers || []).filter(r => Array.isArray(r.path) && r.path.length >= 2 && (num(r.len) || 0) > 0)
    .map(r => ({ id: r.id, name: r.name, pts: r.path.map(pt), big: (num(r.len) || 0) >= 2000 || (num(r.flow) || 0) >= 5000 }));
  for (const r of regions) r.density = r.people / r.area;
  // each capital keeps its shore; each strait is open water
  const keep = caps.map(c => ({ x: c.x, y: c.y, r: 30, id: c.id }));
  const water = straits.map(s => ({ x: s.x, y: s.y, r: clamp(s.w / 2, 8, 150), id: s.id, strait: true }));
  return { lore: true, frame, regions, caps, straits, keep, water, lakes, ranges, rivers, chains: [], plateaus: [], edgeSea: 0 };
}
