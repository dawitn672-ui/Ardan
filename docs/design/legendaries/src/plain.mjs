// The ordinary arms, Plain make: what a journeyman turns out and a man-at-arms carries. Drawn with the same kit and in
// the same light as the legendaries, so the contrast is the thing itself and not the drawing: sound steel, an iron
// cross, a leather grip, ash and oak. No inlay, no stone, no name.
import { MET, WOOD, stuff, piece, tube, blade, haft, sym, disc, curve, line, winding, seat, arcFrame, backblade, spl, lerp, polyline } from './fine.mjs';

const LEATHER = stuff('#5d4028', { k: '#1b1009' });
const IRON = MET.iron, STEEL = MET.steel;
const quiet = { bands: [[.16, .3, 'dk2', .2], [.5, .66, 'lt2', .3]], slashes: [], sky: .1 };
const wrap = (D, T) => { const { S, F } = D, w = winding(F, T, 11, 9); S.stroke(w, LEATHER.k, .9, { units: 1, op: .55 }); S.stroke(w, LEATHER.l, .5, { units: 1, op: .35, tf: 'translate(-.8 -1)' }); };

// a sword of any length: o.blade, o.grip, o.w (half-width at the cross), o.cross (half-span), o.pommel (radius)
export function plainSword(o) {
  const L = o.blade, g = o.grip, pr = o.pommel;
  return {
    id: 'plain-sword-' + L, box: [-(g + pr * 2 + 26), L + 16, -(o.cross + 14), o.cross + 14],
    draw(D) {
      const { S, F } = D;
      blade(D, { mat: STEEL, st: [[0, o.w], [L * .5, o.w * .82], [L * .86, o.w * .45]], tip: L, bevel: 1.8, hone: .5, ...quiet, fuller: o.ricasso ? null : { u0: 10, u1: L * .55, w: o.w * .42, w1: o.w * .2 } });
      const T = tube(F, [[-8, o.w * .56], [-g * .5, o.w * .6], [-g - 4, o.w * .46]]);
      piece(D, T.pts, LEATHER, { t: 0, shade: 'round', inside: () => wrap(D, T) });
      const cr = sym([[-13, 0], [-13, -o.cross], [-11, -o.cross - 4], [-2, -o.cross - 4], [0, -o.cross], [0, -o.w - 6], [5, 0]], [.2, .3, .6, .6, .3, .2, .2]);
      piece(D, cr.pts, IRON, { t: cr.t, shade: 'cross' });
      const c = [-(g + pr + 2), 0];
      piece(D, disc(c, pr, pr, 24), IRON, { shade: 'ball', spec: false, inside: () => { S.stroke(curve(F, disc(c, pr * .58, pr * .58, 20)), IRON.k, .8, { op: .5 }); } });
    },
  };
}
export function plainSabre() {
  return {
    id: 'plain-sabre', box: [-140, 800, -400, 50],
    draw(D) {
      const { F } = D, A = arcFrame(F, 760);
      backblade(D, A, { mat: STEEL, st: [[0, 14, 16], [400, 13, 15], [700, 10, 12]], tip: [780, -6], hone: .55, strips: [[0, .09, STEEL.l, .7], [.09, .16, STEEL.s, .5], [.6, .88, STEEL.s, .3]] });
      const T = tube(F, [[-6, 11], [-60, 12.5], [-112, 11]]); piece(D, T.pts, LEATHER, { t: 0, shade: 'round', inside: () => wrap(D, T) });
      const cr = sym([[-9, 0], [-9, -40], [-7, -44], [-1, -44], [1, -40], [1, -12], [6, 0]], [.2, .3, .6, .6, .3, .2, .2]); piece(D, cr.pts, IRON, { t: cr.t, shade: 'cross' });
      piece(D, [[-110, -11.5], [-124, -9], [-128, 4], [-122, 14], [-110, 12]], IRON, { t: .8, shade: 'ball', spec: false });
    },
  };
}
export function plainDagger() {
  return {
    id: 'plain-dagger', box: [-150, 262, -50, 50],
    draw(D) {
      const { F } = D;
      blade(D, { mat: STEEL, st: [[0, 15], [120, 12.5], [210, 6]], tip: 250, bevel: 1.5, hone: .5, ...quiet });
      const T = tube(F, [[-6, 9.5], [-55, 11], [-104, 9]]); piece(D, T.pts, LEATHER, { t: 0, shade: 'round', inside: () => wrap(D, T) });
      const cr = sym([[-8, 0], [-8, -36], [-6, -39], [-1, -39], [1, -36], [1, -17], [4, 0]], [.2, .3, .6, .6, .3, .2, .2]); piece(D, cr.pts, IRON, { t: cr.t, shade: 'cross' });
      piece(D, disc([-116, 0], 13, 13, 20), IRON, { shade: 'ball', spec: false });
    },
  };
}
// hafted arms: the butt at u = 0, the head toward +u
const pole = (D, L, hw, wood = WOOD.ash) => haft(D, [[0, hw], [L * .5, hw + .6], [L, hw - .8]], wood, { grain: 7 });
export function plainAxe() {
  return {
    id: 'plain-axe', box: [-16, 1300, -60, 150],
    draw(D) {
      const { S, F } = D; pole(D, 1250, 15);
      piece(D, [[1150, -19], [1252, -19], [1256, 19], [1262, 60], [1284, 128], [1180, 132], [1106, 118], [1150, 62], [1160, 19], [1150, 19]], IRON, { t: [.2, .2, .4, .9, .3, .9, .3, .9, .4, .2], shade: 'cross', inside: () => { S.fill(curve(F, [[1280, 124], [1180, 128], [1110, 116], [1126, 104], [1182, 116], [1270, 110]], [.3, .9, .3, .9, .9, .3]), IRON.hi, { op: .7 }); } });
      piece(D, [[1148, -20], [1164, -20], [1164, 20], [1148, 20]], IRON, { poly: .2 });
    },
  };
}
export function plainHammer() {
  return {
    id: 'plain-hammer', box: [-16, 880, -86, 86],
    draw(D) {
      const { S, F } = D; pole(D, 800, 14, WOOD.oak);
      for (const sg of [-1, 1]) piece(D, [[560, sg * 14], [790, sg * 14], [790, sg * 16.5], [560, sg * 16.5]], IRON, { poly: .1, shade: 'none', inside: (d) => S.fill(d, sg < 0 ? IRON.l : IRON.s) });
      piece(D, [[770, -22], [770, -62], [838, -62], [838, -22], [826, 22], [812, 40], [804, 80], [796, 40], [782, 22]], IRON, { t: [.2, .3, .3, .2, .5, .8, 0, .8, .5], shade: 'cross' });
      piece(D, [[836, -8], [876, 0], [836, 8]], IRON, { t: [.2, 0, .2], shade: 'face' });
    },
  };
}
export function plainSpear() {
  return {
    id: 'plain-spear', box: [-16, 2180, -46, 46],
    draw(D) {
      const { S, F } = D; pole(D, 1900, 14);
      blade(D, { mat: STEEL, st: [[1940, 12, .3], [1972, 30, .9], [2060, 20, .9]], tip: 2166, bevel: 1.8, hone: .5, ...quiet, seat: false });
      piece(D, [[1880, -15], [1944, -11], [1944, 11], [1880, 15]], IRON, { poly: .15 });
    },
  };
}
export function plainGlaive() {
  return {
    id: 'plain-glaive', box: [-16, 2110, -120, 120],
    draw(D) {
      const { S, F } = D; pole(D, 1700, 15);
      for (const sg of [-1, 1]) piece(D, [[1400, sg * 15], [1690, sg * 15], [1690, sg * 17.6], [1400, sg * 17.6]], IRON, { poly: .1, shade: 'none', inside: (d) => S.fill(d, sg < 0 ? IRON.l : IRON.s) });
      // a common bill: a cleaver of a blade, a hook on its back, a spike above
      piece(D, [[1660, -16], [1690, 16], [1720, 44], [1800, 62], [1960, 56], [2096, 6], [1980, 14], [1900, -8], [1840, -60], [1808, -104], [1800, -56], [1760, -22]], STEEL, { t: [.2, .4, .8, .9, .9, 0, .8, .8, .7, 0, .7, .7], shade: 'cross', inside: () => { S.fill(curve(F, [[1722, 44], [1800, 62], [1960, 56], [2094, 7], [1960, 46], [1800, 51]], [.3, .9, .9, .2, .9, .9]), STEEL.hi, { op: .7 }); } });
      piece(D, [[1650, -18], [1668, -18], [1668, 18], [1650, 18]], IRON, { poly: .2 });
    },
  };
}
export function plainBow() {
  return {
    id: 'plain-bow', box: [-980, 980, -200, 40],
    draw(D) {
      const { S, F } = D, A = arcFrame(F, 2760), T = tube(A, [[-950, 6], [-500, 12], [0, 15], [500, 12], [950, 6]]);
      S.layer('under'); S.stroke(polyline([A.W(-942, -2), A.W(942, -2)]), '#d8cfb8', 1.6, { units: 1 });
      piece({ ...D, F: A }, T.pts, WOOD.yewHeart, { t: 0, shade: 'round', inside: (d) => { S.fill(line(A, [...T.B, ...T.B.slice().reverse().map(p => [p[0], p[1] - 4])], true), WOOD.yewSap.b, { op: .9 }); } });
      const Tg = tube(A, [[-55, 16], [55, 16]]); piece({ ...D, F: A }, Tg.pts, LEATHER, { t: 0, shade: 'round' });
    },
  };
}
export function plainCrossbow() {
  return {
    id: 'plain-crossbow', box: [-16, 830, -380, 380],
    draw(D) {
      const { S, F } = D, wd = WOOD.oak;
      // the bow of ash across the head, its cord, the tiller, the iron stirrup

      const prod = []; for (let i = 0; i <= 20; i++) { const v = lerp(-350, 350, i / 20); prod.push([660 - (v * v) / 1900, v]); }
      const pb = [...prod.map(p => [p[0] + 9 - Math.abs(p[1]) * .012, p[1]]), ...prod.slice().reverse().map(p => [p[0] - 9 + Math.abs(p[1]) * .012, p[1]])];
      S.layer('under'); S.stroke(line(F, [prod[0], [470, 0], prod[20]]), '#d8cfb8', 2, { units: 1 });
      piece(D, pb, WOOD.ash, { t: 0, shade: 'cross', turn: 'round' });
      haft(D, [[0, 20], [300, 24], [640, 17], [690, 15]], wd, { grain: 6 });
      piece(D, disc([470, 0], 9, 9, 16), MET.iron, { shade: 'ball', spec: false });
      S.layer('main'); const stir = curve(F, [[690, -34], [742, -40], [786, 0], [742, 40], [690, 34]], 1, false); D.sil.push(stir); S.stroke(stir, IRON.k, 9, { units: 1 }); S.stroke(stir, IRON.b, 6.6, { units: 1 }); S.stroke(stir, IRON.l, 1.6, { units: 1, op: .7 });
      S.stroke(line(F, [[640, -22], [676, 22]]) + line(F, [[640, 22], [676, -22]]), '#b7a988', 5, { units: 1 });
    },
  };
}
