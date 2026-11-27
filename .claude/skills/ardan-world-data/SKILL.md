---
name: ardan-world-data
description: "The map of Ardan's world content and the safe way to change it. Use whenever you add, rename, move, rebalance, merge or delete any world content in Ardan: a realm, house, ruler or other person, place, culture, faith, war or chronicle entry, legend, master of a race, creature or bestiary species, demon, dragon, figure profile, title, class, skill or art, item, level band, army number or rarity word. Also use when hunting or fixing a contradiction between two descriptions of the same thing (a being with two sexes, a home in two places, a count that disagrees, a test that enforces an old rule), when a brief says order 97, 98, 99 or 100, Primordials, Vaskareth, demons by rank, rarity ladder, Dragon Slayer, thirty-four realms or a world diagnostic, and before you grep for 'where does this fact live'. Not for progression numbers alone (rpg-progression-design) or the step's process (ardan-dev-process), which it complements."
---

# Ardan world data: where every fact lives, and how to change it safely

**One job:** change a fact of Ardan's world once, in its source, with every copy, reader, save field, event text and
test brought along, so no two places tell two stories. Contradictions between copies of one fact are the commonest bug
class here (the order-97 audit found 40; most were the same being described differently in `data/legends.json`,
`data/figures/*.json`, `data/titles/*.json` and the release lore).

Read with it: `CLAUDE.md` (rules), `docs/OWNER_ORDERS.md` from order 90 (the newest intent: the owner's newest order
wins), `docs/PROGRESS.md` "Order 100" (who is on which wave). The process of a step (branch, tests by tier, records) is
`ardan-dev-process`; numbers for levels, classes, titles and skills are `rpg-progression-design`; any name a player
reads (new or renamed) also goes through `cold-reader-naming`.

References (read the one you need):
- `references/data-map.md`: every source file with counts, id formats, readers, the copies in code and docs, the save
  fields that hold ids, the generators.
- `references/contradiction-hunt.md`: the repeatable world diagnostic (how the audit was made), with commands.

Scripts (read-only, run from the repo root):
- `scripts/find-copies.sh [-i] [--blobs=DIR] TERM...`: every file that holds a term, grouped by kind of copy.
- `scripts/world-xref.mjs [--only=pronouns,places,bands,counts,rarity,masters,lore,creatures,code,ids]`: cross-checks
  that no linter makes; prints leads.

## The safe-change method

### 1. Find every copy first

```sh
bash .claude/skills/ardan-world-data/scripts/find-copies.sh -i 'ghazrul' 'the Unmaker'   # ids AND names AND epithets
node .claude/skills/ardan-world-data/scripts/world-xref.mjs --only=pronouns,places,code
```

Search the id, the name, the epithet and the plural (`-i`: ids are lowercase, names capitalised). Without the script:
`rg -n -i -w 'term' data src tools tests docs -g '!**/a-v2.core.js' -g '!archive/**' -g '!tools/critique-probes/**'`.
Write down each claim each file makes (name, sex, age, level, home, count, liege, title, date). **Watch for collisions**:
the orc culture word `ghazrul` is also the Archdemon's id; "Cinder", "Quill" and "Old Smoke" are figures and common
words; `sword-saint` is a legend, a class and a title.

### 2. Pick the source of truth, and make the others read it

| Fact | Source of truth |
| --- | --- |
| realms, houses, cast, places, cultures, faiths, history, lore creatures | the release lore, `src/core/release/core/00-lore.json` and `lore/*.json` (edit in place, X1) |
| the power scale, legends, masters, beasts, figures, titles, classes, levels, skills, military, names | `data/` (one file per subject; see the table below) |
| a generated file (`data/bestiary.json`, `data/skills/families.json` and `ladders/`, `data/names.json`) | **its generator and the generator's input**, never the JSON |
| a figure overlay (`figures/race-masters.json`, `figures/legends.json`) | the sheet it links (`power.json` masters, `legends.json`); the overlay adds only what the sheet lacks |

