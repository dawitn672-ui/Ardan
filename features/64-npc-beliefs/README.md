# What people believe

**Aspect:** Uniqueness (signature system 2; Road to Ten, Uniqueness 3, and its "done when": all 3 signature systems show up in every run), with Relationships and Diplomacy as the places it shows · **Kind:** system (five core files), 16 events (prefix `nb_`), no patches, tests, and a bench script (`bench.mjs`)

The plan asks: "Build signature system 2, belief versus truth, everywhere: beasts, people, battles and events all have what people believe and what is true, and your character's knowledge can be wrong." The benchmark bar (W10) adds: "≥20% of rumors are false; the player can hold a false belief."

`26-belief-truth` gave the player a knowledge state for beasts and secrets, far news that runs high, and a legend in the Chronicle. `55-bonds` gave people secrets, `57-world-chronicle` a true dated record, `34-both-scales` three accounts of a battle. But the people of the world believed nothing of their own. What a neighbour thought of you followed only from what happened between you. Here every person around you, and every court, holds beliefs, and some of them are false. And every realm has its own account of the great events of the age (part 6), which feeds its grudges and its wariness; people act on what they believe (part 7); and what you are told of the world can be wrong, and be found out (part 8).

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
- **Effect key:** `nb`, declared for the linter (`A.FX_EXTRA`). Its sub-keys are `fix`, `fixAll`, `spread`, `spreadAll`, `believe`, `doubt`, `learn`, `lie`, `boast`, `truth`, `beast`, `learnBeast`, `court`, `warn`, `own` and `as`, and for parts 7 and 8 `avenge`, `calm`, `warnFoe`, `world` and `truthAll`.

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
| `nb_avenge` | NPC move | Someone you know believes a man killed their kin, and asks you to walk with them to his door |
| `nb_record_wrong` | follow-up | Something you were told of the world was not so |

`ctx.nbFalse = 1` marks a scene driven by a false belief, which is what the bench counts. Memory flags are read with `C.flag` (`nb_believed`, `nb_lied`, `nb_cleared`, `nb_embellished`). The scenes also use condition helpers: `C.nbSlander`, `C.nbTale`, `C.nbBattle`, `C.nbHeard`, `C.nbCourt`, `C.nbParent` `C.nbBeast(p, 'wrong' | 'right')` and `C.nbWorldHeard`.

### 6. What is said of the world (`d-world.core.js`)

Every realm keeps **"what is said here"**: up to 6 tellings of the great entries of 57's record (4 of its own affairs and its neighbours', 2 places for news from afar, at most 3 battles). Each telling is a claim, true or false, and the same machinery carries it (people take it up, the person view shows it).

| Entry | The record's account (T) | The other accounts |
| --- | --- | --- |
| A battle | who won, the dead | the winners count high (V), the losers claim the field (L), the far inflate (F) |
| A war ended (Q) | the victor and the provinces ceded | the losers: "neither side the better of it"; in a white peace both sides claim it; the far may name the wrong victor, and double the land |
| A ruler's death (R) | the cause | "his heir poisoned him" (true only where the release's poison whisper was), "agents of {the realm's foe} poisoned him", "died in the saddle, sword drawn" |
| A town taken (X) | terms, storm, sack or burning | the victims say one worse ("burned it and put its people to the sword"), the takers one milder, the far "burned", now and then by the taker's ally |
| A sickness (Y) | "came as sickness comes" | "a judgement on {the ruler}", "{the foe} brought it" |
| A Legend's death (G) | the cause | "not dead, but gone over the mountains", "struck down by treachery" |

- **Side and distance decide the version.** The weights depend on the realm's role in the entry: own, other side, a neighbour of either, or far.
- **Drift and propaganda.** Each year a true telling may drift to the realm's own version: 3% plus 7% times its propaganda (from the realm's legitimacy, its ruler's fame and the skill of 56's chancellor, 0 to 1), 3% more once it is 8 years old. A false telling is set right 2% a year, and 27% a year once a peace has been made with the realm it blames.
- **The believed history weighs on grudges.** What a realm believes its neighbour did to it (a town burned, its king poisoned by the neighbour's agents, the sickness brought) is added to 55-bonds' ledger sum (`FE.sum`), the number 68-casus-belli's plans and 55's war odds read, at full weight when false and half when true (a true wrong is mostly in the ledger already), at most 10. Where 55's ledger has no line, the same is added to `A.memSum`. The opinion tooltip names it: "What is said in Varenna: That the Horde burned Varenna and put its people to the sword, in 1105 −8".
- **Tales of cruelty make a realm warier.** Each telling of a town burned or sacked by the other realm, or of its agents poisoning a king, and each court belief that its ruler is a killer, takes 3 (2 for the court) from `A.interest`, the number alliances, pacts and guarantees read, at most 6.
- **Where you see it.** A realm's diplomacy card: "What is said in X" (and "At court in X"). The Realm tab: "What is said here", with the grudges it feeds and the councillors the court doubts. The World tab: a "Tales" view, each great event as the realms around you tell it. Each line is marked "so it was" or "not so" (with the record's line) only where you know how it went; otherwise "(you heard it so)", "(you heard it otherwise)" or "(you cannot say)".

