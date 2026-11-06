// Ardan v2's engine, gathered for the game's build: tools/build-v2.mjs bundles this file into
// features/99990-v2/a-v2.core.js, which puts it on the page as A.V2 (and window.ARDAN_V2). The modules stay plain ES
// modules so their own tests (tests/v2/*.test.js) run them under node --test.
export * as rng from './rng.js';
export * as body from './body.js';
export * as races from './races.js';
export * as odds from './odds.js';
export * as kin from './kin.js';
export * as succession from './succession.js';
export * as renown from './renown.js';
export * as nobility from './nobility.js';
export * as diplomacy from './diplomacy.js';
export * as orders from './orders.js';
export * as war from './war.js';
export * as names from './names.js';
export * as world from './world.js';
export * as events from './events.js';
export * as game from './game.js';
export * as continent from './map/continent.js';
export * as noise from './map/noise.js';
export * as render from './map/render.js';
