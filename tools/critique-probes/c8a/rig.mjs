// C8a throwaway prototype (not the game's code): a 2.5D landmark rig for a head.
// Landmarks live in 3D head space (skull 100 wide, x right, y down, z toward the viewer). Genes move landmarks, the head is
// turned by a yaw and projected flat, and every line and shadow is drawn through projected landmarks.
// Purpose: check that the planned gene ranges give faces that are told apart with the hair cropped, and what a head costs.

const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
const R = n => { const r = Math.round(n * 10) / 10; return String(r).replace(/^(-?)0\./, '$1.'); };

// ---- the base head: a man of thirty. [x, y, z]; paired landmarks are given for the +x side
export const BASE = {
  // midline
  F0: [0, 26, 47], G: [0, 50, 52], N: [0, 56, 49], NB: [0, 66, 55], NT: [0, 77, 65], SN: [0, 80.5, 53],
  UL: [0, 86, 55], M: [0, 89, 53.5], LL: [0, 92.5, 54.5], CC: [0, 97, 50.5], PG: [0, 104, 53], ME: [0, 110.5, 45],
  // paired: brow, eye
  BI: [7, 50.5, 51], BP: [19, 47.5, 47], BO: [30, 50.5, 37],
  EI: [8.5, 58.4, 44.5], EO: [27, 57.4, 36.5], ET: [17.5, 54.6, 45.5], EB: [17.5, 61.2, 44],
  // paired: the front plane's edge (seen from the side) and the side outline (seen from the front)
  FH: [35, 28, 28], TE: [44.5, 47, 12], ZY: [39, 68, 21], CF: [25, 74, 41], CM: [21, 91, 43],
  GO: [36, 97, -3], JM: [27, 105, 21], CS: [11, 109.5, 41],
  AL: [9.6, 78.5, 49], MC: [11.5, 89.6, 46.5],
  EAT: [48.5, 55, -9], EAB: [46.5, 81, -7],
};

// ---- genes: 17 single genes in -1..1. Each is a list of [landmark, dx, dy, dz] at v = +1 (paired landmarks move both sides)
export const GENES = {
  faceLen:    { scaleY: 0.15 },                               // everything below the brow, about y = 50
  jawW:       { mv: [['GO', 6.5, 0, 0], ['JM', 5, 0, 0], ['CM', 1.5, 0, 0]] },
  jawSq:      { mv: [['GO', 1.5, 5, 0], ['JM', 3.2, 1.6, 0]] },
  chin:       { mv: [['PG', 0, 2.5, 5], ['ME', 0, 4, 3], ['CS', 0, 3, 2], ['CC', 0, 1, 0]] },
  cheek:      { mv: [['ZY', 4.5, -2, 3], ['CF', 1, 0, 2.5]] },
  browRidge:  { mv: [['G', 0, 1, 3.2], ['BI', 0, 1.6, 3], ['BP', 0, 1.4, 2.6], ['BO', 0, .8, 1.5], ['F0', 0, 0, -3]] },
  eyeSize:    { eye: 0.17 },
  eyeGap:     { mv: [['EI', 2.6, 0, 0], ['EO', 2.6, 0, 0], ['ET', 2.6, 0, 0], ['EB', 2.6, 0, 0], ['BI', 1.6, 0, 0]] },
  eyeTilt:    { mv: [['EO', 0, -2.7, 0], ['EI', 0, .7, 0]] },
  lid:        { mv: [['ET', 0, -1.5, 0], ['EB', 0, .6, 0]] },
  browShape:  { mv: [['BP', 0, -3.2, 0], ['BO', 0, 1.6, 0], ['BI', 0, .8, 0]] },
  noseLen:    { mv: [['NT', 0, 4.6, 0], ['SN', 0, 4.6, 0], ['AL', 0, 4.4, 0], ['UL', 0, 1.6, 0], ['M', 0, 1.6, 0], ['LL', 0, 1.6, 0], ['MC', 0, 1.6, 0], ['NB', 0, 2, 0]] },
  noseBridge: { mv: [['NB', 0, 0, 3.6], ['N', 0, 0, 1.2]] },
  noseTip:    { mv: [['NT', 0, 2.6, -1], ['SN', 0, -1.3, 0]] },
  noseW:      { mv: [['AL', 3.1, 0, 0]], bulb: 0.4 },
  mouthW:     { mv: [['MC', 2.8, 0, 0]] },
  lips:       { lips: 0.62 },
};
export const GENE_KEYS = Object.keys(GENES);

