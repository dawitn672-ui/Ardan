// One piece, one view, one SVG. box: [u0, u1, v0, v1] in the piece's own millimetres. A piece is turned as its record
// says (def.deg: the way +u points on the page; −90 up, 90 down, 118 hilt up and to the right) unless o.deg or o.flat
// (lying along the page, point to the right). o.fit: [w, h] in pixels to fit inside; or o.px: pixels a millimetre.
import { frame, begin, finish, setPrec, bbox } from './kit.mjs';

export function render(def, box, o = {}) {
  const deg = o.flat ? 0 : (o.deg ?? def.deg ?? -90), F = frame([0, 0], deg), [u0, u1, v0, v1] = box;
  const b = bbox([F.W(u0, v0), F.W(u0, v1), F.W(u1, v0), F.W(u1, v1)]), pad = o.pad ?? 0, vb = [b[0] - pad, b[1] - pad, b[2] - b[0] + 2 * pad, b[3] - b[1] + 2 * pad];
  const px = o.px || (o.fit ? Math.min(o.fit[0] / vb[2], o.fit[1] / vb[3]) : o.width ? o.width / vb[2] : 1);
  setPrec(px > 1.4 ? 100 : 10);
  const D = begin((o.id || def.id) + (o.tag || ''), F, { px, view: vb, lod: o.lod ?? 2, seed: def.id });
  D.flat = !!o.flat; D.pxmm = px;
  def.draw(D);
  const sh = def.shadow || [5, 5, 8];
  const svg = finish(D, vb, { w: Math.round(vb[2] * px), h: Math.round(vb[3] * px), label: o.label, cls: o.cls, shadowBlur: o.shadowBlur ?? sh[0], shadowOff: o.shadowOff || [sh[1], sh[2]], shadowOp: o.shadowOp ?? def.shadowOp, shadow: o.shadow });
  setPrec(10);
  return { svg, shapes: D.S.shapes, vb, px, w: Math.round(vb[2] * px), h: Math.round(vb[3] * px) };
}
