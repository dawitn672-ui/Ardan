# 40-memory-regional-a: memory callbacks for the steppe and the south

**Aspect:** memory and consequence (events that remember). **Chunk:** `regional-a`.
**Owner files:** `regional-a.events.js` (53 events), `test.mjs` (`mraMemory`), this README.

## What it does

The release has 28 flags in this chunk that an event **sets** and no event ever **reads**. You ride the Kharsa yam stage, guard Faruq the Lamp, or carry fire-oil to Morhaven, and the game never mentions it again. This pack gives each of those moments a later scene that names it concretely and asks for a new decision:

- **37 first callbacks** read the 28 orphan flags. That is 39 flag reads, or **1.39 per flag**, because `ss_tm_debt` and `unfree` share two events. Every flag is read at least once.
- **16 second steps** read flags that the first callbacks set (all prefixed `mra_`). That makes **16 two-step arcs**, each running from the original moment to a reckoning years later.

The realms are the Nine Winds (POL-12), Qadir (POL-17), Tamar (POL-18), the Sand Clans (POL-19), Zanara (POL-20), Kesh (POL-21) and Abara (POL-22).

### The craft rules each event follows

The patterns come from King of Dragon Pass (advisors who remember), Failbetter's quality-based storylets (a quality unlocks the next scene) and CK3 story cycles (a thread that returns with escalating stakes).

| Rule | How it is enforced |
| --- | --- |
| The callback recalls the place, the role and the act | The text is written from the setter's full text in `.build/ardan-content.js`, for example "the 150-kilometer stage to Kharsa", "the Basim stamp off the ingots" or "three planks along". |
| Timed | `cond` has `C.flag(p, "x") && A.S.year - p.flags.x >= N`, with N from 2 to 15. The test checks that the cond is **false** in the year the flag was set. |
| Same world | Realm gate as the setter, a stage gate (`C.adult`/`C.old`), and the setter's sex or race gate where it had one (yam riders and Ibis archers are male; the Horde-knife scene is for orc, half-orc and human players). |
| A new decision with a hard trade-off | 2 to 4 choices. No branch is free: money costs honor, safety costs standing, and honesty costs the herd. |
| A lasting mark | Every event has at least one branch with a trait, a flag read later, a relation with `ctx.pid`, a wound, a deed, a job, a debt, a favor owed, prison, or the loss of the original token (`unflag`). The test checks this. |
| Surfaces | `w: 2` or `3` and `once: true`. |
| Voice | Second person, present tense. Text is at most 80 words, labels at most 12, outcomes at most 45. The pack avoids "looks at you a long time", "for the rest of your life" and lines that start with "Nobody". |

### People

When the setter names a lore figure, the callback brings that person into the world with `A.personFromCast(id)`. `A.S.castMap` keeps each one unique, and `ctx.pid` makes them `{them}`. The relation then lasts, so Dorin, Salim, Faruq and the rest stay in the player's relations. If the figure is dead or missing, the event drops itself (`ctx.skip`) instead of showing a stranger.

| Figure | Cast id | Used in |
| --- | --- | --- |
| Dorin Swiftarrow | CHR-0316 | `mra_nw_dorin_feast`, `mra_nw_dorin_staff` (his death gives that scene different text) |
| Salim the Pilot | CHR-0473 | `mra_qd_pilot_lamps`, `mra_qd_pilot_mirahi`, `mra_qd_pilot_oath` |
| Ahmose the Mason | CHR-0486 | `mra_tm_mason` (he cut the flood mark in 1089) |
| Faruq the Lamp | CHR-0502 | `mra_tm_faruq_again`, `mra_tm_lamp_night` |
| Zayd Blackveil | CHR-0518 | `mra_sc_blackveil_marshal`, `mra_sc_zayd_reckoning` |
| Sefu the Runner | CHR-0535 | `mra_zn_runner_atani` |
| Rehema the Shipwright | CHR-0556 | `mra_ks_holes_sunk`, `mra_ks_auger_row` |
| Nuru Keshari (the storm prince) | CHR-0559 | `mra_ks_storm_prince` (only once he is at least 4) |
| Desta the Pedlar | CHR-0588 | `mra_ab_desta_back`, `mra_ab_desta_hive` |
| Mesfin Mandari | CHR-0575 | `mra_ab_desta_hive`, `mra_ab_monundi_muster`, `mra_ab_monundi_list` |

