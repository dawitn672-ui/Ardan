// Goods that come from somewhere and go somewhere (Road to Ten, Economy 1-5). In the release each realm's capital has a
// market whose prices drift toward a target set once from the lore's export and import lists, with a fixed seasonal
// swing for grain and a war markup. Nothing is produced, nothing is eaten, and nobody but the player moves goods. Now:
//   1. production: every province makes goods from its land and people (grain from plains, iron from mountains,
//      wool from hills), more where the realm is known for them; grain comes in at harvest, the rest month by month;
//   2. demand: people eat and wear and burn; armies at war eat grain and use up iron, horses and arms; the rich buy
//      luxuries. Each market keeps a stock, and the price follows it: a granary at a tenth of its need triples grain;
//   3. caravans: each month merchants carry goods between neighbouring realms at peace where the price gap pays the
//      road, so prices pull together; war closes the road, and unrest and bandits take a share;
//   4. local prices: away from the capital, what is made in your province is cheaper and what comes from far is dearer;
//   5. chains: towns turn wool into fine cloth, iron and timber into steel, steel into arms, when it pays; the player can
//      own a forge, an armory or a weaving shed, whose income is the spread between its goods.
// The world's production of each good is set to its world demand, so markets neither drown nor starve on their own:
// exporters make more than they eat, importers less, and the caravans carry the difference.
//
// Engine side: the month hook, A.priceTarget, and the player's buying and selling move stocks. Rendering only reads.
(function () {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const E = A.ECON = {
    // loads a month per 10,000 people
    PEOPLE: { grain: 1, fish: 0.3, salt: 0.15, wool: 0.2, linen: 0.15, cloth: 0.03, timber: 0.5, iron: 0.08, steel: 0.02, tin: 0.02,
      horses: 0.02, wine: 0.05, oil: 0.05, dyes: 0.01, arms: 0.01 },
    // loads a month per 10,000 suns of a realm's yearly income (the rich buy what they want)
    WEALTH: { spices: 0.006, silk: 0.004, furs: 0.012, amber: 0.004, pearls: 0.002, ivory: 0.002, wine: 0.01, cloth: 0.01 },
    // loads a month per 1,000 soldiers, at war only
    ARMY: { grain: 0.5, iron: 0.3, steel: 0.1, horses: 0.2, arms: 0.3 },
    // where goods come from: weight by terrain, biome or coast
    LAND: {
      grain: { plains: 4, steppe: 2, hills: 1.2, forest: 0.6, marsh: 0.3, desert: 0.2, mountains: 0.3, tundra: 0.05 },
      fish: { coast: 3, marsh: 1, any: 0.1 },
      salt: { coast: 1, desert: 1.5, marsh: 1, mountains: 0.6, 'Salt flat': 4 },
      wool: { hills: 3, steppe: 2, plains: 1, mountains: 1, tundra: 0.5 },
      linen: { plains: 2, marsh: 1, forest: 0.5, hills: 0.5 },
      timber: { forest: 4, hills: 1, mountains: 1, marsh: 0.5, tundra: 0.5, plains: 0.3, 'Taiga': 2, 'Temperate forest': 1 },
      iron: { mountains: 4, hills: 2, forest: 0.3 },
      tin: { mountains: 2, hills: 1.5 },
      horses: { steppe: 5, plains: 1.5, desert: 1, hills: 0.5 },
      wine: { 'Dry woodland': 3, 'Temperate forest': 0.5, Savanna: 0.5, hills: 0.5 },
      oil: { 'Dry woodland': 3, Savanna: 1, desert: 0.5 },
      spices: { 'Tropical rainforest': 4, desert: 1, Savanna: 1 },
      silk: { 'Tropical rainforest': 2, Savanna: 0.5 },
      furs: { Taiga: 4, Tundra: 3, tundra: 3, forest: 1, mountains: 1 },
      amber: { coast: 0.2 },
      pearls: { coast: 0.2, 'Tropical rainforest': 0.5 },
      ivory: { Savanna: 3, 'Tropical rainforest': 2 },
      dyes: { 'Tropical rainforest': 2, Savanna: 1, plains: 0.3 },
    },
    // what towns make from what: [output, { input: loads per load out }]
    CHAINS: { cloth: { wool: 2, dyes: 0.1 }, steel: { iron: 2, timber: 1 }, arms: { steel: 1, timber: 0.5 } },
    CHAIN_ORDER: ['arms', 'steel', 'cloth'],   // last link first, so each link's need includes the next one's
    MAIN: { cloth: 'wool', steel: 'iron', arms: 'steel' },   // a workshop goes where its main input is made
    // grain comes in at harvest (January first); the twelve shares sum to 12
    HARVEST: [0, 0, 0, 0, 0, 0.4, 1.4, 3.2, 3.6, 2.4, 0.6, 0.4],
    HARVESTS: [[0.25, 1.25, 'a good harvest'], [0.5, 1, 'an ordinary harvest'], [0.2, 0.7, 'a poor harvest'], [0.05, 0.4, 'the harvest failed']],
    NORMAL: {},               // months of need a market keeps in normal times (3, but grain follows the farm year)
    // grain's normal store at the end of each month, in months of need: lowest at the end of June, highest after the
    // harvest. A granary on this path is normal; below it, short.
    GRAIN_N: [7.6, 6.6, 5.6, 4.6, 3.6, 3.0, 3.4, 5.6, 8.2, 9.6, 9.2, 8.6],
    DRIFT: 0.15,
    WAR_SHARE: 0.4,           // share of the world's armies at war in an ordinary year, for sizing what the world makes              // how much faster than the release a price moves toward its target
    ELASTIC: 0.5, LO: 0.6, HI: 4,
    SPOIL: { grain: 0.996, fish: 0.99 }, SPOIL_ALL: 0.998,
    MARGIN: 1.06,             // the world makes a little more of each good than it uses, after spoilage and the harvest's average
    ROAD: 0.06, HOP: 0.02, SEA: 0.04,   // a caravan's cost per load: base price × (ROAD + HOP × steps between capitals), or SEA
    SEA_REACH: 2400,          // coastal realms whose capitals are this close trade by sea
    PER_SRC: 20,              // caravans a market sends in a month
    // where a good comes from by the lore's region (P.region, the Great Continent's far provinces), on top of the land's
    // weight; and how much more of a good a land's people want (r.land: 'R' the Twin Rivers...). Both empty unless a
    // feature fills them (9995-trade-roads does, for the far goods), so a Known World game reads as before
    REGION: {},
    DEMAND_LAND: {},
    RESOLD: {},               // goods a realm's lore exports but only sells on ("silk re-sold from the east"): not made there
  };
  const G = () => GD.GOODS;
  // grain's seasons now come from the harvest, not from a fixed swing in its price
  if (GD.GOODS.grain) GD.GOODS.grain.season = false;

  const live = () => Object.values(A.S.realms).filter(r => r && r.alive && !r.isRebel);
  const atWar = rid => (A.atWar ? A.atWar(rid).length > 0 : false);

  // what a realm uses up in a month, by good: its people, its rich, its armies at war
  E.demand = function (r) {
    const d = {}, pop = (r.pop || 0) / 1e4, inc = (r.income || 0) / 1e4, war = atWar(r.id), army = (r.army || 0) / 1e3;
    for (const k in G()) d[k] = ((E.PEOPLE[k] || 0) * pop + (E.WEALTH[k] || 0) * inc) * landWant(r, k) + (war ? (E.ARMY[k] || 0) * army : 0);
    return d;
  };
  // how much more (or less) of a good a realm's land wants than the world's people do (E.DEMAND_LAND; 1 by default)
  // (a realm with no land of the far lands' ten is the Known World's: 'W')
  const landWant = (r, k) => { const L = E.DEMAND_LAND[k]; if (!L || !r) return 1; const v = L[r.land || 'W']; return v != null ? v : 1; };
  // what it needs in a month: that, plus what its own workshops draw, so its stores and its caravans allow for them
  E.needOf = function (r, d) {
    const n = Object.assign({}, d), m = r.mkt;
    if (m && m.cap) for (const [out, ins] of Object.entries(E.CHAINS)) for (const [g, per] of Object.entries(ins)) n[g] = (n[g] || 0) + (m.cap[out] || 0) * per / 1.25;
    return n;
  };
  // the land's weight for a good in a province
  const landW = (P, k) => {
    const L = E.LAND[k], R = E.REGION[k]; if (!L && !R) return 0;
    let w = L ? (L[P.terr] || 0) + (L[P.biome] || 0) + (P.coast ? L.coast || 0 : 0) + (L.any || 0) : 0;
    if (R && P.region && R[P.region]) w += R[P.region];
    return w;
  };
  // the goods the land makes: E.LAND's, then any that only a region makes (in that order, so a Known World game sums
  // the same goods in the same order as before)
  const landKeys = () => { const ks = Object.keys(E.LAND); for (const k in E.REGION) if (!E.LAND[k] && G()[k]) ks.push(k); return ks; };
  // the world's production of each good, set once to the world's demand in peace, then shared among provinces and towns
  E.plan = function () {
    const S = A.S, rs = live(), worldD = {};
    // in an ordinary year some of the world's armies are at war (WAR_SHARE), and they use their share
    for (const r of rs) { const pop = (r.pop || 0) / 1e4, inc = (r.income || 0) / 1e4, army = (r.army || 0) / 1e3; for (const k in G()) worldD[k] = (worldD[k] || 0) + (E.PEOPLE[k] || 0) * pop + (E.WEALTH[k] || 0) * inc + (E.ARMY[k] || 0) * army * E.WAR_SHARE; }
    // what the land must make: people's own use, plus the inputs of the chains that make the rest
    // down the chains, last link first: arms need steel, and steel needs iron
    const need = Object.assign({}, worldD);
    for (const out of E.CHAIN_ORDER) for (const [g, per] of Object.entries(E.CHAINS[out])) need[g] = (need[g] || 0) + (need[out] || 0) * per;
    const hvMean = E.HARVESTS.reduce((a, h) => a + h[0] * h[1], 0);
    // raw goods from the land
    const wsum = {}, wp = [];
    for (const P of S.prov) {
      const r = A.realm(P.owner); if (!r || !r.alive || r.isRebel) continue;
      const m = A.mkt(r.id), size = Math.sqrt(Math.max(1, P.pop || 1));
      for (const k of landKeys()) {
        let w = landW(P, k) * size;
        if (m.ex.includes(k) && !(E.RESOLD[k] && E.RESOLD[k].includes(P.owner))) w = w * 2.5 + size * 0.3;   // what a realm is known for, it makes (unless it only sells it on)
        if (m.im.includes(k)) w *= 0.4;
        if (w > 0) { wp.push([P, k, w]); wsum[k] = (wsum[k] || 0) + w; }
      }
    }
    for (const r of rs) A.mkt(r.id).pr = {};
    for (const P of S.prov) P.ecoPr = null;
    for (const [P, k, w] of wp) {
      const v = (need[k] || 0) * E.MARGIN / (k === 'grain' ? hvMean : 1) * w / wsum[k];
      const m = A.mkt(P.owner); m.pr[k] = (m.pr[k] || 0) + v;
      (P.ecoPr = P.ecoPr || {})[k] = v;
    }
    // workshops: where their main input is made, and more where the towns are big (forges by the ore, weavers by the
    // sheep), so the valuable goods travel and the bulky ones mostly do not
    const towns = {};
    for (const P of S.prov) if (P.town > 0 && A.realm(P.owner)) towns[P.owner] = (towns[P.owner] || 0) + Math.sqrt(P.town);
    const tw = {};
    for (const r of rs) {
      const m = A.mkt(r.id), t = 1 + (towns[r.id] || 0) / 300;
      tw[r.id] = {};
      for (const k of E.CHAIN_ORDER.slice().reverse()) {   // cloth, steel, then arms (which follows steel)
        const main = E.MAIN[k], have = main === 'steel' ? (tw[r.id].steel || 0) : (m.pr[main] || 0);
        tw[r.id][k] = have * t * (m.ex.includes(k) ? 2.5 : 1) * (r.race === 'dwarf' && (k === 'steel' || k === 'arms') ? 1.5 : 1);
      }
    }
    const tsum = {};
    for (const r of rs) for (const k in E.CHAINS) tsum[k] = (tsum[k] || 0) + tw[r.id][k];
    for (const r of rs) { const m = A.mkt(r.id); m.cap = {}; for (const k in E.CHAINS) m.cap[k] = tsum[k] > 0 ? (need[k] || 0) * 1.25 * tw[r.id][k] / tsum[k] : 0; }
    S.ecoPlan = S.year;
  };
  // normal stock: months of need
  E.months = k => (k === 'grain' ? E.GRAIN_N[A.monthOf(A.today()).m] : E.NORMAL[k] || 3);
  E.normal = (m, k) => Math.max(0.5, ((m.dn || m.d) && (m.dn || m.d)[k] || 0) * E.months(k));
  // the price's answer to the stock
  E.scarcity = function (m, k) {
    if (!m || !m.s || m.s[k] == null) return 1;
    const n = E.normal(m, k), s = m.s[k];
    return clamp(Math.pow(n / Math.max(s, n * 0.05), E.ELASTIC), E.LO, E.HI);
  };
  // start every market at its normal stock
  // a market made before a good existed (a save from before 9995 added the far goods) gets that good at its lore
  // price and its normal store, with no dice: the release's A.mktInit rule (an export at 0.7, an import at 1.35)
  E.fillGoods = function (r, m) {
    const L = (typeof LORE !== 'undefined' && LORE.realms && LORE.realms[r.id]) || {}, ex = String(L.exports || ''), im = String(L.imports || '');
    for (const k in G()) {
      if (m.p[k] != null && m.t[k] != null) continue;
      const g = G()[k]; let f = 1;
      if (g.kw && g.kw.test(ex)) { f = 0.7; if (!m.ex.includes(k)) m.ex.push(k); }
      else if (g.kw && g.kw.test(im)) { f = 1.35; if (!m.im.includes(k)) m.im.push(k); }
      m.t[k] = f; m.p[k] = Math.max(0.2, g.base * f);
    }
  };
  E.init = function () {
    if (A.S.ecoPlan == null) E.plan();
    for (const r of live()) {
      const m = A.mkt(r.id);
      if (m.p && m.t) for (const k in G()) if (m.p[k] == null || m.t[k] == null) { E.fillGoods(r, m); break; }
      m.d = E.demand(r); m.dn = E.needOf(r, m.d);
      if (m.s) for (const k in G()) if (m.s[k] == null) m.s[k] = (m.dn[k] || 0) * E.months(k);
      if (!m.s) { m.s = {}; for (const k in G()) m.s[k] = (m.dn[k] || 0) * E.months(k); }
      m.why = m.why || {};
    }
  };

  // the month
  A.onMonth.push(() => {
    const S = A.S;
    if (!S || !S.prov || !S.prov.length) return;
    if (S.ecoPlan == null || S.year - S.ecoPlan >= 1 && A.monthOf(A.today()).m === 0) E.plan();
    E.init();
    const mo = A.monthOf(A.today()).m;
    // a harvest is rolled for each realm in the spring, and known by summer
    if (mo === 5) for (const r of live()) {
      let x = A.rand(), h = E.HARVESTS[1];
      for (const H of E.HARVESTS) { if (x < H[0]) { h = H; break; } x -= H[0]; }
      const m = A.mkt(r.id); m.hv = { f: h[1], y: S.year, t: h[2] };
      if (h[1] <= 0.4 && A.news) A.news(`The harvest has failed in ${A.realmShort(r.id)}. Bread will be dear by spring.`, 'realm');
    }
    const held = {}, taken = {};
    for (const P of S.prov) { held[P.owner] = (held[P.owner] || 0) + 1; if (P.occ || P.sgBy) taken[P.owner] = (taken[P.owner] || 0) + 1; }
    E._tc = null;   // stocks are about to change: targets are worked out afresh
    for (const r of live()) {
      const m = A.mkt(r.id), d = m.d = E.demand(r), why = m.why = {};
      m.dn = E.needOf(r, d);
      const hv = m.hv && m.hv.y === S.year ? m.hv.f : 1;
      // production: the land, less what war takes
      const warCut = 1 - 0.5 * (taken[r.id] || 0) / Math.max(1, held[r.id] || 1);
      for (const k in G()) {
        let made = (m.pr && m.pr[k] || 0) * warCut;
        if (k === 'grain') made = made * E.HARVEST[mo] * hv;
        m.s[k] = (m.s[k] || 0) + made - (d[k] || 0);
        why[k] = { made: Math.round(made), used: Math.round(d[k] || 0) };
      }
      // chains: towns turn inputs into goods when it pays
      for (const k in E.CHAINS) {
        const cap = m.cap && m.cap[k] || 0; if (!cap) continue;
        const ins = E.CHAINS[k];
        const cost = Object.entries(ins).reduce((a, [g, q]) => a + q * m.p[g], 0);
        if (m.p[k] < cost * 1.05) continue;   // it does not pay
        let q = cap;
        for (const [g, per] of Object.entries(ins)) q = Math.min(q, Math.max(0, m.s[g] - E.normal(m, g) * 0.1) / per);
        if (q <= 0) continue;
        for (const [g, per] of Object.entries(ins)) m.s[g] -= q * per;
        m.s[k] += q; why[k].made = (why[k].made || 0) + Math.round(q);
      }
      // what is kept spoils a little; nothing is less than nothing
      for (const k in G()) m.s[k] = clamp(m.s[k] * (E.SPOIL[k] || E.SPOIL_ALL), 0, E.normal(m, k) * 8);
      // prices follow their target a little faster than the release's drift, so a famine bites within a season
      E._tc = null;
      for (const k in G()) { const t = A.priceTarget(r, k); m.p[k] = Math.max(0.2, m.p[k] + (t - m.p[k]) * E.DRIFT); }
    }
    E.caravans();
  });

  // caravans: merchants send goods from any market to any other at peace where the price beats the road. The road's
  // cost grows with the distance between capitals (cheaper by sea between coastal realms), and so does the risk of
  // losing goods to bandits, more where either realm is in unrest. Each market sends at most PER_SRC caravans a month.
  // the road between two markets, from a table built once a year: its cost per load (as a share of the good's base
  // price), the distance, and whether it goes by sea
  E.roads = function (rs) {
    const S = A.S, key = S.year + ':' + rs.map(r => r.id).join(',');
    if (E._roads && E._roads.key === key && E._roads.S === S) return E._roads;
    const n = rs.length, f = new Float64Array(n * n), dist = new Float64Array(n * n), sea = new Uint8Array(n * n), idx = {};
    const coast = rs.map(r => S.prov.some(P => P.owner === r.id && P.coast));
    rs.forEach((r, i) => { idx[r.id] = i; });
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const a = rs[i], b = rs[j];
      let d = 3000;
      if (a.capitalProv != null && b.capitalProv != null && A.wsDist) d = A.wsDist(a.capitalProv, b.capitalProv);
      const s2 = d <= E.SEA_REACH && coast[i] && coast[j], steps = d / 250;
      f[i * n + j] = s2 ? E.SEA + E.HOP * steps * 0.5 : E.ROAD + E.HOP * steps;
      dist[i * n + j] = d; sea[i * n + j] = s2 ? 1 : 0;
    }
    // each market's roads, cheapest first (ties by index): the caravans stop looking where no price could pay the road
    const near = [];
    for (let i = 0; i < n; i++) { const L = []; for (let j = 0; j < n; j++) if (j !== i) L.push(j); L.sort((a, b) => f[i * n + a] - f[i * n + b] || a - b); near.push(L); }
    return (E._roads = { S, key, n, f, dist, sea, idx, near });
  };
  E.road = function (a, b) {
    const rs = live(), T = E.roads(rs), i = T.idx[a], j = T.idx[b];
    if (i == null || j == null) return { f: E.ROAD + E.HOP * 12, dist: 3000, sea: false };
    const x = i * T.n + j;
    return { f: T.f[x], dist: T.dist[x], sea: !!T.sea[x] };
  };
  E.caravans = function () {
    // on the lore's roads (9995-trade-roads, a Great Continent game) goods go hand to hand along the roads and take
    // months on the way; this month's departures and arrivals come back in one list
    if (E.roadMode && E.roadMode()) return E.roadMonth();
    const S = A.S, eco = S.eco = S.eco || {}, car = [], rs = live(), T = E.roads(rs), N = T.n;
    const cands = [], war = new Int8Array(N * N);   // 0 not yet asked, 1 at peace, 2 at war: asked once a month
    const atPeace = (si, di) => { const x = si < di ? si * N + di : di * N + si; if (!war[x]) war[x] = A.hostile && A.hostile(rs[si].id, rs[di].id) ? 2 : 1; return war[x] === 1; };
    // a destination pays only if its price beats the source's by more than the road: no price anywhere is above the
    // dearest, so a source walks its roads cheapest first and stops at the first road the dearest price could not pay
    // (the same candidates as asking every market, which cost markets² × goods a month on a large map). Each candidate
    // keeps its place in the old order (source, good, destination), so equal scores sort as before.
    const Gs = G(), ks = []; for (const k in Gs) ks.push(k);
    const NK = ks.length, top = {};
    for (const k of ks) { let m = -Infinity; for (let di = 0; di < N; di++) { const md = rs[di].mkt; if (md && md.p[k] > m) m = md.p[k]; } top[k] = m; }
    for (let si = 0; si < N; si++) {
      const src = rs[si], ms = A.mkt(src.id), near = T.near[si];
      for (let ki = 0; ki < NK; ki++) {
        const k = ks[ki], base = Gs[k].base;
        const spare = ms.s[k] - E.normal(ms, k) * 0.8; if (!(spare > 1)) continue;
        const floor = ms.p[k] * 1.1 + base * E.SEA;   // no road is cheaper than this
        const reach = (top[k] - ms.p[k] * 1.1) / base, lim = reach + Math.abs(reach) * 1e-9 + 1e-9;
        for (const di of near) {
          const x = si * N + di;
          if (T.f[x] > lim) break;
          const dst = rs[di], md = dst.mkt; if (!md || !(md.p[k] > floor)) continue;
          const gain = md.p[k] - ms.p[k] - base * T.f[x] - ms.p[k] * 0.1;
          if (!(gain > 0)) continue;
          if (!atPeace(si, di)) continue;   // war closes the road
          cands.push({ src, dst, ms, md, k, score: gain / base, R: { dist: T.dist[x], sea: !!T.sea[x] }, o: (si * NK + ki) * N + di });
        }
      }
    }
    cands.sort((x, y) => y.score - x.score || x.o - y.o);
    const sent = {};
    for (const c of cands) {
      if ((sent[c.src.id] || 0) >= E.PER_SRC) continue;
      const want = E.normal(c.md, c.k) * 1.2 - c.md.s[c.k], spare = c.ms.s[c.k] - E.normal(c.ms, c.k) * 0.8;
      let q = Math.min(spare, want, Math.max(E.normal(c.md, c.k) * 0.3, E.normal(c.ms, c.k) * 0.15));
      if (!(q > 0.5)) continue;
      sent[c.src.id] = (sent[c.src.id] || 0) + 1;
      c.ms.s[c.k] -= q;
      // bandits on long roads and in unrest
      const st = Math.min(c.src.stability || 50, c.dst.stability || 50);
      let lost = 0;
      if (A.chance(Math.min(0.5, Math.pow(1 - st / 100, 2) * c.R.dist / 6000 * (c.R.sea ? 0.5 : 1)))) { lost = q * A.rf(0.15, 0.4); q -= lost; }
      c.md.s[c.k] += q;
      car.push({ f: c.src.id, t: c.dst.id, k: c.k, n: Math.round(q), lost: Math.round(lost), sea: c.R.sea ? 1 : 0, y: S.year, m: A.monthOf(A.today()).m });
    }
    eco.car = car.slice(0, 300);
    eco.carN = car.length;
    return car;
  };

  // prices answer the stock. A target is worked out once a month for each market and good (the release's drift and
  // this feature's both ask for it)
  const target = A.priceTarget;
  A.priceTarget = function (r, k) {
    // keyed by the game itself and the month, so a new game or a loaded save never reads another world's targets
    const S = A.S, mo = Math.floor(A.absDay() / 30), c = E._tc && E._tc.S === S && E._tc.mo === mo ? E._tc : (E._tc = { S, mo, v: {} }), key = r && r.id + k;
    if (key && c.v[key] != null) return c.v[key];
    let v = target.apply(this, arguments);
    try { const m = r && r.mkt; if (m && m.s) v *= E.scarcity(m, k); } catch (e) {}
    if (key) c.v[key] = v;
    return v;
  };

  // the player's trading moves stock: buying takes from the home market, selling adds to the market sold in
  const buy = A.buyGood;
  A.buyGood = function (k, n) {
    const pc = A.pc(), before = (A.cargo(pc)[k] || 0), r = buy.apply(this, arguments);
    try { const got = (A.cargo(pc)[k] || 0) - before, m = A.mkt(A.homeMkt(pc)); if (got > 0 && m && m.s) m.s[k] = Math.max(0, (m.s[k] || 0) - got); } catch (e) {}
    return r;
  };
  const sell = A.sellGood;
  A.sellGood = function (k, n, rid) {
    const pc = A.pc(), before = (A.cargo(pc)[k] || 0), r = sell.apply(this, arguments);
    try { const gone = before - (A.cargo(pc)[k] || 0), m = A.mkt(rid || A.homeMkt(pc)); if (gone > 0 && m && m.s) m.s[k] = (m.s[k] || 0) + gone; } catch (e) {}
    return r;
  };

  // a market's depth for one good: how many loads it takes before each more moves the price, from what the market
  // uses of that good in a month (A.mktDepth(rid) alone is the release's, by the market's people)
  const depth = A.mktDepth;
  A.mktDepth = function (rid, k) {
    const d = depth.apply(this, arguments);
    if (!k) return d;
    try { const m = A.mkt(rid); if (m && m.dn && m.dn[k] != null) return Math.min(d, clamp(m.dn[k] * 1.5, 0.6, 40)); } catch (e) {}
    return d;
  };

  // the player's trade runs pay the road too: carts, fodder and inns, per load and by distance, the same as the
  // caravans (the release charged only tolls and risk, so every gap the caravans could not close was free money)
  E.haul = function (home, dest, cargo) {
    const R = E.road(home, dest);
    let c = 0;
    for (const k in cargo || {}) c += (cargo[k] || 0) * G()[k].base * R.f;
    return Math.round(c);
  };
  const plan = A.runPlan;
  A.runPlan = function (dest) {
    const P = plan.apply(this, arguments);
    try { if (P) { const pc = A.pc(); P.haul = E.haul(P.home, dest, A.cargo(pc)); P.net -= P.haul; } } catch (e) {}
    return P;
  };
  const run = A.tradeRun;
  A.tradeRun = function (dest) {
    const pc = A.pc(), home = A.homeMkt(pc), before = Object.assign({}, A.cargo(pc)), coin = pc.coin;
    const r = run.apply(this, arguments);
    try {
      if (r && r.ok) {
        // what went out, and what came back
        const back = {};
        for (const k in A.cargo(pc)) { const d = (A.cargo(pc)[k] || 0) - (before[k] || 0); if (d > 0) back[k] = d; }
        const haul = E.haul(home, dest, before) + E.haul(home, dest, back);
        if (haul > 0) { pc.coin -= haul; A.log(`Carters, fodder and inns on the road: ${A.coin(haul)}.`, 'warn'); }
      }
    } catch (e) { console.error('economy haul', e); }
    return r;
  };

  // local prices: distance from the capital, and what your own province makes
  E.localHops = function (P) {
    const r = P && A.realm(P.owner); if (!r || r.capitalProv == null || !A.wsDist) return 0;
    return Math.round(A.wsDist(P.id, r.capitalProv) / 250);
  };
  E.local = function (P, k) {
    if (!P) return 1;
    const made = P.ecoPr && P.ecoPr[k] || 0, m = A.mkt(P.owner), total = m && m.pr && m.pr[k] || 0;
    const share = total > 0 ? made / total : 0, n = Math.max(1, A.realmProvs(P.owner).length);
    if (share > 1.5 / n) return 0.85;   // made here, more than this province's share of the realm
    return 1 + 0.025 * Math.min(8, E.localHops(P));
  };
  for (const f of ['buyPrice', 'sellPrice']) {
    const base = A[f];
    A[f] = function (rid, k, pc) {
      const v = base.apply(this, arguments);
      try { const p = pc || A.pc(); if (p && rid === A.homeMkt(p)) { const P = A.prov(p.home); if (P && P.owner === rid) return v * E.local(P, k); } } catch (e) {}
      return v;
    };
  }

  // workshops at a link of a chain: their income is the spread at your home market (pure)
  E.SHOPS = { forge: ['steel', 'Forge (iron and charcoal into steel)', 600, 15], armory: ['arms', 'Armory (steel into arms)', 900, 20], weavery: ['cloth', 'Weaving shed (wool into fine cloth)', 500, 12] };
  E.shopYear = function (k, pc) {
    const [out] = E.SHOPS[k], p = pc || A.pc(), rid = p ? A.homeMkt(p) : null, m = rid && A.mkt(rid);
    if (!m) return 0;
    // a workshop buys and sells at the market's own price, not over the counter
    const ins = E.CHAINS[out], cost = Object.entries(ins).reduce((a, [g, q]) => a + q * m.p[g], 0);
    return Math.round(24 * (m.p[out] - cost));   // two loads a month
  };
  for (const [k, [out, name, price, upkeep]] of Object.entries(E.SHOPS)) {
    if (GD.PROPERTY[k]) continue;
    GD.PROPERTY[k] = { name, price, upkeep, comfort: 2, get income() { try { return E.shopYear(k); } catch (e) { return 0; } } };
  }

  // the market table: the stock in words, and why (pure)
  E.word = function (m, k) {
    if (!m || !m.s) return '';
    const r = m.s[k] / E.normal(m, k);
    return r < 0.15 ? 'famine' : r < 0.4 ? 'scarce' : r < 0.8 ? 'short' : r < 2 ? 'ample' : 'glut';
  };
  E.why = function (rid, k) {
    const r = A.realm(rid), m = r && r.mkt; if (!m || !m.s) return '';
    const w = m.why && m.why[k] || {}, n = E.normal(m, k), months = (m.s[k] / Math.max(0.01, m.d[k] || 0.01));
    const bits = [`${E.word(m, k)}: ${months >= 1 ? Math.round(months) : '<1'} months of need in store`];
    if (w.made != null) bits.push(`${w.made} loads made and ${w.used} used last month`);
    if (k === 'grain' && m.hv && m.hv.y === A.S.year) bits.push(m.hv.t);
    if (atWar(rid) && E.ARMY[k]) bits.push(`armies at war use ${Math.round(E.ARMY[k] * (r.army || 0) / 1e3)} a month`);
    // a caravan on the roads (9995) is listed when it sets out (dep) and when it arrives (arr); without either it did both
    const cs = ((A.S.eco || {}).car || []).filter(c => c.k === k && (c.f === rid || c.t === rid));
    const inn = cs.filter(c => c.t === rid && !c.dep).reduce((a, c) => a + c.n, 0), out = cs.filter(c => c.f === rid && !c.arr).reduce((a, c) => a + c.n, 0);
    if (inn) bits.push(`caravans brought ${inn}`);
    if (out) bits.push(`caravans took ${out} away`);
    return bits.join('; ') + '.';
  };
  E.card = function (rid) {
    const cs = ((A.S.eco || {}).car || []).filter(c => (c.f === rid && !c.arr) || (c.t === rid && !c.dep)).slice(0, 6);
    const m = A.mkt(rid), hv = m && m.hv && m.hv.y === A.S.year ? m.hv.t : null;
    if (!cs.length && !hv) return '';
    const line = c => c.t === rid ? `${c.n} loads of ${G()[c.k].name.toLowerCase()} in from ${A.realmShort(c.f)}${c.mo ? `, ${c.mo} months on the road` : ''}${c.lost ? ` (${c.lost} lost on the road)` : ''}` : `${c.n} loads of ${G()[c.k].name.toLowerCase()} out to ${A.realmShort(c.t)}${c.mo ? `, ${c.mo} months away` : ''}`;
    return `<div class="tiny muted" style="margin-top:6px">${hv ? UI.esc(`This year: ${hv}. `) : ''}${cs.length ? UI.esc('Caravans this month: ' + cs.map(line).join('; ') + '.') : ''}</div>`;
  };
})();
