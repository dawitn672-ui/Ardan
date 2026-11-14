// IV · HELD BREATH · dagger · the diver's knife of House Tidewell (Kingdom of Greyhaven).
// Sea work: a bronze blade worn and pitted by four hundred years of salt, a guard like a breaking wave in silver,
// ray-skin bound with silver wire and marked by teeth, a grey pearl in a silver claw.
import { MET, stuff, piece, tube, blade, disc, curve, line, inlay, engrave, ridge, beads, dots, puff, glint, seat, gem, cabochon, winding, lettering, pearl, mixc, lerp, spl, splPts, norm, perp, sub, add, mul, LIGHT } from './fine.mjs';
import { plainDagger } from './plain.mjs';

const BRZ = { k: '#1c1206', d: '#3c2910', s: '#6b4c22', b: '#9d7838', l: '#d0a962', hi: '#f6e2ac', r: '#7d6a3c' };
const SEA = '#2e8f86', VERD = '#4d9482';
// a bar that follows a line of points, as wide as wf(t) says
const ribbon = (pts, wf) => { const c = splPts(pts, false, 1, 8), n = c.length, A = [], B = []; for (let i = 0; i < n; i++) { const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)], nn = perp(norm(sub(b, a))), w = wf(i / (n - 1)); A.push(add(c[i], mul(nn, w))); B.push(add(c[i], mul(nn, -w))); } return [...A, ...B.reverse()]; };

