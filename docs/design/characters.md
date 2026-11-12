# Ardan character design: faces, bodies and dress (C8a, the 2D plan)

*Stamped 2026-11-12 17:27 ET · work item "C8 2D" · by Fable at maximum effort · for the owner's approval at the two gates of §15 · supersedes the version of 2026-11-12 11:48 ET (the painted 3D likeness, commit `e7d199d`) · follows D-024 with D-015 and D-020 (game rule 14, order 24)*

The owner's choice after the demos (D-024): a detailed 2D illustrated style, from a large library of hand-designed parts. Everything else D-015 and D-020 set still holds.

**The plan in short.**
- **The look:** an inked and toned illustration: a line of varying weight, flat colour, three tones of shadow and a highlight, real proportions (§1).
- **Parts that bend:** each part is several drawings of one build, and the 39 features blend between them. Nothing is a fixed stamp (§2, §3).
- **Your face is yours:** every feature set by hand; a face is a short code; children inherit it. `src/people/engine/face.js` is kept (§4, §10).
- **Lives show:** infants, children and elders are drawn as themselves, and blended by age. A wound redraws the part it struck (§5, §7).
- **Hair is locks:** 38 styles, each an outline first, then layered locks (§6).
- **Dress is pieces:** layered garments and armour, detailed to the rivet; readable at 46 px, rich at full size, yours to change (§9).
- **The cost:** 1 to 18 ms a portrait, drawn once and kept as an image (§12).
- **First, two looks for the owner:** four finished portraits, then a demo page and ten sheets (§15).

## 0. What was measured and learned

**The 3D demo** (H-009). The face code gave 20 distinct people. But people were CG mannequins, hair was a shell, babies were small adults, and a portrait took 230 to 1,150 ms. The lessons: a surface computed from numbers has no designer in it; hair offset from the skull is a helmet; an infant is a different drawing, not an adult scaled down.

