# The far lands: a size-agnostic map, and the Great Continent

**Aspect:** World (the owner's ask: a continent "significantly bigger, at least the size of Asia", with many more countries and kingdoms) · **Kind:** system, 9 patches, 3 code files, a generator and its checked-in data, no events. Stages 1 and 2 of `docs/plan/world-expansion-architecture.md`; the brief for the lands is `docs/research/world-foundations.md`.

The decision this builds on: the map opens **east**, no stored coordinate moves, and the Known World becomes the western end of a Great Continent.

## Stage 1: the map no longer knows its size

The release wrote the 7,000 × 4,500 km box into nine functions as `7e3` and `4500`, and 62-inked-map kept its own copy of the box. Now the frame is read from the grid (`a-frame.core.js`):

| Name | What | At today's size |
| --- | --- | --- |
| `MAP.KW`, `MAP.KH` | the frame in km, `MAP.gw * MAP.cell` by `MAP.gh * MAP.cell` | 7,000 × 4,500 |
| `MAP.big` | the frame is not the world as written | false |
| `MAP.ZREF` | the view width that is "zoom 1". A scale, not the frame, so town icons, names and banners appear at the same km per pixel in any frame | 7,000 |
| `MAP.IW`, `MAP.IH` | what the release's relief picture covers (the Known World) | 7,000 × 4,500 |
| `MAP.whole(W, H)` | the view that shows the whole frame in a W × H canvas, letterboxed in sea | null: the release draws as it always did |
| `MAP.fit()` | the full map's opening view: the whole frame, or in a wider frame the part around your home | the whole frame |
| `MAP.init` | builds the grid from parts: the map as written, plus the part `MAP.want()` names | the map as written |

**The patches** (`patches.mjs`, each `why` starts "world size from MAP"): `MAP.toCanvas`, `MAP.provAt`, `MAP.draw` (relief and realm layer placed in the frame), `UI.wrClampView` and `UI.wrClamp`, `UI.gmFit`, `UI.gmDraw` and `UI.drawWarBasic` (zoom from `MAP.ZREF`, the realm layer cut by `MAP.KW × MAP.KH`, the relief picture placed where it lies), `UI.gmAttach` and `UI.wrProvAt` (the cell under the pointer), `UI.wrView`. Every find also matches the fix layer alone (`--only=far-lands`).

**Changes in 62-inked-map** (only where it assumed the world's size; each is the identity at today's size):

- `KW`, `KH` read `MAP.KW`, `MAP.KH`; `BASE` and every zoom read `MAP.ZREF` (both 7,000, as before).
- The edge key of the traced province bounds was `a * 4096 + b`, which capped the map at 4,096 provinces. It is `a * 65536 + b`, enough for any Int16 province id. The Map's order is insertion order, so the traced lines are the same.
- Tile levels below 0 (`LMIN`) exist only in a frame larger than the world as written, whose whole view is coarser than level 0; the stand-in for a late tile is drawn from the coarsest level, not level 0.
- `MAP.ground`, `MAP.inkLines` and `MAP.marks` called with no view (the whole world) take `MAP.whole`'s letterboxed view when there is one.
- In a larger frame only: realm names are written most-peopled first and a name that would cross one already written waits for a closer zoom; keeps shrink when the whole frame is seen (zoom under 1 exists only there); dotted province bounds are left out below level 0 (a whole continent of dots).

**76-beast-habitats needed no change.** Its tables are built once from the map as written (`BH.resolve`), and its tests count a Known World game (306 provinces), which stays true. 99 makes 76 resolve at boot, before any far province is in `LORE.map`, and filters beasts in far provinces itself (below).

**Measured** (`flFrameIdentical`): the test derives the same build without this feature from the built file (it cuts this feature's code from the core blob and undoes its patches), plays three lives of five years in each (seeds 9901-9903, in Aldmark, Zanara and the Horde) and draws 11 map views in each style (the world tab, a 1400 × 900 whole map, `MAP.toCanvas`, the full map's fitted view, the full map at zoom 1, 3 and 8, the war room at 1.5, 4 and 9, `UI.wrView`). The state hash, the random stream, the state's size and all 22 view hashes are identical. (The edits inside 62 stay in both builds; they are the identity by construction and 62's own pixel tests cover them.)

## Stage 2: the Great Continent

### The frame

