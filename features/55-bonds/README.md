# Bonds: what passed between you, what people hide, and what outlives them

**Aspect:** Relationships (Road to Ten, Relationships 4 and 5) and Diplomacy and politics (Diplomacy 6) · **Kind:** system (three core files), 17 events (prefix `bd_`), one patch, tests, and a bench script (`bench.mjs`)

The plan asks for three things:

- **Relationships 4:** "Keep a shared history per bond, a short log like 'saved his son, 1112' or 'mocked him at court, 1115'. It moves opinion and shows up in events."
- **Relationships 5:** "Add secrets and leverage. NPCs hide things you can uncover and use, at a cost to your honor."
- **Diplomacy 6:** "Give realms long memories: grudges and debts that last generations, like 'they burned our capital in 1108'."

Before this feature, `21-npc-initiative` kept a text log on each bond, `pc.rel[pid].hist`, but nothing read it except one sentence in its own events. The release keeps secrets as one bare counter, `pc.flags.secrets`, and its one blackmail scene invents "a lord with a past". Realms remember 26 kinds of thing for 3 to 30 years, and nothing outlives that.

## What it does

### 1. The history of a bond weighs, fades, and moves opinion (`a-ledger.core.js`)

- **Every line has a weight.** A line is written by anything that touches the person:
  - an event choice with `ctx.pid`;
  - an interaction;
  - a duel;
  - an NPC's move;
  - a death in their family.

  The opinion the action moved becomes the line's weight. Wrappers on `A.eventChoose`, `A.interact`, `A.duelConsequences`, `A.duelClose`, `A.callFavor` and `A.getToKnow` sum every `A.addOp` and `A.link` on a player bond, and give that sum to the line written in the same action. Where nothing more particular was written, the choice itself is the line. Its label goes into the past tense: "The flooded mill: you pulled him out".
- **Lines fade by their size.** A long talk has a half-life of 2 years, an insult 4, a +14 rescue 6, a betrayal 12, a killing 60. The same kind of thing done again tops up the old line instead of adding a new one. The log keeps the 12 heaviest lines, not the 12 newest.
- **Memories move opinion by themselves.** Once a year the sum of a bond's weights (held within ±60) pulls opinion toward itself on both sides. It pulls their side, the number the engine reads, and yours. Each year it closes 30% of the gap:
  - good memories hold an opinion up, and nothing pushes it higher;
  - wrongs pull it down;
  - both fade unless refreshed.

  A bond whose memories still weigh 12 or more is not forgotten for idleness. The release drops quiet acquaintances after 3 years.
- **Events cite it.**
  - A `{history}` token works in any event with `ctx.pid`, for example "She has not forgotten 1112, when you insulted her at the fair." `{histYear}` and `{histDeed}` give the parts. As with any token, an event that uses one is dropped when there is nothing to quote.
  - Four NPC moves come out of the log. They are kinds of `21-npc-initiative`'s monthly move, so they share its budget, cooldowns, trait weights and "Why ..." line. Each cites one dated line and acts on it:
    - **An old kindness:** they come back with a gift. You can take it, spend the debt on a favour, or wave it off.
    - **An old wrong:** they want it answered in the street. You can apologise (the line falls to 30%), pay, say you would do it again (the line comes back to full weight), or walk on.
    - **The kin of someone you wronged or killed.** You can pay blood money, hear them out, face them in a fight to first blood, or ride past.
    - **The kin of someone you did right by.**
  - **A grave you know:** a scene from your own life, at the grave of someone you share history with.
  - Under any event about someone you share history with, a muted line reads "Between you: 1112, you lent her 40 suns."
- **The person view** shows each line with its weight and whether it is fading. It also shows what the memories do to the opinion, for example "What you have been to each other holds his opinion of you up (+18)."

### 2. Secrets and leverage (`b-secrets.core.js`)

