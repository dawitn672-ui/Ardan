# The world and its disasters

**Aspect:** Events (Road to Ten, Events 3 and 4) · **Kind:** 13 story arcs (55 trigger-only scenes) on the story track of `46-life-arcs`, three effect keys, no patches

The plan asks for "60 long arcs of 3 to 8 stages over 2 to 20 years: a blood feud, a secret child, a rival's rise, a famous sword's history, a plague year, an apprentice who passes you" (Events 3), each ending with "a lasting change: a title, a bond, a wound, a law, or a province on the map" (Events 4). This folder writes the thirteen arcs about the world and what it does to you. The kin, rival and things arcs are in folders 50, 51 and 53.

**What it does.** Thirteen stories, each a run of scenes over two to eleven years. Every choice leaves a mark that the later scenes read. The marks change what a scene says and which choices it offers. Every last scene's choices each leave something that lasts.

| Arc | Scenes, years | Who meets it | What the ending can leave |
| --- | --- | --- | --- |
| **The plague year** | 5, 2-5 | any adult | a plague orphan as your ward; your name on the plague chapel; physic learned from the friars; the stoic's silence. The fourth scene takes 15% of your home province's people off the map. |
| **The hungry year** | 4, 3-6 | where `45-economy` is built, only after a poor or failed harvest in your realm (`A.mkt(realm).hv`); otherwise country folk | a dead family's plot (a cottage); the parish granary (a deed and a law the parish keeps); a pit of grain under the hearth (cautious); a new home in the capital, where a serf who stays a year and a day is free |
| **The river rises** | 3, 2-5 | anyone not on desert, mountain or tundra | the great dyke (+1 development on your home province); a move uphill to the highest neighbouring province; the silt farm you claimed; a mark on the doorpost (stubborn) |
| **The fire** | 4, 2-5 | a home town of 3,000 or more | a stone house with your mark on the lintel; the town's fire watch and the name *the Firewarden*; a bribed surveyor (deceitful); a fresh start in the capital |
| **The road from the war** | 4, 3-7 | a realm next to yours is at war (`A.atWar`) | the woman from the road, of the warring realm's people, as a sworn bond; land rights for the refugees' lane (a deed, and +1 development on your home province); their tongue and trade (curious); their enemy (proud) |
| **The Hawk** | 5, 2-7 | country folk | *Hawksbane* and the deed of the tower; the tower's fields; the Hawk's silver (deceitful); the toll-free bridge |
| **The siege** | 5, 2-6 | your realm is at war and your home is yours | new walls (+1 fortification on your home province); the name *the Wall*; a move away (paranoid); a friend among the enemy |
| **The long winter** | 4, 2-5 | anyone not in the desert and not a lord, from the first snow (October to December) | a rent-free cottage from the crown; the messenger sworn as a friend; the truth told (a deed); two winters' wood stacked every autumn (diligent) |
| **The wolf years** | 4, 2-5 | country folk in forest, hills, mountains, tundra or steppe | *Wolfsbane*; the miller's friendship; a ruined knee; a fear of the wood (cautious) |
| **The fall at the pit** | 3, 2-4 | miners, and anyone in mountains or hills | the widows paid and the deed for it; the owner's enmity; his money (greedy); the miners' burial club |
| **The wreck** | 4, 2-6 | coastal homes | the beacon on the headland; the shipwrecked mate sworn as a brother; a fishing boat; the false light (cruel) |
| **The pilgrimage** | 4, 2-3 | the pious (20+) or anyone 40 or older; the shrine is the farthest capital of your own faith | *the Palmer*; holy orders (a new career); the company of the road as a friend; what lies behind the grille (cynical) |
| **The heresy** | 6, 4-11 | anyone not a priest | the barn people (zealous, and a friend among them); churchwarden of the old church; the yearly fine (stubborn); the story written down and walled up |

Nobody gets one while ruling, soldiering, in prison or as a child. These are stories of a home, and a soldier lives in camp.

**How it runs.**

