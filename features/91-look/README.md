# 91-look: Woodblock & Light, the tokens, the type and the layout

**Aspect:** UI and UX, visual design (`docs/design/brief.md` §1–6 and §9; the problems in `docs/design/critique.md`) · **Kind:** UI layer: five readable core files and one stylesheet, no patches, no events, no engine change. With 90-fold (the expanders' behaviour) and 77-offline-fonts (the typefaces).

## Why

The critique found the screen "dim and samey": one leather brown, one gold, one serif, every panel the same card with the same gold rule, 17 px body text everywhere, and three columns scrolling side by side (the Life panel 4.6 screens, the profile 1.9). The brief answers with a colour woodblock lit like an anime film: a Prussian-blue night ground, gold for what you can act on, vermilion for danger, role colours that mean the same everywhere, a type scale with four clear levels, and a layout where, at 1366×768, only the story log scrolls.

## What it does

**Tokens** (`look.a-tokens.core.js`, brief §1, §3, §6).

- The **Night** (dark) and **Washi** (light) sets: ground, surface, raised, overlay, sunken; the decorative line and the control line; three inks; focus; accent, accent fill and the text on it; danger, ok, warn, info.
- **Role palettes:** the six stats (`--st-str` … `--st-wil`), the vitals (health, and a neutral bar for the rest), the four odds bands (`--odds-likely` … `--odds-long`, the engine's own 75/50/30 cuts in `UI.LOOK.band`), the six rarity tiers (`--r-common` … `--r-mythic`, with their gems).
- **The release's names point at the new tokens** (`--bg-0` → `--sunken`, `--surface-1` → `--surface`, `--text-1` → `--ink`, `--accent-2` → `--accent-strong`, `--bad` → `--danger`, and the rest, both themes), so every screen of the old UI took the new colours at once, before any layout work.
- **The theme switch is the release's own** (Menu → Theme sets `<html data-theme>`). A switch now lands at once: with reduced motion the release's 1 ms transition floor made it ripple down the tree a frame per level, about 0.2 s.
- **Space, radii, the cut corner, elevation, glow, motion** as variables (`--sp-*`, `--row-*`, `--r-*`, `--cut`, `--e-1..3`, `--glow-accent`, `--m-press` … `--m-ink` with their easings).
- **`UI.realmInk(hex, theme)`**, pure and memoized: the colour validated (anything else becomes `#8a8f9e`), a swatch, a tint (18% / 14% into the surface), an ink (OKLCH lightness clamped, chroma cut when out of gamut, stepped until 4.5:1 on surface and raised) and a glow.

**Type** (brief §2). Literata for prose (the story log, event text, results, the chronicle), Atkinson Hyperlegible Next for the interface (labels, buttons, numbers, tooltips), Cinzel for names and titles, Dela Gothic One for big moments (the obituary's score). The scale is `--t-cap` 12 … `--t-display` 44, each times the release's text-size setting; the release's `--fs-1..9` and its fixed sizes are folded onto it, with 12 px as the floor. Today's 17 px body is 15 px prose and 14 px UI; prose is capped at 68ch; numbers are tabular. The phone keeps 71-phone's 14 px floor (its caps are 14, not the brief's 13).

**Layout** (`look.c-layout.core.js`, brief §4).

- **1366×768:** 248 / flexible / 488, gap 8, a 44 px top bar; each column is 700 px tall. The rail and the panel fit; only the story scrolls (a sunken well).
- **1100–1279:** the same three columns at 240 / flexible / 440.
- **≥1600 (roomy):** 300 / ≥560 / 600, gap 12, at most 1760 wide and centred; the full-figure portrait above the name; Your days open by default when the window is 1000 px tall or more. Activities stay in three columns (at the brief's four, 140 px tiles cut a third of their labels).
- **761–1099 (two columns):** the rail becomes a 64 px strip over the story (the bust, the name and post, health and happiness), and a **Stats** button opens the whole rail as a sheet.
- **The phone** keeps 71-phone's rules (44 px targets, its dock and tab bar, the 14 px floor) with a shorter Life page: What now as one row ("Next: …"), Your days folded to its select, the ambition (97-life-fixes) folded to its title, and the activities as tiles of 44 in **three** columns (two columns, the brief's, made the page 1.45 screens), the needs on the You page.

**The rail.** An 88 px bust (the portrait renderer's bust: 63-miniatures, or 93-anime-portraits when it is in the build) in a cut-corner frame beside the name and post, with the fighting tier as a rarity chip; the trait chips in one row with a "+N" chip that shows the rest; the six vitals 2 × 3 (health in its own red, renown in gold, a ▼ and danger colour under 25); the six stats as 3 × 2 tiles (72 × 36: icon and abbreviation in the stat's colour, the number, a bar with the potential tick); the four needs of 35-moods moved here from the Life tab; Best proficiencies open, Body folded to its summary; the profile's buttons in one row.

**The Life panel.** What now (a header with its count, three rows of 32, the first in gold); Your days folded to a header that still holds the training select (the choice made most often) and the plan's summary; Activities as **one grid of tiles**, 3 columns of 32 px, in the groups' fixed order, each tile with its group's icon and its cost ("1⧗", or "free" in green), an "only now" tile with a gold left edge, and **its description in a tooltip** (59-tooltips' engine, `UI.TIPS.act`: the description, the cost, the needs it meets, the group, and why not when it is disabled). The initiative line moved into the Activities header. The first-run hint is a callout under the What now header (over the rows, not pushing them down). Activities take the height that is left and scroll inside their own section when Your days is opened.

**Components** (`look.b-base.core.js`, brief §5).

- **Buttons:** secondary on `--raised` with a `--line-strong` edge; the **primary** gold fill with the cut corner on `::before` (so the focus ring still shows), a glow on hover by night and a 1 px `#8a5a10` border by day; ghost; danger.
- **Tabs:** icon over a cap label, the chosen one gold on `--raised` with a cut-corner bar. **Segmented controls** (Now | Decisions, How hard, the clock's speeds) on a sunken track.
- **Expanders** (90-fold's behaviour, restyled): one full-width header row (the fold button covers it; links and tooltips inside stay on top), a chevron, the title in caps, a count pill, and a one-line summary on the right when closed.
- **Bars** flat in the stat's colour on a sunken track, the potential a 2 px tick; **chips** (trait, status, rarity with the gem); **cards** at one level (a card on a panel is a section with a rule above it; a card that is a thing to pick, a person or an offer, stays a tile); **modals** and the scrim; **tooltips** on `--overlay` with one hairline and `--info` links; **toasts** bottom right with a coloured edge; **focus** a 2 px `--focus` ring offset 2.
- **Motion:** expanders, tooltips and modals rise and fade on the motion tokens; under `prefers-reduced-motion` they only fade (120 ms), and the release's 1 ms floor stays. `:root[data-motion=off|reduced]` hooks are in place for a Motion setting.

**The ground:** by night a star field and a far ridge, seeded from the world's seed through a hash (static, no `A.rand`); by day a washi fibre (`feTurbulence`, a `data:` SVG).

**Rows, rarity and realm colours** (`look.e-rows.core.js` and `UI.realmHex` in the tokens, Oct 27; brief §1.5, §1.6, §4.5, §5.5, §5.8):

- **153 realms, distinct.**
  - **The problem.** The Great Continent's 118 realms came from the lore in one pale family per land, so bordering realms read alike: 24 bordering pairs were under 0.04 apart in OKLab.
  - **What `UI.realmHex(realm)` does.** It gives each far realm an accent within 42° of its lore hue, at one of four lightnesses and two chromas. The pick keeps it apart from the realms it borders at the start, and more weakly from their neighbours. The largest realms choose first, and a tie keeps the lore colour.
  - **Where it comes from.** It reads only the generated data (`A.FL_DATA`), so it is the same in every game and after a save and load, and it never touches `A.S`.
  - **What it leaves alone.** The Known World's realms keep their colours. `UI.realmInkOf(r, theme)` is `UI.realmInk` of that colour.
  - **Who uses it.** The portrait ground (93) and the Realm band use it. The map (62) and the release's own chips still read `r.color`.
- **People as rows:** each person card is one line of about 26 px: a 22 px bust, the name, the relation, age and post, the bond chip, and a 48 px opinion bar. Twenty fit in the panel. The court on the Realm tab and person lists in dialogs use the same rows. On touch, rows are 44 px.
- **The Realm tab's header band** shows:
  - the realm's tint and its accent edge;
  - the coat of arms;
  - the name in the realm's ink;
  - the ruler's title, name and bust;
  - treasury, army, stability and provinces.
- **Holdings:** What you carry is one row per slot: the slot, the piece and its tier, what it does, and Sell. In the armourer, only the item's name is a tooltip target. The other cells only repeated it, and a click on them read as a dead control.
- **A new life opens the armourer on its first page** (Weapons, Common). `UI.shopSlot` and `UI.shopQ` used to carry over from the life before.
- **Rarity tiers:**
  - Fine is uncommon (◆) and Masterwork is epic (◆◆◆), on `UI.qualChip`. The chip has a tier border, the gem and the tier text, and a gear row takes its piece's tier.
  - `LOOK.gearTier` lifts a people's own make, a master's piece and a famed one.
  - The 37 achievements of the Dynasty tab each have a tier (`LOOK.ACH_TIER`, First Blood common to Legend mythic), shown with gem, edge and tier word, and a glow by night.
- **Realm chips** (an 8 px swatch dot, the name in the realm's ink) appear in three places:
  - a person's Realm row;
  - every People row, after the name (the realm's short name);
  - inside tooltips: a realm's name in a popover's text becomes a chip (`LOOK.chipLeaves`, on 59's `TT.open`), except in its heading, buttons and nested links.
- **The profile's "Hair & eyes" words** name what the portrait draws (`UI.ANIME.drawnApp`), so an old save's far person reads as drawn.
- **Pinned tooltips:** a tooltip pinned by a click gets a 2 px gold top edge and a pin glyph (`LOOK.syncPins`, from 59's stack).
- **A dialog's close button:** its glyph fills the 32 px button.
- **War rows:** each war of your realm on the War tab carries a strength bar of us against them: the standing armies of each side's realms, ours in green from the left and theirs in vermilion, with both numbers.
- **The rail's delta flash** (§5.4): a vital or stat that changed since the last draw of the same life shows ▲ +2 or ▼ −3 for 1.6 s, and its bar pulses once (not under reduced motion). The last numbers are UI state (`LOOK.flash`), reset for a new life or a loaded game.
- **The career ladder** is one horizontal track: a dot per rank on a line, the ranks behind you in gold, yours a larger gold dot.
- **Sparklines** (60 × 16) under the Realm band's four numbers, and on the stat tiles of the roomy rail. The game keeps no history of these numbers, so `LOOK.hist` samples them once a game month while the game is drawn. It holds at most ten years, resets for a new life or a load, and is never saved.
- **The rail's proficiency names** stay on one line with an ellipsis, so a long name cannot push the rail's buttons out of sight.
- **Beasts in the Codex** wear their tier: an animal is common, a great beast rare, a titan legendary, a legend mythic.

## Measured by (`test.mjs`)

| Test | What it holds |
| --- | --- |
| `fitsOneScreen` | 1366×768, the Life tab (71-phone's LIFE screen), default expander states: `#tabbody` and `#profile` scroll heights within 4 px of their heights, the page does not scroll, Your days folded. At 1920×1080 the same with Your days open. Reports how many activity tiles are in sight |
| `tokensContrast` | Every text token on every surface in both themes (396 pairs) at 4.5:1; `--line-strong`, `--focus` and bar fills at 3:1; the gold and danger fills with their text; the odds badges on their tint; the release's names resolve to the new tokens; `UI.realmInk` gives AA ink for 24 colours (markup and junk included) in both themes, and is pure |
| `phoneLife` | The phone's Life page at 390×844 is at most 1.3 screens, every tile at least 44 px |
| `lookAxe` | axe-core (WCAG 2.0–2.2 A/AA and best practice) on Life, People, Holdings and Realm at 1366×768 in both themes: 0 violations |
| `lookTiles` | One grid of tiles, 3 columns, at most 40 px tall, each with its group's icon and a tooltip; hovering a tile opens its name and description |
| `realmColours` | 118 far realms, 115 distinct colours, measured against the lore's colours (99 now stores the accents in state). Across 146 bordering pairs, the median OKLab distance goes from 0.088 to 0.177 and the least from 0.019 to 0.104. Pairs under 0.04: 20 before, 0 after. The Known World is unchanged. AA ink 236 of 236. Pure and stable |
| `lookRows` | People: rows of at most 26 px, 20 fit in the panel. The Realm band has 4 numbers and the name in its ink. Masterwork is epic, Fine uncommon, common plain. 37 of 37 achievements are tiered, in 6 tiers. Pure |
| `lookMore` | A war's strength bar ("Strength: us 104k against them 257k"). The delta flash: none on a life's first draws, "▼ −10" after a wound, gone after 1.6 s. 18 beasts tiered in 4 tiers. A person's Realm row is a realm chip. A pinned tooltip is marked. The same markup twice, pure |
| `lookPure` | Every tab drawn twice with the rail, the chips' "+N" and the two-column sheet toggled: state and random stream unchanged, the same markup |

**Results** (Oct 26; LIFE screen of 71-phone, a peasant of 20, hints on). Screens of scroll at 1366×768, panel / rail, session-start build → with this feature: Life 2.86 / 1.47 → **1.00 / 1.00** (all 31 tiles in sight; 27 of 31 with 97-life-fixes' ambition card, the rest one scroll inside Activities), Decisions 3.70 → 3.05, People 1.25 → 1.07, Path 3.26 → 3.02, War 2.99 → 2.53, Holdings 4.72 → 3.63, Realm 1.00 → 1.00, Dynasty 4.39 → 4.32. Phone 390×844, page: Life 2.69 → **1.20**, People 1.38 → 1.24, Holdings 6.93 → 7.00, Path 3.05 → 2.86, Story 1.22 → 1.29 (Literata sets a little wider than Alegreya), You 1.85 → 1.92 (it now carries the needs). Contrast: worst text token 5.13:1 by night, 4.84:1 by day. Fonts: 228 → 282 KB of woff2, 300 → 372 KB in the page.

## Rules kept

- Rendering is pure: the hooks run after each draw and only rewrite markup already drawn (they read the game, never `A.rand`, never write `A.S`). The open states (the chips' "+N", the two-column sheet) live in `UI.LOOK`, not in the save.
- Every value interpolated into HTML goes through `UI.esc`; actions go through `UI.A` (`lookChips`, `lookRail`); no inline handlers.
- One `<style id="look-style">`, kept last in `<head>` so that at equal weight its rules win; selectors that must beat the release's light-theme rules carry the same weight (`:root[data-theme] …`).
- No new state: old saves load unchanged.

## Left for the features after this one

The event scene card and the result in place (92), the cel-shaded portraits (93), the woodblock skies (94), the icon set (95; the activity groups use the release's icons and three of this feature's own), toasts' stacking and cut-ins (96), the small-multiple rows of People, Holdings and Realm (97: Holdings is still 2.8 screens), and a Motion setting in the menu.
