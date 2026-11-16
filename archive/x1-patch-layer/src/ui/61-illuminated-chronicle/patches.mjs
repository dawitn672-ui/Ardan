// The look and sound of the chronicle: three toggles in the menu (illumination.core.js).
export default [
  {
    id: 'IL-MENU',
    blob: 'ardan-core',
    why: 'The menu gains three settings for the illuminated look: woodcuts on events, the Chronicle set on vellum, and ' +
      'sound (off by default). They sit with the other display settings, above the odds toggle.',
    edits: [[
      '<label class="row"><input type="checkbox" data-c="setOdds"',
      '${UI.ILLUM?UI.ILLUM.menu():""}<label class="row"><input type="checkbox" data-c="setOdds"',
    ]],
  },
];
