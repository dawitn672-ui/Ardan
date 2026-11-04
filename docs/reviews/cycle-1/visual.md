# Cycle 1 review: visual and interaction quality

*Reviewer "visual", Oct 27. Measured against `docs/design/brief.md` (Woodblock & Light), `docs/design/brief-audit.md`, and the owner's bar: "some of the greatest visual productions possible… graphic masterpieces, anime-like". Built game: `/home/user/Ardan/index.html` as it stood, not rebuilt.*

## Method

- A Playwright script (`/tmp/ardan/cycle1/visual/shots.cjs`) plays a random grown life through the real menu. It shoots every screen and state in Night and Day at 1366×768, 1920×1080 and 390×844 (touch, mobile). The screens: title, the four creation steps, Life (Now and Decisions), People, Path, War, Holdings, Realm, the four Chronicle tabs, events and their results, a live duel and its end, a battle at deployment, mid-battle and end, three cut-ins, the profile, the family tree, the menu, the map, the War Room and death.
- Duel, battle and cut-in were staged through the engine's own calls (`A.startDuel`, `A.newBattle`, `UI.MOMENTS.show`). The VICTORY cut-in over a DEFEAT log line is my staging, not a bug.
- Measurements came from computed styles in the page: font sizes, colours, target sizes and the event-card geometry (`measure.cjs`, `measure2.cjs`).
- The shots are in `/tmp/ardan/cycle1/visual/shots/<width>-<dark|light>/NN-screen.png`. Below, `S/` stands for `/tmp/ardan/cycle1/visual/shots/`. The first 1920 Night life (an elf who died in a duel) is kept in `S/1920-dark-run1/`.

## The verdict in one paragraph

The reading layer is now good and coherent: tokens, type, the rail, the activity tiles, the scene card, odds badges and delta chips. At 1366 the Life screen is a disciplined three-column layout that a strategy-game player would respect. **The art and the moments are not yet at the owner's bar.**

- The portraits are paper dolls.
- Interior vignettes are clip art.
- The battle is a debug view.
- The title screen is a landing page.
- Death is a dialog.

The hours a player spends in the game look like a well-made web app. The few seconds that should sell it as a game (the title, a battle, a duel, a death) look the least finished. The work in cycle 2 should move from the system to the showpieces.

---

## Bugs (ranked by visible impact)

### B1. The Chronicle's headings vanish on the vellum by night
- **Seen.** The Book tab, Night, every size. The page titles "The Chronicle", "The Life of …", "The world in your time", the chapter heads and the drop-cap rubric lines are drawn in `--ink` `#eee8da` and `--ink-2` `#bdb8cc` on the vellum `#ece0c4` gradient. That is about 1.1:1, so they are unreadable. The body text is fine, and so is the Day theme.
  - Shots: `S/1920-dark/09-chronicle.png`, `S/1366-dark/09-chronicle.png`, `S/390-dark/09-chronicle.png`.
  - Computed: `rgb(238,232,218)` on a `radial-gradient(… rgb(241,230,…))`.
- **Why it matters.** The Chronicle is meant to be the one manuscript place, the game's "book". Its headings are blank gold smudges, so it looks broken.
- **Fix.** In `91-look` (`look.b-base.core.js`), scope the vellum's own tokens under `[data-vellum="1"] .il-vellum`. Headings take ink `#2b1d10` and sub-heads ochre `#6b4410`, as brief §1.1 says. Add the vellum to `tokensContrast` as a surface.
- **Also seen.** On the phone, the "Save the chronicle as text" button overlaps the heading (`S/390-dark/09-chronicle.png`). Move it below the title, or make it an icon button.
- **Size S · Impact 5.**

### B2. First-run hints cover the controls they explain
- **Seen.** Three hints sit on top of what they talk about:
  - **The odds hint** covers the top bar's step controls ("Go on", the speed and Play) at 1366 and 1920, in both themes: `S/1366-dark/10-event-2.png`, `S/1920-dark/10-event-3.png`, `S/1366-light/10-event-1.png`.
  - **The "What now" hint** covers rows 1 and 2 of What now. Row 2 is cut in half: `S/1920-dark/03-life.png`, `S/1366-light/03-life.png`.
  - **On the phone,** the same hint and "Bonds matter" cover the Activities grid and the family list: `S/390-dark/03-life.png`, `S/390-dark/04-people.png`.
