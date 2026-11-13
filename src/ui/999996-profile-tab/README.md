# 999996-profile-tab: the Profile page

**Aspect:** UI, character (work item P; owner order 33, D-035, D-038) · **Kind:** two readable core files, tests. No events, no patches.

The owner, on the gate 2 cards: "there should be a whole tab for a game-like profile and stats, titles etc." This is that page, grown from the card (Ser Edric Vale is the bar): the whole standing figure, the card, the body and mind in words, and folded detail.

## Where it lives

The **first page of the You place** (D-038): You is now Profile, Path, Holdings, Arms. The rail's "Full profile" button opens it. On a phone the old You page stays as "Glance". The old overlay (`UI.ov = { type: 'profile' }`) still draws.

## What is on it

| Part | Content |
|---|---|
| Figure | The whole standing person (`PORTRAIT.svg(p, size, { figure: true })`), the picture the library draws, on its painted ground |
| Card | Estate kicker with its glyph (lowly, town, arms, crown), name, epithet, title line, house and place, the house's arms, **a line about the person** (`PF.about`: build, temper, dress or arms, a lasting mark), four measures in words (Body, Purse, Name, Honour; Faith for the devout), each opening its description |
| Sheet | Body and mind: six rows, each a word on a scale of seven with the potential as an open mark; "How you are": health, mood, looks |
| Titles, posts and offices | Estate, crown or succession, noble title, headship of a house, council seat, polity offices, command, trade, each with its years; **posts held before** |
| Skills and fighting style | The best eight proficiencies as named tiers with the way to the next, "All of them", styles with their rank word, fighting worth in levies |
| Renown, honour and deeds | The words, what made the name (99999-v2-renown), what the book of days holds |
| House and household | Arms, motto, blazon, rank and seat; parents, spouse, children as buttons that open the person |
| Gear and heirlooms | One tile a slot (weapon, ranged, armour, shield, helm, mount, cloak); things named (blade, horse, dog, ship); `p.heirlooms` when E2 fills it |
| Years, health and marks | Age and stage, health, wounds with a heal word, lasting scars |
| Measured | 99993's sheet in the world's units (cm, kg, m/s, ms), every row with its description |
| Character, birth and faith | Traits and quirks, people, culture, faith, realm, tongues, looks, bloodline |

Every number is inside a trigger of 59-descriptions (opens on click); there are no percentages. A section's body is drawn when it is opened (`UI.A.pfFold`), so closed sections hold nothing. Which are open is kept in the browser (`ardan_pf_v1`), not the save.

## Growing it (G, E2, others)

```js
UI.PF.addStat({ k: 'cha', label: 'Charm', group: 'Mind',
  read: p => ({ word: 'fine', at: 4, pot: 5, tip: ['stat', 'cha'] }) });   // at/pot: 0 to 6 on the seven words
UI.PF.addSection({ k: 'mounts', title: 'Mounts and hounds', sum: p => 'two horses', body: p => '<ul>...</ul>' }, 'years');  // before 'years'
```

A body must escape what it writes (`UI.esc`) and keep any number inside a trigger (`UI.note(text, label)` or `data-tt`). `PF.heirlooms` reads `p.heirlooms = [{ n, from, y }]`.

## State

`pc.pf = { cur: { key: { t, k, y } }, past: [{ t, k, y0, y1 }], fresh }`, written once a month by `PF.sync` (no dice). Old saves have none; it begins the first month after loading, and a post first seen then has no "since".

## Edits outside this folder

`src/core/release/core/23-ui-a.js` (the rail's button, guarded), `src/ui/91-visual-style/look.d-dom.core.js` (the rail row takes the new button), `tools/lib/clutter.mjs` (the page is in the B5 list).

## Tests (`test.mjs`)

`pfPlace`, `pfPhone`, `pfPure`, `pfEscaped`, `pfNumbers`, `pfClicks`, `pfFits` (1366 x 768, 420 and 360, B5's budgets), `pfFigureSame`, `pfOldSave`, `pfPosts`, `pfGrows`, `pfEveryAge`.
