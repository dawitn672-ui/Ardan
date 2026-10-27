# The phone, on its own

**Aspect:** UI and UX (Road to Ten, UI and UX 6, and the measurable parts of its "done when": a WCAG 2.1 AA audit, and phone tasks at most 1.5 times desktop) · **Kind:** UI layer (one stylesheet and small wrappers), no patches, no events, no engine change.

The plan asks to "design mobile on its own: a bottom tab bar and cards sized for thumbs, not a squeezed desktop." The release already drew a phone layout below 760 px: a bottom bar of six sections, and Story and You as sub-tabs. A phone pass over the full build found what was left (iPhone SE 375 × 667 and Pixel 7 412 × 915, touch emulation, 35 screens each):

- 696 of 1,228 controls and glossary words under the tap size (controls under 44 px, words under 24);
- 1,259 of 3,642 pieces of text under 14 px, down to 11 px;
- four screens with a table or panel that scrolled sideways (the council, the great lords, the realm list, the battle);
- a two-row top bar holding a clock of 30 px buttons;
- every prompt drawn as a desktop box in the middle of the screen, with the hint over its woodcut and the report flag over its last choice;
- a portrait column that left the event's text 200 px wide;
- the market 3,500 px down the Holdings page;
- your health two taps away;
- the full map and the war room with no pinch zoom.

