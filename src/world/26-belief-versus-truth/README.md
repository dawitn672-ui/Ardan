# Belief versus truth

**Aspect:** Uniqueness (signature system 2), World and lore (Road to Ten World 4, Uniqueness 3) · **Kind:** system plus 11 events

The core line ends "…and the chroniclers will get you wrong". The lore already holds both sides of many stories: what people believe of 64 beasts and what is true, and the accepted story of 71 secrets alongside the truth and its proof. The release showed you all of it at birth. Now what you know depends on how you came by it, and what the world tells you can be wrong.

**Four parts.**

1. **The bestiary by knowledge.** Each creature is, for you, one of four things:
   - **Unknown.** It is not listed, only counted.
   - **Heard tell.** You see what folk say.
   - **Seen.** You met one and lived. You also see its size and how it behaves.
   - **Known.** You killed one or read the truth. You also see the truth and its weak points.

   What you heard as a child is computed from your home ground, so it is never stored and rendering stays pure:
   - the beasts of your terrain;
   - dragons and giants, which every child hears of;
   - a few more, by family.

   You learn more in five ways:
   - by surviving a beast fight (seen) or winning one (known);
   - by studying while literate (30% a session: the truth of a beast you have heard of);
   - by exploring (the local beasts);
   - from an event that names one;
   - from traveller's tales (about one every three years).

   Each step writes a line to the story log.
2. **Secrets.** The codex page "Secrets you know" now lists all 71 secrets.
   - It shows the accepted story for every one.
   - For each one you have found, it also shows the truth, who else knows, the proof and what would happen if it came out.
   - It uses the base game's own `rl_k_<id>` flags, which the base page never read. The base page counted the wrong flags.
   - Finds are rationed: the seven reveal scenes need eight years since your last find (`A.BT.sinceSecret`), so a long life finds a handful, not a dozen.
   - 11 new events can crack a story open: a margin note in the record room, a dying priest, a drunk archivist, a letter sewn into a binding, the oldest woman of your house, a verse nobody sings, a buried report. Two follow-ups read what you know: telling your eldest in old age, and going to see the proof.
3. **Far news is hearsay.**
   - Battle and war news that concerns neither your realm, its neighbours nor the wars you are in is inflated 45% of the time (counts ×1.6 to ×3, "some 30,000 fall").
   - A truer account follows 45 to 245 days later.
   - The news views mark such lines "(hearsay)" and, once corrected, "(the count ran high, as later word showed)".
   - The distortion is a hash of the text and date, not a dice roll, so it doesn't change the simulation.
4. **The tale as told.** For a life with fame 20 or more, the Chronicle adds "As the tale is told": your last three deeds as the taverns tell them, with the numbers doubled or tripled and something added. The chronicle above it is what happened. The text export includes it.

**Heirs.** When you play on as an heir, the family's lore passes down: known stays known, seen becomes heard, and secrets stay found.

**Measured by** (`test.mjs`):

| Test | What it checks | Result |
| --- | --- | --- |
| `btBestiary` | A new peasant has heard of some beasts but not all. Belief is shown, truth is hidden, unknown beasts are hidden, and rendering is pure. | 22 heard of, 42 unknown |
| `btLearnByFight` | A beast fight raises what you know, the page shows it, and it is logged. | |
| `btStudyAndTales` | 40 study sessions | 16 truths learned |
| | 12 years of tales | 6 more beasts heard of |
| `btSecrets` | Learning a secret shows its truth and no other, every accepted story is shown, and `rl_secret` is set for the base game's follow-ups. | |
| `btRumors` | 40 far reports | 22 inflated |
| | 40 near reports | 0 inflated |
| | Counts always run high and are corrected within a year. | |
| `btTaleAsTold` | The tale appears on the page and in the export. | "against 4,000" becomes "against 8,000, and laughed while doing it" |
| `btHeirInherits` | An heir keeps the family's lore. | |
| `btRegistered` | `A.SIGNATURE.beliefTruth` is set (the bench's signature count). | |

The events pass `tools/lint-events.mjs`.

**Rules kept.**
- Learning happens only in engine commands: duel close, activities, event choice, the month hook.
- Every value in HTML goes through `UI.esc`.
- New state is flags, plus optional fields on news entries (`truth`, `due`, `fixed`), so old saves load.

**Limits.**
- **Hearsay is about counts.** It does not yet flip who won or invent a battle.
- **People, not yet.** NPCs do not yet hold beliefs of their own (what a court thinks you did). The north star's five knowledge states per fact (unknown, heard, believed, confirmed, disproved) are here as four, for beasts only.
- **Secrets as leverage are not built.** That is Relationships step 5.
