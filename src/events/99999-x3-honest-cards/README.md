# 99999-x3-honest-cards: cards and clocks that tell the truth

**Aspect:** X3 (`docs/CRITIQUE.md` §14: E1 to E12, T4, T6) and the "initiative" leftovers of H-020 (D-019) · **Kind:** system
(core files and two scenes; tests in `tests/suites/x3.test.mjs` (part 1) and `x3b.test.mjs` (part 2)). Sorts after `99999-v2-content`; wraps `A.pick`, `A.evFit`, `A.canAct` and
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

## Part 2 (D-059): who you are, where you are, who is there

- **No station word without the station (E4).** `d-station.core.js`: `A.X3.STATION` lists the words that address the player by a
  station ("your men", "my lord," as an address, "Master <you>", "your journeyman", "you are a journeyman") and the gate each needs
  (`A.X3.HOLDS`: gentle, landed, commands, officer, master, crew...). A scene whose own text uses one gets no weight for a life that
  fails the gate (`A.evFit`); other people's titles ("Captain Hobart", "the sergeant at the gate") are not touched.
- **Home-town scenes stay home (E5).** `e-place.core.js`: `A.X3.whereIs` (the road, the division's ground, else home), `A.X3.away`.
  A scene set in the home town ({home}, or the code reads `p.home`, and not news from home) gets no weight while the player is
  away; "Isabella of Aurora" is a name, not a place.
- **Counsel from someone there (E7).** `A.X3.present`: alive, free, on the same ground (a prisoner is with prisoners). The last
  look (`f-guard.core.js`, an `A.eventView` stage) takes an absent voice off the card.
- **No adult's question for a child under six (E3).** The same last look drops a scene dealt to a child whose own condition says no
  (`trigger: true` world events skip it when queued).
- **The last look** also drops any card whose finished text breaks a station or place rule, as a card with an unfilled token is
  dropped; `A.X3.stats` counts them. `tools/lint-cards.mjs` lists the scenes whose condition lets such a life in, and the pronoun
  slips (`tools/lib/card-lint.mjs`).
- **The preview is what happens (E2).** `c-preview.core.js` and `9998-choice-stakes`: no "▲ piety" for a man with no faith; a price
  and a share of the purse are both said ("Costs 4 suns", "▼ a share of your coin"); "▼▼ what the story was about" for a lost house.
- **A fatal illness is an arc (T4).** `g-illness.core.js` and `.events.js`: onset (bm_ill, 49-body-mind) -> worsening (`x3_ill_worse`:
  the physician now, the priest, or tell no one) -> the turn of the fever (`x3_ill_crisis`: the physician, the priest, the family at
  the bed, each a check) -> the fever breaks or he dies of it.

## Tests (part 2: `tests/suites/x3b.test.mjs`)

`x3PreviewReplay400`, `x3HonestCards` (12 worlds x 30 years and six nurseries: station, place, children, counsel), `x3Pronouns`,
`x3IllnessArc`.

## Tests (part 1)

`x3NoInitiativeOnPage`, `x3NoInitiativeInSource`, `x3Calendar`, `x3FightStakes`, `x3Endings`, `x3OneUnit`, `x3QuietLines`, `x3IllShows`.
