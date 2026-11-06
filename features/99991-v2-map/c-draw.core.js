// The v2 continent on screen: v2's satellite renderer (A.V2.render.renderMap) under every map, in place of 62's inked
// ground and the release's relief picture, with the rivers as canvas vectors.
//   - The whole continent is rendered once per world (VM.SAT.BASE_W pixels wide) and laid under every view.
//   - Zoomed in past that picture's detail, the view is drawn from 256-pixel tiles rendered with opts.region at a
//     higher scale (renderMap adds its fine height detail as the scale grows), cached by level and position, a few
//     per frame; a tile not yet drawn shows the whole-continent picture until the next frame.
//   - Rivers are polylines from A.V2.continent.riverPaths in km, stroked by flow; the small ones appear as you zoom.
//   - Borders, towns, names and the realms' wash stay 62's (traced from the grid as smooth vector lines).
// Pure: the renderer's noise is seeded from the world's seed; nothing here reads A.rand or writes A.S.
(function () {
  const VM = A.V2MAP;
  const SAT = VM.SAT = { BASE_W: 934, TILE: 256, MAXL: 6, budgetMs: 24, LIMIT: 140, RIVER_MIN: 120, SEA: '#0e2240', TILE_Q: 'medium' };
  SAT.stats = { tiles: 0, tileMs: 0, baseMs: 0, late: 0 };
  const now = () => (typeof performance !== 'undefined' ? performance.now() : 0);
  const KW = 7000, KH = 4500;                     // the release's frame in km (MAP.gw x MAP.gh cells of 10 km)
  VM.drawOn = () => !!(VM.w && VM.cur && A.S && A.S.v2map && typeof document !== 'undefined' && UI.set.v2Sat !== false);

  const toCanvas = img => {
    const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
    cv.getContext('2d').putImageData(new ImageData(img.data, img.width, img.height), 0, 0);
    return cv;
  };
  // ---- the whole continent, once per world
  let base = null;
  VM.basePic = function (w) {
    if (base && base.seed === w.key) return base;
    const t0 = now(), s = SAT.BASE_W / w.gen.W, kc = KW / w.gen.W;
    base = { seed: w.key, cv: toCanvas(A.V2.render.renderMap(w.gen, { scale: s })), s, kc, ppk: s / kc };
    SAT.stats.baseMs = Math.round(now() - t0);
    return base;
  };
  // ---- tiles for the closer views
  const cache = new Map(); let cacheSeed = null;
  VM.satReset = () => { cache.clear(); cacheSeed = null; };
  const tile = (w, B, L, tx, ty, make) => {
    if (cacheSeed !== w.key) { cache.clear(); cacheSeed = w.key; }
    const k = L + ':' + tx + ':' + ty; let t = cache.get(k);
    if (t) { cache.delete(k); cache.set(k, t); return t; }
    if (!make) return null;
    const t0 = now(), lp = B.ppk * Math.pow(2, L), tk = SAT.TILE / lp, kc = B.kc;
    const img = A.V2.render.renderMap(w.gen, { scale: lp * kc, region: { x: tx * tk / kc - 0.5, y: ty * tk / kc - 0.5, w: SAT.TILE / (lp * kc), h: SAT.TILE / (lp * kc) } });
    t = toCanvas(img); cache.set(k, t);
    if (cache.size > SAT.LIMIT) cache.delete(cache.keys().next().value);
    SAT.stats.tiles++; SAT.stats.tileMs += now() - t0;
    return t;
  };
  const later = new Set();
  const redrawLater = cv => {
    if (!cv || later.has(cv)) return; later.add(cv);
    const go = () => { later.delete(cv); const IM = UI.INKMAP, f = IM && IM.redraws && IM.redraws.get(cv); if (f && cv.isConnected) f(); };
    (typeof requestAnimationFrame === 'function') ? requestAnimationFrame(go) : setTimeout(go, 16);
  };

  // ---- the ground under view v ({ x0, y0, w, h } in km; null: the whole frame stretched to the canvas)
  VM.drawGround = function (ctx, W, H, v) {
    const w = VM.w, B = VM.basePic(w);
    const vx = v ? v.x0 : 0, vy = v ? v.y0 : 0, vw = v ? v.w : KW, vh = v ? v.h : KH, sx = W / vw, sy = H / vh;
    ctx.save();
    ctx.fillStyle = SAT.SEA; ctx.fillRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = true;
    // the base picture: its pixel i sits at km (i / s + 0.5) * kc
    const X = km => (km - vx) * sx, Y = km => (km - vy) * sy;
    const drawBase = q => { ctx.imageSmoothingQuality = q; ctx.drawImage(B.cv, X(0.5 * B.kc), Y(0.5 * B.kc), B.cv.width / B.s * B.kc * sx, B.cv.height / B.s * B.kc * sy); };
    const ppk = Math.max(sx, sy);
    if (ppk > B.ppk * 1.3) {
      const L = Math.max(1, Math.min(SAT.MAXL, Math.ceil(Math.log2(ppk / B.ppk) - 0.2))), lp = B.ppk * Math.pow(2, L), tk = SAT.TILE / lp;
      // one frame budget for the map: 62's (IM.budgetMs) when it is there, so a caller that lifts it lifts both
      const t0 = now(), budget = (UI.INKMAP && UI.INKMAP.budgetMs) || SAT.budgetMs; let late = false;
      const tx0 = Math.max(0, Math.floor(vx / tk)), tx1 = Math.min(Math.ceil(KW / tk) - 1, Math.floor((vx + vw) / tk));
      const ty0 = Math.max(0, Math.floor(vy / tk)), ty1 = Math.min(Math.ceil(KH / tk) - 1, Math.floor((vy + vh) / tk));
      const ts = [];
      for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
        let t = tile(w, B, L, tx, ty, false);
        if (!t && now() - t0 < budget) t = tile(w, B, L, tx, ty, true);
        if (!t) { late = true; continue; }
        ts.push([t, tx, ty]);
      }
      // CI run 88 (inkTiming: zoom 8 and the war room at 9 over twice the release): the whole continent, scaled up
      // eight times and more under the tiles at high quality, cost most of a close frame. It is now drawn only as the
      // stand-in for a late tile, at low quality; the tiles, rendered within a factor of two of the screen's scale,
      // are drawn at medium.
      if (late) drawBase('low');
      ctx.imageSmoothingQuality = SAT.TILE_Q;
      for (const [t, tx, ty] of ts) {
        const dx = Math.round(X(tx * tk)), dy = Math.round(Y(ty * tk));
        ctx.drawImage(t, dx, dy, Math.round(X((tx + 1) * tk)) - dx, Math.round(Y((ty + 1) * tk)) - dy);
      }
      if (late) { SAT.stats.late++; redrawLater(ctx.canvas); }
    } else {
      // the whole continent as one picture: the base and its big rivers laid once per world at a scale and a half, so
      // a far view costs one copy, not a high-quality scaling and the rivers' strokes every frame (CI run 88)
      const P = VM.lowPic(w, B);
      // scaled by 0.6 and more, plain bilinear smoothing is enough and costs a fifth of the mipmapped kind
      ctx.imageSmoothingQuality = KW * sx >= 0.6 * P.width ? 'low' : 'medium'; ctx.drawImage(P, X(0), Y(0), KW * sx, KH * sy);
      ctx.restore();
      return true;
    }
    VM.drawRivers(ctx, vx, vy, sx, sy, W, H);
    ctx.restore();
    return true;
  };
  let low = null;
  VM.lowPic = function (w, B) {
    if (low && low.seed === w.key) return low.cv;
    const W2 = Math.round(SAT.BASE_W * 1.5), H2 = Math.round(W2 * KH / KW), sx = W2 / KW, sy = H2 / KH;
    const cv = document.createElement('canvas'); cv.width = W2; cv.height = H2;
    const c = cv.getContext('2d');
    c.fillStyle = SAT.SEA; c.fillRect(0, 0, W2, H2);
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(B.cv, 0.5 * B.kc * sx, 0.5 * B.kc * sy, B.cv.width / B.s * B.kc * sx, B.cv.height / B.s * B.kc * sy);
    // the rivers as wide as they are drawn at the continent's whole width on a laptop's map (0.157 px a km)
    VM.drawRivers(c, 0, 0, sx, sy, W2, H2, sx / 0.157);
    low = { seed: w.key, cv };
    return cv;
  };

  // ---- rivers: smoothed polylines in km, wider with flow; the small ones only once zoomed in
  VM.drawRivers = function (ctx, vx, vy, sx, sy, W, H, kAt) {
    const w = VM.w; if (!w || !w.rivers) return;
    if (!w.riverBox) w.riverBox = w.rivers.map(a => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, f = 0; for (let i = 0; i < a.length; i += 3) { x0 = Math.min(x0, a[i]); x1 = Math.max(x1, a[i]); y0 = Math.min(y0, a[i + 1]); y1 = Math.max(y1, a[i + 1]); f = Math.max(f, a[i + 2]); } return { x0, y0, x1, y1, f }; });
    const zoom = KW / (W / sx), minF = SAT.RIVER_MIN * (zoom < 2 ? 2.5 : zoom < 4 ? 1.5 : 1);
    const x1v = vx + W / sx, y1v = vy + H / sy, k = kAt || Math.sqrt(Math.max(sx, sy) / 0.157);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(52,92,118,0.92)';
    // short runs, each as wide as its flow; the runs of one width (to a quarter pixel) go in one path and one stroke,
    // and a run wholly outside the view is left out (CI run 88: thousands of strokes a frame, most of them unseen)
    const byW = new Map(), m = 4, x1c = W + m, y1c = H + m;
    for (let r = 0; r < w.rivers.length; r++) {
      const b = w.riverBox[r]; if (b.f < minF || b.x1 < vx || b.x0 > x1v || b.y1 < vy || b.y0 > y1v) continue;
      const a = w.rivers[r];
      for (let i = 0; i < a.length - 3; i += 6) {
        const f = a[i + 2]; if (f < minF) continue;
        const e = Math.min(a.length - 3, i + 9);
        let lx = 1e9, ly = 1e9, hx = -1e9, hy = -1e9;
        for (let j = i; j <= e; j += 3) { const px = (a[j] - vx) * sx, py = (a[j + 1] - vy) * sy; if (px < lx) lx = px; if (px > hx) hx = px; if (py < ly) ly = py; if (py > hy) hy = py; }
        if (hx < -m || lx > x1c || hy < -m || ly > y1c) continue;
        const lw = Math.round(Math.max(0.5, Math.min(3.2, (Math.log(f / SAT.RIVER_MIN) * 0.45 + 0.35) * k)) * 4) / 4;
        let p = byW.get(lw); if (!p) { p = []; byW.set(lw, p); }
        p.push(i, e, r);
      }
    }
    for (const [lw, runs] of byW) {
      ctx.lineWidth = lw; ctx.beginPath();
      for (let n = 0; n < runs.length; n += 3) {
        const i = runs[n], e = runs[n + 1], a = w.rivers[runs[n + 2]];
        ctx.moveTo((a[i] - vx) * sx, (a[i + 1] - vy) * sy);
        for (let j = i + 3; j <= e; j += 3) ctx.lineTo((a[j] - vx) * sx, (a[j + 1] - vy) * sy);
      }
      ctx.stroke();
    }
  };

  // ---- the hook: 62's MAP.ground (and the release's relief picture after it) give way to the satellite ground
  const ground0 = MAP.ground;
  MAP.ground = function (ctx, W, H, v) {
    if (VM.drawOn()) { try { return VM.drawGround(ctx, W, H, v); } catch (e) { console.error('v2 map', e); } }
    return ground0 ? ground0.apply(this, arguments) : false;
  };
  VM.onUse = () => { VM.satReset(); };
})();

