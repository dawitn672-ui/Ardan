# The far peoples

**Aspect:** World and lore (Road to Ten, World 1, 2 and 7; Events 6; Visual art 7; Replayability 1), for the Great Continent · **Kind:** data for 118 realms, 110 cultures and 55 faiths, a system file, 2 patches, 2 events, a generator

Round 10 makes the Great Continent the world. Its 118 far realms and 110 far cultures (`features/99-far-lands`) arrived as names, maps and armies only: no realm bible (47), no voice (54), no score of their own (73), no faith beyond the lore's text, and no way into a far life (29). This feature gives every one of them the depth a Known World realm or culture has, from the lore (`canon/lore/far-lands.json`, `peoples-and-faiths.json`), written fresh for the game.

## What it does

**1. Realm bibles for all 118 far realms** (`bible.<land>.data.core.js`, expanded into 47's `A.BIBLE_DATA` at load). Each realm has a want, a fear, a place, and three customs the engine keeps:

- **its own custom**, from the lore's custom of the polity: Taulen's triennial exams, Hesh's banner muster at the ring hunt, the Split Weir's water tax, the Corridor's year in a beacon tower, Sokdal's Grandmother's leave for war, Suraeng's Strait pilot, the Reef Captains' reckoning, Ndorima's gold law, the Telling of the Walk among the Old Mare orcs, the Cold Gate's rune in the Long Count wall at thirty;
- **one of its people's customs** (`C[culture]`, from the lore's three customs of each culture): the Plain Sennish bride bows to the tablets first, the Lake Sennish row the bride across open water, the Tea Mothers' estate goes down the mother's line, the Khuul youth gets his horse-name at the ring-hunt, the Mirror folk sink their dead with stones;
- **its faith's holy day** (`faiths.data.core.js`): the Ledger's Sweeping of Graves in April, the High Felt's White Month, the Old Sky's New Year, the Tide Ancestors' Great Flood Tide.

354 customs (272 distinct: the realms of one faith share its holy day). Each realm's three are of three kinds, two of them kinds a typical life meets. They use 47's ten kinds (year 118, ward 66, rite 27, wed 23, mourn 22, name 22, market 16, law 16, levy 9, grave 8) and **four new ones**, for lore customs 47 had no machinery for:

| Kind | When | What it does | Customs |
| --- | --- | --- | --- |
| `exam` | a set month every few years, free adults to 50 | a check on learning and wits; a pass is fame, honour and coin and a flag `fp_exam_<id>` | Taulen's triennial exams, Lioka's exams |
| `census` | a set month every few years | counts your household (you, a spouse, children under 16) and takes a head-tax per head | the Ledger of Hesh on the North Road, Seuvan's village uncle, Ngoru's elephant tribute, Lhudum's silver shoes, Thinsak's count by men, Rakhol's two tribute boats |
| `muster` | a set month each year | come mounted (or armed) and train; come without and pay | Hesh's banners, the Khaganate's count of tens, Kethra's stable count, Hestun's first-snow hunt, the salt caravan, the iron carry |
| `season` | a set month each year | debts or dues called at a season of the year: pay a share of your coin, or drop into the debtors' rank (`fp_debtor`, honour) | the Plain Sennish New Year's debts, Kemodari's water calendar, the Frost Riders' deep cold, the fur tax, the Fog Coast's posts, the Reef reckoning |

The first meeting is 47's scene (`rb_custom`); keeping a new kind runs its rule, and later meetings are applied and logged. In a far realm the scene speaks in the realm's voice (54). **Culture words** for all 110 far cultures come from the lore's three words of each (`words.data.core.js`): Plain Sennish *loushen*, *teival*, *shoren*; Left Wing Khuul *dzanghal*, *sargen*, *aghurteg*.

**2. Voices for all 110 far cultures** (`voices.a/b/c.data.core.js`, 54's own `A.VOICE_DATA`): a word for a lord, the ruler and the council, the year, a greeting, an oath and a curse, who says the sayings, 3 sayings and 2 or 3 knowledge lines in the culture's words, and a word swap. 332 sayings and 221 lines. For example:

| Culture | Lord · ruler · council | Greeting · oath · curse | A saying |
| --- | --- | --- | --- |
| Plain Sennish | *hauren* · *Tienshou* · *sevlun* | "Rice in your bowl." · "By the Ledger and my fathers' tablets." · "May your entry be lost." | "What is not written did not happen," the clerks say. |
| Left Wing Khuul | *noyan* · *Khagan* · *Felt Council* | "Good grass and a fast horse." · "By the felt sky and the horse under me." | "Step over the threshold, never on it." |
| Trough folk | *dzongpon* · *Gyalpo* · *gonlung* | "May the sky be clear on your road." · "May the vultures refuse you." | "One son in three goes up the hill." |
| Menari | *tevoere* · *Spear-Marshal* | "Face the sunrise." · "May you turn your back on the dawn." | "A lost lord means a shaved head." |

54 read an event's realm and culture gates with two-digit ids, so `POL-153` read as `POL-15`; this feature reads ids of any length (an event with only two-digit ids is read by 54's own code, unchanged).

