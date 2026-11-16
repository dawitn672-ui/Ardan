# The Chronicle

**Aspect:** Uniqueness (signature system 1), Events and story · **Kind:** system

The core line is "one life inside a history everyone writes". The Chronicle makes that line visible: a new **The Book** page, first in the Chronicle tab group, writes each life as a book from what actually happened.

**What it does.**
- **Source.** It reads the story log, world news in the log, and deaths.
- **Chapters.** One chapter per decade of age ("The Third Chapter: Of the third decade"), each headed with its years and ages.
- **Selection.** Each chapter keeps up to 10 personal entries and up to 3 from the wider world, ranked by kind (great moments, deaths, crowns, wars) and by words like born, married, knighted, wounded or heir.
- **Voice.**
  - The chronicler addresses its subject: "Here it is set down that you fall ill with marsh fever", "In April of 1112, …".
  - It does not rewrite "you" into a name, which would need verb conjugation that breaks on real text.
  - News that concerns the player's realm is fact. News from abroad is hearsay: "Word came from abroad, and none here could swear to it, that…".
  - The hearsay is flavor, not tracked belief-versus-truth state, so `beliefTruth` stays unregistered.
- **Ending.** A dead character's account closes with their death and its cause.
- **Export.** "Save the chronicle as text" downloads the whole book as a .txt file.

**Reference games.**
- **Pentiment:** the chronicle frame, and a chronicler who can be wrong.
- **Dwarf Fortress:** legends as the record of a world.
- **CK3:** the character history.

**Rules kept.**
- Rendering is pure: no `A.rand`, and no change to `A.S`. Wording varies by hashing ids and years.
- All text goes through `UI.esc`.
- Registered in `A.SIGNATURE.chronicle`.

**Measured by.**
- **Tests:**
  - `chronicleBook`: at least 2 chapters after 32 years, names the life, no raw tokens, pure render;
  - `chronicleEscapes`;
  - `chronicleExport`.
- **Bench:** the `signature.present` count.

**Limits.** The chronicle selects and frames; it does not yet write new prose. The north star in `docs/benchmarks/events-story.md` describes a chronicle that reports wrong versions which a later chapter corrects. That needs knowledge state per fact, which this feature doesn't add.
