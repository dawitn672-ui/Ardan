# Design brief audit: "Woodblock & Light" against the built game

*Oct 27, round 10 (lane L7). Each section of `docs/design/brief.md` checked against a build of the fix layer, every feature and the round's work in progress (`--include-wip`), in a Great Continent life (a peasant of the Clans of the Old Mare, POL-60) and a Known World one. Screenshots at 1366×768, 1920×1080 and 390×844, Night and Day; the paths are at the end. The owner confirmed the brief is the direction; `docs/art/style-guide.md` is superseded.*

**Status words.** **Done:** built as the brief says, or with a recorded reason for a difference. **Partial:** built in part; what is missing is named. **Missing:** not built. "This round" marks what lane L7 built on Oct 27.

## Summary

| Section | Status | Notes |
| --- | --- | --- |
| §1.1 Surfaces and ink | Done | 91-look, both themes; `tokensContrast` holds every text token at 4.5:1 (worst 5.13 by night, 4.84 by day) |
| §1.2 Accent and status | Done | 91-look |
| §1.3 The six stats | Done | rail tiles, check chips, delta chips, tooltips; 95's icons |
| §1.4 Odds bands | Done | 92's odds badge: percentage, band word, four pips, band tint |
| §1.5 Rarity tiers | Done (this round) | gear quality, achievements, fighting tier, once-in-a-life events, the Codex's beasts |
| §1.6 Realm and house colours | Partial (this round) | `UI.realmInk`; 118 far realms given distinct accents (`UI.realmHex`); the map and the release's own chips still read the raw colour (lane L2, the lead) |
| §2 Typography | Done | 77-offline-fonts and 91-look: Literata, Atkinson Hyperlegible Next, Cinzel, Dela Gothic One; the scale; 68ch |
| §3 Space, shape, depth | Done | tokens, radii, cut corner on `::before`, elevation, glow, star field and washi ground |
| §4.1 1366×768 | Done | `fitsOneScreen`: rail 698/698, panel 615/615, the page does not scroll |
| §4.2 1920×1080 | Done, one difference | Activities in 3 columns, not 4 (at 4, 140 px tiles cut a third of their labels) |
| §4.3 761–1099 | Done | identity strip and the Stats sheet |
| §4.4 Phone | Done, one difference | Activities in 3 columns, not 2 (2 made the page 1.45 screens); the event sheet now fits a 375×667 phone with the first-run hint showing (this round) |
| §4.5 Other tabs as small multiples | Partial (this round) | People rows, the Realm header band, gear rows on Holdings and war strength bars built; holdings' income sparklines and the Path ladder track are missing |
| §5.1 Buttons | Done | 91-look |
| §5.2 Tabs | Done | the release's tablist already moves by arrow keys (`UI.tabKeys`); badges are the release's |
| §5.3 Expanders | Done, one difference | 90-fold; the open state is kept in the browser (`ardan_fold_v1`), not in `UI.set.open` |
| §5.4 Stat bars and tiles | Partial (this round) | bars, tiles and the rail's delta flash done; the 1920 sparklines are missing |
| §5.5 Chips | Partial (this round) | trait, status, rarity and "+N" done; the realm chip (swatch dot, name in realm ink) on a person's Realm row and the Realm band, not yet in rows and tooltips |
| §5.6 Cards and tiles | Done | one card level; activity tiles with icon, cost and tooltip |
| §5.7 Modals and sheets | Done (this round) | the release's modal restyled; the close button's glyph now fills its button |
| §5.8 Tooltips | Done (this round) | 59-tooltips with 91's look; a pinned tooltip now shows a gold top edge and a pin |
| §5.9 Event scene card | Done | 92-scene-card |
| §5.10 Toasts and cut-ins | Done (this round) | toasts now stack (at most three, newest on top, kinds, pause on hover); cut-ins by 96 |
| §6 Motion | Done | tokens; the Motion setting (Follow system, Full, Reduced, Off) |
| §7.1 Portraits | Done (this round for the far peoples) | 93; the Great Continent's 110 cultures now drawn in their lands' dress and tones |
| §7.2 Event skies | Done (this round for the far lands) | 94; five far climates added |
| §7.3 The map | Partial | lane L2 (62-inked-map); gaps listed below |
| §7.4 Icons | Done | 95: 44 icons; not tested on people |

