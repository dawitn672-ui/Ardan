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
  {
    id: 'BF-FIELD',
    blob: 'ardan-core',
    why: 'UI (cycle 1 visual I3): the battle field is drawn as a woodblock print when the colour prints are on: ' +
      'UI.bfGround (field.core.js) lays a sky band in the battle\'s hour and weather, a far ridge in its terrain and the ' +
      'near ground over the release\'s olive fill, and the release\'s speckles, ellipses, fog wash and rain lines are ' +
      'skipped (UI.bfGroundOn). Each unit block goes through UI.bfBlock, a banner pole and a mass of pikes, horses or ' +
      'bows in the realm\'s colour instead of a box with a cross; the wing captions move to the field\'s edge; and the ' +
      'end strip gives way to a small cartouche (the VICTORY or DEFEAT cut-in of 96-moments carries the moment).',
    edits: [
      ['g.addColorStop(1,terrCol[1]),ctx.fillStyle=g,ctx.fillRect(0,0,W,H),ctx.globalAlpha=.12,ctx.fillStyle="#000";for(let i=0;i<160;i++)',
        'g.addColorStop(1,terrCol[1]),ctx.fillStyle=g,ctx.fillRect(0,0,W,H),UI.bfGround&&UI.bfGround(ctx,W,H,B),ctx.globalAlpha=.12,ctx.fillStyle="#000";for(let i=0;i<(UI.bfGroundOn?0:160);i++)'],
      ['if(B.terr==="forest"){', 'if(!UI.bfGroundOn&&B.terr==="forest"){'],
      ['if(B.terr==="hills"||B.terr==="mountains"){', 'if(!UI.bfGroundOn&&(B.terr==="hills"||B.terr==="mountains")){'],
      ['B.weather==="fog"&&(ctx.fillStyle="rgba(220,220,220,.18)"', '!UI.bfGroundOn&&B.weather==="fog"&&(ctx.fillStyle="rgba(220,220,220,.18)"'],
      [',B.weather==="rain"){ctx.strokeStyle="rgba(180,200,220,.25)"', ',!UI.bfGroundOn&&B.weather==="rain"){ctx.strokeStyle="rgba(180,200,220,.25)"'],
      ['for(const x of[W/3,W*2/3])ctx.beginPath()', 'for(const x of UI.bfGroundOn?[]:[W/3,W*2/3])ctx.beginPath()'],
      ['ctx.fillText("LEFT WING",wingX.L,mid+4),ctx.fillText("CENTER",wingX.C,mid+4),ctx.fillText("RIGHT WING",wingX.R,mid+4)',
        'UI.bfGroundOn&&UI.bfWings?UI.bfWings(ctx,W,H,wingX):(ctx.fillText("LEFT WING",wingX.L,mid+4),ctx.fillText("CENTER",wingX.C,mid+4),ctx.fillText("RIGHT WING",wingX.R,mid+4))'],
      ['block=(bx,by,bw2,bh2)=>{if(ctx.fillStyle=col,', 'block=(bx,by,bw2,bh2)=>{if(UI.bfGroundOn&&UI.bfBlock&&UI.bfBlock(ctx,bx,by,bw2,bh2,col,edge,cat,per,bottom))return;if(ctx.fillStyle=col,'],
      ['B.phase==="end"&&(ctx.fillStyle="rgba(0,0,0,.45)"', 'B.phase==="end"&&(UI.bfGroundOn&&UI.bfEnd?UI.bfEnd(ctx,W,H,B,side):(ctx.fillStyle="rgba(0,0,0,.45)"'],
      ['W/2,mid+9))}', 'W/2,mid+9)))}'],
    ],
  },
];
