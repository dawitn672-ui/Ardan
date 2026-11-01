# Cycle 2 review: visual and interaction quality

*Reviewer "visual", Oct 29. Built game: `index.html` at commit 89dfb45, copied to `/tmp/ardan/cycle2/visual/` and not rebuilt. Measured against `docs/design/brief.md`, cycle 1's `docs/reviews/cycle-1/visual.md`, and the owner's goals: beautiful graphic design and motion graphics, an anime-leaning look, top-down clarity, less scrolling.*

## Angle

Two questions:

- Which of cycle 1's visual findings did cycle 1's fix lanes repair?
- How do the new visuals look and move? That covers lane G's motion system, ¾ head, poses, title vista, battle motion, icons and sea, and the new screens from lanes J, I, WD and P: the atlas veil, chapter cards, share cards, the War Room companies and the Politics view.

## Method

- **`shots.cjs`.** A Playwright script plays a life through the real menu: the Great Continent, the default world, starting at 18. It shoots every screen in Night and Day at 1366×768, 1920×1080 and 390×844 (touch, mobile).
  - The screens: title, creation, Life, Decisions, People, Path, War, Holdings, Realm, the five Chronicle tabs (including Places), events and results, the chapter card, Story → Map, profile, tree, menu, full map, War Room, duel (VS and face-off), battle (deployment, mid-pulse, camera, end), three cut-ins, death (FAREWELL and the dusk screen), and the three share overlays. The share PNGs are saved too.
  - One run at 1366 Night uses the system's reduced motion (`1366-dark-rm/`).
- **`stage.cjs`.** Some screens need a life the menu does not give quickly, so they were staged with the engine's own calls, the way the features' tests stage them:
  - a ruler's Politics view (`A.makeRuler`, `UI.A.poPropose`);
  - a noble's view;
  - a chapter card at 13;
  - a soldier's War Room, Path card and company battle, using 9997's `__coFight` recipe.
- **`perf.cjs` and `perf2.cjs`.** These sample `requestAnimationFrame` intervals and `long-animation-frame` entries during motion.
  - **Caveat.** This is headless software rendering on a 4-core machine at load 6 to 11, shared with three reviewers. Read the absolute numbers as pessimistic; the comparisons (full against reduced motion, one scene against another) hold.
- **`measure.cjs`.** Scroll screens per tab (`#tabbody` scrollHeight / clientHeight; the page on a phone) for a noble of 25 played one year, plus axe-core on the new screens.
- **Paths.** The shots are in `/tmp/ardan/cycle2/visual/shots/<width>-<dark|light>[-rm]/NN-screen.png`. Below, `S/` means `/tmp/ardan/cycle2/visual/shots/`, and `V/` means `/tmp/ardan/cycle2/visual/` (crops, sheets, perf JSON).

## The verdict in one paragraph

**Cycle 1 moved the showpieces.** The FAREWELL band over a dusk grave, the VS splash, the face-off duel, cut-ins with ink splashes, interiors with a figure and a light shaft, and share cards that look like a game's are all at or near the owner's bar.

**The reading layer cycle 1 praised still holds.** The vellum Chronicle is fixed, and the phone event picture is the brief's height.

**The new problems are of two kinds:**

- **The screens cycle 1 added beside the polished ones look unfinished.**
  - The Politics view is 4.4 screens of plain text cards, opened under a list of Build buttons.
  - The company battle never shows which block is you.
  - The full map's realm wash is so pale that realms cannot be told apart from above.
- **The motion is smooth where it is cheap and stutters where it is expensive.**
  - Tabs, cut-ins, the clock and the story map run at 60 fps.
  - An eased zoom of the Great Continent map redraws the whole inked map every frame, at 120–240 ms a frame.

**Day theme bugs.** The title vista is always night, but its text takes Day ink. So in Day theme the first words a player sees are about 1.4:1.

**What cycle 2 should do.** Finish the second-tier screens (politics, battle, map, the long tabs) to the standard of the moments, and make the map's motion cheap before adding more.

---

## Cycle 1's findings: what changed

