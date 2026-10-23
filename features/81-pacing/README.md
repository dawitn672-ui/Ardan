# Pacing

**Aspect:** Pacing and core loop (the scorecard's "Prompts per in-game year", target ≥ 6; `replayability-pacing.md` P2, P4 and step 3, "a director floor") and Character and life sim (the scorecard's "Initiative actions per year (engaged bot)", target ≥ 6, and "Check success rate in bot lives", 45–65%, scored best at 55) · **Kind:** system (two core files, no patches, no events), plus tests

Three numbers sat just short of their bars: prompts per year (5.1 to 5.6 in recent league runs), initiative actions per engaged year (4.7 to 5.0) and checks won (49 to 51%). Each had one cause in the game, and each fix is a rule a player can see and say in a sentence.

## Why the numbers were short

Measured on 16 engaged and 13 mixed bot lives of the full build, the same seeds, starts and personalities as `bench/run.mjs`'s league, with a probe that logs every prompt, every initiative attempt and every check.

| Number | What the bot lives showed |
| --- | --- |
| **Prompts** | Adults are not the problem: 8 to 9 prompts a year for an engaged life, a median gap of 31 days. **Childhood is.** A child (humans 3 to 12) meets 2.3 prompts a year, with a median gap of 120 days and one gap in ten over **414 days**; an infant's p90 is 608 days. The release's director (`A.monthEvents`) rolls one fixed chance a month by stage (17% for a child) and nothing raises it after a quiet stretch. Elves and dwarves spend decades in those stages, so their lives sit at the bottom of the league's median (3.4 to 4.0 prompts a year). |
| **Initiative** | The engaged bot never lacked something to do: **"Not enough initiative" ended 72% of its attempts.** Initiative refills at your free days a year, spread evenly over the days (`freeTime / 365`, 7 a year for an adult, 4 for a child, none before 3), and the year turn keeps what is left rather than adding more (`A.yearTurn`). An engaged adult spends each point as it comes: 6.1 to 6.3 actions a year, a child 3.7, an infant none. Gates ("Too young", "Enough of that this year", prison, too hurt) were under a tenth of the misses. |
| **Checks** | 88% of the checks bots took were taken with a sure choice on offer, and the reckless bot takes the worst odds in the scene, so the rate is the odds of the long shot. What makes long shots long is partly the writer's `d` and partly an accident: **the same written d means different odds depending on which stats the writer named.** A typical seasoned adult has will 56 but speed 30, stamina 31 and intellect 33, so "d 45" is 26% on speed and stamina and 49% on persuasion and will. Intrigue and intellect won 24%, intellect and insight 14%, strength and will 8%; diplomacy and will 60%. |

Two other levers were measured and dropped:

- **Help from the people close to you** (a friend, a spouse or a parent who knows the skill lends part of it, as a spouse's skills add to a ruler's in Crusader Kings III). The best such person was better than you at only 27% of checks, by a median of 6 points; at a quarter of the gap the mean odds rose 0.8 points.
- **Raising initiative without a reason.** A flat rise in free days is a number, not a rhythm. The winter rule below gives the same agency with a season the world already has.

## What it does

### 1. No season passes without something to decide (`pace.core.js`)

