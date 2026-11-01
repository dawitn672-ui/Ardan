# Body and mind

**Aspect:** Character and life sim (Road to Ten, Character 4, 5, 6 and 7) and UI and UX (UI 6, the "adult actions shown to children" gap) · **Kind:** system (4 code files), 12 events, 1 patch, plus a bench (`bench/dead-numbers.mjs`)

The plan asks for four things in the life sim:

- **Character 4:** "make health a body, not a bar: wounds on body parts, long illnesses, stats that fade with age one by one, and treatment choices (physician, herbs, prayer) with real tradeoffs."
- **Character 5:** "let personality change. Traits shift from what you do (repeated cruelty earns 'cruel'), and the game shows the reason."
- **Character 6:** "give each life stage its own play ... each with 2 or 3 actions only that stage has."
- **Character 7:** "cut dead numbers. Any stat or skill that changes fewer than 5 outcomes in a typical bot life is cut or merged."

In the release a wound was a chip in a list (380 events write one, 1 reads one), a disease was one damage roll at the new year, 372 events added a trait the moment you chose with no word why and no cap (a bot life ended with 13), only childhood had actions of its own, and a child's court tab offered "Attend court" and then refused.

## What it does

**The body** (`body.core.js`, `body.events.js`, patch `BM-ILLNESS-MONTHS`)

