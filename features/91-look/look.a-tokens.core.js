// 91-look, part 1: the design tokens of docs/design/brief.md ("Woodblock & Light"), §1 colour, §2 type, §3 space,
// shape and depth, §6 motion. Two token sets, Night (dark) and Washi (light), are written as CSS variables and mapped
// onto the release's own names (--bg-0, --surface-1, --text-1, --accent ...), so every screen of the old UI takes the
// new colours at once. The theme switch is the release's own: UI.applySettings sets <html data-theme="dark|light">.
//
// Also here: the stat, vital, odds-band and rarity palettes, and UI.realmInk(hex, theme), the pure, memoized helper that
// turns a realm's raw colour into a swatch, a tint, an ink that passes AA on every surface, and a glow.
//
// Nothing here reads or writes the game state, and nothing draws a random number.
const LOOK = UI.LOOK = UI.LOOK || { css: {} };
const T = px => `calc(${px}px * var(--tx, 1))`;
LOOK.T = T;

// ---- the two token sets (brief §1; every text token AA on every surface it can sit on, see test.mjs tokensContrast)
LOOK.THEMES = {
  dark: {
    '--bg': '#0d1120', '--surface': '#141a2c', '--raised': '#1b2338', '--raised-hover': '#222b44', '--overlay': '#232c46', '--sunken': '#0a0d18',
    '--line': '#2c3654', '--line-strong': '#6e7bab', '--ink': '#eee8da', '--ink-2': '#bdb8cc', '--ink-3': '#9a9cb8', '--focus': '#ffe08a',
    '--shade': '#3a2f6b', '--line-ink': '#1b1730',
    '--accent': '#f0c062', '--accent-strong': '#ffd98a', '--accent-fill': '#e8b04a', '--accent-fill-hover': '#f3c56a', '--accent-fill-press': '#d59f3f',
    '--accent-fill-line': '#e8b04a', '--on-accent': '#1a1206', '--accent-glow': 'rgba(240,192,98,.30)', '--accent-tint': 'rgba(240,192,98,.14)', '--accent-rule': 'rgba(240,192,98,.45)',
    '--danger': '#ff8a73', '--danger-fill': '#c23c27', '--danger-line': '#ff8a73', '--ok': '#6fd49a', '--warn': '#f5c451', '--info': '#8cc0ff',
    '--crown-ink': '#c9aae0', '--blood-ink': '#f08fb5', '--lore-ink': '#a9c3dc', '--war-ink': '#ff9e57', '--peace-ink': '#8fd6a0', '--rubric-ink': '#ff9a7a',
    '--vital-health': '#ff7070', '--vital': '#bdb8cc',
    '--st-str': '#ff8f73', '--st-spd': '#5fd8cc', '--st-ins': '#c4a6ff', '--st-sta': '#9bdc6e', '--st-int': '#7fb2ff', '--st-wil': '#ff8cc6',
    '--odds-likely': '#6fd49a', '--odds-even': '#f0c062', '--odds-risky': '#ff9e57', '--odds-long': '#ff7a85', '--odds-tint': '14%',
    '--r-common': '#b3b8c9', '--r-uncommon': '#74d68a', '--r-rare': '#6cb6ff', '--r-epic': '#c59bff', '--r-legendary': '#ffb648', '--r-mythic': '#ff7a6b',
    '--e-1': 'inset 0 1px 0 rgba(255,255,255,.05), 0 1px 2px rgba(0,0,0,.45)', '--e-2': '0 6px 16px rgba(4,6,14,.45)', '--e-3': '0 18px 48px rgba(4,6,14,.6)',
    '--glow-accent': '0 0 0 1px rgba(240,192,98,.55), 0 0 18px rgba(240,192,98,.28)', '--glow-danger': '0 0 0 1px rgba(255,138,115,.55), 0 0 18px rgba(255,138,115,.28)',
    '--ok-tint': 'rgba(111,212,154,.14)', '--danger-tint': 'rgba(255,138,115,.14)', '--warn-tint': 'rgba(245,196,81,.14)', '--info-tint': 'rgba(140,192,255,.14)',
    '--scrim-c': 'rgba(5,7,15,.72)', '--ridge': '#111731',
  },
  light: {
    '--bg': '#f2ede2', '--surface': '#faf7f0', '--raised': '#ffffff', '--raised-hover': '#f6f1e6', '--overlay': '#ffffff', '--sunken': '#e9e2d3',
    '--line': '#ddd3c0', '--line-strong': '#8c8270', '--ink': '#1d2033', '--ink-2': '#3a3e55', '--ink-3': '#565a70', '--focus': '#1f5ea8',
    '--shade': '#3a2f6b', '--line-ink': '#1b1730',
    '--accent': '#7f5100', '--accent-strong': '#5e3c00', '--accent-fill': '#e0a43a', '--accent-fill-hover': '#eab452', '--accent-fill-press': '#ce9533',
    '--accent-fill-line': '#8a5a10', '--on-accent': '#1a1206', '--accent-glow': 'transparent', '--accent-tint': 'rgba(127,81,0,.10)', '--accent-rule': 'rgba(127,81,0,.45)',
    '--danger': '#a82d1a', '--danger-fill': '#b8351f', '--danger-line': '#8a2414', '--ok': '#1a6a41', '--warn': '#7f5300', '--info': '#1f5ea8',
    '--crown-ink': '#6b45c2', '--blood-ink': '#a8286c', '--lore-ink': '#2f5878', '--war-ink': '#9a4300', '--peace-ink': '#1f6c33', '--rubric-ink': '#a82d1a',
    '--vital-health': '#b3261e', '--vital': '#3a3e55',
    '--st-str': '#a8321a', '--st-spd': '#0a6b62', '--st-ins': '#6b45c2', '--st-sta': '#366b17', '--st-int': '#2759b8', '--st-wil': '#a8286c',
    '--odds-likely': '#1a6a41', '--odds-even': '#7f5100', '--odds-risky': '#9a4300', '--odds-long': '#b3261e', '--odds-tint': '12%',
    '--r-common': '#5c6070', '--r-uncommon': '#1f6c33', '--r-rare': '#1f5fb3', '--r-epic': '#7a3fc4', '--r-legendary': '#8a4f00', '--r-mythic': '#a82d1a',
    '--e-1': 'inset 0 1px 0 rgba(255,255,255,.6), 0 1px 2px rgba(40,30,10,.12)', '--e-2': '0 6px 16px rgba(40,30,10,.16)', '--e-3': '0 18px 48px rgba(40,30,10,.22)',
    '--glow-accent': '0 0 0 2px #8a5a10', '--glow-danger': '0 0 0 2px #8a2414',
    '--ok-tint': 'rgba(26,106,65,.10)', '--danger-tint': 'rgba(168,45,26,.10)', '--warn-tint': 'rgba(127,83,0,.10)', '--info-tint': 'rgba(31,94,168,.10)',
    '--scrim-c': 'rgba(40,30,10,.45)', '--ridge': '#e6dfcf',
  },
};
// the release's names, read by every old rule, pointed at the new tokens (the same in both themes)
LOOK.MAP = {
  '--bg-0': 'var(--sunken)', '--bg-1': 'var(--bg)', '--surface-1': 'var(--surface)', '--surface-2': 'var(--raised)', '--surface-3': 'var(--raised)', '--surface-4': 'var(--raised-hover)',
  '--border-1': 'var(--line)', '--border-2': 'var(--line-strong)', '--border-3': 'var(--accent)',
  '--text-1': 'var(--ink)', '--text-2': 'var(--ink-2)', '--text-3': 'var(--ink-3)',
  '--accent-2': 'var(--accent-strong)', '--accent-ink': 'var(--on-accent)', '--accent-soft': 'var(--accent-tint)', '--accent-line': 'var(--accent-rule)',
  '--primary': 'var(--accent-fill)', '--primary-2': 'var(--accent-fill)', '--primary-hover': 'var(--accent-fill-hover)',
  '--bad': 'var(--danger)', '--crown': 'var(--crown-ink)', '--blood': 'var(--blood-ink)', '--lore': 'var(--lore-ink)', '--war': 'var(--war-ink)', '--peace': 'var(--peace-ink)',
  '--rubric': 'var(--danger)', '--rubric-text': 'var(--rubric-ink)', '--gilt': 'transparent', '--frame': 'transparent',
  '--ok-soft': 'var(--ok-tint)', '--bad-soft': 'var(--danger-tint)', '--warn-soft': 'var(--warn-tint)', '--info-soft': 'var(--info-tint)',
  '--scrim': 'var(--scrim-c)', '--tip-bg': 'var(--overlay)',
  '--shadow-1': 'var(--e-1)', '--shadow-2': 'var(--e-2)', '--shadow-3': 'var(--e-3)', '--shadow': 'var(--e-2)',
  // the release's shorter aliases
  '--panel': 'var(--surface)', '--panel2': 'var(--raised)', '--ink2': 'var(--ink-2)', '--ink3': 'var(--ink-3)', '--gold': 'var(--accent)', '--gold2': 'var(--accent-strong)',
  '--red': 'var(--danger)', '--green': 'var(--ok)', '--blue': 'var(--info)', '--purple': 'var(--crown-ink)', '--good': 'var(--ok)', '--big': 'var(--accent-strong)',
  '--line2': 'var(--line-strong)', '--bg2': 'var(--sunken)',
};
// ---- type (brief §2): Literata for prose, Atkinson Hyperlegible Next for the interface, Cinzel for names and titles,
// Dela Gothic One for the big moments. Every size follows the release's text-size setting (--tx).
LOOK.TYPE = {
  '--f-prose': '"Literata", "Iowan Old Style", "Palatino Linotype", Georgia, serif',
  '--f-ui': '"Atkinson Hyperlegible Next", "Atkinson Hyperlegible", "Segoe UI", system-ui, sans-serif',
  '--f-name': '"Cinzel", "Trajan Pro", Georgia, serif',
  '--f-impact': '"Dela Gothic One", "Cinzel", Georgia, sans-serif',
  '--fh': 'var(--f-name)', '--fb': 'var(--f-ui)', '--fu': 'var(--f-ui)', '--fd': 'var(--f-name)',
  '--t-cap': T(12), '--t-small': T(13), '--t-ui': T(14), '--t-num': T(14), '--t-prose': T(15), '--t-h3': T(16), '--t-name': T(18), '--t-num-lg': T(20),
  '--t-h2': T(22), '--t-h1': T(30), '--t-display': T(44),
  '--lh-cap': '1.34', '--lh-small': '1.38', '--lh-ui': '1.43', '--lh-prose': '1.53', '--lh-tight': '1.2',
  // the release's scale, folded onto the new one (12 px is the smallest text in the game)
  '--fs-1': T(12), '--fs-2': T(13), '--fs-3': T(14), '--fs-4': T(14), '--fs-5': T(16), '--fs-6': T(22), '--fs-7': T(26), '--fs-8': T(30), '--fs-9': T(44),
  '--track': '.06em',
};
// ---- space, shape, depth (brief §3) and motion (brief §6)
LOOK.SHAPE = {
  '--sp-0': '2px', '--sp-1': '4px', '--sp-2': '8px', '--sp-3': '12px', '--sp-4': '16px', '--sp-5': '24px', '--sp-6': '32px', '--sp-7': '48px',
  '--row-xs': '24px', '--row-s': '28px', '--row-m': '32px', '--row-l': '40px', '--row-touch': '44px', '--hit': '32px',
  '--r-xs': '3px', '--r-s': '6px', '--r-m': '10px', '--r-l': '14px', '--r-pill': '999px', '--r': 'var(--r-m)', '--cut': '8px', '--cut-l': '12px',
  '--m-press': '80ms', '--m-quick': '140ms', '--m-base': '200ms', '--m-enter': '280ms', '--m-exit': '180ms', '--m-snap': '240ms', '--m-moment': '1200ms', '--m-ink': '700ms',
  '--ease-press': 'cubic-bezier(.2,0,0,1)', '--ease-std': 'cubic-bezier(.2,.8,.2,1)', '--ease-enter': 'cubic-bezier(.05,.7,.1,1)', '--ease-exit': 'cubic-bezier(.3,0,.8,.15)',
  '--ease-snap': 'cubic-bezier(.3,1.4,.5,1)',
  // the release's motion names
  '--t-fast': 'var(--m-press)', '--t-base': 'var(--m-quick)', '--t-slow': 'var(--m-base)', '--ease': 'var(--ease-std)',
};
const decl = o => Object.entries(o).map(([k, v]) => `${k}:${v}`).join(';');
LOOK.css.tokens = `
:root{${decl(LOOK.THEMES.dark)};${decl(LOOK.MAP)};${decl(LOOK.TYPE)};${decl(LOOK.SHAPE)};color-scheme:dark}
:root[data-theme=light]{${decl(LOOK.THEMES.light)};${decl(LOOK.MAP)};color-scheme:light}
@media (pointer:coarse){:root{--hit:44px}}
@media (max-width:760px){:root{--t-cap:${T(14)};--t-small:${T(14)};--t-ui:${T(15)};--t-num:${T(15)};--t-prose:${T(16)};--lh-prose:1.56;--lh-ui:1.4;
  --fs-1:${T(14)};--fs-2:${T(14)};--fs-3:${T(15)};--fs-4:${T(15)}}}
@media (min-width:1600px){:root{--t-prose:${T(16)};--lh-prose:1.56;--t-display:${T(64)}}}
`;

