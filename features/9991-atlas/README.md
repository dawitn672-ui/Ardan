# The Atlas

**Aspect:** World and place, collection (design review cycle 1, #11 "The Atlas" and #6 "The map as a first-class surface") · **Kind:** system and UI (`atlas.core.js`), 2 patches (hooks in 62's inked map), no events, tests

**Why.** Nothing recorded where the player had been. The Great Continent's 1,992 provinces were all drawn as known from birth, so the line from 26-belief-truth, "what you know depends on how you came by it", had nothing to show on the map. The map itself sat three clicks deep (Chronicle → World → Map).

**What it does.**

- **What you know** (`pc.atlas = { s, h, src, v, wc, born }`; `A.ATLAS.level(pc, id)`: 2 seen, 1 heard of, 0 unknown). Seen with your own eyes:
  - where you live;
  - every province a journey passes through (9990-journeys);
  - a wild place you found (997's `pc.sites`).

  Heard of:
  - the world record's news (57's `S.wrec`) within 1,400 km, of your realm, or of the greatest kind (wars, falls, foundings);
  - where your kin, lovers and friends live (their letters);
  - where your realm's caravans go (45's `S.eco.car`, up to three a month);
  - what you are told on the road (the journeys' `heard` choices);
  - your realm's land, if you rule it.

  At birth, and in a save from before this feature, you know your home and the land next to it as seen, and your realm and its neighbours' seats as heard of. This is computed without writing (`AT.base`); the atlas is written on the first month.
- **An heir inherits some of it** (a wrap of `A.continueAs`). What the parent saw becomes heard of: "told often enough: 20 places you have never seen are on the map you keep". The heir also gets half of what the parent heard of, chosen by a hash of the place and the heir, never `A.rand`.
- **The veil.** Drawn by 62-inked-map's renderer through a hook (patch `AT-VEIL`, `MAP.veil`), over the ground, the wash, the borders and the towns, and under the names:
  - unknown land is blank vellum at 88%;
  - land heard of is half-veiled;
  - the sea fades out over about 200 km from the coasts you know (two chamfer passes over the water cells).

  A province you do not know has no name written when zoomed in (patch `AT-UNNAMED`, `MAP.unnamed`). The veil is laid on the world tab, the full map and the story column's map, not in the war room. It is one picture at grid resolution, cached until what you know changes. "Show the whole map" on the Places page turns it off (`UI.set.atlasFog`).
- **Story | Map** (a wrap of `UI.renderLogWrap`). The story column has a toggle, on a phone too (its Story tab). The map there:
  - opens on where you are, about 2,400 km across;
  - shows your road with the walked part solid, the stops and the destination's flag, your home, your people (a dot with how many live there) and you;
  - pans by drag, zooms by wheel or the buttons;
  - shows what you know of a province when you click it (`AT.provCard`): how you came to know it and when, its wild places, your people there. An unknown one reads "Somewhere you do not know".

  The bar over the story says where you are, or the road you are on ("The road to Seuvan: day 37 of about 94, last stop Doksau").
- **Places you know** (Chronicle → Places, `UI.TAB.atlas`):
  - counts ("Seen with your own eyes: 18 places in 5 realms. Heard of: 35. Unknown: 1,939 of 1,992");
  - the farthest you have been from where you were born;
  - the roads you have walked;
  - every realm's places, seen and heard of, each a button to it on the map, with the wild places found.

**Patches.** Both are one call into this feature in 62's `MAP.marks`:
- `AT-VEIL`: `if (MAP.veil) MAP.veil(ctx, W, H, v);` before the names.
- `AT-UNNAMED`: a province name is written unless `MAP.unnamed(p, ctx)` says otherwise.

The core adds `A.onMonth`, wraps `A.continueAs` and `UI.renderLogWrap`, and adds a Chronicle sub-tab.

**Rules kept.** The engine writes the atlas only in `A.onMonth`, at an heir's start and through the journeys. Every view reads it, and an atlas that is missing reads as `AT.base`. Rendering draws no random numbers and changes nothing (`atlasVeil`). The story-map's view is UI state (`UI.atV`), never `A.S`. No markup is stored: the province ids are numbers and the sources are one-letter codes.

**Measured by** (`test.mjs`):
- `atlasKnows`: before the first day, home and the land around it are seen, the realm is heard of, and nothing is written. Two years on, more is heard of, from news, caravans, the realm and home. An heir hears of a far place the parent saw (+20 heard of). A save without the atlas loads and makes one.
- `atlasVeil`: on the world tab, a far unknown province changes from the realm's wash (150,138,117) to vellum (219,208,181), and home is unchanged. The story-column map draws. An unknown province's name is hidden and home's is kept. The Places page renders. Drawing is pure.

62's own tests (`inkDrawsAtZooms`, `inkPure`, `inkSamePixels`, …) are run against the build with this.

**Not done / next.**
- The Hall of Lives (995) could keep a life's widest reach ("places seen: 14 of 1,992").
- Heard-of land could carry its rumoured name in faded ink.
- Battles you fought in could count as seen.
- The full map could get a "What you know of it" side card.
