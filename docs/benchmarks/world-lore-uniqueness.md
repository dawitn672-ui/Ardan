# World and lore, and Uniqueness: benchmark

Oct 13, 2026 · build `b593143` plus the fix layer (`features/00-` to `05-`) · scores today (strict, from "Ardan Road to 100"): **World and lore 6**, **Uniqueness 7**

These two aspects are benchmarked together because they are one claim. Ardan's pitch is "one life, lived day by day, inside a realistic world whose history everyone writes, including you." That is a world-and-lore promise. If the world does not remember, nothing about Ardan is unique.

**How Ardan was measured for this doc.**

- *Static.* All 3,199 events were loaded from the 30 packs in a sandbox and scanned (conditions, prose, setup code). The `LORE` tables were pulled from the core blob. Engine rules were read with `tools/show.mjs` and grep on `.build/`.
- *Bots.* 12 lives were played headless in Chromium on `index.html`, seeds `4242 + i×7919`, with auto choices (`A.eventAuto`). The 12 starts span 12 realms and 4 races. 11 lives ran 46 to 60 years; 1 died at 2 and is excluded. Together they saw 2,983 events.
- *Research limits.* This session's network policy blocked direct page fetches, so claims about other games rest on search-engine summaries of the linked pages. Numbers that come only from a fan or third-party source are marked as such. Anything I could not source is left out.

---

## 1. The bar

A 10 in this genre (a life inside a simulated history) does three things at once.

1. **The world is its own place, and that changes what you do, not just what things are called.** CK3 cultures are bundles of rules with mechanical effects and map conditions.
2. **The world remembers.** Everything that happens in a run is kept, dated and findable, and the game's own text points back at it. Dwarf Fortress legends and Caves of Qud's sultan histories do this.
3. **You learn the world by living in it.** Knowledge is partial, earned and sometimes wrong. Dwarf Fortress hides its legends until you find them, Qud's sources contradict each other, and Pentiment never tells you who the killer was.

For uniqueness, a 10 means a stranger can say what the game is in one sentence without naming another game, because its signature systems show up in every session. Disco Elysium's talking skills are the model: an idea other designers can name, and want to steal.

---

## 2. How the best do it

### Dwarf Fortress: generated history you have to dig up

**Mechanism.** World generation simulates centuries of history before you play. Legends mode lets you browse it. Optionally, the history stays hidden until you find it in the world.

**How it works.**

- **Named cast.** Only a small share of the population is tracked in full, as "historical figures". Everyone else is abstract, for memory reasons.
- **Legends mode.** Shows civilizations, sites, figures and events, ordered by age.
- **Hidden history.** With "Reveal All Historical Events" set to NO, most of the history stays hidden in Legends mode until an adventurer uncovers it. Adventurers do that by talking to people, by looking at images on coins, armor, engravings and statues, and by finding artifacts and books. Legends mode shows a count of the legends still "lost in the mists of time".
- **Art that remembers.** Engravings of well-crafted quality and above usually depict earlier events. Tarn Adams has called engravings a particularly powerful prompt for emergent narrative.
- **Named in its own tongue.** Each race has its own word list. Dwarven words name the universe, continents, rivers, governments, settlements, dwarves, artifacts and engravings.
- **Closest rival.** Adventure mode is "one character in a generated history". That makes it the closest existing game to Ardan's core line.

**Numbers.** The wiki warns that a large world with a thousand years of history can produce an XML export of up to a gigabyte.

**Lesson for Ardan.**

- Ardan already has the right cast split: 573 written cast members plus generated NPCs. What it lacks is a record of what they did.
- Put history *inside things the player meets*: a battlefield, a sword, a tomb, a coin. Each one should point at a dated chronicle entry.
- Hide what your character doesn't know, and show a "lost legends" count so the hiding feels deliberate.
- Do not copy Dwarf Fortress's legibility. Its history is huge and hard to read. Ardan's edge is authored, readable prose.

