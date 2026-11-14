// X · PAYMASTER · crossbow · the Captain-General's crossbow (Highland League, the Greycloak Companies).
// Highland work, from the shops of Roseham: plain and exact. Dark walnut, plates of stag-horn scored with a tally, a
// steel bow from Irondeep, a bridle of sky-blue and white cord, pewter-grey silver. Seen from above, a bolt in the groove.
import { MET, WOOD, BONE, stuff, piece, tube, haft, sym, disc, curve, line, inlay, engrave, ridge, beads, dots, row, puff, glint, cabochon, winding, tufts, facet, mixc, lerp, spl, polyline, LIGHT, add, mul } from './fine.mjs';
import { plainCrossbow } from './plain.mjs';

const SKY = '#4f86c4', STL = MET.dwarf;

export default {
  id: 'paymaster', no: 'X', name: 'Paymaster', cat: 'Crossbow', form: 'crossbow.heavy', deg: -72, upright: -90,
  realm: 'Highland League', people: 'The highlanders of the Crown Range; the Greycloak Companies',
  owner: 'The Silver Chest of the League. It belongs to the valleys in common, as the Chest does.',
  wielder: 'The Captain-General of the Greycloak Companies: in 1105, Ulric Greycloak. The Council of the League gives it, and can take it back.',
  why: 'Since Asa Greycloak’s law of 952 a hire is sealed when the Captain-General shoots its bolt into the hirer’s gatepost, and ended when the pay is counted and the bolt drawn out. Ulric took Aldmark’s silver before the Council voted. The valleys are asking where the bolt is.',
  made: 'Built at Roseham in 952 for the first Captain-General. The steel bow is its second, of Irondeep steel, fitted in 1052; the first, of horn, split in the cold at Hartgate. 153 years old.',
  legend: ['It held the stakes at Hartgate in 1051 with its last bolt, and its horn bow cracked to the nock.',
    'The horn plates on its tiller carry a tally: one cut for every contract paid in full. There are two hundred and six cuts, and three plates still blank.'],
  hand: 'A heavy steel bow, spanned with a windlass: three shots while a bowman looses twelve. Each of the three goes through plate at a hundred paces, and the fortieth flies as true as the first. Between shots its bearer is a man holding eight pounds of wood.',
  art: 'The Gorge Shot', artNote: 'the steep shot, down from a height or up at a wall, that other crossbows cannot judge',
  finish: 'Walnut, stag-horn, Irondeep steel, sky-blue and white cord, silver', ground: ['#3d5878', '#0d1622'], accent: SKY,
  len: 815,
  box: [-18, 818, -398, 398],
  details: [{ t: 'The nut and the tally of contracts', box: [44, 436, -150, 150] }, { t: 'The steel bow and its bridle', box: [590, 818, -150, 150] }],
  plain: plainCrossbow(), plainName: 'An ordinary crossbow',
  draw(D) {
    const { S, F } = D, sv = MET.silver, fine = D.lod >= 2, r = D.r('xbow'), st = MET.bright;
    const prodU = v => 706 - (v * v) / 2300, lit = F.ux[0] * LIGHT[0] + F.ux[1] * LIGHT[1] > 0 ? 1 : -1;
    // ---- the cord: thick grey hemp, served in blue at its middle; it lies across the tiller behind the bow
    { const a = [prodU(372) - 4, -372], b = [prodU(372) - 4, 372], d = line(F, [a, [648, 0], b]); S.layer('under'); D.sil.push(d); S.stroke(d, '#2b2d30', 5.4, { units: 1 }); S.stroke(d, '#cfcabb', 4, { units: 1 }); S.stroke(d, '#ffffff', .8, { units: 1, op: .5, dash: '2 3' });
      const sd = line(F, [[652, -34], [648, 0], [652, 34]]); S.stroke(sd, '#16304f', 6.2, { units: 1 }); S.stroke(sd, SKY, 4.6, { units: 1 }); }
    // ---- the stirrup: a loop of steel for the foot
    { S.layer('under'); const stir = curve(F, [[708, -42], [760, -48], [806, 0], [760, 48], [708, 42]], 1, false); D.sil.push(stir); S.stroke(stir, STL.k, 11.5, { units: 1 }); S.stroke(stir, STL.b, 9, { units: 1 }); S.stroke(stir, STL.hi, 2, { units: 1, op: .7, tf: 'translate(-1.6 -2)' }); }
    // ---- the bow: Irondeep steel, dark, a bright line worn along its back; a small ring of gold wire at each tip
    const pA = [], pB = []; for (let i = 0; i <= 28; i++) { const v = lerp(-378, 378, i / 28), w = 13.5 - Math.abs(v) * .017; pA.push([prodU(v) + w, v]); pB.push([prodU(v) - w, v]); }
    piece(D, [...pA, ...pB.reverse()], STL, { t: 0, shade: 'cross', inside: () => {
      S.stroke(line(F, pA.map(p => [p[0] - 4.4, p[1]])), STL.hi, 1.5, { units: 1, op: .8 });
      if (fine) { let ch = ''; for (let v = -340; v <= 340; v += 17) { if (Math.abs(v) < 60) continue; const u = prodU(v); ch += line(F, [[u - 6, v - 4], [u, v], [u - 6, v + 4]]); } engrave(S, ch, STL, .5); }
      for (const sg of [-1, 1]) { const u = prodU(350); inlay(S, line(F, [[u - 9, sg * 350], [u + 9, sg * 350]]) + line(F, [[prodU(356) - 9, sg * 356], [prodU(356) + 9, sg * 356]]), MET.gold, 1.1); }
    } });
    // ---- the tiller: dark walnut, swelling at the lock
    haft(D, [[0, 17], [120, 20], [300, 25], [420, 24], [560, 19], [716, 17]], WOOD.walnut, { grain: 9, t: .9 });
    // its top: a long plate of stag-horn with the bolt's groove; plates behind the lock scored with the tally
    const plate = (pts, inside) => { const d = line(F, pts, true); S.layer('main'); S.fill(d, BONE.b); S.within(d, () => { S.fill(d, S.lin(F.W(pts[0][0], -22), F.W(pts[0][0], 22), [[0, BONE.hi], [.3, BONE.l], [.7, BONE.b], [1, BONE.s]])); if (inside) inside(); }); S.stroke(d, BONE.k, .8); };
    plate([[430, -9.5], [700, -7.5], [700, 7.5], [430, 9.5]], () => { S.stroke(line(F, [[432, 0], [700, 0]]), '#2a1e10', 3.2, { units: 1, op: .85 }); S.stroke(line(F, [[432, 1.7], [700, 1.7]]), '#ffffff', .5, { units: 1, op: .6 }); if (fine) { let hb = ''; for (let u = 440; u < 694; u += 9) hb += line(F, [[u, -8.6], [u + 4.5, -4.4], [u + 9, -8.6]]) + line(F, [[u, 8.6], [u + 4.5, 4.4], [u + 9, 8.6]]); engrave(S, hb, BONE, .4, { col: '#4a3d28' }); } });
    for (let i = 0; i < 8; i++) {
      const u0 = 60 + i * 36, w = 15 + i * 1.1, blank = i < 3;
      plate([[u0, -w], [u0 + 30, -w - .9], [u0 + 30, w + .9], [u0, w]], () => {
        if (!blank) { let cut = '', n = 0; for (let v = -w + 3.6; v < w - 3; v += 3.9) for (let k = 0; k < 2; k++) { const u = u0 + 4 + k * 13; n++; if (n % 6 === 0) cut += line(F, [[u - 1, v - 1.4], [u + 10, v + 1.6]]); else cut += line(F, [[u + (n % 6) * 1.7, v - 1.3], [u + (n % 6) * 1.7, v + 1.3]]); } S.stroke(cut, '#3a2c14', .5, { units: 1, op: .9 }); }
        if (fine) beads(D, [[u0 + 3, -w + 2.6], [u0 + 27, -w + 2], [u0 + 3, w - 2.6], [u0 + 27, w - 2]], .9, sv);
      });
    }
    // the lock: a steel plate, the nut of antler in its socket
    piece(D, [[352, -25], [420, -24], [420, 24], [352, 25]], STL, { poly: .1, shade: 'none', inside: (d) => { S.fill(d, S.lin(F.W(386, -25), F.W(386, 25), [[0, STL.l], [.2, STL.b], [.7, STL.s], [1, STL.d]])); if (fine) { engrave(S, line(F, [[356, -21], [416, -20], [416, 20], [356, 21]], true), STL, .5); beads(D, [[358, -20], [414, -19], [358, 20], [414, 19]], 1.5, st); } } });
    { const c = [388, 0], d = curve(F, disc(c, 13, 13, 22)); S.layer('main'); S.fill(curve(F, disc(c, 15.4, 15.4, 22)), '#06070a'); S.fill(d, BONE.b); S.within(d, () => { const P = F.W(...c); S.fill(d, S.radial(add(P, mul(LIGHT, 5)), 20, [[0, BONE.hi], [.4, BONE.b], [1, BONE.d]])); S.fill(line(F, [[380, -3.4], [402, -3.4], [402, 3.4], [380, 3.4]], true), '#2a1e10', { op: .9 }); S.stroke(line(F, [[377, -9], [399, -9]]) + line(F, [[377, 9], [399, 9]]), '#2a1e10', 1.4, { units: 1, op: .8 }); }); S.stroke(d, BONE.k, .9); }
    // the League's badge on the butt: a silver ring-brooch, as pins a grey cloak
    { const c = [28, 0]; S.layer('over'); const ring = curve(F, disc(c, 9.5, 9.5, 20)); S.stroke(ring, sv.k, 4.4, { units: 1 }); S.stroke(ring, sv.b, 3.1, { units: 1 }); S.stroke(ring, sv.hi, .8, { units: 1, op: .8, tf: 'translate(-.6 -.7)' }); const pin = line(F, [[14, -8], [44, 9]]); S.stroke(pin, sv.k, 2.6, { units: 1 }); S.stroke(pin, sv.l, 1.5, { units: 1 }); }
    piece(D, [[-10, -15], [4, -17.4], [4, 17.4], [-10, 15]], sv, { t: .4, inside: () => { if (fine) engrave(S, line(F, [[-3, -18], [-3, 18]]), sv, .4); } });
    // ---- the bridle: the bow lashed to the tiller with cord, sky-blue and white, crossed and crossed again; a tuft at each side
    { S.layer('over'); let a = '', b = ''; for (let i = 0; i < 5; i++) { const o = i * 5.4; a += line(F, [[668 + o, -30], [730 - o * .4, 30]]); b += line(F, [[668 + o, 30], [730 - o * .4, -30]]); }
      S.stroke(a + b, '#101c2c', 5, { units: 1 }); S.stroke(a, SKY, 3.6, { units: 1 }); S.stroke(b, '#e8e6dc', 3.6, { units: 1 }); S.stroke(a + b, '#ffffff', .6, { units: 1, op: .4, tf: 'translate(-.8 -1)' });
      const rr = D.r('tuft'); for (const sg of [-1, 1]) { const d = tufts(F, rr, [[700, sg * 34], [716, sg * 34]], 22, 26, { w: 2.2, lean: [-.3, sg], spread: 1.1 }); S.fill(d, sg < 0 ? SKY : '#e8e6dc'); S.stroke(d, '#101c2c', .5, { op: .5 }); } }
    // ---- a bolt in the groove: ash, two vanes of horn, a four-sided head
    { const sh = tube(F, [[414, 6.2], [560, 6.6], [724, 5.6]]); piece(D, sh.pts, WOOD.ash, { t: 0, shade: 'round', layer: 'over' });
      for (const sg of [-1, 1]) piece(D, [[424, sg * 6], [436, sg * 17], [486, sg * 15], [496, sg * 6]], BONE, { t: [.2, .7, .7, .2], shade: 'none', layer: 'over', shadow: false, inside: (d) => { S.fill(d, sg * lit < 0 ? BONE.l : BONE.s); let ln = ''; for (let u = 432; u < 492; u += 7) ln += line(F, [[u, sg * 6.4], [u + 5, sg * 15]]); S.stroke(ln, BONE.k, .4, { units: 1, op: .5 }); } });
      piece(D, [[722, -6], [742, -11], [790, 0], [742, 11], [722, 6]], st, { t: [.2, .5, 0, .5, .2], shade: 'none', layer: 'over', inside: (d) => { S.fill(d, st.s); S.fill(line(F, [[722, -6 * lit], [742, -11 * lit], [790, 0], [722, 0]], true), st.hi); S.stroke(line(F, [[722, 0], [790, 0]]), st.k, .6, { op: .5 }); } }); }
    glint(D, F.W(776, -3 * lit), 8, { a: .3 }); glint(D, add(F.W(388, 0), mul(LIGHT, 6)), 6);
  },
};
