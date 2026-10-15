# Ardan's hand: a one-page style guide

*Road to Ten, Visual art 1: "Pick one art direction and write a one-page style guide. An illuminated-manuscript ink look, close to Pentiment, fits a game framed as a chronicle."*

## The idea

Ardan is a chronicle. Everything the player sees should look like it was **set down in a book by a hand**:

- the life you live is ink on vellum;
- the world around it is woodcut and engraving;
- the people are painted miniatures.

A screenshot with all its text hidden should still read as Ardan.

## Three surfaces, one hand

| Surface | What it is | In the build |
| --- | --- | --- |
| **The binding** | The game's chrome: dark tooled leather and gold. Frames with corner brackets, Cinzel capitals, Alegreya text. | The release's skin; keep it. |
| **The page** | Where the story is told: vellum, iron-gall ink, rubrics in vermilion, an illuminated initial on each chapter. | The Chronicle tab (61-illumination). The event card's text already has the initial. |
| **The print** | Pictures: woodcuts and engravings pressed onto the page. Black ink, hatching, no gradients, a little colour laid on by hand. | Event woodcuts (61-illumination), the map's compass. The map itself and the portraits are next. |

## Palette

All colour is pigment, never light. Five inks and two grounds; nothing else.

| Name | Hex | Use |
| --- | --- | --- |
| Iron-gall ink | `#2b1d10` | all line, hatching, text on the page |
| Vellum | `#ece0c4` | the page and the paper of prints |
| Vellum shade | `#d6c39b` | the page's edge, foxing |
| Vermilion | `#9e2b1b` | rubrics, seals, blood, one accent per print |
| Gold leaf | `#b98a2a` | the sun, crowns, coin, lit windows, initials' edge |
| Lapis | `#2f4a7a` | banners, a second accent (rarely) |
| Verdigris | `#4d7456` | leaves and herbs only |
| Leather (binding) | the release's `--bg` browns | chrome only, never on the page |

**The rule of one:** a print gets at most two coloured inks, and one of them is small: a seal, a banner or a sun. The rest is ink on paper.

## Line and texture

- **Strokes:** 1 to 2.5 px at 600 px wide; the frame 3 px outside and 1 px inside, with cut corners (small solid squares).
- **Shade with hatching, never gradients:** 45° lines at 5 px for light, 3.2 px for dark, crossed for darkest. Skies are ruled horizontally, 6 px apart by day and 3 px by night: the woodcut sky.
- **Every print stands on a cut foot,** a band of solid ink with white grass cut into it.
- **Interiors** sit in front of a stone wall pattern, with one lit window and floorboards.
- **Variation is seeded, never random:** the same event in the same year draws the same picture. The season changes the print (snow flakes in winter, leaves in autumn), and the hour does too (night skies for taverns, crimes and errands).

## Type

- **Cinzel** for titles and small caps, **Cinzel Decorative** for illuminated initials, **Alegreya** for text. No fourth face.
- On the page, headings are vermilion, sub-headings dark ochre (`#6b4410`; gold fails contrast on vellum), and text is iron-gall.

## Motion

Motion is ink and paper, never UI bounce:

- a print **inks in** once, the first time its scene opens (0.7 s: from blurred and faint to sharp);
- a new line of the story **inks in**;
- a page turns at the new year.

Nothing moves for a player whose system asks for reduced motion.

## Sound

Sound is off until the player turns it on, and it's made by hand, not by music:

- a **quill** when you choose;
- **paper** when you close a page;
- a **wax seal** when you save;
- a **bell** at the new year;
- **steel** when a battle or duel opens.

Everything is synthesized in the page (Web Audio), with no files. A calm score per region is a composer's job (see "Needs a person").

## What is off-style today, and the order to fix it

1. **Portraits** are paper dolls with flat colour. They should be painted miniatures: ink line, two-tone wash, a gold or lapis ground, age and scars in the line. *Needs an artist for the parts library; the code already layers parts and handles age.*
2. **The map** is a generated relief with flat fills. 61-illumination tints it to vellum and adds a compass. A real redraw needs inked coasts with ripple lines, mountain glyphs, town icons and a cartouche. *Needs an illustrator, or a long procedural pass.*
3. **Unit boxes** on the war map are NATO-style rectangles. Use banners in the house's colours (the heraldry already exists: `PORTRAIT.coat`), and keep the boxes as a clarity option.
4. **Event pictures** are 25 procedural woodcuts with seeded variety. A human illustrator can raise them to 60–100 hand-cut blocks in the same frame, palette and line weights; the code takes SVG or PNG per shape.

## Checks before anything ships

- Text contrast passes WCAG AA on vellum and on leather (the axe test runs on the Chronicle, the map and an event).
- Every picture has a text label for screen readers.
- Drawing anything never changes the game or draws a random number.
- A screenshot with text blurred is still recognisably Ardan.
