// The battle field's unit labels go through UI.bfLabel (labels.core.js), which keeps them apart.
export default [
  {
    id: 'BF-LABEL-RESET',
    blob: 'ardan-core',
    why: 'UI: start each frame of the battle field with no labels placed (the wing captions are drawn once a frame, before ' +
      'the units).',
    edits: [['ctx.fillText("LEFT WING",wingX.L,mid+4)', '(ctx.__lb=[],ctx.__lbText=[],ctx.__lbq=[]),ctx.fillText("LEFT WING",wingX.L,mid+4)']],
  },
  {
    id: 'BF-LABEL',
    blob: 'ardan-core',
    why: 'UI: unit labels were drawn centred on their blocks with no regard for neighbours, and a crowded centre printed ' +
      'them over each other ("Heavy infSpeaCrossbowmen"). Each label now moves away from the line, or shortens to its ' +
      'count, when it would overlap one already drawn.',
    edits: [[
      'ctx.strokeText(lab,x+totW/2,ly),ctx.fillStyle="#1a140c",ctx.fillText(lab,x+totW/2,ly)',
      'UI.bfLabel?UI.bfLabel(ctx,lab,x+totW/2,ly,bottom):(ctx.strokeText(lab,x+totW/2,ly),ctx.fillStyle="#1a140c",ctx.fillText(lab,x+totW/2,ly))',
    ]],
  },
  {
    id: 'BF-LABEL-FLUSH',
    blob: 'ardan-core',
    why: 'UI: draw the frame\'s unit labels after both sides\' blocks, so a later unit\'s blocks cannot cover an earlier ' +
      'unit\'s label.',
    edits: [['if(draw(side==="A"?"B":"A",!1),draw(side,!0),B.phase', 'if(draw(side==="A"?"B":"A",!1),draw(side,!0),UI.bfLabelFlush&&UI.bfLabelFlush(ctx),B.phase']],
  },
];
