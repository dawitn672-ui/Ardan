// The manhwa layer · the profile card (owner order 57): a dark navy card with a thin gold edge; top left the realm's
// banner with its crest and name; a person from the waist up before the scene of their land and station; at the foot
// the station with its icon, three keywords and a motto. One call, one SVG string, the same for the same person.
//   card(person, { width, scene: true, text: true })   person: see peoples.js personOf()
//   figure(person, { width })                           the person alone on a plain ground (lists, small cards)
import { clamp, lerp, mixc, n1, stream, hsl, fromHsl } from '../g.js';
import { skinOf, HAIR, EYES, cloth } from '../palette.js';
import { Ink, pt, P, PZ, blob, curve, sliver, elli, circ, rect, cel } from './ink.js';
import { makeHead, faceOf, drawNeck, drawEars, drawHead, drawFace } from './head.js';
import { buildHair, drawHairBehind, drawHair, drawHairFall, drawBeard } from './locks.js';
import { makeFrame, armOf, drawArm, drawHand, drawGarment, torsoPts } from './body.js';
import { drawOver, drawBelt, drawMantle, drawNeckwear, met } from './wear.js';
import { drawHat, COVER, BROW } from './hats.js';
import { drawPole, drawHilt, drawKhanjar, drawBowBack, drawQuiver, drawShield, drawHeld } from './props.js';
import { drawScene } from './scenes.js';
import { kitFor, STATION_TEXT } from './peoples.js';

export const CARD = { w: 300, h: 480 };
const ZOOM = 1.13;                                              // the figure's size on the card (the reference crops close)
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const HAIR_OF = ['black', 'darkbrown', 'chestnut', 'tawny', 'darkblond', 'blond', 'flaxen', 'auburn', 'copper', 'silver', 'white', 'soot', 'ginger', 'ash'];
const EYES_OF = ['darkbrown', 'brown', 'hazel', 'blue', 'greyblue', 'grey', 'amber', 'black', 'green', 'sea', 'ice'];

