# Starting stories

**Aspect:** Replayability and pacing (Road to Ten, Replayability 1) · **Kind:** system plus 40 events

The release builds every life from the same sliders: people, realm, rank, age. It has no hand-made way in. This feature adds 20 starting stories, chosen on the first step of "A new life". Each one sets the birth, puts the life in a situation, opens with its own scene, and plants a memory that comes back five to fifteen years later.

**The twenty.**

| Story | People and place | Rank and age |
| --- | --- | --- |
| The Bailiff's Ledger | Ashmere | serf, 17 |
| No Land for a Second Son | Varenna | younger son of a house, 19 |
| The Carved Debt | Stonehold, dwarf | artisan |
| Clanless | Tusk Clans, orc | 16 |
| The Last Tree of Your Line | Sylvaran, elf | gentry |
| Born Under the Articles | Blackreef | 16 |
| The Temple's Child | Solenne | foundling, 15, lettered |
| The Widow's Books | Lucerna | merchant's widow, 24 |
| The Smallest in the Hall | Frostholm, giant | |
| The Horse You Were Not Given | Nine Winds | 16 |
| The Letter in Your Mother's Box | Greyhaven | a lord's bastard, 19 |
| The Scribe's Chain | Qadir | a slave who can read, 20 |
| After the Fever | Morhaven | 14, the last of a village |
| Both Sides of the River | Tessaria, civil war | gentry, 20 |
| Neither Tree nor Stone | Eldergrove, half-elf | |
| Salt and Silence | Spice Coast | trader who owes the smugglers, 22 |
| The Novice Who Read Too Much | Skyhold | novice, 17, with a key to the closed shelf |
| What Took Your Father | Northreach | hunter's child, 18 |
| The Queen's Ward | Drevna | royal ward, 16 |
| The Company That Did Not Pay | Highland League | soldier owed a year's pay, 21 |

The 20 starts cover 17 realms and all seven peoples, and every rank from slave to royal.

**How it works.**

- **The creation screen.** "Begin from a story" sits at the top of the first step. Picking one sets the people, realm, rank, age, and sometimes sex and birth order, plus a fitting given name. The summary shows the story. Changing the people, realm or rank afterwards clears it (`A.storyFor`).
- **At birth.** The story travels in the `A.newGame` options (patch START-OPTION), so a journal replay starts the same way. Each story then:
  - applies its situation: coin, letters, piety, trained skills, or a beast you have heard of;
  - sets `st_<id>`;
  - forces its opening scene.
- **The openings.** Each opening has two or three choices. Each choice sets `st_<id>_<choice>`. Some use checks.
- **The callbacks.** These are rolled events (weight 4, once) that need `C.flag(p, 'st_<id>')` and 5 to 15 years since. They read what you chose: the bailiff's son has the ledger, your brother writes, the boy you spared is at the horse fair, the quartermaster is in a cell, your nurse's last letter arrives.
- **Ties to other features.**
  - *The Novice Who Read Too Much* teaches you a secret's truth (26-belief-truth).
  - *What Took Your Father* sets a beast of your home ground as heard of. Tracking it marks it seen, and its callback is the fight.
  - *The Scribe's Chain* can end with your freedom.

**Measured by** (`test.mjs`):

- `startsAll`: all 20 stories.
  - Each starts with the promised people, realm and rank.
  - Each opening is queued, renders without raw tokens, and resolves. The longest opening is 47 words.
  - Each callback is eligible once the story is 16 years old.
- `startsCreateScreen`:
  - all 20 are listed;
  - picking one sets the birth;
  - changing the rank clears it;
  - "Be born" goes through `UI.startLife` and the patch to a life with the opening queued.
- `startsDeterministic`: the same story and seed give the same life.

The events pass `tools/lint-events.mjs` (40 events, 285 in-browser checks).

**Rules kept.**
- `S.story` and the flags are optional, so old saves load.
- Name picks on the creation screen hash the story id instead of drawing from `A.rand`.
- All text goes through `UI.esc`.

**Limits.**
- **Time.** Ages are bound by the engine's start-age cap (the age of adulthood plus 10), so there is no story that starts at 40.
- **Text, not people.** The people in the openings live in the text (the bailiff, your brother) and are not created as NPCs.
- **Tie-ins.** No other feature's events read the stories yet, except through the shared flags of 26-belief-truth.

## Cycle 1: a quick start, and the screens in order (first-hour I3, B5; design #3)

- **One screen to begin** (`UI.crQuickHtml`). "A new life" opens on Lands, then three ways in: **Be born**, **Start at 16**
  (the people's age of adulthood) and **Pick a story**, with three story cards open for a player's first three lives
  (chosen by the day's date, the other seventeen under "Show all 20"), then the difficulty with a line on what the score
  multiplier is. "Customise everything" and the four step buttons lead to the full screens. It is 768 px tall at 1366 × 768
  and about 1,250 px on a 390 × 844 phone, where the four steps ran to 12,500.
- **The full screens in order.** Lands and "Where your story starts" lead the first step, above the realm, so the realm
  list is the list of the lands chosen. The last step keeps difficulty, world and seed.
- **The Known World only says what it does.** With a far realm chosen, the Lands field warns that choosing the Known
  World only moves the birth; after the switch a toast and a line say from where to where.
- **The score multiplier is explained** in the summary and on the quick screen.
- Test: `startsQuick`.