- **Why it matters.** The first ten minutes are when a new player reads hints. Here the hint blocks the thing it is pointing at, and the screen looks cluttered.
- **Fix.** The hint code is the release's `UI.hintBox` and `UI.hintFor`, restyled by 91.
  - Place hints in flow, above their target and pushing it down, or as a popover anchored beside the target with an arrow (brief §5.8). Never place them over it.
  - Show one hint at a time.
  - On the phone, dock the hint above the bottom bar only when it does not cover the content it names.
- **Size S–M · Impact 4.**

### B3. Snow falls on the tropics
- **Seen.** "The priest in the cell" in Tidoha, on the Scent Isles, a tropical island. The palms are drawn by the far-lands jungle dress, and snow falls on them: `S/390-dark/10-event-2.png`.
- **The cause.** `SK.palette` in `features/94-woodblock-skies/skies.core.js` sets `winter = season === 0 && terr !== 'desert' || T.winter`. Every January is winter everywhere except deserts, and 99-far-lands' jungle, savanna and scrub are not excluded.
- **Why it matters.** It is the kind of error a 15-year-old screenshots and posts. It also breaks the "one coherent world" ruling.
- **Fix.** Have `winter` read the province's climate. Only the temperate, boreal and alpine biomes get snow. The tropics get a rain or dry-season variant.
- **Size S · Impact 4.**

### B4. The skin you pick is not the skin you get
- **Seen.** In creation, Busimo lake folk, choosing the palest skin swatch: the preview shows a pale woman (`S/skin-create.png`). The game then draws her dark-skinned (`S/skin-game.png`), because 990-far-peoples presses the stored tone into the land's range.
- **Why it matters.** Character creation is a promise. A player of 13 to 23 who chose a look and gets another reads it as a bug, or as the game overriding them.
- **Fix.** In `990-far-peoples`, either the creation preview (`UI.crPreviewPerson`) applies the same pressing, or the swatch row shows only the land's range when a far culture is chosen. The second is better: the choice stays honest.
- **Size S · Impact 4.**

### B5. Titles ignore sex
- **Seen.**
  - The Realm band says "**King** Kalunge drum-house", while its own court row and the log say "Queen Kalunge".
  - The creation summary reads "Realm: Kingdom of Busimo (**King** )", with an empty name.
  - A woman's post is "Herd-boy". The shots are `S/skin-create.png` and `S/skin-game.png`, and the band text came from the measure script.
- **Fix.**
  - In the Realm band in `91-look` (`look.e-rows` / realm band), use the same sexed title helper the court row uses.
  - In `29-starts` (`UI.crSummary`), use the ruler's name and title, and print nothing when there is no name.
  - Release job names such as "Herd-boy" need a sex variant ("Herd-girl" or "Herder"), in the fix layer's job table.
- **Size S · Impact 3.**

### B6. The duel's key badges sit on the move names
- **Seen.** At 1920, the 1–5 badges overlap the first letters: "3Guard & riposte", "5Close & grapple". Shot: `S/1920-dark-run1/12-duel-live.png`.
- **Fix.** In the duel move buttons (`UI.duelTechBar` as restyled by 91/92), reserve padding-left for the badge, or put the badge in flow, as the scene card's choice rows do.
- **Size S · Impact 3.**

### B7. The map's legend runs under the map, and names collide
- **Seen.**
  - At 1366 the full map's legend runs behind the zoom buttons and over the canvas's bottom edge (`S/1366-light/15-map.png`).
  - Region names in spaced caps ("THE BLACK PINES", "THE LONG GRASS") print through realm names and army counters.
  - On the phone, the map is a 360×230 thumbnail that cannot be read, under a legend of 40 chips that is taller than the map (`S/390-dark/15-map.png`).
