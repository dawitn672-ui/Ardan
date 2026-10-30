# 96-moments: cut-ins for the big moments, and the Motion setting

**Aspect:** UI and UX, visual design (`docs/design/brief.md` §5.10, §6; changes 14 and 15 of §8) · **Kind:** UI layer: one readable core file with its stylesheet, one patch (the menu), no events, no engine change.

## Why

The owner asked for the Persona energy this audience knows. The brief keeps style for moments and plainness for reading: angles, big type and motion belong to the turns of a life, never to the lists and the prose. And every effect needs a reduced variant that a player can find in the game, because many never find the system's switch.

## What it does

**Cut-ins** (`moments.core.js`). A band across the screen at −10°, 120 px tall (150 at ≥1600, 104 on a phone), `--line-ink` with a 6 px band of the moment's colour offset behind it; the word in Dela Gothic One (`--t-display`, 44 px, 64 at ≥1600); one line under it; the subject's bust in a 120 px frame with an outline in the moment's colour (asked of 93 at 112 px, below the size where it draws the full figure); and a seeded burst of 24 to 40 focus lines from the centre. The moments, most important first:

| Moment | Word | Line | Bust |
| --- | --- | --- | --- |
| a death among your kin (spouse, child, parent, sibling) | FAREWELL | "Your mother, Maud · 1062–1106" | the dead (93 draws them still) |
| a crown | CROWNED | "Queen of Aldmark" | you |
| a battle won (the battle screen at its end, your side the winner) | VICTORY | the battle's name | you |
| a marriage | WEDDED | "to Maud of Kingsmere" | your spouse |
| a birth | A SON / A DAUGHTER | "Edric is born" | the child |
| a promotion (a career's next rank, or the army's) | PROMOTED | the new rank | you |
| a title (a noble rung, or the first) | TITLED | the title | you |
| an epithet | NAMED | "They call you the Grim" | you |
| the new year | 1106 | "The year 1106 · you are 21" | you |

Death is muted (a grey-blue band, no focus lines); a victory is vermilion and gold, a crown amber, a wedding rose, a birth dawn pink.

- **At most one in a game month.** When several fall due at once, the most important shows and the rest are passed over (not queued). A moment that comes later in a month already marked waits for nothing.
- **Skippable.** A click anywhere or any key ends it; the key is spent on the skip, so a number key does not also choose in the scene under it.
- **Timing:** 220 ms in, 700 held, 260 out (1.2 s): the band sweeps in from the left and out to the right, the word lands with a small overshoot, the lines burst and fade.
- **Reduced motion:** a still, level banner that fades in, stays 1.5 s and fades out (no transform, no lines). **Motion off:** the same banner with no fades.
- Read out once through `role="status"`; the drawing is `aria-hidden`. The line under the word sits on a plate of the band's ink, so its contrast is measurable (axe).
- On a phone the word scales with the screen (at most 34 px, 8.2vw) and may break onto two lines ("A / DAUGHTER").

