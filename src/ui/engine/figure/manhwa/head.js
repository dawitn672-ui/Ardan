// The manhwa layer · the head and the face. A front view turned a little (yaw), in the card's own units: the eye line
// is (cx, y0), the skull is about 68 wide and 88 tall. The face is the reference's: large clear eyes with a coloured
// iris and two catchlights, a small nose said with one shadow, a short mouth, a narrow chin; skin in two flat steps.
import { clamp, lerp, mixc, n1 } from '../g.js';
import { pt, P, PZ, blob, curve, sliver, elli, circ } from './ink.js';

// what a person's face leans to, from their own dice (r = stream(id, 'face')); the game's face code can feed the same keys
export function faceOf(r, male, age) {
  const s = () => r() * 2 - 1;
  return { jaw: s(), chin: s(), eye: s(), tilt: s(), open: s(), brow: s(), browTilt: s(), mouth: s(), nose: s(), smile: r(), gaze: s() * .5, lips: s(), cheek: s() };
}

export function makeHead(o) {
  const { cx, y0, male, age = 30 } = o, f = o.face, yaw = clamp(o.yaw ?? .25, -1, 1), old = clamp((age - 44) / 26), heavy = o.heavy || 0;
  const w = (male ? 33.2 : 30.8) + f.jaw * .8 + heavy * 1.6, chin = (male ? 43.5 : 38) + f.chin * 1.4, jawX = w * (male ? .77 : .7) + f.jaw * 1.6 + heavy * 2.4, jawY = male ? 26 : 24.5, chinW = (male ? 9.2 : 6) + f.jaw * 1 + heavy * 1.5;
  // a point of the face: its place on the front view, pushed by the turn of the head
  const far = sg => (sg * yaw > 0 ? 1 - .075 * Math.abs(yaw) : 1 + .03 * Math.abs(yaw));
  const hp = (x, y) => { const sg = Math.sign(x) || 1, low = clamp((y + 14) / 52); return [cx + x * far(sg) + yaw * 4.2 * low + yaw * 1.2, y0 + y]; };
  const side = sg => [[sg * 19, -45], [sg * 30.5, -32], [sg * w, -10], [sg * (w - .5), 5], [sg * (w - 3.4), 16.5], [sg * jawX, jawY], [sg * (chinW + 7.5), chin - 6.5], [sg * chinW * .6, chin - .9]];
  const ring = [[0, -47.5], ...side(1), [0, chin], ...side(-1).reverse()].map(p => hp(p[0], p[1]));
  const tight = [1, 1, 1, 1, 1, 1, male ? .55 : .9, .9, .8, 1, .8, .9, male ? .55 : .9, 1, 1, 1, 1, 1];
  const fx = cx + yaw * 5.4;                                           // the face's own centre line
  const eyeX = sg => fx + sg * (15.4 - (sg * yaw > 0 ? 1.5 * Math.abs(yaw) : -.3 * Math.abs(yaw)));
  const eyeW = sg => ((male ? 8.3 : 9) + f.eye * .5) * (sg * yaw > 0 ? 1 - .14 * Math.abs(yaw) : 1);
  const eyeH = (male ? 5.3 - Math.min(1, Math.max(0, (age - 24) / 30)) * .7 : 7.4 - Math.min(1, Math.max(0, (age - 26) / 30)) * 1.2) + f.open * (male ? .7 : .9) - old * .7;
  return { ...o, yaw, old, w, chin, jawX, jawY, chinW, hp, fx, eyeX, eyeW, eyeH, outline: blob(ring, tight), ring, crown: y0 - 47.5, chinY: y0 + chin, far };
}

export function drawNeck(S, Hd, sk, F) {
  const { cx, y0, male, yaw } = Hd, nw = F.neckW, x = cx + yaw * 1.5, top = y0 + Hd.chin - 14, bot = F.yS + 6;
  const d = `M${n1(x - nw)} ${n1(top)}C${n1(x - nw)} ${n1(bot - 16)} ${n1(x - nw - 2)} ${n1(bot - 8)} ${n1(cx - nw - 12)} ${n1(bot)}L${n1(cx + nw + 12)} ${n1(bot)}C${n1(x + nw + 2)} ${n1(bot - 8)} ${n1(x + nw)} ${n1(bot - 16)} ${n1(x + nw)} ${n1(top)}Z`;
  S.form(d, { b: sk.b, s: sk.s, k: sk.k, rim: sk.l }, { rim: false, in: s => {
    // the head's shadow on the neck, a hard shape under the jaw
    s.fill(blob([[x - nw - 4, top + 6], [x - 4, y0 + Hd.chin + 7], [x + nw + 4, y0 + Hd.chin + 11], [x + nw + 6, bot - 4], [x + nw + 8, top]], .9), sk.s);
    s.fill(blob([[x - nw - 2, top + 4], [x, y0 + Hd.chin + 3.5], [x + nw + 2, y0 + Hd.chin + 4], [x + nw + 4, top]], .9), sk.d, .55);
    if (male) s.pen([[x - 1, y0 + Hd.chin + 13], [x + 1.4, y0 + Hd.chin + 17], [x - .4, y0 + Hd.chin + 21]], 1, sk.d, { op: .5 });
    s.pen([[x - nw + 3, bot - 13], [x - 5, bot - 6]], 1, sk.d, { op: .45 }); s.pen([[x + nw - 3, bot - 13], [x + 5, bot - 6]], 1, sk.d, { op: .45 });
  } });
}

