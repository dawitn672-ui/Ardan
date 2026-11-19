# M1: where the world describes itself (the lore pass's inventory)

Order 71 (D-151), with order 72's change of course (D-152): the continent is designed on purpose (`docs/design/m1/map-design.md`,
branch `work/m1-design`) and built in code. Then everything the world says about its ground, seas, compass, neighbours and
towns is brought into line with it. This page lists every such place in the code and data: the files for the lore pass, what
each one holds, and what the lore asks of the map today.

The counts come from `tools/lint-lore-map.mjs`, run against the facts of the map in play: `m1-02`, map version 3
(`data/map/one-continent.json`). That map has no Middle Sea, so many claims fail on it. The counts measure the lore pass's
work. They are not yet a verdict on the designed map. Run `node tools/lint-lore-map.mjs --list` for every claim, with its file,
place and sentence. Run `--json=` for the data, and `--inventory=` for the file table below.

## How the words are read

**The facts.** `A.V2MAP.factsOf(w)` (`src/map/99991-v2-map/f-facts.core.js`) reads any built map. For each realm (its heartland
as the release wrote it) it gives:
- the capital: its site, and whether it is on the coast, a river, a stream or a lake;
- its place on the compass: its land's centre against the continent's, as u and v, and the words that earns;
- its provinces, and how many are coastal;
- the seas and lakes it touches;
- its terrain mix and its share of high ground;
- the named rivers through it, and the ranges and forests named on it;
- its neighbours by land, and its towns.

