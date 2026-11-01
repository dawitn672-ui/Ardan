# 99991-v2-map: one generated continent

**Aspect:** the owner's v2 complaints 3 ("remove the greater continent") and 4 ("the continent looks drawn and lands don't connect"); step 2 of `docs/v2/V2_SPEC.md` · **Kind:** system and renderer, 3 code files, 1 patch, no events.

## What changed

- **The Far Lands are out of the build.** 99-far-lands, 990-far-peoples, 991-far-war, 992-far-beasts, 993-far-life and 9995-trade-roads carry `.wip` (their code stays in git). The creation screen's Lands choice was 99's, so it is gone with it. Every realm in play is one of the release's 34 (plus Prince Andros's Tessaria, split off at the start): 35 realms, 306 provinces, all on one landmass.
- **The map is generated** (`a-world.core.js`, `A.V2MAP.build`). From the game's seed (salted: `A.V2MAP.seedOf`, never `A.rand`), v2's `generateContinent` makes a continent on a 467 x 300 grid (15 km cells over the release's 7,000 x 4,500 km frame), with `landFraction` 0.38, no islands and the sea all round. It is sampled onto the game's 700 x 450 grid of 10 km cells and cut to its one 4-connected landmass.
- **The realms keep who they are; the land sets their borders.**
  - Each realm's capital (and each of the 25 unclaimed wilds) is carried to the new land by a warp that keeps the share of land to its west and, within a band of columns, to its north. So the realms that bordered tend to border (about 25 to 30 of the release's 39 realm borders survive on a given seed).
  - Seats are spaced by the size each realm will need. The biggest realms are placed first.
  - Every realm grows from its seat over the cheapest ground (slope, big rivers and height cost more). The least-filled realm goes first, until each holds the share of the land it held in the release, measured in cells. What a walled-in realm cannot take is shared out among its neighbours, the least overfilled first.
  - Each realm's land is then split among its provinces the same way. Each province is seeded where it lay within the realm, its old footprint fitted to the new one, and grows to its old share.
- **Every derived field is rebuilt** on the state's provinces (patch `V2MAP-PROV`, at the moment `A.initWorld` makes them, before the realms, Tessaria's split, the varied worlds or 09's index read them):
  - `x`, `y`: the centroid, snapped into the province;
  - `sx`, `sy`: the seed, used as the town site;
  - `adj`: shared cell edges;
  - `sea`: always empty, because there are no islands;
  - `coast`: the province touches the open sea;
  - `elev`: the mean height in metres;
  - `cells`: the province's cells on the grid;
  - `biome`: v2's biomes in the release's 14 words;
  - `terr`: mountains and hills go by quota to the highest, roughest provinces (6.5% and 41%, the release's mix), and the rest follow their biome.

  `MAP.grid`, `MAP.gw` and `MAP.gh` follow the loaded world, and the caches are flushed (`MAP.overlayCache`, `MAP.frontCache`, 62's tiles and traced lines).
- **Saves** carry only `A.S.v2map = { seed, v }`, because the provinces carry their own geometry. `MAP.init` is wrapped: the first draw after a load rebuilds the grid from the seed. A state without `v2map` keeps the map as written: a save from before this feature, or 09's clone harness, whose province list is not the release's.
- **The look** (`c-draw.core.js`). `MAP.ground` draws v2's satellite renderer under every map: the world tab, the title, the full map, the war room and the story column. It takes the place of 62's inked vellum and of the release's relief JPEG.
  - The whole continent is rendered once per world, 934 px wide.
  - Closer views use 256 px tiles rendered with `opts.region` at higher `scale`, where v2 adds its fine height detail. They are cached (140), drawn within a 24 ms frame budget, and the whole-continent picture stands in for a late tile until the next frame.
  - Rivers are canvas vectors, from `riverPaths`, in km, wider with flow; the small ones appear as you zoom in.
  - Borders, towns, keeps, names and the realms' wash stay 62's: smooth vector lines traced from the new grid.
  - `UI.set.v2Sat = false` brings 62's ground back.
- **Faster generator** (`src/v2/map`), with the same output to the bit (hashes compared over 3 seeds at two sizes):
  - the noise's corner gradients are inlined;
  - the erosion's gradient is computed without an object per step;
  - the priority heap runs on typed arrays.

## Measured

- **Building a world takes 1.3 to 1.9 s in Chromium on the shared 4-core machine.** Generation is about 80% of that; placing the realms and provinces and deriving the fields take 150 to 300 ms. The whole-continent picture adds 0.3 to 0.4 s on the first draw, and a close tile takes 40 to 65 ms. Worlds are cached by seed (the last 3). The target was about 1.5 s; reaching it would mean a coarser generator grid, fewer erosion droplets, or a Web Worker.
- The title screen's world (seed 7, from the release's `UI.renderTitle`) is built at boot, so every page load costs one world build.
- **`test.mjs`:**
  - `v2mapOneContinent`: 3 seeds. Each checks that every province is reachable by land, the land is in one piece, no land touches the frame, the cell counts match the grid, adjacency is symmetric, every site lies inside its province, every realm keeps its province count, and there is no `A.FAR` and no sea link.
  - `v2mapSameSeed`: the same seed rebuilt from nothing gives the same grid and fields, another seed gives another map, and the state and stream are untouched. It also reports the build time.
  - `v2mapSaveLoad`: the round trip is exact, and after another world and an emptied cache, a load brings the save's grid back.
  - `v2mapRenders`: at 420 px and 1366 px, it draws the title, the world tab, the full map at zoom 1, 3 and 9 (tiles) and the war room. It checks that there are no page errors, that the sea is blue, and that drawing is pure.
  - `v2mapNoFarLands`: the creation screen offers no lands choice.