- **The story track.** `46-life-arcs` runs one story arc at a time. When none is running, one begins with a chance of 1 in 48 a month, chosen by weight from those whose `start` holds. Each arc here registers with `A.ARCS.story(key, { title, stages, start, w, gap, lasting })`.
- **Scenes and marks.** Each scene is a trigger-only event. Every choice of every scene but the last, on both sides of a check, carries `fx.arc` with a mark; the last scene's choices carry `{ go: 'end' }` and no mark, because no scene comes after to answer one. A mark is kept as the flag `la_aw_<mark>`, and **a later scene of the same arc reads every one of them** — in its text, a choice label, a `req` or a check. For example, the grey wolf of the third scene is "lame where a spear might have gone in" if you speared a wolf in the first. Reads name the mark in full, `M(p, 'aw_wolf_watch')`, so a reader can be found from the setter by searching the file (and so `bench/bot.mjs` can see the link).
- **What an ending leaves.** Each ending leaves something the rest of the game can see: a trait, an epithet, a deed, a wound, an asset, a person, a move, a province changed. Ten endings also set a plain `aw_` flag, and each of those ten is read by the opening scene of another arc: the stone house from the fire is in the flood's first scene, the Hawk's sword is over your hearth when the siege comes, the two winters' woodpile is in the wolf years, the plague chapel in the pilgrimage, the dyke in the wreck, the parish granary in the plague. The other endings set no flag (see Round 8 below).
- **Each stage on its own clock** (`gaps`). A plague moves in months, and its chapel comes years later. So each arc gives the years between each pair of scenes, and `arcs.core.js` sets the next scene's year from them (`0` means next month).
- **Who and where, kept.** A scene's `ctx.rid`, `ctx.pid` and `ctx.shrine` are kept on the arc, so the realm at war, the person met and the shrine are the same in every later scene. The siege names the realm you are really at war with, and the refugees come from the neighbour that is really at war.
- **Three effect keys** (declared in `A.FX_EXTRA`):
  - `awWho` makes a person tied to you and keeps them on the arc. Examples are the refugee, of the warring realm's culture, race and faith; the shipwrecked mate, from a far coastal realm; and the plague orphan, a child.
  - `awMove` moves your home within your realm: to the capital, to the next town if you live in the capital, or to the highest neighbouring province. With `free`, a serf who stays in the city is freed.
  - `awProv` changes your home province on the map: its people (`pop`), its development (`dev`, at most 9) and its walls (`fort`, at most 5).

**Round 8: read it or drop it.** The scorecard counts a flag an orphan when something sets it and no event's `cond`, `setup`, `text` or choices reads it. These scenes set the largest block of them in the game. Measured with the brief's script on `--only=arcs-world`:

| | before | after |
| --- | --- | --- |
| orphan marks and flags set by `aw_` events | **275** | **0** |
| of which arc marks (`la_aw_*`) | 224 | 0 |
| of which plain ending flags (`aw_*`) | 51 | 0 |
| memory events in the build / share of all events | 123 / 3.8% | 172 / 5.3% |

The 275 were resolved four ways. The split by arc is in the table below; the totals are 175 read and 100 dropped.

