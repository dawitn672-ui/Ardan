# Journeys

**Aspect:** World and place (design review cycle 1, #17 "Journeys, not teleports") · **Kind:** system (`journeys.core.js`), 16 events (`journeys.events.js`, prefix `jr_`), 1 patch, tests

**Why.** "Travel or move away" listed the nearest provinces and one per realm. `A.travelTo` took the fare, set `pc.home` and wrote "You travel 1,240 km to …". A journey of a thousand kilometres was one click, and past 300 km a single road scene came up 45% of the time. There was no trip out and back, and the pilgrimage was a purse and a piety bump.

**What it does.**

- **The route.** Shortest road over the province graph, land borders and sea lanes, priced in days (`JR.route`, `JR.tree`):
  - on foot, `JR.SPEED` 26 km a day;
  - slower in rough country (hills 1.3, forest 1.25, marsh 1.6, mountains 1.9, desert and tundra 1.5);
  - 1.5 times faster on the lore's great routes (99-far-lands' `A.FAR.roadF`, the steps of `D.routes`);
  - `JR.SEA` 95 km a day by ship, plus a day to find one;
  - the season of each step as you reach it: snow on the passes (mountains and tundra 1.8, elsewhere 1.3), the spring thaw on the fords (1.15), the summer on the sands (1.25), rough winter seas (1.35).

  A province with no road to it on the map gets a ship's passage straight across. Vuuka to Seuvan on the Great Continent is 2,700 km and 94 days; set out in winter, the same road takes 85 days where autumn takes 65.
- **Stops.** About one every `JR.STOP_KM` (220 km) along the path. Each province you pass is seen (9991-atlas), and up to `JR.MAX_SCENES` (5) stops have a scene. The scene is drawn by `A.wpick` from what the land there offers:

  | Scene | When |
  | --- | --- |
  | `jr_border` | the stop is in another realm than the last: a toll, talk, or the sheep tracks |
  | `jr_sea` | the road went by sea |
  | `jr_route` | the step is on a great route, by its lore name (the Silk Road, …) |
  | `jr_site` | a wild place of 997-wilds there that you have not found; going to look queues 997's own scene, and finding it is recorded there |
  | `jr_custom` | one of the stop realm's customs (47-realm-bible, 990-far-peoples), in its own words |
  | `jr_folk` | the stop realm's people, and one of their words (`A.BIBLE.words`) |
  | `jr_beast` | a beast that lives there (76, 992 `A.beastsNear`), with what folk say of it; watching it teaches 26's level 2 |
  | `jr_caravan` | one of this month's caravans (45's `S.eco.car`) through that realm |
  | `jr_news` | the inn's story, from 57's world record in the last three years |
  | `jr_weather` | snow, flood, heat or rain, by season and ground |
  | `jr_pilgrims`, `jr_exile` | for a pilgrimage, and the first stop of an exile, a flight or an emigration |
  | the release's `road_*` | a little of the old road scenes |

  Choices move the road: wait out the weather (`fx.jr.slow`), push on (`fast`), pay a toll (`pay`), hear of the land ahead (`heard`, into the atlas), see a beast (`beast`), go to a wild place (`site`).
- **Kinds of journey** (`pc.journey.k`):
  - **move** (the road modal's "Move there"): the release's `A.travelTo` runs at the far end, so the job, army and language rules are the release's. The fare is paid when you set out, and `jr_arrive` asks how you start.
  - **visit** ("Go and come back", 1.6 times the fare): home is kept. `jr_arrive_visit` asks whether to rest and go home, go home at once, or stay for good. The road home is a journey of its own (`return`).
  - **caravan**: the modal lists this month's caravans out of your realm (45 and 66's towns). Walk with one for no fare and a guard's wage at the far end (`jr_caravan_end`: go home with a train, or stay).
  - **pilgrim**: the release's pilgrimage keeps its fare and piety, then takes the road to the nearest capital of your faith 150 km off or more (`JR.shrineFor`), then back (`jr_shrine`).
  - **return**: home again. Any outward road can be turned back from (`A.jrTurnBack`, the road modal's "Turn back for home").
  - **told journeys**: exile, flight, emigrating, a school, 52's arc moves, anything that sets `pc.home` some other way. The life does not jump. The road between is told after (`applied: true`): its provinces are seen, its scenes come, and the release's move stands. They are found by `pc.jrAt` (where the road last saw you live), and `A.exile` tags its own.
- **The record.** `pc.jrLog` keeps the last 30 journeys (kind, from, to, year, days, km), for the Atlas.
- **The road modal** (a wrap of `UI.travelModal`) shows each place's days by the road, the season, the two ways to go and the caravans. While you are on the road it shows where you are, with "Turn back".

**Patches.** `JR-ROAD-SCENE`: the release's 45% road scene is not rolled for a move made at the end of a journey (the road had its scenes). The core wraps `A.travelTo`, `A.ACT.pilgrimage`, `A.exile`, `A.continueAs`, `A.applyFx` (`fx.jr`, declared in `A.FX_EXTRA`) and `UI.travelModal`, and adds `A.onDay`. `A.jrCaravan` and `A.jrTurnBack` are pushed onto `A.COMMANDS`, so the journal records them; `A.travelTo(pid, 'visit')` is journaled as before.

**Rules kept.** Every draw is `A.rand` (`A.wpick`, `A.pick`), and the route is a pure function of the map and the day. Rendering reads only (`journeysPure`). The new fields `pc.journey`, `pc.jrAt` and `pc.jrLog` are optional, so an old save has no road and loads. A trip under 120 km is the release's move, without a road.

**Measured by** (`test.mjs`):
- `journeysRoad` (both worlds): a far capital is a road of linked steps; home is kept until arrival; winter is slower; the stops' scenes have no raw tokens; you arrive and live there; every province on the path is seen; `jrLog` has it.
- `journeysKinds`: a visit reaches the far end and comes home (two roads logged); turning back makes a road home; the pilgrimage is a road; exile is told; a caravan of the month can be joined; an old save without the fields loads and plays.
- `journeysPure`: the same seed and choices give the same life, the same scenes and the same random stream with or without drawing the map and the road modal every week, and drawing changes nothing.

`lint-events` passes (16 events, 112 renders, no errors). `lint-choices` finds no obviously best choice (0 of 5 compared).

**Limits.**
- While you are on the road, the release's events of home still come (the roof, the harvest, the lord's tax). Holding them for the journey's length needs a class of "at home" events that the engine does not have.
- Job and army rules apply on arrival, as the release's move does.
- A visit does not pause the job.
- Bonds (999-confidants) do not yet come along.
