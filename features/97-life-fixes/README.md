# Life fixes

**Aspect:** Events and story, Pacing, UI and UX, Balance (the research report `docs/research/player-complaints.md`, sections 2 to 7 and 10) · **Kind:** systems (seven core files), seven small patches, 24 new events and 18 second tellings, tests

Seven problems a new player meets in a first life, each fixed with a rule a player can say in a sentence, and each measured by a test that fails on a build without this feature.

## 1. Scenes that come back (`a-memory.core.js`, `scenes.events.js`, patches `LF-BOSS-PICK`, `LF-POOL-PICK`, `LF-RULER-PICK`, `LF-GATH-ROLE`, `LF-GATH-SCENES`)

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
- **Gatherings.** A guest (noble, knight, guard, servant) is asked to the same kind of gathering at most every 6 years (a knight's tourney every 4) and to any gathering at most every 2. A visiting ruler or envoy goes to weddings, coronations, tourneys and summits abroad at most every 3 years, the same kind every 6; an envoy sits at a peace congress or a war council at most every 2, and the crown sends someone else to the rest. Hosts, a ruler at congresses and war councils, and family weddings always ask. A gathering's own scenes prefer the ones this life has not seen.
- **Second tellings for NPC moves** (`npc-variants.events.js`). A kind of move may reach you twice in a life, ten years apart. The second time it comes in its other telling: 18 kinds (13 of 21's, 4 of 55's, 1 of 64's) have one, with the same choices and consequences as the first, so every follow-up still comes back.
- **New writing for the worst pools.** Five study breakthroughs, each once a life (a disputation, the chained library, a sum drawn in beer, a map that is wrong, a face at the window). Five duties: two for sailors, one each for clerks and courtiers, the guilds and the clergy.
- **Measured.** `LF.share(pc)` is the share of the scenes shown in this life that had been shown before. `LF.caseShare(pc)` counts a scene about another person or thing (`ctx.pid`, a gathering, a custom, an illness) as a new case.

**Measured by.** _(see the table at the end)_

## 2. Hints that follow the life (`b-hints.core.js`)

**Why.** `UI.hintsOn` was `A.S.year < 1105 + 10`. A life begun at birth comes of age in 1121, so the two adult hints ("You have initiative to spend", "Hover or tap your fighting worth") could never show, nor any tab's hint first opened after the age of ten.

**What it does.** Hints no longer read the calendar. Each one already shows once per browser and only when its own condition holds, so each now shows at its first encounter: the adult ones on coming of age, a tab's the first time it is opened. The one hint tied to a date ("The game saves itself every year") comes two years into the life. The setting still turns them all off.

## 3. A chosen ambition (`c-ambition.core.js`, `ambition.events.js`)

**Why.** The release dropped its ambitions (`A.migrateV10` deletes `p.amb` from saves older than version 11 and nothing set it again). `C.ambition` always said no, and the 30 scenes written for ambitions, among them `pa_freedom_buy`, `pa_freedom_kind_master`, `pa_expand_petition`, `pa_golden_harvest` and `pa_web_marriage`, could never fire. Restoring it is sound: the migration only touches old saves, and the field is the one the scenes already read.

**What it does.**

- At coming of age, at 35 (`C.ageAdj`, so an elf is asked at 35 in human years) and in the first year of a reign, a scene offers up to three ambitions that fit the life (ranked from its situation, without a draw), and "Take life as it comes". At 35 the old one comes first: hold to it, change it, or let it go.
- 17 ambitions, the keys the `pa_*` scenes read: freedom, wealth, trade, family, renown, faith, scholar, blade, knight, soldier, explorer, court, throne, and for rulers expand, golden and web.
- Kept as `p.amb = { k, y }`. The Life tab shows it under What now: its name, the next step in words ("Save 60 suns for the price of your freedom; you have 23") and a progress bar.
- The engine notices when it is done, says so, writes a deed and gives a little renown and contentment.

## 4. Greyed-out controls say why (`d-reasons.core.js`)

**Why.** On a peasant's Holdings tab 61 controls were disabled and 43 gave no reason (the market's "+1" and "+5", the property "Buy"). The Decisions cards' "Decide", the Path tab's "Apply", the elite orders' "Ask to join" and a realm action were the same.

**What it does.** After every draw, each disabled control without a title gets one, worked out from the rule that disabled it: not enough coin for that many loads or no room to carry them; the decision's missing requirements; applied already this year; the order's missing requirements; the action's own refusal. The title is also the control's accessible description. The pass only reads the game.

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

## 6. The first life is not lost in the cradle (`f-shield.core.js`, patches `LF-FIRST-LIFE`, `LF-FIRST-LIFE-SAYS`)

**Why.** On Hard, the default, one newborn in twenty died before five, before any choice.

**What it does.** The creation screen tells the engine whether this is the first life begun in this browser (`o.firstLife`, from `UI.set.lfLives`), so a replay of the journal does the same. Unless Realism was chosen, the engine spares that person the deaths of early childhood (to 5): no yearly death roll, a fever that runs health to nothing breaks instead, and the world's killing blows pass them by. Choices that kill still kill. Brothers and sisters, NPCs, later lives and heirs keep canon's child mortality. The creation screen says so in one line under the difficulty.

## 7. Costs and stakes on the buttons (`g-stakes.core.js`)

**Why.** "Pay his rent" cost 30 suns and did not say so; "Apologise for the wrong · 49% · risky" did not say what failing costs.

**What it does.** Each choice carries one small line, read from the event as written: what it costs (the coin its effect takes, the treasury it spends, unless the label names a price), and, for a check, what failing brings, from `lose.fx` (death, prison, a wound, hurt, coin, your name, honour, your standing, their regard, the realm's peace). "If it fails: hurt, −5 suns, their regard". Drawing it changes nothing.

## Rules kept

- Engine draws only through `A.rand` and its helpers; the views draw nothing and change nothing (`lfStakes`, `lfPureAndOld`).
- New fields tolerate old saves: `pc.evN`, `pc.evC`, `pc.amb`, `pc.lfWorks`, `A.S.lf` and the queue items' `lfFrom` mark are created on first use (`lfPureAndOld` plays a save with all of them removed).
- `LF.OFF = true` switches all of it off, for A/B tests.
