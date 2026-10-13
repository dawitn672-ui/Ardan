# Events and story: benchmark

Oct 13, 2026 · build `b593143` plus the 29 fix patches (`features/00-05`), measured in headless Chromium. Strict score going in (from "Ardan Road to 100"): **Events and story 5.**

Every number about Ardan below was measured for this doc unless it names a review. Every claim about another game carries a link. Fan wikis and forums are marked *(community)*. Anything I could not source is marked *unverified* or left out.

**A note on sources.** This session could not open web pages directly: page fetches failed and the network policy blocked them. Every outside claim comes from search-engine results that quote or summarise the linked page. I kept only claims where a result tied the claim to that page. Treat the outside numbers as good leads to check against the page, not as quotes.

**What this found, in five lines.**

- **Ardan writes memories and never reads them.** Events set 458 different flags. 369 are never read by any event and 362 are read by nothing at all, code included. "Swear a life-debt", "Promise to look after his family" and "Keep it, and remember" all set flags that nothing ever reads.
- **The past almost never comes back in play.** In 48 bot lives (11,410 events), 0.4% of events called back to something that life had done. 27 lives had no callback at all, and no life saw a chain of 3 events. Meanwhile 36 of every 100 events repeated one the player had already seen; the top one, "An old scholar", came up 402 times.
- **There is no director.** Each month the game rolls a fixed chance by life stage (adult 32%), then draws from every eligible event, weighted only by social class and role. It has no memory boost, no arc priority, no pacing and no variety rule beyond a cooldown. CK3, King of Dragon Pass, Wildermyth and RimWorld all have one. Weighting memory events 5 times in the draw triples callbacks to 1.2%: the lever works, but the content it needs isn't there.
- **Real arcs exist in one pack only.** All 23 "play this next" links sit in the adventure pack (`av_`): one heist arc 9 events deep and two short sea and road chains. Only 43 events (1.3%) lead into a chain 3 or more deep.
- **The life has no saga.** The death screen shows a title, the cause of death, five counts, the last 5 deeds and a score. King of Dragon Pass writes the clan's saga year by year.

## 1. The bar

A 10 in this genre means **your past keeps coming back, at the right moment, through people you know.** King of Dragon Pass and Six Ages build a whole run from a few hundred reusable scenes, cast with your own clan's leaders and neighbours, and write it down as a saga. Crusader Kings III wraps long stories in containers that hold state, tick over years and hand themselves on when someone dies. Its characters keep memories that fade, and events read them back. Failbetter's games gate every storylet on qualities, so what you did decides what you can see next, and big failures send you to a place, not just a number. RimWorld and Wildermyth add the last piece: a director that paces trouble, and events that cast the characters most fit for the role. A player of a 10 can retell a three-step story from one run without being asked, and can't name a game that remembers them better.

## 2. How the best do it

### King of Dragon Pass and Six Ages (scenes with casting, the saga)

