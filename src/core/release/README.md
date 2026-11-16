# The release's own source (X1)

This folder is the shipped game, `vendor/ardan-b593143.html`, as readable source, with all 203 patches of the old
patch layer written in. `node tools/build.mjs` reads it as its input; it no longer reads `vendor/` (which stays
untouched, the original this was made from). Decision: `docs/DECISIONS.md` D-028.

| Path | What | Becomes |
| --- | --- | --- |
| `core/NN-section.js` | The engine and the interface (`A`, `GD`, `UI`, `MAP`, `SAVES`, `PORTRAIT`), one file per section of the release's own order, long sections in parts `-a`, `-b`... | the `ardan-core` blob: every file in name order, one script |
| `core/00-lore.json` | The `LORE` table the core reads at start | `const LORE=JSON.parse("...")` at the head of the core |
| `content/NN-xx.js` | The release's 30 event packs, one file each (`xx` = the commonest event id prefix) | the `ardan-content` blob, one pack each, before the features' packs |
| `lore/NN-key.json` | The five lazy lore tables (cast, families, house lore, styles, academies) | the `ardan-lore` blob, read on first use |
| `page.html` | The page: fonts, style, the zstd decoder and bootloader, three empty payload slots | the page the build fills |
| `PATCHES.md` | Every baked patch: its feature, id, why, and where its comment is now | (not built) |

Features still apply after the release, in folder order, exactly as before: `*.core.js` appended to the core,
`*.events.js` as packs after the release's packs, `data/**/*.json` as `A.DATA`.

## Changing the game

- **Change the release by editing these files.** A new system still goes in a feature folder (`*.core.js`), but a
  change to a release function is made here, in place, with a comment saying why when it is not obvious. Do not write
  new `patches.mjs` finds against this text: the build still applies one (for a feature in flight), but the default
  build has none and should stay so.
- **Event functions are read as text.** `A.evAudience` classes an event by running `A.CX_RX` over `e.cond.toString()`
  and `A.EV_RX` over `e.text.toString()`; the bot and several tests read `cond`, `setup` and `fx` text too. So in
  `content/` every function is kept exactly as the release wrote it (one line each, minified); only the structure
  around them (statements, event objects, properties) is laid out on lines. If you reformat or edit an event function,
  keep the helper calls the classifiers look for (`C.ruler(`, `C.noble(`, `C.poor(`, `C.soldier(`, `C.child(`, `.job`,
  `C.famKind(p,'noble')`...) and run `tools/release/identity-probe.mjs` to see which classes moved.
- **The core was de-minified by rule** (tools/release/transform.mjs): comma lists became statements, `a && b;` became
  `if (a) b;`, `a ? b : c;` became an if/else, `!0`/`!1` became `true`/`false`, then prettier (print width 120,
  `quoteProps: preserve`, `arrowParens: avoid`). Short names (`pc`, `S`, `R2`) are the release's own; rename them only
  as part of a real change.
- **Proving a change is neutral.** For a refactor meant to change nothing, build before and after and run
  `node --stack-size=65500 tools/release/verify.mjs before.html after.html` (same syntax tree, same event-function
  texts, same lore and page), and `node tools/release/identity-probe.mjs before.html after.html` (same event classes
  and the same fixed-seed lives, fingerprint and state hash).
- `node tools/show.mjs --where A.someFunction` says which file and line defines a release function.

## How it was made

`tools/release/bake.mjs` replays the pre-X1 build (vendor + the patch layer, now `archive/x1-patch-layer/`) and keeps
each patch's position; `tools/release/format.mjs` turns that into this folder (see its header for the one-off
dependencies, prettier and astring). Both are kept so the conversion can be audited; re-running them at the X1 commit
reproduces this folder. After X1 this folder is the source of truth: do not re-run them over later edits.