export function drawEars(S, Hd, sk, o = {}) {
  for (const sg of [-1, 1]) {
    if (o.hide && o.hide(sg)) continue;
    const e = Hd.hp(sg * (Hd.w - 1.5), 4), k = sg * (Hd.yaw * sg > 0 ? .55 : 1), x = e[0], y = e[1];
    const d = blob([[x, y - 8], [x + k * 5.6, y - 9.5], [x + k * 7, y - 3], [x + k * 5, y + 5], [x + k * 1.6, y + 9.5], [x - k * 1, y + 4]]);
    S.both(d, sk.b, sk.k, S.lw * .9);
    S.fill(blob([[x + k * 1.4, y - 5.5], [x + k * 4.6, y - 6], [x + k * 4.8, y - .5], [x + k * 2.6, y + 3.6], [x + k * 1.2, y + .5]]), sk.s);
    if (o.ring && o.ring[sg > 0 ? 1 : 0]) { const g = o.ring[sg > 0 ? 1 : 0]; S.both(circ(x + k * 2.4, y + 12.5, g.r || 2.6), g.fill || 'none', g.c, 1.1); if (g.drop) S.both(elli(x + k * 2.4, y + 18, 1.6, 2.6), g.drop, g.k || '#3a2a10', .6); }
  }
}

export function drawHead(S, Hd, sk, o = {}) {
  const { cx, y0, w, yaw, fx } = Hd, hp = Hd.hp;
  S.form(Hd.outline, { b: sk.b, s: sk.s, k: sk.k, rim: sk.l }, { sh: 1.9, rim: false, w: S.lw, in: s => {
    // under the lower lip and the chin's turn
    s.fill(blob([[-5.5, Hd.chin - 9.2], [0, Hd.chin - 10.2], [6, Hd.chin - 9.4], [3, Hd.chin - 7.6], [-2.5, Hd.chin - 7.6]].map(p => [fx + p[0], y0 + p[1]])), sk.s, .7);
    // what the hair or the hat throws on the brow
    if (o.browShade !== false) { const y = o.browShade ?? -21; s.fill(blob([[-w - 4, -50], [w + 4, -50], [w + 3, y + 1], [w * .45, y + 4.4], [0, y + 2.8], [-w * .5, y + 4.6], [-w - 3, y - 2]].map(p => hp(p[0], p[1])), .8), sk.s, .92); }
    // the planes of the face: the socket's shade beside the nose, the hollow under the cheekbone (deeper on a man, on the old)
    for (const sg of [-1, 1]) {
      const ex = Hd.eyeX(sg), k = sg * yaw > 0 ? .8 : 1;
      s.fill(blob([[ex - sg * 9.5, y0 - 7], [ex - sg * 4, y0 - 9.5], [ex - sg * 6.4, y0 + 1], [ex - sg * 9.6, y0 + 6]], .9), sk.s, Hd.male ? .5 : .28);
      if (Hd.male || Hd.old > .3) s.fill(blob([[ex + sg * 12 * k, y0 + 9], [ex + sg * 4, y0 + 17], [ex + sg * 1, y0 + 27], [ex + sg * 7 * k, y0 + 25], [ex + sg * 13 * k, y0 + 17]], .9), sk.s, .32 + Hd.old * .3);
    }
    // a flush on the cheeks
    const bl = S.rad(0, 0, 1, [[0, sk.blush, .5], [1, sk.blush, 0]]);
    for (const sg of [-1, 1]) s.put(`<ellipse cx="0" cy="0" rx="1" ry="1" transform="translate(${n1(Hd.eyeX(sg) + sg * 3.5)} ${n1(y0 + 14.5)}) scale(${n1(9.5)} ${n1(5.6)})" fill="${bl}"${Hd.male ? ' opacity=".55"' : ''}/>`);
    if (o.in) o.in(s);
  } });
}

