# Learn by doing

**Aspect:** Character and life sim (Road to Ten, Character 2) · **Kind:** system

The plan asks that about 70% of growth come from use, with a monthly summary of what you gained. In the release, skills grew mostly from practice: the daily training plan and the yard. Using a skill in an event check taught 1.5 points whether you passed or failed, and nothing told you where your growth came from.

**What it does.**

- **Every gain has a source.** `A.trainSkill` is wrapped, and each gain is tagged:
  - **practice:** while the daily training plan (`A.planDay`) or a training activity (practice, yard, run, lift, study, meditate, school, spar, languages) runs;
  - **use:** everything else, meaning event checks and their outcomes, work, duels, battles, hunts, taverns and friends.
- **Weights.** Use is worth ×1.2 and practice ×0.4 (`A.GROW.USE`, `A.GROW.PRACTICE`).
- **Failure teaches.** A failed skill check is topped up when the event closes, so it teaches 1.5 times what a passed one does (`A.GROW.FAIL`).
- **The seasonal summary.** "This season you got better at Craft & smithing +9.0. 69% of it from doing, the rest from practice." It is logged as `muted`, so the Chronicle skips it. Each season's line is written at the first gain of the next. (It was monthly until a playtest pass of the screens found twelve lines a year about training burying the year's events in the log.)
- **The running share.** `A.GROW.useShare(pc)` gives the share of all growth that came from use. The person keeps `pc.grow`: this season's gains per skill, plus totals.

**How the weights were chosen.** A grid of five settings, each played as four 20-year lives by a passive bot and an engaged bot (with a training plan and an activity whenever possible):

| Use / practice / fail | Passive: from doing, points a year | Engaged: from doing, points a year |
| --- | --- | --- |
| 1 / 1 / 1 (release) | 49%, 9.0 | 45%, 15.3 |
| **1.2 / 0.4 / 1.5 (chosen)** | **73%, 9.0** | **62%, 19.2** |
| 1.0 / 0.35 / 2.0 | 71%, 10.2 | 63%, 20.3 |
| 1.3 / 0.3 / 1.5 | 73%, 11.0 | 73%, 22.3 |
| 1.1 / 0.45 / 1.8 | 66%, 9.6 | 56%, 17.7 |

The chosen setting turns growth around without inflating it for a passive life. An engaged life grows 25% faster than before, because it does more. That also moves the scorecard's check success rate, which was below its target.

**Measured by** (`test.mjs`):

- `growSources`: a practice session is tagged practice; a gain outside training is tagged use; the daily plan is practice.
- `growFailTeaches`: the same check forced to pass and to fail (on an event whose outcomes don't train that skill) teaches +1.60 and +2.38.
- `growShareAB`: the release weights against the chosen ones over three 15-year lives.
  - The share from doing goes from 44% to 67%.
  - Skill points a year go from 8.2 to 9.5, within the 20% the test allows.
- `growSummary`: a year writes 2 to 5 seasonal summaries, `muted`, each with its share from doing.

**Rules kept.**
- No draws from `A.rand`; it only scales amounts.
- `pc.grow` is optional, so old saves load.

**Limits.**
- **Doing still beats waiting.** The practice activities still exist and still work; they are just worth less than doing the thing.
- **Not the merge.** This doesn't merge the progression systems (Character 1), which needs the source.
- **The summary is in the log only.** It doesn't appear in the profile yet.
