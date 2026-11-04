# World foundations: building an Asia-sized Ardan from the ground up

**What this is.** A research brief and a framework for the tenfold expansion of Ardan's world. The owner asked for a map and continent "significantly bigger, at least the size of Asia", "many more countries, kingdoms, beasts, fighting styles", "details in every possible aspect tenfold", and a lore that works "like a never-ending web": strongest warriors, armies, social constructs. The audience is 13 to 23.

**How to use it.** Read it top-down. Each layer ends with **rules** (what drives the next layer down) and **targets** (how many of each thing, and why). The last two sections are a gap analysis of Ardan today and a step-by-step recipe for the implementers.

**Sources.** Web research is cited inline and listed at the end. Ardan's numbers come from the game's own data (`LORE` in the core blob, the lore blob, `features/47-realm-bible`, `features/76-beast-habitats`) and from the private world bible in `canon/`, which is summarized here and never quoted.

**Hard limits this framework keeps** (they come from the world bible's house rules and the game):

- No magic. Beasts are animals, however large; every wonder has a natural truth under its belief.
- Technology stops at Earth about 1100–1250: mail, crossbows, traction and early counterweight trebuchets, no gunpowder, no printing.
- Five peoples (humans, elves, dwarves, orcs, giants) plus half-elves and half-orcs. The world is frozen at dawn on 1 January 1105 AR.
- Canon prose has no fighter ranks or numbered tiers. The game's ladder exists as hidden math, and the world talks about reputations.
- Speed is the speed of legs, hooves and wind. That rule is the expansion's best friend: a bigger world is a world where news is older and more often wrong, which is the game's north-star line ("the chroniclers will get you wrong").

---

## 0. The size question: what "as big as Asia" means for Ardan

| Measure | Earth | Ardan today |
| --- | --- | --- |
| Asia | about 44.6 million km² ([Britannica Kids](https://kids.britannica.com/students/article/Asia/110518)); mean elevation 915 m because of the high central plateaus ([Cambridge, *World Geomorphology*](https://resolve.cambridge.org/core/books/world-geomorphology/asia/883DA41243FD07B878096756370C9B47)) | |
| Eurasia | about 55 million km² | |
| The Known World | | A box 7,000 km east to west and 4,500 km north to south, 54.5°N to 14°N, with **22.8 million km²** of land: the Westland (8.6M), the Southland (about 8M inside the box), the Eastland (about 5.4M inside the box) and islands (0.7M) |
| The game map | | 700 × 450 cells of 10 km (the same box), **306 provinces**, 34 realms claiming 18.1M km², about 101 million people |

So today's whole world is about half of Asia, and no single landmass is a fifth of it.

**The frame this brief recommends: the Known World is the western end of a much larger continent.** Europe is a peninsula on the end of Eurasia, and the Known World can be the same. Canon already points this way, and it costs no retcon:

- The Southland and the Eastland both continue past the map's south and east edges.
- Silk comes from somewhere past the east edge, along the Silk Road of the east (trade route TR-09) through the Tusk Clans, Drevna and Velgrad. Nobody in the Known World knows where it is made.
- The Western Ocean has never been crossed and returned.
- Dwarves came down from the Roof about 3,000 years ago. Giants once lived across the whole north. Orcs have held the Grass Sea since about 1500 BR. Each of these is a door to "where they came from".

**Proposed sizes** (to be set by the geography pass, not by fiat):

| Landmass | Today | Proposed | Model |
| --- | --- | --- | --- |
| Westland | 8.6M km² | 8.6M (unchanged) | Europe |
| Eastland, including the new Far Lands east and north of today's edge | 5.4M inside the box | **about 37M** | Asia without the Indian subcontinent |
| **The Great Continent** (Westland + Eastland, split only by the narrow Grey Channel, the way Europe and Asia are split by a convention) | 14M | **about 46M**, larger than Asia | Eurasia |
| Southland | about 8M inside the box | about 14M (south across the equator to about 5°S) | North and East Africa, Arabia |
| Islands | 0.7M | about 3.8M (a southeastern archipelago, an eastern island chain, northern isles) | Maritime Southeast Asia, Japan, the Arctic isles |
| **All land** | 22.8M | **about 64M** | Eurasia plus North Africa |

**The map box.** About 17,000 km east to west and 8,900 km north to south: from about 75°N (an Arctic coast) to about 5°S, and three Known Worlds wide. That is roughly 42% land, close to Earth's northern hemisphere. **Keep canon coordinates as they are:** `x` keeps counting east from today's west edge and `y` keeps counting south from today's north edge. New lands get `x > 7,000`, `y > 4,500` or `y < 0`. No existing place moves.

**Population.** Earth's estimates for 1300 run from about 360 to 432 million ([Wikipedia, *Estimates of historical world population*](https://en.wikipedia.org/wiki/Estimates_of_historical_world_population)). The Known World's 101 million stays. The Far Lands should add about 250 million, most of it in two places: the river basins of the far east and the monsoon south (see 1.4). Total: about **350 million**.

**Travel time is the payoff.** At canon speeds a walker crosses 7,000 km in 8–10 months. At 17,000 km the far east is about two years away on foot, and a relay courier takes over three months where relays exist. News from the far end of the continent arrives one to three years late and is usually wrong. That is the belief-versus-truth system at continental scale.

---

## 1. Layer one: geography and climate

Everything else is downstream of this layer. Dwarf Fortress builds its worlds in this order: fractal elevation; temperature from latitude and altitude; rainfall corrected for rain shadows; drainage; biomes from elevation, temperature, rain and drainage together; rivers traced from eroding mountains to the sea; and only then civilizations and history ([Wikipedia, *Dwarf Fortress*](https://en.wikipedia.org/wiki/Dwarf_Fortress); [DF wiki, *World*](https://dwarffortresswiki.org/index.php/40d:World); [DF wiki, *World token*](https://dwarffortresswiki.org/index.php/40d:World_token)). Ardan's bible already follows the same logic: plates, then mountains, then winds, currents and rain shadows, then regions. The expansion should extend that model, not start over.

### 1.1 How a continent the size of Asia is built

- **Plates make the walls.** Every mountain wall sits on a plate boundary. Collisions make the highest ranges and plateaus behind them; Asia's raised plateaus lift the whole continent's mean height to 915 m ([Cambridge](https://resolve.cambridge.org/core/books/world-geomorphology/asia/883DA41243FD07B878096756370C9B47)). Ardan's Worldspine and the Roof are already this kind of collision. The Far Lands need one more great collision belt, a few old worn-down ranges (rich ore near the surface), one active volcanic island arc on the eastern ocean, and one young rift.
- **Latitude makes the belts.** Dry air sinks around 20–30°N and makes deserts. Westerlies blow north of about 31°N and trade winds south of it. A continent this wide gets more continental with every 1,000 km from the western ocean: hotter summers, colder winters, less rain. Canon already explains its Salt Sea steppe this way.
- **The monsoon makes the crowded coasts.** A warm southern ocean and a huge land mass that heats in summer pull rain inland from June to September, until a mountain wall stops it. Rain on one face, cold desert on the other.
- **Biome mix.** Asia runs from the Arctic Ocean to the equator, so it holds tundra, coniferous forest, broadleaf forest, temperate grassland, desert, mountain vegetation, savanna and rainforest ([peda.net](https://peda.net/id/6faf5be7354)). The Far Lands should hold all of these, in bands.

### 1.2 The features that drive history

| Feature | Earth model | Why it matters | Ardan today |
| --- | --- | --- | --- |
| **A steppe corridor** | The Eurasian steppe: about 8,000 km of grass from Hungary to Manchuria, broken by mountains that riders crossed easily, so steppe peoples stayed in touch end to end; about 7–8.5 million km² ([Britannica](https://www.britannica.com/place/the-Steppe); [Chernykh, CSIC](https://tp.revistas.csic.es/index.php/tp/article/download/149/150/152); [Geography Worlds](https://geographyworlds.com/blog/eurasian-grasslands-guide/)) | The highway of horses, nomad empires and plague. It carries languages and faiths thousands of km. | The Grass Sea, the Salt Steppe and the Eastern Steppe, about 2.4M km² together. They should continue east as one long belt of about 7M km². |
| **Mountain walls and passes** | The Himalaya, the Pamirs, the Tian Shan | They split climates and peoples, and a few passes become forts and tolls | The Worldspine's three passes, the Crown Range, the Sunwall |
| **Oasis basins** | The Tarim Basin: a desert ringed by mountains, with oases at the feet of the Tian Shan and the Kunlun that served as water stops, markets and political brokers; the Hexi Corridor, a narrow funnel through which all overland trade into China passed ([Asia Society](https://asiasociety.org/node/13210); [Wikipedia, *Hexi Corridor*](https://www.wikipedia.com/wiki/Hexi_Zoulang); [J. Geography 1962](https://dx.doi.org/10.5026/jgeography.71.203)) | Tiny city-states that matter far beyond their size | Oases of the Red Waste and the Gulf of Sands. There is no interior basin. |
| **Great river basins** | Ob about 3.0M km², Yenisei 2.55M, Lena 2.3M, Ganges–Brahmaputra 2.0M, Amur 1.9M, Yangtze 1.7M, Mekong about 0.8M ([Wikipedia, *List of drainage basins by area*](https://en.wikipedia.org/wiki/List_of_drainage_basins_by_area); [Atlas Sociologique](https://atlasocio.com/classements/geographie/hydrographie/classement-bassins-hydrographiques-par-superficie-asie.php)) | Warm basins make the densest peoples on Earth. Cold north-flowing basins make empty fur country. | The Monuti and the Long Rift, the Dromir. Every one is under 1M km². |
| **Monsoon coasts and deltas** | Irrigated rice was "the major key" to where people settled and grew in the arc from India through Southeast Asia and China to Japan ([Milbank Quarterly](https://www.milbank.org/wp-content/uploads/mq/volume-25/issue-01/25-1-Migration-and-the-Population-Potential-of-Monsoon-Asia.pdf)). Humid tropical Asia held about a quarter of the world's people on 5% of its land ([UNESCO](https://unesdoc.unesco.org/ark:/48223/pf0000010408)). | Where the people are, the armies are | The Monsoon Coast (Ranpur) and the Spice Coast |
| **Archipelagos and straits** | The Strait of Malacca and Srivijaya, a power built on port-cities, vassal harbours and sea peoples, taxing transit trade ([Model Diplomat](https://modeldiplomat.com/learn/glossary/srivijaya-empire); [Everything Everywhere](https://everything-everywhere.com/the-srivijaya-empire/)) | One choke point is worth a kingdom | The Amber Isles; the Strait of Hael (Blackreef's dragon toll) |
| **Highland refuges** | Zomia: about 2.5 million km² of upland Southeast Asia whose peoples long stayed out of valley states by altitude, shifting farming and crops that are hard to count or tax ([James C. Scott, via escholarship](https://journalpub.escholarship.org/ssha_uhj/article/52649/galley/39703/download); [New Mandala review](https://newmandala.org/2010/07/05/review-of-art-of-not-being-governned-tlcnmrev-viii)) | Many small peoples, few states; where rebels and refugees go | The Free Marches and the High Wastes, both unclaimed |
| **Axis** | Diamond: a continent that runs east–west lets crops and animals spread along one latitude ([Shortform](https://www.shortform.com/pdf/guns-germs-and-steel-pdf-jared-diamond)). It is disputed ([PsyPost](https://www.psypost.org/scientists-put-jared-diamonds-continental-axis-hypothesis-to-the-test-heres-what-they-found)), but useful in a world. | Ideas, faiths and crops cross a wide east–west continent fast and a north–south one slowly | The Great Continent will run east–west and the Southland north–south. Diffusion should follow that. |

### 1.3 The Far Lands: a proposed shape

Working names follow canon's English descriptive style ("the Grass Sea", "the Roof"). Final names should come from the place-name roots of the language that holds each land. Region ids continue canon's pattern with a new letter per land.

| Code | Working name | Where | Size | Biomes | What it is for |
| --- | --- | --- | --- | --- | --- |
| **F** (Far Steppe) | The Long Grass | East of the Eastern Steppe, along 40–50°N | about 5M km² | Cool steppe, forest-steppe, semi-desert | The heart of nomad power; a khaganate and its clans; horses for every empire |
| **B** (Basins) | The Sand Basins | Behind the Worldspine and the High Wastes, ringed by ranges | about 2.5M km² | Cold desert with oasis chains at the mountain feet | The Silk Road's middle: oasis city-states, caravanserais, faiths meeting |
| **R** (Rivers) | The Twin Rivers (the silk lands) | The far east, 25–42°N, two great basins and a coast | about 6.5M km² | Humid subtropical to continental, loess plains, deltas | The most people on the continent (about 120 million); the silk; a great empire and its rival |
| **M** (Monsoon) | The Southern Peninsulas | South of the Rivers and east of Ranpur, 5–25°N | about 3.5M km² | Monsoon forest, rice deltas, upland refuges | Mandala kingdoms and hill peoples; elephants; temple cities |
| **A** (Archipelago) | The Thousand Isles | East of the Amber Isles, around the equator | about 2.5M km² of land in a sea twice that | Rainforest, volcanic islands, reefs | A thalassocracy and its ports; spices, camphor, pearls; sea peoples |
| **H** (High) | The High Steppes | East of the Roof, 3,500–5,000 m | about 2.5M km² | Alpine steppe, cold desert, ice | Monastic and clan polities; the oldest dwarf memory (the Roof is where dwarves came from) |
| **T** (Taiga) | The Black Pines | North of the Long Grass, 50–70°N, three huge north-flowing rivers | about 10M km² | Taiga, bog, tundra | Furs, salt, amber, iron; thin peoples; the great cold beasts; old giant country |
| **I** (Isles) | The Sunrise Isles | Off the far east coast | about 0.6M km² | Temperate forest, volcanic | An island realm that faces east and inward; warrior households |
| **D** (Deep South) | The Deep Southland | South of the Highveld and the Deep Green, 14°N to 5°S | about 6M km² | Savanna, equatorial forest, great lakes, highlands | Gold, ivory, cattle kingdoms; the Southland's own interior |
| **N** (North) | The Rime Coast | The Arctic shore of the Great Continent | about 2M km² | Tundra, ice coast | Sea hunters, the frost leviathans, the end of the world |

That adds about 32M km² of mainland to the Eastland (making it about 37M), about 3M of islands, and 6M to the Southland, which matches the targets in section 0. It also keeps canon's three-continent picture: the Far Lands are what lies past the edges, not a replacement.

### 1.4 Where people live

Population follows food, and food follows rain, warmth, flat ground and rivers:

- **Dense** (over 50 per km²): monsoon deltas, loess river plains, irrigated valleys. The Twin Rivers and the Southern Peninsulas' deltas.
- **Middling** (10–50): rain-fed farmland, the Westland's plains, the Highveld.
- **Thin** (1–10): steppe, upland forest, the savanna.
- **Nearly empty** (under 1): taiga, tundra, true desert, high plateau.

Earth around 1300 had perhaps 60% of its people in China and India. Ardan's Far Lands should be as lopsided: two "hearths" (the Twin Rivers, about 120 million, and the Southern Peninsulas with the Thousand Isles, about 60 million) and huge thin lands between them. **That lopsidedness is what makes the steppe dangerous and the silk valuable.**

### Rules this layer hands down

- **G1.** Mountains sit on plate edges. A range runs along the boundary and has a wet face and a dry face.
- **G2.** Climate comes from latitude, prevailing wind, distance from the ocean, height and current, in that order. Never paint a biome without one of those reasons.
- **G3.** Rivers run from wet mountains to the sea or to an inland lake. A basin is the basic unit of settlement and of later states.
- **G4.** Every land has one corridor (a steppe belt, a valley, a strait) and one choke point on it.
- **G5.** Every land has a refuge: a highland, marsh, forest or island chain where states fail.
- **G6.** Region size: canon averages about 475,000 km² per region (48 regions on 22.8M km²). Keep about 400,000 km² for new regions, smaller in dense lands and larger in empty ones.

### Targets for this layer

| Thing | Today | Target | Why |
| --- | --- | --- | --- |
| Land area | 22.8M km² | about 64M km² (the Great Continent about 46M) | The owner's bar is "at least Asia" |
| Macro-lands | 3 continents + islands | 3 continents + 10 Far Lands | One land per kind of history (section 1.3) |
| Regions (canon W-, S-, E- style) | 48 | about 150 | About 100 new regions at about 400,000 km² |
| Habitat zones | 287 | about 900 | Same density as canon's habitat atlas |
| Mountain ranges with named passes | about 10 | about 30 | Each Far Land gets one wall and one or two passes |
| River systems with named basins | about 8 | about 30, at least 6 over 1.5M km² | Asia's six giants (section 1.2) |
| Game provinces | 306 | about 1,100 | Far Lands at about 55,000 km² of settled land per province, coarser in the empty north (see the recipe: level of detail) |
| Gazetteer places | 2,769 | about 10,000 | Places are cheap and make the map feel endless |

---

## 2. Layer two: economy and resources

### 2.1 Rules from geography

- **Moving goods.** Canon's rule is sea 1, river 5, land 25, and overland grain doubles in price about every 150 km. That rule explains why great cities sit on coasts and rivers. It also explains why a continent of 17,000 km trades **light, dear goods** overland (silk, spice, jade, horses, silver, paper, medicine) and **bulk goods** only by water.
- **Every land exports what its ground makes and imports what it lacks.** Old worn ranges give ore near the surface. Inland seas and dry basins give salt. Steppe gives horses, felt and hides. Taiga gives furs, wax, amber and timber. Monsoon lands give rice, cotton, spice and dyes. Equatorial isles give spice, camphor, pearls and hardwood. Highlands give gold, jade and medicinal plants. Savanna gives ivory, gold and cattle.
- **Routes link complementary lands across corridors.** The Silk Roads ran from the Hexi funnel, split around the Tarim's oasis chains, rejoined at Kashgar, crossed the Pamirs to Samarkand and Bukhara, then fanned out to the Levant, the Black Sea, India or the steppe. A northern steppe branch ran along the Altai and the Kipchak steppe to the Black Sea, tied to the nomad empires ([China Xian Tour](https://www.chinaxiantour.com/silk-road-travel-guide/key-silk-road-routes); [Archania](https://archania.org/p/arch-history/from-early-antiquity-to-the-middle-ages/classical-antiquity/the-silk-road); [Lancaster](https://www.lancaster.ac.uk/people/wildo/silk/silk.html)). **A route is never one road.** It is a braid with alternatives, so wars can cut one strand and push trade onto another.
- **The sea runs on a calendar.** Indian Ocean monsoons blow southwest from June to September and northeast from October to March. A merchant could make one round trip a year from Calicut. A dhow from the Gulf to Guangzhou took at least six months in stages, waiting out cyclones on the Malabar coast ([OER Project](https://www.oerproject.com/OER-Materials/OER-Media/HTML-Articles/Origins/Unit5/Indian-Ocean-Routes); [War History, *Trade between Middle East and China before 1500*](https://warhistory.org/%40msw/article/trade-between-middle-east-countries-and-china-before-1500); [Aramco World 1962](https://archive.aramcoworld.com/issue/196206/arabs.and.the.sea.htm)). Ardan already has Sea Opening and Sea Closing. The southern seas should get a monsoon calendar of their own: ships leave on one wind and come home on the other.
- **Choke points become states.** Whoever holds the strait, the pass or the oasis taxes the trade and is hated for it (Srivijaya at Malacca; Ardan's own Kraoth silk toll and Blackreef's dragon toll).

### 2.2 Scarcity: what people fight over

Each land should lack one thing it must buy, and hold one thing others must buy from it. These are the scarcities that start wars:

| Scarcity | Who lacks it | Who has it |
| --- | --- | --- |
| Horses | River empires, monsoon kingdoms, islands | The steppe |
| Grain | The steppe, the taiga, oasis towns | The river basins |
| Iron and steel | Islands, the savanna, the steppe | Old ranges and the dwarf holds |
| Salt | Inland farm country | Dry basins, coasts |
| Ship timber | Deserts, the steppe, treeless deltas | Taiga, rainforest |
| Silver (the money of long trade) | The far east | Old ranges in the west and the basins |
| Water | Oasis towns, the dry steppe | Mountain glaciers and rivers |

Canon already uses this pattern: the Tusk Clans tax the silk, and Drevna pays them rye. The Far Lands repeat it at a larger size.

### Targets for this layer

| Thing | Today | Target |
| --- | --- | --- |
| Named trade routes (canon TR-) | 16 | about 80, each a braid of 2–4 strands |
| Trade goods with an origin region | about 60 in the price tables | about 160 |
| Money systems (coins and units) | about a dozen | about 40, plus three long-distance "trusted" monies (a western gold coin, a steppe silver bar, a far-eastern paper or string-of-coins money) |
| Choke points with a toll and an owner | about 6 | about 30 |

---

## 3. Layer three: peoples, languages and cultures

### 3.1 How peoples and tongues spread

- **Languages ride on something.** They spread with farming (slow, wide), with horses (fast, along the steppe), with empires (over the top of older tongues, which survive as substrate and place names) and with ships (along coasts and islands).
- **The shape follows the ground.** One steppe language family can stretch 6,000 km. Islands hold many close kin tongues. Highland refuges hold many unrelated small tongues. River basins hold a few big tongues with many dialects.
- **The numbers are large.** Asia has about 2,300 living languages ([Forbes México, citing Ethnologue](https://forbes.com.mx/?p=200312); [1StopAsia](https://www.1stopasia.com/blog/one-continent-49-countries-and-2300-languages-asia/)). Ethnologue counts about 143 families among the world's 7,170 languages, and Glottolog over 400 if isolates are counted as families ([Ling](https://ling-app.com/blog/how-many-language-families-are-there/)).
- **Ardan already models this well.** Part 13 of the bible has families that split by era (one Western family across three branches, a Rift-and-Sand family, a Grassland family with a highland substrate), four elder tongues, an old shared layer of northern names, and one isolate. The expansion should extend this method, not replace it.

### 3.2 What a culture is, for building

A culture is **one tongue (or dialect cluster) × one way of making a living × one faith (or mix) × one memory of a state** that shaped it. Two groups with the same language but different livelihoods are two cultures (herders and town folk). A culture needs, at minimum:

- naming rules;
- 3 of its own words (feature 47 already does this for 24 cultures);
- one thing it eats;
- one thing it wears for war;
- one thing it is proud of;
- one neighbour it despises, and why.

### 3.3 The five peoples in the Far Lands

New peoples would break canon. Kin of the five, found where canon already points, add depth instead:

- **Dwarves.** They came down from the Roof. The High Steppes can hold lost or abandoned holds and a dwarf memory that the western holds deny.
- **Giants.** They once spread across the whole north. The Black Pines and the Rime Coast can hold old halls, giant place names and perhaps one remnant hall.
- **Orcs.** One tongue on the Grass Sea from about 1500 BR, then split by the Wind Empire. The Long Grass can hold their older homeland and clans who never came west.
- **Elves.** Their long memory and long count make them the people who might know the Far Lands from 700 years ago. Their knowledge can be a well-guarded secret, or simply wrong.
- **Humans** fill most of the Far Lands, in about 100 new cultures.

### Rules this layer hands down

- **P1.** Every language family has a homeland basin and a carrier (farming, horse, empire or ship) that set its spread.
- **P2.** Every conquest leaves a substrate: place names, words for rank, a liturgical tongue.
- **P3.** Every culture has naming rules, three words of its own and one despised neighbour.
- **P4.** No new peoples in canon. The Far Lands deepen the five.

### Targets for this layer

| Thing | Today | Target | Why |
| --- | --- | --- | --- |
| Language families (including elder tongues and isolates) | about 13 | about 32 | Eurasia has about 15 large families plus many isolates; the Far Lands add about 16 families and 4 isolates |
| Named tongues | 29 (lexicon) | about 150, with about 40 lexicons | |
| Cultures | 24 | about 140 | About 16 more in the Known World (raised from canon's dialects and 84 tribes), about 100 in the Far Lands |
| Bloodlines | 42 | about 150 | |
| Name lists | 24 cultures | All 140, generated from each tongue's sound rules | |

---

## 4. Layer four: polities

### 4.1 How states rise, spread and break

- **Empires form on the edge of the arid belt and run east–west.** Turchin, Adams and Hall measured every historical empire over a million km² and found most are stretched east–west, because power travels easily within one ecological zone ([JWSR](https://jwsr.pitt.edu/ojs/jwsr/article/download/369/381)). Turchin's mirror-empires model adds that nomad and farmer pressure each other into larger and larger states. Over 90% of mega-empires arose in or next to the Old World's arid belt, from the Sahara to the Gobi ([Turchin, *Journal of Global History*](https://www.cambridge.org/core/product/21400792CA0F6794B9CDA343B74B21A9); [P2P Foundation summary](https://wiki.p2pfoundation.net/Formation_of_Large_Agrarian_Empires)). Rise and decline in East and West Asia moved in step from about 140 BCE to about 1800 CE ([Chase-Dunn et al., *Middlemen and marcher states*](https://www.SocioStudies.org/journal/files/seh/2010_1/middlemen_and_marcher_states.pdf)). **Rule for Ardan:** put the great empires on the steppe frontiers (the Twin Rivers against the Long Grass, as Aldmark faces the Horde today). A steppe war in the east should send ripples west within a generation.
- **Dynasties decay on a clock.** Ibn Khaldun: a ruling house rises on the edge of an old empire through the cohesion (*asabiyya*) of a frontier people. It conquers, then softens in the cities. It rarely lasts beyond three or four generations of about 40 years ([Wikipedia, *Asabiyyah*](https://en.wikipedia.org/wiki/Asabiyyah); [Miller Man School](https://asabiyyah.millermanschool.com/)). **Rule:** give every dynasty an age, and make dynasties over about 120 years old brittle.
- **Steppe empires split in two, then into many.** The Göktürks ruled as an eastern khagan and a western yabghu; tribes were grouped east and west and formed the army's left and right wings. A succession crisis in 583–603 broke the halves apart ([Wikipedia, *Göktürk civil war*](https://en.wikipedia.org/wiki/G%C3%B6kt%C3%BCrk_civil_war); [Humanities Institute](https://humanitiesinstitute.org/__static/b09422b93484319647bc4b515afabff7/gokturk-government(3).pdf?dl=1)). **Rule:** a khaganate has two wings and a council of clan heads, and it breaks at a death.
- **Southern kingdoms overlap.** In the mandala model, Southeast Asian states were overlapping circles of personal loyalty, not bordered territories, and a lesser ruler could serve two overlords at once (Srivijaya, Angkor, Ayutthaya, Majapahit) ([Wikipedia, *Mandala (political model)*](https://en.wikipedia.org/wiki/Mandala_(political_model)); [Siam Society](https://thesiamsociety.org/wp-content/uploads/1990/03/JSS_078_1i_SunaitChutintaranond_MandalaSegmentaryStateInMedievalAyudhaya.pdf)). **Rule:** let some provinces in the monsoon lands owe tribute to two realms. That is a new kind of border, and it does not exist anywhere in Ardan today.
- **Fragmented crowns hold hundreds of lordships.** The Holy Roman Empire held hundreds of fiefs, often at war with each other and full of enclaves; its estates were cut from about 300 to about 30 only around 1800 ([Wikipedia, *Imperial Estate*](https://en.wikipedia.org/wiki/Imperial_Estate); [Wikipedia, *Kleinstaaterei*](https://en.wikipedia.org/wiki/Kleinstaaterei)).
- **Merchant leagues have a core and a cloud.** The Hanse had about 50 towns by the 1350s and about 100 by 1375; at its peak 180–200 towns belonged, of which 70–80 were active ([SAGE](https://sk.sagepub.com/ency/edvol/embed/businesstoday/chpt/hanseatic-league); [War History, *Martial Merchants of the Baltic*](https://warhistory.org/zh/article/martial-merchants-of-the-baltic?amp=0)). **Rule:** a league is a list of towns with a core of about one in three.
- **Land pays for soldiers.** In the Islamic world an *iqta* gave a soldier a district's tax revenue, not the land, in return for service. It was not hereditary without the sovereign's consent, and under the Seljuks it went mostly to *ghulams*, slave soldiers trained and later freed ([Wikipedia, *Iqta'*](https://en.wikipedia.org/wiki/Iqta%27); [Cambridge, *Mamluk institution in early Muslim India*](https://www.cambridge.org/core/journals/journal-of-the-royal-asiatic-society/article/mamluk-institution-in-early-muslim-india/6AD31700DFD87C17F3B1DAE2EE064324)). Slave soldiers took Egypt in 1250. **Rule:** the way a state pays its soldiers decides how it falls. Fiefs fall to rebel barons, iqtas to coups by the soldiers, mercenaries to unpaid wages.

### 4.2 How many polities: Eurasia around 1200

The counts below are approximate and drawn from standard historical atlases. They count sovereigns and near-sovereigns of note, not every lordship. Euratlas's 1200 map and dataset define a sovereign state as a territory with its own people and an authority that answers to no other power ([Euratlas 1200](https://www.euratlas.com/history_europe/europe_map_1200.html); [Stanford, *Sovereign States, Europe, 1200*](https://purl.stanford.edu/hw582qn4205)). For East Asia see the [Nations Online map of the Jin and Southern Song](https://nationsonline.org/oneworld/map/Chinese_dynasties/Jin_S-Song_Dynasty_Map.htm) and [Kara-Khitan](https://wikipedia2007.classicistranieri.com/k/a/r/Kara-Khitan_Khanate_3f72.html).

| Region (c. 1200) | Sovereign polities of note | Kinds | Examples |
| --- | --- | --- | --- |
| Western and central Europe | about 45–60 (plus about 300 Imperial estates under the Empire) | kingdoms, an empire of princes, city communes, a papal state, military orders | England, France, the Empire, Aragon, Castile, Sicily, Hungary, Venice, Genoa |
| Eastern Europe and the Baltic | about 15–20 | principalities, a merchant republic, pagan tribal lands | Novgorod, Kiev, Vladimir-Suzdal, Galicia, Lithuania |
| The Near East and Anatolia | about 25–30 | sultanates, a caliphate, crusader states, atabegs, a sectarian castle state | Ayyubid branches, Seljuks of Rum, Abbasids, Jerusalem (at Acre), Cilician Armenia, Georgia, the Nizaris of Alamut |
| Iran and Central Asia | about 8–12 | a shah's empire, khanates, nomad confederations | Khwarazm, Qara Khitai, the Qarakhanids, the Ghurids, Kipchak clans |
| The Mongolian steppe (before 1206) | about 6–8 confederations | tribal unions | Kereit, Naiman, Merkit, Tatar, the Mongols |
| China and Manchuria | about 5 | rival empires, a Tangut state, a southwestern kingdom | Southern Song, Jin, Western Xia, Dali, Qocho Uyghurs |
| Korea and Japan | 2 (Japan with a court and a shogunate as two powers) | a kingdom under military rule; a dual court and shogunate | Goryeo, Kamakura Japan |
| Tibet and the Himalaya | about 10 | monastic and clan lordships | Sakya, Guge, Nepal |
| South Asia | about 20–25 | sultanate, Rajput and Deccan kingdoms, a southern sea power | the Ghurid conquests at Delhi, the Hoysalas, the Yadavas, the Kakatiyas, the Pandyas, the Cholas, Sena Bengal, Kashmir, Lanka |
| Mainland Southeast Asia | about 8–10, plus many hill chiefdoms | mandala kingdoms | Angkor, Pagan, Dai Viet, Champa, Haripunjaya |
| Maritime Southeast Asia | about 5–8, plus hundreds of chiefdoms | thalassocracy, Javanese kingdoms, port states | Srivijaya, Kediri, Brunei |
| North and East Africa | about 12–15 | a caliphate, a sultanate, Christian kingdoms, Sahel empires | the Almohads, Ayyubid Egypt, Makuria, Alodia, Zagwe Ethiopia, Kanem, Kilwa |
| **Total** | **about 160–210 sovereigns**, with thousands of lesser lordships, tribes and towns under them | | |

**What that means for Ardan.** Eurasia and North Africa held about 60M km² of land and about 160–210 sovereigns: one for every 300,000–375,000 km². Ardan today has 34 realms and 25 unclaimed lands on 22.8M km², one realm for every 670,000 km². The Known World is half as crowded with states as medieval Earth. At Earth density a 64M km² world holds about 170–210 sovereigns, plus a "lesser" layer at least as large.

### 4.3 Polity types and their mix

Two things decide a polity's type: how its surplus is taken, and the ground it stands on.

| Type | Ground | How it is paid | How it breaks | Ardan today | Target |
| --- | --- | --- | --- | --- | --- |
| Hegemonic empire | Big river basin next to the steppe | Land tax, grain, a salaried army | A steppe war together with a succession or fiscal crisis; a three-generation decay | Aldmark, Zanara | 6–8 |
| Kingdom | Rain-fed farmland | Fiefs and levies | Barons, partible inheritance, regencies | 15 | about 70 |
| Lesser principality: duchy, emirate, atabeg, raja | Anywhere under a larger crown | A fief or iqta grown hereditary | Absorption, or a breakaway | 0 as realms (houses only) | about 90 |
| City-state or merchant republic | Coast, strait, oasis | Tolls, trade, banking | Debt, rival ports, a closed route | Ostra, Lucerna | about 30 |
| Merchant league | A coast with many ports | Shared staples and privileges | Its core splits | Spice Coast | 5–6 (each a list of 10–40 towns) |
| Theocracy, abbey or temple state | Holy site, plateau | Tithes, pilgrims, estates | Schism, a lay protector who stays | Solenne, Skyhold | about 20 |
| Nomad khaganate or horde | Steppe | Tribute, raids, trade tolls | The khagan's death; a split into two wings | Horde, Nine Winds, Tusk Clans | about 10 large, plus about 40 clan confederations |
| Tribal confederation or chiefdom | Forest, highland, savanna | Kin obligation, cattle | Feud, a prophet, a famine | about 6, plus 84 canon tribes | about 60 |
| Mandala overkingdom | Monsoon lowland | Tribute from rulers who may also serve others | A rival centre wins away the tributaries | none | about 8 |
| Thalassocracy | Strait or archipelago | Transit tax, vassal ports | Raids by a rival sea power | Amber Isles (partly), Blackreef | 3–4 |
| Sworn or military order with land | Frontier | Donations, estates | Kings who covet its wealth | none as realms | 5–8 |
| Stateless refuge | Highland, marsh, taiga | Nothing anyone can count | Doesn't; it absorbs runaways | 25 unclaimed lands | about 40 |

### Rules this layer hands down

- **S1.** One sovereign for every 300,000–400,000 km² of farmed or grazed land; about one for every 1,500,000 km² in taiga, tundra and true desert.
- **S2.** Every great empire faces a steppe or a sea it cannot conquer.
- **S3.** Every dynasty has an age, and over about 120 years it is brittle.
- **S4.** Every polity has one want, one fear, three customs and one place that matters (feature 47's format), plus a neighbour it fears and a neighbour it covets.
- **S5.** How soldiers are paid decides how the state breaks.
- **S6.** Borders are not all lines. Allow tribute circles (mandala), toll zones and refuges.

### Targets for this layer

**About 340 polities**: tenfold the 34 realms, and inside Earth's density band once lesser polities are counted.

| Tier | Count | Simulated how |
| --- | --- | --- |
| Great powers (as in canon's "ten great powers") | about 25 world-wide, 10 of them in the Known World | Full simulation |
| Realms: kingdoms, sultanates, khaganates, republics, theocracies | about 150 | Full realm data (feature 47's format); the Known World's 34 plus about 115 new |
| Lesser polities: principalities, city-states, clans, abbeys | about 165 | Light data: a ruler, a house, a liege, a want |
| Stateless lands | about 40 | No ruler; a refuge flag; beasts and tribes |

Spread across the Far Lands in proportion to people, not area:

| Land | Polities |
| --- | --- |
| The Twin Rivers | about 45: two empires, about 15 tributary kingdoms and princes, about 25 lesser |
| The Southern Peninsulas | about 35, mandala |
| The Thousand Isles | about 50 port polities under one or two sea powers |
| The Long Grass | about 30: one khaganate, two wings, about 25 clans |
| The Sand Basins | about 25 oasis city-states |
| The High Steppes | about 15 monastic and clan lordships |
| The Black Pines and the Rime Coast | about 20 tribes, 2–3 fur principalities |
| The Sunrise Isles | about 15 households under one court |
| The Deep Southland | about 40 |
| The Known World | 34 realms plus about 36 raised from canon's tribes, houses and old states |

---

## 5. Layer five: belief, society, law and war

### 5.1 Faiths

- **Faith families start in a river core and travel along trade.** Buddhism grew most between the 1st and 10th centuries, carried east by merchants, missionaries and pilgrims. Manichaeism spread along the routes because it appealed to merchants. The Church of the East reached Central Asia, India and China by the 7th century ([Smithsonian Folklife Festival](https://festival.si.edu/2002/the-silk-road/the-silk-road-crossroads-and-encounters-of-faith/smithsonian); [UCLA Asia Pacific Center](https://asia.ucla.edu/apc/centralasia/article/117351); [WorldAtlas](https://worldatlas.com/religion/manichaeism-the-religion-that-went-extinct.html)). **Rule:** a universal faith follows the trade routes of layer 2; an ethnic faith stays with its culture.
- **Every organized faith sits on a folk layer.** Ardan already has this: the Hearth Folk under the Westland's churches.
- **Every great faith has split at least once.** Canon's Dawn Schism of 734 is the model.
- **Belief versus truth is the signature.** Every faith keeps a fact it hides; canon's Temple hides the true dates of the Dimming. Every Far Land faith should have one.

**Targets:** faiths 19 → **about 75**. That is about 12 faith families; about 15 organized great faiths, each with 2–4 named churches or schools (about 40 bodies); and about 35 folk faiths and cults. Each gets a holy day, a schism, a heresy and a secret.

### 5.2 Social structures

| Structure | Earth model | Where it fits in the Far Lands |
| --- | --- | --- |
| Three orders or estates (those who pray, fight, work) | The idea is first found in King Alfred's Boethius and was given its classic form by Adalbero of Laon. It grew into the legal "estates" as money and social mobility rose, and it was never wholly true on the ground ([Medievalists.net](https://www.medievalists.net/2023/11/three-orders-medieval-society/); [IMC Leeds](https://www.imc.leeds.ac.uk/imcarchive/2011/sessions/905)) | The Westland already; one Far Land borrowing it |
| Birth castes with occupational sub-castes | Varna and jati (general knowledge; no web source was reachable in this session) | One monsoon civilization, with an honest picture of both its stability and its cruelty |
| Exam-chosen officials and a landed gentry | Song China's civil service (general knowledge) | The Twin Rivers: the first realm in Ardan where a commoner can rise through letters |
| Revenue grants and slave soldiers | Iqta and ghulam ([Wikipedia, *Iqta'*](https://en.wikipedia.org/wiki/Iqta%27)) | The Sand Basins' and the southern sultanates' armies; a soldier caste that might seize the throne |
| Decimal households | The Mongol system grouped households and soldiers in 10s, 100s, 1,000s and 10,000s ([Wikipedia, *Mingghan*](https://en.wikipedia.org/wiki/Mingghan)) | The Long Grass: the army is the census |
| Clans with a council of heads | The Kushan of *Berserk*, whose clan heads met in a kurultai ([Berserk wiki, *Kushan*](https://breezewiki.discard.no/berserk/wiki/Kushan)); the real kurultai | Every steppe and highland polity |
| Guilds and leagues | The Hanse; Ardan's own banking houses | The ports of the Thousand Isles and the Sand Basins |
| Monastic estates | Tibet; Ardan's Skyhold | The High Steppes |
| Mandala tribute | Srivijaya, Angkor | The Southern Peninsulas |

**Rule:** a society's structure follows how its surplus is taken (land, herd, toll or temple). Each polity picks a main structure and one twist no real kingdom had. That twist is the Road to Ten's World 3 item, "break the Europe mirror", and the expansion must not become "Asia with the names filed off".

**Targets:** about 20 social-structure archetypes. Every one of the 340 polities draws one main archetype and one twist.

### 5.3 Law and custom

Feature 47 has 102 customs of ten kinds on 34 realms, enforced as rules. The tenfold version should not hand-write 1,000 customs:

- each culture gets 3 customs (about 420);
- each realm adds 1 of its own;
- the ten kinds (year, rite, mourn, wed, name, levy, law, ward, market, grave) stay;
- new kinds the Far Lands need: **exam** (sit the test at a set age), **tribute** (pay two lords), **monsoon** (the month you may sail) and **census** (enrolled in a decimal unit at 15).

### 5.4 Warfare traditions and armies

Armies follow the ground, the money and the enemy:

| Military culture | Earth model | Composition | Ardan today |
| --- | --- | --- | --- |
| Steppe horse archers | The Mongol decimal army of arban (10), jagun (100), mingghan (1,000) and tumen (10,000). A field army was usually three tumens. Households and soldiers were counted in the same units ([Wikipedia, *Mingghan*](https://en.wikipedia.org/wiki/Mingghan); [Medievalists.net](https://www.medievalists.net/2022/02/reintroduction-mongols); [War History, *Storm from the East*](https://warhistory.org/article/storm-from-the-east-the-mongol-art-of-war)) | 80–100% horse archers, with heavy lancers as a strike wing | Horde, Nine Winds, Tusk Clans |
| River-empire infantry and crossbows | Song China: bows and crossbows were about 60% of the arsenal; the infantry relied on crossbows because warhorses were short. The Jurchen Jin answered with mounted archers ([Wikipedia, *Battle of Yancheng*](https://en.wikipedia.org/wiki/Battle_of_Yancheng); [Wikipedia, *Jin–Song wars*](https://en.wikipedia.org/wiki/Jin%E2%80%93Song_wars)) | Huge registered infantry, crossbows, walls and river fleets; little cavalry | Aldmark and Varenna (crossbows behind stakes) |
| Elephant, horse and foot | The Delhi Sultanate fielded cavalry, mass infantry and war elephants, borrowing elephants from Indian kingdoms ([Polsci Institute](https://polsci.institute/indian-political-thought-l/composition-role-army-delhi-sultanate); [Unacademy](https://unacademy.com/content/military-reforms-under-delhi-sultanate/)) | Elephants as a third arm; horse imported at great cost | Ranpur |
| Slave-soldier cavalry | Mamluk *furusiyya*: manuals give most space to archery and the lance, then sword, shield and mace. One illustrated copy is dated 1383 ([British Library catalogue](https://searcharchives.bl.uk/catalog/040-003473744); [Qatar Digital Library](https://www.qdl.qa/archive/81055/vdc_100149816191.0x0000a4)) | A small, superbly trained armoured cavalry core paid by revenue grants | none |
| Sea raiders and marines | The Chola navy riding the monsoon; Srivijaya's sea peoples | Marines, archers on decks, fire, boarding | Lucerna, Blackreef, Eldergrove |
| Highland infantry | General | Spears, slings, passes held by a few | Highland League, Stonehold |
| Forest skirmishers | General | Bows, ambush, poison where canon allows | Sylvaran, the Leaf People |
| Military orders | The Templars kept perhaps a few hundred knight-brothers at a time (about 300 in Jerusalem in the 1180s, about 500 at peak), far outnumbered by about 1,000 sergeants plus hirelings ([World History Encyclopedia](https://www.worldhistory.org/Knights_Templar/); [Helen Nicholson](https://www.goodreads.com/author_blog_posts/10301700-how-many-templars-were-there)) | A tiny sworn elite with a large paid shell | The Knights of the Noon and similar elite units |

This supports the Road to Ten's cap of "elite orders of 200 to 300 each": that is the Templars' real size.

**Targets:**

- **16 military-culture templates.** Today's armies already fit about 9 of them.
- **340 orders of battle**, generated from the templates and each polity's people, money and enemy. Canon's armies book is the model for the Known World's.
- **Elite units: 99 → about 900.** About 10 per great power, 3 per realm and 1 per lesser polity, each 200–5,000 strong.
- **Sworn orders** (holy orders, fighting monasteries, assassin houses, mercenary companies, guild militias): **about 150**.
- **Tactics: 137 → about 400.** New families: elephant war, junk and monsoon fleets, steppe feigned retreats at scale, jungle war, oasis sieges, frozen-river war, island raids.

### 5.5 Fighting styles

Real martial traditions show what a "style" is made of:

- **A lineage with a text.** Liechtenauer's art survives as the *Zettel*, a deliberately obscure mnemonic poem for trained men. His Fellowship produced most of the 15th century's great fight books, and the German school ran on into the 18th century ([Wikipedia, *German school of fencing*](https://en.wikipedia.org/wiki/German_school_of_fencing); [Wiktenauer](https://wiktenauer.com/wiki/Johannes_Liechtenauer)).
- **A school as a family.** Tenshin Shōden Katori Shintō-ryū is traditionally dated to 1447. Its founding legend is a scroll given in a dream, and full transmission is a licence (*menkyo kaiden*) given after years of training ([Katori Shinto Ryu USA](https://katorishintoryu-usa.org/lineage.html); [Wikipedia, *Tose Yosazaemon Osamune*](https://en.wikipedia.org/wiki/Tose_Yosazaemon_Osamune)).
- **A regional art with a myth and a contested age.** Kalaripayattu's developed form dates to the 11th–12th centuries in Kerala. Its legend credits Parashurama, and its claims run to thousands of years ([Wikipedia, *Kalaripayattu*](https://en.wikipedia.org/wiki/Kalaripayattu); [Kerala Tourism](https://www.keralatourism.org/kalaripayattu/origin/introduction)).
- **A cavalry curriculum.** *Furusiyya* teaches archery first, then the lance, then sword, shield and mace (section 5.4).
- **Fiction's version.** *Avatar* first planned invented styles, then on the advice of Sifu Kisu gave each nation a real art: tai chi for water, Hung Gar for earth, Northern Shaolin for fire, baguazhang for air ([Netflix Tudum](https://www.netflix.com/tudum/articles/what-is-bending-avatar-last-airbender); [Slashfilm](https://slashfilm.com/1526194/avatar-the-last-airbender-powers-explained)). The lesson for a no-magic world: a style reads as a culture's body language.

**A style is weapon × ground × body × armour × who carries it.** Ardan's lore already has 265 styles of three kinds: 93 national, 61 chains (lineages) and 111 household. They cover 21 weapon families, led by spear (46), sword (30), crossbow (23), bow (22) and axe (18).

**Rule:** a new style is born where a weapon meets a ground and an enemy:

- elephant-killing spear work where elephants fight;
- deck fighting with hooks where junks board each other;
- rope-and-roof movement in crowded port towns (canon's Kesh rope-runner is the seed);
- frozen-river fighting on spikes in the taiga;
- horse-archery forms by wing and by clan;
- exam-hall swordsmanship for scholar-officials who must still ride a frontier.

**Targets: 265 → about 2,600 styles, of which about 25% are written by hand:**

- about 90 **root traditions** (lineage chains with a founder, a text or relic, a dated split, and a living master);
- about 600 **national and school styles** written by hand;
- about 1,900 **household variants** generated from a parent style, a house and one twist.

Also: schools 61 → about 500; academies 34 → one per realm, about 150.

### 5.6 Beasts

Canon's bestiary is unusually good:

- 64 creatures, each with an anatomy, "how it works", diet, lifespan, population, weak points, belief and truth;
- about a quarter of them are hoaxes or misunderstandings;
- the game's 25 combat beasts now keep to their canon ranges (feature 76).

But 191 of 306 provinces list no beast at all, and no land has a full food web.

- **Rule:** beasts follow biome, food and ground. Each habitat zone gets:
  - its prey;
  - one predator people fear;
  - one large herbivore people use or hunt;
  - one thing that gets misread (a belief that hides a truth).
- **Families:** each Far Land adds 2–4 families of its own. Examples: great cold beasts of the taiga, river monsters of the monsoon deltas, raptors of the high plateau, sea beasts of the archipelago, oasis vermin and desert hunters, ape-kin of the equatorial forest.
- **Apex scarcity:** dragons and leviathans stay few and named, with a population count, as canon does.

**Targets: creatures 64 → about 400** in about 36 families, about 25% of them beliefs that hide a truth. **Game beasts 25 → about 150**, each with a canon range, so no province is left without a local beast. Plain wolves and boars are beasts too.

### 5.7 The strongest: warriors and legends

- **Canon** has fifty fighter profiles, each strong for a reason: body, blood, teaching, gear, fights survived, mind and rivals. It has no numbered ranks.
- **The plan** caps the game's hidden ladder at about 12 Legends in all of Ardan and about 5 Masters per realm.
- **One Piece** shows how a huge world keeps its top tier legible. Oda's world is balanced by three named groups: the Marines, four Emperors and seven Warlords. The loss of one member can tip the balance ([Wikipedia, *Four Emperors*](https://en.wikipedia.org/wiki/Four_Emperors_(One_Piece)); [One Piece wiki, *Three Great Powers*](https://onepiece.fandom.com/wiki/Three_Great_Powers)).

**Rule:** the top grows much more slowly than the world. Keep about 12 Legends in the Known World and allow about 40 world-wide. Name small in-world groups by reputation, not rank. The far east can talk of a handful of famous fighters as a group, and three generals who have never lost. Those are titles people use, not tiers, which keeps canon's house rule. Every Legend gets a rival and a weakness, as the fifty profiles do.

---

## 6. How master worldbuilders work

| Worldbuilder | Method | What Ardan takes from it |
| --- | --- | --- |
| **J. R. R. Tolkien** | Language and history first. The appeal of *The Lord of the Rings* came partly from "glimpses of a large history in the background", and the effect is hard to repeat "unless new unattainable vistas are again revealed" (Letter 247, 1963). *The Silmarillion* struggled because it began at the beginning, with nothing further back to glimpse ([Tolkien Gateway, *Letter 247*](https://tolkiengateway.net/wiki/Letter_247); [Wikipedia, *Impression of depth in The Lord of the Rings*](https://en.wikipedia.org/wiki/Impression_of_depth_in_The_Lord_of_the_Rings)) | **Never explain the farthest layer.** The Far Lands should themselves point at something farther: across the Western Ocean, or past the eastern isles. Each new land gets one unattainable vista. |
| **Ernest Hemingway's iceberg** | Leave things out only when you know them; "a writer who omits things because he does not know them only makes hollow places" ([Wikipedia, *Iceberg theory*](https://en.wikipedia.org/wiki/Iceberg_theory); [Project MUSE on Tolkien and the iceberg](https://muse.jhu.edu/article/765775)) | Canon is the hidden 90%. Events show the 10%. **Do not ship a Far Land in events before its data exists.** |
| **George R. R. Martin** | History as raw material: Hadrian's Wall seeded the Wall; the Wars of the Roses became the great houses' feud ([Scotsman](https://www.scotsman.com/arts-and-culture/how-scottish-history-inspired-game-of-thrones-2462643); [Seton Hall history blog](https://blogs.shu.edu/history/?p=21)). He calls himself "much more a gardener than an architect": he knows the end, not every turn ([Modelthinkers](https://modelthinkers.com/mental-model/architects-vs-gardeners); [India Writes](https://www.indiawrites.org/why-write/george-r-r-martin-of-architects-and-gardeners)) | **Architect the layers (this framework); garden the people.** Fix the geography, money and states. Let houses, feuds and lives grow from them. |
| **Ursula K. Le Guin** | Fantasy's style must reach the words: if four name changes can turn a passage into a modern thriller, it is "Poughkeepsie", not "Elfland" ([Wikipedia, *From Elfland to Poughkeepsie*](https://en.wikipedia.org/wiki/From_Elfland_to_Poughkeepsie); [ursulakleguin.com](https://www.ursulakleguin.com/from-elfland-to-poughkeepsie)). She built societies as an ethnographer, shaped by her anthropologist father, often through an observer's eyes; *Always Coming Home* is a whole invented ethnography ([Wikipedia, *Ursula K. Le Guin*](https://en.wikipedia.org/wiki/Ursula_K._Le_Guin)) | **The Le Guin test for every Far Land culture:** could this scene be moved to a real Asian country by changing four words? If so, rewrite it. Give each Far Land an observer's way in, such as a caravan factor, a pilgrim or an envoy. |
| **Brandon Sanderson** | Second law: limitations matter more than powers. Third law: expand what you have before adding something new; a brilliant system has few parts considered in depth ([Coppermind, *Sanderson's Laws*](https://coppermind.net/wiki/Sanderson%27s_Laws_of_Magic); [Writing Excuses 9.21](https://writingexcuses.com/writing-excuses-9-21-sandersons-3rd-law/)) | **The tenfold expansion must obey the third law.** Raise canon depth into the game first (gap section). New systems get limits: travel time, the monsoon calendar, the horse shortage. |
| **Eiichiro Oda** | Each island is an arc with its own culture and problem. A suppressed hidden history (the Void Century) ties them together and is foreshadowed for decades ([Sportskeeda](https://sportskeeda.com/anime/one-piece-chapter-1062-teaser-hints-void-century-mystery)). He fixed the ending and told his editors, while the middle grew far beyond his plan ([Anime Corner](https://animecorner.me/eichiro-oda-says-one-piece-manga-will-end-in-4-5-years/); [Fandomwire](https://fandomwire.com/i-never-thought-one-piece-would-last-this-long-eiichiro-odas-initial-plan-was-to-end-one-piece-in-5-years/)). The world is held up by a balance of named powers (section 5.7) | **Every land is an arc with one problem. One hidden history links all the lands** (see the recipe). Settle the big answers early and write them in the private canon. |
| **Hajime Isayama** | The story starts inside walls. The outside world appears late, and the enemy across the sea becomes a point of view. He kept the core arcs he planned from the start and decided details along the way ([Slashfilm](https://slashfilm.com/1439560/attack-on-titan-creator-planned-ending-start); [Comicbook.com](https://comicbook.com/anime/news/attack-on-titan-creator-hajime-isayama-eren-jaeger-story-planned-from-beginning/)) | **The Known World is Ardan's walls.** Reveal the Far Lands in stages, and give the "horde from the east" its own side of the story. |
| **Kentaro Miura** | A small political world: Midland against Tudor in a Hundred-Year War, the Holy See over both, and the Kushan far to the east as a clan empire with a kurultai ([Berserk wiki, *Midland*](https://breezewiki.discard.no/berserk/wiki/Midland); [Berserk wiki, *Kushan*](https://breezewiki.discard.no/berserk/wiki/Kushan)). The world widens as the hero travels | **The world grows from the hero's road.** Also a caution: the Kushan arrive as an invading "East". Ardan's east must be people first. |
| ***Avatar: The Last Airbender*** | Four nations, each an element, a culture and a real martial art. The imagery is mostly Chinese, blended with other East Asian, Southeast Asian, South Asian, Inuit and other influences, so no nation is one real country ([Wikipedia, *Avatar: The Last Airbender*](https://en.wikipedia.org/wiki/Avatar:_The_Last_Airbender)) | **Blend two or three Earth sources per culture.** A style is a culture's body; a culture is its ground. |
| **Dwarf Fortress** | The pipeline from elevation, temperature, rain and drainage to biomes and rivers, then a history simulation with civilizations, faiths and wars (section 1) | **Generate, then pin canon.** Simulate the Far Lands' history from about 1000 BR, with the Known World's canon events as fixed points the run must reach. |
| ***Crusader Kings III*** | A de jure ladder (barony, county, duchy, kingdom, empire); in CK3 the barony became the map's smallest unit, most counties holding 2–5 baronies ([CK3 Dev Diary 2](https://admin-forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-2-the-medieval-map.1274052/post-25989678); [Wikipedia, *Crusader Kings III*](https://en.wikipedia.org/wiki/Crusader_Kings_III)) | **A hierarchy of places** (gazetteer place, province, region, land) lets detail grow tenfold without ten times as many simulated provinces |
| ***The Elder Scrolls*** | Lore comes mostly from in-world books by biased authors. Developers speak of the "unreliable narrator" as essential, and the inconsistencies are deliberate ([TV Tropes](https://www.tvtropes.org/pmwiki/pmwiki.php/TheElderScrolls/TropesKToL); [UESP](https://content1.uesp.net/wiki/General:UOL)) | **Ardan already does this best** (bible Part 17's "chronicles that lie", feature 26's belief and truth). Every Far Land fact should come with who says it. |
| **Turchin and Ibn Khaldun** | Engines, not stories: empires on the steppe frontier; the three-generation clock | Use them as the Far Lands' history simulation rules (section 4) |

### What they share: ten principles for a world that is consistent and feels endless

1. **Top-down rules, bottom-up people.** The ground decides the money, the money decides the states, the states decide the lives. Then the lives surprise you.
2. **Every place has three ages of ruins.** The bible's eight eras show the method: each region should show remains from at least three of them.
3. **Every faction wants something it cannot get without someone else losing.** (Feature 47's want and fear, extended to houses, orders and towns.)
4. **Every fact has a teller.** Rumour, chronicle, holy text or eyewitness. The belief–truth gap is Ardan's signature.
5. **Every entity links to at least three others** (a rival, an ally, a debt, a teacher, a trade). That is the "never-ending web".
6. **One farther horizon,** never explained.
7. **Constraints over powers.** Distance, season, money, horses, the speed of news.
8. **Deepen before adding.** Use canon's unused depth before inventing.
9. **Blend, don't copy.** Two or three Earth sources and one twist no real kingdom had.
10. **Ids and validators.** Canon stays consistent because every id resolves (the house rules and `tools/validate.py`). The game stays consistent because features have tests. A tenfold world is impossible without both.

---

## 7. Targets at a glance

| Aspect | Ardan today (game, plus canon where larger) | Target | Ratio | Reasoning |
| --- | --- | --- | --- | --- |
| Land | 22.8M km² | about 64M km² (the Great Continent about 46M) | ×2.8 | Larger than Asia |
| Regions | 48 | about 150 | ×3 | About 400,000 km² each |
| Habitat zones | 287 | about 900 | ×3 | |
| Game provinces | 306 | about 1,100 | ×3.6 | Level of detail (recipe) |
| Gazetteer places | 2,769 | about 10,000 | ×3.6 | |
| People | about 101M | about 350M | ×3.5 | Earth c. 1300: 360–432M |
| Polities | 34 realms + 25 unclaimed | about 340 (about 150 full realms) | ×10 | Earth density (4.2) |
| Great powers | 10 | about 25 | ×2.5 | |
| Cultures | 24 | about 140 | ×6 | |
| Language families | about 13 | about 32 | ×2.5 | |
| Tongues | 29 | about 150 | ×5 | |
| Faiths | 19 | about 75 | ×4 | 12 families |
| Bloodlines | 42 | about 150 | ×3.5 | |
| Great houses | 180 | about 1,800 (mostly generated) | ×10 | |
| Cast | 573 written | about 3,000 written, plus generated | ×5 | North star: about 150 figures per life |
| Historical figures | 100 | about 600 | ×6 | |
| Wars | 43 | about 300 | ×7 | |
| Timeline events | about 1,190 | about 8,000 (simulation plus pinned canon) | ×7 | |
| Secrets | 71 | about 500 | ×7 | |
| Fallen empires and old states | 4 + 12 | about 15 + about 80 | ×6 | |
| Trade routes | 16 | about 80 | ×5 | |
| Creatures | 64 (25 in the game) | about 400 (about 150 in the game) | ×6 | Every zone gets a food web |
| Fighting styles | 265 | about 2,600 (about 650 by hand) | ×10 | |
| Root traditions (chains) | 61 | about 90 | ×1.5 | Lineages stay rare and deep |
| Schools and academies | 61 + 34 | about 500 + about 150 | ×8 | |
| Tactics | 137 | about 400 | ×3 | |
| Military-culture templates | about 9 in use | 16 | | |
| Orders of battle | 34 | about 340 | ×10 | Generated from templates |
| Elite units | 99 | about 900 | ×9 | |
| Sworn orders and companies | a handful | about 150 | | |
| Legends (hidden game tier) | about 12 (plan cap) | about 12 in the Known World, about 40 world-wide | ×3 | The top grows slowly |
| Customs | 102 | about 600 (3 per culture + 1 per realm) | ×6 | |

"Tenfold" applies where the owner asked for it: countries, styles, houses, orders and armies. For the land itself, and for things that must stay rare (lineages, Legends, dragons), ×3 is the honest number. Ten times the land at this tech level would be a world nobody could cross in a life.

---

## 8. Gap analysis: Ardan today against the framework

### 8.1 What is already strong

- **Geography is real geography.** Canon has plates, winds, currents, rain shadows, 48 regions with Köppen-style climates, and 287 habitat zones. The Far Lands can extend this model.
- **A cause for everything.** Canon's economy explains prices by distance; its armies explain composition by money and enemy; its beasts explain belief by truth.
- **History has depth.** Eight eras, four fallen empires, 12 old states, 43 wars and about 1,190 dated events.
- **The signature systems fit a bigger world.** Belief versus truth (26), the Chronicle (22), memory and callbacks (40-, 67-, 80-), customs as rules (47), beasts in their ranges (76), varied and fresh worlds (43, 70). Every one scales to a world where news is old.

### 8.2 The gaps

| # | Gap | Evidence | Framework layer |
| --- | --- | --- | --- |
| 1 | **The world is half of Asia and boxed in.** No landmass is a fifth of Asia. Beyond the box is only rumour. | 22.8M km², a 7,000 × 4,500 km box | 0, 1 |
| 2 | **The game uses a fraction of canon.** Canon has 287 habitat zones, 2,769 places, 84 tribes, 12 old states, 64 creatures and 42 bloodlines in depth. The game has 306 provinces, 25 combat beasts, and tribes only as text. **Under Sanderson's third law this is the first work, and the cheapest.** | `LORE.map.provinces` = 306; `A.BEASTS` = 25; tribes absent from `LORE` | all |
| 3 | **Few states for the land.** One realm per 670,000 km², against Earth's one per 300,000–375,000 c. 1200. No layer of lesser polities exists as realms (features 70 and 43 make some breakaways per run). | 34 realms; 25 unclaimed lands | 4 |
| 4 | **Missing polity kinds.** No mandala tribute, no thalassocracy as a full system, no military order with land, no exam state, no two-wing khaganate. | Realm `type` values | 4.3 |
| 5 | **The "Europe mirror"** the Road to Ten already names. The danger in the expansion is an "Asia mirror". | Plan, World and lore, item 3 | 3.2, 5.2, 6 (Le Guin, *Avatar*) |
| 6 | **Thin steppe.** The steppe is 2.4M km² against Earth's 7–8.5M, so the steppe-frontier engine of empire (Turchin) has no room. | Regions W-16, W-17, E-08 | 1.2, 4.1 |
| 7 | **Thin river cores.** No basin is over 1M km², so no hearth holds 100 million, and the population is too even. | Region table; realm populations | 1.2, 1.4 |
| 8 | **Beasts are sparse on the ground.** 191 of 306 provinces list no beast. No zone has a food web. Fallback beasts break ranges. | Feature 76 README | 5.6 |
| 9 | **Fighting styles are rich, but only for 34 realms.** 265 styles exist, and the ground-weapon-enemy rule is implicit. No style exists for elephants, junks, frozen rivers or roofs at scale. | `LORE.styles` | 5.5 |
| 10 | **Elite and sworn orders** exist as unit lines in armies (99), not as organizations with masters, rules and wants. | Armies book; part 6 | 5.4 |
| 11 | **Customs are the player's only.** NPCs do not follow them, and travel does not bring other realms' customs into play (47's own limits). In a big world this turns into "everyone abroad is the same". | 47 README | 5.3 |
| 12 | **Performance budget.** The build is 4.26 MB. The plan's target is a first download under 3 MB with heavy lore loaded on first use, and the war tick takes 9.4 ms for 212 divisions. A threefold map and tenfold realms cannot be carried naively. | Build output; plan, Technical | recipe |
| 13 | **No unattainable vista.** Silk from past the east edge is the only sign that the world goes on. | Part 6, TR-09 | 6 (Tolkien) |
| 14 | **Power scaling at world size.** The 12-Legend cap and the no-ranks canon rule both hold, but nothing says how the top grows when the world does. | Plan, Power scaling, item 7 | 5.7 |

---

## 9. The expansion recipe

Do the layers in order. A layer is done when its data validates and its tests pass. **No events about a land until its layers 1–4 exist.** That is the iceberg rule.

### Step 0: Deepen what exists (Sanderson's third law). About 3–4 feature folders.

- **Lesser polities.** Raise canon's 84 tribes and 12 old states into game data as lesser polities: liege, ruler, want. The Known World goes from 34 polities to about 70 without a new map.
- **Beasts.** Bring the 39 canon creatures not yet in `A.BEASTS` into the game with their canon ranges. Add plain local animals so no province is empty, and fix feature 76's listed fallbacks.
- **Gazetteer.** Bring places into the game as sub-province sites. Detail rises tenfold without new provinces.
- **Customs for NPCs and travellers.** Close feature 47's two limits.

### Step 1: The frame. Owner sign-off, no code.

- **Settle the frame:** the Known World is the western end of the Great Continent (section 0). The Far Lands extend beyond the box in the same coordinates.
- **Settle the hidden history** that links all lands (Oda's Void Century, Tolkien's further vistas). It goes in the private canon, never into events. One strong candidate already sits in canon: where the five peoples came from, and why dwarves left the Roof and giants walked north. Another: who makes the silk, and why they keep it secret.
- **Settle what stays unknown.** The far side of the Western Ocean stays unattainable.

### Step 2: Geography. An offline generator plus hand pins; about 2 weeks.

- Write `tools/world/` (or work in canon's `map/` tools; the owner decides where):
  1. plates and ranges;
  2. a heightmap;
  3. temperature;
  4. wind, rain and rain shadows;
  5. drainage, rivers and basins;
  6. biomes;
  7. habitat zones.

  This is the Dwarf Fortress order. Pin the existing 7,000 × 4,500 km box exactly. The generator runs only outside it.
- Output: regions with ids by land (`F-`, `B-`, `R-`, `M-`, `A-`, `H-`, `T-`, `I-`, `D-`, `N-`), habitat zones, rivers, passes, choke points and a raster.
- Validate against layer 1's rules:
  - every range on a plate edge;
  - every desert has a reason (latitude, wind or shadow);
  - every basin drains somewhere;
  - region sizes fall within G6.

### Step 3: Resources and trade. About 1 week.

- Each region gets resources from its geology and biome (2.1). Routes are braids, found by least cost (sea 1, river 5, land 25) between complementary regions. Choke points get owners in step 5.
- Add the monsoon calendar for the southern seas.

### Step 4: Peoples and tongues. About 2 weeks of writing.

- Define about 16 new language families: homeland basin, carrier, sound rules, number words and place-name roots, as canon's Part 13 does.
- Spread them with a simple diffusion run over the region graph: steppe fast, islands along coasts, highlands sticky.
- Out of that come about 100 cultures with naming rules, 3 words, food, war dress, pride and a despised neighbour.
- Pass the Le Guin test: no culture may be one real Asian people renamed. Blend two or three sources per culture and add one twist.
- Sensitivity check for a 13–23 audience: no culture is "the cruel East" or "the exotic East". Every one gets a point of view (Isayama's flip) and is shown at work, at home and at war.

### Step 5: History and polities. About 2–3 weeks.

- Run a Dwarf Fortress-style history from about 1000 BR to 1104 AR over the Far Lands, with these engines:
  - empires on the steppe frontier;
  - the three-generation clock;
  - khaganates splitting at a death;
  - mandala tribute;
  - how soldiers are paid decides how a state breaks.
- Pin the Known World's canon events, so the Far Lands' history touches them only where canon allows: the silk tolls, the Wind Empire, the Black Cough.
- Output: about 270 Far Land polities in the tiers of 4.3, their dynasties and ages, about 250 wars, about 7,000 timeline events, and about 12 fallen empires. A human then edits the top 25 polities by hand into full feature-47-style realm bibles: want, fear, customs, place. The rest stay generated with light data.

### Step 6: Faith, society and law. About 2 weeks of writing.

- Hand-write about 12 faith families, each with a homeland, a carrier route, a schism, a heresy, holy days and one secret. Generate the folk layer per culture.
- Give each polity one of the 20 social archetypes and one twist.
- Customs: 3 per culture, 1 per realm, with the four new kinds (exam, tribute, monsoon, census).

### Step 7: War, styles, beasts and orders. About 3 weeks.

- **Armies.** Encode the 16 military-culture templates. Generate 340 orders of battle from each polity's people, money and enemy. Hand-write about 900 elite units, at least the 250 of the great powers, the rest from templates.
- **Fighting styles.**
  - Hand-write about 30 new root traditions for the Far Lands, each with a founder, a text or relic, a dated split, a living master and one enemy style.
  - Hand-write about 400 national and school styles.
  - Generate household variants from parent, house and twist.
  - Every style names its weapon, ground, body, armour and carrier (5.5).
- **Beasts.**
  - Hand-write about 100 new creatures in canon's bestiary format, with belief and truth (about 25% hoaxes or misreadings).
  - Generate local animals per zone.
  - Assign every combat beast a range, so feature 76's rule covers the whole world.
- **Sworn orders.** About 150, each with a founding, a rule, a master, a size of 200–5,000 (the Templar model), a want and a rival order.
- **Legends.** About 28 new world-wide (about 40 in all), named in reputation groups, each with a rival and a weakness. No numbered tiers in prose.

### Step 8: People. Ongoing.

Houses (about 1,600 new, generated, the top 150 by hand), the cast (about 2,400 new written figures over time), figures, bloodlines and secrets, linked so that every entity has three ties.

### Step 9: Bring it into the game with level of detail

This step decides whether the expansion ships.

- **Three levels of simulation:**
  1. **The Known World and the player's current land:** full provinces, divisions, markets and events.
  2. **Neighbouring lands:** realm-level simulation. Treasuries, wars and rulers tick monthly; battles resolve abstractly.
  3. **Far lands:** the chronicle only. History advances on a yearly clock from the step 5 engines. News reaches the player late, through caravans, pilgrims and envoys, as rumour (feature 26's knowledge states).
- **Lazy loading.** Far Land lore and map tiles load on first contact, in packs per land. That keeps the plan's first-download target under 3 MB.
- **Province budget:** about 800 new provinces at most, coarse in empty lands. Benchmark `A.armyThink` and the month tick against the 9.4 ms war tick before and after.
- **New starts,** two or three per phase: a caravan child of the Sand Basins, a clan rider of the Long Grass, a deck-hand of the Thousand Isles. Each is a hand-made start in the manner of 29-starts.
- **A road west to east:** the Silk Road becomes a playable journey. It is the observer's way in (Le Guin) and the hero's road (Miura).
- **Tests and lints for every Far Land feature:**
  - every beast in range (76's test, extended);
  - every name lints against its culture's sound rules;
  - no Earth-language words (W11);
  - every polity has a want and a fear;
  - every entity has at least three links;
  - `tools/lint-events.mjs` and `tools/lint-choices.mjs` pass;
  - `bench/balance.mjs` holds the new starts in bands added with reasons to `bench/targets.mjs`.

### Step 10: Reveal in stages (Isayama, Oda)

| Phase | What the player can reach | What the player has only heard of |
| --- | --- | --- |
| 1 | The Long Grass and the Sand Basins: the near end of the Silk Road | The Twin Rivers |
| 2 | The Twin Rivers and the High Steppes | The Southern Peninsulas and the Isles |
| 3 | The monsoon lands and the Thousand Isles | The Sunrise Isles |
| 4 | The Black Pines, the Rime Coast and the Deep Southland | What lies across the Western Ocean, which stays unattainable |

At every phase the world feels endless because the next land is already in rumour, and the rumours are wrong in ways the player can later discover.

### Per-entity minimum (the template every writer and generator fills)

| Entity | Must have |
| --- | --- |
| Region | id, land, area, biome, climate (hottest and coldest months, rain), drainage basin, resources, habitat zones, one ruin from each of three ages |
| Polity | id, type, tier, liege or tributaries, ruler and house, dynasty age, people and culture mix, faith, how it pays soldiers, want, fear, 1 own custom, 1 place, the neighbour it fears and the one it covets, 1 secret |
| Culture | id, tongue, livelihood, faith, naming rules, 3 words, food, war dress, pride, despised neighbour, 3 customs |
| Faith | id, family, homeland, carrier route, holy days, schism, heresy, secret (belief and truth) |
| Style | id, root tradition, weapon, ground, body, armour, carrier (household, school, order or nation), founder or master, one enemy style, one weakness |
| Order or elite unit | id, size, founding date, rule or oath, master, want, rival, how it is paid |
| Beast | canon bestiary fields (anatomy, how it works, diet, lifespan, population, weak points, belief, truth), range regions, game stats if it fights |
| Legend | profile per canon's fighter brief: body, blood, teaching, gear, fights survived, mind, rivals, weakness |

### What to measure

- Polities per million km² of farmed or grazed land: between 2.5 and 3.5 (Earth c. 1200).
- Share of people in the two Far Land hearths: 50–60% of Far Land population.
- No province without a local beast.
- Every culture passes the Le Guin test in review.
- 90% of entities have at least three links.
- The first download stays under 3 MB (plan); the month tick stays within 10% of today's.
- The plan's existing World gate ("playtesters describe 3 realms by personality without the Codex") is extended to one Far Land per phase.

---

## Sources

Web sources used above, grouped by layer. Many are secondary (encyclopedias, teaching pages, fan wikis). Where the search engine itself flagged weak sources, they were used only for broad, uncontested points. In this session WebFetch could not reach any site, so every claim rests on search-result summaries. Check exact figures against the original works before quoting them in canon.

**Geography and climate**
- [Britannica Kids, *Asia*](https://kids.britannica.com/students/article/Asia/110518)
- [Cambridge, *World Geomorphology: Asia*](https://resolve.cambridge.org/core/books/world-geomorphology/asia/883DA41243FD07B878096756370C9B47)
- [peda.net, biomes of Asia](https://peda.net/id/6faf5be7354)
- [Britannica, *The Steppe*](https://www.britannica.com/place/the-Steppe)
- [Chernykh, "The Steppe Belt" (CSIC)](https://tp.revistas.csic.es/index.php/tp/article/download/149/150/152)
- [Geography Worlds, Eurasian grasslands](https://geographyworlds.com/blog/eurasian-grasslands-guide/)
- [Wikipedia, *List of drainage basins by area*](https://en.wikipedia.org/wiki/List_of_drainage_basins_by_area)
- [Atlas Sociologique, Asian basins](https://atlasocio.com/classements/geographie/hydrographie/classement-bassins-hydrographiques-par-superficie-asie.php)
- [Milbank Quarterly, *Population Potential of Monsoon Asia*](https://www.milbank.org/wp-content/uploads/mq/volume-25/issue-01/25-1-Migration-and-the-Population-Potential-of-Monsoon-Asia.pdf)
- [UNESCO, *Climate and meteorology of humid tropical Asia*](https://unesdoc.unesco.org/ark:/48223/pf0000010408)
- [Shortform on *Guns, Germs and Steel*](https://www.shortform.com/pdf/guns-germs-and-steel-pdf-jared-diamond)
- [PsyPost, testing Diamond's axis hypothesis](https://www.psypost.org/scientists-put-jared-diamonds-continental-axis-hypothesis-to-the-test-heres-what-they-found)
- [Wikipedia, *Dwarf Fortress*](https://en.wikipedia.org/wiki/Dwarf_Fortress)
- [DF wiki, *World*](https://dwarffortresswiki.org/index.php/40d:World)
- [DF wiki, *World token*](https://dwarffortresswiki.org/index.php/40d:World_token)
- [Wikipedia, *Estimates of historical world population*](https://en.wikipedia.org/wiki/Estimates_of_historical_world_population)

**Trade and economy**
- [China Xian Tour, Silk Road routes](https://www.chinaxiantour.com/silk-road-travel-guide/key-silk-road-routes)
- [Asia Society, *Geographical Setting of the Silk Roads*](https://asiasociety.org/node/13210)
- [Wikipedia, *Hexi Corridor*](https://www.wikipedia.com/wiki/Hexi_Zoulang)
- [J. Geography 71 (1962)](https://dx.doi.org/10.5026/jgeography.71.203)
- [Archania, *The Silk Road*](https://archania.org/p/arch-history/from-early-antiquity-to-the-middle-ages/classical-antiquity/the-silk-road)
- [Lancaster, *The Silk Road*](https://www.lancaster.ac.uk/people/wildo/silk/silk.html)
- [Model Diplomat, *Srivijaya*](https://modeldiplomat.com/learn/glossary/srivijaya-empire)
- [Everything Everywhere, *Srivijaya*](https://everything-everywhere.com/the-srivijaya-empire/)
- [OER Project, *Indian Ocean Routes*](https://www.oerproject.com/OER-Materials/OER-Media/HTML-Articles/Origins/Unit5/Indian-Ocean-Routes)
- [War History, *Trade between Middle East Countries and China before 1500*](https://warhistory.org/%40msw/article/trade-between-middle-east-countries-and-china-before-1500)
- [Aramco World, *Arabs and the Sea* (1962)](https://archive.aramcoworld.com/issue/196206/arabs.and.the.sea.htm)

**Peoples and languages**
- [Forbes México, citing Ethnologue](https://forbes.com.mx/?p=200312)
- [1StopAsia, *2,300 languages*](https://www.1stopasia.com/blog/one-continent-49-countries-and-2300-languages-asia/)
- [Ling, *How many language families*](https://ling-app.com/blog/how-many-language-families-are-there/)
- [Scott, *The Art of Not Being Governed* (abstract)](https://journalpub.escholarship.org/ssha_uhj/article/52649/galley/39703/download)
- [New Mandala review of Scott](https://newmandala.org/2010/07/05/review-of-art-of-not-being-governned-tlcnmrev-viii)

**Polities**
- [Turchin, Adams and Hall, *East-West Orientation of Historical Empires* (JWSR)](https://jwsr.pitt.edu/ojs/jwsr/article/download/369/381)
- [Turchin, *A theory for formation of large empires*](https://www.cambridge.org/core/product/21400792CA0F6794B9CDA343B74B21A9)
- [P2P Foundation summary](https://wiki.p2pfoundation.net/Formation_of_Large_Agrarian_Empires)
- [Chase-Dunn et al., *Middlemen and marcher states*](https://www.SocioStudies.org/journal/files/seh/2010_1/middlemen_and_marcher_states.pdf)
- [Wikipedia, *Asabiyyah*](https://en.wikipedia.org/wiki/Asabiyyah)
- [Miller Man School, *The Asabiyyah Cycle*](https://asabiyyah.millermanschool.com/)
- [Wikipedia, *Göktürk civil war*](https://en.wikipedia.org/wiki/G%C3%B6kt%C3%BCrk_civil_war)
- [Humanities Institute, Göktürk government](https://humanitiesinstitute.org/__static/b09422b93484319647bc4b515afabff7/gokturk-government(3).pdf?dl=1)
- [Wikipedia, *Mandala (political model)*](https://en.wikipedia.org/wiki/Mandala_(political_model))
- [Siam Society, *Mandala, segmentary state in Ayudhya*](https://thesiamsociety.org/wp-content/uploads/1990/03/JSS_078_1i_SunaitChutintaranond_MandalaSegmentaryStateInMedievalAyudhaya.pdf)
- [Wikipedia, *Imperial Estate*](https://en.wikipedia.org/wiki/Imperial_Estate)
- [Wikipedia, *Kleinstaaterei*](https://en.wikipedia.org/wiki/Kleinstaaterei)
- [SAGE, *Hanseatic League*](https://sk.sagepub.com/ency/edvol/embed/businesstoday/chpt/hanseatic-league)
- [War History, *Martial Merchants of the Baltic*](https://warhistory.org/zh/article/martial-merchants-of-the-baltic?amp=0)
- [Wikipedia, *Iqta'*](https://en.wikipedia.org/wiki/Iqta%27)
- [Cambridge, *The Mamluk institution in early Muslim India*](https://www.cambridge.org/core/journals/journal-of-the-royal-asiatic-society/article/mamluk-institution-in-early-muslim-india/6AD31700DFD87C17F3B1DAE2EE064324)
- [Euratlas, *Europe 1200*](https://www.euratlas.com/history_europe/europe_map_1200.html)
- [Stanford, *Sovereign States, Europe, Year 1200*](https://purl.stanford.edu/hw582qn4205)
- [Nations Online, *Jin and Southern Song*](https://nationsonline.org/oneworld/map/Chinese_dynasties/Jin_S-Song_Dynasty_Map.htm)
- [Kara-Khitan Khanate (Wikipedia mirror)](https://wikipedia2007.classicistranieri.com/k/a/r/Kara-Khitan_Khanate_3f72.html)

**Faith, society and war**
- [Smithsonian Folklife Festival, Silk Road faiths](https://festival.si.edu/2002/the-silk-road/the-silk-road-crossroads-and-encounters-of-faith/smithsonian)
- [UCLA Asia Pacific Center](https://asia.ucla.edu/apc/centralasia/article/117351)
- [WorldAtlas, *Manichaeism*](https://worldatlas.com/religion/manichaeism-the-religion-that-went-extinct.html)
- [Medievalists.net, *The three orders*](https://www.medievalists.net/2023/11/three-orders-medieval-society/)
- [IMC Leeds session 905 (2011)](https://www.imc.leeds.ac.uk/imcarchive/2011/sessions/905)
- [Wikipedia, *Mingghan*](https://en.wikipedia.org/wiki/Mingghan)
- [Medievalists.net, *Reintroduction: Mongols*](https://www.medievalists.net/2022/02/reintroduction-mongols)
- [War History, *Storm from the East*](https://warhistory.org/article/storm-from-the-east-the-mongol-art-of-war)
- [Wikipedia, *Battle of Yancheng*](https://en.wikipedia.org/wiki/Battle_of_Yancheng)
- [Wikipedia, *Jin–Song wars*](https://en.wikipedia.org/wiki/Jin%E2%80%93Song_wars)
- [Polsci Institute, Delhi Sultanate army](https://polsci.institute/indian-political-thought-l/composition-role-army-delhi-sultanate)
- [Unacademy, Delhi Sultanate military reforms](https://unacademy.com/content/military-reforms-under-delhi-sultanate/)
- [British Library catalogue, Mamluk furusiyya manual](https://searcharchives.bl.uk/catalog/040-003473744)
- [Qatar Digital Library, *Treatise on horsemanship*](https://www.qdl.qa/archive/81055/vdc_100149816191.0x0000a4)
- [World History Encyclopedia, *Knights Templar*](https://www.worldhistory.org/Knights_Templar/)
- [Helen Nicholson, *How many Templars were there?*](https://www.goodreads.com/author_blog_posts/10301700-how-many-templars-were-there)
- [Wikipedia, *German school of fencing*](https://en.wikipedia.org/wiki/German_school_of_fencing)
- [Wiktenauer, *Johannes Liechtenauer*](https://wiktenauer.com/wiki/Johannes_Liechtenauer)
- [Katori Shinto Ryu USA, lineage](https://katorishintoryu-usa.org/lineage.html)
- [Wikipedia, *Tose Yosazaemon Osamune*](https://en.wikipedia.org/wiki/Tose_Yosazaemon_Osamune)
- [Wikipedia, *Kalaripayattu*](https://en.wikipedia.org/wiki/Kalaripayattu)
- [Kerala Tourism, *Kalaripayattu origin*](https://www.keralatourism.org/kalaripayattu/origin/introduction)

**Worldbuilders**
- [Tolkien Gateway, *Letter 247*](https://tolkiengateway.net/wiki/Letter_247)
- [Wikipedia, *Impression of depth in The Lord of the Rings*](https://en.wikipedia.org/wiki/Impression_of_depth_in_The_Lord_of_the_Rings)
- [Wikipedia, *Iceberg theory*](https://en.wikipedia.org/wiki/Iceberg_theory)
- [Project MUSE, Tolkien and the iceberg](https://muse.jhu.edu/article/765775)
- [The Scotsman, *How Scottish history inspired Game of Thrones*](https://www.scotsman.com/arts-and-culture/how-scottish-history-inspired-game-of-thrones-2462643)
- [Seton Hall, *History and the Game of Thrones*](https://blogs.shu.edu/history/?p=21)
- [Modelthinkers, *Architects vs gardeners*](https://modelthinkers.com/mental-model/architects-vs-gardeners)
- [India Writes, *Martin on architects and gardeners*](https://www.indiawrites.org/why-write/george-r-r-martin-of-architects-and-gardeners)
- [Wikipedia, *From Elfland to Poughkeepsie*](https://en.wikipedia.org/wiki/From_Elfland_to_Poughkeepsie)
- [ursulakleguin.com, *From Elfland to Poughkeepsie*](https://www.ursulakleguin.com/from-elfland-to-poughkeepsie)
- [Wikipedia, *Ursula K. Le Guin*](https://en.wikipedia.org/wiki/Ursula_K._Le_Guin)
- [Coppermind, *Sanderson's Laws of Magic*](https://coppermind.net/wiki/Sanderson%27s_Laws_of_Magic)
- [Writing Excuses 9.21](https://writingexcuses.com/writing-excuses-9-21-sandersons-3rd-law/)
- [Sportskeeda, Void Century](https://sportskeeda.com/anime/one-piece-chapter-1062-teaser-hints-void-century-mystery)
- [Anime Corner, Oda on the ending](https://animecorner.me/eichiro-oda-says-one-piece-manga-will-end-in-4-5-years/)
- [Fandomwire, Oda's five-year plan](https://fandomwire.com/i-never-thought-one-piece-would-last-this-long-eiichiro-odas-initial-plan-was-to-end-one-piece-in-5-years/)
- [Wikipedia, *Four Emperors (One Piece)*](https://en.wikipedia.org/wiki/Four_Emperors_(One_Piece))
- [One Piece wiki, *Three Great Powers*](https://onepiece.fandom.com/wiki/Three_Great_Powers)
- [Slashfilm, Isayama's planned ending](https://slashfilm.com/1439560/attack-on-titan-creator-planned-ending-start)
- [Comicbook.com, Isayama](https://comicbook.com/anime/news/attack-on-titan-creator-hajime-isayama-eren-jaeger-story-planned-from-beginning/)
- [Berserk wiki, *Midland*](https://breezewiki.discard.no/berserk/wiki/Midland)
- [Berserk wiki, *Kushan*](https://breezewiki.discard.no/berserk/wiki/Kushan)
- [Wikipedia, *Avatar: The Last Airbender*](https://en.wikipedia.org/wiki/Avatar:_The_Last_Airbender)
- [Netflix Tudum, *What is bending?*](https://www.netflix.com/tudum/articles/what-is-bending-avatar-last-airbender)
- [Slashfilm, bending explained](https://slashfilm.com/1526194/avatar-the-last-airbender-powers-explained)
- [Paradox, *CK3 Dev Diary 2: The Medieval Map*](https://admin-forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-2-the-medieval-map.1274052/post-25989678)
- [Wikipedia, *Crusader Kings III*](https://en.wikipedia.org/wiki/Crusader_Kings_III)
- [TV Tropes, *The Elder Scrolls*](https://www.tvtropes.org/pmwiki/pmwiki.php/TheElderScrolls/TropesKToL)
- [UESP, *Unofficial lore*](https://content1.uesp.net/wiki/General:UOL)
