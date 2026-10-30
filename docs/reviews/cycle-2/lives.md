# Cycle 2 review: lives and play

Reviewer: **lives**. Angle: what a whole life feels like to a player of 13 to 23, on both worlds. Two questions: did cycle 1's fixes repair what `cycle-1/lives.md` found, and what do the new systems (994, 995–999, 9990–9997) do inside a life?

## How I played

- **Build.** `index.html` at commit 89dfb45, copied to `/tmp/ardan/cycle2/lives/`. For the A/B checks I built three private copies: without 9996 and 9997 (`nopol.html`), without 9997 (`noco.html`), and without 9996 (`nopo.html`).
- **Runner.** `/tmp/ardan/cycle2/lives/life.mjs` started from cycle 1's runner. It plays through the engine's own queue (`A.advance`, `eventView`/`eventChoose`, `duelAuto`, `battleAuto`, `missionAuto`). Each life's JSON logs every scene: year, age, status, id, title, the full text, every choice with its odds or fight badge, the pick, the result line, and the person named. It also logs the whole game log, yearly samples, trait changes with their source, and opinion change by source (the measure 55-bonds' test uses).
- **How the bot plays.**
  - It picks the best odds, and breaks ties at random. Two lives use a "bold" pick and one a random pick.
  - It spends initiative on a plan for its path. Every fourth month it takes the game's own top What-now action.
  - Like an engaged player, some lives seek an office once a year from the Politics view (`POL.seek`). Rulers and councillors bring and argue bills (`UI.A.poPropose`, `poVoice`). Three lives take a long journey (`A.travelTo(..., 'visit')`).
- **One menu pass.** `ui.cjs` played a Great Continent merchant through the real screens. It took screenshots of every tab, a scene and the *Keep this* card: `/tmp/ardan/cycle2/lives/ui/`.
- **World bench.** `features/9996-polity/bench.mjs`, 8 Known World worlds × 40 years, with and without the Polity.

