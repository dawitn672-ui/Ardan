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
  - The title has no map strip. 86-title-fold took it out for the Great Continent; without the Far Lands the release's strip came back and pushed "Begin a new life" below the fold.
- **Beasts** (76-beast-habitats) keep their canon regions, matched by province name, which the map keeps. On a v2 map the region alone decides, because the region's terrain is now the new land's: otherwise six beasts would be met nowhere.
- **Faster generator** (`src/v2/map`), with the same output to the bit (hashes compared over 3 seeds at two sizes):
  - the noise's corner gradients are inlined;
  - the erosion's gradient is computed without an object per step;
  - the priority heap runs on typed arrays.

## Measured

- **Building a world takes about 1.3 to 1.9 s in Chromium on a quiet machine, and 3.7 to 4.9 s under the lanes' shared load.** Erosion runs at 0.5 droplets a cell, a third faster than v2's default 0.9, and looks the same at this grid. Generation is about 80% of that; placing the realms and provinces and deriving the fields take 150 to 300 ms. The whole-continent picture adds 0.3 to 0.4 s on the first draw, and a close tile takes 40 to 65 ms. Worlds are cached by seed (the last 3). The target was about 1.5 s; reaching it would mean a coarser generator grid, fewer erosion droplets, or a Web Worker.
- The title screen's world (seed 7, from the release's `UI.renderTitle`) is built at boot, so every page load costs one world build.
- **`test.mjs`:**
  - `v2mapOneContinent`: 3 seeds. Each checks that every province is reachable by land, the land is in one piece, no land touches the frame, the cell counts match the grid, adjacency is symmetric, every site lies inside its province, every realm keeps its province count, and there is no `A.FAR` and no sea link.
  - `v2mapSameSeed`: the same seed rebuilt from nothing gives the same grid and fields, another seed gives another map, and the state and stream are untouched. It also reports the build time.
  - `v2mapSaveLoad`: the round trip is exact, and after another world and an emptied cache, a load brings the save's grid back.
  - `v2mapRenders`: at 420 px and 1366 px, it draws the title, the world tab, the full map at zoom 1, 3 and 9 (tiles) and the war room. It checks that there are no page errors, that the sea is blue, and that drawing is pure.
  - `v2mapNoFarLands`: the creation screen offers no lands choice.

## Playtest 1 fixes (`d-labels.core.js`; map version 2)

- **Names are readable at a phone's width** (#21). Sizes are set in on-screen pixels, scaled by the canvas's display ratio: a realm's name is at least 11 px, a province's at least 10 px. Names are placed by importance (your realm, then the selected one, then the most peopled), and one that would touch a name already written waits for a closer zoom. Your realm and your capital are always written. The letters are light, on a dark halo.
- **Realms are tints over the satellite ground** (#4), not 62's browned parchment wash. Each realm is its own colour at about 28%, stronger in a band along its borders, and the borders are 62's vector lines. 9991's veil over unknown land is cloud (grey-blue), not vellum.
- **Sea realms sit on the shore.**
  - A realm named for islands (the Amber Isles) takes a peninsula: its seat goes to the shore cell most open to the sea near where the warp put it, and it pays for every cell away from the shore.
  - A realm named for a coast or a reef (the Spice Coast, Blackreef) takes the shore the same way.
  - These worlds are map version 2 (`A.S.v2map.v`). A version 1 save rebuilds its own map.
- **Tests:**
  - `v2mapLabels`: 420 and 1366 px; the world tab and the full map at zoom 1 and 3. It checks the minimum sizes, no overlaps, and that your realm and capital are written.
  - `v2mapSeaRealms`: 4 seeds. Each sea realm's capital is coastal, and at least two thirds of the isles' provinces are.

## CI run 88 and playtest 2 fixes

- **Faster drawing** (`c-draw.core.js`; CI's `inkTiming` had zoom 8 and the war room at 9 over twice the release, and `mapEaseCheap` a 136 ms first tween frame).
  - Where the close tiles cover the view, the whole-continent picture is no longer scaled up beneath them at high quality. It is drawn only as the stand-in for a late tile, at low quality. Tiles are drawn at medium quality: they are rendered within a factor of two of the screen's scale.
  - The far view is one cached picture per world, the base and its big rivers at 1.5 times the base's scale. A far frame is one copy, not a high-quality scaling plus the rivers' strokes.
  - Rivers are batched: the runs of one width (to a quarter pixel) go in one path and one stroke. A run wholly outside the view is left out.
  - On a loaded 4-core machine a full-map frame at zoom 1 went from about 35 ms to about 6 ms, and zoom 8 from about 54 ms to about 17 ms.
- **Hatching kept** (`d-labels.core.js`). These tints replace 62's wash, which carried 62's hatching: of two bordering realms closer than 0.08 in OKLab, the smaller is hatched. The tints call 62's `UI.INKMAP.hatch` again (`inkBriefMarks`).
- **Beasts on fitting ground** (`b-game.core.js`). 76's terrain waiver (a beast is met anywhere in its region only where none of the region's provinces fits its terrain words) is read from the live provinces on a v2 map: `A.BH.looseOf(id)`. Before, the region alone decided, which put S-07's marsh leech on its region's hills and forests (`bhInsideHabitat`).
- **The full map fills a phone** (playtest 2, #20). At 420 px the 1100 x 720 canvas stood 256 px high, the top third of the screen.
  - On a narrow, upright screen the canvas takes the height there is room for (up to 1.7 times its width; the release's 52vh cap is lifted for this map only).
  - The view takes the canvas's shape: `UI.wrClampView` is the full map's alone, so its aspect follows `#gmap`. The map opens on your home.
  - Desktop is unchanged.
- **The compass rose keeps its corner clear** (playtest 2, old #21). 61's rose covered the name under it (the Amber Isles). Its box is taken before any name is placed, so a name there waits for another view.
- **Tests:**
  - `v2mapPhoneFills`: at 420 x 860 the map is at least half the screen and ends on it; canvas, picture and view keep one shape after a zoom, a pan and a fit; home in view; pure. At 1366 px the canvas is 1100 x 720.
  - `v2mapRoseClear`: 6 worlds at 420 and 1366 px. No name sits under the rose, names do sit there with the rose hidden, and drawing is pure.
