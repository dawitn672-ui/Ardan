# Ardan character design: faces, bodies and dress (C8a)

*Stamped 2026-11-12 11:45 ET · work item C8a (CRITIQUE §2, item 6) · written by Fable at maximum effort · for the owner's approval; the look itself is approved by eye on the demo of §14 · supersedes the version of 2026-11-12 10:04 ET (the anime model sheet) and the portrait table of `docs/design/brief.md` §7.1 · follows D-015 and D-020 (game rule 14) · C8b and C8c build from it · plans V1 to V22*

The owner's order (D-015): "You can leave the anime idea if you think it's more appropriate. It should grow up accurately, with lasting scars that change structure and face, and age should be accurate. As realistic as possible, representing their full armor or clothing in detail down to the smallest features, using art design skills." With it (D-020): weigh anime against realistic again and choose; every feature of the player's face set by hand, customisation before genes; clothing the player can change; and demos to look at before anything is built. All of it is recorded in §15.

**The plan in short.**
- **The look:** realistic. Each person is a true anatomy in millimetres under one window's light, finished as a painting: not anime, and not a photograph (§1).
- **Your face is yours:** 39 features set by hand, with colours, hair and body. A face is a code of 23 characters. Children inherit it; parents and siblings are drawn to fit it (§3, §4, §10).
- **Lives show:** people grow from newborn to elder on real proportions, age line by line, and carry wounds that change the form for good (§5, §7).
- **Dress is real:** layers of cloth, mail and plate over the body, down to buckles and stitches; right for station, culture, wealth, role and era, and yours to change in a wardrobe (§9).
- **The cost:** a portrait is painted once, in 2 to 60 ms by its size, then kept as an image. The same person always gives the same picture (§11).
- **First, a demo:** nine sheets and a live face maker for the owner to look at, before anything is built into the game (§14).

## 0. What was measured

