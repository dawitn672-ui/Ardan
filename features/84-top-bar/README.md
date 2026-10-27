# 84-top-bar: the place and the purse stay in sight, and time passes a step at a time

**Why.** The release's desktop stylesheet never lets the top bar wrap (`@media (min-width: 761px) { #topbar { flex-wrap: nowrap } }`). When the clock's controls take the room, the place and the purse are squeezed instead. With a long home name, a large purse and a debt, they shrank to 14 px and vanished at 1024 px, a common small-laptop width. At 1180 and 1280 px the debt was cut mid-word ("(debt 30 su"). It was found on a playtest pass of the screens.

**What.**
- **One group** (patch `TOP-GROUP`). The place, the purse, Save and Menu sit in one `.top-right` box that wraps to a second line as a whole. Allowed to wrap on their own, Menu dropped to a line by itself.
- **The purse never shrinks** (`topbar.core.js`). A long town name takes the ellipsis instead.
- **Icon-only buttons on mid widths.** Between 761 and 1439 px, Save and Menu show only their icons, and each keeps its aria-label. The bar then fits on one line at 1280 px, the most common laptop width, and wraps tidily below.
- **The debt in fewer words** (patch `TOP-DEBT`). "(debt 12,345 suns)" now reads "owes 12,345". The coin's tooltip and spoken label (59-tooltips) and a `title` still give it in full.
- **On a phone the group dissolves** (`display: contents`), and its buttons keep 71-phone's 44 px touch targets. The phone layout is exactly as it was.

**Test.** `tbFits` uses the longest home name in the world, 1,234,567 suns and a debt of 12,345, at 1024, 1180, 1280 and 1440 px. At each width the purse and debt must be whole and the place at least 60 px wide. That is room for the start of the longest name in the world with an ellipsis, while the bar stays one line tall from 1280 px up.

## The step rhythm (`step.core.js`, round 10)

**Why.** The owner's direction (Oct 27): live the life "a month or a week at a time, with events and actions within
that", in one world simulated in full. On the Great Continent a month is half a second of work and a year turn a
second, so the release's clock stuttered and its Next (up to a year in one call) froze the page for seconds. The design
is `docs/design/pacing.md`.

**What.**
- **"Next week" and "Next month" lead the clock** (Next month is its one primary button). A week is seven days; a
  month runs to the turn of the next month, so its hooks have run and its events are drawn. Keys W and M.
- **Within a step its events come up as they fall**; the step waits at each and goes on when it is closed (any
  `UI.RESUME_AFTER` action; a "Go on" button if something else closed it). Quiet living settles ordinary ones as before.
  Between steps the world is still and the time is the player's.
- **Stop** (the running step's button) ends a step where it is. Anything that stops the clock (a confirm box, a battle)
  stops a running step, but not one waiting at its event.
- **Continuous play stays**: Play with its five speeds, and the old Next ("run until something needs you", now an icon)
  run in slices too. Play stops a step; a step stops the clock.
- **Never a frozen page.** The step runs `A.dayTick()` a day at a time in slices of about 20 ms with the page drawn
  between them, a progress bar fills under the step's button, the date moves, and "The month turns" / "The year turns"
  is drawn before those long days. `aria-busy` is set on the clock while it runs; the note is a polite live region.
- **Laptop widths** (761 to 1439 px): "Week" and "Month", Play and Quiet as icons, the five speeds as one button that
  steps through them, so the place and the purse keep their room (`tbFits`). On a phone the step buttons lead 71's dock.

**What does not change.** The world. A step runs the same days in the same order with the same commands as one long
`A.advance`, and the journal records the same day ticks. Bots, tests and benches call the engine as before.

**Tests.**
- `tbStepWeekMonth`: a week is 7 days; a month ends on the turn of a month (January to February, through the year turn
  in December); a step stops at its events and goes on after them; Next month is the one primary control.
- `tbStepSameWorld`: four steps (with drawing between slices) reach the same state hash and random stream as one
  `A.advance` over the same days.
- `tbStepResponsive`: a Great Continent month passes in many slices; the longest task is the month's turn (one day,
  about 0.25 to 0.5 s on this machine), not the month.

