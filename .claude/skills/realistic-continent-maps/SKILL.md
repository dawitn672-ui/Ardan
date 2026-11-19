---
name: "realistic-continent-maps"
description: "Generate and render a realistic, satellite-like procedural continent (one connected landmass, erosion, rivers, climate, borders, zoom detail) for a game or worldbuilding map, in plain JS with no dependencies."
---

# Realistic continents that don't look hand-drawn

This method is proven in Ardan v2 (`src/map/noise.js`, `continent.js`, `render.js`), with tests showing one connected landmass and clear water at the frame on every seed. A 640×440 map generates in about 2.7 s in Node and renders in about 0.5 s at 1.5× scale.

## Pipeline (in order)
1. **Plates.** Place about 11 random plate centres with drift vectors. Mark the 5 closest to the centre as continental, so they form one connected cluster. Use warped Voronoi (warp 0.55) to assign cells. Store boundary closeness as e^(−gap/(0.035W)) and convergence as the dot product of relative drift with the boundary normal.
2. **Base height.** Continental plates get +0.25 to +0.45 and oceanic −0.35 to −0.55. Box-blur with radius 0.05W for 3 passes, so the shelves slope.
3. **Falloff, superellipse not rectangle.** Warp the coordinates, take r = (|x|^2.6 + |y|^2.6)^(1/2.6), set e = 1 − smoothstep(0.70, 0.97, r), then h = h·(0.25 + 0.75e) − (1 − e)·0.6. A rectangular min(x, y) falloff gives boxy continents.
4. **Detail.** This is the step that makes coastlines look real. Domain-warp with an amount of **1.5** at frequency 0.8, then add 0.95·fbm(×0.7, 3 octaves) + 0.75·fbm(×1.6, 4 octaves) + 0.45·fbm(×4.5, 6 octaves).
   - Gradient-noise fBm has a small amplitude, so weights around 0.3 give smooth blobs. You need about 1 or more.
   - Add ridged noise on convergent boundaries: boundary × (0.2 + 0.85·convergence) × ridge.
   - Divergent boundaries sink by up to 0.55 × ridge, which gives gulfs and inland seas.
5. **Normalize, then erode.** Use droplet hydraulic erosion (Beyer 2015) with inertia 0.05, capacity 4, erode 0.3, deposit 0.3, evaporation 0.015, radius-2 brush, about 0.9 droplets per cell and at most 48 steps.
   - Speed must use `sqrt(v² − dh·g)`, because dh < 0 downhill. Copying Lague's `+dh` is a known bug.
