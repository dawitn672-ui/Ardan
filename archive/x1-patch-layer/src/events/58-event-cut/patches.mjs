// The menu setting for the classic event pool, and the War tab's line about the War Room (cut.core.js).
export default [
  {
    id: 'EC-MENU',
    blob: 'ardan-core',
    why: 'The menu gains "Classic event pool (keep every event)", off by default: on, the yearly roll draws from every ' +
      'event again, including the small one-off events Events 1 retired. It sits with the game settings, after the hints toggle.',
    edits: [[
      '<label class="row">Text size <select data-c="setTx"',
      '${UI.EVCUT?UI.EVCUT.menu():""}<label class="row">Text size <select data-c="setTx"',
    ]],
  },
  {
    id: 'EC-WARCARD',
    blob: 'ardan-core',
    why: 'Uniqueness 5: the War tab told every farmhand that the War Room "shows the host, its templates and forges". ' +
      'Templates and forges are now shown only to the ranks that run them, so the line names them only for those ranks.',
    edits: [[
      '"The War Room shows the host, its templates and forges, even in peace."',
      '(R2.templates||R2.production?"The War Room shows the host, its templates and forges, even in peace.":"The War Room shows the fronts and the host, even in peace.")',
    ]],
  },
];
