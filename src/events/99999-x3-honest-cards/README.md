# 99999-x3-honest-cards: cards and clocks that tell the truth

**Aspect:** X3 (`docs/CRITIQUE.md` §14: E1 to E12, T4, T6) and the "initiative" leftovers of H-020 (D-019) · **Kind:** system
(core files, tests in `tests/suites/x3.test.mjs`). Sorts after `99999-v2-content`; wraps `A.pick`, `A.evFit`, `A.canAct` and
`UI.barRow` from outside.

## What the player gets

- **No initiative anywhere.** B6 lifted the pool (D-019), but the words stayed: "60.0 initiative" on the Activities line, "Train in an
  extra session / Spend your initiative" in What now, "Not enough initiative" in the court and the polity, a market trip "needs N
  initiative", a ⧗ on every tile. The words are now what is true: an activity takes days; a body driven too hard grows weary
  (the Activities line says "A little tired / Weary / Driven too hard", `A.weariness`, from 999995-next-year's load). The clock's
  glossary and aria, the step summary and the help say nothing of it. `x3NoInitiativeOnPage` reads every tab, the help, an
  activity's sheet and every glossary popover of five lives; `x3NoInitiativeInSource` lists the old phrases and the ⧗ mark.
- **A feast on its date, a dated scene in its month (T6).** `a-calendar.core.js`: a pick of a feast gives this month's feast
  (the dice are drawn as before); a scene that opens on a date or a feast gets no weight in another month (`A.X3.datedMonths`);
  "Go to a feast" is shut in a month with none (July).
- **A fight says what it can end in (E1).** `9998-choice-stakes` builds the chip from the fight a choice opens: "Starts a fight
  to the death", "a fight, not to the death" (a brawl, a spar, a tourney, `lethal: false`), "a hunt the beast may end in your
  death". `x3FightStakes` reads every choice of every scene.
- **A sick body does not read "hale" (T4).** `b-health.core.js`: while a sickness is on you, the health word is "ill with marsh fever".
- **The ending is the life lived (E6).** "Master of the Craft" only for a craft; "Survivor" only for a life that began in childhood.
- **One system of units (E12).** Prose speaks kilometres, as the map and the journeys do. `x3OneUnit` fails on a mile.
- **No quiet line twice in a year (E9).** More lines per season and stage; a line used in the last year is not drawn again.
- **No love philtre slipped into a cup (E11).** The choice is cut.

## Tests

`x3NoInitiativeOnPage`, `x3NoInitiativeInSource`, `x3Calendar`, `x3FightStakes`, `x3Endings`, `x3OneUnit`, `x3QuietLines`, `x3IllShows`.
