# Backtests: what the best-designed games do, and what Ardan should take

*Lane R, Oct 28. The owner's ask: "Backtests on the most well designed or popular games and see what can be taken from those. A full political system. Detailed wars done to the last unit. Complex systems. Beautifully graphic design and motion graphics."*

## How this was made

- **Read:** `CLAUDE.md`, `docs/plan/Compounding.md`, the five cycle 1 reviews (`docs/reviews/cycle-1/`), `docs/design/brief.md` §6 (motion), and the READMEs of every feature that touches politics, war, the body, the mind, the UI and motion (09, 20, 21, 23, 34–39, 41, 44, 45, 47–49, 54–56, 58–64, 66, 68, 69, 72, 75, 84, 85, 89, 91–96, 99, 990–999, plus the two lanes in progress, 9992-identity and 9995-trade-roads).
- **Code checked, not assumed:** the fix layer in `.build/ardan-core.js`, read with `tools/show.mjs` (`A.tplDefaults`, `GD.BN`, `A.buildUnits`, `A.newBattle`, `A.moraleCheck`, `A.divMaxOrg`, `A.wsSetOrder`, `A.lineSet`, `A.factionsYear`, `A.vassalYear`, `A.electRuler`, `A.pickHeir`, `GD.NOBLE_RUNGS`, `GD.WOUNDS`, `GD.PERKS`, `GD.CAREERS`). Where a status below says "Has", there is a function or a feature that does it.
- **Games:** web search (sources at the end) plus what is known of them. Exact numbers that vary between versions carry "≈".
- **Status words:**
  - **Has:** it exists and works.
  - **Partly:** a piece exists; the gap is named.
  - **Lacks:** nothing like it.
  - **Queued:** a lane is building it now (9992-identity, 9995-trade-roads), or `Compounding.md` names it as the next piece (9990–9994).

## The answer in brief

**Ardan is further along than its screens show.** The release's war engine is a Hearts of Iron in miniature:
- division templates of battalions and support companies;
- per-battalion soft and hard attack, defence, breakthrough, organisation, supply use and combat width (`GD.BN`);
- frontage by terrain (`A.WIDTH`: plains 70, mountains 35);
- supply maps with depots and military roads;
- battle plans that build up planning;
- forge lines whose efficiency grows.

Its line battle already keeps morale per unit, with shaken and rout states and rout cascades along a wing. Feature 56 gave every realm a court of named people with wants, a yearly push on laws, vassal deals and claimants with named backers.

**What is missing is the layer between the system and the person:**
- **Politics you can enter from below.** There are no offices under the council, no estates, no elections with votes, and no contracts between a lord and his liege.
- **Units with names that last.** Battalions are anonymous codes in an array, and the line battle makes up its own army from realm shares (`A.buildUnits` reads `A.compShares`, not the division).
- **Motion that shows a change as it happens.** Cut-ins exist, but the scene card, the battle and the war map change state without showing it.

The three priority designs below fill exactly those gaps, and they reuse the engine that is there.

### The top 12, ranked

Ranked by impact over size (S = 1, M = 2, L = 4, XL = 6). The owner's three asks are placed first by fiat; the other nine are ranked by the formula.

| # | Transplant | From | Size | Folder |
|---|---|---|---|---|
| 1 | **The Polity:** offices, laws as bills, councils with tasks, estates, factions with thresholds, elections, vassal contracts, legitimacy with parts | CK3, EU4, Vic3, Bannerlord | XL | `features/9996-polity/` |
| 2 | **Companies:** battalions and companies with names, captains, persistent morale, food and pay, formations, orders by courier, the line battle built from the real division | Bannerlord, TW3K, HoI4 | XL | `features/9997-companies/` |
| 3 | **Motion:** one choreography runtime, scene-card beats, the seal stamp on a roll, the battle in motion, the war map's fronts and arrows, ticking numbers | Persona 5, Hades, StS, HoI4, Genshin | L | `features/9998-motion/` |
| 4 | **The ring speaks:** two or three named councillors or kin advise on every big decision, in their own bias | King of Dragon Pass | S–M | `features/9999-ring/` |
| 5 | **Readable stakes:** Reigns dots on every choice (what it touches, how much); Slay the Spire intents on foes | Reigns, Slay the Spire | S | extends `92-scene-card` and the duel in `48-fight-ladder` |
| 6 | **White and red checks:** retry after you grow; one-shot checks marked; passive checks | Disco Elysium | S | extends `75-fair-checks` |
| 7 | **Vows and the weekly seed:** opt-in hardships that raise the Hall's score; one shared seed a week | Hades, Slay the Spire, BitLife | S–M | extends `995-hall-of-lives` |
| 8 | **Moodlets and breaking points:** mood as a list of named, dated thoughts; stress from acting against your nature; a break at the bottom | RimWorld, CK3 | M | extends `35-moods` |
| 9 | **House renown and legacies:** a house earns renown; at each succession its heir buys one perk on one of five tracks | CK3, Rogue Legacy | M | `features/99990-legacy/` |
| 10 | **The inquest:** a time-boxed investigation over 64's true-and-false claims, ending in a judgement with no sure answer | Pentiment | M | `features/99991-inquest/` |
| 11 | **A focus for each chapter:** choose a lifestyle focus; three trees each, ending in an earned trait | CK3 lifestyles | M | `features/99992-focus/` |
| 12 | **Wounds where the blow lands:** the duel and the battle hit a part; parts can fail; a hook or a wooden leg wins some of it back | Kenshi, RimWorld, Dwarf Fortress | M | extends `49-body-mind` and `48-fight-ladder` |

Folder numbers: `build.mjs` sorts folder names as strings, so `9996-` to `9999-` come after `9995-trade-roads`, and `99990-` sorts after `9999-` (`-` sorts before `0`). Each lands after everything it builds on.

