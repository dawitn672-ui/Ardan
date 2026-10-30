# Ardan design system brief: "Woodblock & Light"

*Oct 26. The system the redesign builds from. The reasons and sources are in `docs/design/research.md`, and the problems it fixes are in `docs/design/critique.md`. Where this brief and `docs/art/style-guide.md` disagree, this brief is the proposal; the owner approves it before the style guide is rewritten.*

## 0. The direction in one paragraph

Ardan's prints are woodcuts today: ink line, flat colour, seeded variety. Japanese colour woodblock prints (ukiyo-e) are the same craft, and they are where manga and anime colour comes from: flat fills, a strong line, graded skies (*bokashi*), Prussian blue. So the game moves from a European woodcut on brown leather to **a colour woodblock lit like an anime film**:

- a Prussian-blue night ground;
- gold for what you can act on, vermilion for danger;
- cel-shaded portraits with a rim light;
- big graded skies over flat layered land;
- Persona-style diagonal cut-ins for the big moments only.

Reading surfaces stay calm, level and dense. The Chronicle keeps its vellum page as the one place the old manuscript look survives, as "the book" inside the game.

**Three rules hold everything together:**

1. **Light comes from the upper left, everywhere:** portraits, vignettes, icons, button bevels, shadows.
2. **Black is used only for line.** Shadows are coloured (indigo-violet). Light is warm (gold) by day and cool (blue) by night.
3. **Style for moments, plainness for reading.** Angles, big type and motion are kept for events opening, choices landing, battles and new years. Lists, numbers and prose are never angled.

---

## 1. Colour tokens

Every text token below was computed against every surface it can sit on (script in Appendix A). The ratio given is the **worst case** across those surfaces. AA needs 4.5:1 for text and 3:1 for control boundaries and meaningful graphics.

### 1.1 Surfaces and ink

| Token | Role | Dark ("Night") | Light ("Washi") |
| --- | --- | --- | --- |
| `--bg` | page ground, gaps between panels | `#0d1120` | `#f2ede2` |
| `--surface` | panels, columns | `#141a2c` | `#faf7f0` |
| `--raised` | cards, tiles, buttons at rest, choice rows | `#1b2338` | `#ffffff` |
| `--overlay` | tooltips, menus, popovers | `#232c46` | `#ffffff` (+ `--e-2` shadow) |
| `--sunken` | bar tracks, inputs, the log well | `#0a0d18` | `#e9e2d3` |
| `--line` | decorative dividers only (never the only edge of a control) | `#2c3654` | `#ddd3c0` |
| `--line-strong` | control borders, focusable edges | `#6e7bab` (≥3.78:1) | `#8c8270` (≥3.25:1) |
| `--ink` | main text | `#eee8da` (≥11.3) | `#1d2033` (≥12.5) |
| `--ink-2` | secondary text | `#bdb8cc` (≥7.2) | `#3a3e55` (≥8.1) |
| `--ink-3` | captions, dates, hints (still AA) | `#9a9cb8` (≥5.1) | `#565a70` (≥5.3) |
| `--focus` | focus ring, 2 px, offset 2 px | `#ffe08a` (≥10.7) | `#1f5ea8` (≥5.0) |
| `--shade` | cel shadow tint (art only) | `#3a2f6b` | `#3a2f6b` |
| `--line-ink` | the line in all art | `#1b1730` | `#1b1730` |

**The vellum page** (the Chronicle only, both themes) keeps the style guide's values:

- page `#ece0c4`;
- ink `#2b1d10` (12.5:1);
- rubric `#9e2b1b` (5.7:1);
- sub-heading ochre `#6b4410` (6.5:1).

### 1.2 Accent and status

| Token | Role | Dark | Light |
| --- | --- | --- | --- |
| `--accent` | accent text, active tab, links | `#f0c062` (≥8.2) | `#7f5100` (≥5.3) |
| `--accent-fill` | primary button fill | `#e8b04a` | `#e0a43a` with a 1 px `#8a5a10` border (border ≥4.6:1; the fill alone is 2.1:1 on washi) |
| `--accent-fill-hover` | primary hover | `#f3c56a` | `#eab452` |
| `--on-accent` | text on the gold fill | `#1a1206` (9.5:1) | `#1a1206` (8.4:1) |
| `--accent-glow` | glow colour | `rgba(240,192,98,.30)` | none (use a 2 px border) |
| `--danger` | danger text, losses | `#ff8a73` (≥6.0) | `#a82d1a` (≥5.3) |
| `--danger-fill` | danger button | `#c23c27` with white text (5.3:1) and a 1 px `#ff8a73` border | `#b8351f` with white text (5.9:1) |
| `--ok` | gains, success | `#6fd49a` (≥7.6) | `#1a6a41` (≥5.1) |
| `--warn` | warnings (not odds) | `#f5c451` (≥8.5) | `#7f5300` (≥5.2) |
| `--info` | neutral facts, links in tooltips | `#8cc0ff` (≥7.3) | `#1f5ea8` (≥5.0) |

### 1.3 The six stats

Each stat has one colour and one icon, used everywhere it appears:

- the profile;
- a check on a choice;
- tooltips;
- deltas;
- level-ups.

The bar fill uses the same colour as the text, so it passes 3:1 against its track in both themes.

| Stat | Icon | Dark | Light | Worst ratio (dark / light) |
| --- | --- | --- | --- | --- |
| `--st-str` Strength | clenched fist | `#ff8f73` | `#a8321a` | 6.2 / 5.2 |
| `--st-spd` Speed | wing | `#5fd8cc` | `#0a6b62` | 8.0 / 4.9 |
| `--st-ins` Combat instincts | open eye | `#c4a6ff` | `#6b45c2` | 6.7 / 5.0 |
| `--st-sta` Stamina | flame | `#9bdc6e` | `#366b17` | 8.5 / 5.0 |
| `--st-int` Intelligence | lamp | `#7fb2ff` | `#2759b8` | 6.4 / 5.1 |
| `--st-wil` Willpower | peak | `#ff8cc6` | `#a8286c` | 6.5 / 5.1 |

**Vitals** (health, happiness, looks, renown, honour, piety) use neutral `--ink-2` bars, so they do not compete with the stats. There are two exceptions:

- **Health** uses `--vital-health`: `#ff7070` dark, `#b3261e` light (≥5.1 both).
- **Renown** uses `--accent`.

Any vital under 25 turns its number `--danger` and adds a ▼ glyph.

### 1.4 Odds bands (event choices and checks)

The engine's bands are kept exactly: **likely** at 75% and up, **even odds** at 50–74%, **risky** at 30–49% and **long odds** under 30%.

| Band | Pips | Dark | Light |
| --- | --- | --- | --- |
| `--odds-likely` | ●●●● | `#6fd49a` | `#1a6a41` |
| `--odds-even` | ●●●○ | `#f0c062` | `#7f5100` |
| `--odds-risky` | ●●○○ | `#ff9e57` | `#9a4300` |
| `--odds-long` | ●○○○ | `#ff7a85` | `#b3261e` |

