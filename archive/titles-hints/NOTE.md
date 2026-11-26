# Retired by order 92: the hints about titles

D-183 kept a title's requirements hidden but let a rumour hint at one: once a person had done one of a title's deeds, a
tavern card (`tt_hint`, "A name in the telling") could tell him a line about it, at most once a title a life, and Records
kept those lines under "Things you have heard". Order 92 (2026-11-26) took that away: "no hints throughout the games on
titles" (D-185). The last commit that built any of it is `177c9970`.

| Here | Was | Now |
| --- | --- | --- |
| `titles-hints.js` | `TT.hintable`, `TT.heard`, the card `tt_hint`, Records' "Things you have heard", the log line "The crown does not name you ... this year" (it told the player he had met the title's hidden conditions), the deed sentence and the title's own line on another person's title card (they named the deed), and the linter's rule for a hint's words | nothing: a title is announced only when it is earned (`tt_earned`) or lost (`tt_lost`); on another person's card his title shows its name, rarity, gifts and honour; `tools/lint-titles.mjs` fails a title carrying a `hint` and any source line that tells of titles not yet held |
| `hints.json` | the twelve `hint` lines of `data/titles/people.json` and the Sword Saint's in `data/titles/legends.json` | gone from the data |

A save's `p.tt.hd` (the hints heard) is left where it is and read by nothing.
