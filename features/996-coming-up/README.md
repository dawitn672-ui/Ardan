# Coming up

**Aspect:** Pacing and UI (design review cycle 1, #2) · **Kind:** UI view (`coming.core.js`), tests

**Why.** The life is lived a week or a month at a time, and the engine knows a good deal about what is ahead (scheduled returns, the realm's customs, feast days, the ambition), but nothing on screen said so. Initiative sat at "7/7 full" for years with no word that it was going to waste.

**What it does.** A strip at the top of the Life tab, above What now, with the next five known things, soonest first:

| Source | Example |
| --- | --- |
| initiative at or near the cap | Now · Initiative is full: it stops filling until you spend some |
| a custom of your realm due this month or next (47-realm-bible's `year` kind; 990-far-peoples' exam, census, muster and season through their own `FP.DUE`) | Next month · The hearth mark (Aldmark) |
| a far believer's own holy day (990), else the next feast day (`GD.FESTIVALS`, which 990 turns into the faith's days) | Next month · Lantern Night, a feast day |
| a scheduled return with a public label | March · The guild judges your masterpiece; July · Hruza is due to repay 7 suns |
| the ambition's next step (97-life-fixes) | Ambition · Raise a full house: find someone to marry |

**Public labels.** A scheduled item shows only if it says what it is: an item's own `label` (or `ctx.label`), which any `A.schedule` call may add, or a promise made in the open, named in `UI.COMING.LABELS`: a loan to be repaid (21's `ni_borrow_repaid`/`_default`, worded the same either way), a venture coming to account, an agreed wedding, the end of an apprenticeship, a rematch. Everything else (a secret coming out, an arc's turn, a deathbed) stays hidden.

**Rules kept.** A view: it reads the state and never writes it, draws no random number and calls no engine command. Escaped throughout. 91-look's tokens (`--line`, `--surface`, `--accent`, `--ink-*`, `--warn`, `--t-*`).

**Measured by** (`test.mjs`): `comingUpShows` (a labelled loan and an item's own label shown, an unlabelled surprise hidden, a custom due next month and full initiative shown) and `comingUpPure` (five years drawn every month: the strip appears, no draw moves the state or the dice, and the world is the same with and without looking).

**For other features.** Add `label: 'Spring: the guild judges your masterpiece'` to an `A.schedule` item, or a line to `UI.COMING.LABELS[eventId] = (item, pc) => text | null`.
