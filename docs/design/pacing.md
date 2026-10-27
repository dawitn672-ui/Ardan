# Pacing: a life lived a week or a month at a time

The owner's direction (Oct 27): one world, simulated in full everywhere, and a life lived "a month or a week at a time,
with events and actions within that". This page is the design. It is built in `features/84-top-bar/step.core.js`.

## How time runs today

| Piece | What it does |
| --- | --- |
| The day clock (release) | `A.dayTick()` is one day of the whole world: wars, the player's day hooks, scheduled items, and on the first day of a month `A.monthTick` (every `A.onMonth` hook, then `A.monthEvents`, the month's events). Day 365 is the year turn (`A.yearTurn`, the year's events spread over the coming months). |
| Play and speeds 1 to 5 (release) | `UI.clkTick` every 100 ms runs 0.15 to 6 days (1.5 to 60 days a second), at most 70 ms of work a tick. 82-early-years runs it up to 10 times faster in childhood. |
| Next (release) | `A.advance(400, 'year')` in one go: up to a year of the world in one task. On the Great Continent that is several seconds with the page frozen. |
| How events stop the clock | Anything put on `S.queue` stops `A.advance` and the clock. `A.headReady` drops what will not show. The event is drawn, and closing it (`UI.RESUME_AFTER`) restarts the clock if it was running. Quiet living (`UI.quietSettle`) settles ordinary events itself. |
| Initiative | `S.time` fills by `A.initiativeRate` a day (about 7 free days a year for an adult, twice as fast in winter, 81-pacing) up to `A.initiativeCap`. Activities and work spend it whenever the clock is still; `S.yearActs` limits some to once a year. An adult earns about 0.6 a month. |
| 81-pacing | No more than 3 to 5 quiet months: the month turn draws a harmless event if nothing came. |

What it adds up to: on the Known World a month passes in a quarter of a second and the clock feels continuous. On the
Great Continent a month is 0.3 to 0.6 s of work and a year turn about a second, so the clock stutters and Next freezes
the page. The rhythm a player actually lives by is already the month: the month turn is when events are drawn, and
initiative comes at about one action every month or two.

## The step rhythm

**The main controls are "Next week" and "Next month".** A step is a span of days the world plays in full, then hands
the player the time to act.

- **Next month** runs to the turn of the next month: the month's hooks have run and its events are drawn, so the
  player meets the new month and what it brought. **Next week** runs seven days.
- **Within a step, its events come up as they fall.** The step waits at each one; closing it (any action of
  `UI.RESUME_AFTER`) carries the step on to its end. Quiet living settles ordinary events within the step as it does
  for the clock.
- **Between steps the world is still**, and the player takes actions, works, talks to people, opens the war room. Nothing
  passes until the next step.
- **A step stops early** for death, for anything the clock would stop for (a battle you lead, a prompt), and when the
  player presses Stop. Next month again goes on to the same month turn; Next week takes seven days from where it stopped.
- **Continuous play stays**, as the secondary control: Play with its five speeds, and "until something happens" (the old
  Next, now run in slices too). Starting a step stops the clock, and Play stops a step.
- **Keys:** W for a week, M for a month, Space for Play and Pause as before.

## Responsive while the world plays

- **The step runs in slices**: `A.dayTick()` one day at a time, as the clock does, until about 20 ms have gone, then
  the page draws and the next slice is set. A Great Continent month is 15 to 30 slices; the page never stops answering.
- **Nothing in the world can tell.** The same days run in the same order with the same commands as one long call:
  same seed, same commands, same world. The journal records the day ticks as it records the clock's. Drawing between
  slices is pure (`renderRng`, `replayWithRender`).
- **The step shows itself passing**: the step button becomes Stop, a thin bar under it fills by the days done, the date
  moves, and the clock says "The year turns" before the one long day of the year (a second on the Great Continent),
  which is drawn first so the page is never frozen without a word. `aria-busy` is set on the clock while it runs.
- **Bots, tests and benches** call `A.advance` and `A.dayTick` as before; the step is the interface's alone.

## Measured by

`features/84-top-bar/test.mjs`: `tbStepWeekMonth` (a week is 7 days, a month ends on the month turn, an event inside a
step waits and the step goes on after it), `tbStepSameWorld` (a month in slices reaches the same state and random stream
as `A.advance` over the same days), `tbStepResponsive` (on the Great Continent no slice blocks the page for long: the
longest task while a month runs).
