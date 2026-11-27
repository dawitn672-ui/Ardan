# Ardan's world data: the full map

Surveyed on the trunk at `d0d793d3` (2026-11-27, orders 98 to 100 recorded, wave 1 builders running). Counts are today's:
re-count with the one-liners at the end before you quote one. Paths are from the repo root.

## Contents

1. How content reaches the page
2. The release lore (`src/core/release/`)
3. `data/` file by file
4. Copies kept in code and docs
5. Id formats
6. Ids and words a save stores (what a rename breaks)
7. Generators and their inputs
8. Re-counting

## 1. How content reaches the page

| Source | On the page as | When | Read by |
| --- | --- | --- | --- |
| `src/core/release/core/00-lore.json` | `const LORE = JSON.parse("...")` at the head of the core blob | at start | the release core and ~40 features (`LORE.realms`, `.creatures`, `.cultures`, `.map`...) |
| `src/core/release/lore/NN-key.json` (cast, families, houseDeep, styles, academies) | the `ardan-lore` blob, `LORE.cast` etc. on first use (`window.ARDAN_LORE()`) | lazily | release core, `56-court-and-treasury`, `40-memory-realm-blood`, tests |
| `data/**/*.json` | `A.DATA['<path without .json>']` (`data/titles/people.json` -> `A.DATA['titles/people']`), one statement before the first feature (`tools/build.mjs` `dataBlock()`) | before any `*.core.js` | features; never the release core directly, except `03-engine-base.js` (names, skills) |
| `GD.*` tables in `src/core/release/core/02-game-data-a.js` / `-b.js` | `GD` | at start | everything. **`-b` redefines some of `-a`'s tables** (`GD.SHOP`, `GD.HAIRSTYLES`, `GD.BEARDS`, `GD.BUILDS`): the later one wins, so edit the `-b` copy or you change nothing |
| `*.data.core.js` in a feature | code appended to the core blob | at start | that feature |

Assembled at run time, never a file: `A.DATA.titles = { vocab, titles }` (built by `src/people/9999976-titles/a-titles.core.js`
from every `data/titles/*.json` except vocab), `A.TT.BY`, `A.POWER.LEG/MAS/FIG` (`src/world/9999970-powers`),
`A.FIG.FILES` (`src/world/9999977-figures`), the generated classes (`CL.generate` in
`src/people/9999975-level/c-classes.core.js`, from `data/classes.json` `generator`). **Any new `data/titles/*.json`,
`data/figures/*.json` or `data/skills/**/*.json` with the right shape is picked up by its reader automatically**
(they loop over `A.DATA` keys by prefix).

## 2. The release lore (`src/core/release/`)

The shipped canon. Edit it in place (X1, D-028); it is the source of truth for realms, houses, people, places, faiths,
cultures and history. The engine copies some of it into the state at a new game (see §6).

`core/00-lore.json`:

| Key | Count | Id / shape | Notes |
| --- | --- | --- | --- |
| `realms` | 34 | `POL-01`..`POL-34` | `name` (long), `short`, `title`, `type`, `race`, `cult` (a culture key such as `north`), `capId` (PLC), `capital`, `ruler` (CHR, two joined by `;` for a joint rule: POL-22, POL-31), `pop`, `pops`, `army` (only a fallback: `A.MIL.seedArmy` from `data/military/standing.json` sets the host, D-194), `primer`... |
| `cultures` | 24 | `CUL-01`..`CUL-24` | `pols` (realms), name pools `m`/`f` (the old pools; `data/names.json` is what names people now) |
| `faiths` | 19 | `REL-01`..`REL-19` | `realms`, `belief`, `followers` |
| `houses` | 180 | `FAM-001`..`FAM-702` (gaps) | the great houses: `realm`, `kind`, `seat`/`seatId`, `head` (CHR) **and `headName` (a copy of the cast's name)** |
| `bloodlines` | 42 | `BLD-01`..`BLD-43` (gap) | `fam`, `realm`, `trait`, `how` |
| `rulerHistory` | 46 | by POL id | `[name, epithet, from, to, 'reigning'|'died'...]`: **a third copy of each ruler's name** |
| `wars` | 43 | `[WAR-NN, name, from, to, text]` | history in AR years |
| `figures` | 100 | `[FIG-NNN, name, race, born, died, note]` | the historical figures (not `data/figures/`) |
| `chronicle` | 220 | `[year, title, text]` | up to 1104; the game starts in 1105 (`A.newState`, `03-engine-base.js`) |
| `secrets` | 71 | `SEC-01`..`SEC-71` | `pub` / `truth` (the belief-versus-truth system reads both) |
| `creatures` | 64 | `CRE-01`..`CRE-64` | `name`, `cat`, `habitat`, `size` (metric), `behavior`, `weak`, `belief`, `truth`; 46 are mapped to a bestiary species by its `cre` field |
| `schools` | 61 | by name | `masterId` (CHR) |
| `ladders` | 35 | rung codes `M01`, `S01`, `N05`... | the rank ladders (military, noble) |
| `titlesByRealm` | 34 | by POL | style and forms of each realm's titles |
| `racesLore` | 7 | human, elf, dwarf, orc, giant, halfelf, halforc | heights in cm, weights in kg |
| `lexicon` 29, `tactics` 137 (`TAC-NNN`), `songs` 20, `sayings` 60, `clock` 33 | | | |
| `map` | 306 provinces | `id` 0..305 (the index), `pid` `PLC-NNNN` (not contiguous), `owner` POL, `terr`, `biome` | the v2 map regenerates the geometry from the seed (`S.v2map`) but keeps ids, names and owners |

`lore/`: `01-cast.json` 573 people `CHR-0001`..; `02-families.json` 620 lesser houses `FX<realm>-<n>` (`FX01-001`, realm
01 = POL-01; `liege` a FAM id); `03-houseDeep.json` 180 by FAM id (arms, words, history, colours); `04-styles.json` 265
fighting styles `ST<realm>-<n>`; `05-academies.json` 34 by POL id.

`core/*.js` also hold world facts as code: `GD.RACES`, `GD.REALM_CULTURE` (35 keys: the 34 realms and `unclaimed`),
`GD.REALM_FAITH`, `GD.REALM_HUMAN_CULTURE`, `GD.NAMING`, `GD.GIANT_HALLS`, `GD.TIERS` (`18-event-view-a.js`: the old
fighter tiers "Master"/"Legend"), `GD.MIL`, `GD.NOBLE_RUNGS`, the release beasts' duel rows (`06-prison-travel-school-ai.js`
around the CRE rows), and per-id special cases (`03-engine-base.js`: `armyQ` for POL-06/07, 09/23, 10/28/29).
`content/*.js` (30 packs) hold realm names, ruler names and creature names in event text; their functions are minified
one-liners read as text.

## 3. `data/` file by file

