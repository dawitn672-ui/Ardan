# Things that outlast you

**Aspect:** Events and story (Road to Ten, Events 3 and 4) · **Kind:** 13 story arcs, 57 events, a small core (registration, an arc's person and words, five effects), no patches

The plan asks for "60 long arcs of 3 to 8 stages over 2 to 20 years: a blood feud, a secret child, a rival's rise, a famous sword's history, a plague year, an apprentice who passes you", each ending with "a lasting change: a title, a bond, a wound, a law, or a province on the map." Four folders write those arcs on the story track of `46-life-arcs`. This one writes the thirteen about **objects, places and mysteries**.

Nothing in them is magic. The cursed mill has a steward behind it. The relic has a forger. The face in the portrait has a grandmother.

**What it does.** Each arc is a run of trigger-only scenes, one to five years apart. Every choice, on both sides of a check, carries `fx.arc`, and every choice before the last stage leaves a mark that a later stage of the same arc answers: its text changes, and so do the choices it offers and who comes back. The last stage leaves no mark, because nothing comes after it to answer one; it leaves something the life keeps instead.

| Arc | Stages, years | What happens | What it leaves |
| --- | --- | --- | --- |
| **Kestrel** | 6, 10–20 | A sword with a song turns up in a pawnshop. You buy it, or a lord's steward does. The captain's grandchild wants it back, and a monk's chronicle says the song is a lie. A knight wants to buy it, and a levy at the ford decides who carries it. Who holds the sword is read from the marks in order, and it changes hands up to four times. | **name**: masterwork sword and the epithet *Kestrel*; or it goes back to the Marroks (a friend for life); or your verse in the song; or a smith's copy |
| The old map | 4, 3–9 | A map sewn into a coat. The split oak is gone, and a farmer's hedge stands on the cross. In the lead box there is no gold, only a charter to your great-grandmother. | **home**: the field (a farm) won in court, or an enemy if you lose; the charter given to the farmer; or sold to the lord to burn |
| The burnt tower | 4, 3–9 | Frost opens a vault under the ruin. The bones were barred in: the village burned its lord in the hungry year, and one torch-bearer was your great-grandfather. Then the last of the house comes asking. | **home**: a house built from its stone; or a stone with the names; or the stone sold; or the hill given to the heir |
| The finger in the silver box | 5, 4–12 | A dead pilgrim's relic. A fever breaks and pilgrims come. A friar brings the same finger from another abbey, and the maker's mark leads to a forger in the capital. | **law** (standing): *honest* for naming it false before the parish; *cynical* for keeping the shrine; or buried with the pilgrim |
| The cursed mill | 5, 4–8 | Three millers in ten years, and a wheel that turns at night. Ghosts do not need carts: a steward grinds untithed grain there. A drowned miller's kin, a fire in the loft, the assize. | **trait**: *honest* and the mill; *brave* and a hanged steward, or an enemy who walked free; *deceitful* and his silver |
| The stolen horse | 4, 3–6 | Your own mount, read from your gear, goes from the stall. At the fair you find the thief: an unpaid soldier with three children. | **bond**: the thief as your groom, or a friend riding your horse; or the thief hanged (he dies) or begged off the rope |
| The face in the gallery | 4, 6–15 | Your face on a great house's wall. Your grandmother was struck out of the family book. Then the cold room and the lawyer. The house is a real house of your realm, and its head is the real head when the world has one. | **bond**: written into the family book (a cousin); silence sold; the secret kept; or your own name, *proud* |
| The Patience | 5, 4–12 | A share in a cog that never comes back. A man from the capital buys the shares cheap. A drunk sailor tells the truth, and a southern port holds the *Fortune*. | **wealth**: a finder's part, or the thieving master's house; or his purse (*greedy*); or his name spat on every quay (an enemy) |
| A song about you | 3, 2–4 | A minstrel's song about the loudest thing these arcs left in your life: the sword, the mill fire, the bridge, the false relic, the horse thief, the ship, the bell or the burnt tower. Failing those, a soldier's muster or a goose. | **name**: the song's epithet (*Kestrel-Hand*, *Millfire*, *Goose-Runner*…); fame in the capital; the song bought and silenced (*proud*); the minstrel as a friend |
| The pot of old silver | 4, 3–6 | Treasure in the ground is the crown's. You report it, or you don't. A reeve skims the count, a moneychanger asks questions, and a neighbour wants a third. | **wealth**: a farm bought openly; silver buried for your heirs; a tithe (*generous*); or one coin on a cord |
| The book in the common tongue | 4, 3–9 | A fleeing friar leaves scripture in the common speech, the kind the bishop burns. Readers come by night, and then the searchers with hooks. | **trait**: you learn letters and teach children (*zealous*); send it on (*brave*); keep it (*patient*); or say it aloud in the market |
| The bell of your parish | 4, 3–6 | The bell cracks at a wedding. The founder skims the bronze, and three nights after the new bell is hung, the thatch burns. | **name**: your name on the rim (*the Bell-Ringer*); your mother's; or the saint's |
| The bridge | 5, 8–16 | The ford drowns a carter, and a mason from the south comes. The spring flood hits the centring, and a toll board goes up. | **law**: free passage cut in the keystone; your name on it (*the Bridgewright*); the carter's; or an inn at the bridgehead |

Wounds come along the way, and the permanent ones last: a scar on the sword arm at the ford, burn scars at the mill, a broken nose at the fair, two fingers on the bridge ropes.

**How it runs.**

- **The track.** One story arc runs at a time, shared with the other arc folders (50–52). The engine in `46-life-arcs` starts one about every four years of a life without one, and paces the stages.
- **Who can meet them.** `start` excludes rulers from eleven of the thirteen (all but the relic and the song), giants from the horse, and lives with no other house in their realm from the portrait. The ship needs a coast, money, or a trade on the water. Everything else is open to every grown life, serfs included.
- **People come back.** `A.AO.who` makes the arc's person once (the grandson, the farmer, the thief, the minstrel, the founder, the mason) and keeps their id on the arc. Later stages meet the same person. If they have died, the stage drops and the engine gives the arc up.
- **Words come back.** `A.AO.word` keeps the arc's other names (your great-grandmother's, the house, the stolen horse, the song's subject), so they stay the same from one stage to the next.
- **Lords and commoners.** Texts and labels change for nobles ("your own steward", "petition your liege"). Choices that cost money always sit beside one that doesn't: a penniless, unlettered life has at least two choices at every stage.
- **Memory across arcs.** The song reads the endings of eight other arcs. The chain that reads them sits in `ao_song_1`'s own setup, in the stage that chooses the subject, so what the song remembers is plain in the event that remembers it. Every ending also sets an `ao_*` flag for later events.
- **Read it or drop it.** A mark exists to be answered. Of the 206 marks these arcs used to set, 156 are read by a later stage of the same arc and 50 were dropped; `test.mjs` fails the feature if a mark is set that no later stage reads, or if a last stage sets one at all.
- **New effects** (declared in `A.FX_EXTRA`):
  - `aoQual` sets the quality of gear just given; `fx.gear` sets only the item.
  - `aoAsset` adds a property with its own name, such as "The mill below Amberwick", priced and paid as its `GD.PROPERTY` kind. A new kind would have shown up in the property shop.
  - `aoKill` kills the arc's person.
  - `aoMount` gives back or gives away the stolen horse.
  - `aoEpithet` gives the epithet the song chose.

**Measured by** (`test.mjs`, on `--only=life-arcs,arcs-things`).

| Test | Result |
| --- | --- |
| `aoArcsRegistered` | 13 arcs and 57 stages, 4.4 an arc. Five arcs have 5 or more stages (sword 6; relic, mill, ship and bridge 5). Each spans between 2 and 20 years by its gap. Every stage is trigger-only with 2 to 4 choices. Every choice, on both sides of a check, carries `fx.arc`, with an `ao_` mark everywhere but the last stage. **Every mark is read by a later stage of the same arc** (`M(p, 'mark')` in its `cond`, `setup`, `text` or choices), and no last stage sets one. Only the last stage ends the arc, and every one of its choices carries a lasting key. |
| `aoArcsPlayThrough` | Each arc is played through with `A.ARCS.playThrough` twice: first choice with every check won, then last choice with every check lost. All 26 runs complete. The later scenes, compared as written before names are filled, differ by path in 13 of 13. The last scene changes what the life keeps on both paths in 13 of 13. There are no raw tokens and no scene over 80 words. The same person returns from stage to stage. A penniless, unlettered life also completes every arc, with 2 or more choices at every stage. Kestrel, first path: *bought → gave → truth → bid → blooded*, over 13 years, ending in wearing it. Last path: *told → out → toldkin → letgo → home*, ending in a smith's copy. |
| `aoArcsEveryBranch` | 520 random play-throughs (40 an arc, across artisan, noble, serf and merchant lives, rich and poor, lettered or not). All 520 complete. The longest scene is 77 words, with no raw tokens and no stage with fewer than 2 choices. Endings reached per arc: 3 to 4, counted by the choice taken at the last stage, since the last stage leaves no mark. Marks seen per arc: 6 (song) to 20 (sword). |
| `aoEffects` | A named property ("The mill below Brookcliff", a workshop), a masterwork sword, a hanged thief, a palfrey brought back, the song's epithet. |
| `aoArcsOpen` | Peasant, serf, artisan, dwarf and orc lives: 12 of 13 open (all but the ship). Merchant, noble and elf gentry: 13 of 13. |
| `aoBotLives` | Bot lives over the six starts (the balance league's), two personalities, until ten have lasted 40 years: 21 lives. 16 of them began at least one of these arcs, and so did all 10 of the 40-year lives. 54 arcs begun, 215 scenes played, 42 arcs finished, 1 given up: the portrait, at its last stage. In these arcs a stage drops only when the person it needs has died. 11 of the 13 arcs came up; the ship and the bell did not. A 46-year serf ran *map, Kestrel, hoard* and was partway through *bridge* when the run stopped. A 44-year artisan ran *relic, mill, Kestrel, horse*. |

**In the full build** (all 52 features, with the other story arcs of 50–52 on the same track), the same test on its first run gave 24 lives, only 8 of them of 40 years: lives end younger in the full world, so the test now plays up to 36. Of those 24, 16 began one of these arcs and so did all 8 of the 40-year lives. 29 arcs begun, 22 finished, and 12 of the 13 came up, between the others' arcs (*+N other* in the detail). On a fresh full build after that change it passes: 18 lives, 10 of them of 40 years. 13 lives began one of these arcs, and so did 9 of the 10 forty-year lives. 24 arcs begun, 92 scenes played, 19 finished, 1 given up, and 12 of the 13 came up. A forty-year life there meets about two of these arcs beside two or three from the other folders.

`bench/balance.mjs` on the full build with this feature (12 lives a path): every band holds. Median peak wealth is serf 5,496, peasant 14,796, artisan 170,877, merchant 290,052, noble 211,798 and royal 70,540. Check win rate 42.5%, 12 arc types, 0 page errors.

`tools/lint-events.mjs`: 57 events, 399 renders across the linter's 8 characters, 0 errors, 0 warnings. `tools/lint-choices.mjs`: 0 obviously best of the 23 events compared by numbers. The other 34 differ in what they leave (deeds, traits, gear, a property), so the checker does not compare them.

**Read it or drop it: the orphan marks, measured.** `bench/bot.mjs`'s `memoryIndex` calls a flag an orphan when something sets it and no event's `cond`, `setup`, `text` or choices read it. Counting the flags whose setters are `ao_*` events, on a `--only=life-arcs,arcs-things` build:

| | before | after |
| --- | --- | --- |
| orphan flags set by `ao_*` events | 256, across 57 events | 42, across 13 events |
| of those, arc marks (`fx.arc {mark}`) | 206 | **0** |
| of those, the last stages' ending flags | 50 | 42 |
| memory events in the build / `memPct` | 143 / 4.3% | 188 / 5.7% |

The marks, 206 of them, split three ways.

- **89 were already answered and nobody could see it.** The helper in `arcs.events.js` took a short name and added the prefix itself: `M(p, 'sw_truth')` read the flag `la_ao_sw_truth`. A reader of the file could not match the string to the mark, and neither could the index. `M` now takes the whole mark name — `M(p, 'ao_sw_truth')` — and adds only `la_`, so the mark a scene answers is the mark it names. That alone is 151 call sites and no change to what the game does.
- **67 were answered for the first time**, one clause each, in a scene that already existed: how the sword came to you, which way the drove road pointed, whether the lock came off the sluice, who went down the stair with a lamp, whether you laughed at the verse. These are the choices a player would remember making, and the writers had marked them and then written no answer. Each callback is one branch of a chain, so only one of them renders; the longest scene in the branch test went from 70 words to 77, under the 80-word diet.
- **50 were dropped**, which is every mark set by an arc's last stage. Nothing comes after a last stage to answer one, so those marks could never be anything but dead weight; the ending they recorded is already in the `flag:` and the lasting effect beside them. `test.mjs` now fails the feature if a last stage sets a mark, or if any other stage sets one that no later stage reads, so neither can come back.

Nothing was renamed to dodge the analyzer and no reader was added that a play-through cannot reach: `aoArcsEveryBranch` takes all 520 random paths and `aoBotLives` plays 54 of these arcs in bot lives.

The 42 that remain are not marks. They are the `ao_<arc>_<ending>` flags the last stages set, one per ending, 50 in all. The song reads 8 of them, and that chain now sits in `ao_song_1`'s own setup rather than in a shared helper, so the index sees it where the choosing happens; the remaining 42 are hooks for events outside this folder that nobody has written yet. See the limit below.

**Rules kept.**

- Everything random is drawn in a stage's setup or its effects, on the engine side: the arc's person, the house, the great-grandmother's name, gaps between stages.
- The feature draws nothing on screen.
- Arc state (`pc.arcs[k].pid`, `.w`) is new and optional, so a save without it loads.
- Stored words are plain names, so `SAVES.clean` leaves them alone.
- The event pack is a block of its own, since packs share one script scope.

**Limits.**

- **Written, not generated.** Each arc has 3 to 4 endings and 6 to 20 marks, every one of them answered somewhere later in the arc. A second life can meet the same arc and take it another way, but the arc will be the same.
- **Not a province on the map.** The lasting changes are a holding (a farm, a cottage, a mill, a house, an inn), a trait, an epithet, a bond, a wound, gear, or a standing flag. None of them moves a border.
- **The ending flags are still orphans.** Each last stage sets one `ao_<arc>_<ending>` flag, 50 of them. The song reads 8. The other 42 are hooks for events nobody has written yet, so `bench/bot.mjs` counts them as orphan flags. They are not arc marks and this round left them alone; either something outside this folder comes to read them, or each arc should set one flag instead of one per ending. That is a call for a person to make, not a sed.
- **The story track is shared.** In the full build these thirteen compete with about forty other story arcs, so a single life meets a few of them, not most.
- **Writing quality needs a reader.** The tests check shape, length, branching and consequence. Whether players retell these stories (the plan's "done when") needs playtesters.
