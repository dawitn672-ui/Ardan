# 80-callbacks: one callback for every orphan flag

**Aspect:** Events (Road to Ten: memory; the scorecard's static memory share and orphan flags) · **Kind:** an event pack (177 events, prefix `cb_`) and a small helper (`callbacks.core.js`, `A.CB`). No patches.

Before this feature, 213 flags in the full build were set by some event and read by none: the arc endings of
`50-arcs-kin`, `51-arcs-rivals` and `53-arcs-things`, the marks of `74-old-age` and `21-npc-initiative`, and about
130 flags from the release's family (`hs_`), realm (`ww_`), career (`cm_`, `ln_`, `sc_`), plot (`pl_`), ambition
(`pa_`) and duty (`fl_`, `du_`) packs. A player who swore peace at the ford, kept the forged charter, drove the copper
north or buried the false relic never heard of it again. Each `cb_` event brings one of those moments back years later,
as a person from it, a consequence of it or the name it left, and asks for a new decision.

## Rules every event follows

| Rule | How |
| --- | --- |
| Reads the memory | `cond` reads the flag with `C.flag(p, "x")`; an old-age or bond mark with `had(p, "k")` (74-old-age keeps marks on `pc.oa.m`, 21-npc-initiative on `pc.rel[id]`), which the bench reads as the mark `la_k` |
| Timed | `since(p, "x") >= N` (years since the flag's year), N from 1 to 8 by how long the consequence takes; marks by `pc.oa.m[k]` or the bond's year |
| Faithful | each text was written from the setter's own text and the choice that set the flag: the people (Benno Marin, Silas Vane, Sten the Quiet, the Marroks), the place and the thing done. Where several choices set one flag, the text names only what they share |
| People | the arc's own person is found again: `pc.arcs[k].who[role]` (kin arcs: the heir, the cousin, the sibling, the carter's child), `pc.arcs[k].ar.who[role]` (rivals: the house, the lender), `pc.arcs[k].pid` (things: the tenant, the thief, the minstrel). `ctx.pid` is set, so `fx.them` moves the real bond; if the person is gone, a plain phrase stands in. A scene that kills someone does it in its setup (the drunk spouse, the brother from the galleys) |
| Surfaces | `w: 3`, `once: true`, like the other memory packs: a memory competes with hundreds of ordinary events |
| Real choices | 2 to 4 choices that trade coin against honour, the family against the law, safety against a bond; `tools/lint-choices.mjs` finds no obviously best choice |
| Classes | conds use `C.*` helpers (`C.noble`, `C.ruler`, `C.old`, `C.race`, `C.soldier`), so `A.CX_RX` classes them; `free(p, C)` is `C.adult(p) && !C.prison(p)` |
| Voice | texts 39 to 68 words before names are filled (limit 80 rendered), labels at most 12 words, rendered with every fallback name; no "looks at you a long time", no "for the rest of your life" |

## Measured by

| Number (full build, every non-wip feature) | Before | After |
| --- | --- | --- |
| Orphan flags (`B.memoryIndex().orphan`) | **213** (205 plain, 8 marks) | **36** |
| Memory events | 880 | 1,057 |
| Active events | 3,441 | 3,618 |
| Static memory share | **25.6%** | **29.2%** |

Measured with the coordinator's probe (`/tmp/ardan/int/orph.mjs`, which calls `bench/bot.mjs`'s `memoryIndex`) on
the same feature set built without and with this folder.

**The 36 left** are not reachable by a callback that could fire:

