# Design critique: the game screen (Oct 26)

Screens: the title and the Life tab at 1366×768, 1920×1080 and 390×844, a peasant of 20 in Aldmark. Measured, not guessed: the scroll heights below come from the page itself (`docs/design/critique` probe, `/tmp/ardan/ux/scroll.mjs`).

## Overall impression

A tasteful, consistent "illuminated manuscript": one leather brown, one gold, one serif. It reads as serious and old. For players of 13 to 23 it reads as dim and samey: every panel is the same brown card with the same gold rule, so nothing tells the eye where to go after the Play button. The biggest opportunity is density. The screen asks the player to scroll inside three separate columns at once.

## Usability

| Finding | Severity | Recommendation |
| --- | --- | --- |
| The Life tab is 4.6 screens tall inside its panel at 1366×768 (2,574 px in 559). Every section is open at once: What now, Your days, How you are, the stage's actions, the activities. | 🔴 Critical | Collapsible sections with a one-line summary in the header ("Your days · Living as it comes · steady"), the open state remembered per section. Default open: only the section the player most needs. |
| The profile column scrolls 1.9 screens. The portrait card alone is about 300 px tall. | 🔴 Critical | A compact identity block: a smaller portrait beside the name and chips. Vitals and stats in a two-column grid; proficiencies collapsed by default. |
| Three scrolling regions side by side. The player cannot see the profile, the log and the panel's lower half together. | 🟡 Moderate | Each column fits without scrolling in the default state at 1366×768; scrolling becomes the exception, not the rule. |
| At 1920×1080 the story log runs about 150 characters a line. | 🟡 Moderate | Cap the log's measure at about 72 characters; give the freed width to the right panel. |
| The speed control is six buttons (1–5, Next) beside Play and Quiet. | 🟢 Minor | One segmented control; Next as an icon button with a label in the tooltip. |
| Controls that do nothing when clicked (see `tools/deadclicks.mjs`). | 🔴 Critical | Each one either works, is shown disabled with the reason, or is not a button. |

## Visual hierarchy

- **What draws the eye first:** the gold Play button. That is right.
- **Reading flow:** after Play there is no second step. The portrait, the log and the What now card have the same weight, so the eye wanders.
- **Emphasis:** small caps headings, gold rules and brown cards repeat on every block. Repetition without variation flattens the hierarchy (Gestalt: similarity groups everything as one thing).

## Consistency

| Element | Issue | Recommendation |
| --- | --- | --- |
| Type | Body 17 px everywhere, small caps for headings, italic for some notes; few distinct levels. | A type scale with four clear levels (display, heading, body 15 px, small 13 px). |
| Colour | Nearly monochrome. The stats, health and happiness bars share gold. | Role colours for the six stats and the vitals; a vivid accent per realm; danger and success hues that mean the same everywhere. |
| Spacing | Cards nest inside cards (What now inside the tab body inside the column), each with its own border and padding. | One level of card. Sections divide with space and a header rule, not another frame. |

## Accessibility

- **Colour contrast:** the muted grey-brown text (log dates, captions) is near the AA limit on the brown ground. Check each muted token at 4.5:1.
- **Touch targets:** the phone layout keeps 44 px; desktop chips are about 26 px tall, fine for a mouse.
- **Text readability:** 17 px body with 1.5 line height is readable but large for a dense strategy screen. 15 px with 1.45 keeps it readable and fits a third more.

## What works well

- The Play button is unmistakably the main action.
- The What now card gives a new player three concrete next steps.
- The phone layout is its own design (a bottom tab bar, one column), not a squashed desktop.
- Nested tooltips explain almost every number.

## Priority recommendations

1. **Collapsible sections and a compact profile.** It is the owner's first complaint, and it removes most of the scrolling without hiding anything.
2. **Fix or remove every dead control.** A button that does nothing teaches the player that buttons cannot be trusted.
3. **A new visual language for a younger audience.** Higher contrast, role colours, an accent per realm, livelier type, art that leans toward anime (cel-shaded portraits, painted skies). Built from `docs/design/brief.md`.
