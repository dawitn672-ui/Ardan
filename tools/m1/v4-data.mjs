// M1, map version 4 (D-153, D-154): the designed continent as the game's data. Reads the design's built files
// (docs/design/m1/design/provinces.png, waters.png, ground.png, relief.png, build.json, all written by
// tools/m1/design-sketch.mjs) and writes data/map/v4.json, which the build puts on the page as A.DATA['map/v4'] and
// A.V2MAP.build reads for map version 4 (src/map/99991-v2-map/g-v4.core.js):
//   cells   the 700 x 450 grid, run-length coded: on land the province id + 1 (1..306); on water 1000 + the index of its
//           named water in `waters`, or 998 (an unnamed lake) or 999 (unnamed sea)
//   ground  the design's ground word of every cell (its index in `grounds`), run-length coded
//   relief  the height guide at half the grid (350 x 225), one byte a cell (grey = 360 x height, the engine's measure)
//   provinces, waters, rivers, ranges, peaks, passes, regions, roads, isles, ferries, realms: what the engine names and
//           places, in kilometres
// Run it after tools/m1/design-sketch.mjs; the test m1DesignIsTheMap reads the result against the design.
//   node tools/m1/v4-data.mjs [--dir=docs/design/m1/design] [--out=data/map/v4.json]
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const args = process.argv.slice(2), opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const DIR = path.resolve(opt('dir', 'docs/design/m1/design')), OUT = path.resolve(opt('out', 'data/map/v4.json'));

// the design tool's PNGs: 8-bit RGB, one IDAT, filter 0 on every row (it writes them so); anything else is refused
function readPng(file) {
  const b = fs.readFileSync(file); let o = 8, w = 0, h = 0; const idat = [];
  while (o < b.length) {
    const len = b.readUInt32BE(o), type = b.toString('ascii', o + 4, o + 8), data = b.subarray(o + 8, o + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); if (data[8] !== 8 || data[9] !== 2) throw new Error(file + ': not 8-bit RGB'); }
    if (type === 'IDAT') idat.push(data);
    o += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat)), px = new Uint8Array(w * h * 3);
  for (let y = 0; y < h; y++) { if (raw[y * (1 + w * 3)] !== 0) throw new Error(file + ': a filtered row'); raw.copy(px, y * w * 3, y * (1 + w * 3) + 1, (y + 1) * (1 + w * 3)); }
  return { w, h, px };
}
// run-length code: pairs of uint16 (value, count), base64
const rle = vals => { const out = []; for (let i = 0; i < vals.length;) { let j = i; while (j < vals.length && vals[j] === vals[i] && j - i < 65535) j++; out.push(vals[i], j - i); i = j; } return Buffer.from(Uint16Array.from(out).buffer).toString('base64'); };

const B = JSON.parse(fs.readFileSync(path.join(DIR, 'build.json'), 'utf8'));
const P = readPng(path.join(DIR, 'provinces.png')), Wt = readPng(path.join(DIR, 'waters.png')), G = readPng(path.join(DIR, 'ground.png')), R = readPng(path.join(DIR, 'relief.png'));
const gw = P.w, gh = P.h, N = gw * gh;
if (gw !== B.frame.gridW || gh !== B.frame.gridH) throw new Error('the grid is not the frame');
const cells = new Uint16Array(N), ground = new Uint16Array(N);
let land = 0;
for (let i = 0; i < N; i++) {
  const id = P.px[i * 3] + 256 * P.px[i * 3 + 1], blue = P.px[i * 3 + 2], wi = Wt.px[i * 3] + 256 * Wt.px[i * 3 + 1];
  if (id) { cells[i] = id; land++; } else cells[i] = wi ? 999 + wi : blue === 1 ? 998 : 999;
  ground[i] = G.px[i * 3] & 15;
}
// the relief at half the grid: the mean of each 2 x 2
const RW = Math.ceil(gw / 2), RH = Math.ceil(gh / 2), relief = new Uint8Array(RW * RH);
for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
  let s = 0, n = 0; for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const xx = 2 * x + dx, yy = 2 * y + dy; if (xx < gw && yy < gh) { s += R.px[(yy * gw + xx) * 3]; n++; } }
  relief[y * RW + x] = Math.round(s / n);
}
const r0 = v => Math.round(v);
const pts = list => list.map(([x, y]) => [r0(x), r0(y)]);
const D = {
  about: 'M1 map version 4 (D-153, D-154): the designed continent, from docs/design/m1/design by tools/m1/v4-data.mjs. Never edit: change the design and rerun.',
  gw, gh, cell: B.frame.cellKm, latTop: B.latitude.top, latBottom: B.latitude.bottom,
  grounds: B.ground.words,
  cells: rle(cells), ground: rle(ground), reliefW: RW, reliefH: RH, relief: Buffer.from(relief).toString('base64'),
  land,
  waters: B.waters.map(w => ({ name: w.name, kind: w.kind, enclosed: w.enclosed, coast: w.countsAsCoast, km: pts([w.km])[0] })),
  provinces: B.provinces.map(p => ({ id: p.id, realm: p.realm, sx: p.seat.xKm, sy: p.seat.yKm, terr: p.ground, sea: p.sea || [] })),
  realms: Object.fromEntries(B.realms.map(r => [r.id, { capital: r.capital.province }])),
  rivers: B.rivers.map(r => ({ name: r.name, to: r.to, big: !!r.big, ships: !!r.ships, border: !!r.border, km: pts(r.km) })),
  ranges: B.ranges.map(r => ({ name: r.name, km: pts(r.km) })),
  peaks: B.peaks.map(r => ({ name: r.name, km: pts([r.km])[0] })),
  passes: B.passes.map(r => ({ name: r.name, km: pts([r.km])[0] })),
  regions: B.regions.map(r => ({ name: r.name, km: pts([r.km])[0] })),
  roads: B.roads.map(r => ({ name: r.name, water: !!r.byWater, km: pts(r.km) })),
  isles: B.isles.map(r => ({ name: r.name, province: r.province, km: pts([r.km])[0] })),
  ferries: B.ferries.map(r => ({ name: r.name, a: r.a, b: r.b })),
};
const text = JSON.stringify(D);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, text + '\n');
console.log(`${path.relative(process.cwd(), OUT)}: ${gw} x ${gh}, ${land} land cells, ${D.provinces.length} provinces, ${D.waters.length} waters, ${D.rivers.length} rivers (${Math.round(text.length / 1024)} KB: cells ${Math.round(D.cells.length / 1024)}, ground ${Math.round(D.ground.length / 1024)}, relief ${Math.round(D.relief.length / 1024)})`);
