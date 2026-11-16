# Retired: the ambitions (97-first-life-fixes part 3)

**What it was.** `c-ambition.core.js` and `ambition.events.js` from `src/events/97-first-life-fixes/`: at coming of age, at
35, in a reign's first year and after an ambition was met, a card (`lfx_amb_young`, `_mid`, `_reign`, `_top`) offered up to
three ambitions (`p.amb = { k, y }`, 21 kinds); the Life page showed its next step and a progress bar; the engine wrote a
deed when it was met. The same file held What now's pointers to the second half of a life (`LF.whatMore`: an office to
seek, a cargo to sell far off, a journey, arms of your own) and the ruler's desk (`LF.desk`: the crown's debt first).
`test.retired.mjs` holds its tests (`lfAmbition`, `lfAfterTheTop`, `lfWhatNowSystems`) as they were in
`src/events/97-first-life-fixes/test.mjs`.

**Why retired.** Owner order 54 (the playtest, P3; D-062 addendum): "remove the ambitions feature. the useless decisions
and chapters. everything comes down to free will. any of these things should be available to you but not a single thing
should be handed to you without you seeking it out."

**What replaced it.** Nothing is handed. The release's `pa_*` scenes, written for an ambition, read `C.ambition(p, k)`,
which now asks `A.SEEK` (`src/people/9989-what-you-seek`): the plan's aim the player set, the training he chose, the post
he took. The goal stack (`src/ui/999998-goal-stack`) shows only what the player took on (debts, favours owed, promises
made in the open). Old saves keep `p.amb`; nothing reads it.

**Last commit that built it:** `c6fb716` (branch `p3-playtest`, from `v2-integration` at `2aaf1ba`).