// Playtest 2, #20: on a phone the full map filled only the top third of the screen. Its canvas is 1100 x 720 at the
// page's width, so at 420 px it stood 256 px high above an empty modal. On a narrow, upright screen the canvas now
// takes the height there is room for (up to 1.7 times its width), and the view takes the canvas's shape: the
// continent at its full height, a slice of its width, centred on your home, panned with a finger. UI.wrClampView is
// the full map's alone (the war room clamps with UI.wrClamp), so its aspect follows the canvas. Drawing only: the view
// is UI state, never A.S.
(function () {
  if (typeof document === 'undefined' || typeof UI.gmDraw !== 'function' || typeof UI.wrClampView !== 'function') return;
  const VM = A.V2MAP, ASP = 1100 / 720, KW = 7000, KH = 4500;
  VM.gmAsp = () => { const cv = document.getElementById('gmap'); return cv && cv.width && cv.height ? cv.width / cv.height : ASP; };
  const clamp0 = UI.wrClampView;
  UI.wrClampView = function (v) {
    const asp = VM.gmAsp();
    if (Math.abs(asp - ASP) < 1e-3) return clamp0.apply(this, arguments);
    v.w = A.clamp(v.w, 500, KW); v.h = v.w / asp;
    if (v.h > KH) { v.h = KH; v.w = v.h * asp; }
    v.x0 = A.clamp(v.x0, 0, KW - v.w); v.y0 = A.clamp(v.y0, 0, KH - v.h);
    return v;
  };
  const fit0 = UI.gmFit;
  if (typeof fit0 === 'function') UI.gmFit = function () {
    const v = fit0.apply(this, arguments);
    if (v && v.w < KW - 1) { const pc = A.pc && A.pc(), hp = pc && A.prov(pc.home); v.x0 = (hp ? hp.sx : KW / 2) - v.w / 2; UI.wrClampView(v); }
    return v;
  };
  // the canvas's height for this screen, set once per canvas and screen size
  const fitted = new WeakMap();
  VM.fitGm = function (cv) {
    const key = innerWidth + 'x' + innerHeight;
    if (fitted.get(cv) === key) return;
    const r = cv.getBoundingClientRect(); if (!r.width) return;
    fitted.set(cv, key);
    let h = 720;
    if (innerWidth <= 600 && innerHeight > innerWidth * 1.2) {
      // room for the line under the map and the legend's heading below it; the release caps a map canvas at 52vh
      // under 900 px (the war room keeps that cap)
      const room = innerHeight - Math.max(0, r.top) - 132;
      h = Math.round(cv.width * Math.max(r.width / ASP, Math.min(r.width * 1.7, room)) / r.width);
      cv.style.maxHeight = 'none';
    } else cv.style.maxHeight = '';
    if (cv.height !== h) { cv.height = h; if (UI.gm && UI.gm.view) UI.wrClampView(UI.gm.view); }
  };
  const draw0 = UI.gmDraw;
  UI.gmDraw = function () {
    const cv = document.getElementById('gmap');
    if (cv) { try { VM.fitGm(cv); } catch (e) {} }
    return draw0.apply(this, arguments);
  };
})();

// The title is one composition with no map in it (86-title-fold, cycle 2, visual F1: "Begin a new life" in sight on a
// laptop). 86 took the strip out for the Great Continent only; with the Far Lands out of the build the release's strip
// came back and pushed the button under the fold, so it goes here too. The continent is seen from the first day.
(function () {
  const rt = UI.renderTitle;
  if (typeof rt !== 'function' || typeof document === 'undefined') return;
  UI.renderTitle = function () {
    const h = rt.apply(this, arguments);
    if (A.FAR || typeof h !== 'string' || h.indexOf('titlemap') < 0) return h;
    try {
      const t = document.createElement('template'); t.innerHTML = h;
      const m = t.content.querySelector('#titlemap'); if (m) m.remove();
      return t.innerHTML;
    } catch (e) { return h; }
  };
})();
