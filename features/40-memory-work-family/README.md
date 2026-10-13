# 40-memory-work-family: callbacks for the work and family orphan flags

The release sets 31 flags in its work (`wk_`), family (`fm_`), war-and-crime (`wr_`) and court (`ct_`) events that
no event ever reads. A player who freed a house slave's secret, swore a pilot's oath or kept an old charter as a
bargaining chip never hears of it again. This feature adds **53 events** (prefix `mwf_`) that bring each of those
moments back years later, by its place, its people and the thing that was done, and ask for a new decision.

- **Every one of the 31 flags is read**, by 41 first-level callbacks (1.32 per flag).
- **11 two-step arcs**: a callback sets an `mwf_` flag that a second event reads years later. One arc has a third
  step, a scheduled event (`mwf_price_free`) that frees a slave three years after a bargain.
- **Aspect served:** memory and consequence (the Road to Ten's "the world remembers" bar). It follows the
  storylet practice of King of Dragon Pass, Failbetter's quality-based narrative and CK3's story cycles: a
  remembered quality gates the storylet, the storylet changes qualities, and the change gates the next one.
- **Measured by:** the `mwfMemory` test below, and the bench's `events` module (orphan flags, memory links).

## Rules every event follows

| Rule | How |
| --- | --- |
| Reads the memory | `cond` reads the flag with `C.flag(p, "x")`, so `B.memoryIndex()` sees the link |
| Timed | `A.S.year - p.flags.x >= N`, N between 2 and 10 (the `clan` flag holds a clan name, so it times from `p.flags.ev.fm_orc_clan`) |
| Keeps the setter's world | same realm (Sabena `POL-16` for the Commons, never Varenna `POL-03` for the stolen wheel), same race (orc, elf, giant), same stage and trade (slave, sailor, pirate, healer, soldier, noble) |
| Surfaces | `w: 3` and `once: true`: a memory competes with a large pool of ordinary events every year, so it gets the top weight the brief allows |
| Real stakes | 2 to 4 choices, at least one leaves a lasting mark: a trait, an `mwf_` flag, a relation with `ctx.pid`, a wound, a deed or epithet, a debt (`owed`), an asset, a job, a marriage or divorce, freedom, or a death |
| People | linked people are found again (the old pilot by `occ`, the lover by `rel.since`, the dead friend by `died`, the faction rival by `rel.since`, kin by `parents`/`sibling`); new people are made with a role (`flags.mwf_role`) so the arc's second step finds them; kinship relations are never overwritten |
| Voice | text 40-67 words (limit 80), labels at most 12, outcomes at most 45; no "Nobody...", no "for the rest of your life" |

## Flag -> callback events

| Flag (setter) | Callbacks | Arc step(s) |
| --- | --- | --- |
| `wk_favored` (wk_slave_house) | `mwf_favored_widow` | `mwf_fav_will` -> `mwf_favored_will` |
| `wk_price75` (wk_slave_price) | `mwf_price_word` | `mwf_price_wait` -> `mwf_price_heir`; `mwf_price_steward` -> `mwf_price_free` (scheduled) |
| `wk_good_horse` (wk_herd_horsefair) | `mwf_dun_offer` | `mwf_dun_stud` -> `mwf_dun_get` |
| `wk_commons` (wk_ostra_commons) | `mwf_commons_again` | `mwf_commons_front` -> `mwf_commons_seat` |
| `wk_wheel` (wk_craft_wheel) | `mwf_wheel_spinners` | `mwf_wheel_taught` -> `mwf_wheel_blue` |
| `wk_lodestone` (wk_sea_lodestone) | `mwf_needle_fog`, `mwf_needle_heir` | `mwf_needle_shown` -> `mwf_needle_guild` |
| `wk_redsail` (wk_sea_share) | `mwf_redsail_names`, `mwf_redsail_page` | |
| `wk_knows_secret` (wk_serv_secret) | `mwf_linen_lawyer` | |
| `wk_washes` (wk_heal_fever) | `mwf_wash_college` | `mwf_wash_taught` -> `mwf_wash_order` |
| `fm_asked_wait` (fm_lover_proposes) | `mwf_wait_ribbon`, `mwf_wait_banns` | |
| `fm_other_affair` (fm_lover_married) | `mwf_affair_basket` | |
| `clan` (fm_orc_clan) | `mwf_clan_spring` | |
| `fm_my_line` (fm_elf_no_rite) | `mwf_elf_last_line` | |
| `fm_thing_wait` (fm_giant_thing) | `mwf_thing_second` | |
| `fm_affair` (fm_temptation) | `mwf_affair_doors` | `mwf_affair_promise` -> `mwf_affair_breadstall` |
| `tryChild` (fm_childless) | `mwf_shrine_tithe` (a child came), `mwf_shrine_empty` (none did) | |
| `fm_promise` (fm_friend_dying) | `mwf_promise_eldest` | `mwf_promise_ward` -> `mwf_promise_grown` |
| `wr_capt_enemy` (wr_cruel_captain) | `mwf_capt_ladder` (still serving, at war), `mwf_capt_drummer` (left the army) | |
| `wr_merc_thoughts` (wr_lowborn) | `mwf_plough_sergeant` (crown), `mwf_plough_inspection` (now a Free Company man) | |
| `wr_boy` (wr_camp_boy) | `mwf_camp_boy_purse` (serving), `mwf_camp_boy_naming` (left the army) | |
| `wr_mutineer` (wr_merc_unpaid, wr_crown_unpaid) | `mwf_mutiny_rolls` | |
| `wr_lifedebt` (wr_ford_rescue) | `mwf_lifedebt_oath`, `mwf_lifedebt_river` | |
| `wr_traitor` (wr_hf_spy) | `mwf_peddler_boots` | `mwf_traitor_paid` -> `mwf_peddler_friend` |
| `wr_boss_enemy` (wr_heist) | `mwf_boss_cellars` | |
| `wr_informer` (wr_informer) | `mwf_lamp_branded` | |
| `wr_marches` (wr_outlaw_marches) | `mwf_marches_reeve` | |
| `ct_refused` (ct_scutage) | `mwf_writ_second` | `mwf_refused_twice` -> `mwf_writ_third` |
| `ct_faction` (ct_factions) | `mwf_faction_vote`, `mwf_faction_suit` | |
| `ct_party` (ct_sibling_throne, ct_claim_throne) | `mwf_party_cell` | |
| `disinherited` (ct_disinherit_threat) | `mwf_disinherit_stairs`, `mwf_disinherit_heir` | |
| `ct_charter` (ct_old_charter) | `mwf_charter_price` | |

## The arcs

| Arc | Step 1 (choice) | Years | Step 2 |
| --- | --- | --- | --- |
| The will | `mwf_favored_widow` "Ask her to write your freedom into her will" (won) | 4 | `mwf_favored_will`: she dies; the magistrate, the steward's bribe, or the road |
| The price | `mwf_price_word` "Take the rag back... wait for his heir" | 3 | `mwf_price_heir`: the son's ledger; pay, serve three years, or demand it free |
| The steward | `mwf_price_heir` "Serve him three years as steward" | 3 (scheduled) | `mwf_price_free`: the date under the line |
| The duns | `mwf_dun_offer` "Keep him, and put him to the mares" (or win the race) | 4 | `mwf_dun_get`: the crown's remount writ |
| The seat | `mwf_commons_again` "Take your place in the front rank" (won) | 3 | `mwf_commons_seat`: wool among the silk |
| The wheel | `mwf_wheel_spinners` "Show them" or "Build them wheels" | 3 | `mwf_wheel_blue`: the Palella guild's man |
| The needle | `mwf_needle_fog` "Float the needle in a bowl on deck" | 3 | `mwf_needle_guild`: oathbreaker |
| The cure | `mwf_wash_college` "Write it down" (won) or "Teach the midwives" | 4 | `mwf_wash_order`: the college wants it |
| The promise | `mwf_affair_doors` "Promise: next spring" | 2 | `mwf_affair_breadstall`: told at the bread stall |
| The ward | `mwf_promise_eldest` "Take them in and teach them" | 5 | `mwf_promise_grown`: portion, adoption, or refusal |
| The peddler | `mwf_peddler_boots` "Pay him to forget your name" | 2 | `mwf_peddler_friend`: the price goes up |
| The writs | `mwf_writ_second` "Refuse again, in your own hand" | 2 | `mwf_writ_third`: the serjeant and the keys |

Several callbacks also hand the player back to the release's own systems: a runaway gets the `outlaw` flag that
`wr_outlaw_marches` and the crime events read; a reeve who takes the staff under a true name may become an outlaw
again; the Company sergeant uses `A.resign`/`A.enlist`; the third writ can raise faction discontent.

## Files

| File | What |
| --- | --- |
| `work-family.events.js` | the 53 events, with small helpers at the top (finding the linked people, marriage, freedom, foes with a role) |
| `test.mjs` | `mwfMemory`: registration, flag coverage, a fixture per event played through every branch, the 12 arcs, and the craft rules |

## Checks

```sh
node tools/build.mjs --out=/tmp/ardan/40-memory-work-family/x.html --only=memory-work-family
node tools/lint-events.mjs --feature=memory-work-family --html=/tmp/ardan/40-memory-work-family/x.html
node tests/run.mjs /tmp/ardan/40-memory-work-family/x.html --features=content-fixes,memory-work-family --only=boot,tokens,mwfMemory
```

The linter's dynamic pass finds none of these events eligible for its eight fresh characters (each needs years of
history), so `mwfMemory` builds that history itself. For each event a fixture makes a character who qualifies (a
slave of the Spice Coast with 75 suns and a two-year-old bargain, an orc husband three winters at the Red Wolf
fire, a sailor with a pilot mentor, a noble with a refused writ). The test then checks that the cond holds, that
`A.evFit` does not hide the event from that character, and that the engine renders it without skipping. It takes
every choice, and plays checks both won and lost by pinning `A.chance`, and fails on engine errors, raw `{tokens}`,
word-diet breaches, or a kinship relation (parent, sibling, child) overwritten by an outcome. Last, it plays each
arc's first step and moves the clock forward to confirm that the second step becomes eligible and renders. It
also builds the same history in the wrong world (a birth-clan orc, the wheel inside Varenna, the Commons outside
Sabena, a free peasant holding a slave's bargain, the ladder at peace, a callback a year too soon) and requires each
to stay ineligible. Its `data.samples` holds every rendered text and outcome for review.

While the folder carries the orchestrator's `.wip` marker, `tests/run.mjs` loads this test only when the feature is
named with `--features` (as in the commands above).

## Backtest

Measured with the bench's own bot (`bench/bot.mjs`, `B.memoryIndex()`), comparing the fix layer alone to the fix
layer plus this feature:

| | Fix layer | + memory-work-family |
| --- | --- | --- |
| Events | 3199 | 3252 |
| Memory events (read another event's flag) | 95 | 148 |
| Orphan flags (set, never read) | 369 | 338 |
| This chunk's flags still orphaned | 31 | 0 |
| New orphan flags introduced | | 0 |

In 24 passive 70-year bot lives across 12 starts (including a Spice Coast slave, a Sabena commoner, a Blackreef
coast-dweller and a giant), 10 lives set one of these flags and 6 of them met a callback (7 fired), with no page
errors. The full regression suite (core suites, the fix layer's tests and `mwfMemory`, 17 tests) passes on the
feature build.
