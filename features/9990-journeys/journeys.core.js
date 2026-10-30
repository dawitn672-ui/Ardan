// 9990-journeys: travel is a road, not a teleport (design review cycle 1, #17).
//
// A journey goes over the province graph (land borders and sea lanes), priced in days: a day's walk is JR.SPEED km,
// slower in rough country (66-markets' terrain factors), faster on the lore's great routes (99-far-lands' FL.roads,
// D.routes), by ship on a sea lane, and slower again in the wrong season (snow on the passes, the thaw on the fords,
// summer on the sands). The route passes through stops, about one every JR.STOP_KM; the journey goes on as the days
// pass (A.onDay), and at up to JR.MAX_SCENES of its stops a scene of that land comes up: its border, a sea passage,
// a great route, its customs (47-realm-bible, 990-far-peoples), its folk and their words, a beast near it (76, 992),
// a wild place (997-wilds), a caravan (45-economy's S.eco.car), the news at the inn (57's world record), the weather.
//
// Kinds of journey:
//   move      "Travel or move away": you live at the far end once you arrive (the release's A.travelTo, run at arrival)
//   visit     go and come back: the same modal, "go and come back" (home is kept; at the far end a scene asks)
//   caravan   walk with one of this month's caravans out of your realm, for a guard's wage at the far end
//   pilgrim   the release's pilgrimage, now a road to a shrine of your faith and back
//   return    the way home from a visit, a caravan, a pilgrimage, or a journey you turned back from
//   exile, flight, emigrate, school, settle: the release (or a feature) already moved you; the road is told after
//             (pc.journey.applied), so the land between is seen and the life does not jump
//
// State: pc.journey (the road you are on; optional, old saves have none), pc.jrAt (where the journey system last saw you
// live, so a move made elsewhere becomes a told journey), pc.jrLog (the last 30 journeys, for the Atlas). The atlas
// (9991-atlas, A.ATLAS) is told what you pass through. Every draw goes through A.rand; rendering only reads.
(function () {
  const JR = A.JR = A.JR || {};
  JR.OFF = false;
  JR.SPEED = 26;          // km a day, walking with a pack, on an ordinary road
  JR.SEA = 95;            // km a day under sail
  JR.ROUTE = 1.5;         // a great route is this much faster (paved, watered, policed)
  JR.STOP_KM = 220;       // a stop about every so many km
  JR.MAX_SCENES = 5;      // scenes on one journey, the arrival aside
  JR.SHORT_KM = 120;      // a journey shorter than this has no stops
  JR.TERR = { plains: 1, steppe: 1, hills: 1.3, forest: 1.25, marsh: 1.6, mountains: 1.9, desert: 1.5, tundra: 1.5 };
  JR.KINDS = { move: 'the road', visit: 'a journey', caravan: 'a caravan', pilgrim: 'a pilgrimage', return: 'the road home',
    exile: 'exile', flight: 'flight', emigrate: 'the road', school: 'the road', settle: 'the road' };
  (A.FX_EXTRA = A.FX_EXTRA || []).push('jr');

  const P_ = id => (A.S && A.S.prov ? A.S.prov[id] : null);
  const km = (a, b) => { const p = P_(a), q = P_(b); return p && q ? Math.hypot(p.x - q.x, p.y - q.y) : 0; };
  const roadF = (a, b) => (A.FAR && typeof A.FAR.roadF === 'function' ? A.FAR.roadF(a, b) : 1);
  const the = s => String(s || '').replace(/^The /, 'the ');
  const MO = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = day => { try { return A.monthOf(((day % 365) + 365) % 365).m; } catch (e) { return 0; } };
  JR.season = m => (m === 11 || m <= 1 ? 'winter' : m <= 4 ? 'spring' : m <= 7 ? 'summer' : 'autumn');
  JR.on = pc => !!(pc && pc.journey && typeof pc.journey === 'object' && Array.isArray(pc.journey.path));

  // ---- the route --------------------------------------------------------------------------------------------------------
  // days for one step at a given month of the year (sea: a lane between two coasts, or no land border between them)
  JR.stepDays = function (a, b, sea, m) {
    const d = km(a, b), Q = P_(b); if (!Q) return Infinity;
    const s = JR.season(m == null ? 8 : m);   // no month: an ordinary autumn road
    if (sea) return d / JR.SEA * (s === 'winter' ? 1.35 : 1);
    let f = JR.TERR[Q.terr] || 1.2;
    if (s === 'winter') f *= ['mountains', 'tundra'].includes(Q.terr) ? 1.8 : Q.terr === 'desert' ? 1 : 1.3;
    else if (s === 'spring' && ['marsh', 'plains', 'forest'].includes(Q.terr)) f *= 1.15;
    else if (s === 'summer' && ['desert', 'steppe'].includes(Q.terr)) f *= 1.25;
    const fast = roadF(a, b) < 1 ? JR.ROUTE : 1;
    return d / (JR.SPEED * fast) * f;
  };
  // shortest roads from one province to every other, in days at an average season (a pure function of the map)
  let memo = null;
  JR.tree = function (from) {
    const S = A.S; if (!S || !S.prov || !P_(from)) return null;
    if (memo && memo.prov === S.prov && memo.from === from && memo.n === S.prov.length) return memo.t;
    const N = S.prov.length, d = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), sea = new Uint8Array(N), h = [];
    const push = (c, v) => { h.push([c, v]); let i = h.length - 1; while (i) { const p = (i - 1) >> 1; if (h[p][0] <= h[i][0]) break; [h[p], h[i]] = [h[i], h[p]]; i = p; } };
    const pop = () => { const top = h[0], last = h.pop(); if (h.length) { h[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < h.length && h[l][0] < h[m][0]) m = l; if (r < h.length && h[r][0] < h[m][0]) m = r; if (m === i) break; [h[m], h[i]] = [h[i], h[m]]; i = m; } } return top; };
    d[from] = 0; push(0, from);
    while (h.length) {
      const [c, u] = pop(); if (c > d[u]) continue;
      const U = S.prov[u], land = U.adj || [], lanes = U.sea || [];
      for (const v of land) { const c2 = c + JR.stepDays(u, v, false); if (c2 < d[v]) { d[v] = c2; prev[v] = u; sea[v] = 0; push(c2, v); } }
      for (const v of lanes) { if (land.includes(v)) continue; const c2 = c + JR.stepDays(u, v, true) + 1; if (c2 < d[v]) { d[v] = c2; prev[v] = u; sea[v] = 1; push(c2, v); } }
    }
    const t = { d, prev, sea };
    memo = { prov: S.prov, from, n: N, t };
    return t;
  };
  // the road from a to b: provinces, which steps are by sea, km, and days when setting out on absolute day `start`
  JR.route = function (a, b, start) {
    if (!P_(a) || !P_(b) || a === b) return null;
    const t = JR.tree(a); let path = [], sea = [];
    if (t && isFinite(t.d[b])) {
      for (let v = b; v !== -1 && v !== a; v = t.prev[v]) { path.push(v); sea.push(t.sea[v]); }
      path.push(a); sea.push(0); path.reverse(); sea.reverse();
    } else { path = [a, b]; sea = [0, 1]; }   // no road on the map: a ship's passage straight across
    let days = 0, dist = 0; const at = [0], kmAt = [0], m0 = start == null ? (A.S ? A.absDay() : 0) : start;
    for (let i = 1; i < path.length; i++) {
      days += JR.stepDays(path[i - 1], path[i], !!sea[i], month(m0 + days)) + (sea[i] && !sea[i - 1] ? 1 : 0);
      dist += km(path[i - 1], path[i]); at.push(days); kmAt.push(dist);
    }
    return { path, sea, at, kmAt, km: Math.round(dist), days: Math.max(1, Math.round(days)) };
  };
  // roads from a province to every province (one search), for the travel modal: days and km by the road
  JR.reach = function (from) {
    const t = JR.tree(from); if (!t) return null;
    return { days: id => (isFinite(t.d[id]) ? Math.max(1, Math.round(t.d[id])) : null), t };
  };
  // the great route a step is on (99's D.routes), by name
  JR.routeName = function (a, b) {
    const FL = A.FAR, D = FL && FL.active && FL.D; if (!D || !Array.isArray(D.routes) || roadF(a, b) >= 1) return null;
    for (const r of D.routes) for (let i = 1; i < r.p.length; i++) if ((r.p[i - 1] === a && r.p[i] === b) || (r.p[i - 1] === b && r.p[i] === a)) return String(r.n || '').replace(/:.*$/, '');
    return null;
  };

  // ---- planning and setting out ------------------------------------------------------------------------------------------
  JR.plan = function (pc, to, kind, o) {
    o = o || {};
    const from = o.from != null ? o.from : pc.home, R = JR.route(from, to, A.absDay()); if (!R) return null;
    const stops = [];
    if (R.km >= JR.SHORT_KM) {
      const n = Math.max(1, Math.round(R.km / JR.STOP_KM)), step = R.km / (n + 1);
      let want = step;
      for (let i = 1; i < R.path.length - 1 && stops.length < n; i++) if (R.kmAt[i] >= want) { stops.push({ pi: i, p: R.path[i], d: Math.round(R.at[i]) }); want = R.kmAt[i] + step; }
    }
    // which stops have a scene: all of them up to MAX_SCENES, else spread evenly
    const ns = stops.length, k = Math.min(ns, JR.MAX_SCENES);
    for (let i = 0; i < k; i++) stops[Math.floor((i + 0.5) * ns / k)].sc = 1;
    return { k: kind, from, to, path: R.path, sea: R.sea, pd: R.at.map(x => Math.round(x)), km: R.km, days: R.days, stops, i: 0, t0: A.absDay(), at: from, pi: 0,
      y: A.S.year, seen: [], applied: !!o.applied, home: o.home != null ? o.home : pc.home, extra: o.extra || null };
  };
  JR.start = function (pc, to, kind, o) {
    if (!pc || JR.on(pc)) return null;
    const j = JR.plan(pc, to, kind, o); if (!j) return null;
    pc.journey = j;
    JR.see(pc, j.from, 'seen');
    const T = P_(to), r = T && A.realm(T.owner), s = JR.season(month(A.absDay()));
    const line = {
      move: `You set out for ${T.name}${r ? ', in ' + r.name : ''}: ${A.fmt(j.km)} km, about ${j.days} days on the road${s === 'winter' ? ', more if the snow holds' : ''}.`,
      visit: `You set out for ${T.name} with your home behind you, meaning to come back: ${A.fmt(j.km)} km, about ${j.days} days each way.`,
      caravan: `You walk out with the caravan bound for ${T.name}: ${A.fmt(j.km)} km at a beast's pace, about ${j.days} days.`,
      pilgrim: `The shrine at ${T.name} is ${A.fmt(j.km)} km off, about ${j.days} days on foot.`,
      return: `You turn for home: ${A.fmt(j.km)} km, about ${j.days} days.`,
    }[kind];
    if (line && !j.applied) A.log(line, 'good');
    return j;
  };
  // a move another system already made (exile, flight, emigrating, a school, an arc): the road between is told after
  JR.after = function (pc, from, to, kind) {
    if (JR.OFF || !pc || from == null || to == null || from === to || JR.on(pc)) return null;
    if (km(from, to) < JR.SHORT_KM) return null;
    return JR.start(pc, to, kind || 'move', { from, applied: true, home: to });
  };

  // ---- the atlas is told what you see (9991-atlas; nothing if it is not built)
  JR.see = function (pc, id, how) { try { if (A.ATLAS && A.ATLAS.see) A.ATLAS[how === 'heard' ? 'hear' : 'see'](pc, id, how === 'heard' ? 'r' : 'j'); } catch (e) {} };

  // ---- the road, day by day (A.onDay) -----------------------------------------------------------------------------------
  JR.tick = function (pc) {
    if (JR.OFF || !pc || !pc.alive) return;
    // a move made by some other system becomes a told journey
    if (pc.jrAt == null) pc.jrAt = pc.home;
    else if (pc.jrAt !== pc.home) {
      const from = pc.jrAt; pc.jrAt = pc.home;
      if (!JR.on(pc) && !JR.arriving) JR.after(pc, from, pc.home, JR.nextKind || JR.guessKind(pc));
      JR.nextKind = null;
    }
    const j = pc.journey; if (!JR.on(pc)) return;
    if (pc.prison) { j.t0++; return; }   // the road waits while you are held
    const now = A.absDay();
    if (j.wait != null) { if (now >= j.wait) JR.homeward(pc); return; }
    if (A.S.queue.length) return;          // one thing at a time: the scene in hand is played first
    // the provinces between stops are passed (and seen) as the days go
    if (Array.isArray(j.pd)) while (j.pi + 1 < j.path.length && j.t0 + j.pd[j.pi + 1] <= now && (j.i >= j.stops.length || j.pi + 1 < j.stops[j.i].pi)) JR.passTo(pc, j, j.pi + 1);
    while (j.i < j.stops.length && j.t0 + j.stops[j.i].d <= now) {
      const st = j.stops[j.i++];
      JR.passTo(pc, j, st.pi);
      if (st.sc && JR.scene(pc, j, st)) return;
    }
    if (j.i >= j.stops.length && j.t0 + j.days <= now) JR.arrive(pc);
  };
  JR.passTo = function (pc, j, pi) {
    for (let i = j.pi; i <= pi && i < j.path.length; i++) JR.see(pc, j.path[i], 'seen');
    j.pi = Math.max(j.pi, pi); j.at = j.path[j.pi];
  };
  JR.guessKind = function (pc) {
    const f = pc.flags || {}, y = A.S.year;
    if (f.runaway === true && !pc.flags.unfree) return 'flight';
    if (f.emigrated === y) return 'emigrate';
    if (pc.school && pc.school.years === 0) return 'school';
    return 'settle';
  };

  // ---- a scene at a stop ------------------------------------------------------------------------------------------------
  // what can happen at this stop, from the land (engine: weights drawn with A.wpick)
  JR.SCENES = {
    jr_border: (pc, j, st, prev) => (prev && P_(prev) && P_(st.p) && P_(prev).owner !== P_(st.p).owner ? 4 : 0),
    jr_sea: (pc, j, st) => (j.sea.slice(Math.max(1, j.lastPi || 1), st.pi + 1).some(Boolean) ? 4 : 0),
    jr_route: (pc, j, st) => (JR.routeName(j.path[st.pi - 1], st.p) ? 2.5 : 0),
    jr_site: (pc, j, st) => (A.WILDS && A.WILDS.sites(P_(st.p)).some(s => !A.WILDS.found(pc, s.key)) ? 2 : 0),
    jr_custom: (pc, j, st) => { const R = A.BIBLE && A.BIBLE.of(P_(st.p).owner); return R && Array.isArray(R.customs) && R.customs.some(c => c && c.rule) ? (P_(st.p).owner === pc.realm ? 1 : 2.5) : 0; },
    jr_beast: (pc, j, st) => (JR.beastAt(pc, st.p) ? 1.5 : 0),
    jr_caravan: (pc, j, st) => (JR.caravanAt(st.p) ? 1.5 : 0),
    jr_news: (pc, j, st) => (JR.newsAt(pc, st.p) ? 1.5 : 0),
    jr_folk: (pc, j, st) => (JR.folkAt(pc, st.p) ? 2 : 0),
    jr_weather: (pc, j, st) => { const s = JR.season(month(A.absDay())), t = P_(st.p).terr; return s === 'winter' || s === 'spring' || (s === 'summer' && ['desert', 'steppe'].includes(t)) ? 1.5 : 0.6; },
    jr_pilgrims: (pc, j) => (j.k === 'pilgrim' && !j.seen.includes('jr_pilgrims') ? 3 : 0),
    jr_exile: (pc, j) => (['exile', 'flight', 'emigrate'].includes(j.k) && !j.seen.length ? 8 : 0),
  };
  JR.ROAD_EVENTS = ['road_bandits', 'road_inn', 'road_beast', 'road_stranger', 'road_storm'];
  JR.scene = function (pc, j, st) {
    const prev = j.lastStop != null ? j.lastStop : j.from, list = [];
    for (const id in JR.SCENES) {
      if (!A.EV[id] || j.seen.includes(id)) continue;
      let w = 0; try { w = JR.SCENES[id](pc, j, st, prev) || 0; } catch (e) { w = 0; }
      if (w > 0) list.push([id, w]);
    }
    const road = JR.ROAD_EVENTS.filter(id => A.EV[id] && !j.seen.includes(id));
    if (road.length) list.push(['road', 0.8]);
    j.prevStop = prev; j.lastStop = st.p; j.lastPi = st.pi;
    if (!list.length) return false;
    const pick = A.wpick(list, x => x[1]);
    let ev = pick[0];
    if (ev === 'road') ev = A.pick(road);
    j.seen.push(ev);
    const ctx = JR.ctxAt(pc, j, st.p, ev);
    if (!ctx) return false;
    A.queue({ type: 'event', ev, ctx, forced: true, lfFrom: 'journey' });
    return true;
  };

  // ---- what the land offers at a stop (pure reads) -----------------------------------------------------------------------
  const clip = (t, n) => { t = String(t || '').replace(/\s+/g, ' ').trim().replace(/[{}<>"]/g, ''); if (t.length <= n) return t; const c = t.slice(0, n); return c.slice(0, Math.max(c.lastIndexOf(', '), c.lastIndexOf('; '), c.lastIndexOf(' '))).replace(/[.;,]$/, ''); };
  const asPc = (pc, id) => { const o = Object.create(pc); o.home = id; return o; };
  JR.beastAt = function (pc, id) {
    if (!A.beastsNear || !P_(id)) return null;
    let ids = []; try { ids = (A.beastsNear(asPc(pc, id)) || []).filter(x => LORE.creatures.some(c => c.id === x)); } catch (e) { ids = []; }
    return ids.length ? ids : null;
  };
  JR.caravanAt = function (id) {
    const P = P_(id), car = A.S && A.S.eco && Array.isArray(A.S.eco.car) ? A.S.eco.car : [];
    if (!P) return null;
    const out = car.filter(c => c && (c.f === P.owner || c.t === P.owner) && c.f !== c.t && A.realm(c.f) && A.realm(c.t));
    return out.length ? out : null;
  };
  JR.newsAt = function (pc, id) {
    const WC = A.WC; if (!WC || !WC.count) return null;
    const n = WC.count(), out = [];
    for (let i = n - 1; i >= 0 && out.length < 12; i--) { const e = WC.ent(i); if (!e || A.S.year - e.y > 3) break; if (e.p != null && P_(e.p) && JR.newsLine(e)) out.push(e); }
    return out.length ? out : null;
  };
  const rs = id => { const r = id && A.realm(id); return r ? r.short : null; };
  JR.newsLine = function (e) {
    const P = e.p != null ? P_(e.p) : null, a = rs(e.a), b = rs(e.b), pn = P ? P.name : null;
    switch (e.k) {
      case 'war': return a && b ? `${a} has gone to war with ${b}, and the levies are out round ${pn}.` : null;
      case 'peace': return a && b ? `${a} and ${b} have made peace, and the soldiers are walking home past ${pn}.` : null;
      case 'battle': return pn && a && b ? `there was a battle at ${pn} between ${a} and ${b}, and the crows are still at it.` : null;
      case 'siege': return pn ? `${pn} is under siege, and bread there costs its weight in copper.` : null;
      case 'fall': case 'cede': return pn && a ? `${pn} belongs to ${a} now, whoever held it before.` : null;
      case 'ruler': return a ? `the ruler of ${a} is dead, and the new one is not yet trusted.` : null;
      case 'famine': return a ? `the harvest has failed in ${a}, and people are eating the seed corn.` : null;
      case 'plague': return pn ? `there is sickness in ${pn}, and the gates are shut to strangers.` : null;
      case 'revolt': return pn ? `the country round ${pn} has risen against its lord.` : null;
      case 'founded': return a ? `a new realm calls itself ${a}, and wants taxes like the old ones.` : null;
      case 'fallen': return pn ? `the realm that held ${pn} is finished, and its lords are looking for new masters.` : null;
      default: return null;
    }
  };
  JR.folkAt = function (pc, id) {
    const P = P_(id), r = P && A.realm(P.owner); if (!r || !A.BIBLE) return null;
    const cid = A.cultureFor(r.race === 'human' ? 'human' : r.race, r.id), C = LORE.cultures && LORE.cultures[cid];
    const words = (A.BIBLE.words(cid) || []).filter(w => Array.isArray(w) && w[0] && w[1] && !/[{}<>"]/.test(w[0] + w[1]));
    return C && words.length ? { cid, name: C.name, words } : null;
  };
  JR.regionOf = function (id) {
    const P = P_(id); if (!P) return 'the country';
    const D = A.FAR && A.FAR.active && A.FAR.D, at = D && D.atlas;
    if (P.region && at && at.regions && at.regions[P.region]) return the(at.regions[P.region]);
    return { plains: 'the open plains', steppe: 'the steppe', hills: 'the hill country', forest: 'the forest country', marsh: 'the fens', mountains: 'the mountains', desert: 'the waste', tundra: 'the cold country' }[P.terr] || 'the country';
  };

  // the scene's tokens. With no journey (a tool rendering the scene), the land of home stands in, so it reads whole.
  JR.ctxAt = function (pc, j, id, ev) {
    const P = P_(id); if (!P) return null;
    const r = A.realm(P.owner), T = j ? P_(j.to) : P, dr = T && A.realm(T.owner);
    const ctx = { jrStop: id, stop: P.name, stopRealm: r ? r.name : 'no man\'s land', stopShort: r ? r.short : 'these parts', region: JR.regionOf(id),
      dest: T ? T.name : P.name, destRealm: dr ? dr.name : 'its own country', lfFixed: 1 };
    const now = A.absDay();
    ctx.days = String(j ? Math.max(1, now - j.t0) : 12);
    ctx.kmOut = A.fmt(j ? Math.round(j.path.slice(0, (j.pi || 0) + 1).reduce((s, v, i, a) => s + (i ? km(a[i - 1], v) : 0), 0)) : 240);
    ctx.season = JR.season(month(now));
    ctx.fromName = j ? (P_(j.from) || P).name : P.name;
    ctx.purse = String(Math.max(0, Math.round(pc.coin || 0)));
    ctx.wage = String(JR.wage(j || { km: 600 }));
    if (ev === 'jr_border') {
      const prev = j && j.prevStop != null ? P_(j.prevStop) : null;
      ctx.toll = 2 + Math.round(Math.min(10, (pc.coin || 0) / 60));
      ctx.fromRealm = prev && A.realm(prev.owner) ? A.realm(prev.owner).short : 'the last realm';
    }
    if (ev === 'jr_route') ctx.routeName = (j && JR.routeName(j.path[(j.lastPi || 1) - 1], id)) || 'the great road';
    if (ev === 'jr_route' || ev === 'jr_sea') { ctx.farRealm = dr ? dr.short : (r ? r.short : 'the east'); }
    if (ev === 'jr_site') {
      const W = A.WILDS, s = W && W.sites(P).find(x => !W.found(pc, x.key));
      if (!s) { ctx.place = 'an old ruin'; ctx.skip = !W; }
      else { ctx.place = s.place; ctx.jrSite = s.key; }
    }
    if (ev === 'jr_custom') {
      const R = A.BIBLE && A.BIBLE.of(P.owner), cs = R && Array.isArray(R.customs) ? R.customs.filter(c => c && c.rule && !/[{}]/.test(c.rule)) : [];
      const c = cs.length ? A.pick(cs) : null;
      if (!c) { ctx.custom = 'Nobody here eats before the eldest has eaten.'; ctx.customName = 'the eldest first'; }
      else { ctx.custom = clip(c.rule, 170).replace(/([^.!?])$/, '$1.'); ctx.customName = clip(c.name, 40); ctx.cid = c.id; }
    }
    if (ev === 'jr_beast') {
      const ids = JR.beastAt(pc, id) || [], cid = ids.length ? A.pick(ids) : null, c = cid && LORE.creatures.find(x => x.id === cid);
      const c2 = c || LORE.creatures.find(x => /wolf/i.test(x.name)) || LORE.creatures[0];
      ctx.beast = c2.id; ctx.beastName = c2.name.replace(/^The /, ''); ctx.belief = clip(c2.belief || 'that it is bad luck to see it', 120).replace(/([^.!?])$/, '$1.');
    }
    if (ev === 'jr_caravan') {
      const cs = JR.caravanAt(id) || [], c = cs.length ? A.pick(cs) : null;
      const G = (A.ECON && A.ECON.G && A.ECON.G()) || {};
      ctx.good = c && G[c.k] ? String(G[c.k].name).toLowerCase() : 'salt and cloth';
      ctx.carFrom = c ? A.realm(c.f).short : (r ? r.short : 'the west');
      ctx.carTo = c ? A.realm(c.t).short : (dr ? dr.short : 'the east');
      if (ctx.carFrom === ctx.carTo) ctx.carTo = 'the next market';
      ctx.carDest = c && c.tT != null && P_(c.tT) ? c.tT : (c && A.realm(c.t) ? A.realm(c.t).capitalProv : null);
    }
    if (ev === 'jr_news') {
      const es = JR.newsAt(pc, id) || [], e = es.length ? A.pick(es) : null;
      ctx.news = e ? JR.newsLine(e) : 'the price of salt has doubled, and nobody will say why.';
      ctx.newsPlace = e && P_(e.p) ? P_(e.p).name : P.name; ctx.newsAt = e ? e.p : id;
    }
    if (ev === 'jr_folk') {
      const f = JR.folkAt(pc, id), w = f ? A.pick(f.words) : ['bread', 'bread'];
      ctx.folk = f ? f.name : 'country'; ctx.word = clip(w[0], 30); ctx.meaning = clip(w[1], 60);
      ctx.same = f && f.cid === A.cultureFor(pc.race === 'human' ? 'human' : pc.race, pc.realm) ? 1 : 0;
    }
    if (ev === 'jr_weather') ctx.wk = ctx.season === 'summer' && !['desert', 'steppe'].includes(P.terr) ? 'autumn' : ctx.season;
    return ctx;
  };
  // fill a scene's tokens when it was queued without a journey (a tool, an old queue): the land at home stands in
  JR.fill = function (pc, ctx, ev) {
    if (!ctx || ctx.jrStop != null || !pc) return;
    const j = JR.on(pc) ? pc.journey : null, id = j ? j.at : pc.home;
    const c = JR.ctxAt(pc, j, id, ev); if (!c) { ctx.skip = true; return; }
    for (const k in c) if (ctx[k] == null) ctx[k] = c[k];
    delete ctx.jrSite;   // a stand-in place records nothing
  };

  // ---- arriving ----------------------------------------------------------------------------------------------------------
  // the release's move, run at the end of the road: the fare was paid when you set out, and the road had its scenes
  JR.settleAt = function (pc, id, o) {
    const travel = JR.travel0; if (!travel) return false;
    const opt = A.travelOptions(pc).find(o => o.id === id); if (!opt) return false;
    if (A.isAdult(pc)) pc.coin += opt.cost;
    JR.arriving = true;
    let r; try { r = travel.call(A, id); } finally { JR.arriving = false; }
    if (!(r && r.ok) && A.isAdult(pc)) pc.coin = Math.max(0, pc.coin - opt.cost);
    pc.jrAt = pc.home;
    // the release counts the crow's distance; the road was longer
    try {
      const L = A.S.log[A.S.log.length - 1], lines = L && L.lines, rk = o && o.km;
      if (r && r.ok && lines && rk) for (let i = lines.length - 1; i >= Math.max(0, lines.length - 4); i--) {
        const l = lines[i], t = Array.isArray(l) ? l[0] : l;
        if (typeof t === 'string' && /^You travel [\d,]+ km to /.test(t)) { const nt = t.replace(/^You travel [\d,]+ km to /, `You travel ${A.fmt(rk)} km by the road to `); if (Array.isArray(l)) l[0] = nt; else lines[i] = nt; break; }
      }
    } catch (e) {}
    return !!(r && r.ok);
  };
  JR.end = function (pc) {
    const j = pc.journey; if (!j) return;
    JR.passTo(pc, j, j.path.length - 1);
    pc.jrLog = Array.isArray(pc.jrLog) ? pc.jrLog : [];
    pc.jrLog.push({ k: j.k, f: j.from, t: j.to, y: j.y, d: Math.max(1, A.absDay() - j.t0), km: j.km });
    if (pc.jrLog.length > 30) pc.jrLog.splice(0, pc.jrLog.length - 30);
    pc.journey = null;
  };
  JR.arrive = function (pc) {
    const j = pc.journey; if (!j) return;
    const T = P_(j.to), days = Math.max(1, A.absDay() - j.t0);
    JR.passTo(pc, j, j.path.length - 1);
    const ctx = Object.assign(JR.ctxAt(pc, j, j.to, 'arrive') || {}, { days: String(days) });
    if (j.applied || ['exile', 'flight', 'emigrate', 'school', 'settle'].includes(j.k)) {
      A.log(`After ${days} days on the road you come to ${T.name}.`, '');
      JR.end(pc); return;
    }
    if (j.k === 'return') {
      A.log(`You come home to ${T.name} after ${days} days on the road. The door sticks where it always stuck.`, 'good');
      JR.end(pc); return;
    }
    if (j.k === 'move') {
      JR.end(pc);
      if (!JR.settleAt(pc, j.to, { km: j.km })) { A.log(`You reach ${T.name}, but cannot stay.`, 'warn'); return; }
      if (A.EV.jr_arrive) A.queue({ type: 'event', ev: 'jr_arrive', ctx, forced: true, lfFrom: 'journey' });
      return;
    }
    // a visit, a caravan, a pilgrimage: you are there; the scene asks what next (and the road home starts after a while)
    j.wait = A.absDay() + 12; j.there = 1;
    // a pilgrim's shrine: the first one of a life, another one later, or one already knelt at (pc.jrShrines: place -> year)
    let shrine = 'jr_shrine';
    if (j.k === 'pilgrim') {
      const seen = pc.jrShrines && typeof pc.jrShrines === 'object' ? pc.jrShrines : (pc.jrShrines = {});
      shrine = seen[j.to] != null ? 'jr_shrine_again' : Object.keys(seen).length ? 'jr_shrine_other' : 'jr_shrine';
      if (!A.EV[shrine]) shrine = 'jr_shrine';
      seen[j.to] = A.S.year;
    }
    const ev = { visit: 'jr_arrive_visit', caravan: 'jr_caravan_end', pilgrim: shrine }[j.k];
    if (j.k === 'caravan') ctx.wage = String(JR.wage(j));
    if (ev && A.EV[ev]) A.queue({ type: 'event', ev, ctx, forced: true, lfFrom: 'journey' });
  };
  JR.wage = j => Math.round(4 + (j.km || 0) / 120);
  // set out for home from wherever the road has got to
  JR.homeward = function (pc, o) {
    const j = pc.journey; if (!j) return;
    const at = j.there ? j.to : j.at, home = j.home != null ? j.home : pc.home, k = j.k;
    if (j.there && k === 'caravan' && !j.paid) { pc.coin += JR.wage(j); j.paid = 1; }
    JR.end(pc);
    if (at === home || !P_(home)) return;
    const r = JR.start(pc, home, 'return', { from: at, home });
    if (r && o && o.slow) r.t0 += o.slow;
    return r;
  };
  JR.turnBack = function (pc) {
    const j = pc && pc.journey; if (!JR.on(pc) || j.applied || j.k === 'return' || j.there) return false;
    A.log(`At ${A.provName(j.at)} you turn round. ${P_(j.to).name} will have to wait.`, '');
    j.there = 0; JR.homeward(pc);
    return true;
  };

  // ---- the scenes' effects: fx.jr = { slow, fast, pay, heard, site, beast, home, settle, wage } ---------------------------
  const applyFx = A.applyFx;
  A.applyFx = function (pc, fx, ctx) {
    const r = applyFx.apply(this, arguments);
    try { if (fx && typeof fx === 'object' && fx.jr && pc) JR.fx(pc, fx.jr, ctx || {}); } catch (e) { console.error('journey fx', e); }
    return r;
  };
  JR.fx = function (pc, o, ctx) {
    const j = JR.on(pc) ? pc.journey : null;
    if (o.slow && j) j.t0 += o.slow;
    if (o.fast && j) j.t0 -= Math.min(o.fast, Math.max(0, A.absDay() - j.t0));
    if (o.pay) { const n = o.pay === 'toll' ? +ctx.toll || 2 : o.pay === 'toll2' ? 2 * (+ctx.toll || 2) : +o.pay || 0; pc.coin = Math.max(0, (pc.coin || 0) - n); }
    if (o.heard) JR.tell(pc, o.heard, ctx, j);
    if (o.beast && ctx.beast && A.BT && A.BT.learn) A.BT.learn(pc, ctx.beast, o.beast, 'On the road, people tell of');
    if (o.site && ctx.jrSite && A.WILDS) {
      const W = A.WILDS, P = P_(ctx.jrStop), s = P && W.sites(P).find(x => x.key === ctx.jrSite);
      if (s && A.EV[W.KINDS[s.kind] ? W.KINDS[s.kind].ev : 'wl_lair']) {
        const c = W.ctxOf(pc, Object.assign({}, s, { away: true }));
        c.where = `an hour off the road at ${P.name}`; if (s.near && s.near.region) c.where += `, in ${the(s.near.region)}`;
        A.queue({ type: 'event', ev: W.KINDS[s.kind] ? W.KINDS[s.kind].ev : 'wl_lair', ctx: c, forced: true, lfFrom: 'journey' });
      }
    }
    if (o.home && j) JR.homeward(pc, { slow: o.slow });
    if (o.settle && j) { const to = j.there ? j.to : j.at; if (j.k === 'caravan' && !j.paid) { pc.coin += JR.wage(j); j.paid = 1; } JR.end(pc); JR.settleAt(pc, to); }
    if (o.wage && j && !j.paid) { pc.coin += JR.wage(j); j.paid = 1; }
  };
  // what you are told on the road goes into the atlas as heard of
  JR.tell = function (pc, what, ctx, j) {
    const at = ctx.jrStop != null ? ctx.jrStop : (j ? j.at : pc.home), P = P_(at); if (!P) return;
    const hear = id => JR.see(pc, id, 'heard');
    if (what === 'around') { for (const id of P.adj || []) hear(id); for (const id of P.sea || []) hear(id); }
    else if (what === 'news' && ctx.newsAt != null) hear(ctx.newsAt);
    else if (what === 'caravan' && ctx.carDest != null) hear(ctx.carDest);
    else if (what === 'realm') { for (const Q of A.S.prov) if (Q.owner === P.owner) hear(Q.id); }
    else if (what === 'coast') { for (const Q of A.S.prov) if (Q.coast && km(Q.id, at) < 600) hear(Q.id); }
    else if (what === 'route' && j) { for (let i = j.pi; i < j.path.length && i < j.pi + 12; i++) hear(j.path[i]); }
    else if (what === 'dest' && j) hear(j.to);
  };

  // ---- the release's ways of moving, routed through the road -------------------------------------------------------------
  JR.travel0 = A.travelTo;
  A.travelTo = function (pid, how) {
    const pc = A.pc();
    if (JR.OFF || JR.arriving || !pc) return JR.travel0.apply(this, arguments);
    if (JR.on(pc)) return { ok: false, msg: 'You are already on the road.' };
    if (pc.flags.unfree) return { ok: false, msg: 'You are not free to leave.' };
    const opt = A.travelOptions(pc).find(o => o.id === pid); if (!opt) return { ok: false, msg: 'Unknown place.' };
    const kind = how === 'visit' ? 'visit' : 'move', cost = kind === 'visit' ? Math.round(opt.cost * 1.6) : opt.cost;
    if (A.isAdult(pc) && pc.coin < cost) return { ok: false, msg: `The road there and back costs about ${cost} suns.` };
    if (opt.d < JR.SHORT_KM && kind === 'move') return JR.travel0.apply(this, arguments);   // a day or two: no road to tell
    const j = JR.start(pc, pid, kind); if (!j) return JR.travel0.apply(this, arguments);
    if (A.isAdult(pc)) pc.coin -= cost;
    return { ok: true, msg: `You set out for ${opt.name}. About ${j.days} days, if the weather holds.` };
  };
  JR.caravan = function (pc, i) {
    const cs = JR.caravansHome(pc), c = cs[i]; if (!c || JR.on(pc) || pc.flags.unfree) return { ok: false, msg: 'That caravan has gone.' };
    const j = JR.start(pc, c.to, 'caravan', { extra: { good: c.good } });
    return j ? { ok: true, msg: `You sign on with the ${c.good} caravan to ${P_(c.to).name}.` } : { ok: false, msg: 'There is no road there.' };
  };
  // this month's caravans out of your realm (45's S.eco.car, with 66's towns), that a traveller could walk with
  JR.caravansHome = function (pc) {
    const car = A.S && A.S.eco && Array.isArray(A.S.eco.car) ? A.S.eco.car : [], G = (A.ECON && A.ECON.G && A.ECON.G()) || {}, out = [], seen = new Set();
    for (const c of car) {
      if (!c || c.f !== pc.realm || !A.realm(c.t)) continue;
      const to = c.tT != null && P_(c.tT) ? c.tT : A.realm(c.t).capitalProv;
      if (to == null || to === pc.home || seen.has(to + ':' + c.k) || km(pc.home, to) < JR.SHORT_KM) continue;
      seen.add(to + ':' + c.k);
      out.push({ to, good: G[c.k] ? String(G[c.k].name).toLowerCase() : c.k, realm: c.t });
      if (out.length >= 6) break;
    }
    return out;
  };
  // the pilgrimage: the release's piety and fare, then the road to a shrine of your faith and back
  JR.shrineFor = function (pc) {
    const here = P_(pc.home); if (!here) return null;
    let best = null, bd = Infinity;
    for (const r of Object.values(A.S.realms)) {
      if (!r.alive || r.faith !== pc.faith || r.capitalProv == null || !P_(r.capitalProv)) continue;
      const d = km(pc.home, r.capitalProv); if (d < 150) continue;
      if (d < bd) { bd = d; best = r.capitalProv; }
    }
    if (best == null) { const r = A.realm(pc.realm); if (r && r.capitalProv != null && r.capitalProv !== pc.home) best = r.capitalProv; }
    return best;
  };
  const pil = A.ACT && A.ACT.pilgrimage;
  if (typeof pil === 'function') {
    A.ACT.pilgrimage = function (pc) {
      const r = pil.apply(this, arguments);
      try {
        if (!JR.OFF && pc && (!r || r.ok !== false) && !JR.on(pc)) {
          const to = JR.shrineFor(pc);
          if (to != null && km(pc.home, to) >= JR.SHORT_KM) { const j = JR.start(pc, to, 'pilgrim'); if (j && r && r.msg) r.msg += ` The road to ${P_(to).name} is about ${j.days} days.`; }
        }
      } catch (e) { console.error('pilgrim road', e); }
      return r;
    };
    for (const k in pil) A.ACT.pilgrimage[k] = pil[k];
  }
  // exile: the release casts you out at once; the road out is told after
  if (typeof A.exile === 'function') {
    const ex = A.exile;
    A.exile = function (pc) { const h = pc && pc.home; JR.nextKind = 'exile'; const r = ex.apply(this, arguments); if (!pc || pc.home === h) JR.nextKind = null; return r; };
  }
  // a new person (an heir, a new game) starts where they live, with no road behind them
  if (typeof A.continueAs === 'function') {
    const ca = A.continueAs;
    A.continueAs = function () { const r = ca.apply(this, arguments); try { const p = A.pc(); if (r && p) { p.jrAt = p.home; if (p.journey && !JR.on(p)) p.journey = null; } } catch (e) {} return r; };
  }

  A.onDay = A.onDay || [];
  A.onDay.push(pc => JR.tick(pc));

  // ---- UI: the road modal and the actions ----------------------------------------------------------------------------------
  // the two journey actions that are not already commands, so the journal (01-replay) records them
  A.jrCaravan = function (i) { return JR.caravan(A.pc(), +i); };
  A.jrTurnBack = function () { return { ok: JR.turnBack(A.pc()) }; };
  if (Array.isArray(A.COMMANDS)) A.COMMANDS.push('jrCaravan', 'jrTurnBack');
  Object.assign(UI.A, {
    jrMode(v) { UI.jrMode = v === 'visit' ? 'visit' : 'move'; UI.renderModal(); },
    jrGo(v) { const r = A.travelTo(+v, UI.jrMode === 'visit' ? 'visit' : 'move'); r.msg && UI.toast(r.msg); r.ok && (A.simpleClose(), MAP.overlayCache = null); UI.refresh(); },
    jrCaravan(v) { const r = A.jrCaravan(+v); r.msg && UI.toast(r.msg); r.ok && A.simpleClose(); UI.refresh(); },
    jrTurn() { if (A.jrTurnBack().ok) UI.toast('You turn for home.'); A.simpleClose(); UI.refresh(); },
  });
  if (typeof document !== 'undefined') {
    const st = document.createElement('style'); st.id = 'jr-style';
    st.textContent = '.jr-mode{display:inline-flex;margin:2px 0 6px}.jr-mode button[aria-pressed="true"]{color:#1a140c}';
    (document.head || document.documentElement).appendChild(st);
  }
  JR.statusLine = function (pc) {
    const j = pc && pc.journey; if (!JR.on(pc)) return '';
    const T = P_(j.to), at = P_(j.at), now = A.S ? A.absDay() : 0, gone = Math.max(0, now - j.t0), left = Math.max(0, j.days - gone);
    if (j.there) return `In ${T.name}, ${gone} days from home.`;
    return `${A.cap(JR.KINDS[j.k] || 'the road')} to ${T.name}: day ${gone} of about ${j.days}${at && at.id !== j.from ? `, last stop ${at.name}` : ''}${left ? '' : ', nearly there'}.`;
  };
  // 996's "Coming up": the next stop and the end of the road (a view: reads only)
  const CU = UI.COMING;
  if (CU && typeof CU.items === 'function') {
    const items = CU.items;
    CU.items = function (pc) {
      const out = items.apply(this, arguments);
      try {
        const j = JR.on(pc) ? pc.journey : null;
        if (j && !j.there && !JR.OFF) {
          const st = j.stops[j.i], T = P_(j.to), when = at => (CU.when ? CU.when(at) : '');
          if (st && P_(st.p)) out.push({ at: j.t0 + st.d, kind: 'road', text: `The next stop on the road: ${P_(st.p).name}`, icon: 'route', when: when(j.t0 + st.d) });
          if (T) out.push({ at: j.t0 + j.days, kind: 'road', text: `${T.name}, at the end of the road`, icon: 'map', when: when(j.t0 + j.days) });
          out.sort((a, b) => a.at - b.at);
          return out.slice(0, CU.MAX || 5);
        }
      } catch (e) {}
      return out;
    };
  }
  const travelModal = UI.travelModal;
  UI.travelModal = function () {
    const pc = A.pc();
    if (JR.OFF || !pc) return travelModal.apply(this, arguments);
    try {
      const esc = UI.esc;
      if (JR.on(pc)) {
        const j = pc.journey, can = !j.applied && j.k !== 'return' && !j.there;
        return `<div class="panel mbox"><h2>On the road</h2><p class="mtext">${esc(JR.statusLine(pc))}</p>` +
          `<div class="choices">${can ? '<button data-a="jrTurn">Turn back for home</button>' : ''}<button class="primary" data-a="qClose">Go on</button></div></div>`;
      }
      const reach = JR.reach(pc.home), opts = A.travelOptions(pc), near = opts.slice(0, 18), visit = UI.jrMode === 'visit';
      const s = JR.season(month(A.absDay()));
      const days = o => { const d = reach && reach.days(o.id); return d == null ? '' : ` · ${d} days`; };
      const cost = o => (visit ? Math.round(o.cost * 1.6) : o.cost);
      const btn = (o, tag) => `<button class="small" data-a="jrGo" data-v="${o.id}">${esc(o.name)} <span class="muted">${esc(tag)} · ${A.fmt(o.d)} km${days(o)} · ${cost(o)} suns</span></button>`;
      let h = `<div class="panel mbox wide jr-road"><h2>The road</h2><p class="small muted">From ${esc(A.provName(pc.home))}. A day on foot is about ${JR.SPEED} km, more on a great road, less in the hills; a ship makes ${JR.SEA} km a day. ${s === 'winter' ? 'It is winter: the passes are slow and the sea is rough.' : s === 'spring' ? 'It is spring: the fords are high.' : ''} Moving realms means new laws, a new tongue and starting over.</p>`;
      h += `<div class="seg jr-mode" role="group" aria-label="How you go"><button class="small${visit ? '' : ' primary'}" data-a="jrMode" data-v="move" aria-pressed="${!visit}">Move there</button><button class="small${visit ? ' primary' : ''}" data-a="jrMode" data-v="visit" aria-pressed="${visit}">Go and come back</button></div>`;
      h += `<div class="group-h">Nearby</div><div class="gridauto">${near.map(o => btn(o, A.realmShort(o.realm))).join('')}</div>`;
      const cars = JR.caravansHome(pc);
      if (cars.length) h += `<div class="group-h">Caravans leaving this month</div><p class="small muted">Walk with one as a guard: no fare, a wage at the far end, a beast's pace.</p><div class="gridauto">${cars.map((c, i) => `<button class="small" data-a="jrCaravan" data-v="${i}">${esc(A.cap(c.good))} to ${esc(P_(c.to).name)} <span class="muted">${esc(A.realmShort(c.realm))} · ${A.fmt(Math.round(km(pc.home, c.to)))} km${reach && reach.days(c.to) ? ' · ' + reach.days(c.to) + ' days' : ''}</span></button>`).join('')}</div>`;
      h += `<div class="group-h">Capitals and far realms</div><div class="gridauto">${Object.values(A.S.realms).filter(r => r.alive && r.capitalProv != null).map(r => { const o = opts.find(x => x.id === r.capitalProv); return o ? btn(o, r.short) : ''; }).join('')}</div>`;
      return h + '<button style="margin-top:10px" data-a="qClose">Stay where you are</button></div>';
    } catch (e) { console.error('road modal', e); return travelModal.apply(this, arguments); }
  };
})();
