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
//   6. draws design-sketch.png (the clean map) and design-on-picture.png (the same lines over the owner's picture).
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
  return { W, H, cls: b64(cls), lum: b64(lum) };
}, picData);
const PW = pic.W, PH = pic.H, PN = PW * PH;
const cls = Uint8Array.from(Buffer.from(pic.cls, 'base64')), lum = Uint8Array.from(Buffer.from(pic.lum, 'base64'));

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
for (let cy = 0; cy < GH; cy++) for (let cx = 0; cx < GW; cx++) {
  let land = 0, lake = 0, tot = 0, lg = 0, ng = 0; const n = [0, 0, 0, 0, 0, 0, 0];
  for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) {
    const px = Math.floor(((cx + (sx + 0.5) / 3) * CELL - OX) / S), py = Math.floor(((cy + (sy + 0.5) / 3) * CELL - OY) / S); tot++;
    if (px < 0 || py < 0 || px >= PW || py >= PH) continue;
    const k = py * PW + px, v = keep[k];
    if (v === 1 || v === 2) { land++; n[cls[k]]++; if (cls[k] === 1) { lg += lum[k]; ng++; } } else if (v === 3) lake++;
  }
  const c = cy * GW + cx;
  water[c] = land >= 5 ? 0 : lake >= 4 ? 2 : 1;
  if (land) for (let i = 0; i < 7; i++) frac[i][c] = n[i] / land;
  lumG[c] = ng ? lg / ng : 0;
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
const edited = { carved: 0, opened: 0, added: 0, filled: 0 };
for (const e of F.edits.carveSea) cutLine(e.line, e.width, c => { if (water[c] !== 1) { water[c] = 1; edited.carved++; } });
for (const e of F.edits.openWater || []) cutLine(e.line, e.width, c => { if (water[c] === 0) { water[c] = 2; edited.opened++; } });
for (const e of F.edits.addLand) {
  const [ex, ey] = px2cellF([e.ellipse[0], e.ellipse[1]]), rx = e.ellipse[2] * S / CELL, ry = e.ellipse[3] * S / CELL;
  for (let yy = Math.floor(ey - ry); yy <= Math.ceil(ey + ry); yy++) for (let xx = Math.floor(ex - rx); xx <= Math.ceil(ex + rx); xx++) {
    // an island's outline, not an oval: the edge wobbles with a fixed pattern
    const a = Math.atan2(yy + 0.5 - ey, xx + 0.5 - ex), wob = 1 + 0.16 * Math.sin(3 * a + 1.3) + 0.1 * Math.sin(7 * a + 0.4);
    if (((xx + 0.5 - ex) / (rx * wob)) ** 2 + ((yy + 0.5 - ey) / (ry * wob)) ** 2 <= 1) { const c = yy * GW + xx; if (water[c]) { water[c] = 0; edited.added++; frac[6][c] = 0.5; frac[4][c] = 0.3; frac[1][c] = 0.2; } }
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
  cells.forEach((k, n) => { const j = src[n]; for (let i = 0; i < 7; i++) frac[i][k] = j >= 0 ? frac[i][j] : (i === 1 ? 1 : 0); lumG[k] = j >= 0 ? lumG[j] : 90; });
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
  // the sea: a many-source flood from each sea label
  const q = [], dist = new Int32Array(N).fill(1e9);
  W.forEach((w, i) => { if (lakeKinds.has(w.kind)) return; let c0 = labelCell(w);
    if (water[c0] !== 1) { let bd = 1e9, bk = -1; const x0 = c0 % GW, y0 = (c0 / GW) | 0; for (let yy = Math.max(0, y0 - 12); yy <= Math.min(GH - 1, y0 + 12); yy++) for (let xx = Math.max(0, x0 - 12); xx <= Math.min(GW - 1, x0 + 12); xx++) { const k = yy * GW + xx; if (water[k] === 1) { const d = Math.hypot(xx - x0, yy - y0); if (d < bd) { bd = d; bk = k; } } } c0 = bk; }
    w.found = c0 >= 0; if (c0 >= 0) { waterName[c0] = i; dist[c0] = 0; q.push(c0); } });
  for (let h = 0; h < q.length; h++) { const k = q[h]; for (const j of nb4(k)) if (j >= 0 && water[j] === 1 && dist[j] > dist[k] + 1) { dist[j] = dist[k] + 1; waterName[j] = waterName[k]; q.push(j); } }
  for (let c = 0; c < N; c++) if (water[c] === 1 && waterName[c] >= 0) waterCells[waterName[c]]++; }
const landC = components(landMask(), GW, GH, 1), mainland = landC.list.reduce((a, c) => (c.n > a.n ? c : a), landC.list[0]);
let landCells = 0; for (let c = 0; c < N; c++) if (!water[c]) landCells++;

// the ground's height guide from the picture's colours: snow highest, rock and brown high, sand and green low
const hRaw = new Float32Array(N);
for (let c = 0; c < N; c++) if (!water[c]) hRaw[c] = frac[4][c] * 1.0 + frac[6][c] * 0.6 + frac[3][c] * 0.5 + frac[5][c] * 0.62 + frac[2][c] * 0.16 + frac[1][c] * 0.1;
const blurLand = (a, r, passes) => { let cur = a; for (let p = 0; p < passes; p++) { const out = new Float32Array(N);
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const c = y * GW + x; if (water[c]) continue; let s = 0, m = 0;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= GW || yy >= GH) continue; const k = yy * GW + xx; if (water[k]) continue; s += cur[k]; m++; }
      out[c] = s / m; } cur = out; } return cur; };
