// The manhwa layer · the scene behind a person: the land they live in (sky, far country, what is built there and how)
// and the place their station keeps them (field, workshop, market, shrine, camp, hall, court). Flat painted layers,
// paler with distance, drawn once per (land, place) and shared by every card that uses it. A border town draws the
// buildings of both its neighbours (`mix`).
import { lerp, mixc, n1, stream } from '../g.js';
import { pt, P, PZ, blob, curve, sliver, elli, circ, rect } from './ink.js';

export const LANDS = {
  north:  { name: 'the cold north', sky: ['#4f7fc0', '#9cc4e6', '#e6f0f4'], far: '#8aa6c8', mid: '#5f7f96', near: '#3d5a52', ground: '#6f8f5a', sun: '#fff6e0', cloud: '#ffffff', warm: '#ffd9a0' },
  desert: { name: 'the desert', sky: ['#4a86c4', '#f2c98a', '#fbe6b8'], far: '#e2b888', mid: '#d39a5e', near: '#b87a44', ground: '#e0b070', sun: '#fff0c0', cloud: '#fff4dc', warm: '#ffc070' },
  steppe: { name: 'the steppe', sky: ['#2f7fd0', '#7fc0ee', '#d8f0f8'], far: '#7f9fcf', mid: '#7fae6a', near: '#5f8f4a', ground: '#9fbf5a', sun: '#ffffff', cloud: '#ffffff', warm: '#ffe6a0' },
  south:  { name: 'the southern forest', sky: ['#3a9aa8', '#9fd8c0', '#f0f0c0'], far: '#6fae8a', mid: '#3f8a5a', near: '#22603a', ground: '#7fae4a', sun: '#fff8d0', cloud: '#fffbe6', warm: '#ffd070' },
};
export const PLACES = ['field', 'village', 'workshop', 'market', 'shrine', 'camp', 'hall', 'court'];

const X0 = 0, X1 = 300, Y1 = 480;
function sky(S, L, r, o = {}) {
  S.fill(rect(X0, 0, 300, Y1), S.lin(0, 0, 0, 330, [[0, L.sky[0]], [.6, L.sky[1]], [1, L.sky[2]]]));
  S.fill(rect(X0, 0, 300, Y1), S.rad(60, 70, 230, [[0, L.sun, .75], [.35, L.sun, .25], [1, L.sun, 0]]));
  for (let i = 0; i < (o.clouds ?? 4); i++) { const x = r.f(-20, 300), y = r.f(20, 190), w = r.f(40, 90), h = w * r.f(.22, .34), pts = []; for (let j = 0; j < 7; j++) { const a = j / 7 * Math.PI * 2; pts.push([x + Math.cos(a) * w * (.8 + r() * .3), y + Math.sin(a) * h * (.7 + r() * .5) - (Math.sin(a) < 0 ? h * .5 * r() : 0)]); }
    S.fill(blob(pts), mixc(L.cloud, L.sky[1], .25), .9); S.fill(blob(pts.map(p => [p[0] - 4, p[1] - 4]).map((p, j) => [x + (p[0] - x) * .82, y - 3 + (p[1] - y) * .7])), L.cloud, .95); }
}
// a ridge line across the card: jagged (mountains), rolling (hills, dunes) or bumpy (tree tops)
function ridge(S, r, y, amp, col, o = {}) {
  const n = o.n || 9, pts = [[X0 - 10, Y1], [X0 - 10, y + r.s() * amp * .4]];
  for (let i = 0; i <= n; i++) pts.push([lerp(X0, X1, i / n) + r.s() * 8, y - (i % 2 ? amp * (.5 + r() * .7) : amp * r() * .25)]);
  pts.push([X1 + 10, y], [X1 + 10, Y1]);
  const d = o.sharp ? PZ(pts) : blob(pts, pts.map((_, i) => (i < 2 || i > n + 2 ? .1 : o.t ?? .9)));
  S.fill(d, col);
  if (o.snow) S.clip(d, s => { for (let i = 3; i < pts.length - 2; i += 2) { const p = pts[i]; s.fill(PZ([[p[0], p[1] - 2], [p[0] + 16, p[1] + 20], [p[0] + 6, p[1] + 14], [p[0], p[1] + 24], [p[0] - 7, p[1] + 13], [p[0] - 15, p[1] + 19]]), o.snow, .95); s.fill(PZ([[p[0], p[1] - 2], [p[0] + 26, p[1] + 60], [p[0] + 60, p[1] + 90], [p[0] + 8, p[1] + 90]]), '#1a2a4a', .16); } });
  if (o.shade) S.clip(d, s => { for (let i = 3; i < pts.length - 2; i += 2) { const p = pts[i]; s.fill(blob([[p[0], p[1] - 2], [p[0] + 30, p[1] + 20], [p[0] + 50, p[1] + 60], [p[0] + 6, p[1] + 60]]), o.shade, .3); } });
  return pts;
}
const pine = (S, x, y, h, c, c2) => { let d = ''; for (let i = 0; i < 4; i++) { const t = i / 4, w = h * (.16 + t * .2), yy = y - h + t * h * .8; d += PZ([[x, yy - h * .1], [x + w, yy + h * .26], [x - w, yy + h * .26]]); } S.fill(d, c); S.fill(PZ([[x, y - h * 1.1], [x + h * .1, y - h * .6], [x + h * .32, y], [x, y]]), c2, .45); };
const palm = (S, x, y, h, c, tr) => { S.line(curve([[x, y], [x + h * .08, y - h * .5], [x - h * .04, y - h]]), tr, h * .07); for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * .62, tip = [x - h * .04 + Math.cos(a) * h * .5, y - h + Math.sin(a) * h * .3 + Math.abs(i - 3) * h * .1]; S.fill(sliver([[x - h * .04, y - h], [(x + tip[0]) / 2, y - h - h * .16 + Math.abs(i - 3) * h * .04], tip], h * .12, { at: .4 }), i % 2 ? c : mixc(c, '#ffffaa', .22)); } };
const leafTree = (S, x, y, h, c, tr, r) => { S.fill(PZ([[x - h * .05, y], [x - h * .03, y - h * .5], [x + h * .03, y - h * .5], [x + h * .05, y]]), tr); for (let i = 0; i < 5; i++) { const cx = x + r.s() * h * .28, cy = y - h * .62 + r.s() * h * .2; S.fill(elli(cx, cy, h * .26, h * .2), i % 2 ? c : mixc(c, '#ffffaa', .18)); } };
// buildings, each land's own
function northHall(S, x, y, s, L, o = {}) { const wall = mixc('#6a4a34', L.far, o.far || 0), roof = mixc('#3a3038', L.far, o.far || 0), lt = mixc('#8a6a4a', L.far, o.far || 0);
  S.fill(rect(x - 40 * s, y - 26 * s, 80 * s, 26 * s), wall); let pl = ''; for (let i = -3; i <= 3; i++) pl += `M${n1(x + i * 11 * s)} ${n1(y - 26 * s)}v${n1(26 * s)}`; S.line(pl, roof, .8 * s, .5);
  S.fill(PZ([[x - 48 * s, y - 24 * s], [x, y - 74 * s], [x + 48 * s, y - 24 * s]]), roof); S.fill(PZ([[x - 48 * s, y - 24 * s], [x, y - 74 * s], [x - 4 * s, y - 24 * s]]), lt, .5);
  S.line(P([[x - 7 * s, y - 66 * s], [x + 8 * s, y - 86 * s]]) + P([[x + 7 * s, y - 66 * s], [x - 8 * s, y - 86 * s]]), roof, 2.4 * s); S.fill(rect(x - 6 * s, y - 16 * s, 12 * s, 16 * s), '#2a1c18'); if (o.glow) S.fill(rect(x - 4.5 * s, y - 14 * s, 9 * s, 14 * s), L.warm, .9); if (o.snow) S.fill(PZ([[x - 48 * s, y - 24 * s], [x, y - 74 * s], [x + 48 * s, y - 24 * s], [x + 38 * s, y - 26 * s], [x, y - 64 * s], [x - 38 * s, y - 26 * s]]), '#f4f8fc', .9); }