6. **Sea level** goes at the (1 − land fraction) quantile, about 0.37. Then force a band of ocean about 2% wide along the frame edges.
7. **Guarantee one continent.** Flood-fill the land components with 4-connectivity. Keep the largest, keep up to 14 islets smaller than 0.12% of the area, and drown everything else to −0.07 (below the shelf, so it doesn't show as a turquoise smudge).
8. **Hypsometry.** Reshape land as h = 0.62 × (h/max)^1.7, which gives broad lowlands and peaky ranges.
9. **Climate.**
   - Temperature in °C = 30 − (latitude − 20) × 0.62 − elevation × 40 + noise.
   - Moisture comes from westerlies marching across each row. The ocean recharges it by +0.06 per cell. Land drops carry × (0.0011 + uplift × 0.05), where uplift = Δh × 40.
   - Add fBm noise, blur, and a weak coastal term (0.15 × e^(−d/25)). A strong coastal term draws concentric rings.
10. **Rivers.** Priority-flood fill (Planchon-Darboux style) for the D8 flow directions, then accumulate moisture along them. Trace each source down to the sea. Relax ×2 (a 5-point average), then Chaikin ×3. Draw them as vector lines with width tied to log(flow).
11. **Provinces.** Use Dijkstra from seeds, where the cost rises with slope (×400), big rivers (+6) and altitude. **Use a Float64Array for costs.** With Float32, the popped key is greater than the stored cost, every node is skipped, and only about 20% of the land is assigned. Find neighbours from adjacent cells.
12. **Realms.** Grow realms from spread-out capitals (minimum spacing 0.5·W/√count) with weighted round-robin credit, so sizes differ.

## Ground the game can read (Ardan D9, `src/map/engine/ground.js`)
A map a game plays on needs more than heights and rivers. From the finished continent and its provinces:
- **Cover per cell** (open, wood, marsh): the forest biomes broken by clearings (seeded noise), copses in dry grass, the fields
  round every town cleared, marsh in wetlands and on big lowland rivers.
- **Roads in two ranks.** A track between each two neighbouring towns: the cheapest 8-way path inside the two provinces (cost
  1 + slope/70 m, +0.5 wood, +1.8 marsh, +0.6 above 1,800 m, and a price for stepping into water), dropped when it costs more than
  3.4 times its straight length. High roads are the tracks on the cheapest ways from each capital to its cities and to the
  neighbouring capitals.
- **A crossing at every water a road crosses inside its course** (a ford; a bridge on a big river, at a town or on a high road);
  **passes** at a road's highest point when it is high and well above both ends.
- **Towns on water:** move each town to its province's nearest river, stream, lake or sea cell, not its seed (70%+ is easy this
  way, and it keeps the provinces' shapes). Extract rivers from a stream's flow (here 40) so towns and tributaries have water.
- **Terrain words from the ground,** not by quota: hills by relief (a high flat plateau is open land), settled wooded lowland
  as cleared fields, and a cap per word with the weakest claims moved to their next word.
- **Neighbouring realms never share a colour:** give every realm its own of 36 (12 hues x 3 lightnesses), neighbours furthest
  apart in OKLab, the biggest first.
- Draw roads solid and cased (a red line in a pale casing; a pale line in a dark casing), never dashed or dotted, which belong to
  borders. Lay them into a cached picture of the view, not every frame (drawn directly they tripled a frame's cost).

## One continent for a game, chosen by measurement (Ardan M1, D-142)
A world the player learns should not redraw itself each game. Build every life on one canonical map seed (Ardan:
`A.V2MAP.ONE`); let the game's own seed decide only what happens on the land. Choose the seed by reading candidates, not by
eye alone (`tools/m1/choose-seed.mjs`): how well the realms' heartlands fit their lore (coast, heights, grass, desert, wood,
the compass words of their descriptions), roads that do not run beside borders, old neighbours kept, rivers reaching the
sea, region sizes in range; gate out any candidate that breaks a rule the tests hold for every world. Save the map seed and
version with each game, so a better generator redraws the one continent once and old saves keep theirs. Cache the built
continent (in memory for the session, and in the worker's IndexedDB between visits, keyed by a hash of the code that builds
it) so a phone builds it once.

## Rendering, satellite style
- **Land colour is a continuous palette** over temperature × moisture, interpolated bilinearly. Discrete biome colours make hard blobs. The palette rows run from cold to hot, with dry, mid and wet columns of muted albedos (for example temperate wet = 60, 90, 50 and hot dry = 212, 184, 134).
- Mottle the colour with fBm (±16%) plus fine fBm when zoomed in. Add bare rock on steep high ground and snow above a temperature-dependent snow line.
- Hillshade with a key light from the NW plus a fill light, vertical exaggeration 90, lit = (0.42 + 0.8·shade) × ambient occlusion.
- Colour the ocean by blurred depth: shelf (86, 150, 160) → mid (32, 80, 112) → deep (14, 34, 62), with a surf highlight that fades within 0.012 of the coast and an anti-aliased coastline.
- **Level of detail:** render a region at a higher scale and add fBm height detail that fades in as scale rises past 1.
- **Animation:** cheap drifting cloud-shadow overlays (CSS radial gradients, a 90 s alternate drift) and an optional water shimmer. Respect `prefers-reduced-motion`.
- Realm borders come from province ownership. Draw them as a light ink colour at 75% opacity. Realm names are labelled at the mean of their province centres, with a dark stroke.

## Verify by looking
Always render to PNG (a tiny zlib PNG encoder is enough) and look at 3 or more seeds side by side. Things to fix:
- **Boxy outline:** the falloff is wrong.
- **Smooth blob:** the noise amplitude is too low.
- **Everything desert:** moisture drains too fast.
- **Concentric bands:** the coastal moisture term is too strong.
- **Light patches in the sea:** drowned land is too shallow.
- **Staircase rivers:** smooth the paths.
- **Land touching the frame:** add the edge band.

Run tests for all of these:
- the main component holds more than 98.5% of the land
- no second landmass bigger than 0.13% of the map
- no land cells on the frame