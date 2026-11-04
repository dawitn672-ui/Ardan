# Rivals and ambition

**Aspect:** Events and story (Road to Ten, Events 3 and 4) · **Kind:** 13 story arcs, 56 scenes and a closing scene, a little system code, no patches

The plan asks for "60 long arcs of 3 to 8 stages over 2 to 20 years: a blood feud, a secret child, a rival's rise, a famous sword's history, a plague year, an apprentice who passes you", and for every arc to end "with a lasting change: a title, a bond, a wound, a law, or a province on the map". Four writers share the sixty. This folder holds the thirteen about rivals and ambition, on the story track that `46-life-arcs` provides.

**The arcs.**

| Arc | Scenes, years apart | Who can meet it | What it is about | How it can end |
| --- | --- | --- | --- | --- |
| **The other one** (`ar_rise`) | 5, 2–4 | adults 20–50 | Your rival (your real one, if you have one) gets the mill, the captaincy or the ship you wanted, then more, then too much. | Peace at a wedding table; a feud for life; or you stop caring |
| **The apprentice** (`ar_pupil`) | 5, 2–4 | anyone a rung up a trade, 28–62 | A widow's child who mends what it breaks; asked for by name; a rival master's offer; a better name than yours. | The work left to the apprentice; kept to the end; or a cottage and beans |
| **The patron** (`ar_patron`) | 4, 2–4 | free adults 19–45 | Someone above you pays your way and asks "nothing yet"; then a lie to the magistrate; then a rival's letters. | You kneel and swear (a sworn tie); you pay it all back and owe no one; or you expose them |
| **The false friend** (`ar_false`) | 4, 1–3 | adults 22–65 | Your friend (a real one, if you have one) asks a great many questions; then a buyer goes elsewhere; then the man in the capital. | Friends with eyes open; an enemy; or a habit of trusting less |
| **The election** (`ar_elec`) | 4, 1–2 | free commoners 30–70 | Warden of the guild, alderman, or reeve, against your rival; promise, stand on your name, or buy votes; the accounts; the next election. | Chosen twice (a standing other arcs read); backing the rival; or never again |
| **An affair of honour** (`ar_hon`) | 4, 1–2 | nobles, gentry, soldiers, knights, courtiers, the famous; 18–50 | Words at a feast; a field at first light; the brother; the justices. | The name Firstfrost; a friend; a quarrel kept oiled; the sword over the hearth. A lost duel leaves a scar |
| **The libel** (`ar_libel`) | 4, 1–2 | anyone with a name, a trade or money, 22–70 | Verses on the church door call you Backgate; whose hand; a suit, a purse, or worse verses. | Cleared by the justices (a standing); the name Backgate, worn; an enemy; silence |
| **A forged charter** (`ar_charter`) | 4, 1–3 | holders of a farm, house, shop or family land, 25–75 | A charter that smells new gives your ground to someone else; the clerk and the hot knife; the hundred court. | Bounds walked and written; a friend over the hedge; or the land is lost (it leaves your assets) and you start again in a cottage |
| **The stolen secret** (`ar_recipe`) | 4, 1–3 | 17 trades, 22–65 | Your myrtle ale, fast blue, temper or salve; your journeyman sells it across the river; the journeyman comes back. | An epithet from the secret (True-Edge, Fast-Blue); sold for a town house; given away; left to the journeyman |
| **The bribe** (`ar_bribe`) | 3, 3–6 | anyone with a post, rank, office or title, 22–58 | A purse and "a small thing more"; years later, the small thing; then the justices. | The whole truth (a standing); a lie that holds or a year in prison; silence bought |
| **The vendetta at court** (`ar_ven`) | 6, 1–3 | nobles, gentry, courtiers, envoys, stewards, officers | A rival house (a real house of your realm) seats you below the salt; whispers; a match; the boar hunt; the keeper of the seal. | Peace sworn between the houses; the feud passed to your heirs; leaving court; using the seal to break them |
| **The usurper in your house** (`ar_usurp`) | 4, 1–3 | owners of a shop, farm, inn or manor, heads of families, masters; 38–75 | Your steward (or your nephew, if you have one) knows every account; the second ledger; the men choose. | Kept and run to the end; a partner; given up (it leaves your assets); cast out |
| **The moneylender** (`ar_debt`) | 5, 1–2 | adults 20–60 with under 500 suns | A hundred by Lady Day; quarter day; a sealed box for the capital; the bailiff. | Paid off and careful; a lender yourself; the lender's clerk; sold up |