function northTower(S, x, y, s, L, o = {}) { const st = mixc('#7a7f8a', L.far, o.far || 0), dk = mixc('#4a4f5c', L.far, o.far || 0); S.fill(rect(x - 14 * s, y - 86 * s, 28 * s, 86 * s), st); S.fill(rect(x + 2 * s, y - 86 * s, 12 * s, 86 * s), dk, .5); let cr = ''; for (let i = 0; i < 4; i++) cr += rect(x - 17 * s + i * 9.4 * s, y - 95 * s, 6 * s, 10 * s); S.fill(cr, st); S.fill(rect(x - 17 * s, y - 88 * s, 34 * s, 5 * s), dk); S.fill(rect(x - 2.4 * s, y - 64 * s, 4.8 * s, 12 * s), '#1c1c28'); if (o.flag) { S.line(P([[x, y - 95 * s], [x, y - 122 * s]]), dk, 1.4 * s); S.fill(PZ([[x, y - 122 * s], [x + 20 * s, y - 117 * s], [x, y - 110 * s]]), o.flag); } }
function dome(S, x, y, s, L, o = {}) { const wall = mixc('#e8cfa0', L.far, o.far || 0), sh = mixc('#b8925e', L.far, o.far || 0), dm = mixc(o.c || '#3f8f9a', L.far, o.far || 0);
  S.fill(rect(x - 30 * s, y - 34 * s, 60 * s, 34 * s), wall); S.fill(rect(x + 6 * s, y - 34 * s, 24 * s, 34 * s), sh, .45);
  S.fill(`M${n1(x - 24 * s)} ${n1(y - 34 * s)}C${n1(x - 30 * s)} ${n1(y - 62 * s)} ${n1(x - 8 * s)} ${n1(y - 70 * s)} ${n1(x)} ${n1(y - 84 * s)}C${n1(x + 8 * s)} ${n1(y - 70 * s)} ${n1(x + 30 * s)} ${n1(y - 62 * s)} ${n1(x + 24 * s)} ${n1(y - 34 * s)}Z`, dm);
  S.fill(`M${n1(x - 16 * s)} ${n1(y - 40 * s)}C${n1(x - 18 * s)} ${n1(y - 58 * s)} ${n1(x - 6 * s)} ${n1(y - 66 * s)} ${n1(x - 2 * s)} ${n1(y - 76 * s)}C${n1(x - 8 * s)} ${n1(y - 60 * s)} ${n1(x - 10 * s)} ${n1(y - 50 * s)} ${n1(x - 9 * s)} ${n1(y - 40 * s)}Z`, '#ffffff', .4);
  S.line(P([[x, y - 84 * s], [x, y - 96 * s]]), '#c9a13a', 1.6 * s); S.fill(circ(x, y - 97 * s, 2.4 * s), '#e2bd58');
  S.fill(`M${n1(x - 8 * s)} ${n1(y)}v${n1(-16 * s)}q${n1(8 * s)} ${n1(-12 * s)} ${n1(16 * s)} 0v${n1(16 * s)}Z`, mixc('#5a3a24', L.far, o.far || 0)); }