### 7. People act on what they believe

- **Vengeance.** Someone who believes X killed their kin or close friend turns on X: X becomes their enemy (so 21's feud move can find X), and now and then they go to X's door (5% a year when you know them, 10% otherwise, more for the vengeful and wrathful). At the door X dies (22%, more if you came) or is hurt, and the two are enemies. A killing done is a true claim that X's own kin take up, so a false belief can start a true feud.
  - **21-npc-initiative's move `nb_avenge`:** "{them} is sure that {foe} killed {victim} … asks you to walk with {khim}". Walk with him, talk him out of it, warn the foe, or stay out.
  - **When the one blamed is you,** a kinsman at −20 or worse may start 39-schemes' plot against you (`pc.scAgainst`, with `nb` naming the claim): a murder at −55 or worse when cruel, vengeful or wrathful, else a slander. 39's once-a-decade rule holds.
  - Grief now looks wider for someone to blame: a death of someone whose kin or close friend you know counts, and with no foe to blame, grief may settle on an acquaintance the dead had cool dealings with (35% for a suspicious death, 10% otherwise). It is never so.
- **A court puts a doubted councillor out.** Each year someone at court may whisper that a councillor "is in the pay of the crown's enemies" (5%, ×1.6 under a paranoid ruler). It is true when the councillor's house wants the throne or the lords' liberties and is cold to the crown (or for one councillor in twelve, by a hash); the whisper finds the true ones three times as often. The court believes it 45% of the time (more under a paranoid ruler, less under a trusting or just one). A believed traitor loses his seat (40% a year, 70% under a paranoid ruler); 56's `RI.fillCouncil` names another, the court record says why, and he is not named to any seat while the court believes it. A player ruler's court is left alone.
- **Wariness and grudges** (part 6) are the realm-level behaviours.

### 8. Your picture of the world can be wrong

- **You hear what is said in your realm** of far battles, wars won, rulers' deaths, sicknesses and Legends, and take it on trust (40% a year each; `pc.nbk`, 10 kept), unless you know better (you were there, it was your realm's or a neighbour's battle, you were the dead ruler's kin or at his court). A line in the story log: "Word in Aldmark: That Lucerna won at Skarfell in 1105, and some 13,000 fell."
- **It comes out.** Each year a false belief of this kind is found out with a chance of 12% (more if literate, clever, or if you know someone from that realm; certain once you come to know it). Half the time it is the scene `nb_record_wrong` ("{who} … puts you right without unkindness: {the record's line}"): take the plain account, hold to the tale, carry it to the alehouse (others take your word), or ask who first told it otherwise. Otherwise a line in the story log.
- **The Chronicle** sets it down for each life, beside 26's "As the tale is told" (what is told of you): "What the world told {name}": "In 1105, word came that Lucerna won at Skarfell … In 1106 he learned otherwise. In May 1105, at Skarfell, …", or "As far as he ever knew, it was so." The text export has it too. Lives already played keep 8 such lines.
- **Signature.** `A.SIGNATURE.beliefWorld = true`.

## Measured by

`node tests/run.mjs <built.html> --features=npc-beliefs`, on the full build (68 features, `/tmp/ardan/nb/full.html`). Parts 1 to 5 (the first eight tests) give the same numbers as before, give or take a few points: by distance 15%, 42%, 64% and 78% false; one corrected in each circle clears 14 of 36.