**Design pass (round 10, L7's review against the brief).** Week has a calendar and Month a full moon (no icons, and no
key badges, at laptop widths). The W and M badges are `kbd` and hidden under `pointer: coarse`. A control that cannot
act now is `aria-disabled` and stays focusable, with the reason in its tooltip and a toast if pressed: the steps while
something needs you, Go on while an event is open, and Play while a step runs. Go on breathes for 2 s (opacity only,
still under reduced motion). The running step keeps its primary look, and below 1440 px its label says what passes
("The month turns"). The progress bar grows by `transform: scaleX`. At 1440 px and wider the speeds are the brief's
segmented control (32 high, sunken track, segments at least 44 wide). Play, Quiet and Next are 32 × 32 icon buttons at
laptop widths. `A.newGame` and loading a save halt a running step. Three guards fixed controls that were dead or broken:
the playtest bar's Start and Skip (`TOP-PLAYTEST-GUARD`), `aria-pressed` on the creation screen's family filter
(`TOP-FAMFILTER-PRESSED`), and the full map's "−" and "fit", which are `aria-disabled` when the whole map is in view.

## Cycle 1, lane O: the first hour (first-hour B1, I1, I2, I5, B4; design #9)

**The early years step faster** (`UI.stepPlan`). A newborn pressed Month up to sixteen times for a first event. Under
five the clock offers **Next season** (the main step, three months, ending where three Months end) beside Next month.
A child whose last two steps passed with nothing to answer is offered **Until something happens** as the main step: it
runs on, through the turn of the year, up to 400 days, and ends once the first thing that needs you is settled. W is
the shorter step on offer and M the main one. Three newborns now reach a first event in 3 presses, where a Month at a
time took 16 (`tbStepSeason`). Why this and not "run on when empty": the player keeps the step, the label says what
will pass, and an adult's rhythm (Week, Month) is untouched. A step is a span of days, so the world is the one Months
reach (`tbStepSeasonSameWorld`).

**Every step ends with a note of what passed** (`UI.stepSumHtml`, at the top of Now): "This week · 7 days · coin +3
suns · health unchanged", and the story's new lines, up to three. Weeks 2 to 6 of a life had shown nothing at all. A
note, rather than small weekly events, because it costs the balance bands nothing: it reads the state at the start and
end of the step and lives on `UI.stepper`, never in `A.S` (`tbStepNote` checks drawing it is pure). It can be dismissed.

**Hints, How to play and activities** live in `97-life-fixes/b-hints.core.js` (lane O's file there) and are tested
here:
- `tbHintsBeside`: the first hint is the clock's, under the step buttons (above them in a phone's dock), naming Month
  and Week, never Play, Space or Next. The tab's hints sit in the page after what they explain, not over it, and take
  no clicks but their own button's. A step retires the clock's hint; three steps retire any other. What now's "Let time
  run" is "Live the next month" (or season) and takes the step.
- `tbHelpFirstHour`: How to play opens on "Your first hour", six steps naming Month and Week; the old pages are folded
  by subject, and the clock's page is rewritten for the steps.
- `tbActsSix`: a first life (the browser's first, `UI.set.lfLives`) sees six activities (What now's, the age's own,
  then the plainest ways to meet people and grow) and "More activities (25)"; an activity's answer is written above the
  tiles where it was pressed. 98-feedback's toast stays. **For lane V:** 91-look groups the tiles in the DOM; the hidden
  ones carry `hidden` and `.act-more`, and a group left empty is hidden with its heading. If 91 wants the curation in
  its own grid, the hook is `UI.ACT_FIRST` / `UI.ACT_SHOW` and the `.acts-six` marker.
