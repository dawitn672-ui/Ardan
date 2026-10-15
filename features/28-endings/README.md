# Endings and epilogues

**Aspect:** Replayability and pacing (Road to Ten, Replayability 2) · **Kind:** system

In the release, a life ended with a portrait, a cause of death and a score. Now it ends like a book does: with a named ending, the manner of it, and what became of the people and things you leave.

**What it does.**

- **The ending.** It is decided once, by the engine, when you die (`A.pcDeath`). There are 20 endings, and the first that fits is used:
  - From the Dust to the Throne;
  - The Crowned;
  - The Risen;
  - Died in Chains;
  - Keeper of Secrets (4 or more found; see 26-belief-truth);
  - The Commander;
  - The Old Soldier;
  - Master of the Craft;
  - The Wealthy;
  - Of Good Repute Before the Gods;
  - The Learned;
  - Who Knew the Wild;
  - Remembered;
  - Root of a Great Tree;
  - The Wanderer;
  - Cut Short;
  - Full of Years;
  - Well Loved;
  - Unremembered;
  - A Life Like Most.

  Each has a one-line epitaph in the chronicler's voice.
- **The manner.** One of 9, read from the engine's cause of death: fell in the field, by the blade, taken by the wild, carried off by sickness, by another's hand, by mischance, in childbed, in the fullness of time, as all things end.
- **The epilogue.** "What became of them" appears on the death screen, written from the state of the world, with wording varied by hashing ids. It covers:
  - who takes up the house, or that no one does;
  - the spouse: grief or a sensible remarriage, by their opinion of you;
  - your closest friend and your worst enemy;
  - the secret you take into the ground, or the one your eldest keeps;
  - your realm, at war or at peace, or gone;
  - with 26-belief-truth, the tale the taverns tell.
- **The collection.** The Legacy tab lists "Endings found (n/20, and m/9 ways to go)", like the achievements: found ones show their epitaph and year.
- **The Chronicle.** The last line of a life names the ending.

**Measured by** (`test.mjs`):

- `endingsNamed`: six prepared lives get the expected ending and manner. The cases are a peasant who ruled, a noble ruler, a prisoner, a keeper of four secrets, a death at 19, and a nobody.
- `endingsDeathScreen`:
  - the ending is recorded on the life and in `S.endings`;
  - the epilogue is shown with no raw tokens;
  - rendering the death screen is pure;
  - the Legacy tab counts it;
  - the story log has the line.
- `endingsVariety`: six real 60-year lives (bot-played) must reach at least three endings, with at most three on the fallback. In the full build they give the Commander three times, and Master of the Craft, Died in Chains and the Wealthy once each. With this feature alone they give six different ones.

An earlier draft put "Keeper of Secrets" at 3 secrets and fifth in line, and 4 of 6 full-build lives ended there. The secret scenes of 26-belief-truth are now rationed to one find in eight years, and the ending needs four.

**Rules kept.**
- The ending is engine state (`pc.ending`, `S.endings`, `S.manners`, and `ending` on `deadList` entries). All of it is optional, so old saves load.
- The epilogue is computed at render time without `A.rand`.
- All text goes through `UI.esc`.

**Limits.**
- **Present tense only.** The epilogue tells what stands now, not the future: it doesn't simulate the heir's reign or the spouse's next marriage.
- **Collection scope.** Endings are collected per save, like achievements, not across saves.
- **Starting stories.** Replayability step 1, 20 hand-made starting stories, is the other half of this pair, and isn't built here.
