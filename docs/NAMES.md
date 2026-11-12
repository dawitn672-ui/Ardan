# Old names and new names

*Stamped 2026-11-12 11:23 ET · the naming pass (work item X6, owner order 20) · written by `tools/rename-pass.mjs` from `tools/rename-map.json`; do not edit by hand*

Old notes (docs/HISTORY.md, CHANGELOG.md, docs/VERSIONS.md, archive/, reports and branches made before the pass) keep the names they were written with. Look an old name up here to find the file today. A feature's short name (the words after its number) changed with its folder, so `--only=`, `--without=`, `--features=` and `--feature=` take the new short name.

The renames kept the build exactly as it was: feature folders keep their numbers and sort in the same order, and the files inside a feature sort in the same order. Test names, `A.*` and `UI.*` names, event ids, `vendor/`, `archive/` and git branches were not renamed.

## Feature folders (41)

| Old | New | Renamed |
| --- | --- | --- |
| `src/core/05-saves-ui` | `src/core/05-saves-and-keyboard` | 2026-11-12 11:23 ET |
| `src/core/08-coherency` | `src/core/08-coherency-checks` | 2026-11-12 11:23 ET |
| `src/core/09-scale` | `src/core/09-engine-at-scale` | 2026-11-12 11:23 ET |
| `src/core/88-queue-head` | `src/core/88-skip-dropped-events` | 2026-11-12 11:23 ET |
| `src/core/99990-v2` | `src/core/99990-v2-engine` | 2026-11-12 11:23 ET |
| `src/diplomacy/68-casus-belli` | `src/diplomacy/68-reasons-for-war` | 2026-11-12 11:23 ET |
| `src/events/29-starts` | `src/events/29-starting-stories` | 2026-11-12 11:23 ET |
| `src/events/33-choices` | `src/events/33-no-obvious-choices` | 2026-11-12 11:23 ET |
| `src/events/54-voices` | `src/events/54-character-voices` | 2026-11-12 11:23 ET |
| `src/events/67-memory-weave` | `src/events/67-choice-memories` | 2026-11-12 11:23 ET |
| `src/events/80-callbacks` | `src/events/80-orphan-flag-callbacks` | 2026-11-12 11:23 ET |
| `src/events/83-obituary-caps` | `src/events/83-obituary-capitals` | 2026-11-12 11:23 ET |
| `src/events/87-echoes` | `src/events/87-echo-scenes` | 2026-11-12 11:23 ET |
| `src/events/97-life-fixes` | `src/events/97-first-life-fixes` | 2026-11-12 11:23 ET |
| `src/events/9993-chapters` | `src/events/9993-life-chapters` | 2026-11-12 11:23 ET |
| `src/events/9998-stakes` | `src/events/9998-choice-stakes` | 2026-11-12 11:23 ET |
| `src/map/70-fresh-realms` | `src/map/70-fresh-realms-and-tensions` | 2026-11-12 11:23 ET |
| `src/map/9991-atlas` | `src/map/9991-atlas-of-known-places` | 2026-11-12 11:23 ET |
| `src/nobility/56-realm-inside` | `src/nobility/56-court-and-treasury` | 2026-11-12 11:23 ET |
| `src/people/24-honest-odds` | `src/people/24-honest-duel-odds` | 2026-11-12 11:23 ET |
| `src/people/32-ladder` | `src/people/32-legend-and-master-caps` | 2026-11-12 11:23 ET |
| `src/people/41-circles` | `src/people/41-friend-circles` | 2026-11-12 11:23 ET |
| `src/people/48-fight-ladder` | `src/people/48-event-fight-rules` | 2026-11-12 11:23 ET |
| `src/people/69-live-numbers` | `src/people/69-every-number-counts` | 2026-11-12 11:23 ET |
| `src/people/998-people-want` | `src/people/998-npc-wants` | 2026-11-12 11:23 ET |
| `src/ui/59-tooltips` | `src/ui/59-descriptions` | 2026-11-12 11:23 ET |
| `src/ui/61-illumination` | `src/ui/61-illuminated-chronicle` | 2026-11-12 11:23 ET |
| `src/ui/63-miniatures` | `src/ui/63-miniature-portraits` | 2026-11-12 11:23 ET |
| `src/ui/73-score` | `src/ui/73-music-score` | 2026-11-12 11:23 ET |
| `src/ui/86-title-fold` | `src/ui/86-title-screen-in-view` | 2026-11-12 11:23 ET |
| `src/ui/90-fold` | `src/ui/90-collapsible-sections` | 2026-11-12 11:23 ET |
| `src/ui/91-look` | `src/ui/91-visual-style` | 2026-11-12 11:23 ET |
| `src/ui/96-moments` | `src/ui/96-big-moments` | 2026-11-12 11:23 ET |
| `src/ui/98-feedback` | `src/ui/98-action-feedback` | 2026-11-12 11:23 ET |
| `src/ui/9994-share` | `src/ui/9994-share-a-picture` | 2026-11-12 11:23 ET |
| `src/war/34-both-scales` | `src/war/34-squad-and-front-panels` | 2026-11-12 11:23 ET |
| `src/war/37-squad` | `src/war/37-named-squad` | 2026-11-12 11:23 ET |
| `src/war/60-drill` | `src/war/60-unit-drill` | 2026-11-12 11:23 ET |
| `src/war/72-two-scales` | `src/war/72-one-battle-two-scales` | 2026-11-12 11:23 ET |
| `src/world/26-belief-truth` | `src/world/26-belief-versus-truth` | 2026-11-12 11:23 ET |
| `src/world/47-realm-bible` | `src/world/47-realm-customs` | 2026-11-12 11:23 ET |

