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
  const SAT = VM.SAT = { BASE_W: 934, TILE: 256, MAXL: 6, budgetMs: 24, LIMIT: 140, RIVER_MIN: 120, SEA: '#0e2240' };
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
    if (base && base.seed === w.seed) return base;
    const t0 = now(), s = SAT.BASE_W / w.gen.W, kc = KW / w.gen.W;
    base = { seed: w.seed, cv: toCanvas(A.V2.render.renderMap(w.gen, { scale: s })), s, kc, ppk: s / kc };
    SAT.stats.baseMs = Math.round(now() - t0);
    return base;
  };
  // ---- tiles for the closer views
  const cache = new Map(); let cacheSeed = null;
  VM.satReset = () => { cache.clear(); cacheSeed = null; };
  const tile = (w, B, L, tx, ty, make) => {
    if (cacheSeed !== w.seed) { cache.clear(); cacheSeed = w.seed; }
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
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    // the base picture: its pixel i sits at km (i / s + 0.5) * kc
    const X = km => (km - vx) * sx, Y = km => (km - vy) * sy;
    ctx.drawImage(B.cv, X(0.5 * B.kc), Y(0.5 * B.kc), B.cv.width / B.s * B.kc * sx, B.cv.height / B.s * B.kc * sy);
    const ppk = Math.max(sx, sy);
    if (ppk > B.ppk * 1.3) {
      const L = Math.max(1, Math.min(SAT.MAXL, Math.ceil(Math.log2(ppk / B.ppk) - 0.2))), lp = B.ppk * Math.pow(2, L), tk = SAT.TILE / lp;
      const t0 = now(); let late = false;
      const tx0 = Math.max(0, Math.floor(vx / tk)), tx1 = Math.min(Math.ceil(KW / tk) - 1, Math.floor((vx + vw) / tk));
      const ty0 = Math.max(0, Math.floor(vy / tk)), ty1 = Math.min(Math.ceil(KH / tk) - 1, Math.floor((vy + vh) / tk));
      for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
        let t = tile(w, B, L, tx, ty, false);
        if (!t && now() - t0 < SAT.budgetMs) t = tile(w, B, L, tx, ty, true);
        if (!t) { late = true; continue; }
        const dx = Math.round(X(tx * tk)), dy = Math.round(Y(ty * tk));
        ctx.drawImage(t, dx, dy, Math.round(X((tx + 1) * tk)) - dx, Math.round(Y((ty + 1) * tk)) - dy);
      }
      if (late) { SAT.stats.late++; redrawLater(ctx.canvas); }
    }
    VM.drawRivers(ctx, vx, vy, sx, sy, W, H);
    ctx.restore();
    return true;
  };

  // ---- rivers: smoothed polylines in km, wider with flow; the small ones only once zoomed in
  VM.drawRivers = function (ctx, vx, vy, sx, sy, W, H) {
    const w = VM.w; if (!w || !w.rivers) return;
    if (!w.riverBox) w.riverBox = w.rivers.map(a => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, f = 0; for (let i = 0; i < a.length; i += 3) { x0 = Math.min(x0, a[i]); x1 = Math.max(x1, a[i]); y0 = Math.min(y0, a[i + 1]); y1 = Math.max(y1, a[i + 1]); f = Math.max(f, a[i + 2]); } return { x0, y0, x1, y1, f }; });
    const zoom = KW / (W / sx), minF = SAT.RIVER_MIN * (zoom < 2 ? 2.5 : zoom < 4 ? 1.5 : 1);
    const x1v = vx + W / sx, y1v = vy + H / sy, k = Math.sqrt(Math.max(sx, sy) / 0.157);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(52,92,118,0.92)';
    for (let r = 0; r < w.rivers.length; r++) {
      const b = w.riverBox[r]; if (b.f < minF || b.x1 < vx || b.x0 > x1v || b.y1 < vy || b.y0 > y1v) continue;
      const a = w.rivers[r];
      // stroke in short runs, each as wide as its flow
      for (let i = 0; i < a.length - 3; i += 6) {
        const f = a[i + 2]; if (f < minF) continue;
        ctx.lineWidth = Math.max(0.5, Math.min(3.2, (Math.log(f / SAT.RIVER_MIN) * 0.45 + 0.35) * k));
        ctx.beginPath(); ctx.moveTo((a[i] - vx) * sx, (a[i + 1] - vy) * sy);
        for (let j = i + 3; j <= Math.min(a.length - 3, i + 9); j += 3) ctx.lineTo((a[j] - vx) * sx, (a[j + 1] - vy) * sy);
        ctx.stroke();
      }
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
