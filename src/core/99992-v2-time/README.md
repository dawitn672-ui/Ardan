# 99992-v2-time: the clock, its buttons, five places, no forced chapters

**Aspect:** the owner's v2 complaints 1, 2, 7 and 8 (`docs/V2_SPEC.md`, integration step 3) · **Kind:** one readable
core file, tests; small edits in 9993-life-chapters. No patches, no events.

## Round 2 B6: Next month or Next year (supersedes the one-button rule below)

The clock has **two buttons in fixed places, Next month (N, M) and Next year (Y)**; the year leads while the player is a
child (`V2T.primary`). Neither ever becomes a stop control: the running one keeps its label, disabled, with its bar; Esc
ends a year at its month's end. What a year stops for, the small cards that wait, the digest and the end of the
initiative pool are in `src/ui/999995-next-year/README.md` and `docs/DECISIONS.md` D-025. A phone's clock reads
"Age 9 · March 1105". The text below is the v2 step-3 record, with "one button" read as "the month button".

## What it does

**One control moves time** (complaint 8). The clock is the month, initiative and one big **Next month**: in the top
bar on a desktop, and on a phone a full-width button in the dock above the tab bar. Play, the five speeds, the
release's Next ("until something happens"), Quiet living, 84-top-bar's Week / Season / Until stepper and the war
room's own Play, speeds and Week are gone, as actions and as markup. Space and 1 to 5 run nothing; N or M is Next
month. The date reads by month ("March 1105").

- **Next month** runs 84-top-bar's month step (in slices, the page drawn between them) to the turn of the next calendar
  month, from wherever the month stands: a save made mid-week goes on to the start of the next month, never past it.
- **On campaign** (on the road, 9990-journeys; or, while at war, a division of yours on the march or at a siege) the
  clock offers **Next day** (D) and **Next week** (W) instead, with the host's standing orders (`A.setTac`, attacking
  and defending) beside them for a ruler or an officer of rank 4 and up. The war room shows the same steps.
- **A battle stops the clock**: a battle, a duel, the old campaign map or the war room ends the step once it is closed.

**The month's happenings as cards, one at a time** (complaint 1). `A.monthEvents` is replaced: at each month's turn
it draws 0, 1, 2 or 3 scenes with season weights (winter 62/30/7/1, spring and autumn 55/32/10/3, summer 50/33/13/4),
scaled by the stage of life (infant 0.15, child 0.55, youth 0.85, adult 0.75, old 0.7), from the release's own roll
(`A.rollEventsN`: its pool, weights, cooldowns, variety guard and cut). Scenes already scheduled for the month count
toward the three. The draws are spread over the month's days (`A.schedule`), so the step stops at each in turn. All of
it is `A.rand`: the same seed and choices give the same months.

- **A quiet month is a toast, never a card.** At the turn, a month in which nothing reached the player (no card of any
  kind first shown since the last turn, none waiting) writes one line to the story (`S.v2t.quiet`), and the step ends
  with that line as a 2-second toast. 84's "This month" summary card is gone.
- **Filler removed:** 81-pacing's quiet-season floor (`PACE.FLOOR_OFF`), 96-big-moments' new-year cut-in, 84's step card,
  and 9993's chapter card (below).
- Measured (two bot lives of 30 years): 0.49 cards a month (0.53 before); 65% of months quiet, 24% one card, 8% two,
  2% three, 0.6% four (a scheduled return landing on a busy month).

**Five places at most** (complaint 2): **Life** (Now, Decisions; on a phone Story too), **You** (on a phone your
profile; Path, Holdings, and Arms while at peace), **Family** (People, Dynasty), **World** (Realm, World, The Book,
Places, Codex) and **War** only while your realm (or your company's employer) is at war. `UI.GROUPS` is rebuilt
before each draw (a read of the state), so pages other features add to a group keep a place.

**No forced chapters, faith only for the devout** (complaint 7). 9993-life-chapters no longer queues `chp_card`: a chapter
opens with a line in the story and stands on the Life tab, where the third aim is chosen with two buttons
(`A.chpPick`, a journal command). The shrine aim and 97's "Serve the gods" ambition are offered only to the devout
(`A.V2T.devout`: in holy orders, born to clergy, or piety taken up to 60).

## State

`S.v2t = { turn, last, quiet }` (an old save gains it on load); queue items carry `v2c` once shown;
`pc.chap.cur.pick` while the third aim is open. Old saves load and play.

## Tests (`test.mjs`)

`v2tNoPlay` (no clock controls at 420 and 1366 px or in the war room; keys run nothing), `v2tNextMonth` (exactly one
calendar month a press, December into January, a mid-month save to the next month's start, quiet months open no
dialog), `v2tQuietToast` (the toast is the story's line and is gone after 2 s), `v2tBusyMonths` (0 to 3, summer busier
than winter, same seed same world), `v2tSameWorld` (the button path with and without drawing every page),
`v2tPlaces`, `v2tCampaign`, `v2tChapters`.

**Playtest 2 (Nov 6).** `v2tWarPlace`: a tap on War opens the War page from any page, at 420 and 1366 px (new 15 was
the playtest driver taking the War page's own "Path tab" link). `v2tChapterPanel`: the chapter is only an optional
Life panel, folded on a phone, and a full chapter is no longer a deed (old 16). On a desktop it stands open, or, where
the Life panel has no room for it (91-visual-style's `LOOK.fitLife`, round 2), folded to its title line until the player opens
it; one click keeps it open. The War Room's campaign note is 14 px on a phone (71-phone's `phoneTargets`).
