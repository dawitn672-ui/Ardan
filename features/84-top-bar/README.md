# 84-top-bar: the place and the purse stay in sight

**Why.** The release's desktop stylesheet never lets the top bar wrap (`@media (min-width: 761px) { #topbar { flex-wrap: nowrap } }`). When the clock's controls take the room, the place and the purse are squeezed instead. With a long home name, a large purse and a debt, they shrank to 14 px and vanished at 1024 px, a common small-laptop width. At 1180 and 1280 px the debt was cut mid-word ("(debt 30 su"). It was found on a playtest pass of the screens.

**What.**
- `topbar.core.js` adds two CSS rules.
  - Below 1440 px the bar may wrap, and the place and purse ask for at least 260 px, so they move to a second line rather than disappear.
  - At every desktop width the purse never shrinks; a long town name takes the ellipsis instead.
- `patches.mjs` shortens the debt beside the coin from "(debt 12,345 suns)" to "owes 12,345". The coin's tooltip and spoken label (59-tooltips) and the new `title` still give the debt in full.

**Test.** `tbFits` uses the longest home name in the world, 1,234,567 suns and a debt of 12,345, at 1024, 1180, 1280 and 1440 px. At each width the purse and debt must be whole and the place at least 60 px wide. That is room for the start of the longest name in the world with an ellipsis, while the bar stays one line tall from 1280 px up.