Then change the copies to agree, or better, remove them: code should read the data (`A.POWER.being(id).n`,
`A.realmShort(rid)`, `LORE.realms[rid].name`) rather than repeat a name or a number in prose. A new prose copy in code
(like `b-wilds.core.js`'s `WOKE` news lines) needs a reason in a comment.

### 3. Names are words; ids are keys

- **Change a name freely; change an id almost never.** Old saves store ids (`S.realms[POL-NN]`, `S.pw.leg[legendId]`,
  `S.tt.u`, `p.tt.h[titleId]`, `p.lv.cr` classes, `pc.ks`/`pc.ka` skills, `S.pw.wild[].sp` species,
  `p.flags.fig_<id>`, `p.flags.ev[eventId]`; full list in `references/data-map.md` §6). When a being is recast (Ghazrul
  becomes Red), keep `ghazrul` as the internal key and change `n`, the words and the looks, and record the mapping in
  `docs/DECISIONS.md`.
- **If an id must change:** add a step to `SV.STEPS` (`src/core/99998-v2-saves/saves.core.js`, or `SV.STEPS.push` from
  your feature, as `level`, `classes`, `standing` and `names` do) that moves every field holding it, bump `SV.VER` with
  its comment, and prove it with a save from before (`tests/saves/`, `savesStillLoad`, your feature's `*OldSaves` test).
- **Realms and people are copied whole into the state at a new game**, so a renamed realm or cast person keeps the old
  name in an old save until a step renames it: the precedent is `A.NAMES.renameState` (step `names`,
  `src/world/999981-names-and-cultures/names.core.js`). Prose the life already logged stays as written.
- **Great houses are saved as a diff against `LORE.houses`**: an edited field reaches old saves by itself, but a
  removed or renamed `FAM-` id breaks the unpack (`A.houseTemplate` returns null). Never delete a FAM id.
- New fields must tolerate old saves where they are missing; ids are not contiguous (FAM up to 702, PLC, BLD gaps).

### 4. Generated data through its generator

```sh
node tools/powers/gen-bestiary.mjs            # data/bestiary.json (families, lines, levels, world counts, caps, CRE map)
node tools/skills2/seed-data.mjs              # data/skills/families.json and ladders/*.json (rung names in its LADDER)
node tools/c7/build-names-data.mjs            # data/names.json from docs/research/c7-name-data.json (leans in LEAN)
node tools/build-v2.mjs                        # the v2 bundle a-v2.core.js after editing src/*/engine/*.js
```

Each takes `--check` (exit 1 when the file differs from what it would write). No CI job runs the first three: run them
yourself. **`build-names-data.mjs --check` fails today**: W1-1 hand-swept "Marshal" to "Marcher" in `data/names.json`, so
regenerating would undo it; fix its input or add a rule before regenerating.

### 5. Event text

- The release's packs (`src/core/release/content/*.js`) keep every function as the release's exact minified one-liner;
  `A.evAudience` classes events by regexes over `cond` and `text` source (`C.ruler(`, `C.noble(`, tavern, street...).
  A name sweep through them is a change to text the game reads: build before and after and run
  `node tools/release/identity-probe.mjs before.html after.html` (same classes, same fixed-seed lives); a pure rename of
  words should differ only where the words are.
- Prefer tokens over literal names (`{realm}`, `{realmShort}`, `{capital}`, `{ruler}`, `{faith}`) so a rename is one
  edit. An unfilled token drops the event.
- Realm conditions use ids (`C.realm(p, "POL-24")`): a realm's new name never needs them changed.
- Feature events (`*.events.js`): `node tools/lint-events.mjs --feature=<name> --html=<build>`,
  `node tools/lint-choices.mjs --feature=<name> --html=<build>`; kin only from the tree (`tools/lint-kin.mjs`); 80 words,
  12 a choice, the house voice; no percentages; no hints of hidden titles (`tools/lint-titles.mjs` reads the source).

### 6. Check, by kind of content

Build privately once (`node tools/build.mjs --out=/tmp/ardan/<me>/x.html --unpack=/tmp/ardan/<me>/blobs`), then run the
row's gates. Tests run as `node tests/run.mjs /tmp/ardan/<me>/x.html --only=a,b --workers=2` (a browser test takes
from 5 s to several minutes: `figRegistry` took 229 s in this container).

| Content | Source | Copies elsewhere | Readers | Gates |
| --- | --- | --- | --- | --- |
| realm (name, form, ruler, capital) | `00-lore.json` `realms`, `titlesByRealm`, `rulerHistory`; ruler in `lore/01-cast.json` | `houses[].headName`, `GD.REALM_CULTURE/FAITH/HUMAN_CULTURE`, `GD.NAMING`, per-id cases in `03-engine-base.js`, event packs (100 files name Aldmark), `47-realm-customs` bibles, `54-character-voices`, `data/names.json` `lean`, `data/military/standing.json`, `academies`, map engine, music and dress tables | release core, ~40 features (`LORE.realms`) | `nmRealms`, `nmOldNames`-style test, `msSizes`, `savesStillLoad`, identity-probe, `coherency.mjs --quick` |
| house, person of the cast | `00-lore.json` `houses`, `lore/02-families.json`, `03-houseDeep.json`, `01-cast.json` | `headName`, `rulerHistory`, `schools[].masterId`, events | release core, `56-court-and-treasury`, figures (rulers, great houses) | `figRegistry`, `figKnown`, `savesStillLoad`, coherency |
| place, province, region | `00-lore.json` `map.provinces`, `realms[].capital` | figure and legend `home` names (Hell, the Dragon Mountains: not in the lore), `76-beast-habitats` regions (`W-08, the Crown Range`), the map branch gazetteer | map, journeys, powers (`PW.place`) | `world-xref.mjs --only=places`, `figRegistry` |
| culture, names | `00-lore.json` `cultures`; pools in `data/names.json` (generated) | `GD.REALM_CULTURE`, customs words, voices, dress (`ui/engine/figure/cultures.js`) | `A.NAMES`, v2 `names.js` | `build-names-data.mjs --check`, `nmCensus`, `nmTwins`, `nmFiefs`, `node --test tests/v2/names.test.js` |
| faith, history, secrets | `00-lore.json` `faiths`, `wars`, `chronicle`, `figures`, `secrets` | `GD.REALM_FAITH`, `57-world-chronicle`, `26-belief-versus-truth`, legends' histories (dates) | those features | `world-xref.mjs --only=lore`, the dates recipe in `contradiction-hunt.md` §3.4 |
| legend | `data/legends.json` | `figures/legends.json` (groups), `titles/legends.json` and `titles/figures.json` (holders, texts), `figures/ancient-*.json` (`liege`, grudges, stories), `power.json` band words, `b-wilds.core.js` and `d-view.core.js`, tests (`pwLadder`, `pwStretched` `OLD`), `docs/design/powers.md`, READMEs | `A.POWER` (`PW.LEG`), `9999975-level`, `A.FIG`, `A.TT` | `lint-figures`, `lint-titles`, `pwLegends`, `pwLadder`, `pwPowerNotLevel`, `pwStretched`, `figRegistry`, `ttLegends`, `lvLegends` |
| master of a race | `data/power.json` `masters` | `figures/race-masters.json` (repeats story: the Eldest Blade is she / four hundred years there, he / nine hundred here), the realm's lore ruler in the same hall | `A.POWER` (`PW.MAS`), `A.FIG` | `lint-figures`, `world-xref.mjs --only=pronouns,masters`, `pwLadder` |
| ancient demon, ancient or elder dragon | `data/figures/<category>.json` (fixed) | bestiary kind and `world` count, `titles/figures.json`, legends' grudges | `A.FIG`, `PW.FIG` | `lint-figures` (counts, kinds, levels within 10, titles' holders), `figRegistry`, `figKnown` |
| creature, demon kind, dragon kind, count | `tools/powers/gen-bestiary.mjs` -> `data/bestiary.json` | `00-lore.json` `creatures` (sizes in kg, "True:" lines), release duel rows, `76-beast-habitats`, `power.json` band words, `a-titles.core.js` (which families count as a dragon), `pwBands` (cap 100) | `A.POWER` (`PW.species`, the wilds), figures | `gen-bestiary.mjs --check`, `pwBestiary`, `pwBands`, `pwEvolution`, `pwEncounter`, `world-xref.mjs --only=bands,counts,creatures` |
| title | `data/titles/{people,legends,figures}.json`, words in `vocab.json` | sheets' `titles` arrays (holders must agree), `docs/design/skills-v2.md` §11, `9999976-titles/README.md` | `A.TT`, `PW.titleRef`, the release event view | `lint-titles`, `ttEarned`, `ttUnique`, `ttCaps`, `ttLegends`, `ttHidden`, `ttSave` |
| class | `data/classes.json` (hand classes and `generator`) | figure `class` and master `road`, title ids of the same name | `9999975-level` (`CL`) | `lint-figures` (roads), `lvClass`, `lvClassParts`, `lvWalls` |
| skill, art | `data/skills/` (families and ladders generated; `kinds/`, `arts/`, `recipes.json`, `vocab.json` by hand), S1's `data/skills.json` | legends' inline skills, figures' library skills, `GD.PERKS` | `36-skills`, `37-skills2`, v2 `skills2.js`, figures | `lint-skills`, `seed-data.mjs --check`, `node --test tests/v2/skills2*.test.js`, `sk2Active`, `sk2KindCaps`, `sk2Migrate` |
| level, band, anchors | `data/level.json`, `data/power.json` (`bands`, `levelCurve`) | READMEs (`9999975-level`), `docs/design/powers.md`, `bestiary-bands.md` | `A.LV`, `A.POWER` | `lvAnchors`, `lvSeed`, `statBounds`, `pwBands`, `tools/bench/balance.mjs` |
| army numbers, soldiers' words | `data/military/*.json` (`standing.json` sets every host; lore `army` is only a fallback) | `GD.MIL`, `GD.TROOPS`, `war/*` READMEs | `9999955-muster`, `56-units`, `57-ladder`, `58-paths`, `78-standing` | `mdData`, `mdWordsAgree`, `msSizes`, `msWords`, `w1NoMarshalLint`, `w4NoLevyLint` |
| item, rarity word | sheet `items[].quality`, `GD.GEAR`; ladders in `skills/vocab.json`, `titles/vocab.json`, `classes.json` | the four ladders disagree today (order 98: one ladder basic, rare, epic, legendary, mythical) | skills, titles, classes, codex | `lint-skills`, `lint-titles`, `world-xref.mjs --only=rarity` |

