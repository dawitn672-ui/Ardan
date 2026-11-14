// IX · SICKLE MOON · war bow · Queen Maerith's bow (Kingdom of Sylvaran). Redrawn for owner order 52 (D-050): the first
// bow (sketches/the-unbending.mjs) was a true-to-scale stave and read as a line. This one is a made thing from end to end:
// a riser of black heart-oak carved to the hand, with a scroll on each shoulder, an oak leaf and a moonstone in a silver
// sickle; limbs of ridge yew, deep in the hand, their pale sapwood left on the back, edged in silver wire, with the moons
// of a month inlaid from new to full; ears of white horn spliced on under silver collars and cut to a sickle beyond the
// nock; a grey silk string served in green, with owl-down to hush it; and its own arrows and quiver. Elf work: nothing on
// it is straight or square, and nothing on it shines but silver and horn.
import { MET, WOOD, IVORY, HORN, stuff, piece, tube, disc, curve, line, inlay, engrave, beads, dots, glint, cabochon, winding, xwrap, vineOn, trim, tufts, offset, splPts, mixc, lerp, clamp, LIGHT, add, sub, mul, norm } from './fine.mjs';
import { plainBow } from './plain.mjs';

const GREEN = '#2f6b47', YEW = stuff('#a65f30', { k: '#2a1206' }), SAP = WOOD.yewSap, OAK = stuff('#31261f', { s: '#1d1612', d: '#0e0a08', l: '#66513f', hi: '#b39a80', k: '#070403' });
const SILK = stuff(GREEN, { k: '#0b1d12' }), QUIV = stuff('#1f4534', { k: '#07130d', l: '#3f7458', hi: '#86b79a' }), DOWN = '#efe8d8', BAR = '#8b7a64', MOON = '#cfe1ea';
const sv = MET.silver;
// the bow's own line, grip to upper nock: braced (the string on), and as it springs back when the string is off
const BRACED = [[0, 0], [95, -7], [250, -50], [430, -110], [560, -146], [640, -158], [720, -146], [790, -110], [838, -62]];
const SPRUNG = [[0, 0], [95, 3], [250, 12], [430, 34], [560, 72], [640, 108], [720, 152], [790, 202], [838, 254]];
const both = P => [...P.slice(1).reverse().map(([u, v]) => [-u, v]), ...P];
// a sickle moon round c (u, v), its horns toward `ang` (radians, 0 = +u): an outline, thickest at its back
const sickle = (c, R, ang, thick = .42, wrap = 1.52) => { const o = [], at = (i, k) => { const a = ang + Math.PI * (1 - wrap / 2 + wrap * i / 14); return [c[0] + Math.cos(a) * R * k, c[1] + Math.sin(a) * R * k]; }; for (let i = 0; i <= 14; i++) o.push(at(i, 1)); for (let i = 13; i > 0; i--) o.push(at(i, 1 - thick * Math.sin(Math.PI * i / 14))); return o; };
// half the limb's depth at u: full under the riser, fining to the splice, finer along the ear
const hw = u => { const a = Math.abs(u); return a < 130 ? 20 : a < 600 ? lerp(19.6, 13, (a - 130) / 470) : lerp(13.4, 9, clamp((a - 600) / 238)); };

