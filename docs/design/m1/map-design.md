# The one continent of Ardan: the design (map version 4)

This is the design the owner asked for in orders 72 and 73: one continent, drawn on purpose from his own picture, with
realistic causes for its ground, clean natural borders, no realm inside another, and every water, range, river and region
named. An engineer builds it in code as map version 4 from this page and the files beside it, and the lore is then
brought into line with it (order 71, D-151).

**What is here**

| File | What it is |
| --- | --- |
| `map-design.md` | This page |
| `design-sketch.png` | The sketch: the continent as designed, with realms, borders, capitals, rivers, roads and names |
| `design-on-picture.jpg` | The same borders, rivers and names laid over the owner's picture, to check the design against it |
| `reference/owner-continent.webp` | The owner's picture (order 73) |
| `design/seats.tsv` | **Authored.** The 306 provinces, each with its seat (a pixel of the picture) and why the seat stands there |
| `design/features.json` | **Authored.** The frame, the edits, every water, river, range, peak, pass, region, road, sea lane, isle, ferry, border line and ground word |
| `design/provinces.png` | **Built.** The province of every 10 km cell (700 x 450): red + 256 x green = province id + 1; blue 0 land, 1 lake, 2 sea |
| `design/ground.png` | **Built.** The ground of every cell (ice, tundra, rock, taiga, forest, jungle, grass, scrub, steppe, desert, ash, marsh) |
| `design/relief.png` | **Built.** The height guide of every cell, in the engine's own measure |
| `design/land.png` | **Built.** The same grid, to look at |
| `design/build.json` | **Built.** Every province, realm, wild, water, river, road and border as numbers, in the game's kilometres |
| `design/tables.md` | **Built.** The same as tables: realms, wilds, waters, all 306 provinces, every border and what it runs along, the checks |
| `tools/m1/design-sketch.mjs` | The tool that reads the picture and the two authored files and builds all of the above |

Run `node tools/m1/design-sketch.mjs` to rebuild. It fails if a seat has no land, a realm is in two pieces on one land, a
realm is enclosed by another, or a water has no name. Today it passes.

## 1. The owner's picture, and how it is read (D-153)

### 1.1 What the picture shows

One great landmass, a rounded rectangle wider than it is tall, with ragged coasts and about fifty islands close inshore.
Its parts, as the design names them:

- **North:** a belt of snow mountains along the whole north coast, highest in the north-east. Under it in the middle a
  round water joined to the sea by a narrow channel. In the north-east a great lake at the mountains' foot.
- **North-west:** a dark forest round a lake, and a fjord coast with a spray of islands off it.
- **West:** a dark red volcanic massif. A peninsula under it reaches west, with two islands off its cape. South of that a
  bright green lowland behind a wall of coast hills.
- **Middle:** a ridge of mountains running east and west. North of it lie a long lake in the west, yellow grass, and a
  forked lake in the east. South of it lies a long narrow lake with islets, the longest water inside the land.
- **South-centre:** a sand desert in a basin ringed by ranges, with one river running north through it to the long lake.
- **East:** a river running south from near the great northern lake through a trench between a low forest ridge and a high
  snow range, into a crooked lake, and out south-east to a gulf. East of the snow range a green coastal plain, a high
  plateau on the coast, and a mountain cape.
- **South-east:** a dry brown range running south from the crooked lake, green country east of it on the gulf, and a
  peninsula whose end is all but cut off by a winding channel.
- **South:** a green coast of bays and capes, and a small peninsula in the south-west beside a wide open bay.

The picture has no great inland sea. The lore has one, the Middle Sea, with ten realms on it.

### 1.2 The reading

Laid on the release's map by position, the picture is the release's world with its seas half drained. Realm for realm,
the ground under each is right: the red volcano is under Ashmere, the bright lowland under Varenna, the yellow grass under
Gorath and Ulun, the desert under Sahrim, the dry range under Stonehold and Abara, the peninsula under Kesh. What changes
is the water. The design keeps the picture's shape and the lore's names wherever both can stand, and where they cannot it
keeps the picture and moves the name:

- **The Middle Sea** is the long central lake: the last water of an older, wider sea whose dry bed is the Red Waste. It is
  640 km long, brackish, with no way out to the ocean. Solenne, Lucerna, Ostra and Morhaven stand on its north shore in
  that order from the west; the Monuti's delta (Tamar) is at its east end; Sahrim has its south shore.
- **The realms the old sea's western half touched now face the ocean.** Varenna's coast is the Lion Gulf. Qadir is the
  coast under the Sunwall. Sabra is the Gulf of Sands, the wide bay of the south-west. Corvasse is the two islands off the
  western cape, and the Strait of Hael is the passage between that cape and the isles, the gate every coasting ship
  between the north-west and the south must use.