- **Fix (62-inked-map, lane L2).**
  - Give the legend its own row or a collapsible "Realms" expander.
  - Hide region names at zoom levels where realm labels show, or run them at 30% alpha under the realm labels.
  - On the phone, make the map full screen with the side panel as a bottom sheet, and drop the 40-chip legend for a tap-to-name.
- **Size M · Impact 4.**

### B8. The War Room on a phone
- **Seen.** The toolbar wraps into three rows, and the "In the field" popover sits over the Command, Forces and Wars tabs. The map is a jumble of counters (`S/390-dark/16-warroom.png`).
- **Fix (`UI.warRoomModal`, 71-phone).**
  - One toolbar row: Play, the speed as a popover, close.
  - The popover becomes a bottom sheet.
  - Counters at a phone zoom aggregate to one per realm.
- **Size M · Impact 3.**

### B9. The phone's event picture is 2.6× the brief's height
- **Seen.** The vignette measures 390×371 at 390×844, where brief §4.4 says 390×140. The page measures 1,200 px high against an 844 viewport. On "The priest in the cell" there is also an empty band between the text and the choices (`S/390-dark/10-event-2.png`, `S/390-dark/10-event-1.png`).
- **Fix (`92-scene-card`, phone rules).** Cap the vignette at 16:6, or about 150 px. Let the choices follow the text instead of being pinned to the bottom.
- **Size S · Impact 3.**

### B10. "Your life is over…" shows twice
- **Seen.** The obituary modal sits over the game, and the release's gold "YOUR LIFE IS OVER…" bar still shows beneath it (`S/1920-dark-run1/19-death.png`).
- **Fix.** Hide the bar while the death modal is open (`UI.deathModal` / 28-endings). See also I5.
- **Size S · Impact 2.**

### B11. Test and debug affordances in the player's face
- **Seen.**
  - "Playtest mode (for usability tests)" is a link on the title screen (`S/1920-dark/01-title.png`).
  - The ⚑ report flag floats bottom right on every screen, sits in the event title row on the phone, and overlaps the Activities grid at 1366 (`S/1366-dark/10-event-2.png`, `S/390-dark/10-event-1.png`).
- **Fix.** Put Playtest behind the menu only. Show the flag as a small ghost icon in the menu and in the top bar's overflow, not floating (78-playtest-log, 98-feedback).
- **Size S · Impact 2.**

---

## Improvements (ranked by visible impact)

### I1. Portraits: from paper dolls to characters (93-anime-portraits)
- **Seen.**
  - The full figures stand frontal and stiff, every one in the same pose: arms down, feet together, the weapon held flat beside the body (`S/1920-dark-run1/12-duel-live.png`, `S/1920-light/03-life.png`, `S/skin-game.png`).
  - The heads are small for "anime" (about 1:7.5 of the figure). The eyes are dots at the rail's 88 px.
  - Helmets cover the brow and eyes in the 88 px rail bust and in the cut-in: the squad captain in `S/1366-dark/04-people.png`, the elf in `S/1920-dark-run1/03-life-start.png`.
  - The busts in the family tree are good: clear silhouettes, the land's dress, gold frames (`S/1366-dark/13-tree.png`).
- **The bar.** Hades: a ¾ turn, one strong gesture per character, expression that changes with the line spoken, a rim light you notice. Genshin: a showcase figure with a contrapposto stance and a flowing cloth silhouette.
- **Proposal.**
  - **(a) A ¾ view** for busts. The frontal face reads as an ID photo.
  - **(b) Six full-figure poses** keyed to post and traits: hand on hilt, arms crossed, holding a tool of the trade, a scholar with a book, a noble with a hand on the chest, a child. Each gets a weight shift and a cloak or sleeve with a flowing edge.
  - **(c) Bigger heads and eyes** at the full figure (1:6 heads, which brief §7.1 already specifies), and the brief's catchlights at 88 px.
  - **(d) No helmets** on rail and cut-in busts. Keep them for the battle and the duel.
  - **(e) Expression** taken from the event's tone in the scene card's bust: smile, frown, surprise.
  - **(f) A stronger rim light** (2.5 units) and a coloured cast shadow.