Always also: `node tools/lint-figures.mjs && node tools/lint-titles.mjs && node tools/lint-skills.mjs && node tools/lint-kin.mjs`
(seconds each, all run by `tools/check.mjs`), then `node .claude/skills/ardan-world-data/scripts/world-xref.mjs` and compare
its leads with a run on the trunk: your change should remove leads, never add them.

### 7. Look at the built page for leftovers

```sh
bash .claude/skills/ardan-world-data/scripts/find-copies.sh -i --blobs=/tmp/ardan/<me>/blobs 'old name' 'old epithet'
```

The page's payload is compressed, so grep the unpacked blobs (`ardan-core.js`, `ardan-content.js`, `ardan-lore.js`),
never `x.html`. For what a played life prints (codex, news, log), add a test in the style of `nmOldNames`
(`src/world/999981-names-and-cultures/test.mjs`): it scans every script, the lore, every event, a new game's realms and
provinces, three years' log and the page text for a retired-names regex. A retirement that matters keeps such a test.

### 8. Records

- `docs/DECISIONS.md` for every recast, merge, id kept as a key, or rule changed (`D-NEW-1` unless your brief reserves
  numbers); `docs/HISTORY.md` (`H-NEW`), `CHANGELOG.md` in the player's words.
- Update the living docs that repeat the fact (feature READMEs, `docs/design/powers.md`, `bestiary-bands.md`,
  `skills-v2.md`, `docs/MASTER_PROMPT.md` when the integrator asks). Never rewrite records: `docs/HISTORY.md`, old
  `CHANGELOG.md` sections, `docs/VERSIONS.md`, `docs/OWNER_ORDERS.md`, `docs/prompts/`, `archive/`, `tests/saves/`.
- Retired content goes to `archive/` with a note, never deleted.

## Pitfalls seen in this repo

- A test can enforce the old rule (`x3OneUnit` fails any "mile"; `pwBands` holds dragons to 100): change it in the same
  step as the data, and say so.
- `GD` tables defined in both `02-game-data-a.js` and `-b.js`: the `-b` copy wins.
- `docs/NAMES.md` is the generated table of file renames, not the world's naming rules; those belong in
  `docs/design/names-and-cultures.md`.
- `A.DATA.titles` is built at run time; there is no `data/titles.json`. A new file under `data/titles/`, `data/figures/`
  or `data/skills/` is read automatically by prefix: a stray file is live content.
- Generated figure categories (`rulers`, `great-houses`, `generals`, `order-masters`) store no people: change the rule or
  the lore, not the JSON.
- The figures' Hell and Dragon Mountains places exist only in data (the trunk's map has no Hell, the release lore has the
  Crown Range): a home is a name until the map rebuild of order 100 wave 2 gives it a province.
- Parallel builders: one owner per data file in a wave; two agents editing `data/legends.json` is a merge, so say so in
  your report.
