# 999998-goal-stack: one ordered stack of goals

**Aspect:** UI and UX, declutter (round 2 B5 part 2, CRITIQUE U20; D-055) · **Kind:** one readable core file (`a-goals.core.js`), test.

**Why.** A life had goals in five places that never agreed: What now (the release's three suggestions and 97's more), the ambition card (97), the chapter's aims (9993), Coming up (996: the promises made, the customs due, the next feast) and the Path's next step. They competed for the top of the Life page, said the same thing twice, and ordered themselves by nothing.

**What it does.** Each system keeps its own data and its own rules; this reads them and puts them in one order.

- `UI.GOALS.stack(pc)` returns the goals, highest score first, at most five (`UI.GOALS.MAX`): `{ kind, score, t, why, when, cls, act, go }`. Sources, each a function of the person: `now` (`A.whatNow`, with its own scores: health 100, the crown's debt 89, a career's choice 78, a work offer 70, finding work 55 ...), `ambition` (61), `chapter` (the open chapter's next aim, 52), `dated` (Coming up's `UI.COMING.items`: a promise 72, 88 within the month; a custom of the realm 68, 80 this month; a holy day 60; a feast 20). The same text is said once; "Let time run" only when nothing else asks for the time. `UI.GOALS.SCORE` is the one place the order is set; `UI.GOALS.source(name, pc => rows)` adds a source.
- `UI.GOALS.card(pc)` is the Life page's goals card, and it is `UI.whatNowCard`: the rows (a button where there is something to do, plain text where there is only something to know), with the chapter's own card (`.chp-card`: all its aims, and the choice of a third) after it, folded as before (9993's Life wrapper puts it there). The Coming up strip (996: `CU.strip` returns nothing while the stack is on) and the ambition card are no longer drawn on their own.
- The pure parts stay where they were: `UI.COMING.items`, `A.LF.ambOf`, `A.CH`, `A.whatNow`. Reading draws no dice and writes nothing.

**Not here.** The Path's next step is not a row of its own: the Path page keeps its promotion board and the chapter's "rise a rank in your trade" aim carries it; a rank's `specChoices` ("choose your arm of service") is already a What now line with a high score.

## Tests (`test.mjs`)

`gsOneCard` (four lives: one card, in score order, at most five rows, no strip or ambition card of their own, the chapter's card after it, drawing is pure) and `gsSources` (a promise, the ambition and a source registered by a feature come out in one order; said twice, once). The old strip's tests (`comingUpShows`, `comingUpPure`) read the card.

## Edits outside this folder

`src/ui/996-coming-up/coming.core.js` (`CU.strip` yields to the stack) and its test; `src/events/9993-life-chapters/chapters.core.js` (the chapter's card follows the goals card).
