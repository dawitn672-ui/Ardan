// The manhwa layer · what is worn over the main garment: aprons, vests and coats, armour (quilting, mail, lamellar,
// plate of bronze or steel, a coat of the realm), belts and what hangs from them, mantles and furs, and jewellery.
// Metal is three flat steps and one hard highlight. Fur is a ragged outline with tufts.
import { clamp, lerp, mixc, n1, splPts, add, sub, mul, norm, perp, along } from '../g.js';
import { cloth, metal } from '../palette.js';
import { pt, P, PZ, blob, curve, sliver, elli, circ, tube, cel, rect } from './ink.js';
import { torsoPts, foldsOn, castOn, patternOf } from './body.js';

export const met = name => { const m = metal(name); return { b: m.b, s: m.s, k: m.k, rim: m.hi, l: m.l, hi: m.hi, d: m.d }; };
// a hard highlight on metal: a bright sliver with a thinner one beside it
export const glint = (s, pts, w, m) => { s.pen(pts, w, m.hi, { op: .95 }); s.pen(pts.map(p => [p[0] + w * 1.3, p[1] + w * .4]), w * .45, m.l, { op: .8 }); };
// a ragged fur edge: the outline of a shape broken into tufts
export function furD(pts, o = {}) {
  const q = splPts(pts, true, 1, o.per || 4), n = q.length, out = [], cxy = q.reduce((a, p) => [a[0] + p[0] / n, a[1] + p[1] / n], [0, 0]), amp = o.amp || 3.2;
  for (let i = 0; i < n; i++) { const p = q[i], d = norm(sub(p, cxy)); out.push(i % 2 ? add(p, mul(d, amp + ((i * 7) % 5) * .45)) : add(p, mul(d, -amp * .25))); }
  return PZ(out);
}
export function fur(S, pts, name, o = {}) {
  const c = cloth(name), pal = cel(c), d = furD(pts, o);
  S.form(d, pal, { sh: 1.6, in: s => {
    const q = splPts(pts, true, 1, 3), n = q.length, cxy = q.reduce((a, p) => [a[0] + p[0] / n, a[1] + p[1] / n], [0, 0]); let dk = '', lt = '';
    for (let i = 0; i < n; i++) for (const t of [.25, .55, .8]) { const p = [lerp(cxy[0], q[i][0], t) + ((i * 13) % 7 - 3), lerp(cxy[1], q[i][1], t) + ((i * 5) % 5 - 2)], e = `M${pt(p)}l${n1(-1.6 + (i % 3))} ${n1(4.5)}`; if ((i + Math.round(t * 10)) % 3) dk += e; else lt += e; }
    s.line(dk, c.d, .9, .55); s.line(lt, c.l, 1, .8);
    if (o.spots) { let sp = ''; for (let i = 0; i < n; i += 2) for (const t of [.35, .7]) { const p = [lerp(cxy[0], q[i][0], t) + ((i * 11) % 9 - 4), lerp(cxy[1], q[i][1], t) + ((i * 3) % 7 - 3)]; sp += `M${pt(p)}q2.6 -2 4.2 .4q-.4 2.6 -2.8 2.4q-2.2 -.6 -1.4 -2.8Z`; } s.fill(sp, o.spots, .85); }
    if (o.tails) { let sp = ''; for (let i = 1; i < n; i += 3) { const p = [lerp(cxy[0], q[i][0], .6), lerp(cxy[1], q[i][1], .6)]; sp += `M${pt(p)}l-1 5l2.2 0Z`; } s.fill(sp, o.tails, .9); }
  } });
}
// the trunk without its shoulder caps (a sleeveless layer)
const vestPts = (F, g = 2, drop = 0) => { const { cx, yS, sw, cw, ww, yW, neckW: nw } = F, half = sg => [[cx + sg * (nw + 6), yS - 9 + drop], [cx + sg * (sw * .58), yS - 3 + drop * .6], [cx + sg * (sw - 13 + g), yS + 12], [cx + sg * (cw - 1 + g), yS + 54], [cx + sg * (ww + g), yW], [cx + sg * (ww + 10 + g), yW + 50], [cx + sg * (ww + 12 + g), 520]]; return [half(-1), half(1)]; };

