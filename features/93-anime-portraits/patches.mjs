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
  {
    id: 'AP-SKINS',
    blob: 'ardan-core',
    why: 'Character creation offers only the skin tones the chosen people are drawn in (cycle 1 visual B4). A far ' +
      'people\'s portraits press the stored tone into their land\'s range, so a pale swatch picked for a lake-folk woman ' +
      'was drawn dark in the game while the preview showed her pale. UI.crSkinSet (anime.core.js) returns that range, or ' +
      'the race\'s whole row for the Known World.',
    edits: [[
      '${GD.SKIN[c.race].map(s=>`<div class="sw ${c.app.skin===s?"sel":""}"',
      '${(UI.crSkinSet?UI.crSkinSet(c):GD.SKIN[c.race]).map(s=>`<div class="sw ${c.app.skin===s?"sel":""}"',
    ]],
  },
];
