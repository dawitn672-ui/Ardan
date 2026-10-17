# Old age

**Aspect:** Character (Road to Ten, Character 6: "each life stage has its own play"), with Events 2 (memory) and the scorecard's old-age count · **Kind:** 119 events (prefix `oa_`), a small core (people, memory pickers, condition helpers, one effect key, the deathbed, the death screen), no patches, 10 events un-retired from `58-event-cut`, tests, and a bench script (`bench.mjs`)

The scorecard (`bench/rubric.mjs`) asks for **150 or more old-age events**: events whose `cond` requires `C.old`, the old stage or an age of 55 or more (`bench/run.mjs`, events module, retired events not counted). The release had 41. Features raised the count to 50. When `58-event-cut` retired the weak one-offs, the count fell to **26**. The plan's Character 6 wants old age to have its own play. Until now it had three actions from `49-body-mind` (teach, memoir, tend), a legacy arc from `46-life-arcs`, and an ending from `28-endings`. Bot lives past 55 met **0.7 old-age scenes a decade**, out of about 95 events.

## What it does

### 1. Ten retired old-age events come back

Of the 50 old-age events in the build, the cut had retired 24. I read all 24 and put back the ten that offer a real choice: a cost on one side, a risk or a lasting mark on the other. Their lines are gone from `features/58-event-cut/list.core.js`, which now retires 826 events. The header comment there still says 836, because this task allowed only removing lines; `RETIRED.md` still lists all ten.

| Back in the roll | Why |
| --- | --- |
| `bd_failing_eyes` (N) | 20 suns for a reading stone, or lean on a child, or pride at a cost |
| `bd_old_dignity` (N) | dignity, a check to tell them what you did, or a temper that costs honour |
| `ct_ruler_health` (B) | the physicians: a check that risks health, a bleeding that costs it, or hiding it from the court through a realm effect |
| `ct_old_ruler` (N) | the old ruler: bring the heir into council or go on pilgrimage, both realm effects |
| `ww_sol_grave` (N) | Solenne: 40 suns for a grave by the Temple wall, 20 to the hospital, or nothing |
| `ww_os_will` (B) | Ostra: the will, with 40 suns to the Temple or to the poor, or all to the family |
| `lf_health_chest` (N) | a pain in the chest: the physician (a check with a wound), the healer, or work on at a 35% risk of a bad heart |
| `lf_old_last_wish` (B) | one last journey: a check against health, a grandchild's cart, or let it go; it sets a flag |
| `lf_old_grandchild_secret` (O) | keep a grandchild's secret, help put it right, or tell the parents (opinion −20) |
| `lf_old_dwarf_vault` (N) | which tools a dwarf takes into the vault: the line, yourself, or give both away for a scandal |

The other 14 stay retired. Each is a set of pleasant variants with no cost and nothing left behind, for example *Growing old together*, *Tell us a story*, the Hartgate lay and the elf's slow fade. Several of them are themes the new scenes take up with a real choice: the old couple, the stories you tell, the elf who outlives the humans.

### 2. 119 new scenes (`a-` to `g-*.events.js`)