## Files inside features (13)

| Old | New | Renamed |
| --- | --- | --- |
| `src/ui/59-tooltips/tt.engine.core.js` | `src/ui/59-descriptions/descriptions.engine.core.js` | 2026-11-12 11:23 ET |
| `src/ui/59-tooltips/tt.glossary.core.js` | `src/ui/59-descriptions/descriptions.glossary.core.js` | 2026-11-12 11:23 ET |
| `src/ui/59-tooltips/tt.kit.core.js` | `src/ui/59-descriptions/descriptions.kit.core.js` | 2026-11-12 11:23 ET |
| `src/ui/59-tooltips/tt.more-money.core.js` | `src/ui/59-descriptions/descriptions.more-money.core.js` | 2026-11-12 11:23 ET |
| `src/ui/59-tooltips/tt.more-odds.core.js` | `src/ui/59-descriptions/descriptions.more-odds.core.js` | 2026-11-12 11:23 ET |
| `src/ui/59-tooltips/tt.more-path.core.js` | `src/ui/59-descriptions/descriptions.more-path.core.js` | 2026-11-12 11:23 ET |
| `src/ui/59-tooltips/tt.more-realm.core.js` | `src/ui/59-descriptions/descriptions.more-realm.core.js` | 2026-11-12 11:23 ET |
| `src/ui/59-tooltips/tt.more-war.core.js` | `src/ui/59-descriptions/descriptions.more-war.core.js` | 2026-11-12 11:23 ET |
| `src/ui/59-tooltips/tt.note.core.js` | `src/ui/59-descriptions/descriptions.note.core.js` | 2026-11-12 11:23 ET |
| `src/ui/59-tooltips/tt.wire.core.js` | `src/ui/59-descriptions/descriptions.wire.core.js` | 2026-11-12 11:23 ET |
| `src/ui/59-tooltips/tt.wire2.core.js` | `src/ui/59-descriptions/descriptions.wire2.core.js` | 2026-11-12 11:23 ET |
| `src/core/88-queue-head/head.core.js` | `src/core/88-skip-dropped-events/skip-dropped.core.js` | 2026-11-12 11:23 ET |
| `src/core/04-world-fixes/broke.core.js` | `src/core/04-world-fixes/broke-crown-levies.core.js` | 2026-11-12 11:23 ET |