The badge is band-colour text on a 14% tint of the band over `--raised`:

- dark: likely 6.4, even 6.8, risky 5.9, long 5.0;
- light: all ≥5.4 (with a 12% tint).

Badges are only placed on `--raised`. The word and the pips carry the meaning without colour.

### 1.5 Rarity tiers

Rarity uses the ladder this audience already reads from gacha games. Use it **only** for rarity:

- gear quality and masterworks;
- fighting tier (Brawler, Veteran and up);
- once-in-a-life events;
- legendary beasts;
- deeds and achievements.

| Tier | Gem | Dark | Light |
| --- | --- | --- | --- |
| `--r-common` | ◇ | `#b3b8c9` | `#5c6070` |
| `--r-uncommon` | ◆ | `#74d68a` | `#1f6c33` |
| `--r-rare` | ◆◆ | `#6cb6ff` | `#1f5fb3` |
| `--r-epic` | ◆◆◆ | `#c59bff` | `#7a3fc4` |
| `--r-legendary` | ★ | `#ffb648` | `#8a4f00` |
| `--r-mythic` | ✦ | `#ff7a6b` | `#a82d1a` |

All tier colours pass 4.5:1 as text on every surface (dark ≥5.4, light ≥4.8). A rarity item shows:

- a 2 px border in the tier colour;
- the gem glyph;
- in dark, a glow of the tier colour at 30% alpha and 14 px blur.

### 1.6 Realm and house colours

Realms carry their own hex in state. Never print the raw value as text. A pure, memoized helper, `UI.realmInk(hex, theme)`, returns four values:

1. **Validate.** Match `/^#[0-9a-f]{6}$/i`, or fall back to `#8a8f9e`. 63-miniatures already validates colours like this.
2. **`swatch`**, the raw colour. Use it only for fills of at least 8×8 px with a `--line-strong` border: map regions, banner cloth, chips' dots.
3. **`tint`**, the raw colour mixed into `--surface`: 18% in dark, 14% in light. It is the background for a realm's rows, cards and the portrait ground. `--ink` on a tint measured ≥9.5:1 for red, blue, green, purple and yellow realms.
4. **`ink`**, for text:
   - convert to OKLCH;
   - dark: clamp L to 0.74–0.90; light: clamp L to 0.30–0.46;
   - cut chroma to 0.16 if out of gamut;
   - step L by 0.02 until it reaches ≥4.5:1 on `--surface` and `--raised`.
5. **`glow`**, the swatch at 30% alpha, for a selected realm on the map.

On the map, if two neighbouring realms are closer than 0.08 in OKLab distance, the smaller one gets a 45° hatch overlay in `--line-ink` at 25%. A realm colour always appears with the realm's name or coat of arms, never alone.

---

## 2. Typography

### 2.1 Families (all SIL OFL 1.1, embedded as woff2 data URLs, like 77-offline-fonts)

| Role | Google Fonts family | Weights | Latin + Latin Ext (measured) |
| --- | --- | --- | --- |
| Prose: the log, event text, the Chronicle, obituaries | **Literata** (no `opsz` axis) | variable 400–700, italic 400–600 | 38.1 + 31.5 KB, italic 39.3 + 31.6 KB |
| UI: labels, buttons, numbers, tooltips | **Atkinson Hyperlegible Next** | variable 400–700, italic 400 | 33.2 + 18.6 KB, italic 13.8 + 7.7 KB |
| Display: names, screen titles, illuminated initials | **Cinzel** | variable 600–700 (already embedded) | 25.3 + 14.2 KB |
| Impact: cut-ins, big numbers in moments | **Dela Gothic One** | 400 | 13.5 + 8.9 KB |

- **Total:** 276 KB of woff2, about 368 KB once base64'd into the page. Today's fonts are 228 KB of woff2 (Alegreya 4 files, Cinzel, Cinzel Decorative), about 303 KB base64'd.
- **Net cost:** about +65 KB in the page.
- **What is dropped:** Alegreya and Cinzel Decorative.
- **A smaller variant:** dropping Literata's Latin Extended italic and Atkinson's Latin Extended italic saves 39 KB.
- **Why Literata:** at 15 px it looks as large as Alegreya at 16.6 px (x-height 0.51 against 0.46), and it stays crisp at 14.
- **Why Atkinson Hyperlegible Next:** unambiguous digits and letter shapes, with tabular figures.
- **Use `font-variant-numeric: tabular-nums`** on every number that can change.

### 2.2 Scale (desktop; every size is multiplied by the existing `--tx` text-size setting)

| Token | Size / line | Family, weight | Use |
| --- | --- | --- | --- |
| `--t-cap` | 12 / 16, caps, +0.06em | Atkinson 700 | section headers, tab labels, badge words. **The smallest text in the game.** |
| `--t-small` | 13 / 18 | Atkinson 400 | captions, dates in the log, tooltip body, tile labels on narrow tiles |
| `--t-ui` | 14 / 20 | Atkinson 400 and 600 | default UI text, buttons, rows, choice labels |
| `--t-num` | 14 / 20 | Atkinson 700, tabular | numbers in rows and bars |
| `--t-prose` | 15 / 23 | Literata 400 (italic for asides) | the story log, event text |
| `--t-h3` | 16 / 22 | Atkinson 700 | card titles, tooltip titles |
| `--t-num-lg` | 20 / 24 | Atkinson 700, tabular | stat tile numbers, coin in the top bar |
| `--t-name` | 18 / 24 | Cinzel 700 | a person's name, event titles in lists |
| `--t-h2` | 22 / 28 | Cinzel 700 | event titles, screen titles, modal titles |
| `--t-h1` | 30 / 36 | Cinzel 700 | the title screen, obituary name |
| `--t-display` | 44 / 48 (64 / 64 at ≥1600 px) | Dela Gothic One | cut-in words: VICTORY, PROMOTED, 1106 |

- **Phone (≤760 px):** `--t-prose` is 16 / 25, `--t-ui` 15 / 21, `--t-small` 14 / 19, and `--t-cap` 13 / 18. This keeps 71-phone's 14 px floor for running text.
- **Measure:** prose is capped at 68ch. Event text in a 566 px column is about 72 characters per line at 15 px.
- **Headings and names are flush left,** on the same edge as the text below them. Centred text is kept for the title screen and cut-ins.
- **Today's 17 px body becomes 15 px (prose) and 14 px (UI).** With the tighter line heights, a column holds about a third more.

---

## 3. Space, shape, depth

### 3.1 Spacing (4 px base; every height is a multiple of 4)

`--sp-0` 2 · `--sp-1` 4 · `--sp-2` 8 · `--sp-3` 12 · `--sp-4` 16 · `--sp-5` 24 · `--sp-6` 32 · `--sp-7` 48

