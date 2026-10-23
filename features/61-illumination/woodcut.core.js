// Woodcuts for events (Road to Ten, Visual art 5: "60 to 100 woodcut-style scenes for the most common event types:
// battle, court, market, road, wedding, death"). Each event shape (25-variety-guard's A.evShape: road, tavern, court,
// war ...) has a scene, drawn here in ink on paper as SVG, and varied by the season, the hour and a seed from the
// event and the year: the sky (sun, moon, stars, clouds, birds), the hills, which way it faces, and small things in
// the foreground. 24 shapes × the variations is the 60 to 100 the plan asks for; docs/art/style-guide.md is the hand.
//
// Rendering only: no random draws (the seed is a hash of ids), no state change.
(function () {
  const W = UI.WOODCUT = {
    INK: '#2b1d10', PAPER: '#ece0c4', SHADE: '#d6c39b', RED: '#9e2b1b', GOLD: '#b98a2a', BLUE: '#2f4a7a', GREEN: '#4d7456',
    n: 0,   // instance counter for unique pattern ids (UI-side only)
  };
  const I = W.INK, P = W.PAPER;
  // a small deterministic generator from a string
  W.seed = function (str) {
    let h = 2166136261;
    for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
  };
  const f = n => Math.round(n * 10) / 10;

  // ---- parts. Every part returns an SVG string; `p` is the pattern prefix of this picture
  const PART = W.PART = {};
  PART.defs = p => `<defs>
    <pattern id="${p}h1" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="${I}" stroke-width="1.1"/></pattern>
    <pattern id="${p}h2" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="3.2" stroke="${I}" stroke-width="1.2"/></pattern>
    <pattern id="${p}h3" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)"><line x1="0" y1="0" x2="0" y2="6" stroke="${I}" stroke-width="0.8"/></pattern>
    <pattern id="${p}x1" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0 V4 M0 0 H4" stroke="${I}" stroke-width="1"/></pattern>
    <pattern id="${p}sky" width="8" height="6" patternUnits="userSpaceOnUse"><line x1="0" y1="3" x2="8" y2="3" stroke="${I}" stroke-width="0.7"/></pattern>
    <pattern id="${p}skyn" width="8" height="3" patternUnits="userSpaceOnUse"><line x1="0" y1="1.5" x2="8" y2="1.5" stroke="${I}" stroke-width="1.3"/></pattern>
    <pattern id="${p}stone" width="24" height="12" patternUnits="userSpaceOnUse"><path d="M0 0 H24 M0 6 H24 M6 0 V6 M18 6 V12" stroke="${I}" stroke-width="0.7" fill="none"/></pattern>
    <clipPath id="${p}clip"><rect x="9" y="9" width="582" height="162"/></clipPath>
    <pattern id="${p}st" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.7" fill="${I}"/><circle cx="5.5" cy="5" r="0.5" fill="${I}"/></pattern>
    <radialGradient id="${p}pg" cx="50%" cy="45%" r="75%"><stop offset="60%" stop-color="${P}"/><stop offset="100%" stop-color="${W.SHADE}"/></radialGradient>
  </defs>`;
  // the block: paper, and a double rule round it with cut corners
  PART.paper = p => `<rect x="0" y="0" width="600" height="180" fill="url(#${p}pg)"/>`;
  PART.frame = () => `<rect x="3" y="3" width="594" height="174" fill="none" stroke="${I}" stroke-width="3"/>` +
    `<rect x="9" y="9" width="582" height="162" fill="none" stroke="${I}" stroke-width="1"/>` +
    [[9, 9], [591, 9], [9, 171], [591, 171]].map(([x, y]) => `<rect x="${x - 3}" y="${y - 3}" width="6" height="6" fill="${I}"/>`).join('');
  // the sky: a sun with rays by day, a moon and stars by night, clouds, a few birds
  PART.sky = (p, r, o) => {
    let s = '';
    if (o.night) {
      s += `<rect x="9" y="9" width="582" height="${o.horizon - 9}" fill="url(#${p}skyn)"/>`;
      const mx = 80 + r() * 440, my = 34 + r() * 18;
      s += `<circle cx="${f(mx)}" cy="${f(my)}" r="13" fill="${P}" stroke="${I}" stroke-width="1.5"/><circle cx="${f(mx + 6)}" cy="${f(my - 3)}" r="11" fill="${I}" opacity="0.9"/>`;
      for (let i = 0; i < 9; i++) { const x = 20 + r() * 560, y = 16 + r() * (o.horizon - 40); s += `<path d="M${f(x)} ${f(y - 3)} V${f(y + 3)} M${f(x - 3)} ${f(y)} H${f(x + 3)}" stroke="${P}" stroke-width="1.3"/>`; }
    } else if (o.storm) {
      s += `<rect x="9" y="9" width="582" height="${o.horizon - 9}" fill="url(#${p}skyn)" opacity="0.8"/>`;
    } else {
      s += `<rect x="9" y="9" width="582" height="${o.horizon - 9}" fill="url(#${p}sky)" opacity="0.75"/>`;
      const sx = 60 + r() * 480, sy = 36 + r() * 14, R = 12;
      s += `<circle cx="${f(sx)}" cy="${f(sy)}" r="${R + 17}" fill="${P}"/>`;
      let rays = '';
      for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r1 = R + 4, r2 = R + (i % 2 ? 9 : 14); rays += `M${f(sx + Math.cos(a) * r1)} ${f(sy + Math.sin(a) * r1)} L${f(sx + Math.cos(a) * r2)} ${f(sy + Math.sin(a) * r2)} `; }
      s += `<path d="${rays}" stroke="${I}" stroke-width="1.4"/><circle cx="${f(sx)}" cy="${f(sy)}" r="${R}" fill="${o.gold ? W.GOLD : P}" stroke="${I}" stroke-width="1.6"/>`;
    }
    const nc = o.storm ? 4 : Math.floor(r() * 3);
    for (let i = 0; i < nc; i++) s += PART.cloud(10 + r() * 520, 18 + r() * 30, 0.7 + r() * 0.6, o.storm ? `url(#${p}h2)` : P);
    if (!o.night && !o.storm) { const nb = Math.floor(r() * 4); for (let i = 0; i < nb; i++) { const x = 120 + r() * 380, y = 30 + r() * 40, w = 4 + r() * 3; s += `<path d="M${f(x - w)} ${f(y - 2)} Q${f(x - w / 2)} ${f(y - 4)} ${f(x)} ${f(y)} Q${f(x + w / 2)} ${f(y - 4)} ${f(x + w)} ${f(y - 2)}" fill="none" stroke="${I}" stroke-width="1.2"/>`; } }
    return s;
  };
  PART.cloud = (x, y, k, fill) => `<path transform="translate(${f(x)} ${f(y)}) scale(${f(k)})" d="M0 22 Q-2 10 12 10 Q16 0 30 4 Q40 -4 50 6 Q64 4 64 16 Q72 22 62 26 L4 26 Q-4 26 0 22 Z" fill="${fill}" stroke="${I}" stroke-width="1.4"/>`;
  // hills on the horizon (lightly hatched) and the ground in front (more densely)
  PART.land = (p, r, o) => {
    const H = o.horizon;
    let d = `M9 ${H}`;
    for (let x = 9; x <= 591; x += 48) d += ` Q${f(x + 24)} ${f(H - 10 - r() * 26)} ${f(x + 48)} ${f(H - r() * 6)}`;
    d += ` L591 171 L9 171 Z`;
    let s = `<path d="${d}" fill="url(#${p}h1)" stroke="${I}" stroke-width="1.6"/>`;
    s += `<path d="M9 ${H + 18} Q150 ${H + 8} 300 ${H + 16} T591 ${H + 12} L591 171 L9 171 Z" fill="${P}" stroke="${I}" stroke-width="1.6"/>`;
    for (let i = 0; i < 16; i++) { const x = 16 + r() * 568, y = H + 26 + r() * 22; s += `<path d="M${f(x)} ${f(y)} l-3 -6 M${f(x)} ${f(y)} l1 -8 M${f(x)} ${f(y)} l4 -5" stroke="${I}" stroke-width="1"/>`; }
    return s;
  };
  // the cut foot of the block: solid ink, with white grass cut into it
  PART.foot = (r) => {
    let s = `<path d="M9 171 V163 Q150 158 300 162 T591 161 V171 Z" fill="${I}"/>`;
    for (let i = 0; i < 40; i++) { const x = 12 + r() * 576; s += `<path d="M${f(x)} 170 l-2 -6 M${f(x + 2)} 170 l1 -7" stroke="${P}" stroke-width="0.9"/>`; }
    return s;
  };
  // a room: a stone wall, a lit window, floorboards
  PART.room = (p, r) => {
    const wx = 70 + r() * 60;
    return `<rect x="9" y="9" width="582" height="140" fill="url(#${p}stone)" opacity="0.55"/>` +
      `<path d="M${f(wx)} 110 V52 a26 26 0 0 1 52 0 V110 Z" fill="${P}" stroke="${I}" stroke-width="2.4"/><path d="M${f(wx + 26)} 26 V110 M${f(wx)} 70 H${f(wx + 52)}" stroke="${I}" stroke-width="1.6"/>` +
      Array.from({ length: 5 }, (_, i) => `<path d="M${f(wx + 26)} 110 L${f(wx - 30 + i * 28)} 148" stroke="${W.GOLD}" stroke-width="1" opacity="0.6"/>`).join('') +
      `<path d="M9 149 H591" stroke="${I}" stroke-width="2.4"/><rect x="9" y="149" width="582" height="22" fill="url(#${p}h3)"/>`;
  };
  PART.tree = (x, y, k, p) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(k)})"><path d="M-3 0 L-2 -24 L2 -24 L3 0 Z" fill="${I}"/>` +
    `<path d="M0 -60 Q20 -60 20 -44 Q30 -36 20 -26 Q14 -18 0 -22 Q-14 -18 -20 -26 Q-30 -36 -20 -44 Q-20 -60 0 -60 Z" fill="url(#${p}h2)" stroke="${I}" stroke-width="1.8"/></g>`;
  PART.pine = (x, y, k, p) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(k)})"><rect x="-2" y="-8" width="4" height="8" fill="${I}"/>` +
    `<path d="M0 -62 L12 -40 L6 -40 L18 -20 L10 -20 L22 -6 L-22 -6 L-10 -20 L-18 -20 L-6 -40 L-12 -40 Z" fill="url(#${p}h2)" stroke="${I}" stroke-width="1.6"/></g>`;
  // a half-timbered house
  PART.house = (x, y, w, h, p, o = {}) => {
    const roof = h * 0.75;
    let s = `<g transform="translate(${f(x)} ${f(y)})">`;
    s += `<rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" fill="${P}" stroke="${I}" stroke-width="2"/>`;
    s += `<path d="M${-w / 2} ${-h * 0.55} H${w / 2} M${-w / 2} ${-h} L${-w / 4} ${-h * 0.55} M${w / 2} ${-h} L${w / 4} ${-h * 0.55}" stroke="${I}" stroke-width="2"/>`;
    s += `<path d="M${-w / 2 - 6} ${-h} L0 ${-h - roof} L${w / 2 + 6} ${-h} Z" fill="url(#${p}h1)" stroke="${I}" stroke-width="2"/>`;
    s += `<rect x="-6" y="-20" width="12" height="20" fill="${I}"/>`;
    s += `<rect x="${w / 4 - 5}" y="${-h * 0.45}" width="10" height="9" fill="${o.lit ? W.GOLD : I}" stroke="${I}" stroke-width="1.5"/>`;
    if (o.chimney) s += `<rect x="${w / 4}" y="${-h - roof * 0.75}" width="7" height="${roof * 0.45}" fill="${I}"/><path d="M${w / 4 + 3} ${-h - roof * 0.8} q-8 -8 0 -14 q8 -6 0 -14" fill="none" stroke="${I}" stroke-width="1.3"/>`;
    return s + '</g>';
  };
  PART.church = (x, y, p) => `<g transform="translate(${f(x)} ${f(y)})">` +
    `<rect x="-46" y="-40" width="64" height="40" fill="${P}" stroke="${I}" stroke-width="2"/><path d="M-52 -40 L-14 -62 L24 -40 Z" fill="url(#${p}h1)" stroke="${I}" stroke-width="2"/>` +
    `<rect x="18" y="-78" width="26" height="78" fill="${P}" stroke="${I}" stroke-width="2"/><path d="M14 -78 L31 -124 L48 -78 Z" fill="url(#${p}h2)" stroke="${I}" stroke-width="2"/>` +
    `<circle cx="31" cy="-132" r="6" fill="${W.GOLD}" stroke="${I}" stroke-width="1.5"/><path d="M31 -64 a6 6 0 0 1 6 6 v10 h-12 v-10 a6 6 0 0 1 6 -6 Z" fill="${I}"/>` +
    `<path d="M-38 -28 a5 5 0 0 1 10 0 v14 h-10 Z M-18 -28 a5 5 0 0 1 10 0 v14 h-10 Z" fill="${I}"/><path d="M-6 0 v-16 a6 6 0 0 1 12 0 v16" fill="${I}"/></g>`;
  PART.castle = (x, y, k, p) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(k)})">` +
    `<rect x="-30" y="-46" width="60" height="46" fill="${P}" stroke="${I}" stroke-width="2"/>` +
    `<path d="M-30 -46 v-6 h8 v6 h7 v-6 h8 v6 h7 v-6 h8 v6 h7 v-6 h8 v6" fill="none" stroke="${I}" stroke-width="2"/>` +
    `<rect x="-44" y="-64" width="18" height="64" fill="url(#${p}h1)" stroke="${I}" stroke-width="2"/><rect x="26" y="-64" width="18" height="64" fill="url(#${p}h1)" stroke="${I}" stroke-width="2"/>` +
    `<path d="M-44 -64 v-5 h5 v5 h4 v-5 h5 v5 h4 v-5 M26 -64 v-5 h5 v5 h4 v-5 h5 v5 h4 v-5" fill="none" stroke="${I}" stroke-width="2"/>` +
    `<path d="M-8 0 v-18 a8 8 0 0 1 16 0 v18 Z" fill="${I}"/></g>`;
  PART.banner = (x, y, h, color, flip) => `<g transform="translate(${f(x)} ${f(y)}) scale(${flip ? -1 : 1} 1)"><line x1="0" y1="0" x2="0" y2="${-h}" stroke="${I}" stroke-width="2.5"/>` +
    `<path d="M0 ${-h + 2} Q14 ${-h - 4} 32 ${-h + 4} L24 ${-h + 13} L32 ${-h + 22} Q14 ${-h + 16} 0 ${-h + 22} Z" fill="${color}" stroke="${I}" stroke-width="1.6"/><circle cx="0" cy="${-h - 3}" r="2.5" fill="${I}"/></g>`;
  PART.sword = (cx, cy, len, deg) => `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${deg})"><path d="M-3 ${-len / 2} L0 ${-len / 2 - 8} L3 ${-len / 2} L3 ${len / 2 - 22} L-3 ${len / 2 - 22} Z" fill="${P}" stroke="${I}" stroke-width="1.6"/>` +
    `<line x1="0" y1="${-len / 2}" x2="0" y2="${len / 2 - 24}" stroke="${I}" stroke-width="0.8"/><rect x="-14" y="${len / 2 - 22}" width="28" height="5" fill="${I}"/><rect x="-2.5" y="${len / 2 - 17}" width="5" height="13" fill="${I}"/><circle cx="0" cy="${len / 2 - 2}" r="4" fill="${I}"/></g>`;
  PART.shield = (cx, cy, k, color, p) => `<g transform="translate(${f(cx)} ${f(cy)}) scale(${f(k)})"><path d="M-22 -26 H22 V0 Q22 20 0 30 Q-22 20 -22 0 Z" fill="${color}" stroke="${I}" stroke-width="2.4"/>` +
    `<path d="M-22 -26 H22 V0 Q22 20 0 30 Q-22 20 -22 0 Z" fill="url(#${p}h3)" opacity="0.5"/><path d="M-14 -16 L0 0 L14 -16" fill="none" stroke="${P}" stroke-width="4"/></g>`;
  PART.tent = (x, y, k, p, color) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(k)})"><path d="M-34 0 L0 -44 L34 0 Z" fill="url(#${p}h1)" stroke="${I}" stroke-width="2"/>` +
    `<path d="M-8 0 L0 -18 L8 0 Z" fill="${I}"/><line x1="0" y1="-44" x2="0" y2="-58" stroke="${I}" stroke-width="2"/><path d="M0 -58 L14 -54 L0 -50 Z" fill="${color}" stroke="${I}" stroke-width="1"/></g>`;
  PART.cart = (x, y, p) => `<g transform="translate(${f(x)} ${f(y)})"><path d="M-40 -26 H34 L30 -10 H-36 Z" fill="url(#${p}h1)" stroke="${I}" stroke-width="2"/><line x1="34" y1="-18" x2="62" y2="-12" stroke="${I}" stroke-width="2.5"/>` +
    `<circle cx="-18" cy="-6" r="12" fill="${P}" stroke="${I}" stroke-width="2.4"/><path d="M-30 -6 H-6 M-18 -18 V6 M-26 -14 L-10 2 M-26 2 L-10 -14" stroke="${I}" stroke-width="1.3"/>` +
    `<path d="M-38 -26 Q-30 -44 -6 -40 Q14 -48 30 -28" fill="${P}" stroke="${I}" stroke-width="1.6"/></g>`;
  PART.road = (p, o) => `<path d="M220 171 Q290 ${o.horizon + 30} 296 ${o.horizon + 8} L304 ${o.horizon + 8} Q330 ${o.horizon + 30} 400 171 Z" fill="${P}" stroke="${I}" stroke-width="1.6"/>` +
    `<path d="M300 ${o.horizon + 14} V${o.horizon + 22} M300 ${o.horizon + 34} V${o.horizon + 46} M300 ${o.horizon + 60} V171" stroke="${I}" stroke-width="1.2" stroke-dasharray="3 5"/>`;
  PART.sea = (p, r, o) => { let s = `<rect x="9" y="${o.horizon}" width="582" height="${171 - o.horizon}" fill="${P}"/>`; for (let i = 0; i < 9; i++) { const y = o.horizon + 6 + i * 6; s += `<path d="M9 ${y} ` + Array.from({ length: 16 }, (_, k) => `q18 ${-4 - (i % 2)} 36 0`).join(' ') + `" fill="none" stroke="${I}" stroke-width="${0.6 + i * 0.12}" transform="translate(${f(-r() * 30)} 0)"/>`; } return s; };
  PART.ship = (x, y, k, p, color) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(k)})"><path d="M-46 -12 H46 L34 6 H-36 Z" fill="url(#${p}h2)" stroke="${I}" stroke-width="2"/>` +
    `<line x1="0" y1="-12" x2="0" y2="-78" stroke="${I}" stroke-width="2.6"/><path d="M-28 -70 Q0 -60 28 -70 L28 -24 Q0 -32 -28 -24 Z" fill="${P}" stroke="${I}" stroke-width="2"/>` +
    `<path d="M-10 -58 H10 M0 -66 V-30" stroke="${color}" stroke-width="4"/><path d="M0 -78 L16 -74 L0 -70 Z" fill="${color}" stroke="${I}" stroke-width="1"/></g>`;

  // the scene for each shape: given the pattern prefix, the generator and the options, the foreground
  const SC = W.SCENE = {};
  SC.travel = (p, r, o) => o.sea ? PART.ship(300, 150, 1, p, W.RED) + PART.ship(470, o.horizon + 8, 0.4, p, W.BLUE) : PART.road(p, o) + PART.castle(470, o.horizon - 2, 0.55, p) + PART.tree(120, 150, 1, p) + PART.cart(300 + (r() < 0.5 ? -110 : 110), 160, p) + `<rect x="410" y="128" width="10" height="22" fill="${P}" stroke="${I}" stroke-width="1.6"/><path d="M410 128 a5 5 0 0 1 10 0" fill="${P}" stroke="${I}" stroke-width="1.6"/>`;
  SC.tavern = (p, r, o) => PART.house(250, 162, 120, 70, p, { lit: true, chimney: true }) + `<line x1="316" y1="104" x2="350" y2="104" stroke="${I}" stroke-width="2.5"/><line x1="340" y1="104" x2="340" y2="110" stroke="${I}" stroke-width="1.5"/>` +
    `<path d="M328 110 h24 v24 h-24 Z" fill="${P}" stroke="${I}" stroke-width="2"/><path d="M334 116 h10 v12 h-10 Z M344 119 q5 0 5 4 q0 4 -5 4" fill="none" stroke="${I}" stroke-width="2"/>` +
    `<ellipse cx="400" cy="152" rx="15" ry="18" fill="url(#${p}h1)" stroke="${I}" stroke-width="2"/><path d="M386 144 h28 M386 160 h28" stroke="${I}" stroke-width="1.6"/>` + PART.tree(470, 160, 0.8, p);
  SC.court = (p, r, o) => `<rect x="150" y="40" width="300" height="131" fill="url(#${p}h3)" opacity="0.5"/>` +
    [170, 238, 362, 430].map(x => `<rect x="${x - 10}" y="44" width="20" height="127" fill="${P}" stroke="${I}" stroke-width="2"/><path d="M${x - 14} 44 h28 v6 h-28 Z M${x - 14} 165 h28 v6 h-28 Z" fill="${I}"/>`).join('') +
    `<path d="M248 44 Q300 4 352 44" fill="none" stroke="${I}" stroke-width="2.5"/><path d="M262 171 v-18 h76 v18 Z" fill="url(#${p}h1)" stroke="${I}" stroke-width="2"/>` +
    `<path d="M278 153 v-54 q22 -16 44 0 v54 Z" fill="${W.RED}" stroke="${I}" stroke-width="2.4"/><path d="M286 112 q14 -8 28 0" fill="none" stroke="${W.GOLD}" stroke-width="3"/>` +
    `<path d="M288 92 l6 -10 l6 6 l6 -6 l6 10 Z" fill="${W.GOLD}" stroke="${I}" stroke-width="1.4"/>` + PART.banner(200, 150, 90, W.BLUE) + PART.banner(400, 150, 90, W.BLUE, true);
  SC.war = (p, r, o) => PART.tent(150, 160, 1, p, W.RED) + PART.tent(470, 160, 0.9, p, W.BLUE) + PART.tent(300, o.horizon + 6, 0.5, p, W.RED) +
    PART.banner(240, 168, 110, W.RED) + PART.banner(360, 168, 110, W.BLUE, true) + PART.sword(300, 132, 96, 35) + PART.sword(300, 132, 96, -35) + PART.shield(300, 140, 0.9, W.GOLD, p);
  SC.fight = (p, r, o) => PART.sword(300, 104, 140, 40) + PART.sword(300, 104, 140, -40) + PART.shield(300, 110, 1.4, W.RED, p) + PART.tree(110, 160, 0.9, p) + PART.tree(500, 160, 1.1, p);
  SC.money = (p, r, o) => `<line x1="300" y1="56" x2="300" y2="160" stroke="${I}" stroke-width="4"/><path d="M270 164 h60 l-8 -8 h-44 Z" fill="${I}"/><line x1="230" y1="68" x2="370" y2="68" stroke="${I}" stroke-width="3.5"/><circle cx="300" cy="62" r="6" fill="${W.GOLD}" stroke="${I}" stroke-width="1.5"/>` +
    [[234, 1], [366, -1]].map(([x]) => `<path d="M${x} 68 L${x - 20} 108 M${x} 68 L${x + 20} 108" stroke="${I}" stroke-width="1.2"/><path d="M${x - 26} 108 Q${x} 124 ${x + 26} 108 Z" fill="${P}" stroke="${I}" stroke-width="2"/>`).join('') +
    `<ellipse cx="234" cy="104" rx="10" ry="3" fill="${W.GOLD}" stroke="${I}" stroke-width="1.2"/><ellipse cx="234" cy="100" rx="10" ry="3" fill="${W.GOLD}" stroke="${I}" stroke-width="1.2"/>` +
    [0, 1, 2, 3, 4].map(i => `<ellipse cx="150" cy="${160 - i * 5}" rx="14" ry="4" fill="${W.GOLD}" stroke="${I}" stroke-width="1.4"/>`).join('') + [0, 1, 2].map(i => `<ellipse cx="180" cy="${162 - i * 5}" rx="14" ry="4" fill="${W.GOLD}" stroke="${I}" stroke-width="1.4"/>`).join('') +
    `<path d="M440 164 Q420 164 424 140 Q428 124 446 122 L438 112 h24 l-8 10 Q474 124 476 140 Q480 164 460 164 Z" fill="url(#${p}h1)" stroke="${I}" stroke-width="2"/><path d="M440 122 h20" stroke="${W.RED}" stroke-width="3"/>`;
  SC.kin = (p, r, o) => PART.house(300, 162, 130, 72, p, { lit: true, chimney: true }) + PART.tree(160, 162, 1.1, p) + PART.tree(450, 162, 0.9, p) +
    `<path d="M380 168 q10 -16 24 -14 q12 2 14 14 Z" fill="url(#${p}h1)" stroke="${I}" stroke-width="1.6"/><path d="M196 168 h40 M200 168 v-14 M232 168 v-14 M196 156 h40" stroke="${I}" stroke-width="2"/>`;
  SC.work = (p, r, o) => `<path d="M240 120 h120 q-10 14 -40 16 v22 h22 v6 h-84 v-6 h22 v-22 q-30 -2 -40 -16 Z" fill="${I}"/><path d="M246 124 h108" stroke="${P}" stroke-width="1.2"/>` +
    `<g transform="rotate(-28 340 92)"><rect x="300" y="88" width="60" height="7" fill="${P}" stroke="${I}" stroke-width="1.6"/><rect x="352" y="76" width="16" height="30" fill="${I}"/></g>` +
    Array.from({ length: 9 }, (_, i) => { const a = -Math.PI * (0.15 + i * 0.08), x = 300 + Math.cos(a) * (24 + (i % 3) * 10), y = 118 + Math.sin(a) * (24 + (i % 3) * 10); return `<path d="M${f(x)} ${f(y)} l${f(Math.cos(a) * 7)} ${f(Math.sin(a) * 7)}" stroke="${W.RED}" stroke-width="2"/>`; }).join('') +
    PART.house(130, 162, 90, 60, p, { chimney: true }) + `<path d="M440 164 l20 -40 l20 40 Z M452 140 h16" fill="url(#${p}h1)" stroke="${I}" stroke-width="2"/>`;
  SC.faith = (p, r, o) => PART.church(300, 168, p) + PART.tree(150, 164, 1, p) + PART.pine(470, 166, 1, p) + `<path d="M190 168 v-16 h-6 h12 M440 168 v-14 h-5 h10" stroke="${I}" stroke-width="2"/>`;
  SC.food = (p, r, o) => `<path d="M140 132 h320 l-8 8 h-304 Z" fill="${I}"/><path d="M156 140 v28 M444 140 v28" stroke="${I}" stroke-width="5"/>` +
    `<path d="M200 130 q-4 -24 30 -26 q34 2 30 26 Z" fill="${W.GOLD}" stroke="${I}" stroke-width="2"/><path d="M212 116 l8 -6 M226 112 l8 -6 M240 114 l8 -6" stroke="${I}" stroke-width="1.6"/>` +
    `<path d="M300 130 v-30 q-10 -4 0 -14 h18 q10 10 0 14 v30 Z" fill="url(#${p}h1)" stroke="${I}" stroke-width="2"/><path d="M318 104 q12 2 8 14" fill="none" stroke="${I}" stroke-width="2"/>` +
    `<path d="M352 124 q30 -16 60 0 q-30 14 -60 0 Z M412 124 l14 -8 v16 Z" fill="${P}" stroke="${I}" stroke-width="2"/><circle cx="366" cy="122" r="2" fill="${I}"/><path d="M378 116 q6 8 0 16 M390 116 q6 8 0 16" fill="none" stroke="${I}" stroke-width="1"/>`;
  SC.sickness = (p, r, o) => `<path d="M170 168 v-40 h40 v-14 h200 v54" fill="${P}" stroke="${I}" stroke-width="2"/><path d="M210 132 h200 v18 h-200 Z" fill="url(#${p}h1)" stroke="${I}" stroke-width="2"/>` +
    `<ellipse cx="190" cy="124" rx="16" ry="10" fill="${P}" stroke="${I}" stroke-width="2"/><path d="M450 168 l-12 -30 h40 l-12 30 Z" fill="url(#${p}h2)" stroke="${I}" stroke-width="2"/>` +
    `<path d="M452 138 q-6 -20 4 -34 M460 138 q2 -22 14 -30 M468 138 q8 -14 20 -18" fill="none" stroke="${W.GREEN}" stroke-width="2.4"/><rect x="118" y="132" width="10" height="36" fill="${P}" stroke="${I}" stroke-width="1.6"/><path d="M123 132 q-6 -10 0 -18 q6 8 0 18" fill="${W.GOLD}" stroke="${I}" stroke-width="1.2"/>`;
  SC.letter = (p, r, o) => `<path d="M190 70 h220 v96 h-220 Z" fill="${P}" stroke="${I}" stroke-width="2.4"/><path d="M190 70 L300 128 L410 70" fill="none" stroke="${I}" stroke-width="2"/>` +
    `<circle cx="300" cy="128" r="16" fill="${W.RED}" stroke="${I}" stroke-width="2"/><path d="M292 128 l8 -8 l8 8 l-8 8 Z" fill="none" stroke="${P}" stroke-width="1.6"/>` +
    `<path d="M440 166 l10 -26 h24 l10 26 Z" fill="${I}"/><path d="M462 140 L520 40 q6 10 -4 26 q-20 28 -50 74" fill="${P}" stroke="${I}" stroke-width="1.6"/><path d="M470 120 l32 -56" stroke="${I}" stroke-width="0.8"/>`;
  SC.learning = (p, r, o) => `<path d="M200 150 q50 -14 100 0 q50 -14 100 0 v-74 q-50 -14 -100 0 q-50 -14 -100 0 Z" fill="${P}" stroke="${I}" stroke-width="2.4"/><path d="M300 76 v74" stroke="${I}" stroke-width="2"/>` +
    [92, 102, 112, 122, 132].map(y => `<path d="M214 ${y} q36 -8 74 0 M312 ${y} q36 -8 74 0" fill="none" stroke="${I}" stroke-width="1"/>`).join('') +
    `<path d="M220 88 h18 v18 h-18 Z" fill="${W.RED}" stroke="${I}" stroke-width="1.2"/>` +
    `<rect x="130" y="110" width="12" height="54" fill="${P}" stroke="${I}" stroke-width="1.6"/><path d="M136 110 q-8 -12 0 -22 q8 10 0 22" fill="${W.GOLD}" stroke="${I}" stroke-width="1.4"/><path d="M120 168 h32" stroke="${I}" stroke-width="3"/>` +
    `<path d="M440 166 l8 -20 h20 l8 20 Z" fill="${I}"/><path d="M458 146 L500 70 q6 10 -2 22 q-16 26 -36 54" fill="${P}" stroke="${I}" stroke-width="1.6"/>`;
  SC.subordinate = (p, r, o) => PART.castle(300, 168, 1.35, p) + PART.banner(241, 75, 46, W.RED) + PART.banner(359, 75, 46, W.RED, true) + PART.tree(130, 166, 1, p) + PART.tree(480, 166, 0.85, p);
  SC.beast = (p, r, o) => [70, 130, 190, 410, 470, 530].map((x, i) => PART.pine(x, 168 - (i % 2) * 6, 1.3 + (i % 3) * 0.15, p)).join('') +
    `<path d="M240 171 Q300 70 360 171 Z" fill="${I}"/>` + [[284, 132], [316, 132]].map(([x, y]) => `<path d="M${x - 7} ${y} q7 -6 14 0 q-7 5 -14 0 Z" fill="${W.GOLD}"/>`).join('') +
    `<path d="M260 171 l10 -16 l6 16 M330 171 l8 -18 l8 18" fill="${I}"/>`;
  SC.death = (p, r, o) => `<path d="M200 171 q100 -40 200 0 Z" fill="url(#${p}h2)" stroke="${I}" stroke-width="2"/><path d="M282 140 V84 a18 18 0 0 1 36 0 V140 Z" fill="${P}" stroke="${I}" stroke-width="3"/>` +
    `<path d="M290 96 h20 M290 106 h20 M290 116 h14" stroke="${I}" stroke-width="1.4"/><path d="M270 140 q30 -6 60 0" fill="none" stroke="${W.GREEN}" stroke-width="3"/>` + PART.tree(470, 166, 1.2, p) +
    `<path d="M470 92 q10 -10 22 -4 q-4 -8 6 -8 l6 6 l-8 4 q2 8 -10 10 Z" fill="${I}"/><rect x="146" y="136" width="10" height="30" fill="${P}" stroke="${I}" stroke-width="1.6"/><path d="M151 136 q-6 -10 0 -18 q6 8 0 18" fill="${W.GOLD}" stroke="${I}" stroke-width="1.2"/>`;
  SC.play = (p, r, o) => `<path d="M200 140 h200 l-20 26 h-160 Z" fill="url(#${p}h1)" stroke="${I}" stroke-width="2"/><rect x="250" y="80" width="100" height="60" fill="${P}" stroke="${I}" stroke-width="2"/>` +
    `<rect x="262" y="88" width="76" height="44" fill="none" stroke="${I}" stroke-width="1.6"/><rect x="276" y="98" width="48" height="24" fill="none" stroke="${I}" stroke-width="1.6"/><path d="M300 88 v10 M300 122 v10 M262 110 h14 M324 110 h14" stroke="${I}" stroke-width="1.6"/>` +
    [[262, 88], [300, 88], [338, 132], [276, 122], [324, 98]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="5" fill="${i % 2 ? P : I}" stroke="${I}" stroke-width="1.4"/>`).join('') +
    `<path d="M160 128 l18 -6 l12 12 l-18 6 Z M160 128 v18 l12 12 v-18 M190 134 v18 l-18 6" fill="${P}" stroke="${I}" stroke-width="1.6"/><circle cx="175" cy="130" r="1.8" fill="${I}"/><circle cx="166" cy="142" r="1.6" fill="${I}"/><circle cx="182" cy="148" r="1.6" fill="${I}"/>` +
    `<path d="M430 128 l18 -6 l12 12 l-18 6 Z M430 128 v18 l12 12 v-18 M460 134 v18 l-18 6" fill="${P}" stroke="${I}" stroke-width="1.6"/><circle cx="445" cy="130" r="1.8" fill="${I}"/>`;
  SC.love = (p, r, o) => `<path d="M300 152 q-6 -40 4 -82" fill="none" stroke="${W.GREEN}" stroke-width="3"/><path d="M302 120 q-22 -6 -26 -24 q20 0 26 24 M304 104 q20 -8 30 -26 q-22 4 -30 26" fill="${W.GREEN}" stroke="${I}" stroke-width="1.2"/>` +
    `<path d="M304 70 q-22 -2 -20 -20 q4 -16 20 -10 q16 -6 20 10 q2 18 -20 20 Z" fill="${W.RED}" stroke="${I}" stroke-width="2"/><path d="M296 56 q8 -8 16 0 q-8 6 -16 0" fill="none" stroke="${I}" stroke-width="1.2"/>` +
    `<circle cx="200" cy="128" r="22" fill="none" stroke="${W.GOLD}" stroke-width="7"/><circle cx="200" cy="128" r="22" fill="none" stroke="${I}" stroke-width="1.4"/><circle cx="230" cy="128" r="22" fill="none" stroke="${W.GOLD}" stroke-width="7"/><circle cx="230" cy="128" r="22" fill="none" stroke="${I}" stroke-width="1.4"/>` +
    PART.tree(470, 166, 1.1, p) + `<path d="M120 168 q100 -12 180 -4" fill="none" stroke="${W.RED}" stroke-width="3"/>`;
  SC.weather = (p, r, o) => PART.tree(300, 168, 1.4, p).replace('scale(1.4)', 'scale(1.4) skewX(-12)') +
    Array.from({ length: 34 }, (_, i) => { const x = 20 + (i * 17) % 570, y = 60 + (i * 23) % 70; return `<path d="M${x} ${y} l-6 14" stroke="${I}" stroke-width="1.2"/>`; }).join('') +
    `<path d="M430 40 l-14 30 h12 l-16 34 l30 -40 h-12 l14 -24 Z" fill="${W.GOLD}" stroke="${I}" stroke-width="1.6"/>`;
  SC.menace = (p, r, o) => `<rect x="9" y="9" width="582" height="162" fill="url(#${p}h3)" opacity="0.6"/>` + PART.house(150, 168, 110, 90, p) + PART.house(450, 168, 110, 96, p) +
    `<path d="M240 171 v-96 a60 60 0 0 1 120 0 v96 Z" fill="${I}"/><path d="M300 171 q-16 -8 -18 -40 q-2 -24 18 -28 q20 4 18 28 q-2 32 -18 40 Z" fill="${P}" opacity="0.15"/>` +
    `<path d="M292 104 q8 -14 16 0 l2 30 h-20 Z" fill="${P}" opacity="0.25"/><path d="M318 132 l14 22 l-4 2 l-14 -22 Z" fill="${P}"/>`;
  SC.errand = (p, r, o) => PART.road(p, o) + `<line x1="400" y1="168" x2="400" y2="70" stroke="${I}" stroke-width="5"/><path d="M400 76 h30 v10" fill="none" stroke="${I}" stroke-width="3"/>` +
    `<path d="M418 86 h24 l-4 34 h-16 Z" fill="${W.GOLD}" stroke="${I}" stroke-width="2"/><path d="M424 120 h12 l2 6 h-16 Z M424 86 l6 -8 l6 8" fill="${I}"/>` + PART.house(150, 160, 90, 56, p, { lit: true }) + PART.tree(500, 162, 0.9, p);
  SC.favor = (p, r, o) => `<path d="M160 146 h120 q10 -8 0 -16 h-120 q-10 8 0 16 Z" fill="${W.RED}" stroke="${I}" stroke-width="2"/><path d="M164 138 h112" stroke="${W.GOLD}" stroke-width="1.6" stroke-dasharray="4 3"/>` +
    `<circle cx="220" cy="118" r="14" fill="none" stroke="${W.GOLD}" stroke-width="6"/><circle cx="220" cy="118" r="14" fill="none" stroke="${I}" stroke-width="1.3"/><path d="M212 102 l8 -9 l8 9 Z" fill="${W.RED}" stroke="${I}" stroke-width="1.2"/>` +
    `<path d="M330 60 h130 v84 h-130 Z" fill="${P}" stroke="${I}" stroke-width="2.2"/><path d="M330 60 q-10 6 0 12 M460 132 q10 6 0 12" fill="none" stroke="${I}" stroke-width="2"/>` +
    [76, 86, 96, 106].map(y => `<path d="M344 ${y} h${y === 106 ? 60 : 102}" stroke="${I}" stroke-width="1"/>`).join('') +
    `<path d="M410 128 l-6 26 l10 -8 l6 10 l2 -28" fill="${W.RED}" stroke="${I}" stroke-width="1.2"/><circle cx="416" cy="124" r="11" fill="${W.RED}" stroke="${I}" stroke-width="1.8"/>`;
  SC.crime = (p, r, o) => `<rect x="9" y="9" width="582" height="162" fill="url(#${p}h3)" opacity="0.45"/>` + PART.house(470, 168, 120, 84, p) +
    `<path d="M220 156 q-20 0 -16 -26 q4 -18 24 -22 l-8 -12 h32 l-8 12 q20 4 24 22 q4 26 -16 26 Z" fill="url(#${p}h1)" stroke="${I}" stroke-width="2"/><path d="M220 108 h24" stroke="${W.RED}" stroke-width="3"/>` +
    `<path d="M248 120 l60 -40" stroke="${I}" stroke-width="1.4" stroke-dasharray="3 3"/>` + PART.sword(320, 104, 60, 50).replace(/rect x="-14"/, 'rect x="-8"').replace(/width="28"/, 'width="16"');
  SC.street = (p, r, o) => [80, 170, 260, 350, 440, 520].map((x, i) => PART.house(x, 168, 80, 54 + (i * 13) % 30, p, { lit: i % 2 === 1, chimney: i % 3 === 0 })).join('');
  // a manuscript rosette for scenes with no shape
  SC.none = (p, r, o) => `<circle cx="300" cy="96" r="54" fill="none" stroke="${I}" stroke-width="2.4"/><circle cx="300" cy="96" r="46" fill="none" stroke="${I}" stroke-width="1"/>` +
    Array.from({ length: 8 }, (_, i) => `<path transform="rotate(${i * 45} 300 96)" d="M300 96 q12 -20 0 -44 q-12 24 0 44" fill="${i % 2 ? W.RED : W.BLUE}" stroke="${I}" stroke-width="1.4"/>`).join('') +
    `<circle cx="300" cy="96" r="8" fill="${W.GOLD}" stroke="${I}" stroke-width="1.6"/>`;
  // which scenes stand on land, under a sky; and which ones darken it
  const NIGHT = new Set(['tavern', 'menace', 'crime', 'errand']);
  const NO_LAND = new Set(['court', 'letter', 'learning', 'money', 'play', 'food', 'sickness', 'favor', 'none']);
  W.SHAPES = Object.keys(SC);
  W.LABEL = { travel: 'a road', tavern: 'a tavern', court: 'a hall of state', war: 'a camp of war', fight: 'crossed swords', money: 'scales and coin',
    kin: 'a family house', work: 'an anvil', faith: 'a church', food: 'a laid table', sickness: 'a sickbed', letter: 'a sealed letter', learning: 'an open book',
    subordinate: 'a lord\'s keep', beast: 'eyes in the forest', death: 'a grave', play: 'a game board and dice', love: 'a rose and two rings',
    weather: 'a storm', menace: 'a dark archway', errand: 'a lantern on the road', favor: 'a signet ring offered', crime: 'a cut purse', street: 'a street', none: 'an ornament' };

  // the woodcut for an event. key: a string the variations are seeded from (the event id and year); month 0-11
  W.svg = function (shape, key, month) {
    const sc = SC[shape] ? shape : 'none', p = 'wc' + (W.n++) + '_', r = W.seed(sc + '|' + key);
    const o = { horizon: 118, night: NIGHT.has(sc), storm: sc === 'weather', gold: sc === 'faith' || sc === 'court' };
    let body = PART.paper(p);
    o.sea = sc === 'travel' && r() < 0.3;
    if (!NO_LAND.has(sc)) { body += PART.sky(p, r, o); body += o.sea ? PART.sea(p, r, o) : PART.land(p, r, o); }
    else body += PART.room(p, r);
    // winter lays snow on the ground; autumn drops leaves
    const season = month == null ? 1 : [0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 0][month];
    body += SC[sc](p, r, o);
    if (!NO_LAND.has(sc) && !o.sea) body += PART.foot(r);
    if (season === 0 && !NO_LAND.has(sc)) for (let i = 0; i < 26; i++) { const x = 14 + r() * 572, y = 14 + r() * 100; body += `<path d="M${f(x - 2.5)} ${f(y)} h5 M${f(x)} ${f(y - 2.5)} v5 M${f(x - 1.8)} ${f(y - 1.8)} l3.6 3.6 M${f(x - 1.8)} ${f(y + 1.8)} l3.6 -3.6" stroke="${I}" stroke-width="0.7"/>`; }
    if (season === 3 && !NO_LAND.has(sc)) for (let i = 0; i < 10; i++) { const x = 20 + r() * 560, y = 130 + r() * 36; body += `<path d="M${f(x)} ${f(y)} q4 -5 8 0 q-4 4 -8 0" fill="${W.GOLD}" stroke="${I}" stroke-width="0.7"/>`; }
    const flip = r() < 0.5 && !['letter', 'learning', 'money', 'favor', 'court'].includes(sc);
    const inner = `<g clip-path="url(#${p}clip)">${flip ? `<g transform="translate(600 0) scale(-1 1)">${body}</g>` : body}</g>`;
    return `<svg class="woodcut" viewBox="0 0 600 180" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${UI.esc('Woodcut: ' + (W.LABEL[sc] || 'a scene'))}" xmlns="http://www.w3.org/2000/svg">${PART.defs(p)}${inner}${PART.frame()}</svg>`;
  };
  // the shape of a queued event's scene: its own (25-variety-guard), or, for the fifth of events with none and for
  // scenes queued by features, a guess from its own words. The first rule that matches wins.
  W.GUESS = [
    ['letter', /\b(a letter|letters? (?:comes?|arrives?)|sealed|courier|messenger|writes? to you)\b/i],
    ['death', /\b(dead|death|dies|died|funeral|grave|buried|burial|corpse|mourn)/i],
    ['sickness', /\b(fever|sick|illness|plague|physician|herbs?|cough|wound(?:ed)?)\b/i],
    ['war', /\b(army|muster|battle|siege|soldiers?|camp|host|levy|war)\b/i],
    ['fight', /\b(sword|blade|duel|fight|knife|brawl|blows?)\b/i],
    ['beast', /\b(wolf|wolves|bear|boar|beast|hounds?)\b/i],
    ['weather', /\b(storm|snow|rain|flood|frost|winter)\b/i],
    ['crime', /\b(thief|thieves|steal|stole|theft|rob|smuggl\w*|forg(?:e|ed|ery) (?:a |the )?(?:charter|seal))\b/i],
    ['learning', /\b(book|read|reading|tutor|scholar|ink|study|lesson|school|learn\w*|letters)\b/i],
    ['faith', /\b(priest|temple|shrine|pray\w*|church|monk|abbey|abbot|holy|chapel|synod|relic)\b/i],
    ['court', /\b(court|council|king|queen|throne|crown|emperor|steward|herald|charter)\b/i],
    ['love', /\b(love|kiss|marry|married|wedding|betroth\w*|bride)\b/i],
    ['money', /\b(coin|debt|pay|paid|purse|tax|tithe|price|merchant|trade|sell|sold|buy|suns|estate|dowry)\b/i],
    ['tavern', /\b(tavern|ale|inn|drunk|drink)\b/i],
    ['work', /\b(forge|smith|workshop|craft|harvest|plough|field|mine|mill)\b/i],
    ['food', /\b(bread|feast|meal|supper|eat|table)\b/i],
    ['travel', /\b(road|journey|travel|ride|ship|sail|caravan|port|harbour)\b/i],
    ['kin', /\b(father|mother|brother|sister|son|daughter|child|wife|husband|family|baby|cousin|heir)\b/i],
    ['street', /\b(street|town|square|crowd|lane)\b/i],
  ];
  W.guess = function (text) {
    for (const [shape, re] of W.GUESS) if (re.test(text || '')) return shape;
    return 'none';
  };
  W.shapeOf = function (q, view) {
    const e = q && A.EV[q.ev];
    if (!e) return 'none';
    let s = null;
    try { s = A.evShape ? A.evShape(e) : null; } catch (err) { s = null; }
    if (s && SC[s]) return s;
    const v = view || q.view || {};
    return W.guess((v.title || '') + ' ' + (v.text || ''));
  };
})();
