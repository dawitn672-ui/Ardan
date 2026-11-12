// Market towns with distance pricing (Road to Ten, Economy 4). 45-economy gave each realm one stocked market, at its
// capital, and priced the provinces by a fixed rule (what a province makes 15% cheaper, other goods 2.5% dearer a step
// out). Now each realm has one to four market towns (the capital and its largest towns, cities and ports), each with
// its own stock of every good:
//   1. a town's hinterland (the provinces nearest it) makes its goods, and its people and the armies camped near it eat
//      them, so a town in the wheat country is full of grain and a mining town is not;
//   2. carters move goods between a realm's towns wherever the price gap pays the road (by land per step and by terrain,
//      cheaper by sea between coastal towns), and bandits take a share where the realm is in unrest. Prices settle into
//      gradients: dear far from where a good is made, cheap near it, the difference no more than the carting;
//   3. 45's caravans between realms leave from the town with goods to spare and arrive at the town where the good
//      fetches most after the road, so a dear capital draws them and a town far down the road waits for the carters;
//   4. a besieged or occupied town is cut off: its fields bring little to market, nothing is carted in, and it eats
//      its store;
//   5. the player trades at their nearest market town, and can carry a cargo to any of the five nearest (in the realm
//      or across the border), paying carts and inns per load and by distance, both ways.
// The realm's stock is the sum of its towns' stocks: 45's month runs on the realm as before, and this one shares out
// what 45 made, used, built and carried among the towns. The realm's price is 45's; a town's price is the realm's times
// how its own stock stands against its own need, compared with the realm's.
//
// Engine side: the month hook, the caravan wrapper and the trading actions move stocks. Rendering only reads, and draws
// no random numbers. The month draws none either (bandits on the carters' roads take their expected share), so the
// random stream is 45's.
(function () {
  if (!A.mkt || !A.ECON) return;   // needs 45-economy
  const E = A.ECON, G = () => GD.GOODS, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const MT = A.MT = {
    // what makes a market town: its kind, its size, its development, a harbour
    TYPE: { 'capital city': 4, city: 3, 'market town': 3, caravanserai: 2.5, town: 1.5, 'yam station': 1.5, 'dwarven hold': 1.5, oasis: 1, castle: 0.5, monastery: 0.5, 'ring-fort': 0.5, 'gate-fort': 0.5, 'giant hall': 0.5 },
    MIN_SCORE: 4, MAX: 4, PER: 4,   // a realm of n provinces has 1.5 + n / PER markets (2 to MAX; 1 for one province)
    // carting, as a share of the good's base price per load: inside a realm HAUL0 + HOP a step; to another realm 45's
    // ROAD in place of HAUL0. A step is 250 map units, longer over hills (1.3), forest, marsh and mountains (1.8). By
    // sea between coastal towns: SEA0 (45's SEA abroad) + half a step's HOP per 250 units
    HAUL0: 0.03, HOP: 0.03, SEA0: 0.03,   // HOP was 0.02: in the integrated world (round 7) the gradient four steps out fell to x1.03, too mild to see (2.5% read x1.00: the gradient is jumpy on 3 worlds)
    ABS0: 0.2, ABS: 0.2,   // and never less than 0.2 suns a load plus 0.2 a step (a load of grain is worth 4)
    TERR: { plains: 1, steppe: 1, hills: 1.3, forest: 1.2, marsh: 1.5, mountains: 1.8, desert: 1.4, tundra: 1.4 },
    RLO: 0.55, RHI: 2.6,   // a town's price against its realm's
    DAMP: 0.9,             // carters move nine tenths of the load that would close the gap down to the carting each
                           // month, or all a town can spare when that would not close it (at a half, a town that makes
                           // a good kept twice its month's output, and the gradients ran well past the carting)
    KEEP: 0.4,             // and leave a town at least this share of its normal store
    CUT: 0.3,              // what a besieged or occupied province still brings to market
    NEAR: 5,               // towns shown and reachable for the player
  };
  const live = () => Object.values(A.S.realms).filter(r => r && r.alive && !r.isRebel);
  const liveR = rid => { const r = A.realm(rid); return r && r.alive && !r.isRebel ? r : null; };
  // stores in the state are kept short: whole loads above 100, tenths above 10, hundredths below
  const rnd = v => (v >= 100 ? Math.round(v) : v >= 10 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100);

  MT.on = () => { const S = A.S; return !!(S && S.mt && S.mt.L && S.mt.L.length && S.prov); };
  const T = pid => A.S.mt.T[pid];
  MT.name = pid => (A.prov(pid) || {}).name || '';
  MT.cutOff = P => !!(P && (P.occ || P.sgBy));   // a province cut off by siege or occupation
  const shut = P => MT.cutOff(P);
  MT.shut = pid => shut(A.prov(pid));
  // a town's store and need share of each good live in arrays, in the order of S.mt.K
  let KI = null;
  const kix = () => { const K = A.S.mt.K; if (!KI || KI.K !== K) { KI = { K, ix: {} }; K.forEach((k, i) => { KI.ix[k] = i; }); } return KI.ix; };
  MT.s = (pid, k) => { const t = T(pid), i = kix()[k]; return t && t.s && i != null ? t.s[i] || 0 : 0; };
  const setS = (pid, k, v) => { const t = T(pid), i = kix()[k]; if (t && t.s && i != null) t.s[i] = v; };
  const nOf = (pid, k) => { const t = T(pid), i = kix()[k]; return t && t.n && i != null && t.n[i] != null ? t.n[i] : (t && t.w) || 0; };

  // ---- the roads: shortest paths over provinces from each market town (a pure function of the map)
  let adj = null, paths = null;
  const heapPush = (h, c, v) => { h.push([c, v]); let i = h.length - 1; while (i) { const p = (i - 1) >> 1; if (h[p][0] <= h[i][0]) break; [h[p], h[i]] = [h[i], h[p]]; i = p; } };
  const heapPop = h => { const top = h[0], last = h.pop(); if (h.length) { h[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < h.length && h[l][0] < h[m][0]) m = l; if (r < h.length && h[r][0] < h[m][0]) m = r; if (m === i) break; [h[m], h[i]] = [h[i], h[m]]; i = m; } } return top; };
  const graph = () => {
    const S = A.S;
    if (adj && adj.prov === S.prov) return adj;
    const nb = [], w = [], len = [];
    for (const P of S.prov) {
      const land = P.adj || [], all = land.concat((P.sea || []).filter(x => !land.includes(x))), a = [], b = [], c = [];
      for (const v of all) { const Q = S.prov[v]; if (!Q) continue; const d = A.wsDist(P.id, v); a.push(v); c.push(d); b.push(d / 250 * (land.includes(v) ? (MT.TERR[Q.terr] || 1.2) : 0.5) * (MT.roadF ? MT.roadF(P.id, v) : 1)); }   // MT.roadF: a great route's step costs less (99-far-lands; 1 elsewhere)
      nb.push(a); w.push(b); len.push(c);
    }
    paths = new Map();
    return (adj = { prov: S.prov, nb, w, len });
  };
  // steps and length of road from market town pid to every province
  MT.path = function (pid) {
    const g = graph();
    let p = paths.get(pid); if (p) return p;
    const N = g.nb.length, d = new Float64Array(N).fill(Infinity), len = new Float64Array(N).fill(Infinity), h = [];
    d[pid] = 0; len[pid] = 0; heapPush(h, 0, pid);
    while (h.length) {
      const [c, u] = heapPop(h); if (c > d[u]) continue;
      const nb = g.nb[u], w = g.w[u], ln = g.len[u];
      for (let i = 0; i < nb.length; i++) { const v = nb[i], c2 = c + w[i]; if (c2 < d[v]) { d[v] = c2; len[v] = len[u] + ln[i]; heapPush(h, c2, v); } }
    }
    paths.set(pid, p = { d, len });
    return p;
  };
  // the road between two market towns: its carting cost per load (a share of the base price), steps, km, days, by sea
  let roadMemo = null;
  MT.road = function (a, b) {
    const mt = A.S.mt, key = a * 65536 + b;   // unique for any Int16 province id (4096 capped the map at 4,096 provinces)
    if (!roadMemo || roadMemo.mt !== mt || roadMemo.ver !== mt.ver || roadMemo.prov !== A.S.prov) roadMemo = { mt, ver: mt.ver, prov: A.S.prov, m: new Map() };
    // remembered for the same towns and owners (a pure function of the map and who holds the two towns)
    const Pa = A.prov(a), Pb = A.prov(b), own = Pa && Pb ? Pa.owner + '|' + Pb.owner : '', hit = roadMemo.m.get(key);
    if (hit && hit.own === own) return hit.R;
    const R = roadOf(a, b); roadMemo.m.set(key, { own, R });
    return R;
  };
  const roadOf = function (a, b) {
    const Pa = A.prov(a), Pb = A.prov(b); if (!Pa || !Pb || a === b) return null;
    const p = MT.path(a), foreign = Pa.owner !== Pb.owner;
    let st = p.d[b], f = (foreign ? E.ROAD : MT.HAUL0) + MT.HOP * st, sea = false, km = p.len[b] * 0.9;
    if (Pa.coast && Pb.coast) {
      const d = A.wsDist(a, b);
      if (d <= E.SEA_REACH) { const fs = (foreign ? E.SEA : MT.SEA0) + MT.HOP * 0.5 * d / 250; if (fs < f) { f = fs; sea = true; km = d * 0.9; st = d / 250 * 0.5; } }
    }
    if (!isFinite(f)) return null;
    return { f, sea, steps: Math.round(st * 10) / 10, km: Math.round(km), days: Math.max(2, Math.round(km / (sea ? 100 : 30))) };
  };

  // what carting one load costs on a road: a share of the good's worth, but never less than the mules, fodder and
  // inns a load needs whatever it is (so grain and timber are dear to cart and pearls are not)
  MT.cartCost = (k, R) => Math.max(G()[k].base * R.f, MT.ABS0 + MT.ABS * R.steps);

  // ---- which provinces are market towns, and whose hinterland is whose (kept in the state; rebuilt when owners change)
  const score = P => (MT.TYPE[P.type] || 0) + Math.log10(1 + (P.town || 0)) * 0.4 + (P.dev || 0) * 0.25 + (P.coast ? 0.75 : 0);
  const sigOf = S => { let h = 7; for (const P of S.prov) { const o = String(P.owner); for (let i = 0; i < o.length; i++) h = (h * 31 + o.charCodeAt(i)) | 0; h = (h * 31 + 1) | 0; } for (const r of live()) h = (h * 31 + (r.capitalProv || 0)) | 0; return h; };
  MT.choose = function () {
    const out = [];
    for (const r of live()) {
      const ps = A.realmProvs(r.id); if (!ps.length) continue;
      const want = ps.length <= 1 ? 1 : clamp(Math.round(1.5 + ps.length / MT.PER), 2, MT.MAX);
      const byScore = ps.slice().sort((a, b) => score(b) - score(a) || a.id - b.id);
      const chosen = [ps.find(P => P.id === r.capitalProv) || byScore[0]];
      for (const P of byScore) {
        if (chosen.length >= want) break;
        if (chosen.includes(P) || score(P) < MT.MIN_SCORE) continue;
        // two lesser towns side by side make one market; cities may stand next to each other
        if ((MT.TYPE[P.type] || 0) < 3 && chosen.some(Q => (Q.adj || []).includes(P.id))) continue;
        chosen.push(P);
      }
      for (const P of chosen) out.push(P.id);
    }
    return out.sort((a, b) => a - b);
  };
  MT.build = function () {
    const S = A.S, old = S.mt && S.mt.K && S.mt.T || {}, oldK = S.mt && S.mt.K, L = MT.choose(), Tn = {}, K = Object.keys(G());
    for (const pid of L) {
      const P = A.prov(pid), o = old[pid];
      if (o && o.r === P.owner && o.s && oldK) {
        // a town that stays keeps its store (re-ordered if the goods changed)
        const s = K.map(k => { const i = oldK.indexOf(k); return i >= 0 ? o.s[i] || 0 : 0; }), n = K.map(k => { const i = oldK.indexOf(k); return i >= 0 ? o.n[i] : o.w; });
        Tn[pid] = { r: P.owner, s, n, w: o.w || 0, h: {} };
      } else Tn[pid] = { r: P.owner, s: null, n: [], w: 0, h: {} };
    }
    S.mt = { v: 1, sig: sigOf(S), K, L, T: Tn, of: [], ver: ((S.mt && S.mt.ver) || 0) + 1 };
    const by = MT.byRealm();
    S.mt.of = S.prov.map(P => {
      const ts = by[P.owner]; if (!ts || !ts.length) return -1;
      let best = ts[0], bd = Infinity;
      for (const t of ts) { const d = MT.path(t).d[P.id]; if (d < bd) { bd = d; best = t; } }
      return best;
    });
  };
  let byR = null;
  MT.byRealm = function () {
    const mt = A.S.mt;
    if (byR && byR.mt === mt && byR.ver === mt.ver && byR.L === mt.L) return byR.v;
    const v = {};
    for (const pid of mt.L) (v[mt.T[pid].r] = v[mt.T[pid].r] || []).push(pid);
    byR = { mt, ver: mt.ver, L: mt.L, v };
    return v;
  };
  MT.capTown = function (rid) {
    const ts = MT.byRealm()[rid]; if (!ts || !ts.length) return null;
    const r = A.realm(rid);
    return r && ts.includes(r.capitalProv) ? r.capitalProv : ts[0];
  };
  MT.townOf = function (P) {
    if (!P) return null;
    const t = A.S.mt.of[P.id];
    return t != null && t >= 0 && T(t) && T(t).r === P.owner ? t : MT.capTown(P.owner);
  };
  // the player's market town: the one nearest home, in the realm whose market they use
  MT.here = function (pc) {
    pc = pc || A.pc(); if (!pc) return null;
    const rid = A.homeMkt(pc), P = A.prov(pc.home);
    if (P && P.owner === rid) return MT.townOf(P);
    return MT.capTown(rid);
  };

  // ---- the price at a town: the realm's (45's), times how the town's store stands against the town's need, compared
  // with how the realm's stands against the realm's
  MT.need = (pid, k) => { const nm = E.normal(A.mkt(T(pid).r), k); return Math.max(nm * nOf(pid, k), nm * 0.01); };
  const relOf = (N, s, scR) => { const x = N / Math.max(s, N * 0.05); return clamp(clamp(E.ELASTIC === 0.5 ? Math.sqrt(x) : Math.pow(x, E.ELASTIC), E.LO, E.HI) / scR, MT.RLO, MT.RHI); };
  MT.rel = function (pid, k) {
    const t = pid != null && T(pid); if (!t || !t.s) return 1;
    const m = A.mkt(t.r); if (!m || !m.s) return 1;
    return relOf(MT.need(pid, k), MT.s(pid, k), E.scarcity(m, k));
  };
  MT.price = function (rid, k, pc) { const pid = MT.townFor(rid, pc); return A.mkt(rid).p[k] * (pid != null ? MT.rel(pid, k) : 1); };
  MT.word = function (pid, k) {
    const t = T(pid); if (!t || !t.s) return '';
    const r = MT.s(pid, k) / MT.need(pid, k);
    return r < 0.15 ? 'famine' : r < 0.4 ? 'scarce' : r < 0.8 ? 'short' : r < 2 ? 'ample' : 'glut';
  };
  // which town of realm rid a price is asked for: the town a trip is at, the player's own, or the capital's
  let at = null;
  MT.townFor = function (rid, pc) {
    if (!MT.on()) return null;
    if (at != null && T(at) && T(at).r === rid) return at;
    const p = pc || A.pc();
    if (p && rid === A.homeMkt(p)) { const h = MT.here(p); if (h != null) return h; }
    return MT.capTown(rid);
  };
  MT.at = function (pid, fn) { const keep = at; at = pid; try { return fn(); } finally { at = keep; } };

  // ---- the month: share out what 45 made, used, built and carried; then the carters
  // more markets, more merchants: 45's one market a realm sent at most 20 caravans a month, and left its most
  // profitable gaps open (Varenna's cloth at 0.44 of its base price, Aldmark's and Solenne's at 1.5 to 1.6); with
  // about 2.6 market towns a realm the cap is 40 (45 reads one cap for every realm)
  if (E.PER_SRC === 20) E.PER_SRC = 40;
  let carLog = null, base = null;
  const caravans = E.caravans;
  E.caravans = function () {
    const car = caravans.apply(this, arguments);
    try { if (MT.on()) carLog = { S: A.S, list: car }; } catch (e) {}
    return car;
  };
  MT.month = function () {
    const S = A.S;
    if (!S || !S.prov || !S.prov.length) return;
    const rs = live(); if (!rs.length || !rs[0].mkt || !rs[0].mkt.s) return;
    const ks = Object.keys(G());
    if (!S.mt || S.mt.v !== 1 || !S.mt.L || !S.mt.K || S.mt.K.join() !== ks.join() || S.mt.sig !== sigOf(S)) MT.build();
    const by = MT.byRealm(), mo = A.monthOf(A.today()).m, of = S.mt.of, ix = kix(), nk = ks.length;
    // hinterland production, people and armies, by town
    // what each town's hinterland makes in a full month, worked out when 45 plans the year's production or the towns
    // change (both in the state, so a loaded save works it out the same); then this month's harvest, and what siege
    // and occupation keep from market
    const key = S.ecoPlan + ':' + S.mt.ver;
    if (!base || base.S !== S || base.key !== key || base.mt !== S.mt) {
      const rows = {};
      for (const pid of S.mt.L) rows[pid] = new Float64Array(nk);
      for (const P of S.prov) {
        const t = of[P.id]; if (t == null || t < 0 || !rows[t] || T(t).r !== P.owner || !P.ecoPr) continue;
        for (const k in P.ecoPr) { const i = ix[k]; if (i != null) rows[t][i] += P.ecoPr[k]; }
      }
      base = { S, key, mt: S.mt, rows };
    }
    const made = {}, pop = {}, men = {}, cut = {}, gi = ix.grain;
    for (const pid of S.mt.L) {
      const row = made[pid] = Float64Array.from(base.rows[pid]), m = A.mkt(T(pid).r), hv = m && m.hv && m.hv.y === S.year ? m.hv.f : 1;
      if (gi != null) row[gi] *= E.HARVEST[mo] * hv;
      pop[pid] = 0; men[pid] = 0; cut[pid] = MT.shut(pid);
    }
    for (const P of S.prov) {
      const t = of[P.id]; if (t == null || t < 0 || !made[t] || T(t).r !== P.owner) continue;
      pop[t] += P.pop || 0;
      if (!shut(P) || !P.ecoPr) continue;
      const m = A.mkt(P.owner), hv = m.hv && m.hv.y === S.year ? m.hv.f : 1;
      for (const k in P.ecoPr) { const i = ix[k]; if (i != null) made[t][i] = Math.max(0, made[t][i] - P.ecoPr[k] * (1 - MT.CUT) * (i === gi ? E.HARVEST[mo] * hv : 1)); }
    }
    // a town cut off gets only what its own fields bring in; the rest of its hinterland sells at the nearest open town
    for (const pid of S.mt.L) {
      if (!cut[pid]) continue;
      const P = A.prov(pid), own = new Float64Array(nk);
      if (P.ecoPr) { const m = A.mkt(P.owner), hv = m && m.hv && m.hv.y === S.year ? m.hv.f : 1; for (const k in P.ecoPr) { const i = ix[k]; if (i != null) own[i] = P.ecoPr[k] * MT.CUT * (i === gi ? E.HARVEST[mo] * hv : 1); } }
      const p = MT.path(pid); let to = null, bd = Infinity;
      for (const t of by[T(pid).r] || []) if (!cut[t] && p.d[t] < bd) { bd = p.d[t]; to = t; }
      for (let i = 0; i < nk; i++) { const rest = Math.max(0, made[pid][i] - own[i]); if (to != null) made[to][i] += rest; made[pid][i] = Math.min(made[pid][i], own[i]); }
    }
    for (const r of rs) {
      const ts = by[r.id]; if (!ts || !r.forces || !r.forces.divs) continue;
      for (const d of r.forces.divs) {
        if (!(d.men > 0) || d.loc == null) continue;
        let t = of[d.loc];
        if (t == null || t < 0 || !T(t) || T(t).r !== r.id) { let bd = Infinity; for (const x of ts) { const dd = MT.path(x).d[d.loc]; if (dd < bd) { bd = dd; t = x; } } }
        if (men[t] != null) men[t] += d.men;
      }
    }
    // 45's caravans this month leave from the town with most to spare (by last month's need) and arrive at the open
    // town where the good is dearest after the road
    const cars = carLog && carLog.S === S ? carLog.list : [];
    carLog = null;
    const moved = {}, openOf = {};
    for (const rid in by) openOf[rid] = by[rid].filter(t => !cut[t]);
    for (const c of cars) {
      const fs = openOf[c.f], tt = openOf[c.t];
      if (!fs || !tt || !fs.length || !tt.length) continue;
      let src = fs[0], bs = -Infinity, dst = tt[0], bd = Infinity;
      const i = ix[c.k];
      if (fs.length > 1) for (const t of fs) { const x = T(t); const v = x.s && x.n ? (x.s[i] || 0) / Math.max(0.001, x.n[i] != null ? x.n[i] : x.w || 0) : 0; if (v > bs) { bs = v; src = t; } }
      // the merchants go where the good fetches most after the road from where they set out
      if (tt.length > 1) { const pk = (A.realm(c.t).mkt || {}).p, base = G()[c.k].base; for (const t of tt) { const R = MT.road(src, t), v = (pk ? pk[c.k] : base) * MT.rel(t, c.k) - base * (R ? R.f : 1); if (-v < bd) { bd = -v; dst = t; } } }
      c.fT = src; c.tT = dst;
      // on the lore's roads (9995-trade-roads) a caravan is listed when it sets out (dep: it leaves its town) and when
      // it arrives months later (arr: it reaches the town); a caravan with neither flag does both in the month
      if (!c.arr) (moved[src] = moved[src] || new Float64Array(nk))[i] -= c.n + (c.lost || 0);
      if (!c.dep) (moved[dst] = moved[dst] || new Float64Array(nk))[i] += c.n;
    }
    for (const r of rs) {
      const ts = by[r.id]; if (!ts) continue;
      const m = r.mkt; if (!m || !m.s) continue;
      const war = A.atWar(r.id).length > 0, army = (r.army || 0) / 1e3, d = m.d || {}, nt = ts.length;
      let P0 = 0, M0 = 0; for (const t of ts) { P0 += pop[t]; M0 += men[t]; }
      const w = ts.map(t => (P0 > 0 ? pop[t] / P0 : 1 / nt)), arm = ts.map((t, j) => (M0 > 0 ? men[t] / M0 : w[j]));
      // the share of a good each town makes; a realm's workshops stand where their main input is made (45's rule)
      const madeShare = i => { let s = 0; for (const t of ts) s += made[t][i]; return ts.map((t, j) => (s > 0 ? made[t][i] / s : w[j])); };
      const shop = {}; for (const out in E.CHAINS) shop[out] = madeShare(ix[E.MAIN[out] === 'steel' ? 'iron' : E.MAIN[out]]);
      const To = ts.map(T), fresh = new Set(), need = new Float64Array(nt), sp = new Float64Array(nt), shopK = new Float64Array(nt);
      ts.forEach((t, j) => { const x = T(t); x.w = Math.round(w[j] * 1e3) / 1e3; if (!x.s) { x.s = new Array(nk).fill(0); fresh.add(x); } if (!x.n || x.n.length !== nk) x.n = new Array(nk).fill(x.w); x.h = {}; });
      for (let i = 0; i < nk; i++) {
        const k = ks[i], armyK = war ? (E.ARMY[k] || 0) * army : 0, folk = Math.max(0, (d[k] || 0) - armyK);
        // what each town's people, armies and workshops need of k: its share of the realm's need
        shopK.fill(0);
        for (const out in E.CHAINS) { const per = E.CHAINS[out][k]; if (!per) continue; const q = (m.cap && m.cap[out] || 0) * per / 1.25; for (let j = 0; j < nt; j++) shopK[j] += q * shop[out][j]; }
        let needAll = 0; for (let j = 0; j < nt; j++) { need[j] = folk * w[j] + armyK * arm[j] + shopK[j]; needAll += need[j]; }
        for (let j = 0; j < nt; j++) To[j].n[i] = Math.round((needAll > 0 ? need[j] / needAll : w[j]) * 1e3) / 1e3;
        const tot = m.s[k] || 0;
        if (nt === 1) { To[0].s[i] = tot; continue; }
        // a new town starts at its share of the realm's store
        for (const x of fresh) x.s[i] = tot * x.n[i];
        // the month at each town: what its hinterland made, what its people and armies used, what caravans carried
        let sum = 0;
        for (let j = 0; j < nt; j++) { const t = ts[j]; sp[j] = Math.max(0, (To[j].s[i] || 0) + made[t][i] - (folk * w[j] + armyK * arm[j]) + (moved[t] ? moved[t][i] : 0)); sum += sp[j]; }
        // the rest of the realm's month (its workshops, spoilage, a full store's limit, what made its harvest differ)
        // squares the towns with the realm: too much is taken from every town alike; too little is added where it is
        // made (for the chains' goods, where the workshops are), never into a town cut off
        if (sum > tot && sum > 0) { const f = tot / sum; for (let j = 0; j < nt; j++) sp[j] *= f; }
        else if (tot > sum) {
          const wt = E.CHAINS[k] ? shop[k] : madeShare(i);
          let ws = 0, no = 0; for (let j = 0; j < nt; j++) if (!cut[ts[j]]) { ws += wt[j]; no++; }
          for (let j = 0; j < nt; j++) if (!cut[ts[j]] || !no) sp[j] += (tot - sum) * (ws > 0 ? wt[j] / ws : 1 / (no || nt));
        }
        for (let j = 0; j < nt; j++) To[j].s[i] = sp[j];
      }
      if (nt > 1) MT.cart(r, ts.filter(t => !cut[t]), ks);
    }
    for (const pid of S.mt.L) { const s = T(pid).s; if (s) for (let i = 0; i < nk; i++) s[i] = rnd(s[i] || 0); }
    MT.siegeNews();
  };
  // carters between a realm's open towns, where the price gap pays the road. Bandits take their expected share, more
  // on long roads and where the realm is in unrest (as 45's caravans, but with no dice); what they take is gone from
  // the realm's store too
  MT.cart = function (r, open, ks) {
    const m = r.mkt, hauled = new Map(); if (open.length < 2) return;
    const roads = [], stab = r.stability == null ? 50 : r.stability, ix = kix(), To = open.map(T);
    for (let i = 0; i < open.length; i++) for (let j = i + 1; j < open.length; j++) {
      const a = open[i], b = open[j], R = MT.road(a, b); if (!R) continue;
      const st = clamp(Math.min(stab, 100 - Math.max(A.prov(a).unrest || 0, A.prov(b).unrest || 0)), 0, 100);
      roads.push([T(a), T(b), R, Math.min(0.5, Math.pow(1 - st / 100, 2) * R.km / 6000 * (R.sea ? 0.5 : 1)) * 0.275]);
    }
    for (const k of ks) {
      const i = ix[k], base = G()[k].base, pk = m.p[k], nm = E.normal(m, k);
      // a good the realm hardly uses is carted along with the rest: each town holds its share
      if (nm < 2) { let tot = 0, ns = 0; for (const t of To) { tot += t.s[i] || 0; ns += t.n[i] || 0; } if (ns > 0) for (const t of To) t.s[i] = tot * (t.n[i] || 0) / ns; continue; }
      const scR = E.scarcity(m, k), span = pk * (MT.RHI - MT.RLO);
      const pr = (N, s) => pk * relOf(N, s, scR);
      const need = t => Math.max(nm * (t.n[i] != null ? t.n[i] : t.w || 0), nm * 0.01);
      for (const [a, b, R, loss] of roads) {
        const cost = MT.cartCost(k, R); if (cost >= span) continue;
        const Na = need(a), Nb = need(b), Sa = a.s[i] || 0, Sb = b.s[i] || 0;
        const pa = pr(Na, Sa), pb = pr(Nb, Sb);
        // a gap within a fiftieth of the price beyond the carting is not worth a cart
        if (Math.abs(pa - pb) - cost <= pk * 0.02) continue;
        let src = a, dst = b, N1 = Na, N2 = Nb, S1 = Sa, S2 = Sb;
        if (pa > pb) { src = b; dst = a; N1 = Nb; N2 = Na; S1 = Sb; S2 = Sa; }
        const qmax = Math.min(S1 - MT.KEEP * N1, N2 * 2);
        if (!(qmax > 0.05)) continue;
        const gap = q => pr(N2, S2 + q * (1 - loss)) - pr(N1, S1 - q) - cost;
        // the load that would close the gap down to the carting, found by halving
        // (when even all a town can spare would not close it, all of it goes)
        let lo = 0, hi = qmax, q = qmax;
        if (!(gap(qmax) > 0)) { for (let it = 0; it < 5; it++) { const mid = (lo + hi) / 2; if (gap(mid) > 0) lo = mid; else hi = mid; } q = MT.DAMP * lo; }
        if (!(q > 0.05)) continue;
        src.s[i] = S1 - q; dst.s[i] = S2 + q * (1 - loss);
        if (loss > 0) m.s[k] = Math.max(0, (m.s[k] || 0) - q * loss);
        (hauled.get(dst) || hauled.set(dst, new Float64Array(ks.length)).get(dst))[i] += q * (1 - loss);
        (hauled.get(src) || hauled.set(src, new Float64Array(ks.length)).get(src))[i] -= q;
      }
    }
    // what was carted in and out, for the market card
    for (const [t, row] of hauled) { const h = {}; for (let i = 0; i < row.length; i++) { const n = Math.round(row[i]); if (n) h[ks[i]] = n; } t.h = h; }
  };
  // a town under siege: its bread, once a year, in the news
  MT.siegeNews = function () {
    const S = A.S;
    if (!A.news) return;
    for (const pid of S.mt.L) {
      const P = A.prov(pid), t = T(pid); if (!shut(P) || t.nw === S.year) continue;
      const cap = MT.capTown(t.r); if (cap == null || cap === pid) continue;
      const x = MT.rel(pid, 'grain') / Math.max(0.01, MT.rel(cap, 'grain'));
      if (x < 1.8) continue;
      t.nw = S.year;
      A.news(`Bread in ${P.name}, ${P.occ ? 'held by the enemy' : 'under siege'}, costs ${x >= 2.5 ? Math.round(x) + ' times' : 'twice'} what it does in ${MT.name(cap)}.`, 'realm');
    }
  };
  A.onMonth.push(() => { try { MT.month(); } catch (e) { console.error('markets month', e); } });

  // ---- prices for the player: at their own town at home, at the capital abroad, at a town they travel to
  const local = E.local;
  E.local = function (P, k) {
    if (!MT.on() || !P) return local.apply(this, arguments);
    const t = MT.townOf(P), c = MT.capTown(P.owner);
    if (t == null || c == null) return 1;
    return MT.rel(t, k) / Math.max(0.01, MT.rel(c, k));
  };
  for (const f of ['buyPrice', 'sellPrice']) {
    const base = A[f];
    A[f] = function (rid, k, pc) {
      const v = base.apply(this, arguments);
      if (!MT.on()) return v;
      try {
        const p = pc || A.pc(), pid = MT.townFor(rid, p); if (pid == null) return v;
        // 45's wrapper priced the home market by E.local (above): take that out, and price the town's
        let applied = 1;
        if (p && rid === A.homeMkt(p)) { const P = A.prov(p.home); if (P && P.owner === rid) applied = E.local(P, k); }
        return v / Math.max(0.01, applied) * MT.rel(pid, k);
      } catch (e) { return v; }
    };
  }
  // a town's market is shallower than its realm's: each load the player buys or sells moves the price by the town's
  // share of the realm's need (its square root, and no less than seven tenths of the realm's depth)
  const depth = A.mktDepth;
  A.mktDepth = function (rid, k) {
    const d = depth.apply(this, arguments);
    if (!k || !MT.on()) return d;
    try { const pid = MT.townFor(rid); if (pid != null) return Math.max(0.6, d * Math.sqrt(Math.max(0.5, nOf(pid, k)))); } catch (e) {}
    return d;
  };
  // a load the player sells moves the town's own store, and so its price: n loads sold into a town fetch the price
  // along the way from its store now to its store plus n, as a share of the price quoted now (MT.curve with dir -1
  // reckons the same downwards). Where a town uses a hundred loads a month this is the release's slide or less; where
  // it uses a twentieth of a load, one load of pearls is years of its need and fetches what that is worth
  MT.curve = function (pid, k, n, dir) {
    const t = pid != null && T(pid); if (!t || !t.s || !(n > 0)) return n || 0;
    const m = A.mkt(t.r); if (!m || !m.s) return n;
    const N = MT.need(pid, k), S = MT.s(pid, k), sc = x => { const v = N / Math.max(x, N * 0.05); return clamp(E.ELASTIC === 0.5 ? Math.sqrt(v) : Math.pow(v, E.ELASTIC), E.LO, E.HI); }, s0 = sc(S);
    let sum = 0;
    for (let j = 0; j < n; j++) sum += dir > 0 ? Math.max(0.3, sc(S + j + 0.5) / s0) : sc(Math.max(0, S - j - 0.5)) / s0;   // a load sold fetches at least the release's floor, three tenths
    return sum;
  };
  // and a town sells no more than it has in store
  MT.avail = (pid, k) => Math.floor(MT.s(pid, k));
  const buy = A.buyGood;
  A.buyGood = function (k, n) {
    const pc = A.pc(), on = MT.on(), pid = on ? MT.townFor(A.homeMkt(pc), pc) : null;
    if (pid != null && GD.GOODS[k] && n > 0) {
      const have = MT.avail(pid, k);
      if (have < 1) return { ok: false, msg: `${MT.name(pid)} has no ${G()[k].name.toLowerCase()} to sell.` };
      if (n > have) n = have;
    }
    const before = (A.cargo(pc)[k] || 0), r = buy.call(this, k, n);
    try { const got = (A.cargo(pc)[k] || 0) - before; if (got > 0 && pid != null) setS(pid, k, Math.max(0, MT.s(pid, k) - got)); } catch (e) {}
    return r;
  };
  const sell = A.sellGood;
  A.sellGood = function (k, n, rid) {
    const pc = A.pc(), before = (A.cargo(pc)[k] || 0), on = MT.on(), at2 = rid || A.homeMkt(pc), pid = on ? MT.townFor(at2, pc) : null;
    const quote = on && GD.GOODS[k] ? A.sellPrice(at2, k) : 0, r = sell.apply(this, arguments);
    try {
      const gone = before - (A.cargo(pc)[k] || 0);
      if (gone > 0 && pid != null) {
        const fair = Math.round(quote * MT.curve(pid, k, gone, 1)), cut = r && r.ok ? Math.max(0, r.got - fair) : 0;
        if (cut > 0) {
          pc.coin -= cut; r.got -= cut; pc.flags.traded = Math.max(0, (pc.flags.traded || 0) - cut);
          r.msg = `You sell ${gone} load${gone > 1 ? 's' : ''} of ${G()[k].name.toLowerCase()} for ${A.coin(r.got)}; ${MT.name(pid)} has more than it needs.`;
        }
        setS(pid, k, MT.s(pid, k) + gone);
      }
    } catch (e) {}
    return r;
  };
  // the trip planner reckons the same way
  const sale = (pid, rid, k, n, there) => { let rel = 0; for (let i = 0; i < n; i++) rel += Math.max(0.3, 1 - i * 0.6 / A.mktDepth(rid, k)); return Math.max(0, there * (rel - MT.curve(pid, k, n, 1))); };
  const runPlan = A.runPlan;
  A.runPlan = function (dest) {
    const P = runPlan.apply(this, arguments);
    if (!P || !MT.on()) return P;
    try {
      const pid = MT.townFor(dest);
      let cut = 0; for (const l of P.lines || []) cut += sale(pid, dest, l.k, l.n, l.there);
      if (cut > 0) { P.sale = Math.round(P.sale - cut); P.net = Math.round(P.net - cut * (1 - P.toll)); }
    } catch (e) {}
    return P;
  };
  // a trade run to a realm leaves from the player's town and goes to that realm's capital: the carting is that road's,
  // and never less than 45's capital-to-capital road
  const haul = E.haul;
  E.haul = function (home, dest, cargo) {
    if (!MT.on()) return haul.apply(this, arguments);
    try {
      const a = MT.townFor(home, A.pc()), b = MT.capTown(dest), R = a != null && b != null && MT.road(a, b);
      if (!R) return haul.apply(this, arguments);
      const f = Math.max(R.f, E.road(home, dest).f);
      let c = 0; for (const k in cargo || {}) c += (cargo[k] || 0) * G()[k].base * f;
      return Math.round(c);
    } catch (e) { return haul.apply(this, arguments); }
  };
  // workshops buy and sell at their own town
  const shopYear = E.shopYear;
  E.shopYear = function (k, pc) {
    if (!MT.on()) return shopYear.apply(this, arguments);
    const [out] = E.SHOPS[k], p = pc || A.pc(), rid = p ? A.homeMkt(p) : null, m = rid && A.mkt(rid), pid = rid && MT.townFor(rid, p);
    if (!m || pid == null) return shopYear.apply(this, arguments);
    const price = g => m.p[g] * MT.rel(pid, g), cost = Object.entries(E.CHAINS[out]).reduce((a, [g, q]) => a + q * price(g), 0);
    return Math.round(24 * (price(out) - cost));
  };

  // ---- the player's trip to another market town (the plan is pure; the trip is an engine action)
  MT.near = function (pc, n) {
    pc = pc || A.pc(); const here = MT.here(pc); if (here == null) return [];
    const out = [];
    for (const pid of A.S.mt.L) {
      if (pid === here || !liveR(T(pid).r)) continue;
      const R = MT.road(here, pid); if (!R) continue;
      out.push({ pid, rid: T(pid).r, R });
    }
    return out.sort((x, y) => x.R.f - y.R.f || x.pid - y.pid).slice(0, n || MT.NEAR);
  };
  MT.tripPlan = function (pid) {
    const pc = A.pc(), here = MT.here(pc), t = T(pid);
    if (here == null || !t || pid === here) return null;
    const rid = t.r, home = A.homeMkt(pc), R0 = MT.road(here, pid); if (!R0 || !liveR(rid)) return null;
    // abroad the carting is never less than 45's road between the two realms: the same rate the realm runs pay, so a
    // border town is no back door to a gap the caravans have not closed
    const R = rid !== home ? Object.assign({}, R0, { f: Math.max(R0.f, E.road(home, rid).f) }) : R0;
    const foreign = rid !== home, near = !foreign || A.neighbors(home).includes(rid);
    // tolls abroad as the release's trade runs; market dues at home
    const toll = foreign ? (near ? 0.04 : 0.09) * (A.hasTrade(home, rid) ? 0.5 : 1) : 0.02;
    const r = A.realm(rid), st = clamp(Math.min(r.stability == null ? 50 : r.stability, 100 - ((A.prov(pid) || {}).unrest || 0)), 0, 100);
    const risk = clamp(0.03 + R.days / 400 + Math.pow(1 - st / 100, 2) * 0.2 + (A.atWar(rid).length || A.atWar(home).length ? 0.06 : 0), 0.02, 0.5);
    const cargo = pc.cargo || {}, lines = [];
    let value = 0, sale = 0, carts = 0;
    MT.at(pid, () => {
      for (const k in cargo) {
        const n = cargo[k]; let s = 0;
        for (let i = 0; i < n; i++) s += A.sellPrice(rid, k) * Math.max(0.3, 1 - i * 0.6 / A.mktDepth(rid, k));
        s = Math.min(s, A.sellPrice(rid, k) * MT.curve(pid, k, n, 1));
        sale += s; carts += n * MT.cartCost(k, R);
        lines.push({ k, n, there: A.sellPrice(rid, k) });
      }
    });
    for (const l of lines) { l.home = A.sellPrice(home, l.k); value += l.home * l.n; }
    return { pid, rid, name: MT.name(pid), R, foreign, toll, risk, ini: Math.max(1, Math.ceil(R.days / 25)), lines, value: Math.round(value), sale: Math.round(sale), haul: Math.round(carts), net: Math.round(sale * (1 - toll) - carts), hostile: A.hostile(home, rid), shut: MT.shut(pid) };
  };
  MT.trip = function (pid, opts) {
    const pc = A.pc(); opts = opts || {};
    if (!MT.on()) return { ok: false, msg: 'No market there.' };
    const P = MT.tripPlan(pid);
    if (!P) return { ok: false, msg: 'No market there.' };
    if (P.hostile) return { ok: false, msg: 'You are at war with them. Nobody there will buy.' };
    if (P.shut) return { ok: false, msg: `${P.name} is cut off. No carts go in or out.` };
    if (!A.cargoLoad(pc) && !opts.buyBack) return { ok: false, msg: 'You carry nothing to sell.' };
    if (A.S.time < P.ini) return { ok: false, msg: `A trip of ${P.R.days} days needs ${P.ini} initiative.` };
    A.S.time -= P.ini;
    const log = [], before = Object.assign({}, A.cargo(pc));
    if (A.chance(P.risk)) {
      const what = P.R.sea ? A.pick(['a squall in the strait', 'a leaking hold']) : A.pick(['bandits at a ford', 'a broken axle in the mud', 'a toll-keeper with friends']);
      const lost = clamp(A.rf(0.1, 0.45) - A.skill(pc, 'melee') / 400, 0.05, 0.6);
      for (const k in A.cargo(pc)) A.cargo(pc)[k] = Math.floor(A.cargo(pc)[k] * (1 - lost));
      log.push(`On the road: ${what}. You lose ${Math.round(lost * 100)}% of the load.`);
    }
    // carts, fodder and inns for what went out
    const carts = Math.round(Object.entries(before).reduce((a, [k, n]) => a + n * MT.cartCost(k, P.R), 0));
    pc.coin -= carts;
    let got = 0;
    MT.at(pid, () => { for (const k of Object.keys(A.cargo(pc))) { const r = A.sellGood(k, A.cargo(pc)[k], P.rid); if (r.ok) got += r.got; } });
    const toll = Math.round(got * P.toll); pc.coin -= toll;
    log.push(`At ${P.name} you sell for ${A.coin(got)}, pay ${A.coin(toll)} in ${P.foreign ? 'tolls' : 'market dues'} and ${A.coin(carts)} to the carters.`);
    // a load for the road home, bought at that town's price and carted back
    const g = opts.buyBack;
    if (g && GD.GOODS[g]) {
      const room = A.carryCap(pc) - A.cargoLoad(pc), cart = MT.cartCost(g, P.R);
      let n = 0, spent = 0;
      MT.at(pid, () => {
        const q = A.buyPrice(P.rid, g), cost = j => { let c = 0; for (let i = 0; i < j; i++) c += q * (1 + i * 0.6 / A.mktDepth(P.rid, g)); return c + j * cart; };
        const most = Math.min(room, MT.avail(pid, g));
        while (n < most && cost(n + 1) <= Math.max(0, pc.coin) * 0.8) n++;
        spent = n ? cost(n) : 0;
        if (n) {
          const m = A.mkt(P.rid);
          m.p[g] *= 1 + n * 0.3 / A.mktDepth(P.rid, g);
          if (m.s) m.s[g] = Math.max(0, (m.s[g] || 0) - n);
          setS(pid, g, Math.max(0, MT.s(pid, g) - n));
        }
      });
      if (n) { pc.coin -= Math.round(spent); A.cargo(pc)[g] = (A.cargo(pc)[g] || 0) + n; log.push(`You load ${n} of ${G()[g].name.toLowerCase()} and cart it home (${A.coin(Math.round(spent))} with the carting).`); }
    }
    A.trainSkill(pc, 'trade', 0.5 + P.R.days / 40);
    if (pc.job && pc.job.c === 'merchant') pc.job.merit = (pc.job.merit || 0) + 2 + Math.round(got / 300);
    pc.flags.runs = (pc.flags.runs || 0) + 1;
    const msg = `To ${P.name} (${P.R.days} days${P.R.sea ? ' by sea' : ''}): ${log.join(' ')}`;
    A.log(msg, got > P.value ? 'good' : 'warn');
    return { ok: true, msg, got };
  };

  // ---- what the market card says (pure)
  const why = E.why, word = E.word;
  E.why = function (rid, k) {
    const s = why.apply(this, arguments);
    if (!MT.on() || !s) return s;
    try {
      const pid = MT.townFor(rid, A.pc()), t = pid != null && T(pid); if (!t || !t.s) return s;
      const months = MT.s(pid, k) / Math.max(0.01, MT.need(pid, k) / E.months(k));
      const bits = [`${MT.name(pid)}: ${MT.word(pid, k)}, ${months >= 1 ? Math.round(months) : '<1'} months of the town's need in store`];
      if (MT.shut(pid)) bits.push('cut off: nothing is carted in');
      const h = t.h && t.h[k];
      if (h > 0) bits.push(`${h} carted in from the realm's other towns last month`); else if (h < 0) bits.push(`${-h} carted out to the realm's other towns`);
      return bits.join('; ') + '. The realm: ' + word(A.mkt(rid), k) + s.slice(s.indexOf(':'));
    } catch (e) { return s; }
  };
  // the stock word in the market table is the town's
  E.word = function (m, k) {
    if (!MT.on()) return word.apply(this, arguments);
    try { const pc = A.pc(), rid = pc && A.homeMkt(pc); if (rid && m === A.mkt(rid)) { const pid = MT.townFor(rid, pc); if (pid != null) return MT.word(pid, k); } } catch (e) {}
    return word.apply(this, arguments);
  };
  const card = E.card;
  E.card = function (rid) {
    if (!MT.on()) return card.apply(this, arguments);
    try { return MT.card(rid); } catch (e) { console.error('markets card', e); return card.apply(this, arguments); }
  };
  UI.mtGood = UI.mtGood || null; UI.mtBack = UI.mtBack || '';
  MT.card = function (rid) {
    const pc = A.pc(), here = MT.townFor(rid, pc), m = A.mkt(rid), esc = UI.esc;
    let h = '';
    // caravans at this town this month, and the year's harvest
    const cs = ((A.S.eco || {}).car || []).filter(c => c.fT === here || c.tT === here).slice(0, 6);
    const hv = m && m.hv && m.hv.y === A.S.year ? m.hv.t : null;
    const line = c => c.tT === here ? `${c.n} loads of ${G()[c.k].name.toLowerCase()} in from ${MT.name(c.fT)} (${A.realmShort(c.f)})${c.lost ? `, ${c.lost} lost on the road` : ''}` : `${c.n} loads of ${G()[c.k].name.toLowerCase()} out to ${MT.name(c.tT)} (${A.realmShort(c.t)})`;
    if (cs.length || hv) h += `<div class="tiny muted" style="margin-top:6px">${hv ? esc(`This year: ${hv}. `) : ''}${cs.length ? esc(`Caravans at ${MT.name(here)} this month: ` + cs.map(line).join('; ') + '.') : ''}</div>`;
    // the nearest market towns: the price of one good there, the road, and the carting
    const near = MT.near(pc);
    if (!near.length) return h;
    const cargo = pc.cargo || {}, ks = Object.keys(G()), load = Object.values(cargo).reduce((a, b) => a + b, 0);   // read only: A.cargo would create pc.cargo while drawing
    const k = UI.mtGood && G()[UI.mtGood] ? UI.mtGood : Object.keys(cargo).find(x => cargo[x] > 0) || 'grain';
    const opt = (sel, list, none) => (none ? `<option value="">${esc(none)}</option>` : '') + list.map(x => `<option value="${esc(x)}" ${x === sel ? 'selected' : ''}>${esc(G()[x].name)}</option>`).join('');
    h += `<div class="mt-near" style="margin-top:8px"><div class="row wrap"><span class="small grow">You trade at <b>${esc(MT.name(here))}</b>. The nearest other market towns:</span><label class="tiny muted">Prices of <select data-c="mtGood" aria-label="Good to compare">${opt(k, ks)}</select></label></div>`;
    h += `<div class="tscroll"><table class="t small mt-t"><tr><th>Town</th><th>Road</th><th>Carting a load</th><th>Buy</th><th>Sell</th><th></th></tr>`;
    h += `<tr class="sel"><td>${esc(MT.name(here))} <span class="chip">here</span></td><td class="muted">—</td><td class="muted">—</td><td>${A.coin(Math.round(A.buyPrice(rid, k)))}</td><td>${A.coin(Math.round(A.sellPrice(rid, k)))}</td><td></td></tr>`;
    for (const x of near) {
      const P = MT.tripPlan(x.pid), [b, s] = MT.at(x.pid, () => [A.buyPrice(x.rid, k), A.sellPrice(x.rid, k)]);
      const go = load > 0 || !!UI.mtBack, ok = P && !P.hostile && !P.shut && go && A.S.time >= P.ini;
      const why = !P ? '' : P.hostile ? 'At war with you' : P.shut ? 'Cut off by war' : !go ? 'You carry nothing' : A.S.time < P.ini ? `Needs ${P.ini} initiative` : load ? `Sell all you carry there: about ${A.coin(P.net)} after ${P.foreign ? 'tolls' : 'dues'} and carting` : 'Go and buy there';
      h += `<tr><td>${esc(MT.name(x.pid))}${x.rid !== A.homeMkt(pc) ? ` <span class="chip">${esc(A.realmShort(x.rid))}</span>` : ''}${P && P.shut ? ' <span class="chip red">cut off</span>' : ''}</td><td>${esc(`${x.R.steps} steps, ${x.R.days} days${x.R.sea ? ' by sea' : ''}`)}</td><td>${A.coin(Math.round(MT.cartCost(k, P ? P.R : x.R)))}</td><td>${A.coin(Math.round(b))}</td><td>${A.coin(Math.round(s))}</td><td><button class="small" data-a="mtTrip" data-v="${esc(String(x.pid))}" ${ok ? '' : 'disabled'} title="${esc(why)}">Go</button></td></tr>`;
    }
    h += `</table></div><div class="row wrap"><label class="tiny muted">Bring back <select data-c="mtBack" aria-label="Goods to bring back">${opt(UI.mtBack, ks, 'nothing')}</select></label></div>`;
    h += `<div class="tiny muted">Each town keeps its own store. A good is cheapest near the fields, mines and flocks that make it and dearer down the road, by about what the carting costs; imports are cheapest where the caravans come in. A town under siege eats its store.</div></div>`;
    return h;
  };
  Object.assign(UI.A, {
    mtTrip(v) { const r = MT.trip(+v, { buyBack: UI.mtBack || null }); UI.toast(r.msg ? (r.msg.length > 170 ? r.msg.slice(0, 167) + '…' : r.msg) : ''); UI.refresh(); },
  });
  Object.assign(UI.C, {
    mtGood(el) { UI.mtGood = el.value; UI.refreshTab(); },
    mtBack(el) { UI.mtBack = el.value; },
  });

  // Three things in the release are made the first time anything reads them: the player's cargo (A.cargo), training plan
  // (A.plan) and each realm's market (A.mkt). The Holdings and Life tabs read them, so drawing a tab before the first
  // month changed the state, and a market set up on the day it was drawn instead of at the first month could start
  // from other numbers (71-phone found the cargo). They are now made when a life starts or loads, and for an heir at the
  // turn of the month, so drawing never has to.
  // A loaded save gets no markets here: a realm founded since the last turn of the month (A.createRealm) has none yet,
  // and making it on load drew its prices (A.mktInit's A.rf) at a point the unsaved game never did, so the loaded
  // world was not the saved one (flSaveRoundTrip). It gets its market at the next month, as it would have unsaved.
  const giveCargo = (markets = true) => {
    try {
      const pc = A.pc(); if (pc && !pc.cargo) pc.cargo = {};
      if (pc && !pc.plan && typeof A.plan === 'function') A.plan(pc);
      if (markets && typeof A.mkt === 'function' && A.S && A.S.realms) for (const rid of Object.keys(A.S.realms)) if (!A.S.realms[rid].mkt) A.mkt(rid);
    } catch (e) {}
  };
  for (const k of ['newGame', 'deserialize']) {
    const f = A[k];
    if (typeof f === 'function') A[k] = function () { const r = f.apply(this, arguments); giveCargo(k === 'newGame'); return r; };
  }
  A.onMonth.push(() => giveCargo(true));
})();
