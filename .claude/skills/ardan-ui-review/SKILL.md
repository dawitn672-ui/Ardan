---
name: "ardan-ui-review"
description: "Review an Ardan screen, card, panel or event text before it ships: first impression and hierarchy, the house rules (descriptions open on click via data-note, no percentages, events of 80 words or fewer and choices of 12 or fewer, 44-point tap targets, layouts from 375 px, Pointer Events only), accessibility (contrast, focus, reduced motion) and the design tokens of docs/design/brief.md, with the repo's own tests as evidence. Use before merging any change a player can see in Ardan, and when the owner says a screen is cluttered, confusing or broken on a phone. Not for game balance or system design (life-sim-systems), not for the multi-life playtest loop (game-ux-playtest-loop), and not for web apps outside this repo."
---

# Ardan UI review

**One job:** judge one change a player can see, against Ardan's own rules, and return a short ranked list of findings
with the on-screen text and the function or file responsible. It does not redesign; it says what breaks a rule or
confuses a player, and why. Sources: `docs/MASTER_PROMPT.md` §2 and §5, `CLAUDE.md` (standing rules, iPhone build rules),
`docs/design/brief.md` (tokens), `game-ux-playtest-loop` (information design).

## 0. Get the screen
Build privately (`node tools/build.mjs --out=/tmp/ardan/<name>/x.html`) and take screenshots of the changed screen in
the states it can be in (empty, busy, a peasant, a noble, a ruler, a child) at **375 x 667** (the floor), 390, 430 and
1366 x 768; also 360 when Android matters (§5). Look at every screenshot yourself before judging.

## 1. First impression (two seconds)
- What draws the eye first, and should it? Is the screen's purpose clear without reading everything?
- Is there one obvious next action? Is anything shown that does not matter right now (§5: cut each screen to what matters;
  the rest one click deeper)? Measure clutter with `node tools/bench/clutter.mjs <html> --out=... --shots=...`; its
  numbers only fall (`src/ui/9992-story-drawer/test.mjs`).
- Does it look and behave like the screens beside it? Find the nearest existing screen of the same kind and reuse its
  parts and tokens; a new pattern needs a reason.

## 1b. The UX laws pass

Run the installed `ux-laws-review` skill (Hick, Fitts, Doherty, peak-end and the rest) on the screen and fold its
findings into this report: it is tested and catches what the house rules don't (risky choices stacked beside safe ones, a
choice count past four, a slow first response). This skill adds Ardan's own rules on top; where the two disagree, the
house rule wins (e.g. descriptions open on click, never on hover).

## 1c. Adopted design skills: which to run when

Run `ardan-design-critique` (craft floor, AI-default refusals, heuristics, personas) after this review's house-rule pass on
any visible change and before it ships; run `emil-motion` (`review-animations.md`) for any diff that adds or edits an
animation, transition or gesture, and `mobile-native.md` before an iPhone build; run `ardan-brand-identity` only for the App
Store icon, launch screen, a logo or store art. The house rules below win over all three; none of their scripts is used.

## 2. House rules (each one is a finding if broken)
- **Descriptions open on click, tap or Enter, never on hover.** A description is `data-note="..."` on a button or an
  info glyph; no `title=` of more than three words; nothing on `mouseover`/`mouseenter`. Evidence:
  `src/ui/99998-click-open/test.mjs` and `src/ui/59-descriptions/test.mjs` pass.
- **No percentages for the player.** Odds are words plus a tipped scale; amounts are words, pips or real comparisons.
  Search the rendered text of the screen for `%` and for bare `/100` scores. Percentages stay fine in tests and tools.
- **Text diet:** event text 80 words or fewer once rendered; choice labels 12 words or fewer; no unfilled `{token}`.
  Evidence: `node tools/lint-events.mjs --feature=<name> --html=<html>`; `tools/lint-choices.mjs` for an obviously best choice.
- **Tap targets at least 44 x 44** (a glossary word 24). Evidence: `src/ui/9990-tap-targets/test.mjs` (title and 13
  pages at 375 x 667, nothing scrolls sideways).
- **Phone layout:** works from 375 x 667 to a Pro Max, `env(safe-area-inset-*)` respected, `dvh` not `vh`, no sideways
  page scroll, Pointer Events only (no mouse-only events, nothing on right-click, double-click or the keyboard alone).
- **Time controls:** Next month and Next year stay in fixed places and never turn into a stop control.
- **What you see depends on who you are:** no war screen unless the player is in that war; class-fitting words (no
  "court" for a peasant); one source of truth per fact (two panels that can disagree eventually will).
- **Security:** every interpolated value through `UI.esc`; no inline handlers (`data-a`/`data-v` with `UI.A`).

## 3. Accessibility (WCAG 2.1 AA, as far as the page allows)
- Contrast: text 4.5:1, large text and controls 3:1, using the worst-case ratios in `docs/design/brief.md` §1; a colour
  not in the tokens is a finding.
- Every control has a name (`aria-label` of three words or fewer when there is no visible label); focus is visible and
  in reading order; a dialog traps and restores focus; Esc closes what a press opened.
- Motion only on `transform` and `opacity`, every animation optional under `prefers-reduced-motion`; red is for danger,
  gold for what can be acted on.

## 4. Words
- Dry, concrete, period voice; second person, present tense; no modern idiom, no stock tics (CLAUDE.md, Voice).
- A button names its action with a verb ("Ride to the muster", not "OK"); a refusal or failure says what happened and
  what the player can do now; an empty list says why it is empty and how it fills.
- The same thing has the same name on every screen.

## 5. Report
A ranked list: rule broken or confusion found, severity (blocks play, misleads, clutters, polish), exact on-screen
text, screenshot width, and the responsible file or function (`tools/show.mjs --where`). Then the evidence lines: which
tests and lints were run and their result. A screen passes when no finding is above "polish" and every test named in
section 2 passes on the build reviewed.
