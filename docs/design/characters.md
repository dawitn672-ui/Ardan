# Ardan character design: faces, bodies and dress (C8a)

*Stamped 2026-11-12 10:04 ET · work item C8a (CRITIQUE §2, item 6) · written by Fable at maximum effort · for the owner's approval; C8b and C8c build from it · supersedes the portrait table of `docs/design/brief.md` §7.1 · plans V1 to V22*

The owner's order (D-011, game rule 12): keep the anime look, far more detailed, as if a real character designer drew it, with many more options for hair, height, facial features and build.

## 0. What was measured

The built game (`index.html`, seed 42, day 0) was driven with Playwright, drawing through `PORTRAIT.svg`. The machine was busy, so read times as ratios.

- **One face.** Twenty men of 30 with the same crop, skin and eyes drew twenty copies of one head. Between the ends of a stored face value, 0.03% (nose) to 1.49% (face shape) of a 120 px bust changes.
- **No age, sex or class.** A man draws the same from 13 to 40. Twelve beardless men and twelve women at 88 px could not be sorted. Serf and peasant share a tunic.
- **No history.** None of 947 living people has a wound, and none is a soldier, priest, serf, slave or merchant. Six of 25 wound kinds change the bust.
- **Words against pictures.** 270 people have a written description. "183 cm and 84 kg" is stored at 155 cm, "a bald crown" draws wild hair, and 42 descriptions mention scars nobody has.
- **Cost.** A look is 179 bytes in 14 keys. A bust is 7.3 KB and about 115 nodes.

## 1. The register: a designer's model sheet

Every portrait should look like a page from an anime production's character sheets: a three-quarter bust in confident ink, flat colour, one hard shadow, a few accents. It stays anime and stops being a gacha banner.

| | Today (`anime.core.js`) | C8 |
|---|---|---|
| Figure | 6 heads | 7¼ (elves 7¾, dwarves 5, giants 8) |
| Head in the bust | 42% of the width | 54% |
| Eye opening | 0.7 of its width | 0.40 (child 0.55, elder 0.30); the lid cuts the iris |
| Nose | a tick 4.5 units long | bridge, tip and wing, 18 to 28 long, with its shadow |
| Mouth | one stroke, 14 wide | two lips, 17 to 28 wide |
| Line | even strokes, an outline filter | tapered strokes in three weights: contour 2.4, overlap 1.6, form 0.4 to 1.2 |
| Shading | one shadow cut by an ellipse | five named shadow shapes; three flat tones a material |
| View | a front face nudged aside | a true three-quarter turn; front and profile on request |

A unit is a hundredth of the skull's width.

- **Light and ink.** The brief's rules stay: light from the upper left, ink `#1b1730`, shadows toward indigo `#3a2f6b`. The head turns to the picture's left, so the near cheek takes the shadow.
- **Shadow shapes.** The eye sockets; the nose's side and cast shadow; under the lower lip; the side plane from temple to jaw; the neck under the jaw.
- **Skin.** Twelve human tones (eight today). On dark skin the form lines are drawn lighter than the skin, and a test holds feature lines at 2.5:1 (1.16:1 today, V15).
- **Eyes.** The stored colour, at most 15% more saturated, with a dark ring (V18).
- **Motion.** The one large portrait on a screen blinks and breathes (CSS, off under reduced motion).

**References, in words.**
- *Vinland Saga*: weathered faces, strong noses and brows, beards and scars.
- *Legend of the Galactic Heroes* (1988): dozens of men in one uniform, told apart by skull, jaw, eyes and brows: the benchmark for the cover-the-hair test.
- Naoki Urasawa (*Monster*, *Pluto*): every nose, eyelid and age different; the old drawn old.
- Akihiko Yoshida (*Tactics Ogre*, *Final Fantasy XII*): muted earth colours; cloth that shows station and trade.
- *Fire Emblem: Three Houses*: house and role read from collar, cape and colour.
- *Princess Mononoke* (Lady Eboshi, the monk Jigo): adults in plain cel shading, with small eyes.