export default {
  id: 'sickle-moon', no: 'IX', name: 'Sickle Moon', cat: 'War bow', form: 'bow.recurve', deg: -62, upright: -90,
  realm: 'Kingdom of Sylvaran', people: 'The elves of the Evenwood; the Oakborn line',
  owner: 'The Oakborn, the ruling blood of Sylvaran. It is an heirloom of the queens and not of the crown.',
  wielder: 'No one. It hangs unstrung beside its quiver in the queen’s grove at Evenglade. Queen Ithrien’s left hand is still, and cannot hold a bow.',
  why: 'It goes to the Oakborn heir, and the only other of the blood is Thalion Halfleaf: an archer, and barred from the crown by law because he is half-elven. To hand him the bow is to name him. The Moot of Leaves has voted on it four times.',
  made: 'Cut on the Yew Ridges under the sickle moon of Leaf Fall, about 250 BR, with the tree’s pardon asked; worked at Evenglade for Maerith, then a queen’s daughter of fourteen. Some 1,350 years old.',
  legend: ['In 291 Queen Maerith loosed the first arrow of the War of the Forest Edge with it, and said of the Solen army: let them bring their sun; we will be its shadow.',
    'They called her the Unbending. The bow kept the name of the moon it was cut under: light enough to shoot by, too little to be seen by. In seven hundred years three archers have strung it. None was let keep it.'],
  hand: 'It draws like a ship’s cable and wants years before it can be drawn true. Drawn true, its horn ears throw a war arrow through a shield at two hundred paces, and faster than a bow has any right to. The arrow still has to find its man: a moving rider, a wall or a wind, and it is only a bow.',
  art: 'Owl-Light', artNote: 'loose, and be gone from the place before the arrow lands: they never learn where it came from',
  // its forms, in order; the last is its signature. [name, what it is]
  forms: [['No Leaf Moves', 'the wait, so still that the wood forgets her'], ['Soft Wing', 'the loose that makes no sound, as an owl’s wing makes none'], ['Elsewhere', 'never twice from one tree: by the time they look, she is not there'], ['The Sun’s Shadow', 'the one arrow shot from the open, out of the sun: it was the first of the war']],
  finish: 'Ridge yew with its sapwood, black heart-oak, silver, a moonstone, white horn, green and grey silk, owl feather', ground: ['#2b4a42', '#08130f'], accent: '#57b383',
  len: 1740,
  box: [-884, 884, -212, 60], hero: [-884, 884, -272, 330],
  details: [{ t: 'The riser: heart-oak, silver, a moonstone', box: [-168, 202, -204, 62] }, { t: 'A horn ear: bridge, nock and sickle', box: [596, 884, -206, -8] }],
  plain: plainBow(), plainName: 'An ordinary longbow',
  draw(D) {
    const { S, F } = D, fine = D.lod >= 2, hung = !!D.unstrung, rr = D.r('bow');
    const lit = (F.vx[0] * LIGHT[0] + F.vx[1] * LIGHT[1]) <= 0 ? -1 : 1;             // which side of the bow the light falls on (−1: the belly)
    const C = splPts(both(hung ? SPRUNG : BRACED), false, 1, 10), n = C.length;
    const vAt = u => { let i = 1; while (i < n - 1 && C[i][0] < u) i++; const a = C[i - 1], b = C[i]; return lerp(a[1], b[1], clamp((u - a[0]) / ((b[0] - a[0]) || 1))); };
    const cut = (u0, u1) => { const o = [[u0, vAt(u0)]]; for (const p of C) if (p[0] > u0 && p[0] < u1) o.push(p); o.push([u1, vAt(u1)]); return o; };
    // across a stretch of the bow f runs from −1, the belly edge, to +1, the back edge
    const edge = (c, f, w = hw, add2 = 0) => offset(c, t => -f * w(c[Math.round(t * (c.length - 1))][0]) - Math.sign(f) * add2);
    const band = (c, f0, f1, w) => line(F, [...edge(c, f0, w), ...edge(c, f1, w).reverse()], true);
    // a rod along the bow, painted along its own curve so that it turns as a rod does however the limb bends
    const rod = (c, m, o = {}) => {
      const w = o.w || hw, wm = w((c[0][0] + c[c.length - 1][0]) / 2), run = (f, col, k, op) => S.stroke(line(F, edge(c, f, w)), col, wm * k, { units: 1, op, cap: 'butt' });
      return piece(D, [...edge(c, -1, w), ...edge(c, 1, w).reverse()], m, { t: 0, shade: 'none', layer: o.layer, inside: (d, P) => {
        if (o.under) o.under(d);
        run(-lit * .6, m.d, .66, .6); run(-lit * .97, m.r || m.s, .2, .5);                    // the far side, and the light the ground throws back on its edge
        run(lit * .38, m.l, .5, .62); run(lit * .5, m.hi, .13, .55);                         // the near side
        if (o.inside) o.inside(d, P);
      } });
    };

    // ---- the string: grey silk, served in green where the arrow sits and where it runs on the horn; owl-down to hush it
    if (!hung) {
      const ride = sg => { const q = sg > 0 ? cut(646, 824) : cut(-824, -646), e = edge(q, -1, hw, 1.7); return sg > 0 ? e : e.reverse(); };     // along the ear's belly, bridge to nock
      const up = ride(1), dn = ride(-1), a = dn[0], b = up[0], at = t => [lerp(a[0], b[0], t), lerp(a[1] - 6.4, b[1] - 6.4, t)];
      const whole = line(F, [...dn.slice().reverse(), at(0), at(1), ...up]);
      S.layer('top'); S.stroke(whole, '#23272b', 3.1, { units: 1 }); S.stroke(whole, '#c5cbcf', 2, { units: 1 }); if (fine) S.stroke(whole, '#ffffff', .55, { units: 1, op: .6, dash: '2 3' });
      for (const sd of [line(F, [at(.462), at(.552)]), line(F, [at(0), ...dn]), line(F, [at(1), ...up])]) { S.stroke(sd, '#102c1c', 4.4, { units: 1 }); S.stroke(sd, GREEN, 3.1, { units: 1 }); if (fine) S.stroke(sd, SILK.hi, .5, { units: 1, op: .5, dash: '1 1.6' }); }
      for (const t of [.16, .84]) { const p = at(t); if (fine) { const base = [[p[0] - 10, p[1]], [p[0] + 10, p[1]]]; S.fill(tufts(F, rr, base, 24, 17, { w: 2.4, lean: [0, -1], spread: 2.6 }) + tufts(F, rr, base, 24, 17, { w: 2.4, lean: [0, 1], spread: 2.6 }), DOWN, { op: .96 }); S.fill(tufts(F, rr, base, 9, 13, { w: 1.2, lean: [0, 1], spread: 3 }), BAR, { op: .55 }); } else S.fill(curve(F, disc(p, 10, 12, 10)), DOWN); }
    }

    // ---- the limbs: yew, the red heartwood to the belly and the pale sapwood left on the back; silver wire down each edge
    for (const sg of [-1, 1]) {
      const c = sg > 0 ? cut(118, 612) : cut(-612, -118);
      rod(c, YEW, { under: () => { S.fill(band(c, .26, 1.05), SAP.b, { op: .97 }); S.stroke(line(F, edge(c, .26)), '#7a4a1e', .6, { units: 1, op: .7 }); }, inside: () => {
        S.stroke(line(F, edge(c, -.8)) + line(F, edge(c, .82)), sv.l, fine ? .9 : 1.5, { units: 1, op: .9 });
        if (!fine) { S.fill(dots(F, [0, 1, 2, 3, 4, 5, 6].map(i => { const u = sg * (172 + i * 40); return [u, vAt(u) - 3]; }), 4.4), sv.l); return; }
        S.stroke(line(F, edge(c, -.8)) + line(F, edge(c, .82)), sv.k, .3, { units: 1, op: .5, tf: 'translate(.5 .6)' });
        // the grain of the yew
        let gr = ''; for (let j = 0; j < 7; j++) { const f = -.7 + rr() * .8, a = 130 + rr() * 280, b = Math.min(600, a + 120 + rr() * 300), q = cut(Math.min(sg * a, sg * b), Math.max(sg * a, sg * b)); gr += line(F, edge(q, f + .05 * Math.sin(j * 2.1))); }
        S.stroke(gr, YEW.d, .45, { units: 1, op: .4 });
        // the moons of a month in silver, from the thin moon by the grip to the full one, mid-limb
        for (let i = 0; i < 7; i++) {
          const u = sg * (172 + i * 40), v = vAt(u) - 3, r = 5.6, f = (i + 1) / 7, k = Math.abs(1 - 2 * f), a = F.W(u, v - r), b = F.W(u, v + r), rot = (Math.atan2(F.vx[1], F.vx[0]) * 180 / Math.PI).toFixed(1), n2 = x => x.toFixed(2);
          const full = curve(F, disc([u, v], r, r, 16)), ph = `M${n2(a[0])} ${n2(a[1])}A${r} ${r} ${rot} 0 ${sg > 0 ? 1 : 0} ${n2(b[0])} ${n2(b[1])}A${n2(r)} ${n2(Math.max(.05, r * k))} ${rot} 0 ${(f < .5) === (sg > 0) ? 0 : 1} ${n2(a[0])} ${n2(a[1])}Z`;
          S.fill(full, HORN.b, { op: .92 }); S.fill(ph, sv.l); S.stroke(full, sv.b, .7, { units: 1 }); S.stroke(full, sv.k, .25, { units: 1, op: .6 });
        }
        // beyond the full moon the silver runs on as a vine to the splice
        { const pts = []; for (let a = 440; a <= 588; a += 24.6) pts.push([sg * a, vAt(sg * a) - 2.6]); vineOn(S, F, sg > 0 ? pts : pts.reverse(), 5.4, sv, .65, { step: 15, leaf: .9, curl: .55 }); }
      } });
    }

    // ---- the ears: white horn spliced on under a silver collar, a bridge for the string, the nock cut to a sickle
    for (const sg of [-1, 1]) {
      const c = sg > 0 ? cut(600, 838) : cut(-838, -600), tip = c[sg > 0 ? c.length - 1 : 0], pre = c[sg > 0 ? c.length - 3 : 2], T = norm(sub(tip, pre)), N = [T[1] * sg, -T[0] * sg];   // N: toward the belly
      const at = (a, b) => [tip[0] + T[0] * a + N[0] * b, tip[1] + T[1] * a + N[1] * b];
      // the sickle beyond the nock, of a piece with the ear
      piece(D, [at(-6, 9), at(9, 10.4), at(25, 5.6), at(38, -7), at(46, -25), at(31, -15.5), at(17, -10.6), at(4, -9.4), at(-6, -9)], IVORY, { t: [.2, .9, 1, .9, 0, 1, 1, .8, .2], shade: 'none', inside: (d) => { S.fill(d, S.lin(F.W(...at(16, lit * -9)), F.W(...at(16, lit * 9)), [[0, IVORY.hi], [.4, IVORY.b], [1, IVORY.s]])); S.stroke(curve(F, [at(-2, 4), at(15, 4.6), at(29, -2.4), at(40, -17)], 1, false), IVORY.hi, 1.3, { units: 1, op: .85 }); } });
      rod(c, IVORY, { inside: () => {
        if (fine) { let st2 = ''; for (let j = 0; j < 4; j++) { const f = -.62 + j * .4; st2 += line(F, edge(cut(sg > 0 ? 630 + j * 14 : -822, sg > 0 ? 822 : -630 - j * 14), f)); } S.stroke(st2, IVORY.d, .45, { units: 1, op: .5 }); }
        S.stroke(line(F, [at(-13, 11), at(-10, 1)]), '#1c120a', 2, { units: 1, op: .9 });                                               // the nock
      } });
      // the bridge the string rides over, and the silver over the splice
      { const u = sg * 640, q = cut(u - 17, u + 17), e = edge(q, -1), m = e[Math.floor(e.length / 2)]; piece(D, [e[0], [m[0], m[1] - 8.6], e[e.length - 1]], HORN, { t: [.3, 1, .3], shade: 'none', inside: (d) => S.stroke(d, HORN.hi, 1.2, { units: 1, op: .5 }) }); }
      { const q = cut(sg * 604 - 7, sg * 604 + 7); piece(D, [...edge(q, -1.14), ...edge(q, 1.14).reverse()], sv, { t: 0, shade: 'none', inside: () => { S.fill(band(q, lit * .08, lit * .7), sv.hi, { op: .95 }); S.fill(band(q, -lit * .46, -lit * 1.14), sv.s, { op: .85 }); } });
        if (fine) for (const du of [-10.4, 10.4]) { const p = cut(sg * 604 + du - .5, sg * 604 + du + .5)[0]; beads(D, [-.74, -.25, .25, .74].map(f => [p[0], p[1] + f * hw(p[0])]), 1.5, sv); } }
    }

    // ---- the riser: black heart-oak carved to the hand, a scroll on each shoulder, edged and veined in silver
    {
      const o = u => vAt(u), sh = ([u, v]) => [u, v + o(u)];
      const out = [[-140, -19.4], [-114, -24.4], [-64, -27.6], [0, -23.6], [64, -27.6], [114, -24.4], [140, -19.4], [140, 19.4], [131, 27], [119, 37], [102, 43], [84, 41], [62, 34.6], [0, 29.2], [-62, 34.6], [-84, 41], [-102, 43], [-119, 37], [-131, 27], [-140, 19.4]].map(sh);
      piece(D, out, OAK, { t: [.3, 1, 1, 1, 1, 1, .3, .3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, .3], shade: 'none', inside: (d) => {
        S.fill(d, S.lin(F.W(0, lit * 36), F.W(0, -lit * 44), [[0, OAK.l], [.16, OAK.b], [.5, OAK.s], [.86, OAK.d], [1, OAK.s]]));
        // a long light where the carving turns to the light, and the hollow of the grip
        S.stroke(curve(F, [[-130, lit * 9], [-100, lit * 12], [-60, lit * 15], [0, lit * 12], [60, lit * 15], [100, lit * 12], [130, lit * 9]].map(sh), 1, false), OAK.l, 13, { units: 1, op: .5 });
        S.stroke(curve(F, [[-130, lit * 13], [-100, lit * 16.4], [-60, lit * 19.4], [0, lit * 16.2], [60, lit * 19.4], [100, lit * 16.4], [130, lit * 13]].map(sh), 1, false), OAK.hi, 1.8, { units: 1, op: .55 });
        // the carved border: a cut a little inside the edge, lit on its far lip
        if (fine) for (const sg of [-1, 1]) engrave(S, curve(F, [[sg * 61, -22], [sg * 86, -21.4], [sg * 112, -19.4], [sg * 132, -14], [sg * 133, 14], [sg * 124, 25.4], [sg * 113, 33.6], [sg * 101, 37.6], [sg * 86, 36], [sg * 70, 31.4], [sg * 61, 29.4]].map(sh), .9, false), OAK, .7, { col: '#000000', op: .8 });
        trim(S, d, sv, 1.25);
        if (!fine) return;
        for (const sg of [-1, 1]) {
          // the scroll cut into each shoulder, a bead of silver at its heart
          const sp = []; for (let j = 0; j <= 22; j++) { const a = j / 22 * Math.PI * 2.6, R = 8.6 * (1 - .82 * j / 22); sp.push(sh([sg * (104 - Math.cos(a) * R), 27.6 - Math.sin(a) * R * .92])); }
          engrave(S, curve(F, sp, 1, false), OAK, .8, { col: '#000000' }); inlay(S, curve(F, sp.slice(0, 12), 1, false), sv, .5, { op: .9 });
          beads(D, [sh([sg * 104.6, 27.4])], 1.6, sv);
        }
        // an oak leaf in silver wire on the lower block: the Oakborn's own
        { const lf = [[-66, 2], [-74, -6], [-80, -1.5], [-88, -9], [-94, -3], [-103, -8.4], [-108, -1], [-119, 1.6], [-108, 4.4], [-103, 12], [-94, 7], [-88, 13], [-80, 6], [-74, 10.4]].map(sh);
          inlay(S, curve(F, lf, .75), sv, .6); inlay(S, curve(F, [[-62, 2], [-90, 2.2], [-116, 1.6]].map(sh), 1, false) + line(F, [[-76, 2], [-82, -3.6]].map(sh)) + line(F, [[-76, 2], [-82, 7.6]].map(sh)) + line(F, [[-91, 2.2], [-97, -4.4]].map(sh)) + line(F, [[-91, 2.2], [-97, 8.6]].map(sh)), sv, .42); }
      } });
      // the binding: green silk, crossed with silver wire, between two silver ferrules
      const Tg = tube(F, [[-50, 30.4, 3.2 + o(-50)], [0, 26.4, 2.8 + o(0)], [50, 30.4, 3.2 + o(50)]]);
      piece(D, Tg.pts, SILK, { t: 0, shade: 'round', inside: () => { const w = winding(F, Tg, 3.3, 2); S.stroke(w, SILK.d, .9, { units: 1, op: .7 }); if (fine) S.stroke(w, SILK.hi, .4, { units: 1, op: .35, tf: 'translate(-.5 -.6)' }); const x = xwrap(F, Tg, 25, 24); inlay(S, x.a + x.b, sv, .95); } });
      for (const u of [-54, 54]) piece(D, [[u - 3.8, -30], [u + 3.8, -30], [u + 3.8, 36.6], [u - 3.8, 36.6]].map(sh), sv, { poly: .3, shade: 'cross', inside: () => { if (fine) S.stroke(line(F, [[u, -31], [u, 37.6]].map(sh)), sv.k, .4, { units: 1, op: .55 }); } });
      for (const u of [-133, 133]) piece(D, [[u - 3, -21.4], [u + 3, -21.4], [u + 3, 21.4], [u - 3, 21.4]].map(sh), sv, { poly: .3, shade: 'cross' });
      // the arrow's rest: a leaf of white horn on the belly, above the hand
      { const lf = [[62, -26.6], [75, -36], [95, -34.4], [110, -24.6], [94, -24], [76, -25.4]].map(sh), d = curve(F, lf, [.2, 1, 1, .2, 1, 1]); S.layer('over'); D.sil.push(d); S.fill(d, IVORY.b); S.fill(d, S.lin(F.W(70, -37), F.W(104, -23), [[0, IVORY.hi], [.5, IVORY.b], [1, IVORY.s]])); S.stroke(d, IVORY.k, .8); S.stroke(line(F, [[65, -26.4], [107, -25]].map(sh)), IVORY.k, .5, { op: .6 }); }
      // the moonstone on the upper block, held in a sickle of silver
      { const c = sh([90, 4.4]); S.layer('over'); const d = line(F, sickle([c[0] + 1, c[1]], 13.4, 0), true); S.fill(d, sv.b); S.fill(d, S.lin(add(F.W(...c), mul(LIGHT, 13)), add(F.W(...c), mul(LIGHT, -13)), [[0, sv.hi], [.45, sv.b], [1, sv.d]])); S.stroke(d, sv.k, .7);
        cabochon(D, [c[0] + 1.8, c[1]], 6.8, MOON, sv, { shadow: false }); glint(D, add(F.W(c[0] + 1.8, c[1]), mul(LIGHT, 3.4)), 6); }
    }

    // ---- hung in the grove: the pegs it rests on, its string coiled at the grip, its quiver on the next peg
    if (hung) {
      for (const [u, v] of [[-153, 32 + vAt(-153)], [338, vAt(338) - hw(338) - 8.5], [520, 150]]) { const d = curve(F, disc([u, v], 8.5, 8.5, 14)); S.layer('under'); S.fill(d, WOOD.oak.s); S.stroke(d, WOOD.oak.k, 1); S.fill(curve(F, disc([u + 2, v - 2], 3.6, 3.6, 10)), WOOD.oak.l, { op: .8 }); }
      { S.layer('over'); const h = (k, w) => curve(F, [[-56, -29], [-100, -36 - w], [-156, -32 - k], [-198, -29], [-156, -25 + k], [-100, -23 + w]], 1, true), d = h(8, 3) + h(3.4, 0); S.stroke(d, '#23272b', 3.1, { units: 1 }); S.stroke(d, '#c5cbcf', 2, { units: 1 }); const b = line(F, [[-76, -37], [-76, -22]]); S.stroke(b, '#102c1c', 6.4, { units: 1 }); S.stroke(b, GREEN, 4.6, { units: 1 }); }
      quiver(D, -292, 150, { strap: [520, 150] });
    } else if (fine && !D.flat) {
      // on its plate: one of its arrows, and the quiver they live in
      arrow(D, -150, -242, 836);
      quiver(D, -742, 208, { laid: true });
    }
    if (!hung) glint(D, F.W(866, vAt(838) - 18), 7, { a: .3 });
  },
};

