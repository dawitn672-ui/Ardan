// The legendaries on the figure. The game's figure library (src/ui/engine/figure, read and not changed) dresses a person
// from a list of gear items, each a function that draws one thing on the rig into the layer it belongs to. Here one more
// item is added to that table at run time, `legend`: it stands the piece's own record on the rig at its carry point
// (planted, borne, across the body, raised, held as a pole, at the port, on its stand, slung on the back) and draws it
// with the same scene, light and line as the person. The record is the one the plate is drawn from, at a lower level of
// detail (D.lod 1: outline, metals, accent, one glint). This is the shape the game's own item would take; see
// legendaries.md, "On the figure".
import { compose, POSES, ITEMS } from '../../../../src/ui/engine/figure/index.js';
import { makeRig } from '../../../../src/ui/engine/figure/rig.js';
import { Scene, frame, stream, add, sub, mul, MET, WOOD, piece, line, beads } from './kit.mjs';
import { LEGENDS, CARRY } from './index.mjs';

const BY = Object.fromEntries(LEGENDS.map(d => [d.id, d]));
const dirOf = deg => [Math.cos(deg * Math.PI / 180), Math.sin(deg * Math.PI / 180)];
const palm = (F, i) => add(F.arm[i].wr, mul(F.arm[i].dirF, F.handL * .4));
const L = F => F.look.lg || {};

// stances for carrying a great piece: where each wrist goes, as the library's own stances say it
Object.assign(POSES, {
  lgPlant: { name: 'Hands on a tall sword', sway: .05, wide: .15, arm: [{ to: F => [F.cx - F.H * .011, L(F).y - F.handL * .42 - 4], fs: [.98, .94] }, { to: F => [F.cx + F.H * .011, L(F).y - F.handL * .42 - 12], fs: [.98, .94] }], hand: ['rest', 'rest'], planted: true },
  lgBear: { name: 'A bearing sword at the shoulder', sway: .3, wide: .13, arm: [{ to: F => [F.cxS - F.chestHalf * 1.02, F.y.waist - F.B * .01], fs: [.95, .9] }, { to: F => [F.cxS - F.chestHalf * .94, F.y.waist + F.B * .1], fs: [.99, .97] }], hand: ['fist', 'fist'] },
  lgAcross: { name: 'A drawn blade across the body', sway: -.4, wide: .13, arm: [{ to: F => [F.cx - F.H * .112, -F.H * .535], fs: [.97, .9] }, { hang: [9, 10] }], hand: ['fist', 'relaxed'] },
  lgRaise: { name: 'A knife in the hand', sway: .4, wide: .12, arm: [{ to: F => [F.cxS - F.chestHalf * 1.02, F.y.chest + F.B * .07], fs: [.9, .8] }, { to: F => [F.cxS + F.neckHalf * .4, F.pit[1] + F.Hh * .3], fs: [.9, .8] }], hand: ['fist', 'relaxed'] },
  lgPole: { name: 'A pole arm at the side', sway: .8, wide: .13, arm: [{ to: F => [F.sh[0][0] + F.H * (L(F).px ?? .026), L(F).py != null ? L(F).py * F.H : F.y.chest + F.B * .02], fs: [.9, .82] }, { hang: [10, 10] }], hand: ['fist', 'relaxed'] },
  lgPort: { name: 'At the port', sway: .2, wide: .15, arm: [{ to: F => [F.cxS - F.chestHalf * .7, F.y.chest + F.B * .035], fs: [.92, .82] }, { to: F => add([F.cxS - F.chestHalf * .7, F.y.chest + F.B * .035], mul(dirOf(L(F).deg), -L(F).span)), fs: [.96, .9] }], hand: ['fist', 'fist'] },
});
const POSE_OF = { plant: 'lgPlant', bear: 'lgBear', across: 'lgAcross', raise: 'lgRaise', pole: 'lgPole', port: 'lgPort' };

