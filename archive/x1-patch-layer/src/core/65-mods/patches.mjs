// The way in to the Mods panel (mods.core.js): a button on the title screen and one in the Menu.
export default [
  {
    id: 'MODS-TITLE',
    blob: 'ardan-core',
    why: 'Replayability 6: players load their own mods before they start a life, so the title screen gets a "Mods" ' +
      'button next to "Load save file". It opens the Mods panel (UI.A.mods).',
    edits: [[
      '<button data-a="import">Load save file</button>\n      <button data-a="help">How to play</button>',
      '<button data-a="import">Load save file</button>\n      <button data-a="mods">Mods</button>\n      <button data-a="help">How to play</button>',
    ]],
  },
  {
    id: 'MODS-MENU',
    blob: 'ardan-core',
    why: 'Replayability 6: the in-game Menu gets a "Mods" button beside "Playtest mode", to see which mods this life ' +
      'began with and to load or tick mods for the next one.',
    edits: [[
      '<button data-a="playtest">Playtest mode</button>',
      '<button data-a="mods">Mods</button><button data-a="playtest">Playtest mode</button>',
    ]],
  },
];
