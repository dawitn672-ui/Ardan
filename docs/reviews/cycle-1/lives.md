# Cycle 1 review: lives in the mid and late game

Reviewer: **lives**. Angle: what a whole life feels like after the first ten years, on the default Great Continent, Far Lands against Known World.

## How I played

- **Ten bot lives** on `index.html` (Great Continent, `A.newGame({ lands: 'great' })`), 37 to 57 years each, through the engine's own queue (`A.advance`, `A.eventView` / `eventChoose`, `duelAuto`, `battleAuto`, `missionAuto`).
  - The bot picks the safest choice: the best check odds, or the fight badge's odds (`c.fight.pct`).
  - It spends initiative on a plan that suits the path (train and spar for a soldier, lending and ventures for a merchant, prayer and study for a priest).
  - The runner is `/tmp/ardan/cycle1/lives/life.mjs`, the per-life numbers are `an.cjs`, and the raw logs are `/tmp/ardan/cycle1/lives/<life>.json`.
- **One life through the real menu**: New life, Taulen, Grown, start, then fast-forwarded 32 years. Its screenshots are `/tmp/ardan/cycle1/lives/ui-taulen-*.png` (the runner is `ui.cjs`).

| Life | Born in | Start | Years | End | Ending |
| --- | --- | --- | --- | --- | --- |
| F1 soldier | Taulen (Twin Rivers) | peasant 17, enlisted | 51 | died 67 | Of Good Repute Before the Gods |
| F2 merchant | Tide Families | merchant 18 | 0.5 | died 18, crocodile | Cut Short |
| F2b merchant | Tide Families | merchant 18 | 55 | died 72 | The Wealthy (438k suns) |
| F3 courtier | Vahra | noble 17 | 8 | died 24, horse kick | The Commander |
| F4 ruler | Birch March | royal 20, crowned | 37 | died 56 | The Crowned |
| F5 priest | Ozand | artisan 17, novice | 43 | died 59 | The Wealthy (bishop, on the council) |
| K1 scholar | Varenna | artisan 17 | 57 | alive at 73 | The Wealthy (carpenter) |
| K2 outlaw | Aldmark | peasant 17 | 57 | alive at 73 | The Commander (general from 29) |
| K3 soldier | Aldmark | peasant 17, enlisted | 57 | alive at 73 | The Commander |
| K4 ruler | Solenne | crowned at 20 | 53 | died 72 | From the Dust to the Throne |

Six of the ten lives were born in the Far Lands. Every life met 6 to 10 events a year, and no year passed without one. The game has **no dead stretches by event count**. Its late-game problems are of another kind:

- a career tops out and nothing comes after it;
- consequences don't land;
- the same scenes repeat for rulers;
- money stops meaning anything;
- the generic pool speaks English-medieval everywhere.

A caveat on method: the bot never opens the War Room, the Decisions list or a person's plot buttons. Where a finding depends on that, I say so. Even so, "a system the game never brings to you" is a finding for a player of 13 to 23, who also won't find it.

---

## Bugs

### B1. A failed usurpation has no consequence (impact 5, size M)

**What I saw.** In K2, an Aldmark general of 44 took `rk_gen_coup` ("Say the word") and `plot_throne` ("Strike now", about 70 in 100). The log then reads:

- "Achievement: Usurper — Seize a throne that was not yours";
- "The coup half-succeeds… civil war — and you lead one side";
- in 1134, "The War of the Aldmark Succession ends: the crown of Aldmark crushes the claimant".

**The same month**, he reads "You now answer to Audra of Brookcliff, High General of Aldmark". He pays the crown's army from his own purse (`rk_gen_chest`) and serves the emperor he tried to kill for 39 more years, untouched. During the war, `ri_taken` had him captured by "men of Merrick's cause", which was his own side. (Log: `/tmp/ardan/cycle1/lives/K2-outlaw.json`, years 1132–1134.)

**Why it matters.** This is the biggest gamble the game offers. A young player who loses it and is simply forgiven learns that nothing they do counts. CK3 would end the life or the dynasty here.

**Fix.**
- When a claimant war ends with the claimant crushed (the war-end path that logs "crushes the claimant") and the claimant is the PC, run a fate scene: flight abroad, the block, prison or a pardon with conditions. Use `punish: 'treason'` or an exile, strip `pc.mil`, set infamy, and give an ending hook.
- Award "Usurper" only when `pc.ruler` is actually set.
- In `ri_taken`'s setup, skip the scene when the captors' cause is the PC's own.
- Owner: the release's claimant war, patched in a new war or fix feature. `68-casus-belli` is the nearest home.

