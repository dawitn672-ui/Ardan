# W0: the war score and the army templates, retired from what the player sees and does

**Retired by:** work item W0, decision D-052 (owner order 34, D-039 item 13, D-047: "remove war score and army
templates; I no longer am a fan of the HOI4 war system within this game"). **Last commit that had all of it:**
`39ee589` (v2-integration, 2026-11-14).

## What was here

| File | What it was | Where it lived |
| --- | --- | --- |
| `war-room-templates.js` | The War Room's **Templates** tab (`UI.wrTemplates`), the template editor (`UI.wrTplEditor`, `UI.wrBnChip`, `UI.wrTplSummary`), its actions (`wrTplNew/Edit/Add/Rm/Sup/Save/Cancel/Del`), "Reorganize as…" on a division (`wrDivTpl`), the army doctrine buttons (`wrDoc`), the "spend army experience on templates" hint, and `A.fxAct`'s `tplEdit`, `tplNew`, `tplDel`, `divTpl` and `doc` | `src/core/release/core/23-ui-c.js`, `23-ui-d.js`, `10-companies-and-war-staff-b.js` |
| `descriptions-templates.js` | The doctrine's click-open note (`G.doctrine`) and the Templates tab's wiring (`W.wrTemplates`) | `src/ui/59-descriptions/` |
| `descriptions-warScore.js`, `descriptions-wire-warScore.js` | The war score's click-open note and its wiring on the War Room's Wars tab and the War tab | `src/ui/59-descriptions/` |
| `v2-stats-war-score-words.js` | The war score bar put into words ("winning", "behind") | `src/people/99993-v2-stats/j-numbers.core.js` |
| `war-score.css` | The War Room's war score bar | `src/core/release/page.html` |

The other war score displays were one-line template parts, replaced in place (each marked `W0 (D-052)` in the source):
the World's Wars view ("Attacker's score" bar), the War tab's "Wars of your realm" (War score bar), the War Room's Wars
tab (bar, "+N", "At +25 you can demand"), the peace table's "war score" chip and line, the diplomacy card's "war score N"
under Negotiate peace, the release's campaign header ("war score N in your favor"), and 20-ai-personality's reasons
("War score N", "Losing the war (score N)"). In their place: `A.warFactsText` (the provinces each side holds of the
other's, the great battles each side won) and reasons named by what moves the score (the land held and the battles won).

## What stays inside the engine

- **`w.score`** (−100..100) still moves with battles and occupation and still decides the AI's peace (`A.checkPeace`),
  the terms a foe accepts (`A.peaceTerms`, `A.peaceOdds`), whether "Demand what you hold" is offered (score 25), the
  crushing peace (90), events that move it (`content/22-pl.js`), 09-engine-at-scale's far-war cap and 68's forced
  surrender mark. Nothing shows it.
- **Templates** (`r.forces.tpl`): every division is still built from one. `A.tplDefaults` makes a realm's set at world
  build, 56-court-and-treasury's yearly review recuts them to brigades and back, `A.tplEdit` is still the engine's way to
  change one, 9997-companies reads a division's battalions from its template. The player trains divisions by kind in
  the Manpower tab (the kinds are the realm's own: Line Division, Horse Division...) and never designs, edits or
  retires one. **Doctrine** (`r.forces.doc`) stays readable; nothing sets it now except an old save that chose one.

## Bringing it back

Paste the functions back into the files named above and restore the tab entry in `UI.wrTabs`. The war score bars are
one `UI.barRow(...)` each; see the diff of the W0 commit.
