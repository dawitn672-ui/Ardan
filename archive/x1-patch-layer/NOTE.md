# The patch layer (retired by X1, D-028)

What it was: 58 `patches.mjs` files, 203 patches and 393 exact find-and-replace edits that `tools/build.mjs` applied
to the minified blobs of `vendor/ardan-b593143.html` on every build, each with a `why`. They sat in the feature
folders, at the same paths under `src/` that they have here.

Why retired: the owner's X1 (D-018): the patched release became readable source, `src/core/release/`, so later steps
(A2's ~70 write sites first) edit real code instead of matching minified text. Every patch is written into that source
and marked there by a comment `[X1 baked patch <feature> <id>] <why>`; `src/core/release/PATCHES.md` lists where each
one landed. The built game is the same program: `tools/release/verify.mjs` (same syntax tree, same event-function
texts) and `tools/release/identity-probe.mjs` (same event classes, same fixed-seed lives).

Last commit that built the game with these files: `88b671f` (v2-integration, H-014).

Also here: `src/map/62-inked-map/inkmap.core.js` as it was before X1, because two patches of
`9991-atlas-of-known-places` edited that file; `tools/release/bake.mjs` reads this copy so the bake can be re-run.
`src/ui/77-offline-fonts/patches.mjs` had its path to `assets/fonts/` adjusted so it still runs from here.

Not here: `src/events/82-early-years/patches.mjs` (work in progress, never in the default build) stays in its folder,
its two finds refitted to the readable source.

To re-run the conversion at the X1 commit: `node tools/release/bake.mjs --patches=archive/x1-patch-layer`, then
`tools/release/format.mjs` (see its header).
