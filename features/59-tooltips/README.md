# Nested tooltips

**Aspect:** UI and UX (Road to Ten, UI and UX 2) · **Kind:** UI system, no patches, no events

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

**Limits.**

- **Not every screen.** The profile, the top bar, the full profile, the ruler's Realm tab, People and the moods card explain their numbers. The War room, Holdings prices, the Path tab's promotion bars and the event odds still use their own `title`s or tips. The glossary entries exist for some of them (reputation, treasury, opinion) and can be wired the same way.
- **Body is weighed, not simulated.** Each stat's share is what the release's rating gives for it at round 5 of a fight, fresh and unhurt. In a real fight, wind, wounds and situation move it.
- **Some forecasts leave the dice out.** Happiness (±4), stability (±3) and illness are shown before their random part, and the popover says so.
- **Opinion has no reasons.** The release stores one number per bond, not its causes. A list of reasons needs the engine to keep them (as `A.opinionParts` does for realms).
- **No player has used it yet.** Whether five levels is too many, and whether the wording reads quickly, is for the usability tests of UI and UX 8.
