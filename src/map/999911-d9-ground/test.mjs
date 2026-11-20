// 999911-d9-ground (D9, CRITIQUE §17): the map's ground, read by the game and drawn. One test per done-when line.

// the facts of one world's ground, measured in the page (A.newGame with the seed first)
const GROUND = () => {
  const VM = A.V2MAP, D9 = A.D9, c = D9.ctx(), G = c.G, w = c.w, gw = w.gw, gh = w.gh, N = gw * gh;
  const ranks = [0, 0, 0]; for (const e of G.edges) ranks[e.rank]++;
  const onRoad = new Set(); for (const e of G.edges) if (e.rank) { onRoad.add(e.a); onRoad.add(e.b); }
  // every run of a road over running water, inside its course, has a ford or a bridge
  let waters = 0, missing = 0;
  for (const e of G.edges) {
    if (!e.rank) continue;
    const p = e.path; let n = 0;
    for (let i = 1; i < p.length - 1; i++) if (w.riv[p[i]] >= VM.STREAM_T && w.riv[p[i - 1]] < VM.STREAM_T) { let j = i; while (j + 1 < p.length && w.riv[p[j + 1]] >= VM.STREAM_T) j++; if (j < p.length - 1) n++; }
    waters += n; if (e.cross.length !== n || e.cross.some(ci => !['ford', 'bridge'].includes(G.crossings[ci].kind))) missing++;
  }
  const kinds = G.crossings.reduce((o, x) => (o[x.kind] = (o[x.kind] || 0) + 1, o), {});
  // rivers with tributaries: paths that end where another path runs (a junction inland)
  const at = new Map(); w.rivers.forEach((a, r) => { for (let i = 0; i < a.length; i += 3) at.set(Math.floor(a[i + 1] / 10) * gw + Math.floor(a[i] / 10), r); });
  let tribs = 0; w.rivers.forEach((a, r) => { const x = Math.floor(a[a.length - 3] / 10), y = Math.floor(a[a.length - 2] / 10); if (w.grid[y * gw + x] < 0) return;
    let j = false; for (let dy = -2; dy <= 2 && !j; dy++) for (let dx = -2; dx <= 2; dx++) { const k = (y + dy) * gw + x + dx; if (at.has(k) && at.get(k) !== r) { j = true; break; } } if (j) tribs++; });
  let wood = 0, marsh = 0, land = 0; for (let k = 0; k < N; k++) if (w.grid[k] >= 0) { land++; if (G.cover[k] === 1) wood++; else if (G.cover[k] === 2) marsh++; }
  const names = D9.names(), all = [...names.seas, ...new Set(names.ranges), ...names.rivers, ...new Set(names.forests), ...names.passes];
  // towns on water: the site on a river or a stream, or beside the sea or a lake; an oasis is its own spring
  let wet = 0, towns = 0;
  for (const P of A.S.prov) {
    if (P.type === 'unclaimed land') continue;
    const k = Math.floor(P.sy / 10) * gw + Math.floor(P.sx / 10), x = k % gw;
    let ok = w.riv[k] >= VM.STREAM_T || P.type === 'oasis';
    for (const j of [x > 0 ? k - 1 : -1, x < gw - 1 ? k + 1 : -1, k - gw, k + gw]) if (j >= 0 && j < N && w.grid[j] < 0) ok = true;
    towns++; if (ok) wet++;
  }
  return { seed: A.S.v2map.seed, ranks, onRoad: onRoad.size, n: A.S.prov.length, waters, missing, kinds, passes: G.passes.length, tribs, rivers: w.rivers.length,
    wood: Math.round(100 * wood / land), marsh: Math.round(1000 * marsh / land) / 10, names: { seas: names.seas.length, ranges: new Set(names.ranges).size, rivers: names.rivers.length, forests: new Set(names.forests).size, passes: names.passes.length },
    // a generated map names every feature apart; the designed one (map version 4) gives a range, a sea or a pass its one
    // name along every stretch the ground engine finds, so only the pools' names must be apart there
    distinct: w.designed ? (() => { const F = w.features || {}, own = new Set([...(F.ranges || []), ...(F.passes || []), ...(F.regions || [])].map(x => x.name).concat((w.waters || []).map(x => x.name), (w.riverNames || []).filter(Boolean))); const pool = all.filter(x => !own.has(x)); return new Set(pool).size === pool.length; })() : new Set(all).size === all.length, sample: [names.seas[0], names.ranges[0], names.rivers[0], names.forests[0], names.passes[0]], wet: Math.round(1000 * wet / towns) / 10 };
};

