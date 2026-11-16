// Starting stories: the chosen story travels in the newGame options, so the life (and a journal replay) starts with it.
export default [
  {
    id: 'START-OPTION',
    blob: 'ardan-core',
    why: 'UI.startLife builds the options for A.newGame from the creation screen. It now adds story: A.storyFor(c), the chosen ' +
      'starting story if the birth still matches it; starts.core.js applies it after the world is made.',
    edits: [['app:Object.assign({},c.app)};A.newGame(o)', 'app:Object.assign({},c.app),story:A.storyFor?A.storyFor(c):null};A.newGame(o)']],
  },
];
