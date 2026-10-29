// 9991-atlas: what you know of the world, and the map as a main surface (design review cycle 1, #11 and #6).
//
// Knowledge. pc.atlas = { s: {province id: year seen}, h: {id: year heard of}, src: {id: how heard}, v: version, wc }.
//   seen    with your own eyes: where you live, every province a journey passes through (9990-journeys), a wild place
//           you found (997-wilds' pc.sites)
//   heard   of: the world record's news (57's S.wrec) near you or of your own realm, where your kin and friends live
//           (their letters), where your realm's caravans go (45's S.eco.car), what you are told on the road, your own
//           realm's land if you rule it, and the tales of a parent when you take up the life of an heir
//   unknown everything else
// A person without pc.atlas (a new game before its first day, an old save) knows home and the land next to it as seen,
// and the rest of their own realm, and its neighbours' seats, as heard of (AT.base), without writing anything.
//
// The map. 62-inked-map draws a veil over what you have not seen (two hooks: MAP.veil, laid into its kept lines view
// under the names, and MAP.unnamed, which leaves an unknown province's name unwritten), on the world tab, the full map and the story
// column's map: unknown land is blank vellum, land heard of is half-veiled, the sea fades out from the coasts you know.
// The veil is read from the state and drawn from a cached picture; it writes nothing and draws no random numbers.
//
// Story | Map. The story column gets a toggle. The map there shows where you are, your road (A.JR), your home, your
// people, and what you know of a province you click.
//
// Places you know. A page under Chronicle: counts, the farthest you have been, the roads you have walked, every place
// seen and heard of by realm, with its wild places.
(function () {
  const AT = A.ATLAS = A.ATLAS || {};
  AT.OFF = false;
  AT.HEIR_SEEN_KM = 0;          // a parent's seen places become an heir's heard-of; none stay seen
  AT.SRC = { j: 'seen on the road', l: 'lived there', w: 'found a wild place', n: 'news', r: 'told on the road', k: 'letters from your people',
    c: 'caravan talk', t: 'a parent\'s tales', o: 'your own realm', b: 'born knowing it' };
  const P_ = id => (A.S && A.S.prov ? A.S.prov[id] : null);
  const km = (a, b) => { const p = P_(a), q = P_(b); return p && q ? Math.hypot(p.x - q.x, p.y - q.y) : Infinity; };
  // the map's frame in km. 99-far-lands defines MAP.KX0/KY0/KW/KH (and ZREF) for any frame; without it the release's
  // frame is the grid at its own cell size from 0,0, so a Known World veil is the same with or without 99
  const cell = () => MAP.cell || (LORE.map && LORE.map.cell) || 10;
  const KX0 = () => MAP.KX0 || 0, KY0 = () => MAP.KY0 || 0;
  const KW = () => MAP.KW || (MAP.gw || LORE.map.gw) * cell(), KH = () => MAP.KH || (MAP.gh || LORE.map.gh) * cell();
  const ZREF = () => MAP.ZREF || 7000;
  const hash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };

  // ---- knowledge -----------------------------------------------------------------------------------------------------
  // what a person knows without having been told anything yet (pure): home and the land around it, their realm by name
  AT.base = function (pc) {
    const s = {}, h = {}, H = P_(pc && pc.home); if (!H) return { s, h };
    s[H.id] = 1; for (const id of H.adj || []) s[id] = 1;
    const r = A.realm(pc.realm), near = new Set();
    for (const Q of A.S.prov) if (Q.owner === pc.realm) { h[Q.id] = 1; for (const id of Q.adj || []) { const o = P_(id) && P_(id).owner; if (o && o !== pc.realm) near.add(o); } }
    if (r && r.capitalProv != null) h[r.capitalProv] = 1;
    for (const o of near) { const x = A.realm(o); if (x && x.capitalProv != null) h[x.capitalProv] = 1; }
    for (const id of H.sea || []) h[id] = 1;
    return { s, h };
  };
  AT.ok = pc => !!(pc && pc.atlas && typeof pc.atlas === 'object' && pc.atlas.s && typeof pc.atlas.s === 'object' && pc.atlas.h && typeof pc.atlas.h === 'object');
  // engine only: give a person their atlas (from what they would know anyway)
  AT.ensure = function (pc) {
    if (!pc || AT.ok(pc)) return pc && pc.atlas;
    const b = AT.base(pc), y = A.S.year, a = { s: {}, h: {}, src: {}, v: 1, wc: A.WC && A.WC.count ? A.WC.count() : 0, born: pc.home };
    for (const id in b.s) { a.s[id] = y; a.src[id] = 'l'; }
    for (const id in b.h) if (a.s[id] == null) { a.h[id] = y; a.src[id] = 'o'; }
    pc.atlas = a;
    return a;
  };
  AT.see = function (pc, id, src) {
    if (AT.OFF || !pc || !P_(id)) return false;
    const a = AT.ensure(pc); if (a.s[id] != null) return false;
    a.s[id] = A.S.year; delete a.h[id]; a.src[id] = src || 'j'; a.v = (a.v || 0) + 1;
    return true;
  };
  AT.hear = function (pc, id, src) {
    if (AT.OFF || !pc || !P_(id)) return false;
    const a = AT.ensure(pc); if (a.s[id] != null || a.h[id] != null) return false;
    a.h[id] = A.S.year; a.src[id] = src || 'r'; a.v = (a.v || 0) + 1;
    return true;
  };
  // 2 seen, 1 heard of, 0 unknown (pure; a person without an atlas reads as AT.base)
  AT.level = function (pc, id) {
    if (!pc) return 2;
    if (AT.ok(pc)) return pc.atlas.s[id] != null ? 2 : pc.atlas.h[id] != null ? 1 : 0;
    const b = baseOf(pc); return b.s[id] ? 2 : b.h[id] ? 1 : 0;
  };
  let baseMemo = null;
  const baseOf = pc => { const k = pc.id + '|' + pc.home + '|' + pc.realm + '|' + A.S.year; if (!baseMemo || baseMemo.k !== k) baseMemo = { k, b: AT.base(pc) }; return baseMemo.b; };
  AT.counts = function (pc) {
    const out = { seen: 0, heard: 0, total: A.S && A.S.prov ? A.S.prov.length : 0, realms: 0, far: 0 };
    if (!pc || !A.S) return out;
    const a = AT.ok(pc) ? pc.atlas : baseOf(pc), rs = new Set();
    for (const id in a.s) { const P = P_(+id); if (!P) continue; out.seen++; if (P.owner) rs.add(P.owner); }
    for (const id in a.h) if (P_(+id) && a.s[id] == null) out.heard++;
    out.realms = rs.size;
    const born = AT.ok(pc) && pc.atlas.born != null ? pc.atlas.born : pc.home;
    for (const id in a.s) { const d = km(+id, born); if (isFinite(d) && d > out.far) out.far = Math.round(d); }
    return out;
  };

  // ---- what you hear, month by month (engine) ---------------------------------------------------------------------------
  const KIN = ['father', 'mother', 'sibling', 'spouse', 'child', 'lover', 'friend', 'betrothed', 'grandchild', 'grandparent', 'cousin'];
  AT.people = function (pc) {
    const out = [];
    for (const id in (pc && pc.rel) || {}) {
      const r = pc.rel[id], p = r && KIN.includes(r.type) ? A.P(id) : null;
      if (p && p.alive && p.home != null && P_(p.home)) out.push({ p, type: r.type });
    }
    return out;
  };
  AT.month = function (pc) {
    if (AT.OFF || !pc || !pc.alive) return;
    const a = AT.ensure(pc);
    if (!(A.JR && A.JR.on(pc) && !pc.journey.applied)) AT.see(pc, pc.home, 'l');
    // wild places found (997)
    if (pc.sites && typeof pc.sites === 'object') for (const k in pc.sites) { const id = parseInt(k, 10); if (P_(id)) AT.see(pc, id, 'w'); }
    // letters from your people
    for (const x of AT.people(pc)) AT.hear(pc, x.p.home, 'k');
    // the news: what the world record has set down since last month, near you or of your realm (57)
    const WC = A.WC;
    if (WC && WC.count) {
      const n = WC.count();
      for (let i = Math.max(a.wc || 0, n - 60); i < n; i++) {
        const e = WC.ent(i); if (!e || e.p == null || !P_(e.p)) continue;
        const great = WC.KINDS && WC.KINDS[e.k] && WC.KINDS[e.k][1] >= 3;
        if (e.a === pc.realm || e.b === pc.realm || km(e.p, pc.home) < 1400 || great) AT.hear(pc, e.p, 'n');
      }
      a.wc = n;
    }
    // where your realm's caravans go (45, 66)
    const car = A.S.eco && Array.isArray(A.S.eco.car) ? A.S.eco.car : [];
    let k = 0;
    for (const c of car) { if (k >= 3) break; if (c && c.f === pc.realm && c.tT != null && AT.hear(pc, c.tT, 'c')) k++; }
    // a ruler knows the land of the realm by report
    if (pc.ruler) for (const Q of A.S.prov) if (Q.owner === pc.ruler) AT.hear(pc, Q.id, 'o');
  };
  A.onMonth = A.onMonth || [];
  A.onMonth.push(pc => AT.month(pc));

  // an heir hears the old life's places told: what the parent saw is heard of (and kept seen near the heir's home), and
  // half of what the parent had heard of, chosen by the place and the heir (never A.rand)
  AT.inherit = function (old, p) {
    if (AT.OFF || !old || !p || !AT.ok(old)) return 0;
    const a = AT.ensure(p), y = A.S.year; let n = 0;
    for (const id in old.atlas.s) {
      if (a.s[id] != null) continue;
      if (km(+id, p.home) <= AT.HEIR_SEEN_KM) { a.s[id] = y; a.src[id] = 'l'; }
      else if (a.h[id] == null) { a.h[id] = y; a.src[id] = 't'; n++; }
    }
    for (const id in old.atlas.h) if (a.s[id] == null && a.h[id] == null && hash(id + '|' + p.id) % 2 === 0) { a.h[id] = y; a.src[id] = 't'; n++; }
    a.v = (a.v || 0) + 1;
    return n;
  };
  if (typeof A.continueAs === 'function') {
    const ca = A.continueAs;
    A.continueAs = function () {
      const old = A.pc(), r = ca.apply(this, arguments);
      try {
        const p = A.pc();
        if (r && old && p && p.id !== old.id) {
          const n = AT.inherit(old, p);
          if (n) A.log(`${old.sex === 'F' ? 'Your mother' : 'The one before you'} told of the road often enough: ${n} places you have never seen are on the map you keep.`, 'lore');
        }
      } catch (e) { console.error('atlas heir', e); }
      return r;
    };
  }

  // ---- the veil (rendering only) ---------------------------------------------------------------------------------------
  AT.VEIL_CANVAS = { worldmap: 1, gmap: 1, jrmap: 1 };
  AT.VEIL = [229, 218, 190];       // vellum
  AT.ALPHA = [0.88, 0.5, 0];       // unknown, heard of, seen
  AT.fogOn = () => !AT.OFF && !(UI.set && UI.set.atlasFog === false);
  let veilMemo = null;
  AT.veilKey = pc => [pc.id, AT.ok(pc) ? pc.atlas.v + ':' + Object.keys(pc.atlas.s).length + ':' + Object.keys(pc.atlas.h).length : 'b' + pc.home + pc.realm, MAP.gridKey, MAP.gw, MAP.gh, A.S.prov.length].join('|');
  AT.veilLayer = function (pc) {
    if (typeof document === 'undefined' || !MAP.grid || !MAP.gw) return null;
    const key = AT.veilKey(pc);
    if (veilMemo && veilMemo.key === key) return veilMemo.cv;
    const N = A.S.prov.length, lv = new Float32Array(N);
    for (let i = 0; i < N; i++) { const l = AT.level(pc, i); lv[i] = l === 2 ? 0 : l === 1 ? 0.55 : 1; }
    // a large frame (the Great Continent) is veiled at half the grid's resolution: 20 km cells, still soft when drawn
    const F = MAP.gw > 1000 ? 2 : 1, GW = MAP.gw, gw = Math.floor(GW / F), gh = Math.floor(MAP.gh / F), g = MAP.grid, v = new Float32Array(gw * gh), land = new Uint8Array(gw * gh);
    for (let y = 0, i = 0; y < gh; y++) for (let x = 0; x < gw; x++, i++) { const id = g[y * F * GW + x * F]; if (id >= 0 && id < N) { v[i] = lv[id]; land[i] = 1; } else v[i] = 1; }
    // the sea fades out from the coasts you know: two chamfer passes over the water cells
    const st = 0.022 * F, sd = 0.031 * F;
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      const i = y * gw + x; if (land[i]) continue;
      let m = v[i];
      if (x > 0) m = Math.min(m, v[i - 1] + st);
      if (y > 0) { m = Math.min(m, v[i - gw] + st); if (x > 0) m = Math.min(m, v[i - gw - 1] + sd); if (x < gw - 1) m = Math.min(m, v[i - gw + 1] + sd); }
      v[i] = m;
    }
    for (let y = gh - 1; y >= 0; y--) for (let x = gw - 1; x >= 0; x--) {
      const i = y * gw + x; if (land[i]) continue;
      let m = v[i];
      if (x < gw - 1) m = Math.min(m, v[i + 1] + st);
      if (y < gh - 1) { m = Math.min(m, v[i + gw] + st); if (x < gw - 1) m = Math.min(m, v[i + gw + 1] + sd); if (x > 0) m = Math.min(m, v[i + gw - 1] + sd); }
      v[i] = m;
    }
    const cv = (veilMemo && veilMemo.cv && veilMemo.cv.width === gw && veilMemo.cv.height === gh) ? veilMemo.cv : document.createElement('canvas');
    cv.width = gw; cv.height = gh;
    const c = cv.getContext('2d'), img = c.createImageData(gw, gh), d = img.data, [R, G, B] = AT.VEIL, a0 = AT.ALPHA[0];
    for (let i = 0; i < v.length; i++) { const o = i * 4; d[o] = R; d[o + 1] = G; d[o + 2] = B; d[o + 3] = Math.round(Math.min(1, v[i]) * a0 * 255); }
    c.putImageData(img, 0, 0);
    veilMemo = { key, cv };
    return cv;
  };
  // 62-inked-map's hook (patch AT-VEIL): laid into the inked map's own kept view of its lines layer, over the ground,
  // the wash, the borders and the towns and under the names, so a still or panning map costs nothing more. `host` is
  // the canvas on screen (the kept view is an offscreen copy); MAP.veilKey tells 62 when the view must be laid again.
  MAP.veil = function (ctx, W, H, v, host) {
    try {
      const cv = host || (ctx && ctx.canvas), pc = A.S && A.pc && A.pc();
      if (!AT.fogOn() || !cv || !AT.VEIL_CANVAS[cv.id] || !pc || !A.S.prov) return false;
      const layer = AT.veilLayer(pc); if (!layer) return false;
      const vx = v ? v.x0 : KX0(), vy = v ? v.y0 : KY0(), vw = v ? v.w : KW(), vh = v ? v.h : KH();
      // only the part of the picture in view is sampled
      const gw = layer.width, gh = layer.height, sx = (vx - KX0()) / KW() * gw, sy = (vy - KY0()) / KH() * gh, sw = vw / KW() * gw, sh = vh / KH() * gh;
      const x0 = Math.max(0, sx), y0 = Math.max(0, sy), x1 = Math.min(gw, sx + sw), y1 = Math.min(gh, sy + sh);
      if (x1 <= x0 || y1 <= y0) return true;
      ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'low';
      ctx.drawImage(layer, x0, y0, x1 - x0, y1 - y0, (x0 - sx) / sw * W, (y0 - sy) / sh * H, (x1 - x0) / sw * W, (y1 - y0) / sh * H);
      ctx.restore();
      return true;
    } catch (e) { console.error('atlas veil', e); return false; }
  };
  MAP.veilKey = function (cv) {
    const pc = A.S && A.pc && A.pc();
    return AT.fogOn() && cv && AT.VEIL_CANVAS[cv.id] && pc && A.S.prov ? '|veil:' + AT.veilKey(pc) : '';
  };
  // 62's province names: an unknown province's name is not written (patch AT-UNNAMED)
  MAP.unnamed = function (p, ctx) {
    const cv = ctx && ctx.canvas, pc = A.S && A.pc && A.pc();
    return !!(AT.fogOn() && cv && AT.VEIL_CANVAS[cv.id] && pc && p && AT.level(pc, p.id) === 0);
  };

  // ---- Story | Map in the story column ----------------------------------------------------------------------------------
  UI.storyView = UI.storyView || 'story';
  const esc = s => UI.esc(s);
  AT.where = function (pc) {
    const J = A.JR, j = J && J.on(pc) ? pc.journey : null;
    return j && !j.applied ? (j.there ? j.to : j.at) : pc.home;
  };
  AT.barHtml = function (pc) {
    const map = UI.storyView === 'map', c = AT.counts(pc);
    const road = A.JR && A.JR.statusLine ? A.JR.statusLine(pc) : '';
    return `<div class="at-bar" role="tablist" aria-label="Story or map"><span class="seg at-seg">` +
      `<button class="small${map ? '' : ' on'}" role="tab" aria-selected="${!map}" data-a="atView" data-v="story">Story</button>` +
      `<button class="small${map ? ' on' : ''}" role="tab" aria-selected="${map}" data-a="atView" data-v="map">Map</button></span>` +
      `<span class="at-sum tiny muted">${road ? esc(road) : `${esc(A.provName(AT.where(pc)))} · seen ${c.seen} of ${A.fmt(c.total)} places`}</span></div>`;
  };
  AT.mapHtml = function (pc) {
    const c = AT.counts(pc), sel = UI.atSel != null && P_(UI.atSel) ? UI.atSel : null;
    return `<div class="at-map mapwrap"><canvas id="jrmap" width="600" height="520" aria-label="Map of what you know"></canvas>` +
      `<div class="mapzoom"><button class="small" data-a="atZoom" data-v="1.5" aria-label="Zoom in">+</button><button class="small" data-a="atZoom" data-v="0.66" aria-label="Zoom out">−</button><button class="small" data-a="atZoom" data-v="me" aria-label="Back to where you are">⌖</button></div></div>` +
      `<div class="at-legend tiny muted"><span><i class="at-k at-me"></i>you</span><span><i class="at-k at-home"></i>home</span>${A.JR && A.JR.on(pc) ? '<span><i class="at-k at-road"></i>your road</span>' : ''}<span><i class="at-k at-kin"></i>your people</span><span><i class="at-k at-heard"></i>heard of</span><span><i class="at-k at-unk"></i>unknown</span>` +
      `<span class="at-n">seen ${c.seen} · heard of ${c.heard} · ${c.realms} realms</span> <button class="small ghost" data-a="tab" data-v="atlas">Places you know</button></div>` +
      `<div class="at-side" id="atSide">${sel != null ? AT.provCard(pc, sel) : '<p class="tiny muted">Drag to move the map, click a place to see what you know of it.</p>'}</div>`;
  };
  // what you know of a province (pure)
  AT.provCard = function (pc, id) {
    const P = P_(id); if (!P) return '';
    const l = AT.level(pc, id), r = A.realm(P.owner), a = AT.ok(pc) ? pc.atlas : null;
    const src = a && a.src ? AT.SRC[a.src[id]] : null;
    let h = `<div class="card at-card"><div class="row"><b>${l ? esc(P.name) : 'Somewhere you do not know'}</b>`;
    if (pc.home === id) h += ' <span class="chip gold">your home</span>';
    h += '</div>';
    if (l === 0) return h + `<p class="small muted">Nobody you know has been there, and you have never heard it spoken of. ${r ? `The map-makers put it in ${esc(r.name)}.` : ''}</p></div>`;
    h += `<p class="small">${r ? esc(r.name) : 'Unclaimed land'} · ${esc(A.cap(P.terr))}${P.coast ? ', on the coast' : ''}${P.town > 2000 ? ' · a town of ' + A.fmt(P.town) : ''}</p>`;
    h += `<p class="small muted">${l === 2 ? `Seen with your own eyes${a && a.s[id] > 1 ? ' in ' + a.s[id] : ''}${src ? ' (' + esc(src) + ')' : ''}.` : `Heard of${a && a.h[id] > 1 ? ' in ' + a.h[id] : ''}${src ? ', from ' + esc(src) : ''}. You have never been.`}</p>`;
    const W = A.WILDS;
    if (W && l === 2) { const ss = W.sites(P).filter(s => W.found(pc, s.key)); if (ss.length) h += `<p class="small">Wild places you found here: ${ss.map(s => esc(s.place)).join('; ')}.</p>`; }
    const ppl = AT.people(pc).filter(x => x.p.home === id);
    if (ppl.length) h += `<p class="small">Your people here: ${ppl.slice(0, 6).map(x => esc(A.fullName(x.p, false)) + ' (' + esc(x.type) + ')').join(', ')}.</p>`;
    return h + '</div>';
  };
  const logWrap = UI.renderLogWrap;
  UI.renderLogWrap = function () {
    const h = logWrap.apply(this, arguments), pc = A.pc();
    if (AT.OFF || !pc) return h;
    try {
      if (UI.storyView !== 'map') return AT.barHtml(pc) + h;
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => AT.paint());
      return AT.barHtml(pc) + AT.mapHtml(pc);
    } catch (e) { console.error('atlas view', e); return h; }
  };

  // the view on the story column's map: centred on where you are, about 2,400 km across (UI state, never in A.S)
  AT.fit = function (cv) {
    const pc = A.pc(), P = P_(AT.where(pc)) || P_(pc.home), W = cv.width, H = cv.height, w = Math.min(KW(), 2400), h = w * H / W;
    return { x0: (P ? P.sx : KX0() + KW() / 2) - w / 2, y0: (P ? P.sy : KY0() + KH() / 2) - h / 2, w, h };
  };
  AT.clamp = function (v) {
    v.w = Math.max(250, Math.min(KW() * 1.2, v.w));
    v.x0 = Math.max(KX0() - v.w * 0.4, Math.min(KX0() + KW() - v.w * 0.6, v.x0));
    v.y0 = Math.max(KY0() - v.h * 0.4, Math.min(KY0() + KH() - v.h * 0.6, v.y0));
    return v;
  };
  AT.paint = function () {
    const cv = typeof document !== 'undefined' && document.getElementById('jrmap'); if (!cv || !A.S || !A.S.prov) return;
    const box = cv.parentElement.getBoundingClientRect(), W = Math.max(280, Math.round(box.width)), H = Math.max(240, Math.round(box.height || W * 0.8));
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; if (UI.atV) UI.atV.h = UI.atV.w * H / W; }
    if (!AT.bound || AT.bound !== cv) AT.bind(cv);
    AT.draw(cv);
  };
  AT.draw = function (cv) {
    MAP.init();
    const ctx = cv.getContext('2d'), W = cv.width, H = cv.height, IM = UI.INKMAP, pc = A.pc(); if (!pc) return;
    const v = UI.atV && UI.atV.w ? UI.atV : (UI.atV = AT.fit(cv));
    v.h = v.w * H / W;
    if (IM && IM.redraws) IM.redraws.set(cv, () => AT.draw(cv));
    const zoom = ZREF() / v.w;
    if (IM) IM.zoomNow = zoom;
    try {
      if (!(MAP.ground && MAP.ground(ctx, W, H, v))) {
        ctx.fillStyle = '#1d3b57'; ctx.fillRect(0, 0, W, H);
        if (MAP.img && MAP.img.complete && MAP.img.naturalWidth) {
          if (MAP.big) MAP.relief(ctx, W, H, v);
          else { const iw = MAP.img.naturalWidth, ih = MAP.img.naturalHeight; ctx.drawImage(MAP.img, v.x0 / KW() * iw, v.y0 / KH() * ih, v.w / KW() * iw, v.h / KH() * ih, 0, 0, W, H); }
        }
      }
      const sx = (v.x0 - KX0()) / KW() * MAP.gw, sy = (v.y0 - KY0()) / KH() * MAP.gh, sw = v.w / KW() * MAP.gw, sh = v.h / KH() * MAP.gh;
      ctx.imageSmoothingEnabled = zoom > 1.4;
      ctx.drawImage(MAP.overlay('political', null, null), sx, sy, sw, sh, 0, 0, W, H);
      ctx.imageSmoothingEnabled = true;
      if (MAP.inkLines) MAP.inkLines(ctx, W, H, v);
      if (!(MAP.marks && MAP.marks(ctx, W, H, v, {}))) MAP.veil(ctx, W, H, v);
      AT.overlay(ctx, W, H, v, pc);
    } finally { if (IM) IM.zoomNow = 0; }
  };
  // your road, your home, your people, you (pure)
  AT.overlay = function (ctx, W, H, v, pc) {
    const X = P => (P.sx - v.x0) / v.w * W, Y = P => (P.sy - v.y0) / v.h * H;
    const J = A.JR, j = J && J.on(pc) ? pc.journey : null;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (j) {
      const pts = j.path.map(P_).filter(Boolean);
      const line = (from, to, dash, col, w) => { ctx.setLineDash(dash); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); for (let i = from; i <= to && i < pts.length; i++) { const x = X(pts[i]), y = Y(pts[i]); i === from ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); };
      const done = j.there ? pts.length - 1 : j.pi || 0;
      line(0, pts.length - 1, [], 'rgba(244,236,214,.85)', 6);
      line(done, pts.length - 1, [6, 6], 'rgba(150,40,26,.9)', 2.5);
      line(0, done, [], 'rgba(150,40,26,.95)', 3);
      ctx.setLineDash([]);
      for (const st of j.stops) { const P = P_(st.p); if (!P) continue; ctx.fillStyle = st.pi <= done ? 'rgba(150,40,26,.95)' : 'rgba(244,236,214,.95)'; ctx.strokeStyle = 'rgba(59,42,23,.9)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(X(P), Y(P), 3.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      const T = P_(j.to); if (T) { const x = X(T), y = Y(T); ctx.strokeStyle = '#3b2a17'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 16); ctx.stroke(); ctx.fillStyle = '#962a1a'; ctx.beginPath(); ctx.moveTo(x, y - 16); ctx.lineTo(x + 10, y - 12.5); ctx.lineTo(x, y - 9); ctx.closePath(); ctx.fill(); }
    }
    // your people: a dot where each of them lives, with how many
    const by = {};
    for (const x of AT.people(pc)) if (x.p.home !== pc.home) (by[x.p.home] = by[x.p.home] || []).push(x);
    ctx.font = 'bold 10px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const id in by) {
      const P = P_(+id); if (!P) continue; const x = X(P), y = Y(P); if (x < -10 || y < -10 || x > W + 10 || y > H + 10) continue;
      ctx.fillStyle = '#2f5d8a'; ctx.strokeStyle = 'rgba(244,236,214,.95)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillText(String(by[id].length), x, y + 0.5);
    }
    // home: a small house
    const Hm = P_(pc.home);
    if (Hm) { const x = X(Hm), y = Y(Hm); ctx.fillStyle = '#f4ecd6'; ctx.strokeStyle = '#3b2a17'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 6, y + 5); ctx.lineTo(x - 6, y - 1); ctx.lineTo(x, y - 7); ctx.lineTo(x + 6, y - 1); ctx.lineTo(x + 6, y + 5); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    // you
    const Me = P_(AT.where(pc));
    if (Me) { const x = X(Me), y = Y(Me); ctx.strokeStyle = 'rgba(244,236,214,.95)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = '#c8962e'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.stroke(); }
    // the clicked place
    const S = UI.atSel != null ? P_(UI.atSel) : null;
    if (S) { ctx.setLineDash([3, 3]); ctx.strokeStyle = '#3b2a17'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X(S), Y(S), 15, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    ctx.restore();
  };
  // drag, wheel and click on the story column's map (UI state only)
  AT.bind = function (cv) {
    AT.bound = cv;
    const toKm = ev => { const r = cv.getBoundingClientRect(), v = UI.atV; return [v.x0 + (ev.clientX - r.left) / r.width * v.w, v.y0 + (ev.clientY - r.top) / r.height * v.h]; };
    const provAt = ev => { const [kx, ky] = toKm(ev), gx = Math.floor((kx - KX0()) / KW() * MAP.gw), gy = Math.floor((ky - KY0()) / KH() * MAP.gh); return gx < 0 || gy < 0 || gx >= MAP.gw || gy >= MAP.gh ? -1 : MAP.grid[gy * MAP.gw + gx]; };
    let drag = null;
    cv.onpointerdown = ev => { drag = { x: ev.clientX, y: ev.clientY, moved: false }; try { cv.setPointerCapture(ev.pointerId); } catch (e) {} };
    cv.onpointermove = ev => {
      if (!drag || !UI.atV) return;
      const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y; if (!drag.moved && Math.hypot(dx, dy) < 4) return;
      drag.moved = true; const r = cv.getBoundingClientRect(), v = UI.atV;
      v.x0 -= dx / r.width * v.w; v.y0 -= dy / r.height * v.h; drag.x = ev.clientX; drag.y = ev.clientY; AT.clamp(v); AT.draw(cv);
    };
    cv.onpointerup = ev => {
      const was = drag; drag = null; if (!was || was.moved) return;
      const id = provAt(ev); if (id < 0) return;
      UI.atSel = id; const sd = document.getElementById('atSide'); if (sd) sd.innerHTML = AT.provCard(A.pc(), id); AT.draw(cv);
    };
    cv.onwheel = ev => {
      if (!UI.atV) return; ev.preventDefault();
      const f = ev.deltaY < 0 ? 1.25 : 0.8, [kx, ky] = toKm(ev), v = UI.atV, r = cv.getBoundingClientRect(), px = (ev.clientX - r.left) / r.width, py = (ev.clientY - r.top) / r.height;
      v.w /= f; v.h /= f; v.x0 = kx - v.w * px; v.y0 = ky - v.h * py; AT.clamp(v); AT.draw(cv);
    };
  };
  Object.assign(UI.A, {
    atView(v) {
      UI.storyView = v === 'map' ? 'map' : 'story';
      const lw = UI.$('#logwrap');
      if (lw) { lw.innerHTML = UI.renderLogWrap(); const lg = UI.$('#log'); if (lg) lg.scrollTop = lg.scrollHeight; } else UI.refreshTab();
    },
    atZoom(v) {
      const cv = UI.$('#jrmap'); if (!cv) return;
      if (v === 'me') UI.atV = AT.fit(cv);
      else { const f = +v || 1, vv = UI.atV || (UI.atV = AT.fit(cv)), cx = vv.x0 + vv.w / 2, cy = vv.y0 + vv.h / 2; vv.w /= f; vv.h /= f; vv.x0 = cx - vv.w / 2; vv.y0 = cy - vv.h / 2; AT.clamp(vv); }
      AT.draw(cv);
    },
    atShow(v) {
      const P = P_(+v); if (!P) return;
      UI.storyView = 'map'; UI.atSel = P.id;
      const cv0 = { width: 600, height: 520 }, w = 1400; UI.atV = { x0: P.sx - w / 2, y0: P.sy - w * 520 / 600 / 2, w, h: w * 520 / 600 }; void cv0;
      const lw = UI.$('#logwrap'); if (lw) lw.innerHTML = UI.renderLogWrap(); else { UI.setTab('story'); UI.refreshTab(); }
    },
    atFog() { UI.set.atlasFog = UI.set.atlasFog === false; try { UI.saveSettings && UI.saveSettings(); } catch (e) {} UI.refreshTab(); const cv = UI.$('#jrmap'); if (cv) AT.draw(cv); },
  });

  // ---- Places you know (Chronicle) -------------------------------------------------------------------------------------
  const chron = UI.GROUPS && UI.GROUPS.find(g => g.k === 'chronicle');
  if (chron && !chron.subs.some(s => s[0] === 'atlas')) chron.subs.splice(1, 0, ['atlas', 'Places']);
  UI.TAB.atlas = function (pc) {
    const c = AT.counts(pc), a = AT.ok(pc) ? pc.atlas : baseOf(pc), log = Array.isArray(pc.jrLog) ? pc.jrLog : [];
    let h = `<div class="card at-page"><h3 style="margin:0 0 4px">Places you know</h3>`;
    h += `<p class="small">Seen with your own eyes: <b>${c.seen}</b> places in ${c.realms} realm${c.realms === 1 ? '' : 's'}. Heard of: <b>${c.heard}</b>. Unknown: ${A.fmt(Math.max(0, c.total - c.seen - c.heard))} of ${A.fmt(c.total)}.</p>`;
    if (c.far > 0) h += `<p class="small muted">The farthest you have been from where you were born: ${A.fmt(c.far)} km.</p>`;
    h += `<div class="row"><button class="small" data-a="atView" data-v="map">Open the map</button><button class="small ghost" data-a="atFog" aria-pressed="${AT.fogOn()}">${AT.fogOn() ? 'Show the whole map' : 'Veil what you do not know'}</button></div></div>`;
    if (log.length) {
      h += `<div class="card"><div class="group-h">Roads you have walked</div><ul class="small at-roads">${log.slice().reverse().slice(0, 12).map(r => `<li>${r.y}: ${esc(A.provName(r.f))} to ${esc(A.provName(r.t))}, ${A.fmt(r.km)} km in ${r.d} days${r.k && r.k !== 'move' ? ' (' + esc((A.JR && A.JR.KINDS[r.k]) || r.k) + ')' : ''}</li>`).join('')}</ul></div>`;
    }
    // by realm: seen first, then heard of
    const by = {};
    for (const id in a.s) { const P = P_(+id); if (P) (by[P.owner || ''] = by[P.owner || ''] || { s: [], h: [] }).s.push(P); }
    for (const id in a.h) { const P = P_(+id); if (P && a.s[id] == null) (by[P.owner || ''] = by[P.owner || ''] || { s: [], h: [] }).h.push(P); }
    const W = A.WILDS, rows = Object.keys(by).sort((x, y) => (by[y].s.length - by[x].s.length) || (by[y].h.length - by[x].h.length) || (x < y ? -1 : 1));
    h += '<div class="card"><div class="group-h">By realm</div>';
    for (const rid of rows.slice(0, 40)) {
      const r = A.realm(rid), g = by[rid];
      const seen = g.s.sort((p, q) => (p.name < q.name ? -1 : 1)).map(P => {
        const ss = W ? W.sites(P).filter(s => W.found(pc, s.key)) : [];
        return `<button class="chip click at-chip" data-a="atShow" data-v="${P.id}">${esc(P.name)}${ss.length ? ' · ' + ss.length + ' wild place' + (ss.length > 1 ? 's' : '') : ''}</button>`;
      }).join(' ');
      const heard = g.h.sort((p, q) => (p.name < q.name ? -1 : 1)).slice(0, 30).map(P => `<button class="chip ghost click at-chip at-heard-c" data-a="atShow" data-v="${P.id}">${esc(P.name)}</button>`).join(' ');
      h += `<div class="at-realm"><div class="small"><b>${esc(r ? r.name : 'Unclaimed land')}</b> <span class="muted">${g.s.length} seen, ${g.h.length} heard of</span></div><div class="at-chips">${seen}${heard ? (seen ? ' ' : '') + heard : ''}${g.h.length > 30 ? ` <span class="tiny muted">and ${g.h.length - 30} more</span>` : ''}</div></div>`;
    }
    if (rows.length > 40) h += `<p class="tiny muted">And ${rows.length - 40} more realms you know a little of.</p>`;
    return h + '</div>';
  };

  // ---- style ---------------------------------------------------------------------------------------------------------
  if (typeof document !== 'undefined') {
    const st = document.createElement('style'); st.id = 'at-style';
    st.textContent = [
      '.at-bar{display:flex;align-items:center;gap:10px;padding:6px 10px 0;flex:none;min-width:0}',
      '.at-bar .seg button{min-height:28px;padding:0 12px}',
      '.jr-mode .primary{color:#1a140c}',
      '.at-sum{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}',
      '.at-map{position:relative;flex:1 1 auto;min-height:220px;margin:8px 8px 0;border-radius:var(--r-m,8px);overflow:hidden;border:1px solid var(--line,#444)}',
      '.at-map canvas{display:block;width:100%;height:100%;touch-action:none;cursor:grab}',
      '.at-map .mapzoom{position:absolute;right:8px;top:8px;left:auto;width:auto;display:flex;flex-direction:column;gap:4px}',
      '.at-map .mapzoom button{width:32px;min-width:32px;padding:0;justify-content:center}',
      '.at-legend{display:flex;flex-wrap:wrap;gap:4px 12px;align-items:center;padding:6px 10px;flex:none}',
      '.at-legend .at-n{margin-left:auto}',
      '.at-k{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:4px;vertical-align:-1px;border:1px solid rgba(59,42,23,.8)}',
      '.at-me{border:2px solid #c8962e;background:transparent}.at-home{background:#f4ecd6;border-radius:2px}.at-road{background:#962a1a;border-radius:1px;height:3px;width:14px;border:0;vertical-align:2px}',
      '.at-kin{background:#2f5d8a}.at-heard{background:rgba(229,218,190,.55)}.at-unk{background:rgba(229,218,190,.95)}',
      '.at-side{flex:none;max-height:32%;overflow:auto;padding:0 8px 8px}',
      '.at-side .at-card{margin:0}',
      '.at-realm{margin:6px 0}.at-chips{display:flex;flex-wrap:wrap;gap:4px;margin-top:3px}.at-chip{font-size:12px}',
      '.at-roads{margin:4px 0 0 16px;padding:0}',
      '#game.phone .phone-log .at-map{min-height:60vh}',
    ].join('\n');
    (document.head || document.documentElement).appendChild(st);
  }
})();