A relation the engine already made is reused. That covers the orc rider who gave you the knife, the player's real uncle (a parent's brother), an existing rival on the Night of Masks, and the tally-man you paid. Otherwise the event makes a fitting person with `make()`: the Head of the Yam Keepers, the Marad boy (grown to the right age), a bondsman boy, a Tashiri boat-mate. No token is ever left unfilled.

## Flag to callbacks

| Orphan flag (setter) | Callback events (delay) |
| --- | --- |
| `ss_nw_yam` (ss_nw_youngest) | `mra_nw_yam_relay` (3y), `mra_nw_yam_old` (15y, old) |
| `ss_nw_arrowfield` (ss_nw_backshot) | `mra_nw_dorin_feast` (3y) |
| `ss_nw_oilroad` (ss_nw_jars) | `mra_nw_oil_hunt` (2y), `mra_nw_oil_smoke` (5y) |
| `ss_nw_hordeknife` (ss_nw_hordeguest) | `mra_nw_knife_raid` (2y) |
| `ss_qd_pilot` (ss_qd_pilot) | `mra_qd_pilot_lamps` (2y), `mra_qd_pilot_oath` (7y) |
| `ss_qd_qasimi` (ss_qd_sabun) | `mra_qd_report` (2y), `mra_qd_sabun_again` (5y) |
| `ss_qd_horn` (ss_qd_horncup) | `mra_qd_horn_summons` (2y) |
| `unfree` (ss_tm_debt, value `"debt"`) | `mra_tm_bond_mark` (2y, still bonded), `mra_tm_debt_neighbor` (8y, free again) |
| `ss_tm_debt` (ss_tm_debt) | `mra_tm_bond_mark` (2y), `mra_tm_debt_neighbor` (8y) |
| `runaway` (ss_tm_seven) | `mra_tm_runaway_roll` (3y) |
| `ss_tm_lowfloods` (ss_tm_hungry, ss_tm_whisper) | `mra_tm_mason` (2y), `mra_tm_lowflood_year` (4y) |
| `ss_tm_mice` (ss_tm_mice) | `mra_tm_mice_count` (2y) |
| `ss_tm_scribe` (ss_tm_scribe, as a child) | `mra_tm_scribe_roll` (8y, adult) |
| `ss_tm_ibis` (ss_tm_ibis) | `mra_tm_ibis_oath` (2y), `mra_tm_ibis_boat` (4y) |
| `ss_tm_faruq` (ss_tm_faruq) | `mra_tm_faruq_again` (2y) |
| `ss_sc_blackveil` (ss_sc_blackveil) | `mra_sc_blackveil_marshal` (2y) |
| `ss_sc_marad` (ss_sc_marad) | `mra_sc_marad_feud` (2 to 12y), `mra_sc_marad_boy` (8y) |
| `ss_zn_hand` (ss_zn_dust) | `mra_zn_hand_heir` (2y) |
| `ss_zn_mask` (ss_zn_masks) | `mra_zn_mask_night` (2y), `mra_zn_mask_uncle` (6y) |
| `ss_zn_runner` (ss_zn_runners) | `mra_zn_runner_atani` (2y) |
| `ss_zn_letter` (ss_zn_letter) | `mra_zn_letter_quarrel` (2y) |
| `ss_ks_swimmer` (ss_ks_nightswim) | `mra_ks_swim_amber` (2y) |
| `ss_ks_holes` (ss_ks_auger, lose branch) | `mra_ks_holes_sunk` (2y) |
| `ss_ks_auger` (ss_ks_auger) | `mra_ks_auger_row` (2y) |
| `ss_ks_wethands` (ss_ks_wethands) | `mra_ks_wet_letter` (2y), `mra_ks_wet_old` (6y) |
| `ss_ks_storm` (ss_ks_storm) | `mra_ks_storm_prince` (4y) |
| `ss_ab_desta` (ss_ab_pedlar) | `mra_ab_desta_back` (2y) |
| `ss_ab_monundi` (ss_ab_monundi) | `mra_ab_monundi_muster` (2y) |