- **Size L · Impact 5.** This is the single largest gap against "anime-like".

### I2. Interior vignettes are clip art (94-woodblock-skies, 61-illumination)
- **Seen.** Indoors, a picture is a brown floor, a beige wall, arched windows and props floating on a shelf: a loaf, a jug, a fish, a candle, an envelope with a seal, an empty throne between pillars. There is no figure, no light shaft, no depth and no framing (`S/1920-dark/10-event-3.png`, `S/1920-dark-run1/11-result-3.png`, `S/1366-light/10-event-1.png`). The outdoor skies are much better: the dusk church and the sunset hill with two glowing eyes (`S/390-dark/10-event-2.png`, `S/390-light/10-event-1.png`).
- **The bar.** Pentiment's interiors: flat colour and pattern, but every scene has a person doing something, and its lines draw the eye to them. Ghost of Tsushima: light through a window as a solid shape.
- **Proposal.** Give every interior composition four things:
  - a light shaft from the window (a solid polygon at 15% of the hour's light colour);
  - a foreground framing element: a beam, a curtain, a table corner;
  - a silhouette figure, with the event's `ctx.pid` person in their portrait's colours;
  - a patterned wall (a woodblock motif per culture: asanoha, seigaiha, kilim and the like) in place of flat beige.

  The subject props stay, but on the figure's table, in scale.
- **Size M–L · Impact 5.** Events are the main surface, and about half of them are indoors.

### I3. The battle screen is a debug view (`UI.drawBattle`, 85-battle-labels, 23-after-action)
- **Seen.** An olive rectangle with grey ellipses and diagonal rain, unit boxes of 12 px with crosses, and outlined labels in 11 px that collide ("Spearmen 445" over "Heavy infantry 458"; "LEFT WING" printed under the units). The result is a dark "DEFEAT" strip in Cinzel across the middle. Shots: `S/1366-dark/17-battle.png`, `S/1920-dark/17-battle-mid.png`, `S/1366-light/17-battle-end.png`.
- **The bar.** Total War's map is not the bar; a woodblock print of a battle is. Hiroshige and Kuniyoshi warrior prints: a sky band, banners, masses of figures as one shape. Into the Breach: unit intents as arrows.
- **Proposal.**
  - Draw the field with 94's layers: a sky band in the battle's hour and weather, a far ridge in the terrain, the near ground.
  - Draw each unit as a block of banner poles in the realm's swatch with a silhouette mass (pikes, horses), not a box.
  - Show labels on hover or focus only, plus one label per wing.
  - Each pulse gets a short clash flash (opacity only) and arrows for the next move.
  - The end goes to 96's VICTORY or DEFEAT cut-in instead of the strip.
- **Size L · Impact 5.** Battles are the big moments the owner's "Persona energy" is meant for.

### I4. The title screen is a landing page (86-title-fold)
- **Seen.**
  - A static map in a rounded box, a paragraph and five same-weight buttons (`S/1920-dark/01-title.png`, `S/1366-light/01-title.png`, `S/390-dark/01-title.png`).
  - **The map is the old 34-realm Known World**, and the text says "Thirty-four realms", while the default world is the Great Continent of 153 realms.
- **The bar.** Ghost of Tsushima's title: a full-bleed landscape, wind and one line of type. Genshin: a character on a vista.
- **Proposal.**
  - A full-bleed woodblock dawn sky from 94, seeded by the world seed.
  - Three ridges with the 60 s parallax drift the brief allows.
  - Three seeded busts of different peoples of the Great Continent along the bottom.
  - The ARDAN logotype at `--t-display` scale with the gold rule.
  - One primary button ("Begin a new life"), with Continue, Random life and Load as ghost buttons.
  - The map moves to the "How to play" or World section, and the text is rewritten for the Great Continent.
- **Size M · Impact 5.** It is the first screen and the screenshot that gets shared.

### I5. Death is a dialog, not a moment (28-endings, 96-moments)
- **Seen.** The obituary is a centred modal over the dimmed game. The ingredients are strong: a desaturated figure, an epitaph in Literata italic, "What became of them", the life score in Dela Gothic (`S/1920-dark-run1/19-death.png`, `S/390-dark/19-death.png`). But there is no FAREWELL cut-in for your own death, though brief §5.10 lists "a death".
- **Proposal.**
  - Your own death opens with a muted FAREWELL band.
  - Then a full-screen dusk vignette (94's dusk palette, a grave or pyre composition by culture), the figure lying or as a silhouette, and the epitaph set large.
  - The score counts up (opacity and number only).
  - The heir's bust slides in for "Go on as your heir".
- **Size M · Impact 4.** Reflecting on a life lived is the emotional payoff of a life sim.

### I6. The duel lacks a face-off (`UI.duelModal`, 48-fight-ladder, 96-moments)
- **Seen.**
  - Two stiff figures in boxes and a 230 px empty log well. The five moves are small text cards, and Yield and Flee sit at the same weight as the moves (`S/1920-dark-run1/12-duel-live.png`, `S/1920-dark/12-duel-end.png`).
  - On the phone the moves fall below the fold (`S/390-dark/12-duel.png`).
  - There is no cut-in on the opening, though the brief lists "a battle or duel opening".
- **The bar.** Persona's "VS" splash. Slay the Spire's enemy intent shown before you choose.
- **Proposal.**
  - Open with a VS cut-in (two busts and a diagonal band).
  - The figures face each other, mirrored on the right, at full height with a ground shadow.
  - Blood and Wind become big segmented bars under each figure.
  - The foe's "tell" (the instinct line) becomes an intent icon over their head.
  - Moves become five tall cards with the stat icon and odds.
  - The log well shrinks to its content.
  - On the phone: portraits 96 px side by side, the moves as a two-row grid above the fold.
- **Size M · Impact 4.**

### I7. The gold primary is used as a toggle, so every view has three or four primaries
- **Seen.** The cut-corner gold fill marks selected toggles:
  - the Codex's "Faiths" (`S/1366-dark/09-chronicle-codex.png`);
  - the map's "Realms" mode (`S/1366-light/15-map.png`);
  - the battle's "Captain — companies" view beside "Next pulse" (`S/1920-dark/17-battle-mid.png`);
  - creation's Female, locks and muscular all at once (`S/skin-create.png`);
  - the top bar's "Next month".
- **Why it matters.** Brief §5.1 says at most one primary per view. When the selected state looks like the call to action, the eye has no place to land, and "what do I press" gets harder.
- **Fix (91-look).** Selected chips and segments get `--raised`, `--accent` text and a 2 px accent underline (the segmented-control spec in §5.2). The gold fill and the cut corner are kept for the one action.
- **Size S · Impact 4.**

### I8. Decisions, Holdings and the market read as forms (97-small-multiples per brief §9, 66-markets)
- **Seen.**
  - Decisions are white or navy cards with ✓ and ✗ pills and a "Decide" button, like a SaaS checklist (`S/1920-light/18-cutin-birth.png` behind the band, `S/1366-dark/03-life-decisions.png`).
  - The market is a spreadsheet with "+1 +5" buttons on every row (`S/1920-dark/07-holdings-full.png`).
- **The bar.** Slay the Spire's shop: the goods as objects with a price tag.
- **Proposal.**
  - Each decision gets its group icon from 95 at 24 px and a one-line stake. The requirements become a compact "2 of 3 met" chip with the detail in its tooltip.
  - Market rows get a 16 px good icon and the brief's 60×16 price sparkline. Buy and Sell become one stepper.
- **Size M · Impact 3.**

### I9. Cut-ins: strong, but thin on Day and missing for battle and duel openings (96-moments)
- **Seen.** The band, the Dela Gothic word and the framed bust land well, the best "anime" moment in the game (`S/1366-dark/18-cutin-year.png`, `S/1920-light/18-cutin-birth.png`).
  - On Day, the dim turns the page a flat grey, which reads as a disabled state, and the white focus lines vanish into it.
  - The sub-line ("Ama is born") is 16 px on a 120 px band.
- **Proposal.**
  - On Day, dim with `--shade` at 35% and draw the focus lines in `--line-ink` at 30%.
  - Set the sub-line at 20 px.
  - Add the two missing moments the brief names: a battle opening (the two banners) and a duel opening (VS, see I6).
- **Size S · Impact 3.**

### I10. Event card: the empty column under it at 1920
- **Seen.** With an event docked, the log is hidden. At 1920 the card (722 × about 600) leaves about 380 px of an empty dark well below it, and the column looks unfinished (`S/1920-dark/10-event-3.png`).
- **Proposal (`92-scene-card`, dock).** Keep the last 3–4 log lines visible, faded to `--ink-3` under the card. Or centre the card vertically, with the vignette taking a 16:6 ratio at 1920.
- **Size S · Impact 2.**

### I11. Top-bar icon buttons have no label at 1366 (84-top-bar)
- **Seen.** ▷, ⏭ and ☾ are 32×32 icon-only buttons, and "× 2" is a lone multiplier (`S/1366-dark/03-life.png`). At 1920 they carry words (Play, Quiet), so the 1366 version loses meaning, not just space.
- **Proposal.** Give each a tooltip that names its key and a visible label on first run, as brief §7.4 asks ("an icon is always labelled the first time it appears").
- **Size S · Impact 2.**

---

## What already meets the bar (keep it)

- **The 1366 Life screen** (`S/1366-dark/03-life.png`): three columns that fit, a clear rail, stat tiles in their colours, activity tiles with group icons and cost. It is denser and calmer than most indie strategy UIs.
- **The scene card's result in place**, with delta chips and the regard chip (`S/1920-dark-run1/11-result-3.png`).
- **The odds badge and check chip** on the phone (`S/390-light/10-event-1.png`), which read at a glance.
- **The family-tree busts** and the land dress of the far peoples (`S/1366-dark/13-tree.png`).
- **The outdoor woodblock skies**: dusk, snow (where it belongs), sunsets.

## Comparison notes

| Reference | What it does that Ardan lacks |
| --- | --- |
| **Persona 5** | Menus are type compositions, and the cut-ins carry the energy. Ardan's cut-ins are close; its menus (Decisions, Holdings, Menu) are plain lists. Only the moments need Persona. The lists should go toward Slay the Spire's clarity. |
| **Hades** | Portraits with a ¾ pose, one gesture and a changing expression, and a Codex with art per entry. Ardan's Codex is pure text (`S/1366-dark/09-chronicle-codex.png`). |
| **Genshin menus** | One big character render anchors every character screen. Ardan's profile has a figure, but a stiff one (`S/skin-game.png`). |
| **Slay the Spire** | Enemy intent icons and a readable map of nodes. Wanted for the duel and the War Room. |
| **Ghost of Tsushima** | A full-bleed title vista and minimal type. Wanted for the title and the death screen. |
| **Pentiment** | People in every interior, and pattern as texture. Wanted for the interior vignettes. Its manuscript type is what the Chronicle should be, once B1 is fixed. |

## Top 10

1. **B1:** the Chronicle's headings are invisible by night (S, 5).
2. **I1:** portraits need a ¾ view, poses, bigger eyes and no helmets in busts (L, 5).
3. **I3:** the battle screen as a woodblock battle print, with labels on hover (L, 5).
4. **I2:** interior vignettes need light shafts, a figure, framing and pattern (M–L, 5).
5. **I4:** the title screen should be a full-bleed vista on the Great Continent, not the old 34-realm map (M, 5).
6. **B2:** first-run hints cover the controls they explain (S–M, 4).
7. **B3 + B4:** snow on the tropics, and the creation skin swatch that lies (S, 4 each).
8. **I7:** the gold primary is used as a toggle, so there are 3–4 primaries per view (S, 4).
9. **I5 + I6:** death and the duel as moments, with FAREWELL, VS and a face-off (M, 4).
10. **B7 + B8:** the map's legend and labels, and the phone map and War Room (M, 4).