---

## §1 Colour tokens

### §1.1 Surfaces and ink: done

91-look defines both sets and maps the release's names (`--surface-1`, `--text-1`, `--bad` and the rest) onto them. The vellum page of the Chronicle keeps its values. `tokensContrast` checks 396 text/surface pairs in both themes.

### §1.2 Accent and status: done

The gold fill has its 1 px `#8a5a10` border by day, and the danger fill its border. Glow by night only.

### §1.3 The six stats: done

One colour and one icon per stat on the profile's tiles, the check chip, the delta chips and the tooltips. Health has its own red, and renown is gold. A vital under 25 turns danger with a ▼.

### §1.4 Odds bands: done

92's badge keeps the engine's cuts (75/50/30), shows the percentage, the band word and four pips on a 14% tint, and sits only on `--raised`.

### §1.5 Rarity tiers: partial (built this round)

| Where | Status |
| --- | --- |
| Gear quality | **Done.** `UI.qualChip` gives Fine the uncommon tier (◆) and Masterwork the epic tier (◆◆◆): tier border, gem, tier text. A gear card on Holdings takes its piece's tier as a 2 px edge, with the glow by night. `LOOK.gearTier` also lifts a people's own make (`rare`), a master's piece (`masterOnly`) and a famed one (`fame`). |
| Fighting tier | **Done** (91-look's rail chip; the People rows keep the release's tier chip). |
| Once-in-a-life events | **Done** (92: ◆◆ ONCE IN A LIFE). |
| Deeds and achievements | **Done.** The 37 achievements of the Dynasty tab each have a tier, from First Blood (common) to Legend (mythic), with gem, edge and tier word; locked ones keep the gem, muted. |
| Legendary beasts | **Done** (this round) in the Codex's bestiary: an animal is common, a great beast rare, a titan legendary, a legend mythic (gem, edge, glow). 79's beast scenes do not mark them yet. |

### §1.6 Realm and house colours: partial (built this round)

- **`UI.realmInk(hex, theme)`** (91): done, as the brief gives it.
- **153 realms.** The Great Continent's 118 realms came from the lore in one pale family per land: pinks on the Twin Rivers, straws on the Long Grass, lilacs on the High Steppes, greens on the Peninsulas, teals on the Isles. Neighbours read alike. **`UI.realmHex(realm)`** (this round) gives each far realm an accent within 42° of its lore hue, at one of four lightnesses and two chromas. The pick keeps it apart from the realms it borders at the start, and more weakly from their neighbours; the largest realms choose first. It reads only the generated data (`A.FL_DATA`), so it is the same in every game and after a save and load, and it never touches `A.S`. The Known World's 35 keep their colours.
  - Measured by `realmColours`: the OKLab distance between bordering far realms (median and least, before and after), the pairs under 0.04, AA ink for all 118 in both themes, purity.
- **Used by:** the portrait ground (93), the Realm band (91).
- **Not yet used by:** the map (62-inked-map, lane L2) and the release's own uses of `r.color` (about 20 places: map fills via `realmIdx.color`, chips, banners). See "Changes needed elsewhere" in the round report.
- **The map's hatch** for two neighbours closer than 0.08: missing (L2).
- **A realm chip** with its swatch dot and its name in `realm.ink`: only in the Realm band.

## §2 Typography: done

77-offline-fonts embeds the four families. 91-look sets the scale, multiplied by the text-size setting: 15 px prose and 14 px UI, tabular numbers, 68ch prose. The phone keeps 71-phone's 14 px floor; its caps are 14, not 13. Dela Gothic One is used by 96's cut-ins and the obituary's score.

## §3 Space, shape, depth: done

