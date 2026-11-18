// D9: the ground the game reads (src/map/engine/ground.js), on a small continent built here: cover, roads in two ranks,
// a crossing wherever a road meets running water, passes, river links and the features to name; deterministic.
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateContinent, riverPaths } from '../../src/map/engine/continent.js';
import { buildGround, edgeIndex, RANK, COVER, DEFAULTS } from '../../src/map/engine/ground.js';

// a small world in the shape A.V2MAP.build gives: the generator's own provinces on its own grid
function world(seed) {
  const gen = generateContinent({ width: 200, height: 130, seed, landFraction: 0.4, maxIslands: 0, provinces: 40, droplets: 4000 });
  const W = gen.W, H = gen.H, N = W * H, grid = new Int16Array(N).fill(-1);
  for (let k = 0; k < N; k++) if (gen.elev[k] > 0 && gen.provinces.owner[k] >= 0) grid[k] = gen.provinces.owner[k];
  const prov = gen.provinces.list.map(p => ({ id: p.id, sx: Math.floor(p.x) * 10 + 5, sy: Math.floor(p.y) * 10 + 5, adj: [] }));
  for (let k = 0; k < N; k++) { const a = grid[k]; if (a < 0) continue; for (const j of [k % W < W - 1 ? k + 1 : -1, k + W < N ? k + W : -1]) { if (j < 0) continue; const b = grid[j]; if (b >= 0 && b !== a) { if (!prov[a].adj.includes(b)) prov[a].adj.push(b); if (!prov[b].adj.includes(a)) prov[b].adj.push(a); } } }
  // a province's site must be inside it
  for (const p of prov) { const k = Math.floor(p.sy / 10) * W + Math.floor(p.sx / 10); if (grid[k] !== p.id) { const c = grid.findIndex(g => g === p.id); if (c >= 0) { p.sx = (c % W) * 10 + 5; p.sy = Math.floor(c / W) * 10 + 5; } } }
  const rivers = riverPaths(gen, DEFAULTS.STREAM_T).map(pts => { const a = new Float32Array(pts.length * 3); pts.forEach(([u, v, f], i) => { a[3 * i] = (u + 0.5) * 10; a[3 * i + 1] = (v + 0.5) * 10; a[3 * i + 2] = f; }); return a; });
  const riv = new Float32Array(N);
  for (const a of rivers) for (let i = 0; i < a.length; i += 3) { const x = Math.floor(a[i] / 10), y = Math.floor(a[i + 1] / 10); if (x >= 0 && y >= 0 && x < W && y < H) riv[y * W + x] = Math.max(riv[y * W + x], a[i + 2]); }
  const ocean = Uint8Array.from(gen.ocean);
  const places = prov.map((p, i) => ({ type: i % 7 === 0 ? 'capital city' : i % 3 === 0 ? 'city' : 'town', realm: 'R' + Math.floor(i / 7) }));
  const w = { seed, gw: W, gh: H, grid, prov, gen, rivers, riv, ocean };
  return { w, o: { elev: gen.elev, gi: Int32Array.from({ length: N }, (_, k) => k), metres: 8000, places } };
}

test('the ground is the same from the same world, and pure', () => {
  const { w, o } = world('d9-a');
  const a = buildGround(w, o), b = buildGround(w, o);
  assert.deepEqual(a.edges.map(e => [e.a, e.b, e.rank, e.km, [...e.path].join(',')]), b.edges.map(e => [e.a, e.b, e.rank, e.km, [...e.path].join(',')]));
  assert.deepEqual([...a.cover], [...b.cover]);
  assert.deepEqual(a.crossings, b.crossings);
});

test('roads come in two ranks and every province is on one', () => {
  const { w, o } = world('d9-b');
  const G = buildGround(w, o), ranks = [0, 0, 0];
  for (const e of G.edges) ranks[e.rank]++;
  assert.ok(ranks[RANK.HIGH] > 0 && ranks[RANK.TRACK] > 0, `high ${ranks[RANK.HIGH]} track ${ranks[RANK.TRACK]}`);
  const onRoad = new Set(); for (const e of G.edges) if (e.rank) { onRoad.add(e.a); onRoad.add(e.b); }
  const withNb = w.prov.filter(p => p.adj.length).length;
  assert.ok(onRoad.size >= withNb * 0.95, `${onRoad.size} of ${withNb} provinces on a road`);
  // a road runs from one town to the other, cell by cell, inside the two provinces
  for (const e of G.edges) {
    const p = e.path, s = w.prov[e.a], t = w.prov[e.b], W = w.gw;
    assert.equal(p[0], Math.floor(s.sy / 10) * W + Math.floor(s.sx / 10));
    assert.equal(p[p.length - 1], Math.floor(t.sy / 10) * W + Math.floor(t.sx / 10));
    for (let i = 1; i < p.length; i++) { assert.ok(Math.abs(p[i] % W - p[i - 1] % W) <= 1 && Math.abs(Math.floor(p[i] / W) - Math.floor(p[i - 1] / W)) <= 1); assert.ok(w.grid[p[i]] === e.a || w.grid[p[i]] === e.b); }
  }
  const at = edgeIndex(G), e0 = G.edges[0];
  assert.equal(at(e0.a, e0.b), e0); assert.equal(at(e0.b, e0.a), e0);
});

test('a ford or a bridge wherever a road meets running water inside its course', () => {
  const { w, o } = world('d9-c');
  const G = buildGround(w, o);
  let runs = 0;
  for (const e of G.edges) {
    if (!e.rank) continue;
    const p = e.path; let n = 0;
    for (let i = 1; i < p.length - 1; i++) if (w.riv[p[i]] >= DEFAULTS.STREAM_T && w.riv[p[i - 1]] < DEFAULTS.STREAM_T) { let j = i; while (j + 1 < p.length && w.riv[p[j + 1]] >= DEFAULTS.STREAM_T) j++; if (j < p.length - 1) n++; }
    runs += n;
    assert.equal(e.cross.length, n, `edge ${e.a}-${e.b}: ${n} waters, ${e.cross.length} crossings`);
    for (const c of e.cross) assert.ok(['ford', 'bridge'].includes(G.crossings[c].kind));
  }
  assert.ok(runs > 0, 'some road crosses water');
  for (const c of G.crossings) if (c.flow >= DEFAULTS.BRIDGE_T) assert.equal(c.kind, 'bridge');
});

test('cover is wood or marsh or open on land only; passes stand high; features to name', () => {
  const { w, o } = world('d9-d');
  const G = buildGround(w, o);
  let wood = 0, marsh = 0, land = 0;
  for (let k = 0; k < G.cover.length; k++) { if (w.grid[k] < 0) { assert.equal(G.cover[k], COVER.OPEN); continue; } land++; if (G.cover[k] === COVER.WOOD) wood++; if (G.cover[k] === COVER.MARSH) marsh++; }
  assert.ok(wood > 0 && wood < land, `wood ${wood} of ${land}`);
  for (const p of G.passes) assert.ok(p.m >= DEFAULTS.PASS_M);
  assert.ok(G.seas.length >= 4, `${G.seas.length} seas`);
  for (const f of [...G.rivers, ...G.ranges, ...G.forests, ...G.seas]) assert.ok(f.prov >= 0 && Number.isFinite(f.x) && Number.isFinite(f.y));
  for (const [a, b, f] of G.riverLinks) { assert.ok(w.prov[a].adj.includes(b)); assert.ok(f >= DEFAULTS.NAV_T); }
});
