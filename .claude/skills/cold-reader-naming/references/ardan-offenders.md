# Ardan's names today against the cold-reader bar (the working list for order 100, wave 5)

*Stamped 2026-11-27 ET, read from the trunk at `d0d793d3` (before wave 1 lands). Counts are from
`scripts/name-audit.mjs` over a private build (`--unpack`): 9.0 MB of string and template literals on the page, which
is what a player can read plus some ids and keys. Re-run the audit before a pass and after it; these numbers are the
baseline wave 5 drives down. Waves 1 to 4 will rename and add names first (Primordials Noir, Blanc and Red; Vaskareth
the storm ancient; Dragon Slayer; 34 realms of five forms; a new map with 1,000+ provinces; thousands of skills,
hundreds of classes): put every new name through the skill's rules as it is made, and re-read this list against what
landed.*

## The verdict: far below the bar

The owner's bar (order 97, and his addition of 2026-11-27: "cold reader naming needs to far exceed what currently
exists in the game, using plain language a lot of the time instead of random buzz words like wyrm") is **not near**.
Today a newcomer meets, in plain sight:

- **4,941 uses of fantasy buzzwords and archaisms** (wyrm, drake, thane, jarl, hird, reeve, liege, castellan, fey,
  barrow, khan, sultan, emir, vizier, nome, yam, kremlin...) and **about 1,000 X-born / X-walker / X-breaker / X-hide /
  X-mane compounds** (71 distinct -born words alone);
- **66 pairs of near-identical proper nouns of different kinds** (a realm and a house, a house and a demon, a capital
  and a legend), several in triples: Corvasse / Corvane / Morvane / Corvan; Kesh / Vesh; Harrow / Harrak / Harrak;
- **14 of the 34 realms named outside order 99's five forms** (Holy See, Republic, Halls, Horde, Khanate, League,
  Sultanate, Confederacy, Emirate, Abbey, Free Port, Clans), and Kesh, the owner's own example, with no descriptor at all;
- **35 names lifted from other works and from real cities** in the name pools: Galadriel, Thranduil, Celeborn, Durin,
  Thrain, Thror, Oakenshield, Khazad, Elrohir, Anduin (Tolkien), Ironforge, Blackrock (Warcraft), Gruumsh (D&D),
  Hammerfell (Elder Scrolls), Stormbringer, Elric (Moorcock), Samarkand, Tashkent, Almaty, Basra, Madurai, Karakorum;
- **untranslated institutions** carried as if the player knew them: the Thing (132), Well-Keepers (130), Law-Carvers
  (120), War-Mother (72), Captain-General (69), the Ring (64), First Speaker (51), the Silver Tablet Guard (24), the
  King's Butts (14).

What is already good, and is the model: the **bestiary's plain species** (Cellar Rat, Gallows Crow, Bone-Crack Hyena,
Old Man of the Trees, Lake-Eater, Thinking Ooze, Colossus of the First Forge), **Hell's place names** (Soulmarket, the
Debt Fields, Bonefield, Tollbridge, the Long Quiet), **the skills** (Swordsmanship, Riding and the lance, Stewardship and
supply), **most classes** (Swordsman, Archer, Lancer, Ranger), the **common English pool** of people's names, and the
**faiths** (the Seven Halls, the Deep Law, the Drowned Queen).

## 1. Buzzwords and archaisms (counts in the page's strings, 2026-11-27)

"Noisy" words are also ordinary English (march as a verb, fell as a verb, shade as shadow): read the audit's examples
before counting them as offenders. Source files: `grep -rliw <word> src data` (wave 5 edits there, not in the build).

