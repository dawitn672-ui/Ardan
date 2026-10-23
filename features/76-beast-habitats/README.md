# Beast habitats

**Aspect:** Balance and difficulty (the scorecard's median death age, target 55–70) and the plan's Power-scaling bar, "0 lore clashes in events" (`docs/plan/Ardan The Road to Ten.md`) · **Kind:** system (one core file, no patches, no events)

## The bug (in the release)

`A.beastsNear(pc)` decides which named beasts live near a character. It matches only the terrain word of the home province (`B.terr.includes(terr)`), plus two loose cases (steppe also takes plains beasts, plains also takes savanna beasts). It never reads a beast's lore `habitat` or the province's `biome`.

So the Tiger of Ranpur (lore: "The Monsoon Coast and Worldspine foothills", category "Tropical beast", `terr: [forest, plains, hills]`) is near **244 of the 306 provinces**, counting the release's own steppe-takes-plains rule. That is 204 on the terrain words alone. A peasant of Aldmark (POL-01), whose provinces are only temperate forest, steppe, alpine highland, marsh and taiga, has 19 named beasts on the local list in the release. Among them are the Tiger of Ranpur, the Roc ("the interior of the Isle of Pearls"), the World Python, the Forest Men and the Old Man of the Trees.

It matters twice:

1. **Lore clash.** A monsoon-coast tiger in a northern empire is exactly what the plan's bar forbids.
2. **It kills young lives.** A probe of 48 bot lives on the full build found 30 died before 50. Beasts were the first raw killer (13 of 30), and **the Tiger of Ranpur alone killed 7**, none of them anywhere near Ranpur. The deaths were hidden: `A.mortalCheck` relabels a death whose fatal hurt is over 40 days old with a random `A.naturalCause` ("marsh fever"), so cause-of-death strings undercount beasts.

## What it does

`habitats.core.js` wraps `A.beastsNear`. The release's terrain match still runs first. Each beast it returns must then also suit the province:

- **Biome.** The province's `biome` must be one the lore habitat and category allow (`biomes`). A Tropical beast keeps to tropical and monsoon country, the dragons to alpine highland, and so on.
- **Place.** Where the lore names a region, the province must be in it. That means `realms`, the realm or realms the region is, read from the map as written (`LORE.map.provinces[i].realm`), so conquest and the varied worlds of 43 and 70 never move a beast's country. Or `wilds`, a named province such as the Deep Green. `edge: true` also takes the provinces next to a listed wild when their biome fits.
- **`terrIn`** narrows the terrain. The Great Ash Dragon keeps to country drawn as mountains, as the game's own "sky-king" scene asks.
- **`extra`** names provinces where a beast lives although the release's terrain word for it never matches there. It is used only where the lore homeland has no province the release's terrain allows, so the beast would otherwise live nowhere or only in the wrong place. Three beasts use it, and each is a decision for a human (below).

The list keeps the release's order (the order of `A.BEASTS`), so a pick from it is as stable as before. A beast added to `A.BEASTS` later without a table entry keeps the release's rule. `A.BH.OFF = true` gives the release's list back (the tests use it to compare). `A.BH.suits(id, province)` answers the question for one beast, for other code that picks beasts on its own (see 29-starts below).

**No random numbers, no state.** The wrapper draws nothing (the release's version draws nothing either, so no seed's world shifts from the call itself). It writes nothing to `A.S`; its resolved table is module data, built once from `LORE`. It adds **no fields to people, realms or saves**, so old saves need nothing.

## The table (25 beasts)

Region-to-realm ties follow the lore's cultures (`LORE.cultures[*].home` and `pols`) and the game's own scenes where they already name realms for a beast or region (`av_wild_wyvern_eggs`, `av_wild_ford_crocs`, `av_wild_riverhorse`, `WILD_OF`). "Release" and "now" count provinces of 306 where the beast is near.

| Beast | Lore habitat | Allowed | Release | Now | Where now |
| --- | --- | --- | ---: | ---: | --- |
| Great Ash Dragon | High mountains with updrafts and hot springs | Alpine highland drawn as mountains, anywhere | 146 | 17 | Skyhold's 8, Emberdeep, Gorhall, Morhall, Samandi, Dobnik Fort, Aravel, the High Wastes, the Bleakfold, the Stairwood |
| Sunwall Wyvern | Cliffs and gorges of the Sunwall | Steppe/desert hills of Qadir, the Sand Clans, Sabra (the realms the wyvern-egg scene uses) | 146 | 4 | Hazifa; Sarabad, Sabira, Zahas |
| Amber Wyrm | Rainforest and scrub of the Amber Isles and the Isle of Pearls | Tropical rainforest of POL-32; the Isle of Pearls | 52 | 3 | Amberport, Ruhu, Paamu (the Isle is drawn as hills, which its forest/marsh terrain never matches) |
| Snow Drake | High valleys of the Crown Range | Highcastle (`extra`) | 20 | 1 | Highcastle |
| The Grey Stag | Deep old-growth of the Evenwood; hunted out of every human land | Temperate forest of Sylvaran | 45 | 6 | Evenglade, Loriel, Lirthil, Aressa, Rineron, Eriavel |
| Aurochs | The Evenwood and the Elder Coast; alive in elven lands | Temperate forest of Sylvaran and Eldergrove | 118 | 10 | Sylvaran's 6, Eldergrove's 4 forests |
| The Evenwood Wolf | The Evenwood, the Pinewild; Northfolk tales of it | Temperate forest, taiga, tundra of Sylvaran and the Northfolk realms (Aldmark, Ashmere, Northreach, Highland League, Greyhaven); the Pinewild and its edge | 180 | 45 | Sylvaran, Aldmark's forests, Ashmere, Greyhaven, Northreach, Irondeep, the Pinewild, the Frostfells, the Dobava Wilds |
| Hell Boar | Broadleaf forest and scrub of the Sunlands' hills | Temperate forest and dry woodland of the Solen realms (CUL-01) | 171 | 18 | Varenna's 14, Fort Barica, Calossa, Feleria, Morhaven |
| Cave Bear | Caves and forests of the Iron Mountains; extinct except by the dwarves | Irondeep | 191 | 1 | Irondeep |
| White Wyrm | Flooded caves under the Worldspine and Iron Mountains | Skyhold, Stonehold, Emberdeep, Irondeep; the High Wastes, the Stairwood | 20 | 14 | the Worldspine's mountain provinces (Irondeep is hills, which its terrain does not match) |
| Snow Ape | Forests and snowfields of the eastern Worldspine | Skyhold, Emberdeep; the High Wastes, the Stairwood | 20 | 13 | as listed |
| The Thunder Mammoth | Frostholm; kept in herds by the giants | Frostholm; the Trolness Fells; Skarfell, Helstad, the Mammoth Downs (`extra`) | 9 | 4 | Skarfell, Helstad, the Trolness Fells, the Mammoth Downs |
| Woolly Rhino | The Eastern Steppe's northern edge | Steppe of the Tusk Clans | 49 | 2 | Grakmar, Roktuk Oasis |
| Cave Hyena | The Grass Sea and the Salt Steppe | The Horde of Gorath and the Nine Winds | 73 | 17 | all their steppe and plain |
| Basilisk | Rocky desert and scrub of the Red Waste and the Qadiri Coast | Desert and salt flat of the Sand Clans and Qadir | 26 | 13 | as listed |
| Sand Dragon | The Red Waste's rocky margins and the Burning Waste | Desert of the Sand Clans; the Burning Waste | 26 | 9 | as listed |
| Great Crocodile | The Monuti delta, Lake Nubako and the Long Rift | Tamar; Tamar and Talim (`extra`) | 80 | 2 | Tamar, Talim |
| River Horse | The Monuti, the Long Rift lakes, the Golden Plains rivers | Tamar, Zanara, Abara; Tamar and Talim (`extra`) | 80 | 7 | Tamar, Talim, Zanara, Seduna Walls, Fort Zuafa, Tetamba, Koyako |
| Green Anaconda | Swamps of the Deep Green and the Spice Coast | Rainforest and marsh of the Spice Coast; the Deep Green and its edge | 52 | 4 | Monuro, Fort Makale, Ruhu, the Deep Green |
| Tiger of Ranpur | The Monsoon Coast and Worldspine foothills | Ranpur; Garbek Gate, the Amber Wilds, the Little Amber Wilds | **244** | **8** | Ranpur, Chanari, Tiravi, Madora, Ekapur, Garbek Gate, the Amber Wilds, the Little Amber Wilds |
| World Python | The Deep Green, the Amber Isles, the Monsoon Coast | Tropical rainforest of the Amber Isles and Ranpur; the Deep Green and its edge | 45 | 6 | Amber Isles' 3, Monuro, Fort Makale, the Deep Green |
| The Roc | The interior of the Isle of Pearls | The Isle of Pearls | 171 | 1 | the Isle of Pearls |
| Forest Men | The Deep Green | The Deep Green and its rainforest edge | 45 | 4 | the Deep Green, Monuro, Fort Makale, Ruhu |
| Hael Hounds | The Ashlands | The Ashlands and the hills next to them | 146 | 4 | the Ashlands, Alderwick, Sun Temple of Aldminster, the Western Highlands |
| Old Man of the Trees | Rainforest of the Deep Green | The Deep Green and its edge | 45 | 4 | as Forest Men |

The reason for each entry is written beside it in `habitats.core.js` (`why`).

**Aldmark now** lists only the Evenwood Wolf, in its forests. In the release it listed 19 beasts. **Ranpur** lists the tiger in all five of its provinces. **155 provinces** now list no beast at all (none did in the release). They are mostly the Solen heartland's dry woodland plains, the southern savanna, the marshes and Velgrad's and Drevna's forests, where the lore names no beast.

## Callers (all empty-safe)

`beastsNear` has 1 call in the core and about 25 in the content. Every caller already copes with an empty list. The hunt (`startHunt`) checks `near.length` first. Scenes that need a beast check `A.beastsNear(p).length > 0` in `cond` (`av_wild_lair`, `av_wild_village_bounty`, `av_wild_hunt_contract`) or fall back to a fixed beast. 26-belief-truth and 48-fight-ladder read `A.BEASTS` only, so they are unchanged. 40-memory-adventure-trade's `beastNear` falls back to `CRE-21`. The `bhEmptySafe` test runs every scene whose code reads the list in a province with no beast.

**Left for a human (outside this folder):**

- **Fallbacks are still fixed beasts.** When the list is empty, the content and 40-memory-adventure-trade fall back to a fixed beast:
  - `CRE-21`, the Evenwood Wolf: "something big crosses the road", `wk_hunt_beast`, `av_wild_lair` and `av_wild_village_bounty` (when no beast is under their size cap), and 40's `beastNear`;
  - `CRE-25`, the Cave Bear: `hs_*_beast`'s `beastNear` and the school hunt's `beastOf`;
  - one beast per terrain: `killer`.

  So a Solenne peasant can still meet "a cave bear" through those scenes. That is the same kind of clash as before, from a few scenes rather than from every beast scene, but these fallbacks now fire in 155 provinces instead of almost none. The fix belongs in those scenes: skip, or tell of a plain wolf or boar, when the list is empty.
- **29-starts' "What Took Your Father"** (`starts.core.js`, the `what_took` start in Northreach) picks its beast from `LORE.creatures` by terrain word alone, not through `A.beastsNear`. It can still choose a tropical beast for a Northreach father. Filtering its pool with `A.BH.suits(c.id, home)` (or drawing from `A.beastsNear(pc)`) would give the Evenwood Wolf there.

## Decisions a human should check

- **Snow Drake: Highcastle.** The lore puts the last ~15 in two Crown Range valleys above Highcastle, guarded by the Stonefoot kin. No Highland League province is drawn as mountains (Highcastle is alpine highland, hills), and the release's `terr: [mountains]` put it in Skyhold and every other range instead. Highcastle is named as `extra`. The alternative is to leave it in some mountains that are not the Crown Range.
- **Thunder Mammoth: Frostholm's halls and the Mammoth Downs.** Frostholm's two provinces and the neighbouring Mammoth Downs are drawn as forest, and the release's `terr: [tundra]` put the mammoth in Stonehold's glaciers instead. Hrimfell (the other giant hall-land, "Frostholm and the White Coast") was left out because the habitat says only Frostholm.
- **Great Crocodile and River Horse: Tamar and Talim.** Every place the crocodile's lore names is in Tamar, whose provinces are drawn as desert, salt flat and hills. The release never put it there; it put it in 80 other provinces. Tamar and Talim are named as the Monuti river towns ("the Dyke Corps at Tamar, Talim and the delta"). The game's own scenes put the river horse out of desert country (`av_wild_riverhorse` has `!C.terr(p,"desert")`), so its two Tamar entries are the most arguable.
- **Tiger: the Worldspine foothills.** These are taken as the non-mountain provinces between the range and the Monsoon Coast: Stonehold's Garbek Gate and the Amber Wilds. Velgrad's and Drevna's forests also touch the range by the map, but they are the cold north side, so they were left out.
- **The Sunwall** is taken as the desert-edge hills of the realms the game's own wyvern-egg scene names (Qadir, the Sand Clans, Sabra). The Sand Clans' far-south savanna hills were left out.
- **Only in unclaimed wilds.** The Roc lives only on the Isle of Pearls, and the Deep Green beasts mostly in the Deep Green and on its edge. A person born in a realm meets the Roc only if their home moves there. That follows the lore, and the Amber fleet's 1105 expedition to take the Isle could change it.
- **The Cave Bear** is in Irondeep only. Its lore says "believed extinct everywhere except by the dwarves", and that is followed literally.

## Effect on deaths (`/tmp/ardan/rw/die.mjs`, 48 bot lives, raw cause at the moment of death)

DEATHS_TABLE

## Measured by (`test.mjs`)

Each test fails, rather than skips, when `A.BH` is missing (it gates on `typeof A !== 'undefined'`, not `window.A`).

- `bhInsideHabitat`: for all 306 provinces, every beast listed is allowed by the table. The check re-reads the raw table and the map independently of the wrapper. The wrapper only removes beasts from the release's list, apart from the named `extra` provinces, and every name in the table resolves to a province. The release's own lists break the table more than 1,000 times, so the check can tell the two apart.
- `bhAllReachable`: all 25 beasts are near at least one province.
- `bhAldmarkRanpur`: no Aldmark province lists the Tiger of Ranpur, the Roc, the World Python, the Forest Men or the Old Man of the Trees (the release listed all five). All five Ranpur provinces list the tiger, and so does a fresh Ranpur start.
- `bhNoDraws`: 300 calls draw no random number and leave `A.rngState` and `A.S` unchanged.
- `bhReplayWithRender`: the same seed reaches the same world with and without drawing the screens.
- `bhEmptySafe`: in a Solenne province with no beast, every scene whose code reads the list sets up and draws its text, and 40 hunts run, all without errors.
