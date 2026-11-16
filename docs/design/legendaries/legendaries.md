# Ten legendary arms: one from each of ten realms and peoples

*Stamped 2026-11-13 21:05 ET · for the owner's eye before anything is built (order 36: "Show me ten legendary weapon designs from different weapon categories") · by Fable 5.2 at maximum effort · follows D-032 item 8, D-039 item 9, D-043 item 7, D-045, `docs/design/growth.md` §4 and the owner's three reference pictures (`docs/design/reference/`).*

*Revised 2026-11-14 11:10 ET for owner order 52 (D-050) · by Fable 5.2 at maximum effort · every piece and art renamed and each art's forms named; each history rewritten to carry its name; the bow redrawn from nothing; the ordinary arm under each piece is now the game's own drawing; a sheet of the game's ordinary arms added (`ordinary.png`). The first version stands whole at commit `bcfd0d5`.*

Open `docs/design/legendaries/legendaries.html` in a browser. It is one file, works from `file://`, makes no network request and carries only the repo's own fonts. Nothing on it is a picture file: every piece is a record of parts, and every person is the game's own figure library, drawn when the page opens.

## What order 52 changed

The owner: "Rename all the legendary items and their moves, and whilst you're at it do the same for other arts and weapons. They shouldn't have some horrible naming. Winter Wheat could be called Winter Storm and its art be Snowfall. Redesign the non-legendary class weapons to be more intricate and designed, and significantly improve and redesign the bow legendary."

| Was | Is | Its art was | Its art is | Its forms, in order |
|---|---|---|---|---|
| Winter Wheat | **Winter Storm** | Under the Snow | **Snowfall** | *Grey Sky*, *First Snow*, *Drift*, *White Hush* |
| The Last Page | **White Noon** | The Sun Does Not Turn Back | **Sunwise** | *Daybreak*, *Noon*, *Westering*, *The Return* |
| Last Well | **Dry Rain** | False Water | **Mirage** | *Shimmer*, *False Water*, *The Lake Walks*, *True Water* |
| Held Breath | **Undertow** | The Long Breath | **Slack Water** | *Under the Chain*, *Count to Ten*, *First Breath* |
| Thaw | **Killing Frost** | Ice Underfoot | **Black Ice** | *Thin Ice*, *Glaze*, *Open Water* |
| The Latch | **Deep Fire** | Not Past Me | **Stone Oath** | *Hold Fast*, *What Is Carved*, *Not Past Me* |
| Grandfather | **Long Shadow** | Before the Point Arrives | **Slow Drum** | *Are You There*, *No Faster*, *I Am Here* |
| Midsummer | **Summer Thunder** | The Year's Rhino | **Cloudburst** | *Still Air*, *Thunderhead*, *The Price* |
| The Unbending | **Sickle Moon** | The Sun's Shadow | **Owl-Light** | *No Leaf Moves*, *Soft Wing*, *Elsewhere*, *The Sun's Shadow* |
| Paymaster | **Lodestar** | The Gorge Shot | **Falling Star** | *The Climb*, *Fixed Mark*, *Star Down* |

**How they are named.** The owner's two names set the rule, and the other nine pieces follow it:

- **A piece is named for the sky, the season, the sea or the hour of its own country:** the weather its people fear or wait for. A winter storm on Aldmark's plains; noon over Solenne's square; the rain that dries before it reaches the Red Waste; the pull under Greyhaven's quiet harbor; the frost that kills cattle in Northreach; the first fire under the mountain; the late sun at the Gold Masks' backs; a midsummer sky that thunders and gives nothing; the moon an elf's bow was cut under; the one star the Highlanders steer and reckon by.
- **Its art is named for what that weather does to a man.** Snow buries him; the sun goes on round and does not turn back; a mirage shows him what is not there; slack water holds him till he drowns; black ice takes his feet; stone stands; a slow drum walks up to him; a cloudburst lets go all at once; in owl-light he never sees the archer; a falling star comes down from above.
- **Its forms are numbered and named, in the order they are fought, and tell the art's one story;** the last is its signature. Where the people have a saying or an oath in the lore, the last form is that saying: *Not Past Me* is the Last Door's oath, *I Am Here* the answer in the ancestors' rite ("Are you there? I am here."), *The Sun's Shadow* Queen Maerith's words. Two of the old art names live on this way.
- **One to three plain words,** nothing coined, no weapon and no owner in the name, nothing mundane or comic (a latch, a paymaster and a grandfather are gone).
- **What each was checked against:** the lore's 265 arts and 1,284 forms and the houses' 613 mottoes (a script, `src/names.mjs`: no new name repeats one, and none is "something Wind", the Khanate's tribes); each other (no word is used by two of the ten pieces and arts); and the well-known blades and sword forms of books, games and films, as far as the writer knows them. That last check dropped the sabre's first new name, **Red Rain**, which is a named sword in a well-known series of novels. It could not be run against the web: a design in progress is not sent to an outside search.

The full guide (by grade, by weapon family, by people, with the twenty example arts old against new) is `docs/design/growth.md` §12. How ordinary weapons are called (most have no name) is `docs/design/economy-and-items.md` Part 6.

**The bow** is a new drawing, not the old one improved: see IX below and its plate. The first bow is kept at `src/sketches/the-unbending.mjs`.

**The ordinary arms** are the other half of the order and are built in the game (`src/ui/engine/figure/arms.js`), not on this page: `ordinary.png` here shows every class at three makes, before and after, and the strip under each legendary now shows that same game drawing.

## What was asked, and what is shown

| Asked | Shown |
|---|---|
| Ten legendary weapons from different categories, each with a design of its own, far finer than ordinary arms | Longsword, greatsword, sabre, dagger, war axe, war hammer, spear, glaive, war bow, crossbow. Each is drawn large on a dark ground with two closer looks, and under it the ordinary Plain-make arm of its kind to the same scale, as the game itself draws it |
| "How's this for an example of a legendary blade" (reference 3) and "make this blade the signature of Aldmark" | **Winter Storm**, the first plate, is drawn after the example: a black patterned heart between bright bevels, veins of gold down it, a clawed guard of dark steel and gold round a cut stone, a black bound grip, a cut pommel. With its new name the black heart is the storm sky and the gold in it the lightning. Its names and history are Aldmark's own |
| "Don't make them all look the same… different places with different styles" | Ten realms and peoples, ten crafts: imperial black and gold, a temple's white steel and gilded writing, desert watered steel, sea bronze and pearl, northern knotwork in dark iron, dwarf geometry with a stone, red gold and ebony from the plains, orc forge-iron with horn and teeth, elf yew, horn and silver, highland walnut and stag-horn. No two share a metal, a motif or an outline |
| "Who owns them, who uses them and why?" | On every plate: who owns it, who bears it, and why. Among the ten: one borne by office, one in a temple's keeping, one in a hand with no right to it, one passed to the direct heir, one lost, one an order's, one in pawn to a banking house, one held by the kill, one that hangs unused because to hand it on would name an heir, one a commonwealth's |
| "It should be a part of the portrait" | Under every plate the person who has the piece, drawn by the game's figure library (the gate 2 look) with the piece on the figure, as a profile card and closer; and at the end the same ten at the size of a list |
| No magic glow | None. A legend shows by its metal, its making and what has happened to it. The only light is a glint where polish is highest |
| Names that are not "horrible" (order 52) | The table above; every plate carries its art and its forms by number and name |
| "Significantly improve and redesign the bow legendary" (order 52) | **Sickle Moon**: a new record of 216 lines, 346 shapes on its plate against the first bow's 91, with its own arrow and quiver |

No outside image AI was used. The owner's reference 3 set the look of the first piece; nothing in it is copied, and its names are not used.

## The ten at a glance

| | Name | Kind | Realm · people | The craft | Owner → bearer | Its art |
|---|---|---|---|---|---|---|
| I | **Winter Storm** | Longsword | Empire of Aldmark | Black dwarf-steel heart, bright bevels, gold lightning down it, clawed guard, grey sapphire | The crown → the Marshal, by office | Snowfall |
| II | **White Noon** | Greatsword | Holy See of Solenne | White steel, a page of fire-gilding written with names, the twelve-rayed sun | The Temple → the Grand Master of the Knights of the Sun | Sunwise |
| III | **Dry Rain** | Sabre | Confederacy of the Sand Clans | Watered crucible steel with a ladder of 23 rungs, gold overlay, old ivory | Clan Sayf → an outlaw with no right to it | Mirage |
| IV | **Undertow** | Dagger | Kingdom of Greyhaven | Salt-worn bronze, a silver wave, ray-skin with teeth marks, a grey pearl | House Tidewell → the direct heir | Slack Water |
| V | **Killing Frost** | War axe | Kingdom of Northreach | Dark iron with a welded edge, silver and copper knotwork, runes, walrus ivory | Northreach's crown → no one: lost since 1090 | Black Ice |
| VI | **Deep Fire** | War hammer | Kingdom of Irondeep (dwarves) | Square hold-steel, bronze key-patterns, a garnet foiled like a live coal, a ring for every Keeper | The Last Door → its Keeper, for life | Stone Oath |
| VII | **Long Shadow** | Spear | Empire of Zanara | Dark iron ground bright, a socket of red gold beaten into an ancestor's face, ebony | The throne → nobody: in pawn to House Sorondo | Slow Drum |
| VIII | **Summer Thunder** | Glaive | League of the Tusk Clans (orcs) | Black forge-iron, a red-painted rhino horn, teeth, turquoise, hide, horsehair | The War-Mother's hearth → the War-Mother, by the kill | Cloudburst |
| IX | **Sickle Moon** | War bow | Kingdom of Sylvaran (elves) | Ridge yew with its sapwood, a riser of black heart-oak, silver moons, white horn ears, a moonstone | The Oakborn line → no one: it hangs unstrung | Owl-Light |
| X | **Lodestar** | Crossbow | Highland League | Walnut, stag-horn scored with a tally, an Irondeep steel bow, blue and white cord | The League's Silver Chest → the Captain-General | Falling Star |

Every art is a **Legendary art** (D-043 item 4), bound to its piece.

## Each, in words

Dates are the lore's (the year is 1105). Where a line is new, it is built on what the lore already holds, and the source is named. Who owns each piece, who bears it and why are as they were; what is new is the name, the line of history that explains it, and the art with its forms.

**I · Winter Storm** · longsword, 1,155 mm · Empire of Aldmark.
*Made:* at Irondeep by Clan Brightanvil in 951, the dwarves' seal on the Iron Road Contract (the lore: King Arnulf sealed it with Harald Ironside by torchlight). 154 years old. *Its name:* iron for wheat. The dwarves made the seal a sword and put in it the weather a plainsman fears most: a black sky down the heart of the blade, and the lightning in it in gold. In Kingsmere they do not say a Marshal has been named; they say the storm is down from the wall. Carried in both Horde Wars. *Owner:* the imperial crown, as a treasure of the realm. *Bearer:* the Marshal of Aldmark while the seat is filled (in 1105 Leofric Stane); otherwise it hangs over the iron ring in the Oath Hall. This fits D-017 (the Marshal's seat stays empty until needed) and the lore's Marshal alike. *Why:* the Oath Moot takes it down and hangs it up, so an emperor who wants a great war must ask for the sword. *In the hand:* broad and point-heavy; learned, it shears a common blade at the bind and goes through mail; a quick man who is gone when it falls has nothing to fear. *Art:* **Snowfall**: light strokes laid one on another, none of them hard, until the other man's guard gives under the weight, as a roof does under snow. The First Form, *Grey Sky* (the waiting guard, point low: nothing is given away); the Second, *First Snow* (light cuts that only touch his blade, to learn its weight); the Third, *Drift* (the bind: every parry is left lying on his blade, heavier each time); the Fourth, *White Hush* (the one full stroke, through the guard that has given). *In the portrait:* planted before the Marshal, both hands on the pommel.

