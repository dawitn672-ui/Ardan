# Memory weave: choices leave memories, and later scenes answer to them

**Aspect:** Events and story (Road to Ten, Events 2) · **Kind:** system (two core files), no events, no patches, tests, and a bench script (`bench.mjs`)

The plan asks: "Add memories. Any choice can leave a memory (who, what, when), and any event can need or react to one. Target: 40% of events in a life refer to an earlier memory." Done when: "in a 60-year bot life, 40% or more of events tie to earlier memories".

Before this feature, about 9% of the events a bot life sees read a memory. These come from the 40-memory packs, the life arcs, `{past}` and `{history}`. The other 91% play the same whatever the life has been. The fired-event histogram (24 lives, 4,949 events) shows where the room is:

- 37.5% of fired events are a scene the player has already seen in this life;
- 51% are about a person (`ctx.pid`), and 26% about someone the player already shares history with;
- 69% have a check.

## What it does

### 1. The record (`a-record.core.js`)

Every event choice the player makes leaves one memory line in `pc.mw.m`.

- **Written from what the choice did,** not from its `fx`, because `fx` can be functions and checks branch. A wrapper on `A.eventChoose` takes a snapshot of the player before and after the choice and compares:
  - coin;
  - health and wounds;
  - prison;
  - renown, honour and piety;
  - the opinion of whoever the scene is about;
  - new people met.
- **Each line holds:**
  - the year, the event and the choice;
  - the check's skill and whether it was won;
  - the person;
  - the kind of scene: tavern, market, road, law, temple, court, war, work, sea, wild, field, sick or kin. This is read once from the event's title and text;
  - what the choice did: `kind`, `wrong`, `hurt`, `loss`, `gain`, `law`, `name`, `shame`, `kill` or `met`, with the coin moved;
  - the deed in the past tense, for example "you tried to argue the price down, and failed". This uses 55-bonds' verb table. A label with two verbs stays as written after "you chose to". A deed too thin to say anything ("you did it", "you gave it everything") is not kept.
- **What is kept:**
  - 90 lines a life, with the weakest of the oldest dropped first;
  - for each of up to 400 events, the last choice taken (`pc.mw.last`).

  In the test, a line takes about 220 bytes.

### 2. The weave (`b-weave.core.js`)

Every event's setup asks the record for one memory that bears on the scene. The four rules are tried in order:

| Rule | When | The scene changes |
| --- | --- | --- |
| **person** | The scene is about someone you did right or wrong by, from the record or from 55-bonds' weighed lines of 6 or more. | A line names who, the year and the deed: "Ingram has not let 1122 go: you let your work answer for you. It counts against you now." Every check in the scene moves **±6** (a kindness or a wrong). |
| **again** | The same scene came before. | "You know this from 1139, when you tried to run them off with knives, and failed, and came away hurt." The choice taken then reads "(as in 1139)". If it was a check, it is **+6** for having won it and **+3** for having lost it. |
| **skill** | A check here tests the same skill or stat as one you won or lost before. A scene of the same kind is tried first. | "A lance let you down in 1121: you tried to aim for the shield, and failed. The doubt is still there." That check moves **+5 / −5**. |
| **place** | None of the above, but something happened to you in this kind of place: a tavern, market, the watch, temple, court, soldiers or the sea. | "You have not been easy at market since 1121, when you tried to buy it yourself, and it cost you 480 suns." Text only. |

How the line is placed and shown:

- **Placement.** The line goes into the scene's text, before a closing question if the text ends with one.
- **Length.** A short form is used if the long one would take the scene past 80 words. If neither fits, or the text already cites a year (another memory or the world record is speaking), the weave is dropped, and so are its odds.
- **Wording.** Three wordings per rule and sign, picked by a hash of the event and the year.
- **Repeats.** A memory line can be cited at most 3 times.
- **Odds.** The odds shown are the odds rolled, through a wrapper on `A.checkOdds` keyed to the scene.

## Measured by

`node features/67-memory-weave/bench.mjs <built.html> --lives=32`: bot lives up to 60 years, with the starts × personalities × engaged/passive mix of `bench/run.mjs`. The *tied* measure redraws every fired event a second time with the player's memories taken away, from the same ctx and the same random state. The memories removed are `pc.mw`, every flag some event sets, `p.flags.ev`, arc marks, and every bond's history lines. The event is *changed* if its text, a label or a choice's odds differ, or if it would not render. It is *gated* if its cond is true only with the memories. Everything the second drawing touches is restored.

| Full build, 32 lives | Before (`--without=memory-weave`) | After, seeds 4001 | After, seeds 9001 |
| --- | --- | --- | --- |
| Lives / years / fired events | 32 / 1,299 / 6,175 | 32 / 1,630 / 8,538 | 32 / 1,338 / 6,287 ¹ |
| **(a) Bot's `memoryIndex` share of fired events** | **9.2%** | **100%** ² | 100% |
| **(b) Tied: changed by a memory, or gated by one** | **9.7%** | **53.8%** | **47.7%** |
| changed by this feature's weave | 0 | 49.5% | 43.0% |
| changed by other features (text functions, tokens) | 8.6% | 3.7% | 3.9% |
| gated by a memory | 1.2% | 1.2% | 1.4% |
| Lives of 40+ years with a tied share ≥ 40% | — | 21 of 24 (lowest 30.1%, median 63%) | — |
| Woven: again / skill / person / place | — | 1,617 / 1,428 / 961 / 219 | — |
| Woven but dropped for length or an existing year | — | 1,240 (963 of them person) | — |
| Rendered scenes over 80 words / raw tokens | 1 / 0 | 1 / 0 | — |