**Sources.** [DF wiki: Legend (DF2014)](https://dwarffortresswiki.org/index.php/DF2014:Legend), [DF wiki: Legends (v0.34)](https://dwarffortresswiki.org/index.php/v0.34:Legends), [DF wiki: Historical figure](https://dwarffortresswiki.org/index.php/DF2014:Historical_figure), [DF wiki: Engraving (v0.34)](https://dwarffortresswiki.org/index.php/v0.34:Engraving), [DF wiki: XML dump](https://dwarffortresswiki.org/index.php/XML_dump), [DF wiki: Dwarven language](https://dwarffortresswiki.org/dwarven_language), [DF wiki: Adventure mode](https://dwarffortresswiki.org/index.php/DF2014:Adventure_mode), [Smith Nicholls and Cook, "That Darned Sandstorm" (arXiv 2023)](https://arxiv.org/pdf/2304.08293), which reports the Adams comment on engravings.

### Crusader Kings III: culture is a set of rules

**Mechanism.** Every culture is made of pillars plus traditions, and each tradition carries mechanical effects.

**How it works.**

- **Pillars.** Each culture has 5: heritage, language, martial custom, aesthetics and ethos. There are 7 ethoses, and each culture has one.
- **Pillars change play.** Martial custom sets whether men, women or both can be commanders and knights. A shared language raises cultural acceptance.
- **Traditions cost prestige.** The price depends on whether they match your ethos.
- **Traditions have conditions.** "Hill Dwellers" needs your culture present in a county with hills. "Only the Strong" costs more unless the cultural head has 6 knights with at least 12 prowess. There are regional traditions and heritage traditions.
- **Cultures change.** Hybridizing needs the other culture inside your realm, enough acceptance, and a different heritage. Diverging changes at least one pillar.
- **Legends of the Dead** (PC, March 4, 2024) adds legends you commission about your dynasty and promote so they spread, plus court chroniclers who produce propaganda.

**Numbers.** A third-party database counts 193 traditions as of patch 1.19 (unverified against the game).

**Lesson for Ardan.**

- A custom is only real if a rule reads it. Ardan's realm bibles must be data the engine checks, and some customs should hang on the map ("only where there are hills").
- CK3's Legends turn the chronicle into something you can buy and bias. That fits Ardan's belief-versus-truth idea better than it fits CK3.
- CK3 can use real cultures because it *is* Earth. Ardan claims to be invented, so it has to invent.

**Sources.** [CK3 Dev Diary #64, "Cultures Are Forever"](https://admin-forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-64-cultures-are-forever.1479565), [CK3 Dev Diary #65, "One Culture Is Not Enough"](https://admin-forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-65-one-culture-is-not-enough.1480529), [Game Rant: how to change culture](https://gamerant.com/crusader-kings-3-how-change-culture/), [PC Gamer: hybrid cultures](https://www.pcgamer.com/crusader-kings-3-ck3-hybrid-culture/), [Prima Games: ethos and traditions](https://primagames.com/gaming/crusader-kings-3-royal-court-ethos-cultural-traditions-guide), [CK Strategy Hub traditions database (third party)](https://ckstrategyhub.com/database/traditions/), [Steam: CK3 Dev Diary #144](https://steamcommunity.com/games/1158310/announcements/detail/4035857237863291336), [GGRecon: Legends of the Dead release](https://www.ggrecon.com/guides/crusader-kings-3-legends-of-the-dead-release/).

### Kenshi: a world that does not wait for you

**Mechanism.** Factions act on their own. When something big changes, places change too.

**How it works.**

- **Scale.** The playable area is 870 km². The fan wiki lists 93 factions.
- **The world goes on without you.** Factions wage war, caravans cross the wastes, and the world runs with or without the player.
- **Power vacuums change places.** They spawn new locations or hand towns to new factions. A guide documents "town overrides": after a faction leader is killed or kidnapped, a town is swapped for a version run by another faction.
- **You are nobody.** Chris Hunt says he hates the "chosen one" trope. You start as "a normal runt": "You are not special, you are nothing."
- **Factions matter, people don't.** A GDC 2022 narrative paper calls Kenshi "a game of factions" where individuals carry little weight.

**Lesson for Ardan.**

- Ardan already churns more than it shows. In 60 bot years, a median of 32 wars are fought and 31 of 35 thrones change hands.
- The gap is visibility. Kenshi shows change in the places you walk through. Ardan needs the same in the places you live: when your home province changes hands, the laws, prices, names and events you meet should change.
- The world also needs more than war. Kenshi's world has caravans and cannibals as well as battles.

**Sources.** [Wikipedia: Kenshi](https://en.wikipedia.org/wiki/Kenshi_(video_game)), [Kenshi wiki: Faction](https://kenshi.fandom.com/wiki/Faction), [The Register (2019)](https://www.theregister.com/2019/05/31/kenshi_sandblasted_swordpunk_where_the_dungeon_master_wants_everyone_dead/), [Siliconera on Kenshi's development](https://www.siliconera.com/kenshis-eight-year-development-journey-from-one-man-rpg-to-a-teams-success/), [PC Gamer: "Too many games let their players succeed"](https://www.pcgamer.com/games/survival-crafting/too-many-games-let-their-players-succeed-says-developer-of-notoriously-tough-survival-rpg-kenshi-and-thats-mind-numbingly-boring-to-me/), [Raider King: town overrides (guide)](https://raiderking.com/kenshi-town-overrides/), [Knezek, GDC 2022 Narrative Poster paper](https://media.gdcvault.com/GDC+2022/Game+Narrative+Poster+Review/Knezek+Paper.pdf).

### Pentiment: history as a contested record

**Mechanism.** The game is framed as a chronicle. What you learn depends on who you are, and the truth is never handed to you.

**How it works.**

- **No canonical killer.** Josh Sawyer: "we do not ever definitively tell you, canonically, (who) the murderer (is)." You decide who pays, guilty or not.
- **Time and memory.** The story spans about 25 years. In its last act (1543) the town commissions a mural of Tassing's history.
- **Letters show class.** The lettering of each line marks the speaker's class and literacy: a rough hand for peasants, a refined cursive for the middle class, a Humanist script for university men, Gothic blackletter for monks, print for printers. Lettermatic drew over 2,700 glyphs.
- **Letters show what you know.** A character's lettering changes as Andreas learns more about them. Testers were confused by it.
- **Background opens doors.** Andreas's background is chosen: years in Basel, Flanders or Italy each grant languages, and studies such as theology, law or medicine help him read related clues.
- **You can't see everything.** Time is short, and you cannot eat with every villager or follow every lead.

**Lesson for Ardan.**

- A chronicle that is allowed to be wrong, and stays wrong, is a signature in itself.
- What your character knows should decide what lore they can read inside an event. Ardan already tracks languages and literacy (`lang` and `literate` are effect keys), so this can start as code.
- Scarce attention makes knowledge feel earned.
- Lettering by class belongs to the art aspect, later.

**Sources.** [TheGamer: Pentiment won't tell you the murderer](https://www.thegamer.com/pentiment-canon-murderer-unrevealed/), [Wikipedia: Pentiment](https://en.wikipedia.org/wiki/Pentiment_(video_game)), [PC Gamer, "Master Stroke" (via PressReader)](https://www.pressreader.com/usa/pc-gamer-us/20221129/281878712366441), [Lettermatic: Pentiment custom fonts](https://lettermatic.com/custom/pentiment), [GameBanshee: Sawyer on fonts](https://gamebanshee.com/9kaxf), [Pro Game Guides: background choices](https://progameguides.com/pentiment/all-background-choices-in-pentiment-and-what-they-do/), [Prima Games: who to eat with](https://primagames.com/tips/the-artists-guide-on-who-to-eat-with-in-pentiment), [Twinfinite review](https://twinfinite.net/2022/11/pentiment-review-a-medieval-murder-mystery-to-die-for/).

### Caves of Qud: generated history, found in pieces, told two ways

**Mechanism.** History is generated, then explained after the fact. You discover it a piece at a time, from sources that disagree, and secrets work as money.

**How it works.**

- **Sultans.** Each game generates 5 sultans. A sixth, Resheph, is fixed.
- **Generate first, explain later.** The generator makes events first and rationalizes them afterwards ("ex post facto"), using a state machine and a replacement grammar. It avoids a full historical simulation.
- **A journal that fills.** Events enter the journal's Sultan Histories only as you uncover them, from shrines, statues, and painted or engraved items.
- **Two accounts.** Gospels tell each event one way. Tomb inscriptions tell the same event another way: they inflate the praise and leave out the sultan's shortcomings.
- **Secrets as money.** The water ritual lets you trade a secret with a legendary or unique creature. Each secret can be traded only once. There are 7 kinds: locations, sultan histories, village histories, gossip and lore, recipes, chronology, and general notes.
- **Generated villages.** Each has its own faction, history, architecture, art, proverb, signature dish, signature skill and NPCs.

**Lesson for Ardan.**

- Ardan already holds Qud's raw material in hand-written form. 71 secrets carry exactly Qud's fields: the public story (`pub`), the `truth`, `who` knows, the `proof`, and what happens if revealed (`ifr`).
- What's missing is the play. Make secrets currency, let sources disagree, and let the journal fill.
- "Generate, then rationalize" is a cheap way to fill the gaps between authored canon entries.

**Sources.** [Qud wiki: Sultan history](https://wiki.cavesofqud.com/wiki/Sultan_history), [Qud wiki: Secret](https://wiki.cavesofqud.com/wiki/Secret), [Grinblat and Bucklew, "Subverting Historical Cause & Effect" (FDG 2017)](https://www.pcgworkshop.com/archive/grinblat2017subverting.pdf), [GDC Vault: Procedurally Generating History in Caves of Qud (2018)](https://gdcvault.com/play/1024990/Procedurally-Generating-History-in-Caves), [GDC Vault: village generation talk](https://gdcvault.com/play/1025914), [The Geekiary: generated villages release write-up](https://thegeekiary.com/?p=54078), [Retroware: Procedurally Generated History](https://articles.retroware.com/2020/11/18/procedurally-generated-history/).

### Disco Elysium: worldbuilding through who you are

**Mechanism.** Lore arrives through the character's own skills, which speak as voices inside dialogue. It does not arrive through a codex.

**How it works.**

- **24 skill voices.** Each skill can speak to the player directly. Kurvitz has said the dialogue system drew on Twitter, with interjections working like replies, and key facts get repeated by several skills at key moments.
- **Passive checks.** These fire automatically, set by skill level rather than dice, and add information or dialogue options the player may not know they earned.
- **Retries.** White checks can be retried after something changes. Red checks happen once.
- **A deep world, delivered through a mind.** The setting existed as a tabletop world, with over 6,000 years of history, before the game. The script is about a million words.
- **A stealable idea.** Kurvitz: "I really hope people steal this idea from us — to turn skills into people you can talk to."

**Lesson for Ardan.**

- Lore should arrive as a line inside an event, which your character sees *because of who they are*: a priest spots the heresy, a dwarf-raised child reads the carving.
- Ardan has the start of this. 121 events branch their text on realm, culture, faith or race. Make it a system (knowledge lines), not 121 one-offs.
- A signature system is one other designers would want to copy. Test for that.

**Sources.** [Wikipedia: Disco Elysium](https://en.wikipedia.org/wiki/Disco_Elysium), [RPG Codex on Kurvitz's GameSpot interview](https://rpgcodex.net/article.php?id=11309), [Jump Dash Roll](https://www.jumpdashroll.com/article/disco-elysium-is-this-generations-planescape-torment), [PC Gamer: Final Cut voice acting (million-word script)](https://www.pcgamer.com/uk/amp/the-voice-acting-in-disco-elysium-the-final-cut-makes-the-best-rpg-on-pc-even-better/), [Disco Elysium wiki: Skills (mirror)](https://breezewiki.discard.no/discoelysium/wiki/Skills), [Gfinity: can you fail](https://gfinity.net/disco-elysium/can-you-fail/).

### Two shorter references

- **King of Dragon Pass (1999).** You make your clan by answering questions about its past. The answers set your start and the traditions you are expected to keep. A built-in saga writes the story down as you play. **Lesson:** the "chronicle" idea is 27 years old. Ardan's has to beat it by being systemic and contested, not just written. Sources: [A-Sharp: KoDP overview](https://a-sharp.com/kodp/overview.html), [Let's Play Archive: clan creation](https://lparchive.org/King-of-Dragon-Pass/Update%2001), [Hardcore Gaming 101](https://www.hardcoregaming101.net/king-of-dragon-pass/).
- **Wildermyth.** Its Legacy system keeps favorite heroes as folk heroes and legends across campaigns. The team judges new features by one question: "does it lead to more iconic heroes?" **Lesson:** Ardan needs the same one-line filter for features. Sources: [GameBanshee interview](https://gamebanshee.com/xykr3), [Game Maker's Notebook: procedural and intimate storytelling in Wildermyth](https://gamemakersnotebook.libsyn.com/balancing-procedural-and-intimate-storytelling-in-wildermyth).

---

## 3. Backtest

"Bot" figures come from the 11 lives described at the top (2,983 events seen). "Static" figures come from the full event set and the `LORE` tables.

### World and lore

| # | Metric | Reference game value or practice | Ardan today | Target for a 10 | How to measure in Ardan |
| --- | --- | --- | --- | --- | --- |
| W1 | Realm customs the engine enforces | CK3: 5 pillars plus traditions per culture, each with effects; some need a map condition ("Hill Dwellers") | **0 of 34** realms have `want`, `fear` or `customs` data. Crime law has 8 legal traditions covering 25 realms. **9 realms** (Frostholm, Nine Winds, Tamar, Zanara, Kesh, Abara, Hrimfell, Skyhold, Ranpur) get the generic "flogged in the market square". Only **3 realms** have a rule nobody else has: Ashmere (boys train the bow from 7; deserters lose two fingers), Blackreef (marooning), Sylvaran (no merchant houses) | ≥3 enforced rules per realm (≥100 in all); every realm has ≥1 rule of its own | Static: a rule registry where each rule names the hook that reads it. Bot: one life per realm, count the rules that fire |
| W2 | Customs a typical life runs into | CK3 traditions apply to every member of the culture | Unmeasured. Legal customs fire only on a conviction | In 90% of realms, ≥2 rules fire in a median 60-year life there (the plan's own gate) | Bot, 34 lives × 3 seeds |
| W3 | Local share of the events a life sees | Qud: every generated village has its own proverb, dish, skill and history | **4.1%** of events seen are gated to the home realm; **5.2%** to any realm. Median **12** home events per life (range 4 to 18). Elf, dwarf, orc and Frostholm homes see the fewest (4 to 6) | ≥20% of a life's events are local (realm, culture, faith or named place) | Bot |
| W4 | Local event coverage per realm | No public number | Realm-gated events run from 13 (Stonehold) to 36 (Nine Winds). Event prose names Frostholm in 5 events and Aldmark in 40 | ≥25 per realm; most-covered realm ≤2× the least | Static |
| W5 | How long the world remembers | DF keeps the whole run in Legends; a large 1,000-year world exports up to about 1 GB of XML | The news list keeps 220 lines: **only the last 5 to 8 years** at year 60. The "History" list keeps only two kinds (war ends, realm falls): **25 to 40 lines per 60 years** | A dated record of the whole run, ≥10 kinds, nothing dropped, with place and people on each entry | Static (schema) plus bot (the oldest entry survives to year 60) |
| W6 | Events that refer back to this run's history | Qud: sultan events surface in gospels, murals and statues. DF: engravings depict earlier events | **0 events** read the run's history (`S.history`). **0.27%** of events seen read any live world state. 5 events cite a historic war from `LORE.wars`; **4 of them pick one at random from all of Ardan's past**, so an old sergeant in any realm can reminisce about a war fought centuries ago on another continent | ≥15% of a life's events cite a dated entry from this run or canon, and the entry is possible in that place and time | Bot (event text matched against chronicle ids) |
| W7 | The world acts without you | Kenshi: factions fight, power vacuums spawn places and flip towns | **Strong on war.** Median 32 wars fought and 31 of 35 thrones changed in 60 years. **Narrow on everything else:** no famine, plague, founding, schism or migration is simulated as a world event (famine appears only as a ruler's event and a grain-aid offer). Peaceful change is diplomacy and settling free land | Keep the churn. Add ≥5 non-war kinds, each happening ≥1 time per realm per 20 years | Bot |
| W8 | Knowledge is gated | DF with Reveal All = NO hides most history until found. Qud's journal fills as you discover | **0 of 8** Codex sections are gated. The Bestiary shows "Believed" **and** "True" for all 64 creatures at birth. The 8 elite orders show their rumor and the truth. "Secrets you know" shows a count, not the secrets. (The plan's "the way the bestiary already works" is wrong: the bestiary hides nothing) | 100% of beast, order, secret and faith-detail entries start unknown or as belief; the truth appears only after a discovery | Browser test (the DOM at birth holds no truth text) plus bot |
| W9 | Discoveries per life | Qud: secrets are currency; each trades once; 7 kinds | Median **0 of 71** secrets touched per life (range 0 to 1) | ≥5 secrets, ≥15 truths learned and ≥3 beliefs disproved in a 60-year life | Bot |
| W10 | Conflicting accounts | Qud: gospel and tomb inscription disagree. Pentiment never names the killer | 72 static belief/truth pairs (64 beasts, 8 orders) and 71 secrets with `pub`/`truth`. The only live rumor is a ruler's cause of death, "poison, some whisper", and nothing tracks it | ≥30% of chronicle entries carry ≥2 accounts; ≥20% of rumors are false; the player can hold a false belief | Bot |
| W11 | Invented, not translated | DF: each race's own language names everything. CK3 can use real languages because it is Earth | **19 of 22** main word lists are real Earth languages (Latin, Italian, Old English, Slavic, Kazakh, Arabic ×2, Egyptian ×2, Swahili ×2, Amharic, Hindi, Sanskrit, Malay, Tibetan, Old Norse ×2, plus Swahili mixed with Amharic). 3 are invented (Orcish, Sylvari, Grover) | A blind panel names the source language for ≤50% of 6 random lists (the Road to 100 gate) | Human panel plus a static list audit |
| W12 | Culture words used in play | Pentiment: the letters on screen carry class and literacy | **17 of 468** non-English culture words appear in any event; **41 events (1.3%)**. A bot life sees a median of **1** such event | ≥30% of each culture's local events use ≥1 of its words; every culture has a naming generator | Static plus bot |
| W13 | Lore through play, not reading | Disco: 24 skill voices and passive checks add lore lines by skill. Pentiment: background opens dialogue | 121 events change their text by realm, culture, faith or race; 25 events read any lore table. Realm primers (about 6,000 words) and the Codex are reading | ≥25% of events carry a "knowledge line" shown because of who the character is | Static plus bot |
| W14 | Places named but not on the map | Kenshi: what is mentioned can be walked to | 3 capitals (Lucerna, Wolfhaven, Qadira) and 81 of 180 house seats are missing (Road to 100) | 0 | Static |
| W15 | Players describe realms by personality | The plan's own gate | **Unmeasured. 0 playtests** | 7 of 10 players name a want or custom correctly for 2 realms each, without the Codex | Human playtest |

### Uniqueness

| # | Metric | Reference game value or practice | Ardan today | Target for a 10 | How to measure in Ardan |
| --- | --- | --- | --- | --- | --- |
| U1 | Signature systems present in a run | Disco's skill voices speak through the whole game; DF's legends exist for every world | **0 of 3 built.** The Chronicle is a log. Belief vs truth is static text in the Codex. "Both scales" is rank-gated: ranks 1 to 3 get only a mission nudge | 3 of 3 in 100% of bot runs: ≥150 chronicle entries, ≥10 belief/truth reveals, and every battle the player is in shown at both scales | Bot |
| U2 | One-sentence description without naming another game | Kurvitz: "turn skills into people you can talk to" is a nameable idea | Unmeasured. The plan itself calls Ardan "BitLife, Crusader Kings and Hearts of Iron in one browser file" | 8 of 12 new players | Human playtest |
| U3 | A shareable record of a life | DF Legends export plus community viewers; KoDP's saga written as you play | The Dynasty page keeps name, dates, cause of death and the last 4 deeds per life. No export | One-click export of a readable chronicle: ≥1,500 words for a 60-year life, 0 raw tokens | Browser test |
| U4 | A feature filter | Wildermyth: "does it lead to more iconic heroes?" | None. The plan imports signature systems from 5 other games across 4 aspects (Road to 100) | 100% of `features/*/README.md` name the signature system they feed | Static |
| U5 | Share of session time in signature screens | No public number | Unmeasured | ≥50% of session time on events, Life, Chronicle or knowledge screens | Browser (Playtest mode timing) |

---

## 4. North star

What Ardan's world and its uniqueness look like with unlimited time, money and people.

**One line, held everywhere:** *Live one life inside a history that everyone writes, and the chroniclers will get you wrong.*

**The world.**

- 34 realms, each with a realm bible stored as data: one want, one fear, one place that matters, and 4 to 6 customs the engine enforces. That is about 180 rules in all, touching inheritance, punishment, trade, marriage, burial, oaths, dress and war.
- 24 cultures, each with a constructed language from a hired conlanger: a sound system, about 600 roots, and rules for building names. Every person, place and title name means something; hover shows the meaning.
- A blind panel traces at most 1 word list in 3 to a real language.
- Every place the text names is on the map.

**History.**

- An authored spine (today's 1,104 years of canon: 220 chronicle entries, 43 wars, 46 ruler lines, 180 house histories) plus generated detail.
- Each new world simulates the 150 years before 1105 around the fixed canon anchors, filling gaps the Qud way (generate, then rationalize). That gives about 3,000 dated entries before birth.
- During play the chronicle records 60 to 120 entries per world-year across 14 kinds: war, battle, siege, ruler's death, succession, marriage, famine, plague, founding, fall, heresy and schism, migration, great deed, disaster. Nothing is dropped.
- When your home changes hands, the next month's laws, prices, names and events change, as Kenshi's towns do.

**Knowledge, the second signature.**

- Every fact (a person, place, beast, secret or event) has a state per character: unknown, heard (with source, date and teller), believed, confirmed, disproved.
- The Codex becomes your character's own commonplace book, in a hand set by class and literacy, as Pentiment does. An illiterate character keeps a "remembered tales" book instead.
- About 40% of what a character hears in a life is partly wrong.
- Secrets trade like Qud's: each one is worth something to someone. Revealing one triggers its written `ifr` consequence.

**The Chronicle screen, the first signature.** An illuminated book.

- The left page is the world's chronicle, in the voice of your realm's chronicler. There are 6 voices: Solen annalist, Northfolk skald, Qadiri court historian, Tamari temple scribe, dwarven tally of the Law-Carvers, orc winter-count.
- The right page is your life as that chronicler records it, beside the true log. The two differ.
- You can commission, bribe, or burn a chronicler (CK3's Legends turned against itself).
- Heirs inherit the chronicle, not the truth. Three generations later, your grandson reads a version of you that never happened.

**Places that remember.** Every battlefield, tomb, sword, coin, shrine and mural links to the chronicle entry it shows, like DF's engravings and Qud's statues. Finding one is a discovery.

**Both scales, the third signature.** Every battle the player is in shows three panels side by side: what you saw, the front map, and what the chronicle will say. They are allowed to disagree.

**Shareable.** A Legends export per world and per dynasty (HTML and EPUB), a legends viewer, and share codes for worlds.

**Numbers for a typical 60-year life.**

- ≥30% of events are local.
- ≥25% of events cite a dated entry from this run.
- ≥20 discoveries, ≥5 secrets, and ≥3 times the player learns that something they believed was false.
- The chronicle export runs over 3,000 words.

**People.**

- 2 writers for 2 years: customs, local events and chronicler voices.
- 1 conlanger for 1 year.
- 1 illustrator for 18 months: the book, marginalia and objects.
- 2 engineers.
- A 12-player test every month.

---

## 5. What to build now

Ranked by score gain for the effort. Sizes: S ≤2 days, M ≤2 weeks, L ≤2 months, XL longer. "Code" means a `features/NN-name/` with `*.core.js` plus small patches; "content" means `*.events.js` or data. Score gains are estimates. Per the Road to 100 rule, no score rises until its human gate (item 15) passes.

| Rank | Feature | Aspect, gain | Effort | Where | Acceptance test (must be able to fail) |
| --- | --- | --- | --- | --- | --- |
| 1 | **Living chronicle** (the data layer) | Uniqueness +1.0 | M | Code | In a 60-year bot life: ≥150 entries of ≥8 kinds, each with year, place id and people ids; the 1105 entries still present at the end; the `renderRng`, replay and save/load tests still pass |
| 2 | **Knowledge-gated Codex** | Uniqueness +0.7 | M | Code | Browser: at birth the DOM holds no "True:" text for any creature or order. Bot: a median life learns ≥10 truths and ≥25 beliefs, and a hunter in the hills learns more hill beasts than a scribe in a city |
| 3 | **Events that cite the chronicle** | World +0.7 | M | Both | Bot: ≥10% of events seen cite a chronicle entry from *this run* (today 0.27%); 0 cite a war that hadn't happened by that year or that was far from the place; lint passes |
| 4 | **Rumors and accounts** | Uniqueness +0.6 | M | Both | Bot: ≥30% of chronicle entries hold ≥2 accounts; ≥20% of rumors are false; the record of the player's own deeds differs from the true log at least once per decade |
| 5 | **Customs with teeth** | World +1.0 | L | Both | Static: every realm has ≥3 rules and each names a hook that runs. Bot: one life per realm × 3 seeds; ≥90% of realms see ≥2 rules fire |
| 6 | **Secrets in play** | World +0.5 | L | Both | Bot: median 60-year life touches ≥3 secrets (today 0); revealing `SEC-04` shifts dwarf–human realm relations by a measurable amount; each secret trades once |
| 7 | **Non-war world events** | World +0.4 | M | Code | Bot: in 60 years, each of the 5 new kinds happens ≥5 times across Ardan, and each realm sees ≥2 non-war entries; the hoarding and stability tests still pass |
| 8 | **Chronicle export** | Uniqueness +0.3 | S–M | Code | Browser: download for a 60-year life is ≥1,500 words, holds ≥10 life and ≥5 world entries, 0 raw `{tokens}`, and loads offline under the CSP |
| 9 | **Consistency fixes** | World +0.2 | S | Code | Static: 0 events pick from all of `LORE.wars` without a place or time filter. Bot: a punishment in Frostholm never prints the generic flogging line |
| 10 | **Rule of invention, phase 1** | World +0.8 | L | Content (human gate) | Static: ≥30% of each culture's local events use ≥1 of its words. Human: a blind panel names the source language for ≤50% of the 8 rewritten lists |
| 11 | **Local event floor** | World +0.3 | M | Content | Static: every realm has ≥25 realm-gated events and the most-covered realm ≤2× the least; `lint-events` passes |
| 12 | **Both-scales battle report** | Uniqueness +0.4 | L | Code | Bot: every battle a rank 1–6 player fights produces all three panels; the chronicle's account differs from the personal log in ≥25% of battles |
| 13 | **Cut borrowed screens below rank 7** | Uniqueness +0.2 | S | Code | Browser: a rank-3 soldier and a commoner merchant see no division-template or industry screen; a ruler still does; all tests pass |
| 14 | **Map completeness** | World +0.2 | M | Code | Static: every capital and house seat named in `LORE` resolves to a map province or settlement; 0 misses (today 84) |
| 15 | **Run the human gates** | Both +0.5 (unlocks the score) | S each | Needs people | Recorded results on file: 7 of 10 name a realm want or custom; 8 of 12 describe Ardan in one sentence without naming another game; blind panel ≤50% |

**What each one is, in one paragraph.**

1. **Living chronicle.** Add `A.chron.add({y, d, kind, place, who, text})`. Call it from `startWar`, the end of a war, `rulerDies`, successions, a realm's fall and birth, `transferProv`, settling free land, and the player's deeds. Keep every entry (compact arrays; old saves start empty). Replace the Chronicle tab's "History" with it. This is signature 1, and every later item reads it.
2. **Knowledge-gated Codex.** Add `pc.know[id] = {s: "heard" | "believed" | "true", from, y}`. Seed it from home terrain (`A.beastsNear`), culture, faith and job. Learning comes from events, from years lived near something, and from reading. The Codex shows "Believed" until "True" is earned, and lists the secrets you actually touched. This is signature 2, and it makes the plan's claim about the bestiary true.
3. **Events that cite the chronicle.** Add a helper `C.chron(p, kind, years, near)` and tokens `{chron}` and `{chronYear}`. Write 60 events that say "since the burning of X", and fix the 5 `LORE.wars` events to pick a war that fits the place and the time.
4. **Rumors and accounts.** Each chronicle entry gets an official account and 0 to 2 rumors, chosen by the chronicler's realm and by fame. Start with ruler deaths ("poison, some whisper" becomes a tracked rumor, true or false), battles and the player's own deeds.
5. **Customs with teeth.** Add `want`, `fear`, `customs` and `place` to all 34 realms as data, plus `A.CUSTOMS`, a registry of rules each tied to an existing hook: `pickHeir` and `lawSort`, `punishNow`, the shop limits, marriage and burial events. Start with the 9 realms that have no legal tradition.
6. **Secrets in play.** Learn a secret through an event or from a cast member listed in its `who`. Trade it once, use it as leverage, or reveal it. Revealing applies its `ifr` text as effects on realm relations, stability and opinion.
7. **Non-war world events.** Famine (low stability or a bad harvest), plague (spreading along borders), founding, heresy or schism, migration. Each writes a chronicle entry and opens an event for players who live there.
8. **Chronicle export.** An HTML book of the life and the world, in the chronicler's voice, offered from the Dynasty page and the death screen.
9. **Consistency fixes.** Give the 9 realms without a legal tradition their own law (giants, the khanate, the abbey and the rest). Filter historic-war picks by realm and by lifetime.
10. **Rule of invention, phase 1.** Rewrite the 8 most direct translations as invented word lists with sound rules. Add a naming generator per culture. Put culture words into local events. Quality needs a blind panel, and later a conlanger.
11. **Local event floor.** About 85 new events for Stonehold, Irondeep, Hrimfell, Emberdeep, Frostholm, Eldergrove and Sylvaran, each using that realm's customs and places.
12. **Both-scales battle report.** For ranks 1 to 6, each battle shows three panels: what you saw, what the front did, and what the chronicle says. This is signature 3, and it overlaps War step 1 in the plan.
13. **Cut borrowed screens.** The plan's own Uniqueness step 5.
14. **Map completeness.** Add the missing capitals and seats as settlements, or remove the references.
15. **Human gates.** Use Playtest mode. Without these, no score above moves.

---

## 6. Sources

**Dwarf Fortress**
- https://dwarffortresswiki.org/index.php/DF2014:Legend
- https://dwarffortresswiki.org/index.php/v0.34:Legends
- https://dwarffortresswiki.org/index.php/DF2014:Historical_figure
- https://dwarffortresswiki.org/index.php/v0.34:Engraving
- https://dwarffortresswiki.org/index.php/XML_dump
- https://dwarffortresswiki.org/dwarven_language
- https://dwarffortresswiki.org/index.php/DF2014:Adventure_mode
- https://arxiv.org/pdf/2304.08293 (Smith Nicholls and Cook, "That Darned Sandstorm", 2023)
- https://www.routledge.com/Procedural-Storytelling-in-Game-Design-1st-Edition/Short-Adams/p/book/9781138595309 (Adams, "Emergent Narrative in Dwarf Fortress", ch. 13; listed for further reading, not quoted)

**Crusader Kings III**
- https://admin-forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-64-cultures-are-forever.1479565
- https://admin-forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-65-one-culture-is-not-enough.1480529
- https://gamerant.com/crusader-kings-3-how-change-culture/
- https://www.pcgamer.com/crusader-kings-3-ck3-hybrid-culture/
- https://primagames.com/gaming/crusader-kings-3-royal-court-ethos-cultural-traditions-guide
- https://ckstrategyhub.com/database/traditions/ (third party)
- https://steamcommunity.com/games/1158310/announcements/detail/4035857237863291336
- https://www.ggrecon.com/guides/crusader-kings-3-legends-of-the-dead-release/

**Kenshi**
- https://en.wikipedia.org/wiki/Kenshi_(video_game)
- https://kenshi.fandom.com/wiki/Faction
- https://www.theregister.com/2019/05/31/kenshi_sandblasted_swordpunk_where_the_dungeon_master_wants_everyone_dead/
- https://www.siliconera.com/kenshis-eight-year-development-journey-from-one-man-rpg-to-a-teams-success/
- https://www.pcgamer.com/games/survival-crafting/too-many-games-let-their-players-succeed-says-developer-of-notoriously-tough-survival-rpg-kenshi-and-thats-mind-numbingly-boring-to-me/
- https://raiderking.com/kenshi-town-overrides/ (guide)
- https://media.gdcvault.com/GDC+2022/Game+Narrative+Poster+Review/Knezek+Paper.pdf

**Pentiment**
- https://www.thegamer.com/pentiment-canon-murderer-unrevealed/
- https://en.wikipedia.org/wiki/Pentiment_(video_game)
- https://www.pressreader.com/usa/pc-gamer-us/20221129/281878712366441
- https://lettermatic.com/custom/pentiment
- https://gamebanshee.com/9kaxf
- https://progameguides.com/pentiment/all-background-choices-in-pentiment-and-what-they-do/
- https://primagames.com/tips/the-artists-guide-on-who-to-eat-with-in-pentiment
- https://twinfinite.net/2022/11/pentiment-review-a-medieval-murder-mystery-to-die-for/

**Caves of Qud**
- https://wiki.cavesofqud.com/wiki/Sultan_history
- https://wiki.cavesofqud.com/wiki/Secret
- https://www.pcgworkshop.com/archive/grinblat2017subverting.pdf
- https://gdcvault.com/play/1024990/Procedurally-Generating-History-in-Caves
- https://gdcvault.com/play/1025914
- https://thegeekiary.com/?p=54078
- https://articles.retroware.com/2020/11/18/procedurally-generated-history/

**Disco Elysium**
- https://en.wikipedia.org/wiki/Disco_Elysium
- https://rpgcodex.net/article.php?id=11309
- https://www.jumpdashroll.com/article/disco-elysium-is-this-generations-planescape-torment
- https://www.pcgamer.com/uk/amp/the-voice-acting-in-disco-elysium-the-final-cut-makes-the-best-rpg-on-pc-even-better/
- https://breezewiki.discard.no/discoelysium/wiki/Skills (mirror of the Disco Elysium fandom wiki)
- https://gfinity.net/disco-elysium/can-you-fail/

**King of Dragon Pass and Wildermyth**
- https://a-sharp.com/kodp/overview.html
- https://lparchive.org/King-of-Dragon-Pass/Update%2001
- https://www.hardcoregaming101.net/king-of-dragon-pass/
- https://gamebanshee.com/xykr3
- https://gamemakersnotebook.libsyn.com/balancing-procedural-and-intimate-storytelling-in-wildermyth

**Ardan (this repo)**
- `docs/plan/Ardan The Road to Ten.md`, `docs/reviews/Ardan Road to 100.md`, `docs/reviews/Ardan Deep Analysis.md`
- Engine reads: `A.LAW`, `A.lawOf`, `punishNow`, `A.news` (220-line cap), `A.worldYear`, `A.branchYear`, `UI.codexBasic`, `UI.worldTabBasic` (via `node tools/build.mjs --unpack` and `node tools/show.mjs`)
