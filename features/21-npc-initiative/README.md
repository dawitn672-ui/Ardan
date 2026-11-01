# 21-npc-initiative: the people you know act first

**Aspect:** Relationships and people. **Kind:** system (`npc-initiative.core.js`), event pack (`npc-initiative.events.js`, 35 events, prefix `ni_`), one small patch (`patches.mjs`), tests (`test.mjs`).

Before this feature, NPCs never acted toward the player on their own initiative ("Road to 100": *NPCs do nothing first*). The bench counted **0** NPC-started moves per decade. The engine had four timers (`A.obligationsYear`), but none of them read what the NPC wants. Now, every month, the people you know weigh what they want from you, and about one and a half times a year one of them acts on it:

- they ask to borrow coin, ask you to stand with them in a feud, vouch for them, or hide them;
- they offer you a venture, offer to teach you, or offer a match for your child;
- they slander you, challenge you to first blood, steal from you, or betray a secret;
- they invite you, confide in you, or bring a gift.

Every choice has consequences: their opinion, your coin, honour and renown, flags, favours owed in either direction, rivals made, betrothals and weddings, and, years later, a follow-up event that comes back to it. The loan is repaid or it is not. The person you hid is caught, or sends thanks from over the hills. The venture pays, fails, or runs east with your stake. Each of those moments goes into a short shared history on the bond. The person view shows it under **Between you**, and later events quote it: *"You both remember 1112: you lent her 40 suns."*

## Design

### The monthly step (`A.NPCI.month`, an `A.onMonth` hook)

1. **Who.** Everyone in `pc.rel` who is alive, adult and not in prison. Most moves need the player to be grown. Teaching, invitations, confidences, gifts and slander can reach a teenager.
2. **What they want.** Each person gets a desire score for each of 14 kinds of move:

   `desire = base × bond × opinion pull × traits × situation × cast motives × recency × distance × favours`

   - **Bond.** The bond category (kin, close, teacher, foe, ex, other) leans toward a group of moves. Foes never ask favours. Kin and friends rarely turn hostile.
   - **Opinion pull.** Uses *their* opinion of you (`t.rel[pc.id]`), the number the engine itself reads, not your side of the bond. Requests, offers and warm gestures need a minimum opinion and grow stronger above it. Hostile moves need a maximum. Envy needs less dislike: each trait that strongly drives a hostile move (deceitful for slander, wrathful for a challenge, greedy for theft, fickle for a betrayal) lifts that ceiling by 15, to at most 30.
   - **Traits** multiply, as CK3's AI weights do: a greedy man borrows, a generous woman gives, a proud one won't ask. Kind and honest people almost never slander or steal.
   - **Situation** gates each kind:
     - borrowing needs a poorer asker;
     - a feud needs a living enemy of theirs;
     - vouching needs your standing;
     - hiding needs them to be in trouble this year (deterministic, from traits and fears);
     - a venture needs a trader and your coin;
     - teaching needs an older person with a trade you lack;
     - a match needs your unmarried child, class within 2, and not kin;
     - theft needs a purse worth taking;
     - betrayal needs a secret, either one you told them or long acquaintance.
   - **Cast motives.** For the 573 named cast members, keyword families read from their written `wants` and `fears` in the lazy lore (`LORE.cast[p.castId]`) weight the kinds that serve them. Money wants make loans likelier, fears of exposure make hiding likelier, and every cast member with a fear is more likely to confide it.
   - **Recency.** People you have not seen in years rarely come knocking; family always can.
   - **Distance.** Someone in another realm sends letters, not burglars.
   - **Favours.** Someone you owe asks; someone who owes you offers.
3. **Whether anyone acts.**
   - The budget fills at **1.5 a year** and banks at most 2. Every NPC-started event spends 1 from it, follow-ups included, so the total stays near 1.5 a year.
   - No calendar year holds more than **3** NPC events. Follow-ups book a slot in the year they will land in; a full year pushes them to the next.
   - Cooldowns: 3 years per person, 2 years per kind, 8 years per person and kind. Only one move waits in the queue at a time.
   - The chance of acting this month rises with the budget and the strength of the desires on offer.
