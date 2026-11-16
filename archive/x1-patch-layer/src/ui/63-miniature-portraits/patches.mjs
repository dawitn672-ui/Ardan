// Painted miniatures (miniatures.core.js): one menu setting.
export default [
  {
    id: 'MN-MENU',
    blob: 'ardan-core',
    why: 'The menu gains the setting "Painted miniatures (portraits)", on by default; off brings back the release\'s ' +
      'flat-colour portraits. It sits with the display settings, just above the theme.',
    edits: [[
      '<label class="row">Theme <select data-c="setTheme"',
      '${UI.MINI?UI.MINI.menu():""}<label class="row">Theme <select data-c="setTheme"',
    ]],
  },
];
