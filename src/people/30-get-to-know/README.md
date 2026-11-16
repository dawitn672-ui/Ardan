# Get to know, as a scene

**Aspect:** Relationships and people (Road to Ten, Relationships 7) · **Kind:** system plus 1 event

In the release, "Get to know" on a person spent one point of initiative and rolled one hidden die: a friendly start, or "keeps you at arm's length". Nothing you knew about the person mattered. Now it is a short scene.

**What it does.**

- **The scene.** `A.getToKnow` keeps its checks and its cost, then queues the scene `gk_meet` for that person. The command is in the journal, so a replay queues the same scene.
  - The opening says where you find them and what they are doing, by their station ("mending a net", "watching the hawks fly").
  - It offers four approaches, each a check with its odds shown:
    - **Ask about their affairs, and listen** (persuasion and insight);
    - **Tell a story of your own** (persuasion and intellect);
    - **Offer help with their trouble** (persuasion and will). The trouble is named, for example "a son who will not settle to any trade". The help costs a little coin, earns the most, and insults the proud;
    - **Keep it short and proper** (etiquette and insight). It is the safest, and the one the proud and the wary prefer.
- **The person decides.** Each trait they have makes some approaches easier and others harder: 12 points of difficulty per liked or disliked trait. Gregarious people like to be asked; the shy and the paranoid don't. The proud prefer manners and resent help. A gap in rank makes everything harder, the proper approach least.
- **A sharp eye.** With insight 50 or more, the scene reads the person for you ("You read Edith quickly: she sets great store by manners"). At 70 or more it also names the approach to avoid.
- **The bond.** The choice decides the opening opinion (from −10 for unwanted help to +42 for help well taken) and writes a line to the bond's history (21-npc-initiative).
- **A small engine extension.** A check can take `dctx`: the name of a ctx key whose number is added to its difficulty. `A.checkOdds` reads the scene at the head of the queue, so both the odds on screen and the roll use it.

**Measured by** (`test.mjs`):

- `gkScene`:
  - the action queues the scene, spends the initiative and links no one yet;
  - the scene renders with four choices, odds and no raw tokens, and shows on screen;
  - choosing links the two with a history line;
  - a second try is refused.
- `gkTraitsShapeOdds`: against the same person, with traits changed:

  | Approach | Gregarious and witty | Shy and paranoid |
  | --- | --- | --- |
  | Ask | 36% | 4% |
  | Story | 40% | 4% |
  | Help | 25% | 6% |
  | Proper | 13% | 71% |
- `gkInsightReads`:
  - at insight 20 there is no reading;
  - at 60 the scene reads the best approach;
  - at 85 it also names the one to avoid.

21-npc-initiative's history test now plays the scene when this feature is in the build.

**Rules kept.**
- The setup is pure: wording is hashed from ids, and nothing is drawn from `A.rand`.
- Opinions use `A.ri` only when you choose.
- No new state beyond the relation the release already made.

**Limits.**
- **One scene for everyone.** Every first meeting uses the same scene, so a later pass could give lords, priests and children their own.
- **Traits only.** The approaches read traits, not the cast data's wants and fears, which drive NPC moves in 21.
