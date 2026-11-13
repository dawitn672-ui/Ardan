// Gate 2 · one person, drawn: a look (plain data) becomes one SVG. Pure: the same look gives the same string.
//   compose(look, { crop: 'figure' | 'half' | 'bust' | 'face', px: output pixels per millimetre, id })
import { Scene, ORDER } from './scene.js';
import { SKIN, HAIR, EYES } from './palette.js';
import { makeRig } from './rig.js';
import { makeHead, drawNeck, drawHead, drawFace } from './head.js';
import { buildHair, drawHair, drawBeard } from './hair.js';
import { dress } from './gear.js';
import { mixc } from './g.js';

export const CROPS = {
  face: { w: 1.62, h: 2.0, top: .42, lod: 2 },      // in head heights; top = room above the crown
  portrait: { w: 2.06, h: 2.55, top: .44, lod: 2 },
  bust: { w: 2.5, h: 3.1, top: .5, lod: 2 },
  card: { w: 3.1, h: 3.8, top: .5, lod: 1 },
  half: { w: 4.0, h: 4.9, top: .55, lod: 1 },
  figure: { lod: 0 },
};
// light as one pass over the finished figure: the silhouette's lit edge gains a rim, its far edge a soft core shadow
function lightPass(id, vb, mm, line) {
  const [x, y, w, h] = vb, f = v => (Math.round(v * 10) / 10);
  return `<filter id="${id}" filterUnits="userSpaceOnUse" x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" color-interpolation-filters="sRGB">`
    + `<feOffset in="SourceAlpha" dx="${f(mm * 1.1)}" dy="${f(mm * .7)}" result="o"/><feComposite in="SourceAlpha" in2="o" operator="out"/><feGaussianBlur stdDeviation="${f(mm * .45)}"/><feComposite in2="SourceAlpha" operator="in" result="rim"/>`
    + `<feFlood flood-color="#fff7e6" flood-opacity=".5"/><feComposite in2="rim" operator="in" result="rimc"/>`
    + `<feOffset in="SourceAlpha" dx="${f(-mm * 2.2)}" dy="${f(-mm * 1)}" result="o2"/><feComposite in="SourceAlpha" in2="o2" operator="out"/><feGaussianBlur stdDeviation="${f(mm * 1.2)}"/><feComposite in2="SourceAlpha" operator="in" result="sh"/>`
    + `<feFlood flood-color="#1d1533" flood-opacity=".3"/><feComposite in2="sh" operator="in" result="shc"/>`
    + `<feMorphology in="SourceAlpha" operator="dilate" radius="${(Math.round(line * 100) / 100)}" result="fat"/><feFlood flood-color="#1c1420" flood-opacity=".9"/><feComposite in2="fat" operator="in" result="line"/>`
    + `<feMerge><feMergeNode in="line"/><feMergeNode in="SourceGraphic"/><feMergeNode in="shc"/><feMergeNode in="rimc"/></feMerge></filter>`;
}