**3. Faiths** (`faiths.data.core.js`): each of the 55 far faiths has its clergy's word, its holy days with their months (the lore's, parsed by `gen/gen.mjs`), and its day's rite as a custom of the realms that keep it. They work where the release's faiths do:

- `C.faith(p, 'REL-20')` reads them as it reads any faith (the release's helper);
- the release's scenes name the faith's priest from a table of the 19 Known World faiths; a far faith now has its own (patch `FARP-PRIEST`: *the examined official*, *the felt-keeper*, *the tide-caller*), and a far people its own food (patch `FARP-FOOD`);
- the feast days the release names (`GD.FESTIVALS`: "You go to Return Day", "the fair at {festival}") are, in a far realm, the player's own faith's days;
- a far believer living under another faith keeps their own holy days (a log line and a little piety);
- a far orc, dwarf or giant realm keeps its own faith, where the release gave every orc the Horde's and every dwarf the Deep Law (`A.faithFor`).

Two far realms keep a Known World faith in the lore (Fjorund the Hall-giants' Mothers, Hadun the Path of the Well); each has a holy day here.

**4. Score** (`score.data.core.js`): six new families in 73's table (*ledger* for the Twin Rivers, *hills* for the hill clans, *silk* for the oases, *felt* for the Long Grass, *taiga* for the Black Pines, *ember* for the Sunrise Isles) beside 73's own (the Peninsulas hear 73's monsoon and isles families, the Deep Southland its savanna, the High Steppes its roof). Every far culture is mapped to a family with its own retuning (tonic, tempo, lead, drum, room), so no two peoples compose the same piece. The scheduler takes the land from the realm that first held your province, as before.

**5. Starts** (`starts.events.js`): a life born in a far realm opens with `fp_start`, built from its land (10), its realm's kind (12) and its rank (8): 80 openings, with three choices for the unfree, the common, the trades and the high-born. The choice comes back six years on (`fp_start_echo`). A Known World birth and a chosen 29 story open as before.

**6. The year as each realm names it** (`years.data.core.js`, and the generator's `A.FARP_REIGN` from `far-lands.json`). 77 far rulers have the year they came to power in the lore ("king since 1081", "took the throne in 1096"), and 115 houses the year they began to rule. 54's year name now uses them, until the throne changes hands in play (then the realm's own history counts), and the eras the faiths count by: *year 1745 of the Long Count, the 174th of House Ishe* (Taulen), *the tenth year of Bargai, year 1745 of the Long Count* (Hesh), *the fifth year of Vahesh, the 916th of the Lamp* (Ozand), *the seventy-fifth year of Kaldur on the wall, rune 3505 of the Long Count* (the Cold Gate), *the twentieth turn of the Wheel under Ishvan, the seventy-second of House Dhanvar* (Vahra). All 118 far realms name the year their own way.

**7. The release's two other per-culture tables** (`tables.data.core.js`, patches `FARP-GAME` and `FARP-LORD`): every far culture has its children's game (Dyke and Flood, Tiger and Goats, Thirty-One, Gebeta) and the lord a commoner answers to (the magistrate, the banner captain, the clan-mother, the dyke-head), which the release's childhood and village scenes now show.

**8. Far people in the people views.** The person view (`UI.personModal`, which 55, 41 and 64 draw into) gets a "Their people" section for a far person, courtier, spouse or stranger: their people's greeting and oath, their faith's holy day and rite and its clergy, one of their people's manners, their food.

**9. The powers inside each far realm** (`powers.data.core.js`): the release's five kinds of faction (56 fills them with houses by their wants) named as each realm's own politics on a Realm tab card, "The powers of Hesh": the Sennish ministers (peace), the examined officials (liberty), the banner princes (war), the khagan's friends at court (claimant), the Wall Households (independence), with the faction that stands now, its houses, leader and discontent. 21 realms are named from their lore (Taulen's Chancellery and silk guilds, the Khaganate's Felt Keepers and Right Wing, Menaro's Kalvaro and Harovi), the rest by their kind of realm.

**10. One world** (`world.data.core.js`): in a Great Continent game the Known World's 24 cultures speak of the lands past the edge (48 lines: *Velgrad's silk merchants say silk comes from beyond the east edge, and say nothing more*), every far culture speaks of the west (220 lines, by land: *A broker never tells the truth about distance, and the west is very far away*), and six stories of the chain of hands are secrets with their truth in 26-belief-truth's `LORE.secrets` (where silk comes from, the road's length, the east's barbarians, Ranpur's white elephant, the first forge, the sails without oars). None of it is in a Known World game.

## Measured by (`test.mjs`)

| Test | Result |
| --- | --- |
| `fpBiblesComplete` | 118 far realms, 354 customs (272 distinct), every one of a known kind with valid fields; three kinds a realm, two that a typical life meets; 110 of 110 cultures with words |
| `fpScenesRender` | 346 far scenes rendered from a life in their realm and defied: no raw token, no markup, none over 80 words with its voice line (161 end in the realm's voice); the 27 customs of the new kinds run and log clean lines |
| `fpNewKindsFire` | exam, census, muster and season each fire at their month and year, the first meeting is a scene whose keep runs the rule (the census takes 2 suns, the muster 6, the water calendar 12), and a later meeting is quiet |
| `fpVoicesComplete` | 110 of 110 far cultures have a full bank (332 sayings, 221 lines), every string fills, no line names a creature; every token fills for a life in each of the ten lands; the Realm cards render and change neither the state nor the stream |
| `fpFaiths` | 55 far faiths with clergy and a holy day; under the Ledger the feast days are the New Year of the Ledger, the Sweeping of Graves, the Hungry Ghosts and the Emperor's Furrow, in the Known World New Year's Day as before; a Flame believer under the Ledger keeps the New Day |
| `fpScore` | 330 pieces (110 cultures × 3 dates) in 16 families: each composed twice the same, all 330 different, every note in its mode in peace and war, every phrase ending on the tonic or the fifth; the Khaganate hears the Left Wing Khuul, read without touching the state |
| `fpStarts` | 80 openings (10 lands × 8 ranks) render and resolve; the callback reads the choice; none for a Known World birth or a chosen story |
| `fpYearNames` | 118 of 118 far realms name the year their own way (77 by the lore's reign); Hesh counts from 1096, and a successor does not inherit the lore's year; Aldmark still *the twenty-fifth winter of Aldwin* |
| `fpTables` | 110 of 110 far cultures with a game and a lord; the game scene shows a far child's own game and the bailiff scene its own lord in 40 of 40; Aldmark's children still play the Ring Game |
| `fpPeopleViews` | 33 of 33 far people, Hesh's court among them, show their people in the person view, without touching the state; a Known World person shows none |
| `fpPowers` | 118 far realms with their powers named; the card is on the Realm tab and pure |
| `fpOneWorld` | 24 Known World cultures with 48 lines about the far lands, 110 far cultures with 220 about the west, 6 secrets, all only in a Great Continent game |
| `fpKnownWorldSame` | 3 Known World lives of 5 years (Aldmark, the Red Waste, Stonehold) with and without this feature (the build derived by cutting its code, events and patches): the same state hash and random stream |
| `fpFarLives` | three far births play ten years on the Great Continent. Taulen, a peasant: the exams met 3 times, the Sweeping of Graves 10; the Khaganate: the count of tens 10, the horse-name at the ring hunt, the White Month 10; Kemodari, an artisan: the water calendar 10, the Silent Day 10. Voices in every life: greetings in the culture's words, titles, lines and the speakers' manner |

**Rules kept.** Everything is gated on the far lands (`A.FAR.active` and a far realm): a Known World game runs none of it. Draws come only from `A.chance` inside the engine (the exam, an opening's choice); views and cards only read. New fields (`pc.fpd`, the year a holy day was kept; flags `fp_*`) are optional, so old saves load. The data holds no markup and every card escapes.

**Regenerate** `words.data.core.js` with `node features/990-far-peoples/gen/gen.mjs` (`--check` to compare); it needs the gitignored lore.

## Limits

- **41 lore rulers have no accession year**; their realms count the year by their house, an era, or their own reckoning.
- **Customs are the player's**, as in 47: NPCs do not sit exams or pay the census.
- **The voices' creature check** is against the bestiary in the build; a later far beast whose name is a common word (a tiger, a bear) could fail it.
- **Factions are 56's.** The far realms' powers name the five kinds the engine has; a faction the lore has that fits none of them (the Censorate, the Silk Office) is not a faction of its own. 56 draws a faction by `A.FACTIONS[kind].name`; a one-line hook in 56's `view.core.js` `facName` (`A.FARP_POWERS_NAME && A.FARP_POWERS_NAME(f) || ...`, which takes the faction, not its kind) would show the realm's own name in 56's views too; this feature defines `A.FARP_POWERS_NAME` for it.
