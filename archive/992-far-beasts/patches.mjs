// 992-far-beasts: the famous hunt's tall tales come from the land you hunt in. See README.md.
export default [
  {
    id: 'FB-HOAXES',
    blob: 'ardan-core',
    why: 'A.startHunt\'s famous hunt sometimes chases a tale instead of a beast, drawn from every hoax in LORE.creatures. ' +
      'With the far lands open those include the Great Continent\'s legends, so a hunter of the Known World could spend weeks ' +
      'after the Sand Swallower. A.FB.hoaxes(pc) gives the legends of the hunter\'s own land (a far land\'s own, or the ' +
      'Known World\'s); it is null in a Known World game, where the release\'s list stands.',
    edits: [[
      'const hoaxes=LORE.creatures.filter(c=>/hoax|misunderstanding/.test(c.cat))',
      'const hoaxes=(A.FB&&A.FB.hoaxes&&A.FB.hoaxes(pc))||LORE.creatures.filter(c=>/hoax|misunderstanding/.test(c.cat))',
    ]],
  },
];