export function compose(look, o = {}) {
  const crop = o.crop || 'figure', C = CROPS[crop];
  const F = makeRig(look), Hd = makeHead(F, look);
  let vb;
  if (crop === 'figure') { const w = o.w || 900, top = o.top || 2000; vb = [-w / 2, -top, w, top + (o.below ?? 130)]; }
  else { const w = C.w * F.Hh, h = C.h * F.Hh, cx = F.headX - (crop === 'face' ? Hd.s * 14 * Math.sin(Hd.yawD * Math.PI / 180) * 4 : 0); vb = [cx - w / 2, -F.H - C.top * F.Hh, w, h]; }
  const px = o.px || (o.width ? o.width / vb[2] : 1);
  const S = new Scene(o.id || look.id || 'p', { px, lod: o.lod ?? C.lod });
  const sk = SKIN[look.skin] || SKIN.fair, hc0 = HAIR[look.hairColor] || HAIR.darkbrown, iris = EYES[look.eyes] || EYES.brown;
  const g = Math.max(0, Math.min(1, look.grey ?? 0));
  const hc = g > .85 ? HAIR.white : g > .55 ? { b: mixc(hc0.b, HAIR.grey.b, .8), s: mixc(hc0.s, HAIR.grey.s, .8), l: HAIR.grey.l, k: mixc(hc0.k, HAIR.grey.k, .6) } : hc0;
  const H = buildHair(Hd, F, look, hc);
  drawNeck(S, Hd, F, sk);
  drawHead(S, Hd, F, look, sk, H.shadow);
  drawFace(S, Hd, F, look, sk, hc, iris);
  drawBeard(S, Hd, look, hc, sk);
  drawHair(S, Hd, F, look, H);
  dress(S, F, Hd, look, sk, H);
  if (crop === 'figure') S.layer('ground').fill(`M${-F.H * .17} ${F.H * .012}a${F.H * .17} ${F.H * .018} 0 1 0 ${F.H * .34} 0a${F.H * .17} ${F.H * .018} 0 1 0 ${-F.H * .34} 0`, '#2a2433', { op: .16, filter: S.blur(F.H * .006) });
  const drop = { face: ['legs', 'skirt'], portrait: ['legs', 'skirt'], bust: ['legs', 'skirt'], card: ['legs'] }[crop] || [];
  const order = ORDER.filter(k => k !== 'ground' && !drop.includes(k)), fx = o.fx !== false, fid = S.id + 'fx';
  // depth between the layers: what lies over the body (arms, shoulder pieces, the head, what the hands hold) casts a
  // soft shadow on the body under it. The shadow is the group drawn again as a blurred shade, kept inside the body's column.
  const depth = fx && o.depth !== false, did = S.id + 'ds', cid = S.id + 'dc', mm = F.H * .0045, f1 = v => Math.round(v * 10) / 10;
  const GROUPS = [['arms'], ['shoulder', 'collar'], ['head', 'face', 'hair', 'headwear'], ['propFront', 'hands']], lifted = new Set(GROUPS.flat());
  let body = S.body(order.filter(k => !lifted.has(k) || !depth));
  if (depth) {
    GROUPS.forEach((g, k) => { const b = S.body(g.filter(x => order.includes(x))); if (b) body += `<g clip-path="url(#${cid})"><use href="#${did}${k}" filter="url(#${did})"/></g><g id="${did}${k}">${b}</g>`; });
    const nh = F.neckHalf * 1.05, sh = F.shHalf + F.armR[0] * .3, pt = p => f1(p[0]) + ' ' + f1(p[1]);
    const half = sg => [[F.cxS + sg * nh, F.y.chin - F.Hh * .2], [F.cxS + sg * nh, F.y.sh - F.Hh * .14], [F.cxS + sg * sh, F.y.sh - F.Hh * .02], [F.cxS + sg * (F.chestHalf + 4), F.y.chest], [F.cx + sg * (F.waistHalf + 4), F.y.waist], [F.cx + sg * (F.hipHalf + 4), F.y.hip], [F.cx + sg * F.hipHalf * 1.05, 40]];
    const col = [...half(-1), ...half(1).reverse()];
    S.defs.push(`<clipPath id="${cid}"><path d="M${col.map(pt).join('L')}Z"/></clipPath><filter id="${did}" filterUnits="userSpaceOnUse" x="${f1(vb[0])}" y="${f1(vb[1])}" width="${f1(vb[2])}" height="${f1(vb[3])}" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="${f1(mm * 1.1)}"/><feOffset dx="${f1(mm * .8)}" dy="${f1(mm * 1.6)}" result="o"/><feFlood flood-color="#1b1430" flood-opacity=".4"/><feComposite in2="o" operator="in"/></filter>`);
  }
  const inner = (S.layers.ground || []).join('') + (fx ? `<g filter="url(#${fid})">` : '<g>') + body + '</g>';
  if (fx) S.defs.push(lightPass(fid, vb, mm, S.lw(.5)));
  const svg = S.svg(vb, { cls: o.cls, label: look.name, order: [], post: inner });
  return { svg, vb, F, shapes: S.shapes, px };
}
