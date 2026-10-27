// The world map redrawn in the chronicle's hand (Road to Ten, Visual art 3 and 4; docs/art/style-guide.md).
//   - the ground: vellum land, a ruled (hatched) sea, inked coasts with water lines offshore, mountain, hill, tree,
//     marsh, dune and grass glyphs, province bounds dotted and realm borders dashed in ink;
//   - the realms laid on as a thin wash, stronger in a ribbon along each border, the way old maps were coloured by hand;
//   - town icons (houses, towers, a church, a tent) once zoomed in, and every capital as a keep with a gold flag;
//   - armies and divisions as standards in their realm's colour with the ruling house's charge, once zoomed in.
//     The release's boxes stay when zoomed out, and always if the player turns banners off.
// The ground is cut into 256-pixel tiles per zoom level and cached; the tiles are thrown away when a border moves,
// and each canvas keeps its finished view with a margin, so a still or panning map costs one copy per frame.
// Everything here is the UI's: every glyph is placed by a hash of its lattice cell and level (never A.rand), and
// nothing writes to A.S. Settings live in UI.set (inkMap, banners), saved with the player's other settings.
(function () {
  const IM = UI.INKMAP = {};
  if (UI.set.inkMap == null) UI.set.inkMap = true;
  if (UI.set.banners == null) UI.set.banners = true;
  const INK = '#2b1d10', VEL = '#ece0c4', SHADE = '#d6c39b', VERM = '#9e2b1b', GOLD = '#b98a2a', LAPIS = '#2f4a7a', VERD = '#4d7456';
  const SEA = '#dcd2b4';                       // the sea is the same vellum, a shade darker under its ruling
  // The frame comes from MAP (99-far-lands sets MAP.KW, MAP.KH and MAP.ZREF; without it the world as written, 7,000 x
  // 4,500 km). Zoom is a scale: a view ZREF km wide is zoom 1, in any frame. Levels below 0 exist only in a frame larger
  // than the world as written, whose whole view is coarser than level 0.
  const TILE = 256, MAXL = 5, ZREF = MAP.ZREF || 7000, BASE = 1100 / ZREF;
  const KWf = () => MAP.KW || 7000, KHf = () => MAP.KH || 4500, KX0f = () => MAP.KX0 || 0, KY0f = () => MAP.KY0 || 0;   // the frame's top left in km
  const LMIN = () => MAP.big ? Math.min(0, Math.floor(Math.log2(ZREF / KWf()))) : 0;
  const wholeView = (W, H, v) => v || (MAP.whole ? MAP.whole(W, H) : null);   // null: the world stretched to the canvas
  IM.TOWN_ZOOM = 1.8;                          // town icons appear from this zoom (7000 / view width)
  IM.BANNER_ZOOM = 2.2;                        // standards replace the boxes from this zoom
  IM.bitmaps = true;                           // tiles as ImageBitmaps (see mkCanvas)
  IM.keepViews = true;                         // keep each canvas's view, with a margin, as one picture (see drawTiles)
  IM.budgetMs = 28;                            // tile drawing per frame before the rest is left to the next frame
  IM.on = () => !!UI.set.inkMap && typeof document !== 'undefined';
  MAP.inkOn = IM.on;
  IM.stats = { tiles: 0, tileMs: 0, deferred: 0 };

  // ---- small pure helpers
  const hash = (i, j, k) => {
    let h = Math.imul(i | 0, 374761393) ^ Math.imul(j | 0, 668265263) ^ Math.imul(k | 0, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  const hex = c => { const m = /^#?([0-9a-f]{6})$/i.exec(c || ''); if (!m) return [128, 128, 128]; const n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const mix = (a, b, t) => { const x = hex(a), y = hex(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const lum = c => { const [r, g, b] = hex(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : 0);

  // ---- geometry, built once from the map grid: coast loops, province bounds as smoothed polylines, distance fields
  let geo = null;
  function buildGeo() {
    MAP.init();
    const { gw, gh, grid } = MAP;
    if (geo && geo.grid === grid) return geo;
    const t0 = now();
    const cell = (x, y) => (x < 0 || y < 0 || x >= gw || y >= gh) ? -1 : grid[y * gw + x];
    const groups = new Map();
    const add = (k, x1, y1, x2, y2) => { let g = groups.get(k); if (!g) groups.set(k, g = []); g.push(x1, y1, x2, y2); };
    const keyOf = (a, b) => (a < 0 || b < 0) ? 'c' : a < b ? a * 65536 + b : b * 65536 + a;   // any Int16 province id
    for (let y = 0; y < gh; y++) for (let x = 0; x <= gw; x++) { const a = cell(x - 1, y), b = cell(x, y); if (a !== b) add(keyOf(a, b), x, y, x, y + 1); }
    for (let y = 0; y <= gh; y++) for (let x = 0; x < gw; x++) { const a = cell(x, y - 1), b = cell(x, y); if (a !== b) add(keyOf(a, b), x, y, x + 1, y); }
    const VW = gw + 1;
    // link the unit edges of one group into chains of lattice vertices
    const chains = (E, coast) => {
      const n = E.length / 4, adj = new Map(), used = new Uint8Array(n), out = [];
      const put = (x, y, i) => { const k = y * VW + x; let l = adj.get(k); if (!l) adj.set(k, l = []); l.push(i); };
      for (let i = 0; i < n; i++) { put(E[4 * i], E[4 * i + 1], i); put(E[4 * i + 2], E[4 * i + 3], i); }
      const walk = (e0, sx, sy) => {
        const pts = [sx, sy]; let cx = sx, cy = sy, e = e0;
        while (e >= 0) {
          used[e] = 1;
          const x1 = E[4 * e], y1 = E[4 * e + 1], x2 = E[4 * e + 2], y2 = E[4 * e + 3];
          if (x1 === cx && y1 === cy) { cx = x2; cy = y2; } else { cx = x1; cy = y1; }
          pts.push(cx, cy);
          const l = adj.get(cy * VW + cx); e = -1;
          if (coast || l.length === 2) for (const j of l) if (!used[j]) { e = j; break; }
        }
        return pts;
      };
      if (!coast) for (const [k, l] of adj) if (l.length !== 2) for (const e of l) if (!used[e]) out.push(walk(e, k % VW, Math.floor(k / VW)));
      for (let e = 0; e < n; e++) if (!used[e]) out.push(walk(e, E[4 * e], E[4 * e + 1]));
      return out;
    };
    // a staircase of cell edges becomes the line through its edge midpoints, then two rounds of corner cutting
    const smooth = (v, closed, iters) => {
      const n = v.length / 2 - 1; let a = [];
      if (!closed) a.push(v[0], v[1]);
      for (let i = 0; i < n; i++) a.push((v[2 * i] + v[2 * i + 2]) / 2, (v[2 * i + 1] + v[2 * i + 3]) / 2);
      if (!closed) a.push(v[2 * n], v[2 * n + 1]);
      for (let k = 0; k < 4; k++) {   // relax the wobble a staircase leaves (endpoints of open lines stay put)
        const m = a.length / 2, o = a.slice();
        for (let i = closed ? 0 : 1; i < (closed ? m : m - 1); i++) {
          const h = (i + m - 1) % m, q = (i + 1) % m;
          o[2 * i] = 0.25 * a[2 * h] + 0.5 * a[2 * i] + 0.25 * a[2 * q]; o[2 * i + 1] = 0.25 * a[2 * h + 1] + 0.5 * a[2 * i + 1] + 0.25 * a[2 * q + 1];
        }
        a = o;
      }
      const b = [a[0], a[1]];          // drop points that add nothing to the line
      for (let i = 2; i < a.length - 2; i += 2) {
        const ax = b[b.length - 2], ay = b[b.length - 1], cx = a[i + 2], cy = a[i + 3], dx = cx - ax, dy = cy - ay, L = Math.hypot(dx, dy) || 1;
        if (Math.abs((a[i] - ax) * dy - (a[i + 1] - ay) * dx) / L > 0.035 || L > 6) b.push(a[i], a[i + 1]);
      }
      b.push(a[a.length - 2], a[a.length - 1]); a = b;
      for (let k = 0; k < iters; k++) {
        const m = a.length / 2, o = [];
        if (!closed) o.push(a[0], a[1]);
        const segs = closed ? m : m - 1;
        for (let i = 0; i < segs; i++) {
          const j = (i + 1) % m, x0 = a[2 * i], y0 = a[2 * i + 1], x1 = a[2 * j], y1 = a[2 * j + 1];
          o.push(0.75 * x0 + 0.25 * x1, 0.75 * y0 + 0.25 * y1, 0.25 * x0 + 0.75 * x1, 0.25 * y0 + 0.75 * y1);
        }
        if (!closed) o.push(a[2 * m - 2], a[2 * m - 1]);
        a = o;
      }
      if (closed) a.push(a[0], a[1]);
      const sc = KWf() / gw, X0 = KX0f(), Y0 = KY0f();      // lattice units to the map's km coordinates
      return Float32Array.from(a, (x, k) => x * sc + (k & 1 ? Y0 : X0));
    };
    const bbox = a => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < a.length; i += 2) { if (a[i] < x0) x0 = a[i]; if (a[i] > x1) x1 = a[i]; if (a[i + 1] < y0) y0 = a[i + 1]; if (a[i + 1] > y1) y1 = a[i + 1]; } return { x0, y0, x1, y1 }; };
    const pieces = (a, info, out) => {    // cut long lines into short pieces, so a tile strokes only what it shows
      const P = 48;
      for (let s = 0; s < a.length / 2 - 1; s += P - 1) {
        const pts = a.subarray(2 * s, Math.min(a.length, 2 * (s + P)));
        out.push(Object.assign({ pts }, bbox(pts), info));
      }
    };
    const coastLoops = [], coastPieces = [], provPieces = [];
    for (const [k, E] of groups) {
      if (k === 'c') { for (const ch of chains(E, true)) { const closed = ch[0] === ch[ch.length - 2] && ch[1] === ch[ch.length - 1]; const a = smooth(ch, closed, 1); coastLoops.push(Object.assign({ pts: a }, bbox(a))); pieces(a, {}, coastPieces); } }
      else { const pa = Math.floor(k / 65536), pb = k % 65536; for (const ch of chains(E, false)) { const closed = ch[0] === ch[ch.length - 2] && ch[1] === ch[ch.length - 1]; pieces(smooth(ch, closed, 1), { a: pa, b: pb }, provPieces); } }
    }
    // distance (in cells, capped) from each land cell to the water and from each water cell to the land
    const dist = (isSrc, cap) => {
      const d = new Uint8Array(gw * gh).fill(cap), q = [];
      for (let i = 0; i < gw * gh; i++) if (isSrc(grid[i])) { d[i] = 0; q.push(i); }
      for (let h = 0; h < q.length; h++) {
        const i = q[h], x = i % gw, nd = d[i] + 1; if (nd >= cap) continue;
        const nb = [x > 0 ? i - 1 : -1, x < gw - 1 ? i + 1 : -1, i - gw, i + gw];
        for (const j of nb) if (j >= 0 && j < gw * gh && d[j] > nd) { d[j] = nd; q.push(j); }
      }
      return d;
    };
    geo = { grid, gw, gh, coastLoops, coastPieces, provPieces, toWater: dist(v => v < 0, 8), toLand: dist(v => v >= 0, 14), ms: now() - t0 };
    return geo;
  }
  IM.geo = buildGeo;

  // ---- what the tiles depend on: who owns what (borders) and the land's kind (glyphs)
  let worldKeyCache = null;
  IM.worldKey = function () {
    const S = A.S; if (!S || !S.prov) return '';
    const own = S.prov.map(p => p.owner).join(',');
    if (!worldKeyCache || worldKeyCache.prov !== S.prov) worldKeyCache = { prov: S.prov, terr: S.prov.map(p => p.terr + (p.biome || '')).join('|').length + ':' + S.prov.length };
    return own + '#' + worldKeyCache.terr;
  };

  // ---- glyphs: which mark each kind of land gets, and how often
  const GLYPH = {
    mountains: { k: 'mtn', p: 0.92 }, hills: { k: 'hill', p: 0.5 }, forest: { k: 'tree', p: 0.8 }, marsh: { k: 'marsh', p: 0.55 },
    desert: { k: 'dune', p: 0.3 }, steppe: { k: 'grass', p: 0.2 }, tundra: { k: 'tuft', p: 0.16 }, plains: { k: 'field', p: 0.07 },
  };
  const glyphOf = p => {
    const b = p.biome || '';
    if (/Glacier|Lake/.test(b)) return null;
    if (/Salt/.test(b)) return { k: 'dot', p: 0.25 };
    if (p.terr === 'forest' && /Taiga|Tundra|Alpine/.test(b)) return { k: 'pine', p: 0.82 };
    if (p.terr === 'hills' && /Alpine/.test(b)) return { k: 'mtn', p: 0.45, small: true };
    if (p.terr === 'hills' && /forest|rainforest/i.test(b)) return { k: 'hill', p: 0.5, trees: true };
    return GLYPH[p.terr] || null;
  };
  const glyphPx = L => 11 * Math.pow(1.22, L);
  function glyphsIn(L, x0, y0, x1, y1) {
    const g = buildGeo(), S = A.S, lp = BASE * Math.pow(2, L), z = glyphPx(L), s = 1.3 * z / lp, out = [];
    const marg = 2 * z / lp, cr = 13 / lp;
    for (let j = Math.floor((y0 - marg) / s); j <= Math.ceil((y1 + marg) / s); j++) for (let i = Math.floor((x0 - marg) / s); i <= Math.ceil((x1 + marg) / s); i++) {
      const wx = (i + hash(i, j, L * 8 + 1)) * s, wy = (j + hash(i, j, L * 8 + 2)) * s;
      const cx = Math.floor((wx - KX0f()) / 10), cy = Math.floor((wy - KY0f()) / 10);
      if (cx < 0 || cy < 0 || cx >= g.gw || cy >= g.gh) continue;
      const ci = cy * g.gw + cx, pv = g.grid[ci];
      if (pv < 0) { // the open sea now and then carries a wave mark
        if (L >= 1 && g.toLand[ci] >= 9 && hash(i, j, L * 8 + 3) < 0.12) out.push({ x: wx, y: wy, k: 'wave', r: hash(i, j, L * 8 + 4) });
        continue;
      }
      if (g.toWater[ci] < 2) continue;
      const p = S.prov[pv]; if (!p) continue;
      const gl = glyphOf(p); if (!gl || hash(i, j, L * 8 + 3) > gl.p) continue;
      const dx = wx - p.sx, dy = wy - p.sy; if (dx * dx + dy * dy < cr * cr * 4) continue;   // leave room for the town
      let k = gl.k; if (gl.trees && hash(i, j, L * 8 + 5) < 0.4) k = 'tree';
      out.push({ x: wx, y: wy, k, r: hash(i, j, L * 8 + 4), small: gl.small, elev: p.elev || 0 });
    }
    out.sort((a, b) => a.y - b.y);
    return out;
  }

  // draw one glyph at (X, Y): the foot of the mark, in tile pixels; z is its size
  function glyph(c, gl, X, Y, z, lw) {
    const r = gl.r;
    c.lineWidth = lw; c.strokeStyle = INK; c.fillStyle = VEL;
    switch (gl.k) {
      case 'mtn': {
        const big = gl.small ? 0.75 : 1 + clamp((gl.elev - 1500) / 4000, 0, 0.35);
        const peak = (x, y, w, h) => {
          const off = (r - 0.5) * 0.25 * w, px = x + off, py = y - h;
          c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(px - w * 0.08, py + h * 0.12); c.lineTo(px, py); c.lineTo(x + w / 2, y);
          c.fill(); c.stroke();
          c.beginPath();       // the shadow side, hatched
          const n = 4;
          for (let t = 1; t <= n; t++) {
            const f = t / (n + 0.6), sx = px + (x + w / 2 - px) * f, sy = py + (y - py) * f;
            c.moveTo(sx, sy); c.lineTo(px + (sx - px) * 0.25, y);
          }
          c.lineWidth = lw * 0.7; c.stroke(); c.lineWidth = lw;
        };
        if (r > 0.55) peak(X - z * 0.45 * big, Y - z * 0.12, z * 0.9 * big, z * 0.75 * big);
        peak(X, Y, z * 1.25 * big, z * (0.85 + 0.35 * r) * big);
        break;
      }
      case 'hill': {
        const w = z * (0.95 + 0.3 * r), h = z * 0.42;
        c.beginPath(); c.moveTo(X - w / 2, Y); c.quadraticCurveTo(X - w * 0.05, Y - h * 2, X + w / 2, Y); c.fill(); c.stroke();
        c.beginPath(); for (let t = 0; t < 3; t++) { const sx = X + w * (0.08 + t * 0.12); c.moveTo(sx, Y - h * (0.75 - t * 0.2)); c.lineTo(sx - w * 0.06, Y - 0.5); }
        c.lineWidth = lw * 0.7; c.stroke(); c.lineWidth = lw;
        break;
      }
      case 'tree': {
        const R = z * (0.27 + 0.08 * r), cy = Y - z * 0.5;
        c.beginPath(); c.moveTo(X, Y); c.lineTo(X, cy); c.stroke();
        c.beginPath(); c.arc(X - R * 0.35, cy, R * 0.75, Math.PI * 0.5, Math.PI * 1.6); c.arc(X + R * 0.1, cy - R * 0.45, R * 0.7, Math.PI * 1.05, Math.PI * 2); c.arc(X + R * 0.4, cy + R * 0.1, R * 0.7, Math.PI * 1.5, Math.PI * 0.6); c.closePath(); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(X + R * 0.35, cy - R * 0.25); c.lineTo(X + R * 0.65, cy + R * 0.3); c.moveTo(X + R * 0.1, cy + R * 0.05); c.lineTo(X + R * 0.4, cy + R * 0.55);
        c.lineWidth = lw * 0.6; c.stroke(); c.lineWidth = lw;
        break;
      }
      case 'pine': {
        const h = z * (0.85 + 0.25 * r), w = z * 0.42;
        c.beginPath(); c.moveTo(X, Y); c.lineTo(X, Y - h * 0.2); c.stroke();
        c.beginPath(); c.moveTo(X - w / 2, Y - h * 0.2); c.lineTo(X, Y - h); c.lineTo(X + w / 2, Y - h * 0.2); c.closePath(); c.fill(); c.stroke();
        c.beginPath(); for (let t = 1; t <= 3; t++) { const yy = Y - h * 0.2 - t * h * 0.18; c.moveTo(X, yy); c.lineTo(X + w / 2 * (1 - t * 0.22), yy + h * 0.06); }
        c.lineWidth = lw * 0.6; c.stroke(); c.lineWidth = lw;
        break;
      }
      case 'marsh': {
        c.beginPath();
        c.moveTo(X - z * 0.5, Y); c.lineTo(X + z * 0.5, Y); c.moveTo(X - z * 0.3, Y + z * 0.2); c.lineTo(X + z * 0.25, Y + z * 0.2);
        for (let t = -1; t <= 1; t++) { c.moveTo(X + t * z * 0.12, Y - 0.5); c.lineTo(X + t * z * 0.2, Y - z * (0.45 - Math.abs(t) * 0.12)); }
        c.lineWidth = lw * 0.8; c.stroke(); c.lineWidth = lw;
        break;
      }
      case 'dune': {
        c.beginPath(); c.moveTo(X - z * 0.5, Y); c.quadraticCurveTo(X - z * 0.1, Y - z * 0.35, X + z * 0.5, Y);
        c.lineWidth = lw * 0.8; c.stroke(); c.lineWidth = lw;
        c.fillStyle = INK; for (let t = 0; t < 3; t++) c.fillRect(X + (hash(t, r * 1e6, 7) - 0.5) * z, Y + 1 + hash(t, r * 1e6, 8) * z * 0.3, lw * 0.9, lw * 0.9);
        break;
      }
      case 'grass': case 'tuft': {
        const s = gl.k === 'tuft' ? 0.7 : 1;
        c.beginPath(); for (let t = -1; t <= 1; t++) { c.moveTo(X + t * z * 0.08 * s, Y); c.lineTo(X + t * z * 0.22 * s, Y - z * 0.35 * s * (t ? 0.8 : 1)); }
        c.lineWidth = lw * 0.7; c.stroke(); c.lineWidth = lw;
        break;
      }
      case 'field': {
        c.beginPath(); for (let t = 0; t < 3; t++) { c.moveTo(X - z * 0.35, Y - t * z * 0.14); c.lineTo(X + z * 0.35, Y - t * z * 0.14 - z * 0.08); }
        c.strokeStyle = 'rgba(43,29,16,.55)'; c.lineWidth = lw * 0.6; c.stroke(); c.strokeStyle = INK; c.lineWidth = lw;
        break;
      }
      case 'dot': {
        c.fillStyle = INK; for (let t = 0; t < 4; t++) c.fillRect(X + (hash(t, r * 1e6, 9) - 0.5) * z, Y - hash(t, r * 1e6, 10) * z * 0.4, lw * 0.8, lw * 0.8);
        break;
      }
      case 'wave': {
        c.beginPath(); c.moveTo(X - z * 0.4, Y); c.quadraticCurveTo(X - z * 0.2, Y - z * 0.2, X, Y); c.quadraticCurveTo(X + z * 0.2, Y - z * 0.2, X + z * 0.4, Y);
        c.strokeStyle = 'rgba(43,29,16,.6)'; c.lineWidth = lw * 0.7; c.stroke(); c.strokeStyle = INK; c.lineWidth = lw;
        break;
      }
    }
  }

  // ---- the paper: a fixed grain, and foxing anchored to the world so it stays put as you zoom
  let grainCv = null;
  const grain = () => {
    if (grainCv) return grainCv;
    grainCv = document.createElement('canvas'); grainCv.width = grainCv.height = TILE;
    const c = grainCv.getContext('2d');
    for (let i = 0; i < 2600; i++) {
      const x = hash(i, 1, 77) * TILE, y = hash(i, 2, 77) * TILE, a = 0.05 + hash(i, 3, 77) * 0.1;
      c.fillStyle = `rgba(90,62,30,${a.toFixed(3)})`; c.fillRect(x, y, 1, 1);
    }
    for (let i = 0; i < 90; i++) {       // short fibres
      const x = hash(i, 4, 78) * TILE, y = hash(i, 5, 78) * TILE, a = hash(i, 6, 78) * Math.PI, l = 2 + hash(i, 7, 78) * 5;
      c.strokeStyle = 'rgba(110,80,40,.12)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke();
    }
    return grainCv;
  };
  function foxing(c, x0, y0, x1, y1, lp) {
    const F = 1100;
    for (let j = Math.floor(y0 / F) - 1; j <= Math.floor(y1 / F) + 1; j++) for (let i = Math.floor(x0 / F) - 1; i <= Math.floor(x1 / F) + 1; i++) {
      if (hash(i, j, 91) > 0.55) continue;
      const cx = (i + hash(i, j, 92)) * F, cy = (j + hash(i, j, 93)) * F, R = 90 + hash(i, j, 94) * 260;
      if (cx + R < x0 || cx - R > x1 || cy + R < y0 || cy - R > y1) continue;
      const X = (cx - x0) * lp, Y = (cy - y0) * lp, RR = R * lp;
      const gr = c.createRadialGradient(X, Y, RR * 0.1, X, Y, RR);
      gr.addColorStop(0, 'rgba(160,112,52,.13)'); gr.addColorStop(0.7, 'rgba(160,112,52,.06)'); gr.addColorStop(1, 'rgba(160,112,52,0)');
      c.fillStyle = gr; c.beginPath(); c.arc(X, Y, RR, 0, Math.PI * 2); c.fill();
      for (let k = 0; k < 14; k++) {     // the darker specks of a fox mark
        const a = hash(i * 31 + k, j, 95) * Math.PI * 2, d = Math.sqrt(hash(i, j * 31 + k, 96)) * RR * 0.8;
        c.fillStyle = 'rgba(120,80,35,.22)'; c.fillRect(X + Math.cos(a) * d, Y + Math.sin(a) * d, 1.2, 1.2);
      }
    }
  }

  // ---- one tile at level L: the ground (sea, coast, land, glyphs, paper) and, apart, its lines (borders), which
  // are laid over the realms' wash so the wash never greys them
  const opaque = (a) => mix(SEA, INK, a);
  // Tiles are drawn on an OffscreenCanvas and frozen into an ImageBitmap where the browser has them: a bitmap stays
  // on the graphics card, so copying it each frame is cheap.
  const mkCanvas = n => { if (typeof OffscreenCanvas === 'function' && IM.bitmaps) return new OffscreenCanvas(n, n); const c = document.createElement('canvas'); c.width = c.height = n; return c; };
  const frozen = c => (c.transferToImageBitmap ? c.transferToImageBitmap() : c);
  function renderTile(L, tx, ty) {
    const t0 = now(), g = buildGeo(), S = A.S;
    const lp = BASE * Math.pow(2, L), tw = TILE / lp, x0 = tx * tw, y0 = ty * tw, x1 = x0 + tw, y1 = y0 + tw;
    const cv = mkCanvas(TILE);
    const c = cv.getContext('2d');
    const up = Math.pow(1.13, L);         // lines thicken a little as the map grows
    c.fillStyle = SEA; c.fillRect(0, 0, TILE, TILE);
    // the sea is ruled, like the woodcut sky
    c.strokeStyle = opaque(0.3); c.lineWidth = 0.8; c.beginPath();
    for (let y = 2; y < TILE; y += 5) { c.moveTo(0, y + 0.5); c.lineTo(TILE, y + 0.5); }
    c.stroke();
    c.setTransform(lp, 0, 0, lp, -x0 * lp, -y0 * lp);
    c.lineJoin = 'round'; c.lineCap = 'round';
    const R3 = 12 * up, m = (R3 + 4) / lp;
    const hit = o => !(o.x1 < x0 - m || o.x0 > x1 + m || o.y1 < y0 - m || o.y0 > y1 + m);
    const pathOf = list => { const P = new Path2D(); for (const o of list) { const a = o.pts; P.moveTo(a[0], a[1]); for (let i = 2; i < a.length; i += 2) P.lineTo(a[i], a[i + 1]); } return P; };
    const coast = g.coastPieces.filter(hit);
    if (coast.length) {
      const CP = pathOf(coast);
      // clear the ruling near the shore, then the water lines: each wide ink stroke is cut back by a narrower paper one
      c.strokeStyle = SEA; c.lineWidth = 2 * (R3 + 3) / lp; c.stroke(CP);
      const rings = [[R3, 0.42, 0.75], [7.5 * up, 0.6, 0.85], [3.8 * up, 0.78, 0.95]];
      for (const [r, a, w] of rings) {
        c.strokeStyle = opaque(a); c.lineWidth = (2 * r + w) / lp; c.stroke(CP);
        c.strokeStyle = SEA; c.lineWidth = (2 * r - w) / lp; c.stroke(CP);
      }
    }
    // the land
    const loops = g.coastLoops.filter(o => !(o.x1 < x0 || o.x0 > x1 || o.y1 < y0 || o.y0 > y1));
    let LP = null;
    if (loops.length) { LP = new Path2D(); for (const o of loops) { const a = o.pts; LP.moveTo(a[0], a[1]); for (let i = 2; i < a.length; i += 2) LP.lineTo(a[i], a[i + 1]); LP.closePath(); } c.fillStyle = VEL; c.fill(LP, 'evenodd'); }
    if (coast.length) { c.strokeStyle = INK; c.lineWidth = 1.6 * up / lp; c.stroke(pathOf(coast)); }
    // glyphs, in tile pixels
    c.setTransform(1, 0, 0, 1, 0, 0);
    const z = glyphPx(L), lw = 1.05 * Math.pow(1.1, L);
    for (const gl of glyphsIn(L, x0, y0, x1, y1)) glyph(c, gl, (gl.x - x0) * lp, (gl.y - y0) * lp, gl.k === 'wave' ? z * 0.8 : z, lw);
    // the paper
    foxing(c, x0, y0, x1, y1, lp);
    c.globalCompositeOperation = 'multiply'; c.drawImage(grain(), 0, 0); c.globalCompositeOperation = 'source-over';
    // the lines: province bounds dotted, realm borders dashed on a thin paper halo, kept to the land
    let lv = null;
    const prov = LP ? g.provPieces.filter(hit) : [];
    if (prov.length) {
      lv = mkCanvas(TILE);
      const b = lv.getContext('2d'); b.setTransform(lp, 0, 0, lp, -x0 * lp, -y0 * lp); b.lineJoin = 'round'; b.lineCap = 'round';
      b.clip(LP, 'evenodd');
      const inner = [], outer = [];
      for (const o of prov) { const pa = S.prov[o.a], pb = S.prov[o.b]; ((pa && pb && pa.owner === pb.owner) ? inner : outer).push(o); }
      if (inner.length && L >= 0) { b.setLineDash([1.1 * up / lp, 2.9 * up / lp]); b.strokeStyle = 'rgba(43,29,16,.55)'; b.lineWidth = 0.85 * up / lp; b.stroke(pathOf(inner)); }
      if (outer.length) {
        const OP = pathOf(outer);
        b.setLineDash([]); b.strokeStyle = 'rgba(236,224,196,.75)'; b.lineWidth = 3.4 * up / lp; b.stroke(OP);
        b.setLineDash([6 * up / lp, 2.8 * up / lp]); b.strokeStyle = INK; b.lineWidth = 1.45 * up / lp; b.stroke(OP);
      }
    }
    IM.stats.tiles++; IM.stats.tileMs += now() - t0;
    return { g: frozen(cv), b: lv && frozen(lv) };
  }

  // ---- the tile cache: keyed by level and position, flushed when the borders or the land change
  const cache = new Map(); let cacheKey = '', gen = 0;
  const LIMIT = 150;
  IM.reset = function () { cache.clear(); cacheKey = ''; gen++; views = new WeakMap(); MAP.overlayCache = null; if (UI.wrOvCache) UI.wrOvCache = null; };
  const getTile = (L, tx, ty, make) => {
    const k = L + ':' + tx + ':' + ty; let t = cache.get(k);
    if (t) { cache.delete(k); cache.set(k, t); return t; }
    if (!make) return null;
    t = renderTile(L, tx, ty); cache.set(k, t);
    if (cache.size > LIMIT) cache.delete(cache.keys().next().value);
    return t;
  };
  IM.cacheSize = () => cache.size;

  // redraw a canvas whose tiles were left for the next frame (set by the wrappers below)
  IM.redraws = new WeakMap();
  const pending = new Set();
  const later = cv => {
    if (pending.has(cv)) return; pending.add(cv);
    const go = () => { pending.delete(cv); const f = IM.redraws.get(cv); if (f && cv.isConnected) f(); };
    (typeof requestAnimationFrame === 'function') ? requestAnimationFrame(go) : setTimeout(go, 16);
  };
  IM.pending = () => pending.size;

  // Draw one layer of the tiles that cover view v. Tiles not yet drawn wait for the next frame (past a time budget),
  // and meanwhile the coarsest level stands in for them. Each canvas keeps its view, with a margin, as one picture
  // per layer: a map that stands still or pans a little costs one copy per frame, and the tiles are laid again only
  // when the scale changes or the view leaves the margin.
  let views = new WeakMap(); const PAD = 256;
  function drawTiles(ctx, W, H, v, layer, extra, extraKey) {
    const wk = IM.worldKey(); if (wk !== cacheKey) { cache.clear(); cacheKey = wk; gen++; }
    const vx = v ? v.x0 : 0, vy = v ? v.y0 : 0, vw = v ? v.w : KWf(), vh = v ? v.h : KHf(), sx = W / vw, sy = H / vh;
    const cvs = ctx.canvas, out = { vx, vy, sx, sy, zoom: ZREF / vw };
    if (typeof document === 'undefined' || !IM.keepViews || !cvs) {
      const res = drawTilesTo(ctx, W, H, vx, vy, vw, vh, layer);
      res.zoom = out.zoom; if (extra) extra(ctx, res);
      if (res.late && cvs) later(cvs);
      return out;
    }
    const key = [sx, sy, W, H, gen, extraKey || ''].join(',');
    let vc = views.get(cvs); if (!vc) views.set(cvs, vc = {});
    let kept = vc[layer];
    const fits = k => { if (!k || k.key !== key) return null; const ox = Math.round((vx - k.kx) * sx), oy = Math.round((vy - k.ky) * sy); return ox >= 0 && oy >= 0 && ox + W <= k.cv.width && oy + H <= k.cv.height ? [ox, oy] : null; };
    let at = fits(kept);
    // while the scale changes (a wheel turning), lay just the view; the margin is laid once the scale holds
    if (!at && kept && kept.sx !== sx) {
      const res = drawTilesTo(ctx, W, H, vx, vy, vw, vh, layer);
      res.zoom = out.zoom; if (extra) extra(ctx, res);
      kept.sx = sx; kept.key = '';
      if (res.late) later(cvs);
      return out;
    }
    if (!at) {
      const KWd = W + 2 * PAD, KHd = H + 2 * PAD, kx = vx - PAD / sx, ky = vy - PAD / sy;
      const k = kept && kept.cv.width === KWd && kept.cv.height === KHd ? kept.cv : document.createElement('canvas');
      if (k.width !== KWd) k.width = KWd; if (k.height !== KHd) k.height = KHd;
      const kc = k.getContext('2d'); kc.clearRect(0, 0, KWd, KHd);
      const res = drawTilesTo(kc, KWd, KHd, kx, ky, KWd / sx, KHd / sy, layer);
      res.zoom = out.zoom; if (extra) extra(kc, res);
      vc[layer] = kept = { key: res.late ? '' : key, kx, ky, sx, cv: k };
      if (res.late) later(cvs);
      at = [Math.round((vx - kx) * sx), Math.round((vy - ky) * sy)];
    }
    ctx.drawImage(kept.cv, at[0], at[1], W, H, 0, 0, W, H);
    return out;
  }
  function drawTilesTo(ctx, W, H, vx, vy, vw, vh, layer) {
    const sx = W / vw, sy = H / vh, ppu = Math.max(sx, sy), L0 = LMIN();
    const L = clamp(Math.ceil(Math.log2(ppu / BASE) - 0.25), L0, MAXL), lp = BASE * Math.pow(2, L), tw = TILE / lp;
    ctx.save();
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'low';
    const t0 = now(); let late = false;
    const tx0 = Math.max(Math.floor(KX0f() / tw), Math.floor(vx / tw)), tx1 = Math.min(Math.ceil((KX0f() + KWf()) / tw) - 1, Math.floor((vx + vw) / tw));
    const ty0 = Math.max(Math.floor(KY0f() / tw), Math.floor(vy / tw)), ty1 = Math.min(Math.ceil((KY0f() + KHf()) / tw) - 1, Math.floor((vy + vh) / tw));
    const X = wx => Math.round((wx - vx) * sx), Y = wy => Math.round((wy - vy) * sy);
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const dx = X(tx * tw), dy = Y(ty * tw), dw = X((tx + 1) * tw) - dx, dh = Y((ty + 1) * tw) - dy;
      let t = getTile(L, tx, ty, false);
      if (!t && (now() - t0 < IM.budgetMs || L <= L0)) t = getTile(L, tx, ty, true);
      if (t) { if (t[layer]) ctx.drawImage(t[layer], dx, dy, dw, dh); continue; }
      late = true; IM.stats.deferred++;
      const f = Math.pow(2, L - L0), px = Math.floor(tx / f), py = Math.floor(ty / f), pt = getTile(L0, px, py, true), s = TILE / f;
      if (pt[layer]) ctx.drawImage(pt[layer], (tx - px * f) * s, (ty - py * f) * s, s, s, dx, dy, dw, dh);
    }
    ctx.restore();
    return { vx, vy, sx, sy, W, H, zoom: ZREF / vw, late };
  }

  // ---- the ground hook (patches IM-GROUND-*): the inked map under view v (null: the whole world)
  MAP.ground = function (ctx, W, H, v) {
    if (!IM.on() || !A.S || !A.S.prov || !A.S.prov.length) return false;
    try {
      buildGeo();
      ctx.save(); ctx.fillStyle = SEA; ctx.fillRect(0, 0, W, H); ctx.restore();
      drawTiles(ctx, W, H, wholeView(W, H, v), 'g');
      return true;
    } catch (e) { if (typeof console !== 'undefined') console.error(e); return false; }
  };
  // ---- the lines hook (patch IM-LINES): borders, towns and keeps, over the realms' wash
  MAP.inkLines = function (ctx, W, H, v) {
    if (!IM.on() || !A.S || !A.S.prov || !A.S.prov.length) return false;
    try {
      // the towns are kept with the view; they change only when a capital moves or the display is resized
      const K = iconK(ctx, W, !v || !!v.whole), tk = K.toFixed(2) + ':' + Object.values(A.S.realms).map(r => r.alive ? r.capitalProv : '').join(',');
      drawTiles(ctx, W, H, wholeView(W, H, v), 'b', (c, d) => IM.towns(c, d.W, d.H, d.vx, d.vy, d.sx, d.sy, d.zoom, K), tk);
      try { IM.selGlow(ctx, W, H, wholeView(W, H, v)); } catch (e) {}
      try { IM.moveArrows(ctx, W, H, wholeView(W, H, v)); } catch (e) {}
      return true;
    } catch (e) { if (typeof console !== 'undefined') console.error(e); return false; }
  };

  // ---- the selected realm (brief 7.3: realm.glow): on the full map, the realm of the province clicked (UI.mapHl) has
  // its border drawn over in its own colour at 30%, wide and soft. Drawn each frame, not kept in a tile.
  IM.selGlow = function (ctx, W, H, v) {
    const id = UI.mapHl, cv = ctx.canvas; if (!id || !cv || cv.id !== 'gmap' || !A.S) return 0;
    const r = A.S.realms[id]; if (!r) return 0;
    const hex = UI.realmHex ? UI.realmHex(r) : r.color; if (!/^#[0-9a-f]{6}$/i.test(hex || '')) return 0;
    const g = buildGeo(), S = A.S, vx = v ? v.x0 : 0, vy = v ? v.y0 : 0, vw = v ? v.w : KWf(), vh = v ? v.h : KHf(), C = MAP.cell;
    const x0 = vx, y0 = vy, x1 = vx + vw, y1 = vy + vh, sx = W / vw, sy = H / vh;   // the traced lines are in km
    const path = new Path2D(); let n = 0;
    for (const o of g.provPieces) {
      if (o.x1 < x0 || o.x0 > x1 || o.y1 < y0 || o.y0 > y1) continue;
      const pa = S.prov[o.a], pb = S.prov[o.b]; if (!pa || !pb || (pa.owner === id) === (pb.owner === id)) continue;
      const a = o.pts; path.moveTo((a[0] - x0) * sx, (a[1] - y0) * sy); for (let i = 2; i < a.length; i += 2) path.lineTo((a[i] - x0) * sx, (a[i + 1] - y0) * sy); n++;
    }
    for (const o of g.coastPieces || []) {
      if (o.x1 < x0 || o.x0 > x1 || o.y1 < y0 || o.y0 > y1) continue;
      const a = o.pts, m = Math.min(a.length / 2 - 1, 2) * 2, mx = Math.round((a[m] - KX0f()) / C), my = Math.round((a[m + 1] - KY0f()) / C);
      let cell = -1; for (const [dx, dy] of [[0, 0], [-1, 0], [0, -1], [-1, -1]]) { const xx = mx + dx, yy = my + dy; if (xx >= 0 && yy >= 0 && xx < g.gw && yy < g.gh && g.grid[yy * g.gw + xx] >= 0) { cell = g.grid[yy * g.gw + xx]; break; } }
      if (cell < 0 || !S.prov[cell] || S.prov[cell].owner !== id) continue;
      path.moveTo((a[0] - x0) * sx, (a[1] - y0) * sy); for (let i = 2; i < a.length; i += 2) path.lineTo((a[i] - x0) * sx, (a[i + 1] - y0) * sy); n++;
    }
    if (!n) return 0;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const [R, G, B] = [1, 3, 5].map(k => parseInt(hex.slice(k, k + 2), 16));
    ctx.strokeStyle = `rgba(${R},${G},${B},.30)`; ctx.lineWidth = 9; ctx.stroke(path);
    ctx.strokeStyle = `rgba(${R},${G},${B},.55)`; ctx.lineWidth = 3; ctx.stroke(path);
    ctx.restore();
    IM.glowPieces = n;
    return n;
  };
  // ---- the armies' planned moves (brief 7.3, the Into the Breach lesson): from the zoom the banners stand at, every
  // division on the march gets an arrow along the next steps of its path (about a month's march), in its realm's
  // colour on an ink line. Read from the divisions' own paths; nothing is planned here.
  IM.ARROW_STEPS = 3;
  IM.moveArrows = function (ctx, W, H, v) {
    if (!A.S || !A.allDivs || IM.zoomNow < IM.BANNER_ZOOM || !UI.set.banners) return 0;
    const vx = v ? v.x0 : 0, vy = v ? v.y0 : 0, vw = v ? v.w : KWf(), vh = v ? v.h : KHf(), sx = W / vw, sy = H / vh;
    const X = P => (P.sx - vx) * sx, Y = P => (P.sy - vy) * sy;
    let n = 0;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const d of A.allDivs()) {
      if (!d || !Array.isArray(d.path) || !d.path.length) continue;
      const P0 = A.S.prov[d.loc]; if (!P0) continue;
      const pts = [P0].concat(d.path.slice(0, IM.ARROW_STEPS).map(id => A.S.prov[id]).filter(Boolean)); if (pts.length < 2) continue;
      if (pts.every(P => X(P) < -20 || Y(P) < -20 || X(P) > W + 20 || Y(P) > H + 20)) continue;
      const r = A.S.realms[d.r], raw = r ? (UI.realmHex ? UI.realmHex(r) : r.color) : '#8a8f9e', hex = mix(/^#[0-9a-f]{6}$/i.test(raw || '') ? raw : '#8a8f9e', INK, 0.35);
      // the line stops short of the last site, so its head shows beside the banner standing there
      const xs = pts.map(X), ys = pts.map(Y), k = xs.length - 1; xs[k] = xs[k - 1] + (xs[k] - xs[k - 1]) * 0.72; ys[k] = ys[k - 1] + (ys[k] - ys[k - 1]) * 0.72;
      const line = () => { ctx.beginPath(); ctx.moveTo(xs[0], ys[0]); for (let i = 1; i < xs.length; i++) ctx.lineTo(xs[i], ys[i]); };
      ctx.strokeStyle = 'rgba(236,224,196,.85)'; ctx.lineWidth = 5; line(); ctx.stroke();
      ctx.strokeStyle = hex; ctx.lineWidth = 2.6; line(); ctx.stroke();
      const ang = Math.atan2(ys[k] - ys[k - 1], xs[k] - xs[k - 1]), hx = xs[k], hy = ys[k], L = 11;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx - L * Math.cos(ang - 0.45), hy - L * Math.sin(ang - 0.45)); ctx.lineTo(hx - L * Math.cos(ang + 0.45), hy - L * Math.sin(ang + 0.45)); ctx.closePath();
      ctx.fillStyle = hex; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
      n++;
    }
    ctx.restore();
    IM.arrows = n;
    return n;
  };
  // ---- towns and capitals: drawn with the lines layer, kept with the view until a capital moves
  // keeps shrink when a larger frame is seen whole (zoom under 1 exists only there)
  const keepScale = zoom => MAP.big ? clamp(zoom * 1.5, 0.6, 1) : 1;
  const iconK = (ctx, W, whole) => { let d = 0; try { d = ctx.canvas.getBoundingClientRect ? ctx.canvas.getBoundingClientRect().width : 0; } catch (e) { d = 0; } const k = clamp(W / Math.max(1, d || W), 0.9, 2.4); return whole ? Math.sqrt(k) : k; };
  const keep = (c, x, y, s) => {      // a keep: two towers, a crenellated wall, a dark gate, a gold flag
    c.lineWidth = Math.max(1, s * 0.09); c.strokeStyle = INK; c.fillStyle = VEL; c.lineJoin = 'miter';
    const w = s * 1.25, h = s * 0.7, tw2 = s * 0.36, th = s * 1.05, b = y + s * 0.42;
    c.beginPath(); c.rect(x - w / 2, b - h, w, h); c.fill(); c.stroke();
    for (const sx of [x - w / 2 - tw2 * 0.25, x + w / 2 - tw2 * 0.75]) {
      c.beginPath(); c.moveTo(sx, b); c.lineTo(sx, b - th); for (let i = 0; i < 3; i++) { const q = sx + i * tw2 / 3; c.lineTo(q, b - th - s * 0.12); c.lineTo(q + tw2 / 6, b - th - s * 0.12); c.lineTo(q + tw2 / 6, b - th); c.lineTo(q + tw2 / 3, b - th); }
      c.lineTo(sx + tw2, b); c.closePath(); c.fill(); c.stroke();
    }
    c.beginPath(); for (let i = 0; i < 4; i++) { const q = x - w / 2 + tw2 * 0.75 + i * (w - tw2 * 1.5) / 4; c.rect(q, b - h - s * 0.1, (w - tw2 * 1.5) / 8, s * 0.1); } c.fill(); c.stroke();
    c.fillStyle = INK; c.beginPath(); c.moveTo(x - s * 0.15, b); c.lineTo(x - s * 0.15, b - s * 0.28); c.arc(x, b - s * 0.28, s * 0.15, Math.PI, 0); c.lineTo(x + s * 0.15, b); c.fill();
    const fx = x + w / 2 - tw2 * 0.35, ft = b - th - s * 0.7;
    c.beginPath(); c.moveTo(fx, b - th - s * 0.12); c.lineTo(fx, ft); c.stroke();
    c.fillStyle = GOLD; c.beginPath(); c.moveTo(fx, ft); c.lineTo(fx + s * 0.55, ft + s * 0.12); c.lineTo(fx + s * 0.32, ft + s * 0.2); c.lineTo(fx + s * 0.55, ft + s * 0.3); c.lineTo(fx, ft + s * 0.34); c.closePath(); c.fill(); c.lineWidth = Math.max(0.8, s * 0.06); c.stroke();
  };
  const house = (c, x, b, s) => { c.beginPath(); c.moveTo(x - s * 0.32, b); c.lineTo(x - s * 0.32, b - s * 0.4); c.lineTo(x, b - s * 0.72); c.lineTo(x + s * 0.32, b - s * 0.4); c.lineTo(x + s * 0.32, b); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(x - s * 0.32, b - s * 0.4); c.lineTo(x, b - s * 0.72); c.lineTo(x + s * 0.32, b - s * 0.4); c.lineTo(x, b - s * 0.55); c.closePath(); c.save(); c.fillStyle = INK; c.fill(); c.restore(); };
  const tower = (c, x, b, s) => { const w = s * 0.42, h = s * 0.95; c.beginPath(); c.moveTo(x - w / 2, b); c.lineTo(x - w / 2, b - h); c.lineTo(x - w / 2, b - h - s * 0.13); c.lineTo(x - w / 6, b - h - s * 0.13); c.lineTo(x - w / 6, b - h); c.lineTo(x + w / 6, b - h); c.lineTo(x + w / 6, b - h - s * 0.13); c.lineTo(x + w / 2, b - h - s * 0.13); c.lineTo(x + w / 2, b); c.closePath(); c.fill(); c.stroke(); c.save(); c.fillStyle = INK; c.fillRect(x - s * 0.04, b - h * 0.62, s * 0.08, s * 0.16); c.restore(); };
  const church = (c, x, b, s) => { house(c, x - s * 0.12, b, s * 0.85); c.beginPath(); c.rect(x + s * 0.16, b - s * 0.75, s * 0.2, s * 0.75); c.fill(); c.stroke(); c.beginPath(); c.moveTo(x + s * 0.26, b - s * 0.75); c.lineTo(x + s * 0.26, b - s * 1.05); c.moveTo(x + s * 0.17, b - s * 0.95); c.lineTo(x + s * 0.35, b - s * 0.95); c.stroke(); };
  const tent = (c, x, b, s) => { c.beginPath(); c.moveTo(x - s * 0.4, b); c.lineTo(x, b - s * 0.6); c.lineTo(x + s * 0.4, b); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(x, b - s * 0.6); c.lineTo(x, b - s * 0.78); c.moveTo(x, b); c.lineTo(x - s * 0.06, b - s * 0.3); c.stroke(); };
  const walls = (c, x, b, s) => { c.beginPath(); c.moveTo(x - s * 0.6, b + s * 0.06); for (let i = 0; i < 6; i++) { const q = x - s * 0.6 + i * s * 0.2; c.lineTo(q, b - s * 0.08); c.lineTo(q + s * 0.1, b - s * 0.08); c.lineTo(q + s * 0.1, b + s * 0.06); c.lineTo(q + s * 0.2, b + s * 0.06); } c.stroke(); };
  IM.towns = function (ctx, W, H, vx, vy, sx, sy, zoom, K) {
    const S = A.S, caps = new Set();
    if (K == null) K = iconK(ctx, W, zoom === 1 && !vx && !vy);
    for (const id in S.realms) { const r = S.realms[id]; if (r.alive && r.capitalProv != null) caps.add(r.capitalProv); }
    const s0 = clamp(6.5 + zoom * 1.1, 7, 19) * K;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const p of S.prov) {
      const x = (p.sx - vx) * sx, y = (p.sy - vy) * sy;
      if (x < -30 || y < -30 || x > W + 30 || y > H + 30) continue;
      if (caps.has(p.id)) continue;
      if (zoom < IM.TOWN_ZOOM) continue;
      const t = p.type || '', b = y + s0 * 0.35;
      ctx.strokeStyle = INK; ctx.fillStyle = VEL; ctx.lineWidth = Math.max(0.9, s0 * 0.085);
      if (/castle|fort|hold|gate/.test(t)) tower(ctx, x, b, s0);
      else if (/monastery/.test(t)) church(ctx, x, b, s0);
      else if (/oasis|caravan|yam/.test(t)) tent(ctx, x, b, s0);
      else if (/city|hall/.test(t)) { house(ctx, x - s0 * 0.3, b, s0 * 0.85); tower(ctx, x + s0 * 0.22, b, s0 * 0.9); }
      else if (/town/.test(t) || (p.town || 0) > 3000) house(ctx, x, b, s0 * (p.town > 20000 ? 1 : 0.85));
      else if (p.town > 0) { ctx.beginPath(); ctx.arc(x, b - s0 * 0.15, s0 * 0.12, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      if ((p.fort || 0) >= 2) walls(ctx, x, b + s0 * 0.12, s0);
    }
    const sk = clamp(8 + zoom * 1.2, 9, 21) * K * keepScale(zoom);
    for (const pid of caps) {
      const p = S.prov[pid]; if (!p) continue;
      const x = (p.sx - vx) * sx, y = (p.sy - vy) * sy;
      if (x < -40 || y < -40 || x > W + 40 || y > H + 40) continue;
      keep(ctx, x, y, sk);
    }
    ctx.restore();
  };

  // ---- names in ink (patches IM-MARKS-*): realm names in capitals at their seat, province names once zoomed in
  const label = (ctx, t, x, y, font, fill) => { ctx.font = font; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(236,224,196,.92)'; ctx.lineJoin = 'round'; ctx.strokeText(t, x, y); ctx.fillStyle = fill; ctx.fillText(t, x, y); };
  MAP.inkLabel = (ctx, t, x, y, occ) => { ctx.save(); label(ctx, t, x, y, ctx.font, occ ? VERM : '#3b2a17'); ctx.restore(); };
  MAP.marks = function (ctx, W, H, v, o) {
    if (!IM.on() || !A.S) return false;
    try {
      const whole = !v || !!v.whole; v = wholeView(W, H, v);
      const S = A.S, vx = v ? v.x0 : 0, vy = v ? v.y0 : 0, vw = v ? v.w : KWf(), vh = v ? v.h : KHf(), sx = W / vw, sy = H / vh, zoom = ZREF / vw;
      const opts = typeof o === 'object' && o ? o : {}, K = iconK(ctx, W, whole);
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      if (!whole && zoom >= 1.8) {
        const f = `italic ${Math.round((9 + Math.min(5, zoom)) * Math.min(K, 1.4))}px Georgia, serif`;
        const s0 = clamp(6.5 + zoom * 1.1, 7, 19) * K;
        for (const p of S.prov) {
          const x = (p.sx - vx) * sx, y = (p.sy - vy) * sy;
          if (x < -40 || y < -20 || x > W + 40 || y > H + 20) continue;
          label(ctx, p.name, x, y + s0 * 0.35 + 11 * Math.min(K, 1.4), f, p.occ ? VERM : '#3b2a17');
        }
      }
      if (opts.labels !== false) {
        const fs = !whole ? Math.round(Math.max(11, 15 - zoom) * Math.min(K, 1.4)) : Math.max(10, Math.round(W / 92 * Math.pow(K, 0.7)));
        const sk = clamp(8 + zoom * 1.2, 9, 21) * K * keepScale(zoom);
        // in a frame larger than the world as written, many realms share a view: the most peopled are named first and
        // a name that would cross one already written is left for a closer zoom
        const placed = MAP.big ? [] : null, ids = Object.keys(S.realms);
        if (placed) ids.sort((a, b) => (S.realms[b].pop || 0) - (S.realms[a].pop || 0) || (a < b ? -1 : 1));
        for (const id of ids) {
          const r = S.realms[id]; if (!r.alive || r.capitalProv == null) continue;
          const p = A.prov(r.capitalProv); if (!p) continue;
          if (!(r.provCount >= 2 || opts.allLabels || zoom >= 2)) continue;
          const x = (p.sx - vx) * sx, y = (p.sy - vy) * sy;
          if (x < -60 || y < -30 || x > W + 60 || y > H + 30) continue;
          const t = String(r.short).toUpperCase(), font = `600 ${fs}px Cinzel, Georgia, serif`;
          if (placed) {
            ctx.font = font; const w = ctx.measureText(t).width + 8, h = fs + 3, bx = x - w / 2, by = y - sk * 1.25 - fs;
            if (placed.some(b => bx < b[0] + b[2] && bx + w > b[0] && by < b[1] + b[3] && by + h > b[1])) continue;
            placed.push([bx, by, w, h]);
          }
          label(ctx, t, x, y - sk * 1.25, font, INK);
        }
      }
      ctx.restore();
      return true;
    } catch (e) { try { ctx.restore(); } catch (e2) {} return false; }
  };

  // ---- the realms as a wash: the release's overlay, its pixel borders taken out, its colour thinned, and a
  // ribbon of stronger colour along each border (the borders themselves are inked in the ground)
  function inkify(cv, own) {
    const { gw, gh, grid } = MAP, c = cv.getContext('2d'), im = c.getImageData(0, 0, gw, gh), d = im.data, R = 4;
    const ds = new Uint8Array(gw * gh).fill(R);
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      const i = y * gw + x, pv = grid[i]; if (pv < 0) continue;
      const o = own[pv];
      if ((x > 0 && grid[i - 1] >= 0 && own[grid[i - 1]] !== o) || (x < gw - 1 && grid[i + 1] >= 0 && own[grid[i + 1]] !== o) || (y > 0 && grid[i - gw] >= 0 && own[grid[i - gw]] !== o) || (y < gh - 1 && grid[i + gw] >= 0 && own[grid[i + gw]] !== o)) ds[i] = 0;
    }
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) { const i = y * gw + x; if (x > 0 && ds[i - 1] + 1 < ds[i]) ds[i] = ds[i - 1] + 1; if (y > 0 && ds[i - gw] + 1 < ds[i]) ds[i] = ds[i - gw] + 1; }
    for (let y = gh - 1; y >= 0; y--) for (let x = gw - 1; x >= 0; x--) { const i = y * gw + x; if (x < gw - 1 && ds[i + 1] + 1 < ds[i]) ds[i] = ds[i + 1] + 1; if (y < gh - 1 && ds[i + gw] + 1 < ds[i]) ds[i] = ds[i + gw] + 1; }
    // one clean colour per province, for the pixels the release darkened as lines
    const rep = new Map();
    const isLine = (x, y, i, pv) => (x + 1 < gw && grid[i + 1] !== pv) || (y + 1 < gh && grid[i + gw] !== pv) || (x > 0 && grid[i - 1] < 0) || (y > 0 && grid[i - gw] < 0);
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) { const i = y * gw + x, pv = grid[i]; if (pv >= 0 && !rep.has(pv) && !isLine(x, y, i, pv)) rep.set(pv, i * 4); }
    const BR = [138, 106, 58];
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {       // first take out the release's lines
      const i = y * gw + x, pv = grid[i], o = i * 4; if (pv < 0) { d[o + 3] = 0; continue; }
      if (!isLine(x, y, i, pv)) continue;
      const s = (x > 0 && grid[i - 1] === pv) ? o - 4 : (y > 0 && grid[i - gw] === pv) ? o - gw * 4 : rep.has(pv) ? rep.get(pv) : -1;
      if (s >= 0) { d[o] = d[s]; d[o + 1] = d[s + 1]; d[o + 2] = d[s + 2]; d[o + 3] = d[s + 3]; }
    }
    for (let i = 0; i < gw * gh; i++) {                                 // then thin the colour, and lay the ribbon
      const o = i * 4, a = d[o + 3]; if (!a || grid[i] < 0) continue;
      for (let k = 0; k < 3; k++) d[o + k] = Math.round(d[o + k] * 0.86 + BR[k] * 0.14);
      const rib = ds[i] < R ? (1 - ds[i] / R) : 0;
      d[o + 3] = Math.min(175, Math.round(a * 0.42 + rib * 95 * Math.min(1.4, a / 120)));
    }
    hatch(d, own, ds);
    c.putImageData(im, 0, 0);
    return cv;
  }
  // brief 7.3 / 1.6: where two neighbouring realms' colours are closer than 0.08 in OKLab, the smaller is hatched at
  // 45 degrees in the line ink at a quarter, so a border never rests on colour alone. Rendering only.
  const oklab = hex => {
    const v = [1, 3, 5].map(k => parseInt(hex.slice(k, k + 2), 16) / 255).map(c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    const l = Math.cbrt(0.4122214708 * v[0] + 0.5363325363 * v[1] + 0.0514459929 * v[2]), m = Math.cbrt(0.2119034982 * v[0] + 0.6806995451 * v[1] + 0.1073969566 * v[2]), q = Math.cbrt(0.0883024619 * v[0] + 0.2817188376 * v[1] + 0.6299787005 * v[2]);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * q, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * q, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * q];
  };
  IM.HATCH_D = 0.08;
  function hatch(d, own, ds) {
    const { gw, gh, grid } = MAP, S = A.S; if (!S || !S.realms) return 0;
    const col = id => { const r = S.realms[id], h = r && (UI.realmHex ? UI.realmHex(r) : r.color); return typeof h === 'string' && /^#[0-9a-f]{6}$/i.test(h) ? h : null; };
    const size = new Map(), pairs = new Set();
    for (let i = 0; i < gw * gh; i++) {
      const pv = grid[i]; if (pv < 0) continue; const o = own[pv]; if (!o) continue;
      size.set(o, (size.get(o) || 0) + 1);
      if (ds[i] !== 0) continue;
      for (const j of [i + 1, i + gw]) { if (j >= gw * gh || grid[j] < 0) continue; const o2 = own[grid[j]]; if (o2 && o2 !== o) pairs.add(o < o2 ? o + '|' + o2 : o2 + '|' + o); }
    }
    const lab = new Map(), L = id => { if (!lab.has(id)) { const h = col(id); lab.set(id, h ? oklab(h) : null); } return lab.get(id); };
    const marked = new Set();
    for (const k of pairs) {
      const [a, b] = k.split('|'), p = L(a), q = L(b); if (!p || !q) continue;
      if (Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < IM.HATCH_D) marked.add((size.get(a) || 0) <= (size.get(b) || 0) ? a : b);
    }
    if (!marked.size) return 0;
    const INKC = [27, 23, 48];
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      const i = y * gw + x, pv = grid[i]; if (pv < 0 || !marked.has(own[pv]) || (x + y) % 6) continue;
      const o = i * 4; for (let k = 0; k < 3; k++) d[o + k] = Math.round(d[o + k] * 0.75 + INKC[k] * 0.25); d[o + 3] = Math.max(d[o + 3], 110);
    }
    IM.hatched = marked.size;
    return marked.size;
  }
  IM.inkify = inkify;
  const ovBasic = MAP.overlay;
  MAP.overlay = function () {
    const cv = ovBasic.apply(this, arguments);
    if (!IM.on() || !cv) return cv;
    if (cv._inkKey !== MAP.ownerKey) { inkify(cv, A.S.prov.map(p => p.owner)); cv._inkKey = MAP.ownerKey; }
    return cv;
  };
  if (typeof UI.wrOverlay === 'function') {
    const wrOv = UI.wrOverlay;
    UI.wrOverlay = function () {
      const cv = wrOv.apply(this, arguments);
      if (!IM.on() || !cv || !UI.wrOvCache) return cv;
      if (cv._inkKey !== UI.wrOvCache.key) { inkify(cv, A.S.prov.map(p => A.ctrl(p))); cv._inkKey = UI.wrOvCache.key; }
      return cv;
    };
  }

  // ---- standards for the armies (wrapping the release's box painters; the boxes stay when zoomed out)
  IM.zoomNow = 0;
  IM.bannerNow = () => !!UI.set.banners && IM.zoomNow >= IM.BANNER_ZOOM;
  const chargePath = {};
  const charge = k => { if (!k || k === 'none' || !PORTRAIT || !PORTRAIT.charges || !PORTRAIT.charges[k]) return null; if (!chargePath[k]) { try { chargePath[k] = new Path2D(PORTRAIT.charges[k]); } catch (e) { chargePath[k] = null; } } return chargePath[k]; };
  let realmIdx = null;
  const realmBy = (code, color) => {
    const S = A.S; if (!S) return null;
    if (!realmIdx || realmIdx.S !== S || realmIdx.n !== Object.keys(S.realms).length || realmIdx.cb !== !!(MAP.cb && MAP.cb())) {
      realmIdx = { S, n: Object.keys(S.realms).length, cb: !!(MAP.cb && MAP.cb()), code: {}, color: {} };
      for (const id in S.realms) { const r = S.realms[id]; if (!r.alive) continue; if (UI.realmCode) realmIdx.code[UI.realmCode(id)] = r; realmIdx.color[MAP.realmColor(r)] = realmIdx.color[MAP.realmColor(r)] || r; realmIdx.color[r.color] = realmIdx.color[r.color] || r; }
    }
    return (code && realmIdx.code[code]) || realmIdx.color[color] || null;
  };
  const houseOf = r => r && A.S.houses ? A.S.houses[r.house] || null : null;
  IM.standard = function (ctx, x, y, K, o) {
    const w = 50 * K, h = 37 * K, T = y - h / 2, B = y + h / 2, L = x - w / 2, px = L + 6 * K;
    const col = o.color || '#999999', r = realmBy(o.code, col), hs = houseOf(r);
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (o.sel) { ctx.setLineDash([3 * K, 2 * K]); ctx.strokeStyle = VEL; ctx.lineWidth = 4 * K; ctx.strokeRect(L - 3 * K, T - 4 * K, w + 6 * K, h + 7 * K); ctx.strokeStyle = INK; ctx.lineWidth = 1.6 * K; ctx.strokeRect(L - 3 * K, T - 4 * K, w + 6 * K, h + 7 * K); ctx.setLineDash([]); }
    // the pole on its shadow
    ctx.fillStyle = 'rgba(43,29,16,.35)'; ctx.beginPath(); ctx.ellipse(px + 2 * K, B, 7 * K, 2 * K, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = VEL; ctx.lineWidth = 3.4 * K; ctx.beginPath(); ctx.moveTo(px, B); ctx.lineTo(px, T - 2 * K); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.7 * K; ctx.beginPath(); ctx.moveTo(px, B); ctx.lineTo(px, T - 2 * K); ctx.stroke();
    if (o.elite) { ctx.fillStyle = GOLD; ctx.strokeStyle = INK; ctx.lineWidth = 0.9 * K; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 2.2 * K : 5 * K; ctx.lineTo(px + Math.cos(a) * rr, T - 4 * K + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else { ctx.fillStyle = GOLD; ctx.strokeStyle = INK; ctx.lineWidth = 0.9 * K; ctx.beginPath(); ctx.moveTo(px, T - 7 * K); ctx.lineTo(px + 2.2 * K, T - 3 * K); ctx.lineTo(px, T - 1 * K); ctx.lineTo(px - 2.2 * K, T - 3 * K); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    // the cloth: square for foot, swallowtail for horse, a pennon for bows, a scalloped fly for beasts
    const fx = px + 0.9 * K, fy = T, fw = 37 * K, fh = 19 * K, cat = o.cat;
    ctx.beginPath(); ctx.moveTo(fx, fy);
    if (cat === 'horse') { ctx.lineTo(fx + fw, fy); ctx.lineTo(fx + fw - 8 * K, fy + fh / 2); ctx.lineTo(fx + fw, fy + fh); ctx.lineTo(fx, fy + fh); }
    else if (cat === 'missile') { ctx.lineTo(fx + fw, fy + fh * 0.42); ctx.lineTo(fx, fy + fh); }
    else if (cat === 'beast') { ctx.lineTo(fx + fw - 3 * K, fy); for (let i = 0; i < 3; i++) ctx.quadraticCurveTo(fx + fw + 3 * K, fy + fh * (i + 0.5) / 3, fx + fw - 3 * K, fy + fh * (i + 1) / 3); ctx.lineTo(fx, fy + fh); }
    else { ctx.quadraticCurveTo(fx + fw * 0.5, fy - 2 * K, fx + fw, fy + 1 * K); ctx.lineTo(fx + fw, fy + fh + 1 * K); ctx.quadraticCurveTo(fx + fw * 0.5, fy + fh - 2 * K, fx, fy + fh); }
    ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
    ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(43,29,16,.28)'; ctx.lineWidth = 0.8 * K; ctx.beginPath(); for (const f of [0.3, 0.62, 0.85]) { ctx.moveTo(fx + fw * f, fy); ctx.lineTo(fx + fw * f - 1.5 * K, fy + fh + 2 * K); } ctx.stroke(); ctx.restore();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.2 * K; ctx.stroke();
    const ink = lum(col) > 0.5 ? INK : VEL, cx = fx + (cat === 'missile' ? fw * 0.3 : fw * 0.42), cy = fy + fh * (cat === 'missile' ? 0.45 : 0.5);
    const cp = hs && charge(hs.charge);
    if (cp) {
      let tinct = hs.colors && hs.colors[1] ? hs.colors[1] : ink; if (Math.abs(lum(tinct) - lum(col)) < 0.25) tinct = ink;
      const sc = fh * 0.031; ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.fillStyle = tinct; ctx.fill(cp, 'evenodd'); ctx.strokeStyle = INK; ctx.lineWidth = 1.1 / sc * K * 0.5; ctx.stroke(cp); ctx.restore();
    } else if (o.code) { ctx.fillStyle = ink; ctx.font = `700 ${Math.round(8 * K)}px Cinzel, Georgia, serif`; ctx.fillText(o.code, cx, cy + 0.5 * K); }
    // the strength, on a slip of vellum, edged in the side's ink
    const qx = px + 3 * K, qy = fy + fh + 2.5 * K, qw = L + w - qx, qh = 11 * K;
    const edge = o.mine ? GOLD : o.side === 'foe' ? VERM : o.side === 'ally' ? LAPIS : INK;
    ctx.fillStyle = VEL; ctx.fillRect(qx, qy, qw, qh); ctx.strokeStyle = edge; ctx.lineWidth = (o.mine || o.side === 'foe' || o.side === 'ally' ? 2 : 1) * K; ctx.strokeRect(qx, qy, qw, qh);
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(9.5 * K)}px Georgia, serif`; ctx.fillText(o.label != null ? String(o.label) : '', qx + qw / 2, qy + qh / 2 + 0.5 * K);
    if (!o.noBars) {
      ctx.fillStyle = 'rgba(43,29,16,.35)'; ctx.fillRect(qx, qy + qh + 0.8 * K, qw, 4.4 * K);
      ctx.fillStyle = VERD; ctx.fillRect(qx, qy + qh + 0.8 * K, qw * clamp(o.org || 0, 0, 1), 2 * K);
      ctx.fillStyle = GOLD; ctx.fillRect(qx, qy + qh + 3.2 * K, qw * clamp(o.str || 0, 0, 1), 2 * K);
    }
    let cxs = fx + fw + 4 * K;
    const chip = (t, c2) => { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(cxs + 5 * K, T + 5 * K, 6 * K, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(cxs + 5 * K, T + 5 * K, 4.9 * K, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = INK; ctx.font = `800 ${Math.round(7.5 * K)}px Georgia, serif`; ctx.fillText(t, cxs + 5 * K, T + 5.4 * K); cxs += 13 * K; };
    if (o.atk) chip('!', '#d0614c'); if (o.hungry) chip('S', '#e6b75d'); if (o.siege) chip('W', '#d9b45f');
    if (o.you) { ctx.font = `800 ${Math.round(9 * K)}px Georgia, serif`; ctx.textBaseline = 'alphabetic'; ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeText('▼ YOU', x + 6 * K, T - 8 * K); ctx.fillStyle = '#f0c247'; ctx.fillText('▼ YOU', x + 6 * K, T - 8 * K); }
    ctx.restore();
    return { w, h };
  };
  if (typeof UI.wrCounter === 'function') {
    const wrC = UI.wrCounter;
    UI.wrCounter = function (ctx, x, y, K, o) { if (IM.bannerNow()) { try { return IM.standard(ctx, x, y, K, o || {}); } catch (e) {} } return wrC.apply(this, arguments); };
  }
  if (typeof UI.canvasCounter === 'function') {
    const cc = UI.canvasCounter;
    UI.canvasCounter = function (ctx, x, y, w, cat, ech, color, sel, mine, lab) {
      if (IM.bannerNow()) { try { IM.standard(ctx, x, y, w / 34, { color, cat, sel, mine, label: lab, noBars: true, side: mine ? 'me' : '' }); return; } catch (e) {} }
      return cc.apply(this, arguments);
    };
  }

  // ---- the wrappers: tell the hooks the zoom, and how to redraw a canvas whose tiles came late
  const drawBasic = MAP.draw;
  MAP.draw = function (canvas, opts) {
    if (canvas) IM.redraws.set(canvas, () => MAP.draw(canvas, opts));
    return drawBasic.apply(this, arguments);
  };
  if (typeof UI.gmDraw === 'function') {
    const gm = UI.gmDraw;
    UI.gmDraw = function () {
      const cv = UI.$ && UI.$('#gmap'); if (cv) IM.redraws.set(cv, () => UI.gmDraw());
      IM.zoomNow = UI.gm && UI.gm.view ? ZREF / UI.gm.view.w : 1;
      try { return gm.apply(this, arguments); } finally { IM.zoomNow = 0; }
    };
  }
  if (typeof UI.drawWarBasic === 'function') {
    const wb = UI.drawWarBasic;
    UI.drawWarBasic = function (cv) {
      if (cv) IM.redraws.set(cv, () => UI.drawWar ? UI.drawWar(cv) : UI.drawWarBasic(cv));
      IM.zoomNow = UI.wr && UI.wr.view ? ZREF / UI.wr.view.w : 1;
      try { return wb.apply(this, arguments); } finally { IM.zoomNow = 0; }
    };
  }

  // ---- the settings (patch IM-MENU)
  IM.menu = () => `<label class="row"><input type="checkbox" data-c="setInkMap" ${UI.set.inkMap ? 'checked' : ''}> Inked map (coasts, mountains, towns)</label>` +
    `<label class="row"><input type="checkbox" data-c="setBanners" ${UI.set.banners ? 'checked' : ''}> Banners for armies when zoomed in</label>`;
  Object.assign(UI.C, {
    setInkMap(el) { UI.set.inkMap = el.checked; UI.saveSettings(); IM.reset(); UI.render(); },
    setBanners(el) { UI.set.banners = el.checked; UI.saveSettings(); UI.render(); },
  });
})();
