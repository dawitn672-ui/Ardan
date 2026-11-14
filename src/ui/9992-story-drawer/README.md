# 9992-story-drawer: the story as a drawer at laptop widths

**Aspect:** UI and UX, declutter (round 2 B5, CRITIQUE U3 and U11) · **Kind:** UI layer (`drawer.core.js`, the layout rules are in
`91-visual-style/look.c-layout.core.js`), test.

**Why.** At 1366 px the open page had 488 px (36% of the screen; 28% before 91's compact grid) beside a 598 px story and a
248 px profile, and 255 of the first view's 560 words were the story's. The owner's complaint was clutter.

**What it does (1100 to 1599 px, no phone).**

- The grid is two columns: the rail (232 px) and the open page (the rest, about 80% at 1366).
- The story is a drawer fixed over the page's right edge (40% of the window, at most 440 px). A **Story** button in the top bar
  (before Save) opens and closes it (`UI.A.storyDrawer`; `aria-expanded`, `aria-controls="logwrap"`). While shut it is
  `visibility:hidden`, out of the tab order and the first view.
- The Life page starts with a card of the newest two story lines and a "The whole story" button.
- A neutral dot on the button (and on the phone's Story page tab, `badge-new`) says new lines have come in since the drawer was
  open. Red is for danger only (U11): the war badge keeps its "!".
- 1600 px and up keeps the story as a column after the page (420 px; the rail 280, the page about half the window); 761 to 1099 keeps 91's strip over the story.

**State.** Whether the drawer is open is `UI.STORY.open`, the player's, not in the save. The class `lk-story-open` is put on
`#game` by `UI.renderGame` so every full draw keeps it. Nothing here reads or writes the game state or the random stream.

**Undo.** Delete the folder and the "B5 (U3)" block in `look.c-layout.core.js`.
