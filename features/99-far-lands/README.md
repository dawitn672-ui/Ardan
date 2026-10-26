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

### The land

`gen/` is a deterministic Node generator (plain JS, no network, no packages). `node features/99-far-lands/gen/gen.mjs` writes `b-data.core.js`; `--check` fails if the checked-in file is not what it makes; `--preview=<dir>` writes pictures; `--lore=<file>` and `--out=<file>` are for trying a lore file. It reads the Known World from the vendored release and never writes it.

| Step | File | What |
| --- | --- | --- |
| The bones | `plan.mjs` | Coasts as curves of control points in km, 26 mountain ranges (crest height, half-width), 11 plateaus and basins, 6 lakes, chains of small islands, and anchors for the ten Far Lands of the research brief. |
| Land and sea | `geo.mjs` | The curves pushed about by domain-warped noise. At the two seams (x 7,000, y 300-2,900, where the Known World's Eastland runs off its map; y 4,500, x 490-5,530, where the Southland does) the coast is eased into the Known World's own, carried straight outward, so every coast that reached the old edge carries on across it. Islets under 5 cells sink; small enclosed water fills. The frame's edges are open sea. |
| Relief | `geo.mjs` | A continental rise from the coast, the ranges as belts of ridged crests along warped lines (passes where the crest noise dips), plateaus and basins with soft edges, and noise. |
| Climate | `geo.mjs` | Temperature from latitude (canon: 54.5° N at y 0 to 14° N at y 4,500, so the frame runs to about 25° S), height, distance from the open sea, and a cold northern sea. Rain carried by four winds, each a sweep with rain shadows: the westerlies (already dry at the seam), the eastern monsoon, the southern monsoon (stopped by the Great Wall), the arctic damp; plus the equatorial rains. |
| Rivers | `geo.mjs` | Priority flood (every drop reaches the sea or a lake), rain-weighted flow. Rivers are drawn as terrain: they make the land around them crowded, so their basins become many small plains provinces, and their mouths marsh. |
| Biomes | `geo.mjs` | The release's 14 biome words plus one new, *Tropical monsoon forest*. |
| Provinces | `prov.mjs` | People per km² from biome, rivers, coast, height and each land's crowding (two hearths, the Twin Rivers and the monsoon south, and thin lands between). Seeds by Poisson disc spaced by those people (averaged over 100 km): small in the river basins, huge in steppe, desert and taiga. Grown by a flood fill whose step costs more uphill and downhill, so bounds fall on ridges. Merged under 25 cells. The Known World's provinces on the seams grow across it first (no far seed within 220 km), so its realms' borders run on into the new land instead of along a ruler line. |
| Adjacency | `prov.mjs` | Shared cell edges; straits where land is within 50 km across water; sea lanes joining every piece the land and straits leave apart, nearest crossing first. |
| Regions | `prov.mjs` | Each province's Far Land (nearest anchor, with the high plateau and the cold north coast by their ground) and region of about 400,000 km² (rule G6): `F-03`, `R-11`, ... |
| Ground words and names | `gen.mjs`, `names.mjs` | The release's eight terrain words from height, roughness and biome. Names from a sound palette per Far Land (a stand-in until the lore's naming rules), never an English word, never repeated, never holding `<`, `>` or `"`. |
| Realms | `realms.mjs`, `lore.mjs` | From `canon/lore/far-lands.json` when it exists (its realms, placed at their capitals' km and grown to their stated area; its cultures and faiths). Otherwise placeholders: per land a count and the polity kinds of section 4.3 (khaganates and horse clans on the Long Grass, oasis city-states in the Sand Basins, temple states and clan lordships on the High Steppes, an empire and its rivals in the Twin Rivers, mandala kingdoms in the south, ports and a thalassocracy in the Thousand Isles...), capitals spread by people and distance, shares by a power law, grown over the province graph cheapest first (mountains, desert and the sea cost most), good land left between them taken by its neighbours, hard country left as refuges. Kinds follow size. Kin of the five peoples where canon points: an orc clan land of the far steppe, a dwarf hold under the Roof, a giant hall in the north. |
| Data | `gen.mjs` | The far grid as the release's own run-length pairs over the whole frame (the Known World's cells left as water and copied in at load), provinces in columns, realms, houses, relations, cultures, naming rules, languages, faiths, the seams. |

