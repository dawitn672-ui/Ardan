// The death screen's obituary lines are short and centred, and the release's drop cap for event text floated their
// first letter away from the rest: "M ... aster of the hunt. Died aged 50", "W ... orked, ate, loved a little".
export default [
  {
    id: 'OBIT-CAPS',
    blob: 'html',
    why: 'UI: .mbox .mtext:first-letter (a floated illuminated initial) suits an event\'s long, left-aligned text. The ' +
      'obituary (.mbox.obit: the life line and the epitaph) is centred one-liners, where the float splits the first ' +
      'word. The obituary keeps plain letters.',
    edits: [['.mbox .mtext:first-letter{', '.mbox:not(.obit) .mtext:first-letter{']],
  },
];