function minaret(S, x, y, s, L, o = {}) { const wall = mixc('#ecd6aa', L.far, o.far || 0), sh = mixc('#b8925e', L.far, o.far || 0); S.fill(rect(x - 6 * s, y - 110 * s, 12 * s, 110 * s), wall); S.fill(rect(x + 1 * s, y - 110 * s, 5 * s, 110 * s), sh, .5); S.fill(rect(x - 9 * s, y - 84 * s, 18 * s, 5 * s), sh); S.fill(rect(x - 8 * s, y - 114 * s, 16 * s, 5 * s), sh); S.fill(`M${n1(x - 6 * s)} ${n1(y - 114 * s)}q${n1(6 * s)} ${n1(-22 * s)} ${n1(6 * s)} ${n1(-26 * s)}q0 ${n1(4 * s)} ${n1(6 * s)} ${n1(26 * s)}Z`, mixc(o.c || '#3f8f9a', L.far, o.far || 0)); }
function flatHouses(S, x, y, s, L, r, n = 4, o = {}) { for (let i = 0; i < n; i++) { const w = r.f(22, 36) * s, h = r.f(18, 40) * s, xx = x + i * 24 * s + r.s() * 4; S.fill(rect(xx, y - h, w, h), mixc(i % 2 ? '#e2c492' : '#d4b07a', L.far, o.far || 0)); S.fill(rect(xx + w * .6, y - h, w * .4, h), mixc('#a8824e', L.far, o.far || 0), .45); S.fill(rect(xx + w * .2, y - h * .7, 3 * s, 5 * s) + rect(xx + w * .5, y - h * .4, 3 * s, 5 * s), '#5a3a24', .8); } }
function yurt(S, x, y, s, L, o = {}) { const felt = mixc(o.c || '#eee6d4', L.far, o.far || 0), sh = mixc('#b8ac94', L.far, o.far || 0), band = mixc(o.band || '#a8442a', L.far, o.far || 0);
  S.fill(`M${n1(x - 36 * s)} ${n1(y)}v${n1(-22 * s)}q${n1(4 * s)} ${n1(-22 * s)} ${n1(36 * s)} ${n1(-30 * s)}q${n1(32 * s)} ${n1(8 * s)} ${n1(36 * s)} ${n1(30 * s)}v${n1(22 * s)}Z`, felt); S.fill(`M${n1(x + 6 * s)} ${n1(y)}v${n1(-51 * s)}q${n1(26 * s)} ${n1(8 * s)} ${n1(30 * s)} ${n1(29 * s)}v${n1(22 * s)}Z`, sh, .5);
  S.line(P([[x - 36 * s, y - 22 * s], [x + 36 * s, y - 22 * s]]), band, 3.4 * s); S.line(P([[x - 36 * s, y - 15 * s], [x + 36 * s, y - 15 * s]]), band, 1 * s, .7); S.fill(rect(x - 7 * s, y - 20 * s, 14 * s, 20 * s), band); S.fill(rect(x - 4.6 * s, y - 17 * s, 9.2 * s, 17 * s), mixc('#5a2a1c', L.far, o.far || 0)); S.fill(elli(x, y - 52 * s, 6 * s, 2.4 * s), sh);
  if (o.smoke) S.line(curve([[x, y - 54 * s], [x + 5 * s, y - 70 * s], [x - 2 * s, y - 88 * s], [x + 8 * s, y - 108 * s]]), '#ffffff', 3 * s, .5); }
function tugh(S, x, y, s, L, c = '#2a2228') { S.line(P([[x, y], [x, y - 90 * s]]), '#5a4028', 2 * s); S.fill(blob([[x - 3 * s, y - 86 * s], [x + 3 * s, y - 86 * s], [x + 6 * s, y - 62 * s], [x, y - 54 * s], [x - 6 * s, y - 62 * s]]), c); S.fill(PZ([[x - 5 * s, y - 92 * s], [x, y - 100 * s], [x + 5 * s, y - 92 * s]]), '#c9a13a'); }
function mudTower(S, x, y, s, L, o = {}) { const mud = mixc('#c98a54', L.far, o.far || 0), sh = mixc('#8a5a34', L.far, o.far || 0);
  S.fill(blob([[x - 20 * s, y], [x - 15 * s, y - 70 * s], [x - 5 * s, y - 108 * s], [x, y - 116 * s], [x + 5 * s, y - 108 * s], [x + 15 * s, y - 70 * s], [x + 20 * s, y]], [.1, 1, 1, .6, 1, 1, .1]), mud); S.fill(blob([[x + 3 * s, y], [x + 3 * s, y - 110 * s], [x + 15 * s, y - 70 * s], [x + 20 * s, y]], .5), sh, .5);
  let t = ''; for (let j = 0; j < 5; j++) for (const sg of [-1, 1]) t += `M${n1(x + sg * (17 - j * 2.4) * s)} ${n1(y - (20 + j * 18) * s)}h${n1(sg * 7 * s)}`; S.line(t, '#4a3020', 1.5 * s); S.fill(PZ([[x - 4 * s, y], [x - 4 * s, y - 16 * s], [x, y - 22 * s], [x + 4 * s, y - 16 * s], [x + 4 * s, y]]), '#3a2418'); }