- 4 px inside a group, 8 px between items, 12 px between groups, 16 to 24 px between sections.
- **Row heights:**
  - `--row-xs` 24 for data rows (people, stats, proficiencies);
  - `--row-s` 28 for small buttons and chips on desktop;
  - `--row-m` 32 for buttons, inputs, expander headers and tabs;
  - `--row-l` 40 for primary buttons and the tab strip;
  - `--row-touch` 44 for every control under `pointer: coarse`, which keeps 71-phone's rule.
- **Panel padding:** 12 px at 1366, 16 px at 1920, 12 px on phone.

### 3.2 Radii and the cut corner

- `--r-xs` 3: bars, pips, badges.
- `--r-s` 6: buttons, inputs, segmented controls.
- `--r-m` 10: cards, tiles, choice rows.
- `--r-l` 14: event card, sheets, modals.
- `--r-pill` 999: chips, count badges.
- **The cut corner** (`--cut` 8 px; 12 px on the event card): the top-left and bottom-right corners cut at 45°. It is Ardan's signature shape, a descendant of the style guide's corner brackets and of Persona and Star Rail panels. Use it only on:
  - the primary button;
  - the event card;
  - portrait frames;
  - cut-in bands;
  - the active tab marker.
- **Build it so focus still shows.** Put the chamfered background on `::before` with `clip-path: polygon(...)`, and leave the element itself unclipped. A clipped element would also clip its own focus outline.

### 3.3 Borders, elevation and glow

- **Borders:** 1 px `--line` between sections. 1 px `--line-strong` on controls. 2 px `--accent` on the selected item. 2 px `--focus` ring, offset 2 px, so it contrasts with the surface rather than with the gold button (on the button itself it would be 1.5:1).
- **Elevation (dark):**
  - `--e-1`: `inset 0 1px 0 rgba(255,255,255,.05), 0 1px 2px rgba(0,0,0,.45)` for tiles and buttons;
  - `--e-2`: `0 6px 16px rgba(4,6,14,.45)` for tooltips and menus;
  - `--e-3`: `0 18px 48px rgba(4,6,14,.6)` for the event card and sheets.
- **Elevation (light):** the same offsets in `rgba(40,30,10,.12 / .16 / .22)`.
- **Glow (dark only):**
  - `--glow-accent`: `0 0 0 1px rgba(240,192,98,.55), 0 0 18px rgba(240,192,98,.28)` on hover of the primary button, on the selected tab and on "What now" #1;
  - `--glow-danger` and `--glow-tier` are the same shape in those colours.
  - In light the glow becomes a 2 px border.
- **One card level.** A section is a card on `--surface` and nothing inside it is framed again. Inner groups separate by space and a 1 px `--line` rule. This removes the three nested frames the critique counted.
- **The ground behind the panels:**
  - dark: `--bg` with a seeded star field of 1 px dots at 20% alpha and a far ridge silhouette along the bottom 48 px in `#111731`, as inline SVG;
  - light: a washi fibre texture (`feTurbulence` at 3% alpha, as a `data:` SVG background, which the CSP allows).
  - The ground is static: no motion, and no `A.rand` (seed it from the world seed through a hash, the way `A.npcStyles` does).

---

## 4. Layout

**The goal:** at 1366×768, everything important on the Life screen is visible without scrolling. Only the story log scrolls, because it is a log. Today the Life panel is 4.9 screens and the profile 1.9.

**Breakpoints:**

- ≤760 px: phone, as in 71-phone;
- 761–1099 px: two columns;
- 1100–1599 px: three columns, compact;
- ≥1600 px: three columns, roomy.

### 4.1 1366×768: three columns, compact

```
┌──────────────────────────────────────────── top bar 44 ──────────────────────────────────────────────┐
│ ARDAN  2 Apr 1105 · 20 │ ▶ Play │ 1 2 3 4 5 ⏭ │ ☾ │ ⧗ 7.0/7 ▬▬▬ │        Kingsmere, Aldmark │ ☀ 0 │ 💾 ☰ │
├───────── rail 248 ─────────┬──────────────── centre 598 ─────────────────┬────────── panel 488 ──────────┤
│ [bust 88] HAWISE           │ 1105 AR · age 20                            │ ☼Life ⚇People ⚔Path ⌂Hold ♛Realm ❦Book │ 40
│           of Kingsmere     │  1 Jan  The world of Ardan…                 │ [ Now | Decisions ]          32│
│           Farmhand         │  It is the dawn of 1105…                    │ ▾ WHAT NOW                 3 │ 32
│ (Human)(Northfolk)(+4)     │                                             │  1 Train in an extra session ›│ 36
│ ♥ Health 88 ▬▬ ☀ Happy 61 ▬│   (story log: Literata 15/23,               │  2 Look for love             ›│ 36
│ ◐ Looks 72 ▬  ✿ Renown 0 ▬ │    68ch, newest at the bottom,              │  3 Work under a master       ›│ 36
│ ⛨ Honor 53 ▬  ♰ Piety 30 ▬ │    the only scrolling region)               │ ▸ YOUR DAYS · Push for advancement · steady │ 32
│ ┌STR 34┐┌SPD 28┐┌INS 30┐   │                                             │ ▾ ACTIVITIES              30 │ 32
│ └▬▬▬▬▬┘└▬▬▬▬▬┘└▬▬▬▬▬┘       │   An event docks here as a scene card       │ [tile][tile][tile]            │ 10 rows
│ ┌STA 38┐┌INT 23┐┌WIL 29┐   │   (see 5.9), over the log, not as a         │ [tile][tile][tile]            │ × 40
│ Needs: rest 70 company 58… │   modal over the whole screen.              │ …                             │
│ ▾ PROFICIENCIES          5 │                                             │                               │
│ Survival & hunting 23 ▬    │                                             │                               │
│ ▸ BODY · sound             │                                             │                               │
│ [Profile] [Family]         │                                             │                               │
└────────────────────────────┴─────────────────────────────────────────────┴───────────────────────────────┘
```

- **Grid:** `grid-template-columns: 248px minmax(480px, 1fr) 488px`, gap 8, outer padding 8, no outer frame. Column height is 768 − 44 − 16 = **708 px**.
- **Rail budget** (708):

  | Block | px |
  | --- | --- |
  | Identity: bust 88 beside name, post and chips | 112 |
  | Trait chips, one row, overflow as "+4" | 24 |
  | Vitals, 2 columns × 3 rows of 24 | 72 |
  | Stats, 3 × 2 stat tiles of 36 + gap | 80 |
  | Needs, from 35-moods, moved here from the Life tab, 2 × 2 rows of 24 | 48 |
  | Proficiencies expander, header 32 + 5 rows of 22 | 142 |
  | Body expander, collapsed | 32 |
  | Buttons | 32 |
  | Gaps and padding | 80 |
  | **Total** | **622** |