**What it does** (`phone.core.js`; all of it below 760 px, the release's own phone width, and nothing on a desktop).

- **A dock and a tab bar under the thumb.**
  - The clock (Play, a speed button that steps 1 to 5, Next, Quiet) moves to a dock just above the tab bar, so the commonest tap sits where the thumb rests.
  - The top bar is one sticky row: the date and age, initiative, coin, Save, Menu.
  - The tab bar keeps the release's six sections, icons over short captions. It is set in leather, with a gold rule and a lit ground on the page you are on, and clears the home indicator (safe-area insets).
- **Cards sized for thumbs.**
  - Every control is at least 44 × 44 px: buttons, sub-tabs, selects, fields, summaries, checkbox rows, the tooltip's close button, and the names and avatars that open a person (a 44 px reach without moving the line).
  - A glossary word (59-tooltips) is at least 24 px, WCAG 2.5.8's size. Making every glossary word 44 px would open every sentence.
  - Text is 14 px or more. The one exception is the tab bar's captions, at 13 px.
  - The frame inside a frame is gone, so the cards run to 8 px gutters.
  - On a touch screen the duel's keyboard numbers are hidden.
- **Prompts as sheets.**
  - Every modal rises from the bottom, full width.
  - Events, sieges, missions and line battles are full-height sheets. The woodcut (61) bleeds to the sheet's edges at the top. The speaker's miniature sits beside the title, so the text runs full width. The choices sit at the bottom of the sheet, in the thumb's half, and stay pinned there while long text scrolls above them.
  - A hint becomes a banner above the sheet. The report flag rides in the sheet's top corner, not over the choices.
  - Odds go under a choice's words instead of squeezing them into three lines.
- **You at the top of Now.** The desktop shows the profile beside the page. The phone opens Now with a compact card: the miniature (63), the name, and Health and Happiness, each one tap from its breakdown. The You page itself becomes a compact card, the miniature beside the name and chips, not a 300 px figure above them.
- **A person's sheet** puts what lies between you and what you can do together first, and their particulars after.
- **Long tables become stacked cards.** Each row is a card. The first cell is its title, each other cell is labelled with its column, and a cell holding a control goes to the right. This covers the armorer, the market, the trade roads, property, the council and the great lords.
- **An index on long pages.** A page with four or more sections opens with "On this page" buttons that jump to each (Holdings: What you carry, Armorer, Market of Kingsmere, Trade roads, Property).
- **Maps.** On the full map and the war room, two fingers zoom about their midpoint and one finger still pans. The tactical battle's field is drawn at 640 px in a frame that pans sideways, so its unit labels can be read.
- **The title and the new life.** "Begin a new life" is above the fold on an iPhone SE. The steps of a new life ride at the bottom of the screen, so "Be born" is always in reach.
- **Small accessibility fixes the phone layout needed:**
  - a name for the nameless avatar buttons beside a person's name;
  - a keyboard way into the full map's side panel once it scrolls.

**Measured by** (`test.mjs`, on the full build, 65 features at the last run; `audit.mjs` screenshots and measures every screen and plays the tasks).

| Test | Result |
| --- | --- |
| `phoneNoOverflow` | 35 screens at 375 px and 35 at 412 px: nothing wider than the screen, nothing past its edge, nothing that scrolls sideways (4 screens did before), nothing left under the dock and tab bar |
| `phoneTargets` | 35 screens, 1,191 targets. **0 controls under 44 px** (before: 696 controls and words under the bar), 101 glossary words between 24 and 44 px, none under 24. 3,678 text elements, **0 under 14 px** except the tab bar's 13 px captions (before: 1,259) |
| `phoneAxe` | axe-core, wcag2a, wcag2aa, wcag21a and wcag21aa, at 375 px on 18 main screens: **0 violations** |
| `phoneTasks` | The ten tasks below, on a desktop, an iPhone SE and a Pixel 7. Each is at most 1.09 times its desktop cost |
| `phoneRenderPure` | 34 draws at 375 px (every page, a person, the profile, the menu, the full map, the dock, the You card): the state and the random stream are unchanged, and two passes draw the same markup |
| `phoneDesktopSame` | 15 desktop screens at 1,366 px, 11,097 elements: layout and screenshot hash identical with the phone layer on and off. A planted unscoped rule is caught |
| `phonePinch` | Full map: a spread zooms in ×3.67, a pinch zooms out ×2.75, a one-finger drag pans at the same zoom. The war room: ×3.67 and ×2.75, and it pans |
| `phoneEventSheet` | On both phones the event is a sheet that fills the screen under the hint, with its woodcut at full width and every choice in the lower half, in sight without scrolling |

**The ten tasks.** A bot plays each task from the same fresh life on each device. It taps what a player would, and scrolls only when the next thing is out of sight, and then only the least it must. Cost, a proxy for time: one tap is 1, and scrolling one screen-height is 1. The table shows the phone cost over the desktop cost.

| Task | Release phone layout (SE / Pixel) | With this feature (SE / Pixel) |
| --- | --- | --- |
| Start a life | 1.17 / 1.05 | 0.98 / 0.98 |
| Read and answer an event | 1.05 / 1.00 | 1.00 / 1.00 |
| Find your health's breakdown | **2.12 / 2.00** | 1.00 / 1.00 |
| Open a person and talk | 1.28 / 1.02 | 1.04 / 1.00 |
| Train a skill | 1.09 / 1.00 | 1.09 / 1.00 |
| Save | 1.00 / 1.00 | 1.00 / 1.00 |
| Check the market | **1.99 / 1.26** | 0.64 / 0.64 |
| Find your realm's ruler | 1.00 / 1.00 | 1.00 / 1.00 |
| Open the map and find your home | 1.05 / 1.00 | 1.01 / 1.00 |
| Read the chronicle | 1.01 / 1.00 | 1.00 / 1.00 |

The two worst were fixed by name. Health is on the Now page now, not a sub-tab away. The market is one jump from the top of Holdings: on an iPhone SE it was 3,507 px of scrolling, against 1,926 px on a desktop.

**Rules kept.**
- Everything is scoped to the phone. The stylesheet (`<style id="ph-css">`) sits inside `@media (max-width: 760px)`, and nearly every rule also needs `#game.phone` or `#modal`. Each wrapper (`UI.clkHtml`, `UI.renderTab`, `UI.render`, `UI.refreshTab`, `UI.renderModal`) does nothing unless `UI.isPhone()`. `phoneDesktopSame` holds this.
- Drawing is pure. The wrappers only reshape markup already drawn: they add column labels to cells, add buttons with `data-a`, move a node, and set attributes. Nothing touches `A.S` or the random stream. New actions (`phSpeed`, `phJump`) go through `UI.A`, with no inline handlers.
- Every interpolated value goes through `UI.esc`. There is no new state, so old saves are untouched.

**Limits.**
- **Tasks without people.** The ratio is a bot's taps and scrolling, not timed players. The plan's "5 of 5 new players" needs people, and the phone half of it needs real thumbs on real phones (iOS Safari is not tested; this is Chromium's mobile emulation).
- **The read-and-answer task follows the world.** The event the bot meets depends on the build's event packs. In the current build it is a hunt, so the task ends in a fight after one tap.
- **The World tab's own map** is still the whole world at 359 px and cannot be zoomed. Its "Full map" button opens the map that pans and pinches.
- **The war room** is usable but dense at 375 px. Its own panels (Command, Forces, Wars) stack under a map that fills the screen. A phone-first war room would be its own design.
- **The battle field pans sideways,** but its canvas is the release's: labels at 640 px are readable, not comfortable.
- **13 px tab captions** are the one size under 14. "Chronicle" does not fit a 62 px column at 14.
- **The tests need the full build.** They open screens from 59-tooltips, 61-illumination, 63-miniatures, 65-mods and 66-markets, so `--only=phone` boots but its phone tests fail on the missing screens.
- **Found on the way, outside this folder:**
  - The first draw of Holdings sets `pc.cargo = {}` at any width (66-markets), a one-time state change from rendering.
  - The release's coarse-pointer rule `.click{display:inline-flex}` laid the new-life option cards out sideways on touch screens; fixed here, on phones.
  - The avatar buttons in People's "Beside you" have no accessible name on the desktop either; named here, on phones.

**Cycle 1: the opening view** (first-hour I4). A new life on a phone opens on **Story**, where the birth is told, not on a
near-empty Now; and Story carries the sub-tab badge when new lines have come in since it was last open
(`phoneOpensStory`). The badge reads the log only.
