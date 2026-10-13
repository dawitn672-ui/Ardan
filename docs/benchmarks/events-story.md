# Events and story: benchmark

Oct 13, 2026 · build `b593143` plus the 29 fix patches (`features/00-05`), measured in headless Chromium. Strict score going in (from "Ardan Road to 100"): **Events and story 5.**

Every number about Ardan below was measured for this doc unless it names a review. Every claim about another game carries a link. Fan wikis and forums are marked *(community)*. Anything I could not source is marked *unverified* or left out.

**A note on sources.** This session could not open web pages directly: page fetches failed and the network policy blocked them. Every outside claim comes from search-engine results that quote or summarise the linked page. I kept only claims where a result tied the claim to that page. Treat the outside numbers as good leads to check against the page, not as quotes.

**What this found, in five lines.**

- **Ardan writes memories and never reads them.** Events set 458 different flags. 369 are never read by any event and 362 are read by nothing at all, code included. "Swear a life-debt", "Promise to look after his family" and "Keep it, and remember" all set flags that nothing ever reads.
- **The past almost never comes back in play.** TBD_LIFE_LINE
- **There is no director.** Each month the game rolls a fixed chance by life stage (adult 32%), then draws from every eligible event, weighted only by social class. It has no memory boost, no arc priority, no pacing and no variety rule beyond a cooldown. CK3, King of Dragon Pass, Wildermyth and RimWorld all have one.
- **Real arcs exist in one pack only.** All 23 "play this next" links sit in the adventure pack (`av_`): one heist arc 9 events deep and two short sea and road chains. 43 events (1.3%) sit at the start of any chain 3 or more deep.
- **The life has no saga.** The death screen shows a title, the cause of death, five counts, the last 5 deeds and a score. King of Dragon Pass writes the clan's saga year by year.

## 1. The bar

A 10 in this genre means **your past keeps coming back, at the right moment, through people you know.** King of Dragon Pass and Six Ages build a whole run from a few hundred reusable scenes, cast with your own clan's leaders and neighbours, and write it down as a saga. Crusader Kings III wraps long stories in containers that hold state, tick over years and hand themselves on when someone dies. Its characters keep memories that fade, and events read them back. Failbetter's games gate every storylet on qualities, so what you did decides what you can see next, and big failures send you to a place, not just a number. RimWorld and Wildermyth add the last piece: a director that paces trouble, and events that cast the characters most fit for the role. A player of a 10 can retell a three-step story from one run without being asked, and can't name a game that remembers them better.

## 2. How the best do it

### King of Dragon Pass and Six Ages (scenes with casting, the saga)

