// The living economy, part 2: roads with distance (growth lane E, cycle 1; world review I1).
//
// 45-economy's caravans went from any market to any other at peace in one month, priced by the distance between
// capitals: 1% of them ran more than 10,000 km, and silk never moved west. On the Great Continent they now go hand to
// hand along roads, and take the time the road takes:
//   1. a market trades only with the markets it can reach in one hand: realms whose land touches its own, realms it can
//      sail to (coastal capitals within 2,400 km), and realms up to HAND_KM along one of the lore's routes (99's
//      D.routes: the Silk Road's strands, the Steppe Road, the Tea-and-Horse Road, the Fur Rivers, the sea lanes...);
//   2. goods are on the road for the road's length at a caravan's pace (20 km a day by land, 35 by river, 90 by sea),
//      out of both markets' stores until they arrive; a market counts what is already on the way to it;
//   3. each hand takes the broker's tenth, the road's carting, the interest on the money on the road (1.2% a month),
//      and the tolls of the lore's chokepoints it passes (the Lantern Gate's tenth on silk and tea going west, the
//      Weighing at Ushivar, the Red Saddle's fee, Kraoth's tenth on silk since 1103...); the toll goes to the
//      chokepoint's holder;
//   4. a road closes in war (a realm on the way at war with either end), when its pass is shut (the Red Saddle from
//      December to March, the Pilgrim Stair outside June to September), and a southern sea lane sails only on its
//      monsoon; cyclones from July to October take more; bandits take more on long roads and where realms are unruly;
//   5. silk so leaves the Twin Rivers dear-er at every hand, silver goes east, and word of the far lands comes west at
//      the pace of the brokers' letters along the same roads (A.TRADE.newsDays).
// Only a Great Continent game uses this (E.roadMode); a Known World game keeps 45's caravans exactly.
//
// Engine: the month (TR.month, called by 45's E.caravans) draws the bandits' and the cyclones' dice. Rendering reads.
(function () {
  const E = A.ECON; if (!E) return;
  const TR = A.TRADE = A.TRADE || {};
  const FL = A.FAR;
  Object.assign(TR, {
    HAND_KM: 3000,            // how far along a route one market's merchants carry before selling to the next
    KM_DAY: { road: 20, river: 35, sea: 90, land: 18 },   // a caravan's pace, with its rests; 'land' is off the routes
    WIND: 1.2,                // a road off the routes winds: its length is the capitals' distance times this
    INTEREST: 0.012,          // a month's interest on the money on the road, as a share of the goods' worth
    BROKER: 0.1,              // the margin a hand needs over what it paid (45's)
    SOUTH_Y: 3200,            // sea lanes between capitals south of this (km) sail on the monsoon
    NEWS_KM_DAY: 40,          // a broker's letter, with its relays
    NEWS_HAND_DAYS: 20,       // and the days it waits at each hand
    NEWS_CAP: 1100,
    MERGE: 120,               // days within which two consignments on one road travel as one (a third of the road's days at most)
    // the far regions whose coasts are the open sea (the Isles, the peninsulas, the Deep South, the Twin Rivers' and the
    // pines' sea coasts, the Rime); the rest of the far lands' "coasts" are lakes and inland seas
    SEA_REGION: /^(A|I|D|M|N)-|^R-(03|04|08|10|12|14)$|^T-(01|05|12)$/,
  });
  // the lore's chokepoints (far-lands-atlas.md, "Chokepoints"): who holds each, what it takes as a share of the goods'
  // worth (on goods in g only, if given; west/east: only goods going that way), and the months it is shut (0 January)
  TR.CK = [
    { id: 'CK-01', n: 'Kraoth', by: 'POL-34', at: [6800, 1600], toll: 0.1, g: ['silk'], west: true },
    { id: 'CK-02', n: 'the Girdle Gap', by: 'POL-68', at: [9050, 1180], toll: 1 / 30 },
    { id: 'CK-03', n: 'the Red Saddle', by: 'POL-88', at: [9250, 1720], toll: 0.04, shut: [11, 0, 1, 2] },
    { id: 'CK-04', n: 'Ushivar', by: 'POL-72', at: [9750, 1720], toll: 0.05 },
    { id: 'CK-05', n: 'the Lantern Gate', by: 'POL-39', at: [12700, 1820], toll: 0.1, g: ['silk', 'tea'], west: true },
    { id: 'CK-05e', n: 'the Lantern Gate', by: 'POL-39', at: [12700, 1820], toll: 0.05, g: ['silver'], east: true },
    { id: 'CK-07', n: 'Tsaidou on the Sau', by: 'POL-50', at: [15300, 2200], toll: 0.1 },
    { id: 'CK-08', n: 'the Strait of Suraeng', by: 'POL-110', at: [10900, 5450], toll: 0.1, ban: ['silk'], west: true },
    { id: 'CK-09', n: 'the Pilgrim Stair', by: 'POL-82', at: [9300, 2900], toll: 0.03, shut: [0, 1, 2, 3, 4, 9, 10, 11] },
    { id: 'CK-10', n: 'the Gorge Gate', by: 'POL-92', at: [10700, 2950], toll: 0.1, g: ['horses'] },
    { id: 'CK-11', n: 'the Silt Gulf Mouth', by: 'POL-52', at: [16000, 1650], toll: 0.2, g: ['salt'] },
    { id: 'CK-12', n: 'Liuhane', by: 'POL-140', at: [16850, 1500], toll: 0.2 },
    { id: 'CK-13', n: 'the Chain Gorges', by: 'POL-38', at: [13700, 2500], toll: 1 / 15 },
    { id: 'CK-14', n: 'the Jade Gate of Marast', by: 'POL-77', at: [10500, 2020], toll: 1 / 3, g: ['jade'], src: true },
    { id: 'CK-16', n: "the Three Sisters' Bridges", by: 'POL-86', at: [11300, 2550], toll: 0.02 },
    { id: 'CK-17', n: 'the Shrinking Sea ferries', by: 'POL-62', at: [7900, 1650], toll: 0.01 },
    { id: 'CK-18', n: 'the Low Gate', by: 'POL-79', at: [12100, 1250], toll: 0.05 },
    { id: 'CK-21', n: 'Tumbaro harbour', by: 'POL-147', at: [5650, 5300], toll: 0.1 },
    { id: 'CK-22', n: 'the Lake Gate', by: 'POL-144', at: [4700, 5200], toll: 0.02 },
    { id: 'CK-23', n: 'the Elephant Pass', by: 'POL-107', at: [11900, 3700], toll: 0.1, g: ['ivory'] },
    { id: 'CK-24', n: 'the Scent Narrows', by: 'POL-119', at: [15300, 5900], toll: 0.125 },
  ];
  // the League of the Nine Wells' track across the Swallowing Sand: forty days shorter than either strand, and nobody
  // outside the League uses it (CK-06). Its caravans, and a player the League has taken in (flag tr_nine_wells)
  TR.SECRET = { strand: 'The Cross-Desert Track', league: 'POL-81', flag: 'tr_nine_wells' };

  const live = () => Object.values(A.S.realms).filter(r => r && r.alive && !r.isRebel);
  const D = () => (FL && FL.active && FL.part && FL.part.routes ? FL.part : null);
  TR.on = () => { try { return !!(A.S && A.S.prov && D() && FL.isGreat && FL.isGreat(A.S) && !TR.OFF); } catch (e) { return false; } };
  E.roadMode = () => TR.on();
  E.roadMonth = () => TR.month();
  const baseId = id => { const m = String(id).match(/^POL-\d+/); return m ? m[0] : id; };
  const cap = r => (r && r.capitalProv != null ? A.S.prov[r.capitalProv] : null);
  const km = (P, Q) => (P && Q ? Math.max(60, Math.hypot(P.x - Q.x, P.y - Q.y)) : 3000);

  // ---- the road graph: one hand's reach from each market, built when the year or a province's owner changes
  const sigOf = S => { let h = 7; for (const P of S.prov) { const o = String(P.owner); for (let i = 0; i < o.length; i++) h = (h * 31 + o.charCodeAt(i)) | 0; h = (h * 31 + 1) | 0; } return h; };
  let G = null;
  TR.graph = function () {
    const S = A.S, key = S.year + ':' + sigOf(S);
    if (G && G.S === S && G.key === key) return G;
    const rs = live(), ids = new Set(rs.map(r => r.id)), E2 = new Map();
    const coast = {}; for (const P of S.prov) if (P.coast && ids.has(P.owner)) coast[P.owner] = 1;
    const put = (a, b, e) => {
      if (a === b || !ids.has(a) || !ids.has(b)) return;
      const k = a + '>' + b, o = E2.get(k);
      e.f = e.sea ? E.SEA + E.HOP * e.dist / 250 * 0.5 : e.kind === 'river' ? E.SEA + E.HOP * e.dist / 250 * 0.7 : E.ROAD + E.HOP * e.dist / 250 * (e.route ? (FL.ROAD_F || 0.55) : 1);
      e.days = Math.round(e.dist / (TR.KM_DAY[e.kind] || 20));
      e.a = a; e.b = b;
      if (e.secret) { E2.set(k + '#', e); return; }   // the League's track is a hand of its own, for its own
      if (!o || e.f + e.days / 3000 < o.f + o.days / 3000) E2.set(k, e);
    };
    // 1. land that touches
    const seen = new Set();
    for (const P of S.prov) {
      if (!ids.has(P.owner)) continue;
      for (const q of P.adj || []) {
        const Q = S.prov[q]; if (!Q || Q.owner === P.owner || !ids.has(Q.owner)) continue;
        const k = P.owner + '>' + Q.owner; if (seen.has(k)) continue; seen.add(k);
        const ra = A.realm(P.owner), rb = A.realm(Q.owner);
        put(P.owner, Q.owner, { dist: km(cap(ra), cap(rb)) * TR.WIND, kind: 'land', via: [] });
      }
    }
    // 2. by sea, between coastal capitals within 45's reach. A far province's "coast" may be a lake's (the Middle
    // Lakes, the Salt Lakes, the Shrinking Sea): there only a capital in a region on the open sea is a port, and the
    // lore's sea roads (3, below) do the rest
    const farBase = (D() && D().base) || 306;
    const port = r => { const P = cap(r); if (!P) return false; if (!P.region) return !!coast[r.id]; return !!P.coast && TR.SEA_REGION.test(P.region); };
    for (let i = 0; i < rs.length; i++) for (let j = 0; j < rs.length; j++) {
      if (i === j || !coast[rs[i].id] || !coast[rs[j].id] || !port(rs[i]) || !port(rs[j])) continue;
      // no ship sails between the Known World and the Far Lands (the Pearl Meeting, TR-41, is a secret of a few pilots)
      if ((rs[i].capitalProv < farBase) !== (rs[j].capitalProv < farBase)) continue;
      const d = km(cap(rs[i]), cap(rs[j])); if (d > E.SEA_REACH) continue;
      put(rs[i].id, rs[j].id, { dist: d * 1.1, kind: 'sea', sea: true, via: [] });
    }
    // 3. along the lore's routes, up to HAND_KM between one realm's stretch and another's
    for (const R of D().routes) {
      const segs = []; let cum = 0, prev = null;
      for (const pid of R.p) {
        const P = S.prov[pid]; if (!P) continue;
        if (prev) cum += km(prev, P);
        prev = P;
        const o = P.owner;
        if (!segs.length || segs[segs.length - 1].r !== o) segs.push({ r: o, at: cum, P });
        else { const s = segs[segs.length - 1], c = cap(A.realm(o)); if (c && km(P, c) < km(s.P, c)) { s.P = P; s.at = cum; } }
      }
      const kind = R.k === 'sea' ? 'sea' : R.k === 'river' ? 'river' : 'road', secret = R.s === TR.SECRET.strand;
      for (let i = 0; i < segs.length; i++) for (let j = 0; j < segs.length; j++) {
        if (i === j) continue;
        const a = segs[i], b = segs[j], along = Math.abs(b.at - a.at); if (along > TR.HAND_KM) continue;
        if (!ids.has(a.r) || !ids.has(b.r) || a.r === b.r) continue;
        const lo = Math.min(i, j), hi = Math.max(i, j), via = [];
        for (let x = lo + 1; x < hi; x++) if (segs[x].r !== a.r && segs[x].r !== b.r && ids.has(segs[x].r) && !via.includes(segs[x].r)) via.push(segs[x].r);
        const ra = A.realm(a.r), rb = A.realm(b.r), dist = km(cap(ra), a.P) + along + km(b.P, cap(rb));
        put(a.r, b.r, { dist, kind, sea: kind === 'sea', route: R.id, rn: R.n, strand: R.s, via, secret });
      }
    }
    // each market's hands, and the chokepoints' holders on each
    const out = {}, ck = {};
    for (const c of TR.CK) (ck[c.by] = ck[c.by] || []).push(c);
    for (const [k, e] of E2) {
      e.ck = [];
      for (const r of e.via.concat([e.b, e.a])) for (const c of ck[baseId(r)] || []) if (r !== e.a || c.src) e.ck.push(c);
      const ca = cap(A.realm(e.a)), cb = cap(A.realm(e.b));
      e.west = ca && cb ? cb.x < ca.x : false;
      e.south = !!(e.sea && ca && cb && ca.y > TR.SOUTH_Y && cb.y > TR.SOUTH_Y);
      e.out = ca && cb ? (cb.y > ca.y || cb.x > ca.x) : true;
      (out[e.a] = out[e.a] || []).push(e);
    }
    for (const a in out) out[a].sort((x, y) => x.f - y.f || (x.b < y.b ? -1 : x.b > y.b ? 1 : 0) || (x.secret ? 1 : 0) - (y.secret ? 1 : 0));
    return (G = { S, key, out, n: E2.size, news: {} });
  };
  // what the tolls on a hand take from a load of k, as a share of its worth; and whether k may pass at all
  TR.tollOf = function (e, k) {
    let t = 0;
    for (const c of e.ck) {
      if (c.g && !c.g.includes(k)) continue;
      if (c.west && !e.west) continue;
      if (c.east && e.west) continue;
      if (c.ban) { if (c.ban.includes(k)) return -1; continue; }
      t += c.toll;
    }
    return t;
  };
  // is the hand open this month: no realm on the way at war with either end, its passes open, its monsoon blowing
  TR.shutWhy = function (e, mo, hostile) {
    const h = hostile || ((x, y) => !!(A.hostile && A.hostile(x, y)));
    if (h(e.a, e.b)) return 'war';
    for (const v of e.via) if (h(v, e.a) || h(v, e.b)) return 'war';
    for (const c of e.ck) if (c.shut && c.shut.includes(mo)) return 'shut:' + c.n;
    if (e.south) { const ok = e.out ? [10, 11, 0, 1, 2] : [5, 6, 7, 8]; if (!ok.includes(mo)) return 'wind'; }
    return '';
  };
  TR.secretOk = (e, rid, pc) => !e.secret || baseId(rid) === TR.SECRET.league || !!(pc && pc.flags && pc.flags[TR.SECRET.flag] != null);

  // ---- the trips a market's merchants make: every market within MAX_HANDS hands and MAX_KM, by the fastest way
  // (Dijkstra by days, each relay market a fortnight's wait), cached with the graph
  TR.MAX_HANDS = 8; TR.MAX_KM = 16000; TR.RELAY_DAYS = 15; TR.RELAY_W = 75;
  TR.trips = function (src, pc) {
    const g = TR.graph(), c = g.trips || (g.trips = {}), sec = !!(pc && pc.flags && pc.flags[TR.SECRET.flag] != null), key = src + (sec ? '#' : '');
    if (c[key]) return c[key];
    // the way is chosen by days plus RELAY_W for every relay (a merchant would rather pay one broker than three), and
    // reckoned in days: the road's, and a fortnight at each relay
    const W = { [src]: 0 }, dist = { [src]: 0 }, hops = { [src]: 0 }, prev = {}, done = new Set(), open = [[0, src]];
    while (open.length) {
      let bi = 0; for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
      const [w, a] = open.splice(bi, 1)[0];
      if (done.has(a)) continue; done.add(a);
      if (hops[a] >= TR.MAX_HANDS) continue;
      for (const e of g.out[a] || []) {
        if (!TR.secretOk(e, src, sec ? pc : null)) continue;
        const nw = w + e.days + (a === src ? 0 : TR.RELAY_W);
        if (W[e.b] == null || nw < W[e.b]) { W[e.b] = nw; dist[e.b] = dist[a] + e.days + (a === src ? 0 : TR.RELAY_DAYS); prev[e.b] = e; hops[e.b] = hops[a] + 1; open.push([nw, e.b]); }
      }
    }
    const out = [];
    for (const b in prev) {
      const legs = []; let x = b; while (x !== src) { const e = prev[x]; legs.unshift(e); x = e.a; }
      let km = 0, landKm = 0, seaKm = 0; for (const e of legs) { km += e.dist; if (e.sea) seaKm += e.dist; else landKm += e.dist; }
      if (km > TR.MAX_KM) continue;
      const through = []; for (const e of legs) for (const v of e.via.concat([e.b])) if (v !== b && !through.includes(v)) through.push(v);
      const rn = legs.map(e => e.rn).filter(Boolean)[0] || '';
      out.push({ b, legs, hands: legs.length, days: Math.round(dist[b]), dist: km, landKm, seaKm, through, rn, south: legs.some(e => e.south),
        lo: Math.pow(1 + TR.BROKER, legs.length), md() { const r = A.realm(b); return r && r.alive ? r.mkt : null; } });
    }
    out.sort((x, y) => (x.b < y.b ? -1 : x.b > y.b ? 1 : 0));
    return (c[key] = out);
  };
  // what a load of k bought at ps costs by the time it reaches the trip's end: each hand's carting, tolls and interest,
  // and the next broker's tenth at every relay (null if k may not pass: no silk west through the Strait)
  TR.cost = function (T, k, ps, base) {
    let v = ps;
    for (let i = 0; i < T.legs.length; i++) {
      const e = T.legs[i], t = TR.tollOf(e, k); if (t < 0) return null;
      if (i) v *= 1 + TR.BROKER;
      v += v * t + base * e.f + v * TR.INTEREST * Math.max(0.5, e.days / 30);
    }
    return v;
  };

  // ---- the month: arrivals, then departures (called by 45's E.caravans on the roads)
  TR.month = function () {
    const S = A.S, eco = S.eco = S.eco || {}, now = A.absDay(), mo = A.monthOf(A.today()).m, Gs = GD.GOODS, car = [];
    let way = Array.isArray(eco.way) ? eco.way : (eco.way = []);
    const g = TR.graph();
    // arrivals: what reaches a market goes into its store (66 puts it in the town)
    const keep = [];
    for (const w of way) {
      const [f, t, k, n, l, d] = w;
      if (d > now) { keep.push(w); continue; }
      const md = A.realm(t) && A.realm(t).mkt;
      if (!md || !md.s || !Gs[k]) continue;   // the market is gone: the goods are sold on the road
      md.s[k] = (md.s[k] || 0) + Math.max(0, n - l);
      car.push({ f, t, k, n: Math.round(n - l), lost: Math.round(l), arr: 1, mo: w[6] || 0, y: S.year, m: mo });
    }
    eco.way = way = keep;
    // what is on the way to each market already
    const inb = {};
    for (const w of keep) { const o = inb[w[1]] = inb[w[1]] || {}; o[w[2]] = (o[w[2]] || 0) + w[3] - w[4]; }
    // departures: a caravan goes from one market to another, a hand or several away, wherever the price there beats
    // what the goods cost by the time they arrive: the road's carting, the tolls, the interest on the money on the
    // road, and the next broker's tenth at every hand on the way (the goods change hands, not their bales' marks)
    const rs = live(), war = new Map();
    const hostile = (x, y) => { const k = x < y ? x + '|' + y : y + '|' + x; let v = war.get(k); if (v == null) { v = !!(A.hostile && A.hostile(x, y)); war.set(k, v); } return v; };
    const cands = [], ks = Object.keys(Gs), NK = ks.length;
    rs.forEach((src, si) => {
      const ms = src.mkt; if (!ms || !ms.s) return;
      const trips = TR.trips(src.id); if (!trips) return;
      for (let ki = 0; ki < NK; ki++) {
        const k = ks[ki], base = Gs[k].base, ps = ms.p[k];
        const spare = (ms.s[k] || 0) - E.normal(ms, k) * 0.8; if (!(spare > 1)) continue;
        trips.forEach((T, ti) => {
          const md = T.md(); if (!md || !md.s) return;
          const pd = md.p[k]; if (!(pd > ps * T.lo)) return;
          const c = TR.cost(T, k, ps, base); if (c == null) return;
          const gain = pd - c - ps * TR.BROKER;
          if (!(gain > 0)) return;
          cands.push({ src, dst: A.realm(T.b), ms, md, k, T, score: gain / base / Math.sqrt(T.hands), o: (si * 64 + ki) * 4096 + ti });
        });
      }
    });
    cands.sort((x, y) => y.score - x.score || x.o - y.o);
    const sent = {}, pending = {}, shut = new Map(), pipe = new Map();
    for (const w of way) { const pk = w[0] + '>' + w[1] + '>' + w[2], o = pipe.get(pk); if (!o || w[5] > o[5]) pipe.set(pk, w); }
    for (const c of cands) {
      // a great market sends more caravans than a small one (45's cap, up to four times it for an empire of millions)
      if ((sent[c.src.id] || 0) >= E.PER_SRC * Math.max(1, Math.min(4, Math.sqrt((c.src.pop || 0) / 2e6)))) continue;
      const on = (inb[c.dst.id] && inb[c.dst.id][c.k] || 0) + (pending[c.dst.id + c.k] || 0);
      // the market wants its normal store, plus what it will use while these goods are on the road
      const nd = E.normal(c.md, c.k), want = nd * 1.2 + ((c.md.d && c.md.d[c.k]) || 0) * c.T.days / 30 - (c.md.s[c.k] || 0) - on, spare = c.ms.s[c.k] - E.normal(c.ms, c.k) * 0.8;
      let q = Math.min(spare, want, Math.max(nd * 0.3, E.normal(c.ms, c.k) * 0.15));
      if (!(q > Math.min(0.5, nd * 0.5)) || !(q > 0.2)) continue;
      // war on any hand of the way, a pass shut, a monsoon not blowing: not this month
      let why = shut.get(c.T); if (why == null) { why = ''; for (const e of c.T.legs) { why = TR.shutWhy(e, mo, hostile); if (why) break; } shut.set(c.T, why); }
      if (why) continue;
      sent[c.src.id] = (sent[c.src.id] || 0) + 1;
      pending[c.dst.id + c.k] = (pending[c.dst.id + c.k] || 0) + q;
      c.ms.s[c.k] -= q;
      // bandits on long roads and in unrest; the cyclones of the southern seas
      let st = Math.min(c.src.stability || 50, c.dst.stability || 50);
      for (const v of c.T.through) { const r = A.realm(v); if (r) st = Math.min(st, r.stability || 50); }
      let lost = 0, risk = Math.min(0.5, Math.pow(1 - st / 100, 2) * c.T.landKm / 6000 + c.T.seaKm / 24000 * 0.25);
      if (c.T.south && [6, 7, 8, 9].includes(mo)) risk += 0.08;
      if (A.chance(risk)) lost = q * A.rf(0.15, 0.4);
      // the tolls are paid at the gates, to their holders
      for (const e of c.T.legs) for (const ck of e.ck) {
        const t = TR.tollOf({ ck: [ck], west: e.west }, c.k); if (!(t > 0)) continue;
        const hr = A.realm(ck.by); if (hr && hr.alive) { const amt = Math.round(q * c.ms.p[c.k] * t); hr.treasury = (hr.treasury || 0) + amt; hr.tolls = (hr.tolls || 0) + amt; }
      }
      const mos = Math.max(1, Math.round(c.T.days / 30));
      // goods on one road that will arrive close together (within a third of the road's days, 30 to MERGE) travel as one
      // entry, arriving on the weighted day: the state keeps a fraction as many
      const pk = c.src.id + '>' + c.dst.id + '>' + c.k, due = now + c.T.days, prevW = pipe.get(pk);
      if (prevW && Math.abs(prevW[5] - due) <= Math.max(30, Math.min(TR.MERGE, c.T.days / 3))) {
        const n2 = prevW[3] + q; prevW[5] = Math.round((prevW[5] * prevW[3] + due * q) / n2); prevW[3] = Math.round(n2 * 100) / 100; prevW[4] = Math.round((prevW[4] + lost) * 100) / 100;
      } else { const w = [c.src.id, c.dst.id, c.k, Math.round(q * 100) / 100, Math.round(lost * 100) / 100, due, mos, c.T.hands]; way.push(w); pipe.set(pk, w); }
      car.push({ f: c.src.id, t: c.dst.id, k: c.k, n: Math.round(q), lost: 0, dep: 1, mo: mos, hands: c.T.hands, km: Math.round(c.T.dist), via: c.T.rn, sea: c.T.seaKm > c.T.landKm ? 1 : 0, y: S.year, m: mo });
    }
    eco.way = way;
    eco.car = car.slice(0, 300);
    eco.carN = car.filter(c => c.dep).length;
    eco.arrN = car.filter(c => c.arr).length;
    return car;
  };

  // ---- measuring (pure): goods on the road, and how far a caravan goes in a month
  TR.onRoad = function () {
    const S = A.S, way = (S.eco && S.eco.way) || [], on = TR.on();
    let n = 0, loads = 0, kmMo = 0, landMo = 0, nl = 0, longest = 0, hands = 0, far = 0;
    for (const w of way) {
      n++; loads += w[3]; hands += w[7] || 1;
      const T = on && (TR.trips(w[0]) || []).find(x => x.b === w[1]); if (!T) continue;
      const v = T.dist / Math.max(1, w[6] || 1); kmMo += v; longest = Math.max(longest, T.dist); if (T.dist > 5000) far++;
      if (!T.seaKm) { landMo += v; nl++; }
    }
    return { n, loads: Math.round(loads), kmPerMonth: n ? Math.round(kmMo / n) : 0, landKmPerMonth: nl ? Math.round(landMo / nl) : 0, longest: Math.round(longest), over5k: far, hands: n ? Math.round(hands / n * 100) / 100 : 0, roads: on ? TR.graph().n : 0 };
  };

  // ---- the fastest way from one market to another, hand by hand (Dijkstra over the graph by days; pure)
  TR.path = function (from, to, opt) {
    if (!TR.on()) return null;
    const g = TR.graph(), o = opt || {}, mo = o.mo != null ? o.mo : A.monthOf(A.today()).m;
    const dist = { [from]: 0 }, prev = {}, done = new Set(), heap = [[0, from]];
    while (heap.length) {
      let bi = 0; for (let i = 1; i < heap.length; i++) if (heap[i][0] < heap[bi][0]) bi = i;
      const [d, a] = heap.splice(bi, 1)[0];
      if (done.has(a)) continue; done.add(a);
      if (a === to) break;
      for (const e of g.out[a] || []) {
        if (!TR.secretOk(e, from, o.pc)) continue;
        if (o.open && TR.shutWhy(e, mo) === 'war') continue;
        if (o.k && TR.tollOf(e, o.k) < 0) continue;
        const w = (o.news ? e.dist / TR.NEWS_KM_DAY + TR.NEWS_HAND_DAYS : e.days + 15);
        const nd = d + w;
        if (dist[e.b] == null || nd < dist[e.b]) { dist[e.b] = nd; prev[e.b] = e; heap.push([nd, e.b]); }
      }
    }
    if (to == null) return { dist, prev };
    if (dist[to] == null) return null;
    const legs = []; let x = to; while (x !== from) { const e = prev[x]; legs.unshift(e); x = e.a; }
    return { days: Math.round(dist[to]), legs };
  };
  // how long word takes from one realm's market to another's, by the brokers' letters along the roads (pure; cached
  // for the graph)
  TR.newsDays = function (from, to) {
    if (!TR.on() || !from || !to || from === to) return null;
    const g = TR.graph(), c = g.news[to] || (g.news[to] = TR.path(to, null, { news: true }).dist);
    const d = c[from];
    return d == null ? null : Math.min(TR.NEWS_CAP, Math.round(d));
  };

  // ---- word comes with the caravans (09-scale holds far news for its distance): a line from beyond the brokers'
  // roads waits as long as their letters take, and says which way it came
  const news = A.news;
  let names = null;
  A.news = function (text, cls) {
    const S = A.S, q0 = S && S.newsFar ? S.newsFar.length : 0, last = S && S.newsFar && q0 ? S.newsFar[q0 - 1] : null;
    const out = news.apply(this, arguments);
    try {
      if (!TR.on() || !S.newsFar || !S.newsFar.length) return out;
      const q = S.newsFar, fresh = [];
      for (let i = q.length - 1; i >= 0 && q[i] !== last; i--) fresh.push(q[i]);
      if (!fresh.length) return out;
      const pc = A.pc(), home = pc && A.homeMkt ? A.homeMkt(pc) : null; if (!home) return out;
      if (!names || names.S !== S) names = { S, L: Object.values(S.realms).map(r => [r.short || r.name, r.id]).filter(x => x[0] && x[0].length > 3).sort((a, b) => b[0].length - a[0].length) };
      const t = String(text); let from = null;
      for (const [nm, id] of names.L) if (t.includes(nm) && id !== home) { from = id; break; }
      if (!from) return out;
      const days = TR.newsDays(from, home); if (days == null) return out;
      const p = TR.path(home, from, { news: true }), via = p && p.legs.length > 1 ? A.realmShort(p.legs[0].b) : null;
      const now = A.absDay();
      for (const x of fresh) {
        if (x.fix) x.due = Math.max(x.due, now + days + 90); else x.due = now + Math.max(10, days);
        if (via && !x.via) { x.via = via; x.dir = `${x.dir}, by way of ${via}`; }
      }
    } catch (e) { console.error('trade news', e); }
    return out;
  };

  // ---- the treasury (world review I3). The far treasuries' growth is not the economy's: the release's ledger gives
  // every AI realm 92% of its income less 3.2 suns a soldier, and 56-realm-inside's ladder lets the coffers fill to
  // 1.5 to 4 years of income; the far realms start the game at a quarter of a year. Taulen's army costs it 14% of its
  // income where the lore says two thirds. TR.LEDGER is the lore's far ledger, and TR.ledgerYear(r) what it would take
  // from a crown in a year: the army at its lore share of revenue, and the half-notes' fall on a treasury that holds
  // them. It changes nothing unless a treasury calls it (the hook for 56 is in the README) or TR.APPLY_LEDGER is set.
  TR.LEDGER = {
    'POL-36': { army: 0.66, notes: 0.6, fall: 0.02, d: 'the army eats two thirds of the revenue; the half-notes lose about two in a hundred a year' },
    'POL-37': { army: 0.5, d: 'the banners are paid in grain, land and the khagan\'s silk' },
    'POL-58': { army: 0.3 }, 'POL-91': { army: 0.45 }, 'POL-92': { army: 0.55, d: 'a month\'s pay late is a revolt' },
  };
  TR.ledgerYear = function (r) {
    const L = r && TR.LEDGER[baseId(r.id)]; if (!L || !(r.income > 0)) return { army: 0, notes: 0 };
    const paid = (r.army || 0) * 3.2 + (r.levy || 0) * 0.05, want = r.income * 0.92 * (L.army || 0);
    const army = Math.max(0, Math.round(want - paid));
    const notes = L.notes ? Math.max(0, Math.round((r.treasury || 0) * L.notes * (L.fall || 0))) : 0;
    return { army, notes };
  };
  const wy = A.worldYear;
  A.worldYear = function () {
    const out = wy.apply(this, arguments);
    try {
      if (TR.APPLY_LEDGER && TR.on()) for (const r of live()) {
        if (r.playerRun) continue;
        const x = TR.ledgerYear(r); if (!x.army && !x.notes) continue;
        r.treasury -= x.army + x.notes; r.ledgerLore = { y: A.S.year, army: x.army, notes: x.notes };
        if (r.treasury < 0) { r.debt = (r.debt || 0) - r.treasury; r.treasury = 0; }
      }
    } catch (e) { console.error('trade ledger', e); }
    return out;
  };
})();
