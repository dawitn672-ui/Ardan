// VIII · MIDSUMMER · glaive · the War-Mother's rhino glaive (League of the Tusk Clans).
// Orc work of the eastern grass: nothing polished but the edge. Iron left black from the fire with the hammer's marks
// in it, the year's rhino horn painted red and lashed on with rawhide, teeth and turquoise on a thong, hide, horsehair.
import { MET, WOOD, BONE, stuff, piece, tube, haft, disc, curve, line, inlay, engrave, beads, dots, puff, glint, cabochon, winding, tufts, mixc, lerp, spl, LIGHT, add, mul } from './fine.mjs';
import { plainGlaive } from './plain.mjs';

const BLK = { k: '#050506', d: '#101114', s: '#1d1f24', b: '#2d3037', l: '#555a65', hi: '#9aa2b0', r: '#23272f' };
const RED = '#a3261f', TURQ = '#3fb7a9', RAW = stuff('#c8b184', { k: '#3a2c14' });

export default {
  id: 'midsummer', no: 'VIII', name: 'Midsummer', cat: 'Glaive', form: 'pole.glaive', deg: -62, upright: -90,
  realm: 'League of the Tusk Clans', people: 'The orcs of the eastern grass; Clan Ironhide of Grakmar',
  owner: 'The War-Mother’s hearth at Grakmar. By eastern custom the hearth, and what hangs over it, go to the youngest daughter.',
  wielder: 'Urza Ironhide, War-Mother of the thirty-one clans. She rides with it at the Great Ride each midsummer and kills the year’s rhino with it.',
  why: 'The clans swear to a War-Mother over the rhino she has killed. Urza fainted in the heat at the Great Ride of 1104, and her heir Shara froze at her own trial: another hand made the kill. If the clans learn of it, the glaive goes to whoever takes the next rhino.',
  made: 'Hammered at Grakmar in 1062 by the smiths of Clan Ironhide from the spearheads of thirty-one clans. The horn is that year’s rhino’s. 43 years old: the youngest thing here.',
  legend: ['On midsummer’s day in 1062 Grakka Ironhide killed the year’s rhino alone, and thirty-one clans swore to her over the carcass. Its horn was painted red and bound to the blade that killed it.',
    'Two War-Mothers have died of the sun with it in their hands. The clans do not call that ill luck. They call it the price.'],
  hand: 'Brutally heavy in the head: made to stop a ton of rhino, not to fence. What it hits is opened or broken, armour or no. It wants both hands and a wide swing, and it is slow coming back. A rider who gets past the blade has only the haft to fear.',
  art: 'The Year’s Rhino', artNote: 'one set stroke, taken standing, against anything that charges',
  finish: 'Black forge-iron ground bright at the edge, a red-painted horn, teeth, turquoise, rhino hide, horsehair', ground: ['#5a5140', '#16130d'], accent: TURQ,
  len: 2080,
  box: [-12, 2088, -96, 182], hero: [1010, 2088, -120, 200],
  details: [{ t: 'The blade and the year’s horn', box: [1440, 2088, -100, 184] }, { t: 'Hide, rawhide and bone', box: [640, 960, -60, 60] }],
  plain: plainGlaive(), plainName: 'An ordinary bill',
  draw(D) {
    const { S, F } = D, fine = D.lod >= 2, r = D.r('glaive'), st = MET.bright, dn = [F.ux[1], F.vx[1]];
    // ---- the haft: dark wood, an iron spike at its foot
    haft(D, [[60, 16], [800, 17.4], [1500, 16]], WOOD.walnut, { grain: 7 });
    piece(D, [[-8, 0], [30, -12], [70, -17.4], [70, 17.4], [30, 12]], BLK, { t: [0, .6, .2, .2, .6], shade: 'bar', turn: 'dark' });
    // the upper haft sewn into grey rhino hide, the seam laced with rawhide
    const Th = tube(F, [[690, 19], [1100, 19.6], [1482, 18.4]]), hide = stuff('#8b857a', { k: '#1f1c17' });
    piece(D, Th.pts, hide, { t: 0, shade: 'round', inside: () => {
      if (fine) { const sp = [], cr = []; for (let i = 0; i < 300; i++) sp.push([694 + r() * 784, (r() * 2 - 1) * 19]); S.fill(dots(F, sp, 1), hide.d, { op: .35 }); let wr = ''; for (let i = 0; i < 26; i++) { const u = 700 + r() * 770, v = (r() * 2 - 1) * 14, l = 8 + r() * 22; wr += spl(F.P([[u, v], [u + l * .5, v + (r() - .5) * 5], [u + l, v + (r() - .5) * 4]])); } S.stroke(wr, hide.k, .5, { units: 1, op: .4 }); }
      let seam = '', lace = ''; seam = line(F, [[690, 5], [1482, 5]]); for (let u = 700; u < 1476; u += 17) lace += line(F, [[u, -1], [u + 9, 11]]) + line(F, [[u + 9, -1], [u, 11]]);
      S.stroke(seam, hide.k, 1.2, { units: 1, op: .7 }); S.stroke(lace, RAW.k, 3.1, { units: 1 }); S.stroke(lace, RAW.b, 2.1, { units: 1 });
    } });
    // two rings of bone, cut with notches for the years
    for (const u0 of [664, 1300]) piece(D, [[u0, -21], [u0 + 22, -21], [u0 + 22, 21], [u0, 21]], BONE, { poly: .3, shade: 'round', inside: () => { let nt = ''; for (let v = -17; v <= 17; v += 4.2) nt += line(F, [[u0 + 5, v], [u0 + 17, v]]); engrave(S, nt, BONE, .7, { col: '#4a3d28' }); } });
    // the lower grip bound with strips of rawhide
    const Tg = tube(F, [[300, 17.6], [520, 18.2]]); piece(D, Tg.pts, RAW, { t: 0, shade: 'round', inside: () => { const w = winding(F, Tg, 13, 8); S.stroke(w, RAW.k, 1.3, { units: 1, op: .7 }); S.stroke(w, RAW.hi, .7, { units: 1, op: .5, tf: 'translate(-1 -1.2)' }); } });
    // a tail of black horsehair with a red lock, tied under the socket; it hangs as the page hangs it
    { S.layer('main'); const rr = D.r('tail'); for (const [c, n, L, w, op] of [['#0d0c0e', 40, 300, 2.6, 1], ['#2a2729', 34, 270, 2, 1], [RED, 9, 250, 2, .95], ['#5a5557', 18, 220, 1.2, .7]]) { const d = tufts(F, rr, [[1476, -19], [1476, 19]], n, L, { w, lean: dn, spread: .3, bend: .16 }); D.sil.push(d); S.fill(d, c, { op }); } }
    // ---- the socket: black iron, two bands
    const Ts = tube(F, [[1470, 20.6], [1540, 19.6], [1612, 17.4]]);
    piece(D, Ts.pts, BLK, { t: 0, shade: 'bar', turn: 'dark', inside: () => { for (const u of [1478, 1602]) { S.stroke(line(F, [[u, -22], [u, 22]]), BLK.k, 5, { units: 1 }); S.stroke(line(F, [[u, -22], [u, 22]]), BLK.l, 2.6, { units: 1, op: .8 }); } } });
    // ---- the horn of the rhino of 1062, painted red, its tip worn back to bone; lashed on with rawhide
    const horn = [[1548, 16], [1570, 64], [1626, 120], [1716, 170], [1662, 112], [1640, 62], [1646, 16]];
    piece(D, horn, stuff(RED), { t: [.2, .9, 1, 0, 1, .9, .2], shade: 'none', inside: (d) => {
      S.fill(d, S.lin(F.W(1560, 80), F.W(1680, 60), [[0, '#d0473c'], [.35, RED], [.75, '#6d1512'], [1, '#3d0a0a']]));
      S.fill(d, S.lin(F.W(1600, 20), F.W(1716, 170), [[0, '#000000', .25], [.2, '#000000', 0], [.72, '#e9dcc0', 0], [.86, '#e9dcc0', .9], [1, '#fff6e0', 1]]));
      let ring = ''; for (let i = 0; i < 9; i++) { const t = .08 + i * .085, a = [lerp(1548, 1716, t ** 1.1), lerp(16, 170, t)], b = [lerp(1646, 1716, t ** .9), lerp(16, 170, t)]; ring += spl(F.P([a, [(a[0] + b[0]) / 2 + 5, (a[1] + b[1]) / 2 + 3], b])); }
      S.stroke(ring, '#3d0a0a', .7, { units: 1, op: .55 }); if (fine) { let ch = ''; for (let i = 0; i < 12; i++) { const u = 1570 + r() * 80, v = 30 + r() * 80; ch += line(F, [[u, v], [u + 3 + r() * 5, v + 2 + r() * 4]]); } S.stroke(ch, '#e9dcc0', .5, { units: 1, op: .5 }); }
    } });
    { S.layer('over'); let ls = ''; for (const u of [1556, 1574, 1622, 1640]) ls += line(F, [[u, -19], [u + 8, 26]]); ls += line(F, [[1556, 26], [1640, -19]]) + line(F, [[1640, 26], [1556, -19]]); S.stroke(ls, RAW.k, 4.6, { units: 1 }); S.stroke(ls, RAW.b, 3.3, { units: 1 }); S.stroke(ls, RAW.hi, .8, { units: 1, op: .5, tf: 'translate(-.8 -1)' }); }
    // ---- the blade: black from the fire, every hammer blow still in it; only the edge is ground, and that by hand
    const bl = [[1600, -17], [1642, -42], [1762, -76], [1902, -82], [2002, -57], [2078, -5], [2040, 9], [1960, 21], [1840, 25], [1700, 22], [1604, 17]];
    piece(D, bl, BLK, { t: [.2, .8, 1, 1, 1, 0, .8, 1, 1, 1, .2], shade: 'none', inside: (d) => {
      S.fill(d, S.lin(F.W(1840, -84), F.W(1840, 26), [[0, BLK.l], [.3, BLK.b], [.7, BLK.s], [1, BLK.d]]));
      S.fill(d, S.lin(F.W(2080, 0), F.W(1600, 0), [[0, BLK.hi, .3], [.3, BLK.hi, 0], [.7, '#000000', 0], [1, '#000000', .45]]));
      // the hammer's dimples
      const rr = D.r('hammer'), dk = [], lt = []; for (let i = 0; i < (fine ? 70 : 24); i++) { const u = 1620 + rr() * 420, v = -70 + rr() * 90; dk.push([u, v]); lt.push([u + 1.6, v + 2]); }
      S.fill(dots(F, dk, 4.6), '#000000', { op: .3 }); S.fill(dots(F, lt, 3.4), BLK.l, { op: .28 });
      // the ground edge: wide, bright, its inner line wandering where the stone went
      const inner = []; for (let i = 0; i <= 18; i++) { const t = i / 18, e = [[1620, -30], [1642, -42], [1762, -76], [1902, -82], [2002, -57], [2078, -5]], k = t * 5, j = Math.min(4, Math.floor(k)), p = [lerp(e[j][0], e[j + 1][0], k - j), lerp(e[j][1], e[j + 1][1], k - j)]; inner.push([p[0] - 3, p[1] + 15 + Math.sin(i * 2.3) * 2.6 - t * 5]); }
      const edge = line(F, [[1600, -60], [1640, -90], [1900, -110], [2100, -40], [2090, 0], ...inner.reverse()], true);
      S.fill(edge, S.lin(F.W(1840, -84), F.W(1840, -62), [[0, st.hi], [.4, st.l], [1, st.s]]));
      S.fill(edge, S.lin(F.W(2080, -40), F.W(1620, -40), [[0, st.hi, .5], [.2, st.hi, 0], [.45, st.d, .35], [.47, st.hi, .5], [.75, st.hi, 0], [1, st.d, .45]]));
      S.stroke(line(F, inner), BLK.k, 1, { op: .8 });
      if (fine) { let gr = ''; for (let i = 0; i < 40; i++) { const u = 1640 + rr() * 400, v = -80 + rr() * 16; gr += line(F, [[u, v], [u + 6 + rr() * 10, v + 4 + rr() * 6]]); } S.stroke(gr, st.d, .35, { units: 1, op: .35 }); }
      // the mark of the league struck into it, red rubbed in the cuts: two spears crossed, a horn between
      const mk = line(F, [[1690, -34], [1750, -6]]) + line(F, [[1690, -6], [1750, -34]]) + spl(F.P([[1706, -19], [1722, -27], [1738, -22]]));
      S.stroke(mk, '#000000', 2.2, { units: 1, op: .8 }); S.stroke(mk, RED, 1.1, { units: 1, op: .9 });
      let pn = []; for (let u = 1640; u < 1990; u += 16) pn.push([u, 14 + (u - 1640) * .012]); S.fill(dots(F, pn, 1.7), '#000000', { op: .7 }); S.fill(dots(F, pn.map(p => [p[0] + .8, p[1] + .9]), 1), BLK.l, { op: .5 });
    } });
    // ---- a thong of teeth and turquoise round the socket
    { const th = []; for (let i = 0; i < 5; i++) { const v = -16 + i * 8; th.push(v); }
      S.layer('over'); const cord = line(F, [[1500, -22], [1500, 22]]); S.stroke(cord, RAW.k, 2.6, { units: 1 }); S.stroke(cord, RAW.b, 1.6, { units: 1 });
      for (const v of th) piece(D, [[1502, v - 3.6], [1470 - Math.abs(v) * .3, v + (v < 0 ? -1.5 : 1.5) * .4], [1502, v + 3.6]], BONE, { t: [.4, .2, .4], shade: 'bar', turn: 'round', layer: 'over', shadow: false });
      for (const v of [-12, -4, 4, 12]) cabochon(D, [1503, v], 2.3, TURQ, MET.silver, { shadow: false }); }
    cabochon(D, [1598, 4], 4.4, TURQ, MET.silver, { shadow: false });
    glint(D, F.W(1930, -79), 9, { a: .3 });
  },
};
