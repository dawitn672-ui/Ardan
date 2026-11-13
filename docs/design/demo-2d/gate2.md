# Gate 2 of the 2D character art: the people, drawn by a parts library

*Stamped 2026-11-13 06:40 ET · work item "C8 2D", gate 2 · by Fable 5.2 at maximum effort · for the owner's eye before anything is built into the game (order 24) · follows D-029 and the owner's two reference sheets (`docs/design/reference/`), the order "face and build design should have significantly more options", and the answer on armour relayed as D-032 item 7: "As detailed as possible. Every single element of it."*

Open `docs/design/demo-2d/gate2.html` in a browser. It is one file, works from `file://`, makes no network request and ships only the repo's own fonts. Nothing on it is a picture file: every person is a short list of numbers and items, drawn when the page opens.

## What the owner asked for, and what this gate shows

| Asked | Shown |
|---|---|
| Tone-led, after the first reference: full figures in a lineup, each with a stance and a build of their own; manhwa faces; clean thin line with soft tone | **The lineup:** fifteen people to one scale in three ranks (the commons; cloister, levy and court; under arms), nine different stances, builds from a stooped bondman and a child of eight to a housecarl a head taller than the knight |
| The second reference is the target: every person's armour and dress drawn in full and telling their station | Eighteen outfits made of 42 separate items. The third rank answers the second reference in Ardan's own designs: a hooded outrider, a lady knight in black harness, a serjeant in breastplate and kettle helm, a sellsword in red, a northman in bear fur |
| A profile card: name, rank, words; never a percentage | **Fifteen cards:** a closer crop of the same drawing on a painted ground, estate, name, rank, a line about the person, three measures in words |
| A working face customiser, with far more options, and builds | **The maker:** 38 face sliders with words at their ends, 49 named variants (face shapes, eyes, brows, noses, mouths, ears), 29 hair styles shown as thumbnails on the face itself, 14 hair colours, 11 beards, 10 skins, 10 eye colours, 9 scars (either side, fresh or healed), age 4 to 90, 6 heights, 10 named builds and 7 build sliders, 10 stances, head turn, 18 outfits, 26 dyes, 12 kinds of headwear, cloak, sword and shield, and the make and rarity of the arms. Every change redraws the portrait and the full figure at once. "Surprise me" rolls a stranger from a seeded stream. The game's 23-character face code is shown and can be pasted back |
| The same face at four ages | A section (Alys and Wat at eight, seventeen, thirty-four and sixty-eight) and a live strip under the maker |
| Gear as separate, swappable layers keyed by item and quality; armour as detailed as possible, every element its own piece; two measures, make and rarity | **Gear as layers:** one sword in all sixteen pairings of make (crude, plain, fine, masterwork) and rarity (common, rare, epic, legendary); one shoulder piece on both measures; one man in three kits; and a knight armed in eight steps, each piece its own item and layer |

Scars: Wat (a fresh cut on the cheek, stitched), Tam (a forge burn), Aldric (a cut through the brow, a broken nose), Renn and Brenna (a split lip), Halvard (forehead and jaw). In metal harness: five of the fifteen (Wat, Edric, Ysolde, Aldous, Brenna); two more in leather (Renn, Halvard).

No outside image AI was used (no key is saved). The two reference sheets set the direction only; no figure, face, device or layout in them is copied. The devices (sun, tower, antlers, star, crescent, tree, chevron) are Ardan's own.

## Files

In `docs/design/demo-2d/`:

- `gate2.html`: the page (345 KB: 149 KB of script, the rest the four fonts).
- `gate2-lineup.png`, `gate2-cards.png`, `gate2-customiser.png`: 1366 wide at twice the pixels. The first two are over 3 MB lossless, so they are stored at 256 colours, dithered; the page itself is the true picture.
- `gate2-customiser-hair.png`, `-body.png`, `-dress.png`, `gate2-ages.png`, `gate2-gear.png`: further views at once the pixels.
- `gate2.md`: this note.
- `gate2/`: the source.

