# World expansion: how the world is built, and how to make it much larger

Oct 26, 2026 · read from the release (`vendor/ardan-b593143.html`) and the full build of 83 features
(`node tools/build.mjs --out=/tmp/ardan/arch/x.html --unpack=/tmp/ardan/arch/blobs`). Function names are as
`tools/show.mjs` prints them. The timings were taken on this shared 4-core machine at load 3 to 8, one browser at a
time. They are noisy, so each number is given as the range of the runs.

The ask: make the world "at least the size of Asia", with many more countries, kingdoms, beasts and fighting styles,
and every kind of detail "tenfold".

**In short.**

- The world is a fixed **700 × 450 grid** of 10 km cells holding 306 provinces. Everything else hangs off province ids
  and realm ids.
- The simulation does not crash on a world ten times larger. It is slow, though. The **year turn grows with realms² ×
  provinces**, so a 10× world takes **17 s a year**. Three exact rewrites bring that down to 3.3 s, and they leave the
  state hash unchanged.
- So the plan has four parts, in this order:
  - make the engine scale;
  - make the map frame size-agnostic;
  - add a generated continent as **data, opt-in per game**, with province ids from 306 upward and realm ids from
    POL-35 upward;
  - then fill it with content.

  Tests and benches keep the world as written, the way 43 and 70 already do.

---

## 1. How the world is defined and drawn

### 1.1 The data

The map lives in `LORE.map`, inside the JSON that opens the core blob (`const LORE=JSON.parse(\`…\`)`, 868 KB).

| Field | Value |
| --- | --- |
| `gw`, `gh`, `cell` | 700, 450, 10 (km per cell). The world box is **7,000 × 4,500 km**. |
| `rle` | A base64 string of 75,404 chars: Uint16 pairs (province id + 1, run length). `MAP.init` decodes it into `MAP.grid`, an `Int16Array(315000)`, where each cell holds a province id and −1 means water. |
| `provinces` | An array of 306 records, where `id === index` (79 KB of JSON). |
| `LORE.terrainJpg` | The release's relief picture: a 1050 × 675 JPEG, 159 KB of base64. It is drawn under the realm wash when the inked map is off. |

There are **no polygons**. A province's shape is the set of grid cells carrying its id. There are 229,026 land cells
of 100 km² each, so the land comes to **22.9 million km²**, about North America. The canon agrees: "a bit more than
Earth's North America" (`canon/bible/part02_geography.md`). **Asia is 44.6 million km²**, so the world as written is
about half of Asia.

**The province record** (`LORE.map.provinces[i]`):

```
{ id, pid: "PLC-0001", name, type, realm: "POL-02" | "unclaimed", x, y, sx, sy,   // site and label point, in km
  pop, town, biome: "Dry woodland", terr, elev, fort: 0-3, coast: bool, cells, adj: [ids], sea: [ids] }
```

- **`type`** takes 14 values. Counts: town 74, city 62, market town 35, capital city 31, castle 29, unclaimed land 25,
  oasis 22, caravanserai 6, and a few each of monastery, ring-fort, yam station, dwarven hold, gate-fort and giant
  hall.
- **`terr`** takes 8 words: hills 126, forest 45, steppe 40, plains 33, desert 26, mountains 20, tundra 9, marsh 7.
- **`biome`** is free text.
- **`adj`** is precomputed and symmetric (0 asymmetric pairs). A province has 5.93 neighbours on average. Islands
  are joined to the mainland by `adj` across straits. There are **only 6 `sea` links in the whole map**, all around
  the Isle of Pearls. By `adj` alone the map is one component of 305 provinces plus one; with `sea` it is all 306.
- **Rivers are not in the game data.** They exist in the canon and in the JPEG only. Roads are a flag, `P.road`, set
  in play.

**`S.prov`.** `A.initWorld` copies each record into `S.prov` and adds:

- `owner`, `orig`, `dev`, `occ`, `siege`, `unrest` and `bld`;
- later, in play, `road`, `depot`, `sgBy` and the like.

`A.prov = i => A.S.prov[i]`, so **a province's id is its array index everywhere**. Saves store the whole `S.prov`,
static fields included: 102 KB of the 1.4 MB a new game takes.

**Where the shapes came from.** They were made offline by `canon/map/generate_map.py`.

- It is Python with numpy, scipy and numba, 1,832 lines.
- It works on a 1400 × 900 grid of 5 km cells, through these stages: plates → heightmap → erosion → climate and rain
  shadow → rivers and lakes → biomes → settlements → borders → roads and sea lanes → labels.
- Its output was reduced to the 10 km game grid.
- The gazetteer (`canon/map/gazetteer_major.csv`) lists **2,768 places**, about 1,000 of them settlements, against the
  game's 306 provinces.
- `canon/` is in `.gitignore`. It exists on this machine but not in the repo, and scipy and numba are not installed
  here.

### 1.2 The renderers

Every map canvas has the world's 14:9 shape (7000:4500).

| Canvas | Size | Drawn by | Zoom and pan |
| --- | --- | --- | --- |
| `#titlemap` (title strip) | 1050×675 | `MAP.draw`. 86-title-fold only sets its CSS height. | none |
| `#worldmap` (World tab) | 1050×675 | `MAP.draw` and `MAP.attach`, from `UI.afterRender` | none; hover tip and click (`MAP.provAt`) |
| `#bigmap` | 1400×900 | `MAP.draw` | none |
| `#gmap` (full map) | 1100×720 | `UI.gmDraw`, `UI.gmAttach` | wheel ×1.25 per step, drag to pan; `UI.gm.view = {x0,y0,w,h}` in km; `UI.wrClampView` holds `w` to 500–7,000 |
| `#warmap` (war room) | 1100×720 | `UI.drawWar`, `UI.drawWarBasic`, `UI.wrOverlay`, `MAP.front` | `UI.wrView` frames the fronts; `UI.wrClamp`; `UI.wrProvAt` |
| `#campmap` | 1050×675 | `UI.drawCamp` | none |