// the item: C is the library's own drawing context { S, F, ... }; o: { u: the piece's id, mode, ... }
ITEMS.legend = (C, o) => {
  const def = BY[o.u]; if (!def) return;
  const { S, F } = C; let G, deg, layer = 'propFront';
  if (o.mode === 'plant') { deg = 90; G = [F.cx, 12 - o.tip]; }
  else if (o.mode === 'bear') { deg = -90; const p = palm(F, 0); G = [p[0], p[1] - o.above]; }
  else if (o.mode === 'across' || o.mode === 'raise') { deg = o.deg; G = add(palm(F, 0), mul(dirOf(deg), o.grip)); }
  else if (o.mode === 'pole') { deg = -90; G = [palm(F, 0)[0], o.base || 0]; }
  else if (o.mode === 'port') { deg = o.deg; G = sub(palm(F, 0), mul(dirOf(deg), o.at)); }
  else if (o.mode === 'stand') { deg = o.deg ?? -90; G = [F.cx + o.dx * F.H, o.dySh != null ? F.y.sh + o.dySh * F.H : -(o.lift || 0)]; layer = 'back'; }
  else { deg = o.deg; G = sub([F.cxS + o.dx * F.H, F.y.sh + o.dy * F.H], mul(dirOf(deg), o.at || 700)); layer = 'propBack'; }
  const sc = new Scene(S.id + 'lg', { px: S.px, lod: 1 }); sc.view = S.view; sc.minPx = S.minPx; sc.coarse = 1;
  const D = { S: sc, F: frame(G, deg), id: def.id, lod: 1, sil: [], r: ch => stream(def.id, ch), unstrung: !!o.unstrung };
  // what it hangs on, when nobody holds it: iron brackets in a strongroom wall, or two pegs of wood
  for (const u of (o.brackets || [])) { piece(D, [[u - 9, -34], [u + 9, -34], [u + 9, 34], [u - 9, 34]], MET.iron, { poly: .2, shade: 'cross', layer: 'under' }); sc.layer('under'); beads(D, [[u, -27], [u, 27]], 3, MET.iron); }
  for (const u of (o.pegs || [])) piece(D, [[u - 7, -4], [u + 7, -4], [u + 9, 26], [u - 9, 26]], WOOD.oak, { poly: .3, shade: 'cross', turn: 'round', layer: 'under' });
  def.draw(D);
  S.layer(layer); S.raw(sc.body(['under', 'main', 'over', 'top', 'fx'])); for (const df of sc.defs) S.defs.push(df); S.shapes += sc.shapes;
};

// the look of the person who has it, with the piece on its list of gear
function lookOf(def) {
  const c = CARRY[def.id], { look: lk, ground, who, note, zoom, ...carry } = c, look = { id: 'lg-' + def.id, name: who, ...lk };
  if (POSE_OF[c.mode]) look.pose = POSE_OF[c.mode];
  look.lg = { y: c.mode === 'plant' ? 12 - c.tip - c.top : 0, deg: c.deg, span: c.span, py: c.py, px: c.px };
  look.gear = [...lk.gear, { id: 'legend', u: def.id, ...carry }];
  return look;
}
// one piece, carried: a profile-card crop of the person who has it (or stands beside it)
export function portrait(def, o = {}) {
  const c = CARRY[def.id], look = lookOf(def), t0 = performance.now();
  const R = compose(look, { crop: o.crop || { w: 3.7, h: 6.1, top: .5, lod: 2 }, width: o.width || 300, tier: o.tier ?? 2, ground: { a: c.ground[0], b: c.ground[1] }, id: (o.id || 'pf') + def.no, label: c.who + ', with ' + def.name });
  return { ...R, ms: performance.now() - t0 };
}
// the same drawing, closer: a square of the portrait where the piece is. c.zoom: [x, y, size] of that square, in
// heights of the figure (x from the body's middle, y up from the ground is negative). The library frames a picture
// on the head, so a wider one is drawn and the square is cut from it by the page.
export function closer(def, size = 400) {
  const c = CARRY[def.id], look = lookOf(def), F = makeRig(look), z = c.zoom, half = z[2] * F.H / 2, xc = z[0] * F.H, yc = z[1] * F.H, hx = F.headX ?? F.cxS;
  const wmm = 2 * (Math.abs(xc - hx) + half), k = size / (2 * half);
  const R = compose(look, { crop: { w: wmm / F.Hh, h: 2 * half / F.Hh, top: (-F.H - yc + half) / F.Hh, lod: 2 }, width: Math.round(wmm * k), tier: 2, ground: { a: c.ground[0], b: c.ground[1] }, id: 'pz' + def.no, label: def.name + ', in the portrait' });
  return { ...R, size, dx: Math.round(((xc - half) - (hx - wmm / 2)) * k) };
}