- **The quiet-season floor.** The game counts whole months since the last prompt (anything it puts in front of you; the war-room hint does not count). If a stage's limit is reached and the month's own roll brought nothing, it draws one event: **3 months for a child, 4 for a youth, an adult or the old, 5 for an infant** (from the first birthday, as the release). In prison it does nothing: a cell is meant to be slow.
- **From the game's own pool.** The draw is `A.rollEventsN(pc, 1)`, the release's monthly roll: the same eligible events, weights, cooldowns, variety guard (25) and cut pool (58). Nothing was written for it.
- **Only scenes that cannot hurt you.** The first version drew from the whole pool and doubled a child's fevers and falls with the rest: in 12 lives to 40, bot lives died at 16 to 20 that had lived to 60. Now the floor skips any event whose choices or setup can take health, wound, kill, start a fight or a beast hunt, or name a cause of death (read once per event from its source, `PACE.hurtful`). The release's own roll still brings those at its own rate, so childhood is as dangerous as it was, just less empty.
- **A draw that will show.** A draw can come back empty (58-event-cut turns a retired event's draw into nothing) or drop itself when looked at (an unfillable token, a setup that skips, shown under 240 days ago). The floor looks at it in the engine at the month's turn (`A.eventView` runs the setup once and keeps the view), and tries up to four times.
- **The year turn.** `A.yearTurn` spreads the year's events over the coming months; those count when they come, not on New Year's day.
- **State.** `A.S.pace = { last, floor }`: the day of the last prompt and the floor's draws. A save without it starts counting on its first month.

This is `replayability-pacing.md`'s step 3 ("a director floor ... force a stage-appropriate event after 6 months (adult) or 9 (child), the way Randy caps quiet at 13 days"), with shorter limits because 58-event-cut has since made every month quieter. The reference games: RimWorld's storytellers cap the quiet between threats; FTL allows one or two empty beacons a sector; BitLife and Reigns put a decision in every year.

### 2. Winter gives you days of your own (`pace.core.js`)

- In the dark months, **December to February** (the war engine's own winter, `A.wsWinter`'s days), the fields sleep and the roads close, and **free days come twice as fast**. An adult's 7 free days a year become about 9, a child's 4 about 5.1.
- It is the release's own hook: `A.initiativeRate` multiplies by `A.initiativeMul(pc)`, which the release reads but never set. The cap (`A.initiativeCap`) is unchanged, so saving up is not easier, spending is.
- Not in prison. An infant still has none.
- The initiative popover (59-tooltips) already shows "Rate ×" when the rate is not 1; it now says why: "Winter: the fields sleep, free days come twice as fast."

Stardew Valley's winter is the same idea: no crops, so the season is for people, the mines and the things you never had time for. King of Dragon Pass plans its year by seasons for the same reason.

### 3. One scale for every check (`scale.core.js`)

The house scale says d 45 is typical (CLAUDE.md). The rule makes that true for whatever the scene names:

```
ref = what a typical seasoned adult brings to this check   (0.6 x first side + 0.4 x second, 75-fair-checks' reference person)
d'  = d - max(0, 45 - ref)
```

- **A typical seasoned adult meets any d 45 scene at even odds**, and every scene keeps its written distance from 45: a d 55 scene is still ten points harder than typical, a d 35 one ten easier.
- **Never harder than written.** Where the typical adult already brings more than 45 (diplomacy and will, 48.8), nothing changes.
- **It reads the check, never the person.** Your own place against the typical stays: a skill trained past 37 still pays, and one you never trained (4 + 0.3 × your mean stat, about 15) still gives long odds.
- **It composes with 75-fair-checks, it does not repeat it.** 75 brings each stage of life to the seasoned adult; this brings the seasoned adult to the scale. 75's rule sees the eased `d`, and with both a typical person of any stage meets d 45 at even odds. 75's never-below-typical floor still holds for a child, so a child's odds are not pushed past even by the two rules together.
- **Fights are left alone** (`check.fight`, 48-fight-ladder).
- **The number shown is the number rolled.** The wrapper sets the difficulty on the same check object for the call and puts the written one back, as 75's does (67-memory-weave finds its choice by that object, 30-get-to-know adds its scene shift to it).
- **The odds popover** (59-tooltips) names it in a row of its own: "One scale for every check: a typical seasoned adult brings 35 to this, not 45, so the scene asks 10 less". Its share is taken with 75's rule off and 75's with this one on, so the rows still add up to the number on the button.

## Measured by

`test.mjs` (`node tests/run.mjs <build> --features=pacing`) and the league (`bench/run.mjs --only=league`), on two full builds made from the same tree at the same moment, one with this feature and one without.

**The league** (64 lives, the scorecard's seeds):

RESULTS

Tests:

TESTS

## Rules kept

- No patches, no events, no change to `bench/`. Wrappers on `A.queue`, `A.yearTurn`, `A.monthEvents`, `A.evFit` (only while the floor draws), `A.initiativeMul`, `A.checkOdds`, and the two popovers.
- Engine randomness only: the floor draws with the release's own roll, and only in months that are already quiet; winter and the scale draw nothing.
- Rendering stays pure: `A.initiativeMul`, `A.checkOdds` and the popovers read and never write (tested: state and random stream unchanged).
- New state tolerates old saves (`A.S.pace` is made on the first month).
- Popover text goes through `UI.esc`.

## Limits

LIMITS