const height = blurLand(hRaw, 2, 2);

// rivers and border lines on the grid
const riverAt = new Int16Array(N).fill(-1), barrier = new Float32Array(N);
F.rivers.forEach((r, i) => cutLine(r.line, 1, c => { if (!water[c]) { riverAt[c] = i; if (r.border) barrier[c] = Math.max(barrier[c], 7); } }));
for (const l of F.borderLines) cutLine(l.line, 1.2, c => { if (!water[c]) barrier[c] = Math.max(barrier[c], 26); });

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
      const nd = d + (dx && dy ? 1.4142 : 1) * (1 + 9 * hh * hh) + barrier[j];
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
// the ground word the picture gives each province (the engine will read its own from the built ground)
const latOf = cy => F.latitude.top + (F.latitude.bottom - F.latitude.top) * ((cy + 0.5) / GH);
for (const a of P) {
  const n = Math.max(1, a.cells), f = a.cls.map(v => v / n), h = a.h / n; a.hMean = h; a.lat = latOf(a.sy / n);
  const greenLum = a.nG ? a.lumG / a.nG : 0;
  a.ground = f[4] >= 0.3 ? (h >= 0.5 ? 'mountains' : 'tundra') : h >= 0.47 ? 'mountains' : f[2] >= 0.45 ? (a.lat > 39.5 ? 'steppe' : 'desert') : h >= 0.36 ? 'hills'
    : f[2] >= 0.22 ? (a.lat > 39.5 ? 'steppe' : 'desert') : greenLum && greenLum < 62 ? 'forest' : 'plains';
}
const realms = {};
for (const a of P) { const r = a.realm === 'unclaimed' ? 'wild:' + a.id : a.realm; (realms[r] = realms[r] || { id: r, name: a.realm === 'unclaimed' ? a.name : LORE.realms[a.realm].short, wild: a.realm === 'unclaimed', provs: [] }).provs.push(a); }
const realmOfProv = id => (P[id].realm === 'unclaimed' ? 'wild:' + id : P[id].realm);
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
const build = {
  about: 'Built by tools/m1/design-sketch.mjs from the owner\'s picture, design/seats.tsv and design/features.json. Cells are 10 km squares of the 700 x 450 grid; km are the game\'s frame.',
  frame: F.frame, transform: F.transform, latitude: F.latitude,
  land: { cells: landCells, share: r1(100 * landCells / N), mainland: mainland.n, islands: landC.list.length - 1, edits: edited },
  waters: W.map((w, i) => ({ name: w.name, kind: w.kind, cells: waterCells[i], km2: waterCells[i] * 100, note: w.note || undefined })),
  realms: Object.values(realms).filter(R => !R.wild).sort((x, y) => (x.id < y.id ? -1 : 1)).map(R => ({ id: R.id, name: R.name, provinces: R.provs.length, cells: R.cells, km2: R.cells * 100, coastal: R.coastal,
    waters: [...R.waters].sort(), neighbours: [...R.nb].map(n => realms[n].name).sort(), islands: R.islands })),
  wilds: Object.values(realms).filter(R => R.wild).map(R => ({ id: R.provs[0].id, name: R.name, cells: R.cells, km2: R.cells * 100, neighbours: [...R.nb].map(n => realms[n].name).sort() })),
  provinces: P.map(a => ({ id: a.id, name: a.name, realm: a.realm, type: a.type, seat: { px: a.px, py: a.py, xKm: a.cx * CELL + 5, yKm: a.cy * CELL + 5 }, cells: a.cells, coast: a.coast, lake: a.lake,
    waters: [...a.waters].sort(), rivers: [...a.river].sort(), ground: a.ground, height: r1(a.hMean), adj: [...a.adj].sort((x, y) => x - y), site: a.site })),
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
  L.push('', '## Checks', '', problems.length ? problems.map(p => '- PROBLEM: ' + p).join('\n') : '- No realm is enclosed by another, every realm is one piece on its land, every seat is on land.', notes.map(n => '- ' + n).join('\n'), snapped.map(n => '- ' + n).join('\n'));
  out('design/tables.md', L.join('\n') + '\n');
}

