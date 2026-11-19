// The designed continent's sketch (orders 72 and 73; D-152, D-153). It reads
//   docs/design/m1/reference/owner-continent.webp   the owner's picture of the continent,
//   docs/design/m1/design/seats.tsv                 the 306 provinces re-seated on it (pixel positions),
//   docs/design/m1/design/features.json             waters, rivers, ranges, passes, roads, border lines, the edits,
//   src/core/release/core/00-lore.json              LORE.map's province list (names, realms, types) and the realms,
// and it
//   1. reads the picture's land, lakes and ground by colour and lays them on the game's 700 x 450 grid of 10 km cells;
//   2. applies the listed edits and names every water;
//   3. grows every province from its seat over the land: high ground, border rivers and the authored border lines cost
//      more to cross, so borders fall on ridges and rivers;
//   4. checks the design's rules: every seat on land, each realm one piece (islands aside), no realm enclosed by another;
//   5. writes design/land.png, design/provinces.png, design/build.json and design/tables.md;
//   6. draws design-sketch.png (the clean map) and design-on-picture.jpg (the same lines over the owner's picture).
// Nothing here is game code: it is the design's drawing board. Deterministic: no clock, no random draw.
//   node tools/m1/design-sketch.mjs [--dir=docs/design/m1] [--scale=4] [--quiet]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
const args = process.argv.slice(2), opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const DIR = path.resolve(opt('dir', 'docs/design/m1')), K = +opt('scale', 4), QUIET = args.includes('--quiet');
const say = (...a) => { if (!QUIET) console.log(...a); };
const F = JSON.parse(fs.readFileSync(path.join(DIR, 'design/features.json'), 'utf8'));
const LORE = JSON.parse(fs.readFileSync(path.resolve('src/core/release/core/00-lore.json'), 'utf8'));
const PICTURE = path.join(DIR, 'reference/owner-continent.webp');
const GW = F.frame.gridW, GH = F.frame.gridH, CELL = F.frame.cellKm, N = GW * GH;
const S = F.transform.kmPerPx, OX = F.transform.originXKm, OY = F.transform.originYKm;
const px2cell = (px, py) => [Math.floor((OX + S * px) / CELL), Math.floor((OY + S * py) / CELL)];
const cell2px = (cx, cy) => [((cx + 0.5) * CELL - OX) / S, ((cy + 0.5) * CELL - OY) / S];

// ---------------------------------------------------------------- the seats
const LP = LORE.map.provinces, seats = [];
for (const line of fs.readFileSync(path.join(DIR, 'design/seats.tsv'), 'utf8').split('\n')) {
  if (!line.trim() || line.startsWith('#')) continue;
  const [id, name, px, py, site] = line.split('\t');
  const p = LP[+id];
  if (!p) throw new Error('seats.tsv: no province ' + id);
  if (p.name !== name) throw new Error(`seats.tsv: province ${id} is "${p.name}" in LORE.map, not "${name}"`);
  if (seats[+id]) throw new Error('seats.tsv: province ' + id + ' twice');
  seats[+id] = { id: +id, name, realm: p.realm, type: p.type, px: +px, py: +py, site: site || '' };
}
for (let i = 0; i < LP.length; i++) if (!seats[i]) throw new Error('seats.tsv: province ' + i + ' ' + LP[i].name + ' has no seat');
const realmName = r => (r === 'unclaimed' ? 'the wilds' : LORE.realms[r].short);

// ---------------------------------------------------------------- 1. the picture, read in a page (a browser decodes WebP)
const b = await pw.chromium.launch();
const pg = await b.newPage({ viewport: { width: 1200, height: 800 } });
await pg.setContent('<canvas id=c></canvas>');
const picData = 'data:image/webp;base64,' + fs.readFileSync(PICTURE).toString('base64');
const pic = await pg.evaluate(async src => {
  const im = new Image(); im.src = src; await im.decode(); window.PICTURE = im;
  const W = im.naturalWidth, H = im.naturalHeight, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
  const d = g.getImageData(0, 0, W, H).data, n = W * H;
  // a small box blur tames the picture's inked lines before the colours are read
  const R = 2, br = new Float32Array(n), bg = new Float32Array(n), bb = new Float32Array(n);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let r = 0, gg = 0, b2 = 0, m = 0;
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const k = (yy * W + xx) * 4; r += d[k]; gg += d[k + 1]; b2 += d[k + 2]; m++; }
    const k = y * W + x; br[k] = r / m; bg[k] = gg / m; bb[k] = b2 / m;
  }
  // classes: 0 water, 1 green, 2 sand, 3 brown, 4 snow, 5 dark red, 6 other (grey rock, shadow)
  const cls = new Uint8Array(n), lum = new Uint8Array(n);
  for (let k = 0; k < n; k++) {
    const r = br[k], g2 = bg[k], b2 = bb[k], mx = Math.max(r, g2, b2), mn = Math.min(r, g2, b2), sat = mx ? (mx - mn) / mx : 0;
    let c2;
    if (b2 > r + 18 && b2 >= g2 - 4) c2 = 0;
    else if (mn > 150 && sat < 0.18) c2 = 4;
    else if (r > g2 + 30 && r > b2 + 40 && r < 150 && g2 < 80) c2 = 5;
    else if (r > 150 && g2 > 110 && b2 < g2 - 25 && r >= g2) c2 = 2;
    else if (g2 >= r - 6 && g2 > b2 + 10) c2 = 1;
    else if (r > b2 + 12) c2 = 3;
    else c2 = 6;
    cls[k] = c2; lum[k] = Math.round(0.3 * r + 0.59 * g2 + 0.11 * b2);
  }
  const b64 = a => { let s = ''; for (let i = 0; i < a.length; i += 32768) s += String.fromCharCode.apply(null, a.subarray(i, i + 32768)); return btoa(s); };
  const bytes = a => Uint8Array.from(a, v => Math.round(v));
  return { W, H, cls: b64(cls), lum: b64(lum), r: b64(bytes(br)), g: b64(bytes(bg)), b: b64(bytes(bb)) };
}, picData);
const PW = pic.W, PH = pic.H, PN = PW * PH;
const cls = Uint8Array.from(Buffer.from(pic.cls, 'base64')), lum = Uint8Array.from(Buffer.from(pic.lum, 'base64'));
const picR = Uint8Array.from(Buffer.from(pic.r, 'base64')), picG = Uint8Array.from(Buffer.from(pic.g, 'base64')), picB = Uint8Array.from(Buffer.from(pic.b, 'base64'));

// the continent, its islets and its lakes on the picture's own pixels
const pland = new Uint8Array(PN);
for (let k = 0; k < PN; k++) { const x = k % PW, y = (k / PW) | 0; pland[k] = cls[k] !== 0 && x >= 16 && y >= 16 && x < PW - 16 && y < PH - 16 ? 1 : 0; }
function components(mask, W, H, want) {
  const comp = new Int32Array(W * H).fill(-1), list = [];
  for (let s = 0; s < W * H; s++) {
    if (mask[s] !== want || comp[s] >= 0) continue;
    const id = list.length, st = [s], c = { id, n: 0, x0: W, x1: 0, y0: H, y1: 0, sx: 0, sy: 0, cells: [] }; comp[s] = id;
    while (st.length) {
      const k = st.pop(), x = k % W, y = (k / W) | 0; c.n++; c.sx += x; c.sy += y; c.cells.push(k);
      if (x < c.x0) c.x0 = x; if (x > c.x1) c.x1 = x; if (y < c.y0) c.y0 = y; if (y > c.y1) c.y1 = y;
      if (x > 0 && mask[k - 1] === want && comp[k - 1] < 0) { comp[k - 1] = id; st.push(k - 1); }
      if (x < W - 1 && mask[k + 1] === want && comp[k + 1] < 0) { comp[k + 1] = id; st.push(k + 1); }
      if (y > 0 && mask[k - W] === want && comp[k - W] < 0) { comp[k - W] = id; st.push(k - W); }
      if (y < H - 1 && mask[k + W] === want && comp[k + W] < 0) { comp[k + W] = id; st.push(k + W); }
    }
    list.push(c);
  }
  return { comp, list };
}
const pc = components(pland, PW, PH, 1);
const mainP = pc.list.reduce((a, c) => (c.n > a.n ? c : a), pc.list[0]);
// An islet is coloured ground (green, sand, brown, red) off the continent, with the rock, snow and surf drawn within two
// pixels of it; the picture's clouds, compass and scale bar are white and grey with no coloured ground, so they fall away.
// features.json may keep an islet the rule misses (a snow isle) or drop a piece it wrongly takes (a cloud's shadow).
const keep = new Uint8Array(PN);   // 1 continent, 2 islet, 3 lake, 0 sea (and ornaments)
for (const k of mainP.cells) keep[k] = 1;
const islets = [];
{ const cand = new Uint8Array(PN), dist = new Uint8Array(PN).fill(255), q = [];
  for (let k = 0; k < PN; k++) if (pland[k] && pc.comp[k] !== mainP.id && (cls[k] === 1 || cls[k] === 2 || cls[k] === 3 || cls[k] === 5)) { dist[k] = 0; cand[k] = 1; q.push(k); }
  for (let h = 0; h < q.length; h++) { const k = q[h]; if (dist[k] >= 2) continue; const x = k % PW;
    for (const j of [x > 0 ? k - 1 : -1, x < PW - 1 ? k + 1 : -1, k - PW, k + PW]) if (j >= 0 && j < PN && pland[j] && pc.comp[j] !== mainP.id && dist[j] === 255) { dist[j] = dist[k] + 1; cand[j] = 1; q.push(j); } }
  const inBox = (c, b) => c.sx / c.n >= b[0] && c.sy / c.n >= b[1] && c.sx / c.n <= b[2] && c.sy / c.n <= b[3];
  const drop = (F.edits.dropIslets || []).map(d => d.box), keepPts = (F.edits.keepIslets || []).map(d => d.at);
  for (const c of components(cand, PW, PH, 1).list) {
    let core = 0; for (const k of c.cells) if (dist[k] === 0) core++;
    const ok = c.n >= 10 && core >= 6 && core / c.n > 0.3 && c.x0 > 110 && c.x1 < 1450 && c.y0 > 20 && c.y1 < 990 && !(c.x1 < 200 && c.y1 < 220) && !(c.y0 > 930 && c.x1 < 470) && !drop.some(b => inBox(c, b));
    if (ok) { for (const k of c.cells) keep[k] = 2; islets.push({ n: c.n, x: Math.round(c.sx / c.n), y: Math.round(c.sy / c.n), box: [c.x0, c.y0, c.x1, c.y1] }); }
  }
  for (const at of keepPts) { const c = pc.list[pc.comp[at[1] * PW + at[0]]]; if (!c || c === mainP) throw new Error('keepIslets: no piece of land at ' + at); for (const k of c.cells) keep[k] = 2; islets.push({ n: c.n, x: Math.round(c.sx / c.n), y: Math.round(c.sy / c.n), box: [c.x0, c.y0, c.x1, c.y1], kept: true }); }
  if (args.includes('--islets')) for (const i of islets.sort((a, b) => b.n - a.n)) console.log('islet', String(i.n).padStart(5), 'px at', i.x, i.y, 'box', i.box.join(','), i.kept ? '(kept by features.json)' : '');
}
{ // lakes: water the sea does not reach
  const water = new Uint8Array(PN); for (let k = 0; k < PN; k++) water[k] = keep[k] ? 0 : 1;
  const sea = new Uint8Array(PN), q = [];
  for (let k = 0; k < PN; k++) { const x = k % PW, y = (k / PW) | 0; if ((x === 0 || y === 0 || x === PW - 1 || y === PH - 1) && water[k]) { sea[k] = 1; q.push(k); } }
  for (let h = 0; h < q.length; h++) { const k = q[h], x = k % PW; for (const j of [x > 0 ? k - 1 : -1, x < PW - 1 ? k + 1 : -1, k - PW, k + PW]) if (j >= 0 && j < PN && water[j] && !sea[j]) { sea[j] = 1; q.push(j); } }
  const lk = new Uint8Array(PN); for (let k = 0; k < PN; k++) lk[k] = water[k] && !sea[k] ? 1 : 0;
  for (const c of components(lk, PW, PH, 1).list) if (c.n >= 12) for (const k of c.cells) keep[k] = 3;
}

