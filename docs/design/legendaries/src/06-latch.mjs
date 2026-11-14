// VI · THE LATCH · war hammer · the hammer of the Keeper of the Last Door (Kingdom of Irondeep).
// Dwarf work: everything square. Dark hold-steel carved in key patterns and filled with bronze, a garnet over foil
// for the coal-eye, a ball of black stone in a bronze claw, and a ring on the haft for every Keeper.
import { MET, WOOD, stuff, piece, tube, haft, disc, curve, line, inlay, engrave, ridge, beads, dots, puff, glint, seat, fret, cabochon, xwrap, facet, mixc, lerp, LIGHT, add, mul } from './fine.mjs';
import { plainHammer } from './plain.mjs';

const HOLD = { k: '#06080c', d: '#141922', s: '#252d3a', b: '#3d4858', l: '#6f7e93', hi: '#c2cfe0', r: '#2a3850' };
const RED = '#a3202a', GARNET = '#b0101e';
// marks cut like a name in the hold's square hand
function names(F, r, u, v0, v1) { let d = ''; for (let v = v0; v < v1; v += 3.4) { const k = Math.floor(r() * 4); d += line(F, [[u - 2.4, v], [u + 2.4, v]]); if (k === 0) d += line(F, [[u - 2.4, v], [u - 2.4, v + 2.2]]); else if (k === 1) d += line(F, [[u + 2.4, v], [u + 2.4, v + 2.2], [u, v + 2.2]]); else if (k === 2) d += line(F, [[u, v], [u, v + 2.2]]); } return d; }

