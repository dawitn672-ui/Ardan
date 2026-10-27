# Woodblock skies

**Aspect:** Visual art (docs/design/brief.md §7.2, change 10 of §8) · **Kind:** UI system, no patches, no events. It restyles 61-illumination's event woodcuts.

The brief moves Ardan from a European woodcut toward a colour woodblock print lit like an anime background. Events are the game's main surface, and 61 already gives each one a picture: 25 compositions, one per event shape, seeded from the event and the year. This feature keeps 61's compositions, seeds and rules and replaces how they are drawn.

## What it does

**A colour print for every event** (`skies.core.js`, `UI.SKIES`). The SVG is 16:5 (640 × 200), shown at 598 × 187, 720 × 225, or 390 × 140 on a phone. Back to front:

1. **Sky.** A four-stop bokashi from the hour table, with the darker *ichimonji* band across the top.
2. **Light.** The sun with a two-stop glow, set high by day, low at golden hour, and on the ridge at dawn and dusk; shafts of light come from a low sun. At night there is the moon (full or a crescent), seeded stars, a few four-point stars and the river of stars.
3. **Clouds.** Flat and two-tone. By day a cumulus is lit from above and shaded toward the lower right. When the sun is low, long streaks are lit from below. A storm is a low ceiling hung with bulges.
4. **Far ridge.** Seeded midpoint displacement, 60% of the way to the sky colour, blurred 1.2 px, with snow above a ragged line on mountains and tundra.
5. **Mid ridge.** The land's own colour, with a bokashi toward its foot. What it wears depends on the terrain: crowns of trees (hills), a wood (forest), a patchwork of fields (plains), grass (steppe), dune crests and plateaus (desert), water (marsh), or small pines (mountains, tundra).
6. **Sea.** On a coast, or on a voyage: a Prussian-blue band with *seigaiha* arcs and the sun's road on the water.
7. **Near ground.** Flat and dark, with a 1.5 px rim light in the hour's light colour, or a snow line in winter.
8. **Subject.** 61's silhouette (keep, hall, forge, ship and the rest) redrawn in flat colour with the `--line-ink` line. Local colours (plaster, tile, thatch, stone, cloth) sink into the hour's shadow. Faces turned to the upper left are lit, whichever way the scene faces. One window, fire, candle or pair of eyes glows (`feGaussianBlur` 4 px at 60%).
9. **Interiors.** The eight indoor scenes (hall, letter, book, scales, board, table, sickbed, signet) put a warm wall with arched windows in front of the sky and land, so the hour shows through the glass, and light falls in toward the lower right. After dark the candle is the light: the room turns warm and its pool of light carries the scene.
10. **Framing** (seeded, about a third of outdoor prints). A pine branch from the top-left corner (blossom in spring, red leaves in autumn, snow in winter), reeds by water and marsh, or a banner's edge at war and before a keep.
11. **Weather.** Rain as hairlines at 20%, snow as dots, fog as pale bands over the ridges, a few petals or leaves by day, and fireflies on a summer night.
12. **Cartouche.** An upright slip in the top-right corner holding the home province's name in Cinzel 12, `--surface` at 85% with a 1 px `--line-ink` border. It is HTML laid over the print, so it stays crisp, follows the theme, and is never cut off by the phone's narrower crop. It is `aria-hidden`, because the print's label already says the place.

**Which hour.** The brief's mood mapping, by event shape:

- births and the new year at dawn;
- love and weddings at golden hour;
- deaths and graves at dusk;
- crimes, taverns, menace and night errands at night;
- battles and fights in storm or golden light;
- storms in storm.

Words in the event override its shape: an event that says "born", "wedding", "funeral" or "battle" takes that hour whatever its shape. The rest choose by seed from the hours that suit them (a road by day or at dawn; a sickbed by night or at dusk).

**The far lands** (Oct 27). A far province (one that carries a `region`, from 99-far-lands) takes its land from its biome (`SK.terrOf`):

| Land | Biome | What the print shows |
| --- | --- | --- |
| jungle | rainforest and monsoon forest | palms over a dark wood |
| savanna | savanna | flat-topped thorn trees on gold grass |
| taiga | taiga | close stands of spruce, two rows deep |
| alpine | alpine highland | pasture under snow peaks |
| scrub | dry woodland | low bushes on dry ground |

A Known World province keeps its word, so its prints are unchanged.

**The far lands' buildings** (`SK.archOf`). A far province's land also gives its houses their shape, and its towers' caps (each print says it in `data-arch`):

