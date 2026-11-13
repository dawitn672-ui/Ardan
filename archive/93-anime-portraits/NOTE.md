# Retired: 93-anime-portraits (2026-11-13, C8b)

**What it was:** the cel-shaded "anime" portrait renderer (`anime.core.js`, 164 KB): busts and a full figure drawn by
code, with expressions, culture cuts, wounds, the far lands' looks and a menu setting that switched back to the
woodcut miniatures. It wrapped `PORTRAIT.svg`.

**Why retired:** the owner chose a detailed 2D illustrated style (D-024, D-029), approved its gate 2 (D-035) and asked
for that library to draw everyone. `src/ui/93-figures` (with the library in `src/ui/engine/figure/`) now serves every
call site of `PORTRAIT.svg`; D-015 and D-020 had already settled that the older renderers retire.

**Carried over:** the mapping of a people's years onto a human life, the face-at-rest rule (mood from happiness,
opinion, health, traits and the scene of an event) and the profile's 88 px bust in the 1366 layout, all rewritten in
`src/ui/93-figures/figures.b-draw.core.js`. **Not carried:** the far lands' looks (`FAR_LAND`, `FAR_CULT`,
`drawnApp`, the creation screen's trimmed swatches): they belong with the far lands, which are in this archive too. Nor the duel's `guard` pose (its test `apGuardObit`): the library has no stance with a raised blade yet. Its tests `apAxe` and `apCreateSkin` live on as `fgAxe` and `fgCreateSkin`; `apDeterministic`, `apPure`, `apBudget`, `apEscaped` and `apEveryPeople` as their `fg` counterparts.
The menu setting `UI.set.anime` is gone (the release's menu line is guarded and simply no longer shows).

**Last commit that built it:** `f574229`. Its one patch (`AP-SKINS`) was baked into `UI.crStepBody` at X1 and is
still there, guarded by `UI.crSkinSet`.
