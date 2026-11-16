# 40-memory-practice: callbacks for the practice orphan flags

The release's practice events (`pf_`) are the game's best small moral tests: a bout-master's purse at the well,
fifteen suns for a throat, a dying keeper of songs, a steward's second set of books. They set **29 flags that no
event ever reads**. A player who sold a fight, learned the backward shot or kept a great house's letters sewn in a
chest never hears of it again.

This feature adds **50 events** (prefix `mpf_`) that bring each of those moments back years later. Each one recalls
the moment by its place, its people and the thing that was done, and asks for a new decision that costs something.

- **All 29 flags are read**, by 39 first-level callbacks (1.34 per flag).
- **12 two-step arcs.** A callback sets an `mpf_` flag, and a second event reads it years later. One more link runs
  back into the chunk: warning a friend away from the listeners sets `pf_watched`, which `mpf_watched_shadow` reads.
- **The callbacks name the people the player met.** The release gives its people a bare name that lives only in the
  event's `ctx`, so the one place a name survives is the life log, in the result text of the year the flag was set.
  `logged()` reads it back from there. The bout-master who paid you, the soft voice in good gloves, the cog's
  master, the steward who paid every quarter day, the feast host, the dying keeper, the engineer, the priest and
  the merchant with the short scale come back under the names the player saw. People the release did link with
  `newRel` (the night-school mentor, the crewmate on the roof, the corsair captain, the great house's man) are
  found again by `rel.since`.
- **Setter paths are told apart.** Where two of a setter's choices set the same flag, the log shows which one was
  taken, and the callback follows it. The steward who skimmed a tenth meets an heir who has read the old books.
  A crooked dice-house's farm was won with loaded dice. The school was taught over the priest's objections or with
  his blessing. The night-watchers' price was named ("Ears, later. Not throats.") or it was not.
- **Aspect served:** memory and consequence (the Road to Ten's "the world remembers" bar).
- **Measured by:** the `mpfMemory` test below, and the bench's `events` module (orphan flags, memory links).

## Design references

The brief follows three storylet traditions. This chunk uses each one as follows.

| Reference | What it does | Where it shows here |
| --- | --- | --- |
| King of Dragon Pass | Old choices return as new dilemmas. No answer is free, and the saga quotes your history back to you. | Every callback quotes the setter's own facts (the third pass, the forty-first day at the quintain, sixteen good bows and four with cracked prods). Every one has a tradeoff with no free option. |
| Failbetter's quality-based narrative | A storylet is gated on qualities, and its outcome changes qualities, which gate the next storylet. | `cond` reads a flag plus elapsed years. The outcome sets a new flag, a debt (`owed`), a trait or a relation. Twelve arcs chain this way. |
| CK3 story cycles | A thread stays open in the background and resolves years later around a remembered person. | Arcs find the same person again by role (`flags.mpf_role`): the steward, the night-watcher, the smuggler, the poisoner magistrate, the patron, the pupil. |

**What a fully resourced version would add.** These items need engine work outside one feature folder:

1. Setters should create real people rather than bare names, so callbacks would not need the log.
2. A visible ledger of open threads ("owes you a favour: the night-watchers"), the way Fallen London shows its
   qualities.
3. Advisor lines in the KoDP style, so the mentor or the spouse could comment when a memory returns.
4. Portrait art for the returning faces.

## Rules every event follows

| Rule | How |
| --- | --- |
| Reads the memory | `cond` reads the flag with `C.flag(p, "x")`, so `B.memoryIndex()` sees the link |
| Timed | `A.S.year - p.flags.x >= N`, with N between 2 and 10. The test also checks that one year earlier does not qualify. |
| Keeps the setter's world | Adult stage, plus the setter's place: coast or town for the crew, the pilot, the scales and the dice-house; Nine Winds (`POL-12`) for Kharsa Arrow Field; Blackreef (`POL-33`) or a pirate's job for the captain's luck; never a dwarf for the hold's steel or the forge crack; literacy for the copied letter; war or the army for the steel bow and the mine. Local colour is computed the way the setter computed it (`crewName`, `scalePlace`, `listeners`, `songLore`). |
| Surfaces | `w: 3` (four later callbacks `w: 2`) and `once: true` |
| Real stakes | 2 to 4 choices. At least one choice leaves a lasting mark: a trait, a flag, a relation with `ctx.pid`, a wound, a deed or epithet, a debt (`owed`), an asset, lost gear, prison, a death or a move |
| People | Linked people are found again. New people come from `mk()` with a role, and get the logged name when there is one. Kinship relations are never overwritten. |
| Voice | Text 56-74 words (limit 80), labels at most 12, outcomes at most 45. No "Nobody...", no "for the rest of your life", no weekday names. |

## Flag -> callback events

| Flag (setter: choice) | Callbacks (years after) | Arc |
| --- | --- | --- |
| `pf_threw_bout` (pf_sword_stumble, pf_unarmed_paid_to_lose: take the money) | `mpf_bout_rematch` (3; sword pass or wrestling hold, by the log), `mpf_bout_pupil` (5) | `mpf_bout_fixer` -> `mpf_bout_ring` |
| `pf_quiet_school` (pf_dagger_still_hall: train a season / ask the price) | `mpf_quiet_sign` (3) | `mpf_quiet_ears` -> `mpf_quiet_throat` |
| `pf_hired_knife` (pf_dagger_hire: do the job) | `mpf_knife_client` (2), `mpf_knife_son` (10) | |
| `pf_rim_trick` (pf_lance_inside_rim: the quintain) | `mpf_rim_ashby` (2) | |
| `pf_backward_shot` (pf_mounted_backward_shot: practise) | `mpf_shot_road` (2, mounted), `mpf_shot_kharsa` (3, Nine Winds) | |
| `pf_smuggler_contact` (pf_xbow_crates: test them) | `mpf_crates_bolt` (2) | `mpf_smug_owes` -> `mpf_smug_cargo` |
| `pf_hold_steel` (pf_xbow_lever: buy it) | `mpf_steel_reckoners` (2), `mpf_steel_war` (2, at war, bow still owned) | |
| `pf_spy_work` (pf_stealth_letter: do it) | `mpf_gloves_plant` (2) | `mpf_gloves_planted` -> `mpf_gloves_trial` |
| `pf_knows_secret` (pf_stealth_letter: read it yourself) | `mpf_letter_copy` (3, literate) | |
| `pf_crew` (pf_stealth_crew: do the job) | `mpf_crew_gallows` (2) | |
| `pf_pilot` (pf_sea_pilot: take her in) | `mpf_pilot_storm` (2), `mpf_pilot_cog` (4) | `mpf_pilot_chart` -> `mpf_pilot_chart_buyer` |
| `pf_court_door` (pf_etiq_upstart: use her to get into court) | `mpf_court_goose` (3) | |
| `pf_blackmailer` (pf_intr_steward: make him pay) | `mpf_purse_quarter` (2) | `mpf_purse_doubled` -> `mpf_purse_last` |
| `pf_steward_secret` (pf_intr_steward: keep it for later) | `mpf_secret_later` (3) | |
| `pf_knows_poisoner` (pf_intr_cup: follow the cook) | `mpf_poisoner_face` (3) | `mpf_poisoner_paid` -> `mpf_poisoner_cup` |
| `pf_informer` (pf_intr_listener: become an informer) | `mpf_listener_name` (2, has a friend), `mpf_listener_ledger` (8) | `mpf_listener_name` sets `pf_watched` |
| `pf_watched` (pf_intr_listener: shading caught; or `mpf_listener_name`) | `mpf_watched_shadow` (2; the reason follows the log) | |
| `pf_sold_secret` (pf_intr_secret: sell it) | `mpf_sold_scholar` (3) | |
| `pf_holds_secret` (pf_intr_secret: hide it) | `mpf_chest_damp` (3) | `mpf_chest_kept` -> `mpf_chest_will` (old age) |
| `pf_song_keeper` (pf_music_old_songs: sit at the bed) | `mpf_song_lineage` (3), `mpf_song_last` (10, age 45+) | `mpf_song_lie` -> `mpf_song_lie_grown` |
| `pf_engineer` (pf_siege_engineer: go with him) | `mpf_engine_notes` (2), `mpf_engine_breach` (3, at war) | |
| `pf_mill` (pf_stew_improve: build a mill) | `mpf_mill_weir` (2) | `mpf_mill_shared` -> `mpf_mill_famine` |
| `pf_steward` (pf_stew_steward_post: accept, honest or skimming) | `mpf_steward_heir` (3; the skimmer's tenth, by the log) | |
| `pf_school` (pf_learn_teach: teach anyway / with the priest) | `mpf_school_pupil` (5) | `mpf_school_sponsor` -> `mpf_school_return` |
| `pf_partner_crook` (pf_trade_scales: show him privately) | `mpf_scale_wardens` (2) | |
| `pf_dwarf_eye` (pf_craft_dwarf: watch and copy) | `mpf_dwarf_fold` (2), `mpf_dwarf_apprentice` (also reads the oath) | `mpf_dwarf_oath` -> `mpf_dwarf_apprentice` |
| `pf_dicehouse_man` (pf_gamb_debt: work it off) | `mpf_collector_door` (2) | |
| `pf_corsair_favor` (pf_gamb_corsairs: lose on purpose) | `mpf_corsair_sails` (2, a coast outside Blackreef), `mpf_corsair_reef` (3, Blackreef or a pirate) | |
| `pf_dicehouse` (pf_gamb_house: open a house, honest or crooked) | `mpf_house_farm` (2; loaded dice, by the log) | |

## The arcs

| First event: choice | Flag | Second event (years) | Who comes back |
| --- | --- | --- | --- |
| `mpf_bout_pupil`: take the purse, and arrange it | `mpf_bout_fixer` | `mpf_bout_ring` (3): the new chief judge has the ledger | |
| `mpf_quiet_sign`: answer the sign | `mpf_quiet_ears` | `mpf_quiet_throat` (3): "The rule has changed." | the night-watcher |
| `mpf_crates_bolt`: warn the smuggler | `mpf_smug_owes` | `mpf_smug_cargo` (3): he pays his debt | the smuggler |
| `mpf_gloves_plant`: plant the letter | `mpf_gloves_planted` | `mpf_gloves_trial` (2): the guild-master's treason trial | the agent, and the guild-master's name |
| `mpf_pilot_storm`: sound and chart the bars | `mpf_pilot_chart` | `mpf_pilot_chart_buyer` (3): the quay or the foreigner | |
| `mpf_purse_quarter`: double the price | `mpf_purse_doubled` | `mpf_purse_last` (2): the steward confesses | the steward |
| `mpf_poisoner_face`: let him know you know | `mpf_poisoner_paid` | `mpf_poisoner_cup` (3): the taster does not pause | the magistrate |
| `mpf_chest_damp`: sew them in again | `mpf_chest_kept` | `mpf_chest_will` (5, age 45+): who gets the chest | an heir (a grown child first) |
| `mpf_song_lineage`: drop the verse | `mpf_song_lie` | `mpf_song_lie_grown` (4): the lie has become history | the patron |
| `mpf_mill_weir`: open the sluice (or win in court) | `mpf_mill_shared` | `mpf_mill_famine` (3): the hungry year | the farmer below the weir |
| `mpf_school_pupil`: pay her way (or talk her father round) | `mpf_school_sponsor` | `mpf_school_return` (5): the forged petition | the pupil |
| `mpf_dwarf_fold`: swear on your hammer | `mpf_dwarf_oath` | `mpf_dwarf_apprentice` (4): the oath against the apprentice | |

## Test: `mpfMemory`

```sh
node tools/build.mjs --out=/tmp/ardan/40-memory-practice/x.html --only=memory-practice
node tools/lint-events.mjs --feature=memory-practice --html=/tmp/ardan/40-memory-practice/x.html
node tests/run.mjs /tmp/ardan/40-memory-practice/x.html --features=memory-practice --only=boot,mpfMemory
```

While the folder holds `.wip`, `tests/run.mjs` loads this feature's test only when `--features=memory-practice`
names it.

The test runs eight passes against the built page. Each pass fails on any engine error, raw `{token}` or word-diet
breach.

1. **Registry.** All 50 events are registered, and all 29 flags are read by some `cond`.
2. **Craft.** Every `cond` reads a memory flag with `C.flag` and is timed (2 to 20 years). Weight is 2-3, `once` is
   set, there are 2-4 choices, at least one choice leaves a lasting mark, and no house tics appear.
3. **Play.** 66 fixtures, at least one per event, plus variants for the setter's paths and for linked people. Each
   checks that the `cond` holds, `evFit` does not hide the event, and the event renders. Then every choice is run,
   both the won and the lost side of every check (271 branches). Every choice must be offered by some fixture, and
   no kinship relation may be overwritten.
4. **Timing.** Each fixture one year too soon is refused.
5. **World.** 19 wrong-world fixtures are refused: wrong realm, a dwarf, inland, a village, peace, no bow, no horse,
   unlettered, too old for the lists, too young for the will, no friend to name.
6. **Arcs.** For all 13 links: the first event's choice sets the flag, the second event is refused a year early and
   eligible on time, and it finds the same person where the arc has one.
7. **Backtest against the release.** 36 runs. Each plays the release's own setter event and choice, lets the years
   pass, and checks that the callback follows. Where a recall applies, it must name the logged person, find the
   linked person, or match the setter path that was taken.
8. **Surfacing.** A life with all 29 flags set six years back plays twelve years through the normal event roll. At
   least 3 callbacks must fire (18 do on the current build).

Mutation check (run by hand while building this feature): each of these breaks makes `mpfMemory` fail.

- Renaming one flag in a `cond`.
- A misspelt token.
- An untimed `cond`.
- A broken name regex.
- A broken path regex.
