// The world's frame, read from the map instead of written into the code (stage 1 of
// docs/plan/world-expansion-architecture.md). The release draws and clamps every map for a 7,000 x 4,500 km box; the
// patches in patches.mjs replace those literals with what is defined here, so a larger grid (the Great Continent,
// c-lands.core.js) is drawn, panned and clicked like the world as written. At today's size every value below is the
// release's own number, and MAP.whole returns null, so the release's drawing runs unchanged (flFrameIdentical).
//
//   MAP.cell          km per grid cell (10)
//   MAP.KW, MAP.KH    the frame in km: MAP.gw * cell by MAP.gh * cell (7,000 x 4,500 for the world as written)
//   MAP.KX0, MAP.KY0  the km at the frame's top left corner (grid cell 0, 0): 0, 0 for the world as written; a
//                     larger frame may reach west or north of the Known World (the Great Continent's runs to 75 N), so
//                     km -> cell is (km - KX0) / cell. No km coordinate ever moves.
//   MAP.big           true when the frame is not the world as written
//   MAP.ZREF          the view width, in km, that is "zoom 1" (7,000): a scale, so town icons, names and banners
//                     appear at the same km per pixel in any frame
//   MAP.IW, MAP.IH    the km the release's relief picture (LORE.terrainJpg) covers: the Known World
//   MAP.whole(W, H)   the view {x0, y0, w, h, whole} that shows the whole frame in a W x H canvas, letterboxed in sea;
//                     null at today's size (the release then draws the world stretched to the canvas, as it always did)
//   MAP.fit()         the full map's opening view: the whole frame, or (in a larger one) the part around your home
//   MAP.relief(...)   the relief picture for a view in a larger frame (only when the inked map is off)
//   MAP.blitWorld     lays a grid-resolution layer (the realm wash) under a whole-frame view
//   MAP.init          builds the grid from parts: the map as written, plus what MAP.want() names (a far part)
//
// Rendering only: nothing here draws a random number or writes A.S.
(function () {
  const BASE = LORE.map;
  MAP.cell = BASE.cell || 10;
  MAP.ZREF = 7000;
  MAP.IW = BASE.gw * MAP.cell; MAP.IH = BASE.gh * MAP.cell;
  MAP.KX0 = 0; MAP.KY0 = 0;
  MAP.frame = function () {
    const gw = MAP.gw || BASE.gw, gh = MAP.gh || BASE.gh;
    MAP.KW = gw * MAP.cell; MAP.KH = gh * MAP.cell;
    MAP.big = gw !== BASE.gw || gh !== BASE.gh;
  };
  MAP.frame();

  MAP.whole = function (W, H) {
    if (!MAP.big) return null;
    const s = Math.min(W / MAP.KW, H / MAP.KH), w = W / s, h = H / s;
    return { x0: MAP.KX0 + (MAP.KW - w) / 2, y0: MAP.KY0 + (MAP.KH - h) / 2, w, h, whole: true };
  };
  // the full map opens on the whole frame (the release's view) or, in a frame wider than the map's shape, on the
  // part of it that holds your home
  MAP.fit = function () {
    const v = { x0: MAP.KX0, y0: MAP.KY0, w: MAP.KW, h: MAP.KH };
    if (!MAP.big) return v;
    const pc = A.S && A.pc && A.pc(), hp = pc && A.prov && A.prov(pc.home);
    const asp = 1100 / 720, w = Math.min(MAP.KW, MAP.KH * asp);
    if (hp && w < MAP.KW) v.x0 = Math.max(MAP.KX0, Math.min(MAP.KX0 + MAP.KW - w, hp.sx - w / 2));
    return v;
  };
  MAP.blitWorld = function (ctx, layer, W, H, v) {
    ctx.drawImage(layer, (MAP.KX0 - v.x0) / v.w * W, (MAP.KY0 - v.y0) / v.h * H, MAP.KW / v.w * W, MAP.KH / v.h * H);
  };
  // the relief under view v in a larger frame: the release's picture where it reaches (the Known World), and a
  // relief of the far lands drawn from their terrain (MAP.farRelief, set by the part that brings them)
  MAP.relief = function (ctx, W, H, v) {
    const img = MAP.img;
    ctx.save(); ctx.fillStyle = 'rgb(36,57,74)'; ctx.fillRect(0, 0, W, H); ctx.restore();   // the picture's own sea, beyond it too
    if (img && img.complete && img.naturalWidth) ctx.drawImage(img, -v.x0 / v.w * W, -v.y0 / v.h * H, MAP.IW / v.w * W, MAP.IH / v.h * H);
    const far = MAP.farRelief && MAP.farRelief();
    if (far) { const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true; MAP.blitWorld(ctx, far, W, H, v); ctx.imageSmoothingEnabled = sm; }
  };

  // ---- the grid from parts. MAP.want() names the extra part for the current game (null: the map as written). A part
  // is { key, gw, gh, rle, x0, y0, ox, oy }: Uint16 pairs (province id + 1, run length) over its whole frame, 0 for
  // water; its top left corner at km (x0, y0); the cells of the map as written left as water and copied in at cell
  // (ox, oy).
  const decode = (rle, into) => {
    const bin = atob(rle), n = into.length;
    let k = 0;
    for (let i = 0; i + 3 < bin.length; i += 4) {
      const v = (bin.charCodeAt(i) | bin.charCodeAt(i + 1) << 8) - 1, len = bin.charCodeAt(i + 2) | bin.charCodeAt(i + 3) << 8;
      into.fill(v, k, Math.min(n, k + len));
      k += len;
    }
    return k;
  };
  MAP.decodeRle = decode;
  const init0 = MAP.init;
  MAP.gridKey = null;
  MAP.resetLayers = function () {
    MAP.overlayCache = null; MAP.ownerKey = ''; MAP.frontCache = null; MAP.frontKey = null;
    if (typeof UI !== 'undefined') { UI.wrOvCache = null; if (UI.INKMAP && UI.INKMAP.reset) UI.INKMAP.reset(); }
    MAP.farReliefCv = null;
  };
  MAP.init = function () {
    const want = MAP.want ? MAP.want() : null, key = want ? want.key : 'ardan';
    if (MAP.grid && MAP.gridKey === key) return;
    if (!MAP.grid && !MAP.img) {           // the first call: the release builds the map as written and loads its picture
      init0.apply(this, arguments);
      MAP.gridKey = 'ardan'; MAP.frame();
      if (!want) return;
    }
    const prev = MAP.grid;
    if (!want) {
      const g = new Int16Array(BASE.gw * BASE.gh);
      decode(BASE.rle, g);
      MAP.gw = BASE.gw; MAP.gh = BASE.gh; MAP.grid = g; MAP.KX0 = 0; MAP.KY0 = 0;
    } else {
      const gw = want.gw, gh = want.gh, g = new Int16Array(gw * gh).fill(-1);
      decode(want.rle, g);
      const b = new Int16Array(BASE.gw * BASE.gh);
      decode(BASE.rle, b);
      const ox = want.ox || 0, oy = want.oy || 0;
      for (let y = 0; y < BASE.gh; y++) g.set(b.subarray(y * BASE.gw, (y + 1) * BASE.gw), (y + oy) * gw + ox);
      MAP.gw = gw; MAP.gh = gh; MAP.grid = g; MAP.KX0 = want.x0 || 0; MAP.KY0 = want.y0 || 0;
    }
    MAP.gridKey = key; MAP.frame();
    if (prev) MAP.resetLayers();
  };
})();
