# Icons

**Aspect:** Visual art and UI (docs/design/brief.md §7.4, change 13 of §8) · **Kind:** UI system, no patches, no events.

The release draws its icons with `UI.icon(name)` from `UI.ICONS`, a set of Lucide outlines: generic web glyphs (a floppy disk for Save, two coins, a scroll). The brief asks for about forty of Ardan's own. They are period objects on a 24 × 24 grid, lit from the upper left, so the dense layout can shed words the way Slay the Spire's intents do.

## What it does

**The set** (`icons.core.js`, `UI.ICONSET`). There are 44 drawings, each with its word and its group:

| Group | Icons |
| --- | --- |
| The six stats (§1.3) | fist (Strength), wing (Speed), eye (Combat instincts), flame (Stamina), lamp (Intelligence), peak with a flag (Willpower) |
| The six vitals | heart (Health), sun with a face (Happiness), hand mirror (Looks), laurel (Renown), shield (Honour), candle (Piety) |
| The purse and the clock | two sun-coins (Coin), hourglass (Initiative), broken coin (Debt) |
| The 13 groups of the Life tab | sprout (Only now), book (Body & mind), two cups (Social), candle (Faith), mortar and herb (Health), bow (Wilds), laurel (Glory), purse (Money), road (World), banner (War), mask (Intrigue), dagger (Crime), anvil (Work) |
| The six tabs | sun (Life), people, crossed swords (Path & War), house (Holdings), crown (Realm), open book (Chronicle) |
| The controls | chevron, pin, close, menu, wax seal (Save), play, next, moon (Quiet), info, warning, check, lock |

Every icon is a stroke drawing in `currentColor`. The release's `.ic` class sets the 1.75 stroke, round caps and round joins, and the stroke scales with the icon. Each has at most one filled accent shape: a catchlight, a flame's heart, a crown's jewel, sand in the glass. The whole set is 8.9 KB, and the largest icon is 621 B.

**Where they go.**

- **Through the release's own hook.** `UI.ICONS` gains the new names, and the release's names the set covers are redrawn: coins, users, swords, crown, book-open, scroll, house, hourglass, map-pin, save, menu, play, skip-forward, moon, info, triangle-alert, check, lock, x, chevron-right, heart, shield, eye, flame and sun. Every place that already asks for one of them (the clock, the purse, the place, Save, Menu, cards and boards) gets the new drawing with no patch. The release's own set is kept as `UI.ICONS_RELEASE`.
- **The tabs.** `UI.GROUPS` asks for sun, people, swords, house, crown and open book.
- **The profile.** Each vital's label starts with its icon. The six stats take theirs from `UI.ICON_STAT`. When 91-look is in the build, its 3 × 2 stat tiles draw ours (`LOOK.STAT_ICON`). Without it, the release's stat rows carry them before the word.
- **The Life tab.** Each group header carries its group's icon. When 91-look draws the activities as tiles, each tile takes ours (`LOOK.groupIcon`).
- **The purse.** A debt gets the broken coin. Save and Menu, which show only their icons at mid widths (84-top-bar), gain a `title` with their word.
- **Tooltips.** A stat's, a vital's, the purse's, the clock's and an activity's popover (59-tooltips' `TT.html`) opens with the icon beside its word in the heading.

**Labels.** The brief says an icon is always labelled the first time it appears on a screen, and in its tooltip. Every one of our icons on the Life screen sits in a row, button or label with its word, or in a button named by `aria-label` or `title`. `iconsWired` checks this. Icons are `aria-hidden` because their word is already there. `UI.iconOf(name, cls, true)` gives a labelled one for any place that uses an icon alone.

## Measured by (`test.mjs`)

| Test | What it holds |
| --- | --- |
| `iconSet` | 44 icons cover the brief's list (stats 6, vitals 6, purse and clock 3, groups 13, tabs 6, controls 12); each parses, stays inside the 24 grid, uses only `currentColor` and has at most one fill; 8.9 KB in all; drawn with 1.75 stroke, round caps and joins |
| `iconLegible` | Rasterized at 16 px, every icon inks between 8% and 40% of its box (one-stroke controls from 3%), and no two differ by fewer than 14 of 256 pixels. The one exception is the sun of Life and Happiness, which the brief gives one subject |
| `iconsWired` | On the Life screen: 6 tabs, 8 top-bar icons, 6 vitals, 6 stats, 12 groups and the debt's broken coin; tooltips open with the icon; every icon has its word |
| `iconsPure` | Drawing every tab and the menu twice leaves `A.S` and `A.rngState` unchanged and gives the same markup |
| `iconsAxe` | 0 axe violations (WCAG 2.2 AA) on the Life screen, dark and light |

## Art review

`sheet.mjs` writes the set at 16, 20, 24 and 48 px on the night and washi grounds. `sheet-small.mjs` writes only the working sizes in real pixels, scaled up without smoothing:

```sh
node features/95-icons/sheet.mjs built.html icons.png
node features/95-icons/sheet-small.mjs built.html icons-small.png --zoom=3
```

Three rounds of review at 16 px changed:

- the sun-coin, from a wheel (the brief forbids gears) to two stacked coins;
- the broken coin, which read as a brain;
- the mirror, which read first as a light bulb, then as a magnifier, before it became an upright hand mirror with a grip;
- the dagger, which matched the wing at 16 px;
- the candle, which was too small;
- the wing, whose feathers needed deeper notches.

## Limits

- **Not tested on people.** The brief asks for each icon to be shown alone to someone who has not played, to see whether it is read right. The pixel test catches blots, ghosts and look-alikes, not meaning. The fist (a mitten at 16 px), the seal (Save) and the sun with a face (Happiness) most need that test.
- **Life and Happiness share the sun,** as the brief lists them; at 16 px only the face tells them apart.
- **Many places keep Lucide.** The release's other icons (target, sparkles, flag, award, star and the rest) are still Lucide outlines. They are similar in weight, but they are not period objects.
- **Choice checks.** Stat icons on a choice's check chip, on deltas and on level-ups belong with the scene card (92-scene-card). `UI.ICON_STAT` and `UI.iconOf` are there for it.