- **NPCs hide things that follow from who they are.** The kinds are:
  - a debt (the greedy, the lavish);
  - an affair (the married and fickle);
  - a child nobody knows of;
  - a heresy (the cynical, the curious, clergy);
  - a crime (the deceitful and cruel, thieves);
  - skimmed accounts (stewards, officials);
  - desertion (craven soldiers).

  Each secret is either *shunned* or *criminal*. The draw is a hash of the person's id and traits, so nothing is stored until the secret is found, and drawing the person view never rolls a die. The honest, the honourable and the just hide less.
- **You find them** in five ways:
  - by a glimpse: a moneylender's boy at their gate, a house left before dawn;
  - by a scheme: `39-schemes` gets a sixth plot, "Plot: dig into their past", with months of progress, an opening and a chance each month of being noticed, and a last move that is this feature's scene. Without `39-schemes`, "Dig into their past" is a single scene;
  - through your circle: a friend close to them tells you. This is an NPC move that reads `41-circles`;
  - by any release event that grants its +1 secret with someone in the scene;
  - by knowing a lore secret (`26-belief-truth`) that names a realm, which is a hold on its ruler.
- **You can use them.** "Use what you know" in the person view lets you ask for:
  - a favour (a check against their pride and courage, eased by fear of the gallows);
  - money;
  - that they keep out of your way;
  - or nothing.

  Each use costs honour: 2 to 6, and 1 more for a criminal secret. A criminal secret is a strong hold. It also stops their hostile moves for ten years: `21-npc-initiative`'s desire for them is zero, and they drop out of `39-schemes`' plotters. A shunned secret is a weak hold, for five years. If they refuse, you can expose them or back down. Exposure costs them renown, their circle's good opinion and, for a crime, their trade, and it makes them your enemy.
- **They can do the same to you.** Your own secrets come from:
  - a murder the law did not catch (one in four, someone you know saw it);
  - a scheme's poison or knife (its helpers know);
  - a lover while you are married;
  - a shameful choice an event marks as a secret, with whoever was in the scene as witness.

  Once a year, one in ten knowers tells a friend. A knower may blackmail you, which is an NPC move. You can pay (they may come back), refuse and try to laugh it off, threaten them with their own secret (a standoff), or frighten them.
- **The person view** shows "What you know of him", the hold and how long it lasts, and "He knows: ...".

### 3. Long memories, for families and realms (`c-feuds.core.js`)

- **Kin remember a killing.** This covers a duel to the death, the release's murder and a scheme's poison or knife. The victim's parents, children, spouse and siblings become your enemies at −45 or worse, with the line "You killed her husband, Odo" (half-life 60 years). A death of the person a scene is about counts only for a scheme's scene. A deathbed, a fever or a stranger dying on the road is nobody's doing: in a first version they were, and the test lives showed it.
- **The dead pass their memories on.** When someone you share strong memories with dies (±15), their children and spouse take up the two strongest lines at half weight: "He knows what you did for his father, Odo, in 1112: you pulled him out of the river." The yearly pull then works on them.
- **Your heir inherits what people felt for you,** at 60%: "She has not forgotten 1112, when Aldo, your father, insulted her at her own wedding." The secrets your parent found pass down as the family's papers. What people knew of your parent becomes a shame on the house.
- **Realms keep a feud ledger,** `r.feud[otherRealm]`, beside the release's memories:

  | Line | Weight | Half-life | Written when |
  | --- | --- | --- | --- |
  | Took our capital | −35 | 80 | a war's peace hands over the capital |
  | Held our capital in war | −22 | 60 | an enemy army occupies it |
  | Took a heartland | −15 | 60 | a province with a tenth of the realm's people changes hands |
  | Left us to our enemies | −14 | 50 | an ally refuses the call, or betrays |
  | Stood by us | +16 | 50 | an ally comes to the defender's aid |
  | Killed our ruler | −30 | 80 | the player kills a foreign ruler in a duel |

  Land retaken settles 60% of what was owed for it. A war won against the realm that wronged you settles half of the rest. The ledger belongs to the realm, so it outlives the ruler who suffered it, and each successor is written into it: "Took our capital, Kingsmere, in 1105 (under Emperor Aldwin Ironside; carried by Emperor Harald Ironside since 1105)".
