# Figures: every person drawn by the figure library

**Aspect:** character art (work item C8b; owner orders 24 to 27, 30, 33, 52; D-024, D-029, D-035, D-036, D-050) · **Kind:** readable core code, no events, no patches. The library itself is a v2 engine module.

The owner approved gate 2 of the 2D character art ("this looks amazing, especially the blonde knight in the middle"; Ser Edric Vale is the bar) and asked for it to go into the game and keep being refined. This feature is the game's side of that: every place that shows a person now shows a figure from the library, every person has a face of their own, and the creation screen has a face and build maker.

## Where things are

| Path | What |
|---|---|
| `src/ui/engine/figure/` | **The library** (on the page as `A.V2.figure`): `g.js` geometry and seeded streams, `scene.js` layers and SVG output, `palette.js`, `rig.js` (body), `head.js` (face), `hair.js`, `gear.js` (dress, armour, and where each arm is carried), `make.js` (make and rarity and their paint), `arms.js` (every weapon and shield as a made thing, order 52), `figure.js` (`compose(look, opts)`), `look.js` (a person's sheet to a look, the face codes), `wardrobe.js` (dress by estate; gear by item) |
| `src/ui/engine/figure/cultures.js` | **The peoples' dress** (C8c): one row per culture: its cut (tunic, robe, kaftan, drape), headwear for men and women, its dyes, its habits (a sash, beads, a torc, fur, a hem border) and whose smiths arm it |
| `figures.a-peoples.core.js` | The game's way to that table (`UI.FIG.cultOf`) |
| `figures.b-draw.core.js` | `UI.FIG.sheet(p)`, `UI.FIG.look(p)`, `UI.FIG.svg(p, size, opts)`, `UI.FIG.inline(...)`, the picture queue |
| `figures.c-looks.core.js` | `A.LOOKS`: a face code for everyone born, and for everyone in an older save |
| `figures.d-maker.core.js` | The face and build maker on the creation screen (`UI.FIG.maker`) |
| `figures.e-dress.core.js` | **Changeable outfits** (C8c): `A.setDress(w, d)` and the Dress control in the Gear panel of the Profile (`UI.FIG.dressBar`) |
| `tests/v2/figure.test.js` | The library's unit tests (node) · `test.mjs` here: the browser tests (`fg*`) |

Release source edited in place (D-028), each marked `[C8b]`: `PORTRAIT.svg` (20-portraits.js) hands every portrait to `UI.FIG.svg`; `A.genAppearance` (03-engine-base.js) gives everyone a face code; `UI.crStepBody` (23-ui-a.js) hands the step to the maker. A build without this feature draws the release's paper doll and its old rows.

## A person to a picture

1. **The sheet** (`UI.FIG.sheet(p)`, read only): sex, people, age in human years, the stored appearance, estate, rank, what is carried (by item), wounds, the realm's and the house's colours and device, the culture's headwear and dye, and the face at rest (mood, read from happiness, opinion of you, health, traits and the scene of an event).
2. **The look** (`A.V2.figure.lookOf(sheet)`, pure): the face (39 features from the code, eleven more and the build's seven from the second code or from the id), hair and beard as drawn, grey from the years, the body, scars from wounds, dress and gear, stance, the head's turn. Everything that looks random is a stream seeded by the person's id and a channel name. Never `A.rand`, `Math.random` or the clock.
3. **The picture** (`A.V2.figure.compose(look, { crop, width, tier, ... })`): one SVG. The same look and options give the same string, byte for byte.

**Sizes.** `PORTRAIT.svg(p, size, opts)` keeps its meaning: under 120 px or `opts.bust` a square (to 40 px the head and collar; to 119 px head and shoulders; larger, the bust); from 120 px a picture two by three, cut like a profile card (down to the hands and the belt). `opts.figure` gives the whole standing figure (one by two), for the Profile tab to come. The light and depth passes run on large pictures only; a 46 px portrait also leaves out what is too small to see and is written in whole millimetres.

**The page never holds a figure.** A figure is hundreds of shapes; sixty of them as inline SVG cost a third of a second at every redraw (measured). `PORTRAIT.svg` returns a small frame (one `<svg>` with one `<image>`, about 500 bytes), and the picture behind it is made once, off the press: look, compose, the SVG drawn on a canvas at the screen's density, one PNG kept. A queue makes one picture per turn of the event loop, newest request first. Until its picture is ready a frame shows a stand-in in the sitter's own colours (or the picture that person had a moment ago), and takes the finished picture the moment it is done. `UI.FIG.idle()` resolves when the queue is empty (tests and screenshots wait on it); `UI.FIG.inline(p, size, opts)` gives the whole SVG at once (the share card, sheets, tests). Pictures are kept by look (600 of them, the oldest freed first), so a redrawn list is a lookup and two redraws never draw twice.

**The dead** are drawn with their eyes shut and their colour drained, on a grey ground.

## Dress, class and regalia (C8c, D-060)

The wardrobe (`wardrobe.js`, `kit(sheet)`) dresses a person from seven things the sheet now carries: the **estate**, the
**people** (`cult`, a row of `cultures.js`), the **occasion** (`wear`), the **place** (`where`), their **trade** (`job`),
their **post** (`role`, `mil`) and whose **livery** they wear. The sheets are in `docs/design/demo-2d/c8c/`
(`node docs/design/demo-2d/c8c/sheet.mjs` draws them from the library).

- **Station shows.** Eight stations, each with its own marks in every cut: the serf's undyed, patched, ragged-hemmed
  cloth and rope belt; the countryman's dyed wool, leather belt and apron, shawl or neckcloth; the craftsman's apron and
  the tool of the trade, sleeves rolled; the merchant's long gown, fur, purse and keys; the clergy's habit, cord and sun
  (a stole from the second rank, white and a skullcap for the high); the soldier's padded coat, mail and helm under the
  realm's coat; the high-born in gold trim, a jewel by rank (a brooch, a chain, a chain with a stone from the fifth rung)
  and a cloak, or a harness under their own arms; the crown.
- **Four cuts** (`cult.cut`): the northern **tunic** and kirtle; the long **robe** girt with a sash (the desert, the
  elves), striped and open over a pale robe for a merchant, a worked yoke for the gentry; the steppe's **kaftan**
  crossing over the breast, over loose breeches and boots, fur at the hem as the purse allows; the south's **drape**, a
  length of dyed cloth from one shoulder to the far hip over a pale shift, with beads. Ten new things for the head:
  turban, head wrap, kerchief, fur-brimmed cap, felt cone, round cap, fillet (with leaves or feathers), mail coif,
  arming cap. A dye costs what it costs (`COST`): nobody wears above their purse.
- **A soldier's bust shows that he is one** (V7). Rank and file: a quilted coat (`padding`, `quilt: 2`), a mail collar
  from file-leader, mail for the heavy troops, the helm their company is issued (an arming cap or a mail coif for the
  rest); a captain puts the helm off and wears the sash of command; a commander a cloak. The player's face is never
  under a helm, and the collar and coat still mark him. Every soldier of a realm wears the same coat (`liveryOf(realm)`:
  plain, parted or with a pale, from the realm's colour).
- **Only liveried retainers share a garment** (V9). A lord's guard knight and maid (C6's household) wear his house's
  colours and device (`sheet.livery`, from `PORTRAIT.arms` of the player); soldiers wear their realm's. Everyone else's
  cloth is their own: two dyes of their station and people a little off the vat's (`shade`), a variant of the cut, a fit
  of their own. A noble house is no longer all in the house's colour: that is in the lining, the cloak or the trim.
- **Hoods** (V13). A raised hood is for the road and the weather: only out of doors (`where: 'out'`, an event tagged
  for the road, the wild, the sea or the fields), never in a list and never under a roof. The hood thrown back on the
  shoulders is on about one countryman in ten.
- **Occasions** (`WEARS`: day, best, work, travel, arms, mourning). On an event's card everyone is dressed for the
  scene (`26-scene-tags`). A harness is put off for a feast, for mourning and for work that is not war; out of harness
  only a sword or dagger stays, and only at the belt of those who may wear one.
- **Changeable outfits.** The Gear panel of the Profile has a line, "Dress", that opens the choices: "As the day asks" (the
  default: everyday dress, and what each scene calls for), the six occasions ("Under arms" only with armour to wear) and
  the dyes of the player's station. `A.setDress(w, d)` stores `dress: { w, d }` on the player (journalled, so a replay
  dresses the same); absent in an older save, which loads and dresses as the day asks. It changes the picture only.

## Faces (`A.LOOKS`)

- A face is the game's 23-character code (`src/people/engine/face.js`), kept in `p.app.g`. Everyone born or made gets one in `A.genAppearance`: from the parents' codes by group (inheritance, so children take after their parents), or round their people's mean. Elves, dwarves, orcs and giants lean their own way (`PEOPLES` in `look.js`: ears, jaws, tusks, frame).
- A face has its own stream, seeded by the person's id: the world's dice do not move, so a seed plays the same world as before.
- **Old saves.** On load, everyone without a code gets one (`A.LOOKS.migrateAll`), in birth order, leaning by the appearance the save does hold: the old creation screen's face shape, brow, mouth, nose and eye choices, and the build. The same save gives the same faces every time. No save version changes; a journal still replays.
- A second code of 11 characters, `p.app.g2`, holds the eleven features the drawn head added and the seven measures of the build (D-036). Only a face made by hand stores it; everyone else's comes from their id. `app.hs` and `app.bd` hold a hand-picked hair style and beard as drawn.

## The maker

On "Body & face": six pages (face, eyes and brows, nose and mouth, hair, skin, body), 52 sliders with words at their ends and no percentages, 49 named shapes to start from, 29 hair styles as thumbnails of your own face, 11 beards, ten named frames, "Surprise me", the face you will grow into at four ages, and the face code to copy or paste (checked character by character). The picture beside the controls is redrawn at every step of a drag. It writes only the creation state; the new life starts with what was made.

## Gear, by item

`wardrobe.js` holds one row per item id of the game (`GEAR_ART`): the drawn piece and its two measures, **make** (0 crude to 3 masterwork) and **rarity** (0 common to 3 legendary). The sheet passes each carried thing as `{ id, kind, make, rarity }`; a stored item that carries its own make and rarity is drawn with them. A new item (E2) is one call: `A.V2.figure.registerGear('id', { art: 'sword', q: 2, r: 1 })`. An armour is drawn piece by piece (a full harness is 14 plates, each its own item and layer). Legendaries' own designs come with E2.

### Arms (owner order 52, D-050)

Every weapon and shield is drawn by `arms.js` as a made thing, from four things:

- **its form** (a row's `form`): nine swords (arming, long, great, short, estoc, falchion, sabre, leaf, cleaver), five daggers and knives (dagger, parry, rondel, knife, seax), twenty-one hafted arms (axe, hand, great, cleaver, mace, star, flail, hammer, pick, maul, club, spear, boar, pike, lance, glaive, halberd, bill, poleaxe, partisan, staff), three bows (self, long, recurve) with a quiver, a crossbow with its bolt case, six shields (heater, kite, round, targe, buckler, pavise);
- **its make:** crude keeps the fire's scale, a nicked edge, a cord grip, a rawhide scabbard, a haft with its bend and knots, lashing where a socket should be; plain has a honed bevel, a leather grip over cord, iron fittings, a shod butt; fine has bronze, a wire grip, the maker's mark, a locket and chape, langets, a wrist loop, horn nocks; masterwork has gilt, chasing, a line of letters after the mark, a stone, a rain-guard, a tassel, a pierced or four-pointed head;
- **its rarity,** in the work and not only the tint: rare is pattern-welded and blued, epic is black steel cut with marks on twin fullers, a legendary with no drawing of its own is sun-steel let in with gold. Nothing glows (D-045);
- **whose smiths made it** (`st`, from the person's people or their culture's `arms`): north, solen, desert, dwarf, elf, orc. It sets the guard, the pommel and the grip, and the blade a people makes when the item names none (a sabre in the desert, a leaf blade among elves, a broad short blade under the mountain, a cleaver on the eastern grass).

Sizes are true (millimetres on a person's own height). A sword hangs at the hip in its scabbard; a dagger at the belt; an axe, mace or hammer hangs head up from the belt; a pole arm stands in the hand (the staff stance); a bow is slung on the back with its string across the chest and a quiver over the shoulder; a crossbow is slung with a bolt case at the belt; a heater, kite or pavise stands by the leg, a round shield or targe is held at the side, a buckler hangs at the belt. The sheet now carries the **ranged** slot too.

`swordArt(S, G, a, L, q, o)`, `daggerArt`, `haftArt`, `bowArt`, `quiverArt`, `crossbowArt` and `shieldArt(S, T, h, q, o)` are exported from `A.V2.figure` for anything else that wants to draw an arm (the legendaries' page does: `docs/design/legendaries/`). A detail is drawn only where the picture can show it (`see()`), and an arm that lies outside the picture costs nothing (`gone()`): a list portrait's sword is under a dozen shapes, the same sword drawn large more than twenty. Every form at three makes, before and after: `docs/design/legendaries/ordinary.png` (`node docs/design/legendaries/ordinary.mjs`).

The rule-drawn arms this replaced (one sword, one spearhead on a staff, one belt axe and hammer, one heater; no bow) are kept in `archive/figure-rule-drawn-arms/` (the library's `gear.js` as it stood at commit `bcfd0d5`, with a note); the gate 2 demo has its own copy (`docs/design/demo-2d/gate2/gear.js`).

## Budgets (measured by `fgBudget`; see the test's detail line)

Compose a list portrait: under 6 ms. Paint a list portrait: within 16 ms. A large portrait with its light and depth passes is measured and made once, off the press.

Measured 2026-11-13 on the shared four-core container under load (CPU ms a portrait, 40 people of a fresh world): compose 2.7 at 30 px, 3.1 at 46 px, 3.0 at 88 px, 3.7 for the 176 px two by three; paint at twice the density 4.9 at 46 px and 7.4 at 88 px; the 176 px picture with its light and depth passes about 41 ms, made once. SVG 81 KB at 46 px, 141 KB at 176 px; the page's frame at most 479 bytes; a redrawn portrait is a lookup of about 4 microseconds. The press gate (`tools/bench/press-gate.mjs`) reads the same with and without this feature on the same machine (the redraw counts are identical; both builds are over the gate's CPU budgets under that load).

Measured again 2026-11-14 with the arms of order 52, three times, on the same container under heavier load (other sessions' browsers): compose 2.3 to 2.5 at 30 px, 2.6 to 2.8 at 46 px, 2.7 to 3.9 at 88 px, 3.0 to 3.4 for the 176 px two by three; paint 4.4 to 4.8 at 46 px and 5.5 to 7.7 at 88 px; the 176 px picture 35 to 36 ms; SVG 81 KB at 46 px and 141 KB at 176 px, as before. Nine armed people composed in node by the library before and after, turn and turn about, the middle of nine batches: 3.7 against 3.9 ms at 46 px, 3.7 against 3.7 at 88 px, 4.4 against 5.1 at 176 px, 4.8 against 4.7 for the standing figure, each inside the other's spread; 2 to 4 shapes in a hundred more and 1 to 5 KB in a hundred more SVG (`docs/design/legendaries/ordinary-timing.json`). One arm alone at full detail is 11 to 33 shapes and about a fifth of a millisecond.

## Not done here

A fighter in a duel no longer stands on guard (the retired renderer's `guard` pose; the library has ten stances, none with a raised blade). War paint and the jewellery a person stores (`app.paint`, `app.jewel`) are not drawn yet (C8c draws a jewel by rank). Mounts have no art. Thrown arms (javelins, throwing axes, slings) are carried and not drawn. A shield is not shown in a stance with no hanging arm, and a pole arm's head is small on a standing figure and out of the frame of a list portrait. Wear (nicks, rust) is drawn only as a crude make's, not yet as a state of the piece. Infants are small children, not yet their own drawing. The Profile tab (work item P) will show the standing figure.

## Tests and pictures

`test.mjs` (C8c): `fgDressStations` (8 stations x the four cuts x 6 people: a reader that knows only the garments names 98 in 100; floor 85), `fgSoldierBust` (420 soldiers of ten ranks and every troop: every bust is marked, one coat a realm, the player bare-headed and still marked), `fgLivery` (three worlds of 400 adults: no two outside a livery dressed alike, no house all in one colour, the guard knight and the maid in the house's coat), `fgHoods` (none raised in a list or indoors; some on the road), `fgOutfits` (the Dress control, the six occasions, the dye, refusal of bad values, the journal, an older save). And: `fgDeterministic`, `fgPure`, `fgEveryPeople`, `fgEscaped`, `fgBudget`, `fgOldSave`, `fgMaker`, `fgGearByItem` (every item id has a row; a bow, a crossbow, an axe, a pole arm and a round shield are drawn by form; 736 drawings of every form at four makes, two rarities and two styles are sound, the same twice, and no two makes alike), and two carried over from the retired renderer's tests, `fgAxe` (no accessibility fault on the life screen, the profile, a person's page and the maker, every frame a named image) and `fgCreateSkin` (the skin picked in the maker is the skin stored and drawn). `tests/v2/figure.test.js`: thirteen unit tests of the library (one look one drawing, a sweep of some 400 people at four sizes, the second code, the old-save lean, gear by item, escaping, the dead; and for arms: every form at every make, rarity and style draws soundly and the same twice and a better make shows more; no glow on a legendary, nothing drawn outside the picture, detail left out of a small one; arms on the person by item, form and people).

Before and after, at 1366 and 420 wide (creation, the life screen, the profile, a person's page), and a cast of the game's own people at twice the pixels: `docs/design/demo-2d/c8b/`.
