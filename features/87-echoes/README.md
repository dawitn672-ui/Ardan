# 87-echoes: a later scene for the scenes players meet most

**Aspect:** Events (Road to Ten: memory; the scorecard's static memory share) · **Kind:** an event pack (350 events,
prefix `ec_`, in 24 files `a-people` to `x-last`) and a small helper with a choice record (`echoes.core.js`, `A.EC`).
No patches.

80-callbacks used up the orphan flags: every flag some live event set was read by something. What was left were the
scenes nearly every life meets, the neighbour who needs coin, the fever, the bully, the hanging in the square, the
dice after harvest, which most of the time set no flag at all and were never heard of again. An echo is a later scene
that follows from one of them: the same person years on, the same place, the same choice asked the other way round,
and only for the player who chose that way. The player who gave the dying stranger's purse to the house with the blue
door is not asked about it; the one who kept it meets the daughter on the road.

## How an echo knows

| Need | How |
| --- | --- |
| That the player saw the source | `saw(p.flags.ev, "src", min, max)`: the year the engine wrote when the player last chose in it, at least `min` and at most `max` years ago (default 3 to 40). The cond names `p.flags.ev`, so the bench's `memoryIndex` counts the echo as a memory event |
| What the player chose | `took(p, "src", i)`, `won(p, "src")`, `lost(p, "src")`. `echoes.core.js` wraps `A.eventChoose` and, for the events some echo names as its source (`ecSrc`), keeps the last sighting in `pc.ec[src] = [year, choice, won, person, words]`. A record only counts if its year is the one in `p.flags.ev`, so it is always the latest sighting |
| Who it was about | `who(p, "src")`: the scene's `ctx.pid`, if still alive. `cast(p, ctx, q)` puts them in the echo (`ctx.pid`, so `fx.them` moves the real bond) with `{nm} {Nm} {he} {He} {him} {his} {His} {spo}`. An echo that buries them needs `gone(p, "src")` instead |
| What the scene said | `ecKeep: ["thing"]` keeps that `ctx` word with the record (the sibling's stolen `thing`, the hanged man's `place`, the bride song's `song`), read back with `kept(p, "src", "thing", fallback)` |
| A flag the source does set | `C.flag(p, "x")` as usual (`dip_letters`, `nb_cleared`, `av_forger`) |

The record is engine-side (written inside `A.eventChoose`, never at render), draws nothing from `A.rand`, holds only
numbers, ids and short words (`SAVES.clean` has nothing to strip), and is a new field: old saves have none, every reader
returns false, and the echo simply waits for the next sighting. About 330 sources are watched, one short array each.

## Rules every echo follows

| Rule | How |
| --- | --- |
| Follows a scene players meet | sources picked in order of how many of 64 bot lives saw them (the league's eight starts × four personalities × engaged/passive, 90 years, the callbacks agent's `freq.mjs` run): 128 of the 350 come from scenes seen in 20 or more lives, 229 from 10 or more, median 14, lowest 3. Arc stages (`ak_ ao_ ar_ aw_ la_`), gatherings (`ga_ gs_`), old age (`oa_`) and the `ni_` follow-ups that already have their own sequels were left alone |
| Depends on the choice | 338 of 350 ask which choice was taken (`took`), 134 also whether its check was won; 9 need only the sighting; 3 read a flag. 23 sources have two echoes and one has three, one per choice that deserves one (the physician, the wise woman and the priest at the sickbed are three different later scenes) |
| Not a duplicate | every source was checked against events that already read its flags or `p.flags.ev`; three echoes that repeated a 40-memory scene (`mch_toy_chest`, `mat_reeve_list`, `mat_outlaw_notice`) were cut |
| A garnish | `w: 1`, `once: true`, and a gap: 3 or more years for most, 10 to 70 for a childhood scene answered in adulthood. In four bot lives (160 years, 923 events) 13 echoes fired, 1.4% of events |
| Real choices | 2 to 4 choices (1,052 in all, 89 with a check) that trade coin against honour, a bond against your standing, the family against the law; `tools/lint-choices.mjs` finds no obviously best choice |
| Fits the life | conds use `C.*` helpers (`C.adult`, `C.hasKids`, `C.married`, `C.noble`, `C.soldier`, `C.race`, `C.realm`, `C.job`), so `A.CX_RX` classes them: an echo about your own child needs children (28), one at the guild or the chancery needs the trade |
| Voice | second person, present tense; texts 39 to 66 words before tokens are filled; labels within 12 words; no "looks at you a long time", no "for the rest of your life", no lawyers |

## Measured by

| Number (full build, every non-wip feature plus this folder) | Before | After |
| --- | --- | --- |
| Memory events (`B.memoryIndex().memory`) | **1,057** | **1,407** |
| Active events | 3,618 | 3,968 |
| Static memory share | **29.2%** | **35.5%** |
| Orphan flags | 2 | 2 |

Measured with the coordinator's probe (`/tmp/ardan/int/orph.mjs`, which calls `bench/bot.mjs`'s `memoryIndex`) on the
same feature set built without and with this folder (`node tools/build.mjs --include-wip --without=pacing[,echoes]`).
Every echo counts: its cond names `p.flags.ev` (or a flag another live event sets).

**40% is not reached.** At this size, 40% needs about 650 echoes, not 350. The scenes left after these are mostly
arc stages and gatherings with their own sequels, old-age scenes with too little life left after them, realm- or
trade-gated scenes the league rarely plays, and choices that leave nothing worth coming back to (a pie at the hiring
fair, a cup at the alehouse). I stopped at 350 rather than write echoes for those. The rest of the way is the runtime
share, where 67-memory-weave already stands at about half of fired events.

## Tests

`test.mjs`, on a full build with this folder:

| Test | What it checks | Result |
| --- | --- | --- |
| `ecReadsReal` | every `ec_` event is registered and names its source; the source is a live event (not retired, not an echo or a callback); the cond reads that source's sighting (`saw(p.flags.ev, "src")`) or a flag the source's own choices set; every `took`, `won`, `lost` and `who` names the same source; every choice index asked for exists in the source, and `won`/`lost` only ask about choices with a check; the bench counts each echo as a memory event | 350 echoes of 326 live sources (348 read the sighting, 2 only a flag) |
| `ecPlay` | every echo under three characters (human peasant 34, human noble 56, dwarf artisan 90) with its source seen ten years back and the record set to the choice, check and person its cond asks for: renders without a skip, no raw token, text within 80 words, labels within 12; every choice played, checks both won and lost, no engine error | 1,050 renders, 3,423 branches, 862 conds held |
| `ecBotLives` | four bot lives (two engaged, two passive, 60 years): no page error, the record fills, echoes fire | 4 lives (160 years, 923 events), 266 sources recorded, 13 echoes fired (13 kinds) |

Lint: `tools/lint-events.mjs` passes (350 events, 0 errors). Its eight characters have no history, so 348 echoes are
not eligible for it (a warning); `ecPlay` plays them all with the history set. `tools/lint-choices.mjs` finds 0
obviously best choices (232 compared by numbers, 0 unreadable).

Gates, on `node tools/build.mjs --out=/tmp/ardan/ec/full.html --include-wip --without=pacing`:
`node tests/run.mjs /tmp/ardan/ec/full.html --features=echoes` passes all 7 (boot, lives, saveRoundTrip, uiSmoke and
the three above). `node bench/balance.mjs /tmp/ardan/ec/full.html --workers=1` (12 lives a start): all 28 numbers inside their bands, 0 page errors (for example merchant median peak coin 405,409 in 50,000-900,000; check win rate 47.5% in 30-70).

## Source -> echo

"Lives" is how many of the 64 bot lives of the callbacks agent's frequency run saw the source. "Reads" is the
source's choice (numbered from 1) the echo answers, with "(won)" or "(lost)" for its check, a flag, or "seen" for any
choice.