| File | Lines | What it holds |
|---|---|---|
| `g.js` | 160 | Points, curves, inked strokes, blades; the seeded stream; colour ramps |
| `scene.js` | 61 | Named layers of SVG shapes written out in one fixed order; gradients, clips, patterns |
| `palette.js` | 76 | Data: skins, hair, irises, dyes, leathers, furs, metals |
| `rig.js` | 110 | Age, sex, height and build to joints and widths; the ten stances |
| `head.js` | 295 | The 38 features; the head in its own space; ears, eyes, brows, nose, mouth; the years' lines; scars, freckles |
| `hair.js` | 209 | 29 styles and 11 beards as data; one renderer |
| `gear.js` | 599 | 42 items, 12 kinds of headwear, 18 outfits (lists of items); make and rarity; charges |
| `figure.js` | 56 | `compose(look, { crop })`: one look to one SVG; the crops; the light pass |
| `sitters.js` | 65 | The fifteen people, and their cards' words, as data |
| `page.js` | 206 | The page: lineup, cards, maker, ages, gear sheet, the measuring |
| `build.mjs`, `preview.mjs`, `sweep.mjs` | 247 | Build and screenshots; a look at any sitter while drawing; a sweep of 1,900 drawings |

Also `docs/design/reference/` (the owner's two sheets and their note, copied from the main checkout as told).

```sh
node docs/design/demo-2d/gate2/build.mjs                # the page and every screenshot
node docs/design/demo-2d/gate2/build.mjs --no-shots     # the page only
node docs/design/demo-2d/gate2/preview.mjs --out=/tmp/x.png --who=edric,isaut --crop=card --size=300
node docs/design/demo-2d/gate2/sweep.mjs                # every outfit, stance, hair, feature end; 300 strangers
```

## How the parts are organised

**A look is plain data.** `{ sex, age, height, build: { weight, muscle, … }, skin, eyes, hair, hairColor, grey, beard, g: { jawW: .6, … }, scars: [{ k, side, fresh }], pose, outfit or gear: [{ id, … }], headwear, yaw }`. `compose(look, { crop })` returns one SVG. The same look gives the same string, byte for byte: every choice that looks random comes from a stream seeded by the person's id and a channel name. Nothing calls `Math.random` or the clock.

**The head is set out in its own space.** Every feature is placed in millimetres on a face seen from the front (across, down from the eye line, toward the viewer). One projection (a turn, a nod, a tilt) carries each point to the figure. So a slider moves the true feature, the far eye narrows by itself as the head turns, and no part is drawn twice. The face's keys are the game's own (`src/people/engine/face.js`, read, not changed), plus eleven new ones.

**Growth and age are in the measures.** A table for a grown man, a grown woman and a small child, blended by age: the child's large skull, short face and wide eyes; sex coming in from eleven; then, from fifty, a longer nose, thinner lips, heavier lids, hollows, jowls, and seven sets of lines that each start at their own age. The body does the same: heads tall, leg length, width of shoulder, height lost in old age.

**The figure is a rig.** Height and build give joints and widths; a stance says where each wrist goes and how the weight sits, and the elbow is found. Heights are true to each other, so a child stands at an adult's waist.

**Hair is data.** A style is a cap (the mass on the skull) and groups of locks placed by where their tips fall: a fringe across the brow, tufts past the outline, curtains down the cheeks, a mass behind the shoulders, braids, tails, knots. Each lock is a blade with its own outline, so where locks overlap the line work of the clumps draws itself. Coily hair grows out, with a scalloped edge and turned marks.

**Dress is a list of items, put on in order.** Each item draws one thing on the rig into the layer it belongs to (back, skin, legs, skirt, torso, belt, weapon, arms, shoulder, collar, head, face, hair, headwear, hands, and so on), so the order parts are called in never decides what covers what. Cloth is shared machinery: a body, a skirt with pipe folds and a stepped hem, sleeves of five cuts, creases at the bends. A person's gear can be re-dyed, regraded or swapped piece by piece without touching the rest.

**The harness is every piece on its own.** Padding, mail, mail collar, breastplate, fauld, tassets, cuisses, poleyns, greaves, sabatons, spurs, rerebraces, couters, vambraces, gauntlets, besagews, pauldrons, gorget, helm (kettle, nasal, bascinet with aventail), shield, sword, dagger, belt, baldric, bracers, cloak, fur collar, tabard, chain, amulet, circlet and crown are 30 or so separate items.

**Make and rarity are two measures on every piece.** Make (crude, plain, fine, masterwork) is the smith's care: dull and nicked, clean, edged in bronze, gilt and engraved. Rarity (common, rare, epic, legendary) is what the thing is: its metal (steel, blued, black, sun-steel) and its own shape (the blade's profile, the guard, the pommel, fluting). One function, `mats({ q, r })`, turns the pair into metal, fittings, edging, engraving and rivets, so a new piece gets both measures for nothing.

