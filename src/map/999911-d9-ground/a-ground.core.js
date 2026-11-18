// 999911-d9-ground (D9, CRITIQUE §17, D-061): the ground the game can read, in play.
// The loaded world's ground (A.V2.ground.buildGround, made with the continent in A.V2MAP.build, on the page or in the
// worker) is read here: the road between two provinces and its rank, the water and the pass on it, the river links,
// and the names of seas, ranges, rivers, forests, passes and crossings (from the culture of the land, C7's A.NAMES).
// Nothing is saved: a save keeps its map's seed, and the ground is made again from it on load (D-061).
// Pure: no A.rand, no writes to A.S. A state with no generated map (an old save, the clone harness) reads no ground, and
// every factor here is then 1.
(function () {
  const D9 = A.D9 = A.D9 || {};
  const VM = A.V2MAP;
  D9.OFF = false;
  // how much faster a road is than open country, by rank (none, high road, track): on foot or by cart, and an army's march.
  // Both ranks are at least 30% faster than no road (CRITIQUE §17); the mean over the map's ways stays near the release's.
  D9.TRAVEL = [0.8, 1.25, 1.05];
  D9.MARCH = [0.85, 1.3, 1.12];
  // supply carried from one province to the next: a high road or a navigable river carries more, no road less
  D9.SUPPLY = [0.9, 1.05, 1];
  D9.SUPPLY_RIVER = 1.05;
  D9.SUPPLY_MAX = 1.1;
  // an attack over a river (a ford, a bridge, or no crossing at all) or through a pass: the attacker's blows count for less
  D9.ATTACK = { ford: 0.82, bridge: 0.87, none: 0.75, pass: 0.8 };
  D9.RIVER_T = 120;   // the water an attack must cross: a river (a stream is stepped over)

  // ---- the loaded world's ground, and its lookups (module memo, never state)
  let memo = null;
  D9.ctx = function () {
    if (D9.OFF || !VM || !A.S || !A.S.v2map || !A.S.v2map.seed) return null;
    const want = A.S.v2map.seed + '#' + (A.S.v2map.v || 1);
    if (memo && memo.key === want && memo.S === A.S) return memo.c;
    if (VM.cur !== want || !VM.w) { try { VM.sync(); } catch (e) { return null; } }
    const w = VM.w, G = w && w.ground;
    if (!G || w.key !== want) { memo = { key: want, S: A.S, c: null }; return null; }
    if (!G._at) {   // lookups, once per world
      G._at = A.V2.ground.edgeIndex(G);
      G._link = new Map(); for (const [a, b, f] of G.riverLinks) { G._link.set(a * 4096 + b, f); G._link.set(b * 4096 + a, f); }
    }
    memo = { key: want, S: A.S, c: { w, G } };
    return memo.c;
  };
  D9.ground = () => { const c = D9.ctx(); return c ? c.G : null; };
  D9.edge = (a, b) => { const c = D9.ctx(); return c && a != null && b != null ? c.G._at(a, b) : null; };
  D9.rank = (a, b) => { const e = D9.edge(a, b); return e ? e.rank : null; };
  D9.travelF = (a, b) => { const e = D9.edge(a, b); return e ? D9.TRAVEL[e.rank] : 1; };
  D9.marchF = (a, b) => { const e = D9.edge(a, b); return e ? D9.MARCH[e.rank] : 1; };
  D9.riverLink = (a, b) => { const c = D9.ctx(); return c ? c.G._link.get(a * 4096 + b) || 0 : 0; };
  D9.supplyF = (a, b) => {
    const e = D9.edge(a, b); if (!e) return 1;
    return Math.min(D9.SUPPLY_MAX, D9.SUPPLY[e.rank] * (D9.riverLink(a, b) ? D9.SUPPLY_RIVER : 1));
  };
  // an attack from province `from` into `to`: { f, kind: 'ford'|'bridge'|'none'|'pass'|'ford+pass'..., name } or null
  D9.attack = function (from, to) {
    if (from == null || to == null || from === to) return null;
    const c = D9.ctx(); if (!c) return null;
    const e = c.G._at(from, to); if (!e) return null;
    let f = 1, kinds = [], name = null;
    if (e.wet >= D9.RIVER_T) {
      let best = null; for (const ci of e.cross) { const x = c.G.crossings[ci]; if (x.flow >= D9.RIVER_T && (!best || x.flow > best.flow)) best = x; }
      const kind = best ? best.kind : 'none';
      f *= D9.ATTACK[kind]; kinds.push(kind);
      name = best ? D9.crossName(best) : 'a river with no ford';
    }
    if (e.pass >= 0) { f *= D9.ATTACK.pass; kinds.push('pass'); const p = D9.passName(e.pass); name = name ? name + ' and ' + p : p; }
    return kinds.length ? { f, kind: kinds.join('+'), name } : null;
  };

  // ---- names: the culture of the land (the province's realm in the release), a place word from C7's pools by a hash
  const relRealm = id => { try { const p = VM.release().provinces[id]; return p ? p.realm : null; } catch (e) { return null; } };
  const cultOf = id => { const r = relRealm(id), L = typeof LORE !== 'undefined' && LORE.realms && LORE.realms[r]; return L ? L.cult : 'north'; };
  const h32 = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; };
  const STEM = /(ford|ton|bury|ham|ley|wick|by|field|well|worth|dale|bridge|mere|stead|stow|port|mouth|caster|chester|minster|borough|burgh|thorpe|holm|brook|water|hill|wood)$/i;
  const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
  D9.FORM = {
    river: x => 'the River ' + x,
    range: x => 'the ' + x + ' Mountains',
    forest: x => x + ' Forest',
    sea: x => 'the Sea of ' + x,
    pass: x => 'the ' + x + ' Pass',
  };
  // every name of one world, made once: { rivers: [], ranges: [], forests: [], seas: [], passes: [] }
  D9.names = function () {
    const c = D9.ctx(); if (!c) return null;
    const G = c.G; if (G._names) return G._names;
    const taken = new Set(); try { for (const p of A.S.prov) taken.add(p.name); } catch (e) {}
    const pool = (cult, rid) => { try { if (A.NAMES && A.NAMES.ok && A.NAMES.ok()) { const v = A.NAMES.sees(cult, rid); if (v && v.places && v.places.length) return v.places; } } catch (e) {} return null; };
    const fallback = A.S.prov.map(p => p.name).filter(Boolean);
    const one = (kind, i, prov, stem) => {
      const rid = relRealm(prov), list = pool(cultOf(prov), rid) || fallback;
      for (let t = 0; t < 40; t++) {
        let x = list[h32(c.w.key + '|' + kind + '|' + i + '|' + t) % list.length];
        if (stem) { const s = x.replace(STEM, ''); if (s.length >= 3 && s !== x) x = cap(s); }
        const name = D9.FORM[kind](x), pre = kind + ':' + x.slice(0, 5).toLowerCase();
        // not a town's name, not a name given already, and not one too like it ("Eaglefield", "Eaglehill")
        if (!taken.has(x) && !taken.has(name) && (t > 30 || !taken.has(pre))) { taken.add(x); taken.add(name); taken.add(pre); return name; }
      }
      return D9.FORM[kind](list[i % list.length]);
    };
    // each stretch of a long range or a great forest has its own name, as long ranges and great woods do
    const byG = (list, kind) => list.map((r, i) => one(kind, i, r.prov));
    const N = G._names = { rivers: G.rivers.map((r, i) => one('river', i, r.prov, true)), ranges: byG(G.ranges, 'range'),
      forests: byG(G.forests, 'forest'), seas: G.seas.map((r, i) => one('sea', i, r.prov)), passes: G.passes.map((r, i) => one('pass', i, r.prov)) };
    // a river is known by its path: crossings name the river they ford
    N.byPath = new Map(G.rivers.map((r, i) => [r.r, N.rivers[i]]));
    return N;
  };
  D9.passName = i => { const N = D9.names(); return (N && N.passes[i]) || 'the pass'; };
  const placeName = pid => { const P = A.S && A.S.prov && A.S.prov[pid]; return P ? P.name : 'the river'; };
  D9.crossName = function (x) {
    const N = D9.names(), river = N && N.byPath.get(x.river);
    if (x.kind === 'bridge') return river ? `the bridge on ${river}` : `the bridge near ${placeName(x.prov)}`;
    return river ? `the ford on ${river}` : `the ford near ${placeName(x.prov)}`;
  };
})();