| Test | Result |
| --- | --- |
| `nbDistance` | 70 people at each distance, 4 deeds. The share who believe a false version: same town **15%** (258 heard), same realm **42%** (182), a neighbour realm **64%** (83), further **78%** (50). The trusting at home 28%. The hostile at home 32%, and 62 of them believe the twist, against 6 of the others |
| `nbOpinionFollowsBelief` | From an opinion of 0: the deed +6, its tale **+10**, the twist −8, a false killing of his brother **−16**. The person view shows the +10. Set right about the tale, he falls back to +6. Cleared of the killing, 0. A stranger who already believes the tale meets you at +10 |
| `nbCorrectionsSpread` | Three circles of 12 friends who believe you killed a man, over 8 years. With nobody to set them right and chance switched off: 0 cleared. With one of each circle set right: **14** of 36 (3 at the start). After a public answer: 34. Chance alone (3% a year): 9 |
| `nbEveryScene` | All 16 scenes staged and every choice taken (67): no raw token, none over the word diet. Checked effects, besides the earlier nine: warning the man at the door puts the avenger off and the man lives; taking the plain account sets the player's belief right |
| `nbPersonView` | The three lists, with "true" and "false" only where you know. A name with markup is escaped. Drawing it changes neither the state nor the random stream |
| `nbCourtWeighs` | Aldmark's court believes two stories of Varenna's ruler: opinion −20 → **−26** (the cap), and the odds of war a month 0.0046 → 0.0051. Once the court sees through the stories, −20 again |
| `nbBattlesAndBeasts` | Six battles your realm won. False accounts: the winners' people **100%**, the losers' 95% (37 of 58 claim they held the field), the far 50%. Of 9 hill beasts, 40 hunters know the truth of 85; 40 scribes, 12 |
| `nbDeterminism` | 14 years twice, the second time drawing the screens every step: the same beliefs (21 people, 210 claims). The same after a save round trip. A save stripped of all of it loads and plays 3 years |
| `nbInRealLives` | Bot lives until three of 15 years or more (3 lives, 93 years): **3 of 3 met belief against truth in play**. 141 people hold 867 beliefs at the end, 39% false; 17 belief scenes, 14 driven by a false belief. The player heard 46 tales of the world and found 18 of them wrong. 7,255 bytes on people (51 a holder) and 53,820 shared: **0.62% of the saves** |
| `nbWorldTellings` | 24 battles and 24 sacks put into the record and told in all 34 realms. Battles: the winners count the dead high **22 of 24**, the losers claim the field **10 of 24**, false near 49% (131 tellings), far **77%** (637). Sacks: the victims say "burned" 12 of 24, the takers say it was less 8 of 24; false near 41%, far **76%**. The yearly step keeps at most 6 a realm |
| `nbWorldDrift` | 180 true tellings of victories, after 10 years: **48** drifted to the flattering count under a ruler of no standing (propaganda 0.10), **98** under one of full legitimacy and fame (0.91). A sack told as a burning, after 3 years: set right in 3 of 40 trials, and in **24 of 40** after a peace with the realm it blames |
| `nbBelievedGrudge` | Varenna believes the Horde burned one of its towns and put the people to the sword (the record: sacked). 55's ledger sum, as 68 reads it, **0 → −8**; opinion 0 → −8; **68's plan: none → a feud plan** (grudge 8). Without the belief: 0, no plan. Told as it was: −2. With a king's death laid on the Horde as well: −10, the cap. Tooltip "What is said in Varenna: That the Horde burned Varenna and put its people to the sword, in 1105 −8" |
| `nbWary` | Solenne's interest in Highland (what alliances, pacts and guarantees read), with no tale, then one, two and three tales of towns burned by Highland: −39.6 → −42.6 → −45.6 → −45.6 (the cap of 6). Switched off, or the same towns told as stormings: −39.6 |
| `nbRevenge` | A vengeful man who believes X killed his brother (it was a fever): X is now his enemy, and 21's feud move finds X; 21's `nb_avenge` desire 3.5. Talked out of it: he stops believing it, and X lives. Walked with him: X dies ("… for a killing he never did"), the player is marked as having gone to the wrong door, and X's brother now believes the true killing. A vengeful father at −60 who believes the player killed his child: **39's murder plot**, naming the claim. Off-screen, alone: 1 act, 1 killing, on a false belief |
| `nbCourtSidelines` | Solenne's court believes its Chancellor is in the pay of the crown's enemies (false): **put out**, the seat filled, the court record says "The court believes Amadeo Rusk is in the pay of the crown's enemies". Seats freed and filled 8 times since: re-seated **0**. Once the court sees through it, he is no longer barred |
| `nbPlayerWorld` | A far battle, told at home with the count run high: you cannot know it, and take it on trust ("Word in Aldmark: That Lucerna won at Skarfell in 1105, and some 13,000 fell."). A year on it comes out (`nb_record_wrong`), and the belief is set right. The Chronicle: "What the world told …", "learned otherwise" with the record's line, a king's death still believed ("As far as he ever knew"); in the export too; pure. An old save without the tellings plays on |
| `nbWorldViews` | The diplomacy card ("What is said in"), the Realm tab ("What is said here"), the World tab's Tales button and view: the record's line for a battle you know, "cannot say from here" for a far one, "(you heard it so)". A realm name with markup is escaped. Drawing all of it changes neither the state nor the random stream |

