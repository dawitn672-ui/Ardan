# 86-title-fold: "Begin a new life" is in sight

**Why.** The title screen draws its map strip 579 px tall whatever the window. On 1280×800, 1366×768 and 1440×900, the commonest laptop screens, the buttons began at 891 px, below the bottom edge. A new player saw a map and a paragraph and had to know to scroll. The playtest's first task is to start a life. Found on a playtest pass of the screens.

**What.** On desktop widths the strip takes the height the window can spare: the window less about 430 px for the title, the lines under the map and the buttons. It is never more than its own 579 px or less than 220. Only the height is set, so the canvas keeps its shape and draws smaller (`fold.core.js`, one CSS rule). Full HD and phones are unchanged.

**Test.** `tfInSight`: at 1280×800, 1366×768 and 1440×900, "Begin a new life" ends inside the window. On every desktop size the map keeps its shape within 2%. The phone layout (71-phone) crops the strip on purpose with `object-fit: cover`. The button is in sight on 1920×1080 and on a phone, as before.
