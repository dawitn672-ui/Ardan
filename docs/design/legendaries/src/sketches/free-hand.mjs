// I · THE FREE HAND · longsword · the crown sword of Tessaria, made for a six-fingered hand
import { MET, IVORY, piece, tube, blade, sym, disc, curve, line, inlay, engrave, ridge, vineOn, lettering, cabochon, enamel, beads, row, dots, puff, ball, glint, winding, facet, seat, mixc, lerp, spl, add, mul, LIGHT } from '../kit.mjs';
import { plainSword } from '../plain.mjs';

const GREEN = '#1c6a44';

// the open hand of House Tessaran: a thumb and five fingers. c: (u, v) of the palm's heart; z: its height in mm
function hand6(F, c, z) {
  const P = (x, y) => F.W(c[0] + y * z, c[1] + x * z), cap = (x, y0, w, l, lean = 0) => {
    const tx = x + lean * l; return spl([P(x - w / 2, y0), P(tx - w / 2, y0 + l - w * .4), P(tx, y0 + l), P(tx + w / 2, y0 + l - w * .4), P(x + w / 2, y0)], false, [0, .8, 1, .8, 0]) + 'Z';
  };
  const palm = spl([P(-.3, .1), P(-.33, -.2), P(-.2, -.46), P(.12, -.5), P(.34, -.3), P(.37, .1)], true, [.5, 1, 1, 1, 1, .5]);
  const fingers = [[-.3, .08, .13, .3, -.1], [-.15, .1, .13, .42, -.04], [0, .1, .135, .47, 0], [.155, .1, .13, .42, .04], [.305, .08, .12, .31, .1]].map(f => cap(...f));
  const th = spl([P(.3, -.32), P(.47, -.2), P(.6, -.02), P(.57, .1), P(.47, .04), P(.36, -.12)], true, [.6, 1, 1, 1, 1, .6]);
  return { all: palm + fingers.join('') + th, lines: fingers.join('') + th, palm };
}