**Mechanism.** The narrative is a pool of "scenes", which the developers now call storylets. Scenes are "often picked at random, though with conditions to make sure they're relevant or interesting". The designers chose this to avoid the explosion of branches: choices do not branch, a political and economic simulation gives them context ([Six Ages blog](https://blog.sixages.com/)). Scenes are "full of assignable roles", most often clans (a neighbour, a rival, an ally), and the game prefers to cast leaders who sit on your clan ring ([KoDP blog, 2021](http://kingofdragonpass.blogspot.com/2021/08/kodp-on-web-50-years-of-text-games.html); [50 Years of Text Games](https://if50.substack.com/p/1999-king-of-dragon-pass) calls it "storylets with casting"). Six Ages added dynamic scene tags, so a scene can gain a tag such as "@dwarves" during play instead of special cases listed by hand ([Six Ages blog, May 2016](https://blog.sixages.com/index.php/2016/05/)). Advisors give context-sensitive advice, some conditions take priority, and two advisors do not repeat the same warning ([Six Ages blog, design](https://blog.sixages.com/index.php/category/design/)).

**The saga.** The game writes the clan's history itself, year by year: prophecies, raids, events, heroquests. You can read it in the game or as a text file ([A Sharp, overview](https://www.a-sharp.com/kodp/overview.html); [AppleVis players' sagas](https://www.applevis.com/forum/ios-ipados-gaming/share-your-king-dragon-pass-sagas-here), *community*).

**Numbers.** King of Dragon Pass has about 468,000 words and more than 400 scenes (2011 iOS release; [Dunham's blog via Goodreads](https://www.goodreads.com/author_blog_posts/1533552-king-of-dragon-pass-now-on-ios), [Loop Insight](https://loopinsight.com/2011/09/15/king-of-dragon-pass-makes-ios-debut)); a later listing says nearly 600 scenes. Wikipedia reports that Dunham expected players to see about a quarter of the text in one playthrough ([Wikipedia](https://en.wikipedia.org/wiki/King_of_Dragon_Pass)). Six Ages: Ride Like the Wind advertises over 400 scenes ([Steam](https://store.steampowered.com/app/881420/Six_Ages_Ride_Like_the_Wind/)). Failbetter's own comparison: both King of Dragon Pass and Fallen London make "small stories" the unit, designed for reuse, and a larger story emerges from dozens of them ([Failbetter, The Problem with Branching](https://www.failbettergames.com/news/the-problem-with-branching)). Dunham's GDC 2019 talk covers the overall story arc on top of random scenes ([GDC Vault](https://www.gdcvault.com/play/1025740/Designing-Six-Ages-a-Storytelling)).

**Lesson for Ardan.** Ardan has the pool (3,199 events, more than King of Dragon Pass has scenes) but not the casting or the record. 23% of Ardan's events name a specific person; the rest happen to "you" with strangers. And nothing writes the life down in a voice. Casting from your own circle and a written saga are the two cheapest things to copy.

### Crusader Kings III (story cycles, memories, warnings)

**Story cycles.** A Paradox programmer describes them as "a sort of event container that can hold variables and run updates intermittently". Owning a cat is one: setup stores the cat's age, eye colour, sex and fur and adds modifiers; a cleanup effect removes them; and if the owner dies, the cycle tries to pass the pet to a family member or friend ([CK3 Dev Diary #37 thread](https://forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-37-making-mods.1410656/)). Modders show the dog cycle running timed `effect_group` blocks with a random day range and a chance ([Steam discussion](https://steamcommunity.com/app/1158310/discussions/0/3821912677675548093), *community*). Bigger arcs use the same idea at realm scale: the Iberian Struggle runs in phases, each with its own options and endings ([Dev Diary #93](https://www.paradoxinteractive.com/games/crusader-kings-iii/news/ck3-dev-diary-93-turmoil-in-the-peninsula); [Dev Diary #99](https://admin-forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-99-it-is-time-to-decide-the-fate-of-iberia.1528613)).

**Memories.** Since the free 1.7 update, characters remember births, battles, deaths of close ones and successions. Some memories fade over time and others stay. Private ones (a lover, a murder) are hidden from other players. Memories feed events: an assassin may cite a grievance your killer held against you ([Dev Diary #105](https://forum.paradoxplaza.com/forum/developer-diary/development-diary-105-1-7-bastion-update.1540182/)).

**Warnings before harm.** Update 1.9.1 added "foreboding events, which make characters eligible to receive awful harm or death down the line", then harm and death events that fire only after a suitable foreboding event ([1.9.1 patch notes, SteamDB copy](https://steamdb.info/patchnotes/11318013)).

**Pacing.** Events don't fire on their own. They come from on_actions, decisions, interactions and story cycles ([CK3 wiki, Event modding](https://ck3.paradoxwikis.com/Event_modding)). The yearly pulse draws from a weighted list that includes an explicit "nothing happens" weight ([Paradox modding forum](https://forum.paradoxplaza.com/forum/threads/modding-quick-questions-and-answers.1414681/page-62), *community*). Hold Court shows 3 petitioners each time, drawn from just under 100 court events ([Dev Diary #72](https://admin-forum.paradoxplaza.com/forum/developer-diary/crusader-kings-3-dev-diary-72-holding-court-at-court-in-the-royal-court-in-a-courtly-fashion.1489882); [PCGamesN](https://www.pcgamesn.com/crusader-kings-3/court-events)). Lifestyle events are "opportunities (or crises!)" that come from what your ruler focuses on ([Dev Diary #10](https://forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-10-lifestyle-events.1312112/)).

**Lesson for Ardan.** Ardan's flags are CK3's memories with the reading half missing. Its 23 follow-up links are story cycles without state, timers or an owner-death rule. Ardan has `A.schedule` and `A.onMonth`, which is enough to build a story-cycle object in a `*.core.js` without touching the engine. The foreboding pattern fits Ardan's 400 event outcomes that kill or maim (Road to 100): warn first, then strike.

### Fallen London and Sunless Sea (storylets and qualities)

**Mechanism.** A storylet is a self-contained chunk of story that can be played in any order; qualities decide when it unlocks. Longer "questicles" give a beginning, a middle and an end ([Failbetter, Echo Bazaar Narrative Structures part two](https://www.failbettergames.com/news/echo-bazaar-narrative-structures-part-two); [part three](https://www.failbettergames.com/news/echo-bazaar-narrative-structures-part-three)). Emily Short's term for this is quality-based narrative: the player chooses among all storylets that are currently legal. Its cousin, salience-based narrative, lets the system pick the most applicable piece itself ([Emily Short, Beyond Branching](https://emshort.blog/2016/04/12/beyond-branching-quality-based-and-salience-based-narrative-structures/)).

**How it paces.** Actions refill at 1 every 10 minutes up to 20 (40 for subscribers). The opportunity deck holds at most 6 cards (10 for subscribers), adds one every 10 minutes, and a card held in your hand can't be drawn again ([Fallen London wiki, Cards](https://fallenlondon.wiki/wiki/Cards); [Beginner's Guide](https://fallenlondon.wiki/wiki/Beginner's_Guide), *community*).

**Consequence is a place.** The four menaces (Wounds, Scandal, Suspicion, Nightmares) send you somewhere at level 8: a boat on a dark river, exile in the Tomb-Colonies, New Newgate Prison, the Mirror-Marches. Each has its own storylets and its own deck, and you leave when the menace falls to 0 ([Menaces guide](https://fallenlondon.wiki/wiki/Menaces_(Guide)); [Menace Locations](https://fallenlondon.wiki/wiki/Menace_Locations_(Guide)), *community*).

**Long arcs.** Four Ambitions run across the whole game, focus on two of the four main stats each, and are locked once chosen ([Ambitions guide](https://fallenlondon.wiki/wiki/Ambitions_(Guide)), *community*).

**Numbers.** Fallen London launched with about 10,000 words ([50 Years of Text Games](https://if50.substack.com/p/2009-fallen-london)) and now has over 4.5 million ([Failbetter, 15th birthday](https://www.failbettergames.com/news/fallen-londons-15th-birthday)). Sunless Sea took 15 months, a £250k budget, 250,000 words and 415 illustrations ([Game Developer postmortem](https://www.gamedeveloper.com/audio/postmortem-failbetter-games-i-sunless-sea-i-)). Failbetter's text boxes show a counter that turns red past 100 words ([Inverse interview with Chris Gardiner](https://www.inverse.com/article/28228-failbetter-games-interview-sunless-skies)).

**Lesson for Ardan.** Ardan already gates events on `C.*` helpers, so it is half a quality-based system. The missing half is that qualities written by one event must open others. A 2018 survey splits storylet systems by how preconditions work, how content is selected, whether storylets repeat and what they contain ([Emily Short on Kreminski and Wardrip-Fruin](https://emshort.blog/2019/01/06/kreminski-on-storylets/)). Ardan's selection is the weak axis. The menace idea also fits: being wanted by the watch should become a stretch of life with its own events, not a stat.

### 80 Days (a big pool, a small slice)

**Mechanism.** 80 Days is a map of city-to-city choices, each "loaded with ready-made context" ([Game Developer, Road to the IGF](https://www.gamedeveloper.com/design/road-to-the-igf-inkle-s-i-80-days-i-)). Jon Ingold's GDC 2015 talk covers making choices matter, pacing and coercing the narrative, and a scripting language built to write a lot of highly contextual text fast ([Game Developer](https://www.gamedeveloper.com/design/video-innovating-interactive-fiction-with-i-80-days-i-jon-ingold)). The team designed it to be replayed ([MCV/Develop](https://mcvuk.com/business-news/write-to-replay-jon-ingold-on-the-issue-of-replayability-in-narrative-games/)).

**Numbers.** About 750,000 words. One full trip around the world shows roughly 2% of them, by the developers' estimate ([Wikipedia](https://en.wikipedia.org/wiki/80_Days_(2014_video_game))). About 200,000 words came after launch ([Game Developer postmortem](https://www.gamedeveloper.com/business/postmortem-inkle-s-i-80-days-i-)).

**Lesson for Ardan.** A tiny slice per run works when every slice is dense with context: the text knows where you are, who you travel with and what you did. Ardan shows TBD_COVERAGE of its text per life, so coverage is not the problem. Context is.

### RimWorld (the storyteller as a pacing controller)

**Mechanism.** Ludeon calls RimWorld "not a game, but a story generator" ([GDC 2017 talk](https://www.gdcvault.com/play/1024232/-RimWorld-Contrarian-Ridiculous-and); [slides](https://media.gdcvault.com/gdc2017/Presentations/Sylvester_Tynan_RimWorld_Contrarian_Ridiculous.pdf)). Sylvester leans on apophenia: the simulation supplies events and the player supplies the meaning ([Stanford GDT](https://gdt.stanford.edu/how-do-you-create-apophenia/); [The Simulation Dream](https://tynansylvester.com/2013/06/the-simulation-dream/)).

**Numbers** *(community)*:

- Cassandra alternates 4.6-day "on" phases with 6-day "off" phases, sends 1 or 2 major threats per "on" phase at 50/50, and keeps at least 1.9 days between them ([RimWorld wiki, Cassandra Classic](https://rimworldwiki.com/wiki/Cassandra_Classic)).
- Randy has no minimum gap, but forces a major threat after 13 quiet days; on average one comes every 7.14 days ([Randy Random](https://rimworldwiki.com/wiki/Randy_Random)).
- Threat size grows with colony wealth, and an adaptation factor eases off after colonists die or go down: 0.7 within 10 days, back to 1 by 40 days ([Raid points](https://rimworldwiki.com/wiki/Raid_points)).

**Lesson for Ardan.** Pacing is a controller with state, not a dice roll. Ardan's is a fixed monthly chance per life stage. It does not know that you just lost a child, that nothing has happened for two years, or that the last three events were all tavern scenes.

### Wildermyth (casting by personality, years between chapters)

**Mechanism.** The game picks an event that matches the encounter type and whose targeting criteria the party meets: personality stats, hooks, relationships ([Wildermyth wiki, Event](https://wildermyth.com/wiki/Event), *community*). Players report that the highest-stat hero usually gets the speaking role ([Steam discussion](https://steamcommunity.com/app/763890/discussions/0/4241812037674029611/), *community*). Hook quests open once a relationship reaches 3+ for the first and second, and 4+ for the third ([Event Types](https://wildermyth.com/wiki/Event_Types), *community*).

**Time and marks.** Between chapters, 10 to 12 years of peace pass in generic campaigns, and heroes age ([Campaign](https://wildermyth.com/wiki/Campaign), *community*). Transformations and lost limbs persist, carry into the legacy, and block repeats: a hero with the wolf theme stops the wolf event for the rest of that campaign ([Legacy](https://wildermyth.com/wiki/Legacy), *community*).

**Pitfalls the designers named.** The GDC 2022 talk lists "breach of trust, acting out of character, or rage quits" as the failures to avoid ([GDC Vault](https://www.gdcvault.com/play/1027614/Independent-Games-Summit-Session-Getting)). The slides say good history lines are specific ([slides](https://media.gdcvault.com/GDC+2022/Speaker+Slides/GettingPlayersEmotionally_Austin_Nate.pdf)).

**Lesson for Ardan.** Cast the person who fits, from the player's own circle, and let a mark (a wound, a vow, a theme) both change later events and stop its own kind from repeating.

### Shorter references

- **Valve's dynamic dialogue (Left 4 Dead).** Hundreds of facts are matched against thousands of lines; the most specific matching rule wins, with general rules as fallbacks, so characters "remember history" ([GDC Vault](https://www.gdcvault.com/play/1015528/AI-driven-Dynamic-Dialog-through); [Emily Short](https://emshort.blog/2012/03/16/gdc-2012-talk-on-dynamic-dialogue/)). Lesson: when two events fit, prefer the one whose conditions name more of the player's past.
- **Hades.** Over 300,000 words, 200,000 of them dialogue, and 21,000 voice lines, written so a game played over and over stays reactive ([Cultured Vultures](https://culturedvultures.com/supergiant-hades-word-count-dialogue/)). Kasavin describes bosses who remember previous encounters ([GDC Podcast ep. 16](https://gdconf.com/article/roguelikes-and-narrative-design-with-hades-creative-director-greg-kasavin-gdc-podcast-ep-16/)). Lesson: reactive lines that name what just happened beat new standalone events.
- **Story sifting.** James Ryan's dissertation argues that a simulation's raw output is rarely a story, and that a human or a second system has to pick the good ones out ([Emily Short on Ryan](https://emshort.blog/2019/05/21/curating-simulated-storyworlds-james-ryan/)). Winnow is a query language for that: a pattern such as "a guest arrives, the host shows hospitality, the host harms the guest" finds micro-stories in a running simulation, even half-finished ones ([Winnow](https://github.com/mkremins/winnow)). Lesson: Ardan's Chronicle can sift the life log for patterns instead of printing every line.

TBD_REST
