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

## Measured by (`test.mjs`)

| Test | What it holds |
| --- | --- |
| `moOnePerMonth` | A marriage, a birth and an epithet in one month show one cut-in (WEDDED) and pass over the other two; a death the same month waits; a click skips; the next month shows NAMED; a key skips and the scene under it is not chosen; three years of a real life drawn month by month show no two cut-ins in one month, and the new year at least twice |
| `moMotion` | System reduced: a still banner, no transform, there at 1.32 s and gone by 1.92 s. System full: the band moves, gone by 1.32 s. Motion Reduced on a full system, and Full on a reduced system, are obeyed. Off: no animation, gone by 1.92 s. The menu offers the four, Reduced is saved and set on `<html>` |
| `moPure` | A life drawn at every step with cut-ins on reaches the same people, realms and random stream as the same life never drawn |
| `moAxe` | axe-core on a cut-in, still and moving, dark and light: 0 violations |

## Rules kept

- **Pure.** It reads the life, never writes `A.S`, never draws a random number: the focus lines hash the moment (FNV and a small mixer).
- **Escaped.** Every name and title goes through `UI.esc`; no inline handlers (the menu's controls use `data-c`).
- **Old saves** load unchanged: the settings default when missing, and nothing is stored in the save.

## Limits

- **Moments come from readings, not from the engine's own events.** A rank won and lost between two draws is never seen. While the clock runs, the readings come from its light redraw, about every 1.5 s, which is always within a month.
- **Victory needs the battle screen.** A battle resolved without the player on its screen gives no cut-in; neither does a duel.
- **Toasts** keep 91-look's style and 98-feedback's behaviour; the brief's stacking of three toasts is not built here.