- **Panel budget** (708):

  | Block | px |
  | --- | --- |
  | Tab strip | 40 |
  | Now / Decisions segmented control | 32 |
  | What now: header 32 + 3 rows of 36 | 140 |
  | Your days, collapsed to its summary header (opening it shows Training, How hard and Free hours in 3 rows of 32 plus the breakthrough bar) | 32 |
  | Activities header | 32 |
  | Activities: 30 tiles, 3 columns, 10 rows of 36 + 4 gap | 400 |
  | Gaps | 32 |
  | **Total** | **708** |

  When the player opens Your days, Activities scrolls inside its own expander, and nothing else moves.
- **A real 768-px laptop** gives a browser window about 650 px tall. There, the rail's proficiencies show 3 rows, and the Activities grid scrolls about 3 rows inside itself. The page never scrolls.
- **Centre:** the story log, `--sunken` well, padding 16, prose capped at 68ch. The first-run hint ("Not sure what to do?…", 53 px today) becomes a one-time tooltip on the What now header.

### 4.2 1920×1080: three columns, roomy

- `grid-template-columns: 300px minmax(560px, 1fr) 600px`, gap 12, padding 16, top bar 52. The layout's max width is 1760 px, centred, and the ground shows at the sides.
- **Rail:** the full-figure portrait (200×300) above the name, because the column is 996 px tall. Stats become a 2×3 grid of tiles with sparklines, and all proficiencies show.
- **Centre:** prose 16 / 25, measure 68ch, the event card up to 720 px wide.
- **Panel:** Activities in 4 columns. Your days is open by default.
- Nothing scrolls on Life except the log.

### 4.3 761–1099 px: two columns

- `grid-template-columns: minmax(420px, 1fr) 440px`.
- The rail becomes a 64 px identity strip across the top of the centre column: bust 48, name, health and happiness mini bars, and a "Stats" button that opens the full rail as a popover sheet.
- Activities in 2 columns.

### 4.4 390×844 phone

```
┌──────── top bar 48 ────────┐  date · ▶ Play · speed (popover) · ☰
│ [bust 40] Hawise  ♥88 ☀61 ⧗7│  identity strip 56: tap = the You screen
├────────────────────────────┤
│  content, 12 px gutters    │  Life: What now (one row, "Next: Train in an
│                            │  extra session ›", 44), Your days header 44,
│                            │  Activities 2 columns × 15 rows of 44 + 4
│                            │  → about 1.1 screens (today 5.1)
├──────── tab bar 56 ────────┤  Life · Story · People · Path · More
└──── + safe-area inset ─────┘
```

- **Content height:** 844 − 48 − 56 − 56 = 684 px.
- **Events** open as a full-screen sheet with its own scroll, and the page behind it does not scroll:
  - vignette 390×140;
  - title;
  - text at 16 / 25 (80 words is about 11 lines, 275 px);
  - choices at least 52 px each.

  That is one screen in all; today it is 5.2.
- The phone keeps 71-phone's 44 px targets, its 14 px text floor and its bottom bar.

### 4.5 The other tabs: small multiples, not cards

- **People:** rows of 24 px: bust 20, name, relation chip, opinion bar 48 px, age, three key numbers. Twenty people fit in one panel. Selecting a row opens the person in the centre column.
- **Holdings** (9.2 screens today): one 24 px row per holding, with a 60×16 sparkline of income over ten years and its numbers, grouped by type in expanders with count badges. The goal is 2 screens or less.
- **Realm** (3.5 screens): a header band with the realm's tint, coat of arms, ruler bust and four headline numbers with sparklines. The council and the lords as small-multiple rows. Laws in an expander.
- **Path & War** (3.7 screens): your post and its ladder as one horizontal track. Wars as rows, each with a strength bar of us against them.

---

## 5. Components

Every component uses the tokens above, works by `data-a` / `data-v` with `UI.A` (no inline handlers), escapes every value with `UI.esc`, and renders purely, with no `A.rand` and no changes to `A.S`.

### 5.1 Buttons

| Variant | Rest | Hover | Active (pressed) | Focus-visible | Disabled |
| --- | --- | --- | --- | --- | --- |
| **Primary** (Play, Begin, Confirm; at most one per view) | `--accent-fill`, `--on-accent` text, Atkinson 700 14, height 40 (32 in the top bar), cut corner | `--accent-fill-hover` + `--glow-accent` | `translateY(1px)`, fill darkened 8%, glow off, 80 ms | 2 px `--focus` ring, offset 2 | `--raised` fill, `--ink-3` text, no glow, `aria-disabled="true"`, stays focusable, the reason in its tooltip |
| **Secondary** | `--raised`, 1 px `--line-strong`, `--ink` text, height 32, `--r-s` | border `--accent`, text `--accent` | `--sunken` fill, 1px down | the same ring | `--line` border, `--ink-3` text |
| **Ghost** (icon buttons, Skip, More) | transparent, `--ink-2` text, height 32 | `--raised` fill, `--ink` text | `--sunken` | the same ring | `--ink-3` |
| **Danger** (Disown, Abdicate, Burn) | `--danger-fill`, white text, 1 px `--danger` border, height 32 | +`--glow-danger` | darkened 8% | the same ring | as secondary disabled |

- **Icons:** 16 px, gap 6 px. Icon-only buttons are 32×32 with an `aria-label` and a tooltip.
- **Disabled buttons always say why,** in their tooltip ("Needs 2 initiative; you have 1").
- **Under `pointer: coarse`,** every button is at least 44 px tall.

### 5.2 Tabs (the panel's section tabs)

- Height 40.
- Each tab: an icon (18) over a `--t-cap` label, or the icon beside the label at ≥1600 px.
- **Rest:** `--ink-2`.
- **Hover:** `--ink`.
- **Selected:** `--accent` text, a 3 px `--accent` bar under it with the cut corner, and the tab's background `--raised`.
- **Keyboard:** arrow keys move between tabs (the WAI-ARIA tabs pattern), and Enter or Space selects.
- **A notification dot** (6 px, `--danger`) means something waits in that tab. Never use a number unless the number matters.

**Segmented control** (Now | Decisions, How hard, game speed):

- height 32, `--sunken` track, 1 px `--line-strong`;
- the selected segment is `--raised` with `--accent` text and a 2 px accent underline;
- segments are at least 44 px wide.

### 5.3 Expanders (collapsible sections)

```
▾  WHAT NOW                                   [3]   ·  first: Train in an extra session
```

- **The header** is one `<button aria-expanded aria-controls>`, full width, height 32 (44 on touch). Inside it:
  - a chevron, 12 px, rotating 0° to 90° in 160 ms;
  - the title in `--t-cap` `--ink-2`;
  - a count badge (pill, 18 px tall, Atkinson 700 12, `--sunken` fill, `--ink-2` text; `--accent` fill and `--on-accent` text when it holds something new);
  - right-aligned, a **one-line summary** in `--t-small` `--ink-3`, so a closed section still informs ("Push for advancement · steady", "2 new letters", "sound in every part").
