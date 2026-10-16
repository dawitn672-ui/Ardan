# The realm from inside

**Aspect:** Diplomacy and politics (Road to Ten, Diplomacy 2, 3 and 5) and Economy (Economy 6) · **Kind:** system, 3 patches, 4 events, plus a world audit (`audit.mjs`)

The plan asks for four things here:

- **Diplomacy 2.** "Councillors, vassals and claimants are named NPCs with goals; factions are groups of those people, not a meter."
- **Diplomacy 3.** "Laws, taxes, vassal deals, and succession fights with named claimants. Civil wars come from real factions."
- **Diplomacy 5.** "AI treasuries pay for armies, buildings, bribes and mercenaries. The world audit's hoarding flag must read 0."
- **Economy 6.** "Money sinks that matter: upkeep, taxes, bribes, retainers, ransoms, rebuilding after raids."

In the release only the player's own realm had a council. AI decisions read a councillor's skill and nothing else. AI realms never changed a law (apart from a liberty faction's concession). The surplus above three years of income was burned, 85% of it each year, for +1 stability. On today's fix layer, over 3 worlds × 30 years, that burned **65–67% of all AI income**. The player paid for their way of living and the upkeep of property, and for nothing else.

## What it does

**A court of people** (`court.core.js`)

- **Every realm's five seats are filled with named people from the first day.** The candidates are:
  - cast members whose own title fits the seat (Aldmark's Marshal is Garrick Harrow, "Lord of the Southern March"; a cast "Treasurer" becomes treasurer);
  - the heads of the realm's four strongest houses;
  - the ruler's kin, whom a paranoid ruler prefers.
- **Seats change hands.** A dead councillor is replaced. A new ruler brings favourites (each seat has a 35% chance of changing). Every change is recorded.
- **Every court person has a want and a fear** (`RI.aims`), worked out from three sources:
  - their traits;
  - their house (a soldier house wants war, a trading house wants gold);
  - for the 573 cast members, the wants and fears written for them in the lore. The card shows those in the cast member's own words.

  There are 8 wants (war and glory, peace, gold for their house, a strong crown, the lords' liberties, the faith, works, the throne) and 6 fears (war, debt, a tyrant crown, the commons in arms, the gods' anger, a rival house). Only royal blood or a great house can want the throne.

**The yearly court** (wrapper of `A.factionsYear`)

- **The councillors and the four strongest house heads each lean on ten pushes.** Six are laws: heavier or lighter taxes, crown authority, levies. Four steer spending: the host, works, temples, a pension for one's own house.
  - Each person's lean comes from their want, their fear, their seat (a treasurer worries about the treasury, a marshal about the host) and the realm's state.
  - A push away from the realm's own custom loses force.
- **The loudest law push goes before the crown.** What the realm plainly needs is heard first: an empty treasury, a war.
- **The odds come from five things:** the weight of the pushers against the opposers, the ruler's temper (greedy, generous, proud, cautious, warlike), the treasury, the realm's stability, and, for taxes, the realm's custom.
  - **Custom pulls taxes home** (`RI.custom`). Each realm's customary tax is its tax law when the court first sat (`r.riLaw0.tax`; Customary in every starting realm). A tax push one step further from it is weighed down by 0.15 for each step it would then stand away; a push back toward it is weighed up by 0.12 for each step it now stands away. The record names it: "Taxes have always been customary here".
- **At most one law changes a year.** Every house feels it (heavier taxes cost −4 loyalty, more crown authority −8). The pushers' houses gain loyalty and the opposers' houses lose it.
- **Taxes now weigh on the lords of AI realms too.** Before, only the player's own realm felt them.
- **The loudest spending push steers next year's treasury.**
- **The decision is logged with the person who pushed it and why.** It goes into the realm's court record and, when 20-ai-personality is built, into its "Recent decisions of rulers".

**Vassal deals.** When a faction is close to rising (discontent 40 or more, power 22% or more), the crown has three answers:

- pay its leading house a pension from the treasury;
- give the faction's leader a council seat, displacing someone;
- refuse.

Which one it picks depends on the ruler's caution, warmth, pride and greed, and on whether it can afford the pension.

**Factions are people.**

- A house head joins the faction their want calls for: crown → claimant, liberty → liberty, glory → war party, peace → peace party.
- Councillors who share a faction's aim add up to 15% to its power (`A.factionPower`).
- Every faction's leading house has a named head. A revolt is logged with its leader's name, what they want and the demand the crown refused.

**Succession fights with named claimants.**

- `A.findClaimant` weighs blood (child 3, sibling 2.5, great house head 1) by ambition (wanting the throne doubles it) and by the backers each candidate could count on. The player stays a candidate exactly where the release put them.
- The claimant's army is what their backers bring: their own house, the claimant faction, and houses with loyalty below 30. It is 22% plus 90% of the backers' share of the realm's swords, between 25% and 65%. Before, it was a random 30–60% (patch `RI-CLAIM-ARMY`).
- The backers are named in the news.
- After the war:
  - if the claimant wins, the backers gain 25 loyalty and the houses that stayed loyal lose 10;
  - if the claimant loses, the backers lose 20 and each backer's head is beheaded with a 35% chance.

**The player at court** (`view.core.js`). The court card is in the Realm tab, and in "Court & factions" for rulers. It shows:

- the council, with each person's want and fear (hover for their own words);
- the great lords, with their loyalty, want and faction;
- each faction's leader and the councillors who lean its way;
- what is before the court at the New Year: who presses for it, who opposes and why, and the odds now;
- the last six decisions with their reasons.

The player can act on it:

- **Speak for or against** the next item (1 initiative). This adds the player's weight: 1 for a councillor, otherwise 0.25–1 by rung and fame.
- **Send a gift** to the pusher. This is a bribe: it buys opinion, and a second gift in one year buys much less.
- **Be asked for their voice.** The coming item's pusher may ask, with a 10% chance a month and at most once every 3 years. This is an NPC move, `ri_court_ask`, and it shares 21-npc-initiative's budget.
- **As ruler, hear the council's loudest push as a petition** (`ri_court_push`): grant it, refuse it, or put it off with a gift from your own purse.

**Gold gets used** (`treasury.core.js`, patch `RI-SPEND-NOT-BURN`). The burn is replaced by a ladder the AI crown pays down every year:

1. **Sellswords at war.** Up to 20% of the normal host, at 10 suns a man a year (a standing soldier costs 3.2). They are renewed each year at war and dismissed at peace.
2. **What is owed every year.** The upkeep of works (2% of their cost, as for the player) and the council's pay (0.3% of income each, paid to the named councillors).
3. **Above a reserve set by the ruler's temper** (1.5 years of income, more for greedy or cautious rulers, less for generous ones, between 0.8 and 2.5), in an order weighted by temper and by last year's spending push:
   - drill and arms;
   - works: farms, markets and ports once each, walls on threatened borders, temples, barracks. A work is priced by its province's share of the realm, to pay for itself in about 15 years. A crown builds no more than it can keep up: works upkeep stays under 25% of revenue;
   - feasts for sullen lords;
   - gold for allies at war;
   - great works (a cathedral, a palace, a harbour mole) every 8 years. These have no ceiling: each costs more than the last.
4. **A windfall goes into stone the same year.** A windfall is a treasury above 4 years of income, for example from an indemnity, tribute, or a realm shrunk to nothing. Everything above 3 years becomes a great work.
5. **Still over 3.5 years with nothing left to buy:** the taxes are lightened, but no further than one step under the realm's custom (Fair, for a Customary realm). Below that the surplus waits for a windfall's great work.

Every sun is booked by category (`r.riBook`). The court card shows "The crown's purse", last year's ledger.

**Money sinks for the player** (`purse.core.js`, patch `RI-MONEY-BOOK`). The Holdings tab now shows "Where the money goes": this year and last, line by line.

- The release's own lines: holdings income, allowance or stipend, upkeep of holdings, how you live, children, moneylenders, wages, a soldier's pay, rents, a councillor's stipend, the crown's share.
- The new sinks:
  - **Upkeep.** A horse eats 4–90 suns a year (half if the army feeds it; nothing if a rich household keeps a stable). Knights and lords keep household knights and men-at-arms: 12% of the rung's income. Gentry keep a squire and a groom (20). A royal keeps a household (150). A steward, castellan or factor is paid 25 + skill/2.
  - **Taxes.** They go into your realm's treasury, at its tax law, which the court now moves. There is a hearth tax and tallage (2–10 suns plus 2–5% of wages). It is not charged where a realm-bible custom already taxes your kind of life every year (47-realm-bible's hearth mark, arrow tax and so on). Everywhere, the crown takes a tenth on rents: 8% of holdings income and 3% of a lord's rents.
  - **Bribes.** Fines and bribes to the law are booked as a line. Gifts at court are a new sink.
  - **Ransoms.** After a lost battle you can be taken (event `ri_taken`). The odds are 5–20%: officers and the well-born are worth keeping. The price is 10 suns for a peasant, 390 for a gentry captain, and 60% of a year's rents for a lord. You can pay it (it goes to the captor's treasury), write to your patron (they pay and you owe them), run, or wait for an exchange.
  - **Rebuilding.** An enemy that holds the province of one of your holdings, or has troops in it, can burn the holding (event `ri_burned`). The chance is 8% or 4% a month, less behind walls. A burned holding pays nothing until you rebuild it: 40% of its price, or your own work and timber, or you sell the ruin. It can be rebuilt later from the Holdings tab.

