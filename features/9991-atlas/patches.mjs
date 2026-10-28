// 9991-atlas: two hooks in 62-inked-map's names pass, so the veil over what you do not know is drawn by the inked
// map itself (under the names, over the ground, the wash and the borders), and an unknown province's name is not
// written. Both only call this feature's code; with it absent (MAP.veil and MAP.unnamed undefined) they do nothing.
export default [
  {
    id: 'AT-VEIL', blob: 'ardan-core',
    why: 'Porting: in the inked map\'s names pass, before any name is drawn, call MAP.veil(ctx, W, H, view) so a renderer hook can lay the fog of the unknown over the land and under the names.',
    edits: [["const whole = !v || !!v.whole; v = wholeView(W, H, v);", "const whole = !v || !!v.whole; v = wholeView(W, H, v); if (MAP.veil) MAP.veil(ctx, W, H, v);"]],
  },
  {
    id: 'AT-UNNAMED', blob: 'ardan-core',
    why: 'Porting: when the inked map writes province names, skip a province MAP.unnamed(p, ctx) says the player does not know.',
    edits: [["label(ctx, p.name, x, y + s0 * 0.35", "if (!(MAP.unnamed && MAP.unnamed(p, ctx))) label(ctx, p.name, x, y + s0 * 0.35"]],
  },
];
