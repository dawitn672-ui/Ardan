// 99991-v2-map: the world is one generated continent, the same from the same seed, kept by a save, with every realm's
// provinces, and it draws at a phone's width and a laptop's.
import { pathToFileURL } from 'node:url';

// one world's facts, measured in the page
const FACTS = () => {
  const S = A.S, P = S.prov, gw = MAP.gw, gh = MAP.gh, g = MAP.grid;
  MAP.init();
  // every province reachable from the first by land
  const seen = new Set([0]), q = [0];
  while (q.length) { const i = q.pop(); for (const j of P[i].adj) if (!seen.has(j)) { seen.add(j); q.push(j); } }
  // the grid's land in 4-connected pieces
  const lab = new Int32Array(gw * gh).fill(-1), sizes = [];
  for (let s = 0; s < gw * gh; s++) {
    if (g[s] < 0 || lab[s] >= 0) continue;
    const id = sizes.length, st = [s]; lab[s] = id; let n = 0;
    while (st.length) { const k = st.pop(); n++; const x = k % gw; for (const j of [x > 0 ? k - 1 : -1, x < gw - 1 ? k + 1 : -1, k - gw, k + gw]) if (j >= 0 && j < gw * gh && g[j] >= 0 && lab[j] < 0) { lab[j] = id; st.push(j); } }
    sizes.push(n);
  }
  const land = sizes.reduce((a, b) => a + b, 0), main = Math.max(...sizes);
  let frame = 0; for (let x = 0; x < gw; x++) frame += (g[x] >= 0) + (g[(gh - 1) * gw + x] >= 0); for (let y = 0; y < gh; y++) frame += (g[y * gw] >= 0) + (g[y * gw + gw - 1] >= 0);
  // cells on the grid match each province's count, and adjacency is symmetric
  const cnt = new Int32Array(P.length); for (let k = 0; k < gw * gh; k++) if (g[k] >= 0) cnt[g[k]]++;
  const cellsOk = P.every(p => p.cells === cnt[p.id] && p.cells > 0);
  const sym = P.every(p => p.adj.every(j => P[j].adj.includes(p.id)));
  const inFrame = P.every(p => p.x > 0 && p.y > 0 && p.x < gw * 10 && p.y < gh * 10 && g[Math.floor(p.sy / 10) * gw + Math.floor(p.sx / 10)] === p.id);
  // each realm keeps the provinces it was written with (orig), and no realm or province lies off the one continent
  const want = {}, got = {};
  for (const p of LORE.map.provinces) want[p.realm] = (want[p.realm] || 0) + 1;
  for (const p of P) got[p.orig] = (got[p.orig] || 0) + 1;
  const countsOk = Object.keys(want).every(r => want[r] === got[r]) && P.length === LORE.map.provinces.length;
  const realmsOk = Object.keys(S.realms).every(id => LORE.realms[id] || S.realms[id].isNew || id === 'POL-31A');
  let h = 2166136261; for (let k = 0; k < g.length; k += 1) { h ^= g[k] + 1; h = Math.imul(h, 16777619); }
  return { v2: S.v2map, n: P.length, reach: seen.size, pieces: sizes.length, mainPct: Math.round(1000 * main / land) / 10, land, frame, cellsOk, sym, inFrame, countsOk, realmsOk,
    far: typeof A.FAR !== 'undefined' && !!A.FAR, sea: P.filter(p => p.sea && p.sea.length).length, grid: (h >>> 0).toString(16),
    terr: P.reduce((o, p) => (o[p.terr] = (o[p.terr] || 0) + 1, o), {}), coast: P.filter(p => p.coast).length };
};