**II · White Noon** · greatsword, 1,670 mm · Holy See of Solenne.
*Made:* at Solenne in 760 from the swords the last imperial guards laid down when they chose vows over the axe (the founding of the Knights of the Sun); gilded by the women of House Corvane, who judge the Temple's gold leaf. 345 years old. *Its name:* the knights' names are in the Book of Noon; the Grand Masters' are on the blade (twenty-three written, room for eleven more). It leaves the altar once a year, at the stroke of noon on Return Day, and while it crosses the square nobody can look straight at it. The Solen say: do not lie at noon (the lore's sun law). *Owner:* the Temple. *Bearer:* the Grand Master (Bruno Castell), on Return Day and in the field. *Why:* a Knight of the Sun gives up house and arms, so the order has no heirlooms; and every Valdane king is crowned kneeling under it, which is the Temple's hold on Varenna. *In the hand:* a bearing sword as long as a man; few can fight with it; one who can clears a ring two paces wide; get inside the ring and it cannot reach you. *Art:* **Sunwise**: every stroke goes on into the next, always the same way round, as the sun goes; there is no guard in it, and no step back. *Daybreak* (the rising cut from the low guard that sets the wheel turning), *Noon* (the stroke straight down from the top of the wheel), *Westering* (the long falling cut that clears the ring), *The Return* (when the wheel looks spent, it comes round again). *In the portrait:* carried upright at the shoulder in both fists.

**III · Dry Rain** · sabre, 950 mm · Confederacy of the Sand Clans.
*Made:* the blade at Chanari about 960 by one of the first twelve smiths of the Compact; hilted at Mirah. About 145 years old. *Its name:* on the Red Waste a rider can watch rain fall a day off, in grey veils that dry up before they touch the sand. The clans call it dry rain, and the Giver's jest: water a man can see and never drink. The sword is named for it, and for the watering in its steel, which looks wet and is not. 23 rungs in the steel for the 23 clans, the last filled with gold for Mirah, the last well on the Salt Road; Muhsin Sayf carried it through the siege of 1060. *Owner:* Clan Sayf (it is the curved sword on the clan's arms). *Bearer:* Zayd Blackveil, outlaw, with no right to it. *Why:* it went into the desert with him in 1098; Harith Sayf calls it stolen and sends no one after it, because a chief who can call the hand a thief's can call the war on Zanara's road camps not his. *In the hand:* light, cuts where a straight sword must be drawn back; little point and a small guard. *Art:* **Mirage**: the cut is never where the eye puts it, as water in the waste is never where it shines. *Shimmer* (the blade kept moving in the light, so that its length cannot be judged), *False Water* (the cut that is shown and not delivered), *The Lake Walks* (ground given, so that he always arrives where the blade was), *True Water* (the one cut that is where it looks; by then he does not believe it). *In the portrait:* drawn, laid across the body to the far shoulder.

**IV · Undertow** · dagger, 390 mm · Kingdom of Greyhaven.
*Made:* cast in fleet bronze before 719, a chain-diver's work knife; hilted in silver and pearl for King Cedric in 761. Close on 400 years old. *Its name:* Wenna Tidewell freed the harbor chain in 719 with it in her teeth, and her teeth are in the grip; Osric the Diver had it at Yarbek in 882. The divers named it for the pull under a quiet sea, which takes a swimmer down without a sound. *Owner:* House Tidewell, as an heirloom of the blood, never a crown jewel. *Bearer:* the heir (Prince Tristan). *Why:* by the Ring Law of 916 the heir who dives for the ring comes up owning the knife. Tristan's dive was helped (the lore's secret), so the knife is the proof of a right he may not have. *In the hand:* short, broad, will not rust, bend or snap; in a clinch or under water nothing is better; against a sword in the open its legend does not lengthen it. *Art:* **Slack Water**: close, hold, and wait as still as the turn of the tide; the other man tires first, or drowns. *Under the Chain* (the dive inside his guard, low, as a diver goes under a harbor chain), *Count to Ten* (the hold: his sword arm kept and nothing given, for as long as a breath lasts), *First Breath* (the knife, once; only one of them comes up to draw it). *In the portrait:* in his right hand; his left has gone to the silver ring at his throat, as the lore says it does.

**V · Killing Frost** · war axe, 1,460 mm · Kingdom of Northreach.
*Made:* at Kingsmere about 810 for the exile Eirik Winterborn, by a smith of the Fairrush court. The haft was its fourth. 295 years old. *Its name:* Eirik the Ice-Walker broke the sea gate of Wolfhaven with it in January 812, after crossing the frozen bay. The frost that made his road had killed cattle in the byre all that winter; then it took a city, and the axe has its name. Nine kings were raised on the shields with it; the tenth was raised without it. *Owner:* Northreach's crown claims it. *Bearer:* no one: it is **lost**. King Bjorn III had it beside his chair at Kingsmere the night he was poisoned in 1090. *Why:* Aldmark says it was never in the hall. King Eirik III's ten years of silence over his father's murder (the lore's secret letter of 1093) have run out, and whoever shows the axe names the murderer's house. *In the hand:* long, thin-bladed, quick; splits a shield, hooks an ankle; inside its swing it is a staff. *Art:* **Black Ice**: short sliding steps, the axe swung from the hips; it is the other man who loses his feet. *Thin Ice* (a guard that looks open: he steps onto ground he should not), *Glaze* (the sliding step and the hooking beard: a rim, a wrist or an ankle goes), *Open Water* (the stroke that falls while he does). *In the portrait:* drawn as last carried, by Bjorn III.

