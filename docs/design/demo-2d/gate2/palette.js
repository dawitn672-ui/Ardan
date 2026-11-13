// Gate 2 · palettes. Data only. Skin is hand-picked (a darkened skin is a muddy skin): b base, s shadow, d deep shadow,
// l light, k line, blush, lip. Hair: b base, s shadow, l light streak, k line. Cloth, leather and fur are ramps made by
// g.ramp from one dye, so a new dye is one line. Metals are hand-picked: they need a hard light and a dark reflection.
import { ramp } from './g.js';

export const SKIN = {
  porcelain: { name: 'Porcelain', b: '#f8e6dd', s: '#e6c3bf', d: '#bf949c', l: '#fff7f1', k: '#4b2f3a', blush: '#f0b3ae', lip: '#dc9092' },
  fair:      { name: 'Fair',      b: '#f5dccb', s: '#e0b5a8', d: '#b78580', l: '#fff0e2', k: '#4a2c30', blush: '#eda696', lip: '#d2877c' },
  rosy:      { name: 'Rosy',      b: '#f2d2bd', s: '#dba898', d: '#b0786f', l: '#fde8d6', k: '#482a2c', blush: '#ea957f', lip: '#cc7b70' },
  warm:      { name: 'Warm',      b: '#e9c5a4', s: '#cc9c80', d: '#9f6c5a', l: '#f7dfc4', k: '#44282a', blush: '#da8e72', lip: '#c07666' },
  olive:     { name: 'Olive',     b: '#d9b48c', s: '#b88a68', d: '#885c48', l: '#edd2ac', k: '#3d2526', blush: '#c98466', lip: '#b06c5a' },
  tan:       { name: 'Sun-browned', b: '#c79670', s: '#a16e52', d: '#724638', l: '#e0b68c', k: '#382020', blush: '#b86c52', lip: '#9f5b4c' },
  bronze:    { name: 'Bronze',    b: '#b07a52', s: '#8a573c', d: '#5d352a', l: '#cc9a6e', k: '#301a18', blush: '#a05a42', lip: '#8c4d40' },
  brown:     { name: 'Brown',     b: '#93603f', s: '#70422d', d: '#482720', l: '#b07d58', k: '#281412', blush: '#864736', lip: '#7a4136' },
  umber:     { name: 'Umber',     b: '#734731', s: '#553022', d: '#351b16', l: '#926347', k: '#1f0f0d', blush: '#683426', lip: '#613126' },
  ebony:     { name: 'Ebony',     b: '#54342a', s: '#3c211b', d: '#241110', l: '#73503f', k: '#160a09', blush: '#4b251d', lip: '#4a251f' },
};
export const HAIR = {
  black:     { name: 'Black',       b: '#1d1b24', s: '#0d0c12', l: '#4a4e63', k: '#060609' },
  soot:      { name: 'Brown-black', b: '#2c2321', s: '#161110', l: '#5d4d47', k: '#0c0908' },
  darkbrown: { name: 'Dark brown',  b: '#412b21', s: '#261710', l: '#74523d', k: '#170d09' },
  chestnut:  { name: 'Chestnut',    b: '#613c25', s: '#3a2113', l: '#98663f', k: '#221109' },
  auburn:    { name: 'Auburn',      b: '#7d3a22', s: '#4b2013', l: '#b6633c', k: '#2b1009' },
  copper:    { name: 'Copper',      b: '#a9512a', s: '#703117', l: '#db8b4c', k: '#3e1909' },
  ginger:    { name: 'Ginger',      b: '#c4733a', s: '#8a4a20', l: '#eba862', k: '#4d260d' },
  darkblond: { name: 'Dark blond',  b: '#8f6f45', s: '#5d4529', l: '#c3a172', k: '#352410' },
  blond:     { name: 'Blond',       b: '#cfae72', s: '#9c7c47', l: '#eedaa6', k: '#5c4222' },
  flaxen:    { name: 'Flaxen',      b: '#e3cf9c', s: '#b59c64', l: '#f7edca', k: '#6f5932' },
  ash:       { name: 'Ash',         b: '#a59b8d', s: '#73695d', l: '#cfc7ba', k: '#3d362e' },
  grey:      { name: 'Iron grey',   b: '#8f8e94', s: '#5f5e68', l: '#c5c5cd', k: '#34333b' },
  silver:    { name: 'Silver',      b: '#c4c4ca', s: '#8f8f9b', l: '#ededf1', k: '#4c4c57' },
  white:     { name: 'White',       b: '#e4e3e2', s: '#aeadb4', l: '#fbfbfa', k: '#62626c' },
};
// irises: ring (the dark rim), b (body), l (the lit lower arc)
export const EYES = {
  darkbrown: { name: 'Dark brown', ring: '#1a0f0b', b: '#402517', l: '#7a4e2c' },
  brown:     { name: 'Brown',      ring: '#2b1810', b: '#623b22', l: '#a5713c' },
  hazel:     { name: 'Hazel',      ring: '#2f2512', b: '#6e5d2c', l: '#ab9644' },
  amber:     { name: 'Amber',      ring: '#3a2409', b: '#93651c', l: '#d9a63c' },
  green:     { name: 'Green',      ring: '#1c2b1c', b: '#487048', l: '#8fb56c' },
  sea:       { name: 'Sea green',  ring: '#17302e', b: '#3d7a72', l: '#86c2b2' },
  blue:      { name: 'Blue',       ring: '#17273f', b: '#3b699a', l: '#8cc0e2' },
  greyblue:  { name: 'Grey-blue',  ring: '#222c3a', b: '#5f7c98', l: '#a9c6da' },
  grey:      { name: 'Grey',       ring: '#272c33', b: '#737f8b', l: '#b9c6d0' },
  ice:       { name: 'Pale ice',   ring: '#2a3440', b: '#9fb4c4', l: '#dbe8f0' },
  milky:     { name: 'Blind',      ring: '#7f8690', b: '#c9cdd2', l: '#e8eaec' },
};
export const DYES = {
  undyed: '#b3a58d', hemp: '#9c8e74', linen: '#e4dccb', white: '#efede6', cream: '#d9cbae',
  russet: '#8e4a2c', madder: '#a13b2f', scarlet: '#b8322a', crimson: '#861d2a', murrey: '#6a2948', rose: '#b56a76',
  woad: '#46648a', blue: '#2a447e', navy: '#1c2848', teal: '#215a5e', green: '#3e6947', forest: '#26483a', sage: '#7d9070',
  ochre: '#b4862f', mustard: '#c7a03a', brown: '#5f4733', walnut: '#43322a', grey: '#6f6e73', charcoal: '#35353c', black: '#201e25', purple: '#4c2a64',
};
export const LEATHER = { tan: '#a37347', brown: '#6a482f', dark: '#3e2a20', black: '#221c1c', red: '#6c2a22' };
export const FUR = { wolf: '#8c8377', bear: '#5b4332', fox: '#ad6638', ermine: '#f1ede3', sable: '#2d2725', hare: '#c9bca6' };
export const METAL = {
  iron:   { b: '#7d828b', s: '#4d525d', d: '#2a2e38', l: '#b9bec8', hi: '#dfe3ea', k: '#15171d' },
  steel:  { b: '#a9b1bd', s: '#6b7483', d: '#363d4b', l: '#e2e7ee', hi: '#ffffff', k: '#191c24' },
  bright: { b: '#c3cad4', s: '#7e8898', d: '#414a5b', l: '#f1f4f8', hi: '#ffffff', k: '#1b1f28' },
  black:  { b: '#3b3d46', s: '#24252d', d: '#111218', l: '#757986', hi: '#b9bdc9', k: '#07080b' },
  bronze: { b: '#a8763a', s: '#74491f', d: '#452811', l: '#dcae68', hi: '#f8e2ae', k: '#28150a' },
  gold:   { b: '#d0a23a', s: '#99691f', d: '#5c3d10', l: '#f3d67c', hi: '#fff6cf', k: '#372207' },
  silver: { b: '#cfd3d8', s: '#8d939d', d: '#4e545f', l: '#f4f6f8', hi: '#ffffff', k: '#23262d' },
};
const memo = new Map();
// a few ramps are set by hand where the rule goes muddy (whites and near-blacks)
const HAND = { ermine: { s: '#d3ccc0', d: '#a59e97', l: '#ffffff', k: '#4c4642' }, white: { s: '#cfcdd3', d: '#a3a1ad', l: '#ffffff', k: '#45434e' }, linen: { s: '#c9c0b0', d: '#9f968a', l: '#f6f1e6', k: '#4a433b' }, cream: { s: '#bfae8e', d: '#958567', l: '#efe4cb', k: '#4a3f2c' }, black: { s: '#141219', d: '#09080c', l: '#454150', k: '#040406' }, charcoal: { s: '#25252b', d: '#16161b', l: '#585863', k: '#0b0b0e' } };
// the ramp of any named dye, leather or fur, or of a raw colour
export function cloth(name) {
  if (memo.has(name)) return memo.get(name);
  const hex = DYES[name] || LEATHER[name] || FUR[name] || name, r = ramp(hex, HAND[name] || {});
  memo.set(name, r); return r;
}
export const metal = name => METAL[name] || METAL.steel;
