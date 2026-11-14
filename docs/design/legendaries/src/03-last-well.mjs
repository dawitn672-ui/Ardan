// III · LAST WELL · sabre · the sword on the arms of Clan Sayf of Mirah (Confederacy of the Sand Clans).
// Desert work: a deep-curved blade of watered crucible steel with a ladder of rungs, gold laid on in lines and in
// ornament shaped like writing, old ivory, a red stone, a silk tassel.
import { MET, IVORY, piece, sym, disc, curve, line, inlay, engrave, ridge, beads, dots, puff, glint, cabochon, gem, trim, watering, arcFrame, backblade, tassel, plait, mixc, lerp, spl, LIGHT, add, mul } from './fine.mjs';
import { plainSabre } from './plain.mjs';

const WAT = { k: '#12141a', d: '#2b3038', s: '#58606c', b: '#8a929e', l: '#c4cbd4', hi: '#f5f8fb', r: '#6f7d92' };
const RED = '#b3261e';

// ornament in the shape of writing: a base line that rises in tall strokes, loops and teeth, with points above and below
function script(F, r, s0, s1, t, h) {
  let d = '', pts = [[s0, t]], dt = []; const step = h * .62;
  for (let s = s0 + step * .5; s < s1 - step * .5; s += step) {
    const k = Math.floor(r() * 5);
    if (k === 0) { d += spl(F.P([[s, t], [s + h * .08, t - h * .5], [s - h * .06, t - h * 1.05]])); pts.push([s, t]); }
    else if (k === 1) { d += spl(F.P([[s - h * .2, t], [s - h * .22, t - h * .36], [s + h * .12, t - h * .4], [s + h * .16, t - h * .04], [s - h * .2, t]])); pts.push([s + h * .2, t]); }
    else if (k === 2) { pts.push([s - h * .12, t], [s, t - h * .3], [s + h * .12, t]); }
    else if (k === 3) { d += spl(F.P([[s, t], [s + h * .18, t + h * .32], [s - h * .08, t + h * .5], [s - h * .3, t + h * .34]])); pts.push([s, t]); }
    else pts.push([s, t + h * .05]);
    if (r() < .45) dt.push([s + h * .1, t + (r() < .5 ? -h * .7 : h * .34)]);
  }
  pts.push([s1, t]);
  return { d: d + spl(F.P(pts)), dots: dt };
}

