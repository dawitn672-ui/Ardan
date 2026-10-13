# Relationships and people: benchmark

Oct 13, 2026 · build `b593143` plus the 29 fix patches (`features/00-05`), measured in headless Chromium. Strict score going in (from "Ardan Road to 100"): **4**. The plan's own score: 4.5.

Every number about Ardan below was measured for this doc unless it names a review. The scripts lived in a private scratch folder. This file is the only thing this work added to the repo.

**About the sources.** The sandbox could not open web pages: wiki, forum and Wikipedia hosts failed at DNS or were refused by the proxy. The shared web-search budget also ran out partway through. So every claim about another game comes from one of two places:

- search-engine excerpts I read for this doc, or
- sources already cited in the sibling benchmarks (`events-story.md`, `character-lifesim.md`, `world-lore-uniqueness.md`), which were gathered the same way.

Fan wikis, guides and forums are marked *(community)*. A number from one excerpt only is marked *(one source)*. Anything I could not source is marked **unverified**. The Sims relationship bars and almost all of the Shadow of Mordor section are unverified. Treat them as a designer's memory and check them before quoting.

## 1. The bar

A 10 means the people around you have lives of their own and act on them without being asked. They want things. They come to you for help, or against you. They remember what you did to them and say so years later, and they talk about you to each other. Every opinion explains itself as a list of dated reasons, and the number on screen is the number the game uses. A small cast keeps coming back: in a typical life, four to eight people appear again and again and change along the way. The test is the player's own story. Asked nothing, they name someone they loved or hated and say why: "My brother-in-law ruined me because I killed his father at the wedding."

CK3 does the scheming and the ledger of reasons. RimWorld does the constant small social physics between everyone. Shadow of Mordor does the enemy who comes back changed. Wildermyth does the written arcs between people.

## 2. How the best do it

### Crusader Kings III: schemes, secrets, hooks, memories

**Schemes.**