export function drawOver(S, F, O, sk, ctx = {}) {
  if (!O) return;
  const { cx, yS, sw, cw, ww, yW, neckW: nw } = F, k = O.kind, c = O.c ? cloth(O.c) : null, pal = c ? cel(c, { deep: O.deep }) : null, trim = O.trim ? { w: O.trim.w || 4.5, pal: cloth(O.trim.c), motif: O.trim.motif, c2: O.trim.c2 || cloth(O.trim.c).l } : null;
  if (k === 'apron' || k === 'smith') {
    // a bib: leather for the forge (scorched, riveted), cloth for the kitchen and the stall
    const top = yS + (k === 'smith' ? 34 : 42), hw = k === 'smith' ? cw * .62 : cw * .52, d = blob([[cx - hw, top], [cx + hw, top], [cx + hw + 5, yS + 78], [cx + ww + 3, yW], [cx + ww + 12, 520], [cx - ww - 12, 520], [cx - ww - 3, yW], [cx - hw - 5, yS + 78]], [.3, .3, 1, 1, .1, .1, 1, 1]);
    for (const sg of [-1, 1]) S.band([[cx + sg * (hw - 3), top + 2], [cx + sg * (nw + 9), yS + 4], [cx + sg * (nw + 4), yS - 9]], 4, c, null, null, { edge: false });
    S.form(d, pal, { in: s => {
      s.pen([[cx - hw + 6, top + 14], [cx - 8, yS + 80], [cx - ww + 8, yW + 4]], 1.2, c.d, { op: .5 }); s.pen([[cx + hw - 6, top + 18], [cx + 12, yS + 86], [cx + ww - 10, yW + 2]], 1.2, c.d, { op: .5 });
      s.line(P([[cx - hw + 3, top + 4.5], [cx + hw - 3, top + 4.5]]), c.l, .9, .8);
      if (k === 'smith') { s.fill(circ(cx - hw + 5, top + 5, 1.5) + circ(cx + hw - 5, top + 5, 1.5), '#c2c6cc'); s.fill(elli(cx + 9, yS + 84, 7, 4.5) + elli(cx - 14, yS + 100, 4, 3) + elli(cx + 20, yS + 62, 2.5, 2), '#1c1512', .5); }
      if (O.pocket) { s.both(blob([[cx - 15, yS + 78], [cx + 15, yS + 78], [cx + 14, yS + 100], [cx - 14, yS + 100]], .3), c.b, c.k, .8); s.line(P([[cx - 14, yS + 81.5], [cx + 14, yS + 81.5]]), c.l, .8, .8); }
      if (trim) s.band([[cx - hw, top + 3], [cx + hw, top + 3]], trim.w, trim.pal, trim.motif, trim.c2);
    } });
    return;
  }
  if (k === 'vest' || k === 'coat') {
    // open down the front: two panels, their edges trimmed (a sheepskin shows its fleece at the edge)
    const [L, R] = vestPts(F, O.g ?? 3.5), gap = O.gap ?? 13, lap = O.lapel || 0;
    for (const [side, sg] of [[L, -1], [R, 1]]) {
      const inner = [[cx + sg * (gap + 12 + lap), 520], [cx + sg * (gap + 6 + lap), yW], [cx + sg * (gap + lap * .5), yS + 56], [cx + sg * (nw + 4 + lap * .3), yS + 8]];
      const pts = [...side, ...inner], d = blob(pts, pts.map((_, i) => (i === 6 || i === 7 ? .1 : i === 0 ? .4 : 1)));
      S.form(d, pal, { in: s => {
        if (O.pat) s.fill(rect(0, 0, 300, 520), patternOf(S, O));
        if (sg > 0) castOn(s, F, pal, .8);
        s.pen([[cx + sg * (cw - 4), yS + 56], [cx + sg * (cw - 12), yS + 84], [cx + sg * (ww - 2), yW + 6]], 1.3, mixc(pal.s, pal.k, .45), { op: .7 });
        s.pen([[cx + sg * (sw - 22), yS + 16], [cx + sg * (cw - 18), yS + 50], [cx + sg * (gap + 18), yW - 6]], 1.1, mixc(pal.s, pal.k, .45), { op: .5 });
        const e = inner.slice().reverse().map(p => [p[0] + sg * (trim ? trim.w * .5 : 0), p[1]]);
        if (O.fleece) { const f = cloth(O.fleece); s.line(curve(e), f.k, 9); s.line(curve(e), f.b, 7.6); let t = ''; for (let i = 0; i < 16; i++) { const p = along(splPts(e, false, 1, 6), (i + .5) / 16); t += `M${n1(p[0] - 3)} ${n1(p[1])}q3 -3 6 0`; } s.line(t, f.d, .8, .7); }
        else if (trim) s.band(e, trim.w, trim.pal, trim.motif, trim.c2);
        if (O.frogs && sg < 0) for (let i = 0; i < 3; i++) { const y = yS + 62 + i * 15, x = cx + sg * (gap + 2 + i * 1.5); s.line(P([[x - 9, y], [x + 2, y]]), O.frogs, 1.5); s.fill(circ(x - 9, y, 1.5), O.frogs); }
      } });
    }
    return;
  }
  if (k === 'tabard') {
    // the coat of the realm over armour: the field (halved with a second colour where the realm parts it) and its charge
    const hw = cw * (O.narrow ? .56 : .82), top = [[cx - hw, yS - 2], [cx - nw - 7, yS - 9], [cx - nw, yS + 6], [cx, yS + 11], [cx + nw, yS + 6], [cx + nw + 7, yS - 9], [cx + hw, yS - 2]];
    const d = blob([...top, [cx + hw + 2, yS + 54], [cx + ww * (O.narrow ? .66 : 1) + 2, yW], [cx + ww * (O.narrow ? .7 : 1) + 10, 520], [cx - ww * (O.narrow ? .7 : 1) - 10, 520], [cx - ww * (O.narrow ? .66 : 1) - 2, yW], [cx - hw - 2, yS + 54]], [.3, .6, 1, 1, 1, .6, .3, 1, 1, .1, .1, 1, 1]);
    S.form(d, pal, { in: s => {
      if (O.c2) s.fill(rect(cx, 0, 300, 520), cloth(O.c2).b), s.fill(rect(cx + cw * .4, 0, 300, 520), cloth(O.c2).s);
      castOn(s, F, pal, .9); foldsOn(s, F, pal, { g: 0 });
      if (trim) s.band(top.slice(1, 6), trim.w, trim.pal, trim.motif, trim.c2);
      if (O.charge) O.charge(s, cx, yS + 46, 15);
    } });
    return;
  }
  if (k === 'quilt') {
    // a padded coat: channels of stuffing stitched down, a soldier's first armour and, in the hot south, his only one
    const tp = torsoPts(F, O.g ?? 3), d = blob(tp, tp.map((_, i) => (i === 7 || i === 8 ? .1 : i === 0 || i === 15 ? .5 : 1)));
    const t = O.diamond ? S.tile(13, 13, `<path d="M0 0l13 13M13 0l-13 13" stroke="${c.d}" stroke-width="1" opacity=".7"/><path d="M1 0l13 13" stroke="${c.l}" stroke-width=".6" opacity=".6"/>`) : S.tile(11, 10, `<path d="M0 0v10" stroke="${c.d}" stroke-width="1.2" opacity=".75"/><path d="M1.6 0v10" stroke="${c.l}" stroke-width=".8" opacity=".6"/><path d="M5.5 0v10" stroke="${c.s}" stroke-width="3" opacity=".35"/>`);
    S.form(d, pal, { in: s => { s.fill(rect(0, 0, 300, 520), t); castOn(s, F, pal);
      const np = [[cx - nw - 7, yS - 10], [cx - nw - 1, yS + 3], [cx, yS + 8], [cx + nw + 1, yS + 3], [cx + nw + 7, yS - 10]]; s.fill(curve(np) + 'Z', sk.s); s.band(np, 4.5, trim ? trim.pal : c, trim ? trim.motif : null, trim ? trim.c2 : null);
      if (O.ties) for (let i = 0; i < 4; i++) { const y = yS + 24 + i * 22; s.line(P([[cx - 5, y - 2], [cx + 5, y + 2]]) + P([[cx + 5, y - 2], [cx - 5, y + 2]]), O.ties, 1.3); } else s.pen([[cx, yS + 9], [cx + .5, 520]], 1.2, c.k, { flat: 1 }); } });
    return;
  }
  if (k === 'mail' || k === 'lamellar' || k === 'scale') {
    const m = met(O.metal || 'iron'), [L, R] = vestPts(F, O.g ?? 2.5), pts = [...L, ...R.slice().reverse()], full = O.sleeves ? torsoPts(F, 2.5) : pts;
    const d = blob(full, full.map((_, i) => (i === full.length / 2 - 1 || i === full.length / 2 ? .1 : i === 0 || i === full.length - 1 ? .5 : 1)));
    const lace = O.lace || '#7a2a22';
    const t = k === 'mail' ? S.tile(5, 4.4, `<path d="M0 2.2a2.5 2.2 0 0 0 5 0" fill="none" stroke="${m.k}" stroke-width=".8" opacity=".75"/><path d="M-2.5 0a2.5 2.2 0 0 0 5 0M2.5 4.4a2.5 2.2 0 0 0 5 0" fill="none" stroke="${m.l}" stroke-width=".55" opacity=".7"/>`)
      : k === 'scale' ? S.tile(9, 8, `<path d="M0 0q4.5 9 9 0M-4.5 4q4.5 9 9 0M4.5 4q4.5 9 9 0" fill="none" stroke="${m.k}" stroke-width=".9" opacity=".8"/><path d="M1.6 1.5q2.6 4 5.4 .4" fill="none" stroke="${m.hi}" stroke-width=".7" opacity=".7"/>`)
        : S.tile(7, 13, `<rect x=".6" y=".6" width="5.8" height="10.4" rx="1.6" fill="${m.b}" stroke="${m.k}" stroke-width=".8"/><path d="M1.9 2v7" stroke="${m.hi}" stroke-width=".9" opacity=".8"/><path d="M0 12.2h7" stroke="${lace}" stroke-width="1.8"/><circle cx="3.5" cy="3" r=".6" fill="${m.k}"/>`);
    S.form(d, { b: k === 'lamellar' ? m.s : m.b, s: m.s, k: m.k, rim: m.hi }, { in: s => {
      s.fill(rect(0, 0, 300, 520), t);
      s.fill(blob([[cx + cw * .3, yS - 20], [cx + sw + 20, yS - 10], [cx + sw + 20, 520], [cx + ww * .5, 520], [cx + cw * .55, yS + 60]], .9), m.d, .32);
      castOn(s, F, { s: m.d }); s.fill(blob([[cx - cw + 4, yS + 6], [cx - cw * .4, yS + 2], [cx - cw * .5, yS + 60], [cx - cw + 2, yS + 50]], .9), m.hi, .16);
      const np = [[cx - nw - 7, yS - 10], [cx - nw - 1, yS + 4], [cx, yS + 9], [cx + nw + 1, yS + 4], [cx + nw + 7, yS - 10]];
      s.fill(curve(np) + 'Z', O.collar ? cloth(O.collar).b : sk.s); s.band(np, 3.6, O.collar ? cloth(O.collar) : { b: m.s, k: m.k, s: m.d }, null, null, { edge: false });
    } });
    return;
  }
  if (k === 'cuirass') {
    // a breastplate: bronze in the south (cast, a boss on the breast), steel in the north and the desert
    const m = met(O.metal || 'steel'), [L, R] = vestPts(F, 2), pts = [...L.slice(0, 5), [cx - ww - 3, yW + 3], [cx, yW + 10], [cx + ww + 3, yW + 3], ...R.slice(0, 5).reverse()];
    S.form(blob(pts, [.5, 1, 1, 1, 1, .4, 1, .4, 1, 1, 1, 1, .5]), m, { sh: 1.8, in: s => {
      s.fill(blob([[cx + 4, yS + 4], [cx + cw, yS + 6], [cx + cw, yW + 12], [cx + ww * .3, yW + 12], [cx + cw * .52, yS + 70], [cx + cw * .2, yS + 44]], .9), m.s, .75);
      s.fill(blob([[cx + cw * .5, yS + 30], [cx + cw + 4, yS + 30], [cx + cw + 4, yW + 12], [cx + ww * .7, yW + 12], [cx + cw * .8, yS + 80]], .9), m.d, .6);
      s.pen([[cx, yS + 12], [cx + 1, yW + 8]], 1.1, m.k, { flat: 1, op: .6 });
      glint(s, [[cx - cw + 12, yS + 16], [cx - cw + 9, yS + 46], [cx - ww + 10, yW - 8]], 3.2, m);
      s.pen([[cx - cw * .7, yS + 60], [cx - 6, yS + 68], [cx, yS + 62], [cx + 6, yS + 68], [cx + cw * .7, yS + 60]], 1.3, m.d, { op: .7 });
      const np = [[cx - nw - 8, yS - 10], [cx - nw - 1, yS + 4], [cx, yS + 9], [cx + nw + 1, yS + 4], [cx + nw + 8, yS - 10]]; s.fill(curve(np) + 'Z', O.collar ? cloth(O.collar).b : sk.s);
      const e = met(O.edge || O.metal || 'steel'); s.band(np, 3.6, { b: e.b, k: e.k, s: e.s }, null, null, { edge: false });
      if (O.boss) { s.both(circ(cx, yS + 44, 13), e.b, e.k, 1); s.fill(circ(cx + 2, yS + 46, 10), e.s); s.fill(circ(cx - .5, yS + 43.5, 9), e.b); s.line(circ(cx, yS + 44, 5.5), e.k, .8, .7); s.fill(circ(cx - 3.5, yS + 40.5, 2.2), e.hi); let rays = ''; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; rays += `M${n1(cx + Math.cos(a) * 6.5)} ${n1(yS + 44 + Math.sin(a) * 6.5)}L${n1(cx + Math.cos(a) * 11)} ${n1(yS + 44 + Math.sin(a) * 11)}`; } s.line(rays, e.k, .7, .7); }
      if (O.engrave) s.band([[cx - cw + 6, yS + 78], [cx, yS + 90], [cx + cw - 6, yS + 78]], 5, { b: e.b, k: e.k, s: e.s }, O.engrave, e.k);
      if (O.rivets) { let rv = ''; for (let i = 0; i < 7; i++) rv += circ(lerp(cx - ww, cx + ww, i / 6), yW + 3 - Math.sin(i / 6 * Math.PI) * -5, 1.3); s.fill(rv, e.hi); }
    } });
    return;
  }
  if (k === 'harness') { // crossed straps over the chest (a rider's, a porter's)
    const col = cloth(O.c || 'brown'); for (const sg of O.one ? [O.one] : [-1, 1]) S.band([[cx + sg * (sw - 16), yS + 2], [cx, yS + 64], [cx - sg * (ww + 2), yW - 6]], O.w || 6, col, O.motif || null, O.c2 || col.l, { step: 9 });
    if (O.boss) { const e = met(O.boss); S.both(circ(cx, yS + 64, 6.5), e.b, e.k, 1); S.fill(circ(cx - 1.6, yS + 62.4, 2), e.hi); }
  }
}

