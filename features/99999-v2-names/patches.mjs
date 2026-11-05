export default [
  {
    id: 'NAMES-ORC-SCHOOL',
    blob: 'ardan-core',
    why: 'A.schools tells the orc schools by their realm\'s name (/Horde|Tusk/ on s.realmName). The lore now names the ' +
      'Tusk Clans the Ughrak Dominion, so the test takes the new name too.',
    edits: [['orcS=/Horde|Tusk/.test(s.realmName)', 'orcS=/Horde|Tusk|Ughrak/.test(s.realmName)']],
  },
];