### B2. The "Raise a hunt with the village" choice kills young merchants: the hunt scene's fight carries no odds badge (impact 5, size S)

**What I saw.** F2, a merchant of 18 in the Tide Families, met `fb_at_the_herds` and chose "Raise a hunt with the village", which has no badge and reads as the safe, social answer. It leads to the release's `hunt_beast`, whose first choice is "Attack it head-on". The badge from `89-fight-odds` is missing there, because that choice's `fx` is a function calling `A.startDuelFront(... {beastId})`. 89 only recognises `fx.beast` or a `beast: {` in the source. She went in alone and died to a Gulf Plain Mugger Crocodile in her first half-year. F3, a noble of 17 in Vahra, met the same chain (`hunt_beast` "Attack it head-on") in his first year.

**Why it matters.** It's a death in the first session with no warning shown, the exact thing 89-fight-odds was built to stop. "A hunting party" that then fights alone is also a broken promise.

**Fix.**
- In `features/89-fight-odds`, also detect `startDuelFront(`/`startDuel(` with `beastId:ctx.beast` and badge those choices, the trap and arrow ones too, at their `mod`.
- In `fb_at_the_herds`, "Raise a hunt" should go straight to the party option (`party: { n }`) rather than to a scene whose first button is a solo charge.

### B3. Seen-dead and same-name NPCs: one "Suilan" dies and "Suilan" keeps acting for 30 years (impact 4, size M)

**What I saw.** In F1 (Taulen), the patron Suilan Mol "dies of a failing heart, aged 69" in 1122. From 1148 to 1154, events say "Suilan is going about saying…", "What Suilan told", "Why Suilan talked" and "Suilan's house is on fire". These come from other people called Suilan (Suilan Ruo, Suilan Tav), shown by given name alone. The same happens with Kaosen (a comrade dies in 1106; a rival Kaosen follows) and Zeomo (a comrade dies in 1106; your father Zeomo dies in 1121). In K2 (Aldmark), four different Rolands die or turn enemy in one life.

**Why it matters.** The game's best feature is memory: callbacks, `ni_*` follow-ups, the chronicle. Name collisions make memory look like a bug ("didn't she die?").

