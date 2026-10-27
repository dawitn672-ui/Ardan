# 92-scene-card: the event as a scene card

**Aspect:** UI and UX, visual design (`docs/design/brief.md` §5.9, §4.1–4.4, §6; changes 7, 8 and 11 of §8) · **Kind:** UI layer: four readable core files and one stylesheet, no patches, no events, no engine change. Built on 91-look (tokens, type), 94-woodblock-skies (the print), 93-anime-portraits (the bust), 95-icons (the stat icons), 59-tooltips (odds popovers), 89-fight-odds (the fight badge), 97-life-fixes (the stake line).

## Why

Events are the game's main surface, and the release drew each one as a modal over the whole screen: the player could not see the stats and needs that decide the choice, the odds were a grey "38% · risky" at the end of a line, and the result came back as one paragraph, so the player compared numbers by hand (the brief's Norman lesson). On a phone an event was 5.2 screens.

## What it does

**The card** (`scene.a-card.core.js`). Every event is drawn as a scene card:

- **The picture** across the top, full bleed (94's colour print at 16:5, or 61's woodcut).
- **The bust** of the person the scene is about (93's anime bust, or the beast), 84 px (96 at ≥1600, 68 on a phone), overlapping the picture's lower edge, with a "sticker" outline and a shadow.
- **The title** in Cinzel 22, flush left beside the bust; a once-in-a-life event (`once: true`) carries a rare-tier tag (◆◆ ONCE IN A LIFE).
- **The text** in Literata 15/23, at most 68ch, with a gold initial; the asides of 55-bonds and 57-world-chronicle in Literata italic 13, `--ink-3`; "Read more", 34's two scales and anything else a feature adds go in the body.
- **The choices** as rows on `--raised`, at least 44 px:
  - the number-key badge (the release's counter, so keys 1–6 still count the rows);
  - the label in Atkinson 600, with 97's stake line ("If it fails: a wound") and 48's measure under it;
  - on the right, the **check chip**: the stat's icon and short name in the stat's colour (`--st-*`), with your value as 59's odds popover counts it. A skill check wears the colour and icon of the stat the skill rests on (`GD.SKILL_STAT`) and its own short name ("Persuasion 23"); a second stat is named after it ("+WIL");
  - the **odds badge**: the percentage, the band word in caps and four pips (●●○○, drawn by CSS so they add no text), on a 14% tint of the band's colour. The release's text is kept ("40% · risky", or 89's "40% · a fight"), split into spans, so 59's tap target and 89's badge text are unchanged. With the numbers off it is the word and the pips;
  - an **effect hint** where the written choice states one plainly (an object `fx`, no check): `▲ coin`, `▼ honour`, `▲ their regard`, at most two. Costs in coin are left to 97's line;
  - a **one-time** choice (`once`, or an effect that kills, disowns or abdicates) has a 3 px `--danger` left edge and the word ONCE.
- **Hover and focus:** the border turns gold, the key badge fills gold, and a −8° gold slash slides in behind the label (160 ms; off under reduced motion).

The card is built from the release's own markup after every feature has drawn its part: `UI.queueModal` is wrapped, the markup is parsed in an inert `<template>`, its pieces are moved into the card's frame, and it goes back out as a string. A piece the card does not know goes into the body, so nothing a feature adds is lost. The card keeps the `.mbox` class, `.choices`, `button[data-a=evChoose]`, `.risk`, `.fo-fight`, `.lf-stake`, `.result` and `button[data-a=evClose]`, so every selector that found the event box still does.

**The result in place** (`scene.b-result.core.js`). After a choice the card stays: the event text dims to `--ink-2`, the choices give way to a line with the choice made (its key badge and label) and a verdict (SUCCESS or FAILED, with the odds it had), the result text on a tinted panel (green edge on a success, vermilion on a failure), a row of **delta chips**, and Continue (primary, Enter). The chips are a diff of two readings of the player:

- before the engine resolves the choice (`UI.A.evChoose`, which the button and keys 1–6 both call);
- the first time the result is drawn, so a fight the choice started, or a scene it queued first, is counted.

A reading holds the six stats as shown (`A.stat`), the six vitals rounded, coin and the family purse to a tenth, every skill as shown (`A.skill`), the regard of the person the scene is about, traits and wounds. A chip is `▲ +2 [fist] Strength` in `--ok` or `▼ −3 [sun] Happiness` in `--danger`; coin as the purse writes it (`▼ −23 suns`); a trait gained or lost and a new wound by name. The pair of readings lives in a WeakMap keyed by the queue item, never in `A.S`.

**Where it sits** (`scene.c-dock.core.js`).

- **Three columns (1100 px and up) and two (761–1099):** docked over the story in the centre column, as wide as the column (at most 720 px), at its top, as tall as its content up to the column's height, and scrolling inside past that. The rail and the panel stay in sight under a light scrim; the story behind the card is blurred, so the card owns its column.
- **Phone:** a full-screen sheet with its own scroll (71-phone's sheet). The picture takes the height the words leave, from 390 × 140 up to 44% of the screen (the print is sliced, so it crops rather than stretches); choices sit at the foot, each at least 52 px, their tags under the label. 71's report flag moves from the picture's corner (where the place name is) to the end of the title row.

**A short phone** (Oct 27). On a 375 × 667 phone, a first life's first-run hint ("Each choice shows your odds…") used to sit above the sheet and push it 90 px down, so "A love philtre" needed 72 px of scrolling. Now:

- the hint floats over the print;
- the tags' row is 4 px tighter;
- under 700 px of height, the bust, the gaps and the print's floor are a little smaller.

The scene fits one sheet (`scPhoneFit`).

**Everything the modal did, the card still does,** because it is still the release's `#modal`: role dialog, `aria-modal`, the page behind `inert`, Tab kept inside (`UI.trapFocus`), focus back to the opener when it closes (`UI.modalClosed`), keys 1–6, Escape closes a popover first (59) and never dismisses an event. The card focuses the first choice when it opens and Continue when the result lands (Continue is described by the result text, so a screen reader reads it). Two keys are added: Enter on the result is Continue even when focus is elsewhere (and is spent, so the release's Enter-to-play does not also run), and a held-down Enter (key repeat) does not fall through Continue into the next card's first choice.

**Motion** (`scene.d-style.core.js`, brief §6): the card rises 12 px and fades in (280 ms, emphasized decelerate), the print settles from 103.5%, the bust rises, the rows slide in from the left 40 ms apart; a result rises into place and its chips pop (240 ms, small overshoot) one after another. Each runs once per phase (a redraw does not replay it; 91's `.mbox` rise is switched off on the card). Under reduced motion (the system's, or 96's Motion setting) only the card and the result fade, 120 ms; with Motion off nothing moves.

## Measured by (`test.mjs`)

| Test | What it holds |
| --- | --- |
| `scEvery` | 200 distinct events from five real lives at 1366 × 768: docked inside the centre column and the window, no raw `{token}`, no horizontal overflow of the card or a row, every tag inside its row, every row at least 44 px, every choice in key order and in reach (scrolled to, then hit-tested at its centre). Then 60 at 390 × 844 as a sheet that fills the screen, rows of 52 px |
| `scKeys` | Focus on the first choice; Escape keeps the event; nine Tabs stay inside; 2 chooses the second door, focus on Continue, chips `coin=5 v.honor=-3`; Escape keeps the result; Enter continues; a held Enter does not choose in the next card; Enter off the button closes it; focus goes back to the opener and the page is live again |
| `scDeltas` | 40 results from real lives, chosen through the button's action: the chips equal the test's own before-and-after reading of the player, chip for chip (at least 15 with chips) |
| `scPure` | 30 events drawn three times in each phase (with `UI.refresh`): `A.S` and the random stream unchanged, the second and third drawings the same markup |
| `scPhone` | A long event at 150% text on a 390 × 844 phone: a sheet that fills the screen and scrolls itself; a wheel scrolls the sheet and not the page; rows of 52 px and up |
| `scPhoneFit` | "A love philtre" on a 375 × 667 phone with the first-run hint showing: the sheet at the top, 0 px to scroll, rows of 52 px and up |
| `scAxe` | axe-core (WCAG 2.0–2.2 A/AA and best practice) on the dialog with a bust and checks, choosing and after, dark and light: 0 violations |
| `scMotion` | Under the system's reduced motion, nothing in the dialog runs a transform when it opens or after a choice; with full motion both do; 96's Reduced on a full system and Full on a reduced system are obeyed |

## Rules kept

- **Pure drawing.** The card reads the event's view, the written choice and the player; it never draws a random number and never writes `A.S`. Its memory (the phase last drawn, the choice made, the two readings) is UI state in WeakMaps. A save, a replay and the bots never see it (`renderRng`, `replayWithRender`, `journalReplay` pass).
- **Escaped.** Every value it writes goes through `UI.esc`; the release's markup is moved, not rewritten; no inline handlers.
- **No new state, no patches.** `UI.SCENE.OFF = true` (or `UI.set.sceneCard = false`) gives the old modal back.

## Limits

- **The bust overlaps only when there is a subject.** A scene about no one has no bust; its title sits under the print.
- **Effect hints are read from object effects only.** A choice whose effect is a function shows none, and checks show their stake line (97) rather than a hint.
- **The dock follows `#logwrap`.** If a layout hides the story column, the card falls back to a centred box.
- **On a phone, short scenes crop the print** to fill the sheet: a subject placed far to one side can be cut.