¹ This run used the build just before the last wording fix: lines inherited from a parent are no longer cited as your own deed.

² Every event's setup now reads the record and `p.flags.ev`, so the bot's static index counts every event. It no longer says anything. The runtime share in row (b) is the number to read.

- **Odds versus text.** In the first 400 woven scenes, 126 (31%) also had odds move:
  - person: 84 of 119;
  - skill: 20 of 23;
  - again: 22 of 223, and an *again* also marks the label taken before;
  - place: 0 of 35.

`node tests/run.mjs <built.html> --features=memory-weave`, all 13 pass:

| Test | Result |
| --- | --- |
| `mwRecordsChoices` | No `pc.mw` before. After two choices, two lines: `{"e":"mwt_river","p":"pb4","k":["kind"],"o":11,"d":"you pulled him out","sh":"field"}` and `{"e":"mwt_toll","s":"persuasion","ok":0,"k":["loss"],"n":-40,"sh":"road","d":"you tried to argue the price down, and failed"}`. 439 bytes |
| `mwWeaveOnlyWithMemory` | With no memory, there is no weave and no year in the text. **person**: "Wendel has not let 1105 go: you pulled him out. It counts for you now.", odds 4 → 10. **again**: "It is 1105 over again …" and the label reads "Argue the price down (as in 1105)", odds 4 → 10. After a lost check, 4 → 7. **skill**, with a stranger: "It comes down to talking someone round, as it did in 1105 …", odds 4 → 9 |
| `mwOddsAreTheOddsPlayed` | Bare 4%, shown 10%. A draw just past the bare odds wins |
| `mwReleaseEventsChange` | 40 release scenes with a persuasion check: 39 woven from one won argument and all changed, 1 dropped for length. None over 80 words, no raw tokens |
| `mwRenderPure` | A woven scene on screen, and every tab drawn: random stream and state untouched |
| `mwReplay` | The same seed played twice for 10 years reaches the same world. 53 lines, 25 scenes woven |
| `mwSaves` | 44 lines saved and loaded exactly. An old save without `pc.mw` loads, plays 3 years, and the next choice starts the record |
| `mwInLives` | 3 lives × 12 years, 311 events: 144 woven. None over 80 words, no raw tokens, none citing this year or later |
| `mwSourcesIntact` | 4,134 of 4,134 setups ask the record. The 463 own setups that pick a person still read as such |
| core suites | boot, lives (6 lives, 0 unfilled tokens), saveRoundTrip, uiSmoke: pass. 01-replay's `renderRng`, `replayWithRender` and `journalReplay` pass on this build |

`tools/lint-events.mjs` and `tools/lint-choices.mjs` have nothing of this feature's own to check, since it adds no events. `--feature=bonds` lints clean on this build.

## Rules kept

- **Deterministic.** The record and the weave draw no random number. Wording comes from an FNV hash of the event and the year.
- **Render-pure.** The weave is decided once, in the event's setup, the engine's first drawing, and kept in `ctx.mw`, which is saved with the queued event. Drawing again reads it. Only `A.eventChoose` writes the record and the citation counts.
- **Sources intact.** `e.cond` and `e.text` are untouched, so `A.evAudience` and `A.CX_RX` classify every event as before. The wrapped setup's `toString` puts the event's own setup source first, for the tools and tests that read setups as text.
- **Chained scenes.** A scene queued after another shares its ctx. A weave is keyed to its event id, so it never leaks into the next scene.
- **Escaped.** Stored strings lose `< > " { }`. The view escapes text and labels as before.
- **Old saves.** `pc.mw` is optional and rebuilt empty when it is missing or malformed.
- **No new effect keys, no patches.**

## Limits

- **Balance is untested.** The odds moves (±6 person, +6/+3 again, ±5 skill) change check outcomes for about a third of woven scenes. No `fx` magnitude changed, so `bench/balance.mjs` was not run, as the brief asked. It should be run before release.
- **The wording is mechanical.** Deeds come from choice labels in the past tense. Most read well ("you kept the seal of confession", "you lent the full sum"). Some are flat ("you chose to make something safe and perfect"). With 12 frames, a long life will hear "This has come round before" and "remembers {year}, when" many times. A writer pass on frames and on the 100 most-cited deeds would help, and a playtest should say whether 50% is too much.
- **Text-only weaves.** *place*, and a *person* weave in a scene with no check, only change the text. Each names who, what and when, but changes no choice. In the 400-scene sample, about 73 (18%) changed only the text: 35 *place*, 35 *person* and 3 *skill*. An *again* also marks a label unless the label is longer than 9 words; the rest moved odds.
- **The person rule loses most to length.** 963 *person* weaves were dropped because the scene was already long. 21-npc-initiative's scenes often already cite the past.
- **The bot's static index is saturated** at 100%. `bench/bot.mjs` would need a runtime measure like this bench's to keep telling the story.
- **The record covers the player only,** and is not passed to an heir.
- **Kind of scene is a keyword guess** from title and text. That is why *place* is limited to seven plain kinds.