// ---------------------------------------------------------------- 2. the game's grid
// each 10 km cell reads nine points of the picture
const water = new Uint8Array(N);          // 0 land, 1 sea, 2 lake
const frac = Array.from({ length: 7 }, () => new Float32Array(N)), lumG = new Float32Array(N);
const mR = new Float32Array(N), mG = new Float32Array(N), mB = new Float32Array(N), rug = new Float32Array(N);   // the cell's mean colour, and how rough the picture's drawing is there
for (let cy = 0; cy < GH; cy++) for (let cx = 0; cx < GW; cx++) {
  let land = 0, lake = 0, tot = 0, lg = 0, ng = 0, sr = 0, sg = 0, sb = 0; const n = [0, 0, 0, 0, 0, 0, 0];
  for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) {
    const px = Math.floor(((cx + (sx + 0.5) / 3) * CELL - OX) / S), py = Math.floor(((cy + (sy + 0.5) / 3) * CELL - OY) / S); tot++;
    if (px < 0 || py < 0 || px >= PW || py >= PH) continue;
    const k = py * PW + px, v = keep[k];
    if (v === 1 || v === 2) { land++; n[cls[k]]++; sr += picR[k]; sg += picG[k]; sb += picB[k]; if (cls[k] === 1) { lg += lum[k]; ng++; } } else if (v === 3) lake++;
  }
  const c = cy * GW + cx;
  water[c] = land >= 5 ? 0 : lake >= 4 ? 2 : 1;
  if (land) { for (let i = 0; i < 7; i++) frac[i][c] = n[i] / land; mR[c] = sr / land; mG[c] = sg / land; mB[c] = sb / land; }
  { // roughness: the spread of the picture's light and dark within 4 pixels of the cell's middle
    const px0 = Math.round(((cx + 0.5) * CELL - OX) / S), py0 = Math.round(((cy + 0.5) * CELL - OY) / S); let m = 0, s1 = 0, s2 = 0;
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const x = px0 + dx, y = py0 + dy; if (x < 0 || y < 0 || x >= PW || y >= PH) continue; const k = y * PW + x; if (keep[k] !== 1 && keep[k] !== 2) continue; m++; s1 += lum[k]; s2 += lum[k] * lum[k]; }
    rug[c] = m > 8 ? Math.sqrt(Math.max(0, s2 / m - (s1 / m) ** 2)) : 0; }
  lumG[c] = ng ? lg / ng : 0;
}
if (opt('probe', '')) { // --probe="x,y;x,y": what the picture shows round those pixels (the mean of the 5 x 5 cells there)
  for (const pt of opt('probe', '').split(';')) { const [px, py, name] = pt.split(','), [cx, cy] = px2cell(+px, +py); let m = 0; const f = [0, 0, 0, 0, 0, 0, 0]; let r = 0, g = 0, b2 = 0, ru = 0, lg = 0, nlg = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const c = (cy + dy) * GW + cx + dx; if (water[c]) continue; m++; for (let i = 0; i < 7; i++) f[i] += frac[i][c]; r += mR[c]; g += mG[c]; b2 += mB[c]; ru += rug[c]; if (lumG[c]) { lg += lumG[c]; nlg++; } }
    console.log((name || '').padEnd(14), String(px).padStart(5), String(py).padStart(4), 'rgb', [r, g, b2].map(v => String(Math.round(v / m)).padStart(3)).join(' '), 'rug', (ru / m).toFixed(1).padStart(5), 'lumG', String(Math.round(nlg ? lg / nlg : 0)).padStart(3), 'green/sand/brown/snow/red/other', [1, 2, 3, 4, 5, 6].map(i => (f[i] / m).toFixed(2)).join(' ')); }
}
// the edits
const cutLine = (line, width, fn) => {
  for (let i = 0; i + 1 < line.length; i++) {
    const [ax, ay] = px2cellF(line[i]), [bx, by] = px2cellF(line[i + 1]), n = Math.ceil(Math.hypot(bx - ax, by - ay) * 3) + 1;
    for (let t = 0; t <= n; t++) { const x = ax + (bx - ax) * t / n, y = ay + (by - ay) * t / n, r = width / 2;
      for (let yy = Math.floor(y - r); yy <= Math.ceil(y + r); yy++) for (let xx = Math.floor(x - r); xx <= Math.ceil(x + r); xx++) if (xx >= 0 && yy >= 0 && xx < GW && yy < GH && Math.hypot(xx + 0.5 - x, yy + 0.5 - y) <= r + 0.35) fn(yy * GW + xx); }
  }
};
function px2cellF([px, py]) { return [(OX + S * px) / CELL, (OY + S * py) / CELL]; }
const edited = { carved: 0, opened: 0, added: 0, filled: 0 }, addedLand = new Uint8Array(N);
for (const e of F.edits.carveSea) cutLine(e.line, e.width, c => { if (water[c] !== 1) { water[c] = 1; edited.carved++; } });
for (const e of F.edits.openWater || []) cutLine(e.line, e.width, c => { if (water[c] === 0) { water[c] = 2; edited.opened++; } });
for (const e of F.edits.addLand) {
  const [ex, ey] = px2cellF([e.ellipse[0], e.ellipse[1]]), rx = e.ellipse[2] * S / CELL, ry = e.ellipse[3] * S / CELL;
  for (let yy = Math.floor(ey - ry); yy <= Math.ceil(ey + ry); yy++) for (let xx = Math.floor(ex - rx); xx <= Math.ceil(ex + rx); xx++) {
    // an island's outline, not an oval: the edge wobbles with a fixed pattern
    const a = Math.atan2(yy + 0.5 - ey, xx + 0.5 - ex), wob = 1 + 0.16 * Math.sin(3 * a + 1.3) + 0.1 * Math.sin(7 * a + 0.4);
    if (((xx + 0.5 - ex) / (rx * wob)) ** 2 + ((yy + 0.5 - ey) / (ry * wob)) ** 2 <= 1) { const c = yy * GW + xx; if (water[c]) { water[c] = 0; addedLand[c] = 1; edited.added++; for (let i = 0; i < 7; i++) frac[i][c] = i === 1 ? 1 : 0; mR[c] = 96; mG[c] = 104; mB[c] = 78; rug[c] = 12; lumG[c] = 100; } }
  }
}
// one landmass: join pieces that touch the continent only at a corner, drop single-cell specks
const nb4 = c => { const x = c % GW, y = (c / GW) | 0; return [x > 0 ? c - 1 : -1, x < GW - 1 ? c + 1 : -1, y > 0 ? c - GW : -1, y < GH - 1 ? c + GW : -1]; };
const landMask = () => Uint8Array.from(water, v => (v === 0 ? 1 : 0));
for (let pass = 0; pass < 3; pass++) {
  const lc = components(landMask(), GW, GH, 1), main = lc.list.reduce((a, c) => (c.n > a.n ? c : a), lc.list[0]);
  let changed = 0;
  for (const c of lc.list) {
    if (c === main) continue;
    if (c.n === 1) { water[c.cells[0]] = 1; changed++; continue; }
    // touching the continent at a corner: fill the corner's sea cell that has most land round it
    let done = false;
    for (const k of c.cells) { if (done) break; const x = k % GW, y = (k / GW) | 0;
      for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= GW || yy >= GH) continue;
        if (lc.comp[yy * GW + xx] === main.id) { const a = y * GW + xx, b2 = yy * GW + x; const pick = water[a] === 1 ? a : b2; water[pick] = 0; for (let i = 0; i < 7; i++) frac[i][pick] = frac[i][k]; changed++; done = true; break; } } }
  }
  if (!changed) break;
}
// sea and lakes on the grid; an enclosed water too small for the map that no name claims becomes land again
const W = F.waters, lakeKinds = new Set(['lake', 'salt lake', 'inland sea', 'lagoon']);
const labelCell = w => { const [x, y] = px2cell(w.at[0], w.at[1]); return Math.max(0, Math.min(GH - 1, y)) * GW + Math.max(0, Math.min(GW - 1, x)); };
const seaAndLakes = () => { const wmask = Uint8Array.from(water, v => (v ? 1 : 0)), sea = new Uint8Array(N), q = [];
  for (let c = 0; c < N; c++) { const x = c % GW, y = (c / GW) | 0; if ((x === 0 || y === 0 || x === GW - 1 || y === GH - 1) && wmask[c]) { sea[c] = 1; q.push(c); } }
  for (let h = 0; h < q.length; h++) for (const j of nb4(q[h])) if (j >= 0 && wmask[j] && !sea[j]) { sea[j] = 1; q.push(j); }
  for (let c = 0; c < N; c++) if (wmask[c]) water[c] = sea[c] ? 1 : 2; };
seaAndLakes();
const waterName = new Int16Array(N).fill(-1), waterCells = W.map(() => 0), unnamedLakes = [];
// a filled water takes the ground of the land beside it
const fillAsLand = cells => { const src = cells.map(k => { for (let r = 1; r <= 8; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const x = k % GW + dx, y = ((k / GW) | 0) + dy; if (x >= 0 && y >= 0 && x < GW && y < GH && !water[y * GW + x]) return y * GW + x; } return -1; });
  cells.forEach((k, n) => { const j = src[n]; for (let i = 0; i < 7; i++) frac[i][k] = j >= 0 ? frac[i][j] : (i === 1 ? 1 : 0); lumG[k] = j >= 0 ? lumG[j] : 90; if (j >= 0) { mR[k] = mR[j]; mG[k] = mG[j]; mB[k] = mB[j]; rug[k] = rug[j]; } });
  for (const k of cells) { water[k] = 0; edited.filled++; } };
{ const lk = components(Uint8Array.from(water, v => (v === 2 ? 1 : 0)), GW, GH, 1), claim = new Map(), minCells = (F.edits.smallLakes || {}).minCells || 0;
  const drops = (F.edits.dropLakes || []).map(d => px2cell(d.at[0], d.at[1]));
  W.forEach((w, i) => { if (!lakeKinds.has(w.kind)) return; const c0 = labelCell(w); let best = -1, bd = 1e9;
    for (const c of lk.list) for (const k of c.cells) { const d = Math.hypot(k % GW - c0 % GW, ((k / GW) | 0) - ((c0 / GW) | 0)); if (d < bd) { bd = d; best = c.id; } }
    w.found = bd <= 3 && !claim.has(best); w.away = Math.round(bd); if (w.found) claim.set(best, i); });
  for (const c of lk.list) {
    if (claim.has(c.id)) { const i = claim.get(c.id); for (const k of c.cells) { waterName[k] = i; waterCells[i]++; } continue; }
    const dropped = drops.some(d => c.cells.some(k => Math.hypot(k % GW - d[0], ((k / GW) | 0) - d[1]) <= 3));
    if (c.n < minCells || dropped) fillAsLand(c.cells);
    else unnamedLakes.push({ n: c.n, at: cell2px(c.sx / c.n, c.sy / c.n).map(Math.round) });
  }
  // the sea: a flood from each sea label, each kind of water reaching only so far (in cells); then the oceans take what is left
  const REACH = { strait: 7, bay: 26, sound: 30, gulf: 48, sea: 60, ocean: 1e9 };
  const flood = only => { const q = [], dist = new Int32Array(N).fill(1e9);
    W.forEach((w, i) => { if (lakeKinds.has(w.kind) || (only && w.kind !== 'ocean')) return; let c0 = labelCell(w);
      if (water[c0] !== 1) { let bd = 1e9, bk = -1; const x0 = c0 % GW, y0 = (c0 / GW) | 0; for (let yy = Math.max(0, y0 - 12); yy <= Math.min(GH - 1, y0 + 12); yy++) for (let xx = Math.max(0, x0 - 12); xx <= Math.min(GW - 1, x0 + 12); xx++) { const k = yy * GW + xx; if (water[k] === 1) { const d = Math.hypot(xx - x0, yy - y0); if (d < bd) { bd = d; bk = k; } } } c0 = bk; }
      if (!only) w.found = c0 >= 0;
      const seed = k => { if (k >= 0 && water[k] === 1 && (!only || waterName[k] < 0)) { if (!only || waterName[k] < 0) waterName[k] = i; dist[k] = 0; q.push(k); } };
      seed(c0); for (const at of w.also || []) { const [x, y] = px2cell(at[0], at[1]); seed(Math.max(0, Math.min(GH - 1, y)) * GW + Math.max(0, Math.min(GW - 1, x))); } });
    for (let h = 0; h < q.length; h++) { const k = q[h], i = waterName[k], lim = w => (w.reach != null ? w.reach : REACH[w.kind] || 30); if (dist[k] >= lim(W[i])) continue;
      for (const j of nb4(k)) if (j >= 0 && water[j] === 1 && (only ? waterName[j] < 0 : dist[j] > dist[k] + 1)) { if (!only && dist[j] < 1e9 && waterName[j] !== i && dist[j] <= dist[k] + 1) continue; dist[j] = dist[k] + 1; waterName[j] = i; q.push(j); } } };
  flood(false); flood(true);
  for (let c = 0; c < N; c++) if (water[c] === 1 && waterName[c] >= 0) waterCells[waterName[c]]++; }
