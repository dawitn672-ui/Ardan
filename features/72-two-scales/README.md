# Two scales at once

**Aspect:** Uniqueness (signature system 3; Road to Ten, Uniqueness 4) and War (War 1) · **Kind:** system (two core files), 1 event, no patches, plus a lab and a bench (`lab.mjs`, `bench.mjs`)

The plan's third signature: "a nobody in a 200-division war who feels the squad and the front together. Make this the trailer moment." War 1 adds that "player choices move battle results by at least 15% at every rank".

Before this feature, a soldier whose division went into a war-map fight was asked one question: take your place in the line, or keep your head down.

- **Taking your place** played the release's line battle: four choices in one sitting, while the war-map fight went on without you.
- **That line battle was a second battle.** It made up its own armies and its own dead, and it moved the war score on its own.
- **44-rank-battles** sent its grade to the real fight.
- **34-both-scales** showed three panels once the fight was over.

The squad and the front were never on the screen together while the fight was still going.

**What it does.**

- **The fight, day by day.** A war-map fight is asked about on its first day. The scene then follows the real fight as the war map resolves it:
  - **The morning of the second day:** the arrows, then the clash. These are two choices.
  - **Each further day,** up to two: one choice, read from the front.
    - A division of yours beside you is giving way: "Take the section across to the 3rd Varenna Line", "Fall back with the line, step by step", "Hold where you are".
    - Their line has broken: "Go into the breach with the line", "Hold", "Strip the dead while the line moves on".
    - The line only bends: push, hold, or follow the sergeant.
  - **When the fight ends:** the break, from the real result. It uses the release's own six choices: chase, tend the wounded, loot; run, the rearguard, surrender.
  - **If your own division breaks** (its order gone, it leaves the attack or retreats) while the rest of the fight goes on, your scene ends there, with the retreat: "The 4th Aldmark Line has had enough".
  - **The clock runs between the scenes,** and the war map resolves its day (`A.fightDay`). The scene waits in `A.S.tsq` and holds nothing else up.
  - That makes 3 to 5 choices a fight (3.8 on average).