- spacing, row heights and radii as variables;
- the cut corner on `::before`, so the focus ring shows (primary button, event card, portrait frames, cut-in bands, the active tab bar);
- one card level;
- elevation and glow;
- the ground: a seeded star field and ridge by night, washi fibre by day, static and hashed from the world seed.

## §4 Layout

### §4.1 1366×768: done

`fitsOneScreen`: rail 698/698 and panel 615/615 px, the page does not scroll, Your days folded. 27 of 31 activity tiles are in sight; the rest scroll inside Activities, because 97-life-fixes' ambition card takes a row.

### §4.2 1920×1080: done, one difference

The full figure sits above the name. Your days is open. Activities stay in 3 columns, because at 4 the 140 px tiles cut a third of their labels.

### §4.3 761–1099 px: done

A 64 px identity strip, and a Stats button that opens the rail as a sheet.

### §4.4 390×844 phone: done, one difference

- The identity strip, What now as one row and Your days folded are built.
- Activities use 3 columns of 44 px tiles. The brief's 2 columns made the page 1.45 screens; 3 give `phoneLife` 1.26.
- **Events** are a full-screen sheet. This round, the first-run hint ("Each choice shows your odds…") floats over the print. It used to push the sheet 90 px down, so "A love philtre" needed 72 px of scrolling on a 375×667 phone. The tags' row is 4 px tighter. Measured by `scPhoneFit`.
- The check chip and odds badge still sit on their own line under the label on a phone. At 285 px there is no room for the label, the stake line, the chip and the badge together.

### §4.5 The other tabs: small multiples, not cards — partial (built this round in part)

| Tab | Status |
| --- | --- |
| **People** | **Done.** Each person is a row of about 26 px: a 22 px bust, the name, the relation, age and post (ellipsized), the bond chip, and a 48 px opinion bar. About twenty fit in the panel. The same rows serve the court on the Realm tab and person lists in dialogs. On touch, rows are 44 px. |
| **Realm** | **Partial.** A header band with the realm's tint and its accent edge, the coat of arms, the name in the realm's ink, the ruler's title and name, the ruler's bust, and four headline numbers: treasury, army, stability, provinces. The council and lords are rows. Missing: sparklines for the four numbers (the realm keeps no history of them). |
| **Holdings** | **Partial** (this round in part). 90-fold folds it from 5.9 to 2.4 screens (`foldFits`, a peasant). What you carry is one row per slot: the slot, the piece and its tier, what it does, and Sell. The armourer's rows are denser, and only the item's name is a tooltip target. Missing: the 60×16 income sparkline per holding, which needs an income history kept as UI state. |
| **Path & War** | **Partial** (this round). Each war of your realm carries a strength bar of us against them: the standing armies of each side's realms, ours in `--ok` from the left and theirs in `--danger`, with both numbers. Missing: the ladder as one horizontal track. |

## §5 Components

### §5.1 Buttons: done

Primary, secondary, ghost and danger, each with hover, pressed, focus and disabled states. The reasons on disabled buttons come from 97-life-fixes.

### §5.2 Tabs: done

Icon over cap label; the selected tab has a gold bar with a cut corner. The release's `UI.tabKeys` already handles arrow keys. The segmented controls sit on a sunken track.

### §5.3 Expanders: done, one difference

90-fold supplies the chevron, the count pill, the summary when closed, the defaults and "Open every section". The open state is kept in the browser (`ardan_fold_v1`), not in `UI.set.open`. It is still never saved in `A.S`.

### §5.4 Stat bars and stat tiles: partial

- Done: flat bars with a potential tick, and the 72×36 tiles with icon, abbreviation, number and bar.
- **Done this round:** the **delta flash**. When a vital or a stat on the rail changes between two draws of the same life, its number shows ▲ +2 in `--ok` or ▼ −3 in `--danger` for 1.6 s, and its bar pulses once (not under reduced motion). The first draw of a life, or a loaded game, shows none.
- Missing: the **sparklines** of the 1920 rail.