- **Cold Bay** is the round northern water, a bay of the sea through the Cold Narrows.
- **The Salt Sea** is the forked lake of the steppe. **Lake Silara** is the lake of the north-western forest. **The
  Glenmere** is the long western lake (Varenna's Northern Lakes are its south shore).
- **The Lakeland** is the country of the great north-eastern lake, here called the Western Lakes as the lore has it. Drevna
  holds it.
- **The Grey Channel** is the river in the eastern trench, a rift. It runs grey with glacier melt from the East Rift
  Heights, wide and deep enough for galleys from Droin down. The crooked lake is **the Grey Water**, and the river out of
  it to the Eastern Gulf is **the Gullet**.
- **The Neck** is the land round the south end of the Grey Water. The only land road from the south to the Eastland
  crosses the Gullet at Tessar and runs north between the lake and the Roof.

### 1.3 The choices, for the owner to critique

Each of these is a decision the owner can overturn. They are listed once here and argued in the sections that follow.

| # | Choice | Where argued |
| ---: | --- | --- |
| 1 | **Scale.** The game's frame stays 7,000 x 4,500 km (10 km cells). The continent is then about 5,260 km across and 4,100 km north to south. The picture's own scale bar would make it 9,500 km across; the design reads the bar as ornament | 2, 9 |
| 2 | **The Middle Sea is the central lake at the size the picture draws it** (30,900 km2), not the wide sea of the release | 3.4, 9 |
| 3 | Varenna, Qadir, Sabra and Corvasse are on the Western Ocean, and the Strait of Hael is an ocean strait | 4, 7 |
| 4 | Cold Bay is the northern water; the picture's channel to the sea is kept open as the Cold Narrows | 2, 3.3 |
| 5 | Northreach is the forest land east of the Cold Narrows, in one piece | 4.8 |
| 6 | Drevna is the great north-eastern lake's country, north-west of Velgrad | 4.26 |
| 7 | The Grey Channel is a great river in a rift, not an arm of the sea. The Western Lakes drain south-west to the Salt Sea, as the picture draws, and a portage joins them to the channel | 3.5 |
| 8 | Gorath is a belt of grass from the Tusk Hills to the Salt Sea, between the northern plains and the Crown Range | 4.11 |
| 9 | Tamar is the Long Rift, the Monuti's valley; Sahrim holds the desert on three sides of it; the Monuti's flood keeps the Middle Sea alive | 3.5, 4.18 |
| 10 | The Neck (Tessaria) is the land round the Grey Water's south end; the Free Marches lie east of it | 4.31 |
| 11 | Ughrak is the north-eastern coastal plain behind the East Rift Heights. Silk comes to it by sea, through the Sunrise Isles | 4.34, 6 |
| 12 | Hrimfell is the snow coast of the north-east. Frostholm is the islet off the Amber Capes, widened into an island | 2, 4.9 |
| 13 | Great Amber is an island: the picture's winding channel across the neck of the south-east peninsula is cut through | 2, 4.32 |
| 14 | Varenna the city stands at the Palella's mouth on the Lion Gulf; the Palella runs through the Crowmere; the Brightwash runs to the Long Firth | 3.5, 4.3 |
| 15 | Mount Cinder is the red massif (Ashmere). Mount Hael is on the western peninsula, the Ashlands, which no realm holds | 3.2, 4.35 |
| 16 | Where the 25 wild lands lie | 4.35 |
| 17 | Sizes follow the ground. Sahrim and Varenna are the largest realms, nearly equal; Sylvaran is middle-sized | 4.0, 7 |
| 18 | The frame runs from 65 degrees north at its top to 11 at its bottom | 3.8 |
| 19 | Where the four great region names lie (Westland, Sunlands, Southland, Eastland) | 5 |
| 20 | The ground where the picture's paint cannot tell (grass from steppe, wood from farmland) is set by the design | 3.8 |

### 1.4 The record (D-153, for `docs/DECISIONS.md`)

> ### D-153 · The designed continent is the owner's picture, read with the lore's names (2026-11-19; order 73; with D-151, D-152)
> **Chosen.** Map version 4 takes its outline, lakes, ranges, deserts, rivers and coasts from the owner's picture
> (`docs/design/m1/reference/owner-continent.webp`), laid on the game's 700 x 450 grid at one scale (4.27 km a pixel).
> Where the picture and the lore differ, the picture's shape stands and the lore's name moves to the water or land that
> fits it best: the Middle Sea is the long central lake, an inland sea with no way to the ocean; Varenna, Qadir, Sabra and
> Corvasse face the Western Ocean, and the Strait of Hael lies between the western cape and the Corsair Isles; Cold Bay is
> the northern water behind the Cold Narrows; the Lakeland is the great north-eastern lake; the Grey Channel is a rift
> river from the Lake Portage to the Grey Water, and the Gullet carries it to the Eastern Gulf; the Salt Sea is the steppe
> lake; the Neck is the land round the Grey Water's south end. Realms are grown from 306 authored seats over the picture's
> ground, borders on rivers and ridges, no realm enclosed, each in one piece. The lore follows the map (order 71): the
> changes are listed in `docs/design/m1/map-design.md` section 7.
> **Why not a wider Middle Sea.** The owner's picture is the order. A wide sea would redraw the middle of his continent.
> The question is put to him (section 9).
> **Departures from the picture** are few and listed (section 2): three channels kept open or cut, three lakes joined
> where the grid would break them, one islet widened into Frostholm, river water and ponds under the map's grain filled.

## 2. The frame

**Scale.** The game measures everything on 10 km cells in a frame of 7,000 x 4,500 km (700 x 450 cells), and marches,
provinces and distances in the lore stand on that. The picture (1536 x 1024 pixels) is laid on the frame at one scale both
ways, with its continent and islands centred and at least 200 km of sea on every side:

```
x_km = 229.2 + 4.27 * pixel_x        y_km = 78.7 + 4.27 * pixel_y
```

Every coordinate in `design/seats.tsv` and `design/features.json` is a pixel of the picture; `design/build.json` gives
the same things in kilometres. A cell reads nine points of the picture; it is land if five or more are land.

**Size.** 126,642 land cells: 12.66 million km2, 40.2% of the frame (the engine's `landFraction` was 0.38). The
continent itself is 124,287 cells; 53 islands hold the other 2,355. The mainland runs from 890 km to 6,150 km east and
from 200 km to 4,300 km south in the frame.

**Latitude.** The frame's top edge is 65 degrees north and its bottom edge 11 degrees north (one degree is 83.3 km):
`latitude = 65 - 0.012 * y_km`. The north coast lies at 58 to 63 degrees, Kingsmere at 50, the Middle Sea at 38, the
Red Waste at 26 to 36, Zanara at 23, Amberport at 17. Section 3.8 gives the reasons. The engine's `VM.OPTS` has 56 and 16.

**Where the grid departs from the picture.** Every departure is in `design/features.json` under `edits`, with its reason.

| Edit | What | Why |
| --- | --- | --- |
| The Cold Narrows | The picture's channel from the northern water to the sea, about 30 km wide, is kept open two cells wide | So that Cold Bay is a bay of the sea, as the lore has it, and ships can pass |
| The Amber Strait | The picture's winding channel across the neck of the south-east peninsula is cut through, two cells wide | So that Great Amber is an island, as the lore's spice islands are. The picture's channel stops just short |
| The Long Firth | The picture's inlet under the Bleakfold is kept open one cell wide | It is narrower than a cell; it is Ashmere's northern border and its harbour |
| The Narrows of the Middle Sea | The strait between the sea's two basins is kept open one cell wide | The grid would cut the sea in two |
| The Grey Water | Its three pools are joined by one-cell necks | The picture draws one crooked lake; the grid would make three |
| The Glenmere's eastern arm | Joined to the lake | The same |
| Frostholm | The picture's islet off the Amber Capes (about 40 cells) is widened to the north-west to 250 cells | Two provinces, the giant halls and the tin fair need the room. The lore gives Frostholm 122,525 km2; this is 25,000 |
| Small waters | Enclosed water of fewer than 25 cells that no name claims is drawn as land (616 cells in all) | It is the picture's river water, which the design's rivers carry, or ponds under the map's grain |
| Snow shadows | Two patches of blue shadow on the northern snow are land, not lakes | They are paint |
| Ornaments | The compass, the scale bar, the clouds and the frame are not land | |

Nothing else moves. The coast in both sketches is the picture's own coast.

## 3. The land and its causes

### 3.1 How the continent was made

Five things made this land, and each explains ground the picture paints and goods the lore sells.

1. **Two old blocks joined along the Crown Range.** The northern block and the southern block met long ago along an
   east-west line through the middle. The mountains that collision raised are old and worn: the Crown Range, with the
   Marble Mountains at its western end. Old worn ranges are where silver, marble and iron lie near the surface, and that
   is what Brannoch and Solenne's hills yield. North of the range the crust sagged into a trough: the Glenmere, the
   Skardush valley and the Salt Sea all lie in it. South of the range a wide basin sank, and the sea once filled it.
2. **The old sea dried.** When the ranges round the basin rose, the sea that filled it was cut off and shrank. Its last
   water is the Middle Sea. Its dry bed is the Red Waste: salt at Zarak, natron in the Long Rift, oil seeping at Sabra's
   shore and by the Salt Sea. This is why a desert lies beside a sea, and why the sea is brackish.
3. **The ocean floor dives under the west coast.** That raises coast ranges close to the sea and feeds volcanoes behind
   them: the Lion Hills and the Sunwall; Mount Hael, which blew itself apart in 13 BR; Mount Cinder, which still burns.
   Such coasts carry copper and sulfur (Ashmere, Qadir, old Hael), have deep water close inshore and few plains, and shake.
   Ash weathers into rich soil, which is why Ashmere grows wheat round a volcano.
4. **The north coast is the oldest collision still standing high.** The Frostfells run the length of it, ice-covered in
   the north-east, cut by fjords (the North Fjords, Whale Sound) where glaciers reached the sea. Granite islands off it
   carry tin (Frostholm). Amber washes out of old forest beds along the low north-western shore (the Amber Strand).
5. **The east is tearing apart: the Great Rift.** A crack in the crust runs from the Highveld north down the Long Rift
   (the Monuti's valley) to the Middle Sea's east end, north-east along the Santora to the Grey Water, and north up the
   Grey Channel to the Western Lakes: about 3,500 km along its floor. Its floor holds the lakes and the rivers. Its shoulders are pushed up: the
   Highveld and the Worldspine in the south, the Roof and the East Rift Heights on the east side (the higher shoulder),
   the low Rift Heights on the west. Rifts leak fire: Redcrown glows, Smokewell vents sulfur, Emberdeep's forges are
   heated by the ground. Where the rift's water breaks out to the east it has cut the Gullet. A rift floor is also where
   old bones are found, as the bone-diggers of Abara find them in the Long Rift clay.

Two smaller things: the Iron Mountains and the Tusk Hills are stumps of the oldest rock of all, which is where banded
iron lies (Irondeep); and the Sunrise Isles and the spice isles are the tops of a drowned chain off the east and
south-east coasts.

### 3.2 The ranges

Heights are a guide for the builder (`design/relief.png`), not a survey.

| Range | Where (picture pixels) | What it is | Who holds it |
| --- | --- | --- | --- |
| The Frostfells | The north coast, 680-1170 x 30-230 | The high snow range; glaciers and ice coast in the north-east, pine fells in the west | Hrimfell (the White Coast), the wilds (the Trolness Fells, the Pinewild, the Frostfells), Drevna's northern march, Northreach's coast ridge |
| The East Rift Heights | 1070-1230 x 170-330 | The rift's high eastern shoulder, snow-covered; Redcrown on its west face | Velgrad west of the crest, Ughrak east of it |
| The Rift Heights | 1030-1070 x 300-355 | The rift's low western shoulder: oak forest, the vents of Smokewell | Greyhaven |
| The Iron Mountains | 800-880 x 200-290 | A stump of old rock, brown and bare, full of iron | Irondeep; Aldmark to its foot; Gorath's Nagdur under its east face |
| The Tusk Hills | 500-580 x 270-300 | A small snow ridge at the Evenwood's south-east corner | The crest is Sylvaran's old border with Gorath's Wolf clans |
| The Ash Range | 340-510 x 370-460 | Mount Cinder's massif: lava, ash and copper | Ashmere |
| The Lion Hills | 330-410 x 465-520 | A snow-ridged knot behind the Crown Coast | Varenna |
| The Montessa Hills | 500-640 x 430-470 | Low hills between the Glenmere and the Palella lowland | Varenna |
| The Crown Range | 740-1010 x 395-480 | The old east-west range of the middle: high valleys, silver, crossbowmen | Brannoch; its north face Gorath's and Ulun's, its south face Ostra's and Morhaven's |
| The Marble Mountains | 560-700 x 490-620 | Two snow knots and the brown ranges south of them, between the lowland and the Middle Sea | The crest divides Varenna from Solenne and from Sahrim |
| The Sunwall | 370-520 x 630-700 | The coast range of the south-west, the wall between the Lion Gulf and the desert | Qadir; its southern spur divides Qadir from Sabra |
| The Southern Hills | 600-730 x 690-730 | Red hills between the desert and the green south; the deep gold of Kabale | Zanara's northern edge, Sahrim's southern |
| The Worldspine | 1020-1110 x 590-700 | The rift's southern shoulder, north part: the highest ground of the south | Stonehold |
| The Highveld | 960-1110 x 700-820 | The lava dome the Monuti rises on: a high plateau with snow peaks | Abara |
| The Roof | 1180-1290 x 400-495 | A high plateau on the east coast, dry lakes between snow ridges | Skyhold |
| The Ember Mountains | 1245-1350 x 540-610 | The volcanic range of the eastern cape | Emberdeep |

Peaks named on the sketch: Mount Cinder (live, Ashmere), Mount Hael (the dead caldera in the Ashlands), Redcrown and
Smokewell (the rift's two fires, Velgrad's and Greyhaven's), Mount Dobava, Mount Bardun (above the First Hall), Mount
Roktar (the Crown Range).

### 3.3 Seas, gulfs and straits

The open sea has four names by its side of the land, and the named waters lie within them. The built areas are in
`design/tables.md`; a name reaches only so far from its place, and the oceans take the rest.

| Water | Kind | Where | Who is on it |
| --- | --- | --- | --- |
| The Western Ocean | ocean | West of the land | Corvasse, the Ashlands, Qadir's open coast, the Bone Coast |
| The Northern Ocean | ocean | North | Northreach, Frostholm, Hrimfell, the ice coast |
| The Southern Ocean | ocean | South | Zanara; Abara's short south coast; the Western Veld |
| The Sunrise Sea | ocean | East | Ughrak, Skyhold, Emberdeep; the Sunrise Isles |
| The Elder Sea | sea | Off the north-west, full of islands | Eldergrove |
| The North Fjords | bay | The bays the Calara runs into | Sylvaran, Eldergrove's Ithira |
| Amber Bay | bay | The outer bay at the mouth of the Cold Narrows | Northreach (Coldhaven), Aldmark's Copperton, Frostholm across it |
| The Cold Narrows | strait | 150 km long, 20 km wide, from Amber Bay to Cold Bay | Northreach the east bank, Aldmark the west |
| Cold Bay | bay | The round northern water, 45,700 km2 | Aldmark (Easterham, Eagleburg, the fens), Northreach's south shore |
| The Long Firth | bay | Ashmere's bay and the inlet at its head | Ashmere; Eldergrove's Nimion on the north side |
| The Strait of Hael | strait | Between the Ashlands' cape and the Corsair Isles, 20 to 40 km wide | Corvasse; the Ashlands |
| Tibata Bay | bay | Under the Ashlands; its mouth past Gull Isle is the Tibata Strait | Varenna (Tibata, Norona, Tarium) |
| The Lion Gulf | gulf | The bight from the Ashlands to the Bone Coast | Varenna (the Crown Coast), Qadir |
| The Gulf of Sands | gulf | The wide bay of the south-west | Sabra; Qadir's Ashah; the Bone Coast |
| Whale Sound | sound | The fjord bay of the north-east | Drevna (Dobin), Hrimfell (Torholm), the Whale Woods |
| The Eastern Gulf | gulf | Between the Ember cape and the south-east peninsula | Ranpur, Emberdeep, Kesh's east shore |
| The Amber Strait | strait | Between the peninsula and Great Amber | Kesh (Monuro), Ambrel (Amberport) |
| The Spice Sea | sea | South of the peninsula, full of isles | Kesh, Ambrel |

### 3.4 Inland seas and lakes

| Water | Area (km2) | What it is | Fed by | Drains to | Who is on it |
| --- | ---: | --- | --- | --- | --- |
| The Middle Sea | 30,900 | The last water of the old sea, two basins joined by the Narrows. Sweet at the Monuti's mouth, salt at its western end, where Solenne boils salt. It rises and falls with the Monuti's flood. Sea-going galleys sail it, and it counts as a coast | The Monuti, the Palena (the lower Skardush), the Mirona | Nowhere in a common year. In a great flood it spills east over the sill at Lucina into the Santora | Solenne, Lucerna, Ostra, Morhaven, Tamar, Sahrim |
| The Western Lakes | 47,900 | The great lake at the head of the rift, under the Frostfells, with a north-west and a north-east arm. Fresh, deep, frozen at the edges in winter | The upper Dromir and the snow of the Frostfells | South-west by the Dromir to the Salt Sea | Drevna; Velgrad's Dobina at the south-east corner |
| The Glenmere | 33,400 | A long lake in the trough north of the old range | The Clarora, the hills of the Evenwood's edge | North-east by the Glenwash to Cold Bay | Varenna (the Northern Lakes: Calena, Castella, Ardata); Gorath's Wolf clans on the north shore |
| The Grey Water | 21,100 | The crooked rift lake the Grey Channel runs into | The Grey Channel, the Santora, the Tirana | South-east by the Gullet to the Eastern Gulf | Tessaria; Ulun's Bekar at its head |
| Lake Silara | 19,200 | The Evenwood's lake | Forest streams | North by the Calara to the North Fjords | Sylvaran |
| The Salt Sea | 15,400 | The steppe's sea, with no outlet: salt, sturgeon, oil seeps on its shore. It counts as a coast | The Dromir (called the Coldbarrow on the steppe), the Goroth, the Gnarzag | Nowhere | Gorath (north and west), Ulun (south and east) |
| The Veld Lagoon | 12,100 | The lagoon of the south-west peninsula | | The sea, by a mouth under the map's grain | The Western Veld (wild) |
| The Iron Tarn | 4,800 | A mountain lake above the Deep Gate | | The Millrun | Gorath's Nagdur; Irondeep's water |
| The Amber Lagoon | 4,000 | The north coast lagoon behind the Amber Strand | | The sea | Aldmark (Copperton Tower's cog yard) |
| The Seal Lagoon | 3,900 | The lagoon of the Whale Woods | | The sea | The Whale Woods (wild) |
| The Reed Water | 3,600 | A widening of the Gullet below the Nagora road | The Gullet | The Gullet | Tessaria, Ranpur |
| The Crowmere | 3,500 | The lake in the gate between Mount Cinder and the Lion Hills | The upper Palella, the Whitewater | South by the Palella | Varenna; Ashmere's Crowbrook on its north shore |

Lakes the lore names that are under the map's grain keep their names as places: Lake Nubako (the flood lake where the
Hazir meets the Monuti), Lake Bluespire and the dry salt lakes of the Roof, Lake Ostec. They are not water on the grid.

### 3.5 The rivers, by basin

Each river is a line in `design/features.json` and, in kilometres, in `design/build.json`. Lengths are along the drawn
line. "Boats" says what can sail it. The picture's own rivers are followed wherever they are clear. Where the picture is
unclear the design decides, and says so below.

**To Cold Bay and the Northern Ocean**

| River | Length (km) | Course | Boats | What stands on it |
| --- | ---: | --- | --- | --- |
| The Glenwash | 740 | From the east end of the Glenmere north-east across the grass and the black-earth plain to Cold Bay at Easterham | Barges to Kingsmere and above | The Gashmar fords (Kagdush), Kingsmere, Easterham |
| The Fairrush | 510 | From under the Tusk Hills east to the Glenwash just above Kingsmere | Small boats | Yewmarch's toll, the royal chase |
| The Millrun | 430 | From the Iron Mountains west to the Glenwash just below Kingsmere | Barges from Brookcliff | Brookcliff, the horse meadows |
| The Gordush | 730 | From the Crown Range north-west to the Glenwash | Fords only | The border of 1052: Hazelhollow at Fenny Ford, Galemere Tower |
| The Stagflow | 380 | From the Pinewild's fells west to the Cold Narrows | Small boats | Saltbridge and its fords, Wolfhaven at the mouth |
| The Calara | 310 | Lake Silara's outlet north to the North Fjords | Elf boats | Rineron's sheds, Ithira at the mouth |

**To the Salt Sea (no outlet)**

| River | Length (km) | Course | Boats | What stands on it |
| --- | ---: | --- | --- | --- |
| The Dromir | 370 + 720 | Rises under the Lake Gate and runs west into the Western Lakes; leaves them at Drevna city and runs south-west to the Salt Sea. On the steppe, from the Coldbarrow Bridge down, the clans call it the Coldbarrow | Barges on the lakes and down to Polgrad | Lubany and Lubevo Kremlin, Drevna, Polgrad, Highwell, Silverdale, the Coldbarrow Bridge (Yagrak) |
| The Goroth | 360 | From the Iron Mountains east to the Salt Sea's north arm | None | The Goroth grass, Gorur |
| The Gnarzag | 220 | From the Crown Range to the Salt Sea's southern arm | None | The Gnarzag fields |

**To the Middle Sea (no outlet)**

| River | Length (km) | Course | Boats | What stands on it |
| --- | ---: | --- | --- | --- |
| The Monuti | 1,450 | Rises on the Highveld, falls by the Koyako Stair into the Long Rift, takes the Hazir at Lake Nubako, and runs north through the desert to its delta at the Middle Sea's east end. It floods in late summer when the monsoon breaks on the Highveld | Barges from the Flood Stairs at Talim to the sea | Koyako, Talim, Tamar, Akayn, Rashira |
| The Hazir | 560 | From the Southern Hills north-east through the sands to the Monuti | None | The Darai Bridge at Zahira; the watering place of 1062 |
| The Skardush (the Palena) | 740 | Rises at the Albora Pass and runs east along the trough, then south through the Skardush Gap to the Middle Sea. Below the Gap the Solenfolk call it the Palena | Barges below the Gap | Highwold in the Gap; Lucerna at its mouth |
| The Mirona | 330 | From the Marble Mountains east to the sea's western arm | None | The Mirona Pass, Mireria |

**To the Grey Water and the Eastern Gulf**

| River | Length (km) | Course | Boats | What stands on it |
| --- | ---: | --- | --- | --- |
| The Tolek | 230 | Rises at the Lake Portage, 100 km south of the Western Lakes, and runs east into the head of the channel | Barges from Wrendale | Kamogda Kremlin and the Tolek forts, Deepwatch, Wrendale |
| The Grey Channel | 840 | From the Tolek south down the rift floor to the Grey Water. Fed by the glaciers of the East Rift Heights, it is wide, deep and grey with rock flour, and in summer it rises every afternoon with the melt: the river folk call that the tide | Ships from Droin down | Droin, Greyhaven and Sevany facing each other at the Narrows, Vyova, Ozlun, the Erkent landings |
| The Yarbek | 360 | From the Salt Edge east to the channel just below the Narrows | Small boats | Wrenreach; the border of Greyhaven and Ulun |
| The Ostec | 410 | From the Mirovo Gap west to the channel | Barges below Velgrad | Velgrad, the Ostec March |
| The Santora | 910 | Rises on the sill east of the Monuti's delta, takes the Castina, and runs east across a wide empty plain to the Grey Water | Barges in spring | Lucina; the Santora March |
| The Castina | 330 | From the Crown Range south to the Santora | None | Castel Ascino, the Castina towers and iron workings |
| The Tirana | 430 | From the knot where the Roof meets the Ember Mountains west to the Grey Water. Its head streams carry gold | Ferries | The Madara bridge; the gold camps |
| The Gullet | 630 | The Grey Water's outlet south-east to the Eastern Gulf, through the Reed Water | Ships from the gulf to Tessar | Tessar's bridge at its head; Tiravi; its mouth north of Ranpur |
| The Chanpur | 410 | From the Worldspine east to the Eastern Gulf at Ranpur | Barges | Chanari, the Chanpur plain, Ranpur |
| The Madora | 280 | From the Highveld's eastern slope to the gulf | Barges | The river-mouth fort |

**To the Western Ocean**

| River | Length (km) | Course | Boats | What stands on it |
| --- | ---: | --- | --- | --- |
| The Palella | 1,310 | Rises on Mount Cinder's south-eastern slopes, passes Stagley and Crowbrook, runs through the Crowmere, south through the bright lowland, and west through the one gap in the coast hills to the Lion Gulf at Varenna | Barges from Varenna to Stagley | Stagley and Crowbrook (Ashmere); Camia and the weaving towns, Tarona's toll, Varenna |
| The Whitewater | 400 | From the Marble Mountains west to the Crowmere | None | Vitia's uplands |
| The Brightwash | 410 + 350 | Rises on the copper slopes of Mount Cinder, runs west along the massif's southern foot (the border, with its fords), then north through the Crown Vale to the Long Firth | Barges in the Crown Vale | The Brightwash mines, the fords, Ashmere city |
| The Bleak Water | 260 | From the Bleakfold to the Long Firth | None | |
| The Saman | 600 | From the Sunwall west to the Lion Gulf | None | Qarifa's mills, Qadira's gardens |
| The Bahesh | 400 | From the Sunwall south-west to the Gulf of Sands | None | Sarabad, Sabra |

**To the Southern Ocean and the Spice Sea**

| River | Length (km) | Course | Boats | What stands on it |
| --- | ---: | --- | --- | --- |
| The Mosawa | 450 | From the Highveld's western slope south-west to the sea | War canoes and grain barges below Jiwamo | Jiwamo, Tandi, the gold gravels |
| The Tedana | 390 | From the desert's edge to the Mosawa just above Tandi | Canoes | Owana; the Tedana gravels |
| The Lotapa | 390 | From the Southern Hills south to the sea | Canoes | Omamba, Anumba and its crossing |
| The Monundi | 320 | From the Highveld south-east to the Spice Sea | Canoes to the first falls | Tezenga, Zetu at the mouth |

**Where the picture left a choice**

- **The Glenmere's outlet.** The picture draws a river leaving its east end to the north-east and another leaving its
  south-east corner along the trough. A lake has one outlet. The design makes the north-eastern one the outlet (the
  Glenwash, which the lore brings to Cold Bay at Easterham) and puts a low divide, the Albora Pass, in the trough: west
  of it a brook runs into the lake, east of it the Skardush begins.
- **The Western Lakes' outlet.** The picture draws the river leaving the lake's south-west corner for the steppe lake,
  and draws the eastern river beginning 100 km south of the lake. The design follows it. The lake's water goes to the
  Salt Sea; the Grey Channel is fed by the East Rift Heights. Between the lake and the head of the Tolek lies a low ridge,
  **the Lake Portage**, where the Lakeland's cargo is carried on wheels. Three realms meet there, which is why Kamogda
  Kremlin, Deepwatch Castle and Tversk Fort stand where they do.
- **The Crowmere.** The picture joins the lowland's rivers in a lake at the gate under Mount Cinder and lets water leave
  both north-west and south. The design sends the lake south (the Palella, which the lore needs to flow from Ashmere down
  into Varenna) and makes the north-western river a separate one rising just beyond a low sill: the Brightwash.
- **The Santora.** The picture joins the Middle Sea's east end to the Grey Water by a river. The design makes the divide
  a sill at Lucina: the Santora rises there and runs east. The Monuti reaches the low ground right at that sill, so its
  flood can go either way: nearly all of it turns west into the Middle Sea, and in the greatest floods some runs east. This
  is the reason the height of the flood matters so much in Tamar.

### 3.6 Coasts and islands

- **The north-west (the Elder Coast)** is a drowned fjord coast: deep inlets, fir to the tide line, islands offshore
  (Elder Isle is the largest). Good harbours, little farmland: the sea-elves' longship country.
- **The north coast** is low from the Greenmire to Amber Bay (marsh, lagoon, amber beaches), then high and ice-bound from
  Northreach's Flintwall Capes east to Whale Sound. The sea freezes inshore in winter from Cold Bay eastward.
- **The west coast** is a wall: the Ashlands' lava, the Crown Coast under the Lion Hills, the Sunwall coast. It has three
  good gates: the Long Firth, Tibata Bay and the Palella's mouth. South of 33 degrees it is dry.
- **The south coast** is bays and capes with a coastal plain behind: the Gulf of Sands, the Western Veld's peninsula, the
  Golden Plains' shore, the rainforest cape of the Deep Green, the Spice Sea.
- **The east coast** runs from the Eastern Gulf (a low monsoon shore) round the Ember cape and under the Roof's cliffs to
  the long strand of the north-east plain (the Silk Strand) and the forest cape of the Whale Woods.
- **Islands.** The Corsair Isles (Corvasse and Ratrock) off the western cape. Frostholm off the Amber Capes. The Marsh
  Isles off the Greenmire. The Isle of Vines and its islets in the Middle Sea. Gull Isle at the mouth of Tibata Bay. Great
  Amber, the Isle of Pearls and the lesser isle in the south-east. The Teak Isles in the Eastern Gulf. The Sunrise Isles
  in three groups off the east coast: the stepping stones of the silk ships. `design/features.json` (`isles`) gives each
  named isle its province; every other islet belongs to the province nearest it.

### 3.7 Passes, gates, fords and portages

| Place | Between | What it is |
| --- | --- | --- |
| The Albora Pass | The Glenmere and the Skardush | A low divide in the trough, shut by snow from November. The Amber Road from Cold Bay ends at its three towers and Varenna's Crown Road begins. Ardata watches it |
| The Skardush Gap | The Marble Mountains and the Crown Range | The corridor the Palena runs down: the northern plains' one easy gate to the Middle Sea. Highwold holds it for Brannoch |
| The Horse Gate | The Crown Range's east end and the Grey Water | A gap 200 km wide where the steppe meets the Sunlands. The Horse Road comes through it; Sartobe Yam and Castel Ascino face each other across it |
| The Mirona Pass | The two knots of the Marble Mountains | The Coast Road from Varenna to Solenne |
| The Montessa Gate | The Montessa Hills | Between the Northern Lakes and the Palella lowland |
| The Hawkmarch Pass | The Ash Range's northern shoulder | Ashmere to the Evenwood: the yew smugglers' road |
| The Sabun Pass | The Sunwall | Where Qadir, Sabra and the Red Waste meet: the Gold Road. Fort Tabir holds it |
| The Deep Gate | The Iron Mountains | Irondeep's gate, facing Cold Bay |
| The Lake Gate | The Lakeland and Whale Sound | Low rock country through the Frostfells: the Whale Road and the northern silk road. Dobnik Fort holds it |
| The Lake Portage | The Western Lakes and the Tolek | 100 km on wheels between lake water and channel water |
| The Mirovo Gap | The East Rift Heights and the Roof | The gate between Velgrad's uplands and the eastern steppe: the Silk Road. The Kraoth toll camp stands at its east end |
| The Zardeep Pass | The Worldspine | From the Neck to the Monuti over Stonehold's ground; Stonehold takes one part in ten |
| The Nagora Pass | The Worldspine's northern shoulder | Ranpur's road north to the Gullet crossing, taken from Stonehold in 1085 |
| The Koyako Stair | The Highveld's western scarp | The way down from Abara to the Monuti |
| The White Stair | The Roof | Skyhold's own stair |
| The Tharmund Gate | The Ember Mountains | Emberdeep's gate to the gulf |
| The fords of the Gordush | Aldmark and Gorath | Fenny Ford (Hazelhollow), the Galemere ford |
| The Gashmar fords | The Glenwash | Where the Wolf clans cross (Kagdush) |
| The Brightwash fords | Ashmere and Varenna | Under the massif's southern foot |
| The Stagflow fords | Northreach and Aldmark | Where Eirik III ambushed the army of the empire |
| Tessar's bridge | The Gullet's head | The only crossing between the Grey Water and the gulf |
| The Coldbarrow Bridge | The lower Dromir | Where Gorath's, Ulun's and Greyhaven's ground meets |
| The Narrows of the channel | The Grey Channel at Greyhaven | 2 km of water between the Toll-House and Sevany's chain towers |
| The Cold Narrows | Amber Bay and Cold Bay | The empire's only way to the ocean from its own port |
| The Strait of Hael | The western cape and the Corsair Isles | The gate between the north-western seas and the Lion Gulf |
| The Amber Strait | The peninsula and Great Amber | The short way between the Spice Sea and the Eastern Gulf |

### 3.8 Winds, rain and the ground

**The bands.** With the frame from 65 to 11 degrees north, the continent takes the winds of a northern land that
reaches from the edge of the tropics almost to the ice.

| Band | Latitude | Wind | What it does here |
| --- | --- | --- | --- |
| Polar edge | North of 58 | Cold easterlies off the ice | The Frostfells and the White Coast: ice, tundra, a frozen winter sea |
| Westerlies | 38 to 58 | Wet winds from the Western Ocean | Rain on everything they reach first: the Elder Coast, the Evenwood, Ashmere, the Lakeland's snow. Less with every range they cross |
| Dry belt | 25 to 38 | Sinking dry air; a cold current up the west coast | The dry Sunwall coast and the Bone Coast; the Red Waste |
| Trades and monsoon | South of 25 | North-east trades in winter; in summer wet wind off the Southern Ocean and the Eastern Gulf | Summer rain on the Golden Plains, the Highveld and the Monsoon Coast; rain all year on the south-east peninsula and the spice isles |

**Why each ground is where the picture paints it**

- **The Evenwood and the Elder Coast are forest** because the westerlies reach them first and nothing stands in the way.
- **Aldmark is black-earth plain** because it lies behind the Evenwood's low hills at 47 to 54 degrees: rain enough for
  wheat, cold winters, deep soil. Cold Bay softens its northern half.
- **The Grass Sea and the Salt Steppe are grass** because they lie in the middle of the land, in the lee of the Ash Range,
  the Tusk Hills and Aldmark's long plain, with the Crown Range shutting out the south. It gets drier eastward, so
  Gorath's western grass is tall and Ulun's is short, and the Salt Sea has no outlet.
- **The Lakeland is wood and the Frostfells are white** because the last of the westerlies' water is wrung out as snow on
  the highest range. The melt fills the Western Lakes.
- **The Grey Channel runs full through dry country** because it is fed by ice, not by rain.
- **The eastern plain (Ughrak) is cold grass** because the East Rift Heights take the western rain and the plain lies open
  to the Sunrise Sea's winter winds: long hard winters, a short wet summer, grass and larch. The picture paints it green;
  the design sets it steppe (choice 20).
- **The Sunlands round the Middle Sea have wet winters and dry summers** (olives, vines, wheat) because the westerlies
  reach them only in winter, through the Skardush Gap and over the Marble passes. Varenna's lowland, open to the ocean,
  is the greenest of them.
- **The Red Waste is desert** three times over: it lies in the dry belt; the Marble Mountains and the Sunwall keep the
  ocean's rain from it; the Worldspine and the Highveld keep the monsoon from it. The Crown Range shuts the north.
- **The Sunwall coast is dry** though it is on the sea, because the wind there blows along the shore over cold water.
  Its people live by terraces, dates and wells. The picture paints it dark; the design sets it scrub.
- **The Golden Plains are savanna** because the summer monsoon reaches them and the winter is dry: tall grass, cattle,
  gallery woods on the rivers, rainforest only on the wettest capes.
- **The Highveld is green and high**, and the summer monsoon breaks on it. That water is the Monuti's flood.
- **The Monsoon Coast, Kesh and the spice isles are wet** from the Eastern Gulf and the Spice Sea: rice, cotton, sugar and
  teak in Ranpur; pepper and hardwood in Kesh; clove and nutmeg in Ambrel.
- **The Roof is cold and dry** because it is high and the Ember cape and its own rim take the rain: salt lakes, yaks.

**The ground on the grid.** `design/ground.png` gives every cell one of twelve grounds, read from the picture's colour,
the height guide and the latitude, and then set by the design where the paint cannot tell (`groundSet` in
`design/features.json`, each with its reason: the Grass Sea, the Salt Steppe and the eastern steppe; the Evenwood, the
Elder Coast, the Lakeland woods, the Rift oakwood, the Free Marches and the named woods of the wilds; the dry Sunwall
coast; the Golden Plains' savanna; the Long Rift's flood plain; the marshes of the Greenmire, Cold Bay and the Monuti's
delta; Mount Cinder's and Mount Hael's ash; the spice isles). Each province's ground word (the engine's `terr`) is read
from its settled core, the cells within 50 km of its seat: a river town in a desert province is a plains town, an oasis
is desert. Of the 306: 93 forest, 89 plains, 50 hills, 25 mountains, 22 steppe, 19 desert, 5 marsh, 3 tundra.

### 3.9 What the ground yields

The lore's exports sit where this geology puts them. Nothing here is new; it is the check that the map can carry the
lore's trade.

| Goods | Where | Why there |
| --- | --- | --- |
| Iron | The Iron Mountains (Irondeep); the Rift Heights (Greyhaven); the Castina hills (Morhaven); the Free Marches | Old rock; rift shoulders |
| Copper, sulfur, obsidian | Mount Cinder (Ashmere); the Sunwall (Qadir); old Hael; Redcrown and Smokewell (sulfur) | The west coast's fire; the rift's vents |
| Silver, marble | The Crown Range (Brannoch); the Marble Mountains (Varenna, Solenne) | The old worn range |
| Gold | The Southern Hills (Kabale); the Mosawa and Tedana gravels; the Highveld's streams; the Tirana's head; Stonehold | Old greenstone; rivers off the rift's shoulders |
| Tin | Frostholm | Granite |
| Salt, natron, borax | Zarak's flats and the Long Rift (the old sea's bed); the Salt Sea's edge; the Roof's dry lakes; Solenne's pans | Dried seas and lakes with no outlet |
| Fire-oil | Sabra's Oil Shore; the Salt Sea's shore (Ulun) | Seeps at the edge of the old sea's basin and the trough |
| Amber | The Amber Strand and Amber Bay | Old forest beds on a low northern shore |
| Ship timber | The Elder Coast (fir, yew); the Rift oakwood (Greyhaven); the teak coast (Ranpur); the Free Marches; the cedar hills of Feleria | Wet coasts and wooded rift shoulders |
| Grain | Aldmark's black earth; Varenna's lowland; the Long Rift (Tamar); the Lakeland's rye; Ranpur's rice | Plains with rain or flood |
| Horses | The Millrun meadows; the Grass Sea; the Salt Steppe; the Santora March; the eastern steppe | Grass |
| Spices | Kesh (pepper), Ambrel (clove, nutmeg), Ranpur (pepper, sugar) | Rain all year, south of 22 degrees |
| Whale oil, ivory, stockfish | Whale Sound, the White Coast, Northreach, Frostholm | Cold seas |
| Pearls | The Gulf of Sands (Sabra); the Isle of Pearls | Warm shallow bays |
| Murex purple | Ostra | A sea snail left in the Middle Sea from the old sea, found only on its north-east shore |

## 4. The realms

### 4.0 The rules, and how the map keeps them

- **No realm lies inside another.** The tool fails if a realm has no sea coast and only one neighbour. None does. The
  smallest inland realms each touch three or more others: Lucerna (Solenne, Ostra, Brannoch, and the Middle Sea),
  Irondeep (Aldmark, Gorath, the Mammoth Downs), Brannoch (six neighbours), Tamar (Sahrim on three sides, but Morhaven,
  Tessaria and the Middle Sea on the fourth).
- **Each realm is one piece.** The tool fails if a realm's land on one landmass is in two parts. None is. Three realms are
  islands (Frostholm, Corvasse, Ambrel) and one holds an offshore isle as a province (Sylvaran's Marsh Isles); these are
  joined to the shore by the sea links in `design/build.json` (`ferries`).
- **Borders follow the ground.** Provinces are grown outward from their seats over the picture's ground; crossing high
  ground, a border river or a line the design draws costs more, so borders settle on ridges, rivers and the edges of
  basins. `design/tables.md` lists every border with its length and what it runs along.
- **Province counts are the lore's.** Every realm keeps the provinces `LORE.map` gives it, by name: 281 in 34 realms and 25
  wild. Only their places change.
- **A capital is a province.** Three capitals are not province names in `LORE.map`. The design says which province holds
  each, and the engine's own rule (the province of type "capital city", else the most populous) picks the same one:
  Wolfhaven stands in Saltbridge, Lucerna in Lavium, Qadira in Hazifa.
- **Sizes follow the ground.** A desert or steppe province is large and a farmed or forest one small. The land is 55% of
  the release's, so every realm's area in the lore changes (section 7).

| # | Realm | Kind | Provinces | Area (km2) | Capital | Ground of its provinces | Waters | Land neighbours |
| ---: | --- | --- | ---: | ---: | --- | --- | --- | --- |
| 1 | Sahrim | nomad confederation | 22 | 1,162,000 | Zarak | desert 16, plains 5, hills 1 | the Middle Sea | Abara, Qadir, Sabra, Solenne, Stonehold, Tamar, Tessaria, the Burning Waste, the Mirun Pines, Varenna, Zanara |
| 2 | Varenna | kingdom | 21 | 1,129,400 | Varenna | plains 11, forest 6, hills 4 | Tibata Bay, the Crowmere, the Glenmere, the Lion Gulf | Ashmere, Gorath, Qadir, Sahrim, Solenne, the Ashlands, the Firststone Hills |
| 3 | Gorath | orc horde | 11 | 753,900 | Urgol | steppe 9, forest 1, plains 1 | the Glenmere, the Iron Tarn, the Salt Sea | Aldmark, Brannoch, Drevna, Irondeep, Solenne, Sylvaran, the Firststone Hills, the Mammoth Downs, Ulun, Varenna |
| 4 | Zanara | empire | 22 | 714,800 | Zanara | plains 12, forest 8, hills 2 | the Southern Ocean | Abara, Sabra, Sahrim, the Mirun Pines, the Samuma Uplands |
| 5 | Aldmark | empire | 20 | 578,000 | Kingsmere | plains 11, forest 6, marsh 2, hills 1 | Amber Bay, Cold Bay, the Amber Lagoon, the Cold Narrows, the Northern Ocean | Gorath, Irondeep, Northreach, Sylvaran, the Mammoth Downs |
| 6 | Drevna | kingdom | 13 | 555,700 | Drevna | forest 7, mountains 4, plains 1, hills 1 | Whale Sound, the Northern Ocean, the Western Lakes | Gorath, Greyhaven, Hrimfell, the Frostfells, the Mammoth Downs, the Whale Woods, Ughrak, Ulun, Velgrad |
| 7 | Abara | kingdom | 14 | 483,500 | Abara | hills 8, plains 3, forest 3 | the Southern Ocean | Kesh, Ranpur, Sahrim, Stonehold, the Burning Waste, the Deep Green, the Thornveld, Zanara |
| 8 | Ulun | nomad confederation | 8 | 461,600 | Kharsa | steppe 8 | the Grey Water, the Salt Sea | Brannoch, Drevna, Gorath, Greyhaven, Morhaven, Tessaria, the Lunora Woods, Velgrad |
| 9 | Velgrad | kingdom | 14 | 459,500 | Velgrad | forest 7, plains 6, mountains 1 | the Western Lakes | Drevna, Greyhaven, Skyhold, Tessaria, the Dobava Wilds, the Stairwood, Ughrak, Ulun |
| 10 | Ughrak | orc clans | 6 | 445,900 | Grakmar | steppe 5, forest 1 | the Sunrise Sea | Drevna, Skyhold, the High Wastes, the Stairwood, the Tverko Woods, the Whale Woods, Velgrad |
| 11 | Sylvaran | elven realm | 22 | 396,000 | Evenglade | forest 14, mountains 3, marsh 2, plains 2, hills 1 | Lake Silara, the North Fjords, the Northern Ocean | Aldmark, Ashmere, Eldergrove, Gorath, the Bleakfold, the Firststone Hills |
| 12 | Tessaria | collapsing kingdom | 3 | 326,000 | Tessar | plains 3 | the Grey Water, the Reed Water | Morhaven, Ranpur, Sahrim, Skyhold, Stonehold, Tamar, the Dobava Wilds, the Free Marches, the Lunora Woods, Ulun, Velgrad |
| 13 | Ashmere | kingdom | 9 | 307,300 | Ashmere | hills 7, forest 1, plains 1 | the Long Firth, the Western Ocean | Sylvaran, the Ashlands, the Bleakfold, the Firststone Hills, Varenna |
| 14 | Morhaven | kingdom | 3 | 285,500 | Morhaven | plains 2, forest 1 | the Middle Sea | Brannoch, Ostra, Tamar, Tessaria, the Lunora Woods, Ulun |
| 15 | Ranpur | kingdom | 5 | 266,600 | Ranpur | plains 2, forest 2, hills 1 | the Eastern Gulf, the Reed Water | Abara, Emberdeep, Kesh, Stonehold, Tessaria, the Free Marches |
| 16 | Tamar | kingdom | 6 | 252,600 | Tamar | plains 3, desert 2, marsh 1 | the Middle Sea | Morhaven, Sahrim, Tessaria |
| 17 | Hrimfell | giant territory | 4 | 252,100 | Jotunhall | mountains 3, hills 1 | Whale Sound, the Northern Ocean | Drevna, the Frostfells |
| 18 | Solenne | theocracy | 5 | 244,500 | Solenne | plains 4, mountains 1 | the Middle Sea | Brannoch, Gorath, Lucerna, Sahrim, Varenna |
| 19 | Eldergrove | elven realm | 7 | 234,400 | Silverbough | forest 7 | the Elder Sea, the Long Firth, the Northern Ocean, the Western Ocean | Sylvaran, the Bleakfold, the Western Highlands |
| 20 | Northreach | kingdom | 3 | 230,900 | Wolfhaven (in Saltbridge) | forest 2, tundra 1 | Amber Bay, Cold Bay, the Cold Narrows, the Northern Ocean | Aldmark, the Mammoth Downs, the Pinewild, the Trolness Fells |
| 21 | Qadir | sultanate | 8 | 226,700 | Qadira (in Hazifa) | plains 6, hills 2 | the Gulf of Sands, the Lion Gulf, the Western Ocean | Sabra, Sahrim, the Bone Coast, Varenna |
| 22 | Emberdeep | dwarven hold | 3 | 211,000 | Emberdeep | hills 3 | the Eastern Gulf, the Sunrise Sea | Ranpur, Skyhold, the Free Marches |
| 23 | Skyhold | theocracy | 8 | 208,900 | Skyhold | hills 8 | the Sunrise Sea | Emberdeep, Tessaria, the Dobava Wilds, the Free Marches, the High Wastes, the Stairwood, Ughrak, Velgrad |
| 24 | Sabra | emirate | 8 | 204,700 | Sabra | plains 7, hills 1 | the Gulf of Sands, the Southern Ocean | Qadir, Sahrim, the Mirun Pines, the Samuma Uplands, Zanara |
| 25 | Kesh | city league | 5 | 200,700 | Kesh | forest 2, plains 2, mountains 1 | the Amber Strait, the Eastern Gulf, the Spice Sea | Abara, Ranpur, the Thornveld |
| 26 | Stonehold | dwarven hold | 6 | 185,300 | Stonehold | mountains 3, hills 3 | none | Abara, Ranpur, Sahrim, Tessaria, the Burning Waste |
| 27 | Brannoch | mountain confederation | 4 | 141,300 | Highcastle | mountains 3, hills 1 | none | Gorath, Lucerna, Morhaven, Ostra, Solenne, Ulun |
| 28 | Greyhaven | kingdom | 8 | 108,400 | Greyhaven | forest 8 | none | Drevna, Ulun, Velgrad |
| 29 | Ambrel | sultanate | 3 | 81,300 | Amberport | forest 3 | the Amber Strait, the Eastern Gulf, the Spice Sea, the Sunrise Sea | the Amber Wilds |
| 30 | Ostra | city-state | 4 | 55,500 | Ostra | plains 2, mountains 1, hills 1 | the Middle Sea | Brannoch, Lucerna, Morhaven |
| 31 | Irondeep | dwarven hold | 1 | 29,000 | Irondeep | mountains 1 | none | Aldmark, Gorath, the Mammoth Downs |
| 32 | Lucerna | merchant republic | 1 | 27,200 | Lucerna (in Lavium) | plains 1 | the Middle Sea | Brannoch, Ostra, Solenne |
| 33 | Frostholm | giant territory | 2 | 25,000 | Skarfell | tundra 2 | the Northern Ocean | none: islands |
| 34 | Corvasse | pirate haven | 2 | 19,300 | Corvasse | plains 2 | the Strait of Hael, the Western Ocean | none: islands |

The realms hold 11,264,500 km2 and the wilds 1,399,700 km2 of the land's 12,664,200 km2. Greyhaven, Brannoch, Irondeep and Stonehold touch no named water on the grid: Greyhaven's water is the Grey Channel, a river.

In the entries below, each realm has its land, the ground the lore asks of it, its capital and chief towns with the
reason each stands where it does, and each border with what it follows and what set it. The reason for every one of the
306 seats is in `design/seats.tsv` and `design/tables.md`.

### 4.1 Aldmark

*Empire. 20 provinces, 578,000 km2 (4.6% of the land; number 5 of 34 by size). Capital: Kingsmere.*

- **Land.** The northern plain between the Evenwood and the Iron Mountains, from the north coast and Cold Bay south to
  the Gordush. It is the widest stretch of deep soil on the continent, drained to Cold Bay by the Glenwash and its three
  tributaries.
- **Ground.** Black-earth plain, as the lore says; oak shires along the Evenwood's edge; fen where the Glenwash meets
  Cold Bay.
- **Capital and towns.** *Kingsmere* stands just below the meeting of the Fairrush and the Glenwash, at the head of barge
  water from Cold Bay and in the middle of the plain. The Millrun joins a little way downstream. *Easterham* is the
  Glenwash's mouth and the squadron's port. *Eagleburg*, on Cold Bay's south-east shore, is where the Iron Road reaches
  water. *Copperham* is the Southern March's seat behind the Gordush. *Thornstone*, *Galemere Tower* and *Hazelhollow*
  are the Crown Wall's forts at the three ways across the southern border. *Larkton Tower*, *Northmoor* and *Foxhurst*
  watch the Oak Line. *Copperton Tower* and *Amberwick* hold the amber coast.
- **Borders.** *Sylvaran:* the Oak Line, the Evenwood's edge from the North Fjords to the Tusk Hills, marked with stones;
  cold peace since the blood-price of 1080. *Gorath:* from the Tusk Hills' east end along the western Crown Wall to the
  Glenwash, up the Gordush to Fenny Ford, then north along the Millrun's watershed to the Iron Mountains; set by the
  Peace of the Glenwash (1052), "a border on the Glenwash's tributary Gordush". *Irondeep:* the foot of the Iron
  Mountains. *Northreach:* the Cold Narrows, and north of Cold Bay the watershed south of the Stagflow; the tense peace of
  Coldhaven (1093). *The Mammoth Downs:* the wooded downs beyond the Crossmarch, which the empire has never settled.
- **Provinces.** Kingsmere (capital; plains), Carrness (forest), Eagleburg (hills), Frosthollow Castle (forest), Brookcliff (forest), Easterham (marsh), Copperham (plains), Larkton Tower (forest), Copperton Tower (plains), Thornstone (plains), Yewmarch (plains), Silverhollow (plains), Foxhurst (forest), Crossmarch (plains), Northmoor (plains), Amberwick (plains), Galemere Tower (plains), Goldburg (forest), Briarbrook (marsh), Hazelhollow (plains).

### 4.2 Solenne

*Theocracy. 5 provinces, 244,500 km2 (1.9% of the land; number 18 of 34 by size). Capital: Solenne.*

- **Land.** The north-west shore of the Middle Sea and the hill country behind it, up to the Skardush in the north and
  the crest of the Marble Mountains in the west.
- **Ground.** Olive and vine hills over a warm shore; salt at the sea's western end.
- **Capital and towns.** *Solenne* stands at the north-west corner of the Middle Sea, where the Coast Road comes down
  from the Mirona Pass to the water: the first good harbour a traveller from the west reaches, and the reason the old
  sun-city grew there. Its bay is the Bay of Lanterns. *Lorina* is the squadron's castle harbour. *Mireria* holds the
  pass road on the Mirona. *Brunentia* is the hill market on the road north to the Skardush Gap. *Venella* boils salt
  where the sea is saltest, at its south-west corner.
- **Borders.** *Varenna:* the crest of the Marble Mountains; the Mirona Pass is the gate. An old line between allies.
  *Sahrim:* the foot of the Marble Mountains' southern knot, where the sown land ends. *Gorath:* the Skardush, in the
  trough. *Brannoch:* the Palena in the Skardush Gap; the League holds the east side and never paid the Holy See's
  tribute for it. *Lucerna:* the last ridge west of the Palena's mouth.
- **Provinces.** Solenne (capital; plains), Lorina (plains), Mireria (plains), Brunentia (plains), Venella (mountains).

### 4.3 Varenna

*Kingdom. 21 provinces, 1,129,400 km2 (8.9% of the land; number 2 of 34 by size). Capital: Varenna.*

- **Land.** The whole south-west between the ocean and the Marble Mountains: the Crown Coast on the Lion Gulf, the
  bright Palella lowland behind the coast hills, the Montessa Hills, and beyond them the Northern Lakes on the Glenmere's
  south shore. The largest realm by people, and by land second only to the desert.
- **Ground.** Wheat, olive and vine lowland; wooded coast hills; marble in the east.
- **Capital and towns.** *Varenna* stands at the Palella's mouth on the Lion Gulf. The coast hills wall the lowland from
  the sea for 600 km, and the Palella cuts the one gap through them: every bale of the weaving towns comes down to this
  one harbour. *Camia* and the weaving towns are on the middle Palella, where the river is steady enough for mills.
  *Tarona* takes the toll in the gap. *Tibata* is the harbour at the mouth of Tibata Bay, with its tower on the strait,
  the port nearest the Strait of Hael and the one the corsairs burn. *Vitia* is the citadel of the uplands on the Crown
  Road. *Castella* is the chief town of the Northern Lakes; *Ardata* is the march town at the Glenmere's east end, under
  the Albora Pass.
- **Borders.** *Ashmere:* the Brightwash along the massif's southern foot, the Crowmere, and the gate of the upper
  Palella at Crowbrook; rivals since 1016, and the Palella is the road an army would take. *The Ashlands:* the neck of
  the western peninsula; nobody builds on Hael's ash, though Varennan surveyors have begun to map it. *Qadir:* a spur of
  the Sunwall that reaches the coast south of Aurora. *Sahrim:* the crest of the Marble Mountains' southern ranges.
  *Solenne:* the Marble crest. *Gorath:* the Albora Pass and the Glenmere itself: the Wolf clans hold the lake's north
  shore. *The Firststone Hills:* the ash plain at the Glenmere's west end.
- **Provinces.** Varenna (capital; forest), Ardata (plains), Camia (plains), Vitina (plains), Castella (plains), Torossa (plains), Norona (forest), Casteria (hills), Calena (hills), Pertello (plains), Tibata (forest), Tarona (plains), Aurora (plains), Ambalia (forest), Taria (forest), Valia (plains), Lunium (plains), Tarium (forest), Rocca Pavice (plains), Vitia (hills), Venina (hills).

### 4.4 Lucerna

*Merchant republic. 1 province, 27,200 km2 (0.2% of the land; number 32 of 34 by size). Capital: Lucerna, in the province of Lavium.*

- **Land.** The lagoon at the Palena's mouth on the Middle Sea's north shore, the islets off it, and a strip of mainland
  farms up the river.
- **Ground.** Lagoon, market gardens, vines.
- **Capital.** *Lucerna* (in the province of Lavium) stands in the lagoon where the Palena meets the sea. It is the
  middle of the sea's north shore, a day's sail from the Monuti's delta, and the foot of the one road north through the
  Skardush Gap: the place where Tamar's grain changes from ship to barge and cart. A city on water needs no wall.
- **Borders.** *Solenne:* the ridge west of the Palena's mouth. *Ostra:* the headland at the Narrows. *Brannoch:* the
  foot of the Skardush Gap. It is the smallest realm on the mainland and it is not enclosed: three neighbours and the sea.
- **Provinces.** Lavium (capital; plains).

### 4.5 Ashmere

*Kingdom. 9 provinces, 307,300 km2 (2.4% of the land; number 13 of 34 by size). Capital: Ashmere.*

- **Land.** Mount Cinder's massif and the land round it: the Crown Vale on its west side, where the Brightwash runs north
  to the Long Firth; the coast hills between the vale and the sea; the Stag Downs to the south; the upper Palella to the
  south-east.
- **Ground.** Ash soil on lava hills. The lore's "western kingdom of ash soil" is exactly this.
- **Capital and towns.** *Ashmere* stands in the Crown Vale under the volcano's western slope, on the Brightwash: the
  one long valley of deep ash soil, sheltered from the mountain's fire by the river and open to the sea at the firth.
  *Brightkeep* and the *Sun Temple of Aldminster* hold the coast hills and the sea cliff. *Ashwell Tower* stands over the
  Brightwash copper mines. *Stagley* is the walled town on the upper Palella, facing Varenna; Crowbrook is in its
  province. *Heroncliff* is under the Hawkmarch Pass.
- **Borders.** *Varenna:* the Brightwash, the Crowmere and the Crowbrook gate (above). *Sylvaran:* the heights north of
  the massif; the Hawkmarch Pass is the smugglers' road for yew. *The Bleakfold:* the Long Firth and the Bleak Water.
  *The Ashlands:* the ridge at the neck of the peninsula. *The Firststone Hills:* the massif's eastern foot.
- **Provinces.** Ashmere (capital; hills), Chasethwaite Tower (hills), Stagley (forest), Ashwell Tower (hills), Brightkeep (hills), Alderwick (hills), Heroncliff (hills), Sun Temple of Aldminster (plains), Saltmoor (hills).

### 4.6 Sylvaran

*Elven realm. 22 provinces, 396,000 km2 (3.1% of the land; number 11 of 34 by size). Capital: Evenglade.*

- **Land.** The Evenwood: the forest round Lake Silara, from the North Fjords south to the Tusk Hills and the heights
  above Ashmere.
- **Ground.** Old oak and yew forest, marsh on the north shore (the Greenmire). It is no longer the second-largest land
  in the world: the picture's forest is 396,000 km2.
- **Capital and towns.** *Evenglade*, where the First Oak grows, stands between the lake and the northern bays in the
  heart of the wood, as far from every border as the forest allows. *Mirlas* is the fishers' city on Lake Silara.
  *Rineron* has the boat sheds on the Calara. *Erilas* is the rangers' yard on the Eastern Edge. *Fenali* watches the
  southern Oak Line. *Silande* is the Marsh Isles.
- **Borders.** *Aldmark:* the Oak Line. *Eldergrove:* the Calara from the lake to the sea, and south of the lake the
  watershed of the coast ridges; cool since the Sea Covenant of 340, when the sea-elves took to cutting ship timber.
  *Gorath:* the crest of the Tusk Hills, "an old border", and the edge of the pale plain below it. *Ashmere:* the heights
  north of Mount Cinder. *The Bleakfold* and *the Firststone Hills:* bare ground the wood does not cover.
- **Provinces.** Evenglade (capital; forest), Fenali (forest), Falessa (marsh), Loriel (forest), Eridor (forest), Vaelion (forest), Fenarin (marsh), Calandor (forest), Lirith (forest), Aravel (plains), Thalandor (forest), Lirthil (mountains), Aressa (forest), Silande (plains), Aerion (forest), Rinthil (forest), Rineron (hills), Syleron (forest), Mirlas (forest), Elwen (forest), Eriavel (mountains), Erilas (mountains).

### 4.7 Eldergrove

*Elven realm. 7 provinces, 234,400 km2 (1.9% of the land; number 19 of 34 by size). Capital: Silverbough.*

- **Land.** The Elder Coast: the fjord coast of the north-west and its islands, from the Calara's mouth round the far
  western cape to the Long Firth.
- **Ground.** Fir and yew to the tide line.
- **Capital and towns.** *Silverbough* stands in the most sheltered bay of the coast, on its south side, where the Elder
  run to the Strait of Hael begins. *Ithira* is the harbour city by the Calara's mouth, the door to the Evenwood's
  trade. *Nimion* has the ship-houses of the West Strand. *Falavel* is the Yew Ridges, where Ashmere's bow staves grow.
- **Borders.** *Sylvaran:* the Calara and the coast ridges' watershed. *The Western Highlands* and *the Bleakfold:* the
  bare heights between the Elder Coast and Ashmere; the friendship of 1012 with Ashmere runs by sea across the Long Firth.
- **Provinces.** Silverbough (capital; forest), Ithira (forest), Mirandor (forest), Falavel (forest), Fenandor (forest), Aerdor (forest), Nimion (forest).

### 4.8 Northreach

*Kingdom. 3 provinces, 230,900 km2 (1.8% of the land; number 20 of 34 by size). Capital: Wolfhaven, in the province of Saltbridge.*

- **Land.** The forest land east of the Cold Narrows: Amber Bay's east shore, the east bank of the Narrows, the north
  shore of Cold Bay, and the ice-bound north coast under the fells.
- **Ground.** Fog, forest and ice, as the lore says: pine forest, a snow ridge along the coast.
- **Capital and towns.** *Wolfhaven* (in the province of Saltbridge) stands where the Stagflow meets the Cold Narrows.
  Whoever holds it holds the empire's only way from Easterham to the ocean, and that is how a small kingdom beat an
  empire. *Saltbridge* is the bridge town a day up the Stagflow, on the only road in from Aldmark; the fords above it are
  where Eirik III ambushed the army of the empire. *Coldhaven* is the Amber Capes at the mouth of the Narrows.
  *Flintwall Tower* watches the north coast.
- **Borders.** *Aldmark:* the Cold Narrows on the west; on the south the watershed between the Stagflow and Cold Bay's
  north shore (Coldhaven, 1093). In winter Cold Bay freezes, and the border is ice: Eirik III crossed it to burn the
  empire's grain. *The Mammoth Downs, the Pinewild, the Trolness Fells:* the fells no one holds.
- **A change from the release.** Northreach is in one piece east of the Narrows. The release's words that put Saltbridge
  west of Aldmark's coast go.
- **Provinces.** Saltbridge (capital; forest), Coldhaven (forest), Flintwall Tower (tundra).

### 4.9 Frostholm

*Giant territory. 2 provinces, 25,000 km2 (0.2% of the land; number 33 of 34 by size). Capital: Skarfell.*

- **Land.** One island off the Amber Capes, 250 km long, in the Northern Ocean.
- **Ground.** Tundra and heath on granite; tin in the streams.
- **Capital and towns.** *Skarfell*, the chieftain's hall and the tin fair, stands on the lee shore facing the mainland,
  where the tin boats load. *Helstad* is the western shore.
- **Borders.** The sea. The Tin Run crosses to Wolfhaven and Coldhaven (the Tin Compact, 1002).
- **Provinces.** Skarfell (capital; tundra), Helstad (tundra).

### 4.10 Irondeep

*Dwarven hold. 1 province, 29,000 km2 (0.2% of the land; number 31 of 34 by size). Capital: Irondeep.*

- **Land.** The Iron Mountains.
- **Ground.** Bare brown mountain. "The dwarven hold beside Aldmark's plains."
- **Capital.** *Irondeep*: the Deep Gate opens on the range's west face toward Cold Bay, where the Iron Road begins.
- **Borders.** *Aldmark:* the mountains' western foot; the hold has depended on the empire's grain since 951. *Gorath:*
  the eastern foot, above Nagdur Stockade. *The Mammoth Downs:* the forest north of the range.
- **Provinces.** Irondeep (capital; mountains).

### 4.11 Gorath

*Orc horde. 11 provinces, 753,900 km2 (6.0% of the land; number 3 of 34 by size). Capital: Urgol.*

- **Land.** The Grass Sea: a belt of grass 1,900 km long and 300 to 400 km deep, between the northern plains and the
  Crown Range, from the Tusk Hills in the west to the Salt Sea in the east. Steppes are belts, and this is one.
- **Ground.** Tall grass in the west, shorter eastward; salt on the Salt Sea's edge. The lore's "orc clans of the
  southern grass" are south of Aldmark, which is where the name was given.
- **Capital and towns.** *Urgol*, the hearth herd's winter ground, lies in the sheltered grass west of the Salt Sea,
  between the Goroth and the Gordush's head: central to the eastern clans, well back from the Crown Wall. *Kagdush* is
  the Gashmar fords on the Glenwash. *Ughdur Ring* is the Wolf clans' ring-fort on the pale plain under the Tusk Hills.
  *Nagdur Stockade* lies under the Iron Mountains. *Skartar*, *Rushoth* and *Yagrak* hold the Salt Sea's north and
  west shores and the Coldbarrow Bridge.
- **Borders.** *Aldmark:* the Gordush and the Crown Wall (1052). *Sylvaran:* the Tusk Hills. *Varenna:* the Glenmere and
  the Albora Pass. *Solenne:* the Skardush. *Brannoch:* the north face of the Crown Range; the League guards its glens
  with no treaty ever signed. *Ulun:* the Salt Sea itself and the lower Coldbarrow; enemies since the Salt Shore (1041).
  *Drevna:* the edge of the Lakeland's woods, down to the Coldbarrow Bridge, where Gorath, Drevna, Greyhaven and Ulun
  all come to the river's bend. *Irondeep:* the mountains' foot.
- **Provinces.** Urgol (capital; steppe), Nagdur Stockade (steppe), Ughdur Ring (steppe), Grakzag Oasis (steppe), Skartar Caravanserai (steppe), Rushzag Oasis (forest), Rushoth Caravanserai (steppe), Gorur Caravanserai (steppe), Vrakhul Oasis (steppe), Kagdush Oasis (plains), Yagrak Caravanserai (steppe).

### 4.12 Ulun

*Nomad confederation. 8 provinces, 461,600 km2 (3.6% of the land; number 8 of 34 by size). Capital: Kharsa.*

- **Land.** The Salt Steppe: from the Salt Sea's south and east shores to the Grey Channel, and south to the Crown
  Range's east end and the head of the Grey Water.
- **Ground.** Short dry grass. Its "coast" is the Salt Sea and the channel: its sixty ships are lake and river craft.
- **Capital and towns.** *Kharsa*, the khan's camp, stands where the yam roads cross, midway between the Salt Sea and
  the channel. *Kultau* is the sturgeon grounds on the Salt Sea. *Ozlun*, *Agbay Yam* and *Altsa Yam* hold the southern
  channel shore; the Erkent landings of the Sea Wind are at Altsa. *Bekar* is the head of the Grey Water. *Sartobe Yam*
  is the post at the Horse Gate.
- **Borders.** *Gorath:* the Salt Sea and the Coldbarrow. *Greyhaven:* the Yarbek; horses for grain since the Compact of
  925. *Drevna:* a touch at the Coldbarrow Bridge. *Velgrad:* the Grey Channel. *Brannoch* and *Morhaven:* the Crown Range's eastern end and the Horse Gate.
  *Tessaria:* the Santora's mouth on the Grey Water. *The Lunora Woods:* the wooded hills south of the gate.
- **Provinces.** Kharsa (capital; steppe), Kultau (steppe), Bekar (steppe), Ozlun (steppe), Otbash Yam (steppe), Sartobe Yam (steppe), Agbay Yam (steppe), Altsa Yam (steppe).

### 4.13 Brannoch

*Mountain confederation. 4 provinces, 141,300 km2 (1.1% of the land; number 27 of 34 by size). Capital: Highcastle.*

- **Land.** The Crown Range: the high valleys from the Skardush Gap east to the Castina's head.
- **Ground.** Mountain valleys, silver, cheese.
- **Capital and towns.** *Highcastle*, the charter castle, stands over the meeting of the high valleys in the middle of
  the range. *Highwold* holds the Skardush Gap. *Whitfield* is the southern foothill market, where Ostra hires its
  Greycloaks. *Bearfold* is the eastern valleys.
- **Borders.** *Gorath* and *Ulun:* the range's northern foot. *Solenne* and *Lucerna:* the Palena in the Gap. *Ostra*
  and *Morhaven:* the southern foothills. A mountain league with six neighbours and no coast; it lives by selling
  crossbowmen to all of them.
- **Provinces.** Highcastle (capital; mountains), Bearfold (mountains), Whitfield (mountains), Highwold (hills).

### 4.14 Greyhaven

*Kingdom. 8 provinces, 108,400 km2 (0.9% of the land; number 28 of 34 by size). Capital: Greyhaven.*

- **Land.** The Rift oakwood: the forest block between the lower Dromir in the west, the Lake Portage in the north, the
  Tolek and the Grey Channel in the east, and the Yarbek in the south.
- **Ground.** Oak and chestnut forest on the rift's low western shoulder; iron; the sulfur vents of Smokewell.
- **Capital and towns.** *Greyhaven* stands on the Narrows of the channel, the Toll-House facing Sevany across 2 km of
  grey water: the one place where a chain can close the river. *Wrendale* is the timber harbour at the head of ship
  water. *Deepwatch Castle* watches the Lake Portage against Kamogda. *Highwell* and *Silverdale* are on the Dromir.
- **Borders.** Rivers on three sides. *Velgrad:* the Tolek and the channel; rivals over the tolls since 1010. *Ulun:*
  the Yarbek. *Drevna:* the Dromir on the west and the ridge of the Lake Portage on the north; marriage talks. Gorath's
  grass begins across the Coldbarrow Bridge at the south-west corner.
- **A change from the release.** Greyhaven has no sea. Its 58 galleys are river galleys. Its oak goes down the channel
  and the Gullet to the fleets of the Eastern Gulf, not round to Cold Bay.
- **Provinces.** Greyhaven (capital; forest), Wrendale (forest), Highwell (forest), Hawkcester (forest), Deepwatch Castle (forest), Wrenreach (forest), Briarhollow (forest), Silverdale (forest).

### 4.15 Morhaven

*Kingdom. 3 provinces, 285,500 km2 (2.3% of the land; number 14 of 34 by size). Capital: Morhaven.*

- **Land.** The east end of the Middle Sea and the Santora March: the wide plain from the sea east to the Horse Gate,
  between the Crown Range and the sands.
- **Ground.** Open plain, "wide and empty", with iron in the Castina hills. The lore's "watchful kingdom where the steppe
  meets the Sunlands" is the Horse Gate: 200 km of open ground between the Crown Range and the Grey Water, the only
  place where riders from the steppe can come south without climbing.
- **Capital and towns.** *Morhaven*, the watch city, stands on the Middle Sea's eastern head, on the north bank of the
  Monuti's northern mouth. From there it sees the sea, the delta and the plain. *Lucina* is on the Santora in the
  middle of the march; Santora Keep and its riders are in its province. *Castel Ascino* is the castle on the Castina
  where the Horse Road comes off the steppe; the Castina towers are in its province.
- **Borders.** *Ostra:* the headland east of Fort Barica. *Brannoch:* the range's southern foot. *Ulun:* the Horse Gate.
  *Tamar:* the edge of the sands south of the Santora, and the Monuti's northern mouth. *Tessaria:* the Santora below
  the Lunora Woods; it trades with both claimants.
- **Provinces.** Morhaven (capital; plains), Lucina (plains), Castel Ascino (forest).

### 4.16 Ostra

*City-state. 4 provinces, 55,500 km2 (0.4% of the land; number 30 of 34 by size). Capital: Ostra.*

- **Land.** The north-east shore of the Middle Sea, from the Narrows east to the headland before Morhaven, with the
  foothills behind and the Isle of Vines.
- **Ground.** A narrow warm shore under the Crown Range.
- **Capital and towns.** *Ostra* is the deep harbour just east of the Narrows of the Middle Sea: every ship between the
  sea's two basins passes its mole, which is why a bankers' city grew there. *Novice* is the market on the Narrows,
  facing the Isle of Vines. *Miressa* is the timber and murex town in the foothills. *Fort Barica* guards the east.
- **Borders.** *Lucerna:* the headland at the Narrows. *Brannoch:* the foothills. *Morhaven:* the headland east of
  Fort Barica.
- **Provinces.** Ostra (capital; plains), Fort Barica (plains), Miressa (mountains), Novice (hills).

### 4.17 Qadir

*Sultanate. 8 provinces, 226,700 km2 (1.8% of the land; number 21 of 34 by size). Capital: Qadira, in the province of Hazifa.*

- **Land.** The Sunwall coast: the dry shore of the Lion Gulf's southern half, the Sunwall behind it, and the range's
  desert face as far as the Sabun Pass.
- **Ground.** A dry coast of terraces, date gardens and thorn; a bare coast range. "The sultanate of passes and galleys
  on the desert coast."
- **Capital and towns.** *Qadira* (in the province of Hazifa) stands in the crown gardens on the Saman, the one river of
  the coast that runs all year. *Miruma* is the naval yard on the open coast. *Faluz Tower* is in the Sunwall. *Fort
  Tabir* is on the range's desert face at the Sabun Pass, where Qadir, Sabra and the Red Waste meet.
- **Borders.** *Varenna:* the Sunwall's northern spur. *Sabra:* the Sunwall's southern spur; Sabra broke away in 1025.
  *Sahrim:* the foot of the range's desert face. *The Bone Coast:* the bare headland.
- **Provinces.** Miruma (plains), Ashah (plains), Faluz Tower (hills), Fort Tabir (hills), Fasun (plains), Nahin (plains), Hazifa (capital; plains), Qarifa (plains).

### 4.18 Tamar

*Kingdom. 6 provinces, 252,600 km2 (2.0% of the land; number 16 of 34 by size). Capital: Tamar.*

- **Land.** The Long Rift: the Monuti's valley from Lake Nubako north to its delta on the Middle Sea, 600 km of flood
  plain a day's walk wide, with the rift's dry walls on either side.
- **Ground.** Black flood earth in a desert; reed and papyrus marsh in the delta.
- **Capital and towns.** *Tamar* stands in the middle valley where the rift is widest. *Talim* is the Flood Temple at
  the Flood Stairs, the first rapids, where the water's height is read and where barges stop. *Akayn* is the market at
  the delta's apex. *Rashira* is the delta's western mouth and the grain harbour. *Fort Halifa* is the east-bank fort
  where the Neck Road comes in.
- **Borders.** *Sahrim:* the rift's walls on the west, east and south: the desert begins where the flood ends.
  *Morhaven:* the delta's north edge. *Tessaria:* the road gate east of Fort Halifa; the Neck once took the Long Rift
  and Tamar has not forgotten.
- **Provinces.** Tamar (capital; plains), Rashira (marsh), Talim (plains), Akayn (plains), Khaiyah (desert), Fort Halifa (desert).

### 4.19 Sahrim

*Nomad confederation. 22 provinces, 1,162,000 km2 (9.2% of the land; number 1 of 34 by size). Capital: Zarak.*

- **Land.** The Red Waste: the old sea's bed, from the Middle Sea's south shore to the Southern Hills, and round the Long
  Rift on both sides. The largest realm on the map, as the lore says, by a little.
- **Ground.** Sand, stone and salt, with wells. The clans hold it "because nobody else can cross it".
- **Capital and towns.** *Zarak* is the salt flats in the lowest part of the old sea's bed, where the Salt Road and the
  Well Road meet. *Janiya* and *Kafam* are its harbours on the Middle Sea. *Januma* is by the Well of Samar. *Mirah* is
  the last wells of the Salt Road, the market where Zanara's gold is weighed. *Zahira* is the Darai Bridge on the Hazir.
- **Borders.** *Solenne* and *Varenna:* the Marble Mountains. *Qadir* and *Sabra:* the Sunwall, meeting at the Sabun
  Pass. *Zanara:* the line where the summer rains begin, along the Southern Hills in the west and the desert's edge in
  the east, with Zanara's forts on it; the Treaty of the Salt Road (1063). *Tamar:* the rift's walls. *Abara:* the foot
  of the Highveld. *Stonehold* and *the Burning Waste:* the bare ranges in the east.
- **Provinces.** Zarak (capital; desert), Marir (desert), Zabesh Oasis (hills), Janiya (desert), Zahira (plains), Nahib Oasis (desert), Badayn Oasis (desert), Halai Oasis (desert), Mirah (plains), Najuma Oasis (desert), Tamuma Oasis (desert), Qaruma Oasis (plains), Kafam Caravanserai (plains), Januma Caravanserai (desert), Dahur Oasis (desert), Bahib Oasis (desert), Zaruz Oasis (desert), Talabad Oasis (desert), Qasan (desert), Marabad Oasis (desert), Yasib Oasis (plains), Jalar Oasis (desert).

### 4.20 Zanara

*Empire. 22 provinces, 714,800 km2 (5.6% of the land; number 4 of 34 by size). Capital: Zanara.*

- **Land.** The Golden Plains: the green south between the desert and the Southern Ocean, from the hills above the Gulf
  of Sands east to the Highveld's foot.
- **Ground.** Savanna and cattle country with three rivers, forest on the coast. The lore's "great river" is the Mosawa.
- **Capital and towns.** *Zanara* stands on the Ancestor Hill above the Lotapa pastures, a day from the coast: in the
  middle of the cattle country, on the Salt Road and the Gold Road. *Anumba* is the cattle city on the Lotapa, 200 km
  east. *Tefude* is the cattle fair between the capital and the Mosawa lands. *Tandi*, the old Tedana kings' city, is on
  the lower Mosawa below the Tedana's mouth. *Kabale* is the deep gold of the Southern Hills. *Datula Walls*, *Fort
  Zuafa* and *Asilo Oasis* are the forts and the last water on the desert's edge.
- **Borders.** *Sahrim:* the edge of the rains (above). *Sabra:* the hills east of the Gulf of Sands; the Gold Road
  crosses them. *Abara:* the foot of the Highveld; the dispute over the Road Promise. *The Mirun Pines* and *the Samuma
  Uplands:* hill country in the west no one farms.
- **Provinces.** Zanara (capital; plains), Atani (plains), Jiamo (forest), Jitamo (forest), Datula Walls (plains), Osezi (hills), Bayalo (forest), Asilo Oasis (plains), Kabale (plains), Seduna Walls (forest), Omamba (plains), Owana (plains), Tefude (forest), Fort Zuafa (plains), Jiwamo (plains), Tandi (forest), Fort Nisi (plains), Wahabo (forest), Anumba (plains), Tetamba (forest), Samandi (plains), Juwalo (hills).

### 4.21 Kesh

*City league. 5 provinces, 200,700 km2 (1.6% of the land; number 25 of 34 by size). Capital: Kesh.*

- **Land.** The south-east peninsula: the bay on the Spice Sea, the pepper hills, the east shore on the Eastern Gulf,
  and the Amber Strait.
- **Ground.** Wet forest and pepper gardens.
- **Capital and towns.** *Kesh* is the harbour on the bay's sheltered east shore. *Zetu* is the market at the Monundi's
  mouth, where pepper goes up to Abara. *Monuro* has the shipyards on the Amber Strait, facing Great Amber. *Fort
  Zubanga* holds the east shore toward Ranpur.
- **Borders.** *Abara:* the hills at the peninsula's root. *The Thornveld:* the dry head of the peninsula. *Ranpur:* a
  short line on the east shore.
- **Provinces.** Kesh (capital; forest), Kioya (mountains), Monuro (forest), Zetu (plains), Fort Zubanga (plains).

### 4.22 Abara

*Kingdom. 14 provinces, 483,500 km2 (3.8% of the land; number 7 of 34 by size). Capital: Abara.*

- **Land.** The Highveld and its slopes: the plateau, the western scarp above the desert, the wet eastern slope, and
  the green hills south to a short coast.
- **Ground.** High plateau and terraced hills: the lore's "highland kingdom".
- **Capital and towns.** *Abara*, the royal ancestor houses, stands on the plateau just south of the snow peaks, at the
  head of the Monuti. *Koyako* is the stair down to the river. *Kokuka Walls* is the western fort above the desert.
  *Kasani* is the coffee forest on the wet slope. *Tezenga* is the horse market at the head of the Monundi.
- **Borders.** *Sahrim:* the scarp's foot. *Zanara:* the foot of the Highveld on the upper Mosawa. *Stonehold:* the
  saddle between the Highveld and the Worldspine. *Ranpur:* the foot of the eastern slope. *Kesh, the Thornveld, the
  Deep Green:* the lowlands of the south-east.
- **A change from the release.** Abara no longer touches Tamar: Sahrim holds the desert reach of the upper Monuti
  between them. The alliance of 989 and the river gift stand; Abara still holds the source.
- **Provinces.** Abara (capital; hills), Jimba (hills), Fort Makale (plains), Okilo (plains), Koyako (plains), Balona (hills), Yandi (hills), Kasani (forest), Nusalo (hills), Tezenga (hills), Londi Walls (forest), Kokuka Walls (hills), Selomba (forest), Wamazi (hills).

### 4.23 Hrimfell

*Giant territory. 4 provinces, 252,100 km2 (2.0% of the land; number 17 of 34 by size). Capital: Jotunhall.*

- **Land.** The White Coast: the ice-bound north-eastern coast from the far-west walrus beaches to Whale Sound, and the
  fells behind it.
- **Ground.** Ice, rock and snow.
- **Capital and towns.** *Jotunhall* stands on the one stretch of the White Coast where the ice leaves a beach, facing
  the open sea. *Torholm*, with Hrimborg, is the southern shore on Whale Sound, where the giants meet Drevna's whalers.
- **Borders.** *Drevna:* the crest of the Frostfells; the Truce of Dobin shares the whaling grounds of the Sound. *The
  Frostfells:* more ice.
- **A change from the release.** The lore's "frozen eastern coast" is the north-east coast. Hrimfell no longer touches
  Velgrad; its pelts reach Velgrad's buyers through Dobin (section 7).
- **Provinces.** Jotunhall (capital; mountains), Valdhall (mountains), Valdgard (mountains), Torholm (hills).

### 4.24 Sabra

*Emirate. 8 provinces, 204,700 km2 (1.6% of the land; number 24 of 34 by size). Capital: Sabra.*

- **Land.** The Gulf of Sands: its north and east shores and the upland behind.
- **Ground.** A dry shore of date gardens, pearl banks and oil seeps.
- **Capital and towns.** *Sabra* stands at the Bahesh's mouth, the one sweet water on the gulf. *Zariya* is the Oil
  Shore, with its walled seeps. *Sarabad* is the granary up the Bahesh. *Basir* is the date gardens of the South March.
- **Borders.** *Qadir:* the Sunwall's southern spur (the breakaway of 1025). *Sahrim:* the Sabun Pass and the hills east
  of it. *Zanara:* the hills east of the gulf; the Gold Road arrives each spring. *The Mirun Pines, the Samuma Uplands:*
  hill country.
- **Provinces.** Sabra (capital; plains), Sarabad (plains), Sabira (plains), Zahas (plains), Daham Tower (hills), Nahur (plains), Basir (plains), Zariya (plains).

### 4.25 Velgrad

*Kingdom. 14 provinces, 459,500 km2 (3.6% of the land; number 9 of 34 by size). Capital: Velgrad.*

- **Land.** The Eastland: the east bank of the Tolek and the Grey Channel, the green uplands behind it on the Ostec, the
  west face of the East Rift Heights, and the south-east corner of the Western Lakes.
- **Ground.** Forest uplands and farmed valleys; a snow range above them; the sulfur pits of Redcrown.
- **Capital and towns.** *Velgrad*, the Bear Keep, stands on the Ostec in the middle of the uplands, where the roads
  from Sevany, the Mirovo Gap and the Neck meet. *Sevina* is Sevany: the toll fort, the chain towers and the squadron,
  facing Greyhaven at the Narrows. *Droin* is the head of ship water. *Kamogda Kremlin* guards the Lake Portage and the
  Tolek forts. *Mirgrad* is the town below the Mirovo Gap. *Yarec* is the seat of the Ostec March on the road south to
  the Neck. *Belansk* is the Redcrown Heights.
- **Borders.** *Greyhaven:* the Tolek and the channel. *Ulun:* the channel. *Drevna:* the Lake Portage and the spur of
  the heights above the lake; set by the Lakeland War. *Ughrak:* the crest of the East Rift Heights and the Mirovo Gap;
  Velgrad pays the silk toll at Kraoth. *Skyhold:* the Stairwood's southern edge. *Tessaria:* the east shore road above
  the Grey Water; Velgrad backs Prince Andros there. *The Dobava Wilds, the Stairwood:* forest and heights.
- **Provinces.** Velgrad (capital; forest), Mirgrad (plains), Sevina (plains), Velany (forest), Belovo (forest), Vyova (forest), Kamogda Kremlin (forest), Belina (plains), Droin (forest), Lubyn Kremlin (plains), Velin (forest), Belansk (plains), Dobina (mountains), Yarec (plains).

### 4.26 Drevna

*Kingdom. 13 provinces, 555,700 km2 (4.4% of the land; number 6 of 34 by size). Capital: Drevna.*

- **Land.** The Lakeland: the west and south shores of the Western Lakes, the green valley at the lake's north-east
  arm, the fells behind, and a way through the Lake Gate to the head of Whale Sound.
- **Ground.** Wooded lake shores, rye clearings, mountains at their back.
- **Capital and towns.** *Drevna* stands where the Dromir leaves the lake: the foot of all the lake's boat traffic and
  the head of the river road to the steppe. *Brodava* is the lake town and island fort in the north-east arm. *Lubevo
  Kremlin*, with Lubany and its silk staple, is on the upper Dromir under the Lake Gate. *Dobin* is the whaling harbour
  at the head of Whale Sound. *Polgrad* is the granary on the lower Dromir, on the road to the steppe. *Tversk Fort* is
  the south-shore fort at the Lake Portage.
- **Borders.** *Hrimfell:* the Frostfells' crest. *Velgrad:* the Lake Portage and the heights east of the lake. *Ughrak:*
  the crest of the East Rift Heights north of Redcrown; the hostile peace of Thardush (1066). *Greyhaven:* the portage
  ridge. *Gorath:* the edge of the woods. *The Frostfells, the Mammoth Downs, the Whale Woods:* fells and forest.
- **A change from the release.** Drevna is north-west of Velgrad, not east. Compass words in its texts change.
- **Provinces.** Drevna (capital; forest), Belek (mountains), Dobin (plains), Kraina (forest), Zorek (forest), Brodava (mountains), Polgrad (forest), Ugava Fort (mountains), Tversk Fort (forest), Darsky (forest), Dobnik Fort (mountains), Lubevo Kremlin (hills), Radov (forest).

### 4.27 Skyhold

*Theocracy. 8 provinces, 208,900 km2 (1.6% of the land; number 23 of 34 by size). Capital: Skyhold.*

- **Land.** The Roof: the high plateau on the east coast between the Mirovo Gap and the Ember Mountains.
- **Ground.** A cold dry plateau of salt pans and yak pasture between snow ridges.
- **Capital and towns.** *Skyhold* stands at the White Stair, in the middle of the plateau's valleys. *Eaglespire* is
  the northern salt gate, where salt goes out to the steppe and the Lakeland. *Starspire* is above the sea. *Bellcrest*
  is the southern herds, on the trail to Ranpur.
- **Borders.** The plateau's rim on every side: *Ughrak* and *the High Wastes* to the north, *Velgrad, the Stairwood*
  and *the Dobava Wilds* to the west, *Tessaria* and *the Free Marches* to the south-west, *Emberdeep* to the south.
- **Provinces.** Skyhold (capital; hills), Quietwatch Monastery (hills), Starspire (hills), Moonstair (hills), Drumhaven Monastery (hills), Bellcrest (hills), Eaglespire (hills), Stonespire Monastery (hills).

### 4.28 Stonehold

*Dwarven hold. 6 provinces, 185,300 km2 (1.5% of the land; number 26 of 34 by size). Capital: Stonehold.*

- **Land.** The Worldspine: the northern half of the rift's great southern shoulder.
- **Ground.** High mountain.
- **Capital and towns.** *Stonehold*, the First Hall, is under Mount Bardun in the middle of the range. *Mormund* holds
  the Zardeep Pass. *Garbek Gate* watches the Nagora road it lost in 1085. *Morhall* has the Kardeep mines.
- **Borders.** The mountains' foot: *Tessaria* on the north, *Sahrim* and *the Burning Waste* on the west, *Ranpur* on
  the east (the cold peace of the Nagora Pass), *Abara* across the southern saddle.
- **Provinces.** Stonehold (capital; mountains), Morhall (hills), Barmark Gate (hills), Mormund (mountains), Garbek Gate (mountains), Dramhall (hills).

### 4.29 Emberdeep

*Dwarven hold. 3 provinces, 211,000 km2 (1.7% of the land; number 22 of 34 by size). Capital: Emberdeep.*

- **Land.** The Ember Mountains: the volcanic cape between the Sunrise Sea and the Eastern Gulf.
- **Ground.** A hot mountain range over a forested shore.
- **Capital and towns.** *Emberdeep* is inside the hot mountain. *Maghelm* is the gate town on the road down to the
  gulf, where Ranpur's rice comes in. *Gorhall* is the outer peaks; the southern Sunrise Isles are in its province.
- **Borders.** *Skyhold:* the knot where the cape's range meets the Roof. *The Free Marches:* the mountains' western
  foot. *Ranpur:* a short line at the Gullet's mouth.
- **Provinces.** Emberdeep (capital; hills), Maghelm (hills), Gorhall (hills).

### 4.30 Ranpur

*Kingdom. 5 provinces, 266,600 km2 (2.1% of the land; number 15 of 34 by size). Capital: Ranpur.*

- **Land.** The Monsoon Coast: the lowland between the Worldspine and the Eastern Gulf, from the Gullet's mouth south to
  the teak coast.
- **Ground.** Rice plain, sugar and cotton; teak forest in the south.
- **Capital and towns.** *Ranpur* is at the Chanpur's mouth, in the middle of the rice plain. *Chanari*, the steel town,
  is in the Worldspine's foothills on the Chanpur, between ore and charcoal. *Tiravi* is the Nagora March. *Madora* is
  the river-mouth fort built when the Neck road closed.
- **Borders.** *Stonehold:* the mountains' foot. *Abara:* the foot of the Highveld's slope. *Kesh:* the Thornveld's
  edge on the east shore. *Tessaria* and *the Free Marches:* the Gullet and the Reed Water. *Emberdeep:* the Gullet's
  mouth.
- **Provinces.** Ranpur (capital; plains), Chanari (plains), Tiravi (hills), Madora (forest), Ekapur (forest).

### 4.31 Tessaria

*Collapsing kingdom. 3 provinces, 326,000 km2 (2.6% of the land; number 12 of 34 by size). Capital: Tessar.*

- **Land.** The Neck: the land round the south end of the Grey Water. West of the lake are the cedar hills; south of it
  the plain under the Worldspine; east of it a corridor 250 km wide between the lake and the Roof.
- **Ground.** Plain and low hills. Its "coast" is the Grey Water.
- **Why it is the Neck.** A traveller from the south to the Eastland has the Worldspine and the Roof on one hand and the
  Grey Water and the channel on the other. The Gullet can be bridged only at its head. So every road from Tamar, from
  Ranpur and from the Sunlands comes to Tessar's bridge, and one road goes on north up the lake's east shore to Velgrad.
- **Capital and towns.** *Tessar* is the harbour and bridge where the Grey Water narrows into the Gullet. *Calossa* is
  the northern castle in the corridor east of the lake: Prince Andros's country, of the Dawn Church. *Feleria* is the
  cedar hills west of the lake: Queen Livia's, of the Temple.
- **Borders.** *Morhaven:* the Santora. *Ulun:* the Santora's mouth. *Velgrad:* the east-shore road north of Calossa.
  *Skyhold* and *the Dobava Wilds:* the Roof's foot. *The Free Marches:* the Tirana and the forest south of it, which
  Tessaria once took and lost. *Ranpur:* the Reed Water. *Stonehold:* the Worldspine's foot; the Tirana's gold divides
  them. *Sahrim* and *Tamar:* the sands west of Feleria; the gate toward Fort Halifa.
- **Provinces.** Tessar (capital; plains), Calossa (plains), Feleria (plains).

### 4.32 Ambrel

*Sultanate. 3 provinces, 81,300 km2 (0.6% of the land; number 29 of 34 by size). Capital: Amberport.*

- **Land.** Great Amber, the island across the Amber Strait from Kesh, and the isles beside it.
- **Ground.** Wet forest and spice gardens.
- **Capital and towns.** *Amberport* is the sheltered north harbour on the strait, where ships between the Spice Sea and
  the Eastern Gulf must pass. *Ruhu* is the west coast bay. *Paamu* is the east coast harbour toward the Isle of Pearls.
- **Borders.** The sea, and *the Amber Wilds*, the island's hill interior. The Isle of Pearls is wild: the Sultan's
  fleet sails for it.
- **Provinces.** Amberport (capital; forest), Ruhu (forest), Paamu (forest).

### 4.33 Corvasse

*Pirate haven. 2 provinces, 19,300 km2 (0.2% of the land; number 34 of 34 by size). Capital: Corvasse.*

- **Land.** The Corsair Isles: two islands off the Ashlands' cape.
- **Ground.** Rock and goat pasture.
- **Capital and towns.** *Corvasse* is the harbour inside the shoals of the larger isle, facing the strait. *Ratrock*
  is the toll boats' rock at the strait's southern mouth.
- **Borders.** The sea. Every coasting ship between the Elder Sea and the Lion Gulf passes the Strait of Hael under the
  isles or goes outside them into the open ocean, where the leviathans are. That is the toll.
- **Provinces.** Corvasse (capital; plains), Ratrock (plains).

### 4.34 Ughrak

*Orc clans. 6 provinces, 445,900 km2 (3.5% of the land; number 10 of 34 by size). Capital: Grakmar.*

- **Land.** The eastern steppe: the coastal plain between the East Rift Heights and the Sunrise Sea, from the forest
  edge in the north to the Roof in the south.
- **Ground.** Cold grass, larch and snow horses.
- **Capital and towns.** *Grakmar*, the War-Mother's camp, is in the middle of the grass. *Tukgar Stockade* is the
  Kraoth toll camp at the east end of the Mirovo Gap. *Roktuk* is behind the Silk Strand, where the silk ships land.
  *Drukgar Stockade* is the forest edge toward the Lakeland.
- **Borders.** *Velgrad:* the crest of the East Rift Heights and the Mirovo Gap. *Drevna:* the crest north of Redcrown;
  the Tusk War ended at Thardush (1066). *Skyhold:* the Roof's northern rim. *The Whale Woods, the Tverko Woods, the High
  Wastes, the Stairwood:* forest and bare coast.
- **A change from the release.** Ughrak has a sea coast. The silk road does not come overland from the east: silk comes
  by ship through the Sunrise Isles to the Silk Strand, and Ughrak taxes it from the beach to the Gap.
- **Provinces.** Grakmar (capital; steppe), Drukgar Stockade (forest), Oggoth Oasis (steppe), Tukgar Stockade (steppe), Vashuk Oasis (steppe), Roktuk Oasis (steppe).

### 4.35 The wilds

The 25 unclaimed provinces of `LORE.map` are the land no realm holds. Each has a reason: ice, bare rock, ash, desert
headland, deep forest, or a border country two neighbours deny each other.

| Wild | Area (km2) | Ground | Neighbours | What it is, and why no realm holds it |
| --- | ---: | --- | --- | --- |
| The Free Marches | 194,100 | forest | Emberdeep, Ranpur, Skyhold, Tessaria | The forested lowland between the Gullet, the Roof and the Ember Mountains. Tessaria took it once and lost it; four neighbours deny it to each other, and its settlers answer to none of them. Ranpur buys its iron and timber |
| The Frostfells | 85,400 | mountains | Drevna, Hrimfell, the Mammoth Downs, the Pinewild, the Trolness Fells | The snow range north-west of the Western Lakes. No one can winter there |
| The Whale Woods | 64,300 | forest | Drevna, the Tverko Woods, Ughrak | The forest cape east of Whale Sound. It lies beyond the Truce of Dobin: whalers and trappers use it and no one rules it |
| The High Wastes | 22,300 | mountains | Skyhold, Ughrak | The coast mountains north-east of the Roof. Too bare to feed a garrison; the Red Stair sect of Skyhold hides there |
| The Amber Wilds | 19,900 | forest | Ambrel | The hill interior of Great Amber. The Leaf People's forest: the sultan's writ stops at the gardens |
| The Isle of Pearls | 4,900 | forest | none: an island | The pearl isle east of Great Amber. The Sultan's fleet is sailing for it |
| The Bone Coast | 18,800 | desert | Qadir | The desert headland west of the Gulf of Sands. No water; Corvasse's salt-fishers camp on it |
| The Burning Waste | 44,200 | hills | Abara, Sahrim, Stonehold | The bare ranges between the Long Rift and the Worldspine, which no clan grazes. No wells: even the clans go round |
| The Western Veld | 37,800 | plains | the Samuma Uplands | The south-west peninsula. No road reaches it |
| The Thornveld | 29,200 | hills | Abara, Kesh | The dry head of the south-east peninsula. Thorn scrub: neither Abara nor Kesh will pay to hold it |
| The Deep Green | 49,800 | forest | Abara | The rainforest cape. The fort at its edge is as far as Zanara goes |
| The Western Highlands | 19,400 | hills | Eldergrove, the Bleakfold | The coast heights between the Elder Coast and Ashmere. It lies between two elf coasts and a human kingdom and is good to none of them |
| The Ashlands | 130,100 | plains | Ashmere, Varenna | The western peninsula under Mount Hael. Hael's ash: the old kingdom was buried here in 13 BR, and the Temple forbids building on it |
| The Pinewild | 85,700 | mountains | Northreach, the Frostfells, the Mammoth Downs, the Trolness Fells | The pine fells between Cold Bay and the Frostfells. Snow fells; hunters only |
| The Little Amber Wilds | 1,300 | forest | none: an island | The lesser isle. An islet |
| The Bleakfold | 34,100 | forest | Ashmere, Eldergrove, Sylvaran, the Western Highlands | The bare heights behind the Western Highlands. A watch tower there would starve |
| The Tverko Woods | 34,300 | forest | the Whale Woods, Ughrak | The north-east cape and the northern Sunrise Isles. The last cape; silk pilots take water there |
| The Trolness Fells | 105,600 | mountains | Northreach, the Frostfells, the Pinewild | The ice coast north of the Iron Mountains. Ice to the sea |
| The Mammoth Downs | 124,100 | forest | Aldmark, Drevna, Gorath, Irondeep, Northreach, the Frostfells, the Pinewild | The downs between Northreach, the Crossmarch and the Pinewild. Too poor to tax, and a road for smugglers of iron |
| The Dobava Wilds | 30,100 | forest | Skyhold, Tessaria, Velgrad | Mount Dobava, the spur between the Neck road and the Roof. Bandit heights above the Neck road |
| The Stairwood | 42,800 | forest | Skyhold, Ughrak, Velgrad | The forest stair between Velgrad and the Roof. Too steep to farm; Velgrad and Skyhold each prefer it empty |
| The Mirun Pines | 73,700 | forest | Sabra, Sahrim, Zanara | The pine hills west of the Southern Hills. Sabra, Sahrim and Zanara meet here and none will let another fortify |
| The Samuma Uplands | 48,000 | forest | Sabra, the Western Veld, Zanara | The uplands south of the Gulf of Sands. No harbour and no road |
| The Lunora Woods | 35,400 | forest | Morhaven, Tessaria, Ulun | The wooded hills between the Castina and the Grey Water, north of the Santora. Raided through the Horse Gate too often to farm |
| The Firststone Hills | 64,400 | hills | Ashmere, Gorath, Sylvaran, Varenna | The ash plain at the Glenmere's west end. Four realms meet on it and each keeps the others off |

## 5. Names

**The rule** (the owner's rules 9 and 11): names are plain, basic English; a people's own tongue shows only in the names
of its own places, and only the far and the non-human peoples sound strange. So the seas, the great ranges and the
regions have plain names (the Middle Sea, the Worldspine, the Neck), and a river or town carries the sound of the people
on it (the Glenwash in Aldmark, the Palella in Varenna, the Gordush on the orc border, the Dromir in Drevna).

**Kept from the lore.** Every geographic name the lore already uses keeps its name. 113 of the design's names are the
lore's own. Sections 3 and 4 say which water or land each now names. The ones that moved furthest: the Middle Sea
(now the central lake), the Strait of Hael (now on the ocean), the Grey Channel (now a rift river), Cold Bay (now behind
the Cold Narrows), the Western Lakes (now north-west of Velgrad), the Albora Pass (now the low pass at the Glenmere's
east end), the Crown Road (from the Albora Pass to Varenna) and the Coast Road (from Varenna over the Mirona Pass and
along the Middle Sea's north shore).

**Added by the design.** These 46 names are new. Each is plain English, or takes the name of the town or people beside
it. Any of them can be changed without touching the map.

| Name | What it names | Why this name |
| --- | --- | --- |
| The Sunrise Sea | The ocean east of the land | The Sunrise Isles lie in it (the title's own words) |
| The Lion Gulf | The bight off Varenna's coast | The Lion crown |
| The Long Firth | Ashmere's bay and inlet | It is long and narrow |
| Tibata Bay | The bay under the Ashlands | Tibata stands at its mouth; the lore's Tibata Strait is that mouth |
| The Elder Sea | The island sea off the Elder Coast | The Elder Coast |
| Amber Bay | The outer bay of the Cold Narrows | The Amber Capes |
| The Cold Narrows | The strait into Cold Bay | Cold Bay |
| The Amber Strait | Between Kesh and Great Amber | Great Amber |
| The Grey Water | The lake the Grey Channel fills | The Grey Channel |
| The Gullet | The river from the Grey Water to the gulf | It swallows the channel's water |
| The Glenmere | The long western lake | The Glenwash runs out of it |
| The Crowmere | The lake in the gate under Mount Cinder | Crowbrook stands on it |
| The Reed Water, the Iron Tarn | Two small lakes | Reeds; the Iron Mountains |
| The Amber Lagoon, the Veld Lagoon, the Seal Lagoon | Three lagoons | The Amber Strand, the Western Veld, seals |
| The Whitewater, the Bleak Water | Two rivers | Off the Marble Mountains; off the Bleakfold |
| The Lion Hills | The knot behind the Crown Coast | The Lion crown |
| The Montessa Hills | The hills the Montessa Gate crosses | The Montessa Gate |
| The Marble Mountains | The range between Varenna and Solenne | Varenna's and Brannoch's marble |
| The Ember Mountains | Emberdeep's range | Emberdeep |
| The Skardush Gap, the Mirona Pass | Two gates to the Middle Sea | The rivers that run through them |
| The Mirovo Gap | Between the East Rift Heights and the Roof | Mirgrad stands below it |
| The Lake Gate, the Lake Portage | The Lakeland's two ways out | They are what they are called |
| The Silk Strand | Ughrak's landing coast | Silk |
| The Sunrise Isles | The isles off the east coast | The title's own words |
| Elder Isle, the Teak Isles, the Marsh Isles | Islands | The coasts they lie off |
| The Skardush Road, the Gap Road, the Santora Road, the Eastern Road, the Yam Road, the Monsoon Road, the Pepper Road, the Lakes Road, the Sunwall Road | Roads | The lore speaks of "the Skardush road" and "the eastern road"; the rest are named for what they follow or carry |
| The Elder run, the Middle Sea crossing, the sunrise run, the ice run | Sea lanes | The lore has the northern run and the southern run; these are named the same way |

**The regions**

| Region | What it is on this map | Who lives in it |
| --- | --- | --- |
| The Westland | The north-west, north of the old range and west of the Iron Mountains | Aldmark, Northreach, Sylvaran, Eldergrove, Ashmere |
| The Sunlands | The warm lands of the Solenfolk, from the Lion Gulf along the Middle Sea's north shore to the Grey Water | Varenna, Solenne, Lucerna, Ostra, Morhaven, the Neck |
| The Southland | Everything south of the Middle Sea and the Neck | Sahrim, Tamar, Qadir, Sabra, Zanara, Abara, Stonehold, Ranpur, Kesh, Ambrel |
| The Eastland | The lands of the Grey Channel and beyond | Velgrad above all; Greyhaven, Drevna, Ughrak, Skyhold, Emberdeep |
| The Evenwood | Sylvaran's forest | |
| The Elder Coast | Eldergrove's fjord coast | |
| The Grass Sea | Gorath's belt of grass | |
| The Salt Steppe | Ulun's grazing | |
| The Lakeland | The country of the Western Lakes | Drevna; Velgrad's corner |
| The Rift | The Grey Channel's trench | Greyhaven, Velgrad |
| The Neck | The land round the Grey Water's south end | Tessaria |
| The Santora March | The plain from the Middle Sea to the Horse Gate | Morhaven |
| The Holy Coast | Solenne's shore of the Middle Sea | |
| The Crown Coast | Varenna's shore of the Lion Gulf | |
| The Northern Lakes | The Glenmere's south shore | Varenna |
| The Red Waste | The old sea's bed | Sahrim |
| The Long Rift | The Monuti's valley | Tamar |
| The Golden Plains | The savanna of the south | Zanara |
| The Monsoon Coast | The west shore of the Eastern Gulf | Ranpur |
| The White Coast | The ice coast of the north-east | Hrimfell |
| The Amber Strand, the Silk Strand | Two beaches named for what lands on them | Aldmark; Ughrak |
| The Sunrise Isles | The isles off the east coast | Fishers and silk pilots |

## 6. Trade and movement

This is the skeleton order 69 asks for. M2 (the map in depth) puts flesh on it: tolls, seasons, carrying costs, what
moves when. Everything here is a line in `design/features.json` and, in kilometres, in `design/build.json`.

### 6.1 The great roads

| Road | Length (km) | Course | What it carries | Who holds its gates |
| --- | ---: | --- | --- | --- |
| The Amber Road | 1,000 | Easterham, Kingsmere, Carrness, Thornstone, over the Wolf clans' hills to the Glenmere's east end and the Albora Pass | Amber, furs, wheat and horses south; wine, oil and cloth north | Aldmark at Thornstone; the Wolf clans between; Varenna at the Albora towers |
| The Crown Road | 1,780 | The Albora Pass, Ardata, Castella, the Montessa Gate, Vitia, Torossa, Camia, down the Palella to Varenna | The same goods, and Varenna's army | Varenna (the Warden of the Crown Road at Ardata) |
| The Coast Road | 2,070 | Varenna, Ambalia, Valia, Venina, the Mirona Pass, Solenne, Lucerna, Ostra, Morhaven | Cloth and wine east; grain, salt, paper and purple west | Varenna and Solenne at the pass; each city on the shore |
| The Skardush Road | 840 | Urgol, the middle grass, the Gordush fords, Kingsmere | The clans' horses and felt to the empire's markets, when there is peace | Gorath; Aldmark's Galemere Tower |
| The Gap Road | 830 | The Albora Pass along the Skardush to Highwold, and down the Palena to Lucerna | Northern goods to the Middle Sea without passing Varenna | Brannoch at Highwold |
| The Iron Road | 740 | The Deep Gate, Eagleburg, Brookcliff, Kingsmere | Iron and steel out; grain and malt in | Irondeep; Aldmark's lower fort |
| The Horse Road | 1,320 | Kharsa, Sartobe Yam, the Horse Gate, Castel Ascino, Lucina, Morhaven | 20,000 horses a year; the oil that goes on to Tessar | Ulun to the gate; Morhaven below it |
| The Santora Road | 850 | Lucina down the Santora to Tessar | The Sunlands' trade with the Neck | Morhaven; Tessaria |
| The Neck Road | 2,020 | Tamar, Akayn, Fort Halifa, the sands' edge, Tessar's bridge, Calossa, Yarec, Velgrad | Everything between the south and the Eastland | Tamar at Fort Halifa; Tessaria at the bridge; Velgrad's three stations on the northern stretch |
| The Nagora Road | 810 | Ranpur, Chanari, Tiravi, the Nagora Pass, Tessar | Ranpur's pepper and steel to the Neck | Ranpur (since 1085); Stonehold takes 1 in 20 |
| The Silk Road | 1,240 | The Silk Strand, Grakmar, the Kraoth toll camp, the Mirovo Gap, Mirgrad, Velgrad, Sevany | Silk from the Sunrise Isles | Ughrak at Kraoth (one part in ten); Velgrad |
| The Silk Road (north) | 1,330 | Grakmar, Drukgar, Whale Sound, the Lake Gate, Lubany | Silk and Skyhold's salt to the Lakeland | Ughrak; Drevna at Dobnik Fort and Lubany (a tenth) |
| The Lakes Road | 430 | Greyhaven, Wrendale, Deepwatch, the Lake Portage, Tversk, Drevna | The land half of the Fur Road | Greyhaven, Velgrad and Drevna at the portage |
| The Yam Road | 1,140 | The khan's post from Kultau on the Salt Sea by Kharsa to the channel shore and Bekar | Messages and the khan's tenth | Ulun |
| The Salt Road | 1,220 | Zanara, Fort Zuafa, Mirah, the Well of Samar, Zarak, the northern wells, Janiya | Gold north; salt south | Zanara's forts; Sahrim's guides (the treaty of 1063) |
| The Gold Road | 1,370 | Zanara, Samandi, Jitamo, the Mirun Pines, the Sabun Pass, Sarabad, Sabra | The spring gold caravan | Zanara; Qadir's Fort Tabir at the pass; Sabra |
| The Sunwall Road | 800 | Varenna, Aurora, Qadira, Nahin, Daham Tower, Sabra | The coast's trade under the range | Varenna, Qadir, Sabra |
| The Eastern Road | 1,500 | Zanara, Anumba, Tefude, Osezi, Juwalo, Atani, the Koyako Stair, the Monuti | Zanara's way to the Monuti that passes by Kesh's ports | Zanara; Abara at the stair |
| The Monsoon Road | 1,020 | Ranpur, Ekapur, Madora, Fort Zubanga, Kioya, Kesh | Rice and cotton south; pepper north | Ranpur; Kesh |
| The Pepper Road | 560 | Kesh, Zetu, up the Monundi to Tezenga and Abara | Pepper to the Highveld | Kesh; Abara's toll-men |

### 6.2 River and lake routes

| Route | Course | Boats | What makes it matter |
| --- | --- | --- | --- |
| The Fur Road | The upper Dromir and the Western Lakes to Tversk; 100 km of portage; then the Tolek, the Grey Channel, the Grey Water and the Gullet to the Eastern Gulf: 2,400 km | Lake boats; wagons; river barges; galleys from Droin | The spine of the east. Furs, wax, rye, oak and iron go down; salt, wine, cloth and silver come up. Velgrad's Tolek forts search every barge; Greyhaven and Velgrad share the tolls at the Narrows; Tessaria holds the bridge |
| The Glenwash | Cold Bay to Kingsmere and above | Barges | The empire's grain and amber reach Easterham by water |
| The lower Dromir | Drevna to Polgrad | Barges | Rye to the steppe's edge |
| The Monuti | The Flood Stairs to the delta | Barges | Tamar's wheat reaches Rashira and the Grain Staple by water |
| The Palella | Varenna to Stagley | Barges | The weaving towns' cloth; and an army: "46,000 by barge up the Palella" |
| The Palena | The Skardush Gap to Lucerna | Barges | Lucerna's road north begins as a river |
| The Mosawa | Jiwamo to the sea | War canoes, grain barges | Tandi lives or starves by who holds the river |
| The Brightwash | The Crown Vale to the Long Firth | Barges | Ashmere's copper and wool reach the sea |
| The Santora | Lucina to the Grey Water, in spring | Barges | In a great flood the Middle Sea and the Grey Water are joined for a month |

### 6.3 Sea lanes

| Lane | Length (km) | Course | Ships |
| --- | ---: | --- | --- |
| The Elder run | 2,860 | Silverbough, round the Strait of Hael, Tibata, Varenna, Qadira, Sabra | Longships, cogs, galleys. Every ship pays Corvasse or goes outside the isles |
| The northern run | 1,580 | Ithira, the Amber Strand, Frostholm's tin, the Cold Narrows, Easterham | Longships and cogs; Northreach takes a tenth of the tin |
| The ice run | 2,060 | Jotunhall west along the White Coast to the Amber Capes, in summer only | A few hide boats and Northreach longships: the giants' tusks |
| The southern run | 5,070 | The Gulf of Sands round the Western Veld, along the Golden Plains, Kesh, the Amber Strait, the Eastern Gulf, the Gullet's mouth | Galleys and dhows: gold, pepper, cloves, pilgrims for the Well |
| The sunrise run | 3,450 | The Eastern Gulf round the Ember cape, under the Roof, to the Silk Strand and Whale Sound | Few ships: silk pilots through the Sunrise Isles |
| The Middle Sea crossing | 570 | Rashira, Morhaven, Ostra, the Narrows, Lucerna, Solenne; and Janiya on the south shore | Galleys and grain ships: the Grain Staple |

There is no sea way between the Middle Sea and the ocean, and none between the northern run and the sunrise run in
winter. Two portages join the waters: the Lake Portage (the Lakeland to the channel) and the Santora sill (the Middle Sea
to the Grey Water, by cart except in a great flood).

### 6.4 The choke points

These are the places where one holder can stop a whole trade. They are the reasons for most of the lore's quarrels, and
M2 should make each a thing a player can hold, tax or close.

| Place | What passes | Who holds it |
| --- | --- | --- |
| The Cold Narrows | The empire's only way from its own port to the ocean; Frostholm's tin | Northreach the east bank, Aldmark the west |
| The Strait of Hael | All coasting trade between the north-west and the Lion Gulf | Corvasse |
| The Narrows of the Grey Channel | The Fur Road | Greyhaven and Velgrad, facing each other |
| The Lake Portage | The same | Drevna, Greyhaven and Velgrad meet on it |
| Tessar's bridge | The only land road from the south to the Eastland; the Gullet's ships | Tessaria, in civil war |
| The Horse Gate | The steppe's way south | Ulun and Morhaven |
| The Skardush Gap | The northern plains' gate to the Middle Sea | Brannoch |
| The Albora Pass | The Amber Road and the Crown Road | Varenna, with the Wolf clans on the north side |
| The Mirona Pass | Varenna's road to the Middle Sea | Varenna and Solenne |
| The Narrows of the Middle Sea | All shipping between the sea's two basins | Ostra |
| The Monuti's mouths | Tamar's grain | Tamar; Morhaven watches |
| The Flood Stairs and the Koyako Stair | The Monuti above the valley | Tamar; Abara |
| The Sabun Pass | The Gold Road | Qadir's fort; Sabra; Sahrim |
| The Nagora Pass | Ranpur's road north | Ranpur since 1085 |
| The Mirovo Gap | The Silk Road | Ughrak at Kraoth |
| The Lake Gate | The northern silk road and the Whale Road | Drevna |
| The Amber Strait | The short way between the Spice Sea and the Eastern Gulf | Kesh and Ambrel, allied |
| The Gordush fords | The empire's southern door | Aldmark's Crown Wall |

## 7. What changes in the lore

Order 71 says the lore follows the map. The engineer's lint (`tools/lint-lore-map.mjs`) finds every sentence; this is
the list of what is now true, so that each can be reworded. Nothing here needs a new character, house or event: it is
geography, routes and numbers.

**A. Waters**

1. **The Middle Sea is an inland sea**, 640 km long, with no way to the ocean. On it: Solenne, Lucerna, Ostra, Morhaven,
   Tamar, Sahrim. No longer on it: Varenna, Qadir, Sabra, Corvasse, Greyhaven, Ughrak. It counts as a coast for fleets
   and for the words "coast" and "harbour".
2. **The Strait of Hael is an ocean strait** between the Ashlands' cape and the Corsair Isles. Corvasse is on it.
   Varenna's, Eldergrove's and Qadir's ships pass it; Lucerna's cannot reach it.
3. **The Grey Channel is a river**, 840 km from Droin to the Grey Water, and the Gullet carries it 630 km on to the
   Eastern Gulf. It joins no northern sea and not the Middle Sea. "Tide" on the channel is the afternoon rise of the melt:
   the Tide Divers and the Sea Wind's Tide-Readers keep their names. Galleys on it are river galleys; cogs become barges.
4. **The Western Lakes drain to the Salt Sea** by the Dromir. Between the lake and the Tolek is a 100 km portage. The
   Tolek's forts still "search every barge from the Lakeland": the barges are loaded at the portage's foot.
5. **Cold Bay** is entered by the Cold Narrows, whose east bank is Northreach's.
6. **The Eastern Gulf:** Ranpur, Emberdeep and Kesh are on it and Ambrel is at its mouth. Tessaria reaches it by the
   Gullet and is not on it: "grain by sea" becomes grain up the Gullet.
7. **The Gulf of Sands:** Sabra, and a corner of Qadir. Sahrim is not on it.
8. **The Salt Sea** is Gorath's and Ulun's. Ulun's 60 ships are lake and river craft, and its "coast" is this shore and
   the channel's.
9. **Lakes under the map's grain** are not water on the grid: Skyhold's dry salt lakes and Lake Bluespire, Hrimfell's
   and Brannoch's tarns, Lake Nubako, Lake Ostec. Greyhaven, Northreach and Eldergrove touch no lake.

**B. Where realms lie**

10. **Varenna, Qadir, Sabra and Corvasse face the Western Ocean.** Varenna's coast is the Lion Gulf; its capital is at
    the Palella's mouth; Tibata is the harbour nearest the strait.
11. **Northreach is east of the Cold Narrows**, in one piece. Saltbridge is on the Stagflow; Wolfhaven is at its mouth.
12. **Drevna is north-west of Velgrad.** The Lakeland is at the head of the Rift. Compass words in Drevna's, Velgrad's
    and Greyhaven's texts change (the "Eastern March", "east of the lakes").
13. **Hrimfell is the north-eastern coast.** "The frozen eastern coast" becomes the frozen north-east.
14. **Ughrak has a sea coast**, the Silk Strand. The silk road begins at the beach.
15. **Greyhaven has no sea coast.** Its fleet, tolls and shipyards are the channel's.
16. **Tessaria is round the Grey Water**, on both sides of the Gullet's head. The corridor east of the lake is the north
    (Andros, the Dawn Church); Tessar and the cedar hills are the south (Livia, the Temple).
17. **Tamar's valley is walled by Sahrim's desert** on three sides. Abara and Tamar no longer touch.
18. **Gorath "of the southern grass"** is south of Aldmark, in the middle of the continent's northern half: a compass
    word that calls it southern fails.
19. **Qadir's "desert coast"** is a dry coast under the Sunwall; the desert proper is beyond the range.

**C. Neighbours that no longer touch, and how the tie still holds**

| Tie in the lore | On this map |
| --- | --- |
| Aldmark and Varenna, rivals | The Wolf clans' hills lie between them. They meet at the Albora Pass: the Amber Road and the Crown Road are one road, and the Warden lets Aldmark's wagons through |
| Aldmark and Brannoch, wary peace | Gorath's grass lies between. The tie is the Seven Halls and the Edict Brannoch refused |
| Aldmark and Greyhaven, allies; "ship oak from Greyhaven" | No sea way joins them. They flank the Grass Sea from west and east, which is the reason for the alliance. Aldmark's ship oak comes from the Oak Line shires and its masts from Eldergrove. Greyhaven's oak goes down the channel |
| Northreach and Brannoch, allies | A loan and a common fear of the empire; no border |
| Lucerna and Corvasse, Sabra, Qadir, Varenna | No sea joins them. The secret fifth of the dragon toll is paid in bills through the Ostran front house, as the lore already says. Sabra's oil comes by caravan over the Sabun Pass and down the Well Road to Janiya. Lucerna's rivalry with Qadir is over paper, grain and credit |
| "Admiral Castellan asks Lucerna for 20 galleys against Corvasse" | He asks for the gold and the crews for 20 galleys to be laid down at Varenna |
| "The Lucernan cog Golden Gull" sunk west of the Strait of Hael | A Varennan cog insured at Lucerna |
| Corvasse and Morhaven: "the sack of 1011" | Corsairs cannot sail to Morhaven. A corsair company hired on the Middle Sea and left unpaid is one way to keep the event; the engineer chooses |
| Qadir and Tamar: the Delta Wells; Qadir's imports from Tamar | Not neighbours. The quarrel is over wells in the delta that follow the Path of the Well and whose Keepers answer to Qadira. Tamar's linen rags and wheat cross the Red Waste by the Well Road, under Sahrim's escort |
| Qadir: "ship timber from the Holy Coast" | From the Crown Coast and Ashmere |
| Hrimfell and Velgrad: "pelts at the Ostmir fairs" | Not neighbours. The pelts cross Whale Sound to Dobin and come up the Lake Gate; Ostmir can be the fair at the Lake Portage, or the trade can pass through Drevna's hands |
| Abara and Tamar, allies | Sahrim's desert reach lies between. The river gift goes down the Monuti |
| Zanara and Kesh, rivals | Abara's lowlands and the Deep Green lie between. The quarrel is over the Eastern Road, as the lore says |
| Kesh: "spice up the Monuti through Tamar" | Up the Monundi to Abara, down the Koyako Stair, and down the Monuti: one route, as the lore has it |
| Skyhold's salt to Drevna and to Ranpur | North by Eaglespire across Ughrak's grass and the Lake Gate; south across the Free Marches and the Gullet |
| Irondeep's secret iron to Greyhaven | Through the Mammoth Downs and the Lakeland's edge |
| Ulun and Ughrak, friends; Gorath and Ughrak, rivals | Not neighbours. Horses go by the Yam Road, the channel and the Silk Road |
| Ulun's Sea Wind carrying horses "across the channel" to Santora | Down the Grey Water by boat from the Erkent landings and up the Santora, or over the Horse Gate |

**D. Numbers**

20. **Every realm's area** is in section 4.0. The land is 55% of the release's. Sahrim is still the largest realm on the
    map, by 3%; Varenna is second and is the largest by people. **Sylvaran is the eleventh, not the second.** Corvasse
    is the smallest, then Frostholm, Lucerna and Irondeep.
21. **Coastal provinces, fleets and harbours** follow the map. A fleet needs a coast: for that rule the Middle Sea, the
    Salt Sea and the Grey Water count as coasts, and the Grey Channel and the Gullet as ship water.
22. **Distances** in texts ("206 km in two days and a night", "about 170 km") should be checked against
    `design/build.json`. Anumba is 200 km east of Zanara, as the lore says.

**E. Engine constants and code that names geography**

23. `VM.VERSION` 4. `VM.OPTS`: `latTop` 65, `latBottom` 11. `VM.SEA_ID`, `VM.ISLE_RX`, `VM.COAST_RX`, `VM.ARID_REALM`
    and the oasis rules are not used for version 4: the design says where each realm is. `VM.INLAND_SEA` gives way to the
    design's `countsAsCoast` on each water.
24. The files the engineer's inventory lists under "code that hard-codes geography" are read against the design: beast
    habitats by province name still hold (provinces keep their names); regions and waters named in them move as above.
25. The title's words "from the western sea to the Sunrise Isles" are now literally the map.

## 8. The province plan, and how to build map version 4

### 8.1 The plan

There are 306 provinces: the 281 of the 34 realms and the 25 wilds, by the names, kinds and populations `LORE.map`
gives them. The design gives each:

- **its seat**: where its town stands (`design/seats.tsv`, a picture pixel and the reason; `design/build.json`, kilometres);
- **its cells**: `design/provinces.png`, exact;
- **its ground**: the engine's word, read from its settled core, and its cover, the grounds that fill it (`design/build.json`);
- **its neighbours** by land, and its sea links where it is an island or faces one;
- **the waters and rivers it touches.**

**How a realm is divided.** Seats are placed where towns have reasons to be: river mouths, confluences, fords, the foot
of a pass, the head of ship water, an oasis, a harbour. Each province is the land nearer its seat than any other, where
"nearer" counts the ground: a step costs `1 + 14 * height^2`, a border river or a drawn border line costs more to cross,
and water cannot be crossed. So a farmed lowland has many small provinces, a desert or steppe has few large ones, and a
province ends at the ridge or river that would be hard to govern across. The count in each realm is the lore's:

| Realm | Provinces | | Realm | Provinces | | Realm | Provinces |
| --- | ---: | --- | --- | ---: | --- | --- | ---: |
| Sylvaran | 22 | | Tamar | 6 | | Ranpur | 5 |
| Sahrim | 22 | | Stonehold | 6 | | Brannoch | 4 |
| Zanara | 22 | | Ughrak | 6 | | Ostra | 4 |
| Varenna | 21 | | Solenne | 5 | | Hrimfell | 4 |
| Aldmark | 20 | | Kesh | 5 | | Northreach | 3 |
| Velgrad | 14 | | Ashmere | 9 | | Morhaven | 3 |
| Abara | 14 | | Ulun | 8 | | Tessaria | 3 |
| Drevna | 13 | | Greyhaven | 8 | | Emberdeep | 3 |
| Gorath | 11 | | Qadir | 8 | | Ambrel | 3 |
| Eldergrove | 7 | | Sabra | 8 | | Frostholm, Corvasse | 2 each |
| | | | Skyhold | 8 | | Lucerna, Irondeep | 1 each |
| | | | | | | the wilds | 25 |

The full table of all 306, with seat, area, ground and reason, is `design/tables.md`.

### 8.2 The files

| File | Format |
| --- | --- |
| `design/provinces.png` | 700 x 450, one pixel a cell. `id = red + 256 * green - 1` (so 0 means no province); blue is 0 on land, 1 on an enclosed water, 2 on the sea. Read it with any PNG reader; the tool writes it without colour management |
| `design/ground.png` | 700 x 450. The ground's index is the low four bits of the red channel: 0 sea, 1 lake, 2 ice, 3 tundra, 4 rock, 5 taiga, 6 forest, 7 jungle, 8 grass, 9 scrub, 10 steppe, 11 desert, 12 ash, 13 marsh |
| `design/relief.png` | 700 x 450, grey. `height = grey / 360` in the engine's measure: 0 is sea level, 0.36 the alpine line, 0.5 the snow line. It is a guide: it says where the ground is high, not how the valleys run |
| `design/build.json` | `frame`, `transform`, `latitude`, `land`, `waters` (name, kind, `enclosed`, `countsAsCoast`, a point inside it in km, area), `realms` (capital and its province, area, waters, neighbours), `wilds`, `provinces` (seat in km, cells, ground, cover, height, `adj`, `sea`, waters, rivers, site), `rivers` (the line in km, `big`, `ships`, `boats`, `border`), `ranges`, `peaks`, `passes`, `regions`, `roads`, `seaLanes`, `isles`, `ferries`, `borders`, `checks` |
| `design/seats.tsv`, `design/features.json` | The authored sources of all of the above, in picture pixels. Change these and rerun the tool; never edit the built files |

### 8.3 What the engine needs, and where each thing comes from

`A.V2MAP.build` returns `w`. For version 4 it is filled from the design, with no call to `A.rand`:

| The engine's | From |
| --- | --- |
| `w.gw`, `w.gh`, cell | 700, 450, 10 km: unchanged |
| `w.grid` (the province of every cell, -1 on water) | `design/provinces.png` |
| `w.land`, `w.ocean` | The same file's blue channel |
| `w.prov[i]`: `id`, `pid`, `name`, `type`, `realm`, `pop`, `town`, `fort` | `LORE.map`, unchanged |
| `w.prov[i].sx`, `sy` (the seat) | `build.json` `provinces[i].seat` (`xKm`, `yKm`) |
| `w.prov[i].x`, `y`, `cells`, `adj` | Computed from the grid, as now. `build.json` has `adj` to check against |
| `w.prov[i].sea` | `build.json` `provinces[i].sea`: the ferries. Every island province has one |
| `w.prov[i].coast` | True when it touches the sea, or an enclosed water whose `countsAsCoast` is true (the Middle Sea, the Salt Sea, the Grey Water) |
| `w.prov[i].terr` | `build.json` `provinces[i].ground` |
| `w.prov[i].biome`, `elev` | From the ground and relief of its settled core (the mapping below) |
| `w.units` (the realms) | Each province's `realm`; the capital is `build.json` `realms[].capital.province` |
| `w.gen.elev` (467 x 300) | `design/relief.png` scaled down, with the engine's own fine noise added below the guide's grain, then cut so that every authored river runs downhill along its line to its mouth |
| `w.gen.biome` | `design/ground.png` scaled down, through the mapping below. Where the engine's climate model disagrees with the design's ground, the design wins |
| `w.gen.temp`, `w.gen.moist` | The engine's climate model with the design's latitudes and heights; `moist` is then raised or lowered to agree with the ground (desert dry, jungle wet) |
| `w.rivers`, `w.riv`, `w.gen.acc`, `w.gen.flowTo` | `build.json` `rivers`: each line in km. Flow grows along the line; a `big` river ends at ten times a small one's flow and a `ships` river at twenty. Smaller streams may be grown by the engine from the cut height field, but none may contradict an authored river or cross a realm border that follows a ridge |
| `w.waterNames` | `build.json` `waters`: each enclosed water is the one that contains the water's point (`km`). Sea names: the engine's D9 sectors take the four oceans' names; the gulfs, bays, straits and sounds are the waters whose points lie in them |
| Names of rivers, ranges, passes, regions | `build.json`. D9 gives these names first and draws from C7's pools only for what the design leaves unnamed |

**Ground to the engine's biomes**

| Design ground | `BIOME` (v2 engine) | The release's biome word | `terr` when it fills the core |
| --- | --- | --- | --- |
| ice | SNOW | Glacier | mountains |
| rock | ALPINE | Alpine highland | mountains |
| ash | ALPINE on the heights, SCRUB below | Alpine highland; Dry woodland | hills |
| tundra | TUNDRA | Tundra | tundra |
| taiga | BOREAL_FOREST | Taiga | forest |
| forest | TEMPERATE_FOREST | Temperate forest (Temperate rainforest on the Elder Coast) | forest |
| jungle | RAINFOREST | Tropical rainforest | forest |
| grass | GRASSLAND | Temperate forest north of 35 degrees, Dry woodland south of it | plains |
| scrub | SCRUB | Dry woodland north of 30 degrees, Savanna south of it | plains |
| steppe | STEPPE | Steppe | steppe |
| desert | DESERT | Desert (Salt flat at Zarak and on the Salt Sea's edge) | desert |
| marsh | WETLAND | Marsh | marsh |

A province is `hills` when its core stands at 0.3 or more on the height guide and is not mostly rock or ice.

### 8.4 The steps

1. Add `data/map/design/` (or read from `docs/design/m1/design/`): the three rasters and `build.json`. They are data,
   put on the page as `A.DATA`, small enough to ship: the three PNGs are 160 kB together, and `build.json` can be cut
   to what the engine reads.
2. In `VM.build`, for `v >= 4`: read the grid and masks; take provinces from `LORE.map` with the design's seats; skip
   `grow()` (the grid already says which cell is whose).
3. Make `gen.elev` from the relief guide: scale to 467 x 300, add noise with a fixed seed string (never `A.rand`), carve
   the authored rivers, and keep every land cell above sea level and every water cell below it.
4. Make `gen.biome` from the ground raster; run the climate model for `temp` and `moist` and pull `moist` to the ground.
5. Fill `w.rivers` from the authored lines; grow lesser streams from the carved field if wanted.
6. Fill `w.waterNames`, the names of ranges, rivers, passes and regions.
7. Read each province's `terr`, `biome`, `elev`, `coast`, `adj` and `sea`.
8. Run `tools/m1/facts.mjs` and the lore lint against the new map, and begin the lore pass from section 7.

### 8.5 Tests the build should hold

- **The design is the map.** Every cell's province in `w.grid` is the design's. Every seat is on land in its own province.
- **One continent.** The mainland holds 98% of the land (124,287 of 126,642 cells). The 53 islands are the design's; the
  largest is Great Amber (about 1,010 cells). No land touches the frame: the nearest is 200 km from it. The v2 engine's
  unit test for generated seeds asks for 98.5% and islands under 0.13% of the grid; the designed map needs its own
  numbers, because the owner's picture has more islands than a seed gives.
- **No enclave, no exclave.** No realm has one neighbour and no coast; no realm's land on one landmass is in two parts.
- **Province counts.** Each realm has the provinces `LORE.map` gives it.
- **Rivers run downhill** along their authored lines to their mouths, and none ends inland except in the Salt Sea and
  the Middle Sea.
- **Every water is named:** each enclosed water of 25 cells or more has a name from the design.
- **Determinism.** Two builds give the same bytes; nothing draws `A.rand`.
- **Old saves.** A save made on map version 1, 2 or 3 rebuilds on its own version, as now.

## 9. Questions only the owner can answer

1. **The scale.** The picture's scale bar says 2,000 km is about a fifth of the continent's width, which makes the land
   9,500 km across: larger than the game's whole frame. The design keeps the game's frame and reads the bar as ornament,
   so the continent is 5,260 km across. If the owner means the larger land, the grid, every march and every distance in
   the game must change with it. Which is it?
2. **The Middle Sea.** The design makes it the long central lake exactly as drawn: 640 km long, a little larger than Lake
   Erie, with six realms on it. The release's Middle Sea was the heart of the world and several times larger. If the owner
   wants a greater sea, the natural way is to let it grow south over its own old bed, the northern Red Waste, which
   changes the middle of his picture. Keep the lake as drawn, or widen it?
3. **The western realms on the ocean.** Following from 2: Varenna, Qadir, Sabra and Corvasse now face the Western Ocean,
   and Lucerna can no longer sail to them. Is that acceptable, or should the west coast be given a great gulf so that
   they share one sea with each other (they would still not share it with Lucerna)?
4. **Islands.** The picture has about fifty islands and the design keeps them. It also cuts the picture's channel through
   so that Great Amber is an island, and widens one islet into Frostholm. The owner's earlier rule was one connected
   landmass. Are coastal islands within that rule, and are these two edits wanted?
5. **The Grey Channel as a river.** The lore's channel was an arm of the sea with tides and sea-going fleets. The picture
   draws a river between two lakes. The design follows the picture. Is a great river acceptable as the Grey Channel?
6. **Three realms that moved:** Northreach to the east side of the Cold Narrows, Drevna to the north-west of Velgrad,
   Ughrak onto the east coast with silk coming by sea. Each follows from where the picture puts the water and the
   mountains. Any objection?
7. **Sizes.** Varenna and Sahrim are nearly equal and far larger than the rest; Sylvaran is middle-sized; Tessaria,
   Morhaven, Northreach and Emberdeep are two or three times their lore size because the ground they sit on is large.
   Should any be held nearer its lore size by giving ground to a wild or a neighbour?
8. **The wilds.** The Free Marches are good green land left to no realm, as the lore has them. The Mammoth Downs, the
   Ashlands and the snow fells are the other large ones. Is any of these land the owner wants a realm to hold?
9. **New names.** The 46 names in section 5 are the design's. Any the owner dislikes?