const landC = components(landMask(), GW, GH, 1), mainland = landC.list.reduce((a, c) => (c.n > a.n ? c : a), landC.list[0]);
let landCells = 0; for (let c = 0; c < N; c++) if (!water[c]) landCells++;

// The height guide, from what the picture paints. Snow is highest. Bare rock is grey (red, green and blue alike) or brown
// (red over green, with little yellow), and it counts for more where the drawing is rough with ridges. Green, yellow and
// sand are low ground. One blur makes blocks of it.
const clamp01 = v => Math.max(0, Math.min(1, v));
const rockOf = c => { const R = mR[c], G = mG[c], B = mB[c], gb = G - B, lum = 0.3 * R + 0.59 * G + 0.11 * B;
  const grey = Math.abs(R - G) <= 6 ? clamp01((14 - gb) / 8) : 0, brown = clamp01((R - G - 5) / 8) * clamp01((40 - gb) / 14), rf = Math.max(0.2, clamp01((rug[c] - 8) / 10));
  let v = Math.max(grey, brown) * rf; const sat = Math.max(R, G, B) ? (Math.max(R, G, B) - Math.min(R, G, B)) / Math.max(R, G, B) : 0;
  if (lum < 50 && sat < 0.3 && v < 0.3) v = Math.max(v, 0.32);            // dark broken country: hills
  return v; };
const hRaw = new Float32Array(N);
for (let c = 0; c < N; c++) if (!water[c]) hRaw[c] = Math.min(1, 0.07 + 0.55 * rockOf(c) + 0.5 * frac[4][c]);
const blurLand = (a, r, passes) => { let cur = a; for (let p = 0; p < passes; p++) { const out = new Float32Array(N);
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const c = y * GW + x; if (water[c]) continue; let s = 0, m = 0;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= GW || yy >= GH) continue; const k = yy * GW + xx; if (water[k]) continue; s += cur[k]; m++; }
      out[c] = s / m; } cur = out; } return cur; };
const height = blurLand(hRaw, 2, 1);
const polyCells = (poly, fn) => { const q = poly.map(px2cellF), xs = q.map(v => v[0]), ys = q.map(v => v[1]);
  const inside = (x, y) => { let inq = false; for (let i = 0, j = q.length - 1; i < q.length; j = i++) { const [xi, yi] = q[i], [xj, yj] = q[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inq = !inq; } return inq; };
  for (let y = Math.max(0, Math.floor(Math.min(...ys))); y <= Math.min(GH - 1, Math.ceil(Math.max(...ys))); y++) for (let x = Math.max(0, Math.floor(Math.min(...xs))); x <= Math.min(GW - 1, Math.ceil(Math.max(...xs))); x++) if (inside(x + 0.5, y + 0.5)) fn(y * GW + x); };
for (const o of F.heightSet || []) polyCells(o.poly, c => { if (!water[c]) height[c] = Math.max(height[c], o.min); });   // a high plateau the picture paints green
// The ground of every cell, from the picture's colour there, the height guide and the latitude; then the design's own
// word where features.json sets one (a ground the picture's paint cannot tell apart, such as grass from wood).
const GROUND = ['sea', 'lake', 'ice', 'tundra', 'rock', 'taiga', 'forest', 'jungle', 'grass', 'scrub', 'steppe', 'desert', 'ash', 'marsh'];
const latOf = cy => F.latitude.top + (F.latitude.bottom - F.latitude.top) * ((cy + 0.5) / GH);
let ground = new Uint8Array(N);
for (let c = 0; c < N; c++) {
  if (water[c]) { ground[c] = water[c] === 1 ? 0 : 1; continue; }
  const R = mR[c], G = mG[c], B = mB[c], gb = G - B, lum = 0.3 * R + 0.59 * G + 0.11 * B, h = height[c], lat = latOf((c / GW) | 0);
  let g;
  if (frac[4][c] >= 0.35) g = 2;                                                        // snow
  else if (h >= 0.47) g = 4;                                                            // bare rock
  else if (R - G >= 17 && gb >= 32) g = lat >= 40 ? 10 : gb >= 45 ? 11 : 9;             // dry yellow: steppe, sand or thorn scrub
  else if (lum < 62 && G >= R - 4) g = lat >= 53 ? 5 : lat < 23 ? 7 : 6;                // dark green: wood
  else if (lat < 23 && G >= R && lum < 95) g = 7;                                       // the wet south
  else if (lat >= 57) g = 3;
  else if (R - G >= 10 && lat < 37) g = 9;                                              // brown dry hills of the south
  else g = lat < 30 && gb >= 40 ? 9 : 8;                                                // savanna, or grass and farmland
  ground[c] = g;
}
{ // one pass of a 3 x 3 vote takes the speckle out
  const o = Uint8Array.from(ground);
  for (let y = 1; y < GH - 1; y++) for (let x = 1; x < GW - 1; x++) { const c = y * GW + x; if (water[c]) continue; const cnt = new Uint8Array(GROUND.length); let best = ground[c], bn = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const v = ground[c + dy * GW + dx]; if (v < 2) continue; const n = ++cnt[v]; if (n > bn || (n === bn && v === ground[c])) { bn = n; best = v; } } o[c] = best; }
  ground = o; }
for (const o of F.groundSet || []) { // the design's word for a stretch of ground: only the kinds listed in "from" change
  const to = GROUND.indexOf(o.ground), from = new Set((o.from || ['grass', 'forest', 'scrub', 'taiga', 'steppe', 'desert', 'jungle', 'tundra']).map(w => GROUND.indexOf(w)));
  if (to < 0) throw new Error('groundSet: no ground called ' + o.ground);
  polyCells(o.poly, c => { if (from.has(ground[c])) ground[c] = to; });
}
for (let c = 0; c < N; c++) if (!water[c] && height[c] >= 0.47 && ground[c] !== 2 && ground[c] !== 12) ground[c] = 4;   // rock where the height guide says so
// the height guide in the engine's own measure (sea 0; alpine above 0.36, snow above 0.5)
const elevGuide = Float32Array.from(height, (h, c) => (water[c] ? 0 : Math.min(0.7, 0.012 + 0.66 * Math.pow(h, 1.35))));

// rivers and border lines on the grid
const riverAt = new Int16Array(N).fill(-1), barrier = new Float32Array(N);
F.rivers.forEach((r, i) => cutLine(r.line, 1, c => { if (!water[c]) { riverAt[c] = i; if (r.border) barrier[c] = Math.max(barrier[c], 16); } }));
const lineAt = new Int16Array(N).fill(-1);
F.borderLines.forEach((l, i) => cutLine(l.line, 1.2, c => { if (!water[c]) { barrier[c] = Math.max(barrier[c], 26); lineAt[c] = i; } }));

// ---------------------------------------------------------------- 3. the provinces, grown from their seats
const seatCell = new Int32Array(seats.length), snapped = [], seatFar = [], taken = new Set();
seats.forEach(s => {
  let [x, y] = px2cell(s.px, s.py); x = Math.max(0, Math.min(GW - 1, x)); y = Math.max(0, Math.min(GH - 1, y)); let c = y * GW + x;
  if (water[c] || taken.has(c)) { const wet = !!water[c]; let bd = 1e9, bk = -1;
    for (let yy = Math.max(0, y - 8); yy <= Math.min(GH - 1, y + 8); yy++) for (let xx = Math.max(0, x - 8); xx <= Math.min(GW - 1, x + 8); xx++) { const k = yy * GW + xx; if (!water[k] && !taken.has(k)) { const d = Math.hypot(xx - x, yy - y); if (d < bd) { bd = d; bk = k; } } }
    snapped.push(`${s.id} ${s.name} (${s.px},${s.py}): seat ${wet ? 'in water' : 'on a taken cell'}, moved ${bd < 1e9 ? Math.round(bd * CELL) + ' km' : 'NOWHERE'}`);
    if (bk < 0) { for (let k = 0; k < N; k++) if (!water[k] && !taken.has(k)) { const d = Math.hypot(k % GW - x, ((k / GW) | 0) - y); if (d < bd) { bd = d; bk = k; } } seatFar.push(`${s.id} ${s.name} (${s.px},${s.py}) has no land within 80 km: put ${Math.round(bd * CELL)} km away`); }
    c = bk; }
  taken.add(c); seatCell[s.id] = c; s.cx = c % GW; s.cy = (c / GW) | 0;
});
const prov = new Int16Array(N).fill(-1), cost = new Float64Array(N).fill(Infinity);
{ // a binary heap of (cost, cell)
  const hk = [], hv = []; const push = (k, v) => { let i = hk.length; hk.push(k); hv.push(v); while (i > 0) { const p = (i - 1) >> 1; if (hk[p] <= k) break; hk[i] = hk[p]; hv[i] = hv[p]; i = p; } hk[i] = k; hv[i] = v; };
  const pop = () => { const top = [hk[0], hv[0]], lk = hk.pop(), lv = hv.pop(), n = hk.length; if (n) { let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i, mk = lk; if (l < n && hk[l] < mk) { m = l; mk = hk[l]; } if (r < n && hk[r] < mk) { m = r; } if (m === i) break; hk[i] = hk[m]; hv[i] = hv[m]; i = m; } hk[i] = lk; hv[i] = lv; } return top; };
  seats.forEach(s => { const c = seatCell[s.id]; cost[c] = 0; prov[c] = s.id; push(0, c); });
  while (hk.length) {
    const [d, c] = pop(); if (d > cost[c]) continue;
    const x = c % GW, y = (c / GW) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue; const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= GW || yy >= GH) continue;
      const j = yy * GW + xx; if (water[j]) continue;
      if (dx && dy && water[y * GW + xx] && water[yy * GW + x]) continue;                  // no squeezing between two water corners
      const hh = Math.max(height[c], height[j]);
      const nd = d + (dx && dy ? 1.4142 : 1) * (1 + 14 * hh * hh) + barrier[j];
      if (nd < cost[j]) { cost[j] = nd; prov[j] = prov[c]; push(nd, j); }
    }
  }
}
// islets no seat reaches: a named isle goes to the province features.json gives it, any other whole to the province
// nearest it within 400 km, else to none (a rock in the sea)
const isleNotes = [];
{ const looseMask = new Uint8Array(N); for (let c = 0; c < N; c++) if (!water[c] && prov[c] < 0) looseMask[c] = 1;
  const loose = components(looseMask, GW, GH, 1), give = new Map();
  for (const isle of F.isles || []) { const [x0, y0] = px2cell(isle.at[0], isle.at[1]); let bd = 1e9, best = null;
    for (const c of loose.list) for (const k of c.cells) { const d = Math.hypot(k % GW - x0, ((k / GW) | 0) - y0); if (d < bd) { bd = d; best = c; } }
    if (best && bd <= 4) { give.set(best, isle.province); isle.cells = best.n; } else if (landC.comp[y0 * GW + x0] >= 0 || bd > 4) isle.cells = isle.cells || 0; }
  for (const isl of loose.list) { if (give.has(isl)) continue; let bd = 1e9, bp = -1;
    for (const c of isl.cells) { const x = c % GW, y = (c / GW) | 0;
      for (let yy = Math.max(0, y - 40); yy <= Math.min(GH - 1, y + 40); yy++) for (let xx = Math.max(0, x - 40); xx <= Math.min(GW - 1, x + 40); xx++) { const k = yy * GW + xx; if (water[k] || cost[k] === Infinity) continue; const d = Math.hypot(xx - x, yy - y); if (d < bd) { bd = d; bp = prov[k]; } } }
    if (bp >= 0) give.set(isl, bp); else isleNotes.push(`an islet of ${isl.n} cells at picture ${cell2px(isl.sx / isl.n, isl.sy / isl.n).map(Math.round)} is more than 400 km from any province: no province`); }
  for (const [isl, bp] of give) for (const c of isl.cells) prov[c] = bp; }

