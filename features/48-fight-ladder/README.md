# Fights on the ladder

**Aspect:** Power scaling (Road to Ten, Power 1, 2, 3, 4 and 5) · **Kind:** system (two core files, no patches, no events), plus a bench (`bench/fights-audit.mjs`)

The plan says power "hits 10 when every fight in every event follows the same rules the duel system uses, and the player can always see why one fighter is stronger." In the release, 3,199 events (4,115 in today's full build) were written before the tier ladder. A knife in an alley rolled intrigue or insight, and a herder speared a mad bull with no roll at all. The bestiary also called a 400 kg Roc an "animal".

## What it does

**1. The audit** (`audit.core.js`, pure).

- `A.FL.tag(e, i)` reads every choice and decides whether it is a fight or a beast encounter. It looks at:
  - the label's verb (fight, hold the door, draw steel; but not run, pay, talk, sue);
  - the check skill;
  - the fx (`duel`, `beast`, `wound`, `die`, health of 20 or more, and calls such as `startDuelFront` and `hurt(p, 18)` inside fx functions).
- It tags the scale the fight assumes:
  - one person, a party (with a count read from the text, `${ctx.n}` included), or an army (your corner of a battle: you and two others against three);
  - for a beast, which creature (named, a common word such as "wolves" or "a mad bull", or the event's own `{beast}`), its tier, and whether hunters are with you.
- It also reads the foe's crowd tier from the nouns used (toughs 1, soldiers 2, assassins 3, knights 4, masters 5) and what decides the choice.
- `A.FL.clashes` names four kinds of clash with the ladder:
  - `plainDeadly`: a fight that can kill or maim, decided by a plain check;
  - `soloGreat`: one person alone against a great beast or titan, by a plain check or no roll;
  - `freeKill`: no roll, and the result kills the beast or the men;
  - `scaleMismatch`: a worth spec that disagrees with the text.
- `A.FL.bestiaryClashes` checks each creature's tier against its own size line (titans are "over a tonne") and against the engine's HP rule.

**2. Fights roll on fighting worth** (`fight.core.js`).

- At load, `A.defEvents` is wrapped, with a second pass when the content is in. Every fight choice decided by a plain check that can kill or maim, or that a combat skill or body stat decides, gains `check.fight`, a resolver spec. Its label, `s`/`s2`/`d`, win and lose text and fx stay as they are.
- `A.checkOdds` reads the spec through `A.FL.resolve`. `A.eventChoose` rolls exactly `A.checkOdds`, so the number on the button is the number rolled.
- What `A.FL.resolve` uses for each kind of fight:
  - **One against one:** the duel's own curve on the gap in fighting worth, plus both fighters' health. It is fitted per rule set (`FL.RULES`: an event's duel where the foe may yield, a plain lethal duel, a brawl, a spar, a tourney). The foe is a crowd-tier fighter, or the actual person in `ctx.pid` (armed as they would be).
  - **Party or crowd:** the release's group resolver on tier math (`A.groupOddsSides`, `GD.STR_CURVE`). You are a unit of your own worth and health, beside any allies the text names.
  - **Beasts:** each beast's duel curve, alone or with a hunting party (`GD.BEAST_DUEL`, fitted from the duel engine). A pack goes through the group resolver, each beast counted at the worth that ties it one to one.
  - A skill the ladder does not measure (command, stealth, intimidation) still counts as an edge of up to ±5 worth.
- A fight with no roll that the ladder forbids gets a roll, and its old result becomes the win. Only one choice in the full build needs this: spearing a mad yak bull.

**3. The bestiary's scale.**

- The Roc (HP 200) and the Forest Men (HP 170) are retagged great beasts, by the engine's own rule.
- Old Whiskers (1.5 t), the Black Maw (40–50 t), the Wolves of the Sea (4–6 t) and the White Elephant (5 t) were untagged, so they fell back to "animal". They are now titans.
- The `GD.TIER_INFO` texts now say what the duel engine does. The release said "one trained fighter can kill" an animal; the measured figure is about one fight in four.

**4. Wounds tied to the ladder.**

- A lost hand takes exactly two tiers off whatever you fight with (`GD.WOUND_TIERS`). The cut lives in the fighter, so the duel, the worth, the tier chip and every odds see it. The release's penalty covered the sword and the bow only; a spearman lost 3 worth.
- Lost fingers now cost every hand weapon what they cost the sword (−5).
- A crushed knee keeps its −7 speed.

**5. Show the math.**

- **Event choices:** every fight choice shows a measure line under its label, for example "Measured: you, Trained 54, against one Brawler 46." or "you and 2 beside you, against 3 regular soldiers (Trained 56)". On Realism (42-difficulty) it shows tiers without numbers.
- **The duel screen:** before the first blow it shows both tiers and worths, the foe's weapon (and whether they drew it as the fight started), and "Fighters like you win this about N times in 100". On Realism that last line is in words. The opening line ("an even match", "far beyond you") now reads the same chance, and the foe's chip shows the worth they actually fight with.
- **The profile:**
  - It shows what each wound costs in a fight ("Lost a hand: Trained 56 to Untrained 34 (strength −10, speed −3)").
  - The person view's odds (`A.shownDuelOdds`, from 24-honest-odds) now count the weapon the person would draw and both fighters' health.
  - The release's worth tooltip (body, skill, gear) already breaks worth down; that is kept.
- **`A.armFor` is pure:** it picks from the person's id, so the weapon on the screen is the one drawn in the fight.

## Measured by

`bench/fights-audit.mjs` writes `reports/fights-audit.json`. `test.mjs` repeats every check below.

| | Fix layer only (release + 00-05) | With this feature (full build) |
| --- | --- | --- |
| Events, choices | 3,199, 9,635 | 4,115, 12,445 |
| Fight choices tagged | 486 | 546: 339 one-on-one, 55 party, 65 army, 87 beast (21 animal alone, 9 with a party, 16 great alone, 6 with a party, 11 titan alone, 3 with a party, 21 the event's own beast) |
| Decided by | plain check 162, duel 229, beast duel 71, group 6, no roll 17 | **fighting worth 185**, duel 236, beast duel 72, group 6, plain check 26 (none can kill or maim; a non-combat skill decides), ranged shot 3, no roll 18 (none a clash) |
| Clashes with the ladder | **56**: plainDeadly 47, soloGreat 2, freeKill 1, bestiary 6 | **0** (83 as written in the full build's events: plainDeadly 78, soloGreat 4, freeKill 1; counted as they were converted) |
| Choices converted (that can kill or maim) | | 185 (81) |

The deadly outcomes that stay behind plain checks in fight scenes are not fights: 56 accidents, climbs and storms, and 32 runs, hides, talks or bribes.

**Odds shown against outcomes** (`flHonest`, `flDuelOdds`, `flBeastOdds`):

| What | Sample | Mean error | Note |
| --- | --- | --- | --- |
| Converted event choices | 2,695–3,596 rolls | 0.8–1.1 pts (worst bin 1.9–2.3) | 0 rolls used another number than the one shown |
| Duel screen, people | 2,400–4,000 duels | 2.6–3.4 pts (worst bin 10–11) | Foes who draw a weapon at the start, the player at health 40–100, event and lethal rules; every bin within 3.5 standard errors |
| Duel screen, beasts | 1,600–3,000 duels | 1.9–2.7 pts (worst bin 8.6–19) | Alone and with a party, health 60–100; the worst bins are small middle bins (n 40–110) |
| Profile odds (A.shownDuelOdds) | 1,200–2,000 lethal duels | 2.8–3.5 pts (worst bin 12–18) | The fix layer's formula in the same lab: mean 8.3, worst bin 23.9 |

**The group resolver against the tier texts** (`flGroupTiers`, 3,000 rolled fights each; the rolled result is within 3.5 pts of the closed form):

| Claim | Result |
| --- | --- |
| Brawler: "two or three of them make one soldier" | Trained vs 2 Brawlers 50.1%, vs 3: 40.1% |
| Veteran: "worth two or three regulars" | vs 2 Trained 54.6%, vs 3: 44.5% |
| Elite: "7–10 regulars or about 4 veterans" | vs 7: 54.0%, vs 10: 45.2%, vs 4 Veterans 46.1% |
| Master: "20–30 regulars or 8–10 veterans" | vs 20: 53.8%, vs 30: 29.8%, vs 8 Veterans 54.8%, vs 10: 42.5% |
| **Plan, Power 3: "3 Trained beat 1 Elite about two times in three"** | **26.7%**. 13 Trained are needed to beat an Elite two times in three. The plan contradicts the game's own ladder (see Limits). |

**Beast tier texts against duels** (`flTierTexts`, 500 duels a line):

| Line | Duels |
| --- | --- |
| Animal: a veteran alone about half | 52.6% |
| Animal: a trained soldier alone about one in four | 22.6% |
| Animal: a trained soldier with a party nine in ten | 91.4% |
| Great: a master with a party about half | 48.0% |
| Great: an elite with a party about one in ten | 10.8% |
| Great: alone, even a master usually dies | 3.6% |

**Wounds** (`flWounds`): 27 fighters (3 tiers × 9 weapons) each drop exactly two tiers with a lost hand. Examples: sword 64→41, spear 63→41, sword 76→49, spear 84→57. Lost fingers cost each of them worth. A bad knee costs speed 7. The worth parts still sum to the total.

**Screens** (`flScreens`): the measure line, the duel box with two tier chips, and the profile's wound costs all render. Realism hides the digits. Rendering changes neither the state nor the random stream.

**Lives** (`flLives`): 4 bot lives of up to 30 years met 38 events that offered a fight rolled on worth, with no page errors.

## Rules kept

- No patches. Wrappers call the originals: `A.defEvents`, `A.checkOdds`, `A.fighterFrom`, `A.startDuel`, `A.armFor`, `A.shownDuelOdds`, `UI.eventModal`, `UI.duelModal`, `UI.profileModal`.
- Engine draws only `A.rand`. The resolver, the measure lines and `A.armFor` draw nothing, and rendering is pure (tested).
- No new state fields on people. `D.measure` is plain data on a duel in the queue, and old saves have none.
- Every interpolated word goes through `UI.esc`.

## Limits

- **The plan's "3 Trained beat 1 Elite two times in three" is false in this game, by design.** `GD.TIERS` says an Elite "can take 7–10 regulars", and `GD.STR_CURVE` makes an Elite worth 8.2 Trained. The resolver keeps the game's ladder (26.7%), as 32-ladder kept the lore's Legend count. A human should change the plan's sentence (for example: "13 Trained beat an Elite two times in three; 3 Veterans hold one about even").
- **The tagger reads words.** It is regexes over labels and text, and the report lists every converted choice with its spec for review. Some tiers are guesses from a check's difficulty when the text names no foe. Children's scuffles with each other are left on plain checks.
- **Beast lore rewritten.** The animal and great-beast lines of `GD.TIER_INFO` now carry measured numbers. A writer may prefer other words, or may prefer to make party hunts stronger instead, which is a balance call.
- **The retags make the Roc and the Forest Men harder.** A great beast's duel stats come from its tier.
- **Fitted numbers drift with the duel rules.** `FL.RULES`, `FL.DREW` and `GD.BEAST_DUEL` were fitted on this week's build. Re-fit with the bench after any change to duels. The bench's beast curve is off by up to 11 points in the middle with a party.
- **Ranged shots stay skill checks.** A bow or crossbow choice is decided by that skill, which is what a shot is.