export default {
  // one continent: every province reachable by land, at least 98.5% of the land in one piece, sea all round the frame,
  // the realms' province counts kept, no Far Lands
  async v2mapOneContinent(pg) {
    const r = await pg.evaluate(`(() => { const out = []; for (const seed of [11, 4242, 90001]) { A.newGame({ seed, realm: 'POL-01', status: 'peasant' }); out.push((${FACTS})()); } return out; })()`);
    const bad = r.filter(f => !(f.v2 && f.reach === f.n && f.mainPct >= 98.5 && f.frame === 0 && f.cellsOk && f.sym && f.inFrame && f.countsOk && f.realmsOk && !f.far && f.sea === 0));
    return { ok: !bad.length, detail: r.map(f => `${f.v2 && f.v2.seed}: ${f.reach}/${f.n} provinces reached by land, ${f.pieces} land piece(s), main ${f.mainPct}%, ${f.frame} land cells on the frame, cells ${f.cellsOk}, adjacency symmetric ${f.sym}, sites inside ${f.inFrame}, realm counts kept ${f.countsOk}, realms ${f.realmsOk}, far lands ${f.far}, ${f.coast} coastal, terrain ${JSON.stringify(f.terr)}`).join(' | ') };
  },

  // the same seed gives the same map (built again from nothing), another seed another; building it moves neither the
  // game's state nor its random stream; and the time it takes
  async v2mapSameSeed(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 777, realm: 'POL-03', status: 'peasant' });
      const VM = A.V2MAP, seed = A.S.v2map.seed, h0 = T.hash(A.S), r0 = A.rngState;
      const key = w => { let h = 2166136261; for (const v of w.grid) { h ^= v + 1; h = Math.imul(h, 16777619); } return (h >>> 0).toString(16) + ':' + T.hash(w.prov); };
      const a = key(VM.world(seed));
      VM.cache.clear();
      const t0 = performance.now(), w2 = VM.world(seed), ms = performance.now() - t0, b = key(w2);
      const c = key(VM.build(VM.seedOf(778), VM.release()));
      return { same: a === b, differ: a !== c, inert: T.hash(A.S) === h0 && A.rngState === r0, ms: Math.round(ms), parts: Object.fromEntries(Object.entries(w2.T).map(([k, v]) => [k, Math.round(v)])) };
    });
    return { ok: r.same && r.differ && r.inert, detail: `same seed same map ${r.same}; another seed another map ${r.differ}; state and stream untouched ${r.inert}; built in ${r.ms} ms (${JSON.stringify(r.parts)})` };
  },

  // a save keeps the map: the state round-trips exactly, and after a load (with the cache emptied) the grid is built
  // again from the stored seed, the same as before
  async v2mapSaveLoad(pg) {
    const r = await pg.evaluate(async () => {
      T.enter({ seed: 3131, realm: 'POL-06', race: 'elf', status: 'peasant' });
      T.play(2);
      MAP.init();
      const gh = g => { let h = 2166136261; for (const v of g) { h ^= v + 1; h = Math.imul(h, 16777619); } return h >>> 0; };
      const g0 = gh(MAP.grid), seed = A.S.v2map.seed, prov0 = T.hash(A.S.prov);
      const enc = await SAVES.encode(A.S, A.J), a = JSON.stringify(A.packState ? A.packState(A.S) : A.S);
      const d = await SAVES.decode(enc.bytes), b = JSON.stringify(A.packState ? A.packState(d.S) : d.S);
      // another world in between, then the save
      A.newGame({ seed: 12, realm: 'POL-01', status: 'peasant' }); MAP.init(); const g1 = gh(MAP.grid);
      A.V2MAP.cache.clear();
      UI.enterSave(d);
      MAP.init();
      return { exact: a === b, back: gh(MAP.grid) === g0, other: g1 !== g0, seed: A.S.v2map && A.S.v2map.seed === seed, prov: T.hash(A.S.prov) === prov0 };
    });
    return { ok: r.exact && r.back && r.other && r.seed && r.prov, detail: `round trip exact ${r.exact}; another world in between ${r.other}; after the load the grid is the save's again ${r.back}, seed kept ${r.seed}, provinces kept ${r.prov}` };
  },

  // the map draws without error at a phone's width and a laptop's: the title, the world tab, the full map at three
  // zooms (the closest from tiles) and the war room; the sea is sea-blue, the land is not, and drawing changes nothing
  async v2mapRenders(pg, errs, { browser, file }) {
    const out = [];
    for (const [W, H] of [[420, 860], [1366, 900]]) {
      const ctx = await browser.newContext({ viewport: { width: W, height: H } });
      const p = await ctx.newPage(); const e2 = [];
      p.on('pageerror', e => e2.push(String(e.message || e).slice(0, 200)));
      await p.goto(pathToFileURL(file).href);
      await p.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
      const r = await p.evaluate(() => {
        const px = (c, x, y) => Array.from(c.getContext('2d').getImageData(Math.floor(x), Math.floor(y), 1, 1).data);
        const res = {};
        const tm = document.querySelector('#titlemap'); if (tm) { MAP.draw(tm, { labels: true, home: false }); res.title = px(tm, 4, 4); }
        A.newGame({ seed: 620, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
        UI.screen = 'game'; UI.set.hints = false; UI.tab = 'world'; UI.worldView = 'map'; UI.set.atlasFog = false; UI.render();
        const wm = document.querySelector('#worldmap');
        if (wm) { MAP.draw(wm, { mode: 'political' }); res.world = [wm.width, wm.height]; }
        A.V2MAP.SAT.budgetMs = 1e9;
        UI.A.ov('bigmap');
        const P = A.S.prov[A.realm('POL-01').capitalProv], views = [];
        for (const z of [1, 3, 9]) {
          const w = 7000 / z; UI.gm.view = UI.wrClampView({ x0: P.sx - w / 2, y0: P.sy - w / 3.06, w, h: 0 }); UI.gmDraw();
          const c = document.querySelector('#gmap'); if (c) views.push([c.width, c.height]);
        }
        // a sea pixel and a land pixel of the whole map
        UI.gm.view = UI.wrClampView({ x0: 0, y0: 0, w: 7000, h: 0 }); UI.gmDraw();
        const c = document.querySelector('#gmap'), v = UI.gm.view;
        let sea = null, land = null;
        for (let k = 0; k < MAP.grid.length && (!sea || !land); k += 211) {
          const x = (k % MAP.gw) * 10 + 5, y = Math.floor(k / MAP.gw) * 10 + 5; if (x < v.x0 || y < v.y0 || x > v.x0 + v.w || y > v.y0 + v.h) continue;
          const isSea = MAP.grid[k] < 0 && (k % MAP.gw) < 20; const p = px(c, (x - v.x0) / v.w * c.width, (y - v.y0) / v.h * c.height);
          if (isSea && !sea) sea = p; else if (MAP.grid[k] >= 0 && !land && A.S.prov[MAP.grid[k]].terr === 'plains') land = p;
        }
        UI.ov = null; UI.render(); UI.warRoomOpen && UI.warRoomOpen();
        const wc = document.querySelector('#warmap'); if (wc && UI.drawWar) { UI.drawWar(wc); res.war = [wc.width, wc.height]; }
        res.views = views; res.sea = sea; res.land = land; res.tiles = A.V2MAP.SAT.stats.tiles;
        // drawing alone (the screens above may step the engine: the war room raises its day's tick): every view drawn
        // again from nothing, the satellite tiles too, changes neither the state nor the stream
        const h1 = JSON.stringify(A.S), r1 = A.rngState;
        A.V2MAP.satReset(); A.V2MAP.use(null); MAP.init();
        if (wm) MAP.draw(wm, { mode: 'political' });
        UI.A.ov('bigmap');
        for (const z of [1, 3, 9]) { const w = 7000 / z; UI.gm.view = UI.wrClampView({ x0: P.sx - w / 2, y0: P.sy - w / 3.06, w, h: 0 }); UI.gmDraw(); }
        UI.ov = null; UI.renderModal && UI.renderModal();
        if (wc && UI.drawWar) UI.drawWar(wc);
        res.pure = JSON.stringify(A.S) === h1 && A.rngState === r1;
        return res;
      });
      out.push({ W, r, errs: e2 });
      await ctx.close();
    }
    const ok = out.every(o => !o.errs.length && o.r.views.length === 3 && o.r.sea && o.r.sea[2] > o.r.sea[0] + 20 && o.r.tiles > 0 && o.r.pure);
    return { ok, detail: out.map(o => `${o.W}px: full map at 3 zooms ${JSON.stringify(o.r.views)}, world tab ${JSON.stringify(o.r.world)}, war room ${JSON.stringify(o.r.war)}, ${o.r.tiles} close tiles, sea ${o.r.sea} land ${o.r.land}, pure ${o.r.pure}${o.errs.length ? ', ERR ' + o.errs[0] : ''}`).join(' | ') };
  },

  // the creation screen offers no lands to choose, and nothing in the build is the Great Continent
  async v2mapNoFarLands(pg) {
    const r = await pg.evaluate(() => {
      UI.screen = 'title'; UI.render();
      UI.A.newLife();
      let html = '';
      for (let step = 0; step < 6; step++) { UI.step = step; UI.render(); html += document.querySelector('#app').innerHTML; }
      UI.screen = 'title'; UI.render();
      return { far: typeof A.FAR !== 'undefined' && !!A.FAR, lands: /Great Continent|Far Lands|Known World only|data-c="crLands"/i.test(html), big: !!MAP.big };
    });
    return { ok: !r.far && !r.lands && !r.big, detail: `A.FAR ${r.far}; a lands choice on the creation screen ${r.lands}; a bigger frame ${r.big}` };
  },

  // playtest 1, #21: at a phone's width (420 px) and a laptop's, every name written on the world tab and the full map
  // (whole, and at zoom 3) is at least VM.LABEL_MIN (realms) or VM.PROV_MIN (provinces) px tall on screen, no two
  // names overlap, and the player's realm and capital are always among them
  async v2mapLabels(pg, errs, { browser, file }) {
    const out = [];
    for (const [W, H] of [[420, 860], [1366, 900]]) {
      const ctx = await browser.newContext({ viewport: { width: W, height: H } });
      const p = await ctx.newPage(); const e2 = [];
      p.on('pageerror', e => e2.push(String(e.message || e).slice(0, 200)));
      await p.goto(pathToFileURL(file).href);
      await p.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
      const r = await p.evaluate(() => {
        A.newGame({ seed: 2101, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 20 });
        UI.screen = 'game'; UI.set.hints = false; UI.tab = 'world'; UI.worldView = 'map'; UI.render();
        const VM = A.V2MAP, views = [], mine = A.realm('POL-01'), cap = A.prov(mine.capitalProv).name;
        const check = name => {
          const L = VM.labelsPlaced, realms = L.filter(l => l.kind === 'realm'), provs = L.filter(l => l.kind !== 'realm');
          let overlap = 0;
          for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { const a = L[i], b = L[j]; if (a.x < b.x + b.w - 0.5 && a.x + a.w > b.x + 0.5 && a.y < b.y + b.h - 0.5 && a.y + a.h > b.y + 0.5) overlap++; }
          views.push({ name, n: L.length, minRealm: Math.min(...realms.map(l => l.px)), minProv: provs.length ? Math.min(...provs.map(l => l.px)) : null, overlap,
            mine: L.some(l => l.kind === 'realm' && l.t === String(mine.short).toUpperCase()), cap: L.some(l => l.kind === 'capital' && l.t === cap) });
        };
        const wm = document.querySelector('#worldmap'); if (wm) { MAP.draw(wm, { mode: 'political' }); check('world tab'); }
        UI.A.ov('bigmap');
        const P = A.prov(mine.capitalProv);
        for (const z of [1, 3]) { const w = 7000 / z; UI.gm.view = UI.wrClampView({ x0: P.sx - w / 2, y0: P.sy - w / 3.06, w, h: 0 }); UI.gmDraw(); check('full map zoom ' + z); }
        UI.ov = null; UI.render();
        return { views, LMIN: VM.LABEL_MIN, PMIN: VM.PROV_MIN };
      });
      out.push({ W, r, errs: e2 });
      await ctx.close();
    }
    const bad = [];
    for (const o of out) for (const v of o.r.views) if (!(v.n > 3 && v.minRealm >= o.r.LMIN - 0.01 && (v.minProv == null || v.minProv >= o.r.PMIN - 0.01) && !v.overlap && v.mine && v.cap)) bad.push(`${o.W}px ${v.name}`);
    const ok = !bad.length && out.every(o => !o.errs.length);
    return { ok, detail: out.map(o => `${o.W}px: ` + o.r.views.map(v => `${v.name} ${v.n} names, smallest realm ${v.minRealm.toFixed(1)} px, province ${v.minProv == null ? '-' : v.minProv.toFixed(1)} px, ${v.overlap} overlaps, yours ${v.mine}, capital ${v.cap}`).join('; ')).join(' | ') + (bad.length ? ' | BAD ' + bad.join(', ') : '') + (out.some(o => o.errs.length) ? ' | ERR ' + out.find(o => o.errs.length).errs[0] : '') };
  },

  // playtest 1, #21: a realm named for islands sits on the shore of a peninsula, and one named for a coast or a reef on
  // the shore: its capital is coastal, and (for the isles) most of its provinces are, on several seeds
  async v2mapSeaRealms(pg) {
    const r = await pg.evaluate(() => {
      const VM = A.V2MAP, out = [];
      for (const seed of [11, 4242, 90001, 7]) {
        A.newGame({ seed, realm: 'POL-01', status: 'peasant' });
        for (const id in LORE.realms) {
          const nm = LORE.realms[id].name, isle = VM.ISLE_RX.test(nm), coast = VM.COAST_RX.test(nm);
          if (!isle && !coast) continue;
          const ps = A.S.prov.filter(p => p.orig === id), capP = ps.find(p => p.type === 'capital city') || ps[0];
          out.push({ seed, id, nm, isle, n: ps.length, coastal: ps.filter(p => p.coast).length, cap: !!(capP && capP.coast) });
        }
      }
      return out;
    });
    const bad = r.filter(x => !x.cap || (x.isle && x.coastal * 3 < x.n * 2));
    return { ok: r.length >= 3 && !bad.length, detail: `${r.length} realm-seeds named for the sea; ` + r.filter(x => x.seed === 11).map(x => `${x.nm}: capital on the coast ${x.cap}, ${x.coastal}/${x.n} provinces coastal`).join('; ') + (bad.length ? ' | BAD ' + bad.map(x => `${x.nm} seed ${x.seed} ${x.coastal}/${x.n}`).join(', ') : '') };
  },
};