// the face's features, over the head and under the hair
export function drawFace(S, Hd, sk, iris, hc, o = {}) {
  const { y0, fx, male, yaw, old } = Hd, f = Hd.face, lashC = mixc(hc.k, '#1c1018', .55), browC = mixc(hc.s, hc.k, .45), mood = o.mood || 'calm';
  const stern = mood === 'stern' ? 1 : mood === 'proud' ? .6 : mood === 'meek' ? -.5 : mood === 'warm' ? -.3 : 0;
  for (const sg of [-1, 1]) {
    const ex = Hd.eyeX(sg), a = Hd.eyeW(sg), h = Hd.eyeH * (mood === 'stern' ? .86 : mood === 'meek' ? .96 : 1), tl = (f.tilt * .7 + (male ? .5 : 1.1) + stern * .5), y = y0 + .6;
    const X = t => ex + sg * t * a;                                      // t: -1 the inner corner .. 1 the outer
    const inner = [X(-1), y + 1.2], outer = [X(1), y - tl], top = [X(-.12), y - h], topO = [X(.62), y - h * .78 - tl * .5], lowM = [X(.1), y + h * .62], lowO = [X(.72), y + h * .32 - tl * .3];
    const upper = [inner, [X(-.62), y - h * .66], top, topO, outer], lower = [outer, lowO, lowM, [X(-.6), y + h * .4], inner];
    const eye = curve(upper, [.6, 1, 1, 1, .5]) + curve(lower, [.5, 1, 1, 1, .6]).replace(/^M[^C]*/, '') + 'Z';
    S.clip(eye, s => {
      s.fill(eye, mixc('#fffdf8', sk.l, .12));
      const ix = ex + sg * a * .02 + f.gaze * 1.2 + yaw * .9, iy = y - h * .1, rx = Math.min(a * .68, male ? 5 : 5.9), ry = Math.max(h * 1.02, rx * 1.06);
      const g = s.lin(0, iy - ry, 0, iy + ry, [[0, iris.ring], [.34, mixc(iris.ring, iris.b, .55)], [.6, iris.b], [1, mixc(iris.l, '#ffffff', .18)]]);
      s.both(elli(ix, iy, rx, ry), g, iris.ring, 1);
      s.fill(`M${n1(ix - rx * .8)} ${n1(iy + ry * .28)}Q${n1(ix)} ${n1(iy + ry * 1.25)} ${n1(ix + rx * .8)} ${n1(iy + ry * .28)}Q${n1(ix)} ${n1(iy + ry * .78)} ${n1(ix - rx * .8)} ${n1(iy + ry * .28)}Z`, mixc(iris.l, '#ffffff', .35), .8);
      s.fill(elli(ix, iy - ry * .04, rx * .4, ry * .42), mixc(iris.ring, '#05040a', .7));
      // the lid's shadow across the top of the eye
      s.fill(curve([[X(-1.1), y - h * 1.2], [X(0), y - h * 1.5], [X(1.1), y - h * 1.2 - tl]]) + `L${n1(X(1.1))} ${n1(y - h * .5 - tl * .8)}Q${n1(X(0))} ${n1(y - h * .78)} ${n1(X(-1.1))} ${n1(y - h * .3)}Z`, '#3a2a4a', .3);
      s.fill(circ(ix - rx * .42, iy - ry * .36, Math.max(1.05, rx * .32)), '#ffffff');
      s.fill(circ(ix + rx * .46, iy + ry * .34, Math.max(.5, rx * .15)), '#ffffff', .9);
    });
    // the upper lid: one heavy tapered line with a wing; the lashes; the fold above; the lower lid said at its outer end
    const wing = [X(1.24), y - tl * 1.6 - (male ? .2 : 1.2)], lw = (male ? 1.7 : 2.3) + (o.kohl ? .7 : 0);
    S.pen([inner, [X(-.62), y - h * .7], [top[0], top[1] - .3], [topO[0], topO[1] - .3], outer, wing], lw, lashC, { at: .62 });
    if (!male || o.kohl) { S.pen([[X(.7), y - h * .62 - tl * .6], [X(1.18), y - h * .9 - tl * 1.6]], 1, lashC, { at: .2 }); S.pen([[X(.9), y - h * .3 - tl * .9], [X(1.38), y - h * .32 - tl * 1.9]], .9, lashC, { at: .2 }); }
    S.pen([[X(-.72), y - h * .86 - 1.5], [X(-.1), y - h - 2.3], [X(.75), y - h * .82 - 2 - tl * .6]], .7, sk.d, { op: .75 });
    S.pen([outer, lowO, [lowM[0] + sg * 1, lowM[1] + .15]], male ? .75 : .65, mixc(sk.k, lashC, .4), { at: .25, op: .85 });
    if (old > .2) S.pen([[X(-.8), y + h * .62 + 2.6], [X(.1), y + h * .7 + 4], [X(.8), y + h * .4 + 3.2]], .6, sk.d, { op: .35 + old * .4 });
    // the brow: a tapered stroke, thicker for men, its inner end pressed down when stern
    const by = y - h - (male ? 4.6 : 6.4) + f.brow * .5, bt = f.browTilt * .9 + stern * 1.7, bw = (male ? 3 : 1.5) + f.brow * .35 + (o.heavyBrow ? .7 : 0);
    S.pen([[X(-1.04), by + 1.2 + bt], [X(-.3), by - .4 + bt * .3], [X(.5), by - 1.3 - bt * .1], [X(1.22), by + .7 - bt * .2 - tl * .5]], bw, browC, { at: .3 });
  }
  // the nose: one flat shadow on the unlit side, a short line under the tip; a bridge line on a man or an old face
  const ny = y0 + 16.2 + f.nose * 1.3, nx = fx + yaw * 2.6, k = male ? 1.15 : .9;
  S.fill(`M${n1(nx + .6)} ${n1(ny - 9.5)}Q${n1(nx + 3.6 * k)} ${n1(ny - 4)} ${n1(nx + 4.2 * k)} ${n1(ny + .4)}Q${n1(nx + 2.2)} ${n1(ny + 2.6)} ${n1(nx - .4)} ${n1(ny + 1.5)}Q${n1(nx + 1.9)} ${n1(ny - 2)} ${n1(nx + .6)} ${n1(ny - 9.5)}Z`, sk.s);
  S.pen([[nx - 2.6 * k, ny + 1.3], [nx + .2, ny + 2.3], [nx + 3 * k, ny + 1.1]], .95, mixc(sk.k, sk.d, .35), { at: .45 });
  if (male || old > .3) S.pen([[nx + .9, ny - 15], [nx + 1.9, ny - 8], [nx + 1.2, ny - 3]], .7, sk.d, { op: .6 });
  S.fill(elli(nx - 1.2, ny - 1.6, 1, 1.5), sk.l, .8);
  // the mouth: a tapered line, its corners by the mood; a lip colour on a woman, a shadow under the lower lip
  const my = y0 + 26.6 + f.nose * .6, mw = (male ? 7.4 : 6.2) + f.mouth * .8, sm = (mood === 'warm' ? 1.4 : mood === 'stern' ? -.9 : mood === 'meek' ? -.2 : mood === 'proud' ? .5 : .35) + (f.smile - .5) * .8, mx = fx + yaw * 1.6;
  if (!male) {
    S.fill(`M${n1(mx - mw + .6)} ${n1(my - sm * .3)}Q${n1(mx - mw * .4)} ${n1(my - 2)} ${n1(mx)} ${n1(my - 1)}Q${n1(mx + mw * .4)} ${n1(my - 2)} ${n1(mx + mw - .6)} ${n1(my - sm * .3)}Q${n1(mx)} ${n1(my + 1.2)} ${n1(mx - mw + .6)} ${n1(my - sm * .3)}Z`, mixc(sk.lip, sk.blush, .25), .9);
    S.fill(`M${n1(mx - mw * .72)} ${n1(my + .4)}Q${n1(mx)} ${n1(my + 4.8 + f.lips * .6)} ${n1(mx + mw * .72)} ${n1(my + .4)}Q${n1(mx)} ${n1(my + 1.6)} ${n1(mx - mw * .72)} ${n1(my + .4)}Z`, sk.lip, .8);
    S.fill(elli(mx - 1, my + 2.2, 1.6, .7), '#ffffff', .45);
  }
  S.pen([[mx - mw, my - sm * .55], [mx - mw * .45, my + .35], [mx, my + .1], [mx + mw * .45, my + .35], [mx + mw, my - sm * .55]], male ? 1.25 : 1.05, mixc(sk.k, sk.lip, .25));
  if (male) S.pen([[mx - mw * .5, my + 3.9], [mx, my + 4.7], [mx + mw * .5, my + 3.9]], .8, sk.d, { op: .5 });
  if (old > .15) for (const sg of [-1, 1]) S.pen([[nx + sg * 5.5 * k, ny - .5], [mx + sg * (mw + 2.8), my - 3], [mx + sg * (mw + 2.4), my + 1.5]], .65, sk.d, { op: .3 + old * .45 });
  if (old > .5) S.pen([[fx - 9, y0 - 26], [fx, y0 - 27], [fx + 9, y0 - 26]], .55, sk.d, { op: .5 }), S.pen([[fx - 7, y0 - 22.5], [fx + 1, y0 - 23.3], [fx + 8, y0 - 22.6]], .5, sk.d, { op: .4 });
  if (o.mark) o.mark(S);
}
