# Fair checks

**Aspect:** Character and life sim (the scorecard's "Check success rate in bot lives", target 45–65%, in `bench/rubric.mjs`; no Road to Ten step names it) and Balance and difficulty (the plan's "every path through life works") · **Kind:** system (two core files, no patches, no events), plus a bench (`bench.mjs`)

The house scale says a check of difficulty 45 is "typical" (CLAUDE.md). `A.checkOdds` gives 50% where your value meets `d`. Your value is 0.6 × the first skill or stat plus 0.4 × the second. An untrained skill counts as 4 + 0.3 × your mean stat.

The scale fits a seasoned adult: a human of 38 to 50 wins 47% of checks in bot lives. The same scenes come at 16, when a typical life has a skill of 15 where it will later have 37 or more. Over a whole life, 38% of checks succeed (38.4% in the release, which "has always been low"). A quarter of checks sit under 15%, and one in nine at the 4% floor.

## Why checks fail (bench.mjs on today's full build, without this feature: 64 league lives, 5,655 checks)

| Cut | What fails |
| --- | --- |
| **Life stage** | Young adults (the first third of adulthood, humans 16–27) take a third of all checks and win **26%**. Children win 31% and teens 33%. Grown adults win 40% and seasoned adults 47%. The old win 57%, because skills pile up. |
| **The skill asked** | 39% of checks ask a skill the person has under 20, and they win 15–20%. 78% of the checks under 15% (965 of 1,233) ask a skill under 20. |
| **Difficulty** | Not the cause: d 35–44 wins 41%, 45–49 wins 34%, 50–54 wins 38%. The scenes ask ordinary difficulties of people who have not trained yet. |
| **The bot** | Reckless takes 50% of all checks. In 94% of those, a choice with no roll was on offer and it took the worst odds. Random takes 26%, greedy 19% (44%), careful only 5% (52%), because careful prefers a sure choice (odds 100). The bot was not changed. |
| **Fights** (48-fight-ladder, on fighting worth) | 598 checks, 59% won. Not the problem, and left alone. |
| **By source** | Release events win 34–63% by family. 21-npc-initiative 24% (332 checks). 69-live-numbers' own scenes 22% (210). The 19 events 69 retagged win 25.5% (137), because they ask a skill most bots never learn. 74-old-age: 133 checks, median 49%, and 6 (4.5%) at the 4% floor. 57-world-chronicle 23%, 52/53 arcs 22–23%. |

## What it does

**The rule** (`fair.core.js`; `A.checkOdds` for event checks that are not fights):

```
tv = the check's value for a typical person of your band   (FC.TYP)
ref = the same for a typical seasoned adult                  (FC.REF = 'adult3')
d'  = max(min(d, tv), d − max(0, ref − tv))
```

- **The gap comes off.** The difficulty drops by the gap between a typical seasoned adult and a typical person of your stage of life, for this check's own skill and stats. A scene is then as hard for a typical 16-year-old as for a typical 45-year-old.
- **Never below typical.** It never drops below what a typical person of your stage brings, so a scene already written for children is not made easier than even.
- **Seasoned adults are untouched.** So are the old where they have kept what they learned. Their strength and speed fade, so checks on those ease by the measured fade.
- **Your own place against the typical stays.** A skill you never trained, a wound, or weak stats still give long odds. An untrained young adult with stats of 16 meets a d 55 medicine check at 4%.
- **Fights are left alone.** A check with `check.fight` (48-fight-ladder) rolls on fighting worth.
- **The number shown is the number rolled.** `A.eventChoose` rolls `A.checkOdds`, and the `fcRolled` test checks the first draw. The wrapper sets the difficulty on the same check object for the length of the call and puts the written one back: 67-memory-weave finds its choice by that object, and 30-get-to-know adds its scene shift to it.

**Bands** (`FC.band`) are the stage (`A.stage`: child, teen, old), with adulthood cut in thirds of the race's years from adult to old. That is 16–27, 27–39 and 39–50 for humans, and 50–150, 150–250 and 250–350 for elves.

**`FC.TYP`** holds the median of each stat (`A.stat`) and of the asked skill (`A.skillEff`) at the checks bot lives met, by band. It was measured on 64 league lives of the full build without this feature.

| Band | str | spd | ins | sta | int | wil | skill asked | checks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| child | 14 | 13 | 15 | 16 | 15 | 17 | 2 | 588 |
| teen | 26 | 23 | 29 | 27 | 29 | 31 | 8 | 401 |
| adult1 (young) | 32 | 30 | 37 | 32 | 32 | 39 | 15 | 1,843 |
| adult2 | 38 | 30 | 38 | 33 | 33 | 45 | 27 | 921 |
| adult3 (seasoned, the reference) | 36 | 30 | 38 | 31 | 33 | 56 | 37 | 793 |
| old | 28 | 20 | 36 | 23 | 32 | 65 | 49 | 1,109 |