// ---- small signs: a realm's charge, a station's icon (drawn in one colour inside a circle of radius r) -------------------
export const GLYPHS = {
  wolf: (x, y, r) => PZ([[x - r * .9, y - r * .9], [x - r * .35, y - r * .3], [x + r * .35, y - r * .3], [x + r * .9, y - r * .9], [x + r * .75, y + r * .1], [x + r * .3, y + r * .9], [x, y + r * .55], [x - r * .3, y + r * .9], [x - r * .75, y + r * .1]]),
  crescent: (x, y, r) => `M${n1(x - r * .1)} ${n1(y - r)}a${n1(r)} ${n1(r)} 0 1 0 ${n1(r * .9)} ${n1(r * 1.5)}a${n1(r * .8)} ${n1(r * .8)} 0 1 1 ${n1(-r * .9)} ${n1(-r * 1.5)}Z` + star(x + r * .45, y - r * .1, r * .32),
  bow: (x, y, r) => `M${n1(x - r * .5)} ${n1(y - r)}Q${n1(x + r * .9)} ${n1(y)} ${n1(x - r * .5)} ${n1(y + r)}L${n1(x - r * .3)} ${n1(y + r * .8)}Q${n1(x + r * .5)} ${n1(y)} ${n1(x - r * .3)} ${n1(y - r * .8)}Z` + PZ([[x - r, y - r * .08], [x + r * .6, y - r * .08], [x + r * .6, y - r * .3], [x + r, y], [x + r * .6, y + r * .3], [x + r * .6, y + r * .08], [x - r, y + r * .08]]),
  sun: (x, y, r) => { let d = circ(x, y, r * .45); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, b = a + .2, c = a - .2; d += PZ([[x + Math.cos(b) * r * .58, y + Math.sin(b) * r * .58], [x + Math.cos(a) * r, y + Math.sin(a) * r], [x + Math.cos(c) * r * .58, y + Math.sin(c) * r * .58]]); } return d; },
  tower: (x, y, r) => PZ([[x - r * .6, y + r], [x - r * .6, y - r * .5], [x - r * .8, y - r * .5], [x - r * .8, y - r], [x - r * .4, y - r], [x - r * .4, y - r * .7], [x - r * .15, y - r * .7], [x - r * .15, y - r], [x + r * .15, y - r], [x + r * .15, y - r * .7], [x + r * .4, y - r * .7], [x + r * .4, y - r], [x + r * .8, y - r], [x + r * .8, y - r * .5], [x + r * .6, y - r * .5], [x + r * .6, y + r]]),
  palm: (x, y, r) => PZ([[x - r * .1, y + r], [x - r * .06, y - r * .2], [x + r * .06, y - r * .2], [x + r * .1, y + r]]) + [-1, -.5, .5, 1].map(k => sliver([[x, y - r * .2], [x + k * r * .5, y - r * (.9 - Math.abs(k) * .2)], [x + k * r, y - r * (.3 - Math.abs(k) * .3)]], r * .3, { at: .5 })).join(''),
  anchor: (x, y, r) => circ(x, y - r * .75, r * .22) + PZ([[x - r * .08, y - r * .55], [x + r * .08, y - r * .55], [x + r * .08, y + r * .9], [x - r * .08, y + r * .9]]) + PZ([[x - r * .5, y - r * .3], [x + r * .5, y - r * .3], [x + r * .5, y - r * .15], [x - r * .5, y - r * .15]]) + `M${n1(x - r * .8)} ${n1(y + r * .3)}Q${n1(x)} ${n1(y + r * 1.4)} ${n1(x + r * .8)} ${n1(y + r * .3)}L${n1(x + r * .6)} ${n1(y + r * .3)}Q${n1(x)} ${n1(y + r * 1.05)} ${n1(x - r * .6)} ${n1(y + r * .3)}Z`,
  eagle: (x, y, r) => PZ([[x, y - r * .9], [x + r * .25, y - r * .5], [x + r, y - r * .7], [x + r * .7, y + r * .1], [x + r * .3, y + r * .1], [x + r * .35, y + r * .9], [x, y + r * .6], [x - r * .35, y + r * .9], [x - r * .3, y + r * .1], [x - r * .7, y + r * .1], [x - r, y - r * .7], [x - r * .25, y - r * .5]]),
  // stations
  hoe: (x, y, r) => PZ([[x - r * .1, y + r], [x - r * .1, y - r * .7], [x + r * .1, y - r * .7], [x + r * .1, y + r]]) + PZ([[x - r * .1, y - r * .9], [x + r * .8, y - r * .9], [x + r * .7, y - r * .4], [x - r * .1, y - r * .55]]),
  sheaf: (x, y, r) => [-.6, -.3, 0, .3, .6].map(k => sliver([[x + k * r * .2, y + r], [x + k * r * .7, y - r * .1], [x + k * r * 1.1, y - r]], r * .34, { at: .75 })).join('') + rect(x - r * .5, y + r * .2, r, r * .2),
  hammer: (x, y, r) => PZ([[x - r * .1, y + r], [x - r * .1, y - r * .3], [x + r * .1, y - r * .3], [x + r * .1, y + r]]) + rect(x - r * .7, y - r * .9, r * 1.4, r * .6),
  scales: (x, y, r) => rect(x - r * .06, y - r * .8, r * .12, r * 1.7) + rect(x - r * .9, y - r * .8, r * 1.8, r * .12) + `M${n1(x - r)} ${n1(y)}h${n1(r * .8)}a${n1(r * .4)} ${n1(r * .34)} 0 0 1 ${n1(-r * .8)} 0ZM${n1(x + r * .2)} ${n1(y)}h${n1(r * .8)}a${n1(r * .4)} ${n1(r * .34)} 0 0 1 ${n1(-r * .8)} 0Z` + rect(x - r * .4, y + r * .8, r * .8, r * .14),
  flame: (x, y, r) => `M${n1(x)} ${n1(y - r)}Q${n1(x + r * .9)} ${n1(y - r * .1)} ${n1(x + r * .55)} ${n1(y + r * .6)}Q${n1(x)} ${n1(y + r * 1.2)} ${n1(x - r * .55)} ${n1(y + r * .6)}Q${n1(x - r * .9)} ${n1(y)} ${n1(x - r * .2)} ${n1(y - r * .3)}Q${n1(x)} ${n1(y - r * .5)} ${n1(x)} ${n1(y - r)}Z`,
  shield: (x, y, r) => `M${n1(x - r * .75)} ${n1(y - r * .9)}H${n1(x + r * .75)}V${n1(y)}Q${n1(x + r * .7)} ${n1(y + r * .7)} ${n1(x)} ${n1(y + r)}Q${n1(x - r * .7)} ${n1(y + r * .7)} ${n1(x - r * .75)} ${n1(y)}Z`,
  sword: (x, y, r) => PZ([[x, y - r], [x + r * .16, y - r * .7], [x + r * .12, y + r * .3], [x - r * .12, y + r * .3], [x - r * .16, y - r * .7]]) + rect(x - r * .5, y + r * .3, r, r * .16) + rect(x - r * .08, y + r * .46, r * .16, r * .4) + circ(x, y + r * .92, r * .14),
  crown: (x, y, r) => PZ([[x - r * .9, y + r * .6], [x - r, y - r * .5], [x - r * .45, y], [x, y - r * .8], [x + r * .45, y], [x + r, y - r * .5], [x + r * .9, y + r * .6]]),
};
function star(x, y, r) { let d = ''; const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } return PZ(p); }
GLYPHS.star = star;
export const chargeFn = (name, col) => (s, x, y, r) => s.fill((GLYPHS[name] || GLYPHS.star)(x, y, r), col);

