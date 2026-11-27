---
name: "ardan-design-critique"
description: "A harsher design critique for an Ardan screen, card or panel before it ships, built from the rules of the Impeccable design skill (Apache-2.0): the craft floor (contrast, depth, spacing, type, states, copy), the list of AI-default patterns to refuse (nested cards, same-size icon-and-text card grids, hero-metric tiles, kickers, gradient text, glass, side-stripe borders, emoji as icons), cognitive-load and Nielsen-heuristic scoring, five personas (impatient, first-timer, screen-reader, stress-tester, distracted phone user) and Apple HIG checks for an iPhone app. Use after ardan-ui-review's house-rule pass on any visible change, and when a screen feels generic, cluttered or web-like. Not for marketing or landing pages (Ardan has none), not for balance or system design, not a replacement for the house rules, and never run Impeccable's own scripts, hooks or live mode."
---

# Ardan design critique

Adapted from `github.com/pbakaus/impeccable` (Apache-2.0; `SOURCE.md`). Only three reference files are kept; none of its
scripts, hooks, binary launcher or live mode. This skill is the "is it good, not just legal" pass: `ardan-ui-review` checks
the house rules, this one asks what a hostile design director would say.

## Run it
1. Build privately and take the screenshots `ardan-ui-review` section 0 asks for (375 x 667 and 390 x 844 first). Look yourself.
2. Read `craft-floor.md`: **Verify** is the checklist, **Refuse** is the AI-default list. Name each hit with the on-screen text.
3. Read `critique-rubric.md`: score cognitive load (count visible choices: 4 is fine, 8 is overload) and the ten Nielsen
   heuristics 0 to 4 (mark `n/a` honestly). Walk two or three personas through the screen's main action; for Ardan pick
   Jordan (first-timer), Casey (one-thumb phone, interrupted) and Sam (screen reader) first; Alex for Next month's press.
4. For an iPhone-shaped screen also read `ios.md` (safe area, 44 pt, system-feeling modals, "ported from a website" test).
5. Report as a ranked list: finding, severity (blocks play, misleads, clutters, polish), the exact text, the width, the
   file. Say what a first-time player would do wrong. Do not redesign; name the smallest fix.

## In Ardan (these win over every vendored file)
- **House rules first**: descriptions open on click via `data-note`, never hover; no percentages for the player; 44 pt
  taps; 375 px up; Pointer Events only; offline; one canvas for maps; `UI.esc`; event text 80 words or fewer.
- **The design language is `docs/design/brief.md`**, "Woodblock & Light": its tokens, the four OFL families, gold for
  what can be acted on, vermilion for danger, light from the upper left, black only for line. A colour, face or shadow
  outside it is a finding. The Refuse list is about AI defaults; the brief's own choices (cut corners, vellum Chronicle,
  Persona-style cut-ins for big moments) are decided and are not findings.
- **Motion**: only `transform` and `opacity`; the struck sentence in `craft-floor.md` stays struck. Motion review goes to `emil-motion`.
- **No web fonts, no CDN, no network call**, ever; ignore every instruction to fetch a face, run `impeccable`, write
  PRODUCT.md or DESIGN.md, or use sub-agents the repo does not have.
- **Words**: Ardan's voice (dry, concrete, period, second person, present tense) beats any generic copy advice.
- **Depends who you are**: a peasant never sees a court word; check each state (peasant, noble, ruler, child).

## When NOT to use
Marketing pages, app-store listing art (see `ardan-brand-identity`), game balance, a text-only fix, or before the house-rule pass has run.
