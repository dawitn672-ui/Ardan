# 84-top-bar: the place and the purse stay in sight

**Why.** The release's desktop stylesheet never lets the top bar wrap (`@media (min-width: 761px) { #topbar { flex-wrap: nowrap } }`). When the clock's controls take the room, the place and the purse are squeezed instead. With a long home name, a large purse and a debt, they shrank to 14 px and vanished at 1024 px, a common small-laptop width. At 1180 and 1280 px the debt was cut mid-word ("(debt 30 su"). It was found on a playtest pass of the screens.

**What.**
- **One group** (patch `TOP-GROUP`). The place, the purse, Save and Menu sit in one `.top-right` box that wraps to a second line as a whole. Allowed to wrap on their own, Menu dropped to a line by itself.
- **The purse never shrinks** (`topbar.core.js`). A long town name takes the ellipsis instead.
- **Icon-only buttons on mid widths.** Between 761 and 1439 px, Save and Menu show only their icons, and each keeps its aria-label. The bar then fits on one line at 1280 px, the most common laptop width, and wraps tidily below.
- **The debt in fewer words** (patch `TOP-DEBT`). "(debt 12,345 suns)" now reads "owes 12,345". The coin's tooltip and spoken label (59-tooltips) and a `title` still give it in full.
- **On a phone the group dissolves** (`display: contents`), and its buttons keep 71-phone's 44 px touch targets. The phone layout is exactly as it was.

**Test.** `tbFits` uses the longest home name in the world, 1,234,567 suns and a debt of 12,345, at 1024, 1180, 1280 and 1440 px. At each width the purse and debt must be whole and the place at least 60 px wide. That is room for the start of the longest name in the world with an ellipsis, while the bar stays one line tall from 1280 px up.
