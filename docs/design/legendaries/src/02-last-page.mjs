// II · THE LAST PAGE · greatsword · the bearing sword of the Temple of the Returning Sun (Holy See of Solenne).
// Solen temple work: white steel polished like glass, a page of fire-gilding written with names, the twelve-rayed sun.
import { MET, stuff, piece, tube, blade, sym, disc, curve, line, inlay, engrave, ridge, beads, row, dots, puff, glint, seat, gem, trim, winding, lettering, enamel, mixc, lerp, LIGHT, add, mul } from './fine.mjs';
import { plainSword } from './plain.mjs';

const WHITE = { k: '#2a2e38', d: '#6f7887', s: '#a9b1bd', b: '#dfe4ea', l: '#f5f7fa', hi: '#ffffff', r: '#c6d1de' };
const NAMES = 'MARCUS.CASSIAN.DORIAN.GALEN.LOTHAR.AURELIO.SEVERAN.LUCAN.TANCRED.OTTONE.PIERO.UGO.LEONE.RODERIC.TEODOR.ALDO.SILVAN.VALERIAN.OCTAVIAN.MAXIMIAN.CORVAN.ETTORE.BRUNO'.split('.');
// a ring of pointed rays round c: [u, v]
const rays = (c, r0, r1, n, w, a0 = 0, skip = []) => { const out = []; for (let i = 0; i < n; i++) { if (skip.includes(i)) continue; const a = a0 + i / n * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a); out.push([[c[0] + ca * r0 - sa * w, c[1] + sa * r0 + ca * w], [c[0] + ca * r1, c[1] + sa * r1], [c[0] + ca * r0 + sa * w, c[1] + sa * r0 - ca * w]]); } return out; };