**A 2D probe** (a throwaway script; headless Chromium here, software canvas; random Bézier shapes sized like a portrait's).

| Shapes, drawn at | Draw | At 4× throttle | As PNG, as WebP |
|---|---|---|---|
| 120 at 64 px | 0.4 ms | 1.4 ms | 6 KB, 2 KB |
| 450 at 96 to 192 px | 1.7 to 3.0 ms | 11 to 13 ms | 16 to 40 KB, 5 to 11 KB |
| 1,400 at 256 to 480 px | 13 to 15 ms | 44 to 72 ms | 90 to 197 KB, 22 to 49 KB |

Encoding took 0.4 to 8 ms; blending 40 drawings, 0.6 ms. The same shapes as an SVG file in an `<img>` were 38 to 443 KB and 4 to 35 ms to decode. Sixty inline SVGs of 450 shapes took 141 ms to mount; as images, 29 ms. Random shapes are the worst case for file size: the demo measures real portraits.

## 1. The register: an inked and toned illustration

Real anatomy, drawn: not anime (eyes, noses and mouths are their true size), not a render.

**Line** (in §2's units; at full size a unit is about 0.6 px).
- A line swells and tapers: a centre line with a width at each node, filled as a shape.
- The outer contour is 5 units, tapering to 2; form lines (nose, lids, lips, folds) 2 to 3; detail lines (creases, strands, stitches) 1 to 1.5.
- It is heavier on the shadow side, and breaks on a lit edge.
- It is never black: each colour has a line colour, a deep version of itself. The brief's ink `#1b1730` is kept for the lash line, pupil, nostril and the parting of the lips.
- At small sizes the contour holds 1.1 device pixels, and detail lines are left out.

**Shading:** layered flat shapes, drawn by hand for each part.
- Five values a colour: highlight, light (the local colour), half-tone, shadow, deep.
- Cast shadows have a hard edge: the nose's, the brow's, the chin's on the neck, the hair's on the forehead.
- Where a form turns, a half-tone band sits between light and shadow. There are no blur filters.
- Cheeks, nose and ears are redder, by a two-stop gradient inside the shape.
- At full size, short tapered strokes feather a shadow's edge, as an inker would.

**Light.** One window, up and to the left. The head turns a quarter toward it, so the near cheek falls into shadow. Shadows cool toward indigo `#3a2f6b`.

**Palette** (`data/palettes.json`). Each ramp is five hand-picked values and a line colour; none is computed, because a darkened skin is a muddy skin. There are 12 skin tones, 18 hair colours, 12 eye colours, 24 dyes from earths to scarlet and purple, and 5 metals with hard-edged highlights. A test holds eyes, nostrils and lip line at 2.5:1 against the skin round them (1.16:1 today, V15).

**References, in words.**
- **Layered strategy-game portraits** (*Crusader Kings II*, *Battle Brothers*): a face assembled from drawn layers, with armour and injuries on the bust. Theirs are stamps; Ardan's bend.
- **A detailed graphic novel** (Bourgeon's *Les Compagnons du crépuscule*, Foster's *Prince Valiant*): a sure contour, flat colour with one or two tones, researched medieval dress.
- **A character designer's model sheet** (Akihiko Yoshida, *Tactics Ogre*): muted earths, every strap accounted for.
- **Holbein's portrait drawings** for likeness from an outline; **Dürer's self-portraits** for one face through age; **Angus McBride's plates** for a soldier's kit.

**One view.** A three-quarter bust: each further view would need the whole library drawn again, so front and profile are dropped. A foe in a duel is mirrored, with every wound moved to its true side (§7).

## 2. How a portrait is made

**The artboard** is 1,000 by 1,200 units for a bust. A unit is half a millimetre of the average adult: a head 152 mm wide is 304 units. Coordinates are whole numbers.

**A part** is one feature as a stack of layers: a nose is its ridge line, tip, wings, nostrils, form shadow, cast shadow and highlight. A layer names a colour role (`skin.shadow`, `hair.line`), never a hex value, so one drawing serves every skin.

**Parts bend: masters.** A part is drawn several times with the same layers and nodes: once as the base, and once at each end of each feature that shapes it. Each drawing is a master. The part on screen is the base plus each master's difference times its slider, as a variable font blends weights:

`point = base(age, sex) + Σ slider × strength(age) × (master − base) + build + expression + wound`

- A slider's two ends are separate masters: a hooked nose is not a scooped one upside down.
- Where two features collide (long and hooked), a corner master corrects the blend.
- Shadows and highlights are layers of the part, so a hooked nose casts a hooked shadow.

**Parts are placed: anchors.** The head carries about 70 named points (pupils, nose root, mouth corners, scalp line, jaw line) and the bust about 40. They bend with the masters, and other parts hang on them. Six features need no drawing: eye spacing, tilt and size, ear size, mouth width and the upper lip's length move, turn or scale a part.

**Things worn follow.** Hair, beard, wounds, age lines, garments and armour are drawn once, each node tied to one or two anchors, so they go with a broader jaw or narrower shoulders.

**Level of detail.** Every layer is tagged 0, 1 or 2. Level 0 is the outline, the main tones and the station's cue. Level 1 adds every feature. Level 2 adds strands, stitches, rivets and feathering.

**The result** is a display list: shapes and colours in order, as plain numbers. A canvas draws it in the game; an SVG writer draws it for sheets, tests and the share card.

## 3. The part library

"Drawings" counts masters and variants, each authored by hand (§11).

| Family | Shaped by | Drawings |
|---|---|---|
| Head: skull, jaw, cheek, form shadows, anchors | 8 skull features, bulk, neck, age, sex | 32: man, woman; ages 0, 2, 6, 12; 2 elders; 16 feature ends; 4 gaunt and heavy; 4 corners |
| Eyes, near and far (the far eye is drawn, not copied) | lids, depth, age, state | 22: each eye's base, 4 ends, child, old, shut, narrowed, wide, smiling |
| Brows, near and far | ridge, shape, weight, age, expression | 24 |
| Nose | 5 nose features, age | 17: base, 10 ends, 3 corners, infant, child, old |
| Mouth and chin | lips, bite, width, age, expression | 16 |
| Teeth; ears | age; set | 4; 7 |
| Skin: 12 sets of age lines; freckles, moles, stubble | age, temper, hash | 16 |
| Other peoples: elf, dwarf, orc, giant | masters over the human set | 20 |
| Bust and figure | frame, bulk, legs, neck, sex, age | 44 |
| Hair (§6) | style, fringe, texture, hairline | 38 styles, 10 coily redraws, 5 fringes |
| Facial hair | kind, growth | 14 |
| Wounds (§7) | kind, place, years | 40 |
| Dress (§9) | station, culture, wealth, role, era | 160 pieces; 45 for the North and its soldiers |
| Small parts and patterns | material, wealth | 60 |

About 520 drawings. A portrait is 150 shapes at the smallest size, 500 on cards and lists, 1,500 at full size.

## 4. Features and inheritance (kept)

`p.app.g` is 23 characters (138 bits) holding 39 features, each from −1 to +1; the ends are the real human range. `face.js` holds each feature's steps and words. The player sets every one by hand (§10), and nothing rolls over the player's choices.

- **Skull:** face length (127 mm, 14 less or more), jaw width (108, 20), jaw shape, chin, chin width, cheekbones, forehead, cheeks.
- **Eyes and brows:** size (30, 3.5), spacing (63, 7), tilt, lids, depth; brow ridge, shape, weight.
- **Nose:** length (51, 10), bridge, tip, width (35, 7), tip shape.
- **Mouth and ears:** width (52, 9), lips, upper lip, bite; ear size (63, 9), ear set.
- **Twelve more:** hair texture, thickness, hairline, balding, grey onset, beard growth; frame, bulk, legs, neck; freckles, moles.

**How faces are made.** Features fall round a people's mean (`data/looks.json`); then three to five are pushed near an extreme, so every face has a signature. Asymmetry is 2 to 4 units on the anchors, hashed from the id. A written description sets height, build, hair and scars (`A.LOOKS.fromWords`).

**Inheritance.** Each of seven feature groups is the father's four times in ten, the mother's four in ten, a blend otherwise. Mothers carry balding and beard growth. Nothing a life did is inherited (V21). `takesAfter(child)` says it: "Her father's jaw, her mother's eyes." `parentsFor(you)` draws your family to fit your face (the owner: yes), never the reverse. Features come from their own seeded stream; the world's dice do not move.

## 5. Growth, age, sex, height and build

**Drawn at key ages, blended between.** The head, eyes, nose, mouth, ears and body each have a base drawn at birth, 2, 6 and 12, as a grown man, a grown woman and an elder. A person's base is blended along the growth curves of `data/looks.json` (stature from WHO medians; the head grows early), in human-equivalent years: an elf of 350 shows 50.

| Age | Height, heads tall (a boy who will be 172 cm) | The drawing |
|---|---|---|
| Birth | 49 cm, 4 | a large braincase; eyes below the half-way line; a button nose; a small chin; no neck |
| 2 | 86, 5 | a longer face; milk teeth; the neck shows |
| 6 | 114, 6 | the braincase nearly grown; a gap in the front teeth |
| 12 | 148, 7 | the nose's bridge risen; baby fat gone |
| 18 | 172, 7½ | the grown set; a man's jaw and brow finish by 20 |

- **The eye hardly grows.** The iris is one size from two, so children are big-eyed with no stylising.
- **A face comes in.** `strength(age)` holds a child's signatures back: skull and jaw from a quarter at birth to full at 18. Babies look alike; a boy grows into his father's nose.
- **Sex** grows from nothing at 11 to full at 17 (girls) or 19 (boys), as a blend of the two grown bases: a man's heavier brows, square jaw and thick neck; a woman's finer brows, tapered jaw and fuller lips.

**Growing old.** The elder masters carry the form; the line sets carry the skin.
- **Form,** from 45: lids hood, the cheek slides into jowls, lips thin, the nose's tip drops, ears lengthen; past 75 the neck cords.
- **Lines.** Twelve sets, each drawn once (forehead, frown, crow's feet, nose to mouth, jowl, neck). Each starts at an age hashed from the id, the first at 30 to 44, and lengthens and thickens from its middle. The years deepen a line; they never move one.
- **Teeth and height.** From 50 some teeth are lost. A man loses 5 cm by 80; `heightFraction` gains this.
- **A hard life shows.** `A.LOOKS.wear(p)` ages a face up to a fifth faster for years in the sun, at arms, in hunger or in prison.

**Height and build.** In the figure everyone stands in one doorway. In a bust the eye line moves from 30% of the frame (195 cm) to 44% (150 cm). Build is frame, muscle and fat; it drives the bust's masters and the head's gaunt and heavy ones. The figure has one stance and a second arm pose: six stances would need every garment drawn six times.

## 6. Hair

**An outline first.** Each style starts as a black shape that must be told from the other 37 at 46 px. Locks then fill it.

**A lock** is a guide curve with a width at root, middle and tip, rooted at a place on the scalp line with a lift off the skull, so a style fits every head and age. It is five layers: a ribbon in the hair's light; a shadow where it lies under its neighbour; a highlight band at its own height, so the sheen breaks lock by lock and is never a ring; two to five strand lines (level 2); a contour on its outer edge only.

**Three depths:** back hair behind the neck, crown hair over the skull, front hair over the forehead, ears and cheeks, each casting a shadow.

**What stops the helmet.**
- The outline is drawn, not offset. Loose styles have at least four tips that break it, and gaps where air shows.
- The lift varies: high at a parting or a crest, flat where hair is tied.
- The hairline is short root strokes, never a hard edge. Its shape (low, straight, peaked, high) is four masters.
- Long locks have their tips tied to the shoulder anchors. A hat hides only the roots under it.

**Texture.** Wavy and curly bend each lock's guide by a fixed wave. Coily hair grows out, not down, so ten loose styles are redrawn for it as rounded masses with a scalloped edge. A braid is one plait repeated along its guide.

**The catalogue.**
- **38 styles:** 8 short (shaved, bowl, side-part, tonsure), 8 medium (bob, shag, half-tied, mop), 8 long (loose, tails, mane, side braids), 10 bound (braids, crown braid, buns, topknot, tight rows, locks), 4 shaped (crest, undercut, a fringe round a bald crown). Each is 12 to 40 locks.
- **Five fringes, four textures.** Thickness sets each lock's width, lift and number.
- **14 kinds of facial hair,** from stubble to braided beards: locks rooted on the jaw line.
- **18 colours.** Grey is never picked: it starts at the feature's age (26, 34, 42 or 52) at the temples and comes lock by lock. A lock once grey stays grey.
- **Balding** (men, by feature): a mask at the temples, the crown or both grows with age; locks rooted inside it go.

## 7. Wounds and scars

**A wound redraws the part.** It is never a mark laid on top, and never inherited.

1. **Wound masters** change a part's form, on top of whatever the features gave. A broken nose sets the ridge and its shadow to one side with a knot; a second break flattens it. A cut through a lid notches it; through a lip, steps its edge. A burn pulls a mouth corner, a lower lid or an ear's rim.
2. **Swaps.** A lost eye is the shut eye, sunk; or a patch on a cord; or a milky eye left open. Half an ear is the ear cut short.
3. **Skin layers,** tied to anchors. A cut is one of five profiles, its length, angle and bend hashed from the id and the wound. It is a pale ribbon with a thin shadow on one lip and a highlight on the other, so it reads as a trough. A burn is a mottled patch with a ridged edge; pox is pits; an arrow leaves a puckered star.

- **Hair gives way.** A cut through a brow or beard removes the hairs rooted in its band.
- **Healing.** Stitched while fresh (`BM.fresh`); red for a year; pale by the third; never gone.
- **Small sizes.** A scar is never under 1.2 px on cards and lists. At the smallest size only what changes a whole feature shows: a shut eye, a bent nose, a burn's colour.
- **Both ways round.** Each place has a near and a far drawing, so a mirrored scar stays on its true side.

**The rules** (kept).
- **One writer.** `A.addWound(p, k, o)` gains `o = { at, y, src, n }`: a place (eleven on the head, left or right, and ten on the body), a year and the field. Battles and duels pass the place of the blow; a caller that passes nothing gets a hashed place, with no new dice.
- **What a scar costs** (the owner: mostly looks). Nine marks in ten cost only looks. One in ten is an eye, a knee or a hand and costs a little (`lost_eye`, `bad_knee`, `lost_fingers`, `stiff_hand`; X4 keeps them small).
- **NPCs fight too.** `A.LOOKS.seedScars(p)` gives veterans 0 to 4 dated wounds at world creation, from its own stream.

## 8. Expression and bearing

Expressions are masters of the eyes, brows and mouth. Each of the 40 traits moves up to three of eight channels (brows, lids, gaze, mouth corners, lip press, head tilt, shoulders): the resting face lists show. Mood moves them a little on the profile and cards. They are a sitter's faces, and small (V10).

## 9. Dress

Six axes: **station** (the cut), **culture** (a family of cut, plus one mark), **wealth** (the finish), **role**, **occasion** and **era**. One pure function, `UI.DRESS.kit(p, ctx)`, reads `data/dress.json` and returns pieces by slot, head to feet.

**A piece** is drawn once, on the base body, and follows every build by its anchors.
- **Layers in order.** Shirt, tunic or gown, padded coat, mail, plate, surcoat, belt, cloak. Each is clipped where the next covers it, and casts a shadow on the one under it.
- **Cut and cloth are separate.** A piece is its outline, its seams and two sets of folds: few and broad (wool, fur) or many and fine (linen, silk). The material picks the set, the ramp, the pattern and the edge (clean, frayed, fur), so one tunic serves sackcloth and fine wool.

**Small details, at three sizes.** Nothing finer than 1.5 device pixels is drawn as itself; it gives way to its coarser look.

| Detail | Full size (level 2) | Cards and lists (level 1) | Smallest (level 0) |
|---|---|---|---|
| Mail | a tile of linked rings, each an arc with a glint; the form's shadows over it | rows of dashes with a sparkle | grey, a few glints |
| Plate | three hard bands a plate (sky, horizon, ground); hinges, straps, dents | bright shapes, dark joints | a bright mass |
| Rivets, buckles | a rivet's lit head, repeated along a path; a buckle's frame, tongue and plate | dots; a glint | none |
| Embroidery | one of 16 motifs repeated along collar, cuff and hem | a band of colour | a line |
| Heraldry | the house's arms (`PORTRAIT.coat`, `charges`) fitted to surcoat or shield, folds over them | the charge | its two colours |

**Station** (the North's pieces; each family supplies its own):

| Station | Cloth, cut and head indoors | The cue at 46 px |
|---|---|---|
| Slave | undyed sackcloth shift; shorn | neck ring, bare collarbones |
| Serf | coarse undyed wool, patched; coif or straw hat | patches, cream and grey |
| Peasant | dull tunic over a shirt; hood down | hood roll, earth colour |
| Artisan | good plain wool, an apron; flat cap | apron straps, guild badge |
| Merchant | long gown, fur-edged collar; big soft hat | the hat and the fur edge |
| Gentry | fitted and buttoned, one bright colour; feathered cap | button line, sword-belt strap |
| Noble | patterned cloth in the house's colours, fur mantle | fur shoulders, a jewel by rung |
| Royal | ermine, cloth of gold; the crown for the ruler alone | ermine and gold |

- **Culture families:** North, Court, Highland, Desert, River and coast, Savanna, and the elder peoples' own. Each culture's `dress` key (C7) names a family and one mark.
- **Wealth and era.** Wealth changes the finish, never the cut: a ruined noble wears a noble's cut gone threadbare, frayed and patched. Each family has three cuts, forty years apart; a person wears the cut of the years they came of age.
- **Soldiers** (D11; V7) wear their own `p.gear`: every armour, helm, shield and cloak in `GD.GEAR` has its drawing. Cues at 46 px: a levy's kettle hat; infantry's grey mail and shield strap; an archer's fletchings; cavalry's surcoat and charge; a knight's bright shoulders and own arms.

**Your wardrobe** (the owner: right by default, and yours to change). NPCs always wear the kit. The player has five outfits, each starting as the kit's. In `UI.wardrobe` every slot can be changed: the garment, among those your people, station and purse allow; its dye and trim; hat, cloak and jewellery. You may always dress below your station; above it a garment needs a right to it, or shows locked with the reason on click. Armour keeps its numbers.

The kit also gives the words for B4: "A russet tunic over a linen shirt, hood thrown back."

## 10. The creation screen: customisation first

It replaces `UI.crStepBody`, under one line: "This is the face you will grow into."

- **The picture:** the bust, large and live; the figure in the doorway; an age strip (0, 6, 12, 18, 30, 50, 70) showing the hairline, the grey and the lines to come.
- **Every feature has a control:** 49 in all (5 today), in seven tabs of at most eight controls a page (B5): Start (sex, name, 12 designed faces, take after a parent, surprise me, paste a code), Face, Eyes and brows, Nose and mouth, Hair, Body and skin, Dress.
- **How it handles.** Click the nose and its page opens. Sliders have words at their ends and no percentages. The bust redraws on every step of a drag.
- **Rules.** A description opens on click. A pasted code is checked character by character, and the preview is pure.

## 11. How the art is made

**What is realistic here.** No illustrator works in this repo. Agents write the art as coordinates, and agents can look at what they drew. Two rounds of drawing by code (`anime.core.js`, the 3D demo) came out generic, so the method changes.
- **Art is data, not code.** One drawing is one file, made on purpose. The engine only blends and places.
- **Look, then correct.** Every drawing is rendered to a sheet across its sliders and ages, against a model sheet, and a second agent critiques it before it is kept.
- **Open to a human hand.** The files import from and export to plain SVG, so the owner or a hired illustrator can redraw any master in any editor.

**Files.** Source is readable JSON, `assets/parts/<family>/<name>.json`: layers of whole-number points (a curve is nodes with two handles; a line adds a width), roles, level tags, anchor ties, and masters as differences from the base. `tools/parts/pack.mjs` packs it into `data/parts/*.json`, which the build puts on the page. The packed files are generated and never edited, like the v2 bundle.

**Tools** (`tools/parts/`, small, plain JS).
- `sheet.mjs`: any part across its masters, sliders and ages, as SVG and PNG. The agents' eyes.
- `lint.mjs`: masters match their base; shape budgets by level.
- `editor.html`: one offline page of about 700 lines: a reference under the part, nodes to drag, sliders to scrub. For human hands; agents edit the files.

**Outside image AI** (order 14 allows it; no key is saved yet). Its realistic use here is reference, not art.
- It makes model sheets in this register: heads at the key ages, the 38 hair styles, plates of kit. They go to `docs/art/reference/` with their prompts, are named in HISTORY, and never ship. Agents draw the masters over them.
- Automatic tracing serves only single outlines (a hair mass, a garment's edge). A traced face is a heap of blobs with no layers and no matching nodes, and cannot be a master.
- The first gate does not wait for a key. If the style frame fails by eye, references become step one of the second try.

**Models** (D-009). The face's masters and all critique: Fable at maximum effort. The engine: Opus. Hair, garments and small parts: Sonnet, in lots that each pass their sheet.

## 12. Rendering

**Pipeline** (plain JS, no libraries): `UI.PT.look(p, ctx)` turns the person into numbers; `A.V2.draw.compose(look, tier)` blends the masters, places the parts and returns the display list; a canvas draws it; the page gets one image.

| Tier, shown at | Drawn at (device px) | Crop | Levels, shapes | Draw budget | Kept as |
|---|---|---|---|---|---|
| S, to 40 px | 64 | head and collar | 0; 150 | 1 ms | 3 KB |
| M, 41 to 100 | 96, 144 or 192 | head and shoulders | 0 and 1; 500 | 4 ms | 5 to 12 KB |
| L, over 100 | 256, 384 or 480 | bust | all; 1,500 | 16 ms | 20 to 50 KB |
| Figure | 400 × 600 | the whole body | all; 1,600 | 18 ms | 40 KB |

The budget is §0's probe plus 1 ms to compose. Kept sizes are WebP estimates. A portrait is one node on the page, not 500 (P15).

**Never a wait.**
- **Sliced.** A queue draws portraits and gives the page back every 6 ms. A list of 60 fills in about a quarter of a second. An L portrait is drawn 300 shapes at a time, so no task passes 50 ms on a slow phone. No worker is planned.
- **Stand-in.** Until its picture is ready a portrait shows a flat shape in its skin, hair and dress colours. If drawing throws, the stand-in stays and `UI.PT.errors` counts it.

**Delivery.** One `<img>` with a blob URL (the CSP allows `img-src blob:`). `PORTRAIT.svg` keeps its name and returns that tag, so its 29 call sites change only styles and tests.

**Cache.** The key is the look: a hash of the numbers `UI.PT.look` returned, and the tier. Kept pictures are bounded at 16 MB (8 MB on a phone), least recently used out first. A person's blended points at an age step are kept, so three tiers share them.

**Determinism.**
- **From the id.** Every choice that looks random is a hash of the id and a named channel: never `A.rand`, `Math.random` or the clock.
- **The same list everywhere.** Composing uses whole-number points, add, multiply and a fixed table of waves. One look gives one display list in every browser, and a test hashes it. Pixels may differ at an edge between browsers; nothing drawn is read back into the world.

**Purity.** Drawing reads the person once and writes nothing. The page receives pixels. `renderRng` and `replayWithRender` keep running.

## 13. Cost, and old saves

- **A person's look:** about 166 bytes (179 today): `g` and the fringe in, the five old face values out. Dress, expression, age and wear are derived.
- **The page:** the packed parts within 600 KB and about 60 KB of engine, in place of 271 KB of renderers that retire. A test holds both.
- **Old saves.** `A.SAVE_VER` goes up by one, and a new step of `A.V2SAVE.upgrade` calls `A.LOOKS.migrateAll(S)`: people in birth order, so children inherit; the five old values lean the features, so a face you chose keeps its character; wounds get places by hash. The same save always gives the same faces, and the sample saves in `tests/saves/` must load with everyone drawn.

## 14. Files and functions

- **Kept:** `src/people/engine/face.js` and its tests (`A.V2.face`); the 3D demo's face-maker controls (`maker-ui.js`).
- **The engine** (plain ES modules that touch nothing of the page): `src/ui/engine/draw/` with `parts.js`, `rig.js` (growth, anchors), `morph.js` (masters), `hair.js`, `wounds.js`, `dress.js`, `compose.js`, `svg.js`, `canvas.js`; `tests/v2/draw.test.js`. On the page as `A.V2.draw` once the owner approves the demo.
- **Art and data:** `assets/parts/`, `data/parts/`, `data/palettes.json`, `data/looks.json`, `data/dress.json`.
- **In the game:** `src/people/99993-v2-looks/` (`A.LOOKS`, `A.addWound`, migration); `src/ui/93-portraits/` (the look, cache, queue, image tag, creation screen, `UI.DRESS.kit`, `UI.wardrobe`).
- **To `archive/`,** each with a note and its last commit in HISTORY: the 3D path (`anatomy.js`, `basemesh*.js`, `src/ui/engine/paint/`, `docs/design/demo/`) to `archive/c8-3d-render/` when the 2D demo replaces it (D-024); `93-anime-portraits` when 93-portraits serves every call site; `63-miniature-portraits` and the paper dolls at C8c.

## 15. Acceptance

Nothing is built into the game before the owner has said yes at both gates (order 24). Both are made from the engine modules and `assets/parts/` alone, in `docs/design/demo-2d/`: nothing in `src/ui`, no state, no saves.

**Gate 1: the style frame** (`style-frame.html`, `sheet-style.png`). Four finished portraits: a man of 32 in mail, a woman of 27, a girl of 6, a scarred man of 71. Each is shown at 480 px and at 46 px, in two finishes: line-led (a heavier contour, two tones, feathering) and tone-led (a fine line, all five values). The owner picks one, or says what to change. It is the cheapest test of the largest risk: whether this hand is good enough. Its drawings become the first masters.

**Gate 2: the demo.** `node docs/design/demo-2d/build.mjs` writes `characters.html` (one offline page, under 1.5 MB) and ten sheets.

- `parts`: the library as a model sheet: each family's masters; a nose, an eye and a mouth swept across their sliders.
- `faces`, `kin`: 20 men and 20 women of one people, bare-headed in one shirt, at 150 px; two parents and four children.
- `ages`: a man and a woman at 0, 1, 3, 6, 10, 14, 18, 30, 45, 60, 75 and 90.
- `scars`: one veteran before and after: a cut through the brow, a broken nose, a lost eye three ways, a burn, pox; fresh and at twenty years; mirrored.
- `builds`: 150, 172 and 195 cm in the doorway; gaunt to heavy; slight to broad.
- `hair`: the 38 styles as black shapes at 46 px, and drawn; eight in four textures; greying; balding; the 14 beards.
- `outfits`: the eight stations of the North, a levy, an archer, a man in mail and a knight with his arms, at full size and at 46 px.
- `details`: at 240 px and at 46: mail, plate and rivets, a buckle, embroidery, fur, a surcoat's charge.
- `sizes`: six people at 32, 46, 88, 150 and 240 px.
- The face maker: every control of §10, the age strip, hair, wounds and outfits to try, each tier's measured time.

**A first reading, before the owner looks.** Playtester agents match the 20 faces to their cropped, beardless selves (pass 90%), name eight age bands (85%), sort beardless men from women at 88 px (95%), find 20 list portraits among the same 20 at 150 px (85%), and name the hair shapes (30 of 38). The owner's eye decides, and the answer goes into DECISIONS.

**C8b and C8c, in the game.** The sheets are redrawn from a built page, and these tests join `tools/check.mjs`:
- `looksLadder`, `faceHand`: each feature's two ends change 0.25% of a 150 px head; 39 of 39 set by hand are kept through a save.
- `partsSane`: 2,000 random faces at six ages have no crossed path and no inverted lid.
- `looksForm`: a broken nose, a shut eye and a cut move the part's own paths by 4 units or more, and nothing elsewhere.
- `hairShapes`: no two of the 38 outlines are alike at 46 px; a loose style's distance from the skull varies twofold.
- `looksBudget`, `looksSame`, `looksBytes`: §12, with no task over 50 ms at four times throttle; one look, one list; §13.
- `dressLayers`, `dressGear`, `dressWardrobe`: nothing is drawn over what covers it; `p.gear` shows on 300 of 300; every slot is kept through a save.
- Kept: `faceSpread`, `faceKin`, `looksTrue`, `looksWounds`, `looksContrast`, `looksWords`, `looksOldSaves`, `renderRng`, `replayWithRender`.

## 16. Decisions, records and risks

**Still for the owner:** the finish (gate 1), then the demo (gate 2); and whether to save a key for an outside image AI, for reference sheets (§11).

**Records to add when approved** (DECISIONS):
- this document, as the plan under D-024;
- one view, with a foe mirrored and wounds on their true side; one stance and a second arm pose, where the last plan had six;
- portraits are images drawn from vectors on a canvas, with §12's budgets; `PORTRAIT.svg` keeps its name;
- art source in `assets/parts/`, packed into `data/parts/` by a tool;
- `heightFraction` loses height in old age, so a number on the sheet changes;
- what goes to `archive/` and when (§14); the image AI, if taken.

**Risks.**
- **The hand.** Agents writing coordinates may again draw something clean and generic. Gate 1 tests exactly that on four portraits, before the library is drawn. The fallbacks, in order: reference sheets from an image AI and a second try; the line-led finish, which forgives more; a human illustrator drawing the masters in SVG through the same pipeline.
- **Blends that go soft.** A shape between masters can turn mushy or kink. Corner masters and `partsSane` answer it; the `parts` sheet shows it.
- **One view** is a real loss against the last plan: the price of drawing every part by hand.
- **Small sizes.** A line can vanish or clog at 46 px. The line floor, level 0 and the `sizes` sheet answer it.
- **Size and balance.** 520 drawings must pack within 600 KB. Seeded scars shift a few veterans' fighting worth, so the balance run must pass.