**The odds popover** (`tips.core.js`, 59-tooltips) names the rule in a row of its own: "Your stage of life: a typical young adult brings 25 to this, a seasoned adult 45, so the scene asks 25 of you, not 45" (persuasion and will, `fcRolled`). The rows still add up to the number on the button, and 59's `ttSums2` (no "Other things in play") passes.

## Measured by

`bench.mjs` (bench/run.mjs's league lives, the same seeds, starts and personalities, and the bot unchanged) and `test.mjs`.

| | Without the rule | With the rule |
| --- | --- | --- |
| **Check success, 64 league lives** (seeds 9001+, the scorecard's set) | **38.1%** of 5,711 (90% bootstrap over lives: 35.2–40.6) | **50.8%** of 6,246 (47.2–54.7) |
| Check success, 32 more lives (seeds 19001+, careful and reckless) | 35.0% of 2,408 (30.1–39.9) | 51.4% of 2,990 (44.4–57.2) |
| Checks under 15% (64 lives) | 24.1% | **6.9%** (second set: 28.3% to 5.6%) |
| Checks at the 4% floor | 11.6% | 2.4% (second set: 13.3% to 1.9%) |
| Checks the rule eased | | 63% (second set 82%) |
| By band: child, teen, young, grown, seasoned, old | 31, 33, 26, 40, 47, 57% | 48, 48, 55, 46, 45, 57% |
| By personality: reckless, random, greedy, careful | 35, 38, 44, 52% | 52, 53, 45, 64% |
| 74-old-age checks at the floor | 6 of 133 | 4 of 132 |
| Page errors | 0 | 0 |

Tests (`node tests/run.mjs <build> --features=fair-checks`):

| Test | Result on the full build |
| --- | --- |
| `fcRule` | A typical person of every band, on three checks (persuasion and will d 45, strength and stamina d 50, trade and wits d 40), against the rule's own prediction from a real seasoned-adult person. 12 of 18 pairs are eased: a young adult's persuasion goes from 17% to 49% (the seasoned adult's 49%), a child's from 4% to 49%, and an old person's strength from 12% to 24%. Seasoned adults are unchanged, and nothing falls. |
| `fcLeavesAlone` | The written difficulty comes back after the call, including when it was absent. The state and the random stream are unchanged. A fight's odds are unchanged (3%). Someone far below typical still gets 4%. |
| `fcRolled` | `pf_sword_stumble` shows 49% (17% without the rule), and the roll's first draw is at 49%. |
| `fcLives` | 8 young bot lives (reckless and random, from 16 for 15 years). Without the rule: 111 of 482 checks won (23%), 49.8% of them under 15%. With it: 203 of 477 (42.6%), 5.2% under 15%. |

**Balance** (`node bench/balance.mjs <full build> --workers=2`, 72 lives): **every band held.** The league's check success there is 46.3% (band 30–70; the last integrated report, on an earlier build, read 38.8%). Median death ages: serf 58, peasant 70, artisan 51, merchant 65, noble 55, royal 65. Median peak coin: serf 21,169, peasant 302,844 (band to 400,000: the nearest to an edge), artisan 167,316, merchant 394,849, noble 230,624, royal 250,448. Median peak fame: 24, 75, 25, 62, 85, 68.

## Rules kept

- No patches, no events, no new state. One wrapper on `A.checkOdds` that calls the original, and one on `UI.TT.checkParts` (59-tooltips).
- Pure and deterministic: no random draws, and `A.S` is untouched (tested). The bot is unchanged.
- The popover's words go through `UI.esc`.

## Limits

- **The typical values come from bot lives**, the same lives the scorecard measures. They describe this game's typical life, not a designer's intent. They were measured without the rule: with it, young adults train a little more (median asked skill 20, not 15). Re-measure with `bench.mjs` (it prints `TYP`) if skills or the stage rules change.
- **The reckless bot still decides the metric.** Half of all checks are the worst odds in a scene that offered a sure choice. The rule lifts every life stage to the seasoned adult's level, and that is what moves the rate. Scenes still offer long shots: 6.9% of checks stay under 15%.
- **Seasoned adults now win less than young adults in bot lives** (45% against 55%). Young adults are lifted to the reference value, and they also train the skills they now win with. A designer may prefer the reference to be the grown adult. That gives 44.9% by the offline replay, at the bottom of the band.
- **The risk metric was already inverted on this build before this feature.** In the 64 league lives without the rule, careful humans and orcs died at a mean of 45.4 and reckless ones at 48.1 (12 each). With the rule, in the 32-life second set, careful died at 36.3 and reckless at 37.4. Easier checks do not make reckless play safer in kind: the rule changes which scenes succeed, not what a failure costs.
- **A life-stage rule, not a writing pass.** Scenes whose difficulty is too high for every stage (69's retagged skills, 21-npc-initiative's theft and slander, 36-sieges' walls) are eased only by the stage gap. They want a writer to set their `d`.