// ---------------------------------------------------------------- 4. the facts and the checks
const P = seats.map(s => ({ ...s, cells: 0, coast: false, lake: false, waters: new Set(), adj: new Set(), cls: [0, 0, 0, 0, 0, 0, 0], h: 0, sx: 0, sy: 0, lumG: 0, nG: 0, river: new Set() }));
for (let c = 0; c < N; c++) {
  const id = prov[c]; if (id < 0) continue; const a = P[id]; a.cells++; a.h += height[c]; a.sx += c % GW; a.sy += (c / GW) | 0;
  for (let i = 0; i < 7; i++) a.cls[i] += frac[i][c]; if (frac[1][c] > 0) { a.lumG += lumG[c] * frac[1][c]; a.nG += frac[1][c]; }
  if (riverAt[c] >= 0) a.river.add(F.rivers[riverAt[c]].name);
  for (const j of nb4(c)) { if (j < 0) continue; if (water[j]) { if (water[j] === 1) a.coast = true; else a.lake = true; if (waterName[j] >= 0) a.waters.add(W[waterName[j]].name); } else if (prov[j] >= 0 && prov[j] !== id) a.adj.add(prov[j]); }
}
// The ground word of each province (the engine's words: plains, forest, steppe, hills, desert, mountains, tundra, marsh)
// is read from its settled core, the cells of it within 50 km of the seat; "cover" lists the ground of the whole province.
const provGround = seats.map(() => new Float32Array(GROUND.length)), coreGround = seats.map(() => new Float32Array(GROUND.length)), coreH = new Float32Array(seats.length), coreN = new Float32Array(seats.length);
for (let c = 0; c < N; c++) { const id = prov[c]; if (id < 0) continue; provGround[id][ground[c]]++;
  if (Math.hypot(c % GW - P[id].cx, ((c / GW) | 0) - P[id].cy) <= 5) { coreGround[id][ground[c]]++; coreH[id] += height[c]; coreN[id]++; } }
for (const a of P) {
  const n = Math.max(1, a.cells), g = Array.from(provGround[a.id], v => v / n), m = Math.max(1, coreN[a.id]), k = Array.from(coreGround[a.id], v => v / m), h = coreN[a.id] ? coreH[a.id] / m : a.h / n;
  a.hMean = a.h / n; a.lat = latOf(a.sy / n); a.groundShare = g;
  const wood = k[5] + k[6] + k[7];
  a.ground = k[2] + k[4] >= 0.45 ? 'mountains' : k[11] >= 0.4 ? 'desert' : k[10] >= 0.4 ? 'steppe' : h >= 0.3 || k[12] + k[4] + k[2] >= 0.4 ? 'hills' : k[13] >= 0.25 ? 'marsh' : wood >= 0.4 ? 'forest' : k[3] >= 0.4 ? 'tundra' : 'plains';
  a.cover = GROUND.map((w, i) => [w, g[i]]).filter(x => x[1] >= 0.15).sort((x, y) => y[1] - x[1]).map(x => x[0]);
}
const realms = {};
for (const a of P) { const r = a.realm === 'unclaimed' ? 'wild:' + a.id : a.realm; (realms[r] = realms[r] || { id: r, name: a.realm === 'unclaimed' ? a.name : LORE.realms[a.realm].short, wild: a.realm === 'unclaimed', provs: [] }).provs.push(a); }
const realmOfProv = id => (P[id].realm === 'unclaimed' ? 'wild:' + id : P[id].realm);
// each realm's capital province: the one of type "capital city", else its most populous (the engine's own rule)
const capitalProv = {};
for (const R of Object.values(realms)) { if (R.wild) continue; const cap = R.provs.find(a => a.type === 'capital city') || R.provs.slice().sort((x, y) => LP[y.id].pop - LP[x.id].pop)[0]; R.capital = cap; capitalProv[cap.id] = LORE.realms[R.id].capital; }
const problems = [], notes = [];
for (const R of Object.values(realms)) {
  R.cells = R.provs.reduce((s, a) => s + a.cells, 0); R.coastal = R.provs.filter(a => a.coast).length;
  R.waters = new Set(); R.nb = new Set(); for (const a of R.provs) { for (const w of a.waters) R.waters.add(w); for (const j of a.adj) if (realmOfProv(j) !== R.id) R.nb.add(realmOfProv(j)); }
  // pieces: by land component of the realm's own cells; two pieces on one landmass are an exclave
  const mask = new Uint8Array(N); for (let c = 0; c < N; c++) if (prov[c] >= 0 && realmOfProv(prov[c]) === R.id) mask[c] = 1;
  const pcs = components(mask, GW, GH, 1).list.sort((x, y) => y.n - x.n); R.pieces = pcs.length;
  const massOf = c => landC.comp[c.cells[0]], seen = new Map();
  for (const c of pcs) { const m = massOf(c); if (seen.has(m)) { if (c.n >= 3) problems.push(`${R.name}: a piece of ${c.n} cells at cell ${Math.round(c.sx / c.n)},${Math.round(c.sy / c.n)} is cut off from the rest on the same land`); } else seen.set(m, c); }
  R.islands = seen.size - 1;
  // enclosed: no sea coast and every land neighbour one other realm
  if (!R.wild && R.coastal === 0 && R.nb.size === 1) problems.push(`${R.name} is enclosed by ${realms[[...R.nb][0]].name}`);
  if (!R.wild && R.nb.size === 1 && R.coastal > 0) notes.push(`${R.name} has one land neighbour (${realms[[...R.nb][0]].name}) and the sea`);
  if (!R.wild && R.nb.size === 0 && !R.islands && R.provs.every(a => landC.comp[seatCell[a.id]] === mainland.id)) problems.push(`${R.name} has no neighbour at all`);
}
// every border between two realms (or a realm and a wild): its length, and what it follows
const borders = new Map();
{ const near = (arr, c, r) => { const x = c % GW, y = (c / GW) | 0; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= GW || yy >= GH) continue; const v = arr[yy * GW + xx]; if (v >= 0) return v; } return -1; };
  for (let c = 0; c < N; c++) { if (prov[c] < 0) continue; const ra = realmOfProv(prov[c]);
    for (const j of [c % GW < GW - 1 ? c + 1 : -1, c + GW < N ? c + GW : -1]) { if (j < 0 || prov[j] < 0) continue; const rb = realmOfProv(prov[j]); if (ra === rb) continue;
      const key = ra < rb ? ra + '|' + rb : rb + '|' + ra; let b2 = borders.get(key); if (!b2) borders.set(key, b2 = { a: ra < rb ? ra : rb, b: ra < rb ? rb : ra, n: 0, river: {}, line: {}, ridge: 0, open: 0, sx: 0, sy: 0 });
      b2.n++; b2.sx += c % GW; b2.sy += (c / GW) | 0;
      const rv = Math.max(near(riverAt, c, 1), near(riverAt, j, 1)), ln = Math.max(near(lineAt, c, 1), near(lineAt, j, 1));
      if (rv >= 0) { const nm = F.rivers[rv].name.replace(/ \(.*\)$/, ''); b2.river[nm] = (b2.river[nm] || 0) + 1; }
      else if (ln >= 0) b2.line[F.borderLines[ln].name] = (b2.line[F.borderLines[ln].name] || 0) + 1;
      else if (Math.max(height[c], height[j]) >= 0.3) b2.ridge++;
      else b2.open++; } } }
for (const a of P) { if (a.cells < 12 && landC.comp[seatCell[a.id]] === mainland.id) notes.push(`${a.name} (${realmName(a.realm)}) is very small: ${a.cells} cells`); if (!a.cells) problems.push(`${a.name} has no land`); }
for (const m of seatFar) problems.push(m);
for (const l of unnamedLakes) problems.push(`an enclosed water of ${l.n} cells at picture ${l.at} has no name`);
for (const m of isleNotes) notes.push(m);
for (const f of F.ferries || []) if (!P[f.a] || !P[f.b]) problems.push(`ferry ${f.name}: no such province`);
for (const w of W) if (!w.found) problems.push(`water "${w.name}" has no cell near its label (${w.away != null ? w.away * CELL + ' km away' : 'none'})`);
if (landC.list.length > 1) notes.push(`${landC.list.length - 1} islands beside the continent (${landC.list.filter(c => c !== mainland).reduce((s, c) => s + c.n, 0)} cells)`);

// ---------------------------------------------------------------- 5. the files
const out = (name, text) => fs.writeFileSync(path.join(DIR, name), text);
const r1 = v => Math.round(v * 10) / 10;
const km = pt => [Math.round(OX + S * pt[0]), Math.round(OY + S * pt[1])];
const seaLinks = {}; for (const f of F.ferries || []) { (seaLinks[f.a] = seaLinks[f.a] || []).push(f.b); (seaLinks[f.b] = seaLinks[f.b] || []).push(f.a); }
const build = {
  about: 'Built by tools/m1/design-sketch.mjs from the owner\'s picture, design/seats.tsv and design/features.json. Cells are 10 km squares of the 700 x 450 grid; km are the game\'s frame.',
  frame: F.frame, transform: F.transform, latitude: F.latitude,
  land: { cells: landCells, share: r1(100 * landCells / N), mainland: mainland.n, islands: landC.list.length - 1, edits: edited },
  waters: W.map((w, i) => ({ name: w.name, kind: w.kind, enclosed: lakeKinds.has(w.kind), countsAsCoast: !lakeKinds.has(w.kind) || !!w.coast, km: km(w.at), cells: waterCells[i], km2: waterCells[i] * 100, note: w.note || undefined })),
  realms: Object.values(realms).filter(R => !R.wild).sort((x, y) => (x.id < y.id ? -1 : 1)).map(R => ({ id: R.id, name: R.name, provinces: R.provs.length, cells: R.cells, km2: R.cells * 100, coastal: R.coastal,
    capital: { name: LORE.realms[R.id].capital, province: R.capital.id, provinceName: R.capital.name }, waters: [...R.waters].sort(), neighbours: [...R.nb].map(n => realms[n].name).sort(), islands: R.islands })),
  wilds: Object.values(realms).filter(R => R.wild).map(R => ({ id: R.provs[0].id, name: R.name, cells: R.cells, km2: R.cells * 100, neighbours: [...R.nb].map(n => realms[n].name).sort() })),
  provinces: P.map(a => ({ id: a.id, name: a.name, realm: a.realm, type: a.type, seat: { px: a.px, py: a.py, xKm: a.cx * CELL + 5, yKm: a.cy * CELL + 5 }, cells: a.cells, coast: a.coast, lake: a.lake,
    waters: [...a.waters].sort(), rivers: [...a.river].sort(), ground: a.ground, cover: a.cover, height: Math.round(a.hMean * 100) / 100, adj: [...a.adj].sort((x, y) => x - y), sea: seaLinks[a.id] || [], site: a.site })),
  rivers: F.rivers.map(r => ({ name: r.name, from: r.from, to: r.to, big: !!r.big, ships: !!r.channel, boats: r.boats || undefined, border: !!r.border, km: r.line.map(km) })),
  ranges: F.ranges.map(r => ({ name: r.name, note: r.note || undefined, km: r.line.map(km) })),
  peaks: F.peaks.map(r => ({ name: r.name, note: r.note || undefined, km: km(r.at) })),
  passes: F.passes.map(r => ({ name: r.name, note: r.note || undefined, km: km(r.at) })),
  regions: F.regions.map(r => ({ name: r.name.replace(/^THE /, 'the ').replace(/\b([A-Z])([A-Z]+)/g, (m, a, b) => a + b.toLowerCase()), km: km(r.at) })),
  roads: F.roads.map(r => ({ name: r.name, note: r.note, byWater: !!r.water, km: r.line.map(km) })),
  seaLanes: F.sealanes.map(r => ({ name: r.name, note: r.note, km: r.line.map(km) })),
  isles: (F.isles || []).map(i => ({ name: i.name, province: i.province, km: km(i.at), note: i.note || undefined })),
  ferries: (F.ferries || []).map(f => ({ name: f.name, a: f.a, b: f.b, note: f.note || undefined })),
  borders: [...borders.values()].map(b2 => ({ a: realms[b2.a].name, b: realms[b2.b].name, km: b2.n * 10, at: cell2px(b2.sx / b2.n, b2.sy / b2.n).map(Math.round), river: b2.river, line: b2.line, highGround: b2.ridge, open: b2.open })),
  ground: { words: GROUND, note: 'design/ground.png holds one of these for every cell; design/relief.png the height guide' },
  checks: { problems, notes, snapped },
};
out('design/build.json', JSON.stringify(build, null, 1) + '\n');
{ // the tables the design page quotes
  const L = [];
  L.push('<!-- built by tools/m1/design-sketch.mjs; do not edit by hand -->', '', `Land: ${landCells.toLocaleString('en')} cells (${(landCells * 100).toLocaleString('en')} km2, ${r1(100 * landCells / N)}% of the frame); the continent ${mainland.n.toLocaleString('en')} cells, ${landC.list.length - 1} islands.`, '',
    '## Realms', '', '| Realm | Provinces | Area (km2) | Share of land | Coastal provinces | Waters | Land neighbours |', '| --- | ---: | ---: | ---: | ---: | --- | --- |');
  for (const R of build.realms) L.push(`| ${R.name} | ${R.provinces} | ${R.km2.toLocaleString('en')} | ${r1(100 * R.cells / landCells)}% | ${R.coastal} | ${R.waters.join(', ') || 'none'} | ${R.neighbours.join(', ') || 'none (islands)'} |`);
  L.push('', '## Wilds', '', '| Wild | Area (km2) | Neighbours |', '| --- | ---: | --- |');
  for (const R of build.wilds) L.push(`| ${R.name} | ${R.km2.toLocaleString('en')} | ${R.neighbours.join(', ') || 'none'} |`);
  L.push('', '## Waters', '', '| Water | Kind | Area (km2) |', '| --- | --- | ---: |');
  for (const w of build.waters) L.push(`| ${w.name} | ${w.kind} | ${w.km2.toLocaleString('en')} |`);
  L.push('', '## Provinces', '', '| Id | Province | Realm | Kind | Seat (km) | Area (km2) | Ground | On water | Seat |', '| ---: | --- | --- | --- | --- | ---: | --- | --- | --- |');
  for (const a of build.provinces) L.push(`| ${a.id} | ${a.name} | ${realmName(a.realm)} | ${a.type} | ${a.seat.xKm}, ${a.seat.yKm} | ${(a.cells * 100).toLocaleString('en')} | ${a.ground} | ${[...a.waters, ...a.rivers].join(', ') || ''} | ${a.site} |`);
  L.push('', '## Borders', '', 'Length is the count of cell sides between the two, at 10 km a side (a ragged line reads long). "Along" says what the border cells lie on: a named river, a line the design draws, high ground (the height guide at 0.3 or more), or open country.', '', '| Between | Length (km) | Along |', '| --- | ---: | --- |');
  for (const b2 of [...borders.values()].sort((x, y) => (realms[x.a].name + realms[x.b].name < realms[y.a].name + realms[y.b].name ? -1 : 1))) {
    const parts = [...Object.entries(b2.river), ...Object.entries(b2.line), ['high ground', b2.ridge], ['open country', b2.open]].filter(e => e[1] / b2.n >= 0.08).sort((x, y) => y[1] - x[1]).map(e => `${e[0]} ${Math.round(100 * e[1] / b2.n)}%`);
    L.push(`| ${realms[b2.a].name} and ${realms[b2.b].name} | ${(b2.n * 10).toLocaleString('en')} | ${parts.join(', ')} |`); }
  L.push('', '## Checks', '', problems.length ? problems.map(p => '- PROBLEM: ' + p).join('\n') : '- No realm is enclosed by another, every realm is one piece on its land, every seat is on land.', notes.map(n => '- ' + n).join('\n'), snapped.map(n => '- ' + n).join('\n'));
  out('design/tables.md', L.join('\n') + '\n');
}

