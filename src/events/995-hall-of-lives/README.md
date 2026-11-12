# The Hall of Lives

**Aspect:** Replayability (design review cycle 1, #1; the "endings and achievements reset" bug) · **Kind:** UI system (`hall.core.js`), 6 events (`hall.events.js`, three start stories), tests

**Why.** `A.newState` builds a fresh `A.S` with `ach: {}`, and 28-endings keeps its collection in `A.S.endings`. Every new game from the death screen began at "Endings found (0/20)" and no achievements: the game forgot every life but the current dynasty's.

**What it does.**

- **The store.** Every life that ends is written once to a browser record, `UI.store` key `ardan.hall.v1`, the way 97-life-fixes keeps `UI.set.lfLives`. Each entry: name, people, realm (and its colour), years and age, ending and manner, cause, score, the achievements that life earned, the world seed, the start story and the lands. The last 60 lives are listed; how many lives found each ending, manner and achievement is counted for ever. It is never in `A.S`, a save or the journal, and the engine never reads it.
- **When it is written.** In a wrap of `A.pcDeath`, after 28 has named the ending. Never while `A.replay` runs (`A.jPaused`), and a life already in the Hall (same seed, person, birth and death year) is not counted again. Reading tolerates a missing, broken or hand-edited record: every field is re-typed, strings lose `<>"{}`, a colour must be `#rrggbb`.
- **The title screen: "Your lives".** The last 12 lives as cards: an initial on the realm's colour, name, years, realm, the ending and manner, the epitaph, the seed. A header counts lives, endings, ways to go and achievements across the Hall, and the stories still shut say what opens them. `UI.hallShelf()` returns the markup. The title belongs to lane O, so the shelf is placed by a wrap of `UI.renderTitle`: in a `<!--hall-->` slot if the title has one, else above the playtest line, else at the end; and not at all if the title already drew `hl-shelf` itself.
- **The death screen.** "The Hall of Lives. New: *Cut Short* (3 of 22 endings) · *fell in the field* (4 of 9 ways to go) · First Blood." If the life opened a story, it says so.
- **The Dynasty tab.** A line under the save's own collection: "Across your 7 lives in this browser: 5/22 endings, 4/9 ways to go, 9/37 achievements". An ending or achievement this save lacks but the Hall has shows its text and "In an earlier life".
- **Three stories the Hall opens** (`UI.HALL.STARTS`, kept beside 29-starts' twenty and applied by this feature's own wraps of `A.storyFor`, `A.newGame` and the creation screen, the way 29 applies its own; gated by `UI.HALL.GATES`):

  | Story | Opens after | Start |
  | --- | --- | --- |
  | The Beggar's Heir | three lives lived | a beggar of Solenne, 15, with a dead man's pitch and debt |
  | The Sexton's Book | five different endings found | a gravedigger of Morhaven, 18, with an empty coffin in the book |
  | What Is Left of the House | ten achievements across your lives | gentry of Varenna, 20, of a house that backed the wrong claimant |

  Each has an opening scene and a callback 6 or 7 years on that reads the opening's flag. On the creation screen a shut story is not drawn (the list is drawn without it, and a stale click is refused), an open one is tagged "New", and a line names what opens the rest. The choice travels as `o.story`, like any 29 story, so a journal replays the life with the Hall empty.

**Rules kept.** Rendering only reads the store; every string from it is escaped. No `A.rand`. Known World games are unchanged unless a Hall story is chosen.

**Measured by** (`test.mjs`):

- `hallKeepsLives`: three lives die (one dies twice): 3 kept, the achievement of the second recorded, a new save's own endings at 0 while the Dynasty tab shows the Hall's; drawing the death screen, title and Dynasty tab changes neither state nor dice; nothing of the Hall in the save. Before this feature a new game showed 0 of everything.
- `hallNotOnReplay`: replaying a journal with a death in it adds nothing.
- `hallShelfEscaped`: a tampered record (markup in names, a CSS colour with `url()`, junk entries) draws as text.
- `hallOpensStories`: the Beggar's Heir is hidden and unpickable with an empty Hall, shown and tagged New after three lives, starts its scene, and its journal replays identically with the Hall emptied.

**For lane O (title, creation).** Leave `<!--hall-->` where the shelf should go, or call `UI.hallShelf()` yourself. Start-story cards can read `UI.HALL.GATES` and `UI.HALL.open(id)` for the "New" tag and the locks.
