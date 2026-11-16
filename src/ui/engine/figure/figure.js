// The figure library · one person, drawn: a look (plain data) becomes one SVG. Pure: the same look and options give the
// same string, byte for byte. Nothing here reads the game, the page or the clock.
//   compose(look, { crop, width, height, tier, ground, frame, tint, id, label, cls })
//     crop    a name from CROPS, or { w, h, top } in head heights (top = room above the crown), or 'figure'
//     tier    0 the smallest pictures (to 40 px), 1 lists and cards, 2 large portraits. It sets the level of detail,
//             whether soft (blurred) tones are used, and whether the light and depth passes run (tier 2 only: they are
//             about three quarters of a large portrait's paint time, see docs/design/demo-2d/gate2.md)
import { Scene, ORDER, xml } from './scene.js';
import { SKIN, HAIR, EYES, skinOf } from './palette.js';
import { makeRig } from './rig.js';
import { makeHead, drawNeck, drawHead, drawFace } from './head.js';
import { buildHair, drawHair, drawBeard } from './hair.js';
import { dress } from './gear.js';
import { mixc, hex2rgb, rgb2hex, setPrec } from './g.js';

export const CROPS = {
  face: { w: 1.62, h: 2.0, top: .42, lod: 2 },      // in head heights; top = room above the crown
  portrait: { w: 2.06, h: 2.55, top: .44, lod: 2 },
  bust: { w: 2.5, h: 3.1, top: .5, lod: 2 },
  card: { w: 3.1, h: 3.8, top: .5, lod: 1 },
  half: { w: 4.0, h: 4.9, top: .55, lod: 1 },
  figure: { lod: 0 },
  // the game's own frames: square for lists and chips, two by three for the profile, the person's sheet and the obituary
  chip: { w: 1.5, h: 1.5, top: .26, lod: 0 },       // to 40 px: the head and the collar
  list: { w: 2.1, h: 2.1, top: .34, lod: 1 },       // 41 to 119 px: head and shoulders
  square: { w: 2.7, h: 2.7, top: .42, lod: 2 },     // a large square: the bust
  tall: { w: 3.2, h: 4.8, top: .5, lod: 2 },        // two by three: down to the hands and the belt, as a profile card
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
// the colour of the dead: most of the chroma drained, a little paler
export const drained = c => { const [r, g, b] = hex2rgb(c), l = .3 * r + .59 * g + .11 * b, k = .8; return rgb2hex([r + (l - r) * k + 10, g + (l - g) * k + 10, b + (l - b) * k + 12]); };
const HEX = /^#[0-9a-fA-F]{6}$/;

export function compose(look, o = {}) {
  const crop = o.crop || 'figure', C = typeof crop === 'object' ? { lod: 1, ...crop } : (CROPS[crop] || CROPS.figure), isFig = crop === 'figure';
  const tier = o.tier ?? (isFig ? 2 : C.lod === 0 ? 0 : C.lod);
  try {
    const F = makeRig(look), Hd = makeHead(F, look);
    let vb;
    if (isFig) { const w = o.w || 900, top = o.top || 2000; vb = [-w / 2, -top, w, top + (o.below ?? 130)]; }
    else { const w = C.w * F.Hh, h = C.h * F.Hh, cx = F.headX - (crop === 'face' ? Hd.s * 14 * Math.sin(Hd.yawD * Math.PI / 180) * 4 : 0); vb = [cx - w / 2, -F.H - C.top * F.Hh, w, h]; }
    const px = o.px || (o.width ? o.width / vb[2] : 1);
    setPrec(px < .5 ? 1 : 10, px < .5 ? .35 / px : 0);          // under half a pixel a millimetre, whole millimetres are finer than the screen
    const S = new Scene(o.id || look.id || 'p', { px, lod: o.lod ?? (tier === 0 ? 0 : C.lod ?? 1), soft: tier > 0, tint: o.tint === 'dead' ? drained : (o.tint || null) });
    S.view = vb; S.tier = tier; S.minPx = tier === 0 ? 1.4 : tier === 1 ? 1 : .45; S.coarse = tier === 0 ? 2.6 : tier === 1 ? 2.4 : 1;
    const sk = skinOf(look.skin), hc0 = (look.hairColor && typeof look.hairColor === 'object' ? look.hairColor : HAIR[look.hairColor]) || HAIR.darkbrown, iris = (look.eyes && typeof look.eyes === 'object' ? look.eyes : EYES[look.eyes]) || EYES.brown;
    const g = Math.max(0, Math.min(1, look.grey ?? 0));
    const hc = g > .85 ? HAIR.white : g > .55 ? { b: mixc(hc0.b, HAIR.grey.b, .8), s: mixc(hc0.s, HAIR.grey.s, .8), l: HAIR.grey.l, k: mixc(hc0.k, HAIR.grey.k, .6) } : hc0;
    const H = buildHair(Hd, F, look, hc);
    drawNeck(S, Hd, F, sk);
    drawHead(S, Hd, F, look, sk, H.shadow);
    drawFace(S, Hd, F, look, sk, hc, iris);
    drawBeard(S, Hd, look, hc, sk);
    drawHair(S, Hd, F, look, H);
    dress(S, F, Hd, look, sk, H);
    if (isFig && o.shadow !== false) S.layer('ground').fill(`M${-F.H * .17} ${F.H * .012}a${F.H * .17} ${F.H * .018} 0 1 0 ${F.H * .34} 0a${F.H * .17} ${F.H * .018} 0 1 0 ${-F.H * .34} 0`, '#2a2433', { op: .16, filter: S.blur(F.H * .006) });
    // what the frame cannot show is left out of the drawing: the legs and the skirt of a picture cut above the hip
    const bottom = vb[1] + vb[3], drop = isFig ? [] : bottom < F.y.hip ? ['legs', 'skirt'] : bottom < F.y.knee ? ['legs'] : [];
    const order = ORDER.filter(k => k !== 'ground' && !drop.includes(k)), fx = o.fx ?? (tier > 1), fid = S.id + 'fx';
    // depth between the layers: what lies over the body (arms, shoulder pieces, the head, what the hands hold) casts a
    // soft shadow on the body under it. The shadow is the group drawn again as a blurred shade, kept inside the body's column.
    const depth = fx && o.depth !== false, did = S.id + 'ds', cid = S.id + 'dc', mm = F.H * .0045, f1 = v => Math.round(v * 10) / 10;
    const GROUPS = [['arms'], ['shoulder', 'collar'], ['head', 'face', 'hair', 'headwear'], ['propFront', 'hands']], lifted = new Set(GROUPS.flat());
    let body = S.body(order.filter(k => !lifted.has(k) || !depth));
    if (depth) {
      GROUPS.forEach((g2, k) => { const b = S.body(g2.filter(x => order.includes(x))); if (b) body += `<g clip-path="url(#${cid})"><use href="#${did}${k}" filter="url(#${did})"/></g><g id="${did}${k}">${b}</g>`; });
      const nh = F.neckHalf * 1.05, sh = F.shHalf + F.armR[0] * .3, pt = p => f1(p[0]) + ' ' + f1(p[1]);
      const half = sg => [[F.cxS + sg * nh, F.y.chin - F.Hh * .2], [F.cxS + sg * nh, F.y.sh - F.Hh * .14], [F.cxS + sg * sh, F.y.sh - F.Hh * .02], [F.cxS + sg * (F.chestHalf + 4), F.y.chest], [F.cx + sg * (F.waistHalf + 4), F.y.waist], [F.cx + sg * (F.hipHalf + 4), F.y.hip], [F.cx + sg * F.hipHalf * 1.05, 40]];
      const col = [...half(-1), ...half(1).reverse()];
      S.defs.push(`<clipPath id="${cid}"><path d="M${col.map(pt).join('L')}Z"/></clipPath><filter id="${did}" filterUnits="userSpaceOnUse" x="${f1(vb[0])}" y="${f1(vb[1])}" width="${f1(vb[2])}" height="${f1(vb[3])}" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="${f1(mm * 1.1)}"/><feOffset dx="${f1(mm * .8)}" dy="${f1(mm * 1.6)}" result="o"/><feFlood flood-color="#1b1430" flood-opacity=".4"/><feComposite in2="o" operator="in"/></filter>`);
    }
    // the ground behind the sitter (a soft light behind the head, darker at the foot) and the frame's line
    let pre = '', post = '';
    const G = o.ground, [x, y, w, h] = vb, r1 = v => Math.round(v * 10) / 10;
    if (G && HEX.test(G.a) && HEX.test(G.b)) {
      const gid = S.id + 'gr', a = S.col(G.a), b = S.col(G.b);
      S.defs.push(`<radialGradient id="${gid}" gradientUnits="userSpaceOnUse" cx="${r1(x + w * .5)}" cy="${r1(y + h * .3)}" r="${r1(Math.max(w, h) * .78)}"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${mixc(a, b, .6)}"/><stop offset="1" stop-color="${b}"/></radialGradient>`);
      pre = `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="url(#${gid})"/>`;
    }
    const Fr = o.frame;
    if (Fr && HEX.test(Fr.c)) { const t = (Fr.w || 1.5) / px; post = `<rect x="${r1(x + t / 2)}" y="${r1(y + t / 2)}" width="${r1(w - t)}" height="${r1(h - t)}" fill="none" stroke="${S.col(Fr.c)}" stroke-width="${r1(t)}"/>` + (Fr.mark || ''); }
    const inner = pre + (S.layers.ground || []).join('') + (fx ? `<g filter="url(#${fid})">` : '<g>') + body + '</g>' + post;
    if (fx) S.defs.push(lightPass(fid, vb, mm, S.lw(.5)));
    const W = o.width ? Math.round(o.width) : 0, Ht = o.height ? Math.round(o.height) : W ? Math.round(W * vb[3] / vb[2]) : 0;
    const svg = S.svg(vb, { cls: o.cls, label: o.label ?? look.name, order: [], post: inner, w: W || undefined, h: Ht || undefined });
    return { svg, vb, F, shapes: S.shapes, px, tier };
  } finally { setPrec(10); }
}
export { xml };
