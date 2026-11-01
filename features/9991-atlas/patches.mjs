// 9991-atlas: two hooks in 62-inked-map: the lines layer and the names pass, so the veil over what you do not know is drawn by the inked
// map itself (over the ground, the wash, the borders and the towns, under the names), and an unknown province's name is not
// written. Both only call this feature's code; with it absent (MAP.veil and MAP.unnamed undefined) they do nothing.
export default [
  {
    id: 'AT-VEIL', blob: 'ardan-core',
    why: 'Porting: when the inked map lays its lines layer (borders, towns) into the view it keeps, call MAP.veil on that kept picture after the towns, with the view and the canvas on screen, so a renderer hook can lay the fog of the unknown over the land and under the names; MAP.veilKey(canvas) joins the kept view\'s key so it is laid again when what the player knows changes.',
    edits: [["(c, d) => IM.towns(c, d.W, d.H, d.vx, d.vy, d.sx, d.sy, d.zoom, K), tk);", "(c, d) => { IM.towns(c, d.W, d.H, d.vx, d.vy, d.sx, d.sy, d.zoom, K); if (MAP.veil) MAP.veil(c, d.W, d.H, { x0: d.vx, y0: d.vy, w: d.W / d.sx, h: d.H / d.sy }, ctx.canvas); }, tk + (MAP.veilKey ? MAP.veilKey(ctx.canvas) : ''));"]],
  },
  {
    id: 'AT-UNNAMED', blob: 'ardan-core',
    why: 'Porting: when the inked map writes province names, skip a province MAP.unnamed(p, ctx) says the player does not know.',
    edits: [["label(ctx, p.name, x, y + s0 * 0.35", "if (!(MAP.unnamed && MAP.unnamed(p, ctx))) label(ctx, p.name, x, y + s0 * 0.35"]],
  },
];
