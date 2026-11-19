# The one continent of Ardan: the design (map version 4)

**Draft in progress (work/m1-design).** This page is being written; the working notes below hold the decisions made so
far, so that nothing is lost between sessions. The finished page replaces them.

## Working notes

**Orders:** 68 (one fixed continent), 69 (the map in depth, M2), 71 (lore follows the map), 72 (one designed map, clean,
no enclave), 73 (the owner's picture, `reference/owner-continent.webp`). **Decisions:** D-142, D-151, D-152, and D-153
(reserved for this design: how the picture and the lore are reconciled).

**The frame.** The game's frame stays 7,000 x 4,500 km, a 700 x 450 grid of 10 km cells. The picture (1536 x 1024) is laid on
it at one scale, 4.27 km a pixel, its continent centred: `km = (229.2 + 4.27 px, 78.7 + 4.27 py)`. The continent is then
about 5,300 km across and 4,100 km north to south, 12.6 million km2 (125,700 cells, 40% of the frame). The picture's scale
bar (2,000 km over 277 px) would make it 9,500 km across; the game's distances, marches and provinces all stand on 10 km
cells, so the design keeps the game's scale and reads the bar as ornament. Listed for the owner.

**The reading (D-153).** The picture is the release's world with its seas half drained: every realm sits where the release
put it, and the land has closed over the Middle Sea. Laying the release's map on the picture by position puts Ashmere on
the red volcano, Varenna on the south-west lowland, Ostra on the central lake, the Grey Channel on the line of the great
north-eastern lake and the eastern lake, the Salt Sea on the steppe lake, Northreach at the northern inlet, Irondeep on
the brown range beside it, the Red Waste on the desert, Abara on the dry south-eastern range, Kesh on the south-east
peninsula, Sabra on the south-west bay.

- **The Middle Sea** is the picture's long central lake between the Crown Range and the desert: a brackish inland sea, the
  last water of the old sea whose dry bed is the Red Waste. Solenne, Lucerna and Ostra on its north shore, Morhaven at its
  east end, the Monuti's delta (Tamar) and Sahrim's harbours on its south shore.
- **The lands the old Middle Sea's western end touched** stand on the Western Ocean: Varenna (the Lion Gulf), Qadir (the
  Sunwall coast), Sabra (the Gulf of Sands, the south-west bay), Corvasse (the two isles off the western cape; the Strait
  of Hael is the passage between the cape and the isles; the Ashlands and Mount Hael are the western peninsula under the red
  volcano).
- **The Salt Sea** is the steppe lake. **Cold Bay** is the northern lake, opened to the sea by the Cold Narrows. **Lake
  Silara** is the north-western lake, the Calara its outlet. **The Glenmere** (Varenna's Northern Lakes) is the long western
  lake, the Glenwash's source.
- **The Lakeland** is the great north-eastern lake (the Western Lakes), Drevna round it. **The Grey Channel** is the water
  that leaves it: the Tolek, the channel proper running south between Greyhaven and Velgrad, the Grey Water (the eastern
  lake) and the Gullet down to the Eastern Gulf. It runs fresh and grey with snow-melt; its "tide" is the daily melt flood.
- **The Worldspine** is the northern half of the south-eastern dry range (Stonehold), the Highveld its southern half
  (Abara); the Roof is the east-coast highland (Skyhold); the Ember Mountains the snowy cape (Emberdeep); the Frostfells the
  snow range of the north coast (the Pinewild, the Frostfells, Hrimfell's White Coast); the East Rift Heights the snowy
  spur (Velgrad); the Iron Mountains the brown range by Cold Bay; the Tusk Hills the small snowy range east of Lake Silara;
  the Crown Range the east-west ridge; the Marble Mountains the ring ranges north-west of the desert; the Sunwall and the
  Southern Hills the red hills south of it.

**Edits to the picture** (each listed for the owner): the Cold Narrows cut two cells wide; the Amber Strait cut across the
neck of the south-east peninsula (the picture already draws a channel there); Frostholm drawn as one island from two
islets. Nothing else moves.

**Data.** `design/seats.tsv` (the 306 provinces re-seated), `design/features.json` (waters, rivers, ranges, passes, roads,
border lines). `tools/m1/design-sketch.mjs` builds the grid from the picture and the data and draws the sketches.