export default {
  // done-when 1: roads in two ranks, a ford or bridge at every crossing, named passes, rivers with tributaries, woods and
  // marsh, names for seas, ranges, rivers and forests; 70% of towns on water
  async d9Ground(pg) {
    // M1: the one continent and two other map seeds (A.V2MAP.ONE switched for the life): the rule, not one world
    const r = await pg.evaluate(`(() => { const out = [], VM = A.V2MAP, one = VM.ONE; try { for (const seed of [620, 4242, 90001]) { VM.ONE = seed === 620 ? one : VM.seedOf(seed); A.newGame({ seed, realm: 'POL-01', status: 'peasant' }); out.push((${GROUND})()); } } finally { VM.ONE = one; } return out; })()`);
    const bad = r.filter(f => !(f.ranks[1] > 0 && f.ranks[2] > 0 && f.onRoad >= f.n * 0.97 && f.waters > 0 && f.missing === 0 && f.kinds.ford > 0 && f.kinds.bridge > 0 && f.passes > 0 && f.tribs >= 20 &&
      f.wood > 5 && f.marsh > 0 && f.names.seas >= 4 && f.names.ranges >= 1 && f.names.rivers >= 8 && f.names.forests >= 1 && f.names.passes > 0 && f.distinct));
    const wet = r.reduce((a, f) => a + f.wet, 0) / r.length;
    return { ok: !bad.length && wet >= 70, detail: r.map(f => `${f.seed}: roads high ${f.ranks[1]}, tracks ${f.ranks[2]}, none ${f.ranks[0]}; ${f.onRoad}/${f.n} places on a road; ${f.waters} waters crossed, ${f.missing} roads short of a crossing (${JSON.stringify(f.kinds)}); ${f.passes} passes; ${f.tribs} tributaries of ${f.rivers} river paths; wood ${f.wood}%, marsh ${f.marsh}%; names ${JSON.stringify(f.names)}, all distinct ${f.distinct} (${f.sample.join('; ')}); towns on water ${f.wet}%`).join(' | ') + ` | mean towns on water ${wet.toFixed(1)}%` };
  },

  // done-when 4: in 10 seeds no oasis lies off dry land, and no terrain word covers more than a third of the provinces
  async d9Terrain(pg) {
    const r = await pg.evaluate(() => {
      const VM = A.V2MAP, out = [];
      for (let s = 1; s <= 10; s++) {
        const w = VM.world(VM.seedOf('d9-' + s)), rel = VM.release().provinces, c = {};
        for (const q of w.prov) c[q.terr] = (c[q.terr] || 0) + 1;
        const oases = rel.filter(p => p.type === 'oasis').map(p => w.prov[p.id]);
        const off = oases.filter(q => !q.retype && !/^(Desert|Steppe|Savanna|Salt flat)$/.test(q.biome)).length;
        out.push({ s, top: Math.max(...Object.values(c)) / w.prov.length, word: Object.keys(c).sort((a, b) => c[b] - c[a])[0], off, kept: oases.filter(q => !q.retype).length, retyped: oases.filter(q => q.retype).length, hills: (c.hills || 0) / w.prov.length });
      }
      // and in play: the state's provinces carry the words and the retyped oases
      A.newGame({ seed: 4242, realm: 'POL-19', status: 'peasant' });
      const st = A.S.prov.filter(p => p.type === 'oasis' && !/^(Desert|Steppe|Savanna|Salt flat)$/.test(p.biome)).length;
      return { out, st, renamed: A.S.prov.filter(p => p.oname).map(p => p.oname + ' → ' + p.name).slice(0, 4) };
    });
    const bad = r.out.filter(x => x.off > 0 || x.top > 1 / 3);
    return { ok: !bad.length && r.st === 0, detail: r.out.map(x => `${x.s}: largest word ${x.word} ${(100 * x.top).toFixed(1)}%, hills ${(100 * x.hills).toFixed(1)}%, oases off dry ${x.off} (${x.kept} kept, ${x.retyped} now towns)`).join('; ') + ` | in play: ${r.st} oases off dry; renamed ${r.renamed.join(', ')}` };
  },

  // done-when 3: the same data drives play. Roads at least 30% faster (a journey's day and an army's march, each road
  // compared with the same way without one); a long journey is shorter on the roads; supply follows roads and rivers
  async d9Play(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 620, realm: 'POL-01', status: 'peasant' });
      const D9 = A.D9, G = D9.ground(), JR = A.JR, out = { travel: [[], [], []], march: [[], [], []] };
      for (const e of G.edges) {
        const d = JR.stepDays(e.a, e.b, false, 8), r0 = e.rank; e.rank = 0; const d0 = JR.stepDays(e.a, e.b, false, 8), m0 = D9.marchF(e.a, e.b); e.rank = r0;
        out.travel[r0].push(d0 / d); out.march[r0].push(D9.marchF(e.a, e.b) / m0);
      }
      const st = a => a.length ? { n: a.length, min: Math.min(...a), mean: a.reduce((x, y) => x + y, 0) / a.length } : null;
      const res = { travel: out.travel.map(st), march: out.march.map(st) };
      // a long journey across the map, with the ground and without it
      const P = A.S.prov, a = P.reduce((m, p) => (p.sx < P[m].sx ? p.id : m), 0), b = P.reduce((m, p) => (p.sx > P[m].sx ? p.id : m), 0);
      const flush = () => { if (JR.tree) { try { JR.tree(b); } catch (e) {} } };
      const R1 = JR.route(a, b, 0); D9.OFF = true; flush(); const R0 = JR.route(a, b, 0); D9.OFF = false; flush();
      res.journey = { from: P[a].name, to: P[b].name, days: R1.days, off: R0.days, roadSteps: R1.path.slice(1).filter((v, i) => D9.rank(R1.path[i], v)).length, steps: R1.path.length - 1 };
      // supply: the share of each supply line's steps on a road or a river, with the ground and without it
      const rid = 'POL-01', share = () => {
        A._nbs = null; A._sup = {}; A._supIn = {}; A.supplyMap(rid);
        const c = A._sup[rid]; let on = 0, n = 0, all = 0, allOn = 0;
        for (let i = 0; i < P.length; i++) { const p = c.par[i]; if (p < 0) continue; n++; if (D9.rank(p, i) === 1 || D9.riverLink(p, i)) on++; }
        for (const e of G.edges) { all++; if (e.rank === 1 || D9.riverLink(e.a, e.b)) allOn++; }
        return { on, n, base: allOn / all, v: Array.from(c.v).reduce((x, y) => x + y, 0) };
      };
      const s1 = share(); D9.OFF = true; const s0 = share(); D9.OFF = false; A._nbs = null; A._sup = {}; A._supIn = {};
      res.supply = { with: s1, without: s0 };
      return res;
    });
    const t = r.travel, m = r.march, s = r.supply;
    const fast = [1, 2].every(k => t[k] && t[k].min >= 1.3 && m[k] && m[k].min >= 1.3);
    const sup = s.with.on / s.with.n > s.without.on / s.without.n;
    const ok = fast && r.journey.days < r.journey.off && sup;
    const f = x => x ? `${x.n} ways, at least ${x.min.toFixed(2)}x, mean ${x.mean.toFixed(2)}x` : '-';
    return { ok, detail: `travel: high road ${f(t[1])}, track ${f(t[2])}; march: high road ${f(m[1])}, track ${f(m[2])} | journey ${r.journey.from} to ${r.journey.to}: ${r.journey.days} days on the roads (${r.journey.roadSteps}/${r.journey.steps} steps on a high road), ${r.journey.off} days without the ground | supply lines on high roads or rivers: ${s.with.on}/${s.with.n} with the ground, ${s.without.on}/${s.without.n} without (all ways ${(100 * s.with.base).toFixed(0)}%)` };
  },

  // done-when 3, the fight: an attack over a river or through a pass strikes for less, and the battle's report names it
  async d9AttackAcross(pg) {
    const r = await pg.evaluate(() => {
      const D9 = A.D9, seen = [], ended = [];
      const fd = A.fightDay;
      A.fightDay = function (pid) {
        const F = A.S.fights && A.S.fights[pid];
        const r = fd.apply(this, arguments);
        if (F && F.mods && F.mods.cross && F.mods.cross < 1) seen.push({ war: F.war, place: (A.S.prov[pid] || {}).name, f: F.mods.cross, n: F.mods.crossN });
        return r;
      };
      // the factor itself: every road between two provinces across a river or over a pass
      A.newGame({ seed: 4242, realm: 'POL-05', status: 'noble', startAge: 30 });
      const G = D9.ground(); let rivers = 0, passes = 0, sample = null;
      for (const e of G.edges) { const x = D9.attack(e.a, e.b); if (!x) continue; if (/ford|bridge|none/.test(x.kind)) rivers++; if (/pass/.test(x.kind)) passes++; if (!sample) sample = x; }
      // the report: each fight's after-action reckoning as it ends (23-after-action's A.aarFight, which also goes on the war's
      // battle record where the war keeps one), from the attacker's side
      let years = 0; const named = [];
      const fe = A.fightEnd;
      A.fightEnd = function (pid) {
        const F = A.S.fights && A.S.fights[pid];
        let rep = null; try { rep = F && F.aarT && F.aarT.cross ? A.aarFight(F, true, true) : null; } catch (e) {}
        const r = fe.apply(this, arguments);
        if (rep) { const t = rep.causes.map(c => c.label).join('; '); if (/\b(ford|bridge|pass|river)\b/i.test(t)) named.push(t); }
        return r;
      };
      for (; years < 40; years++) { T.play(1); if (named.length && seen.length >= 3) break; if (!A.pc() || !A.pc().alive) break; }
      A.fightDay = fd; A.fightEnd = fe;
      return { rivers, passes, sample, seen: seen.slice(0, 5), nSeen: seen.length, years, named: named.slice(0, 3), nNamed: named.length };
    });
    const ok = r.rivers > 0 && r.passes > 0 && r.nSeen > 0 && r.seen.every(s => s.f < 1 && s.n) && r.nNamed > 0;
    return { ok, detail: `roads across a river ${r.rivers}, over a pass ${r.passes} (e.g. ${JSON.stringify(r.sample)}); in ${r.years} years ${r.nSeen} fight days over a crossing (${r.seen.map(s => `${s.place}: x${s.f} ${s.n}`).join('; ')}); fights whose report names it ${r.nNamed}: ${r.named.join(' | ')}` };
  },

  // done-when 5: neighbouring realms never share a colour (on three worlds, the map as made and after 20 years)
  async d9RealmColors(pg) {
    const r = await pg.evaluate(() => {
      const out = [];
      const check = () => {
        const S = A.S, hex = {}, pairs = new Set(); let same = 0, close = 0, min = 9;
        for (const id in S.realms) if (S.realms[id].alive) hex[id] = UI.realmHex(S.realms[id]);
        const lab = h => { const v = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
          const l = Math.cbrt(0.4122214708 * v[0] + 0.5363325363 * v[1] + 0.0514459929 * v[2]), m = Math.cbrt(0.2119034982 * v[0] + 0.6806995451 * v[1] + 0.1073969566 * v[2]), s = Math.cbrt(0.0883024619 * v[0] + 0.2817188376 * v[1] + 0.6299787005 * v[2]);
          return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]; };
        for (const P of S.prov) for (const j of P.adj) {
          const a = P.owner, b = S.prov[j].owner; if (!a || !b || a === b || a === 'unclaimed' || b === 'unclaimed' || !hex[a] || !hex[b]) continue;
          const k = a < b ? a + b : b + a; if (pairs.has(k)) continue; pairs.add(k);
          if (hex[a] === hex[b]) same++;
          const p = lab(hex[a]), q = lab(hex[b]), d = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); min = Math.min(min, d); if (d < 0.05) close++;
        }
        return { realms: Object.keys(hex).length, distinct: new Set(Object.values(hex)).size, pairs: pairs.size, same, close, min: Math.round(min * 1000) / 1000 };
      };
      // M1: the one continent and two other map seeds (A.V2MAP.ONE switched for the life); the last played on twenty years
      const VM = A.V2MAP, one = VM.ONE;
      try { for (const seed of [4242, 90001, 620]) { VM.ONE = seed === 620 ? one : VM.seedOf(seed); A.newGame({ seed, realm: 'POL-01', status: 'peasant' }); out.push(check()); } } finally { VM.ONE = one; }
      T.play(20); out.push(check());
      return out;
    });
    const ok = r.every(x => x.same === 0);
    return { ok, detail: r.map(x => `${x.realms} realms, ${x.distinct} colours, ${x.pairs} neighbouring pairs, ${x.same} sharing a colour, ${x.close} closer than 0.05 (closest ${x.min})`).join(' | ') };
  },

  // done-when 6: every map is one component, and it redraws in 50 ms (main-thread CPU, after the first draw)
  async d9OneMap(pg, errs, { cpu }) {
    await pg.evaluate(() => {
      // a world at war, the player a general (62-inked-map's set-up), so the war room is his to see
      A.newGame({ seed: 621, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
      const pc = A.pc(), enemy = A.neighbors('POL-01')[0];
      A.startWar('POL-01', enemy, null, 'conquest'); A.enlist(pc); A._idIdx = null; A.advance(2); A._idIdx = null; pc.mil.rank = 7;
      A.S.queue = []; UI.screen = 'game'; UI.set.hints = false; UI.tab = 'world'; UI.worldView = 'map'; UI.set.atlasFog = false; UI.render();
      window.__paint = []; const p0 = MAP.paint;
      MAP.paint = function (ctx) { __paint.push((ctx.canvas && ctx.canvas.id) || '?'); return p0.apply(this, arguments); };
      window.__p0 = p0;
    });
    // the four renderings: the world tab, the full map, the war room, the atlas of your journeys
    const who = await pg.evaluate(() => {
      const wm = document.querySelector('#worldmap'); if (wm) MAP.draw(wm, { mode: 'political' });
      UI.A.ov('bigmap'); UI.gmDraw(); UI.ov = null; UI.render();
      if (UI.warRoomOpen) UI.warRoomOpen(); const wc = document.querySelector('#warmap'); if (wc && UI.drawWar) { UI.wr.view = null; UI.drawWar(wc); }
      UI.ov = null; UI.render();
      if (A.ATLAS && A.ATLAS.draw) { const cv = document.createElement('canvas'); cv.id = 'jrtest'; cv.width = 600; cv.height = 480; document.body.appendChild(cv); A.ATLAS.draw(cv); cv.remove(); }
      return __paint.slice();
    });
    // timing: each view drawn once to warm its caches, then ten times
    const views = [['world tab', 'wm'], ['full map z1', 'gm', 1], ['full map z3', 'gm', 3], ['full map z8', 'gm', 8], ['war room z1.5', 'wr', 1.5], ['war room z4', 'wr', 4], ['war room z9', 'wr', 9]];
    const out = [];
    for (const [name, kind, z] of views) {
      const setup = `(() => { A.V2MAP.SAT.budgetMs = 1e9; if (UI.INKMAP) UI.INKMAP.budgetMs = 1e9; const P = A.S.prov[A.pc().home];
        window.__draw = null;
        if ('${kind}' === 'wm') { UI.ov = null; UI.tab = 'world'; UI.render(); const c = document.querySelector('#worldmap'); window.__draw = () => MAP.draw(c, { mode: 'political' }); }
        if ('${kind}' === 'gm') { UI.A.ov('bigmap'); const w = 7000 / ${z || 1}; UI.gm.view = UI.wrClampView({ x0: P.sx - w / 2, y0: P.sy - w / 3.06, w, h: 0 }); window.__draw = () => UI.gmDraw(); }
        if ('${kind}' === 'wr') { UI.ov = null; UI.render(); if (UI.warRoomOpen) UI.warRoomOpen(); const c = document.querySelector('#warmap'); if (c) { const w = 7000 / ${z || 1}; UI.wr.view = UI.wrClamp({ x0: P.sx - w / 2, y0: P.sy - w / 3.06, w, h: w / 1.5277 }); window.__draw = () => UI.drawWar(c); } }
        if (window.__draw) window.__draw(); return !!window.__draw; })()`;
      if (!(await pg.evaluate(setup))) { out.push([name, null]); continue; }
      await pg.evaluate(() => { window.__draw(); });
      const c0 = await cpu(); await pg.evaluate(() => { for (let i = 0; i < 10; i++) window.__draw(); }); const c1 = await cpu();
      out.push([name, (c1 - c0) / 10]);
    }
    const h = await pg.evaluate(() => { MAP.paint = window.__p0; return { d9: A.D9.stats }; });
    const kinds = new Set(who);
    const timed = out.filter(x => x[1] != null), worst = Math.max(...timed.map(x => x[1]));
    const ok = ['worldmap', 'gmap', 'warmap', 'jrtest'].every(k => kinds.has(k)) && timed.length >= 5 && worst <= 50;
    return { ok, detail: `MAP.paint drew: ${[...kinds].join(', ')} | redraw ms (CPU): ${out.map(([n, ms]) => `${n} ${ms == null ? 'n/a' : ms.toFixed(1)}`).join(', ')}; worst ${worst.toFixed(1)} | the ways layer ${h.d9.ms} ms, ${h.d9.roads} roads, ${h.d9.marks} marks` };
  },

  // the ground is never saved, is the same from the seed after a load, and drawing it is pure
  async d9SaveAndPure(pg) {
    const r = await pg.evaluate(async () => {
      T.enter({ seed: 3131, realm: 'POL-06', status: 'peasant' }); T.play(1);
      const sig = () => { const G = A.D9.ground(); return G.edges.length + ':' + G.edges.reduce((a, e) => a + e.rank * 7 + e.km, 0) + ':' + G.crossings.length + ':' + A.D9.names().rivers.join(','); };
      const s0 = sig(), saved = /"(crossings|riverLinks|rivId)"/.test(JSON.stringify(A.S));   // the ground's own fields (a fight's report has a 'ground' cause of its own)
      const enc = await SAVES.encode(A.S, A.J), d = await SAVES.decode(enc.bytes);
      // another continent's ground differs (M1: every life is on the one continent, so another map seed is switched in)
      const VM = A.V2MAP, one = VM.ONE; VM.ONE = VM.seedOf(12);
      try { A.newGame({ seed: 12, realm: 'POL-01', status: 'peasant' }); } finally { VM.ONE = one; }
      const other = sig();
      A.V2MAP.cache.clear(); UI.enterSave(d);
      const s1 = sig();
      // drawing every map changes neither the state nor the stream
      const h0 = JSON.stringify(A.S), r0 = A.rngState;
      UI.screen = 'game'; UI.tab = 'world'; UI.render(); UI.A.ov('bigmap');
      for (const z of [1, 3, 8]) { const w = 7000 / z, P = A.S.prov[A.pc().home]; UI.gm.view = UI.wrClampView({ x0: P.sx - w / 2, y0: P.sy - w / 3.06, w, h: 0 }); UI.gmDraw(); }
      UI.ov = null; UI.render();
      return { same: s0 === s1, other: other !== s0, saved, pure: JSON.stringify(A.S) === h0 && A.rngState === r0, v: A.S.v2map };
    });
    return { ok: r.same && r.other && !r.saved && r.pure, detail: `the ground after a load is the same ${r.same}, another world's differs ${r.other}, nothing of it in the save ${!r.saved}, drawing pure ${r.pure}, map ${JSON.stringify(r.v)}` };
  },
};
