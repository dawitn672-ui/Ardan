# 77-offline-fonts: the typefaces ship inside the page

**Why.** The page loaded its typefaces (in the release, Alegreya, Cinzel and Cinzel Decorative) from Google Fonts. Opened offline, or behind a network filter that blocks Google (a school, an office), the game fell back to a plain serif, and the console showed failed requests. A playtest build has to look the same wherever it is opened.

**What.**
- `patches.mjs` replaces the three `<link>` tags with the same `@font-face` rules Google serves. Each rule carries its woff2 file as a `data:` URL.
- The fonts are the Latin and Latin Extended subsets: 12 files in `fonts/`, listed in `fonts/faces.json`. Each family's weights are one variable file. They add about 376 KB to the page (282 KB of woff2 before base64).
- **The families follow the redesign** (`docs/design/brief.md` §2, built by 91-look): Literata (variable 400–700, italic 400–600) for prose, Atkinson Hyperlegible Next (400–700, italic 400) for the interface, Cinzel (600–700) for names and titles, and Dela Gothic One (400) for the big moments. The release's Alegreya and Cinzel Decorative are no longer shipped: before the redesign the page carried 228 KB of woff2 (8 files, about 303 KB base64).
- **How the files were fetched:** the Google Fonts CSS2 API (`family=Literata:ital,wght@0,400..700;1,400..600&family=Atkinson+Hyperlegible+Next:ital,wght@0,400..700;1,400&family=Cinzel:wght@600..700&family=Dela+Gothic+One`) with a current browser's User-Agent, keeping only the `latin` and `latin-ext` faces and their `unicode-range`. Literata is requested without its `opsz` axis, so Google serves one optical size (the default) rather than the whole axis.
- With nothing fetched from Google, the Content-Security-Policy (from 00-security) drops `fonts.googleapis.com` and `fonts.gstatic.com`. `font-src` now allows only `data:`.

**Licence.** All four families are under the SIL Open Font License 1.1, which allows bundling them with software. The same licence applies to the copies here.

**Test.** `ofOffline` opens the game in a browser with no network. It checks four things: all four families load from the page in every style used, nothing is requested off the page, nothing fails to load, and the policy refuses nothing. The build without this feature fails it.
