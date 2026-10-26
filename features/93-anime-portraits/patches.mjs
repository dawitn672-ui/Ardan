// Anime portraits (anime.core.js): one menu setting.
export default [
  {
    id: 'AP-MENU',
    blob: 'ardan-core',
    why: 'The menu gains the setting "Anime portraits", on by default; off brings back the woodcut miniatures of ' +
      '63-miniatures (or the release\'s portraits when those are off too). It sits with the display settings, just above ' +
      'the theme.',
    edits: [[
      '<label class="row">Theme <select data-c="setTheme"',
      '${UI.ANIME?UI.ANIME.menu():""}<label class="row">Theme <select data-c="setTheme"',
    ]],
  },
];