## Docs (15)

| Old | New | Renamed |
| --- | --- | --- |
| `docs/plan/Ardan The Road to Ten.md` | `docs/plan/road-to-ten.md` | 2026-11-12 11:23 ET |
| `docs/plan/Road to Ten — status.md` | `docs/plan/road-to-ten-status.md` | 2026-11-12 11:23 ET |
| `docs/plan/Compounding.md` | `docs/plan/compounding.md` | 2026-11-12 11:23 ET |
| `docs/plan/Cycle 1 report (Oct 28).md` | `docs/plan/cycle-1-report-2026-10-28.md` | 2026-11-12 11:23 ET |
| `docs/plan/Cycle 2 plan (Oct 29).md` | `docs/plan/cycle-2-plan-2026-10-29.md` | 2026-11-12 11:23 ET |
| `docs/plan/Overnight report (Oct 23).md` | `docs/plan/overnight-report-2026-10-23.md` | 2026-11-12 11:23 ET |
| `docs/plan/Overnight report (Oct 26).md` | `docs/plan/overnight-report-2026-10-26.md` | 2026-11-12 11:23 ET |
| `docs/plan/Playtest kit.md` | `docs/plan/playtest-kit.md` | 2026-11-12 11:23 ET |
| `docs/reviews/Ardan Deep Analysis.md` | `docs/reviews/deep-analysis.md` | 2026-11-12 11:23 ET |
| `docs/reviews/Ardan Road to 100.md` | `docs/reviews/road-to-100.md` | 2026-11-12 11:23 ET |
| `docs/research/c7-names.md` | `docs/research/c7-name-data.md` | 2026-11-12 11:23 ET |
| `docs/research/c7-names.json` | `docs/research/c7-name-data.json` | 2026-11-12 11:23 ET |
| `docs/research/d11-branches.md` | `docs/research/d11-military-branches.md` | 2026-11-12 11:23 ET |
| `docs/research/d11-branches.json` | `docs/research/d11-military-branches.json` | 2026-11-12 11:23 ET |
| `docs/v2/CLAUDE_CODE_PROMPT.md` | `docs/v2/v2-kit-integration-prompt.md` | 2026-11-12 11:23 ET |

## Tools (11)

| Old | New | Renamed |
| --- | --- | --- |
| `tools/deadclicks.mjs` | `tools/dead-clicks.mjs` | 2026-11-12 11:23 ET |
| `tools/soak.mjs` | `tools/soak-test.mjs` | 2026-11-12 11:23 ET |
| `tools/pack.mjs` | `tools/blob-pack.mjs` | 2026-11-12 11:23 ET |
| `tools/bench/customs.mjs` | `tools/bench/realm-customs.mjs` | 2026-11-12 11:23 ET |
| `tools/bench/dominance.mjs` | `tools/bench/dominant-strategies.mjs` | 2026-11-12 11:23 ET |
| `tools/bench/exploit.mjs` | `tools/bench/trade-exploit.mjs` | 2026-11-12 11:23 ET |
| `tools/bench/life.mjs` | `tools/bench/long-life-audit.mjs` | 2026-11-12 11:23 ET |
| `tools/bench/press.mjs` | `tools/bench/next-month-speed.mjs` | 2026-11-12 11:23 ET |
| `tools/bench/rankfx.mjs` | `tools/bench/rank-battle-effect.mjs` | 2026-11-12 11:23 ET |
| `tools/bench/rankfx-lab.mjs` | `tools/bench/rank-battle-effect-lab.mjs` | 2026-11-12 11:23 ET |
| `tools/v2/png.js` | `tools/v2/png-encoder.js` | 2026-11-12 11:23 ET |