export default {
  id: 'held-breath', no: 'IV', name: 'Held Breath', cat: 'Dagger', form: 'dagger.diver', deg: 118, upright: 90,
  realm: 'Kingdom of Greyhaven', people: 'The Northfolk of the Channel coast; House Tidewell, divers before they were kings',
  owner: 'House Tidewell, as an heirloom of the blood. It was the family’s before the family was royal, and has never been counted among the crown’s jewels.',
  wielder: 'The heir. In 1105 Prince Tristan Tidewell, 21, wears it at his belt; on the day of a ring dive it is carried in the teeth.',
  why: 'By the Ring Law of 916 every heir dives at seven for a silver ring, before the whole harbor, and comes up owning the knife; a king hands it on the day he is crowned. Tristan’s dive was helped, and three people know it. The knife is the proof of a right he may not have.',
  made: 'Cast in fleet bronze at the Solen station of Greyhaven before 719: a chain-diver’s work knife. Hilted in silver and pearl for King Cedric in 761. Close on 400 years old.',
  legend: ['In 719 Wenna Tidewell went down eleven times in one day to free the sunk harbor chain, with this in her teeth. Her teeth are still in the grip, under the marks of every heir since.',
    'Osric the Diver had it at Yarbek in 882 when he cut the Khan’s chain. Deep water keeps what it is given; this it gave back.'],
  hand: 'Short, broad, and heavier than steel. It will not rust, bend or snap, and in a clinch or under water there is nothing better made. It is a knife. Against a sword on open ground its legend does not lengthen it by an inch.',
  art: 'The Long Breath', artNote: 'close, hold and wait: the other man tires first, or drowns',
  finish: 'Salt-worn fleet bronze, silver, ray-skin, a grey pearl, sea-green silk', ground: ['#2f5f63', '#0b1c1f'], accent: SEA,
  len: 390,
  box: [-166, 248, -66, 66],
  details: [{ t: 'The pearl and the bitten grip', box: [-166, 26, -64, 64] }, { t: 'Salt in the bronze', box: [44, 150, -36, 36] }],
  plain: plainDagger(), plainName: 'An ordinary dagger',
  draw(D) {
    const { S, F } = D, sv = MET.silver, fine = D.lod >= 2, r = D.r('hilt'), lit = F.vx[0] * LIGHT[0] + F.vx[1] * LIGHT[1] < 0 ? -1 : 1;
    // ---- the blade: a broad leaf of bronze with a raised rib. Green has settled in every hollow; the edges are rubbed bright
    blade(D, {
      mat: BRZ, st: [[0, 15, .4], [26, 17, .8], [96, 24, 1], [172, 17, 1], [216, 8, 1]], tip: 240, bevel: 2.6, hone: .8, honeFar: BRZ.l, sky: .06, earth: .22,
      litStops: [[0, BRZ.hi], [.2, BRZ.l], [.6, BRZ.b], [1, BRZ.l]], farStops: [[0, BRZ.d], [.3, BRZ.s], [.8, BRZ.b], [1, BRZ.s]],
      bands: [[.2, .4, 'dk2', .22], [.55, .75, 'lt2', .3]], slashes: [[.6, .05, .28]], nicks: [[150, 1, 1.4], [70, -1, 1]],
      inside: ({ half }) => {
        // the rib: a narrow ridge, light on one flank and dark on the other
        const rib = (sg, c, op) => S.fill(line(F, [[6, 0], [6, sg * 3.2], [120, sg * 2.4], [206, sg * .7], [214, 0]], true), c, { op });
        rib(lit, BRZ.hi, .75); rib(-lit, BRZ.d, .8); S.stroke(line(F, [[6, 0], [214, 0]]), BRZ.k, .6, { op: .5 });
        // the house's words down one flank, worn nearly through
        if (fine) engrave(S, lettering(F, 'DEEP WATER KEEPS', 30, -lit * 9.5, 5, { gap: .3, flip: lit > 0 }).d, BRZ, .55, { op: .5 });
        // salt: green in the hollows, pits, a darker bloom toward the hilt
        const rr = D.r('salt');
        for (let i = 0; i < 16; i++) { const u = 4 + rr() * 200 * rr(), h = half(u), v = (rr() * 2 - 1) * h * .75, p = F.W(u, v); puff(S, p, 3 + rr() * 7, 2 + rr() * 5, VERD, .34 + rr() * .3, rr() * 3); }
        for (const sg of [-1, 1]) for (let i = 0; i < 5; i++) { const u = 10 + i * 34, p = F.W(u, sg * 4.2); puff(S, p, 12, 1.6, VERD, .4, F.deg * Math.PI / 180); }
        if (fine) { const pit = []; for (let i = 0; i < 110; i++) { const u = 4 + rr() * 220, h = half(u); pit.push([u, (rr() * 2 - 1) * h * .8]); } S.fill(dots(F, pit, .42), BRZ.k, { op: .55 }); S.fill(dots(F, pit.slice(0, 50).map(p => [p[0] + .5, p[1] + .5]), .3), BRZ.hi, { op: .5 }); }
        puff(S, F.W(8, 0), 20, 12, '#1d1408', .45);
      },
    });
    // ---- the guard: a wave in silver, one crest breaking toward the blade and one toward the hand
    const wave = ribbon([[15, -45], [3, -41], [-5, -27], [-2, -9], [0, 0], [2, 9], [5, 27], [-3, 41], [-15, 45]], t => 2 + 5.4 * Math.sin(Math.PI * Math.min(1, Math.max(0, t * 1.04))) ** .7);
    piece(D, wave, sv, { t: .9, shade: 'cross', inside: () => {
      if (fine) for (const k of [-1.6, 1.6]) engrave(S, curve(F, [[13, -43 + k * .2], [3 + k * .3, -39], [-5 + k, -27], [-2 + k, -9], [k, 0], [2 + k, 9], [5 + k, 27], [-3 + k * .3, 39], [-13, 43]], 1, false), sv, .35);
    } });
    gem(D, [0, 0], 'oval', 4.6, SEA, { set: sv, collet: 1.35, table: .5, rot: Math.PI / 2 });
    // ---- the grip: ray-skin, grey and pebbled, bound with twisted silver wire; and the marks of teeth
    const T = tube(F, [[-9, 11], [-52, 12.8], [-102, 10]]), skin = stuff('#b7bcb4', { s: '#8d948c', d: '#5d655f', l: '#dadfd7', hi: '#ffffff', k: '#22272a' });
    piece(D, T.pts, skin, { t: 0, shade: 'round', inside: () => {
      if (fine) { const pb = [], pl = []; for (let i = 0; i < 260; i++) { const u = -10 - r() * 92, v = (r() * 2 - 1) * 12; (i % 3 ? pb : pl).push([u, v]); } S.fill(dots(F, pb, .62), skin.d, { op: .6 }); S.fill(dots(F, pl, .5), '#ffffff', { op: .7 }); }
      const w = winding(F, T, 9.5, 7); S.stroke(w, skin.k, 1.9, { units: 1, op: .6 }); inlay(S, w, sv, .9);
      // two rows of teeth, bitten deep
      let bt = ''; for (const [u, sg] of [[-44, -1], [-50, -1], [-56, -1], [-46, 1], [-52, 1], [-58, 1]]) bt += spl(F.P([[u - 2.2, sg * 4.2], [u, sg * 5.8], [u + 2.2, sg * 4.2]]));
      S.stroke(bt, '#15191b', 1.5, { units: 1, op: .85 }); S.stroke(bt, '#ffffff', .5, { units: 1, op: .6, tf: 'translate(.6 .8)' });
      seat(D, -9, 13, -7, { op: .5 }); seat(D, -102, 12, 7, { op: .5 });
    } });
    // ---- the pommel: a collar and four claws of silver, and in them a grey pearl; a ring for the cord
    piece(D, [[-100, -11], [-108, -12], [-108, 12], [-100, 11]], sv, { t: .3, inside: () => { if (fine) ridge(S, line(F, [[-104, -13], [-104, 13]]), sv, .8); } });
    { S.layer('main'); const ring = curve(F, disc([-144, 0], 6.4, 6.4, 18)); D.sil.push(ring); S.stroke(ring, sv.k, 3.6, { units: 1 }); S.stroke(ring, sv.b, 2.5, { units: 1 }); S.stroke(ring, sv.hi, .7, { units: 1, op: .8, tf: 'translate(-.5 -.6)' }); }
    pearl(D, [-122, 0], 13.4, { layer: 'main' });
    for (const [a, sg] of [[-1, -1], [1, 1]]) piece(D, [[-107, sg * 11.5], [-118, sg * 14.6], [-129, sg * 10], [-124, sg * 9.4], [-117, sg * 11.6], [-108, sg * 8]], sv, { t: [.3, .9, .2, .6, .9, .3], shade: 'cross', layer: 'over', shadow: false });
    // the cord: sea-green silk through the ring
    { const dn = [F.ux[1], F.vx[1]], sd = [dn[1], -dn[0]], at = (a, b) => [-146 + dn[0] * a + sd[0] * b, dn[1] * a + sd[1] * b], cord = spl(F.P([at(0, 0), at(22, -13), at(52, -15), at(70, 0), at(52, 15), at(22, 13), at(0, 0)]));
      S.layer('under'); D.sil.push(cord); S.stroke(cord, '#0d2c2a', 3.2, { units: 1 }); S.stroke(cord, SEA, 2.2, { units: 1 }); S.stroke(cord, '#9fe0d6', .6, { units: 1, op: .7, dash: '1.6 2.2' }); }
    glint(D, add(F.W(-122, 0), mul(LIGHT, 6.5)), 7); glint(D, F.W(126, lit * 20.5), 7, { a: .3 });
  },
};
