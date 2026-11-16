# Variety guard

**Aspect:** Events and story (Road to Ten, Events 5) · **Kind:** system

The plan asks for "no repeat within 10 years, no same shape back to back". In the release, an event without its own cooldown could come back after 6 years. Nothing stopped two tavern scenes, or two money troubles, from arriving one after the other.

**What it does.**

- **Cooldown.** The default cooldown is now 10 years, read from `A.EV_COOL` (patch VAR-COOLDOWN, in both event rolls). If an author set a shorter `cool`, that still wins, because some work and duty events are meant to recur.
- **Shapes.** `A.evShape(e)` gives each event one shape, read once from its title and text and cached as a non-enumerable field.
  - First, the game's own scene classifiers: tavern, street, menace, favour, errand, subordinate.
  - Then 18 themes, checked in order: fight, beast, sickness, love, faith, money, kin, letter, weather, learning, death, war, crime, court, travel, food, work, play.
  - About 81% of the release's 3,199 events get one. The largest shape, money, is 9%.
- **Guard.** `A.evVariety(e, pc)` multiplies the weight of every event being rolled (patch VAR-SHAPE-WEIGHT):
  - 0.15 if its shape is the one you just saw;
  - 0 if you have just seen it twice in a row;
  - 1 otherwise.
  - Events already waiting in the queue count as seen. Shapeless events are never held back.
- **Memory.** `S.evShapes` keeps the shapes of the last 6 events you actually saw. It is recorded when you choose, so a chain or a scheduled event counts too.
- **Side doors.** Many events never pass through the roll:
  - job duties (`A.dutyEvent`) and path flows (`A.flowEvent`) pick from small pools, with 3- and 4-year cooldowns;
  - NPC moves (21-npc-initiative) have a 2-year cooldown per kind.

  These came back every 2 to 4 years: the same guild squabble, a friend asking to borrow money again. A hard 10-year ban would empty those pools, so they get a preference instead:
  - `A.evRecency` gives a pool event seen in the last 10 years a quarter of its weight (patch VAR-POOL-RECENCY);
  - an NPC move of a kind anyone made in the last 10 years weighs a tenth (wrapping `A.NPCI.choose`);
  - both times the shape guard.

**Measured by** (`test.mjs`). The A/B test runs in one build: it switches the guard off (cooldown 6, no shape weights, no recency) and on, over the same eight 30-year lives, in the full build. Each event the roll chose is judged against the scenes the player saw just before it, whatever they were, since that is what the guard looks at. Trigger-only scenes that other systems queue (duties, NPC moves, arcs) are not the roll's doing. Round 5 found the earlier count left those queued scenes out of the sequence: travel, work, money, travel, travel read as a triple, and the same-shape share was diluted by chained scenes the guard never chooses.

| | Guard off | Guard on |
| --- | --- | --- |
| Events seen (not NPC) | 953 | 967 |
| Seen again within 10 years | 0.7% | **0%** |
| A rolled scene with the same shape as the one just seen | 5.6% | **1.0%** |
| Three of a shape in a row, the third rolled | 4 | **0** |
| NPC moves | 314 | 306 |
| NPC move seen again within 10 years | 36.9% | **15.4%** |

`varietyShapes` checks the following:

- at least 12 shapes are used;
- no shape covers more than 25% of events;
- fewer than half the events have no shape;
- the cache doesn't leak into JSON.

**Cost.** None measurable in how many events a life sees. The pacing figure in the scorecard (`p90` gap between prompts) watches for it.

**Rules kept.**
- Pure weights. No new draws from `A.rand`, though different weights mean different picks.
- `S.evShapes` is optional, so old saves load.

**Limits.**
- **Theme, not structure.** A shape is a theme, not the structure of an event. Two different "someone asks you for coin" events with different settings are not caught.
- **Fixed events.** Activities that queue one fixed event (a camp brawl after a drill) pass through the guard only as "seen".
- **NPC repeats remain.** NPC moves still repeat 16% of the time within 10 years, mostly the follow-ups of a repeated move (a loan, then its repayment).
