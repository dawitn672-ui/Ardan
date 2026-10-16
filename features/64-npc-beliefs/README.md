# What people believe

**Aspect:** Uniqueness (signature system 2; Road to Ten, Uniqueness 3), with Relationships and Diplomacy as the places it shows · **Kind:** system (three core files), 14 events (prefix `nb_`), no patches, tests, and a bench script (`bench.mjs`)

The plan asks: "Build signature system 2, belief versus truth, everywhere: beasts, people, battles and events all have what people believe and what is true, and your character's knowledge can be wrong." The benchmark bar (W10) adds: "≥20% of rumors are false; the player can hold a false belief."

`26-belief-truth` gave the player a knowledge state for beasts and secrets, far news that runs high, and a legend in the Chronicle. `55-bonds` gave people secrets, `57-world-chronicle` a true dated record, `34-both-scales` three accounts of a battle. But the people of the world believed nothing of their own. What a neighbour thought of you followed only from what happened between you. Here every person around you, and every court, holds beliefs, and some of them are false.

## What it does

### 1. Claims, and who holds them (`a-claims.core.js`)

A **claim** is one thing someone might believe. Each one knows whether it is true.

| Kind | Example, as the person view shows it | Where it comes from |
| --- | --- | --- |
| Deed | "That you carried an old woman out of a burning house." | `pc.deeds`; any scene that made you better known (its choice in the past tense, through 55-bonds); a battle of 57's record you fought in |
| Tale | "That you carried an old woman out of a burning house, and laughed while doing it." | the same deed, grown in the telling (26's `A.BT.tale`, the same words as the Chronicle's "As the tale is told") |
| Twist | "That someone else carried an old woman out of a burning house, and you took the credit." | the same deed, as someone who hates you tells it |
| Slander | "That you cheat on your weights." | 21-npc-initiative's slander move; the hostile and deceitful inventing a sin of yours |
| Killing | "That you killed Aldo Brenn in 1112." | a death among the people you know: a killing you did (55's blame), or the kin looking for someone to blame for a fever, a fall or "poison, some whisper" |
| Secret | "That Odo keeps the old rites at night and laughs at the faith." | 55-bonds' secrets (true when the person really hides it), or one invented about a foe |
| Battle | "That Aldmark won at Castella in 1105, and some 9,000 fell." | 57's record of battles. The winners' people believe their chronicle (the dead counted 1.6 to 2.5 times over); the losers' people often believe they held the field; the far hear the count inflated (1.6 to 3 times); veterans saw the truth |
| Beast | "Of the Moon Moths, he says: Elves believe the moths carry the souls…" | 26's four states (unknown, heard, seen, known), now for every person, from where they live and what they do |

- **A person holds up to 8 beliefs** (2 of them about battles), each believed or disbelieved. A false belief is a believed false claim or a disbelieved true one. Beliefs about you are kept longest.
- **A court holds up to 10** as one body: what the realm believes of its neighbours' rulers (true secrets, or stories told in wartime), its own account of its battles, and, once you are someone, your deeds.
- **The version a person believes depends on three things:**
  - how far they live from you: the same town hears the truth, the far the tale;
  - their opinion of you: the hostile believe the twist;
  - their traits: the trusting believe anything, the cynical and the honest less, the paranoid the worst.
- **Belief moves opinion.** A belief about you moves the holder's opinion of you, on both sides of the bond, by the claim's weight: a deed +6, its tale +10, the twist −8, a slander −8, a killing −10 (×1.6 when it was their kin or friend). A correction takes it back. Someone who already believes something of you when you first meet starts the bond with it. A belief about someone else moves their opinion of that person by 60% as much.
- **Courts weigh on realm opinion.** What a court believes of another realm's ruler is added to `A.memSum` (so `A.relBetween`, `A.aiWarCheck` and `A.interest` all read it), at half weight and never more than ±6. The opinion tooltip names it: "Talk at court of their ruler: That Roderic III Valdane broke his oath…". A court sees through a false story 8% of the time each year.

### 2. How beliefs travel (`b-spread.core.js`)

- **Once a year, people pass on what they believe** to the people close to them (41-circles' circles, or friends and kin). The gregarious talk more and the shy less. Whether the listener takes it depends on their traits, on what they think of the teller, and on what they think of the person it is about: the worst is easy to believe of someone you hate.
- **Corrections travel the same roads.** Someone who has been set right tells it with more zeal, is believed more readily, and is hard to fool again. Now and then a false belief about someone who lives in the same town is simply seen through (3% a year).
- **A court's word reaches the people.** Each year some of those around you take up one of their realm's court beliefs: a noble or an officer one time in three, a commoner one in seventeen.
- **NPC moves** (21-npc-initiative's monthly step, its budget, cooldowns and "Why …" line). Without that feature, a small budget of this one runs them.
  - `nb_accused`: someone who believes a wrong of you says so to your face.
  - `nb_praised`: someone who believes a tale of you praises you for what you did not do.
  - `nb_gossip`: a friend tells you what they believe of someone you know.
- **Your own talk.** A long talk, an afternoon together or asking advice (the release's interactions) may clear up a slander they hold. Or they may tell you what they believe of someone else, which you take on their word.
- **Your own telling.** "Talk of what is said", in the person view, opens a scene (`nb_tell`) with four choices, each offered only when it applies:
  - set them right about what is said of you;
  - tell them the truth about someone else, when you know it;
  - tell them a story about a foe of yours;
  - tell your own deeds larger than they were.
- **Effect key:** `nb`, declared for the linter (`A.FX_EXTRA`). Its sub-keys are `fix`, `fixAll`, `spread`, `spreadAll`, `believe`, `doubt`, `learn`, `lie`, `boast`, `truth`, `beast`, `learnBeast`, `court`, `warn`, `own` and `as`.

### 3. Your knowledge can be wrong

- **What you believe is kept** in `pc.nbk`, with who told you and when. What someone tells you of another, you believe on their word, and it may be false.
- **It can come out years later.** `nb_truth_out`, a year to four after you believed it, comes six times in ten: you learn it was never true. You can go and own it, unsay it to everyone you told, or keep it to yourself. The flag `nb_was_wrong` remembers.
- **Some things you can know.** You know what you did yourself, a battle of your realm or a neighbour's, a secret 55-bonds let you find, the truth of a beast you killed or read about, and whatever you have looked into.

### 4. Where you see it (`c-view.core.js`)

The person view gains three short lists under "Between you". A line is marked true or false only when you know the truth. The marks are "true", "false", "(you believe it too)" and "(you doubt it)".

- "What she believes about you"
- "What she says of others", with one beast she talks of: "Of the Woolly Rhino, she says: …", marked "not so" if you know better
- "What you have heard of her"

### 5. The scenes (`npc-beliefs.events.js`)

| Scene | Who starts it | What drives it |
| --- | --- | --- |
| `nb_accused` | NPC move | They believe a wrong of you (a killing, a sin, a slander, a twisted deed). Swear it is not so, dare them to say it before the elders, let them think it and be afraid, or walk on |
| `nb_praised` | NPC move | They believe a tale of you. Tell them how it really went, raise the cup, tell it bigger, or ask a favour while the cup is full |
| `nb_cleared` | follow-up | Someone you set right stops the story at the mill |
| `nb_slander_spread` | pool | Two or more people you know believe a false wrong of you |
| `nb_tale_outgrows` | pool | Your tale comes due: someone wants it done again |
| `nb_parent_tale` | pool | People tell a deed of your father or mother, as it grew |
| `nb_gossip` | NPC move | A friend tells you what they believe of someone you know |
| `nb_truth_out` | follow-up | What you believed was never so |
| `nb_lie_back` | follow-up | The one you told a story about knows it began with you |
| `nb_tell` | the person view | Your own telling |
| `nb_battle_tale` | pool | Someone tells a battle as their side tells it, and you know how it went |
| `nb_beast_wrong` / `nb_beast_right` | pool | Someone of your town goes after a beast by the old tales, when you know better; or knows the truth you only heard of |
| `nb_court_word` | pool (rulers and nobles) | Your council believes something of a neighbour's ruler. Look into it, use it, or forbid it |

`ctx.nbFalse = 1` marks a scene driven by a false belief, which is what the bench counts. Memory flags are read with `C.flag` (`nb_believed`, `nb_lied`, `nb_cleared`, `nb_embellished`). The scenes also use condition helpers: `C.nbSlander`, `C.nbTale`, `C.nbBattle`, `C.nbHeard`, `C.nbCourt`, `C.nbParent` and `C.nbBeast(p, 'wrong' | 'right')`.

## Measured by

`node tests/run.mjs <built.html> --features=npc-beliefs`, on `--only=belief-truth,npc-initiative,circles,bonds,world-chronicle,npc-beliefs`:

| Test | Result |
| --- | --- |
| `nbDistance` | 70 people at each distance, 4 deeds. The share who believe a false version: same town **12%** (259 heard), same realm **37%** (167), a neighbour realm **63%** (91), further **83%** (42). The trusting at home 25%. The hostile at home 32%, and 59 of them believe the twist, against 3 of the others |
| `nbOpinionFollowsBelief` | From an opinion of 0: the deed +6, its tale **+10**, the twist −8, a false killing of his brother **−16**. The person view shows the +10. Set right about the tale, he falls back to +6. Cleared of the killing, 0. A stranger who already believes the tale meets you at +10 |
| `nbCorrectionsSpread` | Three circles of 12 friends who believe you killed a man, over 8 years. With nobody to set them right and chance switched off: 0 cleared. With one of each circle set right: **16** of 36 (3 at the start). After a public answer: 29. Chance alone (a false belief seen through, 3% a year): 14 |
| `nbEveryScene` | All 14 scenes staged and every choice taken (57): no raw token, none over the word diet. Checked effects: swearing it is not so clears the accuser; believing gossip books the reveal; the reveal marks you as having been wrong; a story about a foe is now held by the listener; the truth about someone else clears a false belief; looking into a court story corrects the court; telling a tale bigger spreads it; a battle set right; a beast taught |
| `nbPersonView` | The three lists, with "true" and "false" only where you know, "(you believe it)" for what you were told. A name with markup is escaped. Drawing it changes neither the state nor the random stream |
| `nbCourtWeighs` | Aldmark's court believes two stories of Varenna's ruler: opinion −20 → **−26** (the cap), and the odds of war a month 0.0004 → 0.0005. The tooltip names it. Once the court sees through the stories, −20 again |
| `nbBattlesAndBeasts` | Six battles your realm won. False accounts: the winners' people **100%** (they believe their chronicle's count), the losers' 93% (37 of 59 claim they held the field), the far 49% (24 with the count run high). You know the truth. Of 9 hill beasts, 40 hunters know the truth of 79 and have seen 171; 40 scribes, 18 and 44 |
| `nbDeterminism` | 14 years twice, the second time drawing the life tab and four person views every step: the same beliefs (27 people, 104 claims). The same after a save round trip. A save stripped of all of it loads and plays 3 years |
| `nbInRealLives` | 3 bot lives, 83 years: 127 people hold 776 beliefs at the end, 30% false; 20 belief scenes, 16 of them driven by a false belief; 31,676 bytes in all |

The core suites (`boot`, `lives`, `saveRoundTrip`, `uiSmoke`) pass alongside. The events pass `tools/lint-events.mjs` and `tools/lint-choices.mjs` (0 obviously best), on that build and on the full build.

`node features/64-npc-beliefs/bench.mjs <built.html>`, the same build. 8 bot lives, 345 years, a census every 5 years (75 censuses):

- **False beliefs.** 31.8% of all beliefs held are false.
  - About you 21.8% (9,426 held), about other people 45.1% (586), about battles 69.2% (2,302).
  - Courts: about you 28.6%, about other rulers 45.6%, about battles 47%.
- **By distance.** Most of the people a life knows live in its own town, so the far samples are small.

  | | Beliefs | False | About you | False |
  | --- | --- | --- | --- | --- |
  | Same town | 11,083 | 30% | 8,558 | 20.1% |
  | Same realm | 1,084 | 48.2% | 766 | 39% |
  | A neighbour realm | 71 | 53.5% | 47 | 48.9% |
  | Further | 80 | 42.5% | 55 | 36.4% |

- **Scenes.** **2.67 belief scenes a decade, 2.2 of them driven by a false belief** (92 and 76).
  - By scene: praised 36, accused 17, gossip 9, battle tale 8, beast (the truth) 7, slander 5, the tale comes due 5, beast (the old way) 4, it was not so 1.
- **Opinion.** Of the people you know who hold a belief about you, 49.9% have an opinion moved 5 or more by a false one (9.7 points on average), and 93.9% by a true one (20.5).
- **Corrections.** 391 corrections among people: 248 a false belief seen through, 83 passed on by someone already set right, 57 from scenes, 3 a truth told. Courts saw through 1,216.
- **Where claims came from.** 171 deeds, 905 battles, 1,137 court stories, 38 slanders, 1 killing and 1 blamed death; 1,274 court beliefs reached people; 2,605 times someone was told something.
- **Your own knowledge.** The bots heard 9 things on someone's word, and one life found out it had been wrong. The bot never uses the release's interactions or "Talk of what is said", where most of this would come from.
- **Size.** One 60-year life (a dwarf artisan from 40, `--what=long`) ends with 167 claims, 32 courts, and 73 people holding 341 beliefs. That is **13.2 KB**: 9.8 KB shared, 3.4 KB on people, **47 bytes a holder** (181 with the shared table). It is 0.6% of a 2.1 MB save.
- **Cost and replay.** The same 20-year life ran in 5.3 s with the yearly step on and 7.7 s with it off. The two worlds drift apart, so this says only that there is no blow-up. Run twice with it on, it gave the same beliefs.

## Rules kept

- **Deterministic.**
  - Only engine paths roll dice: the month hook (the yearly step), `A.kill`, `A.rulerDies`, event choices and interactions.
  - Setups pick in order or by a hash of the year.
  - The beasts people know are a hash of who they are, never stored.
- **Render-pure.** The person view, the beast line, the condition helpers and the tooltip only read. The tests check that drawing them leaves the state and the random stream unchanged.
- **Escaped.** Every value in HTML goes through `UI.esc`, and stored words have `< > " { }` stripped.
- **Old saves.** Everything is optional and made on first use: `S.npcb`, `p.nb` and `pc.nbk`. A save without them loads and plays.
- **Pruned with the dead.** A person's beliefs go when they die. Once a year, claims nobody holds are dropped, with the names kept for them.
- **Neighbours are guarded.** Every neighbour feature is read through `if (A.X)` and the feature degrades without it:
  - without 21-npc-initiative, a budget of its own (half a move a year) runs the NPC moves;
  - without 41-circles, people talk to their friends and kin;
  - without 55-bonds, secrets come from a hash and killings are traced from the cause of death;
  - without 57-world-chronicle, there are no battle beliefs;
  - without 26-belief-truth, there are no beast beliefs, and tales use their own wording.
- **Signature.** `A.SIGNATURE.beliefPeople = true` is added beside 26's `beliefTruth`, which is left alone.
- **No patches.** Everything is wrappers that call the original: `A.kill`, `A.rulerDies`, `A.link`, `A.memSum`, `A.opinionParts`, `A.eventChoose`, `A.interact`, `A.interactOptions`, `A.applyFx` and `UI.personModal`.

## Limits

- **Only around you.** The people whose beliefs move are the ones you know and those close to them (at most 140), and the courts. The rest of the world holds nothing, except the kin at a death among the people you know. NPCs do not act on what they believe of each other beyond their opinion: no NPC accuses another, and no feud between two NPCs starts from a story.
- **Courts weigh little.** A court's beliefs move a realm's opinion of another by at most 6 points. In the test case that raised the odds of war a month from 0.0004 to 0.0005. It is a nudge on the AI, not a cause of wars, and no war has yet been traced to a court's false belief.
- **Few kinds, templated words.** There are eight kinds of claim. A twist has three wordings, a secret five, and a tale is 26's tale. A deed taken from a scene uses 55-bonds' mechanical past tense of the choice ("pulled Odo out, in the matter of the flooded mill"), which reads well for most labels and is skipped when it would not. A writer's pass on the commonest lines would help.
- **Battles are winners and counts.** The accounts disagree on who won and how many fell. No account invents a battle, moves it or changes who led it.
- **Your knowledge is wrong only about people.** You can believe a false story of someone, and find out. You cannot yet be wrong about a battle you heard of from afar, beyond 26's hearsay, or about a beast beyond 26's tales.
- **The bot does not talk.** The bench's lives answer the scenes the game puts to them, but they never use the person view's "Talk of what is said" or the release's interactions. So the measured rates leave out the player's own telling, and what a long talk carries.
- **What a court believes is not on its own card.** It shows only in the opinion tooltip and in `nb_court_word`.
