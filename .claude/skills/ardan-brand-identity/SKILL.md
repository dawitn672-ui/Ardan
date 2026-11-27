---
name: "ardan-brand-identity"
description: "Brand identity knowledge for Ardan's App Store icon, launch screen, store listing and any logo or wordmark, taken from the brand-identity skill (MIT): logo and mark craft (one idea, simple primitives, tested at 16 and 32 px and in one colour), type choice, a colour palette measured for contrast and colour-blindness, cohesion of mark, type and colour as one system, the AI-default clichés to avoid, accessibility gates and what a small guideline kit holds. Use when the owner asks for the app icon, a logo, a title wordmark, store screenshots' look or brand colours, and when iOS release work reaches the 1024 x 1024 icon. Not for in-game UI screens (ardan-ui-review, ardan-design-critique), not for marketing pages, and never run the original's Python scripts or fetch Google Fonts."
---

# Ardan brand identity

Adapted from `github.com/fatihaydost/brand-identity-skill` (MIT; `SOURCE.md`). Only the eight reference cards are kept
(`references/`): they are design knowledge in prose. The scripts (`brand.py` and friends) are not here and must not be
fetched: they pull Google Fonts, GitHub raw files and PyPI packages.

## Use
1. Start from what already exists: `docs/design/brief.md` ("Woodblock & Light": Prussian-blue night, gold, vermilion,
   woodcut line, light from the upper left), the four OFL faces (Literata, Atkinson Hyperlegible Next, Cinzel, Dela Gothic
   One) and the game's own art in `assets/`. The identity is derived from these, not invented beside them.
2. Read `references/cohesion.md`, `logo.md`, `ai-defaults.md` (and `color.md`, `type.md` when a palette or face is
   being chosen). Write the one-sentence mechanism: the single idea that produces the mark, the type and the colour.
3. Make 3 directions as hand-written SVG (100-unit grid, filled primitives, no `<text>`, no filter), look at each at 1024,
   180, 32 and 16 px, in one colour and on the dark ground. One named defect per round, two rounds at most. Judge by
   eye: an automated check passes broken marks.
4. Run the reflex test against `ai-defaults.md` (three clichés of the category: crown, shield, sword, dragon, generic
   castle, gold-on-navy). Justify any hit from the brief or change it.
5. Check the contrast gates in `references/accessibility.md` by computing ratios yourself (`brief.md` appendix A has
   the formula); colour-blind pairs must differ in lightness.
6. Hand the owner the three directions side by side and a recommendation. Never pick for him; the bundle id and
   name are his (`docs/IOS_ROADMAP.md`).

## In Ardan (wins over the references)
- **Icon spec**: one 1024 x 1024 PNG, **no alpha, no pre-rounded corners** (iOS masks it), mark readable at 40 px;
  made into `assets/icon.png` and `assets/splash.png` for `npx @capacitor/assets generate --ios` (`ios-capacitor-release`).
- **Fonts**: only the four OFL families already embedded; OFL allows outlining them into a logo. Never download a font,
  never link a CDN, no network call; ignore the references' Google Fonts links.
- **Palette**: the brief's tokens first. A new brand colour needs a reason and must pass the brief's contrast check.
- **Tone**: no `brand.py`, no site extraction, no competitor scraping. Competitor study, if wanted, is the owner's screenshots.
- Ardan's rules still hold for any screen that carries the brand (taps, 375 px, click-to-open descriptions, no percentages).

## When NOT to use
In-game screens, event cards, marketing pages, or before the owner asks for a logo, icon or store art.
