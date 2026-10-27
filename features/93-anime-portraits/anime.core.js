// Anime portraits (docs/design/brief.md §7.1, "Portraits: cel-shaded anime busts").
// Every person is drawn as a cel-shaded anime character instead of 63's woodcut miniature:
//   - a head built on the brief's proportions table (a 100 x 120 head box, the cranium a circle of radius 50), with the
//     eye line, eye size, chin, nose and mouth moving with age, sex and people;
//   - eyes in six layers (white with the lid's shadow, a two-tone iris, the pupil, two catchlights, the lash line with
//     its flick, the lower lid); brows that follow the mood;
//   - hair as a back mass, side locks and pointed bangs (12 bangs x 10 back masses x 6 extras, weighted by culture),
//     each with a hard shadow band and the "angel ring" highlight; greying with age;
//   - one hard shadow per part (light from the upper left), occlusion shadows under the bangs and the chin, coloured line
//     work (never black), a heavier outer silhouette and a rim light on the right edge in the ground's light colour;
//   - a cut-corner frame on a bokashi ground in the realm's tint, the house charge faint behind the head, gold for
//     rulers, the accent for nobles, an ink wash for the dead (who are desaturated);
//   - busts at any size (detail drops under 60, 44 and 28 px) and a 200 x 300 full figure for the profile.
// It reuses 63-miniatures' skeleton: parts hashed from the person's id, 63's culture table (UI.MINI.CULT), its wound,
// age and greying rules, the release's outfit and arms, the UI.set toggle and the fallback to the earlier portrait.
// Everything here is the UI's: no random draws, no change to the game state, the same SVG for the same person.
(function () {
  if (typeof PORTRAIT === 'undefined' || typeof PORTRAIT.svg !== 'function') return;
  const AP = UI.ANIME = {};
  window.PORTRAIT2 = AP;
  if (UI.set.anime == null) UI.set.anime = true;

  // ---- tokens (brief §1.1, §1.5, §7.1)
  const LINE = '#1b1730', SHADE = '#3a2f6b', WHITE = '#f6f1ea', RIM_COOL = '#a8c8ff', RIM_WARM = '#ffe7b0';
  const THEME = {
    dark: { surface: '#141a2c', strong: '#6e7bab', accent: '#f0c062', legend: '#ffb648', ink3: '#9a9cb8', tint: .18, wash: ['#3a3d4c', '#141a2c'] },
    light: { surface: '#faf7f0', strong: '#8c8270', accent: '#7f5100', legend: '#8a4f00', ink3: '#565a70', tint: .14, wash: ['#c9c6c0', '#faf7f0'] },
  };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
  // numbers are rounded to a step of about a sixth of a pixel and written short ("-.5", not "-0.5")
  let PREC = 10;
  const fmt = r => {
    if (r === (r | 0)) return '' + r;
    const s = '' + r;
    return s.charCodeAt(0) === 48 ? s.slice(1) : s.charCodeAt(1) === 48 && s.charCodeAt(0) === 45 ? '-' + s.slice(2) : s;
  };
  const R = n => fmt(Math.round(n * PREC) / PREC);
  // a tagged template that rounds every number (keeps the SVG small)
  const d = (s, ...v) => { let o = s[0]; for (let i = 0; i < v.length; i++) o += (typeof v[i] === 'number' ? R(v[i]) : v[i]) + s[i + 1]; return o; };
  // line widths keep one decimal (rounding them to whole units would merge the fine and the heavy lines)
  const RW = n => { const r = Math.round(n * 10) / 10; return !r ? '.1' : String(r).replace(/^0\./, '.'); };
  // transforms keep their scale exact (a rounded scale would move every part it holds)
  const TF = (x, y, k) => `translate(${Math.round(x * 100) / 100} ${Math.round(y * 100) / 100}) scale(${Math.round(k * 10000) / 10000})`;
  // a head's tilt: a few degrees about the neck, seeded by the person and leaning with the mood
  const tiltOf = L => L.baby ? 0 : Math.round((hs(L.p, 'tilt', 4.5) + ({ sad: 3, grin: -2, angry: -1.5, surprised: 1.5 }[L.expr.k] || 0)) * 10) / 10;
  const TT = (x, y, k, a) => TF(x, y, k) + (a ? ` rotate(${a} 50 112)` : '');

  // ---- colour: every colour from the state is checked as a hex colour first (never interpolated raw)
  const hexOk = c => {
    if (typeof c !== 'string') return null;
    if (/^#[0-9a-f]{6}$/i.test(c)) return c.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(c)) return '#' + c.slice(1).split('').map(x => x + x).join('').toLowerCase();
    return null;
  };
  const rgb = c => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const toHex = (r, g, b) => '#' + ((1 << 24) + (Math.round(clamp(r, 0, 255)) << 16) + (Math.round(clamp(g, 0, 255)) << 8) + Math.round(clamp(b, 0, 255))).toString(16).slice(1);
  const mix0 = (a, b, t) => { const x = rgb(a), y = rgb(b); return toHex(lerp(x[0], y[0], t), lerp(x[1], y[1], t), lerp(x[2], y[2], t)); };
  const mix = (a, b, t) => memo('m' + a + b + t, () => mix0(a, b, t));
  const mul = (a, b) => { const x = rgb(a), y = rgb(b); return toHex(x[0] * y[0] / 255, x[1] * y[1] / 255, x[2] * y[2] / 255); };
  function hsl(c) {
    const [r, g, b] = rgb(c).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    let h = 0, s = 0;
    if (mx !== mn) { const k = mx - mn; s = l > .5 ? k / (2 - mx - mn) : k / (mx + mn); h = (mx === r ? (g - b) / k + (g < b ? 6 : 0) : mx === g ? (b - r) / k + 2 : (r - g) / k + 4) / 6; }
    return [h, s, l];
  }
  function fromHsl(h, s, l) {
    h = ((h % 1) + 1) % 1;
    if (!s) return toHex(l * 255, l * 255, l * 255);
    const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = t => { t < 0 && (t += 1); t > 1 && (t -= 1); return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    return toHex(f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255);
  }
  // colour work is pure, so it is remembered (a page of portraits asks for the same few hundred colours)
  const MEMO = new Map();
  const memo = (k, f) => { let v = MEMO.get(k); if (v === undefined) { v = f(); if (MEMO.size > 4000) MEMO.clear(); MEMO.set(k, v); } return v; };
  const tune = (c, ds, dl, sMin = 0, sMax = 1, lMin = 0, lMax = 1) => memo('t' + c + ds + ',' + dl + ',' + sMin + ',' + sMax + ',' + lMin + ',' + lMax, () => { const [h, s, l] = hsl(c); return fromHsl(h, clamp(s * ds, sMin, sMax), clamp(l + dl, lMin, lMax)); });
  // the cel shadow: the base multiplied by --shade (brief §7.1), a little resaturated so skin does not go grey
  const shadeOf = (c, k, sat = 1) => memo('s' + c + k + ',' + sat, () => { const m = mix(c, mul(c, SHADE), k); if (sat === 1) return m; const [h, s, l] = hsl(m); return fromHsl(h, clamp(s * sat, 0, 1), l); });
  const lighter = (c, dl) => memo('l' + c + dl, () => { const [h, s, l] = hsl(c); return fromHsl(h, s * .92, clamp(l + dl, 0, .97)); });
  // the dead: every colour of the figure at 20% chroma
  const desat = c => memo('d' + c, () => { const [h, s, l] = hsl(c); return fromHsl(h, s * .2, l); });

  // ---- a pure hash (FNV-1a) of the person's id and a key: every "choice" in a portrait comes from it
  const hash = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const hf = (p, k) => (hash((p.id || p.given || 'x') + '|' + k) % 10007) / 10007;
  const hs = (p, k, a) => lerp(-a, a, hf(p, k));          // a seeded offset in [-a, a]
  const pickW = (p, k, w) => {
    let t = 0; for (const x in w) t += Math.max(0, w[x]);
    let r = hf(p, k) * t; for (const x in w) { r -= Math.max(0, w[x]); if (r < 0) return x; }
    return Object.keys(w)[0];
  };

  // ---- a compact path writer: absolute points are rounded first, then written as relative steps (no drift), with no
  //      space before a minus sign and the command letter left out when it repeats
  function emit(segs, start) {
    const P = PREC;
    let out = '', cx = start ? Math.round(start[0] * P) : 0, cy = start ? Math.round(start[1] * P) : 0, sx = cx, sy = cy, last = '';
    // coordinates are kept as integers in units of 1/PREC, so every step is exact
    const put = (v, first) => { const t = fmt(v / P); out += first || t.charCodeAt(0) === 45 ? t : ' ' + t; };
    for (let k = 0; k < segs.length; k++) {
      const g = segs[k], c = g[0];
      if (c === 'Z') { out += 'z'; cx = sx; cy = sy; last = 'z'; continue; }
      if (c === 'M') { cx = sx = Math.round(g[1] * P); cy = sy = Math.round(g[2] * P); out += 'M'; put(cx, true); put(cy); last = ''; continue; }
      const ex = Math.round(g[g.length - 2] * P), ey = Math.round(g[g.length - 1] * P);
      if (c === 'L' && ex === cx && ey === cy) continue;
      const lc = c === 'Q' ? 'q' : c === 'L' ? 'l' : 'c', letter = lc !== last;
      if (letter) out += lc;
      for (let i = 1; i < g.length; i += 2) { put(Math.round(g[i] * P) - cx, letter && i === 1); put(Math.round(g[i + 1] * P) - cy); }
      cx = ex; cy = ey; last = lc;
    }
    return out;
  }
  // ---- smooth paths through points; a point [x, y, 1] is a sharp corner (as 63's curve). `from` continues a path
  //      whose pen is at that point.
  function curve(pts, closed, from) {
    const n = pts.length;
    if (n < 2) return '';
    const corner = i => closed ? !!pts[(i + n) % n][2] : (i <= 0 || i >= n - 1 || !!pts[i][2]);
    const at = i => pts[(i + n) % n];
    const E = i => { const a = at(i), b = at(i + 1); return corner(i + 1) ? b : corner(i) ? a : [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
    const g = [];
    if (closed) {
      const s0 = corner(0) ? at(0) : E(-1);
      g.push(['M', s0[0], s0[1]]);
      for (let i = 0; i < n; i++) { const p = at(i); if (corner(i)) { if (i) g.push(['L', p[0], p[1]]); } else { const e = E(i); g.push(['Q', p[0], p[1], e[0], e[1]]); } }
      g.push(['Z']);
      return emit(g);
    }
    g.push([from ? 'L' : 'M', pts[0][0], pts[0][1]]);
    for (let i = 1; i < n - 1; i++) { const p = pts[i]; if (p[2]) g.push(['L', p[0], p[1]]); else { const e = E(i); g.push(['Q', p[0], p[1], e[0], e[1]]); } }
    g.push(['L', pts[n - 1][0], pts[n - 1][1]]);
    return emit(g, from);
  }
  const mirror = (pts, cx) => pts.map(p => [2 * cx - p[0], p[1], p[2]]);
  // a limb, a lock or a shaft along a centre line with a half-width at each point
  function limb(pts, ws, tip) {
    const Lp = [], Rp = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
      Lp.push([pts[i][0] - dy * ws[i], pts[i][1] + dx * ws[i]]); Rp.push([pts[i][0] + dy * ws[i], pts[i][1] - dx * ws[i]]);
    }
    if (tip) { const e = pts[pts.length - 1]; return curve([...Lp.slice(0, -1), [e[0], e[1], 1], ...Rp.slice(0, -1).reverse()], true); }
    return curve([...Lp, ...Rp.reverse()], true);
  }
  const lens = (x0, y0, x1, y1, h) => { const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, m = Math.hypot(dx, dy) || 1, nx = dy / m * h, ny = -dx / m * h; return emit([['M', x0, y0], ['Q', mx + nx, my + ny, x1, y1], ['Q', mx - nx * .35, my - ny * .35, x0, y0], ['Z']]); };

  // ---- one drawing's context: size, level of detail, line weights, the definitions it used
  function ctx(size, full) {
    const G = { size, full, px: 200 / size, defs: {} };
    // 3: everything; 2: no fine age lines; 1: no pupil, no small catchlight, heavier brows; 0: silhouette, colour, eyes
    G.lod = full || size >= 60 ? 3 : size >= 44 ? 2 : size >= 28 ? 1 : 0;
    // a content-keyed id: the same content always gets the same id, so repeats on one page can never disagree
    G.ref = (k, path, attrs) => { const id = k + hash(path).toString(36); G.defs[id] = `<path id="${id}" d="${path}"${attrs || ''}/>`; return id; };
    return G;
  }
  // fixed definitions: each id always has the same content
  const DEF = {
    // the shadow side of the hair, the face and the bust's body (light from the upper left), in their own units
    // (each is the outside of an ellipse lit from the upper left, so the terminator curves round the form)
    apsH: '<clipPath id="apsH"><path clip-rule="evenodd" d="M-60-60H200V260H-60ZM30-52A60 96 0 1 0 30.1-52Z"/></clipPath>',
    apsF: '<clipPath id="apsF"><path clip-rule="evenodd" d="M-40-40H160V170H-40ZM38-8A64 64 0 1 0 38.1-8Z"/></clipPath>',
    apsB: '<clipPath id="apsB"><path d="M126 0C122 70 134 140 146 210H260V0Z"/></clipPath>',
    apsT: '<clipPath id="apsT"><path clip-rule="evenodd" d="M-60-20H260V320H-60ZM84-30A40 200 0 1 0 84.1-30Z"/></clipPath>',
    // mail: rows of small rings
    apml: '<pattern id="apml" width="3.2" height="2.6" patternUnits="userSpaceOnUse"><rect width="3.2" height="2.6" fill="#9aa0b4"/><path d="M0 2a1.6 1.4 0 0 1 3.2 0M-1.6 .7a1.6 1.4 0 0 1 3.2 0M1.6 .7a1.6 1.4 0 0 1 3.2 0" fill="none" stroke="#4a4f68" stroke-width=".45"/></pattern>',
    apsc: '<pattern id="apsc" width="4" height="3.4" patternUnits="userSpaceOnUse"><rect width="4" height="3.4" fill="#a3a6b8"/><path d="M0 0q2 4 4 0M-2 1.7q2 4 4 0M2 1.7q2 4 4 0" fill="none" stroke="#4a4f68" stroke-width=".5"/></pattern>',
    apqt: '<pattern id="apqt" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V5M0 0H5" stroke="#1b1730" stroke-width=".45" stroke-opacity=".35"/></pattern>',
    aper: '<pattern id="aper" width="8" height="9" patternUnits="userSpaceOnUse"><rect width="8" height="9" fill="#f4f0e8"/><path d="M4 2l-1 3h2z" fill="#1b1730"/></pattern>',
  };
  const useDef = (G, id) => (G.defs[id] = DEF[id], id);

  // ---- culture: hair bangs and extras weighted by people (63's table gives the dress and the headwear)
  const CULT = () => (UI.MINI && UI.MINI.CULT) || {};
  const CH = {
    'CUL-01': ['parted sideL sideR blunt', 'pins band', '#c23c3c'],   // Solenfolk
    'CUL-02': ['messy sideL wisps', 'braid', '#3d6aa8'],              // Northfolk
    'CUL-03': ['spiky messy', 'braid feather', '#d08a2a'],            // Wind Riders
    'CUL-04': ['parted curtain', 'pins', '#3d5fa0'],                  // Qadiri
    'CUL-05': ['parted swept', 'band', '#3a5a9a'],                    // Sandfolk
    'CUL-06': ['blunt parted', 'band pins', '#c9a63a'],               // Tamari
    'CUL-07': ['curtain parted', 'band', '#a8742a'],                  // Sabrans
    'CUL-08': ['short messy', 'band pins', '#c0662a'],                // Zanari
    'CUL-09': ['short wisps', 'band', '#b4402a'],                     // Abari
    'CUL-10': ['parted sideR', 'pins', '#d08a2a'],                    // Keshi
    'CUL-11': ['sideL blunt', 'braid band', '#c23c3c'],               // Eastfolk
    'CUL-12': ['blunt parted', 'braid pins', '#9a2a2a'],              // Skyfolk
    'CUL-13': ['parted curtain', 'pins', '#d0922a'],                  // Ranpuri
    'CUL-14': ['wisps sideR', 'band', '#d0902a'],                     // Amberfolk
    'CUL-15': ['messy spiky', 'band', '#2f7aa0'],                     // Corsairs
    'CUL-16': ['wisps messy', 'feather', '#6a8a3a'],                  // Leaf People
    'CUL-17': ['wisps sideL', 'feather band', '#6a8ab8'],             // Cloudfolk
    'CUL-18': ['sideR messy', 'braid', '#7a4a9a'],                    // Marchfolk
    'CUL-19': ['curtain long wisps', 'pins feather', '#4d9a5a'],      // Sylvari
    'CUL-20': ['curtain wisps', 'pins', '#3e8a8a'],                   // Grovers of the Coast
    'CUL-21': ['blunt short', 'braid', '#b0782a'],                    // Holdfolk
    'CUL-22': ['spiky crest', 'band', '#a83a2a'],                     // Horde clans
    'CUL-23': ['spiky short', 'band feather', '#8a5a2a'],             // Tusk clans
    'CUL-24': ['messy short', 'braid band', '#5a7ab0'],               // Hall-giants
  };
  AP.CH = CH;
  // ---- the Great Continent's peoples (99-far-lands). Each far culture names its land (LORE.cultures[id].land); a land
  // gives its people a cut of dress and headwear (63's vocabulary), a dye, a pattern, the bangs and extras they favour,
  // a ribbon colour, and the range of skin, hair and eye tones they are drawn in. The stored look is the release's
  // (A.genAppearance knows only the Known World's peoples, so a steppe rider could be pale and red-haired); it is kept
  // in order and pressed into the land's range (skin index i of 8 goes to lo + i * (hi - lo) / 7), so kin still look
  // alike, and drawing stays a pure function of the stored look. sk/hr/ey are index ranges into GD.SKIN.human,
  // GD.HAIR (0 black .. 8 red; silver and white are age and stay) and GD.EYES. A culture's own line overrides its land.
  const FAR_LAND = {
    R: { c: { hat: ['cap', 'kerchief'], cut: 'robe', sash: 1, dye: '#2f4f8a' }, ch: ['blunt parted curtain', 'bun pins', '#b8332a'], sk: [0, 3], hr: [0, 1], ey: [0, 1], st: { long: 'tied' } },       // Twin Rivers: river empires
    F: { c: { hat: ['cone', 'furhat'], cut: 'kaftan', collar: 'fur', sash: 1, dye: '#7a3a24' }, ch: ['messy spiky sideL', 'braid band', '#c23c2a'], sk: [1, 4], hr: [0, 2], ey: [0, 2], st: { short: 'braided' } }, // Long Grass: the steppe
    H: { c: { hat: ['furhat', 'furhat'], cut: 'kaftan', collar: 'fur', sash: 1, dye: '#7a2a3a' }, ch: ['messy wisps', 'braid band', '#c2302a'], sk: [2, 5], hr: [0, 1], ey: [0, 1] },                    // High Steppes: the plateau
    B: { c: { hat: ['turban', 'veil'], cut: 'robe', sash: 1, pat: 'stripe', dye: '#2f6a7a' }, ch: ['parted curtain swept', 'band pins', '#2a8a8a'], sk: [2, 5], hr: [0, 2], ey: [0, 2] },             // Sand Basins: oases
    M: { c: { hat: ['turban', 'veil'], cut: 'drape', collar: 'beads', sash: 1, dye: '#c8782a' }, ch: ['parted curtain', 'bun pins', '#c2302a'], sk: [3, 7], hr: [0, 1], ey: [0, 1], st: { short: 'cropped' } }, // Southern Peninsulas: monsoon
    A: { c: { hat: ['wrap', 'fillet'], cut: 'drape', pat: 'zig', collar: 'beads', dye: '#8a3a24' }, ch: ['wisps messy parted', 'feather band', '#d08a2a'], sk: [3, 6], hr: [0, 1], ey: [0, 1] },     // Thousand Isles
    I: { c: { hat: ['fillet', 'kerchief'], cut: 'robe', sash: 1, dye: '#2a3d6a' }, ch: ['blunt curtain sideR', 'topknot pins', '#b8332a'], sk: [0, 2], hr: [0, 0], ey: [0, 0], st: { long: 'tied' } },  // Sunrise Isles
    T: { c: { hat: ['furhat', 'hood'], cut: 'kaftan', collar: 'fur', fur: 1, dye: '#5a3a2a' }, ch: ['messy sideL wisps', 'braid', '#c25a2a'], sk: [1, 4], hr: [0, 2], ey: [0, 2] },                     // Black Pines: taiga
    N: { c: { hat: ['hood', 'hood'], cut: 'tunic', collar: 'fur', fur: 1, dye: '#5a4a3a' }, ch: ['messy blunt', 'braid', '#3a6aa8'], sk: [2, 4], hr: [0, 1], ey: [0, 1] },                               // Rime Coast: the ice edge
    D: { c: { hat: ['wrap', 'wrap'], cut: 'drape', collar: 'beads', pat: 'stripe', dye: '#b0582a' }, ch: ['short crest', 'band', '#d0a02a'], sk: [5, 7], hr: [0, 0], ey: [0, 0], st: { long: 'locks', short: 'curly', tied: 'locks' } }, // Deep Southland
  };
  const FAR_CULT = {
    'CUL-30': { c: { hat: ['cap', 'kerchief'], cut: 'tunic', sash: 1, dye: '#2a2a3a' } },                  // Sable Banners: soldiers' coats
    'CUL-50': { c: { hat: ['wrap', 'veil'], cut: 'robe', collar: 'fur', dye: '#8a6a3a' } },                // Gravel Sea camel clans
    'CUL-53': { c: { hat: ['cap', 'kerchief'], cut: 'kaftan', sash: 1, dye: '#6a4a2a' } },                 // Gap townsfolk
    'CUL-61': { c: { hat: [null, 'kerchief'], cut: 'tunic', dye: '#7a6a52' } },                            // the Purchased
    'CUL-66': { c: { hat: ['furhat', 'furhat'], cut: 'kaftan', collar: 'fur', fur: 1, dye: '#6a2a2a' } },  // Ice Shoulder yak folk
    'CUL-69': { c: { hat: ['wrap', 'kerchief'], cut: 'kaftan', sash: 1, dye: '#8a2a2a' } },                // Cloudwall porters
    'CUL-81': { c: { hat: ['hood', 'hood'], cut: 'tunic', collar: 'fur', fur: 1, dye: '#4a4a52' }, sk: [3, 5] }, // Rime sea-hunters
    'CUL-85': { c: { hat: ['cap', 'veil'], cut: 'robe', dye: '#e4dcc4' } },                                // Mountain-shrine folk: white
    'CUL-86': { c: { hat: ['feathers', 'fillet'], cut: 'tunic', collar: 'bones', fur: 1, dye: '#5a4a3a' } }, // Ouro hunters
    'CUL-99': { c: { hat: ['wrap', 'kerchief'], cut: 'kaftan', pat: 'stripe', dye: '#2a4a7a' }, sk: [2, 5] }, // Cloud Ridge Yaru
    'CUL-101': { c: { hat: ['turban', 'wrap'], cut: 'drape', sash: 1, dye: '#8a2a2a' } },                  // Elephant catchers
    'CUL-104': { c: { hat: [null, 'wrap'], cut: 'drape', pat: 'zig', dye: '#2f5a7a' } },                   // Salt-eyed divers
    'CUL-118': { c: { hat: ['wrap', 'fillet'], cut: 'drape', pat: 'zig', dye: '#2f6a8a' } },               // Drifting Houses
    'CUL-127': { c: { hat: [null, 'wrap'], cut: 'drape', collar: 'beads', pat: 'stripe', dye: '#a82a24' } }, // Long Herd folk
    'CUL-128': { c: { hat: ['feathers', 'leaves'], cut: 'drape', collar: 'beads', dye: '#4a6a2a' } },      // Deep Forest folk
    'CUL-132': { c: { hat: [null, null], cut: 'drape', collar: 'beads', dye: '#a8702a' }, sk: [4, 7] },    // Dry Hunters
    'CUL-134': { c: { hat: ['wrap', 'wrap'], cut: 'drape', collar: 'beads', pat: 'zig', dye: '#3a6a4a' } }, // Great Forest river traders
  };
  // the far people's table for a culture id, or null (every Known World culture, and anything unknown)
  const farMemo = new Map();
  function farOf(cid) {
    if (typeof cid !== 'string' || CH[cid] || CULT()[cid]) return null;
    if (farMemo.has(cid)) return farMemo.get(cid);
    let out = null;
    try {
      const c = typeof LORE !== 'undefined' && LORE.cultures && LORE.cultures[cid];
      const land = c && typeof c.land === 'string' ? FAR_LAND[c.land] : null;
      if (land) {
        const own = FAR_CULT[cid] || {};
        // the ribbon varies a little by people inside a land, so neighbours differ
        const rib = ['#b8332a', '#c8782a', '#2f6a8a', '#6a3a8a', '#3a7a4a', '#c0a02a'][hash(cid + 'rib') % 6];
        out = { land: c.land, c: Object.assign({}, land.c, own.c), ch: own.ch || [land.ch[0], land.ch[1], hash(cid) % 3 ? land.ch[2] : rib], sk: own.sk || land.sk, hr: own.hr || land.hr, ey: own.ey || land.ey, st: land.st || {} };
      }
    } catch (e) { out = null; }
    if (out) farMemo.set(cid, out);   // a miss is not kept: the far cultures are in LORE only while those lands are open
    return out;
  }
  AP.FAR_LAND = FAR_LAND; AP.FAR_CULT = FAR_CULT; AP.farOf = farOf;
  // an index pressed into [lo, hi] keeping its order among n
  const squeeze = (i, n, r) => r[0] + Math.round(Math.max(0, Math.min(n - 1, i)) * (r[1] - r[0]) / Math.max(1, n - 1));
  // the look as drawn: a far person's stored skin, hair and eye pressed into their land's ranges (the same rule the
  // picture uses), so words that name them can agree with the picture. Returns { skin (hex), hair, eye (indices) }.
  AP.drawnApp = function (p, app) {
    const ap = app || (p && p.app) || {}, far = p ? farOf(p.cult) : null, humanish = p && (p.race === 'human' || p.race === 'halfelf');
    const out = { skin: ap.skin, hair: ap.hair, eye: ap.eye };
    if (!far || !humanish) return out;
    const S = (GD.SKIN && GD.SKIN.human) || [], i = S.indexOf(String(ap.skin).toLowerCase());
    if (i >= 0 && (i < far.sk[0] || i > far.sk[1])) out.skin = S[squeeze(i, S.length, far.sk)];
    if (typeof ap.hair === 'number' && ap.hair >= 0 && ap.hair <= 8 && ap.hair > far.hr[1]) out.hair = squeeze(ap.hair, 9, far.hr);
    if (typeof ap.eye === 'number' && ap.eye > far.ey[1]) out.eye = squeeze(ap.eye, (GD.EYES || []).length || 8, far.ey);
    return out;
  };
  // a person born from now on in a far culture is given that look in the state itself (the release's A.genAppearance
  // knows only the Known World's peoples): the same pressing, no random draw added, so the random stream is the
  // release's and a Known World game is untouched. Old saves keep their stored look; the picture and the profile's
  // words press it the same way.
  if (typeof A.genAppearance === 'function') {
    const gen = A.genAppearance;
    A.genAppearance = function (p) {
      const app = gen.apply(this, arguments);
      try { if (app && p && farOf(p.cult)) Object.assign(app, AP.drawnApp(p, app)); } catch (e) {}
      return app;
    };
  }
  // ---- character creation agrees with the game (cycle 1 visual B4): a far people's swatches are their land's range
  // only, the chosen look is pressed into it as the game presses it, and the preview person carries the culture, so
  // the preview is drawn as the life will be. Creation state (UI.cr) only; A.S is not touched.
  const crFar = c => { try { const humanish = c && (c.race === 'human' || c.race === 'halfelf'); return humanish && UI.crCult ? farOf(UI.crCult()) : null; } catch (e) { return null; } };
  UI.crSkinSet = function (c) {
    const all = (GD.SKIN && GD.SKIN[c.race]) || [], far = crFar(c);
    if (!far || c.race !== 'human' && c.race !== 'halfelf') return all;
    const S = GD.SKIN.human || [], cut = S.slice(far.sk[0], far.sk[1] + 1).filter(x => all.includes(x));
    return cut.length ? cut : all;
  };
  if (typeof UI.crFix === 'function') {
    const fix = UI.crFix;
    UI.crFix = function () {
      const r = fix.apply(this, arguments);
      try {
        const c = UI.cr, far = c && c.app && crFar(c);
        if (far) {
          const d = AP.drawnApp({ race: c.race, cult: UI.crCult(), app: c.app }, c.app);
          if (d.skin) c.app.skin = d.skin;
          if (typeof d.hair === 'number') c.app.hair = d.hair;
          if (typeof d.eye === 'number') c.app.eye = d.eye;
        }
      } catch (e) {}
      return r;
    };
  }
  // the hair and eye rows the same way: shades the people are never drawn in are taken off the row (silver and white
  // stay, they are age). A pass over the drawn row, so the release's markup and its indices are unchanged.
  AP.crTrim = function () {
    try {
      if (UI.screen !== 'create' || typeof document === 'undefined') return;
      const c = UI.cr, far = crFar(c);
      if (!far) return;
      for (const el of document.querySelectorAll('#app .sw[data-a="crApp"]')) {
        const [k, v] = String(el.dataset.v || '').split(':'), i = +v;
        if (k === 'hair' && i <= 8 && i > far.hr[1] || k === 'eye' && i > far.ey[1]) { el.hidden = true; el.style.display = 'none'; }
      }
    } catch (e) {}
  };
  if (typeof UI.render === 'function') {
    const rd = UI.render;
    UI.render = function () { const r = rd.apply(this, arguments); AP.crTrim(); return r; };
  }
  if (typeof UI.crPreviewPerson === 'function') {
    const prev = UI.crPreviewPerson;
    UI.crPreviewPerson = function () {
      const p = prev.apply(this, arguments);
      try { if (p && !p.cult && UI.crCult) p.cult = UI.crCult(); } catch (e) {}
      return p;
    };
  }
  const COMMON = ['#5b7fb0', '#a0524a', '#5f9070', '#c09a52', '#7d6aa8', '#4f7f8a', '#9a6a4a', '#6a8a4a', '#b0704a', '#5a6a9a'];
  const BANGS_F = { blunt: 3, parted: 3, sideL: 2, sideR: 2, curtain: 3, wisps: 3, long: 2, messy: 1, spiky: .3, short: .3, swept: .7, crest: 0 };
  const BANGS_M = { spiky: 3, messy: 3, sideL: 2, sideR: 2, parted: 2, short: 3, swept: 2, crest: 1.5, wisps: 1, curtain: 1, blunt: .5, long: 1 };

  // ---- proportions (brief §7.1) by human-equivalent age: infant, child, teen, adult, adult, old
  const KH = [1, 6, 14, 22, 45, 68];
  const KF = {
    eyeY: [71, 70, 66, 64, 64, 61], eyeW: [24, 23, 21, 20, 20, 18], gap: [12, 13, 15, 16, 16, 17], eyeH: [18, 17, 15, 13, 13, 10],
    chin: [102, 108, 114, 118, 118, 120], nose: [83, 84, 85, 86, 86, 88], mouth: [93, 96, 98, 100, 100, 102], mouthW: [9, 10, 12, 14, 14, 13],
    heads: [3, 4.5, 6, 6.5, 6.5, 6.3],
  };
  const kf = (h, k) => { const t = KF[k]; if (h <= KH[0]) return t[0]; for (let i = 1; i < KH.length; i++) if (h <= KH[i]) return lerp(t[i - 1], t[i], (h - KH[i - 1]) / (KH[i] - KH[i - 1])); return t[t.length - 1]; };
  // a race's age in human years: its milestones (grown, prime's end, old, the oldest) mapped onto a human life
  const humanYears = (age, R2) => {
    const ms = [0, R2.grown || 20, R2.primeEnd || 34, R2.old || 50, Math.max((R2.old || 50) + 1, R2.maxLife || 100)], hm = [0, 20, 34, 50, 100];
    for (let i = 1; i < ms.length; i++) if (age <= ms[i]) return lerp(hm[i - 1], hm[i], (age - ms[i - 1]) / Math.max(1, ms[i] - ms[i - 1]));
    return 100;
  };

  // ---- the expression, from the state at draw time (never stored)
  const EV_TONE = [
    [/love|court|kiss|wed|marr|lover|flirt|romance|betroth|suitor|sweetheart|bride|dance/, 'smile', 1],
    [/death|funeral|grave|mourn|grief|widow|orphan|dying|burial|plague|sick/, 'sad'],
    [/duel|insult|feud|quarrel|threat|rival|brawl|fight|accus|betray|revenge|enemy/, 'angry'],
    [/gift|feast|festival|joke|reunion|birth|praise|reward|toast/, 'grin'],
    [/secret|discover|strange|omen|vision|ghost|letter|news|stranger/, 'surprised'],
  ];
  // an event's id and title, read (never set) from the queue item, its view or its definition
  const evKey = q => { let t = ''; try { const e = A.EV && A.EV[q.ev]; t = (q.view && q.view.title) || (e && typeof e.title === 'string' ? e.title : '') || ''; } catch (x) {} return String(q.ev || q.id || '') + ' ' + String(t); };
  function expression(L) {
    const p = L.p, out = { k: 'neutral', blush: false };
    if (L.dead) return (out.k = 'closed', out);
    if (L.baby) return (out.k = hf(p, 'sleep') < .45 ? 'sleep' : 'smile', out);
    // the scene: the person an event is about wears the event's tone
    let q = AP.ev || null;
    try { if (!q && A.S && Array.isArray(A.S.queue)) q = A.S.queue[0] || null; } catch (e) {}
    if (q && q.ctx && q.ctx.pid === p.id) {
      const key = evKey(q);
      for (const [rx, k, blush] of EV_TONE) if (rx.test(key.toLowerCase())) { out.k = k; out.blush = !!blush; return out; }
    }
    const pc = A.S && A.S.pc && A.S.people ? A.S.people[A.S.pc] : null;
    const tr = new Set(p.traits || []);
    let happy = typeof p.happy === 'number' ? (p.happy - 50) / 50 : 0;
    if (pc && pc !== p && p.rel && p.rel[pc.id] && typeof p.rel[pc.id].op === 'number') {
      const op = p.rel[pc.id].op;
      happy = happy * .4 + clamp(op / 60, -1, 1) * .6;
      if (op >= 60 && (tr.has('romantic') || (p.rel[pc.id].type === 'lover' || p.rel[pc.id].type === 'spouse'))) out.blush = true;
    }
    if (pc === p && A.MOODS && A.MOODS.mood) {
      try { const m = A.MOODS.mood(p); if (m && m.k === 'rest') return (out.k = 'sad', out); if (m && (m.k === 'company' || m.k === 'comfort')) happy -= .5; if (m && m.k === 'content') happy += .3; } catch (e) {}
    }
    if (typeof p.health === 'number' && p.health < 30) return (out.k = 'sad', out);
    if (tr.has('wrathful') && happy < .2) return (out.k = 'angry', out);
    if (happy > .55) out.k = hf(p, 'grin') < .35 || tr.has('gregarious') || tr.has('witty') ? 'grin' : 'smile';
    else if (happy > .18) out.k = 'smile';
    else if (happy < -.55) out.k = tr.has('cruel') || tr.has('vengeful') ? 'angry' : 'sad';
    else if (happy < -.2) out.k = 'frown';
    else if (tr.has('stern') || tr.has('stoic') || tr.has('cruel') || tr.has('proud')) out.k = 'frown';
    else if (tr.has('kind') || tr.has('gregarious')) out.k = 'smile';
    return out;
  }
  AP.expression = expression;

  // ---- what the picture needs to know about a person (read only)
  function look(p) {
    const ap = p.app || {}, race = GD.RACES[p.race] ? p.race : 'human', R2 = GD.RACES[race];
    const age = Math.max(0, Math.floor(+A.age(p) || 0)), F = p.sex === 'F', h = humanYears(age, R2);
    const L = { p, ap, race, R2, age, F, h, dead: !p.alive };
    L.baby = h < 2.5; L.kid = !L.baby && h < 11; L.small = h < 11; L.teen = h >= 11 && h < 17.5;
    L.mat = clamp((h - 12) / 9, 0, 1);                    // maturity: child face to grown face
    L.oldF = clamp((h - 42 + hs(p, 'agev', 4)) / 26, 0, 1.2);   // the lines of age, from the forties
    const far = farOf(p.cult);
    L.far = far ? far.land : null;
    L.cult = CULT()[p.cult] || (far && far.c) || {};
    L.ch = CH[p.cult] || (far && far.ch) || ['messy parted', 'band', '#8a5a9a'];
    let out = null, arms = null;
    try { out = PORTRAIT.outfit(p); } catch (e) {}
    try { arms = PORTRAIT.arms(p); } catch (e) {}
    out = out || { kind: 'peasant', main: '#6b5a3e', trim: '#4a3e2e' };
    arms = arms || { f: '#7a6a50', c: '#d8c48a', ch: 'none', h: null };
    L.out = out; L.kind = out.kind;
    L.arms = { f: hexOk(arms.f) || '#7a6a50', c: hexOk(arms.c) || '#d8c48a', ch: typeof arms.ch === 'string' ? arms.ch : 'none', h: !!arms.h };
    L.ruler = !!p.ruler; L.noble = L.ruler || ['noble', 'royal'].includes(out.kind);
    // realm colour for the ground
    let realm = null; try { realm = A.realm(p.ruler || (p.noble && p.noble.realm) || p.realm); } catch (e) {}
    L.realmC = hexOk(realm && (UI.realmHex ? UI.realmHex(realm) : realm.color)) || '#8a8f9e';
    // clothes: the release's colour, cleaned to a cel palette; commoners take their people's dye
    let main = hexOk(out.main) || '#6b5a3e';
    const common = ['peasant', 'artisan', 'gentry', 'merchant', 'rags'].includes(out.kind);
    // commoners: a cel palette hashed by id, kept near the release's earth colour and pulled toward the people's dye
    if (common) main = mix(COMMON[hash(p.id + 'cloth') % COMMON.length], main, out.kind === 'rags' ? .7 : .35);
    if (L.cult.dye && common && hf(p, 'dye') < .7) main = mix(main, L.cult.dye, .45);
    L.cloth = tune(main, 1.25, .04, .12, .62, .2, .7);
    L.cloth2 = tune(mix(main, COMMON[hash(p.id + 'cloth2') % COMMON.length], .5), 1.1, -.06, .1, .5, .16, .5);
    L.rib = hexOk(L.ch[2]) || '#8a5a9a';
    // trim: the release's for rank; for commoners a lighter tone of the cloth or the people's colour
    L.trim = common ? tune(hf(p, 'trim') < .5 ? mix(L.cloth, '#fff4dc', .45) : L.rib, 1.1, .05, .1, .7, .4, .82) : tune(hexOk(out.trim) || '#c0a060', 1.2, .04, .1, .75, .25, .8);
    // skin, hair, eyes
    let skin0 = hexOk(ap.skin) || '#d9a77f';
    const humanish = race === 'human' || race === 'halfelf';
    if (far && humanish && GD.SKIN && GD.SKIN.human) {
      const S = GD.SKIN.human, i = S.indexOf(String(ap.skin).toLowerCase());
      if (i >= 0 && (i < far.sk[0] || i > far.sk[1])) skin0 = S[squeeze(i, S.length, far.sk)];
    }
    const skin = tune(skin0, 1.08, .03, 0, .7, .2, .92);
    L.skin = { b: skin, s: shadeOf(skin, hsl(skin)[2] < .4 ? .24 : .3, 1.35), line: tune(mix(skin, LINE, .55), 1.3, 0, 0, .7) };
    L.skin.d = shadeOf(skin, .5, 1.3);
    let hairI = ap.hair;
    if (far && humanish && typeof hairI === 'number' && hairI >= 0 && hairI <= 8 && hairI > far.hr[1]) hairI = squeeze(hairI, 9, far.hr);
    let hair = hexOk(typeof hairI === 'string' ? hairI : GD.HAIR && GD.HAIR[hairI]) || '#3b2414';
    { const [hh, ss, ll] = hsl(hair); hair = ll < .16 ? mix(fromHsl(hh, ss, .17), '#2a2f5a', .45) : fromHsl(hh, clamp(ss * 1.12, 0, .8), clamp(ll, .17, .86)); }
    const grey = clamp(L.oldF * .95 + (h > 72 ? .3 : 0) - (hf(p, 'greyv') < .3 ? .25 : 0), 0, 1);
    if (grey > 0) hair = mix(hair, grey > .8 ? '#e8e8ee' : '#c9cad4', grey);
    L.grey = grey;
    L.hair = { b: hair, s: shadeOf(hair, .4, 1.1), hi: lighter(hair, .18), line: mix(hair, LINE, .62) };
    L.hair.d = shadeOf(hair, .62, 1.05);
    let eyeI = ap.eye;
    if (far && humanish && typeof eyeI === 'number' && eyeI > far.ey[1]) eyeI = squeeze(eyeI, (GD.EYES || []).length || 8, far.ey);
    const eye = hexOk(GD.EYES && GD.EYES[eyeI]) || '#6b4a2b';
    { const [eh, es, el] = hsl(eye); L.eye = fromHsl(eh, clamp(es * 1.5 + .12, 0, .78), clamp(el * 1.1 + .06, .3, .6)); }
    if (race === 'orc' || race === 'halforc') L.eye = hf(p, 'oeye') < .5 ? '#c99a2a' : L.eye;
    if (race === 'elf' && hf(p, 'eeye') < .4) L.eye = ['#3aa08a', '#6a8ad0', '#9a7ad0'][hash(p.id + 'ee') % 3];
    L.eyeD = mix(L.eye, LINE, .55);
    // wounds that show
    const ws = (p.wounds || []).filter(Boolean), wk = new Set(ws.map(w => w && w.k)), marks = new Set(ws.map(w => ((GD.WOUNDS || {})[w && w.k] || {}).mark).filter(Boolean));
    const quirks = p.quirks || [];
    L.lostEye = wk.has('lost_eye'); L.lostHand = wk.has('lost_hand'); L.nose = wk.has('broken_nose'); L.ear = wk.has('ear');
    L.scar = marks.has('faceScar') || wk.has('scar_face') || quirks.includes('scarred'); L.burn = marks.has('burn') || wk.has('burn'); L.brand = marks.has('brand') || wk.has('brand');
    L.limp = wk.has('limp') || wk.has('bad_knee'); L.fingers = wk.has('lost_fingers'); L.armScar = wk.has('scar_arm');
    L.freckles = !!ap.freckles || quirks.includes('freckled'); L.birthmark = quirks.includes('birthmark');
    // gear (only the grown carry arms)
    const armed = !L.small && h >= 15;
    const g = Object.assign({ weapon: 'fists', armor: 'none' }, p.gear || {}), GG = k => (typeof k === 'string' && GD.GEAR[k]) || null;
    L.W = (armed && GG(g.weapon)) || GD.GEAR.fists || { kind: 'fists' };
    const Ar = armed ? GG(g.armor) : null; L.armor = Ar ? (Ar.look || 'none') : 'none';
    L.helm = armed ? GG(g.helm) : null; L.shield = armed ? GG(g.shield) : null; L.ranged = armed ? GG(g.ranged) : null; L.cloak = armed ? GG(g.cloak) : null;
    if (L.shield && L.shield.kind) L.shield = null;
    L.rank = p.mil ? p.mil.rank || 0 : 0;
    L.mail = ['mail', 'dwarfmail', 'mailplate', 'elfmail', 'orcmail'].includes(L.armor);
    L.plate = ['plate', 'mailplate', 'dwarfplate'].includes(L.armor);
    // what is on the head (63's rules: crowns, circlets, helms, the cowl, people's hats; closed helms come off)
    const fullHelm = L.helm && ['greathelm', 'bascinet', 'dwarfhelm'].includes(L.helm.look);
    let hat = null;
    if (p.ruler || out.crown) hat = 'crown';
    else if (out.circlet) hat = 'circlet';
    else if (L.helm && !fullHelm) hat = 'helm:' + (L.helm.look || 'helm');
    else if (fullHelm) hat = 'helm:coif';
    else if (L.baby) hat = 'bonnet';
    else if (out.kind === 'priest') hat = hf(p, 'cowl') < .45 ? 'cowl' : null;
    else if ((!L.kid || hf(p, 'kidhat') < .2) && (L.armor === 'none' || L.armor === 'robes' || L.armor === 'padded')) {
      const c = L.cult.hat ? L.cult.hat[F ? 1 : 0] : null, hh = hf(p, 'hat');
      const odds = L.noble ? .25 : F && c === 'veil' ? .6 : .4;
      if (c && hh < odds) hat = c;
      else if (F && L.oldF > .7 && hh < .7) hat = 'veil';
    }
    // a wound that shows is drawn: a hood or veil never covers a torn ear
    if (L.ear && ['hood', 'cowl', 'veil', 'kerchief'].includes(hat)) hat = null;
    L.hat = hat;
    L.covered = ['hood', 'cowl', 'veil', 'bonnet', 'helm:coif'].includes(hat);
    // hair: the game's style sets the back mass; the bangs and the extra are hashed, weighted by culture
    let st = ap.hstyle || 'short';
    if (far && far.st[st] && hf(p, 'farst') < .7) st = far.st[st];
    // the release hands 'bald' to men of any age; on a young face it read as an old, balding man (the love interest of
    // "A love philtre", 21). Bald is kept for the grown and the old; before 30 it is a crop, and to 40 a crop or a shave
    if (st === 'bald' && h < 40) st = h < 30 || hf(p, 'ybald') < .5 ? 'cropped' : 'shaved';
    if (L.baby) st = 'baby';
    const old = L.oldF > .6;
    L.bald = !F && !L.small && (st === 'bald' || (L.oldF > .9 && hf(p, 'bald') < .3));
    L.recede = !F && !L.small && !L.bald && L.oldF > .55 && hf(p, 'bald') < .5;
    const backOf = { short: F ? 'bob' : 'short', cropped: 'short', long: !F && hf(p, 'mlong') < .4 ? 'shoulder' : 'long', braided: 'braid', tied: 'tied', ponytail: F ? 'bob' : 'short', topknot: 'topknot', curly: F ? 'shoulder' : 'short', locks: 'long', wild: 'shoulder', shaved: 'shaved', bald: 'shaved', mohawk: 'shaved', baby: 'short' };
    L.st = st;
    L.back = L.covered && hat !== 'bonnet' ? 'hooded' : L.bald ? 'shaved' : backOf[st] || 'short';
    if (L.kid && L.back === 'long' && hf(p, 'kidlong') < .5) L.back = 'shoulder';
    if (old && F && L.back === 'long' && hf(p, 'oldbun') < .6) L.back = 'bun';
    L.curly = st === 'curly'; L.wild = st === 'wild'; L.locks = st === 'locks'; L.mohawk = st === 'mohawk';
    const bw = Object.assign({}, F ? BANGS_F : BANGS_M);
    for (const k of L.ch[0].split(' ')) bw[k] = (bw[k] || 0) + 3;
    if (L.small) { bw.swept = 0; bw.crest = 0; bw.blunt = (bw.blunt || 0) + 2; }
    if (old) { bw.swept += 4; bw.spiky *= .3; bw.crest = 0; }
    if (st === 'topknot' || st === 'cropped') bw.swept += 3;
    if (L.wild) { bw.spiky += 4; bw.messy += 2; }
    L.bangs = L.baby ? 'baby' : st === 'shaved' || st === 'mohawk' || L.bald ? 'none' : pickW(p, 'bangs', bw);
    const xw = { none: 7, ponytail: 0, braid: 0, bun: 0, pins: 0, feather: 0, band: 0 };
    for (const k of L.ch[1].split(' ')) xw[k] = 2;
    if (F) { xw.pins += 1.5; xw.band += 1; }
    if (st === 'ponytail') { xw.ponytail = 40; }
    if (L.small) { xw.band += 2; xw.feather = 0; xw.pins = F ? 1 : 0; }
    if (L.back === 'shaved' || L.back === 'hooded' || L.baby) Object.keys(xw).forEach(k => xw[k] = k === 'none' ? 1 : 0);
    if (L.back === 'braid' || L.back === 'bun' || L.back === 'topknot') { xw.braid = 0; xw.bun = 0; xw.ponytail = 0; }
    if (hat && !L.covered) { xw.band = 0; xw.feather = 0; }
    L.extra = pickW(p, 'extra', xw);
    L.ahoge = !L.covered && !L.bald && L.bangs !== 'none' && hf(p, 'ahoge') < (L.small || L.teen ? .3 : .12);
    L.vol = { short: 3, cropped: 1.5, long: 4, braided: 3, tied: 3, ponytail: 3, topknot: 2, curly: 7, locks: 5, wild: 8, baby: 1 }[st] || 3;
    // beard (grown men)
    L.beard = F || L.small || L.teen ? 'none' : (ap.beard || 'none');
    if (L.beard !== 'none' && h < 19 && !['stubble', 'mustache'].includes(L.beard)) L.beard = 'stubble';
    // shapes by people (brief: elves long verticals and points, dwarves squares, orcs heavy wedges, giants big masses)
    L.build = { slight: .9, lean: .94, average: 1, sturdy: 1.06, heavy: 1.12, muscular: 1.1, gaunt: .88, stout: 1.1 }[ap.build] || 1;
    L.expr = expression(L);
    // the frame: rulers in gold, nobles in the accent; sacred and royal frames take the cool rim light
    L.frame = L.ruler ? 'ruler' : L.noble || out.kind === 'gentry' && hf(p, 'gframe') < 0 ? 'noble' : 'plain';
    L.sacred = out.kind === 'priest' || L.ruler || out.kind === 'royal';
    return L;
  }
  AP.look = look;

  // ======================================================================================================================
  // ---- the head, in the brief's head box (100 wide, 120 tall, the cranium a circle of radius 50 at (50, 50)).
  //      Returns { back, neck, front }: hair behind the body, the neck, and the face with its hair in front.
  function head(G, L, k) {
    const p = L.p, sk = L.skin, hr = L.hair, race = L.race, F = L.F, h = L.h, lod = G.lod, mat = L.mat, E = L.expr;
    const lw = w => RW(w * k.lw);                           // inner line weight in head units
    let back = '', neck = '', s = '';
    // ---------- the face's outline: chin, jaw and cheek by age, sex and people
    const chinY = kf(h, 'chin') + (race === 'elf' ? 2 : race === 'orc' || race === 'giant' ? 2 : 0) + (L.oldF > .8 ? 1 : 0);
    const adult = F ? [[1, 70], [4, 90], [20, 106], [42, 116.5]] : [[.5, 70], [2.5, 92], [13, 104.5], [41, 116]];
    const child = [[0, 70], [2, 88], [15, 100.5], [38, 107]];
    const jt = { elf: [1.5, 2, 4, 1], halfelf: [.8, 1, 2, .5], orc: [-3, -4, -7, -6], halforc: [-1, -2, -4, -3], dwarf: [-1, -2, -5, -5], giant: [-2, -3, -6, -5] }[race] || [0, 0, 0, 0];
    // the game's face shape (0-3) widens, narrows or squares the jaw a little
    const fw = [0, -1.5, 1.5, -2.5][L.ap.face | 0] || 0;
    const jaw = adult.map((a, i) => { const c = child[i]; return [lerp(c[0], a[0], mat) + jt[i] * mat + (i ? fw * mat : 0), lerp(c[1], a[1], mat) * (chinY / lerp(108, 118, mat))]; });
    const sharp = !F && mat > .6 || race === 'orc' || race === 'dwarf' || race === 'giant';
    if (sharp) jaw[2][2] = 1;
    const jawR = mirror(jaw, 50);
    const lowFace = [[100.5, 50], ...jawR, [50, chinY], ...jaw.slice().reverse(), [-.5, 50]];
    const faceD = d`M-.5 50A50.5 50.5 0 0 1 100.5 50` + curve(lowFace, false, [100.5, 50]) + 'Z';
    const faceId = G.ref('apf', faceD);
    // ---------- eyes, nose and mouth positions
    const eyeY = kf(h, 'eyeY'), eyeW = kf(h, 'eyeW') * (race === 'elf' ? 1.02 : race === 'orc' || race === 'giant' ? .9 : race === 'dwarf' ? .95 : 1);
    const gap = kf(h, 'gap'), m2 = clamp((h - 14) / 8, 0, 1);
    let eyeH = kf(h, 'eyeH') + (h >= 14 && h < 60 ? (F ? 2 : -1) * m2 : 0) * (L.oldF > .5 ? 1 - (L.oldF - .5) * 2 : 1);
    if (race === 'orc' || race === 'giant') eyeH *= .82;
    if (race === 'elf') eyeH *= .94;
    const noseY = kf(h, 'nose') + (race === 'dwarf' ? 1 : 0), mouthY = kf(h, 'mouth') + (race === 'orc' ? 1.5 : 0), mouthW = kf(h, 'mouthW') * (race === 'orc' ? 1.25 : 1) * ([1, 1.1, .9][L.ap.mouth | 0] || 1);
    const exL = 50 - gap / 2 - eyeW / 2, exR = 50 + gap / 2 + eyeW / 2;

    // ---------- the back mass of hair (behind the head and the body)
    const hb = backHair(G, L, k, chinY);
    back += hb;

    // ---------- the neck (behind the face, under the body's collar), with the chin's occlusion shadow
    const nw = (F ? 30 : 38) * (L.small ? .9 : 1) * ({ orc: 1.5, halforc: 1.25, dwarf: 1.45, giant: 1.55, elf: .9 }[race] || 1) * (race === 'human' || race === 'halfelf' ? L.build : 1);
    const n0 = 50 - nw / 2, n1 = 50 + nw / 2, nb = k.neckTo || 170;
    const neckD = d`M${n0} 88L${n0 - 1} ${nb}L${n1 + 1} ${nb}L${n1} 88Z`;
    neck += `<path d="${neckD}" fill="${sk.b}" stroke="${sk.line}" stroke-width="${lw(1)}"/>`;
    neck += `<path d="${d`M${n0} 88L${n0 - .4} ${chinY + 4}Q50 ${chinY + 13} ${n1 - nw * .26} ${chinY + 8}L${n1 + 1} ${nb}L${n1} 88Z`}" fill="${sk.s}"/>`;

    // ---------- ears (behind the side locks; elf points come out through the hair)
    const ear = sd => {
      const elfK = race === 'elf' ? 1 : race === 'halfelf' ? .5 : 0, orcK = race === 'orc' ? 1 : race === 'halforc' ? .6 : 0;
      const big = L.oldF > .6 ? 3 : 0;
      let pts;
      if (elfK) pts = [[3, 84, 1], [-3, 82 + big], [-7, 72], [-10 - 6 * elfK, 54 - 6 * elfK], [-14 - 12 * elfK, 54 - 40 * elfK, 1], [-5, 52], [2, 56, 1]];
      else if (orcK) pts = [[3, 84, 1], [-4, 82], [-9, 68], [-13 - 8 * orcK, 48 - 6 * orcK, 1], [-4, 54], [2, 56, 1]];
      else pts = [[3, 84, 1], [-1.5, 84.5 + big], [-5.5, 77], [-6.5, 65], [-3.5, 56], [2, 56, 1]];
      if (sd > 0) pts = mirror(pts, 50);
      let e = `<path d="${curve(pts, true)}" fill="${sk.b}" stroke="${sk.line}" stroke-width="${lw(1)}"/>`;
      if (lod >= 3 && G.size >= 140) {
        const x = sd > 0 ? 100 : 0, o = sd > 0 ? 1 : -1;
        e += `<path d="${d`M${x + o * .5} ${60}Q${x + o * 4.5} ${62} ${x + o * 3.6} ${72}Q${x + o * 2.4} ${78} ${x + o * .5} ${78}Z`}" fill="${sk.s}"/>`;
      }
      if (L.ear && sd > 0) e += `<path d="${d`M${103} ${62}l4 3l-3 2l4 3`}" fill="none" stroke="${sk.line}" stroke-width="${lw(1)}"/>`;
      if (sd < 0 && !L.covered && (L.cult.ring || L.ap.jewel === 'earring') && lod >= 2) e += `<circle cx="-2" cy="${d`${89 + big}`}" r="2.6" fill="none" stroke="#e8b04a" stroke-width="${lw(1.4)}"/>`;
      return e;
    };
    // long hair hides human ears; elves' points always show
    const hidden = !['elf', 'halfelf', 'orc', 'halforc'].includes(race) && !L.ear && (L.covered || F && ['long', 'shoulder', 'bob', 'braid', 'tied'].includes(L.back));
    const earsBack = hidden || race === 'elf' || race === 'halfelf' ? '' : ear(-1) + ear(1);

    // ---------- the face: skin, the shadow side, the blush
    s += `<use href="#${faceId}" fill="${sk.b}" stroke="${sk.line}" stroke-width="${lw(1.1)}"/>`;
    if (lod >= 1) s += `<use href="#${faceId}" fill="${sk.s}" clip-path="url(#${useDef(G, 'apsF')})"/>`;
    // cheeks: a faint blush for everyone, stronger on women and children
    if (lod >= 1 && !L.dead) {
      const bo = race === 'orc' || race === 'halforc' ? .07 : L.small ? .26 : F ? .2 : .1;
      for (const x of [exL - 2, exR + 2]) s += `<ellipse cx="${R(x)}" cy="${R(eyeY + eyeH * .9 + 5)}" rx="${R(eyeW * .34)}" ry="${R(eyeW * .17)}" fill="#ff6f7d" fill-opacity="${bo}"/>`;
      if (E.blush && lod >= 2) for (const x of [exL - 2, exR + 2]) s += `<path d="${d`M${x - 5} ${eyeY + eyeH * .9 + 7}l2 -3.4M${x - 1} ${eyeY + eyeH * .9 + 7}l2 -3.4M${x + 3} ${eyeY + eyeH * .9 + 7}l2 -3.4`}" stroke="#e0485a" stroke-width="${lw(.9)}"/>`;
    }
    if (L.freckles && lod >= 2) for (let i = 0; i < 10; i++) s += `<circle cx="${R((i % 2 ? exR : exL) + ((i * 7 % 5) - 2) * 2.2)}" cy="${R(eyeY + eyeH * .7 + 3 + (i % 3) * 2.2)}" r=".7" fill="${sk.d}"/>`;

    // ---------- the brow ridge of orcs and giants, the lines of age (under the features)
    if (['orc', 'giant', 'halforc'].includes(race) && lod >= 1) for (const sd of [-1, 1]) { const x = sd < 0 ? exL : exR; s += `<path d="${d`M${x - eyeW * .62} ${eyeY - eyeH * .5}Q${x - sd * eyeW * .1} ${eyeY - eyeH * 1.5} ${x + eyeW * .62} ${eyeY - eyeH * .5}Q${x} ${eyeY - eyeH * .9} ${x - eyeW * .62} ${eyeY - eyeH * .5}Z`}" fill="${sk.s}"/>`; }
    if (L.oldF > .3 && lod >= 2) {
      const op = R(clamp(L.oldF, .35, 1) * .8 * 100) / 100;
      // nose to mouth, the bags under the eyes, crow's feet, then the jowls
      const g = [['M', 42, noseY - 1], ['Q', 38, mouthY - 4, 50 - mouthW * .75, mouthY + 2], ['M', 58, noseY - 1], ['Q', 62, mouthY - 4, 50 + mouthW * .75, mouthY + 2]];
      const ub = eyeY + eyeH * .75 + 2;
      if (L.oldF > .5) g.push(['M', exL - 5, ub], ['Q', exL, ub + 2.5, exL + 5, ub], ['M', exR - 5, ub], ['Q', exR, ub + 2.5, exR + 5, ub]);
      if (L.oldF > .65) for (const sd of [-1, 1]) { const x = sd < 0 ? exL - eyeW * .62 : exR + eyeW * .62; g.push(['M', x, eyeY - 1], ['L', x + sd * 4, eyeY - 3], ['M', x, eyeY + 2], ['L', x + sd * 4, eyeY + 3]); }
      if (L.oldF > .9) g.push(['M', 50 - mouthW, mouthY + 6], ['Q', 50 - mouthW * 1.4, chinY - 6, jaw[2][0] + 6, jaw[2][1] - 1], ['M', 50 + mouthW, mouthY + 6], ['Q', 50 + mouthW * 1.4, chinY - 6, 100 - jaw[2][0] - 6, jaw[2][1] - 1]);
      const a = emit(g);
      s += `<path d="${a}" fill="none" stroke="${sk.line}" stroke-width="${lw(.75)}" stroke-opacity="${op}"/>`;
    }

    // ---------- the eyes, brows, nose, mouth
    s += eyes(G, L, k, { exL, exR, eyeY, eyeW, eyeH, lw });
    s += brows(G, L, k, { exL, exR, eyeY, eyeW, eyeH, lw });
    s += nose(G, L, k, { noseY, eyeY, lw });
    s += mouth(G, L, k, { mouthY, mouthW, chinY, lw });
    // tusks
    if ((race === 'orc' || race === 'halforc') && lod >= 1) {
      const tl = race === 'orc' ? 7 : 4;
      for (const sd of [-1, 1]) { const x = 50 + sd * mouthW * .62; s += `<path d="${d`M${x - 1.8} ${mouthY + 2.5}Q${x - 1.2 + sd * .5} ${mouthY - tl * .6} ${x + sd * 1.4} ${mouthY - tl}Q${x + sd * 1.8} ${mouthY - tl * .3} ${x + 2} ${mouthY + 2.5}Z`}" fill="#f2ead6" stroke="${LINE}" stroke-width="${lw(.8)}"/>`; }
    }
    // scars, burns, brands, marks, war paint
    s += marks(G, L, k, { exL, exR, eyeY, eyeW, eyeH, mouthY, mouthW, chinY, lw });
    // the beard (grown men)
    if (L.beard !== 'none' && lod >= 1) s += beard(G, L, k, { jaw, chinY, mouthY, mouthW, noseY, lw });

    // ---------- hair in front: side locks, the bangs, the extra, then what is worn on the head
    const fr = frontHair(G, L, k, { eyeY, chinY, lw });
    const elfEars = race === 'elf' || race === 'halfelf';
    s = earsBack + s;   // ears first (behind the face line), then the face
    if (elfEars) s += fr.locks + ear(-1) + ear(1) + fr.bangs; else s += fr.locks + fr.bangs;
    s += headwear(G, L, k, { eyeY, chinY, lw, exL, exR, eyeW, eyeH });
    // the lost eye: a patch on a cord, over the hair
    if (L.lostEye) {
      const x = exR, y = eyeY;
      s += `<path d="${d`M${x - eyeW * .62} ${y - eyeH * .55}Q${x} ${y - eyeH * .95} ${x + eyeW * .62} ${y - eyeH * .5}Q${x + eyeW * .7} ${y + eyeH * .6} ${x} ${y + eyeH * .85}Q${x - eyeW * .66} ${y + eyeH * .6} ${x - eyeW * .62} ${y - eyeH * .55}Z`}" fill="#2a2440" stroke="${LINE}" stroke-width="${lw(1)}"/>`;
      s += `<path d="${d`M${x - eyeW * .6} ${y - eyeH * .45}L${-2} ${eyeY - 18}M${x + eyeW * .6} ${y - eyeH * .4}L${102} ${eyeY - 8}`}" fill="none" stroke="${LINE}" stroke-width="${lw(1.4)}"/>`;
    }
    return { back, neck, front: s };
  }

  // ---------- eyes: six layers, back to front (brief §7.1)
  function eyes(G, L, k, o) {
    const { exL, exR, eyeY, eyeW, eyeH, lw } = o, lod = G.lod, E = L.expr, race = L.race;
    let s = '';
    const w = eyeW, hh = eyeH * (E.k === 'surprised' ? 1.22 : 1);
    const lift = race === 'elf' ? -.26 : race === 'halfelf' ? -.14 : race === 'orc' ? .05 : 0;
    // under 28 px: two eye marks
    if (lod === 0) {
      for (const x of [exL, exR]) if (!(L.lostEye && x === exR)) s += `<ellipse cx="${R(x)}" cy="${R(eyeY + 1)}" rx="${R(w * .24)}" ry="${R(hh * .46)}" fill="${E.k === 'closed' || E.k === 'sleep' ? L.skin.line : L.eyeD}"/>`;
      return s;
    }
    // closed: the dead and the sleeping (a soft downward lid), the grin (happy arcs)
    if (E.k === 'closed' || E.k === 'sleep' || E.k === 'grin' && lod >= 1) {
      const happy = E.k === 'grin';
      for (const sd of [-1, 1]) {
        if (L.lostEye && sd === 1) continue;
        const x = sd < 0 ? exL : exR, ix = x - sd * w / 2, ox = x + sd * w / 2;
        const lp = happy ? d`M${ix} ${eyeY + 2}Q${x} ${eyeY - hh * .55} ${ox} ${eyeY + 1.5}` : d`M${ix} ${eyeY + 1}Q${x} ${eyeY + hh * .42} ${ox} ${eyeY}`;
        s += `<path d="${lp}" fill="none" stroke="${LINE}" stroke-width="${lw(happy ? 2 : 1.8)}"/>`;
        if (!happy && lod >= 2) s += `<path d="${d`M${ox - sd * 1} ${eyeY + .6}l${sd * 3} ${1.6}`}" stroke="${LINE}" stroke-width="${lw(1.2)}"/>`;
      }
      return s;
    }
    // the eye's shape in its own frame: inner corner at -x, outer at +x
    const es = L.ap.eyeShape | 0;
    let up1 = -.62, up2 = es === 0 ? -.7 : es === 2 ? -.56 : -.66, oy = -.1 + lift + (es === 1 ? -.12 : es === 2 ? .08 : 0), lo = es === 0 ? .64 : .6;
    if (E.k === 'angry') { up1 = -.18; up2 = -.78; }
    if (E.k === 'sad') { up1 = -.74; up2 = -.42; oy = .14; }
    if (E.k === 'smile') lo = .28;
    if (E.k === 'frown') { up1 = -.46; up2 = -.6; }
    const irx = w * (E.k === 'surprised' ? .23 : .3) * (L.small ? 1.06 : 1), iry = irx * 1.36, icx = -w * .06, icy = hh * .1;
    const fl = (L.F || race === 'elf' ? 1 : .45) * (L.small ? .8 : 1);
    // the same eye (shape, size, colour, line, detail) is built once per page and reused
    const ekey = [w, hh, up1, up2, oy, lo, irx, L.eye, L.eyeD, L.skin.line, lod, k.lw, fl, L.F, PREC].join();
    let ent = EYES.get(ekey);
    if (!ent) { ent = eyeGroup(L, { w, hh, up1, up2, oy, lo, irx, iry, icx, icy, fl, lod, lw }); if (EYES.size > 600) EYES.clear(); EYES.set(ekey, ent); }
    Object.assign(G.defs, ent.defs);
    const yid = ent.yid, sc = w / 20;
    for (const sd of [-1, 1]) {
      if (L.lostEye && sd === 1) continue;
      const x = sd < 0 ? exL : exR;
      s += `<use href="#${yid}" transform="${sd < 0 ? d`translate(${x} ${eyeY}) scale(-1 1)` : d`translate(${x} ${eyeY})`}"/>`;
      // catchlights: r 2.6 at the upper left (the light side), r 1.2 at the lower right
      const gx = x - sd * icx, gy = eyeY + icy;
      s += `<circle cx="${R(gx - irx * .42)}" cy="${R(gy - iry * .36)}" r="${R(2.6 * sc)}" fill="#fff"/>`;
      if (lod >= 2) s += `<circle cx="${R(gx + irx * .45)}" cy="${R(gy + iry * .32)}" r="${R(1.2 * sc)}" fill="#fff" fill-opacity=".9"/>`;
    }
    return s;
  }
  const EYES = new Map();
  function eyeGroup(L, o) {
    const { w, hh, up1, up2, oy, lo, irx, iry, icx, icy, fl, lod, lw } = o, defs = {};
    const I = [-w / 2, hh * .16], O = [w / 2, hh * oy];
    const white = d`M${I[0]} ${I[1]}C${-w * .32} ${hh * up1} ${w * .28} ${hh * up2} ${O[0]} ${O[1]}C${w * .26} ${hh * lo} ${-w * .26} ${hh * lo} ${I[0]} ${I[1]}Z`;
    const clip = 'ape' + hash(white).toString(36), cid = 'apc' + clip.slice(3);
    defs[clip] = `<path id="${clip}" d="${white}"/>`;
    defs[cid] = `<clipPath id="${cid}"><use href="#${clip}"/></clipPath>`;
    // the iris in two tones: a darker top third (a hard stop, not a blend)
    const gid = 'api' + L.eye.slice(1) + L.eyeD.slice(1);
    defs[gid] = `<linearGradient id="${gid}" x2="0" y2="1"><stop offset=".38" stop-color="${L.eyeD}"/><stop offset=".38" stop-color="${L.eye}"/></linearGradient>`;
    // one eye, drawn once and placed twice (mirrored for the left); the catchlights stay in the head's frame
    let e = `<use href="#${clip}" fill="${WHITE}"/><g clip-path="url(#${cid})">`;
    e += `<ellipse cx="${R(icx)}" cy="${R(icy)}" rx="${R(irx)}" ry="${R(iry)}" fill="url(#${gid})" stroke="${L.eyeD}" stroke-width="${lw(.8)}"/>`;
    if (lod >= 2) e += `<ellipse cx="${R(icx)}" cy="${R(icy + iry * .05)}" rx="${R(irx * .36)}" ry="${R(iry * .4)}" fill="${mix(L.eyeD, LINE, .6)}"/>`;
    // the lid's shadow on the white and the iris
    e += `<path d="${d`M${I[0]} ${I[1]}C${-w * .32} ${hh * up1} ${w * .28} ${hh * up2} ${O[0]} ${O[1]}L${O[0]} ${O[1] + 3.2}C${w * .28} ${hh * up2 + 3.2} ${-w * .32} ${hh * up1 + 3.2} ${I[0]} ${I[1] + 3}Z`}" fill="${SHADE}" fill-opacity=".35"/></g>`;
    // the upper lash line: thick at the outer third, tapering inward, a flick at the outer corner
    const th = t => lerp(.6, 3.3, clamp((t - .05) / .6, 0, 1)) * (L.F ? 1 : .9) * (lod === 1 ? 1.25 : 1);
    const P = t => { const u = 1 - t; return [u * u * u * I[0] + 3 * u * u * t * (-w * .32) + 3 * u * t * t * (w * .28) + t * t * t * O[0], u * u * u * I[1] + 3 * u * u * t * (hh * up1) + 3 * u * t * t * (hh * up2) + t * t * t * O[1]]; };
    const bot = [], top = [];
    for (let i = 0; i <= 5; i++) { const t = i / 5, a = P(t), b = P(Math.min(1, t + .01)), c = P(Math.max(0, t - .01)); let nx = b[1] - c[1], ny = -(b[0] - c[0]); const m = Math.hypot(nx, ny) || 1; nx /= m; ny /= m; if (ny > 0) { nx = -nx; ny = -ny; } bot.push([a[0], a[1]]); top.push([a[0] + nx * th(t), a[1] + ny * th(t)]); }
    bot[0][2] = 1;
    const flick = [O[0] + w * .14 * fl + 1.2, O[1] - hh * .22 * fl - .8, 1];
    e += `<path d="${curve([...bot.slice(0, -1), [O[0] + .6, O[1] + .4], flick, ...top.slice(1).reverse(), [top[0][0], top[0][1]]], true)}" fill="${LINE}"/>`;
    // the lower lid: one short thin stroke at the outer half
    if (lod >= 2) e += `<path d="${d`M${w * .06} ${hh * lo * .78 + .4}Q${w * .3} ${hh * lo * .62} ${w * .46} ${O[1] + hh * .14}`}" fill="none" stroke="${mix(LINE, L.skin.line, .4)}" stroke-width="${lw(.8)}"/>`;
    const yid = 'apy' + hash(e).toString(36);
    defs[yid] = `<g id="${yid}">${e}</g>`;
    return { defs, yid };
  }

  // ---------- brows: tapered strokes at y 52, angled by mood and by the traits stern, kind and proud
  function brows(G, L, k, o) {
    const { exL, exR, eyeY, eyeW, eyeH, lw } = o, E = L.expr, tr = new Set(L.p.traits || []), lod = G.lod;
    if (L.baby && lod < 2) return '';
    let s = '';
    const by = eyeY - (L.small ? 13 : 12) - (eyeH - 13) * .3 - (E.k === 'surprised' ? 4 : 0);
    let inner = 0, outer = 0, arch = 1.6;
    if (E.k === 'angry') { inner = 3.4; outer = -1.4; arch = .6; }
    else if (E.k === 'sad') { inner = -3.2; outer = 1.6; arch = .4; }
    else if (E.k === 'frown') { inner = 1.8; outer = -.4; arch = .9; }
    else if (E.k === 'surprised') arch = 2.6;
    else if (E.k === 'smile' || E.k === 'grin') { inner = -.6; arch = 2; }
    if (tr.has('stern') || tr.has('stoic')) inner += 1;
    if (tr.has('kind')) inner -= .8;
    const proud = tr.has('proud');
    const heavy = ['orc', 'dwarf', 'giant'].includes(L.race) ? 1.5 : L.F ? .85 : 1.15;
    const bw = heavy * (lod <= 1 ? 1.5 : 1) * (L.baby ? .6 : 1) * ([1, 1.25, .82][L.ap.brow | 0] || 1);
    const col = mix(L.hair.b, LINE, L.grey > .6 ? .35 : .55);
    for (const sd of [-1, 1]) {
      const x = sd < 0 ? exL : exR, ix = x - sd * eyeW * .42, ox = x + sd * eyeW * .62;
      const up = proud && sd === 1 ? -1.8 : 0;
      const iy = by + inner + up, oyy = by + 2 + outer + up;
      const mx = (ix + ox) / 2, my = (iy + oyy) / 2 - arch;
      s += `<path d="${limb([[ix, iy], [mx, my], [ox, oyy]], [bw * 1.05, bw * .8, bw * .25], true)}" fill="${col}"/>`;
    }
    return s;
  }

  // ---------- nose: a short tick on the shadow side; a dot for children; nostrils for orcs and dwarves
  function nose(G, L, k, o) {
    const { noseY, lw } = o, race = L.race, lod = G.lod, sk = L.skin;
    if (lod === 0) return '';
    if (L.small) return `<path d="${d`M51 ${noseY - .8}q1.2 .9 .2 1.8`}" fill="none" stroke="${sk.line}" stroke-width="${lw(1)}"/>`;
    let s = '';
    const len = (L.oldF > .6 ? 7 : 4.5) * ([1, 1.2, .82][L.ap.nose | 0] || 1);
    if (race === 'orc' || race === 'halforc') {
      s += `<path d="${d`M44.5 ${noseY - 1}Q50 ${noseY - 4} 55.5 ${noseY - 1}Q56 ${noseY + 2.5} 50 ${noseY + 2.2}Q44 ${noseY + 2.5} 44.5 ${noseY - 1}Z`}" fill="${sk.s}"/>`;
      s += `<path d="${d`M46.5 ${noseY + .6}h2M51.5 ${noseY + .6}h2`}" stroke="${sk.line}" stroke-width="${lw(1.2)}"/>`;
      return s;
    }
    if (race === 'dwarf' || race === 'giant') {
      s += `<path d="${d`M53 ${noseY - len - 2}Q57.5 ${noseY - 1} 55 ${noseY + 1.6}Q50 ${noseY + 3.4} 45.5 ${noseY + 1}`}" fill="none" stroke="${sk.line}" stroke-width="${lw(1)}"/>`;
      s += `<path d="${d`M47.6 ${noseY + .6}h1.6M51.4 ${noseY + .9}h1.6`}" stroke="${sk.line}" stroke-width="${lw(1.1)}"/>`;
      return s;
    }
    const kink = L.nose ? d`L${55.6} ${noseY - len * .5}` : '';
    s += `<path d="${d`M53.4 ${noseY - len}${kink}Q55.4 ${noseY - 1.2} 54.2 ${noseY + .6}`}" fill="none" stroke="${sk.line}" stroke-width="${lw(1)}"/>`;
    if (lod >= 2) s += `<path d="${d`M50.5 ${noseY + 1.2}Q53 ${noseY + 1.8} 54.4 ${noseY + .6}L54.6 ${noseY + 1.8}Q52 ${noseY + 3} 50.5 ${noseY + 1.2}Z`}" fill="${sk.s}"/>`;
    if (L.nose && lod >= 2) s += `<path d="${d`M46.5 ${noseY - len * .55}l7 -1.2l.5 2.4l-7 1.2z`}" fill="#efe3c8" stroke="${sk.line}" stroke-width="${lw(.6)}"/>`;
    return s;
  }

  // ---------- mouth: one stroke whose curve follows the expression; open for the grin, the shout and surprise
  function mouth(G, L, k, o) {
    const { mouthY: y, mouthW: mw, lw } = o, E = L.expr, sk = L.skin, lod = G.lod;
    if (lod === 0) return '';
    const c = mix(sk.line, LINE, .35), x0 = 50 - mw / 2, x1 = 50 + mw / 2, inside = mix('#8a2a3a', sk.b, .15);
    const st = (pth, w = 1) => `<path d="${pth}" fill="none" stroke="${c}" stroke-width="${lw(w)}"/>`;
    let s = '';
    switch (E.k) {
      case 'smile': s += st(d`M${x0} ${y - 1}Q50 ${y + 3.6} ${x1} ${y - 1}`); break;
      case 'grin': {
        const g = d`M${x0 - .5} ${y - 1.4}Q50 ${y - .2} ${x1 + .5} ${y - 1.4}Q${x1 - 1.6} ${y + 6.4} 50 ${y + 6.6}Q${x0 + 1.6} ${y + 6.4} ${x0 - .5} ${y - 1.4}Z`;
        s += `<path d="${g}" fill="${inside}" stroke="${c}" stroke-width="${lw(1)}"/>`;
        if (lod >= 2) s += `<path d="${d`M${50 - mw * .22} ${y + 5.6}Q50 ${y + 2.6} ${50 + mw * .22} ${y + 5.6}Z`}" fill="#e8798a"/>`;
        break;
      }
      case 'frown': s += st(d`M${x0 + 1} ${y + 1.4}Q50 ${y - 1.8} ${x1 - 1} ${y + 1.4}`); break;
      case 'sad': s += st(d`M${x0 + 1.5} ${y + 1.2}Q${50 - mw * .2} ${y - 1.2} 50 ${y}Q${50 + mw * .2} ${y - 1.2} ${x1 - 1.5} ${y + 1.2}`); break;
      case 'angry': {
        const g = d`M${x0} ${y - 1}L${x1} ${y - 1.6}L${x1 - 1.4} ${y + 3.6}Q50 ${y + 4.8} ${x0 + 1.4} ${y + 3.6}Z`;
        s += `<path d="${g}" fill="${inside}" stroke="${c}" stroke-width="${lw(1)}"/>`;
        if (lod >= 2) s += `<path d="${d`M${x0 + .8} ${y - .6}L${x1 - .8} ${y - 1.2}L${x1 - 1.2} ${y + .6}L${x0 + 1.2} ${y + 1.1}Z`}" fill="#f6f1ea"/>`;
        break;
      }
      case 'surprised': s += `<ellipse cx="50" cy="${R(y + 1)}" rx="${R(mw * .2)}" ry="${R(mw * .26)}" fill="${inside}" stroke="${c}" stroke-width="${lw(1)}"/>`; break;
      case 'closed': s += st(d`M${x0 + 1.5} ${y + .2}Q50 ${y + .8} ${x1 - 1.5} ${y + .2}`, .9); break;
      case 'sleep': s += st(d`M${x0 + 2} ${y}Q50 ${y + 1.6} ${x1 - 2} ${y}`, .9); break;
      default: s += st(d`M${x0 + .5} ${y}Q50 ${y + 1.4} ${x1 - .5} ${y - .2}`);
    }
    // the lower lip's small shadow (not on the old: thinner lips)
    if (lod >= 3 && G.size >= 140 && L.oldF < .6 && !['grin', 'angry', 'surprised'].includes(E.k)) s += `<path d="${d`M${50 - mw * .2} ${y + 3.4}Q50 ${y + 4.2} ${50 + mw * .2} ${y + 3.4}`}" fill="none" stroke="${sk.s}" stroke-width="${lw(1.2)}"/>`;
    return s;
  }

  // ---------- marks on the face: a scar, a burn, a brand, a birthmark, war paint
  function marks(G, L, k, o) {
    const { exL, exR, eyeY, eyeW, eyeH, mouthY, mouthW, chinY, lw } = o, lod = G.lod, ap = L.ap;
    if (lod === 0) return '';
    let s = '';
    if (L.scar) {
      const x0 = exL + 4, y0 = eyeY - eyeH * 1.5, x1 = exL - 6, y1 = eyeY + eyeH * 1.7;
      s += `<path d="${d`M${x0} ${y0}Q${(x0 + x1) / 2 + 2} ${(y0 + y1) / 2} ${x1} ${y1}`}" fill="none" stroke="#b8505a" stroke-width="${lw(1.6)}"/>`;
      if (lod >= 2) for (let i = 1; i < 4; i++) { const q = i / 4, x = lerp(x0, x1, q) + 1.2, y = lerp(y0, y1, q); s += `<path d="${d`M${x - 2.2} ${y - .8}l4.4 1.6`}" stroke="#9a3a48" stroke-width="${lw(.7)}"/>`; }
    }
    if (L.burn) s += `<path d="${d`M${exR - 6} ${eyeY + eyeH}q9 -4 13 4q-1 8 -10 7q-6 -2 -3 -11z`}" fill="#b4505a" fill-opacity=".35"/>` + (lod >= 2 ? `<path d="${d`M${exR - 3} ${eyeY + eyeH + 4}q3 -1 5 1M${exR} ${eyeY + eyeH + 8}q2 -1 4 0`}" fill="none" stroke="#9a3a48" stroke-width="${lw(.6)}"/>` : '');
    if (L.brand) s += `<path d="${d`M${exR + 4} ${mouthY - 7}a2.6 2.6 0 1 0 .1 0M${exR + 4} ${mouthY - 10}v6`}" fill="none" stroke="#8a2a24" stroke-width="${lw(1)}"/>`;
    if (L.birthmark && lod >= 2) s += `<ellipse cx="${R(exR + 5)}" cy="${R(eyeY + eyeH + 6)}" rx="1.4" ry="1.1" fill="#6a2a30" fill-opacity=".55"/>`;
    if (ap.paint === 'warpaint') s += `<path d="${d`M${exL - eyeW * .62} ${eyeY - eyeH * .3}L${exR + eyeW * .62} ${eyeY - eyeH * .3}L${exR + eyeW * .5} ${eyeY + eyeH * .9}L${exL - eyeW * .5} ${eyeY + eyeH * .9}Z`}" fill="${L.arms.f}" fill-opacity=".3"/>`;
    else if (ap.paint && ap.paint !== 'none' && lod >= 2) {
      const c = ap.paint === 'dots' ? '#2a4a8a' : '#a83a2a';
      if (ap.paint === 'dots') for (const x of [exL, exR]) for (let i = 0; i < 3; i++) s += `<circle cx="${R(x - 3 + i * 3)}" cy="${R(eyeY + eyeH + 4)}" r="1" fill="${c}"/>`;
      else s += `<path d="${d`M${exL - 5} ${eyeY + eyeH * .7 + 2}l7 1.4M${exL - 5} ${eyeY + eyeH * .7 + 5}l7 1.4M${exR + 5} ${eyeY + eyeH * .7 + 2}l-7 1.4M${exR + 5} ${eyeY + eyeH * .7 + 5}l-7 1.4`}" stroke="${c}" stroke-width="${lw(1.4)}"/>`;
    }
    return s;
  }

  // ---------- beards: a mass with pointed clumps, a shadow band, a moustache
  function beard(G, L, k, o) {
    const { jaw, chinY, mouthY, mouthW, noseY, lw } = o, hr = L.hair, bd = L.beard, race = L.race;
    const extra = race === 'dwarf' ? 34 : race === 'giant' ? 8 : 0;
    const len = ({ stubble: 0, short: 6, full: 14, long: 34, braided: 38, forked: 30, goatee: 9, muttonchops: 0, mustache: 0 }[bd] || 8) + (['mustache', 'muttonchops', 'stubble'].includes(bd) ? 0 : extra);
    let s = '';
    const mo = d`M${50 - mouthW * .95} ${mouthY + 1.2}Q${50 - mouthW * .6} ${mouthY - 4.4} 50 ${mouthY - 2.6}Q${50 + mouthW * .6} ${mouthY - 4.4} ${50 + mouthW * .95} ${mouthY + 1.2}Q${50 + mouthW * .4} ${mouthY - 1.2} 50 ${mouthY - .4}Q${50 - mouthW * .4} ${mouthY - 1.2} ${50 - mouthW * .95} ${mouthY + 1.2}Z`;
    if (bd === 'stubble') {
      const pts = [[jaw[0][0] + 1, 74], [jaw[1][0] + 1, jaw[1][1]], [jaw[2][0] + .5, jaw[2][1]], [jaw[3][0], jaw[3][1]], [50, chinY], ...mirror([[jaw[3][0], jaw[3][1]], [jaw[2][0] + .5, jaw[2][1]], [jaw[1][0] + 1, jaw[1][1]], [jaw[0][0] + 1, 74]], 50)];
      return `<path d="${curve([...pts, [100 - 14, 88], [50 + mouthW, mouthY - 3], [50, noseY + 5], [50 - mouthW, mouthY - 3], [14, 88]], true)}" fill="${hr.s}" fill-opacity=".28"/>`;
    }
    if (bd !== 'mustache' && bd !== 'goatee') {
      // the mass hangs from the cheeks along the jaw; the mouth stays open in it
      const by = chinY + len, wide = race === 'dwarf' ? 6 : 2;
      const tips = [];
      const n = race === 'dwarf' ? 7 : 5;
      for (let i = 0; i <= n; i++) { const q = i / n, x = lerp(jaw[2][0] - wide, 100 - jaw[2][0] + wide, q), sag = Math.sin(q * Math.PI); tips.push([x, lerp(jaw[2][1] + 2, by, sag) + (i % 2 ? -3 : 1.5), i % 2 ? 0 : 1]); }
      if (bd === 'forked') { tips.splice(Math.floor(tips.length / 2), 0, [50, by - len * .45, 1]); }
      const outer = [[jaw[0][0] - .5, 66], [jaw[1][0] - wide * .6, jaw[1][1] + 1], ...tips, [100 - jaw[1][0] + wide * .6, jaw[1][1] + 1], [100 - jaw[0][0] + .5, 66]];
      const inner = [[100 - jaw[0][0] - 6, 80], [50 + mouthW * .9, mouthY - 1], [50 + mouthW * .55, mouthY + 4.5], [50 - mouthW * .55, mouthY + 4.5], [50 - mouthW * .9, mouthY - 1], [jaw[0][0] + 6, 80]];
      if (bd === 'muttonchops') {
        for (const sd of [-1, 1]) { const pts = [[jaw[0][0] - .5, 64], [jaw[1][0] - 1, jaw[1][1] + 2], [50 - mouthW * 1.05, mouthY + 2, 1], [jaw[0][0] + 9, 76]]; s += `<path d="${curve(sd < 0 ? pts : mirror(pts, 50), true)}" fill="${hr.b}" stroke="${LINE}" stroke-width="${lw(1)}"/>`; }
      } else {
        const bdD = curve([...outer, ...inner], true);
        const id = G.ref('apd', bdD);
        s += `<use href="#${id}" fill="${hr.b}" stroke="${LINE}" stroke-width="${lw(1)}"/>`;
        s += `<use href="#${id}" fill="${hr.s}" clip-path="url(#${useDef(G, 'apsF')})"/>`;
        if (G.lod >= 2 && !G.lite && G.size >= 100) {
          let st = '';
          for (const x of [34, 44, 56, 66]) st += emit([['M', x, mouthY + 8], ['Q', x + (x < 50 ? -2 : 2), (mouthY + by) / 2, x + (x < 50 ? -1 : 1), by - 6]]);
          s += `<path d="${st}" fill="none" stroke="${hr.line}" stroke-width="${lw(.7)}" stroke-opacity=".7"/>`;
          if (bd === 'braided') for (let i = 0; i < 3; i++) s += `<rect x="46" y="${R(chinY + len * (.45 + i * .18))}" width="8" height="2.6" rx="1" fill="#e8b04a" stroke="${LINE}" stroke-width="${lw(.6)}"/>`;
          if (race === 'dwarf') s += `<rect x="45.5" y="${R(by - 9)}" width="9" height="3.4" rx="1.2" fill="#e8b04a" stroke="${LINE}" stroke-width="${lw(.7)}"/>`;
        }
      }
    }
    if (bd === 'goatee') s += `<path d="${d`M${50 - mouthW * .4} ${mouthY + 3.4}Q50 ${mouthY + 2.2} ${50 + mouthW * .4} ${mouthY + 3.4}L${50 + 2} ${chinY + len}L50 ${chinY + len + 2}L${50 - 2} ${chinY + len}Z`}" fill="${hr.b}" stroke="${LINE}" stroke-width="${lw(.9)}"/>`;
    s += `<path d="${mo}" fill="${hr.b}" stroke="${LINE}" stroke-width="${lw(.9)}"/>`;
    return s;
  }

  // ---------- hair behind the head: short, bob, shoulder, long, tied, braid, bun, topknot, shaved, hooded
  function backHair(G, L, k, chinY) {
    const hr = L.hair, b = L.back, v = L.vol + 3, lw = w => RW(w * k.lw), p = L.p, lod = G.lod;
    if (b === 'shaved' || b === 'hooded') return '';
    let s = '';
    const tipsRow = (y0, xl, xr, n, depth, key) => {
      const pts = [];
      for (let i = 0; i <= n; i++) { const q = i / n; pts.push([lerp(xl, xr, q) + hs(p, key + i, 1.5), y0 + (i % 2 ? -depth : 0) + hs(p, key + 'y' + i, 2), i % 2 ? 0 : 1]); }
      return pts;
    };
    let pts = null;
    const top = [[-v - 2, 46], [-v * .5 + 3, 4 - v * .5], [50, -v - 3], [97 + v * .5, 4 - v * .5], [102 + v, 46]];
    if (b === 'short') pts = [...top, [101 + v * .5, 74], [92, 86, 1], [8, 86, 1], [-1 - v * .5, 74]];
    else if (b === 'bob' || b === 'tied' || b === 'braid' || b === 'bun' || b === 'topknot') {
      const low = b === 'bob' ? chinY - 4 : b === 'topknot' ? 70 : 86;
      pts = [...top, [104 + v, 80], ...tipsRow(low, 104 + v * .6, 82, 3, 6, 'bb').reverse().map(q => q), [50, low - 10], ...tipsRow(low, 18, -4 - v * .6, 3, 6, 'bl').map(q => q), [-4 - v, 80]];
      if (b !== 'bob') pts = [...top, [101 + v * .5, 76], [90, low, 1], [10, low, 1], [-1 - v * .5, 76]];
    } else if (b === 'shoulder') {
      const low = chinY + 30;
      pts = [...top, [108 + v, 80], [112 + v, low - 10], ...tipsRow(low, 112 + v, -12 - v, 6, 9, 'bs'), [-12 - v, low - 10], [-8 - v, 80]];
    } else if (b === 'long') {
      const low = k.longTo || 260;
      pts = [...top, [108 + v, 80], [116 + v, low - 14], ...tipsRow(low, 114 + v, -14 - v, 6, 12, 'bL'), [-16 - v, low - 14], [-8 - v, 80]];
    }
    if (!pts) return '';
    if (L.curly) pts = pts.map((q, i) => i > 4 && !q[2] ? [q[0] + (q[0] < 50 ? -3 : 3), q[1]] : q);
    const D = curve(pts, true);
    const id = G.ref('apb', D);
    s += `<use href="#${id}" fill="${hr.s}" stroke="${LINE}" stroke-width="${lw(1.1)}"/>`;
    // the outer locks catch the light; the hair behind the neck stays dark
    if (lod >= 1 && b !== 'short') s += `<use href="#${id}" fill="${hr.d}" transform="matrix(.62 0 0 1 19 4)"/>`;
    if (lod >= 2 && !G.lite && G.size >= 100 && (b === 'long' || b === 'shoulder')) {
      let st = '';
      const low = b === 'long' ? (k.longTo || 260) - 30 : chinY + 18;
      for (const x of [-6, 4, 96, 106]) st += emit([['M', x, 90], ['Q', x + (x < 50 ? -3 : 3), (90 + low) / 2, x + (x < 50 ? -1 : 1), low]]);
      s += `<path d="${st}" fill="none" stroke="${hr.line}" stroke-width="${lw(.8)}" stroke-opacity=".6"/>`;
    }
    // a tail tied at the nape falls behind one shoulder; twin tails for girls
    if (b === 'tied' && !L.covered) {
      const twin = L.F && (L.small || L.teen || hf(p, 'twin') < .25);
      const sides = twin ? [-1, 1] : [hf(p, 'tail') < .5 ? -1 : 1];
      for (const sd of sides) {
        const x0 = 50 + sd * (twin ? 46 : 40), y0 = twin ? 40 : 78;
        const tail = limb([[x0, y0], [x0 + sd * (twin ? 22 : 14), y0 + 40], [x0 + sd * (twin ? 18 : 10), y0 + (twin ? 100 : 110)], [x0 + sd * (twin ? 8 : 2), y0 + (twin ? 140 : 150)]], [9, 13, 10, 1], true);
        const tid = G.ref('apb', tail);
        s += `<use href="#${tid}" fill="${hr.b}" stroke="${LINE}" stroke-width="${lw(1)}"/><use href="#${tid}" fill="${hr.s}" clip-path="url(#${useDef(G, 'apsH')})"/>`;
        s += `<rect x="${R(x0 - 5)}" y="${R(y0 - 3)}" width="10" height="6" rx="2" fill="${L.rib}" stroke="${LINE}" stroke-width="${lw(.8)}"/>`;
      }
    }
    return s;
  }

  // ---------- hair in front: side locks and the bangs (5 to 9 pointed clumps of quadratic curves), the extra
  function frontHair(G, L, k, o) {
    const { eyeY, chinY, lw } = o, hr = L.hair, p = L.p, v = L.vol + 3, lod = G.lod, style = L.bangs;
    let locks = '', bangs = '';
    if (L.back === 'hooded' && !['veil', 'hood', 'cowl', 'helm:coif'].includes(L.hat)) return { locks, bangs };
    const shaded = (D, key, w = 1.1) => { const id = G.ref(key, D); return `<use href="#${id}" fill="${hr.b}" stroke="${LINE}" stroke-width="${lw(w)}"/>` + (lod >= 1 ? `<use href="#${id}" fill="${hr.s}" clip-path="url(#${useDef(G, 'apsH')})"/>` : ''); };
    if (L.back === 'shaved') {
      // the scalp: a cool shadow of stubble, a fringe round the back for the bald, a crest for the mohawk
      let s = '';
      if (!L.bald) s += `<path d="${d`M-1 50A51 51 0 0 1 101 50Q86 30 50 26Q14 30 -1 50Z`}" fill="${hr.s}" fill-opacity=".4"/>`;
      else for (const sd of [-1, 1]) { const pts = [[-1.5, 66], [-3, 44], [6, 36], [4, 56]]; s += `<path d="${curve(sd < 0 ? pts : mirror(pts, 50), true)}" fill="${hr.b}" stroke="${LINE}" stroke-width="${lw(.9)}"/>`; }
      if (lod >= 2) s += `<path d="${d`M18 16Q30 6 44 5`}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="${lw(2.6)}"/>`;
      if (L.mohawk) s += shaded(d`M40 32Q34 6 42 -14Q50 -30 58 -14Q66 6 60 32Q50 24 40 32Z`, 'aph');
      return { locks, bangs: s };
    }
    // ---- side locks: framing the face, in front of the ears; two on each side for long hair
    const long = ['long', 'shoulder', 'bob', 'tied', 'braid'].includes(L.back) && (L.F || L.back === 'long' || L.back === 'shoulder');
    const lockEnd = L.back === 'long' ? chinY + 30 : L.back === 'shoulder' ? chinY + 14 : L.back === 'bob' ? chinY - 6 : L.F ? chinY - 12 : 76;
    if (!L.baby && !L.covered && !L.locks) for (const sd of [-1, 1]) {
      if (!long && L.back !== 'short' && !L.F) continue;
      const x0 = sd < 0 ? -v * .45 : 100 + v * .45, inw = -sd, end = (long ? lockEnd : 74) + hs(p, 'ly' + sd, 3);
      const tip = x0 + inw * (long ? 11 : 7) + hs(p, 'lx' + sd, 2);
      const D = limb([[x0 + inw * 5, 30], [x0 - sd * 1.5, (30 + end) * .5 + 4], [tip, end]], [long ? 9.5 : 7, long ? 7 : 5, .4], true);
      locks += shaded(D, 'apl', 1);
      if (lod >= 3 && G.size >= 140) locks += `<path d="${lens(x0 + inw * 6, 40, tip + sd * 1.2, end - 6, sd * 2.4)}" fill="${hr.s}"/>`;
      if (long && lod >= 3 && (G.size >= 100 || L.back === 'long')) {
        const D2 = limb([[50 + sd * 44, 36], [50 + sd * 51, (36 + lockEnd) / 2 + 10], [50 + sd * 45, lockEnd + 18]], [6, 5, .4], true);
        locks = shaded(D2, 'apl', .9) + locks;
      }
    }
    // rope locks hang over the shoulders, three to a side, banded
    if (L.locks && !L.covered && !L.baby) {
      let rp = '', bands = '';
      for (const sd of [-1, 1]) for (let j = 0; j < (G.lite ? 2 : 3); j++) {
        const x0 = 50 + sd * (40 + j * 7), y1 = chinY + 34 - j * 12 + hs(p, 'rope' + sd + j, 6);
        rp += limb([[x0, 34 + j * 4], [x0 + sd * (3 + j), (34 + y1) / 2], [x0 + sd * (1 + j * 2), y1]], [4.2, 4.6, 3.6]);
        if (lod >= 2 && G.lite < 2 && G.size >= 100) bands += emit([['M', x0 + sd * (3 + j) - 4, (34 + y1) / 2 + 6], ['L', x0 + sd * (3 + j) + 4, (34 + y1) / 2 + 8]]);
      }
      locks += `<path d="${rp}" fill="${hr.b}" stroke="${LINE}" stroke-width="${lw(.9)}"/>` + (bands ? `<path d="${bands}" stroke="${L.rib}" stroke-width="${lw(2.6)}"/>` : '');
    }
    // a braid over the shoulder, in front
    if ((L.back === 'braid' || L.extra === 'braid') && !L.covered) {
      const sd = hf(p, 'braid') < .5 ? -1 : 1, twin = L.back === 'braid' && (L.race === 'dwarf' || hf(p, 'braid2') < .3);
      for (const s2 of twin ? [-1, 1] : [sd]) {
        const x = 50 + s2 * 46, n = L.back === 'braid' ? (G.size >= 140 ? 6 : G.lite > 1 ? 4 : 5) : G.lite > 1 ? 3 : 4;
        let br = '', bs = '';
        for (let i = 0; i < n; i++) { const y = 74 + i * 14, xx = x + s2 * i * 1.4; br += lens(xx - s2 * 6, y, xx + s2 * 5, y + 16, 6.4); bs += lens(xx + s2 * 1.5, y + 4, xx + s2 * 4.6, y + 14, 2); }
        br = `<path d="${br}" fill="${hr.b}" stroke="${LINE}" stroke-width="${lw(.9)}"/>` + (lod >= 3 && G.size >= 140 ? `<path d="${bs}" fill="${hr.s}"/>` : '');
        br += `<path d="${d`M${x + s2 * n * 1.4} ${74 + n * 14 - 2}l${-s2 * 3} 14l${s2 * 3} -4l${s2 * 3} 4Z`}" fill="${hr.b}" stroke="${LINE}" stroke-width="${lw(.8)}"/><rect x="${R(x + s2 * n * 1.4 - 4.5)}" y="${R(72 + n * 14)}" width="9" height="5" rx="2" fill="${L.rib}" stroke="${LINE}" stroke-width="${lw(.8)}"/>`;
        locks += br;
      }
    }
    // ---- the bangs: the cap of hair over the cranium, its lower edge a row of pointed clumps
    const hl = x => 18 + 18 * Math.pow((x - 50) / 48, 2);               // the hairline
    // wide clumps shaped like fangs, of varied length, with deep notches between them
    const n = { blunt: 6, parted: 6, sideL: 5, sideR: 5, spiky: 5, curtain: 6, wisps: 7, swept: 0, messy: 5, short: 6, long: 5, crest: 5, baby: 3 }[style] || 5;
    const yS = long ? 56 : 52, rec = L.recede ? 7 : 0;
    const tL = [4 + rec, 44 - rec * 1.5], tR = [96 - rec, 44 - rec * 1.5];
    const tips = [], val = [];
    const part = .42 + hs(p, 'part', .1), fem = L.F ? 4 : 0;
    for (let i = 0; i < n; i++) {
      const u = (i + .5) / n;
      let x = lerp(9, 91, u), y = 54, bow = 0, q = .28;
      switch (style) {
        case 'blunt': y = 57 + (i % 2 ? -2 : 1.2); q = .36; break;
        case 'parted': { const dd = u - part; y = 46 + Math.abs(dd) * 30 + fem; bow = dd < 0 ? -1.2 : 1.2; q = .24; break; }
        case 'curtain': { const dd = u - .5; y = 38 + Math.pow(Math.abs(dd) * 2, 1.3) * 36; bow = dd < 0 ? -1.4 : 1.4; q = .2; break; }
        case 'sideL': y = 68 - u * 20 + fem * .5; bow = -1.5; x -= 4; q = .26; break;
        case 'sideR': y = 48 + u * 20 + fem * .5; bow = 1.5; x += 4; q = .26; break;
        case 'long': { const sd = hf(p, 'longside') < .5; y = sd ? 74 - u * 26 : 48 + u * 26; bow = sd ? -1.5 : 1.5; q = .26; break; }
        case 'spiky': y = (i % 2 ? 46 : 60) + hs(p, 'sy' + i, 3); bow = hs(p, 'sb' + i, 1.3); q = .16; break;
        case 'messy': y = 52 + hs(p, 'my' + i, 7) + fem * .5; bow = hs(p, 'mb' + i, 1.3); q = .16 + hf(p, 'mq' + i) * .16; break;
        case 'wisps': y = 56 + hs(p, 'wy' + i, 4); bow = hs(p, 'wb' + i, .6); q = .06; break;
        case 'short': y = 40 + hs(p, 'ty' + i, 3); bow = hs(p, 'tb' + i, .8); q = .32; break;
        case 'crest': y = 36 + Math.abs(u - .5) * 18; bow = u < .5 ? -1.4 : 1.4; q = .32; break;
        case 'baby': y = 30 + (i === 1 ? 8 : 0); bow = i - 1; q = .3; break;
      }
      x += hs(p, 'bx' + i, 1.8); y += hs(p, 'by' + i, 2.6);
      if (L.recede) y = Math.min(y, 34);
      if (L.small && style !== 'baby') y = Math.min(y, eyeY - 10);
      tips.push({ x: x + bow * 4.5, y, bow, q });
    }
    for (let i = 0; i <= n; i++) {
      if (i === 0) { val.push(tL); continue; }
      if (i === n) { val.push(tR); continue; }
      const a = tips[i - 1], b = tips[i], x = (a.x + b.x) / 2 - (a.bow + b.bow) * 1.6, y0 = hl(x), ty = Math.min(a.y, b.y);
      let q = (a.q + b.q) / 2;
      if ((style === 'parted' || style === 'curtain') && (a.bow < 0) !== (b.bow < 0)) q = 0;
      val.push([x, y0 + (ty - y0) * q]);
    }
    // the top of the mass: a dip at the parting, or tufts for spiky hair, else a smooth crown
    const px = 50 + (part - .5) * 40;
    const crown = ['parted', 'curtain', 'sideL', 'sideR', 'long'].includes(style) ? [[px - 14, -v - 4.2], [px, -v - 1, 1], [px + 14, -v - 4.2]]
      : ['spiky', 'messy', 'crest'].includes(style) || L.wild ? [[32, -v - 3.5], [40 + hs(p, 'tf1', 3), -v - 9, 1], [49, -v - 4], [59 + hs(p, 'tf2', 3), -v - 10, 1], [67, -v - 3.5]]
      : [[27 + hs(p, 't1', 2), -v - 2.5], [50, -v - 3.5], [73 + hs(p, 't2', 2), -v - 2.5]];
    const top = [[-v - 1.5, 30], [3 - v * .8, 4 - v * .5], ...crown, [97 + v * .8, 4 - v * .5], [101.5 + v, 30]];
    const capTop = curve([[-v * .5 - .5, yS], ...top, [100.5 + v * .5, yS]], false);
    const eg = [['L', tR[0], tR[1]]];
    if (style === 'swept') eg.push(['Q', 86, 22, 62, 18], ['Q', 55, 23, 50, 26], ['Q', 45, 23, 38, 18], ['Q', 14, 22, tL[0], tL[1]]);
    else for (let i = n - 1; i >= 0; i--) {
      const t = tips[i], vr = val[i + 1], vl = val[i];
      eg.push(['Q', lerp(vr[0], t.x, .8) + t.bow * 3, lerp(vr[1], t.y, .4), t.x, t.y], ['Q', lerp(vl[0], t.x, .8) + t.bow * 3, lerp(vl[1], t.y, .4), vl[0], vl[1]]);
    }
    const edge = emit(eg, [100.5 + v * .5, yS]);
    const cap = capTop + edge + 'Z';
    const cid = G.ref('aph', cap);
    // under the bangs: a darker layer of hair that shows in the gaps between the clumps (the shadow band)
    const minTip = Math.min(...tips.map(t => t.y), 60);
    const uy = Math.max(hl(50) + 6, minTip - (style === 'wisps' ? 14 : 9));
    const under = style === 'swept' || style === 'baby' ? null : d`M${tL[0] - 2} ${tL[1] - 6}Q50 ${hl(50) * 2 - tL[1] - 2} ${tR[0] + 2} ${tR[1] - 6}L${tR[0]} ${tR[1]}Q50 ${uy * 2 - tR[1] - 6} ${tL[0]} ${tL[1]}Z`;
    const uid = under ? G.ref('aph', under) : null;
    // the bangs' occlusion shadow on the forehead, then the under layer, the cap and its shadow side
    if (lod >= 1) bangs += `<use href="#${cid}" fill="${L.skin.s}" transform="translate(1.6 4.4)"/>` + (uid ? `<use href="#${uid}" fill="${L.skin.s}" transform="translate(1.6 3.6)"/>` : '');
    if (uid) bangs += `<use href="#${uid}" fill="${hr.d}"/>`;
    bangs += `<use href="#${cid}" fill="${hr.b}" stroke="${LINE}" stroke-width="${lw(1.1)}"/>`;
    if (lod >= 1) bangs += `<use href="#${cid}" fill="${hr.s}" clip-path="url(#${useDef(G, 'apsH')})"/>`;
    const capped = !!L.hat && !['fillet', 'leaves', 'feathers', 'circlet'].includes(L.hat);
    if (lod >= 2 && style !== 'swept' && !capped) {
      // a shadow sliver down the far side of each clump, and a thin strand in some of the notches
      let w = '', th = '';
      for (let i = 0; i < n; i++) {
        const t = tips[i], vr = val[i + 1], len = .8 + hf(p, 'wl' + i) * .1;
        const a = [lerp(vr[0], t.x, .14) - 1.4, lerp(vr[1], t.y, .14) + 1], b = [lerp(vr[0], t.x, len) + t.bow, lerp(vr[1], t.y, len)];
        w += lens(a[0], a[1], b[0], b[1], (t.bow >= 0 ? -1 : 1) * 2.8);
        if (lod >= 3 && !G.lite && i > 0 && hf(p, 'thin' + i) < .4) { const v0 = val[i], ln = (Math.min(tips[i - 1].y, t.y) - v0[1]) * .8; th += lens(v0[0], v0[1] - 1, v0[0] + t.bow * 2 + hs(p, 'tx' + i, 1.5), v0[1] + ln, 2.2); }
      }
      // the clumps' own lines, from each notch up into the mass, curving with the hair's fall
      let cl = '';
      const cx0 = 50 + (part - .5) * 36;
      for (let i = 1; i < n; i++) { const v0 = val[i], b2 = (tips[i - 1].bow + tips[i].bow) / 2, ex = lerp(v0[0], cx0, .45), ey = lerp(v0[1], -v, .5); cl += emit([['M', v0[0], v0[1]], ['Q', lerp(v0[0], ex, .5) - b2 * 4, lerp(v0[1], ey, .55), ex, ey]]); }
      bangs += `<path d="${w}" fill="${hr.s}"/>` + (G.lite ? '' : `<path d="${cl}" fill="none" stroke="${hr.line}" stroke-width="${lw(.9)}"/>`);
      if (th) bangs += `<path d="${th}" fill="${hr.b}" stroke="${LINE}" stroke-width="${lw(.8)}"/>`;
    }
    // the angel ring: 3 to 5 short jagged arcs of light at 30% of the head's height, broken by the strands
    if (lod >= 1 && !L.baby && !capped) {
      const nR = lod >= 2 ? 3 + hash(p.id + 'ring') % 3 : 2, ry = x => 24 - v * .3 + 15 * Math.pow((x - 50) / 50, 2);
      let ring = '';
      const span = 62 / nR;
      for (let i = 0; i < nR; i++) {
        const x0 = 13 + i * span + hs(p, 'rx' + i, 1.5), x1 = x0 + span * .8, xm = (x0 + x1) / 2;
        if (lod >= 2) ring += emit([['M', x0, ry(x0)], ['Q', xm, ry(xm) - 4.4, x1, ry(x1)], ['L', lerp(x0, x1, .82), ry(xm) + 4.6], ['L', lerp(x0, x1, .64), ry(xm) + 1], ['L', lerp(x0, x1, .46), ry(xm) + 5.2], ['L', lerp(x0, x1, .28), ry(xm) + 1], ['L', lerp(x0, x1, .12), ry(xm) + 3.6], ['Z']]);
        else ring += lens(x0, ry(x0), x1, ry(x1), -2.4);
      }
      bangs += `<path d="${ring}" fill="${hr.hi}"/>`;
    }
    // the extra: a high ponytail, a bun, pins, a feather, a band; and the stray strand on top
    const xx = L.extra;
    if (xx === 'ponytail') {
      const sd = hf(p, 'pony') < .5 ? -1 : 1;
      const D = limb([[50 + sd * 28, 0], [50 + sd * 64, 2], [50 + sd * 78, 44], [50 + sd * 68, 104]], [9, 12, 10, .5], true);
      bangs = shaded(D, 'apb', 1.1) + bangs + `<rect x="${R(50 + sd * 32 - 4.5)}" y="-4" width="9" height="9" rx="3" fill="${L.rib}" stroke="${LINE}" stroke-width="${lw(.8)}" transform="rotate(${sd * 30} ${R(50 + sd * 32)} 1)"/>`;
    }
    if (L.back === 'bun' || L.back === 'topknot' || xx === 'bun') {
      const r = L.back === 'topknot' ? 12 : 16, cy = L.back === 'topknot' ? -v - 7 : -v - 5;
      const bun = `<circle cx="50" cy="${R(cy)}" r="${r}" fill="${hr.b}" stroke="${LINE}" stroke-width="${lw(1.1)}"/><path d="${d`M${50 + r * .2} ${cy - r * .95}A${r} ${r} 0 0 1 ${50 + r * .3} ${cy + r * .95}Q${50 + r * .6} ${cy} ${50 + r * .2} ${cy - r * .95}Z`}" fill="${hr.s}"/>` + (lod >= 1 ? `<path d="${lens(50 - r * .72, cy - r * .1, 50 - r * .05, cy - r * .74, -2)}" fill="${hr.hi}"/>` : '');
      bangs = bun + bangs + (L.back === 'topknot' ? `<rect x="43" y="${R(cy + r - 3)}" width="14" height="4.5" rx="1.5" fill="${L.rib}" stroke="${LINE}" stroke-width="${lw(.8)}"/>` : '');
    }
    if (xx === 'pins' && lod >= 2) { const sd = hf(p, 'pins') < .5 ? -1 : 1, x = 50 + sd * 36; bangs += `<path d="${d`M${x} 20L${x + sd * 15} 40`}" stroke="#e8b04a" stroke-width="${lw(1.8)}"/><circle cx="${R(x)}" cy="20" r="3.8" fill="${L.rib}" stroke="${LINE}" stroke-width="${lw(.8)}"/><circle cx="${R(x - 1)}" cy="19" r="1.2" fill="#fff" fill-opacity=".8"/>`; }
    if (xx === 'feather' && lod >= 1) { const sd = hf(p, 'feath') < .5 ? -1 : 1, x = 50 + sd * 46; bangs += `<path d="${d`M${x} 40Q${x + sd * 16} 14 ${x + sd * 10} -16Q${x + sd * 3} 14 ${x} 40Z`}" fill="#f2ead6" stroke="${LINE}" stroke-width="${lw(.8)}"/><path d="${d`M${x + sd * 1.5} 34Q${x + sd * 8} 12 ${x + sd * 9} -9`}" fill="none" stroke="${L.rib}" stroke-width="${lw(1.8)}"/>`; }
    if (xx === 'band' && lod >= 1) { const bp = d`M${-v} 32Q50 ${hl(50) - 8} ${100 + v} 32`; bangs += `<path d="${bp}" fill="none" stroke="${LINE}" stroke-width="${lw(6.6)}"/><path d="${bp}" fill="none" stroke="${L.rib}" stroke-width="${lw(4.6)}"/>`; }
    if (L.ahoge && lod >= 1) { const sd = hf(p, 'ah') < .5 ? -1 : 1; bangs += `<path d="${d`M${50 + sd * 3} ${-v - 2}Q${50 + sd * 5} ${-v - 18} ${50 + sd * 19} ${-v - 20}Q${50 + sd * 9} ${-v - 13} ${50 - sd * 3} ${-v - 2}Z`}" fill="${hr.b}" stroke="${LINE}" stroke-width="${lw(1)}"/>`; }
    return { locks, bangs };
  }

  // ---------- what is worn on the head: crowns, circlets, hoods, veils, hats, helms
  function headwear(G, L, k, o) {
    const { lw } = o, hat = L.hat || '', v = L.vol, p = L.p, lod = G.lod;
    if (!hat) return '';
    const gold = '#e8b04a', goldS = '#a8741a', steel = '#b9bfd0', steelS = '#6e7590';
    let s = '';
    const part = (D, b, sh, w = 1.1) => { const id = G.ref('apw', D); return `<use href="#${id}" fill="${b}" stroke="${LINE}" stroke-width="${lw(w)}"/>` + (lod >= 1 ? `<use href="#${id}" fill="${sh}" clip-path="url(#${useDef(G, 'apsH')})"/>` : ''); };
    const cloth = c => [c, shadeOf(c, .4, 1.1)];
    if (hat === 'crown' || hat === 'circlet') {
      const y0 = 20 - v * .3;
      if (hat === 'crown') {
        const pts = [[8, y0 + 8, 1]];
        for (let i = 0; i <= 8; i++) { const x = lerp(8, 92, i / 8); pts.push([x, i % 2 ? y0 - 6 : y0 - 18, 1]); }
        pts.push([92, y0 + 8, 1]);
        s += part(curve(pts, true), gold, goldS);
        if (!G.lite) for (let i = 0; i <= 8; i += 2) s += `<circle cx="${R(lerp(8, 92, i / 8))}" cy="${R(y0 - 19)}" r="2.8" fill="#fff3c4"/>`;
        s += `<circle cx="50" cy="${R(y0 + 1)}" r="3.6" fill="#d8354a"/>` + (G.size >= 100 && !G.lite ? `<circle cx="28" cy="${R(y0 + 2)}" r="2.6" fill="#2f6ad0"/><circle cx="72" cy="${R(y0 + 2)}" r="2.6" fill="#2f6ad0"/>` : '');
        if (lod >= 2) s += `<path d="${d`M14 ${y0 + 4}L86 ${y0 + 4}`}" stroke="#fff3c4" stroke-width="${lw(1.2)}" stroke-opacity=".7"/>`;
      } else {
        const c = d`M2 ${y0 + 14}Q50 ${y0 - 2} 98 ${y0 + 14}`;
        s += `<path d="${c}" fill="none" stroke="${LINE}" stroke-width="${lw(5.6)}"/><path d="${c}" fill="none" stroke="${gold}" stroke-width="${lw(3.8)}"/><path d="${d`M50 ${y0 + 1}l3.4 4l-3.4 4l-3.4 -4z`}" fill="#3aa0b0" stroke="${LINE}" stroke-width="${lw(.8)}"/>`;
      }
      return s;
    }
    if (hat === 'bonnet') {
      const [b, sh] = cloth(L.F ? '#f2d4dc' : '#d4e2f2');
      return part(d`M-6 72Q-12 12 50 -6Q112 12 106 72Q100 60 96 40Q84 22 50 20Q16 22 4 40Q0 60 -6 72Z`, b, sh) + `<path d="${d`M4 40Q16 24 50 22Q84 24 96 40`}" fill="none" stroke="#fff" stroke-width="${lw(2.4)}" stroke-dasharray="${lw(3)} ${lw(2.4)}"/>`;
    }
    if (hat === 'hood' || hat === 'cowl' || hat === 'veil') {
      const c0 = hat === 'veil' ? (L.cult.dye && hf(p, 'veilc') < .5 ? tune(L.cult.dye, 1.2, .1, .1, .6, .3, .7) : '#efe8dc') : hat === 'cowl' ? L.cloth : ['#7a4a2e', '#4a6a3e', '#8a3a3a', '#4a4a6a', '#6b5a3e'][hash(p.id + 'hood') % 5];
      const [b, sh] = cloth(tune(c0, 1.1, 0, 0, .6, .15, .9));
      const outer = [[-22, 150], [-20, 50], [-8, 0], [50, -18], [108, 0], [120, 50], [122, 150]];
      const inner = [[104, 112], [103, 46], [86, 16], [50, 8], [14, 16], [-3, 46], [-4, 112]];
      s += part(curve([...outer, ...inner], true), b, sh, 1.2);
      // the hood's occlusion shadow on the hair and brow
      s += `<path d="${d`M-3 46Q14 16 50 8Q86 16 103 46Q86 26 50 20Q14 26 -3 46Z`}" fill="${SHADE}" fill-opacity=".35"/>`;
      if (lod >= 2) s += `<path d="${d`M-14 60Q-16 100 -12 140M114 60Q116 100 112 140`}" fill="none" stroke="${shadeOf(b, .6)}" stroke-width="${lw(.9)}"/>`;
      return s;
    }
    if (hat === 'kerchief') {
      const [b, sh] = cloth(L.cult.dye ? tune(L.cult.dye, 1.3, .08, .2, .7, .3, .65) : ['#c23c3c', '#3d6aa8', '#c08a2a', '#4d8a5a'][hash(p.id + 'kc') % 4]);
      s += part(d`M-4 52Q-8 4 50 -6Q108 4 104 52Q92 26 50 22Q8 26 -4 52Z`, b, sh);
      s += part(d`M98 34L118 48L108 66L94 44Z`, b, sh, .9);
      if (lod >= 2) for (let i = 0; i < 6; i++) s += `<circle cx="${R(14 + i * 14)}" cy="${R(10 - Math.sin(i / 5 * Math.PI) * 10 + 8)}" r="1.6" fill="#fff" fill-opacity=".8"/>`;
      return s;
    }
    if (hat === 'turban' || hat === 'wrap' || hat === 'helm:turban') {
      const [b, sh] = cloth(hat === 'wrap' && L.cult.dye ? tune(L.cult.dye, 1.2, .08, .2, .6, .3, .7) : hat === 'helm:turban' ? '#e8e0d0' : L.noble ? '#f2ead8' : '#e6dcc8');
      s += part(d`M-6 42Q-14 -6 20 -22Q50 -32 80 -22Q114 -6 106 42Q90 20 50 18Q10 20 -6 42Z`, b, sh, 1.2);
      if (lod >= 2) s += `<path d="${d`M-4 30Q40 2 104 22M-2 14Q50 -18 96 -4M8 -6Q50 -26 90 -14`}" fill="none" stroke="${shadeOf(b, .6)}" stroke-width="${lw(.9)}"/>`;
      if (L.noble || hat === 'helm:turban') s += `<circle cx="50" cy="12" r="4" fill="#d8354a" stroke="${LINE}" stroke-width="${lw(.8)}"/>`;
      if (hat === 'wrap') s += part(limb([[100, 30], [112, 70], [108, 120]], [6, 7, 5]), b, sh, .9);
      return s;
    }
    if (hat === 'cap') {
      const [b, sh] = cloth(hf(p, 'capc') < .5 ? L.cloth : '#3d4a6a');
      s += part(d`M-4 34Q-2 -8 50 -14Q102 -8 104 34Q76 24 50 24Q24 24 -4 34Z`, b, sh);
      s += `<path d="${d`M-6 34Q50 18 106 34`}" fill="none" stroke="${LINE}" stroke-width="${lw(3.4)}"/><path d="${d`M-6 34Q50 18 106 34`}" fill="none" stroke="${L.trim}" stroke-width="${lw(2)}"/>`;
      return s;
    }
    if (hat === 'furhat' || hat === 'cone') {
      const [b, sh] = cloth(hat === 'cone' ? tune(L.cult.dye || '#9a2a24', 1.3, .08, .2, .7, .3, .6) : L.cloth);
      if (hat === 'cone') s += part(d`M2 22L50 -46L98 22Z`, b, sh);
      else s += part(d`M2 22Q-2 -26 50 -30Q102 -26 98 22Z`, b, sh);
      const [fb, fs] = cloth('#9a7650');
      s += part(d`M-8 36Q-12 12 50 8Q112 12 108 36Q110 46 96 42Q50 34 4 42Q-10 46 -8 36Z`, fb, fs);
      if (lod >= 2) s += `<path d="${d`M4 30q4 -4 8 0q4 -4 8 0q4 -4 8 0M72 30q4 -4 8 0q4 -4 8 0q4 -4 8 0`}" fill="none" stroke="${fs}" stroke-width="${lw(.8)}"/>`;
      return s;
    }
    if (hat === 'fillet' || hat === 'leaves' || hat === 'feathers') {
      const c = d`M0 36Q50 14 100 36`;
      const col = hat === 'leaves' ? '#5a9a4a' : L.noble ? gold : L.rib;
      s += `<path d="${c}" fill="none" stroke="${LINE}" stroke-width="${lw(4.6)}"/><path d="${c}" fill="none" stroke="${col}" stroke-width="${lw(3)}"/>`;
      if (hat === 'leaves') for (let i = 0; i < 7; i++) { const q = i / 6, x = lerp(4, 96, q), y = 36 - Math.sin(q * Math.PI) * 11; s += `<path d="${lens(x - 3, y + 2, x + 4, y - 6, 3.4)}" fill="#6aaa52" stroke="${LINE}" stroke-width="${lw(.7)}"/>`; }
      if (hat === 'feathers') for (const [x, c2] of [[22, '#f2ead6'], [30, L.rib], [76, '#f2ead6']]) s += `<path d="${d`M${x} 30Q${x - 8} 6 ${x - 2} -20Q${x + 6} 6 ${x} 30Z`}" fill="${c2}" stroke="${LINE}" stroke-width="${lw(.8)}"/>`;
      return s;
    }
    if (hat.startsWith('helm:')) {
      const look = hat.slice(5);
      if (look === 'coif') {
        const outer = [[-20, 150], [-18, 50], [-8, 0], [50, -14], [108, 0], [118, 50], [120, 150]];
        const inner = [[103, 110], [103, 46], [86, 18], [50, 10], [14, 18], [-3, 46], [-3, 110]];
        const id = G.ref('apw', curve([...outer, ...inner], true));
        s += `<use href="#${id}" fill="${lod >= 2 ? 'url(#' + useDef(G, 'apml') + ')' : steel}" stroke="${LINE}" stroke-width="${lw(1.2)}"/><use href="#${id}" fill="${SHADE}" fill-opacity=".4" clip-path="url(#${useDef(G, 'apsH')})"/>`;
        s += `<path d="${d`M-3 46Q14 16 50 8Q86 16 103 46Q86 26 50 20Q14 26 -3 46Z`}" fill="${SHADE}" fill-opacity=".35"/>`;
        return s;
      }
      const dome = look === 'kettle' || look === 'elfhelm' ? d`M-6 40Q-8 -14 50 -26Q108 -14 106 40Z` : d`M-4 42Q-6 -12 50 -24Q106 -12 104 42Z`;
      const [b, sh] = look === 'horned' ? ['#7a6a5a', '#4a3e34'] : look === 'elfhelm' ? ['#a8c8b0', '#5f8a70'] : [steel, steelS];
      if (look === 'elfhelm') s += part(d`M-6 42Q-10 0 30 -18Q50 -50 70 -18Q110 0 106 42Q50 30 -6 42Z`, b, sh, 1.2);
      else s += part(dome, b, sh, 1.2);
      if (look === 'kettle') s += part(d`M-24 40Q50 22 124 40Q50 50 -24 40Z`, b, sh);
      if (look === 'helm' || look === 'nasal' || look === 'spangen') s += part(d`M46.5 38L53.5 38L53 76L47 76Z`, b, sh, .9);
      if (look === 'spangen') s += `<path d="${d`M50 -24V40M18 -12L10 40M82 -12L90 40`}" fill="none" stroke="${goldS}" stroke-width="${lw(2.4)}"/>`;
      if (look === 'horned') for (const sd of [-1, 1]) s += part(d`M${50 + sd * 40} 0Q${50 + sd * 76} -4 ${50 + sd * 70} -42Q${50 + sd * 60} -12 ${50 + sd * 34} -12Z`, '#f2ead6', '#c8bc9c', .9);
      s += `<path d="${d`M-4 40Q50 30 104 40`}" fill="none" stroke="${LINE}" stroke-width="${lw(3.6)}"/><path d="${d`M-4 40Q50 30 104 40`}" fill="none" stroke="${b}" stroke-width="${lw(2)}"/>`;
      if (lod >= 2) s += `<path d="${d`M14 4Q24 -12 42 -16`}" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="${lw(2.6)}"/>`;
      return s;
    }
    return s;
  }

  // ======================================================================================================================
  // ---- shared body parts: a cel-shaded limb (its far side in shadow), a hand, a boot
  const AWAY = [.7071, .7071];                        // away from the light (the light is upper left)
  function celLimb(G, pts, ws, fill, lw, o = {}) {
    const D = limb(pts, ws, o.tip);
    let s = `<path d="${D}" fill="${fill}" stroke="${LINE}" stroke-width="${lw(o.w || 1.1)}"/>`;
    if (G.lod >= 1 && o.shade !== false) {
      const sp = [], sw = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
        let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const m = Math.hypot(nx, ny) || 1; nx /= m; ny /= m;
        if (nx * AWAY[0] + ny * AWAY[1] < 0) { nx = -nx; ny = -ny; }
        sp.push([pts[i][0] + nx * ws[i] * .58, pts[i][1] + ny * ws[i] * .58]); sw.push(ws[i] * .4);
      }
      s += `<path d="${limb(sp, sw, o.tip)}" fill="${o.sh || shadeOf(fill, .35, 1.1)}"/>`;
    }
    return s;
  }
  function handAt(G, L, W, E, r, lw, o = {}) {
    const dx = W[0] - E[0], dy = W[1] - E[1], m = Math.hypot(dx, dy) || 1, ux = dx / m, uy = dy / m;
    if (o.lost) {
      // a lost hand: the wrist wrapped, the stump bound
      return `<path d="${limb([[W[0] - ux * r * .4, W[1] - uy * r * .4], [W[0] + ux * r * .7, W[1] + uy * r * .7]], [r * .62, r * .55])}" fill="#e8dcc8" stroke="${LINE}" stroke-width="${lw(1)}"/><path d="${d`M${W[0] - uy * r * .6} ${W[1] + ux * r * .6}L${W[0] + uy * r * .6 + ux * r * .3} ${W[1] - ux * r * .6 + uy * r * .3}`}" stroke="#b8a888" stroke-width="${lw(.8)}"/>`;
    }
    const c = o.gaunt ? '#c4cad8' : L.skin.b;
    const cx = W[0] + ux * r * .55, cy = W[1] + uy * r * .55;
    const ang = Math.atan2(uy, ux) * 180 / Math.PI;
    let s = `<ellipse cx="${R(cx)}" cy="${R(cy)}" rx="${R(r * .95)}" ry="${R(r * .7)}" transform="rotate(${R(ang)} ${R(cx)} ${R(cy)})" fill="${c}" stroke="${o.gaunt ? LINE : L.skin.line}" stroke-width="${lw(1)}"/>`;
    if (G.lod >= 2 && !o.fist) s += `<path d="${d`M${cx - uy * r * .55} ${cy + ux * r * .55}l${ux * r * .6} ${uy * r * .6}`}" stroke="${o.gaunt ? LINE : L.skin.line}" stroke-width="${lw(.7)}"/>`;
    return s;
  }

  // ---- the bust (200 x 200): head and shoulders
  function bust(G, L) {
    const p = L.p, race = L.race, F = L.F, lod = G.lod;
    // the head's scale and place: big heads on children, a small head on a giant's great shoulders
    const sc = L.baby ? 1.02 : L.small ? .96 - .06 * (L.h - 2.5) / 8.5 : race === 'giant' ? .64 : race === 'dwarf' ? .84 : race === 'orc' ? .8 : .85;
    const tx = 100 - 50 * sc, ty = L.baby ? 46 : L.small ? 40 : race === 'giant' ? 34 : race === 'dwarf' ? 38 : 28;
    G.lwH = G.lwF / sc;
    const k = { lw: G.lwH, longTo: (205 - ty) / sc, neckTo: (206 - ty) / sc };
    const hd = head(G, L, k);
    const T = TF(tx, ty, sc);
    const chin = ty + sc * 118, nb = chin + (L.small ? 8 : race === 'giant' ? 6 : 11);
    const raceW = { dwarf: 1.25, orc: 1.2, giant: 1.62, elf: .9, halforc: 1.1, halfelf: .95 }[race] || 1;
    const sw = Math.min(106, 100 * sc * (F ? .86 : 1.02) * L.build * raceW * (L.baby ? .9 : L.small ? .8 + .2 * (L.h - 2.5) / 8.5 : 1));
    const nwF = sc * (F ? 30 : 38) * ({ orc: 1.5, halforc: 1.25, dwarf: 1.45, giant: 1.55, elf: .9 }[race] || 1);
    const lw = w => RW(w * G.lwF);
    let body = '';
    if (L.baby) {
      // a swaddled bundle in soft cloth, bound with a ribbon
      const b = L.F ? '#f2dce2' : '#dce6f2', sh = shadeOf(b, .35, 1.2);
      const D = d`M${100 - sw} 206Q${100 - sw} ${nb + 4} ${100 - sw * .45} ${nb - 6}Q100 ${nb - 12} ${100 + sw * .45} ${nb - 6}Q${100 + sw} ${nb + 4} ${100 + sw} 206Z`;
      body += `<path d="${D}" fill="${b}" stroke="${LINE}" stroke-width="${lw(1.1)}"/><path d="${D}" fill="${sh}" clip-path="url(#${useDef(G, 'apsB')})"/>`;
      if (lod >= 2) body += `<path d="${d`M${100 - sw * .9} ${nb + 30}Q100 ${nb + 10} ${100 + sw * .9} ${nb + 30}`}" fill="none" stroke="${L.rib}" stroke-width="${lw(3)}"/>`;
    } else body += torsoBust(G, L, { sw, nb, nwF, lw });
    const Tt = TT(tx, ty, sc, tiltOf(L));
    return { back: `<g transform="${Tt}">${hd.back}</g>`, fig: `<g transform="${T}">${hd.neck}</g>` + body + `<g transform="${Tt}">${hd.front}</g>`, head: { tx, ty, sc } };
  }

  // ---------- the bust's clothes: the cut of the people, rank and armour
  function torsoBust(G, L, o) {
    const { sw, nb, nwF, lw } = o, lod = G.lod, cut = L.cult.cut || 'tunic', kind = L.kind;
    let s = '';
    const shL = [[100 - nwF * .52, nb - 8], [100 - sw * .52, nb + 1], [100 - sw * .84, nb + 10], [100 - sw * .99, nb + 30], [100 - sw * 1.04, 210, 1]];
    const shoulders = curve([...shL, ...mirror(shL, 100).reverse(), [100, nb + 2]], true);
    const sid = G.ref('apt', shoulders);
    // the far arm is in shadow: from the shoulder's top down the inside of the arm
    const armR = d`M${100 + sw * .62} ${nb + 4}Q${100 + sw * 1.02} ${nb + 10} ${100 + sw * 1.02} ${nb + 36}L${100 + sw * 1.06} 210L${100 + sw * .74} 210Q${100 + sw * .7} ${nb + 60} ${100 + sw * .74} ${nb + 38}Q${100 + sw * .8} ${nb + 20} ${100 + sw * .62} ${nb + 4}Z`;
    const armFold = d`M${100 - sw * .74} ${nb + 38}Q${100 - sw * .7} ${nb + 60} ${100 - sw * .74} 206M${100 + sw * .74} ${nb + 38}Q${100 + sw * .7} ${nb + 60} ${100 + sw * .74} 206`;
    const sh = c => shadeOf(c, .35, 1.1);
    const part = (D, c, w = 1.1) => `<path d="${D}" fill="${c}" stroke="${LINE}" stroke-width="${lw(w)}"/>` + (lod >= 1 ? `<path d="${D}" fill="${sh(c)}" clip-path="url(#${useDef(G, 'apsB')})"/>` : '');
    const body = (fill, pat) => `<use href="#${sid}" fill="${fill}"/>` + (pat && lod >= 2 ? `<use href="#${sid}" fill="url(#${useDef(G, pat)})"/>` : '') + (lod >= 1 ? `<path d="${armR}" fill="${pat ? SHADE : sh(fill)}"${pat ? ' fill-opacity=".4"' : ''}/>` : '') + (lod >= 2 && !G.lite && G.size >= 100 ? `<path d="${armFold}" fill="none" stroke="${pat ? LINE : shadeOf(fill, .75)}" stroke-width="${lw(.9)}"/>` : '') + `<use href="#${sid}" fill="none" stroke="${LINE}" stroke-width="${lw(1.2)}"/>`;
    let cloth = L.cloth;
    if (L.armor === 'robes') cloth = tune(hexOk(L.out.main) || '#6b5a3e', 1.2, .05, .1, .6, .25, .7);
    const neckSkin = D => `<path d="${D}" fill="${L.skin.b}" stroke="${L.skin.line}" stroke-width="${lw(.9)}"/>`;
    const band = (D, c, w) => `<path d="${D}" fill="none" stroke="${LINE}" stroke-width="${lw(w + 1.8)}"/><path d="${D}" fill="none" stroke="${c}" stroke-width="${lw(w)}"/>`;
    const plain = L.armor === 'none' || L.armor === 'robes' || L.armor === 'padded';
    const mantle = !L.small && (L.cloak && L.cloak.look !== 'tabard' || L.out.fur || kind === 'royal' || L.rank >= 6 || L.ruler) || L.cult.collar === 'fur' || L.cult.fur;
    if (plain) {
      s += body(cloth, L.armor === 'padded' ? 'apqt' : null);
      if (cut === 'robe' || cut === 'kaftan') {
        s += neckSkin(d`M${100 - nwF * .5} ${nb - 7}L100 ${nb + 20}L${100 + nwF * .5} ${nb - 7}Z`);
        s += band(d`M${100 - nwF * .66} ${nb - 7}L${100 + sw * .3} 212`, cut === 'kaftan' ? L.trim : mix(cloth, '#ffffff', .3), cut === 'kaftan' ? 5.4 : 3.6);
        s += `<path d="${d`M${100 + nwF * .66} ${nb - 7}L${100 + nwF * .12} ${nb + 16}`}" stroke="${LINE}" stroke-width="${lw(1)}"/>`;
      } else if (cut === 'drape') {
        s += neckSkin(d`M${100 - nwF * .56} ${nb - 7}Q100 ${nb + 12} ${100 + nwF * .56} ${nb - 7}Z`);
        const dc = tune(mix(cloth, L.trim, .45), 1.2, .05, .1, .7, .25, .75);
        s += part(d`M${100 - sw * .99} ${nb + 26}Q${100 - sw * .7} ${nb} ${100 - nwF * .46} ${nb - 6}L${100 + sw * .62} 212L${100 - sw * .22} 212Z`, dc, 1);
        if (L.cult.pat === 'stripe' && lod >= 2) s += `<path d="${d`M${100 - sw * .7} ${nb + 10}L${100 + sw * .3} 210M${100 - sw * .82} ${nb + 22}L${100 + sw * .05} 210`}" stroke="${L.rib}" stroke-width="${lw(2.2)}"/>`;
        if (L.cult.pat === 'zig' && lod >= 2) s += `<path d="${d`M${100 - sw * .75} ${nb + 18}l8 6l8 -6l8 6l8 -6l8 6`}" fill="none" stroke="#f2ead6" stroke-width="${lw(1.6)}"/>`;
      } else {
        // a tunic over a pale undershirt, laced at the throat for commoners
        const deep = L.F ? 15 : 12;
        s += neckSkin(d`M${100 - nwF * .56} ${nb - 7}Q100 ${nb + deep} ${100 + nwF * .56} ${nb - 7}Z`);
        if (!L.noble && kind !== 'priest' && lod >= 2 && !L.small) s += `<path d="${d`M${100 - nwF * .3} ${nb + deep * .2}L${100 + nwF * .3} ${nb + deep * .5}M${100 + nwF * .3} ${nb + deep * .2}L${100 - nwF * .3} ${nb + deep * .5}`}" stroke="${shadeOf(cloth, .7)}" stroke-width="${lw(.9)}"/>`;
        if (!mantle) s += band(d`M${100 - nwF * .64} ${nb - 7.5}Q100 ${nb + deep + 1.5} ${100 + nwF * .64} ${nb - 7.5}`, L.trim, 3);   // a mantle covers it
        // an embroidered yoke for the peoples who band their tunics
        if (L.cult.band && lod >= 2) s += `<path d="${d`M${100 - nwF * .66} ${nb - 7}Q100 ${nb + 14} ${100 + nwF * .66} ${nb - 7}L${100 + nwF * 1.1} ${nb - 2}Q100 ${nb + 26} ${100 - nwF * 1.1} ${nb - 2}Z`}" fill="${L.rib}" stroke="${LINE}" stroke-width="${lw(.9)}"/>`;
      }
      if (lod >= 2 && L.cult.pat === 'stripe' && cut !== 'drape') s += `<path d="${d`M${100 - sw * .4} ${nb + 30}V206M${100 + sw * .4} ${nb + 30}V206`}" stroke="${L.rib}" stroke-width="${lw(2)}"/>`;
    } else {
      // armour over the shoulders
      const look = L.armor;
      const fillA = look === 'leather' ? '#8a5a34' : look === 'hide' || look === 'orcmail' ? '#7a6448' : look === 'brigandine' ? tune(L.arms.f, 1.2, .05, .1, .6, .2, .6) : look === 'elfmail' ? '#a8c8b0' : look === 'lamellar' ? '#b08a50' : '#aab0c4';
      const pat = L.mail && look !== 'orcmail' ? 'apml' : look === 'scale' || look === 'elfmail' || look === 'lamellar' ? 'apsc' : null;
      s += body(fillA, pat);
      s += neckSkin(d`M${100 - nwF * .52} ${nb - 7}Q100 ${nb + 7} ${100 + nwF * .52} ${nb - 7}Z`);
      if (look === 'leather' && lod >= 2) s += `<path d="${d`M${100 - sw * .5} ${nb + 14}Q100 ${nb + 24} ${100 + sw * .5} ${nb + 14}M100 ${nb + 22}V206`}" fill="none" stroke="#e8c890" stroke-width="${lw(.9)}" stroke-dasharray="${lw(2.4)} ${lw(1.8)}"/>`;
      if (L.plate) {
        for (const sd of [-1, 1]) { const D = d`M${100 + sd * sw * .5} ${nb + 4}Q${100 + sd * sw * 1.12} ${nb - 2} ${100 + sd * sw * 1.1} ${nb + 38}Q${100 + sd * sw * .8} ${nb + 30} ${100 + sd * sw * .5} ${nb + 26}Z`; s += part(D, '#c4cad8', 1.1); if (lod >= 2 && G.lite < 2) s += `<path d="${d`M${100 + sd * sw * .62} ${nb + 8}Q${100 + sd * sw * .9} ${nb + 3} ${100 + sd * sw * .98} ${nb + 16}`}" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="${lw(1.8)}"/>`; }
        s += part(d`M${100 - sw * .46} ${nb + 18}Q100 ${nb + 8} ${100 + sw * .46} ${nb + 18}L${100 + sw * .5} 212L${100 - sw * .5} 212Z`, '#c4cad8', 1.1);
        if (lod >= 2) s += `<path d="${d`M${100 - sw * .28} ${nb + 24}Q${100 - sw * .32} ${nb + 50} ${100 - sw * .24} 204`}" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="${lw(2.6)}"/>`;
      }
      // the tabard of a house, a lord or an officer, with the charge
      if ((L.cloak && L.cloak.look === 'tabard') || ((L.mail || ['scale', 'brigandine'].includes(look)) && (L.arms.h || L.noble || L.rank >= 4))) {
        s += part(d`M${100 - sw * .44} ${nb + 18}L${100 + sw * .44} ${nb + 18}L${100 + sw * .5} 212L${100 - sw * .5} 212Z`, tune(L.arms.f, 1.2, .04, .1, .65, .2, .65), 1.1);
        s += charge(L, 100, nb + 48, sw / 34);
      }
    }
    // rank: a mantle of fur or ermine, a gold collar, a priest's stole, an officer's baldric
    const cloakOn = !L.small && (L.cloak && L.cloak.look !== 'tabard' || L.out.fur || kind === 'royal' || L.rank >= 6 || L.ruler);
    if (cloakOn || L.cult.collar === 'fur' || L.cult.fur) {
      const erm = kind === 'royal' || L.ruler;
      const D = d`M${100 - sw * 1.02} ${nb + 30}Q${100 - sw * .95} ${nb + 4} ${100 - nwF * .7} ${nb - 4}Q100 ${nb + 18} ${100 + nwF * .7} ${nb - 4}Q${100 + sw * .95} ${nb + 4} ${100 + sw * 1.02} ${nb + 30}Q${100 + sw * .5} ${nb + 40} 100 ${nb + 30}Q${100 - sw * .5} ${nb + 40} ${100 - sw * 1.02} ${nb + 30}Z`;
      const mid = G.ref('apm', D);
      s += `<use href="#${mid}" fill="${erm ? (lod >= 2 ? 'url(#' + useDef(G, 'aper') + ')' : '#f4f0e8') : '#9a7650'}" stroke="${LINE}" stroke-width="${lw(1.1)}"/>` + (lod >= 1 ? `<use href="#${mid}" fill="${SHADE}" fill-opacity=".3" clip-path="url(#${useDef(G, 'apsB')})"/>` : '');
    }
    if (L.noble || kind === 'gentry') s += band(d`M${100 - nwF * .9} ${nb - 2}Q100 ${nb + 26} ${100 + nwF * .9} ${nb - 2}`, '#e8b04a', 2.4) + `<circle cx="100" cy="${R(nb + 13)}" r="${lw(4)}" fill="#d8354a"/>`;
    if (kind === 'priest') s += part(d`M${100 - nwF * .7} ${nb - 4}L${100 - nwF * .35} ${nb - 4}L${100 - nwF * .2} 212L${100 - nwF * .7} 212Z`, L.trim, .9) + part(d`M${100 + nwF * .35} ${nb - 4}L${100 + nwF * .7} ${nb - 4}L${100 + nwF * .7} 212L${100 + nwF * .2} 212Z`, L.trim, .9);
    if (L.out.apron && L.armor === 'none') s += part(d`M${100 - sw * .45} ${nb + 30}L${100 + sw * .45} ${nb + 30}L${100 + sw * .5} 212L${100 - sw * .5} 212Z`, '#b8a07a', .9);
    if (L.cult.collar === 'beads' && L.armor === 'none' && lod >= 1) {
      // a string of beads: the cord, then the beads of each colour as one path
      const r = +lw(2.2), bead = (x, y) => d`M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
      let red = '', blue = '';
      for (let i = 0; i <= 8; i++) { const q = i / 8, x = lerp(100 - nwF * .9, 100 + nwF * .9, q), y = nb - 3 + Math.sin(q * Math.PI) * 14; if (i % 2) red += bead(x, y); else blue += bead(x, y); }
      s += `<path d="${d`M${100 - nwF * .9} ${nb - 3}Q100 ${nb + 25} ${100 + nwF * .9} ${nb - 3}`}" fill="none" stroke="${LINE}" stroke-width="${lw(1.4)}"/><path d="${red}" fill="#d8354a"/><path d="${blue}" fill="#2f6ad0"/>`;
    }
    if (L.cult.collar === 'bones' && lod >= 1) for (let i = 1; i < 7; i++) { const q = i / 7, x = lerp(100 - nwF, 100 + nwF, q), y = nb - 2 + Math.sin(q * Math.PI) * 12; s += `<path d="${d`M${x - 2} ${y}l2 7l2 -7Z`}" fill="#f2ead6" stroke="${LINE}" stroke-width="${lw(.6)}"/>`; }
    if (L.cult.torc || L.ap.jewel === 'torc') s += band(d`M${100 - nwF * .6} ${nb - 5}Q100 ${nb + 6} ${100 + nwF * .6} ${nb - 5}`, '#e8b04a', 2.8);
    if (L.rank >= 6) s += band(d`M${100 - sw * .8} ${nb + 10}L${100 + sw * .5} 212`, '#c23c27', 5);
    if (kind === 'rags' && lod >= 2) s += `<path d="${d`M${100 - sw * .5} ${nb + 40}l5 5l4 -4l6 6M${100 + sw * .3} ${nb + 50}l4 5l5 -5`}" fill="none" stroke="${LINE}" stroke-width="${lw(.9)}"/><rect x="${R(100 + sw * .1)}" y="${R(nb + 30)}" width="14" height="11" fill="${mix(L.cloth, '#c0a070', .4)}" stroke="${LINE}" stroke-width="${lw(.8)}" stroke-dasharray="${lw(1.6)} ${lw(1.2)}"/>`;
    return s;
  }

  // the house's charge (the release's own device paths; only looked up, never printed from the state)
  const PATH_OK = /^[MLHVCSQTAZmlhvcsqtaz0-9 .,\-]+$/;
  function charge(L, x, y, scale, op) {
    const ch = L.arms.ch, dP = ch && ch !== 'none' && PORTRAIT.charges ? PORTRAIT.charges[ch] : null;
    if (!dP || typeof dP !== 'string' || !PATH_OK.test(dP)) return '';
    const lineOnly = ['bow', 'wheat'].includes(ch);
    return `<path d="${dP.replace(/ ?([A-Za-z]) ?/g, '$1')}" transform="${TF(x, y, scale)}"${lineOnly ? ` fill="none" stroke="${L.arms.c}" stroke-width="${R(2 / scale)}"` : ` fill="${L.arms.c}" fill-rule="evenodd"`}${op ? ` fill-opacity="${op}" stroke-opacity="${op}"` : ''}/>`;
  }

  // ======================================================================================================================
  // ---- the full figure (200 x 300): standing on the ground in one of five poses; a swaddled newborn
  const GROUND = 286;
  function fullFig(G, L) {
    const p = L.p, race = L.race, F = L.F, lod = G.lod, kind = L.kind;
    if (L.baby) return swaddled(G, L);
    const x = clamp(L.h / 20, 0, 1), grow = .34 + .66 * (1 - (1 - x) * (1 - x));
    const raceH = { elf: 1.04, halfelf: 1.02, dwarf: .78, orc: 1.05, halforc: 1.02, giant: 1.1 }[race] || 1;
    const stoop = L.oldF > 1 ? 7 : L.oldF > .8 ? 3 : 0;
    // a person's own height moves the figure a little; a height far off the people's mean (a bad record) is ignored
    const meanH = (F ? L.R2.height[0] : L.R2.height[1]) || 170, relH = ((L.ap.height || meanH) - meanH) / meanH;
    const hAdj = Math.abs(relH) > .25 ? 0 : clamp(relH, -.05, .05);
    const Hf = Math.min(272, 244 * raceH * grow * (1 + hAdj)) - stoop;
    const Nr = { giant: 8, dwarf: 4.7, elf: 7, orc: 6.8, halforc: 6.7, halfelf: 6.8 }[race] || kf(L.h, 'heads');
    const N = L.mat < 1 ? lerp(kf(L.h, 'heads'), Nr, L.mat) : Nr;
    const hh = Hf / N, sc = hh / 118, y0 = GROUND - Hf;
    const tx = 100 - 50 * sc, ty = y0;
    const chin = ty + 118 * sc, B = GROUND - chin;
    const kid = 1 - L.mat;
    const fr = (a, c) => chin + B * lerp(a, c, kid);
    const nb = fr(.035, .04), sh = fr(.07, .08), chest = fr(.19, .2), waist = fr(.33, .34), hip = fr(.42, .44);
    const crotch = fr(race === 'dwarf' ? .5 : .47, .5), knee = fr(race === 'dwarf' ? .73 : .71, .73), ankle = fr(.955, .95);
    const raceW = { dwarf: 1.32, orc: 1.22, giant: 1.32, elf: .9, halforc: 1.12, halfelf: .95 }[race] || 1;
    const bk = L.build, sw = hh * (F ? .78 : .95) * bk * raceW * (L.small ? .82 + .18 * L.mat : 1) * (L.teen && !F ? .92 : 1);
    const ww = hh * (F ? .4 : .5) * bk * (race === 'dwarf' || race === 'giant' ? 1.25 : 1), hw = hh * (F ? .6 : .55) * bk * (race === 'dwarf' || race === 'giant' ? 1.2 : 1);
    const nwF = sc * (F ? 30 : 38) * ({ orc: 1.5, halforc: 1.25, dwarf: 1.45, giant: 1.55, elf: .9 }[race] || 1);
    const lw = w => RW(w * G.lwF);
    G.lwH = G.lwF / sc * .9;
    // the face's detail follows its size on the screen
    const facePx = 100 * sc * G.size / 200;
    const faceLod = facePx >= 34 ? 3 : facePx >= 22 ? 2 : 1;
    // ---- the pose, from the id and the role
    const Wk = L.W.kind || 'fists', blade = ['sword', 'axe', 'mace', 'hammer', 'club', 'flail'].includes(Wk), pole = ['spear', 'pike', 'lance', 'polearm', 'staff'].includes(Wk);
    const h1 = hf(p, 'pose'), tr = new Set(p.traits || []);
    let pose;
    if (L.small) pose = h1 < .55 ? 'stand' : 'hip';
    else if (L.ruler) pose = Wk === 'sword' && h1 < .4 ? 'hilt' : 'staff';
    else if (pole) pose = 'staff';
    else if (L.shield) pose = 'stand';
    else if (Wk === 'sword' && h1 < .55) pose = 'hilt';
    else if (L.oldF > .7 && h1 < .55) pose = 'staff';
    else if (kind === 'priest' && h1 < .5) pose = 'staff';
    else { const h2 = hf(p, 'pose2'), cross = (L.armor !== 'none' || tr.has('stern') || tr.has('proud') || tr.has('stubborn') ? .45 : .2); pose = h2 < cross ? 'crossed' : h2 < cross + (F ? .4 : .3) ? 'hip' : 'stand'; }
    const side = hf(p, 'side') < .5 ? -1 : 1;                 // which hand holds or rests
    // ---- what the figure wears
    const longG = L.armor === 'robes' || kind === 'priest' || (F && !['soldier', 'officer'].includes(kind) && L.armor === 'none') || (L.cult.cut === 'robe' && L.armor === 'none' && !L.small) || (L.ruler && hf(p, 'gown') < .5 && L.armor === 'none');
    const coat = !longG && L.cult.cut === 'kaftan' && L.armor === 'none';
    const hemY = longG ? GROUND - hh * .08 : coat ? knee + B * .02 : L.mail ? knee - B * .02 : crotch + B * .07;
    const hemW = longG ? hw * 1.38 : coat ? hw * 1.2 : hw * 1.1;
    let cloth = L.cloth;
    if (L.armor === 'robes') cloth = tune(hexOk(L.out.main) || '#6b5a3e', 1.2, .05, .1, .6, .25, .7);
    const armorC = { leather: '#8a5a34', hide: '#7a6448', orcmail: '#6a5a48', brigandine: tune(L.arms.f, 1.2, .05, .1, .6, .2, .6), elfmail: '#a8c8b0', lamellar: '#b08a50', padded: '#cdbd98' }[L.armor] || '#aab0c4';
    const plain = L.armor === 'none' || L.armor === 'robes';
    const trou = L.noble ? tune(mix(L.arms.f, LINE, .25), 1.1, 0, .1, .5, .15, .45) : L.cloth2;
    const bootC = L.noble ? '#4a3a52' : '#6a4a32';
    const steel = '#c4cad8';
    let scen = '', back = '', legs = '', torso = '', arms = '', fore = '';
    scen += `<ellipse cx="100" cy="${R(GROUND + 1)}" rx="${R(Math.max(sw, hemW) * 2.1)}" ry="${R(hh * .34)}" fill="${G.rim}" fill-opacity=".13"/><ellipse cx="100" cy="${R(GROUND + 2)}" rx="${R(Math.max(sw, hemW) * 1.3)}" ry="${R(hh * .16)}" fill="${LINE}" fill-opacity=".3"/>`;
    // ---- behind: the cloak, a bow on the back
    const cloakOn = !L.small && (L.cloak && L.cloak.look !== 'tabard' || L.out.fur || kind === 'royal' || L.rank >= 6 || L.ruler);
    if (cloakOn) {
      const cc = L.cloak && L.cloak.look === 'furcloak' ? '#7a5a3a' : L.noble || L.cloak && L.cloak.look === 'finecloak' ? tune(L.arms.f, 1.2, .02, .15, .65, .2, .5) : tune(mix(L.cloth, LINE, .3), 1.1, 0, .1, .5, .15, .45);
      const cb = L.ruler || kind === 'royal' ? GROUND - hh * .02 : Math.min(GROUND - hh * .1, knee + B * .14);
      const D = curve([[100 - sw * 1.02, sh], [100 - sw * 1.18, waist], [100 - Math.max(hemW, sw) * 1.24, cb - hh * .2], [100 - Math.max(hemW, sw) * 1.2, cb, 1], [100, cb + hh * .06], [100 + Math.max(hemW, sw) * 1.2, cb, 1], [100 + Math.max(hemW, sw) * 1.24, cb - hh * .2], [100 + sw * 1.18, waist], [100 + sw * 1.02, sh], [100, sh - hh * .1]], true);
      back += `<path d="${D}" fill="${shadeOf(cc, .25)}" stroke="${LINE}" stroke-width="${lw(1.1)}"/><path d="${D}" fill="${shadeOf(cc, .55, 1.1)}" clip-path="url(#${useDef(G, 'apsT')})"/>`;
    }
    if (L.ranged && ['bow'].includes(L.ranged.kind)) back += `<path d="${d`M${100 + sw * .75} ${sh - B * .16}Q${100 - sw * .4} ${waist - B * .1} ${100 - sw * 1.0} ${hip + B * .1}`}" fill="none" stroke="${LINE}" stroke-width="${lw(3.6)}"/><path d="${d`M${100 + sw * .75} ${sh - B * .16}Q${100 - sw * .4} ${waist - B * .1} ${100 - sw * 1.0} ${hip + B * .1}`}" fill="none" stroke="#8a5a34" stroke-width="${lw(2)}"/>`;
    // ---- the legs, the trousers and the boots
    const stance = pose === 'hip' ? hh * .04 : hh * .08;
    // thigh, knee, calf, ankle
    const legW = [hw * .5, hh * .12 * raceW, hh * .13 * raceW, hh * .075 * raceW];
    const legPts = sd => {
      const bent = pose === 'hip' && sd === side ? hh * .1 : 0;
      const kx = 100 + sd * (hw * .42 + stance * .4) - sd * bent, ax = 100 + sd * (hw * .44 + stance) + (L.limp && sd > 0 ? hh * .06 : 0);
      return [[100 + sd * hw * .46, hip], [kx, knee], [lerp(kx, ax, .35) + sd * hh * .015, lerp(knee, ankle, .35)], [ax, ankle]];
    };
    for (const sd of [-1, 1]) {
      const pts = legPts(sd);
      if (hemY < ankle - hh * .2) {
        const fill = L.plate ? steel : L.mail ? '#9aa0b4' : trou;
        legs += celLimb(G, pts, legW, fill, lw);
        if (L.plate && lod >= 2) legs += `<ellipse cx="${R(pts[1][0])}" cy="${R(pts[1][1])}" rx="${R(hh * .14)}" ry="${R(hh * .1)}" fill="${steel}" stroke="${LINE}" stroke-width="${lw(.9)}"/>`;
        // boots: to the knee for soldiers and lords, to the calf for the rest (bare feet for the poor and the small)
        if (!(kind === 'rags' || L.small && kind === 'peasant')) {
          const tall = L.noble || ['soldier', 'officer'].includes(kind) || L.plate, a = pts[3], k2 = pts[1], q = tall ? .12 : .5, bx = lerp(k2[0], a[0], q), by = lerp(k2[1], a[1], q);
          legs += celLimb(G, tall ? [[bx, by], pts[2], [a[0], a[1]]] : [[bx, by], [a[0], a[1]]], tall ? [hh * .135 * raceW, hh * .14 * raceW, hh * .1 * raceW] : [hh * .125 * raceW, hh * .1 * raceW], L.plate ? steel : bootC, lw);
          if (tall && lod >= 2) legs += `<path d="${d`M${bx - hh * .13} ${by}Q${bx} ${by + hh * .06} ${bx + hh * .13} ${by}`}" fill="none" stroke="${L.plate ? '#fff' : L.trim}" stroke-width="${lw(1.6)}"/>`;
        }
      }
      const a = pts[3], fx = a[0] + sd * hh * .08;
      const foot = d`M${a[0] - hh * .13} ${GROUND - hh * .14}Q${a[0] - hh * .16} ${GROUND + hh * .03} ${fx + sd * hh * .14} ${GROUND + hh * .02}Q${fx + sd * hh * .22} ${GROUND - hh * .05} ${a[0] + hh * .13} ${GROUND - hh * .16}Z`;
      legs += `<path d="${foot}" fill="${kind === 'rags' || L.small && kind === 'peasant' ? L.skin.b : L.plate ? steel : bootC}" stroke="${LINE}" stroke-width="${lw(1)}"/>`;
    }
    // ---- the garment (or armour) from the shoulders to the hem
    const gL = [[100 - nwF * .5, nb - hh * .02], [100 - sw * .66, sh - hh * .03], [100 - sw * 1.02, sh + hh * .13], [100 - sw * .88, chest], [100 - ww, waist], [100 - hw, hip], [100 - hemW, hemY, 1]];
    const hemPts = [];
    const sway = (hf(p, 'sway') - .5) * hh * .3;
    for (let i = 1; i < 6; i++) { const q = i / 6; hemPts.push([lerp(100 - hemW, 100 + hemW, q) + sway * Math.sin(q * Math.PI), hemY + hh * (longG ? .05 : .03) * Math.sin(q * Math.PI) + (i % 2 ? -hh * .03 : hh * .02)]); }
    const garment = curve([...gL, ...hemPts, ...mirror(gL, 100).reverse(), [100, nb + hh * .06]], true);
    const gid = G.ref('apt', garment);
    const gFill = plain ? cloth : armorC;
    const gPat = !plain && G.lod >= 2 ? (L.mail && L.armor !== 'orcmail' ? 'apml' : ['scale', 'elfmail', 'lamellar'].includes(L.armor) ? 'apsc' : L.armor === 'padded' ? 'apqt' : null) : null;
    torso += `<use href="#${gid}" fill="${gFill}" stroke="${LINE}" stroke-width="${lw(1.2)}"/>` + (gPat ? `<use href="#${gid}" fill="url(#${useDef(G, gPat)})"/>` : '') + (lod >= 1 ? `<use href="#${gid}" fill="${gPat ? SHADE : shadeOf(gFill, .35, 1.1)}"${gPat ? ' fill-opacity=".38"' : ''} clip-path="url(#${useDef(G, 'apsT')})"/>` : '');
    // folds of a long skirt
    if (lod >= 2 && (longG || coat)) { let f = ''; for (const k2 of [-.55, -.18, .2, .58]) f += d`M${100 + k2 * hw * .9} ${hip + B * .06}Q${100 + k2 * hemW * 1.02} ${(hip + hemY) / 2} ${100 + k2 * hemW * .95} ${hemY - hh * .05}`; torso += `<path d="${f}" fill="none" stroke="${shadeOf(gFill, .7)}" stroke-width="${lw(.9)}"/>`; }
    // the neckline, the coat's crossed front, the belt
    torso += `<path d="${d`M${100 - nwF * .52} ${nb - hh * .04}Q100 ${nb + hh * .24} ${100 + nwF * .52} ${nb - hh * .04}Z`}" fill="${L.skin.b}" stroke="${L.skin.line}" stroke-width="${lw(.8)}"/>`;
    const band = (D, c, w) => `<path d="${D}" fill="none" stroke="${LINE}" stroke-width="${lw(w + 1.6)}"/><path d="${D}" fill="none" stroke="${c}" stroke-width="${lw(w)}"/>`;
    if (plain) torso += band(d`M${100 - nwF * .58} ${nb - hh * .04}Q100 ${nb + hh * .27} ${100 + nwF * .58} ${nb - hh * .04}`, L.trim, 2.2);
    if (coat || L.cult.cut === 'robe' && plain && !L.noble) torso += band(d`M${100 - nwF * .5} ${nb}L${100 + ww * .6} ${coat ? hemY - hh * .04 : waist}`, coat ? L.trim : mix(cloth, '#fff', .3), coat ? 3.6 : 2.6);
    if (L.plate) {
      torso += `<path d="${d`M${100 - sw * .8} ${sh + hh * .05}Q100 ${sh - hh * .04} ${100 + sw * .8} ${sh + hh * .05}L${100 + ww * 1.04} ${waist}Q100 ${waist + hh * .2} ${100 - ww * 1.04} ${waist}Z`}" fill="${steel}" stroke="${LINE}" stroke-width="${lw(1.1)}"/>`;
      if (lod >= 1) torso += `<path d="${d`M${100 - sw * .45} ${sh + hh * .12}Q${100 - sw * .5} ${chest + hh * .2} ${100 - ww * .6} ${waist - hh * .06}`}" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="${lw(2.2)}"/>`;
    }
    if ((L.cloak && L.cloak.look === 'tabard') || ((L.mail || ['scale', 'brigandine'].includes(L.armor)) && (L.arms.h || L.noble || L.rank >= 4))) {
      const tb = d`M${100 - sw * .5} ${sh + hh * .04}L${100 + sw * .5} ${sh + hh * .04}L${100 + hw * .62} ${hemY - hh * .02}L${100 - hw * .62} ${hemY - hh * .02}Z`;
      const tc = tune(L.arms.f, 1.2, .04, .1, .65, .2, .65);
      torso += `<path d="${tb}" fill="${tc}" stroke="${LINE}" stroke-width="${lw(1.1)}"/>` + (lod >= 1 ? `<path d="${tb}" fill="${shadeOf(tc, .35, 1.1)}" clip-path="url(#${useDef(G, 'apsT')})"/>` : '');
      torso += charge(L, 100, chest + hh * .25, hh / 30);
    }
    if (!L.plate) {
      const by = waist + hh * .02;
      torso += `<path d="${d`M${100 - ww * 1.04} ${by - hh * .05}Q100 ${by + hh * .04} ${100 + ww * 1.04} ${by - hh * .05}L${100 + ww * 1.04} ${by + hh * .05}Q100 ${by + hh * .14} ${100 - ww * 1.04} ${by + hh * .05}Z`}" fill="${L.noble ? '#4a3a52' : '#5a3e2a'}" stroke="${LINE}" stroke-width="${lw(.9)}"/>`;
      torso += `<rect x="${R(100 - hh * .07)}" y="${R(by - hh * .03)}" width="${R(hh * .14)}" height="${R(hh * .12)}" rx="${R(hh * .02)}" fill="#e8b04a" stroke="${LINE}" stroke-width="${lw(.8)}"/>`;
    }
    // rank and people at the neck: fur or ermine, a gold collar, a priest's stole, beads, bones, a torc
    if (cloakOn || L.out.fur || L.cult.collar === 'fur' || L.cult.fur) {
      const erm = kind === 'royal' || L.ruler;
      const D = d`M${100 - sw * 1.06} ${sh + hh * .2}Q${100 - sw * .98} ${sh - hh * .06} ${100 - nwF * .7} ${nb - hh * .06}Q100 ${nb + hh * .2} ${100 + nwF * .7} ${nb - hh * .06}Q${100 + sw * .98} ${sh - hh * .06} ${100 + sw * 1.06} ${sh + hh * .2}Q${100 + sw * .5} ${sh + hh * .36} 100 ${sh + hh * .26}Q${100 - sw * .5} ${sh + hh * .36} ${100 - sw * 1.06} ${sh + hh * .2}Z`;
      torso += `<path d="${D}" fill="${erm ? (lod >= 2 ? 'url(#' + useDef(G, 'aper') + ')' : '#f4f0e8') : '#9a7650'}" stroke="${LINE}" stroke-width="${lw(1)}"/>`;
    }
    if (L.noble) torso += band(d`M${100 - nwF * .8} ${nb}Q100 ${nb + hh * .4} ${100 + nwF * .8} ${nb}`, '#e8b04a', 1.8);
    if (kind === 'priest') for (const sd of [-1, 1]) torso += `<path d="${d`M${100 + sd * nwF * .55} ${nb}L${100 + sd * nwF * .2} ${nb}L${100 + sd * hw * .3} ${hemY - hh * .04}L${100 + sd * hw * .62} ${hemY - hh * .04}Z`}" fill="${L.trim}" stroke="${LINE}" stroke-width="${lw(.9)}"/>`;
    if (L.out.apron && plain) torso += `<path d="${d`M${100 - ww * .9} ${waist + hh * .1}L${100 + ww * .9} ${waist + hh * .1}L${100 + hw * .9} ${hemY + hh * .02}L${100 - hw * .9} ${hemY + hh * .02}Z`}" fill="#b8a07a" stroke="${LINE}" stroke-width="${lw(.9)}"/>`;
    if (L.cult.collar === 'beads' && plain && lod >= 2) for (let i = 0; i <= 6; i++) { const q = i / 6; torso += `<circle cx="${R(lerp(100 - nwF * .8, 100 + nwF * .8, q))}" cy="${R(nb + Math.sin(q * Math.PI) * hh * .22)}" r="${lw(1.8)}" fill="${i % 2 ? '#d8354a' : '#2f6ad0'}"/>`; }
    if (L.cult.torc || L.ap.jewel === 'torc') torso += band(d`M${100 - nwF * .55} ${nb - hh * .02}Q100 ${nb + hh * .12} ${100 + nwF * .55} ${nb - hh * .02}`, '#e8b04a', 2);
    if (L.rank >= 6) torso += band(d`M${100 - sw * .85} ${sh + hh * .06}L${100 + ww} ${waist}`, '#c23c27', 3.2);
    // ---- arms, hands and what they hold
    const sleeve = plain ? cloth : L.plate ? steel : L.mail ? '#9aa0b4' : armorC;
    const S = sd => [100 + sd * sw * .9, sh + hh * .16];
    const ua = B * .235, fa = B * .21, aw = [hh * .16 * raceW * bk, hh * .13 * raceW * bk, hh * .105 * raceW];
    const hand = hh * .13 * raceW;
    const lostSide = L.lostHand ? 1 : 0;           // the figure's left hand (on the right of the picture)
    const armOf = (sd, kindA) => {
      const s0 = S(sd);
      let E, W;
      if (kindA === 'hip') { E = [100 + sd * sw * 1.36, waist - B * .05]; W = [100 + sd * ww * 1.05, waist + B * .015]; }
      else if (kindA === 'crossed') { E = [100 + sd * sw * 1.02, waist - B * .04]; W = [100 - sd * sw * .5, chest + B * .03]; }
      else if (kindA === 'hilt') { E = [100 + sd * sw * 1.02, waist - B * .015]; W = [100 + sd * hh * .05, crotch - B * .11]; }
      else if (kindA === 'hold') { E = [100 + sd * sw * 1.16, chest + B * .1]; W = [100 + sd * sw * 1.34, chest - B * .005]; }
      else { E = [s0[0] + sd * hh * .05, s0[1] + ua]; W = [E[0] + sd * hh * .01, E[1] + fa]; }
      return { s0, E, W };
    };
    // the upper arm goes behind the garment (its shoulder covers the arm's top); the forearm and hand in front
    let ups = '';
    const drawArm = (sd, a, o = {}) => {
      const short = plain && (kind === 'peasant' || kind === 'rags' || L.small) && !longG;
      const bell = plain && longG && !L.small;
      ups += celLimb(G, [a.s0, a.E], [aw[0], aw[1]], sleeve, lw);
      let s = celLimb(G, [a.E, a.W], [aw[1], bell ? aw[2] * 1.9 : aw[2]], short ? L.skin.b : sleeve, lw, short ? { sh: L.skin.s } : {});
      // a short sleeve ends in a cuff over the top of the bare forearm
      if (short) s += celLimb(G, [a.E, [lerp(a.E[0], a.W[0], .3), lerp(a.E[1], a.W[1], .3)]], [aw[1] * 1.14, aw[1] * 1.08], sleeve, lw);
      if (bell && lod >= 2) s += `<path d="${d`M${a.W[0] - aw[2] * 1.7} ${a.W[1] - hh * .05}L${a.W[0] + aw[2] * 1.7} ${a.W[1] - hh * .05}`}" stroke="${L.trim}" stroke-width="${lw(2.4)}"/>`;
      if (L.plate && lod >= 2) s += `<circle cx="${R(a.E[0])}" cy="${R(a.E[1])}" r="${R(aw[1] * .8)}" fill="${steel}" stroke="${LINE}" stroke-width="${lw(.9)}"/>`;
      if (!o.noHand) s += handAt(G, L, a.W, a.E, hand, lw, { lost: lostSide && sd === 1, gaunt: L.plate, fist: o.fist });
      return s;
    };
    const weaponHang = (W, E) => {
      // an axe, a mace, a hammer, a club or a flail hanging from the hand
      const len = hh * 1.6, bx = W[0], by = W[1] + hand * .4;
      let s = `<path d="${d`M${bx} ${by - hand * .6}L${bx + hh * .05} ${by + len}`}" stroke="${LINE}" stroke-width="${lw(3.6)}"/><path d="${d`M${bx} ${by - hand * .6}L${bx + hh * .05} ${by + len}`}" stroke="#8a5a34" stroke-width="${lw(2)}"/>`;
      const hx = bx + hh * .05, hy = by + len;
      if (Wk === 'axe') s += `<path d="${d`M${hx} ${hy - hh * .34}Q${hx - hh * .4} ${hy - hh * .3} ${hx - hh * .42} ${hy - hh * .02}Q${hx - hh * .2} ${hy - hh * .1} ${hx} ${hy - hh * .1}Z`}" fill="${steel}" stroke="${LINE}" stroke-width="${lw(1)}"/>`;
      else s += `<ellipse cx="${R(hx)}" cy="${R(hy - hh * .08)}" rx="${R(hh * .14)}" ry="${R(hh * .18)}" fill="${Wk === 'club' ? '#8a5a34' : steel}" stroke="${LINE}" stroke-width="${lw(1)}"/>`;
      return s;
    };
    if (pose === 'staff') {
      // a spear, a staff, a sceptre or a walking stick, held upright at the side
      const a = armOf(side, 'hold'), px = a.W[0] + side * hand * .2;
      const sceptre = L.ruler && !pole, walk = !pole && !sceptre;
      const topY = sceptre ? a.W[1] - hh * 1.1 : walk ? a.W[1] - hh * .5 : ['spear', 'pike', 'lance', 'polearm'].includes(Wk) ? y0 - hh * .5 : y0 + hh * .2;
      const botY = sceptre ? a.W[1] + hh * .7 : GROUND - 1;
      const pc = sceptre ? '#e8b04a' : '#8a5a34';
      fore += `<path d="${d`M${px} ${botY}L${px} ${topY}`}" stroke="${LINE}" stroke-width="${lw(4.2)}"/><path d="${d`M${px} ${botY}L${px} ${topY}`}" stroke="${pc}" stroke-width="${lw(2.4)}"/>`;
      if (sceptre) fore += `<circle cx="${R(px)}" cy="${R(topY - hh * .1)}" r="${R(hh * .13)}" fill="#e8b04a" stroke="${LINE}" stroke-width="${lw(1)}"/><circle cx="${R(px - hh * .04)}" cy="${R(topY - hh * .14)}" r="${R(hh * .04)}" fill="#fff"/>`;
      else if (['spear', 'pike', 'lance'].includes(Wk)) fore += `<path d="${d`M${px} ${topY - hh * .55}L${px + hh * .1} ${topY - hh * .05}L${px} ${topY + hh * .04}L${px - hh * .1} ${topY - hh * .05}Z`}" fill="${steel}" stroke="${LINE}" stroke-width="${lw(1)}"/>`;
      else if (Wk === 'polearm') fore += `<path d="${d`M${px} ${topY - hh * .5}L${px + hh * .08} ${topY - hh * .1}L${px + hh * .42} ${topY - hh * .2}Q${px + hh * .4} ${topY + hh * .2} ${px} ${topY + hh * .26}Z`}" fill="${steel}" stroke="${LINE}" stroke-width="${lw(1)}"/>`;
      else if (kind === 'priest') fore += `<path d="${d`M${px} ${topY}Q${px} ${topY - hh * .4} ${px + hh * .26} ${topY - hh * .34}Q${px + hh * .34} ${topY - hh * .14} ${px + hh * .16} ${topY - hh * .1}`}" fill="none" stroke="${LINE}" stroke-width="${lw(3.6)}"/><path d="${d`M${px} ${topY}Q${px} ${topY - hh * .4} ${px + hh * .26} ${topY - hh * .34}Q${px + hh * .34} ${topY - hh * .14} ${px + hh * .16} ${topY - hh * .1}`}" fill="none" stroke="#e8b04a" stroke-width="${lw(2)}"/>`;
      arms += drawArm(-side, armOf(-side, 'stand'));
      fore += drawArm(side, a, { fist: true });
    } else if (pose === 'hilt') {
      // both hands on the pommel of a sword planted point down
      const gy = crotch - B * .02, py = crotch - B * .12;
      fore += `<path d="${d`M${100 - hh * .055} ${gy}L${100 + hh * .055} ${gy}L${100 + hh * .03} ${GROUND - hh * .1}L100 ${GROUND - 1}L${100 - hh * .03} ${GROUND - hh * .1}Z`}" fill="${steel}" stroke="${LINE}" stroke-width="${lw(1)}"/>`;
      if (lod >= 2) fore += `<path d="${d`M100 ${gy + hh * .05}V${GROUND - hh * .14}`}" stroke="#fff" stroke-opacity=".7" stroke-width="${lw(.9)}"/>`;
      fore += `<path d="${d`M${100 - hh * .26} ${gy}L${100 + hh * .26} ${gy}`}" stroke="${LINE}" stroke-width="${lw(4.4)}"/><path d="${d`M${100 - hh * .26} ${gy}L${100 + hh * .26} ${gy}`}" stroke="#e8b04a" stroke-width="${lw(2.6)}"/><path d="${d`M100 ${gy}L100 ${py}`}" stroke="${LINE}" stroke-width="${lw(3.6)}"/><path d="${d`M100 ${gy}L100 ${py}`}" stroke="#5a3e2a" stroke-width="${lw(2)}"/>`;
      fore += drawArm(-1, armOf(-1, 'hilt'), { fist: true }) + drawArm(1, armOf(1, 'hilt'), { fist: true });
    } else if (pose === 'crossed') {
      // arms folded across the chest: the far forearm under, the near one over
      const aL = armOf(-1, 'crossed'), aR = armOf(1, 'crossed');
      fore += drawArm(1, aR, { fist: true }) + drawArm(-1, aL, { fist: true });
    } else {
      const aHip = pose === 'hip' ? armOf(side, 'hip') : armOf(side, 'stand');
      const aOther = armOf(-side, 'stand');
      arms += drawArm(side, aHip, { fist: pose === 'hip' }) + drawArm(-side, aOther);
      // what the free hand carries: a weapon hanging, a sword at the hip
      if (blade && Wk !== 'sword') fore += weaponHang(aOther.W, aOther.E);
      if (L.shield) {
        const sx = 100 + sw * 1.1, sy = waist - hh * .1, ks = L.shield.look || 'shield';
        const shp = ks === 'kite' || ks === 'tower' ? d`M${sx - hh * .4} ${sy - hh * .55}Q${sx} ${sy - hh * .7} ${sx + hh * .4} ${sy - hh * .55}Q${sx + hh * .42} ${sy + hh * .3} ${sx} ${sy + hh * .95}Q${sx - hh * .42} ${sy + hh * .3} ${sx - hh * .4} ${sy - hh * .55}Z` : ks === 'buckler' || ks === 'targe' ? d`M${sx - hh * .34} ${sy}A${hh * .34} ${hh * .34} 0 1 0 ${sx + hh * .34} ${sy}A${hh * .34} ${hh * .34} 0 1 0 ${sx - hh * .34} ${sy}Z` : d`M${sx - hh * .42} ${sy - hh * .5}L${sx + hh * .42} ${sy - hh * .5}Q${sx + hh * .44} ${sy + hh * .3} ${sx} ${sy + hh * .7}Q${sx - hh * .44} ${sy + hh * .3} ${sx - hh * .42} ${sy - hh * .5}Z`;
        const sc2 = tune(L.arms.f, 1.2, .04, .1, .65, .2, .65);
        fore += `<path d="${shp}" fill="${sc2}" stroke="${LINE}" stroke-width="${lw(1.3)}"/>` + (lod >= 1 ? `<path d="${shp}" fill="${shadeOf(sc2, .35, 1.1)}" clip-path="url(#${useDef(G, 'apsT')})"/>` : '') + charge(L, sx, sy, hh / 40);
      }
    }
    if (Wk === 'sword' && pose !== 'hilt') {
      const sx = 100 - side * hw * .95, sy = waist + hh * .02;
      torso += `<path d="${d`M${sx} ${sy}L${sx - side * hh * .42} ${knee - B * .02}`}" stroke="${LINE}" stroke-width="${lw(4.6)}"/><path d="${d`M${sx} ${sy}L${sx - side * hh * .42} ${knee - B * .02}`}" stroke="#4a3a52" stroke-width="${lw(3)}"/><path d="${d`M${sx + side * hh * .12} ${sy - hh * .12}L${sx - side * hh * .1} ${sy + hh * .1}`}" stroke="#e8b04a" stroke-width="${lw(2.4)}"/>`;
    }
    // a closed helm, taken off, at the feet
    const hl = L.helm && ['greathelm', 'bascinet', 'dwarfhelm'].includes(L.helm.look);
    if (hl) scen += `<path d="${d`M${100 + hw + hh * .3} ${GROUND}Q${100 + hw + hh * .28} ${GROUND - hh * .7} ${100 + hw + hh * .7} ${GROUND - hh * .72}Q${100 + hw + hh * 1.1} ${GROUND - hh * .7} ${100 + hw + hh * 1.08} ${GROUND}Z`}" fill="${steel}" stroke="${LINE}" stroke-width="${lw(1.1)}"/><path d="${d`M${100 + hw + hh * .42} ${GROUND - hh * .38}H${100 + hw + hh * .98}`}" stroke="${LINE}" stroke-width="${lw(1.6)}"/>`;
    // ---- the head
    const k = { lw: G.lwH, lod: faceLod, longTo: (waist - ty) / sc, neckTo: (sh + hh * .3 - ty) / sc };
    const Gf = Object.assign({}, G, { lod: Math.min(G.lod, faceLod) });
    Gf.ref = G.ref;
    const hd = head(Gf, L, k);
    const T = TF(tx, ty, sc);
    const Tt = TT(tx, ty, sc, tiltOf(L) * .6);
    const fig = `<g transform="${Tt}">${hd.back}</g>` + back + legs + `<g transform="${T}">${hd.neck}</g>` + ups + torso + arms + fore + `<g transform="${Tt}">${hd.front}</g>`;
    return { back: '', fig, scen, pose, head: { tx, ty, sc } };
  }

  // a newborn, swaddled and bound with a ribbon, asleep or smiling on a cushion
  function swaddled(G, L) {
    const lw = w => RW(w * G.lwF), sc = .5, tx = 100 - 25, ty = GROUND - 128;
    G.lwH = G.lwF / sc;
    const k = { lw: G.lwH, neckTo: 140 };
    const hd = head(G, L, k);
    const b = L.F ? '#f2dce2' : '#dce6f2', sh = shadeOf(b, .35, 1.2);
    let s = `<ellipse cx="100" cy="${GROUND - 4}" rx="62" ry="13" fill="${L.rib}" stroke="${LINE}" stroke-width="${lw(1.1)}"/>`;
    const D = d`M58 ${GROUND - 6}Q52 ${GROUND - 70} 76 ${GROUND - 88}Q100 ${GROUND - 98} 124 ${GROUND - 88}Q148 ${GROUND - 70} 142 ${GROUND - 6}Q100 ${GROUND + 2} 58 ${GROUND - 6}Z`;
    s += `<path d="${D}" fill="${b}" stroke="${LINE}" stroke-width="${lw(1.2)}"/><path d="${D}" fill="${sh}" clip-path="url(#${useDef(G, 'apsT')})"/>`;
    s += `<path d="${d`M60 ${GROUND - 40}Q100 ${GROUND - 62} 140 ${GROUND - 40}`}" fill="none" stroke="${LINE}" stroke-width="${lw(5.4)}"/><path d="${d`M60 ${GROUND - 40}Q100 ${GROUND - 62} 140 ${GROUND - 40}`}" fill="none" stroke="${L.rib}" stroke-width="${lw(3.6)}"/>`;
    const T = TF(tx, ty, sc);
    return { back: '', fig: s + `<g transform="${T}">${hd.front}</g>`, scen: `<ellipse cx="100" cy="${GROUND + 3}" rx="70" ry="9" fill="${LINE}" fill-opacity=".28"/>`, pose: 'swaddled', head: { tx, ty, sc } };
  }

  // ======================================================================================================================
  // ---- the frame and the ground (brief §7.1): a square frame with the cut corner on a bokashi ground
  // the budget (brief §7.1): a bust at most 8 KB, a full figure at most 18 KB. A picture over it is drawn again with the
  // finest strokes left out (clump lines, thin strands, folds), then one level of detail lower, then the 32 px level.
  const BUDGET = { bust: 8192, full: 18432 };
  AP.BUDGET = BUDGET;
  AP.svg = function (p, size = 200, opts = {}) {
    size = Math.max(12, +size || 200);
    const full = !opts.bust && size >= 120, cap = full ? BUDGET.full : BUDGET.bust;
    let lite = 0, s = build(p, size, opts, 0);
    while (s.length > cap && lite < 3) s = build(p, size, opts, ++lite);
    AP.lastLite = lite;                         // how far the last picture had to step down (for the sheet and tests)
    return s;
  };
  AP.buildAt = (p, size, opts, lite) => build(p, size, opts || {}, lite | 0);   // one level, for the sheets
  function build(p, size, opts, lite) {
    const full = !opts.bust && size >= 120;
    const G = ctx(size, full);
    G.lite = lite;
    if (lite > 1) G.lod = Math.min(G.lod, lite > 2 ? 1 : 2);
    PREC = full ? 2 : size < 130 ? 1 : 2;
    const theme = UI.set.theme === 'light' ? 'light' : 'dark', TK = THEME[theme];
    let L, f, Hh;
    try {
      L = look(p);
      Hh = full ? 300 : 200;
      // line weights: in device pixels, heavier as the picture shrinks; then in the frame's units
      const hpx = (full ? 34 : 86) * size / 200;
      const inner = clamp(hpx / 52, .6, 1.25);
      G.inner = inner; G.lwF = inner * G.px; G.lwH = G.lwF;
      G.rim = theme === 'dark' || L.sacred ? RIM_COOL : RIM_WARM;
      f = full ? fullFig(G, L) : null;
      if (!f) { G.full = false; f = bust(G, L); Hh = 200; }
    } finally { PREC = 10; }
    PREC = full ? 2 : size < 130 ? 1 : 2;
    try {
      const W = 200, H = Hh, px = G.px;
      const cut = clamp(8 * px, 8, 24), rad = clamp(6 * px, 6, 18);
      const fw = (L.frame === 'plain' ? 1.5 : 2) * px, i = fw / 2;
      const frameD = d`M${cut + i} ${i}H${W - rad - i}Q${W - i} ${i} ${W - i} ${rad + i}V${H - cut - i}L${W - cut - i} ${H - i}H${rad + i}Q${i} ${H - i} ${i} ${H - rad - i}V${cut + i}Z`;
      const frId = G.ref('apq', frameD), clipId = 'apk' + frId.slice(3);
      G.defs[clipId] = `<clipPath id="${clipId}"><use href="#${frId}"/></clipPath>`;
      // the ground: realm tint at the top to the surface at the bottom; an ink wash for the dead
      let tint = null;
      try { tint = UI.realmInk ? hexOk(UI.realmInk(L.realmC, theme).tint) : null; } catch (e) {}
      const top = L.dead ? TK.wash[0] : tint || mix(TK.surface, L.realmC, TK.tint), bot = L.dead ? TK.wash[1] : TK.surface;
      const gid = 'apg' + top.slice(1) + bot.slice(1);
      G.defs[gid] = `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/></linearGradient>`;
      const rim = theme === 'dark' || L.sacred ? RIM_COOL : RIM_WARM;
      let s = `<use href="#${frId}" fill="url(#${gid})"/>`;
      const hd = f.head;
      const hx = hd.tx + 50 * hd.sc, hy = hd.ty + 52 * hd.sc;
      // a soft light behind the head, the house's charge faint behind it
      if ((G.full || size >= 100) && !L.dead && !G.lite) {
        const rg = 'apr' + rim.slice(1);
        G.defs[rg] = `<radialGradient id="${rg}"><stop offset="0" stop-color="${rim}" stop-opacity=".34"/><stop offset="1" stop-color="${rim}" stop-opacity="0"/></radialGradient>`;
        s += `<ellipse cx="${R(hx)}" cy="${R(hy)}" rx="${R(hd.sc * 110)}" ry="${R(hd.sc * 104)}" fill="url(#${rg})"/>`;
      }
      if (G.lod >= 2 && !G.lite && L.arms.ch && L.arms.ch !== 'none') { const c = charge(L, hx, hy - 4 * hd.sc, hd.sc * 6.4, .12); s += L.dead ? c.replace(/#[0-9a-f]{6}/g, x => desat(x)) : c; }
      // the figure: its silhouette line (the figure's own shape grown in ink) and the rim light on its right edge
      let fig = f.back + f.fig;
      if (L.dead) fig = fig.replace(/#[0-9a-f]{6}/g, c => desat(c));
      if (G.lod >= 1) {
        const r = R(clamp(G.inner * .8, .5, 1.2) * px), rw = R(clamp(size / 70, 1.1, 2.2) * px);
        const fid = 'apo' + (G.full ? 'w' : '') + String(r).replace('.', '_') + '_' + String(rw).replace('.', '_') + rim.slice(1);
        const wob = G.full ? '<feTurbulence type="fractalNoise" baseFrequency=".09" seed="7"/><feDisplacementMap in="SourceGraphic" scale="1.1" xChannelSelector="R" yChannelSelector="G" result="w"/>' : '';
        G.defs[fid] = `<filter id="${fid}">${wob}<feMorphology ${G.full ? 'in="w" ' : ''}operator="dilate" radius="${r}" result="a"/><feFlood flood-color="${LINE}"/><feComposite in2="a" operator="in" result="o"/><feOffset in="${G.full ? 'w' : 'SourceGraphic'}" dx="${-rw}" result="b"/><feComposite in="${G.full ? 'w' : 'SourceGraphic'}" in2="b" operator="out" result="c"/><feFlood flood-color="${rim}" flood-opacity=".9"/><feComposite in2="c" operator="in"/><feMerge><feMergeNode in="o"/><feMergeNode in="${G.full ? 'w' : 'SourceGraphic'}"/><feMergeNode/></feMerge></filter>`;
        s += `<g clip-path="url(#${clipId})">${f.scen || ''}<g class="ap-fig mn-fig" filter="url(#${fid})" stroke-linecap="round" stroke-linejoin="round">${fig}</g></g>`;
      } else s += `<g clip-path="url(#${clipId})">${f.scen || ''}<g class="ap-fig mn-fig" stroke-linecap="round" stroke-linejoin="round">${fig}</g></g>`;
      // the frame: --line-strong; gold for rulers, the accent for nobles, --ink-3 for the dead
      const fc = L.dead ? TK.ink3 : L.frame === 'ruler' ? TK.legend : L.frame === 'noble' ? TK.accent : TK.strong;
      s += `<use href="#${frId}" fill="none" stroke="${fc}" stroke-width="${RW(fw)}"/>`;
      if (L.frame === 'ruler' && !L.dead && size >= 28) {
        const bx = W - 22 * Math.max(1, px * .5), by = 22 * Math.max(1, px * .5), bs = Math.max(1, px * .5);
        s += `<g transform="${TF(bx, by, bs)}"><circle r="13" fill="${TK.surface}" stroke="${TK.legend}" stroke-width="2"/><path d="M-8 5L-9-5L-4 0L0-7L4 0L9-5L8 5Z" fill="${TK.legend}" stroke="${LINE}" stroke-width="1"/></g>`;
      }
      if (L.dead && size >= 28) s += `<path d="${d`M${W - 16 * Math.max(1, px * .5)} ${8 * Math.max(1, px * .5)}v${14 * Math.max(1, px * .5)}M${W - 21 * Math.max(1, px * .5)} ${13 * Math.max(1, px * .5)}h${10 * Math.max(1, px * .5)}`}" stroke="${TK.ink3}" stroke-width="${R(2 * px * .6)}"/>`;
      const name = [p.given, p.sur].filter(x => typeof x === 'string').join(' ');
      const label = size >= 60 ? ` role="img" aria-label="${UI.esc(`Portrait of ${name || 'someone'}, ${Math.floor(L.age)}`)}"` : ' aria-hidden="true"';
      const pose = full ? f.pose || 'stand' : 'bust';
      const defs = Object.values(G.defs).join('');
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${Math.round(size)}" height="${Math.round(size * H / W)}" class="portrait mini anime${full ? ' full' : ''}"${full ? ` data-pose="${pose}"` : ''}${label}><defs>${defs}</defs>${s}</svg>`;
    } finally { PREC = 10; }
  }

  // ---- the cache: by id, age, wounds, gear, look, rank, mood and theme (so a list redrawn is a lookup)
  const CACHE = new Map();
  AP.cacheKey = (p, size, opts) => {
    let ev = '';
    const q = AP.ev || (A.S && Array.isArray(A.S.queue) ? A.S.queue[0] : null);
    if (q && q.ctx && q.ctx.pid === p.id) ev = evKey(q);
    const pc = A.S && A.S.pc;
    const r = pc && p.rel && p.rel[pc] ? p.rel[pc] : null;
    let mood = '';
    if (pc === p.id && A.MOODS && A.MOODS.mood) { try { const m = A.MOODS.mood(p); mood = m ? m.k : ''; } catch (e) {} }
    return [p.id, p.given, p.sur, Math.floor(+A.age(p) || 0), p.alive ? 1 : 0, p.race, p.sex, p.cult, p.realm, p.status, p.ruler || '', p.house || '', p.prison ? 1 : 0,
      JSON.stringify(p.app || {}), JSON.stringify(p.gear || {}), (p.wounds || []).map(w => w && w.k).join(','), (p.quirks || []).join(','), (p.traits || []).join(','),
      p.job ? p.job.c + ':' + p.job.k : '', p.mil ? p.mil.rank + ':' + p.mil.troop + ':' + p.mil.realm : '', p.noble ? p.noble.rung + ':' + p.noble.realm : '', p.flags && p.flags.unfree ? 1 : 0,
      Math.round((p.happy || 0) / 5), r ? Math.round((r.op || 0) / 10) + r.type : '', (p.health || 0) < 30 ? 1 : 0, mood, ev, UI.set.theme, size, opts && opts.bust ? 1 : 0].join('|');
  };
  AP.cached = function (p, size, opts) {
    const key = AP.cacheKey(p, size, opts);
    let s = CACHE.get(key);
    if (s === undefined) { s = AP.svg(p, size, opts); if (CACHE.size > 1500) CACHE.clear(); CACHE.set(key, s); }
    return s;
  };
  AP.clearCache = () => CACHE.clear();

  // ---- the setting, and the switch to the woodcut miniatures (63) or the release's paper doll
  const before = PORTRAIT.svg;
  AP.before = before;
  AP.errors = 0;
  PORTRAIT.svg = function (p, size = 200, opts = {}) {
    if (!p || !p.app || UI.set.anime === false || UI.set.miniatures === false) return before.apply(this, arguments);
    try { return AP.cached(p, size, opts || {}); } catch (e) { AP.errors++; AP.lastError = String(e && e.stack || e).slice(0, 300); PREC = 10; return before.apply(this, arguments); }
  };
  // the event modal says whose scene it is, so that face can wear the scene's tone
  if (typeof UI.eventModal === 'function') {
    const em = UI.eventModal;
    UI.eventModal = function (q) { const prev = AP.ev; AP.ev = q || null; try { return em.apply(this, arguments); } finally { AP.ev = prev; } };
  }
  // the profile (the only caller of UI.portrait): the brief puts a bust at 88 beside the name in the 1366 layout and the
  // 200 x 300 full figure on the wide (1920) rail; 90-fold's compact head shows the portrait at 84 px either way
  if (typeof UI.portrait === 'function') {
    const up = UI.portrait;
    AP.wide = () => { try { return window.innerWidth >= 1600; } catch (e) { return true; } };
    UI.portrait = function (p, size) {
      if (p && p.app && size >= 120 && UI.set.anime !== false && UI.set.miniatures !== false && !AP.wide()) return PORTRAIT.svg(p, 88, { bust: true });
      return up.apply(this, arguments);
    };
  }
  AP.menu = () => `<label class="row"><input type="checkbox" data-c="setAnime" ${UI.set.anime !== false ? 'checked' : ''}> Anime portraits (off: woodcut miniatures)</label>`;
  Object.assign(UI.C, {
    setAnime(el) { UI.set.anime = el.checked; UI.saveSettings(); UI.renderModal ? UI.renderModal() : UI.render(); },
  });
})();
