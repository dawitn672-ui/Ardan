// The modal draws the queue's head through UI.queueHead (head.core.js), which hides an event marked to skip.
export default [
  {
    id: 'QHEAD-MODAL',
    blob: 'ardan-core',
    why: 'UI: renderModal drew S.queue[0] as it stood, so an event whose view the engine had marked to skip (setup gave up, ' +
      'or a token stayed unfilled) showed with raw {tokens} until the next tick removed it.',
    edits: [['if(UI.screen==="game"&&S){const q=S.queue[0];', 'if(UI.screen==="game"&&S){const q=UI.queueHead?UI.queueHead():S.queue[0];']],
  },
];
