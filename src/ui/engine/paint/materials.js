// Colours and materials (characters.md §1 "Skin", §6, §9). Colours are checked as hex before use and kept in linear light.

export function hexOk(h) { return typeof h === 'string' && /^#[0-9a-fA-F]{6}$/.test(h); }
export function lin(h, fallback = '#808080') {
  if (!hexOk(h)) h = fallback;
  const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  return c.map(v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
}
export const toSRGB = v => v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
export const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// twelve human tones, fair to deep: the colour of a cheek in the half-tone (§1)
export const SKIN = ['#e4c2aa', '#ddb699', '#d6ab8b', '#d8aa87', '#cc9b76', '#bd8a64', '#ad7752', '#996443', '#835236', '#6c432b', '#563421', '#40271a'];
export const SKIN_NAMES = ['milk-pale', 'fair', 'fair, ruddy', 'light', 'light olive', 'warm', 'olive', 'tan', 'brown', 'deep brown', 'dark', 'deep'];
// other peoples' own tones
export const SKIN_EXTRA = { orc: ['#7d8a5a', '#6a7a4c', '#8a8a62', '#5f6b47'], elf: ['#f0dccb', '#e4cdb6', '#d6b89a'] };

// eighteen natural hair colours (§6); grey and white are never picked, they come
export const HAIR = ['#17110e', '#251a15', '#33241b', '#4a3323', '#5e4230', '#7a5a3e', '#6a3520', '#86391f', '#a04c26', '#b3642f', '#bf8657', '#937047', '#a08c6c', '#b89a64', '#c9a65f', '#d8c08e', '#ddd2b6', '#574a3f'];
export const HAIR_NAMES = ['black', 'off-black', 'dark brown', 'brown', 'mid brown', 'light brown', 'chestnut', 'auburn', 'copper', 'ginger', 'strawberry', 'dark blonde', 'ash blonde', 'blonde', 'golden', 'flaxen', 'platinum', 'ash brown'];
export const GREY = '#a9a6a2', WHITE = '#e4e1da';

// twelve eye colours
export const EYES = ['#3a2416', '#55341f', '#73552c', '#8a6626', '#566b3c', '#66755d', '#6a7d8a', '#7a8187', '#4b7096', '#7c9fc0', '#365474', '#6d6689'];
export const EYE_NAMES = ['dark brown', 'brown', 'hazel', 'amber', 'green', 'grey-green', 'blue-grey', 'grey', 'blue', 'light blue', 'dark blue', 'violet-grey'];

// dyes, by what a purse allows (§9)
export const DYES = {
  linen: '#d6cab0', undyed: '#c9bc9c', oatmeal: '#b4a584', grey: '#857f73', russet: '#74452c', brown: '#5a3f2c', madder: '#8a2c22',
  woad: '#36506c', green: '#465532', saffron: '#b08530', black: '#232024', purple: '#4a2644', crimson: '#7a1b29', ochre: '#94692f',
  scarlet: '#9b1f1f', azure: '#2b4f86', vert: '#2f5a33', murrey: '#5e2533', white: '#e8e2d2', sable: '#1d1b1d', or: '#c7a14a', argent: '#d8d8d4',
};
export const METAL = { iron: '#7d8084', steel: '#a9adb2', brass: '#b8924a', gold: '#d6ae58', silver: '#cfd0d0', pewter: '#9a978f', bronze: '#a3753e' };

// how each material takes light: diffuse wrap, sheen at the turn, specular strength and tightness, metal
export const MATERIALS = {
  skin: { wrap: 0.45, spec: 0.22, rough: 0.42 },
  linen: { wrap: 0.3, spec: 0.03, rough: 0.8, weave: 0.6, sheen: 0.05, folds: 'fine' },
  wool: { wrap: 0.35, spec: 0.02, rough: 0.9, weave: 0.35, sheen: 0.08, folds: 'broad', nap: 1 },
  silk: { wrap: 0.2, spec: 0.25, rough: 0.3, weave: 0.2, sheen: 0.3, folds: 'sharp' },
  velvet: { wrap: 0.2, spec: 0.02, rough: 0.9, sheen: 0.6, folds: 'broad' },
  fur: { wrap: 0.5, spec: 0.05, rough: 0.9, fur: 1 },
  leather: { wrap: 0.2, spec: 0.18, rough: 0.5, grain: 1 },
  padded: { wrap: 0.35, spec: 0.03, rough: 0.85, channels: 1 },
  mail: { metal: 1, spec: 0.9, rough: 0.35, rings: 1 },
  plate: { metal: 1, spec: 1, rough: 0.16 },
  scale: { metal: 1, spec: 0.8, rough: 0.3, scales: 1 },
  gold: { metal: 1, spec: 1, rough: 0.22 },
  wood: { wrap: 0.2, spec: 0.06, rough: 0.7 },
  rope: { wrap: 0.3, spec: 0.03, rough: 0.9 },
};
