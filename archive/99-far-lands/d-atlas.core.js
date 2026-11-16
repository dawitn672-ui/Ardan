// The far lands' atlas on the inked map (docs/design/brief.md 7.3: a day print, the line in ink, names in Cinzel):
// the ten lands' names from far off, the seas, the regions at a middle zoom, the ranges and rivers along their
// lines, the lakes, straits and passes close in, and the great routes (far@2's D.routes) as dotted roads. Drawn over
// the inked map's borders and towns (MAP.inkLines), under the realms' and towns' names (MAP.marks), in every view
// that draws the inked map: the world tab, the full map, the war room. Rendering only: no random numbers, nothing in
// A.S. A name that would cross one already written waits for another zoom; the most important are written first.
(function () {
  const FL = A.FAR; if (!FL || !FL.D) return;
  const D = FL.D, AT = D.atlas || null;
  const C = {
    land: 'rgba(70,46,24,.42)', sea: 'rgba(31,62,118,.72)', region: 'rgba(107,68,16,.62)', range: 'rgba(92,58,30,.78)', river: 'rgba(40,82,150,.80)',
    riverLine: 'rgba(52,96,160,.62)', lake: 'rgba(31,62,118,.80)', pass: 'rgba(92,40,24,.85)', road: 'rgba(128,52,30,.72)', halo: 'rgba(239,230,210,.80)',
  };
  FL.ATLAS_ZOOM = { land: [0, 1.3], sea: [0, 3.2], region: [1.1, 4.2], range: [0.75, 6], riverLine: [0.55, 99], river: [1.8, 99], lake: [1.5, 99], strait: [1.8, 99], pass: [2.2, 99], road: [0.55, 99], roadName: [2.6, 99] };
  const inBand = (k, z) => z >= FL.ATLAS_ZOOM[k][0] && z < FL.ATLAS_ZOOM[k][1];
  // the regions' middles, from the provinces of the open part (people-weighted would move a region to its towns)
  let regPos = null, regKey = null;
  const regions = () => {
    const key = FL.part && FL.part.key;
    if (regPos && regKey === key) return regPos;
    const acc = {}, Q = FL.provinces();
    for (const q of Q) { const g = q.region; if (!g) continue; const a = acc[g] || (acc[g] = { x: 0, y: 0, w: 0 }); a.x += q.sx * q.cells; a.y += q.sy * q.cells; a.w += q.cells; }
    regKey = key;
    return (regPos = Object.keys(acc).sort().filter(g => AT && AT.regions[g]).map(g => ({ g, name: AT.regions[g].replace(/^The /, '').toUpperCase(), x: acc[g].x / acc[g].w, y: acc[g].y / acc[g].w, w: acc[g].w })));
  };
  // the middle of a line, and the run of it a name can lie along
  const along = pts => {
    let L = 0; const seg = [];
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
    let acc = 0, i = 0; while (i < seg.length - 1 && acc + seg[i] < L / 2) acc += seg[i++];
    const t = seg[i] ? (L / 2 - acc) / seg[i] : 0, a = pts[i], b = pts[i + 1] || pts[i];
    let ang = Math.atan2(b[1] - a[1], b[0] - a[0]); if (ang > Math.PI / 2) ang -= Math.PI; if (ang < -Math.PI / 2) ang += Math.PI;
    return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, ang, len: L };
  };

  // a river's course: the lore's points through a spline, wound a little (a seeded wave along its length, none at
  // its ends), so it reads as water and not as a road; made once
  let riverCourse = null, riverKey = null;
  const wet = (x, y) => { const gx = Math.floor((x - MAP.KX0) / MAP.cell), gy = Math.floor((y - MAP.KY0) / MAP.cell); return gx < 0 || gy < 0 || gx >= MAP.gw || gy >= MAP.gh || MAP.grid[gy * MAP.gw + gx] < 0; };
  const courses = () => {
    if (riverCourse && riverKey === MAP.gridKey) return riverCourse;
    riverKey = MAP.gridKey;
    riverCourse = (AT ? AT.rivers : []).map(([name, pts, big], ri) => {
      const sp = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)], n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 12));
        for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t;
          sp.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
            0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); }
      }
      sp.push(pts[pts.length - 1]);
      let L = 0; const cum = [0]; for (let i = 1; i < sp.length; i++) { L += Math.hypot(sp[i][0] - sp[i - 1][0], sp[i][1] - sp[i - 1][1]); cum.push(L); }
      const out = sp.map(([x, y], i) => {
        const a = sp[Math.max(0, i - 1)], b = sp[Math.min(sp.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1, s2 = cum[i];
        const taper = Math.min(1, s2 / 80, (L - s2) / 80), A2 = (big ? 22 : 14) * taper;
        const w = Math.sin(s2 / 37 + ri * 1.7) * 0.55 + Math.sin(s2 / 91 + ri * 0.6) * 0.45;
        return [x - dy / m * A2 * w, y + dx / m * A2 * w];
      });
      // a river ends at its mouth: the points past the last on land are the sea's
      let end = out.length; while (end > 2 && wet(out[end - 1][0], out[end - 1][1])) end--;
      return [name, out.slice(0, Math.min(out.length, end + 1)), big];
    });
    return riverCourse;
  };
  FL.drawAtlas = function (ctx, W, H, V) {
    if (!FL.active || !MAP.big || !V) return 0;
    const zoom = MAP.ZREF / V.w, sx = W / V.w, sy = H / V.h, X = x => (x - V.x0) * sx, Y = y => (y - V.y0) * sy;
    const K = Math.max(0.8, Math.min(1.6, W / 1100));
    const boxes = [], free = (x, y, w, h, ang) => {
      const r = ang ? Math.abs(Math.sin(ang)) : 0, bw = w * (1 - r) + h * r + 4, bh = h * (1 - r) + w * r + 2;
      const b = [x - bw / 2, y - bh / 2, bw, bh];
      if (b[0] > W || b[1] > H || b[0] + b[2] < 0 || b[1] + b[3] < 0) return false;
      if (boxes.some(o => b[0] < o[0] + o[2] && b[0] + b[2] > o[0] && b[1] < o[1] + o[3] && b[1] + b[3] > o[1])) return false;
      boxes.push(b); return true;
    };
    let n = 0;
    const text = (t, x, y, font, fill, o = {}) => {
      ctx.font = font; if ('letterSpacing' in ctx) ctx.letterSpacing = (o.sp || 0) + 'px';
      const w = ctx.measureText(t).width, h = parseFloat(/(\d+(?:\.\d+)?)px/.exec(font)[1]) * 1.2;
      if (!free(x, y, w, h, o.ang)) return false;
      ctx.save(); ctx.translate(x, y); if (o.ang) ctx.rotate(o.ang);
      ctx.lineWidth = o.halo || 3; ctx.strokeStyle = C.halo; ctx.lineJoin = 'round'; ctx.strokeText(t, 0, 0); ctx.fillStyle = fill; ctx.fillText(t, 0, 0);
      ctx.restore(); n++; return true;
    };
    const path = (pts, close) => { ctx.beginPath(); pts.forEach(([x, y], i) => { const px = X(x), py = Y(y); if (!i) ctx.moveTo(px, py); else if (i < pts.length - 1 && !close) { const [nx, ny] = pts[i + 1], mx = (px + X(nx)) / 2, my = (py + Y(ny)) / 2; ctx.quadraticCurveTo(px, py, mx, my); } else ctx.lineTo(px, py); }); };
    const vis = pts => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; } return x1 >= V.x0 - 200 && x0 <= V.x0 + V.w + 200 && y1 >= V.y0 - 200 && y0 <= V.y0 + V.h + 200; };
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    try {
      // the lines first: rivers, then the routes dotted over them
      if (AT && inBand('riverLine', zoom)) {
        ctx.strokeStyle = C.riverLine; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (const [, pts, big] of courses()) {
          if (!vis(pts)) continue; ctx.lineWidth = Math.max(0.8, Math.min(3.2, (big ? 1.2 : 0.8) * Math.sqrt(zoom) * K));
          ctx.beginPath(); pts.forEach(([x, y], i) => { if (i) ctx.lineTo(X(x), Y(y)); else ctx.moveTo(X(x), Y(y)); }); ctx.stroke();
        }
      }
      if (D.routes && inBand('road', zoom) && FL.part === D) {
        ctx.strokeStyle = C.road; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1, Math.min(2.6, 1.1 * Math.sqrt(zoom) * K));
        const dot = Math.max(1.5, 2 * K), gap = Math.max(4, 5.5 * K);
        for (const r of D.routes) {
          if (!vis(r.pts)) continue;
          ctx.setLineDash(r.k === 'sea' ? [dot * 3, gap * 1.4] : [dot, gap]); path(r.pts); ctx.stroke();
        }
        ctx.setLineDash([]);
      }
      // the names, the most important first
      if (inBand('land', zoom)) {
        const fs = Math.round(Math.max(11, Math.min(22, W / 62 * (0.6 + zoom * 0.5))));
        for (const p of FL.landNames()) {
          let x = X(p.x), y = Y(p.y); if (x < -200 || y < -40 || x > W + 200 || y > H + 40) continue;
          ctx.font = `italic 600 ${fs}px Cinzel, Georgia, serif`; const w = ctx.measureText(p.name).width + fs * 0.35 * p.name.length;
          x = Math.max(w / 2 + 6, Math.min(W - w / 2 - 6, x));
          for (let k = 0; k < 6 && !text(p.name, x, y, `italic 600 ${fs}px Cinzel, Georgia, serif`, C.land, { sp: Math.round(fs * 0.35) }); k++) y += fs * 1.3;
        }
      }
      if (AT && inBand('sea', zoom)) {
        const fs = Math.round(Math.max(11, Math.min(19, 13 * K * (0.7 + zoom * 0.25))));
        for (const [name, x, y] of AT.seas) text(name, X(x), Y(y), `italic 500 ${fs}px Cinzel, Georgia, serif`, C.sea, { sp: Math.round(fs * 0.18) });
      }
      if (AT && inBand('region', zoom)) {
        const fs = Math.round(Math.max(9, Math.min(14, 10 * K * (0.75 + zoom * 0.12))));
        for (const r of regions().slice().sort((a, b) => b.w - a.w)) text(r.name, X(r.x), Y(r.y), `600 ${fs}px Cinzel, Georgia, serif`, C.region, { sp: Math.round(fs * 0.3) });
      }
      if (AT && inBand('range', zoom)) {
        const fs = Math.round(Math.max(9, Math.min(15, 10.5 * K * (0.8 + zoom * 0.15))));
        for (const [name, pts] of AT.ranges) { if (!vis(pts)) continue; const m = along(pts); if (m.len * sx < name.length * fs * 0.45) continue; text(name, X(m.x), Y(m.y) - fs * 0.9, `italic 600 ${fs}px Georgia, serif`, C.range, { ang: m.ang, sp: Math.round(fs * 0.25) }); }
      }
      if (AT) {
        const fs = Math.round(Math.max(9, Math.min(13, 9.5 * K * (0.8 + zoom * 0.1))));
        if (inBand('lake', zoom)) for (const [name, x, y, area] of AT.lakes) if (area >= 15000 || zoom >= 3) text(name, X(x), Y(y), `italic ${fs}px Georgia, serif`, C.lake);
        if (inBand('river', zoom)) for (const [name, pts] of AT.rivers) { if (!vis(pts)) continue; const m = along(pts); text(name, X(m.x), Y(m.y) - fs * 0.8, `italic ${fs}px Georgia, serif`, C.river, { ang: m.ang }); }
        if (inBand('strait', zoom)) for (const [name, x, y] of AT.straits) text(name, X(x), Y(y) + fs, `italic ${fs}px Georgia, serif`, C.sea);
        if (inBand('pass', zoom)) {
          for (const [name, x, y] of AT.passes) {
            const px = X(x), py = Y(y); if (px < -20 || py < -20 || px > W + 20 || py > H + 20) continue;
            // a pass: two brackets back to back, the old maps' mark
            ctx.save(); ctx.strokeStyle = C.pass; ctx.lineWidth = 1.4 * K; const s = 4 * K;
            ctx.beginPath(); ctx.arc(px - s * 1.6, py, s * 1.2, -0.9, 0.9); ctx.stroke(); ctx.beginPath(); ctx.arc(px + s * 1.6, py, s * 1.2, Math.PI - 0.9, Math.PI + 0.9); ctx.stroke(); ctx.restore();
            text(name, px, py + fs * 1.2, `italic ${fs}px Georgia, serif`, C.pass);
          }
        }
      }
      if (D.routes && inBand('roadName', zoom) && FL.part === D) {
        const fs = Math.round(Math.max(9, Math.min(12, 9 * K)));
        const seen = new Set();
        for (const r of D.routes) { if (seen.has(r.id) || !vis(r.pts) || r.pts.length < 2) continue; const m = along(r.pts); if (text(r.n.replace(/:.*$/, ''), X(m.x), Y(m.y) + fs * 0.9, `italic ${fs}px Georgia, serif`, C.road, { ang: m.ang })) seen.add(r.id); }
      }
    } catch (e) { if (typeof console !== 'undefined') console.error(e); }
    ctx.restore();
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    FL.atlasDrawn = n;
    return n;
  };
  const inkLines = MAP.inkLines;
  if (typeof inkLines === 'function') MAP.inkLines = function (ctx, W, H, v) {
    const r = inkLines.apply(this, arguments);
    try { if (r && FL.active && MAP.big) FL.drawAtlas(ctx, W, H, v || MAP.whole(W, H)); } catch (e) { console.error(e); }
    return r;
  };
})();