- **The body** is revealed by height and opacity in 200 ms (opacity only under reduced motion). It is `hidden` when closed, so screen readers skip it.
- **Remembered state:** keyed by a stable section id (`life.whatnow`, `rail.prof`, `holdings.mines`) in `UI.set.open`, saved with the other settings, never in `A.S`. Missing keys use the section's default. Old saves have no key, which is fine.
- **Defaults at 1366×768:**
  - open: What now, Activities, Proficiencies;
  - closed: Your days, Body, Decisions' long lists.
- **Never auto-collapse what the player opened.**
- "Collapse all" and "Expand all" go in the panel's overflow menu.

### 5.4 Stat bars and stat tiles

**Bar:**

- height 6 (rail) or 4 (rows), `--r-xs`, track `--sunken`, flat fill in the stat's colour, no gradient and no border;
- the potential is a 2 px tick in `--ink` at 60% alpha;
- the number is right-aligned in `--t-num`.

**Stat tile** (the rail, 3 × 2):

- 72×36 (three across the 224 px inner rail, 4 px gaps): icon 14 in the stat colour, label `--t-cap` (STR), number `--t-num-lg`, a bar along the bottom edge;
- a tooltip on hover or focus with the breakdown (59-tooltips).

**Delta flash:** when a value changes, the number shows "+2" in `--ok` or "−3" in `--danger` with ▲ or ▼ beside it for 1.6 s. The bar's new segment pulses once (300 ms). Under reduced motion there is no pulse.

**Sparkline:** 60×16, 1.5 px line in `--ink-2`, the last point a 3 px dot in the stat or accent colour. No axes. Its tooltip gives the minimum, the maximum and the years.

### 5.5 Chips

- Height 22 (28 on touch), padding 0 8, `--r-pill`, Atkinson 600 12.
- **Trait** chip: transparent, 1 px `--line-strong`, `--ink-2`.
- **Status** chip (married, at war, in prison): a 14% tint of its status colour, text in that colour.
- **Realm** chip: an 8 px swatch dot, the name in `realm.ink`.
- **Rarity** chip: tier border 1.5 px, gem glyph, tier text.
- **Overflow:** "+4" as a ghost chip that opens a popover with the rest.

### 5.6 Cards and tiles

- **Card** (one level only): `--surface` fill, 1 px `--line`, `--r-m`, padding 12, a header row of 32 (title `--t-cap`, actions right).
- **Activity tile:** 36 tall (44 on touch), `--raised`, 1 px `--line`, `--r-m`, `--e-1`. Inside it:
  - the group icon, 16, in `--ink-3`;
  - the label in `--t-ui` 600, clamped to 2 lines (at 13 px when it wraps);
  - the cost badge at the right: "1⧗" in `--t-num` `--ink-2`, or "free" in `--ok`.
