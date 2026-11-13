# Figures: every person drawn by the figure library

**Aspect:** character art (work item C8b; owner orders 24 to 27, 30, 33; D-024, D-029, D-035, D-036) · **Kind:** readable core code, no events, no patches. The library itself is a v2 engine module.

The owner approved gate 2 of the 2D character art ("this looks amazing, especially the blonde knight in the middle"; Ser Edric Vale is the bar) and asked for it to go into the game and keep being refined. This feature is the game's side of that: every place that shows a person now shows a figure from the library, every person has a face of their own, and the creation screen has a face and build maker.

## Where things are

| Path | What |
|---|---|
| `src/ui/engine/figure/` | **The library** (on the page as `A.V2.figure`): `g.js` geometry and seeded streams, `scene.js` layers and SVG output, `palette.js`, `rig.js` (body), `head.js` (face), `hair.js`, `gear.js` (dress, armour, arms), `figure.js` (`compose(look, opts)`), `look.js` (a person's sheet to a look, the face codes), `wardrobe.js` (dress by estate; gear by item) |
| `figures.a-peoples.core.js` | What each culture wears on the head and dyes its cloth (`UI.FIG.cultOf`) |
| `figures.b-draw.core.js` | `UI.FIG.sheet(p)`, `UI.FIG.look(p)`, `UI.FIG.svg(p, size, opts)`, `UI.FIG.inline(...)`, the picture queue |
| `figures.c-looks.core.js` | `A.LOOKS`: a face code for everyone born, and for everyone in an older save |
| `figures.d-maker.core.js` | The face and build maker on the creation screen (`UI.FIG.maker`) |
| `tests/v2/figure.test.js` | The library's unit tests (node) · `test.mjs` here: the browser tests (`fg*`) |

Release source edited in place (D-028), each marked `[C8b]`: `PORTRAIT.svg` (20-portraits.js) hands every portrait to `UI.FIG.svg`; `A.genAppearance` (03-engine-base.js) gives everyone a face code; `UI.crStepBody` (23-ui-a.js) hands the step to the maker. A build without this feature draws the release's paper doll and its old rows.

## A person to a picture

1. **The sheet** (`UI.FIG.sheet(p)`, read only): sex, people, age in human years, the stored appearance, estate, rank, what is carried (by item), wounds, the realm's and the house's colours and device, the culture's headwear and dye, and the face at rest (mood, read from happiness, opinion of you, health, traits and the scene of an event).
2. **The look** (`A.V2.figure.lookOf(sheet)`, pure): the face (39 features from the code, eleven more and the build's seven from the second code or from the id), hair and beard as drawn, grey from the years, the body, scars from wounds, dress and gear, stance, the head's turn. Everything that looks random is a stream seeded by the person's id and a channel name. Never `A.rand`, `Math.random` or the clock.
3. **The picture** (`A.V2.figure.compose(look, { crop, width, tier, ... })`): one SVG. The same look and options give the same string, byte for byte.

**Sizes.** `PORTRAIT.svg(p, size, opts)` keeps its meaning: under 120 px or `opts.bust` a square (to 40 px the head and collar; to 119 px head and shoulders; larger, the bust); from 120 px a picture two by three, cut like a profile card (down to the hands and the belt). `opts.figure` gives the whole standing figure (one by two), for the Profile tab to come. The light and depth passes run on large pictures only; a 46 px portrait also leaves out what is too small to see and is written in whole millimetres.

**The page never holds a figure.** A figure is hundreds of shapes; sixty of them as inline SVG cost a third of a second at every redraw (measured). `PORTRAIT.svg` returns a small frame (one `<svg>` with one `<image>`, about 500 bytes), and the picture behind it is made once, off the press: look, compose, the SVG drawn on a canvas at the screen's density, one PNG kept. A queue makes one picture per turn of the event loop, newest request first. Until its picture is ready a frame shows a stand-in in the sitter's own colours (or the picture that person had a moment ago), and takes the finished picture the moment it is done. `UI.FIG.idle()` resolves when the queue is empty (tests and screenshots wait on it); `UI.FIG.inline(p, size, opts)` gives the whole SVG at once (the share card, sheets, tests). Pictures are kept by look (600 of them, the oldest freed first), so a redrawn list is a lookup and two redraws never draw twice.

**The dead** are drawn with their eyes shut and their colour drained, on a grey ground.

## Faces (`A.LOOKS`)

- A face is the game's 23-character code (`src/people/engine/face.js`), kept in `p.app.g`. Everyone born or made gets one in `A.genAppearance`: from the parents' codes by group (inheritance, so children take after their parents), or round their people's mean. Elves, dwarves, orcs and giants lean their own way (`PEOPLES` in `look.js`: ears, jaws, tusks, frame).
- A face has its own stream, seeded by the person's id: the world's dice do not move, so a seed plays the same world as before.
- **Old saves.** On load, everyone without a code gets one (`A.LOOKS.migrateAll`), in birth order, leaning by the appearance the save does hold: the old creation screen's face shape, brow, mouth, nose and eye choices, and the build. The same save gives the same faces every time. No save version changes; a journal still replays.
- A second code of 11 characters, `p.app.g2`, holds the eleven features the drawn head added and the seven measures of the build (D-036). Only a face made by hand stores it; everyone else's comes from their id. `app.hs` and `app.bd` hold a hand-picked hair style and beard as drawn.

## The maker

On "Body & face": six pages (face, eyes and brows, nose and mouth, hair, skin, body), 52 sliders with words at their ends and no percentages, 49 named shapes to start from, 29 hair styles as thumbnails of your own face, 11 beards, ten named frames, "Surprise me", the face you will grow into at four ages, and the face code to copy or paste (checked character by character). The picture beside the controls is redrawn at every step of a drag. It writes only the creation state; the new life starts with what was made.

## Gear, by item

`wardrobe.js` holds one row per item id of the game (`GEAR_ART`): the drawn piece and its two measures, **make** (0 crude to 3 masterwork) and **rarity** (0 common to 3 legendary). The sheet passes each carried thing as `{ id, kind, make, rarity }`; a stored item that carries its own make and rarity is drawn with them. A new item (E2) is one call: `A.V2.figure.registerGear('id', { art: 'sword', q: 2, r: 1 })`. An armour is drawn piece by piece (a full harness is 14 plates, each its own item and layer). Legendaries' own designs come with E2.

## Budgets (measured by `fgBudget`; see the test's detail line)

Compose a list portrait: under 6 ms. Paint a list portrait: within 16 ms. A large portrait with its light and depth passes is measured and made once, off the press.

## Not done here

A fighter in a duel no longer stands on guard (the retired renderer's `guard` pose; the library has ten stances, none with a raised blade). War paint and jewellery (`app.paint`, `app.jewel`) are not drawn yet. Bows, quivers and mounts have no art. Cultures change headwear and dye, not yet the cut. Infants are small children, not yet their own drawing. The Profile tab (work item P) will show the standing figure.

## Tests and pictures

`test.mjs`: `fgDeterministic`, `fgPure`, `fgEveryPeople`, `fgEscaped`, `fgBudget`, `fgOldSave`, `fgMaker`, `fgGearByItem`, and two carried over from the retired renderer's tests, `fgAxe` (no accessibility fault on the life screen, the profile, a person's page and the maker, every frame a named image) and `fgCreateSkin` (the skin picked in the maker is the skin stored and drawn). `tests/v2/figure.test.js`: ten unit tests of the library (one look one drawing, a sweep of some 400 people at four sizes, the second code, the old-save lean, gear by item, escaping, the dead).

Before and after, at 1366 and 420 wide (creation, the life screen, the profile, a person's page), and a cast of the game's own people at twice the pixels: `docs/design/demo-2d/c8b/`.
