# Beast habitats

**Aspect:** Balance and difficulty (the scorecard's median death age; canon puts it at 55–65 for humans who reach 20) and the plan's Power-scaling bar, "0 lore clashes in events" (`docs/plan/Ardan The Road to Ten.md`) · **Kind:** system (one core file, no patches, no events)

## The bug (in the release)

`A.beastsNear(pc)` decides which named beasts live near a character. It matches only the terrain word of the home province (`B.terr.includes(terr)`), plus two loose cases (steppe also takes plains beasts, plains also takes savanna beasts). It never reads where a beast lives.

So the Tiger of Ranpur (lore: "The Monsoon Coast and Worldspine foothills"; `terr: [forest, plains, hills]`) is near **244 of the 306 provinces**. That is 204 on its three terrain words plus the 40 steppe provinces. A peasant of Aldmark (POL-01, canon region W-12) has 19 named beasts on the local list. Among them are the Tiger of Ranpur, the Roc ("the interior of the Isle of Pearls"), the World Python, the Forest Men and the Old Man of the Trees.

It matters twice:

1. **Lore clash.** A monsoon-coast tiger in a northern empire is what the plan's bar forbids.
2. **It kills young lives.** In 48 bot lives on the full build (seed base 9001), 30 died before 50. Beasts were the first raw killer (13 of 30), and **the Tiger of Ranpur alone killed 7**. None of the 7 began near Ranpur. The deaths were hidden: `A.mortalCheck` relabels a death whose fatal hurt is over 40 days old with a random `A.naturalCause` ("marsh fever"), so cause-of-death strings undercount beasts.

## What it does

`habitats.core.js` wraps `A.beastsNear` and uses the world bible's real ranges, baked in as two small tables:

- **`BH.RANGE`**, from `canon/mythos/bestiary.csv` (`range_regions`). Each game beast's canon range as written, e.g. Tiger of Ranpur `E-13, E-12`. All **25 of 25** game beasts match canon by name, and their ids agree.
- **`BH.REGION`**, from `canon/map/gazetteer_major.csv` (`region`). The canon region of each game province, by name. All **306 of 306** game provinces match by name; the gazetteer's `place_id` is the province's `pid` too. No game province and no game beast is without a match.

**The rule.** A beast is near only where the home province's canon region is in its canon range. Inside the range, the release's terrain word still narrows it. There is one exception. Some regions of a beast's range have no province whose terrain word the release allows for it: the Monuti valley (S-06) is drawn as desert and hills, and Frostholm (W-19) as forest. In such a region the whole region counts, because the canon range is the source of truth and the terrain words are the release's guess. A beast or province without a canon match would keep the release's rule; none exists today.

**One qualifier is narrowed by hand** (`BH.NARROW`). The Sunwall Wyvern's "S-04 (north edge)" is taken as the Red Waste's desert band under the Sunwall's southern face: the eight S-04 provinces with gazetteer `y_km` under 3,700, north of where S-04 turns to savanna. `canon/bible/part11b_atlas_habitats.md` names the wyvern in the Sunwall's southern-face zones and not in the savanna. "southern E-02" (Great Ash Dragon) is the one province of the Free Marches, so it stays whole. "the Crown Range" beside W-08 (Snow Drake) describes W-08 itself, the Crown Highlands.

**Facts kept.**

- The tables are resolved from the map as written (`LORE.map.provinces`), so conquest and the varied worlds of 43 and 70 never move a beast's country.
- The list keeps the release's order, so a pick from it is as stable as before.
- `A.BH.OFF = true` gives the release's list back; the tests use it to compare.
- `A.BH.suits(id, province)` answers the question for one beast, for code that picks beasts on its own.

**No random numbers, no state.** The wrapper draws nothing, and the release's version drew nothing either. It writes nothing to `A.S`; the resolved tables are module data built once from `LORE`. It adds **no fields to people, realms or saves**, so old saves need nothing.

## The 25 beasts

"Release" and "now" count the provinces, of 306, where the beast is near. "Terrain waived in" lists the regions of its range where no province fits its terrain words, so the whole region counts.

| Beast | Canon range (bestiary.csv) | Terrain waived in | Release | Now | Where now |
| --- | --- | --- | ---: | ---: | --- |
| Great Ash Dragon | E-10, E-11, E-12, southern E-02 |  | 146 | 7 | Emberdeep, Maghelm, Gorhall, Morhall, Garbek Gate, The Free Marches, The High Wastes |
| Sunwall Wyvern | S-01, S-04 (north edge) | S-04 (north edge) | 146 | 9 | Zarak, Zabesh Oasis, Janiya, Kafam Caravanserai, Dahur Oasis, Talabad Oasis, Marabad Oasis, Yasib Oasis, Hazifa |
| Amber Wyrm | E-14, E-15, E-16 | E-15, E-16 | 52 | 5 | Amberport, Ruhu, Paamu, The Amber Wilds, The Isle of Pearls |
| Snow Drake | W-08, the Crown Range | W-08 | 20 | 4 | Highcastle, Bearfold, Whitfield, Highwold |
| The Grey Stag | W-01 |  | 45 | 6 | Evenglade, Loriel, Lirthil, Aressa, Rineron, Eriavel |
| Aurochs | W-01, W-02 |  | 118 | 10 | Silverbough, Ithira, Fenandor, Aerdor, Evenglade, Loriel, Lirthil, Aressa, Rineron, Eriavel |
| The Evenwood Wolf | W-01, W-14 |  | 180 | 18 | Evenglade, Fenali, Loriel, Eridor, Vaelion, Calandor, Lirith, Thalandor, Lirthil, Aressa, Aerion, Rineron, Syleron, Mirlas, Elwen, Eriavel, Erilas, The Pinewild |
| Hell Boar | W-10, W-06 |  | 171 | 15 | Varenna, Ardata, Castella, Norona, Casteria, Pertello, Aurora, Ambalia, Taria, Lunium, Tarium, Rocca Pavice, Vitia, Venina, Morhaven |
| Cave Bear | W-15, W-14 |  | 191 | 2 | Irondeep, The Pinewild |
| White Wyrm | E-11, E-12, W-15 | W-15 | 20 | 5 | Emberdeep, Maghelm, Gorhall, Irondeep, Morhall |
| Snow Ape | E-12, E-10 |  | 20 | 4 | Emberdeep, Maghelm, Gorhall, The High Wastes |
| The Thunder Mammoth | W-19 | W-19 | 9 | 2 | Skarfell, Helstad |
| Woolly Rhino | E-08, E-07 | E-07 | 49 | 3 | Grakmar, Roktuk Oasis, The Whale Woods |
| Cave Hyena | W-16, W-17 |  | 73 | 17 | Urgol, Nagdur Stockade, Grakzag Oasis, Skartar Caravanserai, Rushoth Caravanserai, Gorur Caravanserai, Vrakhul Oasis, Kagdush Oasis, Yagrak Caravanserai, Kharsa, Kultau, Bekar, Ozlun, Otbash Yam, Sartobe Yam, Agbay Yam, Altsa Yam |
| Basilisk | S-04, S-01, S-03 |  | 26 | 18 | Zarak, Zabesh Oasis, Janiya, Kafam Caravanserai, Dahur Oasis, Talabad Oasis, Marabad Oasis, Yasib Oasis, Sabra, Daham Tower, Nahur, Basir, Zariya, Ashah, Fort Tabir, Fasun, Nahin, Qarifa |
| Sand Dragon | S-04, S-05 |  | 26 | 9 | Zarak, Zabesh Oasis, Janiya, Kafam Caravanserai, Dahur Oasis, Talabad Oasis, Marabad Oasis, Yasib Oasis, The Burning Waste |
| Great Crocodile | S-06 | S-06 | 80 | 6 | Tamar, Rashira, Talim, Akayn, Khaiyah, Fort Halifa |
| River Horse | S-06, S-07, S-09 | S-06 | 80 | 11 | Tamar, Rashira, Talim, Akayn, Khaiyah, Fort Halifa, Zanara, Seduna Walls, Fort Zuafa, Tetamba, Koyako |
| Green Anaconda | S-12, S-11 |  | 52 | 2 | Monuro, The Deep Green |
| Tiger of Ranpur | E-13, E-12 | E-12 | 244 | 8 | Ranpur, Chanari, Tiravi, Madora, Ekapur, Emberdeep, Maghelm, Gorhall |
| World Python | S-12, E-14, E-13 | E-13 | 45 | 9 | Ranpur, Chanari, Tiravi, Madora, Ekapur, Amberport, Ruhu, Paamu, The Deep Green |
| The Roc | E-16 |  | 171 | 1 | The Isle of Pearls |
| Forest Men | S-12 |  | 45 | 1 | The Deep Green |
| Hael Hounds | W-05 |  | 146 | 1 | The Ashlands |
| Old Man of the Trees | S-12 |  | 45 | 1 | The Deep Green |
**Aldmark now** lists no beast at all: W-12 is in no beast's canon range. In the release it listed 19. **Ranpur** (E-13) lists the Tiger of Ranpur and the World Python in all five of its provinces. **191 provinces** now list no beast (none did in the release). They are the provinces of regions that no game beast's range includes: the Solen heartland, Aldmark, Greyhaven, Velgrad, Drevna, Ashmere, the southern savanna and others.

## Callers (all empty-safe)

`beastsNear` has 1 call in the core and about 25 in the content. Every caller already copes with an empty list:

- The hunt (`startHunt`) checks `near.length` first.
- Scenes that need a beast either check `A.beastsNear(p).length > 0` in `cond` (`av_wild_lair`, `av_wild_village_bounty`, `av_wild_hunt_contract`) or fall back to a fixed beast.
- 26-belief-truth and 48-fight-ladder read `A.BEASTS` only.
- 40-memory-adventure-trade's `beastNear` falls back to `CRE-21`.

The `bhEmptySafe` test runs every scene whose code reads the list in a province with no beast.

**Left for a human (outside this folder):**

- **Fallbacks are still fixed beasts.** When the list is empty, these scenes use a fixed beast:
  - `CRE-21`, the Evenwood Wolf: "something big crosses the road", `wk_hunt_beast`, `av_wild_lair` and `av_wild_village_bounty` (when no beast is under their size cap), and 40's `beastNear`;
  - `CRE-25`, the Cave Bear: the `hs_*_beast` scenes' `beastNear` and the school hunt's `beastOf`;
  - one beast per terrain: the content's `killer`.

  So a Solenne peasant can still meet "a cave bear" through those few scenes, and they now fire in 191 provinces. The fix belongs in those scenes: skip, or tell of a plain wolf or boar, when the list is empty.
- **29-starts' "What Took Your Father"** (`starts.core.js`, Northreach, W-13) picks its beast from `LORE.creatures` by terrain word alone, not through `A.beastsNear`. It can still pick a tropical beast for a Northreach father. Filtering its pool with `A.BH.suits(c.id, home)` would fix it; W-13 is in no beast's range, so it would fall to its own fallback.

## Decisions a human should check

- **The terrain waiver.** It gives these results:
  - Snow Drake: all four W-08 provinces, including Bearfold and Whitfield, which are drawn as dry woodland plains;
  - Great Crocodile and River Horse: all six Tamar provinces;
  - Tiger of Ranpur and Snow Ape: all of Emberdeep (E-12);
  - World Python: all of Ranpur;
  - Amber Wyrm: the Amber Wilds and the Isle of Pearls;
  - Woolly Rhino: the Whale Woods;
  - White Wyrm: Irondeep;
  - Thunder Mammoth: Frostholm's two halls.

  The alternative is to keep the terrain word everywhere. Then the Snow Drake, the Thunder Mammoth and the Great Crocodile would live nowhere.
- **The "north edge" cut** of S-04 at `y_km` 3,700 (above).
- **Only in unclaimed wilds.** These beasts live only where nobody is born: the Roc (E-16, the Isle of Pearls), the Forest Men and the Old Man of the Trees (S-12, the Deep Green), and the Hael Hounds (W-05, the Ashlands). That is canon. A person meets them only if their home moves there, for example if the Amber fleet's 1105 expedition takes the Isle.
- **An earlier draft of this feature** used a hand-built biome-and-region table from the one-line lore habitats. The coordinator replaced it with the canon ranges. That draft's 9001 run is kept in the death table for comparison.

## Effect on deaths

Measured with `/tmp/ardan/rw/die.mjs`: 48 bot lives per seed base (6 starts × 4 bot personalities), with the raw cause recorded when health reaches 0, before `A.mortalCheck` relabels it. "Before" is the full build without this feature; "after" is the full build with it. Nothing was tuned toward a number.

| Run | Died before 50 | Beast deaths before 50 | Tiger of Ranpur before 50 | Median death age (48 lives) | Humans who reach 20: median death age (n) |
| --- | ---: | ---: | ---: | ---: | ---: |
| 9001 before | 30 | 13 | 7 | 36.5 | 51.0 (32) |
| 9001 after | 21 | 3 | 0 | 59.0 | 60 (37) |
| 31337 before | 24 | 6 | 1 | 50.5 | 51.5 (38) |
| 31337 after | 19 | 5 | 0 | 61.0 | 66 (37) |
| **Pooled before** (96) | 54 | 19 | 8 | 44.0 | **51.5** (70) |
| **Pooled after** (96) | 40 | 8 | 0 | 59.5 | **61.5** (74) |
| 9001, earlier biome draft | 23 | 2 | 0 | 54.5 | 60.0 (36) |

The Tiger of Ranpur killed 10 of the 96 lives before (8 of them before 50) and none after. None of the probe's six starts (Aldmark ×2, Ashmere, Eldergrove, the Horde, Solenne) is in the tiger's range. Canon gives 55–65 for humans who reach 20; the pooled median moves from 51.5 to 61.5.

**What still kills off-range.** After the change, 12 of the 15 beast deaths (at any age) are by beasts whose canon range does not include the life's starting region. Examples: the Cave Bear in Eldergrove and the Horde, the Evenwood Wolf in Ashmere and Eldergrove, the Hell Boar in Ashmere and Aldmark, the Cave Hyena in Aldmark and Solenne, the Grey Stag in Eldergrove. These come from the content's fixed fallbacks (`"CRE-25"` in `explore_cave`, `hunt_beast` and `beastNear`; `"CRE-21"` elsewhere) and from pickers that never call `A.beastsNear`: `C_beast` in the `pf_*` scenes picks by terrain only (steppe → Cave Hyena, forest → Evenwood Wolf or Hell Boar, mountains → Cave Bear). Scenes gated by realm, such as `av_wild_greystag` (Sylvaran, Eldergrove, Aldmark, Ashmere), also name a fixed beast. Moving them to `A.beastsNear`, or to a plain wolf or boar, is the next step for "0 lore clashes". The probe records the start, not later moves, so a few of these lives may have moved home.

Cross-feature tests on the full build (26-belief-truth, 29-starts, 40-memory-adventure-trade, 48-fight-ladder, 49-body-mind, plus the core suites) all pass with and without this feature. The only differences are in the numbers of bot-life tests whose random stream shifts when fewer beasts are offered. For example, `flLives` went from 12 fight scenes and 2 deaths to 33 and 0, and `traitsInLives` from a median of 1 trait change to 2.

## Measured by (`test.mjs`)

Each test fails, rather than skips, when `A.BH` is missing (it gates on `typeof A !== 'undefined'`, not `window.A`).

- `bhInsideHabitat`: for all 306 provinces, every beast listed is in its canon range, with the terrain word waived only where the region has no fitting ground. The check re-derives this from the raw tables and the map, independently of the wrapper. The wrapper adds a beast the release did not list only in such a waived region. The release's lists break the rule 2,064 times in 2,200 pairs, so the check can tell the two apart.
- `bhAllReachable`: 25 of 25 beasts match a canon range and 306 of 306 provinces match a canon region. Every beast is near at least one province, and the test reports which live only in unclaimed wilds.
- `bhAldmarkRanpur`: no Aldmark province lists the Tiger of Ranpur, the Roc, the World Python, the Forest Men or the Old Man of the Trees (the release listed all five). All five Ranpur provinces list the tiger, and so does a fresh Ranpur start.
- `bhNoDraws`: 300 calls draw no random number and leave `A.rngState` and `A.S` unchanged.
- `bhReplayWithRender`: the same seed reaches the same world with and without drawing the screens (a Ranpur life, three runs).
- `bhEmptySafe`: in a Solenne province with no beast, every scene whose code reads the list (23) sets up and draws its text, and 40 hunts run, all without errors.
