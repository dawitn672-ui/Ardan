// The manhwa layer · what a person carries: the tools of a trade and the arms of a people. Each people's smiths make
// their own shapes (owner order 56): the north's bearded axe and lobed hilt, the desert's sabre and steel buckler, the
// steppe's horn bow and mace, the south's broad spear and tall hide shield.
import { lerp, mixc, n1, add, sub, mul, norm, perp } from '../g.js';
import { cloth } from '../palette.js';
import { pt, P, PZ, blob, curve, sliver, elli, circ, tube, cel, rect } from './ink.js';
import { met, glint, fur } from './wear.js';

const wood = (S, a, b, w, c = '#7a5a3a') => { const col = cloth(c); S.line(P([a, b]), col.k, w + 1.4); S.line(P([a, b]), col.b, w); const n = mul(perp(norm(sub(b, a))), -w * .22); S.line(P([add(a, n), add(b, n)]), col.l, w * .22, .8); };
const blade = (S, pts, m, o = {}) => S.form(blob(pts, o.t ?? .5), m, { sh: .9, in: s => { if (o.mid) s.pen(o.mid, 1, m.d, { flat: 1, op: .7 }); if (o.glint) glint(s, o.glint, 1.4, m); } });

// a shaft held upright through a hand at h (or standing beside the figure): returns nothing; head by kind
export function drawPole(S, x, yTop, yBot, P0, o = {}) {
  const k = P0.kind, tilt = P0.tilt || 0, a = [x + tilt * (yBot - yTop) * .5, yTop], b = [x - tilt * (yBot - yTop) * .5, yBot], m = met(P0.m || 'iron');
  wood(S, a, b, P0.w || 4.2, P0.wood);
  const T = (dx, dy) => [a[0] + dx, a[1] + dy];
  if (k === 'spear') blade(S, [T(0, -34), T(6, -12), T(3.4, 2), T(-3.4, 2), T(-6, -12)], m, { mid: [T(0, -32), T(0, 0)], glint: [T(-2.6, -20), T(-2.2, -4)] }), S.line(P([T(-3.6, 5), T(3.6, 5)]), m.k, 3.4), S.line(P([T(-3.6, 5), T(3.6, 5)]), m.b, 2);
  else if (k === 'broadspear') { blade(S, [T(0, -46), T(11, -24), T(8, -6), T(3, 4), T(-3, 4), T(-8, -6), T(-11, -24)], m, { t: .7, mid: [T(0, -44), T(0, 2)], glint: [T(-5, -30), T(-4.4, -8)] }); const tc = cloth(P0.tuft || 'scarlet'); S.both(blob([T(-5, 6), T(5, 6), T(8, 22), T(0, 28), T(-8, 22)], .7), tc.b, tc.k, .8); S.line(P([T(-4.4, 7), T(4.4, 7)]), '#c9a24a', 2); }
  else if (k === 'lance') { blade(S, [T(0, -30), T(4.4, -10), T(2.6, 2), T(-2.6, 2), T(-4.4, -10)], m, { mid: [T(0, -28), T(0, 0)] }); const pc = cloth(P0.pennon || 'crimson'); S.form(blob([T(2, 6), T(34, 2), T(26, 13), T(36, 24), T(2, 24)], .4), cel(pc), { in: s => { s.pen([T(4, 15), T(18, 12), T(30, 15)], 1.1, pc.d, { op: .6 }); if (P0.device) P0.device(s, a[0] + 13, a[1] + 15, 5); } }); }
  else if (k === 'axe') blade(S, [T(1, -8), T(16, -15), T(23, -4), T(22, 12), T(13, 22), T(10, 6), T(1, 6)], m, { t: .6, glint: [T(19, -8), T(20, 10)] }), S.line(P([T(21.6, -5), T(20.4, 13)]), m.hi, 1.2, .9);
  else if (k === 'halberd') { blade(S, [T(0, -30), T(4, -10), T(-4, -10)], m, {}); blade(S, [T(1, -8), T(15, -12), T(19, 0), T(15, 12), T(1, 8)], m, { t: .6 }); }
  else if (k === 'crook') { S.line(`M${pt(T(0, 2))}C${n1(a[0])} ${n1(a[1] - 22)} ${n1(a[0] + 18)} ${n1(a[1] - 22)} ${n1(a[0] + 16)} ${n1(a[1] - 4)}`, cloth(P0.wood || '#7a5a3a').k, 5.6); S.line(`M${pt(T(0, 2))}C${n1(a[0])} ${n1(a[1] - 22)} ${n1(a[0] + 18)} ${n1(a[1] - 22)} ${n1(a[0] + 16)} ${n1(a[1] - 4)}`, cloth(P0.wood || '#7a5a3a').b, 4.2); }
  else if (k === 'hoe') blade(S, [T(-3, -3), T(8, -6), T(26, 8), T(30, 26), T(20, 24), T(12, 8), T(-3, 6)], m, { t: .7, glint: [T(10, -2), T(24, 12)] });
  else if (k === 'fork') { S.line(P([T(-8, -22), T(-8, -2), T(8, -2), T(8, -22)]) + P([T(0, -24), T(0, 0)]), cloth('#7a5a3a').k, 4.6); S.line(P([T(-8, -22), T(-8, -2), T(8, -2), T(8, -22)]) + P([T(0, -24), T(0, 0)]), cloth('#8a6a44').b, 3); }
  else if (k === 'scythe') blade(S, [T(-1, -2), T(20, -12), T(48, -4), T(58, 12), T(40, 2), T(18, -2), T(0, 5)], m, { t: .8, glint: [T(18, -8), T(44, -3)] });
  else if (k === 'sunstaff') { const g = met(P0.m || 'gold'); let r = ''; for (let i = 0; i < 12; i++) { const an = i * Math.PI / 6; r += `M${n1(a[0] + Math.cos(an) * 9)} ${n1(a[1] - 14 + Math.sin(an) * 9)}L${n1(a[0] + Math.cos(an) * (i % 2 ? 14 : 17))} ${n1(a[1] - 14 + Math.sin(an) * (i % 2 ? 14 : 17))}`; } S.line(r, g.k, 3); S.line(r, g.b, 1.6); S.both(circ(a[0], a[1] - 14, 9), g.b, g.k, 1); S.fill(circ(a[0] + 1.4, a[1] - 12.6, 6.6), g.s); S.fill(circ(a[0] - .6, a[1] - 14.6, 6), g.b); S.fill(circ(a[0] - 3, a[1] - 17, 1.8), g.hi); S.line(P([T(-4, 0), T(4, 0)]), g.b, 2.6); }
  else if (k === 'crescentstaff') { const g = met(P0.m || 'silver'); S.both(`M${n1(a[0] - 11)} ${n1(a[1] - 20)}a11.5 11.5 0 1 0 22 0a14 14 0 0 1 -22 0Z`, g.b, g.k, 1); S.fill(circ(a[0] - 5, a[1] - 11, 1.6), g.hi); S.both(circ(a[0], a[1] - 2, 3.4), g.b, g.k, .8); }
  else if (k === 'spiritstaff') { // a steppe sky-priest's: a horse's tail, ribbons, small bells
    const hc = cloth('#e8e2d2'); S.form(blob([T(-4, -2), T(4, -2), T(9, 24), T(3, 44), T(-2, 30), T(-8, 40), T(-9, 20)], .8), cel(hc), { in: s => s.pen([T(0, 2), T(1, 22), T(2, 40)], 1, hc.d, { op: .6 }) }); const g = met('bronze'); S.both(circ(a[0], a[1] - 6, 5), g.b, g.k, .9); S.fill(circ(a[0] - 1.6, a[1] - 7.6, 1.4), g.hi); for (const [dx, c] of [[-5, 'crimson'], [5, 'blue']]) { const cc = cloth(c); S.both(blob([T(dx - 2, 2), T(dx + 2, 2), T(dx * 2.6 + 2, 34), T(dx * 2.6 - 2, 36)], .5), cc.b, cc.k, .6); } }
  else if (k === 'gourdstaff') { // a southern priest's: a calabash, cowries, a bunch of dried grass
    S.both(blob([T(-8, -8), T(0, -22), T(8, -8), T(6, 2), T(-6, 2)], .95), '#c98a3a', '#3a2410', .9); S.fill(elli(a[0] - 3, a[1] - 10, 2, 4), '#f0c070', .7); let cw = ''; for (const dx of [-5, 0, 5]) cw += elli(a[0] + dx, a[1] + 5, 1.8, 2.5); S.both(cw, '#f2ead6', '#3a2a1c', .6); for (let i = 0; i < 5; i++) S.pen([T(0, -20), T((i - 2) * 5, -32), T((i - 2) * 8, -40)], 1.6, '#b9a15a'); }
  else if (k === 'mace') { const g = met(P0.m || 'bronze'); S.form(blob([T(-8, -18), T(0, -24), T(8, -18), T(9, -6), T(0, 1), T(-9, -6)], .9), g, { sh: 1.2, in: s => { for (const dx of [-5, 0, 5]) s.pen([T(dx, -22), T(dx * 1.1, 0)], 1, g.k, { op: .6, flat: 1 }); s.fill(circ(a[0] - 4, a[1] - 16, 1.8), g.hi); } }); S.both(circ(a[0], a[1] - 25, 2.6), g.b, g.k, .7); const tc = cloth(P0.tuft || 'crimson'); S.both(blob([T(-3, 3), T(3, 3), T(6, 20), T(-6, 20)], .6), tc.b, tc.k, .7); }
  else if (k === 'whisk') { const hc = cloth('#efe8d8'); S.form(blob([T(-3, 0), T(3, 0), T(14, -28), T(4, -48), T(-12, -40), T(-14, -22)], .9), cel(hc), { in: s => { for (let i = 0; i < 5; i++) s.pen([T(0, -2), T((i - 2) * 4, -24), T((i - 2) * 5 - 2, -42)], .9, hc.d, { op: .6 }); } }); const g = met('gold'); S.line(P([T(-3.4, 2), T(3.4, 2)]) + P([T(-3.4, 8), T(3.4, 8)]), g.k, 3.6); S.line(P([T(-3.4, 2), T(3.4, 2)]) + P([T(-3.4, 8), T(3.4, 8)]), g.b, 2.2); }
  else if (k === 'banner') { const pc = cloth(P0.c || 'crimson'); S.form(blob([T(2, -30), T(40, -28), T(38, 14), T(2, 18)], .3), cel(pc), { in: s => { s.pen([T(8, -26), T(12, -6), T(8, 14)], 1.2, pc.d, { op: .6 }); if (P0.device) P0.device(s, a[0] + 21, a[1] - 7, 10); } }); blade(S, [T(0, -44), T(3.6, -34), T(-3.6, -34)], m, {}); }
  else if (k === 'staff') { S.both(circ(a[0], a[1] - 1, 3.6), cloth(P0.wood || '#7a5a3a').b, cloth(P0.wood || '#7a5a3a').k, .9); }
  else if (k === 'standard') { // a steppe clan's standard: horse tails under a bronze trident
    const g = met('bronze'); S.line(P([T(-7, -26), T(-7, -12), T(7, -12), T(7, -26)]) + P([T(0, -30), T(0, -8)]), g.k, 4); S.line(P([T(-7, -26), T(-7, -12), T(7, -12), T(7, -26)]) + P([T(0, -30), T(0, -8)]), g.b, 2.4); const hc = cloth(P0.tail || '#2a2228'); for (const dx of [-6, 0, 6]) S.form(blob([T(dx - 3, -6), T(dx + 3, -6), T(dx * 1.4 + 4, 22), T(dx * 1.5, 34), T(dx * 1.4 - 4, 22)], .8), cel(hc), {}); }
}

