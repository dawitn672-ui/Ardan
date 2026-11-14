# 99990-v2-engine: Ardan v2's engine in the game

**Aspect:** the owner's v2 complaint list (`docs/V2_SPEC.md`) · **Kind:** system, 1 generated code file, no patches, no events yet.

Step 1 of the v2 integration plan. The v2 modules live as plain ES modules in `src/v2/` (body, races, odds, kin,
succession, renown, nobility, diplomacy, orders, war, names, world, events, game, and the map's continent, noise and
render). `tools/build-v2.mjs` bundles `src/core/engine/index.js` with esbuild into `a-v2.core.js`, which this build appends to
the core blob like any feature, and which puts the engine on the page as `A.V2` (and `window.ARDAN_V2`). Nothing in
the game calls it yet: steps 2 to 9 wire it in.

- Edit `src/v2/`, never `a-v2.core.js`; then run `node tools/build-v2.mjs`. `tools/check.mjs` fails a stale bundle.
- The v2 tests are `tests/v2/*.test.js` (24, `node --test`). `tools/check.mjs` runs them, so a failure blocks a release.
- The engine draws only from its own seeded generator (`src/core/engine/rng.js`): no `Math.random`, no `Date.now`, no `eval`.
- `test.mjs` here checks, in the browser build, that `A.V2` is there, that a continent from a seed is the same twice and
  one connected landmass, and that loading it moved neither the game's state nor its random stream.

Reference, moved from the kit: `docs/v2/` (the spec, the kit README, the Claude Code prompt, the demo and its map
renders) and `tools/v2/` (the demo build, map renders and the demo's playtest scripts).