function hut(S, x, y, s, L, o = {}) { const mud = mixc('#c99a64', L.far, o.far || 0), th = mixc('#b89a4a', L.far, o.far || 0); S.fill(rect(x - 18 * s, y - 22 * s, 36 * s, 22 * s), mud); S.fill(rect(x + 4 * s, y - 22 * s, 14 * s, 22 * s), '#7a5230', .4); S.fill(PZ([[x - 25 * s, y - 20 * s], [x, y - 58 * s], [x + 25 * s, y - 20 * s]]), th); S.fill(PZ([[x, y - 58 * s], [x + 25 * s, y - 20 * s], [x + 6 * s, y - 20 * s]]), '#7a6228', .45); S.fill(rect(x - 4 * s, y - 14 * s, 8 * s, 14 * s), '#3a2418'); if (o.band) { let z = ''; for (let i = -3; i < 3; i++) z += `M${n1(x + i * 6 * s)} ${n1(y - 17 * s)}l${n1(3 * s)} ${n1(-3 * s)}l${n1(3 * s)} ${n1(3 * s)}`; S.line(z, o.band, 1.2 * s, .9); } }
const tent = (S, x, y, s, c, c2) => { S.fill(PZ([[x - 26 * s, y], [x, y - 40 * s], [x + 26 * s, y]]), c); S.fill(PZ([[x, y - 40 * s], [x + 26 * s, y], [x + 6 * s, y]]), c2, .5); S.fill(PZ([[x - 5 * s, y], [x, y - 22 * s], [x + 5 * s, y]]), '#2a2028'); };
const banner = (S, x, y, h, c) => { S.line(P([[x, y], [x, y - h]]), '#4a3a2a', 1.6); S.fill(PZ([[x, y - h], [x + h * .32, y - h * .94], [x + h * .26, y - h * .8], [x + h * .34, y - h * .64], [x, y - h * .62]]), c); };
const builds = { north: (S, x, y, s, L, r, o) => (o.big ? northTower : northHall)(S, x, y, s, L, o), desert: (S, x, y, s, L, r, o) => (o.big ? (minaret(S, x - 34 * s, y, s * .9, L, o), dome)(S, x, y, s, L, o) : dome(S, x, y, s * .8, L, o)), steppe: (S, x, y, s, L, r, o) => yurt(S, x, y, s * (o.big ? 1.25 : 1), L, o), south: (S, x, y, s, L, r, o) => (o.big ? mudTower : hut)(S, x, y, s, L, o) };
const trees = { north: (S, x, y, h, L, r) => pine(S, x, y, h, L.near, '#1a3a34'), desert: (S, x, y, h, L, r) => palm(S, x, y, h, '#5f8a3a', '#7a5a34'), steppe: (S, x, y, h, L, r) => { let g = ''; for (let i = 0; i < 5; i++) g += `M${n1(x + i * 3 - 6)} ${n1(y)}q${n1(i - 2)} ${n1(-h * .2)} ${n1((i - 2) * 3)} ${n1(-h * .3)}`; S.line(g, L.near, 1.4); }, south: (S, x, y, h, L, r) => (r() < .5 ? leafTree(S, x, y, h, L.near, '#4a3020', r) : palm(S, x, y, h, '#2f7a3a', '#5a4028')) };

// the far country of a land: what stands on the horizon whatever the place
function country(S, L, land, r, y) {
  if (land === 'north') { ridge(S, r, y - 34, 74, mixc(L.far, L.sky[1], .35), { sharp: 1, snow: '#ffffff', n: 7 }); ridge(S, r, y - 4, 40, L.mid, { sharp: 1, snow: '#eef4fa', n: 9 }); const p = ridge(S, r, y + 22, 12, L.near, { n: 12 }); for (let i = 0; i < 12; i++) pine(S, r.f(0, 300), y + 30 + r() * 12, r.f(24, 44), mixc(L.near, L.mid, r() * .4), '#16302c'); }
  else if (land === 'desert') { ridge(S, r, y - 20, 22, mixc(L.far, L.sky[2], .4), { n: 5 }); ridge(S, r, y, 24, L.far, { n: 6, shade: '#a8703a' }); ridge(S, r, y + 24, 16, L.mid, { n: 5, shade: '#8a5428' }); }
  else if (land === 'steppe') { ridge(S, r, y - 44, 60, mixc(L.far, L.sky[1], .4), { sharp: 1, snow: '#ffffff', n: 6 }); ridge(S, r, y - 8, 18, mixc(L.mid, L.far, .5), { n: 5 }); ridge(S, r, y + 14, 10, L.mid, { n: 6, shade: '#4f7f3a' }); }
  else { ridge(S, r, y - 30, 46, mixc(L.far, L.sky[1], .45), { n: 6 }); ridge(S, r, y - 6, 26, L.far, { n: 12, t: 1 }); ridge(S, r, y + 14, 22, L.mid, { n: 16, t: 1, shade: '#1a4a2a' }); }
}
const groundFill = (S, L, y, c) => S.fill(rect(0, y, 300, Y1 - y), S.lin(0, y, 0, y + 140, [[0, c || L.ground], [1, mixc(c || L.ground, '#1a2a3a', .45)]]));