The lore (`canon/lore/far-lands.json`, `frame`) fixes the greater box at x 0 to 17,600 km and y -2,280 (75° N) to 6,610 (5° S), in the game's own km: x east from the Known World's west edge, y south from its north edge. That box reaches **north** of the Known World (the Black Pines and the Rime Coast lie at y < 0) and **south** of it (the Deep Southland, x 400 to 6,700, below the Known World's south edge). The brief's "y 0 to 8,900, extending downward" is the same box measured from its top (the lore's `ybox`); the game keeps the canon km so no stored coordinate moves, and the grid gets an origin instead:

| Name | What | Known World | Great Continent |
| --- | --- | --- | --- |
| `MAP.KX0`, `MAP.KY0` | km at grid cell (0, 0) | 0, 0 | 0, -2,640 |
| `MAP.KW`, `MAP.KH` | the frame's size in km | 7,000 × 4,500 | 17,600 × 9,250 |
| grid | cells of 10 km | 700 × 450 | 1,760 × 925, the Known World's cells copied in at cell (0, 264) |

The grid runs 360 km north of the lore's box so the Bone Isles (N-04, north of 75° N) fit. km → cell is `(km - KX0) / cell` everywhere (`a-frame.core.js`, the patches, 62-inked-map's tiles, glyph lattice and traced lines, the relief layer). At the Known World's size every origin term is `+ 0` or `- 0`, so stage 1's identity holds.

### The land

`gen/` is a deterministic Node generator (plain JS, no network, no packages). `node features/99-far-lands/gen/gen.mjs` writes `b-data.core.js`; `--check` fails if the checked-in file is not what it makes; `--preview=<dir>` writes pictures; `--lore=<file>` and `--out=<file>` are for trying a lore file. It reads the Known World from the vendored release and never writes it. With the lore present (it is), everything below comes from it; without it, the hand plan (`plan.mjs`) and placeholders stand in.

| Step | File | What |
| --- | --- | --- |
| The plan | `loreplan.mjs` | The lore's 90 regions (box, middle, area, heights, warmest and coldest month, rain, ground words, people), each realm's capital in km, the five straits with the two shores each names ("Between the Long Tail and the Great Western Isle"), 13 lakes (rift lakes long along their rift), 22 ranges (crest at 0.72 of the highest peak, width by kind), 27 rivers. |
| Land and sea | `shape.mjs` | The lore's region boxes overlap and their areas fill only 40 to 90% of them, so the land is cut, not drawn: every cell near the boxes is one region's (the box it lies deepest in); a cell's worth is its depth inside the lands (the boxes' union rounded and bent by a slow warp, so no coast follows a box side) plus shared noise near the coast; all of it starts as land, then the sea comes in from the open sea, least worth first, taking a region's cells only while it holds more than its area, never deeper than 320 km, never through one region into the next. So a region with land to spare loses it in bays and gulfs on its sea side, and a region boxed in on every side keeps its box rather than open a sea inside the continent. Capitals and strait shores are worth more, so the sea leaves them; straits are never land. Islands, archipelagos (noise-led, so they break into many isles) and chains (noise drawn out along the chain) are cut in their own boxes a channel off the mainland. |
| Seams | `geo.mjs` | Within 300 km of the Known World's east and south edges the coast is eased into the old map's own, carried straight across the edge (fading round its corners), so every coast that reached the old edge carries on. |
| Relief, climate | `geo.mjs` | Each region's heights and climate laid as fields, softened across region bounds; the ranges along the lore's lines; temperature moved by height against the region's own. |
| Rivers, biomes | `geo.mjs` | The lore's river courses; the release's 14 biome words plus *Tropical monsoon forest*. |
| Provinces | `prov.mjs` | People per km² by ground, then scaled so every region holds the people the lore gives it. Seeds by Poisson disc spaced by people: small in the Twin Rivers, huge in taiga and desert. Grown by a flood fill that follows the slope. The Known World's edge provinces grow across the seams first. |
| Adjacency | `prov.mjs` | Shared edges, straits under 50 km, sea lanes until everything is reachable. |
| Ground words, names | `gen.mjs` | The release's eight words from height, roughness and biome, overruled by the lore's ground words for the region. Province names from sound palettes per land; capitals keep the lore's names and place ids (`PLC-9001` on). |
| Realms | `realms.mjs`, `lore.mjs` | The lore's 118 realms (`POL-36` to `POL-153`): name, short name, title, type, race, culture, faith, capital, area (grown from the capital over the province graph to it), standing army and levy, map colour, house, ruler's name, sex and birth year, intro, want and fear (into the primer), and the lore's 317 ties as relations (tribute as a debt). Succession and law are read from the realm's type and ruler. `peoples-and-faiths.json` gives the 110 cultures with their name lists and the 55 faiths in full, and its `game_tables` give `GD.NAMING` and `GD.LANG`. |
| Data | `gen.mjs` | The far grid as the release's run-length pairs over the whole frame (the Known World's cells left as water and copied in at load), its origin (`x0`, `y0`, `ox`, `oy`), provinces in columns, realms, houses, relations, cultures, naming rules, languages, faiths, the seams. |

