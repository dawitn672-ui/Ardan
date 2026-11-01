# The inked map

**Aspect:** Visual art (Road to Ten, Visual art 3 and 4) · **Kind:** UI system, 8 patches (hooks only), no events. The style guide is `docs/art/style-guide.md`.

The plan asks for two things:

- **Visual art 3:** "Redraw the map in the same hand: inked coasts, mountain glyphs, small town icons, a parchment texture, and more detail as you zoom in."
- **Visual art 4:** "Swap the military-style boxes for banners and unit standards when zoomed in, keeping the boxes as a clarity option."

In the release the map is a generated relief picture (a JPEG) under flat realm fills with pixel borders. Armies and divisions are NATO-style boxes. 61-illumination tints the canvas to sepia and adds a compass, but the drawing underneath is the release's.

**What it does** (`inkmap.core.js`).

- **The ground is drawn in ink on vellum**, procedurally, from the map grid:
  - the land is vellum, with paper grain and fox marks fixed to the world, so they stay put as you zoom;
  - the sea is the same paper, ruled like the woodcut sky;
  - coasts are an ink line with three water lines offshore;
  - land carries glyphs by its kind: peaks with a hatched shadow side on mountains (taller for higher provinces), low hatched hills, round trees in forest and pines in taiga, reeds in marsh, dunes and stipple in desert, tufts on steppe and tundra, furrows on plains. Open sea gets the odd wave mark once zoomed in.
- **Borders:** coast and province lines are traced from the grid into smoothed polylines (edge midpoints, relaxed, then corner-cut), so they stay smooth at the war room's deepest zoom. Province bounds are dotted. Realm borders are dashed ink on a thin paper halo.
- **The realms are a wash.** The release's colours are thinned, warmed toward ink-brown, and laid stronger in a ribbon along each border, the way old maps were coloured by hand. Every map mode (diplomacy, wars, faith, the war room's sides and supply) keeps its colours; only the pixel borders go.
- **Detail grows with zoom.** The ground is cut into 256-pixel tiles at six levels. Each level has its own glyph lattice: more and larger glyphs as you go in. Town icons appear from zoom 1.8: a house, a city's house and tower, a castle's tower, a church, a tent for oases and caravanserais, walls where a town has walls of 2 or more. Every capital is a keep with a gold flag, at any zoom.
- **Names are ink with a paper halo.** Realm names are set in Cinzel capitals at their keep. Province names are italic, and vermilion when the province is occupied.
- **Standards for armies.** From zoom 2.2 (`IM.BANNER_ZOOM`), in the war room and on the full map:
  - each division or stack is a pole and a flag in its realm's colour, with the ruling house's charge from the heraldry (`PORTRAIT.charges`, drawn as a `Path2D`);
  - the flag's shape gives the arm: a square banner for foot, a swallowtail for horse, a pennon for bows, a scalloped fly for beasts;
  - strength sits on a vellum slip edged in the side's ink (gold for yours, vermilion for foes, lapis for allies), with organisation and strength bars beneath;
  - the attack, hunger and siege marks, the elite star (on the finial) and "▼ YOU" are all kept.

  Zoomed out, the release's boxes stay.
- **Two settings** in the menu, both on by default (patch `IM-MENU`): "Inked map (coasts, mountains, towns)" and "Banners for armies when zoomed in". Turning the inked map off brings back the release's relief map; the banners are their own setting.

**How it hooks in.** The release's draw functions are wrapped, not rewritten:

- `MAP.overlay` and `UI.wrOverlay` are post-processed into the wash;
- `UI.wrCounter` and `UI.canvasCounter` draw standards when zoomed in;
- `MAP.draw`, `UI.gmDraw` and `UI.drawWarBasic` are wrapped to pass the zoom and a redraw callback.

The patches only add calls to `MAP.ground` (under everything), `MAP.inkLines` (borders, towns and keeps, after the wash), `MAP.marks` (names), and `MAP.inkLabel`. Each is skipped when the setting is off.

**Speed.**

- Tiles are cached by level and position (up to 150), and flushed when a border moves or the land changes.
- Each canvas keeps its finished view, with a 256-pixel margin, as one picture per layer. A still or panning map costs one copy per frame.
- While a wheel turns, only the view is laid; the margin follows once the scale holds.
- Tiles not drawn within 28 ms wait for the next frame, and the coarsest level stands in for them meanwhile.

**Measured by** (`test.mjs`, on the full build, one browser on a shared 4-core machine).

| Test | Result |
| --- | --- |
| `inkDrawsAtZooms` | 7 views (world tab; full map at zoom 1, 3, 8; war room at 1.5, 4, 9) draw without error with the style on and off, and all 7 differ. A sea pixel is vellum (220,210,180) inked, dark blue (36,57,74) in the release. |
| `inkPure` | Drawing every view, on and off, with a zero tile budget (1,006 tiles left for the next frame and redrawn by it): the state and the random stream are unchanged. |
| `inkSamePixels` | Full map at zoom 3: the same hash drawn twice, after the cache is thrown away, and in a fresh copy of the world. Zoom 8 is the same in both worlds. A frame drawn mid-zoom differs from the settled frame by at most 13 levels in 0.02% of channels. |
| `inkTiming` | Median ms per frame, release → inked: world tab 3.8 → 5.3; full map z1 10.7 → 5.4, z3 9.3 → 9.7, z8 12.1 → 11.9; full-map pan 9.0 → 10.3; wheel step 9.9 → 16.1; war room z1.5 17.5 → 19.3, z4 11.7 → 12.4, z9 9.0 → 10.9; war pan 14.8 → 10.6. Total 107.8 → 111.9. Cold: geometry 184 ms once per session, 2.8 ms per tile. |
| `inkBanners` | On a world at war: 35 standards in the war room at zoom 4 (each still a click target), 7 at zoom 9, none at zoom 1.2, none with banners off. On the full map: 7 standards at zoom 3, none at zoom 1. |
| `inkToggles` | Both settings are in the menu, on by default, and saved. With the inked map off, `MAP.ground` declines and the release draws. |
| `inkAxe` | 0 axe violations (WCAG 2.1 AA) on the world tab and the full map. |

