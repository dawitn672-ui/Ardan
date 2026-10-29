# 9998-stakes: every choice says what it stakes

**Aspect:** UI and UX, clarity (cycle 2 design review item 2 and C1; backtests #5 "readable stakes" and #6 "white and red checks") · **Kind:** system: three readable core files, no patches, no events, plus an edit to `92-scene-card` (which this lane owns), a test file and a measure script.

## Why

The design review found choices hiding their stakes. "Strip the dead for loot 94%" looks free. The 14 bill buttons, the oaths and the 170 road rows say nothing about what they do. Event choices said a little:
- 97-life-fixes' line gave a coin cost and "If it fails: ...";
- 92-scene-card gave at most two hints, for plain object effects with no check.

Over 400 scenes of real lives, **61.5%** of the choices that change something said what they stake, and **72%** of checks said what failing costs. A choice the release hides because you can't meet it (a `req`) just vanished, with no reason.

## What it does

### 1. One grammar of chips, read from the choice as written (`stakes.a-read.core.js`)

Every event choice carries one row of short chips under its label:

| Chip | Means | Example |
| --- | --- | --- |
| cost | a sure loss | `Costs 30 suns`, `▼ honour`, `a wound` |
| gain | a sure gain | `+6 suns`, `▲ their regard`, `▲ Persuasion, Tactics` |
| win | a check that works | `If it works: ▲ renown` |
| risk | a check that fails (97's words) | `If it fails: hurt, −5 suns, their regard` |
| safe | a check that costs nothing when it fails | `Nothing lost if it fails` |
| touch | an effect written as code: what it touches, never which way (Reigns) | `• coin`, `• their regard` |
| fight | the choice starts a fight (89's badge gives the odds) | `Starts a fight` |

- **Size, as Reigns' dots:** a large change has a double mark (`▲▲`, `▼▼`). Each family has its own threshold (`A.STAKES.KEYS`): honour 5, spirits 8, health 10, regard 20.
- **At most three effect chips** a row, ordered by weight: life and liberty, then health, coin, bonds, standing, honour and renown, spirits, skills and stats.
- **Labels that name a price** ("Pay 30 suns") don't get the cost twice. That is 97's rule.
- **Hidden things stay hidden.** Flags, queued events, secrets, traits, deeds, epithets and schemes are never chips. A function effect shows only which families it touches, read once from its source (as 89 reads a fight), and never the direction. The odds setting is respected: with numbers off, the "Again" chip and the lock reasons drop their numbers.
- **The row is 97's row.** It keeps the `.lf-stake` class and 97's words, and 97's own line steps aside while this one is on (`LF.STAKES_OFF` reads `A.STAKES.on()`). 92's two hints also give way.
- **Every chip explains itself** through 59-tooltips. A coin cost opens 97's purse popover. Every other chip opens `stChip`: what kind of stake it is, and the chance of a win or a fail when the numbers are on.

### 2. White and red checks (`stakes.b-checks.core.js`), Disco Elysium's rule

- **Red** means one chance. A check is red when:
  - its scene comes once in a life (`once: true`), or the choice is `once`;
  - or failing it costs something that lasts: death, prison, a wound, exile or disowning (`lose.fx` as written, or the same words in a function effect);
  - or it is a lethal fight.

  The card gives it 92's danger edge and a **ONE CHANCE** tag. A failed red check is never offered again ("You failed this in 1112. It does not come again.").
- **White** is every other check. Its check chip carries a small ↻ ("can be tried again"). A failed white check is remembered with the value the roll was made from (`A.checkVal`). In that scene it is held back until the value has risen 5: "Not yet: you failed this in 1112. Grow 5 more in Persuasion and Willpower to try again." It then comes back with **"Again: you are better at this now (+7 since 1112)"**. A success forgets it.
- **Where the memory lives:** `pc.retry["event:choice"] = { v, y }`, or `{ y, red: 1 }`. It is a new field, so an old save has none and nothing is locked. At most 160 entries are kept, and the oldest go first.
- **A scene always keeps one choice.** A check is held back only while another choice remains.
- **Deterministic.** The holding back happens when the view is built (`A.eventView`, fresh views only), from the state alone. Nothing draws a number.
- **In the build** (5,456 events): 4,315 white and 1,707 red checks. The red ones are 1,223 once-in-a-life, 440 wounds, 37 prison and 7 deaths.

### 3. A choice out of reach says why

A choice the release hides because its `req` fails is shown greyed after the choices, with its reason, **when the req is a goal you can work towards**. `A.STAKES.parseReq` reads a req only when every part of it is one of these thresholds:

- coin: `p.coin >= 40`, or `p.coin >= (ctx.fee || 30)`;
- letters;
- a skill (`C.prof`);
- renown;
- a weapon, bow or horse;
- a rank in your work;
- the treasury;
- a nature (`C.trait`), joined by `||` or by `&&`.

The rows read like this:
- "Needs 40 suns (you have 12 suns)";
- "Needs reading and writing, or Stewardship 60 (you have 0)".

Everything else stays hidden as the release hid it: a flag, a kinsman, the scene's context, a marriage, a helper function. Those belong to the story, not to a goal you can reach.

The locked rows are rows, not buttons. Keys 1–6 and the number badges count only what can be chosen. Each reason is a 59 trigger (`stLock`).

### 4. The hook (for lanes P, WD and the rest)

```js
A.STAKES.add('poPropose', (v, pc, el) => [{ k: 'cost', t: '−200 suns' }, { k: 'gain', t: '▲ the commons' }]); // chips inside <button data-a="poPropose" data-v=v>
A.STAKES.why('jrGo', (v, pc, el) => tooFar(v) ? 'Too far for your purse: 399 days, 120 suns' : '');           // a disabled control's reason (joins 97's LF.WHY)
A.STAKES.add('choice', (c, e, q, pc, vc) => [...]);   // extra chips on an event choice (advisors' counsel, say)
A.STAKES.fx(fxObject) / A.STAKES.read(fx)             // any screen's own effect data, read in the same grammar
A.STAKES.html(chips)                                  // the chips as escaped markup
```

- After every draw, `A.STAKES.decorate()` puts a chip row in each `[data-a=kind]` button. It never decorates a button twice.
- **Registering early.** A feature that loads before this one (9996 and 9997 sort first) registers through a queue: `(A.STAKES = A.STAKES || {}).pre = (A.STAKES.pre || []).concat([['add', kind, fn]])`.
- `ST.KEYS` is the vocabulary. A new effect key adds one row there.

## Measured by

Run `node features/9998-stakes/measure.mjs <built.html> --lives=8 --events=50` on any build, with or without this feature. It plays 8 starts (peasant, noble, merchant, soldier-age, ruler-age, child, elf, orc), draws every scene the player meets (`UI.render`, the scene card included) and lets the bot choose.

| 400 scenes of 8 real lives | Before (full build without 9998) | After |
| --- | --- | --- |
| Choices that change something and show their stakes | MEASURE_BEFORE_ACTIVE | MEASURE_AFTER_ACTIVE |
| All choice rows with stakes | MEASURE_BEFORE_ALL | MEASURE_AFTER_ALL |
| Checks that say what failing costs | MEASURE_BEFORE_FAIL | MEASURE_AFTER_FAIL |
| Hidden choices (req) met, drawn with a reason | 0 of MEASURE_HIDDEN_B | MEASURE_HIDDEN_A |
| Red / white checks marked | 0 / 0 | MEASURE_RW |
| Drawing changed the random stream | no | no |

Over every event in the build (engine side, `ST.choiceChips`), 94% of the 16,221 choices with an effect get at least one chip. What's left is mostly function effects that touch nothing a player sees (an epithet, an enlistment, a helper) and object effects that change only hidden things (traits, flags).

| Test | What it holds |
| --- | --- |
| `stChips` | A planted scene. The cost (`Costs 30 suns`), a large and a small gain, "If it works: +4 suns, ▲ renown", 97's words for a fail ("If it fails: hurt, −5 suns, their regard"), "Nothing lost if it fails", a wound. A flag, trait and event choice shows nothing. A function effect shows `• honour`. Drawing twice leaves the state and the random stream alone |
| `stDotsMatchFx` | Backtests #5 `dotsMatchFx`. Over 8,084 plain choices in the build, no chip names a family the effect doesn't change, and no changed family lacks a chip (up to the row's three) |
| `stWhiteRetry` | Backtests #6 `whiteRetry`. A white check, failed: remembered with its value, held back with its reason, still held back at +3, back at +5 with "Again: you are better at this now (+6 since …)", forgotten on a success |
| `stRedMarked` | Backtests #6 `redMarked`. Every check of every event is classed by the rule (1,707 red, 4,315 white, 0 wrong). A red one is drawn ONE CHANCE, and once failed it is gone for good, even 30 stronger |
| `stLockedWhy` | "Needs 400 suns (you have 12 suns)", "Needs reading and writing, or Stewardship 60 (you have 0)". A flag gate stays hidden. Both open once reached. The reader takes the release's thresholds and leaves story gates alone |
| `stRegistry` | A registered kind's buttons get their chips once. A registered reason becomes a disabled button's title through 97's pass. A `choice` adder's chip reaches the card |
| `stInLives` | 90 scenes of three lives. At least 90% of choices that change something show stakes, every check says what failing costs, every draw is pure, and an old save with no retry memory plays on |

These also pass with the feature on: 97's `lfStakes` (its words and its two lines, now drawn by this row), 92's scene card tests, 71's phone tests, 59's tooltip coverage, and 01's `renderRng` and `replayWithRender`.

## Rules kept

- **Pure drawing.** The chips and reasons read the written event, the view, the player and the scene's context. The one engine change (holding back a failed check, recording a failure) runs inside `A.eventView` and `A.eventChoose`, from the state, with no draws.
- **Escaped.** Every value goes through `UI.esc`. There are no inline handlers.
- **Old saves.** `pc.retry` and `v.locked` may be missing.
- **Switch:** `A.STAKES.OFF = true` or `UI.set.stakes = false` gives back 97's line and 92's hints. White and red locking stops too.

## Limits

- **Function effects show families, not direction.** "• coin" may be a gain or a loss. Rewriting the effects as objects (or `A.STAKES.add('choice', ...)` for one event) would tell more.
- **Only a check rolled on the two-stat value is held back.** A group fight or a duel check is white without the lock, because its odds don't come from a value that can be said to rise by 5.
- **Not done here** (the hook is for their owners): battle moves (`mChoose`, lane WD), bills and oaths (`poPropose`, `poOath`, lane P), the road (`jrGo`, 9990) and the duel's intents.
- **Proposed, not built:** the backtests' lint rule (a red check's losing branch must set a flag, queue an event or change a bond) is a change to `tools/`. So are passive checks (`passive: {s, d}`), which need a voice line from 9992.