**One hand (V12).** At C8c these tokens are written once into `docs/art/style-guide.md`, and the prints, cut-ins and map labels take them.

## 2. The head: one rig, turned and drawn

The head is about 40 named points in three dimensions, in a space 100 units wide. Genes, sex, age, the people and the expression each add offsets to those points. The head is turned (27°, ±5° by id) and projected flat, and every line and shadow is a curve through the projected points.

- **Outline.** The skull is an ellipsoid; turned, it is still an ellipse. Each side has two chains of points: the side outline (temple, cheekbone, jaw, chin) and the front plane's edge (brow end, eye corner, cheek). The far contour is the outer envelope of both; on the near side the front edge is where the shadow starts.
- **Why a rig.** A scar on the left brow stays there when a foe faces the other way (today the duel flips one fighter's picture, scar and all). Front and profile come free for the creation screen. A gene written once foreshortens correctly.
- **Proof.** A throwaway prototype (250 lines, not kept) drew one head at six turns, and twenty cropped heads of one skin that were plainly twenty men at 150 px and still at 64 px, at 0.6 ms and 9.6 KB a head. Each of its genes changed 0.3% to 10% of the bust.

## 3. Face genes

`p.app.g` is one string of 23 characters holding 32 genes, each read as −1 to +1. Sixteen have a character each (64 steps):

| Gene | At ±1 it moves (units) | Ends |
|---|---|---|
| Face length | everything below the brow, ±15% | short · long |
| Jaw width | jaw angle ±6.5 a side | narrow · broad |
| Jaw shape | jaw angle 5 lower, jaw 3 out | tapered · square |
| Chin | 5 forward, 4 longer | weak · strong |
| Cheekbones | 4.5 out, 2 up | flat · high |
| Brow ridge | 3 forward, 1.5 lower | smooth · heavy |
| Eye size | ±17% | small · large |
| Eye spacing | ±2.6 each | close-set · wide-set |
| Eye tilt | outer corner ±2.7 | drooping · lifted |
| Lids | upper lid ±1.5; low hides the crease | heavy · open |
| Nose length | ±4.6 | short · long |
| Nose bridge | ±3.6 forward | scooped · hooked |
| Nose tip | ±2.6 | upturned · drooping |
| Nose width | wings ±3.1 a side | narrow · broad |
| Mouth width | corners ±2.8 a side | small · wide |
| Lips | height ±62% | thin · full |

Ten share a character in pairs (8 steps each): brow shape and brow weight; chin width and upper lip; eye depth and ears; hair texture and thickness; frame and bulk. Six share in threes (4 steps each): hairline, balding and grey onset; beard growth, legs and neck. Today the jaw moves 2.5 units at most (V4).

**How they combine.**
- **Offsets add.** A point is the people's base, plus each gene times its offsets, plus sex, age and expression. Shapes come from combinations: a snub nose is short, scooped and upturned; an aquiline one long, hooked and drooping.
- **The caricature rule.** Each gene is drawn around its people's mean with a spread of 0.40. Then three to five signature genes are pushed out to 0.7 or more, so every face has something to caricature. Simulated: with plain bell curves the closest pair on a sheet of 20 differs clearly (by a quarter of the range) on no gene; with this rule on 4, and on 3 or more in 96 sheets of 100.
- **A people's look.** `data/looks.json` gives each culture its gene means (shifted 0.5 at most), skin range, hair shades and textures. People differ more inside a culture than cultures differ.
- **Looks.** At birth `p.looks` decides where signatures fall: on the flattering set (eyes, cheekbones, lips) from 70 up, on the hard set (nose, ears, chin) at 30 and under. Quirks that describe looks set their genes.
- **Asymmetry** (a lower eye, a leaning nose) is hashed from the id, never stored.
- **The words win.** `A.LOOKS.fromWords(p)` reads a written description and sets height, build, hair, beard and scars to match.

## 4. Inheritance

- **By feature group.** Six groups: skull, eyes, brows, nose, mouth, hair and body. Each group on its own is the father's four times in ten (0.8 his, 0.2 hers), the mother's four in ten, an even blend otherwise; then a little noise and a 10% pull to the people's mean.
- **Carried, not shown.** Mothers carry balding and beard growth, so a son can get his mother's father's hairline.
- **Height, skin, colour.** Height takes 0.65 of the parents' mean (today `A.genAppearance` draws it fresh). Skin is the mean of the parents' places in the row, give or take a step (today three children in ten get any tone of the people). Hair and eye colour are a parent's or between.
- **Edges.** A half-elf's base head is the mean of both peoples. Identical twins share the string.
- **Simulated.** A child's gene distance to a parent is 0.52 of a stranger's; siblings 0.37, grandparents 0.71, cousins 0.60. Parent and child are closer than a random pair 98 times in 100.
- **The game says it.** `A.V2.face.takesAfter(child)` gives a line for the birth card and the profile: "Her father's jaw, her mother's eyes."
- **Your family.** When you design your own face, your parents and siblings are drawn to fit it (the same rule run backwards), unless lore has written them.
- **Dice.** Genes come from their own stream, seeded by the game's seed and the id as `A.V2S.seedOf` does. The world's dice do not move.

## 5. Sex, age, height and build

Age runs on human-equivalent years (`humanYears`, already in the renderer), so an elf of 350 shows 50. A hard life ages a face up to a fifth faster.

- **0 to 2:** three infant drawings; the face is the lower third of the head; each people has its own baby.
- **2 to 10:** the face grows to half the head, the nose to 70% of its length; boys and girls differ only in hair and dress.
- **11 to 17:** the sexes part; first beard shadow at 15 to 17.
- **18 to 29:** the adult set, unlined.
- **30 to 44:** first lines: forehead, between the brows, crow's feet, nose to mouth.
- **45 to 59:** lids droop, jowls start, the jawline softens; grey and hairline by gene.
- **60 to 74:** deep folds, thin lips, cheeks that sink or sag, ears and nose a tenth larger.
- **75 and over:** sunken temples, a thin neck, the head lower and forward.

**Lines follow temperament.** The wrathful and stern get frown lines first, the gregarious and kind laugh lines, the proud a set mouth. The face you wore becomes your face.

**Sex** grows from nothing at 11 to full at 17 (girls) or 19 (boys). Each person shifts a little by hash, with a floor so the cues always add up.

| Cue | Men | Women |
|---|---|---|
| Brow | ridge forward; brows lower and heavier | smooth; higher, arched, finer |
| Eyes | opening 12% smaller | 10% larger, a heavier lid line |
| Nose | 12% larger | 8% smaller |
| Jaw and chin | a tenth wider, broad chin | tapered, rounder chin |
| Lips | thinner, little colour | fuller, coloured |
| Neck and shoulders | neck a quarter thicker, shoulders 18% wider | longer neck, sloped shoulders |
| Skin | a beard shadow on the shaved | none |

**Height.** `p.app.height` times the v2 growth curve (`A.V2S.height`) is already the number. Now it is drawn.
- **Full figure.** Everyone stands in the same doorway, 210 cm for humans: 150 cm fills 71% of it and 195 cm fills 93%. Today about a third of that difference shows. The average man and woman of the people stand faintly behind. The figure fills 60% of the width, with real garment shapes.
- **Bust.** The eye line moves from 30% of the frame (195 cm) to 44% (150 cm), so heads in a list sit at different heights. Today height does not touch the bust.
- **Words.** "A head taller than most men of Aldmark."

**Build** is three axes, drawn from genes and the life:
- **Frame** (gene): shoulders 0.88 to 1.20.
- **Muscle:** the bulk gene, conditioning (`A.V2S.view(p)`), trade and age.
- **Fat:** the bulk gene, lifestyle, middle age, the gluttonous and temperate traits, prison, famine and illness.

Together they set the neck (0.8 to 1.4) and waist (0.82 to 1.45), and in the face full cheeks and a second chin, or hollow cheeks and collarbones. `p.app.build` and its stat effects (`GD.BUILD_FX`) stay as the starting point.

## 6. Hair

Stored: style (`hstyle`), fringe (`fr`), colour and facial hair. Genes: texture, thickness, hairline, balding, grey, beard growth.

- **38 styles** (13 today, about 8 distinct as drawn): 8 short (shaved, bowl, side-part, tonsure), 8 medium (bob, shag, half-tied, mop), 8 long (loose, tails, mane, side braids), 10 bound (braids, crown braid, buns, topknot, tight rows, locks), 4 shaped (crest, undercut, a fringe round a bald crown).
- **Five fringes and four textures** (straight, wavy, curly, coily). Texture changes every style's outline.
- **14 kinds of facial hair**, from stubble and moustaches to forked and braided beards. Side-whiskers are redrawn as two cheek masses that stop above the mouth (V14). The growth gene limits what a man can grow.
- **18 natural colours** (9 today), plus each people's own. Grey and white are never picked; they come.
- **Greying** starts at the gene's age (26, 34, 42 or 52) at the temples, the beard five years ahead. It is drawn as lighter clumps mixing in.
- **Balding** (men, by gene): temples, crown or both; by 60 a fringe round the crown. Women thin after 60. Elves never bald.
- **Who wears what.** Culture, sex, age and station weight the styles: slaves shorn, clergy tonsured, soldiers short. The crest leaves the courts (50 men, most of them nobles, wear a mohawk in seed 42).
- **Hair is state.** A barber, a prison or mourning can change it.

## 7. Wounds and scars

- **One writer.** `A.addWound(p, k, o)` gains `o = { at, y, src, n }`. Every wound stores a place and a year; a battle wound of a named person also stores the field. A caller that passes nothing gets this year and a place hashed from the id, the kind and the count: no new dice.
- **Places.** On the head: forehead, brow, eye, cheek, ear, jaw, nose, lip, chin, scalp and neck, left or right. On the body: ten more, from shoulder to foot.
- **Drawing them.** A cut is a pale seam, with a gap where it crosses a brow or beard. An arrow leaves a star. A burn is a mottled patch where no hair grows. Losses show (a patch or a sunken lid, half an ear, fingers, a hand). A broken nose kinks whatever nose the genes gave. A wound is red and stitched or bound for a year, then pale, and thinner after 15.
- **Battles.** `src/war/99997-v2-war/b-battle.core.js:256` takes 7 health and stops. The engine's `pl.wound` (arm, leg, hand, knee, face, side) now picks a kind by how badly the phase went and calls `A.addWound`. `A.duelConsequences`, `A.lineBattleResult`, `A.stageOutcome` and `TS.outcome` pass the place of the blow too.
- **NPCs fight too.** At world creation `A.LOOKS.seedScars(p)` reads years at arms and the arm's exposure, and writes 0 to 4 dated wounds from its own seeded stream. Most cost only looks. During play, named people in a battle (commanders, your squad, captains) roll for a mark.
- **The childhood-scar quirk** (28 people; inherited and drawn on newborns today, V21) becomes a cheek scar dated to a hashed age of 2 to 5.
- **Nothing hides it.** No hood covers a face wound. The body page reads "Left brow: sword cut, Carrness, 1108."

## 8. Expression and bearing

Three layers. Lists show only the first, so identity is stable and cached.

1. **The resting face, from temperament.** Each of the 40 traits moves up to three of eight channels: inner brow, brow height, lids, gaze, mouth corners, lip press, head pitch, shoulders. A person's three traits add.
   - Proud: chin up, lids lowered, one brow raised.
   - Cruel: heavy lids, one corner of the mouth up.
   - Kind: inner brows up, soft corners.
   - Wrathful: brows knit, lips pressed.
   - Brave: level gaze, set jaw.
   - Deceitful: a smile that stops at the mouth.
2. **Mood** (profile, side panel, cards): happiness, health, the needs of 35-moods, grief, fear, love and opinion of you move the same channels a little, with pallor, flush and tired eyes.
3. **Scene.** The card's subject wears the card's tone, from the event's `scene.tone` tag (C8c). Today's word lists are the fallback.

**Rules (V10).** No closed-eye grin on anyone over 40, unfree, in mourning or ruling. Children show more, rulers and the proud less. Eyes can look aside (today they never move). Soldiers square their shoulders; serfs and the old stoop.

## 9. Dress

Five axes: **station** (the cut), **culture** (a family of cut, plus one mark), **wealth** (the finish), **role** (an overlay) and **occasion** (which set). One pure function, `UI.DRESS.kit(p, ctx)`, reads `data/dress.json` and returns seven slots: head, hair-do, neck, shoulders, chest, ornament, cloth. It replaces `PORTRAIT.outfit` and 63's culture table.

**Station** (the North's items; each family supplies its own):

| Station | Cloth, cut and head indoors | The cue at 46 px |
|---|---|---|
| Slave | undyed sackcloth shift; shorn | neck ring, bare collarbones |
| Serf | coarse undyed wool, patched; coif or straw hat | patches, cream and grey |
| Peasant | dull tunic over a shirt; the hood down as a collar | hood roll, earth colour |
| Artisan | good plain wool, an apron bib; flat cap | apron straps, guild badge |
| Merchant | long gown, fur-edged collar, deep colour; big soft hat | the hat and the fur edge |
| Gentry | fitted and buttoned, standing collar, one bright colour; feathered cap | button line, sword-belt strap |
| Noble | patterned cloth in the house's colours, fur mantle; a coronet at court | fur shoulders, a jewel by rung |
| Royal | ermine, cloth of gold; the crown for the ruler alone | ermine and gold |

**Culture families.** Each culture's `dress` key (in C7's data) names a family and one mark from its customs line (a cloak brooch, a tall hat, a turban, gold beads).
- **North** (Northfolk, Marchfolk, Leaf People, Eastfolk): tunic and cloak.
- **Court** (Solenfolk, Corsairs): fitted and laced.
- **Highland** (Wind Riders, Skyfolk, Cloudfolk): crossed coat, high collar.
- **Desert** (Qadiri, Sandfolk, Sabrans): layered robes, head-wraps.
- **River and coast** (Tamari, Keshi, Ranpuri, Amberfolk): light draped cloth.
- **Savanna** (Zanari, Abari): one-shoulder drape, beads.
- **Elder peoples:** elves in long robes, dwarves in leather aprons and beard rings, orcs in hides and bone, giants in furs.

**Wealth** is the five lifestyles of `A.LIFESTYLE`: Hard (one layer, patched), Modest (mended, horn pins), Comfortable (two clean layers, pewter), Rich (embroidery, silver, fox), Lavish (patterned silk, gold thread, gems). Wealth changes the finish, never the cut: a ruined noble wears a noble's cut gone threadbare, the jewels pawned.

**Roles.**
- **Soldiers, by arm** (D11's branches; V7), each with the arm's badge at the collar. Levy: a quilted jack drawn as channels, a kettle hat. Infantry: a mail coif pushed back, a shield strap. Archers: a quiver strap and fletchings over the shoulder. Cavalry: a surcoat with the lord's charge. Knights: gorget, pauldrons, their own arms. Orders: the order's mantle. Open helms are worn in the field; closed helms are carried.
- **Clergy:** a habit by faith, tonsure, the cowl down.
- **Office:** one chain a post, read from A2's registry.
- **Retainers** wear the house's livery. Only they share a garment; each family member gets one of their own from the house's five tones (V9).

**Occasions:** everyday, court, field, road, mourning. A duelist is in shirt-sleeves with the blade drawn (V16).

**Rules.** Hair is hidden only on the road, in mourning, on clergy women and where a custom says so: on at most one indoor portrait in ten, and never in a list (V13). A pendant is at most 6% of the bust's width. One crown a realm. The frame's metal shows station, since a gold frame on four people in five says nothing. The kit also gives the words for B4: "A russet tunic over a linen shirt, hood thrown back."

**The rest of C8c, in the same hand.** Events carry `scene: { place, subject, tone }`, with about 60 compositions (25 today) and interiors by station (V17, V19). Cut-ins get five tones (triumph, grief, dread, tender, solemn), so a levy's death is grief and never speed lines (V11). The dead get an ink-wash memorial plate, the Chronicle a book face, and four icons are redrawn (V22). V20, cut-ins over the text, is B5's.

## 10. The creation screen

It replaces `UI.crStepBody`, under one line: "This is the face you will grow into."

**The picture** (on top on a phone): the bust, large; small front and profile views; the figure in the doorway beside the average man and woman; an age strip (0, 6, 12, 18, 30, 50, 70).

**Six tabs**, at most eight controls each (B5's limits):
- **Start:** sex, name, 12 designed starting faces, take after father or mother, surprise me.
- **Face:** length, jaw width, jaw shape, chin, chin width, cheekbones, brow ridge, ears.
- **Eyes and brows:** size, spacing, tilt, lids, depth, brow shape, brow weight, colour (12).
- **Nose and mouth:** length, bridge, tip, width, upper lip, mouth width, lips.
- **Hair:** style (38), fringe (5), texture (4), thickness, hairline, colour (18), facial hair (14), growth.
- **Body and marks:** height in cm, build (8, effects unchanged), frame, bulk, legs, neck, skin (12), freckles and moles.

Today there are 5 face controls with 16 options between them; this gives 22, sixteen of them sliders of 64 steps. Hair goes from 13 styles to 38, with fringes and textures. The body goes from 2 controls to 6.

**Rules.** A description opens on click from an info icon. Slider ends are words; there are no percentages (centimetres are a real unit). Controls use `data-a` and `data-c`, values go through `UI.esc`, and the preview is pure.

## 11. Rendering

**Pipeline** (plain JS in `*.core.js`, no libraries): `look(p, ctx)` turns genes, age, sex and state into numbers; the rig places and projects the points; the parts (head, hair, body, marks, dress) emit shapes; one serializer writes the SVG string.

| Tier | Sizes | Detail | SVG | Build |
|---|---|---|---|---|
| S | to 40 px | silhouette, skin, hair, the dress colour | 2.5 KB | 0.3 ms |
| M | 41 to 100 | features, one shadow, the station's cue | 8 KB | 0.8 ms |
| L | over 100 | everything | 18 KB | 2 ms |
| Figure | full | the L head and the body | 26 KB | 3 ms |

Today a bust is 7.3 KB and 0.2 to 0.4 ms (its README). The L tier costs more because it draws more, and a screen shows one or two.

- **No filters.** Today every figure runs a morphology filter. The contour is drawn as geometry.
- **Delivery.** `PORTRAIT.svg` keeps returning a string. A new `PORTRAIT.tag(p, size, opts)` returns an `<img>` with a cached blob URL (the CSP allows `img-src blob:`), for every call site under 100 px: one node, not 115 (P15). Measured: mounting 60 inline busts took 120 to 780 ms in this page; as images 1 to 2 ms, plus a first decode of about 6 ms each, then 2 to 5 ms for all 60 on reuse. The one large portrait stays inline, so it can move.
- **Gate.** C8b first measures both on CI at four times CPU throttle. If the first decode of 20 portraits passes 60 ms, lists paint from a canvas bitmap cache (0.5 ms a portrait, measured).
- **Cache.** An LRU of 600 (today a map cleared whole at 1,500). A resting bust's key is the id, the look, the age step (yearly to 20, then every two or three years), wounds, kit, tier, theme and facing. Mood and opinion key only live portraits; today every list bust is rebuilt when happiness moves five points. Today's key also leaves out `opts.front`.
- **Determinism, purity, security.** Every choice is a hash of the id, never `A.rand`. Drawing reads state and writes none. Colours are checked as hex and the alt text goes through `UI.esc`. `renderRng`, `replayWithRender` and `apPure` keep running.
- **Seeds.** People held as seeds (9997's captains, C6's parish) draw from the seed's id, so the face is the same once they are met.

## 12. Cost, and old saves

| | Today | After C8b |
|---|---|---|
| The look, a person | 179 bytes | about 166: 30 for `g`, 7 for the fringe, less 50 for `face`, `brow`, `mouth`, `nose` and `eyeShape`, which the genes replace (their readers, `PORTRAIT.outfit` and the creation screen, go too) |
| Wounds | none | about 48 bytes each; one adult in six seeded, so about 11 bytes a person |
| Dress, expression, age, sex | | 0: derived |
| Save | about 300 KB at the start | 10 to 16 KB more (random characters do not compress); a test holds 5% |

**Old saves.** `A.SAVE_VER` goes from 14 to 15, and step 10 of `A.V2SAVE.upgrade` calls `A.LOOKS.migrateAll(S)`:
1. People are taken in birth order, so children inherit from parents already done.
2. The five old values lean the genes, so a face you chose keeps its character: face shape leans the jaw, nose the length, eye shape the lids.
3. Written words are applied on top. `hstyle` maps to the new list; yours stays as you chose it.
4. Wounds get places by hash. The scar quirk is converted. NPC veterans are seeded; your own body is left as you lived it.

The same save always gives the same faces. The three saves in `tests/saves/` must load with everyone drawn, and a new sample save is added at the milestone.

## 13. Files and functions

After X1 the release's functions are readable source; paths may move, names stay.

**C8b.**
- `src/people/engine/face.js` and `tests/v2/face.test.js` (new): the gene layout, `make`, `pack`, `unpack`, `distance`, `takesAfter`, the sex and age curves. Exported from `src/core/engine/index.js`; rebundled by `tools/build-v2.mjs`.
- `src/people/99993-v2-looks/` (new): `a-genes.core.js` (wraps `A.genAppearance`; `A.LOOKS.fromWords`), `b-wounds.core.js` (`A.addWound`, `seedScars`, the quirk), `c-migrate.core.js`, `test.mjs`.
- `data/looks.json`: each people's means, tones, shades and textures.
- `src/core/99998-v2-saves/saves.core.js`: step 10, version 15.
- `b-battle.core.js`, `src/war/72-two-scales`, `A.duelConsequences`, `A.lineBattleResult`, `A.stageOutcome`: wounds with places.
- `src/ui/93-anime-portraits/`: `anime.core.js` goes to `archive/93-anime-portraits-v1/` with a note. New files: `a-rig`, `b-face`, `c-hair`, `d-body`, `e-marks`, `f-express`, `g-frame` (tiers, cache, `PORTRAIT.tag`), `h-create` (replaces `UI.crStepBody`, `UI.crPreviewPerson`, `UI.crRandomize`).
- `tools/sheets/portraits.mjs` (the sheets below) and a check `looksAgree` in `src/core/08-coherency`: words against look, a wound with no place, a scarred newborn.

**C8c.**
- `data/dress.json` and `src/ui/93-anime-portraits/i-dress.core.js`: the kit; `PORTRAIT.outfit` goes.
- C7's culture data (the `dress` key), `tools/lint-events.mjs` (`scene`), `src/ui/94-woodblock-skies`, `src/ui/96-moments`, `docs/art/style-guide.md`.

## 14. Acceptance

`node tools/sheets/portraits.mjs <built.html>` writes each sheet as a PNG. Three playtester agents judge the sheets; the tests run in `tools/check.mjs`.

**C8b: faces and bodies.**

| Sheet or test | Pass | Today |
|---|---|---|
| Sheet `faces`: 20 adults of one people and sex, and the same 20 cropped and beardless in one shirt; match them | 90% | near chance |
| Sheet `sex`: 12 beardless men and 12 women at 88 px | 95% | not sortable |
| Sheet `ages`: 28 people in seven bands; name the band | 85% | one drawing from 13 to 40 |
| Sheet `temper`: 12 busts, six opposed trait pairs; pick the trait | 75% | random |
| `looksLadder`: each gene's two ends change this share of a 120 px bust | 0.25% | nose 0.03% |
| `faceSpread`: the closest pair of 20 differs clearly on 3 genes | 95 sheets in 100 | no gene |
| `faceKin`: parent to child against strangers; siblings not clones | 0.65 at most; 0.2 at least | no inheritance |
| `looksWounds`: every kind that marks the body shows in its place, with its year; a v2 battle wound is stored | 22 of 22 | 6 |
| `looksVeterans`: of those with ten years at arms, the share who carry a mark; nobody under two has one; the balance bands hold | six in ten | none |
| `looksHeight`: 150 and 195 cm, head tops in the figure; eye lines in the bust | 18% of the frame apart; 8% | about 8%; 0 |
| `looksContrast`: feature lines on every skin | 2.5:1 | 1.16:1 |
| `looksGrin`, `looksChops`, `looksEyes`: the grin rule, side-whiskers, iris colour | pass | fail |
| `looksBytes`, `looksNodes`: `g` with its key; the People page | 30 bytes; 800 nodes | 2,100 nodes |
| `looksBudget`: each tier's size and time; no filter | section 11 | |
| `looksWords`: written people agree with their look | 270 of 270 | disagree |
| `looksOldSaves`: the three sample saves | 0 fallbacks | |
| Kept: `apDeterministic`, `apPure`, `apEscaped`, `apAxe`, `renderRng`, `replayWithRender` | pass | pass |

**Gate one.** C8b's first sprint ends with the `faces` sheet and the ladder, on bare heads. The owner approves the look before hair, age and bodies are built. Then: sex and age; hair; height and build; wounds and expression; the creation screen, saves and delivery.

**C8c: dress and regalia.**

| Sheet or test | Pass |
|---|---|
| Sheet `stations`: 8 stations in 4 families, labels hidden | 85% at 88 px, 70% at 46 |
| Sheet `arms`: six soldiers among six civilians; soldier or not, and which arm | 95%, 80% |
| Sheet `wealth`: one station at five lifestyles, put in order | 80% |
| `dressUnique`: in 12 worlds, living kin who share a garment and are not retainers | 0 |
| `dressHoods`: hair hidden indoors; in lists | 10% at most; 0 |
| `dressCrown`, `dressDuel`: one crown a realm; no crown or ermine in a duel | pass |
| `sceneTags`: a 60-card sample, picture matches tag | 60 |

Today only the nobility can be named, a soldier is a striped top, and a house shares one tunic.

## 15. Decisions, records and risks

**For the owner.**
1. Approve this register (three-quarter view, grown proportions, small real eyes), to be confirmed on gate one's sheet.
2. Veterans' old scars: real (a few cost a little speed or sight) or looks only? The plan: real and rare.
3. May creation redraw your parents and siblings to fit the face you design? The plan: yes.
4. Retire the woodcut-miniature and paper-doll settings at C8c (to `archive/`), so one renderer carries the dress table? The plan: yes.

**Records to add when approved** (DECISIONS): this document; the L tier's 18 KB and 2 ms against the brief's 8 KB and 1 ms; open helms in field busts, against 93's "no helm in a bust"; a foe turned, not flipped.

**Risks.**
- **Procedural art has a ceiling.** Each sprint's sheets are looked at before the playtesters see them, and the part tables can take hand-drawn point lists later.
- **The rig.** If the far contour breaks at a gene's ends, one fixed turn and its mirror will do.
- **Decode cost.** The first decode of images may be too slow on a phone; the gate decides.
- **Balance.** Seeded scars shift a few veterans' fighting worth; the balance run must pass.
- **Dependencies.** C8c needs C6's commoners and C7's cultures.