### §5.5 Chips: partial

- Done: trait, status, rarity (this round) and the "+N" overflow chip.
- The **realm chip** (an 8 px swatch dot, the name in realm ink) is used on a person's page, in its Realm row (this round), and in the Realm band. It is not yet used in rows or tooltips.

### §5.6 Cards and tiles: done

### §5.7 Modals and sheets: partial

- Done: the scrim, the trapped focus, Esc to close, focus back to the opener, and 71's bottom sheet on the phone.
- The close button showed a small "×" in a large gold-framed box when it had focus (seen at 1920×1080). Its glyph now fills the 32 px button (this round).
- With a person open, the How hard buttons of Your days show beside the modal at 1920×1080. They are inert by design, because the page behind a modal is inert. See the planInt note in the round report.

### §5.8 Tooltips: done (this round)

59's behaviour and 91's look were in place. **This round:** a pinned tooltip (opened by a click, or a hover that was then clicked) gets a 2 px gold top edge and a pin glyph (`LOOK.syncPins`).

### §5.9 The event scene card: done

92-scene-card: the vignette, the bust, choice rows with check chip, odds badge, effect hint and the ONCE edge, the result in place with delta chips, and the dock.

### §5.10 Toasts and cut-ins: done (this round for toasts)

**Toasts** (this round, `96-moments/toasts.core.js`):

- They stack: at most three, newest on top. `#toast` stays the newest and the live region; older ones move into `#toast-stack`, which is `aria-hidden`.
- An icon and a 3 px edge in the toast's kind:
  - danger: a refusal, a loss;
  - ok: a gain;
  - accent: the rest.
- 4 s on screen, paused while the pointer or focus is on one.
- Bottom right on desktop; on the phone, at the top of the content.
- Measured by `toastStack`.

**Cut-ins:** 96, one a month at most, skippable, with a reduced-motion banner and their own switch.

## §6 Motion: done

The motion tokens are defined. Only transform and opacity animate. 96's Motion setting (Follow system, Full, Reduced, Off) sets `data-motion`, which 91, 92 and 96 obey.

## §7 Art direction

### §7.1 Portraits: done (this round for the far peoples and a bug)

93-anime-portraits draws every person.

**This round:**

- **The Great Continent's peoples.**
  - **Each far culture is read from `LORE.cultures[id].land`** (ten lands). Its land gives a cut of dress, headwear, a dye, a pattern, favoured bangs and extras, a ribbon colour, and a range of skin, hair and eye tones:
    - the Twin Rivers: crossed robes and topknots;
    - the Long Grass: kaftans with fur collars and cone hats;
    - the High Steppes: fur hats and red cords;
    - the Sand Basins: turbans and striped robes;
    - the Southern Peninsulas: drapes, beads and saffron;
    - the Thousand Isles: wraps and zigzag drapes;
    - the Sunrise Isles: crossed robes;
    - the Black Pines: fur and hoods;
    - the Rime Coast: fur hoods;
    - the Deep Southland: wraps, beads, locks and curls.
  - **Seventeen cultures have their own line:** the camel clans, the yak folk, the sea-hunters, the Deep Forest folk and others.
  - **The release's `A.genAppearance` knows only the Known World**, so a steppe rider could be pale and red-haired. The stored tone is kept in order and pressed into the land's range, so kin still look alike, and drawing stays pure.
  - Measured by `apFarPeoples`.
- **"A love philtre":** the love interest, a man of 21 the release gave `hstyle: 'bald'`, drew as an old, balding man. Before 30, 'bald' is now drawn as a crop; from 30 to 40 as a crop or a shave; from 40 on it stays bald.

### §7.2 Event vignettes: done (this round for the far lands)

94-woodblock-skies.

**This round:**