**VI · Deep Fire** · war hammer, 1,000 mm · Kingdom of Irondeep.
*Made:* the head by Sigmund Brightanvil in 612, the year the first forge was lit; the haft remade six times. 493 years old. *Its name:* three doors: iron, stone and steel, and dwarves; this stands in the last. Its head came out of the first fire the hold ever lit, and the Deep Law says the world was forged on such a fire: so the name, and the garnet in its face, foiled to look like a coal that has never gone out. A ring on the haft for every Keeper, filled with red on the day they die (as the names on the wall of the Last Hall are painted red): eighteen red, one bare. *Owner:* the Last Door, not the queen and no clan. *Bearer:* the Keeper, for life; the head passes from the dead to the newly sworn. *Why:* the oath of 612, "Not past me"; and whichever of Queen Brynja and Prince Korrin the Keeper stands behind has the hold. *In the hand:* all weight in the head; folds plate; slow to lift; a long spear keeps it out all day. *Art:* **Stone Oath**: three blows on one line and never a step back, the oath of 612 made into a way of standing. It was made for a gallery two paces wide. *Hold Fast* (the stance in the Narrow and the first blow: the greeting at every dwarf gate), *What Is Carved* (the second blow, on the same line: what is carved is kept), *Not Past Me* (the third blow, always the same: the oath itself). *In the portrait:* at the port across the Keeper's body.

**VII · Long Shadow** · spear, 2,076 mm · Empire of Zanara.
*Made:* at Zanara in 930 for Mosi the Runner's three hundred; blade by the smiths of Kabale, gold from the Ancestor Hill. 175 years old. *Its name:* the Gold Masks attack late in the day with the sun behind them, so that their shadows reach a line before their points do. The longest is this one's, and the small gold face on its socket is the first ancestor of the Kanemba line: the Masks say he arrives first. It is the only face among them that is still solid gold (the lore: the masks were melted in 1062 and are bronze under gold leaf). *Owner:* the throne. *Bearer:* nobody: it is **in pawn** to House Sorondo, in their strongroom; the First Face parades a copy. *Why:* the Salt War was paid for in secret with the Masks' gold; if the bankers show the spear the empire learns it, so the crown keeps paying. *In the hand:* a stabbing spear with a forearm of blade and a heavy foot; beat the point aside and it is a stick. *Art:* **Slow Drum**: the walk forward to a slow drum that breaks a line's nerve before it breaks its spears. *Are You There* (the lowered point and the first step: the words said to the ancestors when the milk is poured, asked of a whole line), *No Faster* (the pace that does not change, whatever is thrown at it), *I Am Here* (the thrust on arrival: the answer the rite gives). *In the portrait:* in two iron brackets on the strongroom wall, Kwame Sorondo beside it.

**VIII · Summer Thunder** · glaive, 2,080 mm · League of the Tusk Clans.
*Made:* at Grakmar in 1062 from the spearheads of thirty-one clans; the horn is that year's rhino's. 43 years old, the youngest of the ten. *Its name:* Grakka Ironhide killed the year's rhino alone on midsummer's day 1062, under a sky that thundered all day and gave no rain, and thirty-one clans swore to her over the carcass. She died of the sun at the Great Ride of 1080 with it in her hand. The clans do not call that ill luck; they call it the price. *Owner:* the War-Mother's hearth, which by eastern custom goes to the youngest daughter. *Bearer:* Urza Ironhide. *Why:* the clans swear over the rhino a War-Mother has killed. Urza fainted in 1104 and her heir froze at her trial (the lore's secrets); if that is learned, the glaive goes to whoever takes the next rhino. *In the hand:* made to stop a ton of rhino; what it hits is opened or broken; slow coming back. *Art:* **Cloudburst**: one set stroke, taken standing, against anything that charges: everything the sky was holding, at once. *Still Air* (the stand: butt set, blade low, and nothing moves), *Thunderhead* (the shout and the stamp that bring the charge on, as the cloud stands up before it breaks), *The Price* (the stroke, with everything in it; there is no second). *In the portrait:* held upright at her side.