**Tone is four things.** Each form carries one soft gradient (light on the left edge, shadow on the right). The face has its own soft shapes (the side plane, sockets, under the lip) and a hard jaw shadow on the neck, as the style has. What lies over the body (arms, shoulder pieces, the head, what the hands hold) casts a soft shadow on the body under it. And one pass of light over the finished figure adds a rim on the lit edge, a core shadow on the far edge and a slightly heavier outer line.

## What it costs

Measured by the page itself in headless Chromium (software drawing) on the shared four-core container, across the fifteen people; several runs, so the paint figures are ranges.

| Drawn as | Pixels (at 2×) | Compose: look to SVG | Paint: SVG to pixels | SVG, median (largest) | Shapes |
|---|---|---|---|---|---|
| Lineup figure | 510 × 1310 | 3 to 5 ms | about 90 ms (70 to 120 across runs) | 153 KB (360) | 390 |
| Card | 500 × 612 | 3 to 6 ms | about 55 ms (40 to 68) | 149 KB (341) | 440 |
| Card, plain (no light, no depth) | 500 × 612 | 3 to 4 ms | about 15 ms (15 to 19) | 147 KB (339) | 440 |
| Maker portrait | 860 × 1064 | 3 to 4 ms | about 150 ms (110 to 167) | 141 KB (317) | 442 |
| List portrait, plain | 128 × 158 | 3 to 6 ms | about 5 ms (4 to 8) | 129 KB (302) | 389 |

- **Compose is cheap** and well inside the plan's budget. The maker redraws a portrait and a full figure on every step of a drag.
- **Paint is over the plan's budget** (D-025: 16 ms for a large portrait). A card paints in about 15 ms plain. The light pass (rim, core shadow, heavier outer line) adds about 26 ms and the depth shadows between layers about 13 ms: some 55 ms in all, so tone is nearly three quarters of the cost. A portrait would be painted once and kept as an image, as the plan says, so this is a one-time cost per person and size; but it is real, and it is the first thing to cut. `compose(look, { fx: false })` draws plain; `{ depth: false }` keeps the light pass and drops the depth.
- **The SVG is heavier than it need be.** A close crop still carries the whole figure's cloak, shield and sword. Only the legs (and, closer in, the skirt) are left out today.
- The largest is the knight: 1,134 shapes, 359 KB.

## Checks made

- `sweep.mjs`: 1,900 drawings (every outfit in every stance on a man, a woman, a child and an elder; every hair, beard and headwear; every feature and build slider at both ends; 300 seeded strangers with every option rolled). No throw, no bad number, and each stranger drawn twice gives the same string.
- A scripted pass over the page: every tab, 262 presses of every chip, swatch and thumbnail, 159 slider moves to both ends, every sitter loaded, twelve strangers rolled, a face code pasted and a bad one refused. No page error, no console error, no network request.
- Looked at by eye after each change, about forty times, and corrected: the loop of `characters.md` §11.
- Not done: a playtester agent's pass (a subagent cannot start one), and CI's older Chromium.

## An honest reading against the target

**What is good.** It reads as one hand. Estate and role show at a glance. Builds, ages and heights are clearly different people, not one mannequin rescaled. The faces are in the manhwa idiom (sharp jaw, narrow eyes on the men, a heavy lash line, a hard neck shadow) and stay themselves across ages. The third rank and the knight carry real layered detail, and the gear sheet shows the system under it. As a base to build a game's portraits on, it holds.

**Where it falls short of the two references.** It is still clean vector art, closer to a good visual-novel sprite than to either sheet. The references have a drawn line with life in it and far denser painting. In particular:

1. **Line.** Lines are even and mechanical. Folds are few and procedural; the first reference has dozens of small observed creases per garment.
2. **Painting.** One gradient a form. The second reference has worn metal, layered reflections, cloth with weight, embroidery everywhere. Metal here is bands of light; cloth is flat with wedges.
3. **Faces close up.** Good at card size, plain at full size: eyes have little inner drawing, noses and mouths are a few marks, there is one expression channel (a smile), and the head turns only 18 degrees either way.
4. **Hands and feet.** Hands are mittens with finger lines in two shapes. Feet are one shoe shape.
5. **Stance.** Everyone faces front with a small shift of weight. No low heroic angle, no twist in the body, no overlap between figures.
6. **Bodies under cloth.** Arms and legs are tubes. A bare arm (the smith, the northman) shows it.
7. **Hair.** 29 styles, but several are cousins, and long hair is heavy ribbons.
8. **Armour detail.** Every piece is its own layer, as asked, but each is still simple: no articulated fingers, no visor, no buckles drawn as buckles, engraving is one scroll motif, mail is a pattern that only shows close.
9. **Not done at all:** infants and toddlers, the other peoples, a second view, mounts.