- **The AI reads it.**
  - `A.memSum` is wrapped, so the ledger is part of `A.relBetween` and of every decision built on it: the opinion bar and the odds in `A.aiWarCheck`, and `A.interest`, which drives alliances, offers and calls to arms.
  - In `A.aiWarCheck`, a grudge also raises the odds of attacking that neighbour (patch `BONDS-FEUD-WAR`: up to ×1.6, ×2.1 for a wrathful ruler). A debt lowers them, to as little as ×0.4.
  - Vengeance asks for less of an edge in strength first: `20-ai-personality`'s `A.aiNerve` falls by up to 0.25 while the AI weighs that target.
  - The reasons on offers (`A.interestParts`) split "An old grudge: Took our capital ..." out of the opinion line. The opinion tooltip (`A.opinionParts`) and the AI's war log (`A.aiWhyWar`) name it with its origin.
- **Where you see it.**
  - The Realm tab gets "Long memories of Aldmark": what your realm holds against others or owes them, and what others hold against it, each with its origin.
  - Three scenes:
    - `bd_feud_envoy`: an envoy who will not sit. You can pay reparations, apologise, remind them who wronged whom first, or give nothing.
    - `bd_feud_vow`: a ruler is asked to carry an old wrong, or let it die.
    - `bd_feud_tale`: an old soldier's story at the inn, for everyone else.
- **Effect key:** `bonds` is declared for the linter (`A.FX_EXTRA`). Its sub-keys are `settle`, `refresh`, `spend`, `note`, `learn`, `warn`, `lever`, `refused`, `expose`, `mine`, `visit` and `feud`.

## Measured by

`node tests/run.mjs <built.html> --features=bonds`:

| Test | Result |
| --- | --- |
| `bondsLedgerWeighs` | "The flooded mill: you pulled him out" weighs +14 (half-life 6). "You insulted him" weighs −11 (half-life 4). A second long talk tops up the first. After 6 years, +14 → 6.9 and −11 → −3.9. A +30 memory lifts an opinion of −10 to +2 in a year, on both sides. A −25 memory pulls +20 down to +7. After 4 idle years a plain acquaintance is forgotten and one with a +20 memory is kept |
| `bondsHistoryCited` | `{history}`: "She has not forgotten 1102, when you insulted her at the fair." With nothing to quote, the event is dropped. Under a plain event: "Between you: 1102, you insulted her …". Escaped; drawing it changes neither the state nor the random stream |
| `bondsHistoryEvents` | The four history scenes play all 14 choices with a real person, within the word diet. An apology settles a wrong from −18 to −5.4. Defiance keeps it at −18. Asking a favour spends a kindness from 18 to 9 |
| `bondsEveryScene` | 13 more scenes, each staged with what it needs (a dead friend, a hidden secret, a blackmailer, a crown with a grudge): 41 choices, no raw token. The longest text is 47 words, every label 12 words or fewer |
| `bondsInRealLives` | 6 bot lives, 216 years, 43,756 points of opinion change on the player's bonds (both sides). The yearly pull of memories made **17.7%**. With the choices in scenes that cite a past line, **29.1%**. **34.9%** was written to a dated line. Events citing a bond's history in their text: 259 (43 a life, 12.0 a decade): 38 from this feature's scenes, 221 from `21-npc-initiative`'s `{past}`. Another 305 showed the "Between you" line, out of 670 events about someone known |
| `bondsSecrets` | 145 of 380 grown people hide something (38%): debt 56, crime 38, heresy 26, a hidden child 25. A debt is 54% of a greedy person's secrets and 43% of a traitless one's. The draw is pure and stable. Asking a favour costs 4 honour and leaves 2 favours and a 10-year hold. With the hold, the person wants 0 hostile moves in 200 forced months, against 1 kind without it. A refusal queues the next scene. Exposing a shunned secret costs them 6 renown |
| `bondsBlackmail` | The release's murder, uncaught but seen by an acquaintance: "The death of Ithelor Starbough in 1105 was your doing." The witness wants to blackmail you (desire 5.8). Paying costs 100. Refusing and failing to laugh it off brings it out: −18 honour and the law's blood-price |
| `bondsDigScheme` | "Plot: dig into their past" ran 12 months (estimated 12) and closed with this feature's scene. Secret found |
| `bondsKin` | After a duel to the death: wife, son and daughter are enemies at −45, each with "You killed her husband / his father, …". A friend's son inherits "+15: He knows what you did for his father …", and in a year his opinion goes 0 → +4. The heir inherits −21: "She has not forgotten 1100, when Sewald, your father, insulted her at her own wedding". Her opinion of the heir goes 0 → −6 in a year |
| `bondsFeudInherited` | Varenna takes Aldmark's capital: −35. Aldmark's emperor dies and the line reads "carried by Emperor Harald Ironside". The tooltip and the offer reasons show it. Irondeep would ally with Sylvaran (53 against a bar of 50). Under the successor, with a 40-year-old grudge, the value is 37 with the ledger read and 55 with it ignored. Aldmark's odds a month of war on Varenna go from 0.0028 to 0.0379 (×13.4), and the war log names the grudge |
| `bondsFeudWorlds` | Two worlds of 50 years: 77 lines held at the end (24 heartlands, 19 aid, 12 betrayals, 11 capitals, 11 occupations), 26 of them carried past a ruler's death (57 rulers died). On the final state, for the 25 grudges of 10 or more, the ledger moves the holder's interest in the other by −7.4 on average |
| `bondsOnScreen` | The person view shows the weighed history, what you know of them and what they know of you, and "Use what you know". The Realm card shows the ledger. All escaped; drawing changes neither the state nor the random stream |
| `bondsOldSave` | A save without weights, `pc.bonds` or feud ledgers loads; its old line is shown and weighs 0; it plays 5 years |