**The game today** (`index.html`, seed 42, day 0, drawn through `PORTRAIT.svg`; from the first version's probes).

- **One face.** Twenty men of 30 with the same crop, skin and eyes drew twenty copies of one head. Between the ends of a stored face value, 0.03% (nose) to 1.49% (face shape) of a 120 px bust changes.
- **No age, sex or class.** A man draws the same from 13 to 40. Twelve beardless men and twelve women at 88 px could not be sorted. Serf and peasant share a tunic.
- **No history.** None of 947 living people has a wound, and none is a soldier, priest, serf, slave or merchant. Six of 25 wound kinds change the bust.
- **Words against pictures.** 270 people have a written description. "183 cm and 84 kg" is stored at 155 cm, "a bald crown" draws wild hair, and 42 descriptions mention scars nobody has.
- **Cost.** A look is 179 bytes in 14 keys. A bust is 7.3 KB and about 115 nodes. Mounting 60 inline busts took 120 to 780 ms; the same 60 as images took 1 to 2 ms.

**A realism prototype.** A throwaway of about 650 lines of plain JS (no libraries, run in Node; not the game's code) built a head from measurements in millimetres, lit it and painted it pixel by pixel. Times are one core of a busy machine: read them as ratios.

- **One model, every view and age.** Front, three-quarter and profile came from the same data. So did a man of 32, a woman of 27, a boy of 6, a man of 71 and a heavy woman of 58, by changing only the model's numbers.
- **Wounds as form.** A broken nose, a lost eye, a burn, pox pits and a cheekbone stove in were each a change to the surface and its colour. The light did the rest.
- **Materials.** A linen shirt, a wool tunic and a mail coif differed by their relief and by how they took the light. Unfiltered, the mail's rings shimmered at some sizes: §9's rule on fine detail comes from that.
- **Cost.** 0.36 to 0.52 millionths of a second a pixel, unoptimised: 2 ms at 64 px, 3 to 5 ms at 92, 11 to 13 ms at 176, 19 to 30 ms at 240, about 60 ms at 400. Building the model took 0.3 to 6 ms.
- **Bytes.** 33 KB raw at 92 px and 225 KB at 240; about half that as PNG, because grain does not compress.
- **Identity.** Twenty random men with one skin, crop and tunic were plainly twenty men at 150 px once the features ran over the real human range of §3. At 46 px the face alone did not carry them.
- **Small things vanish at true size.** A sword scar 1.5 mm wide is half a pixel on a 120 px bust, and changed none of it.
- **The honest look.** The heads read as lit clay busts. Structure, age and wounds are right; skin, hair and cloth are not yet paint. Closing that gap is the demo's work (§14, gate zero), before anything is built into the game.

## 1. The register, weighed again: a painted likeness

The owner asked for the question to be weighed, not assumed (D-020). Both candidates were held to the same brief: growth and age that are accurate, scars that change structure, dress to the smallest feature.

The first version's "anime" had already given up anime's own marks to answer the critique: small real eyes, real noses, grown proportions. What was left of anime was its finish, an ink line and flat tone. So the choice is between two finishes over the same true anatomy.

| The brief | Ink and flat tone (grown-up anime) | Paint over a lit form (realistic) |
|---|---|---|
| Age that is accurate | Four ages read: child, young, lined, old. From 25 to 55 a face changes in volume and skin, which flat tone cannot show, and each line added to say so adds ten years | Continuous: the same face a little heavier, lower and rougher each year |
| Scars that change structure | A scar is a line or a patch on top. A pitted cheek, a burn's pull or a sunk socket has nothing to be drawn with | The wound changes the surface and the light shows it |
| Dress to the smallest feature | Materials differ by pattern and colour only; under 100 px fine pattern is noise | Materials differ by how they take light: mail glints ring by ring, plate mirrors the room, wool drinks light, fur has a soft edge |
| A face in a list at 46 px | Its strength: a line holds at any size | Its weakness: it needs a closer crop, grouped tones and one restated edge (§11) |
| The subject: a chronicle of serfs, soldiers and lords | The critique's V11: child-like and festive | The genre's own register (*Crusader Kings III*, *Kingdom Come: Deliverance*) |
| Cost of a portrait | 0.3 to 2 ms, sharp at any size | 2 to 60 ms by size, drawn once and kept as an image (§11) |
| Where it can fail | Clean and generic: two rounds of procedural anime are in the build already | A wax doll, if skin and hair are weak |

**Measured.** The prototype drew one model in both finishes. The share of a 120 px bust that visibly changed (by more than three steps in a colour channel): from 45 to 60 years, 3.9% in paint and 1.6% in flat tone; from 60 to 75, 12.9% and 7.4%; a burn, 3.1% and 0.5%; pox scars, 0.9% and 0.5%. Bone showed about alike in both (a broken nose 0.6% and 0.3%, a cheekbone stove in 0.7% and 0.5%). Skin and soft flesh are where this brief lives, and they show roughly two to six times more in paint. Two cautions: the flat finish was a quick pass, so these numbers say what each finish can carry, not how good it looks; and from 30 to 45 neither finish showed the change (0.2%), because the prototype's first lines are too faint. The `ages` sheet holds the real thing to that.

**Chosen: realistic.** Anime is not wrong as a taste. It is the wrong tool for this brief. Every person is a real form under one real light, finished as a painting. The owner confirms it by eye on the demo, where the same cast stands in both finishes (§14). The model under the picture is the same for either, so sections 2 to 10 stand if the owner overrules it.

**A painting, not a photograph.** A procedural face that tries to pass for a photograph fails as a wax doll. So the anatomy is true and the finish is a painter's.

- **Three families of tone:** light, half-tone and shadow, grouped so the picture reads from across a room.
- **Edges:** hard where one form overlaps another, soft where a form turns, lost where shadow meets the dark ground.
- **Few colours a person:** skin, two cloths and a metal, on a ground in the realm's tint, lighter behind the shadowed side.
- **No line round forms.** A dark is restated only where a painter would: the lash line, the nostril, the parting of the lips. At list sizes one thin edge holds the head off the ground.
- **No pure black or white.** The darkest dark is the brief's ink, `#1b1730`.

**Kept from anime:** the silhouette read first (every person is a clear black shape at 32 px), a signature in every face (§3), few and chosen colours, and character in the bearing (§8).

| | Today (`anime.core.js`) | C8 |
|---|---|---|
| Units | hundredths of a head box | millimetres |
| Figure | 6 heads | what the height gives: about 7½ for a grown human, 4 at birth (elves 8, dwarves 5½, giants 8) |
| Head in the picture | 42% of the width | by size: 54% of the width at the smallest, 46% on cards and lists, 38% in a large bust (§11) |
| Eye opening | 0.7 of its width | a third of its width, 30 mm by 10; a child's eye looks large because the face round it is small |
| Nose | a tick 4.5 units long | a form 41 to 61 mm long with a bridge, a tip and wings, and the shadow it casts |
| Mouth | one stroke, 14 wide | two lips, 43 to 61 mm wide, with their own shape and colour |
| Line | even strokes, an outline filter | none round forms (see above) |
| Shading | one shadow cut by an ellipse | light on form: a window, a fill, a bounce, cast shadows, and blood at the shadow's edge |
| View | a front face nudged aside | a true three-quarter turn; front and profile from the same model |

- **Light.** One window, up and to the left, as the brief has it; a cool fill toward indigo `#3a2f6b`; a warm bounce from below; a thin edge light on the shadowed side. The head turns to the picture's left, toward the window, so the near cheek falls into shadow and the head reads as a solid; across the front of the face the light rakes, and every line and scar shows. Shadows are cast, not drawn: the nose's, the brow's over the eye, the chin's on the neck, the hair's on the forehead, a collar's.
- **Skin.** Twelve human tones (eight today). A tone is where the colour starts: the forehead is yellower, the cheeks, nose and ears redder with blood, a shaved jaw cooler. Sun and weather come by trade, flush and pallor by mood and health. Dark skin is told by its highlights, and a test holds the eyes, nostrils and lip line at 2.5:1 against the skin round them on every tone (1.16:1 today, V15).
- **Eyes.** A wet ball in a socket, under the lid's shadow, with one catchlight from the window. The stored colour, at most 15% more saturated, with a dark ring (V18).
- **Motion.** The one large portrait on a screen blinks: a second small picture of the closed lids is laid over the eyes (off under reduced motion). It does not breathe.

**References, in words.**
- Hans Holbein the Younger: plain light and exact faces; fur, velvet, chain and stitch each painted as itself. The benchmark for dress.
- Jan van Eyck (*Man in a Red Turban*): skin with its years left in; cloth and metal told by light.
- Albrecht Dürer's self-portraits at 13, 22, 26 and 28, and his father at 70: one face followed through age. The benchmark for the `grow` sheet.
- Angus McBride's plates of medieval soldiers: every strap, buckle and layer of a man's kit, readable at a glance. The benchmark for the `arms` sheet.
- *Kingdom Come: Deliverance*: armour in honest layers, padding under mail under plate, worn and dirty.
- *Crusader Kings III*: inherited faces, ageing and scars as one system. The benchmark for the kin test.
- Akihiko Yoshida (*Final Fantasy XII*, *Tactics Ogre*): muted earth colours and cloth that shows station. Kept from the first version: how to stay designed after leaving anime.
- *Legend of the Galactic Heroes* (1988): dozens of men in one uniform, told apart by skull, jaw, eyes and brows. Kept: the benchmark for the bare-head test.

**One hand (V12).** Ink for places, paint for people, as in an old atlas with portraits: the map is inked (D-016), the event prints stay prints, the people are painted. They share the light from the upper left, the ink as the darkest dark, the palette's earths and one frame. At C8c these tokens are written once into `docs/art/style-guide.md`.

## 2. The body in millimetres: one model

Every person is one model in real units. A grown human's base is the average man and woman of published body measurements (`data/looks.json` holds each people's means and spreads): a head about 152 mm wide, 195 long and 225 tall; pupils 63 apart, on the head's half-way line; a nose 51 long and 35 wide; a mouth 52 wide; an ear 63 long; a neck 380 round; shoulders 400 across the bone. A woman's are about a twentieth smaller, with a shape of her own (§5). "A man of 172 cm" and "a head 225 mm tall" are true statements about the picture.

- **Named points.** About 60 points carry the head and 40 the body. The people, the features (§3), sex, age, build, wounds and expression each add offsets to them, in millimetres.
- **The surface.** Each part is a radius round an upright axis: big volumes joined smoothly, then features pushed out or in along the radius. So a jaw or a cheekbone moves the outline as well as the light. The head is one such surface, the neck and trunk another, each limb its own. Ears and eyeballs are added as solids.
- **Sharp cuts.** The opening between the lids, a hairline, a neckline and a hem are cut pixel by pixel, so they stay sharp at every size.
- **Fine relief.** Lines, pores, the lips of a scar, a weave and the rings of mail are too fine for the surface. They bend the light pixel by pixel (§11).
- **Layers.** Hair, cloth and armour are the surface under them pushed out by their own thickness (§6, §9), so they fit every height, build and age without being redrawn.
- **The view.** Seen from far, as through a long lens: no perspective, so a feature keeps its true size.

**Why a model.**
- Light, cast shadows and materials come from the form. Nothing is shaded by rule.
- A scar on the left brow stays there when a foe faces the other way (today the duel flips one fighter's picture, scar and all).
- Front and profile come free for the creation screen. A feature written once works in every view.
- Growing up is the same model at a younger age. There are no separate drawings of infants.

**If the surface cannot carry a face.** The demo judges it. The painter does not care where a surface comes from, so the fallback is a sculpted human in the same slot: MakeHuman's base mesh and shape targets are CC0 since 2020 (its code is AGPL and is not used), cut down by a `tools/` script to the head and the features of §3. It is taken only at gate zero, with a DECISIONS record naming the source and its licence.

## 3. Features: set by hand first, inherited second

`p.app.g` is one string of 23 characters (138 bits) holding 39 features, each read as −1 to +1. The player sets every one by hand at creation (§10), and nothing is rolled over the player's choices. For everyone else the same string is filled by inheritance (§4) or by the rules below. The ends are the real human range, about three standard deviations either side of a people's mean.

| Feature | Steps | At its ends | Words |
|---|---|---|---|
| **Skull and face** | | | |
| Face length | 32 | brow to chin 127 mm, 14 less or more | short · long |
| Jaw width | 32 | 108 mm across the angles, 20 less or more | narrow · broad |
| Jaw shape | 16 | the angle 5 lower and 4 out | tapered · square |
| Chin | 32 | 6 forward, 5 longer | weak · strong |
| Chin width | 8 | 6 less or more | pointed · broad |
| Cheekbones | 32 | 6 out, 3 up | flat · high |
| Forehead | 8 | 8 taller and more upright | low and sloped · high |
| Cheeks | 16 | the soft cheek 5 in or out | hollow · full |
| **Eyes and brows** | | | |
| Eye size | 16 | an opening of 30 mm, 3.5 less or more | small · large |
| Eye spacing | 16 | 63 mm between the pupils, 7 less or more | close-set · wide-set |
| Eye tilt | 16 | outer corner 3 down or up | drooping · lifted |
| Lids | 16 | the upper lid shows 0 to 5 mm | heavy · open |
| Eye depth | 8 | 4 back or forward | deep-set · prominent |
| Brow ridge | 16 | 3.5 forward | smooth · heavy |
| Brow shape | 8 | the peak 4 lower or higher | straight · arched |
| Brow weight | 8 | hair 2 to 6 mm deep | fine · heavy |
| **Nose** | | | |
| Nose length | 32 | 51 mm, 10 less or more | short · long |
| Nose bridge | 32 | 5 back or forward at its middle | scooped · hooked |
| Nose tip | 16 | 4 up or down | upturned · drooping |
| Nose width | 16 | wings 35 mm, 7 less or more | narrow · broad |
| Tip shape | 8 | the tip's own size | fine · bulbous |
| **Mouth** | | | |
| Mouth width | 16 | 52 mm, 9 less or more | small · wide |
| Lips | 16 | height half, or half as much again | thin · full |
| Upper lip | 8 | nose to mouth 22 mm, 5 less or more | short · long |
| Bite | 8 | the lower jaw 3 back or forward | overbite · underbite |
| **Ears** | | | |
| Ear size | 8 | 63 mm, 9 less or more | small · large |
| Ear set | 8 | lying flat, or standing out | flat · standing out |

Twelve more, of 4 to 16 steps: hair texture, thickness, hairline, balding, grey onset and beard growth (§6); frame, bulk, legs and neck (§5); freckles and moles. Stored beside the string: skin, hair and eye colour, height, build, hair style and facial hair as today, and the fringe (`fr`). Today the jaw moves 2.5 units of a 100-unit head box at most (V4).

**How they combine.**
- **Offsets add.** A point is the people's base, plus each feature times its offsets, plus sex, age, build, wounds and expression. Shapes come from combinations: a snub nose is short, scooped and upturned; an aquiline one long, hooked and drooping.
- **A signature in every face.** Each feature is drawn around its people's mean with a spread of 0.40. Then three to five are pushed out to 0.7 or more, so about one feature in eight sits near a real extreme, where chance alone gives one in twenty-five. Simulated on the 27 features of the table: the closest pair on a sheet of 20 differs clearly (by a quarter of the range) on 8 of them, on 6 or more in 95 sheets of 100, and no sheet in 3,000 had a pair under 3.
- **A people's look.** `data/looks.json` gives each culture its means (shifted 0.5 at most), skin range, hair shades and textures. People differ more inside a culture than cultures differ.
- **Looks.** At birth `p.looks` decides where signatures fall: on the flattering set (eyes, cheekbones, lips) from 70 up, on the hard set (nose, ears, chin) at 30 and under. Quirks that describe looks set their features.
- **Asymmetry.** No face is even. A lower eye, a leaning nose or a higher brow, by 1 to 2 mm, is hashed from the id and never stored.
- **The words win.** `A.LOOKS.fromWords(p)` reads a written description and sets height, build, hair, beard and scars to match.
- **By hand.** For the player the string is exactly what the controls wrote. A face is its code: 23 characters that can be copied, kept and pasted back.

## 4. Inheritance

- **By feature group.** Seven groups: skull, eyes, brows, nose, mouth, ears, hair and body. Each group on its own is the father's four times in ten (0.8 his, 0.2 hers), the mother's four in ten, an even blend otherwise; then a little noise and a 10% pull to the people's mean.
- **Carried, not shown.** Mothers carry balding and beard growth, so a son can get his mother's father's hairline.
- **Height, skin, colour.** Height takes 0.65 of the parents' mean (today `A.genAppearance` draws it fresh). Skin is the mean of the parents' places in the row, give or take a step (today three children in ten get any tone of the people). Hair and eye colour are a parent's or between.
- **Never inherited.** A scar, a broken nose, weathering, weight, or anything else a life did (V21).
- **Edges.** A half-elf's base is the mean of both peoples. Identical twins share the string.
- **Simulated** (the 27 features of the table). A child's distance to a parent is 0.53 of a stranger's; siblings 0.39, grandparents 0.71, cousins 0.61. Parent and child are closer than a random pair 99 times in 100, and 94 children in 100 have a feature that is plainly one parent's.
- **The game says it.** `A.V2.face.takesAfter(child)` gives a line for the birth card and the profile: "Her father's jaw, her mother's eyes."
- **Your family fits your face** (the owner: yes). Your face is never changed to fit them. `A.V2.face.parentsFor(you)` runs the rule backwards: each of your feature groups is given to one parent, the rest of each parent comes from their people, and your siblings are then drawn as their children. People that lore has written keep their own faces.
- **Dice.** Features come from their own stream, seeded by the game's seed and the id as `A.V2S.seedOf` does. The world's dice do not move.

## 5. Sex, age, height and build

Growing up and growing old are the same model at another age. Nothing is drawn per age band: the bands below are what the curves give. Age runs on human-equivalent years (`humanYears`, already in the renderer), so an elf of 350 shows 50.

**Growing up.** Two curves drive it: stature (the engine's `heightFraction`, from WHO medians) and the head, which grows early. How many heads tall a child stands is not set. It falls out.

| Age | A boy who will be 172 cm | Head, crown to chin | Heads tall | What the model does |
|---|---|---|---|---|
| Birth | 49 cm | about 128 mm | 4 | The braincase is eight times the face in volume (twice, when grown); brows on the half-way line, eyes below it; a button nose with no bridge; a small chin set back; full cheeks; no neck to see; fine thin hair |
| 1 | 74 | 165 | 4½ | The face a little longer; the first teeth; hair comes in |
| 3 | 94 | 180 | 5¼ | Milk teeth all in; cheeks still full; the neck shows |
| 6 | 114 | 190 | 6 | The braincase is nine tenths grown, so from here the face does the growing; the front milk teeth fall, and a gap shows until 8 |
| 10 | 135 | 202 | 6¾ | The nose's bridge rises; the baby fat is gone; grown front teeth, large in a small face |
| 14 | 160 | 218 | 7¼ | The spurt, two years earlier in girls; nose and jaw lengthen; boys' shoulders and girls' hips |
| 18 | 172 | 225 | 7½ | The grown set. A man's jaw and brow finish by about 20 |

The eye is the one part that hardly grows: the iris is full size by two. Children are big-eyed because the face round the eye is small, with no stylising.

**Growing old.** Every line has its place from the start (hashed from the id); the years only deepen it.

- **18 to 29:** the skin taut over the bone; nothing lined.
- **30 to 44:** the first lines where the face folds most: across the forehead, between the brows, at the corners of the eyes, from nose to mouth. The cheek begins to thin.
- **45 to 59:** the soft cheek slides down: lids hood, bags form under the eyes, the fold from nose to mouth deepens, jowls break the jawline. Lips thin. Grey and hairline come by feature (§6).
- **60 to 74:** deep folds; fine lines above the lip; temples and cheeks hollow, or sag on the heavy; the nose's tip drops and the ears lengthen (about 2 mm a decade, all through life); age spots; a man's brows grow wild.
- **75 and over:** thin loose skin over the skull; the neck in cords; the head carried forward and lower; narrow, rounded shoulders.
- **Height is lost:** a man about 3 cm by 70 and 5 by 80, a woman 5 and 8. `heightFraction` gains this, so the number on the sheet shrinks too.
- **Teeth:** from 50, by hash and the station born into, some are lost. The lower face shortens and the lips fold in.

**A hard life shows.** `A.LOOKS.wear(p)` ages a face up to a fifth faster for years in the sun, at arms, in hunger or in prison, and tans and roughens the skin. A sheltered life slows it a tenth. It reads the station (for the player the one born into, `S.startStatus`), years at arms and the flags of a life, and stores nothing. A field hand of 40 looks older than a canon of 40.

**Lines follow temperament.** The wrathful and stern get frown lines first, the gregarious and kind laugh lines, the proud a set mouth. The face you wore becomes your face.

**Sex** grows from nothing at 11 to full at 17 (girls) or 19 (boys). Each person shifts a little by hash, with a floor so the cues always add up.

| Cue | Men | Women |
|---|---|---|
| Size | the head a twentieth larger | |
| Brow | ridge forward, forehead sloped; brows lower, straighter, heavier | smooth, upright forehead; brows higher and finer |
| Eyes | the same eye in a larger face: it reads smaller | reads larger; darker lashes |
| Nose | a tenth larger | smaller, the bridge lower |
| Jaw and chin | a tenth wider, square at the angle; a broad chin | tapered; a rounder, narrower chin |
| Lips | thinner, little colour | fuller, coloured |
| Neck and shoulders | neck 38 cm round, with an Adam's apple; shoulders a tenth wider | neck 33 cm round; sloped shoulders |
| Skin | coarser; a beard's shadow on the shaved | finer; softer flesh over the cheek |

**Height.** `p.app.height` times the v2 growth curve (`A.V2S.height`) is already the number. Now it is drawn.
- **Full figure.** Everyone stands in the same doorway, 210 cm for humans: 150 cm fills 71% of it and 195 cm fills 93%. Today about a third of that difference shows. The average man and woman of the people stand faintly behind. A head hardly grows with height, so an adult of 150 cm stands about 7 heads and one of 195 cm about 8½.
- **Bust.** The eye line moves from 30% of the frame (195 cm) to 44% (150 cm), so heads in a list sit at different heights. Today height does not touch the bust.
- **Words.** "A head taller than most men of Aldmark."

**Build** is three axes, drawn from features and the life:
- **Frame** (feature): shoulders 0.88 to 1.20.
- **Muscle:** the bulk feature, conditioning (`A.V2S.view(p)`), trade and age. A trade shows where it works: a smith's forearms and shoulders, an archer's back, a rider's thighs.
- **Fat:** the bulk feature, lifestyle, middle age, the gluttonous and temperate traits, prison, famine and illness. It settles by sex: on a man at the belly and under the jaw, on a woman at the hips, bust and upper arms.

Together they set the neck (0.8 to 1.4) and waist (0.82 to 1.45), and in the face full cheeks and a second chin, or hollow cheeks and collarbones. `p.app.build` and its stat effects (`GD.BUILD_FX`) stay as the starting point.

**The figure** stands in one of six stances chosen by id, role and temper: standing, weight on one leg, a hand on the hilt or the tool of a trade, arms folded, hands behind, on guard. A newborn lies swaddled. Hands have fingers, and a lost one shows.

**Other peoples.** Each has a base of its own in `data/looks.json`, kept to as strictly as the human one: elves long and fine-boned; dwarves broad, big-headed and heavy-browed; orcs heavy in jaw and brow, with tusks; giants the same anatomy at their own size. Half-bloods are means.

## 6. Hair

Stored: style (`hstyle`), fringe (`fr`), colour and facial hair. Features: texture, thickness, hairline, balding, grey onset, beard growth.

**Realistic, and drawn well.**
- **A mass first, strands second.** A style is 12 to 40 locks. Each lock is a ribbon laid over the skull along a guide curve (a root on the scalp, a path, a tip, a width), so a style is data, not code. The mass takes the window's light and casts its shadow on the forehead and neck. Strands are fine relief along each lock, and the light runs across them in a band: the sheen every head of hair has. At full size loose hairs break the outline.
- **Texture** (straight, wavy, curly, coily) bends every lock's path, so the same cut is a different outline on coily hair.
- **It hangs.** Long hair falls by its length and weight, and lies on the shoulders and over a collar.
- **The hairline** is cut pixel by pixel from its feature (low, straight, peaked, high) and moves with balding.

**The catalogue.**
- **38 styles** (13 today, about 8 distinct as drawn): 8 short (shaved, bowl, side-part, tonsure), 8 medium (bob, shag, half-tied, mop), 8 long (loose, tails, mane, side braids), 10 bound (braids, crown braid, buns, topknot, tight rows, locks), 4 shaped (crest, undercut, a fringe round a bald crown). Each is a way hair was really worn, with a comb, a blade, cord and pins.
- **Five fringes and four textures.**
- **14 kinds of facial hair**, from stubble (dots in the skin's relief) and moustaches to forked and braided beards: the same locks, rooted on the jaw. Side-whiskers are two cheek masses that stop above the mouth (V14). The growth feature limits what a man can grow. No hair grows in a scar.
- **18 natural colours** (9 today), plus each people's own. Strands vary a little, and the ends bleach on an outdoor life. Grey and white are never picked; they come.
- **Greying** starts at the feature's age (26, 34, 42 or 52) at the temples, the beard five years ahead. It comes lock by lock and never goes back: a lock once grey stays grey.
- **Balding** (men, by feature): temples, crown or both; by 60 a fringe round the crown. Women thin after 60. Elves never bald.
- **Who wears what.** Culture, sex, age and station weight the styles: slaves shorn, clergy tonsured, soldiers short. The crest leaves the courts (50 men, most of them nobles, wear a mohawk in seed 42).
- **Hair is state.** A barber, a prison or mourning can change it.

## 7. Wounds and scars

**A wound changes the form.** It edits the model's points and relief, so it shows in every view, under every light, at every age after. It is never inherited (§4).

| Wound | What it does to the form | Skin and hair |
|---|---|---|
| A cut (`scar_face`, `deep_cut`, `scar_arm`, `scar_chest`) | A trough with raised lips, 1 to 3 mm wide. Through a lid it leaves a notch; through a lip, a step in its edge; near a mouth or an eye it pulls the corner | Pale and a little shiny, lighter or darker than the skin by its tone. No hair grows in it: a gap in the brow, beard or scalp |
| A broken nose | The bridge sets to one side with a knot, whatever nose the features gave. A second break flattens it | |
| A lost eye | The lids closed and sunk over the socket; by station and temper a patch on a cord, or a milky blind eye left open | A scar round the lid |
| A burn | The skin drawn tight: it pulls a mouth's corner, a lower lid or an ear's rim; the surface ridged | Mottled pink, white and brown, and shiny; no hair |
| An arrow, a bite | A puckered star, sunk; a crescent of pits | |
| The pox | Pits over the cheeks and nose | |
| Half an ear, a brand | The upper ear gone, its edge ragged; a raised mark | |
| A hand, fingers | A bound stump or a hook; a hand with gaps (in the figure) | |
| A leg, a knee, a back | The stance: weight on the good leg, a stick, a stoop, one shoulder low (in the figure) | |
| Breaks that mend (ribs, arm, leg) | A binding, a sling or a splint until mended | |

- **Healing.** Raw, swollen and stitched or bound while fresh (`BM.fresh`); red for a year; pale by the third; thinner after 15; never gone.
- **Small sizes.** A scar is its true width at full size and never under 1.2 px on cards and lists. At the smallest size only what changes a whole feature shows: a shut eye, a bent nose, a burn's colour, a missing ear.
- **One writer.** `A.addWound(p, k, o)` gains `o = { at, y, src, n }`. Every wound stores a place and a year; a battle wound of a named person also stores the field. A caller that passes nothing gets this year and a place hashed from the id, the kind and the count: no new dice. `w.part`, 49-body-mind's five parts, is kept and read from `at`.
- **Places.** On the head: forehead, brow, eye, cheek, ear, jaw, nose, lip, chin, scalp and neck, left or right. On the body: ten more, from shoulder to foot.
- **Battles.** `src/war/99997-v2-war/b-battle.core.js:256` takes 7 health and stops. The engine's `pl.wound` (arm, leg, hand, knee, face, side) now picks a kind by how badly the phase went and calls `A.addWound`. `A.duelConsequences`, `A.lineBattleResult`, `A.stageOutcome` and `TS.outcome` pass the place of the blow too.
- **What a scar costs** (the owner: mostly looks). Nine marks in ten cost only looks: a cut, a broken nose, a torn ear, a burn. One in ten is an eye, a knee or a hand and costs a little: the wound table's `lost_eye`, `bad_knee`, `lost_fingers` and `stiff_hand`, whose sizes X4 (balance) keeps small. A lost hand, a limp and a ruined back stay as rare as they are today. Both the wounds of play and the old scars seeded on veterans follow that split.
- **NPCs fight too.** At world creation `A.LOOKS.seedScars(p)` reads years at arms and the arm's exposure, and writes 0 to 4 dated wounds from its own seeded stream. Blows land where they really do: the left side of the head and the weapon arm take most. During play, named people in a battle (commanders, your squad, captains) roll for a mark.
- **The childhood-scar quirk** (28 people; inherited and drawn on newborns today, V21) becomes a cheek scar dated to a hashed age of 2 to 5.
- **Nothing hides it.** No hood covers a face wound. The body page reads "Left brow: sword cut, Carrness, 1108."

## 8. Expression and bearing

Three layers. Lists show only the first, so identity is stable and cached. An expression moves the model's own points, so it folds the face along the same lines the years deepen.

1. **The resting face, from temperament.** Each of the 40 traits moves up to three of eight channels: inner brow, brow height, lids, gaze, mouth corners, lip press, head pitch, shoulders. A person's three traits add.
   - Proud: chin up, lids lowered, one brow raised.
   - Cruel: heavy lids, one corner of the mouth up.
   - Kind: inner brows up, soft corners.
   - Wrathful: brows knit, lips pressed.
   - Brave: level gaze, set jaw.
   - Deceitful: a smile that stops at the mouth.
2. **Mood** (profile, side panel, cards): happiness, health, the needs of 35-moods, grief, fear, love and opinion of you move the same channels a little, with pallor, flush and tired eyes.
3. **Scene.** The card's subject wears the card's tone, from the event's `scene.tone` tag (C8c). Today's word lists are the fallback.

**Rules (V10).** These are a sitter's faces, and small. Nobody grins with closed eyes (today a slave father and a royal both do); a smile lifts the corners of the mouth and the lower lids, as a real one does. Children show more, rulers and the proud less. Eyes can look aside (today they never move). Soldiers square their shoulders; serfs and the old stoop.

## 9. Dress

Six axes: **station** (the cut), **culture** (a family of cut, plus one mark), **wealth** (the finish), **role** (an overlay), **occasion** (which set) and **era** (which of three cuts). One pure function, `UI.DRESS.kit(p, ctx)`, reads `data/dress.json` and returns layers, each a piece with its material, colour, trim and wear, on the head, neck, shoulders, trunk (under, middle, outer), waist, arms, hands, legs and feet, with what is carried. A bust shows head to chest; the figure shows all of it. It replaces `PORTRAIT.outfit` and 63's culture table.

**How dress is drawn, so that detail is real.**
- **Layers in order.** A garment is the body's own surface pushed out by its thickness and cut at its neckline, openings and hem: shirt, tunic or gown, padded coat, mail, plate, surcoat, belt, cloak. Each lies over the one under it and nothing cuts through anything.
- **Folds.** Cloth hangs from the shoulders and the belt, and folds by its weight: linen in many fine folds, wool in few broad ones, silk in sharp ones.
- **Materials.** `data/materials.json` gives each one its colour, relief and shine at three distances. Detail finer than two pixels is never drawn as itself: it is averaged into colour and shine, so nothing shimmers.

| Material | Close (full size) | Middle (cards and lists) | Far (the smallest) |
|---|---|---|---|
| Linen | plain weave, creases, the gather of a drawstring | matte, pale, creased | its colour |
| Wool, coarse to fine | twill and nap; pilling and darns when worn | matte; folds few and broad | its colour |
| Silk, velvet, patterned cloth | sheen; a pile dark face-on and bright at the turn; the pattern's repeat | sheen and pattern | colour and a sheen |
| Fur | hairs at the edge, guard-hair tips, ermine's black tails | a soft pale or dark band | a soft band |
| Leather | grain, stitch holes, creases, worn edges | a dull shine | its colour |
| Padded coat | stitched channels, puffed between them | channels | ribbed |
| Mail | rings in rows, each row lying over the next, each ring with its glint; rust on poor kit | rows with a sparkle | grey with a glitter |
| Plate | the room mirrored in it; rivets, hinges, straps and buckles; the dents and scratches of battles fought | bright shapes, dark gaps at the joints | a bright mass |
| Scales, laced plates, a coat of plates | each scale lapped, each lace, each rivet head | rows | a texture |
| Embroidery, braid, woven bands | stitches in relief along collar, cuff and hem, in the people's own motifs | a band of colour | a line |
| Metalwork | a buckle is a frame, a tongue, a plate and its rivets; brooches, pins, chains, buttons, lace ends | a glint with a shape | a glint |

- **Small parts are objects.** A belt has a buckle, a strap end and holes. Laces run through eyelets, buttons sit in loops, a brooch has its pin. What hangs from a belt tells the life: a knife, a purse, keys, an ink horn.
- **Heraldry.** The house's arms (`PORTRAIT.coat` and `PORTRAIT.charges`, the release's own shapes) are painted onto the cloth as cloth: on a surcoat, a shield, a retainer's badge. The charge follows the folds.
- **Quality and wear.** Fine and masterwork gear (`A.qualOf`) is chased or gilded. Lifestyle wears cloth (patches, frayed hems, faded dye), the road muddies it, and a soldier back from the field carries its dents and dirt until the season turns.

**Station** (the North's items; each family supplies its own):

| Station | Cloth, cut and head indoors | The cue at 46 px | At full size |
|---|---|---|---|
| Slave | undyed sackcloth shift; shorn | neck ring, bare collarbones | the ring's rivet; coarse open weave; a rope belt |
| Serf | coarse undyed wool, patched; coif or straw hat | patches, cream and grey | each patch's stitches; a wooden toggle; a thong belt |
| Peasant | dull tunic over a shirt; the hood down as a collar | hood roll, earth colour | the shirt's drawstring; a horn-handled knife at the belt |
| Artisan | good plain wool, an apron bib; flat cap | apron straps, guild badge | the trade on the apron (scorch, dye, flour); a pewter badge; tool loops |
| Merchant | long gown, fur-edged collar, deep colour; big soft hat | the hat and the fur edge | the fur's guard hairs; a purse with clasps; a seal ring |
| Gentry | fitted and buttoned, standing collar, one bright colour; feathered cap | button line, sword-belt strap | cloth buttons in their loops; the belt's fittings; gloves tucked in it |
| Noble | patterned cloth in the house's colours, fur mantle; a coronet at court | fur shoulders, a jewel by rung | the weave's repeat; a collar of links; a signet |
| Royal | ermine, cloth of gold; the crown for the ruler alone | ermine and gold | ermine's black tips; the crown's own stones |

Children wear swaddling to one, a gown to six, then small copies of the grown cut.

**Culture families.** Each culture's `dress` key (in C7's data) names a family and one mark from its customs line (a cloak brooch, a tall hat, a turban, gold beads).
- **North** (Northfolk, Marchfolk, Leaf People, Eastfolk): tunic and cloak.
- **Court** (Solenfolk, Corsairs): fitted and laced.
- **Highland** (Wind Riders, Skyfolk, Cloudfolk): crossed coat, high collar.
- **Desert** (Qadiri, Sandfolk, Sabrans): layered robes, head-wraps.
- **River and coast** (Tamari, Keshi, Ranpuri, Amberfolk): light draped cloth.
- **Savanna** (Zanari, Abari): one-shoulder drape, beads.
- **Elder peoples:** elves in long robes, dwarves in leather aprons and beard rings, orcs in hides and bone, giants in furs.

**Wealth** is the five lifestyles of `A.LIFESTYLE`: Hard (one layer, patched), Modest (mended, horn pins), Comfortable (two clean layers, pewter), Rich (embroidery, silver, fox), Lavish (patterned silk, gold thread, gems). Wealth changes the finish, never the cut: a ruined noble wears a noble's cut gone threadbare, the jewels pawned.

**Era.** Each family has three cuts, early, middle and late, forty years apart, counted from the year 1100. A person wears the cut of the years they came of age, so the old look old-fashioned and a long game sees fashion turn. Armour's era is the gear itself.

**Roles.**
- **Soldiers, by arm** (D11's branches; V7). Their own `p.gear` decides the pieces, and every armour, helm, shield and cloak in `GD.GEAR` has its drawing: padded, leather, hide, mail, scale, laced plates, a coat of plates, mail and plates, plate, and the dwarves', elves' and orcs' own. Each wears the arm's badge at the collar. Open helms are worn in the field; closed helms are carried.

| Arm | What they wear | The cue at 46 px |
|---|---|---|
| Levy | their own clothes under a quilted coat, a kettle hat, their lord's badge sewn on | the hat's brim, the ribbed coat |
| Infantry | mail over padding, a coif pushed back or an open helm, a shield strap across the chest, a sword belt | grey mail at the neck, the strap |
| Archers | a padded coat or none, a bracer on the bow arm, a quiver strap and fletchings over the shoulder | fletchings at the shoulder |
| Cavalry | mail under a surcoat in the lord's colours with his charge; spurs | the surcoat and its charge |
| Knights | plate over mail over padding: collar, shoulder, arm and elbow plates, gauntlets and a breastplate; in the figure thigh, knee and shin plates too; their own arms on surcoat and shield | bright plate at the shoulders, their own arms |
| Orders | the order's mantle and badge over their harness | the mantle |

- **Clergy:** a habit by faith, tonsure, the cowl down.
- **Office:** one chain a post, read from A2's registry.
- **Retainers** wear the house's livery. Only they share a garment; each family member gets one of their own from the house's five tones (V9).

**Occasions:** everyday, court, field, road, mourning. A duelist is in shirt-sleeves with the blade drawn (V16).

**Your wardrobe** (the owner: right by default, and yours to change).
- The kit dresses everyone rightly. NPCs always wear it.
- The player has five outfits, one an occasion, and each starts as the kit's. In the wardrobe (`UI.wardrobe`, opened from your figure) every slot can be changed: the garment, among those your people, station and purse allow; its colour, among the dyes your purse allows; its trim; a hood or hat, worn or off; a cloak; the jewellery you own; the helm worn, carried or left; the surcoat on or off.
- You may always dress below your station. Above it a garment is offered only where you hold a right to it (an office, an order, a livery, a gift). Otherwise it shows locked, and the reason opens on click.
- A new garment is bought from a tailor, priced by its cloth. Dress changes the picture and the words on your page; armour keeps its numbers.
- Wealth still rules the finish: fall to a Hard life and your court gown goes threadbare.
- Stored in `p.app.w`: about 20 bytes for each outfit changed, and nothing for anyone else.

**Rules.** Hair is hidden only on the road, in mourning, on clergy women and where a custom says so: on at most one indoor portrait in ten, and never in a list (V13). A pendant is at most 6% of the bust's width. One crown a realm. The frame's metal shows station, since a gold frame on four people in five says nothing. The kit also gives the words for B4: "A russet tunic over a linen shirt, hood thrown back." Pieces keep plain names on every screen (rule 9): the detail is in the picture.

**The rest of C8c.** Events carry `scene: { place, subject, tone }`, with about 60 compositions (25 today) and interiors by station (V17, V19). Cut-ins get five tones (triumph, grief, dread, tender, solemn), so a levy's death is grief and never speed lines (V11). The dead get a memorial plate, their portrait in grey underpaint; the Chronicle gets a book face; four icons are redrawn (V22). V20, cut-ins over the text, is B5's.

## 10. The creation screen: customisation first

It replaces `UI.crStepBody`, under one line: "This is the face you will grow into."

**The picture** (on top on a phone): the bust, large and live; small front and profile views; the figure in the doorway beside the average man and woman; an age strip (0, 6, 12, 18, 30, 50, 70) that shows the hairline, the grey and the lines to come.

**Every feature has a control.** The 39 features of §3, the colours, the hair and the body: 49 controls. Nothing about your face is decided where you cannot see it and change it. Today there are 5 face controls with 16 options between them.

**Seven tabs**, at most eight controls a page (B5's limits):
- **Start:** sex, name, 12 designed faces of your people, take after father or mother, surprise me, paste a face's code.
- **Face:** length, jaw width, jaw shape, chin, chin width, cheekbones, forehead, cheeks.
- **Eyes and brows:** size, spacing, tilt, lids, depth, colour (12) · brow ridge, shape and weight, ear size and set.
- **Nose and mouth:** length, bridge, tip, width, tip shape · mouth width, lips, upper lip, bite.
- **Hair:** style (38), fringe (5), texture (4), thickness, hairline, colour (18) · facial hair (14), growth, balding to come, grey from.
- **Body and skin:** height in cm, build (8, effects unchanged), frame, bulk, legs, neck · skin (12), freckles, moles.
- **Dress:** the first everyday outfit, from your station's wardrobe (§9).

**How it handles.**
- **Pick on the face.** Click the nose and the nose's page opens.
- **Sliders of 8 to 32 steps**, with words at their ends. There are no percentages (centimetres are a real unit).
- **While you drag** the bust repaints at list detail, and sharpens when you let go.
- **After creation** the bone is yours for life. Hair and beard change at any time, dress in the wardrobe; the years and your wounds do the rest.

**Rules.** A description opens on click from an info icon. Controls use `data-a` and `data-c`, values go through `UI.esc`, and the preview is pure.

## 11. Rendering

**Pipeline** (plain JS, no libraries, no WebGL): `UI.PT.look(p, ctx)` turns the person into numbers; `A.V2.anatomy.model` turns the numbers into points and surfaces in millimetres; `A.V2.paint` draws them into buffers of depth, slope, material and place, lays the fine relief, lights them and returns pixels; the page gets an image. A GPU would be faster, but its contexts are few, are lost on phones, differ between machines and cannot draw the sheets in Node.

| Tier | Shown at | Drawn at (device px) | Crop | What is in it | Draw budget | Kept as |
|---|---|---|---|---|---|---|
| Stand-in | any | not painted | bust | a flat shape in the skin, hair and dress colours, as a 0.4 KB inline picture | 0.05 ms | not kept |
| S | to 40 px | 64 | head and collar (the head 54% of the width) | three tones, the hair's mass, the skin, the dress colour, the station's cue, one thin edge | 2 ms | 2 KB |
| M | 41 to 100 | 96, 144 or 192 | head and shoulders (46%) | every feature, cast shadows, each material's middle look, marks no thinner than 1.2 px | 3.5, 6 or 10 ms | 4 to 12 KB |
| L | over 100 | 256, 384 or 480 | bust to the upper chest (38%) | everything, at its true size | 17, 38 or 59 ms | 20 to 90 KB |
| Figure | full | 400 × 600 | the whole body | the L head on the body | 50 ms | 60 KB |

- **The budget** is a quarter of a millionth of a second a pixel plus 1 ms, on the CI machine: about half the prototype's cost, which drew its mesh one small triangle at a time and called `Math.pow` for every pixel. Kept sizes are estimates for JPEG at high quality, a fifth of the PNG measured in §0; sprint one measures both and picks. Grain is laid by CSS over the frame, not baked into the kept picture.
- **Against today.** A bust is 7.3 KB and 0.2 to 0.4 ms today, and the first version planned 18 KB and 2 ms for its largest. Paint costs ten to thirty times more to draw, once, and is then one image.
- **Screens.** Drawn sizes assume two device pixels to a CSS pixel and stop there. On a plain screen they halve, and the cost falls to a quarter.
- **Edges** are softened from coverage at the outline, never by painting four times the pixels.

**Never a wait.**
- **Sliced.** The painter works in steps (model, mesh, relief, light in bands of rows) and gives the page back every 6 ms, or 10 when nothing else is waiting. Visible portraits come first, the large one first of all.
- **Stand-in.** Until its picture is ready a portrait shows its stand-in, then the picture fades in (no fade under reduced motion). If painting ever throws, the stand-in stays and `UI.PT.errors` counts it.
- **Ahead of you.** The people really in your life (C6) and your court are painted in idle time before you open their page.
- **A setting,** Portraits: full or light, draws everything one tier lower on a weak machine.

**Delivery.**
- `PORTRAIT.tag(p, size, opts)` returns one `<img>` with a blob URL from the cache (the CSP already allows `img-src blob:`): one node a portrait, not 115 (P15). An unpainted one returns its stand-in with `data-pt="<key>"`, and gets its picture when painted.
- `PORTRAIT.svg` keeps its name and returns the same tag. Its 29 call sites put the string straight into the page, so none changes. `UI.ANIME.svg` stays as an alias until its four callers (91-look, 28-endings, 9996-polity, 9994-share) are moved; the share card takes its bitmap from `UI.PT.bitmap`.
- The frame is CSS round the image: the brief's cut corner, its metal by station (§9). The dead are greyed by CSS until C8c's memorial plate.

**Cache.**
- **The key is the look.** It is a hash of the numbers `UI.PT.look` returned, and the tier. Nothing that changes the picture can be left out of it (today's key leaves out `opts.front`).
- **What a resting look holds:** features, colours, the age step (yearly to 20, then every two or three years), wear, build, wounds, hair, kit, the realm's tint and the facing. Mood and scene tone are in the look of live portraits only; today every list bust is rebuilt when happiness moves five points.
- **Bounded by bytes:** 24 MB of kept pictures (12 MB on a phone), least recently used out first, never one that is on screen (today a map cleared whole at 1,500). Dropped blob URLs are revoked.
- **Shared work.** A person's model at an age step and the material tiles are cached apart, so the three tiers of one person share them.

**Gates** (C8b measures on CI at four times CPU throttle).
- If a page of 60 list portraits takes more than two seconds to fill, or any task runs over 50 ms while it does, painting moves to a worker. The engine modules touch nothing of the page for that reason; `worker-src blob:` then joins the CSP in `src/core/00-security`, with a DECISIONS record.
- If the same faces are repainted visit after visit, kept pictures are also stored in IndexedDB beside the saves, capped at 20 MB.

**Determinism.**
- **From the id.** Every choice that looks random (pores, moles, a strand's path, a crease's place, a scar's ragged edge, wear on a hem) is a hash of the id and a named channel: never `A.rand`, `Math.random` or the clock. A wound's detail hashes from the id, its kind and its number.
- **Steady through a life.** Those hashes do not change with age. The years deepen a crease and grey a lock; they never move one.
- **The same picture.** Noise is integer-hashed, the same bits in every browser. Light is floating point: one browser paints the same picture every time, and two browsers may differ by one step of colour in a pixel. Nothing painted is ever read back into the world.
- **Order cannot matter.** Each picture is a pure function of its look, whatever the queue painted before it.

**Purity and security.** Drawing reads the person once, in `UI.PT.look`, and writes nothing. The page receives pixels, so no markup from state can reach it. Colours are checked as hex before use, sizes are numbers, and the alt text goes through `UI.esc`. `renderRng`, `replayWithRender` and the pure and escape tests keep running.

**Seeds.** People held as seeds (9997's captains, C6's parish) draw from the seed's id, so the face is the same once they are met.

## 12. Cost, and old saves

| | Today | After C8b and C8c |
|---|---|---|
| The look, a person | 179 bytes | about 166: 30 for `g`, 7 for the fringe, less 50 for `face`, `brow`, `mouth`, `nose` and `eyeShape`, which the features replace (their readers, `PORTRAIT.outfit` and the creation screen, go too) |
| Wounds | none | about 48 bytes each; one adult in six seeded, so about 11 bytes a person |
| Dress, expression, age, sex, wear | | 0: derived |
| The player's wardrobe | | about 20 bytes for each outfit changed |
| Save | about 300 KB at the start | 10 to 16 KB more (random characters do not compress); a test holds 5% |
| The page | 271 KB for the two renderers that retire (`anime.core.js` 164, `miniatures.core.js` 107), and the release's paper dolls | the painter and its data in their place: about 400 KB, an estimate, most of it hair and dress data |
| Memory | SVG strings in a map | 24 MB of kept pictures at most |

**Old saves.** `A.SAVE_VER` goes up by one (to 15, unless A2 has taken it), and a new step, `looks`, of `A.V2SAVE.upgrade` calls `A.LOOKS.migrateAll(S)`:
1. People are taken in birth order, so children inherit from parents already done.
2. The five old values lean the features, so a face you chose keeps its character: face shape leans the jaw, nose the length, eye shape the lids.
3. Written words are applied on top. `hstyle` maps to the new list; yours stays as you chose it.
4. Wounds get places by hash. The scar quirk is converted. NPC veterans are seeded; your own body is left as you lived it.

The same save always gives the same faces. The three saves in `tests/saves/` must load with everyone painted, and a new sample save is added at the milestone.

## 13. Files and functions

X1 and X6 (the naming pass) may move paths: `docs/NAMES.md` gives the new name for an old one. Function names stay.

**The engine** (plain ES modules that touch nothing of the page; unit-tested by `tests/v2/`; exported from `src/core/engine/index.js` once the owner approves the demo; rebundled by `tools/build-v2.mjs`).
- `src/people/engine/face.js` and `tests/v2/face.test.js` (new): the feature layout, `make`, `pack`, `unpack`, `distance`, `inherit`, `parentsFor`, `takesAfter`. On the page as `A.V2.face`.
- `src/people/engine/anatomy.js` and `tests/v2/anatomy.test.js` (new): the measurements in millimetres; `grow` (the growth curves), `ageing`, the sex cues, `build`, `wound(kind, at)`, and `model(look)`, which returns the named points and the relief lines. On the page as `A.V2.anatomy`.
- `src/people/engine/races.js`: `heightFraction` gains the height lost in old age.
- `src/ui/engine/paint/` and `tests/v2/paint.test.js` (new; the map's precedent is `src/map/engine/render.js`): `surface.js` (the surfaces round an axis, and layers pushed out from them), `raster.js` (depth, slope, material and place; the sharp cuts), `relief.js` (lines and marks per pixel; the floor on small sizes), `light.js` (window, fill, cast shadow; skin, metal, cloth and hair), `materials.js`, `hair.js` (locks, textures, hairlines, beards), `garments.js` (cuts, folds, small parts), `figure.js` (trunk, limbs, hands, stances), `portrait.js` (`job(look, tier)`, which paints in steps, and `standIn(look)`). On the page as `A.V2.paint`.

**C8b.**
- `src/people/99993-v2-looks/` (new): `a-genes.core.js` (wraps `A.genAppearance`; `A.LOOKS.fromWords`, `A.LOOKS.wear`, the family that fits your face), `b-wounds.core.js` (`A.addWound`, `A.LOOKS.seedScars`, the quirk), `c-migrate.core.js` (`A.LOOKS.migrateAll`), `test.mjs`.
- `data/looks.json`: each people's base measurements and spreads, feature means, tones, shades, textures and 12 designed faces. `data/materials.json`.
- `src/core/99998-v2-saves/saves.core.js`: the `looks` step and the version.
- `b-battle.core.js`, `src/war/72-two-scales`, `A.duelConsequences`, `A.lineBattleResult`, `A.stageOutcome`: wounds with places.
- `src/ui/93-portraits/` (new): `a-look.core.js` (`UI.PT.look`, `UI.PT.key`, and `UI.PT.armsTile`, which turns a house's coat into a tile for the painter), `b-cache.core.js` (the cache, the queue, `UI.PT.settled()` for tests), `c-image-tag.core.js` (`PORTRAIT.tag`, `PORTRAIT.svg`, `UI.portrait`, `UI.PT.bitmap`, the frame), `d-live-portrait.core.js` (mood, scene tone, the blink), `e-creation-screen.core.js` (replaces `UI.crStepBody`, `UI.crPreviewPerson`, `UI.crRandomize`; face codes), `test.mjs`, `README.md`. Until C8c it dresses people from `PORTRAIT.outfit`'s ten kinds and their own gear.
- `src/ui/93-anime-portraits/` goes whole to `archive/` when 93-portraits serves every call site, with a note, and the last commit that had it in HISTORY.
- `tools/sheets/demo.mjs` (the demo of §14) and `tools/sheets/portraits.mjs` (every sheet below, drawn in Node from the engine, or from a built page where a sheet needs a world).
- A check, `looksAgree`, in `src/core/08-coherency`: words against look, a wound with no place, a scarred newborn.

**C8c.**
- `data/dress.json`; `src/ui/93-portraits/f-dress-kit.core.js` (`UI.DRESS.kit`, `UI.DRESS.words`, `UI.DRESS.era`) and `g-wardrobe.core.js` (`UI.wardrobe`); `PORTRAIT.outfit` goes.
- `src/ui/63-miniatures/` and the release's paper dolls (`PORTRAIT.full`, `PORTRAIT.bust`) go to `archive/` with notes, and their two settings with them. `PORTRAIT.coat`, `PORTRAIT.charges`, `PORTRAIT.device` and `PORTRAIT.beast` stay.
- C7's culture data (the `dress` key), `tools/lint-events.mjs` (`scene`), `src/ui/94-woodblock-skies`, `src/ui/96-moments`, `docs/art/style-guide.md`.

## 14. Acceptance

**Gate zero: the demo, before anything is built into the game** (the owner: demos first; it takes the place of the first version's gate one). `node tools/sheets/demo.mjs` writes one page that opens in any browser, `docs/design/demo/characters.html`, and its sheets as PNG, from the engine modules alone. The game is not touched: nothing in `src/ui`, no state, no saves, and the modules stay out of the game's bundle. It needs neither X1 nor A1, so it can start at once.

| Sheet | Shows |
|---|---|
| `faces` | 20 men and 20 women of one people, bare-headed in one shirt, at 150 px; six of them at front, three-quarter and profile |
| `ages` | one man and one woman at 0, 1, 3, 6, 10, 14, 18, 30, 45, 60, 75 and 90; an elf and a dwarf at six ages |
| `scars` | one veteran before and after: a cut through the brow, a broken nose, a lost eye three ways, a burn, pox, half an ear; each fresh, at a year and at twenty years |
| `builds` | 150, 172 and 195 cm in the doorway; gaunt to heavy; slight to broad; a smith beside a clerk |
| `hair` | the 38 styles on one head; one style in four textures; greying at 30, 45, 60 and 75; balding; the 14 beards |
| `outfits` | the eight stations of the North, a levy, an archer, a man in mail and a knight in plate with his arms, each at full size and at 46 px; close-ups of mail, a buckle, embroidery and fur |
| `sizes` | six people at 32, 46, 88, 150 and 240 px |
| `registers` | six of the cast in paint, and in ink and flat tone, side by side, each drawn with care so the comparison is fair |
| The face maker | live controls for every feature of §3, with the age strip |

The owner looks and says yes, no or what to change. The answer is recorded in DECISIONS, and work in the game starts only then. Playtester agents score `faces`, `ages` and `sizes` against C8b's pass marks as a first reading. If the faces fail, §15's fallbacks apply.

**C8b: faces and bodies.** `node tools/sheets/portraits.mjs <built.html>` writes each sheet as a PNG. Three playtester agents judge the sheets; the tests run in `tools/check.mjs`.

| Sheet or test | Pass | Today |
|---|---|---|
| Sheet `faces`: 20 adults of one people and sex at 150 px, and the same 20 cropped and beardless in one shirt; match them | 90% | near chance |
| Sheet `list`: 20 people of one culture at 46 px, as a list shows them; find each among the same 20 at 150 px | 85% | walls of clones |
| Sheet `sex`: 12 beardless men and 12 women at 88 px | 95% | not sortable |
| Sheet `ages`: 32 people in eight bands; name the band | 85% | one drawing from 13 to 40 |
| Sheet `grow`: one person at twelve ages, shuffled; put them in order | 9 neighbours in 10 right | |
| Sheet `temper`: 12 busts, six opposed trait pairs; pick the trait | 70% | random |
| `looksLadder`: each feature's two ends change this share of a 150 px head | 0.25% | nose 0.03% |
| `faceSpread`: the closest pair of 20 differs clearly on 5 features | 95 sheets in 100 | no gene |
| `faceKin`: parent to child against strangers; siblings not clones | 0.65 at most; 0.2 at least | no inheritance |
| `faceHand`: every feature set by hand is stored, painted and kept through a save; nothing rolls over it | 39 of 39 | 5 controls |
| `looksTrue`: on the model: heads tall at 0, 1, 3, 6, 10, 14 and 18; the face's share of the head; height at 80 | within 3% of `data/looks.json` | |
| `looksWounds`: every kind that marks the body shows in its place, with its year; a v2 battle wound is stored | 22 of 22 | 6 |
| `looksForm`: a cut, a broken nose and an empty socket change the depth by 1 mm or more where they lie, and nowhere else | pass | drawn on top |
| `looksVeterans`: of those with ten years at arms, the share who carry a mark; nine marks in ten cost only looks; nobody under two has one; the balance bands hold | six in ten | none |
| `looksHeight`: 150 and 195 cm, head tops in the figure; eye lines in the bust | 18% of the frame apart; 8% | about 8%; 0 |
| `looksContrast`: eyes, nostrils and lip line against the skin round them, on every tone | 2.5:1 | 1.16:1 |
| `looksGrin`, `looksChops`, `looksEyes`: the smile rule, side-whiskers, iris colour | pass | fail |
| `looksBytes`, `looksNodes`: `g` with its key; the People page | 30 bytes; 800 nodes | 2,100 nodes |
| `looksBudget`: each tier's time and kept size; a page of 60 fills in time; no task over 50 ms while it fills | section 11 | |
| `looksSame`: one look painted twice, in any order of the queue, at any slice | the same bytes | |
| `looksWords`: written people agree with their look | 270 of 270 | disagree |
| `looksOldSaves`: the three sample saves | 0 stand-ins left | |
| Kept, under 93-portraits: `apDeterministic`, `apPure`, `apEscaped`, `apAxe`; and `renderRng`, `replayWithRender` | pass | pass |

**Order after the gate** (in the game, so after X1 and A1, as CRITIQUE §2 has it): the head, sex and age; hair; height and build; wounds and expression; the creation screen, saves and delivery.

**C8c: dress and regalia.**

| Sheet or test | Pass |
|---|---|
| Sheet `stations`: 8 stations in 4 families, labels hidden | 85% at 88 px, 70% at 46 |
| Sheet `arms`: six soldiers among six civilians; soldier or not, and which arm | 95%, 80% |
| Sheet `wealth`: one station at five lifestyles, put in order | 80% |
| Sheet `materials`: twelve close-ups at 240 px (linen, wool, velvet, fur, leather, a padded coat, mail, plate, scales, embroidery, a buckle, a chain); name each | 90% |
| `dressLayers`: on 200 random soldiers every piece lies over what is under it; nothing cuts through anything | 0 breaks |
| `dressGear`: the picture shows the person's own `p.gear` (armour, helm, shield, cloak) | 300 of 300 |
| `dressWardrobe`: the player changes each slot of each outfit; it is stored, painted and kept through a save; nothing above the station is offered without its right | pass |
| `dressUnique`: in 12 worlds, living kin who share a garment and are not retainers | 0 |
| `dressHoods`: hair hidden indoors; in lists | 10% at most; 0 |
| `dressCrown`, `dressDuel`: one crown a realm; no crown or ermine in a duel | pass |
| `sceneTags`: a 60-card sample, picture matches tag | 60 |

Today only the nobility can be named, a soldier is a striped top, and a house shares one tunic.

## 15. Decisions, records and risks

**The owner's answers** (12 November: D-015 at 10:46 ET, D-020 at 10:52 ET).

| Question | The owner's answer | Where |
|---|---|---|
| The register: anime or realistic? | Weigh it again and choose the better. **Chosen here: realistic**, a painted likeness | §1; confirmed by eye on the `registers` sheet |
| Growth, age, scars, dress | People grow up accurately, age truly, carry lasting scars that change structure, and wear armour and clothing drawn to the smallest feature | §5, §7, §9 |
| Veterans' old scars: real, or looks only? | Real. Mostly looks; small debuffs only where it makes sense: an eye, a knee, a hand | §7 |
| May creation redraw your family to fit your face? | Yes | §4 |
| Retire the older renderers? | Yes: the woodcut miniatures and the paper dolls at C8c. With this register the anime renderer retires too, at the end of C8b | §13 |
| How far does customisation go? | Every feature of the face by hand, in depth. Customisation first; genes and inheritance second, for defaults, NPCs and children | §3, §10 |
| Height and build that show? | Yes | §5 |
| 38 hair styles? | Yes, realistic and drawn well | §6 |
| Clothing | Right for class, culture and role by default, and the player can change it | §9, your wardrobe |
| When does building start? | After the owner has seen demo sheets (faces, ages, scars, builds, hair, outfits) and approved them | §14, gate zero |

**Still for the owner, by eye, at gate zero:** the look itself, and paint against ink on the `registers` sheet.

**Records to add when approved** (DECISIONS):
- this document, as the plan under D-015 and D-020, and the register with its reasons;
- the conflict under rule 10: "as realistic as possible" inside one HTML file with no art assets; the fix chosen is a painter in plain JS;
- portraits are images, not inline SVG, and `PORTRAIT.svg` keeps its name;
- the budgets of §11, against the brief's 8 KB and 1 ms and the first version's 18 KB and 2 ms;
- the painter as engine modules under `src/ui/engine/paint`, after the map's;
- `heightFraction` loses height in old age, so a number on the sheet changes;
- open helms in field busts, against 93's "no helm in a bust"; a foe turned, not flipped;
- what goes to `archive/` and when (§13);
- if taken: the worker and its CSP line, the pictures kept between visits, the CC0 mesh and its licence;
- to `docs/IDEAS.md`: what a court makes of your dress; mounted figures; beasts in the same hand.

**Risks.**
- **The wax doll.** Procedural realism has a floor as well as a ceiling, and the prototype's heads are still lit clay. Gate zero exists to prove skin, hair and cloth before anything else is built. The fallbacks, in order: a sculpted CC0 base under the same painter (§2); then the inked finish on the same model. Sections 2 to 10 stand either way.
- **Small sizes.** Paint is weak at 46 px. The S tier's crop, grouped tones and edge answer it, and the `list` sheet tests it.
- **A phone's first look at a long list.** The slice, the stand-in and painting ahead answer it; the worker gate decides.
- **Hair** is the largest single piece of art: 38 styles in four textures. A style is data, so styles land in lots, each passing its sheet. One that cannot be drawn well is redrawn, not shipped.
- **Size of the work.** This plan is larger than the first version. Gate zero is the place to stop, cut or change course cheaply.
- **Balance.** Seeded scars shift a few veterans' fighting worth; the balance run must pass.
- **Dependencies.** C8c needs C6's commoners and C7's cultures. The demo needs nothing.