**IX · Sickle Moon** · war bow, 1,740 mm · Kingdom of Sylvaran.
*Made:* cut on the Yew Ridges under the sickle moon of Leaf Fall, about 250 BR, with the tree's pardon asked; worked at Evenglade for Maerith, then a queen's daughter of fourteen. Some 1,350 years old. *Its name:* in 291 Queen Maerith loosed the first arrow of the War of the Forest Edge with it ("let them bring their sun; we will be its shadow"). They called her the Unbending. The bow kept the name of the moon it was cut under: light enough to shoot by, too little to be seen by. In seven hundred years three archers have strung it, and none was let keep it. *Owner:* the Oakborn line. *Bearer:* no one: it hangs **unused**. Queen Ithrien's left hand is still and cannot hold a bow. *Why:* it goes to the Oakborn heir, and the only other of the blood is Thalion Halfleaf, an archer the law bars from the crown; to hand him the bow is to name him. *In the hand:* draws like a ship's cable; drawn true, its horn ears throw a war arrow through a shield at two hundred paces, faster than a bow has any right to; the arrow must still find its man. *Art:* **Owl-Light**: loose, and be gone from the place before the arrow lands; they never learn where it came from. *No Leaf Moves* (the wait, so still that the wood forgets her), *Soft Wing* (the loose that makes no sound, as an owl's wing makes none), *Elsewhere* (never twice from one tree), *The Sun's Shadow* (the one arrow shot from the open, out of the sun: it was the first of the war). *In the portrait:* unstrung on two pegs beside its quiver, its string coiled at the grip, Thalion beside it with his hands behind him.

*The new drawing.* The first bow was a plain yew stave with silver lines: true, and thin. This one is built to be read from across a room and again from a hand's breadth:
- **Its outline is a sickle at each end.** Limbs of ridge yew run into long ears of white horn that curve forward, so the strung bow is a wide shallow curve between two crescents, and unstrung its ears spring forward. No ordinary bow in the game has that line (the ordinary longbow under it on the page is one arc).
- **A sculpted riser** of black heart-oak, carved to the hand and edged in silver: a scroll cut into each shoulder with a bead of silver at its heart, an oak leaf in silver wire on the lower block (the Oakborn's own), a moonstone held in a sickle of silver on the upper, and between them the grip, bound in green silk crossed with silver wire between two silver ferrules, with a leaf of white horn above the hand for the arrow to rest on.
- **Inlaid limbs.** The yew is deep in the hand, red heartwood to the belly and its pale sapwood left on the back, with silver wire down each edge. Each limb carries the moons of a month in silver, seven of them, from the thin moon by the grip to the full one at mid-limb, and from there a fine silver vine runs on to the horn.
- **Horn ears with their furniture:** white horn spliced on under a beaded silver collar, a dark horn bridge for the string to ride over, the cut nock, and beyond the nock the ear itself cut to a sickle.
- **A string and arrows of its own.** A grey silk string, served in green where the arrow sits and where it rides the horn, with a tuft of owl down on each side to hush it. One arrow lies beside it on the plate: a long leaf of bright steel in a silver socket, a crest of green and silver, barred owl feather, a horn nock. Its quiver is dark green leather with silver at mouth, girdle and foot, a sickle moon over a vine tooled on it in silver thread, and seven arrows in it.
- **At portrait size** the two white crescents, the dark riser, the green binding and seven silver points down each limb carry it; the phases of the moons, the vine, the grain and the carving are left out below `lod 2`. In its portrait it hangs unstrung, so its ears spring forward, with its string coiled at the grip and its quiver on the next peg.

**X · Lodestar** · crossbow, 815 mm · Highland League.
*Made:* at Roseham in 952 for the first Captain-General; its steel bow is its second, of Irondeep steel, fitted in 1052 after the horn one split at Hartgate. 153 years old. *Its name:* the valleys named it for the one star that does not move. Where its bolt stands in a gatepost the companies will be found, and the silver is owed: a fixed sum, the Highlanders say, cannot be cheated. It held the stakes at Hartgate in 1051 with its last bolt. The horn plates on the tiller carry a tally, one cut for each contract paid in full: 206 cuts, three plates blank. *Owner:* the Silver Chest, the valleys in common. *Bearer:* the Captain-General (Ulric Greycloak), by the Council's gift. *Why:* since 952 a hire is sealed when its bolt is shot into the hirer's gatepost and ended when the pay is counted and the bolt drawn. Ulric took Aldmark's silver before the Council voted (the lore's secret), and the valleys are asking where the bolt is. *In the hand:* three shots to a bowman's twelve, each through plate at a hundred paces; between shots, eight pounds of wood. *Art:* **Falling Star**: the steep shot, down from a height or up over a wall, that other crossbows cannot judge. *The Climb* (the bolt sent steeply up, to come down behind a parapet), *Fixed Mark* (the wait on the aim, through wind and the count), *Star Down* (the plunging shot from a height, seen only as it lands). *In the portrait:* slung on his back, the steel bow behind his shoulders.

## How a piece is built

A legendary is a **record of parts**, in millimetres, along its own axis (`u` from hilt or butt toward the point, `v` across it). The record names its parts in the order a maker would fit them, and each part is drawn by a shared drawer:

| Layer of the record | What it is | Drawer (`src/kit.mjs`, `src/fine.mjs`) |
|---|---|---|
| Outline | The blade, head, stave or stock: stations along the axis, its own shoulders, barbs, horns | `blade`, `backblade` (one edge, through a bent frame), `piece`, `tube`, `haft` |
| Metal | One of the finishes: bright, white, watered, black, dwarf-steel, bronze, gold, red gold, silver | the ramps in `MET`; `TURN` (how a form turns from its lit edge to its far one) |
| Heart | A core of another steel down the blade, with its watering | `blade({ core })`, `watering` |
| Inlay and writing | Veins like roots, vines, plaits, key patterns, lettering in a wire hand, ornament like script | `roots`, `vineOn`, `plait`, `fret`, `lettering`, `inlay`, `engrave` |
| Fittings | Guard, grip and its binding, collars, pommel, socket, langets, bands | `piece`, `winding`, `xwrap`, `ridge`, `beads`, `trim` (one metal edging another) |
| Stones | Cut stones in a collet, cabochons, a pearl, enamel | `gem`, `cabochon`, `pearl`, `enamel` |
| Soft things | Pelt, hair, tassel, cord | `pelt`, `tufts`, `tassel` |
| Its years | A nick with a date, scratches, clouds in the polish, salt, a bare ring | options on `blade`; drawn by the record itself |
| Light | One glint where the polish is highest | `glint` |

- **One record, every size.** The same record draws the plate, the closer looks, the flat strip and the piece on the figure. A **frame** puts its axis anywhere on a page at any angle (`frame(G, deg)`), exactly as the figure library's own `swordArt(S, G, a, L, …)` takes a point and a direction; `arcFrame` bends it for a sabre. Paint that depends on the light (which face of a blade is the lit one) is worked out from the frame, so a piece can be turned freely.
- **Level of detail.** `D.lod` is 2 on a plate and 1 on a figure. At 1 a record leaves out its engraving, writing, watering and wear and keeps outline, metals, accent and glint (growth.md §4: "at 46 px its outline, accent and one glint"). Shapes smaller than half a pixel are dropped by the scene itself.
- **Never changes.** Every irregularity (the wander of a vein, the watering, a scratch) comes from a stream seeded by the piece (`stream(seed, channel)`, the figure library's own). Nothing calls `Math.random` or the clock. Rendering reads nothing and writes nothing.
- **A rename does not move a line.** Each of the nine renamed pieces keeps its first id as its `seed` (`id: 'winter-storm', seed: 'winter-wheat'`), so its dice, and so its drawing, are what they were: the nine were compared with their first drawings at both levels of detail and are the same, shape for shape. The bow is new and seeds itself.
- **The scene is the game's.** Drawing goes through `src/ui/engine/figure/scene.js` and `g.js`, imported and not changed, so a piece is the same kind of SVG, with the same line and the same light, as a person.
- **The ordinary arm in each strip is the game's.** `src/plain.mjs` holds ten small records that call the figure library's own `swordArt`, `daggerArt`, `haftArt`, `bowArt` and `crossbowArt` at Plain make, in the piece's frame, and take their ground shadow from the shapes drawn. (The first strips' ordinary arms, drawn with this kit, are still in the file; the sketches use them.)

## On the figure: how each registers as gear

Today `wardrobe.js` holds one row per item id (`GEAR_ART`), and `registerGear(id, row)` adds one; a row names the drawn piece (`art: 'sword'`), its form, its make and rarity, and `gear.js` holds the item functions that draw each piece on the rig (`ITEMS`). A legendary needs one more kind of row and one more item, and nothing else:

```js
// E2, when a unique is created or loaded (data/items/uniques.json):
registerGear('winter_storm', { art: 'legend', u: 'winter-storm', carry: 'plant' });

// gear.js, one item for every legendary: it stands the piece's record on the rig at its carry point
ITEMS.legend = (C, o) => { /* frame(G, deg) from the rig and o.carry; record.draw({ S, F, lod: 1, … }) into the layer */ };
```

The page does exactly this, at run time and without touching `src/`: `src/figure.mjs` adds `ITEMS.legend` and six stances to the library's own tables, and each portrait is `compose(look, { crop })` with `{ id: 'legend', u, mode, … }` as the last item on the person's list of gear. The piece is drawn into its own small scene and laid into one of the figure's layers, so it gets the figure's depth shadow and light pass with everything else.

| Piece | `carry` | Where the frame sits on the rig | Figure layer |
|---|---|---|---|
| Winter Storm | `plant` | point on the ground before the feet, blade upright; both wrists sent to the pommel | `propFront` |
| White Noon | `bear` | upright at the right shoulder, the cross a hand above the upper fist | `propFront` |
| Dry Rain | `across` | from the right fist at the hip, across the body to the far shoulder | `propFront` |
| Undertow | `raise` | in the right fist at the chest, point up | `propFront` |
| Killing Frost, Summer Thunder | `pole` | butt on the ground beside the right foot, the haft through the fist | `propFront` |
| Deep Fire | `port` | across the body in both fists, head by the right shoulder | `propFront` |
| Long Shadow, Sickle Moon | `stand` | not held: on brackets or pegs beside the person. The bow hangs unstrung (`unstrung: true`: the record draws its sprung line, the coiled string and the quiver on its strap), and its sitter stands a little off the middle of the card (`shift`) so that both are whole | `back` |
| Lodestar | `back` | slung: behind the shoulders, its strap the figure's own baldric | `propBack` |

What E2 would still have to build: the carry point for a piece that is **sheathed** (each sword and the dagger want their own scabbards drawn; only the drawn carries are shown here), the choice of carry from the person's stance, and the cache key (`u:<id>` joins the portrait's key, as economy-and-items.md §2.4 already says).

