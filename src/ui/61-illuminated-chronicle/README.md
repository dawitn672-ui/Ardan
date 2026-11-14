# The illuminated chronicle

**Aspect:** Visual art (Road to Ten, Visual art 1, 5, 6, 7) · **Kind:** UI system, 1 patch, no events. The style guide is `docs/art/style-guide.md`.

The plan says the art "hits 10 when one hand-made style covers every screen, so any screenshot reads as Ardan". In the release the skin looks right: dark leather, gold, and Cinzel. But events, the game's main surface, are bare text, the Chronicle looks like any other panel, the map is a generated relief, and there is no sound.

**What it does.**

- **A woodcut for every event** (`woodcut.core.js`). 25 scenes, one per event shape (25-variety-guard's `A.evShape`):
  - roads and the sea, taverns, a hall of state, a war camp, crossed swords, scales and coin;
  - a family house, a forge, a church, a laid table, a sickbed, a sealed letter, an open book, a lord's keep;
  - eyes in the forest, a grave, a game board, a rose and two rings, a storm, a dark archway;
  - a lantern on the road, a sealed charter, a cut purse, a street, and an ornament.

  They are drawn in ink on paper as SVG, in the style guide's hand: hatching, ruled skies, a cut foot, and at most two coloured inks. Each is varied by a seed from the event and the year:
  - the sky (sun, moon, stars, clouds, birds), the hills, and which way the picture faces;
  - the season (snow in winter, leaves in autumn);
  - the hour (night for taverns, crimes and errands).

  The same event in the same year always draws the same picture. Events with no shape (about a fifth) get a scene guessed from their own words ("a tutor ... letters" → the open book). Only 5% fall back to the ornament.
- **The Chronicle on vellum:** parchment, vermilion headings, illuminated initials. The book tab is set as a page of a book.
- **The map tinted to vellum,** with darkened edges and an inked compass rose. The canvas is still the release's.
- **Motion, in ink and paper:**
  - a woodcut inks in once, when its scene first opens;
  - the lines written into the story since you last looked ink in;
  - a new year's block turns in like a page;
  - a flash of steel crosses a duel or battle the first time it opens.

  Nothing moves when the system asks for reduced motion.
- **Sound, off by default:** a quill when you choose, paper when you close a scene, a wax seal on save, a bell at the new year, steel when a battle or duel opens. It is synthesized with Web Audio, with no files and nothing fetched.
- **Three menu settings:** Woodcuts on events, The Chronicle on vellum, Sound (patch `IL-MENU`).
- Found and fixed on the way (in 27-accessibility, patch `A11Y-LOG-FOCUS`): the story log could not be scrolled by keyboard once a story outgrew the screen.

**Measured by** (`test.mjs`, on the full build).

| Test | Result |
| --- | --- |
| `woodcutsEveryShape` | 25 scenes, each valid SVG in three seasons; the same key draws the same picture; 12 events give 300 distinct pictures (12 per scene); average 9 KB, largest 15 KB |
| `eventsGetPictures` | Of 418 events sampled, 342 are pictured by their own shape, 55 by a guess from their words, 21 (5%) by the ornament; the toggle removes the picture |
| `renderPure` | Drawing an event with its woodcut, the Chronicle and the map leaves the state and the random stream unchanged |
| `motion` | The first drawing inks nothing in; two new lines ink in, and the next drawing is still; a new year turns in one block; a duel flashes steel on its first drawing and not its second; drawing it changes no state and draws no number |
| `settingsAndSound` | The menu has the three toggles; no audio context is made until sound is turned on |
| `illuminationAxe` | 0 axe violations (WCAG 2.1 AA) on the Chronicle on vellum, the inked map, and an event with its woodcut |

**Rules kept.**
- Only the UI changes: no random draws (the seeds are hashes of ids), no game state.
- Every picture has a label for screen readers.
- Inline styles go in one `<style>` element, which the CSP allows.
- No external files.

**Limits (what needs a person).**
- **The woodcuts are procedural.** They are 25 compositions with seeded variety, not 60–100 hand-cut blocks. An illustrator working to `docs/art/style-guide.md` would raise them; the frame takes any SVG per shape.
- **The portraits and the map are still the release's**, only tinted. Painted miniatures and an inked map need an artist.
- **No music.** The UI sounds are hand-made; a calm score per region needs a composer.
- **The war map's unit boxes** are not yet banners.