For the whole map it gives the waters (the open sea by D9's named sectors, and each enclosed lake or inland sea), and every
named river (with the realms it crosses and the water it reaches), range, forest and pass. `tools/m1/facts.mjs <built.html>`
writes these to `data/map/one-continent.json`, for any map (`--map=`, `--v=`). The test `m1OneContinent` checks that the file
is the built map's own.

**The claims** (`tools/lib/lore-map.mjs`, with unit tests in `tests/v2/lore-map.test.js`). A sentence makes a claim about a
realm when it names the realm, or when it is the realm's own text, and says one of these:
- it is on the coast;
- it is on a named water;
- it is high, open grass, dry, wooded or lake country;
- it is a river land;
- it lies north, south, east or west;
- it lies beside a named neighbour.

A realm's own text is any of these:
- its Codex entry;
- its titles;
- a house or family of it;
- an object keyed by its id in code (its customs, its academies);
- an event whose condition asks for that one realm.

Possessives give a word to the realm that owns it ("the hold beside Aldmark's plains"). The way a road runs ("sends its
pepper north") is not a claim. A bay, harbour or lake too small for the map passes when the realm has that kind of water. A
named sea, channel, strait or gulf must be on the map.

**The baseline.** `tests/lore-map-baseline.json` holds the number of claims the map denies. That number may only fall, and
`tools/check.mjs` runs the lint. It stands at today's count so that the branch stays green. **M1 ends at 0**: the designed
map and the lore pass together must bring it there.

## What the lore asks of the map today

### Named waters the lore uses that the map does not have
Each water is listed with the realms whose texts put themselves on it:
- **Middle Sea**: Lucerna, Tamar, Corvasse, Greyhaven, Varenna, Ostra, Ughrak.
- **Grey Channel**: Greyhaven, Velgrad, Ulun, Morhaven, Tessaria.
- **Strait of Hael**: Corvasse, Varenna, Lucerna, Eldergrove.
- **Eastern Gulf**: Ambrel, Tessaria, Kesh, Ranpur.
- **Salt Sea**: Gorath, Ulun.
- **Gulf of Sands**: Sabra, Sahrim.
- **Grass Sea**: Gorath, Ughrak. This is the steppe's own name, a metaphor.
- **Spice Sea**: Kesh, Ambrel.
- **Tibata Strait**: Varenna.
- **Smaller waters:** Oskan Bay (Ulun, Morhaven), Whale Sound (Drevna), Cold Bay (Irondeep, through its neighbour Aldmark's
  fleet), Bay of Lanterns (Solenne), Volan Channel (Velgrad), At Lake (Tamar, Velgrad).

Waters counted elsewhere in the code and data:

| Water | Mentions |
| --- | --- |
| Middle Sea | 38 in 11 files |
| Grey Channel | 28 in 10 |
| Strait of Hael | 28 in 12 |
| Salt Sea | 28 in 9 |
| Cold Bay | 41 in 14 |
| Eastern Gulf | 8 in 3 |
| Grass Sea | 18 in 5 |

### Regions and named lands
The lint does not read these yet. The design should place them, and the lint will take them as realms' or regions' names once
the design names them:

| Name | Mentions | What the lore says it is |
| --- | --- | --- |
| Westland | 8 in 5 files | Aldmark's land |
| Eastland | 5 in 4 | Velgrad's land |
| Southland | 21 in 9 | |
| Sunlands | 32 in 9 | Solenne, Lucerna, the Neck: the Solenfolk's home |
| the Neck | 159 in 16 | Tessaria, "the only land road between the Southland and the Eastland" |
| Lakeland | 50 in 10 | Drevna |
| Red Waste | 21 in 10 | Sahrim |
| Golden Plains | 9 in 6 | Zanara |
| Roof of the World | 3 in 2 | Skyhold |
| Evenwood | 49 in 18 | Sylvaran |
| Sunrise Isles | 3 in 2 | the title's pitch, 86-title-screen-in-view |
| Known World | 52 in 22 | |

Rivers the lore names, which the map's rivers (named from C7's place pools by D9) do not carry:
- **Monuti**: 57 mentions in 14 files. Tamar's flood, rising in Abara.
- **Millrun**: 32 in 7. Aldmark's horses.
- **Gordush**: the border river of Aldmark and Gorath.
- **Mosawa**: Zanara.
- **Hazir**: Zanara.

The design should name the great rivers from the lore, and D9's names should take them first.

### Claims the map denies, by realm (today's map, `m1-02` v3)

| Realm | Denied | Kinds |
| --- | ---: | --- |
| Aldmark (POL-01) | 12 | plains 11, compass 1 |
| Solenne (POL-02) | 32 | coast 30, desert 1, sea 1 |
| Varenna (POL-03) | 22 | sea 11, lake 11 |
| Lucerna (POL-04) | 118 | coast 107, sea 10, river 1 |
| Ashmere (POL-05) | 3 | compass 2, mountain 1 |
| Sylvaran (POL-06) | 10 | lake 8, border 1, mountain 1 |
| Eldergrove (POL-07) | 8 | sea 6, lake 2 |
| Northreach (POL-08) | 16 | forest 9, mountain 4, lake 2, plains 1 |
| Frostholm (POL-09) | 4 | compass 4 |
| Irondeep (POL-10) | 11 | river 5, coast 3, border 1, sea 1, forest 1 |
| Gorath (POL-11) | 40 | coast 20, lake 10, sea 8, compass 1, border 1 |
| Ulun (POL-12) | 57 | coast 46, sea 11 |
| Brannoch (POL-13) | 8 | coast 4, lake 3, plains 1 |
| Greyhaven (POL-14) | 12 | sea 9, lake 2, desert 1 |
| Morhaven (POL-15) | 138 | coast 77, plains 58, sea 2, forest 1 |
| Ostra (POL-16) | 76 | coast 73, sea 3 |
| Qadir (POL-17) | 93 | coast 93 |
| Tamar (POL-18) | 57 | coast 43, lake 7, sea 4, border 2, compass of 1 |
| Sahrim (POL-19) | 1 | sea 1 |
| Zanara (POL-20) | 27 | river 24, coast 2, lake 1 |
| Kesh (POL-21) | 3 | sea 2, border 1 |
| Abara (POL-22) | 15 | mountain 13, compass 2 |
| Hrimfell (POL-23) | 10 | lake 8, compass 2 |
| Sabra (POL-24) | 117 | coast 115, sea 1, compass 1 |
| Velgrad (POL-25) | 90 | coast 46, lake 34, sea 10 |
| Drevna (POL-26) | 215 | lake 122, coast 64, forest 20, compass 5, sea 4 |
| Skyhold (POL-27) | 10 | lake 9, river 1 |
| Stonehold (POL-28) | 2 | coast 2 |
| Emberdeep (POL-29) | 0 | none |
| Ranpur (POL-30) | 15 | forest 11, mountain 2, lake 1, sea 1 |
| Tessaria (POL-31) | 29 | coast 20, lake 6, sea 2, forest 1 |
| Ambrel (POL-32) | 19 | forest 16, sea 2, river 1 |
| Corvasse (POL-33) | 17 | sea 10, compass 2, river 2, forest 2, mountain 1 |
| Ughrak (POL-34) | 16 | forest 6, border 4, lake 2, sea 2, coast 1, compass 1 |

Read with the design, this table says what the map must give each realm:
- **On a sea:** Lucerna, Sabra, Qadir, Ostra, Ulun, Morhaven, Tamar, Solenne, Velgrad, Tessaria and Gorath. Gorath's sea is the
  Salt Sea.
- **Lakes:** Drevna. Velgrad holds its share of the Lakeland and At Lake.
- **Open plains:** Aldmark and Morhaven ("the steppe edge").
- **High ground:** Abara.
- **A great river:** Zanara.
- **Wood:** Ambrel, Ranpur and Northreach.
- **The compass:** Frostholm far north and Gorath south.

### The texts, by file
`claims` is every claim the lint read in the file, and `denied` is how many of them the map in play denies. The table comes
from `node tools/lint-lore-map.mjs --inventory=out.md`.

| File | Claims | Denied by the map | Kinds |
| --- | ---: | ---: | --- |
| `src/core/release/lore/02-families.json` | 1645 | 653 | coast 910, river 188, forest 177, lake 114, plains 82, sea 53, compass 42, mountain 31, named river 23, desert 18, border 6, compass of 1 |
| `src/core/release/core/00-lore.json` | 414 | 173 | coast 242, lake 27, plains 25, river 23, sea 22, mountain 20, desert 18, compass 17, forest 13, border 6, compass of 1 |
| `src/core/release/lore/04-styles.json` | 285 | 124 | coast 125, plains 36, forest 32, lake 32, river 29, mountain 12, sea 6, desert 6, compass 4, named river 3 |
| `src/core/release/lore/01-cast.json` | 180 | 69 | coast 105, river 28, plains 12, sea 12, forest 7, lake 7, mountain 5, desert 3, named river 1 |
| `src/core/release/lore/03-houseDeep.json` | 173 | 83 | coast 89, lake 28, river 20, sea 11, mountain 9, plains 5, named river 4, forest 3, compass 2, border 1, desert 1 |
| `src/core/release/lore/05-academies.json` | 88 | 46 | coast 53, river 11, sea 10, lake 6, plains 4, forest 1, named river 1, desert 1, compass 1 |
| `src/core/release/content/06-rl.js` | 46 | 19 | coast 22, plains 6, river 5, sea 4, forest 3, lake 3, mountain 2, desert 1 |
| `src/core/release/content/18-cm.js` | 36 | 21 | coast 17, sea 7, forest 3, plains 3, river 2, desert 2, mountain 1, compass 1 |
| `src/core/release/content/14-pp.js` | 35 | 0 | forest 16, coast 10, river 5, plains 3, sea 1 |
| `src/events/40-memory-regional-a/regional-a.events.js` | 30 | 11 | coast 25, river 5 |
| `src/events/40-memory-realm-blood/realm-blood.events.js` | 28 | 10 | coast 16, river 5, border 3, sea 2, plains 2 |
| `src/core/release/content/12-ww.js` | 26 | 13 | coast 15, forest 3, plains 3, lake 3, sea 2 |
| `src/core/release/content/16-av.js` | 25 | 6 | coast 11, river 6, plains 3, forest 3, sea 2 |
| `src/world/47-realm-customs/bible.d.data.core.js` | 25 | 10 | coast 20, desert 2, sea 1, river 1, mountain 1 |
| `src/world/47-realm-customs/bible.b.data.core.js` | 22 | 11 | coast 15, lake 5, sea 2 |
| `src/events/40-memory-peoples/peoples.events.js` | 21 | 0 | coast 12, forest 3, river 3, sea 3 |
| `src/world/47-realm-customs/bible.c.data.core.js` | 18 | 12 | coast 11, sea 4, plains 2, forest 1 |
| `src/events/40-memory-regional-b/regional-b.events.js` | 17 | 14 | coast 17 |
| `src/core/release/content/13-ss.js` | 14 | 3 | coast 7, plains 6, river 1 |
| `src/core/release/content/15-lf.js` | 7 | 0 | river 4, forest 2, named river 1 |
| `src/core/release/content/20-sc.js` | 7 | 5 | coast 5, river 2 |
| `src/core/release/content/11-hs.js` | 6 | 0 | coast 4, plains 2 |
| `src/core/release/content/19-ln.js` | 6 | 4 | coast 2, forest 1, lake 1, desert 1, river 1 |
| `src/events/40-memory-practice/practice.events.js` | 6 | 0 | coast 6 |
| `src/core/release/content/03-wk.js` | 5 | 2 | coast 2, river 1, plains 1, sea 1 |
| `src/world/47-realm-customs/bible.e.data.core.js` | 5 | 3 | coast 2, river 2, sea 1 |
| `src/core/release/core/18-event-view-a.js` | 4 | 3 | coast 3, plains 1 |
| `src/diplomacy/68-reasons-for-war/casus.core.js` | 4 | 3 | sea 2, plains 1, coast 1 |
| `src/core/release/content/08-ct.js` | 3 | 2 | lake 2, coast 1 |
| `src/events/40-memory-adventure-trade/adventure-trade.events.js` | 2 | 1 | sea 1, coast 1 |
| `src/events/40-memory-childhood/childhood.events.js` | 2 | 0 | coast 2 |
| `src/core/release/core/02-game-data-a.js` | 1 | 0 | coast 1 |
| `src/core/release/core/06-prison-travel-school-ai.js` | 1 | 0 | coast 1 |
| `src/core/release/content/01-ruler.js` | 1 | 0 | forest 1 |
| `src/core/release/content/09-pf.js` | 1 | 1 | coast 1 |
| `src/core/release/content/10-rk.js` | 1 | 1 | coast 1 |
| `src/core/release/content/17-tr.js` | 1 | 0 | coast 1 |
| `src/events/28-endings/endings.core.js` | 1 | 0 | coast 1 |
| `src/events/29-starting-stories/starts.events.js` | 1 | 0 | river 1 |
| `src/world/47-realm-customs/bible.a.data.core.js` | 1 | 0 | plains 1 |
| `src/ui/73-music-score/modes.core.js` | 1 | 0 | plains 1 |

## Places in the data that hold geography as fields, not as text

These are not read by the lint. Each must be set from the designed map, or checked against it.

| Where | What it holds | For the lore pass |
| --- | --- | --- |
| `src/core/release/core/00-lore.json` `map` | The release's grid and its 306 provinces (`terr`, `biome`, `coast`, `elev`, `sea`, `adj`, `town`, `pop`, `sx`/`sy`) | The map as written. It is kept so old saves rebuild, and `VM.release()` warps it onto a generated map. Names, types and populations stay. The designed map decides the ground. |
| `00-lore.json` `realms[].fleet`, `ships`, `field`, `comp`, `food`, `exports`, `imports`, `area`, `pop` | A realm's fleet (it has a coast), what it grows, and what it trades and with whom | A fleet needs a coast on the map. Exports such as "amber" and "stockfish" and imports "by way of X" name sea and land routes. |
| `00-lore.json` `realms[].primer` (`intro`, `people and land`, `strength`, `ties`) | The Codex's words for each realm | Read by the lint (it is the realm's own text) |
| `00-lore.json` `cultures[].home`, `pols` | Each people's homeland, by region and realm ("The Sunlands, Lucerna, the Neck") | Peoples follow the realms (order 71). `home` names regions. |
| `00-lore.json` `racesLore[].homelands`, `faiths[].followers`, `realms` | Where each race and faith lives | Region words |
| `00-lore.json` `houses[]` `seat`, `holding`, `local`, `notes` | Each great house's seat and lands | Seats are provinces by name. A seat on a lake, coast or river must be one on the map. |
| `00-lore.json` `relations`, `wars`, `chronicle`, `secrets`, `figures`, `rulerHistory` | Alliances, wars and their battle sites, history | A war between realms with no border needs a reason in its own words (the sea, a march) |
| `00-lore.json` `creatures[].habitat` | Each beast's habitat words | `76-beast-habitats` keeps canon regions by province name (`canon/map/gazetteer_major.csv`) |
| `src/core/release/lore/01-cast.json` to `05-academies.json` | People, families, house histories, fighting styles' origins, academies | Read by the lint (a family's realm owns its words) |
| `data/names.json` | C7's name pools, by culture and realm (`lean`) | D9 names rivers, ranges, forests and seas from these pools. Place words should be the right land's. |
| `data/military/branches.json` | Each branch's needs: a ship's company needs a coast (`needs.coast`) | Read from the map (`A.MUSTER.coast`) |
| `data/map/one-continent.json` | The facts | Written by `tools/m1/facts.mjs` |