## What it costs

Measured by the page itself in headless Chromium (software drawing) on the shared container. Compose is a record turned into SVG; paint is the browser turning that SVG into pixels, timed by drawing it to a canvas at twice the size shown. One run, taken while the four-core machine was busy with other sessions' browsers (load 13 to 18), so the paint figures are high and uneven: read the shapes and sizes, which do not move, and compare times only within a column.

| Piece | On its plate: shapes | SVG | compose | paint | On the figure (alone): shapes | compose | paint | The whole card: shapes | compose | paint |
|---|---|---|---|---|---|---|---|---|---|---|
| Winter Storm | 205 | 196 KB | 23.5 ms | 37.5 ms | 151 | 3.6 ms | 59.6 ms | 752 | 34.6 ms | 156.2 ms |
| White Noon | 297 | 185 KB | 9.4 ms | 235.1 ms | 244 | 3 ms | 12.8 ms | 1072 | 20 ms | 200.4 ms |
| Dry Rain | 131 | 183 KB | 12.7 ms | 21.7 ms | 113 | 2.2 ms | 4.8 ms | 542 | 11.5 ms | 96.3 ms |
| Undertow | 131 | 127 KB | 3.3 ms | 37 ms | 110 | 1.5 ms | 3.8 ms | 478 | 7.4 ms | 89.2 ms |
| Killing Frost | 86 | 147 KB | 5.1 ms | 34.2 ms | 66 | 2.6 ms | 9.9 ms | 812 | 8.5 ms | 148.5 ms |
| Deep Fire | 229 | 117 KB | 2.7 ms | 40.3 ms | 191 | 1.2 ms | 10.6 ms | 949 | 12.5 ms | 154.2 ms |
| Long Shadow | 127 | 122 KB | 4.5 ms | 62 ms | 122 | 2.2 ms | 26.3 ms | 615 | 9.2 ms | 100.4 ms |
| Summer Thunder | 115 | 134 KB | 3.5 ms | 40.4 ms | 121 | 1.8 ms | 13.9 ms | 791 | 5.5 ms | 137.9 ms |
| Sickle Moon | 346 | 268 KB | 8.7 ms | 32.9 ms | 113 | 3.1 ms | 8.3 ms | 512 | 5.9 ms | 104.8 ms |
| Lodestar | 138 | 98 KB | 3.3 ms | 24.4 ms | 102 | 1.9 ms | 5.8 ms | 541 | 4.4 ms | 142.7 ms |