export default {
  id: 'free-hand', no: 'I', name: 'The Free Hand', cat: 'Longsword', form: 'sword.long',
  keeper: 'House Tessaran, the crown of Tessaria',
  made: 'Forged in secret at Stonehold in 711, for the crowning of Leo the Free. It bears no maker’s mark. 394 years old.',
  legend: ['Its grip is a finger longer than any other sword’s, cut for the six-fingered hand of the Tessarans. Three emperors born with five wore it and never drew it.',
    'Since 1061 the kingdom has had two crowns and one sword. Queen Livia holds the blade at Tessar; Prince Andros holds its scabbard at Calossa, and calls that half.'],
  hand: 'Long in the grip and light at the point, it turns in the bind faster than a blade this size should. A common sword that meets its edge comes away notched. It is still one man’s arm: step inside the long grip’s swing and it is only steel.',
  art: 'Six Fingers Hold', artNote: 'won at the bind: the blade that crosses it is held, turned and taken',
  finish: 'Bright steel, gold, narwhal ivory, green enamel', ground: ['#3e5a4a', '#16241d'], accent: GREEN,
  len: 1225,
  box: [-312, 936, -132, 132],                         // u0, u1, v0, v1 of the whole piece
  details: [{ t: 'The hilt', box: [-312, 170, -134, 134] }, { t: 'The pommel', box: [-304, -220, -44, 44] }, { t: 'The words in the fuller', box: [62, 236, -34, 34] }],
  plain: plainSword({ blade: 900, grip: 190, w: 25, cross: 100, pommel: 23 }),
  plainName: 'An ordinary longsword',
  draw(D) {
    const { S, F } = D, st = MET.bright, g = MET.gold, r = D.r('hilt');
    // ---- the blade: bright steel, the house's words let into the fuller in gold, the forte etched and gilt
    blade(D, {
      mat: st, st: [[0, 27], [120, 25.6], [330, 22], [560, 17.6], [760, 11.6], [868, 6.2]], tip: 928, bevel: 2.6, wear: 1,
      nicks: [[418, 1, 2.2], [655, -1, 1]],
      fuller: { u0: 12, u1: 352, w: 13.5, w1: 7.5, inside: () => {
        const t = lettering(F, '+ SIX FINGERS HOLD +', 150, 0, 6.6, { center: true, gap: .3 });
        inlay(S, t.d, g, 1.05, { cap: 'round' });
        // a six-petalled flower at each end of the line
        for (const u of [56, 244]) { let d = ''; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; d += line(F, [[u, 0], [u + Math.cos(a) * 2.7, Math.sin(a) * 2.7]]); } inlay(S, d, g, .8, { cap: 'round' }); }
      } },
      inside: ({ half }) => {
        // the etched and gilt forte: a darkened ground with a gold vine on each flat, closed by a point
        for (const sg of [-1, 1]) {
          const a = 8.8, b = half(20) - 3.6, pan = [[14, sg * a], [118, sg * a], [150, sg * (a + b) / 2], [118, sg * b], [14, sg * b]], pd = line(F, pan, true);
          S.fill(pd, S.lin(F.W(14, 0), F.W(150, 0), [[0, '#0b101c', .9], [.7, '#16203a', .8], [1, '#1d2a4a', .7]]));
          S.within(pd, () => vineOn(S, F, [[10, sg * (a + b) / 2], [146, sg * (a + b) / 2]], (b - a) * .4, g, .5, { step: 12.5 }));
          inlay(S, line(F, pan, true), g, .55);
        }
      },
    });
    // ---- the grip: narwhal ivory in a slow spiral, gold wire laid in its grooves, gone the colour of honey with age
    const gst = [[-16, 13.4], [-60, 14.8], [-118, 15.4], [-176, 13.6], [-230, 11.4]], T = tube(F, gst);
    piece(D, T.pts, IVORY, { t: 0, shade: 'round', inside: (d) => {
      S.fill(d, S.lin(F.W(-16, 0), F.W(-230, 0), [[0, '#b0803f', .55], [.12, '#c79a5a', .12], [.5, '#fff8e6', .12], [.86, '#c79a5a', .16], [1, '#a37236', .6]]));
      const w = winding(F, T, 15.5, 22);
      S.stroke(w, IVORY.d, 3.1, { units: 1, op: .55 }); S.stroke(w, IVORY.k, .5, { units: 1, op: .5, tf: 'translate(.9 1.2)' });
      inlay(S, w, g, .95);
      S.stroke(winding(F, T, 15.5, 22, { bow: .3 }), '#ffffff', 2.2, { units: 1, op: .34, tf: 'translate(-2.6 -3.4)' });
      // the cracks old ivory takes along its length
      let ck = ''; for (let i = 0; i < 9; i++) { const u = -26 - r() * 190, v = (r() * 2 - 1) * 9, l = 6 + r() * 18; ck += line(F, [[u, v], [u - l * .5, v + (r() - .5) * 1.2], [u - l, v + (r() - .5) * 1.6]]); }
      S.stroke(ck, '#6d5330', .32, { units: 1, op: .55 });
      seat(D, -16, 16, -9, { col: '#3a2408', op: .55 }); seat(D, -230, 14, 8, { col: '#3a2408', op: .5 });
    } });
    // the gold ring at the grip's waist, set with six small emeralds (three are seen), and a ferrule at each end
    const ring = (u, hw, h, o = {}) => {
      const pts = [[u - h / 2, -hw + .6], [u - h / 4, -hw - 1.1], [u + h / 4, -hw - 1.1], [u + h / 2, -hw + .6], [u + h / 2, hw - .6], [u + h / 4, hw + 1.1], [u - h / 4, hw + 1.1], [u - h / 2, hw - .6]];
      piece(D, pts, g, { t: .5, inside: () => { for (const k of [-1, 1]) ridge(S, line(F, [[u + k * h * .33, -hw - 2], [u + k * h * .33, hw + 2]]), g, .7); if (o.inside) o.inside(); } });
    };
    ring(-118, 16.2, 13, { inside: () => { let dd = ''; for (let i = -4; i <= 4; i++) dd += line(F, [[-118 - 2.6, i * 4 - 1.6], [-118 + 2.6, i * 4 + 1.6]]); engrave(S, dd, g, .35); } });
    for (const v of [-9.5, 0, 9.5]) cabochon(D, [-118, v], 1.9, GREEN, g, { shadow: false });
    ring(-21, 14.2, 9); ring(-226, 12.2, 8);
    // ---- the cross: gilt, eight-sided, swelling at the middle to hold an emerald; each end a cut knop of six flats
    const hx = [[-18, 0], [-18, -16], [-15, -42], [-13.6, -84], [-14.2, -97], [-20, -107], [-16.6, -120], [-11, -125.5], [-5, -125.5], [.6, -120], [4, -107], [-1.8, -97], [-2.4, -84], [-1, -42], [2, -16], [7, -9], [14, -4.5], [22, 0]];
    const cr = sym(hx, [.4, .8, 1, 1, .5, .3, .4, .3, .3, .4, .3, .5, 1, 1, .8, .7, .7, .3]);
    piece(D, cr.pts, g, { t: cr.t, shade: 'cross', inside: () => {
      for (const sg of [-1, 1]) {
        // the eight-sided bar: a bright flat along its top, a dark one under
        S.fill(line(F, [[-3.6, sg * 17], [-4.4, sg * 44], [-5, sg * 96], [-3.2, sg * 96], [-2.2, sg * 44], [.8, sg * 17]], true), g.hi, { op: .8 });
        S.fill(line(F, [[-12.4, sg * 17], [-11.6, sg * 44], [-11.4, sg * 96], [-13.2, sg * 96], [-13.8, sg * 44], [-16, sg * 17]], true), g.d, { op: .55 });
        vineOn(S, F, [[-8, sg * 20], [-8, sg * 95]], 2.5, g, .36, { step: 8.6, cut: true });
        // the knop: its flats, one catching the light
        const kn = [[-14.2, sg * 97], [-20, sg * 107], [-16.6, sg * 120], [-11, sg * 125.5], [-5, sg * 125.5], [.6, sg * 120], [4, sg * 107], [-1.8, sg * 97]], mid = [[-11.6, sg * 103], [-12.6, sg * 110], [-10.6, sg * 118], [-5.4, sg * 118], [-3.4, sg * 110], [-4.4, sg * 103]];
        S.fill(line(F, mid, true), S.lin(F.W(-4, sg * 110), F.W(-12, sg * 110), [[0, g.hi], [.4, g.l], [1, g.b]]));
        S.fill(line(F, [kn[6], kn[5], mid[3], mid[4]], true), g.hi, { op: .7 }); S.fill(line(F, [kn[1], kn[2], mid[2], mid[1]], true), g.d, { op: .75 });
        S.fill(line(F, [kn[2], kn[3], kn[4], kn[5], mid[3], mid[2]], true), sg < 0 ? g.l : g.s, { op: .8 });
        let ed = ''; for (let i = 0; i < 6; i++) ed += line(F, [mid[i], [kn[1], kn[2], kn[5], kn[5], kn[6], kn[1]][i]]); S.stroke(line(F, mid, true) + ed, g.k, .6, { op: .5 });
        beads(D, row([-12.6, sg * 99.5], [-3.4, sg * 99.5], 4), .85, g);
      }
      beads(D, disc([1, 0], 10.8, 10.8, 14), .8, g);
    } });
    // the emerald at the cross: table-cut, in a gold collet
    {
      const c = [1, 0], P = F.W(c[0], c[1]), oct = (rr) => disc(c, rr, rr, 8, Math.PI / 8), o1 = oct(8.8), o2 = oct(6.8), o3 = oct(3.6);
      S.layer('over'); const od = line(F, o1, true); S.fill(od, g.b); S.within(od, () => ball(S, od, P, 9, g, { spec: false })); S.stroke(od, g.k, .9);
      const deep = '#073321', lite = '#58c08a';
      for (let i = 0; i < 8; i++) { const a = o2[i], b = o2[(i + 1) % 8], mx = F.W((a[0] + b[0]) / 2, (a[1] + b[1]) / 2), t = ((mx[0] - P[0]) * LIGHT[0] + (mx[1] - P[1]) * LIGHT[1]) / 6; S.fill(line(F, [a, b, o3[(i + 1) % 8], o3[i]], true), t > .5 ? lite : t > 0 ? GREEN : t > -.5 ? mixc(GREEN, deep, .55) : deep); }
      S.fill(line(F, o3, true), S.lin(add(P, mul(LIGHT, 3.6)), add(P, mul(LIGHT, -3.6)), [[0, '#9be8be'], [.45, GREEN], [1, deep]]));
      S.stroke(line(F, o2, true) + line(F, o3, true), '#031a10', .6, { op: .8 });
      S.fill(line(F, [o3[4], o3[5], [c[0] + .6, c[1] - .4]], true), '#ffffff', { op: .85 });
    }
    // ---- the pommel: a six-sided wheel of gold; in its heart the open hand in white enamel on the split field
    {
      const c = [-262, 0], R = 31.5, hex = (rr, a0 = Math.PI / 6) => disc(c, rr, rr, 6, a0), H1 = hex(R), H2 = hex(R * .74), Pc = F.W(c[0], c[1]);
      // the neck that joins it to the grip, and the peen block on its far side
      piece(D, [[-231, -9], [-238, -7.4], [-238, 7.4], [-231, 9]], g, { t: .3 });
      piece(D, [[-288, -6.4], [-296, -5.4], [-299.5, 0], [-296, 5.4], [-288, 6.4]], g, { t: .7 });
      piece(D, H1, g, { poly: .12, shade: 'none', inside: () => {
        for (let i = 0; i < 6; i++) { const a = H1[i], b = H1[(i + 1) % 6], mid = F.W((a[0] + b[0]) / 2, (a[1] + b[1]) / 2), n = [mid[0] - Pc[0], mid[1] - Pc[1]], q = line(F, [a, b, H2[(i + 1) % 6], H2[i]], true), t = (n[0] * LIGHT[0] + n[1] * LIGHT[1]) / (R * .87); S.fill(q, facet(g, t)); S.fill(q, S.lin(F.W(a[0], a[1]), F.W(b[0], b[1]), [[0, g.hi, .35], [.5, g.hi, 0], [1, g.d, .3]])); }
        let sp = ''; for (let i = 0; i < 6; i++) sp += line(F, [H1[i], H2[i]]); S.stroke(sp, g.k, .7, { op: .55 }); S.stroke(sp, g.hi, .5, { op: .5, tf: 'translate(-.5 -.6)' });
        const inner = line(F, H2, true); S.fill(inner, S.lin(add(Pc, mul(LIGHT, R * .7)), add(Pc, mul(LIGHT, -R * .7)), [[0, g.hi], [.3, g.l], [.62, g.b], [1, g.s]])); S.stroke(inner, g.k, .7, { op: .7 });
      } });
      S.layer('over');
      // the roundel: green enamel on the hand's side of the field, matted gold on the other; the hand in white over both
      const rr = 17.2, cir = disc(c, rr, rr, 32), cd = curve(F, cir), cP = F.P(cir);
      S.fill(cd, g.s); S.within(cd, () => {
        const left = line(F, [[c[0] - rr - 1, -rr - 1], [c[0] + rr + 1, -rr - 1], [c[0] + rr + 1, 0], [c[0] - rr - 1, 0]], true);
        S.within(left, () => enamel(S, cd, cP, GREEN));
        const right = line(F, [[c[0] - rr - 1, 0], [c[0] + rr + 1, 0], [c[0] + rr + 1, rr + 1], [c[0] - rr - 1, rr + 1]], true);
        S.within(right, () => { S.fill(cd, S.lin(F.W(c[0] + rr, 0), F.W(c[0] - rr, rr), [[0, g.l], [.5, g.b], [1, g.s]])); const pp = []; for (let i = 0; i < 150; i++) pp.push([c[0] + (r() * 2 - 1) * rr, r() * rr]); S.fill(dots(F, pp, .36), g.d, { op: .55 }); });
        inlay(S, line(F, [[c[0] - rr, 0], [c[0] + rr, 0]]), g, .55);
        const h = hand6(F, [c[0] - 1.5, -.6], 23);
        S.fill(h.all, '#2a1c08', { op: .6, tf: 'translate(.7 1)' });
        S.fill(h.all, '#f6f1e6'); S.stroke(h.lines, '#8d7a55', .28, { units: 1, op: .9 }); S.stroke(h.all, '#4a3a1c', .3, { units: 1, op: .55 });
        puff(S, F.W(c[0] - 4, -3), 5, 4, '#ffffff', .6);
      });
      ridge(S, cd, g, 1.25); beads(D, disc(c, rr + 2.4, rr + 2.4, 34), .72, g);
      for (let i = 0; i < 6; i++) { const p = H1[i]; beads(D, [[lerp(p[0], c[0], .1), lerp(p[1], c[1], .1)]], 1.25, g); }
      glint(D, add(Pc, mul(LIGHT, 27.5)), 9);
    }
    glint(D, F.W(-8.5, -110), 7, { a: .2 }); glint(D, F.W(604, -8), 10, { a: .3 });
  },
};
