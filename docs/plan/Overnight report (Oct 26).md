# Overnight report: Oct 26

The owner asked for six things before they returned:

1. a screen that doesn't need so much scrolling;
2. buttons that work;
3. a redesign from first principles, aimed at players of 13 to 23;
4. a self-diagnosis against what players complain about in similar games;
5. a continent the size of Asia with ten times the detail;
6. a complete lore of the world, built as a web.

This report covers what shipped, what didn't, and the calls the owner should make.

## What shipped

| Feature | What it does | Measured |
| --- | --- | --- |
| 90-fold | Sections fold under headers with a one-line summary. Tall cards get a corner button. The profile is compact. Fold state is remembered. | Screens of scroll at 1366×768: Life 4.6 → 1.0, Holdings 8.2 → 3.6, Realm 3.6 → 1.0, profile 1.9 → 1.0. On a phone, Life 2.69 → 1.26. |
| 98-feedback | Every action that used to change something silently now says what it did. The menu closes on a second click. Map mode buttons show which one is on. | Dead-click sweep (below). |
| 91-look | The Woodblock & Light design (`docs/design/brief.md`): Prussian-blue Night and washi Day themes, role colours for the six stats and vitals, a four-level type scale, one grid of activity tiles. | Axe accessibility checks find 0 violations in both themes. |
| 77-offline-fonts | Literata, Atkinson Hyperlegible Next, Cinzel and Dela Gothic One ship inside the page. | Identical offline and behind school filters. |
| 93-anime-portraits | Cel-shaded anime busts with layered eyes, hair masses, a rim light and a realm ground, on every screen that shows a person. | |
| 94-woodblock-skies | Event pictures drawn as colour woodblock prints lit like anime backgrounds. | |
| 95-icons | About forty of Ardan's own icons: period objects on a 24 px grid. | |
| 92-scene-card | Events become a card docked over the story column. Each choice has a numbered tag, a stat chip and an odds badge with pips. The result shows a SUCCESS or FAILED stamp and chips for what changed. On a phone the card is a full-screen sheet. | 200 real events checked at 1366 px and 60 at 390 px: 0 bad. 40 results gave 100 chips with 0 mismatches. |
| 96-moments | Anime cut-ins for promotions, battles won, crownings, weddings, births, deaths of kin, epithets and the new year, at most one a month. A Motion setting (follow system, full, reduced, off). | |
| 97-life-fixes | Seven fixes from the complaint research: fewer repeats, ambitions, a reason on every disabled control, late-game great works, a protected first life, and cost and failure lines on choices. | Scenes already seen this life: 45.8% → 10.6%. Disabled controls with no reason: 89 of 142 → 0 of 147. |
| 99-far-lands | The Great Continent, built from the lore: the Known World plus everything east and south of it. | 118 new realms, 1,727 new provinces (2,033 in all), 293 million people, 110 cultures, 55 faiths, 266 houses, 29 straits, 48 sea lanes. |
| 09-scale | Indexes and memos so a world ten times bigger stays playable. Results are bit-identical. | At 10× the world: year-turn month 16.0 s → 1.7 s, ordinary month 1.37 s → 0.75 s. |

The lore is in `canon/lore/`. That folder is gitignored because the repository is public. It holds five books:

- an atlas of 118 realms;
- 110 peoples and 55 faiths;
- war and legends: 303 fighting styles, 121 orders, 40 Legends and 160 Masters;
- 140 beasts;
- a compendium of about 58,000 words, with a web index linking every entry to the things it is tied to.

The owner can read all five in the private **Ardan Codex**, with links between entries, hover previews and search: https://claude.ai/artifact/Knet7jdKPfhtpxcKvAdi7J.

## Checks on the integrated build

The integrated build has all 94 features, 147 patches and 68 event packs, and weighs 4.7 MB.

- **Balance:** every starting path is within its band in `bench/targets.mjs`. Check win rate 48.9%, 9 arc types, 0 page errors.
- **Tests:** the full suite (477 tests) passed 472 at first. The five failures were cross-lane, and each is fixed:
  - `stagesHaveTheirOwnPlay`: the single activity grid had dropped the "Only now" header. The Activities header now names the stage's own tiles.
  - `wcTokens`: an outlaw exiled to unclaimed land had no near realms, so the chronicle could cite no war. The realms bordering the home now count as near.
  - `ttCov2Scenes`: the new check chip and stake line carried numbers with no tooltip. Both now explain themselves; coverage is 93 of 93.
  - `twoScalesPhone`: 91-look's `h3` rule beat the battle book's rubric colours, which failed contrast on the vellum.
  - `skyPhone`: 92's phone sheet lets the print grow into the spare height. The test now expects that.

  A re-run of the affected tests, every test of 57, 59, 92, 96 and 97, and the replay and render-purity checks: 54 of 54 passed.
- **Dead-click sweep** (`tools/deadclicks.mjs`, 19 screens, 2,293 controls): 0 actions with no handler and 0 click errors. 37 controls flagged.
  - Holdings: 30, mostly tooltip cells in the armoury table, which explain on hover and do nothing on a click. Its Buy buttons were checked by hand and work.
  - "Slave" on the creation screen is greyed out with its reason ("not in this realm"). The tool now reads that as disabled.
  - The zoom and filter buttons flagged were already in the state they set.
  - Still open: the training-intensity buttons in another person's profile.

## What did not ship, and why

- **The 0.25 s month on the Great Continent.** It takes about 0.56 s with 09-scale. The cost left is spread over the war day, caravans, diplomacy and about 30 monthly hooks. Closing the gap needs a coarse tick for lands far from the player, which changes results, so it is the next stage rather than tonight's.
- **Far Lands content in play.** The realms, rulers, houses, faiths and ties are in the game. The lore's events, troop doctrines, beasts and realm bibles for the Far Lands are not yet: that is stage 3 of `features/99-far-lands/README.md`.
- **Province names from each culture's place-name list.** Capitals use the lore's names; other far provinces use a sound palette per land.
- **Time.** About six hours were lost when every agent stopped at a usage limit (08:30 UTC) and nobody resumed them when it reset at 13:10. They resumed at 19:45.

## Calls for the owner

1. **Great Continent by default?** It is opt-in: the creation screen has a new field, *Lands*, set to "The Known World" by default. Every test, bench and bot keeps the original world. Making the big world the default costs speed (a month takes 0.56 s instead of 0.07 s) and needs the stage-3 content to feel as rich as the west.
2. **The design brief replaces the old style guide.** `docs/art/style-guide.md` (illuminated manuscript) is marked superseded by `docs/design/brief.md` (Woodblock & Light, aimed at 13 to 23).
3. **New realm ids start at POL-36.** POL-35 is left free.
4. **First-life protection.** Unless Realism is chosen, a first life cannot die before 5. Choices that kill still kill.

## Known weak spots

- In "A love philtre", a young love interest was drawn as an old, balding man (93's age reading).
- On a phone, reading and answering an event now needs 48 px of scrolling at 375 px, because the check chip and odds badge wrap under the label.
- `phoneDesktopSame` failed once on a loaded machine with "pixels differ" on Holdings, then passed twice alone.
- The Black Pines come out at 17.3M km² against the lore's 9.4M, because the lore's boxes there are twice their stated areas.
- 66-markets' road memo key `a*4096+b` will collide past 4,096 provinces.
