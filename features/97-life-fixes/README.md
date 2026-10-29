# Life fixes

**Aspect:** Events and story, Pacing, UI and UX, Balance (the research report `docs/research/player-complaints.md`, sections 2 to 7 and 10) · **Kind:** systems (seven core files), eight small patches, 24 new events and 18 second tellings, tests

Seven problems a new player meets in a first life, each fixed with a rule a player can say in a sentence, and each measured by a test that fails on a build without this feature.

## 1. Scenes that come back (`a-memory.core.js`, `scenes.events.js`, `npc-variants.events.js`, patches `LF-BOSS-PICK`, `LF-POOL-PICK`, `LF-RULER-PICK`, `LF-GATH-ROLE`, `LF-GATH-SCENES`, `LF-GATH-WANT`)

**Why.** The variety guard (25) keeps the roll from showing an event again within 10 years, and it does. But 33 to 37% of the scenes a life showed had already been shown in that life, and about half after 35. Almost all of them came through doors the roll does not guard:

| Door | What it did |
| --- | --- |
| Job duties (`A.dutyEvent`) | a pool of 1 to 6 scenes per career, 3 years apart: a sailor met the same storm every 3 years |
| Plan breakthroughs (`A.flowEvent`) | 2 scenes for the study plan: "An old scholar" 6 to 11 times a life |
| Council and drill business (`A.councilMonth`, `A.drillMonth`) | pools picked blind, 2 or 3 years apart |
| NPC moves (21, and the kinds 55 and 64 add) | 2 years per kind of move |
| A superior's scenes (`A.obligationsYear`), a ruler's year (`A.rulerYear`) | one of 4, one of 12, picked blind |
| Gatherings | every gathering the realm attends invites you |
| Activities | the festival and courting always queue the same scene, the tavern one of six |

**What it does.**