- **Tile states:**
  - hover: border `--accent`, label `--accent`;
  - pressed: `--sunken`;
  - an "only now" tile (the life stage's own) has a 2 px `--accent` left edge;
  - disabled: `--ink-3`, the reason in its tooltip.
- **The tile's tooltip** holds today's two-line description, the cost, the stat it trains, and its group's name.
- **Group order is fixed.** A 12 px gap breaks the grid between groups, with no header row. The group icon carries the grouping by similarity.

### 5.7 Modals and sheets

- Used for confirmations, the profile, the family tree and settings. **Events are not modals** (5.9).
- **Desktop:** centred, `--surface`, `--r-l`, `--e-3`, width 560 (confirm 400, profile 880), max height viewport − 48.
- **Header:** 48, the title in `--t-h2` Cinzel, a close ghost button.
- **Footer:** right-aligned buttons, primary last.
- **The scrim** is `rgba(5,7,15,.72)` in dark and `rgba(40,30,10,.45)` in light.
- **Phone:** a bottom sheet with an 8 px grab handle, full width, max height 92%.
- **Behaviour:** focus is trapped, Esc closes, focus returns to the opener, and the page behind does not scroll.

### 5.8 Tooltips (59-tooltips' behaviour, one look)

- `--overlay`, 1 px `--line-strong`, `--r-s` (8), `--e-2`, max width 320, padding 8 12.
- Title in `--t-h3`, body in `--t-small` `--ink-2`, numbers `--t-num`.
- A 6 px arrow.
- **Opening:** after 250 ms of hover, at once on focus, on tap on touch.
- **Pinned** (click, or hover for 1 s): a 2 px `--accent` top edge and a small pin glyph.
- **Nesting:** words inside a tooltip that open their own are `--info` with a dotted underline.
- **Esc** closes the top one.
- **Motion:** fade and 4 px rise, 140 ms; fade only under reduced motion.

### 5.9 The event scene card (replaces the event modal)

The event docks over the centre column, so the player can still see their stats and needs while choosing.

```
┌─────────────── vignette 598 × 187 (16:5) ───────────────┐
│ bokashi sky, ridges, silhouette subject      [cartouche]│
│                                                          │
├──[bust 72, overlapping the vignette edge by 24]──────────┤
│ THE REEVE'S EYE                            ◆ rare event  │  title: Cinzel 22
│ Garrick of Kingsmere, the reeve, watches you work for    │  prose: Literata 15/23
│ a week, then asks if you would oversee the lord's…       │
│ Every family here has a story from the coronation…       │  aside: Literata italic 13, --ink-3
│ ┌1┐ Take it                                    (+coin)   │  choice rows ≥ 44
│ ┌2┐ Ask what it leads to     [✊ STR 34]  47% risky ●●○○ │
│ ┌3┐ Refuse politely          [☾ WIL 29]  81% likely ●●●●│
└──────────────────────────────────────────────────────────┘
```

- **The card:** `--surface`, `--r-l` with the 12 px cut corner, `--e-3`, width = centre column (max 720), padding 16. At 1366×768 it measures 187 + 40 + 140 + 20 + 4×44 + 3×6 + 32 ≈ 613 px of the 708.
- **A choice row** is a button:
  - height ≥44, `--raised`, 1 px `--line`, `--r-m`;
  - a number-key badge (22×22, `--sunken`, `--t-num`);
  - the label in `--t-ui` 600 (12 words or fewer, as CLAUDE.md requires);
  - right-aligned, in order: the **check chip** (the stat icon and short name in the stat colour, with your value), the **odds badge** (`62%`, `--t-num`, then the band word in `--t-cap`, then 4 pips, on the band tint), and an **effect hint** where one is known (`+coin`, `−honour`, in `--ok` or `--danger`, ▲▼).
- **Choice states:**
  - **hover:** border `--accent`, and a −8° gold "slash" (a `::before` band at 10% alpha) slides in from the left behind the label in 160 ms (the Persona touch, kept behind the text);
  - **focus:** the ring;
  - **pressed:** `--sunken`, then the card resolves.
- **Keys** 1–6 choose, as today.
- **A one-time choice** (`once: true`, or an irreversible fx such as `die` or `disown`) has a 2 px `--danger` left edge and the cap word "ONCE". Disco Elysium's red check is the model.
- **The result** replaces the choices in place: Literata text, then a row of delta chips (`+2 ✊ Strength`, `−3 ☀ Happiness`), then a Continue button (primary, key Enter). No second modal.
- **On phone** it is a full-screen sheet (4.4).

### 5.10 Toasts and cut-ins

**Toast:**

- bottom right on desktop, 16 px from the edges, above the report flag; top of the content on phone;
- `--overlay`, `--r-m`, `--e-2`, a 3 px left edge in its kind's colour (ok, danger, info, accent), width 320;
- an icon, one line of title and one line of detail;
- it stays 4 s (8 s when it holds a button), pauses on hover or focus, at most 3 stacked, newest on top;
- `aria-live="polite"`.

**Cut-in** (big moments only: a battle or duel opening, victory and defeat, a promotion, a coronation, a birth, a death, the new year):

- a full-width band at −10°, 120 px tall at 1366, `--line-ink` fill with a 6 px `--accent` band offset behind it;
- the word in `--t-display` Dela Gothic One, `--ink`;
- a seeded burst of 24 to 40 focus lines from the band's centre (inline SVG polygons, `--ink` at 25%);
- the subject's bust at 120 px on the left, cel-shaded with a rim light;
- **timing:** 220 ms in, 700 ms hold, 260 ms out, 1.2 s in all;
- a click or a key skips it;
- **at most one per game month;** if several are due, show only the most important;
- **reduced motion:** a static banner that fades in, stays 1.5 s and fades out.

**Settings:** cut-ins have their own switch, "Moment cut-ins", which is on by default.

---

## 6. Motion

Motion explains a change: where a thing came from, what changed and what you pressed. It never decorates reading.

| Token | Duration | Easing | Used for |
| --- | --- | --- | --- |
| `--m-press` | 80 ms | `cubic-bezier(.2,0,0,1)` | button and tile press |
| `--m-quick` | 140 ms | `cubic-bezier(.2,.8,.2,1)` | hover colour, tooltip in, chevron |
| `--m-base` | 200 ms | `cubic-bezier(.2,.8,.2,1)` | expander open and close, tab change (crossfade) |
| `--m-enter` | 280 ms | `cubic-bezier(.05,.7,.1,1)` (Material's emphasized decelerate) | event card in (12 px rise + fade), sheet up, toast in |
| `--m-exit` | 180 ms | `cubic-bezier(.3,0,.8,.15)` | anything leaving |
| `--m-snap` | 240 ms | `cubic-bezier(.3,1.4,.5,1)` (a small overshoot) | badges and deltas popping in, the odds badge on first show; never on panels |
| `--m-moment` | 1,200 ms total | in `--m-enter`, out `--m-exit` | cut-ins |
| `--m-ink` | 700 ms | `ease-out` | 61-illumination's ink-in for prints, kept |

- **Animate only `transform` and `opacity`** (plus `color` and `background-color` on hover). Never width, height or top; expanders use `grid-template-rows: 0fr → 1fr`.
- **No looping motion on screen while reading.** The exceptions are a slow drift of the title-screen parallax (60 s cycles) and a 2 s breathing glow on the Play button while the game is paused for an event.
- **Reduced motion.** `@media (prefers-reduced-motion: reduce)` and the game's own **Motion** setting (Full, Reduced, Off; default "Follow system") turn every transform into an opacity fade of 120 ms or less, stop parallax, cut-ins and the hover slash, and keep colour changes.
  - "Off" also removes the fades.
  - The release's blanket `1ms !important` rule stays as the floor.
- **Determinism.** No animation reads `A.rand`. Seeded effects (focus lines, star fields) hash ids and the year.

---

## 7. Art direction

### 7.1 Portraits: cel-shaded anime busts

A new renderer reuses 63-miniatures' skeleton (parts by hash of id, culture tables, wounds, age, the `UI.set` toggle, the fallback to the release) and changes the drawing. It covers four sizes: a bust (1:1) at 20, 32, 48, 72, 88 and 120 px, and a full figure (2:3) at 200×300.

**Proportions** (head box 100 wide × 120 tall; the cranium is a circle of radius 50 at (50, 50)):

| Part | Adult | Teen | Child | Old (60+) |
| --- | --- | --- | --- | --- |
| Figure height in heads | 6.5 | 6 | 4.5 (infant 3) | 6.3 |
| Eye line (from the top) | y 64 | y 66 | y 70 | y 61 |
| Eye width each / gap | 20 / 16 | 21 / 15 | 23 / 13 | 18 / 17 |
| Eye opening height | 13 (12 men, 15 women) | 15 | 17 | 10 |
| Chin | y 118; men's jaw corners at y 104, chin 18 wide; women and the young a softer V | y 114 | y 108, round | y 120, jowl line |
| Nose | a short tick on the shadow side at y 86; no nostrils except orcs and dwarves | y 85 | a dot at y 84 | longer, y 88 |
| Mouth | y 100, 14 wide, one stroke; the curve follows happiness | y 98 | y 96, 10 wide | y 102, thinner |
| Ears | from the brow (y 52) to the nose (y 86); elves +40 up and back | | | larger lobes |

**Eyes**, built in layers, back to front:

1. the white, `#f6f1ea`, with a shadow under the upper lid (`--shade` at 35%, 3 units);
2. the iris, an upright oval 11×15, cropped by the lids, in two tones (base and a darker top third);
3. the pupil, 4×6;
4. two catchlights, r 2.6 at the upper left (the light side) and r 1.2 at the lower right;
5. the upper lash line last, 3 units thick at the outer third and tapering inward, with a flick at the outer corner (women and elves longer);
6. the lower lid, one short thin stroke.

The brows are tapered strokes at y 52; their angle follows mood and the traits stern, kind and proud.

**Level of detail:**

- under 48 px: no pupil and no small catchlight; brows heavier.
- under 32 px: the silhouette, the hair colour, two eye marks and the ground. A 20 px bust is a silhouette and a colour.

**Hair**, in three groups:

1. **Back mass**, drawn behind the head: short, bob, shoulder, long, tied, braid, bun, topknot, shaved or hooded. Its silhouette carries the character.
2. **Side locks.**
3. **Bangs:** 5 to 9 pointed clumps made of quadratic curves, with seeded offsets.

The catalogue is 12 bangs × 10 back masses × 6 extras (ponytail, braid, bun, pins, a feather, a band), weighted by culture through 63's culture table. Each mass has a base colour, one shadow band under the bangs and down the back (the base multiplied by `--shade` at 40%), and the "angel ring" highlight: 3 to 5 short arcs at 30% of head height, base + 18 L. Greying follows age, as 63 does.

**Shading** (every part):

- light from the upper left;
- one hard-edged shadow shape per part (the base multiplied by `--shade` at 35%), with no gradients on skin or cloth;
- a second shadow only for occlusion: under the chin, under the hair, inside a hood;
- **a rim light** of 1.5 units on the right edge of the silhouette, in the ground's light colour: warm `#ffe7b0` by day, cool `#a8c8ff` at night or in sacred and royal frames. Taking the rim from the background ties the figure to its scene, as Hades and Arcane do.

**Line:**

- `--line-ink` `#1b1730`, never pure black;
- the outer silhouette 2.2 units, inner lines 1.1;
- lines inside skin are coloured: the skin base darkened 55% (*iro-trace*);
- no wobble filter at bust sizes (it blurs small lines); keep it for the full figure.

**Shape language by people:**

- humans mixed;
- elves long verticals and points;
- half-elves shorter points;
- dwarves squares and a broad beard mass;
- orcs heavy wedges, tusks and a brow ridge;
- giants big masses with small heads.

Every person must read as a black silhouette at 32 px.

**Expression** follows mood and the event: neutral, smile, grin, frown, sad, angry, surprised, eyes closed (asleep and the dead), and a blush (three short diagonal strokes) for romance. Expressions are chosen from state at draw time, so drawing stays pure.

**Frame and ground:**

- a square frame with the cut corner, `--r-s`, 1.5 px `--line-strong`;
- the ground is a bokashi gradient from the realm's tint at the top to `--surface` at the bottom, with the house charge large and faint (12% alpha) behind the head;
- rulers: a 2 px `--r-legendary` frame and a small crown badge at the top right;
- nobles: a 2 px `--accent` frame;
- the dead: desaturated to 20% chroma, an ink-wash ground and an `--ink-3` frame.

**Budget:** a bust at most 8 KB of SVG, a full figure at most 18 KB, at most 1 ms to build. Cache by id, age bucket, wounds, gear hash and theme.

### 7.2 Event vignettes: colour woodblock skies

These restyle 61-illumination's 25 compositions. The shapes, the seeds, the season and hour rules and the "same event, same year, same picture" rule all stay. The size is 16:5: 598×187 at 1366, 720×225 at 1920 and 390×140 on phone.

**The layers, back to front:**

1. **Sky:** a linear gradient of 3 or 4 stops from the hour table below, plus the *ichimonji* band, a darker stripe 10% tall across the very top, as in Hiroshige.
2. **Celestial:** the sun (a disc with a 2-stop glow), or the moon, or seeded stars (1 px dots); flat two-tone clouds, lit edge up.
3. **Far ridge:** seeded midpoint-displacement line, the fill 70% toward the sky colour, blurred 1.2 px.
4. **Mid ridge:** 40% toward the sky.
5. **Near ground:** flat dark, with a 1.5 px rim light along its top edge in the hour's light colour.
6. **Subject:** 61's silhouette (keep, hall, forge, ship and the rest), redrawn in flat colour with `--line-ink` line and one light window or fire with a soft glow (`feGaussianBlur` 4 px at 60%).
7. **Framing** (optional, seeded): a branch, a banner edge or reeds in the near corner, cropped by the frame.
8. **Weather:** rain as diagonal hairlines at 20%, snow as dots, fog as a pale band over the mid ridge.
9. **Cartouche:** a small upright box in the top-right corner, `--surface` at 85% with a 1 px `--line-ink` border, holding the place name in Cinzel 12. No invented Japanese text.

**The hour table.** Five colours per hour: sky top, sky bottom, far land, near land, light.

| Hour | Sky top | Sky bottom | Far | Near | Light |
| --- | --- | --- | --- | --- | --- |
| Dawn | `#2a3a6e` | `#f2a77a` | `#6d6a9a` | `#2a2440` | `#ffd9a0` |
| Day | `#3f7fc8` | `#bfe3f2` | `#7fa6b8` | `#2f4a3a` | `#fff3c4` |
| Golden hour | `#3b4f8f` | `#ffc46b` | `#a0789a` | `#3a2a2e` | `#ffcf7a` |
| Dusk | `#1d2350` | `#d9637a` | `#5a4a7a` | `#1e1a2e` | `#ff9e8a` |
| Night | `#0b1030` | `#27345e` | `#2a3358` | `#0e1122` | `#a8c8ff` |
| Storm | `#2b3040` | `#6e7487` | `#4a5060` | `#1c1f28` | `#d8e0ff` |

Terrain shifts the land colours:

- forest: greener near land;
- steppe: ochre;
- desert: sand and terracotta;
- coast: a sea band in Prussian blue `#1f3f7a` with *seigaiha* wave arcs;
- marsh: olive;
- mountain: blue-grey with snow caps;
- winter: everything +15 L and −30% chroma.

**The mood mapping by event shape:** births and the new year at dawn, love and weddings at golden hour, deaths and graves at dusk, crimes and taverns at night, battles in storm or golden hour.

**Size:** 6 to 15 KB each, as 61 is now.

### 7.3 The map

62-inked-map's system stays: its zoom levels, banners and town icons. The style changes:

- **Sea:** a Prussian-blue bokashi, light at the coast (`#5f8fc8`) and deep offshore (`#173063`), with a 1 px coastline ripple repeated 2 or 3 times at falling alpha, and *seigaiha* arcs at low zoom.
- **Land:** washi cream `#efe6d2`, with the realm colour as a flat tint (35%) and the border as 2 px `realm.ink` plus 1 px `--line-ink`.
- **Mountains:** triangular glyphs, two-tone (lit left, `--shade` right), with snow on the high ones.
- **Forests:** clusters of round cel trees.
- **Towns:** small house glyphs; the capital gets a banner in the house colour.
- **Armies:** banners in the house colour, with arrows showing next month's planned move (the Into the Breach lesson). The boxes stay as the clarity option.
- **Selection:** the selected realm gets `realm.glow`; hover shows a 1 px `--accent` outline.
- **The map is always a day print,** for legibility, in both themes. Only its frame follows the theme.

### 7.4 Iconography

- **Grid:** 24×24, drawn at 16, 20 and 24.
- **Stroke:** 1.75 at 24 (scaled with the icon), round caps and joins.
- **Colour:** `currentColor`, plus at most one filled accent shape.
- **Light:** from the upper left in filled versions.
- **Subjects:** period objects only (no gears, no smartphones).
- **The set** (about 40):
  - **stats:** fist, wing, eye, flame, lamp, peak;
  - **vitals:** heart, sun, mirror, laurel, shield, candle;
  - **resources:** sun-coin, hourglass (initiative), broken coin (debt);
  - **the 13 action groups:** sprout (only now), book (body and mind), two cups (social), candle (faith), herb (health), bow (wilds), laurel (glory), coin pouch (money), road (world), banner (war), mask (intrigue), knife (crime), anvil (work);
  - **the tabs:** sun (Life), people, crossed swords (Path & War), house (Holdings), crown (Realm), open book (Chronicle);
  - **UI:** chevron, pin, close, menu, save, play, next, quiet, info, warning, check, lock.
- **Labels:** an icon is always labelled the first time it appears on a screen, and in its tooltip. Test each icon on someone who has not played: shown alone, is it read right? A heart read as "turns" is the failure to avoid.

---

## 8. The 15 highest-impact changes, in order

1. **Fix the column budgets of the three-column layout** (4.1), because it is the owner's first complaint and turns the Life screen from 4.9 screens plus a 1.9-screen rail into one screen.
2. **Turn the 30 activity cards into a 3-column grid of 36 px tiles with their descriptions in tooltips**, because those cards are about 1,900 px of the Life tab's 2,749.
3. **Give every section an expander with a summary header and a remembered open state**, because NN/g's accordion case (many short sections) is exactly the Life, Holdings and Realm tabs, and the summary keeps closed sections informative.
4. **Rebuild the rail as a compact identity block** (bust 88 beside the name, stats as 3 × 2 tiles, needs moved in), because the 300 px portrait card pushes everything else below the fold.
5. **Change the type to Literata 15 for prose, Atkinson Hyperlegible Next 14 for UI, Cinzel for names and Dela Gothic One for cut-ins**, because it fits about a third more per screen with no loss of readability, and its digits cannot be misread.
6. **Replace the brown leather with the Night and Washi token sets**, including role colours for stats, odds, tiers and realms, because the critique found the screen monochrome, and colour with a meaning is the cheapest hierarchy there is.
7. **Dock events as a scene card in the centre column, with a vignette, a bust and choice rows carrying check chips and odds badges**, because events are the game's main surface, and the player should see their stats while choosing (Disco Elysium; the HSR pop-up lesson).
8. **Show every choice's result in place with delta chips**, because Norman's feedback principle is the most visible gap today: players compare numbers by hand.
9. **Draw portraits as cel-shaded anime busts with layered eyes, hair masses, a rim light and a realm ground**, because portraits are the strongest "anime" signal for this audience and appear on almost every screen.
10. **Restyle the 25 woodcut vignettes as colour woodblock skies** (bokashi, ridges, light), because it is the bridge from the current art to anime, and it reuses all of 61-illumination's seeds and compositions.
11. **Add the phone layout's identity strip, 2-column tiles and full-screen event sheet**, because the phone's Life screen is 5.1 screens and its event 5.2, and the audience plays on phones.
12. **Make People, Holdings and Realm small-multiple rows with sparklines**, because Holdings at 9.2 screens is the worst scroll in the game, and rows let a glance compare twenty items (Tufte).
13. **Draw a set of about 40 icons** for stats, vitals, resources, action groups and tabs, because icons let the dense layout shed words, as Slay the Spire's intents do.
14. **Add cut-ins for the big moments, limited to one per month and skippable**, because they give the Persona-style energy the owner asked for without slowing play or touching the reading surfaces.
15. **Ship the motion tokens and the Motion setting** (Follow system, Full, Reduced, Off), because every effect above needs a reduced variant, and many players never find the OS switch.

---

## 9. How to build it in this repo

- **Feature folders:**
  - `90-tokens` (CSS variables for both themes, the fonts, the base resets);
  - `91-layout` (grid, rail, panel, expanders, tiles);
  - `92-scene-card` (events);
  - `93-anime-portraits`;
  - `94-woodblock-skies`;
  - `95-icons`;
  - `96-moments` (toasts and cut-ins);
  - `97-small-multiples` (People, Holdings, Realm rows).

  Each owns only its folder (CLAUDE.md, "Parallel safety").
- **CSS goes in one `<style>` element per feature,** appended by `*.core.js`. Patches only add hooks; never reformat a blob.
- **Tokens first.** `90-tokens` maps the release's names (`--surface-1`, `--text-1`, `--accent` and the rest) onto the new tokens, so the whole old UI takes the new colours on the first day, before any layout work.
- **Tests each feature adds:**
  - **`fitsOneScreen`:** at 1366×768 on the Life tab (the `LIFE()` screen from 71-phone), `#tabbody` and `#profile` have `scrollHeight ≤ clientHeight + 4` with default expander states. At 1920×1080 the same holds with Your days open.
  - **`phoneLife`:** the Life page is at most 1.25 screens at 390×844, and an event fits in one sheet.
  - **`tokensContrast`:** reads the computed values of every text token on every surface in both themes and asserts 4.5:1 (3:1 for `--line-strong`, `--focus` and bar fills).
  - **`expanderMemory`:** open a section, re-render and reload settings, and it is still open. An old save with no `UI.set.open` renders the defaults.
  - **`portraitPure` and `skyPure`:** drawing leaves `A.S` and `A.rngState` unchanged, and the same input gives the same string.
  - **`reducedMotion`:** with `reducedMotion: 'reduce'`, no element has a running transform animation after a choice, a cut-in or a tab change.
  - **axe:** 0 violations on the main screens in both themes, as 27-accessibility requires.
- **Fonts:** reuse 77-offline-fonts' method (Latin and Latin Extended files, `unicode-range`, data URLs, `font-src data:`). Update `faces.json` and its `ofOffline` test.

---

## Appendix A. The contrast check

The ratios above came from this check (WCAG 2.x relative luminance). Re-run it whenever a token changes.

```python
def lum(h):
    r, g, b = (int(h[i:i+2], 16) / 255 for i in (1, 3, 5))
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
def ratio(a, b):
    hi, lo = sorted((lum(a), lum(b)), reverse=True)
    return (hi + 0.05) / (lo + 0.05)
DARK  = ['#0d1120', '#141a2c', '#1b2338', '#232c46', '#0a0d18']   # bg surface raised overlay sunken
LIGHT = ['#f2ede2', '#faf7f0', '#ffffff', '#e9e2d3']              # bg surface raised/overlay sunken
# each text token: min(ratio(token, s) for s in surfaces) >= 4.5
```

**Results** (worst surface):

- **Dark:** ink 11.3, ink-2 7.2, ink-3 5.1, accent 8.2, danger 6.0, ok 7.6, warn 8.5, info 7.3, the stats 6.2–8.5, the tiers 5.4–7.9, health 5.1, line-strong 3.78 (on bg, surface and raised), focus 10.7.
- **Light:** ink 12.5, ink-2 8.1, ink-3 5.3, accent 5.3, danger 5.3, ok 5.1, warn 5.2, info 5.0, the stats 4.9–5.2, the tiers 4.8–5.3, line-strong 3.25 (not on sunken), focus 5.0.
- **On fills:** `#1a1206` on gold 9.5 (dark) and 8.4 (light); white on danger 5.3 (dark) and 5.9 (light).
- **Odds badges** on `--raised`: ≥5.0 dark, ≥5.4 light.
