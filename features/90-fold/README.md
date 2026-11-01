# Fold

**Aspect:** UI and UX (the owner's first complaint: "the screen is far too big … remove the need of so much scrolling by adding expander buttons") · **Kind:** system (one core file, no patches), plus tests

## Why

At 1366×768 the release drew every section of every tab open. The Life tab scrolled 4.6 screens inside its panel, the Holdings tab 8.2 (the armorer alone is 1,780 px, the market 1,260), the Realm tab 3.6, and the profile column 1.9. Three columns scrolled side by side.

## What it does

After every draw (`UI.render`, `UI.refresh`, `UI.refreshTab`, `UI.renderModal`), the layer reshapes the page. It reads layout and the player's fold choices, and never touches the game or the random stream.

- **Sections fold.** A header (`.group-h`) and the blocks under it become a section with a chevron and a count. The header is a button with `aria-expanded`.
- **Tall cards fold.** A card over 180 px gets a fold button in its corner and folds to its first row, so a first row with controls of its own (the armorer's categories) keeps them.
- **The Life tab's activities are one section.** The groups (Only now, Body & mind, Social, Faith …) are merged into a single grid in their fixed order (`FOLD.mergeActs`); each tile keeps its group in `data-g` and `data-gn`, and the first of each group is marked. 91-look draws the grid as 3 columns of tiles with each group's icon. (Until 91-look the groups were an accordion that opened one at a time.)
- **Headers inform when closed.** A section's header carries a count and, while it is closed, a one-line summary of what it holds (`.fold-sum`: a table's row count, or its first words). What now's header carries its count and, folded, its first step. Every fold button names what it controls (`aria-controls`, with ids drawn from the tab and the section, so the same screen draws the same markup).
- **Defaults.** What the player needs on every visit starts open (What now, Activities, the job, the purse; on the rail, Best proficiencies). Your days starts folded to its own summary line when 91-look is in the build (it keeps the training select in that line), except in a window 1600 × 1000 or larger, where there is room for it open. Long reference sections start folded: the armorer, property, the trade roads, the council, the ladder, the realm's ways and speech, and the rail's Body. What now and Your days fold whatever their height.
- **Opening shows.** A section the player opens fades in (`fold-anim`); a redraw does not replay it.
- **Remembered.** Each open or fold is kept in the browser (`ardan_fold_v1`), per tab and section, not in the save. "Open every section" at the head of a tab opens all of them for that visit.
- **The profile.** The portrait sits small beside the name and chips, and the twelve bars sit two to a row, each with its label and number above a thin bar.

Measured at 1366×768, a noble of 30 (`foldFits`), screens of scroll in the panel: Life 4.6 → 2.7, Holdings 8.2 → 3.6, Realm 3.6 → 1.0, Path 4.6 → 4.2, profile 1.9 → 1.6. With 91-look's layout on top (folds off → on): Life 3.5 → 1.0, Holdings 6.5 → 2.8, Realm 3.1 → 1.0, Path 4.3 → 3.9, profile 1.8 → 1.0.

Found on the way: opening the Path tab wrote a default reputation into the player's job (`A.jobRep`), which changes which events can fire. 21-npc-initiative's draw guard covered three draw functions but not `UI.refreshTab`, the one a tab click uses. It now covers all four.

## Tests

`foldFits` (with 91-look in the build, at most 1.05 screens for Life and the profile, 3.2 for Holdings and 1.6 for Realm; without it 3.2, 1.7, 4.5 and 1.6; and four tabs shorter than with folds off), `foldToggles` (the activities are one section, open, and name the box they control; Your days starts folded with its summary; a fold closes with a summary and opens again, the choice survives a redraw and is stored; a card's corner button; open all), `foldPure` (six tabs drawn and folds clicked: state and random stream unchanged), `foldAxe` (0 violations on the folded Life, Holdings and Realm tabs).

## Cycle 2 (lane G, Oct 29): the long tabs fold

- **Codex:** every entry folds to its title row (two to a row on a wide panel), with a filter field at the head ("Find in 74 entries"; UI state, never saved). 23.9 → 2.7 screens at 1366 (a noble of 24 on the Great Continent).
- **Dynasty:** Endings found and Achievements start folded to their summaries, and the achievements open as a grid of small tiles. 5.0 → 1.0.
- **Path:** the list of paths starts folded once you hold a post. 3.9 → 2.1.
- **Holdings:** on a phone the market is one 44 px row a good (71-phone); it stays open by default, as the phone tasks and the card fold expect.
- **The road** (9990's modal): "Capitals and far realms" starts folded, and on a phone "Caravans leaving this month" too.

`foldLongTabs`.
