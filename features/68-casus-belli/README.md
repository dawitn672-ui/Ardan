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
- `20-ai-personality` logged every AI decision with how hard the ruler's traits pushed toward it. This feature's bench found those decisions in character 64.6% of the time.

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
  - the news: "Velgrad's casus belli: …";
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

The one flag in this feature's baseline run (seed 8080, 1185: Ashmere, three provinces, 3.4 million in the treasury against an income of 562,000) was not a treasury that had grown. Its income had shrunk under it. `A.updateRealmPops` recomputes income from land and the tax law, and a crown that lightens its taxes or loses provinces can find the same coffers worth six years of the new income before the month's windfall check comes round. 56's own windfall rule (a treasury over four years of income goes into a great work) now also runs the moment incomes are recomputed, and once more after the whole year's accounts.

## Measured by

TBD

## Rules kept

- **Deterministic.** The plan, the odds factors, the casus belli, the debts honoured and the windfall checks draw nothing: they follow from the ledger, the want, the ruler's traits and the state of the realms. The only new draw is a planning crown's yearly look for an ally (`A.chance(0.3)`). Everything else changes odds the engine already rolled.
- **Render-pure.** `UI.csWarLine`, `UI.csPlanText`, `UI.csRealmBlock`, `UI.csCard` and the wrappers on `UI.diplCard` and `UI.TAB.realm` only read. `csShownEverywhere` checks that drawing the war room, two diplomacy cards and the Realm tab leaves the state and the random stream unchanged.
- **Escaped.** Every value goes through `UI.esc`. The record's words are stored with `< > " { }` stripped.
- **Old saves.** `w.casus`, `r.csPlan` and `r.csHist` are optional. A war from an old save has no casus belli and shows none; plans form at the next New Year. Ledger lines `relief` and `grain`, and the fields `paid`, `how` and `gold` on a line, are new and optional.
- **Switchable.** `A.CASUS.ON = false` turns off everything that acts (plans, debts honoured, new debts written, the windfall checks) but still records the casus belli, so the bench can compare like with like. `A.CASUS.TEMPER.ON = false` turns off the tightened weights.
- **Two patches** (`CB-WAR-ODDS`: three terms in the war-chance calculation; `CB-WAR-ROOM`: one line in the war room). Everything else is wrappers that call the original, and event hooks.

## Limits

TBD
