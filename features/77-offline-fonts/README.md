# 77-offline-fonts: the typefaces ship inside the page

**Why.** The page loaded Alegreya, Cinzel and Cinzel Decorative from Google Fonts. Opened offline, or behind a network filter that blocks Google (a school, an office), the game fell back to a plain serif, and the console showed failed requests. A playtest build has to look the same wherever it is opened.

**What.**
- `patches.mjs` replaces the three `<link>` tags with the same `@font-face` rules Google serves. Each rule carries its woff2 file as a `data:` URL.
- The fonts are the Latin and Latin Extended subsets: 8 files in `fonts/`, listed in `fonts/faces.json`. Cinzel's 600 and 700 are one variable file. They add about 330 KB to the page.
- With nothing fetched from Google, the Content-Security-Policy (from 00-security) drops `fonts.googleapis.com` and `fonts.gstatic.com`. `font-src` now allows only `data:`.

**Licence.** All three families are under the SIL Open Font License 1.1, which allows bundling them with software. The same licence applies to the copies here.

**Test.** `ofOffline` opens the game in a browser with no network. It checks four things: all three families load from the page in every style used, nothing is requested off the page, nothing fails to load, and the policy refuses nothing. The build without this feature fails it.