The timings are noisy on a shared machine: across runs, the same frame varied by up to 2×. The pattern held in every run:

- a still or panning frame costs about what the release's does;
- a wheel step costs 1.6 to 2×;
- the first map of a session costs about 0.2 s once, to trace the coasts and borders.

Before and after screenshots (world tab, title strip, full map at zoom 1, 3, 8, and the war room at 1.5, 4, 9) are made by a private script, not by the tests.

**Rules kept.**

- Only the UI changes: every glyph, stain and wave is placed by a hash of its lattice cell and level, never `A.rand`, and nothing writes to `A.S` (`inkPure`).
- Settings live in `UI.set` and tolerate settings saved before they existed.
- No markup: everything is canvas. The menu labels are fixed strings.
- No external files.

**Brief 7.3's marks (Oct 27).** Three rendering-only additions, each read from the state and drawing nothing random (`inkBriefMarks`):

- **Hatch.** Where two neighbouring realms' colours (`UI.realmHex`, the colour each is shown in) are closer than 0.08 in OKLab (`IM.HATCH_D`), the smaller realm's wash is hatched at 45 degrees in the line ink at a quarter, one line every 60 km (`hatch`, inside the wash). Ten Known World realms take it at the start (Varenna, Ostra, Greyhaven, Morhaven among them).
- **Selection glow.** On the full map, the realm of the clicked province (`UI.mapHl`) has its border and coast drawn over in its own colour, wide at 30% and narrow at 55% (`IM.selGlow`, each frame, over the tiles).
- **Planned moves.** From the zoom the banners stand at (`IM.BANNER_ZOOM`, banners on), every division with a path gets an arrow along its next three steps (`IM.ARROW_STEPS`, about a month's march) in its realm's colour darkened by the ink, on a paper halo, its head short of the last site so the banner there does not hide it (`IM.moveArrows`, full map and war room).

Not done: the sea stays the woodcut's ruled vellum (the brief's Prussian-blue bokashi would restyle the whole sea, the Known World's too), and there is no hover outline (the map keeps no hovered realm).

**Limits (what needs a person).**

- **It is procedural, not drawn.**
  - Mountains sit where the province's terrain says, on a jittered lattice, not along real ranges.
  - Provinces are one kind of land each, so a hill province is all hills.
  - An illustrator could replace the glyph set (`glyph()` takes any drawing per kind) and add a cartouche and sea creatures, which are not here.
- **The realm wash is many colours.** On a political map that is the point, but it bends the style guide's "rule of one". The wash takes its colours from the release's overlay, so the colour-blind palette should carry over, but no test checks it.
- **Labels can still collide** with armies and with each other, as in the release.
- **The war room keeps some clarity marks** in the release's colours (fort squares, depots, siege rings, the front line) and its side colours. Only the ground, the borders, the names and the standards are inked.
- **Banners at a capital** can cover the realm's name on the full map, as the boxes did.
- **Timings come from headless software drawing.** With a graphics card the copies should be cheaper still, but that was not measured.
- **61-illumination's sepia filter** sits over this canvas and darkens it; the coordinator decides whether to weaken it.

**Cycle 1 fixes (visual review B7, world B8).** The full map's legend is a "Realms in view" row under the map (shut on a phone), built from the realms whose land is in view; the wash paints with `UI.realmHex` (far neighbours already spread apart by 91) and is laid stronger on the Great Continent; realm names sit on a paper plate so region capitals do not print through (`inkLegendView`). Not done: a full-screen phone map with a bottom sheet.

**Cycle 2 (lane G, styling only).**
- **The sea** is the brief's Prussian-blue bokashi: deep offshore (`IM.SEA_DEEP`), stepping lighter in four bands to the coast (`IM.SEA_STEPS`), each step edged with a pale ripple, faint pale ruling on the open sea, and the wave marks drawn as small seigaiha arcs. `IM.SEA_STYLE = 'vellum'` brings back the ruled vellum sea.
- **Hover** (`z-hover.core.js`): on the full map the realm under the pointer is outlined in gold, beside the clicked realm's glow. The pointer's place is a UI hint (`UI.mapHov`), redrawn at most once a frame.
- The map's zooms and jumps are eased by 96's motion system (the view is set at once; only the drawing follows).

`inkSeaHover`.

**Cycle 2, round 2 (Oct 29).** The realms read from above (visual F5): on the Great Continent the wash keeps its colour (no browning), lifted in chroma ×2.6, at least 100/255 on land, with the border ribbon at up to 160; the atlas's veil is laid at 0.25 on the full map (9991). At 1600 px and wider the map's frame takes the canvas's own height, so no blank band shows under it (B4).
