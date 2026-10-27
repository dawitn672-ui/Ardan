# The wilds

**Aspect:** World and place (design review cycle 1, #5) · **Kind:** system (`wilds.core.js`), 12 events (`wilds.events.js`, prefix `wl_`), tests

**Why.** "Explore the wilds" was `A.pick` of five scenes (a ruin, a cave, a road, a lair, a battlefield), the same anywhere on a continent of 1,992 provinces.

**What it does.**

- **Places of the land.** Each province has zero to two wild places, the same in every game: chosen by hashing the province's id (never `A.rand`) among the kinds the province can hold:

  | Kind | Where |
  | --- | --- |
  | barrow, tower, grove, causeway, well, cairn | by terrain (hills, plains, steppe, tundra, forest, marsh, desert, mountains) |
  | wreck | a coastal province |
  | river, pass, lake | the Great Continent's atlas (99-far-lands' `D.atlas`): a named river within 220 of the province, a pass or range, a lake; the region's name goes in the scene |
  | field | a lowland province whose realm fought one of the lore's wars (`LORE.wars`) |
  | lair | a beast that lives near home (76-beast-habitats, 992-far-beasts, `A.beastsNear`), with what folk say of it (26-belief-truth's `belief`) |

  In the Known World 247 of 306 provinces have one (8 kinds); on the Great Continent 1,593 of 1,992 (11 kinds, about half by a named river or pass).
- **Exploring.** A wrap of `A.ACT.explore` takes you to the first place not yet found in your home province, then in the provinces next to it ("a day's walk out, in Ago, in the Ninefold Lakes"). Once every place in reach is found, exploring falls back to the release's five scenes, rationed by 97 as before.
- **A scene for each kind.** Twelve scenes, each with its own checks and results: dig the barrow (strength) or read the door-stone (learning), wade the causeway, clear the well for the herders (renown) or climb down it (coin), dive from the lake's steps, walk the battle line (tactics), watch the lair from downwind (stealth). Every scene has a safe way out with a smaller reward.
- **Remembered.** Choosing records the place in `pc.sites[key] = year` (optional: an old save has found nothing) and writes "You mark a barrow in Eagleburg on the map you keep in your head: 3 wild places now." in the story log. At a lair, watching the beast means you have seen it (26's level 2); asking about it means you have heard of it.

**Patches outside the folder.** None. The scenes carry `ctx.lfFixed`, so 97's "the player asks for the same scene" rule does not hold back a new place.

**Known World.** Exploring in a Known World game now draws these scenes, so a Known World life that explores differs from before: this is the feature.

**Measured by** (`test.mjs`): `wildsReadLand` (both worlds: places from the land, the same in another world seed, at most a third of provinces without one; exploring queues a `wl_` scene without raw tokens, choosing records and logs it; drawing is pure; a person without `pc.sites` loads) and `wildsLairTeaches` (a lair scene names the beast's folk belief, and watching it raises 26's level to seen). `lint-events` and `lint-choices` pass.