- **Parts.** Every wound sits on the head, arms, hands, body or legs. The 16 wounds with an obvious place get it as data; a deep cut, an arrow, a burn or a bite is placed where it lands. Two breaks that mend in a year (arm, leg) and two marks a neglected wound leaves (an arm that knit crooked, stiff fingers) are new.
- **A fresh wound hampers its part** until it mends: a broken arm costs the blade, the hammer and the plough; a bad leg the climb, the chase and the saddle (`A.BM.PART_SK`, applied in `A.skill`, so checks, duels and work all see it). Six lasting wounds that had stat costs only now cost what they should (a lost eye: bow −15; a limp: athletics −12).
- **Care of a wound.** A serious wound (broken ribs or bones, a deep cut, an arrow, a head blow) asks how it is seen to, at most once a year: the barber-surgeon (a fee; mended in 45 days, festers 1 in 40), your own dressing (a medicine check; 75 days, or the wrong way), the priest (piety and comfort; 150 days, festers 1 in 7), or bind it and carry on (no cost; stays fresh until it heals, festers more than 1 in 4). A festering wound costs health and can leave a lasting mark on that part.
- **Illness lasts months.** The year's disease roll is the release's (who, what, how hard); a third of the blow lands at once and the rest month by month, for 1 to 6 months by disease. While ill you lose free time and rest. A scene asks for the treatment at once (`now`, so the year turn does not spread it over the year): a physician (a fee that grows with your purse; good for the flux and the cough, but he bleeds a fever: shorter, and 8 health now), the wise woman's roots (cheap, a medicine check; the wrong root makes it longer and worse), prayer (piety and comfort, a little relief, more for the zealous), or bed (time and work lost, the toll cut by a quarter). Your own medicine shortens every illness. The release's "See a physician" and "Rest" also act on it.
- **Stats fade one by one.** The release's aging curve, started at each person's own age for each stat (within about 6 years of the usual age for a human, from their id: no draw). The log says when each one turns ("You are slower off the mark than you were. Speed has begun to go, at 47."). The month notes each stat's best and the age it was reached.
- **The profile shows the body:** a small figure shaded by part (mending, marked, sound), each part's marks and what they cost, the illness and its treatment, and each stat's best, when it turns and how much is left at old age. The stat tooltip carries the same curve.
- **Ten scenes a lasting wound brings** (`C.wound(p, part | wound)`): the bad hand at the bench, the long march on a limp, a winter in the lungs, one eye at the butts, reaping with a bad back, what the children stare at, the old wound that knows the weather, a hook for the hand, and the two splints.
- **A hurt body is sent home** (the coordinator's addition, from `bench/dominance.mjs`). The release let you spar at 3 health; each bout cost up to 18 and a life that sparred every month lived at single digits until a cold killed it. Now spar, the yard, a tournament, a hunt, a beast hunt, exploring, a duel, a fighting school and the young bloods are refused below health 50, with the reason on the button ("The yard master sends you home: health 20, come back at 50"), and a practice bout or a tourney never takes you below 45. A first try at 35 and 35 left a sparring life hovering at 35 all year (health heals at the new year), and a fever or a fall still finished it: 8 of 12 dead by 28.
- **One crisis per illness.** Once an illness has brought you to 0 and you lived, the rest of it can weaken you but not bring you there again, as the release's one blow could only once.

**The mind** (`mind.core.js`)

- **Deeds by kind.** A choice its event marks with a trait (`fx.trait`) is a strong deed of that kind (2). A choice whose words show it (hang, flog, spare, nurse, fight, flee, tell the truth, lie, give, take the purse ...) or whose effects do (piety ±3, coin taken against honour) is a deed (1). A habit is a small one: prayers, vigils, the tavern, crimes, duels, a stage action (a quarter to a half).
- **A trait comes when its deeds, less its opposite's, reach 3 within 12 years**, and goes when the opposite's do. So one marked choice no longer makes you cruel; two do, or one and a third of the same kind.
- **At most 5 traits.** A new one pushes out the one your deeds hold least (none at all first, then the longest held), and the log says so.
- **Every change says why:** "You have become cruel: “Hang him. The law is the law” (The poacher, 1112); “Kill them. You cannot feed them” (After the ford, 1115)." A trait added by some other path (`A.addTrait` from another feature) is logged with what was being done. The trait chips carry their reason, and the full profile has a "Who you are" card: each trait and why, what you are leaning toward ("Leaning brave (2 of 3): ..."), and the last changes.

**Each stage its own play** (`stages.core.js`)

| Stage | Actions only it has | What they do |
| --- | --- | --- |
| Childhood | Get into mischief · Sit with the old folk · Go along to a parent's work | stealth and nerve (and a fall from the bell tower), letters and faith, the family trade; each leaves deeds that set traits, and the last picks the trade a youth is apprenticed in |
| Youth (13 to 20 for a human) | Work under a master · Run with the young bloods · Hire out for a season | a named master, harsh or kind; six seasons make you a journeyman with a lasting knack (talent ×1.2); brawls, company and a broken nose; a few suns of your own |
| Prime | Work double · Speak up at the moot · Put coin by for old age | coin and work rating for rest and health; standing where people decide things (persuasion and diplomacy); a tenth of the purse under the hearthstone, back ×1.5 at old age (in the estate if you die first) |
| Old age | Teach the young · Set down your memories · Mind the failing body | a named pupil (kin if there is one) who gains your best skill and can pass you; three chapters make a book (a work and a deed); care holds back the fading of the stats, up to four years |

They sit under "Only now: your childhood" (or youth, prime, old age) on the Life tab, are hidden in every other stage ("Too young" and "Too old" are already hidden reasons), and "What now" offers one a year below love and the urgent things.

**Children see only what they can do** (UI 6): the court's four actions and the plot for the throne are gone from a child's court card (and from a commoner's, where they did nothing), with a line saying why; the brutal training intensity and the free-hours pursuits marked "Too young" are gone from a child's plan card.

**Dead numbers** (`numbers.core.js`, `bench/dead-numbers.mjs`)

The bench plays bot lives of the six balance paths and counts, for each stat and skill: the checks the player took that test it (the named skill, and a skill whose synergy beat it), the checks offered, the events whose condition read it, and the engine decisions that read it (each call of a duel, battle, mission, month of work, the body's year, an activity, an event's effects; scans over every skill such as perks, What now and the training picker are left out). Outcomes are decided + gated + engine.

The first measure (the full world before this feature, 11 bot lives of the six balance paths that lasted 25 years or more, median 51 years) found these under 5 outcomes in the median life: 23 of 44: sword 2, axe 0, dagger 0, dual wield 0, unarmed 2, lance 0, mounted 0, bow 0, crossbow 1, throwing 0, riding 2, athletics 4, survival 4, tracking 4, sea 1, music 0, tactics 1, logistics 0, siegecraft 0, medicine 4, craft 4, husbandry 3, gambling 1. (The benchmark doc, counting offered checks only, found 20 of 44).

What was done with them:

- **Merged, for the player (9 skills):** dagger and dual wield into Blades (sword); crossbow and throwing into Bows & throwing (bow); lance and mounted combat into Riding & the lance; siegecraft into Tactics & siegecraft; logistics into Stewardship & supply; deception into Intrigue & deceit. Reading a merged skill reads the family's number, training it trains the family, the sheet and the training picker show one row, and an old save's points fold in (the higher of the two, and the higher talent). NPCs keep their own numbers, so duels between other people and the war layer are unchanged. 44 numbers become 35 on the player's sheet.
- **Wired into outcomes:** medicine now shortens every month of every illness and decides the herb and dressing checks; craft, husbandry and trade are read by the childhood and youth actions; the wounds' part penalties read athletics, stealth, riding, craft and the weapons on every check.
- **Still under the line after this** (6 of 35, on 12 lives: axe 0, unarmed 2, bow and throwing 2, sea 1, music 1, gambling 1): these are the numbers a typical bot life (mostly peasants, serfs and artisans) does not fight, sail or command with. They are not cut: soldiers, sailors and generals use them, and cutting them needs the source (the plan's step 1). They are listed here so the next pass can merge or wire them.

## Measured by

| Test (`test.mjs`) | Result |
| --- | --- |
| `bodyWoundsOnParts` | odds at difficulty 45 with skill 40: craft 50% → 32% and sword 42% → 29% with a broken arm, athletics unchanged; the surgeon mends in 45 days; festering 27% bound against 4% with the surgeon (400 wounds each); a deep cut landed on torso 15, arms 11, legs 7, hands 7 of 40 |
| `illnessLastsMonths` | marsh fever, 300 onsets each (months / health lost): untreated 4.05 / 30, physician 3.05 / 37 (he bleeds it), herbs 3.05 / 24, wrong herbs 5.44 / 37, prayer 4.05 / 26, bed 3.39 / 25; the flux: physician 21 lost against 30 untreated; every onset asked for a treatment |
| `illnessInLives` | 6 bot lives: 12 illnesses, 3.1 months on average, 12 of 12 treated (physician 6, wrong herbs 3, bed 2, prayer 1); on the feature alone (other features off) 21 of 21 |
| `agingStatByStat` | first body stat to fade across 300 people: strength 85, instinct 77, speed 71, stamina 66; median 7.7 years between a person's first and last; mean age factor at 50/60/70 0.804 against the release's 0.803; one woman's stats turned at stamina 40, strength 42, speed 43, instinct 48, intelligence 61; four years of care leave speed at 70 seven points higher |
| `deedsMakeTraits` | one marked choice: not cruel; two: cruel, shown with both choices; three kind deeds against four cruel: still cruel, seven: kind; deeds for 9 traits leave 5; "Spare the boy" counts as a kind deed |
| `traitsInLives` | 8 bot lives of 45 years: trait changes per life 0, 0, 0, 0, 1, 1, 4, 5 (median 1; the benchmark measured 4.7 in the release); most traits held 5 (the release 13); 11 of 11 changes logged with their deeds; 0 traits without a reason |
| `stagesHaveTheirOwnPlay` | at 8, 15, 19, 35 and 62 each stage shows its own three and no others; six seasons under a master: +9.6 craft and talent ×1.2; 100 suns put by at 40 came back as 150; a pupil passed a craftsman of 39 after 12 lessons; 3 chapters made a book; six seasons of care: speed at 75 52% → 56% of its best |
| `childrenSeeOnlyWhatTheyCan` | 7 children (noble 8, royal 10, gentry 6, peasant 9, merchant 12, serf 11, artisan 14): 167 enabled buttons pressed, 0 refused for age (the fix layer: 5 for the noble alone); brutal training offered 0; "Too young" pursuits listed 0 |
| `mergedSkills` | training crossbow raises bow; an old save's lance 44 over riding 12 folds to riding 44; an NPC's dagger stays 33 beside sword 5; the sheet shows Blades and no dagger row |
| `woundScenesPlay` | 10 wound scenes: eligible only with the wound, 30 choices played, 0 raw tokens |
| `hurtBodyStaysHome` | at health 20 spar, the yard, hunt, explore, tournament, beast hunt and duel are refused with the reason shown; 40 bouts from 50 against a master left health at least 35; at 60 the yard is open |
| `bodyMindRenderPure` | drawing the Life tab, the profile and the stat tooltip changes neither `A.S` nor the random stream |
| `bodyMindOldSave` | a save without the new fields and with unplaced wounds loads, draws and plays two years |

All 17 tests (the four core suites and these 13) pass on the full world (`--features=body-mind`, 56 features); the numbers above are from that build. On one run `bodyMindRenderPure` failed its trait-chip check while 59-tooltips was being written; it passes on the current tree.

**The spar fix** (`node bench/dominance.mjs <build> --lives=12 --only=none,spar,practice,run --workers=1`, the same tree with and without this feature):

| Strategy | Without (died, median age at the end) | With, line 35 | With, line 50 and floor 45 |
| --- | --- | --- | --- |
| spar every month | 12 of 12, 21 (sparred 12 times) | 8 of 12, 28 | 10 of 12, 31 (sparred 21 times) |
| none | 7 of 12, 46 | 6 of 12, 48 | 7 of 12, 43 |
| practice | 5 of 12, 48 | 7 of 12, 46 | 10 of 12, 33 |
| run | 8 of 12, 35 | 5 of 12, 48 | 8 of 12, 32 |

(The "line 35" column was run on an earlier tree with two fewer features from others.) Twelve lives are noisy for the strategies the fix does not touch, so the death ages were checked on 24 more lives each (seeds 9100+, the same bot): doing nothing, 18 of 24 died at a mean 33.0 with this feature against 20 of 24 at 33.8 without; practising, 15 of 24 at a mean 33.4 against 15 of 24 at 35.6. A sparring life lives about ten years longer and no longer dies of the yard; most still die young, of the fevers, falls and fights every life meets, which the bench's 30-year window counts.

**Dead numbers** (`node bench/dead-numbers.mjs <build> --lives-per=2 --workers=1`): before (the same tree without this feature) and after, median outcomes in a life:

| Number | Before | After | | Number | Before | After |
| --- | --- | --- | --- | --- | --- | --- |
| persuasion | 591 | 672 | | stealth | 28 | 19 |
| etiquette | 515 | 637 | | survival | **4** | 16 |
| int | 201 | 67 | | stewardship (+ logistics **0**) | 16 | 16 |
| melee | 184 | 79 | | learning | 10 | 12 |
| wil | 142 | 121 | | tracking | **4** | 10 |
| sta | 70 | 77 | | sword (+ dagger **0**, dual wield **0**) | **2** | 9 |
| intrigue (+ deception 16) | 58 | 94 | | spear | 7 | 9 |
| diplomacy | 53 | 55 | | shield | 13 | 9 |
| trade | 37 | 99 | | medicine | **4** | 9 |
| faith | 163 | 35 | | husbandry | **3** | 7 |
| ins | 30 | 31 | | riding (+ lance **0**, mounted **0**) | **2** | 6 |
| str | 26 | 28 | | intimidation | 7 | 6 |
| command | 26 | 28 | | craft | **4** | 6 |
| spd | 21 | 22 | | athletics | **4** | 5 |
| | | | | tactics (+ siegecraft **0**) | **1** | 5 |
| | | | | bow (+ crossbow **1**, throwing **0**) | **0** | **2** |
| | | | | unarmed | **2** | **2** |
| | | | | sea, music, gambling | **1**, **0**, **1** | **1**, **1**, **1** |
| | | | | axe | **0** | **0** |

Eleven and twelve lives are a small sample: the large engine counts (int, faith, melee) move with which careers the bots happened to take, and a number near 5 can fall either side of it on another seed. The direction for the merged and wired numbers is the finding: 23 under the line before, 6 after.

The events pass `tools/lint-events.mjs` (12 events, 0 errors; the ten wound scenes need a wound, so the linter's characters never meet them, and `woundScenesPlay` plays them instead) and `tools/lint-choices.mjs` (0 obviously best).

## Rules kept

- Every draw is in engine code (the disease roll, the month of illness, the fx, the actions); the hash for each stat's age is from the person's id, so rendering draws nothing.
- Rendering only reads: the body, the figure, the curve, the trait reasons and "Only now".
- All new fields are optional: `pc.ill`, `pc.bmPeak`, `pc.bmFade`, `pc.deedLog`, `pc.traitWhy`, `pc.traitLog`, `pc.bmMaster`, `pc.bmPupil`, `pc.bmStore`, `pc.bmMemoir`, `pc.bmCare`, `pc.bmTrade`, and a wound's `part`, `mend` and `care`. Reasons are plain text (curly quotes, no markup).
- `fx.treat` and `fx.care` are declared in `A.FX_EXTRA`.
- One patch, with its `why`.

## Limits

- **Balance.** Not run here (the coordinator runs it on the integrated build). Expect the death-age bands to move a little: illness now does more or less than the release's one blow depending on treatment (a physician on a fever costs more health, herbs and bed less), the stat ages are spread but their mean is the release's within 0.001, and a hurt body is kept out of the yard. Peak coin may move slightly from the physician's fee and "Put coin by". Fame may move slightly from the moot and memoirs.
- **Traits come slower.** One marked choice no longer makes a trait. Events that read a trait (`C.trait`) will fire a little less often; the median life now changes 1 or 2 traits instead of 4.7.
- **Wound scenes are ten, not thirty.** The benchmark asks for 30 events that read a wound; the engine now reads every fresh wound on every check, but there are 10 scenes.
- **Stage actions are activities, not scenes.** They cost initiative and print a line; the master, the pupil and the book are named and kept, but there is no chain of scenes around them.
- **Some numbers are still under 5** in a typical bot life (see above). Merging the war and weapon skills properly, or cutting them, needs the source.
- **Deeds from words** read the start of the choice's label in English. A label that starts with "Fight" counts as brave whatever follows; the receipts show the label, so a wrong one is visible.
- **Playtests** are needed for "I understood my character" (8 of 10).