| File | What (count today) | Ids | Written by | Read by | Gate |
| --- | --- | --- | --- | --- | --- |
| `legends.json` | the 16 legends (800-1000): Sarnavoth, the three Primordial Archdemons (today Ghazrul, Morvane, Vethrael; order 98 makes them Noir, Blanc, Red), the Sword Saint, Vaskareth... Full sheets: `n`, `fam`, `level`, `int`, `age`, `titles` (ids), `prof`, `home {type, terr, what, place}`, temper, history, grudges, `d`, `skills` (inline), `items` | kebab: `sarnavoth`, `sword-saint`, `pale-shepherd` | hand | `A.POWER` (`9999970-powers`), `9999975-level`, figures registry (link), titles | `lint-figures`, `lint-titles`, `pwLegends`, `pwLadder`, `lvLegends` |
| `power.json` | the one power scale: `bands` 10 (G..SSS, words naming example creatures), `levelCurve`, `people` (the human fit), `masters` 4 (`m-giant-king`, `m-dwarf-anvil`, `m-elf-blade`, `m-orc-khan`), `capabilities` 12, `intelligence` 4, `terrains` 7 | `m-*` | hand | `A.POWER`, `9999975-level`, `gen-bestiary.mjs` | `pwBands`, `pwLadder`, `lint-figures` |
| `bestiary.json` | 19 families, 107 lines, 301 species. Species: `id`, `n`, `fam`, `line`, `form`, `tier`, `level`, `might`, `int`, `prof`, `terr`, `world` (how many live; set for dragons 84 and demons 33), `cre` (the lore creature it replaces), `next`. `families.dragons.cap` 100 | kebab species; lines `fam.line` | **generated**: `tools/powers/gen-bestiary.mjs` | `A.POWER` (`PW.species`, `PW.room`, the wilds), figures (a fixed figure's `kind` is a species id) | `gen-bestiary.mjs --check`, `pwBestiary`, `pwBands`, `lint-figures` |
| `figures/vocab.json` | the registry's words: kinds, groups, fame, traits 24, temper axes, goal kinds, grudge kinds, `levelSpread` 10 | | hand | `9999977-figures` | `lint-figures` |
| `figures/ancient-demons.json` | **fixed** 33 (sworn 12/11/10 to the three Archdemons by `liege`), full profiles; `home {name, domain, known}` are Hell's places by name | kebab (`skarn`, `old-smoke`) | hand | `A.FIG`, `PW.FIG` | `lint-figures`, `figRegistry` |
| `figures/ancient-dragons.json` | **fixed** 3 (Ashgar, Rimewing, Galeheart; order 98 folds the storm one into Vaskareth) | kebab | hand | same | same |
| `figures/elder-dragons.json` | **fixed** 9 (the Red Widow among them, `widow`) | kebab | hand | same | same |
| `figures/legends.json` | **link**: groups `legends.json`'s 16 (a legend in exactly one group), plus `secret` | | hand | same | `lint-figures` |
| `figures/race-masters.json` | **link**: overlays `power.json`'s 4 masters (class road, arts, temper, goals, grudges, home, secret) and **repeats story facts** | `m-*` | hand | same | `lint-figures` |
| `figures/rulers.json`, `great-houses.json`, `generals.json`, `order-masters.json` | **generated** categories: only the rule and the voice words; people computed from the state, never stored | | hand | same | `lint-figures`, `figKnown` |
| `titles/vocab.json` | rarities (`uncommon`, `rare`, `legendary`; `unique` a flag), weights, budget, predicates 17, deed kinds 20, effect types, wounds | | hand | `9999976-titles` | `lint-titles` |
| `titles/people.json` | 15 titles a person earns (Wyrm-Slayer -> Dragon Slayer in order 98) | kebab | hand | `A.TT` | `lint-titles`, `ttEarned`, `ttUnique` |
| `titles/legends.json` | 30 titles of the legends and masters, `holders` by id | kebab | hand | `A.TT`, `PW.titleRef` | `lint-titles` (holders agree with the sheets), `ttLegends` |
| `titles/figures.json` | 21 titles of the fixed figures (`ember-sworn`, `debt-sworn`, `choir-sworn` name the old Archdemons) | kebab | hand | same | same |
| `classes.json` | 29 hand classes (steps 1-3), `rarities` 6 (`common`..`legendary`, `unique`), `generator` (templates x roads: 155 classes in all at load) | kebab (`swordsman`, `sword-saint`) | hand; the rest generated at load | `9999975-level` `CL` | `lint-figures` (class roads), `lvClass`, `lvClassParts` |
| `level.json` | the level's curve, `foes`, `legends` (refining per year), `floor`, `seed` (bands for nobles, posts), `points`, `ways` 29 | | hand | `9999975-level` | `lvAnchors`, `lvSeed`, `lvWalls`, `statBounds` |
| `skills.json` | S1's 28 skills, 242 concepts, `jobSpec` | skill keys (`sword`, `persuasion`) | hand (S1) | `36-skills`, `seed-data.mjs` | `lint-skills` |
| `skills/vocab.json` | ranks D..SSS and X, `rarities` (`common`, `uncommon`, `rare`, `unique`, `legendary`), kinds (passive, active, reaction, aura, blessing, flaw, buff), costs | | hand | `37-skills2`, titles, figures | `lint-skills` (`tools/lib/skills2-check.mjs`) |
| `skills/families.json` | the 28 families | family keys | **generated** `tools/skills2/seed-data.mjs` (from `skills.json` and `GD.PERKS`) | `37-skills2`, v2 engine `skills2.js` | `seed-data.mjs --check`, `lint-skills` |
| `skills/ladders/*.json` | 11 files, 140 rungs (D, C, B, A, S per family) | snake (`stick_and_lath`) | **generated** `seed-data.mjs` | same | same |
| `skills/kinds/{arms,beings,body}.json` | 27 + 10 + 9 arts | snake (`quick_cut`, `ember_breath`) | hand | `37-skills2` `f-kinds`, figures (a being's library skills) | `lint-skills`, `lint-figures`, `tests/v2/skills2-kinds.test.js` |
| `skills/arts/merges.json`, `skills/recipes.json` | 8 merges, 8 recipes | snake | hand | `37-skills2` `e-merge` | `lint-skills` |
| `military/branches.json` | 5 ranks, 15 branches, 8 ways, 5 musters | | hand | `9999955-muster`, `9999957-ladder` | `mdData`, `mdWordsAgree` |
| `military/roles.json` 10, `drills.json` 36, `duties.json` 10, `paths.json` 15 | the soldier's roles, drills, duties, roads | | hand | `9999955-muster`, `9999956-units`, `9999957-ladder`, `9999958-paths` | those features' tests |
| `military/standing.json` | each realm's standing host: upkeep, floor, cap, kinds 17, elite 13, race bands | | hand | `9999978-standing` (`A.MIL.seedArmy`) | `msSizes`, `msWords` |
| `names.json` | every name pool: `common` (given by sex, family, places, trades, epithets), `pools` 9 (steppe, desert, south, giant, dwarf, elf-wood, elf-sea, orc-horde, orc-tusk), `cultures` 24 by CUL id, `lean` 11 by POL id | | **generated** `tools/c7/build-names-data.mjs` from `docs/research/c7-name-data.json` | `A.NAMES` (`999981-names-and-cultures`), v2 `names.js`, `03-engine-base.js` | `nmCensus`, `nmTwins`, `tests/v2/names.test.js`; the generator's `--check` **fails today** (see §7) |

## 4. Copies kept in code and docs

These hold world facts outside `data/` and the lore. No linter compares them with their source; `find-copies.sh` and
`world-xref.mjs` (this skill's `scripts/`) find them.

| Where | What it repeats |
| --- | --- |
| `src/world/9999970-powers/b-wilds.core.js` | legend ids in rules (wake reasons, the Saint's fight), the `WOKE` news lines (Sarnavoth "awake after nine hundred years" under "the Crown Range"; `legends.json` has him asleep sixty years under the Dragon Mountains), the Sword Saint's name in prose |
| `src/world/9999970-powers/d-view.core.js` | `sword-saint` known from birth |
| `src/world/9999977-figures/a-registry.core.js` | a legend's home as `known: true` for all sixteen |
| `src/people/9999976-titles/a-titles.core.js` | which bestiary families count as a dragon slain |
| `src/world/47-realm-customs/bible.*.data.core.js` | each realm's want, fear, place and customs, and each culture's words (the orc word `ghazrul` collides with the Archdemon's id) |
| `src/events/54-character-voices/voices.*.data.core.js` | voices by realm and culture |
| `src/map/76-beast-habitats/habitats.core.js` | the release beasts' ranges by canon region (`W-08, the Crown Range`) and the towns of each region |
| `src/ui/engine/figure/cultures.js`, `src/ui/73-music-score/modes.core.js` | dress and music by culture and realm |
| `src/people/engine/races.js` (v2 engine) | each race's body (cm, kg, lifespans); the bundle `a-v2.core.js` is rebuilt from it |
| `src/people/32-legend-and-master-caps` | `GD.LEGEND_CAP`, "Legends alive" (the old tier word) |
| `src/core/release/core/18-event-view-a.js`, `23-ui-f.js` | `GD.TIERS`, the codex's ladder of fighters and the "True:" lines of the lore creatures |
| `tools/powers/gen-bestiary.mjs` | the bestiary's families, lines, levels, world counts and caps, and the CRE mapping (`CRE` table) |
| `tools/skills2/seed-data.mjs` | the rung names of every family (`LADDER`) |
| `tools/c7/build-names-data.mjs` | the realm leans (`LEAN`) |
| tests (`src/*/*/test.mjs`) | legend ids, counts (`pwBands`: at most 100 dragons), lieges (`figRegistry`), the old levels (`pwStretched` `OLD`) |
| `docs/design/powers.md`, `bestiary-bands.md`, `legendaries/legendaries.md`, `skills-v2.md` §11, `names-and-cultures.md` | tables of levels, counts and names |
| `docs/MASTER_PROMPT.md`, feature READMEs (`9999977-figures`, `9999970-powers`, `9999975-level`, `9999976-titles`) | the same tables in prose |

Records keep the old words on purpose and are never rewritten: `docs/HISTORY.md`, `CHANGELOG.md` (old sections),
`docs/VERSIONS.md`, `docs/OWNER_ORDERS.md`, `docs/prompts/`, `archive/`, `tests/saves/`.

## 5. Id formats

| Thing | Format | Example | Contiguous? |
| --- | --- | --- | --- |
| realm | `POL-NN` | `POL-24`; a rebel faction `POL-31A` | no gaps in the 34; rebels add suffixes |
| place (province's town) | `PLC-NNNN` | `PLC-0003` Kingsmere | no; province `id` is 0..305 |
| person of the cast | `CHR-NNNN` | `CHR-0015` | 573 |
| person made in play | `p` + base36 (`A.uid`) | `p1k3` | per game |
| great house | `FAM-NNN` | `FAM-001` | gaps up to 702 |
| lesser house | `FX<realm>-<n>` | `FX01-001` | per realm |
| court house (v2 nobility) | `FAM-C...` | | generated |
| culture / faith / bloodline | `CUL-NN` / `REL-NN` / `BLD-NN` | | BLD has a gap |
| lore creature / secret / historical figure / war / tactic / style | `CRE-NN` / `SEC-NN` / `FIG-NNN` / `WAR-NN` / `TAC-NNN` / `ST<realm>-<n>` | | |
| canon map region (beast habitats only) | `W-08`, `E-13`, `S-04` | | |
| legend, master, figure, species, title, class | kebab-case | `sword-saint`, `m-elf-blade`, `old-smoke`, `cave-troll`, `ash-crowned` | |
| species line | `<family>.<line>` | `dragons.ashdragon` | |
| skill, rung, art | snake_case | `stick_and_lath`, `ember_breath`; S1 keys `sword` | |
| rarity / rank | words / letters | `legendary`; D C B A S SS SSS X | |

One id can name two kinds of thing (`world-xref.mjs --only=ids`): `sword-saint` is a legend, a class and a title. A
rename of one must decide about the others.

## 6. Ids and words a save stores (what a rename breaks)

The save is `A.S`, packed by `A.packState` (release `04-realms-and-war-years-a.js`), people without defaults (`A.V2SAVE`,
`src/core/99998-v2-saves`). Save version `SV.VER` = **23** today; the step list `SV.STEPS` (14 in the file, plus `names`,
`level`, `classes`, `standing` pushed by their features).

| State | Holds | Copied from the source at a new game? | A rename of the source... |
| --- | --- | --- | --- |
| `S.realms[POL-NN]` | `name`, `short`, `capital`, `ruler`, `primer`... | yes, whole | does **not** reach an old save: needs a step (the precedent: `A.NAMES.renameState`, step `names`, `src/world/999981-names-and-cultures/names.core.js`) |
| `S.people[id]` | cast people whole (name, realm, looks) and every made person | yes, whole | does not reach an old save |
| `S.houses[FAM-NNN]` | stored as a **diff against `LORE.houses`** (+ `houseDeep` arms, words) | template | an unchanged field **does** follow the lore into old saves; a **deleted or renamed FAM id breaks** the unpack (`A.houseTemplate` returns null) |
| `S.prov[i]` | name, owner POL, terrain | yes | old saves keep the old names |
| `S.pw.leg[legendId]`, `S.pw.known[id]`, `S.pw.metLeg[id]`, `S.pw.ref[id]` | each legend's place, wounds, grudges; who the player knows | made lazily for each id in `legends.json` | a renamed legend id starts fresh and the old record is orphaned: keep the id as an internal key, or migrate with a step |
| `S.pw.wild[{ sp }]`, `S.pw.met[speciesId]`, `S.pw.evo` | living wild beasts by species id | | a renamed species id: `PW.species(w.sp)` is null and the beast is skipped (silently lost) |
| `S.tt.u` (unique title -> holder), `S.tt.first`, `p.tt.h/x/b` | titles held by title id | | a renamed title id: holders lose it |
| `p.lv` (`L`, `pts`, `ct`, `cr` classes taken by id) | level and classes | | a renamed class id: the class is lost |
| `pc.ks`, `pc.ka`, `pc.kr`, `pc.ke`, `pc.kb`, `pc.kc`, `pc.kd` | rungs, arts, readied arts, evolutions by skill id | | renames need a step (as `skills2line` did) |
| `r.kn.h[houseId]` | each realm's knights by command | | |
| `p.flags[name]`, `p.flags.ev[eventId]`, `p.flags.fig_<id>` | flags by year | | a renamed event id or figure id loses its memory |
| `A.S.log`, news, waiting events, journal | prose already written | | stays as written (the names step rewrites some of it) |

Rule: **ids are internal keys; names are words.** Change a name freely in its source (and, for realms and people,
with a save step for old saves). Change an id only with a step in `SV.STEPS` that moves every field above, a bump of
`SV.VER` with its comment, and a sample save that proves it (`tests/saves/`, `savesStillLoad`).

## 7. Generators and their inputs

| Output | Generator | Input | `--check` today |
| --- | --- | --- | --- |
| `data/bestiary.json` | `node tools/powers/gen-bestiary.mjs` | the tables inside it, `data/power.json` | passes |
| `data/skills/families.json`, `data/skills/ladders/*.json` | `node tools/skills2/seed-data.mjs` | `data/skills.json`, `GD.PERKS` (`02-game-data-a.js`), its `LADDER` table | passes |
| `data/names.json` | `node tools/c7/build-names-data.mjs` | `docs/research/c7-name-data.json`, its `LEAN` table | **fails**: W1-1 (`35b2f9e3`) swept "Marshal" -> "Marcher" by hand in `common.family` and `common.trades`; running the generator would put "Marshal" back. Fix the input (or a rule in the generator), then regenerate |
| `src/core/99990-v2-engine/a-v2.core.js` | `node tools/build-v2.mjs` | `src/*/engine/*.js` | `--check` (run by `tools/check.mjs`) |
| `docs/NAMES.md` | `tools/rename-pass.mjs` | `tools/rename-map.json` | file and folder renames only, not world names |
| the generated classes (155 in all with the 29 hand ones, per the audit of 2026-11-26) | `CL.generate` at load | `data/classes.json` `generator` | n/a |

No CI job runs the three data generators' `--check`: run them yourself after touching their files.

## 8. Re-counting

```sh
node -e 'const L=require("./src/core/release/core/00-lore.json");for(const[k,v]of Object.entries(L))console.log(k,Array.isArray(v)?v.length:v&&typeof v==="object"?Object.keys(v).length:typeof v)'
node -e 'const B=require("./data/bestiary.json");const f={};for(const s of B.species){f[s.fam]=f[s.fam]||[0,0];f[s.fam][0]++;f[s.fam][1]+=s.world||0}console.log(B.species.length,"species",JSON.stringify(f))'
node -e 'for(const f of require("fs").readdirSync("data/figures"))if(f!=="vocab.json"){const d=require("./data/figures/"+f);console.log(f,d.category.kind,(d.figures||[]).length)}'
node -e 'for(const f of ["people","legends","figures"])console.log(f,require("./data/titles/"+f+".json").titles.length)'
grep -n "SV.VER = " src/core/99998-v2-saves/saves.core.js
```
