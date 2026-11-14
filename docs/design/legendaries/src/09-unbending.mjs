// IX · THE UNBENDING · longbow · Queen Maerith's bow (Kingdom of Sylvaran).
// Elf work of the Evenwood: one stave of ridge yew, its pale sapwood left on the back; silver let into the limbs as fine
// as leaf-veins; tips of horn carved like buds; green silk on the grip. Nothing on it is straight or square.
import { MET, WOOD, HORN, stuff, piece, tube, disc, curve, line, inlay, engrave, ridge, beads, dots, puff, glint, cabochon, winding, xwrap, vineOn, arcFrame, mixc, lerp, spl, LIGHT, add, mul } from './fine.mjs';
import { plainBow } from './plain.mjs';

const GREEN = '#2f6b47', YEW = stuff('#9c5a2c', { k: '#2a1206' }), SAP = WOOD.yewSap;

export default {
  id: 'unbending', no: 'IX', name: 'The Unbending', cat: 'Longbow', form: 'bow.long', deg: -62, upright: -90,
  realm: 'Kingdom of Sylvaran', people: 'The elves of the Evenwood; the Oakborn line',
  owner: 'The Oakborn, the ruling blood of Sylvaran. It is an heirloom of the queens and not of the crown.',
  wielder: 'No one. It hangs unstrung in the queen’s grove at Evenglade. Queen Ithrien’s left hand is still, and cannot hold a bow.',
  why: 'It goes to the Oakborn heir, and the only other of the blood is Thalion Halfleaf: an archer, and barred from the crown by law because he is half-elven. To hand him the bow is to name him. The Moot of Leaves has voted on it four times.',
  made: 'Cut on the Yew Ridges and worked at Evenglade about 250 BR for Maerith, then a queen’s daughter of fourteen. Some 1,350 years old.',
  legend: ['In 291 Queen Maerith loosed the first arrow of the War of the Forest Edge with it, and said of the Solen army: let them bring their sun; we will be its shadow.',
    'They called her the Unbending, and the bow has her name. In seven hundred years three archers have strung it. None was let keep it.'],
  hand: 'It draws like a ship’s cable and wants years before it can be drawn true. Drawn true, it puts a war arrow through a shield at two hundred paces, and faster than a bow has any right to. The arrow still has to find its man: a moving rider, a wall or a wind, and it is only a bow.',
  art: 'The Sun’s Shadow', artNote: 'loose, move twenty paces, loose again: they never learn where it came from',
  finish: 'Ridge yew with its sapwood, silver inlay, carved horn, green silk, two small emeralds', ground: ['#2f4a38', '#0b1610'], accent: '#57b383',
  len: 1990,
  box: [-990, 1010, -206, 34],
  details: [{ t: 'The grip and the first leaves', box: [-112, 250, -100, 60] }, { t: 'A bud of horn: the upper nock', box: [892, 1010, -218, -136] }],
  plain: plainBow(), plainName: 'An ordinary longbow',
  draw(D) {
    const { S, F } = D, sv = MET.silver, fine = D.lod >= 2, r = D.r('bow'), A = arcFrame(F, D.unstrung ? 16000 : 2700), DA = { ...D, F: A };
    const hw = s => { const a = Math.abs(s); return a < 80 ? 15.6 : lerp(15, 6.4, Math.min(1, (a - 80) / 880) ** 1.25); };
    // ---- the string: grey silk, served in green where the arrow sits and where it loops the nocks
    if (!D.unstrung) { const a = A.W(-962, -3), b = A.W(982, -3), d = `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`; S.layer('under'); D.sil.push(d);
      S.stroke(d, '#2b2f33', 2.6, { units: 1 }); S.stroke(d, '#c9cfd2', 1.7, { units: 1 }); S.stroke(d, '#ffffff', .5, { units: 1, op: .6, dash: '2 3' });
      const m = [lerp(a[0], b[0], .492), lerp(a[1], b[1], .492)], n = [lerp(a[0], b[0], .53), lerp(a[1], b[1], .53)], sd = `M${m[0].toFixed(1)} ${m[1].toFixed(1)}L${n[0].toFixed(1)} ${n[1].toFixed(1)}`; S.stroke(sd, '#12301f', 3.4, { units: 1 }); S.stroke(sd, GREEN, 2.4, { units: 1 }); }
    // ---- the stave: heartwood to the belly, a hand of pale sapwood down the back
    const st = []; for (let s = -962; s <= 982; s += 54) st.push([s, hw(s)]); st.push([982, hw(982)]);
    const T = tube(A, st, { t: .9 });
    piece(DA, T.pts, YEW, { t: 0, shade: 'round', inside: (d) => {
      const back = []; for (const [s, w] of st) back.push([s, w * .34]); S.fill(line(A, [...st.map(p => [p[0], p[1] + 1]), ...back.reverse()], true), SAP.b, { op: .96 });
      S.stroke(line(A, st.map(p => [p[0], p[1] * .34])), '#7a4a1e', .5, { units: 1, op: .7 });
      if (fine) { let gr = ''; const rr = D.r('grain'); for (let j = 0; j < 9; j++) { const t0 = -1 + rr() * 1.3, a = -940 + rr() * 900, b = a + 300 + rr() * 700, pts = []; for (let s = a; s <= Math.min(b, 960); s += 40) pts.push([s, hw(s) * (t0 + Math.sin(s * .013 + j) * .05)]); if (pts.length > 1) gr += spl(A.P(pts)); } S.stroke(gr, YEW.d, .45, { units: 1, op: .45 }); }
      // silver, fine as leaf-veins, climbing both limbs from the grip
      for (const sg of [-1, 1]) { const pts = []; for (let s = 84; s <= 520; s += 44) pts.push([sg * s, -hw(s) * .3 + Math.sin(s * .04) * 1.2]); vineOn(S, A, pts, 4.6, sv, .55, { step: 15, leaf: .95, curl: .55 }); if (fine) { const br = []; for (let s = 540; s <= 700; s += 40) br.push([sg * s, -hw(s) * .3]); inlay(S, spl(A.P([[sg * 520, -hw(520) * .3], ...br])), sv, .4); S.fill(dots(A, br, .9), sv.b); } }
      // the long light down the belly
      S.stroke(line(A, st.map(p => [p[0], -p[1] * .62])), '#ffd9a8', 1.2, { units: 1, op: .32 });
    } });
    // ---- the grip: green silk, bound across with silver wire; a silver leaf for the arrow to lie on; an emerald at each end
    const Tg = tube(A, [[-62, 16.8], [0, 17.4], [62, 16.8]]), silk = stuff(GREEN, { k: '#0b1d12' });
    piece(DA, Tg.pts, silk, { t: 0, shade: 'round', inside: () => { const w = winding(A, Tg, 3.2, 2); S.stroke(w, silk.d, .9, { units: 1, op: .7 }); S.stroke(w, silk.hi, .4, { units: 1, op: .35, tf: 'translate(-.5 -.6)' }); const x = xwrap(A, Tg, 22, 20); inlay(S, x.a + x.b, sv, .8); } });
    for (const s of [-66, 66]) { piece(DA, [[s - 5, -17.8], [s + 5, -17.8], [s + 5, 17.8], [s - 5, 17.8]], sv, { poly: .3, inside: () => { if (fine) engrave(S, line(A, [[s - 1.6, -19], [s - 1.6, 19]]) + line(A, [[s + 1.6, -19], [s + 1.6, 19]]), sv, .35); } }); cabochon(DA, [s, -2], 2.6, '#1f8a52', sv, { shadow: false }); }
    { const leaf = [[74, -15], [86, -22], [104, -20.5], [116, -15], [102, -13.4], [86, -13.6]], d = spl(A.P(leaf), true, [.2, 1, 1, .2, 1, 1]); S.layer('over'); S.fill(d, sv.b); S.fill(d, S.lin(A.W(80, -22), A.W(110, -13), [[0, sv.hi], [.5, sv.b], [1, sv.s]])); S.stroke(d, sv.k, .8); S.stroke(line(A, [[76, -15.4], [114, -15.4]]), sv.k, .5, { op: .7 }); }
    // ---- the nocks: dark horn carved like a bud about to open, in a sleeve of silver
    for (const sg of [-1, 1]) {
      const e = sg > 0 ? 982 : -962, o = s => e + sg * s;
      piece(DA, [[o(-22), -6.8], [o(-4), -7.6], [o(12), -5.4], [o(24), -1], [o(27), 3.6], [o(20), 5], [o(10), 3.4], [o(-4), 6.6], [o(-22), 6.8]], HORN, { t: [.2, .9, 1, 1, .6, .7, .9, .9, .2], shade: 'round', inside: () => {
        S.stroke(spl(A.P([[o(-18), 0], [o(0), -1.6], [o(14), -1], [o(23), 2.6]])), HORN.hi, .7, { units: 1, op: .6 }); S.stroke(spl(A.P([[o(-16), 3.6], [o(0), 3], [o(11), 1.2]])), HORN.k, .6, { units: 1, op: .8 });
        S.stroke(line(A, [[o(2), -8.4], [o(2), -2.4]]), '#000000', 1.3, { units: 1, op: .8 });
      } });
      piece(DA, [[o(-28), -7.6], [o(-19), -7.6], [o(-19), 7.6], [o(-28), 7.6]], sv, { poly: .3 });
    }
    glint(D, add(A.W(66, -2), mul(LIGHT, 1.5)), 5); glint(D, A.W(430, -hw(430) * .6), 7, { a: .3 });
  },
};
