# 999999-one-redraw

Round 2 A1, "Lag" (docs/CRITIQUE.md §2 item 3; P2, P5, P7, P11, P21, Q2, T3, part of U7). One owner of redrawing while
time moves. Last in the build (`999999` sorts after every `99999-…`), so its wrappers are the outermost.

- **One full redraw a press.** While a step runs (`UI.stepper.run`), `UI.refresh` draws only the card and the clock
  (`UI.REDRAW.lite`), `UI.clkLight` paints only the clock, and the clock is repainted whole only when what it says
  changes (otherwise its progress bars and the date's spoken label are set in place). The step's end makes the one
  full `UI.refresh`; a step that ends without it (stopped, a battle) gets it from the next clock paint.
- **Passes once per draw.** `UI.REDRAW.depth` counts nested draws; the post-draw passes of 90-collapsible-sections,
  91-visual-style, 95-icons, 96-big-moments, 97-first-life-fixes and 9998-choice-stakes run only after the outermost
  draw, not after each `refreshTab` and `renderModal` inside `UI.refresh`. `UI.REDRAW.frozen()` (a step under way, no
  full draw) tells 90 and 91 that the page behind the card is unchanged.
- **The story log** (`UI.paintLog`, patches `RD-LOG-*`): the page holds `UI.LOG_YEARS` (2) years, the rest behind the
  release's "Show earlier years"; it is updated in place (years that left the window removed, new lines appended), and
  scrolled in the next frame only when something was added.
- **Starting a life** shows "Making the world…" before the one-to-three-second build (only for a real press; code that
  calls `UI.startLife` starts at once).

Pure drawing: nothing here reads `A.rand` or writes `A.S`. The stepper itself (84-top-bar, 99992-v2-time) is
unchanged; B6's Next year runs month turns one after another under this policy, so a year costs one redraw at its end.

Measured by `tools/bench/press-gate.mjs` (budgets) on `tests/saves/press/`; tests: `rdOnePerPress`, `rdLogInPlace`,
`rdStartLine`.
