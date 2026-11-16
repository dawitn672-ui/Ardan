// The world map in ink (inkmap.core.js): hooks for the ground, the names, the capitals' dots and the menu.
export default [
  {
    id: 'IM-GROUND-DRAW',
    blob: 'ardan-core',
    why: 'MAP.draw (the world tab, the title strip, the campaign map) asks MAP.ground to draw the inked ground first; ' +
      'only when it declines (the setting is off) does it paint the sea colour and the relief picture.',
    edits: [[
      'ctx.clearRect(0,0,W,H),ctx.fillStyle="#1d3b57",ctx.fillRect(0,0,W,H),MAP.img&&MAP.img.complete&&MAP.img.naturalWidth&&ctx.drawImage(MAP.img,0,0,W,H);',
      'ctx.clearRect(0,0,W,H),MAP.ground&&MAP.ground(ctx,W,H,null)||(ctx.fillStyle="#1d3b57",ctx.fillRect(0,0,W,H),MAP.img&&MAP.img.complete&&MAP.img.naturalWidth&&ctx.drawImage(MAP.img,0,0,W,H));',
    ]],
  },
  {
    id: 'IM-GROUND-VIEW',
    blob: 'ardan-core',
    why: 'The zoomable maps (the full map UI.gmDraw and the war room UI.drawWarBasic) ask MAP.ground for the inked ground ' +
      'of their view rectangle v before falling back to the relief picture.',
    edits: [[
      'if(ctx.fillStyle="#1d3b57",ctx.fillRect(0,0,W,H),MAP.img&&MAP.img.complete&&MAP.img.naturalWidth){',
      'if(!(MAP.ground&&MAP.ground(ctx,W,H,v))&&(ctx.fillStyle="#1d3b57",ctx.fillRect(0,0,W,H),MAP.img&&MAP.img.complete&&MAP.img.naturalWidth)){',
      2,
    ]],
  },
  {
    id: 'IM-LINES',
    blob: 'ardan-core',
    why: 'Right after each map lays its realm colours (MAP.draw, the full map, the war room), MAP.inkLines inks the ' +
      'borders, towns and keeps over them, so the wash never greys the line work.',
    edits: [
      ['ctx.imageSmoothingEnabled=!0,ctx.drawImage(ov,0,0,W,H);const S=A.S;', 'ctx.imageSmoothingEnabled=!0,ctx.drawImage(ov,0,0,W,H),MAP.inkLines&&MAP.inkLines(ctx,W,H,null);const S=A.S;'],
      ['ctx.imageSmoothingEnabled=!0;const P=(kx,ky)=>', 'ctx.imageSmoothingEnabled=!0,MAP.inkLines&&MAP.inkLines(ctx,W,H,v);const P=(kx,ky)=>'],
      ['ctx.imageSmoothingEnabled=!0;const disp=', 'ctx.imageSmoothingEnabled=!0,MAP.inkLines&&MAP.inkLines(ctx,W,H,v);const disp='],
    ],
  },
  {
    id: 'IM-WAR-NAMES',
    blob: 'ardan-core',
    why: 'In the war room, province names are written in ink on a paper halo while the inked map is on; the release\'s ' +
      'cream-on-shadow names are kept for the relief map.',
    edits: [[
      'ctx.fillStyle="rgba(15,12,9,.85)",ctx.fillText(p.name,x+.8,y+24*K+.8),ctx.fillStyle=p.occ?"#ffcf9a":"#f1e6c8",ctx.fillText(p.name,x,y+24*K)',
      'MAP.inkOn&&MAP.inkOn()?MAP.inkLabel(ctx,p.name,x,y+24*K,p.occ):(ctx.fillStyle="rgba(15,12,9,.85)",ctx.fillText(p.name,x+.8,y+24*K+.8),ctx.fillStyle=p.occ?"#ffcf9a":"#f1e6c8",ctx.fillText(p.name,x,y+24*K))',
    ]],
  },
  {
    id: 'IM-MARKS-DRAW',
    blob: 'ardan-core',
    why: 'MAP.draw lets MAP.marks write the realm names in ink at their keeps; when it does, the cream dot and light ' +
      'label of each capital are skipped (the keep is the capital\'s mark).',
    edits: [[
      'if(ctx.font=`${Math.max(10,Math.round(W/95))}px Georgia, serif`,ctx.textAlign="center",opts.labels!==!1)',
      'if(ctx.font=`${Math.max(10,Math.round(W/95))}px Georgia, serif`,ctx.textAlign="center",!(MAP.marks&&MAP.marks(ctx,W,H,null,opts))&&opts.labels!==!1)',
    ]],
  },
  {
    id: 'IM-MARKS-GM',
    blob: 'ardan-core',
    why: 'The full map (UI.gmDraw) lets MAP.marks write province and realm names in ink; when it does, the release\'s ' +
      'light names, fort squares and capital dots are skipped.',
    edits: [
      ['if(zoom>=1.8){ctx.font=`${Math.round(9+Math.min(5,zoom))}px Georgia, serif`',
        'if(!(MAP.marks&&MAP.marks(ctx,W,H,v,{}))&&zoom>=1.8){ctx.font=`${Math.round(9+Math.min(5,zoom))}px Georgia, serif`'],
      ['ctx.textAlign="center";for(const id in S.realms){', 'ctx.textAlign="center";for(const id in MAP.inkOn&&MAP.inkOn()?{}:S.realms){'],
    ],
  },
  {
    id: 'IM-WAR-CAPITAL',
    blob: 'ardan-core',
    why: 'In the war room the capital is drawn as a keep by the inked ground, so the release\'s cream dot above it is ' +
      'skipped while the inked map is on.',
    edits: [['vis(x,y)&&(ctx.fillStyle="#fff2b8"', 'vis(x,y)&&!(MAP.inkOn&&MAP.inkOn())&&(ctx.fillStyle="#fff2b8"']],
  },
  {
    id: 'IM-MENU',
    blob: 'ardan-core',
    why: 'The menu gains two map settings, "Inked map" and "Banners for armies", next to the colour-blind map setting.',
    edits: [[
      '<label class="row"><input type="checkbox" data-c="setMapCb"',
      '${UI.INKMAP?UI.INKMAP.menu():""}<label class="row"><input type="checkbox" data-c="setMapCb"',
    ]],
  },
];
