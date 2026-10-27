# The far lands: a size-agnostic map, and the Great Continent

**Aspect:** World (the owner's ask: a continent "significantly bigger, at least the size of Asia", with many more countries and kingdoms; Oct 27: "it should become the default world") · **Kind:** system, 10 patches, 4 code files, a generator and its checked-in data (far@2), no events. Stages 1 and 2 of `docs/plan/world-expansion-architecture.md`; the brief for the lands is `docs/research/world-foundations.md`.

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

**What it makes** (far@2, from the lore; far@1's figures in brackets):

| | |
| --- | --- |
| Frame | 17,600 × 9,250 km (grid 1,760 × 925), x 0 to 17,600, y -2,640 to 6,610 (unchanged) |
| New land | 42.9 M km² in the ten lands against the lore's 42.7 M [54.2 M], and 2.4 M km² of high waste apart (below) |
| The ten lands (game / lore, M km²) | the Black Pines 8.61 / 9.36 [17.33], the Rime Coast 2.23 / 2.10 [1.92], the Long Grass 7.04 / 6.26 [6.93], the Twin Rivers 5.34 / 5.26 [6.32] (+0.92 waste), the Deep Southland 6.47 / 6.53 [5.58], the High Steppes 3.76 / 3.50 [5.28] (+1.48 waste), the Southern Peninsulas 3.53 / 3.72 [5.17], the Sand Basins 2.95 / 2.89, the Thousand Isles 2.42 / 2.50, the Sunrise Isles 0.58 / 0.59; every land within 13% of the lore |
| Regions | each of the 90 regions against the lore's area: off by 13.8% in all; the largest misses the Elder Grass (1.34 M against 0.76 M: the Known World's steppe carried across the seam) and the Southern Gold Plains (1.14 against 1.45) |
| Provinces | 1,686 new (1,992 in all) [1,727, 2,033] |
| Realm quotas | each lore realm's holdings, region by region, against the lore's `holds_km2`: off by 23.3% of the 35.0 M km² the lore assigns (8.2 M), 126 of 191 realm-regions within a quarter [off by 70.5%] |
| Names | every far province from its people's own `names.places` (peoples-and-faiths.json): 780 are a name of the list, the rest made from it (below); no name twice in the world, none with markup [43 from the lists] |
| Routes | 58 strands of 29 routes (the lore's 28 with points, and canon TR-09 west of Kraoth) over 467 provinces; 16 sea lanes added for the sea roads |
| Atlas | 92 regions (the lore's 90 and the two wastes), 23 ranges, 28 rivers, 13 lakes, 10 seas, 5 straits, 13 passes, for the map's names |
| Realms, peoples | 118 realms, 110 cultures, 55 faiths, 264 houses, 317 relations (9 of them with Known World realms) |
| Page | `b-data.core.js` is 954 KB of text; the feature adds 255 KB to the built page (4,870 → 5,125 KB on Oct 27) |

### far@2: the recalibration (Oct 27)

`gen.mjs` writes `far@2`; `far@1` is frozen (its saves open, below). The Known World's coordinates and ids are not touched; `--check` is deterministic.

- **Tightening** (`shape.mjs`, `tighten`, set by `loreplan.mjs`'s `tight`). After the first cut, a land that still holds more than its regions' areas together is cut again by land, not by region: the sea comes in from the open sea, least worth first, with no depth limit, and takes cells of that land while it holds too much. A region already at its area is crossed only at a cost (`pass`), so the sea goes round it where it can, and a cell is taken only if its land neighbours make one run round it (`simple`), so the sea never cuts the land in two: no channel, no new island. The ground round each capital (90 km), each strait's shores, the coast within 250 km of the Known World and the pines within 260 km of the Rime Coast (`keepBy`, and `keepPairs` in the first cut) are never taken, so the White Shore stays the pines' Arctic shore. A cell's worth rises toward its region's middle and with a shared noise, so the land stays round the lore's centres and the coast is ragged. Applied to the Black Pines and the Southern Peninsulas.
- **The high waste** (`wastes`). The High Steppes and the Twin Rivers are boxed in on every side: the sea could only cut them by opening seas inside the continent. Their excess becomes high waste along their own ranges instead (the Cloudwall, the Jade Wall, the Ice Shoulders and the Gorge Ranges; the Red Rim, the Five Ridges and the Sokdal Spine): the cells of an over-full region nearest a range line (moved by the noise, so the band is ragged) go to the land's waste region, `H-00` "The High Wastes" and `R-00` "The Rim Wastes": unheld mountains with almost no people, counted apart from the land's lore area. The Cloudwall and the Jade Wall are regions of their own and keep their land; the ground round a capital and the seam with the Known World are left.
- **Growth** (`grow`). The Deep Southland's lore boxes hold less ground than its area: it grows into the sea round its boxes (nearest first, at most 350 km out, never within 150 km of the Known World's box or 60 km of another land), each new cell its shortest neighbouring region's, to 1.14 times its area (the coast's noise, the lakes and the seam take some back).
- **Balance** (`balance`). Last, every region short of its area takes the cells it bids least for from a neighbour that holds more than its own, first within its land, then across a land's bound.
- **Quotas** (`realms.mjs`). A lore realm grows from its capital and from the province of each other region it holds (on that region's border with its others, nearest the capital), and takes a province of a region only while it holds less there than the lore's `holds_km2` less half the province. Pieces are bridged over unheld land (two provinces at most) or joined by a sea lane to the body's coast (within 2,500 km: the Walrus Strand reaches its White Shore so), or given up. Then, in four passes, a province moves to a neighbour (or, where the lore leaves a region partly unheld, is let go) whenever that brings the giver's and taker's holdings nearer the lore's together, and short realms take unheld land on their borders. The largest misses are geographic: the Ice Shoulders' realm (POL-89) shares its region with the Cold Gate's dwarves, the Lake Steppe (F-06) is small and closed in by the khaganate's wings, the Southern Gold Plains came out small, and the Eight Antlers' share of the Middle Pines lies beyond another realm.
- **Names** (`places.mjs`). A culture's list has about a dozen names, themselves roots and endings (Khas + ghal, Rinn + giri). More are made the same way: a root of the list with an ending of the list, the joint read as one word (no doubled letter, no three consonants together). The largest provinces take the list's own names first; a province takes from its realm's peoples, then from the other peoples of its land; an unheld one from the nearest held one's. "Upper", "Lower" and the other sides of the country come only when all of those have run out (none did). Capitals keep the lore's names.
- **Routes and atlas** (`routes.mjs`). Each strand's points are joined by the cheapest way over the provinces (a sea step costs more on a land road); a sea road joins two coastal provinces with a sea lane where they have none. The canon Silk Road of the east (TR-09) is drawn from Kraoth to Drevna and Velgrad from the Known World's own capitals. `D.routes` keeps each strand's provinces and its points; `D.atlas` the names the map writes. Seas have no places in the lore: each is written where its water is deepest near the shores it names.

### In the game (`c-lands.core.js`)

**The default world.** A game from the menu is on the Great Continent: the creation screen's *Lands* field opens on "The Great Continent", and Randomize and Random life (the title's quick start) use it. "The Known World only" is the other card (the smaller classic map). Both are option cards with their realms, provinces and width. `A.newGame()` called by code with no `lands` keeps the Known World, so every test, bench and bot league that starts its games by code does not move; `A.newGame({ ..., lands: 'great' })` asks for the continent. `A.FAR.MENU_LANDS` (`'great'`) is the menu's default; a harness that drives the menu (bench/run.mjs's accessibility scan does) and wants the Known World sets it to `'known'`.

**Realm colours.** A far realm's colour in `LORE.realms` (and so in the state, the map wash, banners and every release site that reads `r.color`) is 91-look's `UI.realmHex(id)`, the accent it is shown in elsewhere: set at `FL.install` on a copy of the realm record, so the generated data and the Known World's colours do not change.

**The unfree and the law.** `FL.install` adds the far realms whose lore has unfree people to `GD.UNFREE` (removed again at `FL.uninstall`), so a life can be born a slave or a serf there:
- slaves where they are taken, sold or bought: Silo, the Tide Families, Lamhou, the South Chain, Suraeng, Lingkaro, Rakhol, Kethra, Navesht, Marast, Mosandi, the Coral Coast and Pravith's temples;
- serfs where debt bondage holds the farmers south of the Cloudwall: Vahra, Juvai, Ayamo, Thinsak, Lioka, Panduro, Dvaarnath.

It adds each far realm to a law family in `A.LAW` too (`FL.lawOf`):
- orc clans keep the clan-mothers' law, dwarf holds the Law-Carvers', Silo the crews' vote;
- the realms of debt bondage (the Southern Peninsulas, the Thousand Isles), the Birch March and the Black Pines' kingdoms take the east's, where a debtor is bound to his creditor's land;
- the rest keep the release's "other".

Before, every far realm fell to "other", where debt and murder both mean the cells. With far@1's habit of taxing every realm of the Long Grass as herders (the Birch March, a farming kingdom, had 59,000 suns a year), that sent far lives to prison far more often than Known World ones: L1's league counted 31% of far lives as outlaws against 10%, and a Birch March royal went to debtors' prison up to six times a life. A settled realm of the Long Grass is now taxed as farmers (the Birch March: 168,000).

**The birthplace list.** On the Great Continent the realm of birth lists 152 realms in `<optgroup>`s by land, west to east (the Known World, then the ten Far Lands), each sorted by name; the select's own type-ahead finds a realm (patch `FL-REALMS`). With the Known World only it is the release's list.

**One world.** The lore's routes are roads the economy reads: 66-markets' carters find their way over the province graph and a step along a great route costs `FL.ROAD_F` (0.55) of an ordinary one (`A.MT.roadF`, read by a one-line hook in 66's graph); 45-economy's caravans price a road by the distance between capitals, and two realms on the same route pay the route's rate (a wrapper on `A.ECON.roads`). The Silk Road (TR-17) runs into the Known World at the Tusk Clans' oases and Grakmar and on as TR-09 to Drevna and Velgrad. The lore's nine ties to Known World realms are relations (the Old Mare and the Tusk Clans' friendship, the escorts' trade pacts to Kraoth, Fjorund and Jotunhall, the Cold Gate and Stonehold...). A Known World game has no routes (the factor is 1).

**How the far lands are added.** They are data the release already reads, put where it reads them for as long as a Great Continent game is open (`FL.install`) and taken out for any other game (`FL.uninstall`): `LORE.map` (the map as written plus the far provinces, ids from 306; the seam provinces given their new neighbours and the land they gained), `LORE.realms`, `LORE.houses`, `LORE.relations`, `LORE.cultures`, `LORE.faiths`, `LORE.titlesByRealm`, `GD.REALM_CULTURE`, `GD.REALM_FAITH`, `GD.REALM_HUMAN_CULTURE`, `GD.NAMING`, `GD.LANG`, `GD.DOCTRINE` (each land's armies drilled like a Known World realm on the same ground), `GD.GIANT_HALLS`, `A.GOV`, `A.AGGRO`; and `GD.RACE_CULTURE` gives a far orc, dwarf or giant realm its own people. `A.initWorld` then builds the far realms as it builds the others: treasuries, armies, relations, a ruler of the realm's culture and a royal family. 43 and 70 vary and split them like the rest. The far realms are birthplaces on the creation screen.

**Namespace.** The feature's object is `A.FAR` (`A.FL` belongs to 48-fight-ladder); its data is `A.FL_DATA`.

**State.** A Great Continent game carries `S.world = { v: 1, parts: ['ardan', 'far@2'] }`, and each far province its `region`. New fields only; a Known World game's state is exactly as before.

**Saves.** A save without `S.world` (every old save) loads as the world as written. A save of the Great Continent loads the far lands back, whatever was open before. A save that names lands this build does not have is refused: "That save could not be opened: it was made with lands this version of the game does not have (far@9)." Every new save's header says its world (`meta.world`: `ardan` or `ardan+far@2`). Far houses are stored whole (not diffed against `LORE.houses`), so a save unpacks the same whichever lands are installed. Data versions are frozen once shipped.

**A far@1 save** (Oct 26) opens without far@1's data in the page (it would cost another 950 KB). The save holds every far province whole (`A.initWorld` copies all of `LORE.map`'s fields into `S.prov`), so `FL.legacyPart` rebuilds the part from it: `LORE.map` is the map as written plus those provinces, and the grid gives each old province the land round its site, grown over far@2's land and a disc of the province's own size, so a click on a site finds its province and the coasts are far@2's where both have land. The state is not touched and its saves still say `ardan+far@1`; it has no routes. A later data version adds its key to `FL.LEGACY` the same way.

**Beasts.** No beast of the Known World's bestiary is near a far province unless its canon range runs on into that land (`FL.BEAST_LANDS`: the woolly rhino and cave hyena on the Long Grass, the tiger of Ranpur in the Southern Peninsulas, the snow ape on the High Steppes, the crocodile, river horse and the Deep Green's beasts in the Deep Southland...). The far lands' own bestiary is stage 3.

**The relief.** With the inked map off, the far lands get a shaded relief like the release's picture (which covers only the Known World): a height field from the provinces' heights, softened across their bounds and roughened by a seeded noise (more in hills and mountains), lit from the upper left over each ground's colour, with snow on the heights and a darker coast.

**The atlas on the inked map** (`d-atlas.core.js`, brief 7.3: a day print, ink line, Cinzel names). Over the inked borders and towns, under the realms' and towns' names: the ten lands' names from far off (zoom under 1.3), the seas (under 3.2), the regions at a middle zoom (1.1 to 4.2), the ranges along their lines (0.75 to 6), the rivers as wound blue lines (from 0.55, named from 1.8, stopped at their mouths), the lakes (from 1.5, small ones from 3), straits (1.8) and passes with the old maps' bracket mark (2.2), and the great routes as dotted roads (from 0.55; sea roads in long dashes), named from 2.6. A name that would cross one already written waits for another zoom; lands, seas and regions are written first. The bands are `A.FAR.ATLAS_ZOOM`.

### The lore files

`gen/lore.mjs` reads `canon/lore/far-lands.json` (`polities`, `regions`, `straits`, `lakes`, `ranges`, `rivers`, `relations`, `frame`, `lands`) and, beside it, `peoples-and-faiths.json` (`cultures`, `faiths`, `game_tables`). Both are hashed into the data (`loreHash`), so `--check` fails when either changes until the generator is run again. Re-run after any lore change; the report line `lore: N realms read, M placed` names any realm it skipped.

## Measured by (`test.mjs`)

| Test | Result |
| --- | --- |
| `flFrameIdentical` | See stage 1: 3 lives × 5 years and 22 view hashes identical with and without the feature (with the frame origin in). |
| `flContinentLoads` | A Great Continent game: 1,686 far provinces (1,992 in all) each with a region, 153 realms (118 from the lore), new game about 0.7 s; adjacency symmetric, all 1,992 provinces reachable; every far realm holds its capital, is in one piece and has a ruler; no duplicate or markup names; ten years played with no page error, 116 of 118 far realms standing. |
| `flSaveRoundTrip` | A Great Continent save (about 900 KB gzipped) loads back to the same state and stream after a Known World game in the same page; that Known World game had the far lands out (frame 7,000 × 4,500, 306 provinces) and its save says `ardan`. |
| `flOldSave` | A save made by the build without this feature loads, after a Great Continent game, as the world as written, and plays on. A save naming `far@9` is refused with a plain message. |
| `flMapDraws` | 18 views (world tab, title strip, full map fitted and at zoom 1, 3 and 8, war room at 1.5, 4 and 9, inked and release style, every map mode) draw the far lands at their sites, including those north of y 0, and a click on a site finds its province. Drawing changes neither the state nor the random stream. |
| `flMenuDefault` | `A.newGame` by code is the Known World; New life opens on the Great Continent (152 realms, the field's two cards, the birthplaces in 11 groups by land); Randomize keeps the lands shown; the Known World only gives 34 realms, no groups and a life of 306 provinces; Random life is `ardan+far@2`. |
| `flAreasQuotas` | Each land's area (its high waste apart) against the lore's: every land within 15%, the Black Pines within 10%, the whole within 5%; the High Steppes have their waste; the realms' holdings against `holds_km2` off by under 30% (23.3%). |
| `flNames` | Every far province's name is a place of its peoples' lists or made from one (all but the lore's own capital names), none twice in the world, none with markup. |
| `flRoutes` | Every step of every route is a land border or a sea lane; the Silk Road runs into the Known World and on as TR-09; a route's step costs 0.55 for the carters, 732 realm pairs share a route for the caravans, and in three months caravans run along routes; the nine lore ties to Known World realms exist (opinions and trade pacts); a Known World game has no routes. |
| `flMapLabels` | The inked full map at zoom 0.45, 1.5, 3 and 8 writes the land, sea, region, range, river, pass and route names in their bands and draws the routes dotted; the cold draw and the median pan at zoom 1, 3 and 8 are reported (a pan under 250 ms); drawing is pure. |
| `flFar1Save` | A real far@1 save (the far@1 build is made from commit 1c17403's data) opens after a Known World game on part far@1 with its state as saved; clicks on its far sites find their provinces on both maps; it plays on and still saves as `ardan+far@1`. Without that commit in the checkout it checks the same path with a relabelled far@2 save. |

## Cost (`bench.mjs`)

`node features/99-far-lands/bench.mjs <built.html> --lands=known,great --months=25 --scale=on,off`: a peasant of Aldmark, 25 months of 30 days, events auto-chosen; a month holding the New Year counted apart. far@2, the default build (no work-in-progress lanes), on the shared machine, 27 October:

| | provinces | realms | new game | month median (p90) | year-turn month | state at start → 2 years |
| --- | --- | --- | --- | --- | --- | --- |
| Known World, 09-scale on | 306 | 35 | 0.3 s | 68 ms (120) | 279, 153 ms | 1.5 → 2.0 MB |
| Great Continent, 09-scale on | 1,992 | 153 | 0.9 s | 561 ms (854) | 1,229, 1,039 ms | 3.4 → 5.3 MB |
| Known World, 09-scale off | 306 | 35 | 0.2 s | 45 ms (93) | 337, 232 ms | 1.5 → 2.0 MB |
| Great Continent, 09-scale off | 1,992 | 153 | 0.8 s | 689 ms (919) | 3,280, 3,607 ms | 3.4 → 5.3 MB |

(far@1 on Oct 26: Great Continent with 09-scale on 1.3 s, 560 ms (869), 2,801 and 1,186 ms; off 1.4 s, 722 ms (1,226), 4,115 and 4,512 ms.)

The page grew by 261 KB with far@1 (4,573 KB → 4,834 KB built); with far@2 it grows by 255 KB (4,870 → 5,125 KB, Oct 27). Twenty-year soaks from a home in the Twin Rivers, the Long Grass and the Black Pines: no page error, 116 of 118 far realms standing, a year in about 5 s.

## Limits and what is left

- **Land area.** Every land is within 13% of the lore (the Long Grass +12%, the Black Pines -8%), the whole within 0.5%. The High Steppes and the Twin Rivers keep 2.4 M km² of high waste besides, which the lore's areas do not count; it is land on the map (unheld mountains), not sea.
- **Region areas** are off by 13.8%, and **realm quotas** by 23% (far@1: 70%). The quota misses follow the region misses and the realms' shapes: a realm stays in one piece (by land or a sea lane), so a share the lore puts beyond another realm cannot be reached.
- **The Arctic.** The White Shore is joined to the pines and the Rime Coast runs along the north; the pines' north holds a long gulf from the Ice Bight where the tightening took its excess.
- **far@1 saves** draw an approximate picture of their old map (its provinces' land grown round their sites over far@2's coasts) and have no great routes.
- **Speed.** A Great Continent month costs about 8 times the Known World's, its year turn 5 to 8 times (see Cost). 09-scale cuts the year turn by about two thirds and the month by a fifth; a coarse tick for the lands the player is not on (the plan's LOD) is not built and is the next step. The atlas adds 2 to 10 ms to a frame of the inked full map (`flMapLabels`).
- **66-markets** keys its road memo `a * 4096 + b` by province id: fine for the 1,992 provinces here, a collision past 4,096 (not this feature's folder).
- **Stage 3 content** (events, styles, troops, doctrines, beasts, realm bibles, voices for the far lands) is the far-* lanes' (990 to 993).
- The full map's widest view shows the whole height and about 80% of the width; the world tab shows the whole frame.