`node features/55-bonds/bench.mjs <built.html>` (8 lives; 3 worlds of 60 years, each played twice, with the ledger read by the AI and recorded but ignored):

- **Lives** (8 bot lives, 201 years):
  - 29,414 points of opinion change on the player's bonds, counting both sides;
  - the yearly pull of memories made **13.8%** of it; adding the choices in scenes that cite a past line, **27.1%**;
  - **35.1%** was written to a dated line;
  - 207 events cited a bond's history in their text (10.3 a decade): 34 of them this feature's scenes, 173 `21-npc-initiative`'s `{past}`;
  - 169 more showed the "Between you" line, out of 485 events about someone known.
- **Worlds** (3 worlds of 60 years, each played twice). The two runs drift apart after the first decision, so the counts differ. Two runs of the bench gave the same numbers.

  | | Ledger read by the AI | Ledger recorded but ignored |
  | --- | --- | --- |
  | AI wars per 1,000 neighbour-years, on a realm the attacker holds a grudge (10+) against | **4.2** (5 in 1,188) | **0** (0 in 1,474) |
  | AI wars per 1,000 neighbour-years, all other pairs | 5.6 (80 in 14,276) | 5.7 (84 in 14,874) |
  | Treaties signed per 1,000 pair-years, grudge pairs | **4.5** (8 in 1,792) | **7.9** (16 in 2,026) |
  | Treaties signed per 1,000 pair-years, all other pairs | 2.8 | 2.9 |
  | Feud lines held at the end, and carried past a ruler's death | 146, 78 carried (53%) | 206, 101 carried |
  | Rulers who died | 211 | 210 |

  Two of the five grudge wars were declared by a successor of the ruler who suffered the wrong.

The events pass `tools/lint-events.mjs` and `tools/lint-choices.mjs`.

## Rules kept

- **Deterministic.**
  - Only engine paths draw from the random stream: event choices, the yearly witness and gossip step, a murder's witness, and the blackmailer's return.
  - Secrets are a hash of the person, and gifts and wording are hashed from ids and the year.
  - The feud ledger, the yearly pull and the citations draw nothing.