| Word | Uses | Plain word to use | Note |
| --- | ---: | --- | --- |
| reeve / reeves | 462 + 55 | headman (village), steward (an estate), overseer ("tin overseer") | a ladder rung (`O02`) and many local titles ("Tin Reeve of Wolfhaven") |
| khan / khans / khatun / khanate | 288 + 16 + 43 + 9 | king, kings, queen, kingdom | order 99: no khanates; Ulun's titles go with its form |
| sultan / sultans / sultanate | 276 + 17 + 28 | king, kings, kingdom | order 99: no sultanates (Qadir, Ambrel) |
| emir / emirs / emirate | 207 + 29 + 31 | prince, princes, principality | order 99: no emirates (Sabra) |
| castellan | 130 | castle keeper; "Keeper of {castle}" | also used as a surname ("Admiral Castellan") |
| yam | 128 | post station, way-station | steppe relay posts: "Otbash Yam" -> "Otbash Post Station" |
| thane / thanes | 122 + 49 | lord, lords (the lore itself glosses it "Baron (equivalent)": say baron) | |
| wyrm / wyrms | 103 + 10 | dragon; for the flightless cave line, "cave dragon" | **the owner's named example** |
| jarl / jarls | 102 + 23 | earl, earls | Northreach's nobility |
| liege | 89 | lord ("your lord") | also a relation kind in the people panel |
| barrow / barrows | 85 + 3 | burial mound, grave mound | some hits are a CSS class: read the examples |
| vizier | 61 | chief minister | Tamar |
| hird | 42 | household guard, the king's guard | "Hird Hall of Wolfhaven" |
| vale, fen, holt, tor, dale, mere | 42, 41, 6, 2, 3, 5 | valley, marsh, wood, hill, valley, lake | fine **inside** an English compound (Ashmere, Northmoor); not as a bare noun |
| nome / nomes | 36 + 1 | district | Tamar's "nome governors" |
| caravanserai | 36 | caravan inn | province names "Skartar Caravanserai" |
| kremlin | 34 | fortress, citadel | province names "Lubevo Kremlin" |
| veld | 33 | grassland | "the Western Veld" |
| drake / drakes / drakeling / dragonet | 29 + 18 + 1 + 2 | dragon, young dragon | the bestiary's lesser-dragon tier is literally named `drake` |
| lawspeaker | 25 | chief judge ("the Law-Speaker, the chief judge" at first sight) | Northreach |
| fey | 23 | fairy, fairies, hill folk | "Fey-Born", "Fey Countess", "Barrow Fey" |
| brimstone | 22 | sulphur | demons' drop and a demon's home |
| wyvern / wyverns | 20 + 4 | cliff dragon (a lesser dragon); or keep with the gloss "wyvern, a two-legged dragon" | |
| archdemon / archdemons | 13 + 17 | demon lord; the three Primordials: "the three First Demons" | the coordinator's ruling: "demon lord", not an invented rank word |
| primordial | 14 | first, oldest; gloss "the Primordials, the three first demons" | order 98 keeps the word as their name: gloss it every first sight |
| kinsman / kinsmen | 16 + 2 | cousin, relative | |
| fiend / fiends / imp / imps | 6 + 11 + 2 + 6 | demon, lesser demon, small demon | bestiary kinds Imp, Fiend, Greater Fiend |
| seneschal, hetman, boyar | 7, 2, 2 | steward, chief, lord | |
| revenant, wraith, wight, lich, shade (undead) | 2, 2, 1, 1, ~10 | risen dead, ghost, walking dead, undead sorcerer, ghost | bestiary undead line |
| ettin | 2 | two-headed giant | |
| bane (as a word) | 10 | killer | "Caravan-Bane" |
| unto, nay, aye | 3, 2, 2 | to, no, yes | "Faithful Unto Death" may stay as a set phrase |
| march / marches (a region) | ~150 of 779 + 153 | borderland, border country | "the Southern March", "the Scorched March", "the Free Marches" |
| warden / wardens | 472 + 275 | keeper, guard, captain: **say of what** | "Warden of the Oak Line Shires" says nothing a newcomer can use |
| marquis (a demon) | 20 of 40 | demon lord | "Marquis of the Burning Court" reads as a noble rank |