The core suites (`boot`, `lives`, `saveRoundTrip`, `uiSmoke`) pass alongside. The events pass `tools/lint-events.mjs` (0 errors) and `tools/lint-choices.mjs` (0 obviously best) on the full build. The tests of 21-npc-initiative, 26-belief-truth, 39-schemes, 55-bonds, 56-realm-inside and 68-casus-belli pass on the same build. 57-world-chronicle's pass but one, `wcExportLegends` (see Limits).

`node features/64-npc-beliefs/bench.mjs <built.html>`, the full build. 16 bot lives, 429 years, a census every 5 years (97 censuses):

- **Every life meets it.** Of the 12 lives of 15 years or more, **12 (100%)** met belief against truth in play: a belief scene, or finding out that something they were told was not so. Per life: 5 to 15 scenes, and 2 to 10 corrections of what they had been told of the world. Of the 4 shorter lives (2 to 12 years), 3 did too.
- **What is said of the world.** 15,088 tellings counted, **59.8% false**. By the realm's side: its own affairs 59.6%, the other side 62.2%, neighbours 55.9%, far 60.7%. By kind: battles 70.8%, sicknesses 62.6%, wars ended 54%, rulers' deaths 51%, towns taken 44.9%. 1,866 tellings drifted to the realm's own version, 959 were set right, and 1,409 times one of the people around the player took one up.
- **What it does to realms.** In 507 of the censused neighbour pairs, what is said fed a grudge of 3 or more; in 909, wariness. Of 276 censused feud plans of 68, **9 (3%) would not exist without the believed history**.
- **People act on it.** 359 treason whispers took hold at court, and **304 councillors were put out** (258 of them innocent). Vengeance: no bot life met a killing believed among the people it knew (only 4 killings and 2 blamed deaths in 429 years), so no feud was turned, nobody went to a door and no plot was started from a belief. The behaviour is built and tested, but rare in play.
- **Your own knowledge.** The bots heard 152 tales of the world on trust and found 70 of them wrong; 25 of those through `nb_record_wrong`. 14 of 16 lives found out they had been wrong at least once.
- **Scenes.** **2.94 belief scenes a decade, 2.52 of them driven by a false belief** (126 and 108). By scene: praised 29, record wrong 25, accused 20, beast (the truth) 13, battle tale 12, the tale comes due 11, beast (the old way) 6, gossip 6, slander 4.
- **The people around you** (as before): 33.7% of all beliefs held are false; about you 23.9%, about other people 48.8%, about battles 68.4%. Same town 31.7% false, same realm 52.9%, a neighbour realm 60.6%, further 61.4%. Of those who hold a belief about you, 55.3% have an opinion moved 5 or more by a false one.
- **Size.** One 60-year life (a dwarf artisan from 40, `--what=long`) ends with 345 claims, 35 courts, the tellings of 34 realms, and 53 people holding 332 beliefs. That is **25.5 KB**: 21.8 KB shared, 3.4 KB on people (**64 bytes a holder**), 0.3 KB the player's. It is **0.67%** of a 3.8 MB save. The world tellings roughly double the shared table (13.2 KB before).
- **Cost and replay.** The same 20-year life ran in 10.8 s with the yearly step on and 10.0 s with it off (choosing the entries before making the claims kept it there; making every version first cost 29%). Run twice with it on, it gave the same beliefs, after a game played with it off as well.

## Rules kept

- **Deterministic.**
  - Only engine paths roll dice: the month hook (the yearly step), `A.kill`, `A.rulerDies`, event choices and interactions.
  - Setups pick in order or by a hash of the year.
  - The beasts people know are a hash of who they are, never stored. The cache of `C.nbBeast` is now tied to the game it was built in: before, a new game in the same page could read the last game's answers (the bench's off-then-on replay showed it).