**What it makes** (placeholders, no lore yet):

| | |
| --- | --- |
| Frame | 17,000 × 8,900 km (grid 1,700 × 890), the Known World unmoved in its top-left 7,000 × 4,500 |
| New land | 42.6 M km² (the Known World is 22.9 M): 65.5 M km² in all, more than Asia (44.6 M) and close to the research's 64 M |
| Provinces | 1,735 new (2,041 in all). Median 17,400 km², tenth percentile 10,200, ninetieth 48,200, largest 156,500 (the Known World's median is about 75,000) |
| Ground | forest 45%, hills 25%, steppe 9%, mountains 8%, plains 8%, desert 2%, tundra 1% (desert and steppe provinces are few because they are huge) |
| People | 258 M (the research's target: about 250 M) |
| Realms | 115 (POL-36 to POL-150): 1 to 81 provinces, median 10; 133 provinces unclaimed |
| Peoples | 21 cultures (CUL-25 on), 12 faiths (REL-20 on), 303 houses (a royal house a realm, and its strongest lords) |
| The ten lands | the Black Pines 4.5 M km², the Rime Coast 1.9 M, the Long Grass 4.6 M, the Sand Basins 2.6 M, the High Steppes 4.7 M, the Twin Rivers 7.3 M, the Southern Peninsulas 5.5 M, the Thousand Isles 4.4 M, the Sunrise Isles 0.9 M, the Deep Southland 6.1 M; 108 regions |
| Graph | 36 straits, 17 sea lanes; every province reachable from every other |
| Page | `b-data.core.js` is 744 KB of text, +190 KB to the built page (4,448 KB → 4,633 KB with the code) |

### In the game (`c-lands.core.js`)

**Opt-in.** The creation screen has a new field, *Lands*: "The Known World" (the default) or "The Great Continent". Code asks with `A.newGame({ ..., lands: 'great' })`. Every game started by code, every test, bench and bot league, keeps the world as written. Whether menu games default to the Great Continent is a later decision.

**How the far lands are added.** They are data the release already reads, put where it reads them for as long as a Great Continent game is open (`FL.install`) and taken out for any other game (`FL.uninstall`): `LORE.map` (the map as written plus the far provinces, ids from 306; the seam provinces given their new neighbours and the land they gained), `LORE.realms`, `LORE.houses`, `LORE.relations`, `LORE.cultures`, `LORE.faiths`, `LORE.titlesByRealm`, `GD.REALM_CULTURE`, `GD.REALM_FAITH`, `GD.REALM_HUMAN_CULTURE`, `GD.NAMING`, `GD.LANG`, `GD.DOCTRINE` (each land's armies drilled like a Known World realm on the same ground), `GD.GIANT_HALLS`, `A.GOV`, `A.AGGRO`; and `GD.RACE_CULTURE` gives a far orc, dwarf or giant realm its own people. `A.initWorld` then builds the far realms as it builds the others: treasuries, armies, relations, a ruler of the realm's culture and a royal family. 43 and 70 vary and split them like the rest. The far realms are birthplaces on the creation screen.

**State.** A Great Continent game carries `S.world = { v: 1, parts: ['ardan', 'far@1'] }`, and each far province its `region`. New fields only; a Known World game's state is exactly as before.

**Saves.** A save without `S.world` (every old save) loads as the world as written. A save of the Great Continent loads the far lands back, whatever was open before. A save that names lands this build does not have is refused: "That save could not be opened: it was made with lands this version of the game does not have (far@9)." Every new save's header says its world (`meta.world`: `ardan` or `ardan+far@1`). Far houses are stored whole (not diffed against `LORE.houses`), so a save unpacks the same whichever lands are installed. Data versions are frozen once shipped: a changed generator must write `far@2` beside `far@1`, not over it.

**Beasts.** No beast of the Known World's bestiary is near a far province unless its canon range runs on into that land (`FL.BEAST_LANDS`: the woolly rhino and cave hyena on the Long Grass, the tiger of Ranpur in the Southern Peninsulas, the snow ape on the High Steppes, the crocodile, river horse and the Deep Green's beasts in the Deep Southland...). The far lands' own bestiary is stage 3.

**The relief.** With the inked map off, the far lands get a relief drawn from their terrain (the release's picture covers only the Known World).

### The lore file

When `canon/lore/far-lands.json` exists, `gen/lore.mjs` reads it and the generator uses its realms, cultures and faiths instead of placeholders (re-run the generator; its report says `lore: N realms read, M placed` and names any it skipped). The layout was not fixed when this was written, so each field is looked for under the likely names. Arrays or id-keyed objects both work:

- `realms`: `id` (`POL-36` on), `name`, `short`, `type`, `title`, `race`, `capital` (a name, or `{ name, x, y }`), or `x`, `y` (km, in the game's frame), `area` (km²; the realm is grown to it), `culture`, `faith`, `ruler` (a name, or `{ name }`: the generated ruler takes it), `color` (`#rrggbb`), `gov` (`hereditary`, `elective`, `council`, `theocracy`), `law` (`male`, `female`, `equal`), `land` (one of `T N F B H R M A I D`), `stability`. A realm with no position, or one inside the Known World's box, is skipped.
- `cultures`: `id` (`CUL-25` on), `name`, `race`, `land`, `note`, name lists `m`, `f`, `house`, `epi` (or under `names`), `naming` (`{ common, noble, note }` as in `GD.NAMING`), `lang`. Lists shorter than 8 are filled in the land's sounds.
- `faiths`: `id` (`REL-20` on), `name`, `kind`, `belief`, `afterlife`, `clergy`, `rituals`, `festivals`, `taboos`, `politics`.

Placeholder cultures, faiths and realms are numbered after the lore's highest ids. The data records the lore file's hash (`loreHash`).

## Measured by (`test.mjs`)

| Test | Result |
| --- | --- |
| `flFrameIdentical` | See stage 1: 3 lives × 5 years and 22 view hashes identical with and without the feature. |
| `flContinentLoads` | A Great Continent game: 1,735 far provinces (2,041 in all) each with a region, 150 realms (115 far), 808 people at the start; adjacency symmetric (0 asymmetric pairs), all 2,041 provinces reachable; every far realm holds its capital, is in one piece and has a ruler; no duplicate or markup names; ten years played with no page error. |
| `flSaveRoundTrip` | A Great Continent save (942 KB gzipped) loads back to the same state and stream after a Known World game in the same page; that Known World game had the far lands out (frame 7,000 × 4,500, 306 provinces, no far table entry) and its save says `ardan`; the loaded game plays on. |
| `flOldSave` | A save made by the build without this feature loads, after a Great Continent game, as the world as written (frame 7,000 × 4,500, 306 provinces, the state as saved) and plays on. A save naming `far@9` is refused with the message above. |
| `flMapDraws` | 18 views (the world tab, the title strip, the full map fitted and at zoom 1, 3 and 8, the war room at 1.5, 4 and 9, in the inked and the release style, plus every map mode) draw the far lands at their sites, and a click on a site finds its province. Drawing changes neither the state nor the random stream. |

## Limits and what is left

- **Speed.** See the report: a Great Continent month and year turn cost several times the Known World's. 09-scale (stage 0) is the fix; a coarse tick for the lands the player is not on (the plan's LOD) is not built.
- **66-markets** keys its road memo `a * 4096 + b` by province id: fine for the 2,041 provinces here, a collision past 4,096 (not this feature's folder).
- **Names and realms are placeholders** until `canon/lore/far-lands.json` exists; the generator then uses it (re-run it and check the report line `lore: N realms read, M placed`).
- **Stage 3 content** has no place yet: the far lands have no events of their own, no styles, no troops or doctrines of their own, no beasts of their own, no realm bibles (47) and no voices (54). They use everything that is not tied to a realm, culture or faith.
- The full map's widest view shows the whole height and 80% of the width (its clamp keeps the release's rule of no empty margin); the world tab shows the whole frame.