4. **Which move.** The pick has two stages. First the kind, weighted by its strongest desire (plus a quarter of the rest), then the person within it. Picking straight from every (person, kind) pair let invitations crowd out the one enemy with a grudge.
5. **The event.** The move is queued as a trigger event with `ctx.pid`, `ctx.npcMove = true` and `ctx.niWhy`. The event shows their portrait (the engine does this for any `ctx.pid`). Its "Read more" holds the reasons: *"Why Maren: thinks well of you (70); your friend. She wants her son Tarn to stay across the Gordush and not raid before Return Day."* This follows the CK3 and EU4 rule of showing the "why" behind every offer. A cast member's confidence quotes their written fear.

### Consequences and follow-ups

- Choices run through `A.NPCI.act`, which does four things:
  - applies the engine's own effects (`A.applyFx`), with opinion changes scaled by `STAKE` (1.25), because a loan or a betrayal should move a bond further than an evening's talk;
  - writes a line of bond history;
  - optionally marks the bond (`niTold`: you told them a secret, which they may later betray; `niConf`: they confided in you);
  - optionally schedules a follow-up through `A.schedule` (`forced`, so it is never filtered out by class or by the 240-day repeat guard). Its setup drops it quietly if the person has died.
- Which follow-up comes back is decided when you choose, from who they are (`A.NPCI.outcome`). Honest borrowers repay more often. Deceitful partners run off with the stake. A cruel slanderer starts again instead of making amends.
- Each follow-up's `cond` reads its parent's flag (`C.flag(p, "ni_lent")` and so on), so the static analyzer sees the memory link.
- The first-blood challenge is a real duel (`lethal: false`). `A.DUEL_END.niChallenge` records how it went and books a rematch or a gloat.
- A match creates the betrothal: to their real child if they have one of the right age and sex, otherwise to a relative they spoke for, created on agreement. The wedding follow-up marries the two and makes the spouse your in-law.

### Shared bond history

- `pc.rel[pid].hist` holds `[{y, t}]`, the last 12 entries. It is written by `A.bondNote(pc, t, text)`, a shared helper any feature may call.
- Writers:
  - every choice in these 35 events;
  - the interaction buttons (`A.interact` is wrapped; trivial repeats in the same year are deduplicated);
  - get-to-know (`A.getToKnow` is wrapped);
  - the duel end handler.
- `UI.bondHist` renders it in the person view under **Between you**, right below the opinion bar (patch `NPCI-BOND-HIST`). It is pure and escaped.
- Events quote the latest non-trivial entry from an earlier year as `{past}`.

### Rules kept

- Deterministic. Only the monthly step, choices and follow-up rolls draw from `A.rand`. Setup picks wording with a stable hash of ids and year, so it does not matter who asks for the view first.
- Render-pure: tested by opening every known person's view every year.
- Every value is escaped with `UI.esc`. There are no inline handlers.
- Old saves without `pc.npci`, `hist` or the marks load and play on.
- All 35 events are `npc: true, trigger: true`, with 3 or 4 choices of at most 12 words and text within 80 words, as rendered with a real person. The linter passes and `npcInitiativeEvents` plays every choice.

## The 14 moves

| Group | Move | Event | Opinion | Driven by (traits) | Cast motives | Follow-ups |
| --- | --- | --- | --- | --- | --- | --- |
| request | borrow coin | `ni_borrow` | ≥ 10 | greedy, humble, impetuous; not proud | coin, kin | `ni_borrow_repaid` / `ni_borrow_default` |
| request | help in a feud | `ni_feud` | ≥ 20 | wrathful, proud, stubborn, brave | feud, war | `ni_feud_after` |
| request | vouch for them | `ni_vouch` | ≥ 15 | ambitious | status, kin | `ni_vouch_good` / `ni_vouch_bad` |
| request | hide them | `ni_hide` | ≥ 25 | (trouble from deceitful, wrathful, impetuous) | hide | `ni_hide_caught` / `ni_hide_thanks` |
| offer | a venture | `ni_deal` | ≥ 0 | greedy, ambitious | trade, coin | `ni_deal_profit` / `ni_deal_loss` / `ni_deal_gone` |
| offer | an apprenticeship | `ni_apprentice` | ≥ 15 | kind, patient, generous | teach | `ni_apprentice_end` |
| offer | a match for your child | `ni_match` | ≥ 10 | ambitious, gregarious | kin, status | `ni_match_wedding` |
| hostile | slander | `ni_slander` | ≤ −10 (+15 per driving trait) | deceitful, cruel, fickle, ambitious | status, feud | `ni_slander_mend` / `ni_slander_again` |
| hostile | a challenge | `ni_challenge` | ≤ −20 (+15 per driving trait) | wrathful, brave, proud, impetuous | feud, war | duel, then `ni_rematch` |
| hostile | theft | `ni_theft` | ≤ −5 (+15 per driving trait) | greedy, deceitful | coin | `ni_theft_return` / `ni_theft_again` |
| hostile | betrayal of a secret | `ni_secret` | ≤ 5 (+15 per driving trait) | fickle, deceitful, cruel | status, hide | `ni_secret_cost` |
| warm | an invitation | `ni_invite` | ≥ 25 | gregarious, generous | faith, kin | `ni_invite_return` |
| warm | a confidence | `ni_confide` | ≥ 40 | honest, loyal, shy | fear (all cast) | `ni_confide_test` |
| warm | a gift | `ni_gift` | ≥ 35 | generous, kind | kin, faith | `ni_gift_favor` |