`UI.drawBattle` and the 72-two-scales view are battlefield views, not world maps.

**The layers of one frame:**

1. `MAP.ground` draws the vellum land, ruled sea, coasts and glyphs. This is 62's, and it declines when the inked map
   is off.
2. If the inked map is off, the release draws its relief JPEG instead.
3. `MAP.overlay(mode, hl, focus)` lays the realm colours. It is an `ImageData` at grid resolution, filled per pixel,
   and 62 inks it (`inkify`). It is cached under a key: `mode|cb|hl|focus|year|mapVer|` plus every province's owner and
   occupier, plus every realm's colour.
4. `MAP.front` draws the front lines.
5. `MAP.inkLines` draws borders, towns and keeps (62).
6. `MAP.marks` draws the names (62), or the release's labels when 62 is off.
7. Army counters come last: boxes, or banners at zoom 2.2 and closer.

The modes, in `MAP.MODES`, are political, diplomatic, alliances, wars, faith, danger and terrain.

**62-inked-map** (`inkmap.core.js`, 715 lines):

- **Constants:** `TILE = 256`, `BASE = 1100/7000`, `MAXL = 5` (six zoom levels), `KW = 7000`, `KH = 4500`.
- **Geometry:** `buildGeo` traces the coast and province edges from the grid into smoothed polylines. Today that is
  19 coast loops and 1,447 border pieces, plus distance fields, built in 149 ms once per session.
- **Edge keys:** each edge is keyed `a*4096+b`, so **4,096 provinces is a hard limit**.
- **Tiles:** up to 150 are cached, and all of them are flushed when a border moves.
- 61-illumination tints the map and adds a compass. It has no geometry of its own.

**Hard-coded world size.** The literals `7e3` and `4500` appear in these release functions: `MAP.toCanvas`,
`UI.gmFit`, `UI.gmDraw` (5 and 4 times), `UI.gmAttach`, `UI.wrView`, `UI.wrClamp`, `UI.wrClampView`,
`UI.drawWarBasic` (5 and 4 times) and `UI.wrProvAt`. Outside the release they appear in 62's `KW`, `KH` and `BASE`,
and in 62's test (`w = 7000 / z`).

A province id is stored in an `Int16Array`, so ids above **32,767** do not fit.

**Measured render costs** (1×, inked map on):

- `MAP.overlay` from cold: **36 to 65 ms**, linear in grid cells. It is rebuilt on every change of owner or occupier.
- `MAP.draw` from cold: 29 ms. Cached: 0 ms.

### 1.3 What exists today

