# 40-memory-regional-b: regional memories come back

**Aspect:** memory and consequence (Road to Ten: "events that read an earlier memory").
**Owner files:** `regional-b.events.js`, `test.mjs`, this README. No patches, no core code.

## What it does

The regional story events of Abara, Sabra, Skyhold, Ranpur, Blackreef and Kesh set 27 flags that no event
ever read. You could buy a dead cook's token for the Oil Shore gate, sell the dragon's secret in the Upturned
Queen, or let a thief up in the snow, and the game forgot it the moment the window closed.

This feature adds **53 events** (`mrx_*`). **37 of them** read those 27 flags (1.37 per flag) and bring the
moment back years later as a new decision. **16** are the second step of a two-step arc: a callback sets an
`mrx_*` flag, and another callback reads it years after that.

The design follows three storylet traditions:

- **King of Dragon Pass:** the past comes back as a concrete situation with a cost. It is never a "remember
  when". Every callback names the place, the person's role and the thing you did, using facts from the
  setter's text and the lore tables (Kiros born first, the pale calf bought at Amberport, the jar missing from
  Ratrock, Lark's father at the Drowning Post).
- **Failbetter's quality-based narrative:** flags are qualities with a timestamp. Each cond reads
  `C.flag(p, "x") && A.S.year - p.flags.x >= N` (N from 2 to 12), so a memory ripens before it returns.
  Later callbacks on the same flag wait longer (2 to 3 years for the first, 5 to 12 for the second).
- **CK3 story cycles:** choices leave marks the game keeps and later events read: traits, relations and debts
  with a named person (`them`, `owed`, `oweThem`), wounds, deeds, epithets, a job, gear, prison, secrets and
  letters. The test requires every event to have at least one branch with such a mark, and no choice is free.
  Safe options cost honor, standing or a friend. Bold ones risk a wound, a cell or an enemy.

Rules every event follows:

- It keeps the setter's world. The realm gate is the same (`C.realm(p, "POL-xx")`), and the event needs an
  adult, or a not-old adult for physical work. `ok(p)` keeps it from slaves and prisoners.
- It is `once: true`, with weight 2 (first callbacks) or 3 (arc second steps).
- Text, choice and outcome stay within 80, 12 and 45 words. Text is second person, present tense.
- It is unclassed (no `C.poor(`/`C.noble(`), and no text trips the tavern, street, errand or favor
  filters, so nobles and rulers who carry these memories still see them. The test checks `A.evAudience`.

## People across the years

- **Engine-linked people come back.** `ss_ab_sealed` and `ss_br_wheresleeps` link a person (`newRel`) in the
  same choice that sets the flag. The arc first steps link `{them}` the same way. `find()` looks up the
  relation whose `since` equals the flag's year, so the servant you hauled over the Blue House wall, the thief
  you let up, or the trader you roped down from Bellcrest is the same named person years later.
- **The person may be gone.** If they have died, `ctx.known` is empty and the text switches to a stranger who
  brings word of them. Examples: a Zanari merchant whose servant died of a fever, a neighbor bringing the
  dead servant's paper, the Stair Guard comrade of the dead thief. Every choice reads correctly in both
  versions.
- **New people** come from `A.makeAcquaintance` with an `occ`, and their pronouns become ctx tokens:
  `{ohe} {Ohe} {ohis} {Ohis} {ohim} {omw}`. The engine's own `{he}`/`{his}` refer to the player, so these
  don't overwrite them.