| Source | Lives | Reads | Echo | Title |
| --- | --- | --- | --- | --- |
| `fl_st_exam` | 63 | `dip_letters` | `ec_diploma_loan` | A red seal, borrowed |
| `fl_st_master` | 63 | choice 1 | `ec_scholar_rent` | The scholar's rent, again |
| `fl_st_master` | 63 | choice 2 | `ec_scholar_pupil` | The pupil who could pay |
| `ni_confide` | 62 | choice 4 | `ec_confide_laughed` | What you laughed at |
| `ni_confide` | 62 | choice 2 (won) | `ec_confide_counsel` | Sent to you for counsel |
| `ni_invite` | 62 | choice 3 | `ec_invite_regrets` | The next invitation |
| `ni_invite_return` | 62 | choice 1 | `ec_good_jug_wedding` | The jug that was being saved |
| `bm_ill` | 61 | choice 1 | `ec_physician_witness` | The physician's case |
| `bm_ill` | 61 | choice 2 (won) | `ec_wise_woman_accused` | The wise woman by the ford |
| `bm_ill` | 61 | choice 3 | `ec_priest_roof` | The priest who prayed |
| `bd_old_kindness` | 60 | choice 3 | `ec_kindness_named` | A child with your name |
| `ni_slander` | 60 | choice 3 (won) | `ec_slander_stuck` | The story you told |
| `ni_slander` | 60 | choice 4 (won) | `ec_slander_else` | Something else entirely |
| `bd_old_wrong` | 56 | choice 3 | `ec_wrong_ruin` | {them}, at the bottom |
| `ni_apprentice` | 56 | choice 3 | `ec_teaching_child` | {them} offers again |
| `ni_borrow` | 56 | choice 3 | `ec_borrow_gift_back` | Coin you never asked for |
| `ni_borrow` | 56 | choice 4 | `ec_borrow_refused` | The other side of the table |
| `ni_vouch` | 55 | choice 3 | `ec_vouch_refused` | Without your word |
| `nb_accused` | 53 | `nb_cleared` | `ec_accuser_accused` | The one who believed it |
| `nb_accused` | 53 | choice 3 | `ec_still_afraid` | What they still believe |
| `nb_praised` | 53 | choice 2 | `ec_story_grew` | The story, asked for |
| `ni_apprentice_end` | 51 | seen | `ec_teacher_hands` | Your teacher's hands |
| `ni_challenge` | 50 | choice 3 | `ec_champion_back` | Your paid champion |
| `ni_challenge` | 50 | choice 4 | `ec_coward_still` | Coward, still |
| `bm_wound_care` | 48 | choice 4 | `ec_old_wound_reset` | The wound that healed wrong |
| `ni_hide` | 48 | choice 4 | `ec_hide_returned` | Back from the hulks |
| `ni_hide` | 48 | choice 3 | `ec_shut_door` | The door you shut |
| `wc_bread_since` | 47 | choice 3 | `ec_meal_sack` | The sack in the corner |
| `ch_fam_sib_fight` | 46 | seen | `ec_sib_thing_back` | {Thing}, given back |
| `bd_child_fever` | 45 | choice 2 | `ec_fox_tale` | The fox and the frozen river |
| `ni_secret` | 43 | choice 4 (won) | `ec_secret_held` | What you know of {them} |
| `ch_play_new_friend` | 42 | choice 2 | `ec_secret_place` | The old place |
| `ch_play_new_friend` | 42 | choice 4 | `ec_edge_of_game` | At the edge of the game |
| `ni_theft` | 42 | choice 4 | `ec_theft_reeve` | The reeve asks |
| `ch_ill_fever` | 41 | seen | `ec_fever_nurse` | The fever you had |
| `ln_wedding_song` | 41 | choice 1 (won) | `ec_song_daughter` | The bride's song, again |
| `ch_play_animal` | 39 | choice 1 (won) | `ec_falconer_bird` | The falconer's bird |
| `ch_play_animal` | 39 | choice 2 | `ec_creature_cage` | A creature in a cage |
| `ch_bully_bread` | 38 | choice 1 (won) | `ec_bully_toll` | {them} at the toll bar |
| `ch_bully_bread` | 38 | choice 4 | `ec_bully_hungry` | {them} at your door |
| `ch_fam_gran` | 38 | seen | `ec_story_turn` | Your turn by the fire |
| `ch_ill_accident` | 38 | choice 2 | `ec_hidden_hurt` | A child who limps |
| `ch_fest_child` | 37 | choice 4 (won) | `ec_brewhouse_kiss` | Behind the brewhouse |
| `ch_fest_child` | 37 | choice 2 | `ec_feast_image` | The image at the feast |
| `ch_inf_hearth` | 37 | choice 1 (lost) | `ec_toddler_fire` | The pretty fire |
| `ch_play_betrayal` | 36 | choice 1 | `ec_blame_repaid` | The broken window |
| `ch_play_betrayal` | 36 | choice 2 (won) | `ec_betrayal_beating` | The beating {them} took |
| `ch_play_climb` | 36 | choice 1 (won) | `ec_climb_child` | A child up {high} |
| `ln_butts` | 36 | choice 2 (won) | `ec_old_ham_bow` | Old Ham's bow |
| `bd_lucky_escape` | 34 | seen | `ec_hairs_breadth_child` | A hair's breadth, again |
| `ch_bully_mock` | 34 | choice 4 | `ec_same_chant` | The same chant |
| `ch_inf_lullaby` | 34 | seen | `ec_lullaby_child` | The same song |
| `ln_threshing_dice` | 34 | choice 2 (won) | `ec_dice_son` | The loud man's son |
| `rl_cast_priest` | 34 | choice 2 (won) | `ec_last_argument` | One more argument |
| `bd_will_coldnight` | 33 | choice 3 (won) | `ec_barn_sleeper` | Someone in your barn |
| `lf_rival_contest` | 33 | choice 3 (won) | `ec_contest_nudge` | The nudge |
| `lf_rival_contest` | 33 | choice 1 (lost) | `ec_contest_rematch` | The rematch |
| `ch_fam_drink` | 32 | seen | `ec_jug_yours` | The jug on your table |
| `ch_inf_first_word` | 32 | seen | `ec_first_word` | Your child's first word |
| `fm_family_feast` | 32 | choice 1 (won) | `ec_feast_toast_again` | The toast, asked of you |
| `lf_clipped_coin` | 32 | choice 2 (won) | `ec_clipped_stall` | The careless stallholder |
| `av_runaway_serf` | 31 | choice 1 (won) | `ec_serf_free` | A free man of the town |
| `av_runaway_serf` | 31 | choice 3 | `ec_serf_field` | In the lord's field |
| `ch_play_storyteller` | 31 | choice 1 (won) | `ec_storyteller_old` | The singer forgets |
| `fm_friend_loyalty` | 31 | choice 2 | `ec_friend_released` | Out of the gaol |
| `lf_health_fall` | 31 | choice 2 (won) | `ec_bones_to_set` | Bones to set |
| `lf_nb_hue_cry` | 31 | choice 1 or 2 or 3 (won) | `ec_hue_again` | The reeve sends for you |
| `wc_old_soldier` | 31 | choice 2 (won) | `ec_one_eyed_bequest` | The one-eyed man's things |
| `av_river_ford` | 30 | choice 2 or 3 (lost) | `ec_ford_again` | The same ford |
| `ch_faith_lessons` | 30 | choice 2 | `ec_hard_question` | The hard question, asked of you |
| `ch_faith_lessons` | 30 | choice 4 | `ec_calling_late` | The calling |
| `ch_play_game` | 30 | choice 3 | `ec_game_again` | The old game |
| `lf_hanging_crowd` | 30 | choice 2 or 3 | `ec_hanged_mother` | The road to {place} |
| `lf_hanging_crowd` | 30 | choice 1 | `ec_hanged_bequest` | From {place} |
| `wk_gen_feud` | 30 | choice 2 or 3 | `ec_feud_fire` | {them}'s barn |
| `av_caravan_guard` | 29 | choice 1 (won) | `ec_caravan_captain` | The merchant remembers |
| `ch_inf_steps` | 29 | choice 2 | `ec_stubborn_steps` | Good and ready |
| `ni_deal_loss` | 29 | choice 3 (won) | `ec_deal_cow` | The cow {them} sold |
| `rl_cast_fighter` | 29 | choice 1 (won) | `ec_master_braggart` | Your master's challenger |
| `wc_battle_song` | 29 | choice 2 (won) | `ec_big_man_song` | The big man at the back |
| `wc_burnt_end` | 29 | choice 1 (won) | `ec_buckle_owner` | The buckle in the cellar |
| `ch_ill_playmate` | 28 | choice 1 or 3 or 4 | `ec_playmate_mother` | {npc}'s mother |
| `lf_friend_feud_pick` | 28 | choice 3 | `ec_feud_crossing` | Across the street |
| `lf_friend_moves` | 28 | choice 3 | `ec_friend_back_far` | Back from {far} |
| `rl_cast_noble` | 28 | choice 1 (won) | `ec_axle_again` | The great one's carriage |
| `wc_sickness_comes` | 28 | choice 2 | `ec_sick_boy_grown` | The boy who lived |
| `lf_friend_drowning` | 27 | choice 1 or 2 (won) | `ec_life_debt` | {them}'s debt |
| `lf_sib_cover` | 27 | choice 1 (won) | `ec_cover_again` | Cover for me again |
| `bd_neighbor_help` | 26 | choice 3 | `ec_neighbor_ditch` | Your own cow in the ditch |
| `ch_bully_defend` | 26 | choice 1 | `ec_stones_again` | Stones in the lane, again |
| `ch_bully_defend` | 26 | choice 3 | `ec_stone_victim` | {victim}, grown |
| `lf_law_fence` | 26 | choice 2 | `ec_fence_flogged` | A fair price, now |
| `wc_annalist` | 26 | choice 2 | `ec_annals_read` | Your version, read back |
| `ch_dare_night` | 25 | choice 1 (won) | `ec_dare_child` | Your child's dare |
| `du_gd_undercut` | 25 | choice 3 (won) | `ec_partner_ledger` | Your partner's ledger |
| `gf_village` | 25 | choice 2 | `ec_raid_child` | One of the children |
| `lf_sib_favored` | 25 | seen | `ec_favored_gift` | What should have been yours |
| `ln_collared` | 25 | choice 3 | `ec_old_wat` | Old Wat in the lock-up |
| `av_framed` | 24 | choice 1 (won) | `ec_framer_framed` | {them}, framed |
| `lf_dice_night` | 24 | choice 1 (won) | `ec_soft_hands` | Soft hands again |
| `lf_lost_purse` | 24 | choice 1 (won) | `ec_cutpurse_grown` | The boy you let run |
| `lf_rival_marries_well` | 24 | choice 1 (won) | `ec_painted_wheels` | Painted wheels |
| `ln_lambing` | 24 | choice 1 (won) | `ec_lambing_return` | Your own ewe, straining |
| `pf_craft_whittle` | 24 | choice 2 | `ec_mother_spoon` | The spoon |
| `bd_will_fear` | 23 | choice 1 (won) | `ec_child_fear` | The fear your child has |
| `lf_alehouse_brawl` | 23 | choice 4 | `ec_back_door` | The red-faced man |
| `lf_law_false_accused` | 23 | choice 3 | `ec_accuser_again` | {them} tries again |
| `lf_nb_shouting` | 23 | choice 2 | `ec_shouting_after` | {them}, after |
| `ch_fest_fair` | 22 | choice 4 | `ec_fair_penny` | A penny at the fair |
| `lf_friend_dice_debt` | 22 | choice 1 | `ec_dice_debt_again` | Never again, again |
| `ln_tables` | 22 | choice 2 (won) | `ec_tables_friend` | The man from {other} |
| `av_road_bandits` | 21 | choice 4 (won) | `ec_bandit_hanging` | The woman with the boar-spear |
| `bd_old_enemy_peace` | 21 | choice 1 | `ec_enemy_funeral` | At the graveside |
| `bt_tooth_seller` | 21 | choice 2 (won) | `ec_tooth_seller_back` | The pedlar's real tooth |
| `ch_fest_slaughter` | 21 | choice 2 (won) | `ec_slaughter_stroke` | The stroke, asked of you |
| `lf_amb_risky_venture` | 21 | choice 3 | `ec_venture_heard` | How it went |
| `lf_friend_fugitive` | 21 | choice 1 (won) | `ec_fugitive_cloak` | Your old cloak |
| `rl_cast_merchant` | 21 | choice 3 (won) | `ec_merchant_payback` | {them} remembers the cargo |
| `wc_refugees` | 21 | choice 2 (won) | `ec_refugee_family` | The family with the goat |
| `bd_will_bullied` | 20 | choice 3 (won) | `ec_bullies_band` | Three you ran with |
| `bd_will_hunger` | 20 | choice 2 (won) | `ec_barn_sack` | A boy for a sack |
| `fm_old_friends` | 20 | choice 3 | `ec_old_friend_again` | {them}, again |
| `lf_friend_nurse` | 20 | choice 1 or 3 | `ec_nurse_returned` | Your turn with the fever |
| `lf_law_jury` | 20 | choice 2 | `ec_jury_ham` | The ham at Midwinter |
| `lf_love_status` | 20 | choice 3 | `ec_love_road` | The road past {his} door |
| `lf_moral_dying_stranger` | 20 | choice 2 | `ec_blue_door` | The blue door |
| `pl_great_lord_passes` | 20 | choice 1 (won) | `ec_lord_shoe` | A rider of {house} |
| `sg_walls` | 20 | choice 1 | `ec_siege_children` | The children of your street |
| `av_toll_lord` | 19 | choice 2 (won) | `ec_chain_knight` | The knight with the muddy shield |
| `bs_reckoning` | 19 | choice 3 | `ec_widow_name` | One of the names |
| `ch_fam_baby` | 19 | choice 1 or 2 | `ec_baby_grown` | The baby, grown |
| `lf_rival_fire` | 19 | choice 3 | `ec_fire_yours` | Your own roof |
| `lf_rival_fire` | 19 | choice 2 (won) | `ec_fire_grandmother` | The grandmother's coffin |
| `pf_melee_chalk_circle` | 19 | choice 3 (won) | `ec_chalk_champion` | The champion of the chalk circle |
| `wk_labor_gate` | 19 | choice 2 (won) | `ec_gate_again` | The men at the gate ask again |
| `av_merc_bodyguard` | 18 | choice 2 (won) | `ec_bodyguard_letter` | {them} sends for you |
| `av_wild_treasure_map` | 18 | choice 3 | `ec_map_boy` | The boy who bought the map |
| `ch_fam_chores` | 18 | choice 1 | `ec_father_nod` | Your father nods |
| `lf_amb_patron` | 18 | choice 3 | `ec_patron_other` | The one who said yes |
| `pf_learn_forged_deed` | 18 | choice 3 | `ec_deed_neighbor` | {nb}, without the meadow |
| `pf_med_unicorn` | 18 | choice 3 | `ec_unicorn_heir` | The cups did not turn |
| `wk_scribe_forgery` | 18 | choice 1 (won) | `ec_common_lost` | The common that was |
| `bd_swear_offer` | 17 | choice 2 | `ec_swear_again` | Next year, then |
| `bm_wb_weather` | 17 | choice 1 | `ec_weather_wrong` | The one time in five |
| `ch_inf_flux` | 17 | choice 1 (won) | `ec_barley_water` | Barley water |
| `ch_learn_lang` | 17 | choice 2 | `ec_lang_friend` | Your words, abroad |
| `lf_serf_woods` | 17 | choice 1 | `ec_old_right` | By hook or by crook |
| `ln_fair_ring` | 17 | choice 1 (won) | `ec_ring_rematch` | The champion with no neck |
| `pl_secret_letter` | 17 | choice 3 | `ec_cloak_stranger` | The stranger with the good cloak |
| `av_washed_bridge` | 16 | choice 1 or 2 (won) | `ec_bridge_board` | The new bridge |
| `bd_sup_recommend` | 16 | choice 2 | `ec_protector_retires` | {them} steps down |
| `bd_wild_crowneagle` | 16 | choice 1 (won) | `ec_eagle_girl` | The girl by the wall |
| `ch_coming_of_age` | 16 | choice 1 | `ec_vow_kept` | The vow you made |
| `ch_peas_birds` | 16 | choice 1 (won) | `ec_child_sling` | The clapper and the sling |
| `du_gd_commission` | 16 | choice 1 (won) | `ec_commission_copy` | A copy of your piece |
| `fm_black_sheep` | 16 | choice 1 | `ec_black_sheep_friends` | {them}'s old friends |
| `lf_house_robbed` | 16 | choice 1 or 2 (won) | `ec_limping_thief` | The tall man with the limp |
| `lf_inheritance_uncle` | 16 | choice 3 | `ec_uncle_wonder` | What the uncle had |
| `lf_rival_peace` | 16 | choice 3 | `ec_rival_deathbed` | {them} sends for you |
| `lf_teen_secret_practice` | 16 | choice 3 | `ec_practice_again` | Your hands remember |
| `wk_gen_property` | 16 | choice 2 (won) | `ec_widow_son` | The widow's son |
| `av_hiring_fair` | 15 | choice 4 | `ec_hiring_returned` | One who went |
| `av_lost_child` | 15 | choice 2 | `ec_shrine_child` | Word from the shrine |
| `av_storm_hut` | 15 | choice 1 | `ec_deserter_vouch` | The man in the hut |
| `ch_dare_orchard` | 15 | choice 1 (won) | `ec_orchard_owner` | The same orchard |
| `ch_fam_hunger` | 15 | choice 1 | `ec_hunger_youngest` | The youngest remembers |
| `fm_friend_betrayal` | 15 | choice 3 | `ec_forgiven_friend` | Whether it was wise |
| `lf_teen_future` | 15 | choice 2 | `ec_dream_later` | Later |
| `pf_dagger_kid_knife` | 15 | choice 1 (won) | `ec_bully_knife` | {bully}'s knife |
| `pf_dec_jug` | 15 | choice 1 (won) | `ec_cat_jug` | The cat did not do it |
| `pf_med_herbwife` | 15 | choice 1 (won) | `ec_white_flower` | The white flower that kills |
| `pf_tac_board` | 15 | choice 1 (won) | `ec_old_soldier_board` | Old {old}'s board |
| `rl_cast_spy` | 15 | choice 1 (won) | `ec_watched_neighbor` | The neighbour you watched |
| `sg_sacked` | 15 | choice 3 | `ec_sacked_return` | Back to {place} |
| `av_crime_smuggle` | 14 | choice 3 | `ec_shore_families` | The shore families |
| `av_lost_pass` | 14 | `av_forger` | `ec_button_seal` | The pewter button |
| `ch_teen_wage` | 14 | choice 2 | `ec_loose_stone` | Under the loose stone |
| `fm_teen_parent` | 14 | choice 1 | `ec_hayloft_child` | My life |
| `lf_mid_crisis` | 14 | choice 1 | `ec_tall_bay` | The tall bay |
| `lf_nb_hearth_spirit` | 14 | choice 3 | `ec_hearth_saucer` | A saucer by the hearth |
| `lf_teen_ballgame` | 14 | choice 3 | `ec_parish_remembers` | The parish remembers |
| `oa_late_bounds` | 14 | choice 2 (won) | `ec_bounds_wood` | The wood you swore away |
| `rl_cast_commoner` | 14 | choice 3 | `ec_hopeless_done` | {them} did it anyway |
| `av_wild_poachers` | 13 | choice 2 | `ec_poacher_hand` | A man with one hand |
| `bd_bestfriend_rival` | 13 | choice 2 | `ec_stepped_aside` | The post you gave up |
| `bd_bestfriend_rival` | 13 | choice 3 (won) | `ec_undercut_learned` | {them} finds out |
| `bd_friend_debt` | 13 | choice 3 | `ec_eight_fingers` | Eight fingers |
| `ch_apprentice` | 13 | choice 1 or 2 or 3 or 5 | `ec_master_last` | Your old master |
| `fm_sibling_law` | 13 | choice 3 (won) | `ec_border_letter` | A letter from over the border |
| `fm_sibling_law` | 13 | choice 4 | `ec_sibling_served` | {them}, out |
| `lf_amb_second_trade` | 13 | choice 2 | `ec_second_trade_joy` | Evenings only |
| `lf_petty_lord` | 13 | choice 4 (won) | `ec_exempt_found` | The one who did not pay |
| `lf_unrequited` | 13 | choice 1 | `ec_unrequited_widowed` | {them}, widowed |
| `ln_d_scr_eyes` | 13 | choice 3 | `ec_copyist_job` | The copyist's own hand |
| `ln_d_scr_lover` | 13 | choice 1 | `ec_love_letters_found` | Whose hand |
| `av_debt_hound` | 12 | choice 1 | `ec_hound_companion` | Your road-companion |
| `av_ditch_corpse` | 12 | choice 2 (won) | `ec_lead_token` | A lead token |
| `av_wild_ruin_dig` | 12 | choice 2 (won) | `ec_ruin_notes` | Your notes on the old stones |
| `bd_mentor_last` | 12 | choice 1 | `ec_mentor_lesson_passed` | The lesson about patience |
| `bd_will_break_body` | 12 | choice 2 (won) | `ec_stone_again` | The stone, again |
| `bt_tale_wrong` | 12 | choice 3 | `ec_tale_song` | The worst part, in the song |
| `lf_amb_city` | 12 | choice 2 | `ec_temple_finished` | The temple you carried stones for |
| `lf_merc_partner` | 12 | choice 3 | `ec_partner_greedier` | A little greedier |
| `lf_rival_sabotage` | 12 | choice 2 (won) | `ec_sabotage_third` | The third night |
| `lf_teen_insult` | 12 | choice 1 | `ec_insult_nose` | {them}'s nose |
| `ln_crossing` | 12 | choice 1 (won) | `ec_boatman_bench` | The bench in the boat |
| `pf_trade_caravan` | 12 | choice 1 (won) | `ec_caravan_master_back` | {trader} comes back over the pass |
| `rl_ald_oathday` | 12 | choice 2 (won) | `ec_crossed_oath` | The oath you did not mean |
| `tavern_recruit` | 12 | choice 2 (won) | `ec_sergeant_ale` | The sergeant's ale |
| `av_pass_winter` | 11 | choice 2 (won) | `ec_pass_guide` | Late on the pass again |
| `bd_sup_stolen_credit` | 11 | choice 1 | `ec_credit_repaid` | {them} pays it back |
| `ch_art_townfever` | 11 | choice 3 (won) | `ec_doorstep_bread` | Bread on your step |
| `fm_matchmaker` | 11 | choice 3 | `ec_matchmaker_wedding` | The matchmaker at your wedding |
| `lf_noble_eye` | 11 | choice 3 (won) | `ec_lord_generous` | The heir is lord now |
| `pf_melee_young_blood` | 11 | choice 2 (won) | `ec_young_blood_grown` | {them} in your road |
| `wc_sergeant_war` | 11 | choice 2 | `ec_officer_ran` | The officer who ran |
| `wk_trade_smuggle` | 11 | choice 3 | `ec_smuggler_memory` | A smuggler with a good memory |
| `wr_tempt_purse` | 11 | choice 2 | `ec_honest_purse` | The merchant with the string |
| `bd_failing_eyes` | 10 | choice 2 | `ec_reader_scholar` | Your eyes, grown up |
| `bd_parent_failing` | 10 | choice 3 | `ec_parent_siblings` | Who did not come |
| `bd_rival_saves` | 10 | choice 2 | `ec_rival_saved_back` | Your turn to pull {them} clear |
| `bm_wb_face` | 10 | choice 1 | `ec_face_story` | The story of your face |
| `camp_fever` | 10 | choice 1 (won) | `ec_camp_fever_man` | A man from the fever tents |
| `camp_letter` | 10 | choice 1 | `ec_comrade_letters` | A letter for the one who read |
| `dr_song` | 10 | choice 2 (won) | `ec_your_song` | Your song, sung by strangers |
| `lf_nb_watch` | 10 | choice 3 | `ec_watch_unseen` | What you did not see |
| `lf_peasant_ox` | 10 | choice 2 (won) | `ec_neighbor_ox` | His ox is down |
| `lf_teen_wage_spend` | 10 | choice 2 | `ec_red_boots_child` | Red boots |
| `mk_cheat` | 10 | choice 1 (won) | `ec_cheat_honest` | The same trader, honest |
| `av_courier` | 9 | choice 2 | `ec_courier_ruin` | The merchant's price |
| `av_crime_friend_ledger` | 9 | choice 1 (won) | `ec_gaoler_price` | The gaoler's price |
| `av_wanderjahr` | 9 | choice 3 | `ec_wander_child` | Your child and the road |
| `av_wild_delve` | 9 | choice 2 | `ec_delve_opened` | What grief has closed |
| `av_wild_delve` | 9 | choice 3 | `ec_small_debts` | The book of small debts |
| `bd_sup_drunk` | 9 | choice 1 (won) | `ec_drunk_sober` | {them}, sober |
| `ch_teen_crush` | 9 | choice 4 | `ec_crush_never_knew` | {them}, who never knew |
| `dr_night_alarm` | 9 | choice 3 | `ec_night_attack` | The real alarm |
| `dr_old_trick` | 9 | choice 1 | `ec_old_trick_seen` | The turn of the shaft |
| `dr_rival_company` | 9 | choice 1 (won) | `ec_rival_unit_again` | {rival} wants a rematch |
| `dr_slow_recruit` | 9 | choice 4 | `ec_slow_one_veteran` | {rec}, a veteran |
| `dr_spearwall` | 9 | choice 2 (won) | `ec_spearwall_real` | When the horses came |
| `lf_teen_first_drink` | 9 | choice 3 | `ec_barn_jug_child` | Behind the barn |
| `ln_thatch` | 9 | choice 1 (won) | `ec_thatch_neighbors` | The patch held |
| `oa_kin_alone` | 9 | choice 2 | `ec_foster_grown` | The boy you fostered |
| `pf_log_caravan` | 9 | choice 1 (won) | `ec_caravan_bigger` | {cm}'s eighty mules |
| `ch_orc_winter` | 8 | choice 1 | `ec_clan_mother_speaks` | The clan-mother remembers |
| `du_gd_loan` | 8 | choice 1 (won) | `ec_lord_son_loan` | The son wants a loan |
| `fm_lover_proposes` | 8 | choice 3 | `ec_lover_no` | On the bridge again |
| `lf_mid_student` | 8 | choice 3 | `ec_student_master` | {them}, master |
| `lf_pawn_heirloom` | 8 | choice 1 | `ec_pawn_window` | In the window |
| `lf_teen_runaway` | 8 | choice 2 | `ec_milestone` | The milestone at the crossroads |
| `pf_ath_roof_climb` | 8 | choice 1 (won) | `ec_climb_rival_fall` | {them} on the roof |
| `pf_sword_school` | 8 | choice 3 | `ec_sword_school_offer` | {inst}'s yard |
| `rl_ald_fairrush` | 8 | choice 2 (won) | `ec_fairrush_man` | The man held for the Moot |
| `rl_cast_outlaw` | 8 | choice 1 (won) | `ec_outlaw_coin` | Strange coin |
| `wr_letter_home` | 8 | choice 3 (won) | `ec_mate_letters` | A letter in your own hand |
| `av_crime_cattle_raid` | 7 | choice 2 (won) | `ec_raid_wedding` | A son of the next valley |
| `ch_dwarf_master` | 7 | choice 2 (won) | `ec_dwarf_mark` | Your mark on the wall |
| `ch_elf_human_friend` | 7 | choice 3 | `ec_elf_grandchild` | At the edge of the Oak Line |
| `ch_teen_brawl` | 7 | choice 3 | `ec_brawl_nerve` | More nerve than they knew |
| `cm_horse_thieves` | 7 | choice 3 | `ec_thieves_back` | The thieves come back |
| `cm_life_market` | 7 | choice 3 (won) | `ec_ribbon_woman` | The ribbon woman |
| `cm_merchant_scales` | 7 | choice 2 (won) | `ec_neighbor_warden` | The warden's new man |
| `du_cm_clerk_wanted` | 7 | choice 2 | `ec_clerk_road` | The road you did not take |
| `du_ct_crooked_bailiff` | 7 | choice 3 | `ec_bailiff_owes` | The bailiff who owes you |
| `du_ct_forged_charter` | 7 | choice 3 | `ec_valley_lost` | The valley that changed hands |
| `lf_health_plague_near` | 7 | choice 1 (won) | `ec_turned_away` | Someone you turned away |
| `lf_outlaw_cousin` | 7 | choice 2 (won) | `ec_outlaw_word` | Word from over the border |
| `pf_craft_masterpiece` | 7 | choice 2 (won) | `ec_masterpiece_copied` | Your piece, copied |
| `rl_f_priest` | 7 | choice 3 | `ec_calling_other` | Somebody else's child |
| `wk_farm_drought` | 7 | choice 1 (won) | `ec_deep_well` | Your well, again |
| `wr_corrupt_reeve` | 7 | choice 1 | `ec_reeve_other_name` | Whose name |
| `wr_gallows_crowd` | 7 | choice 3 (won) | `ec_gallows_cup` | A cup for the cart |
| `av_crime_old_crewmate` | 6 | choice 3 | `ec_crewmate_honest` | {them}, mended |
| `av_road_famous_outlaw` | 6 | choice 3 | `ec_outlaw_name_heard` | You hear the name again |
| `av_wild_greenwood` | 6 | choice 3 | `ec_greenwood_next` | Next time, then |
| `av_young_firstkill` | 6 | choice 3 | `ec_child_first_deer` | Your child's first deer |
| `bd_convalescence` | 6 | choice 1 (won) | `ec_read_to_priest` | Reading to the priest |
| `ch_nob_pony` | 6 | choice 2 | `ec_old_pony` | {pony}, old |
| `ct_herald` | 6 | choice 3 (won) | `ec_herald_rival` | Two suns for a herald |
| `fm_friend_dying` | 6 | choice 2 | `ec_friend_family` | The promise at the bedside |
| `fm_parent_remarry` | 6 | choice 1 | `ec_step_parent` | {np}, after |
| `fm_spouse_ill` | 6 | choice 2 (won) | `ec_spouse_nurses` | Your turn in the bed |
| `fm_spouse_secret` | 6 | choice 3 | `ec_secret_knife` | The knife you kept |
| `lf_blood_price` | 6 | choice 1 | `ec_blood_price_killer` | The one who paid for {vic} |
| `lf_teen_dwarf_restless` | 6 | choice 3 | `ec_dwarf_human_friend` | A human from that season |
| `pf_dagger_alley` | 6 | choice 1 (won) | `ec_scarred_forearm` | A scar on his forearm |
| `pf_dagger_hire` | 6 | choice 2 (won) | `ec_mark_returns` | {mark} comes back |
| `pf_dec_relics` | 6 | choice 2 | `ec_relic_mate` | {mate} wants words |
| `pf_sword_stumble` | 6 | choice 2 (won) | `ec_boutmaster_revenge` | {bm} does not forget |
| `pf_xbow_popinjay` | 6 | choice 1 (won) | `ec_popinjay_defend` | King of the bird |
| `pl_house_feud_sides` | 6 | choice 4 (won) | `ec_houses_again` | {h1} and {h2}, again |
| `pl_land_dispute` | 6 | choice 2 (won) | `ec_stone_moved_again` | The stone walks again |
| `rl_f_hearth` | 6 | choice 3 (won) | `ec_coals_marta` | Coals for Old Marta |
| `rl_zn_nugget` | 6 | choice 3 | `ec_nugget_verse` | A verse about you |
| `wk_dwarf_kindling` | 6 | choice 2 | `ec_thrain_flame` | For Thrain |
| `wr_hired_knife` | 6 | choice 4 | `ec_river_widow` | Out of the river |
| `wr_pay_day` | 6 | choice 2 | `ec_pay_home` | What the pay bought |
| `av_heist_start` | 5 | choice 4 | `ec_heist_out` | How it went |
| `bd_sworn_trouble` | 5 | choice 3 | `ec_sworn_broken` | The oath, a little broken |
| `du_ch_confession` | 5 | choice 1 | `ec_bell_tower_man` | The man from the bell-tower |
| `du_ch_heretic` | 5 | choice 2 | `ec_preacher_released` | The preacher, released |
| `du_ch_plague` | 5 | choice 1 (won) | `ec_named_children` | Children with your name |
| `du_ct_fair_copy` | 5 | choice 2 (won) | `ec_clause_nine` | Clause nine |
| `pf_cmd_unpaid` | 5 | choice 3 | `ec_hanged_brother` | The loudest one's brother |
| `pf_stealth_letter` | 5 | choice 4 | `ec_good_gloves` | The man in good gloves |
| `pf_stew_improve` | 5 | choice 3 | `ec_tenants_repay` | Good tenants, in a bad year |
| `pl_foreign_merchants` | 5 | choice 3 | `ec_foreign_stall` | The stall you broke |
| `pp_orc_captive` | 5 | choice 1 | `ec_captive_ransom` | Your captive's people |
| `rk_cpt_surgeon` | 5 | choice 3 | `ec_company_surgeon` | {sur}'s bag |
| `wk_farm_boundary` | 5 | choice 4 | `ec_two_more_paces` | Two more paces |
| `wr_camp_boy` | 5 | choice 2 | `ec_camp_boy_miller` | {boy}, at the mill |
| `wr_crown_unpaid` | 5 | choice 2 | `ec_ringleader_back` | The men's bad book |
| `av_crime_recruit` | 4 | choice 3 | `ec_crew_again` | The offer stands |
| `av_merc_paymaster` | 4 | choice 2 | `ec_farm_did_not_eat` | The farm that did not eat |
| `av_sea_jettison` | 4 | choice 1 | `ec_master_remembers` | The master remembers who went first |
| `av_sea_salvage` | 4 | choice 1 | `ec_ship_master_returns` | The master of the wreck |
| `bd_will_march` | 4 | choice 2 (won) | `ec_pack_carried` | Double weight |
| `ch_nob_hawk` | 4 | choice 1 (won) | `ec_hawk_child` | Your child's first hawk |
| `ct_bastard_claim` | 4 | choice 2 | `ec_bastard_son` | The claimant's son |
| `ct_knight_errand` | 4 | choice 3 | `ec_petitioner_fate` | The petitioner |
| `ct_tenants` | 4 | choice 3 | `ec_murrain_name` | The way they say your name |
| `du_ch_relic` | 4 | choice 1 | `ec_pig_finger` | The saint's finger |
| `du_ct_petitions` | 4 | choice 2 | `ec_miller_waited` | The miller who waited |
| `du_ct_tax_roll` | 4 | choice 2 (won) | `ec_holloway_remembers` | Holloway remembers |
| `hs_k_cousin_friend` | 4 | choice 1 | `ec_cousin_secret_places` | The cousin who stayed |
| `hs_rival_insult` | 4 | choice 4 (won) | `ec_rival_house_truce` | A truce at the fair |
| `lf_inlaw_feast` | 4 | choice 3 | `ec_inlaw_dying` | The in-law, dying |
| `lf_mid_old_friend_rich` | 4 | choice 1 | `ec_rich_friend_ruined` | Three ships, sunk |
| `lf_noble_steward_theft` | 4 | choice 3 | `ec_steward_land` | The steward's land |
| `pf_dipl_border_captain` | 4 | choice 2 (won) | `ec_border_marriage` | The marriage across the border |
| `pf_etiq_slip` | 4 | choice 1 (won) | `ec_lady_friend` | Lady {lady} remembers |
| `pf_lance_ransom` | 4 | choice 3 | `ec_lance_courtesy` | Courtesy, returned |
| `pf_ride_breaker` | 4 | choice 2 (won) | `ec_stallion_foal` | His foal |
| `pf_ride_race` | 4 | choice 3 (won) | `ec_brook_race` | The brook |
| `pf_stealth_overheard` | 4 | choice 2 (won) | `ec_hayloft_enemies` | Two frightened men |
| `pf_stealth_overheard` | 4 | choice 3 | `ec_hayloft_done` | What happened next |
| `pp_dw_gates` | 4 | choice 3 | `ec_gates_last_move` | The last move |
| `pp_dw_sink` | 4 | choice 3 (won) | `ec_ferry_child` | The child from the ferry |
| `pp_orc_deedlost` | 4 | choice 2 | `ec_deed_new` | A new deed-name |
| `tr_smith_d_hammer` | 4 | choice 2 (won) | `ec_iron_gate` | Another gate |
| `wk_farm_blight` | 4 | choice 4 | `ec_dole_giver` | At the dole, the other side |
| `wk_farm_flood` | 4 | choice 3 | `ec_flood_widow` | The village sees |
| `wr_cruel_captain` | 4 | choice 3 | `ec_drummer_grown` | The drummer boy |
| `wr_ford_rescue` | 4 | choice 3 | `ec_not_in_suns` | Not paid in suns |
| `wr_hf_deserter` | 4 | choice 2 | `ec_deserter_mother` | {des}'s mother |
| `ct_poacher` | 3 | choice 3 (won) | `ec_forester_son` | The forester's own son |
| `hs_k_graves` | 3 | choice 2 | `ec_smallest_grave` | The smallest grave |
| `pf_faith_debate` | 3 | choice 3 (won) | `ec_debate_friend` | Partly right |
| `pf_surv_mushrooms` | 3 | choice 3 | `ec_mushroom_child` | {nb}'s youngest |
