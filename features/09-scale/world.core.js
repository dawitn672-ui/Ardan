// 09-scale, one world: the rules a continent of 153 realms needs so that it plays as one world, not 153 at once.
// The release was written for 35 realms in 7,000 km, where every realm can reach every other. On the Great
// Continent (S.world.parts > 1, 99-far-lands) that no longer holds, and four things went wrong (README, "One world"):
//   - wars and coalitions were joined across the continent: a coalition of 25 realms from six lands against one Twin
//     Rivers kingdom, allies marching 3,000 km to wars with no front;
//   - the release's cap of four wars at once (A.aiWarCheck) was shared by the whole continent, so a war in the Black
//     Pines kept the Known World at peace (the cap was full on 18-36% of days);
//   - none of the lore's 53 tributes was made (the release reads a tribute as a trade pact), so no tie of the lore held;
//   - the news took every line from every realm (about 400 a year against 100 on the Known World), so the 220 lines the
//     player sees reached back half a year and were mostly about lands they will never see.
// Everything here is gated on the Great Continent: a Known World game never calls any of it (patches.mjs asks
// A.warCapFull and A.outOfReach, which answer null and false there), so it plays bit for bit as before.
(function () {
  const W = A.WORLD1 = {
    REACH: 1500,          // km: a realm can make war on, or march to the help of, a realm whose land comes this near its own
    WARS_PER_35: 4,       // the release's cap of wars at once, for its 35 realms: each land gets its share of it
    NEAR_KM: 2000,        // km from home: news of realms nearer than this (or tied to yours) comes as it happens
    KM_A_DAY: 40,         // how fast word travels on the roads and the sea lanes
    TIE_YEARS: 12,        // the lore's tributes hold at least this long
    stats: { held: 0, dropped: 0, told: 0 },
  };
  const great = W.great = () => { const S = A.S; return !!(S && S.world && Array.isArray(S.world.parts) && S.world.parts.length > 1); };
  // the land a realm sits in, from its capital: the far lands' region codes (F-03 is the Long Grass), K for the Known World
  W.landOf = function (r) {
    const S = A.S, P = r && r.capitalProv != null ? S.prov[r.capitalProv] : null;
    return P && typeof P.region === 'string' && P.region ? P.region[0] : 'K';
  };
  const provsOf = rid => { const SC = A.WSCALE, L = SC && SC.live && !A.SCALE_OFF && SC.land ? SC.land().by.get(rid) : null; return L || A.realmProvs(rid); };

  // ---- reach: the nearest land of one realm to the other's capital, both ways, remembered for the day
  let RM = null;
  W.reachKm = function (a, b) {
    const S = A.S, day = A.absDay(), ep = A.WSCALE ? A.WSCALE.ep.land : 0;
    if (!RM || RM.S !== S || RM.day !== day || RM.ep !== ep) RM = { S, day, ep, m: new Map() };
    const key = a < b ? a + '|' + b : b + '|' + a;
    let v = RM.m.get(key);
    if (v !== undefined) return v;
    const ra = A.realm(a), rb = A.realm(b);
    v = Infinity;
    if (ra && rb) {
      const ca = ra.capitalProv, cb = rb.capitalProv;
      if (cb != null) for (const p of provsOf(a)) { const d = A.wsDist(p.id, cb); if (d < v) v = d; }
      if (ca != null) for (const p of provsOf(b)) { const d = A.wsDist(p.id, ca); if (d < v) v = d; }
      if (v === Infinity && ca != null && cb != null) v = A.wsDist(ca, cb);
    }
    RM.m.set(key, v);
    return v;
  };
  A.outOfReach = function (a, b) {
    if (!great() || !a || !b || a === b) return false;
    return W.reachKm(a, b) > W.REACH;
  };

  // ---- wars at once, by land: each land its share of the release's four (at least one), so the Known World keeps its
  // four whatever the far lands do. A war counts for the land of the realm that started it.
  A.warCapFull = function () {
    if (!great()) return null;
    const S = A.S, n = {}, wars = {};
    for (const id in S.realms) { const r = S.realms[id]; if (r.alive) { const L = W.landOf(r); n[L] = (n[L] || 0) + 1; } }
    for (const w of S.wars) if (w.cb !== 'throne') { const L = W.landOf(A.realm(w.leadA)); wars[L] = (wars[L] || 0) + 1; }
    return r => { const L = W.landOf(r); return (wars[L] || 0) >= Math.max(1, Math.round(W.WARS_PER_35 * (n[L] || 0) / 35)); };
  };

  // ---- the lore's tributes: made at the start of a Great Continent game, and kept for a while
  const init = A.initWorld;
  A.initWorld = function () {
    const r = init.apply(this, arguments);
    try {
      const F = A.FAR, S = A.S;
      if (F && F.active && S && F.D && Array.isArray(F.D.relations)) {
        S.loreTies = S.loreTies || {};
        for (const x of F.D.relations) {
          if (x.rel !== 'debt' || !/^tribute\b/i.test(x.detail || '')) continue;
          const a = S.realms[x.a], b = S.realms[x.b];
          if (!a || !b || !a.alive || !b.alive || a === b || a.overlord || b.overlord === a.id || a.playerRun) continue;
          a.overlord = b.id;
          if (a.allies) a.allies = a.allies.filter(id => id !== b.id);
          if (b.allies) b.allies = b.allies.filter(id => id !== a.id);
          S.loreTies[a.id] = { o: b.id, y: S.year };
        }
      }
    } catch (e) { console.error('lore ties', e); }
    return r;
  };
  // a tributary of the lore does not throw off its overlord in the first years (unless its overlord has fallen, which
  // the release checks first); after that the release's rules (and 20's temperaments) decide
  // (A.aiDefy is 20-ai-personality's, defined after this file: it is wrapped when the first year's politics begin)
  const guardDefy = function () {
    const f = A.aiDefy;
    if (typeof f !== 'function' || f.loreTies) return;
    const g = function (rid, ov) {
      const S = A.S, t = great() && S.loreTies && S.loreTies[rid];
      if (t && t.o === ov && S.year - t.y < W.TIE_YEARS) return false;
      return f.apply(this, arguments);
    };
    g.loreTies = true;
    A.aiDefy = g;
  };
  const politicsYear = A.politicsYear;
  A.politicsYear = function () { if (great()) guardDefy(); return politicsYear.apply(this, arguments); };

  // ---- news: what happens far off comes late, and only the great things come at all
  // A line is far when every realm it names is more than NEAR_KM from the player's home and none is the player's own,
  // a neighbour, an ally, an overlord or a foe at war with it. A far declaration of war, a peace, a crown changing hands
  // or a tributary arrives after the days word takes to travel; a far battle, harvest or skirmish is not heard of.
  // only the turns of history travel that far: a war declared or ended, a coalition, a realm fallen or founded, a
  // throne changing hands, a tributary won or lost; and no more than FAR_A_YEAR such lines a year
  const BIG = new Set(['war', 'peace', 'crown', 'tribute', 'map']);
  const GREAT_NEWS = /declares war|declared by|\bends: |march together|coalition|is no more|has fallen|falls\.|is destroyed|is founded|founds |crowned|takes the throne|succeeds|\bdies\b|is dead|tributary|stops paying tribute|rises in revolt|breaks away/i;
  W.FAR_A_YEAR = 30;
  let NM = null;
  const names = function () {
    const S = A.S, ep = A.WSCALE ? A.WSCALE.ep.realm : 0;
    if (NM && NM.S === S && NM.ep === ep && NM.n === Object.keys(S.realms).length) return NM.list;
    const list = [];
    for (const id in S.realms) { const r = S.realms[id]; for (const s of [r.name, r.short]) if (s && s.length >= 3) list.push([s, id]); }
    list.sort((x, y) => y[0].length - x[0].length);
    NM = { S, ep, n: Object.keys(S.realms).length, list };
    return list;
  };
  const tiedSet = function (pc) {
    const S = A.S, mine = new Set([pc.realm, pc.mil && pc.mil.realm, pc.ruler].filter(Boolean));
    for (const id of [...mine]) {
      const r = A.realm(id); if (!r) continue;
      for (const n of A.neighbors(id)) mine.add(n);
      for (const al of r.allies || []) mine.add(al);
      if (r.overlord) mine.add(r.overlord);
    }
    for (const w of S.wars || []) if (w.att.concat(w.def).some(x => mine.has(x))) for (const x of w.att.concat(w.def)) mine.add(x);
    return mine;
  };
  W.farOf = function (text) {
    const pc = A.pc(); if (!pc || pc.home == null || typeof text !== 'string') return null;
    const S = A.S, home = S.prov[pc.home]; if (!home) return null;
    const seen = new Set();
    let s = text;
    for (const [nm, id] of names()) if (s.includes(nm)) { seen.add(id); s = s.split(nm).join('\u0000'); }
    if (!seen.size) return null;
    const tied = tiedSet(pc);
    let km = Infinity, at = null;
    for (const id of seen) {
      if (tied.has(id)) return null;
      const r = A.realm(id), P = r && r.capitalProv != null ? S.prov[r.capitalProv] : null; if (!P) continue;
      const d = Math.hypot(P.x - home.x, P.y - home.y);
      if (d < km) { km = d; at = P; }
    }
    if (!at || km <= W.NEAR_KM) return null;
    const dx = at.x - home.x, dy = at.y - home.y;
    const dir = Math.abs(dx) > Math.abs(dy) * 2 ? (dx > 0 ? 'east' : 'west') : Math.abs(dy) > Math.abs(dx) * 2 ? (dy > 0 ? 'south' : 'north') : (dy > 0 ? 'south' : 'north') + (dx > 0 ? '-east' : '-west');
    return { km: Math.round(km), dir };
  };
  const news = A.news;
  A.news = function (text, cls) {
    if (!great() || W.telling) return news.apply(this, arguments);
    let far = null;
    try { far = W.farOf(text); } catch (e) { console.error('far news', e); }
    if (!far) return news.apply(this, arguments);
    if (!BIG.has(cls) || !GREAT_NEWS.test(String(text))) { W.stats.dropped++; return; }
    const S = A.S, q = S.newsFar = S.newsFar || [];
    if (q.filter(x => x.y === S.year).length + (S.newsFarN && S.newsFarN.y === S.year ? S.newsFarN.n : 0) >= W.FAR_A_YEAR) { W.stats.dropped++; return; }
    const due = A.absDay() + Math.max(10, Math.min(240, Math.round(far.km / W.KM_A_DAY)));
    q.push({ due, t: String(text), c: cls || '', dir: far.dir, y: S.year });
    if (q.length > 200) q.splice(0, q.length - 200);
    W.stats.held++;
  };
  W.deliver = function () {
    const S = A.S, q = S && S.newsFar;
    if (!q || !q.length) return;
    const now = A.absDay();
    const due = q.filter(x => x.due <= now);
    if (!due.length) return;
    S.newsFar = q.filter(x => x.due > now);
    W.telling = true;
    const N = S.newsFarN && S.newsFarN.y === S.year ? S.newsFarN : (S.newsFarN = { y: S.year, n: 0 });
    try { for (const x of due) { news.call(A, `Word from the ${x.dir}${x.y !== S.year ? ` (of ${x.y})` : ''}: ${x.t}`, x.c); W.stats.told++; if (x.y === S.year) N.n++; } }
    finally { W.telling = false; }
  };
  A.onDay.push(() => { try { if (great()) W.deliver(); } catch (e) { console.error('far news', e); } });
})();
