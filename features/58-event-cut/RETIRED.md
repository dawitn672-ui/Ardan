# Retired events: for review

848 of the release's 3199 events (26.5%) are retired from the yearly roll by `features/58-event-cut`. A human should approve or veto this list: to keep an event, delete its line from `list.core.js`. A retired event is not deleted: anything that queues it by id still shows it, and the menu setting "Classic event pool (keep every event)" brings them all back.

How they were chosen (`bench/event-audit.mjs`, then `select.mjs`): only the release's own events were candidates, and never one that a feature wrote, that is only ever queued (a chain's later step), that belongs to a job, duty, path, council or drill pool, whose id appears anywhere else in the game (a chain's `event:`, `A.schedule`, `flags.ev`), that reads an earlier memory, or that sets a flag anything reads. The weakest went first, and every pool kept a floor (see the README). Columns: fired = times the bots met it in 24 lives (1048 years); words = its text; check = it has a skill check (tradeoff = a check whose failure costs, beside a safe choice); best = the choice linter finds an obviously best choice.

## Nudges (N): 229

Every choice only moves stats or skills by 1 or 2, happiness or health by a few points, or coin. Nothing reads its flags, no event or code queues it, and it queues nothing.

| id | title | fired | words | notes |
| --- | --- | --- | --- | --- |
| `av_merc_forage` | Foraging | 0 | 31 |  |
| `av_pedlar_wonders` | A pedlar of wonders | 11 | 21 | check |
| `av_sea_drakes` | Sea drakes | 2 | 34 | tradeoff |
| `av_sea_isleturtle` | The island that sank | 2 | 35 | tradeoff |
| `av_sea_queen` | The Drowned Queen's due | 0 | 38 |  |
| `av_sea_spidercrab` | The thing in the pot | 0 | 30 |  |
| `av_wild_stonering` | The ring of stones | 6 | 31 | check |
| `bd_bear_doorpost` | The doorpost | 0 | 39 | once |
| `bd_child_river` | Summer days | 8 | varies | check |
| `bd_childhood_friend` | A face from childhood | 4 | varies | once |
| `bd_failing_eyes` | The letters swim | 2 | varies | once |
| `bd_falcon_watchroll` | The Tower Watch roll | 0 | 52 | tradeoff, once |
| `bd_oak_thief` | Built to stand | 0 | 29 | tradeoff |
| `bd_old_dignity` | The old one | 2 | varies | tradeoff |
| `bd_wild_deathworm` | The Sand Death-worm | 0 | 54 | tradeoff |
| `bd_wild_griffinbones` | Griffin bones | 0 | 47 | tradeoff |
| `bd_wild_hydra` | The Hydra | 1 | varies | tradeoff |
| `ch_dwarf_apprentice` | Bound to a master | 2 | 49 | once |
| `ch_fam_quarrel` | Voices through the wall | 12 | 23 | tradeoff |
| `ch_fam_sib_fever` | Fever in the house | 17 | 28 |  |
| `ch_learn_priest` | Letters | 0 | 31 | check, once |
| `cm_explorer_notebooks` | Rain on the ink | 0 | 26 | check |
| `cm_farm_army_passes` | The army passes | 0 | 42 | tradeoff |
| `cm_fish_red_sky` | A red morning | 1 | 39 | tradeoff |
| `cm_pirate_dice` | The dice before the raid | 0 | 33 | tradeoff |
| `ct_assassin` | In the dark | 0 | varies | check |
| `ct_bad_omen` | An omen | 0 | varies | check |
| `ct_bastard_rumor` | Whose son? | 0 | varies | check |
| `ct_building` | The master builder | 0 | varies |  |
| `ct_chronicle` | The chronicle | 0 | varies |  |
| `ct_clergy_tax` | The clergy's exemption | 0 | varies | check |
| `ct_corrupt` | A hand in the coffers | 0 | varies | check |
| `ct_council_quarrel` | A quarrel at the council table | 0 | varies | check |
| `ct_crowning` | The crowning | 0 | varies | check, once |
| `ct_debase` | Clipping the coin | 0 | varies | check |
| `ct_foreign_spy` | A spy at court | 0 | varies | check |
| `ct_grain_hoarders` | The grain hoarders | 0 | varies | check |
| `ct_hostage_guest` | The hostage at court | 0 | varies | check |
| `ct_manor_court` | Your manor court | 1 | varies | tradeoff |
| `ct_moon_pearl` | Moon-Pearl | 0 | 43 | check, local |
| `ct_noble_murder` | Blood on a lord's hands | 0 | varies | check |
| `ct_oath_day` | Oath day | 0 | varies | check |
| `ct_old_ruler` | The long reign | 0 | varies |  |
| `ct_patriarch` | The Patriarch's letter | 0 | varies | check, local |
| `ct_peace_offer` | An offer of peace | 0 | varies | check |
| `ct_plague_quarter` | The sick quarter | 0 | varies | check |
| `ct_pledge_loan` | A loan on pledge | 0 | varies | check |
| `ct_pretender` | A pretender | 0 | varies | check |
| `ct_rebellion` | Rebellion brewing | 0 | varies | check |
| `ct_regency` | The regency council | 0 | varies | tradeoff |
| `ct_regent_plan` | If you should die | 0 | varies | check |
| `ct_strange_gift` | A strange gift | 0 | varies | check |
| `ct_succession_law` | The law of succession | 0 | varies | check |
| `ct_tribute` | A demand for tribute | 0 | varies | check |
| `ct_two_crowns` | The other crown | 0 | varies | check, local |
| `ct_unlit` | The threat of unlighting | 0 | varies | check, local |
| `ct_unpaid_host` | The host is unpaid | 0 | varies | check |
| `ct_vassal_demand` | A vassal's price | 0 | varies | check |
| `ct_vassal_feud` | Two houses at war | 0 | varies | check |
| `ct_war_council` | The war council | 0 | varies |  |
| `fm_deathbed` | A deathbed confession | 2 | 24 |  |
| `gf_road` | Trouble on the road | 15 | varies | check |
| `gf_tavern` | Five against one | 12 | varies | check |
| `hs_chronicle` | The family book | 2 | 36 | tradeoff |
| `hs_dw_debt` | The Debtors' Wall | 0 | 45 |  |
| `hs_dw_k_gallery` | The clan gallery | 0 | 47 | tradeoff |
| `hs_g_charter` | The charter | 0 | 38 | tradeoff |
| `hs_gi_k_shown` | Shown to the hall | 0 | 38 | once |
| `hs_graves` | The family graves | 0 | 26 | check |
| `hs_hd_first` | Head of the family | 0 | 42 | tradeoff, once |
| `hs_hd_petitions` | Cousins at the door | 0 | 39 |  |
| `hs_hd_purse` | The family purse | 0 | 29 | check |
| `hs_m_banner` | The old banner | 0 | 38 |  |
| `hs_mc_rival` | The rival house | 0 | 35 | check |
| `hs_n_court_day` | Court day at the seat | 1 | 48 | tradeoff |
| `hs_n_liege_visit` | The liege comes to stay | 1 | 34 | check |
| `hs_n_relief` | The relief | 0 | 38 | tradeoff |
| `hs_n_wardship` | An orphaned heir | 0 | 47 | tradeoff |
| `hs_name_abroad` | They know the name | 1 | 32 | tradeoff |
| `hs_name_bought` | A price for the name | 1 | 37 | tradeoff |
| `hs_o_k_lookout` | Lookout | 0 | 37 | tradeoff |
| `hs_portrait` | Sitting for the painter | 1 | 33 | tradeoff |
| `hs_words` | "{words}" | 0 | 26 | tradeoff |
| `lf_art_candle` | Work by candlelight | 2 | 34 | tradeoff |
| `lf_ash_night` | A place at the table | 4 | 39 | local |
| `lf_curfew` | After the bell | 3 | 27 | tradeoff |
| `lf_grave_ale` | The grave-ale | 0 | 34 | tradeoff, local |
| `lf_grief_belongings` | What they left | 2 | 11 | check |
| `lf_health_bleeding` | The physician recommends bleeding | 2 | 30 | tradeoff |
| `lf_health_chest` | A pain in the chest | 5 | 31 | tradeoff |
| `lf_health_relic` | A saint's dust | 1 | 33 | check, local |
| `lf_mid_debt_old_friend` | An old debt remembered | 2 | 29 |  |
| `lf_moral_purse` | A purse in the road | 12 | 19 | check |
| `lf_mourn_rite` | The rites for the dead | 6 | 25 | tradeoff |
| `lf_names_spoken` | A name not spoken fades | 0 | 41 | check, local |
| `lf_old_burial_wish` | How you will be sent off | 3 | 23 |  |
| `lf_old_dwarf_vault` | The tools you will take | 0 | 41 |  |
| `lf_rival_dies` | Your rival is dead | 7 | 35 | tradeoff |
| `lf_teen_mirror` | A face in the water | 3 | 40 |  |
| `lf_winter_dead` | The winter shed | 0 | 39 | check, local |
| `ln_d_book` | A book for sale | 4 | 33 | tradeoff |
| `ln_d_cl_festival` | A feast day's work | 0 | 33 | tradeoff |
| `ln_d_crt_rumor` | What they say about you | 0 | 16 | tradeoff |
| `ln_d_crt_sleeves` | The price of a velvet sleeve | 0 | 42 | tradeoff |
| `ln_d_env_tongue` | A new tongue | 0 | 34 | check |
| `ln_d_min_winter` | Singing for supper | 0 | 39 | check |
| `ln_d_scr_secret` | What the letter said | 2 | 33 | check |
| `ln_d_stw_granary` | Rats in the granary | 0 | 32 | tradeoff |
| `ln_d_stw_tally` | Three pennies short | 0 | 32 | tradeoff |
| `mk_toll` | A new toll | 0 | 26 | tradeoff |
| `or_deeds` | The roll of deeds | 0 | varies | check |
| `or_invite` | Someone was watching | 0 | 40 |  |
| `or_tale` | Around the fire | 0 | varies |  |
| `pa_retired_advice` | The old one is consulted | 0 | 29 |  |
| `pf_ath_hue_cry` | Hue and cry | 2 | varies | tradeoff |
| `pf_dual_either_hand` | The wrong hand | 6 | 31 | tradeoff, once |
| `pf_learn_letter_writer` | Six pence a letter | 15 | 57 | tradeoff |
| `pf_shield_pot_lid` | Holding the bridge | 6 | varies | tradeoff, once |
| `pf_spear_reeds` | Fish in the shallows | 2 | varies | tradeoff, once |
| `pl_herald_treaty` | The herald in the square | 9 | varies | tradeoff |
| `pp_gi_count` | The count of the halls | 0 | varies | tradeoff |
| `pp_gi_nurse` | Your old nurse | 0 | 63 | once |
| `pp_hb_summers` | Two summers | 0 | 38 | once |
| `pp_he_burial` | Where to bury them | 0 | 58 | tradeoff, once |
| `pp_ho_blamed` | The first one they look at | 0 | 32 | tradeoff |
| `pp_orc_platform` | The high platform | 3 | 54 | tradeoff |
| `rk_deserters_hang` | The hanging tree | 0 | 41 | tradeoff |
| `rk_file_count` | Counting heads | 0 | 39 | check |
| `rk_fm_stick_drill` | Sticks in the yard | 2 | 37 | tradeoff |
| `rk_fm_stories` | Grandfather's war | 0 | 41 |  |
| `rk_fm_widows` | The widows of the company | 3 | 39 | tradeoff |
| `rk_lice` | Lice | 0 | 37 |  |
| `rk_sgt_drunk_watch` | Drunk on watch | 0 | 49 |  |
| `rk_sgt_mother` | A mother at the gate | 0 | 45 |  |
| `rk_sgt_straggler` | At the back of the column | 0 | 42 | tradeoff |
| `rk_sgt_thief` | A thief in the section | 0 | varies | tradeoff |
| `rk_vt_field` | The field | 0 | 39 | once |
| `rk_vt_recall` | The recall | 0 | 36 | check |
| `rk_vt_stories` | War stories | 0 | 36 |  |
| `rk_vt_sword` | The sword on the wall | 0 | 49 | tradeoff |
| `rk_wd_face` | The face in the water | 0 | 42 | once |
| `rk_wrong_shape` | In the dark | 0 | 47 |  |
| `rl_f_convert` | The other church | 1 | varies | tradeoff, local |
| `rl_ts_road` | The road station | 0 | varies | check, local |
| `rl_y_blackdragon` | The Black Dragon of the channel | 0 | varies | tradeoff, local, once |
| `rl_y_evenwood` | The heir of the Evenwood | 0 | varies | tradeoff, local, once |
| `rl_y_neck` | News from the Neck | 0 | varies | tradeoff, local, once |
| `rl_y_sabra` | Galleys against fire | 0 | varies | tradeoff, local, once |
| `rl_y_things` | The giants' Things | 0 | varies | check, local, once |
| `rl_y_twins` | The twin crowns | 0 | varies | tradeoff, local, once |
| `sc_ac_candles` | No money for candles | 0 | 23 | tradeoff |
| `sc_ac_gown` | Town and gown | 0 | 34 | tradeoff |
| `sc_knd_armorer` | The armorer's bill | 1 | 27 | tradeoff |
| `sc_knd_inn` | Hedge knight | 0 | 28 | tradeoff |
| `sc_ss_blind` | Fighting without eyes | 0 | 22 | tradeoff |
| `sc_ss_feast` | The feast-day bouts | 0 | 33 | tradeoff |
| `sc_ss_ground` | The lesson of the ground | 0 | 33 | check |
| `sc_ss_household` | Two ways of fighting | 0 | 32 | check, once |
| `sc_ss_mail` | A day in mail | 0 | 35 | check |
| `sc_ss_roll` | The roll of masters | 0 | 51 | once |
| `sc_ss_stranger` | A blade from another chain | 0 | 36 | check |
| `ss_ab_clay` | Bones in the rift clay | 0 | 45 | tradeoff, local |
| `ss_ab_coffee` | Three cups | 0 | varies | tradeoff, local |
| `ss_br_earring` | The gold earring | 0 | varies | local |
| `ss_ks_firstpepper` | First Pepper | 0 | 46 | tradeoff, local |
| `ss_ks_pinch` | A pinch of pepper | 0 | varies | check, local |
| `ss_qd_headtax` | Two qadr a head | 0 | varies | tradeoff, local |
| `ss_qd_shroud` | The linen shroud | 0 | varies | tradeoff, local |
| `ss_sc_unicorn` | The Sand Clans' unicorns | 0 | 52 | check, local |
| `ss_sk_newyear` | The seventh step | 0 | 47 | check, local |
| `ss_tm_natron` | Forty days of natron | 0 | varies | tradeoff, local |
| `st_deleg_cousin` | A delegate's choice | 0 | 35 |  |
| `tr_cook_d_rats` | Rats in the larder | 0 | 36 | tradeoff |
| `wk_craft_candle` | Work by candlelight | 2 | varies | tradeoff |
| `wk_farm_tithe` | The tenth sheaf | 2 | varies | tradeoff |
| `wk_gen_stolen` | The floor stone | 7 | 26 | check |
| `wk_gen_tax` | The tax-collector | 5 | varies | tradeoff |
| `wk_serf_demesne` | The lord's days | 1 | 35 | tradeoff |
| `wk_trade_toll` | The toll bridge | 0 | varies | tradeoff |
| `wr_file_blow` | The file-leader's staff | 0 | 39 | tradeoff |
| `wr_hf_press` | The recruiting party | 0 | 25 | check |
| `wr_hf_refugees` | Refugees | 3 | 26 |  |
| `wr_hue_and_cry` | Hue and cry | 4 | 35 | tradeoff |
| `ww_ai_beachpyre` | Ashes to the sea | 0 | 54 | tradeoff, local |
| `ww_ai_coconut` | The tallest palm | 0 | 43 | tradeoff, local |
| `ww_ai_ribut` | Ribut datang | 0 | 46 | tradeoff, local |
| `ww_ald_hartgate` | The Lay of Hartgate | 1 | varies | tradeoff, local |
| `ww_ald_levy` | Five hearths, one man | 1 | varies | tradeoff, local |
| `ww_ash_brokenarrow` | A broken arrow | 0 | 47 | tradeoff, local |
| `ww_ash_nightmarch` | Sleep is for Varennans | 1 | 49 | tradeoff, local |
| `ww_dv_deadhouse` | The spring burying | 0 | varies | tradeoff, local |
| `ww_dv_skate` | Bone runners | 0 | 49 | tradeoff, local |
| `ww_dv_steam` | Speak low | 0 | 56 | tradeoff, local |
| `ww_gh_coindive` | Count to ten | 0 | 46 | tradeoff, local |
| `ww_gh_deafdiver` | An old diver | 0 | 48 | local |
| `ww_gh_dragonyear` | The dragon year | 0 | 51 | tradeoff, local, once |
| `ww_gh_stone` | A stone in the harbor | 0 | 48 | tradeoff, local |
| `ww_hl_charterday` | Charter Day | 0 | 45 | check, local |
| `ww_hl_vote` | The Gordush contract | 0 | 52 | tradeoff, local, once |
| `ww_hl_yodel` | Calls between valleys | 0 | 50 | check, local |
| `ww_lu_foundling` | A child named Marin | 0 | 45 | local |
| `ww_lu_staple` | One bushel in twenty | 0 | 47 | tradeoff, local |
| `ww_lu_zero` | The counting school | 0 | 49 | check, local |
| `ww_mh_lanternlads` | The Lantern Lads | 0 | 49 | tradeoff, local |
| `ww_mh_leontines` | Coins of the corsair dead | 0 | 51 | tradeoff, local |
| `ww_mh_miracleday` | Miracle Day | 0 | 64 | check, local |
| `ww_mh_templedebt` | The Temple court | 0 | 41 | tradeoff, local |
| `ww_nr_fogfish` | Fog on the banks | 0 | 38 | tradeoff, local |
| `ww_nr_launch` | The first launch | 0 | 42 | tradeoff, local |
| `ww_nr_skis` | The ski race | 0 | 44 | check, local |
| `ww_os_bench` | A broken bench | 0 | 45 | tradeoff, local |
| `ww_os_changer` | A penny in fifty | 0 | 53 | tradeoff, local |
| `ww_os_ledgerschool` | The Ledger School | 0 | 50 | check, local |
| `ww_os_murex` | Purple hands | 0 | 50 | tradeoff, local |
| `ww_os_northmen` | Questions in the Dyers' Quarter | 0 | 51 | tradeoff, local, once |
| `ww_sol_badgemen` | The Brass Badge men | 4 | 53 | tradeoff, local |
| `ww_sol_grave` | A grave by the Temple wall | 2 | 52 | local, once |
| `ww_sol_mirona` | The Mirona November | 1 | 53 | tradeoff, local |
| `ww_sol_noonlie` | Don't lie at noon | 1 | 43 | tradeoff, local |
| `ww_sol_saltpan` | The salt tax | 4 | 43 | tradeoff, local |
| `ww_sol_tenant` | Rent and tithe | 3 | 46 | tradeoff, local |
| `ww_ts_bentleontine` | The Bent Leontine | 0 | 50 | tradeoff, local |
| `ww_ts_pits` | Burial pits | 0 | 56 | check, local |
| `ww_ts_sixth` | A sixth finger | 0 | 59 | tradeoff, local, once |
| `ww_va_breakwheel` | Breaking the wheel | 3 | 53 | tradeoff, local, once |
| `ww_va_lionfair` | The Lion Fair | 6 | 53 | tradeoff, local |
| `ww_vg_honeyporridge` | Before the third sunrise | 0 | 44 | tradeoff, local |
| `ww_vg_pelts` | Graded and ungraded | 0 | 59 | tradeoff, local |
| `ww_vg_redcollar` | Red at the collar | 0 | 39 | tradeoff, local |

## Numbers only (B): 334

Every choice only moves numbers, some by more than a nudge (a skill by 3, health by 10), with nothing lasting: no trait, wound, bond, job, flag anyone reads, or follow-up. Nothing queues it.

| id | title | fired | words | notes |
| --- | --- | --- | --- | --- |
| `av_broken_axle` | A broken axle | 9 | varies | tradeoff, moves skill |
| `av_caravan_desert` | The caravan by night | 0 | 39 | check, moves health skill |
| `av_caravanserai_fever` | The caravanserai | 1 | 35 | tradeoff, local, moves skill health |
| `av_crime_jailer_offer` | Turnkey wanted | 0 | 27 | moves skill |
| `av_false_relic` | A finger of the saint | 3 | 34 | tradeoff, local, moves skill |
| `av_inn_commonroom` | The common room | 6 | 27 | tradeoff, moves skill |
| `av_merc_fever` | Camp fever | 1 | 31 | tradeoff, moves skill health |
| `av_pilgrims` | With the pilgrims | 3 | varies | tradeoff, local, moves piety |
| `av_road_pilgrim_skyhold` | The Bluespire circuit | 0 | 38 | tradeoff, local, moves piety |
| `av_sea_kraken` | The kraken on the beach | 5 | 39 | check, moves skill |
| `av_sea_orcas` | Wolves of the Sea | 0 | 42 | tradeoff, local, moves skill |
| `av_sea_plagueship` | A forty-day | 1 | 43 | tradeoff, moves health |
| `av_sea_voyage` | A share in a voyage | 1 | 26 | tradeoff, moves skill perf |
| `av_teen_poach` | The lord's rabbits | 2 | 27 | tradeoff, moves skill |
| `av_wild_bog` | The soft ground | 0 | 31 | tradeoff, moves skill |
| `av_wild_mammoth_ivory` | Dragon-kin in the ice | 0 | 36 | tradeoff, local, moves health favor |
| `av_wild_tomb` | The barrow | 2 | varies | tradeoff, moves health |
| `av_wild_trapline` | The trapline | 0 | 25 | tradeoff, moves skill perf |
| `av_yam_station` | The yam station | 0 | 45 | tradeoff, local, moves skill favor |
| `av_young_outlaw_uncle` | Uncle comes home at night | 0 | 34 | once, moves skill |
| `bd_bad_tooth` | The rotten tooth | 12 | 29 | tradeoff, moves health |
| `bd_balance_bridge` | The broken bridge | 0 | 37 | tradeoff, moves health |
| `bd_bear_heart` | A heart too small | 0 | 41 | tradeoff, moves health |
| `bd_bull_appetite` | The bull eats | 0 | varies | tradeoff, moves health skill |
| `bd_corvane_banner` | Red and green | 0 | 51 | tradeoff, once, moves skill |
| `bd_fever_badair` | The fever | 21 | varies | check, moves health |
| `bd_flux_camp` | The bloody flux | 0 | 45 | check, moves health skill |
| `bd_lion_reach` | The long arm | 0 | varies | tradeoff, moves skill health |
| `bd_memory_nights` | Nothing is forgotten | 0 | varies | tradeoff, moves skill happy |
| `bd_oakborn_years` | Deep years | 0 | 49 | check, moves happy skill |
| `bd_quack` | The doctor in the velvet coat | 6 | varies | tradeoff, moves skill |
| `bd_ranavir_test` | The yearly cup | 0 | 48 | moves fn |
| `bd_runner_blood` | Thick blood | 0 | 38 | tradeoff, moves health |
| `bd_saltskin_fast` | Heat that fells others | 0 | 47 | tradeoff, moves wil health |
| `bd_sixfinger_grip` | Six fingers | 0 | varies | tradeoff, moves health |
| `bd_sunborn_saffron` | A hundred shades | 0 | varies | tradeoff, moves skill |
| `bd_thirstless_stone` | The stone | 0 | 42 | tradeoff, moves wil health |
| `bd_train_body` | Hard work, hard body | 7 | varies | tradeoff, moves skill |
| `bd_wakeful_fit` | The bold fit | 0 | 45 | tradeoff, moves happy wil skill |
| `bd_wild_deathstalker` | In the boot | 0 | 50 | tradeoff, moves health |
| `bd_wild_drywell` | The dry well | 0 | 40 | check, moves health wil skill |
| `bd_wild_fenague` | The ague | 3 | 41 | tradeoff, moves health |
| `bd_wild_gale` | A gale out of season | 2 | 39 | check, moves skill health wil |
| `bd_wild_hornedhare` | The horned hare | 3 | 37 | check, moves skill |
| `bd_wild_seamaidens` | Sea maidens | 7 | 38 | tradeoff, moves health |
| `bd_wild_thinair` | The thin air | 0 | varies | tradeoff, moves skill health wil happy |
| `bd_will_failure` | Not good enough | 7 | varies | tradeoff, moves wil perf |
| `bd_will_grief` | The day of the burying | 1 | varies | tradeoff, moves wil |
| `bd_will_humiliation` | Struck in the market | 7 | varies | tradeoff, moves wil happy favor health |
| `bd_will_vigil` | The vigil | 12 | varies | tradeoff, moves wil |
| `ch_elf_lessons` | Fifty years of learning | 6 | 33 | tradeoff, moves skill |
| `ch_play_swim` | Swimming | 12 | varies | tradeoff, moves health |
| `cm_fish_empty_nets` | Empty nets | 0 | 32 | tradeoff, moves skill |
| `cm_herd_blood_ride` | Three days without a fire | 0 | 51 | tradeoff, local, moves rep skill |
| `cm_hunter_old_hound` | The old hound | 0 | 38 | check, once, moves happy |
| `cm_merchant_ship_lost` | Lost with all hands | 0 | 28 | tradeoff, moves rep honor |
| `cm_sailor_shore_leave` | Shore leave | 0 | varies | tradeoff, moves happy |
| `ct_aid` | The customary aid | 1 | varies | tradeoff, moves favor |
| `ct_heir_plot` | The impatient heir | 0 | varies | check, moves skill happy |
| `ct_ruler_health` | The physicians | 0 | varies | tradeoff, moves health |
| `ct_spymaster` | Too many keys | 0 | varies | check, moves skill |
| `gf_bridge` | The footbridge | 0 | varies | check, moves merit |
| `gf_cutoff` | Cut off | 0 | varies | check, moves merit |
| `hs_elf_shiphouse` | Ship-house duty | 0 | 38 | check, local, moves skill |
| `hs_gi_chant` | The Mothers' Chant | 0 | 44 | tradeoff, moves happy skill |
| `hs_h_foal` | A hard foaling | 0 | 28 | tradeoff, moves skill happy |
| `hs_h_k_pony` | Your first horse | 0 | 30 | tradeoff, moves skill happy |
| `hs_h_race` | The family race | 0 | 38 | check, moves skill happy |
| `hs_h_remounts` | The army wants horses | 0 | 40 | tradeoff, moves favor |
| `hs_hu_hounds` | The family hounds | 1 | 30 | tradeoff, moves skill |
| `hs_hu_k_tracks` | Reading the ground | 0 | 33 | check, moves skill |
| `hs_k_high_table` | At the high table | 1 | 40 | tradeoff, once, moves skill |
| `hs_mc_credit` | A forged letter of credit | 0 | 38 | tradeoff, moves skill |
| `hs_mc_k_counting` | The counting board | 0 | 33 | check, moves skill |
| `hs_mc_ship_lost` | A ship lost | 0 | 37 | tradeoff, moves happy |
| `hs_n_castellan` | Keeper of the castle | 0 | 28 | tradeoff, moves skill |
| `hs_n_charter` | The lost charter | 2 | 35 | tradeoff, once, moves skill |
| `hs_n_elevation` | A higher rung | 0 | 39 | tradeoff, moves favor |
| `hs_n_lance_owed` | The family owes a lance | 1 | 40 | check, moves favor |
| `hs_orc_k_horse` | A horse from the clan-mother | 0 | 42 | tradeoff, moves skill happy |
| `hs_sea_first` | First time out | 0 | 31 | tradeoff, once, moves skill |
| `hs_sea_k_knots` | Knots and nets | 0 | 37 | tradeoff, moves skill |
| `lf_amb_letter_passage` | A letter of passage | 5 | 39 | tradeoff, moves happy |
| `lf_amb_storyteller` | A good storyteller eats free | 8 | 30 | tradeoff, moves happy |
| `lf_childbed` | The birth | 0 | varies | tradeoff, moves fn |
| `lf_old_advice_ignored` | Nobody listens to the old | 3 | 22 | tradeoff, moves happy |
| `lf_old_confession` | Before the priest | 0 | 30 | check, moves piety happy |
| `lf_old_elf_fade` | The slow fade | 0 | 47 | moves happy |
| `lf_old_last_wish` | One more time | 3 | 22 | tradeoff, moves happy health |
| `lf_old_stories` | Tell us a story | 3 | 26 | check, moves happy |
| `ln_d_cl_doubt` | The dark night | 0 | 32 | tradeoff, moves wil |
| `ln_d_env_custom` | A custom broken | 2 | 29 | tradeoff, moves skill rep |
| `ln_d_env_purse` | The embassy's bills | 0 | 46 | tradeoff, moves favor rep |
| `ln_d_env_road` | The tabard on the road | 0 | 29 | tradeoff, moves happy health |
| `ln_d_heal_sick` | The healer's fever | 0 | 42 | check, moves health rep |
| `ln_d_min_broken` | A broken instrument | 0 | 41 | tradeoff, moves skill |
| `or_master` | The commander of the order | 0 | 39 | check, moves fn |
| `or_vigil` | The vigil | 0 | 39 | check, moves fn |
| `pa_emigrant_homesick` | Homesick | 0 | varies | moves happy |
| `pa_scholar_manuscript` | A lost manuscript | 0 | varies | moves skill |
| `pa_soldier_staff` | A place on the staff | 0 | 28 | moves merit skill |
| `pa_trade_big_client` | The client who could make you | 0 | varies | tradeoff, moves rep perf |
| `pf_ath_dare` | The dare | 6 | varies | tradeoff, once, moves skill health |
| `pf_axe_woodpile` | The woodpile | 2 | 28 | tradeoff, once, moves skill |
| `pf_cmd_kid_war` | The lane war | 8 | 34 | tradeoff, once, moves skill |
| `pf_dipl_kid_peace` | Two friends, one ball | 3 | 23 | tradeoff, once, moves skill |
| `pf_etiq_elf_envoy` | The foreign guest | 0 | 35 | tradeoff, moves skill favor |
| `pf_etiq_page` | The great table | 2 | 33 | tradeoff, once, moves skill |
| `pf_etiq_precedence` | Below the salt | 1 | 37 | tradeoff, moves skill favor |
| `pf_faith_kid_temple` | At the altar | 8 | varies | check, once, moves skill |
| `pf_faith_rites` | No priest | 0 | 31 | check, moves skill |
| `pf_farm_bull` | The bull at the fair | 0 | 33 | tradeoff, moves skill |
| `pf_farm_lambs` | Lambing night | 6 | 26 | check, once, moves skill |
| `pf_farm_sick_herd` | The cows are sick | 2 | varies | tradeoff, moves skill happy |
| `pf_gamb_bones` | Knucklebones | 5 | varies | tradeoff, once, moves skill |
| `pf_intim_stare` | The bully | 4 | 25 | tradeoff, once, moves skill |
| `pf_intr_door` | Behind the door | 5 | 36 | tradeoff, once, moves skill |
| `pf_lance_quintain` | The quintain | 1 | 49 | tradeoff, once, moves skill |
| `pf_learn_old_book` | A book for sale | 7 | 40 | tradeoff, moves skill |
| `pf_log_sacks` | Counting sacks | 3 | 35 | check, once, moves skill |
| `pf_melee_sticks` | Hazel sticks | 4 | varies | tradeoff, once, moves skill |
| `pf_music_voice` | A voice in the field | 9 | 33 | tradeoff, once, moves skill |
| `pf_pers_bad_cloth` | Sand in the desert | 2 | 40 | tradeoff, moves skill |
| `pf_pers_kid_tongue` | The broken window | 5 | 28 | tradeoff, once, moves skill |
| `pf_ride_colt` | The colt nobody rides | 2 | varies | tradeoff, once, moves skill |
| `pf_sea_boy` | First time out | 1 | varies | check, once, moves skill |
| `pf_shield_muster` | The front rank | 0 | 33 | tradeoff, moves skill |
| `pf_siege_model` | The little engine | 3 | 40 | tradeoff, once, moves skill |
| `pf_stealth_orchard` | The priest's apples | 6 | 28 | tradeoff, once, moves skill |
| `pf_stew_assessor` | The assessor comes | 1 | 37 | tradeoff, moves skill favor |
| `pf_surv_dry_wells` | The dry well | 0 | 36 | tradeoff, local, moves skill health |
| `pf_surv_lost` | Lost in the woods | 3 | 27 | tradeoff, once, moves skill |
| `pf_tac_ambush` | The ground | 0 | 51 | tradeoff, moves merit skill |
| `pf_throw_crows` | Scaring crows | 2 | 29 | tradeoff, once, moves skill |
| `pf_trade_eggs` | A basket of eggs | 6 | 29 | tradeoff, once, moves skill |
| `pf_trade_venture` | A share in a ship | 0 | 39 | tradeoff, moves skill happy fn |
| `pf_unarmed_harvest_ring` | The children's ring | 6 | 28 | check, once, moves skill |
| `pl_coalition_rumor` | Everyone against us | 2 | varies | tradeoff, moves skill |
| `pl_council_work_spy` | The spymaster's desk | 0 | 26 | tradeoff, moves favor skill |
| `pl_revolt_village` | The lords' revolt | 0 | varies | tradeoff, moves favor health |
| `pl_tribute_collectors` | The tribute carts | 3 | varies | tradeoff, moves health |
| `pp_dw_deepbreath` | Lowland air | 0 | 52 | tradeoff, moves skill health |
| `pp_dw_levy` | Pike, axe and crossbow | 0 | 47 | check, local, moves skill |
| `pp_dw_teen` | Six years to the carving | 1 | 44 | tradeoff, once, moves skill |
| `pp_elf_century_child` | A child ninety years after the first | 0 | 54 | tradeoff, once, moves happy |
| `pp_elf_greystag` | The Grey Stag | 0 | 58 | tradeoff, moves skill happy favor |
| `pp_elf_honey` | The Wax Circle | 0 | 45 | tradeoff, local, moves honor favor |
| `pp_elf_mistwalker` | The noon sun | 0 | 48 | tradeoff, moves skill favor |
| `pp_elf_sea_opening` | Sea Opening | 0 | 47 | tradeoff, local, moves skill |
| `pp_elf_shelf` | The Strangers' Shelf | 0 | 49 | tradeoff, local, moves skill favor |
| `pp_elf_teen` | Not yet fifty | 0 | 51 | tradeoff, once, moves skill |
| `pp_gi_chantkeeper` | The Keeper of the Chant | 0 | 49 | tradeoff, once, moves skill piety |
| `pp_gi_seal` | Thin ice | 0 | 57 | tradeoff, moves skill health |
| `pp_he_parents` | One parent ages | 0 | 50 | check, once, moves happy |
| `pp_he_twofeasts` | Leaf Fall and the harvest fair | 0 | 48 | check, moves happy |
| `pp_ho_funeral` | Not at the graveside | 0 | 44 | tradeoff, once, moves happy |
| `pp_orc_felt` | The felt-makers | 2 | 50 | tradeoff, moves skill |
| `pp_orc_grey` | Grey in the braids | 0 | 57 | once, moves happy |
| `pp_orc_herdsick` | The coughing foals | 1 | 62 | tradeoff, moves skill honor happy |
| `pp_orc_hunger` | A hungry winter | 2 | 50 | check, moves wil health skill |
| `pp_orc_ironhide` | Thick hide | 0 | 53 | tradeoff, moves skill health |
| `pp_orc_nochief` | "No chief is holy" | 0 | 51 | tradeoff, local, moves skill favor |
| `pp_orc_storm` | Storm Coming | 2 | 57 | check, local, moves skill |
| `pp_orc_twins` | Two at once | 0 | 56 | tradeoff, once, moves happy |
| `pp_orc_zorek` | The drums of Zorek | 0 | 48 | check, local, moves skill happy |
| `rk_begging_boy` | A boy with a spear | 0 | 43 | moves honor happy |
| `rk_cmd_decimate` | One in ten | 0 | 49 | tradeoff, moves merit happy honor |
| `rk_cmd_march` | An independent march | 0 | 46 | check, moves merit skill health |
| `rk_cmd_staff` | Your staff | 0 | 49 | tradeoff, once, moves merit skill |
| `rk_cpt_courier` | A strange order | 0 | 42 | tradeoff, moves merit happy |
| `rk_cpt_deserter_boy` | One witness | 0 | 53 | tradeoff, moves merit happy |
| `rk_cpt_letters` | Letters to the dead men's homes | 0 | 43 | moves merit |
| `rk_cpt_spy` | A man with a charcoal stick | 0 | 37 | tradeoff, moves merit skill |
| `rk_cpt_strength` | Under strength | 0 | 31 | tradeoff, moves merit skill |
| `rk_desert_road` | Alone on the road | 0 | 43 | moves wil |
| `rk_drill_realm` | Drill | 0 | 26 | tradeoff, moves merit |
| `rk_gar_beacon` | A fire on the next hill | 0 | 41 | tradeoff, moves merit |
| `rk_gar_paper_men` | The inspection | 0 | 44 | tradeoff, moves merit honor |
| `rk_gar_parade` | The parade | 0 | 38 | tradeoff, moves merit favor |
| `rk_gen_contracts` | The bread contract | 0 | 47 | tradeoff, moves merit honor skill favor |
| `rk_horse_bolts` | The captain's horse | 0 | 42 | tradeoff, moves skill |
| `rk_lame_horse` | A lame horse | 0 | 44 | tradeoff, moves skill merit |
| `rk_mar_arsenal` | The arsenal | 0 | 52 | tradeoff, moves merit skill favor |
| `rk_scapegoat` | Someone has to hang for it | 0 | 43 | tradeoff, moves health |
| `rk_sen_quarrel` | Captains at dawn | 0 | 42 | tradeoff, moves merit skill |
| `rk_sgt_dirty_job` | A small favor | 0 | 44 | tradeoff, moves merit honor |
| `rk_sqc_sergeants` | Left hand, right hand | 0 | 35 | check, moves skill |
| `rk_sqc_warrant` | The warrant | 0 | 52 | tradeoff, once, moves merit |
| `rk_vt_grandchildren` | What happened to your hand? | 0 | varies | moves happy |
| `rk_vt_reunion` | The old company | 0 | 39 | moves happy |
| `rk_wd_arrowhead` | The old arrowhead | 0 | 38 | tradeoff, once, moves health |
| `rk_wd_back` | The old back | 0 | 36 | tradeoff, moves health |
| `rk_wd_head` | The headaches | 0 | 42 | tradeoff, moves merit |
| `rk_wd_limp` | The bad leg | 0 | 46 | tradeoff, moves wil merit skill |
| `rk_wd_one_hand` | One hand | 0 | 52 | tradeoff, once, moves wil skill |
| `rl_ab_twins` | The second name | 0 | 43 | tradeoff, local, once, moves happy |
| `rl_ash_firstbow` | Your first bow | 0 | varies | tradeoff, local, once, moves skill family |
| `rl_eg_keel` | Sailing on grandmothers | 2 | 54 | tradeoff, local, moves skill |
| `rl_f_alms` | The water-alms | 0 | varies | local, moves piety |
| `rl_f_burn` | Burning the dead | 4 | varies | check, local, moves piety health skill |
| `rl_f_horse` | The sacred horse | 1 | 49 | tradeoff, local, moves piety |
| `rl_f_storm` | Storm Coming | 1 | 46 | tradeoff, local, moves skill |
| `rl_giant_knees` | Failing knees | 0 | varies | tradeoff, local, moves wil |
| `rl_hf_tusk` | A unicorn horn | 0 | varies | tradeoff, local, moves skill |
| `rl_sk_circuit` | The Bluespire Circuit | 0 | 43 | tradeoff, local, moves piety skill |
| `rl_st_debtwall` | The Debtors' Wall | 0 | 56 | tradeoff, local, once, moves honor skill |
| `rl_sy_oakline` | Three warnings | 0 | varies | tradeoff, local, moves skill |
| `rl_y_abbot` | The dying abbot | 0 | varies | tradeoff, local, once, moves health |
| `sc_cr_piece` | The test piece | 0 | 22 | check, moves skill |
| `sc_fa_sermon` | Your first sermon | 0 | 34 | check, moves skill |
| `sc_fa_vigil` | The vigil | 0 | 27 | tradeoff, moves piety skill |
| `sc_knd_arms` | Your arms | 0 | 33 | tradeoff, moves rep |
| `sc_le_forms` | The forms of address | 0 | 35 | check, moves skill |
| `sc_le_moot` | The moot court | 0 | 19 | check, moves skill |
| `sc_md_bleeding` | Bleed the fever? | 0 | 36 | tradeoff, moves skill |
| `sc_md_dissection` | The dissection room | 0 | 30 | tradeoff, moves skill |
| `sc_md_saw` | Above the knee | 0 | 36 | tradeoff, moves skill happy |
| `sc_md_ward` | The fever ward | 0 | 31 | tradeoff, moves skill health |
| `sc_se_stars` | The star night | 0 | 33 | check, moves skill |
| `sc_spd_name` | The name you gave | 0 | 27 | moves happy |
| `sc_ss_winter` | Winter drill | 0 | 25 | tradeoff, moves health |
| `sc_tr_venture` | The first venture | 0 | 35 | check, moves skill |
| `sc_wc_battle` | A battle that teaches | 0 | 20 | check, moves skill |
| `sc_wc_bread` | Bread for an army | 0 | 34 | check, moves skill |
| `sc_wc_engine` | The model engine | 0 | 19 | check, moves skill |
| `sc_wc_levies` | Real men, wooden swords | 0 | 38 | tradeoff, moves skill |
| `sc_wc_plans` | Over wine | 0 | 28 | tradeoff, moves favor |
| `ss_ab_queenmother` | The Queen Mother's summons | 0 | 55 | tradeoff, local, moves skill favor |
| `ss_ab_terrace` | The terrace wall | 0 | 46 | tradeoff, local, moves skill |
| `ss_br_strand` | Paid double | 0 | varies | check, local, moves skill |
| `ss_ks_cyclone` | Cyclone season | 0 | 45 | tradeoff, local, moves skill health |
| `ss_ks_elves` | The Eldergrove traders | 0 | varies | tradeoff, local, moves skill favor |
| `ss_ks_pepperguard` | The Pepper Guard | 0 | 46 | tradeoff, local, moves favor |
| `ss_nw_blood` | Blood from the saddle | 0 | varies | check, local, moves skill health |
| `ss_nw_ten` | Your ten | 0 | varies | tradeoff, local, moves skill |
| `ss_rp_cotton` | The cotton brokers | 0 | 52 | tradeoff, local, moves skill |
| `ss_rp_monsoon` | Monsoon Welcome | 0 | 44 | tradeoff, local, moves happy |
| `ss_sc_boots` | Shake out your boots | 0 | 51 | tradeoff, local, moves health |
| `ss_sc_noon` | The Noon Lances | 0 | varies | tradeoff, local, moves skill |
| `ss_sk_lampnight` | Lamp Night | 0 | 44 | tradeoff, local, moves skill |
| `ss_sk_wolf` | Wolves on monastery land | 0 | 39 | check, local, moves skill |
| `ss_zn_canoe` | The war canoes | 2 | 46 | check, local, moves favor |
| `ss_zn_firstmillet` | First Millet | 2 | 49 | tradeoff, local, moves skill |
| `ss_zn_hundred` | The village hundred | 0 | varies | check, local, moves skill |
| `ss_zn_ivory` | Ivory | 1 | 40 | check, local, moves skill wil happy |
| `tr_art_d_colic` | The painter's colic | 0 | 50 | tradeoff, moves health |
| `tr_art_d_lean` | A lean season | 0 | 26 | moves fn |
| `tr_brew_d_sour` | The batch turns | 0 | 33 | tradeoff, moves rep |
| `tr_carp_d_timber` | Timber is dear | 0 | 17 | tradeoff, moves rep |
| `tr_eng_d_scroll` | An old Solen book | 0 | 39 | tradeoff, moves skill |
| `tr_weaver_d_searchers` | The searchers | 0 | 51 | tradeoff, moves rep |
| `v4_bow_volley` | Range | 0 | 30 | check, moves merit skill |
| `v4_doc_supply` | Bread | 0 | 20 | check, moves merit |
| `v4_line_drill` | Drill | 0 | 21 | check, moves skill merit |
| `v4_mast_name` | Your name on other people's work | 1 | varies | tradeoff, moves rep |
| `wk_brewer_taster` | The ale-taster | 0 | varies | tradeoff, moves perf |
| `wk_craft_dye` | True purple | 0 | varies | tradeoff, moves skill honor perf |
| `wk_craft_yew` | Yew staves | 0 | varies | tradeoff, moves perf |
| `wk_debt_bond` | Bound for debt | 0 | varies | check, local, moves fn |
| `wk_dwarf_contract` | A human lord's offer | 0 | 41 | check, moves skill |
| `wk_farm_locusts` | The cloud | 3 | 28 | tradeoff, moves happy |
| `wk_farm_ox` | The sick ox | 2 | 35 | tradeoff, moves skill happy |
| `wk_herd_camel` | The caravan master | 0 | varies | tradeoff, moves perf skill health |
| `wk_sea_toll` | The dragon toll | 1 | varies | tradeoff, moves skill health |
| `wk_serf_heriot` | Heriot | 1 | varies | tradeoff, once, moves happy |
| `wk_trade_caravan` | A share in the caravan | 2 | 27 | tradeoff, moves skill health |
| `wk_trade_debased` | Bad coin | 6 | varies | tradeoff, moves skill |
| `wk_trade_lucky` | A captain in a hurry | 1 | varies | tradeoff, moves skill |
| `wk_trade_ship` | Overdue | 2 | 37 | tradeoff, moves happy |
| `wk_trade_wells` | The Book of Wells | 0 | 37 | check, local, moves piety |
| `wr_ashmere_fingers` | Two fingers | 0 | 38 | check, local, moves skill merit |
| `wr_billet_widow` | Billeted | 0 | 32 | moves honor |
| `wr_drill_sergeant` | The drill sergeant | 0 | 33 | tradeoff, moves skill |
| `wr_forage_farm` | The foraging party | 0 | 38 | tradeoff, moves honor merit |
| `wr_hang_looter` | The captain's rope | 0 | 48 | moves merit happy honor |
| `wr_harbor_cant` | Harbor cant | 0 | 50 | tradeoff, moves skill |
| `wr_hf_army_passes` | An army on the road | 3 | 32 | check, moves happy skill |
| `wr_hf_fallen` | The list of the fallen | 0 | 26 | moves favor |
| `wr_hf_horses` | The horse-buyers | 0 | 26 | tradeoff, moves happy |
| `wr_hf_levy` | The levy list | 0 | 27 | tradeoff, moves happy |
| `wr_hf_prices` | War prices | 2 | varies | tradeoff, moves skill |
| `wr_hf_requisition` | Requisition | 0 | 41 | tradeoff, moves favor happy |
| `wr_merc_offer` | Double pay | 0 | 37 | moves fn merit |
| `wr_muster_test` | Muster day | 0 | varies | check, moves merit |
| `wr_prisoners` | Prisoners | 0 | 31 | tradeoff, moves honor merit happy |
| `wr_siege_hunger` | The siege lines | 0 | varies | tradeoff, moves merit skill health |
| `wr_sutler` | The sutler | 0 | 34 | tradeoff, moves skill |
| `wr_truce_pickets` | Across the stream | 0 | 39 | tradeoff, moves health merit |
| `wr_veteran` | An old soldier | 0 | 28 | tradeoff, moves skill |
| `wr_water_law` | Water | 0 | 47 | tradeoff, local, moves honor |
| `ww_ai_batik` | Wax and dye | 0 | 44 | check, local, moves skill |
| `ww_ai_bound` | Seven years | 0 | 50 | tradeoff, local, moves wil skill happy |
| `ww_ai_bowl` | The pilot's bowl | 0 | 56 | tradeoff, local, moves favor |
| `ww_ai_pearls` | The shallow banks | 0 | 50 | tradeoff, local, moves family happy |
| `ww_ald_hearthtax` | The hearth tax | 2 | 38 | tradeoff, local, moves honor |
| `ww_ald_horse` | The Hunter's animal | 0 | 44 | tradeoff, local, moves piety honor happy |
| `ww_ald_owls` | An owl in the corner | 3 | varies | tradeoff, local, moves favor honor |
| `ww_ald_serfleave` | Leave to travel | 0 | 43 | tradeoff, local, moves happy |
| `ww_ald_stakeyard` | The Stake Yard | 0 | 45 | check, local, moves skill |
| `ww_ash_arrowtax` | The arrow tax | 0 | 34 | tradeoff, local, moves skill |
| `ww_ash_charter` | A year and a day | 1 | 54 | tradeoff, local, moves family happy |
| `ww_ash_moot` | The Yeomen's Moot | 0 | 60 | tradeoff, local, moves favor |
| `ww_ash_weddingrite` | Iron ring or Sun rite | 0 | 57 | tradeoff, local, once, moves favor |
| `ww_dv_bees` | The wax tithe | 0 | 55 | tradeoff, local, moves skill |
| `ww_dv_earcuff` | The Lake Council | 0 | 58 | tradeoff, local, moves favor |
| `ww_dv_rye` | The rye carts | 0 | 57 | tradeoff, local, once, moves favor |
| `ww_dv_steppemarch` | A crossbow on the wall | 0 | 45 | tradeoff, local, moves skill |
| `ww_dv_stillhall` | The Still Hall | 0 | 48 | check, local, once, moves skill |
| `ww_gh_needlegold` | The pilots' secret | 0 | 54 | tradeoff, local, moves favor |
| `ww_gh_tollclerk` | The Toll-House ledgers | 0 | 54 | tradeoff, local, moves favor |
| `ww_hl_contract` | A broken contract | 0 | 54 | tradeoff, local, moves skill honor |
| `ww_lu_fortyday` | The Forty-Day Law | 0 | 47 | tradeoff, local, moves health |
| `ww_lu_insure` | Old Ironjaw's price | 0 | 54 | tradeoff, local, moves happy |
| `ww_lu_lot` | Marines by lot | 0 | 51 | tradeoff, local, moves skill |
| `ww_nr_lawverse` | The law-verses | 0 | 53 | check, local, once, moves skill |
| `ww_nr_longship` | The district longship | 0 | 56 | tradeoff, local, moves skill |
| `ww_nr_thrall` | A year and a day | 0 | 54 | tradeoff, local, moves skill |
| `ww_nr_wintercrossing` | The Winter Crossing | 0 | 61 | tradeoff, local, moves happy |
| `ww_os_holdbank` | Dwarf crowns | 0 | 58 | tradeoff, local, moves favor |
| `ww_os_militia` | Militia day | 0 | 36 | tradeoff, local, moves skill |
| `ww_os_purple` | A purple cloak | 0 | 53 | tradeoff, local, moves happy |
| `ww_os_will` | For loans not forgiven | 0 | 53 | local, once, moves piety |
| `ww_sol_burning` | Fire belongs to the sun | 2 | 59 | tradeoff, local, moves health piety |
| `ww_sol_sunsister` | The sun-sisters | 4 | 49 | tradeoff, local, moves skill health |
| `ww_sol_votes` | Four votes | 0 | 51 | tradeoff, local, once, moves favor skill |
| `ww_ts_badge` | Sun or dawn | 0 | 52 | check, local, moves health |
| `ww_ts_envoy` | Between the two crowns | 0 | 45 | tradeoff, local, moves skill |
| `ww_ts_forcedloan` | A forced loan | 0 | 54 | tradeoff, local, moves favor happy |
| `ww_ts_mosaic` | The emperor's face | 0 | 65 | tradeoff, local, moves family |
| `ww_va_clipped` | The Shears | 0 | 55 | check, local, moves favor |
| `ww_va_kingsheart` | The king's health | 0 | 52 | tradeoff, local, once, moves favor |
| `ww_va_terrace` | The Terrace School | 0 | 41 | tradeoff, local, moves skill |
| `ww_vg_fourthday` | The fourth day | 0 | 42 | tradeoff, local, moves health |
| `ww_vg_icon` | An icon facing east | 0 | 51 | check, local, moves skill |

## Opinion only (O): 285

Every choice moves numbers and someone's opinion of you, and nothing else: no new bond, no memory anyone reads, no follow-up. Nothing queues it.

| id | title | fired | words | notes |
| --- | --- | --- | --- | --- |
| `av_crime_street_kid` | A small hand in your pocket | 1 | 26 | opinion |
| `av_inn_knock` | A knock at night | 6 | 28 | tradeoff, opinion, moves health |
| `av_wild_hermit` | The hermit | 3 | 31 | check, opinion, moves skill |
| `av_wild_rival_hunter` | Whose arrow? | 0 | 31 | tradeoff, opinion, moves skill |
| `bd_anniversary` | An anniversary | 1 | 16 | tradeoff, opinion |
| `bd_betrayal` | Betrayed | 6 | varies | tradeoff, opinion, moves happy |
| `bd_black_sheep` | The black sheep | 7 | varies | tradeoff, opinion |
| `bd_child_career` | Your child's choice | 1 | 12 | tradeoff, opinion, moves happy |
| `bd_drift` | Drifting apart | 4 | varies | tradeoff, opinion |
| `bd_favor_returned` | A favor returned unasked | 8 | varies | opinion |
| `bd_favor_worst_time` | The worst moment | 0 | varies | tradeoff, opinion |
| `bd_friend_wedding` | A friend's wedding | 7 | 25 | tradeoff, opinion |
| `bd_fury_friend` | The red comes | 0 | 50 | tradeoff, opinion, moves health wil |
| `bd_inheritance_siblings` | The will | 1 | varies | tradeoff, opinion |
| `bd_jealousy` | Jealousy | 1 | 22 | tradeoff, opinion |
| `bd_listener_plot` | Through the door | 0 | 25 | tradeoff, opinion, moves favor skill health |
| `bd_marriage_repair` | A cold house | 0 | 24 | tradeoff, opinion, moves happy |
| `bd_old_enemy_peace` | An old enemy, older | 5 | varies | opinion |
| `bd_patron_expect` | What patrons want | 0 | varies | tradeoff, opinion |
| `bd_rival_reconcile` | Too old for this | 1 | 20 | opinion, moves happy |
| `bd_rival_success` | Your rival's triumph | 6 | varies | tradeoff, opinion, moves skill |
| `bd_spouse_ambition` | Two ambitions, one house | 2 | varies | tradeoff, opinion |
| `bd_student_surpasses` | The student surpasses | 0 | 20 | tradeoff, opinion |
| `bd_sup_unjust_order` | An order you cannot obey | 0 | varies | tradeoff, opinion, moves honor happy health merit |
| `bd_wild_silara` | The serpent of Lake Silara | 0 | 35 | tradeoff, opinion, moves skill |
| `ch_art_workshop` | In the workshop | 4 | 28 | tradeoff, opinion, moves skill family |
| `ch_fam_sick_parent` | A sickbed | 13 | 21 | tradeoff, opinion, moves skill health |
| `cm_bounty_lamp` | A lamp | 0 | 42 | tradeoff, opinion, moves rep skill |
| `cm_bounty_widow` | A widow with no money | 0 | 47 | check, opinion, moves rep |
| `cm_explorer_tavern_tale` | A drunk with a secret | 0 | 33 | tradeoff, opinion, moves rep |
| `cm_farm_slaughter_feast` | The Slaughter Feast | 0 | 41 | check, opinion |
| `cm_herd_stranger` | A stranger at the fire | 0 | 36 | tradeoff, opinion, moves health honor |
| `cm_merchant_debtor_flees` | A debtor runs | 13 | 38 | tradeoff, opinion |
| `cm_pirate_wreck_isle` | Wreck Isle | 0 | 40 | tradeoff, opinion, moves honor rep |
| `cm_sailor_fever` | Fever aboard | 0 | 41 | tradeoff, opinion, moves skill health |
| `cm_sailor_old_salt` | The old salt | 0 | 45 | opinion, moves skill |
| `ct_disfavor` | Out of favor | 1 | varies | tradeoff, opinion, moves favor skill |
| `ct_dying_parent` | The deathbed | 0 | varies | tradeoff, opinion |
| `ct_favor_lance` | A favor on your lance | 3 | varies | tradeoff, opinion, moves happy skill |
| `ct_heir_love` | The heir's heart | 0 | varies | tradeoff, opinion |
| `ct_regency_offer` | A child on the throne | 0 | varies | opinion, moves skill |
| `ct_suspicious_death` | A fall from a horse | 0 | varies | tradeoff, opinion, moves skill favor |
| `ct_wardship` | A ward | 0 | varies | opinion, moves honor |
| `fm_affair_found` | Found out | 0 | 26 | tradeoff, opinion, moves honor happy |
| `fm_apprentice` | An apprenticeship | 0 | varies | opinion |
| `fm_bestfriend` | A true friend | 6 | 31 | opinion, moves happy |
| `fm_betrothed_meet` | Your betrothed visits | 1 | 28 | tradeoff, opinion, moves happy |
| `fm_camp_love` | Love in the camp | 0 | varies | tradeoff, opinion, moves happy |
| `fm_child_leaves` | Leaving home | 2 | varies | tradeoff, opinion, moves happy |
| `fm_child_lost` | Missing | 0 | 20 | tradeoff, opinion |
| `fm_child_question` | Where do the dead go? | 1 | 27 | opinion |
| `fm_child_war` | A child goes to war | 0 | 28 | tradeoff, opinion |
| `fm_dwarf_contract` | A clan contract | 0 | 42 | tradeoff, opinion |
| `fm_dwarf_metal` | Names in metal | 0 | 31 | once, opinion |
| `fm_elf_years` | Borrowed time | 0 | varies | opinion, moves happy |
| `fm_fair_meet` | A face at the fair | 10 | varies | tradeoff, opinion, moves happy |
| `fm_friend_loan` | A friend asks for a loan | 8 | 20 | opinion |
| `fm_friend_wedding` | A friend's wedding | 11 | 31 | tradeoff, opinion, moves happy |
| `fm_halfblood_kid` | Half and half | 0 | 28 | tradeoff, opinion, moves happy |
| `fm_heartbreak` | It is over | 4 | 19 | tradeoff, opinion, moves happy |
| `fm_household_debt` | The moneylender's list | 1 | 29 | tradeoff, opinion |
| `fm_inheritance` | The inheritance | 7 | 37 | tradeoff, once, opinion, moves fn |
| `fm_inlaws` | The in-laws | 2 | varies | tradeoff, opinion |
| `fm_jealous_lover` | Jealousy | 2 | varies | tradeoff, opinion |
| `fm_lover_away` | Gone for the season | 1 | 16 | check, opinion, moves happy |
| `fm_market_meet` | A hard bargain | 8 | 28 | tradeoff, opinion |
| `fm_mixed_neighbors` | Talk in the lane | 0 | 29 | tradeoff, opinion |
| `fm_new_friend` | A new friend? | 6 | 14 | opinion |
| `fm_old_friends` | An old friend | 6 | 20 | opinion, moves happy |
| `fm_old_together` | Growing old together | 0 | varies | opinion, moves happy |
| `fm_quarrel` | A quarrel | 2 | 25 | tradeoff, opinion |
| `fm_rebel_teen` | A rebel in the house | 1 | 22 | tradeoff, opinion, moves happy |
| `fm_reconcile` | A cold house | 1 | 23 | tradeoff, opinion, moves happy |
| `fm_sibling_debt` | A sibling in debt | 8 | 29 | tradeoff, opinion, moves health |
| `fm_spouse_ambition` | A spouse's dream | 0 | 24 | opinion |
| `fm_spouse_faith` | Two faiths, one house | 0 | 28 | opinion |
| `fm_suitor` | A proposal comes to you | 7 | varies | check, opinion |
| `fm_teen_crush` | A crush | 6 | 31 | tradeoff, opinion, moves happy |
| `fm_teen_sibling` | Little brother, little sister | 4 | 23 | tradeoff, opinion |
| `fm_temple_meet` | Eyes across the rite | 9 | varies | check, opinion, moves happy |
| `fm_widow_suitor` | A new suitor | 0 | varies | opinion, moves happy |
| `fm_wind_bride` | A bride of another Wind | 0 | varies | tradeoff, local, opinion |
| `fm_your_bastard` | A claim of blood | 1 | 34 | once, opinion |
| `hs_ally_call` | An old friendship called in | 1 | 27 | tradeoff, opinion |
| `hs_black_sheep` | The black sheep comes home | 0 | 26 | check, opinion |
| `hs_c_heretic` | A heretic in the family | 0 | 31 | tradeoff, opinion, moves happy |
| `hs_c_living` | The family living | 0 | 39 | tradeoff, opinion, moves happy |
| `hs_cousin_loan` | A cousin needs money | 1 | 31 | opinion |
| `hs_elf_halfblood` | No tree for the child | 0 | 40 | tradeoff, opinion |
| `hs_elf_memory` | An elder remembers | 0 | 43 | opinion, moves skill |
| `hs_g_secret` | Secrets of the craft | 0 | 41 | tradeoff, opinion |
| `hs_g_widow` | The widow's shop | 0 | 40 | tradeoff, opinion |
| `hs_gi_eldest` | The eldest's test | 0 | 27 | tradeoff, opinion |
| `hs_gi_tribute` | The tribute-folk | 0 | 43 | opinion |
| `hs_godparent` | Stand for the child | 1 | 38 | opinion |
| `hs_h_bloodline` | The line | 0 | 41 | tradeoff, opinion |
| `hs_hd_discipline` | A wayward member | 0 | 23 | tradeoff, opinion |
| `hs_hd_secret` | Keeper of the secret | 0 | 29 | check, opinion, moves skill |
| `hs_hook` | Trouble in the house | 1 | 28 | tradeoff, opinion, moves skill |
| `hs_hu_forest_law` | The forest law | 0 | 32 | opinion, moves favor |
| `hs_hu_poachers` | Poachers in the wood | 0 | 34 | opinion, moves favor |
| `hs_inherit_dispute` | A disputed inheritance | 1 | 30 | check, opinion |
| `hs_k_cousin_friend` | A cousin for a friend | 1 | 34 | once, opinion |
| `hs_k_cousins` | The cousins come to stay | 0 | 39 | tradeoff, opinion |
| `hs_k_old_retainer` | The old retainer | 2 | 30 | check, opinion |
| `hs_k_rival_kids` | The other family's children | 0 | 29 | tradeoff, opinion |
| `hs_m_ties` | The family's men | 0 | 24 | tradeoff, opinion |
| `hs_matriarch` | Summoned by the old one | 1 | 45 | tradeoff, opinion |
| `hs_mc_bankrupt` | A cousin goes bust | 0 | 36 | check, opinion |
| `hs_mc_ledger` | The family ledger | 0 | 45 | tradeoff, opinion |
| `hs_mc_snub` | Money, not blood | 0 | 35 | tradeoff, opinion, moves happy |
| `hs_n_dowry` | The dowry | 1 | 44 | tradeoff, opinion |
| `hs_n_estate_return` | Home from the wars | 0 | 37 | check, opinion, moves skill |
| `hs_n_honor` | The honor of the house | 0 | 33 | tradeoff, opinion |
| `hs_n_steward` | The steward's books | 2 | 32 | tradeoff, opinion, moves skill |
| `hs_n_tenants` | The tenants' petition | 1 | 37 | tradeoff, opinion |
| `hs_o_share` | Dividing the take | 0 | 30 | tradeoff, opinion |
| `hs_orc_clanless` | Clanless | 0 | 35 | tradeoff, opinion |
| `hs_poor_relation` | The poor relation | 0 | 38 | tradeoff, opinion, moves happy |
| `hs_reunion` | Everyone comes home | 1 | 41 | tradeoff, opinion, moves happy |
| `hs_s_secret_knowledge` | What the family knows | 0 | 27 | tradeoff, opinion |
| `hs_sea_charts` | The family charts | 0 | 28 | tradeoff, opinion |
| `lf_court_custom` | Courting, the proper way | 7 | 19 | tradeoff, opinion, moves happy |
| `lf_friend_drink` | A friend and the jug | 12 | 31 | tradeoff, opinion |
| `lf_friend_forgets` | A friend who rose | 6 | 23 | tradeoff, opinion, moves fn |
| `lf_friend_godparent` | Speak for the child | 11 | 26 | opinion |
| `lf_friend_oath` | A friend before the court | 10 | 26 | tradeoff, opinion |
| `lf_friend_quarrel` | A stupid quarrel | 25 | 25 | check, opinion, moves fn |
| `lf_friend_saved_you` | Somebody came | 0 | 30 | check, opinion, moves happy |
| `lf_friend_secret_told` | A secret on everyone's lips | 9 | 24 | tradeoff, opinion |
| `lf_friend_surety` | Stand surety | 7 | 36 | tradeoff, opinion |
| `lf_friend_widow` | A promise at the graveside | 5 | 27 | tradeoff, opinion, moves happy |
| `lf_gent_tenant` | A tenant at the gate | 5 | 33 | check, opinion, moves skill |
| `lf_health_mad_kin` | The storm in the head | 5 | 31 | opinion, moves happy |
| `lf_kid_comes_home` | Home with nothing | 0 | 23 | tradeoff, opinion |
| `lf_kid_cruel_master` | Bruises | 1 | 42 | tradeoff, opinion, moves fn happy |
| `lf_kid_death_question` | "Where do the dead go?" | 0 | 32 | check, opinion |
| `lf_kid_fostering` | Sent to be fostered | 0 | 36 | tradeoff, opinion, moves fn favor |
| `lf_kid_gang` | Bad company | 0 | 33 | tradeoff, opinion |
| `lf_kid_ledger` | The counting-room | 1 | 31 | tradeoff, opinion |
| `lf_kid_lost_fair` | Lost at the fair | 1 | 21 | tradeoff, opinion |
| `lf_kid_other_life` | Not the life you planned | 0 | 21 | tradeoff, opinion, moves fn happy |
| `lf_kid_scared` | Something in the dark | 1 | 25 | check, opinion |
| `lf_kid_slave_sale` | The buyer looks at your child | 0 | 28 | tradeoff, opinion, moves fn health happy wil |
| `lf_kid_teen_love` | Mooning about | 1 | 30 | tradeoff, opinion |
| `lf_kid_thief` | Something that is not ours | 1 | 24 | tradeoff, opinion |
| `lf_law_witness` | You saw it | 7 | 48 | tradeoff, opinion, moves honor favor happy |
| `lf_lover_faith` | Two altars | 2 | 31 | tradeoff, opinion, moves happy |
| `lf_lovers_caught` | Caught in the hayloft | 8 | 19 | check, opinion, moves happy |
| `lf_marriage_cold` | The cold years | 2 | 27 | tradeoff, opinion, moves happy |
| `lf_merc_host_cup` | The host drinks first | 0 | 32 | tradeoff, local, opinion, moves fn |
| `lf_mid_spouse_rekindle` | An empty house | 0 | 27 | check, opinion, moves happy |
| `lf_moral_bread_thief` | A hungry thief | 7 | 25 | tradeoff, opinion |
| `lf_moral_deserter` | A boy in the barn | 1 | 39 | tradeoff, opinion, moves happy favor |
| `lf_moral_false_witness` | Paid to remember | 9 | 27 | tradeoff, opinion, moves fn |
| `lf_moral_lost_child` | A child alone | 6 | 36 | check, opinion, moves happy |
| `lf_moral_runaway` | A runaway | 4 | 36 | tradeoff, local, opinion, moves happy fn |
| `lf_moral_short_weight` | A thumb on the scale | 7 | 23 | opinion |
| `lf_moral_water` | Water for a stranger | 0 | 37 | tradeoff, local, opinion, moves piety honor |
| `lf_nb_borrowed` | The axe that never came back | 8 | 16 | tradeoff, opinion |
| `lf_nb_hen` | The missing hen | 5 | 32 | tradeoff, opinion |
| `lf_nb_raising` | Raising a roof | 3 | 26 | tradeoff, opinion |
| `lf_nb_strangers` | New people in the lane | 11 | 26 | tradeoff, opinion |
| `lf_nb_widow_harvest` | A widow's harvest | 9 | 26 | check, opinion |
| `lf_old_grandchild_secret` | A grandchild's secret | 4 | 16 | check, opinion, moves happy |
| `lf_old_letters` | Old letters in a chest | 1 | varies | tradeoff, opinion, moves happy |
| `lf_rent_raised` | The rent goes up | 2 | 21 | tradeoff, opinion, moves fn |
| `lf_rival_slander` | Slander | 15 | 20 | tradeoff, opinion |
| `lf_sanctuary` | Forty days | 0 | 41 | tradeoff, local, opinion |
| `lf_serenade` | Music under the window | 8 | 30 | tradeoff, opinion, moves happy |
| `lf_serf_new_year` | New Year's reckoning | 2 | 28 | tradeoff, opinion, moves happy |
| `lf_sib_crime` | A confession at night | 3 | 27 | tradeoff, opinion |
| `lf_sib_reunite_old` | The last two | 5 | 34 | check, opinion, moves happy |
| `lf_sib_shelter` | At your door with the children | 13 | 29 | check, opinion |
| `lf_slave_kind_child` | The master's child | 0 | 33 | check, opinion, moves happy |
| `lf_spouse_town` | "Let us go to the town" | 0 | 33 | tradeoff, opinion, moves happy |
| `lf_teen_elf_patience` | Vael, vael | 3 | 32 | check, opinion, moves skill |
| `lf_teen_first_kiss` | Behind the bonfire | 7 | 28 | check, once, opinion, moves happy |
| `lf_unlikely_friend` | An unlikely friend | 9 | 30 | check, opinion |
| `lf_widow_blue` | A year in blue | 0 | 29 | tradeoff, local, opinion, moves happy |
| `lf_widowed_love` | A second spring | 0 | 25 | tradeoff, opinion, moves happy |
| `ln_d_cl_gift` | A gift at the door | 0 | 36 | opinion |
| `ln_d_correspondent` | A letter from afar | 5 | 40 | tradeoff, opinion, moves skill |
| `ln_d_crt_dice` | Dice with a great lord | 0 | 31 | check, opinion, moves favor |
| `ln_d_crt_friend` | A friend at court | 0 | 36 | opinion, moves favor |
| `ln_d_heal_blame` | The family blames you | 0 | 37 | tradeoff, opinion, moves rep |
| `ln_d_heal_kind` | Paid in kind | 0 | 31 | opinion |
| `ln_d_law_gift` | A gift before the hearing | 0 | 24 | opinion, moves rep honor |
| `ln_d_law_goose` | Paid in geese | 1 | 39 | check, opinion |
| `ln_d_law_noon` | A lie at noon | 0 | 49 | tradeoff, opinion, moves rep |
| `ln_d_scr_news` | Reading the letter | 0 | 35 | opinion |
| `ln_d_stw_heir` | The heir wants money | 0 | 37 | opinion |
| `ln_d_stw_reeve` | The reeve's bushel | 0 | 33 | tradeoff, opinion |
| `ln_d_tch_bully` | The lord's son | 0 | 31 | tradeoff, opinion |
| `ln_d_tch_fees` | The fees | 0 | 22 | tradeoff, opinion |
| `ln_d_tch_former` | A former pupil | 7 | 34 | opinion, moves happy |
| `ln_d_tch_rod` | The birch rod | 1 | 34 | tradeoff, opinion |
| `ln_d_tch_shepherd` | The shepherd boy | 4 | 47 | tradeoff, opinion, moves rep |
| `pa_blade_master_lesson` | A master passing through | 0 | 31 | check, opinion, moves skill |
| `pa_teacher_orphan` | A gifted orphan | 0 | 25 | opinion |
| `pf_axe_harvest_chop` | The log-chop at Harvest Home | 0 | 34 | tradeoff, opinion, moves honor |
| `pf_cmd_old_soldier` | My father served with you | 0 | 44 | tradeoff, opinion |
| `pf_dagger_mercy` | The mercy stroke | 2 | 39 | tradeoff, opinion |
| `pf_farm_plough_match` | The straightest furrow | 1 | varies | tradeoff, opinion, moves skill |
| `pf_lance_squire` | A squire's plea | 1 | 38 | tradeoff, opinion |
| `pf_med_arrow` | The arrow | 1 | 44 | tradeoff, opinion, moves skill happy wil |
| `pf_med_leg` | Under the wheel | 2 | 41 | tradeoff, opinion, moves skill happy |
| `pf_melee_pell_yard` | The pell yard | 6 | 31 | tradeoff, opinion, moves skill |
| `pf_sword_pupil` | A pupil at the door | 0 | 29 | tradeoff, opinion |
| `pf_tac_veteran_game` | Captains | 0 | 32 | check, opinion |
| `pp_dw_gems` | The lower gate | 0 | 45 | tradeoff, opinion, moves favor |
| `pp_dw_tally` | The weigh-book | 0 | 40 | check, opinion |
| `pp_gi_lie` | A lie in the hall | 0 | 56 | tradeoff, opinion |
| `pp_hb_meet` | The other kind of half | 0 | varies | check, once, opinion, moves happy |
| `pp_orc_milk` | Spilled milk | 1 | 52 | tradeoff, opinion |
| `pp_orc_stormhead` | The storm in the head | 0 | 48 | check, opinion, moves favor |
| `pr_founder_students` | Your students | 0 | 34 | tradeoff, opinion |
| `pr_ward_grows` | Your ward | 0 | 23 | tradeoff, once, opinion |
| `rk_blisters` | Raw feet | 0 | 41 | tradeoff, opinion |
| `rk_eve_of_battle` | The night before | 0 | 40 | opinion |
| `rk_file_oldhand` | The oldest man | 0 | 44 | tradeoff, opinion |
| `rk_file_wake` | Up, up | 0 | 44 | check, opinion |
| `rk_first_kill` | The first one | 0 | varies | tradeoff, once, opinion, moves wil |
| `rk_froze` | He froze | 0 | 35 | opinion |
| `rk_gar_farm` | Harvest or the wall | 0 | 37 | tradeoff, opinion, moves merit |
| `rk_kit_inspection` | Kit inspection | 0 | varies | tradeoff, opinion, moves skill |
| `rk_loaded_dice` | Loaded dice | 0 | 31 | check, opinion |
| `rk_lucky_stone` | A lucky stone | 0 | varies | opinion |
| `rk_pow_march` | The prisoners' road | 0 | 37 | check, opinion |
| `rk_sgt_fever` | Hiding the sick | 0 | 40 | tradeoff, opinion, moves skill happy |
| `rk_sgt_old_friend` | Old friends, new stripes | 0 | 43 | tradeoff, opinion, moves skill |
| `rk_stolen_hen` | The hen | 0 | 36 | tradeoff, opinion |
| `rk_sweetheart_leave` | One night | 0 | 33 | check, opinion |
| `rl_cast_hunter` | A hunter of the wilds | 3 | varies | check, opinion, moves skill |
| `sc_ac_winter` | The long winter | 0 | 36 | opinion |
| `sc_fa_badges` | Holy goods | 0 | 37 | tradeoff, opinion |
| `sc_gr_classmates` | An old classmate | 3 | 32 | tradeoff, opinion, moves favor |
| `sc_ptd_oldchamp` | The old champion | 0 | 39 | opinion |
| `sc_ptd_shadow` | A shadow | 0 | 31 | opinion |
| `sc_spd_friend` | Report on a friend | 0 | 26 | tradeoff, opinion, moves rep |
| `sc_ss_brother` | Blood in the yard | 0 | 40 | opinion |
| `sc_ss_heir` | Sparring royal blood | 0 | 35 | tradeoff, opinion, moves favor |
| `sc_ss_love` | Bruises and something else | 0 | 27 | tradeoff, opinion, moves happy |
| `sc_ss_pet` | The master's favorite | 0 | 33 | tradeoff, opinion |
| `sc_ss_schools` | A quarrel between schools | 0 | 28 | tradeoff, opinion |
| `sc_ss_throw` | Lose the bout | 0 | 36 | tradeoff, opinion |
| `sc_ss_veteran` | An old student comes back | 0 | 51 | opinion |
| `sc_thd_brand` | The brand | 0 | 29 | opinion |
| `sc_thd_kitty` | The widows' kitty | 0 | 30 | tradeoff, opinion, moves rep |
| `sc_tr_debt` | A family fails | 0 | 30 | opinion |
| `sc_wc_ford` | The map exercise | 0 | 35 | check, opinion, moves skill |
| `st_resented` | Your choice, their grumbling | 0 | 35 | check, opinion |
| `tr_bow_d_snap` | The snapped bow | 0 | 47 | tradeoff, opinion, moves rep |
| `tr_brew_d_slate` | The slate | 0 | 35 | tradeoff, opinion |
| `tr_serv_d_below` | Below stairs | 0 | 39 | tradeoff, opinion, moves happy |
| `tr_serv_d_spoon` | The missing spoon | 0 | 37 | tradeoff, opinion, moves perf |
| `tr_weaver_d_bee` | The spinning bee | 0 | 41 | check, opinion, moves happy |
| `v4_doc_council` | The war council | 0 | varies | tradeoff, opinion, moves merit skill |
| `v4_mast_mentor` | The best pupil | 0 | 22 | opinion, moves merit |
| `v4_path_rival` | Two masters | 1 | 27 | tradeoff, opinion, moves rep |
| `v4_skirm_scout` | Eyes of the army | 0 | 19 | check, opinion, moves merit skill health |
| `wk_craft_apprentice` | A new apprentice | 2 | 32 | opinion, moves perf |
| `wk_craft_rival` | A rival master | 1 | 22 | tradeoff, opinion, moves perf |
| `wk_gen_old_friend` | An old friend in trouble | 12 | 15 | tradeoff, opinion |
| `wk_gen_parent` | Old hands | 4 | 33 | opinion |
| `wk_gen_windfall` | A windfall | 3 | varies | opinion |
| `wk_sea_overboard` | Man overboard | 0 | 30 | tradeoff, opinion, moves health |
| `wk_serf_bailiff` | The bailiff's bushel | 2 | 22 | tradeoff, opinion |
| `wk_trade_partner` | A bad partner | 0 | 25 | tradeoff, opinion |
| `wr_comrade_jilted` | A letter for {mate} | 0 | 32 | check, opinion |
| `wr_desert_tempt` | The road home | 0 | varies | check, opinion |
| `wr_gamble_debt` | Bad dice | 0 | 30 | tradeoff, opinion, moves happy |
| `wr_last_request` | A last request | 0 | 34 | check, opinion, moves skill |
| `wr_march_hunger` | Half bread | 0 | 31 | tradeoff, opinion, moves skill |
| `wr_nightmare` | Bad nights | 0 | varies | tradeoff, opinion, moves wil happy |
| `wr_orc_wave` | The third wave | 0 | 41 | tradeoff, opinion, moves merit health |
| `wr_sentry_sleep` | Third watch | 0 | 29 | tradeoff, opinion, moves health merit |
| `wr_siege_flux` | The flux | 0 | 34 | check, opinion, moves skill |
| `ww_ald_ojury` | The oath jury | 2 | 58 | tradeoff, local, opinion |
| `ww_ash_deserter` | Two fingers | 1 | 52 | tradeoff, local, opinion, moves happy |
| `ww_hl_rustle` | Fourfold | 0 | 51 | tradeoff, local, opinion, moves honor |
| `ww_nr_oarless` | The oarless boat | 0 | 53 | tradeoff, local, opinion |
| `ww_os_debtor` | A name read in church | 0 | 56 | tradeoff, local, opinion, moves honor |
| `ww_sol_heresy` | Six years short | 3 | 57 | check, local, opinion, moves favor honor |
| `ww_vg_height` | A joke about the king | 0 | 48 | tradeoff, local, opinion, moves favor |

## Proposed, not retired: thin mark (T): 159

Its one lasting mark is fame of 3 or more, or a wound; nothing else lasts, nothing reads it, nothing queues it. The brief counts a wound and fame of 3 or more as lasting, so these stay in the roll. They are the next weakest; retiring them too (`select.mjs --with-thin`) would bring the cut to 1007 of 3199 (31.5%). A human decides.

| id | title | fired | words | notes |
| --- | --- | --- | --- | --- |
| `av_caravan_deathworm` | The tale at the fire | 0 | varies | tradeoff, once, moves health |
| `av_crime_fence` | Meeting an uncle | 1 | 37 | tradeoff, opinion |
| `av_crime_goldpan` | The gravel beds | 0 | 35 | tradeoff, local, moves skill health wil |
| `av_neck_station` | The road station | 0 | varies | tradeoff, local, moves skill |
| `av_pass_winter` | Late on the pass | 1 | varies | tradeoff, moves health skill |
| `av_river_ford` | The ford in spring | 11 | 32 | tradeoff, moves skill health |
| `av_road_dice` | Bones by the roadside | 4 | 17 | tradeoff, moves skill health |
| `av_sea_becalmed` | Becalmed | 1 | 29 | tradeoff, moves skill health |
| `av_sea_ice` | Ice in the fjord | 0 | 30 | check, local, moves health skill |
| `av_sea_stowaway` | The stowaway | 3 | 23 | tradeoff, opinion, moves health happy |
| `av_unpaid_soldiers` | Soldiers on the road | 0 | 24 | tradeoff, local, moves skill happy health |
| `av_wild_deepweaver` | The deepweaver | 2 | 30 | tradeoff, moves health |
| `av_wild_snowed_in` | Snowed in | 1 | 31 | check, moves skill health wil |
| `bd_boneless_bonds` | No rope holds a Keshari | 0 | 42 | tradeoff, moves skill health |
| `bd_feverproof_plague` | The delta fever | 0 | 46 | tradeoff, moves skill health |
| `bd_hammer_anvil` | The Anvil of Dagna | 0 | varies | tradeoff, moves skill |
| `bd_laughing_fester` | The wound you did not feel | 0 | varies | tradeoff, moves skill health wil |
| `bd_lean_famine` | The killing frost | 0 | 36 | tradeoff, moves skill |
| `bd_lean_sugar` | The sweet sickness | 0 | 46 | tradeoff, moves health |
| `bd_lightfoot_press` | Light bones | 0 | 40 | tradeoff, moves health |
| `bd_listener_drums` | The drums | 0 | varies | tradeoff |
| `bd_owl_night` | Starlight | 0 | 55 | tradeoff, moves skill health |
| `bd_quickened_torches` | Flickering light | 0 | varies | tradeoff, moves health wil |
| `bd_skarfell_door` | Through a human door | 0 | 48 | tradeoff, moves skill health |
| `bd_stonelung_gas` | Air you cannot smell | 0 | 48 | tradeoff, moves health |
| `bd_storm_sense` | The pressure in your ears | 0 | 41 | tradeoff, moves favor happy |
| `bd_thirstless_well` | The second well is dry | 0 | 40 | tradeoff, moves skill |
| `bd_wild_avalanche` | The avalanche track | 0 | 38 | tradeoff, moves skill health wil |
| `bd_wild_knockers` | The knockers | 3 | 48 | tradeoff, moves health wil |
| `bd_wild_leviathan` | Leviathan | 4 | 50 | tradeoff, moves skill health |
| `bd_wild_wisplights` | Wisplights | 4 | 38 | tradeoff, moves health |
| `bd_work_injury` | Hurt at work | 3 | varies | tradeoff, moves health perf |
| `cm_explorer_frost` | The high camp | 0 | 29 | tradeoff, moves health |
| `cm_fish_seals` | Seals at the nets | 1 | varies | tradeoff, moves fn |
| `cm_herd_fog` | Lost in the fog | 0 | 29 | tradeoff, moves skill health |
| `cm_horse_kick` | A kick in the dark | 2 | 32 | tradeoff, moves health |
| `cm_hunter_snowblind` | Snow-blind | 0 | 35 | tradeoff, moves skill health |
| `ct_hunt` | The liege's hunt | 2 | varies | tradeoff, moves favor health skill |
| `gf_champion` | One against nine | 0 | varies | moves merit |
| `gf_village` | Raiders at dawn | 5 | varies |  |
| `hs_c_rite` | The family rite | 0 | 29 | tradeoff |
| `hs_cl_horse_feast` | The Horse Feast | 0 | 32 | check, local, moves skill |
| `hs_cl_raid` | A raid for cattle | 0 | 46 | tradeoff, local, moves health happy |
| `hs_g_k_shop` | Underfoot in the workshop | 0 | 27 | tradeoff, moves skill |
| `hs_hu_royal_hunt` | The great hunt | 0 | 37 | tradeoff, moves favor skill |
| `hs_o_hideout` | The hideout is found | 0 | 28 | tradeoff, moves health happy skill |
| `hs_s_notes` | Grandfather's notes | 0 | 38 | tradeoff, moves skill |
| `hs_s_plague` | The sick quarter | 0 | 32 | tradeoff, moves skill health |
| `lf_amb_court` | A place at court | 3 | 32 | tradeoff, moves favor skill |
| `lf_mid_body` | The body keeps count | 3 | 28 | tradeoff |
| `lf_old_failing` | The stairs get steeper | 1 | 25 | tradeoff, moves health |
| `ln_d_min_stolen` | Your song in another mouth | 0 | 28 | tradeoff, opinion, moves rep |
| `pa_academy_first_year` | The academy's first year | 0 | 27 | once, moves skill |
| `pa_explorer_map` | A map-maker's commission | 0 | 25 | check |
| `pa_renown_minstrel` | The minstrel | 0 | 24 |  |
| `pf_cmd_dyke` | The dyke is going | 0 | varies | tradeoff, local, moves happy health |
| `pf_dipl_hostage` | An exchange of prisoners | 1 | 42 | tradeoff, moves skill merit happy |
| `pf_dual_show` | Two blades for the crowd | 0 | 23 | tradeoff |
| `pf_faith_debate` | The debate | 0 | 36 | check, opinion, moves skill favor |
| `pf_faith_omen` | The omen | 0 | 34 | tradeoff, moves skill |
| `pf_pers_before_lord` | The case before the lord | 0 | 29 | tradeoff, moves skill favor |
| `pf_ride_breaker` | Fifteen suns to break him | 1 | 29 | tradeoff, moves skill health |
| `pf_ride_race` | The race | 1 | 20 | check, opinion, moves skill happy honor |
| `pf_sea_galley_race` | Sea Opening | 0 | 24 | tradeoff, moves happy |
| `pf_sea_overboard` | Man overboard | 1 | 36 | tradeoff, opinion, moves health happy wil |
| `pf_stealth_patrols` | Between the patrols | 0 | 24 | tradeoff, moves skill merit health |
| `pf_surv_blizzard` | Caught in the snow | 1 | 32 | tradeoff, moves skill health wil |
| `pf_surv_hungry_winter` | The hungry months | 0 | 29 | tradeoff, moves skill |
| `pf_tac_bandit_camp` | The camp in the quarry | 0 | 33 | tradeoff, moves skill happy |
| `pf_throw_mad_dog` | The mad dog | 0 | varies | tradeoff, moves health |
| `pf_track_missing_child` | The search | 0 | 31 | tradeoff, moves skill |
| `pf_track_scout` | Find their camp | 0 | 25 | tradeoff, moves merit skill health |
| `pf_track_wolfmen` | The wolf-man | 0 | 35 | tradeoff, moves skill |
| `pl_council_work_chancellor` | The chancellor's table | 0 | 32 | tradeoff, moves favor skill |
| `pl_liege_summons` | The liege's writ | 0 | varies | moves favor |
| `pp_dw_collapse` | The roof comes down | 0 | 56 | check, opinion, moves health wil happy skill |
| `pp_dw_porters` | Forty kilos up the pass | 1 | 45 | tradeoff, opinion |
| `pp_dw_sink` | The ferry | 2 | 48 | check, moves health wil |
| `pp_dw_unburied` | Under open sky | 1 | 45 | tradeoff, moves honor happy |
| `pp_elf_fire` | Open fire in the deep forest | 0 | 46 | tradeoff, local, moves favor |
| `pp_elf_tithe` | The grove tithe | 0 | 47 | tradeoff, local, moves skill |
| `pp_gi_roof` | Raising the roof-tree | 0 | 48 | check, moves skill |
| `pp_gi_walrus` | The bull walrus | 0 | 54 | check, moves skill health |
| `pp_orc_wintercount` | The Winter Count | 0 | 42 | tradeoff, local, moves happy skill |
| `rk_cmd_surrender` | Terms | 0 | 49 | tradeoff, moves merit favor skill happy |
| `rk_cpt_horn` | No signal | 0 | 46 | tradeoff, moves merit skill health happy |
| `rk_cpt_scouts` | Two scouts | 0 | 48 | tradeoff, moves merit skill health |
| `rk_fm_liege_call` | The liege calls | 0 | 42 | tradeoff, moves skill favor |
| `rk_fm_summer` | A summer with the company | 0 | 32 | tradeoff, moves skill health |
| `rk_frost_march` | The cold march | 0 | 38 | tradeoff, opinion |
| `rk_gen_defector` | A man from the other side | 0 | 42 | tradeoff, moves merit skill |
| `rk_gen_land_promise` | The promised land | 0 | 43 | tradeoff, moves favor honor merit happy |
| `rk_gen_scorched` | Our own fields | 0 | 51 | tradeoff, moves merit honor favor happy skill wil |
| `rk_mar_ally` | Two marshals | 0 | 46 | tradeoff, moves merit favor skill |
| `rk_mar_pardon` | The marshal pardons | 0 | 46 | check, moves honor merit |
| `rl_fh_whale` | A whale on the shore | 0 | varies | tradeoff, local, moves favor |
| `rl_hd_ride` | The Great Ride | 1 | 45 | tradeoff, local, moves skill happy |
| `rl_sc_camel` | A camel raid | 0 | 48 | tradeoff, local, moves health skill |
| `rl_tk_toll` | The Kraoth toll | 0 | varies | tradeoff, local, moves health favor |
| `rl_vg_galley` | Rowing for the toll | 0 | 47 | tradeoff, local, moves skill health wil happy |
| `rl_vg_sables` | Blood-silver in sables | 0 | varies | tradeoff, local, moves skill honor looks |
| `sc_knd_fall` | The quintain | 0 | 34 | tradeoff |
| `sc_ptd_knuckles` | Knuckles | 0 | 36 | tradeoff |
| `sc_se_squall` | Squall | 0 | 38 | check, moves skill health |
| `sc_spd_face` | The same face | 1 | 33 | tradeoff, moves health |
| `sc_ss_court` | Before the court | 0 | 29 | tradeoff, moves favor |
| `sc_ss_hurt` | Hurt in the yard | 0 | 23 | tradeoff, moves skill |
| `sc_ss_torch` | One more bout, by torchlight | 0 | 22 | tradeoff, moves health |
| `ss_ks_forest` | Fight from the forest | 0 | varies | tradeoff, local, moves skill health |
| `ss_nw_horsefeast` | The Horse Feast | 0 | varies | tradeoff, local, moves skill |
| `ss_qd_rags` | The south gate heaps | 0 | 58 | tradeoff, local, moves health |
| `ss_rp_levy` | After the rice harvest | 0 | 55 | tradeoff, local, moves skill health |
| `ss_rp_pirates` | Pirates at the river mouth | 0 | 42 | check, local, moves skill health |
| `ss_sb_dates` | The date climbers | 0 | 51 | tradeoff, local, moves skill health |
| `tr_carp_d_adze` | The last hour | 0 | 36 | tradeoff, moves health |
| `tr_cook_d_grease` | Fire in the pan | 0 | 34 | tradeoff, moves health |
| `tr_labor_d_back` | The back | 0 | 36 | tradeoff |
| `tr_labor_d_winter` | No work in winter | 0 | 36 | tradeoff |
| `tr_mason_d_dust` | Stone dust | 0 | 38 | tradeoff |
| `tr_smith_d_kick` | The kicking horse | 1 | 37 | tradeoff, moves health rep |
| `v4_bow_contest` | The butts | 0 | 19 | check, moves merit |
| `v4_horse_charge` | The moment | 0 | 32 | tradeoff, moves merit skill health |
| `v4_line_wall` | The shield wall | 0 | 26 | check, moves merit skill health |
| `wk_clergy_heresy` | The preacher | 0 | 22 | tradeoff, opinion, moves perf skill |
| `wk_clergy_miracle` | A miracle? | 0 | varies | check, moves skill perf |
| `wk_craft_fire` | Fire! | 1 | varies | tradeoff, moves health skill happy |
| `wk_gen_plague` | Plague | 1 | 28 | tradeoff, moves health honor skill |
| `wk_herd_white` | The white death | 0 | 31 | tradeoff, moves skill health |
| `wk_herd_wolves` | Night at the fold | 0 | varies | tradeoff, moves health skill |
| `wk_herd_yak` | The high pasture | 0 | varies | tradeoff, local, moves skill health |
| `wk_mine_fall` | Rockfall | 0 | 31 | tradeoff, opinion, moves health perf skill happy |
| `wk_minstrel_song` | A song for a lord | 0 | 39 | tradeoff, moves skill health |
| `wk_sea_storm` | Storm | 0 | 29 | tradeoff, moves perf skill health |
| `wk_slave_mine` | Gold in the dark | 0 | varies | tradeoff, moves health |
| `wk_slave_pearl` | The pearl banks | 0 | varies | tradeoff, local, moves skill health |
| `wk_slave_runaway` | A whisper at the well | 0 | 32 | tradeoff, opinion, moves health honor |
| `wk_tamar_dyke` | The month of mud | 0 | 38 | tradeoff, local |
| `wk_thrall_steppe` | Herd-thrall | 0 | varies | tradeoff, local, moves health skill |
| `wr_amputation` | The saw | 0 | 41 | tradeoff, opinion, moves wil health |
| `wr_arrow` | An arrow from the hedge | 0 | varies | tradeoff, opinion, moves health |
| `wr_fester` | A hot wound | 0 | varies | tradeoff, moves health |
| `wr_general_quarters` | Winter quarters | 0 | 39 | tradeoff, moves merit favor skill |
| `wr_general_supply` | Supply or speed | 0 | 52 | tradeoff, moves merit skill favor honor |
| `wr_loot_shrine` | The village shrine | 0 | varies | tradeoff, moves honor health merit |
| `ww_ash_cinder` | The Cinder Watch | 0 | 56 | tradeoff, local, moves health |
| `ww_dv_iceroad` | The Ice Road | 0 | 53 | tradeoff, local |
| `ww_dv_whaleboats` | The Dobin boats | 0 | 56 | check, local, moves skill health |
| `ww_gh_quake` | The ground moves | 0 | 30 | tradeoff, local, moves health |
| `ww_gh_smokewell` | The gas hollows | 0 | 42 | tradeoff, local, moves health happy |
| `ww_hl_cairn` | A cairn facing home | 0 | 39 | tradeoff, local, once |
| `ww_hl_eagle` | The Crown Eagle | 0 | 48 | tradeoff, local, moves health |
| `ww_hl_herbspirit` | Herb spirit | 0 | 47 | tradeoff, local |
| `ww_hl_mulechest` | A mule's fee | 0 | 58 | tradeoff, local, moves health |
| `ww_lu_grainday` | Grain Day | 0 | 49 | tradeoff, local |
| `ww_lu_race` | The galley race | 0 | 47 | tradeoff, local, moves happy |
| `ww_lu_seal` | A sea maiden in the net | 0 | 46 | check, local |
| `ww_nr_seal` | On the drift ice | 0 | 43 | tradeoff, local, moves health |
| `ww_ts_cedar` | Feleria cedars | 0 | 49 | check, local, moves health |
| `ww_vg_redcrown` | The Lamp's embers | 0 | 50 | tradeoff, local, moves health |

## Weak but kept by a pool floor: 29

These ranked among the weakest, but retiring them would have taken a pool below its floor, so they stay.

- age:child: `pf_bow_butts`, `pf_dagger_kid_knife`, `ww_ald_ringgame`
- age:infant: `ch_ill_fever`
- age:noble-teen: `rl_ald_fairrush`, `rl_y_gordush`
- class:ruler: `bd_dog_bite`, `bd_iron_sink`, `bd_will_break_body`, `bd_will_coldnight`, `fm_reunion`, `lf_friend_moves`, `lf_love_potion`, `rl_cast_merchant`, `rl_cast_noble`, `rl_cast_priest`
- class:serf: `lf_health_fall`, `lf_petty_lord`, `lf_teen_ballgame`, `ww_ald_oakline`
- realm:POL-11: `lf_moral_guest_law`
- realm:POL-17: `lf_famine_ladder`
- realm:POL-20: `rl_zn_nugget`
- realm:POL-23: `av_wild_falcons`, `lf_nb_hearth_spirit`, `rl_hf_thing`
- realm:POL-26: `ww_dv_forestfire`
- realm:POL-27: `bd_wild_crowneagle`
- realm:POL-28: `lf_nb_watch`