- There are two families: hostile schemes (murder and the like) and personal ones (sway, befriend, seduce) ([GameWatcher](https://www.gamewatcher.com/crusader-kings-3-schemes-secrets-hooks-intrigue), *community*).
- A scheme has a power value set against the target's resistance. It can advance once a month, with a chance set by power versus resistance ([TheGamer](https://www.thegamer.com/crusader-kings-3-how-schemes-work-explained/), [Guild Order](https://guildorder.com/games/ck3/wiki/schemes-and-intrigue), *community*).
- Power and success are separate numbers. Power moves the plan along. The success chance decides the roll when the plan fires (same sources). One player reports success caps at 90% for a throne claim ([Steam discussions](https://steamcommunity.com/app/1158310/discussions/0/2994291378925426637), *community, one source*).
- Hostile schemes use agents. A murder draws on Intrigue and on agents inside the target's court. Agents cost favours, gold or good relations, and the pool depends on how people regard the target ([Steam discussion](https://steamcommunity.com/app/1158310/discussions/0/3824160148617255746), [Guild Order guide](https://guildorder.com/games/ck3/guides/schemes-choosing-the-right-plot), *community*).
- Discovery is the main risk. A failed scheme can be uncovered, which damages relationships and can bring retaliation ([Guild Order](https://guildorder.com/games/ck3/wiki/schemes-and-intrigue), *community*).
- The spymaster can disrupt hostile schemes against you or add power to yours (same source).

**Secrets and hooks.**

- Secrets come in two kinds, shunned and criminal. Blackmail over a shunned secret gives a weak hook. Blackmail over a criminal secret gives a strong one ([GameWatcher](https://www.gamewatcher.com/crusader-kings-3-schemes-secrets-hooks-intrigue), [PC Gamer](https://www.pcgamer.com/uk/crusader-kings-3-ck3-intrigue-hooks), [Prima Games](https://primagames.com/gaming/crusader-kings-3-intrigue-schemes-hooks-secrets), *community*).
- A weak hook is spent in one use. A strong hook can be used again and again until it expires, and it stops the target from acting against you ([Gamer Empire](https://gamerempire.net/crusader-kings-3-how-to-get-strong-hooks/), *community*).
- The target can refuse blackmail, and then the secret comes out ([Prima Games](https://primagames.com/gaming/crusader-kings-3-intrigue-schemes-hooks-secrets); a reader comment on [Dev Diary #33, "An Offer You Can't Refuse"](https://admin-forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-33-an-offer-you-cant-refuse.1402760/page-5), *community*).
- Secrets are found mostly by the spymaster's Find Secrets task, and a perk lets you fabricate a hook ([PC Gamer](https://www.pcgamer.com/uk/crusader-kings-3-ck3-intrigue-hooks), *community*).

**Memories and casting.**

- Since update 1.7, characters remember births, battles, deaths of close ones and successions. Some memories fade and some stay. Private ones are hidden. An assassin may cite a grievance held against you ([Dev Diary #105](https://forum.paradoxplaza.com/forum/developer-diary/development-diary-105-1-7-bastion-update.1540182/)).
- Story cycles hold state and run updates over years ([Dev Diary #37 thread](https://forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-37-making-mods.1410656/)).
- Hold Court brings 3 petitioners each time, drawn from just under 100 court events ([Dev Diary #72](https://admin-forum.paradoxplaza.com/forum/developer-diary/crusader-kings-3-dev-diary-72-holding-court-at-court-in-the-royal-court-in-a-courtly-fashion.1489882), [PCGamesN](https://www.pcgamesn.com/crusader-kings-3/court-events)). People come to you.

**Opinion breakdown.** CK3 shows an opinion as a list of modifiers, each with its value and how long it lasts. **Unverified**: I could not reach the documentation this session. Ardan already does exactly this for realms, which makes its absence for people stranger (section 3).

**Lesson for Ardan.**

- **A secret is about someone.** Ardan's secret is a bare counter, `pc.flags.secrets`, with no owner. So its blackmail event (`fl_sc_blackmail`) has to invent "a lord with a past" to blackmail. Secrets need an owner and a kind, and they should become hooks.
- **Ardan's favours are already weak hooks.** Each person can owe you 0 to 3, spent on a loan, a letter, an introduction, a good word, or a stand against your enemy. Add strong hooks from criminal secrets, and let a strong hook block that person's hostile moves.
- **Murder in Ardan is one click and one roll.** CK3 makes it a plan that runs for months, with helpers and a monthly chance of discovery. That is where the stories come from. Do the same, in both directions.
- **Reuse the realm ledger.** Realms already keep 26 kinds of dated memory with half-lives (`A.remember`, `A.DMEM`, `A.memYear`) and show them in a tooltip (`A.opinionParts`). People get none of it.

### RimWorld: everyone talks to everyone, and opinion is a sum of memories

**Mechanism.**

- Colonists start social interactions on their own when they are near each other. Whether an exchange goes well is random, weighted by how compatible the two are ([Social](https://rimworldwiki.com/wiki/Social), [Opinion](https://rimworldwiki.com/wiki/Opinion), *community*).
- **Most exchanges are tiny.** Selection weights: chitchat 1, deep talk 0.075, slight 0.02 ([Social](https://rimworldwiki.com/wiki/Social), *community*). A slight costs −5 opinion and an insult −15, each for 20 days ([Social](https://rimworldwiki.com/wiki/Social), *community, one source*).
- **The rare ones escalate.** An insult has a 4% chance to start a social fight and a slight 0.5%. Drink, hunger and aggressive genes raise it ([Social](https://rimworldwiki.com/wiki/Social), *community*).
- Opinion, like mood, is built from "thoughts", each with a cause and a duration ([Thoughts](https://rimworldwiki.com/wiki/Thoughts), *community*).
- Romance needs a minimum opinion first ([Romance](https://rimworldwiki.com/wiki/Romance), *community*).
- **Design intent.** Tynan Sylvester calls RimWorld "not a game, but a story generator". The simulation supplies events and the player supplies the meaning ([GDC 2017 talk](https://www.gdcvault.com/play/1024232/-RimWorld-Contrarian-Ridiculous-and), [slides](https://media.gdcvault.com/gdc2017/Presentations/Sylvester_Tynan_RimWorld_Contrarian_Ridiculous.pdf), [The Simulation Dream](https://tynansylvester.com/2013/06/the-simulation-dream/)).

**Lesson for Ardan.**

- **The social graph is the simulation, not just the player's row of it.** A fresh Ardan world has 99 people and **4** non-family bonds between NPCs. Nobody near you knows anybody else.
- **Cheap warmth should be small and should fade.** In Ardan, three free buttons ("Spend time together", "Have a long talk", "Compliment") take a stranger to sworn-sibling level in a median **4 years, at zero initiative** (section 3). RimWorld's social memories last weeks: a slight or an insult, 20 days.
- **Thresholds turn numbers into stories.** Insult, then fight. Ardan has exactly one such link: an insult starts a fight 25% of the time (55% if they are wrathful). It needs dozens.

### Dwarf Fortress: historical figures, and a record of who did what

**Mechanism.**

- Only a share of the population is tracked in full, as "historical figures". The rest is kept abstract to save memory ([DF wiki, Historical figure](https://dwarffortresswiki.org/index.php/DF2014:Historical_figure), *community*).
- Legends record what those figures did, by date. History can stay hidden until the player finds it ([DF wiki, Legend](https://dwarffortresswiki.org/index.php/DF2014:Legend), *community*).
- Dwarves form friendships and grudges with each other through repeated contact, and grudges can turn into fights. **Unverified**: the relationship page was out of reach.

**Lesson for Ardan.** Decide who counts as a historical figure: the 573 written cast members plus anyone the player has bonded with. Give those people full memories and a dated record, and keep everyone else thin. Ardan already splits written cast from generated people. It does not give the written ones a record, and a typical world brings only 79 of the 573 to life.

### The Sims: relationship bars, wants and fears

**Sourced.** Each need makes a timed moodlet with a named cause, and the emotion with the highest total weight wins ([Sims Wiki, Motive](https://sims.fandom.com/wiki/Motive), [Emotion](https://sims.fandom.com/wiki/Emotion), *community*). Lifestyles and character values grow from repeated behaviour ([Carl's guide, Lifestyles](https://www.carls-sims-4-guide.com/expansionpacks/snowyescape/lifestyles.php), [SimsCommunity, character values](https://simscommunity.info/2017/05/23/learn-about-character-values-the-sims-4-parenthood-blog-post/), *community*).

**Unverified.**

- In The Sims 4, every pair of Sims has two separate tracks, friendship and romance, each from −100 to +100, and both decay when the Sims don't meet.
- In The Sims 2, each Sim showed a short list of current wants and fears tied to their aspiration. Meeting a want or suffering a fear moved a meter, and the panel told the player exactly what this person hoped for and dreaded.

**Lesson for Ardan.**

- **One number is not enough.** Ardan keeps one number per side of a bond. Two axes (warmth and trust) would allow a lover you cannot trust, or a rival you respect.
- **Ardan already wrote the Sims 2 panel.** All 573 cast members have a written want and a written fear: "She wants her son Tarn to stay across the Gordush and not raid before Return Day, so he lives to see summer." The engine copies the want onto the person and shows it as one line of text, 60% of the time, when you pick "Have a long talk". It never copies the fear at all. Nothing decides anything from either.

### Middle-earth: Shadow of Mordor: the Nemesis system

**Unverified (no source reachable this session).** Orc captains sit in a visible hierarchy under warchiefs. A captain who kills you is promoted and grows stronger. One who survives a fight with you comes back scarred and opens with a line about how you last met. While you are away or dead, captains fight duels, hold feasts and ambush each other, so the hierarchy changes without you. Warner Bros. holds a US patent on the system, granted in 2021.

**Lesson for Ardan.**

- **An enemy who survives should come back changed, and say so.** In Ardan, the NPC in a duel yields at 30% health ("Road to 100"), and walks away with nothing on record except an opinion number.
- **Your defeats should feed someone's rise.** The rival who beat you, or whose scheme ruined you, should climb.
- **Enemies should act on each other,** so the world moves while you are busy.

### Wildermyth: relationships as written arcs

**Mechanism.**

- Events are cast by targeting criteria: personality stats, hooks and relationships ([Wildermyth wiki, Event](https://wildermyth.com/wiki/Event), *community*). The hero with the highest matching stat usually gets the speaking role ([Steam discussion](https://steamcommunity.com/app/763890/discussions/0/4241812037674029611/), *community*).
- Relationship levels unlock scenes. Hook quests open once a relationship reaches 3 or more for the first two and 4 or more for the third ([Event Types](https://wildermyth.com/wiki/Event_Types), *community*).
- History lines record what happened to each hero, and good ones are specific ([History](https://wildermyth.com/wiki/History), *community*; [GDC 2022 slides](https://media.gdcvault.com/GDC+2022/Speaker+Slides/GettingPlayersEmotionally_Austin_Nate.pdf)).
- The designers name the failures to avoid: "breach of trust, acting out of character, or rage quits" ([GDC 2022 talk](https://www.gdcvault.com/play/1027614/Independent-Games-Summit-Session-Getting)).
- The team tests a feature with one question: "does it lead to more iconic heroes?" ([GameBanshee interview](https://gamebanshee.com/xykr3)).

**Lesson for Ardan.** A bond should be a ladder with written rungs, not a number with a label. A friend at +60 for three years, a rival after a public shame, a lover after a courtship: each rung opens a short written arc. Each arc ends in a lasting change: an oath, a betrayal, a child, a death. Cast from the player's own circle, and keep people in character. A "kind" NPC should not slander you because a dice roll said so.

## 3. Backtest

### What I measured, and how

- **Builds.** `node tools/build.mjs --out=<scratch>/fixes.html --only=none` gives the fix layer (29 patches). A second private build adds the in-progress `21-npc-initiative` feature, unchanged (`--only=npc-initiative`).
- **League.** 32 bot lives with the bench's own bot (`B.life`): 8 starts × 2 personalities (careful and reckless), engaged and passive alternating, up to 70 years each, 1,396 life-years in all. I wrapped `A.advance`, `A.doActivity`, `A.eventChoose` and `A.choiceChoose` to snapshot both sides of every player bond before and after, and `A.headReady` to sort each prompt.
  - A prompt counts as **NPC-started** if it is one of the engine's own NPC hooks, or carries `npc` or `ctx.npcMove`. The hooks are `bd_boss_*` (your superior), `bd_enemy_strikes` and `bd_rival_scheme` (a foe at −55 or worse), and "A favor called in" (someone you owe).
  - **Opinion change** is the sum of absolute changes on both sides of every bond that existed before and after a step.
- **Two sides of a bond.** 6 lives of an engaged careful bot for 35 years. Then I compared the number the person view shows with the NPC's actual opinion of the player.
- **Cheap bonds.** 20 seeds. A 22-year-old meets a stranger at 0 and clicks "Spend time together", "Have a long talk" and "Compliment" twice each a year (the yearly limit).
- **Static.** The event library (3,199 events) and the engine, read with `tools/show.mjs`.

### What a bond is in Ardan today

A bond is `{type, op, since, seen}` on each side. There are 26 named types. `A.addOp(a, b, d)` moves a's opinion of b by d and b's of a by 0.8 d.

**The engine does more on its own than the reviews say.** "NPCs never act first" is not quite true. `A.obligationsYear` has four hard-wired hooks:

- your superior opens one of 4 events, 18% a year;
- someone you owe calls in the favour, 22% a year;
- a rival or enemy at −55 or worse strikes or schemes, 10% a year;
- a sworn sibling may come to owe you a favour, 12% a year.

None of them is tagged `npc`, so the bench counts **0** NPC moves. My count is **0.8 per decade**. But these are timers, not wants. The superior's event, the enemy's "move" and the favour asked are each picked by `A.pick` from a short list. Nothing reads what the NPC wants.

**Other things already right:**

- Bonds fade without contact, and neglect speeds up. A close bond left alone for 2 years loses 6 points a year for each idle year past the first (3 for a best friend), then slips to "an old friend". Lukewarm acquaintances are forgotten after 3 quiet years. Foes soften by 4 a year for each quiet year past the first.
- The number of close bonds is capped at 4, plus persuasion ÷ 30, plus etiquette ÷ 40, plus 2 if gregarious or friendly, minus 1 if shy.
- Grief has weight: a child's death costs 35 happiness, a spouse's 30.

That is RimWorld's decay and a Dunbar cap. Keep both.

### Findings

1. **The number on screen is not the number the game uses.** The person view labels `pc.rel[t.id].op` "Opinion of you". That is the player's own side of the bond. The NPC's real opinion, `t.rel[pc.id].op`, is the one nearly every engine check reads (superior merit, promotion, dismissal, letters). Over 74 bonds in 6 lives:
   - the two differed by a median of **9 points**, by 10 or more in **49%** of bonds, by 20 or more in **22%**, and by up to **41**;
   - in **16%**, the two fall on different sides of the +50 and −25 lines where your superior starts to help or hurt you.
   
   The superior card and the ruler card read the right side, so the same person can show two different numbers on two screens. The code mixes the sides too. Of its 19 calls to `A.opinion`, 17 use the NPC's side. The other 2, a petition to the crown and a request for a council seat, read how much *you* like the ruler. The People-screen requests do the same: asking for money, flirting, courting and proposing all roll on `r.op`, your own side. Whether she accepts your proposal depends on how much you like her.
2. **Opinion matters only upward.** All 19 of those calls are about your superior, your ruler, a letter's weight or an oath. Only **4** of 3,199 event conditions read an opinion at all. Outside the chain of command, opinion only shifts the odds of your own requests. A friend at +90 never does anything for you unasked. The one exception: a foe at −55 or worse gets a 10% yearly roll.
3. **Affection is free.** Six free clicks a year take a stranger to sworn-sibling level (their opinion 70+, yours 75+) in a median **4 years**, at most 5, in **20 of 20** seeds, for **0** initiative. While you keep clicking, nothing fades except a drift of 0 to 2 points a year.
4. **No reasons, anywhere.** A bond keeps a number and, sometimes, a one-line `why` written when a friendship lapses. No change is recorded with its cause. Realms have the ledger; people do not.
5. **Killing someone changes nothing for their family.** `A.kill` clears a spouse link, passes a crown and passes a house. It touches no one's opinion. Murder from the People screen is one roll: 25% plus (intrigue + stealth + intellect ÷ 2 − guard) ÷ 200, held between 3% and 85%. The guard is 30 for a commoner and 180 for a ruler. You lose 20 honor either way. You are caught 25% of the time, less with skill and more if the victim rules.
6. **Secrets have no owner.** About 20 event effects, and one activity, add to a single counter. Only **2** events read it: one choice requirement, and `fl_sc_blackmail`, which has to invent its victim.
7. **The cast's wants and fears are written and unused.** All 573 cast members have both. A fresh world brings 79 of them to life. A bot life meets a median of **3**, and 4 of 32 lives meet none. The engine reads the want only as flavour text in "Have a long talk", and never reads the fear.
8. **People rarely come back.** Events about a named person fire about 19 times a decade, but only **36%** of them are about someone the player knew before that year. In lives of 40 years or more, a median of 90 different people are the subject of an event, and **79%** of them appear once and never again. A median of 9 appear three times or more. The person who comes back most is your boss: 103 of the 116 NPC-started prompts (**89%**) are the superior's yearly hook. In 14 of 32 lives no NPC started anything at all, including 3 of the 17 lives that ran 40 years or more.
9. **NPCs have no social life with each other.** A fresh world of 99 people holds 4 non-family bonds between NPCs. At the end of all 32 bot lives, the people each player knew held **0** non-family bonds with each other. Across 1,396 life-years, no NPC's opinion of another NPC changed once: 0 calls to `A.addOp` between two NPCs. Friend circles, cliques and "a friend of my enemy" (plan step 6) cannot exist yet, because the web they need is empty.
10. **Who moves opinion.** Of all the opinion change on the player's bonds in 32 lives, **49%** came from events (mostly the player's own choices in them), **47%** from the yearly tick (decay, drift and the superior's verdict on your work), and **3.7%** from NPC-started prompts. The plan's target is 30%. New bonds tell the same story: 1,013 of 1,295 came from events, 262 from the tick and **20** from NPC moves, while 968 bonds were lost to neglect. One caveat: the bot never uses the People screen. A sociable player's clicks would push the NPC share lower still.
11. **The in-progress fix.** `21-npc-initiative` is built but marked `.wip`. I built it privately, unchanged, as it stood that hour (another agent is still editing it), and ran the first 16 lives of the same league on it (645 life-years; lives diverge after the first move, so their lengths differ). Against the same 16 seeds without it:

   - NPC-started events rise from 0.8 to **9.4** a decade: 5.2 first moves plus follow-ups. Lives with no NPC move fall from 6 of 16 to 1.
   - The NPC share of opinion change rises from 3.0% to **24%**. That is still short of the plan's 30%.
   - Events about someone already known rise from 36% to **56%**.
   - What it does not change: NPC-to-NPC bonds stay at 0, the cast met stays at a median of 2 or 3, and no opinion carries a reason (its bond history is text lines, not a ledger the number is built from).
   - The moves are mostly kind. Invitations alone are 20% of first moves, and only about 1 in 10 is hostile (slander, theft, a challenge, a secret, a foe's scheme). CK3's courts plot against you. Ardan's new NPCs mostly ask you to dinner.

   It is the right first step and the cheapest big gain on this list (section 5, row 1). It is not the whole aspect.

### The backtest table

| # | Metric | Reference game value or practice | Ardan today | Target for a 10 | How to measure in Ardan |
| --- | --- | --- | --- | --- | --- |
| R1 | NPC-started moves toward the player, per decade | CK3: schemes tick every month; Hold Court brings 3 petitioners a session. Plan budget: 1 to 3 a year | Bench: **0** (nothing is tagged). Measured: **0.8**, from 4 timers; 89% are the superior's hook. 14 of 32 lives get none | 5 to 15 first moves a decade (follow-ups on top), from ≥ 3 people, none over 40% | Bot (bench league, once the hooks are tagged) |
| R2 | Share of opinion change caused by NPC actions | Plan target 30%. RimWorld: opinion is built from social thoughts, made by what others say and do to you | **3.7%** (events 49%, yearly tick 47%). With `21-npc-initiative`: 24% | ≥ 30% | Bot (wrap the four entry points, as this doc did) |
| R3 | The number shown is the number used | Ardan's own ruler and superior cards already show the opinion the engine reads. CK3 does the same (**unverified**) | Person view shows the player's side: median gap **9**, ≥ 10 in **49%** of bonds, ≥ 20 in 22%, max 41; 16% sit across a +50/−25 threshold. 2 of 19 `A.opinion` calls, and the money, flirt, courting and proposal rolls, read the player's side | 0 mismatches | Browser test |
| R4 | Opinion explained by dated reasons | RimWorld: thoughts, each with a cause and a duration. CK3: memories that fade or stay (Dev Diary #105). Ardan's realms: 26 kinds with half-lives | **0%** for people. A lapsed friendship gets one `why` line | 100% of changes ≥ 5 points carry a named, dated reason; the list sums to the number | Bot + browser test |
| R5 | Opinion has effects outside the chain of command | CK3: who will join a scheme depends on how they regard the target. RimWorld: low opinion raises the insult chance; romance needs a minimum opinion | 19 `A.opinion` calls, all superior, ruler, letter or oath. **4** of 3,199 event conditions read opinion | Every NPC move's chance reads opinion; ≥ 50 event conditions read it | Static analysis |
| R6 | Cost of a sworn-level bond | RimWorld: chitchat is by far the commonest exchange (weight 1, deep talk 0.075), and social memories such as a slight last 20 days | **4 years, 0 initiative**, 6 free clicks a year, 20 of 20 seeds | ≥ 10 years by free clicks alone; real closeness comes from shared events | Bot script (section 3 method) |
| R7 | Bonds between NPCs | RimWorld: every pair of colonists who meet. Dwarf Fortress: friendships and grudges between dwarves (**unverified**) | **4** non-family bonds among 99 people at world start; **0** among the people the player knows at the end of 32 lives; 0 NPC-to-NPC opinion changes in 1,396 life-years | ≥ 2 non-family bonds per known adult; ≥ 5 visible NPC-to-NPC changes a decade | Bot |
| R8 | People who come back | Wildermyth casts events from the party by stats, hooks and relationships | 79% of people who are the subject of an event appear once; median 9 appear 3+ times in a 40+ year life | ≥ 4 people in ≥ 5 events each per 60-year life | Bot (count `ctx.pid` per life) |
| R9 | Events about a person cast someone already known | Wildermyth and King of Dragon Pass cast from your own people | **36%**. With `21-npc-initiative`: 56% | ≥ 60% | Bot |
| R10 | The written cast is used | The Sims 2 showed each Sim's wants and fears (**unverified**) | 573 of 573 have a want and a fear. 79 exist in a fresh world; a life meets a median of **3**. The want is flavour text; the fear is never copied to the person | 573 structured goals; ≥ 3 cast members per life whose goal drives ≥ 1 move | Static analysis + bot |
| R11 | Secrets belong to someone | CK3: shunned or criminal secrets about a named character become weak or strong hooks | One counter; **2** events read it; the blackmail event invents its victim | Secrets are objects with an owner; ≥ 20 events read one about a named person | Static analysis |
| R12 | Leverage between people | CK3: weak hooks (one use) and strong hooks (reusable, block hostile acts) | Favours, 0 to 3 per person, with 5 uses (loan, letter, introduction, good word, stand against a foe). Owed favours are called in, 22% a year. A good base | Strong hooks from criminal secrets block that person's hostile moves | Browser test |
| R13 | Plots with progress and discovery | CK3: monthly progress, power against resistance, agents, discovery on failure | Murder is **one roll** (3% to 85%). No NPC plots; a foe at ≤ −55 gets a 10% yearly "move" picked at random from 5 lines | Plans run for months, both ways; 0.3 to 1.5 NPC plots against the player a decade; a skilled player uncovers most before they land | Bot + test |
| R14 | Kin react to a killing | CK3: an assassin may cite a grievance held against you (Dev Diary #105) | **0** opinion change for anyone when the player kills | 100% of close kin get a dated grudge; ≥ 30% act on it within 10 years | Test + bot |
| R15 | Bonds fade, and there is a limit | RimWorld: a slight or an insult lasts 20 days | Present: neglect costs more each idle year; close bonds capped at 4, plus up to about 7 more from persuasion, etiquette and traits | Keep, and show the fade on the person page | Bot (exists) |
| R16 | Meeting someone is a scene | Plan step 7 | One roll: 60% + persuasion ÷ 250 + etiquette ÷ 300 − 8% per class step up + (fame − 30) ÷ 300, between 15% and 95%; 1 initiative | 2 or 3 choices that show who they are | Browser test + lint |
| R17 | Loss is part of the story | RimWorld: "the mechanics must include loss and recovery" (GDC 2017) | 2.1 known people die per decade; grief costs up to 35 happiness. Whether later events recall the dead: **unmeasured** | Every death of a close bond leaves a memory that ≥ 1 later event reads | Bot + static analysis |
| R18 | Players remember a person | Plan gate | **Unmeasured** (0 playtests) | 7 of 10 new players name an NPC they loved or hated, and why | Human playtest |

## 4. North star

With unlimited time, money and people, Ardan's people become **a court that runs without you**. Around each life live about 150 historical figures. Each has a goal, a fear, a ledger of what others did to them, and a move to make every month.

**Who is simulated.**

- **Historical figures, about 150 per life:** every written cast member within reach, everyone the player has bonded with, and their close kin. They get the full simulation every month.
- **Everyone else stays thin**, as in Dwarf Fortress, until the player bonds with them. Then they are promoted.

**Screens.**

1. **The People tab is a web.** The player sits in the centre, in rings: family, close, work or war, court, foes. Lines between NPCs show their bonds to each other: colour for warmth, a dashed line for a secret. Hover a line to read it: "Ser Tarn hates Odo: Odo took his post, 1109." Filters: who wants something from me, who is plotting (that I know of), who owes me, who I owe.
2. **The person page.**
   - A portrait that shows mood, age and scars.
   - Two bars, both labelled: "What they think of you" and "What you think of them". Each opens into dated reasons with their fade: "Saved his son, 1112: +30, fading"; "You killed his father, 1115: −60, never fades".
   - Their want and fear, hidden until a long talk, a letter or a spy reveals them.
   - Their circle: their 3 closest people and their 3 worst enemies.
   - The secrets you hold on them and the hooks they hold on you.
   - 8 to 12 history lines in the chronicle's voice.
3. **Schemes.** Your plans and the plans you have uncovered. Each shows its target, helpers, months of progress and the risk of discovery, and every number lists its reasons.
4. **Letters.** People reach you by letter as often as by event: requests, offers, threats, gossip, a mother's news. A letter can be answered, ignored, burned or shown to someone else.

**Systems.**

- **A monthly step.** Each historical figure takes at most one step toward its goal. Toward the player that means 1 to 3 moves a year, the plan's budget. Among themselves, 20 or more changes a decade reach the player as news.
- **The social web.** Small RimWorld-style exchanges between people who share a place each month (a household, a company, a guild, a court), weighted by compatibility: traits, faith, class, shared work. Crossing a line makes a friend, rival, lover or enemy. NPCs marry, feud and fall out with each other.
- **Opinion as a ledger.** Opinion is the sum of dated memories, as CK3 does and Ardan's own realms already do. About 40 memory kinds for people, each with a half-life. Blood never fades: kin take on a killing at half strength, for two generations.
- **Two axes.** Warmth and trust, so a charming liar or a loyal grump can exist.
- **Schemes both ways.** Eight kinds: befriend, sway, court, slander, steal, blackmail, ruin, murder. Monthly progress is power against resistance. Helpers come from people who dislike the target. There is a chance of discovery every month, and discovery is an event, not a log line.
- **Secrets as objects.** About 60 kinds tied to the cast, each with an owner, a kind (shunned or criminal) and witnesses. They become weak or strong hooks. A strong hook blocks hostile moves.
- **The nemesis loop.** A foe who survives you comes back marked by a scar, a new rank or a title, and names the last meeting in their first line. Your defeats promote them.
- **Bond arcs.** 80 written arcs (friend 20, rival 20, lover 15, mentor 10, kin 15), 3 to 6 stages each. Each opens at a rung and ends in a lasting change.
- **Voice.** Every trait has its own lines. About 3,000 short reactive lines quote the ledger: "Not since the wedding at Millrun, you mean."
- **The chronicle.** Bonds feed the end-of-life book. It gets a chapter on the people in your life, rumours included.

**Numbers that define done.**

- 5 to 15 NPC-started first moves toward you per decade (follow-ups on top), from at least 3 different people, with no one person over 40%.
- 30 to 50% of all opinion change comes from what NPCs did.
- 0 opinion points without a named reason. The number shown is the number used.
- In a median 60-year life, 4 or more people appear in at least 5 events each.
- 60% or more of events about a person cast someone you already knew.
- Every known NPC has at least 2 bonds with others in your circle.
- 7 of 10 new players name an NPC they loved or hated and say why. 5 of 10 name two.

**What it takes.**

- Two systems programmers for a year. This needs the source; the web and the ledger touch every caller of `A.addOp`.
- Two writers for 18 months: 80 arcs, about 600 events and 3,000 reactive lines.
- One UI designer for the web and the person page.
- An illustrator for expressive, age-true portraits, the same hire the Visual art plan needs.
- Three rounds of 12-player tests.

## 5. What to build now

Ranked by score gain per unit of effort. Row 3 gains nothing alone but comes early, because the rows after it are measured through it. "Here" means it can be built in this repo as a feature folder (`patches.mjs`, `*.core.js`, `*.events.js`, `test.mjs`) per CLAUDE.md. Effort: S is up to 2 days, M up to 2 weeks, L up to 2 months, XL more.

The gains don't add up in a straight line. With rows 1 to 13 built and green, I expect Relationships to reach about **7**, which is also the rubric's cap without players. A 10 needs row 14 (real players) and row 15 (the two-axis bond and the new screens, with portraits that show feeling from the Visual art plan).

| # | Feature | Effort | Built here? | Gain | Acceptance test (must be able to fail) |
| --- | --- | --- | --- | --- | --- |
| 1 | **Integrate `21-npc-initiative`, then tighten it.** It is built and marked `.wip`: a monthly desire score for 14 kinds of move, a budget of 1.5 a year, a cap of 3, cooldowns, a bond history, and the cast's wants and fears read through keyword patterns. Tighten: no single person over 40% of a life's moves, and each person's moves must fit their traits (a kind person does not slander) | M | Yes: it already is a feature folder | +1.5 | Bot, 32 lives: 3 to 20 NPC-started moves per decade; ≥ 2 distinct movers per decade; in lives with ≥ 5 moves, no person over 40%; ≥ 30% of opinion change from NPC moves; 0 page errors. Bot: 0 hostile moves (slander, theft, a challenge) start from a person with the `kind`, `honest` or `loyal` trait. Its own `test.mjs` passes. Measured on a private build with it (16 lives): 9.4 NPC-started events a decade and 24% of opinion change. It passes the count and fails the share |
| 2 | **Show the real opinion, both ways.** The person view's "Opinion of you" reads `t.rel[pc.id].op`. Add a second row, "Your opinion of them", from `pc.rel[t.id].op`. Point the petition and the council-seat roll at the ruler's side, `A.opinion(ru, pc)`, and the money, flirt, courting and proposal rolls at the NPC's side | S | Yes: about 7 small patches | +0.3 | Browser test: in a 35-year life, open the person view for every living person the player knows. "Opinion of you" equals `Math.round(t.rel[pc.id].op)` for 100% of them. Today it differs in 49% of bonds (by ≥ 10). Static: none of the money, flirt, courting or proposal success rolls in `A.INT_FN` reads `r.op` |
| 3 | **Count what already exists.** Tag `bd_boss_*`, `bd_enemy_strikes` and `bd_rival_scheme` with `npc: true`, and mark the "A favor called in" choice `ctx.npcMove`. Add this doc's two metrics to `bench/run.mjs`: share of opinion change by source, and recurring cast | S | Yes, with the `bench/` owner | 0 alone; keeps the rest honest | `bench/run.mjs` on the fixes build reports NPC moves per decade within 20% of this doc's 0.8 (today it reports 0) and an NPC share of opinion change within 3 points of 3.7% |
| 4 | **Opinion with reasons.** Give people the realm ledger. `pc.rel[id].mem = [{k, v, y}]` with half-lives. `A.addOp` takes a reason key, and the callers pass one: interactions, obligations, and events, where a `them: {op}` effect uses the event's title. The person view lists the reasons. Old saves start with an empty ledger | M | Yes: `*.core.js` + about 6 patches | +1.0 | Bot, 32 lives: ≥ 95% of absolute opinion change on player bonds carries a named reason. Browser: the reasons shown sum to the shown value ±2. A save from before the feature loads and plays 5 years. Today: 0% named |
| 5 | **Make affection cost something.** Repeating a free interaction on the same person in the same year gives half, then a quarter. Warm memories from talk, time and compliments fade with a half-life of 2 years (needs row 4). The NPC's traits scale what they give back: proud and shy people warm slower | S | Yes: patches on `A.INT_FN` + `*.core.js` | +0.4 | Same script as section 3 (20 seeds, 6 free clicks a year): median years to their opinion 70 and yours 75 ≥ 10, or never. Today: 4 |
| 6 | **Secrets with owners, and hooks.** `pc.secrets = [{about, kind: 'shunned' or 'criminal', y, witnesses}]`. Keep `pc.flags.secrets` as a derived count so the 2 old readers still work. Blackmail over a criminal secret makes a strong hook that blocks that person's hostile moves until it expires | M | Yes: `*.core.js` + `*.events.js` + patches to the 2 readers | +0.7 | Static: 0 events invent a stranger to be the subject of a secret (today: `fl_sc_blackmail` does); ≥ 20 events read a secret about a named person. Test: with a strong hook held, that person starts 0 hostile moves in 200 forced months |
| 7 | **Kin remember.** When the player kills, maims, jails, ruins or cuckolds someone, their parents, children, spouse and siblings get a memory that never fades ("killed my father, 1115", −60) and an enemy bond. Six revenge events read it, from a cold shoulder to a knife | M | Yes: `*.core.js` hook on the player's kill paths + `*.events.js` | +0.6 | Test: a forced-success murder on an NPC with a spouse and 2 children leaves all 3 with an enemy bond at ≤ −40 and a dated reason. Bot, 50 seeds: kin start ≥ 1 move against the player within 10 years in ≥ 30%. Today: 0 kin change |
| 8 | **Foes who come back (a small nemesis).** A foe who survives a duel or a scheme against the player gets a mark (a scar, a grudge, a rank), and their next event names the last meeting. A foe who beats the player gains fame and, if they serve, rank | M | Yes: `*.core.js` + `*.events.js` | +0.5 | Test, 100 forced survivals: the foe's next event text names the earlier meeting in 100%. A foe who beats the player gains ≥ 5 fame in ≥ 80% |
| 9 | **Structured goals for the 573.** Hand-tag each want and fear as `{kind, target, place, by}` instead of guessing from keywords, as row 1 does now | M | Yes: data file (content) | +0.4 | Static: 573 of 573 tagged; ≥ 90% of targets resolve to a cast id, a realm or a place. Bot: each 40-year life meets ≥ 3 cast members whose goal drives ≥ 1 move (today: a median of 3 cast members met, 0 goals used) |
| 10 | **Get to know someone in a scene.** Replace the single roll with 12 short scenes keyed to the stranger's strongest trait. Each scene has 2 or 3 choices, reveals one true trait or the cast want, and sets the starting opinion | M | Yes: `*.events.js` + 1 patch on `A.getToKnow` | +0.3 | Lint passes. Browser, 100 calls: 100% open a scene with 2 or 3 choices, and the revealed trait is one the person really has in 100%. A choice that fits the trait starts ≥ 10 points warmer than one that doesn't, on average |
| 11 | **A social web in your circle.** Each month, among the living adults the player knows (at most 40), small exchanges weighted by compatibility (shared traits, faith, class, work). Crossing ±40 makes an NPC-to-NPC friend or rival, with a news line if the player knows both. A friend of your enemy starts 10 cooler toward you (plan step 6) | L | Yes: `*.core.js` | +1.0 | Bot: after 20 years, the median known adult has ≥ 2 non-family bonds with others in the circle (today: 0). ≥ 5 NPC-to-NPC news lines per decade. Bench perf: month cost rises < 2 ms. The replay test still passes |
| 12 | **Schemes, both ways.** Murder, slander, sway and ruin become plans with monthly progress (power against resistance), helpers recruited from people who dislike the target, and a monthly chance of discovery. NPCs plan against the player the same way. Discovery is an event | L | Yes: `*.core.js` + `*.events.js` + a patch on `A.INT_FN.murder` | +1.0 | Murder from the People screen never resolves in the month it starts. Bot, 64 lives: NPC hostile schemes against the player 0.3 to 1.5 per decade; with intrigue ≥ 40 the player uncovers ≥ 50% of them before they land, at intrigue 0 at most 20% |
| 13 | **Bond arcs.** 30 written arcs of 3 to 5 stages (friend 8, rival 8, lover 6, mentor 4, kin 4), each opened by a rung: +60 held for 3 years, −60 after a public shame, lovers after courtship. Every arc ends in a lasting change | L | Yes: `*.events.js` (content) | +0.8 | Bot, 64 lives: ≥ 60% of lives over 30 years reach stage 2 of some arc. Static: 100% of final stages change a bond type, swear an oath, kill, add a child, a title or a trait |
| 14 | **The people test.** 10 new players, 60 minutes each. Afterwards: "Name someone in your life you loved or hated, and why." | S per round | **Needs people** | +1.0 (and gates the 10) | 7 of 10 name a person and a reason that matches the game's record. 0 playtests so far |
| 15 | **The two-axis bond, a person-page redesign and the web view.** Warmth and trust as separate numbers, the People tab as a web, portraits that show feeling | XL | **Needs source and art** | +0.8 | 7 of 10 players read a bond correctly from the web view alone in a timed task; a WCAG 2.1 AA audit of the new screens finds 0 issues |

## 6. Sources

All external pages below were read as search-engine excerpts, or come from the sibling benchmark docs, which were gathered the same way. None could be opened directly from this sandbox.

**Crusader Kings III**
- GameWatcher, schemes, secrets, hooks and intrigue *(community)*: https://www.gamewatcher.com/crusader-kings-3-schemes-secrets-hooks-intrigue
- TheGamer, how schemes work *(community)*: https://www.thegamer.com/crusader-kings-3-how-schemes-work-explained/
- Guild Order wiki, schemes and intrigue *(community)*: https://guildorder.com/games/ck3/wiki/schemes-and-intrigue
- Guild Order guide, choosing the right plot *(community)*: https://guildorder.com/games/ck3/guides/schemes-choosing-the-right-plot
- Steam discussions on schemes and agents *(community)*: https://steamcommunity.com/app/1158310/discussions/0/2994291378925426637 · https://steamcommunity.com/app/1158310/discussions/0/3824160148617255746 · https://steamcommunity.com/workshop/filedetails/discussion/2216659254/603016324809010933
- PC Gamer, intrigue and hooks *(community)*: https://www.pcgamer.com/uk/crusader-kings-3-ck3-intrigue-hooks
- Prima Games, intrigue guide *(community)*: https://primagames.com/gaming/crusader-kings-3-intrigue-schemes-hooks-secrets
- Gamer Empire, strong hooks *(community)*: https://gamerempire.net/crusader-kings-3-how-to-get-strong-hooks/
- Dev Diary #33, "An Offer You Can't Refuse" (reader comments, page 5): https://admin-forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-33-an-offer-you-cant-refuse.1402760/page-5
- Dev Diary #105, 1.7 "Bastion" (memories): https://forum.paradoxplaza.com/forum/developer-diary/development-diary-105-1-7-bastion-update.1540182/
- Dev Diary #37, Making Mods (story cycles): https://forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-37-making-mods.1410656/
- Dev Diary #72, Holding Court: https://admin-forum.paradoxplaza.com/forum/developer-diary/crusader-kings-3-dev-diary-72-holding-court-at-court-in-the-royal-court-in-a-courtly-fashion.1489882 · PCGamesN on court events: https://www.pcgamesn.com/crusader-kings-3/court-events

**RimWorld**
- RimWorld wiki *(community)*: Social https://rimworldwiki.com/wiki/Social · Opinion https://rimworldwiki.com/wiki/Opinion · Romance https://rimworldwiki.com/wiki/Romance · Thoughts https://rimworldwiki.com/wiki/Thoughts
- Tynan Sylvester, "RimWorld: Contrarian, Ridiculous, and Impossible Game Design Methods", GDC 2017: https://www.gdcvault.com/play/1024232/-RimWorld-Contrarian-Ridiculous-and · slides: https://media.gdcvault.com/gdc2017/Presentations/Sylvester_Tynan_RimWorld_Contrarian_Ridiculous.pdf
- Tynan Sylvester, "The Simulation Dream": https://tynansylvester.com/2013/06/the-simulation-dream/

**Dwarf Fortress**
- DF wiki, Historical figure *(community)*: https://dwarffortresswiki.org/index.php/DF2014:Historical_figure
- DF wiki, Legend *(community)*: https://dwarffortresswiki.org/index.php/DF2014:Legend
- Friendships and grudges between dwarves: **unverified**, no page reached

**The Sims**
- Sims Wiki *(community)*: Motive https://sims.fandom.com/wiki/Motive · Emotion https://sims.fandom.com/wiki/Emotion
- Carl's Sims 4 guide, Lifestyles *(community)*: https://www.carls-sims-4-guide.com/expansionpacks/snowyescape/lifestyles.php
- SimsCommunity, character values *(community)*: https://simscommunity.info/2017/05/23/learn-about-character-values-the-sims-4-parenthood-blog-post/
- Sims 4 friendship and romance tracks; Sims 2 wants and fears: **unverified**, no page reached

**Middle-earth: Shadow of Mordor**
- The Nemesis system as described in section 2, including the 2021 patent: **unverified**, no page reached

**Wildermyth**
- Wildermyth wiki *(community)*: Event https://wildermyth.com/wiki/Event · Event Types https://wildermyth.com/wiki/Event_Types · History https://wildermyth.com/wiki/History
- Steam discussion on personality and roles *(community)*: https://steamcommunity.com/app/763890/discussions/0/4241812037674029611/
- Nate Austin, "Getting Players Emotionally Invested in Procedural Characters in Wildermyth", GDC 2022: https://www.gdcvault.com/play/1027614/Independent-Games-Summit-Session-Getting · slides: https://media.gdcvault.com/GDC+2022/Speaker+Slides/GettingPlayersEmotionally_Austin_Nate.pdf
- GameBanshee interview: https://gamebanshee.com/xykr3

**Ardan**
- `docs/plan/Ardan The Road to Ten.md` (Relationships section: steps 1 to 7 and the gate)
- `docs/reviews/Ardan Road to 100.md` and `docs/reviews/Ardan Deep Analysis.md` (strict score 4; "NPCs do nothing first"; 573 cast members with wants and fears; the duel yield at 30%)
- `reports/scorecard.md` (the bench's NPC-move metric reads 0 on the fixes build)
- Engine functions read for this doc: `A.addOp`, `A.link`, `A.opinion`, `A.interactOptions`, `A.INT_FN`, `A.getToKnow`, `A.kill`, `A.obligationsYear`, `A.bondsYear`, `A.familyYear`, `A.bondCap`, `A.favorOptions`, `A.callFavor`, `A.personFromCast`, `A.remember`, `A.DMEM`, `A.opinionParts`, `UI.personModal`
- `features/21-npc-initiative/` (in progress, read and measured, not changed)
