# Pacing

**Aspect:** Pacing and core loop (the scorecard's "Prompts per in-game year", target ≥ 6; `replayability-pacing.md` P2, P4 and step 3, "a director floor") and Character and life sim (the scorecard's "Initiative actions per year (engaged bot)", target ≥ 6, and "Check success rate in bot lives", 45–65%, scored best at 55) · **Kind:** system (two core files, no patches, no events), plus tests

Three numbers sat just short of their bars: prompts per year (5.1 to 5.6 in recent league runs), initiative actions per engaged year (4.7 to 5.0) and checks won (49 to 51%). Each had one cause in the game, and each fix is a rule a player can see and say in a sentence.

## Why the numbers were short

Measured on 16 engaged and 13 mixed bot lives of the full build, the same seeds, starts and personalities as `bench/run.mjs`'s league, with a probe that logs every prompt, every initiative attempt and every check.

| Number | What the bot lives showed |
| --- | --- |
| **Prompts** | Adults are not the problem: 8 to 9 prompts a year for an engaged life, a median gap of 31 days. **Childhood is.** A child (humans 3 to 12) meets 2.3 prompts a year, with a median gap of 120 days and one gap in ten over **414 days**; an infant's p90 is 608 days. The release's director (`A.monthEvents`) rolls one fixed chance a month by stage (17% for a child) and nothing raises it after a quiet stretch. Elves and dwarves spend decades in those stages, so a quarter of the league's lives sit at its bottom. |
| **Initiative** | The engaged bot rarely lacked something to do: outside infancy, **70% of its monthly tries that came to nothing were for want of initiative**. Most of the rest were its own plan asking for what it could not pay (lending with no coin, a physician with no suns) or, for the random bot, an action of the wrong age. Initiative refills at your free days a year, spread evenly over the days (`freeTime / 365`, 7 a year for an adult, 4 for a child, none before 3), and the year turn keeps what is left rather than adding more (`A.yearTurn`). An engaged adult spends each point as it comes: 6.1 to 6.3 actions a year, a child 3.7, an infant none. The gates ("Too young", "Enough of that this year", prison, too hurt) turned away under 5% of tries. |
| **Checks** | 88% of the checks bots took were taken with a sure choice on offer, and the reckless bot takes the worst odds in the scene, so the rate is the odds of the long shot. What makes long shots long is partly the writer's `d` and partly an accident: **the same written d means different odds depending on which stats the writer named.** A typical seasoned adult has will 56 but speed 30, stamina 31 and intellect 33, so "d 45" is 26% on speed and stamina and 56% on will and insight. Intrigue and intellect won 24%, intellect and insight 14%, strength and will 8%; diplomacy and will 60%. |

Two other levers were measured and dropped:

- **Help from the people close to you** (a friend, a spouse or a parent who knows the skill lends part of it, as a spouse's skills add to a ruler's in Crusader Kings III). The best such person was better than you at only 27% of checks, by a median of 6 points; at a quarter of the gap the mean odds rose 0.8 points.
- **Raising initiative without a reason.** A flat rise in free days is a number, not a rhythm. The winter rule below gives the same agency with a season the world already has.

## What it does

### 1. No season passes without something to decide (`pace.core.js`)