// a sword or a sabre at the hip: the hilt above the belt, the scabbard running down and back. hilt by people.
export function drawHilt(S, F, P0, sg = -1) {
  const { cx, ww, yW } = F, x = cx + sg * (ww + 3), y = yW - 2, k = P0.kind, m = met(P0.m || 'steel'), fit = met(P0.fit || 'bronze'), sc = cloth(P0.scab || 'dark'), grip = cloth(P0.grip || 'brown');
  const dir = norm([sg * (k === 'sabre' ? -.2 : -.12), -1]), n = perp(dir), at = (a, b) => add([x, y], add(mul(dir, a), mul(n, b)));
  // the scabbard, down past the frame's edge
  const curveK = k === 'sabre' || k === 'khanjar' ? sg * 16 : 0;
  S.form(blob([at(-2, -5), at(-2, 5), at(-60, 5 + curveK * .5), at(-120, 4 + curveK * 1.8), at(-120, -4 + curveK * 1.8), at(-60, -5 + curveK * .5)], .8), cel(sc), { in: s => { s.band([at(-6, -6), at(-6, 6)], 5, { b: fit.b, k: fit.k, s: fit.s }, null, null, { edge: false }); s.band([at(-34, -6 + curveK * .2), at(-34, 6 + curveK * .2)], 4, { b: fit.b, k: fit.k, s: fit.s }, null, null, { edge: false }); } });
  if (k === 'lobed') { // the northern sword: a short straight guard, a pommel of three lobes
    S.both(PZ([at(1, -10), at(5, -10), at(5, 10), at(1, 10)]), fit.b, fit.k, .9); S.both(PZ([at(5, -3), at(24, -2.6), at(24, 2.6), at(5, 3)]), grip.b, grip.k, .9); let w = ''; for (let i = 0; i < 5; i++) w += P([at(8 + i * 3.4, -3), at(9.5 + i * 3.4, 3)]); S.line(w, grip.d, .7, .8);
    S.both(PZ([at(24, -7), at(27, -7), at(27, 7), at(24, 7)]), fit.b, fit.k, .8); const c1 = at(29.6, 0), c2 = at(28.6, -4.6), c3 = at(28.6, 4.6); S.both(circ(c2[0], c2[1], 2.8) + circ(c3[0], c3[1], 2.8) + circ(c1[0], c1[1], 3.8), fit.b, fit.k, .8); S.fill(circ(c1[0] - 1.2, c1[1] - 1.2, 1.1), fit.hi); if (P0.gem) S.fill(circ(c1[0], c1[1], 1.6), P0.gem); }
  else if (k === 'arming') { // a knight's cross hilt, a wheel pommel
    S.both(PZ([at(1, -14), at(4.6, -14.6), at(4.6, 14.6), at(1, 14)]), fit.b, fit.k, .9); S.both(PZ([at(4.6, -2.8), at(24, -2.4), at(24, 2.4), at(4.6, 2.8)]), grip.b, grip.k, .9); const c1 = at(28, 0); S.both(circ(c1[0], c1[1], 5), fit.b, fit.k, .9); S.fill(circ(c1[0] + .8, c1[1] + .8, 3.2), fit.s); S.fill(circ(c1[0] - 1.6, c1[1] - 1.6, 1.2), fit.hi); if (P0.gem) S.both(circ(c1[0], c1[1], 2), P0.gem, fit.k, .5); }
  else if (k === 'sabre') { // the desert's and the steppe's: a cross with langets, a pommel hooked forward
    S.both(PZ([at(1, -10), at(4, -11), at(4, 11), at(1, 10)]), fit.b, fit.k, .9); S.both(PZ([at(-4, -2.4), at(8, -2.4), at(8, 2.4), at(-4, 2.4)]), fit.b, fit.k, .7);
    S.both(blob([at(4, -3), at(20, -3.4), at(27, -sg * 8 - 1), at(31, -sg * 8 + 3), at(24, 3.6), at(4, 3)], .8), grip.b, grip.k, .9); const c1 = at(29, -sg * 6.5); S.both(circ(c1[0], c1[1], 2.6), fit.b, fit.k, .7); if (P0.tassel) { const tc = cloth(P0.tassel); S.line(P([c1, [c1[0] + sg * 5, c1[1] + 14]]), tc.b, 1.3); S.both(blob([[c1[0] + sg * 5 - 2.4, c1[1] + 13], [c1[0] + sg * 5 + 2.4, c1[1] + 13], [c1[0] + sg * 6 + 3, c1[1] + 26], [c1[0] + sg * 6 - 3, c1[1] + 26]], .5), tc.b, tc.k, .6); } }
  else if (k === 'leaf') { // the south's short leaf-bladed sword: no guard, a broad pommel disc
    S.both(PZ([at(1, -6), at(4, -6), at(4, 6), at(1, 6)]), fit.b, fit.k, .8); S.both(PZ([at(4, -3), at(20, -2.6), at(20, 2.6), at(4, 3)]), grip.b, grip.k, .9); let w = ''; for (let i = 0; i < 4; i++) w += P([at(6.5 + i * 3.6, -3), at(6.5 + i * 3.6, 3)]); S.line(w, fit.b, 1.1, .9); const c1 = at(22, 0); S.both(elli(c1[0], c1[1], 7.5, 3.4), fit.b, fit.k, .9); S.fill(elli(c1[0] - 2, c1[1] - 1, 2.4, .9), fit.hi); }
}
// a curved dagger thrust through a sash (the desert's mark of a free man)
export function drawKhanjar(S, F, P0) {
  const { cx, yW } = F, x = cx + (P0.x ?? 14), y = yW + 2, fit = met(P0.fit || 'silver'), sc = cloth(P0.scab || 'crimson');
  S.form(blob([[x - 5, y - 2], [x + 5, y - 3], [x + 7, y + 20], [x + 16, y + 38], [x + 24, y + 42], [x + 10, y + 44], [x - 2, y + 26]], .85), cel(sc), { in: s => { s.band([[x - 6, y + 4], [x + 8, y + 3]], 4, { b: fit.b, k: fit.k, s: fit.s }, null, null, { edge: false }); s.band([[x + 6, y + 36], [x + 20, y + 36]], 4, { b: fit.b, k: fit.k, s: fit.s }, 'dots', fit.hi, { edge: false }); } });
  S.form(blob([[x - 4.4, y - 2], [x + 4.4, y - 3], [x + 3.4, y - 14], [x + 6.5, y - 23], [x - 7, y - 22], [x - 3.4, y - 13]], .7), { b: fit.b, s: fit.s, k: fit.k, rim: fit.hi }, { in: s => { if (P0.gem) s.both(circ(x, y - 18, 2.2), P0.gem, fit.k, .5); s.pen([[x - 2, y - 12], [x - 2.4, y - 4]], 1, fit.hi, { op: .9 }); } });
}
// a bow and a quiver on the back: only what shows over the shoulders
export function drawBowBack(S, F, P0, sg = 1) {
  const { cx, yS, sw } = F, k = P0.kind, wc = cloth(P0.wood || '#8a5a34');
  if (k === 'recurve') { // the horn bow, short and doubly curved, in its case at the hip or across the back
    const pts = [[cx + sg * (sw + 22), yS - 74], [cx + sg * (sw + 8), yS - 62], [cx + sg * (sw + 14), yS - 30], [cx + sg * (sw - 6), yS + 4], [cx + sg * (sw - 24), yS + 40]];
    S.line(curve(pts), wc.k, 7); S.line(curve(pts), wc.b, 5.2); S.line(curve(pts.map(p => [p[0] - 1.4, p[1] - .6])), wc.l, 1.1, .8); S.line(P([[cx + sg * (sw + 22), yS - 74], [cx + sg * (sw - 30), yS + 44]]), '#e8e0cc', .8);
    S.line(P([pts[0], [pts[0][0] + sg * 5, pts[0][1] - 5]]), '#efe6d2', 3); }
  else { const pts = [[cx + sg * (sw - 4), yS - 104], [cx + sg * (sw + 20), yS - 60], [cx + sg * (sw + 18), yS - 10], [cx + sg * (sw - 2), yS + 30]]; S.line(curve(pts), wc.k, 6); S.line(curve(pts), wc.b, 4.4); S.line(curve(pts.map(p => [p[0] - 1.2, p[1]])), wc.l, 1, .8); S.line(P([pts[0], pts[3]]), '#e8e0cc', .8); }
}
export function drawQuiver(S, F, P0, sg = -1) {
  const { cx, yS, sw } = F, qc = cloth(P0.c || 'brown'), x = cx + sg * (sw - 26), y = yS - 26, fl = cloth(P0.fletch || 'white');
  for (let i = 0; i < (P0.n || 5); i++) { const ax = x + sg * (i * 4.4 - 6), ay = y - 30 - (i % 2) * 6 - (i % 3) * 2; S.line(P([[ax, ay], [ax + sg * -3, y + 4]]), '#c8b088', 1.6); S.both(blob([[ax - 3.4, ay + 1], [ax, ay - 12], [ax + 3.4, ay + 1], [ax + 2, ay + 10], [ax - 2, ay + 10]], .6), i % 2 ? fl.b : fl.s, fl.k, .6); }
  S.form(blob([[x - 12, y], [x + 12, y - 3], [x + 9 - sg * 8, y + 50], [x - 9 - sg * 8, y + 50]], .5), cel(qc), { in: s => { s.band([[x - 13, y + 5], [x + 13, y + 2]], 5, cloth(P0.trim || 'tan'), P0.motif || null, '#e8d9a8'); if (P0.fur) s.fill(rect(x - 14, y + 12, 28, 10), cloth(P0.fur).b); } });
}
// a shield: on the back (its rim behind one shoulder) or held low at one side
export function drawShield(S, F, P0, where = 'side', sg = -1) {
  const { cx, yS, sw, yW } = F, k = P0.kind, fc = cloth(P0.c || 'madder'), m = met(P0.m || 'iron');
  const c0 = where === 'back' ? [cx + sg * (sw + 6), yS + 40] : [cx + sg * (sw + 16), yW + 14], r = P0.r || (k === 'buckler' ? 34 : 52);
  if (k === 'round' || k === 'buckler') {
    const steel = k === 'buckler';
    S.form(circ(c0[0], c0[1], r), steel ? m : cel(fc), { sh: 1.6, in: s => {
      if (!steel) { if (P0.c2) { const c2 = cloth(P0.c2); if (P0.parts === 'quarter') s.fill(rect(c0[0], c0[1] - r, r, r) + rect(c0[0] - r, c0[1], r, r), c2.b); else s.fill(rect(c0[0], c0[1] - r, r, 2 * r), c2.b); } let pl = ''; for (let i = -3; i <= 3; i++) pl += `M${n1(c0[0] + i * r * .28)} ${n1(c0[1] - r)}v${n1(2 * r)}`; s.line(pl, fc.d, .7, .5); s.fill(blob([[c0[0] + r * .3, c0[1] - r], [c0[0] + r, c0[1] - r], [c0[0] + r, c0[1] + r], [c0[0] + r * .1, c0[1] + r], [c0[0] + r * .55, c0[1]]], .9), '#1a1424', .22); }
      else { glint(s, [[c0[0] - r * .6, c0[1] - r * .5], [c0[0] - r * .7, c0[1]], [c0[0] - r * .5, c0[1] + r * .5]], 2.4, m); if (P0.inlay) { s.line(circ(c0[0], c0[1], r * .62), met('gold').b, 1.6); let st = ''; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; st += `M${n1(c0[0] + Math.cos(a) * r * .3)} ${n1(c0[1] + Math.sin(a) * r * .3)}L${n1(c0[0] + Math.cos(a + .39) * r * .58)} ${n1(c0[1] + Math.sin(a + .39) * r * .58)}L${n1(c0[0] + Math.cos(a + .78) * r * .3)} ${n1(c0[1] + Math.sin(a + .78) * r * .3)}`; } s.line(st, met('gold').b, 1.1); } }
      if (P0.device) P0.device(s, c0[0], c0[1] - r * .46, r * .24);
    } });
    const rim = steel ? m : met(P0.rim || 'iron'); S.line(circ(c0[0], c0[1], r - 2), rim.k, 5); S.line(circ(c0[0], c0[1], r - 2), rim.b, 3.4); S.line(`M${n1(c0[0] - r + 2)} ${n1(c0[1])}a${n1(r - 2)} ${n1(r - 2)} 0 0 1 ${n1(r - 2)} ${n1(-r + 2)}`, rim.hi, 1.1, .9);
    S.form(circ(c0[0], c0[1], r * (steel ? .2 : .24)), rim, { sh: .7, in: s => s.fill(circ(c0[0] - r * .07, c0[1] - r * .08, r * .06), rim.hi) });
    if (steel) { let b = ''; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + .78; b += circ(c0[0] + Math.cos(a) * r * .5, c0[1] + Math.sin(a) * r * .5, r * .08); } S.both(b, met('gold').b, m.k, .7); }
    return;
  }
  if (k === 'tall') { // the south's shield: hide stretched on a frame, painted with the regiment's pattern, a spine of wood
    const w = 38, h = 96, c = [c0[0], c0[1] - 20]; const d = blob([[c[0], c[1] - h], [c[0] + w, c[1] - h * .4], [c[0] + w, c[1] + h * .4], [c[0], c[1] + h], [c[0] - w, c[1] + h * .4], [c[0] - w, c[1] - h * .4]], .95);
    S.form(d, cel(fc), { sh: 1.6, in: s => { const c2 = cloth(P0.c2 || 'cream'), c3 = cloth(P0.c3 || 'black'); for (let i = -4; i <= 4; i++) { const y = c[1] + i * 22; s.fill(PZ([[c[0] - w, y], [c[0], y - 14], [c[0] + w, y], [c[0] + w, y + 7], [c[0], y - 7], [c[0] - w, y + 7]]), i % 2 ? c2.b : c3.b, .9); } s.fill(rect(c[0] + w * .35, c[1] - h, w, 2 * h), '#1a1424', .2); } });
    wood(S, [c[0], c[1] - h - 10], [c[0], c[1] + h + 6], 4, '#5a4028'); const tc = cloth(P0.tuft || 'white'); S.both(blob([[c[0] - 4, c[1] - h - 10], [c[0] + 4, c[1] - h - 10], [c[0] + 7, c[1] - h - 24], [c[0], c[1] - h - 30], [c[0] - 7, c[1] - h - 24]], .7), tc.b, tc.k, .7);
    return;
  }
  if (k === 'kite') { const w = 36, c = [c0[0], c0[1] - 6]; S.form(blob([[c[0] - w, c[1] - 50], [c[0], c[1] - 58], [c[0] + w, c[1] - 50], [c[0] + w * .9, c[1] + 10], [c[0], c[1] + 90], [c[0] - w * .9, c[1] + 10]], [.5, 1, .5, 1, .4, 1]), cel(fc), { sh: 1.6, in: s => { if (P0.c2) s.fill(rect(c[0], c[1] - 60, w, 160), cloth(P0.c2).b); s.fill(rect(c[0] + w * .4, c[1] - 60, w, 160), '#1a1424', .2); if (P0.device) P0.device(s, c[0], c[1] - 14, 14); } }); }
}
// small things held in a hand: at p (the hand's middle), drawn before the fingers
export function drawHeld(S, p, P0, sg = 1) {
  const k = P0.kind, [x, y] = p, m = met(P0.m || 'iron');
  if (k === 'hammer') { wood(S, [x, y + 16], [x + sg * 2, y - 26], 4); S.form(blob([[x + sg * 2 - 12, y - 36], [x + sg * 2 + 12, y - 36], [x + sg * 2 + 12, y - 24], [x + sg * 2 - 12, y - 24]], .3), m, { in: s => glint(s, [[x + sg * 2 - 9, y - 33], [x + sg * 2 + 4, y - 33]], 1.4, m) }); }
  else if (k === 'tongs') { for (const dx of [-2.4, 2.4]) { S.line(P([[x + dx, y + 18], [x - dx * .6, y - 8], [x + dx * 1.6, y - 34]]), m.k, 3.4); S.line(P([[x + dx, y + 18], [x - dx * .6, y - 8], [x + dx * 1.6, y - 34]]), m.b, 1.9); } S.both(blob([[x - 7, y - 44], [x + 7, y - 44], [x + 6, y - 32], [x - 6, y - 32]], .5), '#f08a2a', '#7a2a10', 1); S.fill(blob([[x - 4, y - 42], [x + 4, y - 42], [x + 3, y - 36], [x - 3, y - 36]], .5), '#ffd98a'); }
  else if (k === 'sickle') { wood(S, [x, y + 12], [x, y - 10], 4); blade(S, [[x - 1.5, y - 10], [x - 4, y - 30], [x + sg * 14, y - 44], [x + sg * 30, y - 34], [x + sg * 14, y - 37], [x + 3, y - 26], [x + 1.6, y - 10]], m, { t: .9, glint: [[x - 1, y - 28], [x + sg * 12, y - 40]] }); }
  else if (k === 'scales') { const g = met(P0.m || 'bronze'); S.line(P([[x, y - 4], [x, y - 40]]) + P([[x - 20, y - 36], [x + 20, y - 36]]), g.k, 3); S.line(P([[x, y - 4], [x, y - 40]]) + P([[x - 20, y - 36], [x + 20, y - 36]]), g.b, 1.7); for (const dx of [-20, 20]) { S.line(P([[x + dx, y - 36], [x + dx - 7, y - 16]]) + P([[x + dx, y - 36], [x + dx + 7, y - 16]]), g.k, .8); S.both(`M${n1(x + dx - 9)} ${n1(y - 16)}h18a9 5.5 0 0 1 -18 0Z`, g.b, g.k, .8); } S.both(circ(x, y - 42, 2.4), g.b, g.k, .7); }
  else if (k === 'book') { const bc = cloth(P0.c || 'crimson'); S.form(blob([[x - 15, y - 20], [x + 13, y - 22], [x + 15, y + 14], [x - 13, y + 16]], .25), cel(bc), { in: s => { s.line(rect(x - 10, y - 15, 20, 26), '#c9a24a', 1); if (P0.sign) P0.sign(s, x, y - 2, 6); s.fill(rect(x + 11, y - 22, 6, 40), '#efe6d2'); } }); const g = met('bronze'); S.both(circ(x - 9, y - 14, 1.6) + circ(x + 8, y - 15, 1.6) + circ(x - 8, y + 10, 1.6) + circ(x + 9, y + 9, 1.6), g.b, g.k, .5); }
  else if (k === 'scroll') { S.both(blob([[x - 5, y - 22], [x + 5, y - 22], [x + 5, y + 18], [x - 5, y + 18]], .5), '#e8dcc0', '#4a3a24', .9); S.line(P([[x - 5, y - 4], [x + 5, y - 4]]), P0.c || '#8a2a22', 2.6); S.both(circ(x, y - 4, 3), P0.c || '#8a2a22', '#3a1410', .6); }
  else if (k === 'purse') { const pc = cloth(P0.c || 'tan'); S.form(blob([[x - 8, y - 8], [x + 8, y - 8], [x + 12, y + 8], [x, y + 15], [x - 12, y + 8]], .9), cel(pc), {}); S.both(blob([[x - 6, y - 14], [x + 6, y - 14], [x + 7, y - 7], [x - 7, y - 7]], .6), pc.b, pc.k, .8); S.line(P([[x - 7, y - 8], [x + 7, y - 8]]), P0.cord || '#c9a24a', 1.6); }
  else if (k === 'coins') { const g = met('gold'); let d = ''; for (const [dx, dy] of [[-5, -3], [1, -6], [6, -2], [-1, -1]]) d += elli(x + dx, y + dy - 6, 4, 2.2); S.both(d, g.b, g.k, .6); }
  else if (k === 'sheaf') { for (let i = 0; i < 9; i++) { const a = -1.57 + (i - 4) * .12, tip = [x + Math.cos(a) * 62, y + Math.sin(a) * 62]; S.line(P([[x + (i - 4) * 1.2, y + 20], tip]), '#b9923a', 1.6); S.both(sliver([[tip[0], tip[1] + 14], tip, [tip[0] + (i - 4) * .8, tip[1] - 12]], 5), '#e2bd58', '#6a4a14', .6); } S.line(P([[x - 9, y], [x + 9, y]]), '#8a6a34', 3.4); }
  else if (k === 'basket') { const bc = cloth('#b08a4a'); S.form(blob([[x - 20, y - 6], [x + 20, y - 6], [x + 15, y + 22], [x - 15, y + 22]], .5), cel(bc), { in: s => { let w = ''; for (let i = 0; i < 4; i++) w += `M${n1(x - 20)} ${n1(y + i * 7)}q10 -4 20 0t20 0`; s.line(w, bc.d, .9, .7); } }); if (P0.fill) { let f = ''; for (const dx of [-12, -4, 5, 13]) f += circ(x + dx, y - 9, 5.4); S.both(f, P0.fill, '#3a2410', .7); } }
  else if (k === 'sack') { const bc = cloth('hemp'); S.form(blob([[x - 20, y - 26], [x + 6, y - 34], [x + 24, y - 14], [x + 20, y + 14], [x - 16, y + 12]], .95), cel(bc), { in: s => { s.pen([[x - 8, y - 26], [x - 2, y - 6], [x - 10, y + 10]], 1.2, bc.d, { op: .6 }); if (P0.mark) P0.mark(s, x + 4, y - 8, 7); } }); S.line(P([[x + 2, y - 31], [x + 9, y - 27]]), '#5a4a30', 2.4); }
  else if (k === 'beads') { let d = ''; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; d += circ(x + Math.cos(a) * 7, y + 12 + Math.sin(a) * 11, 1.7); } S.both(d, P0.c || '#6a3a22', '#2a1a10', .5); S.both(blob([[x - 2, y + 23], [x + 2, y + 23], [x + 3, y + 34], [x - 3, y + 34]], .5), P0.c2 || '#8a2a22', '#2a1a10', .5); }
  else if (k === 'cup') { const g = met(P0.m || 'silver'); S.form(blob([[x - 8, y - 20], [x + 8, y - 20], [x + 5, y - 6], [x + 1.6, y - 3], [x + 1.6, y + 4], [x + 6, y + 7], [x - 6, y + 7], [x - 1.6, y + 4], [x - 1.6, y - 3], [x - 5, y - 6]], .5), g, { in: s => glint(s, [[x - 5, y - 18], [x - 3.6, y - 8]], 1.3, g) }); }
  else if (k === 'awl') { wood(S, [x, y + 8], [x, y - 8], 4.6, '#8a5a34'); S.line(P([[x, y - 8], [x + sg, y - 26]]), m.l, 1.6); }
  else if (k === 'chisel') { wood(S, [x, y + 10], [x, y - 10], 5, '#8a5a34'); S.both(PZ([[x - 2.2, y - 10], [x + 2.2, y - 10], [x + 3.4, y - 30], [x - 3.4, y - 30]]), m.b, m.k, .8); }
  else if (k === 'shuttle') { S.both(sliver([[x - 20, y - 4], [x, y - 7], [x + 20, y - 4]], 9), '#9a6a3a', '#3a2410', .9); S.fill(rect(x - 8, y - 9, 16, 5), P0.c || '#b8322a'); }
  else if (k === 'ledger') { S.both(PZ([[x - 14, y - 18], [x + 12, y - 20], [x + 14, y + 12], [x - 12, y + 14]]), '#e8dcc0', '#4a3a24', .9); let l = ''; for (let i = 0; i < 5; i++) l += `M${n1(x - 9)} ${n1(y - 12 + i * 5)}l18 -1.2`; S.line(l, '#6a5a44', .7); }
  else if (k === 'reins') { S.line(curve([[x, y], [x + sg * 20, y + 20], [x + sg * 50, y + 16]]), '#3a2a1c', 2.2); }
  else if (k === 'lasso') { S.line(circ(x, y + 14, 12) + circ(x + 2, y + 16, 9.5), '#8a7450', 2.2); S.line(circ(x, y + 14, 12), '#c2ac7c', .9); }
  else if (k === 'falcon') { const fc = cloth('#6a5240'); S.form(blob([[x - 6, y - 30], [x + 2, y - 36], [x + 9, y - 30], [x + 11, y - 12], [x + 5, y + 2], [x - 2, y - 2], [x - 8, y - 14]], .9), cel(fc), { in: s => { s.fill(blob([[x - 4, y - 24], [x + 6, y - 24], [x + 6, y - 8], [x - 2, y - 6]], .9), '#e8dcc0', .9); let b = ''; for (let i = 0; i < 4; i++) b += `M${n1(x - 2)} ${n1(y - 20 + i * 4)}h6`; s.line(b, fc.d, .9); } }); S.both(PZ([[x - 6, y - 31], [x - 11, y - 29], [x - 6, y - 27.6]]), '#e2b84a', '#3a2a10', .6); S.fill(circ(x - 2.4, y - 31, 1.2), '#1a1010'); const hd = cloth(P0.hood || 'crimson'); S.both(blob([[x - 3, y - 36], [x + 4, y - 38], [x + 7, y - 33], [x, y - 33]], .8), hd.b, hd.k, .6); }
}
