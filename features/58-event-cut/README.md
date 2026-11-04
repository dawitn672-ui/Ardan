# Fewer, deeper events

**Aspect:** Events and story (Road to Ten, Events 1) and the game's identity (Uniqueness 5) · **Kind:** system, a data list of 836 event ids, 2 patches, a bench (`bench/event-audit.mjs`)

The plan says:

- **Events 1:** "Cut 30 to 40% of events. Remove one-off events whose choices only nudge stats by 1 or 2 and lead nowhere. Keep the best 2,000 or so."
- **Uniqueness 5:** "Cut what dilutes the core. Features copied from other games that don't serve 'one life in a living history' go (for example the division-template and industry screens for anyone who isn't a ruler or marshal)."

**The retire list is a design call. It is written out, with each event's title and reason, in [`RETIRED.md`](RETIRED.md) for a human to approve or veto.** To keep an event, delete its line from `list.core.js`.

## What it does

**An audit of every event** (`bench/event-audit.mjs --mode=rank`). For each of the 4,115 events in the full build it records:

- what each choice's effects do: only nudges (stats or skills by 1 or 2, happiness or health by a few points, coin), bigger numbers, an opinion change, or something lasting (a trait, a wound, a bond, a job, a death, a duel, a beast, a realm effect, fame of 3 or more, a follow-up event, a function effect that writes memory or people);
- whether anything else in the game mentions its id (a chain's `event:`, `A.schedule`, `flags.ev.<id>`, a list in the engine) or any flag it sets (a `C.flag(p, "x")`, `flags.x`, an arc mark read by `M(p, 'x')`), searched over every event pack, every feature's code and the engine;
- whether it reads an earlier memory (the bot's own `memoryIndex`, the same regexes as `bench/bot.mjs`);
- whether it is a trigger (a chain's later step), in a special pool (job offers, duties, path flows, council, drill), realm or culture gated, written by a feature;
- its checks (and whether a check's failure costs something beside a safe choice), its word count, whether `tools/choice-analyzer.mjs` finds an obviously best choice;
- how often the bots met it in 24 lives (1,048 years).

Of the release's 3,199 events, 635 are triggers, 91 are referenced by id, 89 read a memory and 235 set a flag something reads. Of the 2,149 left, 1,289 leave something lasting, and **860 do not**: 231 nudges, 337 that only move numbers, 292 that only move numbers and an opinion.

**The retire list** (`select.mjs` writes `list.core.js` and `RETIRED.md`): the weakest first (nudges, then numbers only, then opinion only; within a kind, no tradeoff, short text, no setup and an obviously best choice go first), with a floor on every pool. **836 events (26.1% of the release) are retired**: 227 nudges (N), 334 numbers only (B), 275 opinion only (O). 12 weak events stay because of a floor, and 12 more because another feature patched them: 02-content-fixes mended one's tokens, and 33-choices rebalanced eleven so that no choice is obviously best. No event a feature wrote is on the list (a test checks this against every `features/*/*.events.js`).

**How a retired event leaves the roll** (`cut.core.js`). It stays in `A.EV`, marked `trigger` (the mark the release's rolls already skip), so anything that queues it by id still shows it: a chain, `A.schedule`, an item in an old save's queue. The monthly roll draws as the classic pool would, and a draw that lands on a retired event draws nothing: no event, no cooldown stamp. Every surviving event keeps its odds, so a life meets fewer events and the rate of risky scenes holds. If a fallen draw would leave the year with no event so far, the roll draws once more from the cut pool.

Simply marking the events and letting the roll fill its slots from the rest was measured first (one run of 24 lives each). It kept 57 events a decade (58.6 before), memory share stayed at 9.2%, repeats per 100 events rose from 20.9 to 22.5, and scenes that can wound, jail or kill rose from 6.7 to 9.8 a decade. The freed slots went to the broad events that remained.

**"Classic event pool (keep every event)"**, a menu setting next to the hints toggle, off by default. On, the roll draws from every event again. It is stored with the game (`A.S.settings.classicEvents`) and set through a journaled command (`A.setClassicEvents`), so replays and problem reports see it. The menu remembers it for new lives. An old save, with no such field, loads with the cut pool. `A.EV_RETIRED` (a Set) and `A.EC.ids()` name the retired ids, for benches that count the event pool.

**Uniqueness 5: the War Room shows its design desks only to the ranks that run them.** The release showed every character, from a farmhand on, the War Room tabs Templates, Industry and Manpower, greyed out ("Marshal or ruler", "Ruler only"). They are now hidden, by the release's own unlock rules:

| Tab | What it holds | Shown to | Hidden from |
| --- | --- | --- | --- |
| Templates | division designs, army doctrine | the ruler, the Marshal, army rank 6 (Commander) and up | everyone else: commoners, nobles, courtiers and council, mercenaries and soldiers below Commander |
| Industry | forges, workshops, production lines, the war-economy law | the ruler, army rank 7 (General) and up | everyone else, including the Marshal below rank 7 |
| Manpower | training new divisions, levies | the ruler, the Marshal, army rank 7 (General) and up | everyone else |

Command, Forces and Wars (the fronts, the host, the wars of the realm) stay for everyone: a nobody watching a 200-division war is Uniqueness 4's "both scales at once". A hint or a stale tab that asks for a hidden tab lands on Command. The War tab's line "The War Room shows the host, its templates and forges" now says "the fronts and the host" to those who cannot use templates or forges (patch `EC-WARCARD`).

I looked for other screens of this kind. The ruler's realm panel (laws, taxes, the host, "Open the War Room — forces, templates, industry") is shown only to rulers already. The Court tab shows a commoner the factions, the council, the great lords and the realm's ways, which are the living history around them. The market and trade roads serve a merchant's life. I hid nothing else.

## Measured by

`node bench/event-audit.mjs <build> --mode=measure --lives=24`: the same bot lives played with the classic pool and with the cut pool, on the full build (56 features). There are 12 starts (slave, serf, peasant, artisan, merchant, gentry, noble and royal, plus orc, dwarf and elf), four personalities, engaged and passive, each from birth for up to 70 years.

These runs used the first list of 848 ids, before the 12 patched events were put back. Three sets of 24 lives each way (seeds 5801, 91001 and 33301), 72 lives and about 3,000 years a side:

| Measure | Classic pool | Cut pool |
| --- | --- | --- |
| Events met per decade | 62.0 | **49.4** (−20%) |
| Share of met events that read a memory (the bot's `memoryIndex`) | 8.5% | **10.2%** (each of the three sets rose: 8.5→10.5, 8.1→9.9, 8.9→10.2) |
| Share that are small nudge one-offs (kind N, nothing reads them) | 3.7% | **0%** |
| Share that are weak one-offs of any kind (N, B or O) | 17.4% | **1.5%** (the 12 kept by a floor, and queued ones) |
| Repeats of an event within 10 years | 4,859 (23.9 per 100 events) | 3,859 (26.0 per 100 events) |
| Share of met events that something queued (chains, arcs, NPC moves) | 28.5% | 32.8% |
| Scenes that can wound, jail or kill, per decade | 6.9 | 6.6 |
| Retired events rolled | 3,333 | **0** |
| Mean years lived | 45.6 | 41.8 |
| Willpower at 30 (one set of 24 lives) | 44.6 | 39.6 |

Every class still meets events at a steady rate. These are the years lived in each class, the events met in a year, and the years with no event at all:

| Class | Classic pool | Cut pool |
| --- | --- | --- |
| 1 (serf) | 189 y, 5.0 a year, 12.7% empty | 240 y, 4.2 a year, 8.8% empty |
| 2 (peasant) | 1,550 y, 5.5, 9.5% | 1,468 y, 4.3, 9.9% |
| 3 (artisan, merchant) | 788 y, 5.3, 6.9% | 697 y, 4.2, 7.6% |
| 4 (gentry) | 379 y, 7.2, 6.3% | 277 y, 5.7, 7.9% |
| 5 (noble) | 314 y, 7.9, 7.3% | 290 y, 7.5, 6.9% |
| 6 (great noble, officer) | 96 y, 12.3, 0% | 87 y, 9.1, 1.1% |
| 9 (ruler) | 19 y, 16.5, 0% | 6 y, 14.0, 0% |

The empty years stay within about 1.5 points of the classic pool in every class. Without the guard, a year whose only draw fell would be empty.

The share of memory events rises because the events that remember are not lost: they fire whenever they are eligible, while the events around them thin out. Repeats within 10 years fell in number (4,859 to 3,859) but rose per event (23.9 to 26.0 per 100), because the survivors of a smaller pool come round a little more often. Events 5 (the variety guard) is what holds repeats.

**Every pool keeps a floor.** The eligible pool was counted for probe characters before and after: 9 classes (slave to ruler), 10 age bands (infant to old, noble child and teen), each of the 36 careers, a soldier, and a peasant of every one of the 34 realms. Floors used by `select.mjs`: each probe keeps at least 60% of the events it could draw and at least 30, and each realm keeps at least 5 of its local events (or all it had):

| Pool | Fewest left (probe) | Before → after |
| --- | --- | --- |
| class | ruler | 152 → 92 (61%) |
| age band | noble child (8) | 86 → 52 (60%); a peasant child 64 → 39 (61%); an infant keeps all 7 |
| job | mercenary | 197 → 129 (65%) |
| realm | POL-28 | 176 → 112 (64%) |
| soldier | | 201 → 133 (66%) |
| local events of a realm | POL-23 | 11 → 7 |

`test.mjs`:

| Test | Result |
| --- | --- |
| `cutListSane` | 836 retired (26.2% of the release's 3,191) of 4,134 events; every one exists, was not a trigger, is in no special pool, and is marked |
| `cutNotFromFeatures` | 836 retired, none of them written by a feature (937 feature events) |
| `cutRollSkips` | 4 lives of 25 years each way: the cut pool rolled 421 events, none retired; the classic pool rolled 563, 156 of them retired |
| `cutQueuedStillWorks` | 40 retired events queued by id: 40 shown, 40 answered; each is still valid as a scheduled item |
| `cutClassicSetting` | off by default; the menu box restores the events, is remembered, travels with the save, is a journaled command; an old save without the field loads with the cut |
| `cutPoolsKeepFloor` | 46 probes: the least kept 61% of its pool; the fewest local events left in a realm 7 |
| `renderRng`, `replayWithRender`, `journalReplay` (01-replay, run with this feature) | pass: rendering moves no random number, a replay with rendering gives the same world, 128 journal entries replay identically |
| `warRoomByRank` | a peasant sees Command, Forces, Wars (asking for Industry gives Command); a ruler sees all six; the War tab no longer names templates to a peasant |

## Rules kept

- No event is deleted, and no event text is changed. The list is data, and the classic setting brings every event back.
- Determinism: the cut changes only which draws are kept, inside the release's own roll and with its own random stream. The setting is game state and a journaled command.
- Rendering is pure: the menu line and the War Room tabs only read.
- `A.S.settings.classicEvents` is a new field. A save without it loads, with the cut pool.
- The War Room tabs are filtered in a wrapper. The two patches are a menu slot and one sentence.

## Limits

- **26.1%, not 30 to 40%.** Only 860 of the release's events are one-offs that leave nothing behind and that nothing reads. The plan's 30% would need about 100 more, and those all leave something lasting. The next weakest are 159 events whose one lasting mark is fame of 3 or more or a wound. `RETIRED.md` lists them as proposed, and `select.mjs --with-thin` retires them too (about 31%). The brief counts both as lasting, so they stay until a human decides. "Keep the best 2,000": the roll now draws from 1,728 of the release's 2,564 rollable events, plus the features' events.
- **Memory share rises only 2 points.** 8.5% to 10.5% is far from the plan's 40%. Cutting can only thin the events around the memories. The memories have to be written (Events 2 and 3).
- **Fewer events a decade.** A fifth fewer events reach a life (62.0 to 49.4 a decade), by design ("fewer, deeper"). The guard keeps the years with no event about where they were. The pacing (`eventsPerYear`, prompts per year in `bench/run.mjs`) will read lower, and a player may feel the quieter years. That needs playtesting.
- **Lives may run a little shorter.** Mean years lived were 45.6 with the classic pool and 41.8 with the cut, over 72 lives each. The three sets disagree: 45.0 → 39.8, 48.8 → 41.0, and 43.1 → 44.8. The difference is about one standard error, and most of these deaths are fevers. The retired events gave about +2.4 willpower and +2.5 happiness a decade (and −6 health), and willpower helps a character survive a mortal blow. In one set, willpower at 30 was 5 points lower with the cut. Growth that came from many small scenes now has to come from somewhere else (31-learn-by-doing's weights, or the deeper events). `bench/balance.mjs` was not run here (the coordinator runs it on the integrated build).
- **The audit reads effects statically.** A function effect counts as lasting if its source writes memory, people, the queue, the body or the realm, so a few weak events written as functions survive. A few events that only look weak may matter to a reader for their words. That is what `RETIRED.md` is for.
- **The bench's static counts include retired events.** `bench/run.mjs`'s `events` module counts every event in `A.EV` (memory share of all events, strict-recipe share). Skipping the ids in `A.EV_RETIRED` there would show the cut in those numbers. That is a one-line change to a file this feature does not own.
- **Built against today's features.** A feature added later that reads a retired event's flag or queues it does not break anything: a queued event still shows. But the event then deserves to be back in the roll. `--mode=measure` prints a warning listing any retired event the current build protects. On the 56-feature build there are none.