| Thing | Count | Where |
| --- | ---: | --- |
| Provinces | 306 (31 capitals, 25 unclaimed) | `LORE.map.provinces`, `S.prov` |
| Realms | 34 in the lore, 35 at start (the release adds `POL-31A`, Andros's Tessaria), 35 to 37 with 70-fresh-realms | `LORE.realms`, `S.realms` |
| Provinces per realm | 1 (Lucerna, Irondeep) to 22 (Sylvaran, Sand Clans, Zanara) | |
| Cultures | 24 (`CUL-01..24`, each with 30 male and 30 female names, 20 houses and 15 epithets) | `LORE.cultures`, `GD.NAMING` (24) |
| Faiths | 19 (`REL-01..19`) | `LORE.faiths`, `GD.REALM_FAITH`, `MAP.FAITH_COL` (19) |
| Races | 7 | `GD.RACES` |
| Languages | 24 | `GD.LANG` |
| Great houses | 180; plus 620 lesser families, so 800 in `S.houses` | `LORE.houses`, `LORE.houseDeep`, `LORE.families` |
| Bloodlines | 42 | `LORE.bloodlines`, `GD.BLOOD` |
| Named characters | 573 cast, 100 historical figures; **399 people at the start of a game** | `LORE.cast`, `LORE.figures` |
| Game beasts | **25** stat blocks, plus 64 creatures in the lore (some hoaxes), 37 tiers, 25 beast duels, 8 `A.GAME_BEASTS` | `A.BEASTS`, `LORE.creatures`, `GD.BEAST_TIER`, `GD.BEAST_DUEL` |
| Fighting styles | **265**: 93 national, 61 chain, 111 household. 21 weapon kinds; `A.stylesOfRealm('POL-01')` gives 4 | `LORE.styles`, `A.allStyles` |
| Troop types | **34**: 21 base (`SP PK HI AX LI XB LB AR EA SL HC MC LC HA CM EL GI OR MR GA LV`) and 13 special (`Xsun0` and others) | `GD.TROOPS`, `GD.TROOP_SKILL`, `GD.TROOP_GEAR` |
| Doctrines and tactics | 36 realm doctrines, 32 battle tactics, 137 tactics in the lore | `GD.DOCTRINE`, `GD.BATTLE_TACTICS`, `LORE.tactics` |
| Schools and academies | 61 schools; academies for 34 realms | `LORE.schools`, `LORE.academies` |
| Events | **4,794**. 848 gate on a realm id, 14 on a culture, 45 on a faith, 210 on terrain or coast | `A.EV` |

**What is in each blob.** The lore blob (`ardan-lore`, 3.5 MB unpacked) holds the cast, families, houseDeep, styles
and academies. The core's `LORE` holds everything else above. `LORE` comes to 4.3 MB in memory, and `index.html` is
4.26 MB.

---

## 2. What assumes the current size, and what a month costs

### 2.1 Places that assume the world as written

**Map size.** The `7e3` and `4500` literals listed in 1.2; 62's constants; the 14:9 canvases; the 4,096 limit in 62's
edge keys; the Int16 grid.

**Province ids.**

- `S.prov` is indexed by id. So new provinces **must be appended (ids 306 and up)**, never inserted.
- `MAP.overlay` and `MAP.front` build arrays indexed by province (`S.prov.map(...)`) for every pixel.
- 76-beast-habitats' `BH.REGION` matches all 306 provinces by name, and its tests assert `=== 306`
  (`features/76-beast-habitats/test.mjs:54,76`).

**Realm ids written into the code.**

- The core blob (release and features together) holds **401** `POL-xx` literals. The content blob holds **2,704**.
  Feature code holds 442, in 21 files.
- `A.initWorld` gives army quality by id: elves (`POL-06`, `POL-07`) 1.35, dwarves (`POL-10`, `POL-28`, `POL-29`) 1.4,
  giants (`POL-09`, `POL-23`) 3. It picks rulers by id for `POL-22` and `POL-31`, and builds Tessaria's civil war by
  id.
- `GD.RACE_CULTURE` picks the culture by realm: elves get `CUL-20` in `POL-07` and `CUL-19` everywhere else; orcs get
  `CUL-23` in `POL-34` and `POL-12` and `CUL-22` everywhere else; every dwarf is `CUL-21` and every giant `CUL-24`. So
  an elven realm on a new continent would get the Evenwood's culture.
- `A.faithFor` special-cases `POL-33`. `GD.UNFREE.slave` and `GD.UNFREE.serf` are lists of realm ids.

**Tables keyed by realm id.** Each new realm needs an entry in each, the way 70's `FR.register` does it:

- `GD.REALM_CULTURE` (35), `GD.REALM_FAITH` (35), `GD.REALM_HUMAN_CULTURE` (9), `A.AGGRO` (19), `GD.DOCTRINE` (36);
- `A.GOV`, `LORE.titlesByRealm`, `LORE.academies`, `LORE.rulerHistory`;
- 47-realm-bible's data;
- 54-voices, which is keyed by culture.

**Creation screen.** It lists `Object.keys(LORE.realms)`. There are 5 such reads in the core. A realm that is not in
`LORE` cannot be a birthplace; 70's README says so.

**Colours.** `MAP.CB_PAL` has 16 colours for colour-blind mode and `A.COLORS_EXTRA` has 10. With 150 or more realms,
neighbours will share hues.

**The relation matrix.** `A.initWorld` and `A.createRealm` give **every realm an entry for every other realm**
(`r.rel[k] = 0`). That is R² numbers in state and in every save.

### 2.2 What a month costs: measured

**Method.** Each game is `A.newGame({seed:1234, race:'human', realm:'POL-01', status:'peasant', startAge:16})`. It is
played in steps of `A.advance(30)` until 30 days have passed, with events auto-chosen, for 25 months. A month that
holds the New Year is counted apart, as "year".

**The larger worlds.** These are the 306-province world **copied K times in the page before `A.newGame`**:

- each copy sits 7,000 km east of the last and is stitched to it by 4 land links;
- each copy has its own realms, houses and tables;
- rulers are generated, not taken from the cast.

The harness is in Appendix A. A real generated continent would differ in shape, but the counts scale the same way.

| World | Provinces / realms | People at start | `A.newGame` | Month (median, p90) | Year-turn month | State JSON (start / after 2 years) |
| --- | --- | ---: | ---: | --- | --- | --- |
| Release, 1× | 306 / 35 | 98 | – | 59 ms / 90 | 147 ms | 0.96 / 1.2 MB |
| Release, 5× | 1,530 / 171 | 337 | – | 238 ms / 358 | 1,973 ms | 2.9 / 3.4 MB |
| **Full build, 1×** | 306 / 35 | 399 | 240–490 ms | **35–115 ms** (5 runs) / 74–298 | **150–950 ms** | 1.4 / 2.0 MB |
| Full build, 2× | 612 / 69 | 582 | 480–540 ms | 213–251 ms / 355–396 | 870–1,077 ms | 2.1 / 3.0 MB |
| Full build, 5× | 1,530 / 171 | 1,142 | 0.86–1.35 s | **564–713 ms** / 751–1,175 | **3.7–4.4 s** | 4.2 / 6.1 MB |
| Full build, 10× | 3,060 / 341 | 2,083 | 1.8–2.6 s | **1.12–1.25 s** / 1.87–2.12 | **16.8–18.4 s** | 8.3 / 11.6 MB |
| Full build, 10×, three exact rewrites (2.4) | 3,060 / 341 | 2,083 | 1.8 s | 1.05 s / 1.66 | **3.25 s** | same |

For scale, on CI's quieter machine `bench/run.mjs perf` reads 0.89 ms a day (about 27 ms a month) on the full build
at 1×, with a war-tick p95 of 4.9 ms.

**What the numbers show.**

- No page error came from any size. The engine tolerates 3,060 provinces and 341 realms. It is only slow.
- **The month is close to linear in the size of the world**, plus whatever the wars cost.
- **The year turn is quadratic or worse.** It is 13× for a 5× release world and about 20× for a 10× full build.
- The release alone shows the same quadratic year (147 ms to 1,973 ms at 5×), so the root cause is the release's
  code. The features add more pairwise work on top.

### 2.3 Where the time goes

These are profiles of 13 months (one year turn) at 10×, as inclusive milliseconds. Line numbers point into the core
blob of the full build.

| Hot path | Owner | Cost at 10× | Why it scales |
| --- | --- | --- | --- |
| `A.politicsYear` → `politicsYearNow` → `A.aiPullSum(r, o)` for **every pair of live realms** → `A.aiPullParts` | release loop; 20-ai-personality's pull | **10.6 s of a 13.2 s year** | R² pairs. Each pair calls `A.claimsOn` twice and `A.neighbors` up to twice, and **each of those scans all of `S.prov`**: R²·P |
| `A.claimsOn(a, b)` = `S.prov.filter(p => p.owner === b && r.claims[p.id] …)` | release | 6.9 s | O(P) a call |
| `A.neighbors(rid)` = a scan of all of `S.prov` and its `adj` | release | 1.3 s | O(P·adj) a call, no memo |
| `A.realmHouses(rid)` = `Object.values(S.houses).filter(...)`, from `A.factionsYear` and 56's court | release; 56-realm-inside | 2.5 s | O(H) a call, R calls a year |
| `E.caravans`, `A.priceTarget` | 45-economy | 4.2 s, about 330 ms a month | candidates for every pair of markets × 21 goods: R²·G |
| `MT.month`, `MT.path`, `MT.build` | 66-markets | 1.6 s | pathfinding across the map for each route |
| `A.mktMonth` | release market | 1.8 s | R × goods |
| `A.wsDay` → `A.wsSupplyDay`, `A.supplyMap` | release war system | 4.0 s with 4 wars | a Dijkstra over all P **for each warring realm, every day** |
| `A.diploMonth` → `A.diploAI(5)`, `A.interest`, `A.threatsTo`, `A.aiWarCheck` | release; 55-bonds; 68-casus-belli | 3.5 s | `threatsTo` reads neighbours of neighbours; `interest` is pairwise |
| `RI.voices`, `RI.session`, `RI.topHouses`; `NB.year`; `WC.canonNear` | 56-realm-inside; 64-npc-beliefs; 57-world-chronicle | 0.5–2 s each | O(R·H) and O(R²) yearly passes |

Also measured:

- **42 `A.onMonth` hooks** and 8 `A.onDay` hooks are registered on the full build.
- `MAP.overlay` and `buildGeo` grow with the number of grid cells, not with provinces. An Asia-sized grid of about
  1.05 M cells would cost about **130–220 ms per border change**, and about 0.5 s of geometry once per session.

### 2.4 Three exact rewrites, measured

These were tried in the page as an experiment. They are in Appendix A, and they are not committed.

1. **`A.claimsOn`** loops over `r.claims` (a handful of keys) instead of every province. It gives the same result in
   the same order, because integer keys iterate in ascending order.
2. **`A.neighbors`** is memoised per `A.absDay()` and returns a copy.
3. **`A.realmHouses`** is memoised per `A.absDay()` and returns a copy.

**Result.** At 1×, seed 1234, three years in, the state hash and the random state are **identical with and without
the rewrites** (hash 1609196039, rng 1925069167, 2,180,835 bytes). The 10× year turn falls from **16.8 s to 3.25 s**.

The rewrites have a cost. The per-day memos (2 and 3) are only safe if no province or house changes hands inside a
day without the memo being dropped. Section 4, stage 0, covers how to make that guarantee.

---

## 3. How realms, cultures, faiths, beasts and the lore hang on provinces

**Realms.**

- A province holds `owner` (and `orig`, `occ`). A realm holds `capitalProv`: the first province of type
  `capital city` it owns, or else its most populous one.
- `LORE.realms[id]` has 38 fields: `name`, `short`, `title`, `type`, `race`, `capId`, `capital`, `area`, `color`,
  `gov`, `ruler` (a cast id), `pop` and `pops` by race, `army`, `levy`, `comp`, `income`, `debts`, `exports`,
  `imports`, `allies`, `rivals`, `stability`, `coin`, `primer` and others.
- `A.initWorld` turns those into `S.realms[id]`: treasury = income × 0.35, stability from `A.STAB`, army quality,
  the relation matrix, and the ruler from the cast or from `A.genNoble`. Then it calls `A.buildRoyalFamily`.
- `A.createRealm(o)` makes a realm at run time. The id defaults to `NEW-n`, and it adds a relation entry to every
  realm.
- `A.updateRealmPops` recounts `provCount` and `provPop`, and scales `pop` and `income` by the provinces held.

**Culture and faith belong to realms and people, not provinces.**

- `A.cultureFor(race, realm)` reads `GD.RACE_CULTURE`, then `GD.REALM_CULTURE`, then `GD.REALM_HUMAN_CULTURE`.
- `A.faithFor(race, realm)` reads `GD.RACE_FAITH`, then `GD.REALM_FAITH`.
- A person carries their own `cult` and `faith`.
- A conquered province carries nothing. Its people's culture is whatever the people carry.

**Houses and families.**

- `S.houses` is 800 records: `LORE.houses` (180, with `realm`, `kind`, `seat`, `seatId` = a province's `pid`, `head`
  = a cast id) plus `LORE.families` (620, from `A.initFamilies`, with a `liege` house and a `seat` name).
- `A.newGame` puts a noble's home at the house's seat (`S.prov.find(p => p.pid === h.seatId)`).
- `A.packState` already diff-packs houses against their templates in saves.

**Cast, styles, schools.**

- Each cast member has a `realm`.
- Each style has a `realm`, a `house` and a `school`. Schools have `realm` and `place` (a name).
- Academies are keyed by realm, with `seat` names.

**Canon regions.** The 61 region codes (`W-01..19`, `E-01..16`, `S-01..13`, `X-01..11`) are **not in the game
data**. They appear only in 76's table.

**The lore blob.** `ardan-lore` is unpacked last at boot (core, then title, then content, then lore). It fills
`LORE.cast`, `LORE.families`, `LORE.houseDeep`, `LORE.styles` and `LORE.academies`. All of these are keyed by the
ids above (`CHR-`, `FX..-`, `FAM-`, `ST..-`, `POL-`).

**43-varied-worlds does not create realms.** On a menu game (`o.world: 'varied'`) it varies an existing world. It
wraps `A.newGame` and `A.initWorld`, then:

- scales each treasury by 0.6–1.4 and moves stability by up to ±15;
- moves 2 to 4 border provinces by an old war, and the loser keeps the claim;
- breaks up to 3 alliances;
- starts up to 2 feuds.

**70-fresh-realms creates them.** On the same guard it does the following:

- **Split.** It splits 1 to 3 realms of 8 provinces or more. Each loses a contiguous block of 2 to 4 provinces far
  from its capital (`FR.block`, which checks the rest stays in one piece with `FR.pieces`).
- **Make the realm.** The block becomes a duchy, a march, a league or a prince's holding, named in its people's style
  (`FR.style`, `GD.NAMING`, 54's council word).
- **House.** It is given the strongest house seated in its provinces, or a new one.
- **Share out.** It takes its share of the parent's army, treasury and income.
- **Register.** It is registered in the realm tables by **`FR.register`**, which runs again on every load through a
  wrapper of `A.migrate`. This is the pattern any new realm must follow.
- **Limits.** It makes no provinces, and it cannot be a birthplace.

**76-beast-habitats** wraps `A.beastsNear(pc)`. In the release, a beast was near wherever its terrain word matched,
so the Tiger of Ranpur was near 244 of 306 provinces. Now:

- `BH.RANGE` gives each of the 25 game beasts its canon regions, from the bestiary.
- `BH.REGION` gives each of the 61 region codes its province **names**, from the gazetteer.
- `BH.NARROW` narrows one qualifier by hand.
- `BH.resolve` builds the tables once from `LORE.map.provinces` (the map as written, never the live state). A beast
  is near where the home province's region is in its range. Inside the range the terrain word still narrows it,
  unless no province of that region fits.

  Among the stat block's fields (`{str, spd, ins, sta, hp, dmg, pierce, prot, fame, terr[], verb, where}`), `terr`
  is the terrain word, and `where` is prose for the text.
- **A new province or beast without a table entry keeps the release's terrain-only rule.** So on a new continent
  every beast whose terrain word matches would show up everywhere until the tables or a `region` field cover it.

---

## 4. The plan: a much larger world from feature folders

### 4.1 What "Asia-sized" and "tenfold" can mean

- **Land.** Today's land is 22.9 M km². A new continent of 30 to 40 M km² takes the total to 53 to 63 M km²: more than
  Asia, and the new land alone nearly Asia-sized.
- **Box.** Keep today's world at x 0–7,000 km and y 0–4,500 km, so **no stored coordinate moves**. Grow the box to
  about 15,000 × 7,000 km, east and south.

  The canon leaves room for this:
  - "Beyond the edges lie lands known only from rumor";
  - the Eastern Gulf and Southern Ocean are "beyond the map";
  - three great rivers flow "south, off the map";
  - "nobody has crossed" the Western Ocean.

  Which edge opens is the owner's call.
- **Provinces.** Ten times the provinces at today's density would need 229 M km², more land than Earth has. So the
  new land should be **denser**: about 25–35 thousand km² a province, against today's 75 thousand. That gives 1,000
  to 1,400 provinces on the new continent, and about **1,300 to 1,700 in all (4–5×)**.
  - About 3,000 in all (10×) is possible only after stage 0 below.
  - It also needs either very small provinces, or the old world split up from the gazetteer's 1,000 or so
    settlements (stage 5).
- **Everything else, tenfold:**

  | Thing | Today | Target |
  | --- | ---: | --- |
  | Realms | 35 | 150–250 |
  | Cultures | 24 | 80–120 |
  | Faiths | 19 | 50–80 |
  | Beasts | 25 | 150–250 |
  | Fighting styles | 265 | 1,000+ |
  | Troop types | 34 | 80+ |
  | Houses | 800 | 3,000+ |
  | Events tied to a place | 848 | about 3,000 |

  Most of this has to be **generated from grammars and templates**, with a hand-written (or canon) anchor for each
  culture, faith and region. Nobody writes 600 primers by hand.

### 4.2 The approach

1. **Additive ids.**
   - Province ids continue from 306.
   - Realms continue from `POL-35`, cultures from `CUL-25`, faiths from `REL-20`, beasts from `CRE-65`.
   - New houses take `FAM-…` ids, new styles `ST…` ids, and new places `PLC-9xxx`.
   - New canon region codes take a new letter, for example `F-01…`.
   - No existing id, name or index changes. Every lookup by id or name, 76's tables, the house seats, the events and
     the tests stay valid.
2. **Data generated at build time and checked in.**
   - A generator in the feature folder writes a `*.data.core.js`. It is Node with its own seeded PRNG, the way 72's
     `lab.mjs` and 70's `classify.mjs` sit beside their features.
   - So the continent is the same in every game: it can be canon, written about, linted and tested. The varied and
     fresh layers (43, 70) still change its politics each run.
   - The JS generator is a smaller version of `generate_map.py`'s pipeline. Python with scipy and numba cannot be a
     build dependency.
3. **Opt-in per game, like 43 and 70.**
   - The world is extended in a wrapper of `A.initWorld`, only when `o.world` asks for it (say `o.lands: ['far']`, or
     `o.world: 'greater'`).
   - Games started by code stay as written, so `tests/`, the feature tests and `bench/balance.mjs` are untouched until
     the switch is deliberately made the default.
4. **Level of detail in the simulation.**
   - The continent the player lives on, and every realm in contact with it (at war, allied, trading, or within N hops),
     runs in full.
   - A far continent runs on a coarse tick: politics, wars and markets settled yearly or quarterly in the abstract,
     without divisions or supply maps.
   - When contact is made, the full sim takes over.
   - This keeps the month close to today's cost for nearly every life, whatever the size of the world.

### 4.3 Stages

Folder numbers are left as `NN`: take the next free numbers when the work starts (`features/90-fold/` is already taken). Stage 0 must build before the other stages, since they rely on its indexes.

**Stage 0. Make the engine scale. No visible change.** Folder: `features/NN-world-scale/`.

The bar is identical state: three or more seeds, five years each, give the same `A.S` hash with the feature on and
`A.SCALE.OFF = true`.

- **Exact rewrites.** `A.claimsOn` loops over claims (measured above). `A.realmProvs` reads an owner index.
- **Indexes kept fresh by version.**
  - `A.provsOf(rid)`, the neighbour sets and `realmHouses` are rebuilt when a cheap version changes.
  - The version is bumped by wrappers of the functions that move land or houses, found by grepping for `.owner=`.
    There are about 41 assignment sites, inside `A.realmGone`, peace and annex code, `A.createRealm`, 43's
    `W.vary` and 70's `FR.make`.
  - A debug "shadow" mode recomputes every memoised answer and throws on a mismatch. A soak test runs with it on.
- **Pairwise loops cut to the pairs that matter.**
  - In `politicsYear`, only pairs that touch (neighbours, neighbours of neighbours, allies, rivals, trade partners,
    claimants) get the full `aiPullParts`. Other pairs drift toward 0 at the release's 3% a year, all at once. This
    stage changes the stream, so it needs its own test of the bands.
  - 45-economy's caravans look only at the k nearest markets, or the same trade zone, from `E.roads` once a year.
  - 66's routes are cached by year.
- **War supply by theatre.** Each warring realm's `A.supplyMap` covers only provinces within N hops of the war's
  provinces, not all P.
- **A sparse relation matrix.** `packState` drops the zero entries of `r.rel`, and `A.createRealm` stops writing 0 for
  every realm. Reads already default to 0 (`A.relBetween`).
- **Benchmark.** `features/NN-world-scale/bench.mjs` holds Appendix A's clone harness (K = 1, 5, 10). It prints the
  month median and p90, the year-turn month, `A.newGame` time and state size.
- **Budget to reach:**

  | World | Month median | Year-turn month | `A.newGame` |
  | --- | --- | --- | --- |
  | 1× | today's or better | – | – |
  | 5× | ≤ 120 ms | ≤ 800 ms | – |
  | 10× | ≤ 250 ms | ≤ 1.5 s | ≤ 2 s |

  LOD (stage 2) should bring the 10× month near the 1× month.

**Stage 1. A size-agnostic map frame. No new land yet; renders identical at 1×.** Folder:
`features/NN-world-frame/`.

- **Patches** that replace `7e3` and `4500` with `MAP.KW` and `MAP.KH` in `MAP.toCanvas`, `UI.gmFit`, `UI.gmDraw`,
  `UI.gmAttach`, `UI.wrView`, `UI.wrClamp`, `UI.wrClampView`, `UI.drawWarBasic` and `UI.wrProvAt`. That is about 25
  literals in 9 functions; each patch's `why` says "world size from MAP".
- **`MAP.init` builds the grid from parts.** It takes the base RLE plus the RLE of each extension, on a larger
  `gw × gh`. The parts are picked from `S.world.parts`, so an old save rebuilds the old grid. The inked map rebuilds its
  geometry by itself when `MAP.grid` changes (`geo.grid === grid`).
- **62's constants** read `MAP.KW` and `MAP.KH`, and its edge key is widened past 4,096. That is a small change in
  62's folder, agreed with its owner. Province-pair keys move to `a*65536+b` or a string.
- **The overlay updates only what changed.** `MAP.overlay` rebuilds only the bounding boxes of provinces whose owner
  or occupier changed. 62's tiles are flushed by box, not all at once.
- **Views for a wide world.**
  - The World tab and the title strip show the player's continent by default, with a "whole world" toggle.
  - The full map and the war room keep their zoom and pan, with their clamps taken from `MAP.KW`.
  - The canvases' 14:9 shape becomes the view's shape, not the world's.
- **Province hover** checks `A.prov(pid)` before reading it, so a grid cell beyond the save's provinces is ignored.
- **The bar.** At 1×, pixel hashes are identical before and after for the 7 views 62 tests.

**Stage 2. The far lands as data, opt-in.** Folder: `features/NN-far-lands/`.

- **`gen.mjs`**, run by hand, writes `farlands.data.core.js` and prints a report. It works in nine steps:
  1. Seeded noise and plates make a heightmap for the extension box.
  2. A sea level is set, to a land target of 30 to 40 M km².
  3. Temperature comes from latitude; rain comes from prevailing winds with rain shadows.
  4. Biomes come from those, and then the 8 game terrain words.
  5. Seeds are placed by Poisson disc, weighted by how well people can live there.
  6. Provinces grow from the seeds by a flood fill whose cost follows ridges and rivers. Tiny ones are merged.
  7. Adjacency comes from shared cell edges. Straits under about 60 km count as `adj`; sea lanes go in `sea`.
  8. Realms grow from capital seeds with sizes drawn from a power law (the existing world runs from 1 to 22
     provinces), stopping at natural barriers.
  9. Cultures follow climate zones and peoples, and faiths follow families of cultures. Names come from a syllable
     grammar per culture.

  It also writes the extension's RLE, and each province carries `region` (an `F-xx` code).
- **What `farlands.data.core.js` defines:**
  - provinces with the same fields as `LORE.map.provinces`, plus `region`;
  - realm records with the fields `A.initWorld` reads;
  - cultures shaped like `LORE.cultures`, with `m`, `f`, `house` and `epi` name lists, and a `GD.NAMING` rule;
  - faiths shaped like `LORE.faiths`;
  - houses shaped like `LORE.houses`, with no cast heads;
  - a `relations` list;
  - region codes.
- **`farlands.core.js`.** Its wrapper of `A.initWorld` runs when `o.lands` includes `'far'`. It then:
  - appends to `S.prov` (ids 306 and up) and builds `S.realms` the way `A.initWorld` does;
  - generates rulers with `A.genNoble` and `A.makeRuler`, then `A.buildRoyalFamily`;
  - registers the realm tables in a `register` that `A.migrate` reruns on load, like 70's `FR.register`;
  - wraps `GD.RACE_CULTURE` so a new elven, orc or dwarven realm gets its own culture;
  - sets `S.world = { v: 1, parts: ['ardan', 'far@1'] }`;
  - adds the LOD tick for the continent the player is not on.
- **Creation screen.** A "World: Known world / Greater world" choice, and a realm list read from `S.realms` and the
  extension, not from `Object.keys(LORE.realms)`. That is a patch on the 5 reads.
- **76's tables.** The far beasts carry `range: ['F-03', …]` and the far provinces carry `region`. 76's `resolve` reads
  them when present: a small change, agreed with 76, or a second wrapper in this folder.
- **Tests** (`test.mjs`):
  - the data: `adj` symmetric, the map connected through `adj` and `sea`, every realm contiguous and holding its
    capital, names unique and free of `<`, `>` and `"`, and the generator reproducing the checked-in file byte for byte;
  - the world as written is untouched: the same state hash as without the feature when the option is off;
  - every tab renders on the far continent, and rendering is pure (`renderRng`);
  - save and load in both directions, and an old save loads as the known world;
  - the stage 0 budget, with the far lands on.

**Stage 3. Content for the far lands.** One folder per kind, so several agents can work at once:
`NN-far-peoples` (cultures, voices, bibles), `NN-far-faiths`, `NN-far-beasts`, `NN-far-arms` (styles, troops,
doctrines) and `NN-far-events`.

- **Beasts.**
  - Add stat blocks to `A.BEASTS`, entries in `LORE.creatures`, `GD.BEAST_TIER` and `GD.BEAST_DUEL`, and the fight
    tables 48-fight-ladder reads.
  - Each beast carries a `range`.
- **Fighting styles.** Each needs:
  - a `LORE.styles` record (`id, kind, house, name, prof, weapons, origin, philosophy, strengths, weakness, school,
    ranks, techniques, maneuver, realm`);
  - new troop types in `GD.TROOPS`, `GD.TROOP_SKILL` and `GD.TROOP_GEAR`, and doctrines in `GD.DOCTRINE`.
- **Events.** A new helper `C.land(p, 'far')`, or `C.region(p, 'F-03')`, keeps events readable. It must be added to
  `A.CX_RX` and to the linter's list of helpers. Events can also gate on the new realms with `C.realm(p, 'POL-41')`.
  About 3,900 events (4,794 less the 848 tied to a realm, some of the rest gated by culture or faith) already work anywhere.
- **The bar** is the existing linters (`lint-events`, `lint-choices`), plus a canon check: no beast or style outside
  its region, as 76 does now.

**Stage 4. Make it the default for menu games.**

- Re-baseline `bench/targets.mjs`, with a reason written in the file.
- Add a `perf` scale case to `bench/run.mjs` and a rubric line ("year turn on the greater world ≤ 1.5 s").
- Keep games started by code as written.

**Stage 5, optional. A denser old world.**

- Splitting today's provinces using the canon gazetteer (about 1,000 settlements) changes every province id, so it
  breaks 76's tables, the house seats, the events that name provinces, 43 and 70, and old saves. **Not
  recommended.**
- Instead, give each province named **places** (villages, mines, shrines, lairs) as flavour points for events, travel
  and beast lairs. They are not nodes in the simulation. That is "tenfold detail" without touching the province graph.

### 4.4 Save compatibility

- **Old saves** have no `S.world`. They load as the known world: `MAP.init` builds only the base grid, and the
  creation and map code ignore the extension.
  - An "open the far lands" action could later append the continent to an old save. It would use a sub-stream of the
    random numbers seeded from `S.seed`, saving and restoring `A.rngState` around it, so the save's own stream is not
    disturbed.
- **New fields are optional:** `S.world`, `p.region`, `r.lod` and the like. Old saves must load without them.
- **Data versions are frozen once shipped.** `S.world.parts` names an exact data version (`far@1`). The build keeps
  every shipped version, or a save of a version that is gone refuses to load with a clear message. It must not
  silently draw the wrong grid.
- **Save size.** At 10×, the state at start is 8.3 MB of JSON, against 1.4 MB at 1×. The static fields of `S.prov`
  (name, x, y, adj, cells, terr, biome, elev, coast, type, pid) are 102 KB at 1× and about 1 MB at 10×. `A.packState`
  should diff `S.prov` against the world data, the way it already diffs houses. The relation matrix should drop its
  zeros.
- **Strings.** `SAVES.clean` strips `<`, `>` and `"` from loaded non-prose strings, so the generator must never emit
  them.

### 4.5 What would break if the bigger world were simply the default

All of the following stays green under the opt-in approach. It applies only when the default changes, or to tests
that turn the option on.

- **Every test and bench run on a fixed seed moves.** More realms means more `A.rand` draws inside `A.initWorld`
  (`genNoble`, `makeRuler`, `buildRoyalFamily`), and every life's random stream shifts with them. Those that hold
  pooled numbers or a lucky seed include:
  - 43's `variedWorldPlays`, already fragile on seed 423;
  - 47's "two customs met" count;
  - 55-bonds' pooled grudges;
  - 64-npc-beliefs;
  - 70's classifier;
  - `bench/balance.mjs`, whose 6 paths start in `POL-05`, `POL-01`, `POL-03`, `POL-04` and `POL-02`;
  - the scorecard's measured numbers in `bench/run.mjs`.
- **Tests that count the world:**
  - 76-beast-habitats: `provinces === 306`, `places === 306`, 25 beasts;
  - 43: 3 to 6 provinces moved, and between 2 and 6 of the 40 alliances broken;
  - 70: 35 to 37 realms, 1 to 3 fresh realms a world;
  - 62: views at `7000 / z`, tile counts, `inkTiming`.
- **Timing bands:**
  - 62's `inkTiming` and the cold geometry time;
  - `bench/run.mjs perf`: `msPerDay` and the war-tick target "p95 ≤ 50 ms" with six wars between neighbours;
  - **CI time.** `tests/run.mjs` already takes about 80 minutes over three shards against a 120-minute timeout, so a
    sim 5× slower overruns it. This is a second reason to keep tests on the world as written, and to do stage 0 first.
- **`tests/suites/core.test.mjs`** starts lives in fixed realms (`POL-01`, `-03`, `-20`, `-11`, `-05`, `-07`, `-02`).
  It survives additive ids, but its random streams move.

### 4.6 The budget, summed up

| | Today, 1× | 5× now | 5× after stage 0 (target) | 10× now | 10× after stage 0 + LOD (target) |
| --- | --- | --- | --- | --- | --- |
| Month, median | 35–115 ms | 564–713 ms | ≤ 120 ms | 1.1–1.25 s | ≤ 150 ms with LOD (≤ 250 ms without) |
| Year turn | 150–950 ms | 3.7–4.4 s | ≤ 800 ms | 16.8–18.4 s (3.25 s after 3 rewrites) | ≤ 1.5 s |
| `A.newGame` | 0.24–0.49 s | 0.86–1.35 s | ≤ 1.2 s | 1.8–2.6 s | ≤ 2 s |
| State JSON at start | 1.4 MB | 4.2 MB | ≤ 2.5 MB (packed) | 8.3 MB | ≤ 4 MB (packed) |
| Overlay rebuild per border change | 36–65 ms | – | ≤ 20 ms (dirty box) | – | ≤ 20 ms (dirty box) |
| Page weight | 4.26 MB | – | +0.5–1.5 MB of data and generator output | – | – |

---

## 5. First steps, concretely

1. **`features/NN-world-scale/`**:
   - `scale.core.js`: the `A.claimsOn` rewrite; `A.provsOf`, `A.realmProvs`, `A.neighbors` and `A.realmHouses` on
     version-checked indexes, with the version bumped in wrappers of the land-moving functions; `A.SCALE = { OFF,
     SHADOW }`.
   - `bench.mjs`: Appendix A, K = 1, 5, 10.
   - `test.mjs`: `scaleSameState` (3 seeds × 5 years, hash equal with `OFF`), `scaleShadow` (a 20-year soak in shadow
     mode, 0 mismatches) and `scaleBudget` (the 5× clone's year turn ≤ 1.5 s, warn-only on CI).
   - `README.md`.
   - Then, as separate measured steps that change the stream: pairwise pruning in `politicsYear`; k-nearest caravans
     in 45 and route caching in 66, agreed with their owners; supply by theatre.
2. **`features/NN-world-frame/patches.mjs`.** Nine release functions move to `MAP.KW` and `MAP.KH`. `MAP.init` takes
   parts. The overlay updates by dirty box. Plus a short change request to 62 (constants, the 4,096 key) and to 76
   (`p.region` and `beast.range`).
3. **`features/NN-far-lands/gen.mjs`.** Start with geography only (heightmap, terrain, provinces, adjacency, grid RLE)
   and its validator (`validate.mjs`, after 47's). Look at the result in the inked map with a throwaway
   `--only=world-frame,far-lands` build, then add realms, cultures and faiths. Owner input is needed early on which
   edge opens (east across the Eastern Gulf, or south below the Southland) and on how the canon names the far lands.
4. Make the creation screen choice and the LOD tick together, so the greater world is never offered without the LOD
   that keeps it fast.

---

## Appendix A. The clone harness

The experiment harness, in-page, is run before `A.newGame`. A runner such as `tests/run.mjs` loads the page, waits
for `ARDAN_CONTENT_READY`, evaluates `__CLONE(K)`, then `A.newGame(...)`, and times `A.advance` until each 30 days
have passed. The originals sit in `/tmp/ardan/arch/probe/` (`clone.js`, `memo.js`, `harness.mjs`, `sweep.sh`), which
`/tmp` will not keep.

```js
window.__CLONE = function (K) {               // copy the 306-province world K times, laid out eastward
  const base = LORE.map.provinces.slice(), N = base.length, rids = Object.keys(LORE.realms);
  const sfx = c => 'x' + c, rmap = (id, c) => (id && id !== 'unclaimed' && LORE.realms[id]) ? id + sfx(c) : id;
  for (let c = 1; c < K; c++) {
    for (const p of base) LORE.map.provinces.push(Object.assign({}, p, { id: p.id + c * N, pid: p.pid + sfx(c),
      name: p.name + ' ' + (c + 1), realm: rmap(p.realm, c), x: p.x + c * 7000, sx: p.sx + c * 7000,
      adj: p.adj.map(j => j + c * N), sea: (p.sea || []).map(j => j + c * N) }));
    for (const id of rids) {
      const L = LORE.realms[id], nid = id + sfx(c);
      LORE.realms[nid] = Object.assign({}, L, { id: nid, name: L.name + ' ' + (c + 1), short: L.short + ' ' + (c + 1),
        ruler: null, capital: L.capital + ' ' + (c + 1), allies: L.allies.map(a => rmap(a, c)), rivals: L.rivals.map(a => rmap(a, c)) });
      for (const T of [GD.REALM_CULTURE, GD.REALM_FAITH, GD.REALM_HUMAN_CULTURE, A.AGGRO, GD.DOCTRINE, A.GOV,
        LORE.titlesByRealm, LORE.academies, LORE.rulerHistory]) if (T && T[id] != null) T[nid] = T[id];
    }
    for (const hid of Object.keys(LORE.houses)) { const h = LORE.houses[hid]; if (!/x\d+$/.test(hid) && LORE.realms[h.realm])
      LORE.houses[hid + sfx(c)] = Object.assign({}, h, { id: hid + sfx(c), realm: rmap(h.realm, c), head: null,
        seat: h.seat && h.seat + ' ' + (c + 1), seatId: h.seatId && h.seatId + sfx(c) }); }
    for (const x of LORE.relations.slice(0, 97)) LORE.relations.push(Object.assign({}, x, { a: rmap(x.a, c), b: rmap(x.b, c) }));
  }
  const P = LORE.map.provinces;               // stitch copy c to copy c-1 by 4 land links
  for (let c = 1; c < K; c++) {
    const prev = P.slice((c - 1) * N, c * N).sort((a, b) => b.x - a.x).slice(0, 4), cur = P.slice(c * N, (c + 1) * N).sort((a, b) => a.x - b.x).slice(0, 4);
    prev.forEach((p, i) => { p.adj = p.adj.concat([cur[i].id]); cur[i].adj = cur[i].adj.concat([p.id]); });
  }
};
// the three rewrites of 2.4 (the state hash at 1x after 3 years is unchanged with them)
A.claimsOn = (a, b) => { const r = A.realm(a); if (!r || !r.claims) return []; const S = A.S, out = [];
  for (const k in r.claims) { const p = S.prov[k]; if (p && p.owner === b && S.year - r.claims[k] < 60) out.push(p); } return out; };
// A.neighbors and A.realmHouses: memoised per A.absDay(), returning copies (needs version-checked invalidation, see stage 0)
```
