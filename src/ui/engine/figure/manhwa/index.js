// The manhwa layer of the figure library (C8d gate 1, D-068): profile cards in the owner's reference style (owner
// orders 56, 57, 58). A second render layer beside compose(): the same dice (g.js) and the same palettes (palette.js),
// its own pen. Used only by docs/design/demo-2d/c8d/sheet.mjs until the owner passes the gate: it is not exported by
// ../index.js and is not in the engine bundle.
export { card, figure, CARD, GLYPHS, chargeFn } from './card.js';
export { kitFor, FAMILY, FAMILIES, STATIONS, STATION_TEXT, REALM_ACCENT } from './peoples.js';
export { drawScene, LANDS, PLACES } from './scenes.js';
export { STYLES as HAIR_STYLES, BEARDS } from './locks.js';
export { POSES } from './body.js';
export { COVER as HAT_KINDS } from './hats.js';
export { Ink } from './ink.js';
