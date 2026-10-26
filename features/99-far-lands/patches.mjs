// The far lands. Stage 1: the world's size is read from MAP (a-frame.core.js) wherever the release wrote 7,000 x
// 4,500 km. Stage 2: the creation screen offers the Great Continent. Every find below also matches the build of the
// fix layer alone (--only=far-lands), so the frame does not depend on which other features are in.
const W = 'world size from MAP (a-frame.core.js): ';
export default [
  {
    id: 'FL-TOCANVAS',
    blob: 'ardan-core',
    why: W + 'MAP.toCanvas maps km to a whole-world canvas through MAP.KW x MAP.KH, or through the letterboxed view ' +
      'MAP.whole gives when the frame is not the canvas\'s shape.',
    edits: [[
      'MAP.toCanvas=(canvas,kx,ky)=>[kx/7e3*canvas.width,ky/4500*canvas.height]',
      'MAP.toCanvas=(canvas,kx,ky)=>{const V=MAP.whole(canvas.width,canvas.height);return V?[(kx-V.x0)/V.w*canvas.width,(ky-V.y0)/V.h*canvas.height]:[kx/MAP.KW*canvas.width,ky/MAP.KH*canvas.height]}',
    ]],
  },
  {
    id: 'FL-PROVAT',
    blob: 'ardan-core',
    why: W + 'MAP.provAt (the world tab and campaign map hover and click) reads the cell under the pointer through the ' +
      'same letterboxed view, so a larger frame is clicked where it is drawn.',
    edits: [[
      'const r=canvas.getBoundingClientRect(),x=Math.floor((ev.clientX-r.left)/r.width*MAP.gw),y=Math.floor((ev.clientY-r.top)/r.height*MAP.gh);',
      'const r=canvas.getBoundingClientRect(),V=MAP.whole(canvas.width,canvas.height),x=V?Math.floor((V.x0-MAP.KX0+(ev.clientX-r.left)/r.width*V.w)/MAP.cell):Math.floor((ev.clientX-r.left)/r.width*MAP.gw),y=V?Math.floor((V.y0-MAP.KY0+(ev.clientY-r.top)/r.height*V.h)/MAP.cell):Math.floor((ev.clientY-r.top)/r.height*MAP.gh);',
    ]],
  },
  {
    id: 'FL-DRAW',
    blob: 'ardan-core',
    why: W + 'MAP.draw (the world tab, the title strip, the campaign map) lays the relief picture and the realm colours ' +
      'at their place in the frame when the frame is letterboxed (V); at today\'s size V is null and it draws as before.',
    edits: [
      ['MAP.draw=function(canvas,opts={}){MAP.init();const ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height;',
        'MAP.draw=function(canvas,opts={}){MAP.init();const ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height,V=MAP.whole(W,H);'],
      ['ctx.drawImage(MAP.img,0,0,W,H)', '(V?MAP.relief(ctx,W,H,V):ctx.drawImage(MAP.img,0,0,W,H))'],
      ['ctx.drawImage(ov,0,0,W,H)', '(V?MAP.blitWorld(ctx,ov,W,H,V):ctx.drawImage(ov,0,0,W,H))'],
    ],
  },
  {
    id: 'FL-CLAMP',
    blob: 'ardan-core',
    why: W + 'the full map (UI.wrClampView) and the war room (UI.wrClamp) hold the view inside the frame (MAP.KX0, MAP.KY0, MAP.KW x MAP.KH).',
    edits: [
      ['return v.w=A.clamp(v.w,500,7e3),v.h=v.w/asp,v.h>4500&&(v.h=4500,v.w=v.h*asp),v.x0=A.clamp(v.x0,0,7e3-v.w),v.y0=A.clamp(v.y0,0,4500-v.h),v}',
        'return v.w=A.clamp(v.w,500,MAP.KW),v.h=v.w/asp,v.h>MAP.KH&&(v.h=MAP.KH,v.w=v.h*asp),v.x0=A.clamp(v.x0,MAP.KX0,MAP.KX0+MAP.KW-v.w),v.y0=A.clamp(v.y0,MAP.KY0,MAP.KY0+MAP.KH-v.h),v}'],
      ['return v.w=A.clamp(v.w,500,7e3),v.h=v.w/asp,v.h>4500&&(v.h=4500,v.w=v.h*asp),v.x0=A.clamp(v.x0,0,Math.max(0,7e3-v.w)),v.y0=A.clamp(v.y0,0,Math.max(0,4500-v.h)),v}',
        'return v.w=A.clamp(v.w,500,MAP.KW),v.h=v.w/asp,v.h>MAP.KH&&(v.h=MAP.KH,v.w=v.h*asp),v.x0=A.clamp(v.x0,MAP.KX0,MAP.KX0+Math.max(0,MAP.KW-v.w)),v.y0=A.clamp(v.y0,MAP.KY0,MAP.KY0+Math.max(0,MAP.KH-v.h)),v}'],
    ],
  },
  {
    id: 'FL-FIT',
    blob: 'ardan-core',
    why: W + 'the full map opens on MAP.fit(): the whole frame, as before, or in a larger frame the part around your home.',
    edits: [['UI.gmFit=()=>UI.wrClampView({x0:0,y0:0,w:7e3,h:4500})', 'UI.gmFit=()=>UI.wrClampView(MAP.fit())']],
  },
  {
    id: 'FL-VIEWS',
    blob: 'ardan-core',
    why: W + 'the full map (UI.gmDraw) and the war room (UI.drawWarBasic) take their zoom from MAP.ZREF (7,000 km is ' +
      'zoom 1, a scale, not the frame), cut the realm layer from the grid by MAP.KW x MAP.KH, and draw the relief ' +
      'picture where it lies in a larger frame (MAP.relief).',
    edits: [
      ['zoom=7e3/v.w', 'zoom=MAP.ZREF/v.w', 2],
      ['ctx.drawImage(MAP.img,v.x0/7e3*iw,v.y0/4500*ih,v.w/7e3*iw,v.h/4500*ih,0,0,W,H)',
        'MAP.big?MAP.relief(ctx,W,H,v):ctx.drawImage(MAP.img,v.x0/MAP.IW*iw,v.y0/MAP.IH*ih,v.w/MAP.IW*iw,v.h/MAP.IH*ih,0,0,W,H)', 2],
      ['const sx=v.x0/7e3*MAP.gw,sy=v.y0/4500*MAP.gh,sw=v.w/7e3*MAP.gw,sh=v.h/4500*MAP.gh',
        'const sx=(v.x0-MAP.KX0)/MAP.KW*MAP.gw,sy=(v.y0-MAP.KY0)/MAP.KH*MAP.gh,sw=v.w/MAP.KW*MAP.gw,sh=v.h/MAP.KH*MAP.gh', 2],
    ],
  },
  {
    id: 'FL-PICK',
    blob: 'ardan-core',
    why: W + 'the full map\'s hover and click (UI.gmAttach) and the war room\'s (UI.wrProvAt) find the cell under the ' +
      'pointer through MAP.KW x MAP.KH.',
    edits: [['gx=Math.floor(kx/7e3*MAP.gw),gy=Math.floor(ky/4500*MAP.gh)', 'gx=Math.floor((kx-MAP.KX0)/MAP.KW*MAP.gw),gy=Math.floor((ky-MAP.KY0)/MAP.KH*MAP.gh)', 2]],
  },
  {
    id: 'FL-WARVIEW',
    blob: 'ardan-core',
    why: W + 'the war room with no front to frame (UI.wrView) shows the whole frame.',
    edits: [['x0>x1&&(x0=0,y0=0,x1=7e3,y1=4500)', 'x0>x1&&(x0=MAP.KX0,y0=MAP.KY0,x1=MAP.KX0+MAP.KW,y1=MAP.KY0+MAP.KH)']],
  },
  {
    id: 'FL-CHOICE',
    blob: 'ardan-core',
    why: 'The creation screen offers the lands next to the world seed: the Known World alone (the default, the world as ' +
      'written) or the Great Continent (c-lands.core.js); the creation state carries the choice into A.newGame as o.lands.',
    edits: [
      ['startAge:0,diff:"hard",seed:""', 'startAge:0,diff:"hard",seed:"",lands:"known"'],
      ['diff:c.diff,', 'diff:c.diff,lands:c.lands||"known",'],
      [',h+=`<div class="field"><label>World seed (optional)</label>',
        ',h+=A.FL&&A.FL.creationField?A.FL.creationField(c):"",h+=`<div class="field"><label>World seed (optional)</label>'],
    ],
  },
];