| Cycle 1 | Status | Evidence |
| --- | --- | --- |
| B1 vellum headings by night | **Fixed** | `S/1366-dark/09-chronicle.png` |
| B2 hints over controls | **Mostly fixed**: in flow, one at a time. New case: the stepper's first hint hangs over the Story/Map toggle (B13 below) | `S/1366-dark/30-polity-ruler.png` |
| B3 snow on the tropics | **Fixed** (no snow on Tirangga's palms) | `S/390-dark/10-event-1.png` |
| B6 duel key badges | **Fixed**: tall cards, the key in flow | `S/1366-dark/12-duel.png` |
| B7 map legend and labels | **Half**: "Realms in view" row, names on plates. Region names still print under realm names ("BEAR FEAST" on "THE BLACK PINES"); the phone map is still a 360×235 thumbnail | `S/1366-dark/15-map.png`, `S/390-dark/15-map.png` |
| B8 War Room on a phone | **Not fixed**: the toolbar is still three rows (Play and speeds; ⏭ alone; "At peace" and close) | `S/390-dark/16-warroom.png` |
| B9 phone vignette height | **Fixed** (about 140 px) | `S/390-dark/10-event-1.png` |
| B10 "life is over" twice | **Fixed** | `S/1366-dark/19-death.png` |
| B11 playtest link and ⚑ | **Fixed** | `S/1366-dark/01-title.png` |
| I1 portraits | **Much better**: ¾ head, crossed arms, hand on hip, no helm in busts. Still a sticker-like rim (F6) | `S/1366-dark/02-create-4.png`, `S/390-dark/19-death.png` |
| I2 interiors | **Fixed**: figure, curtain, window shaft, patterned wall | `S/1366-dark/10-event-1.png` (first run), `S/1366-light/10-event-1.png` |
| I3 battle as a print | **Half**: sky band, standards, intent arrows, clash flashes, camera caption. The field is still a flat grey plate of 12 px boxes with colliding numbers (B5, F2) | `S/1366-dark/17-battle-mid.png` |
| I4 title vista | **Half**: clouds, ridges, three busts, brush logo. The old map still sits in a box in the middle; there is no vista on a phone (busts hidden under 900 px) (F1) | `S/1920-dark/01-title.png`, `S/390-dark/01-title.png` |
| I5 death as a moment | **Fixed**: FAREWELL, dusk grave, desaturated figure | `S/1366-dark/19-death-0.png`, `S/1366-dark/19-death.png` |
| I6 duel face-off | **Fixed**: VS splash, segmented Blood/Wind, intent mark. The figures still stand in the "stand" pose (F6) | `S/1366-dark/12-duel-vs.png` |
| I7 gold toggle | **Fixed** in the old places. **New case:** 9997's company order "Hold" is a gold cut-corner fill (B5) | `S/1366-dark/36-cobattle.png` |
| I8 Decisions and market as forms | **Not done**: Decisions are still checklist cards; the phone market is 26 tall cards (F4) | `S/1366-dark/21-chapter-card.png` (Decisions), `V/sheet-390-hold.png` |
| I9 cut-ins on Day | **Fixed** | `S/1366-light/18-cutin-victory.png` |
| I10 empty well under the event card at 1920 | **Not fixed** at 1920 (about 350 px empty) | `S/1920-dark/10-event-1.png` |
| I11 icon-only top-bar buttons at 1366 | **Not fixed**: ▷ ⏭ ☾ are still unlabelled | `S/1366-dark/03-life.png` |

---

## Ranked summary

| # | Item | Impact | Size | Owner |
| --- | --- | --- | --- | --- |
| B1 | Day theme: the title's text is about 1.4:1 on the night vista | 5 | S | 91-look (`look.g-title`) |
| B2 | An eased map zoom redraws the whole map each frame: 50 ms median, 233 ms p95 frames | 4 | M | 96-moments (`MOT.easeMap`), 62-inked-map |
| B3 | Politics opens under the Build list and runs 4.4 screens (5.4 on a phone) | 5 | M | 9996-polity (`e-view`) |
| B4 | The map's view is not held to the world: a flat navy block on the story map, a blank band on the full map | 4 | S | 9991-atlas, 62-inked-map |
| B5 | Company battle: your company is unmarked, and the side colours disagree (legend, flags, units, intents) | 4 | M | 85-battle-labels, 9997-companies |
| B6 | The battle camera crops the side labels; at 1920 the company battle's Next pulse is cut off | 3 | S | 85-battle-labels, 9997-companies |
| B7 | The career ladder breaks rank names mid-word ("Sergean / t", "Comma / nder") | 3 | S | 91-look (`look.e-rows`, ladder) |
| B8 | Share overlay: Save is not the primary button, and Back carries a key badge "2" | 3 | S | 9994-share |
| B9 | The rail's delta flash sits on the number and squeezes the label ("ST.", "WI…") | 3 | S | 91-look (`look.e-rows`, `LOOK.flash`) |
| B10 | Phone: a tap on a choice can open the odds tooltip, which covers every choice | 3 | S | 92-scene-card, 59-tooltips |
| B11 | People rows clip their chips with no ellipsis ("Would teach y") | 2 | S | 91-look (`look.e-rows`) |
| B12 | The chapter card's art does not fit the chapter (wedding rings for a childhood) | 2 | S | 9993-chapters, 94-woodblock-skies |
| B13 | Small type and spacing slips: the drop cap reads "Y ou", the first hint covers Story/Map, "( 1⧗ )" | 2 | S | 92-scene-card, 91-look, 9996-polity |
| F1 | The title as one composition: the map out of the box, a vista on the phone | 5 | M | 91-look, 86-title-fold |
| F2 | The battle field as a woodblock print, with top-down clarity | 5 | L | 85-battle-labels |
| F3 | The Politics view as a designed screen | 4 | M | 9996-polity |
| F4 | Less scrolling: Codex 24 screens, Dynasty 5, Path 3.9, Holdings 3.8 (8.1 on a phone) | 4 | M | 91-look, 66-markets, 994-careers, 9996 |
| F5 | The full map from above: the realm wash too pale to read | 4 | S | 62-inked-map |
| F6 | Portrait finish: the sticker rim, a stray strand, no fighting stance | 3 | M | 93-anime-portraits |
| F7 | Battle and War Room motion cost (p95 50 ms per pulse with motion, 16.8 reduced) | 3 | S | 85-battle-labels |
| F8 | Screens still release-era next to the new ones: profile, Decisions, War Room on a phone | 3 | M | 91-look, 71-phone |
| F9 | Share cards: the lower half is empty; no arms, no numbers | 2 | S | 9994-share |
| F10 | Icons at 14 px: some read as letters | 2 | S | 95-icons |

---

## Bugs

### B1. Day theme: the title's words are unreadable on the night vista
- **What I saw.** The title, Day theme, every size. The blurb ("Dawn of 1 January 1105 AR…") is `rgb(58,62,85)`, Day's `--ink-2`, drawn on the vista's night sky (about `#1d1c33`). That is about 1.4:1. The tagline is as faint.
  - Shots: `S/1366-light/01-title.png`, `S/1920-light/01-title.png`, `S/390-light/01-title.png`, crop `V/crop-title-light.png`. In Night it reads (`rgb(189,184,204)`).
  - axe reports nothing, because it cannot measure text over a background image.
- **Why it matters.** It is the first screen, and the share-worthy one. In Day it looks broken.
- **Fix (91-look, `look.g-title.core.js`).** The vista is always a night or dawn picture, so scope Night's ink tokens to it in both themes: `#title.tl-vista{--ink:#eee8da;--ink-2:#bdb8cc;--ink-3:#9c97ad;color-scheme:dark}`. Add the title to `tokensContrast` with the vista's darkest band as the surface.

### B2. An eased map zoom stutters: each frame redraws the whole inked map
- **What I saw.** The full map and the War Room on the Great Continent at 1366, motion Full. Four wheel steps in and out, then the zoom buttons (`V/perf-1366-full.json`, `V/perf2-1366-full.json`):

  | Scene | p50 frame | p95 frame | Worst | Longest frame |
  | --- | --- | --- | --- | --- |
  | Full map, wheel zoom | 50 ms | 233 ms | 450 ms | 173 ms in `go` |
  | Full map, + button | 133 ms | 283 ms | 283 ms | 244 ms |
  | War Room, wheel zoom | 33 ms | 117 ms | 283 ms | 241 ms |
  | Tab switch ×6, cut-in, clock, story map | 16.7 ms | 16.8–33 ms | 17–50 ms | ≤52 ms |

  `MOT.easeMap` (96-moments, `motion.core.js`) calls `UI.gmDraw` or `UI.drawWar` with an interpolated view on every animation frame. Each call costs 120–240 ms here. So a 260 ms ease shows as one or two frames, and it costs two or three full redraws where an un-eased zoom costs one. Under reduced motion the redraw itself is still 140–290 ms.
- **Why it matters.** The map is the strategy half's main surface, and a zoom that hitches reads as a slow game. The ease adds the cost without the smoothness.
- **Fix (96-moments with 62-inked-map).**
  - During the tween, draw the last finished frame as a bitmap with `drawImage` and the tween's scale and offset, as 85's battle camera does.
  - Do one real `gmDraw` at the end.
  - Cap the tween at 200 ms, and skip it when the last real draw took more than 60 ms.
  - Add a frame budget to 62's `inkTiming`: the p95 of a zoom tween under 34 ms on the Great Continent.

### B3. The Politics view opens under the Build list and is 4.4 screens long
- **What I saw.** A ruler, Realm → Politics, at 1366 (`S/1366-dark/30-polity-ruler.png` to `-p5.png`).
  - The selected "Politics" view first shows the State view's Build (seven cards) and three lore expanders. The bill, crown, council, estates, laws, factions and lords follow below them.
  - The panel is 2,912 px against 655: 4.4 screens. On a phone it is 4,525 against 844, 5.4 screens (`S/390-dark/30-polity-ruler.png`).
  - `e-view.core.js` line 202 appends `UI.polityView` to the state markup (`h += …`) instead of replacing it.
- **Why it matters.** The player pressed Politics and sees buildings. The owner asked for less scrolling, and this is the longest new screen.
- **Fix (9996-polity, `e-view`).**
  - When `UI.realmView === 'pol'`, render the Realm band, the view switch and the polity view only.
  - Fold the cards: the bill and the crown open, and the council, estates, laws, factions, lords and offices as 90-fold expanders with one-line summaries.
  - Target: 1.3 screens at 1366 with the defaults. See F3 for the layout.

### B4. The map's view is not held to the world's edges
- **What I saw.**
  - **Story → Map**, a life born at Ratrock on the far west coast (`S/1366-dark/23-story-map.png`). The left 40% is a flat navy block with a hard vertical edge at the world's west border. No bokashi, no ruling, no veil.
  - **The full map at 1920 Day** (`S/1920-light/15-map.png`, crop `V/crop-map-1920.png`). The canvas leaves an empty vellum band at the bottom.
  - **The full map at 1366** (`S/1366-dark/15-map.png`). A 16 px strip at the left.
- **Why it matters.** A hard rectangle of nothing reads as a rendering failure, on the map that is meant to be the first-class surface.
- **Fix.**
  - In 9991-atlas (`atView` and the story map's view) and 62's full-map view, clamp `x0, y0` so the view never shows past the world's bounds at zoom ≥ 1. When the view is wider than the world, centre it.
  - Paint everything outside the world with `IM.SEA_DEEP` plus the open-sea ruling, so even an unclamped edge is sea.

### B5. Company battle: which block is you, and whose colour is whose
- **What I saw.** A soldier's company battle, Captain view (`S/1366-dark/36-cobattle.png`, `S/1366-dark/36-cobattle-pulse-600ms.png`).
  - **No marker for you.** Four identical "155" blocks in the centre; nothing on the field marks your company.
  - **Four colour codes for the two sides:**
    - the legend's squares are the realms' colours, here two pale greens for Blackreef and Aldmark (`S/1366-dark/17-battle-mid.png`);
    - the standards are the realm colours;
    - the units' caps are blue against red;
    - the intent shields are blue against red.
  - **The selected order "Hold" is a gold cut-corner fill.** That is the primary button used as a toggle again (cycle 1's I7).
  - **The labels collide:** "42" under a red shield, "439 / 42 / 381 / 1.0k" in one clump.
- **Why it matters.** Top-down clarity is the owner's word. A captain who cannot find his own company cannot use the orders 9997 built for him.
- **Fix (85-battle-labels for the drawing, 9997-companies for the data).**
  - **Mark the player's unit** (`u.coMine === 'me'`): a 2 px `--accent` outline, a small gold chevron over it, and a "YOU" tag at 11 px caps on the first draw. Keep the tag in Reduced.
  - **One side code everywhere:** ours `--info` and theirs `--danger`, for the caps, the intents, the legend squares and the standards' edges. The realm colour stays only as the standard's cloth.
  - **The order buttons** become a segmented control (raised, accent underline).
  - **Numbers** show on hover or focus, or for your own wing only. Elsewhere, one label per wing.

### B6. The battle camera crops the side labels; the 1920 company battle cuts off its main button
- **What I saw.**
  - **During the camera's hold**, the canvas's own side bands ("Aldmark", "Sylvaran (you)") are cut to "ıdmark" and "lvaran (you)" (`S/1920-dark/17-battle-mid.png`). `BM.camera` redraws the canvas from a 1.16× crop of itself.
  - **The 1.16× zoom also softens the canvas text and lines.**
  - **At 1920×1080 Day** the right column of the company battle is taller than the modal, so the gold Next pulse button is cut at the modal's bottom edge (`S/1920-light/36-cobattle-pulse-600ms.png`, crop `V/crop-cobattle-1920.png`).
- **Fix.**
  - In 85-battle-labels, keep the side labels in the SVG overlay (`.bm-ov`), outside the camera group, or exclude the label bands from the crop.
  - In 9997-companies, pin the battle's action row (Next pulse, Fight it out) to the bottom of the side column (`position:sticky; bottom:0` on `--surface`), so it is always in view.

### B7. The career ladder breaks its rank names
- **What I saw.** Path tab, a captain: "Sergean / t", "Comma / nder", "High Genera" clipped at the right, and passed ranks struck through. At 1366 (`S/1366-dark/34-path-company.png`) and worse on a phone: "Captai / n" (`S/390-dark/34-path-company.png`).
- **Fix (91-look, `look.e-rows`, the ladder).**
  - `word-break: keep-all; hyphens: none`.
  - Labels at `--t-cap` with ranks abbreviated past eight: Squad Capt., Sr Captain, Cmdr.
  - Or show only the names of your rank and the next two, with the other dots unlabelled and the name in a tooltip.
  - Drop the strikethrough; the gold dots already say "passed".

### B8. The share overlay's buttons are choice rows
- **What I saw.** "Keep this" overlay, all sizes (`S/1366-dark/20-share-scene.png`, `S/390-dark/20-share-scene.png`).
  - "Save the picture (PNG)", the one action, is not gold, and a dark cut-corner notch shows at its top left.
  - "Back" carries a "2" key badge.
  - The cause: `share.core.js` line 194 wraps the buttons in `class="choices"`, the scene card's choice-row style.
- **Fix (9994-share).** Use a plain flex row `.sh-acts{display:flex;gap:8px;justify-content:center}` without `.choices`. Save is `.primary`, and Back is `.ghost`.

### B9. The rail's delta flash hides the number it reports
- **What I saw.** After a change, the "▲ +1" chip is drawn over the vital's number (Renown 0→1, `V/crop-rail-delta.png`). On a stat tile it squeezes the label to "ST." or "WI…" (`S/1366-dark/18-cutin-victory.png`).
- **Fix (91-look, `LOOK.flash`).** Place the chip outside the number's box: absolutely positioned above the tile's top-right corner, offset −8 px, with `pointer-events:none` and its own `--overlay` plate. Never shrink the label's box.

### B10. Phone: the odds tooltip covers the choices
- **What I saw.** 390 Day, "An apprentice's mistake". A tap landed on the odds badge and pinned the full odds breakdown over all three choices. Until it is closed, every tap hits the tooltip (`S/390-light/10-event-41-full.png`; my script stuck there for 40 rounds).
- **Fix (92-scene-card, 59-tooltips).**
  - On touch, open the odds breakdown as a bottom sheet (71-phone's sheet) with a close bar, not a popover.
  - Give the badge its own 44 px target separate from the row, so a tap on the row chooses and a tap on the badge explains.

### B11. People rows clip their chips
- **What I saw.** People at 1366: "Would teach y", "Wants compan", and "B…", "F" cut with no ellipsis (`S/1366-dark/04-people.png`).
- **Fix (91-look, `look.e-rows`).**
  - Give the want chip `max-width: 14ch; text-overflow: ellipsis`, with its text in a tooltip.
  - Drop the relation letter when the row is narrower than 420 px.

### B12. The chapter card's picture does not fit the chapter
- **What I saw.** "Chapter One: The Hungry Years", a childhood, is drawn with two wedding rings and a rose (`S/1920-dark/10-event-1.png`). Elsewhere a youth chapter gets an open book (`S/390-dark/33-chapter-card.png`), which fits.
- **Fix (9993-chapters).**
  - Give `chp_card` a scene key by stage: childhood a toy and a hearth, youth a book and a road, prime the post's tools, age a chair by a window, a reign a throne.
  - 94's `SK` already has the parts; add the five to `SK.SCENES`.

### B13. Small slips
- **The drop cap** is set apart from its word: "Y ou come ashore", "C hildhood begins", in every event at every size (`S/390-dark/10-event-1.png`). In 92-scene-card, use `::first-letter` with `float:left; margin-right:.04em`, or wrap the rest of the word with the cap.
- **The stepper's first hint** ("Press Month (M)…") hangs over the Story/Map toggle and the first log line (`S/1366-dark/30-polity-ruler.png`). In 91-look, anchor it below the top bar's right edge, or in flow above the log.
- **"Speak for it ( 1⧗ )"** has stray spaces inside the brackets (`S/1366-dark/30-polity-ruler-p3.png`, 9996-polity).

---

## Findings and the next upgrades (ranked by impact for effort)

### F1. The title as one composition (91-look `look.g-title`, 86-title-fold)
- **Seen.**
  - At 1920 the old political map in a rounded box fills the middle, and the busts sit in the bottom corners under a 300 px empty band (`S/1920-dark/01-title.png`).
  - The left bust's bangs are drawn as loose lines.
  - On a phone there is no vista: the logo, the map box and six buttons (`S/390-dark/01-title.png`).
- **Spec.**
  - Remove the map box from the title, and put it in "How to play".
  - Logo at `--t-display`×1.6 at 38% of the height. One line under it: "152 realms · 1,992 provinces · one life".
  - The primary button 64 px below.
  - At ≥1600, the three busts 360–420 px tall on the near ridge, overlapping it by 20%, with the centre one raised.
  - On a phone, keep the sky, the two ridges and one bust (88 px wide) behind the logo at 40% opacity, and drop the busts' breathing.
  - Under reduced motion it stays as it is now (still).

### F2. The battle field as a woodblock print, with top-down clarity (85-battle-labels)
- **Seen.** The sky band is a 60 px strip. The field is a flat grey plate with rain diagonals and 12 px boxes, the same on hills and plains. The standards stand in empty rows away from their units. The end plate "DRAWN FIELD" is a white box (`S/1366-dark/17-battle-end.png`).
- **Spec.**
  - **The ground:**
    - Draw it in three bands by terrain: hills as two hatched swells, forest as a tree line at the far edge, a river as a pale ribbon across the centre for a ford.
    - Weather tints from 94's palette.
    - The sky band at 18% of the height.
  - **Units:** a unit is a mass. Draw 3–6 silhouettes (pike heads, horse heads) per block in the side colour, with a ground shadow. Keep the boxes as 62's clarity option.
  - **Standards:** each standard stands at its wing's rear edge, 8 px behind the last block.
  - **The end:**
    - The end word goes to 96's cut-in band (VICTORY, DEFEAT, or a muted DRAWN FIELD in `--line-ink`).
    - The after-action report's three causes become three horizontal bars (green against vermilion).
  - **Clarity:**
    - Your unit is marked (B5).
    - Numbers show on hover.
    - At most one caption per pulse.

### F3. The Politics view as a designed screen (9996-polity `e-view`)
- **Seen.**
  - Text cards with 2 px bars, six empty circles for the bill, and the estates' header row not over its columns.
  - The council with no faces, and "− +" as bare text for the lords' oaths (`S/1366-dark/30-polity-ruler-p2.png` to `-p4.png`).
  - Next to the Realm band it looks like a draft.
- **Spec (1366, the panel's 488 px):**
  - **The bill:**
    - a 6-step track of 28 px nodes (✓, ‖, ⁇ glyphs, current in gold);
    - for and against as two stacked bars (`--info` against `--danger`) with the estates' names in them;
    - the four odds as one 100% stacked bar.
  - **The council:** five 22 px busts in a row with the seat icon under each and the task on hover.
  - **The estates:** five tiles 88×72 with a clout ring (stroke = clout), the approval number in its band colour, and the leader's 22 px bust.
  - **The laws:** an 8-cell grid of chips, with off-custom chips edged in `--warn`.
  - **The great lords:** People rows (91's 26 px rows) with the oath as a segmented control.
  - Every number keeps its 59 tooltip.
  - With B3, target 1.3 screens.

### F4. Less scrolling on the long tabs (91-look, 66-markets, 994-careers)
- **Measured** (`V/measure-1366-dark.json`, `V/measure-390-dark.json`; a noble of 25 played one year):

  | Tab | 1366 panel screens | Phone page screens |
  | --- | --- | --- |
  | Codex | **23.9** | **24.1** |
  | Dynasty | 5.0 | 7.2 |
  | Path | 3.9 | 3.8 |
  | Holdings | 3.8 | **8.1** |
  | Decisions | 3.0 | 3.2 |
  | War | 2.7 | 3.0 |
  | Places | 2.6 | 2.4 |
  | Book | 2.5 | 2.7 |

  Life, People, Realm and World are at 1.0–1.4.
- **Spec.**
  - **Codex:** one expander per kind (Realms, Faiths, Peoples, Beasts…), shut, each with a count and a search field at the top.
  - **Holdings, the market:** one row of 28 px per good (16 px icon, name, buy, sell, a 60×16 price sparkline, a ± stepper). The caravan towns become one select with a single result row. Phone target: 3 screens.
  - **Path:** the paths list folds by group with the one you are in open.
  - **Dynasty:** achievements as a grid of 48 px tier gems with names in tooltips.

### F5. The full map from above (62-inked-map)
- **Seen.** At the full map's home zoom on the Great Continent, the realms are a single cream (`S/1366-dark/15-map.png`, `S/1920-light/15-map.png`). Only the labels and the "Realms in view" swatches tell them apart. The swatches are saturated, and the land is not.
- **Spec.**
  - In Realms mode, lay the wash at the brief's 35% (now it reads under 10% after the sepia of 61).
  - Lay the border ribbon at 60%, 3 px wide.
  - Weaken 61's sepia filter to 0.3 on this canvas.
  - Region names at 30% alpha and hidden when realm names show (cycle 1's B7, still open).
  - Check against 62's `inkSamePixels`.

### F6. Portrait finish (93-anime-portraits)
- **Seen.**
  - The rim light is a pale-blue stroke that runs outside the silhouette, so figures look cut out like stickers (`S/1366-dark/13-profile.png`, `S/1366-dark/02-create-4.png`).
  - A stray hair line and its rim stroke rise above the head in the 1080 px share card (`S/1366-dark/20-card-scene.png`).
  - Duelists stand in the "stand" pose (`S/1366-dark/12-duel.png`).
- **Spec.**
  - Clip the rim stroke to the silhouette (`clip-path` of the body group) and draw it inside, 1.5 units, on the lit side only.
  - Drop strands whose bounding box leaves the head ellipse.
  - Add a 14th pose, `guard` (weapon raised across the body, weight forward), for the duel and the battle cut-ins, mirrored for the foe.

### F7. Battle motion cost (85-battle-labels)
- **Measured** (`V/perf2-1366-full.json` against `V/perf2-1366-reduced.json`, four pulses):

  | Motion | p95 frame | Longest frame | Long frames |
  | --- | --- | --- | --- |
  | Full | 50 ms | 146 ms | 19 |
  | Reduced | 16.8 ms | 99 ms | 3 |

- **Spec.**
  - The camera copies the whole canvas with `drawImage` every frame. Use a CSS transform on the canvas inside an `overflow:hidden` frame instead: compositor-only, with no redraw.
  - Draw the smoke and dust puffs once per pulse into the overlay, and animate only opacity.

### F8. Screens still release-era next to the new ones
- **The profile** (`S/1366-dark/13-profile.png`): all stat bars in one gold, unlike the rail's role colours, and a stiff figure in a box.
  - Spec: stat bars in `--st-*`, the figure at 1.5× in the brief's showcase frame, and the trait list as chips.
- **Decisions** (`S/1366-dark/21-chapter-card.png`): checklist cards with ✓ and ✗ pills.
  - Spec as cycle 1's I8: a 24 px group icon, a one-line stake, and a "2 of 3 met" chip.
- **The War Room on a phone** (`S/390-dark/16-warroom.png`): three toolbar rows, and the land hatch makes the counters hard to read.
  - Spec: one row (Play, a speed popover, close), the hatch at half alpha, and aggregated counters below zoom 2.
- **The empty well under the docked event at 1920** (`S/1920-dark/10-event-1.png`): keep three log lines faded under the card.

### F9. Share cards (9994-share)
- **Seen.** Good top half (`S/1366-dark/20-card-scene.png`, `S/1366-dark/20-card-life.png`). Below the result line there are about 150 px of empty cream. The arms the README promises were not drawn for a life with none.
- **Spec.** A strip of four numbers in Atkinson tabular figures (age, renown, coin, children, or the scene's check and odds), and the house arms at 96 px on the right of the name line. When there are no arms, use a 9992 placeholder seal, not nothing.

### F10. Icons at 14 px (95-icons)
- **Seen.** The activity tiles' icons are 14 px in `--ink-3` (`V/crop-icons.png`). "Go to the festival" (bunting) and "Get into mischief" read as letters (T, Y), while the market goods' icons read well at the same size (`V/sheet-390-hold.png`).
- **Spec.** Draw the tile icons at 16 px with `--ink-2`, test the 51 action icons shown alone (brief §7.4), and redraw any that read as a glyph.

## What already meets the bar (keep it)

- **The moments:** FAREWELL over the dusk grave, VS, VICTORY with the ink splash (`S/1366-dark/19-death-0.png`, `S/1366-dark/12-duel-vs.png`, `S/1366-dark/18-cutin-victory.png`). In Reduced they are level, still banners (`V/sheet-rm.png`).
- **Interiors with a figure and the window's shaft** (`S/1366-light/10-event-1.png`).
- **The share card's top half** (`S/1366-dark/20-card-scene.png`).
- **The War Room's stepped Prussian sea, inked land and banners** at 1366 and 1920 (`S/1920-dark/16-warroom.png`).
- **Tab, rail and cut-in motion** at 60 fps, with nothing over 120 ms under Reduced.
- **The vellum Chronicle**, now readable by night.

## Files

- Scripts: `V/shots.cjs`, `V/stage.cjs`, `V/perf.cjs`, `V/perf2.cjs`, `V/measure.cjs`, `V/probe-title.cjs`.
- Data: `V/perf-1366-full.json`, `V/perf2-1366-full.json`, `V/perf2-1366-reduced.json`, `V/measure-1366-dark.json`, `V/measure-1366-light.json`, `V/measure-390-dark.json`.
- Sheets: `V/sheet-390-*.png`, `V/sheet-1366-light.png`, `V/sheet-1920-light.png`, `V/sheet-rm.png`.