- **Text matches your history.** `mrx_sk_doubt_butter` remembers which setter gave you the doubt (debate court
  or herder's fire). `mrx_sk_dragon_telling` remembers whether you knelt with the pilgrims (the deed) or
  watched it hunt.

## Flag -> callbacks

| Chunk flag | Set by (event: choice) | Read by (min. years since) |
| --- | --- | --- |
| `ss_ab_tekle` | `ss_ab_monundi`: Ask who the Horsemen would follow if the crown fell | `mrx_ab_tekle_list` (3), `mrx_ab_tekle_cord` (12) |
| `ss_ab_clause` | `ss_ab_sealed`: Get her out over the back wall | `mrx_ab_clause_witness` (2), `mrx_ab_clause_paper` (7) |
| `ss_sb_token` | `ss_sb_token`: Buy the token from her | `mrx_sb_token_gate` (2) |
| `ss_sb_notebook` | `ss_sb_notebook`: Take the packet and read it | `mrx_sb_notebook_factor` (2) |
| `ss_sb_weights` | `ss_sb_goldroad`: Clerk for the brokers, weighing the gold | `mrx_sb_weights_skim` (2) |
| `ss_sb_hazimi` | `ss_sb_hazimi`: Carry it north | `mrx_sb_hazimi_named` (2), `mrx_sb_hazimi_feast` (7) |
| `ss_sb_crew` | `ss_sb_fireboat`: Learn to handle the pots | `mrx_sb_crew_saad` (3), `mrx_sb_crew_night` (5) |
| `ss_sb_salwa` | `ss_sb_boiler`: Hide her on your boat and get her out to sea | `mrx_sb_salwa_rope` (3) |
| `ss_sk_still` | `ss_sk_stillhands`: Spar with him | `mrx_sk_still_thief` (2) |
| `ss_sk_doubt` | `ss_sk_debate`: Ask the forbidden third question; `ss_sk_redstair`: Ask him why he follows Norbu | `mrx_sk_doubt_butter` (3) |
| `ss_sk_blades` | `ss_sk_blades`: Tell Nima of the Still Hands | `mrx_sk_blades_guard` (2) |
| `ss_sk_guide` | `ss_sk_snowborn`: Make the crossing (or wait a day) | `mrx_sk_guide_cloud` (2) |
| `ss_sk_dragon` | `ss_sk_dragonpilgrim`: Go with the pilgrims (or go to watch) | `mrx_sk_dragon_skybolt` (2), `mrx_sk_dragon_telling` (10) |
| `ss_rp_bladehall` | `ss_rp_bladehall`: Dance with the steel | `mrx_rp_blade_wedding` (3), `mrx_rp_blade_forty` (6) |
| `ss_rp_mahout` | `ss_rp_nagita`: Ride a tame elephant in the drive | `mrx_rp_mahout_bull` (2) |
| `ss_rp_calf` | `ss_rp_nagita`: Ask what the temples hide in the hills | `mrx_rp_calf_moonpearl` (2) |
| `ss_rp_unbound` | `ss_rp_debtfield`: Join Dev the Unbound for one raid | `mrx_rp_unbound_lotus` (2) |
| `ss_rp_taster` | `ss_rp_poison`: Take the powder to the palace tasters | `mrx_rp_taster_feast` (2), `mrx_rp_taster_post` (8) |
| `ss_rp_paper` | `ss_rp_journeymen`: Pilot them upriver | `mrx_rp_paper_trader` (3) |
| `ss_rp_tollbook` | `ss_rp_tollbooks`: Make a copy of the fat book for yourself | `mrx_rp_tollbook_dwarf` (2) |
| `ss_br_told` | `ss_br_wheresleeps`: Sell him the truth | `mrx_br_told_page` (2, any realm: you fled the Reef) |
| `ss_br_tessar` | `ss_br_crossbows`: Sail to Tessar and join the Crossbows | `mrx_br_tessar_chest` (2) |
| `ss_br_redsail` | `ss_br_vote`: Carry it to Ratrock | `mrx_br_redsail_vote` (2), `mrx_br_redsail_ring` (6) |
| `ss_br_pilot` | `ss_br_shoalpilot`: Steer by the sound of the surf | `mrx_br_pilot_post` (2), `mrx_br_pilot_jar` (5) |
| `ss_br_forty` | `ss_br_lionfleet`: Work the fire-rafts at Ratrock | `mrx_br_forty_oath` (2) |
| `ss_br_book` | `ss_br_urka`: Offer to buy the share-book from her | `mrx_br_book_hull` (2) |
| `ss_ks_kito` | `ss_ks_gecko`: Climb with Kito | `mrx_ks_kito_marines` (2), `mrx_ks_kito_silk` (8) |

## Two-step arcs (16)

| First callback | Sets | Second callback (years after) | What comes due |
| --- | --- | --- | --- |
| `mrx_ab_tekle_list` | `mrx_ab_pledged` | `mrx_ab_tekle_muster` (3) | your name in Tekle's book when the Horsemen saddle |
| `mrx_ab_clause_paper` | `mrx_ab_clause_kept` | `mrx_ab_clause_newyear` (2) | the servant's copy of the Tamowa clause at the Green House gate |
| `mrx_sb_token_gate` | `mrx_sb_oilseen` | `mrx_sb_oil_map` (3) | a Varennan wants a map of what you saw inside |
| `mrx_sb_notebook_factor` | `mrx_sb_notebook_sold` | `mrx_sb_notebook_galleys` (2) | Varennan galleys know every cove off Zariya |
| `mrx_sb_weights_skim` | `mrx_sb_skim` | `mrx_sb_weights_audit` (3) | the Gold Houses reweigh old caravans |
| `mrx_sb_crew_saad` | `mrx_sb_oilyard` | `mrx_sb_oilyard_count` (2) | one jar short on Saad's tally sticks |
| `mrx_sk_still_thief` | `mrx_sk_spared` | `mrx_sk_spared_return` (4) | the thief you let up asks a favor in a Guard's coat |
| `mrx_sk_doubt_butter` | `mrx_sk_doubter` | `mrx_sk_doubter_east` (3) | the Doubters' list, with your name, goes east to Norbu |
| `mrx_sk_guide_cloud` | `mrx_sk_rescued` | `mrx_sk_rescued_dwarves` (3) | the trader you saved brings Emberdeep's dragon-hunters |
| `mrx_rp_mahout_bull` | `mrx_rp_bull` | `mrx_rp_bull_musth` (3) | your bull in musth, and six thousand suns at stake |
| `mrx_rp_calf_moonpearl` | `mrx_rp_calf_seen` | `mrx_rp_calf_parade` (2) | the branded "white" calf paraded as Moon-Pearl's daughter |
| `mrx_rp_unbound_lotus` | `mrx_rp_unbound_again` | `mrx_rp_unbound_gate` (3) | Dev's head on the gate, and his band without a leader |
| `mrx_rp_tollbook_dwarf` | `mrx_rp_tollbook_sold` | `mrx_rp_tollbook_herald` (2) | Stonehold's herald holds a copy in your handwriting |
| `mrx_br_forty_oath` | `mrx_br_sworn40` | `mrx_br_forty_stone` (3) | the Forty hand you the rope and the stone |
| `mrx_br_book_hull` | `mrx_br_hull` | `mrx_br_table_seat` (2) | your first vote at the Captains' Table |
| `mrx_ks_kito_marines` | `mrx_ks_kito_warned` | `mrx_ks_kito_dues` (3) | Kito repays the warning: a pier's fees or one more climb |

**Closed doors.** These flags close a later callback so it can't contradict what you chose. The
callback's cond reads them negated.

| Set by | Flag | Closes |
| --- | --- | --- |
| `mrx_ab_clause_witness` (send away / sell) | `mrx_ab_clause_gone` | `mrx_ab_clause_paper` |
| `mrx_sb_hazimi_named` (tell Tahir Sabrani) | `mrx_sb_hazimi_sold` | `mrx_sb_hazimi_feast` |
| `mrx_sb_crew_saad` (take the tally sticks) | `mrx_sb_oilyard` | `mrx_sb_crew_night` (you left the boats) |
| `mrx_br_redsail_vote` (vote for Nell) | `mrx_br_ring_gone` | `mrx_br_redsail_ring` |
| `mrx_br_pilot_jar` (seen; `p.flags.ev`) | | `mrx_br_pilot_post` (Lark may be gone) |

Every `mrx_*` flag is read by another event, so the feature adds no new orphan flags.

## Build, lint, test

```sh
node tools/build.mjs --out=/tmp/ardan/40-memory-regional-b/x.html --only=memory-regional-b
node tools/lint-events.mjs --feature=memory-regional-b --html=/tmp/ardan/40-memory-regional-b/x.html
node tests/run.mjs /tmp/ardan/40-memory-regional-b/x.html --features=memory-regional-b,content-fixes --only=boot,tokens,mrxMemory
```

The lint warns that none of the 53 events can fire for its 8 stock characters. That is expected, because
every cond needs history. While the folder holds `.wip`, the test runner skips `mrxMemory` unless the
feature is named with `--features`.

`mrxMemory` (in `test.mjs`) runs four passes:

1. **Static.** Checks the `mrx_` prefix, unique ids, `w` of 2 or 3, `once`, the timed flag gate, 2 to 4
   choices, the 80/12/45 word budgets, at least one lasting mark per event, and the house tics.
2. **Coverage.** Each of the 27 chunk flags is read by an `mrx_` event's cond. Every `mrx_*` flag is read.
   There are at least 5 arcs.
3. **Play.** For each event it builds a character in the right realm and age with the flags set N years
   back, renders it, then takes every choice on both its win and lose branch (`A.checkOdds` forced). It
   checks for engine errors, raw tokens, the flags and relations each branch should set, and every text
   variant: known person or stranger, with or without history.
4. **Continuity.** It runs the real setter (`ss_ab_sealed`, `ss_br_wheresleeps`) and each arc's first step,
   moves time forward 12 years, then fires the callback. The person who comes back must be the one linked
   when the flag was set.

Current result: 53 events, 216 branches taken, 212 text variants rendered, 8 people carried across years,
0 problems. A mutation check (an unread flag, a renamed gate, a raw token, an outcome that is too long)
makes it fail as it should.

## Backtest

36 simulated lives: 6 realms × peasant/merchant/noble × 2, each with the chunk flags set a year before the
start, 16 years each, played by the engine's own roller (`A.advance` + `A.eventAuto`, with `evFit`
weights):

- 35 of the 53 events fired naturally, 78 firings in all.
- Callbacks reached all three classes.
- Arc second steps fired in normal play (`mrx_sb_oilyard_count`, `mrx_sk_rescued_dwarves`,
  `mrx_rp_unbound_gate`, `mrx_br_forty_stone`).
- First firings landed 1 to 15 years after the flag (median about 8).
- The other suites still pass with the feature in: `lives`, `saveRoundTrip`, `renderRng`,
  `replayWithRender` and `journalReplay`.
