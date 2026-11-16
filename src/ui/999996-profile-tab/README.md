# 999996-profile-tab: the Profile page

**Aspect:** UI, character (work item P; owner order 33, D-035, D-038) · **Kind:** two readable core files, tests. No events, no patches.

The owner, on the gate 2 cards: "there should be a whole tab for a game-like profile and stats, titles etc." This is that page, grown from the card (Ser Edric Vale is the bar): the whole standing figure, the card, the body and mind in words, and folded detail.

## Where it lives

The **first page of the You place** (D-038): You is now Profile, Path, Holdings, Arms. The rail's "Full profile" button opens it. On a phone the old You page stays as "Glance". The old overlay (`UI.ov = { type: 'profile' }`) still draws.

## What is on it (P2: clean, D-041)

The main page is the figure, the card, the sheet and one small panel; the past and the long reads are on **Records**, a second view of the same page.

| Part | Content |
|---|---|
| Figure | The whole standing person (`PORTRAIT.svg(p, size, { figure: true })`) in a gilt frame |
| Card | On a parchment ground (as gate 2's card): estate kicker with its glyph, name, epithet, title line, house and place, the house's arms, up to three further posts held now, **a line about the person** (`PF.about`), four measures in words (Body, Purse, Name, Honour), each opening its description |
| Sheet | Body and mind: six rows, each a word on a scale of seven with the potential as an open mark (`PF.addStat`); one line of health, mood and looks |
| Panels (tabs) | One at a time, chosen by tabs (state kept in the browser): **Skills** (arts and the best five proficiencies), **Gear** (what is carried), **Family** (house, arms, motto, up to six kin who open the person), **Traits** (chips). `PF.addPanel({ k, label, body })` adds one |
| Records link | One small link at the end of the tab row opens Records; "Back to profile" returns |

**Records** (`PF.view = 'records'`, UI.tab stays `profile`): a single column of folded sections, the posts and the deeds open, the rest folded (open state kept in the browser). Titles, posts and offices with **held before**; skills and fighting style (all of them, in a fight); renown, honour and deeds (what made the name, set down); house and household (blazon, rank, seat, kin, the tree); gear and heirlooms (named things); years, health and marks; measured (99993's sheet, as given); character, birth and faith. `PF.addSection(def, before)` adds one. Leaving the page, or pressing Profile, puts the page back on the profile view.

Every number is inside a trigger of 59-descriptions (opens on click); there are no percentages. A Records section's body is drawn when it is opened (`UI.A.pfFold`). Which are open is kept in the browser (`ardan_pf_v1`, `ardan_pf_tab`), not the save.

## Growing it (G, E2, others)

```js
UI.PF.addStat({ k: 'cha', label: 'Charm', group: 'Mind',
  read: p => ({ word: 'fine', at: 4, pot: 5, tip: ['stat', 'cha'] }) });   // at/pot: 0 to 6 on the seven words
UI.PF.addPanel({ k: 'arts', label: 'Arts', body: p => '<ul>...</ul>' });   // a tab on the profile: keep it short
UI.PF.addSection({ k: 'mounts', title: 'Mounts and hounds', sum: p => 'two horses', body: p => '<ul>...</ul>', open: false }, 'years');  // into Records, before 'years'
```

A body must escape what it writes (`UI.esc`) and keep any number inside a trigger (`UI.note(text, label)` or `data-tt`). `PF.heirlooms` reads `p.heirlooms = [{ n, from, y }]`.

## State

`pc.pf = { cur: { key: { t, k, y } }, past: [{ t, k, y0, y1 }], fresh }`, written once a month by `PF.sync` (no dice). Old saves have none; it begins the first month after loading, and a post first seen then has no "since".

## Edits outside this folder

`src/core/release/core/23-ui-a.js` (the rail's button, guarded), `src/ui/91-visual-style/look.d-dom.core.js` (the rail row takes the new button), `tools/lib/clutter.mjs` (the page is in the B5 list).

## Tests (`test.mjs`)

`pfPlace`, `pfPhone`, `pfPure`, `pfEscaped`, `pfNumbers`, `pfClicks` (tabs, the Records link, a fold, back), `pfFits` (1366 x 768, 420 and 360: P2's own budgets, one screen on a laptop; Records held to six), `pfLean` (words, controls, no long line, one panel), `pfRecords` (everything moved is reachable there), `pfFigureSame`, `pfOldSave`, `pfPosts`, `pfGrows` (a stat, a panel, a section), `pfEveryAge`.
