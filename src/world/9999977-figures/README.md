# 9999977-figures: the figures registry, "Figures of the Age"

**Aspect:** the owner's order 96 ("many full profiles across the strongest most influential people across the continent.
kings, nobles, generals, all the ancient dragons and demons etc clear categorical organization"), with order 87 (every
established character a full profile) and order 93 (the player is told only what he should know) · **Kind:** system, two
readable core files, data (`data/figures/`, `data/titles/figures.json`), a validator (`tools/lint-figures.mjs`), tests.
Decision: D-193.

## What it does

**Nine categories in two groups**, one data file each (`data/figures/<category>.json`, words in `vocab.json`):

| Group | Category | Kind | Profiles |
| --- | --- | --- | --- |
| Of the realms | Rulers | generated | every living realm's ruler (35 at the start) |
| | Great Houses | generated | the heads of the ducal and marcher houses (rungs N01, N02: about 75) |
| | Generals | generated | the hosts' Generals who are people: the crown's, each first host's senior General, the lords who lead their first host by right (about 18) |
| | Masters of the Orders | generated | each elite order's Grand Master (8) |
| | Masters of the Peoples | link | `data/power.json`'s four masters, with an overlay (class road, temper, goals, grudges, secret) |
| Beyond the realms | The Legends | link | `data/legends.json`'s sixteen, in groups (the King of Dragons, the Primordial Archdemons, the Sword Saint, the rest) |
| | The Ancient Dragons | fixed | Inferno and Water (Ashgar, Rimewing), with the storm ancient Vaskareth's legend sheet (`category.legends`, D-198), each with a dominion |
| | The Elder Dragons | fixed | nine, at the bestiary's counts (Elder Ash x3, Frost x2, Storm x2, Brine, the Red Widow) |
| | The Ancient Demons | fixed | thirty-three, by rank at the bestiary's counts (Marquis of Hell x20, Duke of Hell x9: Pit-Mothers and Ledger-Keepers, Prince of Hell x4: the Pit Dragons; D-197), sworn 12 / 11 / 10 to Red, Noir and Blanc (ids ghazrul, morvane, vethrael), every one in Hell and horned |

**A profile** (`A.FIG.profile(id)`): name, style, kind or race, level, class, skills with rank and level, arts readied,
titles, items, temper and traits, goals and grudges (the reasons `A.WHY` reads), home, fame, story, and a secret.

- **Fixed beings** are hand-written. Their kind is a bestiary species; their level is near their kind's (lint: within 10;
  the ancient dragons' Old Blood adds ten, as the bestiary's own title does); their skills are the library's
  (`data/skills/kinds/beings.json`, only arts their kind is born with) and one of their own; their titles are
  `data/titles/figures.json`'s (weight X, monster titles; holders agree with the sheets). A demon's home is a place of
  Hell by name (the Cinderlands, the Gatelands, the Hush, the disputed Scorched March, the Ashen Marches: map version 5's
  domains, stored as names so this does not wait on the map), a dragon's a place of the Dragon Mountains. Their disputes
  (the Archdemons' quarrel, the Scorched March, the Pit Wyrms against the dragons) are their grudges.
- **Generated people** are views of the state, never stored: level `A.LV.level`, class `A.LV.CL.shown`, skills from their
  rungs (`A.SK2.rungFor`, printed by `A.SK2.label`), arts held and readied by the same pure choice a fight makes
  (`E.chooseReady`), titles `A.TT.shownOf`, temper `A.WHY.temper`, goals from post and traits (and the cast's own wants),
  grudges from their feelings and enmities, a story from the realm's line (`LORE.rulerHistory`), the post's record and the
  world record (`A.WC`). A person is listed once: ruler, great house, order master, then General. Cached by the state and
  the date (a `Map`, never saved).
- **Wired into A.POWER** as the legends are: `PW.FIG` holds each fixed being's sheet, and `PW.being(id)` reads it (kind
  `figure`): its level and might are real (every one below every legend; the ancient dragons above the elders; the
  ancient demons about the elders). They fight only where an existing encounter path meets them (none yet).

**What the player may read** (`A.FIG.knows`): a fixed being of `fame: known` is named with its public story; a whispered
one is a line of its kind and count until he learns of it. A legend or a master as the codex already reads them
(`PW.knowLevel`). A person: rulers and the orders' masters by name everywhere, great houses and Generals of his own realm,
anyone he has met. Skills, arts and items once met; goals, grudges and the secret once close (kin, a friend, a lover, his
lord, a bond of 50 or more) or once learned: a flag `fig_<id>` (a being's id, or a person's) on the player, which any
card may set with `fx: { flag: 'fig_<id>' }`.

**The view** (`b-view.core.js`): the codex's **Figures of the Age** button (release `23-ui-f.js`, guarded): the categories
as buttons, the chosen one's figures in rows grouped by liege, by legend group or by realm; a row opens its profile in place.
Descriptions open on a press (`UI.note`), controls 44 points, one column from 375 px, no percentages.

## Edits outside this folder (guarded, commented)

- `src/world/9999970-powers/a-power.core.js` `PW.being`: a figure's id resolves to `PW.FIG`'s sheet, kind `figure`.
- `src/core/release/core/23-ui-f.js` `UI.TAB.codex`: the button and the page, when `UI.figuresPage` exists.
- `tools/lint-titles.mjs`: the fixed figures' sheets count as sheets naming titles (holders agree). `tools/check.mjs` runs
  `tools/lint-figures.mjs`.

No `A.addStage`, no new name defined twice, no draw from any stream, no write to `A.S`, no state (no save version).

## Tests (`test.mjs`)

`figRegistry` (every category; 33 ancient demons at the bestiary's counts, sworn to the three; 3 ancient dragons; 9 elder;
every fixed profile full, its titles, skills and level valid and real in A.POWER; the power order; the people of three
worlds each a full profile, valid class, titles and skills, listed once), `figKnown` (a fresh peasant over three worlds
sees no secret and no whispered name; a flag and a meeting open them), `figDeterministic` (the same seed, the same
registry, at the start and a year on; reading and drawing draw nothing), `figPhone` (375 x 667).

## Not done here

- No card yet tells the player a figure's secret or brings him to meet a fixed being; the flag `fig_<id>` and
  `A.S.pw.metLeg` are the doors.
- The fixed beings do not yet act (no seasons, raids or courts of their own); `A.FIG.mind(id)` is ready for `A.WHY.decide`.
- Counts (the 201 counts and the lesser lords) are not profiled; the great houses stop at dukes and marquises.