**Compound epithets** (counts of uses / distinct words): -born 293 / 71 (Oakborn, Snowborn, Winterborn, Sunborn,
Anvilborn, Mareborn, Twin-born, Hell-Born, Fey-Born); -breaker 100 / 73; -walker 114 / 56; -mane 116 / 32; -hide 104 /
25; -bane 43 / 22; -caller 43 / 41; -fang 39 / 36; -singer 31 / 27; -weaver 29 / 26; -slayer 22 / 21; -sworn (titles
Ember-Sworn, Debt-Sworn, Choir-Sworn, the class Oathsworn). **Rule:** a family name may be one plain English compound
(Winterborn is readable, like Ashford); an epithet or title says the deed in words ("Born in Hell", "Sworn to Noir",
"Killer of Seals" or simply "the Sealer"), and no two compounds stack on one person ("Grakka Ironhide the Bloodfist").
The elf, giant, dwarf and orc family pools are almost all such compounds (Moonwhisper, Stormcaller, Ironbeard,
Skullcrusher): keep them for those peoples (rule 11 lets them sound different) but cut the ones that read as game
clichés (Skullcrusher, Gutripper, Eyegouger, Deathbringer, Warbringer).

## 2. Untranslated institutions and set phrases

| Today | Count | Cold-reader form at first sight |
| --- | ---: | --- |
| the Thing (Northreach, Frostholm) | 132 | "the Thing, the free men's assembly" or simply "the Assembly" |
| Well-Keepers (Path of the Well) | 130 | "the Well-Keepers, Qadir's priests" |
| Law-Carvers (the Deep Law) | 120 | "the Law-Carvers, the dwarves' judges" |
| War-Mother (Ughrak) | 72 | "the War-Mother, the orc clans' war leader" |
| Captain-General (Corvasse) | 69 | fine; say "the pirates' elected captain" once |
| the Ring (Northreach council) | 64 | "the Council of Earls" |
| First Speaker (Brannoch) | 51 | "the First Speaker, head of the valley council" |
| Compact of 925, Charter of Highcastle | 41, - | fine as lore; never as a government's only description |
| Silver Tablet Guard | 24 | "the Khan's Guard" -> "the King's Guard of Ulun" |
| the Worldspine | 22 | "the Worldspine Mountains" |
| King's Butts of Ashmere (archery school) | 14 | "the King's Archery Range at Ashmere" |
| Hell's domains: the Cinderlands, the Gatelands, the Hush, the Scorched March, the Ashen Marches | 18, 20, 20, 4, - | "the Cinderlands, Hell's burning plain"; "the Gatelands, where Hell meets the world"; "the Hush, Hell's silent country"; "the Scorched March, the burnt borderland two demon lords fight over" (the owner named this one) |
| Prince of the Seventh Gate; Who Held the Ninth Gate; Keeper of the Crown's Gate; Warden of the Wyrm Gate | 4, 4, -, 2 | "Prince of Hell's Seventh Gate"; "Holder of Hell's Ninth Gate"; "Keeper of the Dragon Gate". **The owner's own example:** a numbered gate says of what |
| Gate Horror, Gate Tyrant, Gate Duke, gate-dukes | - | "Gate Horror (a demon that guards Hell's gates)" |
| Schools with no subject: Noon Hall, Arsenal Yard, Buckler Hall, The Still Hall, Hall of Still Hands, The Dice Yard, Tower of Far Eyes, House of Runners, The Drum Lodge, Hall of the Lion/Bear/Hammer | 61 schools | name + what it teaches + where: "Noon Hall, the sword school of Varenna" |

## 3. The 34 realms (order 99's forms: kingdom, empire, principality, merchant republic, free city)