The full plan, with compounding and tests, is in [The ranked build plan](#the-ranked-build-plan). The three priority designs are specified in full in [Priority design 1](#priority-design-1-the-polity-9996-polity), [2](#priority-design-2-companies-9997-companies) and [3](#priority-design-3-motion-9998-motion).

---

## What Ardan already has (checked in code)

| System | Where | What exists | The gap a backtest points at |
|---|---|---|---|
| War map | release; 38, 60, 991 | Divisions from templates (`A.tplDefaults`: "Line Division" of 9 battalions plus engineers and scouts); `GD.BN` stats per battalion code; organisation; `d.exp` levels; `d.cmd` commander; army orders `free`, `front`, `attack`, `hold` and an objective with planning (`A.wsSetOrder`); generals' tempers and visible plans (38); drill gating tactics (60); far templates and 103 field orders (991) | Battalions have no state of their own and no officers; orders land instantly; no front line drawn on the war map |
| Line battle | release; 23, 44, 72, 85 | `A.newBattle` and `A.buildUnits`: units per wing L/C/R and a reserve X, each with `morale`, `fat` (fatigue), `tac` and `status` ok/shaken/rout/gone; `A.moraleCheck` routs below 15, shakes below 32, and costs neighbours −10 in the wing and −4 elsewhere; after-action causes (23); rank layers move the map fight by 13–19 points (44); day-by-day squad and front (72); woodblock field print (85) | **Units are made up from realm shares, not from the division that is fighting**; morale resets each battle; no unit has a name or a captain |
| Supply | release | `A.supplyMap`, `A.supplyBase`, depots (`P.depot`), military roads (+25% march), `A.divSupUse`; "starving (supply under 60%)" warning | Supply is a ratio, not a stock: no food days, no baggage, no foraging, no desertion, no pay arrears |
| Squad | 37, 72 | Named comrades with a mission record and a standing (seasoned 3, veteran 6, old hand 10) | No promotion; no choice of men; nobody above the squad has a name |
| Court | 56 | Five seats filled with named people with a want and a fear; yearly pushes on tax, authority and levy; one law a year at most; vassal deals (pension, seat, refuse); spending ladder; player voice and gifts | A one-shot yearly roll; no offices below the five; the player can't hold anything but a seat |
| Laws | release; 56 | `r.laws.tax` (Light to Crushing), `authority` (Low to Absolute), `levy`; succession `r.gov` hereditary, elective, council or theocracy, with `r.law` male, female or equal; the industry "economy law" | Three law groups; no justice, commons, trade or faith law |
| Factions | release; 56; 990 | `A.factionsYear`: five kinds (peace, independence, claimant, liberty, war) formed from house loyalty; power from `A.factionPower`; discontent +12 or +4 a year; demands at power 0.4 and discontent 60; led by named heads (56); named per far realm (990's powers) | Thresholds are not on screen; no standing blocs (clergy, guilds, commons) |
| Succession and elections | release | `A.pickHeir` by `A.lawSort`; `A.electRuler` is a single `A.wpick` over the realm's houses (royal ×4, top rungs ×2), and the player wins with a chance of fame/160 | No electors, no votes, no campaign |
| Legitimacy | release | `r.legit` as one number, nudged ad hoc (new ruler, failed coup, usurper) | No parts, no target, no reason shown |
| Vassals | release; 56; 994 | Houses with loyalty `h.op`; `A.vassalYear` drifts loyalty and can raise a rebel; noble rungs N09 Franklin to N01 Duke with income and levy; men-at-arms and the crown's tenth (56); knighting and fief offers by scene (994) | No contract per house; no rights; no fief decided by the court |
| Schemes | 39 | Plots with pace, monthly discovery, an opening halfway, plots against you | NPCs don't plot against each other |
| Body and mind | 49, 35, 69 | Wounds on parts with skill costs; care choices; illnesses over months; traits from deeds (3 in 12 years, cap 5); four needs that settle; moods | The duel doesn't aim at a part; mood is four bars, not reasons; no break |
| Voices and odds | 54, 59, 75, 89, 92, 9992 | Culture voices; nested tooltips; fair checks; fight badges; scene card with check chip, odds pips, effect hints; inner voices (9992, in progress) | Every check is one roll; effect hints only where `fx` is a plain object |
| Look and motion | 91–96, 85, 62 | Tokens with `--m-*` motion tokens; Motion setting Full/Reduced/Off; cut-ins (VICTORY, DEFEAT, VS, FAREWELL and others); hover slash; anime busts with expressions; woodblock skies; inked map with standards | No shared choreography; result chips appear but nothing moves from cause to effect; battle has no clash or move arrows (85's own "Not done"); war map counters jump |

---

## The games

Each mechanism has three parts:
- **Rule:** what the game actually does, with its numbers where they are known.
- **Ardan:** whether Ardan has it, with the evidence.
- **Take:** the design, or the plan item it goes to (→ #n).

### 1. Crusader Kings III

*Why it's here:* the best character-driven politics in games. Every lever is a person.

**CK3-1. Vassal contracts.**
- **Rule.**
  - Every feudal vassal above baron has its own contract with two obligations, taxes and levies, each at Low, Medium (the default) or High.
  - High gives more and costs opinion; Low gives less and pleases.
  - Raising an obligation needs a hook, or it is a "tyrannical" change that angers the realm. Only one tyrannical change can be made at a time. Lowering is always allowed.
  - Contracts also carry special rights, among them a guaranteed council seat, coinage rights, fortification rights, war-declaration rights and protection from title revocation.
- **Ardan: Partly.**
  - A house has one loyalty number (`h.op`).
  - A noble player pays fixed men-at-arms (12% of rung income) and the crown's tenth (56).
  - Levy comes from `GD.NOBLE_RUNGS`.
  - Nothing is negotiated, and 56's vassal deals are one-off answers to a faction.
- **Take:** a contract per landed house, with hooks from Ardan's existing favours (`fx.owed`, `C.owes`) → #1.

**CK3-2. Factions with a power threshold.**
- **Rule.**
  - A faction's military power is its members' strength over the liege's.
  - Discontent starts building once power passes a threshold (typically 80%), and builds fast above about 110%.
  - At 100% discontent the faction sends an ultimatum: accept the demand, or fight every member in a civil war.
  - Dread (being intimidated or cowed) and hooks stop vassals from joining.
- **Ardan: Has the engine, hides the meter.** `A.factionsYear` raises discontent by 12 a year above 30% power (4 below), and demands at power 0.4 and discontent 60. 56 names every faction's head. Nowhere does the player see "how close".
- **Take:** the meter, the threshold and the date on screen, plus estates' anger adding power → #1.

**CK3-3. Schemes with power, resistance and secrecy.**
- **Ardan: Has (39).** Pace, monthly discovery and an opening halfway are all there. Its own limit is that NPCs don't plot against each other.
- **Take (backlog, M):** NPC-against-NPC slander and murder, at most one per realm-year among court people. Each is seeded as a 64 claim ("they say Harrow poisoned the steward"), with a true or false flag, so the player can learn of it, use it or expose it.

**CK3-4. Lifestyles.**
- **Rule.**
  - There are 5 lifestyles (diplomacy, martial, stewardship, intrigue, learning), each with 3 trees.
  - A chosen focus feeds that lifestyle experience, and points buy perks.
  - Each tree ends in a trait that names who you became: Strategist, Architect, Schemer, Theologian and the rest.
- **Ardan: Partly.**
  - `GD.PERKS` gives perks at skill 40, 65 and 85 per skill (logistics: "Forage master" at 65, "Quartermaster-general" at 85).
  - 31 makes growth come from use.
  - Nothing is chosen, and no identity comes at the end.
- **Take** → #11.

**CK3-5. Dynasty renown and legacies.**
- **Rule.** Members' prestige feeds the dynasty's renown. Renown buys legacy perks, nine tracks of five in the base game, which then hold for every member forever.
- **Ardan: Lacks.** `S.dynasty` is `{name, house, founder, gens, members, score}`. "Dynasty" is an achievement.
- **Take** → #9.

**CK3-6. Stress.**
- **Rule.**
  - Acting against your traits (a compassionate ruler executing a prisoner) adds stress.
  - Each of three stress levels brings a mental break event, which gives a coping trait (drunkard, flagellant, irritable).
  - Stress is lost by acting in character and by activities.
- **Ardan: Lacks.**
  - 49 shifts traits from deeds.
  - Nothing costs you for acting against the traits you have.
- **Take** → #8.

### 2. Europa Universalis IV

*Why it's here:* the estates model, a realm as standing blocs that bargain for privileges.

**EU4-1. Estates.**
- **Rule.**
  - Nobles, clergy and burghers (plus regional estates) each hold a share of the land, a loyalty and an influence.
  - Granting privileges buys loyalty and gives up crown power.
  - An estate at 100% influence fires a disaster. It was 80% before a 2019 rework.
  - Crown land below 20% brings penalties that grow as it falls; 50% and above brings benefits.
  - The crown has direct interactions: "Summon the Diet" (+5% loyalty to every estate, +10% influence), sale of titles and seizure of land. Seizing land adds +5 unrest in that province for 15 years.
- **Ardan: Partly.** Houses are a nobility, and factions form by want. There is no clergy, burgher or commons bloc, and no "share of the realm" a bloc holds.
- **Take:** estates as the standing blocs of the polity, with clout and approval → #1.

**EU4-2. Monarch points.**
- **Rule.** A ruler's administrative, diplomatic and military skill, 0–6 each, is a monthly budget that every act spends.
- **Ardan: Partly** (initiative, 7 at most, spent by the player).
- **Take: rejected.** A ruler's budget would split a ruler's life from every other life. Ardan's single initiative budget is the better fit.

**EU4-3. Aggressive expansion and coalitions.**
- **Rule.** Taking land gives aggressive expansion with neighbours, more with those who share your faith and culture. A neighbour above about 50 with a poor opinion may join a coalition against you.
- **Ardan: Has.** Coalition wars occur (cycle 1 world review: five in seed 99). 68 gives every war a stated cause.
- **Take:** nothing new. Cap a peace by share of land (world review B3) in 68.

**EU4-4. Republics and elections.**
- **Rule.** A republic elects every few years (4 for most) among candidates from its factions. Republican tradition falls when a ruler is re-elected or extends his term.
- **Ardan: Partly.** Elective and council governments exist (`r.gov`), but `A.electRuler` is a weighted pick.
- **Take:** an electoral college with votes → #1.

**EU4-5. Subjects and liberty desire.**
- **Rule.** A subject's liberty desire rises with its strength against the overlord's. Above 50% it refuses calls to arms and may seek independence.
- **Ardan: Partly.** Tributaries exist (`trib` treaties).
- **Take:** a tributary's liberty is one line in the polity's contract model, as a realm-level contract (tribute 0–2, levy 0–2) → #1.

### 3. Victoria 3

*Why it's here:* the clearest model of interest groups and of laws that take time.

**V3-1. Interest groups.**
- **Rule.**
  - Each interest group has clout, its share of political strength from its members' wealth and organisation, and an approval that runs from angry to happy.
  - The groups in government give legitimacy in proportion to their clout.
  - Angry groups with clout start movements and revolutions.
- **Ardan: Lacks** standing groups. Factions are formed by want and vanish when the want goes.
- **Take** → #1, as estates.

**V3-2. Law enactment over time.**
- **Rule.**
  - A law under enactment is checked at intervals.
  - Each check either passes it, advances it toward the next check, stalls it, or opens a debate that needs the player.
  - Debates are most likely when the other three are all unlikely.
  - Groups for the law gain approval and groups against lose it.
  - Groups in government petition for laws they want, and passing a petition raises legitimacy.
- **Ardan: Partly.** 56 decides one push a year in one roll, with clear weights.
- **Take:** bills with checkpoints and debates, calibrated to 56's yearly odds so its audits keep holding → #1.

**V3-3. Pops' standard of living.**
- **Rule.** A falling standard of living makes radicals and a rising one makes loyalists; prices drive both.
- **Ardan: Partly.** 45 and 66 give every market real stocks and prices, but nothing political reads them.
- **Take:** the commons' approval reads the grain price index of its towns (#1).

**V3-4. Diplomatic plays.**
- **Rule.** Before a war, the aggressor states demands. There is a period of escalation in which third parties take sides and are bought with concessions, and it can end in a backdown.
- **Ardan: Lacks.**
  - Wars are declared outright.
  - The lives review (B8) found rulers saw no war scene in 37–53 years of rule.
- **Take (backlog, M, `68-casus-belli`):** a 30-day standoff before an AI war on the player's realm, or one the player declares.
  - The demands come from 68's casus.
  - Allies and debts (68's `CS.owes`) declare for a side.
  - A ruler or councillor gets a scene: yield a province, buy off one ally, or stand.
  - Some 20% of standoffs should end without war, and the bench should check that war rates stay in band.

### 4. Mount & Blade II: Bannerlord

*Why it's here:* one person climbing from a nobody's sword to a kingdom, and battles where every man is on the field.

**MB-1. A party you feed and pay.**
- **Rule.**
  - Troops follow upgrade trees through tiers 1–6, paid with experience and coin.
  - Wages are owed daily, by tier.
  - The party eats food every day. Running out drops morale, and low morale means desertion.
- **Ardan: Partly.**
  - Divisions have `d.exp` and a supply ratio.
  - The free company (`pc.company`, `A.recruitCompany`: 6 suns a man) has men and a name.
  - There are no food days, no arrears and no desertion.
- **Take** → #2.

**MB-2. Formations and orders.**
- **Rule.**
  - Troops are grouped into formations (infantry, archers, cavalry, horse archers and more).
  - Each formation takes a shape: line, shield wall, loose, circle, square, skein, column or scatter.
  - Orders are move, face, charge, hold, advance and retreat.
- **Ardan: Partly.**
  - Line battle units carry a `tac`, gated by drill (60).
  - An officer gives wing tactics.
  - There is no shape per unit, and there is no player order below the wing.
- **Take** → #2: shapes as data, orders to exactly the units your rank commands.

**MB-3. Morale per man; routs.**
- **Ardan: Has, per unit** (`A.moraleCheck`).
- **Take:** make it last across battles, and give it parts → #2.

**MB-4. Kingdom decisions by influence.**
- **Rule.**
  - A clan proposes a policy, a war, a peace or the award of a fief, paying influence to do so.
  - Each clan puts influence behind an option.
  - The ruler decides, and overriding the majority costs influence and relations.
  - Clans weigh their own interest, the odds of winning and their regard for the sponsor.
- **Ardan: Lacks.** Fiefs come by scene (994 `cr_fief`).
- **Take:** fief grants and great bills decided this way, with the council and great houses as the voters → #1.

**MB-5. Renown becomes vassalage.**
- **Rule.** Clan tiers 0–6 come from renown. A tier lets you swear to a kingdom, and you are given a fief.
- **Ardan: Partly (994).** Knighting comes at renown 55 or as a captain with renown 30, and a fief offer at 33 with renown 55.
- **Take:** the fief becomes a contract the player holds and can lose → #1.

### 5. Total War: Three Kingdoms

*Why it's here:* armies led by characters with wants, who leave when they are unhappy.

**TW3K-1. Retinues.**
- **Rule.**
  - An army is up to three retinues, each a general with up to six units: 18 units and 3 heroes at most.
  - Losses are tracked and replenished per retinue.
  - A routed unit comes back weak after a few turns.
- **Ardan: Partly.** A division has an optional commander (`d.cmd`), and its battalions are anonymous.
- **Take:** each battalion is led by a named Senior Captain (the lore's M07, "a wing of four companies"), and each company by a Captain (M06, 200 men) → #2.

**TW3K-2. Satisfaction and guanxi.**
- **Rule.**
  - Every character has wants: rank, wealth, victory, friends at their side.
  - Satisfaction falls when the wants go unmet.
  - Unhappy generals defect, rebel or leave.
- **Ardan: Partly.**
  - The court has wants and fears (56).
  - Generals have tempers (38).
  - No officer ever leaves.
- **Take:** officers' satisfaction, and defection in civil wars → #2; offices for the satisfied → #1.

**TW3K-3. Hero duels in battle.**
- **Ardan: Partly.** Duels are their own screen (48).
- **Take (inside #2, optional):** when both sides have a hero in a wing, one pulse may offer a challenge. It runs as a 48 duel, and the winner's wing gets +10 morale.

**TW3K-4. Supply in enemy land.**
- **Rule.** An army replenishes in its own territory. In enemy land its supplies run down and attrition follows.
- **Ardan: Has the map; lacks the stock.**
- **Take** → #2.

### 6. Hearts of Iron IV

*Why it's here:* fronts, plans and supply at continental scale. Ardan's release already copies most of it.

**HoI-1. Division templates.**
- **Rule.** Battalions plus support companies make a division, and its width must fit the terrain.
- **Ardan: Has.** `A.tplDefaults`, `GD.BN`, support companies (`eng`, `scouts`, `herald`) and `A.WIDTH`.
- **Take:** nothing.

**HoI-2. Front lines and battle plans.**
- **Rule.**
  - Divisions are assigned to a front.
  - A plan draws an arrow to an objective.
  - Waiting builds a planning bonus to a cap, which is spent on the attack.
- **Ardan: Has the rules** (`front`, `attack` with `obj`, "build up planning"); **lacks the drawing.**
  - The war map shows counters, with no front line and no arrows.
  - 38's plans are text.
- **Take** → #3: the front as an inked line, plans as vermilion arrows, couriers as dots.

**HoI-3. Supply hubs, railways, trucks.**
- **Rule.** Supply flows from the capital through hubs. Divisions out of range fight far weaker, and hubs and rails extend the range.
- **Ardan: Has** depots, roads and `A.supplyMap`.
- **Take:** a stock with a lag (#2), so a cut road is felt days later, not at once.

**HoI-4. Commanders earn traits.**
- **Rule.** Experience in a kind of fighting gives a trait (Trickster, Skirmisher, Engineer).
- **Ardan: Lacks.**
  - Tempers come from birth traits (38).
  - Logistics perks come from skill.
- **Take (backlog, S, 38):** a general who makes 5 feints gets "deceitful" logged with its reason through 49's deed rule. One who wins 5 head-on fights gets "brave". His temper then follows.

**HoI-5. Production lines with growing efficiency.**
- **Ardan: Has** (`A.lineSet`: efficiency from 0.15).
- **Take:** nothing. 58-event-cut already called these screens a dilution for anyone who isn't a ruler or marshal.

### 7. Kenshi

*Why it's here:* the body as a set of parts, and a world that doesn't wait for you.

**KE-1. Health per part.**
- **Rule.**
  - Head, chest, stomach, two arms and two legs each have their own bar.
  - A limb below zero can't be used.
  - There is a knock-out point, and cuts bleed.
- **Ardan: Partly (49).**
  - Wounds sit on a part and cost the skills of that part.
  - The duel uses Blood and Wind and never aims at a part.
- **Take** → #12.

**KE-2. Growth from suffering.**
- **Rule.** Toughness grows from being beaten.
- **Ardan: Has** (31: use ×1.2, a failed check teaches ×1.5).
- **Take:** nothing.

**KE-3. The world takes your home.**
- **Rule.** Towns fall to raids and conquest, and the player deals with it.
- **Ardan: Partly.** The province moves to a new realm in silence (lives B8).
- **Take** → #1: when your home is ceded, a scene asks you to swear to the new crown, leave, or join the resistance.

**KE-4. Prosthetics.**
- **Rule.** A lost limb becomes a goal: find and fit a robotic one.
- **Ardan: Partly.** The hook and the stump are drawn (63, 93).
- **Take** → #12.

### 8. RimWorld

*Why it's here:* mood made of reasons, and a storyteller that paces trouble.

**RW-1. Mood as named thoughts.**
- **Rule.**
  - Mood is the sum of named thoughts with numbers and durations ("Slept in the cold −4", "Attended wedding +8").
  - Breaks come below thresholds: minor at 35%, major at 20% (4/7 of minor), extreme at 5% (1/7).
  - The mean time between breaks there is about 10 days, 3 days and 0.7 days.
  - Traits move the thresholds, and the minor one is capped at 1–50%.
- **Ardan: Partly (35).**
  - Four needs settle toward where your life puts them, and the lowest names a mood.
  - The player never sees which deeds made the mood, and nothing breaks.
- **Take** → #8.

**RW-2. The storyteller.**
- **Rule.**
  - Incidents are picked against threat points, which grow with wealth and time.
  - Cassandra alternates tension and relief; Randy is random.
- **Ardan: Partly.**
  - 81-pacing holds a floor of prompts a year.
  - 21 has an NPC budget.
  - There is no curve.
- **Take (backlog, S, 81):** a two-year tension cycle. Risky scenes are weighted ×1.3 in the "rising" half and ×0.7 for six months after a wound, a death in the family or a lost battle. Prompts a year stay the same.

**RW-3. Pawns have social lives.**
- **Rule.** Insults lead to fights, and pawns fall in and out of love with each other.
- **Ardan: Partly** (41 circles, 64 beliefs). NPCs don't feud each other.
- **Take:** backlog, with CK3-3.

### 9. Dwarf Fortress

*Why it's here:* a world whose history is data.

**DF-1. Legends.**
- **Rule.** World generation runs centuries of history: every death, battle and artefact is a record, and legends mode can be browsed.
- **Ardan: Has from the start date** (57's dated world chronicle, 22's Book, export).
  - The lore's own pre-1105 chronicle (`LORE` realms carry `chronicle: [[1080, "Traders see the mammoths", …]]`) isn't in the record.
- **Take (backlog, S, 57):** import the lore's dated entries as records of kind `lore`. NPCs and 57's citations can then reach back ("since the mammoth year of 1080").

**DF-2. Personality facets and values.**
- **Rule.** Dozens of facets and values; memories that fade or change values.
- **Ardan: Partly.** Traits (49), persona axes (20) and the bond ledger (55) cover most of it.
- **Take:** nothing new.

**DF-3. Art about real events.**
- **Rule.** Engravings and artefacts depict things that happened in this world.
- **Ardan: Lacks.**
- **Take (backlog, S, 94 or 61):** a hall or temple print can carry a cartouche titled from a real 57 record ("The burning of Tessaria, 1108"), picked by hashing the place id.

### 10. Disco Elysium

*Why it's here:* skills as people, and checks that respect failure.

**DE-1. Skills as voices.** 24 skills in 4 attributes interject in conversation.
- **Ardan: Queued** (9992-identity part 2, inner voices). No action here.

**DE-2. White and red checks.**
- **Rule.**
  - A failed white check can be retried once you raise the skill or learn something new.
  - A red check is one chance, and is usually the plot.
  - Passive checks fire on their own, with no roll shown.
- **Ardan: Lacks.**
  - Every check is one roll.
  - 31 makes a failed check teach ×1.5, which is the right half of the idea without the retry.
- **Take** → #6.

**DE-3. Thought Cabinet.**
- **Rule.** A thought is researched over time with an effect while it ripens and another after. 12 slots at most, 3 open at the start, and more cost a skill point.
- **Ardan: Queued** (9992 part 3, "a thought you are turning over"; Compounding 9993).

**DE-4. Failure is content.**
- **Ardan: Partly.** Win and lose texts exist, and many losses are only a cost.
- **Take** → #6: a lint rule that a red check's losing branch must set a flag, queue an event or change a bond.

### 11. Pentiment

*Why it's here:* judgement under a deadline, with no confirmed truth.

**PE-1. The investigation with a clock.**
- **Rule.**
  - Each act gives a few days before a judgement.
  - Every lead (a visit, a meal, a search) costs part of a day, and there are more leads than time.
  - You accuse someone, and the game never confirms the truth.
- **Ardan: Lacks.** 64-npc-beliefs already keeps claims that are true or false, with holders, and 55 keeps secrets with proof. Nothing makes an investigation of them.
- **Take** → #10.

**PE-2. Backgrounds as keys.**
- **Rule.** Chosen schooling and interests open lines of dialogue.
- **Ardan: Partly** (skills and traits gate choices; 29's starts).
- **Take:** nothing new.

**PE-3. Type as character.**
- **Rule.** Each person writes in the hand of their class and schooling.
- **Ardan: Lacks.**
- **Take** → #3, optional: letters (38's orders, 55's letters) drawn in a hand by the sender's literacy and rank, from the four families 77 already embeds (Cinzel capitals for a chancery; Literata italic for a lettered hand; a plain Atkinson for a clerk). A true script face is an owner's call on page weight.

### 12. 80 Days

*Why it's here:* the journey as the game.

**80D-1. A network of routes with time and cost.**
- **Rule.** Over 150 cities, each offering departures on given days with a duration and a fare, against an 80-day clock.
- **Ardan: Queued** (journeys 9990; 9995-trade-roads in progress).
- **Take (refinements for 9990):**
  - departures on the days 47's calendar and 9995's caravans give, not on demand;
  - routes known only once heard of, through the atlas (9991);
  - a visible node graph of stops, as in Slay the Spire's map.

**80D-2. Trading on the road.**
- **Ardan: Has** (45, 66; far goods coming in 9995).

**80D-3. Every stop written.**
- **Rule.** Each stop is a short branching story, coloured by the companion relationship (about 750,000 words).
- **Ardan: Queued** (journeys' stop scenes).

### 13. King of Dragon Pass

*Why it's here:* every system arrives as a scene, with advisors who disagree.

**KoDP-1. The clan ring speaks.**
- **Rule.** Seven advisors comment on each decision. Each speaks from their own skills, personality and pet interest. They are often wrong or self-serving, and the player learns whom to trust.
- **Ardan: Partly.** 56's councillors have a want and a fear, but they never speak in a scene. The lives review (I5) found orders, schemes, great works and houses never brought to the player.
- **Take** → #4.

**KoDP-2. Sacred Time.**
- **Rule.**
  - Once a year the clan divides its magic among blessings: war, harvest, children, herds, trade, quests.
  - The prophecies for the year come at the same time.
  - The ring's makeup sets how much magic there is.
- **Ardan: Partly** (the New Year cut-in, 47's customs, 990's faith days).
- **Take (backlog, S, 990):**
  - At the New Year, one choice among four offerings of your faith: the harvest, health, kin, or luck in arms.
  - It gives +5% to that family of checks for the year, booked as a `muted` line.
  - The priest's prophecy names one real scheduled thing from `S.sched`, so it comes true.

**KoDP-3. Raids come to the ring.**
- **Ardan: Partly.** Rulers never see their wars (lives B8).
- **Take** → #1's events, plus the backlog standoff (V3-4).

### 14. Persona 5

*Why it's here:* calendar pressure, bonds in ranks, and the most admired UI motion in games.

**P5-1. A calendar with deadlines.**
- **Rule.**
  - Each palace must be cleared by a date.
  - Each day has an afternoon and an evening.
  - Weather and exams change what is open.
- **Ardan: Has the strip** (996 coming-up); **Partly the deadlines** (sieges, schemes).
- **Take:** the polity gives dated stakes (the next count on a bill, an election day, an ultimatum) and 996 shows them → #1.

**P5-2. Confidants in ranks with abilities.**
- **Ardan: Has** (999: ranks 1–5 for friend, beloved and mentor).

**P5-3. Social stats with named ranks.**
- **Rule.** Knowledge, Guts, Proficiency, Kindness and Charm, with five ranks each, gate confidants and choices.
- **Ardan: Partly.** Skill tiers exist ("Legendary").
- **Take:** nothing.

**P5-4. Motion that answers every press.**
- **Rule.** Menus are compositions of type. Transitions wipe on the diagonal. The All-Out Attack splash plays, and every hit gets an impact frame.
- **Ardan: Partly.** 96's cut-ins and 92's hover slash exist. The scene card, the result and the map change without motion.
- **Take** → #3.

### 15. Hades

*Why it's here:* death as progress, and difficulty as a chosen wager.

**HA-1. Death advances the story.**
- **Rule.** People remember how you died, and each run unlocks lines.
- **Ardan: Partly** (995 Hall, 28 endings).
- **Take** → #7: the Hall's chronicler gets a voice line per new ending, drawn from the Hall's own record.

**HA-2. Pact of Punishment.**
- **Rule.** 16 opt-in conditions with ranks. Heat is their sum, and rewards and bounties scale with it.
- **Ardan: Lacks.** 42 has three presets.
- **Take** → #7.

**HA-3. Duo boons.**
- **Rule.** Two gods' boons together unlock a third, named one.
- **Ardan: Lacks.**
- **Take** → #11: two culminating focus traits unlock a third ("Strategist" plus "Theologian" makes "Warden of the Faith").

**HA-4. Expressive portraits; a codex with art.**
- **Ardan: Partly.** 93 changes expression with state. The Codex is text (visual review).
- **Take** → #3, small: Codex entries get a 61/94 print, seeded by the entry's id.

### 16. Slay the Spire

*Why it's here:* risk you can read before you commit.

**StS-1. Enemy intent.**
- **Rule.** Every enemy shows an icon and a number for its next move.
- **Ardan: Partly.** The duel's "tell" is a line of text (visual I6).
- **Take** → #5 (duel), #3 (battle arrows).

**StS-2. A visible map of nodes.**
- **Ardan: Lacks.**
- **Take** → 9990's route graph (see 80D-1).

**StS-3. Ascension.**
- **Rule.** Twenty levels, each adding one hardship, each unlocked by winning the last.
- **Ardan: Lacks.**
- **Take** → #7.

### 17. Genshin Impact

*Why it's here:* systems that announce their interactions, and exploration density.

**GI-1. Named reactions.**
- **Rule.** Two elements make a named reaction (Melt, Overloaded) with its number floating on the spot.
- **Ardan: Partly.**
  - Drill counters (60) and tactic match-ups (`A.tacDay`) exist.
  - They are named only afterwards, in the after-action report (23).
- **Take** → #3: name the reaction at the pulse it happens ("Spear wall sets against the charge: horses balk").

**GI-2. Something to find every half-minute.**
- **Ardan: Partly** (997 wilds: 0–2 places per province; atlas queued in 9991).
- **Take:** nothing new.

**GI-3. Character showcase.**
- **Ardan: Partly** (93's full figure).
- **Take** → #3: the profile reveal (bust slides up, frame ink-in, idle off).

**GI-4. Gacha.**
- **Take: rejected.** Paid randomness for a 13–23 audience is out, whatever it earns.

### 18. BitLife

*Why it's here:* the life-sim core loop the audience already knows.

**BL-1. Age up in one tap.**
- **Ardan: Has** (84's "Next season", 82).

**BL-2. One ribbon per life.**
- **Ardan: Has** (28's endings, 995's Hall).

**BL-3. Weekly challenges.**
- **Rule.** A handful of named goals, the same for everyone that week.
- **Ardan: Lacks.**
- **Take** → #7.

**BL-4. A share-ready summary.**
- **Ardan: Queued** (9994 share cards).

### 19. Reigns

*Why it's here:* the clearest risk preview in a narrative game.

**RE-1. Dots that show what moves.**
- **Rule.**
  - Four pillars: the church, the people, the army and the treasury.
  - Each is fatal at empty or full.
  - Before you swipe, a dot appears over each pillar the choice will move, large for a big change and small for a small one. Which way it moves is never shown.
- **Ardan: Partly.** 92 shows "▲ coin" only where `fx` is a plain object, at most two.
- **Take** → #5.

**RE-2. A reign as a chain.**
- **Rule.** Death unlocks cards, and each heir picks up the objectives.
- **Ardan: Partly** (heirs, 995).
- **Take** → #9.

### Coverage

| | Has | Partly | Lacks | Queued | Not rated (rejected) |
|---|---|---|---|---|---|
| Mechanisms (73) | 16 | 36 | 15 | 5 | 1 (gacha) |

One more mechanism, EU4-2 (monarch points), is rated Partly and also rejected as a transplant.

Ardan's gaps cluster in three places, which are the owner's three asks:
- politics from below (CK3-1, EU4-1, EU4-4, V3-1, V3-2, MB-4);
- units with names that last (MB-1, MB-2, TW3K-1, TW3K-2);
- motion and readable stakes (P5-4, StS-1, RE-1, HoI-2's drawing, GI-1).

---

## Priority design 1: The Polity (`9996-polity`)

**Lane P.** Size XL: about six readable core files, four or five small patches, about 40 events (prefix `po_`), a test file and a bench.

**Builds on:**
- 56-realm-inside: the court, pushes, `RI.lean`, the ledger and custom (`r.riLaw0`);
- 20-ai-personality: `A.rulerPersona`, `A.personPersona`;
- 68-casus-belli: debts and `CS.owes`;
- 990-far-peoples: the powers table and `A.FARP_POWERS_NAME`;
- 54-voices: the council's local word;
- 994-careers: knighting, fiefs, the coup's fate;
- 55-bonds: feuds and the ledger;
- 39-schemes;
- 21-npc-initiative's move budget;
- 996-coming-up;
- 59-tooltips.

**What it must prove.** Before and after numbers, from `bench.mjs` (10 worlds × 100 years, plus the 24-life bot league):

| Measure | Today | Target |
|---|---|---|
| Political scenes a decade by start path (noble / merchant / priest / soldier / peasant / ruler) | ≈ 0.3 to 1 (court asks, pushes) | ≥ 3 / 1.5 / 1.5 / 1 / 0.5 / 5 |
| Offices held by named people | 5 a realm | 100% of all offices, about 8–20 a realm |
| Laws changed a realm-century | ≈ 23 (56: 7,542 passed over 33,225 realm-years, all tax, authority or levy) | ≥ 20, with at least one change outside tax and authority in 60% of realms |
| Elections with recorded votes (elective and council realms) | 0 | every succession; each vote named |
| Taxes at an extreme after 60 years | 50% (56) | ≤ 60% (56's bar) |
| Hoarding flags | 0–2 (56) | ≤ 2 |
| Civil wars a realm-century | 72 succession + 29 liberty per 10 worlds (56) | within ±30% |

### 1. State (all optional; a save without it fills at the next New Year)

```js
r.pol = {
  v: 1,
  est: { nob: {cl, ap, lead}, cler: {...}, burg: {...}, comm: {...}, army: {...} }, // clout 0..1 (sum 1), approval -10..+10, leader pid
  off: [ { id, k, at, pid, by, since, term, pay } ],   // offices below the council
  bill: null | { g, to, by, since, n, adv, stall, log: [[day, out]] },  // the one law under enactment
  elect: null | { due, round, electors: [pid], cands: [pid], votes: { elector: cand }, promises: [...] },
  task: { chancellor: 'k', marshal: 'k', treasurer: 'k', spymaster: 'k', chaplain: 'k' },
  laws2: { obl: 1, just: 0, comm: 1, trade: 0, faith: 0 } // new law groups; tax/authority/levy stay in r.laws
}
h.contract = { tax: 1, levy: 1, rights: [], since }   // Low 0, Medium 1, High 2
pc.pol = { offices: [], promises: [], petition: null } // promises made as a candidate or a councillor
```

- Legitimacy keeps the release's `r.legit`. Its parts are computed and never stored.
- Wants and fears stay 56's (`RI.aims`), cached outside the save.

### 2. Estates (EU4 estates and Victoria 3 interest groups)

The five estates and how each is measured:

| Estate | Members | Clout from | Leader | Wants (approval +) | Hates (approval −) |
|---|---|---|---|---|---|
| Nobility (`nob`) | landed houses (`S.houses` of the realm, rung N07 and up) | the rents of `GD.NOBLE_RUNGS` (income) plus men-at-arms | head of the strongest house | Low authority, Low obligations, lords' courts, bondage | High obligations, crown monopolies |
| Clergy (`cler`) | clergy career persons rank 3+, temples (56 `r.riWorks`) | temples × 1, clergy × rank | the highest-ranked cleric (or the Chaplain) | Established faith, lords' or royal courts | Tolerance, the written law |
| Guilds and burghers (`burg`) | merchants and masters of 66's market towns | the town's trade volume (66's carters and caravans) | richest guildmaster in the capital | Guild charters or open markets, royal courts, the written law | Crown monopolies, Crushing taxes |
| Commons (`comm`) | everyone else | `0.15 × (1 + unrest/50)`, ×1.5 under Free hold, ×2 while a revolt is armed | a named elder, reeve or rebel head (21's cast pool) | Light taxes, Free hold, Tolerance | Bondage, a grain price index ≥ 1.5 |
| The host (`army`) | officers of rank 4+ (`pc.mil` ladder; 9997's captains) | standing army share of `r.army`; ×1.3 at war | the Marshal | High authority, levies, pay on time | arrears (9997), lost wars |

- **Clout** is normalised to sum to 1 each New Year.
- **Names.** Realm names come from 990's powers table ("the Felt Keepers", "the examined officials") and 54's council word ("the folkmoot"). The `A.FARP_POWERS_NAME` hook already exists for this.
- **Approval:**
  - the sum of the law positions' `ap` for that estate (data, §3);
  - +1 per council seat its members hold (at most +3);
  - event modifiers that fade by 1 a year;
  - the estate's own reading: the commons −1 for each 0.25 the grain index stands above 1.0 (at most −4); the host −1 a month in arrears (at most −4) and +2 for a war won; the clergy +1 for a great temple in the last 8 years.
  - The total is clamped to −10..+10.
- **Effects:**
  - **Approval ≥ +5:** the estate is loyal. It gives legitimacy (§6), and its members join no faction against the crown.
  - **Approval ≤ −5:** the estate is angry. Its members join factions with +0.1 × clout added to `A.factionPower` for each angry estate represented. If its clout ≥ 0.25, its leader may open an **estate faction** of the release's liberty kind, with the demand "repeal law X". That demand opens a bill (§4).
- **Membership of the player.** The player belongs to the estate their path implies (noble, cleric, merchant or master, soldier rank 4+, otherwise commons). It is shown on the profile ("You stand with the Guilds of Aldmark"). Your estate's anger reaches you through 21's moves ("The guildmasters meet at the Lamb. They want your name on the petition").

### 3. Laws: eight groups

`GD.POL_LAWS` is data. Each position is `{ n, ap: {nob, cler, burg, comm, army}, fx }`, and its custom pull uses 56's `riLaw0` for every group.

| Group | Positions | Exists? | Engine effect (`fx`) |
|---|---|---|---|
| Taxes | Light · Fair · Customary · Heavy · Crushing | `r.laws.tax` | unchanged (56) |
| Crown authority | Low · Limited · High · Absolute | `r.laws.authority` | unchanged; also sets who appoints offices (Low: houses keep their governors; Absolute: the crown names all) |
| Levies | release positions | `r.laws.levy` | unchanged |
| Succession | heredity (male / female / equal) · elective · council · theocracy | `r.gov`, `r.law` | a change needs legitimacy ≥ 60 and authority High; −10 stability for 3 years |
| Obligations | Low · Medium · High | new (`laws2.obl`) | the default contract for new grants (§7) |
| Justice | Lords' courts · Royal courts · The written law | new | who holds magistracies (§5); severity of `punish` (lords' courts ×1.2 for commoners); the written law needs literate officials (scribe and lawyer careers) |
| The commons | Bondage · Tenancy · Free hold | new | noble rents ×1.1 / 1 / 0.95; commons clout ×0.7 / 1 / 1.5; an unfree player freed by Free hold gets a scene |
| Trade | Guild charters · Crown monopolies · Open markets | new | craft prices +5% / 0 / −3% (45); treasury +3% of trade under monopolies; caravans +20% under open markets (45 `E.caravans`) |
| Faith | Established · Tolerant · Faith-led | new | clergy clout ×1.2 / 0.8 / 1.5; minority unrest −/+ |

**Starting positions.** Each realm starts where its lore and 47's realm bible put it (Aldmark's "hearth mark" means Tenancy; Ozand a broker republic, Open markets). Where no source says, the default is Medium, Royal courts, Tenancy, Guild charters, Established.

### 4. Bills (Victoria 3's enactment, calibrated to 56)

- **Who opens one.** The ruler; the loudest push at 56's New Year court (56's `RI.session` picks it today and decides it at once; now it opens a bill instead); a faction's demand; an angry estate's petition; the player as ruler or councillor ("Propose a law", 1 initiative). Only one bill at a time.
- **Checkpoints.** Every 60 days, for at most 360 days (6 checks).
  - `S` and `O` are the clout-weighted support and opposition: for each estate, `cl × ap-for-this-change`; plus the councillors' and house heads' weights from 56's `RI.lean`; plus the player's voice (56's 0.25–1).
  - `m = (S − O) / (S + O + 0.01)`, from −1 to 1.
  - Pass: 0 at the first check, then `clamp(0.10 + 0.45·m + 0.05·adv, 0.02, 0.70) × (0.7 + 0.6·legit/100)`.
  - Debate: `0.08 + 0.12·(1 − |m|)`.
  - Stall: `clamp(0.20 − 0.15·m, 0.05, 0.40)`.
  - Advance: the rest; `adv += 1`.
  - Three stalls, or the sixth check passed without a pass, and the bill fails.
- **Calibration rule (a test).** On 1,000 synthetic courts drawn from a real world's court states, the share of bills that pass within 360 days must sit within 5 points of 56's one-shot odds for the same court. 56's tax-distribution audit (≤ 60% extreme at 60 years) must still hold. The constants above are the starting point; the test is the contract.
- **Debate.** In the player's realm, when the player is ruler or councillor, a debate is a scene, `po_debate`:
  - speak for or against (a persuasion check against a difficulty of `45 + 20·|m|`; a win moves `m` by 0.15 for the rest of the bill);
  - trade a vote (spend a favour owed: `fx.owed`);
  - let it lie.
  
  In an AI realm a debate moves `m` by ±0.1 on `A.chance(0.5)`.
- **Passing.** The law changes (`r.laws` or `r.pol.laws2`). Estates for it get +2 approval and those against −2. 56's record names who pushed and why. The news goes through 57.
- **On screen.** The bill track is six notches, each with its result glyph (✓ pass, → advance, ‖ stall, ⁇ debate). Under it: the for and against bar by estate, with leaders' busts; "Next count: 14 May"; and the odds of each outcome at the next count (59 tooltip with `S`, `O` and `m`). 996's strip carries the next count.

### 5. Offices below the council

`GD.POL_OFFICES` is data. Office names are swapped per culture through 54 (the reeve is a *haldern's man* in Aldmark).

| Office | Seat | Count | Held by | Chosen by | Term | Pay | Power the holder uses (a choice each year) |
|---|---|---|---|---|---|---|---|
| Governor (castellan, shire-reeve) | a shire: 66's market-town hinterland | 1–4 a realm | nobility or host | the crown (houses keep theirs under Low authority) | at pleasure | 2% of the shire's taxes | take graft (keep 0–10% of the shire's tax: coin now, corruption, a 39-style chance of discovery each year); speed the muster; answer unrest |
| Reeve or mayor | each of 66's 86 market towns (far towns likewise) | 1 a town | guilds | the town's guildmasters, every 6 years (the election machinery, §8, with 5–9 electors) | 6 years | 1% of the town's trade | raise or ease tolls (66's carting cost ±10%); keep the market peace |
| Magistrate | a shire | 1 a shire | Lords' courts: nobility; Royal courts or the written law: law-career persons | the Chancellor | at pleasure | 150 suns | hear cases: `po_case` scenes with a verdict and its estate effects |
| Warden of the March | a border shire with a hostile neighbour (68's `csPlan` or a war in 30 years) | 0–2 | host | the Marshal | at pleasure | 300 suns | border muster; raids (37's missions) |
| Collector of customs | a port town | 0–3 | guilds | sold by the crown for 2 years' pay (EU4's sale of offices) | 4 years | 2% of sea trade | squeeze the merchants (coin, burghers −1) or not |

**Who fills them.** Offices are filled at the first New Year from existing persons only: cast members with a fitting title, house members, and career persons of the right path and rank. A new person is made (with the release's maker) only when the realm's pool is empty. That is about 1,500 offices across 153 realms, mostly on persons who exist already.

**The player:**
- **Seek an office** (Decisions, or "What now" when the bars are met). Each office lists its requirements (rung, rank, skill, estate) and its named rival candidates. The appointer decides by opinion + 0.5 × the relevant skill + 10 per favour owed + a gift (diminishing as 56's gifts do); the odds are shown.
- **Hold it.** The yearly choice comes as a scene. Pay is booked in 56's "Where the money goes".
- **Lose it.** You can be dismissed by a new ruler (56's 35%), when graft is found (a Treasurer's audit, §6), or for failure (the warden loses his shire).
- **The second ladder.** This is the "after the top" ladder the lives review asked for: soldier → warden → Marshal; merchant → customs → reeve → Treasurer; lawyer → magistrate → Chancellor.

### 6. The council meets: seat tasks (CK3)

56's five seats keep their people. Each seat has a task, chosen once a year by its holder: the AI chooses by its want, the player by choice when they hold the seat. The outcome is a check of the holder's seat skill (56's table).

| Seat | Tasks |
|---|---|
| Chancellor | court an estate (+2 approval on success) · draft a law (opens a bill with +0.1 `m`) · mend a neighbour (20's interest +10) |
| Marshal | drill the host (the release's drill) · speed the muster (levies rise 30% faster) · keep the peace (unrest −) |
| Treasurer | press the taxes (+5% income, commons −1) · audit the officials (finds graft: 30% a year per grafting governor) · fund works (56's works ladder first) |
| Spymaster | watch the court (39 discovery ×1.5 against plots on the crown) · watch the estates (shows the player each estate's leanings and next demand) · watch a realm (68's `csPlan` against you shown) |
| Chaplain | preach obedience (legitimacy target +3) · tend the poor (commons +2, coin) · defend the faith (clergy +2) |

- **Sessions.** The council sits four times a year (on 47's quarter days where the realm has them). The ruler hears the year's petition at one of them (56's `ri_court_push`, kept at 97's rarity).
- **For the player in a seat.** The task is picked on the court card. Its result comes as a short scene twice a year at most, booked through 21's budget.

### 7. Vassal contracts (CK3)

- **Every landed house** (rung N07 and up, or any house holding land) gets `h.contract` from the realm's Obligations law.
- **Tax obligation.** Low, Medium and High are 5%, 10% and 15% of the house's rents to the crown. This replaces 56's flat "tenth on rents" for nobles; Medium is 10%, so balance holds.
- **Levy obligation.** ×0.75, ×1 and ×1.25 of the rung's levy (`GD.NOBLE_RUNGS`).
- **Rights:**

  | Right | Effect |
  |---|---|
  | `seat` | a guaranteed council seat for the house head (great houses only) |
  | `coin` | keeps the crown's share of its towns' tolls |
  | `fort` | builds walls without leave (the release's `walls` queue) |
  | `war` | may feud a neighbour house inside the realm: a 55 feud, raids and burnt holdings (56's `ri_burned`) |
  | `keep` | its land cannot be taken without a trial: revocation becomes a bill |

- **Changes, by the crown:**
  - **Raise one obligation one step:** free if the crown holds a favour owed by the house head (`C.owes`, spent). Otherwise it costs −15 opinion with that house and −3 with every landed house: tyranny. One tyrannical change at a time, so a second needs a year or a favour.
  - **Lower a step:** +10 opinion.
  - **Grant a right:** +15 opinion, and −0.1 on the next authority bill.
  - **AI.** 56's vassal deals answer a faction with a pension, a seat or a refusal. Now the options are: pension; grant `seat` (the old "give a seat"); lower an obligation; grant another right; refuse. 20's persona picks, as it does today.
- **The player as a lord.** "Your oath to the crown of Aldmark" card: what you owe (tax %, men at muster), your rights, and what you are owed (protection, justice). Events:
  - `po_muster`: send your levy, pay scutage (2× the levy's year in coin) or refuse. A refusal is a breach: −20 opinion with the crown, and a second breach in 10 years opens a revocation bill.
  - `po_raise_oath`: the crown wants more. Accept, bargain for a right (a persuasion check), or refuse.
  - `po_oath_right`: ask for a right, using a favour.
- **The player as ruler.** The great lords list gets a row per house with − and + on each obligation and a "Grant a right" menu. The cost in opinion is shown before you press, and so is "tyranny" when it applies.
- **Fiefs by vote (Bannerlord).** When a fief falls vacant (an extinct house, a traitor's lands under 994's coup fate, a conquest), a grant decision opens for 60 days:
  - Up to three candidates: houses and knights of renown, including the player when 994's bars are met.
  - Each councillor and each great house head backs one with weight 1 (seat) or `0.5 + op/200` (house).
  - The ruler decides. Overriding the leader costs −10 opinion with each of its backers.
  - The player can lobby (1 initiative a backer, with a persuasion check or a favour).
- **The home changes crowns (Kenshi).** When the player's home province passes to another realm at a peace, the scene `po_new_crown` offers three ways:
  - swear to the new crown: keep your holdings; your old crown's regard −20; your estate's approval toward the new crown starts at −3;
  - leave with what you can carry: move to the nearest province of your old realm, and holdings in the lost province are sold at 50%;
  - join those who won't kneel: a `po_resist` flag; 68 can later cite it as a reconquest want.

### 8. Elections

These replace `A.electRuler`'s pick wherever `r.gov` is elective, council or theocracy. The same machinery serves reeves (§5).

- **Electors:**
  - elective: the heads of the realm's seven strongest houses, or the lore's named electors where 990 or 991 give them (Menaro's households);
  - council: the council plus the guildmasters of the realm's top towns, nine in all;
  - theocracy: seven senior clergy.
- **Candidates.** At most four: everyone `A.electable` allows, ranked by renown, and the player when eligible.
- **The season.** It opens 12 months before an election is likely: when the ruler is 65 or older, or below 30 health, or at a council realm's eight-year term (council realms elect on a term; elective and theocratic realms when the ruler dies). It sits on 996's strip.
- **An elector's score for a candidate:**
  - opinion of the candidate;
  - +15 if they share an estate, +10 if they share a faction;
  - + renown/4;
  - +10 per promise the candidate made to this elector;
  - a gift: +10, then +5, then +2;
  - −20 if the candidate broke a promise to this elector;
  - −15 if their houses feud (55's ledger, 8 or more).

  Each elector votes for the top score. A tie goes to the elder candidate, so nothing is drawn.
- **Rounds.** A majority wins. Otherwise round two is between the top two. With no majority after round two, the electors split: the strongest loser gets +0.2 claimant faction power.
- **The player as candidate.** Each action costs 1 initiative:
  - visit an elector (a persuasion check, +10 opinion);
  - promise something: a law position, an office or a pension, recorded in `pc.pol.promises` and due within 2 years of winning (a broken promise costs −30 opinion and the epithet "Oath-breaker");
  - give a gift;
  - slander a rival (a 39 slander that runs three times as fast and is twice as likely to be found out);
  - withdraw and endorse (the endorsed candidate then owes you a favour).
- **The player as elector.** Candidates court you as NPC moves (21's budget), offering coin, an office or a promise.
- **The tally.**
  - Elector cards show each one's leaning. The leaning is exact when the Spymaster's "watch the estates" task is on, or when your insight is 60 or more; otherwise it shows as "leans" or "unknown".
  - The result lists every vote by name in the news and in 57.
- **Seeded by the lore.** 991's 1106 Spear-Marshal election (Kalvaro against Harovi) and the Sunrise election (world review I2) run through this machinery on their dates.

### 9. Factions, with the meter shown

The release's five kinds stay. The card shows:
- power against its threshold: "37% of the crown's swords; at 40% their discontent grows 12 a year";
- discontent and its date ("at this pace, demands in about 14 months");
- the demand it will make;
- members by name and estate.

Changes:
- Angry estates add power (§2).
- A demand opens a forced bill (§4) or, for claimants and independence, the release's war, as today.
- The player can join a faction (1 initiative; 2 if they hold an office under the crown) or lead one (if they are its strongest member). Leading uses your estate's clout.

### 10. Legitimacy with parts

The release's `r.legit` drifts 20% of the gap each New Year toward a target `T`. The release's direct edits stay, as one-off shocks that then drift back.

`T` is the sum of:

| Part | Value |
|---|---|
| How the ruler came | rightful heir by law 60 · elected 65 · named by council 55 · claimant victor 30 · conquest 25 |
| Years on the throne | +1 a year, at most +15 |
| Renown | fame/10, at most +10 |
| The estates in government (those holding a council seat) | Σ approval × clout × 2 |
| Custom | +1 for each law at its custom; −2 for each law two or more steps off |
| Defeats | −5 for each war lost in the last 5 years |
| Hunger | −5 in a famine year |

- **Effects.** Bill pass odds (§4); claimant power (the release reads `r.legit < 45`); a chaplain's "preach obedience" adds to `T`.
- **On screen.** The tooltip (59) lists every part, so a player can see why a usurper's crown sits uneasy.

### 11. Events (about 40, prefix `po_`; all pass `lint-events` and `lint-choices`)

| Group | Count | Examples |
|---|---|---|
| Bills | 6 | `po_debate`, `po_petition` (an estate's), `po_bill_passed` (as a member of a losing estate) |
| Offices | 12 | `po_seek_*` (offered), `po_case` ×4 (magistrate verdicts with estate stakes), `po_graft` (as governor), `po_audit` (caught), `po_tolls` (as reeve), `po_march_raid` |
| Contracts | 6 | `po_muster`, `po_raise_oath`, `po_oath_right`, `po_breach`, `po_revoke`, `po_new_crown` |
| Elections | 8 | `po_season_opens`, `po_courted` (you as elector) ×2, `po_promise_due`, `po_election_day`, `po_round_two`, `po_split`, `po_reeve_vote` |
| Fiefs | 3 | `po_fief_vote`, `po_lobby`, `po_passed_over` |
| Estates | 5 | `po_estate_meets` (your estate wants your name), `po_bread_price` (commons, grain index), `po_arrears` (host), `po_temple` (clergy), `po_guild_charter` |

Conditions use `C.office`, `C.noble`, `C.ruler`, `C.faction` and `C.rich`, so `A.CX_RX` classes them. Two new helpers, `C.estate(p, k)` and `C.holds(p, officeKind)`, are declared in the feature.

### 12. Patches (small; each with a `why`)

| Patch | Where | Why |
|---|---|---|
| `PO-ELECT` | `A.electRuler`'s first line: return `r.pol.elect`'s winner when one is recorded | so elective succession reads the vote |
| `PO-OBL` | 56's tenth on rents, in `purse.core.js` (a hook there, not a blob patch) | contracts set the share |
| `PO-POWER` | wrap `A.factionPower` (core, no patch) | estates' anger adds power |
| `PO-CEDE` | the release's peace transfer of provinces, one call to `A.POL.ceded(prov, from, to)` | the home-changes-crowns scene |
| `PO-BILL` | 56's `RI.session`: the loudest push opens a bill instead of resolving (a hook in 56, coordinated with its owner) | Victoria 3's enactment |

All the rest is core code: `A.onMonth` for checkpoints and elections, a wrap of `A.factionsYear` after 56's for estates and contracts, `UI.A` actions with `data-a` (`poPropose`, `poVoice`, `poSeek`, `poTask`, `poOath`, `poVote`, `poPromise`).

### 13. UI: the Polity view (Realm tab → "Politics"; for rulers, first)

```
┌ The Crown ──────────────┐ ┌ The Bill: Heavier obligations ───────────┐
│ bust · Queen Livia      │ │ ✓? → → ‖ ○ ○   next count 14 May          │
│ Legitimacy 58 ▸ parts   │ │ for: Host 0.21 ▮▮▮  against: Nobility .38 │
│ Heir / next election    │ │ pass 18% · advance 46% · stall 24% · ⁇ 12 │
└─────────────────────────┘ └──────────────────────────────────────────┘
┌ Council (seat · person · task) ┐ ┌ Estates (clout bar · approval −10..+10 · leader) ┐
┌ Factions (power vs threshold meter, months to demand) ┐ ┌ Offices (tree by shire) ┐
┌ Your place: estate · offices · oath · promises · what you could seek ┐
```

- It renders purely (a `poPure` test), and every name goes through `UI.esc`.
- On a phone (71) the panels stack in that order, with the bill first when one is open.
- A map mode in 62: shires shaded by their governor's loyalty, with the office holder on hover.

### 14. Tests (`test.mjs`)

- `poOfficesFilled`: in three worlds, every office has a living holder of the right estate, and fewer than 5% of holders are made new.
- `poBillOdds`: on 1,000 synthetic courts, the pass rate within 360 days is within ±5 points of 56's one-shot odds. Debates come most often when `|m| < 0.2`.
- `poBillTrack`: the stage log and the next-count odds render purely and sum to 100%.
- `poElectionDeterministic`: the same seed gives the same votes. A candidate who broke a promise to four of seven electors loses. The tally names all seven votes.
- `poContractHook`: raising levy with a favour owed costs no opinion and spends the favour; without one it costs −15 to the house and −3 to the rest; a second tyrannical change in the same year is refused.
- `poHomeCeded`: a peace that moves the player's home queues `po_new_crown`, and each of its three ways does what it says.
- `poLegitParts`: the parts sum to `T`, and `r.legit` moves 20% of the gap.
- `poWorldBands` (bench, 10 × 100): the bands in the table at the top of this design.

---

## Priority design 2: Companies (`9997-companies`)

**Lane WD.** Size XL: about five core files, four patches, about 25 events (prefix `co_`), a lab and a bench.

**Builds on:**
- the release's war map (`GD.BN`, `A.tplDefaults`, `A.fightDay`, `A.divMaxOrg`, `A.divReinforce`, `A.supplyMap`, `A.wsSetOrder`, `A.armyThink`);
- the line battle (`A.newBattle`, `A.buildUnits`, `A.moraleCheck`, `A.aiPulse`, `A.battleStep`);
- 23 after-action; 34 both scales; 37 squad; 38 tempers and letters; 44 rank layers; 60 drill; 72 two scales; 85 field print; 991 templates and field orders;
- 45 and 66 for grain; 56's treasury for pay;
- 9996-polity for the host estate and officers' estates.

**The lore's ladder is the unit ladder.** M06 Captain holds a company of 200. M07 Senior Captain holds "a wing of four companies" (800, exactly one `GD.BN` battalion). The release's battalion is 800 men.

### 1. The fidelity decision (needs the owner's nod)

**Every battalion everywhere gets its own state.** About 1,000 divisions × 9 battalions is about 9,000 small records: `{n, m, mo, x, wd, cap}`, about 60 bytes each, about 0.5 MB of save. That is the same fidelity in every land.

**Companies with named captains, as real persons, exist only in the theatre:**
- divisions of the player's realm;
- divisions of any realm at war with it;
- any division in a fight the player is in or watching.

Making captains everywhere would be about 36,000 persons. At about 1 KB each that is roughly 36 MB of save and a heavier year turn, which is not workable.

**Outside the theatre:**
- A battalion with no captain uses its realm's officer corps rating, `r.ofc`: the mean command skill of the realm's officers, refreshed yearly. It is the same input to the same function.
- When a battalion enters the theatre, its four companies are made: the battalion's men split 4 ways, its morale and experience copied. Each gets a captain, a real person with a name from 54 and 990 for its home province's culture.
- When it leaves, the companies fold back into the battalion: men summed, morale weighted by men. Their captains stay persons and keep living, as people the player may meet again through 21.

So fidelity follows the player, not the map. A far-lands life gets its own theatre, which keeps the "one coherent world" rule for every land.

### 2. State

```js
d.bs = [ { n: "3rd Hartgate Spears", c: "SP", m: 800, mo: 62, x: 18, wd: 40, cap: pid|0, home: provId,
           hon: [ ["Ford of Tessar", 1108] ], co: null | [ { m, mo, cap, sgt, name } ] } ]  // parallel to tplOf(d).bns
d.food = 14        // days of bread on hand, 0..30 (40 with a baggage train)
d.pay = 0          // months in arrears
a.orderQ = [ { k, arg, sent, arrive } ]  // orders in flight (couriers)
r.ofc = { cmd: 41, n: 120 }               // the realm's officer corps
pc.mil.co = { div, b, i }                 // which company is the player's (when enlisted)
```

- `d.men`, `d.org` and `d.exp` stay authoritative for the war map, whose bench (44, 38) is tuned.
- Battalion state is kept consistent with them: Σ `bs.m` = `d.men` (a test), and the division's xp is the men-weighted mean of `bs.x`.
- `d.bs` is built from `tplOf(d).bns` when missing, so old saves load.

### 3. Names and honours

- **A battalion's name** is ordinal + home + troop: "3rd Hartgate Spears". The home is the province it was raised from, and the ordinal counts within the realm and code.
- **Far templates** use 991's words ("Second Thousand of the Left Wing").
- **A company** is "2nd Company, 3rd Hartgate Spears", or a captain's name where the culture names companies for their leader ("Oswin's Hundred").
- **Honours.** A battalion that held or won a named fight where its losses were 25% or more earns an honour: a battle name and year, kept in `hon`. 57 records it.
- **Retirement.** A battalion below 10% is disbanded and its name retired to the chronicle. The next battalion raised from that province takes the name with "the new" before it.

### 4. Losses fall on battalions, not on an average

After each day of `A.fightDay` (a wrap, no rule change):
- **The day's losses for each division** are split across its battalions. Those in line (the first battalions that fill the division's width share, foot before missile) take 70%; the rest take 30%. Within each group the split is by men.
- **A third of the losses are wounded** (`wd`). They return to the ranks over 30 days if the division is in supply. This is Bannerlord's wounded against killed.
- **Morale.** Each battalion's `mo` falls by 0.3 per 1% of men lost that day. A division whose fight is lost loses another −15. After a won fight, morale rises +5 a day back to its resting value.
- **Resting morale:**
  - 50;
  - + x/5;
  - + 0.1 × the drill of its main kind (60's `d.dr`);
  - + (captain's command − 40)/4, or `r.ofc` outside the theatre;
  - +5 for a bold captain (38's temper mapping applied to the captain);
  - −5 for each month in arrears (at most −20);
  - −10 when food is 0;
  - +5 fighting in its home province.
- **Morale on the war map.** It feeds back through `A.divMaxOrg`, wrapped: `× (0.85 + 0.3 × meanMorale/100)`. That is ±15% on the division's organisation cap. The bench must show 44's rank swing still at 10–20 points and 38's temper tests still passing.

### 5. The line battle built from the real division

This fixes 72's "a second battle that made up its own armies". `A.buildUnits` is wrapped: when `o.divs` is given (patch `CO-BATTLE-SRC` in `A.wsPCFightStart`, which passes the fighting divisions), units come from state.

- **The player's own battalion** fights as its four companies. Every other battalion of the player's division fights as one unit. Other divisions in the fight are grouped as one unit per battalion type, at most 12 units a side, which keeps the battle screen readable.
- **Each unit carries:** `men` from state; `morale = mo + 20` (the release's scale starts troops near `T.morale + 30`); quality `q` = 0.8 + x/250 + the drill bonus; and its captain (a person, or the corps rating).
- **Wings.** Units take wings as the release does (horse to the flanks, 30% of the best foot to the reserve).
- **Folding back.** At the end, each unit's dead and wounded return to its battalion or company, and morale comes back from the battle's end value.
- **Captains in danger.** A captain whose unit lost 25% or more, or routed and was pursued, is killed with a 3% + 10% chance and otherwise wounded (49's parts). A new captain is drawn from the company's serjeants (the best of them by command) and named in the log: "Serjeant Hild takes the 2nd Company".
- **The war map's result.** 44's `A.RANKFX` still moves the map fight by the player's performance. The battle's losses are now the division's real losses, recorded once, not twice: the map fight's day losses for those battalions are replaced, not added.

### 6. Formations: the shape

`GD.FORMATIONS` is data. It is separate from the release's tactics, which are the order (hold, advance, charge). A unit carries both: `u.form` and `u.tac`.

| Shape | Who | Frontage | vs missiles | vs horse | Attack | Speed | Drill gate (60) |
|---|---|---|---|---|---|---|---|
| Line | all foot | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | none |
| Shield wall | shields (`SP`, `HI`) | 0.9 | 1.35 | 1.2 | 0.8 | 0.5 | Shield walls 15+ |
| Hedge | pikes and spears | 0.8 | 0.9 | 1.6 | 0.9 | 0.4 | Shield walls 15+ |
| Loose | missile, light foot | 1.3 | 1.4 | 0.6 | 0.9 | 1.2 | Skirmish 15+ |
| Wedge | heavy horse, heavy foot | 0.6 | 0.9 | 0.9 | 1.4 (first push) | 1.1 | Wedge and charge 15+ |
| Column | all | 0.4 | 0.7 | 0.7 | 0.8 | 1.5 (march, no fight) | Marches 15+ |
| Ring | all, when flanked | 0.7 | 1.1 | 1.3 | 0.7 | 0 | Formation 15+ |

- Effects scale with drill exactly as 60 scales tactics: 55% at 15, 100% at 40, 130% at 100.
- 23's report scores formations as causes ("the 2nd Company's shield wall +11%").
- The AI picks by 60's `A.aiDeploy` preferences plus the captain's temper: bold picks wedge or line, cautious picks wall, hedge or ring.

### 7. Orders to exactly the units your rank commands

| Rank (release `pc.mil.rank`) | Commands | Orders |
|---|---|---|
| 0–3 soldier | nobody | 72's choices (the section); obey or not (38's letter rules) |
| 4–5 Captain (M06) | own company | shape · hold · advance · charge · withdraw, each pulse |
| 6 Senior Captain (M07) | own battalion's four companies | the same, per company, plus "follow me" (the four act together) |
| 7+ General / Commander | wings | the release's wing tactics; companies act on their captains' tempers |

- **Units you don't command** act on their captain's temper. A bold captain charges a shaken enemy without orders (+15% chance a pulse). A cautious one withdraws at morale 35, not 15.
- **Intent arrows.** `A.aiPulse` picks each enemy unit's next order before the pulse. 9997 records it on `u.next`, and 9998 draws it as an arrow (Slay the Spire's intent). This is honest: it is the move the engine will make.

### 8. Orders by courier on the war map

- **Delay.** `A.wsSetOrder` is wrapped: an order the player gives does not land at once. It goes into `a.orderQ` and arrives after `dist(general, army centroid) / 60 km a day`, ×1.5 through hills, forest or marsh, ×0.7 with scouts in the army.
- **Calibration.** The median delay is set to match a steady AI general's thinking interval (38's `every` 3 ticks), so the player isn't slower than the AI, only honest about distance.
- **Interrupts.** An order sent while one is in flight replaces it on arrival, not before.
- **Stage two, only if the bench needs it:** per-division delay, where divisions far from the general keep the old order longer.
- **On screen.** Couriers in flight are dots on the road from the general's banner (9998). The army row says "orders reach the army in 3 days".

### 9. Food, pay and desertion

- **Food.** Each day a division eats 1 day of bread. It refills by `0.5 × sr × 2` days a day, where `sr` is the release's supply ratio from `A.supplyMap` (so 1 day a day at full supply). It is capped at 30 days, or 40 with a baggage train.
- **The baggage train** is a new support company, `train` (a `GD.BN`-style entry with `w: 0`, speed ×0.9, 60 men).
- **Grain from real stocks.** Where 45 and 66 are built, refill also needs the grain those markets deliver. A town whose granary is empty cuts `sr` by its share. This uses 45's existing army demand, not a second draw.
- **Foraging.** At food under 5, a division forages its province: +3 days. Doing so takes grain from the province's town stock (66), adds +5 unrest, and writes a 57 record ("The army ate the harvest of Brodava, 1109").
- **Hunger.** At food 0: morale −2 a day, and 0.5% of men a day desert. Deserters are counted to their home province. In the player's company, a named comrade may desert (`co_desert`, 37's men).
- **Pay.** The host is paid monthly from the treasury, using 56's host upkeep line. A treasury below zero runs `d.pay += 1` for every division; arrears cost morale (§4) and the host estate's approval (9996).
- **Mercenaries.** A sellsword battalion (56's `RI.hireMercs`) in arrears for 2 months leaves. In a civil war it may go to the side that pays (`co_mercs_turn`).

### 10. Officers with wants (TW3K)

- **Satisfaction**, −100..100, for each theatre captain and each battalion captain who is a person:
  - +10 for a won fight;
  - +15 for a promotion;
  - −10 for each month in arrears;
  - −20 when passed over for promotion by someone of lower merit;
  - +5 a year for serving under a general he likes (opinion ≥ 30);
  - −10 a year for serving under one he hates;
  - +10 from a council office held by his house (9996).
- **Promotion.** After each campaign (a war's end, or a year at war), the best captain of each division by merit becomes Senior Captain of a vacant battalion. That ends 37's limit, "veterans aren't promoted". Your veteran comrades from 37 can be made serjeants, then captains.
- **Leaving.** At −50:
  - in peace he asks for a transfer;
  - in a civil war, if his house or estate is with the other side (9996), he takes his company over: a `co_turncoat` scene if it is the player's battalion, a 57 record otherwise.

### 11. Recruitment and replenishment

- 'A.divReinforce' and the release's refill, wrapped: new men join the most depleted battalion first. They lower its xp: `x' = (x·m + 5·Δ)/(m + Δ)`, so green men dilute veterans.
- An elite battalion (991's field orders) keeps 60's and the release's rule (refill at 8%).
- Men are raised from the battalion's home province while it is held. Otherwise they come from the depot province, and the battalion's home changes after half its men are new.

### 12. UI

- **Order of battle** (the war room's division card and the Path tab for soldiers). A tree: army (general, temper, plan) → division (commander) → battalion rows. Each row shows the name, the standard (62's house charge), the captain's 32 px bust, and bars for men, morale (with a 59 tooltip listing every part) and xp, plus honours as small seals. In the theatre, companies open under it.
- **Your company card** (37 expanded). Captain, serjeant and your three comrades by name. The rest as counts: fit · wounded · dead · deserted. Food days and pay.
- **Line battle.** Companies and battalions are drawn as 85's banner masses. Hover or focus shows the name, the captain, morale with its parts, and the shape. A selected unit you command gets five order buttons and a shape menu; shapes not drilled are shown greyed, with the reason. Enemy intent arrows show for the next pulse (9998).
- **After-action** (23). Cites units: "The 2nd Company, 3rd Hartgate Spears held the ford under Captain Oswin (lost 61 of 200)".

### 13. Events (about 25, prefix `co_`)

- **Captaincy:** `co_new_captain`, `co_passed_over`, `co_promoted`, `co_transfer_request`.
- **Hunger and pay:** `co_forage` (take the village's seed grain, or not), `co_hungry_march`, `co_desert`, `co_arrears`, `co_mutiny_talk`.
- **The company's life:** `co_honour` (naming the colours), `co_the_new_men`, `co_serjeant`, `co_old_company` (a veteran of a retired name).
- **Civil war:** `co_turncoat`, `co_mercs_turn`.
- **Battle:** `co_challenge` (TW3K's duel, run through 48).

All are written per rank, with `C.soldier` and `.job`, and never shown to a peasant (the lives review's B4).

### 14. Patches

| Patch | Where | Why |
|---|---|---|
| `CO-BATTLE-SRC` | `A.wsPCFightStart`: pass the fighting divisions into `A.newBattle` as `o.divs` | the line battle reads the real army |
| `CO-DAY-LOSS` | end of `A.fightDay`, one hook call `A.CO.day(F)` | losses fall on battalions |
| `CO-ORG-MORALE` | wrap `A.divMaxOrg` (core, no patch) | morale feeds organisation |
| `CO-ORDER-Q` | wrap `A.wsSetOrder` (core) and one call in the war clock to deliver due orders | couriers |

### 15. Tests and bench

- `coBattleFromDivision`: the line battle's units sum to the fighting divisions' men (±1 per unit). After it, Σ battalion men = `d.men`, and the dead are counted once.
- `coMoraleParts`: resting morale's parts sum to the value; the tooltip renders purely; a hungry, unpaid green battalion under a poor captain rests ≤ 35, and a fed, paid veteran one ≥ 75.
- `coFoodRunsOut`: cut off from every depot, a division's food falls 1 a day; at 0, morale falls 2 a day and desertion starts; foraging raises its town's grain price and writes a 57 record.
- `coCourier`: an order to an army 300 km off arrives in 5 days (3.5 with scouts), and the median delay over 200 real orders is within 1 tick of a steady AI general's interval.
- `coCaptainDies`: a captain killed in the line battle is dead in `A.P`, the serjeant takes the company, and the log says so.
- `coTheatreFold`: a battalion leaving the theatre folds to one record with the same men and men-weighted morale; its captain is still alive and known.
- **Bench**, 10 worlds × 30 years against the build without 9997:
  - wars a realm-year, median war length and provinces a peace each within ±15%;
  - 44's `rankMovesTheFight` still ≥ 10 points per layer;
  - 38's temper test bands hold;
  - save size grows by no more than 1 MB.

---

## Priority design 3: Motion (`9998-motion`)

**Lane G** (Compounding: "motion, portraits, the title, the battle screen and fine detail"). Size L: one runtime file, five choreography files, one stylesheet, no engine change.

**Builds on:** 91 (the `--m-*` tokens), 96 (the Motion setting, cut-ins), 92 (the scene card's before and after readings), 85 (the field print), 62 (the inked map), 93 (portraits), 94 (prints), 73 (UI sounds), 71 (phone).

**The rule.** The brief §6 holds: motion explains a change and never decorates reading. Only `transform` and `opacity` animate. There is no loop while reading. Reduced means a fade of 120 ms or less; Off means none.

### 1. The architecture: the engine resolves, the UI plays it back

- **The runtime.** `UI.MO` keeps a queue of beats: `UI.MO.beat({ kind, el|sel, from, to, at, dur })`.
- **Engine first.** Every state change has already happened when a beat plays. The beat only shows it, from the before and after readings 92 already takes (`UI.A.evChoose`).
- **Skipping.** A click or key during a sequence jumps every beat to its end, and is spent on the skip, as 96 does.
- **Determinism.** No beat reads `A.rand` or writes `A.S`. Seeded flourishes (focus lines, ink spatter) hash ids and the day.
- **Tests run with Motion Off,** and `moPure` proves Full and Off reach the same `A.S` and `A.rngState`.
- **Implementation.**
  - Web Animations (`el.animate`) with `fill: 'both'`, then the end state is committed to style and the animation cancelled.
  - FLIP for anything that changes place: measure, invert, play.
  - One `requestAnimationFrame` loop for the canvas views (battle, map), only while a beat is live. It is idle otherwise.
- **The beat registry.** `UI.MO.KINDS` is open, so a feature can add a beat kind.

| Kind | What it does | Token |
|---|---|---|
| `enter` | 12 px rise + fade | `--m-enter` 280 ms |
| `exit` | fade + 8 px fall | `--m-exit` 180 ms |
| `stagger` | children enter 40 ms apart, at most 8 | `--m-enter` |
| `tick` | a number counts from → to (text only; ≤ 400 ms; tabular figures) | `--m-base` |
| `fly` | a chip travels from source to target (FLIP) and lands with `--m-snap` | 360 ms |
| `stamp` | a seal lands: scale 1.25 → 1 with overshoot, then a 2-frame ink spread (opacity) | `--m-snap` |
| `flash` | an opacity pulse along a path (clash, hit) | 160 ms |
| `wipe` | a diagonal mask of the accent across a panel (tab change) | 180 ms |
| `draw` | stroke-dashoffset on an SVG path (front lines, arrows, ink rules) | `--m-ink` 700 ms |

### 2. The scene card's sequence (Persona's "every press answers")

1. **In:**
   - the print inks in (61's 700 ms, kept);
   - at +80 ms the bust `enter`s from 12 px below;
   - the title, then the text;
   - the choices `stagger` in.
2. **Hover:** 92's slash (kept).
3. **Choose:**
   - the chosen row flashes gold (`flash`, 120 ms);
   - the others `exit`.
4. **The roll** (checks only):
   - the odds pips fill one by one (100 ms each, four pips);
   - then a **seal stamp**: a vermilion seal for a success or an ink-black one for a failure, with the word SUCCESS or FAILED beside it.
   - It takes at most 600 ms, and the odds badge stays visible throughout.
   - The seal's mark is a 95-icons glyph drawn as an SVG path. It is not a real-world script, keeping 54's rule of no real language.
5. **The result:**
   - the panel `enter`s;
   - each delta chip `fly`s from the result to its stat on the rail (coin to the purse, health to the bar), and the rail number `tick`s.
6. **Continue:** the card `exit`s, and the story log's new line `enter`s.

The whole sequence takes 900 ms at most at Full. Reduced: crossfades only, with the stamp shown flat. Off: the end state at once.

### 3. Battle motion (85's "not done")

- **Between pulses** each unit mass slides to its new place (transform, 400 ms).
- **On contact,** a `flash` runs along the line where two wings meet.
- **A named reaction** (Genshin) floats over the unit for 900 ms when 60's counters or `A.tacDay` fire: "Spear wall sets against the charge · horses balk". The text is the same cause label 23 will report.
- **Intent arrows** (Slay the Spire): before each pulse, every enemy unit whose next order (`u.next`, 9997) is advance, charge or withdraw gets a vermilion arrow `draw`n. A hold shows a small shield glyph. Arrows fade when the pulse resolves.
- **A rout:** the mass breaks into three pieces that slide back and fade.
- **Banners** flutter only while a beat is live: the brief's no-loop rule allows motion during a sequence, not while reading.
- **The ending** goes to 96's VICTORY or DEFEAT cut-in (kept).

### 4. The war map (Hearts of Iron's fronts, drawn)

- **The front line.** An inked line along province edges where the two sides' controlled land meets, recomputed on the day tick. When it moves it is redrawn with `draw` over 700 ms; ground gained is hatched for 3 days.
- **Battle plans.** 38's plans (`a.gtPlan`) become vermilion arrows from the army to its targets. A feint is drawn dotted.
- **Couriers** (9997): dots that travel the road from the general's standard to the army over the order's delay.
- **Counters** slide between provinces on the tick (300 ms) instead of jumping.
- **A fight** is a crossed-swords glyph that pulses twice when it starts, then stays still.
- **The camera** eases on zoom and pan (250 ms lerp), with no jumps.

### 5. Transitions and the mid-tier moment

- **Tab changes** `wipe` at Full and crossfade at Reduced. Sheets rise with `--m-enter`.
- **A new mid tier,** between a toast and 96's cut-in: the **stamp card**, 900 ms, a small corner card. It covers a confidant rank (999), a trait gained with its reason (49), an office won (9996), an honour for your battalion (9997) and a skill perk (`GD.PERKS`). It holds no more than two a month, and doesn't count against 96's one cut-in a month.

### 6. Showpieces (from the visual review)

- **Title** (I4). Three ridges from 94's layers with the brief's 60 s parallax drift; seeded busts; the ARDAN logotype `draw`n in ink over 1.2 s, then still.
- **Death** (I5). 96's FAREWELL, then the dusk print full-screen, the epitaph entering line by line, the score `tick`ing up, and the heir's bust `enter`ing beside "Go on as your heir".
- **Profile reveal** (Genshin's showcase). The full figure `enter`s from below, and the frame's rule `draw`s.
- **Codex** (Hades). Each entry gets a 94 print seeded from its id, inked in on first open only.

### 7. Budgets and rules (tested)

- **Frame time.** At most 4 ms of script a frame during a sequence on a mid phone (the 71 profile), and 0 when idle.
- **What moves.** Every registered keyframe animates only `transform` and `opacity`. `draw` uses stroke-dashoffset on SVG, which the brief's "ink" token already allows.
- **Reduced.** No transform keyframes, and every duration ≤ 120 ms.
- **Off.** No animations are created at all.
- **Audio** (73, optional). The stamp plays the wax seal, a clash plays steel, and a courier's arrival the bell. Each follows the menu's sound setting.

### 8. Tests

- `moPure`: the same scene chosen with Motion Full and Off gives the same `A.S` and `A.rngState`.
- `moCompositorOnly`: every keyframe in `UI.MO.KINDS` touches only `transform`, `opacity` or stroke-dashoffset.
- `moReduced`: under reduced motion no transform runs, and no duration is over 120 ms.
- `moBudget`: choose → result takes ≤ 900 ms at Full, and a keypress mid-sequence lands the end state within one frame.
- `moIntentHonest`: in 50 battles, every drawn arrow matches the order the next pulse carries out.

---

## The ranked build plan

Each item gives what it is, its size and folder, what it compounds with, and two or three tests that would prove it.

### 1. The Polity

- **Size:** XL.
- **Folder:** `features/9996-polity/` (lane P).
- **Compounds with:** 56, 20, 68, 990, 54, 994, 55, 39, 21, 996, 59, 62. It feeds #2 (the host estate, officers' houses), #4 (the council speaks), #9 (houses earn renown from offices), and 9994 share cards ("elected by four votes to three").
- **Spec:** [Priority design 1](#priority-design-1-the-polity-9996-polity).
- **Tests:**
  - `poBillOdds`: bills match 56's odds within ±5;
  - `poElectionDeterministic`: same seed, same votes, and a promise-breaker loses;
  - `poContractHook`: a hook makes a raise free; tyranny once a year.

### 2. Companies

- **Size:** XL.
- **Folder:** `features/9997-companies/` (lane WD).
- **Compounds with:** the release's war map and line battle; 23, 34, 37, 38, 44, 60, 72, 85, 991; 45 and 66 (grain); 56 (pay); #1 (estates and defection); #3 (arrows, couriers). It gives 57 honours, 21 a pool of people with history (old captains), and 74 old soldiers to visit.
- **Spec:** [Priority design 2](#priority-design-2-companies-9997-companies).
- **Tests:**
  - `coBattleFromDivision`: the battle's men equal the division's, and the dead are counted once;
  - `coFoodRunsOut`: food, then morale, then desertion, in that order;
  - the war bench within ±15%, with 44's swing still ≥ 10.

### 3. Motion

- **Size:** L.
- **Folder:** `features/9998-motion/` (lane G).
- **Compounds with:** 91, 92, 96, 85, 62, 93, 94, 73, 71; draws #1's bill track and #2's arrows and couriers; 9994's share cards can reuse the stamp.
- **Spec:** [Priority design 3](#priority-design-3-motion-9998-motion).
- **Tests:** `moPure`, `moCompositorOnly`, `moBudget`.

### 4. The ring speaks (King of Dragon Pass)

- **Size:** S–M.
- **Folder:** `features/9999-ring/`.
- **What it does.**
  - On an event marked big (a ruler's, a war's, a law's, a marriage's, a scheme's, or any `once` event), up to three advisors give one line each above the choices, under 9992's inner voice.
  - **Who advises:**
    - a ruler or councillor: the council (56);
    - a lord: his steward, his spouse, his eldest;
    - a soldier: the serjeant and two comrades (37);
    - a commoner: kin and the closest confidant (999).
  - **What each says** comes from their want and fear (56's `RI.aims`) or their traits (20's persona), in their manner (54).
  - **Each line names the choice they favour,** by the choice's effect tags: "Harrow (Marshal, wants war): *Take the field. They are weak this spring.*"
  - **Accuracy:** an advisor with the relevant skill ≥ 60 favours the choice with the best odds; one below 30 favours by bias alone. A 59 tooltip says "Harrow is often right about war, never about money."
  - **Lines** are picked by hashing the event, the advisor and the year: pure, never `A.rand`.
- **It also adds `A.whatNow` lines** for unused systems (lives I5), spoken by an advisor ("Your steward: the vault could pay for a chapel").
- **Compounds with:** 56, 20, 54, 37, 999, 9992, #1's offices (the Spymaster's estate reports become advice).
- **Tests:**
  - `ringPure`: rendering draws no random number;
  - `ringHonest`: a skilled advisor's favoured choice has the top odds in ≥ 90% of 200 events, and an unskilled one's agrees with bias, not odds;
  - `ringReach`: in 24 bot lives, at least 80% of `once` events carry advice.

### 5. Readable stakes (Reigns and Slay the Spire)

- **Size:** S.
- **Folder:** extends `92-scene-card` and the duel screen (48 or 96, coordinated with their owners).
- **Reigns dots.** Every choice row shows up to four small dots, one for each family it touches: coin, health, a bond, standing (fame, honour, rank), freedom (prison, punish), life (`die`, `wound`).
  - The dots are read once, engine side, when the view is built: object `fx` exactly, and function `fx` by the same one-time source scan 89 uses.
  - Large means a big change and small a small one. Direction is never shown, as in Reigns.
  - Where a check decides, the dots show the union of both outcomes.
- **Duel intent.** The foe's tell becomes an intent icon with its move class (strike, guard, feint, grapple) over their head, read from the move the duel AI has already chosen.
- **Compounds with:** 89, 92, 24, 48, 59.
- **Tests:**
  - `dotsMatchFx`: on 300 events, every dot corresponds to a key the outcome actually changes, and no changed family is missing a dot;
  - `intentHonest`: the icon equals the AI's next move in 100 duels;
  - `dotsPure`.

### 6. White and red checks (Disco Elysium)

- **Size:** S.
- **Folder:** extends `75-fair-checks`.
- **Rules:**
  - **A white check failed** is remembered with the value it needed: `pc.flags.ev[id]` already holds the year, and the new `pc.retry[id] = {s, d, val}`.
  - **It can be retried** when the event recurs, if the skill has risen 5 or more since the failure. The choice shows "Again: you are better at this now (+7 since 1112)".
  - **Red checks** are marked once-only, with 92's danger edge and a "ONE CHANCE" tag: any check whose loss is lasting (a death, a wound, prison, an exile, a `once` event).
  - **Passive checks.** A choice may carry `passive: {s, d}`. If the player's value clears it, an extra line appears with no roll: "*Insight:* he is lying about the mill." The inner voice (9992) speaks it.
  - **Lint rule** (a proposal to `tools/`): a red check's losing branch must set a flag, queue an event, or change a bond.
- **Compounds with:** 31 (failure teaches ×1.5), 75, 9992 voices, 92.
- **Tests:**
  - `whiteRetry`: a failed check offers the retry only after +5 skill;
  - `redMarked`: every check with a lasting loss carries the tag across all events;
  - `passivePure`: the line shows only when the value clears it, with no draw.

### 7. Vows and the weekly seed (Hades, Slay the Spire, BitLife)

- **Size:** S–M.
- **Folder:** extends `995-hall-of-lives` (with 29-starts for the start).
- **Vows.** At creation, take 0–5 vows from 12, each with a score multiplier, the sum shown as "Weight". Unlock is Slay the Spire's: each vow opens after one life ended with the previous one.
  - Born to nothing: no inheritance.
  - Plague years: disease rolls ×1.5.
  - No mercy: Realism odds hidden.
  - The crown's enemy: your realm starts at war.
  - Unlucky in love: a confidant's rank needs +25%.
  - Iron winters: food prices ×1.3.
  - …and six more.

  Vows are engine inputs, carried in `o` the way 97 passes `o.firstLife`, so the journal replays them.
- **The Hall's voice.** One chronicler line per new ending found ("Another who died in a ditch. The Hall has room").
- **The weekly seed.** The ISO week hashed to a seed, one of 29's starts, three goals checked by the engine (ambition keys, achievements, endings), and "your best" kept in the Hall.
- **Compounds with:** 995, 29, 42, 28, 73, 9994 (a share card per week).
- **Tests:**
  - `vowReplay`: a vowed life replays to the same state;
  - `vowScore`: Weight multiplies the score as shown;
  - `weekSeed`: two browsers on the same ISO week get the same seed and start.

### 8. Moodlets and breaking points (RimWorld and CK3)

- **Size:** M.
- **Folder:** extends `35-moods`.
- **Moodlets.** Every push on a need becomes a named, dated moodlet with a value and a fade: `pc.mood = [[key, label, v, until]]`, at most 12, the weakest dropped first.
  - Examples: "Slept on the road −6 (rest), 10 days"; "Supper with Maud +8 (company), 20 days"; "The guild passed you over −10 (purpose), a season".
  - The four needs remain the sums. 35's settling stays the baseline, so balance holds.
- **Stress** (CK3). A choice against one of your traits (49's deed kinds read in reverse: a "kind" person's "hang him") adds stress 10–25. Stress fades 5 a month, and faster by acting in character.
- **Breaks.** A break comes at stress 100 and 200, or when any need sits under 10 for two months: RimWorld's threshold idea on Ardan's scale. The break is a scene offering a coping trait with a cost and a use: drink (rest + / health −), prayer (purpose + / coin −), rage (wil + / opinion −), flight (a journey, through 9990 when built).
- **The card** lists the moodlets, as RimWorld's does, with their sources.
- **Compounds with:** 35, 49, 21, 999, 9990, #4 (an advisor notices: "You haven't slept, brother").
- **Tests:**
  - `moodletsSum`: the needs equal 35's value within 1 on 10 bot lives;
  - `stressAgainstNature`: a kind person's cruel choice adds stress, and an in-character one removes it;
  - `breakOnce`: a break comes at 100, at most once per 100 stress.

### 9. House renown and legacies (CK3)

- **Size:** M.
- **Folder:** `features/99990-legacy/`.
- **Renown.** A house earns renown each year from its members' deeds, offices (#1), honours (#2), endings (28) and score (73).
- **Legacies.** At each `A.continueAs` the heir buys one perk on one of five tracks, five perks each:
  - **blood:** children +1 in the family's best stat;
  - **blade:** house members start drilled; your battalion keeps its name across generations (#2);
  - **coin:** a house strongbox that passes untaxed;
  - **word:** the house name opens doors at court, as an office appointment bonus (#1);
  - **faith:** a house chapel; stress −20% (#8).
- **Storage.** `S.dynasty.leg`. Old saves start with no legacies.
- **Compounds with:** 995, 28, 73, 74, #1, #2, #8.
- **Tests:**
  - `legacyBuy`: renown is spent and the perk applies to a newborn member;
  - `legacyCarry`: the perk holds across `A.continueAs` and a save reload;
  - `renownSources`: each source adds the stated amount.

### 10. The inquest (Pentiment)

- **Size:** M.
- **Folder:** `features/99991-inquest/`.
- **What starts one.** A death, theft or fire in your circle with a 64 claim attached and a magistrate (#1) or a lord who will judge in 14 days. If you are the magistrate, you are the one judging.
- **How it runs.**
  - Each day offers three leads: visit, search, ask at the inn, read the ledger. Each costs half a day, so you can follow about 6 of 12.
  - Each lead reveals a claim's holder, a 55 secret, or evidence for or against a 64 claim. Lies are true-or-false data that 64 already keeps.
  - On the day, you name someone (or no one).
  - Truth is decided by 64's data at the start and never shown outright. The consequences follow what you claimed: the accused's kin, the estate's approval (#1), your fame.
  - Years later, a 57 record or an echo can show you were wrong.
- **Writing.** About 8 parametrised scene shapes with `ctx` from the case, not 50 hand-written mysteries.
- **Compounds with:** 64, 55, 26, 57, 87 echoes, #1 magistrates, #4 (advisors with an opinion on the accused).
- **Tests:**
  - `inquestClock`: at most 28 half-days, and leads close when spent;
  - `inquestTruthHidden`: the truth flag never renders before the verdict, and the render is pure;
  - `inquestWrongEcho`: a wrong verdict can later be revealed by a scheduled echo.

### 11. A focus for each chapter (CK3 lifestyles)

- **Size:** M.
- **Folder:** `features/99992-focus/`.
- **The focus.** At coming of age, and at each chapter (9993's chapter cards when built, else every 5 years), choose a focus among six: arms, craft, trade, letters, faith, intrigue. It adds +25% to 31's growth in its skills.
- **Trees.** Three per focus, four nodes each. The nodes are 69's skill families and existing `GD.PERKS` re-grouped, not new numbers.
- **The end of a tree** gives an earned trait with its reason, through 49's log: Strategist, Master of the Yard, Merchant Prince, Scholar, Confessor, Spider.
- **Duos** (Hades). Two culminating traits unlock a third: Strategist + Confessor makes Warden of the Faith.
- **Compounds with:** 31, 49, 69, `GD.PERKS`, 9993 chapters, #9 (a legacy can raise a focus's growth).
- **Tests:**
  - `focusGrowth`: a focused skill grows 25% faster from use;
  - `treeTrait`: completing a tree gives its trait with a reason line;
  - `focusNoDeadNumbers`: 69's dead-number bench still finds every skill touching ≥ 5 outcomes.

### 12. Wounds where the blow lands (Kenshi, RimWorld, Dwarf Fortress)

- **Size:** M.
- **Folder:** extends `49-body-mind`, with `48-fight-ladder` for the duel.
- **Duel blows** carry a part: head, body, the arms or the legs, from the move. A cut aims high, a grapple at the body, a low sweep at the legs. 48's damage lands on that part's bar as well as Blood. Below zero the part fails:
  - an arm drops its weapon (the duel switches to "unarmed", 69);
  - a leg ends movement moves;
  - a head knock-out ends the bout.
- **Lasting wounds** come from 49's table on that part, so a duel can now cost a hand.
- **The battle (#2).** A captain's wound has a part too.
- **Prosthetics.** A carpenter or smith (`GD.CAREERS`) can fit a wooden leg, a hook or an iron hand. Each wins back 40–60% of the part's skill cost, and 63 and 93 already draw them.
- **Compounds with:** 49, 48, 63, 93, 69, #2, 89 (the fight badge says "risk to the sword arm").
- **Tests:**
  - `partFails`: an arm below zero drops the weapon and the duel goes on unarmed;
  - `duelWoundPart`: a lasting wound from a duel sits on the part that was hit;
  - `prostheticBack`: a hook restores the stated share of the hand's skill cost.

### What these twelve do together

- **#1 and #2 share people.** Officers belong to houses and estates, a captain's house holding an office raises his satisfaction, and a civil war splits the host along estate lines.
- **#3 is how #1 and #2 are seen:** the bill track, the front line, the couriers, the intent arrows.
- **#4 to #6 make every system readable before you commit.**
- **#7 and #9 make lives add up.**
- **#8, #10, #11 and #12 make one life a person:** what wears you down, what you judged, what you became, what it cost your body.

## Backlog (worth doing, not in the twelve)

| Item | From | Size | Home |
|---|---|---|---|
| The standoff before a war: demands, sides, a backdown | Victoria 3 | M | 68-casus-belli |
| NPC-against-NPC plots, seeded as 64 claims | CK3, RimWorld | M | 39-schemes |
| Generals earn traits from how they fight | Hearts of Iron IV | S | 38-orders |
| The lore's pre-1105 chronicle as dated records | Dwarf Fortress | S | 57-world-chronicle |
| Prints titled after real events | Dwarf Fortress | S | 94-woodblock-skies |
| A two-year tension cycle | RimWorld | S | 81-pacing |
| New Year offerings and a prophecy that comes true | King of Dragon Pass | S | 990-far-peoples |
| Route graph with departure days and heard-of routes | 80 Days, Slay the Spire | M | 9990 (journeys) |
| Letters in a hand by rank and schooling | Pentiment | S | 9998-motion |

## Sources

- CK3 contracts and governments: [Dev Diary 17, governments and vassal management](https://admin-forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-17-governments-vassal-management-laws-and-raiding.1352640/page-2); [Gamewatcher on feudal contracts](https://www.gamewatcher.com/crusader-kings-3-feudal-contract-vassals).
- CK3 factions: [Dev Diary 19, factions and civil wars](https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-19-factions-and-civil-wars.1363951/); [Gamewatcher on factions](https://www.gamewatcher.com/crusader-kings-3-faction).
- EU4 estates: [Development diary, 13 August 2019](https://admin-forum.paradoxplaza.com/forum/developer-diary/eu4-development-diary-13th-of-august-2019.1231900); [Development diary, 10 March 2020](https://forum.paradoxplaza.com/forum/threads/euiv-development-diary-10th-of-march-2020.1352622/page-4).
- Victoria 3 laws and interest groups: [Dev Diary 80, law enactment](https://admin-forum.paradoxplaza.com/forum/developer-diary/victoria-3-dev-diary-80-law-enactment-and-revolution-clock-in-1-3.1577105/page-2); [Dev Diary 14, political movements](https://admin-forum.paradoxplaza.com/forum/developer-diary/victoria-3-dev-diary-14-political-movements.1490045); [TheGamer guide](https://www.thegamer.com/victoria-3-government-laws-reforms-institutions-elections/). The official page at paradoxinteractive.com could not be fetched from this session (its host is outside the allowed network).
- Bannerlord: [Kingdom decisions developer blog](https://www.gamebanshee.com/3whda); [Influence](https://www.gamerguides.com/mount-and-blade-ii-bannerlord/guide/introduction/useful-gameplay-tips/how-to-gain-influence); [Formations guide](https://gamerempire.net/mount-blade-2-bannerlord-battle-formations-guide/); [Battle tactics](https://www.gamerguides.com/mount-and-blade-ii-bannerlord/guide/introduction/useful-gameplay-tips/tactics).
- Total War: Three Kingdoms: [Army](https://totalwar.fandom.com/wiki/Army_(Total_War:_Three_Kingdoms)); [Retinue](https://totalwar.fandom.com/wiki/Retinue_(Total_War:_Three_Kingdoms)); [Wikipedia](https://en.wikipedia.org/wiki/Total_War:_Three_Kingdoms).
- Hearts of Iron IV: [battle planning and width](https://michaelkleen.com/2025/11/05/win-battles-against-the-ai-in-hearts-of-iron-iv-every-time-with-s-t-a-l-i/); [supply and support companies](https://earlyguides.pages.dev/hearts-of-iron-iv). Both are low-authority; the Ardan claims rest on its own code, not on these.
- Kenshi: [Toughness](https://kenshi.wiki/w/Toughness); [Martial Arts](https://kenshi.fandom.com/wiki/Martial_Arts); [player guide](https://kenshi.wiki/w/Imports:GlitchMaker%27s_General_Guide).
- RimWorld: [Mental break](https://rimworldwiki.com/wiki/Mental_break); [AI storyteller](https://rimworldwiki.com/wiki/AI_storyteller).
- Disco Elysium: [Thought Cabinet](https://discoelysium.wiki.gg/wiki/Thoughts); [skill checks](https://awkwardmixture.blogspot.com/2020/03/disco-elysium-skill-checks.html); [GameBanshee review](https://www.gamebanshee.com/3wx3h).
- King of Dragon Pass: [Sacred Time recap (Six Ages blog)](https://blog.sixages.com/index.php/2016/05/19/sacred-time-recap/); [Hardcore Gaming 101](https://www.hardcoregaming101.net/king-of-dragon-pass/); [A Sharp overview](https://a-sharp.com/kodp/overview.html).
- 80 Days, Pentiment, Persona, BitLife, Reigns, Hades and Dwarf Fortress: the sources gathered in `docs/reviews/cycle-1/design.md` (Sources), and what is known of the games.
