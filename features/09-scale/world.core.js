// 09-scale, one world: the rules a continent of 153 realms needs so that it plays as one world, not 153 at once.
// The release was written for 35 realms in 7,000 km, where every realm can reach every other. On the Great
// Continent (S.world.parts > 1, 99-far-lands) that no longer holds, and four things went wrong (README, "One world"):
//   - wars and coalitions were joined across the continent: a coalition of 25 realms from six lands against one Twin
//     Rivers kingdom, allies marching 3,000 km to wars with no front;
//   - the release's cap of four wars at once (A.aiWarCheck) was shared by the whole continent, so a war in the Black
//     Pines kept the Known World at peace (the cap was full on 18-36% of days);
//   - none of the lore's 53 tributes was made (the release reads a tribute as a trade pact) nor its 3 alliances sworn;
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
    const day = A.absDay();
    return r => { const L = W.landOf(r); return W.inGrace(L, day) || (wars[L] || 0) >= Math.max(1, Math.round(W.WARS_PER_35 * (n[L] || 0) / 35)); };
  };
  // cycle 1 (world review B2): a far land opens on the lore's tensions, not on a redrawn map. For its first 12 to 18
  // months (by land, from the land's code, no dice) no AI realm there starts a war of its own; the lore's wars of 1105
  // (991-far-war) and wars that are not the AI's choice (successions, revolts) go on. S.w1t0 is the day a Great
  // Continent game began (a save without it has no grace).
  W.GRACE = L => 12 + (L.charCodeAt(0) * 5) % 7;   // months
  W.inGrace = function (L, day) {
    const S = A.S;
    if (L === 'K' || S.w1t0 == null) return false;
    return day < S.w1t0 + W.GRACE(L) * 30.4;
  };

  // ---- the lore's tributes: made at the start of a Great Continent game, and kept for a while
  const init = A.initWorld;
  A.initWorld = function () {
    const r = init.apply(this, arguments);
    try {
      const F = A.FAR, S = A.S;
      if (F && F.active && S && F.D && Array.isArray(F.D.relations)) {
        S.w1t0 = A.absDay();
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
        // and the lore's alliances are sworn (the release read them as opinion only)
        for (const x of F.D.relations) {
          if (x.rel !== 'alliance') continue;
          const a = S.realms[x.a], b = S.realms[x.b];
          if (a && b && a.alive && b.alive && a !== b && a.overlord !== b.id && b.overlord !== a.id && A.ally) A.ally(a.id, b.id);
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

  // ---- cycle 1 (world review B3, lives review B8): a peace takes a share of the loser, not a count of provinces.
  // The Twin Rivers' provinces are districts (seeded by people), so the release's treaty budget (6 + 70 x people
  // share a province) bought 15 to 22 of them a peace there. On the Great Continent a peace that a far realm loses
  // takes at most PEACE_SHARE of its people and of its land (by cells), and at least one province; a war that names
  // its own limit (w.fwLimit, 991-far-war's border wars) takes no more than that many.
  W.PEACE_SHARE = 0.15;
  W.MIN_WAR_DAYS = 270;   // a far war is not won or lost with terms in under nine months, unless a capital falls
  const farLoser = rid => !!(A.FAR && A.FAR.D && A.FAR.D.realms && A.FAR.D.realms[rid]);
  W.capTreaty = function (w, res, taken) {
    const lose = res === 'att' ? w.leadD : w.leadA, max = w.fwLimit && w.fwLimit.max;
    if (!farLoser(lose) && !max) return taken;
    const S = A.S, mine = S.prov.filter(p => p.owner === lose);
    const pop = mine.reduce((a, p) => a + p.pop, 0) || 1, cells = mine.reduce((a, p) => a + (p.cells || 1), 0) || 1;
    const out = []; let tp = 0, tc = 0;
    for (const p of taken) {
      if (max && out.length >= max) break;
      const own = p.owner === lose, np = tp + (own ? p.pop : 0), nc = tc + (own ? (p.cells || 1) : 0);
      if (out.length && farLoser(lose) && (np > pop * W.PEACE_SHARE || nc > cells * W.PEACE_SHARE)) continue;
      out.push(p); tp = np; tc = nc;
    }
    W.stats.capped = (W.stats.capped || 0) + (taken.length - out.length);
    return out;
  };
  const wtp = A.wsTreatyProvinces;
  if (typeof wtp === 'function') A.wsTreatyProvinces = function (w, res) {
    const t = wtp.apply(this, arguments);
    try { if (great() && w && Array.isArray(t)) return W.capTreaty(w, res, t); } catch (e) { console.error('peace cap', e); }
    return t;
  };
  // the crushing peace (a war score of 90 with every province held) annexes the whole realm; a far realm too large
  // for one peace's share (more than a handful of provinces) is not swallowed so: the score is held under 90 for it
  // a far war is not settled (by any road: the AI's offers, a faction's peace, the war clock) before W.MIN_WAR_DAYS,
  // nor a border war (w.fwLimit) before its own day, unless a capital has fallen or a player's realm makes the peace
  W.tooSoon = function (w, res) {
    if (!w || w.d0 == null) return false;
    const la = A.realm(w.leadA), ld = A.realm(w.leadD);
    if (!la || !ld || !la.alive || !ld.alive || la.playerRun || ld.playerRun || w.cb === 'throne') return false;
    const lim = w.fwLimit && w.fwLimit.until || 0;
    const until = Math.max(lim, res !== 'white' && (farLoser(w.leadA) || farLoser(w.leadD)) ? w.d0 + W.MIN_WAR_DAYS : 0);
    if (A.absDay() >= until) return false;
    const capFallen = (r, by) => { const P = r.capitalProv != null ? A.prov(r.capitalProv) : null; return !!(P && by.includes(P.occ)); };
    // a border war (w.fwLimit) runs its course even past a fallen capital: its peace cannot take the realm anyway
    return !!lim && A.absDay() < lim || !(capFallen(ld, w.att) || capFallen(la, w.def));
  };
  // the crushing peace (a war score of 90 with every province held) annexes the whole realm; a far realm too large
  // for one peace's share (more than a handful of provinces) is not swallowed so: the score is held under 90 for it
  const sw = A.settleWar;
  if (typeof sw === 'function') A.settleWar = function (w, res) {
    if (!great() || !w) return sw.apply(this, arguments);
    try { if (W.tooSoon(w, res)) { W.stats.held_peace = (W.stats.held_peace || 0) + 1; return; } } catch (e) { console.error('peace floor', e); }
    if (res !== 'att' && res !== 'def') return sw.apply(this, arguments);
    const lose = res === 'att' ? w.leadD : w.leadA, big = farLoser(lose) && A.realmProvs(lose).length > 4;
    if (!(big || (w.fwLimit && w.fwLimit.max)) || Math.abs(w.score) < 90) return sw.apply(this, arguments);
    const sc = w.score; w.score = sc > 0 ? 89 : -89;
    try { return sw.apply(this, arguments); } finally { w.score = sc; }
  };
  const sw0 = A.startWar;
  if (typeof sw0 === 'function') A.startWar = function () {
    const w = sw0.apply(this, arguments);
    try { if (w && great() && w.d0 == null) w.d0 = A.absDay(); } catch (e) {}
    return w;
  };

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
    // a line told before the player has a home (the lore's wars of 1105 are declared while the world is built) waits
    // for the first day of the life, and then comes as late as its distance says (world review B9)
    const S0 = A.S, pc0 = A.pc();
    if (S0 && (!pc0 || pc0.home == null)) { (S0.newsPre = S0.newsPre || []).push([String(text), cls || '']); return; }
    let far = null;
    try { far = W.farOf(text); } catch (e) { console.error('far news', e); }
    if (!far) return news.apply(this, arguments);
    if (!BIG.has(cls) || !GREAT_NEWS.test(String(text))) { W.stats.dropped++; return; }
    const S = A.S, q = S.newsFar = S.newsFar || [];
    if (q.filter(x => x.y === S.year).length + (S.newsFarN && S.newsFarN.y === S.year ? S.newsFarN.n : 0) >= W.FAR_A_YEAR) { W.stats.dropped++; return; }
    const days = Math.round(far.km / W.KM_A_DAY), due = A.absDay() + Math.max(10, Math.min(far.km > W.GARBLE_KM ? 730 : 240, days));
    const g = far.km > W.GARBLE_KM ? W.garble(String(text)) : null;
    q.push({ due, t: g ? g.t : String(text), c: cls || '', dir: far.dir, y: S.year });
    if (g && g.wrong) q.push({ due: due + 120 + W.hashT(text) % 180, t: String(text), c: cls || '', dir: far.dir, y: S.year, fix: 1 });
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
    try { for (const x of due) { news.call(A, `${x.fix ? 'Later word from the ' + x.dir + ' mends the first' : 'Word from the ' + x.dir}${x.y !== S.year ? ` (of ${x.y})` : ''}: ${x.t}`, x.c); W.stats.told++; if (x.y === S.year) N.n++; } }
    finally { W.telling = false; }
  };
  A.onDay.push(() => {
    try {
      if (!great()) return;
      const S = A.S, pc = A.pc();
      if (S.newsPre && pc && pc.home != null) { const L = S.newsPre; delete S.newsPre; for (const [t, c] of L) A.news(t, c); }
      W.deliver();
    } catch (e) { console.error('far news', e); }
  });
  // ---- cycle 1 (world review I5): word from beyond GARBLE_KM is a year or two old, has passed brokers, and is
  // wrong in some way that matters. A list of provinces becomes "lands"; one line in three (by the text's own hash,
  // no dice) has a detail wrong: the cause of a death, or who won a war; the true line follows months later.
  W.GARBLE_KM = 5000;
  W.hashT = t => { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const CAUSES = ['a fever', 'poison, the traders say', 'a fall from his horse', 'a wasting sickness', 'a knife in the night, some say', 'a winter cough', 'old age'];
  W.garble = function (t) {
    const h = W.hashT(t);
    let out = t.replace(/ and takes ([^.]+?) from ([^.]+)\./, (m, list, from) => {
      const n = list.split(/,| and /).length;
      return ` and takes ${n <= 2 ? 'border country' : n <= 6 ? 'a stretch of land' : 'a great swathe of land'} from ${from}.`;
    });
    let wrong = false;
    if (h % 3 === 0) {
      const d = /\(([^)]+)\)\./.exec(out);
      if (d && /is dead/.test(out)) {
        const c = CAUSES.filter(x => x !== d[1]); out = out.replace(d[0], `(${c[h % c.length]}).`); wrong = true;
      } else {
        const m = /^(.+?) ends: (.+?) wins and takes (.+?) from (.+?)\.$/.exec(out);
        if (m) { out = `${m[1]} ends, and the caravans say ${m[4]} won it.`; wrong = true; }
      }
    }
    return { t: out, wrong };
  };
  // ---- told at birth: 43's and 70's opening notes ("the world you are born into", "older quarrels") name realms
  // anywhere on the continent. A child hears only of those within reach of home: a note is kept when a realm it names is
  // the player's own or within reach of it (a note that names no realm is kept). Runs before 43's and 70's telling.
  W.nearNote = function (pc, t) {
    const S = A.S, mine = pc.realm; let named = false;
    for (const id in S.realms) {
      const r = S.realms[id]; if (!r) continue;
      if ([r.short, r.name].some(n => n && t.includes(n))) { named = true; if (id === mine || !A.outOfReach(mine, id)) return true; }
    }
    return !named;
  };
  A.onMonth.push(pc => {
    const S = A.S;
    if (!great() || !pc || S.notesNear) return;
    S.notesNear = 1;
    for (const k of ['worldNotes', 'freshNotes']) if (Array.isArray(S[k]) && !S[k === 'worldNotes' ? 'worldTold' : 'freshTold']) S[k] = S[k].filter(t => W.nearNote(pc, t));
  });
})();
