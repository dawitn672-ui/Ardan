// The page's typefaces ship inside it, so the game looks the same with no network: a playtester who opens the file
// offline, or behind a filter that blocks Google, no longer gets the fallback serif and a console of failed font loads.
// Since the redesign (docs/design/brief.md §2, 91-look) they are four: Literata for prose, Atkinson Hyperlegible Next
// for the interface, Cinzel for names and titles, Dela Gothic One for the big moments. The release's Alegreya and
// Cinzel Decorative are no longer used and are not shipped. The fonts are the Latin and Latin Extended subsets Google
// Fonts serves (fonts/faces.json lists each file, weight range and unicode-range), under the SIL Open Font License 1.1,
// which allows bundling them. They add about 376 KB to the page (282 KB of woff2, base64). With nothing left to fetch,
// the security policy drops Google's two hosts and allows fonts only from data: URLs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fonts');
const faces = JSON.parse(fs.readFileSync(path.join(dir, 'faces.json'), 'utf8'));
const css = faces.map(f => `@font-face{font-family:'${f.family}';font-style:${f.style};font-weight:${f.weight};font-display:swap;` +
  `src:url(data:font/woff2;base64,${fs.readFileSync(path.join(dir, f.file)).toString('base64')}) format('woff2');unicode-range:${f.unicodeRange}}`).join('\n');

export default [
  {
    id: 'FONTS-INLINE',
    blob: 'html',
    why: 'Playtest readiness: the typefaces load from Google Fonts, so offline the page falls back to a plain serif and logs ' +
      'failed requests. The same @font-face rules Google serves, with the woff2 files inlined as data: URLs. The families ' +
      'are the redesign\'s (Literata, Atkinson Hyperlegible Next, Cinzel, Dela Gothic One), not the release\'s link.',
    edits: [[
      '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
        '<link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..700;1,400..600&family=Cinzel+Decorative:wght@700&family=Cinzel:wght@600;700&display=swap" rel="stylesheet">',
      `<style id="ardan-fonts">\n${css}\n</style>`,
    ]],
  },
  {
    id: 'FONTS-CSP',
    blob: 'html',
    why: 'With the fonts inlined, nothing is fetched from Google: style-src no longer lists fonts.googleapis.com, and font-src ' +
      'allows only data: URLs instead of fonts.gstatic.com.',
    edits: [[
      "style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com;",
      "style-src 'unsafe-inline'; font-src data:;",
    ]],
  },
];
