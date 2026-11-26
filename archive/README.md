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
| `x1-patch-layer/` | The patch layer: 203 find-and-replace patches on the minified release, in 58 `patches.mjs` files | X1: baked into the readable source `src/core/release/` (D-028) | `88b671f` |
| `93-anime-portraits/` | The cel-shaded "anime" portrait renderer (busts, full figure, expressions, far lands' looks) | C8b: every portrait is drawn by the figure library, `src/ui/93-figures` (D-035) | `f574229` |
| `63-miniature-portraits/` | The woodcut miniature portraits and the culture dress table | C8b, with 93-anime-portraits (the culture table lives on in 93-figures) | `f574229` |
| `v2-kit-demo-ui/` | The v2 kit's standalone demo interface (`ui/app.js`), which built `docs/v2/demo.html` | never shipped: the v2 engine was wired into the game by features instead (V2_SPEC integration plan) | not built into the game |
| `c7-syllable-names/` | The v2 engine's namer: four cultures that built a name from two syllable lists | C7: names are data, `src/world/engine/names.js` + `data/names.json` (D-058) | `b87c908` |
| `c7-realm-renaming-hack/` | `99999-v2-names`: eight realms renamed as the page drew (the setters of `innerHTML`, `textContent`, `title`, the canvas's `fillText`, about twenty rules) | C7: the names are in the source (P6, D-058) | `b87c908` |
| `figure-rule-drawn-arms/` | The figure library's first arms: one sword for every sword, one spearhead for every pole arm, one heater, a belt tool for every axe and mace (`gear.js` as it stood) | Owner order 52: every weapon and shield is drawn as a made thing by `src/ui/engine/figure/arms.js` (D-050) | `bcfd0d5` |
| `p3-ambitions/` | The ambitions (97-first-life-fixes part 3: `c-ambition.core.js`, `ambition.events.js`), What now's second-half pointers and the ruler's desk | Owner order 54, P3: nothing handed to the player; the `pa_*` scenes follow what he seeks (`src/people/9989-what-you-seek`) (D-062 addendum) | `c6fb716` |
| `p3-chapters/` | 9993-life-chapters: chapter cards with aims, the dynasty legacies | Owner order 54, P3, with the ambitions (D-062 addendum) | `c6fb716` |
| `w1-5-war-score-and-peace/` | The war score and the peace it made: `A.checkPeace`, the old `A.settleWar`, `A.warYear`, `A.warFront`, `A.wsScore`, `A.peaceOdds`, the score-priced peace table, the AI offers read from the score, the forced-peace log | W1-5: a war ends only by surrender or defeat, decided through `A.WHY` (`src/war/9999953-surrender`, D-091) | `84b7f92` |
| `s1-proficiencies/` | The 38 proficiencies (0 to 100, a daily drip, five wrappers, bars, tier words and stars): `A.trainSkill`'s wrapper, the failed-check top-up, the player-only skill merge, "Hafts", the old views | S1b: skills with levels and experience, `src/people/36-skills` (order 63, D-072) | see `docs/HISTORY.md` H-069 on; its `NOTE.md` names each piece |
| `s1-skill-words/` | S1's seven words for a level (Beginner to Legend), the Roman steps, `SK.levelName`/`wordName`/`levelOfWord`, `C.lvl`'s word form, the views that printed them and the proof's words | The skills rebuild's switch: the rungs hold the level, `A.SK2.label` prints "C · Lv 3" (orders 78 and 83, `docs/design/skills-v2.md` §6.1) | `d99799c2` |
| `w0-war-score-and-templates/` | The War Room's Templates tab and editor, the army doctrine buttons, the war score bars and their click-open notes | W0: no war score and no army templates for the player (order 34, D-052) | `39ee589` |
| `w1-4-levies/` | The release's emergency levy and levy law (`A.emergencyLevy`, `A.LEVY`) | W1-4: conscription only for a named need, decided through `A.WHY` (order 54, D-086 to D-089) | `26e0068` |
| `w1-6-faction-dice/` | `A.aiFactionAnswer`, `A.aiRevolt` and `A.startWar`'s two ally rolls | W1-6: factions, coups and revolts by reasons (`src/nobility/9999954-realm-peace`, D-097 to D-103) | `67bca05` |
| `titles-hints/` | The rumours of titles (`tt_hint`, `TT.hintable`, Records' "Things you have heard", the hint lines of `data/titles/`), the crown's "does not name you" line and the deed on another person's title card | Order 92: no hints anywhere about titles (D-185) | `177c9970` |
| `bestiary-high-roost/` | The High Roost Dragon and the Dragon Lord of the High Roost: D-185's fourth ancient dragon and its kin (the generator's line and the two species rows) | Order 95 and its follow-up: only three ancient dragons under the King, "remove the dragon of high roost" (D-191) | `1c8631b6` |
