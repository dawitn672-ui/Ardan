// VII · GRANDFATHER · spear · the spear of the First Face of the Gold Masks (Empire of Zanara).
// Golden Plains work: a blade as long as a forearm in dark iron, ground bright at the edges; a socket of red gold
// beaten into an ancestor's face; ebony bound with gold wire and ringed with ivory; a ruff of red-dyed hair.
import { MET, WOOD, IVORY, stuff, piece, tube, haft, blade, sym, disc, curve, line, inlay, engrave, ridge, beads, dots, row, puff, glint, seat, winding, tufts, mixc, lerp, spl, LIGHT, add, mul } from './fine.mjs';
import { plainSpear } from './plain.mjs';

const FE = { k: '#07080a', d: '#15171c', s: '#272a31', b: '#3f434c', l: '#70767f', hi: '#bcc2ca', r: '#2e333d' };
const RG = MET.redgold, RED = '#a8261c';

export default {
  id: 'grandfather', no: 'VII', name: 'Grandfather', cat: 'Spear', form: 'spear.war', deg: -62, upright: -90,
  realm: 'Empire of Zanara', people: 'The peoples of the Golden Plains; the Gold Masks',
  owner: 'The throne of Zanara, as all the empire’s gold is by law. Since 1062 House Sorondo, the bankers, have held it in pledge.',
  wielder: 'No one carries it. It stands in the Sorondo strongroom at Zanara, and Kwame Sorondo is the only living man who has had it in his hands. The First Face of the Gold Masks parades a copy.',
  why: 'The Salt War was paid for with the Gold Masks’ gold: the masks were melted and the spear pawned, both in secret. If the bankers ever show it, the empire learns what the Masks are made of now. So the crown pays, and keeps paying.',
  made: 'Made at Zanara in 930 for Mosi the Runner’s three hundred: the blade by the smiths of Kabale, the gold from the Ancestor Hill. 175 years old.',
  legend: ['The small face on its socket is the first ancestor of the Kanemba line. The Gold Masks do not say they carry a spear. They say Grandfather goes first.',
    'When the Masks lower their spears, the line in front of them breaks before the points arrive. His is the only face among them that is still solid gold.'],
  hand: 'A stabbing spear with a blade as long as a forearm, and a heavy butt that brings the point up fast. It goes through a hide shield and the man behind it. It is still a spear: beat the point aside and step in, and all that gold is a stick.',
  art: 'Before the Point Arrives', artNote: 'the walk forward that breaks a line’s nerve before it breaks its spears',
  finish: 'Dark iron ground bright, red gold, ebony, ivory, red-dyed hair', ground: ['#5c4a22', '#17120a'], accent: '#cf8848',
  len: 2076,
  box: [-12, 2084, -54, 54], hero: [900, 2084, -90, 90],
  details: [{ t: 'Grandfather', box: [1410, 1800, -74, 74] }, { t: 'The foot: iron, gold and ebony', box: [-12, 460, -50, 50] }],
  plain: plainSpear(), plainName: 'An ordinary spear',
  draw(D) {
    const { S, F } = D, fine = D.lod >= 2, r = D.r('spear'), lit = F.vx[0] * LIGHT[0] + F.vx[1] * LIGHT[1] < 0 ? -1 : 1;
    // ---- the haft: ebony, bound at four places with gold wire, ringed twice with ivory
    haft(D, [[140, 13.6], [800, 14.6], [1452, 13.4]], WOOD.ebony, { grain: 5, grainOp: .5 });
    for (const u0 of [400, 700, 1000, 1300]) { const Tb = tube(F, [[u0, 15.4], [u0 + 46, 15.4]]); piece(D, Tb.pts, RG, { t: 0, inside: () => { const w = winding(F, Tb, 2.6, 1.4); S.stroke(w, RG.d, .9, { units: 1, op: .8 }); S.stroke(w, RG.hi, .5, { units: 1, op: .6, tf: 'translate(-.6 -.7)' }); } }); }
    for (const u0 of [560, 860, 1160]) piece(D, [[u0, -16.4], [u0 + 14, -16.4], [u0 + 14, 16.4], [u0, 16.4]], IVORY, { poly: .3, shade: 'round', inside: () => { if (fine) engrave(S, line(F, [[u0 + 4, -18], [u0 + 4, 18]]) + line(F, [[u0 + 10, -18], [u0 + 10, 18]]), IVORY, .4, { col: '#5a4526' }); } });
    // ---- the foot: a long four-sided spike of iron, banded with gold
    piece(D, [[-8, 0], [60, -11], [150, -14.6], [150, 14.6], [60, 11]], FE, { t: [0, .6, .2, .2, .6], shade: 'none', inside: (d) => { S.fill(d, FE.s); S.fill(line(F, [[-8, 0], [60, lit * 11], [150, lit * 14.6], [150, 0]], true), FE.l); S.stroke(line(F, [[-8, 0], [150, 0]]), FE.hi, .8, { op: .7 }); } });
    for (const u0 of [112, 134]) piece(D, [[u0, -15.6], [u0 + 9, -15.6], [u0 + 9, 15.6], [u0, 15.6]], RG, { poly: .3 });
    // ---- the ruff: red-dyed hair bound under the socket
    { const m = stuff(RED); S.layer('main'); const rr = D.r('ruff'); for (const [c, n, L, op] of [[m.d, 46, 78, 1], [m.b, 50, 66, 1], [m.l, 26, 52, .8]]) { const d = tufts(F, rr, [[1452, -15], [1452, 15]], n, L, { w: 2.3, lean: [-1, 0], spread: .62, bend: .3 }); D.sil.push(d); S.fill(d, c, { op }); }
      const Tb = tube(F, [[1440, 15.6], [1462, 16]]); piece(D, Tb.pts, RG, { t: 0, inside: () => { const w = winding(F, Tb, 2.4, 1.2); S.stroke(w, RG.d, .9, { units: 1, op: .8 }); } }); }
    // ---- the blade: dark iron, a strong rib with a thread of gold on it, the edges ground bright; an open eye cut at its root
    blade(D, {
      mat: FE, st: [[1640, 13, .3], [1680, 30, .8], [1792, 37.5, 1], [1932, 27, 1], [2032, 11, 1]], tip: 2076, bevel: 6.4, hone: .95, honeFar: '#aab2bd', sky: .05, earth: .12, seat: false, wear: fine ? .6 : 0,
      litStops: [[0, FE.l], [.4, FE.b], [1, FE.l]], farStops: [[0, FE.k], [.4, FE.d], [1, FE.s]],
      bands: [[.3, .5, 'lt2', .2], [.66, .82, 'lt2', .24]], slashes: [[.55, .05, .18]], nicks: [[1890, lit, 1.6]],
      inside: () => {
        S.fill(line(F, [[1650, 0], [1650, lit * 3.4], [1960, lit * 2], [2050, 0]], true), FE.hi, { op: .55 }); S.fill(line(F, [[1650, 0], [1650, -lit * 3.4], [1960, -lit * 2], [2050, 0]], true), '#000000', { op: .5 });
        inlay(S, line(F, [[1652, 0], [2040, 0]]), RG, .9);
        // the eye of the Thousand Ancestors
        const eye = curve(F, [[1716, -23], [1727, -11], [1729.5, 0], [1727, 11], [1716, 23], [1705, 11], [1702.5, 0], [1705, -11]], [.2, 1, 1, 1, .2, 1, 1, 1]);
        inlay(S, eye, RG, 1.1); inlay(S, curve(F, disc([1716, 0], 7.4, 7.4, 18)), RG, .9); S.fill(curve(F, disc([1716, 0], 3, 3, 10)), RG.b);
        if (fine) { let lash = ''; for (let i = -3; i <= 3; i++) lash += line(F, [[1731 + (3 - Math.abs(i)) * .8, i * 5], [1737 + (3 - Math.abs(i)) * 1.4, i * 6]]); inlay(S, lash, RG, .5); }
      },
    });
    // ---- the socket: red gold. Bands of beading and zigzag; and the face
    const Ts = tube(F, [[1456, 16.6], [1560, 15], [1646, 12.6]]);
    piece(D, Ts.pts, RG, { t: 0, inside: () => {
      for (const u of [1470, 1512, 1612, 1636]) ridge(S, line(F, [[u, -18], [u, 18]]), RG, 1);
      if (fine) { let zz = ''; for (const [u0, u1] of [[1474, 1508], [1616, 1632]]) { const pts = []; for (let i = 0; i <= 12; i++) pts.push([i % 2 ? u0 + 2 : u1 - 2, -18 + i * 3]); zz += line(F, pts); } engrave(S, zz, RG, .5); beads(D, row([1491, -12], [1491, 12], 6), .9, RG); }
    } });
    {
      // the mask: chin toward the foot. A long oval, a ridged brow, eyes like a split seed, a narrow nose, a small mouth
      const M = (x, y) => [1522 + y, x], face = sym([[1522, 0], [1530, -9.4], [1552, -16], [1574, -17], [1594, -11], [1600, 0]].map(p => [p[0], p[1]]), [.5, 1, 1, 1, 1, .8]);
      // (sym mirrors across v = 0; its first and last points lie on the axis)
      piece(D, face.pts, RG, { t: face.t, shade: 'none', layer: 'over', inside: (d) => {
        const c = F.W(1566, 0); S.fill(d, S.radial(add(c, mul(LIGHT, 14)), 54, [[0, RG.hi], [.2, RG.l], [.5, RG.b], [.8, RG.s], [1, RG.d]]));
        const P = (x, y) => F.W(...M(x, y)), L = pts => line(F, pts.map(p => M(p[0], p[1]))), C = (pts, cl = false, t = 1) => curve(F, pts.map(p => M(p[0], p[1])), t, cl);
        // hollows: under the brow, beside the nose, under the lip
        for (const sg of [-1, 1]) { puff(S, P(sg * 8, 44.5), 5.6, 3.4, RG.d, .75); puff(S, P(sg * 5.4, 28), 2.6, 9, RG.d, .45); }
        puff(S, P(0, 8.6), 5.4, 2, RG.d, .6);
        // brow ridge and nose: one raised line, lit
        const brow = C([[-14, 47.5], [-8, 52.4], [-1.8, 48.6], [-1.6, 24], [-4.6, 21.4], [0, 19.6], [4.6, 21.4], [1.6, 24], [1.8, 48.6], [8, 52.4], [14, 47.5]], false, [.5, 1, .4, .8, .8, 1, .8, .8, .4, 1, .5]);
        S.stroke(brow, RG.k, 1.5, { units: 1, op: .75 }); S.stroke(brow, RG.hi, .7, { units: 1, op: .9, tf: 'translate(-.5 -.6)' });
        S.fill(L([[-1.5, 48], [1.5, 48], [1.4, 25], [-1.4, 25]]) + 'Z', RG.hi, { op: .45 });
        // eyes: a seed with a slit
        for (const sg of [-1, 1]) { const e = C([[sg * 3.6, 43], [sg * 8, 45.6], [sg * 12.6, 43], [sg * 8, 40.4]], true, [.3, 1, .3, 1]); S.fill(e, RG.l); S.stroke(e, RG.k, .8, { units: 1, op: .8 }); S.stroke(L([[sg * 4.4, 43], [sg * 11.8, 43]]), RG.k, .9, { units: 1 }); }
        // mouth
        const mo = C([[-4.4, 12.4], [0, 14.4], [4.4, 12.4], [0, 10.4]], true, [.3, 1, .3, 1]); S.fill(mo, RG.l); S.stroke(mo, RG.k, .7, { units: 1, op: .8 }); S.stroke(L([[-3.6, 12.4], [3.6, 12.4]]), RG.k, .7, { units: 1 });
        if (fine) {
          // the bands on the brow and the cuts on the cheeks that every Kanemba mask carries
          engrave(S, C([[-10.5, 58], [0, 60.6], [10.5, 58]]) + C([[-9, 63], [0, 65.4], [9, 63]]) + C([[-7, 68], [0, 70], [7, 68]]), RG, .55);
          let ck = ''; for (const sg of [-1, 1]) for (let i = 0; i < 3; i++) ck += L([[sg * (8 + i * 2.4), 34 - i * .6], [sg * (10.4 + i * 2.4), 28.4 - i * .6]]); engrave(S, ck, RG, .5);
        }
      } });
      // ears: two small loops
      for (const sg of [-1, 1]) { S.layer('main'); const ear = curve(F, disc([1562, sg * 17.6], 5.4, 3.2, 12)); S.stroke(ear, RG.k, 2.6, { units: 1 }); S.stroke(ear, RG.b, 1.7, { units: 1 }); }
    }
    glint(D, add(F.W(1578, 0), mul(LIGHT, 9)), 8); glint(D, F.W(1880, lit * 30.5), 9, { a: .3 });
  },
};
