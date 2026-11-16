# 01-stages: named stages for the hot functions

**Aspect:** Technical (X2, `docs/CRITIQUE.md` P3, P14; `docs/DECISIONS.md` D-056) · **Kind:** fix (applied in every build)

Features used to change a function by wrapping it in place (`const f0 = A.applyFx; A.applyFx = function () {...}`), so
`A.applyFx` had 32 definitions, `A.newGame` 22, `UI.render` 21, and what each did was whatever the folder names added up
to. Now seven functions have one definition each, the release's, and features add to them as **named stages**:

| Function | Stages |
| --- | --- |
| `A.applyFx` | 31 |
| `A.eventView` | 12 |
| `A.eventChoose` | 20 |
| `A.newGame` | 22 |
| `UI.render` | 20 |
| `UI.refresh` | 14 |
| `UI.renderModal` | 18 |

```js
A.addStage('A.applyFx', 'moods', next => function (pc, fx, ctx) { ...; return next.apply(this, arguments); }); // around
A.addStage('A.newGame', 'markets', { after(r, o) { ... } });   // after the inner stages; the return value is kept
A.addStage('UI.render', 'a11y', { before() { ... } });        // before them
A.addStage(['UI.render', 'UI.refresh'], 'fold', next => ...); // one stage on several functions
```

- **The manifest** (`manifest.core.js`, `A.FN_STAGE_ORDER`) gives each staged function's stages in order, innermost
  first. The order decides, not the folder names: a feature that loads earlier than its place still runs at its place.
  A new stage is added to the manifest where it should run.
- **A stage's name** is its feature's folder name without the number, then `.part` when the feature has more than one
  stage on the function (`first-life-fixes.hints`). The release has one stage, `journal`: the journal's recording
  wrapper, outermost on `A.newGame`, `A.eventView` and `A.eventChoose` (`A.journalStart`).
- **An around stage** (`next => function`) gets the function as the inner stages left it, so it may change the
  arguments, call `next` conditionally or return early, as a wrapper could. Every wrapper converted in X2 is an around
  stage, its body unchanged.
- **No extra cost.** The composed function is assigned back (`A.applyFx` stays a plain function), so reading it at any
  moment gives the stages registered so far, as reading it gave the wrappers so far. In the default build every stage
  registers in manifest order and wraps the one before, each made once in load order, exactly as the wrappers were.
- **A function that is not staged** (`UI.refreshTab`, `A.deserialize`, ...) is wrapped in place by `A.addStage`, in load
  order. It counts as a definition (below). To stage it, add it to the manifest.
- `A.FN_STAGES[key]` holds the base, the composed function and the stages; `A.stageList(key)` the names in order;
  `A.FN_STAGES_LOOSE` the stages on functions that are not staged.

## Held by

- `tools/lint-stages.mjs` (run by `tools/check.mjs`): a staged function assigned anywhere but its release definition,
  a stage name missing from the manifest, not starting with its feature's name or used twice, a manifest name nobody
  registers, and the count of names defined more than once (`tests/stages-baseline.json`, may only fall: 364 before
  X2, 357 after).
- At run time, `console.error` (which fails every test): a name missing from the manifest, a name used twice, a staged
  function reassigned outside `A.addStage`.

## Tests

`stagesOneDefinition`, `stagesApi` in `test.mjs`. Run them with `node tests/run.mjs --features=stages`.