**Mechanism.** The narrative is a pool of "scenes", which the developers now call storylets. Scenes are "often picked at random, though with conditions to make sure they're relevant or interesting". The designers chose this to avoid the explosion of branches: choices do not branch, a political and economic simulation gives them context ([Six Ages blog](https://blog.sixages.com/)). Scenes are "full of assignable roles", most often clans (a neighbour, a rival, an ally), and the game prefers to cast leaders who sit on your clan ring ([KoDP blog, 2021](http://kingofdragonpass.blogspot.com/2021/08/kodp-on-web-50-years-of-text-games.html); [50 Years of Text Games](https://if50.substack.com/p/1999-king-of-dragon-pass) calls it "storylets with casting"). Six Ages added dynamic scene tags, so a scene can gain a tag such as "@dwarves" during play instead of special cases listed by hand ([Six Ages blog, May 2016](https://blog.sixages.com/index.php/2016/05/)). Advisors give context-sensitive advice, some conditions take priority, and two advisors do not repeat the same warning ([Six Ages blog, design](https://blog.sixages.com/index.php/category/design/)).

**The saga.** The game writes the clan's history itself, year by year: prophecies, raids, events, heroquests. You can read it in the game or as a text file ([A Sharp, overview](https://www.a-sharp.com/kodp/overview.html); [AppleVis players' sagas](https://www.applevis.com/forum/ios-ipados-gaming/share-your-king-dragon-pass-sagas-here), *community*).

**Numbers.** King of Dragon Pass has about 468,000 words and more than 400 scenes (2011 iOS release; [Dunham's blog via Goodreads](https://www.goodreads.com/author_blog_posts/1533552-king-of-dragon-pass-now-on-ios), [Loop Insight](https://loopinsight.com/2011/09/15/king-of-dragon-pass-makes-ios-debut)); a later listing says nearly 600 scenes. Wikipedia reports that Dunham expected players to see about a quarter of the text in one playthrough ([Wikipedia](https://en.wikipedia.org/wiki/King_of_Dragon_Pass)). Six Ages: Ride Like the Wind advertises over 400 scenes ([Steam](https://store.steampowered.com/app/881420/Six_Ages_Ride_Like_the_Wind/)). Failbetter's own comparison: both King of Dragon Pass and Fallen London make "small stories" the unit, designed for reuse, and a larger story emerges from dozens of them ([Failbetter, The Problem with Branching](https://www.failbettergames.com/news/the-problem-with-branching)). Dunham's GDC 2019 talk covers the overall story arc on top of random scenes ([GDC Vault](https://www.gdcvault.com/play/1025740/Designing-Six-Ages-a-Storytelling)).

**Lesson for Ardan.** Ardan has the pool (3,199 events, more than King of Dragon Pass has scenes) but not the casting or the record. 23% of Ardan's events are written to cast a specific person, and only 19% of the events a life sees involve someone the player already knew. And nothing writes the life down in a voice. Casting from your own circle and a written saga are the two cheapest things to copy.

### Crusader Kings III (story cycles, memories, warnings)

**Story cycles.** A Paradox programmer describes them as "a sort of event container that can hold variables and run updates intermittently". Owning a cat is one: setup stores the cat's age, eye colour, sex and fur and adds modifiers; a cleanup effect removes them; and if the owner dies, the cycle tries to pass the pet to a family member or friend ([CK3 Dev Diary #37 thread](https://forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-37-making-mods.1410656/)). Modders show the dog cycle running timed `effect_group` blocks with a random day range and a chance ([Steam discussion](https://steamcommunity.com/app/1158310/discussions/0/3821912677675548093), *community*). Bigger arcs use the same idea at realm scale: the Iberian Struggle runs in phases, each with its own options and endings ([Dev Diary #93](https://www.paradoxinteractive.com/games/crusader-kings-iii/news/ck3-dev-diary-93-turmoil-in-the-peninsula); [Dev Diary #99](https://admin-forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-99-it-is-time-to-decide-the-fate-of-iberia.1528613)).

**Memories.** Since the free 1.7 update, characters remember births, battles, deaths of close ones and successions. Some memories fade over time and others stay. Private ones (a lover, a murder) show only on your own character. Memories feed events: an assassin may cite a grievance your killer held against you ([Dev Diary #105](https://forum.paradoxplaza.com/forum/developer-diary/development-diary-105-1-7-bastion-update.1540182/)).

**Warnings before harm.** Update 1.9.1 added "foreboding events, which make characters eligible to receive awful harm or death down the line", then harm and death events that fire only after a suitable foreboding event ([1.9.1 patch notes, SteamDB copy](https://steamdb.info/patchnotes/11318013)).

**Pacing.** Events don't fire on their own. They come from on_actions, decisions, interactions and story cycles ([CK3 wiki, Event modding](https://ck3.paradoxwikis.com/Event_modding)). The yearly pulse draws from a weighted list that includes an explicit "nothing happens" weight ([Paradox modding forum](https://forum.paradoxplaza.com/forum/threads/modding-quick-questions-and-answers.1414681/page-62), *community*). Hold Court shows 3 petitioners each time, drawn from a planned pool of just under 100 court events ([Dev Diary #72](https://admin-forum.paradoxplaza.com/forum/developer-diary/crusader-kings-3-dev-diary-72-holding-court-at-court-in-the-royal-court-in-a-courtly-fashion.1489882); [PCGamesN](https://www.pcgamesn.com/crusader-kings-3/court-events)). Lifestyle events are "opportunities (or crises!)" that come from what your ruler focuses on ([Dev Diary #10](https://forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-10-lifestyle-events.1312112/)).

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

**Lesson for Ardan.** A tiny slice per run works when every slice is dense with context: the text knows where you are, who you travel with and what you did. A median Ardan life sees about 4.4% of its events (about 17,000 words), so coverage is not the problem. Context is: only 19% of the events a life sees involve someone the player already knew.

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

## 3. Backtest

### What I measured, and how

The test build was made with `node tools/build.mjs --out=<scratch> --unpack=<scratch>` (fix layer only, 29 patches). The scripts lived in a private scratch folder; nothing in the repo changed except this file. Four studies:

1. **Static audit of all 3,199 events and 9,635 choices**, read in the page. It reuses `bench/bot.mjs`'s `memoryIndex()` for flag setters and readers, then adds: the event link graph (flag setter to flag reader, plus `fx.event` follow-ups) and its depth, cooldowns, what each choice leaves behind, casting, tics and a strict dominant-choice test.
2. **Engine read.** `A.monthEvents`, `A.rollEventsN`, `A.evFit`, `A.headReady`, `A.eventChoose`, `A.log` and `UI.deathModal`, through `tools/show.mjs`.
3. **48 bot lives with story logging.** 8 starts × 4 personalities (careful, reckless, greedy, random), up to 90 years each, seeds `4242 + i × 7919`. For every event the player saw, the bot logged: who it cast, whether that person was already known, which flags it read, whether **this life** had set those flags (a real callback), the flags it set, and what the chosen branch left behind. Driving the queue is the same as `bench/bot.mjs`'s passive bot.
4. **A salience experiment.** The same 48 seeds, with one change: an eligible event whose conditions read a flag the player holds gets 5 times its weight (a wrapper on `A.evFit`). No new content.

"Reads a memory" in the static audit means the bench's rule: the event's condition or setup reads a flag that another event sets. "Real callback" in the bot lives is stricter: the flag was set earlier in the same life by a different event the player saw.

### Key results

**How an event is chosen today.**

- `A.monthEvents`: each month, a fixed chance by life stage fires 1 event, or 2 with a 12% chance. The chances are infant 5%, child 17%, teen 28%, adult 32% and old age 26%.
- `A.rollEventsN`: every event whose condition passes and whose cooldown has run out is eligible. One is drawn by weight × `A.evFit`.
- `A.evFit` reads only social class and role (ruler, army, company, job). It ignores memories, people you know, arcs and what you saw last month.
- The default cooldown is 6 years. `A.headReady` drops an event shown in the last 240 days.

That is a flat lottery. King of Dragon Pass also draws scenes at random, but with conditions and casting that keep them relevant. CK3 draws from pulses and story cycles, RimWorld from a stateful storyteller, Wildermyth from targeting criteria on the party.

**The event library (static).**

| Measure | Value |
| --- | --- |
| Events / choices | 3,199 / 9,635 |
| Events with exactly 3 choices | 2,626 (82.1%) |
| Choices with no check | 53.0% |
| Events whose condition reads another event's flag | 95 (3.0%) |
| Events reading the "seen events" record `p.flags.ev` | 0 |
| Flags set by events | 458 |
| ... never read by any event | 369 (81%) |
| ... never read by any code at all | 362 |
| Unread flags set by a once-only event | 118 of the 369 |
| "Play this next" links (`fx.event`) | 23, all in the adventure pack `av_` |
| Events linked to any other event | 193 (6.0%) |
| Events that lead into a chain 3+ deep | 43 (1.3%); 27 of them are not reached from any other event |
| Longest chain | 9 events: `gallows` → `av_wild_greenwood` → `av_crime_recruit` → `av_heist_start` → ... → `av_crime_old_crewmate` |
| Choices that leave a lasting mark (flag, trait, wound, new bond, deed, job, prison, a fight, a follow-up...) | 34.7% |
| ... only change an opinion | 15.5% |
| ... only nudge numbers, or nothing | 49.8% |
| Events where no choice leaves any mark | 690 (21.6%) |
| Median largest number moved by a choice | 4 |
| Events that cast a specific person (`ctx.pid` or a person token) | 750 (23.4%) |
| Self-firing events that may repeat within 10 years | 1,548 of 2,564 (60%) |
| Events that require age 55+ | 41 (1.3%) |
| Static words in events (titles, text, choices, results) | 387,000, not counting 613 events whose text is a function |

**Obvious best choices.** For most events the effects are functions or flags, so a static test can't price them. 397 events have plain numeric effects on every choice. In **58 of them (15%)**, one choice costs nothing, risks nothing, and gains at least as much as every other choice's best case. Examples: `wr_water_law` "Give him water" (+9 and no downside), `rk_gen_contracts` "Send the chest back" (+17), `tavern_song` "Sing along at the top of your lungs" (+8). The plan's checklist says "no obviously best choice". The 15% figure covers only the events that can be read; how many function-effect events also have a free best choice is unmeasured.

**Tics, counted.** "looks at you (for) a long time" appears 21 times, "for the rest of your life" 21 times, and the bare choice "Refuse" 41 times. 3,458 of 13,960 static outcome texts (24.8%) end on a sentence of 5 words or fewer.

**Memories that nothing reads.** These are the most expensive losses, because the player chose them on purpose:

| Flag | Set by | The choice | Read by |
| --- | --- | --- | --- |
| `wr_lifedebt` | `wr_ford_rescue` "The ford" | "Swear a life-debt" | nothing |
| `fm_promise` | `fm_friend_dying` "A friend is dying" | "Promise to look after his family" | nothing |
| `wk_knows_secret` | `wk_serv_secret` "Servants know everything" | "Keep it, and remember" | nothing |
| `fm_affair` | `fm_temptation` "Temptation" | "Give in" | nothing |
| `wr_traitor` | `wr_hf_spy` "The peddler" | "Sell him what you know" | nothing |
| `ch_first_love` | `ch_teen_crush` "A face" | "Give {khim} a small gift" | nothing |
| `ch_hates_lord` | `ch_serf_bailiff` "The bailiff" | "Throw a stone at his horse" | nothing |
| `ch_poison_enemy` | `ch_roy_poison` "The taster" | "Find out who sent it" | nothing |

**What a life actually meets (48 bot lives, 11,410 events shown, 0 page errors).**

| Measure | Value |
| --- | --- |
| Median life | 58 years played, 222 events, 4.2 events a year; median death age 53 |
| Shown events that read any other event's flag (bench rule) | 1.1% (the bench league says 1.3% on the same build) |
| **Shown events that call back to something this life did** | **0.4%** (about 1 in 250) |
| Lives with no callback at all | 27 of 48 |
| Median callbacks per life | 0 |
| Flags set in a life, median | 7 |
| ... later read by an event the player saw | 27 of 332 (8.1%) |
| Years between a memory and its callback | median 9, p90 26 |
| Longest chain that actually played out | 2 events; **0 of 48 lives saw a chain of 3** |
| Shown events that repeat one already seen this life | 35.9 per 100 |
| ... repeats within 10 years | 24.6 per 100 |
| Back-to-back events from the same pack (same id prefix) | 20% |
| Shown events that cast a person | 44.7% |
| ... a person the player already knew | 19.3% |
| People who appear in 3+ events of one life, median | 7, mostly through repeated duty events (see below) |
| Chosen outcome left a lasting mark / an opinion change / only numbers | 28.8% / 23.6% / 47.5% |
| Events a year, adults 18 to 54 / age 55+ | 5.4 / 5.5 |
| Longest gap between two shown events, median life | 2 calendar years (p90: 4) |
| Shown events that are trigger-only (queued by a system: duties, study, gatherings) | 25.9% |

**The most-seen events are loops, not stories.** The top 5 in 11,410:

| Event | Times | What it is |
| --- | --- | --- |
| `fl_st_master` "An old scholar" | 402 (8.4 per life) | A stranger offers lessons for his rent. Each time it is a new stranger |
| `du_gd_undercut` "Someone is undercutting you" | 228 | A guild duty; your rival undercuts you again |
| `ga_invite` / `ga_open` / `ga_close` | 213 / 176 / 176 | Court gatherings |
| `du_gd_commission` "A great lord's commission" | 140 | A guild duty with a new stranger |
| `fl_st_exam` "The examination" | 133 | The College exam |

The "recurring characters" figure looks better than it is. The top-events list suggests most of them come from repeated duty events, such as the same rival undercutting you again, rather than a person whose story moves. I did not trace each one.

**Coverage.** A median life sees about 142 different events (222 shown, 36% repeats): 4.4% of the library and about 17,000 words, against 80 Days' 2% and King of Dragon Pass's quarter. Ardan's slice per life is in the normal range. The problem is what the slice knows about you.

**Old age.** The rate is fine and the content is not. People over 55 see as many events a year as adults (5.5 against 5.4), but only 41 events (1.3%) are written for old age. So most of what a 70-year-old sees was written for someone younger.

**The salience experiment: code helps, but content is the wall.** The same 48 seeds, with memory-reading events weighted 5 times:

| Measure | Today | Salience × 5 |
| --- | --- | --- |
| Events shown | 11,410 | 11,069 |
| Shown events that call back to this life | 0.4% | **1.2%** |
| Lives with no callback | 27 of 48 | 24 of 48 |
| Flags set in a life that come back | 8.1% | 15.6% |
| Lives that saw a chain of 3 | 0 | 2 |
| Repeats within 10 years, per 100 | 24.6 | 23.5 |

The lives diverge once the weights change, so this compares the same seeds, not identical lives. A one-function change triples the callbacks and doubles how many memories return, at no cost in event volume. But 1.2% is still a 33rd of the plan's 40%. With only 95 events able to read a memory, no selection rule can get there. The callbacks have to be written.

### The backtest table

"New" in the last column means `bench/` doesn't measure it yet; section 5, item 12 adds it.

| Metric | Reference game value or practice | Ardan today | Target for a 10 | How to measure in Ardan |
| --- | --- | --- | --- | --- |
| Library events that can read a memory | Fallen London: storylets unlock on qualities by design. CK3: memories feed events | 95 of 3,199 (3.0%) | ≥ 40% (plan) | Static analysis: `events.memorySharePct` |
| **Shown events that call back to this life** | CK3: an assassin cites the killer's grievance. Hades: bosses remember earlier encounters | **0.4%**; 27 of 48 lives have none | ≥ 40% of events after age 16 | Bot (new `league.realisedMemoryShare`) |
| Flags written and never read | Failbetter: a quality exists to gate storylets | 369 of 458 (362 unread by any code) | 0 | Static analysis: `events.orphanFlags` |
| Flags set in a life that come back | No published figure | 8.1% (27 of 332) | ≥ 60% | Bot (new) |
| Years from memory to callback | Wildermyth: 10 to 12 years pass between chapters and heroes age. CK3: some memories fade, others stay | Median 9, p90 26 (only 27 cases) | Each life ≥ 3 callbacks to something 10+ years old | Bot (new) |
| Authored arcs | CK3 story cycles: state, timers, owner-death handoff. Iberian Struggle: phases with their own endings | 23 follow-up links, all in one pack. 43 events can start a 3+ chain; longest 9 | 60 arcs of 3 to 8 stages over 2 to 20 years (plan); ≥ 5 per life path | Static analysis (new `events.arcEvents`) |
| Arcs that play out | Wildermyth: hook quests open once a relationship reaches 3+ (3+, 3+, then 4+ for the third) | 0 of 48 lives saw a chain of 3; longest 2 | ≥ 90% of lives that reach 40 finish an arc | Bot (new) |
| Casting from the player's circle | King of Dragon Pass: scenes cast clan-ring leaders and neighbour clans. Wildermyth: events target personality stats, hooks and relationships | 23.4% of the library casts anyone; 19.3% of shown events cast someone the player knew | ≥ 50% of shown events cast someone known | Static analysis and bot |
| Repeats | Wildermyth: a theme event can't recur once a hero has that theme. Plan: no repeat within 10 years outside chains | 24.6 of every 100 shown events repeat within 10 years; one event 8.4 times a life | 0 outside arcs and duties; no event > 3 times a life | Bot (new) |
| Variety in a row | Six Ages: two advisors don't give the same warning. Plan: no two same-shape events back to back | 20% of events follow one from the same pack | ≤ 5% | Bot (new) |
| Lasting consequences | Fallen London: menaces at 8 send you to a place. Wildermyth: transformations and lost limbs persist | 28.8% of chosen outcomes leave a mark. 690 events (21.6%) cannot leave one | ≥ 60% of chosen outcomes; ≤ 5% of events with no possible mark | Static analysis and bot |
| Obviously best choice | Plan checklist: none | 58 of the 397 events whose effects are readable (15%) | 0 | Static analysis now; bot pick rates once a league exists |
| Pacing controller | RimWorld: Cassandra's 4.6-day on and 6-day off cycles, majors ≥ 1.9 days apart; Randy forces a threat after 13 quiet days; adaptation after deaths. CK3: an explicit "nothing happens" weight | A fixed monthly chance by life stage, no state. p90 gap between prompts 153 days (bench, fixes) | A director with state: no adult year without a real choice; harm eased after a family death | Bot |
| Warning before harm | CK3 1.9.1: a foreboding event comes before a harm or death event | None: harm is one roll in one event | Every outcome that kills or maims has a foreboding event first | Static analysis (new) |
| Old age | No reference figure found | 41 events (1.3%). Over-55s see 5.5 events a year, few written for them | ≥ 150 old-age events (Road to 100); ≥ 50% of events after 55 written for that stage | Static analysis and bot |
| A written life | King of Dragon Pass: a computer-written saga, year by year. Ryan and Winnow: sift the simulation for stories | Death screen: title, cause, counts, last 5 deeds, score. The life is a log of outcome lines | A saga built from memories, with names and years | Browser test, then human playtest |
| Retelling | The plan's gate | Unmeasured: 0 playtests | 7 of 10 new players retell a 3-step story unprompted | Human playtest |
| Choice shape | No sourced figure for the references | 82.1% of events have exactly 3 choices | ≤ 60% | Static analysis |
| Prose tics | Failbetter: a counter that turns red past 100 words | "looks at you a long time" 21, "for the rest of your life" 21, "Refuse" 41; 24.8% of outcomes end on ≤ 5 words | 0 banned phrases; ≤ 10% short punchlines | Static analysis (linter) |
| Share of the library one life sees | 80 Days: about 2%. King of Dragon Pass: about a quarter | About 4.4% of events, about 17,000 words | Not a target. Context matters, not coverage | Bot |

## 4. North star

With unlimited time, money and people, Ardan's events and story look like this.

**The Ledger: memories with names on them.** Every choice that matters writes a memory, not a bare flag: `{ kind, who, where, year, weight, witnesses, secret }`. There are 12 kinds: oath, debt, grudge, shame, kindness, betrayal, love, loss, secret, rival, wound and deed. Memories fade by weight, the way CK3's do; oaths and blood never fade. NPCs keep the other side ("she remembers you left her brother at the ford"). The 573 cast members' written wants and fears are memories they start with.

**The Chronicler: a director, not a lottery.** Each month it scores every eligible storylet. The score multiplies:

- base weight;
- memory salience (×4 if it reads a live memory, ×6 if that memory is more than 5 years old: "the past returns");
- cast fit (×2 if it involves someone whose opinion of you is past ±40);
- arc priority (a stage that is due);
- variety (no pack or shape seen in the last 3 events);
- pacing.

Pacing is a tension budget, as RimWorld's storyteller keeps one. It eases off for a season after a death in the family. It never lets an adult year pass without a real choice. It sends a foreboding event before any event that can kill or maim, as CK3 does. When two storylets fit, the one whose conditions name more of your past wins, as in Valve's dialogue system.

**Story cycles.** 120 arcs in the CK3 manner, each an object with state, stages and timers of 2 to 20 years. When the owner dies, an arc passes to the heir or to the NPC who shares it. Every arc ends in a lasting change: a title, a bond, a scar, a law, a renamed place on the map, or an heir's grudge.

- **Every path gets its own arcs:** the blood feud, the secret child, the sword's line, the apprentice who surpasses you, the plague year, the debt of honour, the lord's grudge, the lost brother, the false pilgrim, the mutiny you joined.
- **Stretches of life with their own deck,** like Fallen London's menace places: wanted by the watch, disgraced at court, deep in debt, in exile, in a siege camp. Each changes which events you see until you climb out.

**Casting from your circle.** Every event has roles ("the friend from childhood", "the rival you shamed", "the lord who owes you"), filled from people you actually know, as King of Dragon Pass and Wildermyth cast theirs. Strangers are the exception. A typical life has 4 or more recurring characters who each turn up in 5 or more events and change as they do.

**The Saga.** A chronicle in a period chronicler's voice, one per culture (8 voices), sifted from the Ledger with Winnow-style patterns ("a guest harmed under your roof", "an oath kept at great cost"). It has a chapter per decade, rumours marked as rumours, and the deaths and wars of the world woven in. At death you read a one-page saga and a list of "threads left open", and the heir inherits those threads as live arcs. The saga exports as a printable page.

**Screens.**

- **The event card** carries a "Because..." line ("Because you swore a life-debt at the ford, in 1104") and the portrait of whoever is cast.
- **A "What you carry" panel** on the Life tab lists oaths, debts, grudges and secrets, each with a face, a year and how much it has faded.
- **A Saga tab** sits under Chronicle, with ink illustrations for its chapter heads.
- **The death screen** is the saga page.

**Numbers.**

- About 4,200 events: the best 2,000 of today's, 1,200 new callbacks, about 700 arc stages and 300 for old age. That is about 1.1 million words, a quarter of Fallen London's and twice King of Dragon Pass's.
- In a 60-year life: 40 to 50% of shown events read a memory from this life; 5 or more arcs complete; 0 repeats within 10 years outside arcs; 6 to 10 meaningful prompts a year; no adult year without one.
- 0 events with an obviously best choice, checked by a pick-rate dashboard from opted-in players, the way Slay the Spire's team logged how often each card was picked when offered ([Game Developer](https://www.gamedeveloper.com/design/how-i-slay-the-spire-i-s-devs-use-data-to-balance-their-roguelike-deck-builder)).

**People.** 4 writers and a narrative designer for 2 years, a period-history reader, and a 12-player retell test every phase. For scale: Failbetter's Sunless Sea took 15 months for 250,000 words, and Fallen London took 15 years to grow from about 10,000 words to 4.5 million. Ardan's 1.1 million words is a studio's writers' room, not a solo project.

## 5. What to build now

Ranked by score gain per unit of effort. "Here" means it can be built in this repo as a feature folder (`patches.mjs`, `*.core.js`, `*.events.js`, `test.mjs`) per CLAUDE.md. Gains are on the Events and story score, out of 10.

| # | Feature | Effort | Built here? | Gain | Acceptance test (must be able to fail) |
| --- | --- | --- | --- | --- | --- |
| 1 | **Memory salience in the draw.** A `*.core.js` wraps `A.evFit`; `A.rollEventsN` already calls it at draw time, so no patch is needed. An eligible event whose condition reads a flag the player holds gets its weight × K. Ties go to the event whose condition names more of the player's past. Weights only; no new random draws. | S | Yes: code | +0.3 | Same 48 seeds as section 3: callbacks ≥ 1.0% of shown events (0.4% today; × 5 measured 1.2%); events a year within ±10%; replay and `renderRng` tests pass. Fails if K is set too low or the wrapper is skipped |
| 2 | **Repeat and variety guard.** Default cooldown 10 years for self-firing events. Same pack as the last shown event: weight × 0.2. Study and duty loops that create a stranger (`fl_st_master`, `du_gd_commission`) reuse the person from last time, so the old scholar becomes a character. Cap any non-arc event at 3 a life. | S | Yes: code (`*.core.js` and one patch in the flow and duty setup) | +0.4 | 48 bot lives on the same seeds: repeats within 10 years ≤ 5 per 100 (24.6 today); no event more than 3 times a life outside listed duties (402 in 48 lives today); same pack back to back ≤ 8% (20% today); events a year within ±15% |
| 3 | **Memory records with names.** `A.remember(p, key, { who, where, year, weight })`, written whenever an event sets a flag and has a `ctx.pid`. Adds `C.mem(p, key)` and a `{memWho}` token so a callback can name the person. Fades by weight; oaths and blood never fade. Old saves without `p.mem` load fine. | M | Yes: code (`*.core.js` plus a small patch on the flag path in `A.applyFx`) | +0.5 (enables 4, 5, 7) | Test: an event with `ctx.pid` that sets a flag writes `p.mem[flag].who`. A save and load round trip is exact. A pre-feature save loads. A callback forced 10 years later prints that person's name. Replay and `renderRng` tests pass |
| 4 | **Callbacks for the orphan flags.** 1 to 3 events per unread flag, 2 to 20 years after it was set, each casting the same person through item 3 and each leaving a mark. Order by how often bot lives set the flag; start with the life-debt, the promise to a dying friend, the affair, the betrayal, the first love and the kept secret. | L (about 500 events) | Yes: content (`*.events.js`) | +1.5 | `events.orphanFlags` falls from 369 to ≤ 250 after the first tranche and to 0 at the end. In 48 bot lives, callbacks reach ≥ 10% of shown events after tranche 1 and ≥ 25% at the end (0.4% today). `tools/lint-events.mjs` passes |
| 5 | **Story cycles.** `A.defArc({ id, stages, gap, onDeath, end })` keeps state in `pc.arcs`, times stages with `A.schedule`, and hands an arc to the heir on "Go on as your child". The first 10 arcs: blood feud, secret child, apprentice who surpasses you, the life-debt, the mutiny you joined, the lord's grudge, the promise to a dying friend, first love returns, the sword's line, the plague year. Each ends in a lasting change. | M code + L content (about 60 events for 10 arcs) | Yes: both | +1.5 | A forced start of each arc reaches its last stage in ≥ 80% of seeds where the character lives long enough. Every last stage writes a deed, epithet, trait or title. 48 bot lives: ≥ 50% of lives that reach 40 finish an arc (0 of 48 see even a 3-event chain today) |
| 6 | **The Saga, version 1.** `saga.core.js` sifts the log, memories and deeds into decade chapters in a period voice, with names and years. It shows on the death screen and as a Chronicle sub-tab, and registers `A.SIGNATURE.chronicle = true`. | M | Yes: code | +0.8 (and Uniqueness) | Browser test at a bot death: ≥ 8 sentences, ≥ 3 naming a person and a year, ≥ 2 about events ≥ 10 years apart. `renderRng` passes (the saga is built without drawing random numbers). `bench` signature `chronicle` reads true |
| 7 | **"Because..." line on callbacks.** When an event reads a memory, its card shows the source: "Because you swore a life-debt at the ford, in 1104." | S | Yes: code (needs 3) | +0.3 | Browser test: a forced callback shows the line with the name and year; an ordinary event shows none |
| 8 | **Event checker rules.** (a) A flag with no reader is a warning for old packs and an error for new features. (b) The dominant-choice test from section 3. (c) Banned phrases: "looks at you a long time", "for the rest of your life", a bare "Refuse". (d) Short punchlines ≤ 10% per feature. | S | Yes: code, with the `tools/` owner's sign-off | +0.3 (keeps the rest honest) | On today's content it reports 369 orphan flags, 58 dominant choices, 83 banned phrases and 3,458 short punchlines. On a new feature it fails on any new one |
| 9 | **A pacing director, with warnings before harm.** Replace the fixed monthly chance with a tension budget: quiet months raise the chance; a death in the family or a bad wound lowers harm weights for 6 months, like RimWorld's adaptation. Any outcome that kills or maims needs a foreboding flag set by an earlier warning event, as CK3 1.9.1 does. | M | Yes: code + about 40 warning events | +0.6 | Bot: p90 gap between prompts ≤ 120 days (153 today); no adult life has a calendar year with no event; harm events in the 6 months after a family death fall ≥ 50%; events a year within ±15% |
| 10 | **Casting from your circle.** A setup helper picks the known person who fits a role, with the strongest bond, the way Wildermyth gives the line to the highest stat. Retrofit the 100 most-shown events that cast strangers. | M | Yes: both | +0.6 | Bot: ≥ 40% of shown events cast someone the player knew (19.3% today); median ≥ 3 people who appear in 3 or more **different** events |
| 11 | **Old age.** 150 events, half of them callbacks: settling scores, teaching, confessions, the heir's question, decline. | L | Yes: content | +0.4 | `events.oldAgeEvents` ≥ 150 (41 today); bot: ≥ 50% of events after 55 require old age or read a memory |
| 12 | **Measure it in `bench/`.** Add to the league: real callback share, callback rate, arc completion, repeats within 10 years, same pack back to back, known-person casting. Add to `events`: dominant choices, events with no possible mark, arc events. Score them in `bench/rubric.mjs`. | S | Yes: code (`bench/` owner) | +0 directly; it keeps 1 to 11 honest | On today's build the new lines read within ±10% of this doc's numbers and fail their targets |
| 13 | **Cut or mark the no-mark events.** 690 events can't leave any mark. Cut the 300 least shown; give the rest a flag that a callback reads. | L | Yes: content | +0.4 | `eventsLeavingNoMark` ≤ 5% (21.6% today); `events.strictRecipePct` ≤ 10% (25.7% today) |
| 14 | **Menace stretches.** Wanted, disgraced, deep in debt and exiled become stretches of life with their own deck of events, the way Fallen London's menaces send you to a place. | L | Yes: both | +0.4 | Bot: entering a stretch moves ≥ 50% of the next 12 months' events into its deck; leaving takes a choice, not a timer |
| 15 | **The retell test.** 10 new players, 45 minutes each, then "tell me what happened to your character". | S | Needs people | +0.5 (and it is the plan's gate) | 7 of 10 retell a 3-step story unprompted. Unmeasured today |
| 16 | **Culture voices and a writers' pass.** 8 cultures with their own sayings and word choice; a pass on the 2,000 kept events for tics and punchlines. | XL | Needs people (writers) | +0.5 | A blind panel matches 10 random event texts to their culture 7 times in 10 |

With 1 to 13 built and their tests green, I expect Events and story to reach about 7.5. Items 14 to 16 and the north star's writers' room are what separate an 8 from a 10. No narrative game earns a 10 before real players have retold its stories.

## 6. Sources

All read through search-engine results that quote or summarise the page (see the note at the top). *(community)* marks fan wikis and forums.

**King of Dragon Pass and Six Ages**

- Six Ages development blog: https://blog.sixages.com/ · design category: https://blog.sixages.com/index.php/category/design/ · May 2016 (scene tags): https://blog.sixages.com/index.php/2016/05/
- King of Dragon Pass blog, "KoDP on the web: 50 Years of Text Games / Storylets with Casting" (2021): http://kingofdragonpass.blogspot.com/2021/08/kodp-on-web-50-years-of-text-games.html
- Aaron Reed, 50 Years of Text Games, "1999: King of Dragon Pass": https://if50.substack.com/p/1999-king-of-dragon-pass
- A Sharp, King of Dragon Pass overview: https://www.a-sharp.com/kodp/overview.html
- AppleVis, "Share your King of Dragon Pass sagas" *(community)*: https://www.applevis.com/forum/ios-ipados-gaming/share-your-king-dragon-pass-sagas-here
- Wikipedia, King of Dragon Pass: https://en.wikipedia.org/wiki/King_of_Dragon_Pass
- "King of Dragon Pass now on iOS" (Dunham, via Goodreads): https://www.goodreads.com/author_blog_posts/1533552-king-of-dragon-pass-now-on-ios · Loop Insight: https://loopinsight.com/2011/09/15/king-of-dragon-pass-makes-ios-debut
- Six Ages: Ride Like the Wind on Steam: https://store.steampowered.com/app/881420/Six_Ages_Ride_Like_the_Wind/
- David Dunham, "Designing Six Ages, a Storytelling Strategy Game", GDC 2019: https://www.gdcvault.com/play/1025740/Designing-Six-Ages-a-Storytelling
- Failbetter, "The Problem with Branching": https://www.failbettergames.com/news/the-problem-with-branching

**Crusader Kings III**

- CK3 Dev Diary #37, Making Mods (story cycles, programmer replies): https://forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-37-making-mods.1410656/
- Steam discussion, dog story cycle `effect_group` *(community)*: https://steamcommunity.com/app/1158310/discussions/0/3821912677675548093
- Development Diary #105, 1.7 "Bastion" (memories): https://forum.paradoxplaza.com/forum/developer-diary/development-diary-105-1-7-bastion-update.1540182/
- 1.9.1 patch notes, foreboding and harm events (SteamDB copy): https://steamdb.info/patchnotes/11318013
- CK3 wiki, Event modding *(community)*: https://ck3.paradoxwikis.com/Event_modding
- Paradox modding forum, yearly pulse weights *(community)*: https://forum.paradoxplaza.com/forum/threads/modding-quick-questions-and-answers.1414681/page-62
- Dev Diary #72, Holding Court: https://admin-forum.paradoxplaza.com/forum/developer-diary/crusader-kings-3-dev-diary-72-holding-court-at-court-in-the-royal-court-in-a-courtly-fashion.1489882 · PCGamesN on court events: https://www.pcgamesn.com/crusader-kings-3/court-events
- Dev Diary #10, Lifestyle Events: https://forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-10-lifestyle-events.1312112/
- Dev Diary #93, Turmoil in the Peninsula: https://www.paradoxinteractive.com/games/crusader-kings-iii/news/ck3-dev-diary-93-turmoil-in-the-peninsula · Dev Diary #99: https://admin-forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-99-it-is-time-to-decide-the-fate-of-iberia.1528613

**Failbetter (Fallen London, Sunless Sea) and storylets**

- Echo Bazaar Narrative Structures, part two: https://www.failbettergames.com/news/echo-bazaar-narrative-structures-part-two · part three: https://www.failbettergames.com/news/echo-bazaar-narrative-structures-part-three
- Emily Short, "Beyond Branching: Quality-Based, Salience-Based, and Waypoint Narrative Structures": https://emshort.blog/2016/04/12/beyond-branching-quality-based-and-salience-based-narrative-structures/
- Emily Short on Kreminski and Wardrip-Fruin's storylet survey: https://emshort.blog/2019/01/06/kreminski-on-storylets/
- Fallen London wiki *(community)*: Cards https://fallenlondon.wiki/wiki/Cards · Beginner's Guide https://fallenlondon.wiki/wiki/Beginner's_Guide · Menaces https://fallenlondon.wiki/wiki/Menaces_(Guide) · Menace Locations https://fallenlondon.wiki/wiki/Menace_Locations_(Guide) · Ambitions https://fallenlondon.wiki/wiki/Ambitions_(Guide)
- Failbetter, "Fallen London's 15th Birthday": https://www.failbettergames.com/news/fallen-londons-15th-birthday
- 50 Years of Text Games, "2009: Fallen London": https://if50.substack.com/p/2009-fallen-london
- Postmortem: Failbetter Games' Sunless Sea: https://www.gamedeveloper.com/audio/postmortem-failbetter-games-i-sunless-sea-i-
- Inverse, interview with Chris Gardiner: https://www.inverse.com/article/28228-failbetter-games-interview-sunless-skies

**80 Days**

- Wikipedia, 80 Days: https://en.wikipedia.org/wiki/80_Days_(2014_video_game)
- Game Developer, Road to the IGF: Inkle's 80 Days: https://www.gamedeveloper.com/design/road-to-the-igf-inkle-s-i-80-days-i-
- Game Developer, Jon Ingold GDC 2015 video: https://www.gamedeveloper.com/design/video-innovating-interactive-fiction-with-i-80-days-i-jon-ingold
- MCV/Develop, "Write to Replay": https://mcvuk.com/business-news/write-to-replay-jon-ingold-on-the-issue-of-replayability-in-narrative-games/
- Postmortem: inkle's 80 Days: https://www.gamedeveloper.com/business/postmortem-inkle-s-i-80-days-i-

**RimWorld**

- Tynan Sylvester, "RimWorld: Contrarian, Ridiculous, and Impossible Game Design Methods", GDC 2017: https://www.gdcvault.com/play/1024232/-RimWorld-Contrarian-Ridiculous-and · slides: https://media.gdcvault.com/gdc2017/Presentations/Sylvester_Tynan_RimWorld_Contrarian_Ridiculous.pdf
- Tynan Sylvester, "The Simulation Dream": https://tynansylvester.com/2013/06/the-simulation-dream/ · Stanford GDT, "How do you create apophenia?": https://gdt.stanford.edu/how-do-you-create-apophenia/
- RimWorld wiki *(community)*: Cassandra Classic https://rimworldwiki.com/wiki/Cassandra_Classic · Randy Random https://rimworldwiki.com/wiki/Randy_Random · Raid points https://rimworldwiki.com/wiki/Raid_points

**Wildermyth**

- Wildermyth wiki *(community)*: Event https://wildermyth.com/wiki/Event · Event Types https://wildermyth.com/wiki/Event_Types · Campaign https://wildermyth.com/wiki/Campaign · Legacy https://wildermyth.com/wiki/Legacy
- Steam discussion on personality stats and roles *(community)*: https://steamcommunity.com/app/763890/discussions/0/4241812037674029611/
- Nate Austin, "Getting Players Emotionally Invested in Procedural Characters in Wildermyth", GDC 2022: https://www.gdcvault.com/play/1027614/Independent-Games-Summit-Session-Getting · slides: https://media.gdcvault.com/GDC+2022/Speaker+Slides/GettingPlayersEmotionally_Austin_Nate.pdf

**Shorter references**

- Elan Ruskin, "AI-driven Dynamic Dialog through Fuzzy Pattern Matching", GDC 2012: https://www.gdcvault.com/play/1015528/AI-driven-Dynamic-Dialog-through · Emily Short's write-up: https://emshort.blog/2012/03/16/gdc-2012-talk-on-dynamic-dialogue/
- Cultured Vultures, Hades word count: https://culturedvultures.com/supergiant-hades-word-count-dialogue/ · GDC Podcast ep. 16 with Greg Kasavin: https://gdconf.com/article/roguelikes-and-narrative-design-with-hades-creative-director-greg-kasavin-gdc-podcast-ep-16/
- Emily Short on James Ryan, "Curating Simulated Storyworlds": https://emshort.blog/2019/05/21/curating-simulated-storyworlds-james-ryan/
- Kreminski, Dickinson and Mateas, Winnow: https://github.com/mkremins/winnow
- Game Developer, how Slay the Spire's devs use data (cited in `power-balance.md`): https://www.gamedeveloper.com/design/how-i-slay-the-spire-i-s-devs-use-data-to-balance-their-roguelike-deck-builder

**Ardan**

- `docs/plan/Ardan The Road to Ten.md` (Events and story section, plan targets)
- `docs/reviews/Ardan Road to 100.md` and `docs/reviews/Ardan Deep Analysis.md` (95 memory events, 287 of 450 orphan flags by their count, tics, old age)
- `reports/release.json`, `reports/fixes.json` (bench league: memory share of fired events 1.8% release and 1.3% fixes; p90 days between prompts 181 and 153)