## What it learns from

The comparisons draw on the research in `docs/benchmarks/relationships.md`.

- **Crusader Kings III.**
  - AI characters choose interactions by weights their traits set. Here, each trait multiplies each kind of move.
  - Courtiers come to you with requests, and favours work like weak hooks. Here, a person you owe is likelier to ask, and one who owes you is likelier to offer.
  - Every offer shows its reasons. Here, that is the "Why ..." line.
- **RimWorld.**
  - Social interactions start on their own, weighted by opinion and traits: a lot of small warmth, rare escalations.
  - The storyteller paces events. Here, the budget and the yearly cap keep NPC moves from turning into spam. "Road to 100" warned that "3 plots per decade" is met by spam.
- **Middle-earth: Shadow of Mordor (Nemesis).**
  - An enemy who survives comes back and speaks of how you last met. Here, the rematch after a first-blood duel, slander that returns grown or as amends, and every event's `{past}` line ("You both remember ...").
- **The Sims 2.**
  - Each Sim had visible wants and fears. Ardan had already written 573 of them and never read the fears. Here, they drive moves and are quoted in them.
- **Wildermyth.**
  - Events are cast from your own people, history lines are specific, and people stay in character. Here, people move only toward what their traits and situation support. A kind, honest person almost never slanders you.

## How it is measured

- **Acceptance:** `node bench/run.mjs <built.html> --label=tmp-npc --only=league --lives=8`, reading `npcMovesPerDecade`. The bot counts events with `npc: true` or `ctx.npcMove`.
- **Opinion share and kind mix:** a private script ran the bench's own bot (`B.life`, careful, engaged and passive alternating, 16 lives, 841 life-years). It wrapped `eventChoose`, `advance`, `choiceChoose`, `doActivity`, `eventClose` and `duelClose`, and summed the absolute change on both sides of every player bond. This is the method of `docs/benchmarks/relationships.md` §3, except that it counts only tagged NPC events.
- **Tests** (`node tests/run.mjs <built.html> --features=npc-initiative`):

| Test | Checks |
| --- | --- |
| `npcInitiativeBudget` | 4 lives × 20 years from age 22: no calendar year over 3 NPC events (each queue item counted once), total ≤ 1.5 a year plus the bank, person and kind cooldowns held in the move log, at least 3 a decade |
| `npcInitiativeHistory` | an NPC event, an interaction and get-to-know each write history; capped at 12; the person view shows it under "Between you"; markup in a loaded save stays escaped; rendering leaves the random stream and state untouched |
| `npcInitiativeDeterminism` | same seed gives the same sequence of moves (year, event, person) and the same end state, with or without opening every known person's view, plus the People and Life tabs, every year for 15 years |
| `npcInitiativeEvents` | all 35 events, every choice, with a real person, child and foe: renders whole (no raw tokens, ≤ 80 words, labels ≤ 12 words), resolves without engine errors, writes history; each primary's follow-ups play from the state its own choice left; the duel end books a rematch |
| `npcInitiativeCast` | a cast member's motives come from their written text; their confide desire beats a plain NPC's; the confidence quotes their written fear; the why line quotes their written want |
| `npcInitiativeOldSave` | a state stripped of `npci`, `hist` and marks loads, plays 6 years, and renders person views |

## Before → after

