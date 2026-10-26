# Fold

**Aspect:** UI and UX (the owner's first complaint: "the screen is far too big … remove the need of so much scrolling by adding expander buttons") · **Kind:** system (one core file, no patches), plus tests

## Why

At 1366×768 the release drew every section of every tab open. The Life tab scrolled 4.6 screens inside its panel, the Holdings tab 8.2 (the armorer alone is 1,780 px, the market 1,260), the Realm tab 3.6, and the profile column 1.9. Three columns scrolled side by side.

## What it does

After every draw (`UI.render`, `UI.refresh`, `UI.refreshTab`, `UI.renderModal`), the layer reshapes the page. It reads layout and the player's fold choices, and never touches the game or the random stream.

- **Sections fold.** A header (`.group-h`) and the blocks under it become a section with a chevron and a count. The header is a button with `aria-expanded`.
- **Tall cards fold.** A card over 180 px gets a fold button in its corner and folds to its first row, so a first row with controls of its own (the armorer's categories) keeps them.
- **The Life tab's activities are an accordion.** The groups (Body & mind, Social, Faith …) open one at a time. "Only now" (the stage of life's own actions) starts open.
- **Defaults.** What the player needs on every visit starts open (What now, Your days, the job, the purse). Long reference sections start folded: the activities, the armorer, property, the trade roads, the council, the ladder, the realm's ways and speech.
- **Remembered.** Each open or fold is kept in the browser (`ardan_fold_v1`), per tab and section, not in the save. "Open every section" at the head of a tab opens all of them for that visit.
- **The profile.** The portrait sits small beside the name and chips, and the twelve bars sit two to a row, each with its label and number above a thin bar.

Measured at 1366×768, a noble of 30 (`foldFits`), screens of scroll in the panel: Life 4.6 → 2.7, Holdings 8.2 → 3.6, Realm 3.6 → 1.0, Path 4.6 → 4.2, profile 1.9 → 1.6.

Found on the way: opening the Path tab wrote a default reputation into the player's job (`A.jobRep`), which changes which events can fire. 21-npc-initiative's draw guard covered three draw functions but not `UI.refreshTab`, the one a tab click uses. It now covers all four.

## Tests

`foldFits`, `foldToggles` (a fold opens and closes, the accordion keeps one open, the choice survives a redraw and is stored, a card's corner button, open all), `foldPure` (six tabs drawn and folds clicked: state and random stream unchanged), `foldAxe` (0 violations on the folded Life, Holdings and Realm tabs).