// ---------------------------------------------------------------- its arrows -------------------------------------------
const SHAFT = stuff('#d8c7a0', { k: '#4a3a1c' });
// the three vanes of an arrow as two that show: barred owl feather, cut long and low. (u, v): the shaft at the vane's foot
function vanes(D, u, v, L, h) {
  const { S, F } = D;
  for (const sg of [-1, 1]) {
    const pts = [[u, v + sg * .8], [u + L * .16, v + sg * h], [u + L * .86, v + sg * h * .92], [u + L, v + sg * .8]], d = curve(F, pts, [.2, .8, .7, .2]);
    S.fill(d, sg < 0 ? DOWN : '#d9d0bd'); let b = ''; for (let i = 1; i < 7; i++) { const a = u + L * (i / 7.4); b += line(F, [[a, v + sg * 1.2], [a + L * .06, v + sg * h * .93]]); } S.stroke(b, BAR, 1.5, { units: 1, op: .75 });
    S.stroke(d, '#5b4c38', .6, { op: .9 });
  }
}
// one arrow, nock at (u, v), point toward +u
function arrow(D, u, v, L) {
  const { S, F } = D, st = MET.bright;
  S.layer('main'); const sh = line(F, [[u + 8, v - 3.6], [u + L - 74, v - 3.6], [u + L - 74, v + 3.6], [u + 8, v + 3.6]], true); D.sil.push(sh);
  S.fill(sh, SHAFT.b); S.fill(line(F, [[u + 8, v + .8], [u + L - 74, v + .8], [u + L - 74, v + 3.6], [u + 8, v + 3.6]], true), SHAFT.s, { op: .85 }); S.stroke(line(F, [[u + 8, v - 2.2], [u + L - 74, v - 2.2]]), SHAFT.hi, .8, { units: 1, op: .7 }); S.stroke(sh, SHAFT.k, .7);
  // crest: green, silver, green
  for (const [a, b, c] of [[150, 166, GREEN], [168, 173, sv.l], [175, 181, GREEN], [20, 26, GREEN]]) S.fill(line(F, [[u + a, v - 3.8], [u + b, v - 3.8], [u + b, v + 3.8], [u + a, v + 3.8]], true), c);
  vanes(D, u + 30, v, 112, 13.5);
  piece(D, [[u, v - 4.4], [u + 9, v - 4.4], [u + 9, v + 4.4], [u, v + 4.4], [u + 3.4, v]], HORN, { poly: .15, shade: 'none', shadow: false });
  // the head: a long leaf of bright steel in a silver socket
  piece(D, [[u + L - 84, v - 4.6], [u + L - 60, v - 5.2], [u + L - 60, v + 5.2], [u + L - 84, v + 4.6]], sv, { poly: .2, shade: 'cross', shadow: false });
  piece(D, [[u + L - 62, v - 4], [u + L - 46, v - 11.5], [u + L - 22, v - 7], [u + L, v], [u + L - 22, v + 7], [u + L - 46, v + 11.5], [u + L - 62, v + 4]], st, { t: [.2, .9, .9, 0, .9, .9, .2], shade: 'none', shadow: false, inside: () => {
    S.fill(line(F, [[u + L - 62, v], [u + L, v], [u + L - 22, v - 7.6], [u + L - 46, v - 12], [u + L - 62, v - 4]], true), st.l); S.fill(line(F, [[u + L - 62, v], [u + L, v], [u + L - 22, v + 7.6], [u + L - 46, v + 12], [u + L - 62, v + 4]], true), st.s); S.stroke(line(F, [[u + L - 60, v], [u + L - 2, v]]), st.hi, .8, { units: 1 }); } });
}
// the quiver: foot at (u, v), mouth toward +u. Dark green leather, silver at mouth, girdle and foot, a sickle moon over a
// vine in silver thread, seven arrows. o.strap: [u, v] of the peg it hangs from · o.laid: on a plate, its strap in a loop
function quiver(D, u, v, o = {}) {
  const { S, F } = D, fine = D.lod >= 2, L = 556, w0 = 33, w1 = 45, x = a => u + a, r = D.r('quiver');
  const lit = (F.vx[0] * LIGHT[0] + F.vx[1] * LIGHT[1]) <= 0 ? -1 : 1;
  // the strap
  { S.layer('under'); const st = o.strap ? curve(F, [[x(L - 40), v - w1 + 2], [lerp(x(L), o.strap[0], .6), v - w1 * .5], o.strap, [lerp(x(L), o.strap[0], .6), v + w1 * .5], [x(L - 40), v + w1 - 2]], [.3, .6, 0, .6, .3], false)
      : curve(F, [[x(L - 34), v + w1 - 4], [x(L - 90), v + w1 + 44], [x(250), v + w1 + 62], [x(120), v + w0 + 40], [x(150), v + w0 - 2]], 1, false);
    D.sil.push(st); S.stroke(st, QUIV.k, 9.5, { units: 1 }); S.stroke(st, mixc(QUIV.b, '#3a2a1c', .5), 7.4, { units: 1 }); S.stroke(st, QUIV.hi, .8, { units: 1, op: .35, dash: '3 4' }); }
  // its arrows: shafts and owl feather above the mouth
  S.layer('main');
  for (let i = 0; i < 7; i++) { const k = (i - 3) / 3, a = L - 12, vv = v + k * (w1 - 9), up = 150 + (1 - Math.abs(k)) * 46 + (r() - .5) * 18, sl = k * 26;
    const p0 = [x(a), vv], p1 = [x(a + up), vv + sl], d = line(F, [p0, p1]); S.stroke(d, SHAFT.k, 5.4, { units: 1 }); S.stroke(d, SHAFT.b, 4, { units: 1 });
    // vanes along the leaning shaft
    const T = norm(sub(p1, p0)), N = [-T[1], T[0]], at = (q, h) => [p0[0] + T[0] * q + N[0] * h, p0[1] + T[1] * q + N[1] * h], f0 = up - 118;
    for (const sg of [-1, 1]) { const vd = curve(F, [at(f0, sg * .8), at(f0 + 18, sg * 12.5), at(f0 + 96, sg * 11.5), at(f0 + 110, sg * .8)], [.2, .8, .7, .2]); D.sil.push(vd); S.fill(vd, sg < 0 ? DOWN : '#d9d0bd'); if (fine) { let b = ''; for (let j = 1; j < 6; j++) b += line(F, [at(f0 + j * 17, sg * 1.2), at(f0 + j * 17 + 6, sg * 11.4)]); S.stroke(b, BAR, 1.5, { units: 1, op: .75 }); } S.stroke(vd, '#5b4c38', .6, { op: .9 }); }
    S.fill(line(F, [at(up - 6, -4), at(up + 3, -4), at(up + 3, 4), at(up - 6, 4)], true), HORN.b);
  }
  // the body
  const body = [[x(0), v - w0], [x(L * .5), v - lerp(w0, w1, .56)], [x(L), v - w1], [x(L), v + w1], [x(L * .5), v + lerp(w0, w1, .56)], [x(0), v + w0], [x(-16), v]];
  piece(D, body, QUIV, { t: [.5, 1, .2, .2, 1, .5, 1], shade: 'none', inside: (d) => {
    S.fill(d, S.lin(F.W(x(L / 2), v + lit * w1), F.W(x(L / 2), v - lit * w1), [[0, QUIV.s], [.16, QUIV.b], [.3, QUIV.l], [.44, QUIV.b], [.78, QUIV.s], [1, QUIV.d]]));
    if (fine) {
      // stitching down the seam, and tooling: a sickle moon over a vine, in silver thread
      S.stroke(line(F, [[x(14), v - lit * (w0 - 7)], [x(L - 20), v - lit * (w1 - 8)]]), QUIV.hi, .7, { units: 1, op: .5, dash: '3 2.4' });
      const md = line(F, sickle([x(L * .66), v], 21, -Math.PI / 2 * lit, .5, 1.6), true); S.fill(md, sv.b, { op: .95 }); S.stroke(md, sv.k, .5, { op: .8 });
      vineOn(S, F, [[x(96), v], [x(200), v + 5], [x(296), v - 3]], 9, sv, .7, { step: 30, leaf: 1.1, curl: .6 });
    } else S.fill(curve(F, disc([x(L * .66), v], 15, 15, 12)), sv.b, { op: .9 });
  } });
  // silver: the mouth, the girdle, the foot
  const ring = (a, b, wa, wb) => piece(D, [[x(a), v - wa], [x(b), v - wb], [x(b), v + wb], [x(a), v + wa]], sv, { poly: .12, shade: 'cross', shadow: false, inside: () => { if (fine) S.stroke(line(F, [[x((a + b) / 2), v - wa - 1], [x((a + b) / 2), v + wa + 1]]), sv.k, .45, { units: 1, op: .6 }); } });
  ring(L - 15, L + 3, w1 + 1.6, w1 + 2.6); ring(L * .36, L * .36 + 10, lerp(w0, w1, .4) + 1.4, lerp(w0, w1, .42) + 1.4);
  piece(D, [[x(58), v - w0 - 5], [x(0), v - w0 - .6], [x(-19), v], [x(0), v + w0 + .6], [x(58), v + w0 + 5], [x(40), v]], sv, { t: [.3, .8, 1, .8, .3, .9], shade: 'cross', shadow: false });
  if (fine) beads(D, [-.7, -.35, 0, .35, .7].map(k => [x(L - 6), v + k * w1]), 1.7, sv);
}