- **Render-pure.** The person view, the beast line, the diplomacy card, the Realm card, the Tales view, the Chronicle section, the condition helpers and the tooltips only read. The tests check that drawing them leaves the state and the random stream unchanged.
- **Escaped.** Every value in HTML goes through `UI.esc`, and stored words have `< > " { }` stripped.
- **Old saves.** Everything is optional and made on first use: `S.npcb` (and its `pb` and `ww`), `p.nb`, `p.nbRv` and `pc.nbk`. A save without them loads and plays.
- **Pruned with the dead.** A person's beliefs go when they die; a life already played keeps 8 lines of what it was told of the world, for the Chronicle. Once a year, claims nobody holds are dropped.
- **Neighbours are guarded.** Every neighbour feature is read through `if (A.X)` and the feature degrades without it:
  - without 21-npc-initiative, a budget of its own (half a move a year) runs the NPC moves, `nb_avenge` among them;
  - without 39-schemes, nobody plots against you over a killing (they still turn on the one they blame);
  - without 41-circles, people talk to their friends and kin;
  - without 55-bonds, secrets come from a hash, killings are traced from the cause of death, and the believed history weighs only on opinion (`A.memSum`);
  - without 56-realm-inside, no councillor is put out;
  - without 57-world-chronicle, there are no battle beliefs and no tellings of the world;
  - without 26-belief-truth, there are no beast beliefs, and tales use their own wording;
  - 68-casus-belli reads 55's `FE.sum` at call time, so it sees the believed history without being touched.
- **57 still observes.** The realms' tellings are seeded with the battles (`NB.seedBattles`), so 57's `wcObservesOnly`, which holds that back, still finds the same world with and without the record.
- **Signature.** `A.SIGNATURE.beliefPeople` and `A.SIGNATURE.beliefWorld` are added beside 26's `beliefTruth`, which is left alone.
- **No patches.** Everything is wrappers that call the original: `A.kill`, `A.rulerDies`, `A.link`, `A.memSum`, `A.opinionParts`, `A.interest`, `A.eventChoose`, `A.interact`, `A.interactOptions`, `A.applyFx`, 55's `FEUD.sum`, 56's `RI.fillCouncil`, `UI.personModal`, `UI.diplCard`, `UI.TAB.realm`, `UI.TAB.world`, `UI.TAB.book` and `A.chronicleText`.

## Limits

- **Vengeance is rare in play.** The rules are there and tested (the enemy made, the move to the player, the plot against the player, the killing done and the feud it starts), but the bot lives met no killing believed among the people they knew: deaths of the people a life knows, of a kind that leads to blame, are rare in this simulation (4 killings and 2 blamed deaths in 429 years). Grief now blames an acquaintance when there is no foe, which helps a little. More deaths with a culprit (brawls, duels between NPCs, killings in raids) would feed it.
- **Councillors are put out often, and mostly innocent.** 304 in 429 bot years across Ardan, 258 of them innocent, because few councillors are really disloyal by the rule used (a house that wants the throne or the lords' liberties and is cold to the crown). That reads as courts full of whispers; if it is too much, lower `NB.TREASON` (5%). A player ruler's court is left alone: there is no scene yet in which your council brings you such a whisper.
- **Grudges and wariness weigh a little.** At most 10 on a grudge (enough to cross 68's bar of 8: 3% of feud plans need it) and 6 on interest. The balance bench was not run (the coordinator runs it); the AI's war and alliance odds move a little, so `aiWarsPerRealmYear` and alliance counts may shift.
- **The tellings are templates.** Six kinds of entry, two to four accounts each, one wording each. The far's garbling is a wrong victor, a wrong taker or a burned town, never an invented battle or a moved one.
- **26's far news stays a news line.** What you hear in your realm comes from 57's record; 26's inflated news lines and their corrections are not linked to it.
- **The player's knowledge.** You can be wrong about far battles, wars, rulers' deaths, sicknesses and Legends, and about people. You are never wrong about your own realm's or a neighbour's battles (you know them), which follows the earlier rule.
- **The bot does not talk.** The bench's lives answer the scenes the game puts to them, but never use "Talk of what is said" or the release's interactions, so the measured rates leave out the player's own telling.
- **57's `wcExportLegends` fails on the full build.** Its single life (seed 5150) now dies of a lung fever at 18, two years in, on the random stream this feature shifts; with the earlier version of this feature it lived 50 years, and seeds 5151 and 5152 live 50 years on this build. The test needs to take the first seed that lives (57 is not this feature's folder).
- **The tests assume the neighbours.** On the fix layer with this feature alone, the tests that need a neighbour skip or adapt, except two: `nbEveryScene` stages the beast scenes with 26-belief-truth, and `nbInRealLives` finds 2 of 3 lives meeting belief against truth (there is no world record to tell, so no tales of the world to find wrong).