- **The quiet-season floor.** The game counts whole months since the last prompt (anything it puts in front of you; the war-room hint does not count). If a stage's limit is reached and the month's own roll brought nothing, it draws one event: **3 months for a child, 4 for a youth, an adult or the old, 5 for an infant** (from the first birthday, as the release). In prison it does nothing: a cell is meant to be slow.
- **From the game's own pool.** The draw is `A.rollEventsN(pc, 1)`, the release's monthly roll: the same eligible events, weights, cooldowns, variety guard (25) and cut pool (58). Nothing was written for it.
- **Only scenes that cannot hurt you.** The first version drew from the whole pool and doubled a child's fevers and falls with the rest: in 12 bot lives to 40, five died against three without it, two of them at 16 and 18. Now the floor skips any event whose choices or setup can take health, wound, kill, start a fight or a beast hunt, or name a cause of death (read once per event from its source, `PACE.hurtful`). The release's own roll still brings those at its own rate, so childhood is as dangerous as it was, just less empty.
- **A draw that will show.** A draw can come back empty (58-event-cut turns a retired event's draw into nothing) or drop itself when looked at (an unfillable token, a setup that skips, shown under 240 days ago). The floor looks at it in the engine at the month's turn (`A.eventView` runs the setup once and keeps the view), and tries up to four times.
- **The year turn.** `A.yearTurn` spreads the year's events over the coming months; those count when they come, not on New Year's day.
- **State.** `A.S.pace = { last, floor }`: the day of the last prompt and the floor's draws. A save without it starts counting on its first month.

It goes with 82-early-years, which runs the clock faster through childhood: that one shortens the real-time wait, this one puts a decision in it.

This is `replayability-pacing.md`'s step 3 ("a director floor ... force a stage-appropriate event after 6 months (adult) or 9 (child), the way Randy caps quiet at 13 days"), with shorter limits because 58-event-cut has since made every month quieter. The reference games: RimWorld's storytellers cap the quiet between threats; FTL allows one or two empty beacons a sector; BitLife and Reigns put a decision in every year.

### 2. Winter gives you days of your own (`pace.core.js`)

- In the dark months, **December to February** (the war engine's own winter, `A.wsWinter`'s days), the fields sleep and the roads close, and **free days come twice as fast**. An adult's 7 free days a year become about 9, a child's 4 about 5.1.
- It is the release's own hook: `A.initiativeRate` multiplies by `A.initiativeMul(pc)`, which the release reads but never set. The cap (`A.initiativeCap`) is unchanged, so saving up is not easier, spending is.
- Not in prison. An infant still has none.
- The initiative popover (59-tooltips) already shows "Rate ×" when the rate is not 1; it now says why: "Winter: the fields sleep, free days come twice as fast."

Stardew Valley's winter is the same idea: no crops, so the season is for people, the mines and the things you never had time for. King of Dragon Pass plans its year by seasons for the same reason.

### 3. One scale for every stat (`scale.core.js`)

The house scale says d 45 is typical (CLAUDE.md). The six stats do not sit on one scale: a typical seasoned adult (75-fair-checks' reference person) has will 56, insight 38, strength 36, intellect 33, stamina 31 and speed 30. The rule puts them on one:

```
d' = d - sum over the check's stat sides of  weight x max(0, 45 - REF[stat])      (weights 0.6 and 0.4, as A.checkVal)
```

- **A d 45 test of speed asks of a typical adult's speed what a d 45 test of will asks of their will.** Speed and stamina at d 45 goes from 21% to 44% for a seasoned adult of typical stats; strength and intellect from 35% to 51%; intrigue and intellect from 42% to 49%.
- **A skill side is left alone.** A seasoned adult's typical asked skill (37) still falls short of 45, and that gap is what training is for.
- **Never harder than written.** Will, where the typical adult stands above 45, is not raised.
- **It reads the check, never the person.** Weak stats, a wound, an untrained skill still give long odds.
- **It composes with 75-fair-checks, it does not repeat it.** 75 brings each stage of life to the seasoned adult; this brings the seasoned adult's stats to the scale. 75's rule sees the eased `d`, and its never-below-typical floor still holds for a child.
- **Fights are left alone** (`check.fight`, 48-fight-ladder).
- **The number shown is the number rolled.** The wrapper sets the difficulty on the same check object for the call and puts the written one back, as 75's does (67-memory-weave finds its choice by that object, 30-get-to-know adds its scene shift to it).
- **The odds popover** (59-tooltips) names it in a row of its own: "One scale for every stat: a typical grown stamina is 31, not 45, so the scene asks 8 less". Its share is taken with 75's rule off and 75's with this one on, so the rows still add up to the number on the button.
- **A wider version was tried and set aside:** lifting the skill side too, so that a typical seasoned adult meets every d 45 at even odds. On the league it took check success from 51.1% to **61.3%**, past the scorecard's 55, because it lifts every long shot the reckless bot takes. The numbers for it are in the table below.

## Measured by

`test.mjs` (`node tests/run.mjs <build> --features=pacing`) and the league (`bench/run.mjs --only=league`), on two full builds of the same tree, one with this feature and one without. (87-echoes joined the build between the two runs; the build with this feature leaves it out, so the pair differs only by this feature. Nothing else in the tree changed but tests and docs.)

**The league** (64 lives, the scorecard's seeds; builds `b593143+f80` without and `b593143+f81` with):

| | Without | **With** | With the wider scale (set aside) | Target |
| --- | --- | --- | --- | --- |
| **Prompts per in-game year** | 5.6 | **7.0** | 7.0 | ≥ 6 |
| **Initiative actions per year (engaged)** | 5.1 | **6.5** | 6.5 | ≥ 6 |
| **Check success** | 51.1% | **57.8%** | 61.3% | 45–65%, best at 55 |
| ...careful, reckless, greedy, random | 69.5, 48.3, 53.7, 50.3 | 66.5, 60.4, 51.0, 56.4 | 71.0, 62.0, 59.6, 58.9 | |
| Longest usual wait (p90 days between prompts) | 142 | **120** | 120 | |
| ...in seconds at the default speed | 35.5 | **30** | 30 | ≤ 45 |
| Events per year | 5.2 | 6.5 | 6.5 | |
| Median death age, humans who reach 20 | 70 | **62** | 67 | 55–65 |
| Careful bots outlive reckless ones by (years) | −0.8 | **+14.0** | +16.6 | ≥ 5 |
| Fired events that read a memory | 59.5% | 61.6% | 60.9% | ≥ 40% |
| Distinct life arcs, most common arc | 12, 21.9% | 12, 20.3% | 11, 21.9% | ≥ 8, ≤ 25% |
| NPC moves per decade | 10.8 | 10.6 | 10.8 | ≥ 3 |
| Page errors | 0 | 0 | 0 | 0 |

One seed set is noisy: prompts per year moves about ±0.5 between builds that differ only in their random stream, and death ages by several years (12 deaths a personality). The prompts (+1.4) and initiative (+1.4) changes are well outside that; so is the checks change (+6.7). The scale alone accounts for about +3.6 of it (a paired estimate over 16 lives: every event the bot met priced with the rule and without, and each personality's pick taken both ways); the rest comes from which scenes the changed lives meet, and is not separated here. The death-age rows moved the right way here, but they are within what the random stream alone can do and should not be credited to this feature without a second seed set.

**Balance** (`node bench/balance.mjs <build with this feature> --workers=2`, 72 lives): **every band held.** Median death ages: serf 42, peasant 66, artisan 65, merchant 70, noble 67, royal 74. Median peak coin: serf 4,523, peasant 52,460, artisan 84,965, merchant 466,650, noble 284,987, royal 261,485. Check success there 51.2% (band 30–70; those lives start at 16 to 18, past the childhood the league's lives pass through).

**Tests** (`node tests/run.mjs <full build> --features=pacing`: the 4 core suites and these 6, all pass):

| Test | Result on the full build |
| --- | --- |
| `pcFloor` | The same childhoods (from 4) and adulthoods (from 25), 6 years each on three seeds, floor off and on. Child: 1.8 → **4.7** prompts a year, gaps past the limit 0.94 → 0.11 a year, longest gap 863 → 153 days; the floor drew 2.4 a year. Adult: gaps past the limit 0.49 → 0, longest 229 → 123 days; the floor drew **0.78 a year** (the plan's bar: no more than once a year for a median adult). An adult's prompt count is left to the random stream (one adulthood off the floor fell into a war's run of battles). |
| `pcFloorLimits` | Nothing in prison (20 quiet months), nothing after two quiet months, nothing before the first birthday; a quiet adult with the month's roll failed draws one eligible event; a save without `A.S.pace` starts counting instead of drawing. |
| `pcWinter` | An adult's free days come at 14/365 a day in January and December, 7/365 in July and November: 8.99 a year for 7 free days. 2/365 in prison in January. The popover says "Winter: the fields sleep" in January and nothing in July. An infant still has none. |
| `pcScale` | Seasoned adult (44), d 45: speed and stamina shift 14.6, 21% → 44%; persuasion and will 0, 53% → 53%; intrigue and intellect 4.8, 42% → 49%; will and insight (d 50) 2.8, 57% → 59%; strength and intellect with no written d 10.2, 35% → 51%. The written d comes back (also when absent), the state and the random stream are unchanged, a fight's odds are untouched. |
| `pcScaleRolled` | `ch_inf_flux` (one of 893 events with a stat side the rule eases) shows 83% (70% without) and rolls at 83%; the popover adds up to 83 with the rule's own row and no "Other things in play". |
| `pcLives` | 8 bot lives (bench/bot.mjs), birth to 30, the feature off and on. Off: 5.3 prompts a year, 4.4 actions a year (engaged), 43.0% of 400 checks. On: **6.7**, **5.4**, **47.2%** of 341. |

With `--features=replay,fair-checks,tooltips` on the same build, all 28 pass, among them `renderRng`, `replayWithRender` and `journalReplay` (the floor draws in the engine, so a replay draws the same), 59's `ttSums2` and `ttPure2` (popovers add up and change nothing), and 75's four.

`tools/lint-events.mjs` and `tools/lint-choices.mjs` (`--feature=pacing`) pass with nothing to check: the feature adds no events.

## Rules kept

- No patches, no events, no change to `bench/`. Wrappers on `A.queue`, `A.yearTurn`, `A.monthEvents`, `A.evFit` (only while the floor draws), `A.initiativeMul`, `A.checkOdds`, and the two popovers.
- Engine randomness only: the floor draws with the release's own roll, and only in months that are already quiet; winter and the scale draw nothing.
- Rendering stays pure: `A.initiativeMul`, `A.checkOdds` and the popovers read and never write (tested: state and random stream unchanged).
- New state tolerates old saves (`A.S.pace` is made on the first month).
- Popover text goes through `UI.esc`.

## Limits

- **The numbers are bot numbers, and one seed set is noisy.** Prompts per year moves about ±0.5 between builds that differ only in their random stream, so a single league says less than it seems. The floor's own effect is better read in `pcFloor` (the same childhoods and adulthoods, floor off and on).
- **A prompt is counted when it is queued.** An event the base roll queues and `A.headReady` then drops (an unfillable token, shown under 240 days ago) still counts as a prompt that month, so a quiet stretch can run a month past its limit. Counting at display time would need the engine to see what the screen draws, which `replayWithRender` forbids. 88-queue-head now settles the head inside `A.advance`, which makes such drops rarer.
- **The hurt filter is read from source text** (`PACE.HURT_RX`). It errs toward leaving scenes out (any `cause` or `duel` key, any health cost, even a small one on a win). In the child pool it leaves enough for 4 to 5 prompts a year; a designer may want a tag on events instead.
- **Winter is the same everywhere.** The war engine's winter is northern provinces, tundra and mountains only (`A.wsWinter`); the slack season here is December to February for every home, because every farming year has one and a southern start should not have less agency. A designer may prefer it by climate, or a different season in the south.
- **Winter adds agency, it does not move it.** An adult's free days rise from 7 to about 9 a year. An even-total version (more in winter, less in summer) would keep the rhythm without the extra actions; the scorecard's ≥ 6 would then stay short.
- **The scale eases long shots too.** The reckless bot takes the worst odds on offer, so a rule that lifts only some checks moves its choice to another long shot: a paired estimate over 16 lives (every event priced both ways, each personality's pick taken under each) gave +3.6 points for this rule and +8.5 for the wider one, where a naive estimate gave +5 and +10.
- **The reference is 75's** (`FC.TYP.adult3`, measured in bot lives without either rule). If stats or skills change, re-measure it there and both rules follow.
- **Other features' tests.** On the full build with this feature, 01-replay (`renderRng`, `replayWithRender`, `journalReplay`), 59-tooltips (all 22) and 75-fair-checks (all 4) pass. With the wider scale set aside above, three of 75's tests (`fcRule`, `fcLeavesAlone`, `fcLives`) failed, because they toggle `A.FC.OFF` and expect the release's odds underneath; a future rule on checks should set `A.SCALE.OFF` in that file's `SETUP`. That build's random stream also walked 59's `ttPure2` into a real purity gap that is not this feature's: the soldier's war-tab popovers created `people.pb4.staff = {}` through `A.staffHolder`, which 21-npc-initiative's `draw-pure.core.js` guards while drawing (`UI.render`) but not while a popover is open (`UI.TT.open`). Any seed can walk into it.