Against growth.md §4's budgets (12 shapes at 46 px, 60 on a card, 220 at full size; 8 ms for a plate):

- **Compose is cheap**: 3 to 13 ms a plate once the code is warm (the first row carries the page's warm-up), 1 to 4 ms at figure scale.
- **Shape counts at full size are near the budget, and the new bow is over it** (86 to 346 against 220; a shape here is one path, and a path may hold a whole net of inlay). Sickle Moon's 346 are its fourteen moons, its vine, its two ears with their furniture, its arrow and its quiver: it is the price of a thin piece that has to read as a legend. Its plate is also the heaviest SVG (268 KB against the first bow's 288 KB: more shapes, shorter paths).
- **At figure scale they are over it** (66 to 244 against 60 on a card). The records thin themselves at `lod 1`, but not yet by enough: a third level for list sizes (silhouette, two metals, the accent) is the next cut and is easy, because the parts are already ranked. The bow thins well: 113 shapes on the figure.
- **Paint is over the 8 ms budget for a plate** (22 to 235 ms at twice the size on a busy machine; 25 to 100 ms on the first, quieter run). A plate is painted once and kept, as portraits are (D-036 item 4), so this is a one-time cost a piece, but it is real.
- The card's paint is the figure library's own light and depth passes, as gate 2 measured; the piece adds a small part of it.

The ordinary arms' cost is on their own sheet (`ordinary.png`, `ordinary-timing.json`) and in `src/ui/93-figures/README.md`: a list portrait still composes in under 3 ms in the game's budget test, against a budget of 6.

## Files

In `docs/design/legendaries/`:

- `legendaries.html`: the page (424 KB: 279 KB of script, the rest the three fonts).
- `legendaries.png`: the whole sheet, 1366 wide at twice the pixels (2732 × 33,524; 8.6 MB).
- `legend-01.png` … `legend-10.png`: each piece's own block at twice the pixels (0.7 to 1 MB each).
- `ordinary.png`: **the game's ordinary arms, before and after order 52** (2732 × 14,396; 2.3 MB): nine armed people as the library drew them before and draws them now; every class (swords, daggers, axes, maces and hammers, spears and pole arms, bows, quiver and crossbow, shields) at Plain, Fine and Masterwork make beside what was drawn before; the four rarities; six peoples' makes, drawn and sheathed; a crude piece of each kind; and the cost. `ordinary.mjs` builds it; `ordinary-timing.json` holds its measures. "Before" is the figure library read out of git at commit `bcfd0d5`.
- The pictures are stored at 256 colours with an ordered dither (a third of the lossless size; the painted grounds keep their smooth turn). The pages themselves are the true pictures.
- `timing.json`: the measures above, as the page gave them.
- `legendaries.md`: this note. `build.mjs`: the build.
- `src/`: the source, 2,200 lines, and 304 more in `src/sketches/`.

| File | What it holds |
|---|---|
| `kit.mjs` | Metals and stuffs, the light, frames, the paint of forms, one piece of anything, the blade, lettering, vines, plaits, key patterns, grips, hafts, pelt |
| `fine.mjs` | Cut stones, trim, root veins, watering, the bent frame, the one-edged blade, tassels, crossed bindings |
| `01-winter-storm.mjs`, `02-white-noon.mjs`, `03-dry-rain.mjs`, `04-undertow.mjs`, `05-killing-frost.mjs`, `06-deep-fire.mjs`, `07-long-shadow.mjs`, `08-summer-thunder.mjs`, `09-sickle-moon.mjs`, `10-lodestar.mjs` | The ten records: each its words (name, history, art, forms with what each is) and its `draw(D)` |
| `plain.mjs` | The ordinary arm under each piece: ten records that call the game's own arms code at Plain make (and the first strips' kit-drawn ones, kept) |
| `index.mjs` | The ten in order, and who carries each: ten looks for the figure library |
| `figure.mjs` | The `legend` item and the stances, added to the figure library's tables at run time |
| `compose.mjs`, `page.mjs` | One piece, one view, one SVG; the page |
| `png.mjs` | PNG helpers (copied from `demo-2d/pngq.mjs`, with an ordered dither added) |
| `preview.mjs`, `preview-figs.mjs`, `peek.mjs` | A look at one piece, at the portraits, at one block of the built page |
| `names.mjs` | The naming guide's checks: every new name against the lore's arts, forms and houses' words, and the lore's own names counted against the guide |
| `sketches/` | Three studies not among the ten: two earlier swords and the first bow (see below) |

```sh
node docs/design/legendaries/build.mjs               # the page and every picture (about 100 s)
node docs/design/legendaries/build.mjs --no-shots    # the page only
node docs/design/legendaries/ordinary.mjs            # ordinary.png and its timings (--keep leaves ordinary.html)
node docs/design/legendaries/src/names.mjs           # every new name against the game's own; exit 1 on a clash
node docs/design/legendaries/src/preview.mjs --id=03-dry-rain --view=full,0,1,plain --out=/tmp/x.png
node docs/design/legendaries/src/preview-figs.mjs --only=deep-fire,killing-frost --out=/tmp/f.png
node docs/design/legendaries/src/peek.mjs "--sel=#lg-09" --out=/tmp/b.png
```

