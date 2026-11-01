// Painted miniatures (Road to Ten, Visual art 2; docs/art/style-guide.md, "The people are painted miniatures").
// Every person is drawn as a small manuscript painting instead of the release's paper doll:
//   - iron-gall ink line, heavier on the outer silhouette; a two-tone wash per garment from muted pigments; the shadow
//     side hatched (pattern fills, never gradients);
//   - a gold-leaf or lapis ground inside an arched miniature frame with a vermilion rule, on a vellum margin;
//   - faces in ink: brows, lids, a nose line, a mouth; age in the line (crow's feet, furrows, jowls, grey and white
//     hair), wounds in the line (scars, an eye patch, a hook for a lost hand, a broken nose, a missing ear);
//   - race in the drawing (pointed ears, tusks, dwarf beards and breadth, giant bulk), culture in the dress (hoods,
//     veils, turbans, fur hats, kaftans, drapes, bead collars), rank in the colours (realm cloth, gold trim, ermine);
//   - poses picked by a hash of the person's id and role: standing, a three-quarter turn, a hand on the sword or the
//     staff, seated (rulers on a throne, the old on a bench); children drawn small with a child's proportions,
//     infants swaddled in a cradle.
// Everything here is the UI's: no random draws, no change to the game state, the same SVG for the same person.
// Only fixed-content definitions carry ids, so two portraits on one page can never disagree about a pattern.
// The release's paper dolls stay one click away: the menu setting "Painted miniatures" (UI.set.miniatures).
(function () {
  if (typeof PORTRAIT === 'undefined' || typeof PORTRAIT.svg !== 'function') return;
  const MN = UI.MINI = {};
  if (UI.set.miniatures == null) UI.set.miniatures = true;

  // ---- inks and grounds (style guide palette)
  const INK = '#2b1d10', VEL = '#ece0c4', VELD = '#d6c39b', VER = '#9e2b1b', GOLD = '#b98a2a', GOLDD = '#86621c', LAP = '#2f4a7a', VERD = '#4d7456';
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
  let PREC = 10;   // one decimal; whole units for the smallest pictures, where a unit is a quarter of a pixel
  const R1 = n => Math.round(n * PREC) / PREC;
  // a tagged template that rounds every number to one decimal (keeps the SVG small)
  const d = (s, ...v) => { let o = s[0]; for (let i = 0; i < v.length; i++) o += (typeof v[i] === 'number' ? R1(v[i]) : v[i]) + s[i + 1]; return o; };

  // ---- colour: everything from the state is checked as a hex colour first (never interpolated raw)
  const hexOk = c => {
    if (typeof c !== 'string') return null;
    if (/^#[0-9a-f]{6}$/i.test(c)) return c.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(c)) return '#' + c.slice(1).split('').map(x => x + x).join('').toLowerCase();
    return null;
  };
  const rgb = c => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const toHex = (r, g, b) => '#' + ((1 << 24) + (Math.round(clamp(r, 0, 255)) << 16) + (Math.round(clamp(g, 0, 255)) << 8) + Math.round(clamp(b, 0, 255))).toString(16).slice(1);
  const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return toHex(lerp(x[0], y[0], t), lerp(x[1], y[1], t), lerp(x[2], y[2], t)); };
  function hsl(c) {
    const [r, g, b] = rgb(c).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    let h = 0, s = 0;
    if (mx !== mn) { const k = mx - mn; s = l > .5 ? k / (2 - mx - mn) : k / (mx + mn); h = (mx === r ? (g - b) / k + (g < b ? 6 : 0) : mx === g ? (b - r) / k + 2 : (r - g) / k + 4) / 6; }
    return [h, s, l];
  }
  function fromHsl(h, s, l) {
    if (!s) return toHex(l * 255, l * 255, l * 255);
    const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = t => { t < 0 && (t += 1); t > 1 && (t -= 1); return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    return toHex(f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255);
  }
  // a colour as a pigment: less saturated, never pitch dark or paper white, warmed toward earth. mute 1 for the living,
  // more for the dead (their picture fades toward the page)
  let MUTE = 1;
  const pig = (c, fb = '#8a7a5a') => {
    c = hexOk(c) || fb;
    const [h, s, l] = hsl(c);
    const out = fromHsl(h, clamp(s * (1 - .4 * MUTE), 0, .62), .13 + l * .78);
    return mix(out, MUTE > 1 ? '#a89a80' : '#9c8256', clamp(.14 * MUTE, 0, .6));
  };
  // a wash: body colour, its shadow side and a light edge
  const washOf = b => ({ b, s: mix(b, INK, .3), l: mix(b, VEL, .32) });
  const wash = (c, fb) => washOf(pig(c, fb));
  const fixed = (b, s) => MUTE > 1 ? washOf(pig(b)) : { b, s, l: mix(b, VEL, .32) };

  // ---- a pure hash (FNV-1a) of the person's id and a key: every "choice" in a portrait comes from it
  const hash = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const hf = (p, k) => (hash((p.id || p.given || 'x') + '|' + k) % 10007) / 10007;

  // ---- smooth closed or open paths through points; a point [x, y, 1] is a sharp corner
  function curve(pts, closed) {
    const n = pts.length;
    if (n < 2) return '';
    const corner = i => closed ? !!pts[(i + n) % n][2] : (i <= 0 || i >= n - 1 || !!pts[i][2]);
    const at = i => pts[(i + n) % n];
    const E = i => { const a = at(i), b = at(i + 1); return corner(i + 1) ? b : corner(i) ? a : [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
    let s;
    if (closed) {
      const s0 = corner(0) ? at(0) : E(-1);
      s = d`M${s0[0]} ${s0[1]}`;
      for (let i = 0; i < n; i++) { const p = at(i); if (corner(i)) s += d`L${p[0]} ${p[1]}`; else { const e = E(i); s += d`Q${p[0]} ${p[1]} ${e[0]} ${e[1]}`; } }
      return s + 'Z';
    }
    s = d`M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < n - 1; i++) { const p = pts[i]; if (p[2]) s += d`L${p[0]} ${p[1]}`; else { const e = E(i); s += d`Q${p[0]} ${p[1]} ${e[0]} ${e[1]}`; } }
    return s + d`L${pts[n - 1][0]} ${pts[n - 1][1]}`;
  }
  const mirror = (pts, cx) => pts.map(p => [2 * cx - p[0], p[1], p[2]]);
  // a limb or shaft along a centre line with a width at each point
  function limb(pts, ws) {
    const L = [], R = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
      L.push([pts[i][0] - dy * ws[i], pts[i][1] + dx * ws[i]]); R.push([pts[i][0] + dy * ws[i], pts[i][1] - dx * ws[i]]);
    }
    return curve([...L, ...R.reverse()], true);
  }

  // ---- fixed definitions: each id always has the same content, so repeats on one page are harmless
  const DEFS = {
    gd: '<pattern id="mn-gd" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#b98a2a"/><path d="M0 5L5 0L10 5L5 10Z" fill="none" stroke="#8d6619" stroke-width=".55"/><circle cx="5" cy="5" r=".85" fill="#8d6619"/><circle cx="0" cy="0" r=".7" fill="#d9b25a"/><circle cx="10" cy="10" r=".7" fill="#d9b25a"/><circle cx="10" cy="0" r=".7" fill="#d9b25a"/><circle cx="0" cy="10" r=".7" fill="#d9b25a"/></pattern>',
    lp: '<pattern id="mn-lp" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#2f4a7a"/><path d="M0 6L6 0L12 6L6 12Z" fill="none" stroke="#1e3156" stroke-width=".7"/><circle cx="6" cy="6" r="1" fill="#b98a2a"/><path d="M6 3.4v1.3M6 7.3v1.3M3.4 6h1.3M7.3 6h1.3" stroke="#b98a2a" stroke-width=".55"/></pattern>',
    dd: '<pattern id="mn-dd" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="3" fill="#d6c39b"/><path d="M0 0V3" stroke="#2b1d10" stroke-width=".4" stroke-opacity=".35"/></pattern>',
    ml: '<pattern id="mn-ml" width="2.6" height="2.2" patternUnits="userSpaceOnUse"><path d="M0 1.6a1.3 1.1 0 0 1 2.6 0M-1.3 .5a1.3 1.1 0 0 1 2.6 0M1.3 .5a1.3 1.1 0 0 1 2.6 0" fill="none" stroke="#2b1d10" stroke-width=".42" stroke-opacity=".75"/></pattern>',
    sc: '<pattern id="mn-sc" width="4" height="3.2" patternUnits="userSpaceOnUse"><path d="M0 0q2 4 4 0M-2 1.6q2 4 4 0M2 1.6q2 4 4 0" fill="none" stroke="#2b1d10" stroke-width=".45" stroke-opacity=".75"/></pattern>',
    qt: '<pattern id="mn-qt" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V4M0 0H4" stroke="#2b1d10" stroke-width=".4" stroke-opacity=".5"/></pattern>',
    lm: '<pattern id="mn-lm" width="3" height="4.4" patternUnits="userSpaceOnUse"><path d="M0 0V4.4M0 2.2H3" stroke="#2b1d10" stroke-width=".42" stroke-opacity=".7"/></pattern>',
    er: '<pattern id="mn-er" width="7" height="8" patternUnits="userSpaceOnUse"><rect width="7" height="8" fill="#ece5d3"/><path d="M3.5 1.6l-.9 2.8h1.8z" fill="#2b1d10"/><circle cx="3.5" cy="1.4" r=".5" fill="#2b1d10"/></pattern>',
    fr: '<pattern id="mn-fr" width="3" height="3" patternUnits="userSpaceOnUse"><path d="M.5 .4l.6 1.6M2 1.2l.5 1.5" stroke="#2b1d10" stroke-width=".4" stroke-opacity=".55"/></pattern>',
    s1: '<mask id="mn-s1" maskContentUnits="objectBoundingBox"><path d="M.7 -.2C.6 .3 .62 .7 .72 1.2H1.2V-.2Z" fill="#fff"/></mask>',
    s2: '<mask id="mn-s2" maskContentUnits="objectBoundingBox"><path d="M.64 -.2C.42 .25 .45 .75 .72 1.2H1.2V-.2Z" fill="#fff"/></mask>',
    cF: '<clipPath id="mn-cF"><path d="M10 330V100A90 90 0 0 1 190 100V330Z"/></clipPath>',
    cB: '<clipPath id="mn-cB"><path d="M10 190V54A44 44 0 0 1 54 10H146A44 44 0 0 1 190 54V190Z"/></clipPath>',
    // the outer silhouette: the figure's own shape, grown and laid in ink behind it
    sl: '<filter id="mn-sl" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency=".07" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G" result="w"/><feMorphology in="w" operator="dilate" radius="1" result="d"/><feFlood flood-color="#2b1d10"/><feComposite in2="d" operator="in"/><feMerge><feMergeNode/><feMergeNode in="w"/></feMerge></filter>',
    sm: '<filter id="mn-sm" x="-8%" y="-8%" width="116%" height="116%"><feMorphology in="SourceAlpha" operator="dilate" radius="2.2" result="d"/><feFlood flood-color="#2b1d10"/><feComposite in2="d" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>',
  };
  const PANEL = { F: 'M10 330V100A90 90 0 0 1 190 100V330Z', B: 'M10 190V54A44 44 0 0 1 54 10H146A44 44 0 0 1 190 54V190Z' };
  const PANEL_IN = { F: 'M12.8 327.2V100A87.2 87.2 0 0 1 187.2 100V327.2Z', B: 'M12.8 187.2V54A41.2 41.2 0 0 1 54 12.8H146A41.2 41.2 0 0 1 187.2 54V187.2Z' };
  const PANEL_OUT = { F: 'M6.5 333.5V100A93.5 93.5 0 0 1 193.5 100V333.5Z', B: 'M6.5 193.5V54A47.5 47.5 0 0 1 54 6.5H146A47.5 47.5 0 0 1 193.5 54V193.5Z' };

  // ---- one drawing's context: line weight, detail level, the definitions it used
  function ctx(size, bust) {
    const G = { size, bust, fine: size >= 60, k: size < 60 ? 1.7 : size < 120 ? 1.15 : 1, used: {}, tones: {} };
    G.use = id => (G.used[id] = 1, id);
    // the shadow side: a darker wash, hatched at 45 degrees when the picture is big enough to show it
    G.tone = c => {
      if (!G.fine) return c;
      const id = 'mn-t' + c.slice(1);
      G.tones[id] = `<pattern id="${id}" width="2.5" height="2.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2.5" height="2.5" fill="${c}"/><path d="M0 0V2.5" stroke="#2b1d10" stroke-width=".5" stroke-opacity=".42"/></pattern>`;
      return `url(#${id})`;
    };
    G.defs = () => Object.keys(G.used).map(k => DEFS[k]).join('') + Object.values(G.tones).join('');
    G.lw = w => R1(w * G.k);
    return G;
  }
  // a painted shape: wash and ink line, then the shadow side (darker wash, hatched) masked to the right
  function paint(G, path, w, o = {}) {
    const lw = G.lw(o.lw || 1), st = o.line === false ? '' : ` stroke="${INK}" stroke-width="${lw}" stroke-linejoin="round"`;
    let s = '';
    if (o.pat && G.fine) s += `<path d="${path}" fill="${w.b}"/><path d="${path}" fill="url(#mn-${G.use(o.pat)})"${st}/>`;
    else s += `<path d="${path}" fill="${w.b}"${st}/>`;
    if (o.shade !== false) s += `<path d="${path}" fill="${G.tone(w.s)}"${o.pat ? ' fill-opacity=".72"' : ''}${st} mask="url(#mn-${G.use(o.m || 's1')})"/>`;
    return s;
  }
  const line = (G, path, w = .6, o = {}) => `<path d="${path}" fill="none" stroke="${o.c || INK}" stroke-width="${G.lw(w)}"${o.op != null ? ` stroke-opacity="${R1(o.op * 100) / 100}"` : ''} stroke-linecap="round" stroke-linejoin="round"/>`;
  const dot = (x, y, r, c) => d`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;

  // ---- culture: cut of dress, headwear (men / women), collar, pattern, and a dye for commoners' cloth
  const CULT = {
    'CUL-01': { hat: ['cap', 'veil'], cut: 'tunic', band: 1 },                                  // Solenfolk
    'CUL-02': { hat: ['hood', 'kerchief'], cut: 'tunic' },                                       // Northfolk
    'CUL-03': { hat: ['cone', 'cone'], cut: 'kaftan', collar: 'fur', dye: '#6a4a2a' },           // Wind Riders
    'CUL-04': { hat: ['turban', 'veil'], cut: 'robe', sash: 1, dye: '#3d4f7a' },                 // Qadiri
    'CUL-05': { hat: ['wrap', 'veil'], cut: 'robe', dye: '#34416a' },                            // Sandfolk
    'CUL-06': { hat: ['fillet', 'fillet'], cut: 'tunic', collar: 'beads', dye: '#e4dcc4' },      // Tamari
    'CUL-07': { hat: ['wrap', 'kerchief'], cut: 'robe', sash: 1, dye: '#8a6a3a' },               // Sabrans
    'CUL-08': { hat: ['wrap', 'wrap'], cut: 'drape', collar: 'beads', pat: 'zig', dye: '#a8602a' }, // Zanari
    'CUL-09': { hat: [null, 'wrap'], cut: 'drape', collar: 'beads', pat: 'stripe', dye: '#8e3a2a' }, // Abari
    'CUL-10': { hat: ['turban', 'kerchief'], cut: 'drape', sash: 1, dye: '#b0782a' },            // Keshi
    'CUL-11': { hat: ['furhat', 'kerchief'], cut: 'tunic', collar: 'embroidered' },              // Eastfolk
    'CUL-12': { hat: ['furhat', 'furhat'], cut: 'kaftan', sash: 1, dye: '#7a2a24' },             // Skyfolk
    'CUL-13': { hat: ['turban', 'veil'], cut: 'drape', dye: '#c08a2a' },                         // Ranpuri
    'CUL-14': { hat: ['kerchief', 'kerchief'], cut: 'tunic', collar: 'beads' },                  // Amberfolk
    'CUL-15': { hat: ['kerchief', 'kerchief'], cut: 'tunic', sash: 1, ring: 1 },                 // Corsairs
    'CUL-16': { hat: ['feathers', 'feathers'], cut: 'drape', dye: '#5a6a3a' },                   // Leaf People
    'CUL-17': { hat: ['feathers', 'fillet'], cut: 'drape', collar: 'beads' },                    // Cloudfolk
    'CUL-18': { hat: ['hood', 'kerchief'], cut: 'tunic' },                                       // Marchfolk
    'CUL-19': { hat: ['leaves', 'leaves'], cut: 'robe', dye: '#4d6a4a' },                        // Sylvari
    'CUL-20': { hat: ['fillet', 'fillet'], cut: 'robe', dye: '#3e6a6a' },                        // Grovers of the Coast
    'CUL-21': { hat: ['hood', 'kerchief'], cut: 'tunic', apron: 1 },                             // Holdfolk
    'CUL-22': { hat: [null, null], cut: 'tunic', collar: 'bones' },                              // Horde clans
    'CUL-23': { hat: [null, null], cut: 'tunic', collar: 'bones', fur: 1 },                      // Tusk clans
    'CUL-24': { hat: [null, 'kerchief'], cut: 'tunic', collar: 'fur', torc: 1 },                 // Hall-giants
  };
  MN.CULT = CULT;

  // ---- what the picture needs to know about a person (read only)
  function look(p) {
    const ap = p.app || {}, race = GD.RACES[p.race] ? p.race : 'human', R2 = GD.RACES[race];
    const age = Math.max(0, +A.age(p) || 0), F = p.sex === 'F';
    const grown = Math.max(1, R2.grown || R2.adult || 16), adultAge = R2.adult || 16;
    const x = clamp(age / grown, 0, 1);
    const baby = age < Math.max(1, grown * .06), kid = !baby && x < .5, small = baby || kid;
    const armed = age >= adultAge * .8;
    const oldF = clamp((age - R2.primeEnd) / Math.max(1, R2.old - R2.primeEnd), 0, 1), veryOld = age > R2.old;
    const mid = (grown + R2.primeEnd) / 2, wr = small ? 0 : clamp((age - mid) / Math.max(1, R2.old - mid), 0, 1.3);
    const L = { p, ap, race, R2, age, F, x, baby, kid, small, armed, oldF, veryOld, wr };
    L.dead = !p.alive;
    L.grow = .3 + .7 * (1 - (1 - x) * (1 - x));
    L.meanH = (F ? R2.height[0] : R2.height[1]) || 170;
    L.cult = CULT[p.cult] || {};
    let out = null, arms = null;
    try { out = PORTRAIT.outfit(p); } catch (e) {}
    try { arms = PORTRAIT.arms(p); } catch (e) {}
    out = out || { kind: 'peasant', main: '#6b5a3e', trim: '#4a3e2e' };
    arms = arms || { f: '#7a6a50', c: '#d8c48a', ch: 'none', h: null };
    L.out = out; L.kind = out.kind;
    L.arms = { f: pig(arms.f, '#7a6a50'), c: pig(arms.c, '#d8c48a'), ch: arms.ch, h: arms.h };
    L.house = !!arms.h;
    // colour of the main garment: the release's choice, as a pigment; commoners take on their people's dye
    let main = hexOk(out.main) || '#6b5a3e';
    if (L.cult.dye && ['peasant', 'artisan', 'gentry', 'merchant'].includes(out.kind) && hf(p, 'dye') < .7) main = mix(main, L.cult.dye, .65);
    L.cloth = wash(main);
    L.trim = pig(out.trim, '#c0a060');
    // skin, hair, eyes
    const skin = hexOk(ap.skin) || '#d9a77f';
    const sk = mix(pig(skin), skin, .45);
    L.skin = { b: sk, s: mix(sk, '#7a4a30', .3), l: mix(sk, VEL, .3), line: mix(sk, INK, .62) };
    let hair = hexOk(typeof ap.hair === 'string' ? ap.hair : GD.HAIR && GD.HAIR[ap.hair]) || '#3b2414';
    const grey = Math.min(1, oldF * .85 + (veryOld ? .3 : 0));
    hair = pig(hair); if (grey > 0) hair = mix(hair, '#dcd6c8', grey);
    L.hair = washOf(hair); L.hair.s = mix(hair, INK, grey > .6 ? .25 : .38);
    L.grey = grey;
    L.eye = mix(pig(hexOk(GD.EYES && GD.EYES[ap.eye]) || '#4b3621'), INK, .35);
    // wounds that show
    const ws = (p.wounds || []).filter(Boolean), wk = new Set(ws.map(w => w.k)), marks = new Set(ws.map(w => (GD.WOUNDS[w.k] || {}).mark).filter(Boolean));
    const quirks = p.quirks || [];
    L.lostEye = wk.has('lost_eye'); L.lostHand = wk.has('lost_hand'); L.nose = wk.has('broken_nose'); L.ear = wk.has('ear');
    L.scar = marks.has('faceScar') || quirks.includes('scarred'); L.burn = marks.has('burn'); L.brand = marks.has('brand');
    L.limp = wk.has('limp') || wk.has('bad_knee'); L.fingers = wk.has('lost_fingers'); L.armScar = wk.has('scar_arm');
    L.freckles = !!ap.freckles || quirks.includes('freckled'); L.birthmark = quirks.includes('birthmark');
    // gear
    const g = Object.assign({ weapon: 'fists', armor: 'none' }, p.gear || {}), GG = k => k && GD.GEAR[k] || null;
    L.W = (armed && GG(g.weapon)) || GD.GEAR.fists || { kind: 'fists' };
    const Ar = armed ? GG(g.armor) : null; L.armor = Ar ? (Ar.look || g.armor || 'none') : 'none';
    L.helm = armed ? GG(g.helm) : null; L.shield = armed ? GG(g.shield) : null; L.ranged = armed ? GG(g.ranged) : null; L.cloak = armed ? GG(g.cloak) : null;
    if (L.shield && L.shield.kind) L.shield = null;            // parrying daggers and off-hand blades are not shields
    const k = L.W.kind || 'fists';
    L.blade = ['sword', 'axe', 'mace', 'hammer', 'club', 'flail'].includes(k);
    L.pole = ['spear', 'pike', 'lance', 'polearm', 'staff'].includes(k);
    L.rank = p.mil ? p.mil.rank || 0 : 0;
    // the ground: gold leaf for rank and the church, lapis for everyone else, the bare page for the dead
    L.ground = L.dead ? 'dd' : (p.ruler || ['royal', 'noble', 'priest', 'officer'].includes(out.kind)) ? 'gd' : 'lp';
    // a long garment: robes, the clergy, women (gowns), long-robed peoples
    L.long = L.armor === 'robes' || out.kind === 'priest' || (F && !['soldier', 'officer'].includes(out.kind)) || (['robe', 'kaftan'].includes(L.cult.cut) && !['soldier', 'officer'].includes(out.kind)) || (!!p.ruler && hf(p, 'gown') < .5);
    // the pose, from the id and the role
    const h1 = hf(p, 'pose'), h2 = hf(p, 'turn');
    const shieldArm = L.shield && !L.W.twoHand;
    let pose;
    if (baby) pose = 'swaddled';
    else if (kid) pose = h1 < .5 ? 'stand' : 'tq';
    else if (p.ruler) pose = h1 < .7 ? 'seated' : L.blade && !shieldArm ? 'hilt' : 'stand';
    else if (oldF > .6 || veryOld) pose = h1 < .5 ? 'seated' : L.blade && !shieldArm ? 'hilt' : 'staff';
    else if (L.pole) pose = 'staff';
    else if (L.blade && !shieldArm && h1 < .6) pose = 'hilt';
    else pose = h1 < .5 ? 'stand' : 'tq';
    L.pose = pose;
    L.t = pose === 'tq' ? (h2 < .5 ? -.36 : .36) : pose === 'stand' || pose === 'staff' ? (h2 - .5) * .22 : 0;
    // what is on the head
    const fullHelm = L.helm && ['greathelm', 'bascinet', 'dwarfhelm'].includes(L.helm.look);
    L.atFeet = fullHelm && L.helm.look;                     // a closed helm is set down at the feet, so the face shows
    let hat = null;
    if (p.ruler || out.crown) hat = 'crown';
    else if (out.circlet) hat = 'circlet';
    else if (L.helm && !fullHelm) hat = 'helm:' + L.helm.look;
    else if (fullHelm) hat = 'helm:coif';
    else if (baby) hat = 'coif';
    else if (out.kind === 'priest') hat = hf(p, 'cowl') < .5 ? 'cowl' : 'tonsure';
    else if (!kid || hf(p, 'kidhat') < .25) {
      const c = L.cult.hat ? L.cult.hat[F ? 1 : 0] : null, hh = hf(p, 'hat');
      const odds = ['noble', 'royal'].includes(out.kind) ? .3 : F && c === 'veil' ? .75 : .5;
      if (c && hh < odds) hat = c;
      else if (F && L.wr > .6 && hh < .8) hat = 'veil';     // older women veiled, as they are in the margins of every book
      else if (!F && ['merchant', 'gentry'].includes(out.kind) && hh < .7) hat = 'cap';
    }
    L.hat = hat;
    L.recede = !F && !small && (L.wr > .55 && hf(p, 'bald') < .5);
    L.bald = !F && !small && (ap.hstyle === 'bald' || (L.wr > .95 && hf(p, 'bald') < .3));
    return L;
  }
  MN.look = look;

  // ---- the head: ears, face, features in ink, age and scars, beard, hair, what is worn on it.
  //      Returns { back, front }: long hair behind the body, and the head itself.
  function head(G, L, o) {
    const { hx, hy, a, b } = o, t = o.t || 0, fx = hx + t * a * .5, sk = L.skin, ap = L.ap, race = L.race, small = L.small;
    let back = '', s = '';
    const jw0 = { dwarf: .92, orc: .98, giant: .95, elf: .62, halfelf: .68, halforc: .88 }[race] || (L.F ? .7 : .8);
    const jw = small ? .86 : jw0 + .08 * Math.min(1, L.wr) + [0, .04, -.04, .07][ap.face || 0];
    const aL = a * (1 + .05 * t), aR = a * (1 - .05 * t), chin = L.F || small ? .16 : .24, sag = .05 * Math.min(1, L.wr);
    const edge = sd => { const as = sd < 0 ? aL : aR; return [
      [hx + t * a * .12, hy - b], [hx + sd * as * .8, hy - b * .84], [hx + sd * as, hy - b * .3], [hx + sd * as * .97, hy + b * .14],
      [hx + sd * as * (jw + .1), hy + b * .52], [hx + sd * as * jw * .78 + t * a * .14, hy + b * (.84 + sag)], [fx + t * a * .1 + sd * a * chin, hy + b * (1 + sag)],
    ]; };
    const faceD = curve([...edge(-1), ...edge(1).reverse()], true);
    const eyeY = hy + (small ? .1 : -.02) * b, ex = a * .42;
    const ew = a * (L.baby ? .2 : small ? .26 : .21) * (race === 'elf' ? 1.06 : race === 'orc' || race === 'giant' ? .86 : 1);
    const noseY = hy + b * (L.baby ? .3 : small ? .3 : race === 'dwarf' ? .44 : race === 'orc' ? .32 : .38) * (1 + (ap.nose || 0) * .03);
    const my = hy + b * (small ? .58 : .62) + (race === 'dwarf' ? b * .04 : 0);
    const happy = L.p.happy != null ? clamp((L.p.happy - 50) / 50, -1, 1) : 0;
    const mw = a * (small ? .22 : .3) * (1 + (ap.mouth || 0) * .1);
    const hs = ap.hstyle || 'short';
    const hat = L.hat || '', helm = hat.startsWith('helm:') ? hat.slice(5) : null;
    const covered = helm && helm !== 'turban' || ['hood', 'cowl', 'veil', 'coif'].includes(hat);   // hides the hair at the sides
    const lw = G.lw(.55), fine = G.fine;

    // long hair behind the shoulders
    const longHair = !L.bald && !small && !covered && ['long', 'wild', 'locks', 'curly'].includes(hs) || (L.F && !covered && !small && hs !== 'shaved' && hs !== 'cropped' && hs !== 'braided' && hs !== 'topknot');
    if (longHair) {
      const down = hy + b * (hs === 'long' || L.F ? 2.25 : 1.7), wd = a * (hs === 'wild' || hs === 'curly' ? 1.45 : 1.25);
      const pts = [[hx - aL * 1.02, hy - b * .5], [hx - wd, hy + b * .5], [hx - wd * 1.04, down - b * .2], [hx - wd * .6, down, 1], [hx - wd * .2, down - b * .12], [hx + wd * .2, down - b * .05], [hx + wd * .6, down, 1], [hx + wd * 1.04, down - b * .2], [hx + wd, hy + b * .5], [hx + aR * 1.02, hy - b * .5], [hx, hy - b * 1.05]];
      back += paint(G, curve(pts, true), L.hair, { lw: .9 });
      if (fine) for (const k of [-.7, -.35, .35, .7]) back += line(G, d`M${hx + k * wd * .9} ${hy + b * .4}Q${hx + k * wd * 1.1} ${hy + b * 1.3} ${hx + k * wd * .85} ${down - b * .15}`, .4, { op: .55 });
    }
    if (hs === 'tied' || hs === 'ponytail') if (!covered && !L.bald && !small) {
      const sd = hf(L.p, 'tail') < .5 ? -1 : 1, x0 = hx + sd * a * .7, len = b * (hs === 'ponytail' ? 1.9 : 1.3);
      back += paint(G, limb([[x0, hy - b * .5], [x0 + sd * a * .55, hy + b * .3], [x0 + sd * a * .45, hy - b * .5 + len]], [a * .2, a * .22, a * .08]), L.hair, { lw: .8 });
    }

    // ears (behind the face line)
    const earY = eyeY, earTop = eyeY - b * .06, earBot = noseY + b * .04;
    for (const sd of [-1, 1]) {
      if (sd === 1 && L.ear) { s += line(G, d`M${hx + aR * .96} ${earTop + b * .16}l${a * .1} ${b * .05}l${-a * .04} ${b * .08}l${a * .06} ${b * .06}`, .8, { c: sk.line }); continue; }
      const far = t * sd > .2, sx = hx + sd * (sd < 0 ? aL : aR) * .95, w = a * (far ? .14 : .22) * (race === 'orc' || race === 'giant' ? 1.25 : 1);
      if (race === 'elf' || race === 'halfelf' || race === 'orc' || race === 'halforc') {
        const tip = race === 'elf' ? [a * .62, b * .62] : race === 'halfelf' ? [a * .36, b * .32] : [a * .42, b * .22];
        const pts = [[sx, earBot], [sx + sd * w * 1.05, earBot - b * .1], [sx + sd * tip[0] * (far ? .6 : 1), earTop - tip[1], 1], [sx + sd * w * .2, earTop + b * .02], [sx - sd * a * .04, earTop + b * .08]];
        s += `<path d="${curve(pts, true)}" fill="${sk.b}" stroke="${INK}" stroke-width="${G.lw(.8)}"/>`;
        if (fine) s += line(G, d`M${sx + sd * w * .2} ${earBot - b * .1}Q${sx + sd * w * .7} ${earY} ${sx + sd * tip[0] * .55} ${earTop - tip[1] * .4}`, .4, { c: sk.line });
      } else {
        s += `<path d="${d`M${sx} ${earTop}C${sx + sd * w * 1.3} ${earTop - b * .06} ${sx + sd * w * 1.3} ${earBot + b * .02} ${sx - sd * a * .02} ${earBot}`}" fill="${sk.b}" stroke="${INK}" stroke-width="${G.lw(.8)}"/>`;
        if (fine) s += line(G, d`M${sx + sd * w * .3} ${earTop + b * .07}Q${sx + sd * w * .8} ${earY + b * .1} ${sx + sd * w * .25} ${earBot - b * .06}`, .4, { c: sk.line });
        if (sd < 0 && (L.cult.ring || ap.jewel === 'earring' || ap.jewel === 'earrings') && !covered) s += `<circle cx="${R1(sx - a * .05)}" cy="${R1(earBot + b * .07)}" r="${R1(a * .07)}" fill="none" stroke="${GOLD}" stroke-width="${G.lw(.8)}"/>`;
      }
    }

    // the face: skin wash, shadow side, the line
    s += paint(G, faceD, sk, { lw: 1, m: 's2' });
    // cheeks
    const blush = small ? .2 : L.F ? .15 : .1;
    if (!L.dead) for (const sd of [-1, 1]) s += `<circle cx="${R1(fx + sd * a * .5)}" cy="${R1(hy + b * .32)}" r="${R1(a * .27)}" fill="${VER}" fill-opacity="${blush}"/>`;
    if (L.freckles && fine) for (let i = 0; i < 9; i++) s += dot(fx + (i % 2 ? 1 : -1) * a * (.25 + (i * 7 % 5) * .08), hy + b * (.12 + (i % 3) * .08), a * .025, sk.line);
    // orc and giant brow ridge
    if (['orc', 'giant', 'halforc'].includes(race)) s += `<path d="${d`M${fx - a * .82} ${eyeY - ew * 1.2}Q${fx} ${eyeY - ew * 2.4} ${fx + a * .82} ${eyeY - ew * 1.2}Q${fx} ${eyeY - ew * 1.5} ${fx - a * .82} ${eyeY - ew * 1.2}Z`}" fill="${sk.s}" fill-opacity=".8"/>`;

    // eyes, lids and brows
    const elfish = race === 'elf' || race === 'halfelf';
    for (const sd of [-1, 1]) {
      const far = t * sd > 0, sc = 1 - Math.abs(t) * (far ? .4 : -.08);
      const x = fx + sd * ex * (far ? 1 - Math.abs(t) * .45 : 1 + Math.abs(t) * .12), w = ew * sc;
      const lift = elfish ? -w * .28 : race === 'orc' ? w * .1 : 0;
      const ix = x - sd * w, ox = x + sd * w, oy = eyeY + lift;
      const browT = (ap.brow || 0) * w * .25;
      const bw = race === 'orc' || race === 'dwarf' || race === 'giant' ? 1.5 : L.F ? .8 : 1.05;
      const browC = mix(L.hair.b, INK, L.grey > .6 ? .3 : .5);
      if (!(L.lostEye && sd === 1)) {
        if (L.baby && hf(L.p, 'sleep') < .5) {
          s += line(G, d`M${ix} ${eyeY}Q${x} ${eyeY + w * .5} ${ox} ${oy}`, .7);
        } else {
          s += `<path d="${d`M${ix} ${eyeY}Q${x} ${eyeY - w * .66} ${ox} ${oy}Q${x} ${eyeY + w * .48} ${ix} ${eyeY}Z`}" fill="#f1e8d2"/>`;
          s += dot(x + t * w * .3, eyeY - w * .02, w * (small ? .36 : .3), L.eye) + dot(x + t * w * .3, eyeY - w * .02, w * .14, INK);
          s += line(G, d`M${ix - sd * w * .1} ${eyeY + w * .04}Q${x} ${eyeY - w * .7} ${ox + sd * w * .18} ${oy + w * .06}`, small ? .7 : .8);
          if (fine) s += line(G, d`M${ix + sd * w * .2} ${eyeY + w * .2}Q${x} ${eyeY + w * .5} ${ox} ${oy + w * .08}`, .4, { op: .6 });
          if (L.wr > .7 && fine) s += line(G, d`M${ix + sd * w * .1} ${eyeY - w * .5}Q${x} ${eyeY - w * 1.0} ${ox} ${oy - w * .32}`, .38, { op: .55 });
        }
        // crow's feet and the bags under the eyes
        if (L.wr > .25) {
          const op = clamp(L.wr, .3, 1);
          s += line(G, d`M${ox + sd * w * .25} ${oy - w * .05}l${sd * w * .55} ${-w * .3}M${ox + sd * w * .3} ${oy + w * .12}l${sd * w * .6} ${w * .02}` + (L.wr > .6 ? d`M${ox + sd * w * .2} ${oy + w * .3}l${sd * w * .5} ${w * .3}` : ''), .38, { op, c: sk.line });
          if (L.wr > .45) s += line(G, d`M${ix + sd * w * .3} ${eyeY + w * .62}Q${x} ${eyeY + w * .95} ${ox - sd * w * .1} ${oy + w * .5}`, .35, { op: op * .8, c: sk.line });
        }
      }
      if (!(L.baby)) s += `<path d="${d`M${ix - sd * w * .2} ${eyeY - w * 1.0 + (sd < 0 ? browT : browT)}Q${x} ${eyeY - w * 1.75 + (elfish ? -w * .1 : 0)} ${ox + sd * w * .35} ${oy - w * (elfish ? 1.25 : 1.0)}`}" fill="none" stroke="${browC}" stroke-width="${G.lw(bw)}" stroke-linecap="round"/>`;
      if (L.veryOld && fine) s += line(G, d`M${x - sd * w * .2} ${eyeY - w * 1.45}l${sd * w * .3} ${-w * .25}M${x + sd * w * .4} ${eyeY - w * 1.35}l${sd * w * .35} ${-w * .2}`, .4, { c: browC });
    }
    // forehead furrows
    if (L.wr > .4 && !['helm:helm', 'helm:kettle', 'helm:spangen', 'helm:horned', 'helm:elfhelm'].includes(hat)) {
      const n = L.wr > .9 ? 3 : 2;
      for (let i = 0; i < n; i++) { const y = eyeY - ew * (2.3 + i * .55); s += line(G, d`M${fx - a * .42} ${y + ew * .1}Q${fx - a * .2} ${y - ew * .2} ${fx} ${y}T${fx + a * .42} ${y + ew * .05}`, .38, { op: clamp(L.wr, .35, .85), c: sk.line }); }
    }
    // nose
    const tipX = fx + a * (.08 + t * .3), nl = noseY;
    if (small) s += line(G, d`M${tipX - a * .1} ${nl}Q${tipX} ${nl + a * .08} ${tipX + a * .1} ${nl}`, .55, { c: sk.line });
    else {
      const bx = fx + a * (t < -.15 ? -.06 : .07), by = eyeY + ew * .3;
      const kink = L.nose ? d`L${(bx + tipX) / 2 + a * .1} ${(by + nl) / 2}` : '';
      const bridge = race === 'orc' ? d`M${bx} ${by + ew * .8}${kink}L${tipX} ${nl - a * .05}` : d`M${bx} ${by}${kink}Q${tipX + a * (race === 'dwarf' ? .12 : .06)} ${(by + nl) * .5 + a * .1} ${tipX + a * .04} ${nl - a * .04}`;
      s += line(G, bridge, .65);
      const nw = a * (race === 'orc' ? .26 : race === 'dwarf' || race === 'giant' ? .22 : race === 'elf' ? .13 : .17);
      s += line(G, d`M${tipX - nw} ${nl - a * .03}Q${tipX - nw * .3} ${nl + a * .1} ${tipX + nw * .7} ${nl - a * .01}`, .62);
      if (race === 'dwarf') s += `<circle cx="${R1(tipX)}" cy="${R1(nl - a * .05)}" r="${R1(a * .14)}" fill="${sk.s}" fill-opacity=".45"/>`;
      if (race === 'orc' || race === 'halforc') s += dot(tipX - nw * .5, nl - a * .01, a * .04, INK) + dot(tipX + nw * .5, nl - a * .01, a * .04, INK);
      // nose to mouth, the folds of age
      if (L.wr > .3) for (const sd of [-1, 1]) s += line(G, d`M${tipX + sd * nw * 1.1} ${nl - a * .02}Q${fx + sd * (mw + a * .16)} ${(nl + my) / 2} ${fx + sd * (mw + a * .08)} ${my + a * .08}`, .4, { op: clamp(L.wr, .3, .9), c: sk.line });
    }
    // mouth
    const curl = mw * (.1 + happy * .16);
    s += `<path d="${d`M${fx - mw * .72} ${my + mw * .06}Q${fx} ${my + mw * .55} ${fx + mw * .72} ${my + mw * .06}Z`}" fill="${mix(VER, sk.b, .35)}" fill-opacity="${L.F || small ? .7 : .45}"/>`;
    s += line(G, d`M${fx - mw} ${my - curl * .5}Q${fx - mw * .4} ${my + curl * .6} ${fx} ${my + mw * .04}Q${fx + mw * .4} ${my + curl * .6} ${fx + mw} ${my - curl * .5}`, small ? .6 : .72);
    if (fine && !small) s += line(G, d`M${fx - mw * .4} ${my + mw * .62}Q${fx} ${my + mw * .78} ${fx + mw * .4} ${my + mw * .62}`, .4, { op: .55, c: sk.line });
    if (!L.F && !small && fine && race !== 'elf') s += line(G, d`M${fx - a * .14} ${hy + b * .86}Q${fx} ${hy + b * .9} ${fx + a * .14} ${hy + b * .86}`, .35, { op: .5, c: sk.line });
    // jowls, a sunken cheek, a wattle
    if (L.wr > .8) for (const sd of [-1, 1]) s += line(G, d`M${fx + sd * mw * 1.05} ${my + a * .16}Q${fx + sd * mw * 1.4} ${my + a * .38} ${hx + sd * a * jw * .86} ${hy + b * .82}`, .4, { op: .8, c: sk.line });
    if (L.veryOld) for (const sd of [-1, 1]) s += line(G, d`M${hx + sd * a * .66} ${hy + b * .08}Q${hx + sd * a * .5} ${hy + b * .28} ${hx + sd * a * .58} ${hy + b * .46}`, .4, { op: .7, c: sk.line });
    // tusks
    if (race === 'orc' || race === 'halforc') {
      const tl = race === 'orc' ? a * .34 : a * .18;
      for (const sd of [-1, 1]) s += `<path d="${d`M${fx + sd * mw * .62} ${my + a * .06}Q${fx + sd * mw * .9} ${my - tl * .5} ${fx + sd * mw * .78} ${my - tl}Q${fx + sd * mw * .5} ${my - tl * .3} ${fx + sd * mw * .4} ${my + a * .04}Z`}" fill="#efe4c8" stroke="${INK}" stroke-width="${G.lw(.55)}"/>`;
    }
    // scars, burns and brands
    if (L.scar) {
      const p0 = [hx - a * .55, eyeY - ew * 2.4], p1 = [hx - a * .18, my + a * .28];
      s += `<path d="${d`M${p0[0]} ${p0[1]}Q${hx - a * .5} ${(p0[1] + p1[1]) / 2} ${p1[0]} ${p1[1]}`}" fill="none" stroke="${mix(VER, sk.b, .25)}" stroke-width="${G.lw(1.1)}" stroke-linecap="round"/>`;
      if (fine) for (let i = 1; i < 5; i++) { const q = i / 5, x = lerp(p0[0], p1[0], q) - a * .08 * Math.sin(q * Math.PI), y = lerp(p0[1], p1[1], q); s += line(G, d`M${x - a * .07} ${y - a * .02}l${a * .14} ${a * .04}`, .4); }
    }
    if (L.burn) {
      s += `<path d="${d`M${hx + a * .2} ${eyeY + ew * 1.2}q${a * .45} ${-a * .2} ${a * .62} ${a * .3}q${-a * .1} ${a * .45} ${-a * .52} ${a * .32}z`}" fill="#9a4a32" fill-opacity=".32"/>`;
      if (fine) for (let i = 0; i < 7; i++) s += dot(hx + a * (.3 + (i * 3 % 5) * .1), eyeY + ew * 1.4 + a * (i % 3) * .12, a * .025, INK);
    }
    if (L.brand) s += `<path d="${d`M${hx + a * .48} ${my - a * .3}a${a * .1} ${a * .1} 0 1 0 .1 0M${hx + a * .48} ${my - a * .44}v${a * .3}`}" fill="none" stroke="#6e2416" stroke-width="${G.lw(.8)}"/>`;
    if (L.birthmark) s += `<ellipse cx="${R1(hx + a * .45)}" cy="${R1(hy - b * .2)}" rx="${R1(a * .12)}" ry="${R1(a * .08)}" fill="#7a2a30" fill-opacity=".35"/>`;
    // war paint (the release's appearance field)
    if (ap.paint === 'warpaint') s += `<path d="${d`M${hx - a * .85} ${eyeY - ew * .4}L${hx + a * .85} ${eyeY - ew * .4}L${hx + a * .8} ${eyeY + ew * 1.1}L${hx - a * .8} ${eyeY + ew * 1.1}Z`}" fill="${L.arms.f}" fill-opacity=".45"/>`;
    else if (ap.paint && ap.paint !== 'none' && fine) s += line(G, d`M${hx - a * .6} ${hy + b * .14}l${a * .12} ${b * .2}m${a * .12} ${-b * .2}l${a * .12} ${b * .2}M${hx + a * .6} ${hy + b * .14}l${-a * .12} ${b * .2}m${-a * .12} ${-b * .2}l${-a * .12} ${b * .2}`, .6, { c: '#23324a', op: .8 });

    // beard and moustache (grown men)
    const beard = L.F || small ? 'none' : L.age < L.R2.grown * .85 && !['stubble', 'mustache'].includes(ap.beard) ? (ap.beard && ap.beard !== 'none' ? 'stubble' : 'none') : (ap.beard || 'none');
    if (beard !== 'none') {
      const hw = L.hair, extra = race === 'dwarf' ? b * .75 : race === 'giant' ? b * .2 : 0;
      const blen = ({ stubble: 0, short: .12, full: .32, long: .78, braided: .9, forked: .72, goatee: .2, muttonchops: 0, mustache: 0 }[beard] || .2) * b + (beard === 'mustache' || beard === 'muttonchops' || beard === 'stubble' ? 0 : extra);
      const by = hy + b + blen;
      const inner = [[hx + aR * .84, hy + b * .1], [fx + mw * 1.25, my - a * .04], [fx + mw * .55, my + a * .2], [fx - mw * .55, my + a * .2], [fx - mw * 1.25, my - a * .04], [hx - aL * .84, hy + b * .1]];
      if (beard === 'stubble') {
        s += `<path d="${curve([[hx - aL * .97, hy], [hx - aL * (jw + .08), hy + b * .55], [fx, hy + b * 1.02], [hx + aR * (jw + .08), hy + b * .55], [hx + aR * .97, hy], ...inner], true)}" fill="${hw.s}" fill-opacity=".22"/>`;
      } else if (beard === 'goatee') {
        s += paint(G, curve([[fx - mw * .7, my + a * .14], [fx - mw * .5, by - a * .1], [fx, by], [fx + mw * .5, by - a * .1], [fx + mw * .7, my + a * .14]], true), hw, { lw: .7, m: 's2' });
      } else if (beard === 'muttonchops') {
        for (const sd of [-1, 1]) s += paint(G, curve([[hx + sd * a * .97, hy - b * .1], [hx + sd * a * (jw + .1), hy + b * .6], [fx + sd * mw * 1.2, my + a * .05], [hx + sd * a * .7, hy + b * .1]], true), hw, { lw: .7, m: 's2' });
      } else if (beard !== 'mustache') {
        const bot = beard === 'forked' ? [[fx - a * .26, by - a * .1], [fx - a * .1, by, 1], [fx, by - blen * .3, 1], [fx + a * .1, by, 1], [fx + a * .26, by - a * .1]] : [[fx - a * .3, by - a * .12], [fx, by], [fx + a * .3, by - a * .12]];
        const outer = [[hx - aL * .98, hy - b * .08], [hx - aL * (jw + .14), hy + b * .58], [fx - a * .62, hy + b + blen * .55], ...bot, [fx + a * .62, hy + b + blen * .55], [hx + aR * (jw + .14), hy + b * .58], [hx + aR * .98, hy - b * .08]];
        s += paint(G, curve([...outer, ...inner], true), hw, { lw: .75, m: 's2' });
        if (fine) for (const k of [-.45, -.15, .15, .45]) s += line(G, d`M${fx + k * a * .8} ${my + a * .3}Q${fx + k * a * 1.1} ${(my + by) / 2} ${fx + k * a * .7} ${by - a * .14}`, .38, { op: .55 });
        if (beard === 'braided') {
          for (let i = 0; i < 4; i++) { const y = hy + b + blen * (.35 + i * .17); s += `<ellipse cx="${R1(fx)}" cy="${R1(y)}" rx="${R1(a * .16)}" ry="${R1(blen * .1)}" fill="${hw.b}" stroke="${INK}" stroke-width="${lw}"/>`; }
          s += `<rect x="${R1(fx - a * .13)}" y="${R1(by - blen * .12)}" width="${R1(a * .26)}" height="${R1(a * .12)}" fill="${GOLD}" stroke="${INK}" stroke-width="${lw}"/>`;
        }
      }
      if (beard !== 'stubble' && beard !== 'goatee' || beard === 'goatee') {
        // the moustache, inked twice: a dark stroke and the hair over it
        const m = d`M${fx - mw * 1.25} ${my + a * .08}Q${fx - mw * .5} ${my - a * .2} ${fx} ${my - a * .1}Q${fx + mw * .5} ${my - a * .2} ${fx + mw * 1.25} ${my + a * .08}`;
        if (beard !== 'muttonchops' || true) s += `<path d="${m}" fill="none" stroke="${INK}" stroke-width="${R1(a * .17 + G.lw(.8))}" stroke-linecap="round"/><path d="${m}" fill="none" stroke="${hw.b}" stroke-width="${R1(a * .17)}" stroke-linecap="round"/>`;
        s += line(G, d`M${fx - mw * .7} ${my + mw * .02}Q${fx} ${my + mw * .2} ${fx + mw * .7} ${my + mw * .02}`, .7);
      }
    }

    // hair on the head
    if (!covered && !L.bald && hs !== 'shaved' && hs !== 'bald' && hs !== 'mohawk' || (small && !covered)) {
      const vol = ({ wild: .28, curly: .24, long: .12, braided: .1, locks: .14, cropped: .03, short: .08, topknot: .06, tied: .08, ponytail: .08 }[hs] ?? .08) * b * (L.baby ? .3 : 1);
      const hl = L.recede ? .86 : L.baby ? .7 : .5;
      const side = L.F && !small ? .25 : .02;
      const cap = [
        [hx - aL * 1.04, hy + b * side], [hx - aL * 1.1 - vol * .4, hy - b * .5], [hx - aL * .76, hy - b * .98 - vol], [hx + t * a * .1, hy - b * 1.04 - vol],
        [hx + aR * .76, hy - b * .98 - vol], [hx + aR * 1.1 + vol * .4, hy - b * .5], [hx + aR * 1.04, hy + b * side],
        [hx + aR * .88, hy - b * .14], [hx + aR * .62, hy - b * hl * .94], [fx + a * .18, hy - b * hl], [fx - a * .3, hy - b * hl * .95], [hx - aL * .68, hy - b * hl * .9], [hx - aL * .88, hy - b * .14],
      ];
      if (hs === 'wild' && !small) for (let i = 1; i < 6; i++) cap.splice(i * 2 - 1, 0, ...[]);
      s += paint(G, curve(cap, true), L.hair, { lw: .85, m: 's2' });
      if (hs === 'curly' && !small) for (let i = 0; i < 7; i++) { const q = i / 6, x = lerp(hx - aL * 1.02, hx + aR * 1.02, q), y = hy - b * (.45 + .6 * Math.sin(q * Math.PI)) - vol * .8; s += `<circle cx="${R1(x)}" cy="${R1(y)}" r="${R1(a * .2)}" fill="${L.hair.b}" stroke="${INK}" stroke-width="${lw}"/>`; }
      if (hs === 'wild' && !small && fine) s += line(G, d`M${hx - a * .9} ${hy - b * .7}l${-a * .25} ${-b * .2}M${hx - a * .3} ${hy - b * 1.15}l${-a * .1} ${-b * .25}M${hx + a * .4} ${hy - b * 1.12}l${a * .12} ${-b * .22}M${hx + a * .95} ${hy - b * .6}l${a * .25} ${-b * .15}`, .6);
      if (fine) for (const k of [-.55, -.18, .2, .55]) s += line(G, d`M${hx + k * a * .3} ${hy - b * 1.0 - vol * .8}Q${hx + k * a * 1.1} ${hy - b * .95} ${hx + k * a * 1.15} ${hy - b * hl * .8}`, .38, { op: .5 });
      if (hs === 'topknot') s += paint(G, d`M${hx - a * .3} ${hy - b * 1.06 - vol}a${a * .3} ${a * .26} 0 1 1 ${a * .6} 0Z`, L.hair, { lw: .7 }) + line(G, d`M${hx - a * .22} ${hy - b * 1.08 - vol}h${a * .44}`, .9, { c: L.trim });
      if (hs === 'braided' && !small) for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) {
        const y = hy + b * (.15 + i * .3), x = hx + sd * a * (1.0 + i * .03);
        s += `<ellipse cx="${R1(x)}" cy="${R1(y)}" rx="${R1(a * .17)}" ry="${R1(b * .17)}" fill="${L.hair.b}" stroke="${INK}" stroke-width="${lw}" transform="rotate(${i % 2 ? 18 : -18} ${R1(x)} ${R1(y)})"/>`;
        if (i === 5) s += `<rect x="${R1(x - a * .12)}" y="${R1(y + b * .14)}" width="${R1(a * .24)}" height="${R1(b * .1)}" fill="${L.trim}" stroke="${INK}" stroke-width="${lw}"/>`;
      }
      if (hs === 'locks' && !small) for (let i = 0; i < 6; i++) { const sd = i < 3 ? -1 : 1, j = i % 3, x = hx + sd * a * (.96 - j * .14); const pth = d`M${x} ${hy - b * .3}q${sd * a * .1} ${b * .9} ${-sd * a * .04} ${b * (1.5 - j * .2)}`; s += `<path d="${pth}" fill="none" stroke="${INK}" stroke-width="${R1(a * .15 + G.lw(.6))}" stroke-linecap="round"/><path d="${pth}" fill="none" stroke="${L.hair.b}" stroke-width="${R1(a * .15)}" stroke-linecap="round"/>`; }
    } else if (!covered && !small) {
      // shaved or bald: the scalp, a fringe of hair round the back for the bald, a crest for the mohawk
      if (hs === 'mohawk') s += paint(G, d`M${hx - a * .16} ${hy - b * .55}Q${hx - a * .2} ${hy - b * 1.4} ${hx} ${hy - b * 1.5}Q${hx + a * .2} ${hy - b * 1.4} ${hx + a * .16} ${hy - b * .55}Z`, L.hair, { lw: .7 });
      else if (L.bald || hs === 'bald') for (const sd of [-1, 1]) s += paint(G, curve([[hx + sd * a * 1.03, hy + b * .02], [hx + sd * a * 1.1, hy - b * .4], [hx + sd * a * .82, hy - b * .62], [hx + sd * a * .88, hy - b * .3]], true), L.hair, { lw: .6, shade: false });
      else if (fine) for (let i = 0; i < 12; i++) s += dot(hx + a * ((i * 37 % 17) / 17 * 1.4 - .7), hy - b * (.55 + (i * 13 % 7) / 7 * .35), a * .02, L.hair.s);
      if (fine) s += line(G, d`M${hx - a * .5} ${hy - b * .82}Q${hx - a * .2} ${hy - b * .95} ${hx} ${hy - b * .93}`, .6, { c: VEL, op: .7 });
    }

    // what is worn on the head
    s += headwear(G, L, o, { hat, helm, fx, eyeY, ew, my, hs });
    // the lost eye: a patch on a cord over the hair
    if (L.lostEye) {
      const x = fx + ex * (t > 0 ? 1 - t * .45 : 1 + Math.abs(t) * .12);
      s += `<ellipse cx="${R1(x)}" cy="${R1(eyeY + ew * .05)}" rx="${R1(ew * 1.3)}" ry="${R1(ew * 1.0)}" fill="${INK}"/>`;
      s += line(G, d`M${x - ew * 1.2} ${eyeY - ew * .3}L${hx - aL * .92} ${hy - b * .62}M${x + ew * 1.2} ${eyeY - ew * .2}L${hx + aR * 1.0} ${eyeY - ew * .7}`, .9);
    }
    return { back, front: s };
  }

  // ---- hats, hoods, veils, crowns and helmets
  function headwear(G, L, o, h) {
    const { hx, hy, a, b } = o, t = o.t || 0, { hat, helm, fx, eyeY, ew, my } = h;
    if (!hat) return '';
    let s = '';
    const lw = G.lw(.6), metal = fixed('#b3b1a5', '#7c796f'), linen = fixed('#e9e0c9', '#c6b590'), fur = fixed('#8a6a46', '#5c452e');
    const dome = (ext, low, peak = 1.32) => d`M${hx - a - ext} ${low}C${hx - a - ext} ${hy - b * peak} ${hx + a + ext} ${hy - b * peak} ${hx + a + ext} ${low}Z`;
    const hoodC = L.hoodC || (L.hoodC = wash(['#6a4a2e', '#5a6a3e', '#7a3a2a', '#4a4a5a', '#6b5a3e'][hash(L.p.id + 'hood') % 5]));
    const frameFace = (ext, lowY, c, pat) => {
      // a cloth or mail hood round the face: outer edge to the shoulders, the face opening inside
      const outer = [[hx - a * (1.3 + ext), lowY], [hx - a * (1.38 + ext), hy - b * .3], [hx - a * (1.05 + ext), hy - b * 1.15], [hx, hy - b * (1.38 + ext * .3)], [hx + a * (1.05 + ext), hy - b * 1.15], [hx + a * (1.38 + ext), hy - b * .3], [hx + a * (1.3 + ext), lowY]];
      const inner = [[hx + a * .98, hy + b * .75], [hx + a * 1.04, hy - b * .3], [hx + a * .7, hy - b * .9], [fx, hy - b * 1.0], [hx - a * .7, hy - b * .9], [hx - a * 1.04, hy - b * .3], [hx - a * .98, hy + b * .75]];
      return paint(G, curve([...outer, ...inner], true), c, { lw: .9, pat });
    };
    if (hat === 'crown' || hat === 'circlet') {
      const y0 = hy - b * .62, gw = fixed(GOLD, GOLDD);
      if (hat === 'crown') {
        const pts = []; const n = 5;
        for (let i = 0; i <= n * 2; i++) { const q = i / (n * 2), x = hx - a * .95 + q * a * 1.9; pts.push([x, i % 2 ? y0 - b * .22 : y0 - b * .5, 1]); }
        const dd = curve([[hx - a * .98, y0 + b * .08, 1], ...pts, [hx + a * .98, y0 + b * .08, 1]], true);
        s += paint(G, dd, gw, { lw: .8 });
        for (let i = 0; i <= n; i++) s += dot(hx - a * .95 + i / n * a * 1.9, y0 - b * .55, a * .07, GOLD) + `<circle cx="${R1(hx - a * .95 + i / n * a * 1.9)}" cy="${R1(y0 - b * .55)}" r="${R1(a * .07)}" fill="none" stroke="${INK}" stroke-width="${G.lw(.4)}"/>`;
        s += dot(hx, y0 - b * .07, a * .09, VER) + dot(hx - a * .55, y0 - b * .06, a * .07, LAP) + dot(hx + a * .55, y0 - b * .06, a * .07, LAP);
      } else {
        s += `<path d="${d`M${hx - a * .98} ${y0 + b * .05}Q${hx} ${y0 - b * .12} ${hx + a * .98} ${y0 + b * .05}`}" fill="none" stroke="${INK}" stroke-width="${R1(b * .14 + G.lw(.8))}"/><path d="${d`M${hx - a * .98} ${y0 + b * .05}Q${hx} ${y0 - b * .12} ${hx + a * .98} ${y0 + b * .05}`}" fill="none" stroke="${GOLD}" stroke-width="${R1(b * .14)}"/>`;
        s += dot(hx, y0 - b * .03, a * .08, VERD);
      }
      return s;
    }
    if (hat === 'tonsure') return s;
    if (hat === 'cowl') return frameFace(.05, hy + b * 1.35, L.cloth);
    if (hat === 'hood') {
      s += frameFace(0, hy + b * 1.3, hoodC);
      if (G.fine) s += line(G, d`M${hx + a * 1.1} ${hy - b * 1.0}Q${hx + a * 1.9} ${hy - b * .9} ${hx + a * 1.7} ${hy + b * .2}`, .9);
      return s;
    }
    if (hat === 'coif') {
      s += paint(G, curve([[hx - a * 1.08, hy + b * .25], [hx - a * 1.12, hy - b * .55], [hx, hy - b * 1.16], [hx + a * 1.12, hy - b * .55], [hx + a * 1.08, hy + b * .25], [hx + a * .9, hy - b * .2], [fx, hy - b * .72], [hx - a * .9, hy - b * .2]], true), linen, { lw: .7, m: 's2' });
      s += line(G, d`M${hx - a * 1.02} ${hy + b * .2}Q${hx - a * .6} ${hy + b * 1.0} ${fx} ${hy + b * 1.06}Q${hx + a * .6} ${hy + b * 1.0} ${hx + a * 1.02} ${hy + b * .2}`, .5, { c: '#a8986e' });
      return s;
    }
    if (hat === 'veil') {
      const vc = L.cult.dye && L.cult.hat && L.cult.hat[1] === 'veil' && hf(L.p, 'veilc') < .5 ? wash(L.cult.dye) : linen;
      const low = hy + b * 2.0;
      s += paint(G, curve([[hx - a * 1.5, low], [hx - a * 1.32, hy - b * .2], [hx - a * 1.0, hy - b * 1.1], [hx, hy - b * 1.24], [hx + a * 1.0, hy - b * 1.1], [hx + a * 1.32, hy - b * .2], [hx + a * 1.5, low], [hx + a * 1.04, hy + b * .5], [hx + a * 1.03, hy - b * .35], [hx + a * .6, hy - b * .74], [fx, hy - b * .78], [hx - a * .6, hy - b * .74], [hx - a * 1.03, hy - b * .35], [hx - a * 1.04, hy + b * .5]], true), vc, { lw: .85 });
      if (G.fine) s += line(G, d`M${hx - a * 1.2} ${hy}Q${hx - a * 1.3} ${hy + b} ${hx - a * 1.35} ${low - b * .1}M${hx + a * 1.2} ${hy}Q${hx + a * 1.3} ${hy + b} ${hx + a * 1.35} ${low - b * .1}`, .4, { op: .6 });
      if (L.wr > .6) s += paint(G, curve([[hx - a * .98, hy + b * .3], [hx - a * .8, hy + b * .95], [fx, hy + b * 1.3], [hx + a * .8, hy + b * .95], [hx + a * .98, hy + b * .3], [hx + a * .7, hy + b * .85], [fx, hy + b * 1.06], [hx - a * .7, hy + b * .85]], true), linen, { lw: .6, shade: false });   // the wimple
      return s;
    }
    if (hat === 'kerchief') {
      const kc = L.cult.dye ? wash(L.cult.dye) : wash(['#8e3a2a', '#3d4f7a', '#6b5a3e', '#4d6a4a'][hash(L.p.id + 'kc') % 4]);
      s += paint(G, curve([[hx - a * 1.08, hy - b * .2], [hx - a * 1.05, hy - b * .9], [hx, hy - b * 1.2], [hx + a * 1.05, hy - b * .9], [hx + a * 1.08, hy - b * .2], [hx + a * .7, hy - b * .55], [fx, hy - b * .62], [hx - a * .7, hy - b * .55]], true), kc, { lw: .8, m: 's2' });
      s += paint(G, d`M${hx + a * .95} ${hy - b * .45}l${a * .5} ${b * .25}l${-a * .1} ${b * .45}l${-a * .3} ${-b * .4}Z`, kc, { lw: .6, shade: false });
      return s;
    }
    if (hat === 'turban' || hat === 'wrap' || helm === 'turban') {
      const tc = hat === 'wrap' && L.cult.dye ? wash(L.cult.dye) : linen;
      s += paint(G, curve([[hx - a * 1.14, hy - b * .32], [hx - a * 1.25, hy - b * 1.0], [hx - a * .6, hy - b * 1.5], [hx + a * .6, hy - b * 1.5], [hx + a * 1.25, hy - b * 1.0], [hx + a * 1.14, hy - b * .32], [fx, hy - b * .58]], true), tc, { lw: .9, m: 's2' });
      for (const k of [.75, 1.0, 1.22]) s += line(G, d`M${hx - a * 1.1} ${hy - b * (k - .1)}Q${hx} ${hy - b * (k + .25)} ${hx + a * 1.12} ${hy - b * (k - .28)}`, .5, { op: .7 });
      if (hat === 'wrap') s += paint(G, limb([[hx + a * 1.05, hy - b * .5], [hx + a * 1.35, hy + b * .5], [hx + a * 1.25, hy + b * 1.4]], [a * .2, a * .24, a * .22]), tc, { lw: .7 });
      if (['noble', 'royal', 'gentry', 'merchant'].includes(L.kind) || helm) s += dot(fx, hy - b * .85, a * .1, helm ? metal.b : VER) + `<circle cx="${R1(fx)}" cy="${R1(hy - b * .85)}" r="${R1(a * .1)}" fill="none" stroke="${INK}" stroke-width="${lw}"/>`;
      if (helm) s += line(G, d`M${hx} ${hy - b * 1.5}v${-b * .35}`, 1.4);
      return s;
    }
    if (hat === 'cap') {
      const cc = wash(L.trim && hf(L.p, 'capc') < .5 ? L.out.main : '#3a3a4a');
      s += paint(G, curve([[hx - a * 1.08, hy - b * .5, 1], [hx - a * 1.0, hy - b * 1.12], [hx, hy - b * 1.3], [hx + a * 1.0, hy - b * 1.12], [hx + a * 1.08, hy - b * .5, 1]], true), cc, { lw: .8, m: 's2' });
      s += line(G, d`M${hx - a * 1.1} ${hy - b * .52}Q${hx} ${hy - b * .62} ${hx + a * 1.1} ${hy - b * .52}`, 1.2);
      return s;
    }
    if (hat === 'furhat' || hat === 'cone') {
      const top = hat === 'cone' ? [[hx - a * 1.0, hy - b * .74], [hx, hy - b * 1.95, 1], [hx + a * 1.0, hy - b * .74]] : [[hx - a * 1.02, hy - b * .74], [hx - a * 1.05, hy - b * 1.35], [hx, hy - b * 1.48], [hx + a * 1.05, hy - b * 1.35], [hx + a * 1.02, hy - b * .74]];
      s += paint(G, curve(top, true), hat === 'cone' ? wash(L.cult.dye || '#7a2a24') : L.cloth, { lw: .8, m: 's2' });
      s += paint(G, curve([[hx - a * 1.18, hy - b * .45], [hx - a * 1.16, hy - b * .86], [hx, hy - b * .98], [hx + a * 1.16, hy - b * .86], [hx + a * 1.18, hy - b * .45], [fx, hy - b * .56]], true), fur, { lw: .8, pat: 'fr' });
      return s;
    }
    if (hat === 'fillet') {
      const c = ['noble', 'royal', 'gentry'].includes(L.kind) ? GOLD : L.cult.dye ? pig(L.cult.dye) : L.trim;
      const fp = d`M${hx - a * 1.02} ${hy - b * .4}Q${hx} ${hy - b * .68} ${hx + a * 1.02} ${hy - b * .4}`;
      return `<path d="${fp}" fill="none" stroke="${INK}" stroke-width="${R1(b * .1 + G.lw(.7))}"/><path d="${fp}" fill="none" stroke="${c}" stroke-width="${R1(b * .1)}"/>`;
    }
    if (hat === 'leaves' || hat === 'feathers') {
      const fp = d`M${hx - a * 1.02} ${hy - b * .45}Q${hx} ${hy - b * .72} ${hx + a * 1.02} ${hy - b * .45}`;
      s += `<path d="${fp}" fill="none" stroke="${INK}" stroke-width="${R1(b * .08 + G.lw(.6))}"/><path d="${fp}" fill="none" stroke="${hat === 'leaves' ? VERD : L.trim}" stroke-width="${R1(b * .08)}"/>`;
      if (hat === 'leaves') for (let i = 0; i < 7; i++) { const q = i / 6, x = lerp(hx - a * .95, hx + a * .95, q), y = hy - b * (.47 + .2 * Math.sin(q * Math.PI)); s += `<ellipse cx="${R1(x)}" cy="${R1(y - b * .05)}" rx="${R1(a * .1)}" ry="${R1(a * .18)}" fill="${VERD}" stroke="${INK}" stroke-width="${lw}" transform="rotate(${R1(-50 + q * 100)} ${R1(x)} ${R1(y)})"/>`; }
      else for (const k of [-.4, .1, .5]) s += paint(G, d`M${hx + k * a} ${hy - b * .62}q${-a * .22} ${-b * .5} ${a * .02} ${-b * .95}q${a * .2} ${b * .45} ${-a * .02} ${b * .95}Z`, k > 0 ? fixed('#e6dcc3', '#c4b38c') : wash(VER), { lw: .5, shade: false });
      return s;
    }
    if (helm) {
      const mD = metal.s;
      if (helm === 'coif') {
        s += frameFace(.05, hy + b * 1.4, metal, 'ml');
        s += line(G, d`M${hx - a * 1.1} ${hy - b * .78}Q${hx} ${hy - b * 1.12} ${hx + a * 1.1} ${hy - b * .78}`, 1.4, { c: L.trim });
      } else if (helm === 'helm' || helm === 'nasal') {
        s += paint(G, d`M${hx - a * 1.1} ${hy - b * .32}Q${hx - a * 1.1} ${hy - b * 1.3} ${hx} ${hy - b * 1.55}Q${hx + a * 1.1} ${hy - b * 1.3} ${hx + a * 1.1} ${hy - b * .32}Z`, metal, { lw: 1, m: 's2' });
        s += paint(G, d`M${hx - a * 1.12} ${hy - b * .45}Q${hx} ${hy - b * .6} ${hx + a * 1.12} ${hy - b * .45}L${hx + a * 1.12} ${hy - b * .3}Q${hx} ${hy - b * .45} ${hx - a * 1.12} ${hy - b * .3}Z`, metal, { lw: .6, shade: false });
        s += paint(G, d`M${fx - a * .08} ${hy - b * .4}L${fx + a * .08} ${hy - b * .4}L${fx + a * .07} ${hy + b * .3}L${fx - a * .07} ${hy + b * .3}Z`, metal, { lw: .6, shade: false });
        if (G.fine) s += line(G, d`M${hx - a * .6} ${hy - b * .6}Q${hx - a * .55} ${hy - b * 1.1} ${hx - a * .1} ${hy - b * 1.35}`, .9, { c: VEL, op: .8 });
      } else if (helm === 'kettle') {
        s += paint(G, dome(.05 * a, hy - b * .5, 1.45), metal, { lw: 1, m: 's2' });
        s += paint(G, d`M${hx - a * 1.7} ${hy - b * .45}Q${hx} ${hy - b * .78} ${hx + a * 1.7} ${hy - b * .45}Q${hx} ${hy - b * .3} ${hx - a * 1.7} ${hy - b * .45}Z`, metal, { lw: .9 });
      } else if (helm === 'spangen') {
        s += paint(G, dome(.05 * a, hy - b * .32, 1.5), metal, { lw: 1, m: 's2' });
        s += line(G, d`M${hx} ${hy - b * 1.12}V${hy - b * .32}M${hx - a * .62} ${hy - b * .98}L${hx - a * 1.02} ${hy - b * .32}M${hx + a * .62} ${hy - b * .98}L${hx + a * 1.02} ${hy - b * .32}`, 1.3, { c: GOLDD });
        s += line(G, d`M${hx - a * .95} ${hy - b * .3}Q${fx - a * .45} ${eyeY + ew * .9} ${fx} ${eyeY - ew * .2}Q${fx + a * .45} ${eyeY + ew * .9} ${hx + a * .95} ${hy - b * .3}`, 1.1);
      } else if (helm === 'horned') {
        s += paint(G, dome(.05 * a, hy - b * .32, 1.42), fixed('#6a5a4a', '#43372a'), { lw: 1, m: 's2' });
        for (const sd of [-1, 1]) s += paint(G, d`M${hx + sd * a * .85} ${hy - b * .7}Q${hx + sd * a * 1.9} ${hy - b * .9} ${hx + sd * a * 1.75} ${hy - b * 1.85}Q${hx + sd * a * 1.5} ${hy - b * 1.15} ${hx + sd * a * .7} ${hy - b * 1.0}Z`, fixed('#ece2c8', '#bfb293'), { lw: .7, shade: false });
      } else if (helm === 'elfhelm') {
        s += paint(G, d`M${hx - a * 1.08} ${hy - b * .3}C${hx - a * 1.1} ${hy - b * 1.1} ${hx - a * .3} ${hy - b * 1.6} ${hx} ${hy - b * 2.05}C${hx + a * .3} ${hy - b * 1.6} ${hx + a * 1.1} ${hy - b * 1.1} ${hx + a * 1.08} ${hy - b * .3}Q${hx} ${hy - b * .62} ${hx - a * 1.08} ${hy - b * .3}Z`, fixed('#9fb2a0', '#5f7563'), { lw: 1, pat: 'sc', m: 's2' });
      } else {
        s += paint(G, dome(.05 * a, hy - b * .32, 1.45), metal, { lw: 1, m: 's2' });
      }
      return s;
    }
    return s;
  }

  // ---- held things: swords, axes, maces, staves, spears, bows, shields
  const WOOD = () => fixed('#86603c', '#5a3f26'), STEEL = () => fixed('#c7c5ba', '#86837a');
  function bladeAt(G, L, x, yTip, yGuard, o = {}) {
    // a sword point down (or point up when yTip < yGuard): blade, guard, grip, pommel
    const up = yTip < yGuard, sg = up ? -1 : 1, len = Math.abs(yTip - yGuard), u = o.u, bw = u * .07, grip = u * .38;
    let s = paint(G, d`M${x - bw} ${yGuard}L${x + bw} ${yGuard}L${x + bw * .8} ${yTip - sg * u * .2}L${x} ${yTip}L${x - bw * .8} ${yTip - sg * u * .2}Z`, STEEL(), { lw: .7, m: 's1' });
    if (G.fine) s += line(G, d`M${x} ${yGuard + sg * u * .05}L${x} ${yTip - sg * len * .2}`, .4, { op: .7 });
    const gold = ['noble', 'royal', 'officer'].includes(L.kind) || L.p.ruler;
    s += paint(G, d`M${x - u * .3} ${yGuard - sg * u * .03}L${x + u * .3} ${yGuard - sg * u * .03}L${x + u * .3} ${yGuard - sg * u * .1}L${x - u * .3} ${yGuard - sg * u * .1}Z`, gold ? fixed(GOLD, GOLDD) : STEEL(), { lw: .6, shade: false });
    s += paint(G, d`M${x - u * .045} ${yGuard - sg * u * .1}L${x + u * .045} ${yGuard - sg * u * .1}L${x + u * .045} ${yGuard - sg * grip}L${x - u * .045} ${yGuard - sg * grip}Z`, fixed('#5a3a22', '#3a2414'), { lw: .5, shade: false });
    s += `<circle cx="${R1(x)}" cy="${R1(yGuard - sg * (grip + u * .05))}" r="${R1(u * .07)}" fill="${gold ? GOLD : STEEL().b}" stroke="${INK}" stroke-width="${G.lw(.6)}"/>`;
    return s;
  }
  function haftWeapon(G, L, x0, y0, x1, y1, u) {
    // a hafted weapon from the hand (x0,y0) to its head (x1,y1)
    const k = L.W.kind, look = L.W.look || '';
    let s = paint(G, limb([[x0, y0], [x1, y1]], [u * .045, u * .045]), WOOD(), { lw: .6, shade: false });
    const dx = x1 - x0, dy = y1 - y0, m = Math.hypot(dx, dy) || 1, ux = dx / m, uy = dy / m, nx = -uy, ny = ux;
    const P = (al, ac) => [x1 + ux * al + nx * ac, y1 + uy * al + ny * ac];
    if (k === 'axe') {
      const big = look === 'greataxe' ? 1.4 : 1, q = [P(-u * .5 * big, 0), P(-u * .62 * big, u * .42 * big), P(u * .05, u * .55 * big), P(-u * .05, u * .08)];
      s += paint(G, curve(q.map((p, i) => [p[0], p[1], i === 0 || i === 3 ? 1 : 0]), true), STEEL(), { lw: .7, shade: false });
    } else if (k === 'mace' || k === 'flail') {
      const c = P(-u * .12, 0); s += `<circle cx="${R1(c[0])}" cy="${R1(c[1])}" r="${R1(u * .17)}" fill="${STEEL().b}" stroke="${INK}" stroke-width="${G.lw(.7)}"/>`;
      if (G.fine) for (let i = 0; i < 6; i++) { const an = i / 6 * Math.PI * 2; s += line(G, d`M${c[0] + Math.cos(an) * u * .17} ${c[1] + Math.sin(an) * u * .17}l${Math.cos(an) * u * .07} ${Math.sin(an) * u * .07}`, .6); }
    } else if (k === 'hammer' || k === 'club') {
      if (k === 'club') s += paint(G, limb([P(-u * .6, 0), P(0, 0)], [u * .07, u * .13]), WOOD(), { lw: .6, shade: false });
      else { const q = [P(-u * .22, -u * .2), P(-u * .22, u * .3), P(0, u * .3), P(0, -u * .2)]; s += paint(G, curve(q.map(p => [p[0], p[1], 1]), true), STEEL(), { lw: .7, shade: false }); }
    }
    return s;
  }
  function poleWeapon(G, L, x, yBot, yTop, u) {
    const k = L.W.kind, look = L.W.look || '';
    let s = paint(G, d`M${x - u * .045} ${yBot}L${x + u * .045} ${yBot}L${x + u * .045} ${yTop}L${x - u * .045} ${yTop}Z`, WOOD(), { lw: .6, shade: false });
    if (k === 'staff') { s += `<ellipse cx="${R1(x)}" cy="${R1(yTop)}" rx="${R1(u * .09)}" ry="${R1(u * .12)}" fill="${WOOD().b}" stroke="${INK}" stroke-width="${G.lw(.6)}"/>`; return s; }
    if (k === 'polearm' || look === 'halberd' || look === 'glaive') {
      s += paint(G, d`M${x} ${yTop - u * .55}L${x + u * .08} ${yTop}L${x + u * .45} ${yTop + u * .1}Q${x + u * .5} ${yTop + u * .35} ${x + u * .42} ${yTop + u * .55}L${x} ${yTop + u * .45}Z`, STEEL(), { lw: .7, shade: false });
    } else {
      s += paint(G, d`M${x} ${yTop - u * .6}Q${x + u * .13} ${yTop - u * .2} ${x + u * .06} ${yTop + u * .05}L${x - u * .06} ${yTop + u * .05}Q${x - u * .13} ${yTop - u * .2} ${x} ${yTop - u * .6}Z`, STEEL(), { lw: .7, shade: false });
      if (k === 'lance') s += paint(G, d`M${x - u * .12} ${yTop + u * .7}L${x + u * .12} ${yTop + u * .7}L${x + u * .06} ${yTop + u * .15}L${x - u * .06} ${yTop + u * .15}Z`, washOf(L.arms.f), { lw: .5, shade: false });
    }
    return s;
  }
  function shieldAt(G, L, cx, cy, u) {
    const look = L.shield.look || 'shield', f = washOf(L.arms.f);
    let s, w, h;
    if (look === 'buckler' || look === 'targe') {
      const r = u * (look === 'buckler' ? .32 : .55);
      s = paint(G, d`M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`, look === 'buckler' ? STEEL() : f, { lw: 1.1, m: 's2' });
      s += `<circle cx="${R1(cx)}" cy="${R1(cy)}" r="${R1(r * .28)}" fill="${STEEL().b}" stroke="${INK}" stroke-width="${G.lw(.7)}"/>`;
      return s;
    }
    w = u * (look === 'tower' ? .75 : .62); h = u * (look === 'kite' || look === 'tower' ? 1.75 : 1.3);
    const top = cy - h * .45, bot = cy + h * .55;
    const path = look === 'tower' ? d`M${cx - w} ${top}H${cx + w}V${bot - h * .1}Q${cx} ${bot + h * .05} ${cx - w} ${bot - h * .1}Z` : d`M${cx - w} ${top}H${cx + w}V${top + h * .32}Q${cx + w} ${bot - h * .2} ${cx} ${bot}Q${cx - w} ${bot - h * .2} ${cx - w} ${top + h * .32}Z`;
    s = paint(G, path, f, { lw: 1.1, m: 's1' });
    try { if (L.arms.ch && L.arms.ch !== 'none') s += PORTRAIT.device({ f: L.arms.f, c: L.arms.c, ch: L.arms.ch }, cx, top + h * .42, w / 13); } catch (e) {}
    return s;
  }

  // ---- the full figure (200 x 340): standing, turned, a hand on the hilt or the staff, seated; a child; a cradle
  function fullFig(G, L) {
    const ground = 316, cx = 100, ap = L.ap, race = L.race, p = L.p;
    let back = '', body = '', fore = '', scen = '';
    if (L.pose === 'swaddled') return cradle(G, L, ground);
    const raceH = { elf: 1.04, halfelf: 1.02, dwarf: .76, orc: 1.03, halforc: 1.02, giant: 1.16 }[race] || 1;
    const hAdj = clamp(((ap.height || L.meanH) - L.meanH) / L.meanH, -.08, .08);
    const stoop = L.veryOld ? 7 : L.wr > .9 ? 3 : 0;
    // a giant stands taller than the tallest man (the frame's arch leaves room up to about 296)
    const H = Math.min(296, 258 * raceH * L.grow * (1 + hAdj * .7)) - stoop;
    const ratioA = { elf: 6.0, halfelf: 5.8, dwarf: 4.2, orc: 5.4, halforc: 5.5, giant: 5.9 }[race] || 5.6;
    const ratio = 3.7 + (ratioA - 3.7) * Math.pow(L.x, .8), u = H / ratio;
    const buildK = { slight: .88, lean: .94, average: 1, sturdy: 1.08, heavy: 1.16, muscular: 1.14, gaunt: .84, stout: 1.12 }[ap.build] || 1;
    const raceW = { dwarf: 1.25, orc: 1.22, giant: 1.25, elf: .9, halforc: 1.12, halfelf: .95 }[race] || 1;
    const seated = L.pose === 'seated', t = L.t;
    const legLen0 = H - u * (1 + .22 + ({ dwarf: 1.35, giant: 1.45, orc: 1.45 }[race] || 1.4) * (L.small ? .95 : 1) + .42);
    const drop = seated ? legLen0 * .42 : 0;
    const top = ground - H + drop, b = u * .5, hy = top + b;
    const a = b * (L.small ? .86 : { dwarf: .88, orc: .84, giant: .82, elf: .7, halforc: .8, halfelf: .74 }[race] || .76);
    const chinY = top + u, shY = chinY + u * .22;
    const sw = u * .95 * buildK * raceW * (L.F ? .84 : 1) * (L.small ? .82 + .18 * L.x : 1);
    const torsoL = u * ({ dwarf: 1.35, giant: 1.45, orc: 1.45 }[race] || 1.4) * (L.small ? .95 : 1);
    const waistY = shY + torsoL, hipY = waistY + u * .42;
    const heavy = ap.build === 'heavy' || ap.build === 'stout';
    const ww = sw * (L.F ? .66 : .76) * (heavy ? 1.12 : 1), hw = sw * (L.F ? .9 : .8) * (heavy ? 1.1 : 1);
    const aw = Math.max(2.4, u * .15 * buildK * (raceW > 1 ? 1.08 : 1));
    const neckW = a * ({ orc: .78, giant: .74, dwarf: .78, halforc: .7 }[race] || .56);
    const long = L.long || L.small && L.F;
    const seatY = hipY, kneeY = seated ? seatY + u * .12 : hipY + (ground - hipY) * .5;
    const hemY = seated ? ground - 4 : long ? ground - 2 : hipY + (ground - hipY) * (L.small ? .5 : .4);
    const hemW = seated ? hw * 1.32 : long ? hw * 1.38 : hw * 1.12;
    const armorLook = L.armor, metal = fixed('#b3b1a5', '#7c796f');
    const mailish = ['mail', 'dwarfmail', 'mailplate', 'dwarfplate'].includes(armorLook), plateish = ['plate', 'mailplate', 'dwarfplate'].includes(armorLook);
    const gilt = fixed(GOLD, GOLDD), leath = fixed('#7d5634', '#563a22');
    const noble = ['noble', 'royal'].includes(L.kind) || !!p.ruler;
    // --- scenery: the throne or bench, the floor
    if (seated) {
      const px = sw + u * .42, postTop = p.ruler ? shY - u * .55 : seatY - u * .05;
      if (p.ruler) {
        scen += paint(G, d`M${cx - px} ${seatY + u * .1}L${cx - px} ${postTop + u * .1}Q${cx} ${postTop - u * .35} ${cx + px} ${postTop + u * .1}L${cx + px} ${seatY + u * .1}Z`, washOf(L.arms.f), { lw: 1 });
        if (G.fine) for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) scen += dot(cx - px * .7 + j * px * .7, postTop + u * .4 + i * u * .45, u * .04, GOLD);
        for (const sd of [-1, 1]) {
          scen += paint(G, d`M${cx + sd * px - u * .09} ${ground}L${cx + sd * px - u * .09} ${postTop}L${cx + sd * px + u * .09} ${postTop}L${cx + sd * px + u * .09} ${ground}Z`, gilt, { lw: .9, shade: false });
          scen += `<path d="${d`M${cx + sd * px - u * .14} ${postTop}L${cx + sd * px} ${postTop - u * .4}L${cx + sd * px + u * .14} ${postTop}Z`}" fill="${GOLD}" stroke="${INK}" stroke-width="${G.lw(.8)}"/>`;
        }
      } else {
        for (const sd of [-1, 1]) scen += paint(G, d`M${cx + sd * px - u * .07} ${ground}L${cx + sd * px - u * .07} ${seatY + u * .12}L${cx + sd * px + u * .07} ${seatY + u * .12}L${cx + sd * px + u * .07} ${ground}Z`, WOOD(), { lw: .8, shade: false });
      }
      scen += paint(G, d`M${cx - px - u * .15} ${seatY + u * .04}L${cx + px + u * .15} ${seatY + u * .04}L${cx + px + u * .15} ${seatY + u * .2}L${cx - px - u * .15} ${seatY + u * .2}Z`, p.ruler ? gilt : WOOD(), { lw: .9, shade: false });
      // a footstool
      scen += paint(G, d`M${cx - hemW * .9} ${ground - u * .1}L${cx + hemW * .9} ${ground - u * .1}L${cx + hemW * .9} ${ground + 2}L${cx - hemW * .9} ${ground + 2}Z`, p.ruler ? washOf(L.arms.f) : WOOD(), { lw: .8, shade: false });
    }
    // --- the cast shadow
    scen += `<ellipse cx="${cx}" cy="${ground + 1}" rx="${R1(Math.max(sw, hemW) * 1.25)}" ry="${R1(u * .12)}" fill="${INK}" fill-opacity=".22"/>`;
    // --- behind the body: cloak, a bow on the back, the long hair
    const cloak = !L.small && (L.cloak && L.cloak.look !== 'tabard' || L.out.fur || L.kind === 'royal' || L.rank >= 6 || p.ruler);
    const cloakC = L.cloak && L.cloak.look === 'furcloak' ? fixed('#6a5034', '#47361f') : L.cloak && L.cloak.look === 'finecloak' || noble ? washOf(L.arms.f) : wash(mix(hexOk(L.out.main) || '#6b5a3e', INK, .25));
    if (cloak) {
      const cb = seated ? ground - u * .2 : Math.min(ground - u * .2, (long ? ground : hemY + u * .9) - u * .2);
      back += paint(G, curve([[cx - sw * 1.02, shY + u * .08], [cx - sw * 1.25, waistY], [cx - hemW - u * .38, cb - u * .1], [cx - hemW - u * .2, cb, 1], [cx, cb + u * .05], [cx + hemW + u * .2, cb, 1], [cx + hemW + u * .38, cb - u * .1], [cx + sw * 1.25, waistY], [cx + sw * 1.02, shY + u * .08], [cx, shY - u * .1]], true), cloakC, { lw: 1.2 });
      if (G.fine) for (const sd of [-1, 1]) back += line(G, d`M${cx + sd * sw * 1.15} ${waistY}Q${cx + sd * (hemW + u * .3)} ${(waistY + cb) / 2} ${cx + sd * (hemW + u * .25)} ${cb - u * .15}`, .5, { op: .6 });
    }
    if (L.ranged && ['bow'].includes(L.ranged.kind)) back += line(G, d`M${cx + sw * .9} ${shY - u * .9}Q${cx - sw * .2} ${waistY - u * .4} ${cx - sw * 1.05} ${hipY + u * .8}`, 1.8, { c: '#5a3f26' }) + line(G, d`M${cx + sw * .9} ${shY - u * .9}L${cx - sw * 1.05} ${hipY + u * .8}`, .4);
    // --- legs and shoes (under a short garment)
    const hose = noble ? washOf(mix(L.arms.f, INK, .2)) : L.kind === 'rags' ? fixed('#6a6050', '#4a4236') : washOf(mix(L.cloth.b, INK, .3));
    const legFill = plateish ? metal : mailish ? metal : hose;
    const bare = L.kind === 'rags' || (L.small && L.kind === 'peasant');
    for (const sd of [-1, 1]) {
      const lim = L.limp && sd === 1;
      if (seated) {
        const fx0 = cx + sd * hw * .5;
        if (!long) body += paint(G, limb([[fx0, kneeY], [fx0, ground - u * .15]], [u * .17, u * .11]), legFill, { lw: 1, pat: mailish && !plateish ? 'ml' : null });
        body += shoe(G, fx0, ground - u * .1, sd, u, bare);
        continue;
      }
      const tx = cx + sd * hw * .46, kx = cx + sd * hw * (.44 + (lim ? .08 : 0)), ax = cx + sd * hw * (.46 + (lim ? .12 : 0)) + (L.pose === 'tq' ? t * u * .3 : 0);
      if (!long) body += paint(G, limb([[tx, hipY - u * .1], [kx, kneeY], [ax, ground - u * .14]], [hw * .48, u * .16, u * .1]), legFill, { lw: 1, pat: mailish && !plateish ? 'ml' : null });
      if (!long && plateish && G.fine) body += `<ellipse cx="${R1(kx)}" cy="${R1(kneeY)}" rx="${R1(u * .17)}" ry="${R1(u * .13)}" fill="${metal.b}" stroke="${INK}" stroke-width="${G.lw(.7)}"/>`;
      body += shoe(G, ax, ground - u * .02, sd, u, bare && !long, plateish ? metal : null);
    }
    // --- the main garment
    const gL = [[cx - neckW * 1.25, shY - u * .07], [cx - sw * .86, shY + u * .02], [cx - sw, shY + u * .2], [cx - sw * .92, shY + u * .7], [cx - ww, waistY], [cx - hw * (long ? 1.05 : 1), hipY]];
    if (seated) gL.push([cx - hemW * 1.05, kneeY + u * .1], [cx - hemW, hemY, 1]); else gL.push([cx - hemW, hemY, 1]);
    const gR = mirror(gL, cx).reverse();
    const sway = seated ? 0 : (hf(p, 'sway') - .5) * u * .5, hemPts = [];
    for (let i = 1; i < 8; i++) { const q = i / 8; hemPts.push([lerp(cx - hemW, cx + hemW, q) + sway * Math.sin(q * Math.PI), hemY + u * (seated ? .02 : .07) * Math.sin(q * Math.PI) + (i % 2 ? -u * .05 : u * .04)]); }
    gL[gL.length - 1][0] += sway * .3; gR[0][0] += sway * .3;
    const garment = curve([...gL, ...hemPts, ...gR, [cx + t * u * .25, shY + u * .1]], true);
    const robeC = armorLook === 'robes' ? wash(L.out.main) : L.cloth;
    body += paint(G, garment, robeC, { lw: 1.2 });
    // folds
    {
      // folds: tapered strokes of shadow from the belt (or the knees) to the hem, as a brush lays them
      const n = long || seated ? 6 : 3, fc = mix(robeC.s, INK, .35), y0 = (seated ? kneeY : waistY) + u * .12;
      for (let i = 0; i < n; i++) {
        const q = (i + .5) / n * 2 - 1, x0 = cx + q * ww * .75, x1 = cx + q * hemW * .86 + sway * Math.cos(q * Math.PI / 2) * .9, yb = hemY - u * .02, wd = u * (.035 + .025 * (i % 2));
        const mx = (x0 + x1) / 2 + q * u * .12, my = (y0 + yb) / 2;
        body += `<path d="${d`M${x0} ${y0}Q${mx - wd} ${my} ${x1 - wd} ${yb}L${x1 + wd} ${yb}Q${mx + wd} ${my} ${x0} ${y0}Z`}" fill="${fc}" fill-opacity="${G.fine ? .55 : .35}"/>`;
      }
      if (seated) body += line(G, d`M${cx - hemW * .98} ${kneeY - u * .05}Q${cx} ${kneeY + u * .3} ${cx + hemW * .98} ${kneeY - u * .05}`, .7, { op: .75 });
    }
    // patterns by culture: stripes, a zigzag border; trim bands by rank
    const midPts = k => [...gL.map((p0, i) => [lerp(p0[0], cx, 1 - k), p0[1]])];
    if (L.cult.pat === 'stripe' && !plateish && !mailish && G.fine) for (const k of [-.55, -.2, .2, .55]) body += line(G, curve([[cx + k * sw * .9, shY + u * .3], [cx + k * ww, waistY], [cx + k * hw, hipY], [cx + k * hemW * .95, hemY - u * .05]], false), 1.2, { c: L.trim, op: .8 });
    if (L.cult.pat === 'zig' && G.fine) { let z = ''; for (let i = 0; i <= 12; i++) { const q = i / 12; z += (i ? 'L' : 'M') + R1(lerp(cx - hemW * .95, cx + hemW * .95, q)) + ' ' + R1(hemY - u * (i % 2 ? .25 : .1)); } body += line(G, z, 1, { c: L.trim }); }
    if (noble || L.kind === 'gentry' || L.cult.band) body += line(G, d`M${cx - hemW * .98} ${hemY - u * .1}Q${cx} ${hemY - u * .02} ${cx + hemW * .98} ${hemY - u * .1}`, 2.2, { c: noble ? GOLD : L.trim });
    void midPts;
    // the cut: kaftan overlap, a drape over one shoulder
    if (L.cult.cut === 'kaftan' && !plateish) body += line(G, d`M${cx - neckW * .8} ${shY}Q${cx + ww * .2} ${waistY - u * .5} ${cx + ww * .7} ${waistY + u * .1}L${cx + hemW * .55} ${hemY}`, 1.8, { c: L.trim }) + line(G, d`M${cx - neckW * .8} ${shY}Q${cx + ww * .2} ${waistY - u * .5} ${cx + ww * .7} ${waistY + u * .1}L${cx + hemW * .55} ${hemY}`, .6);
    if (L.cult.cut === 'drape' && !plateish && !mailish && !L.small) {
      const dc = washOf(mix(L.cloth.b, L.trim, .45));
      body += paint(G, curve([[cx - sw * 1.0, shY + u * .1], [cx - sw * .3, shY - u * .05], [cx + sw * .75, waistY + u * .1], [cx + hw * 1.0, hipY + u * .35], [cx + hw * .6, hipY + u * .55], [cx - sw * .2, waistY - u * .1], [cx - sw * .95, shY + u * .7]], true), dc, { lw: .9 });
    }
    // armour over the garment
    if (armorLook !== 'none' && armorLook !== 'robes') {
      const aHem = mailish ? hipY + (ground - hipY) * .32 : armorLook === 'padded' ? hipY + (ground - hipY) * .25 : hipY + u * .12;
      const aL = [[cx - neckW * 1.3, shY - u * .02], [cx - sw * .9, shY + u * .06], [cx - sw * .98, shY + u * .3], [cx - sw * .9, shY + u * .8], [cx - ww * 1.04, waistY], [cx - hw * 1.06, hipY], [cx - hw * (mailish ? 1.18 : 1.08), aHem, 1]];
      const aD = curve([...aL, [cx, aHem + u * .05], ...mirror(aL, cx).reverse(), [cx, shY + u * .14]], true);
      const fillW = armorLook === 'leather' || armorLook === 'hide' || armorLook === 'orcmail' ? (armorLook === 'leather' ? leath : fixed('#7b6448', '#54432f')) : armorLook === 'padded' ? fixed('#cbb88e', '#9e8c66') : armorLook === 'brigandine' ? washOf(L.arms.f) : armorLook === 'elfmail' ? fixed('#9fb2a0', '#5f7563') : armorLook === 'lamellar' ? fixed('#a28a5a', '#6e5c3a') : metal;
      const pat = mailish || armorLook === 'mail' ? 'ml' : armorLook === 'scale' || armorLook === 'elfmail' ? 'sc' : armorLook === 'padded' ? 'qt' : armorLook === 'lamellar' ? 'lm' : armorLook === 'hide' || armorLook === 'orcmail' ? 'fr' : null;
      body += paint(G, aD, fillW, { lw: 1.2, pat });
      if (plateish) {
        const bp = curve([[cx - sw * .78, shY + u * .2], [cx - ww * .98, waistY - u * .1], [cx, waistY + u * .12], [cx + ww * .98, waistY - u * .1], [cx + sw * .78, shY + u * .2], [cx, shY + u * .1]], true);
        body += paint(G, bp, metal, { lw: 1.1, m: 's2' }) + line(G, d`M${cx} ${shY + u * .15}V${waistY + u * .08}`, .6);
        if (G.fine) body += line(G, d`M${cx - sw * .5} ${shY + u * .4}Q${cx - sw * .55} ${waistY - u * .5} ${cx - ww * .5} ${waistY - u * .15}`, 1.2, { c: VEL, op: .85 });
        for (let i = 0; i < 3; i++) body += line(G, d`M${cx - hw * 1.04} ${waistY + u * (.2 + i * .14)}Q${cx} ${waistY + u * (.32 + i * .14)} ${cx + hw * 1.04} ${waistY + u * (.2 + i * .14)}`, .6);
        if (armorLook === 'dwarfplate') body += line(G, d`M${cx - sw * .78} ${shY + u * .22}Q${cx} ${shY + u * .05} ${cx + sw * .78} ${shY + u * .22}`, 1.6, { c: GOLD });
      }
      if (armorLook === 'brigandine' && G.fine) for (let r = 0; r < 5; r++) for (let c = -2; c <= 2; c++) body += dot(cx + c * ww * .38, shY + u * .4 + r * torsoL * .17, u * .03, GOLD);
      if (armorLook === 'leather' && G.fine) body += line(G, d`M${cx - ww * .9} ${shY + torsoL * .45}Q${cx} ${shY + torsoL * .55} ${cx + ww * .9} ${shY + torsoL * .45}`, .5, { op: .7 });
      if (armorLook === 'orcmail') for (let i = 0; i < 3; i++) body += line(G, d`M${cx - sw * .5 + i * sw * .5} ${shY + u * .35}q${u * .08} ${u * .35} 0 ${u * .7}`, 2.2, { c: '#efe4c8' });
      if (armorLook === 'dwarfmail' || armorLook === 'dwarfplate') body += line(G, d`M${cx - hw * 1.12} ${aHem - u * .08}Q${cx} ${aHem} ${cx + hw * 1.12} ${aHem - u * .08}`, 1.8, { c: GOLD });
      // a tabard of the arms over mail
      if ((L.cloak && L.cloak.look === 'tabard') || ((mailish || ['scale', 'brigandine'].includes(armorLook)) && (L.house || noble || L.rank >= 4))) {
        const tb = curve([[cx - sw * .64, shY + u * .1, 1], [cx - ww * .82, waistY], [cx - hw * .86, aHem + u * .15, 1], [cx, aHem + u * .05, 1], [cx + hw * .86, aHem + u * .15, 1], [cx + ww * .82, waistY], [cx + sw * .64, shY + u * .1, 1]], true);
        body += paint(G, tb, washOf(L.arms.f), { lw: 1 });
        try { if (L.arms.ch && L.arms.ch !== 'none') body += PORTRAIT.device({ f: L.arms.f, c: L.arms.c, ch: L.arms.ch }, cx, shY + torsoL * .45, Math.max(.55, sw / 26)); } catch (e) {}
      }
    }
    // the apron, the priest's stole, rags, the sash, the belt, a purse
    if ((L.out.apron || L.cult.apron && L.kind === 'artisan') && armorLook === 'none') body += paint(G, curve([[cx - ww * .82, waistY - u * .1, 1], [cx + ww * .82, waistY - u * .1, 1], [cx + hw * .95, hemY - u * .12, 1], [cx - hw * .95, hemY - u * .12, 1]], true), L.cult.apron ? leath : fixed('#a08a64', '#76643f'), { lw: .9 });
    if (L.kind === 'priest') body += paint(G, d`M${cx - u * .1} ${shY + u * .05}L${cx + u * .1} ${shY + u * .05}L${cx + u * .14} ${hemY - u * .05}L${cx - u * .14} ${hemY - u * .05}Z`, fixed(L.trim, mix(L.trim, INK, .3)), { lw: .7, shade: false }) + line(G, d`M${cx - u * .08} ${waistY + u * .4}h${u * .16}M${cx} ${waistY + u * .32}v${u * .16}`, .6);
    if (L.kind === 'rags') body += line(G, d`M${cx - hemW} ${hemY}l${u * .2} ${-u * .3}l${u * .16} ${u * .3}l${u * .2} ${-u * .34}l${u * .2} ${u * .34}l${u * .22} ${-u * .26}l${u * .18} ${u * .26}`, .7) + paint(G, d`M${cx + ww * .1} ${waistY + u * .3}h${u * .3}v${u * .26}h${-u * .3}Z`, washOf(mix(L.cloth.b, VEL, .25)), { lw: .5, shade: false });
    const beltY = L.long && L.F ? waistY - u * .2 : waistY;
    if (!(L.long && armorLook === 'none' && L.kind === 'priest')) {
      if (L.cult.sash && !plateish) { body += paint(G, d`M${cx - ww * 1.04} ${beltY - u * .1}Q${cx} ${beltY - u * .02} ${cx + ww * 1.04} ${beltY - u * .1}L${cx + ww * 1.05} ${beltY + u * .12}Q${cx} ${beltY + u * .2} ${cx - ww * 1.05} ${beltY + u * .12}Z`, washOf(L.trim), { lw: .7, shade: false }) + paint(G, d`M${cx + ww * .6} ${beltY + u * .1}l${u * .1} ${u * .7}l${u * .12} ${-u * .05}l${-u * .05} ${-u * .62}Z`, washOf(L.trim), { lw: .5, shade: false }); }
      else body += paint(G, d`M${cx - ww * 1.03} ${beltY - u * .05}Q${cx} ${beltY + u * .02} ${cx + ww * 1.03} ${beltY - u * .05}L${cx + ww * 1.03} ${beltY + u * .05}Q${cx} ${beltY + u * .12} ${cx - ww * 1.03} ${beltY + u * .05}Z`, leath, { lw: .6, shade: false }) + `<rect x="${R1(cx - u * .07)}" y="${R1(beltY - u * .04)}" width="${R1(u * .14)}" height="${R1(u * .12)}" fill="none" stroke="${noble ? GOLD : '#a08a64'}" stroke-width="${G.lw(.9)}"/>`;
    }
    if (L.kind === 'merchant' && !L.small) body += paint(G, d`M${cx - ww * .55} ${beltY + u * .05}q${-u * .2} ${u * .28} 0 ${u * .36}q${u * .2} ${-u * .08} 0 ${-u * .36}Z`, leath, { lw: .6, shade: false });
    // a scabbard at the hip when the sword is not in hand
    const swordAtHip = L.W.kind === 'sword' && L.pose !== 'hilt';
    if (swordAtHip) body += paint(G, limb([[cx + ww * .75, beltY + u * .05], [cx + hw * 1.25, beltY + u * 2.0]], [u * .06, u * .05]), leath, { lw: .7, shade: false }) + bladeAt(G, L, cx + ww * .62, beltY + u * .2, beltY - u * .02, { u: u * .9 }).replace(/<path d="M[^"]*" fill="#c7c5ba[^>]*>/, '');
    if (L.W.kind === 'dagger') body += paint(G, limb([[cx - ww * .6, beltY + u * .05], [cx - ww * .85, beltY + u * .65]], [u * .05, u * .03]), leath, { lw: .6, shade: false });
    // collars: fur, ermine, beads, embroidery, bones, a torc
    const collar = L.out.fur || L.cult.collar === 'fur' || L.cult.fur ? (L.kind === 'royal' || p.ruler ? 'ermine' : 'fur') : L.cult.collar;
    const nY = shY + u * .08;
    if (collar === 'fur' || collar === 'ermine') body += paint(G, d`M${cx - sw * .98} ${shY + u * .1}Q${cx} ${shY + u * .62} ${cx + sw * .98} ${shY + u * .1}Q${cx} ${shY - u * .14} ${cx - sw * .98} ${shY + u * .1}Z`, collar === 'ermine' ? fixed('#ece5d3', '#c9c0aa') : fixed('#8a6a46', '#5c452e'), { lw: .8, pat: collar === 'ermine' ? 'er' : 'fr' });
    else if (collar === 'beads' && G.fine) for (let r = 0; r < 2; r++) for (let i = 0; i <= 8; i++) { const q = i / 8, x = lerp(cx - neckW * (1.6 + r * .4), cx + neckW * (1.6 + r * .4), q), y = nY + Math.sin(q * Math.PI) * u * (.22 + r * .14); body += dot(x, y, u * .045, r ? GOLD : i % 2 ? VER : LAP); }
    else if (collar === 'embroidered') body += line(G, d`M${cx - neckW * 1.3} ${nY}Q${cx} ${nY + u * .35} ${cx + neckW * 1.3} ${nY}`, 1.8, { c: VER }) + line(G, d`M${cx} ${nY + u * .17}V${waistY - u * .4}`, 1.4, { c: VER });
    else if (collar === 'bones') { body += line(G, d`M${cx - neckW * 1.4} ${nY}Q${cx} ${nY + u * .4} ${cx + neckW * 1.4} ${nY}`, .5); for (let i = 1; i < 6; i++) { const q = i / 6, x = lerp(cx - neckW * 1.3, cx + neckW * 1.3, q), y = nY + Math.sin(q * Math.PI) * u * .2; body += `<path d="${d`M${x - u * .03} ${y}l${u * .03} ${u * .16}l${u * .03} ${-u * .16}Z`}" fill="#efe4c8" stroke="${INK}" stroke-width="${G.lw(.4)}"/>`; } }
    if (L.cult.torc || L.ap.jewel === 'torc') body += line(G, d`M${cx - neckW * 1.2} ${nY - u * .04}Q${cx} ${nY + u * .22} ${cx + neckW * 1.2} ${nY - u * .04}`, 1.6, { c: GOLD });
    // rank: an officer's baldric, a soldier's pips
    if (L.rank >= 6) body += line(G, d`M${cx - sw * .8} ${shY + u * .15}L${cx + ww * .9} ${waistY}`, 2.2, { c: VER });
    if (L.rank >= 2) for (let i = 0; i < Math.min(5, Math.ceil(L.rank / 2)); i++) body += `<path d="${d`M${cx + sw * .35 + i * u * .12} ${shY + u * .3}l${u * .05} ${u * .07}l${-u * .05} ${u * .07}l${-u * .05} ${-u * .07}Z`}" fill="${GOLD}" stroke="${INK}" stroke-width="${G.lw(.3)}"/>`;
    // the cloak's clasp and front edges
    if (cloak) {
      body += line(G, d`M${cx - sw * 1.0} ${shY + u * .12}Q${cx - sw * .5} ${shY + u * .3} ${cx - neckW * 1.2} ${shY + u * .18}M${cx + sw * 1.0} ${shY + u * .12}Q${cx + sw * .5} ${shY + u * .3} ${cx + neckW * 1.2} ${shY + u * .18}`, .9);
      body += `<circle cx="${R1(cx - sw * .55)}" cy="${R1(shY + u * .25)}" r="${R1(u * .08)}" fill="${GOLD}" stroke="${INK}" stroke-width="${G.lw(.6)}"/>`;
      if (L.kind === 'royal' || p.ruler) for (const sd of [-1, 1]) body += paint(G, d`M${cx + sd * sw * 1.0} ${shY + u * .2}L${cx + sd * (sw * 1.06)} ${shY + u * .2}L${cx + sd * (hemW + u * .25)} ${ground - u * .25}L${cx + sd * (hemW + u * .05)} ${ground - u * .25}Z`, fixed('#ece5d3', '#c9c0aa'), { lw: .6, pat: 'er', shade: false });
    }

    // --- arms, hands and what they hold
    const S = sd => [cx + sd * (sw - aw * .55), shY + aw * .7];
    let arm = { [-1]: null, [1]: null }, held = '', heldFront = '';
    const shieldArm = L.shield && !L.W.twoHand;
    const hang = sd => ({ e: [cx + sd * (sw + aw * .35), shY + u * 1.05], w: [cx + sd * (sw * .96 + aw * .15), shY + u * 1.95] });
    const onBelt = sd => ({ e: [cx + sd * (sw + aw * .8), shY + u * .95], w: [cx + sd * ww * .62, beltY - u * .05] });
    if (seated) {
      for (const sd of [-1, 1]) arm[sd] = { e: [cx + sd * (sw + aw * .45), waistY - u * .15], w: [cx + sd * hw * .78, seatY + u * .05] };
      if (p.ruler) {
        arm[-1] = { e: [cx - sw - aw * .55, waistY - u * .1], w: [cx - hw * 1.0, waistY + u * .05], grip: 1 };
        held += paint(G, d`M${cx - hw - u * .035} ${waistY + u * .55}L${cx - hw + u * .035} ${waistY + u * .55}L${cx - hw + u * .035} ${waistY - u * 1.25}L${cx - hw - u * .035} ${waistY - u * 1.25}Z`, gilt, { lw: .6, shade: false });
        held += `<path d="${d`M${cx - hw} ${waistY - u * 1.55}l${u * .1} ${u * .22}l${-u * .1} ${u * .12}l${-u * .1} ${-u * .12}Z`}" fill="${GOLD}" stroke="${INK}" stroke-width="${G.lw(.6)}"/>`;
      }
    } else if (L.pose === 'hilt') {
      const swx = cx + t * u * .2, guard = hipY + u * .15, pommel = waistY - u * .02;
      for (const sd of [-1, 1]) arm[sd] = { e: [cx + sd * (sw + aw * .25), shY + u * .95], w: [swx + sd * aw * .8, pommel + u * .12 + (sd > 0 ? u * .14 : 0)], grip: 1 };
      if (L.W.kind === 'sword') held += bladeAt(G, L, swx, ground - u * .05, guard, { u });
      else held += haftWeapon(G, L, swx, pommel - u * .1, swx, ground - u * .12, u);
    } else if (L.pose === 'staff') {
      const sx = cx - sw - u * .38, hand = shY + u * 1.25, spear = L.W.kind !== 'staff' && L.pole;
      arm[-1] = { e: [cx - sw - aw * .45, shY + u * .85], w: [sx + aw * .2, hand], grip: 1 };
      held += L.pole ? poleWeapon(G, L, sx, ground - u * .02, spear ? top - u * .55 : top + u * .25, u) : poleWeapon(G, Object.assign({}, L, { W: { kind: 'staff' } }), sx, ground - u * .02, top + u * .1, u);
      if (L.blade && L.W.kind !== 'sword') held += haftWeapon(G, L, cx + sw + aw * .3, shY + u * 1.95, cx + sw + aw * .5, shY + u * 3.1, u);
    }
    if (L.pose === 'stand' && !L.small && !(L.blade && L.W.kind !== 'sword')) arm[-1] = { e: [cx - sw - aw * .15, shY + u * 1.0], w: [cx - sw * .38, shY + u * .62], palm: 1 };
    if (L.pose === 'hilt' && L.lostHand) arm[1] = hang(1);
    for (const sd of [-1, 1]) if (!arm[sd]) arm[sd] = (L.pose === 'tq' && sd === (t > 0 ? -1 : 1)) || (sd === 1 && L.lostHand) ? onBelt(sd) : hang(sd);
    if (shieldArm && !seated && L.pose !== 'hilt') arm[1] = { e: [cx + sw + aw * .7, shY + u * .9], w: [cx + sw + aw * .1, waistY - u * .1], hidden: 1 };
    // a weapon hanging from the free hand
    if ((L.pose === 'stand' || L.pose === 'tq') && L.blade && L.W.kind !== 'sword') { const w0 = arm[-1].w; held += haftWeapon(G, L, w0[0], w0[1] - u * .1, w0[0] - u * .05, w0[1] + u * (L.W.twoHand ? 1.7 : 1.15), u); }
    const sleeveW = plateish || mailish || ['scale', 'lamellar'].includes(armorLook) ? metal : armorLook === 'padded' ? fixed('#cbb88e', '#9e8c66') : armorLook === 'leather' ? robeC : armorLook === 'elfmail' ? fixed('#9fb2a0', '#5f7563') : robeC;
    const sleevePat = mailish || armorLook === 'mail' ? 'ml' : armorLook === 'scale' || armorLook === 'elfmail' ? 'sc' : armorLook === 'padded' ? 'qt' : null;
    let arms = '';
    for (const sd of [-1, 1]) {
      const A0 = S(sd), { e, w } = arm[sd];
      arms += paint(G, limb([[A0[0], A0[1] - aw * .6], A0, e, w], [aw * .9, aw, aw * .9, aw * .72]), sleeveW, { lw: 1 , pat: sleevePat });
      if (plateish) arms += `<ellipse cx="${R1(A0[0])}" cy="${R1(A0[1])}" rx="${R1(aw * 1.35)}" ry="${R1(aw * 1.05)}" fill="${metal.b}" stroke="${INK}" stroke-width="${G.lw(.9)}"/>`;
      else if (noble && G.fine) arms += line(G, d`M${w[0] - aw * .7} ${w[1] - aw * .2}L${w[0] + aw * .7} ${w[1] - aw * .2}`, 1.6, { c: GOLD });
    }
    body += held + arms;
    for (const sd of [-1, 1]) {
      const { e, w, grip, hidden, palm } = arm[sd];
      if (hidden) continue;
      if (sd === 1 && L.lostHand) { body += paint(G, d`M${w[0] - aw * .7} ${w[1] - aw * .3}L${w[0] + aw * .7} ${w[1] - aw * .3}L${w[0] + aw * .55} ${w[1] + aw * .5}L${w[0] - aw * .55} ${w[1] + aw * .5}Z`, fixed('#e6dcc3', '#c4b38c'), { lw: .6, shade: false }) + line(G, d`M${w[0]} ${w[1] + aw * .5}v${aw * .7}q0 ${aw * .9} ${aw * .9} ${aw * .6}`, 1.1, { c: '#4a4a48' }); continue; }
      body += palm ? palmUp(G, L, w, aw, plateish) : hand(G, L, w, e, aw, grip, plateish);
    }
    if (shieldArm && !seated && L.pose !== 'hilt') fore += shieldAt(G, L, cx + sw + u * .05, waistY + u * .05, u);
    // --- the neck and head
    const neck = paint(G, d`M${cx - neckW} ${chinY - u * .2}L${cx - neckW} ${shY + u * .05}Q${cx} ${shY + u * .16} ${cx + neckW} ${shY + u * .05}L${cx + neckW} ${chinY - u * .2}Z`, L.skin, { lw: .8 });
    const oldNeck = L.wr > .8 && G.fine ? line(G, d`M${cx - neckW * .4} ${chinY - u * .05}L${cx - neckW * .3} ${shY}M${cx + neckW * .4} ${chinY - u * .05}L${cx + neckW * .3} ${shY}`, .4, { c: L.skin.line, op: .7 }) : '';
    const hd = head(G, L, { hx: cx + t * u * .25, hy, a, b, t: t * 1.1 });
    // a closed helm, set down at the feet
    let feet = '';
    if (L.atFeet) {
      const hx = cx + hemW + u * .42, hy0 = ground - u * .42, r = u * .4;
      feet = paint(G, d`M${hx - r} ${hy0 + r}L${hx - r} ${hy0 - r * .4}Q${hx - r} ${hy0 - r * 1.15} ${hx} ${hy0 - r * 1.2}Q${hx + r} ${hy0 - r * 1.15} ${hx + r} ${hy0 - r * .4}L${hx + r} ${hy0 + r}Z`, metal, { lw: 1, m: 's2' }) + line(G, d`M${hx - r * .8} ${hy0 - r * .3}H${hx + r * .8}`, 1.2) + line(G, d`M${hx} ${hy0 - r * 1.1}V${hy0 + r}`, .5);
    }
    // --- the floor and a shield of arms in the arch
    const floor = groundStrip(G, L, ground, noble);
    const heraldry = (L.house || p.ruler || L.rank >= 4) && G.fine ? cornerArms(G, L, 166, 58) : '';
    const fig = `${back}${hd.back}${body}${neck}${oldNeck}${hd.front}${fore}`;
    return { scen: floor + heraldry + scen + feet, fig };
  }
  function shoe(G, x, y, sd, u, bare, metalW) {
    const w = u * .13;
    const dd = d`M${x - w} ${y - u * .12}L${x + w} ${y - u * .12}Q${x + sd * (w + u * .2)} ${y - u * .06} ${x + sd * (w + u * .3)} ${y}L${x - sd * w * 1.1} ${y}Z`;
    return paint(G, dd, metalW || (bare ? fixed('#c9a27e', '#9c7a5a') : fixed('#3d2a1a', '#2b1d10')), { lw: .7, shade: false });
  }
  function hand(G, L, w, e, aw, grip, gaunt) {
    const ang = Math.atan2(w[1] - e[1], w[0] - e[0]) * 180 / Math.PI - 90, sk = gaunt ? fixed('#b3b1a5', '#7c796f') : L.skin;
    const cxh = w[0] + (w[0] - e[0]) * .12, cyh = w[1] + (w[1] - e[1]) * .12;
    let s = `<ellipse cx="${R1(cxh)}" cy="${R1(cyh)}" rx="${R1(aw * .78)}" ry="${R1(aw * (grip ? .8 : 1.05))}" fill="${sk.b}" stroke="${INK}" stroke-width="${G.lw(.8)}" transform="rotate(${R1(ang)} ${R1(cxh)} ${R1(cyh)})"/>`;
    if (G.fine) s += grip ? line(G, d`M${cxh - aw * .5} ${cyh - aw * .2}h${aw}M${cxh - aw * .5} ${cyh + aw * .2}h${aw}`, .35, { op: .7 }) : line(G, d`M${cxh - aw * .3} ${cyh - aw * .3}l${aw * .1} ${aw * .6}`, .4, { op: .6 });
    if (L.fingers && G.fine) s += line(G, d`M${cxh + aw * .2} ${cyh + aw * .7}l${aw * .3} ${-aw * .2}`, .6, { c: VER });
    return s;
  }
  // a hand raised in speech, palm out, the gesture of every figure in the margins
  function palmUp(G, L, w, aw, gaunt) {
    const sk = gaunt ? fixed('#b3b1a5', '#7c796f') : L.skin, x = w[0], y = w[1];
    const pts = [[x - aw * .7, y + aw * .5], [x - aw * .85, y - aw * .5], [x - aw * .6, y - aw * 1.5], [x - aw * .1, y - aw * 1.75], [x + aw * .45, y - aw * 1.55], [x + aw * .7, y - aw * .6], [x + aw * 1.15, y - aw * .7], [x + aw * .8, y + aw * .2], [x + aw * .5, y + aw * .6]];
    let s = `<path d="${curve(pts, true)}" fill="${sk.b}" stroke="${INK}" stroke-width="${G.lw(.8)}"/>`;
    if (G.fine) s += line(G, d`M${x - aw * .35} ${y - aw * .4}l${-aw * .02} ${-aw * 1.0}M${x + aw * .05} ${y - aw * .45}l${aw * .02} ${-aw * 1.1}M${x + aw * .4} ${y - aw * .4}l${aw * .05} ${-aw * .9}`, .38, { op: .7 });
    return s;
  }
  function groundStrip(G, L, y, tiled) {
    if (tiled) {
      let s = `<path d="${d`M0 ${y - 10}H200V340H0Z`}" fill="${fixed('#c9b48a', '#a8935e').b}"/>`;
      for (let i = -8; i <= 8; i++) s += line(G, d`M${100 + i * 9} ${y - 10}L${100 + i * 26} 340`, .5, { op: .6 });
      for (const yy of [y - 4, y + 4, y + 13]) s += line(G, d`M0 ${yy}H200`, .5, { op: .6 });
      return s + line(G, d`M0 ${y - 10}H200`, 1.2);
    }
    const g = fixed('#6d8a63', '#4d7456');
    let s = paint(G, d`M0 ${y - 4}Q50 ${y - 14} 100 ${y - 8}T200 ${y - 6}V340H0Z`, g, { lw: 1.2, shade: false });
    if (G.fine) for (let i = 0; i < 9; i++) { const x = 14 + i * 21 + (i % 2) * 6, yy = y + 4 + (i % 3) * 5; s += line(G, d`M${x - 3} ${yy}l2 -5l1 5l2 -6l1 6`, .55); }
    return s;
  }
  function cornerArms(G, L, x, y) {
    const w = 11, h = 13, f = washOf(L.arms.f);
    let s = paint(G, d`M${x - w} ${y - h * .5}H${x + w}V${y + h * .1}Q${x + w} ${y + h * .8} ${x} ${y + h * 1.1}Q${x - w} ${y + h * .8} ${x - w} ${y + h * .1}Z`, f, { lw: .9, shade: false });
    try { if (L.arms.ch && L.arms.ch !== 'none') s += PORTRAIT.device({ f: L.arms.f, c: L.arms.c, ch: L.arms.ch }, x, y + h * .2, .45); } catch (e) {}
    return s;
  }
  // an infant in swaddling bands, in a cradle on its rockers
  function cradle(G, L, ground) {
    const cx = 100, wood = fixed('#86603c', '#5a3f26'), linen = fixed('#e9e0c9', '#c6b590');
    let s = '';
    s += `<ellipse cx="${cx}" cy="${ground + 1}" rx="58" ry="5" fill="${INK}" fill-opacity=".22"/>`;
    s += line(G, d`M${cx - 52} ${ground - 8}Q${cx - 30} ${ground + 4} ${cx} ${ground + 2}Q${cx + 30} ${ground + 4} ${cx + 52} ${ground - 8}`, 3, { c: wood.s }) + line(G, d`M${cx - 52} ${ground - 8}Q${cx - 30} ${ground + 4} ${cx} ${ground + 2}Q${cx + 30} ${ground + 4} ${cx + 52} ${ground - 8}`, .7);
    const bx = cx - 6, by = ground - 46, hb = 10;
    // the bundle, lying, head to the left
    s += paint(G, curve([[cx - 40, by + 2], [cx - 30, by - 12], [cx + 10, by - 13], [cx + 38, by - 6], [cx + 40, by + 8], [cx + 12, by + 14], [cx - 30, by + 13]], true), linen, { lw: 1 });
    if (G.fine) for (let i = 0; i < 3; i++) s += line(G, d`M${cx - 22 + i * 10} ${by - 12}l${-5} ${24}`, .9, { c: L.trim }) ;
    const hd = head(G, L, { hx: cx - 34, hy: by - 3, a: hb * .92, b: hb, t: .15 });
    s += hd.front;
    // a coverlet in the family's colour over the bundle, then the cradle's near side
    s += paint(G, curve([[cx - 18, by - 9], [cx + 14, by - 12], [cx + 40, by - 6], [cx + 44, by + 10, 1], [cx - 22, by + 10, 1]], true), washOf(L.house || L.p.ruler || ['noble', 'royal'].includes(L.kind) ? L.arms.f : L.cloth.b), { lw: .8 });
    s += paint(G, d`M${cx - 52} ${by + 4}L${cx + 52} ${by + 4}L${cx + 47} ${ground - 8}L${cx - 47} ${ground - 8}Z`, wood, { lw: 1.2 });
    s += `<path d="${d`M${cx - 54} ${by + 4}L${cx - 54} ${by - 14}Q${cx - 54} ${by - 24} ${cx - 44} ${by - 22}L${cx - 44} ${by + 4}Z`}" fill="${wood.b}" stroke="${INK}" stroke-width="${G.lw(1)}"/>`;
    if (G.fine) for (let i = 0; i < 4; i++) s += line(G, d`M${cx - 40 + i * 24} ${by + 14}q6 -4 12 0`, .5, { op: .6 });
    void bx;
    const tiled = ['noble', 'royal'].includes(L.kind) || !!L.p.ruler;
    return { scen: groundStrip(G, L, ground, tiled), fig: `<g transform="translate(100 ${ground}) scale(1.45) translate(-100 ${-ground})">${s}</g>` };
  }

  // ---- the bust (200 x 200): head and shoulders in a lunette
  function bustFig(G, L) {
    const cx = 100, ap = L.ap, race = L.race, p = L.p, t = L.t;
    let scen = '', back = '', body = '';
    const buildK = { slight: .9, lean: .95, average: 1, sturdy: 1.06, heavy: 1.12, muscular: 1.1, gaunt: .86, stout: 1.1 }[ap.build] || 1;
    const raceW = { dwarf: 1.2, orc: 1.18, giant: 1.22, elf: .9, halforc: 1.1, halfelf: .95 }[race] || 1;
    if (L.baby) {
      const hy = 100, b = 24, a = b * .94;
      body += paint(G, curve([[cx - 48, 205], [cx - 46, 150], [cx - 30, 122], [cx, 116], [cx + 30, 122], [cx + 46, 150], [cx + 48, 205]], true), fixed('#e9e0c9', '#c6b590'), { lw: 1.2 });
      if (G.fine) for (let i = 0; i < 4; i++) body += line(G, d`M${cx - 44} ${142 + i * 16}L${cx + 44} ${158 + i * 16}`, 1.1, { c: L.trim }) + line(G, d`M${cx + 44} ${142 + i * 16}L${cx - 44} ${158 + i * 16}`, .5, { op: .5 });
      const hd = head(G, L, { hx: cx, hy, a, b, t: 0 });
      return { scen, fig: body + hd.front };
    }
    const k = L.small ? .7 + .3 * L.x : 1;
    const b = 33 * k * (race === 'giant' ? 1.06 : race === 'dwarf' ? .98 : 1), hy = 90 + (1 - k) * 34 + (L.pose === 'seated' ? 4 : 0);
    const a = b * (L.small ? .86 : { dwarf: .9, orc: .86, giant: .84, elf: .72, halforc: .82, halfelf: .76 }[race] || .78);
    const chin = hy + b, shY = chin + b * .3;
    const sw = b * 2.05 * buildK * raceW * (L.F ? .86 : 1) * (L.small ? .72 + .28 * L.x : 1);
    const neckW = a * ({ orc: .78, giant: .74, dwarf: .78, halforc: .7 }[race] || .56);
    const noble = ['noble', 'royal'].includes(L.kind) || !!p.ruler;
    const metal = fixed('#b3b1a5', '#7c796f');
    // the throne's back or a cloth of honour behind a seated figure
    if (L.pose === 'seated') {
      if (p.ruler) {
        scen += paint(G, d`M${cx - sw - 10} 200L${cx - sw - 10} ${hy - b * .4}Q${cx} ${hy - b * 2.0} ${cx + sw + 10} ${hy - b * .4}L${cx + sw + 10} 200Z`, washOf(L.arms.f), { lw: 1.2 });
        for (const sd of [-1, 1]) scen += paint(G, d`M${cx + sd * (sw + 10) - 4} 200L${cx + sd * (sw + 10) - 4} ${hy - b * .5}L${cx + sd * (sw + 10) + 4} ${hy - b * .5}L${cx + sd * (sw + 10) + 4} 200Z`, fixed(GOLD, GOLDD), { lw: .9, shade: false }) + `<path d="${d`M${cx + sd * (sw + 10) - 6} ${hy - b * .5}L${cx + sd * (sw + 10)} ${hy - b * .5 - 14}L${cx + sd * (sw + 10) + 6} ${hy - b * .5}Z`}" fill="${GOLD}" stroke="${INK}" stroke-width="${G.lw(.8)}"/>`;
      } else scen += paint(G, d`M${cx - sw - 6} 200L${cx - sw - 6} ${shY + 6}L${cx + sw + 6} ${shY + 6}L${cx + sw + 6} 200Z`, fixed('#86603c', '#5a3f26'), { lw: 1, shade: false });
    }
    // the shoulders
    const cloak = !L.small && (L.cloak && L.cloak.look !== 'tabard' || L.out.fur || L.kind === 'royal' || L.rank >= 6 || p.ruler);
    const armorLook = L.armor, mailish = ['mail', 'dwarfmail', 'mailplate', 'dwarfplate'].includes(armorLook), plateish = ['plate', 'mailplate', 'dwarfplate'].includes(armorLook);
    const sL = [[cx - neckW * 1.2, shY - b * .14], [cx - sw * .7, shY + b * .02], [cx - sw, shY + b * .42], [cx - sw * 1.05, 206, 1]];
    const shoulders = curve([...sL, [cx, 206], ...mirror(sL, cx).reverse(), [cx + t * 8, shY + b * .16]], true);
    const robeC = armorLook === 'robes' ? wash(L.out.main) : L.cloth;
    if (cloak) {
      const cC = L.cloak && L.cloak.look === 'furcloak' ? fixed('#6a5034', '#47361f') : noble || L.cloak && L.cloak.look === 'finecloak' ? washOf(L.arms.f) : wash(mix(hexOk(L.out.main) || '#6b5a3e', INK, .25));
      back += paint(G, curve([[cx - sw * .75, shY - b * .05], [cx - sw * 1.12, shY + b * .45], [cx - sw * 1.2, 206, 1], [cx + sw * 1.2, 206, 1], [cx + sw * 1.12, shY + b * .45], [cx + sw * .75, shY - b * .05]], true), cC, { lw: 1.2 });
    }
    if (L.ranged && L.ranged.kind === 'bow') back += line(G, d`M${cx + sw * .95} ${hy - b * 1.2}Q${cx + sw * 1.2} ${shY} ${cx + sw * .7} 200`, 2.4, { c: '#5a3f26' });
    if (L.pose === 'staff') {
      const sx = cx - sw * .78, spear = L.W.kind !== 'staff' && L.pole;
      back += poleWeapon(G, L.pole ? L : Object.assign({}, L, { W: { kind: 'staff' } }), sx, 205, spear ? hy - b * 1.6 : hy - b * .6, b * 1.5);
    }
    body += paint(G, shoulders, robeC, { lw: 1.2 });
    if (G.fine && !plateish) for (const sd of [-1, 1]) body += line(G, d`M${cx + sd * sw * .8} ${shY + b * .18}Q${cx + sd * sw * .86} ${shY + b * 1.0} ${cx + sd * sw * .8} 200`, .6, { op: .7 });
    if (armorLook !== 'none' && armorLook !== 'robes') {
      const fillW = armorLook === 'leather' ? fixed('#7d5634', '#563a22') : armorLook === 'hide' || armorLook === 'orcmail' ? fixed('#7b6448', '#54432f') : armorLook === 'padded' ? fixed('#cbb88e', '#9e8c66') : armorLook === 'brigandine' ? washOf(L.arms.f) : armorLook === 'elfmail' ? fixed('#9fb2a0', '#5f7563') : armorLook === 'lamellar' ? fixed('#a28a5a', '#6e5c3a') : metal;
      const pat = mailish || armorLook === 'mail' ? 'ml' : armorLook === 'scale' || armorLook === 'elfmail' ? 'sc' : armorLook === 'padded' ? 'qt' : armorLook === 'lamellar' ? 'lm' : armorLook === 'hide' || armorLook === 'orcmail' ? 'fr' : null;
      body += paint(G, shoulders, fillW, { lw: 1.2, pat });
      if (plateish) {
        body += paint(G, curve([[cx - sw * .6, shY + b * .4], [cx - sw * .65, 205, 1], [cx + sw * .65, 205, 1], [cx + sw * .6, shY + b * .4], [cx, shY + b * .25]], true), metal, { lw: 1.1, m: 's2' });
        for (const sd of [-1, 1]) body += `<ellipse cx="${R1(cx + sd * sw * .82)}" cy="${R1(shY + b * .45)}" rx="${R1(b * .55)}" ry="${R1(b * .4)}" fill="${metal.b}" stroke="${INK}" stroke-width="${G.lw(1)}"/>`;
        if (G.fine) body += line(G, d`M${cx - sw * .38} ${shY + b * .6}Q${cx - sw * .42} ${shY + b * 1.3} ${cx - sw * .3} 196`, 1.4, { c: VEL, op: .8 });
      }
      if ((L.cloak && L.cloak.look === 'tabard') || ((mailish || ['scale', 'brigandine'].includes(armorLook)) && (L.house || noble || L.rank >= 4))) {
        body += paint(G, d`M${cx - sw * .5} ${shY + b * .3}L${cx + sw * .5} ${shY + b * .3}L${cx + sw * .52} 205L${cx - sw * .52} 205Z`, washOf(L.arms.f), { lw: 1 });
        try { if (L.arms.ch && L.arms.ch !== 'none') body += PORTRAIT.device({ f: L.arms.f, c: L.arms.c, ch: L.arms.ch }, cx, shY + b * 1.05, sw / 30); } catch (e) {}
      }
    }
    // the cut and the trim
    if (L.cult.cut === 'kaftan' && !plateish) body += line(G, d`M${cx - neckW} ${shY}Q${cx + sw * .1} ${shY + b * .9} ${cx + sw * .4} 205`, 2.2, { c: L.trim }) + line(G, d`M${cx - neckW} ${shY}Q${cx + sw * .1} ${shY + b * .9} ${cx + sw * .4} 205`, .6);
    if (L.cult.cut === 'drape' && !plateish && !mailish && !L.small) body += paint(G, curve([[cx - sw * 1.02, shY + b * .45], [cx - sw * .55, shY - b * .02], [cx + sw * .55, 205, 1], [cx - sw * .1, 205, 1], [cx - sw * .98, shY + b * 1.3]], true), washOf(mix(L.cloth.b, L.trim, .45)), { lw: 1 });
    if (L.cult.pat === 'stripe' && armorLook === 'none' && G.fine) for (const k2 of [-.6, -.25, .25, .6]) body += line(G, d`M${cx + k2 * sw * .8} ${shY + b * .3}L${cx + k2 * sw * .95} 200`, 1.6, { c: L.trim, op: .8 });
    if (L.kind === 'priest') body += paint(G, d`M${cx - 6} ${shY + 2}L${cx + 6} ${shY + 2}L${cx + 8} 205L${cx - 8} 205Z`, fixed(L.trim, mix(L.trim, INK, .3)), { lw: .7, shade: false });
    if (L.out.apron && armorLook === 'none') body += paint(G, d`M${cx - sw * .45} ${shY + b * 1.1}L${cx + sw * .45} ${shY + b * 1.1}L${cx + sw * .5} 205L${cx - sw * .5} 205Z`, fixed('#a08a64', '#76643f'), { lw: .9, shade: false });
    if (L.kind === 'rags') body += line(G, d`M${cx - sw * .6} ${shY + b * .9}l6 8l5 -7l7 8M${cx + sw * .3} ${shY + b * 1.1}l5 7l6 -6`, 1);
    if (noble || L.kind === 'gentry') body += line(G, d`M${cx - neckW * 1.4} ${shY - b * .04}Q${cx} ${shY + b * .5} ${cx + neckW * 1.4} ${shY - b * .04}`, 2.4, { c: noble ? GOLD : L.trim });
    const collar = L.out.fur || L.cult.collar === 'fur' || L.cult.fur ? (L.kind === 'royal' || p.ruler ? 'ermine' : 'fur') : L.cult.collar;
    if (collar === 'fur' || collar === 'ermine') body += paint(G, d`M${cx - sw * .95} ${shY + b * .36}Q${cx} ${shY + b * 1.3} ${cx + sw * .95} ${shY + b * .36}Q${cx} ${shY - b * .2} ${cx - sw * .95} ${shY + b * .36}Z`, collar === 'ermine' ? fixed('#ece5d3', '#c9c0aa') : fixed('#8a6a46', '#5c452e'), { lw: .9, pat: collar === 'ermine' ? 'er' : 'fr' });
    else if (collar === 'beads') for (let r = 0; r < 2; r++) for (let i = 0; i <= 8; i++) { const q = i / 8, x = lerp(cx - neckW * (1.7 + r * .5), cx + neckW * (1.7 + r * .5), q), y = shY + Math.sin(q * Math.PI) * b * (.4 + r * .25); body += dot(x, y, b * .07, r ? GOLD : i % 2 ? VER : LAP); }
    else if (collar === 'embroidered') body += line(G, d`M${cx - neckW * 1.4} ${shY}Q${cx} ${shY + b * .6} ${cx + neckW * 1.4} ${shY}`, 2.4, { c: VER });
    else if (collar === 'bones') for (let i = 1; i < 6; i++) { const q = i / 6, x = lerp(cx - neckW * 1.5, cx + neckW * 1.5, q), y = shY + Math.sin(q * Math.PI) * b * .35; body += `<path d="${d`M${x - 2} ${y}l2 ${b * .25}l2 ${-b * .25}Z`}" fill="#efe4c8" stroke="${INK}" stroke-width="${G.lw(.4)}"/>`; }
    if (L.cult.torc || L.ap.jewel === 'torc') body += line(G, d`M${cx - neckW * 1.25} ${shY - b * .06}Q${cx} ${shY + b * .36} ${cx + neckW * 1.25} ${shY - b * .06}`, 2.2, { c: GOLD });
    if (cloak) body += `<circle cx="${R1(cx - sw * .55)}" cy="${R1(shY + b * .4)}" r="${R1(b * .12)}" fill="${GOLD}" stroke="${INK}" stroke-width="${G.lw(.7)}"/>`;
    if (L.rank >= 6) body += line(G, d`M${cx - sw * .78} ${shY + b * .3}L${cx + sw * .5} 205`, 3, { c: VER });
    // a sword held upright before the shoulder
    if (L.pose === 'hilt' && G.fine) {
      const sx = cx - sw * .58;
      if (L.W.kind === 'sword') body += bladeAt(G, L, sx, hy - b * 1.2, 182, { u: b * 1.6 });
      else body += haftWeapon(G, L, sx, 196, sx + 2, hy - b * .6, b * 1.6);
      body += hand(G, L, [sx, 190], [sx - 8, 210], b * .24, 1, plateish);
    }
    if (L.pose === 'staff') body += hand(G, L, [cx - sw * .78, 186], [cx - sw * .9, 210], b * .24, 1, plateish);
    const neck = paint(G, d`M${cx - neckW} ${chin - b * .4}L${cx - neckW} ${shY + b * .05}Q${cx} ${shY + b * .3} ${cx + neckW} ${shY + b * .05}L${cx + neckW} ${chin - b * .4}Z`, L.skin, { lw: .9 });
    const hd = head(G, L, { hx: cx + t * 10, hy, a, b, t: t * 1.15 });
    let heraldry = '';
    if ((L.house || p.ruler || L.rank >= 4) && G.fine && L.pose !== 'seated') heraldry = cornerArms(G, L, 166, 32);
    return { scen: scen + heraldry, fig: back + hd.back + body + neck + hd.front };
  }

  // ---- the frame: vellum, the panel's ground, the rules, the corner squares; a cross for the dead
  MN.svg = function (p, size = 200, opts = {}) {
    const bust = size < 120 || !!opts.bust;
    const G = ctx(size, bust);
    MUTE = p.alive ? 1 : 2; PREC = size < 60 ? 1 : 10;
    let L, f;
    try { L = look(p); f = bust ? bustFig(G, L) : fullFig(G, L); } finally { MUTE = 1; PREC = 10; }
    const H = bust ? 200 : (PORTRAIT.H || 340), key = bust ? 'B' : 'F';
    G.use('c' + key); G.use(L.ground); G.use(bust || size < 60 ? 'sm' : 'sl');
    const groundFill = `url(#mn-${L.ground})`;
    const name = [p.given, p.sur].filter(x => typeof x === 'string').join(' ');
    const label = size >= 60 ? ` role="img" aria-label="${UI.esc(`Portrait of ${name || 'someone'}, ${Math.floor(L.age)}`)}"` : ' aria-hidden="true"';
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 ${H}" width="${size}" height="${Math.round(size * H / 200)}" class="portrait mini${bust ? '' : ' full'}" data-pose="${L.pose}"${label}>`;
    s += `<rect width="200" height="${H}" rx="3" fill="${VEL}"/><rect x="2" y="2" width="196" height="${H - 4}" rx="2" fill="none" stroke="${VELD}" stroke-width="2.5"/>`;
    s += `<g clip-path="url(#mn-c${key})"><path d="${PANEL[key]}" fill="${groundFill}"/>${f.scen}<g class="mn-fig" filter="url(#mn-${bust || size < 60 ? 'sm' : 'sl'})">${f.fig}</g></g>`;
    s += `<path d="${PANEL_OUT[key]}" fill="none" stroke="${INK}" stroke-width="${G.lw(.6)}"/><path d="${PANEL[key]}" fill="none" stroke="${INK}" stroke-width="${G.lw(1.7)}"/><path d="${PANEL_IN[key]}" fill="none" stroke="${VER}" stroke-width="${G.lw(.9)}"/>`;
    const sq = bust ? [[10, 190], [190, 190]] : [[10, 330], [190, 330], [10, 100], [190, 100]];
    for (const [x, y] of sq) s += `<rect x="${x - 3}" y="${y - 3}" width="6" height="6" fill="${INK}"/>`;
    if (!p.alive) s += `<path d="${bust ? 'M176 4v14M170 9h12' : 'M178 6v16M171 12h14'}" stroke="${VER}" stroke-width="${G.lw(2.2)}"/>`;
    s = s.replace('>', `><defs>${G.defs()}</defs>`);
    return s + '</svg>';
  };

  // ---- the setting, and the switch between the miniature and the release's paper doll
  const release = PORTRAIT.svg;
  MN.release = release;
  MN.errors = 0;
  PORTRAIT.svg = function (p, size = 200, opts = {}) {
    if (!p || !p.app || UI.set.miniatures === false) return release.apply(this, arguments);
    try { return MN.svg(p, size, opts || {}); } catch (e) { MN.errors++; MN.lastError = String(e && e.stack || e).slice(0, 300); MUTE = 1; PREC = 10; return release.apply(this, arguments); }
  };
  MN.menu = () => `<label class="row"><input type="checkbox" data-c="setMiniatures" ${UI.set.miniatures !== false ? 'checked' : ''}> Painted miniatures (portraits)</label>`;
  Object.assign(UI.C, {
    setMiniatures(el) { UI.set.miniatures = el.checked; UI.saveSettings(); UI.renderModal ? UI.renderModal() : UI.render(); },
  });
})();