// ---- palettes the drawing code can ask for by name
LOOK.STATS = { str: ['Strength', 'STR'], spd: ['Speed', 'SPD'], ins: ['Combat instincts', 'INS'], sta: ['Stamina', 'STA'], int: ['Intelligence', 'INT'], wil: ['Willpower', 'WIL'] };
// the engine's odds bands, kept exactly: likely 75 and up, even 50 to 74, risky 30 to 49, long under 30
LOOK.band = pct => pct >= 75 ? 'likely' : pct >= 50 ? 'even' : pct >= 30 ? 'risky' : 'long';
LOOK.PIPS = { likely: '●●●●', even: '●●●○', risky: '●●○○', long: '●○○○' };
LOOK.TIERS = { common: '◇', uncommon: '◆', rare: '◆◆', epic: '◆◆◆', legendary: '★', mythic: '✦' };

// ---- UI.realmInk(hex, theme): a realm's colour made safe to show (brief §1.6). Pure and memoized.
//   swatch: the raw colour, for fills of 8 x 8 px and up with a --line-strong border
//   tint:   the colour mixed into --surface (18% dark, 14% light), a background for the realm's rows and cards
//   ink:    the colour as text: OKLCH lightness clamped (dark 0.74-0.90, light 0.30-0.46), chroma cut to 0.16 when out of
//           gamut, then stepped by 0.02 until it reaches 4.5:1 on --surface and --raised
//   glow:   the swatch at 30% alpha
(function () {
  const lin = c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  const gam = c => c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  const rgbHex = a => '#' + a.map(c => Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16).padStart(2, '0')).join('');
  const toOklab = ([r, g, b]) => {
    [r, g, b] = [lin(r), lin(g), lin(b)];
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
  };
  const fromOklab = ([L, a, b]) => {
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s].map(gam);
  };
  const inGamut = c => c.every(v => v >= -1e-4 && v <= 1 + 1e-4);
  const lum = h => { const [r, g, b] = hexRgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const mixHex = (a, b, t) => rgbHex(hexRgb(a).map((v, i) => v * t + hexRgb(b)[i] * (1 - t)));
  LOOK.contrast = ratio;
  LOOK.mix = mixHex;
  const memo = new Map();
  UI.realmInk = function (hex, theme) {
    theme = theme === 'light' || theme === 'dark' ? theme : (UI.set && UI.set.theme === 'light' ? 'light' : 'dark');
    const raw = typeof hex === 'string' && /^#[0-9a-f]{6}$/i.test(hex) ? hex.toLowerCase() : '#8a8f9e';
    const key = raw + theme;
    if (memo.has(key)) return memo.get(key);
    const TK = LOOK.THEMES[theme], surf = TK['--surface'], raised = TK['--raised'];
    const [L0, a0, b0] = toOklab(hexRgb(raw));
    let C = Math.hypot(a0, b0); const h = Math.atan2(b0, a0);
    const [lo, hi] = theme === 'dark' ? [0.74, 0.90] : [0.30, 0.46];
    let L = Math.max(lo, Math.min(hi, L0));
    const at = (L, C) => fromOklab([L, C * Math.cos(h), C * Math.sin(h)]);
    if (!inGamut(at(L, C))) C = Math.min(C, 0.16);
    for (let g = 0; g < 40 && !inGamut(at(L, C)); g++) C *= 0.9;
    let ink = rgbHex(at(L, C));
    for (let g = 0; g < 40 && Math.min(ratio(ink, surf), ratio(ink, raised)) < 4.5; g++) { L += theme === 'dark' ? 0.02 : -0.02; ink = rgbHex(at(Math.max(0, Math.min(1, L)), C)); }
    const out = Object.freeze({ swatch: raw, tint: mixHex(raw, surf, theme === 'dark' ? 0.18 : 0.14), ink, glow: raw + '4d' });
    if (memo.size > 400) memo.clear();
    memo.set(key, out);
    return out;
  };
})();
