# Casus belli: why a war began, grudges that wait, debts that are paid

**Aspect:** Diplomacy and politics (Road to Ten, Diplomacy 6, with Diplomacy 5 and the step's "done when") · **Kind:** system (five core files), two patches, tests, and a bench script (`bench.mjs`)

The plan asks for:

- **Diplomacy 5:** "Make gold get used. AI treasuries pay for armies, buildings, bribes and mercenaries. The world audit's hoarding flag must read 0."
- **Diplomacy 6:** "Give realms long memories: grudges and debts that last generations, like 'they burned our capital in 1108'."
- **Done when:** "sims show rulers act in line with their traits 80% of the time or more, 10 seeds of 100 years each show 0 hoarding flags, and playtesters guess an AI's answer before clicking 7 times in 10."
- The benchmark's D9 adds: "≥ 30% of AI wars cite a memory or a want".

Before this feature:

- `55-bonds` kept a feud ledger per realm that outlived its rulers and weighed on relations. A revenge war was still rare, because the wronged realm is usually the weaker one and `A.aiWarCheck` wants an edge in strength.
- `47-realm-bible` wrote a want for every realm. No AI decision read it.
- A war recorded its cause as one word (`w.cb`: rivalry, reconquest, incident).
- `56-realm-inside` spent AI gold. Its own audit read 2 hoarding flags in 33,225 realm-years.
- `20-ai-personality` logged every AI decision with how hard the ruler's traits pushed toward it. This feature's bench, with the feature off, found those decisions in character 63.9% of the time (10 worlds × 100 years).

## What it does

### 1. A casus belli for every war (`casus.core.js`)

- **Every war records why it began** (`w.casus`), in the moment it starts. The record is a list of reasons, each of one kind, led by the weightiest:

  | Kind | Read from | Example |
  | --- | --- | --- |
  | `feud` | 55-bonds' ledger, a grudge of 8 or more | "An old grudge: Took Brodava from us, in 1125 (under Queen Milena Dravic; carried by Queen Ludmila Dravic since 1131)" |
  | `want` | 47-realm-bible's want, when it names the defender | "Aldmark's old want: to push the Horde back over the Gordush and plough the steppe edge" |
  | `relmem` | the release's lasting memories (land taken, betrayal, a broken pact, abandoned in war), 10 or more | "Tessaria took our land, in 1108" |
  | `recent` | the release's passing memories (an insult, an incident, a war fought) | "Lately: Blackreef insulted our crown, in 1112" |
  | `claim` | claims on the defender's land | "A claim on Atani and Omamba and 5 more" |
  | `cause` | the cause the world accepts (`w.cb`) | "The cause given: an old rivalry" |
  | `trait` | the ruler's war traits | "Emperor Harald Ironside is ambitious and cruel" |
  | `chance` | the defender's state | "the Horde is in turmoil (stability 29)" |
  | `plan` | this feature's plan | "Prepared since 1121" |

- **The player sees it** in four places:
  - the news: "War declared by Velgrad. The cause given: …";
  - the war's entry in 20-ai-personality's "Recent decisions of rulers": "declares war on Greyhaven. Casus belli: …";
  - the war room, under the sides of each war: "Why it began (Velgrad, 1131): …" (patch `CB-WAR-ROOM`);
  - the diplomacy card of a realm ("Grudges, wants and debts": its wars and why, what it is preparing, what it owes), and the Realm tab ("Why wars begin": your realm's wars, a neighbour's plan against you, the wars elsewhere).
- A realm keeps its last six casus belli (`r.csHist`), so the diplomacy card can name a realm's last war after the peace.

### 2. Revenge that waits (`casus.core.js`, patch `CB-WAR-ODDS`)

- **A plan.** Once a year every AI crown weighs its neighbours. Two things can become its plan (`r.csPlan`):
  - a grudge of 8 or more in the ledger, weighed by its ruler's vengeance, `e^(1.1 wrath + 0.5 pride + 0.5 war − 0.7 warmth)`;
  - the realm its want names, weighed by its ruler's appetite, `e^(0.9 war + 0.6 greed + 0.4 pride − 0.3 warmth)`.

  A ruler whose temper is below 0.75 on that scale keeps no plan: a forgiving, kind king lets the grudge lie, and his vengeful son takes it up from the same ledger. Nothing is drawn.
- **Building up while it waits.**
  - The crown keeps 0.7 more years of income in reserve (56-realm-inside's `RI.reserveYears`).
  - Once a year (30%) it looks for an ally among its target's enemies: a realm that hates the target, holds its own grudge against it, or is its rival, and that would have it (both interests 10 or more).
  - It holds back from other wars: ×0.5 on the odds against any other neighbour.
- **Striking when the odds are good.** Inside `A.aiWarCheck`:
  - while the target's host is away at another war, the target counts at 60% of its strength (`A.cbPreview`);
  - when the target is at war elsewhere, worn out (weariness 45+), in turmoil (stability under 30) or outmatched (1.15× with friends counted), the odds rise by 1 + 5 × the plan's weight (up to ×9). Otherwise they fall to ×0.5;
  - a want presses on the opinion bar the way a claim does (15 points, `A.cbPress`).
- **Without a plan, memory still points the way.** A crown that holds a grudge of 8 or more against a neighbour, or a lasting wrong in the release's memories, or wants something of it, turns on that neighbour first: ×(1 + 1.5 × its temper, at most 2), vengeance for a wrong, appetite for a want. The log names it ("An old wrong remembered", "Wrathful ruler: does not forget").
- **The war chest opens.** The day a planned war is declared, the saved gold hires sellswords (56's `RI.hireMercs`).
- **The war log names the moment and the temper:** "The moment has come: Greyhaven's host is away, at war with Lucerna", "Vengeful ruler: carries the grudge".

### 3. Debts across generations (`debts.core.js`)

- **Two more kinds of debt** join 55's "Stood by us against …" (+16, half-life 50):
  - "Saved our capital, Kingsmere, from Varenna" (+22, half-life 60). It is written when a war in which an enemy held our capital ends without our defeat. Every realm that fought on our side is owed it.
  - "Sent grain ships in our famine" (+12, half-life 40). It is written by the release's famine-aid incident.
- **A crown honours what it owes** (`CS.owes`). The ledger must hold 12 or more for a ruler of no particular honour, as little as 6 for an honourable one, and as much as 20 for a doubtful one. A ruler who breaks faith (honour −0.3 or less) honours nothing. A crown that owes a debt:
  - **will not attack its benefactor.** `A.cbWarMul` is 0, and it will not march with an ally against it (`A.aiJoinAttack`);
  - **marches when its benefactor is attacked,** with no treaty, if it is a neighbour of either side, at peace and fit to fight. The news reads "The Kingdom of Ashmere has not forgotten: stood by us against the Horde, in 1104. It marches to the aid of Velgrad against Greyhaven." The debt is then half repaid ("honoured in 1121"), and the benefactor now owes it in turn;
  - **sends gold** when its benefactor is at war and short of it: up to a quarter of a year's income, once every three years. 56's ledger books it as gold for allies at war.
- **The ledger belongs to the realm,** so a debt outlives the ruler who incurred it, and his successor honours it by his own temper.

### 4. Rulers in line with their traits (`temper.core.js`)

20-ai-personality's weights pointed the right way and were too soft. Each of these is behind `CS.TEMPER.ON`, and none changes what a decision reads:

- **The court** (56's `RI.lean`): the crown's own lean on a push (from greed, warmth, pride, caution and war) weighs 6× what it did, against the council's balance, the treasury and custom.
- **Treaties, tribute and giving in** (20's `A.aiW`: defensive pacts, trade, non-aggression, guarantees, subsidies, embargoes, rivalries, submitting, yielding a lost war): the odds `e^(Σ)` become `e^(1.8 Σ)`. A proud ruler's odds of giving in may fall to 0.06× (from 0.3×).
- **Calls to arms** (`A.aiCallAdj`, honour and caution): 4× as strong.
- **Declaring war** (`A.aiWarHaz`): a peaceable ruler's odds fall as `e^(8 warLog)` instead of `e^(5 warLog)`.
- **The purse:** a ruler with a strong temper (0.35 or more on one axis) steers 56's spending ladder by it: warlike to the host, greedy to works that pay, zealous to temples, warm to the lords. Otherwise the court's loudest spending push steers it, as before.
- A surrender forced by a war score of 80 is the engine's, not the ruler's, and its log entry is marked `forced`.

### 5. Hoarding 0 (`gold.core.js`)

With this feature off, the bench read one flag in 10 worlds × 100 years (seed 99, Sylvaran, 1203, 7.5 years of income). Traced month by month, the treasury had not grown; the income had shrunk under it. A peace took one of Sylvaran's 15 provinces at the turn of the year, `A.updateRealmPops` recomputed its income from 897,581 to 379,924, and the same 2.85 million read as 7.5 years until the next month's windfall check made it a great work (3.0 years). 56's own windfall rule (a treasury over four years of income goes into a great work) now also runs the moment incomes are recomputed, and once more after the whole year's accounts, after every other feature's yearly code.

## Measured by

`node features/68-casus-belli/bench.mjs --html=<full build> --seeds=10 --years=100`, and again with `--off`. It plays the same 10 worlds (seeds 606 … 9191) twice on one build of the integrated world (65 features). Off is this feature switched off (`A.CASUS.ON`, `A.CASUS.TEMPER.ON`), so the comparison is like with like. With the feature off, the casus belli is still recorded, so the share can be counted.

| 10 worlds × 100 years | Off | On |
| --- | --- | --- |
| AI realm-years | 33,529 | 33,213 |
| AI wars (wars of succession and revolts) | 474 (80) | 506 (91) |
| AI wars per realm-year | 0.0141 | **0.0152 (+7.8%)** |
| Wars with a casus belli recorded | 474 of 474 | **506 of 506** |
| **AI wars citing a memory or a want** (a feud line, a lasting wrong, a want) | 15.2% | **26.9%** |
| Wars between realms citing one | 18.3% | **32.8%** |
| By world, all AI wars | 2% to 27% | 21% to 36% |
| Wars citing a feud line / a lasting wrong / a want | 44 / 40 / 27 | 65 / 69 / 76 |
| Wars struck by a crown that had planned them | none | 86, by 286 plans (6,125 plan-years) |
| Allies sworn by planners against their target | none | 133 |
| Debts written: capitals saved / grain in famine | none | 190 / 306 |
| Debts honoured: wars joined / gold sent / attacks refused (joining an ally's attack) | none | 8 / 44 / 2 |
| **Decisions in character**, where the ruler's traits pushed at all (\|lean\| ≥ 0.05) | 63.9% of 19,906 | **83.1%** of 26,642 |
| … where they pushed clearly (≥ 0.25 / ≥ 0.6) | 75.7% / 80.3% | 87.9% / 92.7% |
| … without the court's decisions | 72.5% | 79.4% |
| By kind (on): court 84.6% (34,000 decisions), embargoes 84.3%, non-aggression 84.6%, alliances 83.8%, guarantees 79.7%, calls to arms 78.6% (off 59.9%), war 76.8% (off 71.6%), submitting 76.8%, sellswords 62.9%, giving in a lost war 54.8% | | |
| D2: (decision × trait) pairs that move the declared way by 1.5× | 34 of 53 | 37 of 53 |
| Spending (spending kind × trait) pairs that move by 1.2× | 2 of 14 | 5 of 14 |
| **Hoarding flags** (a treasury over 6 years of income) | 0 (and 1 on an earlier build of the same day: seed 99, Sylvaran, 1203) | **0** |
| AI treasuries, years of income: median / p90 / max by world | 2.97 / 3.67 / 4.0–4.84 | 2.96 / 3.67 / 4.0 |
| Taxes after 100 years: Light / Fair / Customary / Heavy / Crushing | 171 / 112 / 17 / 10 / 18 | 158 / 111 / 29 / 14 / 14 |

Hoarding over every run with the feature on, across the four tunings it went through: 0 flags in 40 worlds × 100 years (four 10 × 100 runs, about 133,000 AI realm-years). The decision measure is 20-ai-personality's own: every entry of its log carries the lean, the sum of the reasons that came from the ruler's own traits. 56-realm-inside logs sellswords and aid with a trait reason only when it pushed toward them; the bench reads those two by the same weights both ways, so a peaceable ruler hiring sellswords counts against. A surrender forced at a war score of 80 would be left out; none was logged as forced.

`node tests/run.mjs <full build> --features=casus-belli` (the core suites, then):

| Test | Result |
| --- | --- |
| `csWorlds` | 3 worlds × 50 years, played on and again off. 86 AI wars, all 86 with a casus belli, all 86 in the news, 59 of 59 declared through `A.aiWarCheck` with it in the war log. Citing a memory or a want 32.6% (by world 33, 39, 28%; off 16.2%). 10 struck by a crown that had planned it. AI wars per realm-year 0.0172 on, 0.0147 off (+17% in this small sample; the bench's 10 × 100 reads +7.8%, and the test allows +30%). Decisions in character 84.6% (off 64.0%, 4,291 with a trait say). Hoarding flags 0. Example: "An old grudge: Held our capital, Greyhaven, in war, in 1129 (under King Tristan Tidewell). Also: Greyhaven's old want: to take the other half of the Grey Channel tolls from Velgrad; lately, Velgrad stirred a border incident, in 1138." |
| `csShownEverywhere` | Highland takes Solenne's capital, then declares: "An old grudge: Took our capital, Old Seat, in 1105 (under First Speaker Helga Stonefoot). Also: the cause given, an old rivalry." (lead `feud`). It is in the news, the war room ("Why it began"), the diplomacy card ("Grudges, wants and debts") and the Realm tab ("Why wars begin"). A place written as `<b>Old Seat</b>` shows as text. Drawing all four changes neither the state nor the random stream |
| `csRevengeIsPatient` | A vengeful, proud ruler with a capital taken plans (`feud`, weight 3.74). Its reserve goes 1.5 → 2.2 years. Its odds on the target at peace are ×0.5 and on another neighbour ×0.5. With the target at war elsewhere they are ×9, and the strength ratio goes 0.26 → 0.44. The war log reads "The moment has come: Solenne's host is away, at war with Highland" and "Vengeful ruler: carries the grudge". A forgiving, kind successor keeps no plan |
| `csDebtAfterDeath` | Ostra owes Solenne "Stood by us against the Horde, in 1080 (… carried by First Banker Emilio Scudieri since 1105)", 16. The ruler who incurred it is dead. Under a loyal successor the odds of attacking Solenne are ×0. When Highland attacks Solenne, Ostra marches with no treaty: "Free City of Ostra has not forgotten: stood by us against the Horde, in 1080. It marches to the aid of Solenne against Highland." The log entry has lean +0.66. The line is half repaid (8, "honoured in 1105"), and Solenne now owes Ostra 16. With Solenne at war and broke, Ostra sends 551,232. Under a fickle, deceitful successor the debt is owed 0 and Ostra does not march |
| `csNewDebts` | "Sent grain ships in our famine, in 1105 (…)"; "Saved our capital, Solenne, from Highland, in 1105 (…)" (+22) after a war in which Highland held it ended in a white peace |
| `csSaveAndOld` | A save keeps the casus belli, the plan and the record. A save without them (and without `casus` on its wars) draws the war room, the Realm tab and the diplomacy card, and plays five years |

Also on the full build: `tests/run.mjs --features=ai-personality,bonds,realm-inside,orders`: **all 37 pass**, the core suites included. Two of their numbers move with this feature. `aiPersonalityLongSim`: wars per trait-year, aggressive against peaceful, 4.89 (its bar is 1.5). `riPushesFollowNeed`: a broke crown's push for heavier taxes passes 90% of the time under a greedy ruler and 3% under a generous one (56's README: 68% and 31%).

This feature adds no events, so `tools/lint-events.mjs` and `tools/lint-choices.mjs` have nothing of its own to read.

## Rules kept

- **Deterministic.** The plan, the odds factors, the casus belli, the debts honoured and the windfall checks draw nothing: they follow from the ledger, the want, the ruler's traits and the state of the realms. The only new draw is a planning crown's yearly look for an ally (`A.chance(0.3)`). Everything else changes odds the engine already rolled.
- **Render-pure.** `UI.csWarLine`, `UI.csPlanText`, `UI.csRealmBlock`, `UI.csCard` and the wrappers on `UI.diplCard` and `UI.TAB.realm` only read. `csShownEverywhere` checks that drawing the war room, two diplomacy cards and the Realm tab leaves the state and the random stream unchanged.
- **Escaped.** Every value goes through `UI.esc`. The record's words are stored with `< > " { }` stripped.
- **Old saves.** `w.casus`, `r.csPlan` and `r.csHist` are optional. A war from an old save has no casus belli and shows none; plans form at the next New Year. Ledger lines `relief` and `grain`, and the fields `paid`, `how` and `gold` on a line, are new and optional.
- **Switchable.** `A.CASUS.ON = false` turns off everything that acts (plans, debts honoured, new debts written, the windfall checks) but still records the casus belli, so the bench can compare like with like. `A.CASUS.TEMPER.ON = false` turns off the tightened weights.
- **Two patches** (`CB-WAR-ODDS`: three terms in the war-chance calculation; `CB-WAR-ROOM`: one line in the war room). Everything else is wrappers that call the original, and event hooks.

## Writer's pass (round 7)

The causes read for a realm of either number ("Drevna were caught spying" is now "Drevna had spies taken in our halls";
"Tusk Clans is worn out" is now "the war has worn Tusk Clans thin"; "the host of Nine Winds"), possessives of names in -s
are right ("the Nine Winds' casus belli"), and a cite after "Also:" starts in lower case. The news line reads "War declared by
Velgrad. The cause given: ...", with no verb to agree and no doubled colon; this feature's test looks for `c.t` in it.
Measured on 12 bot lives of 50 years, the same seeds before and after (`/tmp/ardan/prose/harvest.mjs`, 8.4k generated lines a run): casus lines with an agreement error 5 → 0 (the checker's one remaining flag is a false positive).

## Limits

- **Wars between realms reach the benchmark's 30%; all AI wars do not.** Wars of succession and liberty revolts are a sixth of AI wars. Their casus belli is the throne or the lords' liberties, never a realm's memory, so the share of all AI wars stays a few points under the share of wars between realms.
- **Most wronged realms cannot strike at all.** In two worlds of 60 years (a scratch diagnostic), planning crowns spent most months under a truce with their target, at war, or too war-weary. Where the odds gate was the one that held, the median planner had 0.06 to 0.2 of its target's strength, counting friends, so even an absent host did not open the way. A planner that can never win waits for ever. It is patient, not suicidal, but it may also be hopeless.
- **Seven wants out of 34 name a neighbour.** The others want to keep, sell or survive, and they start no wars. A writer could give more realms a want with a target, or fears that drive alliances.
- **The court is most of the trait measure.** Two thirds of the decisions with a trait say are the court's answers to its councillors' pushes. At 6× the crown's lean, a greedy ruler mostly grants heavier taxes and a generous one mostly refuses them. Taxes at the end of 100 years are still spread much as 56-realm-inside left them, but the court matters less against a ruler's temper than 56 designed. Whether that is the right balance is a design call.
- **Spending follows traits only a little.** Of 14 (spending kind × trait) pairs, a few move the declared way by 1.2× or more. 56's ladder buys whatever is affordable above the reserve every year, so the order a temper sets changes little of the total. Works take most of the money whoever rules.
- **Some decisions still go against nature often.** Giving in a lost war (about 57% in character) is decided by the war's state far more than by the ruler. Breaking an alliance, defying an overlord and yielding to a faction are small samples near 50%.
- **"Paid our ransom" is not a debt.** AI rulers are not captured and ransomed in this world, so that kind has nothing to record.
- **Playtesters guessing an AI's answer (the step's third bar) is not measured.** It needs people.
- **Balance not run here.** The coordinator runs `bench/balance.mjs`. The war rate is about unchanged, but who fights whom and how long wars last move (a proud ruler holds out longer), so the war and noble bands could move. `bench/balance.mjs`'s `warsPerDecade` is the one to watch.