- **Render-pure.** `UI.bondHist`, the secrets block, the event aside, the Realm card and the extra interaction options only read. Tests check that drawing them leaves the state and the random stream unchanged.
- **Escaped.** Every value in HTML goes through `UI.esc`. Lines, secrets and places are stored with `< > " { }` stripped.
- **Old saves.** The new fields are optional: `w v h k s d of src` on history lines, `pc.bonds`, `r.feud`, and `heirs` on feud lines. An old weightless line simply weighs nothing.
- **NPC moves** carry `npc: true` and share `21-npc-initiative`'s budget (about 1.5 a year, never more than 3). The blackmailer's return is booked through `A.NPCI.follow`. Without that feature, a small budget of the feature's own runs them (0.6 a year).
- **One patch** (`BONDS-FEUD-WAR`, one factor in the war-odds product). Everything else is wrappers that call the original.

## Writer's pass (round 7)

Text only, plus the smallest changes the grammar needed. The deed maker (`BD.deedOf`) knows ~330 more verbs and ~90 more
irregular pasts (drove, ate, saw, began, lay low...); puts a second verb into the past too ("you rocked him and sang"),
except after make/let/help ("you made him confess and pay") or when the word after "and" is a thing ("the bread and
water"); keeps an adverb ("you quietly paid him"); says short answers ("you said yes"); cuts a label at its first
sentence; and words a failed try four ways (", and failed", ", and could not", ", and it went wrong", ", and it came to
nothing", picked by a hash of the label). A history line no longer echoes a title ("you had your say over..." is gone),
a title that asks takes the deed as its own sentence ("Can you help? You helped"), and a deed of a word or two carries
its scene's title when that names a thing ("you accepted (the toll at the bridge)"). Secret texts: the "in the matter
of" wording is gone, and debts, a hidden child, skimmed accounts, desertion and crimes have more wordings.

| Measured | Before | After |
| --- | --- | --- |
| live labels (10,404) whose deed is "you chose to ..." | 790 | 104 (1.0%) |
| history lines with a grammar error, 12 bot lives of 50 years, the same seeds before and after (`/tmp/ardan/prose/harvest.mjs`, 8.4k generated lines a run) | 15 of 1,158 | 2 of 1,135 |
| "in the matter of" in a secret | 8 of 15 | 0 |

Test `bondsDeedsRead` holds the fallback under 3% of 10,404 labels, no regularised irregular past, and twelve label shapes.

## Limits

- **History lines from events are mechanical.** A label in the past tense ("you pulled him out") reads well for most of the release's choices, which are imperatives. A label that is not a verb falls back to "you chose …". A writer pass on the 30 most common event lines would help.
- **The pull is one-sided by design.** Memories hold an opinion up or pull it down, but never push it past their own weight. The pull's share is 13.8% to 17.7% of all opinion change, depending on the lives played.
- **"Between you" is frequent.** About 45% of events about someone you know show it. It is a muted line, not prose, but a playtest should say whether it reads as noise.
- **Secrets are seven kinds with one or three wordings each.** Affairs, skimmed accounts and desertion need a spouse, a post or a soldier, so a fresh town has mostly debts, crimes, heresies and hidden children. The north star's 60 kinds tied to the written cast are not here. A secret the player keeps is sentence-level ("What you did in the matter of …"), not a named act.
- **NPCs do not blackmail each other,** and an exposed NPC is disgraced but not tried.
- **Grudges between realms move decisions, but seldom start wars.** The realm that lost its capital is usually the weaker one, and `A.aiWarCheck` still wants an edge in strength. The ledger is read everywhere `A.relBetween` is read, but over 60 years a revenge war is rare: 5 of 85 AI wars in the bench. Without the ledger there were none, but that is still 6% of wars, not the 30% of AI wars citing a memory or a want that the benchmark's D9 asks for.
- **Families, not houses.** Kin grudges run through the people around a death and through your own heir. The 800 noble houses do not keep a house-level ledger.
