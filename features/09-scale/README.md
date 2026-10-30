# The engine at scale

**Aspect:** Technical (stage 0 of `docs/plan/world-expansion-architecture.md`) and World (one world on the Great Continent) · **Kind:** fix layer (applied in every build): 9 patches, 2 code files, tests, two benches

The world is to grow about tenfold. On a world ten times as large (the plan's clone harness: 3,060 provinces, 341
realms) the full build played a month in 1.2-1.5 s of CPU and **the month holding the New Year in 15-20 s**: the year
turn grew with realms² × provinces. This feature makes the engine's most-asked questions cheap, **without changing a
single result**: the same seed reaches the same `A.S` and the same `A.rngState`, bit for bit, at any size, with it on
or off.

Nothing here is visible in play. It loads before every feature that builds on the engine (folders 00-09 are the fix
layer), so their wrappers sit on top of these functions.

## What changed

| Function | Before | Now | Why it is the same answer |
| --- | --- | --- | --- |
| `A.claimsOn(a, b)` | filtered every province | walks `a`'s claims (a handful of keys) | integer keys iterate in ascending order and a province's id is its index, so the same provinces come out in the same order |
| `A.realmProvs(rid)` | filtered every province | a copy of the owner's list from the province-by-owner index | the index keeps `S.prov` order; a fresh array each call, as before |
| `A.neighbors(rid)` | scanned every province and its neighbours | the owner's provinces only, their neighbouring owners remembered with the index; the alive filter runs on every call | the same provinces in the same order, so the same first-seen order of neighbours |
| `A.realmHouses(rid)` | filtered every house | a copy of the realm's list from the house-by-realm index | the index keeps `S.houses` order and the same filter |
| `A.indCount(r)` | summed industry over every province (up to 12 times per realm at the year turn) | over the realm's own provinces | same provinces, same order, so the same floating-point sums |
| `A.priceTarget`, `A.tradeMul` | counted embargoes and trade pacts by walking every realm and calling `A.hasTrade` for each | `A.scaleEmbPact` / `A.scaleEmb`: the realm's own pacts, and the realms that have ever laid an embargo | counting the same set; falls back to the loop if `A.hasTrade` is replaced |
| `A.allDivs`, `A.divById`, `A.divsAtIdx` | for-in over `S.realms` on every call or rebuild | a cached list of realm objects (`A.WSCALE.realmList`) | the same realms in the same order |
| `A.supplyMap` (per warring realm per day) | `A.ctrl` and a Map lookup for every province of the map | the controllers once per `A.wsSupplyDay`, then one code per controller (`A.scaleFr`) | nothing changes hands inside the supply pass; the codes are set from the day's friend, foe and access sets exactly as `codeOf` would |
| `A.supplyBase` (once per supply pass) | `A.provLocalSupply` and `A.wsWinter` called for every province | the same two formulas written out, the season worked out once | the same arithmetic in the same order; runs the original if either is replaced |
| `A.sameArr` | element by element | byte arrays four bytes at a time | the same answer for `Uint8Array`s; anything else runs the original |
| `A.armyEnemy`, `A.frontProvs` | walked the whole map (once per enemy) | provinces by controller, built once per round of the armies' thinking (`A._think`) | same provinces in the same order; `frontProvs` sorts its candidates back into `S.prov` order |
| `A.wsPath` | asked `A.friendly` and `A.hostile` (a walk over every war) for every road it weighed | remembered per holder for one search (`A.scaleRel`) | both are pure, and nothing changes during a search |
| `A.politicsYear`'s pair loop | `A.rulerPersona` for both rulers of every pair: 2 × realms² key builds a year | each persona remembered for one realm's pass over the others (`A.scalePairs`) | only the pair weighing runs inside the pass, and it changes no ruler; closed in a `finally` |

## How the memos stay right

- **Versions bumped at every write.** `patches.mjs` adds `A.scaleLand()` after each of the release's eight writes of a
  province's owner (transferProv, the claimant settlements, a claimant's land, a founded realm, a faction's
  breakaway, Tessaria's split), and `A.scaleHouse()` where play creates a house. `A.createRealm` bumps the realm
  version; `A.sign` (the only place an embargo is written) adds the realm to the embargo list.
- **No index during world building.** 43's `W.vary` and 70's `FR.make` move land inside `A.initWorld` without telling
  anyone. The indexes are not used between `A.newState` (or `A.deserialize`) and the first day of play: every
  rewritten function runs the original then.
