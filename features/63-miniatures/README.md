# Painted miniatures

**Aspect:** Visual art (Road to Ten, Visual art 2) · **Kind:** a new portrait renderer in readable `miniatures.core.js`, one patch (the menu setting), no events

The plan says: "Replace the paper dolls with layered ink portraits (heads, hair, faces, clothes and armor by culture), 3 or 4 poses, with age and scars visible." The style guide (`docs/art/style-guide.md`) says the people should be painted miniatures: "ink line, two-tone wash, a gold or lapis ground, age and scars in the line."

The release draws people with `PORTRAIT.full` (200 × 340, at 120 px and up) and `PORTRAIT.bust` (200 × 200, for lists). It does layer its parts: body, cloak, hair, legs, torso, armour, tabard, arms, weapon, head, helm, shield and a banner. Age greys the hair and adds two wrinkle lines. Race sets the proportions, the ears and the tusks. Rank and realm set the colours, and wounds add an eye patch, a scar or a hook. But it paints everything in flat fills and linear gradients on a green gradient sky, with no line weight and one stiff front pose. Every face has the same round eyes, highlight and smile, and culture never shows. A newborn is drawn as a small standing figure in a tunic, on adult-like proportions, and its bust shows an adult's face. Screenshots: `/tmp/ardan/miniatures/gallery-before.png` (release) and `gallery-after.png`.

**What it does.** `PORTRAIT.svg` is wrapped. While the setting is on (the default), every portrait in the game goes through `UI.MINI.svg`: the side panel, the profile, people lists, events, duels, the obituary, the naming of a child, the family tree and the squad chips. When the setting is off, or if drawing ever throws, the release's drawing is used.

- **The frame.** A vellum margin and a round-arched panel; the bust uses a lunette. Inside the panel is a gold-leaf ground with a tooled diaper for rulers, royals, nobles, clergy and officers, and a lapis ground with gold quatrefoils for everyone else. The dead get the bare page. Around the panel run a 1.7-unit ink rule, a vermilion rule inside it and a hairline outside it, with solid ink squares at the corners. Rulers and nobles stand on a tiled floor and everyone else on a grassy mound.
- **Line.** Every shape has an ink outline. A filter dilates the whole figure's own shape in ink behind it, so the outer silhouette is heavier than the inner lines (about 2 units against 1 at full size). A fixed-seed displacement filter gives the line a small hand wobble on the full figure. Small pictures (under 60 px) get heavier lines (×1.7).
- **Wash and shade.** Each garment is painted with two tones. The release's colour is turned into a pigment: desaturated, kept off pure black and white, and warmed toward earth. Its shadow side, about the right third, is masked off and filled with a darker wash and 45° hatching. Hatching is a pattern fill and there are no gradients. Folds are tapered strokes from the belt to a wavy hem, and a seeded sway moves the hem. Colour identity survives: realm cloth for nobles and soldiers, the house's field and charge on tabards, shields and the corner arms, white for clergy, ermine for royals, and the release's earth tones for commoners.
- **Faces in ink.** Lids, irises, brows and a nose line with a nostril hook, plus a mouth whose curl follows happiness and a lip wash. Everyone gets a vermilion blush, strongest on women and children. Children have bigger, lower eyes and a short nose, and a newborn may be asleep. **Age** starts at the middle of prime: crow's feet, then bags under the eyes and folds from nose to mouth, forehead furrows, then heavy lids, jowls, sunken cheeks and wild brows. Hair greys and whitens as in the release. Old men may recede or go bald (seeded). Older women are veiled with a wimple. **Wounds**: a stitched scar down the cheek, an eye patch on a cord, a hook and a wrapped stump for a lost hand, a kinked nose, a notched ear, a burn, a brand, and a mark for lost fingers. A limp splays one leg.
- **Race.** Height, breadth and head size follow the race. Elves get long pointed ears and lifted eye corners, half-elves short points, orcs pointed ears, tusks, a brow ridge and a flat nose with nostrils, half-orcs small tusks. Dwarves are broad and short, with bulbous noses, and their beards are 0.75 head lengths longer. Giants are the largest figures, with heavy brows.
- **Culture.** Each of the 24 cultures has a cut of dress (tunic, robe, kaftan with a crossed front, or a drape over one shoulder), headwear for men and women, and sometimes a collar, a pattern, a sash and a dye for commoners' cloth. Some examples:
  - Northfolk hoods.
  - Solen caps and veils.
  - Wind Rider cones with fur brims and kaftans.
  - Qadiri turbans and indigo.
  - Tamari fillets and bead collars.
  - Zanari zigzags and beads.
  - Abari striped drapes.
  - Eastfolk fur hats and embroidered collars.
  - Skyfolk maroon kaftans.
  - Corsair kerchiefs and earrings.
  - Sylvari leaf wreaths.
  - Holdfolk leather aprons.
  - Orc bone necklaces.
  - Giant fur and torcs.
- **Rank and gear.** Crowns and circlets, ermine, gold trim, a priest's stole and cowl or tonsure, an artisan's apron, a merchant's purse, rags with a torn hem and a patch, an officer's baldric and pips. Every armour look of the release is drawn (mail, scale, lamellar, padded, leather, hide, brigandine, plate, mail-and-plate, elf, orc and dwarf mail and plate), and so are every helm, shield, cloak and tabard. Closed helms (great helm, bascinet, dwarf helm) are set down at the figure's feet and a mail coif is worn instead, so the face still shows. Weapons: a sword planted point down under both hands, or sheathed at the hip; axes, maces, hammers and mauls planted or hanging from the hand; spears, pikes, lances, halberds and staves held upright; a bow on the back.
- **Poses**, from a hash of the person's id and their role:
  - standing, one hand raised in the speaking gesture;
  - a three-quarter turn with a hand on the belt;
  - hands on the hilt (armed with a blade);
  - holding the staff or spear (the old take a walking staff);
  - seated (most rulers, on a throne with a cloth of honour and a footstool, sceptre in hand; half of the old, on a bench).
