# Nested tooltips

**Aspect:** UI and UX (Road to Ten, UI and UX 2; and the phone part of UI and UX 6) · **Kind:** UI system, no patches, no events

The plan asks: "Add nested tooltips. Every number and keyword shows its breakdown on hover or tap (fighting worth = body 34 + skill 41 + gear 18), and words inside the tooltip open their own." The benchmark row adds: "Fighting worth opens into body + skill + gear, each part opens again; the six stats explain themselves. Opens by hover, tap or Enter; Esc closes."

The release had five kinds of tooltip:

- native `title=` text on chips, buttons and rows (84 literal `title="` in the core blob);
- the stat tip (`UI.TIPS.stat`), which opened on the stat's name;
- the fighting-worth tip on the tier chip, two levels deep (worth, then body, skill or gear);
- the war map's province tip (`UI.wrTip`);
- `aria-label` text on icon buttons.

The two-level engine stopped at level 2. The body tip listed stats but did not add them up, and none of its words opened anything. On the profile of the test's life, 6 of its 18 numbers had a tooltip (the tier chip, and the five best proficiencies by their `title`).

**What it does.**

- **One engine, any depth** (`tt.engine.core.js`). `data-tt="key"` with `data-v="arg"` opens `UI.TIPS[key](arg)`. The release's `data-tip="key:arg"` anchors go through the same engine, so there is one stack and one set of listeners, delegated from `window`. It replaces `UI.tipsInit`, `UI.tipShow` and `UI.tipHide`, and keeps their names.
  - **Hover** opens. Moving into the popover keeps it open, and moving away closes what hover opened after 0.3 s.
  - **Click or tap** pins a popover. A click in a lower popover closes the ones above it, a click outside closes them all, and each popover has a × button.
  - **Enter or Space** on a focused trigger opens a popover and moves focus into it. Tab cycles through its links, Enter on a link opens the next level, and **Esc** closes only the top one and returns focus to the word that opened it.
  - Up to six levels. Each sits beside the one below it, or under its word when the screen is too narrow (375 px).
  - ARIA: the trigger is `role="button"` with `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls`. The popover is a non-modal `role="dialog"` labelled by its heading. A `role="tooltip"` may not contain links, and these do. Inside a modal, the popover joins the modal so the screen reader and the modal's focus trap still reach it.
  - Redraws keep the stack: when the clock repaints the top bar or the profile, each open popover is pointed at the redrawn copy of its word, and focus on a trigger comes back to it.
