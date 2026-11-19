# Retired in W1-4: the levy (D-086 to D-089)

The owner's order 54, answer 5: "remove levies: conscription when needed; armies are built on honour and volunteers".
The last commit with all of this live is `26e0068` (W1-3's rebuild); `a81d8cc` renamed it before it was retired.

- `emergency-levy.js`: the release's `A.emergencyLevy`, called each month by `A.indMonth` for an AI realm at war. While
  the standing army was under 35% of its lore size and the pool held 1,500 men, it raised up to three "Levy Host"
  divisions a month from the pool, with no reason given and no end. Replaced by conscription by proclamation
  (`src/war/9999952-men/c-calls.core.js`, `A.CALLS`): a named need, a decision through `A.WHY`, three calls by lot,
  raised by each lord, released when the need ends.
- `levy-law.js`: the release's levy law (`A.LEVY`, `r.laws.levy`) and its branch of `A.setLaw`. Its three steps
  multiplied the pool (x0.75, x1, x1.3) and the lords' yearly mood. Now `A.CONSCRIPT_LAW` / `r.laws.conscript`: the same
  three steps say how far the crown may call by lot on its own word (the first, the second, every call); the roll is
  one man in a hundred whatever the law, and the lords' yearly mood is kept.
- The pool itself (`r.levy`, about one in twenty of the people) is the roll (`r.roll`, about one in a hundred).