## The arcs (original moment, then callback, then reckoning)

Each arc flag is set by a choice in the first callback. A second event reads it at least 2 years later. Some first callbacks can set either of two flags, and the second event then branches its text and choices on which one was set.

| Arc | First callback sets | Second step (delay) | The reckoning |
| --- | --- | --- | --- |
| Yam token | `mra_nw_yamsold` / `mra_nw_yamknot` | `mra_nw_yam_tally` (2y) | The Head of the Yam Keepers brings a red knot. You can lose the token, make an enemy of Serik, or end up owing the Keepers. |
| Arrow Field | `mra_nw_beatdorin` | `mra_nw_dorin_staff` (4y) | You can become Master of the Arrow Field (a job and a deed), name the Grey Wind archer, or refuse. |
| Horde knife | `mra_nw_knifeshown` | `mra_nw_knife_accused` (2y) | You are accused of treating with the Horde. You lose a third of the herd, hand over the knife, or bribe the clerk. |
| Miruma lamps | `mra_qd_toldsalim` | `mra_qd_pilot_mirahi` (2y) | You bring a galley over the shoal by dark. Salim's mastership rides on it. |
| Sabun report | `mra_qd_gavereport` / `mra_qd_soldreport` | `mra_qd_copper_after` (2y) | You testify against the Emir before the Divan, or perjure yourself for him. |
| Horn cup | `mra_qd_hornspoke` | `mra_qd_horn_cup` (2y) | You choose the Sultan's cup. You can be named a palace physician or take the Kesh bribe. |
| Runaway | `mra_tm_paidcatcher` | `mra_tm_runaway_again` (2y) | The blackmail comes back. You can take on a standing debt, win in court, or end up with a brand or a cell. |
| Mason's confession | `mra_tm_confession` | `mra_tm_confession_use` (2y) | You post it on the Flood Stairs (sedition), sell it to the temple, or keep it. |
| Village petition | `mra_tm_petition` | `mra_tm_petition_answer` (2y) | The nome court asks who wrote it. |
| Faruq's guard | `mra_tm_lampguard` | `mra_tm_lamp_night` (2y) | The temple comes for Faruq at night. You hold the door, take the river, or open the door. |
| Zayd | `mra_sc_warnedzayd` / `mra_sc_soldzayd` | `mra_sc_zayd_reckoning` (2y) | Zayd comes to the fire, either to ask for help or to collect. |
| Atani run | `mra_zn_ranatani` | `mra_zn_runner_guard` (2y) | You are offered the white cloth of the Runner Guard. |
| Flagship cable | `mra_ks_cutcable` | `mra_ks_swim_price` (2y) | The Amber Isles put a price on the swimmer's name. |
| Auger-man | `mra_ks_augertold` | `mra_ks_auger_after` (2y) | House Monuri buys your retraction. |
| Desta's ear | `mra_ab_destaman` | `mra_ab_desta_hive` (2y) | You choose between the Mandari letters in the Yandi hive and Mesfin Mandari. |
| Night muster | `mra_ab_rodemonundi` | `mra_ab_monundi_list` (2y) | You face the king's list. You can betray three riders, flee south, or pay a clerk forever. |

Every `mra_` flag that is set is read again. The test fails if any arc flag is left orphaned.