**Fix.**
- In `A.evFill` (the `{them}` and `{khe}` token path) and 21-npc-initiative's text, use the given name plus the house or byname when another living or remembered person the PC knows shares the given name.
- Make NPC generation (`mk`, the release's name pick) avoid a given name already used by someone in `pc.rel` or a close relative.

### B4. Ruler and general get scenes for a peasant or a private (impact 4, size S per event)

**What I saw.**
- F4, Queen of Birch March:
  - `wr_hf_raiders` "Flee to the woods with what you can carry";
  - `wr_hf_deserter` "Turn him in for the bounty";
  - `ak_sibling_2` "Hide her in the hayloft";
  - `lf_harvest_dance` ("the village will marry you to by spring");
  - `ln_d_scr_lover` ("Keep writing; it is only a job": a scribe's duty);
  - "In want: there is too little coin and too little warmth".
- K2, a General leading 12,800, got `camp_officer` ("A captain rides past during drill and stops. 'You. Name?'") at 42, 49, 51, 57 and 62.
- K1, a 68-year-old carpenter, got `av_merc_looting` ("Take the sword and the ring") and `av_road_sellsword_offer`.

**Why it matters.** Nothing breaks immersion in the late game faster. CK3 gates every event by tier.

**Fix.**
- Add `!C.ruler(p)` to `homeFront`, `lf_harvest_dance` and `ak_sibling_2`, and `C.job(p,'scribe')` to the `ln_d_scr_*` duties.
- Add `p.mil.rank <= 3` to `camp_officer`, `camp_letter` and the other rank-and-file camp scenes.
- Add an age cap of about 55 to the `av_merc_*` and `av_road_*` adventure offers.
- A sweep in `features/02-content-fixes` (cond patches) would do it.
- A cheaper broad fix is in `A.evAudience` (`A.CX_RX`): treat rank ≥ 6 soldiers like nobles for "subordinate" scenes.

### B5. Death manner misread (impact 2, size S)

**What I saw.** F3 died of "a kick from a horse" and the chronicler wrote "The Commander, as all things end". `A.MANNERS` in `features/28-endings/endings.core.js` matches `kicked` but not "kick from". Under 60, "a wound gone bad", "a bad tooth that poisoned the blood", "a failing heart" and "a stroke" also fall to "as all things end".

**Fix.** Widen the regexes: accident `kick`; sickness `wound gone bad|tooth|poisoned the blood`; age-or-body `heart|stroke` at any age. This is a test case for `endingsNamed`.

### B6. Token fallback "Master your master" (impact 2, size S)

**What I saw.** K2 got `bd_boss_test`: "Master your master hands you a task nobody wants". `{bossTitle}` and `{boss}` both fall back to the same word.

**Fix.** In the fallback where `{boss}` becomes "your master", set `bossTitle` to an empty string, or skip the scene when there is no superior (97-life-fixes `LF-BOSS-PICK`).

### B7. Absurd battle and patrol numbers in the log (impact 3, size S–M)

**What I saw.**
- K2: "Bandit hunt near Brookcliff: Triumph. Enemy dead: 5,141. Your losses: 0."
- "Battle of Calandor: … 1,814 of yours dead, 55 of theirs" (a one-day rout).
- "Battle of Castella: … 37 of yours dead, 4,595 of theirs."
- F1: "Patrol near Zaoven: Triumph. Enemy dead: 17. Your losses: 0" at file-leader rank is fine, but bandit hunts scale with army size, not with bandits.

**Why it matters.** Numbers of this kind tell the player that war is noise. Mount & Blade's casualty ratios stay believable, and players read them.

**Fix.**
- Cap the enemy count of a mission (`A.missionAuto` and the mission's foe size) by its kind: a bandit hunt is 20 to 300.
- Clamp a one-day battle's loss ratio to about 1:12, unless the side is routed and run down. Then the AAR says so ("their divisions broke and were run down" already exists).

### B8. Wars start and end within months, and a ruler never sees one (impact 4, size M)

**What I saw.**
- F4 (Birch March), 1107: "War! The War of Vesmaa… ends: Right Wing wins and takes Veskar, Ilmla, … Vesavor" (12 provinces) the same year. 1110: "War of Ogohod… ends: Birch March wins and takes" 14 provinces, again within the year.
- K4 (Solenne) shows the same in the Known World: in 1105 two wars were declared and ended, with four provinces lost.
- In 37 and 53 years of rule, F4 and K4 got **zero battles, zero war councils and zero war events**. The ruler's war is a line in the log.
- The menu life: "Your home, Tankiat, now belongs to March of the Long Wall" and "Hesh wins and takes … Tankiat" (25 provinces). See `/tmp/ardan/cycle1/lives/ui-taulen-y32-path.png`. The PC, a General of Taulen, keeps his post and his house, with no scene.

**Why it matters.** The late game of a ruler is meant to be the grand strategy half of the game. Losing a third of a realm in one season, with no prompt, reads as a bug. The bot didn't open the War Room, but the game should still bring a ruler to the war (KoDP brings every raid to the clan ring as a scene).

**Fix.**
- When the PC is ruler or general and a war starts, queue a war council scene with three stances (`A.wsSetOrder`). Then queue a scene when a province of the PC's realm falls: the war room, or "let the marshal handle it".
- Look at the Great Continent's war tempo (`991-far-war`, `A.armyThink` `every`) and the release's war end condition. A war of 12 provinces in under a year needs a floor on war length, or on war score per province taken.
- When the PC's home changes realm, queue a scene: stay under the new crown, or go. 99-far-lands' bench and 991's `fwKnownSame` don't cover this.

---

## Improvements

### I1. Careers top out by 30 and then nothing new happens for 40 years (impact 5, size L)

**What I saw.**
- K2: a peasant enlisted at 18 was General ("You now lead 12,800") at **29**, then held `mil.rank 7` from 30 to 73.
- K3: General at 54.
- F3: Commander rank 6 at 22.
- K1: carpenter "Master of the yard" (the top rank) at 22.
- F5: "Banker" at 34.

After the top rung:

- No title or land: `rung` stayed -1 in every life, even with fame 100 and 273,000 suns.
- No knighthood, and so no order. `or_invite` needs "Gentle birth, a title, or knighted". I checked `A.orderReqs` for Aldmark's Iron Wolf: a commoner with fighting worth 108 fails it. No life joined an order.
- No council seat for a soldier.
- The ambition stays "soldier" or "trade" after it is met. F1 kept "soldier" for 45 years after he left the army.

**Why it matters.** BitLife's late game is thin too, but there the life is short. Here 40 years at the top is the main body of a 70-year life. Mount & Blade turns a famous captain into a vassal with a fief, and that is the hook into the second half.

**Fix.**
- **Promotion pace.** Slow it in 32-ladder: months at rank ×1.5 above Captain, and General needs a won battle as commander. Rank 7 should be rare before 40.
- **A second ladder after the top.**
  - Soldier: a knighthood (sets the "knighted" requirement, opens `or_invite`), then a fief (`pc.noble.rung` 0 to 1), then the council's Marshal seat.
  - Merchant: a guild mastership, then the treasury seat (F2b got "treasurer" only at 70).
  - Priest: Patriarch is in `GD.CAREERS`, but no life reached it.
  - Lives the bot played (F1, K2, K3) all met the bars for "Found a house of your own" and "Build a family seat" on Decisions. Nothing nudged them there.
- **A new ambition.** When an ambition is met, `97-life-fixes/c-ambition` should offer a new one ("What now, at the top").
- Home: `32-ladder` plus a new feature, "after the top".

### I2. Rulers see the same eight gathering scenes about 15 times each (impact 5, size M)

**What I saw.**
- F4 (37 years of rule): 376 events, only **192 distinct**. The repeats:
  - `gs_gift` 16, `gs_seating` 15, `gs_knife` 15, `gs_spy` 15, `gs_whisper` 15, `gs_toast` 14 ("A toast", "Below the salt", "A glint in the crowd" and so on);
  - `ri_court_push` "The council presses" 24;
  - `ln_tables` 15;
  - `sg_walls` 12.
- K4: `gs_bargain` "Behind closed doors" 26, `ri_court_push` 21 and `ruler_petition` 8.
- Non-ruler lives ran 82 to 92% distinct.
- 97-life-fixes says hosts and rulers at congresses "always ask", and its gathering cap doesn't cover them.

**Why it matters.** The ruler is the aspirational path, and it is the one that feels most like a loop.

**Fix.**
- Let `LF.weight` cover gathering scenes for hosts too: once a life has seen a `gs_*` scene three times, it gives way to an unseen one or to nothing. The gathering then shows a log line.
- Write a second telling for the six most common (`npc-variants` style).
- Give `ri_court_push` the "council business twice a life, 12 years apart" rule.
- Home: `97-life-fixes` (a-memory), patch `LF-GATH-WANT`.

### I3. Far Lands lives speak English-medieval in the generic pool, most of all in old age (impact 4, size M)

**What I saw.**
- F1 (Taulen, an exam-and-ledger empire): 26 of 304 events named a church, an abbey, a bishop, a reeve, a manor, a serf, an alehouse or a parish. In old age especially:
  - `oa_kin_corrody` ("The cellarer of the abbey… a gallon of ale a day");
  - `oa_faith_young_priest` ("a boy with a fresh tonsure");
  - `oa_faith_shroud` ("In this parish … with lavender");
  - `la_elder_2` ("The lord means to fence the common… the church porch");
  - `av_runaway_serf` ("a year and a day in a free town"), though Taulen keeps corvée, not serfs (bench/targets.mjs note).
- F4 (Birch March, bear-feast people) built "The cathedral" for the ruler's monument (`la_monument_1`). The Decisions card offers "A manor house with a hall, a chapel". See `/tmp/ardan/cycle1/lives/ui-taulen-y32-path.png`.
- 54-voices already swaps "lord" to the local word ("The wazen's wood"), but not church, priest, abbey, reeve or ale.

**On content share.** By count, the Far Lands are *not* thinner. Events tied to land or region (`C.land/region/fbFar` or `C.realm/terr/cult`) were 14–23% of a far life, against 6–12% of a Known World one (`classify.cjs`). Rulers were 4% in both. The thinness is in the voice of the other 80%.

**Fix.**
- Extend 54-voices' `swap` banks for the far cultures (990-far-peoples `voices.*.data.core.js`) with a faith-place set: church, priest, abbey, parish, bishop and ale, mapped to each culture's own words.
- Add `!C.farLand(p)` to the half-dozen events that can't be re-voiced: corrody, enclosure of the common, the runaway serf in a realm with no serfs.
- In `46-life-arcs`, the monument choices should read the realm bible (cathedral, or temple, stupa, ancestral hall).

### I4. Money explodes and has nowhere to go (impact 4, size M)

**What I saw.**

| Life | Coin over time |
| --- | --- |
| F2b merchant | 1,092 at 20 → 132,559 at 30 → 438,566 at 60 |
| F5 novice priest | 6k → 73k in six years as "Banker" |
| K1 carpenter | +4,700 a year, every year, 22 to 42 (82,636 at 50) |
| K2 general | 273,277 at 50 |

The ambition "Build a purse of 5,000 suns" is met in the twenties. Nothing in the late game costs more than about 3,500 (a family seat), so coin only falls slowly into old age. The log never says where the yearly money comes from. Meanwhile F4's queen had 782 suns of her own at 30 and "too little coin and too little warmth".

**Why it matters.** Once coin is meaningless, every event choice that costs suns stops being a choice. `lint-choices` can't see this, because it reads one event at a time.

**Fix.**
- Rescale the top ranks' wages (Banker 9,000, Merchant prince 3,000, Master of the yard 1,800 in `GD.CAREERS`), or tax them through 45-economy.
- Add late-game sinks priced in the tens of thousands: great works that appear on the map, buying a title, ransoms, bribing a council, endowing a school (the 46 scholar legacy).
- Add a yearly line "Your income this year: …, from …".
- Keep `bench/targets.mjs` honest: merchant `medianPeakCoin` [20k, 900k] allows this.

### I5. The systems the game never brings to you (impact 4, size M)

**What I saw.** Over ten lives and about 3,700 events:

| System | What happened |
| --- | --- |
| Orders | never joined (see I1) |
| Legends | the PC was never one, though F1 reached Knife fighting 100 (Legendary) and Tactics and Command 100 in the menu life. F1's fame stayed at 24 |
| Player schemes | 0 started. Only NPC slander reached the PC (`sch_slandered`) |
| Great works and founding a house | sat as open "Decide" buttons on Life › Decisions for a man with 254k suns (screenshot above). `A.whatNow` has no entry for Decisions, schemes, orders or knighthood. Its list ends at "Look for love" and "Let time run" |
| Sieges | worked (`sg_camp`, `sg_walls`) |
| Customs | worked (`rb_custom`) |
| Ambitions | worked (`lfx_amb_*`) |

**Why it matters.** A player of 13 to 23 plays from "What now". A system it never points to doesn't exist for them. KoDP surfaces every big lever as an advisor's line.

**Fix.**
- Add `A.whatNow` entries (a patch in `97-life-fixes/c-ambition` or a new tiny feature):
  - "You can afford a great work" (worth ≥ 10× its price);
  - "Found your house" (bars met);
  - "An order would have you, if you were knighted";
  - "Someone you hate is within reach" (a scheme);
  - "You are the best blade in X": when `A.fightWorth(pc)` passes the Legend line (118), make the PC a Legend, with a fame boost and challengers (48-fight-ladder).

### I6. Far Lands own-scene families repeat on a three-year cooldown (impact 3, size S)

**What I saw.**
- F2b: `fb_at_the_herds` 10 times in 55 years, plus `fb_mem_spared` 4.
- F1: `fb_old_tale` "What the old ones say" 6 times and `fb_sting` 4.
- F1's log has 58 "You see a Delta Crane…" sighting lines (three a year at the end).

**Fix.**
- Raise `cool` on the 992-far-beasts family scenes to 6–8, and let `LF.weight`'s "a seen event weighs 0.1" apply to them. They are families, so the creature changes, but the frame doesn't.
- Cap sightings at one per creature per year in the beast-sighting line.

### I7. Repeated military frames for career soldiers (impact 3, size S)

**What I saw.**
- K2: `bs_reckoning` "Three accounts of the same days at X" 13 times, `camp_officer` 7 and `go_order_cunning` 4.
- K3: `go_order_bold` "Orders: the first wave" 8 times and `go_blame` 6.
- The "(as in 1116)" memory weave makes repetition visible, which is good, but the frame is word for word the same.

**Fix.**
- Make `bs_reckoning` once per war, not per battle, with a second and third telling.
- Hold 38-orders' order letters back by the "superior's scene" rule (twice a life, 10 years apart) unless the temper changes.

### I8. Endings reward money over what the life was (impact 3, size S)

**What I saw.** F5 rose from novice to Bishop and sat on Ozand's council as Chaplain, and ended "The Wealthy". K1 (scholar by ambition, carpenter by trade) and F2b also ended "The Wealthy". F1, a soldier, jailed for theft and later a sworn follower, ended "Of Good Repute Before the Gods". An outlaw life has no ending of its own beyond "Died in Chains". Of 10 lives, three ended "The Wealthy" and three "The Commander".

**Fix.** In `A.ENDINGS` (28-endings):
- order by the highest office or rank reached before wealth: Bishop or Patriarch makes "Of Good Repute" or a new "Shepherd of the Faith"; a council seat makes a new "Of the Council";
- add "The Notorious" (crime flags or infamy) and "The Failed Claimant" (B1);
- raise "The Wealthy" to a worth the late game makes hard (see I4).

### I9. A first adult year can be a flood (impact 3, size S)

**What I saw.**
- F3, a noble of 17: 23 events in his first year (recruiter, draft, wound, siege, three tavern scenes, hunt, custom…) and in the army within the month.
- F1: 10 in the first year. F2: 11 in the first year, with the ambition, two romances and guild politics.

**Fix.** Apply 81-pacing's floor in reverse as a ceiling: at most about 8 scenes in the first adult year, keeping the start's own scenes (`fp_start`, `lfx_amb_young`) and dropping NPC moves first (`LF.refill`'s counterpart).

### I10. Log noise in the late game (impact 2, size S)

**What I saw.**
- "The Council of Ashmere is held without you" appears 30 times in K2's last 300 log entries.
- The menu life shows "Taulen calls out the levies: the 92nd … 93rd Taulen Garrison" one line per division. The screenshot shows a dozen in one autumn.
- "You … training … no one left to learn from −20%" repeats monthly once a skill is at 100.

**Fix.**
- Fold the levies into one line per call-up ("Taulen calls out 14 divisions").
- Print "held without you" only for gatherings the PC was invited to.
- Stop suggesting training a skill at 100 (`A.whatNow` "Train in an extra session").

---

## Compared with the games named

| Game | What it does that Ardan doesn't |
| --- | --- |
| **Crusader Kings 3** | Tiers decide what you see, and failure has teeth. B1 and B4 are CK3's basics. |
| **Mount & Blade** | Fame becomes a fief. I1 is the missing bridge from captain to lord. |
| **Kenshi** | The world takes your home and you deal with it. Ardan already moves the province (B8); it needs the scene. |
| **King of Dragon Pass** | Every big lever comes to you as a scene or an advisor's line. That is I5 and B8. |
| **BitLife's late game** | Thin but short. Ardan's late game is long and busy, so repetition (I2, I6, I7) and dead money (I4) show more. |

## Top 10

1. **B1**: a failed coup is forgiven the next month; "Usurper" is awarded for trying. (M, 5)
2. **I1**: General at 29, then 44 years with no title, order, fief or new ambition; the knighthood bar shuts commoners out of orders. (L, 5)
3. **I2**: ruler lives at 51% distinct events; eight gathering scenes about 15 times each, and "The council presses" 21–24 times. (M, 5)
4. **B2**: "Raise a hunt with the village" leads to an unbadged solo charge; a merchant of 18 dies to a crocodile in her first months. (S, 5)
5. **B8**: wars of 12–25 provinces begin and end within a year; rulers get no war scene in 37–53 years; your home changes realm silently. (M, 4)
6. **B4**: tier leaks: a queen flees to the woods, writes love letters "as a job"; a General is asked "You. Name?" at 62. (S each, 4)
7. **I3**: Far Lands old age and arcs speak of abbeys, tonsures, the parish, the church porch and cathedrals; 54-voices swaps "lord" only. (M, 4)
8. **I4**: coin explodes (132k by 30 for a merchant, 73k for a novice-turned-banker) with no late sinks; the purse ambition is met in the twenties. (M, 4)
9. **I5**: orders, Legends, player schemes, great works and founding a house never come into play; `A.whatNow` points at none of them. (M, 4)
10. **B3**: given-name collisions make the dead seem to act (Suilan, Roland, Kaosen); the memory system needs a name that tells people apart. (M, 4)

Smaller fixes: B5 (death manners), B6 ("Master your master"), B7 (5,141 bandits dead and none of yours), I6 (beast scenes every three years), I7 (the same reckoning 13 times), I8 (endings favour wealth), I9 (first-year flood), I10 (log noise).

**Harness note for whoever fixes bots.** The bench bot (`bench/bot.mjs`) does `eventView` and counts an event again when the event returns to the head of the queue after a fight it started (`startDuelFront` puts the duel ahead of the event and `eventClose` returns early). `A.eventChoose` guards against a second effect, so the game is fine, but `L.events` and `distinct` double-count fight scenes. Skip heads that already have `h.result`.
