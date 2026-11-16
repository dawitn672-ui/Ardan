# 99972-unit-work: the unit's work, month by month

**Aspect:** the playtest (owner order 54, P3; D-062 addendum) · **Kind:** one readable core file (`work.core.js`), a test;
a guard in the release's `A.milYear` (`src/core/release/core/08-soldiering.js`).

**Why.** "When in an army it took a year and months to be given my first mission." The release queued a soldier's mission
only at the year's turn (`A.milYear`): at war every year, at peace on a 55% coin. A man who enlisted in February waited
to January at best, and one peaceful year in two brought nothing.

**What it does.** Each month (`A.UNITWORK.month`), for a soldier on the rolls (or a sellsword under contract), below rank
7 (commanders keep the War Room), not in prison, with no mission waiting and none in the last 45 days:

| Situation | Odds a month | The reason given |
| --- | --- | --- |
| A new man, no mission yet | none in his first 25 days, then 0.4 a month; certain by day 100 | "{Officer} wants to see what the new man is made of" |
| The unit's realm at war | 0.4, 0.5 from rank 2 | "{War}: {officer} needs men forward" (a mission of that war, against its enemy) |
| At peace | 0.10, +0.12 if the realm's stability is under 40, +0.08 if the officer thinks well of you (30+), +0.05 for ranks 1 to 3 | the largest part: a patrol on the roll, outlaws on an unsteady realm's roads, an officer who trusts you, the junior ranks sent first |

The mission carries its reason (`m.why`) and the story log says it with the month. The yearly mission of `A.milYear`
waits when the unit had work in the last 90 days (`A.UNITWORK.recent`), and sets `pc.mil.lastMisD` when it comes.

**State.** `pc.mil.joinD` (the day you enlisted, set by `A.enlist`; for an old save, the day the month hook first saw you under arms) and `pc.mil.lastMisD`; an old save gets both
the first month it runs.

## Test

`uwFirstMission`: five recruits on four realms; each meets a first mission within 130 days of enlisting (most within
four months), at least two in two years for those still serving, each with a reason; the same seed gives the same world.
