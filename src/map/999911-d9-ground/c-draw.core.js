// 999911-d9-ground on the map: the ways and the names of the land, laid by the one map component (MAP.paint, under 62's
// ink), and realm colours that neighbours never share.
//   - MAP.ways: woods (small trees) and marsh (reeds) from the cover, close in; roads in two ranks (a high road is a
//     red-brown line in a pale casing, a track a pale line in a dark brown casing: solid and cased, where every border is
//     dashed or dotted ink); a ford (a pale blue diamond) or a bridge (two flared lines) at each crossing; a pass mark (two arcs across
//     the road) on each pass.
//   - VM.landNames (called by 99991's labels, by the same placing rule): seas and ranges, then rivers along their course,
//     forests and passes.
//   - UI.realmHex on a generated map: twelve hues in three steps (36 colours), one to a realm, chosen so neighbours stand
//     furthest apart; the 35 realms of the map never share one, and a realm made later takes the colour furthest from
//     its neighbours'.
//   - The rivers' tributaries (the streams of the ground) appear from zoom 4 (99991's VM.SAT.RIVER_MIN goes down).
// Rendering only: no A.rand, nothing written to A.S; geometry is cached per world.
(function () {
  const D9 = A.D9, VM = A.V2MAP;
  if (!D9 || !VM || typeof MAP === 'undefined') return;
  const KW = 7000, KH = 4500;
  D9.LOOK = {
    high: { core: 'rgba(138,40,18,.96)', casing: 'rgba(250,238,210,.9)', w: 1.9 },
    track: { core: 'rgba(240,222,180,.96)', casing: 'rgba(70,38,14,.75)', w: 1.5 },
    wood: 'rgba(26,58,30,.5)', marsh: 'rgba(40,72,70,.62)', ink: 'rgba(28,22,16,.92)', paper: 'rgba(250,240,214,.9)', ford: 'rgba(196,226,242,.95)',
    zoom: { track: 1.6, cover: 2.6, cross: 2.6, pass: 1.8 },
  };
  D9.on = () => !!(D9.ctx() && typeof document !== 'undefined');
  D9.stats = { frames: 0, ms: 0, roads: 0, marks: 0 };
  const now = () => (typeof performance !== 'undefined' ? performance.now() : 0);
  // fixed tables the drawing loops read, made once (owner order 62: no new objects inside per-frame loops)
  const REED = [-0.7, 0, 0.7], SIDES = [-1, 1], RANKS = [2, 1];
  const ratio = (cv, W) => { let d = 0; try { d = cv && cv.getBoundingClientRect ? cv.getBoundingClientRect().width : 0; } catch (e) {} return d > 0 ? Math.min(2.4, Math.max(0.6, W / d)) : 1; };
  const hash = k => { let h = Math.imul(k ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };

  // ---- geometry, once per world: each road as a smoothed polyline in km, with its box
  const chaikin = p => { const o = [p[0], p[1]]; for (let i = 0; i + 3 < p.length; i += 2) { o.push(p[i] * 0.75 + p[i + 2] * 0.25, p[i + 1] * 0.75 + p[i + 3] * 0.25, p[i] * 0.25 + p[i + 2] * 0.75, p[i + 1] * 0.25 + p[i + 3] * 0.75); } o.push(p[p.length - 2], p[p.length - 1]); return o; };
  D9.geo = function () {
    const c = D9.ctx(); if (!c) return null;
    const G = c.G; if (G._geo) return G._geo;
    const gw = c.w.gw, roads = [];
    for (const e of G.edges) {
      if (!e.rank) continue;
      let p = []; for (const k of e.path) p.push((k % gw) * 10 + 5, Math.floor(k / gw) * 10 + 5);
      p = chaikin(chaikin(p));
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < p.length; i += 2) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]); }
      roads.push({ rank: e.rank, pts: Float32Array.from(p), x0, y0, x1, y1 });
    }
    // the road's direction at each crossing and pass (from the first road through it), for the marks
    const dirAt = (k, ei) => { const p = G.edges[ei].path; let i = p.indexOf(k); if (i < 0) i = 0; const a = p[Math.max(0, i - 2)], b = p[Math.min(p.length - 1, i + 2)]; return Math.atan2(Math.floor(b / gw) - Math.floor(a / gw), (b % gw) - (a % gw)); };
    const cross = G.crossings.map(x => ({ x: x.x, y: x.y, kind: x.kind, ang: dirAt(x.k, x.edges[0]) }));
    const pass = G.passes.map(x => ({ x: x.x, y: x.y, ang: dirAt(x.k, x.edges[0]) }));
    G._geo = { roads, cross, pass };
    return G._geo;
  };

  // ---- the ways layer. With 62's ink on, it is laid into 62's kept picture of the lines (IM.under, over the borders and
  // under the towns), so a still or panning map pays one copy for it; else MAP.paint lays it directly (MAP.ways)
  const IM = UI.INKMAP;
  const inkKeeps = () => !!(IM && typeof IM.on === 'function' && IM.on());
  MAP.ways = function (ctx, W, H, v) {
    if (D9.OFF || !D9.on() || inkKeeps()) return false;
    return D9.drawWays(ctx, W, H, v, ctx.canvas, W);
  };
  if (IM) {
    IM.under = function (c, d, screen) {
      if (D9.OFF || !D9.on()) return;
      // the kept picture is wider than the screen's canvas by its margin: the screen's own ratio sets the line widths
      D9.drawWays(c, d.W, d.H, { x0: d.vx, y0: d.vy, w: d.W / d.sx, h: d.H / d.sy }, screen, screen && screen.width ? screen.width : d.W);
    };
    IM.underKey = () => { const c = D9.OFF ? null : D9.ctx(); return c ? '|d9:' + c.w.key : ''; };
  }
  D9.drawWays = function (ctx, W, H, v, screen, SW) {
    const t0 = now(), c = D9.ctx(), G = c.G, geo = D9.geo(), L = D9.LOOK;
    const vx = v ? v.x0 : 0, vy = v ? v.y0 : 0, vw = v ? v.w : KW, vh = v ? v.h : KH, sx = W / vw, sy = H / vh, k = ratio(screen, SW);
    // the zoom as 62 and 99991 reckon it: the screen's width of the frame
    const zoom = KW / (SW / sx);
    const X = x => (x - vx) * sx, Y = y => (y - vy) * sy, x1v = vx + vw, y1v = vy + vh, m = 30 / sx;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // woods and marsh, on a lattice that thins as you go out; each mark jittered by a hash of its cell
    let marks = 0;
    if (zoom >= L.zoom.cover) {
      const gw = c.w.gw, gh = c.w.gh, step = zoom >= 8 ? 2 : zoom >= 4.5 ? 3 : 4, cx0 = Math.max(0, Math.floor(vx / 10)), cy0 = Math.max(0, Math.floor(vy / 10)), cx1 = Math.min(gw - 1, Math.ceil(x1v / 10)), cy1 = Math.min(gh - 1, Math.ceil(y1v / 10));
      const r = Math.max(1.3, Math.min(4, 10 * sx * 0.22)), tree = new Path2D(), reed = new Path2D();
      for (let yy = cy0 - (cy0 % step); yy <= cy1; yy += step) for (let xx = cx0 - (cx0 % step); xx <= cx1; xx += step) {
        const kk = yy * gw + xx, cv = G.cover[kk]; if (!cv) continue;
        const h = hash(kk), px = X(xx * 10 + 5 + (h - 0.5) * 6 * step), py = Y(yy * 10 + 5 + (hash(kk + 7919) - 0.5) * 6 * step);
        if (cv === 1) { tree.moveTo(px + r, py); tree.arc(px, py, r, 0, Math.PI * 2); tree.moveTo(px, py + r); tree.lineTo(px, py + r * 1.9); }
        else { reed.moveTo(px - r * 1.2, py + r); reed.lineTo(px + r * 1.2, py + r); for (const dx of REED) { reed.moveTo(px + dx * r, py + r); reed.lineTo(px + dx * r * 1.3, py - r * (dx ? 0.6 : 1)); } }
        marks++;
      }
      ctx.fillStyle = L.wood; ctx.strokeStyle = L.wood; ctx.lineWidth = Math.max(0.8, r * 0.35); ctx.fill(tree); ctx.stroke(tree);
      ctx.strokeStyle = L.marsh; ctx.lineWidth = Math.max(0.7, r * 0.3); ctx.stroke(reed);
    }
    // roads: tracks first, high roads over them; one path and two strokes a rank
    let n = 0;
    for (const rank of RANKS) {
      if (rank === 2 && zoom < L.zoom.track) continue;
      const look = rank === 1 ? L.high : L.track, path = new Path2D();
      for (const o of geo.roads) {
        if (o.rank !== rank || o.x1 < vx - m || o.x0 > x1v + m || o.y1 < vy - m || o.y0 > y1v + m) continue;
        const p = o.pts; path.moveTo(X(p[0]), Y(p[1])); for (let i = 2; i < p.length; i += 2) path.lineTo(X(p[i]), Y(p[i + 1])); n++;
      }
      const w = look.w * k * (zoom < 1.5 ? 0.8 : zoom >= 4 ? 1.25 : 1);
      ctx.strokeStyle = look.casing; ctx.lineWidth = w + (rank === 1 ? 2 : 1.4) * k; ctx.stroke(path);
      ctx.strokeStyle = look.core; ctx.lineWidth = w; ctx.stroke(path);
    }
    // fords and bridges
    if (zoom >= L.zoom.cross) {
      const s = 4.2 * k * Math.min(1.5, 0.75 + zoom / 12);
      for (const x of geo.cross) {
        if (x.x < vx || x.x > x1v || x.y < vy || x.y > y1v) continue;
        const px = X(x.x), py = Y(x.y);
        ctx.save(); ctx.translate(px, py); ctx.rotate(x.ang);
        if (x.kind === 'bridge') {   // two flared lines along the road
          ctx.strokeStyle = L.paper; ctx.lineWidth = 3.2 * k;
          for (const sgn of SIDES) { ctx.beginPath(); ctx.moveTo(-s * 1.3, sgn * s * 0.95); ctx.lineTo(-s * 0.8, sgn * s * 0.55); ctx.lineTo(s * 0.8, sgn * s * 0.55); ctx.lineTo(s * 1.3, sgn * s * 0.95); ctx.stroke(); }
          ctx.strokeStyle = L.ink; ctx.lineWidth = 1.4 * k;
          for (const sgn of SIDES) { ctx.beginPath(); ctx.moveTo(-s * 1.3, sgn * s * 0.95); ctx.lineTo(-s * 0.8, sgn * s * 0.55); ctx.lineTo(s * 0.8, sgn * s * 0.55); ctx.lineTo(s * 1.3, sgn * s * 0.95); ctx.stroke(); }
        } else {                     // a pale diamond on the road
          ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(0, -s * 0.7); ctx.lineTo(s, 0); ctx.lineTo(0, s * 0.7); ctx.closePath();
          ctx.fillStyle = L.ford; ctx.fill(); ctx.strokeStyle = L.ink; ctx.lineWidth = 1.1 * k; ctx.stroke();
        }
        ctx.restore(); marks++;
      }
    }
    // passes: two arcs across the road, their backs together
    if (zoom >= L.zoom.pass) {
      const s = 4.5 * k * Math.min(1.4, 0.8 + zoom / 14);
      for (const p of geo.pass) {
        if (p.x < vx || p.x > x1v || p.y < vy || p.y > y1v) continue;
        ctx.save(); ctx.translate(X(p.x), Y(p.y)); ctx.rotate(p.ang + Math.PI / 2);
        for (let pass = 0; pass < 2; pass++) {
          ctx.strokeStyle = pass ? L.ink : L.paper; ctx.lineWidth = (pass ? 1.5 : 3.4) * k;
          ctx.beginPath(); ctx.arc(-s * 1.1, 0, s, -0.9, 0.9); ctx.stroke();
          ctx.beginPath(); ctx.arc(s * 1.1, 0, s, Math.PI - 0.9, Math.PI + 0.9); ctx.stroke();
        }
        ctx.restore(); marks++;
      }
    }
    ctx.restore();
    D9.stats.frames++; D9.stats.ms = Math.round((now() - t0) * 10) / 10; D9.stats.roads = n; D9.stats.marks = marks;
    return true;
  };

  // ---- names of the land, through 99991's labels (the same placing rule)
  D9.NAMES_LOOK = {
    sea: { fill: '#b5d3e6', min: 11, zoom: 0 }, range: { fill: '#eadcc2', min: 10, zoom: 0 },
    river: { fill: '#a7cde3', min: 10, zoom: 2.2 }, forest: { fill: '#c3dcae', min: 10, zoom: 2.2 }, pass: { fill: '#eadcc2', min: 10, zoom: 2.6 },
  };
  D9.namesPlaced = [];
  VM.landNames = function (api, phase) {
    if (D9.OFF || !D9.on()) return;
    const c = D9.ctx(), G = c.G, N = D9.names(); if (!N) return;
    const { ctx, W, H, vx, vy, sx, sy, zoom, k, whole, placed, out } = api;
    if (phase === 'big') D9.namesPlaced = [];
    const hit = b => placed.some(q => b[0] < q[0] + q[2] && b[0] + b[2] > q[0] && b[1] < q[1] + q[3] && b[1] + b[3] > q[1]);
    // a name at (x, y) in km, turned by ang (radians, kept within 40 degrees of level): its box is the turned text's
    // a range's or a forest's name once in a view, unless close in (where a long range carries it along its stretches)
    const once = api.d9once || (api.d9once = new Set());
    const put = (t, x, y, kind, ang, sizeF) => {
      const L = D9.NAMES_LOOK[kind]; if (zoom < L.zoom) return false;
      if (zoom < 4 && once.has(t)) return false;
      const cx = (x - vx) * sx, cy = (y - vy) * sy; if (cx < 0 || cy < 0 || cx > W || cy > H) return false;
      const px = Math.max(L.min * k, (whole ? W / 118 : (10 + Math.min(4, zoom)) * Math.min(k, 1.4)) * (sizeF || 1));
      const caps = kind === 'range' || kind === 'sea';
      const f = `${caps ? '' : 'italic '}${kind === 'range' ? 600 : 400} ${Math.round(px)}px ${kind === 'range' ? 'Cinzel, ' : ''}Georgia, serif`;
      const text = caps ? t.toUpperCase().split('').join(kind === 'sea' ? ' ' : '') : t;
      ctx.font = f; const w = ctx.measureText(text).width, h = px * 1.1, pad = 2 * k;
      let a = ang || 0; if (a > 0.7) a = 0.7; if (a < -0.7) a = -0.7;
      const ca = Math.abs(Math.cos(a)), sa = Math.abs(Math.sin(a)), bw = w * ca + h * sa + 2 * pad, bh = w * sa + h * ca + 2 * pad;
      const b = [cx - bw / 2, cy - bh / 2, bw, bh];
      if (b[0] < 0 || b[1] < 0 || b[0] + b[2] > W || b[1] + b[3] > H || hit(b)) return false;
      placed.push(b); out.push({ t, kind, x: b[0], y: b[1], w: b[2], h: b[3], px: px / k }); D9.namesPlaced.push({ t, kind, px: px / k }); once.add(t);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = f;
      ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, px * 0.22); ctx.strokeStyle = 'rgba(14,12,10,.8)'; ctx.strokeText(text, 0, 0);
      ctx.fillStyle = L.fill; ctx.fillText(text, 0, 0); ctx.restore();
      return true;
    };
    if (phase === 'big') {
      G.seas.forEach((s, i) => put(N.seas[i], s.x, s.y, 'sea', 0, 1.05));
      // ranges: the biggest first; far out only the great ones
      G.ranges.forEach((r, i) => { if (zoom >= 2 || r.n >= 600) put(N.ranges[i], r.x, r.y, 'range', r.ang, r.n >= 1200 ? 1.1 : 0.95); });
    } else {
      G.rivers.forEach((r, i) => put(N.rivers[i], r.x, r.y - 8 / Math.max(0.2, sy * 10), 'river', r.ang));
      G.forests.forEach((f, i) => put(N.forests[i], f.x, f.y, 'forest', 0));
      G.passes.forEach((p, i) => put(N.passes[i], p.x, p.y + 14 / Math.max(0.2, sy), 'pass', 0));
    }
  };

  // ---- the rivers' tributaries: the streams the ground carries show from zoom 4
  if (VM.SAT && typeof VM.drawRivers === 'function') {
    const dr = VM.drawRivers;
    VM.drawRivers = function (ctx, vx, vy, sx, sy, W, H, kAt) {
      const zoom = KW / (W / sx), m0 = VM.SAT.RIVER_MIN;
      if (!kAt && zoom >= 4 && VM.STREAM_T) VM.SAT.RIVER_MIN = Math.max(VM.STREAM_T, m0 / 3);
      try { return dr.apply(this, arguments); } finally { VM.SAT.RIVER_MIN = m0; }
    };
  }

  // ---- realm colours on a generated map: 36 colours, one to a realm, neighbours furthest apart
  const lin = c => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
  const oklchHex = (L, C, h) => {
    const a = C * Math.cos(h), b = C * Math.sin(h);
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b, m_ = L - 0.1055613458 * a - 0.0638541728 * b, s_ = L - 0.0894841775 * a - 1.291485548 * b;
    const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
    const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
    if (rgb.some(x => x < -0.001 || x > 1.001)) return null;
    return '#' + rgb.map(x => Math.round(Math.max(0, Math.min(1, lin(Math.max(0, x)))) * 255).toString(16).padStart(2, '0')).join('');
  };
  D9.PALETTE = (() => {
    const out = [];
    for (let s = 0; s < 3; s++) for (let i = 0; i < 12; i++) {
      const L = [0.74, 0.62, 0.84][s], h = (i * 30 + 15 + s * 10) * Math.PI / 180;
      let C = 0.14, hex = null; while (!hex && C > 0.02) { hex = oklchHex(L, C, h); C -= 0.01; }
      out.push({ hex, L, a: (C + 0.01) * Math.cos(h), b: (C + 0.01) * Math.sin(h) });
    }
    return out;
  })();
  const dLab = (p, q) => Math.hypot(p.L - q.L, p.a - q.a, p.b - q.b);
  let pal = null;
  D9.realmColors = function () {
    const c = D9.ctx(); if (!c) return null;
    if (pal && pal.key === c.w.key) return pal.map;
    // the realms of the map as written and their neighbours on this land
    const rel = VM.release().provinces, own = rel.map(p => p.realm), nb = {};
    for (const q of c.w.prov) for (const j of q.adj) { const a = own[q.id], b = own[j]; if (a && b && a !== b && a !== 'unclaimed' && b !== 'unclaimed') (nb[a] = nb[a] || new Set()).add(b); }
    const size = {}; for (const q of c.w.prov) { const r = own[q.id]; if (r && r !== 'unclaimed') size[r] = (size[r] || 0) + q.cells; }
    const ids = Object.keys(size).sort((x, y) => size[y] - size[x] || (x < y ? -1 : 1)), map = {}, used = new Set();
    for (const id of ids) {
      const ring1 = [...(nb[id] || [])], ring2 = new Set(); for (const n of ring1) for (const m of nb[n] || []) if (m !== id && !ring1.includes(m)) ring2.add(m);
      let best = -1, bs = -Infinity;
      D9.PALETTE.forEach((p, i) => {
        if (used.has(i) && used.size < D9.PALETTE.length) return;
        let d1 = 1, d2 = 1;
        for (const n of ring1) if (map[n] != null) d1 = Math.min(d1, dLab(p, D9.PALETTE[map[n]]));
        for (const n of ring2) if (map[n] != null) d2 = Math.min(d2, dLab(p, D9.PALETTE[map[n]]));
        const sc = Math.min(d1, 0.2) * 4 + Math.min(d2, 0.12) - i * 1e-6;
        if (sc > bs) { bs = sc; best = i; }
      });
      map[id] = best; used.add(best);
    }
    pal = { key: c.w.key, map, nb, late: {} };
    return map;
  };
  // a realm not on the map as written (a split, a rising): the colour furthest from the realms beside it now; kept
  // for the session so it does not flicker as borders move
  const lateColor = (id) => {
    const map = D9.realmColors(); if (!map) return null;
    if (pal.late[id] != null) return pal.late[id];
    const S = A.S, near = new Set();
    try { for (const P of S.prov) if (P.owner === id) for (const j of P.adj) { const o = S.prov[j].owner; if (o && o !== id && o !== 'unclaimed') near.add(o); } } catch (e) {}
    let best = 0, bs = -Infinity;
    const taken = new Set([...Object.values(map), ...Object.values(pal.late)]);
    D9.PALETTE.forEach((p, i) => { let d = 1; for (const n of near) { const ci = map[n] != null ? map[n] : pal.late[n]; if (ci != null) d = Math.min(d, dLab(p, D9.PALETTE[ci])); } const sc = Math.min(d, 0.2) + (taken.has(i) ? 0 : 0.5) - i * 1e-6; if (sc > bs) { bs = sc; best = i; } });
    pal.late[id] = best;
    return best;
  };
  D9.colorOf = function (id) {
    if (D9.OFF || !id || id === 'unclaimed') return null;
    const map = D9.realmColors(); if (!map) return null;
    const i = map[id] != null ? map[id] : (A.S && A.S.realms && A.S.realms[id] ? lateColor(id) : null);
    return i == null ? null : D9.PALETTE[i].hex;
  };
  // asked first by 91's UI.realmHex
  UI.mapRealmHex = id => D9.colorOf(id);
})();
