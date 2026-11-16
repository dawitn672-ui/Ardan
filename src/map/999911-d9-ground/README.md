# 999911-d9-ground: the ground the game can read (D9)

**Aspect:** CRITIQUE §17 (D9, M1 to M9, P18, part of U5); D-016 (an inked map rich in detail), D-061 · **Kind:** system,
renderer and play hooks; 3 code files, edits in the release and in 23, 38, 62, 9991 and 99991 (each marked D9); no events.

## What it is

The continent (99991-v2-map) carries its **ground**: `A.V2.ground.buildGround` (`src/map/engine/ground.js`, plain ES module,
unit-tested by `tests/v2/ground.test.js`) runs at the end of `A.V2MAP.build`, on the page or in the worker, and puts on the
world (`w.ground`):

- **Cover** for each 10 km cell of land: open, wood or marsh. Woods are the climate's forests broken by clearings (a noise
  seeded from the world), copses in dry grass, and the fields round every town cleared; marsh is the wetlands and the fens of
  big lowland rivers.
- **Roads in two ranks.** Between every two neighbouring towns, the cheapest way over the grid (slope, wood, marsh, height,
  stepping into water) inside the two provinces; a way that costs more than 3.4 times its straight length is no road
  (cross-country only). Over these tracks, **high roads**: each realm's seat to its cities and market towns, and to the seats of
  the realms beside it. About 190 high roads, 610 tracks and 10 to 30 ways with no road per world.
- **A crossing wherever a road meets running water** inside its course: a **ford**, or a **bridge** on a river too big to
  ford (flow 700), at a town, or where a high road meets a river. Crossings of one river within a cell are one. A town on the
  water has its bridge in the town.
- **Passes:** a road's highest point, at 1,000 m or more and 300 m above both its ends.
- **River links:** neighbouring provinces a navigable river (flow 300) runs between.
- **Features to name:** the 28 biggest rivers, the mountain ranges (land over 1,800 m, a long range by 450 km stretches), the
  forests (by 400 km stretches), and the seas in eight sectors round the coast.

The world's own fields changed with it (map version 3, `a-world.core.js`): **towns stand on water** (a site moves to a river, a
stream, a lake shore or the sea's shore within 180 km of its seed), **oases stand on dry land** (the dry realms are seated on
dry land, their oases seeded on it; an oasis the land still left off it becomes a town named for its water, `Grakzag Oasis` ->
`Grakzag Ford`, keeping its old name as `oname`), and **terrain words are read from the ground**, not by quota (below).
Version 2 worlds (older saves) are built exactly as before.

## In play (`a-ground.core.js`, `b-play.core.js`)

`A.D9.ctx()` reads the loaded world's ground (building the world from the seed if a load has not drawn the map yet); without a
generated map every factor is 1.

| What | Where | By rank (none / high road / track) |
| --- | --- | --- |
| A journey's day (9990's `A.JR.stepDays`) | wrapped here | speed x0.8 / x1.25 / x1.05: a road is 1.56x or 1.31x open country |
| An army's march (`A.divMove`) and its way (`A.wsPath`, 38's `roundRoad`) | release and 38, marked D9 | x0.85 / x1.3 / x1.12: 1.53x and 1.32x |
| Supply from one province to the next (`A.supplyNeighbours`) | release, marked D9 | x0.9 / x1.05 / x1, x1.05 more on a navigable river, at most x1.1 |
| An attack (`A.fightDay`, each attacking division by where it comes from) | release, marked D9 | over a river: by its ford x0.82, its bridge x0.87, no crossing x0.75; through a pass x0.8 |

The fight keeps the factor and the place's name in `F.mods` (`cross`, `crossN`); 23-after-action reckons it as a cause and the
battle's record names it ("The ford on the River Yew", "The Bearstow Pass"). The release's own built roads (`P.road`) keep
their bonus on top.

## On the map (`c-draw.core.js`)

