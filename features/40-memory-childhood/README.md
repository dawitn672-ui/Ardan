# 40-memory-childhood: childhood memories come back

**Aspect:** events and story, memory. **Kind:** event pack only (`childhood.events.js`). It adds no patches and no core code.

The release sets 27 flags in childhood and youth (a vow made in a slave yard, a stone thrown at a bailiff's horse, a ring-dive, a pawned heirloom, a teenage gang) and never reads them again. This pack reads every one of them. Each flag gets 1 or 2 callback events (42 in all), years later. Each callback recalls the original moment concretely and poses a new decision. A further 20 events are the second steps of 2-step arcs. That makes **62 events**, prefix `mch_`.

## How the events are built

Rules taken from King of Dragon Pass (consequences that come back years later), Failbetter's quality-based narrative (a stored quality unlocks content), and CK3 story cycles (a memory that escalates in stages):

- **Concrete recall.** Each callback was written against the setter event's full source. It names the place, the role and the act: the driver's bench of a cart like the one in the yard, the rent tallies floating at the ford, the Law-Carvers' stone. It checks every setter path that sets the flag, so it never asserts a detail only one choice produced. For example, `ch_ring_failed` is also set by refusing to dive, so its callbacks say "did not bring up the ring", not "came up empty".
- **Timing.** Every `cond` has `C.flag(p, "<flag>") && A.S.year - p.flags.<flag> >= N`, with N from 2 to 20. The test checks that each event is closed in the year the memory was made.
- **The setter's world.** Each event keeps the original's gates: race (elf, half-elf, dwarf), realm (Greyhaven POL-14, Ranpur POL-30), bloodline (Quickened, Bleeds-laughing, Owl-eyes), class, faith (the Temple questioners need REL-01/02) and life stage.
- **Real decisions.** Every event has 3 choices with a tradeoff. Every event has at least one branch that leaves a mark: a trait, a wound, a deed, an epithet, a favor owed either way, a claim, an asset, a relationship with a named person, or an arc flag. The test enforces this.
- **People.** The pack finds a person the engine linked at the original moment when it can: a relation whose `since` equals the flag's year, the dock gang leader by his `occ`, the school master by `p.school.mpid` or the mentor relation, the realm's real heir, or a child of the right age. When the original person was never stored, the event either creates a fitting one (the girl from the cart, now grown; the dead playmate's mother) or describes them without a name. If the person it needs is dead or missing, the event drops itself (`ctx.skip`) instead of misattributing.
- **Arc identity.** A first step that hands a person to its second step stores that person's id in a companion flag (`mch_pledge_who`, `mch_poisoner_who`, `mch_flame_who`, `mch_son_sea_who`, `mch_custom_child`, `mch_fits_confidant`, `mch_knock_who`, `mch_ashen_who`, `mch_gang_who`, `mch_squire_who`). So the second step happens to the same person.
- **Weights.** `w: 2` or `3`, `once: true`. Checks are tuned to the engine's scale (45 is typical), pairing a skill with a stat so an unskilled character is at long odds, not at the 4% floor.

## Flag to callback events

| Chunk flag | Set by (event: choice) | Read by (minimum years after) |
| --- | --- | --- |
| `ch_vow_freedom` | ch_slave_sold: "Swear that one day you will be free" | `mch_vow_cart` (5y+, still a slave), `mch_vow_kept` (8y+, free) |
| `ch_secret_reader` | ch_slave_letters: "Listen and learn in secret" | `mch_reader_will` (4y+, still unfree), `mch_reader_window` (8y+, free) |
| `ch_hates_lord` | ch_serf_bailiff: stone at the horse, or watch and remember | `mch_bailiff_ford` (8y+, still poor), `mch_lord_mill` (12y+, risen and rich) |
| `ch_page` | ch_gent_page: every "go" choice | `mch_page_fellow` (10y+), `mch_page_child` (15y+, noble or gentry parent) |
| `ch_betrothed` | ch_nob_betrothal: every choice | `mch_betrothal_due` (6y+, unmarried noble) |
| `ch_hostage` | ch_roy_hostage: every choice | `mch_ward_table` (8y+), `mch_pledge_own` (10y+, ruler with a child) |
| `ch_poison_enemy` | ch_roy_poison: "Find out who sent it" (failure) | `mch_poison_cook` (8y+) |
| `ch_first_love` | ch_teen_crush: "Give {khim} a small gift" (success) | `mch_first_gift` (8y+), `mch_first_love_child` (15y+) |
| `ch_kept_toy` | ch_ill_playmate: "Keep the {toy}" | `mch_toy_chest` (10y+) |
| `ch_short_friend` | ch_elf_human_friend: be friends, or teach the bow | `mch_elf_wedding` (12y+, elf) |
| `ch_own_tree` | ch_halfelf_tree: "Plant a sapling of your own" | `mch_tree_pond` (8y+, half-elf) |
| `ch_named` | ch_dwarf_namecarving: every choice | `mch_name_flaw` (10y+, only if the flaw deed exists), `mch_name_apprentice` (12y+) |
| `ch_seaboy` | ch_greyhaven_sea: every "go" path | `mch_seaboy_son` (12y+, Greyhaven, son of ten) |
| `ch_ring` | ch_tidewell_ring: either successful dive | `mch_ring_lords` (10y+, Greyhaven, not ruler) |
| `ch_ring_failed` | ch_tidewell_ring: failed dive or refusal | `mch_ring_jetty` (12y+, child of seven), `mch_ring_unringed` (10y+) |
| `ch_arsenic` | ch_ranavir_arsenic: every choice | `mch_arsenic_cup` (10y+), `mch_arsenic_spoon` (15y+, child of five) |
| `ch_fits_secret` | ch_bl_quickened: "Hide what happened" | `mch_fits_torchlight` (5y+) |
| `ch_fits_known` | ch_bl_quickened: tell family, or learn your rule | `mch_fits_night_raid` (4y+, soldier), `mch_quickened_letter` (6y+, not a soldier) |
| `ch_vitia` | ch_bl_montaro: laugh, grab the nettles, or a failed fake cry | `mch_vitia_fester` (8y+), `mch_vitia_summons` (10y+) |
| `ch_veil` | ch_bl_owl: "Wear a veil of dark gauze by day" | `mch_veil_court` (8y+), `mch_veil_search` (6y+) |
| `lf_secret_love` | lf_love_status: "Love {themHim} in secret" (success) | `mch_knock` (4y+) |
| `lf_knows_ashen` | lf_friend_ashen: "Keep {theirHis} secret" | `mch_ashen_questions` (3y+, Temple faith) |
| `lf_pawned` | lf_pawn_heirloom: pawn it, or the failed family appeal | `mch_pawn_window` (2y+, 40+ suns), `mch_pawn_asked` (5y+, parent alive) |
| `lf_gang` | lf_teen_gang: "Join" | `mch_gang_crate` (5y+), `mch_gang_child` (15y+, town, teenage child) |
| `sc_masters_pupil` | school_master_eye: "Go, and work as you never have" | `mch_master_sends` (8y+) |
| `tourneyWin` | pr_tourney_joust: "Ride in the joust yourself" (success) | `mch_tourney_son` (6y+), `mch_tourney_old` (15y+, old, grown child) |
| `tourneyMelee` | pr_tourney_joust: "Fight in the melee on foot" | `mch_melee_custom` (5y+) |

## The 2-step arcs (20)

| First event | Choice | Sets | Second event (years later) |
| --- | --- | --- | --- |
| `mch_vow_cart` | Cut her rope at the marsh and run (success) | `mch_cart_girl` | `mch_cart_woman` (10y+): the girl, grown, and the mine's factor |
| `mch_reader_window` | Leave the shutter open / teach him (success) | `mch_taught_slave` | `mch_slave_letter` (8y+): his letter about crooked ledgers |
| `mch_bailiff_ford` | Push the tallies under the ice (success) | `mch_tallies_drowned` | `mch_tally_reckoning` (3y+): the steward pays for names |
| `mch_lord_mill` | Lend it, with the mill as surety | `mch_holds_mill` | `mch_mill_toll` (2y+): you set the toll on your birth manor |
| `mch_betrothal_due` | Break it, and pay the forfeit | `mch_broke_match` | `mch_feud_wakes` (3y+): the feud you were meant to mend |
| `mch_pledge_own` | Send your child as a pledge | `mch_sent_pledge` | `mch_pledge_home` (3y+): the same child comes home |
| `mch_poison_cook` | Say nothing, and keep the name | `mch_poisoner_named` | `mch_poison_lever` (4y+): the poisoner alone in the chapel |
| `mch_first_gift` | Walk them home the long way | `mch_old_flame` | `mch_old_flame` (2y+): choose, or end it |
| `mch_toy_chest` | Give it to your own child | `mch_toy_passed` | `mch_toy_lost` (3y+): the child has lost it |
| `mch_elf_wedding` | Go to the wedding / send a bow | `mch_elf_wedding` | `mch_elf_friend_child` (8y+): your friend's child at the Oak Line |
| `mch_tree_pond` | Move the tree / have it named (success) | `mch_tree_kept` | `mch_tree_acorn` (6y+): a half-elf child under your oak |
| `mch_name_apprentice` | Take the apprentice | `mch_dwarf_apprentice` | `mch_apprentice_carving` (11y+): the same apprentice's flaw |
| `mch_seaboy_son` | Pack the bread, the knife and the cap | `mch_son_at_sea` | `mch_son_returns` (3y+): the whaler's offer |
| `mch_arsenic_spoon` | Send the physician away | `mch_broke_custom` | `mch_custom_reckoning` (5y+): sugared almonds, the same child |
| `mch_fits_torchlight` | Tell a friend the truth | `mch_fits_told` | `mch_fits_confidant` (4y+): that friend's debt, and "yet" |
| `mch_knock` | Open the door | `mch_knock_opened` | `mch_knock_known` (2y+): the steward with a paper |
| `mch_ashen_questions` | Swear you know nothing (success) | `mch_ashen_perjury` | `mch_ashen_repaid` (4y+): the Ashen repay the oath |
| `mch_gang_crate` | Keep the crate in your cellar | `mch_gang_crate` | `mch_crate_reckoning` (3y+): your name in the fence's ledger |
| `mch_master_sends` | Go back and teach for a season | `mch_master_yard` | `mch_master_heir` (3y+): a rival pupil, settled the old way |
| `mch_tourney_son` | Take the knight's son into your household | `mch_took_squire` | `mch_squire_letter` (4y+): the postern letter |

Every flag the pack sets is read by a `cond`, so the pack adds no new orphan flags. Some choices also feed existing systems: `outlaw` (escape), `ch_fits_known` (a fit seen in public), `secret`, favors, claims and epithets ("Owl", "the Unringed").

## Testing and measurement

```sh
node tools/build.mjs --out=/tmp/ardan/40-memory-childhood/x.html --only=memory-childhood
node tools/lint-events.mjs --feature=memory-childhood --html=/tmp/ardan/40-memory-childhood/x.html
node tests/run.mjs /tmp/ardan/40-memory-childhood/x.html --features=content-fixes,memory-childhood --only=boot,tokens,mchMemory
```

The linter can only play events that its 8 stock characters can see. These callbacks need history, so the linter reports them all as "not eligible" (expected). `test.mjs` (test `mchMemory`) does the play-testing instead:

1. Each of the 27 chunk flags is read in some event's `cond`. Every `mch_` flag the pack sets is read too. All 62 events are registered.
2. Every event leaves a lasting mark on at least one branch.
3. 65 fixtures, at least one per event: a character who carries the memory (for example, a dwarf with the flaw deed, a Ranpur royal with a five-year-old, or a Quickened soldier). For each fixture:
   - The event is closed in the year the memory was made and open N years later.
   - `A.evFit` does not hide it.
   - It renders with no raw `{token}`, text of at most 80 words and labels of at most 12.
   - Every choice is taken, with checks forced to win and to lose: 267 branches. No branch may throw, log an engine error, leave a raw token, produce a result over 70 words, or leave a non-finite stat.
4. All 20 arcs are played through. The test takes the arc choice, advances `A.S.year`, then checks that the second step opens and renders for the same character and the same person.

I verified the test by mutation. In a copy of the repo I planted five defects: an unfilled token, a removed flag read, a broken arc link, a removed timing gate and an unread chunk flag. `mchMemory` failed on all five.

For the bench (`bench/run.mjs`), every event here is a memory event under `B.memoryIndex`: its `cond` reads a flag that another event sets.

## Limits, and what a fuller version would do

- The release stores only the year of each flag. It does not store who was there or what was chosen. The names of the sold friend, the dead playmate, the betrothed child and the pawned heirloom are not stored. So those callbacks describe them, or say what has become of them, instead of naming them. An engine memory record at the setter, `{flag, year, pid, choice, place}` (Road to Ten, "who, what, when"), would let every callback name them. That needs a patch to the setter events, which this pack does not own.
- Arcs are 2 steps. A third, late-life step could close several of these threads in old age. Candidates: the freed boy at your deathbed, the flawed apprentice carving their own apprentice, the hostage-child as ruler.
- Fixtures cover each event under one or two characters. They do not cover every class and realm combination. The bot league (`bench/`) is the place to measure how often these fire in real lives.
