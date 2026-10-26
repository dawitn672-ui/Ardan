// 96-moments (moments.core.js): one menu hook.
export default [
  {
    id: 'MO-MENU',
    blob: 'ardan-core',
    why: 'The menu gains the Motion setting (Follow system, Full, Reduced, Off: brief §6) and the "Moment cut-ins" switch ' +
      '(brief §5.10), just after the theme. UI.MOMENTS.menu draws both; their change handlers are UI.C.setMotion and ' +
      'UI.C.setCutins, saved with the other settings.',
    edits: [[
      '<option value="light" ${UI.set.theme==="light"?"selected":""}>Parchment</option></select></label>',
      '<option value="light" ${UI.set.theme==="light"?"selected":""}>Parchment</option></select></label>${UI.MOMENTS?UI.MOMENTS.menu():""}',
    ]],
  },
];