export default {
  id: 'last-page', no: 'II', name: 'The Last Page', cat: 'Greatsword', form: 'sword.great', deg: 118, upright: 90,
  realm: 'Holy See of Solenne', people: 'The Solen; the Temple of the Returning Sun',
  owner: 'The Temple of the Returning Sun. It lies on the high altar at Solenne beside the Book of Noon. No crown and no house has a claim on it.',
  wielder: 'The Grand Master of the Knights of the Sun (in 1105, Bruno Castell) carries it before the High Luminary on Return Day, and into the field when the order rides.',
  why: 'By vow. A Knight of the Sun gives up house and arms, so the order keeps no heirlooms: its one treasure is the Temple’s, lent to the office. Every Valdane king is crowned kneeling under it, and that is the Temple’s hold on Varenna.',
  made: 'Forged at Solenne in 760 from the swords the last imperial guards laid down when they chose vows over the axe; gilded by the women of House Corvane. 345 years old.',
  legend: ['Every knight’s name is written in the Book of Noon as if he were already dead. The Grand Masters’ names are written here instead, in gold down the blade, and the order calls the sword the book’s last page.',
    'There is room left for eleven names. The Temple has never said what happens when the page is full.'],
  hand: 'Made to be carried upright before a procession, and as long as a man. Few can fight with it at all. One who can clears a ring two paces wide and breaks pikes like kindling. It cannot be hurried: a man who gets inside the ring is safe from it.',
  art: 'The Sun Does Not Turn Back', artNote: 'every stroke goes on into the next; there is no guard in it, and no step back',
  finish: 'White steel, fire-gilding, white leather, rock crystal, a drop of red', ground: ['#34436b', '#0d1226'], accent: '#e7c14e',
  len: 1670,
  box: [-420, 1272, -196, 196],
  details: [{ t: 'The sun at the cross', box: [-420, 250, -196, 196] }, { t: 'The page of names', box: [236, 336, -30, 30], deg: 0 }],
  plain: plainSword({ blade: 1240, grip: 360, w: 27, cross: 185, pommel: 25, ricasso: true }), plainName: 'An ordinary greatsword',
  draw(D) {
    const { S, F } = D, g = MET.gold, fine = D.lod >= 2, r = D.r('hilt'), lea = stuff('#e9e2d2', { s: '#c9bfa8', d: '#9c917a', l: '#f8f4ea', hi: '#ffffff', k: '#3d3526' });
    const pageHw = u => lerp(21.5, 18.5, Math.min(1, Math.max(0, (u - 238) / 330)));
    // ---- the blade: white steel; below the ricasso a page of gilding, ruled and written
    blade(D, {
      mat: WHITE, st: [[0, 24, .4], [200, 24, .5], [214, 26, .6], [234, 34, .3], [600, 29.6, 1], [1000, 22.4, 1], [1184, 13, 1]], tip: 1264, bevel: 3.4, hone: .95, wear: fine ? .5 : 0, sky: .2, earth: .12,
      bands: [[.24, .34, 'dk2', .16], [.5, .6, 'lt', .5], [.7, .8, 'dk2', .14], [.84, .94, 'lt2', .4]], slashes: [[.62, .024, .6], [.652, .007, .7]],
      nicks: [[790, -1, 1.5]],
      core: { mat: { ...g, s: g.b, b: g.l, d: g.s }, hw: pageHw, u0: 238, u1: 568, point: 30, wall: 0, inside: () => {
        // the page: five ruled lines of names in a dark hand, the first letter in red, the end of the last line still bare
        let rule = ''; for (let i = 0; i <= 5; i++) rule += line(F, [[244, -17.5 + i * 7], [566, -17.5 + i * 7]]);
        S.stroke(rule, g.s, .25, { units: 1, op: .8 });
        if (fine) {
          let i = 0, txt = '';
          for (let ln = 0; ln < 5; ln++) { let u = ln ? 246 : 252.5; while (i < NAMES.length) { const nm = i ? NAMES[i] : NAMES[i].slice(1), w = lettering(F, nm + ' . ', 0, 0, 4.7, { gap: .25 }).width; if (u + w > 564) break; txt += lettering(F, nm + (i < NAMES.length - 1 ? ' .' : ''), u, -14 + ln * 7, 4.7, { gap: .25 }).d; u += w + 1.4; i++; } }
          S.stroke(txt, '#3a2606', .66, { units: 1, op: .92 });
          S.stroke(lettering(F, 'M', 245.4, -14, 5.9, {}).d, '#a3202a', 1.15, { units: 1 });
        } else { let tx = ''; for (let ln = 0; ln < 5; ln++) tx += line(F, [[246, -14 + ln * 7], [ln === 4 ? 420 : 560, -14 + ln * 7]]); S.stroke(tx, '#3a2606', 2.2, { units: 1, op: .5, dash: '5 2' }); }
        inlay(S, line(F, [[240, -19.6], [566, -17.4], [596, 0], [566, 17.4], [240, 19.6]], true), { ...g, b: g.s }, .5);
      } },
    });
    // the ricasso bound in white leather, studded with gold; two rays to catch a blade above it
    const Tr = tube(F, [[20, 25.5], [110, 26.2], [200, 25.5]]);
    piece(D, Tr.pts, lea, { t: 0, shade: 'round', inside: () => {
      const w = winding(F, Tr, 22, 10); S.stroke(w, lea.d, 1, { units: 1, op: .7 }); S.stroke(w, '#ffffff', .6, { units: 1, op: .6, tf: 'translate(-.9 -1.1)' });
      const st = []; for (let u = 34; u < 196; u += 22) for (const v of [-13, 0, 13]) st.push([u + (v ? 0 : 11), v]); beads(D, st, 1.7, g);
      seat(D, 20, 28, 12, { col: '#4a3d22', op: .4 }); seat(D, 200, 28, -12, { col: '#4a3d22', op: .4 });
    } });
    for (const sg of [-1, 1]) piece(D, [[204, sg * 24], [217, sg * 62], [234, sg * 26]], g, { t: [.2, 0, .2], shade: 'cross', inside: (d) => { S.stroke(line(F, [[218, sg * 27], [217, sg * 58]]), g.hi, .9, { op: .8 }); } });
    for (const u of [20, 200]) piece(D, [[u - 5, -27.5], [u + 5, -27.5], [u + 5, 27.5], [u - 5, 27.5]], g, { poly: .25, inside: () => { if (fine) ridge(S, line(F, [[u, -29], [u, 29]]), g, .8); } });
    // ---- the grip: white leather, gold wire in a long spiral, a ring at the waist
    const T = tube(F, [[-34, 15.6], [-120, 18], [-182, 17], [-260, 16.6], [-332, 13.6]]);
    piece(D, T.pts, lea, { t: 0, shade: 'round', inside: (d) => {
      S.fill(d, S.lin(F.W(-34, 0), F.W(-332, 0), [[0, '#8f7a4a', .45], [.1, '#8f7a4a', 0], [.9, '#8f7a4a', 0], [1, '#8f7a4a', .5]]));
      const w = winding(F, T, 13, 12); S.stroke(w, lea.d, 2.4, { units: 1, op: .5 }); inlay(S, w, g, .85);
    } });
    const ring = (u, hw, h) => piece(D, [[u - h / 2, -hw + .8], [u - h / 4, -hw - 1], [u + h / 4, -hw - 1], [u + h / 2, -hw + .8], [u + h / 2, hw - .8], [u + h / 4, hw + 1], [u - h / 4, hw + 1], [u - h / 2, hw - .8]], g, { t: .5, inside: () => { if (fine) for (const k of [-1, 1]) ridge(S, line(F, [[u + k * h * .3, -hw - 2], [u + k * h * .3, hw + 2]]), g, .7); } });
    ring(-182, 19, 13); ring(-38, 17.4, 9); ring(-330, 15, 8);
    // ---- the cross: the sun. Two long rays are the arms; ten short ones stand round the disc; rock crystal at its heart
    const C0 = [-6, 0];
    for (const sg of [-1, 1]) {
      // behind the arm, a shorter ray of white steel, so the cross reads as light in two metals
      piece(D, [[-26, sg * 22], [-6, sg * 132], [14, sg * 22]], WHITE, { t: [.2, 0, .2], shade: 'cross', inside: (d) => { S.fill(line(F, [[-6, sg * 22], [-6, sg * 130], [12, sg * 22]], true), WHITE.hi, { op: .7 }); } });
      piece(D, [[-21, sg * 20], [-15, sg * 110], [-6, sg * 194], [3, sg * 110], [9, sg * 20]], g, { t: [.3, .9, 0, .9, .3], shade: 'cross', inside: () => {
        S.fill(line(F, [[-6, sg * 22], [-6, sg * 190], [1, sg * 110], [7, sg * 22]], true), g.hi, { op: .6 }); S.fill(line(F, [[-6, sg * 22], [-6, sg * 190], [-13, sg * 110], [-19, sg * 22]], true), g.d, { op: .45 });
        if (fine) { engrave(S, line(F, [[-6, sg * 30], [-6, sg * 180]]), g, .5); engrave(S, line(F, [[-12, sg * 34], [-9, sg * 150]]) + line(F, [[0, sg * 34], [-3, sg * 150]]), g, .3, { op: .6 }); }
      } });
    }
    for (const t of rays(C0, 24, 52, 12, 6.2, 0, [3, 9])) piece(D, t, g, { t: [.2, 0, .2], shade: 'none', inside: (d, P) => { const m = F.W((t[0][0] + t[2][0]) / 2, (t[0][1] + t[2][1]) / 2), q = F.W(...t[1]); S.fill(d, S.lin(m, q, [[0, g.b], [1, g.l]])); S.fill(line(F, [t[0], t[1], [(t[0][0] + t[2][0]) / 2, (t[0][1] + t[2][1]) / 2]], true), g.hi, { op: .6 }); } });
    piece(D, disc(C0, 28, 28, 32), g, { shade: 'ball', spec: false, inside: () => {
      if (fine) { beads(D, disc(C0, 23.5, 23.5, 30), 1, g); engrave(S, curve(F, disc(C0, 19.6, 19.6, 30)), g, .5); let rl = ''; for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283; rl += line(F, [[C0[0] + Math.cos(a) * 14, C0[1] + Math.sin(a) * 14], [C0[0] + Math.cos(a) * 19, C0[1] + Math.sin(a) * 19]]); } engrave(S, rl, g, .4); }
    } });
    { const cd = curve(F, disc(C0, 18.4, 18.4, 28)), cP = F.P(disc(C0, 18.4, 18.4, 28)); S.layer('over'); enamel(S, cd, cP, '#f1ede2'); ridge(S, cd, g, 1.1);
      const pts = []; for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283, rr = i % 2 ? 9.5 : 17; pts.push([C0[0] + Math.cos(a) * rr, C0[1] + Math.sin(a) * rr]); } const star = line(F, pts, true); S.fill(star, g.b); S.stroke(star, g.k, .5, { op: .9 }); }
    gem(D, C0, 'oct', 8.6, '#b6d0e2', { set: g, collet: 1.18, table: .5, step: .76, brilliant: true });
    // ---- the pommel: the sun again, small: a wheel with twelve points, white enamel at its heart
    const Cp = [-366, 0];
    for (const t of rays(Cp, 27, 40, 12, 5.4, Math.PI / 12)) piece(D, t, g, { t: [.2, 0, .2], shade: 'none', inside: (d) => { S.fill(d, S.lin(F.W(...t[0]), F.W(...t[1]), [[0, g.s], [1, g.l]])); } });
    piece(D, disc(Cp, 29, 29, 32), g, { shade: 'ball', spec: false });
    {
      const cd = curve(F, disc(Cp, 19, 19, 28)), cP = F.P(disc(Cp, 19, 19, 28)); S.layer('over'); enamel(S, cd, cP, '#f1ede2'); ridge(S, cd, g, 1.1);
      let star = ''; const pts = []; for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283, rr = i % 2 ? 6.5 : 15; pts.push([Cp[0] + Math.cos(a) * rr, Cp[1] + Math.sin(a) * rr]); } star = line(F, pts, true);
      S.fill(star, g.b); S.stroke(star, g.k, .5, { op: .9 }); S.fill(curve(F, disc(Cp, 4.2, 4.2, 12)), g.hi);
      if (fine) beads(D, disc(Cp, 24, 24, 30), .9, g);
    }
    piece(D, [[-404, -5], [-411, -4], [-414, 0], [-411, 4], [-404, 5]], g, { t: .6 });
    glint(D, add(F.W(...C0), mul(LIGHT, 4)), 11); glint(D, add(F.W(...Cp), mul(LIGHT, 24)), 8, { a: .2 });
    glint(D, F.W(900, (F.vx[0] * LIGHT[0] + F.vx[1] * LIGHT[1] < 0 ? -1 : 1) * 13), 11, { a: .3 });
  },
};
