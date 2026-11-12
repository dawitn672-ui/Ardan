# Click-to-open (round 2, B4)

**Aspect:** UI and UX (the owner's order B4, `docs/DECISIONS.md` D-007: descriptions open on click, never on hover) · **Kind:** UI system (two core files), plus tests. The engine is `src/ui/59-descriptions`; this feature is what has to load after the other features' tiles and badges.

## What it does

- **Activities explain themselves before they commit** (`sheet.core.js`, CRITIQUE U9). `UI.A.act(k)` now opens a sheet (`UI.ov = { type: 'actSheet', id: k }`): what the activity is, what it costs and how much it teaches this time, how it may go in words (by its kind: safe, risky, dangerous), why it cannot be done now, and **Do it** / **Not now**. `UI.A.actDo(k)` runs the activity as before (`A.doActivity`) and the sheet becomes a card holding the whole answer (the activity's message, or the story lines it wrote). Nothing is cut: the release's `slice(0,137)` and `slice(0,157)` are patched out (`59-descriptions/patches.mjs`) and the inline note above the tiles (97-first-life-fixes) is no longer shortened. An event that the activity begins takes the screen instead. `UI.A.practice` (the proficiency button) answers the same way. "What now" suggestions that name an activity open its sheet too.
- **The last sweep** (`sweep.core.js`). 59-descriptions lifts every long `title` and `data-note` into a click-to-open description after a redraw and, by a `MutationObserver`, after any change. This feature loads later than the tiles and badges that draw into the page after that first pass, and runs the same pass once more when a view or a dialog has been drawn, so a page never rests with a long title on it.

## Tests (`test.mjs`)

| Test | What it holds |
| --- | --- |
| `clickNoHover` | Every anchor of every page of four lives gets every hover event (`pointerover`, `mouseover`, `pointermove`, ...) and some real pointer moves: nothing opens. The maps show no province card to a pointer that only moves; a press shows it and Esc closes it. |
| `clickOpens` | A press, a second press, Esc, a press elsewhere, Enter and Space; a lifted description opens by press and Enter; an anchor in a row explains itself and the row waits; on a phone a tap opens and a tap outside closes; a choice keeps its tap and its info glyph opens the odds. |
| `clickLint` | No `title` of more than three words on any drawn page (tabs, people, profile, help, menu); no `title="..."` of more than three words, no title set on an element, and no hover handler that opens a tip, in the code of any feature (the matchers of `tt.wire*.core.js` and the finds of `patches.mjs` are not authors). |
| `clickActSheet` | A press on a tile opens the sheet and does nothing yet; Esc closes it; Do it commits; a 400-character answer is shown whole, and no toast is cut. |

## Limits

- The time dock's buttons keep their hints for assistive technology only (`aria-description`), not as a click-to-open note: the dock is B6's. The reason a disabled control is disabled (97-first-life-fixes `d-reasons`) opens through an info button beside it.
- The sheet's "how it may go" is words by the activity's kind, not a per-life number: the release gives activities no odds of their own.