**How a story is told.**

- **One person, start to end.** The first scene casts the person: your real rival, friend, patron or nephew if you have one, else someone made for the part (an apprentice of fifteen, a moneylender, a cousin of a real house). The arc keeps the id, so the rival of the first scene is the rival of the last, and later scenes say {them}, {khe}, {khis}, {khers}. While an arc runs its people are "seen" each month, so the release's forgetting does not drop them halfway. If the person dies first, the scene that was due gives way to a closing one (`ar_gone`): word comes that they are dead, a line on what the story was, and whether you go to the grave. It ends the arc and leaves a deed. Only someone gone from the world altogether (pruned from the save) gives the arc up.
- **Every choice leaves a mark.** Later scenes read it, and change both what they say and what they offer. In *The election*, bought votes make the count a 35 check instead of a 50 speech, and the third scene is the dues and the roof if you won, or the winner's accounts if you lost. In *The libel*, finding the hand opens "Lay {khis} own letter before the justices" at 40 instead of 55. In *A forged charter*, the clerk's hot knife, your own forgery and your neighbours' oath are three different hearings.
- **Arcs read each other.** Owing no one (*The patron*) is noticed when the election and the bribe come. A seat you hold (*The election*) is in the libel's verses. A name cleared by the justices helps you stand. Bounds you walked (*A forged charter*) are known to the steward in *The usurper*.
- **Every ending lasts.** Each choice of each last scene, on both sides of a check, carries at least one of: a sworn tie, a bond (a friend or enemy made, or an opinion moved 20 or more), an epithet, a wound, a property gained or lost, a standing flag other scenes read (`ar_seat`, `ar_cleared`, `ar_own_man`, `ar_bounds`, `ar_clean_hands`, `ar_house_peace`, `ar_house_feud`, …), a deed in your life story, or a prison term. A trait alone never counts as the lasting change: with `49-body-mind` a trait comes from deeds over years, so an event's trait is a push, not a sure change.

**Which one a life meets.** The story track starts one arc at a time, chosen by weight among those whose start fits. The arcs only some lives can meet weigh more (the apprentice and the stolen secret 3, the election 2.5, the vendetta 2, the charter, the usurper and the moneylender 1.5); those open to nearly everyone weigh less (the bribe 0.8, the false friend and the libel 0.7). Without that, a first run of bot lives met the false friend 13 times and the apprentice not at all.

**Code.** `arcs.core.js` registers the arcs with `A.ARCS.story` and adds `A.ARV`: `cast` (the person), `memo` (a word the scenes share, such as the seat, the secret or the house, kept on the arc), and three effect keys, declared in `A.FX_EXTRA`: `arDeed` and `arEpithet` (a deed or epithet with tokens) and `arLose` (the holding the story was about is gone; without one, a fifth of your coin).

**Measured by** (`test.mjs`, on `--only=life-arcs,arcs-rivals` and on the full build).

