// The ordinary arms, Plain make: what a journeyman turns out and a man-at-arms carries. Drawn with the same kit and in
// the same light as the legendaries, so the contrast is the thing itself and not the drawing: sound steel, an iron
// cross, a leather grip, ash and oak. No inlay, no stone, no name.
import { MET, WOOD, stuff, piece, tube, blade, haft, sym, disc, curve, line, winding, seat, ridge, mixc, lerp, spl } from './kit.mjs';

const LEATHER = stuff('#5d4028', { k: '#1b1009' });
const IRON = MET.iron, STEEL = MET.steel;
const quiet = { bands: [[.16, .3, 'dk2', .2], [.5, .66, 'lt2', .3]], slashes: [], sky: .1 };

// a sword of any length: o.blade, o.grip, o.w (half-width at the cross), o.cross (half-span), o.pommel (radius)
export function plainSword(o) {
  const L = o.blade, g = o.grip, pr = o.pommel;
  return {
    id: 'plain-sword-' + L, box: [-(g + pr * 2 + 26), L + 16, -(o.cross + 14), o.cross + 14],
    draw(D) {
      const { S, F } = D;
      blade(D, { mat: STEEL, st: [[0, o.w], [L * .5, o.w * .82], [L * .86, o.w * .45]], tip: L, bevel: 1.8, hone: .5, ...quiet, fuller: o.ricasso ? null : { u0: 10, u1: L * .55, w: o.w * .42, w1: o.w * .2 } });
      if (o.ricasso) seat(D, 0, o.w + 2, 40, { op: .25 });
      const T = tube(F, [[-8, o.w * .56], [-g * .5, o.w * .6], [-g - 4, o.w * .46]]);
      piece(D, T.pts, LEATHER, { t: 0, shade: 'round', inside: () => { const w = winding(F, T, 11, 9); S.stroke(w, LEATHER.k, .9, { units: 1, op: .55 }); S.stroke(w, LEATHER.l, .5, { units: 1, op: .35, tf: 'translate(-.8 -1)' }); } });
      const cr = sym([[-10, 0], [-10, -o.cross], [-9, -o.cross - 3], [-1, -o.cross - 3], [0, -o.cross], [0, -o.w - 6], [4, 0]], [.2, .3, .6, .6, .3, .2, .2]);
      piece(D, cr.pts, IRON, { t: cr.t, shade: 'cross' });
      const c = [-(g + pr + 2), 0];
      piece(D, disc(c, pr, pr, 24), IRON, { shade: 'ball', spec: false, inside: () => { S.stroke(curve(F, disc(c, pr * .58, pr * .58, 20)), IRON.k, .8, { op: .5 }); } });
    },
  };
}