// ---- belts and what hangs from them ----------------------------------------------------------------------------------
export function drawBelt(S, F, B, ctx = {}) {
  if (!B) return;
  const { cx, ww, yW } = F, g = B.g ?? 4, a = [cx - ww - g, yW - 1], b = [cx + ww + g, yW - 1], mid = [cx, yW + 5], line = [a, mid, b], k = B.kind;
  const hang = (x, fn) => fn([cx + x, yW + 4 + (1 - (x / (ww + g)) ** 2) * 3]);
  if (k === 'rope') { const c = cloth(B.c || 'hemp'); S.line(curve(line), c.k, 5.4); S.line(curve(line), c.b, 3.8); let t = ''; const q = splPts(line, false, 1, 12); for (let i = 1; i < q.length - 1; i++) t += `M${n1(q[i][0] - 1.6)} ${n1(q[i][1] + 1.9)}l3.2 -3.8`; S.line(t, c.d, .8, .8);
    const kx = cx + (B.side ?? -10); S.both(elli(kx, yW + 5, 5, 4), c.b, c.k, .9); for (const dx of [-3, 3]) { S.line(P([[kx + dx * .4, yW + 8], [kx + dx, yW + 38]]), c.k, 4.2); S.line(P([[kx + dx * .4, yW + 8], [kx + dx, yW + 38]]), c.b, 2.8); } }
  else if (k === 'sash') { const c = cloth(B.c), pal = cel(c), w = B.w || 17, d = blob([[a[0], a[1] - w * .5], [cx, yW + 4 - w * .5], [b[0], b[1] - w * .5], [b[0] + 1, b[1] + w * .5], [cx, yW + 6 + w * .5], [a[0] - 1, a[1] + w * .5]], [.3, 1, .3, .3, 1, .3]);
    const sx = cx + (B.side ?? -ww * .55);
    if (B.tails !== false) for (const dx of [-5, 4]) S.form(blob([[sx + dx - 5, yW + 6], [sx + dx + 5, yW + 6], [sx + dx * 2 + 6, yW + 70], [sx + dx * 2 - 6, yW + 70]], .5), pal, { in: s => B.fringe && s.band([[sx + dx * 2 - 7, yW + 64], [sx + dx * 2 + 7, yW + 64]], 4, cloth(B.fringe), 'bars', cloth(B.fringe).l) });
    S.form(d, pal, { in: s => { if (B.pat) s.fill(rect(0, 0, 300, 520), patternOf(S, B)); for (const t of [-.25, .1, .3]) s.pen([[a[0], a[1] + w * t], [cx, yW + 5 + w * t], [b[0], b[1] + w * t]], 1.1, mixc(c.s, c.k, .4), { op: .6 }); } });
    S.form(blob([[sx - 7, yW - 4], [sx + 6, yW - 5], [sx + 8, yW + 11], [sx - 6, yW + 13]], .8), pal, {}); }
  else { const c = cloth(B.c || 'brown'), w = B.w || 7; S.line(curve(line), c.k, w + 1.6); S.line(curve(line), c.b, w); S.line(curve(line.map(p => [p[0], p[1] - w * .28])), c.l, .8, .7);
    const m = met(B.buckle || 'iron');
    if (k === 'plaques') { let q = ''; const pp = splPts(line, false, 1, 7); for (let i = 1; i < pp.length - 1; i += 2) { const p = pp[i]; q += rect(p[0] - 3.2, p[1] - w * .5 + .6, 6.4, w - 1.2); } S.both(q, m.b, m.k, .7); let h = ''; for (let i = 1; i < pp.length - 1; i += 2) h += `M${n1(pp[i][0] - 1.6)} ${n1(pp[i][1] - 1.4)}h2.2`; S.line(h, m.hi, 1); }
    if (k === 'studs') { let q = ''; const pp = splPts(line, false, 1, 8); for (let i = 1; i < pp.length - 1; i++) q += circ(pp[i][0], pp[i][1], 1.3); S.fill(q, m.l); }
    const bx = cx + (B.side ?? 0); S.both(rect(bx - w * .7, yW + 5 - w * .8, w * 1.4, w * 1.6), 'none', m.k, 3.4); S.line(rect(bx - w * .7, yW + 5 - w * .8, w * 1.4, w * 1.6), m.b, 2); S.line(P([[bx - w * .7, yW + 5 - w * .8], [bx + w * .3, yW + 5 - w * .8]]), m.hi, 1, .9);
    if (B.tail !== false) { S.line(curve([[bx + w * .5, yW + 6], [bx + w * 1.4, yW + 16], [bx + w * 1.1, yW + 40]]), c.k, w * .8 + 1.4); S.line(curve([[bx + w * .5, yW + 6], [bx + w * 1.4, yW + 16], [bx + w * 1.1, yW + 40]]), c.b, w * .8); } }
  for (const h of B.hang || []) {
    const x = h.x ?? (ww * .6);
    if (h.k === 'purse') hang(x, p => { const c = cloth(h.c || 'tan'); S.line(P([[p[0], p[1] - 3], [p[0], p[1] + 5]]), c.k, 2); S.form(blob([[p[0] - 7, p[1] + 5], [p[0] + 7, p[1] + 5], [p[0] + 10, p[1] + 20], [p[0], p[1] + 26], [p[0] - 10, p[1] + 20]], .9), cel(c), { in: s => { s.line(P([[p[0] - 7, p[1] + 9], [p[0] + 7, p[1] + 9]]), c.k, 1); if (h.clasp) s.fill(circ(p[0], p[1] + 10, 2), h.clasp); if (h.fat) s.fill(circ(p[0] - 3, p[1] + 17, 2.2) + circ(p[0] + 3, p[1] + 19, 2.2), c.l, .5); } }); });
    else if (h.k === 'knife') hang(x, p => { const c = cloth(h.c || 'dark'), m = met(h.m || 'iron'); S.both(blob([[p[0] - 3.4, p[1] - 2], [p[0] + 3.4, p[1] - 2], [p[0] + 2 + (h.curve || 0), p[1] + 30], [p[0] + (h.curve || 0) * 1.6, p[1] + 36]], .6), c.b, c.k, .9); S.both(rect(p[0] - 2.3, p[1] - 14, 4.6, 12), h.grip || '#5a3a22', '#1c120c', .8); S.both(rect(p[0] - 4.4, p[1] - 3.6, 8.8, 2.6), m.b, m.k, .7); if (h.cap) S.both(circ(p[0], p[1] - 15, 2.8), m.b, m.k, .7); });
    else if (h.k === 'keys') hang(x, p => { const m = met('iron'); S.line(circ(p[0], p[1] + 8, 5), m.k, 2.6); S.line(circ(p[0], p[1] + 8, 5), m.l, 1.3); for (const dx of [-3.5, 0, 3.5]) { S.line(P([[p[0] + dx * .4, p[1] + 13], [p[0] + dx, p[1] + 28]]) + `M${n1(p[0] + dx)} ${n1(p[1] + 25)}h2.6M${n1(p[0] + dx)} ${n1(p[1] + 28)}h2.6`, m.k, 2.4); S.line(P([[p[0] + dx * .4, p[1] + 13], [p[0] + dx, p[1] + 28]]), m.l, 1); } });
    else if (h.k === 'tally') hang(x, p => { S.line(P([[p[0], p[1] - 2], [p[0] + 1, p[1] + 8]]), '#3a2a1c', 1.2); S.both(PZ([[p[0] - 2.6, p[1] + 8], [p[0] + 3.4, p[1] + 7], [p[0] + 5.2, p[1] + 38], [p[0] - .8, p[1] + 39]]), '#c9a878', '#4a3420', .9); let n = ''; for (let i = 0; i < 6; i++) n += `M${n1(p[0] - 2 + i * .3)} ${n1(p[1] + 13 + i * 4)}l3.4 -.8`; S.line(n, '#4a3420', 1); if (h.seal) S.both(circ(p[0] + 1.6, p[1] + 34, 2.8), h.seal, '#3a1410', .7); });
    else if (h.k === 'horn') hang(x, p => { S.both(blob([[p[0] - 5, p[1] + 4], [p[0] + 3, p[1] + 3], [p[0] + 9, p[1] + 20], [p[0] + 18, p[1] + 30], [p[0] + 6, p[1] + 27], [p[0] - 3, p[1] + 14]], .9), '#d8caa6', '#4a3a22', .9); S.line(P([[p[0] - 4.4, p[1] + 7], [p[0] + 3.6, p[1] + 6]]), h.m || '#b9853a', 2.2); });
    else if (h.k === 'beads') hang(x, p => { let q = ''; for (let i = 0; i < 9; i++) q += circ(p[0] + Math.sin(i * .5) * 3, p[1] + 4 + i * 4, 1.9); S.both(q, h.c || '#b06a2a', '#2a1a10', .6); S.both(PZ([[p[0] + 1, p[1] + 40], [p[0] + 5, p[1] + 52], [p[0] - 2, p[1] + 52]]), h.c2 || '#8a2a22', '#2a1a10', .6); });
    else if (h.k === 'cup') hang(x, p => { S.both(blob([[p[0] - 5, p[1] + 5], [p[0] + 5, p[1] + 5], [p[0] + 4, p[1] + 17], [p[0] - 4, p[1] + 17]], .4), h.c || '#8a6a44', '#2a1a10', .8); S.line(P([[p[0], p[1] - 2], [p[0], p[1] + 5]]), '#2a1a10', 1.2); });
  }
}