- **One screen: an open book** (`view.core.js`, in the style guide's hand).
  - **The left leaf is the squad.** It shows the three men beside you from 37-squad, by name, with their miniatures (63), their standing ("a veteran") and how each is ("beside you", "hurt, and still in the line", "carried back to the surgeons", "✝ fell on the second day: bled out where he fell"). Under them is what you see and hear, with an illuminated initial, and what happened yesterday.
  - **The right leaf is the front,** pressed as a print in the inked map's hand (62). It shows:
    - every division in the fight as a standard, in its house's colours with its charge, and with its men and a bar for its order;
    - yours edged in gold under a gold mark;
    - a division giving way marked in vermilion, and one gone from the field struck through;
    - the line between the two sides, bent by each division's order against theirs, with yesterday's line dotted behind it and the ground won or lost between them hatched;
    - the general's plan from 38-orders as a vermilion arrow ("the plan: Heroncliff");
    - your section as small figures under your standard, with a vermilion cross and "the gap where Bastian stood" where a man fell;
    - a cartouche with the place and the day.
  - The front is also given in words under the print, and as the print's label: "Your side holds 36% of the order on the field, up from 32%. Yours is the 16th Varenna Line: 6,903 men, order 44%. On your left the 3rd Varenna Line (order 28%, giving way)…".
  - On a phone the leaves stack, the front first.
- **Every choice acts on both scales through the existing resolvers.**
  - **The front.** Each choice sends a performance to 44's `A.RANKFX.apply`, which moves the order of every division in the fight. The engine then decides the fight.
    - Going forward sends +0.1 to +0.75, even when it goes wrong for you, because the men went forward.
    - Breaking sends −0.85 to −1, whatever the dice say.
    - Holding and following the sergeant sit between those.
    - The table is `A.TS.FX`.
  - **Your body.** Pushing, reinforcing a flank and the breach roll on 48-fight-ladder's `FL.resolve`: you and the men still beside you, against your corner of their line. The button shows the ladder's own line: "Measured: you, Trained 53 and 2 beside you, against your corner of the fight: 3 regular soldiers".
  - **Your formations (60-drill).**
    - Locking shields is offered only if your division has drilled shield walls (60's gate). Its odds grow with the drill, and the button says "Your division: hard-drilled (80)".
    - A division that never drilled the wall gets "Get your shield up and your head down".
    - A withdrawal in step needs formation drill. Without it the fallback costs more.
  - **The squad.** Each man beside you may fall, at the choice's own risk and the dice (`A.comradeDies`, so 37's log lines still come).
    - Half the time a man is hit in the arrow storm.
    - If you drag him back and it works, he lives.
    - Left where he fell, he dies four times in ten.
    - Comrades who die thin the allies for the next push on the fight ladder.
- **The ends tie together.**
  - **34's three panels follow every two-scales fight.** They are queued here when 34's own 90-day spacing would have skipped them.
  - **The story log gets a line that names a comrade and the front together.** The Chronicle (22) keeps it:
    - "At Ostra, on the second day, Fausto fell beside you in the 5th Solenne Line, and the line went forward."
    - "At Camia, on the second day, Bastian fell beside you in the 16th Varenna Line, on the day the line gave way. One more of your section did not come back."
  - **The release's made-up second battle is gone** for these fights. That means no invented armies, dead or war score. Merit, battles, kills, will and fame are given as the release gave them.
- **Fights over on their first day.** Measured over bot lives, most fights a soldier is asked into are over by the first evening, because the defenders go back. For those the scene is short:
  - the end as the engine left it, the men beside you, and the break;
  - "It is over before you reach the front rank";
  - nothing left to move on the front.
- **Lower officers.** A captain, senior captain or commander still fights 44's tactical battle on the first day; that is his layer. The days after it and the end are two-scales scenes: the same book, with company orders rolled on his command ("Order the company forward", "Wheel the company onto the 3rd Aldmark Horse", "Pull the company back in order"). These days go through a `company` layer at a quarter of 44's company strengths.
- **Drafts for the front** (`twoscales.events.js`, 1 event). A soldier's own division is raised near his home and is often left out of the field armies. Once a month at war, if his division has not been asked into a fight for 75 days and another division of his realm is fighting, the sergeant asks for a draft for it. Going moves you to that division (merit +2, happy −2). Staying keeps your company (happy +2).
- **The levy, for a life outside the army.** When your home province is fought over and a garrison of your side stands in it, the bell rings: "Take a spear and stand with the levy" or "Bar the door and keep your people close". The levy stands beside the garrison division, with three neighbours for a squad: your friends and kin who live there, or new neighbours. It is the same scene, and it sends the front through a `levy` layer at 0.6 of the soldier's strengths. It comes at most once every 300 days.
- **Registered.** `A.SIGNATURE.twoScales` is set, beside 34's `bothScales`.

**Measured by.**

`bench.mjs --what=swing` uses real fights frozen the moment an enlisted soldier's division goes in (`bench/rankfx-lab.mjs`, as 44 measured War 1). Each fight is played out once per policy from the same state and random stream:

- `best` and `worst` take the choice with the highest or lowest expected performance at its shown odds;
- `bold`, `steady`, `care` and `flee` choose by kind;
- `none` is the release's "keep your head down".

Fights are paired fight by fight. Two sets of 150 on the full build (68 features):

| Policy | Won, set 5000 | Won, set 9000 | Performance sent | Men beside you who die |
| --- | --- | --- | --- | --- |
| none (keep your head down) | 89 | 86 | 0 | none (no scene) |
| best (forward every time) | 103 | 104 | +1.02 / +1.07 | 34% / 29% |
| steady (hold) | 91 | 91 | +0.31 / +0.35 | 23% / 20% |
| care (drag the hurt man, follow the sergeant, withdraw) | 90 | 86 | +0.14 / +0.13 | 19% / 14% |
| flee (break and run) | 80 | 76 | −0.81 / −0.75 | 28% / 22% |
| worst | 78 | 72 | −1.05 / −1.04 | 21% / 20% |

- **The soldier's choices move the front by 19 points.** Pooled over 300 fights, best play against worst changes 57 fights (25 and 32) and 0 the other way.
- **Against keeping your head down:** best play +10.7 points (33 for, 1 against), worst play −8.3 (26 for, 1 against).
- `twoScalesMovesFront` checks it on a third set: 100 fights, net 18, 1 the wrong way.
- That is in the plan's band of 10 to 20 and over War 1's 15. It sits at the level of 44's officer layer (19 pooled), not under it.

**Lower officers.** The officer's tactical battle stands for +1 or −1 on 44's company layer, then his later days are played best or worst (150 fights):

- 21.3 points;
- of which the battle alone with the worst days after it is 20.0.

44's officer layer was already at the top of its band; the quarter-strength company days add about 1.3 points to it.

**The squad, by choice** (men beside you who die in that round, pooled over 300 fights per policy):

| Choice | Died per man |
| --- | --- |
| Follow the sergeant (or the garrison sergeant) into the front rank | 0.15 |
| Drag the hurt man back (counts him if it fails) | 0.11 |
| Push into the gap / with the front rank | 0.09 |
| Break and run | 0.09 |
| Lock shields | 0.08 |
| Hold your place | 0.03 |
| Go where the sergeant goes | 0.03 |
| Fall back with the line | 0.02 |

You did not die in any of the 2,100 played fights. The release's line battle was rarely deadly to the player too; the body risk is wounds (6 to 20 health, sometimes a lasting wound).

**How often it happens.** `bench.mjs --what=lives` uses bot lives (`bench/bot.mjs`, the balance league's seeds and personalities):

- on every path of `bench/targets.mjs`, 70 years;
- on a soldier path: a peasant who enlists at 18, 40 years, the realm rotating over six.

8 lives a path, 56 in all (`bench.mjs --what=lives --lives=8`):

| Path | Lives that meet one | In the army | In the levy | Two-scales fights | Of them over on the first day | Per 10 years of service |
| --- | --- | --- | --- | --- | --- | --- |
| soldier (enlists at 18) | **6 of 8** | 6 | 0 | 32 | 17 | 1.4 |
| serf | 6 of 8 | 3 | 4 | 15 | 9 | 0.6 |
| peasant | 3 of 8 | 2 | 2 | 9 | 3 | 0.4 |
| artisan | 3 of 8 | 0 | 3 | 4 | 2 | (never served) |
| merchant | 0 of 8 | 0 | 0 | 0 | 0 | (never served) |
| noble | 5 of 8 | 3 | 2 | 17 | 7 | 1.5 |
| royal | 3 of 8 | 2 | 1 | 11 | 5 | 0.6 |

- **The soldier path is not "every run".** 7 of the 8 soldiers had a realm at war while they served, and 6 of those 7 met a two-scales fight. The seventh was asked into one fight and kept his head down. The eighth served in a realm that stayed at peace.
- **26 of the 56 lives meet one.** 12 meet one in the levy, and 21 meet a fight in which the front can still move.
- **What made the difference.** In a 12-life soldier run with the drafts and the captain's days but before the short scene, 4 of 12 met one. With the short scene it was 10 of 12, in a world of 67 features. Most fights a soldier is asked into end on their first day, and most of his fights come after his first promotions.

`test.mjs` (on the full build):

| Test | Result |
| --- | --- |
| `twoScalesView` | 18 draws over four fights, at every stage (arrows 4, clash 4, the line 2, the break 4, the end 4). Each has the book, the print with one standard per division in the fight, the choices and a print label. A comrade renamed `<img data-pwn>Oswin` shows as text. Drawing changes neither `A.S` nor the random stream |
| `twoScalesResolvers` | Shield walls never drilled: "head down" is offered instead. Hard-drilled: the wall at 59% (the mission check's 54, +5 for the drill, "hard-drilled"). The push's odds are the fight ladder's (47% and 47%, with its "Measured:" line). 44's `apply` was called twice with layer `line` and the choices' own performances (0.5, 0.3). Their order went 15 → 3. The scene waits for the day |
| `twoScalesMovesFront` | 100 fights (set 7000): best play won 74, worst 55; 19 changed hands toward best and 1 the other way (net 18; the bar is 12); performances +1.08 and −1.05 |
| `twoScalesReplay` | The same fight played twice through the real actions, once drawn at every step: the same world. The game's journal (01-replay) of 8 commands replays the clicks to the same world |
| `twoScalesSave` | Saved while the scene waits for the day and while it is in front of the player: both load, draw and play to the end. A scene missing its later fields, and a release line battle with no scene, load and play |
| `twoScalesChronicle` | "At Novice you stood two days in the 5th Solenne Line with Enzo at your shoulder, and the line went forward." is in the story log and in the Chronicle's book. 34's three panels come next |
| `twoScalesOtherLives` | A commoner is called to "The levy at Aressa" and stands with three neighbours; the front goes through the `levy` layer, and no army record is left on the player. A soldier in garrison is drafted to the division that is fighting. A captain's tactical battle is followed by "Wheel the company onto the 3rd Aldmark Horse / Pull the company back in order / Hold the company where it stands". A fight over on its first day gets its short scene, before 34's panels |
| `twoScalesPhone` | iPhone SE (375 px, with 71-phone): nothing wider than the screen or past its edge, no sideways scroll, every control 44 px, no text under 14 px outside the print. axe-core (WCAG 2.1 A and AA): 0 violations on the phone and on a desktop |

The draft event passes `tools/lint-events.mjs` and `tools/lint-choices.mjs`. TESTS_LINE

**Rules kept.**
- **The front moves only through the engine.** 44's `A.RANKFX.apply` moves order, and `A.fightDay` decides. The scene's words and the print are read from a snapshot the engine takes (`TS.snap`): divisions, order, men, dead, the plan.
- **Drawing is pure.** The print's ground glyphs are a hash of the province, and no random number is drawn. Every value goes through `UI.esc`, and only hex colours go into the SVG.
- **The dice are the engine's.** The scene's own draws (who is hit by the arrow, a comrade's fall, wounds) use `A.chance`, `A.pick` and `A.ri`, in the engine, never when drawing.
- **"Go on" is the player's clock.** The scene's buttons call `A.missionChoose` and then `A.advance`, both journal commands, so problem reports replay.
- **Old saves load.** `A.S.tsq`, `A.S.tsEnded`, `A.S.tsLevy`, `A.S.tsDraft`, `p.tsN` and `m.ts` are all optional. A mission without `m.ts` is the release's.
- **No inline handlers.** The buttons use `data-a` (`mChoose`, `mAuto`, `mClose`, the release's own, wrapped).

**Limits.**

- **Most fights end on their first day.** Over the 56 bot lives, 43 of the 88 two-scales fights were over on their first day (49%), and 17 of the soldier path's 32.
  - The ask comes before that day's fighting is resolved, and a scene can only come between days.
  - So in those fights your choices move your squad and your body, but not the front.
  - Moving the ask to the day before the fight would need a change to how armies march.
- **A soldier in a realm at peace never meets it.** One of the 8 soldier lives (and 2 of 12 in an earlier run) served in a realm that stayed at peace.
- **The soldier's swing sits at the officer's level (19 and 19-20),** not under it as 44 intended. Both are inside the band. The coordinator may want to decide whether the officer layer should be larger, or the soldier's smaller.
- **The levy is rare.** It needs a fight in your own home province with a garrison of your side in it. Over 56 lives: 12 lives met it (serfs 4, artisans 3, peasants 2, nobles 2, royals 1). No merchant life did.
- **The print is procedural.** The standards, the line and the ground are drawn from the snapshot in the inked map's vocabulary. An illustrator could give the field a real woodcut, and the figures under your standard are stick figures.
- **The print's own words are small on a phone.** At 375 px they are about 7 px. Everything they say is also in the text under the print.
- **The balance bench was not run here** (the coordinator runs it). Soldier lives lose a little more of their squad than with the release's line battle (best play 0.3 of the men beside you a fight), and no longer get the made-up second battle's war score. I expect the soldier lives inside the peasant path to move a little in fame and happiness. Death bands should hold: no player died in 2,100 played fights.
- **Not playtested.** Whether the book reads as one moment, the trailer moment, needs a human eye.
