// V · THAW · war axe · the lost axe of the kings of Northreach.
// Cold Coast work: a thin wide blade of dark iron with a welded steel edge, knotwork and runes in silver and copper
// wire, a collar of night-blue enamel, ash, sealskin, a butt of walrus ivory.
import { MET, WOOD, IVORY, stuff, piece, tube, haft, disc, curve, line, inlay, engrave, ridge, beads, dots, puff, glint, seat, plait, winding, xwrap, enamel, mixc, lerp, spl, LIGHT, add, mul } from './fine.mjs';
import { plainAxe } from './plain.mjs';

const DARK = { k: '#07080b', d: '#14171d', s: '#262b34', b: '#3e4551', l: '#6d7786', hi: '#b3bfcf', r: '#2c3646' };
const NIGHT = '#1d3a78';
// marks cut like runes: a stave and a twig or two
function runes(F, r, pts, h) {
  let d = '';
  for (const [u, v] of pts) { const k = Math.floor(r() * 6); d += line(F, [[u, v - h / 2], [u, v + h / 2]]);
    if (k < 2) d += line(F, [[u, v - h * .5], [u + h * .34, v - h * .12], [u, v + h * .1]]); else if (k < 4) d += line(F, [[u - h * .3, v - h * .1], [u, v - h * .42]]) + line(F, [[u + h * .3, v + h * .1], [u, v - h * .12]]); else d += line(F, [[u, v], [u + h * .34, v + h * .4]]) + line(F, [[u, v - h * .36], [u + h * .3, v - h * .04]]); }
  return d;
}

