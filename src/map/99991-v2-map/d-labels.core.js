// Names and the realms' tints on the satellite map (playtest 1, #21 and #4).
//   - Names: the map's canvas is drawn at a fixed size and shown smaller on a phone (at 420 px the realms' names were
//     about 5 px tall and ran into each other), so every size here is set in on-screen (CSS) pixels and scaled by the
//     canvas's own ratio: a realm's name is never under LABEL_MIN px, a province's never under PROV_MIN. Names are
//     placed by importance (the player's realm, then the selected one, then the most peopled); a name that would
//     touch one already written is left for a closer zoom. The player's realm and its capital are always written.
//     Light letters on a dark halo, as on a satellite picture.
//   - Tints: the Realms mode read as a parchment wash (62's browned, thinned colours). Over the satellite ground each
//     realm is a translucent tint of its own colour, stronger in a band along its borders, with no browning and no
//     paper; the lines are 62's vector borders. The other modes keep their colours, as tints too.
// Rendering only: no A.rand, nothing written to A.S.
(function () {
  const VM = A.V2MAP;
  VM.LABEL_MIN = 11; VM.PROV_MIN = 10;
  const KW = 7000, KH = 4500;
  VM.labelsPlaced = [];        // the last draw's names: boxes in canvas pixels, and their on-screen size (the tests read them)
  const ratioOf = (ctx, W) => { let d = 0; try { d = ctx.canvas && ctx.canvas.getBoundingClientRect ? ctx.canvas.getBoundingClientRect().width : 0; } catch (e) {} return d > 0 ? W / d : 1; };

  VM.drawLabels = function (ctx, W, H, v, o) {
    const S = A.S, opts = typeof o === 'object' && o ? o : {};
    const whole = !v || !!v.whole, vx = v ? v.x0 : 0, vy = v ? v.y0 : 0, vw = v ? v.w : KW, vh = v ? v.h : KH, sx = W / vw, sy = H / vh, zoom = KW / vw;
    const k = ratioOf(ctx, W), placed = [], out = [];
    const pc = A.pc && A.pc(), hp = pc && A.prov(pc.home), mine = pc && (pc.ruler || (hp && hp.owner) || pc.realm), sel = UI.mapHl;
    const hit = b => placed.some(q => b[0] < q[0] + q[2] && b[0] + b[2] > q[0] && b[1] < q[1] + q[3] && b[1] + b[3] > q[1]);
    const write = (t, x, y, px, font, fill, force, kind) => {
      ctx.font = font; const w = ctx.measureText(t).width, pad = 2 * k;
      let b = [x - w / 2 - pad, y - px * 0.85 - pad, w + 2 * pad, px * 1.1 + 2 * pad];
      if (force) {   // kept inside the canvas, written whatever lies under it
        const dx = Math.max(0, -b[0]) - Math.max(0, b[0] + b[2] - W), dy = Math.max(0, -b[1]) - Math.max(0, b[1] + b[3] - H);
        x += dx; y += dy; b = [b[0] + dx, b[1] + dy, b[2], b[3]];
      } else if (b[0] < 0 || b[1] < 0 || b[0] + b[2] > W || b[1] + b[3] > H || hit(b)) return false;
      placed.push(b); out.push({ t, kind, x: b[0], y: b[1], w: b[2], h: b[3], px: px / k });
      ctx.font = font; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, px * 0.22); ctx.strokeStyle = 'rgba(14,12,10,.82)'; ctx.strokeText(t, x, y);
      ctx.fillStyle = fill; ctx.fillText(t, x, y);
      return true;
    };
    // playtest 2, old #21: 61's compass rose sits over the world map's corner and covered the name under it (the Amber
    // Isles); its box, in canvas pixels, is taken before any name, so a name there waits for another view
    try {
      const cv = ctx.canvas, rose = cv && cv.parentElement && cv.parentElement.querySelector(':scope > .il-compass');
      if (rose && rose.getClientRects().length) {
        const cr = cv.getBoundingClientRect(), rr = rose.getBoundingClientRect();
        if (cr.width > 0 && cr.height > 0 && rr.width > 0) {
          const fx = W / cr.width, fy = H / cr.height;
          placed.push([(rr.left - cr.left) * fx, (rr.top - cr.top) * fy, rr.width * fx, rr.height * fy]);
          VM.roseBox = placed[0].slice();
        }
      } else VM.roseBox = null;
    } catch (e) {}
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    if (opts.labels !== false) {
      const px = Math.max(VM.LABEL_MIN * k, whole ? W / 92 : Math.max(11, 15 - zoom) * Math.min(k, 1.4));
      const ids = Object.keys(S.realms).filter(id => { const r = S.realms[id]; return r.alive && r.capitalProv != null && (r.provCount >= 2 || opts.allLabels || zoom >= 2 || id === mine); });
      const rank = id => (id === mine ? 2 : 0) + (id === sel ? 1 : 0);
      ids.sort((a, b) => rank(b) - rank(a) || (S.realms[b].pop || 0) - (S.realms[a].pop || 0) || (a < b ? -1 : 1));
      for (const id of ids) {
        const r = S.realms[id], p = A.prov(r.capitalProv); if (!p) continue;
        const x = (p.sx - vx) * sx, y = (p.sy - vy) * sy;
        if (x < 0 || y < 0 || x > W || y > H) continue;
        const own = id === mine, f = `600 ${Math.round(px)}px Cinzel, Georgia, serif`;
        write(String(r.short).toUpperCase(), x, y - 7 * k, px, f, own ? '#f2cc6b' : '#f4ead2', own, 'realm');
        if (own) {     // the player's capital is named under its keep
          const cp = Math.max(VM.PROV_MIN * k, px * 0.8);
          write(p.name, x, y + 14 * k, cp, `italic ${Math.round(cp)}px Georgia, serif`, '#f2cc6b', true, 'capital');
        }
      }
    }
    if (!whole && zoom >= 1.8) {
      const px = Math.max(VM.PROV_MIN * k, (9 + Math.min(5, zoom)) * Math.min(k, 1.4)), f = `italic ${Math.round(px)}px Georgia, serif`;
      const ps = S.prov.filter(p => { const x = (p.sx - vx) * sx, y = (p.sy - vy) * sy; return x >= 0 && y >= 0 && x <= W && y <= H; })
        .sort((a, b) => (b.pop || 0) - (a.pop || 0) || a.id - b.id);
      for (const p of ps) {
        if (MAP.unnamed && MAP.unnamed(p, ctx)) continue;      // 9991-atlas-of-known-places: a place the player does not know is not named
        write(p.name, (p.sx - vx) * sx, (p.sy - vy) * sy + px * 1.3, px, f, p.occ ? '#ffab8a' : '#efe6cf', false, 'prov');
      }
    }
    ctx.restore();
    VM.labelsPlaced = out;
    return true;
  };
  const marks0 = MAP.marks;
  MAP.marks = function () {
    if (VM.drawOn && VM.drawOn()) { try { return VM.drawLabels.apply(this, arguments); } catch (e) { console.error('v2 labels', e); } }
    return marks0 ? marks0.apply(this, arguments) : false;
  };

  VM.overlay = function (mode, hl, focus) {
    mode = mode || 'political';    // as every caller defaults it
    MAP.init();
    const S = A.S, key = 'v2|' + mode + '|' + (MAP.cb() ? 'cb' : '') + '|' + (hl || '') + '|' + (focus || '') + '|' + S.year + '|' + (UI.mapVer || 0) + '|' +
      S.prov.map(p => p.owner + (p.occ || '')).join(',') + Object.values(S.realms).map(r => r.color + r.allies.length).join('');
    if (MAP.overlayCache && MAP.ownerKey === key) return MAP.overlayCache;
    const info = mode !== 'political' && mode !== 'terrain' && mode !== 'focus' ? MAP.modeInfo(mode, focus) : null;
    const { gw, gh, grid } = MAP, N = gw * gh, cv = document.createElement('canvas'); cv.width = gw; cv.height = gh;
    const c = cv.getContext('2d'), im = c.createImageData(gw, gh), d = im.data;
    const pcol = S.prov.map(p => info ? (p.owner === 'unclaimed' ? [120, 118, 110] : MAP.rgb(info.col[p.owner] || '#777')) : MAP.ownerColor(p.owner));
    const ocol = S.prov.map(p => p.occ ? (info ? MAP.rgb(info.col[p.occ] || '#777') : MAP.ownerColor(p.occ)) : null);
    const own = S.prov.map(p => p.owner);
    // cells from the nearest realm border, up to R (two chamfer passes)
    const R = 4, ds = new Uint8Array(N).fill(R);
    for (let i = 0; i < N; i++) {
      const pv = grid[i]; if (pv < 0) continue; const x = i % gw, o = own[pv];
      if ((x > 0 && grid[i - 1] >= 0 && own[grid[i - 1]] !== o) || (x < gw - 1 && grid[i + 1] >= 0 && own[grid[i + 1]] !== o) ||
        (i >= gw && grid[i - gw] >= 0 && own[grid[i - gw]] !== o) || (i + gw < N && grid[i + gw] >= 0 && own[grid[i + gw]] !== o)) ds[i] = 0;
    }
    for (let i = 0; i < N; i++) { const x = i % gw; if (x > 0 && ds[i - 1] + 1 < ds[i]) ds[i] = ds[i - 1] + 1; if (i >= gw && ds[i - gw] + 1 < ds[i]) ds[i] = ds[i - gw] + 1; }
    for (let i = N - 1; i >= 0; i--) { const x = i % gw; if (x < gw - 1 && ds[i + 1] + 1 < ds[i]) ds[i] = ds[i + 1] + 1; if (i + gw < N && ds[i + gw] + 1 < ds[i]) ds[i] = ds[i + gw] + 1; }
    for (let i = 0; i < N; i++) {
      const pv = grid[i], o = i * 4; if (pv < 0 || mode === 'terrain') continue;
      const x = i % gw, y = (i / gw) | 0;
      let col = pcol[pv]; if (ocol[pv] && (x + y) % 6 < 3) col = ocol[pv];
      let a = info ? 120 : (own[pv] === 'unclaimed' ? 18 : 72);
      if (hl && own[pv] === hl) a = 140; else if (hl && mode === 'focus') a = 22;
      a += (1 - ds[i] / R) * (info ? 50 : 85);
      d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = Math.min(200, Math.round(a));
    }
    // 62's rule (brief 7.3 / 1.6): of two bordering realms closer than 0.08 in OKLab, the smaller is hatched, so a border
    // never rests on colour alone. These tints replace 62's wash, which carried the hatching (CI run 88, inkBriefMarks).
    if (!info && mode !== 'terrain' && UI.INKMAP && typeof UI.INKMAP.hatch === 'function') UI.INKMAP.hatch(d, own, ds);
    c.putImageData(im, 0, 0);
    MAP.overlayCache = cv; MAP.ownerKey = key;
    return cv;
  };
  // 9991-atlas-of-known-places's veil over the satellite ground: the land you do not know lies under cloud, not under vellum (a
  // parchment sheet over a satellite picture read as a drawn map). Its own key gains the style, so the two never mix.
  VM.VEIL = [206, 213, 221]; VM.VEIL_ALPHA = [0.82, 0.45, 0];
  const AT = A.ATLAS;
  if (AT && typeof AT.veilLayer === 'function' && typeof AT.veilKey === 'function') {
    const vk = AT.veilKey, vl = AT.veilLayer;
    AT.veilKey = function () { return vk.apply(this, arguments) + (VM.drawOn && VM.drawOn() ? '|sat' : ''); };
    AT.veilLayer = function () {
      if (!(VM.drawOn && VM.drawOn())) return vl.apply(this, arguments);
      const c0 = AT.VEIL, a0 = AT.ALPHA; AT.VEIL = VM.VEIL; AT.ALPHA = VM.VEIL_ALPHA;
      try { return vl.apply(this, arguments); } finally { AT.VEIL = c0; AT.ALPHA = a0; }
    };
  }

  const ov0 = MAP.overlay;
  MAP.overlay = function () {
    if (VM.drawOn && VM.drawOn()) { try { return VM.overlay.apply(this, arguments); } catch (e) { console.error('v2 tints', e); } }
    return ov0.apply(this, arguments);
  };
})();