The first version touched nothing in the game. Order 52 did, on purpose: the ordinary arms are the figure library's (`src/ui/engine/figure/arms.js`, `make.js`, and their rows in `gear.js` and `wardrobe.js`), with their tests.

## An honest reading

**What is good.** The ten are ten different things: outline, metal and ornament tell the realm before the plate is read, and each beats its ordinary cousin at a glance in the strip under it, which is a fairer test now that the cousin is the game's own, better-made drawing. The names now do work: each says which country it is from and what it is like to face, the art's name follows from the piece's, and the forms can be read as a fight. The histories hang on what the lore already says, and the ownership of each is a live question in 1105. The bow, which was the weakest plate, is now one of the richest.

**Where it falls short.**

1. **It is still clean vector work, not paint.** The example has depth, grain and a hand in it. These have gradients, crisp bands of light and fine line; metal is convincing at arm's length and plain close up. The guard of Winter Storm is flatter and simpler than the example's sculpted one.
2. **Sculpted forms are few.** The ancestor's face on Long Shadow, the horn on Summer Thunder and now the bow's riser and ears are the modelled things. Animal heads, figures and pierced work need hand-authored outlines; one earlier study (a wolf's head pommel, in `sketches/`) shows how far a first try gets, which is not far enough.
3. **Long thin pieces are still thin.** The spear and the glaive are true to scale, so the eye goes to the closer looks. The bow no longer leans on them: its ears, riser, arrow and quiver give the plate something to hold.
4. **The bow's fine work is fine.** The moons are a few millimetres across and the vine is a hair: at the plate's size they read as jewelled points, and only the closer looks show that they are phases of a moon. On the figure they are left out.
5. **On the figure the pieces are small and not yet thinned enough** (see the costs). Only drawn carries are shown: no scabbards. The hands are the library's two shapes (a relaxed hand and a fist), so a grip on a haft is a fist laid over it. The stances are the library's front-facing ones with new wrist targets, so nothing is swung, shouldered or drawn back.
6. **Three of the portraits are not "in the bearer's hands"** because the story says so: one lost (drawn with its last bearer), one in pawn (on a strongroom wall), one unused (on its pegs).
7. **The writing on two pieces is in a plain wire hand** (straight strokes and arcs), right for an inlaid blade but not a scribe's hand; White Noon's names want a proper book hand at full size.
8. **Names are a matter of ear, and one ear chose them.** They were checked by script against the game's own names and by memory against other worlds' blades; a plain two-word phrase will always be the title of something somewhere. Three choices the owner may want to turn: *Lodestar* is a star and not a weather (the highland sky, and a sum that does not move); *Deep Fire* is the dwarves' forge and the Deep Law, not a sky, because a hold has none; *Hold Fast*, the dwarves' greeting in the lore, is also the motto of a human house (Fanhope).
9. **A plate shows the forms' names, not what each one is.** The one-line account of each form is in the record and in this note; the plate is already as long as the Profile page allows.
10. **Not done:** each piece's scabbard or case (the bow has its quiver); the back of any piece; a night version of the page; a playtester agent's pass (a subagent cannot start one).

## Not among the ten

- `src/sketches/the-unbending.mjs`: **the first bow**, as shown for order 36: a ridge-yew stave with its sapwood and silver fine as leaf-veins. True to scale and too plain to read as a legend; order 52 replaced it with Sickle Moon. Kept, with a note at its head.
- `src/sketches/free-hand.mjs`: a longsword for Tessaria's six-fingered kings (a grip a finger longer than any other; since 1061 one claimant holds the blade and the other the scabbard). Drawn before the owner's example arrived; kept, since Aldmark has the longsword. Its working name, The Free Hand, is from before the naming guide and would be renamed by it.
- `src/sketches/twelfth-wolf.mjs`: the Iron Wolf's greatsword of growth.md §4 (black steel with a pale edge, a pelt on the ricasso, a wolf's head pommel). A study; its wolf wants redrawing. By the guide it is **Wolf Moon**, and its art **Midwinter** (growth.md §3.3, §12.6); the file keeps its working name.
- Thought through and not drawn, under working names that the guide would also replace: Velgrad's greatsword (a Sevrin prince is measured against it each midwinter), Morhaven's poleaxe (its beak a falcon's head), Ashmere's red longbow (the one on the royal arms), a horn bow for the Tenth Wind.

## Questions for the owner

1. **Is this the bar?** If it is close, which three should be pushed furthest first?
2. **How fanciful may a silhouette go?** Winter Storm follows the example (claws, barbs). The other nine stay nearer to arms that could be made. More like the example everywhere, or keep each people's restraint?
3. **Names.** A piece for its country's sky, its art for what that weather does to a man, the forms as the fight. Is that the register, and do any of the ten still read wrong?
4. **The lore's own arts.** By the same guide, 135 of the lore's 265 art names and 550 of its 1,284 form names would change (growth.md §12.7). Rename them all with G3, or only the arts a player meets most?
5. **Ownership as play.** Each of the ten is somebody's problem in 1105 (a pawned spear, a stolen sabre, a lost axe). Should winning, finding, stealing or redeeming these be things a player can set out to do?
6. **Carried how?** Shown drawn or held so the piece can be seen. In the game a sword is mostly sheathed: should a legendary show in its scabbard with the hilt out (as growth.md says), or be drawn in the portrait because it is the point of the portrait?
7. **A plate for each in the game?** The page's plate (name, realm, history, owner, bearer, why, in the hand, art and forms) is longer than the Profile page now allows (D-041). Fold it, or give uniques a page of their own?
