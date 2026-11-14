// One piece, one view, one SVG. box: [u0, u1, v0, v1] in the piece's own millimetres. A piece stands as its record says
// (def.deg: −90 point up, 90 point down) unless o.flat, when it lies along the page with its point to the right.
import { frame, begin, finish, setPrec, bbox } from './kit.mjs';

export function render(def, box, o = {}) {
  const deg = o.flat ? 0 : (o.deg ?? def.deg ?? -90), F = frame([0, 0], deg), [u0, u1, v0, v1] = box;
  const b = bbox([F.W(u0, v0), F.W(u0, v1), F.W(u1, v0), F.W(u1, v1)]), vb = [b[0], b[1], b[2] - b[0], b[3] - b[1]];
  const px = o.px || (o.width ? o.width / vb[2] : o.height ? o.height / vb[3] : 1);
  setPrec(px > 1.4 ? 100 : 10);
  const D = begin((o.id || def.id) + (o.tag || ''), F, { px, view: vb, lod: o.lod ?? (px > 1.4 ? 3 : 2), seed: def.id });
  D.flat = !!o.flat; D.pxmm = px;
  def.draw(D);
  const sh = def.shadow || [5, 5, 8];
  const svg = finish(D, vb, { w: Math.round(vb[2] * px), h: Math.round(vb[3] * px), label: o.label, cls: o.cls, shadowBlur: o.shadowBlur ?? sh[0], shadowOff: o.shadowOff || [sh[1], sh[2]], shadowOp: o.shadowOp ?? def.shadowOp, shadow: o.shadow });
  setPrec(10);
  return { svg, shapes: D.S.shapes, vb, w: Math.round(vb[2] * px), h: Math.round(vb[3] * px) };
}
