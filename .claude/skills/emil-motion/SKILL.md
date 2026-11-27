---
name: "emil-motion"
description: "Motion rules for Ardan's UI, vendored from Emil Kowalski's animation skills (MIT): should it animate at all, easing, durations, origin, interruptibility, gesture and sheet feel, frame-budget performance, making a web view feel native on a phone, and worst-case-data stress for a panel. Use before adding or changing any animation, transition, cut-in, card entrance, sheet, drag or press feedback, when motion feels sluggish or janky, and when reviewing a diff that touches CSS transitions or animations. Not for marketing or landing pages (Ardan has none), not for deciding a screen's layout or words (ardan-ui-review, ardan-design-critique), and not for React, Motion or library advice (Ardan has no framework). Ardan's own motion tokens in docs/design/brief.md section 6 win on any conflict."
---

# Emil motion rules, for Ardan

Vendored, unchanged except for a banner, from `github.com/emilkowalski/skills` (MIT; see `SOURCE.md`). Pure markdown, no scripts, no hooks, no network.

## What is here
| File | Use it for |
| --- | --- |
| `review-animations.md` | The ten standards and the escalation triggers: review a diff's motion. Findings table, then Block or Approve |
| `STANDARDS.md` | The exact numbers: frequency table, easing order, durations, springs, interruptibility, stagger, a11y |
| `animation-performance.md` | An animation drops frames: which property, which thread, what to measure |
| `gestures.md` | Drag, swipe, sheet and hold interactions that track the finger and stay interruptible |
| `mobile-native.md` | The small fixes that make a WKWebView feel like an app (tap flash, 100vh, zoom on focus, safe areas, selection) |
| `break-ui.md` | Worst-case data (long names, huge counts, empty lists) against a panel |
| `ui-cheatsheet.md`, `performance-cheatsheet.md` | One-line fixes (tabular numbers, 65ch measure, `scale(0.97)` on press) |

## In Ardan (these win over every vendored file)
1. **Only `transform` and `opacity` animate**, plus `color` and `background-color` on press. The vendored exceptions
   (`clip-path`, measured `height`, `filter: blur`) are not allowed. Expanders use `grid-template-rows: 0fr to 1fr`
   (brief section 6).
2. **Motion tokens come from `docs/design/brief.md` section 6** (`--m-press` 80 ms, `--m-quick`, `--m-base`, `--m-enter`
   280 ms, `--m-exit`, `--m-snap`, `--m-moment`). Do not paste Emil's cubic-beziers beside them. Where Emil says "never ease-in
   on UI" and the house `--m-exit` curve starts slow, the house token stays; use Emil's rule when you add a new entering
   motion (ease-out, under 300 ms, start from `scale(0.95)` plus opacity, never `scale(0)`).
3. **Nothing happens on hover.** Ignore every hover rule except "never rely on it". Colour change on press and focus is
   fine; any `:hover` motion must also exist as a press state and sit inside `@media (hover: hover) and (pointer: fine)`.
4. **Reduced motion is mandatory**: `@media (prefers-reduced-motion: reduce)` and the game's Motion setting (Full,
   Reduced, Off) turn every transform into an opacity fade of 120 ms or less (brief section 6).
5. **Pointer Events only** in any gesture (`pointerdown/move/up/cancel`, `setPointerCapture`, `touch-action`); never
   mouse or touch events alone; nothing needs the keyboard, a double-click or a right-click.
6. **Tap targets at least 44 x 44 points**; layouts from 375 px; `dvh`, `env(safe-area-inset-*)`.
7. **No library.** Ardan is plain JS and CSS in one file: skip every React, Motion, Vaul, Sonner or `npx` line. No CDN,
   no web font, no network call.
8. **Frequency rule is the one to love**: Next month and Next year are pressed again and again; give them press
   feedback only (under 100 ms), never an entrance. Event cards, cut-ins and sheets are occasional, so they may animate.
9. **Determinism and purity**: an animation never reads `A.rand` or changes `A.S` (seed effects from ids and the year).
10. **One canvas for maps**; do not animate DOM layers over it. Map pans are drawn on the canvas, redrawn on change only.

## When NOT to use
Static reading panels, lists and prose (they never animate); the title screen's parallax (already specified); anything
where deleting the animation is the right fix. Emil's own closing rule applies: when unsure, delete the motion.

## Where it runs
`ardan-ui-review` section 3 (motion) calls `review-animations.md` for any diff that adds or edits an animation, and
`mobile-native.md` before the iPhone build (`ios-capacitor-release`).