| Life | World, realm | Start | Years | End | Ending |
| --- | --- | --- | --- | --- | --- |
| K1 soldier | Known, Aldmark | peasant 17, enlisted | 43 | died 60, stroke | The Old Soldier (Marshal of the council) |
| G1 soldier | Great, Taulen | peasant 17, enlisted | 43 | died 60, stroke | The Risen (General, knight, 9 offices) |
| K2 courtier | Known, Varenna | noble 18 | 50 | died 68 | Of the Council (Chancellor, 15 offices) |
| G2 ruler | Great, Birch March | crowned at 20 | 46 | alive at 66 | The Crowned |
| K3 orc ruler | Known, Gorath | crowned at 20 | 46 | alive at 66 | The Crowned (deposed twice, debtors' prison) |
| G3 merchant | Great, Tide Families, then Taulen | merchant 18 | 56 | died 74 | Of the Council (Treasurer, 1.65 M suns) |
| K4 elf scholar | Known, Sylvaran, then Blackreef | artisan 17 | 61 | alive at 78 | The Learned (corsair at 67) |
| G4 orc | Great, Red Hide | peasant 16, enlisted | 50 | died 66 | From the Dust to the Throne (elected at 51) |
| K5 outlaw | Known, Zanara | peasant 17 | 2 | died 19, night raid | Cut Short |
| G5 dwarf priest | Great, Cold Gate | artisan 17 | 61 | alive at 78 | Of Good Repute |
| K6 outlaw | Known, Aldmark | peasant 17 | 51 | alive at 68 | The Wealthy |

Plus 19 A/B lives (16 soldier lives of 30 years on four builds, and K1, K2, K3 again without 9996 and 9997). In all, about 4,100 scenes. No page errors. Determinism held: K3 played twice gives the same 328 scenes.

**Harness limits.** The bot never presses Decisions, *Find work*, *Fill the council* or *Design your arms*. G5 and K4 spent decades without work for that reason, so I draw no finding from their purses. Where a finding rests on this, I say so.

## Verdict

Cycle 1's fixes mostly landed:

- Rulers now see varied lives: 74 to 85% of their scenes are distinct, against 51% before.
- A war brings a ruler or a general to a council of war.
- A ceded home asks what you do.
- Careers go on past 30: knighthoods, fiefs, the Marshal's seat, guild chains.
- The Great Continent speaks in its own words far more often.

The new systems make good scenes when they reach you:

- A 220-day road to Zarak, with a toll-hut sergeant "with ink on his fingers".
- A dog that grows grey and is buried under the pear tree.
- A chapter card that gives a session a shape.
- A share card that works first time.

Three problems weigh more than those gains:

- **The Polity can be farmed.** An engaged player can hold 9 to 15 offices at once, at 90% odds a year. A landless knight is mustered for a count's 4,000 men.
- **Money is worse than in cycle 1.** A merchant ends on 1.65 million suns, where the worst in cycle 1 was 438k.
- **Losing a throne still has no scene.** An orc war-chief is deposed in a civil war that starts and ends in 1112. Four years later the usurper becomes his "patron".

The new systems also seldom reach a player who plays from What now:

- No venture, office, journey or arms is ever suggested there.
- A career soldier meets a 9997 company scene about once in 30 years of service (10 in 295 army-years).

## Ranked summary

| # | Item | Impact | Size | Owner |
| --- | --- | --- | --- | --- |
| B1 | Offices stack without limit: 15 at once, 90% odds a year | 5 | S | 9996-polity |
| B2 | A ruler who loses the crown gets no scene; the usurper becomes his patron | 5 | M | 994-careers, 56-realm-inside |
| B3 | Musters read the rank table backwards: a knight owes 4,000 men, a baron 375 | 4 | S | 9996-polity |
| F1 | Money explodes worse than cycle 1 (1.65 M merchant, 499k soldier) | 4 | M | 45-economy, 9995, 9996 |
| F2 | The new systems don't reach the life: What now never names them | 4 | M | 97-life-fixes, 9995–9997, 9992 |
| F3 | Tier gates stop at ruler and general: a Marshal and a Chancellor get village scenes | 4 | S | 97-life-fixes |
| B4 | Raw creature ids in scenes ("A CRE-35 has been killing stock") | 3 | S | 03-engine-fixes, 992-far-beasts |
| F4 | Old age starts at 50 and fills 19–42% of the rest of the life, in a villager's voice | 3 | M | 74-old-age |
| F5 | Trait drift converges: zealous in 8 of 10 lives, greedy in 7; thoughts drive a third of it | 3 | S | 9992-identity, 49-body-mind |
| F6 | Office and polity scenes repeat word for word; I6 (far beast scenes) unchanged | 3 | S | 9996, 992, 994 |
| F7 | The Polity halves civil wars, the lives' biggest moments | 3 | M | 9996-polity |
| F8 | The memories' share fell because the memories pull less, not because the Polity adds opinion change | 2 | M | 55-bonds |
| B5 | Missions other than bandit hunts still log "Enemy dead: 1,611. Your losses: 0" | 2 | S | 994-careers |
| F9 | Chapters: the same unmet aim five chapters running; an elf's youth chapter idles 19 years | 2 | S | 9993-chapters |
| B6 | Small text faults: "the bill for high (obligations)", "a soldier has no use for mills" to a courtier, names ×4 | 2 | S | 9996, 994, 97 |

The cycle 1 status table is at the end, after the findings.

---

## Bugs

### B1. Offices stack without limit, at 90% odds (impact 5, size S)

**What I saw.** The life seeks the best open office once a year from the Politics view, as a player who reads the odds would.

| Life | Offices at the peak | What they were |
| --- | --- | --- |
| K2 courtier (Varenna) | 15 at 53 | governor, magistrate and reeve ×4 each, two collectorships of customs, a wardenship, on top of the Chancellor's seat |
| G3 merchant (Taulen) | 11 | governor ×4, reeve ×4, magistrate, two collectorships, on top of the Treasurer's seat |
| G1 soldier (Taulen) | 9 | as above |

The odds are 0.9 almost every year once the life has some renown. The log reads like a list: "You are named Magistrate of Varenna… of Vitia… of Vitina… of Calena… of Venina" (1105–1111). G1's coin went from 151,002 to 498,619 in seven years once the offices stacked.

The cause is `POL.seekable` in `features/9996-polity/d-player.core.js`. It skips only the office the player already holds (`if (o.pid === pc.id) continue;`). Nothing counts the offices the player holds elsewhere. The README says "a person may hold two offices of one realm", which is not what happens.

**Why it matters.** The Politics view is where a curious player goes first. With a 90% button that pays every year, the political game is solved on the first visit. It also empties the realm's offices of the named people the feature exists to show.

**Fix.** In `POL.seekable`, bar a seeker who already holds two offices of the realm. Give the bar its own line in `bar` ("You already hold two offices"). Add a test that seeks every year for 20 years and holds at most two.

### B2. A ruler who loses the crown gets no scene, and the usurper becomes his patron (impact 5, size M)

**What I saw.** K3, Tollo, war-chief of the Horde of Gorath, crowned at 20:

- 1112: "The Goatpath line rises against you! Rakka of the Goatpath line claims your crown." In the same year: "Rakka of the Goatpath line wins The War of the Horde Succession and takes the throne."
- His scenes that year are the commoner's siege scene `sg_walls`, five times: "You eat half of what you are given and give the rest to the children on your street". After that comes a chapter card, *The Margins*.
- There is no scene for losing the throne: no flight, no cell, no oath to the new chief.
- 1116: "Rakka of the Goatpath line… takes an interest in you. You have a patron now."
- He is elected again in 1126. In 1131 his capital is sacked. He gets the townsman's `sg_sacked` ("Run for the river gate… You leave everything but your life"), and by 1132 he is no longer ruler. No log line says how.
- The next 18 years bring a ruler's debts. "You are in debt: 75,618 suns owed to moneylenders" came while he still ruled. After the crown, he went to debtors' prison in 1118, 1135, 1143 and 1150.

Cycle 1's B1 (a failed coup with no cost) is fixed in code by `994-careers`' `cr_coup_fate`, though no life of mine tried a coup. This is its mirror: you *are* the crown and lose it.

**Why it matters.** Losing a throne is the largest thing that can happen in a reign. A player of 13 to 23 who sees it pass as a log line, and then gets the usurper as a patron, learns that the reign was a costume.

**Fix.**
- When a war of succession or a faction's victory takes the PC's throne, queue a fate scene, the same shape as `cr_coup_fate`: flee to a friendly court, kneel to the new ruler (with terms), take the cell, or raise a claim of your own. Set `pc.flags.deposed` and a claim.
- The patron pick (21 or 41) should skip the person who took your throne.
- A ruler whose capital is sacked gets a ruler's version of `sg_sacked` (`36-sieges`): escape with the household, be taken, or die on the stair.
- Owners: `994-careers` for the fate scene; `56-realm-inside` or the release's claimant war for the hook. Measure it as "a lost crown always has a scene".

### B3. The muster reads the rank table backwards (impact 4, size S)

**What I saw.** `po_muster` asks a landed lord for the men of their oath. In my lives:

| Life | Rank | Muster asked for |
| --- | --- | --- |
| G1, a peasant-born knight with no land (rung 2) | Knight | "your oath owes 4000 men… Scutage… is 24,000 suns" (1133), then 5,000 men and 30,000 suns (1138) |
| K2 (rung 2, no fief until 1128) | Knight | 3,000 men and 18,000 suns, twice |
| G3, rung 4 with a fief | Baron | 375 men and 2,250 suns |

`POL.pcOath` in `9996-polity/d-player.core.js` takes `GD.NOBLE_RUNGS[GD.NOBLE_RUNGS.length - 1 - rung]`. The table runs Franklin (0) to Duke (8), so rung 2 reads index 6, the Count, with a levy of 4,000. Rung 4 reads index 4, the Baron, with a levy of 300 (× 1.25 = 375).

Refusing twice brings `po_revoke` ("declare your lands forfeit"), which reaches a knight who has no lands. The scene also says "Your steward counts the harvest", to a man with no harvest.

**Why it matters.** A new knight is asked for an army. The only sane answer is "Refuse", which the game then punishes. The oath, the core of the vassal-contract system, teaches the wrong lesson.

**Fix.** Index `GD.NOBLE_RUNGS[pc.noble.rung]`. Queue `po_muster` only when the levy is at least 1. Skip `po_revoke` for someone without land. Add a test for a knight (5 men) and a count (4,000).

### B4. Raw creature ids in scene text (impact 3, size S)

**What I saw.** Eight scenes in five of ten lives:

- `pf_spear_boar`: "A CRE-35 has been killing stock around Urgol" (K3, 1122; G4, 1126).
- `wk_hunt_beast`: "20 suns for whoever kills CRE-21" (K6, 1110).
- `fb_game_moving`: "Game is moving along the Elder Grass: CRE-65, the boys say" (G4, twice), and CRE-87 and CRE-89 (G5, three times).

In a Known World game, `A.ctxTokens(pc, {beast: 'CRE-21'}).beast` returns `"CRE-21"`, though `LORE.creatures` has "The Evenwood Wolf". The base `A.ctxTokens` sets `o.beast = c.name`. It then ends with `for (const k in ctx) … o[k] = String(ctx[k])`, which writes the id back over the name. The far creatures (CRE-65, 87, 89) are not in `LORE.creatures` at all, so `{beast}` has nothing to give them.

**Fix.**
- Patch the last loop of `A.ctxTokens` to copy a `ctx` key only when `o[k] == null` (03-engine-fixes). Check first that no event relies on a `ctx` value replacing a computed token.
- In `992-far-beasts`, `fb_game_moving` should use `{fbA}`/`{fbThe}`, which `FB.fill` sets.
- Add a raw-id check (`/CRE-\d|POL-\d/`) to `tools/lint-events.mjs`'s play-test.

### B5. Mission casualty numbers outside bandit hunts (impact 2, size S)

**What I saw.** 994's `CAR.MISSION_CAP` caps bandit hunts (the largest now is "Enemy dead: 111"). The other mission kinds still scale with the army:

- K1: "Hold the crossing near Lirith: Triumph. Enemy dead: 1,145. Your losses: 0."
- G1: "Assault on the walls near Lhogodul: Triumph. Enemy dead: 1,611. Your losses: 0." and "Supply raid near Khagan: … 1,604. Your losses: 0."
- One-day battles: "3 of yours dead, 3,421 of theirs" (Saltbridge, 1111), and "18 of yours dead, 4,001 of theirs".

**Fix.** Give every mission kind a band in `CAR.MISSION_CAP` (a supply raid of 30 to 400, an assault on the walls of 100 to 1,500 with real losses). Clamp a won mission's ratio of their dead to yours (no "0 losses" above 50 enemy dead).

### B6. Small text faults (impact 2, size S each)

| Where | What it says | Owner |
| --- | --- | --- |
| `po_bill_passed`, `po_debate` | "A crier reads it… medium (obligations)"; "The hall is full for the bill for high (obligations)" | 9996 (`RI.PUSH[k].t` for the new laws) |
| `cr_fief` | "Decline: a soldier has no use for mills", offered to a courtier (K2) and a merchant (G3) | 994 |
| `cr_fief` | "The lord of Zaotse dies without heirs" in 1138, and the same lord dies again in 1146 (G1) | 994 |
| `cr_honour` | "The masters of your trade… vote you master of the guild", to a courtier (K2, 1113, 1144, 1152) | 994 |
| `lf_rival_suitor_lies` | "Oddny Thornwick has heard. Oddny Thornwick has not asked you… Oddny Thornwick owes you for 1133": a full name 3 to 4 times in 24 of 1,358 scenes with a named person. This is the side effect of cycle 1's B3 fix (`A.knownName`). Use the full name once, then the given name. | 97 (LF-THEM-NAME) |
| `oa_life_ruler_told` | "The court chronicler reads you his account of your reign", in the year G4 was first elected (1140), and in G2's first chapter of age | 74 |
| `po_election_day` | "The electors of Red Hide file out of the shrine… 2 votes of 2… across the nave", for orc clans | 9996 |
| 49's trait log | "You have become proud: in 1120." with no reason, 14 times in 10 lives: every trait a ripened thought gives (F5) | 9992 (`ID.ripen` should set 49's `BM.cur`) |
| 67's weave | "You were last in a tavern in 1140, when you bought the corrody"; "The last time you were at court, in 1107, you told it bigger still" (a battle tale, not court) | 67-memory-weave |

