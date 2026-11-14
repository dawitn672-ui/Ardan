// I · WINTER WHEAT · longsword · the Marshal's sword of Aldmark. Drawn after the owner's example of a legendary blade
// (docs/design/reference/owner-ref-3-legendary-blade.png): dark patterned steel between bright edges, veins of gold down
// the middle like roots, a clawed guard of dark steel and gold round a cut stone, a black bound grip, a cut pommel.
import { MET, stuff, piece, tube, blade, sym, curve, line, inlay, engrave, ridge, beads, row, puff, glint, seat, gem, trim, roots, watering, xwrap, mixc, lerp, LIGHT, add, mul } from './fine.mjs';
import { plainSword } from './plain.mjs';

const STONE = '#5a6f9c';

export default {
  id: 'winter-wheat', no: 'I', name: 'Winter Wheat', cat: 'Longsword', form: 'sword.long', deg: 118, upright: 90,
  realm: 'Empire of Aldmark', people: 'Northfolk; forged for them by the dwarves of Irondeep',
  owner: 'The imperial crown of Aldmark, as a treasure of the realm. It is House Ironside’s to keep and not to carry.',
  wielder: 'The Marshal of Aldmark, while the seat is filled: in 1105, Leofric Stane. When no Marshal is named it hangs over the iron ring in the Oath Hall at Kingsmere.',
  why: 'By the Oath Moot’s law. The Moot takes it down for a Marshal and hangs it up the day the war ends, so an emperor who wants a great war must first ask for the sword.',
  made: 'Forged at Irondeep by Clan Brightanvil in 951, the dwarves’ seal on the Iron Road Contract. 154 years old.',
  legend: ['King Arnulf of Irondeep and Harald Ironside sealed the Iron Road Contract by torchlight: iron for wheat. The sword is the contract. Its heart is black hold-iron, and the roots of Aldmark’s wheat are let into it in gold.',
    'It went out in both Horde Wars and came home with the army both times. The Ironsides say of it what they say of themselves: it lies under the snow and it does not break.'],
  hand: 'Broad, and heavier toward the point than a hand expects; the first month it wears out the wrist. Learned, it shears a common blade at the bind and goes through mail. It is still one sword: a man quick enough to be gone when it falls has nothing to fear from the steel.',
  art: 'Under the Snow', artNote: 'a patient art: give ground like wheat under snow, then stand up through the other man’s last stroke',
  finish: 'Black dwarf-steel between bright bevels, gold, a grey sapphire, black leather', ground: ['#3b4150', '#0e0f15'], accent: '#d0a23a',
  len: 1155,
  box: [-262, 916, -142, 142],
  details: [{ t: 'The guard and the stone', box: [-262, 150, -146, 146] }, { t: 'Roots of gold in the black', box: [120, 300, -52, 52] }],
  plain: plainSword({ blade: 900, grip: 190, w: 25, cross: 100, pommel: 23 }), plainName: 'An ordinary longsword',
  draw(D) {
    const { S, F } = D, st = MET.bright, dk = { k: '#040508', d: '#0c0e13', s: '#191c24', b: '#2b303b', l: '#5a6578', hi: '#b4c0d2', r: '#252d3c' }, bk = MET.black, g = MET.gold, r = D.r('hilt'), fine = D.lod >= 2;
    const coreHw = u => lerp(16.5, 5, Math.min(1, Math.max(0, (u - 20) / 750)));
    // ---- the blade: a black heart of hold-iron, watered, with the gold roots; broad bright bevels; two barbs at the shoulder
    blade(D, {
      mat: st, st: [[0, 22, .5], [16, 23, .7], [33, 32, .6], [47, 49, 0], [66, 41, .5], [112, 39.5, .9], [400, 32, 1], [700, 20.4, 1], [842, 10, 1]], tip: 906, bevel: 3, hone: .9, wear: fine ? .8 : 0, sky: .14,
      litStops: [[0, st.hi], [.16, st.l], [.5, mixc(st.l, st.b, .7)], [.74, st.b], [1, st.s]], farStops: [[0, st.d], [.26, st.s], [.6, mixc(st.s, st.b, .7)], [.88, st.b], [1, st.s]],
      bands: [[.1, .22, 'dk2', .2], [.3, .42, 'lt', .5], [.58, .7, 'dk2', .18], [.76, .88, 'lt2', .34]], slashes: [[.46, .03, .5], [.5, .008, .65]],
      nicks: [[512, 1, 1.8], [690, -1, 1.1]],
      core: { mat: bk, hw: coreHw, u0: 20, u1: 770, point: 34, wall: 4.4, inside: () => {
        if (fine) { const w = watering(F, D.r('water'), 20, 806, coreHw, { lines: 7, amp: 1.3 }); S.stroke(w.light, bk.l, .5, { units: 1, op: .5 }); S.stroke(w.dark, '#000000', .6, { units: 1, op: .6 }); }
        const v = roots(F, D.r('roots'), 22, 790, coreHw, { trunks: 3, fork: .055, wander: .34, fill: .7, step: 9 });
        inlay(S, v[0], g, 1.25, { cap: 'round' }); inlay(S, v[1], g, .85, { cap: 'round' }); if (fine) inlay(S, v[2], g, .55, { cap: 'round' });
      } },
    });
    // ---- the guard: dark steel edged in gold. Two long claws swept toward the blade, two spurs thrown back, two fangs beside the blade
    const steelArm = (pts, t, o = {}) => piece(D, pts, dk, { t, shade: 'cross', turn: 'dark', ...o, inside: (d, P) => { trim(S, d, g, 1.5); if (o.inside) o.inside(d, P); } });
    for (const sg of [-1, 1]) {
      const m = p => [p[0], p[1] * sg];
      // the spur thrown back toward the hand
      steelArm([[-22, -16], [-44, -40], [-70, -72], [-49, -56], [-33, -42], [-25, -30]].map(m), [.4, .9, 0, .9, .8, .5]);
      // the fang beside the blade
      steelArm([[-4, -9], [12, -21], [46, -27], [16, -30], [-4, -25]].map(m), [.3, .8, 0, .8, .5]);
      // the great claw
      const claw = [[-31, 0], [-34, -18], [-37, -46], [-31, -78], [-15, -105], [13, -123], [43, -131], [64, -127], [41, -118], [17, -104], [1, -84], [-8, -58], [-7, -34], [-1, -22], [8, -12], [15, 0]].map(m);
      steelArm(claw, [.3, .9, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, .9, .8, .3], { inside: () => {
        // its spine: a bright ridge, a vein of gold beside it, a thorn half way
        S.stroke(curve(F, [[-22, -22], [-22, -52], [-16, -80], [0, -103], [22, -118], [50, -127]].map(m), 1, false), dk.hi, 1, { op: .7 });
        if (fine) inlay(S, curve(F, [[-27, -24], [-28, -50], [-23, -76], [-8, -99], [14, -114]].map(m), 1, false), g, .8);
      } });
      steelArm([[-27, -82], [-41, -101], [-22, -96], [-18, -90]].map(m), [.4, 0, .6, .4]);
    }
    // the heart of the guard: a lozenge of gold that holds the stone
    const heart = sym([[-46, 0], [-33, -12], [-16, -24], [2, -12], [20, 0]], [.2, .6, .2, .6, .2]);
    piece(D, heart.pts, g, { t: heart.t, shade: 'none', inside: (d, P) => {
      S.fill(d, S.lin(add(F.W(-14, 0), mul(LIGHT, 26)), add(F.W(-14, 0), mul(LIGHT, -26)), [[0, g.hi], [.3, g.l], [.6, g.b], [1, g.d]]));
      if (fine) { engrave(S, curve(F, [[-40, 0], [-30, -9], [-16, -18.4], [-1, -9], [12, 0], [-1, 9], [-16, 18.4], [-30, 9]], [.2, .6, .2, .6, .2, .6, .2, .6]), g, .5); beads(D, [[-36, 0], [10, 0], [-14, -19.6], [-14, 19.6]], 1.1, g); }
    } });
    gem(D, [-14, 0], 'lozenge', 12, STONE, { set: g, collet: 1.2, table: .44 });
    // ---- the grip: black leather bound both ways, a collar of gold at each end
    const T = tube(F, [[-44, 12.6], [-104, 15.4], [-168, 12.4]]), lea = stuff('#1f1d22', { l: '#4b4852', hi: '#8f8b98', k: '#030305' });
    piece(D, T.pts, lea, { t: 0, shade: 'round', inside: () => {
      const x = xwrap(F, T, 15, 15);
      S.stroke(x.a + x.b, '#000000', 3.4, { units: 1, op: .7 }); S.stroke(x.a + x.b, lea.hi, .7, { units: 1, op: .45, tf: 'translate(-1.3 -1.7)' });
      seat(D, -44, 16, -9, { op: .55 }); seat(D, -168, 15, 9, { op: .55 });
    } });
    const collar = (u, hw, h) => piece(D, [[u - h / 2, -hw + .8], [u - h / 4, -hw - 1], [u + h / 4, -hw - 1], [u + h / 2, -hw + .8], [u + h / 2, hw - .8], [u + h / 4, hw + 1], [u - h / 4, hw + 1], [u - h / 2, hw - .8]], g, { t: .5, inside: () => { if (fine) for (const k of [-1, 1]) ridge(S, line(F, [[u + k * h * .3, -hw - 2], [u + k * h * .3, hw + 2]]), g, .7); } });
    collar(-47, 14.6, 9); collar(-57, 14.2, 5); collar(-168, 13.6, 8);
    // ---- the pommel: cut like a stone, four dark faces to a point, every edge run with gold
    {
      const top = [-174, 0], L = [-203, -25], R = [-203, 25], tip = [-252, 0], mid = [-206, 0];
      const out = [[-174, -8], L, tip, R, [-174, 8]];
      piece(D, out, dk, { poly: .06, shade: 'none', inside: (d) => {
        const face = (pts, t) => S.fill(line(F, pts, true), S.lin(F.W(...pts[0]), F.W(...pts[2]), [[0, facetTone(dk, t + .25)], [1, facetTone(dk, t - .3)]]));
        const lit = F.vx[0] * LIGHT[0] + F.vx[1] * LIGHT[1] < 0 ? -1 : 1;                        // which side faces the light
        face([[-174, lit * 8], [-203, lit * 25], mid, top], .3); face([[-203, lit * 25], tip, mid, [-203, lit * 25]], -.1);
        face([[-174, -lit * 8], [-203, -lit * 25], mid, top], -.55); face([[-203, -lit * 25], tip, mid, [-203, -lit * 25]], -.95);
        const edges = line(F, [top, mid, tip]) + line(F, [L, mid, R]);
        inlay(S, edges, g, 1.3); trim(S, d, g, 1.5);
        if (fine) { engrave(S, line(F, [[-186, -6.5], [-198, -15], [-200, -5.5]], true) + line(F, [[-186, 6.5], [-198, 15], [-200, 5.5]], true), dk, .5); }
      } });
      piece(D, [[-250, -3.2], [-256, -2.4], [-259, 0], [-256, 2.4], [-250, 3.2]], g, { t: .6 });
    }
    glint(D, add(F.W(-14, 0), mul(LIGHT, 5)), 9); glint(D, F.W(560, (F.vx[0] * LIGHT[0] + F.vx[1] * LIGHT[1] < 0 ? -1 : 1) * 21), 10, { a: .3 });
  },
};
function facetTone(m, t) { t = Math.max(-1, Math.min(1, t)); return t > .5 ? mixc(m.l, m.hi, (t - .5) * 2) : t > 0 ? mixc(m.b, m.l, t * 2) : t > -.5 ? mixc(m.s, m.b, (t + .5) * 2) : mixc(m.d, m.s, (t + 1) * 2); }
