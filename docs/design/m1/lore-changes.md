# M1: what the lore says now (order 71; D-151, D-153, D-155)

Every change made to the world's words to bring them into line with the one map, map version 4 (`docs/design/m1/map-design.md`, section 7).
Each row gives the old words, the new words and why. "Places" counts how many times the old words stood in that file. Written by
`node tools/m1/lore-apply.mjs` from `tools/m1/lore-edits.mjs`. `tools/lint-lore-map.mjs` holds the words to the map from now on.

**90 changes in 9 files.**

## `src/core/release/content/12-ww.js`

| Old words | New words | Places | Why |
| --- | --- | ---: | --- |
| Highland March | Hill March | 2 | 4.32: Great Amber's interior (the Amber Wilds) is hill forest; the map has no highlands there |
| Highland Spears | Hill Spears | 1 | 4.32: Great Amber's interior (the Amber Wilds) is hill forest; the map has no highlands there |

## `src/core/release/content/18-cm.js`

| Old words | New words | Places | Why |
| --- | --- | ---: | --- |
| route = p=>{const r=ROUTE[p.realm]\|\|["the Middle Sea lanes","wine, oil and cloth","Lucerna"] | route = p=>{const r=ROUTE[p.realm]\|\|["the Coast Road","wine, oil and cloth","Lucerna"] | 1 | A1: a realm off the Middle Sea does not trade by its lanes; the default route is the Coast Road (18-cm's table) |
| "POL-01": "Kingsmere", | "POL-01": "Easterham", | 1 | Aldmark's port is on Cold Bay (Easterham), not Kingsmere, which stands inland |
| FAR = ["Amberport","Kesh","Tamar","Wolfhaven","Qadira","Sabra","Lucerna","Ostra","Greyhaven","Felano"],       farPort = p=>A.pick(FAR.filter(x=>x!==port(p))), | FAR = ["Amberport","Kesh","Tamar","Wolfhaven","Qadira","Sabra","Lucerna","Ostra","Greyhaven","Felano"],       INLAND = ["Tamar","Lucerna","Ostra","Felano","Solenne"],       farPort = p=>{const h=port(p),m=INLAND.includes(h),l=FAR.filter(x=>x!==h&&INLAND.includes(x)===m);return A.pick(l.length?l:FAR.filter(x=>x!==h))}, | 1 | A1: the Middle Sea's ports (Tamar, Lucerna, Ostra, Felano, Solenne) have no way to the ocean; a far port is one the ship can reach |
| marches: ["the Free Marches","forest plateau in twenty-three pieces that nine realms claim and none hold"], | marches: ["the Free Marches","forested lowland between the Gullet, the Roof and the Ember Mountains that four realms deny to each other"], | 1 | 4.35: the Free Marches as designed |
| "good oak country that giants, orcs and Eastfolk all forbid each other to plough", | "the forest cape east of Whale Sound, beyond the Truce of Dobin, where whalers and trappers come and nobody rules", | 1 | 4.35: the Whale Woods as designed |
| "cold high steppe and the Worldspine passes, where the air itself sickens lowlanders", | "bare coast mountains north-east of the Roof, too poor to feed a garrison", | 1 | 4.35: the High Wastes as designed |
| amber: ["the Amber Wilds","cloud forest held by the Cloudfolk against every sultan"], | amber: ["the Amber Wilds","the hill forest of Great Amber, where the sultan's writ stops at the gardens"], | 1 | 4.35: the Amber Wilds as designed |
| bone: ["the Bone Coast","a fog-bound shore of wrecks and fishing camps with no water at all"], | bone: ["the Bone Coast","a desert headland west of the Gulf of Sands, with no water at all"], | 1 | 4.35: the Bone Coast as designed |
| burning: ["the Burning Waste","salt pans, lava fields and wells that turn salty in a season"], | burning: ["the Burning Waste","bare ranges between the Long Rift and the Worldspine with no wells"], | 1 | 4.35: the Burning Waste as designed |
| green: ["the Deep Green","rainforest that kills outsiders with fever"], | green: ["the Deep Green","the rainforest cape that kills outsiders with fever"], | 1 | 4.35: the Deep Green as designed |
| western: ["the Western Highlands","wet fells under Mount Brand, where the clans pay tax to nobody"], | western: ["the Western Hills","the coast heights between the Elder Coast and Ashmere, where the clans pay tax to nobody"], | 1 | 4.35: the Western Highlands are coast heights (hills on the map) |
| ash: ["the Ashlands","good ash soil that every faith in the west calls cursed"], | ash: ["the Ashlands","the peninsula under Mount Hael, good ash soil that every faith in the west calls cursed"], | 1 | 4.35: the Ashlands as designed |
| pinewild: ["the Pinewild","endless taiga and bog where trappers winter and nobody rules"], | pinewild: ["the Pinewild","pine fells between Cold Bay and the Frostfells where trappers winter and nobody rules"], | 1 | 4.35: the Pinewild as designed |
| thorn: ["the Thornveld","thorn scrub on the army road south of the Neck"], | thorn: ["the Thornveld","thorn scrub at the dry head of the south-east peninsula"], | 1 | 4.35: the Thornveld as designed |
| thorn: ["the Thornveld","thorn scrub at the dry head of the south-east peninsula"], | thorn: ["the Thornveld","thorn scrub at the dry head of the south-east peninsula"],         mammoth: ["the Mammoth Downs","poor downs between Northreach, the Crossmarch and the Pinewild, too poor to tax and a road for iron smugglers"],         lunora: ["the Lunora Woods","wooded hills north of the Santora, raided through the Horse Gate too often to farm"],         firststone: ["the Firststone Hills","the ash plain at the west end of the Glenmere, where four realms keep each other off"],         bleakfold: ["the Bleakfold","bare heights behind the coast hills, where a watch tower would starve"],         mirun: ["the Mirun Pines","pine hills where three realms meet and none will let another fortify"],         dobava: ["the Dobava Wilds","bandit heights above the Neck road"],         stairwood: ["the Stairwood","a forest stair too steep to farm, left empty on purpose"], | 1 | 4.35: the wilds the realms touch on the map, which the table did not have |
| "POL-14": "marches", | "POL-14": "frostfells", | 1 | 4.35: POL-14's wild on the map |
| "POL-28": "wastes", | "POL-28": "burning", | 1 | 4.35: POL-28's wild on the map |
| "POL-29": "wastes", | "POL-29": "marches", | 1 | 4.35: POL-29's wild on the map |
| "POL-30": "wastes", | "POL-30": "marches", | 1 | 4.35: POL-30's wild on the map |
| "POL-25": "frostfells", | "POL-25": "stairwood", | 1 | 4.35: POL-25's wild on the map |
| "POL-19": "bone", | "POL-19": "burning", | 1 | 4.35: POL-19's wild on the map |
| "POL-20": "burning", | "POL-20": "mirun", | 1 | 4.35: POL-20's wild on the map |
| "POL-21": "green", | "POL-21": "thorn", | 1 | 4.35: POL-21's wild on the map |
| "POL-05": "western", | "POL-05": "ash", | 1 | 4.35: POL-05's wild on the map |
| "POL-06": "western", | "POL-06": "bleakfold", | 1 | 4.35: POL-06's wild on the map |
| "POL-01": "pinewild", | "POL-01": "mammoth", | 1 | 4.35: POL-01's wild on the map |
| "POL-10": "pinewild", | "POL-10": "mammoth", | 1 | 4.35: POL-10's wild on the map |
| "POL-11": "pinewild", | "POL-11": "mammoth", | 1 | 4.35: POL-11's wild on the map |
| "POL-12": "pinewild", | "POL-12": "lunora", | 1 | 4.35: POL-12's wild on the map |
| "POL-15": "marches", | "POL-15": "lunora", | 1 | 4.35: POL-15's wild on the map |
| "POL-16": "burning", | "POL-16": "lunora", | 1 | 4.35: POL-16's wild on the map |
| "POL-24": "bone", | "POL-24": "mirun", | 1 | 4.35: POL-24's wild on the map |
| "POL-13": "pinewild",       },       wild = p=> | "POL-13": "firststone",         "POL-02": "firststone",         "POL-04": "lunora",         "POL-33": "ash",       },       wild = p=> | 1 | 4.35: the nearest wild on the map for Brannoch, Solenne, Lucerna and Corvasse (Solenne and Lucerna had none, so the Free Marches at the far side of the land) |

## `src/core/release/core/00-lore.json`

| Old words | New words | Places | Why |
| --- | --- | ---: | --- |
| The Red Waste, the Burning Waste, the Gulf of Sands | The Red Waste and the Burning Waste; the shores of the Gulf of Sands | 1 | A7: Sahrim is not on the Gulf of Sands, Sabra is |
| Merchants of the Middle Sea believe a great fire-dragon guards the Corsair Isles | Merchants of the western coasts believe a great fire-dragon guards the Corsair Isles | 1 | A1, A2: the Middle Sea is inland; the Corsair Isles are on the Western Ocean, and Lucerna pays its fifth in bills |
| grain by sea; | grain up the Gullet; | 1 | A6: Tessaria reaches the Eastern Gulf by the Gullet, not by sea |
| tin from Frostholm by way of Northreach;ship oak from Greyhaven; | tin from Frostholm by way of Northreach;masts from Eldergrove; | 1 | Ties: no sea way joins Aldmark and Greyhaven; Aldmark's ship oak is its own (the Oak Line shires), its masts Eldergrove's |
| linen rags from Tamar;wheat from Tamar;ship timber from the Holy Coast; | linen rags from Tamar by the Well Road;wheat from Tamar by the Well Road;ship timber from the Crown Coast and Ashmere; | 1 | Ties: Qadir and Tamar are not neighbours and share no sea; Qadir's ship timber comes from the Crown Coast and Ashmere |
| A scarred Grey Leviathan bull rams and sinks the Lucernan cog Golden Gull, 180 tonnes, west of the Strait of Hael. | A scarred Grey Leviathan bull rams and sinks the Golden Gull west of the Strait of Hael: a cog out of Varenna, 180 tonnes, insured at Lucerna. | 1 | Ties: Lucerna's ships cannot reach the Strait of Hael; the cog is Varenna's, the policy Lucerna's |
| Admiral Castellan asks Lucerna for 20 galleys against Corvasse | Admiral Castellan asks Lucerna for the gold for 20 galleys against Corvasse | 2 | Ties: no sea joins Lucerna and Corvasse; Lucerna pays for galleys laid down at Varenna |
| Tibata Strait Tower | Tibata Bay Tower | 1 | As above |
| nosebleeds in the highlands, | nosebleeds on high ground, | 1 | Zanara's blood: the strain is the body's, wherever the carrier stands; Zanara has little high ground |
| sick on the Lake Calia ferry | sick on the Skardush ferry | 1 | The map has no Lake Calia; the road down from Brannoch to the Sunland fairs crosses the Skardush |
| They cannot serve abroad by sea or cross lakes. | They cannot serve abroad by sea or cross open water. | 1 | A9: Brannoch's tarns are under the map's grain; the trait is the body's |
| Nimrael was born about 200 BR at Mirlas, among the night fishers of Lake Silara. | Nimrael was born about 200 BR at Mirlas in the Evenwood, among the night fishers of Lake Silara. | 1 | Lake Silara is Sylvaran's (the Evenwood); the bloodline is Eldergrove's, its first bearer born across the border |
| The orc clans of the southern grass, held together by the Line of Gorath: | The orc clans of the Grass Sea, held together by the Line of Gorath: | 1 | B18: Gorath lies in the north-centre, south of Aldmark: no longer "southern" |
| The Grass Sea (Horde of Gorath) and the Eastern Steppe (Ughrak); | The Grass Sea (Horde of Gorath); Ughrak's eastern steppe; | 1 | B14: the orc homelands; the eastern steppe is Ughrak's, on the north-east coast |
| The giant kingdom of the frozen eastern coast: | The giant kingdom of the frozen north-east coast: | 1 | B13: Hrimfell is the north-eastern coast |
| The sultanate of passes and galleys on the desert coast: | The sultanate of passes and galleys on the dry coast under the Sunwall: | 1 | B19: Qadir's coast is dry; the desert proper is beyond the range |
| Highland March | Hill March | 1 | 4.32: Great Amber's interior (the Amber Wilds) is hill forest; the map has no highlands there |
| Highland Spears | Hill Spears | 2 | 4.32: Great Amber's interior (the Amber Wilds) is hill forest; the map has no highlands there |
| Warden of the Highlands | Warden of the Hills | 3 | 4.32: Great Amber's interior (the Amber Wilds) is hill forest; the map has no highlands there |
| Ambrel highlands | Ambrel hills | 1 | 4.32: Great Amber's interior (the Amber Wilds) is hill forest; the map has no highlands there |
| Ambrel (highland march) | Ambrel (hill march) | 1 | 4.32: Great Amber's interior (the Amber Wilds) is hill forest; the map has no highlands there |

## `src/core/release/lore/01-cast.json`

| Old words | New words | Places | Why |
| --- | --- | ---: | --- |
| and fir masts for the Cold Bay fleet without paying hard coin. | and fir masts for Aldmark's Cold Bay fleet without paying hard coin. | 1 | A5: Cold Bay and its fleet are Aldmark's, not Irondeep's |
| Wants the Lake Council to release | Wants Drevna's Lake Council to release | 1 | B12: the Lake Council is Drevna's, on the Western Lakes; Ughrak has no lake |
| Warden of the Highlands | Warden of the Hills | 1 | 4.32: Great Amber's interior (the Amber Wilds) is hill forest; the map has no highlands there |

## `src/core/release/lore/02-families.json`

| Old words | New words | Places | Why |
| --- | --- | ---: | --- |
| In May 1088 the leviathan Old Ironjaw sank the cog Golden Gull west of the Strait of Hael, and the Sicurani had written her. | In May 1088 the leviathan Old Ironjaw sank the Golden Gull, a cog out of Varenna that the Sicurani had written, west of the Strait of Hael. | 1 | Ties: as above |
| Leandro wants a share in the 20 galleys Castellan asks of Lucerna. | Leandro wants a share in the 20 galleys Castellan asks Lucerna to pay for. | 1 | Ties: as above |
| He will sail with Castellan to Lucerna on 1 April to ask for 20 galleys. | He will ride with Castellan to Lucerna on 1 April to ask for the gold for 20 galleys. | 1 | Ties: as above; Varenna reaches Lucerna by the Coast Road |
| would carry the Varenna contingent across the Middle Sea. | would carry the contingents that come down the Coast Road across the Middle Sea. | 1 | B10: Varenna faces the Western Ocean; its men reach the Middle Sea by the Coast Road |
| Ulbike is offered a place on a Greyhaven ship bound for the Middle Sea. | Ulbike is offered a place on a Greyhaven barge bound down the Grey Channel. | 1 | A3, B15: Greyhaven's ships are the channel's; no water joins the channel and the Middle Sea |
| Carried Prince Tancred's unsigned warning across the Grey Channel in November 1104. | Carried Prince Tancred's unsigned warning over the Horse Gate in November 1104. | 1 | A3: Morhaven is on the Middle Sea, not the Grey Channel; the Horse Gate is its way east |
| The family has captained the kings' galleys since and fought the Tamari and Corvasse on the Middle Sea. | The family has captained the kings' galleys since, on the Grey Water and down the Gullet. | 1 | B16, A1: Tessar stands on the Grey Water; its galleys have no way to the Middle Sea, and Corvasse's none to it |
| Tessar imports its bread by sea and the queen's galleys guard the cogs. Captain Lucan Salvane has run grain from Morhaven and Ostra all winter. | Tessar brings its bread up the Gullet and the queen's galleys guard the barges. Captain Lucan Salvane has run grain from Ranpur and Kesh all winter. | 1 | A6: Tessaria's grain comes up the Gullet from the Eastern Gulf; Morhaven and Ostra are on the inland Middle Sea |
| Tibata Strait | Tibata Bay | 5 | 5: the lore's Tibata Strait is the mouth of Tibata Bay, Varenna's harbour nearest the Strait of Hael |
| She wants the chain replaced with iron from Irondeep, and her father calls it the first step to a human harbor. | Her father calls it the first step to a human harbor; she wants the chain replaced with iron from Irondeep. | 1 | The harbour is Eldergrove's, the iron Irondeep's (inland) |
| Highland March | Hill March | 1 | 4.32: Great Amber's interior (the Amber Wilds) is hill forest; the map has no highlands there |
| Highland Spears | Hill Spears | 7 | 4.32: Great Amber's interior (the Amber Wilds) is hill forest; the map has no highlands there |
| Ruhu Highlands | Ruhu Hills | 2 | 4.32: Great Amber's interior (the Amber Wilds) is hill forest; the map has no highlands there |
| highlands above Ruhu | hills above Ruhu | 1 | 4.32: Great Amber's interior (the Amber Wilds) is hill forest; the map has no highlands there |
| highland forests | hill forests | 1 | 4.32: Great Amber's interior (the Amber Wilds) is hill forest; the map has no highlands there |
| highland cow | hill cow | 1 | 4.32: Great Amber's interior (the Amber Wilds) is hill forest; the map has no highlands there |
| highland hunters | hill hunters | 1 | 4.32: Great Amber's interior (the Amber Wilds) is hill forest; the map has no highlands there |
| highland sergeants | hill sergeants | 1 | 4.32: Great Amber's interior (the Amber Wilds) is hill forest; the map has no highlands there |

## `src/core/release/lore/03-houseDeep.json`

| Old words | New words | Places | Why |
| --- | --- | ---: | --- |
| 300,000 suns to Greyhaven for its galley fleet, and the shipowners of the Middle Sea. | 300,000 suns to Greyhaven for its channel galleys; and the shipowners of the Middle Sea. | 1 | A3: Greyhaven's galleys are river galleys; the Middle Sea's shipowners are Lucerna's neighbours, not Greyhaven's |
| Highland March | Hill March | 3 | 4.32: Great Amber's interior (the Amber Wilds) is hill forest; the map has no highlands there |
| Highland Spears | Hill Spears | 1 | 4.32: Great Amber's interior (the Amber Wilds) is hill forest; the map has no highlands there |
| Warden of the Highlands | Warden of the Hills | 3 | 4.32: Great Amber's interior (the Amber Wilds) is hill forest; the map has no highlands there |

## `src/core/release/lore/04-styles.json`

| Old words | New words | Places | Why |
| --- | --- | ---: | --- |
| Mag Brine burned three Lucernan ships in the Strait and gave the Middle Sea its dragon | Mag Brine burned three Varennan ships in the Strait and gave the western sea its dragon | 1 | A1, A2: the Strait of Hael is on the ocean; Lucerna's ships cannot reach it |
| a Stonefoot cannot cross a lake or a swaying bridge | a Stonefoot cannot cross open water or a swaying bridge | 1 | As above |
| Highland March | Hill March | 2 | 4.32: Great Amber's interior (the Amber Wilds) is hill forest; the map has no highlands there |
| Highland Spears | Hill Spears | 1 | 4.32: Great Amber's interior (the Amber Wilds) is hill forest; the map has no highlands there |
| Highland Spear | Hill Spear | 1 | 4.32: Great Amber's interior (the Amber Wilds) is hill forest; the map has no highlands there |
| Warden of the Highlands | Warden of the Hills | 1 | 4.32: Great Amber's interior (the Amber Wilds) is hill forest; the map has no highlands there |
| highlands of Great Amber | hills of Great Amber | 1 | 4.32: Great Amber's interior (the Amber Wilds) is hill forest; the map has no highlands there |

## `src/core/release/lore/05-academies.json`

| Old words | New words | Places | Why |
| --- | --- | ---: | --- |
| the price of a prize in every coin of the Middle Sea. | the price of a prize in every coin of the western coasts. | 1 | A2: Corvasse is on the Western Ocean |

## `src/events/40-memory-regional-b/regional-b.events.js`

| Old words | New words | Places | Why |
| --- | --- | ---: | --- |
| Ambrel highlands | Ambrel hills | 1 | 4.32: Great Amber's interior (the Amber Wilds) is hill forest; the map has no highlands there |

## Names the map gives in play (no text changed)

An oasis the design set off dry ground is a town named for its water (D-061's rule, D-154). The lore keeps the release's name as the
place's identity: a house seated there finds its seat by either name and is shown by the new one (`A.provOfSeat`, `A.seatName`).
Read from `data/map/one-continent.json`.

| The release's name | On the map | Realm | Houses seated there |
| --- | --- | --- | --- |
| Rushzag Oasis | Rushzag Wood | Horde of Gorath | The Owlmask drummers (FX11-003); The Goatpath line (FX11-013); The Reedboat line (FX11-014) |
| Kagdush Oasis | Kagdush Ford | Horde of Gorath | The Ladderhand line (FX11-005); The Breadbreakers of Graknak (FX11-017) |
| Zabesh Oasis | Zabesh Hill | Sahrim Confederacy | the Chiefs of Clan Khaiya (FX19-006) |