function landmarks(g) {
  const L = {};
  for (const k in BASE) L[k] = BASE[k].slice();
  for (const k of GENE_KEYS) {
    const v = g[k] || 0, G = GENES[k];
    if (G.mv) for (const [n, dx, dy, dz] of G.mv) { L[n][0] += dx * v; L[n][1] += dy * v; L[n][2] += dz * v; }
  }
  // the eye grows and shrinks about its own middle
  { const s = 1 + GENES.eyeSize.eye * (g.eyeSize || 0), cx = (L.EI[0] + L.EO[0]) / 2, cy = (L.ET[1] + L.EB[1]) / 2; for (const n of ['EI', 'EO', 'ET', 'EB']) { L[n][0] = cx + (L[n][0] - cx) * s; L[n][1] = cy + (L[n][1] - cy) * s; } }
  // the face's length: everything below the brow line stretches about y = 50
  { const s = 1 + GENES.faceLen.scaleY * (g.faceLen || 0); for (const n in L) if (L[n][1] > 50) L[n][1] = 50 + (L[n][1] - 50) * s; }
  return L;
}

// ---- projection: yaw about the vertical axis through the skull's middle; yaw < 0 turns the face to the picture's left
function projector(yaw, cx = 0, cz = -6) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return (p, side = 1) => { const x = p[0] * side - cx, z = p[2] - cz; return [x * c + z * s + cx, p[1], -x * s + z * c]; };
}
// Catmull-Rom through points -> cubic beziers
function spline(pts, closed) {
  const n = pts.length; if (n < 2) return '';
  const P = i => closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)];
  let d = `M${R(pts[0][0])} ${R(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    d += `C${R(p1[0] + (p2[0] - p0[0]) / 6)} ${R(p1[1] + (p2[1] - p0[1]) / 6)} ${R(p2[0] - (p3[0] - p1[0]) / 6)} ${R(p2[1] - (p3[1] - p1[1]) / 6)} ${R(p2[0])} ${R(p2[1])}`;
  }
  return d + (closed ? 'Z' : '');
}
// a tapered ink stroke: a filled shape along a polyline with a width at each point
function taper(pts, ws) {
  const up = [], dn = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const m = Math.hypot(nx, ny) || 1; nx /= m; ny /= m;
    const w = ws[i] / 2; up.push([pts[i][0] + nx * w, pts[i][1] + ny * w]); dn.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
  }
  return spline([...up, ...dn.reverse()], true);
}
const xAt = (chain, y) => { for (let i = 1; i < chain.length; i++) { const a = chain[i - 1], b = chain[i]; if ((y >= a[1] && y <= b[1]) || (y <= a[1] && y >= b[1])) { const t = (y - a[1]) / ((b[1] - a[1]) || 1e-6); return a[0] + (b[0] - a[0]) * t; } } return null; };

const mix = (a, b, t) => { const p = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)], x = p(a), y = p(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const INK = '#1b1730', SHADE = '#3a2f6b';

// ---- one head as SVG. o: { genes, yaw (radians, negative = turned left), skin, eye, hair, size, male, cloth }
let UID = 0;
export function head(o) {
  const U = 'h' + (UID++) + '_';
  const g = o.genes, yaw = o.yaw == null ? -0.47 : o.yaw, L = landmarks(g), pr = projector(yaw);
  const far = yaw < 0 ? -1 : 1, near = -far;                       // which side of the head is turned away
  const P = (n, side = 1) => pr(L[n], side);
  const skin = o.skin || '#d9a77f', skinS = mix(skin, mix(skin, SHADE, .5), .55), skinD = mix(skin, SHADE, .55), lineS = mix(skin, INK, .62);
  const male = o.male !== false;
  let s = '';
  // the cranium: an ellipsoid, whose outline turned is still an ellipse
  const rx = Math.hypot(50 * Math.cos(yaw), 57 * Math.sin(yaw)), cc = pr([0, 47, -6]);
  // the two chains of each side: the side outline and the front plane's edge
  const sideChain = sd => ['FH', 'TE', 'ZY', 'GO', 'JM', 'CS'].map(n => P(n, sd)).concat([P('ME')]);
  const frontChain = sd => ['FH', 'BO', 'EO', 'CF', 'CM', 'CS'].map(n => P(n, sd)).concat([P('ME')]);
  const YS = [30, 40, 47, 51, 57, 62, 68, 74, 82, 91, 97, 102, 106, 109];
  const fS = sideChain(far), fF = frontChain(far), nS = sideChain(near), nF = frontChain(near);
  const sgn = far;                                                 // the far contour is the outer envelope of both chains
  const yTop = fS[0][1], yEnd = P('ME')[1];
  const ys = YS.map(y => yTop + (y - 30) * (yEnd - 1 - yTop) / (109 - 30));
  const farC = ys.map(y => { const a = xAt(fS, y), b = xAt(fF, y); const x = a == null ? b : b == null ? a : sgn > 0 ? Math.max(a, b) : Math.min(a, b); return [x, y]; }).filter(p => p[0] != null);
  const nearC = ys.map(y => { const a = xAt(nS, y); return a == null ? null : [a, y]; }).filter(Boolean);
  const me = P('ME');
  // the head's outline: the skull from the nape on the near side, over the top, to the far forehead; then the far contour,
  // the chin and the near jaw back to the nape
  const aFar = Math.asin(clamp((farC[0][1] - cc[1]) / 49, -1, 1));           // where the far forehead meets the skull
  const arc = []; { const a0 = 0.72, a1 = Math.PI - aFar, n = 14; for (let i = 0; i <= n; i++) { const a = a0 - (a0 + a1) * 0 + (i / n) * (-(a0) - (Math.PI + aFar) + 0); } }
  { const from = 0.72, to = -(Math.PI + aFar), n = 14; for (let i = 0; i <= n; i++) { const a = from + (to - from) * (i / n); arc.push([cc[0] + near * rx * Math.cos(a), cc[1] + 49 * Math.sin(a)]); } }
  const goP = P('GO', near), jmP = P('JM', near), csP = P('CS', near);
  const outline = [...arc.slice(0, -1), ...farC, [me[0], me[1]], [csP[0], csP[1]], [jmP[0], jmP[1]], [goP[0], goP[1]]];
  const faceD = spline(outline, true);
  // the neck
  const goN = P('GO', near), nk = male ? 1 : .78, nw = (male ? 21 : 16) * (o.neck || 1);
  const ncx = pr([0, 100, -4])[0];
  const neckD = `M${R(ncx - nw)} ${R(goN[1] - 12)}L${R(ncx - nw - 2)} 150L${R(ncx + nw + 3)} 150L${R(ncx + nw)} ${R(me[1] - 14)}Z`;
  s += `<path d="${neckD}" fill="${skin}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<path d="${neckD}" fill="${skinS}"/>`;                    // the neck sits in the jaw's shadow
  // shoulders and a plain neckline
  const cl = o.cloth || '#6d7f93', sh = (male ? 62 : 52) * (o.shoulder || 1);
  const bodyD = `M${R(ncx - sh)} 176Q${R(ncx - sh + 4)} 142 ${R(ncx - nw - 6)} 134Q${R(ncx)} 146 ${R(ncx + nw + 7)} 134Q${R(ncx + sh - 4)} 142 ${R(ncx + sh)} 176Z`;
  s += `<path d="${bodyD}" fill="${cl}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>`;
  s += `<path d="M${R(ncx + 4)} 142Q${R(ncx + sh * .5)} 140 ${R(ncx + sh)} 176L${R(ncx + 8)} 176Z" fill="${mix(cl, SHADE, .38)}"/>`;
  if (male) { const ax = ncx + far * 3; s += `<path d="M${R(ax)} ${R(me[1] + 8)}q${R(far * 2.6)} 3 0 6.5" fill="none" stroke="${lineS}" stroke-width="1"/>`; }
  // the near ear (behind the face's edge)
  { const a = P('EAT', near), b = P('EAB', near), ek = 1 + .25 * (g.ears || 0), ew = 8 * ek * -far;
    const ed = spline([[a[0] + far * 2, a[1]], [a[0] + ew * .7, a[1] - 2.5 * ek], [a[0] + ew, lerp(a[1], b[1], .35)], [b[0] + ew * .55, b[1] - 2], [b[0] + far * 2.5, b[1] + 1.5]], false) + 'Z';
    s += `<path d="${ed}" fill="${skin}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="${spline([[a[0] + ew * .55, a[1] + 3], [a[0] + ew * .7, lerp(a[1], b[1], .4)], [b[0] + ew * .35, b[1] - 5]], false)}" fill="none" stroke="${lineS}" stroke-width="1"/>`; }
  // the face
  s += `<path id="${U}fc" d="${faceD}" fill="${skin}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<clipPath id="${U}fk"><use href="#${U}fc"/></clipPath><g clip-path="url(#${U}fk)">`;
  // shadow 1: the side plane of the head on the near side. Its edge runs from the temple down the cheekbone's front and
  // dives forward under it toward the chin (deeper on a lean face with strong cheekbones)
  { const hollow = .5 + .2 * (g.cheek || 0);
    const edge = ys.map(y => { const a = xAt(nF, y), b = xAt(nS, y); if (a == null || b == null) return null; const zy = P('ZY', near)[1]; const t = y < zy ? .78 : lerp(.78, hollow, clamp((y - zy) / 16, 0, 1)); return [lerp(a, b, t), y]; }).filter(Boolean);
    s += `<path d="${spline([...edge, [me[0] + near * 6, me[1] + 6], [goP[0] + near * 30, goP[1] + 10], [goP[0] + near * 40, edge[0][1] - 30], [edge[0][0] + near * 4, edge[0][1] - 26]], true)}" fill="${skinS}"/>`; }
  // shadow 2: under the brow, in each eye socket (deeper with a heavy ridge)
  for (const sd of [near, far]) {
    const bi = P('BI', sd), bp = P('BP', sd), bo = P('BO', sd), et = P('ET', sd), ei = P('EI', sd), eo = P('EO', sd), k = .55 + .45 * clamp((g.browRidge || 0) * .8 + .3, 0, 1);
    s += `<path d="${spline([[bi[0], bi[1] + 1], [bp[0], bp[1] + 1.5], [bo[0], bo[1] + 1], [eo[0], lerp(bo[1], eo[1], k)], [et[0], lerp(bp[1], et[1], k)], [ei[0], lerp(bi[1], ei[1], k + .2)]], true)}" fill="${skinS}"/>`;
  }
  s += '</g>';
  // the jaw's edge on the near side, a line inside the face that fades toward the chin
  { const go = P('GO', near), jm = P('JM', near), cs = P('CS', near), ea = P('EAB', near);
    s += `<path d="${taper([[lerp(go[0], ea[0], .5), lerp(go[1], ea[1], .6)], go, jm, [lerp(jm[0], cs[0], .6), lerp(jm[1], cs[1], .6)]], [.6, 1.6, 1.2, .2])}" fill="${lineS}"/>`; }
  // eyes
  const eyeC = o.eye || '#5b4630';
  for (const sd of [far, near]) {
    const ei = P('EI', sd), eo = P('EO', sd), et = P('ET', sd), eb = P('EB', sd);
    const w = Math.abs(eo[0] - ei[0]), cx = (ei[0] + eo[0]) / 2, cy = (et[1] + eb[1]) / 2, hgt = eb[1] - et[1];
    const upper = [[ei[0], ei[1]], [lerp(ei[0], et[0], .55), lerp(ei[1], et[1], .92)], [et[0], et[1]], [lerp(eo[0], et[0], .42), lerp(eo[1], et[1], .8)], [eo[0], eo[1]]];
    const lower = [[eo[0], eo[1]], [lerp(eo[0], eb[0], .5), lerp(eo[1], eb[1], .9)], [eb[0], eb[1]], [lerp(ei[0], eb[0], .5), lerp(ei[1], eb[1], .85)], [ei[0], ei[1]]];
    const id = U + 'e' + (sd > 0 ? 'r' : 'l');
    s += `<clipPath id="${id}"><path d="${spline([...upper, ...lower.slice(1, -1)], true)}"/></clipPath>`;
    s += `<g clip-path="url(#${id})"><rect x="${R(cx - w)}" y="${R(cy - 12)}" width="${R(w * 2)}" height="24" fill="#efe9df"/>`;
    const ir = Math.min(hgt * .78, 4.9), ix = cx + far * w * .05 * -1;
    s += `<ellipse cx="${R(ix)}" cy="${R(cy - hgt * .08)}" rx="${R(ir * (w / 18.5) ** .5 * .96)}" ry="${R(ir)}" fill="${eyeC}" stroke="${mix(eyeC, INK, .6)}" stroke-width=".8"/><circle cx="${R(ix)}" cy="${R(cy - hgt * .08)}" r="${R(ir * .42)}" fill="${INK}"/>`;
    s += `<rect x="${R(cx - w)}" y="${R(et[1] - 3)}" width="${R(w * 2)}" height="${R(3 + hgt * .3)}" fill="${SHADE}" fill-opacity=".3"/>`;
    s += `<circle cx="${R(ix - 1.5)}" cy="${R(cy - hgt * .3)}" r="1.05" fill="#fff"/></g>`;
    // the upper lid: heavy, tapered; the crease above it when the eye is open enough; the lower lid: a short thin stroke
    s += `<path d="${taper(upper, sd === far ? [.5, 1.5, 1.9, 1.7, .8] : [.6, 1.7, 2.2, 2, 1])}" fill="${INK}"/>`;
    const lidV = g.lid || 0;
    if (lidV > -.45) s += `<path d="${spline(upper.slice(1, 4).map(p => [p[0], p[1] - 1.9 - lidV * .9]), false)}" fill="none" stroke="${lineS}" stroke-width=".8"/>`;
    s += `<path d="${spline([[lerp(eo[0], eb[0], .25), lerp(eo[1], eb[1], .7)], [eb[0], eb[1] + .2], [lerp(ei[0], eb[0], .45), lerp(ei[1], eb[1], .9)]], false)}" fill="none" stroke="${lineS}" stroke-width=".8"/>`;
  }
  // brows: tapered masses, heavier inward
  for (const sd of [far, near]) {
    const bi = P('BI', sd), bp = P('BP', sd), bo = P('BO', sd), th = (male ? 3.1 : 2) * (1 + .5 * (g.browThick || 0));
    s += `<path d="${taper([bi, [lerp(bi[0], bp[0], .6), lerp(bi[1], bp[1], .8)], bp, bo], [th * .9, th, th * .8, th * .22])}" fill="${o.hair || '#3b2a1c'}"/>`;
  }
  // the nose: the bridge down the far side, the tip, the wing on the near side, the nostril and its shadow
  { const n = P('N'), nb = P('NB'), nt = P('NT'), sn = P('SN'), alN = P('AL', near), alF = P('AL', far), bulb = 1 + GENES.noseW.bulb * (g.noseW || 0);
    const hump = (g.noseBridge || 0);
    const bridge = [[n[0] + far * .5, n[1] + 1], [lerp(n[0], nb[0], .5) + far * hump * .3, lerp(n[1], nb[1], .5)], [nb[0], nb[1]], [nt[0] + far * 1.2 * bulb, nt[1] - 2.2], [nt[0] + far * .2, nt[1] + 1.4 * bulb], [sn[0] + far * .6, sn[1]]];
    // the near side of the nose is a plane in shadow
    s += `<path d="${spline([[n[0] + near * 1.5, n[1] + 3], [nb[0] + near * 3.2, nb[1]], [alN[0] + near * .6, alN[1] - 3.2 * bulb], [alN[0] + near * 1.4 * bulb, alN[1]], [sn[0], sn[1] + .6], [nt[0], nt[1] + 1], [nt[0] + far * .6, nt[1] - 3], [nb[0], nb[1]]], true)}" fill="${skinS}"/>`;
    s += `<path d="${taper(bridge, [.3, .8, 1.1, 1.5, 1.3, .5])}" fill="${lineS}"/>`;
    s += `<path d="${taper([[alN[0] + near * .4, alN[1] - 3 * bulb], [alN[0] + near * 1.5 * bulb, alN[1] - .6], [alN[0], alN[1] + 1.2], [lerp(alN[0], sn[0], .5), sn[1] + .5]], [.3, 1.2, 1.1, .4])}" fill="${lineS}"/>`;
    s += `<path d="${spline([[lerp(alN[0], sn[0], .3), sn[1] - .2], [lerp(alN[0], sn[0], .62), sn[1] - 1.3 - (g.noseTip || 0) * -.8], [sn[0] + far * .2, sn[1] + .3], [lerp(alN[0], sn[0], .6), sn[1] + .9]], true)}" fill="${skinD}"/>`;
    // the shadow the nose throws toward the near cheek
    s += `<path d="${spline([[alN[0] + near * 1.4 * bulb, alN[1] - .5], [alN[0] + near * 4.5, alN[1] + 2.2], [sn[0] + near * 2, sn[1] + 3.2], [sn[0], sn[1] + .8]], true)}" fill="${skinS}"/>`; }
  // the mouth: the line between the lips, the upper lip's bow, the lower lip and its shadow
  { const mcN = P('MC', near), mcF = P('MC', far), m = P('M'), ul = P('UL'), ll = P('LL'), cr = P('CC'), k = 1 + GENES.lips.lips * (g.lips || 0);
    const lipC = mix(skin, '#a3423f', male ? .26 : .42);
    const upH = (m[1] - ul[1]) * .62 * k, loH = (ll[1] - m[1]) * .95 * k;
    s += `<path d="${spline([[mcF[0], mcF[1]], [lerp(mcF[0], m[0], .55), m[1] - upH * .9], [m[0] + far * .4, m[1] - upH * .55], [lerp(mcN[0], m[0], .55), m[1] - upH], [mcN[0], mcN[1]], [lerp(mcN[0], m[0], .5), m[1] + .3], [m[0], m[1] + .5], [lerp(mcF[0], m[0], .5), m[1] + .3]], true)}" fill="${mix(lipC, SHADE, .22)}"/>`;
    s += `<path d="${spline([[mcF[0], mcF[1]], [lerp(mcF[0], m[0], .5), m[1] + .3], [m[0], m[1] + .5], [lerp(mcN[0], m[0], .5), m[1] + .3], [mcN[0], mcN[1]], [lerp(mcN[0], m[0], .45), m[1] + loH * .85], [m[0], m[1] + loH], [lerp(mcF[0], m[0], .45), m[1] + loH * .8]], true)}" fill="${lipC}"/>`;
    s += `<path d="${taper([[mcF[0] + far * .6, mcF[1] - .2], [lerp(mcF[0], m[0], .5), m[1] + .3], [m[0], m[1] + .5], [lerp(mcN[0], m[0], .5), m[1] + .3], [mcN[0] + near * .9, mcN[1] - .2]], [.5, 1.2, 1, 1.3, .7])}" fill="${mix(INK, '#5a2030', .35)}"/>`;
    s += `<path d="${spline([[lerp(mcN[0], m[0], .7), m[1] + loH + 1.2], [m[0], m[1] + loH + 2.2], [lerp(mcF[0], m[0], .6), m[1] + loH + 1.2], [m[0], cr[1] + 1]], true)}" fill="${skinS}"/>`;
    // the chin's own form: a short stroke under it when it is strong
    if ((g.chin || 0) > .25) { const pg = P('PG'); s += `<path d="${spline([[pg[0] - 5, pg[1] - 3.5], [pg[0], pg[1] - 5], [pg[0] + 5, pg[1] - 3.5]], false)}" fill="none" stroke="${lineS}" stroke-width=".9"/>`; } }
  // the hair, cropped to a shadow: every head on the sheet has the same, so only the face tells them apart
  { const hairC = o.hair || '#3b2a1c', fh = P('FH', far), fhN = P('FH', near), te = P('TE', near), f0 = P('F0'), ea = P('EAT', near), eb2 = P('EAB', near);
    const hl = [[fh[0] + near * 1.5, fh[1] + 5], [f0[0] + far * 7, f0[1] - 2], [f0[0] + near * 12, f0[1]], [fhN[0] + far * 1, fhN[1] + 6], [te[0] + far * 5, te[1] + 7], [ea[0] + far * 6, ea[1] + 6], [ea[0] + near * 1, ea[1] - 3], [eb2[0] + near * 6, eb2[1] - 2]];
    s += `<clipPath id="${U}hk"><use href="#${U}fc"/></clipPath><path clip-path="url(#${U}hk)" d="${spline([...arc.map(p => [cc[0] + (p[0] - cc[0]) * 1.06, cc[1] + (p[1] - cc[1]) * 1.06]), ...hl.reverse()], true)}" fill="${hairC}" fill-opacity=".55"/>`; }
  const size = o.size || 120;
  const vb = o.viewBox || '-78 -8 156 156';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${size}" height="${size}"><rect x="-78" y="-8" width="156" height="156" fill="${o.ground || '#232c44'}"/><g stroke-linecap="round">${s}</g></svg>`;
}