**How the moments are found.** Nothing in the engine changes. After every draw (`UI.render`, `UI.refresh`, `UI.renderModal`, the clock's light redraw `UI.clkLight`) the life is read: its year and month, career rank, army rank, noble rung, crown, spouse, children, living kin and epithet. The reading is compared with the last one. A new life, a loaded save (a different `A.S`), another heir, or a jump of more than a year gives no moments. The readings, the month of the last cut-in and a short log (read by the tests) are UI state here.

**The Motion setting** (Menu, after the theme, patch `MO-MENU`): Follow system (the default), Full, Reduced or Off, saved with the other settings (`UI.set.motion`). It sets `<html data-motion="full|reduced|off">`, which 91-look and 92-scene-card read. Full also moves under the system's reduced-motion setting: the release's 1 ms floor is beaten with `!important` for these effects. **"Moment cut-ins"** (`UI.set.cutins`, on by default) turns them off altogether.

**Toasts** (`toasts.core.js`, brief §5.10, Oct 27). The release kept one toast: each message overwrote the last, so two in a row (a purchase and what it unlocked, a refusal and its reason) showed only the second.

- `#toast` is still the newest message, the live region (`aria-live="polite"`), and the text the features and tests read.
- The messages it replaces move into a stack under it, `#toast-stack` (`aria-hidden`, since they were read out when they came): at most three in all, newest on top.
- Each has an icon and a 3 px edge in its kind, read from the words: a refusal or a loss is danger, a gain is ok, the rest accent.
- A toast stays 4 s, and pauses while the pointer or focus is on it.
- Desktop toasts sit at the bottom right. On a phone they hang from the top of the content, with the older ones below.

## Measured by (`test.mjs`)

| Test | What it holds |
| --- | --- |
| `moOnePerMonth` | A marriage, a birth and an epithet in one month show one cut-in (WEDDED) and pass over the other two; a death the same month waits; a click skips; the next month shows NAMED; a key skips and the scene under it is not chosen; three years of a real life drawn month by month show no two cut-ins in one month, and the new year at least twice |
| `moMotion` | System reduced: a still banner, no transform, there at 1.32 s and gone by 1.92 s. System full: the band moves, gone by 1.32 s. Motion Reduced on a full system, and Full on a reduced system, are obeyed. Off: no animation, gone by 1.92 s. The menu offers the four, Reduced is saved and set on `<html>` |
| `moPure` | A life drawn at every step with cut-ins on reaches the same people, realms and random stream as the same life never drawn |
| `toastStack` | Three toasts stack: the newest in `#toast` (ok, polite) above a danger and an accent toast. A fourth drops the oldest. A hover holds it past 4 s, and it fades after. Pure |
| `moAxe` | axe-core on a cut-in, still and moving, dark and light: 0 violations |

## Rules kept

- **Pure.** It reads the life, never writes `A.S`, never draws a random number: the focus lines hash the moment (FNV and a small mixer).
- **Escaped.** Every name and title goes through `UI.esc`; no inline handlers (the menu's controls use `data-c`).
- **Old saves** load unchanged: the settings default when missing, and nothing is stored in the save.

## Limits

- **Moments come from readings, not from the engine's own events.** A rank won and lost between two draws is never seen. While the clock runs, the readings come from its light redraw, about every 1.5 s, which is always within a month.
- **Victory needs the battle screen.** A battle resolved without the player on its screen gives no cut-in; neither does a duel.

**Cycle 1 fixes (visual review).** I6: a VS cut-in with both busts at a duel's opening; I5: a muted FAREWELL at your own death; I3: DEFEAT for a battle lost. Openings and your death are not held to one a month. I9: on Day the dim is the indigo shade and the focus lines ink; the sub-line is 20 px (`moOpenings`).

## Cycle 2: the motion system (`motion.core.js`, lane G)

**Why.** The owner's bar ("motion graphics", Persona 5, Hades) and brief §6: motion explains a change. Until now each feature animated on its own, and most of the game changed state without showing it: tabs snapped, bars and numbers jumped, toasts popped, the map jumped between zooms.

**What.** One small library, `UI.MOTION`:

- **Tokens:** `MOT.T` (press 80, quick 140, base 200, enter 280, exit 180, snap 240, moment 1200, ink 700, tween 520, count 640, view 260 ms; a 36 ms stagger step, at most 10 steps) and `MOT.EASE` (the brief's five cubic Béziers), as CSS variables (`--mo-*`) and as JS easing functions (`MOT.ease.std(t)`).
- **Mode:** `MOT.mode()` is `full`, `reduced` or `off`, from the Motion setting and the system (`UI.MOMENTS.mode`).
- **Primitives:** `MOT.play(el, cls)` restarts a CSS animation class; `MOT.stagger(nodes, cls)` sets each node's place (`--mo-i`); `MOT.animate({ dur, ease, step })` drives a canvas by `requestAnimationFrame`; `MOT.beat({ kind, el, to, delay })` plays a registered Web Animation. `MOT.KINDS` (enter, exit, stamp, flash, wipe, draw, fly) is open: a feature adds its own kind.
- **Passes after every draw** (`MOT.passes`, open too): the panel slides in from the side of the tab you came from and its sections, tiles and rows enter in sequence; the rail's bars tween from the old width with a glow at the moving end; the rail's numbers and the purse count from the old value; the step's progress bar tweens; a result's delta chips fly to the tile, row or purse they changed.
- **Toasts** slide in with a small overshoot, and the toast they push down steps into the stack.
- **The map** (`UI.gmDraw`, `UI.drawWar`): a zoom or jump the player asked for (wheel, zoom buttons, + and −) eases over 260 ms. The view is set at once, so the game and the tests read the target; only the drawing follows. A drag pans with no lag, and a view set by code is drawn at once.
- **Cut-ins** gained an ink splash in the moment's colour behind the bust and the word, speed lines streaming down the band, and the bust's hair and cloak caught in the wind of it (93 tags them `.ap-hair`, `.ap-cloth`).

**Rules kept.** Nothing moves on a first draw, a new life or a load (the remembered values reset with the life, `MOT.mem`, never in `A.S`). No loop while reading. Reduced: no transform, every fade 120 ms or less, numbers and bars land at once. Off: none of it. A counting number keeps its real text (a pseudo-element draws the count over it), so screen readers and tests read the new value at once. No `A.rand`, no state change; seeded flourishes hash the moment.

**Test.** `motionSystem`: full motion slides the tab in (7 animations, 6 in sequence), counts the purse (5 → 46 suns) and a vital, tweens a bar, slides the toast, eases an asked zoom with the view set at once and draws a coded view at once; reduced: no transform, nothing over 120 ms, no counting, no easing; off: nothing; pure in all three.

**Cycle 2, round 2 (Oct 29).**
- **The map's ease is cheap** (visual B2). A zoom the player asked for no longer redraws the Great Continent's map on every frame (120–240 ms a frame): the tween scales the last finished picture with `drawImage` for at most 200 ms, and the map is drawn for real once the zoom has rested 140 ms, so a run of wheel steps costs one redraw. `MOT.mapStats` counts tweens, tween frames and real draws. `mapEaseCheap`.
- **The battle camera is a compositor transform** (visual F7, B6). It replaces 85's per-frame canvas copy (`UI.BMOTION.camera`): the canvas and its overlay sit in a clipping stage and a Web Animation scales them toward the decisive wing; the sides' names are drawn in the stage outside the moving group, so the camera never crops them. On a phone (71's pan frame) there is no camera.