---

## Findings

### F1. Money explodes, worse than in cycle 1 (impact 4, size M)

**What I saw.**

| Life | Coin over time |
| --- | --- |
| G3 merchant | 98 at 18 → 79,098 at 28 → 759,696 at 48 → **1,653,309 at 73** |
| G1 soldier | 24,212 at 32 → 151,002 at 52 → 498,619 at 59 (offices, B1) |
| K2 courtier | 297k at the peak |
| K1 soldier | 169,006 at 52 |

Cycle 1's worst life was 438,566.

The chapter aims follow the pile: "Have 1,247,334 suns in your purse", "Have 223,224 suns". G2's ruling aim was "Fill the treasury to 6,982,391 suns", and the Realm card shows Taulen's treasury at **25M suns** in 1111 (`ui/tab-realm.png`).

The sinks exist but are not used. What now offered "You can afford it: endow a college" or "found a free school" for decades. The bot does not take Decisions, so that part rests on the harness. G3's merchant also made 168 loans and 10 trade ventures and sent 0 of 9995's ventures: the caravan roads never came up.

At the other end, the queen of G2 had 2,000 to 5,000 suns of her own for 46 years, and read "In want: there is too little coin and too little warmth" five times. That is word for word the line cycle 1's B4 quoted.

**Why it matters.** Once a fortune is a million, every scene's "pay 40 suns" is not a choice, and neither is a 24,000-sun scutage. The trade roads were built to give a merchant something to do with a fortune, and a fortune arrives without them.