// one scene. o: { land, place, mix (a second land whose buildings share the town), seed, flag (the realm's colour) }
export function drawScene(S, o) {
  const land = LANDS[o.land] ? o.land : 'north', L = LANDS[land], place = o.place || 'field', r = stream(o.seed || 'scene', land + place + (o.mix || '')), hz = 262, flag = o.flag || '#8a2a2a';
  const mixL = o.mix && LANDS[o.mix] ? o.mix : null, landAt = x => (mixL && x > 150 ? mixL : land), LA = x => LANDS[landAt(x)];
  if (place === 'workshop' || place === 'court') return interior(S, L, land, place, r, o, mixL);
  sky(S, L, r, { clouds: land === 'steppe' ? 6 : land === 'desert' ? 2 : 4 });
  country(S, L, land, r, hz);
  if (place === 'field') {
    groundFill(S, L, hz + 28);
    // a holding far off, then the strips of the field coming toward us
    for (const x of [44, 250]) builds[landAt(x)](S, x + r.s() * 10, hz + 36, .42, LA(x), r, { far: .25, smoke: 1 });
    const crop = { north: '#d8c070', desert: '#9fbf5a', steppe: '#b8cf6a', south: '#c8c050' }[land];
    for (let i = 0; i < 7; i++) { const y = hz + 44 + i * i * 3.4, d = PZ([[-10, y], [310, y - 6], [310, y + 6 + i * 2.4], [-10, y + 12 + i * 2.4]]); S.fill(d, i % 2 ? crop : mixc(crop, L.near, .35), .9); }
    for (let i = 0; i < 4; i++) trees[land](S, r.f(0, 300), hz + 44 + r() * 20, r.f(34, 60), L, r);
    if (land === 'steppe') { let h = ''; for (let i = 0; i < 14; i++) { const x = r.f(20, 280), y = hz + 40 + r() * 26; h += elli(x, y, 4.4, 2.4) + circ(x + 4.4, y - 2, 1.5); } S.fill(h, '#f4efe2', .95); }
    if (land === 'desert') { S.fill(rect(-10, hz + 60, 320, 7), '#6fb0c8', .8); }
  } else if (place === 'village' || place === 'market') {
    groundFill(S, L, hz + 26, mixc(L.ground, '#c8b090', .5));
    const xs = [30, 96, 214, 276];
    for (const x of xs) builds[landAt(x)](S, x + r.s() * 6, hz + 44 + r() * 8, .62 + r() * .2, LA(x), r, { far: .12, big: x === 96 || (mixL && x === 214), glow: 1, flag, band: '#f0e6c8' });
    if (landAt(40) === 'desert') flatHouses(S, 130, hz + 46, .8, L, r, 3, { far: .15 });
    if (place === 'market') { const aw = ['#b8322a', '#2a447e', '#c7a03a', '#3e6947', '#e4dccb']; for (let i = 0; i < 5; i++) { const x = 10 + i * 62 + r.s() * 8, y = hz + 76 + (i % 2) * 8; S.line(P([[x, y], [x, y - 30]]) + P([[x + 40, y], [x + 40, y - 30]]), '#4a3424', 2); S.fill(PZ([[x - 5, y - 30], [x + 45, y - 30], [x + 50, y - 18], [x - 10, y - 18]]), aw[(i + r.i(0, 4)) % 5]); let st = ''; for (let j = 0; j < 3; j++) st += rect(x - 6 + j * 20, y - 30, 8, 12); S.fill(st, '#ffffff', .3); S.fill(rect(x - 2, y - 10, 44, 10), '#7a5a3a'); let g = ''; for (let j = 0; j < 5; j++) g += circ(x + 4 + j * 8, y - 12, 3.4); S.fill(g, ['#e2a03a', '#b8322a', '#7fae4a'][i % 3]); }
      if (land === 'north') { for (const x of [150, 178]) { S.line(P([[x, hz + 40], [x, hz - 40]]), '#3a2a20', 2.2); S.fill(blob([[x - 20, hz - 34], [x + 20, hz - 34], [x + 16, hz + 6], [x - 16, hz + 6]], .6), x === 150 ? '#e8e0cc' : flag, .95); let sp = ''; for (let j = -1; j <= 1; j++) sp += rect(x - 3 + j * 11, hz - 34, 5, 40); S.fill(sp, '#a83a2a', .6); } } }
    for (let i = 0; i < 3; i++) trees[landAt(i * 140)](S, r.f(0, 300), hz + 50, r.f(40, 70), LA(i * 140), r);
  } else if (place === 'shrine') {
    groundFill(S, L, hz + 26);
    if (land === 'north') { S.fill(rect(120, hz - 30, 60, 76), '#5a4234'); S.fill(PZ([[108, hz - 26], [150, hz - 76], [192, hz - 26]]), '#2a2430'); S.fill(PZ([[122, hz - 60], [150, hz - 104], [178, hz - 60]]), '#3a3038'); S.fill(PZ([[136, hz - 92], [150, hz - 140], [164, hz - 92]]), '#2a2430'); S.line(P([[150, hz - 140], [150, hz - 158]]), '#c9a13a', 2); S.fill(circ(150, hz - 160, 5), '#e2bd58'); S.fill(PZ([[108, hz - 26], [150, hz - 76], [144, hz - 26]]), '#f4f8fc', .5); for (const x of [40, 74, 232, 262]) S.fill(blob([[x - 7, hz + 46], [x - 5, hz + 6], [x + 2, hz - 2], [x + 7, hz + 10], [x + 8, hz + 46]], .7), '#8a8f9a'); }
    else if (land === 'desert') { minaret(S, 60, hz + 46, 1.2, L, { c: '#2f7f9a' }); minaret(S, 244, hz + 46, 1.2, L, { c: '#2f7f9a' }); dome(S, 150, hz + 46, 1.7, L, { c: '#2f8f9a' }); }
    else if (land === 'steppe') { S.fill(blob([[96, hz + 50], [120, hz + 6], [150, hz - 12], [182, hz + 8], [206, hz + 50]], .7), '#8a8a92'); S.fill(blob([[150, hz - 12], [182, hz + 8], [206, hz + 50], [160, hz + 50]], .7), '#5a5a66', .5); S.line(P([[150, hz - 8], [150, hz - 90]]), '#5a4028', 2.6); const fc = ['#2a66c8', '#f4f4f4', '#c8322a', '#3e9a47', '#e2bd3a']; for (const sg of [-1, 1]) for (let i = 0; i < 7; i++) { const t = (i + 1) / 8, x = 150 + sg * t * 120, y = hz - 88 + t * t * 110; S.fill(PZ([[x - 6, y], [x + 6, y + sg * 2], [x + 5, y + 13], [x - 5, y + 12]]), fc[(i + (sg > 0 ? 2 : 0)) % 5], .95); } S.line(`M150 ${hz - 88}Q90 ${hz - 40} 30 ${hz + 22}M150 ${hz - 88}Q210 ${hz - 40} 270 ${hz + 22}`, '#4a3a2a', .8); }
    else { S.fill(PZ([[134, hz + 50], [138, hz - 40], [162, hz - 40], [166, hz + 50]]), '#5a3e28'); for (let i = 0; i < 9; i++) S.fill(elli(150 + r.s() * 70, hz - 80 + r.s() * 44, 44, 30), i % 2 ? '#2f7a44' : '#3f9a54'); for (const x of [70, 230]) { S.fill(rect(x - 6, hz - 20, 12, 70), '#7a4a2a'); S.fill(elli(x, hz - 24, 9, 10), '#8a5a34'); S.fill(circ(x - 3, hz - 26, 1.6) + circ(x + 3, hz - 26, 1.6) + rect(x - 3, hz - 20, 6, 1.6), '#f4efe2'); let z = ''; for (let j = 0; j < 4; j++) z += `M${x - 6} ${hz + j * 12}l6 -5l6 5`; S.line(z, '#f0d9a0', 1.4); } }
  } else if (place === 'camp') {
    groundFill(S, L, hz + 26, mixc(L.ground, '#8a7a5a', .4));
    const tc = { north: ['#d8cfc0', '#8a8272'], desert: ['#f0e0c0', '#b89a6a'], steppe: ['#eee6d4', '#b8ac94'], south: ['#d8b070', '#9a7038'] }[land];
    if (land === 'steppe') { for (const x of [40, 120, 240]) yurt(S, x, hz + 50 + r() * 8, .6, L, { far: .1 }); for (const x of [84, 196, 276]) tugh(S, x, hz + 56, .9, L); }
    else { for (let i = 0; i < 5; i++) tent(S, 20 + i * 66 + r.s() * 10, hz + 48 + (i % 2) * 10, .9 + r() * .3, tc[0], tc[1]); for (const x of [56, 150, 250]) banner(S, x, hz + 50, 96, x === 150 ? flag : mixc(flag, '#ffffff', .2)); }
    if (land === 'north') { let pal = ''; for (let i = 0; i < 26; i++) pal += PZ([[i * 12 - 4, hz + 34], [i * 12 + 1, hz + 14 + (i % 3) * 3], [i * 12 + 6, hz + 34], [i * 12 + 6, hz + 64], [i * 12 - 4, hz + 64]]); S.fill(pal, '#5a4636', .9); }
    if (land === 'south') { for (let i = 0; i < 9; i++) S.line(P([[20 + i * 32, hz + 60], [24 + i * 32, hz - 10 - (i % 3) * 8]]), '#5a4028', 1.8), S.fill(PZ([[24 + i * 32 - 4, hz - 8 - (i % 3) * 8], [24 + i * 32, hz - 30 - (i % 3) * 8], [24 + i * 32 + 4, hz - 8 - (i % 3) * 8]]), '#c8ccd4'); }
    S.fill(circ(210, hz + 64, 50), S.rad(210, hz + 64, 50, [[0, L.warm, .7], [1, L.warm, 0]]));
  } else { // hall: a lord's seat
    groundFill(S, L, hz + 26);
    if (land === 'north') { S.fill(rect(-10, hz - 10, 320, 60), '#6a707c'); let cr = ''; for (let i = 0; i < 20; i++) cr += rect(i * 17 - 6, hz - 20, 10, 12); S.fill(cr, '#6a707c'); S.fill(rect(-10, hz + 20, 320, 30), '#4a505c', .5); northTower(S, 50, hz + 50, 1.5, L, { flag }); northTower(S, 246, hz + 50, 1.2, L, { flag }); northHall(S, 150, hz + 30, .8, L, { far: .1, snow: 1 }); }
    else if (land === 'desert') { S.fill(rect(-10, hz - 4, 320, 54), '#e2c492'); let cr = ''; for (let i = 0; i < 22; i++) cr += PZ([[i * 15 - 6, hz - 4], [i * 15 - 1, hz - 16], [i * 15 + 4, hz - 4]]); S.fill(cr, '#e2c492'); S.fill(rect(-10, hz + 26, 320, 24), '#a8824e', .4); dome(S, 80, hz + 4, 1.3, L, { c: '#c9a13a' }); minaret(S, 150, hz + 20, 1.3, L, { c: '#c9a13a' }); dome(S, 232, hz + 4, 1, L, { c: '#2f8f9a' }); palm(S, 20, hz + 54, 80, '#5f8a3a', '#7a5a34'); palm(S, 284, hz + 54, 70, '#5f8a3a', '#7a5a34'); }
    else if (land === 'steppe') { yurt(S, 150, hz + 50, 2.1, L, { c: '#f8f2e2', band: '#c9a13a', smoke: 1 }); yurt(S, 36, hz + 46, .8, L, { far: .15 }); yurt(S, 270, hz + 46, .8, L, { far: .15 }); for (const x of [84, 216]) tugh(S, x, hz + 56, 1.3, L, x === 84 ? '#f4f4f4' : '#2a2228'); }
    else { S.fill(rect(-10, hz + 6, 320, 44), '#c98a54'); let z = ''; for (let i = 0; i < 20; i++) z += `M${i * 16 - 4} ${hz + 20}l8 -8l8 8`; S.line(z, '#f0d9a0', 1.6); mudTower(S, 60, hz + 50, 1.25, L, {}); mudTower(S, 240, hz + 50, 1.05, L, {}); mudTower(S, 150, hz + 30, .8, L, { far: .15 }); for (const x of [10, 110, 196, 290]) palm(S, x, hz + 56, r.f(70, 100), '#2f7a3a', '#5a4028'); }
  }
  // air between us and the land: a low haze, and the light
  S.fill(rect(0, hz - 30, 300, 120), S.lin(0, hz - 30, 0, hz + 90, [[0, L.sky[2], 0], [.5, L.sky[2], .32], [1, L.sky[2], 0]]));
}

