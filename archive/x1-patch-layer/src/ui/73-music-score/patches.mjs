// The way in to the score (music.core.js): two settings in the Menu.
export default [
  {
    id: 'SCORE-MENU',
    blob: 'ardan-core',
    why: 'Visual art 7: the menu gains "Music (a quiet score for each land)", off by default, and a music volume slider. ' +
      'They sit with the sound and display settings, just above the autosave toggle.',
    edits: [[
      '<label class="row"><input type="checkbox" data-c="setAuto"',
      '${UI.SCORE?UI.SCORE.menu():""}<label class="row"><input type="checkbox" data-c="setAuto"',
    ]],
  },
];
