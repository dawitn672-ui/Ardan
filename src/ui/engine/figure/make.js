// The figure library · make and rarity, and the paint they share. Split from gear.js (owner order 52) so that dress and
// armour (gear.js) and arms (arms.js) read one table. Nothing here touches the page.
import { clamp, add, sub, mul, norm, perp, len, along, mixc, n1 } from './g.js';
import { metal } from './palette.js';

// ---------------------------------------------------------------- paint ---------------------------------------------
export const leftRight = (p, q) => (p[0] <= q[0] ? [p, q] : [q, p]);
// soft tone across a form: light on the screen-left edge, shadow on the right (the one light of the page)
export function tone(S, d, m, a, b, o = {}) {
  S.fill(d, S.lin(a, b, [[0, m.l, o.hi ?? .5], [.28, m.l, 0], [.5, m.s, 0], [1, m.s, o.sh ?? .95]]));
}
// polished plate: hard bands of light and dark across the form
export function steel(S, d, m, a, b, o = {}) {
  S.fill(d, S.lin(a, b, [[0, m.s], [.07, m.b], [.2, m.l], [.27, m.hi], [.34, m.hi], [.35, m.b], [.58, m.s], [.8, m.d], [.92, m.d], [1, m.s]]));
  if (o.sky) S.fill(d, S.lin(o.sky[0], o.sky[1], [[0, m.hi, .5], [.4, m.hi, 0], [1, m.d, .45]]));
}
// an edging inside a shape's border: a band of trim with a dark line on its inner side
export function edging(S, d, m, px, lw = .8) { S.within(d, () => { S.stroke(d, m.k, (px + lw) * 2); S.stroke(d, m.b, px * 2); S.stroke(d, m.l, px * .7, { op: .7 }); }); }
// engraved scrollwork along a line
export function scrolls(S, pts, size, col, op = .9) {
  const n = Math.max(2, Math.round(len(sub(pts[0], pts[pts.length - 1])) / (size * 2.2))); let d = '';
  for (let i = 0; i < n; i++) { const t = (i + .5) / n, p = along(pts, t), tg = norm(sub(along(pts, Math.min(1, t + .02)), along(pts, Math.max(0, t - .02)))), nn = perp(tg), sg = i % 2 ? 1 : -1;
    const a = add(p, mul(tg, -size)), b = add(p, mul(tg, size)), c1 = add(p, add(mul(tg, -size * .2), mul(nn, sg * size * 1.1))), c2 = add(p, add(mul(tg, size * .9), mul(nn, sg * size * .9))), e = add(p, add(mul(tg, size * .35), mul(nn, sg * size * .25)));
    d += `M${n1(a[0])} ${n1(a[1])}Q${n1(c1[0])} ${n1(c1[1])} ${n1(b[0])} ${n1(b[1])}Q${n1(c2[0])} ${n1(c2[1])} ${n1(e[0])} ${n1(e[1])}`; }
  S.stroke(d, col, .9, { op });
}
export const rivets = (S, pts, n, r, m) => { let d = ''; for (let i = 0; i < n; i++) { const p = along(pts, (i + .5) / n); d += `M${n1(p[0] - r)} ${n1(p[1])}a${n1(r)} ${n1(r)} 0 1 0 ${n1(2 * r)} 0a${n1(r)} ${n1(r)} 0 1 0 ${n1(-2 * r)} 0`; } S.fill(d, m.l); S.stroke(d, m.k, .6); };

// ---------------------------------------------------------------- make and rarity -----------------------------------
// Two measures on every piece of arms and armour. MAKE (q: 0 crude, 1 plain, 2 fine, 3 masterwork) is the smith's
// care: finish, edging, engraving. RARITY (r: 0 basic, 1 rare, 2 epic, 3 legendary: the one ladder's first four, data/rarity.json, D-200) is what the thing is: its metal and
// its own shape. A basic masterwork blade is bright steel, gilt and engraved; a rare plain one is blued and bare.
export const MAKES = ['Crude', 'Plain', 'Fine', 'Masterwork'], RARITIES = ['Basic', 'Rare', 'Epic', 'Legendary'];
export const PLATE = [['iron', 'steel', 'steel', 'bright'], ['blued', 'blued', 'blued', 'blued'], ['black', 'black', 'black', 'black'], ['sunsteel', 'sunsteel', 'sunsteel', 'sunsteel']];
export const FIT = [['iron', 'iron', 'bronze', 'gold'], ['iron', 'bronze', 'silver', 'gold'], ['bronze', 'bronze', 'gold', 'gold'], ['gold', 'gold', 'gold', 'gold']];
export const dull = m => ({ b: mixc(m.b, '#6d655d', .45), s: mixc(m.s, '#48423d', .4), d: m.d, l: mixc(m.l, m.b, .65), hi: mixc(m.hi, m.b, .75), k: m.k });
export function mats(o = {}) {
  const q = clamp(o.q ?? 1, 0, 3), r = clamp(o.r || 0, 0, 3); let st = metal(o.metal || PLATE[r][q]); if (q === 0) st = dull(st);
  return { q, r, st, fit: metal(FIT[r][q]), edge: q > 1 || r > 1, scroll: q > 2 || r > 2, rivet: q < 2 && r < 2 };
}
export const GEM = ['#9c1f2c', '#2f5fa8', '#6a2f9c', '#f2c94c'];
