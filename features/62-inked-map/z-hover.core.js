// 62-inked-map, the hover outline (cycle 2, lane G; brief §7.3: "hover shows a 1 px --accent outline"). On the full
// map, the realm under the pointer has its border drawn over in gold, thin, beside the clicked realm's glow. The
// pointer's place is a hint the UI keeps (UI.mapHov, never in A.S); a move redraws at most once a frame, from the
// map's kept picture. Drawing only: no A.rand, no change to A.S. Styling: this file adds no engine hook.
(function () {
  const IM = UI.INKMAP;
  if (!IM || typeof IM.selGlow !== 'function' || typeof document === 'undefined') return;
  UI.mapHov = null;
  const realmAt = function (cv, ev) {
    const v = UI.gm && UI.gm.view, g = IM.geo && IM.geo(); if (!v || !g || !A.S) return null;
    const r = cv.getBoundingClientRect(); if (!r.width) return null;
    const kx = v.x0 + (ev.clientX - r.left) / r.width * v.w, ky = v.y0 + (ev.clientY - r.top) / r.height * v.h;
    const C = MAP.cell || 10, gx = Math.floor((kx - (MAP.KX0 || 0)) / C), gy = Math.floor((ky - (MAP.KY0 || 0)) / C);
    if (gx < 0 || gy < 0 || gx >= g.gw || gy >= g.gh) return null;
    const pid = g.grid[gy * g.gw + gx], p = pid >= 0 ? A.S.prov[pid] : null;
    return p && p.owner && A.S.realms[p.owner] ? p.owner : null;
  };
  // the outline: the same border pieces selGlow traces, for the realm under the pointer
  IM.hoverLine = function (ctx, W, H, v) {
    const id = UI.mapHov, cv = ctx.canvas; if (!id || id === UI.mapHl || !cv || cv.id !== 'gmap' || !A.S) return 0;
    const g = IM.geo(), S = A.S, vx = v ? v.x0 : 0, vy = v ? v.y0 : 0, vw = v ? v.w : (MAP.KW || 7000), vh = v ? v.h : (MAP.KH || 4500);
    const sx = W / vw, sy = H / vh, path = new Path2D(); let n = 0;
    for (const o of g.provPieces) {
      if (o.x1 < vx || o.x0 > vx + vw || o.y1 < vy || o.y0 > vy + vh) continue;
      const pa = S.prov[o.a], pb = S.prov[o.b]; if (!pa || !pb || (pa.owner === id) === (pb.owner === id)) continue;
      const a = o.pts; path.moveTo((a[0] - vx) * sx, (a[1] - vy) * sy); for (let i = 2; i < a.length; i += 2) path.lineTo((a[i] - vx) * sx, (a[i + 1] - vy) * sy); n++;
    }
    if (!n) return 0;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(27,23,48,.55)'; ctx.lineWidth = 3.2; ctx.stroke(path);
    ctx.strokeStyle = '#f0c062'; ctx.lineWidth = 1.4; ctx.stroke(path);
    ctx.restore();
    return n;
  };
  const sel = IM.selGlow;
  IM.selGlow = function (ctx, W, H, v) { const r = sel.apply(this, arguments); try { IM.hoverLine(ctx, W, H, v); } catch (e) {} return r; };
  let pend = 0;
  document.addEventListener('pointermove', ev => {
    const cv = ev.target; if (!cv || cv.id !== 'gmap' || ev.buttons) return;
    const id = realmAt(cv, ev);
    if (id === UI.mapHov) return;
    UI.mapHov = id;
    if (!pend) pend = requestAnimationFrame(() => { pend = 0; try { if (document.getElementById('gmap') && UI.gmDraw) UI.gmDraw(); } catch (e) {} });
  }, { passive: true });
  document.addEventListener('pointerleave', ev => { if (ev.target && ev.target.id === 'gmap' && UI.mapHov) { UI.mapHov = null; try { UI.gmDraw(); } catch (e) {} } }, true);
})();
