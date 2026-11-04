// Accessibility fixes in the release's markup (a11y.core.js holds the rest).
export default [
  {
    id: 'A11Y-LOG-FOCUS',
    blob: 'ardan-core',
    why: 'The story log is a scrolling column with no focusable content once a life\'s story is longer than the screen, so a ' +
      'keyboard user could not scroll it (axe: scrollable-region-focusable, found by 61-illumination\'s scan of the ' +
      'Chronicle and map tabs). It is now a labelled region that takes focus.',
    edits: [['let h=\'<div id="log">\'', 'let h=\'<div id="log" tabindex="0" role="region" aria-label="The story so far">\'']],
  },
];