| Pack | Scenes | What they are about |
| --- | --- | --- |
| a-body | 18 | Faces across the square; the reading glass; deafness at table; hands that will not close; the last tooth; the stair; the cold; the mounting block; the old hurt (67's record of when you were hurt, `{oaMyear}`); the scar that knows the weather (49's lasting wounds); the word that will not come; the ice; the black hour; the walk to market; your father's face; the sack of grain; the physician; minding the body (49's `bmCare`) |
| b-generation | 18 | The burials this life attends: the friend, kin or neighbour who died in the last two years, named, with the year. Outliving an enemy; counting the year's dead; the last of your mother's children; the bench by the door; a letter from the dead; the other side of the bed; the old friend who walks over, or will not see spring; who will carry you; the dead master's things sold at the door; the dead at supper; room in the churchyard. Being the oldest who remembers: an entry of 57's world record at least 25 years old that you were old enough to see (`{oaRef}`, `{oaAge}`), told wrong at the well, recalled in a fat year, asked for by the monk writing the annals, or a crown you outlived. And the men of the ford (46's `la_cmd_*`) |
| c-kin | 17 | A grandchild named for you; a lesson in your best skill; a grandchild in trouble, at a wedding, or off to the capital; four generations on a bench. The heir asks you to move in. **The retirement contract**: bed, board and a cloak a year, sworn before the manor court or on a handshake, then 2 to 5 years later what was promised, honoured or skimped by the same person. Neglect and care from your own children, by their opinion of you; children quarrelling over the house. For the childless: who will look after you, and the **corrody** bought from an abbey, with its sequel. The young who will not listen, and the young who ask |
| d-handing | 16 | The blade over the hearth: it goes to the heir, really (`fx.oa.hand` moves the gear). Who carries Kestrel (53's sword). The tools; the name over the shop; whose ground it will be (46's holding bought from the widow, 50's land, 53's field); the name that stops with you; the pupil who passed you (49's `bm_surpassed`); someone has read your memoirs (49's `bm_memoir`); the secret place; the seal of the house. **The will**, and years later someone who has seen it. What you built (53's bridge, bell, mill); the house abroad (46's trader legacy); the shrine or school (46's priest and scholar legacies); one more thing to finish |
| e-peace | 16 | Settling scores: a living person you share a heavy wrong with from 8 or more years ago (55's weighed lines, settled or refreshed with `fx.bonds`), an old kindness repaid, a wrong only you remember and a killing (67's record), the last two old enemies, the feud at the end (50's, 51's or the release's feud flags). Faith and fear: the fear at night, the painting over the temple door, the shroud, doubt after a life of faith, a boy priest, the dole, the coffin, sitting with the dying, a bone for an easy death. **The deathbed** (below) |
| f-late | 17 | A late love, and what the family says about it; letters at sixty; never having seen the sea; one more time at the moot; where the old boundary ran (the oldest swear to it before the court) and beating the bounds; the new way; a child on the throne (the realm's ruler under 28), and the young ruler asking the old lords; your life as the ballad tells it (`pc.deeds` and 26's tale of them), as a grandchild tells it back, and as an enemy tells it; put out to grass; the oldest voice at council; something that will outlast you; not done yet |
| g-lives | 17 | Old age by kind of life: forty years of the same quarrel; the spouse who does not know you today; the wedding day; the old serf freed because he can no longer work; the muster-master's eye; the merchant's debt-book; the old priest and the bishop's letter; the ruler whose heir is a child (regency); the reign in the chronicle; the elf among the humans' great-grandchildren; the dwarf's line in the Ancestors' Hall; the orc who did not die in battle; the oldest in the parish; a thief who thinks the old are easy; the best of your days and what it cost (67's record) |

**Every scene cites this life where it can.** The setup names a real person, a dated memory line, a deed or a world-record entry. If there is nothing to cite, the setup backs out (`ctx.skip`) rather than invent it. The people are found without dice, hashed from the event, the person and the year, so a scene's `cond` and its `setup` always agree. The condition helpers are added to `A.C`: `grandkids`, `widowed`, `heir`, `mourns`, `outlived`, `peers`, `youngFolk`, `oldLine`, `grudge`, `debt`, `deeds`, `remembers`, `youngRuler`, `pupil`. Every `cond` also starts with `C.old(p)`, so the scorecard counts it and the old stage is race-relative: 50 for a human, 180 for a dwarf, 350 for an elf.

**Marks other scenes read.** Choices set `oa_*` flags (the grave, the will, the contract, the corrody, the shroud, the vow, the pilgrimage, a peace made, a late love, the blade handed on, the sea seen), and later scenes change on them. Five chains schedule their sequel some years on with the same person (`fx.oa.later` → `A.schedule`): the contract, the will, the corrody, the late love, and the deathbed.

**One effect key**, `oa` (declared in `A.FX_EXTRA`): `{ mark, later, hand, will, peace }`.

### 3. The deathbed, and the death screen

Each year, if the engine's own death odds for the player (`A.deathChance`) pass 12% (a human near 70) or health is under 25, the core schedules `oa_deathbed` within the year, at most once in 8 years. The family is in the room, or the neighbours, or the faces of the dead. You can say something kind to each, tell the truth about something, settle the will, or ask for broth and send them out (a check, and you may get up again). The scene reads the marks of your old age: the peace you made, the shroud you sewed, the will.

`A.epilogue` (`28-endings`) is wrapped and stays pure. It adds up to four lines from those marks: the will as written (eldest, equal parts, a third to the altar, the youngest, none), who carries your blade, the enemy who comes to the burial because you made peace, the plot you bought, your last words, the candle, the late love at the front of the church.

## Measured by

`node tests/run.mjs <build> --features=old-age,event-cut` on the full build (68 features), all 19 pass:

| Test | Result |
| --- | --- |
| `oaScorecardCount` | **155 old-age events** counted by the scorecard's own regex, with the cut on: the 26 from before, the 10 un-retired, and all 119 `oa_` scenes |
| `oaPlayEverything` | 9 old lives: a family (spouse, three children, five grandchildren and a great-grandchild), a widowed serf, a noble at court, a ruler with a child heir, an elf, a dwarf, an orc, a merchant and a priest. Each is played from 26 for 12 years, then aged, with its memories aged with it. **114 of 114 rolled scenes drawn, in 595 drawings with every choice taken: 0 errors, 0 raw tokens, 0 texts over 80 words** (counted after 67's weave and 54's sayings) |
| `oaChains` | The contract comes back 5 years later with the same child named in the text. The will (a third to the altar) comes back with the person who saw it, and the death screen names it. The corrody costs coin and has its sequel. The late love leads to the family's council about the same person. The blade leaves your hands, goes to the heir, and is on the death screen |
| `oaDeathbed` | Death odds at 66 are 5.8%: no deathbed. At 72 they are 17.4%: one deathbed scheduled after two year-turns, not two. Kind last words reach the death screen |
| `oaFireRate` | 6 lives aged to 55 and played on, 64 years in all: **67 distinct old-age scenes met (10.5 a decade), 47 different ones**. This counts each scene once per life, from `p.flags.ev`, so it is a floor |
| `oaRenderPure` | An old-age scene, every tab, and the epilogue drawn twice: the random stream and the state are untouched, and the epilogue is the same both times |
| `oaOldSave` | A save with no `pc.oa` and no `oa_` flags loads, the death screen draws, it plays 2 years, and the first will creates the field |
| `oaUnretired` | 10 of 10 back in the roll, 6 of 6 sampled weak ones still retired, 826 retired in all |
| 58-event-cut's 7 tests | pass: 826 retired (25.9% of the release), none written by a feature, the roll never picks a retired event, queued retired events still show, the classic setting, pool floors (least kept 61%) |
| core suites | boot, lives (6 lives, 0 unfilled tokens), saveRoundTrip, uiSmoke: pass |

`node tools/lint-events.mjs --feature=old-age`: 119 events, **0 errors**. The linter's own play-test characters cannot be old (a start age is capped at adult + 10), so `oaPlayEverything` plays every scene instead. `node tools/lint-choices.mjs --feature=old-age`: **0 obviously best** (36 compared by numbers, 0 unreadable).

`node features/74-old-age/bench.mjs <build> --lives=16`: bot lives (`bench/bot.mjs`, personalities × engaged/passive), human and orc starts from 26 until death or 90. It counts every event met from 55 on:

BENCH_TABLE

**Memory share.** The bot's static memory index (`B.memoryIndex`) counts MEM_OA of the 119 scenes as memory events (a `C.flag` set by another event, an arc mark, or `p.flags.ev`). The build's share is MEM_SHARE, against MEM_BEFORE without this feature. Most of the scenes read memory the index cannot see: 67's record, 55's lines, `pc.deeds`, the dead among your people, 57's record. 67-memory-weave's runtime measure is the one that counts those.

## Rules kept

- **Deterministic.** The core draws nothing in a setup. People, lines, deeds and entries are picked by an FNV hash of the event, the person and the year. The only draws are engine-side: the day a sequel or the deathbed is scheduled.
- **Render-pure.** The epilogue lines read flags and `pc.oa` only. `oaRenderPure` checks the random stream and the state.
- **Sources intact.** Each `cond` uses the `C.*` helpers, so `A.CX_RX` classifies it (`C.noble(`, `C.ruler(`, `C.poor(`, `C.job(`, `C.soldier(`). The texts avoid the tavern and street classifiers except where the scene is in one.
- **Escaped.** Names and deeds are stripped of `< > " { }` before they become tokens; the engine escapes the view.
- **Old saves.** `pc.oa` is optional and rebuilt when missing or malformed. Flags are plain years.
- **No patches.** One wrapper on `A.applyFx` for `fx.oa`, one on `A.epilogue`, one `A.onYear` hook, new helpers on `A.C`.
- **Voice.** Second person, present tense, period detail: the retirement contract and the corrody, the manor court and the boundary stones, beating the bounds, the dole for the poor, the shroud kept in the chest. Church words are kept to those the release already uses (temple, priest, prayers, shrine, abbey).

## Limits

- **Balance.** Not run here, as the brief asked. Expect the death-age bands to move. Old age now brings about 13 scenes a decade instead of 1, and their health effects add up to −120 against +75 over all 445 outcomes. That is after I halved them, because a first bench (16 lives, seed 7401) put deaths of sickness at 54 to 57 in four lives, against one without the feature. The second, larger bench is in the table above. The coordinator's `bench/balance.mjs` run should check the death-age bands (`bench/targets.mjs`). Coin moves are mostly `coinPct` (−3% to −25% for a will, a corrody or a well; +5% to +20% for selling up).
- **Check odds for the old are low.** The median shown odds on an `oa_` check in bot lives is ODDS_MED%, and ODDS_FLOOR% sit at the 4% floor: an old peasant's persuasion or trade is weak, and 49's fading stats pull wits and strength down. I kept the house difficulty (40 to 55) and put a stat (`wil`, `ins`, `sta`) beside each skill, but a playtest should say whether the old want easier checks.
- **Family scenes need a family.** In these bot lives few characters married or had children. Grandchildren, the contract, the heir and the old couple therefore fire for real players far more than for bots, and a third of the scenes are written for lives without kin: the corrody, who will look after you, the young neighbours, the last sibling, the funerals.
- **The deathbed is a scene, not a death.** It comes when the odds are high, and the player may live on. Death still comes from the engine's roll, and the scene may never have been shown.
- **58's header and `RETIRED.md` are stale.** They still say 836 and list the ten events I put back. `select.mjs` would put them back on the list if re-run; it needs a veto list, or these ten taken out of its candidates.
- **The writing wants a human pass.** I wrote 119 scenes in one sitting. The frames repeat in places ("You were {oaAge} that year"), and 67's weave adds its own line under most scenes, so a long old age reads a lot of "In 1090 you tried…". A writer should read a 30-year old age end to end.
- **`C.ambition` is dead.** The release's ambitions are deleted on load (`A.migrateV10`), so "Not done yet" is gated on low renown instead.