| Test | Result |
| --- | --- |
| `rivalsRegistered` | 13 arcs, 56 scenes, 4.3 on average, 4 of five or more (rise, apprentice, moneylender 5; vendetta 6). Each spans 3 to 16 years. Every scene is trigger-only, every choice (both sides of a check) carries `fx.arc`, and every ending carries a lasting effect other than a trait. |
| `rivalsPlayThrough` | Each arc played two ways: the first choice with every check won, the last choice with every check lost. 13 of 13 complete both ways. In each, a later scene reads differently on the two paths, the person is the same from first scene to last, the same seed plays the same twice, and the ending changed the life (e.g. *The other one*: deed and bond, or trait and deed; *The patron*: deed, bond and sworn tie, or standing and bond). |
| `rivalsEveryPath` | 156 random runs (12 per arc, on two lives with 0, 120 and 400 suns): all 672 scenes shown, no raw token, all 156 finished. The longest scene is 62 words. 23 later runs cast the person the life already knew. The closing scene reads, without a raw token, for all 13 arcs. |
| `rivalsWhoMeetsThem` | A peasant of 30 can meet 5 of these, a farmer with a farm 11, a smith 9, a master brewer 8, a merchant 8, a noble 7, a courtier 9, a serf 3, a soldier 6, a ruler 0. Each arc is open to at least one of these lives. |
| `rivalsPeopleKept` | After five idle years, a running arc's moneylender is still known; once the arc is over, the release forgets him. A rival who dies before the second scene: that scene is dropped for the closing one ("Word comes that Nessa is dead, and buried before you heard. The race between you is over…"), and the arc ends, not given up, with the deed "Stood at the grave of Nessa of Brookcliff". Someone pruned from the world altogether: the scene is dropped and the arc is given up. |
| `rivalsOldSave` | An arc saved without its people picks someone up and shows its next scene. |
| `rivalsBotLives` | Bot lives over the six starts, from age 20, dealt until ten last forty years: 30 lives, 11 of 40+ years, and all 11 began one of these arcs. 67 begun in all, all 13 kinds: the apprentice 7, the charter 7, the bribe 8, the election 6, the moneylender 6, the rival 6, the duel 6, the false friend 5, the secret 4, the patron, the libel, the vendetta and the usurper 3 each. 248 scenes played, 53 arcs finished, 1 given up; the rest were still running when the life ended. A life of 40+ years ran 3 to 6 of them (median 5). Private build (`--only=life-arcs,arcs-rivals`), so these are the only stories on the track. On the full build (52 features, the other writers' arcs on the same track): 18 lives, 11 of 40+ years, 6 of those began one of these; 14 of the 76 story arcs begun were these (8 kinds), 13 finished, 0 given up. |

Lints: `lint-events` 57 events, 387 renders checked, no errors or warnings (the closing scene declines in the linter, which has no dead person to give it; `rivalsEveryPath` renders it for every arc). `lint-choices` 0 obviously best. Both pass on the private build and the full build.

Balance: not run here. The coordinator runs `bench/balance.mjs` once on the integrated build. The money these arcs move is small against the bands (single choices of 20 to 300 suns; a town house or cottage at most), and nothing here kills.

**Rules kept.**

- Casting, memos and the month hook run in the engine. A scene's setup runs once, when the scene comes to the head of the queue, and uses only `A.ri`, `A.pick` and `A.chance`. Nothing here runs while drawing.
- All text goes through the engine's templating. Names come from the world.
- `pc.arcs[k].ar` is a new optional field. A save without it loads, and the arc casts someone.
- Marks are plain words (`la_ar_*` flags, as in 46-life-arcs).
- Marks are written whole at the call site (`mk('ar_rise_grace')`, `M(p, 'ar_rise_grace')`), not assembled
  from a prefix. `bench/bot.mjs`'s `memoryIndex()` matches `M(p, 'x')` against the flag `la_x`, so a helper that
  silently added `ar_` hid every read in this file from it.

**Limits.**

- **13 of the plan's 60.** The other writers' folders (50, 52, 53) hold the rest. All share the one-at-a-time story track, so in the full world each life meets fewer of these.
- **One story at a time.** The track runs one story arc at a time, alongside the work of your life. With only these arcs on it, a life of 40+ years met 3 to 6 (median 5); with the other writers' arcs on the same track, fewer of each life's stories are these. The rival's rise and the vendetta can take fifteen years between them.
- **A person who dies ends the story.** The closing scene is one scene for all thirteen arcs, with a line for each; heirs who carry it on (the rival's son, the lender's widow with the book) are not written.
- **Some outcomes are words, not systems.** Keeping the guild seat is a flag and a deed; there is no guild office in the engine. The keeper of the seal is not an office of state. The forged charter can take a property off your list, but no court records the boundary.
- **The writing wants a human read.** The arcs were play-tested by bots and by reading the rendered scenes on both paths, not by players.

## Read it or drop it (round 8)

**Measured with the brief's script, prefix `ar_` (orphan flags whose setter is an `ar_` event):**

| build | orphans before | after | memory events before | after |
| --- | --- | --- | --- | --- |
| `--only=arcs-rivals` | 215 | 4 | 123 | 166 |
| `--only=life-arcs,arcs-rivals` | — | 4 | — | 190 (memPct 5.8) |

(The arcs need 46-life-arcs to run at all, so the feature's own tests want the second build; the orphan
count is static and reads the same on both.)

Of the 215, **208 were arc marks** (105 distinct, set at 235 sites) and 7 were plain `flag:` keys.

**103 of the marks were already read** by a later scene of the same arc, and the analyzer could not see it.
`mk`/`fin` built the mark as `'ar_' + m` and `M` read `'la_ar_' + m`, so the source said `M(p, 'rise_grace')`
while the flag was `la_ar_rise_grace`; `memoryIndex()` looked for `la_rise_grace` and found nothing. The `any(p, a, b)`
helper was invisible for a second reason: the analyzer only matches `M`, `had` and `arcMark`. Both are now written out
(`mk('ar_rise_grace')`, `M(p, 'ar_rise_grace')`, `any` expanded to `M(p, …) || M(p, …)` and deleted), which changes no
flag name, no save and no behaviour — it only lets the counter see reads that were always there. That alone took
215 → 112 and 123 → 166 memory events.

**The remaining 105 marks were genuinely dead. 52 are now read, 53 dropped.**

*Dropped (53).* 51 of them are the mark on an arc's **last** scene, plus the two on `ar_gone`, which is itself a
closing scene: no later stage of that arc exists, so nothing could ever answer them. The lasting change those
scenes make is already carried by what the choice does — `arDeed`, `epithet`, `trait`, `sworn`, an asset, a changed
bond — so the mark was the only dead part, and `arc: fin('x')` became plain `arc: 'end'`. The other two are
`ar_lib_asked` (the failed attempt to trace the verses, whose case the next scene already covers by the absence of
`ar_lib_traced`) and `ar_rec_spoiled` (likewise against `ar_rec_better`).

Two of those were the `lose` branch of a check, where the mark was the whole of `fx.arc`; they now carry
`arc: 'next'`, so the arc still advances. `ar_gone` keeps `arc: { go: 'end' }` rather than the bare string,
because `rivalsRegistered` asserts that form for the closing scene, which belongs to no arc's stage list.

*Read (52).* Every one is a mid-arc choice a player would remember making, and in most cases a later scene was
**already** describing its consequence in an `else` branch without naming it: `ar_pupil_hard` ("works {khim} hard")
was the fall-through of scene 2's "{khe} does exactly what {khe} is told, and not one thing more", `ar_false_watch`
was the fall-through of "Watching pays", `ar_pat_refused` of "You refused {them} once", and so on. Those became
explicit `M(p, 'ar_…')` tests with a fallback for a save that jumped a stage, which costs no words and makes the
link the analyzer's own convention asks for. The rest are one clause grafted onto a scene that already exists:
the rival not mentioning the day you refused him, the men waiting in the yard because you let the ledgers alone,
the bailiff coming because you refused the box. By arc: rise 4, pupil 3, patron 5, false friend 3, election 5,
honour 3, libel 4, charter 3, secret 5, bribe 3, vendetta 6, usurper 3, moneylender 5.

*The 7 plain flags.* These are not arc marks but the arcs' lasting marks on a life, set by a last scene and meant
to be read by **another** arc, the way `ar_own_man`, `ar_cleared`, `ar_seat` and `ar_bounds` already are. Three
had an obvious reader and got one: `ar_clean_hands` (why three men ask you to stand for the seat),
`ar_bought_silence` (what the verses on the church door are about), `ar_patron_broken` (what a briber has heard
about you before {khe} puts the purse down). **Four are left: `ar_house_peace`, `ar_house_feud`,
`ar_lender_clerk`, `ar_debt_free`.** `ar_house_feud` is read by `features/74-old-age/e-peace.events.js`, so it is
not an orphan on the full build; the other three are. Reading them would have meant forcing a clause into an
unrelated arc's opening scene, which is the kind of writing this round was told not to do, so they are left for a
human to place or cut.