## Code that hard-codes geography (check it against the designed map)

| Where | What |
| --- | --- |
| `src/map/99991-v2-map/a-world.core.js` | `VM.SEA_ID` (realms kept on the sea by id), `VM.ISLE_RX`, `VM.COAST_RX`, `VM.ARID_REALM` and the oases. The heuristics a map version 4 replaces with the design. |
| `src/map/76-beast-habitats` | Canon regions of each beast by province name, and a terrain waiver per region |
| `src/map/997-wilds` | Each province's wild places, from its terrain |
| `src/map/9991-atlas-of-known-places` | What a life hears of places |
| `src/map/70-fresh-realms-and-tensions` | Breakaways' place words (`fresh.place`) |
| `src/world/47-realm-customs/bible.*.data.core.js` | Each realm's want, fear, place and customs, as texts the lint reads |
| `src/world/999981-names-and-cultures` | Trade partners read from `exports` and `imports` (`N.partners`). Names drawn from neighbours. |
| `src/ui/86-title-screen-in-view/fold.core.js` | The pitch: "from the western sea to the Sunrise Isles" (Far Lands words, not shown in this build) |
| `src/ui/94-woodblock-skies/skies.core.js` | Building styles by region words ("the Twin Rivers, the Sunrise Isles and the Peninsulas; ... the Sand Basins") |
| `src/war/9999955-muster` | A ship's company only where the realm has a coast (`MU.coast`): read from the map |
| `src/economy/45-economy`, `66-markets` | Goods by terrain and harvests (read from the map) |
| `src/events/29-starting-stories`, `28-endings`, `83-obituary-capitals` | Stories and endings that name places |