- **Five far climates**, read from a far province's biome. Each dresses the land beyond the eight release words:
  - **jungle:** palms over a dark wood (the rainforest and monsoon forest of the Isles, the Peninsulas and the Deep Southland);
  - **savanna:** flat-topped thorn trees on gold grass;
  - **taiga:** close stands of spruce;
  - **alpine:** pasture under snow peaks (the High Steppes and the Sand Basins' mountains);
  - **scrub:** dry woodland bushes on the Twin Rivers' loess.
- **Six building shapes** for the far lands' houses and towers:
  - curved eaves: the Twin Rivers, the Sunrise Isles and the Peninsulas;
  - domes: the Sand Basins;
  - felt tents: the Long Grass and the High Steppes;
  - stilt houses: the Thousand Isles;
  - round thatched huts: the Deep Southland;
  - log houses: the Black Pines and the Rime Coast.
- A Known World province keeps its word and its buildings.
- Measured by `skyFarLands`.

### §7.3 The map: partial (lane L2, 62-inked-map)

Seen in the world tab and the full map of a Great Continent game. For lane L2:

- **Realm colours:** the far realms' map fills are the lore's pale family colours. `UI.realmHex(r)` gives the distinct accents, and the fill should read it.
- **The 0.08 OKLab hatch** for close neighbours: not drawn.
- **The selected realm's `realm.glow`** and the 1 px `--accent` hover outline: not drawn.
- **Armies:** banners in the house colour, with arrows for next month's planned move. Not drawn, as far as the full map shows.
- **The sea:** a Prussian-blue bokashi with the 1 px coastline ripple repeated. Check it on the far coasts: the far lands are drawn from their own relief, so the release's sea picture does not cover them.

### §7.4 Iconography: done

95-icons: 44 icons on the 24 grid. They have not been tested on people who have not played (the fist, the seal and the sun with a face most need it). Lucide is still used for the release's other icons.

---

## §8 The 15 changes

| # | Change | Status |
| --- | --- | --- |
| 1 | Column budgets of the three-column layout | Done (91) |
| 2 | 30 activity cards as a grid of tiles with tooltips | Done (90, 91) |
| 3 | Expanders with summaries and remembered state | Done (90) |
| 4 | The rail as a compact identity block | Done (91) |
| 5 | The four typefaces | Done (77, 91) |
| 6 | Night and Washi tokens with role colours | Done (91); realm colours for 153 realms this round, the map still to follow |
| 7 | Events docked as a scene card | Done (92) |
| 8 | Results in place with delta chips | Done (92) |
| 9 | Cel-shaded anime busts | Done (93); the far peoples this round |
| 10 | Woodblock skies | Done (94); the far climates this round |
| 11 | The phone's identity strip, tiles and event sheet | Done (71, 91, 92); the sheet fits a 375×667 phone this round |
| 12 | People, Holdings and Realm as small-multiple rows with sparklines | Partial: People rows, the Realm band, gear rows and war strength bars this round; every sparkline is missing |
| 13 | About 40 icons | Done (95) |
| 14 | Cut-ins for the big moments | Done (96) |
| 15 | Motion tokens and the Motion setting | Done (91, 96) |

## Still to build, most visible first

1. **The map takes `UI.realmHex`** (lane L2): without it, the far realms' chips and portrait grounds differ from their map colour.
2. **Sparklines:** holdings' income, the 1920 stat tiles and the Realm band's four numbers. Each needs a short history, kept as UI state or recorded by the engine.
3. **Path & War:** the ladder as a horizontal track.
4. **Realm chips** wherever a realm is named: People rows, tooltips, the war rows.
5. **79's beast scenes** wear the beast's tier.

## Screenshots

Before (the round's start, `--include-wip`): `/tmp/ardan/L7/shots/before/{life,people,holdings,realm,path,event}-{1366x768,1920x1080,390x844}-{dark,light}.png`. After: `/tmp/ardan/L7/shots/after/…` with the same names. Far peoples, before and after: `/tmp/ardan/L7/shots/far-before.png` and `far-after.png`. "A love philtre" at 375×667: `/tmp/ardan/L7/shots/philtre-375.png` (before) and `/tmp/ardan/L7/shots/after/philtre-375.png`.