// ---------------------------------------------------------------- 6. the drawings
const realmList = Object.values(realms).filter(R => !R.wild).sort((x, y) => (x.id < y.id ? -1 : 1));
const realmIdx = new Int16Array(seats.length); P.forEach(a => { realmIdx[a.id] = a.realm === 'unclaimed' ? -1 : realmList.findIndex(R => R.id === a.realm); });
const b64 = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
// realm colours: twelve soft hues, shared out so that no two neighbours (by land, or across a narrow water) are alike
const HUES = [[226, 150, 140], [240, 190, 128], [236, 222, 130], [176, 212, 128], [132, 204, 156], [124, 200, 196], [136, 184, 228], [164, 160, 228], [204, 156, 220], [232, 160, 200], [200, 172, 132], [164, 178, 190]];
const realmColour = (() => {
  const idxOf = new Map(realmList.map((R, i) => [R.id, i])), near = realmList.map(() => new Set());
  for (const R of realmList) for (const n of R.nb) if (idxOf.has(n)) { near[idxOf.get(R.id)].add(idxOf.get(n)); near[idxOf.get(n)].add(idxOf.get(R.id)); }
  // realms that face each other over water within 60 km count as neighbours for the colours
  for (let c = 0; c < N; c++) { if (water[c] || prov[c] < 0) continue; const a = realmIdx[prov[c]]; if (a < 0) continue; const x = c % GW, y = (c / GW) | 0;
    for (const [dx, dy] of [[6, 0], [0, 6], [4, 4], [4, -4]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= GW || yy >= GH) continue; const k = yy * GW + xx; if (water[k] || prov[k] < 0) continue; const b2 = realmIdx[prov[k]]; if (b2 >= 0 && b2 !== a) { near[a].add(b2); near[b2].add(a); } } }
  const col = new Int8Array(realmList.length).fill(-1), order = realmList.map((_, i) => i).sort((a, b) => near[b].size - near[a].size || realmList[b].cells - realmList[a].cells), used = HUES.map(() => 0);
  const hueDist = (a, b) => { const d = Math.abs(a - b) % HUES.length; return Math.min(d, HUES.length - d); };
  for (const i of order) { let best = 0, bs = -1e9;
    for (let h = 0; h < HUES.length; h++) { let s = -used[h] * 0.6; for (const j of near[i]) if (col[j] >= 0) { const d = hueDist(h, col[j]); s += d === 0 ? -100 : d === 1 ? -3 : 0; } for (const j of near[i]) for (const k of near[j]) if (k !== i && col[k] === h) s -= 0.4; if (s > bs) { bs = s; best = h; } }
    col[i] = best; used[best]++; }
  return realmList.map((_, i) => HUES[col[i]]);
})();
// the sea's distance from land (for the shelf's paler water) and the land's from the sea
const seaDist = new Uint8Array(N); { // a chamfer distance (5 a side step, 7 a corner step), in tenths of a cell
  const d = new Int32Array(N); for (let c = 0; c < N; c++) d[c] = water[c] !== 1 ? 0 : 1e6;
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const c = y * GW + x; let v = d[c]; if (x > 0) v = Math.min(v, d[c - 1] + 5); if (y > 0) { v = Math.min(v, d[c - GW] + 5); if (x > 0) v = Math.min(v, d[c - GW - 1] + 7); if (x < GW - 1) v = Math.min(v, d[c - GW + 1] + 7); } d[c] = v; }
  for (let y = GH - 1; y >= 0; y--) for (let x = GW - 1; x >= 0; x--) { const c = y * GW + x; let v = d[c]; if (x < GW - 1) v = Math.min(v, d[c + 1] + 5); if (y < GH - 1) { v = Math.min(v, d[c + GW] + 5); if (x < GW - 1) v = Math.min(v, d[c + GW + 1] + 7); if (x > 0) v = Math.min(v, d[c + GW - 1] + 7); } d[c] = v; }
  for (let c = 0; c < N; c++) seaDist[c] = Math.min(255, Math.round(d[c] / 5 * 6)); }