export default {
  id: 'thaw', no: 'V', name: 'Thaw', cat: 'War axe', form: 'axe.long', deg: -62, upright: -90,
  realm: 'Kingdom of Northreach', people: 'The Northfolk of the Cold Coast',
  owner: 'The crown of Northreach claims it, and nobody has it. It is lost.',
  wielder: 'No one since King Bjorn III, the Frost-Handed, who had it beside his chair at Kingsmere on the night he was poisoned, in 1090. It is drawn here as the hall carving at Wolfhaven gives it.',
  why: 'It did not come home with the body. Aldmark says it was never in the hall; Northreach has asked for it eleven times. King Eirik III signed away ten years of silence over his father’s death, and the ten years are up. Whoever shows the axe names the murderer’s house.',
  made: 'Forged at Kingsmere about 810 for the exile Eirik Winterborn by a smith of the Fairrush court, which Northreach does not care to say. The haft was its fourth. 295 years old.',
  legend: ['In January 812 Eirik the Ice-Walker led 340 men across the frozen bay and broke the sea gate of Wolfhaven with it. They named it for the one thing an ice road fears.',
    'Ten kings were raised on the shields with it in their hand. The eleventh will have to find it first.'],
  hand: 'A long two-handed axe with a thin, wide blade: light for its reach and quick to turn. It splits a shield and the arm behind it, and its beard hooks a rim or an ankle. Past the head it is a staff: get inside the swing and it is no better than its bearer’s knife.',
  art: 'Ice Underfoot', artNote: 'short sliding steps, the axe swung from the hips; it is the other man who loses his feet',
  finish: 'Dark iron, a welded steel edge, silver and copper wire, blue enamel, ash, sealskin, walrus ivory', ground: ['#2c4468', '#0a1322'], accent: '#7fb0e8',
  len: 1460,
  box: [-44, 1440, -222, 44],
  details: [{ t: 'The head', box: [1150, 1440, -222, 44] }, { t: 'Sealskin and walrus ivory', box: [-52, 200, -64, 64] }],
  plain: plainAxe(), plainName: 'An ordinary war axe',
  draw(D) {
    const { S, F } = D, sv = MET.silver, cu = MET.copper, st = MET.bright, fine = D.lod >= 2, r = D.r('axe');
    // ---- the haft: ash, gone dark where ten kings held it
    const T = haft(D, [[36, 15], [300, 16.4], [900, 16], [1380, 14]], WOOD.ash, { grain: 8, inside: (d) => {
      S.fill(d, S.lin(F.W(36, 0), F.W(1380, 0), [[0, '#3a2a14', .5], [.15, '#3a2a14', .28], [.42, '#3a2a14', .5], [.6, '#3a2a14', .12], [.86, '#3a2a14', .0], [1, '#20160a', .5]]));
    } });
    // the top of the haft bound in a turning strip of silver, nailed
    const Tb = tube(F, [[1010, 16.2], [1262, 14.8]]);
    { S.layer('main'); const w = winding(F, Tb, 26, 16); S.within(curve(F, Tb.pts, 0), () => { S.stroke(w, sv.k, 9.4, { units: 1 }); S.stroke(w, sv.b, 8, { units: 1 }); S.stroke(w, sv.hi, 2, { units: 1, op: .8, tf: 'translate(-1.6 -2)' }); S.stroke(w, sv.s, 1.6, { units: 1, op: .7, tf: 'translate(2.4 3)' }); if (fine) S.stroke(winding(F, Tb, 26, 16, { phase: 0 }), sv.k, .5, { units: 1, op: .6, dash: '.6 5' }); }); }
    // the grip: sealskin, bound across with a thong
    const Tg = tube(F, [[96, 17.2], [260, 18.6], [420, 17.6]]), seal = stuff('#4a4d52', { l: '#7d828a', hi: '#b7bcc4', k: '#0c0d10' });
    piece(D, Tg.pts, seal, { t: 0, shade: 'round', inside: () => { const x = xwrap(F, Tg, 30, 24); S.stroke(x.a + x.b, '#c9b48a', 2.6, { units: 1 }); S.stroke(x.a + x.b, '#6e5a34', .5, { units: 1, op: .8, tf: 'translate(.9 1.1)' }); if (fine) { const sp = []; for (let i = 0; i < 90; i++) sp.push([100 + r() * 316, (r() * 2 - 1) * 17]); S.fill(dots(F, sp, .9), '#22252b', { op: .5 }); } } });
    for (const u of [96, 420]) piece(D, [[u - 6, -19], [u + 6, -19], [u + 6, 19], [u - 6, 19]], sv, { poly: .25, inside: () => { if (fine) engrave(S, line(F, [[u - 2, -20], [u - 2, 20]]) + line(F, [[u + 2, -20], [u + 2, 20]]), sv, .4); } });
    // ---- the butt: walrus ivory, carved with a knot; a bronze ring through it
    piece(D, [[42, -15.5], [20, -17], [2, -21], [-18, -18], [-30, -8], [-30, 8], [-18, 18], [2, 21], [20, 17], [42, 15.5]], IVORY, { t: [.2, .8, 1, 1, .9, .9, 1, 1, .8, .2], shade: 'round', inside: (d) => {
      S.fill(d, S.lin(F.W(42, 0), F.W(-30, 0), [[0, '#a8742f', .45], [.3, '#c79a5a', .1], [1, '#b5803a', .3]]));
      const k = plait(F, [[-22, 0], [34, 0]], 17, { step: 11 }); engrave(S, k.under + k.over, IVORY, .7, { col: '#5a4526' });
    } });
    { S.layer('main'); const ring = curve(F, disc([-38, 0], 9, 9, 18)); D.sil.push(ring); S.stroke(ring, MET.bronze.k, 4.4, { units: 1 }); S.stroke(ring, MET.bronze.b, 3.2, { units: 1 }); S.stroke(ring, MET.bronze.hi, .8, { units: 1, op: .8, tf: 'translate(-.6 -.7)' }); }
    // ---- the collar under the head: silver, a band of night-blue enamel with three waves
    piece(D, [[1236, -17.4], [1268, -17], [1268, 17], [1236, 17.4]], sv, { poly: .15, inside: (d) => {
      const bd = line(F, [[1243, -18], [1261, -18], [1261, 18], [1243, 18]], true); enamel(S, bd, F.P([[1243, -18], [1261, 18]]), NIGHT, { gloss: false });
      let wv = ''; for (const u of [1247, 1252, 1257]) wv += spl(F.P([[u, -16], [u + 1.6, -10], [u - 1.6, -4], [u + 1.6, 2], [u - 1.6, 8], [u + 1.6, 14], [u, 17]])); inlay(S, wv, sv, .7);
    } });
    // ---- the head: dark iron, thin and wide. Its edge is a strip of bright steel welded on; the join shows as a wave
    const head = [[1342, 17], [1345, -17], [1340, -42], [1352, -92], [1386, -142], [1426, -178], [1382, -197], [1300, -209], [1220, -201], [1174, -185], [1212, -143], [1250, -93], [1266, -44], [1265, -17], [1268, 17], [1280, 26], [1330, 26]];
    const ht = [.2, .2, .8, 1, 1, 0, .9, 1, .9, 0, 1, 1, .8, .2, .2, .7, .7];
    piece(D, head, DARK, { t: ht, shade: 'none', inside: (d) => {
      S.fill(d, S.lin(F.W(1300, -210), F.W(1300, 26), [[0, DARK.l], [.2, DARK.b], [.55, DARK.s], [.8, DARK.b], [1, DARK.d]]));
      S.fill(d, S.lin(F.W(1430, -100), F.W(1170, -100), [[0, DARK.hi, .35], [.3, DARK.hi, 0], [.7, '#000000', 0], [1, '#000000', .4]]));
      // the steel bit
      const weld = []; for (let i = 0; i <= 16; i++) { const t = i / 16, u = lerp(1416, 1182, t), v = -168 - Math.sin(t * Math.PI) * 14 + Math.sin(t * 19) * 2.6; weld.push([u, v]); }
      const bit = line(F, [[1432, -180], ...weld, [1170, -186], [1160, -230], [1440, -230]], true);
      S.fill(bit, S.lin(F.W(1300, -170), F.W(1300, -210), [[0, st.s], [.3, st.b], [.7, st.l], [1, st.hi]]));
      S.fill(bit, S.lin(F.W(1430, -190), F.W(1170, -190), [[0, st.hi, .6], [.25, st.hi, 0], [.5, st.d, .3], [.52, st.hi, .5], [.8, st.hi, 0], [1, st.d, .4]]));
      S.stroke(line(F, weld), DARK.k, 1.2, { op: .9 }); S.stroke(line(F, weld.map(p => [p[0], p[1] - .9])), st.hi, .7, { op: .7 });
      S.stroke(curve(F, [[1420, -186], [1380, -203.6], [1300, -215.4], [1220, -207.6], [1180, -191.6]], 1, false), '#ffffff', 2.2, { units: 1, op: .9 });
      // the knotwork: a plait of silver along the weld, a border of copper, a ring-knot at the neck, runes by the eye
      const pl = plait(F, weld.slice(1, 16).map(p => [p[0], p[1] + 13]), 11, { step: 12 }); inlay(S, pl.under, sv, .95); S.stroke(pl.over, DARK.s, 2.6, { units: 1 }); inlay(S, pl.over, sv, .95);
      inlay(S, curve(F, [[1404, -150], [1356, -96], [1346, -44], [1334, -24]], 1, false) + curve(F, [[1196, -152], [1244, -98], [1260, -46], [1272, -24]], 1, false), cu, .8);
      if (fine) {
        let knot = ''; for (let i = 0; i < 3; i++) { const a = i / 3 * 6.283 + .5, c = [1303 + Math.cos(a) * 9, -92 + Math.sin(a) * 9]; knot += curve(F, disc(c, 13.5, 13.5, 16)); }
        inlay(S, knot, sv, .85); inlay(S, curve(F, disc([1303, -92], 27, 27, 24)), cu, .7); beads(D, [[1303, -92]], 2.4, sv);
        engrave(S, runes(F, D.r('runes'), [1278, 1287, 1296, 1305, 1314, 1323, 1332].map(u => [u, -30]), 9), DARK, .6, { col: '#000000' });
        S.stroke(runes(F, D.r('runes'), [1278, 1287, 1296, 1305, 1314, 1323, 1332].map(u => [u, -30]), 9), sv.b, .35, { units: 1, op: .9 });
        let sc = ''; for (let i = 0; i < 14; i++) { const u = 1190 + r() * 220, v = -150 + r() * 110, l = 5 + r() * 16; sc += line(F, [[u, v], [u + l * .4, v - l]]); } S.stroke(sc, DARK.hi, .35, { units: 1, op: .3 });
      }
      // where the haft passes through
      S.fill(line(F, [[1262, -16], [1346, -16], [1346, 16], [1262, 16]], true), '#000000', { op: .22 });
    } });
    // the haft's end, wedged, standing proud of the eye
    piece(D, [[1340, -13.4], [1358, -12.6], [1358, 12.6], [1340, 13.4]], WOOD.ash, { poly: .2, shade: 'round', inside: () => { S.stroke(line(F, [[1341, 0], [1358, 0]]), MET.iron.b, 1.8, { units: 1 }); } });
    glint(D, F.W(1392, -196), 10, { a: .3 }); glint(D, add(F.W(1250, 0), mul(LIGHT, 12)), 6);
  },
};
