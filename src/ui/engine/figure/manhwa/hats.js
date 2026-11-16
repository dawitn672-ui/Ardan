// The manhwa layer · what is worn on the head. A people's headwear is the first thing that tells it apart (hood and
// kerchief in the cold north, turban, headcloth and veil against the desert sun, felt and fur on the steppe, the tall
// wrap of the south), and a station's is the second (a rag, a straw hat, a cap, a jewelled turban, a helm, a crown).
// No two peoples share a helm or a crown (owner orders 56 and 58).
import { clamp, lerp, mixc, n1, splPts, add, sub, mul, norm, perp } from '../g.js';
import { cloth } from '../palette.js';
import { pt, P, PZ, blob, curve, sliver, elli, circ, tube, cel, rect } from './ink.js';
import { met, glint, fur } from './wear.js';

// how much of the hair a hat hides: 0 none, 1 the crown (no fringe shows), 2 all of it
export const COVER = { hood: 0, kerchief: 1, cap: 1, straw: 1, furhat: 1, cone: 1, turban: 1, headcloth: 2, veil: 1, wrap: 1, fillet: 0, circlet: 0, skullcap: 1, rag: 0, spangen: 2, turbanhelm: 2, steppehelm: 1, hidecap: 1, beadcrown: 1, khanhat: 1, ironcrown: 0, sultan: 1, cowl: 0, shaman: 1, feathers: 0, coif: 2, band: 0, kettle: 1, wimple: 2 };
export const BROW = { hood: -15, kerchief: -22, cap: -23, straw: -12, furhat: -20, cone: -22, turban: -21, headcloth: -20, veil: -21, wrap: -23, skullcap: -27, spangen: -16, turbanhelm: -17, steppehelm: -18, hidecap: -22, beadcrown: -18, khanhat: -19, sultan: -20, cowl: -13, shaman: -18, coif: -22, kettle: -14, wimple: -22 };

const gem = (S, x, y, r, c, m) => { S.both(circ(x, y, r + 1.3), m.b, m.k, .8); S.both(circ(x, y, r), c, m.k, .5); S.fill(circ(x - r * .35, y - r * .35, r * .32), '#ffffff', .9); };
// a plume: feathers fanned from a root
const plume = (S, x, y, n, len, c, o = {}) => { const col = cloth(c); for (let i = 0; i < n; i++) { const a = (o.a ?? -Math.PI / 2) + (i - (n - 1) / 2) * (o.spread ?? .28), tip = [x + Math.cos(a) * len * (1 - Math.abs(i - (n - 1) / 2) * .08), y + Math.sin(a) * len], mid = [(x + tip[0]) / 2 + Math.cos(a + 1.57) * 3, (y + tip[1]) / 2 + Math.sin(a + 1.57) * 3]; S.both(sliver([[x, y], mid, tip], o.w || 6, { at: .6 }), i % 2 ? col.b : col.l, col.k, .7); S.pen([[x, y], mid, tip], .6, col.k, { op: .6 }); } };

