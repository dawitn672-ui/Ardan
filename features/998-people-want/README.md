# People show what they want

**Aspect:** Relationships and people (design review cycle 1, #8) · **Kind:** UI view (`want.core.js`), tests

**Why.** On the People tab every face in "Around you" carried a fighting tier chip, "Untrained", for a farmer's colleagues and his family alike. 21-npc-initiative already knows what each person wants of you, and 573 cast members have written wants, but none of it showed.

**What it does.** Each face shows a want chip:

| Who | Chip |
| --- | --- |
| someone you have not got to know | Wants ? (the tooltip says getting to know them is how you learn it) |
| a named cast member | the lore's own want: "Wants no crossing of the Gordush…" (full line in the tooltip) |
| anyone else you know | the strongest of 21's fourteen moves they have in mind toward you now, read from `NI.desire`: needs coin, has a venture in mind, would teach you hafts, has a match in mind for your child, speaks ill of you |
| when no move is on their mind | what their nature or station wants: wants to rise (ambitious), wants land of their own (a serf), wants to play (a child) |

Soldiers (`t.mil`, or an armed occupation) and your rivals and enemies keep the tier chip, where fighting is the thing to know.

**The hooks (pure render wraps, no patch).**

- `UI.rosterCard` ("Around you"): while it draws, `UI.tierChip` returns the want chip for a person who does not keep the tier.
- `UI.peopleBonds` (the lists below): the want chip goes after the bond chip in each row's `.bondline`.

91-look's rows are untouched; the chip uses its tokens (`--raised`, `--line`, `--accent`, `--lore-ink`).

**Rules kept.** Nothing writes the state or draws a random number; 21's desire is read inside `A.asDrawing`. Every string is escaped.

**Measured by** (`test.mjs`): `peopleShowWants` (a stranger shows "?", a cast member the lore's want, a rival keeps the tier, no non-fighter in "Around you" keeps a tier chip, no raw token, drawing is pure, a want with markup is escaped).
