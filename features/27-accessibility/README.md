# Accessibility pass (WCAG 2.2 AA)

**Aspect:** UI and UX · **Kind:** system (small)

The release claimed "0 axe findings" because it was audited against WCAG 2.1 only. Against WCAG 2.2 AA plus axe's best-practice rules, 24 screens in both themes showed:

- **target-size** (serious): 120 tooltip triggers 20px tall, under the 24px minimum;
- **region**: 34 elements outside any landmark;
- **page-has-heading-one**: 22 screens without an h1;
- **landmark-one-main**: 4 screens without a main landmark.

The fixes are in `a11y.core.js`:

- **Target size:** `.tipt` triggers get `min-height: 24px`.
- **Landmarks:** the title and creation screens get `role="main"` on `#app`. The game screen already has `<main id="side">`.
- **Headings:** every screen gets exactly one h1. On the game screen it is visually hidden and names the life being played.

**Measured by:** `bench/run.mjs --only=a11y` and the `accessibilityAxe` test.

**Limits.**
- About 2,300 text-on-texture nodes are reported by axe as "needs review" for contrast, because it cannot compute contrast over background images. They need a human check or solid backing behind the text.
- The map canvases are still mouse-only.