1. **104 marks were already read, in words, and the counter could not see it.** The helper was `M = (p, m) => p.flags['la_aw_' + m]`, so a scene that read the mark `aw_wolf_watch` wrote `M(p, 'wolf_watch')`: correct at run time, and invisible to any reader, human or script, searching for the name the `fx` sets. The helper now takes the mark in full (`la_` + m, as in 46-life-arcs) and all 172 read sites name it in full. The 18 `any(p, 'a', 'b')` sites became `M(p, 'a') || M(p, 'b')` for the same reason: only `M(p, …)` is a form the index knows. **No text changed**; the callbacks that were always there are now legible.
2. **65 mid-arc marks are now read by a later scene of the same arc.** These were the choices the writers marked and never answered: you watched the flock instead of digging a pit, you paid the wall tax instead of carrying stone, you told the canon lawyer you knew nothing. Each callback is one clause grafted onto a scene that already exists, and almost all of them extend a chain of mutually exclusive clauses that was already there, so only one ever renders and no scene grew by more than a clause. Longest rendered scene is still under the 80-word diet (`lint-events` passes with 385 scenes checked in the browser).
3. **100 were dropped.** 55 of them were the last scene's `END('x')` marks: each duplicated the plain flag set in the same `fx`, and the arc is over, so nothing could ever answer it. The last scene's choices now carry `{ go: 'end' }` and no mark. The other 45 were ending flags. An ending has no later stage, so the brief's first option does not exist for it, and the lasting thing an ending leaves is already a trait, an epithet, a deed, a wound, an asset, a person, a move or a province on the map — the flag was a second copy of that record which nothing read. Two endings whose only record *was* the flag now leave a deed instead (the lane's land rights, which also raise the province's development; and the truth told to the crown's rider), which the life story shows and a flag never did.
4. **10 ending flags were kept, because another arc reads them.** Four already were (the stone house in the flood, the Hawk's sword in the siege, the grain under the hearth in the long winter, the grille in the heresy). Six more follow that pattern: the parish granary is no use against the plague, the doorpost mark against the fire, the paid walls against the Hawk's tower, the woodpile against the wolves, the raised dyke against the sea, the plague chapel against the pilgrim road. Each is one clause at the head of a chain in another arc's first scene, so it costs no words when it does not fire.

| Arc | marks set before / after | of those, already read / newly read | ending flags before / after |
| --- | --- | --- | --- |
| plague | 19 / 15 | 10 / 5 | 4 / 1 |
| famine | 16 / 12 | 10 / 2 | 4 / 2 |
| flood | 13 / 9 | 6 / 3 | 4 / 2 |
| fire | 16 / 12 | 9 / 3 | 4 / 1 |
| refugees | 15 / 10 | 5 / 5 | 5 / 0 |
| Hawk | 22 / 17 | 11 / 6 | 5 / 1 |
| siege | 24 / 20 | 11 / 9 | 4 / 1 |
| long winter | 15 / 11 | 6 / 5 | 4 / 1 |
| wolf years | 17 / 12 | 8 / 4 | 5 / 0 |
| pit | 14 / 10 | 7 / 3 | 4 / 0 |
| wreck | 14 / 10 | 3 / 7 | 4 / 0 |
| pilgrimage | 16 / 12 | 6 / 6 | 4 / 1 |
| heresy | 23 / 19 | 12 / 7 | 4 / 0 |
| **all** | **224 / 169** | **104 / 65** | **55 / 10** |

The rule is now a test, in both directions: `worldArcsShape` fails if any scene but the last leaves no mark, if the last leaves one, or if any mark or flag these scenes set is not read back by one of them (`AWT.readFlags()` reads the built source for `M(p, 'x')` and `C.flag(p, 'x')`). A new orphan cannot be added without the test naming it.

**Measured by** (`test.mjs`, on `--only=life-arcs,arcs-world`).

| Test | Result |
| --- | --- |
| `worldArcsShape` | 13 arcs, 55 scenes (average 4.23; plague, Hawk and siege have 5, heresy 6). Years from first scene to last, by the gaps: 2-3 (pilgrimage) up to 4-11 (heresy). Every scene is trigger-only. Every choice of every scene but the last, on both sides of a check, carries `fx.arc` with a mark; no ending choice leaves one. Every ending choice ends the arc with a lasting effect. **Every mark and flag these scenes set is read back by one of them** (`AWT.readFlags()` over the built source). On all 2,793 paths of marks into a scene, the scene offers at least two choices. |
| `worldArcsPlayThrough` | Each arc is played through `A.ARCS.playThrough` twice, once always taking the first choice offered and once the last. All 26 runs complete, and no scene is dropped, shows a raw `{token}`, runs over 80 words or has a label over 12 words. Later scenes differ between the two paths in every arc: 41 of the 42 later scenes (the wolf years 2 of 3, every other arc all of them). Each run leaves one mark per scene before the last and none on the last, and the two paths end apart: the Hawk's sword over the hearth against a night behind a barred door, the siege's new walls against a day in the crypt. |
| `worldArcsStartFromWorld` | The wreck comes on the coast and not inland. The fire comes in a town of 3,000 and not a village. At peace, neither the siege nor the refugees start; once the realm is at war with a neighbour, both do. With `45-economy`, the hungry year comes after a failed harvest (0.4) and not an ordinary one; without it, to country folk. The long winter starts in November, not May. A ruler, a soldier, a prisoner and a child of 9 can start none of the 13. |
| `worldArcsChangeTheWorld` | The plague takes 15% of the home province's people; that run took 4 years and left a ward aged 8. The siege names the same real enemy in every scene, and its walls raise the province's fortification by 1. The flood moves you to the higher neighbouring province. The woman from the road is of the warring realm's culture: she is named in 3 later scenes and sworn as godparent at the end. A serf who walks to the capital in the hungry year and stays is free. |
| `worldArcsInBotLives` (`--only=life-arcs,arcs-world`) | 24 bot lives over all six starts, 10 of them 40 years or longer, and all 10 met these arcs. 75 arcs started, 322 scenes were played, 72 arcs finished, none were given up, and all 13 arcs appeared. A royal life of 58 years ran *hungry year, Hawk, long winter, plague, heresy, pilgrimage, wreck* and part of *flood*. |
| `worldArcsInBotLives` (full build) | The track is shared with 50, 51 and 53. These arcs hold 29% of its weight but got 16 of 61 story starts (26%), because they shut out rulers and soldiers and some wait for war, coast or harvest. Over 24 lives (9 of 40+ years, 7 of those meeting one of these arcs): 16 started, 57 scenes played, 14 finished, none given up, 7 different arcs. In a full build the test asks for the share's bar (6 started, 3 finished, 4 kinds); when these are the only story arcs, it asks for the higher bar. An earlier full build, before other features changed, gave 12 of 69 starts and 9 finished. |

A fuzz outside the test played 520 random paths: 13 arcs by 40 lives, five statuses, four realms, savings from 0 to 900 and with or without letters. It found no dropped scene and no raw token. The longest scene ran 75 words. Only in a one-province realm did a scene offer just one choice (see Limits).

`tools/lint-events.mjs --feature=arcs-world`: 55 events, 385 checked in the browser, 0 errors, 0 warnings. `tools/lint-choices.mjs --feature=arcs-world`: 0 obviously best of 55, with 11 compared by numbers. The rest differ in what they leave (a trait, a person, a check against a sure thing), which the checker does not compare. A rerun of the checker's arithmetic that ignores those differences flags only the siege's "Wear your scars", whose rival choices leave walls, a move or a friend instead. `tests/run.mjs --features=arcs-world` on the private build: all 9 pass (boot, lives, saveRoundTrip, uiSmoke and the five above).

Balance (`bench/balance.mjs`) was not run here: the coordinator runs it once on the integrated build. These arcs move coin (up to -40% in the siege's sack, +80 from a strongbox), fame (+2 to +6, and epithets) and health (down to -22, plus wounds), about three to five times in a life when they are the only story arcs.

**Rules kept.**

- Everything random (the start roll, the gaps, the new person's name and age) is drawn in the month hook or in the effect.
- Setups and texts only read. They pick kin, the realm at war and the shrine from state, deterministically.
- The kept context and the new person live on `pc.arcs[key]`, which `46-life-arcs` already tolerates missing in old saves.
- Every token a scene uses has a fallback ("the border country", "the enemy", "the boy who carries your water"), so no scene is dropped for an unfilled token.
- No patches. The events sit in a block scope, because the event packs share one script scope (`const M` is also `46-life-arcs`'s).

**Limits.**

- **The world starts the story, then the story is written.** The start reads the real harvest, the real wars, the coast and the town. After that, the plague takes people from the province, the dyke raises its development and the new walls its fortification. But the siege of the story is not the simulation's siege (`P.sgBy`), the hungry year does not move grain prices in `45-economy`, and no neighbour dies of the plague.
- **The scenes are written, not generated.** A second life meets the same thirteen stories, though it can take them another way. There are 2 to 4 choices per scene, with marks that carry: 2,793 distinct paths of marks reach some scene.
- **Rulers and soldiers get none of these.** Their lives run elsewhere (the realm, the camp).
- **One-province realms.** In a realm of a single province (POL-04 in the fuzz below), a move has nowhere to go. There the fire's "sold your plot" path ends with one choice, the fire watch. So does the siege for a penniless, unwounded serf: the friend among the enemy.
- **Memory counting.** The bot's memory index (`bench/bot.mjs`) counts a flag read in `cond`, `setup`, text or a choice as memory, and it does see an arc mark read as `M(p, 'aw_x')`. Since Round 8 it sees all of these, because the read sites name the mark as the setter writes it (before, `M(p, 'wolf_watch')` read a mark the `fx` called `aw_wolf_watch`, and 104 real reads were invisible). 46-life-arcs' own marks are a separate matter: its marks carry no feature prefix, so its reads were always legible.
- **Writing quality is a judgement.** The scenes keep the word and choice limits and the voice rules, but whether a player would retell them needs a playtest.