- **Scoped memos** live for one stretch of code in which nothing they depend on changes: one `A.wsSupplyDay` (the
  release's own batch, marked by `A._relAll`), one round of the armies' thinking (`A._think`), one `A.wsPath` search,
  one realm's pass in `A.politicsYear`.
- **A net under the versions.** Each day starts by comparing the province index with every province's owner; each
  month the house index, the realm list and the embargo list are compared with the world. A difference means a write
  site was missed: it is counted in `A.WSCALE.stats.missed`, logged, thrown in check mode, and the index is rebuilt.
- **`scaleSites`** reads the built game and fails if any write of a province's owner, any `S.houses[...] =` or any
  change to a province's `adj` / `sea` lists is neither told to the indexes nor one of the world-building writes
  above. A new feature that moves land without `A.transferProv` fails this test until it calls `A.scaleLand()`.

## Switches

- `A.SCALE_OFF = true`: every rewritten function runs the release's code. The reference path for the tests.
- `A.SCALE_CHECK = true`: every answer is also worked out the original way and compared (much slower). A difference
  goes to `A.WSCALE.bad` and is thrown.
- `A.WSCALE.stats`: index rebuilds, answers checked (by kind), write sites missed.

The namespace is `A.WSCALE` because `A.SCALE` is 81-pacing's (the house scale of checks); the two switches are plain
fields of `A`.

## Patches

| Patch | Why |
| --- | --- |
| `SCALE-LAND-WRITES` | Every direct write of a province's owner bumps the land version. |
| `SCALE-HOUSE-WRITES` | A house created in play (the player's own) bumps the house version. |
| `SCALE-EMBARGO-COUNT` | `A.priceTarget` and `A.tradeMul` ask 09-scale for the two counts, and keep their loop as the fallback. |
| `SCALE-EMBARGO-ADD` | A new embargo adds its realm to the embargo list. |
| `SCALE-SUPPLY-CTRL` | `A.supplyMap` takes its control codes from `A.scaleFr` inside the supply pass. |
| `SCALE-PATH-RELATIONS` | `A.wsPath` remembers friend and foe per holder for one search. |
| `SCALE-PAIR-PERSONA` | `A.politicsYear` opens and closes the persona memo around each realm's pass. |
| `WORLD-WAR-CAP` | `A.aiWarCheck`'s cap of four wars is asked of `A.warCapFull` (each land its share on the Great Continent; null, so the release's rule, on the Known World). |
| `WORLD-REACH` | War declarations, coalitions, calls to arms and the pacts' own calls ask `A.outOfReach` (false on the Known World). |

## Measured

Oct 26, 2026, on this project's shared 4-core machine, one browser at a time. `bench.mjs` (the clone harness of the
plan's appendix A; seed 1234, a peasant of POL-01, 14 months of play, the first left out). Times are the page's
main-thread CPU time (Chrome's `ThreadTime`), wall clock in brackets, from back-to-back runs at a quiet moment (load
under 4). Under the usual load (8 to 13) both move by about ±25% from run to run: the 10× month read 640-1,030 ms of
CPU and the 10× year-turn month 1,530-2,230 ms over seven runs.

| World | Month, before | Month, 09-scale | Year-turn month, before | Year-turn month, 09-scale |
| --- | ---: | ---: | ---: | ---: |
| 1× (306 provinces, 35 realms) | 54 ms (78) | 45 ms (119) | 258 ms (376) | 118 ms (152) |
| 5× (1,530, 171) | 515 ms (816) | 345 ms (501) | 3,871 ms (5,197) | 769 ms (998) |
| 10× (3,060, 341) | 1,366 ms (1,440) | 746 ms (1,069) | 16,032 ms (17,096) | 1,675 ms (2,439) |

Where a 10× profile spends its time (14 months with one New Year, sampled; inclusive shares of the whole run):

| Path | Before | 09-scale |
| --- | ---: | ---: |
| `A.politicsYear` (`A.aiPullSum` for every pair) | 35% (28%) | 6% (3%) |
| `A.claimsOn` / `A.neighbors` / `A.realmHouses` | 15% / 5% / 6% | 0.3% / 0.4% / 0% |
| `A.priceTarget` + `A.mktMonth` + `A.updateRealmPops` | 10.5% + 5.3% + 2.1% | 3.5% + 1.5% + 0.4% |
| `A.diploMonth` | 13% | 9% |
| `A.wsDay` (wars: supply, armies, battles) | 18% | 31% |
| 45-economy's `E.caravans` | 8% | 22% |
| 66-markets' `MT.month` | 3% | 7% |
| total sampled | 56 s | 31 s |

The year turn is no longer quadratic in the size of the world: at 10× it costs about what a month costs. What is
left grows linearly with the world, plus the wars.

## Tests

`node tests/run.mjs built.html --features=scale` (with the core suites), or `--only=scaleIdentical,scaleCheckMode,scaleSites,scaleTiming`:

- **`scaleIdentical`**: 3 starts (peasant, noble, royal) × 10 years, with the feature off and on: the same state hash
  and the same random state.
- **`scaleCheckMode`**: 2 starts × 5 years and a 10× world for 4 months with `A.SCALE_CHECK` on, each compared with
  the feature off: no answer differs, no write goes unnoticed, every kind of answer is checked.
- **`scaleSites`**: the static check of write sites above.
- **`scaleTiming`**: the 10× world for 14 months; reports the month and the year-turn month, wall clock and main-thread
  CPU; fails if the month's CPU passes 2.4 s or the year-turn month's 5 s (three times this machine's numbers).

`node features/09-scale/bench.mjs built.html --K=1,5,10 [--off]` prints the table above for any build.
`node features/09-scale/great-bench.mjs built.html [--realms=POL-01,POL-36] [--profile=out]` times the Great Continent.

- **`scaleOneWorld`**: a Great Continent game for ten years: the lore's tributes made and held, no realm at war out of
  reach, far news late and few, far realms standing, treasuries bounded, wars ending.

Checked on Oct 26 against one snapshot of the features (with and without this folder): those four tests, the core
suites and the tests of 01, 03-05, 20, 21, 23, 36, 38, 43, 44, 45, 55, 56, 64, 66, 68, 69, 70 and 99 (143 tests, all
pass), and `bench/balance.mjs --workers=2`, whose 72 lives came out identical life by life (every path's deaths, wealth,
fame and arcs; check win rate 49.4%; all within their bands).

## One world (`world.core.js`, round 10)

The Great Continent (99-far-lands) is to be the world a player gets, and every realm, army and market in it simulates
in full every day (the owner's call of Oct 27: no lighter tick for far lands). The release's rules were written for 35
realms in 7,000 km, where every realm can reach every other. On 153 realms in 17,600 km four things went wrong, measured
on ten-year Great Continent games (seeds 555, 556, 9090; a peasant of Aldmark):

| What | Before | Now |
| --- | --- | --- |
| **Who joins a war** | a coalition took in the neighbours of the target's neighbours, and allies, tributaries and pact partners answered a call from anywhere: coalitions of 15 to 25 realms from six lands, members up to 4,000 km from the other side | a realm joins (or declares, or leagues against) only a realm whose land comes within **1,500 km** of its own (`A.outOfReach`, nearest province to capital, both ways): 0 joiners out of reach in ten years (`scaleOneWorld`) |
| **Wars at once** | the release's cap of four wars (`A.aiWarCheck`) was shared by the continent: full on 18% and 36% of days, so a war in the Black Pines kept the Known World at peace | each land has its share of the four (four for the Known World's 35 realms, three for the Twin Rivers' 22, at least one for every land; `A.warCapFull`) |
| **The lore's ties** | the lore's 53 tributes were read by the release as trade pacts and its 3 alliances as opinion only; no realm began as anyone's tributary | the 46 tributes that fit (both realms standing, no loop) begin as tributaries (`S.loreTies`), the alliances are sworn, and a tributary of the lore does not throw off its overlord for 12 years (20's `A.aiDefy`): 45 of 46 still paying at year 5. The lore's opinions drift slowly as before (median over ten years: hostile pairs −75 → −58, rivals −45 → −36, friends 40 → 37) |
| **News** | every realm's every line: 280 to 500 a year (Known World games: 70 to 150), so the 220 lines kept reached back half a year, most about lands the player will never see | a line naming only realms more than 2,000 km from home and not tied to the player's (realm, neighbours, allies, overlord, foes at war) is far. A far war declared or ended, a coalition, a fallen realm or a throne changing hands arrives after the days word takes (40 km a day: "Word from the east: ..."), at most 30 a year; far battles, harvests, councils and pacts are not heard of. Ten years: 189 near lines and 31 far ones kept |

All of it is gated: `A.warCapFull` answers null and `A.outOfReach` false on the Known World, and the news and tribute
code returns at once there, so a Known World game plays bit for bit as before (the same state hash as the build
without this file).

The far world stays plausible over ten years (`scaleOneWorld`): 116 of 118 far realms standing, treasuries at 1.7 years
of income (median; highest 3.5), no war older than eight years.

**Other features touched for it:** 68-casus-belli's old-debt march (`debts.core.js`) asks `A.outOfReach` too (one line).

## Exact speed-ups in other features (round 10)

Bit-identical (the same state hash and random stream as before, Known World and Great Continent, seeds 77, 78, 79):

- **45-economy** `E.caravans`: each market walks its roads cheapest first and stops where even the dearest price
  anywhere could not pay the road; candidates keep their old order as the sort's tie-break.
- **20-ai-personality** `A.aiPullSum`: one body with `A.aiPullParts` that keeps only the sum and builds no label
  (A.politicsYear asks for every pair each year). The terms are added in the same order.
- **66-markets** `MT.road`'s memo key is `a * 65536 + b` (was `a * 4096 + b`, which collides past 4,096 provinces).

**Measured** (`great-bench.mjs`, seed 1234, a peasant of Aldmark and of Taulen, 14 months; quiet machine, main-thread
CPU): month median 314 and 337 ms, year-turn month 644 and 602 ms, new game 693 and 710 ms. The level-of-detail tick the
plan proposed (stage 2) was dropped: the world runs in full, and the interface plays it a week or a month at a time
without freezing (84-top-bar's step rhythm, `docs/design/pacing.md`).

## What is left

- **The month at 10× is not yet 250 ms** (and the Great Continent's about 0.3 s; the owner has since set that target aside for full simulation everywhere). It is linear work now, spread over many systems: the war day (`A.wsDay`,
  about a third: supply maps over the whole map for every warring realm, the armies' thinking, battles), 45's
  caravans (`E.caravans` looks at every pair of markets for every good: markets² × goods), 66's towns, the AI's
  diplomacy, and some thirty other monthly hooks that each walk every realm. Reaching 250 ms needs the plan's level of
  detail (stage 2: a far continent on a coarse tick), or changes that change results (supply maps by theatre, pairs
  pruned by distance). Both are beyond an exact rewrite.
- **45-economy, exact and measured, applied in round 10** (see above): `E.caravans` can walk each market's roads
  cheapest first and stop where even the dearest price anywhere could not pay the road. The candidates come out the
  same, in the same order (each keeps its old place as a tie-break in the sort); the state hash is unchanged at 1× and
  10×. The candidate pass at 10× goes from about 70 ms to 27 ms a month; the whole month moves by less than the noise.
- **`A.supplyMap`** still spends most of its time deciding, in O(provinces), that yesterday's flow can be reused
  (94% of calls at 10×). Comparing only what changed (controllers, the divisions near the front) would make that
  O(changes).
- **Realm objects are in V8's dictionary mode** (40 of 41 after a few years, from `delete` of realm fields in several
  features), and so is `A` itself, so every `A.x` and `r.x` is a hash lookup. Not something a feature can fix.
- **Pairs in `A.politicsYear`**: 20-ai-personality's sum-only `A.aiPullSum` is applied (round 10).
- **The month's turn is one long day** on the Great Continent (230 to 480 ms in one task: every monthly hook). The
  step rhythm draws a note before it; splitting it across frames would need `A.monthTick` itself in parts.

## Cycle 1 (world review B2, B3, B9, I5; lives review B8)

Great Continent only (`world.core.js`); a Known World game calls none of it.

- **Grace.** For its first 12 to 18 months (`W.GRACE`, from the land's code: the Long Grass and the Peninsulas 12, the Twin Rivers 16, the Rime 17) no AI realm of a far land starts a war of its own (`A.warCapFull` reads full). `S.w1t0` is the day the game began; a save without it has no grace.
- **Peace by share.** A peace a far realm loses takes at most 15% of its people and of its land by cells, and at least one province (`W.capTreaty`, wrapping `A.wsTreatyProvinces`); a war with `w.fwLimit.max` takes no more than that. A far realm of more than four provinces is not annexed whole by a crushing peace (the score is held at 89 for the settlement).
- **Wars that last.** A war with a far side is not settled with terms inside nine months (`W.MIN_WAR_DAYS`) unless a capital has fallen or a player's realm makes the peace; a border war (`w.fwLimit.until`) not before its day by any road (`A.settleWar` wrapped, since the AI's offers, factions and the war clock all settle through it). `w.d0` records the day a war began.
- **News before the life.** A line told while the player has no home (the world being built) waits in `S.newsPre` for the first day, then goes through the distance rule; the 1105 wars no longer reach Aldmark on 1 January.
- **Garbled word.** From beyond 5,000 km (`W.GARBLE_KM`) word takes up to two years (was capped at 240 days), a list of provinces becomes "border country", "a stretch of land" or "a great swathe of land", and one line in three (by the text's hash, no dice) has the cause of a death or the winner of a war wrong; the true line follows 4 to 10 months later as "Later word from the east mends the first".
- Measured by `scaleFarPeace`.