// ---- the person ---------------------------------------------------------------------------------------------------------
function drawPerson(S, p, kit, o = {}) {
  const male = p.sex !== 'F', app = p.app || {}, id = p.id || 'x', rf = stream(id, 'face'), cx = o.cx ?? 150 + (kit.dx || 0), y0 = o.y0 ?? 136;
  const sk = skinOf(app.skin), hc0 = HAIR[typeof app.hair === 'number' ? HAIR_OF[app.hair] : app.hair] || HAIR.darkbrown, iris = EYES[typeof app.eye === 'number' ? EYES_OF[app.eye] : app.eye] || EYES.brown, age = p.age ?? 30;
  const grey = clamp((age - 46) / 22), hc = grey > .75 ? HAIR.silver : grey > .3 ? { b: mixc(hc0.b, HAIR.grey.b, grey), s: mixc(hc0.s, HAIR.grey.s, grey), l: HAIR.grey.l, k: mixc(hc0.k, HAIR.grey.k, grey * .6) } : hc0;
  const build = { slight: -.8, lean: -.4, average: 0, sturdy: .5, heavy: 1 }[app.build] ?? 0;
  const Hd = makeHead({ cx, y0, male, age, face: faceOf(rf, male, age), yaw: kit.yaw ?? (rf() < .5 ? -1 : 1) * (.18 + rf() * .3), heavy: Math.max(0, build) * .6 });
  Hd.rHair = stream(id, 'hair');
  const F = makeFrame(Hd, { build, bx: cx - Hd.yaw * 3 }), hat = kit.hat, cover = hat ? COVER[hat.kind] ?? 1 : 0, ctx = { F, Hd };
  const H = buildHair(Hd, kit.hair || 'short', hc, Hd.rHair, { cover, recede: male ? grey * .8 : 0 });
  const G = kit.garment, coat = [kit.over2, kit.over].find(x => x && x.kind === 'coat'), armPal = kit.coatSleeves && coat ? cel(cloth(coat.c)) : G && G.cut !== 'drape' && G.cut !== 'wrap' ? cel(cloth(G.c), { deep: G.deep }) : null;
  const sleeve = kit.sleeves || {}, arms = [armOf(F, -1, kit.poseL || 'down'), armOf(F, 1, kit.poseR || 'down')];
  const tr = t => (t ? { w: t.w || 5, pal: cloth(t.c), motif: t.motif, c2: t.c2 || cloth(t.c).l } : null);
  const arm = A => { const side = A.sg < 0 ? 'L' : 'R', bare = G && (G.cut === 'wrap' || (G.cut === 'drape' && A.sg !== (G.side || -1))), kind = bare ? 'none' : (sleeve.kind || (G && G.cut === 'drape' ? 'none' : 'long'));
    drawArm(S, F, A, { sk, sleeve: armPal ? kind : 'none', pal: armPal, g: kit.coatSleeves ? 2 : 0, trim: tr(sleeve.trim), armBand: tr(sleeve.armBand), band: (kit.bands || {})[side] || kit.bands && kit.bands.both, patch: sleeve.patch && A.sg === (sleeve.patchSide || -1) ? sleeve.patch : null });
    const pole = kit.pole && kit.pole.hand === A.sg ? kit.pole : null, held = kit['held' + side];
    if (pole) drawPole(S, A.W[0] + A.dir[0] * 7, pole.above != null ? A.W[1] - pole.above : pole.top ?? 30, pole.below != null ? A.W[1] + pole.below : 520, pole);
    const c = [A.W[0] + A.dir[0] * 7 * F.hand, A.W[1] + A.dir[1] * 7 * F.hand];
    if (held && !held.over) drawHeld(S, c, held, A.sg);
    drawHand(S, F, A, sk, { glove: kit.glove ? cloth(kit.glove) : null });
    if (held && held.over) drawHeld(S, c, held, A.sg);
    if (kit.wrist && kit.wrist[side]) { const b = kit.wrist[side]; drawArmBandAt(S, A, b); } };
  const active = A => A.pose !== 'down';
  // ---- behind
  for (const b of kit.back || []) { if (b.k === 'bow') drawBowBack(S, F, b, b.side ?? 1); else if (b.k === 'quiver') drawQuiver(S, F, b, b.side ?? -1); else if (b.k === 'shield') drawShield(S, F, b, 'back', b.side ?? -1); else if (b.k === 'pole') drawPole(S, cx + (b.side ?? 1) * (F.sw + (b.dx ?? 14)), b.top ?? 26, 520, b); }
  drawMantle(S, F, kit.mantle, 'back', sk, ctx); drawHat(S, Hd, hat, 'back', ctx); drawHairBehind(S, Hd, H, F);
  // ---- the body
  drawNeck(S, Hd, sk, F);
  if (!G || G.cut === 'drape' || G.cut === 'wrap' || G.bare) { const tp = torsoPts(F, -1);
    S.form(blob(tp, tp.map((_, i) => (i === 7 || i === 8 ? .1 : i === 0 || i === 15 ? .5 : 1))), { b: sk.b, s: sk.s, k: sk.k, rim: sk.l }, { rim: false, in: s => { const { yS, cw, ww, yW } = F, x = F.cx; s.fill(blob([[x - F.neckW - 8, yS - 12], [x + F.neckW + 16, yS - 12], [x + F.neckW + 22, yS + 4], [x + 10, yS + 20], [x - 6, yS + 12]], .9), sk.s, .9);
      for (const sg of [-1, 1]) s.pen([[x + sg * 5, yS + 5], [x + sg * (cw * .45), yS + 1], [x + sg * (cw * .82), yS + 5]], 1, sk.d, { op: .55 });
      if (male) { s.pen([[x - cw * .8, yS + 46], [x - cw * .4, yS + 56], [x - 3, yS + 50]], 1.2, sk.d, { op: .5 }); s.pen([[x + cw * .8, yS + 46], [x + cw * .4, yS + 56], [x + 3, yS + 50]], 1.2, sk.d, { op: .5 }); s.pen([[x, yS + 20], [x + .6, yS + 50]], .9, sk.d, { op: .4 }); s.pen([[x, yS + 62], [x + .6, yW]], .9, sk.d, { op: .35 }); } } }); }
  if (G) drawGarment(S, F, G, sk, ctx);
  drawOver(S, F, kit.over, sk, ctx);
  if (kit.over2) drawOver(S, F, kit.over2, sk, ctx);
  drawBelt(S, F, kit.belt, ctx);
  if (kit.khanjar) drawKhanjar(S, F, kit.khanjar);
  if (kit.hilt) drawHilt(S, F, kit.hilt, kit.hilt.side ?? -1);
  if (kit.shield) drawShield(S, F, kit.shield, 'side', kit.shield.side ?? -1);
  for (const A of arms) if (!active(A)) arm(A);
  drawMantle(S, F, kit.mantle, 'front', sk, ctx);
  if (kit.mantle2) drawMantle(S, F, kit.mantle2, 'front', sk, ctx);
  drawNeckwear(S, F, kit.neck, ctx);
  drawHairFall(S, Hd, H, F, { tie: kit.hairTie, cuffs: kit.hairCuffs });
  // ---- the head
  drawEars(S, Hd, sk, { ring: kit.earrings, hide: () => cover === 2 || (hat && ['hood', 'cowl', 'veil', 'headcloth', 'wimple', 'coif', 'kerchief'].includes(hat.kind)) });
  drawHead(S, Hd, sk, { browShade: hat ? BROW[hat.kind] ?? -21 : H.capD ? (H.st.fringe ? -19 : -24) : false, in: kit.paint ? s => kit.paint(s, Hd, sk) : null });
  drawFace(S, Hd, sk, iris, hc, { mood: kit.mood, kohl: kit.kohl });
  if (male) drawBeard(S, Hd, kit.beard, hc, sk, rf);
  drawHair(S, Hd, H, { tie: kit.hairTie });
  drawHat(S, Hd, hat, 'front', ctx);
  for (const A of arms) if (active(A)) arm(A);
  return { Hd, F };
}
function drawArmBandAt(S, A, b) { const m = met(b.m || 'bronze'), at = [A.W[0] - A.dir[0] * 6, A.W[1] - A.dir[1] * 6], n = [-A.dir[1], A.dir[0]], r = b.r || 8; for (let i = 0; i < (b.n || 1); i++) { const c = [at[0] - A.dir[0] * i * 4, at[1] - A.dir[1] * i * 4], q = [[c[0] + n[0] * r, c[1] + n[1] * r], [c[0] - n[0] * r, c[1] - n[1] * r]]; S.line(P(q), m.k, 4.2); S.line(P(q), m.b, 2.8); S.line(P([q[1], [(q[0][0] + q[1][0]) / 2, (q[0][1] + q[1][1]) / 2]]), m.hi, 1, .9); } }