- **Children and infants.** Height grows from 0.3 to 1 of the adult figure over the race's growing years, and heads go from 1 in 3.7 of the figure's height to the race's adult ratio. No one under four-fifths of adult age carries armour or weapons. A newborn (under 1.2 years for humans) is swaddled in bands under a coverlet of the family's colour, in a rocking cradle. In a bust, the newborn is an upright swaddled bundle in a baby's coif.
- **The setting.** "Painted miniatures (portraits)" in the menu (`UI.set.miniatures`, saved with the other settings), next to the theme (patch `MN-MENU`).

**Measured by.** `test.mjs`, run on a build with 27-accessibility and 61-illumination (`--only=miniatures,accessibility,illumination`):

| Test | Result |
| --- | --- |
| `miniEveryRace` | 84 people (7 peoples × 2 sexes × 6 ages: newborn, 6, 14, 25, 45 and 70 in human years, scaled to each people's growth and age), each as a full figure and a 46 px bust: all valid SVG, 0 fallbacks to the release. Size: full figure 15.0 KB on average (max 20.2), 46 px bust 6.3 KB (max 8.9) |
| `miniDeterministic` | 202 of 202 drawings identical when drawn again; 101 distinct pictures for 101 people in a world. The world's poses: stand 31, three-quarter 26, seated 31, staff 9, hilt 4 |
| `miniAgeWoundsChildren` | One man at 25, 45 and 70 draws three different faces. 7 of 7 visible wounds change the picture (lost eye, face scar, lost hand, broken nose, ear, burn, brand). Figure heights in the 340-unit frame: newborn in its cradle 108, age 6 171, age 14 243, grown 260, a dwarf 209, a giant 269. The newborn is swaddled |
| `miniPure` | Drawing the life, people, realm and legacy tabs, the profile and a person's page leaves `A.S` and `A.rngState` unchanged. Markup in a name, a colour and a gear key never reaches the SVG |
| `miniToggle` | The setting is in the menu and on by default; off brings back the release's portraits; on again |
| `miniAxe` | 0 axe violations (WCAG 2.1 AA) on the game screen with the side-panel portrait, the profile and a person's page |

The four core suites (boot, lives, saveRoundTrip, uiSmoke) pass on the same build, and `lint-events` and `lint-choices` report nothing (the feature has no events). The full world builds with this feature's patch.

Release, by comparison: full figure 12.0 KB on average, 46 px bust 3.2 KB (the 25-person gallery). Building a miniature takes 0.52 ms against the release's 0.08 ms. The people tab renders in 38 ms against 25 ms.

Screenshots (`/tmp/ardan/miniatures/`): `gallery-before.png` and `gallery-after.png` (25 people at 200, 92 and 46 px), `profile-panel-before.png` and `profile-panel-after.png` (the side panel in game), `profile-modal-before.png` and `profile-modal-after.png` (the profile), and `zoom1.png` and `zoom2.png` (eight figures at 360 px).

**Rules kept.**
- Pure: no `A.rand`, no state change. Every choice is an FNV hash of the id and a key, so a person keeps their pose, hat and sway for life and changes only as their age, rank, gear and wounds change.
- Every colour from the state is checked as a hex colour before use, so `ap.skin`, hair, realm and house colours can never inject markup. Gear and culture keys are only looked up, never printed. The one text, the `aria-label` (name and age, on portraits 60 px and up; smaller ones are `aria-hidden` next to the name they illustrate), goes through `UI.esc`.
- Ids only on fixed-content definitions: the hatch patterns are keyed by their own colour, and the clip, masks, grounds and filters have the same content in every SVG. Two portraits on a page can't disagree, and the same person draws the same string.
- No new state. The setting lives in `UI.set`.

**Limits.**
- **It's procedural, not painted.** The style is consistent and reads as a manuscript page, but the figures are still built from parametric shapes: arms are tubes, hands are mittens, and the drapery is a few tapered folds, not studied cloth. Faces are legible from about 150 px; in 30–46 px lists they are a few strokes. *An artist is still needed for the parts library the style guide asks for* (heads, hands, hair, garments and armour per culture, drawn by hand in this palette and line), and the code is laid out to take such parts: one function each for head, headwear, arms, garment and weapons.
- **Culture is a table of 24 rows written for this feature.** It picks from about 12 hats, 4 cuts and 5 collars. It isn't sourced from lore beyond the cultures' one-line notes, and no culture has its own face or textile pattern yet.
- **Poses are a closed set.** Five poses, plus the cradle; nobody rides, kneels, works or fights in a portrait. Mounts are ignored, as in the release.
- **Bigger and slower than the paper dolls.** A 46 px bust is twice the release's size (6.3 KB against 3.2 KB). Every figure carries a silhouette filter, and the full figure a displacement filter as well. Nothing measured is slow, but a page with hundreds of portraits would feel it.
- **The ground is gold or lapis, not the realm's colour.** The release tinted each sky with the realm's colour. Here the realm shows in the cloth and the arms, as the style guide's palette asks, so commoners of different realms look more alike than before.
- **Beasts** (`PORTRAIT.beast`) and **coats of arms** (`PORTRAIT.coat`) are still the release's.