It is past gate 1 by a wide margin in range and in finish. It is not yet "a real character designer drew it".

## How to close the gap

1. **Reference sheets from an image AI** (D-029 allows it; it needs the key). Model sheets of heads at each age, hands, the 29 hair styles and plates of each armour piece in this exact register, then redraw the key parts over them. This is the largest single gain, and it is cheap.
2. **Hand-authored paths for the parts that carry the look:** eyes (six or eight true shapes with their own inner drawing), hands (eight poses), feet, the hair's front locks. The library takes path data as easily as it takes formulas.
3. **A fold library** by garment and stance (drawn fold sets tied to the rig, as the plan's "masters"), instead of one fold rule.
4. **Metal and cloth as materials:** a second reflection, edge wear, dents by make; weave and nap; embroidery motifs by culture.
5. **More of each armour piece:** lames on every joint, straps and buckles, visors and crests, fluting and engraving patterns by rarity. The architecture is ready: each is more drawing inside one item.
6. **Stances with a turn of the body**, a low-angle warp for group pictures, eight to ten more poses.
7. **Expressions:** brows, lids and mouth on four or five channels, driven by trait and mood.
8. **Speed:** cull whole items outside the crop; bake the light pass on a canvas (one blur) instead of an SVG filter; keep small portraits plain.

## What moving it into the game will take

1. **Place.** The modules go to `src/ui/engine/draw/` (replacing gate 1's engine there) or a new `src/people/engine/portrait/`, bundled by `tools/build-v2.mjs` onto the page as `A.V2.portrait`. Palettes, hair styles, outfits and the people's defaults become `data/*.json`; they are data already. The dense one-line style of this demo wants reformatting on the way in.
2. **A person to a look.** One pure function, `UI.PT.look(p, ctx)`: age, sex and height from the body engine; build from the stats; `p.app.g` (the face code) to `g`; skin, hair and eyes from the people's looks; scars from `A.addWound`; outfit from station, job and `p.gear`; stance from role and traits. Rendering stays pure: it reads the person once and writes nothing.
3. **The face code grows.** Eleven new features (temples, chin cleft, iris, lashes, brow set, brow gap, nose projection, lower lip, mouth corners, ear tip, lobes) and seven build features need a place: a longer code, or a second one. A decision.
4. **Delivery.** `PORTRAIT.svg` keeps its name and returns an image tag: compose, paint once to a canvas, keep by a hash of the look and the size, with the queue and stand-in of the plan (§12). The 29 call sites change only their sizes.
5. **Creation.** The maker replaces `UI.crStepBody`: its controls already write the game's keys.
6. **Gear.** Map every `GD.GEAR` id to an item, and give items the two measures in data: `{ id, kind, make, rarity, … }`. The coming items library is rows of that.
7. **Tests** to join `tools/check.mjs`: the sweep as `partsSane`; one look, one drawing; budgets by tier; `renderRng` and `replayWithRender` kept; old saves through `A.LOOKS.migrateAll`.
8. **Retire, to `archive/`:** `93-anime-portraits`, `63-miniature-portraits`, the 3D path, and gate 1's engine and `assets/parts/` (this library does not use them). The budgets of D-025 want restating from the table above.

None of this is started. Nothing in `src/` or `tests/` was touched.

## Questions for the owner

1. **Is this the direction?** If it is, what first: the faces, the richness of armour and dress, or the line and painting?
2. **How ornate should ordinary people be?** The commons here are plain, as their station is; the second reference dresses everyone as a hero. Keep the difference, or lift everyone?
3. **The image AI for reference sheets.** It is the cheapest large gain. May a key be saved through the secure form?
4. **One view.** Front, with the head turning a little. Enough for the game, with the low heroic angle kept for group pictures?
5. **Proportion.** A grown man is 8.3 heads tall here, long in the leg. Taller, as the references, or as it is?
6. **The eleven new face features and seven build features.** May the face code grow to hold them?
7. **Make and rarity.** Four steps of each, and these names? Should rarity change a piece's shape as much as it does here, or mostly its metal?
8. **The card.** A parchment card on the day theme. Is a night version wanted, and are three word-measures the right ones?
9. **Other peoples and the very young** (elves, dwarves, orcs; infants): in this gate's style, and when?
10. **The light and depth passes.** They give the rim, the core shadow and the shadows between layers, and cost nearly three quarters of the paint time. Keep them on large portraits only?