**What it makes** (from the lore):

| | |
| --- | --- |
| Frame | 17,600 × 9,250 km (grid 1,760 × 925), x 0 to 17,600, y -2,640 to 6,610 |
| New land | 54.2 M km² (the lore says 42.7 M; the region boxes of the Black Pines, the Rime Coast and the Southern Peninsulas hold about twice their stated areas, and the regions boxed in on every side keep their boxes rather than open seas the lore does not name, so the Black Pines come out at 17.3 M against 9.4 M. Every other land is within 25% of the lore) |
| Provinces | 1,727 new (2,033 in all). Median 17,800 km², tenth percentile 7,600, ninetieth 66,100 |
| People | 293 M (the lore: 279 M; each region holds its lore people, the rest is the overfilled taiga's) |
| Realms | 118 from the lore, all placed at their capitals: 1 to 107 provinces, median 8; 331 provinces unclaimed (stateless land, the lore's own and the overfilled north) |
| Peoples | 110 cultures, 55 faiths, 266 houses, 317 relations |
| The ten lands | the Black Pines 17.3 M km², the Long Grass 6.9 M, the Twin Rivers 6.3 M, the Deep Southland 5.6 M, the High Steppes 5.3 M, the Southern Peninsulas 5.2 M, the Sand Basins 2.6 M, the Thousand Isles 2.4 M, the Rime Coast 1.9 M, the Sunrise Isles 0.6 M |
| Graph | 29 straits, 48 sea lanes; every province reachable |
| Page | `b-data.core.js` is 949 KB of text |

### In the game (`c-lands.core.js`)

**Opt-in.** The creation screen has a new field, *Lands*: "The Known World" (the default) or "The Great Continent". Code asks with `A.newGame({ ..., lands: 'great' })`. Every game started by code, every test, bench and bot league, keeps the world as written. Whether menu games default to the Great Continent is a later decision.

**How the far lands are added.** They are data the release already reads, put where it reads them for as long as a Great Continent game is open (`FL.install`) and taken out for any other game (`FL.uninstall`): `LORE.map` (the map as written plus the far provinces, ids from 306; the seam provinces given their new neighbours and the land they gained), `LORE.realms`, `LORE.houses`, `LORE.relations`, `LORE.cultures`, `LORE.faiths`, `LORE.titlesByRealm`, `GD.REALM_CULTURE`, `GD.REALM_FAITH`, `GD.REALM_HUMAN_CULTURE`, `GD.NAMING`, `GD.LANG`, `GD.DOCTRINE` (each land's armies drilled like a Known World realm on the same ground), `GD.GIANT_HALLS`, `A.GOV`, `A.AGGRO`; and `GD.RACE_CULTURE` gives a far orc, dwarf or giant realm its own people. `A.initWorld` then builds the far realms as it builds the others: treasuries, armies, relations, a ruler of the realm's culture and a royal family. 43 and 70 vary and split them like the rest. The far realms are birthplaces on the creation screen.

**Namespace.** The feature's object is `A.FAR` (`A.FL` belongs to 48-fight-ladder); its data is `A.FL_DATA`.

**State.** A Great Continent game carries `S.world = { v: 1, parts: ['ardan', 'far@1'] }`, and each far province its `region`. New fields only; a Known World game's state is exactly as before.

**Saves.** A save without `S.world` (every old save) loads as the world as written. A save of the Great Continent loads the far lands back, whatever was open before. A save that names lands this build does not have is refused: "That save could not be opened: it was made with lands this version of the game does not have (far@9)." Every new save's header says its world (`meta.world`: `ardan` or `ardan+far@1`). Far houses are stored whole (not diffed against `LORE.houses`), so a save unpacks the same whichever lands are installed. Data versions are frozen once shipped: a changed generator must write `far@2` beside `far@1`, not over it.

**Beasts.** No beast of the Known World's bestiary is near a far province unless its canon range runs on into that land (`FL.BEAST_LANDS`: the woolly rhino and cave hyena on the Long Grass, the tiger of Ranpur in the Southern Peninsulas, the snow ape on the High Steppes, the crocodile, river horse and the Deep Green's beasts in the Deep Southland...). The far lands' own bestiary is stage 3.

**The relief.** With the inked map off, the far lands get a relief drawn from their terrain (the release's picture covers only the Known World).

### The lore files

`gen/lore.mjs` reads `canon/lore/far-lands.json` (`polities`, `regions`, `straits`, `lakes`, `ranges`, `rivers`, `relations`, `frame`, `lands`) and, beside it, `peoples-and-faiths.json` (`cultures`, `faiths`, `game_tables`). Both are hashed into the data (`loreHash`), so `--check` fails when either changes until the generator is run again. Re-run after any lore change; the report line `lore: N realms read, M placed` names any realm it skipped.

## Measured by (`test.mjs`)

| Test | Result |
| --- | --- |
| `flFrameIdentical` | See stage 1: 3 lives × 5 years and 22 view hashes identical with and without the feature (with the frame origin in). |
| `flContinentLoads` | A Great Continent game: 1,727 far provinces (2,033 in all) each with a lore region, 153 realms (118 from the lore), new game about 0.9 s; adjacency symmetric, all 2,033 provinces reachable; every far realm holds its capital, is in one piece and has a ruler; no duplicate or markup names; ten years played with no page error, 116 of 118 far realms standing. |
| `flSaveRoundTrip` | A Great Continent save (about 900 KB gzipped) loads back to the same state and stream after a Known World game in the same page; that Known World game had the far lands out (frame 7,000 × 4,500, 306 provinces) and its save says `ardan`. |
| `flOldSave` | A save made by the build without this feature loads, after a Great Continent game, as the world as written, and plays on. A save naming `far@9` is refused with a plain message. |
| `flMapDraws` | 18 views (world tab, title strip, full map fitted and at zoom 1, 3 and 8, war room at 1.5, 4 and 9, inked and release style, every map mode) draw the far lands at their sites, including those north of y 0, and a click on a site finds its province. Drawing changes neither the state nor the random stream. |

## Cost (`bench.mjs`)

`node features/99-far-lands/bench.mjs <built.html> --lands=known,great --months=25 --scale=on,off`: a peasant of Aldmark, 25 months of 30 days, events auto-chosen; a month holding the New Year counted apart. On the shared machine, 26 October:

| | provinces | realms | new game | month median (p90) | year-turn month | state at start → 2 years |
| --- | --- | --- | --- | --- | --- | --- |
| Known World, 09-scale on | 306 | 35 | 0.6 s | 68 ms (271) | 368, 231 ms | 1.5 → 2.0 MB |
| Great Continent, 09-scale on | 2,033 | 153 | 1.3 s | 560 ms (869) | 2,801, 1,186 ms | 3.5 → 5.3 MB |
| Known World, 09-scale off | 306 | 35 | 0.5 s | 77 ms (249) | 510, 558 ms | 1.5 → 2.0 MB |
| Great Continent, 09-scale off | 2,033 | 153 | 1.4 s | 722 ms (1,226) | 4,115, 4,512 ms | 3.5 → 5.3 MB |

The page grows by 261 KB (4,573 KB → 4,834 KB built). Twenty-year soaks from a home in the Twin Rivers, the Long Grass and the Black Pines: no page error, 116 of 118 far realms standing, a year in about 5 s.

## Limits and what is left

- **Land area.** 54 M km² against the lore's 42.7 M (see the table): the generator keeps the lore's boxes, centres, capitals, straits and rivers and lets the boxed-in north overfill rather than open seas the lore does not have. If the lore lane tightens the Black Pines' and Rime Coast's boxes, re-running the generator follows.
- **Realm areas** are grown from each capital to the lore's stated area, then every region the lore calls wholly held is filled by its neighbours; the lore's per-region holdings (`holds_km2`) are not yet used as quotas, so a realm's share of a region can differ from the lore's.
- **Speed.** A Great Continent month costs about 8 times the Known World's, its year turn 5 to 8 times (see Cost). 09-scale cuts the year turn by about two thirds and the month by a fifth; a coarse tick for the lands the player is not on (the plan's LOD) is not built and is the next step.
- **66-markets** keys its road memo `a * 4096 + b` by province id: fine for the 2,033 provinces here, a collision past 4,096 (not this feature's folder).
- **Province names** outside the capitals come from per-land sound palettes, not yet from each culture's own `names.places` list.
- **Stage 3 content**: the far lands have no events, styles, troops or doctrines, beasts, realm bibles (47) or voices (54) of their own; the lore has them (`military_templates`, army compositions in troop codes, `peoples-and-faiths.json`'s customs and food) for the lanes that build them. Doctrines are borrowed from a Known World realm that fights on the same ground.
- The release-style map (inked map off) draws the far lands as flat ground colours; the inked map draws them like the Known World. The full map's widest view shows the whole height and about 80% of the width; the world tab shows the whole frame.