**Fix.**
- Find where G3's money comes from (moneylending, 168 times, is the first suspect) and add a yearly income line to the log (cycle 1's I4 fix, not done).
- Cap or tax moneylending interest above about 20,000 suns (45-economy).
- Let the chapter aim for coin be a step (×1.5, at most +50,000), not a jump to a precise seven-figure number.
- Pay a ruler a privy purse from the treasury (56-realm-inside), so a queen is never "in want".
- Treasury growth on the Great Continent is the ×10 already open (lane E's `A.TRADE.ledgerYear`).

### F2. The new systems don't reach a player who plays from What now (impact 4, size M)

**What I saw.** I counted What now's top items once a year in every life. The most common, across 10 lives:

- "Train in an extra session": 28 to 40 years per life.
- "Found your house": 36 to 40.
- "Call in a favor".
- "Look at N work offers".
- "Fill the council": all 46 of G2's years.
- "Ask to join the Palace Tigers": 27 years of G1.

It never named any of these:

- a venture on the trade roads (9995);
- an office you could seek, or a bill (9996);
- a journey (9990);
- the arms designer (9992);
- a chapter aim (9993).

What each system did in a life, without my bot's extra pushes:

| System | What happened |
| --- | --- |
| 9997 companies | 10 `co_` scenes in 295 army-years across all builds that have it: 0 in K1's 30 army-years, 3 in G1, 0 in G4. "Serjeant Pemai" and "the turnips" (`co_the_new_men`) are good scenes; a soldier meets one about once a career. |
| 9996 offices | Came only because my bot sought them. Unprompted, a commoner sees `po_bill_passed` ("Join those who will press to undo it") two or three times a life. The Politics view is under the court card ("Show the politics of Taulen"), right after "Only those of gentle birth… attend court" (`ui/tab-realm.png`). |
| 9990 journeys | Only when my bot set out. When it did, the road was the best part of the life: `jr_border`, `jr_folk` ("quessa, a household's sealed book of dues and debts"), `jr_custom` ("Every third spring any free man may sit the prefectural exams"). |
| 9992 arms | `pc.mark` stayed null in all 11 lives. The card says "No arms of your own yet. Design your arms" at the foot of the Life tab. |
| 9994 share | Works: *Keep this* on a result opens a clean 1080×1350 card with the scene's print, the bust, the choice and the seed (`ui/04-keep-card.png`). |

**Why it matters.** Cycle 1's I5 found that "a system the game never brings to you doesn't exist" for this player. The same holds for nearly all of cycle 1's growth.

**Fix.** Extend `LF.whatMore` (97-life-fixes) with one pointer per system, each pure:
- "An office is open to you: Reeve of X, 62%" (9996, when `POL.seekable` has an unbarred office at 40% or more);
- "Your cargo would fetch more in Qadir" (9995, when `TR.vOptions` has a gain);
- "You have never seen the sea / another realm" (9990, from the chapter's travel aim);
- "Make your mark" once a life, at 18 (9992).

9997 needs its scenes to come once a campaign, not once a career. Its `co_` events need a weight or a trigger on battle and on pay day.

### F3. Tier gates stop at ruler and general (impact 4, size S)

**What I saw.** `A.lfTop` (`97-life-fixes/h-words.core.js`) is `p.ruler || A.lfRank(p) >= 6`. A councillor, a lord or a retired commander passes as a villager.

- **K1, Marshal of Aldmark's council from 47** (he left the army, so his rank is gone), with 118k to 169k suns:
  - `av_road_sellsword_offer`: "You're wasted here. Twenty-five a month";
  - `pf_spear_pike_drill`: "The town muster… Sergeant Hamo shouting";
  - `rk_vt_militia`: "you are the only one who has ever been a soldier";
  - `gf_village`: "Raiders hit the village where you are sleeping";
  - `la_holding_1`: the widow's "two acres, a pear tree";
  - `la_elder_2`: "The lord means to fence the common… They look at you to speak for them".
- **K2, Chancellor of Varenna:**
  - `ln_d_scr_lover` (1130): "you have been writing love letters for Fausto of Norona". This is cycle 1's own example, still there;
  - `ln_d_scr_eyes`;
  - `ln_d_proclamation`: "the village crowds round a page nobody can read. Every face turns to you".
- **G2's queen:** "In want: there is too little coin and too little warmth" (F1).

**Fix.**
- Widen `A.lfTop` to: `p.office` (a council seat), `p.noble.rung >= 4`, or a past rank of 6 or more (`p.veteran`).
- Gate the scribe's duties (`ln_d_scr_*`) on `C.job(p, 'scribe')`, which cycle 1 asked for.
- Gate the "In want" line on the realm's treasury for a ruler.

### F4. Old age begins at 50 and fills the rest of the life, in a villager's voice (impact 3, size M)

**What I saw.** 74-old-age's 119 scenes start with `C.old`, at 50 for humans and 45 for orcs.

| Life | Share of scenes from the first old-age scene on |
| --- | --- |
| K6 | 42% |
| K1 | 37% |
| K2 | 29% |
| G3 | 27% |
| G1, G4, K3 | 19–21% |
| G2 | 16% |

Many assume a poor villager without kin:

- **K1, the Marshal, at 52:** buys `oa_kin_corrody` ("a gallon of ale a day… a monk to read to you"). `coinPct: -0.25` took 39,601 suns. At 55, `oa_kin_alone`: "old people without kin often die in the snow in February, and are found in March".
- **K2, the Chancellor, at 51:** buys the corrody and "move[s] in at Michaelmas with a chest and a dog". Her coin goes from 186,518 to 21,945 that year; the corrody's quarter is the largest single cost.
- **K1:** `oa_life_ledger` ("A merchant who dies with a full debt-book") for a soldier. `oa_late_bounds_walk` ("At the spring walk round the parish") for the Marshal.
- **G2's queen and K3's war-chief at 46:** `oa_late_well` ("The lane has no well of its own").

**Why it matters.** A player at 50 who still runs the realm's army reads the next 15 years as a pensioner's. The scenes are well written, but they are for a different person.

**Fix.**
- Start the general old-age pool at 55 (ageAdj).
- Give `oa_kin_*`, `oa_late_well`, `oa_life_thief` and `oa_life_cheat` the F3 gate.
- Make the corrody a fixed price (a few hundred suns) and only for `!p.office && !C.noble(p)`.
- Cap old-age scenes at about 3 a year.
- Owner: `74-old-age`.

### F5. Trait drift converges, and ripening thoughts drive a third of it (impact 3, size S)

**What I saw.** This answers cycle 1's open question about traits changing 8 to 10 times.

- My lives changed traits 2 to 9 times (median 4.5). The two lives with 9 were the two that held five thoughts each (K4, G5).
- Of 49 changes, 23 followed a ripened thought (9992's `ID.ripen` calls `A.addTrait`). Each logs two lines, one of them empty ("You have become proud: in 1120.").
- Where lives end up is the stronger finding:
  - zealous was gained in 8 of 10 lives, greedy in 7, calm in 5;
  - four lives kept none of the traits they were born with: K2 went from patient, cautious, brave to zealous, calm, greedy, proud, curious;
  - zealous comes from the old-age faith scenes (`oa_faith_shroud`, `oa_faith_vigil`, `oa_faith_doom`), greedy from `po_graft`, `ec_meal_sack` and "Every coin is a seed".

**Why it matters.** "Who am I becoming" is 9992's own pillar. If every old person becomes zealous and greedy, the character you shaped is gone by 60.

**Fix.**
- When a ripened thought would push a trait out of the five, ask first ("Hold to who you were, or let it in").
- Give 49's deeds-based drift a per-trait saturation, so a trait most lives gain needs more deeds.
- Set `BM.cur` in `ID.ripen`, so the log names the thought.
- Owners: `9992-identity`, `49-body-mind`.

### F6. Office and polity scenes repeat word for word, and the far beast family still comes every three years (impact 3, size S)

**What I saw.**

| Scene | Count | Note |
| --- | --- | --- |
| `po_march_raid` "Across the march" | 6 in K1, 4 in G1 and G4 | the same hayrick, the same riders: "The riders say you are getting old" at 26 |
| `po_audit` | 6 in K2 | the same "Two clerks in black arrive at Vitina", including the year after she "gave up the shire quietly" |
| `po_case_debt` | 3 in K2 | the same cloth merchant and knight's bond, each time |
| `po_muster` | 4 in G3 | |
| `fw_rankup` "A step up" | 7 in G1 | every promotion; "Your pay rises by a string a month, on paper" |
| `cr_knighted` | 4 in K1 | the bot declined it each time; the crown offers the same scene every six to ten years |
| `fb_at_the_herds` + `fb_mem_spared` | 11 in G3, 8 in G4, 6 in G5 | cycle 1's I6, unchanged: `cool: 3` |

The "(as in 1127)" memory marks help, but the frame does not change.

**Fix.**
- Give 9996's office scenes the NPC-move rule 97 uses: twice per office, eight years apart, with a second telling.
- `cr_knighted` should stop after two refusals (a flag).
- Raise `fb_at_the_herds`' `cool` to 8 (992).
- Make `fw_rankup` once per two ranks (991).

### F7. The Polity halves civil wars (impact 3, size M)

**What I saw.** On `9996-polity/bench.mjs`, 8 Known World worlds × 40 years:

| | With the Polity | Without |
| --- | --- | --- |
| Wars of succession | 8 | 15 |
| Liberty revolts | 9 | 19 |
| Elective successions | 235 | 141 |

Elections take the place of many of the fights. In the lives, the civil wars that remain are over before the PC can take part. K3's Horde war started and ended in 1112 (B2), and no life met `rk_gen_coup`.

**Why it matters.** A succession war is where a soldier, a courtier and a ruler each get the life's biggest choice. 994's coup and fate scenes depend on them. Halving them without a replacement drama is a loss for lives, even if it is a gain in realism.

**Fix.**
- Let a contested election bring the scenes a civil war would: a candidate player can lose and refuse the result (a claim), and an elector can be pressed by both sides.
- Give a war of succession a minimum length like 09-scale's `W.MIN_WAR_DAYS`, so the PC can join a side.
- Measure "lives with a civil war in the realm" per 50 years in the bench.
- Owner: `9996-polity` with `09-scale`.

### F8. Why the memories' share of opinion change fell (impact 2, size M)

**What I saw.** I measured opinion change on the player's bonds as 55-bonds' `bondsInRealLives` does, by what made it.

| Build | Lives, years | Opinion change a year | Memory pull a year | Share | 9996 and 9997 scenes' part |
| --- | --- | --- | --- | --- | --- |
| Current | 7, 263 | 339 | 45 | 13.3% | 1.0% |
| Without 9997 | 4, 96 | 251 | 40 | 15.8% | 0.1% |
| Without 9996 | 4, 114 | 293 | 49 | 16.8% | 0% |
| Without both | 7, 257 | 364 | 66 | 18.1% | 0% |

The fall is real in my sample too, but its cause is not the one the test's comment gives ("whose courting and estates add opinion change of their own"):

- Total opinion change is about the same with and without (339 against 364 a year).
- The polity and company scenes make 1% of it.
- What falls is the pull itself, 66 to 45 points a year.

The per-life share swings from 8.6% to 27.1%, so 7 lives a side is still a small sample.

**Fix.**
- In 55-bonds, log which bonds the pull acts on per year with and without 9996. My guess, untested: 9996's offices and electors fill `pc.rel` with acquaintances who have no ledger lines (`A.link(pc, t, 'acquaint', …)` in `d-player.core.js`), so the pull's bonds are a smaller part of the whole.
- Correct the test's comment once the cause is known.

### F9. Chapters: good shape, stale aims (impact 2, size S)

**What I saw.** The chapter card is the best new frame for a session. "Chapter Two: Spear and Bread… The Long Muster is closed: 1 of 3 aims met." reads well, and aims are met and logged ("Aim met: Make a true friend").

The problems:

- **The same unmet aim, chapter after chapter.** "Learn your letters" was in 5 of K1's 6 chapters and never met. "Get an heir" was in all four of G2's reign chapters (a queen married at 35, with no child).
- **Targets set from the purse.** "Have 223,224 suns", "Fill the treasury to 6,982,391 suns".
- **An elf's youth chapter idles.** K4's *Under the Table* had all three aims met by 1110 and stayed open until 1129. Elves are young until about 41, and the chapter does not turn until the stage does.
- **The first prime chapter for a merchant** asked "see the war through", which a merchant cannot affect.

**Fix.**
- Don't repeat an aim that failed in the last chapter unless the player picks it.
- When all three aims are met, open the next chapter within a year, whatever the stage.
- Round coin targets.
- Owner: `9993-chapters`.

---

## Cycle 1's findings, checked

| Cycle 1 | Status | Evidence in cycle 2 |
| --- | --- | --- |
| B1 failed coup forgiven | **Fixed in code, not met in play** | `cr_coup_fate` and `CAR-USURPER` exist; no life tried a coup. Its mirror, a deposed ruler, is still silent (B2). |
| B2 unbadged hunt | **Partly** | The fight badge now shows on function effects ("Follow the marks and kill it {fight 2%}"). "Raise a hunt with the village" still leads to `hunt_beast` with no badge on the choice itself (`fx: { event: 'hunt_beast' }`). |
| B3 same-name NPCs | **Fixed, with a side effect** | `{them}` gives the full name. In 24 scenes it appears 3 to 4 times (B6). |
| B4 tier leaks | **Partly** | Rulers and generals are gated. Councillors, lords and retired commanders are not; `ln_d_scr_lover` still reaches a Chancellor (F3). |
| B5 death manners | **Fixed** | "a stroke" gives the age manner. |
| B6 "Master your master" | **Fixed** | 0 in 10 lives. |
| B7 absurd numbers | **Partly** | Bandit hunts are capped at 111; other missions and one-day battles are not (B5). |
| B8 wars and rulers | **Mostly** | `fw_war_council` came 10 times in G2's reign and 5 in G4's. `po_new_crown` came when G3's home was ceded ("Stay, and do not kneel"). G2 still lost six provinces in five wars (Kolmkar and Ilm 1108, Ser 1115 and 1140, Serkar 1117, Tuomaa 1150) with no scene beyond the council, and 0 battles. |
| I1 careers top out | **Fixed, then overshot** | Commander at 29 and Marshal at 47 (K1); General at 50 (G1); knighting, fiefs and guild chains came. Office stacking (B1) is the new ceiling. |
| I2 ruler repeats | **Fixed** | 74% and 85% distinct, against 51%. No gathering scene (`gs_`) came more than twice in a reign (cycle 1: 14 to 16). |
| I3 English-medieval far voice | **Mostly** | Taulen soldier: 9 of 369 scenes, against 26 of 304. Left: `cr_fief`'s "the manor, the mill and nine villages" in Taulen, the old-age pack's abbey and parish, "the nave" for orcs. |
| I4 money | **Not fixed, worse** | F1. |
| I5 systems never brought to you | **Partly** | What now names houses, works and orders. The cycle 1 growth is absent (F2). |
| I6 far beast repeats | **Not fixed** | F6. |
| I7 military frames | **Partly** | `bs_reckoning` at most 6 a life, against 13. `fw_rankup` and `po_march_raid` repeat instead. |
| I8 endings | **Partly** | "Of the Council" and "Shepherd" exist. K1, a Marshal of the council, ended "The Old Soldier", because `veteran` comes before `council`. There is no "Notorious" or "Failed Claimant". |
| I9 first-year flood | **Fixed** | 10 to 15 scenes in the first calendar year, the start's own scenes included, against 23. |
| I10 log noise | **Partly** | "held without you" 34 times in K2 and 14 in K3. "no one left to learn from −20%" 69 to 248 lines a life. The levy call-ups are folded. |

## What the growth makes possible

- **The road.** G3's merchant walked 57 days to Lioka in 1112: a border with a 12-sun toll, a Delta Sennish grandmother's word "seuwen, a reel of raw silk", a caravan out of Ngoru. K4's elf walked 103 days to Blackreef at 30, stayed ("You take a room by the month"), and was a corsair at 67. Nothing in cycle 1 made a life like that.
- **Things you love.** A dog named in `ix_pup` grows old in `ix_dog_old` 12 years later ("You bury Whitefoot under the pear tree"). A blade keeps its notches. These are the first threads that run a whole life.
- **The ladder past 30.** `cr_knighted`, `cr_fief`, the Marshal's and Treasurer's seats, the guild chain: K1, G1 and G3 all got a second career.
- **Elections.** G4, an orc peasant enlisted at 16, was elected chief of the Red Hide at 51. That is the best "from nothing" arc in the set.
- **The share card** (`ui/04-keep-card.png`).

## Top findings

1. **B1**: an engaged player holds 9 to 15 offices at once at 90% odds; G1's coin went from 151k to 499k in seven years. (S, 5)
2. **B2**: a war-chief loses his crown in a one-year civil war with no scene; the usurper becomes his patron; a second loss leaves no log line. (M, 5)
3. **B3**: `POL.pcOath` reads `GD.NOBLE_RUNGS` backwards: a landless knight owes 4,000 men and 24,000 suns, a baron 375. (S, 4)
4. **F1**: a merchant ends on 1.65 M suns (cycle 1: 438k); chapter aims ask for 1,247,334; a queen stays "in want". (M, 4)
5. **F2**: What now never names a venture, an office, a journey or the arms; a soldier meets a 9997 company scene about once a career (10 in 295 army-years). (M, 4)
6. **F3**: tier gates stop at ruler and general; the Chancellor still writes love letters as a scribe; the Marshal is asked to train the village militia. (S, 4)
7. **B4**: "A CRE-35 has been killing stock": `A.ctxTokens` overwrites the beast's name with its id; far beasts have no name entry. (S, 3)
8. **F4**: old age starts at 50 and is 19–42% of the rest of the life; a Chancellor buys a corrody with 25% of 186k. (M, 3)
9. **F5**: traits converge (zealous in 8 of 10 lives, greedy in 7); ripening thoughts cause a third of the changes, with an empty log line. (S, 3)
10. **F7, F8**: the Polity halves civil wars (34 to 17 in the bench); the memories' share falls because the pull falls (66 to 45 a year), not because polity scenes add opinion change (1%). (M, 3; M, 2)

Raw data: `/tmp/ardan/cycle2/lives/*.json` (one per life, every scene), `an.cjs` (per-life summary), `tier.cjs`, `bench-with.json` and `bench-without.json`, `ui/`.