## Measured by

`test.mjs` (all 14 pass on the full world build, with the core suites). Numbers are from the full build:

| Test | Result |
| --- | --- |
| `riCourtOfPeople` | 34 realms: **170/170 seats** held by named people (160 cast, 51 house heads, 20 whose own title is the seat's). Every one has a want and a fear. All 8 wants and all 6 fears occur. |
| `riPushesFollowNeed` | Broke (2 months in the treasury, debt 1.5 years): the loudest push is heavier taxes, 43% to pass (custom weighs against it). Rich (4 years): the loudest is lighter taxes (66%), and heavier taxes only 3%. Broke under a greedy ruler 68%, under a generous one 31%. A held session raises taxes 1 → 1.2 and names the Treasurer who pushed; its reasons end with "Taxes have always been customary here". |
| `riCourtInTheWorld` | 3 worlds × 30 years, 2,990 AI realm-years: **2,948 law pushes decided** (693 passed, 2,255 refused), **100%** naming the person who pushed it and why (98.6% with 2+ reasons). 105 vassal deals, 201 seats changing hands, every claimant with named backers. Faction-years led by a named head with aims: **100%**; backed by a councillor: 41.6%. Taxes at the end: Light 29, Fair 35, Customary 22, Heavy 13, Crushing 1, so **30% at an extreme** (the bar is 60%; before the custom pull, 62 of 99). Authority: Low 34, Limited 31, High 14, Absolute 21. |
| `riClaimantBackers` | A claimant's share of the army: **32%** when every house is loyal, **65%** when the stronger half hate the crown. The war gave them 65%. The news names three houses declaring for her. After the claim failed, the backers lost 15+ loyalty each and 4 heads were taken. |
| `riGoldGetsUsed` | 3 worlds × 30 years, 3,036 AI realm-years: **hoarding flags 0; burned 0%** of income (the fix layer burned 65–67%). Spent as a share of income: host upkeep 12.9%, works 58.5%, works upkeep 12.1%, council's pay 1.6%, drill 1.7%, pensions and feasts 0.9%, recruits 0.6%, sellswords 0.3%. Treasury median 1.89 years of income, p90 3.1, max 4.0. (Earlier, before 38-orders and the custom pull: host 13.1%, works 60.3%, median 1.85, max 4.6.) Armies ÷ normal p10/50/90 0.80/1.01/1.28 (fix layer 0.70–0.80 / 1.00–1.03 / 1.24–1.34). Stability 35/56/72 (fix layer 31–33 / 51–52 / 73–75). **0.018 wars a realm-year** (fix layer 0.020–0.022 on the same seeds). |
| `riPlayerMoney` | A viscount in Greyhaven at heavy taxes: holdings +502, allowance +250, holdings upkeep −128, living −320, destrier −60, men-at-arms −1,080, steward −50, hearth tax −12, tenth on rents −48. The crown's treasury got exactly the 60 paid. In Aldmark the hearth mark (47) already taxes free folk: no hearth line, tenth on rents −68. |
| `riRansomAndRaid` | A gentry captain (20% odds of being taken): ransom 390, paid 390, captor's treasury +390. A farm burned by an occupying enemy pays 0 that year, is rebuilt for 120 (40% of its price), then pays 43. The Holdings tab lists both lines and draws purely. |
| `riCourtCardAndVoice` | The card names 5/5 councillors with wants and fears, escapes names (`<b>` in a name stays text), and draws without changing state or the random stream. Speaking for the item costs 1 initiative and adds 0.78: support 4.25 → 5.03. |
| `riScenesRender` | All 4 scenes, 18 choice outcomes (both sides of each check): no raw token, longest text 57 words, longest label 8. |
| `riRulerHearsCouncil` | A ruling player hears "Rufus, your Treasurer, has the floor…"; granting it raises taxes 1 → 1.2, and the record notes it as the ruler's answer. |

**World audit** (`node features/56-realm-inside/audit.mjs --html=… --seeds=10 --years=100`, one browser, about 13 minutes a build):

| 10 worlds × 100 years (seeds 606 … 9191) | Fix layer (features 00–09) | With this feature (full build) |
| --- | --- | --- |
| AI realm-years | 32,453 | 33,225 |
| Hoarding flags (treasury over 6 years of income) | **74** | **2** (0.006%; the worst 8.2 years, both windfalls landing between two spends) |
| AI income burned | **84.6%** | **0%** |
| Spent, as a share of AI income | host upkeep 14.4%, nothing else booked | host upkeep 17.0%, works 54.0%, works upkeep 25.1%, council's pay 1.6%, drill 1.4%, pensions and feasts 0.9%, recruits 0.5%, sellswords 0.3% |
| Wars per realm-year | 0.016 | 0.016 |
| Wars of succession / liberty revolts | 79 / 28 | 72 / 29 |
| Stability median by world | 48–54 | 49–55 |
| Army ÷ normal, median by world | 1.03–1.11 | 1.00–1.07 |
| Law pushes decided / passed | 0 / 0 | 32,131 / 7,542 |
| Vassal deals (pensions, seats, refusals) | 0 | 1,798 |
| Claimants with named backers | none named | 66 of 66 |
| Faction-years led by a named head | 5,561 of 28,948 (19%) | 41,399 of 41,404 (100%) |
| Taxes after 100 years | all 31–33 realms Customary | Light 20–27 realms a world, Crushing 1–5, the rest between (before the custom pull; see the next table) |

**Taxes over time** (scratch harness: 8 worlds, seeds 5603–5605, 606, 1212, 2424, 4848, 7, a peasant player, the full build; AI realms only):

| After | Without the custom pull | With it |
| --- | --- | --- |
| 30 years | Light 140, Fair 44, Customary 31, Heavy 34, Crushing 19 of 268: **59% extreme** (49–69% by world) | Light 70, Fair 116, Customary 41, Heavy 32, Crushing 8 of 267: **29% extreme** (15–35%) |
| 60 years | 226 Light of 262: **89% extreme** (80–94%) | Light 126, Fair 108, Customary 14, Heavy 8, Crushing 4 of 260: **50%** (39–59%) |
| 100 years | Light 214, Fair 15, Customary 8, Heavy 4, Crushing 15 of 256: **89% extreme** (79–94%) | Light 134, Fair 80, Customary 24, Heavy 9, Crushing 7 of 254: **56%** (45–66%) |

So the test's 60% bar after 30 years was not noise around a stable world: pooled, the world sat on the bar at 30 years (59%) and went on to 89% by 60. Most of the slide was the treasurer's remit, which lowered taxes with no court weighing: over 2 worlds × 100 years it made 202 of the 337 cuts, 113 of them to Light. Bounded at one step under custom, it made 397 cuts in 8 worlds × 100 years, 5 of them to Light. The court's weight alone could not hold the world (0.1 to 0.2 a step with the remit unbounded: 76–81% extreme after 100 years, 4 worlds). Hoarding stays at 0: `audit.mjs`, 3 worlds × 100 years (9,773 realm-years), 0 flags and 0% burned.

`tools/lint-events.mjs` passes with 0 errors and 0 warnings. Its browser pass declines all four events, which are trigger-only, so `riScenesRender` renders them instead. `tools/lint-choices.mjs` finds 0 obviously best choices.

## Rules kept

- Engine paths draw dice with `A.chance`, `A.rf`, `A.ri`, `A.pick` and `A.wpick`. The court card, the ledger and the money breakdown only read; `riCourtCardAndVoice` and `riRansomAndRaid` check that state and the random stream are unchanged.
- New fields tolerate old saves: `r.council` for AI realms, `r.riCourt`, `r.riAgenda`, `r.riPri`, `r.riBook`, `r.riWorks`, `r.riGreat`, `r.riLaw0` (and its `tax`, read as Customary when an older save lacks it), `d.riMerc`, `w.riBack`, `pc.riPurse`, `a.burnt`. A save without them fills its councils at the next court and starts an empty book.
- Wants and fears are worked out from the person and cached outside the save.
- Every interpolated value goes through `UI.esc`. Actions use `data-a`: `riVoice`, `riGift`, `riRebuild`.
- New effect keys are declared in `FX_EXTRA`: `riRansom`, `riRebuild`, `riCourt`, `riVoice`.
- The ask event is an NPC move (`npc: true`, `ctx.npcMove`) inside the shared NPC budget.
- The feature works with and without 20-ai-personality and 47-realm-bible. Without them it uses a small fallback trait table, and its tax applies everywhere.

## Limits

- **Taxes still drift light, more slowly.** With the custom pull, 26% of realms sit at Light after 30 years and 53% after 100 (without it, 52% and 84%). Lords want lighter taxes more often than councillors want heavier ones, and most realms make far more than their armies cost. The drift feeds itself: the court reads the treasury in years of *income*, and a lighter tax lowers the income, so the same coffers read as more years and argue for lighter taxes again. Light is then hard to leave (a rich crown's push for heavier taxes passes about 3% of the time). Whether a world where half the realms tax lightly after a century is wanted, and whether the court should read the treasury against its spending instead, is a design call. A few realms sit at Crushing: poor realms whose armies outrun their income. Once the works are built (upkeep at its cap of a quarter of revenue), treasuries settle near 3 years of income and the money goes to upkeep, great works and lower taxes.
- **The hoarding flag reads 2, not 0, in 33,225 realm-years.** Both were windfalls (an indemnity) landing between two monthly spends, at 6.9 and 8.2 years.
- **Authority swings too.** After 30 years a quarter of realms are Absolute and a third are Low.
- **Works carry most of the money: about 60% of AI income.** Their effect on realms is bounded: income buildings once per province, upkeep capped at a quarter of revenue, temples calm a realm only up to stability 60, great works add legitimacy only up to 90. Median realm income still grew about 15–30% over 30 years, against about 11–17% on the fix layer.
- **Sellswords and subsidies are small** (0.2% and about 0%): wars are a small share of realm-years, and allies at war are seldom broke.
- **The court is the AI's, not a stage.** Pushes are decided once a year with no debate and no player schedule beyond speaking and gifts. A player-ruler hears one petition a year, at most.
- **Holdings are assumed to be where they were bought.** Raids read that province. The player's own ruled realm keeps the release's budget: its works are the player's.
- **Balance:** not run here; the coordinator runs `bench/balance.mjs` on the integrated build. Bands likely to move: noble and royal `medianPeakCoin` down (men-at-arms at 12% of rents, the tenth on rents, horse keep, ransoms of up to 60% of a year's rents), and perhaps the merchant's. Councillors' stipends fall where the court lightens taxes. Because AI seats are now filled, `A.seatOffers` finds fewer empty seats, so "officer of state" arcs may thin, which could touch `arcTypes`.