export default {
  id: 'latch', no: 'VI', name: 'The Latch', cat: 'War hammer', form: 'hammer.war', deg: -62, upright: -90,
  realm: 'Kingdom of Irondeep', people: 'The dwarves of the Deep Halls',
  owner: 'The Last Door, the sworn two hundred and twenty. It is not the queen’s and it is no clan’s.',
  wielder: 'The Keeper of the Last Door, for life. The head passes from the dead Keeper to the newly sworn, as every hammer of the order does.',
  why: 'By the oath of 612: “Not past me.” The Keeper stands in the Narrow with it and answers to the wall of names, not to the crown. Prince Korrin means to set his mother aside; whichever of them the Keeper stands behind has the hold.',
  made: 'The head was forged by Sigmund Brightanvil in 612, the year the first forge was lit. The haft has been remade six times. 493 years old.',
  legend: ['Irondeep has three doors. The first is iron, the second is stone and steel, and the last is made of dwarves. This is its latch.',
    'A ring is set on the haft for every Keeper and filled with red on the day they die. Eighteen are red. One is bare.'],
  hand: 'Short, with all its weight in the head. It needs no edge: it folds plate and breaks the arm inside a shield. It is slow to lift after a blow and reaches no further than a short sword. On open ground a long spear keeps it out all day.',
  art: 'Not Past Me', artNote: 'made for a gallery two paces wide: three blows, the third always the same, and never a step back',
  finish: 'Dark hold-steel, bronze inlay, a foiled garnet, oxblood leather, black basalt', ground: ['#4a3434', '#140c0d'], accent: GARNET,
  len: 1000,
  box: [-50, 968, -100, 124],
  details: [{ t: 'The head and the coal-eye', box: [770, 968, -100, 124] }, { t: 'A ring for every Keeper: the last is bare', box: [668, 812, -50, 50] }],
  plain: plainHammer(), plainName: 'An ordinary war hammer',
  draw(D) {
    const { S, F } = D, bz = MET.bronze, fine = D.lod >= 2, r = D.r('latch'), st = MET.bright;
    // ---- the haft: black oak between two straps of steel
    const T = haft(D, [[10, 15], [300, 16.5], [806, 15]], WOOD.bog, { grain: 6, grainOp: .5 });
    for (const sg of [-1, 1]) piece(D, [[448, sg * 13], [806, sg * 12.6], [806, sg * 17.4], [448, sg * 17.6], [440, sg * 15.4]], HOLD, { poly: .08, shade: 'none', inside: (d) => { S.fill(d, sg * (F.vx[0] * LIGHT[0] + F.vx[1] * LIGHT[1]) > 0 ? HOLD.l : HOLD.d); } });
    // nineteen rings: one for each Keeper since 612, their names cut round them; red in all but the last
    for (let i = 0; i < 19; i++) {
      const u = 480 + i * 16.8, last = i === 18;
      piece(D, [[u - 4.6, -18.6], [u + 4.6, -18.6], [u + 4.6, 18.6], [u - 4.6, 18.6]], st, { poly: .2, shadow: false, inside: () => {
        S.fill(line(F, [[u - 2.4, -19], [u + 2.4, -19], [u + 2.4, 19], [u - 2.4, 19]], true), last ? st.s : RED, { op: last ? .5 : 1 });
        if (!last) S.fill(line(F, [[u - 2.4, -19], [u + 2.4, -19], [u + 2.4, -8], [u - 2.4, -8]], true), '#e2555c', { op: .5 });
        if (fine) S.stroke(names(F, D.r('n' + i), u, -16, 16), last ? st.k : '#3a0508', .32, { units: 1, op: .8 });
      } });
    }
    // the grip: oxblood leather, bound across with steel wire
    const Tg = tube(F, [[120, 17], [270, 18.6], [436, 17]]), ox = stuff('#5a1c1a', { k: '#150606' });
    piece(D, Tg.pts, ox, { t: 0, shade: 'round', inside: () => { const x = xwrap(F, Tg, 26, 20); S.stroke(x.a + x.b, '#120404', 2.6, { units: 1, op: .8 }); inlay(S, x.a + x.b, MET.steel, .8); } });
    for (const u of [116, 440]) piece(D, [[u - 6, -19.6], [u + 6, -19.6], [u + 6, 19.6], [u - 6, 19.6]], bz, { poly: .2, inside: () => { if (fine) engrave(S, fret(F, u - 0.01, u + .01, 0, 1), bz, .3); ridge(S, line(F, [[u, -21], [u, 21]]), bz, .9); } });
    // ---- the butt: a ball of black basalt in four bronze claws
    piece(D, [[14, -17], [-4, -18.6], [-4, 18.6], [14, 17]], bz, { poly: .2, inside: () => { if (fine) engrave(S, fret(F, -2, 12, 0, 22), bz, .4); } });
    { const c = F.W(-22, 0), d = curve(F, disc([-22, 0], 18.5, 18.5, 24)); D.sil.push(d); S.layer('main'); S.fill(d, S.radial(add(c, mul(LIGHT, 8)), 27, [[0, '#8f97a6'], [.12, '#3d424d'], [.5, '#17191f'], [.86, '#06070a'], [1, '#262b36']])); S.stroke(d, '#000000', 1);
      S.fill(curve(F, disc([-22 + 0, 0], 4, 2.6, 10).map(p => [p[0], p[1]])), '#ffffff', { op: 0 }); puff(S, add(c, mul(LIGHT, 9.5)), 4.2, 2.6, '#ffffff', .85, -.6); }
    for (const sg of [-1, 1]) piece(D, [[-4, sg * 17], [-14, sg * 20.4], [-30, sg * 15.6], [-25, sg * 13.6], [-14, sg * 16.4], [-4, sg * 11]], bz, { t: [.3, .9, .2, .6, .9, .3], shade: 'cross', layer: 'over', shadow: false });
    // ---- the head. A block, square to every side: the face to the light, the pick behind, the spike above
    const blockU0 = 806, blockU1 = 886;
    // the pick: a heavy beak, four-sided
    piece(D, [[blockU1 - 4, 30], [878, 66], [852, 100], [826, 120], [838, 92], [844, 62], [blockU0 + 6, 30]], HOLD, { t: [.2, .9, .9, 0, .9, .9, .2], shade: 'none', inside: (d) => {
      S.fill(d, S.lin(F.W(880, 60), F.W(820, 80), [[0, HOLD.l], [.45, HOLD.b], [.5, HOLD.s], [1, HOLD.d]]));
      S.stroke(curve(F, [[blockU1 - 24, 31], [862, 64], [842, 96], [828, 117]], 1, false), HOLD.hi, 1, { op: .8 });
      if (fine) { let ch = ''; for (let i = 0; i < 5; i++) { const v = 40 + i * 9; ch += line(F, [[870 - i * 3, v], [862 - i * 3.6, v + 5], [852 - i * 4, v]]); } inlay(S, ch, bz, .7); }
      S.fill(line(F, [[834, 106], [826, 120], [842, 100]], true), st.l, { op: .8 });
    } });
    // the spike on top
    piece(D, [[blockU1 - 2, -13], [958, 0], [blockU1 - 2, 13]], HOLD, { t: [.1, 0, .1], shade: 'none', inside: (d) => { S.fill(d, HOLD.s); S.fill(line(F, [[blockU1 - 2, -13 * (F.vx[0] * LIGHT[0] + F.vx[1] * LIGHT[1] < 0 ? 1 : -1)], [958, 0], [blockU1 - 2, 0]], true), HOLD.l); S.fill(line(F, [[940, -3.2], [958, 0], [940, 3.2]], true), st.l, { op: .85 }); } });
    piece(D, [[blockU1 - 4, -16], [blockU1 + 5, -15], [blockU1 + 5, 15], [blockU1 - 4, 16]], bz, { poly: .2, inside: () => { ridge(S, line(F, [[blockU1 + 1, -17], [blockU1 + 1, 17]]), bz, .9); } });
    // the hammer: flaring to a face of nine blunt points
    const face = [[blockU0 + 4, -30], [blockU0 - 8, -74]]; const teeth = []; for (let i = 0; i < 4; i++) { const u = lerp(blockU0 - 8, blockU1 + 8, i / 3); teeth.push([u, -74]); if (i < 3) teeth.push([u + (blockU1 - blockU0 + 16) / 6, -90]); }
    piece(D, [[blockU0 + 4, -30], ...teeth, [blockU1 - 4, -30]], HOLD, { poly: .06, shade: 'none', inside: (d) => {
      S.fill(d, S.lin(F.W(846, -92), F.W(846, -28), [[0, st.l], [.18, HOLD.hi], [.3, HOLD.l], [.6, HOLD.b], [1, HOLD.s]]));
      for (let i = 0; i < 3; i++) { const u0 = lerp(blockU0 - 8, blockU1 + 8, i / 3), w = (blockU1 - blockU0 + 16) / 3; S.fill(line(F, [[u0 + w / 2, -90], [u0 + w, -74], [u0 + w / 2, -74]], true), HOLD.d, { op: .5 }); S.fill(line(F, [[u0, -74], [u0 + w / 2, -90], [u0 + w / 2, -74]], true), st.hi, { op: .4 }); }
      S.stroke(line(F, [[blockU0 - 8, -73], [blockU1 + 8, -73]]), HOLD.k, .9, { op: .8 });
      if (fine) inlay(S, fret(F, blockU0, blockU1, -62, 9), bz, .8);
      inlay(S, line(F, [[blockU0 - 1, -52], [blockU1 + 1, -52]]) + line(F, [[blockU0 + 1, -36], [blockU1 - 1, -36]]), bz, .9);
    } });
    // the block itself, the eye in its cheek
    piece(D, [[blockU0, -32], [blockU1, -32], [blockU1, 32], [blockU0, 32]], HOLD, { poly: .08, shade: 'none', inside: (d, P) => {
      S.fill(d, S.lin(F.W(846, -32), F.W(846, 32), [[0, HOLD.l], [.12, HOLD.b], [.6, HOLD.s], [1, HOLD.d]]));
      S.fill(d, S.lin(F.W(blockU1, 0), F.W(blockU0, 0), [[0, HOLD.hi, .3], [.3, HOLD.hi, 0], [1, '#000000', .35]]));
      if (fine) { inlay(S, fret(F, blockU0 + 5, blockU1 - 5, -25.5, 7), bz, .75); inlay(S, fret(F, blockU0 + 5, blockU1 - 5, 25.5, 7), bz, .75); }
      inlay(S, line(F, [[blockU0 + 3.5, -29], [blockU1 - 3.5, -29], [blockU1 - 3.5, 29], [blockU0 + 3.5, 29]], true), bz, .9);
      // the anvil it is set in
      const an = [[862, -15], [862, 15], [856, 15], [850, 8], [838, 8], [832, 17], [826, 17], [826, -17], [832, -17], [838, -8], [850, -8], [856, -15]], ad = line(F, an, true);
      S.fill(ad, bz.b); S.fill(ad, S.lin(F.W(862, 0), F.W(826, 0), [[0, bz.hi], [.3, bz.l], [.7, bz.b], [1, bz.s]])); S.stroke(ad, bz.k, .8);
    } });
    cabochon(D, [845, 0], 7.4, GARNET, bz, { shadow: false });
    // rivets through the straps
    beads(D, [[790, -15], [790, 15], [770, -15], [770, 15]], 1.8, st);
    glint(D, add(F.W(845, 0), mul(LIGHT, 3)), 8); glint(D, F.W(blockU1 + 6, -86), 7, { a: .3 });
  },
};
