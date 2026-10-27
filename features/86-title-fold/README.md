# 86-title-fold: "Begin a new life" is in sight

**Why.** The title screen draws its map strip 579 px tall whatever the window. On 1280×800, 1366×768 and 1440×900, the commonest laptop screens, the buttons began at 891 px, below the bottom edge. A new player saw a map and a paragraph and had to know to scroll. The playtest's first task is to start a life. Found on a playtest pass of the screens.

**What.** On desktop widths the strip takes the height the window can spare: the window less about 430 px for the title, the lines under the map and the buttons. It is never more than its own 579 px or less than 220. Only the height is set, so the canvas keeps its shape and draws smaller (`fold.core.js`, one CSS rule). Full HD and phones are unchanged.

**Test.** `tfInSight`: at 1280×800, 1366×768 and 1440×900, "Begin a new life" ends inside the window. On every desktop size the map keeps its shape within 2%. The phone layout (71-phone) crops the strip on purpose with `object-fit: cover`. The button is in sight on 1920×1080 and on a phone, as before.

## Cycle 1: the title pitches the Great Continent (first-hour B3, visual I4)

The title said "Thirty-four realms, a hundred million souls" over the old Known World strip, with five buttons of one
weight. Now (`fold.core.js`):
- the sky behind the screen is 94-woodblock-skies' dawn print (`UI.SKIES.svg`, the brief's hour table), full-bleed,
  with a veil so the words read;
- the map is the whole Great Continent, drawn once from 99-far-lands' own grid (every province's cells) in 62's day-print
  colours: washi land tinted by realm, ink borders and coast, a Prussian-blue sea. No world is built for it (about 40 ms,
  where a Great Continent world takes 1.1 s);
- the pitch counts the realms (152, as the creation screen counts them) and provinces from the same data, and says a life
  is lived a week or a month at a time;
- "Begin a new life" is the one primary button; the rest are quiet.

With no far lands (or the Known World as the menu's lands) the release's strip and words stay. Tests: `tfGreat`, and
`tfInSight` as before. Not done (lane V's): the 60 s parallax drift of the ridges and the seeded busts along the bottom.