const drawData = {
  GW, GH, K, PW, PH, S, OX, OY, CELL, lat: F.latitude,
  water: b64(water), prov: b64(prov), height: b64(Uint8Array.from(height, v => Math.max(0, Math.min(255, Math.round(v * 255))))), ground: b64(ground), seaDist: b64(seaDist), keep: b64(keep), added: b64(addedLand), edits: { carveSea: F.edits.carveSea, openWater: F.edits.openWater || [] },
  realmIdx: b64(realmIdx), realms: realmList.map((R, i) => ({ name: R.name, id: R.id, cells: R.cells, colour: realmColour[i] })),
  provs: P.map(a => ({ id: a.id, name: a.name, type: a.type, realm: a.realm, cx: a.cx, cy: a.cy, mx: a.cells ? a.sx / a.cells : a.cx, my: a.cells ? a.sy / a.cells : a.cy, cells: a.cells })),
  F: { waters: W.map(w => ({ name: w.name, kind: w.kind, at: w.at, size: w.size })), rivers: F.rivers, ranges: F.ranges, peaks: F.peaks, passes: F.passes, regions: F.regions, roads: F.roads, sealanes: F.sealanes, labels: F.labels || {} },
  capitalNames: Object.fromEntries(realmList.map(R => [R.id, LORE.realms[R.id].capital])),
};
await pg.setViewportSize({ width: GW * K + 40, height: GH * K + 40 });
for (const mode of ['sketch', 'picture']) {
  await pg.evaluate(({ D, mode }) => {
    const { GW, GH, K, PW, PH, S, OX, OY, CELL } = D, N = GW * GH, WPX = GW * K, HPX = GH * K, dark = mode === 'picture';
    const u8 = s => Uint8Array.from(atob(s), ch => ch.charCodeAt(0));
    const water = u8(D.water), ground = u8(D.ground), hgt = u8(D.height), seaDist = u8(D.seaDist);
    const prov = new Int16Array(u8(D.prov).buffer), realmIdx = new Int16Array(u8(D.realmIdx).buffer);
    const c = document.getElementById('c'); c.width = WPX; c.height = HPX; const g = c.getContext('2d');
    const kmX = px => (OX + S * px) / CELL * K, kmY = py => (OY + S * py) / CELL * K;     // picture pixel -> canvas
    // bilinear reading of a cell grid at a canvas point
    const sample = (a, fx, fy) => { const x0 = Math.max(0, Math.min(GW - 1, Math.floor(fx - 0.5))), y0 = Math.max(0, Math.min(GH - 1, Math.floor(fy - 0.5))), x1 = Math.min(GW - 1, x0 + 1), y1 = Math.min(GH - 1, y0 + 1), tx = Math.max(0, Math.min(1, fx - 0.5 - x0)), ty = Math.max(0, Math.min(1, fy - 0.5 - y0));
      return (a[y0 * GW + x0] * (1 - tx) + a[y0 * GW + x1] * tx) * (1 - ty) + (a[y1 * GW + x0] * (1 - tx) + a[y1 * GW + x1] * tx) * ty; };
    const landF = Float32Array.from(water, v => (v === 0 ? 1 : 0));
    // The coast is the picture's own, finer than the grid: a point is land where the picture has land and the grid has land
    // there or beside it; the picture's water inside solid grid land is land (river water and ponds the design fills);
    // the design's cuts and the island it adds are drawn from features.json and the grid.
    const keep = u8(D.keep), added = u8(D.added);
    const fine = (want, x, y) => { const px = ((x + 0.5) / K * CELL - OX) / S - 0.5, py = ((y + 0.5) / K * CELL - OY) / S - 0.5, x0 = Math.floor(px), y0 = Math.floor(py), tx = px - x0, ty = py - y0;
      const at = (xx, yy) => (xx < 0 || yy < 0 || xx >= PW || yy >= PH ? 0 : want(keep[yy * PW + xx]) ? 1 : 0);
      return (at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx) * (1 - ty) + (at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx) * ty; };
    const UW = WPX, UH = HPX; let rid = new Int16Array(UW * UH), pid = new Int16Array(UW * UH);
    const isLand = new Uint8Array(UW * UH), isLake = new Uint8Array(UW * UH);
    const near = new Uint8Array(N);   // bit 1 land, 2 sea, 4 lake, 8 added land, in the cell or the eight round it
    for (let cy = 0; cy < GH; cy++) for (let cx = 0; cx < GW; cx++) { let m = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = cx + dx, yy = cy + dy; if (xx < 0 || yy < 0 || xx >= GW || yy >= GH) { m |= 2; continue; } const j = yy * GW + xx; m |= water[j] === 0 ? 1 : water[j] === 1 ? 2 : 4; if (added[j]) m |= 8; } near[cy * GW + cx] = m; }
    for (let y = 0; y < UH; y++) for (let x = 0; x < UW; x++) { const k = y * UW + x, cc = ((y / K) | 0) * GW + ((x / K) | 0), m = near[cc], w = water[cc];
      let land, lake = 0;
      if (m & 8) land = sample(landF, (x + 0.5) / K, (y + 0.5) / K) >= 0.5;
      else if (fine(v => v === 1 || v === 2, x, y) >= 0.5) land = (m & 1) !== 0;
      else land = w === 0 && !(m & 6);
      if (!land && (m & 4)) lake = w === 2 || fine(v => v === 3, x, y) >= 0.5 ? 1 : 0;
      if (!land && !lake && w === 2) lake = 1;
      isLand[k] = land ? 1 : 0; isLake[k] = lake; }
    { // the design's cuts, drawn on the fine coast
      const mc = document.createElement('canvas'); mc.width = WPX; mc.height = HPX; const mg = mc.getContext('2d'); mg.lineJoin = 'round'; mg.lineCap = 'round';
      const stroke = (list, col) => { for (const e of list) { mg.beginPath(); e.line.forEach(([px, py], i) => (i ? mg.lineTo(kmX(px), kmY(py)) : mg.moveTo(kmX(px), kmY(py)))); mg.strokeStyle = col; mg.lineWidth = Math.max(K * 1.1, e.width * K * 0.8); mg.stroke(); } };
      stroke(D.edits.carveSea, '#f00'); stroke(D.edits.openWater, '#00f');
      const md = mg.getImageData(0, 0, WPX, HPX).data;
      for (let k = 0; k < WPX * HPX; k++) { if (md[k * 4 + 3] < 128) continue; if (md[k * 4] > 128) { if (water[((((k / WPX) | 0) / K) | 0) * GW + (((k % WPX) / K) | 0)] !== 0) { isLand[k] = 0; isLake[k] = 0; } } else if (md[k * 4 + 2] > 128 && isLand[k]) { isLand[k] = 0; isLake[k] = 1; } } }
    // each land point takes the province of the nearest land cell (its own, or a neighbour's on the smoothed coast)
    for (let y = 0; y < UH; y++) for (let x = 0; x < UW; x++) { const k = y * UW + x; if (!isLand[k]) { rid[k] = pid[k] = -1; continue; }
      let cx = (x / K) | 0, cy = (y / K) | 0, p = water[cy * GW + cx] ? -1 : prov[cy * GW + cx];
      if (p < 0) { let bd = 1e9; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = cx + dx, yy = cy + dy; if (xx < 0 || yy < 0 || xx >= GW || yy >= GH) continue; const j = yy * GW + xx; if (water[j] || prov[j] < 0) continue; const d = Math.hypot((xx + 0.5) * K - x, (yy + 0.5) * K - y); if (d < bd) { bd = d; p = prov[j]; } } }
      pid[k] = p; rid[k] = p < 0 ? -1 : realmIdx[p] >= 0 ? realmIdx[p] : 1000 + p; }
    const vote = (a, r) => { const o = new Int16Array(a.length); for (let y = 0; y < UH; y++) for (let x = 0; x < UW; x++) { const k = y * UW + x; if (a[k] < 0) { o[k] = -1; continue; } let best = a[k], bn = 0; const cnt = new Map();
          for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= UW || yy >= UH) continue; const v = a[yy * UW + xx]; if (v < 0) continue; const n = (cnt.get(v) || 0) + 1; cnt.set(v, n); if (n > bn || (n === bn && v === a[k])) { bn = n; best = v; } } o[k] = best; } return o; };
    rid = vote(vote(rid, 3), 3); pid = vote(pid, 2);

    // ---- the ground
    const GROUND = [[0, 0, 0], [0, 0, 0], [244, 246, 248], [214, 218, 204], [186, 174, 158], [156, 184, 150], [168, 200, 150], [140, 194, 134], [208, 224, 170], [222, 214, 160], [232, 226, 168], [240, 218, 160], [192, 164, 152], [170, 206, 190]];
    const im = g.createImageData(WPX, HPX), d = im.data;
    const gR = Float32Array.from(ground, v => GROUND[v][0]), gG = Float32Array.from(ground, v => GROUND[v][1]), gB = Float32Array.from(ground, v => GROUND[v][2]);
    if (dark) { g.fillStyle = '#0d1f3f'; g.fillRect(0, 0, WPX, HPX); g.imageSmoothingQuality = 'high'; g.drawImage(window.PICTURE, kmX(0), kmY(0), kmX(PW) - kmX(0), kmY(PH) - kmY(0)); g.fillStyle = 'rgba(10,20,40,0.15)'; g.fillRect(0, 0, WPX, HPX); }
    else {
      for (let y = 0; y < HPX; y++) for (let x = 0; x < WPX; x++) { const fx = (x + 0.5) / K, fy = (y + 0.5) / K, k = y * WPX + x, o = k * 4; let r, gg, b;
        if (isLand[k]) {
          let cx = Math.min(GW - 1, fx | 0), cy = Math.min(GH - 1, fy | 0), gr = ground[cy * GW + cx];
          if (gr < 2) { let bd = 1e9; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = cx + dx, yy = cy + dy; if (xx < 0 || yy < 0 || xx >= GW || yy >= GH) continue; const v = ground[yy * GW + xx]; if (v < 2) continue; const dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; gr = v; } } if (gr < 2) gr = 8; }
          let p = GROUND[gr]; if (water[cy * GW + cx] === 0 && (near[cy * GW + cx] & 6) === 0) p = [sample(gR, fx, fy), sample(gG, fx, fy), sample(gB, fx, fy)];
          const hh = sample(hgt, fx, fy) / 255, sl = (sample(hgt, fx - 0.9, fy - 0.9) - sample(hgt, fx + 0.9, fy + 0.9)) / 255, sh = 1 + Math.max(-0.2, Math.min(0.16, sl * 2.4)) - hh * 0.06;
          r = p[0] * sh; gg = p[1] * sh; b = p[2] * sh;
          const ri = rid[k]; if (ri >= 0 && ri < 1000) { const rc = D.realms[ri].colour, t = 0.5; r = r * (1 - t) + rc[0] * t * sh; gg = gg * (1 - t) + rc[1] * t * sh; b = b * (1 - t) + rc[2] * t * sh; }
          else { r = r * 0.82 + 150 * 0.18; gg = gg * 0.82 + 150 * 0.18; b = b * 0.82 + 150 * 0.18; }     // the wilds: the bare ground, greyed
        } else if (isLake[k]) { r = 150; gg = 198; b = 226; }
        else { const t = Math.min(1, sample(seaDist, fx, fy) / 110), u = t * t * (3 - 2 * t); r = 200 - 48 * u; gg = 224 - 36 * u; b = 239 - 23 * u; }
        d[o] = Math.min(255, r); d[o + 1] = Math.min(255, gg); d[o + 2] = Math.min(255, b); d[o + 3] = 255; }
      g.putImageData(im, 0, 0);
      // the owner's own relief, grey, laid softly on the land so that his ranges show through
      const t = document.createElement('canvas'); t.width = WPX; t.height = HPX; const tg = t.getContext('2d');
      tg.filter = 'grayscale(1) contrast(1.35) brightness(1.25)'; tg.imageSmoothingQuality = 'high'; tg.drawImage(window.PICTURE, kmX(0), kmY(0), kmX(PW) - kmX(0), kmY(PH) - kmY(0)); tg.filter = 'none';
      const ti = tg.getImageData(0, 0, WPX, HPX), td = ti.data; for (let k = 0; k < WPX * HPX; k++) td[k * 4 + 3] = isLand[k] ? 255 : 0; tg.putImageData(ti, 0, 0);
      g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 0.55; g.drawImage(t, 0, 0); g.restore();
    }
    // ---- borders: coast, realms, provinces
    const ov = g.createImageData(WPX, HPX), od = ov.data;
    for (let y = 1; y < HPX - 1; y++) for (let x = 1; x < WPX - 1; x++) { const k = y * WPX + x, o = k * 4, r = rid[k];
      if (!isLand[k]) { if (isLand[k - 1] || isLand[k + 1] || isLand[k - WPX] || isLand[k + WPX]) { od[o] = dark ? 255 : 60; od[o + 1] = dark ? 255 : 80; od[o + 2] = dark ? 255 : 110; od[o + 3] = dark ? 90 : 200; } continue; }
      const e1 = rid[k - 1] !== r && rid[k - 1] >= 0, e2 = rid[k + 1] !== r && rid[k + 1] >= 0, e3 = rid[k - WPX] !== r && rid[k - WPX] >= 0, e4 = rid[k + WPX] !== r && rid[k + WPX] >= 0;
      const near = e1 || e2 || e3 || e4 || (rid[k - 2] !== r && rid[k - 2] >= 0) || (rid[k - 2 * WPX] !== r && rid[k - 2 * WPX] >= 0);
      if (near) { const wild = r >= 1000 && [rid[k - 1], rid[k + 1], rid[k - WPX], rid[k + WPX], rid[k - 2], rid[k - 2 * WPX]].every(v => v < 0 || v >= 1000);
        if (dark) { od[o] = 255; od[o + 1] = 244; od[o + 2] = 190; od[o + 3] = wild ? 120 : 255; } else { od[o] = 70; od[o + 1] = 30; od[o + 2] = 30; od[o + 3] = wild ? 90 : 235; } continue; }
      if ((pid[k - 1] !== pid[k] && pid[k - 1] >= 0) || (pid[k - WPX] !== pid[k] && pid[k - WPX] >= 0)) { od[o] = dark ? 255 : 70; od[o + 1] = dark ? 255 : 50; od[o + 2] = dark ? 255 : 40; od[o + 3] = dark ? 70 : 70; }
      else if (dark && r >= 0 && r < 1000) { const rc = D.realms[r].colour; od[o] = rc[0]; od[o + 1] = rc[1]; od[o + 2] = rc[2]; od[o + 3] = 96; } }
    const oc = document.createElement('canvas'); oc.width = WPX; oc.height = HPX; oc.getContext('2d').putImageData(ov, 0, 0); g.drawImage(oc, 0, 0);

    // ---- rivers, roads, sea lanes
    const path = line => { g.beginPath(); line.forEach(([x, y], i) => (i ? g.lineTo(kmX(x), kmY(y)) : g.moveTo(kmX(x), kmY(y)))); };
    const smooth = line => { let p = line; for (let it = 0; it < 2; it++) { const q = [p[0]]; for (let i = 0; i + 1 < p.length; i++) { const [ax, ay] = p[i], [bx, by] = p[i + 1]; q.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]); } q.push(p[p.length - 1]); p = q; } return p; };
    g.lineJoin = 'round'; g.lineCap = 'round';
    for (const s of D.F.sealanes) { g.setLineDash([K * 0.5, K * 1.7]); path(smooth(s.line)); g.strokeStyle = dark ? 'rgba(200,230,255,0.75)' : 'rgba(40,80,140,0.6)'; g.lineWidth = K * 0.5; g.stroke(); } g.setLineDash([]);
    for (const r of D.F.rivers) { const w = K * (r.channel ? 1.5 : r.big ? 1.0 : 0.6); path(smooth(r.line)); g.strokeStyle = dark ? 'rgba(20,40,80,0.8)' : 'rgba(255,255,255,0.55)'; g.lineWidth = w + K * 0.5; g.stroke(); path(smooth(r.line)); g.strokeStyle = dark ? '#7fd0ff' : '#3a82c4'; g.lineWidth = w; g.stroke(); }
    for (const r of D.F.roads) { if (r.water) continue; g.setLineDash([K * 1.6, K * 1.0]); path(smooth(r.line)); g.strokeStyle = dark ? 'rgba(255,236,170,0.9)' : 'rgba(120,60,20,0.85)'; g.lineWidth = K * 0.42; g.stroke(); } g.setLineDash([]);

    // ---- words
    const text = (s, x, y, o) => { g.font = `${o.italic ? 'italic ' : ''}${o.bold ? 'bold ' : ''}${o.size}px ${o.face || 'Georgia, "DejaVu Serif", serif'}`; g.textAlign = o.align || 'center'; g.textBaseline = 'middle';
      try { g.letterSpacing = (o.space || 0) + 'px'; } catch (e) {}
      if (o.rot) { g.save(); g.translate(x, y); g.rotate(o.rot); x = 0; y = 0; }
      g.lineJoin = 'round'; g.lineWidth = o.halo == null ? 3 : o.halo; g.strokeStyle = o.haloCol || (dark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.85)'); if (g.lineWidth) g.strokeText(s, x, y); g.fillStyle = o.col || '#222'; g.fillText(s, x, y);
      if (o.rot) g.restore(); };
    const lab = D.F.labels;
    for (const r of D.F.regions) if (r.size === 3) text(r.name, kmX(r.at[0]), kmY(r.at[1]), { size: K * 5.2, col: dark ? 'rgba(255,255,255,0.42)' : 'rgba(70,45,20,0.24)', halo: 0, space: K * 3.2 });
    for (const w of D.F.waters) { const big = w.kind === 'ocean', lake = ['lake', 'lagoon', 'salt lake', 'inland sea'].includes(w.kind), o = (lab.water || {})[w.name] || [0, 0];
      text(big ? w.name.toUpperCase() : w.name, kmX(w.at[0] + o[0]), kmY(w.at[1] + o[1]), { size: big ? K * 4.2 : w.kind === 'inland sea' ? K * 2.9 : lake ? K * 2.3 : K * 2.7, italic: true, col: dark ? '#d8ecff' : '#1d4f8a', haloCol: dark ? 'rgba(0,10,40,0.8)' : 'rgba(235,245,255,0.85)', halo: big ? 0 : 3, space: big ? K * 2.2 : 0 }); }
    for (const r of D.F.ranges) { const a = r.line[0], z = r.line[r.line.length - 1], m = r.label || r.line[(r.line.length / 2) | 0]; let rot = Math.atan2(kmY(z[1]) - kmY(a[1]), kmX(z[0]) - kmX(a[0])); if (rot > Math.PI / 2) rot -= Math.PI; if (rot < -Math.PI / 2) rot += Math.PI;
      text(r.name.toUpperCase(), kmX(m[0]), kmY(m[1]), { size: K * 2.3, col: dark ? '#ffe9c4' : '#5a3d1e', haloCol: dark ? 'rgba(20,10,0,0.75)' : 'rgba(255,250,240,0.8)', rot, space: K * 0.9 }); }
    for (const r of D.F.regions) if (r.size < 3) text(r.name, kmX(r.at[0]), kmY(r.at[1]), { size: r.size === 2 ? K * 3.0 : K * 2.4, italic: true, col: dark ? '#f4f0d8' : '#4f4f2c', haloCol: dark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,245,0.75)' });
    { const seen = new Set(); for (const r of D.F.rivers) { const nm = r.name.replace(/ \(.*\)$/, ''); if (seen.has(nm) || r.line.length < 2) continue; seen.add(nm); const L = smooth(r.line), i = Math.max(1, Math.min(L.length - 2, Math.round(L.length * (r.at == null ? 0.5 : r.at)))), a = L[i - 1], z = L[i + 1];
        let rot = Math.atan2(kmY(z[1]) - kmY(a[1]), kmX(z[0]) - kmX(a[0])); if (rot > Math.PI / 2) rot -= Math.PI; if (rot < -Math.PI / 2) rot += Math.PI;
        const x = kmX(L[i][0]) + Math.sin(rot) * K * 1.5, y = kmY(L[i][1]) - Math.cos(rot) * K * 1.5;
        text(nm, x, y, { size: K * (r.big ? 2.1 : 1.8), italic: true, col: dark ? '#bfe6ff' : '#1d4f8a', haloCol: dark ? 'rgba(0,10,40,0.8)' : 'rgba(255,255,255,0.75)', halo: 2.5, rot }); } }
    for (const p of D.F.peaks) { const x = kmX(p.at[0]), y = kmY(p.at[1]); g.beginPath(); g.moveTo(x, y - K * 1.6); g.lineTo(x + K * 1.4, y + K); g.lineTo(x - K * 1.4, y + K); g.closePath(); g.fillStyle = dark ? '#fff' : '#5a3d1e'; g.fill(); g.strokeStyle = dark ? '#000' : '#fff'; g.lineWidth = K * 0.2; g.stroke(); text(p.name, x + K * 2, y, { size: K * 2.1, align: 'left', col: dark ? '#fff' : '#5a3d1e' }); }
    for (const p of D.F.passes) { const x = kmX(p.at[0]), y = kmY(p.at[1]); g.strokeStyle = dark ? '#ffe9a0' : '#5a3d1e'; g.lineWidth = K * 0.4; g.beginPath(); g.moveTo(x - K * 1.1, y - K); g.lineTo(x - K * 0.35, y); g.lineTo(x - K * 1.1, y + K); g.moveTo(x + K * 1.1, y - K); g.lineTo(x + K * 0.35, y); g.lineTo(x + K * 1.1, y + K); g.stroke(); }
    // towns: every seat a dot, cities larger, capitals a red disc
    for (const p of D.provs) { if (p.realm === 'unclaimed') continue; const x = (p.cx + 0.5) * K, y = (p.cy + 0.5) * K, cap = D.capitalProv[p.id], city = p.type === 'city';
      g.beginPath(); g.arc(x, y, cap ? K * 1.3 : city ? K * 0.75 : K * 0.48, 0, 6.3); g.fillStyle = cap ? '#c0101c' : dark ? '#fff' : '#2c2c2c'; g.fill(); g.lineWidth = K * 0.3; g.strokeStyle = dark ? '#000' : '#fff'; g.stroke(); }
    for (const p of D.provs) { const cap = D.capitalProv[p.id]; if (!cap) continue; const o = (lab.capital || {})[cap] || [0, -2.7];
      text(cap, (p.cx + 0.5) * K + o[0] * K, (p.cy + 0.5) * K + o[1] * K, { size: K * 2.5, col: dark ? '#fff' : '#3a0d0d', haloCol: dark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)', align: o[0] > 1.5 ? 'left' : o[0] < -1.5 ? 'right' : 'center' }); }
    // realm names at the middle of their land (or where features.json puts them)
    const mid = D.realms.map(() => [0, 0, 0]); for (const p of D.provs) { const i = D.realms.findIndex(r => r.id === p.realm); if (i >= 0) { mid[i][0] += p.mx * p.cells; mid[i][1] += p.my * p.cells; mid[i][2] += p.cells; } }
    D.realms.forEach((r, i) => { const o = (lab.realm || {})[r.name], x = o ? kmX(o[0]) : (mid[i][0] / mid[i][2] + 0.5) * K, y = o ? kmY(o[1]) : (mid[i][1] / mid[i][2] + 0.5) * K, big = r.cells > 3400, small = r.cells < 1000;
      text(r.name.toUpperCase(), x, y, { size: big ? K * 4.3 : small ? K * 2.8 : K * 3.4, bold: true, col: dark ? '#fff' : '#161616', haloCol: dark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)', halo: 4, space: big ? K * 1.3 : K * 0.4, rot: o && o[2] ? o[2] : 0 }); });
    for (const p of D.provs) { if (p.realm !== 'unclaimed') continue; const o = (lab.wild || {})[p.name]; if (o === false) continue; const x = o ? kmX(o[0]) : (p.mx + 0.5) * K, y = o ? kmY(o[1]) : (p.my + 0.5) * K;
      text(p.name.replace(/^The /, 'the '), x, y, { size: K * 2.3, italic: true, col: dark ? '#eee' : '#555', haloCol: dark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.75)' }); }
    // ---- the frame's furniture: latitude ticks, title, scale, north, key
    const ink = dark ? '#fff' : '#222', pad = K * 5;
    g.strokeStyle = dark ? 'rgba(255,255,255,0.5)' : 'rgba(40,40,40,0.55)'; g.lineWidth = K * 0.3; g.strokeRect(K, K, WPX - 2 * K, HPX - 2 * K);
    for (let la = 15; la <= 60; la += 5) { const y = (D.lat.top - la) / (D.lat.top - D.lat.bottom) * HPX; g.beginPath(); g.moveTo(K, y); g.lineTo(K * (la % 10 ? 2.4 : 3.4), y); g.moveTo(WPX - K, y); g.lineTo(WPX - K * (la % 10 ? 2.4 : 3.4), y); g.stroke(); if (la % 10 === 0) { text(la + '°N', K * 4.2, y, { size: K * 2, align: 'left', col: ink, halo: 2 }); text(la + '°N', WPX - K * 4.2, y, { size: K * 2, align: 'right', col: ink, halo: 2 }); } }
    text(dark ? 'ARDAN: the design laid on the owner\'s picture' : 'ARDAN: the one continent', pad * 1.6, pad + K * 2.5, { size: K * 5, bold: true, align: 'left', col: ink, halo: 4 });
    text(dark ? 'the same borders, rivers and names as design-sketch.png, over docs/design/m1/reference/owner-continent.webp' : 'design sketch for map version 4, from the owner\'s picture (order 73, D-153). 700 x 450 cells of 10 km.', pad * 1.6, pad + K * 7.4, { size: K * 2.3, align: 'left', col: ink });
    const sx = pad * 1.6, sy = HPX - pad * 1.5, per = K / CELL; g.fillStyle = ink; g.fillRect(sx, sy, 2000 * per, K * 0.6);
    if (dark) text('the game\'s scale (10 km cells); the picture\'s own bar above is not used', sx + 2000 * per + K * 2, sy - K * 5.2, { size: K * 2.1, align: 'left', col: ink });
    for (const km of [0, 500, 1000, 1500, 2000]) { g.fillStyle = ink; g.fillRect(sx + km * per - K * 0.15, sy - K, K * 0.3, K * 1.6); text(km ? km.toLocaleString('en') + (km === 2000 ? ' km' : '') : '0', sx + km * per, sy - K * 2.6, { size: K * 2.3, col: ink }); }
    const nx = WPX - pad * 2.4, ny = pad * 3; g.beginPath(); g.moveTo(nx, ny - K * 5); g.lineTo(nx + K * 1.6, ny + K * 2); g.lineTo(nx, ny + K); g.lineTo(nx - K * 1.6, ny + K * 2); g.closePath(); g.fillStyle = ink; g.fill(); text('N', nx, ny - K * 7, { size: K * 3.2, bold: true, col: ink });
    // the key
    const kx = sx + 2000 * per + K * 12, ky = HPX - pad * 2.9, row = K * 3.3; let ix = kx, iy = ky;
    const item = (draw, label) => { draw(ix, iy); text(label, ix + K * 6, iy, { size: K * 2.2, align: 'left', col: ink }); iy += row; if (iy > HPX - pad * 0.9) { iy = ky; ix += K * 42; } };
    item((x, y) => { g.fillStyle = '#c0101c'; g.beginPath(); g.arc(x + K * 2, y, K * 1.3, 0, 6.3); g.fill(); }, 'capital');
    item((x, y) => { g.fillStyle = dark ? '#fff' : '#2c2c2c'; g.beginPath(); g.arc(x + K * 1.2, y, K * 0.75, 0, 6.3); g.fill(); g.beginPath(); g.arc(x + K * 3.4, y, K * 0.48, 0, 6.3); g.fill(); }, 'city, other province seat');
    item((x, y) => { g.strokeStyle = dark ? 'rgb(255,244,190)' : 'rgb(70,30,30)'; g.lineWidth = K * 0.75; g.beginPath(); g.moveTo(x, y); g.lineTo(x + K * 4.4, y); g.stroke(); }, 'realm border (thin: province)');
    item((x, y) => { g.strokeStyle = dark ? '#7fd0ff' : '#3a82c4'; g.lineWidth = K; g.beginPath(); g.moveTo(x, y); g.lineTo(x + K * 4.4, y); g.stroke(); }, 'river (thick: ship water)');
    item((x, y) => { g.setLineDash([K * 1.6, K]); g.strokeStyle = dark ? 'rgba(255,236,170,0.9)' : 'rgba(120,60,20,0.85)'; g.lineWidth = K * 0.42; g.beginPath(); g.moveTo(x, y); g.lineTo(x + K * 4.4, y); g.stroke(); g.setLineDash([]); }, 'great road');
    item((x, y) => { g.setLineDash([K * 0.5, K * 1.7]); g.strokeStyle = dark ? 'rgba(200,230,255,0.75)' : 'rgba(40,80,140,0.6)'; g.lineWidth = K * 0.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + K * 4.4, y); g.stroke(); g.setLineDash([]); }, 'sea lane');
    item((x, y) => { g.strokeStyle = dark ? '#ffe9a0' : '#5a3d1e'; g.lineWidth = K * 0.4; x += K * 2; g.beginPath(); g.moveTo(x - K * 1.1, y - K); g.lineTo(x - K * 0.35, y); g.lineTo(x - K * 1.1, y + K); g.moveTo(x + K * 1.1, y - K); g.lineTo(x + K * 0.35, y); g.lineTo(x + K * 1.1, y + K); g.stroke(); }, 'pass or gate');
    item((x, y) => { g.fillStyle = 'rgb(160,160,150)'; g.fillRect(x, y - K * 1.1, K * 4.4, K * 2.2); }, 'grey ground: the wilds, no realm\'s');
  }, { D: { ...drawData, capitalProv }, mode });
  const file = path.join(DIR, mode === 'sketch' ? 'design-sketch.png' : 'design-on-picture.jpg');
  await (await pg.$('#c')).screenshot(mode === 'sketch' ? { path: file } : { path: file, type: 'jpeg', quality: 86 });
  say('drew ' + path.relative(process.cwd(), file));
}
// --ascii="x,y,w,h" (picture pixels): the grid's water there, one character a cell: # land, ~ sea, o lake, @ a seat
if (opt('ascii', '')) {
  const [x, y, w, h] = opt('ascii', '').split(',').map(Number), [cx0, cy0] = px2cell(x, y), [cx1, cy1] = px2cell(x + w, y + h);
  const seatAt = new Set(seats.map(s => seatCell[s.id]));
  console.log('cells x ' + cx0 + '..' + cx1 + ', y ' + cy0 + '..' + cy1 + '; left column is picture px ' + Math.round(cell2px(cx0, 0)[0]) + ', a cell is ' + r1(CELL / S) + ' px');
  for (let cy = cy0; cy <= cy1; cy++) { let row = '';
    for (let cx = cx0; cx <= cx1; cx++) { const c = cy * GW + cx; row += seatAt.has(c) ? '@' : water[c] === 1 ? '~' : water[c] === 2 ? 'o' : '#'; }
    console.log(row + ' ' + Math.round(cell2px(0, cy)[1])); }
}
// working views (not part of the design): --crops="x,y,w,h,zoom;..." in picture pixels, written to --cropdir, each the
// owner's picture with the province grid, every seat's id and name and a pixel grid over it
if (opt('crops', '')) {
  const cropDir = opt('cropdir', '.'); fs.mkdirSync(cropDir, { recursive: true });
  for (const box of opt('crops', '').split(';')) {
    const [x, y, w, h, z = 3] = box.split(',').map(Number);
    await pg.setViewportSize({ width: Math.ceil(w * z) + 40, height: Math.ceil(h * z) + 40 });
    await pg.evaluate(({ D, x, y, w, h, z, plain }) => {
      const { GW, GH, S, OX, OY, CELL } = D, u8 = s => Uint8Array.from(atob(s), ch => ch.charCodeAt(0));
      const water = u8(D.water), prov = new Int16Array(u8(D.prov).buffer), realmIdx = new Int16Array(u8(D.realmIdx).buffer);
      const c = document.getElementById('c'); c.width = w * z; c.height = h * z; const g = c.getContext('2d');
      g.imageSmoothingQuality = 'high'; g.drawImage(window.PICTURE, x, y, w, h, 0, 0, w * z, h * z);
      const X = px => (px - x) * z, Y = py => (py - y) * z, cellX = cx => X((cx * CELL - OX) / S), cellY = cy => Y((cy * CELL - OY) / S);
      if (!plain) {
        const rOf = c2 => (water[c2] ? -2 - water[c2] : prov[c2] < 0 ? -1 : realmIdx[prov[c2]] >= 0 ? realmIdx[prov[c2]] : 1000 + prov[c2]);
        const cx0 = Math.max(0, Math.floor((OX + S * x) / CELL) - 1), cx1 = Math.min(GW - 1, Math.ceil((OX + S * (x + w)) / CELL) + 1), cy0 = Math.max(0, Math.floor((OY + S * y) / CELL) - 1), cy1 = Math.min(GH - 1, Math.ceil((OY + S * (y + h)) / CELL) + 1);
        for (const pass of [0, 1, 2]) { g.beginPath();
          for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) { const a = cy * GW + cx;
            for (const [dx, dy] of [[1, 0], [0, 1]]) { const xx = cx + dx, yy = cy + dy; if (xx >= GW || yy >= GH) continue; const b = yy * GW + xx;
              const wa = water[a], wb = water[b]; let kind = -1;
              if (wa !== wb) kind = 2; else if (!wa && prov[a] !== prov[b]) kind = rOf(a) !== rOf(b) ? 1 : 0;
              if (kind !== pass) continue;
              if (dx) { g.moveTo(cellX(cx + 1), cellY(cy)); g.lineTo(cellX(cx + 1), cellY(cy + 1)); } else { g.moveTo(cellX(cx), cellY(cy + 1)); g.lineTo(cellX(cx + 1), cellY(cy + 1)); } } }
          g.strokeStyle = pass === 2 ? 'rgba(0,255,255,0.75)' : pass === 1 ? 'rgba(255,255,0,0.95)' : 'rgba(255,255,255,0.55)'; g.lineWidth = pass === 1 ? 2.2 : 1; g.stroke(); }
        g.lineJoin = 'round';
        for (const r of D.F.rivers) { g.beginPath(); r.line.forEach(([px, py], i) => (i ? g.lineTo(X(px), Y(py)) : g.moveTo(X(px), Y(py)))); g.strokeStyle = 'rgba(90,200,255,0.9)'; g.lineWidth = r.big ? 3 : 1.6; g.stroke();
          const m = r.line[(r.line.length / 2) | 0]; g.font = 'italic 11px sans-serif'; g.fillStyle = '#9fe0ff'; g.strokeStyle = '#000'; g.lineWidth = 2.5; g.strokeText(r.name, X(m[0]) + 4, Y(m[1]) - 4); g.fillText(r.name, X(m[0]) + 4, Y(m[1]) - 4); }
        for (const l of D.borderLines) { g.beginPath(); l.line.forEach(([px, py], i) => (i ? g.lineTo(X(px), Y(py)) : g.moveTo(X(px), Y(py)))); g.strokeStyle = 'rgba(255,60,60,0.9)'; g.setLineDash([6, 4]); g.lineWidth = 2; g.stroke(); g.setLineDash([]); }
        for (const p of D.provs) { const px = ((p.cx + 0.5) * CELL - OX) / S, py = ((p.cy + 0.5) * CELL - OY) / S; if (px < x - 5 || py < y - 5 || px > x + w + 5 || py > y + h + 5) continue;
          const wild = p.realm === 'unclaimed', cap = p.type === 'capital city';
          g.beginPath(); g.arc(X(px), Y(py), cap ? 5 : 3.2, 0, 6.3); g.fillStyle = wild ? '#888' : cap ? '#f22' : '#fff'; g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1; g.stroke();
          g.font = (cap ? 'bold ' : '') + '11px sans-serif'; g.lineWidth = 2.6; g.strokeStyle = 'rgba(0,0,0,0.9)'; const t = p.id + ' ' + p.name + (wild ? '' : ' [' + p.short + ']'); g.strokeText(t, X(px) + 6, Y(py) + 4); g.fillStyle = wild ? '#ccc' : '#fff'; g.fillText(t, X(px) + 6, Y(py) + 4); }
      }
      g.strokeStyle = 'rgba(255,255,255,0.28)'; g.fillStyle = '#ff0'; g.font = '11px sans-serif'; g.lineWidth = 1;
      const step = z >= 3 ? 20 : 50;
      for (let gx = Math.ceil(x / step) * step; gx < x + w; gx += step) { g.beginPath(); g.moveTo(X(gx), 0); g.lineTo(X(gx), h * z); g.stroke(); if (gx % (step === 20 ? 40 : 100) === 0) { g.strokeStyle = '#000'; g.lineWidth = 2.5; g.strokeText(String(gx), X(gx) + 2, 11); g.fillText(String(gx), X(gx) + 2, 11); g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 1; } }
      for (let gy = Math.ceil(y / step) * step; gy < y + h; gy += step) { g.beginPath(); g.moveTo(0, Y(gy)); g.lineTo(w * z, Y(gy)); g.stroke(); if (gy % (step === 20 ? 40 : 100) === 0) { g.strokeStyle = '#000'; g.lineWidth = 2.5; g.strokeText(String(gy), 2, Y(gy) - 2); g.fillText(String(gy), 2, Y(gy) - 2); g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 1; } }
    }, { D: { ...drawData, borderLines: F.borderLines, provs: drawData.provs.map(p => ({ ...p, short: p.realm === 'unclaimed' ? '' : LORE.realms[p.realm].short.slice(0, 4) })) }, x, y, w, h, z, plain: args.includes('--plain') });
    const file = path.join(cropDir, `crop-${x}_${y}_${w}_${h}${args.includes('--plain') ? '-plain' : ''}.png`);
    await (await pg.$('#c')).screenshot({ path: file }); say('crop ' + file);
  }
}
// the grid as pictures, one pixel a cell:
//   provinces.png  red + 256 * green = province id + 1 (0 on water); blue 0 land, 1 lake, 2 sea
//   ground.png     the ground word of each cell, in the colours of GROUND_RGB below (the index is also in the red channel's low nibble)
//   relief.png     the height guide: grey = 360 * height, height in the engine's measure (0 sea, 0.36 alpine, 0.5 snow)
//   land.png       the same grid to look at
const GROUND_RGB = [[32, 64, 112], [112, 176, 224], [240, 244, 248], [208, 216, 200], [160, 144, 128], [112, 152, 120], [128, 176, 112], [80, 168, 96], [208, 224, 160], [216, 200, 136], [232, 216, 120], [248, 224, 168], [176, 96, 80], [144, 200, 192]].map((c, i) => [(c[0] & 0xf0) | i, c[1], c[2]]);
await pg.evaluate(({ D, GROUND_RGB, elev }) => {
  const { GW, GH } = D, u8 = s => Uint8Array.from(atob(s), ch => ch.charCodeAt(0)), water = u8(D.water), prov = new Int16Array(u8(D.prov).buffer), ground = u8(D.ground), el = u8(elev);
  const mk = (id, fn) => { let c = document.getElementById(id); if (!c) { c = document.createElement('canvas'); c.id = id; document.body.appendChild(c); } c.width = GW; c.height = GH; const g = c.getContext('2d'), im = g.createImageData(GW, GH); for (let i = 0; i < GW * GH; i++) { const [r, gg, b] = fn(i); im.data[i * 4] = r; im.data[i * 4 + 1] = gg; im.data[i * 4 + 2] = b; im.data[i * 4 + 3] = 255; } g.putImageData(im, 0, 0); };
  mk('land', i => { const c = GROUND_RGB[ground[i]], sh = water[i] ? 1 : 1.06 - el[i] / 600; return [c[0] * sh, c[1] * sh, c[2] * sh]; });
  mk('provs', i => { const v = water[i] ? 0 : prov[i] + 1; return [v & 255, v >> 8, water[i] === 2 ? 1 : water[i] === 1 ? 2 : 0]; });
  mk('ground', i => GROUND_RGB[ground[i]]);
  mk('relief', i => [el[i], el[i], el[i]]);
}, { D: drawData, GROUND_RGB, elev: b64(Uint8Array.from(elevGuide, v => Math.round(v * 360))) });
for (const [id, name] of [['land', 'land.png'], ['provs', 'provinces.png'], ['ground', 'ground.png'], ['relief', 'relief.png']]) await (await pg.$('#' + id)).screenshot({ path: path.join(DIR, 'design', name) });
if (opt('debug', '')) { // working pictures: the cells' mean colour and the roughness
  fs.mkdirSync(opt('debug', ''), { recursive: true });
  await pg.evaluate(({ GW, GH, r, g, b, rug }) => { const u8 = s => Uint8Array.from(atob(s), ch => ch.charCodeAt(0)), R = u8(r), G = u8(g), B = u8(b), U = u8(rug);
    const mk = (id, fn) => { let c = document.getElementById(id); if (!c) { c = document.createElement('canvas'); c.id = id; document.body.appendChild(c); } c.width = GW; c.height = GH; const x = c.getContext('2d'), im = x.createImageData(GW, GH); for (let i = 0; i < GW * GH; i++) { const v = fn(i); im.data[i * 4] = v[0]; im.data[i * 4 + 1] = v[1]; im.data[i * 4 + 2] = v[2]; im.data[i * 4 + 3] = 255; } x.putImageData(im, 0, 0); };
    mk('mean', i => [R[i], G[i], B[i]]); mk('rug', i => [U[i], U[i], U[i]]); },
  { GW, GH, r: b64(Uint8Array.from(mR, Math.round)), g: b64(Uint8Array.from(mG, Math.round)), b: b64(Uint8Array.from(mB, Math.round)), rug: b64(Uint8Array.from(rug, v => Math.min(255, Math.round(v * 4)))) });
  for (const id of ['mean', 'rug']) await (await pg.$('#' + id)).screenshot({ path: path.join(opt('debug', ''), id + '.png') });
}
await b.close();

say(`land ${landCells} cells (${r1(100 * landCells / N)}% of the frame), continent ${mainland.n}, islands ${landC.list.length - 1}; carved ${edited.carved}, added ${edited.added}`);
for (const R of build.realms) say(`${R.name.padEnd(11)} ${String(R.provinces).padStart(2)} prov ${String(R.cells).padStart(6)} cells  coast ${R.coastal}  | ${R.neighbours.join(', ')}  | ${R.waters.join(', ')}`);
if (snapped.length) say('SNAPPED:\n  ' + snapped.join('\n  '));
if (notes.length) say('NOTES:\n  ' + notes.join('\n  '));
if (problems.length) { console.log('PROBLEMS:\n  ' + problems.join('\n  ')); process.exitCode = 1; } else say('checks: no realm enclosed, every realm one piece on its land, every water named');