| Metric | Before (fix layer) | After | Source |
| --- | --- | --- | --- |
| `npcMovesPerDecade` (bench league, 8 lives) | **0** | **11.7** | `bench/run.mjs --only=league --lives=8` |
| `npcMovesPerDecade` (bench league, 64 lives) | **0** (`reports/fixes.json`) | see below | `--lives=64` |
| Memory share of fired events (8 lives) | 1.4% | **9.6%** | same run; follow-ups read their parent's flag |
| NPC-started events a decade (16 lives) | 0.8 (untagged engine timers, per the research doc) | **10.6**: 4.9 first moves + follow-ups | private bot script |
| Hostile share of first moves | none | **19.8%** (about 10% in the research doc's backtest of an earlier draft) | private bot script |
| Most common kind, share of first moves | n/a | 16.9% (invitations were 20% in that draft) | private bot script |
| Different people making moves, per life | about 1 (your superior) | 3 to 26, median about 16 | private bot script |
| Share of opinion change on your bonds from NPC moves | 3.7% (research doc) | **25%** (plan gate: 30%) | private bot script |
| Worst calendar year | n/a | 3 (cap 3) | `npcInitiativeBudget` |

The 64-life run's numbers, once in: <!--64-->

Median death age moves between runs because lives diverge after the first move. The official 64-life fix-layer run has it at 45. 8-life runs gave 73 for the fix layer and 49 to 53 with this feature. Over 16 bot lives, no death traces to an NPC move: the causes are fevers, accidents, a tiger, old age and a road bandit. First-blood duels are not lethal.

## With CK3's or RimWorld's budget

What a studio-sized version adds, and where this one stands:

| Capability | CK3 / RimWorld / Nemesis / Sims | Here |
| --- | --- | --- |
| NPCs start things toward you | Monthly AI pulses; Hold Court brings 3 petitioners a session | Yes: 14 kinds, desire-driven, budgeted |
| Reasons shown | CK3 lists every opinion modifier and every "why" | A why line on each move. No itemised opinion ledger: the history is text, not the sum that makes the number |
| Memory that returns | Nemesis captains greet you with your last fight; CK3 memories | `{past}` lines, follow-ups 1 to 3 years later, rematches |
| Schemes with hidden progress and discovery | CK3: monthly progress, agents, discovery | **No.** Hostile moves land in one step |
| NPC-to-NPC social web | RimWorld: everyone talks to everyone | **No.** Only feuds cool or betrothals form between NPCs |
| Written wants and fears drive behaviour | The Sims 2 panel | Keyword families from the cast's text weight moves; quoted in confidences and why lines |
| Two-axis bonds (warmth and trust) | The Sims 4 tracks (unverified) | No: one number per side |

## Limits and open issues

- **First moves come to 4.9 a decade**, just under the research doc's suggested 5 to 15, because follow-ups spend the same budget. Raise `RATE`, or charge follow-ups less, if more first moves are wanted. The cap of 3 a year still holds.
- **Opinion share is 25%,** short of the plan's 30% gate. The rest comes from yearly decay and drift and from the player's own event choices. `STAKE` is the knob.
- **No schemes with hidden progress, and no NPC-to-NPC social life.** These are plan steps 3 and 6.
- **Moves are decided at a stroke.** A follow-up's outcome is rolled when you choose, not simulated in between.
- **Quiet mode auto-resolves first moves,** like any non-forced event. Follow-ups are forced, so they always show.
- **The person view's "Opinion of you" bar shows your side of the bond** (research finding R3). Desire and the why line use their side, which is what the engine reads elsewhere. The bar was left alone because it is not this feature's to change.
- **The engine's own NPC timers stay untagged:** `A.obligationsYear` (superior, favour called in, enemy strikes, sworn sibling). They do not count in the bench and do not spend this budget.
- **The bench double-counts events that start a duel.** The duel is put in front of the resolved event, and the bot visits the event again afterwards. The tests count queue items once.
- **Fix-layer render impurities found while testing, not fixed here** (they are outside this folder):
  - Drawing the Holdings tab can create people and draw from `A.rand`: `UI.staffCard → A.staffCands → A.makeAcquaintance`. It shows up over 15+ years of drawing every tab, at 1110 to 1112 for seed 4711. This is why `npcInitiativeDeterminism` draws person views and the People and Life tabs, not every tab.
  - Drawing the Path tab writes `job.rep` the first time.
  - Drawing the Holdings tab writes `pc.cargo` the first time (known and harmless).

## For other features

- `A.bondNote(pc, person, text)` adds a line to the shared bond history.
- `A.NPCI.histOf(pc, person)` reads it.
- `A.NPCI.follow(pc, ctx, eventId, minDays, maxDays, extra)` books an NPC follow-up inside the yearly cap.
- `A.NPCI.KINDS` holds the desire table. `A.NPCI.RATE`, `CAP`, `STAKE` and the cooldowns are the tuning knobs.