// inside: a workshop (the forge's glow, tools on the wall, the land seen through the door) or a court (pillars, hangings)
function interior(S, L, land, place, r, o, mixL) {
  const court = place === 'court', wall = { north: court ? '#4a3428' : '#3e2e26', desert: court ? '#e6d0a0' : '#c8a878', steppe: court ? '#8a2a22' : '#b8ac94', south: court ? '#a8663a' : '#9a6a40' }[land], dark = mixc(wall, '#141020', .55), flag = o.flag || '#8a2a2a';
  S.fill(rect(0, 0, 300, 480), S.lin(0, 0, 0, 480, [[0, mixc(wall, '#141020', court ? .2 : .45)], [.6, wall], [1, dark]]));
  // an opening onto the land, each people's own shape
  const ox = court ? 150 : 232, oy = 250, ow = court ? 62 : 46, oh = court ? 190 : 150, id = S.clipId(land === 'desert' ? `M${ox - ow} ${oy}V${oy - oh * .6}Q${ox - ow} ${oy - oh * .92} ${ox} ${oy - oh}Q${ox + ow} ${oy - oh * .92} ${ox + ow} ${oy - oh * .6}V${oy}Z` : land === 'steppe' ? `M${ox - ow} ${oy}V${oy - oh * .7}Q${ox} ${oy - oh * 1.02} ${ox + ow} ${oy - oh * .7}V${oy}Z` : land === 'south' ? `M${ox - ow} ${oy}L${ox - ow * .7} ${oy - oh * .8}L${ox} ${oy - oh}L${ox + ow * .7} ${oy - oh * .8}L${ox + ow} ${oy}Z` : `M${ox - ow} ${oy}V${oy - oh}H${ox + ow}V${oy}Z`);
  S.put(`<g clip-path="url(#${id})">` + S.sub(s => { s.fill(rect(0, 0, 300, 480), s.lin(0, 40, 0, 260, [[0, L.sky[0]], [.6, L.sky[1]], [1, L.sky[2]]])); country(s, L, land, r, 226); s.fill(rect(0, 238, 300, 40), L.ground); }) + '</g>');
  S.fill(rect(0, 0, 300, 480), S.rad(ox, oy - oh * .5, 170, [[0, L.sun, .4], [1, L.sun, 0]]));
  if (court) {
    if (land === 'north') { for (const x of [34, 266]) { S.fill(rect(x - 14, 0, 28, 480), '#3a2a20'); S.fill(rect(x - 14, 0, 9, 480), '#6a4a34'); let k = ''; for (let i = 0; i < 12; i++) k += `M${x - 10} ${20 + i * 30}q10 -12 20 0q-10 12 -20 0`; S.line(k, '#8a6a44', 1.4); } for (const x of [86, 214]) { S.fill(circ(x, 130, 20), flag); S.line(circ(x, 130, 20), '#2a2028', 3); S.fill(circ(x, 130, 5), '#9aa0aa'); } S.fill(PZ([[0, 0], [300, 0], [300, 30], [150, 60], [0, 30]]), '#2a1c18'); S.fill(rect(0, 200, 300, 280), S.rad(150, 330, 130, [[0, '#ffa040', .45], [1, '#ffa040', 0]])); }
    else if (land === 'desert') { for (const x of [36, 264]) { S.fill(rect(x - 12, 60, 24, 420), '#f0e0b8'); S.fill(rect(x + 2, 60, 10, 420), '#b8925e', .5); S.fill(rect(x - 16, 52, 32, 12), '#c9a13a'); } let lat = ''; for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) lat += PZ([[62 + j * 8, 14 + i * 8], [66 + j * 8, 10 + i * 8], [70 + j * 8, 14 + i * 8], [66 + j * 8, 18 + i * 8]]) + PZ([[206 + j * 8, 14 + i * 8], [210 + j * 8, 10 + i * 8], [214 + j * 8, 14 + i * 8], [210 + j * 8, 18 + i * 8]]); S.fill(lat, '#8a5a2a', .7); for (const x of [84, 216]) { S.line(P([[x, 0], [x, 96]]), '#8a6a2a', 1.2); S.fill(blob([[x - 8, 96], [x + 8, 96], [x + 11, 116], [x, 128], [x - 11, 116]]), '#ffd070'); S.fill(circ(x, 112, 24), S.rad(x, 112, 24, [[0, '#ffe6a0', .7], [1, '#ffe6a0', 0]])); } S.fill(`M0 0H300V70Q150 -10 0 70Z`, '#2f7f8a'); S.line(`M0 70Q150 -10 300 70`, '#c9a13a', 4); }
    else if (land === 'steppe') { let ribs = ''; for (let i = 0; i < 17; i++) { const a = Math.PI * (i / 16); ribs += `M150 20L${n1(150 - Math.cos(a) * 240)} ${n1(20 + Math.sin(a) * 200)}`; } S.line(ribs, '#c9742a', 3); S.fill(circ(150, 20, 26), '#f4e6c0'); S.line(circ(150, 20, 26), '#c9a13a', 4); let lt = ''; for (let i = 0; i < 12; i++) lt += `M${i * 28 - 10} 250l14 -40l14 40M${i * 28 - 10} 250l14 40l14 -40`; S.line(lt, '#5a1c14', 2); for (const x of [40, 260]) { S.fill(rect(x - 22, 90, 44, 130), '#2a447e'); S.line(rect(x - 22, 90, 44, 130), '#c9a13a', 2.4); S.line(circ(x, 150, 12) + `M${x - 12} ${150}h24M${x} ${138}v24`, '#c9a13a', 1.6); } }
    else { for (const x of [36, 264]) { S.fill(rect(x - 13, 0, 26, 480), '#6a3e22'); S.fill(rect(x + 2, 0, 11, 480), '#3a2010', .5); let z = ''; for (let i = 0; i < 16; i++) z += `M${x - 13} ${10 + i * 26}l13 -10l13 10M${x - 13} ${20 + i * 26}l13 -10l13 10`; S.line(z, '#e2b84a', 1.4); } for (const x of [86, 214]) { S.fill(rect(x - 20, 20, 40, 170), ['#b8322a', '#c7a03a'][x > 150 ? 1 : 0]); let st = ''; for (let i = 0; i < 9; i++) st += rect(x - 20, 24 + i * 19, 40, 6); S.fill(st, '#1a1a22', .75); let z = ''; for (let i = 0; i < 8; i++) z += `M${x - 20} ${40 + i * 19}l10 -6l10 6l10 -6l10 6`; S.line(z, '#f4efe2', 1.3); } S.fill(rect(0, 0, 300, 16), '#3a2010'); }
  } else {
    // the hearth or forge at one side, its light on everything; tools on the wall
    S.fill(rect(0, 150, 86, 200), dark); S.fill(blob([[8, 300], [14, 216], [44, 190], [72, 216], [78, 300]], .8), '#1c1210'); S.fill(blob([[20, 300], [26, 250], [44, 228], [60, 250], [66, 300]], .9), '#ff8a2a'); S.fill(blob([[30, 300], [36, 266], [44, 250], [52, 268], [56, 300]], .9), '#ffd070');
    S.fill(rect(0, 0, 300, 480), S.rad(44, 270, 210, [[0, '#ff9a40', .5], [.5, '#ff9a40', .14], [1, '#ff9a40', 0]]));
    S.fill(rect(96, 96, 96, 5), dark); let tl = ''; for (let i = 0; i < 5; i++) { const x = 104 + i * 20; tl += `M${x} 101v${30 + (i % 2) * 10}M${x - 4} ${131 + (i % 2) * 10}h8`; } S.line(tl, mixc(dark, '#c8ccd4', .4), 2.2);
    if (land === 'steppe') { let lt = ''; for (let i = 0; i < 12; i++) lt += `M${i * 28 - 10} 330l14 -50l14 50M${i * 28 - 10} 330l14 50l14 -50`; S.line(lt, '#7a5a3a', 1.6, .7); }
    if (land === 'south') { let z = ''; for (let i = 0; i < 10; i++) z += `M${i * 32} 60l16 -14l16 14`; S.line(z, '#f0d9a0', 1.6, .7); }
    if (land === 'desert') { let z = ''; for (let i = 0; i < 12; i++) z += PZ([[i * 26, 60], [i * 26 + 7, 53], [i * 26 + 14, 60], [i * 26 + 7, 67]]); S.fill(z, '#2f7f8a', .7); }
    if (land === 'north') { S.fill(rect(0, 60, 300, 7), dark); S.fill(rect(0, 0, 300, 20), dark); }
  }
}