- **Memory.** `pc.evN` counts how often each event was shown to this person (written when the player answers it). A save without it counts each event in `pc.flags.ev` once.
- **One weight for every chooser.** `A.evVariety` (25) already multiplies the weight of every rolled event, every pool event (through `A.evRecency`) and every NPC move (through 25's wrapper of `A.NPCI.choose`). It is wrapped once more with `LF.weight`, which reads the life's memory and a policy for the kind of scene. The pickers that did not use it (council, drill, superior, ruler) now do, by a patch each.

  | Kind | Rule |
  | --- | --- |
  | Anything the roll picks | a seen event weighs 0.1 per showing: fresh writing first |
  | Job duty, council or drill business | twice a life, 12 years apart |
  | Plan breakthrough | twice a life, 10 years apart |
  | A kind of NPC move | twice a life, 10 years apart |
  | A superior's scene | twice a life, 10 years apart |
  | A scene of a ruler's ordinary year (and any other the world queues, where a picker asks) | three times a life, 5 × n years after the n-th |
  | A scene that tells one fixed story (`LF.STORY`, 38 duty and flow scenes, or `lfOnce: true`) | once a life |

- **The head of the queue.** An NPC move or a scene of a ruler's ordinary year that the policy holds back is dropped when it reaches the head of the queue, as the release already drops one seen in the last 240 days. Never a choice's consequence, a scheduled return, a scene the player asked for with an action, part of a gathering, one its author forced, or a consequence such as a revolt.
- **Refill.** A held-back door does not leave the slot empty. `LF.refill` draws one scene this life has never seen from the monthly roll (`A.rollEventsN`), leaving out scenes that can hurt (81-pacing's `PACE.hurtful`), at most once a month. An NPC move held back spends its budget point on it.
- **Families.** The festival, courting and the tavern get the scene of their family the life has seen least: three new festivals (the hiring fair, the long vigil, fires on the hill) and three new meetings (sheltering from the rain, the last loaf, a partner at the wedding), with the same stakes as the old ones; the tavern's six share one family. Once every scene of a family has been seen, it shows at most once a year (then every two, three...). The activity still does its work, with a line in the story log.
- **Gatherings.** A guest (noble, knight, guard, servant) is asked to the same kind of gathering at most every 6 years (a knight's tourney every 5) and to any gathering at most every 3. A visiting ruler or envoy goes to weddings, coronations, tourneys and summits abroad at most every 4 years, the same kind every 6; an envoy sits at a peace congress or a war council at most every 3, and the crown sends someone else to the rest. Hosts, a ruler at congresses and war councils, and family weddings always ask. A gathering's own scenes prefer the ones this life has not seen, and a frame with only one way on (a guest's opening, the last night) that the life has been through before passes without stopping the clock, with its result in the story log.
- **What the player asks for.** Any other scene an action queues (a pilgrimage's road, a game of dice), once seen, comes again only after 4 × n years; in between the action still does its work, with a line in the story log. The tavern's six scenes and the explorer's five are families like the festival's (at most every 3 × n years once used up), courting every 4 × n. Scenes about a person (getting to know someone), a beast or a gathering are new cases and always come.
- **Standing answers at gatherings.** An invitation to a kind of gathering the player has answered before, in the same role, is answered the same way (go, or send regrets), and its opening takes the same aim when that aim is on offer; the scenes inside are still the player's. Once the life has been through one, later gatherings show one scene fewer (patch `LF-GATH-WANT`).
- **Quiet ways for two forced scenes.** 64-npc-beliefs' "Not as you heard it" and a diplomatic incident each have a path without a scene in their own code (a line of news, the record fixed in the log); when the policy holds the scene back, that path is taken.
- **Second tellings for NPC moves** (`npc-variants.events.js`). A kind of move may reach you twice in a life, ten years apart. The second time it comes in its other telling: 18 kinds (13 of 21's, 4 of 55's, 1 of 64's) have one, with the same choices and consequences as the first, so every follow-up still comes back.
- **New writing for the worst pools.** Five study breakthroughs, each once a life (a disputation, the chained library, a sum drawn in beer, a map that is wrong, a face at the window). Five duties: two for sailors, one each for clerks and courtiers, the guilds and the clergy.
- **Measured.** `LF.share(pc)` is the share of the scenes shown in this life that had been shown before. `LF.caseShare(pc)` counts a scene about another person or thing (`ctx.pid`, a gathering, a custom, an illness) as a new case.

**Measured by** `lfRepeats` (the same three 40-year lives with the feature off and on, in one build: the share must fall to 15% or less, engaged, passive and engaged as the bench league alternates; prompts a year must hold at 6 or more and within 20% of off, since the repeats an engaged bot asks for every month, a repeated gathering's frames and its extra scenes, are what is cut), `lfDoors` (80 months of clergy duties and study breakthroughs: the confession and "An old scholar" at most once; the rules for a duty; every refill a scene never seen) and `lfVariants` (each second telling renders with a real person, keeps to the diet, plays every choice, and backs out only where its first telling does; the queue gives it once the first has been seen). The probe is in the table at the end.

## 2. Hints that follow the life (`b-hints.core.js`)

**Why.** `UI.hintsOn` was `A.S.year < 1105 + 10`. A life begun at birth comes of age in 1121, so the two adult hints ("You have initiative to spend", "Hover or tap your fighting worth") could never show, nor any tab's hint first opened after the age of ten.

**What it does.** Hints no longer read the calendar. Each one already shows once per browser and only when its own condition holds, so each now shows at its first encounter: the adult ones on coming of age, a tab's the first time it is opened. The one hint tied to a date ("The game saves itself every year") comes two years into the life. The setting still turns them all off.

**Measured by** `lfHints`: a life begun at birth in 1105, at 16 in 1121, gets the initiative hint on the Life tab and the People tab's hint. Before, both were off (the year was past 1115).

## 3. A chosen ambition (`c-ambition.core.js`, `ambition.events.js`)

**Why.** The release dropped its ambitions (`A.migrateV10` deletes `p.amb` from saves older than version 11 and nothing set it again). `C.ambition` always said no, and the 30 scenes written for ambitions (26 of them not retired by 58-event-cut), among them `pa_freedom_buy`, `pa_freedom_kind_master`, `pa_expand_petition`, `pa_golden_harvest` and `pa_web_marriage`, could never fire. Restoring it is sound: the migration only touches old saves, and the field is the one the scenes already read.

**What it does.**

- At coming of age, at 35 (`C.ageAdj`, so an elf is asked at 35 in human years) and in the first year of a reign, a scene offers up to three ambitions that fit the life (ranked from its situation, without a draw), and "Take life as it comes". At 35 the old one comes first: hold to it, change it, or let it go.
- 18 ambitions, the keys the `pa_*` scenes read: freedom, wealth, trade, family, renown, faith, scholar, teacher, blade, knight, soldier, explorer, court, throne, and for rulers expand, golden and web.
- Kept as `p.amb = { k, y }`. The Life tab shows it under What now: its name, the next step in words ("Save 60 suns for the price of your freedom; you have 23") and a progress bar.
- The engine notices when it is done, says so, writes a deed and gives a little renown and contentment.

**Measured by** `lfAmbition`: a serf of 16 is asked, chooses "Buy your freedom", `C.ambition(p, 'freedom')` is true, the Life tab shows the next step, a new ruler is asked what the crown is for, and the five scenes (`pa_freedom_buy`, `pa_freedom_kind_master`, `pa_expand_petition`, `pa_golden_harvest`, `pa_web_marriage`) pass their conditions for the lives they were written for. None is retired by 58-event-cut.

## 4. Greyed-out controls say why (`d-reasons.core.js`)

**Why.** On a peasant's Holdings tab 61 controls were disabled and 43 gave no reason (the market's "+1" and "+5", the property "Buy"). The Decisions cards' "Decide", the Path tab's "Apply", the elite orders' "Ask to join" and a realm action were the same.

**What it does.** After every draw, each disabled control without a title gets one, worked out from the rule that disabled it: not enough coin for that many loads or no room to carry them; the decision's missing requirements; applied already this year; the order's missing requirements; the action's own refusal. The title is also the control's accessible description. The pass only reads the game.

**Measured by** `lfDisabled`: a peasant of 20 and a noble of 30, every tab: 147 disabled controls, none without a reason (before: 142, of which 89 had none: the market 50, property "Buy" 20, "Decide" 11, "Apply" 5, "Ask to join" 2, a realm action 1).

## 5. Great works for great fortunes (`e-works.core.js`, `works.events.js`)

**Why.** Late lives pile up 100,000 to 600,000 suns, and the dearest thing on the Decisions tab cost 3,500.

**What it does.** Nine decisions, each with something that lasts, a deed, and five with a scene years later:

| Decision | Price | What lasts | Later |
| --- | --- | --- | --- |
| Endow a chantry | 12,000 | piety each year | |
| Found an almshouse | 20,000 | renown and honour each year | a hard winter |
| Ransom captives | 10,000, every 12 years | honour, piety, the crown's favour | |
| Fit out a ship | 30,000 | about 6% a year; 4% a year the sea takes her | a storm and a refit |
| Raise a company of men | 25,000, then 2,500 a year | renown each year | a war wants them |
| Raise a great hall | 40,000, with a family seat | contentment and renown | |
| Buy a town charter | 50,000, renown 30 | 600 a year of tolls | the first council |
| Endow a college | 60,000 | learning each year, for you and your children | |
| Buy a patent of nobility | 20,000, 60,000, 200,000 | franklin, then knight, then baron, with the rung's income | old blood at the table |

A decision shows once a fortune is a quarter of the way to it, so a poor life's tab is not filled with what it cannot buy.

**Measured by** `lfWorks`: a merchant with 400,000 suns sees all nine (the dearest is now 60,000, a college, and for a knight 200,000, a barony's patent, against 3,500 before); endowing a chantry, fitting out a ship and buying a patent spend 62,000, make the merchant gentry (a franklin), write three deeds, book two scenes, and the chantry's piety comes the next year. A poor peasant sees none.

## 6. The first life is not lost in the cradle (`f-shield.core.js`, patches `LF-FIRST-LIFE`, `LF-FIRST-LIFE-SAYS`)

**Why.** On Hard, the default, one newborn in twenty died before five, before any choice.

**What it does.** The creation screen tells the engine whether this is the first life begun in this browser (`o.firstLife`, from `UI.set.lfLives`), so a replay of the journal does the same. Unless Realism was chosen, the engine spares that person the deaths of early childhood (to 5): no yearly death roll, a fever that runs health to nothing breaks instead, and the world's killing blows pass them by. Choices that kill still kill. Brothers and sisters, NPCs, later lives and heirs keep canon's child mortality. The creation screen says so in one line under the difficulty.

**Measured by** `lfFirstLife`: the shielded toddler's base yearly death chance (`A.deathChance`) is 0 (0.030 for the same child unshielded, before Hard's ×0.18 for children), a fever at 0 health breaks, a sibling and a Realism life are not shielded, and 12 serf newborns on Hard live to five as first lives; the creation screen says it before the first life and not after.

## 7. Costs and stakes on the buttons (`g-stakes.core.js`)

**Why.** "Pay his rent" cost 30 suns and did not say so; "Apologise for the wrong · 49% · risky" did not say what failing costs.

**What it does.** Each choice carries one small line, read from the event as written: what it costs (the coin its effect takes, the treasury it spends, unless the label names a price), and, for a check, what failing brings, from `lose.fx` (death, prison, a wound, hurt, coin, your name, honour, your standing, their regard, the realm's peace). "If it fails: hurt, −5 suns, their regard". Drawing it changes nothing.

**Measured by** `lfStakes`: "Pay his rent" (`fx.coin -30`) shows "Costs 30 suns"; "Apologise for the wrong" (a check whose `lose.fx` takes health, 5 suns and their regard) shows "If it fails: hurt, −5 suns, their regard"; the walk away shows nothing; the state and the random stream are unchanged by the draw.

## Rules kept

- Engine draws only through `A.rand` and its helpers; the views draw nothing and change nothing (`lfStakes`, `lfPureAndOld`).
- New fields tolerate old saves: `pc.evN`, `pc.evC`, `pc.amb`, `pc.lfWorks`, `A.S.lf` and the queue items' `lfFrom` mark are created on first use (`lfPureAndOld` plays a save with all of them removed).
- `LF.OFF = true` switches all of it off, for A/B tests. The life memory (part 1) is also off whenever the variety guard is (25's own A/B test sets `A.evVariety` to null), since it is that guard's whole-life layer.

## Measured

Six bot lives from birth (seeds 101 to 606: peasant, noble and merchant, Hard, random choices, engaged and passive alternating, to 70 years), the research's method, on the full build without and with this feature. Every scene shown is counted, whatever door it came through.

| | Without | With |
| --- | --- | --- |
| Scenes shown | 1,800 | 1,901 |
| Already shown this life | **33.4%** | **14.5%** |
| The same scene about the same person or thing again | 12.8% | 5.0% |
| Age 16 to 34 / 35 to 54 / 55 on | 25.0% / 46.6% / 49.6% | 8.8% / 23.0% / 25.3% |
| Scenes a year / prompts a year (mean of lives) | 6.36 / 6.70 | 7.17 / 7.05 |
| "An old scholar" shown in a life | 4 to 12 | 1 |
| Job duties already seen | 137 of 165 | 6 of 39 |
| NPC moves already seen | 168 of 297 | 18 of 188 |

In the bench league (`bench/run.mjs --only=league --lives=4`, the full tree with and without this feature) prompts a year fall from 10.8 to 8.0 and scenes a year from 9.9 to 7.1, still above the target of 6; the median gap between prompts stays at 30 to 31 days (90th percentile 92 to 111). The memory share of fired events falls from 52.8% to 45.4%, because many of the repeats cut were scenes that read their own earlier flags.

The lives differ (a different random stream gives different lives: three of the six without it died before 28), so the age bands are the fairer comparison. What still repeats: gatherings' frames (the invitation, the opening, the last night: 75 of the 1,901), illness and wound care (22), and a few childhood scenes.

## Limits

- **What still repeats, by id.** A gathering's invitation (a real choice: go or send regrets), a ruler's congresses and war councils, illness and wound care (`bm_ill`, `bm_wound_care`), diplomatic incidents and a scheme that lands. Each is about another gathering, illness or incident; counted as cases, 5% of scenes come back, against 12.8% before.
- **Six second tellings** (`ni_match`, the four of 55-bonds, `nb_praised`) need a history the test characters lack; `lfVariants` checks that they back out exactly where their first tellings do, they use only tokens their first tellings fill, and they show in bot lives.
- **The bench does not count it yet.** `bench/bot.mjs` should count a scene the life has seen before (`seenThisLifePct`, target 15% or less); the change is three lines, outside this feature's folder.
- **The bots never take decisions**, so the great works change nothing in the balance league; they are for players. Peak coin in the league is the same pile it was.
- **Ambitions are not on the endings collection.** A fulfilled ambition writes a deed; 28-endings does not read it yet.


## Cycle 1 text fixes (`h-words.core.js`, patches LF-ONE-SUN, LF-BOSS-NONE, LF-CR-RULER, LF-TIER-GATES, LF-THEM-NAME)

- "Costs 1 suns": `A.coin(1)` is "1 sun".
- "Master your master hands you a task": with no superior, `{bossTitle}` is left unfilled, so the superior scenes are dropped.
- The creation summary's "(King )": the ruler comes from the far lore too, the title follows the ruler's sex, and nothing is printed without a name.
- "Herd-boy" and "Pot-boy", the first ranks of herding and brewing, are "Herd-hand" and "Pot-hand" for either sex.
- Tier leaks (lives B4): a reigning ruler or a general (`A.lfTop`) draws no home-front, harvest-dance or learned-duty scene; the rank-and-file camp scenes stop at rank 3 (`A.lfRank`); the mercenary scenes stop at 55, the road offers at 60 (`A.lfOld`, human years). Tests `lfWordsCycle1`, `lfTierGates`.
- `{them}` names a person in full when someone else the player knows shares the given name (`A.knownName`, 67-memory-weave).

## Cycle 1: the second half of a life (`docs/reviews/cycle-1/lives.md`, I1, I2, I4, I5)

- **Gatherings for rulers and hosts** (patches `LF-GATH-SCENES`, `LF-GATH-CAP`; `A.lfGathPool`, `A.lfGathBargain`). Hosts and rulers were always asked, and each gathering showed three of its scenes, so a 37-year reign saw the toast, the seating, the knife, the spy, the whisper and the gift about 15 times each. Now:
  - A gathering scene this life has seen three times (`LF.GATH_SCENE_CAP`) gives way to an unseen one, or to none: the gathering goes on to its last night, with a line in the log.
  - The closed-door bargain, once seen three times, is settled by your envoys. You get the influence a fair speech wins (4 plus diplomacy over 12), and the log says so.
  - The council's push (`ri_court_push`, 56-realm-inside) now follows the NPC-move rule: twice a life, ten years apart.
- **An ambition after the top** (`c-ambition.core.js`, `ambition.events.js`).
  - A year after an ambition is met, *What now, at the top* (`lfx_amb_top`) offers a new one. It comes at most every eight years, to 70.
  - Four new ambitions are offered first when they fit: hold land of your own (rung 4), be counted among the Legends (worth 118), leave something that lasts (a great work), found a house.
- **What now points at the second half** (`LF.whatMore`, wrapped into `A.whatNow`, pure). It names:
  - the decision you can afford (a great work at twice its price or more, or founding a house when the bars are met);
  - an order that would have you, or would if you were knighted;
  - an enemy in your realm within reach of a scheme.
  "Train in an extra session" is no longer offered once the skill you are training is at 100.
- **Great works that grow with the fortune** (`e-works.core.js`, `works.events.js`). Each costs a share of what you hold, between a floor and a ceiling, gives more the more it costs, and opens its own scene later:

  | Decision | Price | Later |
  | --- | --- | --- |
  | Take an artist under your patronage | 8% of your fortune, 10,000 to 150,000, every 15 years | the unveiling (`lfx_wk_patron_work`) |
  | Dower a child richly | 12%, 8,000 to 200,000, for an unmarried child of 14 to 30 | horses in the yard (`lfx_wk_dowry_suitors`) |
  | Build your house a seat | 20%, 80,000 to 400,000, with a house of your own or a title | the first feast (`lfx_wk_seat_feast`) |
  | Found a free school | 5%, 15,000 to 60,000 | a letter from a pupil (`lfx_wk_school_pupil`) |

  A work's `run` now runs before the coin is taken and can refuse (a patent with nothing left to buy no longer charges).

**Measured by** `lfGathCap` (three scenes, one seen three times: two left; all seen three times: none, and the bargain is settled off stage) and `lfAfterTheTop` (a met ambition is followed two years on by one of the late ones; What now names the house or a work, and drawing it changes nothing; patronage for a fortune of 300,000 costs 24,000).

## Cycle 2 (`docs/reviews/cycle-2/lives.md` F2, F3; `design.md` A2, D4)

- **Tier gates for the whole top of the ladder.**
  - `A.lfTop` now also counts a council seat, a lord of rung 4 or more, and a past rank of 6 or more (`p.veteran`). Before, it held only a ruler and a serving general.
  - Eleven commoner scenes the release's conds do not gate weigh 0 for the top of the ladder in every roll, pool and NPC move (`LF.TOP_BLOCK`, `LF.TOP_PREFIX`, in `LF.weight`). Among them: the town muster, the village militia, the sellsword's offer, raiders at the village, the widow's two acres, the proclamation nobody can read, and the old-age kin and well scenes.
  - The scribe's duties (`ln_d_scr_*`) are for a scribe only (`LF.JOB_ONLY`).
  - **Measured by** `lfTierGatesWide`.
- **Names that tell people apart** (`i-names.core.js`).
  - `A.givenName` re-picks a name that is already the player's, a parent's, a sibling's, the spouse's or a child's. It does the same for one held by someone in the scene being set up, or for one of the last six drawn that day.
  - In a scene's view, the second and later full mentions of a person are cut to the given name.
  - Two buttons with one label each say whom they mean.
  - **Measured by** `lfFreshNames`: over 200 Harvest Home dances there are 0 same-name pairs and 0 duplicate labels (4 and 4 on the current build), and your own name is drawn 0 times in 300 (10 before).
- **What now points at the cycle 1 systems** (`LF.whatMore`, `LF.wnDay`). Each pointer is pure and worked out once a day:
  - an office you could seek at 40% or better, with no bar (9996);
  - a cargo that would fetch more down a long road (9995);
  - "See another realm" for someone who has never left the realm they were born in (9990);
  - "Make your mark", for anyone of 18 or more with no arms of their own (9992).
- **A ruler's desk** (`LF.desk`). The crown's debt, when it passes half a year's income or the treasury, scores 89. A bill before the council, or the chance to bring one, scores 66–68. While either is shown, "Look for love" and "Train in an extra session" are dropped. **Measured by** `lfWhatNowSystems`.
- **The golden age's target** is set when the aim is taken: twice the treasury plus a year's income, at least 20,000 (`p.amb.gt`). Before it was a flat 20,000, so a crown with 229,000 had met the aim before setting it.
