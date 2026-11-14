// II · THE TWELFTH WOLF · greatsword · the sword of the Grand Masters of the Iron Wolf (Aldmark)
import { MET, stuff, piece, tube, blade, sym, disc, curve, line, inlay, engrave, ridge, cabochon, beads, row, puff, glint, winding, pelt, seat, mixc, lerp, spl, add, mul, LIGHT } from '../kit.mjs';
import { plainSword } from '../plain.mjs';

const AMBER = '#d8922a';

export default {
  id: 'twelfth-wolf', no: 'II', name: 'The Twelfth Wolf', cat: 'Greatsword', form: 'sword.great', deg: 90,
  keeper: 'The Knights of the Iron Wolf, Aldmark; carried by their Grand Master',
  made: 'Forged at Irondeep in 950 from the eleven lance heads of the wolf winter, at Harald Ironside’s order. 155 years old.',
  legend: ['On the ninth night on the frozen Glenwash, forty starving riders went out on foot and killed eleven wolves with their lances. The lance heads were made into one black blade, and the order calls it the twelfth.',
    'Each Grand Master binds its ricasso in the pelt he took alone. It has never been surrendered, and no one living has seen it leave a field before the banner.'],
  hand: 'As tall as a boy and heavier than it looks; an untaught arm is tired by the third stroke. Mastered, it goes through a guard, the sword in it and the mail behind. It is slow to come round. A quick man who slips the first stroke has a long breath to work in.',
  art: 'The Ninth Night', artNote: 'once in a fight, when it is going against you, you strike as if it were not',
  finish: 'Black dwarf-steel with a pale edge, black iron, silver, wolf pelt, amber', ground: ['#6f7b8c', '#28303c'], accent: AMBER,
  len: 1730,
  box: [-440, 1304, -190, 190],
  details: [{ t: 'Hilt, pelt and lugs', box: [-440, 300, -186, 186] }, { t: 'The wolf', box: [-440, -300, -82, 60] }, { t: 'Eleven teeth in the fuller', box: [296, 470, -52, 52] }],
  plain: plainSword({ blade: 1240, grip: 360, w: 27, cross: 185, pommel: 25, ricasso: true }),
  plainName: 'An ordinary greatsword',
  draw(D) {
    const { S, F } = D, bk = MET.black, sv = MET.silver, r = D.r('hilt');
    // ---- the blade: black steel, the edges honed pale; a ricasso to take the left hand; eleven silver teeth in the fuller
    blade(D, {
      mat: bk, st: [[8, 21.5], [225, 21.5], [258, 22.5], [284, 30], [700, 26.6], [1050, 20.4], [1216, 12]], tip: 1294, bevel: 3.3, hone: .96, honeFar: '#aeb8c6', wear: .8, sky: .1, earth: .1,
      litStops: [[0, bk.l], [.3, mixc(bk.b, bk.l, .35)], [.75, bk.b], [1, bk.l]], farStops: [[0, bk.k], [.3, bk.d], [.8, bk.s], [1, bk.d]],
      bands: [[.22, .34, 'dk', .5], [.34, .43, 'lt', .42], [.56, .68, 'lt2', .22], [.8, .92, 'lt2', .3]], slashes: [[.47, .03, .22], [.508, .008, .34]],
      nicks: [[612, 1, 2], [905, -1, 1.4]],
      fuller: { u0: 288, u1: 772, w: 12, w1: 6.6, inside: () => {
        let d = ''; for (let i = 0; i < 11; i++) { const u = 322 + i * 40, w = lerp(2.5, 1.7, i / 10); d += line(F, [[u, -w], [u + 16 - i * .3, 0], [u, w]], true); }
        S.fill(d, sv.b); S.stroke(d, sv.k, .5, { op: .9 }); S.stroke(d, sv.hi, .4, { units: 1, op: .8, tf: 'translate(-.2 -.3)' });
      } },
    });
    // the lugs: two hooked fangs that stop a blade sliding down to the hand
    for (const sg of [-1, 1]) {
      piece(D, [[230, sg * 21], [238, sg * 38], [258, sg * 54], [280, sg * 62], [268, sg * 46], [263, sg * 31], [263, sg * 21]], bk, { t: [0, .8, .9, 0, .9, .8, 0], shade: 'face', inside: () => {
        S.stroke(curve(F, [[232, sg * 24], [240, sg * 39], [259, sg * 54.5], [279, sg * 61.5]], 1, false), '#e3e9f0', 1.7, { units: 1, op: .9 });
      } });
    }
    // the pelt on the ricasso, bound top and bottom with black iron edged in silver
    pelt(D, 24, 214, 24.5, ['#3b3833', '#857d72', '#cfc8ba', '#17161a']);
    const band = (u, hw, h) => piece(D, [[u - h / 2, -hw], [u + h / 2, -hw], [u + h / 2, hw], [u - h / 2, hw]], bk, { poly: .2, inside: () => { for (const k of [-1, 1]) ridge(S, line(F, [[u + k * (h / 2 - 1.6), -hw - 1], [u + k * (h / 2 - 1.6), hw + 1]]), sv, 1); } });
    band(30, 26.5, 13); band(208, 26.5, 13);
    // ---- the grip: grey leather over cord, a silver wire in the turns, a black iron ring at the waist
    const T = tube(F, [[-14, 16], [-90, 18.6], [-165, 17.6], [-240, 17.2], [-318, 14.2]]), lea = stuff('#67605b', { k: '#131110' });
    piece(D, T.pts, lea, { t: 0, shade: 'round', inside: () => {
      const w = winding(F, T, 15, 9);
      S.stroke(w, lea.k, 3, { units: 1, op: .5 }); S.stroke(w, lea.l, 1.6, { units: 1, op: .32, tf: 'translate(-2.2 -3)' });
      inlay(S, w, sv, .9);
      seat(D, -14, 20, -10, { op: .5 }); seat(D, -318, 16, 9, { op: .5 });
    } });
    band(-166, 19.4, 15); band(-316, 16.4, 9);
    // ---- the cross: black iron, each arm ending in a claw turned toward the blade; the emperors' iron ring in silver at its heart
    const hx = [[-13, 0], [-13, -22], [-9, -62], [-7, -112], [-6, -142], [-1, -160], [11, -172], [31, -176], [50, -170], [31, -165], [15, -158], [6, -146], [5, -112], [5, -62], [10, -24], [15, -14], [26, -8], [44, 0]];
    const cr = sym(hx, [.4, .8, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, .8, .8, .6, .3]);
    piece(D, cr.pts, bk, { t: cr.t, shade: 'cross', inside: () => {
      for (const sg of [-1, 1]) {
        inlay(S, curve(F, [[-1, sg * 26], [-1, sg * 110], [0, sg * 140], [8, sg * 160], [28, sg * 169]], 1, false), sv, .9);
        for (const v of [34, 124]) { ridge(S, line(F, [[-10, sg * v], [8, sg * v]]), sv, 1.1); ridge(S, line(F, [[-10, sg * (v + 5)], [8, sg * (v + 5)]]), sv, 1.1); }
        S.stroke(curve(F, [[4.6, sg * 30], [4.4, sg * 112], [5.4, sg * 144], [14, sg * 157.4], [31, sg * 164.4], [48, sg * 169.4]], 1, false), bk.hi, .9, { op: .7 });
      }
      inlay(S, curve(F, disc([8, 0], 8.4, 8.4, 24)), sv, 1.5);
      puff(S, F.W(22, 0), 5, 12, bk.l, .4);
    } });
    // ---- the pommel: a wolf's head in black iron, silver in its teeth, amber in its eye
    {
      const H = (x, y) => [-322 + y, -x], hp = pts => pts.map(p => H(p[0], p[1]));
      // the far ear first, behind the head
      piece(D, hp([[-4, -88], [4, -112], [13, -90], [8, -82]]), bk, { t: [.5, 0, .5, .5], shade: 'none', inside: (d) => { S.fill(d, bk.d); } });
      const out = [[-14, 0], [-16, -12], [-21, -22], [-25, -26], [-40, -27], [-54, -29], [-62, -32], [-63.5, -36], [-56, -38.5], [-42, -39.5], [-30, -42], [-42, -46], [-56, -47.5], [-66, -48.5], [-71, -51], [-72.5, -55.5], [-68, -59], [-56, -61.5], [-44, -64], [-36, -68], [-31, -75], [-22, -81], [-14, -86], [-9, -113], [4, -91], [13, -80], [19, -64], [17, -52], [22, -44], [18, -34], [20, -22], [15, -8], [14, 0]];
      const sm = [0, .8, .8, .6, .9, .9, .5, .3, .7, .9, 0, .9, .7, .3, .5, .5, .4, .9, .9, .7, .8, .9, .4, 0, .4, .9, .5, 0, .3, 0, .5, .8, 0];
      // the dark of the open mouth, then the head over it
      S.layer('main'); S.fill(line(F, hp([[-64, -36], [-30, -42], [-66, -48.5]]), true), '#0a0406');
      piece(D, hp(out), bk, { t: sm, shade: 'none', inside: (d) => {
        const Pp = (x, y) => F.W(...H(x, y));
        // the planes of the skull: light along the muzzle, the brow and the ear's edge; dark under the jaw and down the nape
        S.fill(d, S.lin(Pp(-40, -90), Pp(10, 0), [[0, bk.l], [.3, bk.b], [.7, bk.s], [1, bk.d]]));
        puff(S, Pp(-52, -57), 20, 4.5, bk.hi, .55, -.12); puff(S, Pp(-24, -56), 11, 8, bk.l, .5, -.3); puff(S, Pp(-28, -79), 9, 3.4, bk.hi, .5, -.55);
        puff(S, Pp(-42, -31), 20, 4, '#000000', .6, .04); puff(S, Pp(12, -40), 6, 30, '#000000', .5);
        S.fill(line(F, hp([[-13, -88], [-9.5, -110], [-3, -92]]), true), bk.hi, { op: .28 });
        S.fill(line(F, hp([[-9, -90], [-8, -107], [1.5, -91.5]]), true), '#000000', { op: .5 });
        // the pelt of the neck and cheek, cut in with the graver
        let fur = ''; const st = D.r('fur');
        for (let i = 0; i < 26; i++) { const x0 = -24 + st() * 34, y0 = -62 + st() * 56, l = 7 + st() * 9, a = .9 + st() * .8; fur += line(F, hp([[x0, y0], [x0 + Math.cos(a) * l * .5 + 1.2, y0 + Math.sin(a) * l * .5], [x0 + Math.cos(a) * l + 3, y0 + Math.sin(a) * l]])); }
        for (let i = 0; i < 7; i++) { const a = -.5 + i * .16; fur += line(F, hp([[-27 + Math.cos(a) * 3, -47 + Math.sin(a) * 3], [-27 + Math.cos(a) * 13, -47 + Math.sin(a) * 14 + 3]])); }
        engrave(S, fur, bk, .5, { op: .95 });
        // lips, nostril, the line of the muzzle
        engrave(S, curve(F, hp([[-66, -50], [-56, -49.2], [-42, -47.6], [-31, -43.4]]), 1, false) + curve(F, hp([[-62, -34.2], [-54, -37], [-42, -38], [-31, -40.6]]), 1, false), bk, .55);
        S.fill(curve(F, hp([[-70.5, -55], [-68.6, -56.6], [-66.6, -55], [-68.4, -53.2]])), '#000000');
        S.stroke(curve(F, hp([[-70, -58], [-58, -60.6], [-45, -63], [-37, -67]]), 1, false), bk.hi, 1, { op: .75 });
        // the brow and the eye
        S.stroke(curve(F, hp([[-39, -70.5], [-31, -75], [-22, -78.5]]), 1, false), '#000000', 2.2, { units: 1, op: .85 });
        S.stroke(curve(F, hp([[-38, -72.4], [-31, -76.6], [-23, -80]]), 1, false), bk.hi, .7, { units: 1, op: .7 });
      } });
      S.layer('over');
      const eye = curve(F, hp([[-36.5, -69], [-30.5, -72.6], [-24.4, -71.4], [-30, -67.8]]), [.2, 1, .2, 1]);
      S.fill(eye, S.lin(F.W(...H(-34, -72)), F.W(...H(-26, -68)), [[0, '#ffd27a'], [.5, AMBER], [1, '#7a4208']])); S.stroke(eye, '#000000', .9);
      S.fill(curve(F, hp([[-31, -72], [-29.2, -70.4], [-30.2, -68.4], [-31.8, -70.2]])), '#0b0500'); S.fill(curve(F, disc(H(-32.6, -71.2), .9, .9, 8)), '#ffffff', { op: .95 });
      // teeth: two fangs and the small ones behind them, in silver
      let th = line(F, hp([[-62.4, -48], [-60.4, -40.2], [-58.2, -47.6]]), true) + line(F, hp([[-58.8, -38.2], [-57.2, -45], [-55, -38.4]]), true);
      for (let i = 0; i < 4; i++) { const x = -53.5 + i * 4.6; th += line(F, hp([[x, -47.3 + i * .25], [x + 1.6, -44.3 + i * .2], [x + 3.2, -47 + i * .25]]), true) + line(F, hp([[x + 2, -38.7 - i * .2], [x + 3.5, -41.5 - i * .1], [x + 5, -38.9 - i * .25]]), true); }
      S.fill(th, sv.l); S.stroke(th, sv.k, .5, { op: .9 });
      glint(D, F.W(...H(-33.4, -77.6)), 7, { a: .2 });
    }
    glint(D, F.W(1010, -19.5), 10, { a: .3 }); glint(D, F.W(279, 61), 6);
  },
};