- **One map component.** `MAP.paint` (in the release's `21-map.js`) lays the ground, the realms' colours, the front, the ways and
  the ink for the world tab, the full map, the war room and the atlas of your journeys; each adds only its own marks.
- **The ways** are laid into 62's kept picture of the lines (`IM.under`, keyed by `IM.underKey`), over the borders and under the
  towns, so a still or panning map pays one copy. A high road is a red-brown line in a pale casing, a track a thinner brown line:
  solid and warm, where a realm border is dashed ink and a province bound dotted. From zoom 1.6 tracks; from 2.6 woods (small
  trees), marsh (reeds), fords (a pale blue diamond) and bridges (two flared lines); from 1.8 a pass is two arcs across its road.
- **Names of the land**, through 99991's labels and by its rule (a name that would touch one already written waits): seas and
  ranges after the realms, then rivers along their course, forests and passes after the provinces. Names come from C7's pools,
  the culture of the realm the land belonged to in the release, by a hash of the world and the feature: "the River Ash", "the
  Ramby Mountains", "Trondal Forest", "the Sea of Ironford", "the Merewick Pass".
- **The rivers' tributaries**: the world's rivers now start at a stream's flow (40); streams show from zoom 4.
- **Realm colours** (`UI.realmHex` on a generated map): twelve hues in three steps, one colour a realm, chosen so neighbours
  stand furthest apart (the biggest realms choose first); a realm made later takes an unused colour furthest from its neighbours'.

## Measured (`test.mjs`)

| Test | Result |
| --- | --- |
| `d9Ground` | 3 seeds: high roads 189 to 202, tracks 601 to 630; every place on a road; every water a road crosses has a ford or bridge (0 missing); 27 to 67 passes; 129 to 171 tributaries; wood 27 to 42%, marsh 2 to 4%; seas, ranges, rivers, forests and passes named, all distinct; towns on water 73 to 84% (mean 78%) |
| `d9Terrain` | 10 seeds: no oasis off dry land (0 to 11 retyped a seed, mean 6); the largest word 22 to 31% (hills in 8 seeds, forest once) |
| `d9Play` | every high road 1.56x and every track 1.31x faster than the same way without one (march 1.53x, 1.32x); a journey across the map 257 days on roads against 282; supply lines on high roads or rivers 15 of 37 (0 without the ground) |
| `d9AttackAcross` | 78 roads across a river, 66 over a pass; in two years of war 101 fight days over a crossing; 25 battle records name it |
| `d9RealmColors` | 3 worlds and one 20 years on: 0 neighbouring pairs share a colour (the closest pair 0.07 in OKLab, after 20 years) |
| `d9OneMap` | `MAP.paint` draws the world tab, the full map, the war room and the atlas; redraw (main-thread CPU) at most about 22 ms |
| `d9SaveAndPure` | the ground after a load is the same; nothing of it is saved; drawing every map is pure |

Before D9 a redraw cost (the same probe, the same machine) world tab 3.3 ms, full map z1 5.7, z3 13.5, z8 15.3, war room z1.5
14.2, z4 20.5, z9 21.2; with D9 2.2, 5.7, 13.8, 16.2, 14.9, 22.2, 18.5. Drawn directly every frame the ways had cost up to 48 ms.

## Not done

- **Seasons on the roads** (a pass shut in winter, a ford drowned in spate), sea lanes on the route graph, and `fieldAt(site)`:
  the war design (`docs/design/war.md`) asks for them, but its ten decisions are the owner's to make first.
- **The burn** (D-016's fronts that spread like a burn) is D12b's; this is its ground.
- The terrain word is still one per province; the cover is what a battle could read inside one, and nothing reads it yet.
- The player's own battle (99997-v2-war) does not yet take the crossing; the war map's fights do.
- Names are English places for most of the land (C7's common pool); the far peoples' pools give their own.

## The iPhone rules (owner order 62 / rule 21)

- **Redraw only when something changes; culling.** The ways are drawn into 62's kept picture of the view (rebuilt only when
  the scale or the view's margin changes); roads are culled by their boxes, marks by the view's cells, names by the view.
- **No new objects in the drawing loops:** the loops read fixed tables (`REED`, `SIDES`, `RANKS`); one `Path2D` a rank and
  a kind is made per rebuild of the kept picture, not per frame. The names still build a box array per name per frame
  (99991's labels do the same); the route is to keep the boxes in a reused typed array with the labels.
- **No input of its own:** nothing here listens to the pointer; pan, zoom and tap stay the maps' own.
- **One canvas for the map and the war map: not yet.** `MAP.paint` makes them one component (one set of layers in one
  order), but the full map (`#gmap`) and the war room (`#warmap`) are still two canvases. The route: one canvas element
  kept by `MAP.paint`'s caller, the war room a mode of the full map (its overlay and counters are already layers).
- **Throttled 4x at 375 x 667, DPR 2** (a loaded machine, so noisy): a redraw costs 76 to 193 ms of main-thread CPU against
  82 to 154 ms before D9. Neither meets a 50 ms budget on a throttled phone; the cost is the kept pictures' copies at twice
  the pixels, before and after D9. The route: redraw only on change (no redraw while still), and copy the kept picture at
  the canvas's device size once.
- **Offline, relative paths:** no files are fetched; names come from `data/names.json` on the page.