- **A glossary computed from the live game** (`tt.glossary.core.js`). Where a number is a sum, its rows add up to it.
  - **Fighting worth** is body + skill + gear, with the tier and the points to the next one.
    - **Body** splits into strength, speed, instincts and will, each by what it adds to the release's own rating (`A.CR`). Stamina is listed at ±0, because it sets wind, not blows. Then bare hands, and the frame of your people (an orc's late-fight penalty, for example).
    - **Skill** splits into the weapon skill (with 30% of melee) and perks, techniques and style.
    - **Gear** splits piece by piece, in the order you put it on.
  - **Each of the six stats** is trained value × age, plus traits, wounds and build, less 8% when weary. It names what the stat feeds ("fighting worth ×0.2", "health: mends ⅕ of it a year", "charm ×0.3"), and its potential opens too.
  - **Health:** the most you can have (100, less old age), what each new year mends (30 + stamina ⅕ + perks + living), and this year's chance of falling ill. That chance has its parts: 7% base, +4% for crowded work, +6% in a camp at war, ×0.6 robust, ×0.25 for an elf.
  - **Happiness:** next year's drift toward 55, your living, debt, and, with 35-moods in the build, the needs' monthly pull and the mood.
  - **Charm:** int ×0.3 + looks ×0.35 + diplomacy ×0.4 ± traits.
  - **Renown:** what a deed of 10 gives at your renown, and what renown feeds.
  - **Also:** looks, honor, piety, faith, people (adult, old and last ages), stages of life, age, the date, and initiative (free days by stage, war and blood; refill per month).
  - **Coin and living:** a year's spending, with the army's half, prison's tenth and each child at home. The five ways of living with their costs.
  - **Each skill:** what was practised, wound penalties, aptitude, the perks unlocked and the next one. Proficiency tiers.
  - **Fighting tiers:** Untrained to Legend, with their ranges. Traits with their stat effects, plus 49-body-mind's reason when that feature is in the build. Quirks, blood, house, reputation.
  - **Each wound:** what it takes from each stat, from looks and from skills, what it costs in fighting worth, and when it heals.
  - **Opinion** of a person: yours of them and theirs of you, with the bond and the year it began. The release keeps only the number, so the popover says so.
  - **The realm:** stability (next year's change by its parts: taxes, chaplain, weariness, debt, legitimacy, war, economy law; or, for a realm you do not rule, where it settles), legitimacy, war weariness, infamy, and the treasury (a year at this pace: income at this stability with the treasurer, upkeep, interest, court).
  - **Needs and moods** (only when 35-moods is present): where each need settles, and why.
- **Wired in with small wrappers** (`tt.wire.core.js`). Each wrapper adds triggers to the HTML the original returns, by string insertion, and returns that HTML unchanged on any error:
  - the profile (`UI.renderProfile`, which is also the phone's You page): the six bars and their numbers, each stat's number, each wound in 49-body-mind's body view, the trait, quirk, faith, people and blood chips (each keeps its `title`, where 49-body-mind writes a trait's reason; the engine lifts the title while the popover is open, so the browser does not show it twice), and the best proficiencies;
  - the top bar (`UI.clkHtml`, `UI.renderTop`): the date and age, initiative, coin and debt;
  - the full profile (`UI.profileModal`): the stat bars and the renown, honor and piety line;
  - the Realm tab for a ruler (`UI.realmTabBasic`): treasury, stability, legitimacy, war weariness, infamy;
  - People: each opinion bar (on hover only: the card itself is a button, and a tap opens the person);
  - the "How you are" card of 35-moods.

  Titles elsewhere stay as they were.
- **The look:** a small panel of the binding, in the style guide's leather and gold. It has gilt corner brackets like the main panels, Cinzel headings in gold and Alegreya text, and a sum rule under the parts. In the light theme it is vellum with iron-gall ink and an ochre heading (gold fails contrast on vellum). It inks in over 0.14 s, and not at all under reduced motion.

**Measured by** (`test.mjs`, on a build of the fix layer plus 27-accessibility, 61-illumination, 62-inked-map and this feature).

| Test | Result |
| --- | --- |
| `ttCoverage` | Numbers with a tooltip on the profile: **before 6 of 18, after 18 of 18**. Top bar: 10 of 10 before (the release's `title`s) and after |
| `ttNestedKeyboard` | Enter on the tier chip opens level 1 with focus inside; Tab to Body, Enter: 2; Tab to Strength, Enter: 3; Tab to its potential, Enter: 4. Esc three times: 3, 2, 1, with focus back on the word that opened each; then all closed and focus on the chip |
| `ttInModal` | In the full profile (a modal dialog), Enter on a stat opens a popover inside the dialog; two Tabs keep focus in it; Esc closes the popover and leaves the dialog open |
| `ttNestedClick` | Click opens 1, 2, 3 deep; a click in the first closes the two above it; outside closes all. Hover on the health number opens it, hover on its Stamina link opens level 2, moving away closes both. With 3 open, Esc leaves 2 |
| `ttPhoneTap` | At 375 × 740 with touch: taps open 1, 2, 3; all three inside the screen; the × closes one; a tap outside closes all; no sideways scroll |
| `ttWorthSums` | On the chip, worth 45 = body 33 + skill 0 + gear 12, which equals the popover's rows (45) and its total (45). In 101 people, body + skill + gear = worth in all. The largest rounding row is 2 points for body, 0 for skill, 0 for gear, and 1 for stats |
| `ttPure` | Three lives (a peasant, a noble made ruler, an old elf): 213 to 220 entries each (every key, every argument), and 80 triggers opened two deep. State and random stream unchanged in all three |
| `ttAxe` | With three popovers open, axe-core (WCAG 2.2 AA and best practice) finds 0 violations in the dark theme and 0 in the light |

On the full build (all 56 features at the time), the same tests pass. The numbers move with the other features: the profile shows 19 numbers, 6 covered before and 19 after (49-body-mind's wound line, with its healing year, is the 19th). The worth chip shows 26 = body 27 + skill 0 + gear −1: heavy gear on a weak body costs worth, and the popover shows that too. Across 201 people, the largest rounding row is 1. 49-body-mind's `bodyMindRenderPure` and 35-moods' tests still pass with these wrappers on top.

**Rules kept.**

- Rendering is pure. Entries only read; the rare helper that writes lazily (`A.jobRep` sets `job.rep`) is read around, not called. `ttPure` checks this.
- Every value goes through `UI.esc`. Triggers carry no inline handlers: one delegated listener of each kind sits on `window`.
- No new state, so old saves load unchanged. The CSS is one `<style>` element, as 61-illumination's is.
- Other features' tips are kept and wrapped, not replaced. 49-body-mind's stat note still shows under the new breakdown.

## Part two: every other screen

The first part left the War Room, Holdings, the Path tab, the event odds, the duel and battle screens, the Codex, the Realm tab of one who does not rule, and the phone to their plain `title`s. Part two explains their numbers the same way: about 100 new entries, each worked out from the live game, and wired into those screens.

**What it explains** (`tt.more-*.core.js`; `tt.kit.core.js` holds the shared helpers):

- **The odds of a choice** (`odds`). "38% · risky" opens what makes it, in points that add up to the number on the button:
  - a check: an even test (50), then each skill or stat against the difficulty (60% and 40% when there are two; "untrained: your stats lend 4 + 30% of their average", or "from Diplomacy" when a related skill stands in), the scene's own weight (30-get-to-know's `dctx`), the bounds (4% to 96%), and what 67-memory-weave adds when the scene remembers an earlier one. Each stat and skill opens its own breakdown, so traits and wounds are one level down.
  - a fight (48-fight-ladder): the chance in steps from even odds, each row what it moved: the worths ("you, Trained 53, against one Brawler 46: +27"), the rules (to yield, to the death, a brawl), both sides' health, a weapon the foe draws, the bounds. A beast: your worth against its mark.
  - A fight against many has no parts (it is side against side), so the popover names the sides and says so.
  - On Realism (42-difficulty) no digit appears: each row says "helps", "hurts a great deal" and so on.
  - The odds are a tap target inside the choice: a tap on "38% · risky" opens them, and the choice waits for a tap on its words. By keyboard, Right arrow on a choice opens its odds, and Esc brings focus back to the choice.
  - A cost in a choice's words ("(3 suns)") opens your coin and what is left after it.
- **The duel** (`duelOdds`, `duelSide`, `duelBlood`, `duelWind`, `duelRead`, `duelAdapt`): the measure in steps (worths, rules, blood on both sides, a drawn weapon); each fighter; "Your instincts (26% sure)" as 30 + training + instincts against theirs + the same school + what you have learned in this fight.
- **The battle** (`bSide`, `bMorale`, `bWing`, `bDead`, `aarCause`, `bPulse`, `bScale`, `drill`): each side's standing men wing by wing (they add up), morale unit by unit, the dead and where they fell, each after-action cause as 23-after-action counts it, and 60-drill's drill notes.
- **Holdings** (`worthAll`, `debt`, `gearSlot`, `shopItem`, `mktPrice`, `cargo`, `transport`, `mtRoad`, `mtCart`, `tradeRun`, `runRisk`, `runPlan`, `prop`, `purseTotal`, `purseLine`):
  - everything you own (coin, holdings and gear at cost: a sum);
  - each piece you carry and each piece in the armorer's table: its stats at that quality, what it does to your fighting worth, and its price as list price × quality × iron and steel (or horses) in your market;
  - each market price as the realm's price × the dealer's cut × the town's own store against its need (66-markets), with your trade skill and factor behind the cut, and the stock in months of need;
  - the nearest towns' roads, carting (whichever is more: a share of the load's worth, or the mules and inns of the road) and prices there; the trade roads' margin, days and danger; a planned run's net (sale − tolls − guards − carting);
  - each holding's income, upkeep and years to pay for itself;
  - 56-realm-inside's "Where the money goes": each line, and "All told" as their sum.
- **The Path tab** (`jobOdds`, `career`, `pay`, `perf`, `board`, `promoOdds`, `merit`, `milRank`, `school`): the odds of being taken on, step by step (55, stat against 40, skill ÷ 2, letters, the bounds); each career's ladder and pay; your pay as rank × performance × reputation × the rest; performance and where it settles; each row of a promotion board with its bar; the army's yearly promotion chance as 50% × each unmet row × the merit over the bar, plus your superior's word.
- **The War tab and the War Room** (`divStr`, `divMen`, `divOrg`, `divEq`, `divExp`, `divSup`, `divStat`, `tplStat`, `army`, `armyOrg`, `armyPlan`, `armySup`, `temper`, `genSkills`, `host`, `manpower`, `training`, `trainCost`, `industry`, `line`, `build`, `buildKind`, `econLaw`, `doctrine`, `prov`, `fight`, `warScore`, `warFront`, `oob`, `orderPow`, `orderTraits`, `orderReq`, `divRecord`, `divIntel`, `staffFit`, `drillShare`, `drillCap`):
  - each figure of a division's stat grid as the template's battalions × kit × experience × the realm's army × the general's tactics or command × doctrine × drill × an order's edge (a product), its organization ceiling, its men battalion by battalion (a sum), its kit, experience and supply;
  - a template's figures battalion by battalion; an army's organization, planning and supply; its general's temper (38-orders) and the traits that made it; the host, the pool, the drill yards and the cost of training; the forges and the building queue; a province; a fight on the map; the war score; the order of battle; the elite orders' power (a sum of their division's figures) and what it takes to join; 60-drill's drill yard.
- **The Realm tab when you do not rule** (`facPower`, `facDisc`, `loyalty`, `loyaltyAll`, `courtOdds`, `crownBook`, `rung`, `rungs`, `custom`, `feud`, `rulerOp`): a faction's power (its houses' swords against the realm's, plus 56's council backing) and discontent; each great lord's loyalty; 56's court odds reason by reason (they add up); the crown's purse line by line; the rungs; 47-realm-bible's customs as you have met them; 55-bonds' long memories, halving with the years.
- **The Codex and the Dynasty page** (`crowd`, `takeLine`, `census`, `dynasty`, `endings`, `achs`, `ach`): the ladder's ranges, one against many by tier, your own "can take", 32-ladder's census of Legends and Masters; the dynasty's line, endings and achievements.

**Wired in** (`tt.wire2.core.js`). As in part one, each wrapper adds triggers by string insertion and returns the HTML unchanged on any error. These wrappers are installed when the game starts (at `UI.init`), after every feature's code has run, so they wrap each screen as the last feature left it, and a feature missing from the build only leaves its markers out. Where an outer function reads an inner one's markup (`UI.wrDivPanel` reads `UI.wrDivPanelBasic`'s), the outer one is wrapped. A number inside an action (a card that opens, a row that selects) answers to hover only; the tap and the click stay the action's. Holdings' button-only columns get a header word (Buy, Trade, Go, Plan), which axe asked for.

**Measured by** (`test.mjs`, part two; on the full build, all 65 features at the time, and on a build of the fix layer plus 27-accessibility, 61-illumination, 62-inked-map, 71-phone and this feature).

A number is a numeric token in a screen's text. Not counted: prose (a block of 12 or more words that holds a sentence, or a running log: the battle's and the duel's, the chronicle, an event's text), years (a lone 700 to 1299), ordinals, codes such as POL-01, keyboard hints, and quantity buttons (+1, +5, a speed button). A number is covered when it sits in a trigger of the engine; a plain `title=` does not count. "Before" is the same screen with the wiring off.

| Screen (full build) | Numbers | With a trigger, before | After |
| --- | --- | --- | --- |
| War tab, an enlisted soldier at war | 47 | 0 | **47 (100%)** |
| War tab, a ruler at war | 34 | 0 | **34 (100%)** |
| War Room, Command / Forces / Wars (soldier) | 5 / 15 / 1 | 0 | **100%** each |
| War Room, Command / Forces / Templates / Industry / Manpower / Wars (ruler) | 6 / 8 / 41 / 42 / 13 / 5 | 0 | **100%** each |
| War Room panels: your division, a division, an army, a province | 31, 32, 13, 16 | 0 | **100%** each |
| War Room: a fight on the map (fix-layer build, where one was raging) | 35 | 0 | **34 (97%)** |
| Holdings: a peasant, a noble, a merchant, a trade run planned | 277, 278, 281, 290 | 0 | **100%** each |
| Path: a peasant, a noble, a merchant, a soldier | 74, 87, 87, 77 | 0 | **100%** each |
| 25 events with odds (checks and fights) | 50 | 0 | **50 (100%)** |
| The duel | 7 | 1 (48-fight-ladder's worth chip) | **7 (100%)** |
| A battle: deployment, midway, the end | 10, 15, 12 | 0 | **100%** each |
| Realm tab, not ruling: a commoner, a noble | 53, 44 | 0 | **100%** each |
| Codex, Power & scale (two lives) | 84, 83 | 0 | **100%** each |
| Dynasty (two lives) | 14, 14 | 0 | **100%** each |

On the fix-layer build (fix layer, 27, 61, 62, 71 and this feature) every screen is 100% as well but the fight (97%: one day count), with fewer numbers where features are missing (Holdings 232 to 241, events 39 numbers in 24).

| Test | Result |
| --- | --- |
| `ttCov2War`, `ttCov2Hold`, `ttCov2Scenes`, `ttCov2Realm` | The table above. Bar: each screen at least 90% and not empty, and 150, 1,000, 60 and 120 numbers in all |
| `ttSums2` | Against the engine's own number, on the full build: 152 check odds (largest gap 1 point, from rounding the rows), 60 fight odds (1), 28 of them moved by a memory (67-memory-weave), 90 popovers whose rows add to their total (0), 30 duel measures (1), 30 instinct reads (0), 90 hiring odds (1), 6 money books whose lines add to "All told" (0), 102 courts' odds (0) and crown purses (0), 123 factions' power (0); products: 126 market prices and 1,164 armorer's prices rounded as shown (0), 100 division figures (0 to a millionth), 20 organization ceilings, 12 template figures. No case needs an "other things in play" row |
| `ttNested2` | Holdings: a market price (1) opens the trade skill behind the dealer's cut (2), which opens the proficiency tiers (3); a click outside closes all. War Room: a division's organization (1) opens its general (2). An event: a tap on "N% · word" opens the odds (1) and the choice is not taken; the stat (2); its potential (3). Right arrow on the choice opens its odds with focus inside; Esc gives focus back to the choice; still not chosen |
| `ttPure2` | 21 screens (Holdings, Path, Realm, Dynasty, Codex, 6 events, the duel, a battle, the War tab, every War Room tab, a division), 3,239 popovers opened one and two deep: state and random stream unchanged on every one |
| `ttAxe2` | Two popovers open on the War Room, on Holdings and on an event, dark and light: 0 axe violations (WCAG 2.2 AA and best practice) |
| `ttPhone2` | With 71-phone at 375 × 740 by touch: a price and its skill open by tap, both inside the screen; × closes one, a tap outside the rest; a tap on a choice's odds opens them and the choice waits; a number in the War tab opens; no sideways scroll. 71-phone's own `phoneTargets` (every glossary word at least 24 px), `phoneNoOverflow` and `phoneAxe` pass with part two on |

Lore pages of the Codex (faiths, bloodlines, songs, secrets, families) and the World tab are not in the table: their numbers are the lore's own facts and the world's records in sentences and lists, and they are left as they were.

**Limits.**

- **Lore and the World tab are not wired.** The Codex's lore pages and the World tab's views (the realm list, the news, the annals, the history) keep their plain text. The realm list's columns could be wired with the realm entries that exist.
- **Some numbers are counted as prose and still wired.** The duel's measure ("…about 30 times in 100") and your instincts' read sit in sentences, so the count leaves them out, but they open their breakdowns.
- **A number inside an action opens on hover only** (an army row, a division row, a person card, a cost in a button): a tap stays the action's. The choice's odds are the one exception, a tap target of their own.
- **Some breakdowns are products or steps, not sums.** A price and a division's figure are products, each factor a row; a fight's chance is a curve, split into steps from even odds, each row what it moved the chance. The steps add up to the number shown; their order is fixed (worth first), and another order would split the same total differently.
- **A fight against many, a group check and the war score have no parts.** The first two are side against side; the war score is a running tally the engine keeps without its history. Their popovers name what they rest on.
- **A faction's power on its card is last new year's.** The popover reckons it today and says so when the two differ.
- **Body is weighed, not simulated.** Each stat's share is what the release's rating gives for it at round 5 of a fight, fresh and unhurt. In a real fight, wind, wounds and situation move it.
- **Some forecasts leave the dice out.** Happiness (±4), stability (±3), loyalty (±2) and illness are shown before their random part, and the popover says so.
- **Opinion has no reasons.** The release stores one number per bond, not its causes. A list of reasons needs the engine to keep them (as `A.opinionParts` does for realms).
- **No player has used it yet.** Whether five levels is too many, and whether the wording reads quickly, is for the usability tests of UI and UX 8.