- 34 flags are set only by events `58-event-cut` retired (`ww_ald_owlseen`, `hs_charter_lost`, `pa_staff`,
  `sc_testpiece` and the like). Those events never roll, so nothing sets the flag in play; a callback would be dead
  content. The index still counts them because it does not skip retired setters. Making `memoryIndex` ignore a setter
  in `A.EV_RETIRED` (a one-line change in `bench/bot.mjs`, not this folder's to make) would take them off the count.
- `unfree` and `patron` hold a state, not a year, and the index filters them out of its reads on purpose.

**40% is not reachable by callbacks alone.** At 3,618 active events, 40% needs about 1,450 memory events, some 390
more. There are no orphans left to call back to, so the rest has to come from events that already exist reading
history (as `67-memory-weave` does at run time), not from new ones.

**How often the source flags are set** (64 bot lives of the league's starts and personalities, 90 years each, full
build): 56 of the 177 were set at least once. The most common: `fl_warden` 15, `ao_ship_bribed` 7, `oa_words_kind` 7,
`fl_forgery` 6, `ak_feud_peace` 6, `ao_portrait_sold` 5, `ao_hoard_church` 5, `hs_knows_secret` 4, `ak_inh_mill` 4.
The release's career and realm flags (`cm_`, `ln_`, `sc_`, `ww_`) are set by events gated to one trade or one realm,
and the bots rarely live those lives; they are called back anyway, so a player who does is answered.

`test.mjs` (on a full build with this folder):

| Test | What it checks | Result |
| --- | --- | --- |
| `cbFlagsRead` | every `cb_` event is registered and reads a memory; every memory read is set by a live (not retired, not `cb_`) event; the bench counts each one as a memory event; none of the flags read is still an orphan | 177 events read 177 memories, each set by a live event |
| `cbPlay` | every event under three characters (peasant 34, noble 70, dwarf artisan 90) with its memory set ten years back: renders without a skip, no raw token, text within 80 words, labels within 12; every choice played, checks both won and lost, no engine error | 531 renders, 1,893 branches, 495 conds held |
| `cbBotLives` | four passive bot lives with eight of these memories seeded at birth: no page error, callbacks fire | 4 lives (141 years), 16 callbacks fired, 16 kinds |

Lint: `tools/lint-events.mjs` passes (177 events, 1,137 renders, 0 errors; 12 events need an old character or a ruler
and were not eligible for the linter's eight, which `cbPlay` covers). `tools/lint-choices.mjs` finds 0 obviously best
choices (55 compared by numbers, 2 unreadable).

Gates, on a full build with this folder (`node tools/build.mjs --out=/tmp/ardan/cb/full2.html --include-wip --without=pacing`):
`node tests/run.mjs /tmp/ardan/cb/full2.html --features=callbacks` passes all 7 (boot, lives, saveRoundTrip, uiSmoke and
the three above). `bench/balance.mjs` (12 lives a start): all 28 numbers inside their bands, 0 page errors (for
example merchant median peak coin 471,737 in 50,000-900,000; check win rate 47.5% in 30-70).

## Flag -> callback

Setter events are the live ones (retired setters left out). "Bots" is how many of 64 bot lives ended with the flag set.

| Flag | Set by | Callback | Title | Bots |
| --- | --- | --- | --- | --- |
| `ak_feud_peace` | `ak_feud_6` | `cb_ak_feud_peace` | The peace at the ford | 6 |
| `ak_sec_settled` | `ak_secret_5` | `cb_ak_sec_settled` | A christening at {town} | 1 |
| `ak_sec_denied` | `ak_secret_5` | `cb_ak_sec_denied` | A face at the door | 0 |
| `ak_inh_mill` | `ak_inherit_4` | `cb_ak_inh_mill` | The dry race | 4 |
| `ak_inh_gave` | `ak_inherit_4` | `cb_ak_inh_gave` | Your godchild | 0 |
| `ak_inh_lost` | `ak_inherit_4` | `cb_ak_inh_lost` | The mill for sale | 1 |
| `ak_sib_sworn` | `ak_sibling_5` | `cb_ak_sib_sworn` | An old shipmate | 1 |
| `ak_sib_gone` | `ak_sibling_5` | `cb_ak_sib_gone` | A letter from a southern port | 1 |
| `ak_sib_denied` | `ak_sibling_5` | `cb_ak_sib_denied` | Next of kin | 0 |
| `ak_mt_annulled` | `ak_match_4` | `cb_ak_mt_annulled` | A second match | 0 |
| `ak_mt_upheld` | `ak_match_4` | `cb_ak_mt_upheld` | The widow comes home | 0 |
| `ak_mt_kept` | `ak_match_4` | `cb_ak_mt_kept` | A husband at the gate | 0 |
| `ak_mt_sent` | `ak_match_4` | `cb_ak_mt_sent` | The letters stop | 0 |
| `ak_bas_named` | `ak_bastard_4` | `cb_ak_bas_named` | Your cousin's quarrel | 2 |
| `ak_bas_judged` | `ak_bastard_4` | `cb_ak_bas_judged` | The claimant's son | 0 |
| `ak_bas_bought` | `ak_bastard_4` | `cb_ak_bas_bought` | Your story, sung back | 1 |
| `ak_bl_ordered` | `ak_blood_5` | `cb_ak_bl_ordered` | The same hands | 1 |
| `ak_bl_spent` | `ak_blood_5` | `cb_ak_bl_spent` | The grey horse's bill | 1 |
| `ak_bl_given` | `ak_blood_5` | `cb_ak_bl_given` | The physician calls | 0 |
| `ak_ad_named` | `ak_adopt_5` | `cb_ak_ad_named` | The carter's brother | 2 |
| `ak_ad_carter` | `ak_adopt_5` | `cb_ak_ad_carter` | A second wagon | 2 |
| `ak_ad_refused` | `ak_adopt_5` | `cb_ak_ad_refused` | A soldier on the road | 0 |
| `ak_el_home` | `ak_elope_4` | `cb_ak_el_home` | The reeve's chair | 2 |
| `ak_el_away` | `ak_elope_4` | `cb_ak_el_away` | The funeral at home | 1 |
| `ak_el_parted` | `ak_elope_4` | `cb_ak_el_parted` | A widow at the mill | 0 |
| `ak_will_righted` | `ak_will_4` | `cb_ak_will_righted` | Pigs on the step | 3 |
| `ak_will_burned` | `ak_will_4` | `cb_ak_will_burned` | The companion remembers | 0 |
| `ak_will_paid` | `ak_will_4` | `cb_ak_will_paid` | The road frontage | 0 |
| `ak_dw_wed` | `ak_dowry_4` | `cb_ak_dw_wed` | The red cow's calf | 1 |
| `ak_dw_paid` | `ak_dowry_4` | `cb_ak_dw_paid` | A second paper | 1 |
| `ak_dw_cow` | `ak_dowry_4` | `cb_ak_dw_cow` | Of the Red Cow | 1 |
| `ak_dw_passed` | `ak_dowry_4` | `cb_ak_dw_passed` | The paper in the chest | 0 |
| `ak_land_given` | `ak_land_4` | `cb_ak_land_given` | The cottager's will | 1 |
| `ak_land_sold` | `ak_land_4` | `cb_ak_land_sold` | The abbey's plough | 1 |
| `ak_land_moved` | `ak_land_4` | `cb_ak_land_moved` | Your people's stones | 0 |
| `ak_sf_gift` | `ak_second_4` | `cb_ak_sf_gift` | The long letter | 1 |
| `ak_sf_denied` | `ak_second_4` | `cb_ak_sf_denied` | A loan from the other house | 1 |
| `ao_kestrel_given` | `ao_sword_6` | `cb_ao_kestrel_given` | The Marroks' feast | 0 |
| `ao_kestrel_song` | `ao_sword_6` | `cb_ao_kestrel_song` | The song with you in it | 1 |
| `ao_kestrel_copy` | `ao_sword_6` | `cb_ao_kestrel_copy` | The balance of the blade | 0 |
| `ao_map_lost` | `ao_map_4` | `cb_ao_map_lost` | The split oak falls | 1 |
| `ao_map_gave` | `ao_map_4` | `cb_ao_map_gave` | The tenant's daughter | 1 |
| `ao_map_sold` | `ao_map_4` | `cb_ao_map_sold` | The lord's new fence | 1 |
| `ao_ruin_house` | `ao_ruin_4` | `cb_ao_ruin_house` | Under the floor | 3 |
| `ao_ruin_sold` | `ao_ruin_4` | `cb_ao_ruin_sold` | The new aisle | 1 |
| `ao_ruin_given` | `ao_ruin_4` | `cb_ao_ruin_given` | Under the yew | 0 |
| `ao_relic_shrine` | `ao_relic_5` | `cb_ao_relic_shrine` | The bishop's visitor | 2 |
| `ao_relic_buried` | `ao_relic_5` | `cb_ao_relic_buried` | Flowers on a stranger's grave | 0 |
| `ao_mill_miller` | `ao_mill_5` | `cb_ao_mill_miller` | The lawful toll | 3 |
| `ao_mill_enemy` | `ao_mill_5` | `cb_ao_mill_enemy` | The steward's lease | 0 |
| `ao_mill_curse` | `ao_mill_5` | `cb_ao_mill_curse` | Another miller | 2 |
| `ao_horse_hanged` | `ao_horse_4` | `cb_ao_horse_hanged` | The thief's children | 3 |
| `ao_horse_mercy` | `ao_horse_4` | `cb_ao_horse_mercy` | A brand on the hand | 1 |
| `ao_horse_given` | `ao_horse_4` | `cb_ao_horse_given` | Your horse comes back | 0 |
| `ao_portrait_kin` | `ao_portrait_4` | `cb_ao_portrait_kin` | The cousins' price | 0 |
| `ao_portrait_sold` | `ao_portrait_4` | `cb_ao_portrait_sold` | The lawyer's second visit | 5 |
| `ao_portrait_secret` | `ao_portrait_4` | `cb_ao_portrait_secret` | A stranger with your nose | 0 |
| `ao_portrait_own` | `ao_portrait_4` | `cb_ao_portrait_own` | The house asks again | 1 |
| `ao_ship_house` | `ao_ship_5` | `cb_ao_ship_house` | The master's wife | 1 |
| `ao_ship_bribed` | `ao_ship_5` | `cb_ao_ship_bribed` | The Patience in a southern harbour | 7 |
| `ao_ship_told` | `ao_ship_5` | `cb_ao_ship_told` | Shares in a new ship | 0 |
| `ao_song_name` | `ao_song_3` | `cb_ao_song_name` | Living up to it | 2 |
| `ao_song_capital` | `ao_song_3` | `cb_ao_song_capital` | A stranger knows your name | 1 |
| `ao_song_bought` | `ao_song_3` | `cb_ao_song_bought` | Children in the lane | 0 |
| `ao_song_friend` | `ao_song_3` | `cb_ao_song_friend` | The minstrel's winter | 1 |
| `ao_hoard_land` | `ao_hoard_4` | `cb_ao_hoard_land` | The widow's son | 0 |
| `ao_hoard_buried` | `ao_hoard_4` | `cb_ao_hoard_buried` | The one who knows where | 0 |
| `ao_hoard_church` | `ao_hoard_4` | `cb_ao_hoard_church` | The priest's question | 5 |
| `ao_hoard_coin` | `ao_hoard_4` | `cb_ao_hoard_coin` | The dead king's face | 2 |
| `ao_book_school` | `ao_book_4` | `cb_ao_book_school` | The child who reads too well | 2 |
| `ao_book_sent` | `ao_book_4` | `cb_ao_book_sent` | The book comes back | 0 |
| `ao_book_quiet` | `ao_book_4` | `cb_ao_book_quiet` | The new bishop | 3 |
| `ao_book_preached` | `ao_book_4` | `cb_ao_book_preached` | The bishop's summons | 2 |
| `ao_bell_saint` | `ao_bell_4` | `cb_ao_bell_saint` | The priest's gratitude | 2 |
| `ao_bridge_carter` | `ao_bridge_5` | `cb_ao_bridge_carter` | The carter's widow | 0 |
| `ao_bridge_inn` | `ao_bridge_5` | `cb_ao_bridge_inn` | The bridgehead | 0 |
| `ar_house_peace` | `ar_ven_6` | `cb_ar_house_peace` | A wedding between the houses | 1 |
| `ar_lender_clerk` | `ar_debt_5` | `cb_ar_lender_clerk` | Every name in the book | 0 |
| `ar_debt_free` | `ar_debt_5` | `cb_ar_debt_free` | Two rooms and an offer | 0 |
| `la_contract` | `oa_kin_contract` | `cb_oa_contract` | The room by the chimney | 0 |
| `la_trust` | `oa_kin_contract` | `cb_oa_trust` | The low field sold | 0 |
| `la_kestrel_heir` | `oa_hand_kestrel` | `cb_oa_kestrel_heir` | The true story, retold | 0 |
| `la_kestrel_home` | `oa_hand_kestrel` | `cb_oa_kestrel_home` | A friend in the Marroks' house | 0 |
| `la_kestrel_grave` | `oa_hand_kestrel` | `cb_oa_kestrel_grave` | The monk's objection | 0 |
| `la_late_love` | `oa_late_love` | `cb_oa_late_love` | A second winter together | 0 |
| `oa_words_kind` | `oa_deathbed` | `cb_oa_words_kind` | After the kind words | 7 |
| `oa_words_true` | `oa_deathbed` | `cb_oa_words_true` | The thing you said | 2 |
| `la_niConf` | `ni_confide` | `cb_ni_conf` | What you were told | 0 |
| `la_niTold` | `ni_confide` | `cb_ni_told` | What {nm} knows | 0 |
| `hs_knows_secret` | `hs_secret_out`, `hs_k_overheard` +3 | `cb_hs_knows_secret` | The cousin who wants to know | 4 |
| `hs_cut_off` | `hs_cut_off` | `cb_hs_cut_off` | The reading of the will | 0 |
| `hs_shares` | `hs_sibling_heir` | `cb_hs_shares` | The favourite's offer | 0 |
| `hs_free_path` | `hs_t_expected`, `hs_m_office` +3 | `cb_hs_free_path` | The road you chose | 0 |
| `hs_secret_love` | `hs_t_forbidden_love` | `cb_hs_secret_love` | Notes under a stone | 0 |
| `hs_suspect` | `hs_n_hostage`, `hs_n_turncoat` +5 | `cb_hs_suspect` | The liege's guest | 0 |
| `hs_cadet` | `hs_n_cadet` | `cb_hs_cadet` | The main line falters | 0 |
| `hs_post_shaky` | `hs_m_rival_post` | `cb_hs_post_shaky` | The generals decide | 2 |
| `hs_council` | `hs_mc_council` | `cb_hs_council` | The bridge toll | 0 |
| `hs_heir_named` | `hs_mc_heir`, `hs_hd_successor` | `cb_hs_heir_named` | The heir's ledger | 0 |
| `hs_warden` | `hs_g_chair` | `cb_hs_warden` | A friend's bad work | 0 |
| `hs_blooded` | `hs_o_first_job` | `cb_hs_blooded` | The bigger job | 0 |
| `hs_honest_one` | `hs_o_first_job` | `cb_hs_honest_one` | The watch-captain's question | 0 |
| `hs_found_lamp` | `hs_o_informer` | `cb_hs_found_lamp` | The lamp comes back | 0 |
| `hs_found_branch` | `hs_dw_vault` | `cb_hs_found_branch` | The forgotten branch | 0 |
| `ww_sol_noonknight` | `ww_sol_noonhall` | `cb_ww_sol_noonknight` | A white surcoat, grown grey | 0 |
| `ww_lu_rat` | `ww_lu_pilerats` | `cb_ww_lu_rat` | Benno remembers you | 0 |
| `ww_lu_clerk` | `ww_lu_drowned` | `cb_ww_lu_clerk` | The clerk's widow | 0 |
| `ww_lu_pilot` | `ww_lu_pilots` | `cb_ww_lu_pilot` | An offer for the needle | 0 |
| `ww_nr_balance` | `ww_nr_balance` | `cb_ww_nr_balance` | The weigher's place | 0 |
| `ww_hl_chest` | `ww_hl_mulechest` | `cb_ww_hl_chest` | The names in the chest | 0 |
| `ww_hl_drakeseen` | `ww_hl_drakes` | `cb_ww_hl_drakeseen` | A scholar of drakes | 0 |
| `ww_mh_lookout` | `ww_mh_fareyes` | `cb_ww_mh_lookout` | A signal at dusk | 0 |
| `ww_mh_felano` | `ww_mh_felano` | `cb_ww_mh_felano` | The king's list | 0 |
| `ww_vg_sulfurcove` | `ww_vg_sulfur` | `cb_ww_vg_sulfurcove` | Hulls stacked with pitch | 0 |
| `ww_ts_engine` | `ww_ts_engineyard` | `cb_ww_ts_engine` | Vane's drawings | 0 |
| `ww_ts_cellar` | `ww_ts_engineyard` | `cb_ww_ts_cellar` | Lamp oil | 0 |
| `ww_ts_copper` | `ww_ts_copper` | `cb_ww_ts_copper` | The marshal's inquiry | 0 |
| `ww_ai_seedling` | `ww_ai_seedling` | `cb_ww_ai_seedling` | The Keshi captain returns | 0 |
| `cm_council` | `cm_merchant_council_seat` | `cb_cm_council` | The long table votes | 0 |
| `cm_mutineer` | `cm_sailor_mutiny` | `cb_cm_mutineer` | The old master's writ | 0 |
| `cm_redsail` | `cm_pirate_articles`, `cm_pirate_captains_table` | `cb_cm_redsail` | Redsail's vote | 0 |
| `cm_ratrock` | `cm_pirate_articles` | `cb_cm_ratrock` | What the rafts are for | 0 |
| `cm_forty` | `cm_pirate_dragon_night` | `cb_cm_forty` | A stone and a rope | 0 |
| `cm_traitor` | `cm_pirate_stamped_jar`, `cm_pirate_contract_1011` | `cb_cm_traitor` | The Forty are asking | 0 |
| `cm_fen` | `cm_farm_drain_fen` | `cb_cm_fen` | The wet spring | 0 |
| `cm_line` | `cm_herd_famous_line` | `cb_cm_line` | The old sire | 0 |
| `cm_eyrie` | `cm_hunter_falcons` | `cb_cm_eyrie` | The lord's falconer | 0 |
| `cm_horseline` | `cm_horse_bloodline` | `cb_cm_horseline` | The cavalry's price | 0 |
| `cm_tirana` | `cm_explorer_widow_gold` | `cb_cm_tirana` | The fifth expedition | 0 |
| `cm_ledger` | `cm_bounty_debt_hounds` | `cb_cm_ledger` | One page of a ledger | 0 |
| `cm_cook` | `cm_bounty_cook` | `cb_cm_cook` | What the cook knew | 0 |
| `ln_code` | `ln_law_code` | `cb_ln_code` | Your clause, read back | 0 |
| `ln_treatise` | `ln_heal_treatise` | `cb_ln_treatise` | A student's letter | 0 |
| `ln_read_heresy` | `ln_cl_heresy`, `ln_tch_forbidden` | `cb_ln_read_heresy` | The inquisitor's list | 0 |
| `ln_survey` | `ln_stw_survey` | `cb_ln_survey` | The roll in the chest | 0 |
| `ln_heard` | `ln_crt_cupbearer` | `cb_ln_heard` | The fallen lord's son | 0 |
| `ln_letter` | `ln_crt_letter_carry`, `ln_crt_letter` | `cb_ln_letter` | Insurance | 0 |
| `ln_prince` | `ln_tch_prince` | `cb_ln_prince` | Your old pupil | 0 |
| `ln_grammar` | `ln_tch_grammar` | `cb_ln_grammar` | A child with your book | 0 |
| `ln_made_lord` | `ln_min_makes_lord` | `cb_ln_made_lord` | The knight remembers | 0 |
| `ln_song_truth` | `ln_min_truth` | `cb_ln_song_truth` | The scholar's records | 0 |
| `ln_charter` | `ln_scr_charter` | `cb_ln_charter` | A year and a day | 0 |
| `ln_chronicle` | `ln_scr_chronicle` | `cb_ln_chronicle` | The chronicle, copied | 0 |
| `ln_paper` | `ln_scr_paper` | `cb_ln_paper` | The Qadiri envoy | 0 |
| `ln_broken_vow` | `ln_d_cl_vow` | `cb_ln_broken_vow` | The face at the rail, again | 0 |
| `ln_memoir` | `ln_d_crt_memoir` | `cb_ln_memoir` | Fifty years of court | 0 |
| `sc_lamp` | `sc_th_clippers` | `cb_sc_lamp` | The clippers' cousin | 0 |
| `sc_two_masters` | `sc_sp_tongues` | `cb_sc_two_masters` | Both buyers at once | 0 |
| `sc_warned_house` | `sc_sp_bottle` | `cb_sc_warned_house` | The lord who owes you | 0 |
| `sc_double` | `sc_sp_turn` | `cb_sc_double` | Two people | 0 |
| `sc_turncoat` | `sc_sp_turn` | `cb_sc_turncoat` | A knife under the pillow | 0 |
| `sc_warned_lord` | `sc_sp_proof` | `cb_sc_warned_lord` | A friend in the trade | 0 |
| `sc_traitor` | `sc_sp_secret` | `cb_sc_traitor` | The second purse | 0 |
| `sc_turned_agent` | `sc_sp_cellar` | `cb_sc_turned_agent` | A letter from your agent | 0 |
| `sc_livery` | `sc_kn_retainer` | `cb_sc_livery` | Your lord's feud | 0 |
| `sc_turncloak` | `sc_kn_summons` | `cb_sc_turncloak` | Meeting your own | 0 |
| `sc_forbidden_book` | `sc_ac_library` | `cb_sc_forbidden_book` | The master's question | 0 |
| `sc_suspect` | `sc_fa_heresy`, `sc_fa_doubt` | `cb_sc_suspect` | A fellowship denied | 0 |
| `sc_kept_doubt` | `sc_fa_doubt` | `cb_sc_kept_doubt` | The paper in the lining | 0 |
| `sc_house_secret` | `sc_tr_ledger` | `cb_sc_house_secret` | The clerkship | 0 |
| `sc_sold_secret` | `sc_cr_secret` | `cb_sc_sold_secret` | Your secret, made abroad | 0 |
| `pl_doubleagent` | `pl_captured_spy` | `cb_pl_doubleagent` | The spy asks to come home | 0 |
| `pl_knows_plot` | `pl_secret_letter` | `cb_pl_knows_plot` | The date in the letter | 3 |
| `chapel` | `pa_faith_dream` | `cb_pa_chapel` | Flowers on the old stones | 0 |
| `pa_secret_minister` | `pa_court_scandal` | `cb_pa_secret_minister` | A coin unspent | 0 |
| `pa_general_sworn` | `pa_throne_general` | `cb_pa_general_sworn` | The general's patience | 0 |
| `pa_granaries` | `pa_golden_harvest` | `cb_pa_granaries` | The lean year comes | 0 |
| `fl_forgery` | `du_ct_forged_charter` | `cb_fl_forgery` | Eleven rays | 6 |
| `fl_ledger` | `du_ct_embezzler` | `cb_fl_ledger` | The chancellor's goodwill | 2 |
| `fl_warden` | `du_gd_election` | `cb_fl_warden` | The warden's price list | 15 |
| `fl_sergeant_tip` | `du_cm_sergeant` | `cb_fl_sergeant_tip` | Sergeants who read | 0 |
| `fl_chancellor_errand` | `fl_adv_court` | `cb_fl_chancellor_errand` | Another small matter | 0 |
| `fl_reeve_road` | `fl_adv_common` | `cb_fl_reeve_road` | Bailiff, if you can read | 0 |
| `fl_lay_friend` | `fl_fa_calling` | `cb_fl_lay_friend` | The prior asks a favour | 0 |
| `fl_conspirator` | `fl_sc_plot` | `cb_fl_conspirator` | One more friend | 0 |
| `bt_told_heir` | `bt_tell_heir` | `cb_bt_told_heir` | Your eldest's question | 0 |
| `disowned` | `mrb_fm_free_called` | `cb_disowned` | The allowance stopped | 0 |
