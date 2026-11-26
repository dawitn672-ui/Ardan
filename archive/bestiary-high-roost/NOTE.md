# Retired by order 95: the dragons of the High Roost

D-185 (order 92's new high band) added a line of two dragons to the bestiary: the **High Roost Dragon** (level 738) and the
**Dragon Lord of the High Roost** (775 on the curve, 785 with the Old Blood), the roost-keepers below the highest peak who
kept the lesser dragons in their places while the King of Dragons slept. That made four ancient dragons. Order 95
(2026-11-26) asked for "only 3 ancient dragons under the dragon king", and the owner's follow-up was plain: "remove the
dragon of high roost" (D-191). Both kinds were new in D-185, so nothing of the older world went with them. The three
ancient dragons are now the Ancient Ash, Frost and Storm Dragons, each one of a kind.

The last commit that built them is `1c8631b6` (the merge of main into the rescale, on the `bestiary-bands` branch); they
were first added in `177c9970`.

| Here | Was |
| --- | --- |
| `gen-bestiary-lines.mjs` | the generator's line `dragons.highroost` (levels in t, the scale before D-191) and its behaviour row, as they last stood in `tools/powers/gen-bestiary.mjs` (a fragment, not a module) |
| `species.json` | the two species rows as `data/bestiary.json` last held them (`high-roost-dragon`, `dragon-lord-of-the-high-roost`), one JSON object a line |

Nothing else named them: no lair, test, title or legend. To bring them back, put the line back in the generator's
`dragons` family (written in levels, `lv`, with a `tier` and a `world` count under the family's cap of 100) and run
`node tools/powers/gen-bestiary.mjs`; the ancient dragons would then be four again, against order 95.
