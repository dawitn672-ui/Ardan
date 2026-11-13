# 999995-next-year: Next month or Next year

**Aspect:** round 2 B6 (`docs/CRITIQUE.md` §2 item 4; T1, T2, T5, U18; `docs/DECISIONS.md` D-008, D-019, D-025) ·
**Kind:** one readable core file, tests; small edits in 84-top-bar (hooks), 99992-v2-time (the buttons), 996-coming-up,
99998-click-open and 97-first-life-fixes (the words). Sorts after every other `9999x` feature and before
999999-one-redraw, whose one-redraw policy it runs under.

## What the player sees

- **Two buttons in fixed places**, on a desktop's top bar and in a phone's dock: **Next month** (N or M) on the left and
  **Next year** (Y) beside it. While you are a child the year is the main (accent) button; after that, the month.
  Neither ever becomes a stop control: the one that runs keeps its name, is disabled, and shows a thin progress bar.
  **Esc** ends a year at the end of its month. (On campaign the pair is Next day and Next week, as before.)
- **A year runs month by month** under A1's one-redraw policy: one redraw and one digest at the end.
- **A year stops early, and says why in one line** ("July: A matter that weighs: Fever."), for:
  a card that needs a real answer; a battle, a duel or a call to arms; a call to war; an illness or a wound; a death
  or a birth in the household (parents, brothers and sisters, spouse, children); coming of age; a deadline; Esc.
- **A month** waits at a notable card and goes on, as before.
- **Small matters wait.** A routine card never stops a month or a year: it is set aside while the step runs and comes,
  one at a time, when the step ends (a year hands back at most 6 of them and a month 3; the rest pass, and the digest
  says so). They are kept in the state (`S.v2t.parked`), so a save made meanwhile keeps them.
- **The digest** (a card at the top of Life, dismissible): "Your year, 1105 · age 9", the one-line reason if it was cut
  short, what the story gained (the quiet-month filler is counted, not listed), coin and health, what waits.
- **No initiative.** The pool of free days (⧗) is gone: nothing is ever refused for it, the clock and the cost marks do
  not show it. **Overtraining is on the player**: what was spent counts as load; a body driven past what it recovers
  grows weary (35-moods' rest need, "Weary"), then loses health, then may pull something (the "strain" wound, which
  mends in a year).

## The rule: notable or routine (`A.V2Y.classify`)

Decided from the event's definition (never from the state of the world), cached per event id:

| Notable (stops a year) | Routine (waits) |
| --- | --- |
| a forced card, a consequence of your own choice (`chain`), a card you asked for, a gathering | talk in the tavern or the street, errands, play, a stranger on the road |
| a duty, a council, a letter of state (`duty`, `council`, `flow`, `ga_`, `gs_`, `di_`) | a family quarrel, a first word, a first step (milestones that carry no weight) |
| an id about marriage, birth, death, sickness, war, the law, an exam, a summons, a debt... (`A.V2Y.STEMS`) | day-to-day happenings with no lasting mark |
| a choice that can wound, kill, jail, punish, start a duel or a beast hunt, take a lover, a claim, a pact, a war, a mission, a family matter; for a grown person also a post, an oath, a holding, a debt, a secret, a purse of 120 suns or more | |
| an event whose condition is the ruler's or an office's (`C.ruler`, `C.office`) | |
| a deadline (a scheduled promise with its own label: a loan, a wedding, an apprenticeship's end) | |
| every non-card prompt: a battle, a duel, a campaign, the war room | |

A child's list of weighty choices is shorter (no posts or holdings): "Scaring crows" is a chore.

## Where the code is

- `next-year.core.js`: `A.V2Y` (classify, household, changed, load), `UI.stepHead` / `UI.stepBegin` / `UI.stepTick` /
  `UI.stepEnding` (the hooks 84-top-bar's `step.core.js` calls), the digest (`UI.stepSumHtml`), the load (`A.onDay`,
  `A.onMonth`, `A.initiativeCap`), and the page pass that takes the ⧗ cost marks off (`A.V2Y.strip`).
- 99992-v2-time: the buttons, the keys (N, M, Y, W, D, Esc), the hint, the help, What now.

## Determinism

The classification, the stop checks and the digest only read. The parked cards come back in the order they met the
player. A step is a span of days, so twelve Next month presses and one Next year press reach the same world when
nothing stops the year (`nyYearSameWorld`). The monthly load uses `A.chance` for a strain, as every consequence does.

## Tests (`test.mjs`)

`nyButtons`, `nyClassify`, `nyYearSameWorld`, `nyEarlyStops`, `nySmallMattersWait`, `nyEsc`, `nyOneRedraw`, `nyChildhood`,
`nyNoInitiative`, `nyOvertraining`.