Wave 1 (H-177, 178) applies order 99's forms; this column adds the cold-reader descriptor the list, the map and the
first card should carry. Change ids never; change `name`, `short`, `title` (the ruler's style) and `type`.

| Id | Today | Cold-reader name (first sight) | Why |
| --- | --- | --- | --- |
| POL-01 | Empire of Aldmark | Empire of Aldmark | fine |
| POL-02 | Holy See of Solenne | Principality of Solenne, the Church's realm | theocracy is not a form; "Holy See" is jargon |
| POL-03 | Kingdom of Varenna | Kingdom of Varenna | fine |
| POL-04 | Republic of Lucerna | Merchant Republic of Lucerna | order 99's form |
| POL-05 | Kingdom of Ashmere | Kingdom of Ashmere | fine (ash + lake) |
| POL-06 | Kingdom of Sylvaran | Kingdom of Sylvaran, the wood elves' kingdom | one letter off its people, the Sylvari: call them "the wood elves" |
| POL-07 | Kingdom of Eldergrove | Kingdom of Eldergrove, the sea elves' kingdom | a "crowned sea realm" named for a grove: the name hides what it is; its people are "Grovers of the Coast" (say "the sea elves") |
| POL-08 | Kingdom of Northreach | Kingdom of Northreach | fine; its jarls, Ring, Lawspeaker and hird are the offenders |
| POL-09 | Halls of Frostholm | Kingdom of Frostholm, a giants' kingdom | form; giants are not obvious from "Halls" |
| POL-10 | Kingdom of Irondeep | Kingdom of Irondeep, a dwarf kingdom | Irondeep / Emberdeep share shape and ending: always with the descriptor |
| POL-11 | Horde of Gorath | Kingdom of Gorath, the orc horde | form; orcs are demonic creatures now (order 98): wave 1 decides what rules here |
| POL-12 | Khanate of Ulun | Kingdom of Ulun, the steppe riders' kingdom | form; Khan -> King; capital Kharsa vs House Kharsan |
| POL-13 | League of Brannoch | Principality of Brannoch, the mountain valleys | form; House Brannoc and the demon Brann are one letter off |
| POL-14 | Kingdom of Greyhaven | Kingdom of Greyhaven | Greyhaven / Morhaven / Wolfhaven / Coldhaven: rename Morhaven, or keep the descriptor always |
| POL-15 | Kingdom of Morhaven | Kingdom of Morhaven (or a new name not in -haven) | as above; Morhaven vs Morvane |
| POL-16 | Free City of Ostra | Free City of Ostra | fine |
| POL-17 | Sultanate of Qadir | Kingdom of Qadir | form; capital Qadira is the realm plus one letter: rename the capital |
| POL-18 | Kingdom of Tamar | Kingdom of Tamar | god-king, vizier, nomes -> king, chief minister, districts |
| POL-19 | Sahrim Confederacy | Principality of Sahrim, the desert clans | form and descriptor |
| POL-20 | Empire of Zanara | Empire of Zanara | Zanara / Abara / Sabra: three -ra realms in one region |
| POL-21 | Kesh | Merchant Republic of Kesh | **the owner's example** ("Kesh becomes Kingdom of Kesh"): its government is merchant houses, so order 99's form is the merchant republic; the point of the example, a descriptor, holds either way. Kesh vs the demon Vesh |
| POL-22 | Kingdom of Abara | Kingdom of Abara | Abara vs Sabra: rename one (Sabra is changing form anyway) |
| POL-23 | Kingdom of Hrimfell | Kingdom of Hrimfell, the ice giants' kingdom | Hrimfell vs the legend Hrimgala; two giant realms |
| POL-24 | Emirate of Sabra | Principality of <new name> | form, and Abara / Sabira (province) / House Sabrani crowd it |
| POL-25 | Kingdom of Velgrad | Kingdom of Velgrad | fine |
| POL-26 | Kingdom of Drevna | Kingdom of Drevna | fine |
| POL-27 | Abbey of Skyhold | Principality of Skyhold, ruled by its abbot | form |
| POL-28 | Kingdom of Stonehold | Kingdom of Stonehold, a dwarf kingdom | Stonehold / Skyhold / Frostholm |
| POL-29 | Kingdom of Emberdeep | Kingdom of Emberdeep, the dwarves' forge kingdom | see Irondeep |
| POL-30 | Kingdom of Ranpur | Kingdom of Ranpur | fine |
| POL-31 | Kingdom of Tessaria | Kingdom of Tessaria | capital Tessar, House Tessaran, the legend Tessaly: rename the legend (below) |
| POL-32 | Sultanate of Ambrel | Kingdom of Ambrel | form |
| POL-33 | Free Port of Corvasse | Free City of Corvasse, the pirate port | form; Corvane / Morvane / Corvan |
| POL-34 | Ughrak Clans | Kingdom of Ughrak, the orc clans | form and descriptor |

## 4. Near-duplicate clusters (fix one side of each)

From `name-audit.mjs --near` (66 pairs; a realm and its people's name, Tamar -> Tamari, is by design and skipped).
Prefer to change the less-seen name: a house before a realm, a demon before a house.

| Cluster | Suggested fix |
| --- | --- |
| Corvasse (realm), House Corvane, Morvane (Primordial), Corvan the Sunbringer, House Calvane | Morvane becomes Noir (order 98); rename House Corvane; Corvan the Sunbringer may stay (a founder of old) |
| Kesh (realm), Vesh (demon) | rename the demon |
| House Harrow, Clan Harrak, Harrak (demon) | rename the demon (an orc clan and a demon one name is a story only if meant) |
| House Ironside, Clan Ironhide, the Ironhide title, the Ironhide Bear | keep Ironside; rename the clan; the title says the deed |
| Brannoch (realm), House Brannoc, Brann (demon), Bran Greycloak | rename the house and the demon |
| House Wren / Wren (demon); House Lark / Lark (demon); House Castor / Cantor (demon); Ansel (demon) / Anselm Six-Fingers; Rook (demon) / Hilda Rook; Mag (demon) / Mag Brine | the 33 demons take plain-word names that are also English surnames: give demons names no person carries, and their kind in front ("Wren, demon lord of the Hush") |
| Tessaria, Tessar, House Tessaran, Tessaly (legend) | the legend takes its title as its name: "the Tide Mother" |
| Serrath (legend), the Serra line, Sarnavoth (legend) | Serrath -> "the Queen of the Hollow Hills"; Sarnavoth is "the Dragon King" at first sight |
| Vaskareth, Vethrael, Vesh, Vesper, Varo | Vethrael becomes Blanc or Red (order 98); spread the rest over the alphabet |
| Qadir (realm), Qadira (capital), Qadiri (people) | rename the capital |
| Abara, Sabra, Sabira (province), House Sabrani, Zanara | rename Sabra (it changes form anyway) |
| Irondeep, Emberdeep; Stonehold, Skyhold, Frostholm; Greyhaven, Morhaven | always with the descriptor; rename Morhaven if the map rebuild allows |
| House Ardane / House Ordane; House Vell / House Pell; House Sagar / House Nagar; House Greymane / House Greywave | rename one of each pair |
| Hild Stonefoot / Hald Stonelung; Asfar / Asmar Asfari; Urgash / Durgash; Aurelia / Aurelio / Aurelian; Brom / Grom | lore figures: rename one of each where they share a page |
| Ashgar (ancient dragon) / Clan Ashgrave / Ashfang (elder dragon) / House Ashford | the dragons by their plain titles first ("the Fire Dragon, Ashgar") |
| Sylvaran (realm) / Sylvari (people) | call the people "the wood elves" |

## 5. Legends, Primordials and dragons (`data/legends.json`, `data/figures/`, `data/titles/`)

A legend is met once and must be read cold: **the plain title first, the name second**.

| Today | First sight | Note |
| --- | --- | --- |
| Sarnavoth, King of Dragons | the Dragon King, Sarnavoth | |
| Vaskareth, the Ash-Crowned, Burner of Nine Towns | Vaskareth, the Storm Dragon | order 98: the storm ancient; the "Ash-Crowned" title then contradicts him |
| Ashgar, Rimewing, Galeheart (ancient ash, frost, storm dragons) | the Fire Dragon, the Sea Dragon, (storm: Vaskareth) | order 97: storm, inferno and water; today's ash and frost and Galeheart's storm contradict it (wave 1) |
| Morvane, Ghazrul, Vethrael (Primordial Archdemons) | Noir, Blanc and Red (order 98), "the three First Demons" | Noir and Blanc are French words in a one-language world (rule 11): the owner chose them, so keep them and gloss them: "Noir, First Demon of Shadow", "Blanc, First Demon of Blood", "Red, First Demon of Hellfire" |
| Tessaly, First of the Deep, the Tide-Mother | the Tide Mother | |
| Ommul, the Lake That Thinks | the Thinking Lake | its title is better than its name |
| Serrath, Fey-Born, Queen of the Hollow Hills | the Queen of the Hollow Hills, a fairy queen | |
| Ul-Mavren, the Wandering King of Bones | the Bone King | |
| Kethra, Stormwing | Stormwing, the great storm bird | storm collides with Vaskareth: consider "Thunderwing" |
| Orrun, the Mountain-That-Walks | the Walking Mountain, a giant | |
| the Pale Shepherd, Mother of Wolves | fine; gloss "the wolves' spirit mother" | |
| the Iron Warden, Keeper of the Crown's Gate | the Iron Warden, a guardian of living iron | |
| Saqqar, the Sun-Lion | the Sun Lion | |
| Hrimgala, the White Winter | the White Winter, a winter spirit | |
| Cael Vardan, the Sword Saint | the Sword Saint, Cael Vardan | |
| demon kinds: Marquis of the Burning Court, Pit-Mother, Ledger-Keeper, Pit Wyrm | fire demon lord, brood mother, debt demon, pit serpent | the kind is read before the name |
| titles: Hell-Born, Ember-Sworn, Debt-Sworn, Choir-Sworn | Born in Hell, Sworn to Red, Sworn to Noir, Sworn to Blanc | |
| titles: Wyrm-Slayer (order 98: Dragon Slayer), Beast-Bane, Blooded | Dragon Slayer, Beast Killer, First Blood | |

## 6. The bestiary's dragon ladder (`data/bestiary.json`)

One ladder, one set of words, the same for every kind: **{kind} hatchling, young {kind} dragon, {kind} dragon,
elder {kind} dragon, ancient {kind} dragon**. Today the game uses nine words for dragons' ages and kinds (hatchling,
dragonet, wyrmling, drakeling, drake, wyrm, wyvern, great, elder) and a tier literally named `drake`.

| Today | Plain |
| --- | --- |
| family `wyrms`, tier `drake` | family "lesser dragons", tier "lesser dragon" (ids stay) |
| Cave Wyrmling, White Wyrm, Pale Wyrm, Deep Wyrm | young cave dragon, cave dragon, pale cave dragon, deep cave dragon |
| Ice Drakeling, Snow Drake, Rime Drake | young snow dragon, snow dragon, great snow dragon |
| Sunwall Wyvern, Crag Wyvern, Storm Wyvern | young cliff dragon, cliff dragon, storm cliff dragon (or "wyvern" kept with its gloss) |
| Amber Wyrm (flightless) | amber dragon |
| Sea Drake, Tide Drake | sea dragon, great sea dragon |
| Sand Dragon, Dune Drake | young sand dragon, sand dragon (today the bigger one has the smaller word) |
| Ash Hatchling, Ash Dragonet, Great Ash Dragon | ash hatchling, young ash dragon, ash dragon (only ash has "Great") |
| Hael Hounds | hell hounds (Hael is a misspelling the reader cannot place) |
| Ettin, Barrow Wight, Revenant, Wraith, Lich of the Long Night, Barrow Fey, Fey Countess, Fiend, Greater Fiend, Imp | two-headed giant, grave walker, risen dead, ghost, undead sorcerer of the Long Night, grave fairy, fairy countess, lesser demon, demon, small demon |

## 7. Places

- **Province names that carry an untranslated type word**: "... Kremlin" (4), "... Yam" (4), "... Caravanserai" (8),
  "... Oasis" (fine), "Sun Temple of Aldminster" (fine). Use the plain word: Lubevo Fortress, Otbash Post Station,
  Skartar Caravan Inn.
- **Clusters a map reader cannot tell apart** (one realm each, side by side): Jiamo / Jitamo / Jiwamo; Belovo / Belina /
  Belansk / Belek; Dobina / Dobin / Dobnik Fort; Fenandor / Fenali / Fenarin; Lirith / Lirthil; Rinthil / Rineron;
  Eriavel / Erilas / Eridor; Copperham / Copperton Tower; Tarona / Taria / Tarium; Mirgrad / Mireria / Miressa /
  Mirah / Miruma / Mirandor / Mirlas. The wave 2 map (1,000+ provinces) must draw names with a distinctness check
  among neighbours (first three letters, edit distance at least 3).
- **Wilds**: the Western Veld -> the Western Grasslands; the Trolness Fells -> the Trolness Hills; the Free Marches ->
  the Free Borderlands. Most wilds are already plain (the Burning Waste, the Deep Green, the Mammoth Downs).
- **Real and borrowed places in the pools** (drawn for new places and fiefs): Samarkand, Tashkent, Almaty, Karakorum,
  Bukhar, Otrar (steppe), Basra, Halab (desert), Madurai, Thanjavur (south), Ironforge, Hammerfell, Khazad (dwarf),
  Blackrock, Gruumsh (orc), Celeborn, Galadriel, Thranduil (elf), Jotunheim, Utgard (giant). Remove them in
  `docs/research/c7-name-data.json`, then `node tools/c7/build-names-data.mjs`.

## 8. People and houses

- **Borrowed given and family names** (`name-audit.mjs --borrowed`, 35 with the places above): Durin, Thrain, Thror,
  Dain, Nain, Fundin, Bombur, Gloin, Oakenshield (the Norse list of dwarves, but read as Tolkien's), Anduin, Elrohir,
  Elric, Arwen (Tolkien, Moorcock), Stormbringer (Moorcock's sword, as an orc family name), Attila (the Hun). Out, the
  same way. Real given names from any language are fine (that is the common pool): the list is only names a reader
  ties to another work or one famous person.
- **House names that are a realm's name plus a letter**: House Kharsan (Kharsa), House Brannoc (Brannoch), House
  Tessaran (Tessaria), House Tamaren (Tamar), House Sabrani (Sabra), House Keshari (Kesh), House Zarani (Zarak). A house
  named for its land is real history (the House of Wessex), so either make it exactly the land's name ("House of
  Kharsa") or a different word.
- **Epithets** in the lore are mostly good English (the Lawgiver, the Unlucky, the Wallbuilder, Six-Fingers). Cut the
  stacked and the clichéd: "Durgash Blood-Fist", "Who Bled Laughing" (a name that is a sentence).

## 9. Ranks, offices and classes

| Today | Plain |
| --- | --- |
| Reeve (ladder rung), Tin Reeve, mine-reeve | Headman; Tin Overseer; mine overseer |
| Banneret | Knight Banneret, "a knight who leads knights" (gloss once) |
| Franklin | Free Farmer |
| Castellan, Provost, Harbor-Master | Castle Keeper, Town Judge, Harbour Master |
| Chief of a Wind (count-marquis), Khatun | (Ulun's ranks follow its new form) |
| Toll-Warden of Zardeep, Warden of the Oak Line Shires, Edge Wardens | Toll Keeper of Zardeep; Keeper of the Oak Line; Border Guard |
| classes Hawkeye, Bulwark, Oathsworn, Dragon Spear | Sharpshooter, Shield Wall, Sworn Knight, Dragon Lancer (a class reads as a person, not an item or a nickname) |
| class Warden / class Guardian / rung Warden / the Iron Warden | one meaning per word: Warden and Guardian are two classes with one meaning; rename the class Warden (say what it guards: "Border Ranger") and let the rung say of what ("Keeper of the Bridge") |
| classes Sword Master / Blade Master / Blade Dancer | two "master" classes one word apart: say how they differ in the name ("Sword Master", "Knife Master") |

## 10. What to measure after the pass

- `name-audit.mjs` buzzword uses: from 4,941 to under 500, all of them glossed set terms or noisy plain English.
- `--near`: from 66 pairs to none a player can meet on one screen.
- `--borrowed`: 0.
- Every realm on the realm list, the map and the start screen reads "<Form> of <Name>" or carries its descriptor.
- A cold reader test: an agent who has never seen Ardan reads the first three screens and the first ten cards of three
  lives and lists every word it cannot explain (see the skill's "Test it").
