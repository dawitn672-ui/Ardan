# The state diet (X5)

**Aspect:** the iPhone build rules (rule 21: no data that grows forever), saves · **Kind:** engine, no interface ·
**Decisions:** D-104 to D-106 · **History:** H-087

`tools/bench/state-size.mjs` plays a life to year 100 and breaks `A.S` down by key, by person field (the living and the
dead apart) and by realm field. What it found, and what this feature does about each:

| What grows | Year 0 → 50 → 100 (raw KB, seed 7) | Done |
| --- | --- | --- |
| The story log, `S.log` | 1 → 129 → 233 | **Compacted** (below): 233 → 94 at year 100 |
| Former lives (a dead player character's record) | 0 → 0 → 179 | **Trimmed** (below): about 65% of each |
| The living people | 1,352 → 1,884 → 2,429 | Not touched: the unknown never die (D-106, a proposal) |
| The world record, `S.wrec` | 1 → 121 → 250 | Kept whole: the annals the player reads ("none dropped"), and claims cite entries by index (D-104) |
| The journal (in the save, not in `A.S`) | 0 → 70 → 125 | Kept: it is the replay (D-104) |
| Realms | 399 → 1,113 → 1,134 | Bounded already: grows to a steady state in the first 25 years (forces, court, markets, polity, memories) |
| `aiLog`, `why`, `warEnds`, `news`, `v2dip.h`, `csHist`, `riGreat`, `provHist`, feud ledgers | | Bounded already by their features (rings of 300, 150, 40, 220, 400, 6, 6, 7; feuds fade out under 2) |

**The story log.** A chapter of the Chronicle (one life's decade of age) that closed more than `DIET.KEEP_LOG` (40)
years ago keeps the lines the book keeps of it (`A.chronicleKeep`, shared with 22-chronicle: the ten weightiest of the
life's own and three of the world's) and every line of the classes `big` and `death`. Every other line becomes `0`, a
mark that keeps the line's place, so the indexes the book's wording is hashed from and every count of lines (the
toasts', the hints', the drawer's) stay as they were. The book reads the same, word for word; "Show earlier years"
shows what the book shows of those years.

**Former lives.** A year after a player character's death (`DIET.DEAD_PC_YEARS`), the fields of a life being played
(`DIET.DEAD_PC_FIELDS`: the memory of choices, counts of scenes seen, echoes, the skills' records, life arcs, the
atlas, advisers, the deed log, the purse, the company's memory, the identity's voices) are removed. Every reader of
them reads `A.pc()` or guards a missing field; the heir has inherited what passes (`A.continueAs`: the atlas, bonds,
assets). What the dead are still read for stays: name, kin, house, stats and skills (the person view), renown, deeds,
flags, the relationships, the beliefs he held (64-npc-beliefs reads them), the body, the ending.

**When.** Each year (`A.onYear`) and on load (the release's `A.deserialize` calls `A.DIET.compact`). Both passes are
idempotent and monotone and draw nothing, so a state compacted once on load equals the state compacted every year of
play; an older save comes in compacted with no version step. `A.DIET.OFF` turns it off (the tests compare).

**Tests** (`test.mjs`): `dietSameAsPlayed` (a life played with the diet off and compacted at its end is the same state,
to the byte, as the life played with it on; the book is the same; nothing drawn), `dietSaveBars` (the packed state and
the gzipped save at year 0, 50 and 100 under bars from measured lives), `dietOldSaves` (every sample save loads, comes in
compacted, the book unchanged, compacting again changes nothing).

**Measured** (packed state KB / gzipped save KB, this build; `node tools/bench/state-size.mjs`): see D-105 for the four
lives and the bars.