**A booked reckoning.** A CK3 story cycle comes back whether or not the dice favor it. Here, the choice that opens an arc also calls `A.schedule({ type: "event", ev }, 6 to 10 years)`, through the helper `later()`. If the weighted roll brings the reckoning sooner (it is eligible after 2 to 4 years), the booked copy drops itself. The arc event's setup checks `fresh()` against `p.flags.ev`. When the booked copy falls due, the engine's `A.stillValid` re-checks the cond, so it never reaches an heir, a player who has moved realm, or the wrong life stage. The flag itself stays a plain `flag: "mra_x"` inside each fx, so `bench/`'s memory index still sees the link.

## How to build, lint and test (privately)

```sh
node tools/build.mjs --out=/tmp/ardan/40-memory-regional-a/x.html --only=memory-regional-a
node tools/lint-events.mjs --feature=memory-regional-a --html=/tmp/ardan/40-memory-regional-a/x.html
node tests/run.mjs /tmp/ardan/40-memory-regional-a/x.html --features=content-fixes,memory-regional-a --only=boot,tokens,mraMemory
```

While the folder holds a `.wip` marker, `tests/run.mjs` skips its tests unless the feature is named with `--features=`. `tokens` lives in `content-fixes`, so name that too. The linter warns that none of the 53 events is eligible for its 8 stock characters. That is expected, because every callback needs history.

`mraMemory` does more than the linter. It builds characters that satisfy each event:

- the realm, sex, stage and race from the cond, plus the realm's other race;
- the flag set N+1 years ago, or each side of an "or" flag;
- rich and literate, then poor and illiterate;
- special histories: Nuru at 9 and at 22, Dorin dead, an orc friend, a known tally-man, a rival, a non-Mosi emperor.

For each character it confirms that the cond is false in the year the flag was set. It then renders the event and takes **every** choice from the same saved state, forcing each check to both win and lose: 252 histories and 974 outcomes. It fails on engine errors, raw tokens, `NaN` or `undefined`, words over the limit, unknown wounds, traits, careers or skills, and missing lasting marks.

## Backtest (simulated play, not just forced views)

These scripts lived in a scratch folder, not in this feature. Each one runs the real game loop (`A.advance`, `A.headReady`, `A.eventAuto`) on the private build.

| Run | Setup | Result |
| --- | --- | --- |
| Natural lives | 21 autopilot lives, 3 per realm, about 62 years each | The setter flags are rare: 3 lives earned one, and 1 callback fired. These are regional one-off scenes. Zero engine or page errors. |
| First-callback surfacing | 16 lives, 2 per realm plus debt and runaway lives, with the realm's memories already earned at 22, then 25 autopilot years | 36 of about 63 eligible first callbacks surfaced (57%), median about 9 years after the memory (range 3 to 24), each once. Zero errors. |
| Arc reckonings | For each of the 16 arcs: open it by taking the booking choice, then 12 autopilot years | 15 of 16 reckonings arrived exactly once, 2 to 8 years later. In the 16th the player died first. Before the Zayd fallback, the world had killed Zayd (he had become the player's friend, so friend-death events could pick him), and that arc was lost. It now arrives through his band. |
| Core suites on the build | `boot`, `lives` (6 lives), `saveRoundTrip`, `uiSmoke`, `renderRng`, `replayWithRender`, `journalReplay`, `tokens` | All pass. A booked reckoning is plain data in `A.S.sched`, so it survives save, load and replay. |

## Measurement

This pack moves the `memory` numbers in `bench/`. The bot's `memoryIndex` counts an event as a memory event when its cond or setup reads another event's flag. All 53 events qualify. The 28 chunk flags stop being orphans, except `unfree`, which the bench excludes by design. The 16 arc flags are set here and read here, so this pack adds no new orphans.

## Known limits

- Many lore events in the chunk only fire early (`year <= 1110`), so some callbacks only appear in lives that start near the default year.
- `mra_zn_hand_heir` checks whether Mosi III still rules and changes its text if he does not. The other scenes assume their realm's institutions still stand: the Brotherhood, the Divan, the temple of Tamar, the League.
- The "Tessarian war" fire in `mra_nw_oil_smoke` and the storm in `mra_ks_storm_prince` are told as rumor and local event. They do not depend on the world simulation.
