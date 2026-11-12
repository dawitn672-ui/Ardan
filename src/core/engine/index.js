// Ardan v2's engine, gathered for the game's build: tools/build-v2.mjs bundles this file into
// src/core/99990-v2/a-v2.core.js, which puts it on the page as A.V2 (and window.ARDAN_V2). The modules stay plain ES
// modules so their own tests (tests/v2/*.test.js) run them under node --test.
export * as rng from './rng.js';
export * as body from '../../people/engine/body.js';
export * as races from '../../people/engine/races.js';
export * as odds from '../../people/engine/odds.js';
export * as kin from '../../family/engine/kin.js';
export * as succession from '../../family/engine/succession.js';
export * as renown from '../../people/engine/renown.js';
export * as nobility from '../../nobility/engine/nobility.js';
export * as diplomacy from '../../diplomacy/engine/diplomacy.js';
export * as orders from '../../war/engine/orders.js';
export * as war from '../../war/engine/war.js';
export * as names from '../../world/engine/names.js';
export * as world from '../../world/engine/world.js';
export * as events from '../../events/engine/events.js';
export * as game from './game.js';
export * as continent from '../../map/engine/continent.js';
export * as noise from '../../map/engine/noise.js';
export * as render from '../../map/engine/render.js';
