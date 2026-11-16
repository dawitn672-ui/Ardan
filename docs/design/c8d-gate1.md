# C8d gate 1 · profile cards in your reference style

*For the owner. Orders 56, 57 and 58; decision D-068. Nothing here is in the game yet: this is the style frame to approve or change.*

## What you are looking at

| Picture | What it is |
|---|---|
| `docs/design/demo-2d/c8d/sheet.png` | **The sheet:** 8 stations × 4 of Ardan's own peoples, in your reference's card |
| `docs/design/demo-2d/c8d/details.png` | **The small differences:** neighbours across one border, a border town, wealth inside one station, one nation that is not one look |
| `docs/design/demo-2d/c8d/one.png` | Eight cards at the size the Profile tab would show them on a phone (420 px) |
| `docs/design/demo-2d/c8d/compare.png` | Your reference beside this sheet |

**The four peoples** are the reference's four, mapped onto the real ones (`cultures.js`, the lore's realms):
Northfolk of **Northreach** (the cold coast), Qadiri of **Qadir** (the desert), Wind Riders of **Ulun** (the steppe),
Zanari of **Zanara** (the southern forest). The small differences use **Sabra** (Qadir's rival across the Gulf) and
**Aldmark** (the empire south of Northreach, the same folk).

**The card** is your reference's: dark navy, a thin gold edge, the realm's banner with its crest and name, the person
from the waist up before a scene of their land and station, then the station with its icon, three keywords and a motto.
Added: the person's name and age above the station, the people and land under the realm's name, and the ruler's real
title (King, Sultan, Khan, Emperor) in place of "Royal".

**Every card is drawn by code**, from the person's data, the same every time. No image is used, for people or for
backgrounds: a painted background was weighed and left out (a card's whole drawing is 21 KB; one painted background of
that size is 40 to 80 KB, and 32 scenes would cost more than the whole game's first load can spare).

## Said plainly: what code reached, and what it did not

**Reached:** large clear eyes with a coloured iris and two catchlights; a clean coloured outline with tapered lines for
folds, lids and strands; shading in two flat steps with a rim of light down the far side of the whole figure; hair drawn
lock by lock with a jagged band of light across the crown, braids, coils, locks with rings; cloth with folds, trims that
carry each people's own motif, woven and printed patterns; mail, scale and laced plates; metal with a hard highlight;
fur; the full frame; a scene for every land and station.

**Not reached:** your reference is *painted* by an image model; this is *drawn*. It reads as clean cel animation, not as
a painting. Missing against the reference: soft blended light on faces and cloth, real three-quarter turns of the head
and body (these are near front views, turned a little), foreshortened arms and expressive hands (the arms are the
weakest part: simple jointed shapes), hair that flows as freely, backgrounds with painted depth and detail. Faces are of
one drawing hand: they differ in shape, eyes, brow, beard, age and mood, but less than painted faces would.
Closing that gap needs painted art (an image model with a key, order 56, or an illustrator): code will not get there.

## The choices to approve or change

1. **The look itself:** clean cel drawing, as shown. *Or* wait for painted art and use this only as the fallback.
2. **Dress by people** (all on the sheet; the reasons are in the code beside each garment, `manhwa/peoples.js`):
   - **Northreach:** wool and fur, a tunic, a cloak pinned on one shoulder, knotwork, amber and silver (cold; a seafaring
     folk; silver arm-rings are pay and rank).
   - **Qadir:** loose layered cotton and linen, wound turbans, headcloths and veils, a sash with a curved knife (a free
     man's mark), star and key patterns, copper and gold (heat; a faith that distrusts display in its priests).
   - **Ulun:** a coat lapped across the breast and closed with toggles, felt and fur-brimmed hats, cloud scrolls, belts
     of plaques, coral and turquoise (riders: wealth must ride away with you).
   - **Zanara:** strip-woven cloth wrapped and draped, bare arms, tall headwraps, beads, copper and gold, zigzags (heat
     and wet; gold country; patterns belong to lineages).
3. **Royals without a shared crown** (order 58): a black iron crown and bearskin; the largest turban in the realm with
   two plumes; a sable hat with the gold plaque of the Compact and the nine-tailed standard; a bead crown whose fringe
   veils the face.
4. **Banner colours and crests** are this gate's proposal (the lore gives each realm a map colour, not arms): a wolf on
   sea-blue, a crescent on teal, a bow on red, a sun on ochre, an anchor for Sabra, an eagle for Aldmark.
5. **Words:** the keywords and mottos are new, one set per people and station, in the period voice. Change any.
6. **The name on the card:** shown above the station. Your reference has none.
7. **Arms raised or resting:** every pose here is calm. Say if you want more movement at the cost of more odd arms.

## Order 58, checked against the sheet

| Correction | On the sheet |
|---|---|
| **Royalty:** distinct identities, no shared crown and fur cape | *King of Northreach:* heavy bear and sable furs, black iron crown, blued scale, the Ring on a silver chain. *Sultan of Qadir:* white silk, a layered turban with gold band, emerald and two plumes, a midnight mantle edged with gold key-work, no crown, no fur. *Khan of Ulun:* sable hat with gold plaque and hawk plumes, sky-blue silk, crossed leather harness with the tribes' boss, belt of gold plaques, the horse-tail standard behind. *Emperor of Zanara:* bead crown with a fringe, royal strip-cloth, four-row gold collar, cast gold breast-disc on a strap, gold on both arms, the whisk of judgment |
| **Military:** different equipment, insignia, shields, weapons, helmets; not every soldier helmeted | *Northreach:* riveted helm with a nose-bar, mail, round quartered shield, bearded axe; silver arm-rings for seasons served. *Qadir:* pointed helm wound with cloth, mail under cotton, steel buckler, lance with pennon, sabre; the Sultan's sash. *Ulun:* **no helm** (a fox-brimmed hat), laced plates, horn bow and quiver, sabre; belt plaques for rank. *Zanara:* hide cap with cowries and a crest (no iron), quilted cotton, tall painted shield, broad spear; bead strings for rank. *Sabra:* no helm and no mail (a marine) |
| **Social class:** serfs show dependency and labour owed; peasants an independent household | *Serfs:* undyed, patched cloth, a rope for a belt, and their lord's things: the tally of days owed with his seal (Northreach), the well-warden's copper water-tally (Qadir), the owner's brand on a tag and a hat with no fur (Ulun), an iron arm-ring with the house's mark (Zanara); the tool and the load are the lord's. *Peasants:* dyed cloth in the region's cut, a leather belt or dyed sash, their own knife, purse, cup, beads, hat, hood or scarf, their own tool |
| **Body language:** varied; no repeated folded arms | No folded arms anywhere. Ten poses are used (a hand on the hip, on a hilt, on the heart, on the breast, at the belt, offering, holding, gripping a staff high or low, at rest), in different pairs, and five moods (calm, warm, proud, stern, meek); no station repeats one pair of poses across its four peoples |
| **Cultural overlap:** border settlements | `details.png`, second row: a town where Qadir and Zanara meet. Mixed fabrics (a Qadiri robe cut from Zanari strip-cloth), borrowed armour (a Zanari watchman in a Qadiri helm with a Qadiri sabre), shared hair and headwear (a caster with Zanari locks and rings under a Qadiri skullcap), both peoples' buildings in the scene behind, beads crossing the border by marriage |
| **Recognisable nations, not identical citizens** | `details.png`, third row: eight free herders of Ulun. The cut is constant; dye, hat, hair, beard, pose, vest or scarf, and what hangs from the belt vary by wealth and by the person's own dice. First row: the same station either side of a border (Qadir and Sabra, Northreach and Aldmark). Second row, right: wealth inside one craft |

## What it costs

Measured by `node docs/design/demo-2d/c8d/sheet.mjs --measure` (32 cards; `measure.json`):

| | |
|---|---|
| One card's drawing (SVG) | **75 KB** as text (54 to 103), **21 KB** gzipped; 18 KB without the scene |
| Making it (the code's own time) | about **3 ms** a card |
| Drawing it in the browser | about **10 to 14 ms** a card on this machine; about **35 to 42 ms** with the processor slowed four times (a middling phone) |
| The new code | 245 KB of source, **72 KB** gzipped before minifying (the whole game is about 3.7 MB) |
| Images | none |

One card on the Profile tab is far inside budget. A list of thirty full cards is not (over a second on a phone): lists
keep small figures and the full card opens on a tap.

## For the builders: how it would go in

- **The code** is `src/ui/engine/figure/manhwa/` (`index.js`: `card(person)`, `figure(person)`, `kitFor(person)`). It is a
  second render layer of the figure library: it shares `g.js` (dice, curves, colour) and `palette.js`, and has its own pen
  (`ink.js`), head, hair, body, wardrobe, hats, arms and scenes. It is not exported by `figure/index.js` and is not in the
  engine bundle until this gate passes.
- **Input:** `{ id, name, sex, age, app: { skin, hair, eye, build }, station, cult, realm: { short, color, device, title, field },
  wealth, border }`. `src/ui/93-figures`' sheet (`figures.c-looks.core.js`) already has all of it except `station` (from
  estate, job, rank and ruler, as `wardrobe.js` already works it out), `wealth` (from coin and holdings, three steps) and
  `border` (from the person's home province and its neighbours' cultures).
- **Profile tab:** the card replaces the `tall` portrait there; the foot's keywords and motto come from the person
  (station, trade, traits), with these sets as the fallback. People's cards and scene portraits use `figure()` (no frame,
  no scene) at their present sizes.
- **Cost rules:** cache the SVG string by `lookKey` (as 93 does); draw the full card only where one is shown; put the
  scene in once per (land, place) and `<use>` it when several cards share a page; lazy-load the layer with the Profile tab
  so the phone's first load does not pay for it (X7).
- **Still to do if approved:** the other twenty peoples (each a family or an accent of one), children and the old, wounds
  and scars (the present library has them), the face code's 39 features feeding `faceOf`, the player's outfits (C8c's
  occasions), every gear item's art, tests (determinism, purity, a sweep of all stations × peoples), and the three-quarter
  view if painted art does not replace it.