// ---- mantles: what lies on the shoulders ------------------------------------------------------------------------------
// drawn in two passes: 'back' before the body, 'front' after the arms
export function drawMantle(S, F, M, pass, sk, ctx = {}) {
  if (!M) return;
  const { cx, yS, sw, cw, ww, yW, neckW: nw } = F, k = M.kind, c = M.c ? cloth(M.c) : null, pal = c ? cel(c, { deep: M.deep }) : null, trim = M.trim ? { w: M.trim.w || 5, pal: cloth(M.trim.c), motif: M.trim.motif, c2: M.trim.c2 || cloth(M.trim.c).l } : null;
  const brooch = (x, y, b) => { if (!b) return; const m = met(b.m || 'bronze'), r = b.r || 6;
    if (b.k === 'ring') { S.line(circ(x, y, r), m.k, 4.2); S.line(circ(x, y, r), m.b, 2.7); S.line(`M${n1(x - r)} ${n1(y)}a${r} ${r} 0 0 1 ${n1(r)} ${n1(-r)}`, m.hi, 1); S.line(P([[x - r - 3, y + r + 1], [x + r + 2, y - r - 2]]), m.k, 2.4); S.line(P([[x - r - 3, y + r + 1], [x + r + 2, y - r - 2]]), m.l, 1.1); }
    else if (b.k === 'oval') { S.both(elli(x, y, r * .8, r * 1.15), m.b, m.k, 1); S.fill(elli(x + .8, y + 1, r * .5, r * .8), m.s); S.fill(circ(x - r * .3, y - r * .5, 1.3), m.hi); }
    else { S.both(circ(x, y, r), m.b, m.k, 1); S.fill(circ(x + 1, y + 1, r * .68), m.s); S.fill(circ(x - .3, y - .3, r * .56), b.gem || m.b); S.fill(circ(x - r * .3, y - r * .32, r * .2), '#ffffff', .9); } };
  if (k === 'cloak' || k === 'cape') {
    const g = M.g ?? 7, long = 520;
    if (pass === 'back') { const d = blob([[cx - sw - g - 2, yS + 2], [cx - nw - 10, yS - 16], [cx + nw + 10, yS - 16], [cx + sw + g + 2, yS + 2], [cx + sw + g + 16, yS + 110], [cx + sw + g + 22, long], [cx - sw - g - 22, long], [cx - sw - g - 16, yS + 110]], [1, 1, 1, 1, 1, .1, .1, 1]); S.form(d, { b: (M.lining ? cloth(M.lining) : c).s, s: (M.lining ? cloth(M.lining) : c).d, k: c.k, rim: c.l }, { sh: 2 }); return; }
    const side = M.pin || 0;                                                // 0 clasped at the throat; -1 / 1 pinned on that shoulder
    if (side === 0) {
      for (const sg of [-1, 1]) { const pts = [[cx + sg * (nw + 3), yS - 11], [cx + sg * (sw * .62), yS - 6], [cx + sg * (sw + g), yS + 8], [cx + sg * (sw + g + 12), yS + 96], [cx + sg * (sw + g + 18), long], [cx + sg * (cw - 6 - (M.wrap || 0)), long], [cx + sg * (cw - 12 - (M.wrap || 0)), yS + 90], [cx + sg * (nw + 14 - (M.wrap || 0) * .2), yS + 20]];
        S.form(blob(pts, [.5, 1, 1, 1, .1, .1, 1, 1]), pal, { in: s => { if (M.pat) s.fill(rect(0, 0, 300, 520), patternOf(S, M)); const q = mixc(pal.s, pal.k, .45); s.pen([[cx + sg * (sw - 8), yS + 4], [cx + sg * (sw + 2), yS + 60], [cx + sg * (sw + 8), yS + 150]], 1.6, q, { op: .7 }); s.pen([[cx + sg * (sw * .6), yS], [cx + sg * (cw - 2), yS + 60], [cx + sg * (cw + 4), yS + 140]], 1.3, q, { op: .55 });
          const e = [[cx + sg * (nw + 8 - (M.wrap || 0) * .2), yS - 2], [cx + sg * (nw + 15 - (M.wrap || 0) * .2), yS + 22], [cx + sg * (cw - 10 - (M.wrap || 0)), yS + 90], [cx + sg * (cw - 5 - (M.wrap || 0)), long]]; if (M.furEdge) { const f = cloth(M.furEdge); s.line(curve(e), f.k, 11); s.line(curve(e), f.b, 9.4); let t = ''; const qq = splPts(e, false, 1, 8); for (let i = 1; i < qq.length; i += 1) t += `M${n1(qq[i][0] - 3)} ${n1(qq[i][1] - 2)}l${n1(2 + (i % 2) * 2)} 4`; s.line(t, M.furSpot || f.d, 1, .7); } else if (trim) s.band(e, trim.w, trim.pal, trim.motif, trim.c2); } }); }
      if (M.chain) { const m = met(M.chain); S.line(curve([[cx - nw - 12, yS + 12], [cx, yS + 22], [cx + nw + 12, yS + 12]]), m.k, 3.6); S.line(curve([[cx - nw - 12, yS + 12], [cx, yS + 22], [cx + nw + 12, yS + 12]]), m.b, 2.2); brooch(cx - nw - 13, yS + 11, M.brooch); brooch(cx + nw + 13, yS + 11, M.brooch); }
      else if (M.brooch) brooch(cx, yS + 8, M.brooch);
    } else {
      // pinned on one shoulder, the other arm free (the northern way, and a rider's)
      const sg = side, pts = [[cx - sg * (nw + 8), yS - 12], [cx - sg * (sw * .64), yS - 7], [cx - sg * (sw + g), yS + 8], [cx - sg * (sw + g + 12), yS + 100], [cx - sg * (sw + g + 18), long], [cx + sg * (ww * .5), long], [cx + sg * (cw * .42), yS + 78], [cx + sg * (sw * .56), yS + 10], [cx + sg * (sw * .5), yS - 6], [cx + sg * (nw + 3), yS - 12], [cx, yS + 2]];
      S.form(blob(pts, [.6, 1, 1, 1, .1, .1, 1, 1, .6, .7, 1]), pal, { in: s => { if (M.pat) s.fill(rect(0, 0, 300, 520), patternOf(S, M)); const q = mixc(pal.s, pal.k, .45); for (let i = 0; i < 5; i++) { const t = i / 4; s.pen([[cx + sg * (sw * .5 - 4), yS + 6 + i * 2], [cx - sg * lerp(8, sw * .7, t), yS + 34 + i * 12], [cx - sg * lerp(cw * .4, sw + g, t), yS + 90 + i * 22]], 1.7 - t * .4, q, { op: .75 }); }
        castOn(s, F, pal, .8); const e = [[cx - sg * (nw + 8), yS - 12], [cx, yS + 2], [cx + sg * (nw + 4), yS - 10]]; if (trim) { s.band([[cx + sg * (sw * .56), yS + 10], [cx + sg * (cw * .42), yS + 78], [cx + sg * (ww * .5), long]], trim.w, trim.pal, trim.motif, trim.c2); s.band(e, trim.w * .8, trim.pal, null, null); } } });
      brooch(cx + sg * (sw * .52), yS + 4, M.brooch);
    }
    if (M.fur && pass === 'front') fur(S, [[cx - sw - 6, yS + 14], [cx - sw * .7, yS - 12], [cx - nw - 6, yS - 18], [cx - nw - 2, yS + 4], [cx, yS + 16], [cx + nw + 2, yS + 4], [cx + nw + 6, yS - 18], [cx + sw * .7, yS - 12], [cx + sw + 6, yS + 14], [cx + sw * .66, yS + 30], [cx + 10, yS + 36], [cx - 10, yS + 36], [cx - sw * .66, yS + 30]], M.fur, { amp: 3.6, tails: M.furTails, spots: M.furSpots });
    return;
  }
  if (pass === 'back') { if (k === 'hood') S.form(blob([[cx - nw - 22, yS - 2], [cx - nw - 14, yS - 30], [cx, yS - 38], [cx + nw + 14, yS - 30], [cx + nw + 22, yS - 2]], .9), { b: c.s, s: c.d, k: c.k, rim: c.l }, {}); return; }
  if (k === 'fur') { fur(S, [[cx - sw - 5, yS + 16], [cx - sw * .72, yS - 12], [cx - nw - 6, yS - 19], [cx - nw - 2, yS + 2], [cx, yS + (M.deep ? 26 : 14)], [cx + nw + 2, yS + 2], [cx + nw + 6, yS - 19], [cx + sw * .72, yS - 12], [cx + sw + 5, yS + 16], [cx + sw * .6, yS + (M.d || 30)], [cx, yS + (M.d || 30) + 10], [cx - sw * .6, yS + (M.d || 30)]], M.fur, { amp: M.amp || 3.8, spots: M.spots, tails: M.tails }); if (M.brooch) brooch(cx, yS + (M.d || 30) + 4, M.brooch); return; }
  if (k === 'pelt') { // a whole skin over one shoulder: a wolf in the north, a leopard in the south (by law, only the great wear it)
    const sg = M.side || -1; fur(S, [[cx + sg * (nw + 2), yS - 14], [cx + sg * (sw * .7), yS - 13], [cx + sg * (sw + 8), yS + 10], [cx + sg * (sw + 4), yS + 44], [cx + sg * (cw * .5), yS + 62], [cx - sg * (cw * .2), yS + 84], [cx - sg * (cw * .7), yS + 108], [cx - sg * (ww + 2), yS + 112], [cx - sg * (cw * .5), yS + 78], [cx + sg * 2, yS + 40], [cx + sg * (nw - 2), yS + 12]], M.fur, { amp: 3.4, spots: M.spots });
    if (M.paw) { const p = [cx - sg * (ww - 2), yS + 116]; fur(S, [[p[0] - 7, p[1] - 6], [p[0] + 7, p[1] - 6], [p[0] + 6, p[1] + 14], [p[0] - 6, p[1] + 14]], M.fur, { amp: 2, spots: M.spots }); let cl = ''; for (const dx of [-4, 0, 4]) cl += `M${n1(p[0] + dx)} ${n1(p[1] + 14)}l-.8 5.5l2.2 -4.4Z`; S.both(cl, '#efe6d2', '#3a2a1c', .6); }
    if (M.brooch) brooch(cx + sg * (sw * .55), yS + 2, M.brooch); return; }
  if (k === 'shawl') { // a square of cloth over both shoulders, crossed or knotted on the breast
    for (const sg of [1, -1]) { const pts = [[cx + sg * (nw + 2), yS - 12], [cx + sg * (sw * .66), yS - 7], [cx + sg * (sw + 5), yS + 10], [cx + sg * (sw + 2), yS + 46], [cx + sg * (cw * .4), yS + 62], [cx - sg * 10, yS + (M.knot ? 44 : 70)], [cx - sg * 4, yS + 30], [cx + sg * (nw - 1), yS + 6]];
      S.form(blob(pts, [.6, 1, 1, 1, 1, .6, 1, 1]), pal, { in: s => { if (M.pat) s.fill(rect(0, 0, 300, 520), patternOf(S, M)); const q = mixc(pal.s, pal.k, .45); for (let i = 0; i < 4; i++) s.pen([[cx + sg * (sw * .5 + i * 8), yS - 4 + i * 3], [cx + sg * (cw * .5 + i * 3), yS + 28 + i * 6], [cx - sg * (6 - i * 4), yS + 46 + i * 6]], 1.4, q, { op: .65 }); if (sg > 0) castOn(s, F, pal, .7); if (trim) s.band([[cx + sg * (sw + 4), yS + 44], [cx + sg * (cw * .4), yS + 60], [cx - sg * 10, yS + (M.knot ? 42 : 68)]], trim.w, trim.pal, trim.motif, trim.c2); } }); }
    if (M.knot) { S.form(blob([[cx - 7, yS + 38], [cx + 7, yS + 38], [cx + 6, yS + 50], [cx - 6, yS + 50]], .9), pal, {}); for (const dx of [-5, 5]) S.form(blob([[cx + dx - 4, yS + 49], [cx + dx + 4, yS + 49], [cx + dx * 2.4 + 5, yS + 74], [cx + dx * 2.4 - 5, yS + 76]], .6), pal, {}); }
    if (M.brooch) brooch(cx, yS + 44, M.brooch); return; }
  if (k === 'hood') { // a hood thrown back: its cape on the shoulders, the roll at the neck
    const d = blob([[cx - sw * .86, yS + 12], [cx - sw * .56, yS - 9], [cx - nw - 4, yS - 16], [cx - nw, yS + 2], [cx, yS + 10], [cx + nw, yS + 2], [cx + nw + 4, yS - 16], [cx + sw * .56, yS - 9], [cx + sw * .86, yS + 12], [cx + sw * .5, yS + (M.d || 30)], [cx, yS + (M.d || 30) + (M.point ? 22 : 8)], [cx - sw * .5, yS + (M.d || 30)]], M.dag ? [1, 1, 1, 1, 1, 1, 1, 1, 1, .3, .3, .3] : 1);
    S.form(d, pal, { in: s => { castOn(s, F, pal); const q = mixc(pal.s, pal.k, .45); s.pen([[cx - nw - 10, yS - 6], [cx - 4, yS + 12], [cx + nw + 10, yS - 6]], 1.6, q, { op: .8 }); s.pen([[cx - sw * .5, yS], [cx - sw * .4, yS + 22]], 1.3, q, { op: .6 }); s.pen([[cx + sw * .5, yS], [cx + sw * .4, yS + 22]], 1.3, q, { op: .6 }); if (trim) s.band([[cx - sw * .86, yS + 14], [cx - sw * .5, yS + (M.d || 30) - 2], [cx, yS + (M.d || 30) + (M.point ? 18 : 5)], [cx + sw * .5, yS + (M.d || 30) - 2], [cx + sw * .86, yS + 14]], trim.w, trim.pal, trim.motif, trim.c2); } }); return; }
  if (k === 'stole') { // a band of office round the neck, its two ends down the front
    for (const sg of [-1, 1]) { const line = [[cx + sg * (nw + 3), yS - 12], [cx + sg * (nw + 11), yS + 14], [cx + sg * (M.spread || 17), yS + 70], [cx + sg * (M.spread || 17), 520]]; S.band(line, M.w || 12, c, M.motif, M.c2 || '#d9b24a', { step: M.step || 22 }); }
    return; }
  if (k === 'scarf') { // a neck-cloth: against dust in the desert, against wind on the steppe
    const d = blob([[cx - nw - 9, yS - 18], [cx - nw - 14, yS - 2], [cx - 6, yS + 14], [cx + 4, yS + 16], [cx + nw + 14, yS - 2], [cx + nw + 9, yS - 18], [cx, yS - 10]], .9);
    S.form(d, pal, { in: s => { const q = mixc(pal.s, pal.k, .45); s.pen([[cx - nw - 8, yS - 10], [cx, yS + 2], [cx + nw + 8, yS - 10]], 1.5, q, { op: .8 }); s.pen([[cx - nw - 10, yS - 3], [cx, yS + 9], [cx + nw + 10, yS - 3]], 1.2, q, { op: .6 }); if (M.pat) s.fill(rect(0, 0, 300, 520), patternOf(S, M)); } });
    if (M.tail) S.form(blob([[cx + M.tail * 4, yS + 8], [cx + M.tail * 14, yS + 10], [cx + M.tail * 20, yS + 46], [cx + M.tail * 8, yS + 50]], .7), pal, {}); return; }
}