export function drawHat(S, Hd, hat, pass, ctx = {}) {
  if (!hat) return;
  const { hp, w, y0, cx, yaw } = Hd, k = hat.kind, c = hat.c ? cloth(hat.c) : null, pal = c ? cel(c) : null, F = ctx.F, top = -47.5;
  const H = (x, y) => hp(x, y), trimP = hat.trim ? cloth(hat.trim.c) : null;
  if (pass === 'back') {
    if (k === 'hood' || k === 'cowl') S.form(blob([H(-w - 9, 6), H(-w - 11, -26), H(-18, -58), H(8, -63), H(w + 6, -40), H(w + 11, -6), [cx + w + 16, F.yS + 4], [cx - w - 16, F.yS + 4]], .95), { b: c.d, s: c.d, k: c.k, rim: c.l }, { flat: true });
    if (k === 'veil' || k === 'headcloth' || k === 'wimple') S.form(blob([H(-w - 6, -30), H(0, -56), H(w + 6, -30), [cx + w + (k === 'headcloth' ? 22 : 14), F.yS + (k === 'wimple' ? 6 : 34)], [cx + w + 6, F.yS + (hat.long ? 110 : 56)], [cx - w - 6, F.yS + (hat.long ? 110 : 56)], [cx - w - (k === 'headcloth' ? 22 : 14), F.yS + (k === 'wimple' ? 6 : 34)]], .9), { b: c.s, s: c.d, k: c.k, rim: c.l }, { sh: 1.5 });
    if (k === 'spangen' || k === 'turbanhelm' || k === 'coif') { // the mail that hangs from the helm to the shoulders
      const m = met('iron'), t = S.tile(5, 4.4, `<path d="M0 2.2a2.5 2.2 0 0 0 5 0" fill="none" stroke="${m.k}" stroke-width=".8" opacity=".75"/><path d="M-2.5 0a2.5 2.2 0 0 0 5 0" fill="none" stroke="${m.l}" stroke-width=".5" opacity=".7"/>`);
      S.form(blob([H(-w - 3, -14), H(w + 3, -14), [cx + w + 12, F.yS - 2], [cx + w + 4, F.yS + 14], [cx - w - 4, F.yS + 14], [cx - w - 12, F.yS - 2]], .8), { b: m.s, s: m.d, k: m.k, rim: m.l }, { in: s => s.fill(rect(0, 0, 300, 520), t) });
    }
    if (k === 'khanhat' || k === 'steppehelm') for (const sg of [-1, 1]) { const a = H(sg * (w + 1), -16); S.form(blob([[a[0] - 6, a[1]], [a[0] + 6, a[1]], [a[0] + sg * 5 + 6, a[1] + 40], [a[0] + sg * 5, a[1] + 48], [a[0] + sg * 5 - 6, a[1] + 40]], .8), k === 'khanhat' ? cel(cloth(hat.flap || 'crimson')) : cel(cloth('brown')), {}); }
    return;
  }
  const dome = (y1, up, g = 2, o = {}) => blob([H(-w - g, y1), H(-w - g + 1, y1 - 14), H(-w * .7, top - up * .55), H(0, top - up), H(w * .7, top - up * .55), H(w + g - 1, y1 - 14), H(w + g, y1), H(w * .5, y1 + (o.dip ?? 4)), H(0, y1 + (o.dip ?? 4) + 1.5), H(-w * .5, y1 + (o.dip ?? 4))], [.4, 1, 1, 1, 1, 1, .4, 1, 1, 1]);
  const bandLine = (y1, g = 2, dip = 4) => [H(-w - g, y1 - 1), H(-w * .5, y1 + dip - 1), H(0, y1 + dip + .5), H(w * .5, y1 + dip - 1), H(w + g, y1 - 1)];
  if (k === 'hood' || k === 'cowl') {
    // a hood up: the face in its opening, the cape of it on the shoulders (a monk's cowl is the same, deeper)
    const deep = k === 'cowl' ? 4 : 0, ring = [H(0, -62 - deep), H(w * .8, -55), H(w + 10, -26), H(w + 11, 8), [cx + w + 8, F.yS - 6], [cx + 20, F.yS + 2], H(w - 5, 26), H(w - 3.5, -6), H(w - 9, -27 + deep), H(0, -37 + deep * 1.4), H(-w + 9, -27 + deep), H(-w + 3.5, -6), H(-w + 5, 26), [cx - 20, F.yS + 2], [cx - w - 8, F.yS - 6], H(-w - 11, 8), H(-w - 10, -26), H(-w * .8, -55)];
    S.form(blob(ring, .9), pal, { in: s => { const q = mixc(pal.s, pal.k, .45); s.pen([H(-w - 4, -30), H(-w - 5, 0), H(-w - 2, 30)], 1.5, q, { op: .7 }); s.pen([H(w + 4, -30), H(w + 5, 0), H(w + 2, 30)], 1.5, q, { op: .7 }); s.pen([H(-10, -58), H(-20, -42), H(-w + 4, -22)], 1.2, q, { op: .5 });
      if (trimP) s.band([H(-w + 4, 24), H(-w + 3, -6), H(-w + 9, -28 + deep), H(0, -38 + deep * 1.4), H(w - 9, -28 + deep), H(w - 3, -6), H(w - 4, 24)], 3.6, trimP, hat.trim.motif, trimP.l, { edge: false }); } });
    return;
  }
  if (k === 'kerchief' || k === 'coif') {
    // a cloth tied over the hair (women of the north and the east; a linen coif under a helm)
    S.form(dome(-21, 5, 3, { dip: 5 }), pal, { in: s => { const q = mixc(pal.s, pal.k, .45); s.pen([H(-w, -26), H(-12, -46), H(8, -50)], 1.4, q, { op: .6 }); s.pen([H(w - 2, -24), H(w * .5, -42), H(0, -48)], 1.2, q, { op: .5 }); if (trimP) s.band(bandLine(-21, 3, 5).map(p => [p[0], p[1] - 3.4]), 4.6, trimP, hat.trim.motif, trimP.l); if (hat.pat) s.fill(rect(0, 0, 300, 300), hat.pat(s)); } });
    for (const sg of [-1, 1]) S.form(blob([H(sg * (w + 2), -24), H(sg * (w + 5), -2), H(sg * (w + 1), k === 'coif' ? 30 : 16), H(sg * (w - 6), k === 'coif' ? 34 : 6), H(sg * (w - 3), -20)], .9), pal, {});
    if (k === 'kerchief' && hat.knot !== false) { const a = H(-Math.sign(yaw || 1) * (w + 3), 8); S.form(blob([[a[0] - 5, a[1] - 3], [a[0] + 5, a[1] - 4], [a[0] + 9, a[1] + 16], [a[0] - 1, a[1] + 22], [a[0] - 8, a[1] + 12]], .9), pal, {}); }
    return;
  }
  if (k === 'wimple') { // linen round the face and under the chin, a veil over it (a northern nun, a widow)
    const ch = Hd.chin, ring = [H(0, -57), H(w * .75, -51), H(w + 6, -26), H(w + 7, 10), [cx + w + 2, F.yS - 4], [cx + 16, F.yS + 6], [cx - 16, F.yS + 6], [cx - w - 2, F.yS - 4], H(-w - 7, 10), H(-w - 6, -26), H(-w * .75, -51), H(0, -57),
      H(0, -30), H(-w + 9, -25), H(-w + 3.5, -6), H(-w + 6, 20), H(-10, ch + 1), H(0, ch + 3.5), H(10, ch + 1), H(w - 6, 20), H(w - 3.5, -6), H(w - 9, -25), H(0, -30)];
    S.form(blob(ring.slice(0, 11), .9) + blob(ring.slice(12, 22), .9), pal, { in: s => { const q = mixc(pal.s, pal.k, .45); s.pen([H(-w - 2, -24), H(-w - 3, 4), [cx - w + 4, F.yS - 6]], 1.4, q, { op: .6 }); s.pen([H(w + 2, -24), H(w + 3, 4), [cx + w - 4, F.yS - 6]], 1.4, q, { op: .6 }); s.pen([H(-12, ch + 6), [cx - 12, F.yS]], 1.2, q, { op: .6 }); s.pen([H(12, ch + 6), [cx + 12, F.yS]], 1.2, q, { op: .6 }); s.pen([H(-w + 5, -27), H(0, -33), H(w - 5, -27)], 1.2, q, { op: .5 }); } });
    return;
  }
  if (k === 'rag') { const d = sliver([H(-w - 2, -23), H(0, -30), H(w + 2, -23)], 8, { flat: 1 }); S.form(d, pal, {}); const a = H(-Math.sign(yaw || 1) * (w + 2), -22); S.form(blob([[a[0] - 3, a[1] - 3], [a[0] + 4, a[1] - 2], [a[0] + 7, a[1] + 14], [a[0] - 5, a[1] + 12]], .8), pal, {}); return; }
  if (k === 'band' || k === 'fillet' || k === 'circlet') {
    const m = hat.m ? met(hat.m) : null, line = [H(-w - 1.5, -22), H(-w * .5, -28.5), H(0, -30), H(w * .5, -28.5), H(w + 1.5, -22)];
    if (m) { S.line(curve(line), m.k, (hat.w || 4) + 1.5); S.line(curve(line), m.b, hat.w || 4); S.line(curve(line.slice(0, 3).map(p => [p[0], p[1] - 1])), m.hi, .9, .9); if (hat.gem) { const g = H(0, -30); gem(S, g[0], g[1], 2.6, hat.gem, m); } if (hat.drops) { let d = ''; for (const x of [-16, -8, 8, 16]) { const p = H(x, -27.5 + Math.abs(x) * .08); d += circ(p[0], p[1] + 4.5, 1.5); } S.both(d, hat.drops, m.k, .5); } }
    else S.band(line, hat.w || 5, c, hat.motif, hat.c2 || c.l);
    return;
  }
  if (k === 'cap' || k === 'skullcap') {
    const up = k === 'skullcap' ? 1.5 : hat.up ?? 5, y1 = k === 'skullcap' ? -30 : -24;
    S.form(dome(y1, up, 1.5, { dip: 3 }), pal, { in: s => { const q = mixc(pal.s, pal.k, .45); if (hat.seams) for (const x of [-18, 0, 18]) s.pen([H(x * .2, top - up), H(x, -38), H(x * 1.2, y1 + 2)], 1, q, { op: .6 }); if (trimP) s.band(bandLine(y1, 1.5, 3).map(p => [p[0], p[1] - 3.2]), hat.trim.w || 5, trimP, hat.trim.motif, hat.trim.c2 || trimP.l); } });
    if (hat.brim) S.form(sliver([H(-w - 5, y1 + 1), H(0, y1 + 6), H(w + 5, y1 + 1)], 6, { flat: 1 }), cel(cloth(hat.brim)), {});
    if (hat.feather) { const a = H(Math.sign(yaw || 1) * -w * .6, y1 - 6); plume(S, a[0], a[1], 1, 24, hat.feather, { a: -1.9, w: 5 }); }
    if (hat.button) { const b = H(0, top - up); S.both(circ(b[0], b[1] - 1, 2.4), hat.button, pal.k, .7); }
    return;
  }
  if (k === 'straw') { const st = cloth('#d9b860'), sp = cel(st); S.form(dome(-26, 6, 0, { dip: 2 }), sp, { in: s => { let t = ''; for (let i = 0; i < 7; i++) { const a = H(lerp(-w, w, i / 6), -27), b = H(lerp(-w, w, i / 6) * .3, -52); t += P([a, b]); } s.line(t, st.d, .7, .6); } });
    S.form(elliRing(H(0, -24), w + 26, 9), sp, { in: s => { let t = ''; const c0 = H(0, -24); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; t += `M${n1(c0[0] + Math.cos(a) * (w - 2))} ${n1(c0[1] + Math.sin(a) * 4)}L${n1(c0[0] + Math.cos(a) * (w + 26))} ${n1(c0[1] + Math.sin(a) * 9)}`; } s.line(t, st.d, .7, .5); } });
    S.form(blob([H(-w + 1, -27), H(-w * .6, -50), H(0, -56), H(w * .6, -50), H(w - 1, -27), H(0, -22)], .9), sp, { in: s => s.band([H(-w + 1, -30), H(0, -25.5), H(w - 1, -30)], 4, cloth(hat.band || 'brown'), null, null, { edge: false }) });
    return; }
  if (k === 'furhat' || k === 'cone' || k === 'khanhat') {
    // felt and fur: a round crown in the north-east, a peaked one on the steppe; a khan's is tall, gold-plated and plumed
    const up = k === 'furhat' ? (hat.up ?? 8) : k === 'cone' ? 26 : 30, crown = k === 'furhat' ? dome(-30, up, 0) : blob([H(-w + 2, -30), H(-w * .6, -50), H(-5, top - up + 3), H(0, top - up), H(5, top - up + 3), H(w * .6, -50), H(w - 2, -30)], [.4, 1, 1, .5, 1, 1, .4]);
    S.form(crown, pal, { in: s => { const q = mixc(pal.s, pal.k, .45); if (hat.pat) s.fill(rect(0, 0, 300, 300), hat.pat); for (const x of k === 'furhat' ? [-14, 12] : [-w * .5, 0, w * .5]) s.pen([H(x * .1, top - up + 2), H(x * .7, -44), H(x, -30)], 1.1, q, { op: .6 }); if (hat.plaque) { const p = H(0, -44), m = met('gold'); s.both(PZ([[p[0], p[1] - 9], [p[0] + 7, p[1]], [p[0], p[1] + 9], [p[0] - 7, p[1]]]), m.b, m.k, .8); s.fill(PZ([[p[0], p[1] - 9], [p[0] - 7, p[1]], [p[0], p[1]]]), m.hi, .7); s.both(circ(p[0], p[1], 2.4), hat.plaque, m.k, .5); } if (trimP) s.band([H(-w * .56, -50), H(0, top - up + 6), H(w * .56, -50)].map((p, i) => (i === 1 ? p : [p[0], p[1] + 14])), 3.4, trimP, hat.trim.motif, trimP.l, { edge: false }); } });
    if (k === 'cone' && hat.tip) { const t = H(0, top - up); S.both(circ(t[0], t[1] - 2, 3), hat.tip, pal.k, .8); if (hat.tassel) { S.line(P([[t[0], t[1] - 2], [t[0] + 9, t[1] + 10]]), hat.tassel, 1.4); S.both(blob([[t[0] + 7, t[1] + 9], [t[0] + 11, t[1] + 9], [t[0] + 12, t[1] + 20], [t[0] + 7, t[1] + 20]], .5), hat.tassel, pal.k, .6); } }
    if (k === 'khanhat') { const t = H(0, top - up); plume(S, t[0], t[1], hat.plumes || 3, 26, hat.plume || 'white', { spread: .3, w: 7 }); const m = met('gold'); S.both(circ(t[0], t[1], 3.6), m.b, m.k, .8); S.fill(circ(t[0] - 1, t[1] - 1, 1.2), m.hi); }
    if (hat.fur !== false) fur(S, [H(-w - 5, -22), H(-w - 5, -34), H(-w * .5, -40), H(0, -41), H(w * .5, -40), H(w + 5, -34), H(w + 5, -22), H(w * .5, -24), H(0, -24.5), H(-w * .5, -24)], hat.fur || 'bear', { amp: 3, per: 3, tails: hat.furTails, spots: hat.furSpots });
    else S.form(blob([H(-w - 4, -24), H(-w - 7, -38), H(-w * .5, -34), H(0, -33), H(w * .5, -34), H(w + 7, -38), H(w + 4, -24), H(0, -22)], [.5, .4, 1, 1, 1, .4, .5, 1]), cel(cloth(hat.brim || 'brown')), { in: s => trimP && s.band([H(-w - 4, -30), H(0, -27), H(w + 4, -30)], 3.4, trimP, hat.trim.motif, trimP.l, { edge: false }) });
    return;
  }
  if (k === 'turban' || k === 'sultan') {
    // wound cloth: each turn of it is a fold; the end hangs or is tucked; a sultan's is larger, banded with goldwork, jewelled, plumed
    const big = k === 'sultan' ? 1.35 : hat.size ?? 1, up = 13 * big, out = 8 * big, y1 = -23;
    const d = blob([H(-w - 2, y1), H(-w - out, y1 - 14), H(-w * .72 - out * .5, top - up * .55), H(-4, top - up), H(w * .4, top - up * .9), H(w * .8 + out * .5, top - up * .4), H(w + out, y1 - 13), H(w + 2, y1), H(w * .5, y1 + 3), H(0, y1 + 5), H(-w * .5, y1 + 3)], [.5, 1, 1, 1, 1, 1, 1, .5, 1, 1, 1]);
    S.form(d, pal, { sh: 1.5, in: s => { const q = mixc(pal.s, pal.k, .45), n = Math.round(5 + big * 2);
      for (let i = 0; i < n; i++) { const t = i / (n - 1), a = H(lerp(-w - out + 2, w * .2, t), lerp(y1 - 6, top - up + 2, t)), b = H(lerp(-w * .1, w + out - 2, t), lerp(y1 + 2, y1 - 20, t)), m = [(a[0] + b[0]) / 2 + 3, (a[1] + b[1]) / 2 - 6 + t * 5]; s.pen([a, m, b], 1.5, q, { op: .75 }); if (i % 2 === 0) s.pen([[a[0] + 2, a[1] - 2.4], [m[0], m[1] - 2.6], [b[0] - 3, b[1] - 2.4]], 1.3, c.l, { op: .6 }); }
      for (let i = 0; i < 3; i++) s.pen([H(w + out, y1 - 20 - i * 9), H(w * .4, y1 - 8 - i * 6), H(-w * .3, y1 + 2)], 1.2, q, { op: .5 });
      if (hat.stripe) { const sc = cloth(hat.stripe); for (let i = 1; i < n; i += 2) { const t = i / (n - 1), a = H(lerp(-w - out + 2, w * .2, t), lerp(y1 - 6, top - up + 2, t)), b = H(lerp(-w * .1, w + out - 2, t), lerp(y1 + 2, y1 - 20, t)), m = [(a[0] + b[0]) / 2 + 3, (a[1] + b[1]) / 2 - 2.5 + t * 5]; s.pen([a, m, b], 2.4, sc.b, { op: .85, flat: 1 }); } }
      if (hat.goldband) s.band([H(-w - 2, y1 - 6), H(-w * .5, y1 - 2), H(0, y1), H(w * .5, y1 - 2), H(w + 2, y1 - 6)], 5, cloth('#c9a13a'), hat.goldband, '#fff1b8'); } });
    if (hat.kulah) { const t = H(-2, top - up + 3); S.form(blob([[t[0] - 9, t[1] + 4], [t[0] - 5, t[1] - 7], [t[0] + 5, t[1] - 7], [t[0] + 9, t[1] + 4]], .8), cel(cloth(hat.kulah)), {}); }
    if (hat.tail) { const sg = hat.tail, a = H(sg * (w + out * .6), y1 - 4); S.form(blob([[a[0] - 5, a[1]], [a[0] + 5, a[1] - 2], [a[0] + sg * 6 + 6, a[1] + 40], [a[0] + sg * 9, a[1] + 58], [a[0] + sg * 4 - 6, a[1] + 44]], .9), pal, { in: s => s.pen([[a[0], a[1] + 4], [a[0] + sg * 6, a[1] + 50]], 1.1, mixc(pal.s, pal.k, .5), { op: .6 }) }); }
    if (hat.gem) { const g = H(0, y1 - 13 * big * .7), m = met('gold'); if (hat.plume) plume(S, g[0], g[1] - 3, hat.plume.n || 1, hat.plume.len || 24, hat.plume.c || 'white', { spread: .22, w: 6 }); gem(S, g[0], g[1], 3.2 * Math.min(1.25, big), hat.gem, m); if (k === 'sultan') { let p = ''; for (const dx of [-7, 7]) p += circ(g[0] + dx, g[1] + 1, 1.6); S.both(p, '#f4efe2', m.k, .5); S.both(elli(g[0], g[1] + 7.5, 1.8, 2.6), '#f4efe2', m.k, .5); } }
    return;
  }
  if (k === 'headcloth') { // a square of cloth held by a cord: the desert's working headwear
    S.form(blob([H(-w - 5, -20), H(-w - 4, -36), H(-w * .6, -52), H(0, -56), H(w * .6, -52), H(w + 4, -36), H(w + 5, -20), H(w + 8, 10), [cx + w + 20, F.yS + 24], [cx + w - 4, F.yS + 20], H(w - 3, 12), H(w - 2.5, -10), H(w - 8, -24), H(0, -28), H(-w + 8, -24), H(-w + 2.5, -10), H(-w + 3, 12), [cx - w + 4, F.yS + 20], [cx - w - 20, F.yS + 24], H(-w - 8, 10)], .9), pal, { in: s => { const q = mixc(pal.s, pal.k, .45); s.pen([H(-w - 2, -16), H(-w - 5, 10), [cx - w - 8, F.yS + 14]], 1.4, q, { op: .7 }); s.pen([H(w + 2, -16), H(w + 5, 10), [cx + w + 8, F.yS + 14]], 1.4, q, { op: .7 }); s.pen([H(-14, -52), H(-22, -40), H(-w + 4, -26)], 1.1, q, { op: .5 }); if (hat.stripe) { const sc = cloth(hat.stripe); for (const y of [0, 8]) { s.pen([H(-w - 7, y), H(-w + 1, y + 2)], 2, sc.b, { flat: 1 }); s.pen([H(w - 1, y + 2), H(w + 7, y)], 2, sc.b, { flat: 1 }); } } } });
    if (hat.cord) { const cc = cloth(hat.cord), line = [H(-w - 4.5, -30), H(-w * .5, -37), H(0, -38.5), H(w * .5, -37), H(w + 4.5, -30)]; for (const dy of hat.cord2 ? [0, 4] : [0]) { S.line(curve(line.map(p => [p[0], p[1] + dy])), cc.k, 4.2); S.line(curve(line.map(p => [p[0], p[1] + dy])), cc.b, 2.8); } }
    return;
  }
  if (k === 'veil') { // a woman's headcloth: over the hair, round the face, down on the shoulders; coins on the brow for wealth
    S.form(blob([H(-w - 4, -18), H(-w - 4, -36), H(-w * .6, -52), H(0, -56), H(w * .6, -52), H(w + 4, -36), H(w + 4, -18), H(w + 6, 14), [cx + w + 10, F.yS + 10], [cx + w - 8, F.yS + 14], H(w - 2, 14), H(w - 1.5, -10), H(w - 7, -25), H(6, -30), H(0, -29), H(-6, -30), H(-w + 7, -25), H(-w + 1.5, -10), H(-w + 2, 14), [cx - w + 8, F.yS + 14], [cx - w - 10, F.yS + 10], H(-w - 6, 14)], .9), pal, { in: s => { const q = mixc(pal.s, pal.k, .45); s.pen([H(-w, -22), H(-w - 3, 6), [cx - w - 2, F.yS + 4]], 1.4, q, { op: .7 }); s.pen([H(w, -22), H(w + 3, 6), [cx + w + 2, F.yS + 4]], 1.4, q, { op: .7 }); s.pen([H(-6, -54), H(-18, -42), H(-w + 4, -26)], 1.1, q, { op: .5 }); s.pen([H(10, -54), H(20, -42), H(w - 4, -26)], 1.1, q, { op: .5 }); if (hat.pat) s.fill(rect(0, 0, 300, 520), hat.pat);
      if (trimP) s.band([H(-w + 1.5, 12), H(-w + 1.5, -10), H(-w + 7, -26), H(0, -31), H(w - 7, -26), H(w - 1.5, -10), H(w - 1.5, 12)], hat.trim.w || 3.6, trimP, hat.trim.motif, hat.trim.c2 || trimP.l, { edge: false }); } });
    if (hat.coins) { const m = met(hat.coins); let d = ''; for (let i = 0; i < 9; i++) { const x = lerp(-w + 9, w - 9, i / 8), p = H(x, -27.5 + (x / w) ** 2 * 5); d += circ(p[0], p[1] + 2.4, 1.9); } S.both(d, m.b, m.k, .5); }
    return;
  }
  if (k === 'wrap') { // the south's headwrap: cloth wound high and flared, knotted at the front; taller and stiffer with wealth
    const up = (hat.up ?? 20), fl = hat.flare ?? 10;
    S.form(blob([H(-w - 2, -22), H(-w - 4, -36), H(-w - fl, top - up * .5), H(-w * .5, top - up), H(w * .3, top - up - 3), H(w + fl, top - up * .6), H(w + 4, -36), H(w + 2, -22), H(w * .5, -26), H(0, -27), H(-w * .5, -26)], [.5, 1, 1, 1, 1, .8, 1, .5, 1, 1, 1]), pal, { sh: 1.5, in: s => { if (hat.pat) s.fill(rect(0, 0, 300, 300), hat.pat); const q = mixc(pal.s, pal.k, .45); for (let i = 0; i < 6; i++) { const t = i / 5; s.pen([H(lerp(-w - 2, -w - fl + 4, t), lerp(-26, top - up * .5, t)), H(lerp(-4, 4, t), lerp(-30, top - up * .2, t) - 4), H(lerp(w + 2, w + fl - 4, t), lerp(-26, top - up * .6, t))], 1.5, q, { op: .7 }); if (i % 2) s.pen([H(lerp(-w, -w - fl + 6, t), lerp(-29, top - up * .5 - 3, t)), H(lerp(-8, 0, t), lerp(-33, top - up * .2 - 3, t) - 4)], 1.2, c.l, { op: .55 }); }
      if (trimP) s.band([H(-w - 2, -25), H(-w * .5, -29), H(0, -30), H(w * .5, -29), H(w + 2, -25)], 4.4, trimP, hat.trim.motif, hat.trim.c2 || trimP.l); } });
    if (hat.knot) { const a = H(hat.knot * 8, -33); S.form(blob([[a[0] - 8, a[1] + 4], [a[0] - 6, a[1] - 8], [a[0] + 4, a[1] - 11], [a[0] + 9, a[1] - 2], [a[0] + 5, a[1] + 6]], .9), pal, {}); }
    return;
  }
  if (k === 'feathers') { const line = [H(-w - 1.5, -23), H(0, -30), H(w + 1.5, -23)]; const a = H(-Math.sign(yaw || 1) * (w - 2), -26); plume(S, a[0], a[1], hat.n || 3, hat.len || 26, hat.c || 'white', { a: -1.57 - Math.sign(yaw || 1) * -.3, spread: .3, w: 6 }); S.band(line, 5, cloth(hat.band || 'madder'), hat.motif || 'zig', '#f0e6c8'); return; }
  if (k === 'shaman') { // a sky-priest's cap of the steppe: felt, hung with ribbons and small bells, a fringe before the eyes
    S.form(dome(-25, 7, 2), pal, { in: s => { s.band(bandLine(-25, 2, 4).map(p => [p[0], p[1] - 4]), 6, cloth(hat.band || 'crimson'), 'diamonds', '#e8d9a8'); } });
    const cols = hat.ribbons || ['crimson', 'blue', 'white', 'mustard']; for (let i = 0; i < 7; i++) { const sg = i < 3.5 ? -1 : 1, x = sg * (w + 1 - (i % 4) * 2.5), a = H(x, -20 + (i % 4) * 2), col = cloth(cols[i % cols.length]), len = 44 + (i % 3) * 12; S.both(blob([[a[0] - 2.5, a[1]], [a[0] + 2.5, a[1]], [a[0] + sg * 5 + 2.5, a[1] + len], [a[0] + sg * 5 - 2.5, a[1] + len]], .5), col.b, col.k, .7); if (i % 2) S.both(circ(a[0] + sg * 5, a[1] + len + 2.4, 2.2), '#c9a24a', '#3a2a10', .6); }
    let fr = ''; for (let i = 0; i < 12; i++) { const x = lerp(-w + 6, w - 6, i / 11), a = H(x, -22 + (x / w) ** 2 * 3); fr += `M${pt(a)}v${6 + (i % 2) * 2}`; } S.line(fr, cloth(hat.band || 'crimson').b, 1.3);
    const t = H(0, top - 7); plume(S, t[0], t[1], 2, 22, hat.plume || '#3a3a44', { spread: .5, w: 6 }); return; }
  if (k === 'spangen' || k === 'kettle') {
    // the northern helm: four plates riveted to a frame, a bar down the nose; a kettle hat is the conscript's, a brim and no bar
    const m = met(hat.m || 'iron'), b2 = met(hat.frame || 'bronze');
    S.form(blob([H(-w - 2, -17), H(-w - 2, -30), H(-w * .72, top - 3), H(0, top - 10), H(w * .72, top - 3), H(w + 2, -30), H(w + 2, -17), H(w * .5, -19), H(0, -19), H(-w * .5, -19)], [.4, 1, 1, 1, 1, 1, .4, 1, 1, 1]), m, { sh: 1.8, in: s => { s.fill(blob([H(6, top - 12), H(w + 4, top), H(w + 4, -14), H(w * .5, -18), H(w * .55, -38)], .9), m.s, .8); glint(s, [H(-w + 6, -24), H(-w + 9, -40), H(-w * .4, top - 3)], 3, m);
      for (const x of [-w * .5, 0, w * .5]) s.band([H(x * .1, top - 9), H(x * .8, -38), H(x, -20)], 3.4, { b: b2.b, k: b2.k, s: b2.s }, 'dots', b2.hi, { step: 7, edge: false });
      s.band([H(-w - 2, -21), H(0, -22.5), H(w + 2, -21)], 5, { b: b2.b, k: b2.k, s: b2.s }, 'dots', b2.hi, { step: 6 }); } });
    if (k === 'kettle') S.form(sliver([H(-w - 13, -18), H(0, -12), H(w + 13, -18)], 9, { flat: 1 }), m, { in: s => glint(s, [H(-w - 8, -19), H(-w * .3, -16)], 1.6, m) });
    else { const n0 = H(0, -20), n1p = [Hd.fx + yaw * 2.4, y0 + 13]; S.form(blob([[n0[0] - 4.5, n0[1]], [n0[0] + 4.5, n0[1]], [n1p[0] + 3.2, n1p[1] - 4], [n1p[0], n1p[1] + 2], [n1p[0] - 3.2, n1p[1] - 4]], .6), { b: b2.b, s: b2.s, k: b2.k, rim: b2.hi }, { in: s => s.pen([[n0[0] - 1.4, n0[1] + 2], [n1p[0] - 1.2, n1p[1] - 5]], 1.1, b2.hi, { op: .9 }) });
      for (const sg of [-1, 1]) { const a = H(sg * 12, -20), bb = H(sg * (w - 6), -20); S.form(blob([a, bb, H(sg * (w - 8), -9), H(sg * 20, -11.5)], .8), { b: b2.b, s: b2.s, k: b2.k, rim: b2.hi }, {}); } }
    if (hat.crest) { const t = H(0, top - 10); S.both(circ(t[0], t[1], 3.4), b2.b, b2.k, .8); }
    return;
  }
  if (k === 'turbanhelm') { // the desert helm: a pointed steel bowl with a spike, a cloth wound round its rim against the sun
    const m = met(hat.m || 'steel'), g = met('gold');
    S.form(blob([H(-w - 1, -24), H(-w + 1, -40), H(-w * .5, top - 6), H(-3, top - 22), H(0, top - 34), H(3, top - 22), H(w * .5, top - 6), H(w - 1, -40), H(w + 1, -24)], [.4, 1, 1, .7, .3, .7, 1, 1, .4]), m, { sh: 1.8, in: s => { s.fill(blob([H(4, top - 30), H(w + 4, top), H(w + 4, -20), H(w * .5, -24), H(w * .45, -44)], .9), m.s, .8); glint(s, [H(-w + 7, -32), H(-w * .6, top - 2), H(-6, top - 16)], 2.6, m); for (const x of [-w * .5, w * .5]) s.pen([H(x * .1, top - 20), H(x * .8, -44), H(x, -28)], 1, m.d, { op: .7 }); if (hat.inlay) s.band([H(-w * .7, -42), H(0, -46), H(w * .7, -42)], 4, { b: g.b, k: g.k, s: g.s }, hat.inlay, g.hi, { edge: false }); } });
    const cc = cloth(hat.c || 'cream'); S.form(blob([H(-w - 3, -18), H(-w - 6, -30), H(-w * .5, -35), H(0, -36), H(w * .5, -35), H(w + 6, -30), H(w + 3, -18), H(w * .5, -20), H(0, -20.5), H(-w * .5, -20)], .9), cel(cc), { in: s => { for (let i = 0; i < 6; i++) { const x = lerp(-w - 2, w - 8, i / 5); s.pen([H(x, -33), H(x + 6, -27), H(x + 12, -20)], 1.3, mixc(cc.s, cc.k, .45), { op: .7 }); } } });
    const n0 = H(0, -21), n1p = [Hd.fx + yaw * 2.4, y0 + 10]; S.form(blob([[n0[0] - 2.6, n0[1]], [n0[0] + 2.6, n0[1]], [n1p[0] + 2, n1p[1] - 3], [n1p[0], n1p[1] + 3], [n1p[0] - 2, n1p[1] - 3]], .6), m, {});
    return;
  }
  if (k === 'steppehelm') { // the rider's helm: laced plates, light for a horseman, a horsehair tail from its top
    const m = met(hat.m || 'iron'), lace = hat.lace || '#7a2a22';
    const t = S.tile(7, 11, `<rect x=".5" y=".5" width="6" height="9" rx="1.5" fill="${m.b}" stroke="${m.k}" stroke-width=".8"/><path d="M2 2v5.5" stroke="${m.hi}" stroke-width=".9" opacity=".8"/><path d="M0 10.3h7" stroke="${lace}" stroke-width="1.5"/>`);
    S.form(blob([H(-w - 2, -22), H(-w - 1, -36), H(-w * .62, top - 5), H(0, top - 14), H(w * .62, top - 5), H(w + 1, -36), H(w + 2, -22), H(0, -24)], [.4, 1, 1, .8, 1, 1, .4, 1]), { b: m.s, s: m.d, k: m.k, rim: m.hi }, { in: s => { s.fill(rect(0, 0, 300, 300), t); s.fill(blob([H(6, top - 16), H(w + 4, top), H(w + 4, -18), H(w * .5, -22), H(w * .5, -40)], .9), m.d, .35); s.band([H(-w - 2, -25), H(0, -27.5), H(w + 2, -25)], 4.4, cloth('brown'), 'dots', '#c9a24a', { step: 7 }); } });
    const tp = H(0, top - 14); S.both(blob([[tp[0] - 3, tp[1] + 2], [tp[0] + 3, tp[1] + 2], [tp[0] + 1.6, tp[1] - 9], [tp[0] - 1.6, tp[1] - 9]], .5), m.b, m.k, .8);
    const hc = cloth(hat.tail || '#2a2228'); S.form(blob([[tp[0] - 2, tp[1] - 8], [tp[0] + 3, tp[1] - 10], [tp[0] + 16, tp[1] - 6], [tp[0] + 24, tp[1] + 14], [tp[0] + 20, tp[1] + 30], [tp[0] + 15, tp[1] + 10], [tp[0] + 6, tp[1] - 1]], .9), cel(hc), { in: s => s.pen([[tp[0] + 2, tp[1] - 7], [tp[0] + 14, tp[1] - 2], [tp[0] + 20, tp[1] + 22]], 1, hc.l, { op: .7 }) });
    return;
  }
  if (k === 'hidecap') { // the south's war cap: hardened hide sewn with cowries, a crest of feathers or horsehair; no iron in that heat
    const hd = cloth(hat.c || 'tan');
    S.form(dome(-24, 3, 1.5, { dip: 3 }), cel(hd), { in: s => { for (const x of [-w * .55, 0, w * .55]) s.pen([H(x * .15, top - 2), H(x * .8, -40), H(x, -25)], 1.1, hd.d, { op: .7 }); let cw = ''; for (let i = 0; i < 9; i++) { const x = lerp(-w + 3, w - 3, i / 8), p = H(x, -25.5 + (1 - (x / w) ** 2) * -1.5); cw += elli(p[0], p[1], 1.9, 2.6); } s.both(cw, '#f2ead6', '#3a2a1c', .6); } });
    const t = H(0, top - 3); plume(S, t[0], t[1] + 2, hat.n || 5, hat.len || 22, hat.crest || 'scarlet', { spread: .34, w: 6.5 });
    for (const sg of [-1, 1]) { const a = H(sg * (w + .5), -22); S.form(blob([[a[0] - 5, a[1]], [a[0] + 5, a[1]], [a[0] + sg * 2 + 4, a[1] + 24], [a[0] + sg * 2 - 4, a[1] + 24]], .7), cel(hd), {}); }
    return;
  }
  if (k === 'ironcrown') { // the north's crown: a band of dark iron with tall points, gold only at the rivets, worn over a rim of fur
    const m = met(hat.m || 'black'), g = met(hat.g || 'gold'), base = [H(-w - 2, -24), H(-w * .5, -30), H(0, -31.5), H(w * .5, -30), H(w + 2, -24)], q = splPts(base, false, 1, 6), pts = [q[0]];
    const n = 7; for (let i = 0; i < n; i++) { const t = (i + .5) / n, p = q[Math.round(t * (q.length - 1))], hgt = i % 2 ? 9 : 17 + (i === 3 ? 5 : 0); pts.push([p[0] - 4.4, p[1] - 7], [p[0], p[1] - 7 - hgt], [p[0] + 4.4, p[1] - 7]); }
    pts.push(q[q.length - 1], ...q.slice().reverse().map(p => [p[0], p[1] + 1.2]));
    if (hat.fur) fur(S, [H(-w - 4, -19), H(-w - 4, -27), H(0, -33), H(w + 4, -27), H(w + 4, -19), H(0, -24.5)], hat.fur, { amp: 2.4, per: 3 });
    S.form(PZ(pts), m, { sh: 1.2, in: s => { s.pen(base.map(p => [p[0], p[1] - 5.6]), 1, m.hi, { op: .7 }); } });
    let rv = ''; for (let i = 0; i < n; i++) { const p = q[Math.round((i + .5) / n * (q.length - 1))]; rv += circ(p[0], p[1] - 3.4, 1.5); } S.both(rv, g.b, g.k, .5);
    if (hat.gem) { const c0 = H(0, -31.5); gem(S, c0[0], c0[1] - 11, 2.6, hat.gem, g); }
    return;
  }
  if (k === 'beadcrown') { // the south's crown: a tall cap of beadwork, a face worked on it, strings of beads falling before the eyes
    const cols = hat.cols || ['#c9a13a', '#b8322a', '#2a447e', '#f2ead6'], g = met('gold');
    const d = blob([H(-w - 1, -24), H(-w + 2, -40), H(-w * .5, top - 16), H(0, top - 30), H(w * .5, top - 16), H(w - 2, -40), H(w + 1, -24), H(0, -27)], [.4, 1, 1, .8, 1, 1, .4, 1]);
    S.form(d, cel(cloth(cols[0])), { in: s => { for (let j = 0; j < 7; j++) { const y = -28 - j * 7.5, ww2 = w * (1 - j * .1); s.band([H(-ww2 - 2, y), H(0, y - 2.5), H(ww2 + 2, y)], j % 2 ? 3.4 : 5.4, cloth(cols[1 + j % (cols.length - 1)]), j % 2 ? 'dots' : 'zig', cols[(j + 2) % cols.length], { step: 5.5, edge: false }); } } });
    const t = H(0, top - 30); S.both(circ(t[0], t[1] - 3, 5), g.b, g.k, .9); S.fill(circ(t[0] - 1.5, t[1] - 4.5, 1.6), g.hi); plume(S, t[0], t[1] - 6, 3, 20, hat.plume || 'white', { spread: .42, w: 6 });
    let str = {}; for (let i = 0; i < 11; i++) { const x = lerp(-w + 3, w - 3, i / 10), a = H(x, -24.5 + (1 - (x / w) ** 2) * -2.5), len = Math.abs(i - 5) > 3 ? 4 : 2 + (i % 2); for (let j = 0; j < len; j++) { const col = cols[(i + j) % cols.length]; str[col] = (str[col] || '') + circ(a[0], a[1] + 2.2 + j * 3.6, 1.6); } } for (const col in str) S.both(str[col], col, '#2a1a10', .45);
    return;
  }
}
// a flat ring seen from above the eye line: a hat's brim as one ellipse
function elliRing(c, rx, ry) { return elli(c[0], c[1], rx, ry); }