// ---------------------------------------------------------------- 6. the drawings
const realmList = Object.values(realms).filter(R => !R.wild).sort((x, y) => (x.id < y.id ? -1 : 1));
const realmIdx = new Int16Array(seats.length); P.forEach(a => { realmIdx[a.id] = a.realm === 'unclaimed' ? -1 : realmList.findIndex(R => R.id === a.realm); });
const b64 = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
const baseCol = new Uint8Array(N);     // the clean map's ground colour per cell
for (let c = 0; c < N; c++) { if (water[c]) continue; const f = i => frac[i][c], h = height[c];
  baseCol[c] = f(4) >= 0.3 ? 4 : f(5) >= 0.12 ? 5 : f(2) >= 0.4 ? 2 : h >= 0.42 ? 6 : h >= 0.3 ? 3 : lumG[c] && lumG[c] < 62 ? 1 : 0; }
const drawData = {
  GW, GH, K, PW, PH, S, OX, OY, CELL,
  water: b64(water), prov: b64(prov), height: b64(Uint8Array.from(height, v => Math.max(0, Math.min(255, Math.round(v * 255))))), base: b64(baseCol), keep: b64(keep),
  realmIdx: b64(realmIdx), realms: realmList.map(R => ({ name: R.name, id: R.id, cells: R.cells })),
  provs: P.map(a => ({ id: a.id, name: a.name, type: a.type, realm: a.realm, cx: a.cx, cy: a.cy, mx: a.cells ? a.sx / a.cells : a.cx, my: a.cells ? a.sy / a.cells : a.cy, cells: a.cells })),
  F: { waters: W.map(w => ({ name: w.name, kind: w.kind, at: w.at })), rivers: F.rivers, ranges: F.ranges, peaks: F.peaks, passes: F.passes, regions: F.regions, roads: F.roads, sealanes: F.sealanes, edits: F.edits, labels: F.labels || {} },
  capitals: LORE.realms ? Object.fromEntries(Object.values(LORE.realms).map(r => [r.id, r.capital])) : {},
};
await pg.setViewportSize({ width: GW * K + 40, height: GH * K + 40 });
for (const mode of ['sketch', 'picture']) {
  await pg.evaluate(({ D, mode }) => {
    const { GW, GH, K, PW, PH, S, OX, OY, CELL } = D, N = GW * GH, WPX = GW * K, HPX = GH * K;
    const u8 = s => Uint8Array.from(atob(s), ch => ch.charCodeAt(0));
    const water = u8(D.water), base = u8(D.base), hgt = u8(D.height), keep = u8(D.keep);
    const prov = new Int16Array(u8(D.prov).buffer), realmIdx = new Int16Array(u8(D.realmIdx).buffer);
    const c = document.getElementById('c'); c.width = WPX; c.height = HPX; const g = c.getContext('2d');
    const kmX = px => (OX + S * px) / CELL * K, kmY = py => (OY + S * py) / CELL * K;     // picture pixel -> canvas
    // ---- the ground
    if (mode === 'picture') {
      g.fillStyle = '#0d1f3f'; g.fillRect(0, 0, WPX, HPX);
      g.imageSmoothingQuality = 'high'; g.drawImage(window.PICTURE, kmX(0), kmY(0), kmX(PW) - kmX(0), kmY(PH) - kmY(0));
      g.fillStyle = 'rgba(10,20,40,0.18)'; g.fillRect(0, 0, WPX, HPX);
    } else {
      // the land's outline from the picture's own pixels (finer than the grid), the ground's colour from the grid
      const PAL = [[203, 214, 160], [150, 180, 118], [232, 211, 150], [196, 176, 132], [246, 246, 248], [172, 96, 78], [158, 146, 132]];
      const im = g.createImageData(WPX, HPX), d = im.data;
      const sample = (a, fx, fy) => { const x0 = Math.max(0, Math.min(GW - 1, Math.floor(fx - 0.5))), y0 = Math.max(0, Math.min(GH - 1, Math.floor(fy - 0.5))), x1 = Math.min(GW - 1, x0 + 1), y1 = Math.min(GH - 1, y0 + 1), tx = Math.max(0, Math.min(1, fx - 0.5 - x0)), ty = Math.max(0, Math.min(1, fy - 0.5 - y0));
        return (a[y0 * GW + x0] * (1 - tx) + a[y0 * GW + x1] * tx) * (1 - ty) + (a[y1 * GW + x0] * (1 - tx) + a[y1 * GW + x1] * tx) * ty; };
      for (let y = 0; y < HPX; y++) for (let x = 0; x < WPX; x++) {
        const fx = (x + 0.5) / K, fy = (y + 0.5) / K, cx = Math.min(GW - 1, fx | 0), cy = Math.min(GH - 1, fy | 0), cc = cy * GW + cx, k = (y * WPX + x) * 4;
        // the picture's pixel under this point
        const ppx = Math.floor((fx * CELL - OX) / S), ppy = Math.floor((fy * CELL - OY) / S), pk = ppx >= 0 && ppy >= 0 && ppx < PW && ppy < PH ? keep[ppy * PW + ppx] : 0;
        let land = water[cc] === 0, lake = water[cc] === 2;
        if (pk === 1 || pk === 2) { if (water[cc] !== 1 || true) land = water[cc] !== 1 || nearLand(cx, cy); } else if (pk === 3) { lake = water[cc] !== 1; land = false; } else if (land) land = nearSea(cx, cy) ? false : true;
        if (water[cc] === 1 && !(pk === 1 || pk === 2)) land = false;
        if (water[cc] === 1 && (pk === 1 || pk === 2) && !nearLand(cx, cy)) land = false;
        if (water[cc] === 0 && pk === 0 && !nearSea(cx, cy)) land = true;
        if (land) {
          const b = water[cc] === 0 ? base[cc] : baseNear(cx, cy), p = PAL[b], hh = sample(hgt, fx, fy) / 255;
          // a north-west light on the height guide
          const sl = (sample(hgt, fx - 0.8, fy - 0.8) - sample(hgt, fx + 0.8, fy + 0.8)) / 255, sh = 1 + Math.max(-0.22, Math.min(0.22, sl * 2.2)) - hh * 0.1;
          d[k] = Math.min(255, p[0] * sh); d[k + 1] = Math.min(255, p[1] * sh); d[k + 2] = Math.min(255, p[2] * sh);
        } else if (lake) { d[k] = 150; d[k + 1] = 196; d[k + 2] = 222; }
        else { const t = Math.min(1, coastDist(cx, cy) / 14); d[k] = 176 - 60 * t; d[k + 1] = 208 - 52 * t; d[k + 2] = 226 - 34 * t; }
        d[k + 3] = 255;
      }
      g.putImageData(im, 0, 0);
    }
    function nearLand(cx, cy) { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = cx + dx, y = cy + dy; if (x >= 0 && y >= 0 && x < GW && y < GH && water[y * GW + x] === 0) return true; } return false; }
    function nearSea(cx, cy) { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = cx + dx, y = cy + dy; if (x >= 0 && y >= 0 && x < GW && y < GH && water[y * GW + x] === 1) return true; } return false; }
    function baseNear(cx, cy) { for (let r = 1; r <= 2; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const x = cx + dx, y = cy + dy; if (x >= 0 && y >= 0 && x < GW && y < GH && water[y * GW + x] === 0) return base[y * GW + x]; } return 0; }
    function coastDist(cx, cy) { if (!coastDist.d) { const dd = new Int16Array(N).fill(999), q = []; for (let i = 0; i < N; i++) if (water[i] !== 1) { dd[i] = 0; q.push(i); } for (let h = 0; h < q.length; h++) { const i = q[h], x = i % GW; for (const j of [x > 0 ? i - 1 : -1, x < GW - 1 ? i + 1 : -1, i - GW, i + GW]) if (j >= 0 && j < N && dd[j] > dd[i] + 1) { dd[j] = dd[i] + 1; q.push(j); } } coastDist.d = dd; } return coastDist.d[cy * GW + cx]; }

    // ---- realms: a tint and smoothed borders, from the province grid drawn three times finer and settled by a vote
    const UP = 3, UW = GW * UP, UH = GH * UP;
    let rid = new Int16Array(UW * UH), pid = new Int16Array(UW * UH);
    for (let y = 0; y < UH; y++) for (let x = 0; x < UW; x++) { const cc = ((y / UP) | 0) * GW + ((x / UP) | 0), p = prov[cc]; pid[y * UW + x] = water[cc] ? -1 : p; rid[y * UW + x] = water[cc] || p < 0 ? -1 : (realmIdx[p] >= 0 ? realmIdx[p] : 1000 + p); }
    const vote = a => { const o = new Int16Array(a.length); for (let y = 0; y < UH; y++) for (let x = 0; x < UW; x++) { const k = y * UW + x; if (a[k] < 0) { o[k] = -1; continue; } const cnt = new Map(); let best = a[k], bn = 0;
          for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= UW || yy >= UH) continue; const v = a[yy * UW + xx]; if (v < 0) continue; const n = (cnt.get(v) || 0) + 1; cnt.set(v, n); if (n > bn || (n === bn && v === a[k])) { bn = n; best = v; } } o[k] = best; } return o; };
    rid = vote(vote(rid)); pid = vote(pid);
    // realm colours: spread round the wheel in an order that keeps neighbours apart
    const NR = D.realms.length, hue = i => (i * 137.508) % 360, lightOf = i => [58, 46, 66][i % 3], col = (i, a) => `hsla(${hue(i)},${mode === 'picture' ? 85 : 58}%,${lightOf(i)}%,${a})`;
    const ov = document.createElement('canvas'); ov.width = UW; ov.height = UH; const og = ov.getContext('2d'), oi = og.createImageData(UW, UH), od = oi.data;
    const hsl = (h, s, l) => { s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return [255 * f(0), 255 * f(8), 255 * f(4)]; };
    const RC = D.realms.map((r, i) => hsl(hue(i), mode === 'picture' ? 85 : 58, lightOf(i)));
    for (let y = 0; y < UH; y++) for (let x = 0; x < UW; x++) { const k = y * UW + x, r = rid[k], o = k * 4; if (r < 0) continue;
      const edge = (x > 0 && rid[k - 1] !== r && rid[k - 1] >= 0) || (x < UW - 1 && rid[k + 1] !== r && rid[k + 1] >= 0) || (y > 0 && rid[k - UW] !== r && rid[k - UW] >= 0) || (y < UH - 1 && rid[k + UW] !== r && rid[k + UW] >= 0);
      const pedge = !edge && ((x > 0 && pid[k - 1] !== pid[k] && pid[k - 1] >= 0) || (y > 0 && pid[k - UW] !== pid[k] && pid[k - UW] >= 0));
      if (edge) { od[o] = mode === 'picture' ? 255 : 70; od[o + 1] = mode === 'picture' ? 240 : 24; od[o + 2] = mode === 'picture' ? 200 : 24; od[o + 3] = 255; }
      else if (r < 1000) { const cc = RC[r]; od[o] = cc[0]; od[o + 1] = cc[1]; od[o + 2] = cc[2]; od[o + 3] = pedge ? (mode === 'picture' ? 150 : 190) : (mode === 'picture' ? 62 : 118); if (pedge) { od[o] *= 0.55; od[o + 1] *= 0.55; od[o + 2] *= 0.55; } }
      else { od[o] = 90; od[o + 1] = 90; od[o + 2] = 90; od[o + 3] = pedge ? 110 : (mode === 'picture' ? 0 : 26); } }
    og.putImageData(oi, 0, 0); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(ov, 0, 0, WPX, HPX);

    // ---- rivers, roads, sea lanes
    const path = (line, close) => { g.beginPath(); line.forEach(([x, y], i) => (i ? g.lineTo(kmX(x), kmY(y)) : g.moveTo(kmX(x), kmY(y)))); if (close) g.closePath(); };
    const smooth = line => { let p = line; for (let it = 0; it < 2; it++) { const q = [p[0]]; for (let i = 0; i + 1 < p.length; i++) { const [ax, ay] = p[i], [bx, by] = p[i + 1]; q.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]); } q.push(p[p.length - 1]); p = q; } return p; };
    g.lineJoin = 'round'; g.lineCap = 'round';
    if (mode === 'sketch') { g.setLineDash([K * 2.2, K * 1.6]); for (const s of D.F.sealanes) { path(smooth(s.line)); g.strokeStyle = 'rgba(60,90,140,0.55)'; g.lineWidth = K * 0.45; g.stroke(); } g.setLineDash([]); }
    for (const r of D.F.rivers) { path(smooth(r.line)); g.strokeStyle = mode === 'picture' ? 'rgba(120,200,255,0.9)' : '#3f86c2'; g.lineWidth = K * (r.channel ? 1.5 : r.big ? 0.95 : 0.6); g.stroke(); }
    if (mode === 'sketch') for (const r of D.F.roads) { if (r.water) continue; path(smooth(r.line)); g.strokeStyle = 'rgba(255,250,235,0.9)'; g.lineWidth = K * 0.9; g.stroke(); path(smooth(r.line)); g.strokeStyle = '#a0522d'; g.lineWidth = K * 0.4; g.stroke(); }

    // ---- words
    const text = (s, x, y, o) => { g.font = `${o.italic ? 'italic ' : ''}${o.bold ? 'bold ' : ''}${o.size}px ${o.face || 'Georgia, "DejaVu Serif", serif'}`; g.textAlign = o.align || 'center'; g.textBaseline = 'middle';
      if (o.space) { try { g.letterSpacing = o.space + 'px'; } catch (e) {} } else { try { g.letterSpacing = '0px'; } catch (e) {} }
      if (o.rot) { g.save(); g.translate(x, y); g.rotate(o.rot); x = 0; y = 0; }
      g.lineWidth = o.halo == null ? 3 : o.halo; g.strokeStyle = o.haloCol || 'rgba(255,255,255,0.85)'; if (g.lineWidth) g.strokeText(s, x, y); g.fillStyle = o.col || '#222'; g.fillText(s, x, y);
      if (o.rot) g.restore(); };
    const dark = mode === 'picture';
    for (const r of D.F.regions) if (r.size === 3) text(r.name, kmX(r.at[0]), kmY(r.at[1]), { size: K * 6.2, col: dark ? 'rgba(255,255,255,0.5)' : 'rgba(60,40,20,0.3)', halo: 0, space: K * 3 });
    for (const w of D.F.waters) { const big = w.kind === 'ocean'; text(w.name, kmX(w.at[0]), kmY(w.at[1]), { size: big ? K * 4.4 : K * 2.9, italic: true, col: dark ? '#d8ecff' : '#1f4f86', haloCol: dark ? 'rgba(0,10,40,0.75)' : 'rgba(235,245,255,0.8)', halo: big ? 0 : 3, space: big ? K * 1.5 : 0 }); }
    for (const r of D.F.ranges) { const a = r.line[0], z = r.line[r.line.length - 1], m = r.line[(r.line.length / 2) | 0]; let rot = Math.atan2(kmY(z[1]) - kmY(a[1]), kmX(z[0]) - kmX(a[0])); if (rot > Math.PI / 2) rot -= Math.PI; if (rot < -Math.PI / 2) rot += Math.PI;
      text(r.name.toUpperCase(), kmX(m[0]), kmY(m[1]), { size: K * 2.5, col: dark ? '#ffe9c4' : '#5a3d1e', haloCol: dark ? 'rgba(20,10,0,0.7)' : 'rgba(255,250,240,0.75)', rot, space: K * 0.9 }); }
    for (const r of D.F.regions) if (r.size < 3) text(r.name, kmX(r.at[0]), kmY(r.at[1]), { size: r.size === 2 ? K * 3.1 : K * 2.5, italic: true, col: dark ? '#f4f0d8' : '#4b4b2a', haloCol: dark ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,245,0.7)' });
    for (const p of D.F.peaks) { const x = kmX(p.at[0]), y = kmY(p.at[1]); g.beginPath(); g.moveTo(x, y - K * 1.5); g.lineTo(x + K * 1.3, y + K); g.lineTo(x - K * 1.3, y + K); g.closePath(); g.fillStyle = dark ? '#fff' : '#5a3d1e'; g.fill(); text(p.name, x + K * 1.8, y, { size: K * 2.2, align: 'left', col: dark ? '#fff' : '#5a3d1e', haloCol: dark ? 'rgba(0,0,0,0.7)' : 'rgba(255,250,240,0.8)' }); }
    if (mode === 'sketch') for (const p of D.F.passes) { const x = kmX(p.at[0]), y = kmY(p.at[1]); g.strokeStyle = '#5a3d1e'; g.lineWidth = K * 0.35; g.beginPath(); g.moveTo(x - K, y - K * 0.9); g.lineTo(x - K * 0.3, y); g.lineTo(x - K, y + K * 0.9); g.moveTo(x + K, y - K * 0.9); g.lineTo(x + K * 0.3, y); g.lineTo(x + K, y + K * 0.9); g.stroke(); }
    // towns: every seat a dot, cities a ring, capitals a star with the realm's name
    const lab = D.F.labels;
    for (const p of D.provs) { const x = (p.cx + 0.5) * K, y = (p.cy + 0.5) * K, cap = p.type === 'capital city', city = p.type === 'city';
      if (p.realm === 'unclaimed') continue;
      g.beginPath(); g.arc(x, y, cap ? K * 1.25 : city ? K * 0.8 : K * 0.5, 0, 6.3); g.fillStyle = cap ? '#b0101a' : dark ? '#fff' : '#333'; g.fill(); g.lineWidth = K * 0.3; g.strokeStyle = dark ? '#000' : '#fff'; g.stroke(); }
    for (const p of D.provs) { if (p.type !== 'capital city') continue; const o = (lab.capital || {})[p.name] || [0, -2.6];
      text(p.name, (p.cx + 0.5) * K + o[0] * K, (p.cy + 0.5) * K + o[1] * K, { size: K * 2.5, col: dark ? '#fff' : '#3a0d0d', haloCol: dark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)' }); }
    // realm names at the middle of their land (or where features.json puts them)
    const mid = D.realms.map(() => [0, 0, 0]); for (const p of D.provs) { const i = D.realms.findIndex(r => r.id === p.realm); if (i >= 0) { mid[i][0] += p.mx * p.cells; mid[i][1] += p.my * p.cells; mid[i][2] += p.cells; } }
    D.realms.forEach((r, i) => { const o = (lab.realm || {})[r.name], x = o ? kmX(o[0]) : (mid[i][0] / mid[i][2] + 0.5) * K, y = o ? kmY(o[1]) : (mid[i][1] / mid[i][2] + 0.5) * K, big = r.cells > 3000, small = r.cells < 900;
      text(r.name.toUpperCase(), x, y, { size: big ? K * 4.2 : small ? K * 2.9 : K * 3.4, bold: true, col: dark ? '#fff' : '#111', haloCol: dark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)', halo: 4, space: big ? K * 1.2 : K * 0.4 }); });
    for (const p of D.provs) { if (p.realm !== 'unclaimed') continue; const o = (lab.wild || {})[p.name]; if (o === false) continue; const x = o ? kmX(o[0]) : (p.mx + 0.5) * K, y = o ? kmY(o[1]) : (p.my + 0.5) * K; if (D.F.regions.some(r => r.name.toLowerCase() === p.name.replace(/^The /, 'the ').toLowerCase())) continue;
      text(p.name.replace(/^The /, 'the '), x, y, { size: K * 2.4, italic: true, col: dark ? '#eee' : '#555', haloCol: dark ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.7)' }); }
    // the frame's furniture: title, scale, north
    const pad = K * 5;
    text(mode === 'picture' ? 'ARDAN: the design laid on the owner\'s picture' : 'ARDAN: the one continent (design sketch, map version 4)', pad, pad + K * 2, { size: K * 4.6, bold: true, align: 'left', col: dark ? '#fff' : '#1b1b1b', haloCol: dark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)', halo: 4 });
    text('realm borders dark, provinces faint; red dots are capitals; rivers blue, great roads brown, sea lanes dashed. 700 x 450 cells of 10 km.', pad, pad + K * 7, { size: K * 2.3, align: 'left', col: dark ? '#eee' : '#333', haloCol: dark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)' });
    const sx = pad, sy = HPX - pad * 1.6, per = K / CELL; g.fillStyle = dark ? '#fff' : '#222'; g.fillRect(sx, sy, 2000 * per, K * 0.6);
    for (const km of [0, 500, 1000, 1500, 2000]) { g.fillRect(sx + km * per - K * 0.15, sy - K, K * 0.3, K * 1.6); text(km ? km.toLocaleString('en') + (km === 2000 ? ' km' : '') : '0', sx + km * per, sy - K * 2.6, { size: K * 2.4, col: dark ? '#fff' : '#222', haloCol: dark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)' }); }
    const nx = WPX - pad * 2, ny = pad * 2.4; g.beginPath(); g.moveTo(nx, ny - K * 5); g.lineTo(nx + K * 1.6, ny + K * 2); g.lineTo(nx, ny + K); g.lineTo(nx - K * 1.6, ny + K * 2); g.closePath(); g.fillStyle = dark ? '#fff' : '#222'; g.fill(); text('N', nx, ny - K * 7, { size: K * 3.2, bold: true, col: dark ? '#fff' : '#222', haloCol: dark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)' });
  }, { D: drawData, mode });
  const file = path.join(DIR, mode === 'sketch' ? 'design-sketch.png' : 'design-on-picture.png');
  await (await pg.$('#c')).screenshot({ path: file });
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
// the grid as pictures: land.png to look at, provinces.png to read (red + 256 * green = province id + 1; blue 1 lake, 2 sea)
await pg.evaluate(({ D }) => {
  const { GW, GH } = D, u8 = s => Uint8Array.from(atob(s), ch => ch.charCodeAt(0)), water = u8(D.water), prov = new Int16Array(u8(D.prov).buffer), base = u8(D.base);
  const mk = (id, fn) => { let c = document.getElementById(id); if (!c) { c = document.createElement('canvas'); c.id = id; document.body.appendChild(c); } c.width = GW; c.height = GH; const g = c.getContext('2d'), im = g.createImageData(GW, GH); for (let i = 0; i < GW * GH; i++) { const [r, gg, b] = fn(i); im.data[i * 4] = r; im.data[i * 4 + 1] = gg; im.data[i * 4 + 2] = b; im.data[i * 4 + 3] = 255; } g.putImageData(im, 0, 0); };
  const PAL = [[203, 214, 160], [150, 180, 118], [232, 211, 150], [196, 176, 132], [246, 246, 248], [172, 96, 78], [158, 146, 132]];
  mk('land', i => (water[i] === 1 ? [26, 58, 110] : water[i] === 2 ? [120, 180, 220] : PAL[base[i]]));
  mk('provs', i => { const v = water[i] ? 0 : prov[i] + 1; return [v & 255, v >> 8, water[i] === 2 ? 1 : water[i] === 1 ? 2 : 0]; });
}, { D: drawData });
await (await pg.$('#land')).screenshot({ path: path.join(DIR, 'design/land.png') });
await (await pg.$('#provs')).screenshot({ path: path.join(DIR, 'design/provinces.png') });
await b.close();

say(`land ${landCells} cells (${r1(100 * landCells / N)}% of the frame), continent ${mainland.n}, islands ${landC.list.length - 1}; carved ${edited.carved}, added ${edited.added}`);
for (const R of build.realms) say(`${R.name.padEnd(11)} ${String(R.provinces).padStart(2)} prov ${String(R.cells).padStart(6)} cells  coast ${R.coastal}  | ${R.neighbours.join(', ')}  | ${R.waters.join(', ')}`);
if (snapped.length) say('SNAPPED:\n  ' + snapped.join('\n  '));
if (notes.length) say('NOTES:\n  ' + notes.join('\n  '));
if (problems.length) { console.log('PROBLEMS:\n  ' + problems.join('\n  ')); process.exitCode = 1; } else say('checks: no realm enclosed, every realm one piece on its land, every water named');