// ---- jewellery and tokens at the neck -----------------------------------------------------------------------------------
export function drawNeckwear(S, F, list, ctx = {}) {
  const { cx, yS, neckW: nw } = F;
  for (const N of list || []) {
    const k = N.kind, d = N.d ?? 26, w = N.w ?? nw + 9, line = [[cx - w, yS - 8], [cx - w * .62, yS + d * .62], [cx, yS + d], [cx + w * .62, yS + d * .62], [cx + w, yS - 8]], q = splPts(line, false, 1, 8);
    if (k === 'beads') { const cols = N.c || ['#b0452a'], r = N.r || 2.1, n = Math.round(q.length * 2.2 / r * .9); const by = {}; for (let i = 0; i <= n; i++) { const p = along(q, i / n), col = cols[i % cols.length]; by[col] = (by[col] || '') + circ(p[0], p[1], r * (N.big && i % N.big === 0 ? 1.5 : 1)); } for (const col in by) S.both(by[col], col, N.k || '#2a1a14', .55); if (N.pend) pendant(S, cx, yS + d + 3, N.pend); }
    else if (k === 'cord' || k === 'chain') { const m = k === 'chain' ? met(N.m || 'gold') : null; if (m) { S.line(P(q), m.k, (N.t || 2.6) + 1.3); S.line(P(q), m.b, N.t || 2.6); let t = ''; for (let i = 0; i < q.length; i += 2) t += `M${n1(q[i][0])} ${n1(q[i][1] - .9)}v1.8`; S.line(t, m.k, .7, .6); S.line(P(q.slice(2, 12)), m.hi, .8, .9); } else S.line(P(q), N.c || '#3a2a1c', 1.3); if (N.pend) pendant(S, cx, yS + d + 2, N.pend); }
    else if (k === 'torc') { const m = met(N.m || 'silver'), tq = splPts([[cx - nw - 5, yS - 9], [cx - nw - 2, yS + 4], [cx - 6, yS + 11]], false, 1, 6), tq2 = tq.map(p => [2 * cx - p[0], p[1]]); for (const t of [tq, tq2]) { S.line(P(t), m.k, 5.4); S.line(P(t), m.b, 3.8); let tw = ''; for (let i = 1; i < t.length - 1; i += 2) tw += `M${n1(t[i][0] - 1.5)} ${n1(t[i][1] + 1.6)}l3 -3.2`; S.line(tw, m.k, .7, .7); S.line(P(t.slice(1, 8)), m.hi, .9, .8); } S.both(circ(cx - 5, yS + 11.5, 3.4) + circ(cx + 5, yS + 11.5, 3.4), m.b, m.k, .9); S.fill(circ(cx - 5.8, yS + 10.6, 1.1) + circ(cx + 4.2, yS + 10.6, 1.1), m.hi); }
    else if (k === 'collar') { // a broad collar: rows of beads or plates lying on the chest
      const rows = N.rows || 3, cols = N.c || ['#c9a24a', '#2f5fa8', '#b8322a'], m = N.m ? met(N.m) : null;
      for (let j = rows - 1; j >= 0; j--) { const dd = d - (rows - 1 - j) * 0 + j * 5.2, ln = [[cx - w - j * 2.6, yS - 9 + j], [cx - (w + j * 2.6) * .64, yS + dd * .6], [cx, yS + dd], [cx + (w + j * 2.6) * .64, yS + dd * .6], [cx + w + j * 2.6, yS - 9 + j]], col = cols[j % cols.length]; S.line(curve(ln), '#2a1a10', 6.2); S.line(curve(ln), col, 4.8); const qq = splPts(ln, false, 1, 9); let t = ''; for (let i = 1; i < qq.length - 1; i++) t += `M${n1(qq[i][0])} ${n1(qq[i][1] - 2.3)}v4.6`; S.line(t, '#2a1a10', .6, .55); if (m && j % 2 === 0) S.line(P(qq.slice(3, 14)), m.hi, .9, .8); }
      if (N.pend) pendant(S, cx, yS + d + rows * 5.2, N.pend); }
  }
}
export function pendant(S, x, y, p) {
  const m = met(p.m || 'bronze'), k = p.k;
  if (k === 'disc' || k === 'sun') { if (k === 'sun') { let r = ''; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; r += `M${n1(x + Math.cos(a) * 5)} ${n1(y + 4 + Math.sin(a) * 5)}L${n1(x + Math.cos(a) * 8.6)} ${n1(y + 4 + Math.sin(a) * 8.6)}`; } S.line(r, m.k, 2.6); S.line(r, m.b, 1.3); } S.both(circ(x, y + 4, p.r || 5), m.b, m.k, .9); S.fill(circ(x - 1.4, y + 2.6, 1.5), m.hi); if (p.gem) S.both(circ(x, y + 4, 2.2), p.gem, m.k, .6); }
  else if (k === 'tag') { S.both(blob([[x - 4.5, y], [x + 4.5, y], [x + 4.5, y + 11], [x - 4.5, y + 11]], .35), m.s, m.k, .9); S.line(`M${n1(x - 2.2)} ${n1(y + 3.4)}h4.4M${n1(x)} ${n1(y + 3.4)}v5`, m.k, 1); }
  else if (k === 'tooth') S.both(blob([[x - 2.6, y], [x + 2.6, y], [x + 1.5, y + 8], [x - .6, y + 13]], .8), '#efe6d2', '#3a2a1c', .8);
  else if (k === 'gem') { S.both(PZ([[x, y - 1], [x + 5, y + 4], [x, y + 12], [x - 5, y + 4]]), p.gem || '#9c1f2c', m.k, .9); S.fill(PZ([[x, y - 1], [x - 5, y + 4], [x, y + 4]]), '#ffffff', .4); S.line(PZ([[x, y - 1], [x + 5, y + 4], [x, y + 12], [x - 5, y + 4]]), m.b, .6); }
  else if (k === 'crescent') { S.both(`M${n1(x - 6)} ${n1(y + 2)}a6.4 6.4 0 1 0 12 0a7.6 7.6 0 0 1 -12 0Z`, m.b, m.k, .9); }
  else if (k === 'amulet') { S.both(blob([[x - 4, y + 1], [x + 4, y + 1], [x + 5, y + 10], [x - 5, y + 10]], .4), p.c || '#6a3a22', '#1c120c', .9); S.line(`M${n1(x - 3)} ${n1(y + 5.4)}h6`, m.b, 1.2); }
  else if (k === 'wheel') { S.line(circ(x, y + 5, 5), m.k, 2.8); S.line(circ(x, y + 5, 5), m.b, 1.5); S.line(`M${n1(x - 5)} ${n1(y + 5)}h10M${n1(x)} ${n1(y)}v10`, m.b, 1.1); }
}
