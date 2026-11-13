# The archive

Retired features and code. Nothing here is built, tested or shipped: `tools/lib/features.mjs` only looks in `src/`.
Each entry keeps its files as they last were and a `NOTE.md` saying what it was, why it was replaced, and the last
commit where it was part of the game. To bring one back, move it into `src/<system>/` and build with `--only=<name>`
first; it will need its patches refitted to the release source (`src/core/release/`, X1), or better, written into it.

| Folder | What it was | Retired | Last commit that built it |
|---|---|---|---|
| `99-far-lands/` | The Great Continent: a second, 2,033-province map beside the Known World | v2 step 2: the owner asked for one continent (V2_SPEC complaint 3) | `437efa6` (v2.0.0-alpha.1) |
| `990-far-peoples/` | The Far Lands' peoples, voices and score | with the Far Lands | `437efa6` |
| `991-far-war/` | War in the Far Lands | with the Far Lands | `437efa6` |
| `992-far-beasts/` | The Far Lands' beasts and their duel curves | with the Far Lands | `437efa6` |
| `993-far-life/` | Life events in the Far Lands | with the Far Lands | `437efa6` |
| `x1-patch-layer/` | The patch layer: 203 find-and-replace patches on the minified release, in 58 `patches.mjs` files | X1: baked into the readable source `src/core/release/` (D-027) | `88b671f` |
| `v2-kit-demo-ui/` | The v2 kit's standalone demo interface (`ui/app.js`), which built `docs/v2/demo.html` | never shipped: the v2 engine was wired into the game by features instead (V2_SPEC integration plan) | not built into the game |
