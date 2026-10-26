// Woodblock skies (docs/design/brief.md §7.2): 61-illumination's 25 event compositions, redrawn as colour woodblock
// prints lit like an anime background. Back to front, every picture is:
//   1. a graded sky (bokashi) from the hour table, with the dark ichimonji band across the top, as in Hiroshige;
//   2. the sun with a two-stop glow, or the moon, or seeded stars; flat two-tone clouds;
//   3. a far ridge and 4. a mid ridge, both seeded midpoint-displacement lines, pulled toward the sky colour;
//   5. the near ground, flat and dark, with a rim light along its top edge in the hour's light colour;
//   6. the subject (keep, hall, forge, ship ...) in flat colour with one window or fire that glows;
//   7. sometimes a framing branch, banner edge or reeds in a near corner;
//   8. weather: rain, snow, fog, petals or leaves;
//   9. the place-name cartouche (HTML, so it stays crisp and follows the theme).
// The hour comes from the event's shape (births at dawn, love at golden hour, deaths at dusk, crimes and taverns at
// night, battles in storm or golden light), the land from the player's home province, the season from the month.
//
// 61's rules hold: the same event in the same year draws the same picture (the seed is 61's, a hash of the shape, the
// event and the year), and drawing is pure: no A.rand, no write to A.S, and the same input gives the same string.
// UI.set.skies (on by default, in the menu) switches back to 61's ink woodcuts.
(function () {
  const SK = UI.SKIES = { W: 640, H: 200 };
  const W = SK.W, H = SK.H;
  if (UI.set.skies == null) UI.set.skies = true;
  const f = n => Math.round(n * 10) / 10;
  const INK = SK.INK = '#1b1730', SHADE = '#3a2f6b';

  // ---- seeds: 61's generator when it is there, the same one otherwise
  const seed = SK.seed = UI.WOODCUT && UI.WOODCUT.seed ? UI.WOODCUT.seed : function (str) {
    let h = 2166136261;
    for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
  };
  const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };

  // ---- colour: sRGB mixing for paint, OKLCH for the terrain and winter shifts
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = SK.mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => v + (B[i] - v) * t)); };
  const lin = c => (c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  const gam = c => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(0, c) ** (1 / 2.4) - 0.055);
  const toLab = h => {
    const [r, g, b] = rgb(h).map(lin);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
  };
  const fromLab = ([L, a, b]) => {
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
    return hex([4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s].map(gam));
  };
  // shift a colour: dL to its lightness, cK times its chroma, and turn it toward hue `hue` (degrees) by `hk` (0-1)
  const shift = SK.shift = (h, { dL = 0, cK = 1, hue = null, hk = 0, cMin = 0 } = {}) => {
    let [L, a, b] = toLab(h);
    let C = Math.hypot(a, b) * cK;
    if (hue != null && hk) {
      const t = hue * Math.PI / 180, C2 = Math.max(C, cMin);
      a = a * cK * (1 - hk) + Math.cos(t) * C2 * hk; b = b * cK * (1 - hk) + Math.sin(t) * C2 * hk;
    } else { const k = Math.hypot(a, b) ? C / Math.hypot(a, b) : 0; a *= k; b *= k; }
    return fromLab([Math.max(0, Math.min(0.985, L + dL)), a, b]);
  };

  // ---- the hour table (brief §7.2): sky top, sky bottom, far land, near land, light; k is how far local colours
  //      sink into the shadow at that hour
  const HOURS = SK.HOURS = {
    dawn: { st: '#2a3a6e', sb: '#f2a77a', far: '#6d6a9a', near: '#2a2440', light: '#ffd9a0', k: 0.46, name: 'dawn' },
    day: { st: '#3f7fc8', sb: '#bfe3f2', far: '#7fa6b8', near: '#2f4a3a', light: '#fff3c4', k: 0.2, name: 'day' },
    golden: { st: '#3b4f8f', sb: '#ffc46b', far: '#a0789a', near: '#3a2a2e', light: '#ffcf7a', k: 0.36, name: 'golden hour' },
    dusk: { st: '#1d2350', sb: '#d9637a', far: '#5a4a7a', near: '#1e1a2e', light: '#ff9e8a', k: 0.56, name: 'dusk' },
    night: { st: '#0b1030', sb: '#27345e', far: '#2a3358', near: '#0e1122', light: '#a8c8ff', k: 0.8, name: 'night' },
    storm: { st: '#2b3040', sb: '#6e7487', far: '#4a5060', near: '#1c1f28', light: '#d8e0ff', k: 0.5, name: 'storm' },
  };
  SK.HOUR_KEYS = Object.keys(HOURS);
  // terrain (the player's home province): how the land shifts, and the shape of its ridges
  const TERRAIN = SK.TERRAIN = {
    plains: { amp: [10, 5], rough: 0.5, peak: 0, dress: 'fields', mid: { hue: 118, hk: 0.45, cMin: 0.07, dL: 0.03 }, near: { hue: 130, hk: 0.3, cMin: 0.04 } },
    hills: { amp: [26, 16], rough: 0.55, peak: 10, dress: 'trees', mid: { hue: 140, hk: 0.4, cMin: 0.06 }, near: { hue: 145, hk: 0.25, cMin: 0.04 } },
    forest: { amp: [22, 12], rough: 0.55, peak: 6, dress: 'wood', mid: { hue: 155, hk: 0.6, cMin: 0.075, dL: -0.03 }, near: { hue: 150, hk: 0.5, cMin: 0.05, dL: 0.02 }, far: { hue: 165, hk: 0.2 } },
    steppe: { amp: [9, 5], rough: 0.45, peak: 0, dress: 'grass', mid: { hue: 86, hk: 0.65, cMin: 0.09, dL: 0.1 }, near: { hue: 78, hk: 0.55, cMin: 0.07, dL: 0.06 }, far: { hue: 70, hk: 0.3, dL: 0.03 } },
    desert: { amp: [18, 10], rough: 0.4, peak: 4, smooth: true, dress: 'dunes', mid: { hue: 72, hk: 0.75, cMin: 0.1, dL: 0.16 }, near: { hue: 48, hk: 0.7, cMin: 0.09, dL: 0.12 }, far: { hue: 45, hk: 0.55, cMin: 0.07, dL: 0.06 } },
    marsh: { amp: [6, 4], rough: 0.5, peak: 0, dress: 'water', mid: { hue: 112, hk: 0.55, cMin: 0.06 }, near: { hue: 112, hk: 0.5, cMin: 0.045, dL: 0.02 }, far: { hue: 120, hk: 0.2 } },
    mountains: { amp: [36, 20], rough: 0.6, peak: 46, jag: true, snow: true, dress: 'pines', mid: { hue: 235, hk: 0.35, cK: 0.7 }, near: { hue: 250, hk: 0.3, cK: 0.6 }, far: { hue: 255, hk: 0.4, cK: 0.7 } },
    tundra: { amp: [22, 10], rough: 0.55, peak: 18, jag: true, snow: true, winter: true, dress: 'pines', mid: { dL: 0.16, cK: 0.45 }, near: { hue: 245, hk: 0.3, cK: 0.6, dL: 0.08 }, far: { hue: 250, hk: 0.3, cK: 0.7 } },
  };
  SK.TERRAIN_KEYS = Object.keys(TERRAIN);
  // local colours of things, before the hour's light and shadow
  const M = SK.MAT = {
    plaster: '#eadfc8', timber: '#5b3f2e', tile: '#4a5674', thatch: '#a8834f', stone: '#aca597', wood: '#8d5d3b', red: '#c8402a',
    gold: '#e9b54e', blue: '#2f5aa8', bark: '#4a3328', cloth: '#ddd0b2', paper: '#f1e7d0', iron: '#4a4e5a', dirt: '#c9b088',
    steel: '#cfd6e2', leaf: '#4c7a3c', pine: '#2f5a44', green: '#4f8a3c', black: '#2a2533', prussian: '#1f3f7a',
  };
  const LEAF = [['#7d9aa6', '#e8eef2'], ['#5f9a40', '#f2b8c8'], ['#467a36', null], ['#c4642c', '#e2a238']];   // winter, spring, summer, autumn

  // the palette of one picture: the hour, shifted by the terrain and the season
  SK.palette = function (hour, terr, season, indoor) {
    const h = HOURS[hour] || HOURS.day, T = TERRAIN[terr] || TERRAIN.hills;
    const winter = season === 0 && terr !== 'desert' || T.winter, day = 1 - h.k * 0.75;
    const sh = (col, spec) => spec ? shift(col, Object.assign({}, spec, { hk: (spec.hk || 0) * day, dL: (spec.dL || 0) * day })) : col;
    let far = sh(h.far, T.far), near = sh(h.near, T.near);
    let st = h.st, sb = h.sb, light = h.light;
    let f2 = sh(mix(mix(h.far, h.near, 0.42), h.sb, 0.3), T.mid);
    if (winter) {
      const w = { dL: 0.15, cK: 0.7 }, ws = { dL: 0.07, cK: 0.8 };
      far = shift(far, w); near = shift(near, { dL: 0.13, cK: 0.7 }); f2 = shift(f2, { dL: 0.16, cK: 0.55 }); st = shift(st, ws); sb = shift(sb, ws);
    }
    const c = { hour, terr, season, winter, st, sb, far, near, light, k: h.k + (winter ? -0.08 : 0), ink: INK };
    c.sm = mix(mix(st, sb, 0.55), light, 0.06);                         // the sky's middle
    c.f1 = mix(far, sb, 0.6);                                          // far ridge: most of the way to the sky
    c.f2 = f2;                                                         // mid ridge: 40% toward the sky, then the land's own colour
    c.dk = mix(near, SHADE, hour === 'night' || hour === 'dusk' ? 0.42 : 0.22);   // the shadow local colours sink to
    c.leaf = LEAF[season == null ? 2 : season][0]; c.bloom = LEAF[season == null ? 2 : season][1];
    c.snow = winter;
    c.snowC = mix('#ffffff', sb, 0.28);
    c.glowC = hour === 'night' || hour === 'dusk' || hour === 'storm' ? '#ffc56a' : '#ffd88a';
    // indoors after dark the candle is the light: warm lit faces, a shallower shadow
    if (indoor && (hour === 'night' || hour === 'dusk' || hour === 'storm')) { c.light = '#ffcf8a'; c.k = 0.62; c.dk = mix('#24141c', SHADE, 0.3); }
    return c;
  };
  // a local colour under this hour's light: lit (facing the upper left) or in shade
  const tone = (c, local, lit) => mix(lit ? mix(local, c.light, 0.2) : local, c.dk, lit ? c.k * 0.68 + (c.k > 0.7 ? 0.14 : 0) : c.k);
  SK.tone = tone;

  // ---- midpoint displacement: 2^k segments across the picture, each level `rough` times the last
  const ridge = (r, y0, amp, rough, k, peak, px) => {
    const n = 1 << k, ys = new Array(n + 1);
    ys[0] = y0 + (r() - 0.5) * amp; ys[n] = y0 + (r() - 0.5) * amp;
    for (let step = n, a = amp; step > 1; step /= 2, a *= rough) {
      const hs = step / 2;
      for (let i = hs; i < n; i += step) ys[i] = (ys[i - hs] + ys[i + hs]) / 2 + (r() - 0.5) * a * 1.6;
    }
    return ys.map((y, i) => { const x = -10 + i * (W + 20) / n; return [x, y - peak * Math.max(0, 1 - Math.abs(x - px) / 150) ** 1.4]; });
  };
  // ridge lines in whole numbers: they are the longest paths of a picture
  const smooth = pts => {
    const R = Math.round;
    let d = `M${R(pts[0][0])} ${R(pts[0][1])}`;
    for (let i = 1; i < pts.length - 1; i++) d += `Q${R(pts[i][0])} ${R(pts[i][1])} ${R((pts[i][0] + pts[i + 1][0]) / 2)} ${R((pts[i][1] + pts[i + 1][1]) / 2)}`;
    return d + `L${R(pts[pts.length - 1][0])} ${R(pts[pts.length - 1][1])}`;
  };
  const jag = pts => 'M' + pts.map(([x, y]) => `${Math.round(x)} ${Math.round(y)}`).join('L');

  // ---- the layers. Each returns an SVG string; `p` is this picture's id prefix, `r` its generator
  const L = SK.LAYER = {};
  L.defs = (p, c, o) => {
    const g = c.hour === 'night' ? 0 : 1;
    return `<defs><linearGradient id="${p}s" x1="0" y1="0" x2="0" y2="${o.hz + 14}" gradientUnits="userSpaceOnUse">` +
      `<stop offset="0" stop-color="${c.st}"/><stop offset=".42" stop-color="${c.sm}"/><stop offset=".8" stop-color="${c.sb}"/><stop offset="1" stop-color="${mix(c.sb, c.light, g ? 0.45 : 0.15)}"/></linearGradient>` +
      `<linearGradient id="${p}i" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(c.st, INK, 0.5)}"/><stop offset=".45" stop-color="${mix(c.st, INK, 0.36)}" stop-opacity=".85"/><stop offset="1" stop-color="${c.st}" stop-opacity="0"/></linearGradient>` +
      `<radialGradient id="${p}g"><stop offset="0" stop-color="${c.light}" stop-opacity=".75"/><stop offset="1" stop-color="${c.light}" stop-opacity="0"/></radialGradient>` +
      `<linearGradient id="${p}n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.near}"/><stop offset="1" stop-color="${mix(c.near, INK, 0.35)}"/></linearGradient>` +
      `<filter id="${p}b" x="-2%" y="-20%" width="104%" height="140%"><feGaussianBlur stdDeviation="1.2"/></filter>` +
      `<filter id="${p}w" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="4"/></filter>` + (o.defs || '') + '</defs>';
  };
  L.sky = (p, c, o) => `<rect width="${W}" height="${o.hz + 16}" fill="url(#${p}s)"/>`;
  L.ichimonji = (p, c) => `<rect width="${W}" height="${H * 0.1 + 10}" fill="url(#${p}i)"/>`;

  // the sun (a disc and a two-stop glow), or the moon, and stars
  L.celestial = (p, c, r, o) => {
    let s = '';
    const hr = c.hour, x = o.sunX;
    if (hr === 'night' || hr === 'dusk' || hr === 'dawn') {
      const n = hr === 'night' ? 58 : hr === 'dusk' ? 22 : 10, top = hr === 'night' ? o.hz - 20 : 60;
      let d1 = '', d2 = '';
      for (let i = 0; i < n; i++) { const sx = f(r() * W), sy = f(4 + r() * r() * top); if (i % 5) d1 += `M${sx} ${sy}h0`; else d2 += `M${sx} ${sy}h0`; }
      s += `<path d="${d1}" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity="${hr === 'night' ? 0.7 : 0.45}"/><path d="${d2}" stroke="#fff6dd" stroke-width="2" stroke-linecap="round" opacity="${hr === 'night' ? 0.95 : 0.6}"/>`;
      if (hr === 'night') {
        // a few bright stars with four points, and the river of stars as a pale band
        for (let i = 0; i < 3; i++) { const sx = f(40 + r() * 560), sy = f(10 + r() * 50); s += `<path d="M${sx} ${f(sy - 4)}v8M${f(sx - 4)} ${sy}h8" stroke="#fff" stroke-width=".8" stroke-linecap="round" opacity=".8"/>`; }
        s += `<ellipse cx="${f(200 + r() * 240)}" cy="40" rx="330" ry="15" transform="rotate(${f(-8 - r() * 10)} 320 40)" fill="url(#${p}g)" opacity=".18"/>`;
      }
    }
    if (hr === 'storm') return s + `<circle cx="${f(x)}" cy="40" r="90" fill="url(#${p}g)" opacity=".35"/>`;
    if (hr === 'night' || (hr === 'dusk' && o.moon)) {
      const my = hr === 'night' ? 26 + r() * 30 : 24 + r() * 14, mx = hr === 'night' ? x : 420 + r() * 140, R = hr === 'night' ? 11 : 6;
      s += `<circle cx="${f(mx)}" cy="${f(my)}" r="${R * 7}" fill="url(#${p}g)" opacity=".5"/>`;
      if (o.full) s += `<circle cx="${f(mx)}" cy="${f(my)}" r="${R}" fill="#f6f0dc"/><path d="M${f(mx - 4)} ${f(my - 2)}a3 2 0 1 0 1 0M${f(mx + 2)} ${f(my + 3)}a2 1.5 0 1 0 1 0" fill="#d9d2bc" opacity=".7"/>`;
      else s += `<path d="M${f(mx)} ${f(my - R)}a${R} ${R} 0 1 0 ${f(R * 0.9)} ${f(R * 1.6)}a${f(R * 0.8)} ${f(R * 0.8)} 0 1 1 ${f(-R * 0.9)} ${f(-R * 1.6)}z" fill="#f6f0dc"/>`;
      if (hr === 'night') return s;
    }
    // the sun: high by day, low at golden hour, on the ridge at dawn and dusk
    const sy = hr === 'day' ? 30 + r() * 26 : hr === 'golden' ? 74 + r() * 24 : o.hz - 18 + r() * 10, R = hr === 'day' ? 13 : hr === 'golden' ? 17 : 19;
    const disc = hr === 'day' ? '#fffbea' : hr === 'golden' ? '#fff0c0' : hr === 'dawn' ? '#fff1d6' : '#ffd6b0';
    s += `<circle cx="${f(x)}" cy="${f(sy)}" r="${hr === 'day' ? 150 : 210}" fill="url(#${p}g)" opacity="${hr === 'day' ? 0.55 : 0.8}"/><circle cx="${f(x)}" cy="${f(sy)}" r="${R * 2.4}" fill="url(#${p}g)"/>`;
    s += `<circle cx="${f(x)}" cy="${f(sy)}" r="${R}" fill="${disc}"/>`;
    if (hr === 'golden' || hr === 'dawn') {   // shafts of light from the low sun
      let d = '';
      for (let i = 0; i < 4; i++) { const a = 0.35 + i * 0.32 + r() * 0.15, b = a + 0.07 + r() * 0.05, L2 = 420; d += `M${f(x)} ${f(sy)}L${f(x + Math.cos(a) * L2)} ${f(sy + Math.sin(a) * L2)}L${f(x + Math.cos(b) * L2)} ${f(sy + Math.sin(b) * L2)}Z`; }
      s += `<path d="${d}" fill="${c.light}" opacity=".08"/>`;
    }
    o.sunY = sy;
    return s;
  };
  // clouds: flat and two-tone, the lit side toward the sun. By day a cumulus is lit from above and shaded toward the
  // lower right; when the sun is low, long streaks are lit from below. A storm is a low ceiling hung with bulges.
  const CLOUD = {
    day: ['#ffffff', '#d5e1ef'], golden: ['#ffe9bd', '#c48f98'], dawn: ['#ffe2cc', '#9c88b4'], dusk: ['#ffbca2', '#70507e'],
    night: ['#56679a', '#26315c'], storm: ['#8e97ab', '#3f4556'],
  };
  const cumulus = (r, x, y, w) => {
    // a dome of bumps along the top, tallest near the middle; a flat base
    const nb = 4 + Math.floor(r() * 3), pts = [[x, y]];
    for (let j = 1; j < nb; j++) { const t = j / nb, bell = Math.sin(Math.PI * t) ** 0.8; pts.push([x + w * t + (r() - 0.5) * w / nb * 0.4, y - w * (0.1 + 0.26 * bell) * (0.75 + r() * 0.5)]); }
    pts.push([x + w, y]);
    let d = `M${f(x)} ${f(y)}`;
    for (let j = 1; j < pts.length; j++) { const [x1, y1] = pts[j - 1], [x2, y2] = pts[j], R = Math.hypot(x2 - x1, y2 - y1) * (0.52 + r() * 0.12); d += `A${f(R)} ${f(R)} 0 0 1 ${f(x2)} ${f(y2)}`; }
    return d + `Q${f(x + w / 2)} ${f(y + 3)} ${f(x)} ${f(y)}Z`;
  };
  L.clouds = (p, c, r, o) => {
    const hr = c.hour, low = hr === 'golden' || hr === 'dusk' || hr === 'dawn', [lit, sh] = CLOUD[hr];
    let s = '';
    if (hr === 'storm') {
      // the ceiling: two layers of cloud, each hung with rounded bulges along its lower edge
      for (const [y0, col, k] of [[44, mix(sh, INK, 0.25), 1], [62, sh, 0.8]]) {
        let d = `M-10 -10H650V${y0}`;
        for (let x = 650; x > -10;) { const w = 26 + r() * 40; d += `A${f(w / 2)} ${f(w * 0.32 * k)} 0 0 1 ${f(x - w)} ${f(y0 + (r() - 0.5) * 10)}`; x -= w; }
        s += `<path d="${d}Z" fill="${col}"/>`;
      }
      return s + `<path d="M-10 64Q160 52 330 66T650 58" fill="none" stroke="${lit}" stroke-width="1.4" opacity=".5"/>`;
    }
    const n = hr === 'day' ? 2 + Math.floor(r() * 2) : 1 + Math.floor(r() * 2);
    for (let i = 0; i < n; i++) {
      const x = -40 + r() * 600, y = (low ? 26 : 44) + r() * (low ? 54 : 40);
      if (low || hr === 'night' && r() < 0.5) {
        // streaks: long lenses, the body in shade with a hot edge underneath
        let d = '', e = '';
        for (let k = 0; k < 3; k++) {
          const w = 110 + r() * 200, h = 3 + r() * 4, xx = x + (r() - 0.3) * 80, yy = y + k * (6 + r() * 6);
          d += `M${f(xx)} ${f(yy)}q${f(w * 0.45)} ${f(-h * 2)} ${f(w)} ${f(-h * 0.4)}q${f(-w * 0.5)} ${f(h * 1.6)} ${f(-w)} ${f(h * 0.4)}z`;
          e += `M${f(xx + w * 0.12)} ${f(yy + h * 0.25)}q${f(w * 0.4)} ${f(h * 0.6)} ${f(w * 0.8)} ${f(-h * 0.5)}`;
        }
        s += `<path d="${d}" fill="${sh}" opacity=".9"/><path d="${e}" fill="none" stroke="${lit}" stroke-width="1.6" stroke-linecap="round" opacity=".9"/>`;
        continue;
      }
      const w = Math.min(90 + r() * 120, (y - 8) / 0.46), d = cumulus(r, x, y, w);
      // the shadowed body, then the lit mass drawn smaller toward the upper left, then a small trailing puff
      s += `<path d="${d}" fill="${sh}"/><path d="${d}" fill="${lit}" transform="translate(${f(x + w * 0.05)} ${f(y - 3)}) scale(.9 .86) translate(${f(-x)} ${f(-y)})"/>`;
      const px = x + w * (0.8 + r() * 0.3), pw2 = 24 + r() * 24, dp = cumulus(r, px, y + 6, pw2);
      s += `<path d="${dp}" fill="${sh}"/><path d="${dp}" fill="${lit}" transform="translate(${f(px + 1)} ${f(y + 4)}) scale(.88) translate(${f(-px)} ${f(-y - 6)})"/>`;
    }
    return s;
  };
  // the far and mid ridges, the snow on high peaks, a line of trees along the mid ridge where the land is wooded
  L.ridges = (p, c, r, o) => {
    const T = TERRAIN[c.terr] || TERRAIN.hills, px = 120 + r() * 400;
    let far = ridge(r, o.hz - 12, T.amp[0] * 2, T.rough, 5, T.peak, px);
    if (c.terr === 'desert') { const thr = o.hz - 22; far = far.map(([x, y]) => [x, y < thr ? thr - (thr - y) * 0.12 : y]); }
    const mid = ridge(r, o.hz + 10, T.amp[1] * 2, T.rough, 5, T.peak * 0.35, 640 - px);
    const pf = (T.jag ? jag(far) : smooth(far)) + `V${H}H-10Z`, pm = (T.jag && !T.smooth ? jag(mid) : smooth(mid)) + `V${H}H-10Z`;
    o.defs += `<path id="${p}F" d="${pf}"/><path id="${p}M" d="${pm}"/>`;
    let s = `<use href="#${p}F" fill="${c.f1}" filter="url(#${p}b)"/>`;
    if (T.snow) {
      const top = Math.min(...far.map(q => q[1])), line = top + 14 + r() * 8;
      let z = `M-10 -10H650V${f(line)}`; for (let x = 650; x > -10; x -= 16) z += `L${x - 8} ${f(line - 4 + r() * 9)}L${x - 16} ${f(line + r() * 4)}`;
      o.defs += `<clipPath id="${p}c"><path d="${z}Z"/></clipPath>`;
      s += `<use href="#${p}F" fill="${mix(c.snowC, c.f1, 0.2)}" clip-path="url(#${p}c)" filter="url(#${p}b)"/>`;
    }
    if (o.fog) s += `<rect y="${o.hz - 22}" width="${W}" height="36" fill="${c.sb}" opacity=".4"/>`;
    // the mid ridge, shaded toward its foot (a bokashi in the land as in the sky)
    o.defs += `<linearGradient id="${p}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.f2}"/><stop offset=".6" stop-color="${mix(c.f2, c.near, 0.35)}"/></linearGradient>`;
    s += `<use href="#${p}M" fill="url(#${p}m)"/>`;
    s += L.dress(p, c, r, o, T.dress, mid);
    s += `<use href="#${p}M" fill="none" stroke="${c.light}" stroke-width="1" opacity=".4"/>`;
    if (o.fog) s += `<rect y="${o.hz + 6}" width="${W}" height="18" fill="${c.sb}" opacity=".28"/>`;
    return s;
  };
  // what the land wears along the mid ridge: crowns of trees, a wood, fields, grass, dune crests, water, small pines
  L.dress = (p, c, r, o, kind, mid) => {
    const step = (W + 20) / 32, yAt = (i, t) => mid[i][1] + (mid[i + 1][1] - mid[i][1]) * t;
    const dark = mix(c.f2, c.near, 0.38), lit = mix(c.f2, c.light, 0.3);
    let d = '', e = '', s = '';
    if (kind === 'trees' || kind === 'wood') {
      const R0 = Math.round;
      for (const row of kind === 'wood' ? [0, 8] : [0]) for (let i = 0; i < mid.length - 1; i++) {
        if (r() < (kind === 'wood' ? (row ? 0.55 : 0.1) : 0.5)) continue;
        const t = r(), x = R0(mid[i][0] + step * t), y = R0(yAt(i, t) + 3 + row), R = R0((kind === 'wood' ? 6 : 4.5) + r() * 5);
        d += `M${x - R} ${y}a${R} ${R + 1} 0 0 1 ${R * 2} 0z`;
        if (!row) e += `M${x - R + 1} ${y - R0(R / 2)}a${R} ${R} 0 0 1 ${R} ${-R0(R / 2)}`;
      }
      return `<path d="${d}" fill="${dark}"/><path d="${e}" fill="none" stroke="${lit}" stroke-width="1.6" stroke-linecap="round" opacity=".75"/>`;
    }
    if (kind === 'pines') {
      for (let i = 0; i < mid.length - 1; i++) {
        if (r() < 0.45) continue;
        const t = r(), x = mid[i][0] + step * t, y = yAt(i, t) + 4, h = 8 + r() * 9;
        d += `M${f(x)} ${f(y - h)}l${f(h * 0.32)} ${f(h)}h${f(-h * 0.64)}z`;
      }
      return `<path d="${d}" fill="${dark}"/>`;
    }
    if (kind === 'fields') {
      // a patchwork of strips below the ridge line, in three greens and a ripe ochre
      const cols = [mix(c.f2, c.light, 0.22), mix(c.f2, c.near, 0.2), shift(c.f2, { hue: 85, hk: 0.5 * (1 - c.k), cMin: 0.08, dL: 0.05 * (1 - c.k) }), c.f2];
      let x = -10;
      while (x < W) {
        const w = 40 + r() * 70, i = Math.max(0, Math.min(mid.length - 2, Math.floor((x + 10) / step))), y = yAt(i, 0.5) + 5, hgt = 7 + r() * 8, sk = 10 + r() * 8;
        s += `<path d="M${f(x)} ${f(y)}h${f(w)}l${f(sk)} ${f(hgt)}h${f(-w)}z" fill="${cols[Math.floor(r() * 4)]}"/>`;
        x += w + 2;
      }
      return s;
    }
    if (kind === 'grass') {
      for (let i = 0; i < 60; i++) { const ii = Math.floor(r() * (mid.length - 1)), t = r(), x = mid[ii][0] + step * t, y = yAt(ii, t) + 2 + r() * 14; d += `M${f(x)} ${f(y)}l${f(2 + r() * 2)}-${f(3 + r() * 4)}`; }
      return `<path d="${d}" stroke="${lit}" stroke-width="1" stroke-linecap="round" opacity=".7"/>`;
    }
    if (kind === 'dunes') {
      for (let k = 0; k < 4; k++) { const x = r() * 560, y = o.hz + 14 + k * 7 + r() * 6, w = 80 + r() * 120; d += `M${f(x)} ${f(y)}q${f(w * 0.35)} -9 ${f(w * 0.6)} -3q${f(w * 0.2)} 3 ${f(w * 0.4)} 8`; }
      return `<path d="${d}" fill="none" stroke="${lit}" stroke-width="2" stroke-linecap="round" opacity=".7"/>`;
    }
    if (kind === 'water') {
      for (let k = 0; k < 5; k++) { const y = o.hz + 13 + k * 5 + r() * 3, x = r() * 420; d += `M${f(x)} ${f(y)}h${f(60 + r() * 160)}`; }
      return `<path d="${d}" stroke="${mix(c.sb, c.light, 0.3)}" stroke-width="2" stroke-linecap="round" opacity=".55"/>`;
    }
    return '';
  };
  // the sea band (a coast, or a voyage): Prussian blue with seigaiha arcs and the sun's road on the water
  L.sea = (p, c, r, o, y0) => {
    const top = mix(M.prussian, c.sb, c.hour === 'day' ? 0.45 : 0.3), bot = mix(M.prussian, c.near, 0.45);
    o.defs += `<linearGradient id="${p}q" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/></linearGradient>` +
      `<pattern id="${p}v" width="20" height="10" patternUnits="userSpaceOnUse"><path d="M0 10a10 10 0 0 1 20 0M4 10a6 6 0 0 1 12 0M8 10a2 2 0 0 1 4 0M-10 5a10 10 0 0 1 20 0M10 5a10 10 0 0 1 20 0" fill="none" stroke="${c.light}" stroke-width=".7"/></pattern>`;
    let s = `<rect y="${f(y0)}" width="${W}" height="${f(H - y0)}" fill="url(#${p}q)"/><rect y="${f(y0 + 8)}" width="${W}" height="${f(H - y0)}" fill="url(#${p}v)" opacity=".2"/>`;
    s += `<path d="M0 ${f(y0)}H${W}" stroke="${c.light}" stroke-width="1" opacity=".55"/>`;
    if (c.hour !== 'storm') {
      let d = ''; for (let i = 0; i < 9; i++) { const yy = y0 + 3 + i * (H - y0) / 9, w = 6 + i * 3.5 + r() * 6; d += `M${f(o.sunX - w / 2 + (r() - 0.5) * 8)} ${f(yy)}h${f(w)}`; }
      s += `<path d="${d}" stroke="${mix(c.light, '#ffffff', 0.3)}" stroke-width="1.6" stroke-linecap="round" opacity=".65"/>`;
    }
    return s;
  };
  // the near ground: flat and dark, a rim of light along its top edge, a few tufts
  L.near = (p, c, r, o) => {
    const y = o.groundY, a = 4 + r() * 6;
    const top = `M-10 ${f(y + a * (r() - 0.5))}Q160 ${f(y - a)} 320 ${f(y + (r() - 0.5) * a)}T650 ${f(y + (r() - 0.5) * a)}`;
    let s = `<path d="${top}V${H}H-10Z" fill="url(#${p}n)"/>`;
    s += `<path d="${top}" fill="none" stroke="${c.snow ? c.snowC : c.light}" stroke-width="${c.snow ? 3 : 1.5}" opacity="${c.snow ? 0.9 : 0.8}"/>`;
    let d = ''; for (let i = 0; i < 16; i++) { const x = r() * W, yy = y + 1 + r() * 8; d += `M${f(x)} ${f(yy + 6)}l2-${f(6 + r() * 6)}l2 ${f(5 + r() * 3)}l2-${f(4 + r() * 4)}l1 5z`; }
    s += `<path d="${d}" fill="${c.near}"/>`;
    return s;
  };
  // an interior: a warm wall with a window cut through it (the sky and land show through), light falling in, a
  // wainscot and a floor. By night the room is dark and the candle's pool of light carries it.
  L.room = (p, c, r, o) => {
    const kind = o.win, night = c.hour === 'night' || c.hour === 'dusk' || c.hour === 'storm';
    const wallC = tone(c, '#a77d58', true), wallD = mix(tone(c, '#a77d58', false), INK, 0.3), wain = tone(c, M.wood, false);
    const arch = (x, y, w, h) => `M${f(x)} ${f(y + h)}V${f(y + w / 2)}A${f(w / 2)} ${f(w / 2)} 0 0 1 ${f(x + w)} ${f(y + w / 2)}V${f(y + h)}Z`;
    const wins = kind === 'pair' ? [[o.wx, 22, 74, 112], [o.wx + 94, 22, 74, 112]] : kind === 'court' ? [[76, 28, 64, 106], [208, 40, 34, 92], [398, 40, 34, 92], [500, 28, 64, 106]] : [[o.wx, 18, 150, 118]];
    const hole = wins.map(w => arch(...w)).join('');
    const [wx0, , ww0] = wins[0], lx = wx0 + (kind === 'pair' ? 84 : ww0 / 2);
    o.defs += `<linearGradient id="${p}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${wallD}"/><stop offset=".75" stop-color="${wallC}"/></linearGradient>` +
      `<radialGradient id="${p}k"><stop offset="0" stop-color="${night ? c.glowC : c.light}" stop-opacity="${night ? 0.5 : 0.28}"/><stop offset="1" stop-color="${night ? c.glowC : c.light}" stop-opacity="0"/></radialGradient>`;
    let s = `<path d="M0 0H${W}V${H}H0Z${hole}" fill="url(#${p}r)" fill-rule="evenodd"/>`;
    // the light on the wall: round the window by day, round the candle by night (o.lampX is set by the scene)
    s += `<ellipse cx="${f(night ? (c.lampX == null ? 320 : c.lampX) : lx)}" cy="${night ? 130 : 90}" rx="${night ? 130 : 210}" ry="${night ? 90 : 120}" fill="url(#${p}k)"/>`;
    for (const [x, y, w, h] of wins) {
      s += `<path d="${arch(x, y, w, h)}" fill="none" stroke="${INK}" stroke-width="3"/><path d="M${f(x + w / 2)} ${f(y)}V${f(y + h)}M${f(x)} ${f(y + h * 0.55)}H${f(x + w)}" stroke="${wallD}" stroke-width="3"/>`;
      s += `<path d="M${f(x - 5)} ${f(y + h)}h${f(w + 10)}v5h${f(-w - 10)}z" fill="${tone(c, M.stone, true)}" stroke="${INK}" stroke-width="1"/>`;
    }
    if (!night) {
      let d = ''; for (const [x, y, w, h] of wins) d += `M${f(x)} ${f(y + h * 0.3)}L${f(x + w)} ${f(y + h * 0.3)}L${f(x + w + 130)} ${H}L${f(x + 80)} ${H}Z`;
      s += `<path d="${d}" fill="${c.light}" opacity="${c.hour === 'day' ? 0.14 : 0.11}"/>`;
    }
    s += `<path d="M0 ${o.floor - 30}H${W}V${o.floor}H0Z" fill="${wain}" opacity=".55"/><path d="M0 ${o.floor - 30}H${W}" stroke="${mix(wain, c.light, 0.3)}" stroke-width="2"/>`;
    s += `<path d="M0 ${o.floor}H${W}V${H}H0Z" fill="${mix(wain, INK, 0.2)}"/><path d="M0 ${o.floor}H${W}" stroke="${INK}" stroke-width="2"/>`;
    return s;
  };
  // framing: a branch from the top-left corner (the cartouche keeps the right), a banner's edge, or reeds at the foot
  L.frame = (p, c, r, o) => {
    const kind = o.framing, right = kind === 'reeds' && o.frameRight, X = x => right ? W - x : x, dark = mix(c.near, INK, 0.25);
    if (kind === 'branch') {
      const y0 = 4 + r() * 12;
      let s = `<path d="M-6 ${f(y0)}Q40 ${f(y0 + 2)} 70 ${f(y0 + 18)}T140 ${f(y0 + 30)}M58 ${f(y0 + 12)}Q74 ${f(y0 + 30)} 70 ${f(y0 + 50)}M104 ${f(y0 + 26)}Q122 ${f(y0 + 18)} 150 ${f(y0 + 18)}" fill="none" stroke="${dark}" stroke-width="3.2" stroke-linecap="round"/>`;
      const pads = [[34, y0 + 12, 22], [72, y0 + 52, 18], [96, y0 + 30, 20], [138, y0 + 34, 17], [152, y0 + 18, 15]];
      if (c.season === 1 || c.season === 3) {
        // blossom in spring, red leaves in autumn: clusters of small round flowers or leaves
        const col = c.season === 1 ? c.bloom : tone(c, '#c4462a', true), hi = c.season === 1 ? '#fff4f6' : tone(c, '#e8913a', true);
        let d = '', h = '';
        for (const [x, y, w] of pads) for (let i = 0; i < 6; i++) { const a = r() * 6.28, d2 = r() * w * 0.6, xx = f(x + Math.cos(a) * d2), yy = f(y + Math.sin(a) * d2 * 0.6); d += `M${xx} ${yy}h0`; if (i % 3 === 0) h += `M${f(xx - 1)} ${f(yy - 1)}h0`; }
        return s + `<path d="${d}" stroke="${col}" stroke-width="7" stroke-linecap="round"/><path d="${h}" stroke="${hi}" stroke-width="2.6" stroke-linecap="round"/>`;
      }
      // a pine's needle pads: domes with a fringe of needles underneath, lit along the top; snow on them in winter
      const pc = mix(tone(c, M.pine, false), c.near, 0.35), pl = tone(c, M.pine, true);
      let d = '', hd = '';
      for (const [x, y, w] of pads) {
        const hh = w * 0.62;
        d += `M${f(x - w)} ${f(y)}Q${f(x - w * 0.75)} ${f(y - hh)} ${f(x)} ${f(y - hh)}Q${f(x + w * 0.75)} ${f(y - hh)} ${f(x + w)} ${f(y)}`;
        for (let k = w; k > -w; k -= 4) d += `L${f(x + k - 2)} ${f(y + 3 + r() * 2.5)}L${f(x + k - 4)} ${f(y)}`;
        d += 'Z';
        hd += `M${f(x - w * 0.82)} ${f(y - hh * 0.35)}Q${f(x - w * 0.55)} ${f(y - hh * 0.92)} ${f(x + w * 0.1)} ${f(y - hh * 0.95)}`;
      }
      return s + `<path d="${d}" fill="${pc}"/><path d="${hd}" fill="none" stroke="${c.snow ? c.snowC : pl}" stroke-width="${c.snow ? 4 : 2.2}" stroke-linecap="round"/>`;
    }
    if (kind === 'reeds') {
      let d = '', h = '';
      for (let i = 0; i < 11; i++) { const x = 6 + i * 9 + r() * 6, t = 112 + r() * 40, bend = 6 + r() * 10; d += `M${f(X(x))} ${H}Q${f(X(x + 2))} ${f(t + 30)} ${f(X(x + bend))} ${f(t)}`; if (i % 3 === 0) h += `M${f(X(x + bend))} ${f(t)}l${right ? -1.5 : 1.5}-9`; }
      return `<path d="${d}" fill="none" stroke="${dark}" stroke-width="2.2" stroke-linecap="round"/><path d="${h}" stroke="${tone(c, M.thatch, true)}" stroke-width="4" stroke-linecap="round"/>`;
    }
    if (kind === 'banner') {
      const col = tone(c, o.bannerCol || M.red, true), sh = tone(c, o.bannerCol || M.red, false), g = tone(c, M.gold, true);
      return `<path d="M-4-4H46V128L22 112-4 128Z" fill="${col}" stroke="${INK}" stroke-width="1.4"/><path d="M30-4H46V128L30 117Z" fill="${sh}"/>` +
        `<path d="M6 20H36M6 26H36" stroke="${g}" stroke-width="2"/><circle cx="21" cy="60" r="9" fill="none" stroke="${g}" stroke-width="2"/>`;
    }
    return '';
  };
  // weather over everything: rain, snow, petals or leaves by day, fireflies on a summer night
  L.weather = (p, c, r, o) => {
    let s = '', d = '';
    const lit = c.hour === 'day' || c.hour === 'golden' || c.hour === 'dawn';
    if (o.rain) {
      for (let i = 0; i < 70; i++) { const x = r() * 680, y = r() * H; d += `M${f(x)} ${f(y)}l-7 17`; }
      s += `<path d="${d}" stroke="${mix(c.light, '#ffffff', 0.4)}" stroke-width=".8" opacity=".22"/>`;
    }
    if (c.snow && !o.indoor) {
      d = ''; let d2 = '';
      for (let i = 0; i < 46; i++) { const x = f(r() * W), y = f(r() * H); if (i % 3) d += `M${x} ${y}h0`; else d2 += `M${x} ${y}h0`; }
      s += `<path d="${d}" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".75"/><path d="${d2}" stroke="#fff" stroke-width="3.6" stroke-linecap="round" opacity=".9"/>`;
    } else if (!o.indoor && lit && (c.season === 1 || c.season === 3) && o.petals) {
      // a few petals or leaves drifting across, larger near the viewer
      d = ''; const col = c.season === 1 ? c.bloom : tone(c, '#d9702a', true);
      for (let i = 0; i < 9; i++) { const x = r() * W, y = 40 + r() * 150, k = 1 + r() * 1.4; d += `M${f(x)} ${f(y)}q${f(3 * k)} ${f(-4 * k)} ${f(6 * k)} 0q${f(-3 * k)} ${f(4 * k)} ${f(-6 * k)} 0`; }
      s += `<path d="${d}" fill="${col}" opacity=".92"/>`;
    } else if (!o.indoor && c.season === 2 && (c.hour === 'night' || c.hour === 'dusk') && o.petals) {
      d = ''; for (let i = 0; i < 12; i++) d += `M${f(40 + r() * 560)} ${f(o.groundY - 34 + r() * 40)}h0`;
      s += `<path d="${d}" stroke="#fff2a0" stroke-width="6" stroke-linecap="round" opacity=".3" filter="url(#${p}w)"/><path d="${d}" stroke="#fff6c0" stroke-width="1.8" stroke-linecap="round"/>`;
    }
    return s;
  };

  // ---- the subject's parts, drawn in 61's 600 x 180 frame (the scene group maps it into this one). Every part is lit
  //      from the upper left whatever way the scene faces. `c.glow(x, y, r)` gives the one soft glow of the picture.
  const P = SK.PART = {};
  const st = (c, w = 1.2) => ` stroke="${c.ink}" stroke-width="${w}"`;
  const at = (x, y, k = 1) => `transform="translate(${f(x)} ${f(y)})${k !== 1 ? ` scale(${f(k)})` : ''}"`;
  P.tree = (c, x, y, k = 1) => {
    const sh = tone(c, c.leaf, false), lt = tone(c, c.leaf, true);
    return `<g ${at(x, y, k)}><path d="M-3 0l1-26h4l1 26z" fill="${tone(c, M.bark, false)}"/>` +
      `<path d="M0-62c12 0 20 8 20 17 8 4 9 18-1 22-5 6-14 5-19 1-5 4-14 5-19-1-10-4-9-18-1-22 0-9 8-17 20-17z" fill="${sh}"${st(c)}/>` +
      `<path d="M-15-47c1-8 8-12 15-12 4 0 8 1 11 4-9 0-15 4-19 10-3 4-7 3-7-2z" fill="${lt}"/>` +
      (c.bloom && c.season === 1 ? `<path d="M-8-40h0M6-50h0M10-34h0M-12-28h0M2-30h0" stroke="${c.bloom}" stroke-width="4" stroke-linecap="round"/>` : '') + '</g>';
  };
  P.pine = (c, x, y, k = 1) => {
    const sh = tone(c, M.pine, false), lt = tone(c, M.pine, true);
    return `<g ${at(x, y, k)}><rect x="-2" y="-8" width="4" height="8" fill="${tone(c, M.bark, false)}"/>` +
      `<path d="M0-62 12-40H6l12 20h-8l12 14h-44l12-14h-8l12-20h-6z" fill="${sh}"${st(c)}/><path d="M0-62-12-40h6l-12 20h8l-12 14H0z" fill="${lt}"/>` +
      (c.snow ? `<path d="M0-62-5-53h10zM-6-40l-4 6h20l-4-6zM-10-20l-5 6h30l-5-6z" fill="${c.snowC}"/>` : '') + '</g>';
  };
  P.house = (c, x, y, w, h, o = {}) => {
    // whole-number geometry: a street draws six of these
    const R = Math.round, roof = R(h * 0.75), hw = R(w / 2), mat = o.thatch ? M.thatch : M.tile, e = hw + 7, rt = -h - roof, tm = R(-h * 0.55), sx = R(hw * 0.3), q = R(w / 4);
    let s = `<g ${at(x, y)}><rect x="${-hw}" y="${-h}" width="${2 * hw}" height="${h}" fill="${tone(c, M.plaster, true)}"${st(c)}/>` +
      `<path d="M${sx} ${-h}H${hw}V0H${sx}z" fill="${tone(c, M.plaster, false)}"/>` +
      `<path d="M${-hw} ${tm}H${hw}M${-hw} ${-h}L${-q} ${tm}M${hw} ${-h}L${q} ${tm}" stroke="${tone(c, M.timber, false)}" stroke-width="2.2"/>` +
      `<path d="M${-e} ${-h}L0 ${rt}L${e} ${-h}z" fill="${tone(c, mat, false)}"${st(c)}/><path d="M${-e} ${-h}L0 ${rt}V${-h}z" fill="${tone(c, mat, true)}"/>`;
    if (!o.small) s += `<path d="M${-e} ${-h}H${e}" stroke="${c.ink}" stroke-width="3" opacity=".5"/>`;
    if (c.snow) s += `<path d="M${-e} ${-h}L0 ${rt}L${e} ${-h}h-5L0 ${rt + 7}L${-e + 5} ${-h}z" fill="${c.snowC}"/>`;
    s += `<rect x="-6" y="-20" width="12" height="20" fill="${tone(c, M.timber, false)}"/>`;
    const dim = c.k > 0.5, ww = dim ? 14 : 12, wh = dim ? 12 : 10, wx = q - ww / 2, wy = R(-h * 0.47);
    s += `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="${o.lit ? c.glowC : tone(c, M.black, false)}"${st(c, 1)}/>`;
    if (o.lit) s += `<path d="M${q} ${wy}v${wh}M${wx} ${wy + wh / 2}h${ww}" stroke="${tone(c, M.timber, false)}" stroke-width="1.2"/>` + c.glow(x + q, y + wy + wh / 2, 12);
    if (o.lit && dim) s += `<ellipse cx="${q}" cy="3" rx="${R(w * 0.3)}" ry="4" fill="${c.glowC}" opacity=".22"/>`;
    if (o.chimney) s += `<rect x="${q}" y="${R(rt + roof * 0.25)}" width="8" height="${R(roof * 0.45)}" fill="${tone(c, M.stone, false)}"${st(c, 1)}/>` +
      (o.small ? '' : `<path d="M${q + 4} ${R(rt + roof * 0.2)}q-9-8 0-15q9-7 1-16" fill="none" stroke="${mix(c.light, '#ffffff', 0.4)}" stroke-width="3" stroke-linecap="round" opacity=".35"/>`);
    return s + '</g>';
  };
  P.castle = (c, x, y, k = 1) => {
    const lt = tone(c, M.stone, true), sh = tone(c, M.stone, false), cren = 'v-6h8v6h7v-6h8v6h7v-6h8v6h7v-6h8v6';
    return `<g ${at(x, y, k)}><rect x="-30" y="-46" width="60" height="46" fill="${lt}"${st(c)}/><path d="M8-46h22V0H8z" fill="${sh}"/>` +
      `<path d="M-30-46${cren}" fill="none"${st(c, 2)}/>` +
      `<rect x="-44" y="-66" width="18" height="66" fill="${lt}"${st(c)}/><rect x="26" y="-66" width="18" height="66" fill="${sh}"${st(c)}/>` +
      `<path d="M-46-66h22l-11-16z" fill="${tone(c, M.tile, true)}"${st(c, 1)}/><path d="M24-66h22l-11-16z" fill="${tone(c, M.tile, false)}"${st(c, 1)}/>` +
      `<path d="M-8 0v-18a8 8 0 0 1 16 0V0z" fill="${tone(c, M.black, false)}"/><rect x="-38" y="-52" width="6" height="9" fill="${c.glowC}"/></g>` + c.glow(x - 35 * k, y - 47 * k, 8);
  };
  P.church = (c, x, y) => {
    const lt = tone(c, M.plaster, true), sh = tone(c, M.plaster, false);
    return `<g ${at(x, y)}><rect x="-46" y="-40" width="64" height="40" fill="${lt}"${st(c)}/><path d="M-6-40h24V0H-6z" fill="${sh}"/>` +
      `<path d="M-52-40L-14-64 24-40z" fill="${tone(c, M.tile, false)}"${st(c)}/><path d="M-52-40L-14-64V-40z" fill="${tone(c, M.tile, true)}"/>` +
      `<rect x="18" y="-80" width="26" height="80" fill="${lt}"${st(c)}/><path d="M33-80h11V0H33z" fill="${sh}"/>` +
      `<path d="M14-80 31-126 48-80z" fill="${tone(c, M.tile, false)}"${st(c)}/><path d="M14-80 31-126V-80z" fill="${tone(c, M.tile, true)}"/>` +
      `<circle cx="31" cy="-133" r="5" fill="${tone(c, M.gold, true)}"${st(c, 1)}/><path d="M31-66a6 6 0 0 1 6 6v11h-12v-11a6 6 0 0 1 6-6z" fill="${c.glowC}"${st(c, 1)}/>` +
      `<path d="M-38-28a5 5 0 0 1 10 0v14h-10zM-18-28a5 5 0 0 1 10 0v14h-10z" fill="${tone(c, M.black, false)}"/><path d="M-6 0v-16a6 6 0 0 1 12 0v16" fill="${tone(c, M.timber, false)}"/>` +
      (c.snow ? `<path d="M-52-40L-14-64 24-40h-6L-14-58-46-40zM14-80 31-126 48-80h-5L31-114 19-80z" fill="${c.snowC}"/>` : '') + '</g>' + c.glow(x + 31, y - 58, 12);
  };
  P.banner = (c, x, y, h, col, flip) => `<g ${at(x, y)}><line y2="${-h}"${st(c, 2.4)}/>` +
    `<path d="M0 ${-h + 2}q${flip ? -14 : 14}-6 ${flip ? -32 : 32} 2l${flip ? 8 : -8} 9 ${flip ? -8 : 8} 9q${flip ? 18 : -18}-6 ${flip ? 32 : -32} 0z" fill="${tone(c, col, true)}"${st(c, 1.2)}/>` +
    `<path d="M0 ${-h + 13}q${flip ? -14 : 14}-5 ${flip ? -28 : 28}-1l${flip ? 4 : -4} 6q${flip ? 18 : -18}-5 ${flip ? 28 : -28} 2z" fill="${tone(c, col, false)}"/><circle cy="${-h - 3}" r="2.5" fill="${tone(c, M.gold, true)}"/></g>`;
  P.sword = (c, cx, cy, len, deg) => `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${deg})"><path d="M-3.5 ${-len / 2}L0 ${-len / 2 - 9}L3.5 ${-len / 2}V${len / 2 - 22}H-3.5z" fill="${tone(c, M.steel, false)}"${st(c)}/>` +
    `<path d="M-3.5 ${-len / 2}L0 ${-len / 2 - 9}V${len / 2 - 22}H-3.5z" fill="${tone(c, M.steel, true)}"/><path d="M-1.5 ${-len / 2 + 2}V${len / 2 - 26}" stroke="#fff" stroke-width=".9" opacity=".7"/>` +
    `<rect x="-14" y="${len / 2 - 22}" width="28" height="5" fill="${tone(c, M.gold, true)}"${st(c, 1)}/><rect x="-2.5" y="${len / 2 - 17}" width="5" height="13" fill="${tone(c, M.timber, false)}"/><circle cy="${len / 2 - 2}" r="4" fill="${tone(c, M.gold, false)}"${st(c, 1)}/></g>`;
  P.shield = (c, cx, cy, k, col) => `<g ${at(cx, cy, k)}><path d="M-22-26H22V0Q22 20 0 30Q-22 20-22 0z" fill="${tone(c, col, false)}"${st(c, 2)}/><path d="M-22-26H0V30Q-22 20-22 0z" fill="${tone(c, col, true)}"/>` +
    `<path d="M-14-16L0 0 14-16" fill="none" stroke="${tone(c, M.paper, true)}" stroke-width="4"/><path d="M-22-26H22V0Q22 20 0 30Q-22 20-22 0z" fill="none"${st(c, 2)}/></g>`;
  P.tent = (c, x, y, k, col) => `<g ${at(x, y, k)}><path d="M-34 0L0-44 34 0z" fill="${tone(c, M.cloth, false)}"${st(c)}/><path d="M-34 0L0-44V0z" fill="${tone(c, M.cloth, true)}"/>` +
    `<path d="M-8 0L0-18 8 0z" fill="${tone(c, M.black, false)}"/><line y1="-44" y2="-58"${st(c, 2)}/><path d="M0-58l14 4-14 4z" fill="${tone(c, col, true)}"${st(c, 1)}/></g>`;
  P.cart = (c, x, y) => `<g ${at(x, y)}><path d="M-40-26H34L30-10H-36z" fill="${tone(c, M.wood, true)}"${st(c)}/><line x1="34" y1="-18" x2="62" y2="-12"${st(c, 2.4)}/>` +
    `<path d="M-38-26Q-30-44-6-40Q14-48 30-28z" fill="${tone(c, M.cloth, true)}"${st(c)}/><path d="M-6-40Q14-48 30-28H4z" fill="${tone(c, M.cloth, false)}"/>` +
    `<circle cx="-18" cy="-6" r="12" fill="${tone(c, M.wood, false)}"${st(c, 2)}/><path d="M-30-6H-6M-18-18V6M-26-14-10 2M-26 2-10-14" stroke="${c.ink}" stroke-width="1.2"/></g>`;
  // a road on the ground plane: a curve from the foot of the picture to the mid ridge, narrowing with distance
  P.road = (c, o, x0 = 300, top = 140) => {
    const bx = x0 + (o.side ? -40 : 40), cx = x0 + (o.side ? 80 : -80), Lp = [], Rp = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10, u = 1 - t, x = u * u * bx + 2 * u * t * cx + t * t * x0, y = u * u * 192 + 2 * u * t * 166 + t * t * top, w = 40 * u ** 1.5 + 1.5;
      Lp.push(`${f(x - w)} ${f(y)}`); Rp.unshift(`${f(x + w)} ${f(y)}`);
    }
    return `<path d="M${Lp.join('L')}L${Rp.join('L')}Z" fill="${tone(c, M.dirt, true)}"/><path d="M${Rp.join('L')}" fill="none" stroke="${tone(c, M.dirt, false)}" stroke-width="3"/>`;
  };
  P.ship = (c, x, y, k, col) => `<g ${at(x, y, k)}><path d="M-46-12H46L34 6H-36z" fill="${tone(c, M.wood, false)}"${st(c, 1.6)}/><path d="M-46-12H46l-2 4H-44z" fill="${tone(c, M.wood, true)}"/>` +
    `<line y1="-12" y2="-80"${st(c, 2.6)}/><path d="M-28-72Q0-62 28-72V-24Q0-32-28-24z" fill="${tone(c, M.cloth, false)}"${st(c, 1.6)}/><path d="M-28-72Q-14-67 0-66V-28Q-14-28-28-24z" fill="${tone(c, M.cloth, true)}"/>` +
    `<path d="M-10-58H10M0-66V-30" stroke="${tone(c, col, true)}" stroke-width="4"/><path d="M0-80l16 4-16 4z" fill="${tone(c, col, true)}"${st(c, 1)}/></g>`;
  P.candle = (c, x, y, h = 30) => (c.lampX == null ? (c.lampX = x + 20, '') : '') + `<g ${at(x, y)}><rect x="-5" y="${-h}" width="10" height="${h}" fill="${tone(c, M.paper, true)}"${st(c, 1)}/><path d="M0 ${-h}q-6-10 0-18q6 8 0 18" fill="#ffe7a0"${st(c, 0.8)}/></g>` + c.glow(x, y - h - 8, 14);
  P.fire = (c, x, y) => `<g ${at(x, y)}><path d="M-13 1l26-5M-13-4l26 5" stroke="${tone(c, M.wood, false)}" stroke-width="3.4" stroke-linecap="round"/>` +
    `<path d="M0-2c-9 0-11-9-5-16 2 5 4 5 4 0 0-6 4-9 6-13 0 8 8 11 6 20-1 6-5 9-11 9z" fill="#ff9e3d"/><path d="M0-2c-4 0-5-5-2-9 1 3 2 3 3 0 1-3 2-4 3-6 0 5 3 7 2 11-1 3-3 4-6 4z" fill="#fff0b0"/></g>` + c.glow(x, y - 10, 18);
  P.table = (c, y = 150) => `<path d="M60 ${y}H540L556 ${y + 10}H44z" fill="${tone(c, M.wood, true)}"${st(c)}/><path d="M44 ${y + 10}H556V${y + 16}H44z" fill="${tone(c, M.wood, false)}"${st(c, 1)}/>`;

  // ---- the 25 scenes, after 61-illumination's compositions; X() mirrors a scene's layout, never its light
  const SC = SK.SCENE = {};
  const pos = (o, x) => o.flip ? 600 - x : x;
  SC.travel = (c, r, o) => o.sea
    ? P.ship(c, pos(o, 300), 158, 1, M.red) + `<g opacity=".75">${P.ship(c, pos(o, 470), 134, 0.4, M.blue)}</g>`
    : P.road(c, o) + `<g opacity=".78">${P.castle(c, pos(o, 470), 132, 0.5)}</g>` + P.tree(c, pos(o, 120), 158, 1) + P.cart(c, pos(o, 300 + (o.side ? -110 : 110)), 170) +
      `<g ${at(pos(o, 415), 158)}><rect x="-5" y="-22" width="10" height="22" fill="${tone(c, M.stone, true)}"${st(c, 1.4)}/><path d="M-5-22a5 5 0 0 1 10 0" fill="${tone(c, M.stone, true)}"${st(c, 1.4)}/></g>`;
  SC.tavern = (c, r, o) => P.house(c, pos(o, 250), 170, 120, 70, { lit: true, chimney: true, thatch: o.thatch }) +
    `<g ${at(pos(o, 330), 112)}><line x1="-14" x2="20"${st(c, 2.4)}/><line x1="10" x2="10" y2="6"${st(c, 1.4)}/><rect x="-2" y="6" width="24" height="22" fill="${tone(c, M.wood, true)}"${st(c, 1.6)}/><path d="M4 11h10v12H4zM14 14q5 0 5 4t-5 4" fill="none" stroke="${tone(c, M.gold, true)}" stroke-width="2"/></g>` +
    `<g ${at(pos(o, 400), 160)}><ellipse rx="15" ry="18" fill="${tone(c, M.wood, false)}"${st(c, 1.6)}/><path d="M-15 0a15 18 0 0 1 10-17V17A15 18 0 0 1-15 0z" fill="${tone(c, M.wood, true)}"/><path d="M-14-8h28M-14 8h28" stroke="${tone(c, M.iron, false)}" stroke-width="2"/></g>` + P.tree(c, pos(o, 480), 168, 0.8);
  SC.court = (c, r, o) => {
    let s = '';
    for (const x of [170, 238, 362, 430]) s += `<rect x="${x - 10}" y="40" width="20" height="135" fill="${tone(c, M.stone, true)}"${st(c, 1.4)}/><rect x="${x + 2}" y="40" width="8" height="135" fill="${tone(c, M.stone, false)}"/><path d="M${x - 14} 36h28v6h-28zM${x - 14} 170h28v6h-28z" fill="${tone(c, M.stone, false)}"${st(c, 1)}/>`;
    s += `<path d="M232 176v-20h136v20z" fill="${tone(c, M.red, false)}"${st(c, 1.4)}/><path d="M252 156v-8h96v8z" fill="${tone(c, M.red, true)}"${st(c, 1.2)}/>`;
    s += `<path d="M276 148V96q24-18 48 0v52z" fill="${tone(c, M.red, false)}"${st(c, 2)}/><path d="M276 148V96q12-9 24-9v61z" fill="${tone(c, M.red, true)}"/><path d="M284 110q16-9 32 0" fill="none" stroke="${tone(c, M.gold, true)}" stroke-width="3"/>`;
    s += `<path d="M287 82l6-11 7 7 7-7 6 11z" fill="${tone(c, M.gold, true)}"${st(c, 1.2)}/>` + c.glow(300, 78, 14);
    return s + P.banner(c, 204, 160, 96, M.blue) + P.banner(c, 396, 160, 96, M.blue, true);
  };
  SC.war = (c, r, o) => P.tent(c, pos(o, 150), 170, 1, M.red) + P.tent(c, pos(o, 470), 170, 0.9, M.blue) + `<g opacity=".8">${P.tent(c, pos(o, 300), 140, 0.5, M.red)}</g>` +
    P.banner(c, pos(o, 236), 176, 112, M.red) + P.banner(c, pos(o, 364), 176, 112, M.blue, true) + P.sword(c, 300, 128, 96, 35) + P.sword(c, 300, 128, 96, -35) + P.shield(c, 300, 138, 0.9, M.gold) +
    P.fire(c, pos(o, 392), 176);
  SC.fight = (c, r, o) => P.tree(c, pos(o, 110), 168, 0.9) + P.tree(c, pos(o, 500), 168, 1.1) + P.sword(c, 300, 104, 140, 40) + P.sword(c, 300, 104, 140, -40) + P.shield(c, 300, 112, 1.4, M.red) +
    `<path d="M300 30l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" fill="#fff8e0"/>` + c.glow(300, 42, 10);
  SC.money = (c, r, o) => {
    const g = tone(c, M.gold, true), gs = tone(c, M.gold, false), br = tone(c, M.wood, false);
    let s = P.table(c, 152) + `<line x1="300" y1="58" x2="300" y2="150" stroke="${br}" stroke-width="5"/><path d="M270 152h60l-8-9h-44z" fill="${br}"${st(c, 1)}/><line x1="228" y1="68" x2="372" y2="68" stroke="${br}" stroke-width="4"/><circle cx="300" cy="62" r="6" fill="${g}"${st(c, 1)}/>`;
    for (const x of [234, 366]) s += `<path d="M${x} 68L${x - 20} 108M${x} 68L${x + 20} 108" stroke="${br}" stroke-width="1.3"/><path d="M${x - 26} 108Q${x} 124 ${x + 26} 108z" fill="${tone(c, M.iron, true)}"${st(c, 1.4)}/>`;
    s += `<ellipse cx="234" cy="106" rx="10" ry="3" fill="${g}"${st(c, 1)}/><ellipse cx="234" cy="102" rx="10" ry="3" fill="${g}"${st(c, 1)}/>`;
    for (let i = 0; i < 5; i++) s += `<ellipse cx="150" cy="${148 - i * 5}" rx="14" ry="4" fill="${i % 2 ? gs : g}"${st(c, 1)}/>`;
    for (let i = 0; i < 3; i++) s += `<ellipse cx="180" cy="${148 - i * 5}" rx="14" ry="4" fill="${i % 2 ? gs : g}"${st(c, 1)}/>`;
    return s + `<path d="M440 150q-20 0-16-24q4-16 22-18l-8-10h24l-8 10q18 2 22 18q4 24-16 24z" fill="${tone(c, M.wood, true)}"${st(c, 1.6)}/><path d="M440 108h20" stroke="${tone(c, M.red, true)}" stroke-width="3"/>` + P.candle(c, 530, 150, 26);
  };
  SC.kin = (c, r, o) => P.tree(c, pos(o, 160), 170, 1.1) + P.tree(c, pos(o, 450), 170, 0.9) + P.house(c, pos(o, 300), 172, 130, 72, { lit: true, chimney: true, thatch: o.thatch }) +
    `<g ${at(pos(o, 216), 176)}><path d="M-20 0h40M-16 0v-14M16 0v-14M-20-12h40" stroke="${tone(c, M.wood, true)}" stroke-width="2.6"/></g><g ${at(pos(o, 398), 176)}><path d="M-16 0q8-16 20-14q12 2 12 14z" fill="${tone(c, M.thatch, true)}"${st(c, 1.2)}/></g>`;
  SC.work = (c, r, o) => {
    let s = P.house(c, pos(o, 130), 170, 90, 60, { chimney: true }) + `<g ${at(pos(o, 462), 172)}><path d="M-20 0l20-40 20 40z" fill="${tone(c, M.wood, false)}"${st(c, 1.4)}/><path d="M-20 0l20-40V0z" fill="${tone(c, M.wood, true)}"/></g>`;
    s += `<path d="M240 122h120q-10 14-40 16v22h22v8h-84v-8h22v-22q-30-2-40-16z" fill="${tone(c, M.iron, false)}"${st(c, 1.4)}/><path d="M246 124h108" stroke="${tone(c, M.steel, true)}" stroke-width="2"/>`;
    s += `<g transform="rotate(-28 340 94)"><rect x="300" y="90" width="60" height="7" fill="${tone(c, M.wood, true)}"${st(c, 1.2)}/><rect x="352" y="78" width="16" height="30" fill="${tone(c, M.iron, true)}"${st(c, 1.2)}/></g>`;
    let d = ''; for (let i = 0; i < 11; i++) { const a = -Math.PI * (0.12 + i * 0.07), R = 22 + (i % 3) * 11; d += `M${f(300 + Math.cos(a) * R)} ${f(118 + Math.sin(a) * R)}l${f(Math.cos(a) * 7)} ${f(Math.sin(a) * 7)}`; }
    return s + `<path d="${d}" stroke="#ffcf6a" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="300" cy="120" rx="16" ry="5" fill="#ffe2a0"/>` + c.glow(300, 116, 18);
  };
  SC.faith = (c, r, o) => P.tree(c, pos(o, 150), 170, 1) + P.pine(c, pos(o, 470), 172, 1) + P.church(c, pos(o, 300), 176) +
    `<path d="M${pos(o, 190)} 176v-16h-6h12M${pos(o, 440)} 176v-14h-5h10" stroke="${tone(c, M.stone, true)}" stroke-width="2.4"/>`;
  SC.food = (c, r, o) => P.table(c, 140) +
    `<path d="M200 140q-4-24 30-26q34 2 30 26z" fill="${tone(c, M.gold, true)}"${st(c, 1.4)}/><path d="M230 114q34 2 30 26h-14q2-20-16-26z" fill="${tone(c, M.gold, false)}"/><path d="M212 124l8-6M226 120l8-6M240 122l8-6" stroke="${tone(c, M.wood, false)}" stroke-width="1.6"/>` +
    `<path d="M300 140v-30q-10-4 0-14h18q10 10 0 14v30z" fill="${tone(c, M.blue, true)}"${st(c, 1.4)}/><path d="M309 96h9q10 10 0 14v30h-9z" fill="${tone(c, M.blue, false)}"/><path d="M318 112q12 2 8 14" fill="none"${st(c, 2)}/>` +
    `<path d="M352 134q30-16 60 0q-30 14-60 0zM412 134l14-8v16z" fill="${tone(c, M.steel, true)}"${st(c, 1.4)}/><circle cx="366" cy="132" r="2" fill="${c.ink}"/>` + P.candle(c, 470, 140, 24);
  SC.sickness = (c, r, o) => `<path d="M170 176v-40h40v-14h200v54" fill="${tone(c, M.wood, true)}"${st(c, 1.4)}/><path d="M210 138h200v20H210z" fill="${tone(c, M.cloth, true)}"${st(c, 1.4)}/><path d="M300 138h110v20H300z" fill="${tone(c, M.cloth, false)}"/>` +
    `<ellipse cx="192" cy="130" rx="16" ry="10" fill="${tone(c, M.paper, true)}"${st(c, 1.4)}/><path d="M450 176l-12-30h40l-12 30z" fill="${tone(c, M.red, false)}"${st(c, 1.4)}/>` +
    `<path d="M452 146q-6-20 4-34M460 146q2-22 14-30M468 146q8-14 20-18" fill="none" stroke="${tone(c, M.green, true)}" stroke-width="2.6"/>` + P.candle(c, 123, 176, 34);
  SC.letter = (c, r, o) => P.table(c, 160) + `<path d="M190 74h220v86H190z" fill="${tone(c, M.paper, true)}"${st(c, 1.6)}/><path d="M300 128L410 74V160H300z" fill="${tone(c, M.paper, false)}"/><path d="M190 74L300 128 410 74" fill="none"${st(c, 1.6)}/>` +
    `<circle cx="300" cy="128" r="16" fill="${tone(c, M.red, true)}"${st(c, 1.6)}/><path d="M292 128l8-8 8 8-8 8z" fill="none" stroke="${tone(c, M.gold, true)}" stroke-width="1.6"/>` +
    `<path d="M440 160l10-24h24l10 24z" fill="${tone(c, M.black, true)}"${st(c, 1)}/><path d="M462 136L520 40q6 10-4 26q-20 28-50 70" fill="${tone(c, M.paper, true)}"${st(c, 1.2)}/>` + P.candle(c, 140, 160, 28);
  SC.learning = (c, r, o) => P.table(c, 152) + `<path d="M200 150q50-14 100 0q50-14 100 0V76q-50-14-100 0q-50-14-100 0z" fill="${tone(c, M.paper, true)}"${st(c, 1.6)}/><path d="M300 76q50-14 100 0v74q-50-14-100 0z" fill="${tone(c, M.paper, false)}"/><path d="M300 76v74"${st(c, 1.4)}/>` +
    [92, 102, 112, 122, 132].map(y => `<path d="M214 ${y}q36-8 74 0M312 ${y}q36-8 74 0" fill="none" stroke="${tone(c, M.timber, false)}" stroke-width="1"/>`).join('') +
    `<path d="M220 86h18v18h-18z" fill="${tone(c, M.red, true)}"${st(c, 1)}/>` + P.candle(c, 136, 152, 40) +
    `<path d="M440 152l8-20h20l8 20z" fill="${tone(c, M.black, true)}"${st(c, 1)}/><path d="M458 132L500 58q6 10-2 22q-16 26-36 52" fill="${tone(c, M.paper, true)}"${st(c, 1.2)}/>`;
  SC.subordinate = (c, r, o) => P.tree(c, pos(o, 130), 174, 1) + P.tree(c, pos(o, 480), 174, 0.85) + P.castle(c, 300, 178, 1.35) + P.banner(c, 241, 70, 46, M.red) + P.banner(c, 359, 70, 46, M.red, true);
  SC.beast = (c, r, o) => [70, 130, 190, 410, 470, 530].map((x, i) => P.pine(c, x, 178 - (i % 2) * 6, 1.3 + (i % 3) * 0.15)).join('') +
    `<path d="M236 182Q300 70 364 182z" fill="${mix(c.near, INK, 0.5)}"/><path d="M260 182l10-16 6 16M330 182l8-18 8 18" fill="${mix(c.near, INK, 0.5)}"/>` +
    `<path d="M277 132q7-6 14 0q-7 5-14 0zM309 132q7-6 14 0q-7 5-14 0z" fill="#ffd25a"/>` + c.glow(300, 131, 14);
  SC.death = (c, r, o) => `<path d="M188 184q112-30 224 0z" fill="${tone(c, M.dirt, false)}"/><path d="M196 181q104-26 208 0" fill="none" stroke="${c.light}" stroke-width="1.4" opacity=".6"/><path d="M282 146V88a18 18 0 0 1 36 0v58z" fill="${tone(c, M.stone, true)}"${st(c, 2)}/><path d="M302 72a18 18 0 0 1 16 16v58h-16z" fill="${tone(c, M.stone, false)}"/>` +
    `<path d="M290 98h20M290 108h20M290 118h14" stroke="${tone(c, M.stone, false)}" stroke-width="1.6"/><path d="M268 148q32-8 64 0" fill="none" stroke="${tone(c, M.green, true)}" stroke-width="4"/>` +
    P.tree(c, pos(o, 470), 174, 1.2) + `<path d="M${pos(o, 470)} 100q10-10 22-4q-4-8 6-8l6 6-8 4q2 8-10 10z" fill="${INK}"/>` + P.candle(c, pos(o, 151), 172, 28);
  SC.play = (c, r, o) => `<path d="M190 146h220l-22 30H212z" fill="${tone(c, M.wood, true)}"${st(c, 1.4)}/><rect x="250" y="86" width="100" height="60" fill="${tone(c, M.wood, false)}"${st(c, 1.4)}/>` +
    `<path d="M262 94h76v44h-76zM276 104h48v24h-48zM300 94v10M300 128v10M262 116h14M324 116h14" fill="none" stroke="${tone(c, M.paper, true)}" stroke-width="1.6"/>` +
    [[262, 94], [300, 94], [338, 138], [276, 128], [324, 104]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="5" fill="${i % 2 ? tone(c, M.paper, true) : tone(c, M.black, false)}"${st(c, 1.2)}/>`).join('') +
    [160, 430].map(x => `<g ${at(x, 128)}><path d="M0 0l18-6 12 12-18 6z" fill="${tone(c, M.paper, true)}"${st(c, 1.2)}/><path d="M0 0v18l12 12V12z" fill="${tone(c, M.paper, false)}"${st(c, 1.2)}/><path d="M30 6v18l-18 6V12z" fill="${tone(c, M.cloth, false)}"${st(c, 1.2)}/><circle cx="15" cy="2" r="1.8" fill="${c.ink}"/></g>`).join('') + P.candle(c, 520, 160, 24);
  SC.love = (c, r, o) => P.tree(c, pos(o, 480), 174, 1.1) + `<path d="M${pos(o, 120)} 178q100-14 180-4" fill="none" stroke="${tone(c, M.red, true)}" stroke-width="3.4"/>` +
    `<path d="M300 162q-6-40 4-90" fill="none" stroke="${tone(c, M.green, false)}" stroke-width="3.4"/><path d="M302 126q-22-6-26-24q20 0 26 24M304 110q20-8 30-26q-22 4-30 26" fill="${tone(c, M.green, true)}"${st(c, 1)}/>` +
    `<path d="M304 74q-22-2-20-20q4-16 20-10q16-6 20 10q2 18-20 20z" fill="${tone(c, M.red, true)}"${st(c, 1.6)}/><path d="M304 44q16-6 20 10q2 18-20 20z" fill="${tone(c, M.red, false)}"/><path d="M296 60q8-8 16 0q-8 6-16 0" fill="none"${st(c, 1)}/>` +
    `<circle cx="${pos(o, 200)}" cy="138" r="22" fill="none" stroke="${tone(c, M.gold, true)}" stroke-width="7"/><circle cx="${pos(o, 232)}" cy="138" r="22" fill="none" stroke="${tone(c, M.gold, false)}" stroke-width="7"/>` +
    `<circle cx="${pos(o, 200)}" cy="138" r="22" fill="none" stroke="${c.ink}" stroke-width="1"/><circle cx="${pos(o, 232)}" cy="138" r="22" fill="none" stroke="${c.ink}" stroke-width="1"/><path d="M${pos(o, 190)} 118l4 4" stroke="#fff" stroke-width="2" stroke-linecap="round"/>` + c.glow(pos(o, 200), 120, 8);
  SC.weather = (c, r, o) => P.tree(c, 300, 178, 1.4).replace('scale(1.4)', 'scale(1.4) skewX(-12)') +
    `<path d="M430 34l-14 30h12l-16 34 30-40h-12l14-24z" fill="#fff4c0"${st(c, 1)}/>` + c.glow(428, 64, 22);
  SC.menace = (c, r, o) => P.house(c, pos(o, 150), 178, 110, 90, {}) + P.house(c, pos(o, 450), 178, 110, 96, {}) +
    `<path d="M240 182v-98a60 60 0 0 1 120 0v98z" fill="${mix(c.near, INK, 0.55)}"${st(c, 2)}/><path d="M300 182q-16-8-18-40q-2-24 18-28q20 4 18 28q-2 32-18 40z" fill="${c.light}" opacity=".12"/>` +
    `<path d="M292 112q8-14 16 0l2 30h-20z" fill="${c.light}" opacity=".2"/><path d="M318 140l14 22-4 2-14-22z" fill="#e8eef8"/>` + c.glow(325, 152, 6);
  SC.errand = (c, r, o) => P.road(c, o) + P.house(c, pos(o, 150), 168, 90, 56, {}) + P.tree(c, pos(o, 500), 170, 0.9) +
    `<g ${at(pos(o, 400), 176)}><line y2="-98" stroke="${tone(c, M.wood, false)}" stroke-width="5"/><path d="M0-92h30v10" fill="none" stroke="${tone(c, M.iron, false)}" stroke-width="3"/>` +
    `<path d="M18-82h24l-4 34H22z" fill="${c.glowC}"${st(c, 1.6)}/><path d="M24-48h12l2 6H22zM24-82l6-8 6 8" fill="${tone(c, M.iron, false)}"/></g>` + c.glow(pos(o, 400) + 30, 112, 20);
  SC.favor = (c, r, o) => P.table(c, 156) + `<path d="M160 154h120q10-8 0-16H160q-10 8 0 16z" fill="${tone(c, M.red, true)}"${st(c, 1.6)}/><path d="M164 146h112" stroke="${tone(c, M.gold, true)}" stroke-width="1.6" stroke-dasharray="4 3"/>` +
    `<circle cx="220" cy="124" r="14" fill="none" stroke="${tone(c, M.gold, true)}" stroke-width="6"/><circle cx="220" cy="124" r="14" fill="none" stroke="${c.ink}" stroke-width="1"/><path d="M212 108l8-9 8 9z" fill="${tone(c, M.red, true)}"${st(c, 1)}/>` +
    `<path d="M330 66h130v86H330z" fill="${tone(c, M.paper, true)}"${st(c, 1.6)}/><path d="M410 66h50v86h-50z" fill="${tone(c, M.paper, false)}"/><path d="M330 66q-10 6 0 12M460 140q10 6 0 12" fill="none"${st(c, 1.6)}/>` +
    [82, 92, 102, 112].map(y => `<path d="M344 ${y}h${y === 112 ? 60 : 102}" stroke="${tone(c, M.timber, false)}" stroke-width="1"/>`).join('') +
    `<path d="M410 134l-6 26 10-8 6 10 2-28" fill="${tone(c, M.red, false)}"${st(c, 1)}/><circle cx="416" cy="130" r="11" fill="${tone(c, M.red, true)}"${st(c, 1.4)}/>` + c.glow(220, 112, 10);
  SC.crime = (c, r, o) => P.house(c, pos(o, 470), 178, 120, 84, { lit: true }) +
    `<path d="M220 164q-20 0-16-26q4-18 24-22l-8-12h32l-8 12q20 4 24 22q4 26-16 26z" fill="${tone(c, M.wood, true)}"${st(c, 1.6)}/><path d="M220 116h24" stroke="${tone(c, M.red, true)}" stroke-width="3"/>` +
    `<path d="M248 128l60-40" stroke="${c.light}" stroke-width="1.4" stroke-dasharray="3 3" opacity=".7"/>` + P.sword(c, 320, 112, 60, 50).replace(/rect x="-14"/, 'rect x="-8"').replace(/width="28"/, 'width="16"');
  SC.street = (c, r, o) => [80, 170, 260, 350, 440, 520].map((x, i) => P.house(c, x, 178, 80, 54 + (i * 13) % 30, { lit: i % 2 === 1, chimney: i % 3 === 0, thatch: i % 4 === 2, small: true })).join('');
  // no shape: an open view, a lone pine on a rise
  SC.none = (c, r, o) => P.pine(c, pos(o, 430), 176, 1.5) + P.tree(c, pos(o, 140), 178, 0.7) + `<path d="M${pos(o, 330)} 182q80-30 200 0z" fill="${c.near}"/>`;

  // which scenes are indoors (61's NO_LAND), which have their own hour (the brief's mood mapping, then 61's night set)
  const INDOOR = SK.INDOOR = new Set(['court', 'letter', 'learning', 'money', 'play', 'food', 'sickness', 'favor']);
  const MOOD = SK.MOOD = {
    kin: [['day', 4], ['golden', 2], ['dawn', 2]], love: [['golden', 1]], death: [['dusk', 1]], tavern: [['night', 1]], crime: [['night', 1]],
    menace: [['night', 1]], errand: [['night', 3], ['dusk', 1]], war: [['storm', 1], ['golden', 1]], fight: [['storm', 1], ['golden', 1]], weather: [['storm', 1]],
    beast: [['dusk', 1], ['night', 1]], sickness: [['night', 2], ['dusk', 1]], learning: [['day', 2], ['night', 1], ['golden', 1]], letter: [['day', 2], ['golden', 1], ['night', 1]],
    faith: [['dawn', 1], ['day', 2], ['golden', 1]], court: [['day', 2], ['golden', 1]], travel: [['day', 3], ['dawn', 1], ['golden', 1]], street: [['day', 2], ['golden', 1], ['dusk', 1]],
    food: [['golden', 1], ['day', 1], ['dusk', 1]], play: [['day', 1], ['golden', 1], ['night', 1]], money: [['day', 2], ['golden', 1]], favor: [['day', 2], ['golden', 1]],
    work: [['day', 2], ['golden', 1], ['dusk', 1]], subordinate: [['day', 2], ['golden', 1], ['dawn', 1]], none: [['day', 2], ['golden', 1], ['dawn', 1], ['dusk', 1]],
  };
  // the words that set the hour whatever the shape: a birth or the new year at dawn, a wedding at golden hour, a death
  // at dusk, a battle in storm or golden light (the brief's mood mapping, by event shape and then by what it says)
  SK.WORDS = [
    ['dawn', /\b(born|birth|newborn|midwife|christen\w*|new year|naming day)\b/i],
    ['golden', /\b(wedding|wed|betroth\w*|bride|groom)\b/i],
    ['dusk', /\b(funeral|burial|buried|grave|graveside|mourn\w*)\b/i],
    ['battle', /\b(battle|siege|charge|the lines|vanguard)\b/i],
  ];
  SK.hourFor = function (shape, key, words) {
    const r = seed('hour|' + shape + '|' + key);
    for (const [h, re] of SK.WORDS) if (words && re.test(words)) return h === 'battle' ? (r() < 0.5 ? 'storm' : 'golden') : h;
    const L2 = MOOD[shape] || MOOD.none, tot = L2.reduce((a, x) => a + x[1], 0);
    let v = r() * tot;
    for (const [h, w] of L2) { v -= w; if (v < 0) return h; }
    return L2[0][0];
  };
  SK.LABEL = Object.assign({}, UI.WOODCUT && UI.WOODCUT.LABEL, { none: 'an open view' });

  // the print for an event. key: the event and the year (61's); month 0-11; o: { hour, terr, coast, place }
  SK.svg = function (shape, key, month, opt = {}) {
    const sc = SC[shape] ? shape : 'none', r = seed(sc + '|' + key);
    const season = month == null ? 1 : [0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 0][month];
    const terr = TERRAIN[opt.terr] ? opt.terr : 'hills', hour = HOURS[opt.hour] ? opt.hour : SK.hourFor(sc, key, '');
    const p = 'sk' + hash([sc, key, month, terr, hour, opt.coast ? 1 : 0].join('|')) + '_';
    const indoor = INDOOR.has(sc), c = SK.palette(hour, terr, season, indoor);
    const o = { hz: indoor ? 112 : 146, groundY: 176, floor: 176, indoor, defs: '' };
    o.sea = sc === 'travel' && r() < 0.3;
    o.flip = r() < 0.5 && !['letter', 'learning', 'money', 'favor', 'court', 'subordinate', 'beast', 'weather'].includes(sc);
    o.side = r() < 0.5; o.thatch = r() < 0.5;
    o.sunX = 70 + r() * 250; o.moon = r() < 0.6; o.full = r() < 0.55;
    o.rain = hour === 'storm' || (season === 1 || season === 3) && !indoor && r() < 0.12;
    o.fog = !o.rain && hour !== 'night' && (c.terr === 'marsh' ? r() < 0.7 : r() < 0.18);
    o.petals = r() < 0.6;
    o.win = sc === 'court' ? 'court' : r() < 0.5 ? 'pair' : 'one'; o.wx = 40 + r() * 120;
    // framing: reeds by water and marsh, a banner at war and court, a branch elsewhere; none in a third of pictures
    const fr = r();
    o.framing = indoor ? null : (['war', 'subordinate'].includes(sc) && fr < 0.5) ? 'banner' : (terr === 'marsh' || opt.coast || o.sea) && fr < 0.5 ? 'reeds' : fr < 0.38 && hour !== 'storm' ? 'branch' : null;
    o.frameRight = !o.flip ? r() < 0.75 : r() < 0.25; o.bannerCol = r() < 0.5 ? M.red : M.blue;
    // the one glow of the picture
    let glowed = false;
    c.glow = (x, y, rad) => { if (glowed) return ''; glowed = true; return `<circle cx="${f(x)}" cy="${f(y)}" r="${rad}" fill="${c.glowC}" opacity=".6" filter="url(#${p}w)"/>`; };
    const subject = SC[sc](c, r, o);
    // back to front
    let body = L.sky(p, c, o) + L.celestial(p, c, r, o) + L.clouds(p, c, r, o) + L.ichimonji(p, c);
    body += L.ridges(p, c, r, o);
    const coast = !indoor && (opt.coast || o.sea);
    if (coast) body += L.sea(p, c, r, o, o.sea ? o.hz + 2 : o.hz + 12);
    if (indoor) body += L.room(p, c, r, o);
    else if (!o.sea) body += L.near(p, c, r, o);
    else { o.groundY = 200; }
    const T = indoor ? 'translate(20 14)' : 'translate(44 26) scale(.92)';
    body += `<g transform="${T}">${subject}</g>`;
    if (o.framing) body += L.frame(p, c, r, o);
    body += L.weather(p, c, r, o);
    body += `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="none" stroke="${INK}" stroke-width="2"/>`;
    const label = 'Colour print: ' + (SK.LABEL[sc] || 'a scene') + ', ' + HOURS[hour].name + (opt.place ? ', ' + opt.place : '');
    return `<svg class="woodcut" data-print="sky" data-hour="${hour}" data-terr="${terr}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${UI.esc(label)}" xmlns="http://www.w3.org/2000/svg">${L.defs(p, c, o)}${body}</svg>`;
  };

  // ---- the event's print: its shape (61), the hour from its shape and words, the land and place from the player's home
  SK.optsFor = function (q, view) {
    const pc = A.pc && A.pc(), pr = pc && A.S && A.S.prov ? A.S.prov[pc.home] : null;
    const v = view || (q && q.view) || {};
    const shape = UI.WOODCUT && UI.WOODCUT.shapeOf ? UI.WOODCUT.shapeOf(q, v) : (A.evShape && A.EV[q.ev] && A.evShape(A.EV[q.ev])) || 'none';
    const key = q.ev + '|' + (A.S ? A.S.year : 0);
    const words = (v.title || '') + ' ' + (typeof v.text === 'string' ? v.text : '');
    const terr = pr && TERRAIN[pr.terr] ? pr.terr : 'hills';
    return { shape, key, month: A.monthOf(A.today()).m, hour: SK.hourFor(SC[shape] ? shape : 'none', key, words), terr, coast: !!(pr && pr.coast), place: pr ? pr.name : '' };
  };
  SK.cartouche = place => place ? `<span class="sky-cart" aria-hidden="true">${UI.esc(place)}</span>` : '';
  const drawn = new WeakSet();
  SK.forQueue = function (q) {
    const v = A.eventView(q), o = SK.optsFor(q, v);
    const fresh = !drawn.has(q); drawn.add(q);
    let reduced = false; try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    return `<div class="woodcut-wrap sky-wrap${fresh && !reduced ? ' sky-in' : ''}">${SK.svg(o.shape, o.key, o.month, o)}${SK.cartouche(o.place)}</div>`;
  };

  // ---- the hook: 61's picture at the head of an event, unless the player has turned the colour prints off
  const IL = UI.ILLUM;
  if (IL && typeof IL.woodcutFor === 'function') {
    const cut = IL.woodcutFor;
    IL.woodcutFor = function (q) {
      if (!UI.set.skies) return cut.apply(this, arguments);
      if (!UI.set.woodcuts || !q || q.type !== 'event') return '';
      try { return SK.forQueue(q); } catch (e) { return cut.apply(this, arguments); }
    };
    const menu = IL.menu;
    IL.menu = function () {
      const h = menu.apply(this, arguments);
      return h + `<label class="row"><input type="checkbox" data-c="setSkies" ${UI.set.skies ? 'checked' : ''}> Colour skies on events (off: ink woodcuts)</label>`;
    };
  } else {
    // without 61 in the build: the print goes at the head of the event box itself
    const modal = UI.eventModal;
    UI.eventModal = function (q) {
      const h = modal.apply(this, arguments);
      try {
        if (!UI.set.skies || !q || q.type !== 'event') return h;
        const at = '<div class="panel mbox">', pic = SK.forQueue(q);
        return h.startsWith(at) ? at + pic + h.slice(at.length) : pic + h;
      } catch (e) { return h; }
    };
  }
  Object.assign(UI.C, {
    setSkies(el) { UI.set.skies = el.checked; UI.saveSettings(); UI.renderModal ? UI.renderModal() : UI.render(); },
  });

  // ---- styles: the 16:5 print (390 x 140 on a phone), the cartouche, and the print's arrival
  SK.CSS = `
  .sky-wrap{position:relative}
  .woodcut-wrap svg.woodcut[data-print=sky]{display:block;width:100%;height:auto;aspect-ratio:16/5;max-height:225px;border-radius:2px;box-shadow:0 2px 0 rgba(0,0,0,.3),0 8px 22px rgba(0,0,0,.35)}
  .sky-cart{position:absolute;top:9px;right:11px;writing-mode:vertical-rl;font-family:Cinzel,'Trajan Pro',Georgia,serif;font-size:12px;line-height:1;letter-spacing:.06em;padding:7px 4px;max-height:calc(100% - 22px);overflow:hidden;white-space:nowrap;text-overflow:ellipsis;
    color:var(--ink,#eee8da);background:color-mix(in srgb,var(--surface,var(--surface-1,#141a2c)) 85%,transparent);border:1px solid ${INK};border-radius:1px;pointer-events:none}
  .sky-in svg{animation:skyIn .7s ease-out both}
  @keyframes skyIn{from{opacity:0;filter:saturate(.4) brightness(1.25)}to{opacity:1;filter:none}}
  @media (max-width:760px){.woodcut-wrap svg.woodcut[data-print=sky]{aspect-ratio:39/14;max-height:30vh}.sky-cart{top:7px;right:8px;font-size:14px;letter-spacing:.03em;padding:5px 3px}}
  @media (prefers-reduced-motion: reduce){.sky-in svg{animation:none}}
  `;
  SK.install = function () {
    if (typeof document === 'undefined' || document.getElementById('sky-css')) return;
    const s = document.createElement('style'); s.id = 'sky-css'; s.textContent = SK.CSS; document.head.appendChild(s);
  };
  SK.install();
})();
