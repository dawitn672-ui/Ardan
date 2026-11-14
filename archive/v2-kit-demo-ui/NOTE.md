# v2-kit-demo-ui (archived)

**What it was:** the standalone demo interface that shipped with the owner's v2 kit (`app.js` and `template.html`,
which `tools/v2/build-demo.js` bundled into `docs/v2/demo.html`). **Why archived:** it was never part of the game; the
v2 engine was wired into the real interface by the `src/*/99990..99999-v2-*` features instead. Its imports point at
the engine's old home (`src/v2/`); the engine now lives in `src/<system>/engine/`. Moved here in round 2, step 0.