| Shape | Lands | Houses | Tower caps |
| --- | --- | --- | --- |
| eaves | the Twin Rivers, the Sunrise Isles, the Southern Peninsulas | plaster under a tiled roof with upturned ends | upturned eaves |
| dome | the Sand Basins | flat roofs with a small blue dome, arched doors and windows | domes |
| yurt | the Long Grass, the High Steppes | round felt tents with red bands | the release's cones |
| stilt | the Thousand Isles | houses on stilts under curved thatch | the release's cones |
| round | the Deep Southland | round huts under cones of thatch | the release's cones |
| log | the Black Pines, the Rime Coast | log walls under a steep roof | the release's cones |

**Which land.** The player's home province gives the terrain (plains, hills, forest, steppe, desert, marsh, mountains, tundra) and whether it is on the coast. Winter (December to February, and always on the tundra) lifts every colour by 0.15 L, cuts chroma by 30%, and lays snow.

**Rules kept.**

- The same event in the same year draws the same picture. The seed is 61's, a hash of the shape, the event and the year.
- Element ids are a hash of the inputs, so the same input gives the same string.
- Drawing is pure: no `A.rand`, no `Math.random`, no write to `A.S`.
- Every print has a label for screen readers, for example "Colour print: a road, dawn, Kingsmere".
- Styles go in one `<style>` element.

**Hook and toggle.** 61's `UI.ILLUM.woodcutFor` (the picture at the head of an event) is wrapped: it draws the colour print unless the player turns it off. A menu setting, "Colour skies on events (off: ink woodcuts)", goes back to 61's woodcut, and 61's own "Woodcuts on events" still turns pictures off altogether. Without 61 in the build, the print goes at the head of the event box itself.

## Measured by (`test.mjs`)

| Test | What it holds |
| --- | --- |
| `skyEveryShape` | 25 scenes; 1,600 prints across hours, lands and seasons all parse; the same input gives the same string; 12 events give 12 distinct pictures per scene; at most 15 KB each, 6 to 12 KB on average (measured 5.6 to 13.6 KB, average 8.6 KB) |
| `skyHoursAndLand` | The brief's mood mapping by shape and words; a coastal home draws the sea band and an inland one does not; the terrain drawn is the home's; the cartouche names it |
| `skyPure` | Drawing the event three times, the Chronicle and the map leaves `A.S` and `A.rngState` unchanged, calls `Math.random` 0 times, and gives the same markup; another year gives another picture |
| `skyToggle` | The menu toggle; off draws 61's woodcut, pictures off draws none, back on draws the print |
| `skyPhone` | At 375 px the print is 2.78:1 (the brief's 390 × 140), full width, with the cartouche inside it |
| `skyFarLands` | 375 prints of the five far lands, 10.2 KB on average and 14.1 KB at most. Every far land is some province's: jungle 606, alpine 97, scrub 97, taiga 152, savanna 20. Known World words are kept. A life at home in the monsoon forest gets a jungle print with eaves. The six building shapes in seven scenes: valid, 10.7 KB at most, different from the Known World's. Far provinces by shape: eaves 819, round 243, yurt 238, log 162, stilt 145, dome 67; none in the Known World |
| `skyAxe` | 0 axe violations (WCAG 2.2 AA) with an event and its print on screen, dark and light |

## Art review

`sheet.mjs` renders contact sheets with Playwright:

```sh
node features/94-woodblock-skies/sheet.mjs built.html out/ --tag=r4 [--quick]
```

It writes four sheets:

- `shapes`: the 25 scenes at their own hour;
- `hours`: four scenes at all six hours;
- `terrain`: two scenes on every land, a coast and in winter;
- `contact`: all 25 scenes at all six hours, 150 prints.

The prints were reviewed and redrawn over four rounds:

1. The cartoon bump clouds became two-tone cumulus, the road no longer reads as a pyramid, the near land got depth, and the branch moved off the cartouche.
2. Each terrain now dresses the mid ridge, and night interiors are lit by their candle.
3. Nights are deeper, the cumulus stays inside the frame, the branch appears less often and never in a storm, the lantern's glow stays on the lantern, and the bytes were trimmed.
4. Moonlit plaster was darkened, the branch now varies its reach, sag and pads from print to print, and the open view (no shape) got a stream winding down from the hills.

## Limits

- **Procedural, not painted.** These are 25 compositions with seeded variety, not hand-cut blocks. A background artist would give the subjects real perspective and hand-placed light. The frame takes any SVG per shape.
- **Not checked by a person.** The sky colours come from the brief's hour table, and the subjects' local colours were tuned by eye on the contact sheets.
- **The fight, war and money scenes are emblems.** They keep 61's heraldic arrangements (crossed swords over a shield, scales and coin) rather than showing a scene.