// ---- the card -----------------------------------------------------------------------------------------------------------
const NAVY = '#0d1730', GOLD = '#c9a24a', GOLD_L = '#f0d890', GOLD_D = '#7a5a1c';
export function card(p, o = {}) {
  const kit = p.kit || kitFor(p), id = (o.id || p.id || 'c') + '_', S = new Ink(id), W = CARD.w, Hh = CARD.h, realm = p.realm || {}, st = STATION_TEXT[p.station] || {};
  const text = { ...st, ...(kit.text || {}), ...(p.text || {}) };
  const clip = S.clipId(`M7 7h${W - 14}v${Hh - 14}h${-(W - 14)}Z`);
  S.put(`<rect width="${W}" height="${Hh}" rx="7" fill="${NAVY}"/>`);
  // the scene, a little out of focus so the figure stands off it
  const scene = o.scene === false ? '' : S.sub(s => drawScene(s, { land: kit.land || p.land || 'north', place: kit.place || 'field', mix: kit.mixLand, seed: (p.sceneSeed || realm.name || 'r'), flag: realm.color }));
  const rimId = S.uid();
  // the light behind the sitter: a thin warm edge down the far side of the whole figure (one cheap filter: no blur)
  if (o.rim !== false) S.defs.push(`<filter id="${rimId}" x="0" y="0" width="${W}" height="${Hh}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feOffset in="SourceAlpha" dx="-2.4" dy=".8" result="o"/><feComposite in="SourceAlpha" in2="o" operator="out" result="e"/><feFlood flood-color="${o.rimColor || '#fff2cf'}" flood-opacity=".85"/><feComposite in2="e" operator="in" result="r"/><feOffset in="SourceAlpha" dx="2.6" dy="1.4" result="o2"/><feComposite in="SourceAlpha" in2="o2" operator="out" result="e2"/><feFlood flood-color="#ffffff" flood-opacity=".28"/><feComposite in2="e2" operator="in" result="r2"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="r2"/><feMergeNode in="r"/></feMerge></filter>`);
  const fig = `<g${o.rim !== false ? ` filter="url(#${rimId})"` : ''} transform="translate(${n1(150 - 150 * ZOOM)} ${n1(128 - 128 * ZOOM)}) scale(${ZOOM})">` + S.sub(s => drawPerson(s, p, kit, o)) + '</g>';
  S.put(`<g clip-path="url(#${clip})">` + (scene ? `<g${o.blur === false ? '' : ` filter="${S.blur(o.blur || .9)}"`}>${scene}</g>` : `<rect width="${W}" height="${Hh}" fill="${S.lin(0, 0, 0, Hh, [[0, '#4a5a80'], [1, '#1a2440']])}"/>`)
    + `<rect width="${W}" height="${Hh}" fill="${S.lin(0, 0, 0, 150, [[0, NAVY, .55], [1, NAVY, 0]])}"/>` + fig
    + `<rect y="300" width="${W}" height="${Hh - 300}" fill="${S.lin(0, 322, 0, 398, [[0, NAVY, 0], [.55, NAVY, .82], [1, NAVY, .97]])}"/></g>`);
  if (o.text !== false) {
    // the banner: a pennon in the realm's colour, its charge on it, the name beside
    const rc = realm.color || '#2a3a6a', rd = mixc(rc, '#000010', .45);
    S.put(`<rect x="7" y="13" width="${150}" height="30" fill="${S.lin(7, 0, 157, 0, [[0, NAVY, .9], [.7, NAVY, .7], [1, NAVY, 0]])}"/>`);
    S.put(`<path d="M13 7h34v58l-17 -11l-17 11Z" fill="${rc}" stroke="${GOLD}" stroke-width="1.3"/><path d="M30 7v47l17 11v-58Z" fill="${rd}" opacity=".45"/><path d="M16 10h28v49l-14 -9l-14 9Z" fill="none" stroke="${GOLD_L}" stroke-width=".5" opacity=".7"/>`);
    S.fill((GLYPHS[realm.device] || GLYPHS.star)(30, 29, 10.5), realm.charge || GOLD_L);
    S.put(`<text x="56" y="34" font-family="Cinzel, 'Trajan Pro', Georgia, serif" font-weight="600" font-size="17.5" fill="#fff8e6" stroke="${NAVY}" stroke-width="2.4" paint-order="stroke" letter-spacing=".3">${esc(realm.short || realm.name || '')}</text>`);
    if (p.where) S.put(`<text x="57" y="48" font-family="Literata, Georgia, serif" font-style="italic" font-size="9.4" fill="${GOLD_L}" stroke="${NAVY}" stroke-width="2" paint-order="stroke">${esc(p.where)}</text>`);
    // the foot: the station's icon in a gold ring, its name, three keywords, a motto
    const y = 402;
    if (p.name) S.put(`<text x="20" y="${y - 27}" font-family="Cinzel, Georgia, serif" font-weight="600" font-size="11" letter-spacing="1.1" fill="${GOLD_L}">${esc(p.name.toUpperCase())}${p.age ? `<tspan font-family="Literata, Georgia, serif" font-size="9.5" letter-spacing="0" fill="#c8cde0">  ·  ${esc(String(p.age))}</tspan>` : ''}</text>`);
    S.put(`<circle cx="33" cy="${y - 5}" r="13.5" fill="${NAVY}" stroke="${GOLD}" stroke-width="1.5"/><circle cx="33" cy="${y - 5}" r="11" fill="none" stroke="${GOLD_D}" stroke-width=".6"/>`);
    S.fill((GLYPHS[text.icon] || GLYPHS.star)(33, y - 5, 7.4), GOLD_L);
    S.put(`<text x="54" y="${y + 2}" font-family="Cinzel, Georgia, serif" font-weight="600" font-size="20" fill="#ffffff">${esc(text.label || p.station || '')}</text>`);
    S.put(`<path d="M20 ${y + 15}h${W - 40}" stroke="${GOLD}" stroke-width=".7" opacity=".7"/><path d="M${W / 2 - 3} ${y + 15}l3 -3l3 3l-3 3Z" fill="${GOLD}"/>`);
    S.put(`<text x="${W / 2}" y="${y + 34}" text-anchor="middle" font-family="Literata, Georgia, serif" font-size="11.2" fill="#e6dcc0" letter-spacing=".2">${(text.keys || []).map(esc).join('<tspan fill="' + GOLD + '">  ·  </tspan>')}</text>`);
    S.put(`<text x="${W / 2}" y="${y + 54}" text-anchor="middle" font-family="Literata, Georgia, serif" font-style="italic" font-size="11.6" fill="#ffffff">${esc(text.motto || '')}</text>`);
  }
  // the gold edge: one line, a hair line inside it, a small lozenge at each corner
  S.put(`<rect x="3.2" y="3.2" width="${W - 6.4}" height="${Hh - 6.4}" rx="5" fill="none" stroke="${GOLD}" stroke-width="1.5"/><rect x="6.6" y="6.6" width="${W - 13.2}" height="${Hh - 13.2}" rx="3" fill="none" stroke="${GOLD_L}" stroke-width=".5" opacity=".65"/>`);
  let cn = ''; for (const [x, y] of [[W - 7, 7], [7, Hh - 7], [W - 7, Hh - 7]]) cn += `M${x - 4} ${y}l4 -4l4 4l-4 4Z`; S.fill(cn, GOLD);
  const width = o.width || W;
  return { svg: S.svg([0, 0, W, Hh], { w: Math.round(width), h: Math.round(width * Hh / W), label: esc((p.name ? p.name + ', ' : '') + (text.label || '') + (realm.short ? ' of ' + realm.short : '')), cls: o.cls }), shapes: S.shapes, kit };
}
// the person alone: for a list row, a small card, a scene (no frame, no text; the ground is the caller's)
export function figure(p, o = {}) {
  const kit = p.kit || kitFor(p), S = new Ink((o.id || p.id || 'f') + '_'); drawPerson(S, p, kit, o);
  const vb = o.crop === 'bust' ? [60, 60, 180, 180] : [0, 40, 300, 400], width = o.width || vb[2];
  return { svg: S.svg(vb, { w: Math.round(width), h: Math.round(width * vb[3] / vb[2]), cls: o.cls }), shapes: S.shapes, kit };
}