export default {
  id: 'last-well', no: 'III', name: 'Last Well', cat: 'Sabre', form: 'sword.sabre', deg: 150, upright: 90,
  realm: 'Confederacy of the Sand Clans', people: 'The Riders of the southern desert; Clan Sayf of Mirah',
  owner: 'Clan Sayf, the chief’s line at Mirah. It is the curved sword on the clan’s own arms.',
  wielder: 'Zayd Blackveil, outlaw, a cousin of the chief’s blood. He has no right to it.',
  why: 'In 1098 Harith Sayf sent Zayd into the desert without water, and the sword went with him. Harith calls it stolen and has sent no one after it. Since 1104 it has been seen at Zanara’s burned road camps: a chief who can call the hand a thief’s can call the war not his.',
  made: 'The blade is Chanari crucible steel, forged about 960 by one of the first twelve smiths of the Compact; hilted at Mirah. About 145 years old.',
  legend: ['Twenty-three rungs cross its watered steel, one for each clan of the Confederacy. The last, by the hilt, is filled with gold for Mirah: the last well on the Salt Road.',
    'In 1060 Muhsin Sayf carried it on the wall for five months while eighteen thousand Zanarans sat outside. Mirah stands.'],
  hand: 'Light, and so curved that it cuts where a straight sword must be drawn back. It parts a mail collar and takes the edge off plain steel. It has little point and a small guard: against a patient man behind a shield it must work for every opening.',
  art: 'False Water', artNote: 'the cut is never where the eye puts it, as water in the waste is never where it shines',
  finish: 'Watered crucible steel, gold overlay, old ivory, carnelian, red silk', ground: ['#6a4a34', '#1c110c'], accent: RED,
  len: 950,
  box: [-150, 606, -486, 64],
  details: [{ t: 'Hilt and forte', box: [-150, 190, -84, 78] }, { t: 'The ladder in the steel', box: [300, 440, -200, -68] }],
  plain: plainSabre(), plainName: 'An ordinary sabre',
  draw(D) {
    const { S, F } = D, g = MET.gold, fine = D.lod >= 2, A = arcFrame(F, 600), r = D.r('hilt');
    // ---- the blade
    backblade(D, A, {
      mat: WAT, st: [[0, 15, 17], [300, 14.5, 16.5], [600, 13, 15], [745, 10, 12.5]], tip: [814, -8], n: 48,
      strips: [[0, .08, WAT.hi, .85], [.08, .15, WAT.d, .6], [.15, .45, WAT.l, .28], [.62, .88, WAT.d, .25]],
      inside: ({ back, belly }) => {
        const hw = s => (back(s) + belly(s)) / 2 - 1.2, c = s => (belly(s) - back(s)) / 2, rungs = []; for (let i = 0; i < 22; i++) rungs.push(176 + i * 27.2);
        if (fine) { const w = watering(A, D.r('water'), 8, 800, hw, { c, lines: 13, amp: 2.7, du: 5, f1: .07, rungs }); S.stroke(w.dark, '#0c0e13', .55, { units: 1, op: .55 }); S.stroke(w.light, '#ffffff', .5, { units: 1, op: .6 }); S.stroke(w.rung, '#0c0e13', .5, { units: 1, op: .6 }); S.stroke(w.rung, '#ffffff', .35, { units: 1, op: .55, tf: 'translate(.5 .4)' }); }
        else { let rg = ''; for (const s of rungs) rg += line(A, [[s, -back(s)], [s, belly(s)]]); S.stroke(rg, '#0c0e13', 1.6, { units: 1, op: .3 }); }
        // the twenty-third rung, by the hilt: gold
        inlay(S, line(A, [[149, -back(149) + 1.6], [149, belly(149) - 3.2]]) + line(A, [[153, -back(153) + 1.6], [153, belly(153) - 3.2]]), g, 1.1);
        // the forte: a band, a pointed cartouche with a well in it, ornament like writing, a line along the back
        inlay(S, line(A, [[13, -13.4], [13, 13]]) + line(A, [[17, -13.4], [17, 13]]), g, .8);
        const car = [[26, 0], [40, -8.6], [60, -10.4], [80, -8.6], [94, 0], [80, 8.6], [60, 10.4], [40, 8.6]], cd = spl(A.P(car), true, [.2, .9, 1, .9, .2, .9, 1, .9]);
        S.fill(cd, '#10131b', { op: .5 }); inlay(S, cd, g, .8);
        inlay(S, spl(A.P(disc([60, 0], 5.2, 5.2, 16)), true), g, 1); if (fine) { let wv = ''; for (const t of [-2, 0, 2]) wv += spl(A.P([[55.5, t], [58, t - .8], [60, t], [62, t + .8], [64.5, t]])); inlay(S, wv, g, .4); }
        if (fine) { const sc = script(A, D.r('script'), 100, 142, 1.5, 7.4); inlay(S, sc.d, g, .62, { cap: 'round' }); S.fill(dots(A, sc.dots, .75), g.b); S.stroke(dots(A, sc.dots, .75), g.k, .3, { units: 1 }); }
        inlay(S, spl(A.P([[20, -11.2], [150, -10.9], [250, -10.4], [262, -9.2], [258, -6.8], [252, -8.6]])), g, .6);
      },
    });
    // ---- the grip: old ivory scales, three gold rosettes; it turns over at the end into a capped hook
    const grip = [[-6, -11], [-58, -12.6], [-104, -12.2], [-126, -7], [-136, 6], [-134, 21], [-124, 31], [-111, 31], [-107, 21], [-108, 12.6], [-58, 12.6], [-6, 11]];
    piece(D, grip, IVORY, { t: [.2, .9, .9, 1, 1, 1, .6, .6, .9, .8, .9, .2], shade: 'round', inside: (d) => {
      S.fill(d, S.lin(F.W(-6, 0), F.W(-136, 0), [[0, '#a8742f', .5], [.14, '#c79a5a', .1], [.6, '#fff8e6', .1], [1, '#b5803a', .4]]));
      if (fine) { let ck = ''; for (let i = 0; i < 8; i++) { const u = -14 - r() * 90, v = (r() * 2 - 1) * 8, l = 6 + r() * 16; ck += line(F, [[u, v], [u - l * .5, v + (r() - .5)], [u - l, v + (r() - .5) * 1.4]]); } S.stroke(ck, '#6d5330', .3, { units: 1, op: .55 }); }
      inlay(S, line(F, [[-6, 0], [-104, 0]]), { ...g, b: '#6b5a3a', hi: '#a8946a' }, .5);
    } });
    for (const u of [-24, -57, -90]) { S.layer('over'); const p = [u, 0]; let pet = ''; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; pet += curve(F, disc([u + Math.cos(a) * 3, Math.sin(a) * 3], 1.9, 1.9, 8)); } S.fill(pet, g.b); S.stroke(pet, g.k, .4, { op: .9 }); beads(D, [p], 1.7, g); }
    // the cap of the hook: gold, with the red stone of the hill
    piece(D, [[-128, 14], [-135, 20], [-131, 30], [-122, 35], [-110, 33], [-105, 24], [-108, 16]], g, { t: .8, shade: 'ball', spec: false, inside: (d) => { if (fine) engrave(S, line(F, [[-128, 15], [-108, 17]]) + line(F, [[-126, 12.6], [-108, 14.4]]), g, .4); } });
    cabochon(D, [-120, 25], 5, RED, g, { shadow: false });
    // ---- the cross: steel under a net of gold; langets up the blade and down the grip; a bud at each end
    const cr = sym([[-44, 0], [-20, -6.4], [-7.5, -10], [-6, -38], [-9, -45], [-5, -52.5], [0, -55], [5, -52.5], [9, -45], [6, -38], [7.5, -10], [22, -6.4], [54, 0]], [.1, .7, .5, .7, .6, .9, 1, .9, .6, .7, .5, .7, .1]);
    piece(D, cr.pts, MET.dwarf, { t: cr.t, shade: 'cross', turn: 'dark', inside: (d) => {
      trim(S, d, g, 1.1);
      if (fine) { let net = ''; for (let i = -12; i <= 12; i++) { net += line(F, [[-40 + i * 6.5, -50], [-40 + i * 6.5 + 60, 50]]) + line(F, [[-40 + i * 6.5 + 60, -50], [-40 + i * 6.5, 50]]); } inlay(S, net, g, .36, { op: .9 }); }
      for (const sg of [-1, 1]) beads(D, [[0, sg * 49]], 2.2, g);
    } });
    gem(D, [0, 0], 'oct', 5, '#2f9a8e', { set: g, collet: 1.3, table: .5 });
    tassel(D, [-126, 33], 96, RED, { swing: 12, skirt: 50, w: 7.5 });
    glint(D, A.W(430, 14.6), 9, { a: .3 }); glint(D, add(F.W(-120, 25), mul(LIGHT, 2)), 5);
  },
};