**Code that reads the map** reads the provinces' `terr`, `coast` and `biome`, and `C.coast`, `C.terr` and `C.town` in events. It
needs no lore change. It will read the designed map, and its tests will show the shift. It is spread across about 45
features; the largest groups are the release's core and content (18 files each), `87-echo-scenes`, the war features
(`9999956-units`, `9999955-muster`, `72-one-battle-two-scales`, `38-orders`, `23-after-action`), and the people and economy
features.

## The lore pass, in order
1. **The realms' own words:** the Codex (`00-lore.json` `realms`, `titlesByRealm`, `cultures`, `racesLore`, `faiths`) and the
   customs bibles (`47-realm-customs`). Then the families and houses (`02-families.json`, `03-houseDeep.json`,
   `00-lore.json` `houses`).
2. **People and styles:** `01-cast.json`, `04-styles.json`, `05-academies.json`.
3. **The release's event packs** (`src/core/release/content/*.js`), each with `tools/release/identity-probe.mjs` before and
   after, each function one minified line. The most work is in `06-rl` (the realms), `18-cm`, `12-ww`, `16-av` and `13-ss`
   (the realm scenes).
4. **The feature packs:** the `40-memory-*` regional, peoples and realm-blood packs, `87-echo-scenes`, `29-starting-stories`
   and `68-reasons-for-war`.
5. **Hard-coded geography** (the table above) and C7's place pools, where a land's place words come from the wrong ground.
6. **Every change** is listed in `docs/design/m1/lore-changes.md`, the old words and the new by file. Then the baseline is
   set to 0.

## What the lint does not read yet
- **Regions:** a realm in "the Westland" or "the Sunlands". The designed map's regions will be added as names the lint
  reads.
- **Towns:** a text that puts a town in the wrong realm, or on the wrong water. The facts list each realm's towns; a check
  of town names against the realm that names them is planned for the lore pass.
- **Distances** ("ten days' ride", "across the strait") and routes (the Horse Road, the Iron Road, the silk road at Kraoth).
- **Texts with no realm in them** outside a realm's own: "you" texts in events that any realm may draw.
